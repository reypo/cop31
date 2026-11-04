# /icinden v3 — teslim setinin doğrulaması (docs/brief-icinden-3.md §9.4, §11.2, §12.5–12.6; kodlama ajanı K).
#
#   python -X utf8 -P scripts/icinden/kodlama-dogrula.py [--liste D:/soft/cop31-varlik/kodlama/render-son.json]
#        [--fragman D:/soft/cop31-varlik/render-son] [--cikti D:/soft/cop31-varlik/kodlama/dogrula-render-son.json]
#        [--temel 0.5] [--oturum-temel 1.27] [--vmaf] [--ref D:/soft/cop31-varlik/kodlama/ref]
#        [--sec l3.av1,t56,r65.av1.dikey] [--yalniz-vmaf] [--esle t78=<klasör>,t89=<klasör>] [--geri-yok r98]
#
# Durak zinciri (G turu, §14.4.2; 13 durak d0–d12, kapanış 13): t01 → l1 → t12 → l2 → t23 → l3 → t34 → l4 → t45 →
# l5 → t56 → (d6: döngü yok, t56 son karesi = p6) → t67 → (d7: p7 = t67 son) → t78 → (d8 masa: p8 = t78 son) → t89 →
# (d9 kök: p9 = t89 son) → t9a → (d10 gövde: pa) → tab → (d11 dal: pb) → tbc → lc (d12 yaprak; pc = lc[0]).
# Geri: r10 r21 r32 r43 r54 r65 r76 r87 (açık tablo, GERI; r98 K-son'da kalktı); t89/t9a/tab/tbc geri klipsiz (sitede 350 ms poster çapraz
# sönmesi, §14.4.1 K4) → geri dikişi ölçülmez, pencere = kritik. `--geri-yok r98`: bütçe merdiveninde kaldırılan geri
# klip yok sayılır. `--esle klip=klasör`: master kareleri (son-kare posterleri, VMAF referansı) o klasörden (G-B
# önizleme seti; kodla.mjs --esle ile aynı).
# 1. Kodek dizesi MP4 örnek tanımından (avcC / hvcC / av1C, RFC 6381): avc1.64001f, hvc1.1.6.L93.90 (x265'in
#    gerçek dizesi; manifest de bunu kullanır), av01.0.05M.08.
# 2. Kare sayısı (ffprobe -count_frames) = fragman `kare` (t34: t34.json ya da t34a + t34b).
# 3. Dikişler (her kodek ve kırpım, kodlanmış kareler): geçişin SON karesi ↔ hedef döngünün 0. karesi ve posteri
#    (ΔE00 ortalama, hedef ≤ 3); kalkış: döngünün 0. karesi (döngüsüz durakta gelen geçişin son karesi) ↔ çıkan
#    geçişin 0. karesi (t56[53] ↔ t67[0], t67[47] ↔ t78[0], t78[59] ↔ t89[0], t89 ↔ t9a, t9a ↔ tab, tab ↔ tbc); geri:
#    r(k+1→k) son karesi ↔ l_k 0. karesi ya da (d6–d8) p_k ve gelen geçişin son karesi.
# 4. Döngü kapanışı: son→ilk fark ↔ ardışık kare farkı (ortalama mutlak /255 ve ΔE00).
# 5. t34 iç dikişi (kesme k0 ↔ k0+1; k0 = t34a kare − 1, F-B'de 35 ↔ 36, E'de 47 ↔ 48) ve parlama karelerinin tonu
#    (#FFF1DC). Rapor alanları `fark_kesme`, `k0_ort_rgb`… (`kesme` = [k0, k0+1]).
# 6. Son-kare posterleri (p6 ← t56, p7 ← t67, p8 ← t78, p9 ← t89, pa ← t9a, pb ← tab; §12.6): poster ve her kodekte geçişin son karesi ↔ master son karesi
#    (aynı kırpım/ölçek, rgb24): tüm kare, en kötü karo (8×8 ızgara) ve fragman çapalarının çevresi (±60 video px;
#    başlık/rakam bölgesi; hedef ΔE00 ortalaması ≤ 2).
# 7. Bütçe (§11.2-3, §12.5; MB = 10^6 bayt): ilk yükleme = temel (HTML+JS+CSS+font, W ölçümü) + t01 + p1 + l1 + t12
#    ≤ 2,5; d_j'de (j = 1…8) kritik yol t(j→j+1) + l(j+1) + p(j+1) ≤ 1,8 (§11.6-1: d2 istisnası ≤ 2,1; d5/d6'da
#    döngü yok, d7'de p8, d8'de yalnız geri), pencere = kritik + r(j→j−1) ≤ 2,5 (AV1 d3 istisnası ≤ 2,6; `*_tamam`
#    istisnalarla, `*_katı_tamam` 1,8 / 2,5 ile); set (video + poster) ≤ 15/kodek; tam tur oturumu (0→12) = set +
#    oturum-temel (W ölçümü: oturum − set, font/JS/HTML/fotoğraflar) ≤ 12 (G-B §14.4.1: AV1 ve HEVC; en çok 12,5).
# 8. --vmaf: master → aynı kırpım/ölçek (listedeki `kirpim` filtresi, lanczos, 8 bit yuv420p, FFV1 önbellek `--ref`;
#    önbellek adı kırpım + kaynak kare zamanından özetli, yeniden render'da kendiliğinden yenilenir) ile libvmaf v0.6.1.
#    Eşikler (§12.6): her dosya ortalama ≥ 90; l3 ≥ 93; duvar klipleri (t56 t67 t78 r65 r76 r87) en kötü kare ≥ 80.
# --sec: kodek/kare/VMAF yalnız seçilen çıktılarda (`ad[.kodek][.boyut]`); dikiş/bütçe yine tüm liste üzerinden.
# --sec ya da --yalniz-vmaf verilip --cikti verilmezse çıktı `dogrula-<liste adı>-sec.json` (tam raporu ezmez).
import argparse
import hashlib
import json
import os
import struct
import subprocess
from pathlib import Path

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--liste", default="D:/soft/cop31-varlik/kodlama/render-son.json")
ap.add_argument("--fragman", default="D:/soft/cop31-varlik/render-son")
ap.add_argument("--cikti", default=None)
ap.add_argument("--temel", type=float, default=0.5, help="HTML+JS+CSS+font, MB")
ap.add_argument("--oturum-temel", type=float, default=1.27, help="tam tur oturumunda medya dışı bayt, MB (W-B2: 11,82 − 10,55)")
ap.add_argument("--vmaf", action="store_true")
ap.add_argument("--ref", default="D:/soft/cop31-varlik/kodlama/ref")
ap.add_argument("--yalniz-vmaf", action="store_true", help="yalnız VMAF (dikiş/bütçe atlanır; çıktı yalnız vmaf)")
ap.add_argument("--sec", default="", help="kodek/kare/VMAF yalnız bu çıktılarda: ad[.kodek][.boyut], virgüllü")
ap.add_argument("--esle", default="", help="master kare klasörü eşlemesi: klip=klasör, virgüllü (kodla.mjs --esle)")
ap.add_argument("--geri-yok", default="", help="bilerek kaldırılan geri klipler (bütçe merdiveni): r98")
a = ap.parse_args()
ESLE = {k: v for k, v in (x.split("=", 1) for x in filter(None, a.esle.split(",")))}
GERI_YOK = set(filter(None, a.geri_yok.split(",")))


