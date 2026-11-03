"""t23 pozlama eğrisinin ölçülerek tasarımı (C turu, brief §11.1-2). Blender'ın Python'unda çalışır
(PyOpenColorIO + OpenImageIO + numpy, GPU yok):

    <blender>/5.2/python/bin/python.exe poz_egri.py <önizleme kökü> [--taban 23] [--yuk 2.0]

Girdi: sahne.py --exr ile render edilmiş t23 önizlemesi (<kök>/t23/k_####.exr doğrusal, pozlamasız; k_####.png;
<kök>/t23.json irtifalar; <kök>/olcum.jsonl karelerin pozlaması). Adımlar:
1. Doğrulama: EXR × 2^EV → AgX + "AgX - Punchy" (sRGB) = Blender PNG'si (ortalama mutlak fark /255).
2. Her kare için luma(EV) tablosu (luma: kodlanmış R'G'B' Rec.709 ağırlıklı ortalama, %).
3. Hedef: kare ≤ 14 pozlama 1,3 (l2 ile aynı); doğal luma TABAN'ın altına inen karelerde ve kare 26–36'da luma = TABAN;
   kare 36–40 TABAN → TABAN + YUK (azalan yönde en çok YUK yükseliş, ölçüt ±3); kare 40–46 pozlama 0,3'e doğrusal.
4. Düğümler (irtifa km, k = (EV − 0,3) / 1,0) → sahne.py POZ_EGRI (Fritsch–Carlson, ln irtifa).
"""
import argparse
import json
import math
import os

import numpy as np
import OpenImageIO as oiio
import PyOpenColorIO as O

CFG = os.path.join(os.path.dirname(os.__file__), "..", "..", "datafiles", "colormanagement", "config.ocio")
ap = argparse.ArgumentParser()
ap.add_argument("kok")
ap.add_argument("--taban", type=float, default=23.0)
ap.add_argument("--yuk", type=float, default=2.0)
a = ap.parse_args()

cfg = O.Config.CreateFromFile(os.path.normpath(CFG))
vp = O.LegacyViewingPipeline()
vp.setDisplayViewTransform(O.DisplayViewTransform(src="Linear Rec.709", display="sRGB", view="AgX"))
vp.setLooksOverrideEnabled(True)
vp.setLooksOverride("AgX - Punchy")
proc = vp.getProcessor(cfg).getDefaultCPUProcessor()


def oku(p):
    i = oiio.ImageInput.open(p); x = i.read_image(format="float"); i.close()
    return np.ascontiguousarray(x[..., :3], dtype=np.float32)


def gorunum(lin, ev):
    x = np.ascontiguousarray(lin * (2.0 ** ev), dtype=np.float32)
    proc.applyRGB(x)
    return np.clip(x, 0, 1)


def luma(x):
    return float((0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2]).mean() * 100)


kok = os.path.join(a.kok, "t23")
poz = {}
for ln in open(os.path.join(a.kok, "olcum.jsonl"), encoding="utf-8"):
    o = json.loads(ln)
    if o.get("klip") == "t23" and "pozlama" in o:
        poz[o["kare"]] = o["pozlama"]
IRT = [k["irtifa_m"] for k in json.load(open(os.path.join(a.kok, "t23.json"), encoding="utf-8"))["kamera"]["kareler"]]
EV = np.round(np.arange(-0.5, 3.51, 0.05), 3)
TAB, dog = {}, {}
for f in sorted(poz):
    e = os.path.join(kok, f"k_{f:04d}.exr")
    if f > 60 or not os.path.exists(e):
        continue
    lin = oku(e)
    if f % 10 == 0:
        g = gorunum(lin, poz[f]); r = oku(os.path.join(kok, f"k_{f:04d}.png"))
        dog[f] = round(float(np.abs(g - r).mean() * 255), 4)
    TAB[f] = np.array([luma(gorunum(lin[::2, ::2], ev)) for ev in EV])
print("doğrulama (OCIO ↔ PNG, ort. mutlak fark /255):", dog)


def L(f, ev):
    return float(np.interp(ev, EV, TAB[f]))


def Einv(f, l):
    return float(np.interp(l, TAB[f], EV))


dug = {}
for f in sorted(TAB):
    if f <= 14:
        e = 1.3
    elif f <= 24:
        e = Einv(f, a.taban) if L(f, 1.3) < a.taban else 1.3
    elif f <= 36:
        e = Einv(f, a.taban)
    elif f <= 40:
        e = Einv(f, a.taban + a.yuk * (f - 36) / 4)
    elif f <= 46:
        e40 = Einv(40, a.taban + a.yuk)
        e = e40 + (0.3 - e40) * (f - 40) / 6
    else:
        e = 0.3
    dug[f] = e
fs = sorted(dug)
print("kare  irtifa_km  EV  öngörülen_luma")
for f in fs:
    print(f"{f:3d} {IRT[f] / 1000:10.3f} {dug[f]:6.3f} {L(f, dug[f]):6.2f}")
# sahne.py tablosu: irtifa artan; uçlarda yinelenen değerler atılır (eğri dışında kıskaç)
satir = sorted(((IRT[f] / 1000, dug[f] - 0.3) for f in fs if 14 <= f <= 46), key=lambda x: x[0])
print("POZ_EGRI = [" + ", ".join(f"({x:.2f}, {k:.3f})" for x, k in satir) + "]")
json.dump({"taban": a.taban, "yuk": a.yuk, "dogrulama": dog, "dugum": [[round(IRT[f] / 1000, 3), round(dug[f], 4), round(L(f, dug[f]), 3)] for f in fs],
           "ev": EV.tolist(), "tablo": {f: [round(v, 3) for v in TAB[f]] for f in TAB}},
          open(os.path.join(a.kok, "poz_egri.json"), "w", encoding="utf-8"), indent=1)
