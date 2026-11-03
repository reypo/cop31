# /icinden v3 — teslim setinin doğrulaması (docs/brief-icinden-3.md §9.4, §11.2; kodlama ajanı K, B/C turu).
#
#   python -X utf8 -P scripts/icinden/kodlama-dogrula.py [--liste D:/soft/cop31-varlik/kodlama/render-son.json]
#        [--fragman D:/soft/cop31-varlik/render-son] [--cikti D:/soft/cop31-varlik/kodlama/dogrula-render-son.json]
#        [--temel 0.5] [--oturum-temel 1.27] [--vmaf] [--ref D:/soft/cop31-varlik/kodlama/ref]
#
# 1. Kodek dizesi MP4 örnek tanımından (avcC / hvcC / av1C, RFC 6381): avc1.64001f, hvc1.1.6.L93.90 (x265'in
#    gerçek dizesi; manifest de bunu kullanır), av01.0.05M.08.
# 2. Kare sayısı (ffprobe -count_frames) = fragman `kare` (t34: t34.json ya da t34a + t34b).
# 3. Dikişler (her kodek ve kırpım, kodlanmış kareler): geçişin SON karesi ↔ hedef döngünün 0. karesi ve posteri
#    (ΔE00 ortalama, hedef ≤ 3); kalkış: döngünün 0. karesi ↔ çıkan geçişin 0. karesi; t56 son ↔ p6; geri: r(k+1→k)
#    son karesi ↔ l_k 0. karesi (r32 son ↔ l2 0 gibi).
# 4. Döngü kapanışı: son→ilk fark ↔ ardışık kare farkı (ortalama mutlak /255 ve ΔE00).
# 5. t34 iç dikişi (kare 47 ↔ 48) ve parlama karelerinin tonu (#FFF1DC).
# 6. Bütçe (§11.2-3; MB = 10^6 bayt): ilk yükleme = temel (HTML+JS+CSS+font, W ölçümü) + t01 + p1 + l1 + t12 ≤ 2,5;
#    d_j'ye varınca kritik yol t(j→j+1) + l(j+1) + p(j+1) ≤ 1,8 (§11.6-1: d2 istisnası ≤ 2,1), pencere = kritik +
#    r(j→j−1) ≤ 2,5 (§11.6-1: AV1 d3 istisnası ≤ 2,6; `*_tamam` istisnalarla, `*_katı_tamam` 1,8 / 2,5 ile); set (video +
#    poster) ≤ 15/kodek; tam tur oturumu (0→10) = set + oturum-temel (W-B2: oturum − set, font/JS/HTML/broşür
#    fotoğrafları) ≤ 12 (AV1).
# 7. --vmaf: master → aynı kırpım/ölçek (listedeki `kirpim` filtresi, lanczos, 8 bit yuv420p, FFV1 önbellek `--ref`;
#    önbellek adı kırpım + kaynak kare zamanından özetli, yeniden render'da kendiliğinden yenilenir) ile libvmaf v0.6.1.
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
ap.add_argument("--cikti", default="D:/soft/cop31-varlik/kodlama/dogrula-render-son.json")
ap.add_argument("--temel", type=float, default=0.5, help="HTML+JS+CSS+font, MB")
ap.add_argument("--oturum-temel", type=float, default=1.27, help="tam tur oturumunda medya dışı bayt, MB (W-B2: 11,82 − 10,55)")
ap.add_argument("--vmaf", action="store_true")
ap.add_argument("--ref", default="D:/soft/cop31-varlik/kodlama/ref")
ap.add_argument("--yalniz-vmaf", action="store_true", help="yalnız VMAF (dikiş/bütçe atlanır; çıktı yalnız vmaf)")
a = ap.parse_args()
liste = json.load(open(a.liste, encoding="utf8"))
MB = 1e6
BEKLENEN = {"h264": "avc1.64001f", "hevc": "hvc1.1.6.L93.90", "av1": "av01.0.05M.08"}
KODEK_BOYUT = {"dikey": ["h264", "hevc", "av1"], "yatay": ["h264", "av1"]}


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


def de00(x, y):
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
    return float(np.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh)).mean())


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


sonuc = {"kodek": [], "kare": [], "dikis": [], "kalkis": [], "geri": [], "dongu": [], "t34": [], "butce": {}, "boyut": {}, "vmaf": []}
_onb = {}