def kaynak_dizin(klip):
    """Klibin master kare klasörü: --esle ya da <fragman>/<klip>."""
    return Path(ESLE[klip]) if klip in ESLE else Path(a.fragman) / klip
liste = json.load(open(a.liste, encoding="utf8"))
_ad = Path(a.liste).stem
if a.cikti is None:
    a.cikti = str(Path(a.liste).with_name(f"dogrula-{_ad}{'-sec' if (a.sec or a.yalniz_vmaf) else ''}.json"))
MB = 1e6
BEKLENEN = {"h264": "avc1.64001f", "hevc": "hvc1.1.6.L93.90", "av1": "av01.0.05M.08"}
KODEK_BOYUT = {"dikey": ["h264", "hevc", "av1"], "yatay": ["h264", "av1"]}
VIDEO = {"dikey": (720, 1280), "yatay": (1280, 720)}

# ---------- durak zinciri (§12.1; G turu §14.4.2) ----------
# t89: r98 K-son'da kaldırıldı (§14.4.1 merdiven 4. adım; kodla.mjs GERI ile aynı) → d9→d8 poster çapraz sönmesi.
GERI = {"t01": "r10", "t12": "r21", "t23": "r32", "t34": "r43", "t45": "r54", "t56": "r65", "t67": "r76", "t78": "r87", "t89": None, "t9a": None, "tab": None, "tbc": None}
GERI = {k: (None if v in GERI_YOK else v) for k, v in GERI.items()}
# (gelen geçiş, varış döngüsü, varış posteri, çıkan geçiş)
HEDEF = [
    ("t01", "l1", "p1", "t12"),
    ("t12", "l2", "p2", "t23"),
    ("t23", "l3", "p3", "t34"),
    ("t34", "l4", "p4", "t45"),
    ("t45", "l5", "p5", "t56"),
    ("t56", None, "p6", "t67"),  # d6 İklim Eylemleri: döngü yok, son kare durur (p6 = t56 son karesi)
    ("t67", None, "p7", "t78"),  # d7 Sen de söz ver: döngü yok (p7 = t67 son karesi)
    ("t78", None, "p8", "t89"),  # d8 masa: p8 = t78 son karesi (G-B; eski plaka kalktı)
    ("t89", None, "p9", "t9a"),  # d9 fidan-kök: p9 = t89 son
    ("t9a", None, "pa", "tab"),  # d10 fidan-gövde: pa = t9a son
    ("tab", None, "pb", "tbc"),  # d11 fidan-dal: pb = tab son
    ("tbc", "lc", "pc", None),  # d12 fidan-yaprak: lc döngüsü, pc = lc[0]
]
ROLLER = ["dunya", "emanet", "expo", "anatomi", "sutunlar", "duvar", "duvar", "masa", "fidan-kok", "fidan-govde", "fidan-dal", "fidan-yaprak"]
DURAKLAR = [
    {"id": "d0", "rol": "lombar", "gelen": None, "dongu": None, "poster": None},
    *[{"id": f"d{i + 1}", "rol": r, "gelen": h[0], "dongu": h[1], "poster": h[2]} for i, (h, r) in enumerate(zip(HEDEF, ROLLER))],
]
DUVAR = {"t56", "t67", "t78", "r65", "r76", "r87"}
SON_KARE = {"p6": "t56", "p7": "t67", "p8": "t78", "p9": "t89", "pa": "t9a", "pb": "tab"}


