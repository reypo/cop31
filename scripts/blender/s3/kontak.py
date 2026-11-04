"""S3 önizleme çıktıları ve render sonrası ölçümler (sistem Python'u: numpy + PIL; ffmpeg).

  python -X utf8 scripts/blender/s3/kontak.py kontak <klip> [--kaynak DIZIN] [--json JSON]   klip kontak sayfası (12 kare)
  python -X utf8 scripts/blender/s3/kontak.py posterler                                    p8 → pc durak sayfası + DOM taslağı
  python -X utf8 scripts/blender/s3/kontak.py olc                                          dikiş / 81 uç / yaprak / bayt
  python -X utf8 scripts/blender/s3/kontak.py karsilastir --onek s3b                       önce (s3) / sonra (s3b) yakın kırpımlar
  --onek s3b: bütün girdi/çıktılar _onizleme/s3b-* (G-B K10 kısa önizlemesi); varsayılan s3 (G-A)

Kontak: master kare (960²) küçültülmüş; camgöbeği = dikey kırpım (1080×1920 master), içinde kesikli = güvenli alan
(%76 × %75), eflatun yatay çizgi = alt bant başı (y %68); turuncu = yatay kırpım (1920×1080, klip json `kirpimY_oneri`).
Posterler: dikey teslim (720×1280 eşdeğeri) + DOM taslağı (render DEĞİL): p9'da 81 uç halkası (1,5 px krem), pa'da iki
boğum etiketi, pb'de 4 polaroid (sol p12/p17, sağ p19/p22 — ONAY), alt bantta /fidan çipi ve içerik başlığı.
"""
import sys, os, glob, json, argparse, subprocess, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

BURASI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BURASI, "..", "s2"))
from renkbilim import lab, de00  # noqa: E402

KOK = os.path.normpath(os.path.join(BURASI, "..", "..", ".."))
ONIZ = "D:/soft/cop31-varlik/render/_onizleme"
ONEK = "s3"            # çıktı öneki (--onek): s3 = G-A önizlemesi, s3b = G-B K10 kısa önizlemesi (s3-* dosyalarına dokunmaz)


def jk():
    return f"{ONIZ}/{ONEK}-json"


def oz(ad):
    """_onizleme altında önekli yol: oz("t89") → …/s3b-t89."""
    return os.path.join(ONIZ, f"{ONEK}-{ad}")
FONT = "D:/soft/cop31-varlik/font/Montserrat-SemiBold.ttf"
FONT_I = "D:/soft/cop31-varlik/font/Lora-Italic.ttf"
FOTO = os.path.join(KOK, "public", "photos")


def font(boy, ital=False):
    for f in ((FONT_I if ital else FONT), FONT):
        if os.path.exists(f):
            return ImageFont.truetype(f, boy)
    return ImageFont.load_default()


def kareler(dz):
    return [(int(os.path.basename(f)[2:6]), f) for f in sorted(glob.glob(os.path.join(dz, "k_*.png")))]


def oku(f):
    return np.asarray(Image.open(f).convert("RGB"), dtype=np.float64) / 255.0


def js(ad):
    y = os.path.join(jk(), f"{ad}.json")
    return json.load(open(y, encoding="utf-8")) if os.path.exists(y) else {}


def kutular(d, W, ky=None):
    k0, k1 = round(W * 420 / 1920), round(W * 1500 / 1920)
    d.rectangle([k0, 0, k1 - 1, W - 1], outline=(0, 220, 230), width=2)
    gw = (k1 - k0)
    sx0, sx1 = k0 + gw * 0.12, k1 - gw * 0.12
    sy0, sy1 = W * 0.125, W * 0.875
    for x in range(int(sx0), int(sx1), 10):
        d.line([x, sy0, x + 5, sy0], fill=(0, 220, 230)); d.line([x, sy1, x + 5, sy1], fill=(0, 220, 230))
    for y in range(int(sy0), int(sy1), 10):
        d.line([sx0, y, sx0, y + 5], fill=(0, 220, 230)); d.line([sx1, y, sx1, y + 5], fill=(0, 220, 230))
    d.line([k0, W * 0.68, k1, W * 0.68], fill=(235, 60, 200), width=2)
    if ky is not None:
        y0 = W * ky / 1920
        d.rectangle([0, y0, W - 1, y0 + W * 1080 / 1920], outline=(255, 150, 40), width=1)


