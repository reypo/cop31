"""S1 önizleme araçları (sistem Python: PIL, numpy, ffmpeg): kontak sayfaları, poster önizlemeleri, 720p mp4,
ölçümler (t01 disk, dikiş/devir kare farkları, parlama, metin bandı altı en parlak %5 → scrim alfası).

    python -X utf8 -P kontak.py hepsi [--render D:/soft/cop31-varlik/render]
    python -X utf8 -P kontak.py kontak t01 | poster | mp4 | olc

Kırpım kutuları master (1920²) uzayında: dikey 1080×1920 (x 420–1500), yatay 1920×1080 (y 420–1500).
"""
import argparse
import json
import math
import os
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument("is_", nargs="?", default="hepsi")
ap.add_argument("klip", nargs="?", default="")
ap.add_argument("--render", default="D:/soft/cop31-varlik/render")
ap.add_argument("--ek", default="")                 # Cycles kareleri klasörü (yan yana)
a = ap.parse_args()
RD = a.render
ON = os.path.join(RD, "_onizleme")
os.makedirs(ON, exist_ok=True)
KLIPLER = ["t01", "l1", "t12", "l2", "t23", "l3", "t34a"]
POSTER = {"p1": "l1", "p2": "l2", "p3": "l3"}
try:
    FONT = ImageFont.truetype("D:/soft/cop31-varlik/font/Montserrat-SemiBold.ttf", 18)
    FONT_K = ImageFont.truetype("D:/soft/cop31-varlik/font/Montserrat-SemiBold.ttf", 14)
except Exception:
    FONT = FONT_K = ImageFont.load_default()
DIKEY = (0, "#33d6ff")
YATAY = (1, "#ffb020")


def kareler(klip):
    d = os.path.join(RD, klip)
    return sorted(int(f[2:6]) for f in os.listdir(d) if f.startswith("k_") and f.endswith(".png")) if os.path.isdir(d) else []


def yukle(klip, f):
    return Image.open(os.path.join(RD, klip, f"k_{f:04d}.png")).convert("RGB")


def kutular(dr, olcek, ox=0, oy=0, kalin=2):
    m = olcek
    dr.rectangle([ox + 420 * m, oy, ox + 1500 * m - 1, oy + 1920 * m - 1], outline=DIKEY[1], width=kalin)
    dr.rectangle([ox, oy + 420 * m, ox + 1920 * m - 1, oy + 1500 * m - 1], outline=YATAY[1], width=kalin)


def kontak(klip, n=6, ek_dir=""):
    ks = kareler(klip)
    if not ks:
        return None
    sec = sorted(set(ks[round(i * (len(ks) - 1) / (n - 1))] for i in range(n)))
    T = 440
    sat = 2 if ek_dir else 1
    W = Image.new("RGB", (T * len(sec) + 10 * (len(sec) + 1), (T + 34) * sat + 40), "#f4f2ee")
    dr = ImageDraw.Draw(W)
    js = json.load(open(os.path.join(RD, f"{klip}.json"), encoding="utf-8")) if os.path.exists(os.path.join(RD, f"{klip}.json")) else {}
    motor = "Cycles 1920² son render" if "render-son" in RD else "EEVEE önizleme"
    dr.text((10, 8), f"S1 {klip} — {motor} {yukle(klip, sec[0]).size[0]}², {len(ks)} kare. Kutular: dikey 1080×1920 (mavi), yatay 1920×1080 (turuncu)",
            fill="#222", font=FONT)
    for i, f in enumerate(sec):
        x = 10 + i * (T + 10); y = 40
        im = yukle(klip, f).resize((T, T), Image.LANCZOS)
        W.paste(im, (x, y + 24))
        dd = ImageDraw.Draw(W)
        kutular(dd, T / 1920, x, y + 24)
        kad = js.get("kadraj_m", [None] * 999)[f] if js else None
        etiket = f"kare {f}" + (f"  kadraj {kad / 1000:.1f} km" if kad and kad >= 1000 else (f"  kadraj {kad:.0f} m" if kad else ""))
        dr.text((x, y + 2), etiket, fill="#222", font=FONT_K)
        if ek_dir:
            p = os.path.join(ek_dir, klip, f"k_{f:04d}.png")
            if os.path.exists(p):
                im2 = Image.open(p).convert("RGB").resize((T, T), Image.LANCZOS)
                W.paste(im2, (x, y + T + 58))
                kutular(ImageDraw.Draw(W), T / 1920, x, y + T + 58)
                dr.text((x, y + T + 36), f"Cycles kare {f}", fill="#222", font=FONT_K)
    yol = os.path.join(ON, f"s1-{klip}.jpg")
    W.save(yol, quality=90)
    return yol


