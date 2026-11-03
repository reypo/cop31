"""EEVEE ↔ Cycles yan yana (olcum.sh çıktıları): her sahne için tam kare (küçültülmüş) + 1:1 ayrıntı kırpımı,
ölçüm özeti (kare süresi, Cycles istatistik satırı) başlıkta.

  python -X utf8 -P scripts/blender/s2/karsilastir.py
"""
import os, sys, json, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from png16 import oku

O = "D:/soft/cop31-varlik/render/_onizleme/s2-olcum"
ONIZ = "D:/soft/cop31-varlik/render/_onizleme"
FONT = "D:/soft/cop31-varlik/font/Montserrat-SemiBold.ttf"
# ayrıntı kırpımı (1920 master px, sol üst x, y; 600×600)
AYRINTI = {"hol": (700, 640), "rotunda": (420, 980), "banko": (300, 300), "plaka": (300, 300)}


def png8(a):
    return Image.fromarray(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8))


def oz():
    d = {}
    yol = os.path.join(O, "olcum.jsonl")
    if os.path.exists(yol):
        for satir in open(yol, encoding="utf-8"):
            j = json.loads(satir)
            d[(os.path.basename(j["out"]).split("-")[0], j["engine"])] = j
    return d


def main():
    f1 = ImageFont.truetype(FONT, 22)
    f2 = ImageFont.truetype(FONT, 16)
    olc = oz()
    for ad in ("hol", "rotunda", "banko", "plaka"):
        kol = []
        for motor in ("EEVEE", "CYCLES"):
            fs = sorted(glob.glob(os.path.join(O, f"{ad}-{motor}", "k_*.png")))
            if not fs:
                continue
            a, _ = oku(fs[-1])
            kol.append((motor, os.path.basename(fs[-1]), a))
        if len(kol) < 2:
            continue
        W = Image.new("RGB", (2 * 900 + 30, 900 + 600 + 110), (24, 24, 26))
        dr = ImageDraw.Draw(W)
        for i, (motor, kare, a) in enumerate(kol):
            x = 10 + i * 910
            W.paste(png8(a).resize((900, 900), Image.LANCZOS), (x, 50))
            ax, ay = AYRINTI[ad]
            W.paste(png8(a[ay:ay + 600, ax:ax + 600]), (x + 150, 960))
            j = olc.get((ad, motor), {})
            dr.text((x, 10), f"{motor} 1920² — {kare} — ort. {j.get('ort_sn_ilk_haric') or j.get('ilk_kare_sn')} sn/kare", font=f1, fill=(240, 240, 240))
            dr.text((x + 150, 1565), f"1:1 ayrıntı x {ax}–{ax + 600}, y {ay}–{ay + 600}", font=f2, fill=(200, 200, 200))
        yol = os.path.join(ONIZ, f"s2-cycles-eevee-{ad}.jpg")
        W.save(yol, quality=88)
        print("[KARSILASTIR]", yol)


if __name__ == "__main__":
    main()
