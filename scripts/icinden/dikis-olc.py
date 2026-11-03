# /icinden v3 — kodlanmış set doğrulaması (docs/brief-icinden-3.md §9.4): dikişler ve döngü kapanışı.
#
#   python -X utf8 -P scripts/icinden/dikis-olc.py [--liste D:/soft/cop31-varlik/kodlama/render-son.json]
#        [--kodek h264] [--cikti .qa/icinden3/dikis.json]
#
# 1. Her ileri geçişin kodlanmış SON karesi ↔ hedef durağın posteri (WebP, döngünün 0. karesi) ve döngünün
#    kodlanmış 0. karesi: ortalama ΔE00 (hedef ≤ 3) ve ortalama mutlak fark (/255).
# 2. Döngü kapanışı: son→ilk kare farkı ↔ ardışık kare farkı ortalaması (eşit olmalı).
# 3. t34 iç dikişi (S1 kare 47 ↔ S2 kare 48): fark ↔ komşu kare farkları.
# Kod çözme ffmpeg ile (renk matrisi dosyadaki BT.709 etiketinden), rgb24.
import argparse
import json
import subprocess
from pathlib import Path

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--liste", default="D:/soft/cop31-varlik/kodlama/render-son.json")
ap.add_argument("--kodek", default="h264")
ap.add_argument("--cikti", default=".qa/icinden3/dikis.json")
a = ap.parse_args()
liste = json.load(open(a.liste, encoding="utf8"))


def kareler(yol):
    """Bütün kareler (N, H, W, 3) uint8."""
    p = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", yol], capture_output=True, text=True)
    w, h = map(int, p.stdout.strip().split(","))
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", yol, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    return np.frombuffer(r.stdout, np.uint8).reshape(-1, h, w, 3)


def resim(yol):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", yol, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    p = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", yol], capture_output=True, text=True)
    w, h = map(int, p.stdout.strip().split(",")[:2])
    return np.frombuffer(r.stdout, np.uint8).reshape(h, w, 3)


def lab(rgb):
    c = rgb.astype(np.float64) / 255
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def de2000(l1, l2):
    L1, a1, b1 = np.moveaxis(l1, -1, 0)
    L2, a2, b2 = np.moveaxis(l2, -1, 0)
    C1, C2 = np.hypot(a1, b1), np.hypot(a2, b2)
    Cm = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cm**7 / (Cm**7 + 25**7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = np.hypot(a1p, b1), np.hypot(a2p, b2)
    h1p = np.degrees(np.arctan2(b1, a1p)) % 360
    h2p = np.degrees(np.arctan2(b2, a2p)) % 360
    dLp, dCp = L2 - L1, C2p - C1p
    dh = h2p - h1p
    dh = np.where(dh > 180, dh - 360, np.where(dh < -180, dh + 360, dh))
    dh = np.where(C1p * C2p == 0, 0, dh)
    dHp = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dh / 2))
    Lpm, Cpm = (L1 + L2) / 2, (C1p + C2p) / 2
    hs = h1p + h2p
    hpm = np.where(C1p * C2p == 0, hs, np.where(np.abs(h1p - h2p) <= 180, hs / 2, np.where(hs < 360, (hs + 360) / 2, (hs - 360) / 2)))
    T = 1 - 0.17 * np.cos(np.radians(hpm - 30)) + 0.24 * np.cos(np.radians(2 * hpm)) + 0.32 * np.cos(np.radians(3 * hpm + 6)) - 0.20 * np.cos(np.radians(4 * hpm - 63))
    Sl = 1 + 0.015 * (Lpm - 50) ** 2 / np.sqrt(20 + (Lpm - 50) ** 2)
    Sc, Sh = 1 + 0.045 * Cpm, 1 + 0.015 * Cpm * T
    Rt = -2 * np.sqrt(Cpm**7 / (Cpm**7 + 25**7)) * np.sin(np.radians(60 * np.exp(-(((hpm - 275) / 25) ** 2))))
    return np.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh))


def fark(x, y):
    return float(np.abs(x.astype(np.int16) - y.astype(np.int16)).mean())


def bul(klip, tur, boyut, kodek=None):
    for s in liste:
        if s["klip"] == klip and s["tur"] == tur and s["boyut"] == boyut and (kodek is None or s["kodek"] == kodek):
            return s["yol"]
    return None


sonuc = {"gecis": [], "dongu": [], "t34": []}
HEDEF = {"t01": "1", "t12": "2", "t23": "3", "t34": "4", "t45": "5", "t56": "6"}
for boyut in ("dikey", "yatay"):
    for t, n in HEDEF.items():
        v = bul(t, "ileri", boyut, a.kodek)
        p = bul(f"p{n}", "poster", boyut)
        if not v or not p:
            continue
        K = kareler(v)
        son = K[-1]
        P = resim(p)
        satir = {"boyut": boyut, "gecis": t, "poster": f"p{n}", "dE00_poster": round(float(de2000(lab(son), lab(P)).mean()), 2), "fark_poster": round(fark(son, P), 2)}
        lv = bul(f"l{n}", "dongu", boyut, a.kodek)
        if lv:
            L0 = kareler(lv)
            satir["dE00_dongu0"] = round(float(de2000(lab(son), lab(L0[0])).mean()), 2)
            satir["fark_dongu0"] = round(fark(son, L0[0]), 2)
            ard = [fark(L0[i], L0[i + 1]) for i in range(len(L0) - 1)]
            sonuc["dongu"].append({"boyut": boyut, "dongu": f"l{n}", "son_ilk": round(fark(L0[-1], L0[0]), 3), "ardisik_ort": round(float(np.mean(ard)), 3), "ardisik_maks": round(float(np.max(ard)), 3)})
        sonuc["gecis"].append(satir)
        if t == "t34" and len(K) >= 50:
            ard = [fark(K[i], K[i + 1]) for i in range(len(K) - 1)]
            sonuc["t34"].append({"boyut": boyut, "fark_47_48": round(ard[47], 2), "komsu_44_51": [round(x, 2) for x in ard[44:52]]})
Path(a.cikti).parent.mkdir(parents=True, exist_ok=True)
json.dump(sonuc, open(a.cikti, "w", encoding="utf8"), ensure_ascii=False, indent=1)
for k, v in sonuc.items():
    for r in v:
        print(k, json.dumps(r, ensure_ascii=False))