def kontak(klip, kaynak=None, n=12, karo=400, sut=4, cikis=None, baslik=""):
    dz = kaynak or oz(klip)
    ks = kareler(dz)
    if not ks:
        raise SystemExit(f"kare yok: {dz}")
    sec = [ks[round(i * (len(ks) - 1) / (n - 1))] for i in range(n)] if len(ks) >= n else ks
    j = js(klip)
    ky = j.get("kirpimY_oneri")
    sat = (len(sec) + sut - 1) // sut
    pad = 8
    W = Image.new("RGB", (sut * karo + (sut + 1) * pad, sat * karo + (sat + 1) * pad + 56), (24, 24, 26))
    dr = ImageDraw.Draw(W)
    dr.text((pad, 6), f"{ONEK.upper()} {klip} — {len(ks)} kare ({ks[0][0]}–{ks[-1][0]}), önizleme EEVEE 960² TAA 16 {baslik}", font=font(17),
            fill=(235, 235, 235))
    dr.text((pad, 30), "camgöbeği: dikey kırpım + kesikli güvenli alan %76×%75 · eflatun: alt bant başı (y %68) · turuncu: yatay "
                       f"kırpım (kirpimY {ky})", font=font(13), fill=(190, 190, 190))
    for i, (no, f) in enumerate(sec):
        im = Image.open(f).convert("RGB").resize((karo, karo), Image.LANCZOS)
        d = ImageDraw.Draw(im)
        kutular(d, karo, ky)
        d.rectangle([0, 0, 92, 22], fill=(0, 0, 0))
        d.text((5, 3), f"kare {no}", font=font(15), fill=(255, 255, 255))
        if j.get("buyume") and len(j["buyume"]["kok"]) > no:
            b = j["buyume"]
            d.text((5, karo - 18), f"kök {b['kok'][no]:.2f} gövde {b['govde'][no]:.2f} dal {b['dal'][no]:.2f} yaprak {b['yaprak'][no]:.2f}",
                   font=font(11), fill=(255, 255, 255))
        x = pad + (i % sut) * (karo + pad)
        y = 56 + pad + (i // sut) * (karo + pad)
        W.paste(im, (x, y))
    yol = cikis or oz(f"{klip}.png")
    W.save(yol, optimize=True)
    print("[KONTAK]", yol)
    return yol


def mp4(klip, kaynak=None):
    dz = kaynak or oz(klip)
    ks = kareler(dz)
    if len(ks) < 2:
        return
    res = Image.open(ks[0][1]).size[0]
    k = res / 1920
    c0, c1 = round(420 * k), round(1080 * k)
    ky = round((js(klip).get("kirpimY_oneri") or 420) * k)
    for ad, vf in (("d", f"crop={c1}:{res}:{c0}:0,scale=720:1280:flags=lanczos,format=yuv420p"),
                   ("y", f"crop={res}:{c1}:0:{ky},scale=1280:720:flags=lanczos,format=yuv420p")):
        yol = oz(f"{klip}-{ad}.mp4")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-start_number", str(ks[0][0]), "-i",
                        os.path.join(dz, "k_%04d.png"), "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "20",
                        "-movflags", "+faststart", "-an", yol], check=True)
        print("[MP4]", yol, os.path.getsize(yol))


# ------------------------------------------------------------------ posterler + DOM taslağı
# bant taslağı: başlıklar ve satırlar content.ts'ten birebir (bizKimiz/vizyon/bulusmalar/iklim .title, items, facts)
DURAK = [("p8", "t78f", None, "d8 · masadaki broşür", "Dijital broşür →"),
         ("p9", "t89", "Kökler", "Biz Kimiz?", "81 İl · 922 İlçe"),
         ("pa", "t9a", "Gövde", "Cumhurbaşkanımızın Gençlik Vizyonu", "2017 Seçilme Yaşı Reformu · TBMM'de Gençlerin Sesi"),
         ("pb", "tab", "Dallar", "Gençlik Buluşmaları", "16 Mayıs 2026 · Kocaeli Stadyumu"),
         ("pc", "lc", "Yapraklar", "İklim Eylemleri", "Üsküdar Gençlik Kolları Hatıra Ormanı — 300 fidan (2025)")]