def poster(p):
    klip = POSTER[p]
    im = yukle(klip, 0)
    im.save(os.path.join(ON, f"s1-{p}-temiz.jpg"), quality=93)          # tam boy, işaretsiz
    n = im.size[0]; m = n / 1920
    js = json.load(open(os.path.join(RD, f"{klip}.json"), encoding="utf-8"))
    dr = ImageDraw.Draw(im)
    kutular(dr, m, kalin=2)
    for ad, xy in js.get("capalar", {}).items():
        x, y = xy[0] * m, xy[1] * m
        dr.ellipse([x - 4, y - 4, x + 4, y + 4], outline="white", width=2)
        dr.text((x + 7, y - 9), js.get("capa_adlari", {}).get(ad, ad), fill="white", font=FONT_K, stroke_width=2, stroke_fill="black")
    yol = os.path.join(ON, f"s1-{p}.jpg")
    im.save(yol, quality=92)
    return yol


def mp4(klip):
    ks = kareler(klip)
    if not ks:
        return None
    yol = os.path.join(ON, f"s1-{klip}.mp4")
    vf = ("scale=720:720:flags=lanczos,"
          "drawbox=x=158:y=0:w=405:h=720:color=0x33d6ff@0.6:t=2,"
          "drawbox=x=0:y=158:w=720:h=405:color=0xffb020@0.6:t=2,format=yuv420p")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", "30", "-i", os.path.join(RD, klip, "k_%04d.png"),
           "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-movflags", "+faststart", "-an", yol]
    if klip.startswith("l"):
        # döngü: iki tur
        cmd = cmd[:6] + ["-stream_loop", "1"] + cmd[6:]
    subprocess.run(cmd, check=True)
    return yol


def kiyas(cy_dir, sureler=None):
    """Cycles 1920² ölçüm kareleri ile aynı karenin EEVEE önizlemesi yan yana (kırpım kutulu)."""
    ciftler = []
    for klip in KLIPLER:
        d = os.path.join(cy_dir, klip)
        if not os.path.isdir(d):
            continue
        for f in sorted(int(x[2:6]) for x in os.listdir(d) if x.startswith("k_") and x.endswith(".png")):
            ciftler.append((klip, f))
    if not ciftler:
        return None
    T = 560
    W = Image.new("RGB", (2 * T + 30, len(ciftler) * (T + 34) + 44), "#f4f2ee")
    dr = ImageDraw.Draw(W)
    dr.text((10, 10), "S1 — sol: EEVEE önizleme 960² TAA 16 | sağ: Cycles 1920² 64 örnek + OIDN, emission_sampling NONE, MB 0,5",
            fill="#222", font=FONT)
    for i, (klip, f) in enumerate(ciftler):
        y = 44 + i * (T + 34)
        for j, (yol, ad) in enumerate(((os.path.join(RD, klip, f"k_{f:04d}.png"), "EEVEE"), (os.path.join(cy_dir, klip, f"k_{f:04d}.png"), "Cycles"))):
            x = 10 + j * (T + 10)
            if os.path.exists(yol):
                im = Image.open(yol).convert("RGB").resize((T, T), Image.LANCZOS)
                W.paste(im, (x, y + 22)); kutular(ImageDraw.Draw(W), T / 1920, x, y + 22)
            ek = ""
            if sureler and ad == "Cycles":
                ek = f"  {sureler.get((klip, f), '')}"
            dr.text((x, y + 2), f"{ad} {klip} kare {f}{ek}", fill="#222", font=FONT_K)
    yol = os.path.join(ON, "s1-cycles-kiyas.jpg")
    W.save(yol, quality=90)
    return yol


