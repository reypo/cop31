"""S2 önizleme çıktıları: kontak sayfası (6 kare + dikey/yatay kırpım kutuları + kare no), 720p önizleme mp4'leri
(dikey 720×1280, yatay 1280×720; H.264 CRF 23), metin bandı ölçümü (brief-icinden-3 §5: bant altındaki en parlak /
en koyu %5 piksel, 4,5:1 için gereken scrim alfası).

  python -X utf8 -P scripts/blender/s2/kontak.py kontak <klip> [--kaynak DIZIN]
  python -X utf8 -P scripts/blender/s2/kontak.py metin <png> --bant ust|alt --metin '#F7E6CD' --scrim '#16181B'
"""
import sys, os, glob, json, argparse, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from png16 import oku

RENDER = "D:/soft/cop31-varlik/render"
ONIZ = RENDER + "/_onizleme"
FONT = "D:/soft/cop31-varlik/font/Montserrat-SemiBold.ttf"


def kareler(dizin):
    fs = sorted(glob.glob(os.path.join(dizin, "k_*.png")))
    return [(int(os.path.basename(f)[2:6]), f) for f in fs]


def kontak(klip, kaynak=None, n=6, karo=520, cikis=None, baslik=None):
    dz = kaynak or os.path.join(ONIZ, f"s2-{klip}")
    ks = kareler(dz)
    if not ks:
        raise SystemExit(f"kare yok: {dz}")
    sec = [ks[round(i * (len(ks) - 1) / (n - 1))] for i in range(n)] if len(ks) >= n else ks
    sut = 3
    sat = (len(sec) + sut - 1) // sut
    pad = 10
    W = Image.new("RGB", (sut * karo + (sut + 1) * pad, sat * karo + (sat + 1) * pad + 40), (24, 24, 26))
    dr = ImageDraw.Draw(W)
    f1 = ImageFont.truetype(FONT, 20)
    f2 = ImageFont.truetype(FONT, 16)
    dr.text((pad, 10), f"S2 {klip} — {len(ks)} kare ({ks[0][0]}–{ks[-1][0]}), {baslik or 'önizleme EEVEE'} {Image.open(ks[0][1]).size[0]}²; "
                       f"camgöbeği: dikey kırpım 1080×1920, eflatun: yatay 1920×1080", font=f2, fill=(230, 230, 230))
    for i, (no, f) in enumerate(sec):
        a, _ = oku(f)
        im = Image.fromarray(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8)).resize((karo, karo), Image.LANCZOS)
        d = ImageDraw.Draw(im)
        k0, k1 = round(karo * 420 / 1920), round(karo * 1500 / 1920)
        d.rectangle([k0, 0, k1 - 1, karo - 1], outline=(0, 220, 230), width=2)
        d.rectangle([0, k0, karo - 1, k1 - 1], outline=(235, 60, 200), width=2)
        d.rectangle([0, 0, 120, 28], fill=(0, 0, 0))
        d.text((6, 4), f"kare {no}", font=f1, fill=(255, 255, 255))
        x = pad + (i % sut) * (karo + pad)
        y = 40 + pad + (i // sut) * (karo + pad)
        W.paste(im, (x, y))
    yol = cikis or os.path.join(ONIZ, f"s2-{klip}.jpg")
    W.save(yol, quality=88)
    print("[KONTAK]", yol)
    return yol


def mp4(klip, kaynak=None):
    dz = kaynak or os.path.join(ONIZ, f"s2-{klip}")
    ks = kareler(dz)
    if len(ks) < 2:
        return []
    bas = ks[0][0]
    res = Image.open(ks[0][1]).size[0]
    k = res / 1920
    c0, c1 = round(420 * k), round(1080 * k)
    cik = []
    for ad, vf in (("d", f"crop={c1}:{res}:{c0}:0,scale=720:1280:flags=lanczos,format=yuv420p"),
                   ("y", f"crop={res}:{c1}:0:{c0},scale=1280:720:flags=lanczos,format=yuv420p")):
        yol = os.path.join(ONIZ, f"s2-{klip}-{ad}.mp4")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-start_number", str(bas), "-i",
                        os.path.join(dz, "k_%04d.png"), "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "23",
                        "-profile:v", "high", "-movflags", "+faststart", "-an", yol], check=True)
        cik.append(yol)
        print("[MP4]", yol, os.path.getsize(yol))
    return cik