POLAROID = [("bulusma-kampus-soylesi.jpg", 0, (0.40, 0.50)), ("bulusma-kampus-salon-selam.jpg", 2, (0.60, 0.50)),
            ("solen-kocaeli-tribun-selam.jpg", 1, (0.0, 0.5)), ("solen-kocaeli-saha-ikili.jpg", 3, (0.5, 0.18))]


def poster_yolu(ps, kaynak):
    if ps == "p8":
        ks = kareler(oz("t78f"))
        return ks[-1][1] if ks else None
    if ps == "pc":
        f = os.path.join(oz("lc"), "k_0000.png")
        return f if os.path.exists(f) else None
    f = oz(f"{ps}.png")
    return f if os.path.exists(f) else None


def dikey(im):
    w, h = im.size
    k = w / 1920
    return im.crop((round(420 * k), 0, round(1500 * k), h)).resize((540, 960), Image.LANCZOS)


def m2d(p):   # master px → 540×960 dikey önizleme px
    return ((p[0] - 420) / 1080 * 540, p[1] / 1920 * 960)


def polaroid(foto, pos, gen=62):
    try:
        im = Image.open(os.path.join(FOTO, foto)).convert("RGB")
    except OSError:
        im = Image.new("RGB", (400, 400), (120, 120, 120))
    w, h = im.size
    s = min(w, h)
    cx, cy = pos[0] * (w - s) + s / 2, pos[1] * (h - s) + s / 2
    im = im.crop((int(cx - s / 2), int(cy - s / 2), int(cx + s / 2), int(cy + s / 2))).resize((gen, gen), Image.LANCZOS)
    kart = Image.new("RGB", (gen + 8, gen + 20), (250, 247, 240))
    kart.paste(im, (4, 4))
    return kart


