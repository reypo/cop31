"""S1 (dış sahne) doku ve geometri hazırlığı — sistem Python'u (numpy, PIL, rasterio, shapely).

    python -X utf8 -P hazirla.py [dunya|c1|s2|arazi|osm|hepsi] [--varlik D:/soft/cop31-varlik]

Çıktı: <varlik>/s1/tex/ (depo dışı). Bellek: 21600'lük kaynaklar rasterio pencereleriyle kırpılarak okunur,
büyük diziler bant bant işlenir (tepe ≈ 1,5 GB).

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
C1_ENLEM = (22.0, 46.0)
C1_BOYLAM = (16.0, 44.0)


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
    json.dump({"enlem": C1_ENLEM, "boylam": C1_BOYLAM, "px_derece": 240, "boyut": [gen, yuk]},
              open(os.path.join(OUT, "c1_yama.json"), "w"))
    log("c1_yama.jpg", gen, yuk)


# ---------------------------------------------------------------------------------------------- Sentinel-2
def s2():
    """s2-bolge-kasim: kenardaki 25 km'lik halkada düşük frekanslı renk BMNG C1'e eşitlenir (küre yamasında dikiş
    olmasın). s2-genis-kasim aynen JPEG'e (yükleme hızı)."""
    rasterio = rio()
    s2b = Image.open(os.path.join(V, "sentinel", "s2-bolge-kasim.png")).convert("RGB")
    n = s2b.size[0]                 # 6144, 25 m/px, ±76,8 km
    # BMNG C1 aynı kutuya: eqc doğrusal → enlem/boylam doğrusal
    bb = json.load(open(os.path.join(V, "sentinel", "s2-bolge-kasim.json")))["bbox_wgs84"]
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
    Image.fromarray(out).save(os.path.join(OUT, "s2_bolge.jpg"), quality=94, subsampling=0)
    Image.fromarray(out).resize((1024, 1024), Image.LANCZOS).save(os.path.join(OUT, "_onizleme_s2_bolge.jpg"), quality=88)
    log("s2_bolge.jpg, halka düzeltmesi oran ort", oran.reshape(-1, 3).mean(0).round(3))
    del A, out, corr_big
    g = Image.open(os.path.join(V, "sentinel", "s2-genis-kasim.png")).convert("RGB")
    g.save(os.path.join(OUT, "s2_genis.jpg"), quality=95, subsampling=0)
    log("s2_genis.jpg")
    # yakın 2 m mozaik (10 m'den büyütme) — yakın plan zemin rengi için ±3,072 km
    y = Image.open(os.path.join(V, "sentinel", "s2-yakin-kasim.png")).convert("RGB")
    y.save(os.path.join(OUT, "s2_yakin.jpg"), quality=95, subsampling=0)
    log("s2_yakin.jpg")


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
    isler = {"dunya": dunya, "c1": c1, "s2": s2, "arazi": arazi, "osm": osm}
    if a.is_ == "hepsi":
        for k in ("dunya", "c1", "s2", "arazi", "osm"):
            isler[k]()
    else:
        for k in a.is_.split(","):
            isler[k]()
    log("bitti")
