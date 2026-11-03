"""
/icinden v3 — YER TUTUCU (sahte) master klipler + Blender fragmanları (A turu; gerçek render yok).

Gerçek boru hattının (docs/brief-icinden-3.md §9.3) çıktısını taklit eder: her klip için 1920² master
(burada PNG dizisi yerine yüksek kaliteli x264 ara dosyası, `<klip>.mkv`) ve `<klip>.json` fragmanı
(master px). Sonraki adımlar gerçek render'la AYNI: `scripts/icinden/kodla.mjs` → kodlama listesi →
`scripts/icinden/manifest-birlestir.mjs` → `src/components/icinden/klipler.json`.

İçerik bilerek "yer tutucu": her durak kaba bir renk sahnesi (§1.2 paletinden), geçişler yakınlaşma +
çapraz sönme, üstünde klip adı, kare sayacı ve testsrc2 (drawtext YOK: Windows yol hatası; yazılar PIL).
Dikiş kuralı korunur: geçişin 0. karesi = kalkış posteri, son karesi = varış posteri (yazı ve testsrc2
yalnız ara karelerde); döngünün 0. karesi = poster. t01 gerçek geometriyle: disk master (960, 768), çap
345 px → d1 posterinde (960, 1190), çap 1134 px (lombar sınaması için). t34'te kare 44–51 parlama
#FFF1DC, t23'te ~%70'te bulut perdesi (beyaz). t56'nın son karesi: banko plakası + gerçek broşür kapağı
(brosur-01.png, oran 0,476) broşür dikdörtgeninde.

Çalıştırma (depo kökünden):
  python -X utf8 -P scripts/icinden/yer-tutucu.py [--cikti D:/soft/cop31-varlik/yer-tutucu/render] [--klip t01,l1]
Bellek: kare kare üretilip ffmpeg'e borulanır (1920² rgb24 = 11 MB/kare); süreç ~0,5 GB.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

M = 1920  # master
FPS = 30
VARLIK = "D:/soft/cop31-varlik"
FONT = f"{VARLIK}/font"

# klip: (tür, kare, kalkış sahnesi, varış sahnesi)
KLIPLER = {
    "t01": ("ileri", 54, None, "p1"),
    "l1": ("dongu", 120, "p1", "p1"),
    "t12": ("ileri", 60, "p1", "p2"),
    "l2": ("dongu", 120, "p2", "p2"),
    "t23": ("ileri", 84, "p2", "p3"),
    "l3": ("dongu", 150, "p3", "p3"),
    "t34": ("ileri", 72, "p3", "p4"),
    "l4": ("dongu", 120, "p4", "p4"),
    "t45": ("ileri", 60, "p4", "p5"),
    "l5": ("dongu", 120, "p5", "p5"),
    "t56": ("ileri", 60, "p5", "p6b"),
    "p6": ("plaka", 1, "p6", "p6"),
}

# Kadraj (dikey kırpımın genişliği, metre) posterlerde: R3 §3.1 / §9.1.
KADRAJ = {"p0": 12742e3 * 1080 / 345, "p1": 12.1e6, "p2": 1.26e6, "p3": 2300.0, "p4": 19.0, "p5": 2.7, "p6b": 0.14, "p6": 0.14}

# Yakınlaşma odakları (master px): geçişte kalkış sahnesi bu noktaya doğru büyür.
ODAK = {"p1": (900, 1130), "p2": (900, 560), "p3": (960, 1000), "p4": (900, 800), "p5": (960, 960), "p6b": (960, 960)}

# Çapalar (poster karesi, master px). Adlar docs/klipler-sema.md §3 ile aynı.
CAPALAR = {
    "p1": {"antalya": [905, 1105]},
    "p2": {"akdeniz": [760, 1120], "anadolu": [1010, 430], "kibris": [1215, 880], "antalya": [900, 585]},
    "p3": {"expo": [960, 985], "d400": [1240, 1160], "antalya": [690, 770], "korfez": [1120, 718], "beydaglari": [600, 640]},
    "p4": {"rotunda": [900, 780], "oyun": [640, 1090], "kiosk": [780, 1260], "amfi": [1300, 1010]},
    "p5": {},  # 12 sütun aşağıda hesaplanır
}
SUTUN_R = 640
for i in range(12):
    a = math.radians(-90 + i * 30)
    CAPALAR["p5"][f"sutun{i + 1:02d}"] = [round(960 + SUTUN_R * math.cos(a)), round(960 + SUTUN_R * math.sin(a))]

# t56 son karesi: broşür dikdörtgeni (merkez kare içinde ki iki kırpımda da görünsün; oran 0,476).
BR_H = 1020
BR_W = round(BR_H * 1600 / 3360)
BR = [[960 - BR_W // 2, 450], [960 + BR_W // 2, 450], [960 + BR_W // 2, 450 + BR_H], [960 - BR_W // 2, 450 + BR_H]]


def font(ad: str, boy: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(f"{FONT}/{ad}", boy)


F_AD = font("Montserrat-Black.ttf", 96)
F_SAYAC = font("Montserrat-Bold.ttf", 54)
F_BUGUN = font("Lora-Bold.ttf", 120)
F_BURADA = font("Lora-Regular.ttf", 44)
F_SUTUN = font("Lora-Bold.ttf", 40)

YY, XX = np.mgrid[0:M, 0:M].astype(np.float32)


def hex2(c: str) -> np.ndarray:
    c = c.lstrip("#")
    return np.array([int(c[i : i + 2], 16) for i in (0, 2, 4)], np.float32)


def dikey_gradyan(ust: str, alt: str, y0: float = 0, y1: float = M) -> np.ndarray:
    t = np.clip((YY - y0) / max(1.0, y1 - y0), 0, 1)[..., None]
    return hex2(ust) * (1 - t) + hex2(alt) * t


def gurultu(seed: int, olcek: int) -> np.ndarray:
    """Düşük frekanslı değer gürültüsü (0..1), M×M."""
    rng = np.random.default_rng(seed)
    n = M // olcek + 2
    g = rng.random((n, n)).astype(np.float32)
    im = Image.fromarray((g * 255).astype(np.uint8)).resize((M + olcek * 2, M + olcek * 2), Image.BICUBIC)
    return np.asarray(im, np.float32)[:M, :M] / 255.0


G1 = gurultu(1, 96)
G2 = gurultu(2, 24)


def kure(img: np.ndarray, cx: float, cy: float, r: float) -> None:
    """Basit gölgeli Dünya diski (güneş soldan-üstten; sağ üçte bir gece + şehir ışıkları + terminatör)."""
    x0, x1 = int(max(0, cx - r - 4)), int(min(M, cx + r + 5))
    y0, y1 = int(max(0, cy - r - 4)), int(min(M, cy + r + 5))
    if x1 <= x0 or y1 <= y0:
        return
    xs = (XX[y0:y1, x0:x1] - cx) / r
    ys = (YY[y0:y1, x0:x1] - cy) / r
    rr = xs * xs + ys * ys
    ic = rr <= 1
    z = np.sqrt(np.clip(1 - rr, 0, 1))
    # doku: kara/deniz (gürültü, diske göre koordinat)
    u = np.clip(((xs + 1) / 2 * (M - 1)), 0, M - 1).astype(np.int32)
    v = np.clip(((ys + 1) / 2 * (M - 1)), 0, M - 1).astype(np.int32)
    n = G1[v, u] * 0.7 + G2[v, u] * 0.3
    kara = n > 0.56
    renk = np.where(kara[..., None], np.where((ys > 0.15)[..., None], hex2("#C9A577"), hex2("#5E7A48")), hex2("#1B3F6B"))
    bulut = np.clip((G2[u, v] - 0.62) * 4, 0, 1)[..., None]
    renk = renk * (1 - bulut * 0.8) + 245 * bulut * 0.8
    sun = np.array([-0.62, -0.25, 0.74], np.float32)
    lam = np.clip(xs * sun[0] + ys * sun[1] + z * sun[2], 0, 1)[..., None]
    gun = renk * (0.12 + 0.95 * lam)
    term = np.exp(-((lam - 0.04) ** 2) / 0.0012)
    gun = gun * (1 - term * 0.5) + hex2("#E08A4A") * term * 0.5
    sehir = ((G2[v, u] * 7 % 1) > 0.97) & kara & (lam[..., 0] < 0.02)
    gun = np.where(sehir[..., None], hex2("#FFC266"), gun)
    # atmosfer kenarı
    kenar = np.clip((np.sqrt(rr) - 0.93) / 0.07, 0, 1)[..., None] * (lam > 0)
    gun = gun * (1 - kenar * 0.6) + hex2("#6FA8DC") * kenar * 0.6
    alfa = np.clip((1.0 - np.sqrt(rr)) * r, 0, 1)[..., None]  # 1 px yumuşatma
    hale = np.clip(1 - (np.sqrt(rr) - 1) * 12, 0, 1)[..., None] * (~ic)[..., None] * 0.35
    bolge = img[y0:y1, x0:x1]
    bolge[:] = bolge * (1 - alfa) + gun * alfa
    bolge[:] = bolge * (1 - hale) + hex2("#6FA8DC") * hale


def sahne(ad: str) -> np.ndarray:
    """Poster sahneleri (float32 M×M×3)."""
    if ad in ("p1", "p0"):
        img = dikey_gradyan("#03050A", "#070B14")
        if ad == "p1":
            kure(img, 960, 1190, 567)
        return img
    if ad == "p2":  # Akdeniz, ~1.500 km nadir
        img = dikey_gradyan("#1E5C82", "#12395E", 300, 1900)
        kiyi = 520 + 60 * np.sin(XX / 140) + 40 * np.sin(XX / 53 + 1.3)
        kara = YY < kiyi
        img = np.where(kara[..., None], hex2("#9C8F72") * (0.75 + 0.5 * G1[..., None]), img)
        sig = (YY > kiyi) & (YY < kiyi + 26)
        img = np.where(sig[..., None], hex2("#3FB6B0"), img)
        for cx, cy, rx, ry, c in ((1215, 900, 120, 42, "#8C8466"), (560, 1010, 110, 22, "#8C8466"), (960, 1780, 260, 120, "#3E5A3A")):
            e = ((XX - cx) / rx) ** 2 + ((YY - cy) / ry) ** 2 < 1
            img = np.where(e[..., None], hex2(c) * (0.8 + 0.4 * G2[..., None]), img)
        bulut = np.clip((G1 - 0.66) * 3, 0, 1)[..., None]
        return img * (1 - bulut * 0.5) + 240 * bulut * 0.5
    if ad == "p3":  # Expo, altın saat
        img = dikey_gradyan("#5D7FAE", "#FFD9A0", 120, 700)
        gunes = np.exp(-(((XX - 800) ** 2 + (YY - 560) ** 2) / (2 * 120**2)))[..., None]
        img = img * (1 - gunes * 0.8) + hex2("#FFF1DC") * gunes * 0.8
        for yy, amp, c in ((640, 50, "#A99FB6"), (668, 40, "#8F86A6"), (700, 30, "#7D7699")):
            dag = YY > yy + amp * np.sin(XX / 170 + yy) + 18 * np.sin(XX / 41)
            img = np.where(dag[..., None], hex2(c), img)
        parilti = (YY > 705) & (YY < 735)
        img = np.where(parilti[..., None], hex2("#F6C27A") * (0.85 + 0.3 * G2[..., None]), img)
        kent = (YY > 735) & (YY < 770 - 28 * (G2 > 0.5))
        img = np.where(kent[..., None], hex2("#6B6370"), img)
        yer = YY >= 770
        img = np.where(yer[..., None], dikey_gradyan("#4A5A3A", "#232821", 770, 1920) * (0.8 + 0.4 * G1[..., None]), img)
        for x0, y0, x1, y1 in ((770, 960, 1150, 1010), (820, 1010, 1100, 1040)):
            r_ = (XX >= x0) & (XX < x1) & (YY >= y0) & (YY < y1)
            img = np.where(r_[..., None], hex2("#E0D4BA"), img)
        sera = (YY > 1300) & ((XX // 90 + YY // 60) % 3 == 0) & (G2 > 0.45)
        img = np.where(sera[..., None], hex2("#F5E8D2"), img)
        yol = np.abs(XX - (1240 + (YY - 1160) * 0.55)) < 9
        return np.where((yol & (YY > 900))[..., None], hex2("#3B3A3A"), img)
    if ad == "p4":  # stant anatomisi, loş hol
        img = dikey_gradyan("#121314", "#2A2B2D")
        isik = np.exp(-(((XX - 960) ** 2 + (YY - 950) ** 2) / (2 * 420**2)))[..., None]
        img = img + 70 * isik
        zemin = ((XX - 960) / 520) ** 2 + ((YY - 1150) / 210) ** 2 < 1
        img = np.where(zemin[..., None], hex2("#B49168") * (0.85 + 0.25 * G2[..., None]), img)
        pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(pil)
        for x0, y0, x1, y1 in ((520, 700, 600, 1000), (1300, 660, 1380, 960), (560, 640, 1340, 690)):
            d.rectangle((x0, y0, x1, y1), fill="#ECE7DF")
        d.ellipse((700, 690, 1100, 840), outline="#28332F", width=46)
        for i in range(12):
            a = math.radians(i * 30)
            x, y = 900 + 190 * math.cos(a), 960 + 70 * math.sin(a) - 30 - i * 4
            d.rectangle((x - 9, y - 120, x + 9, y), fill="#F4F1EA")
        d.rectangle((1110, 1210, 1260, 1290), fill="#C9A47A")
        d.arc((1180, 920, 1460, 1120), 200, 340, fill="#C9A47A", width=26)
        d.rectangle((420, 900, 470, 1180), fill="#DF9560")
        return np.asarray(pil, np.float32)
    if ad == "p5":  # rotunda içinden zemin halkası
        img = np.zeros((M, M, 3), np.float32) + hex2("#E9DCC6")
        isik = np.exp(-(((XX - 960) ** 2 + (YY - 960) ** 2) / (2 * 520**2)))[..., None]
        img = img * (0.55 + 0.45 * isik)
        pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(pil)
        renkler = ["#8a5a3c", "#a0703c", "#6f7f3a", "#3f7a5a", "#2f6f7f", "#3a5a8a", "#5a4a8a", "#8a4a6a", "#a04a3a", "#7a6a3a", "#4a6a5a"]
        for i, c in enumerate(renkler):
            d.pieslice((960 - 360, 960 - 360, 960 + 360, 960 + 360), -90 + i * 360 / 11, -90 + (i + 1) * 360 / 11, fill=c)
        d.ellipse((960 - 250, 960 - 250, 960 + 250, 960 + 250), fill="#F7E6CD")
        d.text((960, 880), "Buradasın", font=F_BURADA, fill="#28332F", anchor="mm")
        d.text((960, 980), "Bugün", font=F_BUGUN, fill="#28332F", anchor="mm")
        d.polygon([(960, 1060), (936, 1100), (984, 1100)], fill="#C9A24A")
        for i in range(12):
            a = math.radians(-90 + i * 30)
            x, y = 960 + SUTUN_R * math.cos(a), 960 + SUTUN_R * math.sin(a)
            d.ellipse((x - 46, y - 46, x + 46, y + 46), fill="#FBF8F2", outline="#B49168", width=4)
            d.text((x, y), f"{i + 1:02d}", font=F_SUTUN, fill="#28332F", anchor="mm")
        d.arc((-200, -1500, 2120, 420), 20, 160, fill="#28332F", width=120)
        return np.asarray(pil, np.float32)
    if ad in ("p6", "p6b"):  # banko plakası (meşe), p6b: + broşür
        cizgi = (np.sin(XX / 7 + G1 * 30) * 0.5 + 0.5) * 0.18 + G2 * 0.12
        img = hex2("#C9A47A") * (0.82 + cizgi[..., None])
        vin = np.clip(1 - (((XX - 760) / 1500) ** 2 + ((YY - 760) / 1500) ** 2), 0.35, 1)[..., None]
        img = img * vin
        if ad == "p6b":
            pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
            kapak = Image.open(f"{VARLIK}/brosur/brosur-01.png").convert("RGB").resize((BR_W, BR_H), Image.LANCZOS)
            golge = Image.new("L", (BR_W + 80, BR_H + 80), 0)
            ImageDraw.Draw(golge).rectangle((40, 40, BR_W + 40, BR_H + 40), fill=110)
            golge = golge.filter(ImageFilter.GaussianBlur(18))
            pil.paste((40, 30, 20), (BR[0][0] - 40 + 9, BR[0][1] - 40 + 15), golge)
            pil.paste(kapak, (BR[0][0], BR[0][1]))
            img = np.asarray(pil, np.float32)
        return img
    raise ValueError(ad)


def yakinlas(img: np.ndarray, k: float, odak) -> np.ndarray:
    """Odak etrafında k kat büyütme (k<1 küçültme; boşluk kenar rengiyle dolar)."""
    if abs(k - 1) < 1e-6:
        return img
    ox, oy = odak
    pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    a = 1 / k
    out = pil.transform((M, M), Image.AFFINE, (a, 0, ox - a * ox, 0, a, oy - a * oy), resample=Image.BILINEAR, fillcolor=tuple(int(c) for c in img[5, 5]))
    return np.asarray(out, np.float32)


def ease(t: float) -> float:
    return -(math.cos(math.pi * t) - 1) / 2


def tepe(a: float, b: float, c: float, x: float) -> float:
    if x <= a or x >= c:
        return 0.0
    return (x - a) / (b - a) if x < b else (c - x) / (c - b)


def yazi(img: np.ndarray, ad: str, f: int, n: int) -> np.ndarray:
    pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(pil)
    # merkez kare (420..1500) içinde, sol üst: iki kırpımda da görünür
    d.rounded_rectangle((450, 450, 1050, 640), 18, fill=(0, 0, 0))
    d.text((480, 470), ad, font=F_AD, fill=(255, 255, 255))
    d.text((480, 575), f"kare {f:03d}/{n:03d}", font=F_SAYAC, fill=(255, 220, 120))
    return np.asarray(pil, np.float32)


def kare_uret(klip: str, tur: str, n: int, a_ad, b_ad, onbellek: dict):
    def S(ad):
        if ad not in onbellek:
            onbellek[ad] = sahne(ad)
        return onbellek[ad]

    for f in range(n):
        t = f / max(1, n - 1)
        if klip == "t01":
            e = ease(t)
            r = 172.5 * (567 / 172.5) ** e
            cy = 768 + (1190 - 768) * e
            img = sahne("p0")
            kure(img, 960, cy, r)
        elif tur == "dongu":
            img = S(a_ad).copy()
            if f > 0:
                # periyodik küçük hareket (P = klip süresi): dikişsiz
                a = 2 * math.pi * f / n
                x, y = 960 + 300 * math.cos(a), 1380 + 60 * math.sin(a)
                pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
                ImageDraw.Draw(pil).ellipse((x - 22, y - 22, x + 22, y + 22), fill=(255, 255, 255))
                img = yazi(np.asarray(pil, np.float32), klip, f, n)
        elif tur == "plaka":
            img = S(a_ad)
        else:
            e = ease(t)
            A = yakinlas(S(a_ad), 1 + 3 * e, ODAK.get(a_ad, (960, 960)))
            B = yakinlas(S(b_ad), 0.35 + 0.65 * e, ODAK.get(b_ad, (960, 960)))
            w = min(1, max(0, (e - 0.25) / 0.5))
            w = w * w * (3 - 2 * w)
            img = A * (1 - w) + B * w
            if klip == "t23":
                p = tepe(0.55, 0.7, 0.85, t)
                img = img * (1 - p * 0.92) + 250 * p * 0.92
            if klip == "t34":
                p = 1.0 if 44 <= f <= 51 else tepe(36, 44, 44.01, f) + tepe(51, 51.01, 60, f)
                img = img * (1 - p * 0.95) + hex2("#FFF1DC") * p * 0.95
        if tur != "dongu" and 0 < f < n - 1:
            img = yazi(img, klip, f, n)
        yield np.clip(img, 0, 255).astype(np.uint8)


def fragman(klip: str, tur: str, n: int, a_ad, b_ad) -> dict:
    fr = {"ad": klip, "fps": FPS, "kare": n, "sure": round(n / FPS, 4), "kamera": {"yer_tutucu": True}}
    if tur == "ileri":
        ka = KADRAJ["p0" if klip == "t01" else a_ad]
        kb = KADRAJ[b_ad]
        fr["kadraj_m"] = [round(ka * (kb / ka) ** ease(f / (n - 1)), 3) for f in range(n)]
    else:
        fr["kadraj_m"] = [KADRAJ[a_ad]] * n
    if klip == "t01":
        fr["dunyaR"] = [round(172.5 * (567 / 172.5) ** ease(f / (n - 1)), 2) for f in range(n)]
        fr["dunyaC"] = [960, 768]
    if tur == "dongu" and a_ad in CAPALAR:
        fr["capalar"] = CAPALAR[a_ad]
    if klip == "t56":
        fr["brosur_dikdortgen"] = BR
    return fr


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cikti", default=f"{VARLIK}/yer-tutucu/render")
    ap.add_argument("--klip", default="")
    arg = ap.parse_args()
    os.makedirs(arg.cikti, exist_ok=True)
    secili = [k for k in KLIPLER if not arg.klip or k in arg.klip.split(",")]
    onbellek: dict = {}
    for klip in secili:
        tur, n, a_ad, b_ad = KLIPLER[klip]
        t0 = time.time()
        yol = os.path.join(arg.cikti, f"{klip}.mkv")
        # testsrc2 iç resmi yalnız geçişlerin ara karelerinde (dikiş kuralı), merkez karenin sağ altında.
        if tur == "ileri":
            vf = f"[0:v][1:v]overlay=x=1080:y=1250:enable='between(n,1,{n - 2})',format=yuv420p[v]"
        else:
            vf = "[0:v]format=yuv420p[v]"
        cmd = [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{M}x{M}", "-r", str(FPS), "-i", "-",
            "-f", "lavfi", "-i", f"testsrc2=s=384x216:r={FPS}:d={n / FPS + 1}",
            "-filter_complex", vf, "-map", "[v]", "-frames:v", str(n),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "8", "-g", str(n), yol,
        ]
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        for kare in kare_uret(klip, tur, n, a_ad, b_ad, onbellek):
            p.stdin.write(kare.tobytes())
        p.stdin.close()
        if p.wait() != 0:
            sys.exit(f"ffmpeg hata: {klip}")
        with open(os.path.join(arg.cikti, f"{klip}.json"), "w", encoding="utf-8") as fp:
            json.dump(fragman(klip, tur, n, a_ad, b_ad), fp, ensure_ascii=False)
        print(f"{klip}: {n} kare, {time.time() - t0:.1f} s, {os.path.getsize(yol) / 1e6:.1f} MB", flush=True)


if __name__ == "__main__":
    main()