def posterler(cikis=None, ek_altin=True):
    tiles = []
    for ps, klip, cip, bas, alt in DURAK:
        f = poster_yolu(ps, klip)
        if not f:
            continue
        im = dikey(Image.open(f).convert("RGB")).convert("RGBA")
        kat = Image.new("RGBA", im.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(kat)
        j = js(ps) or js(klip)
        cap = j.get("capalar", {})
        if ps == "p9":
            for c in cap.get("kok_uclari", []):
                x, y = m2d((c["x"], c["y"]))
                d.ellipse([x - 3.2, y - 3.2, x + 3.2, y + 3.2], outline=(255, 241, 220, 235), width=1)
        if ps == "pa":
            for b in cap.get("bogumlar", []):
                x, y = m2d((b["x"], b["y"]))
                t = b.get("taraf", 1)
                x2 = x + t * 70
                d.line([x, y, x2, y], fill=(255, 241, 220, 220), width=1)
                d.text((x2 + (4 if t > 0 else -60), y - 16), b["baslik"], font=font(14), fill=(255, 241, 220, 255))
                d.text((x2 + (4 if t > 0 else -60), y + 1), " · ".join(b["satirlar"]), font=font(10, True), fill=(255, 241, 220, 230))
        if ps == "pb" and cap.get("dal_uclari"):
            for foto, uc, poz in POLAROID:
                x, y = m2d(cap["dal_uclari"][uc])
                k = polaroid(foto, poz)
                kat.alpha_composite(k.convert("RGBA"), (int(x - k.size[0] / 2), int(y + 4)))
        # alt bant (y %68–100): scrim + /fidan çipi + başlık (d8: üst bant, aşağıda)
        if ps != "p8":
            d.rectangle([0, 0.68 * 960, 540, 960], fill=(16, 18, 20, 150))
        if cip:
            d.rounded_rectangle([24, 0.68 * 960 + 22, 24 + 12 * len(cip) + 28, 0.68 * 960 + 46], radius=12, fill=(71, 178, 122, 255))
            d.text((38, 0.68 * 960 + 26), cip, font=font(13), fill=(255, 255, 255, 255))
        if ps != "p8":
            d.text((24, 0.68 * 960 + 58), bas, font=font(20), fill=(247, 230, 205, 255))
            d.text((24, 0.68 * 960 + 92), alt, font=font(12, True), fill=(247, 230, 205, 230))
        if ps == "p8":
            d.rectangle([0, 0, 540, 0.28 * 960], fill=(16, 18, 20, 120))
            d.text((24, 40), "COP31'de AK Gençlik", font=font(20), fill=(247, 230, 205, 255))
            d.rounded_rectangle([24, 80, 200, 108], radius=14, outline=(247, 230, 205, 255), width=2)
            d.text((40, 85), "Dijital broşür →", font=font(13), fill=(247, 230, 205, 255))
        im.alpha_composite(kat)
        dd = ImageDraw.Draw(im)
        dd.rectangle([0, 0, 540, 22], fill=(0, 0, 0, 255))
        dd.text((6, 3), f"{ONEK} {ps} ({klip})  — DOM katmanı TASLAK, render değil", font=font(12), fill=(255, 255, 255, 255))
        tiles.append(im.convert("RGB"))
    if ek_altin and os.path.exists(oz("pc-altin.png")):
        im = dikey(Image.open(oz("pc-altin.png")).convert("RGB"))
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 540, 22], fill=(0, 0, 0))
        d.text((6, 3), "pc — B: --gok altin (arka pus perdesi)", font=font(12), fill=(255, 255, 255))
        tiles.append(im)
    W = Image.new("RGB", (len(tiles) * 550 + 10, 980), (24, 24, 26))
    for i, t in enumerate(tiles):
        W.paste(t, (10 + i * 550, 10))
    yol = cikis or oz("posterler.png")
    W.save(yol, optimize=True)
    print("[POSTER]", yol)


# ------------------------------------------------------------------ ölçümler
def de_ozet(a, b):
    d = de00(a.reshape(-1, 3), b.reshape(-1, 3))
    return {"de00_ort": round(float(d.mean()), 4), "de00_p95": round(float(np.percentile(d, 95)), 4),
            "de00_maks": round(float(d.max()), 3), "ort_mutlak_fark_255": round(float(np.abs(a - b).mean() * 255), 3)}


def kare(klip, i):
    f = os.path.join(oz(klip), f"k_{i:04d}.png")
    return oku(f) if os.path.exists(f) else None


def blob_say(maske, renk=(1.0, 0.0, 0.0)):
    """Maske (1920² master, Workbench) → dikey kırpım → 720×1280 (alan ortalaması) → eşik → 8-komşu bileşen sayısı."""
    a = maske[:, 420:1500]
    im = Image.fromarray((a * 255).astype(np.uint8)).resize((720, 1280), Image.BOX)
    b = np.asarray(im, dtype=np.float64) / 255
    m = (b[..., 0] > 0.45) & (b[..., 1] < 0.35) & (b[..., 2] < 0.35)
    h, w = m.shape
    etiket = np.zeros((h, w), np.int32)
    n = 0
    boy = []
    ys, xs = np.nonzero(m)
    for y0, x0 in zip(ys, xs):
        if etiket[y0, x0]:
            continue
        n += 1
        yigin = [(y0, x0)]
        etiket[y0, x0] = n
        say = 0
        while yigin:
            y, x = yigin.pop()
            say += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < h and 0 <= xx < w and m[yy, xx] and not etiket[yy, xx]:
                        etiket[yy, xx] = n
                        yigin.append((yy, xx))
        boy.append(say)
    return n, boy