def _sec_oku(s):
    o = []
    for x in filter(None, s.split(",")):
        ad, *ek = x.split(".")
        d = {"ad": ad}
        for e in ek:
            if e in ("h264", "hevc", "av1", "webp"):
                d["kodek"] = e
            elif e in ("dikey", "yatay", "d", "y"):
                d["boyut"] = {"d": "dikey", "y": "yatay"}.get(e, e)
            else:
                raise SystemExit(f"--sec {x}: '{e}' kodek ya da boyut değil")
        o.append(d)
    return o


SEC = _sec_oku(a.sec)


def secili(s):
    return not SEC or any(x["ad"] == s["klip"] and x.get("kodek", s["kodek"]) == s["kodek"] and x.get("boyut", s["boyut"]) == s["boyut"] for x in SEC)


# ---------- 1. kodek dizesi ----------
def _kutular(b, bas, son):
    i = bas
    while i + 8 <= son:
        n, t = struct.unpack(">I4s", b[i : i + 8])
        h = 8
        if n == 1:
            n, h = struct.unpack(">Q", b[i + 8 : i + 16])[0], 16
        if n == 0:
            n = son - i
        yield t.decode("latin1"), i + h, i + n
        i += n


def _bul(b, yol, bas=0, son=None):
    son = len(b) if son is None else son
    for t, s, e in _kutular(b, bas, son):
        if t != yol[0]:
            continue
        if len(yol) == 1:
            return s, e
        atla = 8 if t == "stsd" else 78 if t in ("avc1", "hvc1", "hev1", "av01") else 0
        return _bul(b, yol[1:], s + atla, e)
    return None


def kodek_dizesi(yol):
    b = open(yol, "rb").read()
    for orn, kutu in (("avc1", "avcC"), ("hvc1", "hvcC"), ("hev1", "hvcC"), ("av01", "av1C")):
        r = _bul(b, ["moov", "trak", "mdia", "minf", "stbl", "stsd", orn, kutu])
        if not r:
            continue
        c = b[r[0] : r[1]]
        if kutu == "avcC":
            return f"{orn}.{c[1]:02x}{c[2]:02x}{c[3]:02x}"
        if kutu == "hvcC":
            ps, tier, pidc = c[1] >> 6, (c[1] >> 5) & 1, c[1] & 31
            uyum = int(f"{int.from_bytes(c[2:6], 'big'):032b}"[::-1], 2)
            kis = list(c[6:12])
            while kis and kis[-1] == 0:
                kis.pop()
            return f"{orn}.{['', 'A', 'B', 'C'][ps]}{pidc}.{uyum:X}.{'LH'[tier]}{c[12]}" + "".join(f".{x:X}" for x in kis)
        prof, sev = c[1] >> 5, c[1] & 31
        tier, hb, tw = c[2] >> 7, (c[2] >> 6) & 1, (c[2] >> 5) & 1
        return f"av01.{prof}.{sev:02d}{'MH'[tier]}.{12 if tw else 10 if hb else 8:02d}"
    return "?"


def kare_say(yol):
    r = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", yol], capture_output=True, text=True)
    return int(r.stdout.strip())


# ---------- renk ----------
def kareler(yol):
    p = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", yol], capture_output=True, text=True)
    w, h = map(int, p.stdout.strip().split(",")[:2])
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", yol, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    return np.frombuffer(r.stdout, np.uint8).reshape(-1, h, w, 3)


