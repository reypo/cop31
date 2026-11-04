"""t23 pozlama eğrisinin ölçülerek tasarımı (C turu, brief §11.1-2; G turu, brief §14.4.5). Blender'ın Python'unda
çalışır (PyOpenColorIO + OpenImageIO + numpy, GPU yok):

    <blender>/5.2/python/bin/python.exe poz_egri.py <önizleme kökü> [--taban 23] [--yuk 2.0]            # C kipi
    <blender>/5.2/python/bin/python.exe poz_egri.py <tasarım kökü> --kip g [--kok0 <m=0 kökü>] [--kok1 <m=1 kökü>]
        [--mevsim_aralik 500e3,100e3] [--taban 22.5] [--ust_km 1580] [--alt_km 25] [--inis 5] [--esik 3]

C kipi — girdi: sahne.py --exr ile render edilmiş t23 önizlemesi (<kök>/t23/k_####.exr doğrusal, pozlamasız;
k_####.png; <kök>/t23.json irtifalar; <kök>/olcum.jsonl karelerin pozlaması). Adımlar:
1. Doğrulama: EXR × 2^EV → AgX + "AgX - Punchy" (sRGB) = Blender PNG'si (ortalama mutlak fark /255).
2. Her kare için luma(EV) tablosu (luma: kodlanmış R'G'B' Rec.709 ağırlıklı ortalama, %).
3. Hedef: kare ≤ 14 pozlama 1,3 (l2 ile aynı); doğal luma TABAN'ın altına inen karelerde ve kare 26–36'da luma = TABAN;
   kare 36–40 TABAN → TABAN + YUK (azalan yönde en çok YUK yükseliş, ölçüt ±3); kare 40–46 pozlama 0,3'e doğrusal.
4. Düğümler (irtifa km, k = (EV − 0,3) / 1,0) → sahne.py POZ_EGRI (Fritsch–Carlson, ln irtifa).

G kipi (G4, fiske t23 72 kare, irtifaya bağlı mevsim karışımı) — girdi: <tasarım kökü> (luma tablosunun alındığı
render; G4'te Cycles 960² 16 örnek, --mevsim oto: EEVEE 120 km altında gök/pus ışığını Cycles'tan 5–15 luma puanı
karanlık veriyor, ölçüldü → tasarım Cycles'la), isteğe bağlı --kok0 / --kok1 (sahne.py --mevsim_sabit 0 / 1). Kare f
tasarım kökünde render edildiği m ile (t23.json g_turu.mevsim_k) --mevsim_aralik'ın m'si eşleşmiyorsa doğrusal görüntü
(1 − m)·EXR0 + m·EXR1 (işleme albedoya doğrusal → karışım düğümünün eşdeğeri). Karışımın kare başına ΔE00'ı
--kok0/--kok1 ile ölçülür. Adımlar:
1. Doğrulama (OCIO ↔ PNG) iki kökte de.
2. luma(EV) tablosu (C ile aynı tanım).
3. Hedef luma T(f): irtifa ≥ --ust_km karelerde EV 1,3 (l2 ≡ t23[0]); sonraki --inis karede smoothstep ile TABAN'a iner;
   TABAN'da kalır; yükseliş kübik Hermite (TABAN, eğim 0) → (fc, L(fc, 0,3), doğal eğim) — fc = irtifa ≤ --alt_km ilk kare
   (k = 0: l3/t34a ve t23 iniş sonu E/F ile aynı). Yükseliş başı, en büyük kare eğimi ≤ --esik_pay · --esik olacak en geç kare.
4. EV(f) = L⁻¹(f, T(f)); düğümler her karenin irtifasında (ust..fc) → sahne.py POZ_EGRI_G.
5. Raporlar: öngörülen luma, ardışık |Δ| (%, /255), 77–1.580 km "tek yön" (kontak.py olc_c tanımı), mevsim
   karışımının kare başına ΔE00'ı (aynı kamera, EV(f): m(f) ↔ m(f−1); tam kare ortalaması ve değişen bölge) ve
   Kasım ↔ ilkbahar tam farkı. Çıktı <tasarım kökü>/poz_egri_g.json.
"""
import argparse
import json
import math
import os
import sys

import numpy as np
import OpenImageIO as oiio
import PyOpenColorIO as O

