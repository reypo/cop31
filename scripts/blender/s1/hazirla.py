"""S1 (dış sahne) doku ve geometri hazırlığı — sistem Python'u (numpy, PIL, rasterio, shapely; `su` için scipy).

    python -X utf8 -P hazirla.py [su|dunya|c1|rolyef|s2|arazi|osm|hepsi] [--varlik D:/soft/cop31-varlik]
    python -X utf8 -P hazirla.py s2 --mevsim ilkbahar        # G4: s2_{bolge,genis,yakin}_ilkbahar.jpg (Kasım dosyaları durur)

Çıktı: <varlik>/s1/tex/ (depo dışı); `su` → <varlik>/dunya/su-maskesi-*.png (+ .c-yedek.png, su-maskesi.json) ve
<varlik>/render-son/_onizleme/s1-maske-fark.png (kaynak: GEBCO bath + elev, BMNG Kasım). Bellek: 21600'lük kaynaklar
rasterio pencereleriyle kırpılarak okunur, büyük diziler bant bant işlenir (tepe ≈ 1,5 GB; `su` için bkz. BENIOKU D turu).

Çerçeveler
- Küre (Dünya-sabit, birim küre): +Z kuzey, +X (0 K, 0 D), +Y (0 K, 90 D). UV u=(boylam+180)/360, v=(enlem+90)/180.
- Dünya (Blender, metre): Expo teğet düzlemi, orijin Expo deniz seviyesi; X doğu, Y kuzey, Z yukarı.
  R = 6371008,8 (expo-yerel-m'nin eqc yarıçapı). Dünya merkezi (0, 0, −R).
- expo-yerel-m (R1): x doğu, y GÜNEY; Blender X = x, Y = −y. Arazi köşeleri gerçek küre yüzeyine (enlem/boylam →
  ECEF → ENU) oturtulur; doku koordinatı olarak eqc (x, y) ayrıca saklanır.
"""
import argparse
import json
import math
import os
import sys
import time

import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from geo import LAT0, LON0, KX, KY, R, eqc_latlon, latlon_enu  # noqa: E402

p = argparse.ArgumentParser()
p.add_argument("is_", nargs="?", default="hepsi")
p.add_argument("--varlik", default="D:/soft/cop31-varlik")
# G turu (brief §14.4.5, G4): s2 işinin kaynak sahnesi. kasim (varsayılan): s2-*-kasim → s2_{bolge,genis,yakin}.jpg (bayt
# bayt eskisi); ilkbahar: s2-*-ilkbahar → s2_{bolge,genis,yakin}_ilkbahar.jpg (aynı 45→70 km C1 halka düzeltmesi). Yalnız
# `s2` işiyle geçerli (öteki işler mevsimden bağımsız; dunya/c1'in S2 deniz rengi Kasım bölge mozaiğinden kalır).
p.add_argument("--mevsim", default="kasim", choices=["kasim", "ilkbahar"])
a = p.parse_args()
V = a.varlik
OUT = os.path.join(V, "s1", "tex")
os.makedirs(OUT, exist_ok=True)
T0 = time.time()


def log(*s):
    print(f"[{time.time() - T0:6.1f} s]", *s, flush=True)


def rio():
    import rasterio
    import warnings
    warnings.filterwarnings("ignore", category=rasterio.errors.NotGeoreferencedWarning)
    return rasterio


def oku_pencere(yol, sutun, satir, gen, yuk, bantlar=None):
    """GeoTIFF/JPEG/PNG'den piksel penceresi (bellekte yalnız pencere)."""
    rasterio = rio()
    from rasterio.windows import Window
    with rasterio.open(yol) as r:
        b = bantlar or list(range(1, r.count + 1))
        return r.read(b, window=Window(sutun, satir, gen, yuk))


def deniz_duzle(img, su, uzak_px, bul_px, derin, sig):
    """Batimetri kabartmasını sil (uydu görüntüsünde görünmez), kıyıya göre sığ/derin tonu koru (R2 yama_duz.py).
    img: PIL RGB, su: float32 0..1 (aynı boyut). Bant bant karıştırılır."""
    uzak = np.asarray(Image.fromarray((su * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(uzak_px)),
                      np.float32) / 255
    bul = img.filter(ImageFilter.GaussianBlur(bul_px))
    A = np.asarray(img); B = np.asarray(bul)
    out = np.empty_like(A)
    derin = np.array(derin, np.float32); sig = np.array(sig, np.float32)
    h = A.shape[0]
    for y0 in range(0, h, 1024):
        y1 = min(h, y0 + 1024)
        u3 = uzak[y0:y1, :, None] ** 3
        ton = sig * (1 - u3) + derin * u3
        deniz = 0.40 * B[y0:y1].astype(np.float32) + 0.60 * ton
        m = np.clip((su[y0:y1] - 0.5) * 4 + 0.5, 0, 1)[..., None]
        out[y0:y1] = np.clip(A[y0:y1] * (1 - m) + deniz * m, 0, 255).astype(np.uint8)
    return Image.fromarray(out)


def s2_deniz_rengi():
    """S2 bölge mozaiğinde açık deniz ortalama rengi (BMNG deniz tonunu buna eşitlemek için)."""
    m = np.asarray(Image.open(os.path.join(V, "dem", "deniz-maskesi-bolge-50m.png")).convert("L"), np.float32) / 255
    s = np.asarray(Image.open(os.path.join(V, "sentinel", "s2-bolge-kasim-4096.png")).convert("RGB")
                   .resize((3072, 3072), Image.BILINEAR), np.float32)
    # kıyıdan uzak (erozyonlu maske) piksel
    me = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(31)), np.float32) / 255
    sel = me > 0.99
    return s[sel].mean(0), int(sel.sum())


# ---------------------------------------------------------------------------------------------- su maskesi (D turu)
# C turu maskesi = GEBCO_08 bath PNG'de değer < 255 (deniz seviyesi altı; birebir doğrulandı). Deniz seviyesi altındaki
# kara (Katara −133 m …) okyanus gölgelendiricisi ve deniz_duzle tonuyla koyu göl gibi görünüyordu (A3-02, brief §11.6-6).
# Kural: GEBCO < 0 piksellerinin 8-bağlı bileşenleri (x döngüsel, kutup satırları tek nokta). Bir bileşen KARA olur ⇔
#   (1) tohum içermez (SU_TOHUM: okyanus + beş göl),
#   (2) BMNG Kasım'da "su benzeri" piksel oranı < SU_KARA_ORAN (su benzeri: c1() mavi sınıflayıcısı ya da luma < 70),
#   (3) U-bağlantısı yok: U = (bath < 255) ∪ (elev8 == 0: deniz ya da ~0–25 m alçak kıyı/sığ su) içinde hiçbir tohumun
#       U-bileşenine düşmez. 8 bitlik bath'ta sığ kıyı suyu 255 (Kuveyt Körfezi, Cook Inlet, Martaban, Amazon şelfi,
#       Azak) → kıyı lagünü ve haliç parçaları C maskesinde okyanustan kopuk görünür ve renkleri (yeşil/kahverengi
#       bulanık su) (2)'yi geçer; (3) onları okyanusa geri bağlar (D1 incelemesi: Kalmat Khor, kuzeydoğu Hazar sığlığı,
#       Knik Arm, Amazon ağzı …). SU_KARA_ZORLA bölgelerinde (3) ve (4) uygulanmaz: alçak kıyı ovası üzerinden bağlı
#       görünen kara çöküntüler (Danakil, Afar, Sabhat Ghuzayyil, Laguna Salada); yalnız (2)'yi geçen aday kara olur.
#   (4) tutulan suya (okyanus, tohumlu göller, renkten, U-bağlantısından ya da bu kuraldan tutulanlar; yinelemeli) en kısa
#       uzaklığı > SU_KIYI_KM (kıyı koruması: deniz_duzle'nin kıyı bulanıklığı 8k'da σ 3 px ≈ 15 km, C1'de σ 14 px ≈
#       6,5 km; 10 km'de C1 deniz tonu 25 km öteye dek 44/255'e kadar oynadı, 30 km'de oynamaz — ölçüldü).
# (2)+(3)+(4) yalnız-bağlantı kuralının yıkımını önler: 8 bitlik bath PNG'de sığ boğazlar 255 (İstanbul Boğazı, Danimarka
# boğazları, Azak) → yalnız bath bağlantısıyla Karadeniz, Baltık, Marmara, Botni ve 8.700 kıyı/lagün parçası (1,22 milyon
# km²) kara olurdu (ölçüldü). Su yalnız kara olur; kara hiçbir pikselde su olmaz. SU_KONTROL tutmazsa maske yazılmaz.
SU_TOHUM = {"Atlantik": (0.0, -30.0), "Pasifik": (0.0, -150.0),
            "Hazar Denizi": (42.0, 50.0), "Lut Gölü": (31.5, 35.5), "Taberiye Gölü": (32.8, 35.6),
            "Salton Gölü": (33.3, -115.8), "Assal Gölü": (11.65, 42.4)}