# ---------------------------------------------------------------- metin bandı ölçümü (WCAG)
def _lin(c):
    c = np.asarray(c, dtype=np.float64)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def lum(rgb):
    l = _lin(rgb)
    return 0.2126 * l[..., 0] + 0.7152 * l[..., 1] + 0.0722 * l[..., 2]


def hex2(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def kontrast(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def gereken_alfa(piksel, metin, scrim, hedef=4.5):
    """CSS sRGB uzayında bileşim: C = α·scrim + (1−α)·piksel. 4,5:1 için en küçük α."""
    if kontrast(metin, piksel) >= hedef:
        return 0.0
    lo, hi = 0.0, 1.0
    for _ in range(40):
        m = (lo + hi) / 2
        if kontrast(metin, m * scrim + (1 - m) * piksel) >= hedef:
            hi = m
        else:
            lo = m
    return hi


def metin(png, bant, metin_hex, scrim_hex, alfa_brief=None):
    a, _ = oku(png)
    h, w = a.shape[:2]
    x0, x1 = round(w * 420 / 1920), round(w * 1500 / 1920)          # dikey teslim kırpımı
    y0, y1 = (0, round(h * 0.28)) if bant == "ust" else (round(h * 0.68), h)
    blok = a[y0:y1, x0:x1].reshape(-1, 3)
    L = lum(blok)
    sira = np.argsort(L)
    n5 = max(1, len(L) // 20)
    parlak = blok[sira[-n5:]]
    koyu = blok[sira[:n5]]
    p95 = blok[sira[int(len(L) * 0.95)]]
    p05 = blok[sira[int(len(L) * 0.05)]]
    mt, sc = hex2(metin_hex), hex2(scrim_hex)
    sonuc = {
        "png": png, "bant": bant, "kirpim": "dikey 1080×1920 (x 420–1500)", "y_aralik": [y0, y1],
        "ort_luminans": round(float(L.mean()), 4),
        "en_parlak_5_ort_rgb": ["#%02X%02X%02X" % tuple(int(round(v * 255)) for v in parlak.mean(0))],
        "p95_rgb": "#%02X%02X%02X" % tuple(int(round(v * 255)) for v in p95),
        "p95_luminans": round(float(lum(p95)), 4),
        "p05_rgb": "#%02X%02X%02X" % tuple(int(round(v * 255)) for v in p05),
        "p05_luminans": round(float(lum(p05)), 4),
        "maks_rgb": "#%02X%02X%02X" % tuple(int(round(v * 255)) for v in blok[sira[-1]]),
        "gereken_alfa_p95": round(gereken_alfa(p95, mt, sc), 3),
        "gereken_alfa_p05": round(gereken_alfa(p05, mt, sc), 3),
        "gereken_alfa_maks": round(gereken_alfa(blok[sira[-1]], mt, sc), 3),
        "gereken_alfa_min": round(gereken_alfa(blok[sira[0]], mt, sc), 3),
        "metin": metin_hex, "scrim": scrim_hex, "alfa_brief": alfa_brief,
    }
    print(json.dumps(sonuc, ensure_ascii=False))
    return sonuc


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("is_", choices=["kontak", "metin", "mp4"])
    p.add_argument("hedef")
    p.add_argument("--kaynak", default=None)
    p.add_argument("--bant", default="ust")
    p.add_argument("--metin", default="#F7E6CD")
    p.add_argument("--scrim", default="#16181B")
    p.add_argument("--alfa", type=float, default=None)
    p.add_argument("--cikis", default=None)
    p.add_argument("--baslik", default=None)
    p.add_argument("--mp4", type=int, default=1)
    x = p.parse_args()
    if x.is_ == "kontak":
        kontak(x.hedef, x.kaynak, cikis=x.cikis, baslik=x.baslik)
        if x.mp4:
            mp4(x.hedef, x.kaynak)
    elif x.is_ == "mp4":
        mp4(x.hedef, x.kaynak)
    else:
        metin(x.hedef, x.bant, x.metin, x.scrim, x.alfa)