def olc(cikis=None):
    R = {}
    # dikişler (önizleme 960², 8 bit)
    dk = {}
    a, b = kare("t78f", 59), kare("t89", 0)
    if a is not None and b is not None:
        dk["t78f[59]↔t89[0]"] = de_ozet(a, b)
    for (x, i), (y, j) in ((("t89", 59), ("t9a", 0)), (("t9a", 53), ("tab", 0)), (("tab", 53), ("tbc", 0))):
        a, b = kare(x, i), kare(y, j)
        if a is not None and b is not None:
            dk[f"{x}[{i}]↔{y}[{j}] (poster ≡ sonraki geçişin ilk karesi)"] = de_ozet(a, b)
    a, b = kare("tbc", 65), kare("lc", 0)
    if a is not None and b is not None:
        dk["tbc[65]↔lc[0]"] = de_ozet(a, b)
    a, b = kare("lc", 119), kare("lc", 0)
    if a is not None and b is not None:
        dk["lc[119]→lc[0] (kapanış)"] = de_ozet(a, b)
        ard = [de_ozet(kare("lc", i), kare("lc", i + 1))["de00_ort"] for i in (0, 30, 59, 90, 118)]
        dk["lc ardışık de00_ort (0,30,59,90,118)"] = ard
        dk["lc kapanış ≤ medyan ardışık × 1,2"] = dk["lc[119]→lc[0] (kapanış)"]["de00_ort"] <= float(np.median(ard)) * 1.2
    for x, y in (("t89", 59), ("t9a", 53), ("tab", 53)):
        a = kare(x, y)
        if a is not None:
            dk[f"{x}[{y}] son kare (poster p{'9ab'[('t89', 't9a', 'tab').index(x)]} = bu kare, kopya)"] = "≡ (tanım)"
    R["dikis"] = dk
    # 81 uç blob sayımı (maske, 1920²) + ΔL* (önizleme p9 renk)
    mf = os.path.join(oz("maske-p9"), "k_0059.png")
    if os.path.exists(mf):
        n, boy = blob_say(oku(mf))
        R["uc81_blob"] = {"blob": n, "olcut": "81 ± 2", "gecti": abs(n - 81) <= 2, "blob_alan_px_medyan": int(np.median(boy)) if boy else 0,
                          "blob_alan_px_min": int(min(boy)) if boy else 0,
                          "tanim": "Workbench malzeme kimliği (kök kapağı kırmızı), dikey kırpım 720×1280 BOX küçültme, eşik R>0,45"}
    j = js("p9") or js("t89")
    p9 = kare("t89", 59)
    if p9 is not None and j.get("capalar"):
        L = lab(p9)[..., 0]
        k = p9.shape[0] / 1920
        farklar = []
        for c in j["capalar"]["kok_uclari"]:
            x, y = c["x"] * k, c["y"] * k
            xi, yi = int(round(x)), int(round(y))
            ic = L[max(0, yi - 1):yi + 2, max(0, xi - 1):xi + 2].max()
            yy, xx = np.ogrid[:L.shape[0], :L.shape[1]]
            r = np.hypot(yy - y, xx - x)
            halka = L[(r >= 5) & (r <= 8)]
            farklar.append(float(ic - np.median(halka)))
        f = np.array(farklar)
        R["uc81_dL"] = {"medyan": round(float(np.median(f)), 2), "p10": round(float(np.percentile(f, 10)), 2),
                        "min": round(float(f.min()), 2), "alt20": int((f < 20).sum()), "olcut": "ΔL* ≥ 20 (uç 3×3 en parlak ↔ 5–8 px halka medyanı; 960² önizleme)"}
    # yaprak doygunluğu ve ton IQR (pc maskesi 960²)
    mf = os.path.join(oz("maske-pc"), "k_0000.png")
    pc = kare("lc", 0)
    if os.path.exists(mf) and pc is not None:
        m = oku(mf)
        sec = (m[..., 1] > 0.45) & (m[..., 0] < 0.2) & (m[..., 2] < 0.2)
        px = pc[sec]
        mx, mn = px.max(1), px.min(1)
        sat = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0)
        r, g, b = px[:, 0], px[:, 1], px[:, 2]
        hue = np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360
        luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
        dy, iqr, pat = float(sat.mean()), float(np.percentile(hue, 75) - np.percentile(hue, 25)), float((luma > 0.97).mean())
        R["yaprak"] = {"piksel": int(sec.sum()), "doygunluk_ort": round(dy, 3),
                       "olcut_doygunluk": "≤ 0,62 (K10; G-A ≤ 0,55 — amaç neon yeşili engellemek), hedef 0,56–0,60",
                       "doygunluk_gecti": dy <= 0.62, "doygunluk_hedefte": 0.56 <= dy <= 0.60,
                       "ton_iqr_deg": round(iqr, 1), "olcut_ton": "IQR ≥ 12°", "ton_gecti": iqr >= 12.0,
                       "ton_medyan_deg": round(float(np.median(hue)), 1),
                       "luma_097_ustu_oran": round(pat, 4), "olcut_patlama": "≤ %1 (R10)", "patlama_gecti": pat <= 0.01}
    # cam yansıması (R12): p9 kök maskesinde L* ortalaması cam_k 0,08 ↔ cam yok
    a0 = oz("p9-camsiz.png")
    mk = os.path.join(oz("maske-p9"), "k_0059.png")
    if os.path.exists(a0) and p9 is not None and os.path.exists(mk):
        m = np.asarray(Image.open(mk).convert("RGB").resize(p9.shape[1::-1], Image.NEAREST), dtype=np.float64) / 255
        kok = ((m[..., 1] > 0.5) & (m[..., 0] < 0.3)) | ((m[..., 0] > 0.5) & (m[..., 1] < 0.3))
        L1, L0 = lab(p9)[..., 0][kok], lab(oku(a0))[..., 0][kok]
        R["cam_R12"] = {"kok_L_cam": round(float(L1.mean()), 2), "kok_L_camsiz": round(float(L0.mean()), 2),
                        "dusus": round(float(L0.mean() - L1.mean()), 2), "olcut": "ΔL* düşüşü ≤ 5"}
    # bayt tahmini: t78f önizlemesi F-B t78 mobil AV1'i (265.394 B) ile kalibre; aynı kodlama (SVT-AV1 p4, g = kare)
    R["bayt"] = bayt() if ONEK == "s3" else bayt_karsilastir()
    yol = cikis or oz("olcum.json")
    json.dump(R, open(yol, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("[OLC]", yol)
    print(json.dumps(R, ensure_ascii=False, indent=1)[:6000])


T78_SON_AV1 = 265394   # public/icinden/v/d/t78.65ac041d.av1.mp4 (F-B, 4 Kasım 00.48)
CRF = {"t78f": 32, "t89": 32, "t9a": 32, "tab": 32, "tbc": 32, "lc": 30, "r98": 36}


def kodla(klip, crf, ters=False):
    dz = oz(klip)
    ks = kareler(dz)
    if not ks:
        return None
    res = Image.open(ks[0][1]).size[0]
    k = res / 1920
    vf = f"crop={round(1080 * k)}:{res}:{round(420 * k)}:0,scale=720:1280:flags=lanczos,format=yuv420p" + (",reverse" if ters else "")
    out = os.path.join(oz("bayt"), f"{'r98' if ters else klip}.av1.mp4")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-start_number", str(ks[0][0]), "-i", os.path.join(dz, "k_%04d.png"),
                    "-vf", vf, "-c:v", "libsvtav1", "-preset", "4", "-crf", str(crf), "-g", str(len(ks)), "-svtav1-params", "scd=0",
                    "-an", "-movflags", "+faststart", out], check=True)
    return os.path.getsize(out)


