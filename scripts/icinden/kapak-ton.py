# /icinden v3 — d6 kapak ton eşlemesi: render'daki kapak (t56 son karesi) ↔ DOM kapak (kapak-dom-sirtsiz.png).
#
# d5→d6'da video kapağı DOM kapağa 200 ms'de kesişir, sonra DOM 420 ms'de okuma boyutuna FLIP'lenir. Render'ın
# ışığı ve AgX tonu kâğıdı griye, maviyi soluğa çeker (S2 A turu: kâğıt #DED8D4, mavi #4D87B6 ↔ doku #FFFFFF,
# #175EA6). Site DOM kapağa CSS filtresiyle aynı tonu verip FLIP boyunca kimliğe indirir (VideoSahne.tsx tonYaz).
# Bu betik o filtrenin parametrelerini bulur: saturate(s) contrast(c) brightness(b) sepia(p), sRGB'de (tarayıcılar
# CSS filtre işlevlerini sRGB değerlerinde uygular), en küçük kareler.
#
#   python -X utf8 -P scripts/icinden/kapak-ton.py --kare <render-son/t56/k_0059.png> --fragman <render-son/t56.json>
#        [--dom D:/soft/cop31-varlik/s2/doku/kapak-dom-sirtsiz.png] --cikti D:/soft/cop31-varlik/kodlama/render-son-kapak-ton.json
#   python -X utf8 -P scripts/icinden/kapak-ton.py --cift FFFFFF=DED8D4,1266AB=4D87B6 --cikti <json>
#
# Görüntü kipi: fragmanın `brosur_dikdortgen`'i (master px; dönüklük ~0) karede kırpılır, DOM görüntüsüyle aynı
# 34×48 ızgaraya küçültülür (kenardan 2 hücre dışarıda), her hücre bir renk çifti. Kare boyutu master'dan farklıysa
# (960² önizleme) dikdörtgen oranla ölçeklenir. Çıktı manifest-birlestir.mjs `--ton` ile d6 `ozel.kapakTon` olur.
import argparse
import json
import sys

import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("--kare")
ap.add_argument("--fragman")
ap.add_argument("--dom", default="D:/soft/cop31-varlik/s2/doku/kapak-dom-sirtsiz.png")
ap.add_argument("--cift")
ap.add_argument("--cikti", required=True)
a = ap.parse_args()

SEP = np.array([[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]])


def sat(s):
    return np.array([
        [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
        [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
        [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
    ])


def uygula(x, s, c, b, p):
    """x: (N, 3) sRGB 0–1. CSS sırası: saturate → contrast → brightness → sepia."""
    x = np.clip(x @ sat(s).T, 0, 1)
    x = np.clip((x - 0.5) * c + 0.5, 0, 1)
    x = np.clip(x * b, 0, 1)
    x = np.clip(x @ ((1 - p) * np.eye(3) + p * SEP).T, 0, 1)
    return x


def hex3(h):
    h = h.strip().lstrip("#")
    return [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]


if a.cift:
    ciftler = [c.split("=") for c in a.cift.split(",")]
    kaynak = np.array([hex3(x) for x, _ in ciftler])
    hedef = np.array([hex3(y) for _, y in ciftler])
    agirlik = np.ones(len(kaynak))
    tanim = f"renk çiftleri {a.cift}"
else:
    fr = json.load(open(a.fragman, encoding="utf8"))
    q = np.array(fr["brosur_dikdortgen"], dtype=float)
    kare = Image.open(a.kare).convert("RGB")
    olcek = kare.width / 1920
    x0, y0 = q[:, 0].min() * olcek, q[:, 1].min() * olcek
    x1, y1 = q[:, 0].max() * olcek, q[:, 1].max() * olcek
    G, Y = 34, 48
    r = np.asarray(kare.crop((round(x0), round(y0), round(x1), round(y1))).resize((G, Y), Image.Resampling.BOX), dtype=float) / 255
    dom = np.asarray(Image.open(a.dom).convert("RGB").resize((G, Y), Image.Resampling.BOX), dtype=float) / 255
    r, dom = r[2:-2, 2:-2].reshape(-1, 3), dom[2:-2, 2:-2].reshape(-1, 3)
    kaynak, hedef = dom, r
    agirlik = np.ones(len(kaynak))
    oran_r = (x1 - x0) / (y1 - y0)
    tanim = f"{a.kare} dikdörtgen ({x0:.0f},{y0:.0f})–({x1:.0f},{y1:.0f}) oran {oran_r:.3f} ↔ {a.dom}"
    if abs(oran_r - 0.7083) > 0.03:
        print(f"UYARI: render kapak oranı {oran_r:.3f}, DOM 0,708 — doku farklı olabilir; sonuç güvenilmez", file=sys.stderr)


def hata(prm):
    d = uygula(kaynak, *prm) - hedef
    return float(np.sqrt((agirlik[:, None] * d * d).sum() / agirlik.sum() / 3))


# kaba ızgara + yerel inceltme
en = None
for s in np.arange(0.4, 2.01, 0.1):
    for c in np.arange(0.3, 1.21, 0.05):
        for b in np.arange(0.6, 1.41, 0.05):
            for p in np.arange(0, 0.41, 0.05):
                h = hata((s, c, b, p))
                if en is None or h < en[0]:
                    en = (h, [s, c, b, p])
adim = [0.05, 0.025, 0.025, 0.025]
for _ in range(6):
    iyilesti = True
    while iyilesti:
        iyilesti = False
        for i in range(4):
            for y in (-1, 1):
                prm = list(en[1])
                prm[i] = max(0.0, prm[i] + y * adim[i])
                h = hata(prm)
                if h < en[0] - 1e-7:
                    en = (h, prm)
                    iyilesti = True
    adim = [x / 2 for x in adim]

s, c, b, p = en[1]
sonuc = {
    "saturate": round(s, 3),
    "contrast": round(c, 3),
    "brightness": round(b, 3),
    "sepia": round(p, 3),
    "rms_255": round(en[0] * 255, 2),
    "kimlik_rms_255": round(hata((1, 1, 1, 0)) * 255, 2),
    "kaynak": tanim,
}
json.dump(sonuc, open(a.cikti, "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(json.dumps(sonuc, ensure_ascii=False))