def K(s):
    if s["yol"] not in _onb:
        _onb.clear() if len(_onb) > 6 else None
        _onb[s["yol"]] = kareler(s["yol"])
    return _onb[s["yol"]]


# 1–2
for s in [] if a.yalniz_vmaf else liste:
    if s["tur"] == "poster":
        continue
    d = kodek_dizesi(s["yol"])
    sonuc["kodek"].append({"dosya": s["dosya"], "dize": d, "tamam": d == BEKLENEN[s["kodek"]]})
    n = kare_say(s["yol"])
    fr = fragman(s["kaynakKlip"])
    sonuc["kare"].append({"dosya": s["dosya"], "kare": n, "fragman": fr["kare"] if fr else None, "tamam": bool(fr) and n == fr["kare"]})

# 3–5
HEDEF = [("t01", "l1", "p1", "t12"), ("t12", "l2", "p2", "t23"), ("t23", "l3", "p3", "t34"), ("t34", "l4", "p4", "t45"), ("t45", "l5", "p5", "t56"), ("t56", None, "p6", None)]
for boyut, kodekler in {} if a.yalniz_vmaf else KODEK_BOYUT.items():
    for kodek in kodekler:
        for t, l, p, cikan in HEDEF:
            st = satir(t, "ileri", boyut, kodek)
            T = K(st)
            r = {"boyut": boyut, "kodek": kodek, "gecis": t}
            sp = satir(p, "poster", boyut)
            P = kareler(sp["yol"])[0]
            r["poster"] = p
            r["dE00_poster"] = round(de00(T[-1], P), 2)
            if t == "t56":
                # p6 broşürsüz (§11.1 S2-C 2): dikiş broşür dikdörtgeninin DIŞINDA ölçülür (0 ve 45 master px pay;
                # yığının taşan kâğıtları ve gölgesi dikdörtgene ≤ 37 master px). Video px = (master − kırpım) / 1,5.
                q = np.array(fragman("t56")["brosur_dikdortgen"], float)
                x0, y0, x1, y1 = q[:, 0].min(), q[:, 1].min(), q[:, 0].max(), q[:, 1].max()
                ox, oy = (420, 0) if boyut == "dikey" else (0, st.get("kirpimY") if isinstance(st.get("kirpimY"), (int, float)) else 420)
                hh, ww = P.shape[:2]
                yy, xx = np.mgrid[0:hh, 0:ww] * 1.5
                xx, yy = xx + ox, yy + oy
                for pay in (0, 45):
                    dis = (xx < x0 - pay) | (xx > x1 + pay) | (yy < y0 - pay) | (yy > y1 + pay)
                    r[f"dE00_poster_dis{pay}"] = round(de00(T[-1][dis], P[dis]), 3)
                    r[f"fark_poster_dis{pay}"] = round(fark(T[-1][dis], P[dis]), 3)
            if l:
                L = K(satir(l, "dongu", boyut, kodek))
                r["dongu"] = l
                r["dE00_dongu0"] = round(de00(T[-1], L[0]), 2)
                r["fark_dongu0"] = round(fark(T[-1], L[0]), 2)
                r["gecis_ardisik_son5_fark"] = round(float(np.mean([fark(T[i], T[i + 1]) for i in range(len(T) - 6, len(T) - 1)])), 2)
                ard = [fark(L[i], L[i + 1]) for i in range(len(L) - 1)]
                ard_de = [de00(L[i], L[i + 1]) for i in range(0, len(L) - 1, max(1, (len(L) - 1) // 12))]
                sonuc["dongu"].append({"boyut": boyut, "kodek": kodek, "dongu": l, "son_ilk_fark": round(fark(L[-1], L[0]), 3), "ardisik_ort": round(float(np.mean(ard)), 3), "ardisik_maks": round(float(np.max(ard)), 3), "son_ilk_dE00": round(de00(L[-1], L[0]), 3), "ardisik_dE00_ort": round(float(np.mean(ard_de)), 3)})
                if cikan:
                    C = K(satir(cikan, "ileri", boyut, kodek))
                    sonuc["kalkis"].append({"boyut": boyut, "kodek": kodek, "dongu": l, "cikan": cikan, "dE00_dongu0_cikan0": round(de00(L[0], C[0]), 2), "dE00_donguSon_cikan0": round(de00(L[-1], C[0]), 2)})
            sonuc["dikis"].append(r)
            # geri: r(k+1→k) son karesi ↔ l_k 0. karesi (geçişin 0. karesine dönüş; r10 → d0 DOM, döngü yok)
            onceki = {"t12": "l1", "t23": "l2", "t34": "l3", "t45": "l4", "t56": "l5"}.get(t)
            if onceki:
                rg = satir(f"r{t[2]}{t[1]}", "geri", boyut, kodek)
                Rg, Lo = K(rg), K(satir(onceki, "dongu", boyut, kodek))
                Po = kareler(satir(f"p{onceki[1]}", "poster", boyut)["yol"])[0]
                sonuc["geri"].append({"boyut": boyut, "kodek": kodek, "geri": rg["klip"], "dongu": onceki, "dE00_son_dongu0": round(de00(Rg[-1], Lo[0]), 2), "fark_son_dongu0": round(fark(Rg[-1], Lo[0]), 2), "dE00_son_poster": round(de00(Rg[-1], Po), 2)})
            if t == "t34":
                ard = [fark(T[i], T[i + 1]) for i in range(len(T) - 1)]
                ort = T.reshape(-1, 3).mean(0) if False else T[47].reshape(-1, 3).mean(0)
                sonuc["t34"].append({"boyut": boyut, "kodek": kodek, "fark_47_48": round(ard[47], 3), "komsu_43_52": [round(x, 2) for x in ard[43:53]], "k47_ort_rgb": [round(float(v), 1) for v in T[47].reshape(-1, 3).mean(0)], "k48_ort_rgb": [round(float(v), 1) for v in T[48].reshape(-1, 3).mean(0)], "k47_dE00_FFF1DC": round(de00(T[47], np.broadcast_to(np.array([255, 241, 220], np.uint8), T[47].shape)), 2)})


# 6. bütçe — sınırlar §11.2-3, istisnalar §11.6-1 (kritik d2 ≤ 2,1; AV1 pencere d3 ≤ 2,6)
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
        for j in range(1, 6):
            parca = {"t": b(f"t{j}{j + 1}", "ileri", boyut, kodek), "l": b(f"l{j + 1}", "dongu", boyut, kodek), "p": b(f"p{j + 1}", "poster", boyut), "r": b(f"r{j}{j - 1}", "geri", boyut, kodek)}
            kritik = parca["t"] + parca["l"] + parca["p"]
            adim.append({"varis": f"d{j}", "kritik_MB": round(kritik / MB, 3), "kritik_sinir": kritik_sinir(f"d{j}"), "pencere_MB": round((kritik + parca["r"]) / MB, 3), "pencere_sinir": pencere_sinir(kodek, f"d{j}"), "parca_KB": {k: round(v / 1000) for k, v in parca.items()}})
        video = sum(s["bayt"] for s in liste if s["boyut"] == boyut and s["kodek"] == kodek)
        poster = sum(s["bayt"] for s in liste if s["boyut"] == boyut and s["tur"] == "poster")
        oturum = video + poster + a.oturum_temel * MB
        sonuc["butce"][f"{boyut}-{kodek}"] = {
            "ilk_MB": round(ilk / MB, 3), "ilk_tamam": ilk <= 2.5 * MB, "adim": adim,
            "kritik_maks_MB": max(x["kritik_MB"] for x in adim), "kritik_tamam": all(x["kritik_MB"] <= x["kritik_sinir"] for x in adim), "kritik_katı_tamam": all(x["kritik_MB"] <= 1.8 for x in adim),
            "pencere_maks_MB": max(x["pencere_MB"] for x in adim), "pencere_tamam": all(x["pencere_MB"] <= x["pencere_sinir"] for x in adim), "pencere_katı_tamam": all(x["pencere_MB"] <= 2.5 for x in adim),
            "video_MB": round(video / MB, 3), "poster_MB": round(poster / MB, 3), "set_MB": round((video + poster) / MB, 3), "set_tamam": (video + poster) <= 15 * MB,
            "oturum_MB": round(oturum / MB, 3), "oturum_tamam": oturum <= 12 * MB,
        }
for s in [] if a.yalniz_vmaf else liste:
    sonuc["boyut"].setdefault(f"{s['boyut']}-{s['kodek']}", {})[s["klip"]] = s["bayt"]


# 7. VMAF
def ref_kirp(s):
    if s.get("kirpim"):
        return s["kirpim"]
    return "crop=w=iw*1080/1920:h=ih:x=iw*420/1920:y=0" if s["boyut"] == "dikey" else "crop=w=iw:h=ih*1080/1920:x=0:y=ih*420/1920"


def ref_yol(s):
    # Önbellek adı: kırpım filtresi + kaynak ilk/son karenin değişme zamanı (yeniden render → yeni referans).
    pngs = sorted((Path(a.fragman) / s["kaynakKlip"]).glob("k_*.png"))
    imza = f"{ref_kirp(s)}|{pngs[0].stat().st_mtime_ns}|{pngs[-1].stat().st_mtime_ns}|{len(pngs)}"
    return Path(a.ref) / f"{s['kaynakKlip']}-{s['boyut']}-{hashlib.sha256(imza.encode()).hexdigest()[:8]}.mkv"


def ref_yap(s):
    y = ref_yol(s)
    if y.exists():
        return y
    y.parent.mkdir(parents=True, exist_ok=True)
    kirp = ref_kirp(s)
    g, h = (720, 1280) if s["boyut"] == "dikey" else (1280, 720)
    kok = Path(a.fragman)
    dz = kok / s["kaynakKlip"]
    gec = y.with_suffix(".tmp.mkv")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", str(dz / "k_%04d.png"), "-vf", f"{kirp},scale={g}:{h}:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "ffv1", "-level", "3", str(gec)], check=True)
    os.replace(gec, y)
    return y


if a.vmaf:
    for s in liste:
        if s["tur"] == "poster":
            continue
        ref = ref_yap(s)
        tersi = ",reverse" if s["tur"] == "geri" else ""
        # log_path göreli (Windows sürücü iki noktası filtre sözdizimini bozar): ffmpeg `--ref` dizininde çalışır.
        log = Path(a.ref) / "vmaf.json"
        fc = f"[0:v]setpts=N/30/TB,format=yuv420p[d];[1:v]setpts=N/30/TB,format=yuv420p{tersi}[r];[d][r]libvmaf=log_path=vmaf.json:log_fmt=json:n_threads=6"
        r = subprocess.run(["ffmpeg", "-v", "error", "-i", s["yol"], "-i", str(ref), "-filter_complex", fc, "-f", "null", "-"], capture_output=True, text=True, cwd=a.ref)
        if r.returncode:
            sonuc["vmaf"].append({"dosya": s["dosya"], "hata": r.stderr[-300:]})
            continue
        v = json.load(open(log, encoding="utf8"))["pooled_metrics"]["vmaf"]
        sonuc["vmaf"].append({"boyut": s["boyut"], "kodek": s["kodek"], "klip": s["klip"], "crf": s.get("crf"), "ort": round(v["mean"], 2), "min": round(v["min"], 2), "hmean": round(v["harmonic_mean"], 2)})
        print("vmaf", s["boyut"], s["klip"], s["kodek"], round(v["mean"], 2), round(v["min"], 2), flush=True)

Path(a.cikti).parent.mkdir(parents=True, exist_ok=True)
json.dump(sonuc, open(a.cikti, "w", encoding="utf8"), ensure_ascii=False, indent=1)
kotu = [x for x in sonuc["kodek"] if not x["tamam"]] + [x for x in sonuc["kare"] if not x["tamam"]]
print("kodek/kare uyumsuz:", len(kotu), kotu[:5])
for k in ("dikis", "kalkis", "dongu", "t34"):
    for r in sonuc[k]:
        print(k, json.dumps(r, ensure_ascii=False))
for r in sonuc["geri"]:
    print("geri", json.dumps(r, ensure_ascii=False))
for k, v in sonuc["butce"].items():
    print("butce", k, f"ilk {v['ilk_MB']} MB, kritik maks {v['kritik_maks_MB']}, pencere maks {v['pencere_maks_MB']}, set {v['set_MB']} MB (video {v['video_MB']}, poster {v['poster_MB']}), oturum {v['oturum_MB']}", "kritik", [x["kritik_MB"] for x in v["adim"]], "pencere", [x["pencere_MB"] for x in v["adim"]], f"§11.6-1 kritik {v['kritik_tamam']} pencere {v['pencere_tamam']} (katı {v['kritik_katı_tamam']}/{v['pencere_katı_tamam']})")
if sonuc["vmaf"]:
    alt = [x for x in sonuc["vmaf"] if "ort" in x and x["ort"] < 90]
    print("VMAF < 90:", len(alt), [(x["boyut"], x["klip"], x["kodek"], x["ort"]) for x in alt])
print("→", a.cikti)