def bayt():
    b = {}
    for k in ("t78f", "t89", "t9a", "tab", "tbc", "lc"):
        b[k] = kodla(k, CRF[k])
    b["r98"] = kodla("t89", CRF["r98"], ters=True)
    if not b.get("t78f"):
        return {"not": "t78f önizlemesi yok"}
    oran = T78_SON_AV1 / b["t78f"]
    tah = {k: round(v * oran / 1000, 1) for k, v in b.items() if v and k != "t78f"}
    post = {}
    for ps in ("p9", "pa", "pb", "pc"):
        f = poster_yolu(ps, None)
        if f:
            im = dikey(Image.open(f).convert("RGB")).resize((720, 1280), Image.LANCZOS)
            yol = os.path.join(oz("bayt"), f"{ps}.webp")
            im.save(yol, "WEBP", quality=80, method=6)
            post[ps] = round(os.path.getsize(yol) / 1000, 1)
    net = sum(tah.values()) + sum(post.values())
    return {"onizleme_av1_bayt": b, "kalibrasyon": f"F-B t78 mobil AV1 {T78_SON_AV1} B / t78f önizleme {b['t78f']} B = {oran:.3f}",
            "tahmin_kB": tah, "poster_webp_kB_onizleme": post, "fidan_net_tahmin_kB": round(net, 1),
            "not": ("Yalnız dikey mobil AV1. Kalibrasyon t78f (aynı sahne, aynı kodlayıcı) ile; son render TAA 64 1920² gürültüsü "
                    "farklı olabilir (V). Posterler önizlemeden (960²) → son render'da büyür (V, ×1,3–1,6). Çıkanlar (DOM broşür "
                    "görselleri, eski d9–d11 dosyaları) düşülmedi.")}