SU_KARA_ORAN = 0.2       # kara bileşenlerde ≤ 0,06, su bileşenlerinde ≥ 0,36 ölçüldü (Danakil 0,06; Andros 0,36)
SU_KIYI_KM = 30.0
# (ad, enlem, boylam, yarıçap km): ağırlık merkezi bu dairede olan ADAY (2) bileşenler kara (U-bağlantısı, kıyı koruması yok)
# İlk beşi D1 incelemesinin önerisi; San Julián (−105 m) U-bağlantısıyla (dar bir vadi) su kalıyordu, BMNG'de kuru kara,
# tutulan suya 31,5 km. Hazar kuzeydoğusundaki sorlar bilerek listede yok: tutulan su lekelerine 4–9 km (kıyı tonu oynar)
# ve Hazar tohum bileşeni zaten kıyı ovasını su sayıyor (BENIOKU D turu).
SU_KARA_ZORLA = [("Danakil Çöküntüsü", 13.90, 40.54, 60.0), ("Afar güneyi (Danakil)", 13.10, 41.25, 50.0),
                 ("Sabhat Ghuzayyil (Libya)", 29.79, 19.71, 30.0), ("Sabhat güneyi (Libya)", 29.20, 20.10, 30.0),
                 ("Laguna Salada (Meksika)", 32.35, -115.66, 30.0),
                 ("Gran Bajo de San Julián (Arjantin)", -49.55, -68.35, 25.0)]
# Kabul denetimi (ad, enlem, boylam, ±derece, beklenen). su: kutuda eski su var ve değişen 0. kara: kutudaki eski su
# piksellerinin hepsi kara. Noktadaki piksel eski suysa bileşenin eski/yeni pikseli de yazılır.
SU_KONTROL = [
    ("Kalmat Khor (Pakistan)", 25.434, 64.096, 0.15, "su"), ("Hazar KD sığlığı", 46.409, 52.529, 0.15, "su"),
    ("Knik Arm (Alaska)", 61.458, -149.545, 0.15, "su"),
    ("Amazon ağzı 1", 1.987, -50.164, 0.15, "su"), ("Amazon ağzı 2", 0.706, -49.639, 0.15, "su"),
    ("Amazon ağzı 3", 0.385, -49.432, 0.15, "su"), ("Amazon ağzı 4", 1.75, -49.853, 0.15, "su"),
    ("Sittaung / Martaban 1", 16.946, 97.043, 0.15, "su"), ("Sittaung / Martaban 2", 16.662, 96.915, 0.15, "su"),
    ("Sittaung / Martaban 3", 17.042, 97.142, 0.15, "su"),
    ("Meghna haliçi 1", 22.688, 91.445, 0.15, "su"), ("Meghna haliçi 2", 22.606, 91.319, 0.15, "su"),
    ("Kuveyt Körfezi 1", 29.569, 48.018, 0.15, "su"), ("Kuveyt Körfezi 2", 29.656, 48.158, 0.15, "su"),
    ("Kuveyt Körfezi 3", 29.382, 47.737, 0.15, "su"),
    ("Nelson kıyısı (Hudson) 1", 57.083, -92.009, 0.15, "su"), ("Nelson kıyısı (Hudson) 2", 57.156, -91.649, 0.15, "su"),
    ("Laizhou körfezi 1", 37.14, 119.10, 0.15, "su"), ("Laizhou körfezi 2", 37.09, 119.24, 0.15, "su"),
    ("Laizhou körfezi 3", 37.07, 119.60, 0.15, "su"),
    ("King Sound (Avustralya)", -17.09, 123.79, 0.15, "su"), ("Broad Sound (Avustralya)", -22.27, 149.61, 0.15, "su"),
    ("Hazar orta", 42.0, 50.0, 0.05, "su"), ("Hazar kuzey", 46.0, 51.0, 0.05, "su"), ("Hazar güney", 38.0, 51.0, 0.05, "su"),
    ("Lut Gölü", 31.5, 35.5, 0.05, "su"), ("Taberiye Gölü", 32.8, 35.6, 0.03, "su"),
    ("Salton Gölü", 33.3, -115.8, 0.05, "su"), ("Assal Gölü", 11.65, 42.4, 0.02, "su"),
    ("Karadeniz", 43.0, 34.0, 0.05, "su"), ("Marmara", 40.75, 28.0, 0.05, "su"), ("Baltık", 58.0, 20.0, 0.05, "su"),
    ("Akdeniz (Antalya Körfezi)", 36.5, 31.0, 0.05, "su"), ("Kızıldeniz", 20.0, 38.5, 0.05, "su"),
    ("Basra Körfezi", 27.0, 51.0, 0.05, "su"),
    ("Katara Çöküntüsü", 29.6, 27.3, 0.10, "kara"), ("Danakil Çöküntüsü", 13.9, 40.54, 0.05, "kara"),
    ("Turfan Çöküntüsü", 42.725, 89.321, 0.05, "kara"), ("Ölüm Vadisi", 36.284, -116.857, 0.05, "kara"),
    ("Şott Melrir", 34.25, 6.277, 0.05, "kara"), ("Karınjarık (Kazakistan)", 42.92, 54.44, 0.05, "kara"),
    ("Sabhat Ghuzayyil (Libya)", 29.793, 19.713, 0.05, "kara"), ("Laguna Salada (Meksika)", 32.291, -115.653, 0.05, "kara"),
    ("Bajo del Gualicho (Arjantin)", -40.385, -65.263, 0.05, "kara"),
    ("Gran Bajo de San Julián (Arjantin)", -49.547, -68.348, 0.05, "kara")]
SU_YER = [("Katara Çöküntüsü", 29.6, 27.3), ("Siva Vahası", 29.2, 25.5), ("Sabhat Ghuzayyil (Libya)", 29.8, 19.7),
          ("Şott Melrir", 34.15, 6.2), ("Şott el-Cerid", 33.7, 8.4), ("Danakil Çöküntüsü", 13.9, 40.5),
          ("Afar güneyi (Danakil)", 12.9, 41.2), ("Turfan Çöküntüsü", 42.7, 89.3), ("Ölüm Vadisi", 36.25, -116.85),
          ("Laguna Salada / Mexicali", 32.3, -115.6), ("Karagiye Çöküntüsü", 43.5, 51.7),
          ("Karınjarık (Kazakistan)", 42.92, 54.44), ("Huzistan ovası? (İran)", 30.1, 49.5),
          ("Aftout es-Saheli? (Moritanya)", 18.8, -15.9), ("Eyre Gölü", -28.4, 137.3),
          ("Blanche Gölü? (Avustralya)", -29.26, 139.67), ("Karun Gölü / Feyyum", 29.45, 30.6),
          ("Natron Vadisi", 30.4, 30.3), ("Tai Gölü? (Çin; gerçek göl)", 31.2, 120.2),
          ("Bajo del Gualicho (Arjantin)", -40.4, -65.3), ("Gran Bajo de San Julián (Arjantin)", -49.6, -68.4),
          ("Sebha Tah (Fas)", 27.7, -12.8), ("Alexandrina Gölü? (Avustralya; gerçek göl)", -35.45, 139.15),
          ("Kalmat Khor (Pakistan; kıyı lagünü)", 25.43, 64.10), ("Hazar KD sığlığı", 46.41, 52.53),
          ("Knik Arm (Alaska; gelgit kolu)", 61.46, -149.55), ("Amazon ağzı / Amapá şelfi", 1.2, -49.8),
          ("Sittaung haliçi / Martaban", 16.9, 97.0), ("Meghna haliçi", 22.65, 91.4),
          ("Kuveyt Körfezi kıyısı", 29.55, 48.0), ("Nelson kıyısı (Hudson)", 57.1, -91.8),
          ("Laizhou körfezi kıyısı", 37.1, 119.3), ("King Sound (Avustralya)", -17.09, 123.79),
          ("Broad Sound (Avustralya)", -22.27, 149.61), ("Kutch Rann'ı? (Hindistan)", 23.9, 69.4)]