# ---------------------------------------------------------------------------------------------- ölçümler
def srgb_lin(c):
    c = np.asarray(c, np.float64)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def L(c):
    l = srgb_lin(c)
    return 0.2126 * l[..., 0] + 0.7152 * l[..., 1] + 0.0722 * l[..., 2]


def kontrast(a_, b_):
    la, lb = L(a_), L(b_)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def hex2(h):
    h = h.lstrip("#"); return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def scrim_alfa(piksel, metin, scrim):
    """Tarayıcı varsayılanı: sRGB uzayında karışım C = α·S + (1−α)·P. 4,5:1 için en küçük α."""
    T, S = hex2(metin), hex2(scrim)
    for al in np.arange(0, 1.0001, 0.005):
        C = al * S + (1 - al) * piksel
        if kontrast(T, C) >= 4.5:
            return round(float(al), 3)
    return 1.0


def bant_olc(im, kutu, metinler, scrim):
    a_ = np.asarray(im, np.float64) / 255
    n = a_.shape[0]
    x0, y0, x1, y1 = [int(v * n) for v in kutu]
    blok = a_[y0:y1, x0:x1].reshape(-1, 3)
    lum = L(blok)
    esik = np.percentile(lum, 95)
    ust = blok[lum >= esik]
    p95 = ust.mean(0)
    sonuc = {"bolge": kutu, "en_parlak_%5_ort_srgb": [round(float(v) * 255) for v in p95],
             "en_parlak_%5_luminans": round(float(L(p95)), 3), "p95_luminans": round(float(esik), 3),
             "maks_luminans": round(float(lum.max()), 3)}
    beyaz = np.ones(3)
    sonuc["alfa_4_5"] = {m_: scrim_alfa(p95, m_, scrim) for m_ in metinler}
    sonuc["alfa_4_5_saf_beyaz_piksel"] = {m_: scrim_alfa(beyaz, m_, scrim) for m_ in metinler}
    return sonuc


def fark(i1, i2):
    a1 = np.asarray(i1, np.float64); a2 = np.asarray(i2, np.float64)
    return float(np.abs(a1 - a2).mean())


def lab(im):
    """sRGB (PIL) → CIELAB (D65)."""
    c = np.asarray(im, np.float64) / 255
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def de00(i1, i2):
    """Ortalama CIEDE2000 (piksel başına, sonra ortalama)."""
    L1, a1, b1 = np.moveaxis(lab(i1), -1, 0); L2, a2, b2 = np.moveaxis(lab(i2), -1, 0)
    C1 = np.hypot(a1, b1); C2 = np.hypot(a2, b2); Cm = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)))
    a1p, a2p = a1 * (1 + G), a2 * (1 + G)
    C1p, C2p = np.hypot(a1p, b1), np.hypot(a2p, b2)
    h1p = np.degrees(np.arctan2(b1, a1p)) % 360; h2p = np.degrees(np.arctan2(b2, a2p)) % 360
    dLp = L2 - L1; dCp = C2p - C1p
    dh = h2p - h1p; dh = np.where(dh > 180, dh - 360, np.where(dh < -180, dh + 360, dh)); dh = np.where(C1p * C2p == 0, 0, dh)
    dHp = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dh / 2))
    Lpm = (L1 + L2) / 2; Cpm = (C1p + C2p) / 2
    hs = h1p + h2p
    hpm = np.where(C1p * C2p == 0, hs, np.where(np.abs(h1p - h2p) <= 180, hs / 2, np.where(hs < 360, (hs + 360) / 2, (hs - 360) / 2)))
    T = 1 - 0.17 * np.cos(np.radians(hpm - 30)) + 0.24 * np.cos(np.radians(2 * hpm)) + 0.32 * np.cos(np.radians(3 * hpm + 6)) - 0.20 * np.cos(np.radians(4 * hpm - 63))
    dth = 30 * np.exp(-(((hpm - 275) / 25) ** 2)); Rc = 2 * np.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7))
    SL = 1 + 0.015 * (Lpm - 50) ** 2 / np.sqrt(20 + (Lpm - 50) ** 2); SC = 1 + 0.045 * Cpm; SH = 1 + 0.015 * Cpm * T
    RT = -np.sin(np.radians(2 * dth)) * Rc
    d = np.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH))
    return float(d.mean())