def _kodla_aralik(dz, ilk, n, crf, out):
    res = Image.open(os.path.join(dz, f"k_{ilk:04d}.png")).size[0]
    k = res / 1920
    vf = f"crop={round(1080 * k)}:{res}:{round(420 * k)}:0,scale=720:1280:flags=lanczos,format=yuv420p"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-start_number", str(ilk), "-i", os.path.join(dz, "k_%04d.png"),
                    "-frames:v", str(n), "-vf", vf, "-c:v", "libsvtav1", "-preset", "4", "-crf", str(crf), "-g", str(n),
                    "-svtav1-params", "scd=0", "-an", "-movflags", "+faststart", out], check=True)
    return os.path.getsize(out)


def bayt_karsilastir():
    """Kısa önizleme (ONEK) ↔ G-A önizlemesi (s3): aynı kare aralığı, aynı kodlayıcı (SVT-AV1 p4, CRF klip başına, g = kare)
    → bayt oranı. Posterler (p9/pa/pc) WebP q80 aynı yolla. G-A tam klip tahminine (rapor §3) oran uygulanır: bilgi."""
    out_dz = oz("bayt")
    os.makedirs(out_dz, exist_ok=True)
    R, oranlar = {}, {}
    for klip in ("t89", "t9a", "tab", "tbc", "lc"):
        yeni = kareler(oz(klip))
        if not yeni:
            continue
        nolar = [n for n, _ in yeni]
        bas = max(i for i in range(len(nolar)) if i == 0 or nolar[i] != nolar[i - 1] + 1)
        nolar = nolar[bas:]                      # son kesintisiz blok (ör. t89 0–24 + 50–59 → 50–59)
        ilk, n = nolar[0], len(nolar)
        eski_dz = os.path.join(ONIZ, f"s3-{klip}")
        if n < 2 or not all(os.path.exists(os.path.join(eski_dz, f"k_{i:04d}.png")) for i in nolar):
            R[klip] = {"not": "kodlanacak kesintisiz blok < 2 kare ya da G-A önizlemesinde aynı kareler yok"}
            continue
        b1 = _kodla_aralik(oz(klip), ilk, n, CRF[klip], os.path.join(out_dz, f"{klip}-{ilk}-{ilk + n - 1}-yeni.av1.mp4"))
        b0 = _kodla_aralik(eski_dz, ilk, n, CRF[klip], os.path.join(out_dz, f"{klip}-{ilk}-{ilk + n - 1}-eski.av1.mp4"))
        oranlar[klip] = b1 / b0
        R[klip] = {"kareler": [ilk, ilk + n - 1], "yeni_B": b1, "eski_B": b0, "oran": round(b1 / b0, 3)}
    post = {}
    for ps in ("p9", "pa", "pb", "pc"):
        f1 = poster_yolu(ps, None)
        f0 = (os.path.join(ONIZ, "s3-lc", "k_0000.png") if ps == "pc" else os.path.join(ONIZ, f"s3-{ps}.png"))
        if f1 and os.path.exists(f0):
            bb = []
            for f, ad in ((f1, "yeni"), (f0, "eski")):
                im = dikey(Image.open(f).convert("RGB")).resize((720, 1280), Image.LANCZOS)
                y = os.path.join(out_dz, f"{ps}-{ad}.webp")
                im.save(y, "WEBP", quality=80, method=6)
                bb.append(os.path.getsize(y))
            post[ps] = {"yeni_kB": round(bb[0] / 1000, 1), "eski_kB": round(bb[1] / 1000, 1), "oran": round(bb[0] / bb[1], 3)}
    R["poster_webp"] = post
    # G-A tam klip tahmini (kB, mobil dikey AV1; rapor §3) × oran (aralık dışı kareler için bilgi amaçlı)
    GA = {"t89": 185, "t9a": 120, "tab": 174, "tbc": 254, "lc": 230, "r98": 148}
    tah = {k: round(v * oranlar.get(k if k != "r98" else "t89", 1.0), 1) for k, v in GA.items()}
    R["tahmin_kB"] = {"ga": GA, "k10": tah, "fark_kB": round(sum(tah.values()) - sum(GA.values()), 1),
                      "not": "Oran yalnız kodlanan son kesintisiz bloktan (yukarıdaki 'kareler'); oranı olmayan klip → 1,0. "
                             "Kesin bayt K (kodla.mjs) son render'dan ölçer."}
    return R