CFG = os.path.join(os.path.dirname(os.__file__), "..", "..", "datafiles", "colormanagement", "config.ocio")
ap = argparse.ArgumentParser()
ap.add_argument("kok")
ap.add_argument("--taban", type=float, default=23.0)
ap.add_argument("--yuk", type=float, default=2.0)
# G kipi (G4)
ap.add_argument("--kip", default="c", choices=["c", "g"])
ap.add_argument("--kok1", default="")                        # G: m = 1 (ilkbahar) EXR kökü (karışım ölçümü / eksik kare)
ap.add_argument("--kok0", default="")                        # G: m = 0 (Kasım) EXR kökü; boşsa <kök> m = 0 sayılır
ap.add_argument("--mevsim_aralik", default="500e3,100e3")
ap.add_argument("--ust_km", type=float, default=1580.0)
ap.add_argument("--alt_km", type=float, default=25.0)
ap.add_argument("--inis", type=int, default=5)
ap.add_argument("--esik", type=float, default=3.0)            # ardışık kare luma farkı sınırı (%, brief §14.4.5 "|Δ| ≤ 3")
ap.add_argument("--esik_pay", type=float, default=0.95)       # yükselişin en büyük kare eğimi ≤ esik_pay · esik
ap.add_argument("--yukselis_bas", type=int, default=-1)       # -1: otomatik (eğim ölçütüyle en geç kare)
a = ap.parse_args()

cfg = O.Config.CreateFromFile(os.path.normpath(CFG))
vp = O.LegacyViewingPipeline()
vp.setDisplayViewTransform(O.DisplayViewTransform(src="Linear Rec.709", display="sRGB", view="AgX"))
vp.setLooksOverrideEnabled(True)
vp.setLooksOverride("AgX - Punchy")
proc = vp.getProcessor(cfg).getDefaultCPUProcessor()


def oku(p):
    i = oiio.ImageInput.open(p); x = i.read_image(format="float"); i.close()
    return np.ascontiguousarray(x[..., :3], dtype=np.float32)


def gorunum(lin, ev):
    x = np.ascontiguousarray(lin * (2.0 ** ev), dtype=np.float32)
    proc.applyRGB(x)
    return np.clip(x, 0, 1)


def luma(x):
    return float((0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2]).mean() * 100)


EV = np.round(np.arange(-0.5, 3.51, 0.05), 3)


def poz_oku(kok, klip="t23"):
    poz = {}
    for ln in open(os.path.join(kok, "olcum.jsonl"), encoding="utf-8"):
        o = json.loads(ln)
        if o.get("klip") == klip and "pozlama" in o:
            poz[o["kare"]] = o["pozlama"]
    return poz


def c_kipi():
    kok = os.path.join(a.kok, "t23")
    poz = poz_oku(a.kok)
    IRT = [k["irtifa_m"] for k in json.load(open(os.path.join(a.kok, "t23.json"), encoding="utf-8"))["kamera"]["kareler"]]
    TAB, dog = {}, {}
    for f in sorted(poz):
        e = os.path.join(kok, f"k_{f:04d}.exr")
        if f > 60 or not os.path.exists(e):
            continue
        lin = oku(e)
        if f % 10 == 0:
            g = gorunum(lin, poz[f]); r = oku(os.path.join(kok, f"k_{f:04d}.png"))
            dog[f] = round(float(np.abs(g - r).mean() * 255), 4)
        TAB[f] = np.array([luma(gorunum(lin[::2, ::2], ev)) for ev in EV])
    print("doğrulama (OCIO ↔ PNG, ort. mutlak fark /255):", dog)

    def L(f, ev):
        return float(np.interp(ev, EV, TAB[f]))

    def Einv(f, l):
        return float(np.interp(l, TAB[f], EV))

    dug = {}
    for f in sorted(TAB):
        if f <= 14:
            e = 1.3
        elif f <= 24:
            e = Einv(f, a.taban) if L(f, 1.3) < a.taban else 1.3
        elif f <= 36:
            e = Einv(f, a.taban)
        elif f <= 40:
            e = Einv(f, a.taban + a.yuk * (f - 36) / 4)
        elif f <= 46:
            e40 = Einv(40, a.taban + a.yuk)
            e = e40 + (0.3 - e40) * (f - 40) / 6
        else:
            e = 0.3
        dug[f] = e
    fs = sorted(dug)
    print("kare  irtifa_km  EV  öngörülen_luma")
    for f in fs:
        print(f"{f:3d} {IRT[f] / 1000:10.3f} {dug[f]:6.3f} {L(f, dug[f]):6.2f}")
    # sahne.py tablosu: irtifa artan; uçlarda yinelenen değerler atılır (eğri dışında kıskaç)
    satir = sorted(((IRT[f] / 1000, dug[f] - 0.3) for f in fs if 14 <= f <= 46), key=lambda x: x[0])
    print("POZ_EGRI = [" + ", ".join(f"({x:.2f}, {k:.3f})" for x, k in satir) + "]")
    json.dump({"taban": a.taban, "yuk": a.yuk, "dogrulama": dog, "dugum": [[round(IRT[f] / 1000, 3), round(dug[f], 4), round(L(f, dug[f]), 3)] for f in fs],
               "ev": EV.tolist(), "tablo": {f: [round(v, 3) for v in TAB[f]] for f in TAB}},
              open(os.path.join(a.kok, "poz_egri.json"), "w", encoding="utf-8"), indent=1)