def olc():
    out = {}
    # t01 kare 0: disk (eşikli maske) merkezi ve çapı, master px
    if kareler("t01"):
        im = np.asarray(yukle("t01", 0), np.float64) / 255
        n = im.shape[0]; m = 1920 / n
        lum = L(im)
        msk = lum > 0.012
        ys, xs = np.nonzero(msk)
        out["t01_kare0_disk"] = {"esik_luminans": 0.012, "merkez_bbox": [round((xs.min() + xs.max() + 1) / 2 * m, 1), round((ys.min() + ys.max() + 1) / 2 * m, 1)],
                                 "cap_yatay": round((xs.max() - xs.min() + 1) * m, 1), "cap_dikey": round((ys.max() - ys.min() + 1) * m, 1),
                                 "agirlik_merkezi": [round(xs.mean() * m, 1), round(ys.mean() * m, 1)],
                                 "esdeger_cap_alan": round(2 * math.sqrt(msk.sum() / math.pi) * m, 1),
                                 "hedef": {"merkez": [960, 768], "cap": 345}}
    # dikişler: geçiş son karesi ≡ döngü 0 ≡ poster; geçiş 0 ≡ önceki döngü 0
    dik = {}
    for a1, f1, a2, f2 in (("t01", 53, "l1", 0), ("l1", 0, "t12", 0), ("t12", 59, "l2", 0), ("l2", 0, "t23", 0),
                           ("t23", 83, "l3", 0), ("l3", 0, "t34a", 0)):
        if f1 in kareler(a1) and f2 in kareler(a2):
            i1_, i2_ = yukle(a1, f1), yukle(a2, f2)
            dik[f"{a1}[{f1}]↔{a2}[{f2}]"] = {"ort_mutlak_fark_255": round(fark(i1_, i2_), 3), "dE00_ort": round(de00(i1_, i2_), 3)}
    # t34: S1 kare 47 ↔ S2 kare 48 (ikisi de parlamanın içinde)
    p48 = os.path.join(RD, "t34b", "k_0000.png")                      # S2: t34b k_0000 = t34 kare 48 (t34_ofset)
    if 47 in kareler("t34a") and os.path.exists(p48):
        i1_, i2_ = yukle("t34a", 47), Image.open(p48).convert("RGB")
        dik["t34a[47]↔t34b[48]"] = {"ort_mutlak_fark_255": round(fark(i1_, i2_), 3), "dE00_ort": round(de00(i1_, i2_), 3)}
    out["dikisler"] = dik
    # döngü dikişi: son→ilk fark ile ardışık kare farkı
    dd = {}
    for l_ in ("l1", "l2", "l3"):
        ks = kareler(l_)
        if len(ks) > 3:
            ard = [fark(yukle(l_, ks[i]), yukle(l_, ks[i + 1])) for i in range(0, len(ks) - 1, max(1, len(ks) // 12))]
            dd[l_] = {"son_ilk": round(fark(yukle(l_, ks[-1]), yukle(l_, ks[0])), 3), "ardisik_ort": round(float(np.mean(ard)), 3),
                      "ardisik_maks": round(float(np.max(ard)), 3), "son_ilk_dE00": round(de00(yukle(l_, ks[-1]), yukle(l_, ks[0])), 3),
                      "ardisik_dE00_0_1": round(de00(yukle(l_, ks[0]), yukle(l_, ks[1])), 3)}
    out["dongu_dikisi"] = dd
    # t23 devir: ardışık kare farkları (küre görünürlüğü irtifa < 1.500 m'de kapanır)
    ks = kareler("t23")
    if len(ks) == 84:
        fs = [round(fark(yukle("t23", i), yukle("t23", i + 1)), 2) for i in range(83)]
        js = json.load(open(os.path.join(RD, "t23.json"), encoding="utf-8"))
        irt = [k["irtifa_m"] for k in js["kamera"]["kareler"]]
        devir = next((i for i in range(84) if irt[i] < 1500), None)
        out["t23_ardisik_fark"] = fs
        out["t23_kure_gizleme_karesi"] = devir
        if devir:
            out["t23_devir_farki"] = {"devir_oncesi→devir": fs[devir - 1], "komsu": fs[max(0, devir - 4):devir + 3]}
    # parlama
    ks = kareler("t34a")
    if ks:
        par = {}
        for f in range(36, 48):
            if f in ks:
                a_ = np.asarray(yukle("t34a", f), np.float64)
                par[f] = {"ort_parlaklik_%": round(a_.mean() / 255 * 100, 1), "ort_renk": [round(v) for v in a_.reshape(-1, 3).mean(0)]}
        out["t34a_parlama"] = par
    # metin bantları (poster = döngü 0. karesi): kutu (x0, y0, x1, y1) master oranı
    bant = {}
    if kareler("l1"):
        im = yukle("l1", 0)
        bant["p1_dikey_ust_bant"] = bant_olc(im, (420 / 1920, 0, 1500 / 1920, 0.28), ["#FFFFFF", "#C9D6E3"], "#070B14")
        bant["p1_yatay_sag_%38"] = bant_olc(im, (0.62, 420 / 1920, 1.0, 1500 / 1920), ["#FFFFFF", "#C9D6E3"], "#070B14")
    if kareler("l2"):
        im = yukle("l2", 0)
        bant["p2_dikey_ust_bant(yalniz_etiket)"] = bant_olc(im, (420 / 1920, 0, 1500 / 1920, 0.28), ["#FFFFFF"], "#070B14")
        bant["p2_yatay_sag_%38(yalniz_etiket)"] = bant_olc(im, (0.62, 420 / 1920, 1.0, 1500 / 1920), ["#FFFFFF"], "#070B14")
    if kareler("l3"):
        im = yukle("l3", 0)
        bant["p3_dikey_alt_bant"] = bant_olc(im, (420 / 1920, 0.68, 1500 / 1920, 1.0), ["#FFFFFF", "#F2E6D3"], "#0B1A2E")
        bant["p3_yatay_sag_%38"] = bant_olc(im, (0.62, 420 / 1920, 1.0, 1500 / 1920), ["#FFFFFF", "#F2E6D3"], "#0B1A2E")
        # döngüde en parlak kare (brief §5: döngülerde en parlak kare)
        ks = kareler("l3")
        enp = max(ks[::10], key=lambda f: np.asarray(yukle("l3", f).crop((int(0.21875 * 960), int(0.68 * 960), int(0.78125 * 960), 960))).mean())
        bant["p3_dongu_en_parlak_kare"] = enp
        bant["p3_dikey_alt_bant_en_parlak_dongu_karesi"] = bant_olc(yukle("l3", enp), (420 / 1920, 0.68, 1500 / 1920, 1.0), ["#FFFFFF", "#F2E6D3"], "#0B1A2E")
    out["metin_bandi"] = bant
    # d1 Sahra / kum: en parlak piksel (pozlama kuralı ≤ %92)
    if kareler("l1"):
        a_ = np.asarray(yukle("l1", 0), np.float64) / 255
        r, g, b = a_[..., 0], a_[..., 1], a_[..., 2]
        msk = (r > g) & (g > b) & ((r - b) > 0.15) & (L(a_) > 0.15)
        out["d1_sahra"] = {"piksel": int(msk.sum()), "maks_kanal_%": round(float(a_[msk].max()) * 100, 1),
                           "p99_kanal_%": round(float(np.percentile(a_[msk].max(-1), 99)) * 100, 1)}
    # d3 ön plan ortalama parlaklığı (dikey kırpım, y %60–100)
    if kareler("l3"):
        a_ = np.asarray(yukle("l3", 0), np.float64) / 255
        n = a_.shape[0]
        y = 0.2126 * a_[..., 0] + 0.7152 * a_[..., 1] + 0.0722 * a_[..., 2]
        out["d3_on_plan_luma_%"] = round(float(y[int(n * 0.6):, int(n * 420 / 1920):int(n * 1500 / 1920)].mean()) * 100, 1)
    out["c_turu"] = olc_c()
    json.dump(out, open(os.path.join(ON, "s1-olcum.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return out


def olc_c():
    """C turu kabul ölçütleri (brief §11.1), PNG16 ile (olcum16.py): dikiş ΔE00, durgun uçlar, t23 luma, parlama."""
    import sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from olcum16 import oku, fark255, de00, luma

    def yol(klip, f):
        return os.path.join(RD, klip, f"k_{f:04d}.png")

    def var(klip, f):
        return os.path.exists(yol(klip, f))

    c, kab = {}, {}
    if not (var("t23", 83) and var("l3", 0) and var("t34a", 0)):
        return {"hata": "t23/l3/t34a kareleri eksik"}
    t23 = {f: oku(yol("t23", f)) for f in range(72, 84)}
    l3 = oku(yol("l3", 0)); ta = {f: oku(yol("t34a", f)) for f in range(0, 7)}
    c["t23[83]↔l3[0]"] = {"fark_255": round(fark255(t23[83], l3), 4), "dE00": round(de00(t23[83], l3), 4)}
    c["l3[0]↔t34a[0]"] = {"fark_255": round(fark255(l3, ta[0]), 4), "dE00": round(de00(l3, ta[0]), 4)}
    c["t23_ardisik_son12"] = {f"{f - 1}→{f}": {"fark_255": round(fark255(t23[f - 1], t23[f]), 4), "dE00": round(de00(t23[f - 1], t23[f]), 4)}
                              for f in range(73, 84)}
    c["t34a_ardisik_ilk6"] = {f"{f - 1}→{f}": {"fark_255": round(fark255(ta[f - 1], ta[f]), 4), "dE00": round(de00(ta[f - 1], ta[f]), 4)}
                              for f in range(1, 7)}
    son4 = [c["t23_ardisik_son12"][f"{f - 1}→{f}"]["fark_255"] for f in range(80, 84)]
    kab["t23[83]↔l3[0] dE00 ≤ 0,3"] = c["t23[83]↔l3[0]"]["dE00"] <= 0.3
    kab["l3[0]↔t34a[0] dE00 ≤ 0,3"] = c["l3[0]↔t34a[0]"]["dE00"] <= 0.3
    kab["t23 son 4 ardışık fark ≤ 1,5/255"] = max(son4) <= 1.5
    kab["t34a 0→1 ≤ 1,5/255"] = c["t34a_ardisik_ilk6"]["0→1"]["fark_255"] <= 1.5
    # t23 luma (her kare), kare 0–60 en düşük, kare 10–40 tek yönlülük
    lu = [round(luma(oku(yol("t23", f))), 2) for f in range(84)]
    c["t23_luma_%"] = lu
    c["t23_luma_her_3_kare"] = {f: lu[f] for f in range(0, 84, 3)}
    v = lu[10:41]
    yuk = max(v[j] - min(v[:j + 1]) for j in range(len(v)))           # azalan yönde en büyük geri yükseliş
    dus = max(max(v[:j + 1]) - v[j] for j in range(len(v)))           # artan yönde en büyük geri düşüş
    c["t23_luma_0_60_min"] = {"luma_%": min(lu[:61]), "kare": lu.index(min(lu[:61]))}
    c["t23_luma_10_40_tek_yon"] = {"azalan_yonde_maks_geri_yukselis": round(yuk, 2), "artan_yonde_maks_geri_dusus": round(dus, 2),
                                  "yon": "azalan" if yuk <= dus else "artan"}
    kab["t23 kare 0–60 luma ≥ %20"] = min(lu[:61]) >= 20.0
    kab["t23 kare 10–40 tek yönlü (±3)"] = min(yuk, dus) <= 3.0
    if var("l2", 0):
        a_, b_ = oku(yol("l2", 0)), oku(yol("t23", 0))
        c["t23[0]↔l2[0]"] = {"fark_255": round(fark255(a_, b_), 4), "dE00": round(de00(a_, b_), 4)}
        kab["t23[0]↔l2[0] dE00 ≤ 0,3"] = c["t23[0]↔l2[0]"]["dE00"] <= 0.3
    # parlama: kare 44–47 ortalama ≥ %92; kare 47 tam #FFF1DC (16 bit: 257 × (255, 241, 220)); S2 t34b k_0000 ile fark
    par = {}
    for f in range(36, 48):
        if var("t34a", f):
            a_ = oku(yol("t34a", f)); par[f] = round(float(a_.mean(dtype=np.float64)) * 100, 2)
    c["t34a_parlama_ort_%"] = par
    k47 = oku(yol("t34a", 47))
    ton = np.array([255, 241, 220], np.float32) / 255
    c["t34a[47]_tam_FFF1DC"] = bool(np.all(np.abs(k47 - ton) < 0.5 / 65535))
    kab["parlama kare 44–47 ort ≥ %92"] = all(par.get(f, 0) >= 92.0 for f in range(44, 48))
    kab["parlama kare 47 tam #FFF1DC"] = c["t34a[47]_tam_FFF1DC"]
    p48 = os.path.join(RD, "t34b", "k_0000.png")
    if os.path.exists(p48):
        b48 = oku(p48)
        c["t34a[47]↔t34b[48]"] = {"fark_255": round(fark255(k47, b48), 4), "maks_mutlak_255": round(float(np.abs(k47 - b48).max() * 255), 4)}
        kab["t34a[47]↔t34b[48] fark 0"] = c["t34a[47]↔t34b[48]"]["maks_mutlak_255"] == 0.0
    c["kabul"] = kab
    return c


if __name__ == "__main__":
    if a.is_ in ("kontak", "hepsi"):
        for k in ([a.klip] if a.klip else KLIPLER):
            print("kontak", kontak(k, ek_dir=a.ek))
    if a.is_ in ("poster", "hepsi"):
        for p in POSTER:
            if kareler(POSTER[p]):
                print("poster", poster(p))
    if a.is_ in ("mp4", "hepsi"):
        for k in ([a.klip] if a.klip else KLIPLER):
            print("mp4", mp4(k))
    if a.is_ == "kiyas":
        sure = {}
        lp = os.path.join(a.ek, "olcum.jsonl")
        if os.path.exists(lp):
            for ln in open(lp, encoding="utf-8"):
                o = json.loads(ln); sure[(o["klip"], o["kare"])] = f"{o['sn']:.1f} sn"
        print("kiyas", kiyas(a.ek, sure))
    if a.is_ in ("olc", "hepsi"):
        print(json.dumps(olc(), ensure_ascii=False, indent=1)[:6000])
    if a.is_ == "olc_c":
        print(json.dumps(olc_c(), ensure_ascii=False, indent=1))