def karsilastir(cikis=None):
    """Önce (s3, G-A) / sonra (ONEK) yakın kırpımlar: p9 kökler, pa gövde, pc yapraklar, tbc[52] (yapraklar açılırken)."""
    parca = [("p9 kökler (t89[59])", ("t89", 59), (300, 380, 700, 640)),
             ("pa gövde (t9a[53])", ("t9a", 53), (330, 150, 630, 750)),
             ("pc yaprak (lc[0])", ("lc", 0), (250, 60, 710, 520)),
             ("tbc[52]", ("tbc", 52), (250, 60, 710, 520))]
    satir = []
    for ad, (klip, i), kutu in parca:
        f0 = os.path.join(ONIZ, f"s3-{klip}", f"k_{i:04d}.png")
        f1 = os.path.join(oz(klip), f"k_{i:04d}.png")
        if not (os.path.exists(f0) and os.path.exists(f1)):
            continue
        ims = []
        for f, et in ((f0, "önce (G-A)"), (f1, f"sonra ({ONEK}, K10)")):
            im = Image.open(f).convert("RGB").crop(kutu)
            olc_ = 520 / im.size[1]
            im = im.resize((round(im.size[0] * olc_), 520), Image.LANCZOS)
            d = ImageDraw.Draw(im)
            d.rectangle([0, 0, im.size[0], 22], fill=(0, 0, 0))
            d.text((5, 3), f"{ad} — {et}", font=font(13), fill=(255, 255, 255))
            ims.append(im)
        satir.append(ims)
    if not satir:
        return
    W_ = max(sum(im.size[0] for im in s_) + 30 for s_ in satir)
    W = Image.new("RGB", (W_, len(satir) * 530 + 10), (24, 24, 26))
    for j, s_ in enumerate(satir):
        x = 10
        for im in s_:
            W.paste(im, (x, 10 + j * 530))
            x += im.size[0] + 10
    yol = cikis or oz("karsilastir.png")
    W.save(yol, optimize=True)
    print("[KARSILASTIR]", yol)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("is_", choices=["kontak", "posterler", "olc", "mp4", "karsilastir"])
    p.add_argument("hedef", nargs="?")
    p.add_argument("--kaynak", default=None)
    p.add_argument("--mp4", type=int, default=1)
    p.add_argument("--onek", default="s3")
    x = p.parse_args()
    ONEK = x.onek
    if x.is_ == "kontak":
        kontak(x.hedef, x.kaynak)
        if x.mp4:
            mp4(x.hedef, x.kaynak)
    elif x.is_ == "mp4":
        mp4(x.hedef, x.kaynak)
    elif x.is_ == "posterler":
        posterler()
    elif x.is_ == "karsilastir":
        karsilastir()
    else:
        olc()