def lab(rgb):
    c = rgb.astype(np.float64) / 255
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def de00_harita(x, y):
    l1, l2 = lab(x), lab(y)
    L1, a1, b1 = np.moveaxis(l1, -1, 0)
    L2, a2, b2 = np.moveaxis(l2, -1, 0)
    C1, C2 = np.hypot(a1, b1), np.hypot(a2, b2)
    Cm = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cm**7 / (Cm**7 + 25**7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = np.hypot(a1p, b1), np.hypot(a2p, b2)
    h1p, h2p = np.degrees(np.arctan2(b1, a1p)) % 360, np.degrees(np.arctan2(b2, a2p)) % 360
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


def de00(x, y):
    return float(de00_harita(x, y).mean())


def fark(x, y):
    return float(np.abs(x.astype(np.int16) - y.astype(np.int16)).mean())


def satir(klip, tur, boyut, kodek=None):
    for s in liste:
        if s["klip"] == klip and s["tur"] == tur and s["boyut"] == boyut and (kodek is None or s["kodek"] == kodek):
            return s
    return None


def fragman(ad):
    p = Path(a.fragman) / f"{ad}.json"
    if p.exists():
        return json.load(open(p, encoding="utf8"))
    if ad == "t34":
        x, y = fragman("t34a"), fragman("t34b")
        return {"kare": x["kare"] + y["kare"]} if x and y else None
    return None


sonuc = {"kodek": [], "kare": [], "duraklar": [], "eksik": [], "dikis": [], "kalkis": [], "geri": [], "dongu": [], "t34": [], "son_kare": [], "butce": {}, "boyut": {}, "vmaf": []}
_onb = {}


def K(s):
    if s["yol"] not in _onb:
        _onb.clear() if len(_onb) > 6 else None
        _onb[s["yol"]] = kareler(s["yol"])
    return _onb[s["yol"]]


def gerekli(klip, tur, boyut, kodek=None, neden=""):
    """Satırı döndürür; yoksa `eksik`e yazar ve None."""
    s = satir(klip, tur, boyut, kodek)
    if s is None:
        sonuc["eksik"].append({"klip": klip, "tur": tur, "boyut": boyut, "kodek": kodek, "neden": neden})
    return s


def poster_kare(s):
    return kareler(s["yol"])[0]


def t34_kesme():
    """t34'ün S1 → S2 kesme karesi k0 (S1'in son karesi): t34a fragmanının kare sayısı − 1 (F-B 35; E 47)."""
    x = fragman("t34a")
    return (x["kare"] - 1) if x and x.get("kare") else 47


def kirpimY_kare(kirpimY, n=-1):
    """Listedeki `kirpimY` (sayı, {bas, son, k0, k1} ya da F'den beri {…, kareler}) → `n`. karedeki sayı; bilinmezse 420."""
    if isinstance(kirpimY, (int, float)):
        return kirpimY
    if isinstance(kirpimY, dict) and isinstance(kirpimY.get("kareler"), list) and kirpimY["kareler"]:
        return kirpimY["kareler"][n if n < 0 else min(n, len(kirpimY["kareler"]) - 1)]
    if isinstance(kirpimY, dict) and "k0" in kirpimY:
        t = 1.0 if n < 0 else min(1.0, max(0.0, (n - kirpimY["k0"]) / (kirpimY["k1"] - kirpimY["k0"])))
        e = 4 * t**3 if t < 0.5 else 1 - (2 - 2 * t) ** 3 / 2
        return kirpimY["bas"] + (kirpimY["son"] - kirpimY["bas"]) * e
    return 420


# 1–2
for s in [] if a.yalniz_vmaf else liste:
    if s["tur"] == "poster" or not secili(s):
        continue
    d = kodek_dizesi(s["yol"])
    sonuc["kodek"].append({"dosya": s["dosya"], "dize": d, "tamam": d == BEKLENEN[s["kodek"]]})
    n = kare_say(s["yol"])
    fr = fragman(s["kaynakKlip"])
    sonuc["kare"].append({"dosya": s["dosya"], "kare": n, "fragman": fr["kare"] if fr else None, "tamam": bool(fr) and n == fr["kare"]})

# durak tablosu: her durağın dosyaları listede mi (12 durak; d0 lombar DOM, d9–d10 DOM broşür, d11 = d1 yeniden)
for D in [] if a.yalniz_vmaf else DURAKLAR:
    r = dict(D)
    for boyut, kodekler in KODEK_BOYUT.items():
        eks = []
        for kodek in kodekler:
            if D["gelen"] and not satir(D["gelen"], "ileri", boyut, kodek):
                eks.append(f"{D['gelen']}.{kodek}")
            if D["dongu"] and not satir(D["dongu"], "dongu", boyut, kodek):
                eks.append(f"{D['dongu']}.{kodek}")
            if D["gelen"] and GERI.get(D["gelen"]) and not satir(GERI[D["gelen"]], "geri", boyut, kodek):
                eks.append(f"{GERI[D['gelen']]}.{kodek}")
        if D["poster"] and not satir(D["poster"], "poster", boyut):
            eks.append(f"{D['poster']}.webp")
        r[f"eksik_{boyut}"] = eks
    sonuc["duraklar"].append(r)

# 3–5
for boyut, kodekler in {} if a.yalniz_vmaf else KODEK_BOYUT.items():
    for kodek in kodekler:
        for i, (t, l, p, cikan) in enumerate(HEDEF):
            st = gerekli(t, "ileri", boyut, kodek, "geçiş")
            sp = gerekli(p, "poster", boyut, None, "poster")
            if not st or not sp:
                continue
            T = K(st)
            P = poster_kare(sp)
            r = {"boyut": boyut, "kodek": kodek, "gecis": t, "poster": p, "dE00_poster": round(de00(T[-1], P), 2)}
            if l:
                sl = gerekli(l, "dongu", boyut, kodek, "döngü")
                if sl:
                    L = K(sl)
                    r["dongu"] = l
                    r["dE00_dongu0"] = round(de00(T[-1], L[0]), 2)
                    r["fark_dongu0"] = round(fark(T[-1], L[0]), 2)
                    r["gecis_ardisik_son5_fark"] = round(float(np.mean([fark(T[k], T[k + 1]) for k in range(len(T) - 6, len(T) - 1)])), 2)
                    ard = [fark(L[k], L[k + 1]) for k in range(len(L) - 1)]
                    ard_de = [de00(L[k], L[k + 1]) for k in range(0, len(L) - 1, max(1, (len(L) - 1) // 12))]
                    sonuc["dongu"].append({"boyut": boyut, "kodek": kodek, "dongu": l, "son_ilk_fark": round(fark(L[-1], L[0]), 3), "ardisik_ort": round(float(np.mean(ard)), 3), "ardisik_maks": round(float(np.max(ard)), 3), "son_ilk_dE00": round(de00(L[-1], L[0]), 3), "ardisik_dE00_ort": round(float(np.mean(ard_de)), 3)})
                    if cikan and (sc := gerekli(cikan, "ileri", boyut, kodek, "çıkan geçiş")):
                        C = K(sc)
                        sonuc["kalkis"].append({"boyut": boyut, "kodek": kodek, "durak": f"d{i + 1}", "dongu": l, "cikan": cikan, "dE00_dongu0_cikan0": round(de00(L[0], C[0]), 2), "dE00_donguSon_cikan0": round(de00(L[-1], C[0]), 2)})
            elif cikan and (sc := gerekli(cikan, "ileri", boyut, kodek, "çıkan geçiş")):
                # Döngüsüz durak (d6, d7): gelen geçişin son karesi durur, çıkan geçiş oradan başlar (§12.6 S2 dikişleri).
                C = K(sc)
                sonuc["kalkis"].append({"boyut": boyut, "kodek": kodek, "durak": f"d{i + 1}", "dongu": None, "cikan": cikan, "dE00_gelenSon_cikan0": round(de00(T[-1], C[0]), 2), "fark_gelenSon_cikan0": round(fark(T[-1], C[0]), 2), "dE00_poster_cikan0": round(de00(P, C[0]), 2)})
            sonuc["dikis"].append(r)
            # geri: r(k+1→k) son karesi ↔ önceki durağın dinlenme karesi (l_k 0. karesi; d6–d8'de p_k ve gelen son karesi).
            # Geri klipsiz adım (fidan içi; --geri-yok) poster çapraz sönmesidir: ölçülmez.
            if i > 0 and GERI.get(t):
                tp, lp, pp, _ = HEDEF[i - 1]
                rg = gerekli(GERI[t], "geri", boyut, kodek, "geri")
                so = gerekli(pp, "poster", boyut, None, "önceki poster")
                if rg and so:
                    Rg, Po = K(rg), poster_kare(so)
                    g = {"boyut": boyut, "kodek": kodek, "geri": rg["klip"], "varis": f"d{i}", "dE00_son_poster": round(de00(Rg[-1], Po), 2)}
                    if lp and (sl := gerekli(lp, "dongu", boyut, kodek, "önceki döngü")):
                        Lo = K(sl)
                        g.update({"dongu": lp, "dE00_son_dongu0": round(de00(Rg[-1], Lo[0]), 2), "fark_son_dongu0": round(fark(Rg[-1], Lo[0]), 2)})
                    elif not lp and (sg := gerekli(tp, "ileri", boyut, kodek, "önceki geçiş")):
                        G = K(sg)
                        g.update({"gelen": tp, "dE00_son_gelenSon": round(de00(Rg[-1], G[-1]), 2), "fark_son_gelenSon": round(fark(Rg[-1], G[-1]), 2)})
                    sonuc["geri"].append(g)
            if t == "t34":
                ard = [fark(T[k], T[k + 1]) for k in range(len(T) - 1)]
                k0 = t34_kesme()
                bej = np.broadcast_to(np.array([255, 241, 220], np.uint8), T[k0].shape)
                sonuc["t34"].append({"boyut": boyut, "kodek": kodek, "kesme": [k0, k0 + 1], "fark_kesme": round(ard[k0], 3), "komsu": [k0 - 4, k0 + 5], "komsu_fark": [round(x, 2) for x in ard[max(0, k0 - 4) : k0 + 6]], "k0_ort_rgb": [round(float(v), 1) for v in T[k0].reshape(-1, 3).mean(0)], "k1_ort_rgb": [round(float(v), 1) for v in T[k0 + 1].reshape(-1, 3).mean(0)], "k0_dE00_FFF1DC": round(de00(T[k0], bej), 2), "k1_dE00_FFF1DC": round(de00(T[k0 + 1], bej), 2)})


# 6. son-kare posterleri ↔ master (§12.6: başlık/rakam bölgesi ΔE00 ≤ 2)
def master_kare(kaynak, n, kirp, boyut):
    g, h = VIDEO[boyut]
    png = kaynak_dizin(kaynak) / f"k_{n:04d}.png"
    if not png.exists():
        return None
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(png), "-vf", f"{kirp},scale={g}:{h}:flags=lanczos,format=rgb24", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    return np.frombuffer(r.stdout, np.uint8).reshape(h, g, 3) if len(r.stdout) == g * h * 3 else None


def bolge_olc(x, m, capa, boyut, kirpimY, R=60, izgara=8):
    """Tüm kare, en kötü karo (izgara × izgara) ve çapa kutuları (±R video px) ΔE00 ortalaması."""
    h = de00_harita(x, m)
    H, W = h.shape
    karo = [float(h[j * H // izgara : (j + 1) * H // izgara, i * W // izgara : (i + 1) * W // izgara].mean()) for j in range(izgara) for i in range(izgara)]
    o = {"tum": round(float(h.mean()), 3), "karo_maks": round(max(karo), 3), "karo_p90": round(float(np.percentile(karo, 90)), 3)}
    if capa:
        ox, oy = (420, 0) if boyut == "dikey" else (0, kirpimY_kare(kirpimY, -1))
        k = {}
        for ad, (cx, cy) in capa.items():
            vx, vy = (cx - ox) / 1.5, (cy - oy) / 1.5
            if not (0 <= vx < W and 0 <= vy < H):
                k[ad] = None
                continue
            y0, y1, x0, x1 = int(max(0, vy - R)), int(min(H, vy + R)), int(max(0, vx - R)), int(min(W, vx + R))
            k[ad] = round(float(h[y0:y1, x0:x1].mean()), 3)
        o["capa"] = k
        v = [x for x in k.values() if x is not None]
        o["capa_maks"] = max(v) if v else None
    return o


for p, kaynak in {} if a.yalniz_vmaf else SON_KARE.items():
    for boyut, kodekler in KODEK_BOYUT.items():
        sp = satir(p, "poster", boyut)
        if not sp:
            continue
        if sp.get("posterTip") != "son-kare":  # D turu p6 plakası (posterTip yok) ölçülmez
            continue
        n = sp.get("kaynakKare")
        fr = fragman(kaynak) or {}
        if n is None:
            n = (fr.get("kare") or 0) - 1
        M = master_kare(kaynak, n, sp["kirpim"], boyut)
        if M is None:
            sonuc["son_kare"].append({"poster": p, "boyut": boyut, "hata": f"master yok: {kaynak}/k_{n:04d}.png"})
            continue
        capa = fr.get("capalar") or (fragman(p) or {}).get("capalar")
        # Yalnız [x, y] çapaları (S3'ün liste çapaları — kok_uclari, bogumlar, dal_uclari — tek tek ölçülmez).
        capa = {k: v for k, v in (capa or {}).items() if isinstance(v, list) and len(v) == 2 and all(isinstance(x, (int, float)) for x in v)} or None
        r = {"poster": p, "kaynak": f"{kaynak}[{n}]", "boyut": boyut, "kalite": sp.get("kalite"), "bayt": sp["bayt"], "poster_master": bolge_olc(poster_kare(sp), M, capa, boyut, sp.get("kirpimY"))}
        for kodek in kodekler:
            st = satir(kaynak, "ileri", boyut, kodek)
            if st:
                r[f"{kodek}_son_master"] = bolge_olc(K(st)[-1], M, capa, boyut, sp.get("kirpimY"))
        sonuc["son_kare"].append(r)


# 7. bütçe — sınırlar §11.2-3, istisnalar §11.6-1 (kritik d2 ≤ 2,1; AV1 pencere d3 ≤ 2,6), duraklar §12.1
def kritik_sinir(varis):
    return 2.1 if varis == "d2" else 1.8


def pencere_sinir(kodek, varis):
    return 2.6 if (kodek == "av1" and varis == "d3") else 2.5


def b(klip, tur, boyut, kodek=None):
    s = satir(klip, tur, boyut, kodek)
    return s["bayt"] if s else 0


for boyut, kodekler in KODEK_BOYUT.items():
    for kodek in kodekler:
        ilk = a.temel * MB + b("t01", "ileri", boyut, kodek) + b("p1", "poster", boyut) + b("l1", "dongu", boyut, kodek) + b("t12", "ileri", boyut, kodek)
        adim = []
        for j in range(1, len(HEDEF) + 1):  # d1 … d12 (d12'de ileri yok: kritik 0, pencere = tbc geri yok → 0)
            ileri = HEDEF[j] if j < len(HEDEF) else None  # (t(j→j+1), l(j+1), p(j+1))
            gelen = HEDEF[j - 1][0]
            parca = {
                "t": b(ileri[0], "ileri", boyut, kodek) if ileri else 0,
                "l": b(ileri[1], "dongu", boyut, kodek) if ileri and ileri[1] else 0,
                "p": b(ileri[2], "poster", boyut) if ileri else 0,
                "r": b(GERI[gelen], "geri", boyut, kodek) if GERI.get(gelen) else 0,
            }
            kritik = parca["t"] + parca["l"] + parca["p"]
            adim.append({"varis": f"d{j}", "ileri": ileri[0] if ileri else None, "geri": GERI.get(gelen), "kritik_MB": round(kritik / MB, 3), "kritik_sinir": kritik_sinir(f"d{j}"), "pencere_MB": round((kritik + parca["r"]) / MB, 3), "pencere_sinir": pencere_sinir(kodek, f"d{j}"), "parca_KB": {k: round(v / 1000) for k, v in parca.items()}})
        video = sum(s["bayt"] for s in liste if s["boyut"] == boyut and s["kodek"] == kodek)
        poster = sum(s["bayt"] for s in liste if s["boyut"] == boyut and s["tur"] == "poster")
        oturum = video + poster + a.oturum_temel * MB
        sonuc["butce"][f"{boyut}-{kodek}"] = {
            "ilk_MB": round(ilk / MB, 3), "ilk_tamam": ilk <= 2.5 * MB, "adim": adim,
            "kritik_maks_MB": max(x["kritik_MB"] for x in adim), "kritik_tamam": all(x["kritik_MB"] <= x["kritik_sinir"] for x in adim), "kritik_katı_tamam": all(x["kritik_MB"] <= 1.8 for x in adim),
            "pencere_maks_MB": max(x["pencere_MB"] for x in adim), "pencere_tamam": all(x["pencere_MB"] <= x["pencere_sinir"] for x in adim), "pencere_katı_tamam": all(x["pencere_MB"] <= 2.5 for x in adim),
            "video_MB": round(video / MB, 3), "poster_MB": round(poster / MB, 3), "set_MB": round((video + poster) / MB, 3), "set_tamam": (video + poster) <= 15 * MB,
            "oturum_MB": round(oturum / MB, 3), "oturum_temel_MB": a.oturum_temel, "oturum_tamam": oturum <= 12 * MB,
        }
for s in [] if a.yalniz_vmaf else liste:
    sonuc["boyut"].setdefault(f"{s['boyut']}-{s['kodek']}", {})[s["klip"]] = s["bayt"]


# 8. VMAF
def ref_kirp(s):
    if s.get("kirpim"):
        return s["kirpim"]
    return "crop=w=iw*1080/1920:h=ih:x=iw*420/1920:y=0" if s["boyut"] == "dikey" else "crop=w=iw:h=ih*1080/1920:x=0:y=ih*420/1920"


def ref_yol(s):
    # Önbellek adı: kırpım filtresi + kaynak ilk/son karenin değişme zamanı (yeniden render → yeni referans).
    pngs = sorted(kaynak_dizin(s["kaynakKlip"]).glob("k_*.png"))
    imza = f"{ref_kirp(s)}|{pngs[0].stat().st_mtime_ns}|{pngs[-1].stat().st_mtime_ns}|{len(pngs)}"
    return Path(a.ref) / f"{s['kaynakKlip']}-{s['boyut']}-{hashlib.sha256(imza.encode()).hexdigest()[:8]}.mkv"


def ref_yap(s):
    y = ref_yol(s)
    if y.exists():
        return y
    y.parent.mkdir(parents=True, exist_ok=True)
    kirp = ref_kirp(s)
    g, h = VIDEO[s["boyut"]]
    dz = kaynak_dizin(s["kaynakKlip"])
    gec = y.with_suffix(".tmp.mkv")
    bas = min(int(p.stem[2:]) for p in dz.glob("k_*.png"))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-start_number", str(bas), "-i", str(dz / "k_%04d.png"), "-vf", f"{kirp},scale={g}:{h}:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "ffv1", "-level", "3", str(gec)], check=True)
    os.replace(gec, y)
    return y


def vmaf_esik(s):
    """§12.6: ortalama ≥ 90 (l3 ≥ 93); duvar klipleri en kötü kare ≥ 80."""
    return {"ort": 93.0 if s["klip"] == "l3" else 90.0, "min": 80.0 if s["klip"] in DUVAR else None}


if a.vmaf:
    for s in liste:
        if s["tur"] == "poster" or not secili(s):
            continue
        ref = ref_yap(s)
        tersi = ",reverse" if s["tur"] == "geri" else ""
        # log_path göreli (Windows sürücü iki noktası filtre sözdizimini bozar): ffmpeg `--ref` dizininde çalışır.
        log = Path(a.ref) / f"vmaf-{os.getpid()}.json"
        fc = f"[0:v]setpts=N/30/TB,format=yuv420p[d];[1:v]setpts=N/30/TB,format=yuv420p{tersi}[r];[d][r]libvmaf=log_path={log.name}:log_fmt=json:n_threads=6"
        r = subprocess.run(["ffmpeg", "-v", "error", "-i", s["yol"], "-i", str(ref), "-filter_complex", fc, "-f", "null", "-"], capture_output=True, text=True, cwd=a.ref)
        if r.returncode:
            sonuc["vmaf"].append({"dosya": s["dosya"], "hata": r.stderr[-300:]})
            continue
        j = json.load(open(log, encoding="utf8"))
        log.unlink(missing_ok=True)
        v = j["pooled_metrics"]["vmaf"]
        es = vmaf_esik(s)
        tamam = v["mean"] >= es["ort"] and (es["min"] is None or v["min"] >= es["min"])
        sonuc["vmaf"].append({"boyut": s["boyut"], "kodek": s["kodek"], "klip": s["klip"], "dosya": s["dosya"], "bayt": s["bayt"], "crf": s.get("crf"), "ort": round(v["mean"], 2), "min": round(v["min"], 2), "hmean": round(v["harmonic_mean"], 2), "esik_ort": es["ort"], "esik_min": es["min"], "tamam": tamam})
        print("vmaf", s["boyut"], s["klip"], s["kodek"], f"crf {s.get('crf')}", f"{s['bayt'] / 1000:.1f} kB", round(v["mean"], 2), round(v["min"], 2), "✓" if tamam else "✗", flush=True)

Path(a.cikti).parent.mkdir(parents=True, exist_ok=True)
json.dump(sonuc, open(a.cikti, "w", encoding="utf8"), ensure_ascii=False, indent=1)
kotu = [x for x in sonuc["kodek"] if not x["tamam"]] + [x for x in sonuc["kare"] if not x["tamam"]]
print("kodek/kare uyumsuz:", len(kotu), kotu[:5])
if sonuc["eksik"]:
    print("eksik:", len(sonuc["eksik"]), sorted({f"{x['klip']}({x['tur']})" for x in sonuc["eksik"]}))
for D in sonuc["duraklar"]:
    if D["eksik_dikey"] or D["eksik_yatay"]:
        print("durak", D["id"], D["rol"], "eksik dikey", D["eksik_dikey"], "yatay", D["eksik_yatay"])
for k in ("dikis", "kalkis", "dongu", "t34", "geri", "son_kare"):
    for r in sonuc[k]:
        print(k, json.dumps(r, ensure_ascii=False))
for k, v in sonuc["butce"].items():
    print("butce", k, f"ilk {v['ilk_MB']} MB, kritik maks {v['kritik_maks_MB']}, pencere maks {v['pencere_maks_MB']}, set {v['set_MB']} MB (video {v['video_MB']}, poster {v['poster_MB']}), oturum {v['oturum_MB']} (temel {v['oturum_temel_MB']})", "kritik", [x["kritik_MB"] for x in v["adim"]], "pencere", [x["pencere_MB"] for x in v["adim"]], f"§11.6-1 kritik {v['kritik_tamam']} pencere {v['pencere_tamam']} (katı {v['kritik_katı_tamam']}/{v['pencere_katı_tamam']}) oturum {v['oturum_tamam']}")
for k in ("dikey-av1", "dikey-hevc"):
    if k in sonuc["butce"]:
        print(f"bütçe adımları ({k}):", " · ".join(f"{x['varis']} {x['kritik_MB']}/{x['pencere_MB']}" for x in sonuc["butce"][k]["adim"]))
if sonuc["vmaf"]:
    alt = [x for x in sonuc["vmaf"] if "ort" in x and not x["tamam"]]
    print("VMAF eşik altı (§12.6):", len(alt), [(x["boyut"], x["klip"], x["kodek"], x["ort"], x["min"]) for x in alt])
print("→", a.cikti)