# ------------------------------------------------------------------------------------------------ G kipi (G4)
def ss(x, a_, b_):
    t = min(1.0, max(0.0, (x - a_) / (b_ - a_)))
    return t * t * (3 - 2 * t)


def fc_egimleri(xs, ys):
    """sahne.py _fc_egimleri ile aynı (Fritsch–Carlson)."""
    n = len(xs)
    h = [xs[i + 1] - xs[i] for i in range(n - 1)]
    dl = [(ys[i + 1] - ys[i]) / h[i] for i in range(n - 1)]
    m = [dl[0]] + [0.0] * (n - 2) + [dl[-1]]
    for i in range(1, n - 1):
        if dl[i - 1] * dl[i] > 0:
            w1 = 2 * h[i] + h[i - 1]; w2 = h[i] + 2 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / dl[i - 1] + w2 / dl[i])
    return m


def egri_k(dugum, irtifa_m):
    """sahne.py uzay_k ile aynı: (km, k) düğümleri, ln irtifa, uçlarda kıskaç."""
    px = [math.log(x) for x, _ in dugum]; py = [k for _, k in dugum]; pm = fc_egimleri(px, py)
    x = math.log(max(irtifa_m, 1.0) / 1000.0)
    if x <= px[0]:
        return py[0]
    if x >= px[-1]:
        return py[-1]
    i = max(j for j in range(len(px) - 1) if px[j] <= x)
    h = px[i + 1] - px[i]; t = (x - px[i]) / h
    return ((2 * t ** 3 - 3 * t ** 2 + 1) * py[i] + (t ** 3 - 2 * t ** 2 + t) * h * pm[i]
            + (-2 * t ** 3 + 3 * t ** 2) * py[i + 1] + (t ** 3 - t ** 2) * h * pm[i + 1])