def _sarmali(lab, n):
    """ndimage etiketi → bileşen: x döngüsel (antimeridyen, 8-bağlı) ve kutup satırları (tek nokta) eşdeğerlikleri."""
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    H, W = lab.shape
    ea, eb = [np.zeros(0, np.int64)], [np.zeros(0, np.int64)]
    L0, L1 = lab[:, 0], lab[:, W - 1]
    for d in (-1, 0, 1):
        y = np.arange(max(0, -d), min(H, H - d))
        u, v = L1[y], L0[y + d]
        ok = (u > 0) & (v > 0)
        ea.append(u[ok]); eb.append(v[ok])
    for satir in (0, H - 1):
        r = np.unique(lab[satir][lab[satir] > 0])
        ea.append(r[:-1]); eb.append(r[1:])
    ea = np.concatenate(ea).astype(np.int64); eb = np.concatenate(eb).astype(np.int64)
    nc, cc = connected_components(coo_matrix((np.ones(len(ea)), (ea, eb)), shape=(n + 1, n + 1)), directed=False)
    return nc, cc.astype(np.int32)


def su():
    from scipy import ndimage
    from PIL import ImageDraw, ImageFont
    Dd = os.path.join(V, "dunya")
    B = np.asarray(Image.open(os.path.join(Dd, "gebco_08_rev_bath_21600x10800.png")))    # P kipi, gri palet: indeks = değer
    H, W = B.shape
    su0 = B < 255
    del B
    S8 = np.ones((3, 3), bool)
    lab, n = ndimage.label(su0, structure=S8)
    nc, cc = _sarmali(lab, n)
    K0 = int(cc[0])                                               # etiket 0 = kara (kendi başına bileşen)
    log("su: etiket", n, "bileşen", nc - 1)

    def piksel(la, lo):
        return min(H - 1, int((90 - la) * 60)), int((lo + 180) * 60) % W

    # (3) U-bağlantısı: U-bileşeni bir tohum içeren C bileşenleri (C bileşeni ⊂ tek U bileşeni, çünkü su0 ⊂ U)
    E = np.asarray(Image.open(os.path.join(Dd, "gebco_08_rev_elev_21600x10800.png")).convert("L"))
    U = su0 | (E == 0)
    del E
    labU, nU = ndimage.label(U, structure=S8)
    del U
    ncU, ccU = _sarmali(labU, nU)
    tohumU = {ad: int(ccU[labU[piksel(la, lo)]]) for ad, (la, lo) in SU_TOHUM.items()}
    sU = sorted(set(tohumU.values()))
    sU_ad = [", ".join(ad for ad, c in tohumU.items() if c == u) for u in sU]
    sidx = np.full(ncU, -1, np.int16)
    for i, c in enumerate(sU):
        sidx[c] = i
    bag_lab = np.full(n + 1, -1, np.int16)
    for y0 in range(0, H, 540):
        l = lab[y0:y0 + 540]; m = l > 0
        bag_lab[l[m]] = sidx[ccU[labU[y0:y0 + 540][m]]]
    del labU, ccU, sidx
    bagC = np.full(nc, -1, np.int16); bagC[cc[1:]] = bag_lab[1:]
    log("su: U etiket", nU, "bileşen", ncU - 1, "tohum U-bileşenleri", sU_ad)
    # bileşen başına: piksel, alan (cos enlem), ağırlık merkezi, BMNG su benzeri oranı, ortalama renk (bant bant)
    RGB = np.asarray(Image.open(os.path.join(Dd, "world.topo.bathy.200411.3x21600x10800.jpg")).convert("RGB"))
    cosl = np.cos(np.radians(90 - (np.arange(H) + 0.5) / 60))
    lon = np.radians((np.arange(W) + 0.5) / 60 - 180)
    S = {k: np.zeros(nc) for k in ("px", "alan", "y", "cx", "sx", "sb", "r", "g", "b")}
    for y0 in range(0, H, 270):
        y1 = min(H, y0 + 270)
        l = lab[y0:y1]; m = l > 0
        c = cc[l[m]]
        w = np.broadcast_to(cosl[y0:y1, None], l.shape)[m]
        xl = np.broadcast_to(lon[None, :], l.shape)[m]
        p = RGB[y0:y1][m].astype(np.int16)
        luma = 0.2126 * p[:, 0] + 0.7152 * p[:, 1] + 0.0722 * p[:, 2]
        sb = ((p[:, 2] > np.maximum(p[:, 0], p[:, 1]) + 8) & (p[:, 0] < 90)) | (luma < 70)
        S["px"] += np.bincount(c, minlength=nc)
        S["alan"] += np.bincount(c, weights=w, minlength=nc)
        S["y"] += np.bincount(c, weights=np.broadcast_to(np.arange(y0, y1, dtype=np.float64)[:, None], l.shape)[m] * w,
                              minlength=nc)
        S["cx"] += np.bincount(c, weights=np.cos(xl) * w, minlength=nc)
        S["sx"] += np.bincount(c, weights=np.sin(xl) * w, minlength=nc)
        S["sb"] += np.bincount(c, weights=sb.astype(np.float64), minlength=nc)
        for i, k in enumerate("rgb"):
            S[k] += np.bincount(c, weights=p[:, i].astype(np.float64), minlength=nc)
    PX = 2 * math.pi * 6371.0088 / 21600                          # km / piksel (meridyen)
    km2 = S["alan"] * PX * PX
    enlem = 90 - (S["y"] / np.maximum(S["alan"], 1e-12) + 0.5) / 60
    boylam = np.degrees(np.arctan2(S["sx"], S["cx"]))
    sb_oran = S["sb"] / np.maximum(S["px"], 1)
    renk = np.stack([S[k] for k in "rgb"], -1) / np.maximum(S["px"], 1)[:, None]
    log("su: istatistik")

    def hav(la1, lo1, la2, lo2):
        f1, f2 = np.radians(la1), np.radians(la2)
        h = np.sin((f2 - f1) / 2) ** 2 + np.cos(f1) * np.cos(f2) * np.sin(np.radians(np.asarray(lo2) - lo1) / 2) ** 2
        return 2 * 6371.0088 * np.arcsin(np.sqrt(np.clip(h, 0, 1)))

    tohum = {}
    for ad, (la, lo) in SU_TOHUM.items():
        yy, xx = piksel(la, lo)
        if lab[yy, xx] == 0:
            raise SystemExit(f"su: tohum karada: {ad} ({la}, {lo})")
        tohum[ad] = int(cc[lab[yy, xx]])
    okyanus = tohum["Atlantik"]
    if tohum["Pasifik"] != okyanus:
        raise SystemExit("su: Atlantik ve Pasifik aynı bileşende değil")
    tohumlu = set(tohum.values())
    tut = np.ones(nc, bool); tut[K0] = False
    aday = [c for c in range(nc) if c != K0 and c not in tohumlu and sb_oran[c] < SU_KARA_ORAN]
    aday_a = np.array(aday)
    zorla = {}
    for ad, la, lo, r_km in SU_KARA_ZORLA:
        es = aday_a[hav(la, lo, enlem[aday_a], boylam[aday_a]) <= r_km]
        if not len(es):
            raise SystemExit(f"su: zorunlu kara bölgesinde aday bileşen yok: {ad}")
        for c in es:
            zorla[int(c)] = ad
    bag_tut = [c for c in aday if bagC[c] >= 0 and c not in zorla]
    aday_k = [c for c in aday if bagC[c] < 0 or c in zorla]            # kıyı korumasına kalan (zorunlular dahil)
    tut[aday_k] = False
    log("su: aday", len(aday), "U-bağlantısından tutulan", len(bag_tut), "zorunlu kara", len(zorla))
    # aday pencereleri (find_objects, x döngüsel)
    sl = ndimage.find_objects(lab)
    adayk = np.zeros(nc, bool); adayk[aday_k] = True
    etk = {}
    for l_ in range(1, n + 1):
        if adayk[cc[l_]]:
            etk.setdefault(int(cc[l_]), []).append(l_)
    pen = {}
    for c, ls in etk.items():
        cs = [(sl[l_ - 1][1].start, sl[l_ - 1][1].stop) for l_ in ls]
        if len(ls) > 1 and min(a_ for a_, _ in cs) == 0 and max(b_ for _, b_ in cs) == W:
            cs = [(a_ + W, b_ + W) if (a_ + b_) / 2 < W / 2 else (a_, b_) for a_, b_ in cs]
        pen[c] = (min(sl[l_ - 1][0].start for l_ in ls), max(sl[l_ - 1][0].stop for l_ in ls),
                  min(a_ for a_, _ in cs), max(b_ for _, b_ in cs))

    def uzaklik(c, tut_lab, marj=150.0):
        """Bileşenden tutulan suya en kısa uzaklık (km; pencere içinde, yoksa inf)."""
        r0, r1, c0, c1_ = pen[c]
        cl = max(0.05, math.cos(math.radians(90 - (r0 + r1) / 120)))
        mr, mc = int(marj / PX) + 2, min(W // 2, int(marj / (PX * cl)) + 2)
        R0, R1 = max(0, r0 - mr), min(H, r1 + mr)
        cols = np.arange(c0 - mc, c1_ + mc) % W
        lw = lab[R0:R1][:, cols]
        kw = tut_lab[lw]
        if not kw.any():
            return math.inf
        dt = ndimage.distance_transform_edt(~kw, sampling=(PX, PX * cl))
        return float(dt[np.isin(lw, etk[c])].min())

    uz = {}
    gecis = 0
    while True:
        gecis += 1
        tut_lab = tut[cc]; tut_lab[0] = False
        ek = []
        for c in aday_k:
            if tut[c]:
                continue
            uz[c] = uzaklik(c, tut_lab)
            if uz[c] <= SU_KIYI_KM and c not in zorla:
                ek.append(c)
        log(f"su: kıyı koruması geçiş {gecis}: +{len(ek)}")
        if not ek:
            break
        tut[ek] = True
    sil = [c for c in aday if not tut[c]]
    sil_lab = np.zeros(n + 1, bool); sil_lab[1:] = ~tut[cc[1:]] & (cc[1:] != K0)
    degisen = sil_lab[lab]
    yeni = su0 & ~degisen
    # doğrulama: okyanus ve tohum bileşenlerinde eski/yeni su pikseli (bant bant sayım, kuruluştan bağımsız)
    tsay = {c: [0, 0] for c in tohumlu}
    for y0 in range(0, H, 540):
        cl = cc[lab[y0:y0 + 540]]
        for c in tohumlu:
            m = cl == c
            tsay[c][0] += int(su0[y0:y0 + 540][m].sum()); tsay[c][1] += int(yeni[y0:y0 + 540][m].sum())
    # kabul denetimi (kutu sayımı etiketlerden bağımsız)
    kontrol = []
    for ad, la, lo, r, bek in SU_KONTROL:
        ya, yb = max(0, int((90 - la - r) * 60)), min(H, int(math.ceil((90 - la + r) * 60)))
        xk = np.arange(int(math.floor((lo - r + 180) * 60)), int(math.ceil((lo + r + 180) * 60))) % W
        e_ = int(su0[ya:yb][:, xk].sum()); d_ = int(degisen[ya:yb][:, xk].sum())
        o = {"ad": ad, "enlem": la, "boylam": lo, "kutu_derece": r, "beklenen": bek, "kutu_eski_su_px": e_,
             "kutu_degisen_px": d_}
        yy, xx = piksel(la, lo)
        if lab[yy, xx]:
            c = int(cc[lab[yy, xx]])
            o["bilesen_px_eski"] = int(S["px"][c]); o["bilesen_px_yeni"] = int(S["px"][c]) if tut[c] else 0
        o["tamam"] = bool(e_ > 0 and (d_ == 0 if bek == "su" else d_ == e_))
        kontrol.append(o)
    del lab, cl
    ys, xs = np.nonzero(degisen)
    olc = {"degisen_px_21600": int(len(ys)), "kara_olan_su_px": int((yeni & ~su0).sum()),
           "eski_su_px": int(su0.sum()), "yeni_su_px": int(yeni.sum()),
           "okyanus_px_eski": tsay[okyanus][0], "okyanus_px_yeni": tsay[okyanus][1],
           "okyanus_degisen_px": tsay[okyanus][0] - tsay[okyanus][1],
           "tohum": {ad: {"bilesen_km2": round(float(km2[c]), 1), "px_eski": tsay[c][0], "px_yeni": tsay[c][1],
                          "degisen_px": tsay[c][0] - tsay[c][1]} for ad, c in tohum.items()},
           "silinen_bilesen": len(sil), "silinen_km2": round(float(km2[sil].sum()), 1),
           "aday": len(aday), "aday_km2": round(float(km2[aday].sum()), 1),
           "U_baglantisindan_tutulan": len(bag_tut), "U_baglantisindan_tutulan_km2": round(float(km2[bag_tut].sum()), 1),
           "zorunlu_kara_bilesen": len(zorla), "zorunlu_kara_km2": round(float(km2[list(zorla)].sum()), 1),
           "aday_kiyida_tutulan": int(sum(1 for c in aday_k if tut[c])),
           "aday_kiyida_tutulan_km2": round(float(sum(km2[c] for c in aday_k if tut[c])), 1),
           "renkten_tutulan": int(sum(1 for c in range(nc) if c != K0 and c not in tohumlu and sb_oran[c] >= SU_KARA_ORAN)),
           "renkten_tutulan_km2": round(float(sum(km2[c] for c in range(nc) if c != K0 and c not in tohumlu
                                                  and sb_oran[c] >= SU_KARA_ORAN)), 1),
           "degisen_en_yakin_tutulan_su_km": round(min(uz[c] for c in sil), 2) if sil else None,
           "zorunlu_disi_degisen_en_yakin_tutulan_su_km":
               round(min((uz[c] for c in sil if c not in zorla), default=math.inf), 2),
           "kontrol_tamam": sum(o["tamam"] for o in kontrol), "kontrol_toplam": len(kontrol)}
    la_d = 90 - (ys + 0.5) / 60; lo_d = (xs + 0.5) / 60 - 180
    olc["expo_en_yakin_degisen_km"] = round(float(hav(LAT0, LON0, la_d, lo_d).min()), 1) if len(ys) else None
    olc["c1_kutusunda_degisen_px"] = int(((la_d > C1_ENLEM[0]) & (la_d < C1_ENLEM[1]) & (lo_d > C1_BOYLAM[0])
                                          & (lo_d < C1_BOYLAM[1])).sum())
    for o in kontrol:
        log(f"su: denetim {'TAMAM ' if o['tamam'] else 'TUTMADI'} {o['ad']:32s} {o['beklenen']:4s} kutu eski su "
            f"{o['kutu_eski_su_px']:6d} değişen {o['kutu_degisen_px']:6d} bileşen "
            f"{o.get('bilesen_px_eski', '-')} → {o.get('bilesen_px_yeni', '-')}")
    if not all(o["tamam"] for o in kontrol):
        raise SystemExit("su: kabul denetimi tutmadı — maske yazılmadı")
    # yazım: önce C maskesinin yedeği (yoksa; C tanımından, yani bath<255'ten yazılır), sonra yeni 21600 + 8192
    # (BOX = C turundaki 8k ile birebir yöntem)
    c21 = Image.fromarray((su0 * 255).astype(np.uint8))
    m8_eski = c21.resize((8192, 4096), Image.BOX)
    for ad, im_ in (("su-maskesi-21600x10800", c21), ("su-maskesi-8192x4096", m8_eski)):
        yedek = os.path.join(Dd, ad + ".c-yedek.png")
        if not os.path.exists(yedek):
            im_.save(yedek)
            log("su: yedek (C tanımından)", yedek)
    del c21
    m8_eski = np.asarray(m8_eski)
    olc["c_21600_yedek_birebir"] = bool(np.array_equal(
        su0, np.asarray(Image.open(os.path.join(Dd, "su-maskesi-21600x10800.c-yedek.png")).convert("L")) > 127))
    olc["c_8k_yedek_birebir"] = bool(np.array_equal(
        m8_eski, np.asarray(Image.open(os.path.join(Dd, "su-maskesi-8192x4096.c-yedek.png")).convert("L"))))
    del su0
    yeni8 = (yeni * 255).astype(np.uint8)
    del yeni
    im = Image.fromarray(yeni8)
    im.save(os.path.join(Dd, "su-maskesi-21600x10800.png"))
    m8 = im.resize((8192, 4096), Image.BOX); m8.save(os.path.join(Dd, "su-maskesi-8192x4096.png"))
    del im
    olc["degisen_px_8192"] = int((np.asarray(m8) != m8_eski).sum())
    olc["degisen_px_8192_tam"] = int(((np.asarray(m8) == 0) & (m8_eski == 255)).sum())

    def ad_bul(la, lo):
        en = None
        for ad, gla, glo in SU_YER:
            d = math.hypot(la - gla, (lo - glo) * math.cos(math.radians(la)))
            if d < 1.0 and (en is None or d < en[0]):
                en = (d, ad)
        return en[1] if en else ""

    def kayit(c, **ek_):
        return {"enlem": round(float(enlem[c]), 3), "boylam": round(float(boylam[c]), 3), "km2": round(float(km2[c]), 1),
                "px": int(S["px"][c]), "su_benzeri": round(float(sb_oran[c]), 3),
                "rgb": [int(round(v)) for v in renk[c]], "ad": ad_bul(enlem[c], boylam[c]), **ek_}

    liste = sorted((kayit(c, kiyi_km=None if math.isinf(uz[c]) else round(uz[c], 1), zorunlu=zorla.get(c, ""))
                    for c in sil), key=lambda o: -o["km2"])
    bag_liste = sorted((kayit(c, tohum=sU_ad[bagC[c]]) for c in bag_tut), key=lambda o: -o["km2"])
    json.dump({"kural": "GEBCO_08 bath<255 bileşenleri (8-bağlı, x döngüsel, kutuplar tek nokta); tohumsuz VE BMNG Kasım "
                        "su benzeri oranı < SU_KARA_ORAN VE U=(bath<255 ∪ elev8==0) içinde tohuma bağlı değil (SU_KARA_ZORLA "
                        "bölgelerinde bu koşul yok) VE tutulan suya > SU_KIYI_KM km (SU_KARA_ZORLA'da yok) olan bileşen kara",
               "tohum": SU_TOHUM, "SU_KARA_ORAN": SU_KARA_ORAN, "SU_KIYI_KM": SU_KIYI_KM,
               "SU_KARA_ZORLA": SU_KARA_ZORLA,
               "su_benzeri": "(B > max(R,G)+8 ve R < 90) ya da luma709 < 70, BMNG world.topo.bathy.200411 21600",
               "olcum": olc, "kontrol": kontrol, "silinen": liste, "U_baglantisindan_tutulan": bag_liste},
              open(os.path.join(Dd, "su-maskesi.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    log("su: değişen px", olc["degisen_px_21600"], "bileşen", len(sil), "km²", olc["silinen_km2"],
        "8k değişen", olc["degisen_px_8192"], "Expo'ya en yakın değişen km", olc["expo_en_yakin_degisen_km"],
        "denetim", f"{olc['kontrol_tamam']}/{olc['kontrol_toplam']}")
    # fark haritası: Dünya (0,1°/px, karartılmış) + kırmızı değişen pikseller + ≥ 100 km² halkalar; altta iki sıra yakın plan
    # (21600 piksel; kırmızı = su → kara, camgöbeği = yeni maskede su kalan). Üst sıra: değişmesi gerekenler; alt sıra:
    # D1 incelemesinin kıyı/haliç bileşenleri (kırmızı olmamalı).
    Wm, Hm = 3600, 1800
    taban = Image.fromarray(RGB).resize((Wm, Hm), Image.BOX)
    taban = Image.eval(taban, lambda v: int(v * 0.55))
    try:
        fnt = ImageFont.truetype("arial.ttf", 30); fnk = ImageFont.truetype("arial.ttf", 22)
    except Exception:
        fnt = fnk = ImageFont.load_default()
    A = np.asarray(taban).copy()
    A[ys // 6, xs // 6] = (255, 40, 40)
    taban = Image.fromarray(A)
    dr = ImageDraw.Draw(taban)
    kutular = []
    for o in liste:
        if o["km2"] < 100:
            continue
        X = (o["boylam"] + 180) * 10; Y = (90 - o["enlem"]) * 10; r = max(10.0, math.sqrt(o["km2"]) / 8)
        dr.ellipse((X - r, Y - r, X + r, Y + r), outline=(255, 60, 60), width=3)
        if o["km2"] >= 400 or (o["ad"] and o["km2"] >= 150):
            t = o["ad"] or f"{o['enlem']:.1f}, {o['boylam']:.1f}"
            tx, ty = X + r + 6, Y - 12
            gw = dr.textlength(t, font=fnk)
            while any(tx < b[2] and tx + gw > b[0] and ty < b[3] and ty + 26 > b[1] for b in kutular):
                ty += 26                                             # çakışan etiketi aşağı kaydır
            kutular.append((tx, ty, tx + gw, ty + 26))
            dr.text((tx, ty), t, fill=(255, 235, 235), font=fnk)
    dr.text((24, 20), f"S1-D1 su maskesi farkı (C → D): kırmızı = su → kara. {olc['degisen_px_21600']:,} px @21600, "
                      f"{len(sil)} bileşen, {olc['silinen_km2']:,.0f} km²; okyanusa bağlı bileşende değişen "
                      f"{olc['okyanus_degisen_px']} px; kara → su 0 px",
            fill=(255, 255, 255), font=fnt)
    zad = ", ".join(dict.fromkeys(ad.split(" (")[0] for ad, *_ in SU_KARA_ZORLA))
    dr.text((24, 58), f"Kural: GEBCO<0 VE tohumsuz VE BMNG'de kara rengi VE U = (bath<255 ya da elev8=0) içinde okyanusa/"
                      f"göle bağlı değil VE kalan suya > {SU_KIYI_KM:g} km. Zorunlu kara: {zad}. "
                      f"Denetim {olc['kontrol_tamam']}/{olc['kontrol_toplam']} tamam",
            fill=(235, 235, 235), font=fnk)
    YAK = [[("Katara / Nil", 24.0, 33.0, 26.5, 32.0), ("Danakil", 39.0, 42.5, 12.0, 15.5),
            ("Ölüm V. / Salton", -118.0, -114.0, 31.5, 37.0), ("Lut / Taberiye", 34.5, 36.5, 30.5, 33.5),
            ("Hazar doğusu", 50.5, 57.0, 41.0, 46.5)],
           [("Kalmat Khor", 63.8, 64.4, 25.2, 25.65), ("Kuveyt Körfezi", 47.55, 48.35, 29.15, 29.85),
            ("Hazar KD", 51.9, 53.2, 45.9, 46.9), ("Knik Arm", -150.3, -149.0, 61.0, 61.7),
            ("Amazon ağzı", -50.6, -49.0, 0.0, 2.3), ("Sittaung / Martaban", 96.5, 97.6, 16.4, 17.4)]]
    satirlar = []
    for Hy, sira in zip((640, 420), YAK):
        parcalar = []
        for ad, lo0, lo1, la0, la1 in sira:
            x0, x1 = int((lo0 + 180) * 60), int((lo1 + 180) * 60); y0, y1 = int((90 - la1) * 60), int((90 - la0) * 60)
            P_ = RGB[y0:y1, x0:x1].astype(np.float32) * 0.8
            km = yeni8[y0:y1, x0:x1] > 0
            P_[km] = P_[km] * 0.6 + np.array([40, 220, 235], np.float32) * 0.4
            dm = degisen[y0:y1, x0:x1]
            P_[dm] = P_[dm] * 0.35 + np.array([255, 40, 40], np.float32) * 0.65
            pi = Image.fromarray(P_.astype(np.uint8)).resize((int((x1 - x0) * Hy / (y1 - y0)), Hy), Image.NEAREST)
            ImageDraw.Draw(pi).text((12, 8), f"{ad} — değişen {int(dm.sum())} px", fill=(255, 255, 255), font=fnk)
            parcalar.append(pi)
        satirlar.append((Hy, parcalar))
    del yeni8
    tuval = Image.new("RGB", (Wm, Hm + sum(h + 20 for h, _ in satirlar)), (12, 12, 16))
    tuval.paste(taban, (0, 0))
    y = Hm + 20
    for Hy, parcalar in satirlar:
        x = 0
        for pi in parcalar:
            tuval.paste(pi, (x, y)); x += pi.size[0] + 20
        y += Hy + 20
    od = os.path.join(V, "render-son", "_onizleme")
    os.makedirs(od, exist_ok=True)
    tuval.save(os.path.join(od, "s1-maske-fark.png"), optimize=True)
    log("su: s1-maske-fark.png")


# ---------------------------------------------------------------------------------------------- Dünya (küresel)
def dunya():
    deniz, n = s2_deniz_rengi()
    log("S2 açık deniz rengi", deniz.round(1), n, "px")
    derin = tuple(float(x) for x in deniz)
    sig = (22.0, 78.0, 112.0)
    # 1) gündüz 21600 → 8192 (RAM/VRAM: süreç ≤ 4 GB, NVIDIA GL sürücüsü dokuların sistem RAM kopyasını tutar;
    #    d1'de disk 1.134 px/180° ≈ 6,3 px/° < 8k'nın 22,7 px/°'si; yakında C1 yaması devralır)
    g = Image.open(os.path.join(V, "dunya", "world.topo.bathy.200411.3x21600x10800.jpg")).convert("RGB")
    g = g.resize((8192, 4096), Image.LANCZOS)
    su = Image.open(os.path.join(V, "dunya", "su-maskesi-21600x10800.png")).convert("L").resize((8192, 4096), Image.BILINEAR)
    su = np.asarray(su, np.float32) / 255
    log("gündüz 16k okundu")
    g = deniz_duzle(g, su, uzak_px=3, bul_px=6, derin=derin, sig=sig)
    g.save(os.path.join(OUT, "gunduz_8k.jpg"), quality=94, subsampling=0)
    g.resize((2048, 1024), Image.LANCZOS).save(os.path.join(OUT, "_onizleme_gunduz.jpg"), quality=88)
    del g, su
    log("gunduz_8k.jpg")
    # 2) paket 8k: R su maskesi, G gece ışığı, B bulut
    su8 = np.asarray(Image.open(os.path.join(V, "dunya", "su-maskesi-8192x4096.png")).convert("L"))
    gece = np.asarray(Image.open(os.path.join(V, "dunya", "BlackMarble_2016_3km.jpg")).convert("RGB")
                      .resize((8192, 4096), Image.LANCZOS)).astype(np.float32)
    # lacivert zemin atılır: ışıklar sarı-beyaz (R yüksek), zemin R düşük (R2 hazirla.py)
    lum = np.clip((gece[..., 0] - 18.0) / (255 - 18.0), 0, 1) ** 1.6
    gece8 = (lum * 255).astype(np.uint8)
    del gece
    bulut = np.asarray(Image.open(os.path.join(V, "dunya", "cloud_combined_8192.tif")).convert("L"))
    Image.fromarray(np.stack([su8, gece8, bulut], -1)).save(os.path.join(OUT, "paket_8k.png"), compress_level=1)
    log("paket_8k.png (R su, G gece, B bulut)")


# ---------------------------------------------------------------------------------------------- C1 yaması (463 m)
# E turu (brief §12.2): 22–46 K / 16–44 D → 22–54 K / 16–48 D (d2 tüm Türkiye: dikey kırpımın kuzeyi ~52 K, yatay
# kırpımın doğusu ~52 D). Yeni şerit (46–54 K ya da 44–48 D) sahne.py'de yalnız alt < 6.000 km'de karışır (`c1_ek_k`);
# eski kutunun içi bayt bayt aynı kalır (pencere ofsetleri tam piksel, JPEG blokları hizalı; ölçüm BENIOKU E turu).
C1_ENLEM = (22.0, 54.0)
C1_BOYLAM = (16.0, 48.0)
C1_ESKI = {"enlem": (22.0, 46.0), "boylam": (16.0, 44.0)}       # D turu kutusu (sahne.py: c1_ek_k = 0'da eski ağırlık)


def c1():
    deniz, _ = s2_deniz_rengi()
    derin = tuple(float(x) for x in deniz)
    sig = (22.0, 78.0, 112.0)
    la0, la1 = C1_ENLEM; lo0, lo1 = C1_BOYLAM
    sut, sat = int(lo0 * 240), int((90 - la1) * 240)
    gen, yuk = int((lo1 - lo0) * 240), int((la1 - la0) * 240)
    arr = oku_pencere(os.path.join(V, "dunya", "world.topo.bathy.200411.3x21600x21600.C1.jpg"), sut, sat, gen, yuk)
    img = np.transpose(arr, (1, 2, 0)).copy(); del arr
    log("C1 penceresi", img.shape)
    # kaba su maskesi (GEBCO, 60 px/°) → ×4; kıyı bandında renk sınıflayıcıyla incelt
    gs = oku_pencere(os.path.join(V, "dunya", "su-maskesi-21600x10800.png"),
                     int((lo0 + 180) * 60), int((90 - la1) * 60), gen // 4, yuk // 4)[0]
    kaba = np.asarray(Image.fromarray(gs).resize((gen, yuk), Image.BILINEAR), np.float32) / 255
    kaba = np.asarray(Image.fromarray((kaba * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)), np.float32) / 255
    su = kaba.copy()
    for y0 in range(0, yuk, 1024):
        y1 = min(yuk, y0 + 1024)
        r_, g_, b_ = (img[y0:y1, :, i].astype(np.int16) for i in range(3))
        mavi = ((b_ > np.maximum(r_, g_) + 8) & (r_ < 90)).astype(np.float32)
        bant = (kaba[y0:y1] > 0.02) & (kaba[y0:y1] < 0.98)
        su[y0:y1] = np.where(bant, mavi, (kaba[y0:y1] > 0.5).astype(np.float32))
    su = np.asarray(Image.fromarray((su * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)), np.float32) / 255
    log("C1 su maskesi, su oranı", round(float(su.mean()), 3))
    out = deniz_duzle(Image.fromarray(img), su, uzak_px=14, bul_px=24, derin=derin, sig=sig)
    out.save(os.path.join(OUT, "c1_yama.jpg"), quality=93, subsampling=0)
    Image.fromarray((su * 255).astype(np.uint8)).resize((gen // 2, yuk // 2), Image.BILINEAR).save(
        os.path.join(OUT, "c1_su.png"))
    out.crop((int((28 - lo0) * 240), int((la1 - 39) * 240), int((35 - lo0) * 240), int((la1 - 34) * 240))) \
        .resize((1050, 750), Image.LANCZOS).save(os.path.join(OUT, "_onizleme_c1.jpg"), quality=88)
    json.dump({"enlem": C1_ENLEM, "boylam": C1_BOYLAM, "px_derece": 240, "boyut": [gen, yuk],
               "eski": C1_ESKI},
              open(os.path.join(OUT, "c1_yama.json"), "w"))
    log("c1_yama.jpg", gen, yuk)


# ---------------------------------------------------------------------------------------------- rölyef (E turu)
ROLYEF_ENLEM = (34.0, 44.0)
ROLYEF_BOYLAM = (24.0, 46.0)
ROLYEF_SIGMA = 1.2


def rolyef():
    """d2 rölyefi (brief §12.2): GEBCO_08 C1 30″ (8 bit, ~26,6 m/birim; 120 px/°) 34–44 K / 24–46 D penceresi, σ 1,2 px
    Gauss (8 bitlik basamakları yumuşatır), 16 bit PNG (0–65535 = 0–255 × 257; deniz 0) → s1/tex/rolyef_tr.png.
    sahne.py: Dunya malzemesinde ShaderNodeBump yüksekliği (Non-Color), kutu rolyef_tr.json."""
    from scipy.ndimage import gaussian_filter
    la0, la1 = ROLYEF_ENLEM; lo0, lo1 = ROLYEF_BOYLAM
    yol = os.path.join(V, "dunya", "gebco_08_rev_elev_C1_grey_geo.tif")
    rasterio = rio()
    with rasterio.open(yol) as r:
        t = r.transform
        px = round(1.0 / t.a)
        assert abs(t.c) < 1e-9 and abs(t.f - 90.0) < 1e-9 and px == 120, (t, px)
    sut, sat = int(round(lo0 * px)), int(round((90 - la1) * px))
    gen, yuk = int(round((lo1 - lo0) * px)), int(round((la1 - la0) * px))
    pay = 8                                                  # kenar etkisi olmasın: pencereyi genişlet, sonra kırp
    h = oku_pencere(yol, sut - pay, sat - pay, gen + 2 * pay, yuk + 2 * pay)[0].astype(np.float32)
    hb = gaussian_filter(h, ROLYEF_SIGMA, mode="nearest")[pay:-pay, pay:-pay]
    h0 = h[pay:-pay, pay:-pay]
    u16 = np.clip(np.round(hb * 257.0), 0, 65535).astype(np.uint16)
    Image.fromarray(u16).save(os.path.join(OUT, "rolyef_tr.png"))                 # uint16 → I;16
    olc = {"enlem": ROLYEF_ENLEM, "boylam": ROLYEF_BOYLAM, "px_derece": px, "boyut": [gen, yuk], "sigma_px": ROLYEF_SIGMA,
           "kaynak": "gebco_08_rev_elev_C1_grey_geo.tif (GEBCO_08, NASA EO)", "olcek": "16 bit = 8 bit x 257; 8 bit ~26,6 m",
           "ham_8bit": {"min": int(h0.min()), "max": int(h0.max()), "ort": round(float(h0.mean()), 2),
                        "sifir_orani": round(float((h0 == 0).mean()), 4)},
           "u16": {"min": int(u16.min()), "max": int(u16.max()), "ort": round(float(u16.mean()), 1)}}
    json.dump(olc, open(os.path.join(OUT, "rolyef_tr.json"), "w"), ensure_ascii=False)
    Image.fromarray((hb / max(1.0, hb.max()) * 255).astype(np.uint8)).save(os.path.join(OUT, "_onizleme_rolyef.png"))
    log("rolyef_tr.png", gen, yuk, olc["ham_8bit"], olc["u16"])


# ---------------------------------------------------------------------------------------------- Sentinel-2
def s2():
    """s2-bolge-kasim: kenardaki 25 km'lik halkada düşük frekanslı renk BMNG C1'e eşitlenir (küre yamasında dikiş
    olmasın). s2-genis-kasim aynen JPEG'e (yükleme hızı).
    G4 (--mevsim ilkbahar): aynı işlem s2-*-ilkbahar kaynaklarıyla; çıktı adlarına _ilkbahar eklenir, Kasım dosyaları
    yazılmaz. Halka düzeltmesinin oran istatistiği ayrıca s2_bolge_ilkbahar.json'a yazılır (yalnız ilkbahar)."""
    rasterio = rio()
    kay = "kasim" if a.mevsim == "kasim" else "ilkbahar"          # sentinel/s2-<kutu>-<kay>.*
    ek = "" if a.mevsim == "kasim" else "_ilkbahar"                # s1/tex/s2_<kutu><ek>.jpg
    s2b = Image.open(os.path.join(V, "sentinel", f"s2-bolge-{kay}.png")).convert("RGB")
    n = s2b.size[0]                 # 6144, 25 m/px, ±76,8 km
    # BMNG C1 aynı kutuya: eqc doğrusal → enlem/boylam doğrusal
    bb = json.load(open(os.path.join(V, "sentinel", f"s2-bolge-{kay}.json")))["bbox_wgs84"]
    c1 = np.asarray(Image.open(os.path.join(OUT, "c1_yama.jpg")).convert("RGB"))
    la1 = C1_ENLEM[1]; lo0 = C1_BOYLAM[0]
    x0 = (bb["bati"] - lo0) * 240; x1 = (bb["dogu"] - lo0) * 240
    y0 = (la1 - bb["kuzey"]) * 240; y1 = (la1 - bb["guney"]) * 240
    K = 384                           # 400 m/px karşılaştırma ızgarası
    bm = Image.fromarray(c1).transform((K, K), Image.EXTENT, (x0, y0, x1, y1), Image.BILINEAR)
    del c1
    sk = s2b.resize((K, K), Image.BOX)
    blur = lambda im: np.asarray(im.filter(ImageFilter.GaussianBlur(8)), np.float32) + 1.0
    oran = blur(bm) / blur(sk)        # ~3 km ölçeğinde
    oran = np.clip(oran, 0.4, 2.5)
    u = (np.arange(K) + 0.5) / K
    # radyal: merkezden 45 km'de 0 → 70 km'de 1 (sahne.py'deki radyal karışımla aynı halka; dikdörtgen yama
    # d2'de 1.500 km'den köşeli renk lekesi gibi okunuyordu — ölçüldü/bakıldı)
    ux, uy = np.meshgrid((u - 0.5) * 153.6, (u - 0.5) * 153.6)
    rk = np.hypot(ux, uy)
    w = np.clip((rk - 45.0) / 25.0, 0, 1); w = w * w * (3 - 2 * w)
    corr = 1 + w[..., None] * (oran - 1)
    corr_big = np.stack([np.asarray(Image.fromarray(corr[..., i].astype(np.float32), "F").resize((n, n), Image.BILINEAR))
                         for i in range(3)], -1)
    A = np.asarray(s2b)
    out = np.empty_like(A)
    for r0 in range(0, n, 1024):
        r1 = min(n, r0 + 1024)
        out[r0:r1] = np.clip(A[r0:r1] * corr_big[r0:r1], 0, 255).astype(np.uint8)
    Image.fromarray(out).save(os.path.join(OUT, f"s2_bolge{ek}.jpg"), quality=94, subsampling=0)
    Image.fromarray(out).resize((1024, 1024), Image.LANCZOS).save(os.path.join(OUT, f"_onizleme_s2_bolge{ek}.jpg"), quality=88)
    log(f"s2_bolge{ek}.jpg, halka düzeltmesi oran ort", oran.reshape(-1, 3).mean(0).round(3))
    if ek:
        # G4: halka düzeltmesinin büyüklüğü (oran = BMNG C1 / S2, ~3 km ölçeğinde; w = 45→70 km smoothstep)
        hk = w > 0.0
        json.dump({"kaynak": f"s2-bolge-{kay}.png", "c1": "c1_yama.jpg", "halka_km": [45.0, 70.0], "izgara": [K, K],
                   "oran_ort_rgb": [round(float(x), 4) for x in oran.reshape(-1, 3).mean(0)],
                   "oran_halka_agirlikli_rgb": [round(float(x), 4) for x in
                                                (oran * w[..., None]).reshape(-1, 3).sum(0) / max(float(w.sum()), 1e-9)],
                   "duzeltme_halka_ort_rgb": [round(float(x), 4) for x in corr[hk].reshape(-1, 3).mean(0)],
                   "duzeltme_dis_kenar_ort_rgb": [round(float(x), 4) for x in corr[w >= 0.999].reshape(-1, 3).mean(0)]},
                  open(os.path.join(OUT, f"s2_bolge{ek}.json"), "w"), ensure_ascii=False, indent=1)
    del A, out, corr_big
    g = Image.open(os.path.join(V, "sentinel", f"s2-genis-{kay}.png")).convert("RGB")
    g.save(os.path.join(OUT, f"s2_genis{ek}.jpg"), quality=95, subsampling=0)
    log(f"s2_genis{ek}.jpg")
    # yakın 2 m mozaik (10 m'den büyütme) — yakın plan zemin rengi için ±3,072 km
    y = Image.open(os.path.join(V, "sentinel", f"s2-yakin-{kay}.png")).convert("RGB")
    y.save(os.path.join(OUT, f"s2_yakin{ek}.jpg"), quality=95, subsampling=0)
    log(f"s2_yakin{ek}.jpg")


# ---------------------------------------------------------------------------------------------- arazi
def kutu_bulanik(a, r, tekrar):
    """float dizide ayrılabilir kutu bulanıklığı (tekrarlı → Gauss'a yakın); kenarlar yansıtılır."""
    a = a.astype(np.float64)
    for _ in range(tekrar):
        for ax in (0, 1):
            p = np.pad(a, [(r + 1, r) if i == ax else (0, 0) for i in range(2)], mode="edge")
            c = np.cumsum(p, axis=ax)
            if ax == 0:
                a = (c[2 * r + 1:] - c[:-2 * r - 1]) / (2 * r + 1)
            else:
                a = (c[:, 2 * r + 1:] - c[:, :-2 * r - 1]) / (2 * r + 1)
    return a.astype(np.float32)


def arazi():
    rasterio = rio()
    from rasterio.warp import reproject, Resampling
    # sinh ızgara: x = L·sinh(A·u)/sinh(A); merkezde ~13,6 m, kenarda ~450 m
    N, L, A_ = 2048, 110000.0, 4.2
    u = np.linspace(-1, 1, N)
    xs = L * np.sinh(A_ * u) / math.sinh(A_)
    log("ızgara aralığı merkez/kenar m", round(xs[N // 2] - xs[N // 2 - 1], 1), round(xs[-1] - xs[-2], 1))
    X, Yn = np.meshgrid(xs, xs[::-1])        # satır 0 = kuzey; Yn kuzey +
    ex, ey = X, -Yn                          # expo-yerel-m (y güney +)

    def ornekle(tif, yari, px):
        with rasterio.open(tif) as r:
            h = r.read(1).astype(np.float32)
        return h, yari, px

    def bilin(h, yari, px, x, y):
        n = h.shape[0]
        c = (x + yari) / px - 0.5; rr = (y + yari) / px - 0.5
        ok = (c >= 0) & (c <= n - 1) & (rr >= 0) & (rr <= n - 1)
        c = np.clip(c, 0, n - 1.001); rr = np.clip(rr, 0, n - 1.001)
        c0 = np.floor(c).astype(np.int32); r0 = np.floor(rr).astype(np.int32)
        fc = c - c0; fr = rr - r0
        v = (h[r0, c0] * (1 - fc) + h[r0, c0 + 1] * fc) * (1 - fr) + (h[r0 + 1, c0] * (1 - fc) + h[r0 + 1, c0 + 1] * fc) * fr
        return v, ok

    D = os.path.join(V, "dem")
    # 1) dış: 6 GLO-30 karosu (29–32 D, 36–38 K) → eqc 90 m ızgara ±160 km
    mos = np.zeros((7200, 10800), np.float32)
    for la, row in ((37, 0), (36, 3600)):
        for lo, col in ((29, 0), (30, 3600), (31, 7200)):
            f = os.path.join(D, f"Copernicus_DSM_COG_10_N{la}_00_E0{lo}_00_DEM.tif")
            with rasterio.open(f) as r:
                t = r.read(1, out_shape=(3600, 3600), resampling=Resampling.bilinear)
            mos[row:row + 3600, col:col + 3600] = t
    mos = np.maximum(mos, 0)
    lat, lon = eqc_latlon(ex, ey)
    pr = (38.0 - lat) * 3600 - 0.5; pc = (lon - 29.0) * 3600 - 0.5
    ok_dis = (pr >= 0) & (pr <= 7199) & (pc >= 0) & (pc <= 10799)
    pr = np.clip(pr, 0, 7198.999); pc = np.clip(pc, 0, 10798.999)
    r0 = np.floor(pr).astype(np.int32); c0 = np.floor(pc).astype(np.int32); fr = pr - r0; fc = pc - c0
    H = ((mos[r0, c0] * (1 - fc) + mos[r0, c0 + 1] * fc) * (1 - fr) + (mos[r0 + 1, c0] * (1 - fc) + mos[r0 + 1, c0 + 1] * fc) * fr)
    H = np.where(ok_dis, H, 0.0).astype(np.float32)
    del mos, r0, c0, fr, fc, pr, pc
    log("dış yükseklik (GLO-30 karoları)")
    # 2) bölge 50 m, geniş 30 m: kenara doğru 2 km'de karıştır
    for ad, yari, px in (("dem-bolge-50m.tif", 76800.0, 50.0), ("dem-genis-30m.tif", 30720.0, 30.0)):
        h, _, _ = ornekle(os.path.join(D, ad), yari, px)
        v, ok = bilin(h, yari, px, ex, ey)
        k = np.minimum(yari - np.abs(ex), yari - np.abs(ey))
        w = np.clip(k / 2000.0, 0, 1) * ok
        H = (H * (1 - w) + v * w).astype(np.float32)
        log("karıştırıldı", ad)
    # 3) yakın: DSM'deki bina/sera/ağaç tümseklerini sil (açma 90 m + yumuşatma) — ova düz
    h, _, _ = ornekle(os.path.join(D, "dem-yakin-6m.tif"), 3072.0, 6.0)
    hi = Image.fromarray(h, "F")
    hm = np.asarray(hi.filter(ImageFilter.MinFilter(15)), np.float32)          # 90 m
    hm = np.asarray(Image.fromarray(hm, "F").filter(ImageFilter.MaxFilter(15)), np.float32)
    hm = kutu_bulanik(hm, 9, 3)                                                  # ~σ 10 px Gauss yaklaşımı
    v, ok = bilin(hm, 3072.0, 6.0, ex, ey)
    k = np.minimum(3072 - np.abs(ex), 3072 - np.abs(ey))
    w = np.clip(k / 800.0, 0, 1) * ok
    H = (H * (1 - w) + v * w).astype(np.float32)
    np.save(os.path.join(OUT, "dtm_yakin.npy"), hm)          # OSM nesneleri aynı yüzeyi örneklesin
    log("yakın DTM (açma)", float(hm.min()), float(hm.max()))
    # kenarda 28 km'de (smoothstep) deniz seviyesine in: 4 km'lik dik iniş d2'de (1.500 km) karanlık kenar çizgisi
    # olarak görünüyordu (ölçüldü); yumuşak eğimle arazi kabartması küreye fark edilmeden karışır
    k = np.minimum(L - np.abs(X), L - np.abs(Yn))
    w_k = np.clip(k / 28000.0, 0, 1); w_k = w_k * w_k * (3 - 2 * w_k)
    H = (H * w_k).astype(np.float32)
    # gerçek küre yüzeyi: (enlem, boylam, h) → ENU (Expo teğet çerçevesi)
    P = latlon_enu(lat, lon, H.astype(np.float64))
    np.save(os.path.join(OUT, "arazi_p.npy"), P.astype(np.float32).reshape(-1, 3))
    np.save(os.path.join(OUT, "arazi_eqc.npy"), np.stack([ex, ey], -1).astype(np.float32).reshape(-1, 2))
    np.save(os.path.join(OUT, "arazi_h.npy"), H)
    json.dump({"N": N, "L": L, "A": A_, "h_max": float(H.max()), "expo_h": float(H[N // 2, N // 2])},
              open(os.path.join(OUT, "arazi.json"), "w"))
    log("arazi_p.npy", P.shape, "z min/max", float(P[..., 2].min()), float(P[..., 2].max()), "Expo h",
        float(H[N // 2, N // 2]))
    # deniz maskeleri (Blender'da Non-Color): geniş 30 m, bölge 50 m — olduğu gibi kopya (yumuşatılmış)
    for ad in ("deniz-maskesi-genis-30m.png", "deniz-maskesi-bolge-50m.png"):
        Image.open(os.path.join(D, ad)).convert("L").filter(ImageFilter.GaussianBlur(0.7)).save(os.path.join(OUT, ad))


# ---------------------------------------------------------------------------------------------- OSM yakın alan
def osm():
    import osm_yakin
    osm_yakin.uret(V, OUT, log)


if __name__ == "__main__":
    isler = {"su": su, "dunya": dunya, "c1": c1, "rolyef": rolyef, "s2": s2, "arazi": arazi, "osm": osm}
    if a.mevsim != "kasim" and a.is_ != "s2":
        sys.exit(f"--mevsim {a.mevsim} yalnız 's2' işiyle geçerli (öteki işler mevsimden bağımsız)")
    if a.is_ == "hepsi":
        for k in ("su", "dunya", "c1", "rolyef", "s2", "arazi", "osm"):
            isler[k]()
    else:
        for k in a.is_.split(","):
            isler[k]()
    log("bitti")