def g_kipi():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from olcum16 import de00                                   # sRGB kodlanmış 0–1 → ortalama CIEDE2000 (numpy)
    from olcum16 import _de00 as de00_harita
    kok, k1 = a.kok, a.kok1
    js = json.load(open(os.path.join(kok, "t23.json"), encoding="utf-8"))
    IRT = [k["irtifa_m"] for k in js["kamera"]["kareler"]]
    n = len(IRT)
    UST, ALT = (float(x) for x in a.mevsim_aralik.split(","))
    M = [ss(h, UST, ALT) for h in IRT]
    MK = js.get("g_turu", {}).get("mevsim_k")                 # tasarım kökünün render edildiği m (yoksa m = 0, F/E)
    k0 = a.kok0 or (kok if (MK is None or max(MK) == 0.0) else "")

    def exr_listesi(r):
        return {f: os.path.join(r, "t23", f"k_{f:04d}.exr") for f in range(n)
                if r and os.path.exists(os.path.join(r, "t23", f"k_{f:04d}.exr"))}

    E, E0, E1 = exr_listesi(kok), exr_listesi(k0), exr_listesi(k1)
    on = {}

    def lin(f, m=None, yalniz_k=False):
        """Kare f'nin doğrusal görüntüsü (480²): tasarım kökü (m'si eşleşiyorsa), yoksa m = 0 / 1 kökleri ya da karışımları.
        yalniz_k: yalnız --kok0/--kok1 (karışım ölçümünde iki uç aynı motor ve aynı koşudan olsun)."""
        m = M[f] if m is None else m
        if (f, m, yalniz_k) in on:
            return on[(f, m, yalniz_k)]
        if not yalniz_k and f in E and abs((MK[f] if MK is not None else 0.0) - m) < 1e-6:
            x = oku(E[f])
        elif m <= 0.0 and f in E0:
            x = oku(E0[f])
        elif m >= 1.0 and f in E1:
            x = oku(E1[f])
        elif f in E0 and f in E1:
            x = (1.0 - m) * oku(E0[f]) + m * oku(E1[f])
        else:
            return None
        x = x[::2, ::2].copy()                                  # 960² → 480² (luma ve ΔE00 için yeterli)
        if len(on) > 24:
            on.clear()
        on[(f, m, yalniz_k)] = x
        return x

    dog = {}
    for i_, (r_, Er) in enumerate(((kok, E), (k0, E0), (k1, E1))):
        if not r_ or r_ in (kok, k0, k1)[:i_]:
            continue
        P_ = poz_oku(r_)
        for f in sorted(Er):
            if f % 5 == 0 and f in P_ and os.path.exists(os.path.join(r_, "t23", f"k_{f:04d}.png")):
                g = gorunum(oku(Er[f]), P_[f]); r = oku(os.path.join(r_, "t23", f"k_{f:04d}.png"))
                dog[f"{os.path.basename(os.path.normpath(r_))}:{f}"] = round(float(np.abs(g - r).mean() * 255), 4)
    print("doğrulama (OCIO ↔ PNG, ort. mutlak fark /255):", dog, flush=True)
    TAB = {}
    for f in range(n):
        x = lin(f)
        if x is None:
            continue
        TAB[f] = np.array([luma(gorunum(x, ev)) for ev in EV])
    fs = sorted(TAB)
    assert fs == list(range(fs[0], fs[-1] + 1)) and fs[0] == 0, ("kare eksik (m karışımı için iki kök gerekli)", fs)

    def L(f, ev):
        return float(np.interp(ev, EV, TAB[f]))

    def Einv(f, l):
        t = TAB[f]
        assert t[0] <= l <= t[-1], (f, l, t[0], t[-1])
        return float(np.interp(l, t, EV))

    ft = max(f for f in fs if IRT[f] >= a.ust_km * 1000.0)
    fc = min(f for f in fs if IRT[f] <= a.alt_km * 1000.0)
    assert fc + 1 in TAB, "fc + 1 karesi gerekli (doğal eğim)"
    Lt, Lc = L(ft, 1.3), L(fc, 0.3)
    egim_c = L(fc + 1, 0.3) - Lc
    fa = ft + a.inis

    def hermite(fb):
        T = {}
        h = fc - fb
        for f in range(fb, fc + 1):
            s = (f - fb) / h
            T[f] = ((2 * s ** 3 - 3 * s ** 2 + 1) * a.taban + (s ** 3 - 2 * s ** 2 + s) * h * 0.0
                    + (-2 * s ** 3 + 3 * s ** 2) * Lc + (s ** 3 - s ** 2) * h * egim_c)
        return T

    if a.yukselis_bas >= 0:
        fb = a.yukselis_bas
    else:
        fb = fa
        for c in range(fc - 2, fa - 1, -1):
            T_ = hermite(c)
            if max(abs(T_[f] - T_[f - 1]) for f in range(c + 1, fc + 1)) <= a.esik_pay * a.esik:
                fb = c
                break
    T = {f: (Lt + (a.taban - Lt) * ss(f, ft, fa)) for f in range(ft, fa + 1)}
    T.update({f: a.taban for f in range(fa, fb + 1)})
    T.update(hermite(fb))
    evg = {}
    for f in fs:
        if f <= ft:
            evg[f] = 1.3
        elif f >= fc:
            evg[f] = 0.3
        else:
            evg[f] = Einv(f, T[f])
    dugum = [(round(IRT[f] / 1000.0, 3), round(1.0 if f == ft else (0.0 if f == fc else evg[f] - 0.3), 4))
             for f in range(ft, fc + 1)]
    dugum = sorted(dugum)
    # sahne.py'nin göreceği eğri (Fritsch–Carlson) — kare irtifalarında düğüm değerini aynen verir
    evs = {f: 0.3 + egri_k(dugum, IRT[f]) for f in fs}
    P = {f: L(f, evs[f]) for f in fs}
    d_ = {f: P[f] - P[f - 1] for f in fs[1:]}
    ty = [f for f in fs if 77e3 <= IRT[f] <= 1.58e6]
    v = [P[f] for f in ty]
    yuk = max(v[j] - min(v[:j + 1]) for j in range(len(v)))
    dus = max(max(v[:j + 1]) - v[j] for j in range(len(v)))
    once = [f for f in fs if IRT[f] >= 2900.0]
    print(f"ft {ft} ({IRT[ft] / 1000:.1f} km)  fa {fa}  fb {fb}  fc {fc} ({IRT[fc] / 1000:.1f} km)  Lt {Lt:.2f}  Lc {Lc:.2f}  "
          f"eğim_c {egim_c:.2f}")
    print("kare  irtifa_km  m   hedef  EV(egri)  öngörülen  Δ%   Δ/255")
    for f in fs:
        print(f"{f:3d} {IRT[f] / 1000:10.3f} {M[f]:5.3f} {T.get(f, float('nan')):6.2f} {evs[f]:7.3f} {P[f]:7.2f} "
              f"{d_.get(f, 0):6.2f} {d_.get(f, 0) * 2.55:6.2f}")
    print("POZ_EGRI_G = [" + ", ".join(f"({x:.2f}, {k:.3f})" for x, k in dugum) + "]")
    # mevsim karışımı: kare başına ΔE00 (aynı kamera f ve EV(f): m(f) ↔ m(f−1)) + Kasım ↔ ilkbahar tam fark
    mev = {}
    for f in fs[1:]:
        if M[f] == M[f - 1] and not (0.0 < M[f] < 1.0):
            continue
        if f not in E0 or f not in E1:
            continue
        x0, x1 = lin(f, 0.0, True), lin(f, 1.0, True)
        ga = gorunum((1 - M[f]) * x0 + M[f] * x1, evs[f]); gb = gorunum((1 - M[f - 1]) * x0 + M[f - 1] * x1, evs[f])
        g0, g1 = gorunum(x0, evs[f]), gorunum(x1, evs[f])
        tam = de00_harita(g0, g1)
        bolge = tam > 0.5
        dh = de00_harita(ga, gb)
        mev[f] = {"irtifa_km": round(IRT[f] / 1000, 2), "m": round(M[f], 4), "dm": round(M[f] - M[f - 1], 4),
                  "dE00_kare_ort": round(float(dh.mean()), 4),
                  "dE00_bolge_ort": round(float(dh[bolge].mean()), 4) if bolge.any() else 0.0,
                  "dE00_bolge_p95": round(float(np.percentile(dh[bolge], 95)), 4) if bolge.any() else 0.0,
                  "bolge_oran": round(float(bolge.mean()), 4),
                  "tam_fark_dE00_kare_ort": round(float(tam.mean()), 4),
                  "tam_fark_dE00_bolge_ort": round(float(tam[bolge].mean()), 4) if bolge.any() else 0.0,
                  "luma_k0": round(luma(g0), 2), "luma_k1": round(luma(g1), 2)}
        print("mevsim", f, mev[f], flush=True)
    sonuc = {"kip": "g", "mevsim_aralik_m": [UST, ALT], "ust_km": a.ust_km, "alt_km": a.alt_km, "taban": a.taban,
             "inis": a.inis, "esik": a.esik, "kareler": {"ft": ft, "fa": fa, "fb": fb, "fc": fc}, "dogrulama": dog,
             "dugum_km_k": dugum, "ev": {f: round(evs[f], 4) for f in fs}, "hedef": {f: round(T[f], 3) for f in T},
             "ongorulen_luma_%": {f: round(P[f], 3) for f in fs},
             "ardisik_maks_abs_%": round(max(abs(x) for x in d_.values()), 3),
             "ardisik_maks_abs_255": round(max(abs(x) for x in d_.values()) * 2.55, 3),
             "pencere_77_1580km": [ty[0], ty[-1]],
             "pencere_ardisik_maks_abs_%": round(max(abs(d_[f]) for f in ty if f in d_), 3),
             "tek_yon": {"azalan_yonde_maks_geri_yukselis": round(yuk, 3), "artan_yonde_maks_geri_dusus": round(dus, 3),
                         "min": round(min(yuk, dus), 3)},
             "inis_oncesi_min_luma_%": round(min(P[f] for f in once), 3),
             "mevsim_dE00": mev, "m": {f: round(M[f], 5) for f in fs},
             "tablo_ev": EV.tolist(), "tablo": {f: [round(x, 3) for x in TAB[f]] for f in fs}}
    json.dump(sonuc, open(os.path.join(kok, "poz_egri_g.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print("ardışık maks |Δ| %", sonuc["ardisik_maks_abs_%"], "(/255:", sonuc["ardisik_maks_abs_255"], ")  pencere",
          sonuc["pencere_ardisik_maks_abs_%"], " tek yön", sonuc["tek_yon"], " iniş öncesi min", sonuc["inis_oncesi_min_luma_%"])


if a.kip == "c":
    c_kipi()
else:
    g_kipi()
