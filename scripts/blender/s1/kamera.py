"""S1 kamera yolları — analitik (elle anahtar kare yok). Saf Python + numpy; Blender'da ve sistem Python'unda aynı.

Kamera durumu: hedef G (yer noktası: enlem, boylam, yükseklik), G'den uzaklık d, G'nin yerel çerçevesinde bakış
yönü (heading h: kuzeyden saat yönü, pitch p: aşağı negatif), ekran kaydırması (ox sağa, oy yukarı bakış; G ekranda
ters yönde kayar), lens (mm, 36 mm kare sensör). Kamera = G − d·ileri(h, p).

Easing (brief §2.1): ölçek değişen kliplerde ln(d) üzerinde easeInOutSine; açı/yön/hedef kendi pencerelerinde
easeInOutCubic. Pencereler [0,1] içinde biter → son karede hız 0 (yumuşak iniş). t34a (S1 kare 0–47) dalışın ilk
kısmıdır: hızlanarak parlamaya girer (S2 kare 48–71'de yavaşlar).
"""
import math

import numpy as np

from geo import (LAT0, LON0, R, KX, KY, M_ENU, ECEF0, DUNYA_MERKEZ, ecef_birim, ecef_dunya, dunya_ecef,
                 enu_matris, dunya_latlon)

FPS = 30
MASTER = 1920
SENSOR = 36.0

# global zaman çizelgesi: her klip kendi aralığında (hareket bulanıklığı alt-kareleri karışmasın diye aralıklı)
KLIPLER = {
    "t01": {"bas": 1000, "kare": 54, "tur": "gecis"},
    "l1": {"bas": 2000, "kare": 120, "tur": "dongu", "P": 4.0},
    "t12": {"bas": 3000, "kare": 60, "tur": "gecis"},
    "l2": {"bas": 4000, "kare": 120, "tur": "dongu", "P": 4.0},
    "t23": {"bas": 5000, "kare": 84, "tur": "gecis"},
    "l3": {"bas": 6000, "kare": 150, "tur": "dongu", "P": 5.0},
    "t34a": {"bas": 7000, "kare": 48, "tur": "gecis", "toplam": 72},
}
SIRA = ["t01", "l1", "t12", "l2", "t23", "l3", "t34a"]


def ease_sine(t):
    t = min(max(t, 0.0), 1.0)
    return -(math.cos(math.pi * t) - 1) / 2


def ease_cubic(t):
    t = min(max(t, 0.0), 1.0)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def pencere(t, segs, v0):
    """segs: [(t0, t1, delta)], her delta kendi penceresinde easeInOutCubic ile eklenir."""
    v = v0
    for a, b, dv in segs:
        v += dv * ease_cubic((t - a) / (b - a))
    return v


def slerp_latlon(a, b, w):
    pa, pb = ecef_birim(*a), ecef_birim(*b)
    om = math.acos(max(-1.0, min(1.0, float(np.dot(pa, pb)))))
    if om < 1e-9:
        p = pa
    else:
        p = (math.sin((1 - w) * om) * pa + math.sin(w * om) * pb) / math.sin(om)
    return math.degrees(math.asin(p[2] / np.linalg.norm(p))), math.degrees(math.atan2(p[1], p[0]))


def fpx(lens):
    return lens / SENSOR * MASTER


# ------------------------------------------------------------------ yer yüksekliği (sahne kurulurken bağlanır)
YER = {"h": lambda lat, lon: 0.0}


def poz_yonelim(G, d, h, p, ox=0.0, oy=0.0):
    """G = (enlem, boylam, yükseklik m). Dönüş: kamera konumu (dünya m, float64) ve 3×3 (sağ, yukarı, ileri)."""
    lat, lon, hg = G
    Mg = enu_matris(lat, lon)                    # G'nin yerel ENU'su (ECEF satırları)
    Pg = (R + hg) * ecef_birim(lat, lon)
    hr, pr = math.radians(h), math.radians(p)
    f_l = np.array([math.sin(hr) * math.cos(pr), math.cos(hr) * math.cos(pr), math.sin(pr)])
    r_l = np.array([math.cos(hr), -math.sin(hr), 0.0])
    u_l = np.cross(r_l, f_l)
    f, r_, u = (Mg.T @ f_l, Mg.T @ r_l, Mg.T @ u_l)      # ECEF
    C = Pg - d * f
    # ekran kaydırması: önce yukarı ekseni çevresinde ox (sağa bak), sonra sağ ekseni çevresinde oy (yukarı bak)
    def don(v, eks, a):
        a = math.radians(a)
        return v * math.cos(a) + np.cross(eks, v) * math.sin(a) + eks * np.dot(eks, v) * (1 - math.cos(a))
    f = don(f, u, -ox); r_ = don(r_, u, -ox)
    f = don(f, r_, oy); u = don(u, r_, oy)
    Cw = ecef_dunya(C)
    B = np.stack([M_ENU @ r_, M_ENU @ u, M_ENU @ f], 1)   # dünya çerçevesinde sütunlar
    return Cw, B


def quat_from_basis(B):
    """Blender kamerası −Z'ye bakar, +Y yukarı: sütunlar X = sağ, Y = yukarı, Z = −ileri."""
    m = np.stack([B[:, 0], B[:, 1], -B[:, 2]], 1)
    tr = m[0, 0] + m[1, 1] + m[2, 2]
    if tr > 0:
        s = math.sqrt(tr + 1.0) * 2
        w = 0.25 * s; x = (m[2, 1] - m[1, 2]) / s; y = (m[0, 2] - m[2, 0]) / s; z = (m[1, 0] - m[0, 1]) / s
    elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]:
        s = math.sqrt(1.0 + m[0, 0] - m[1, 1] - m[2, 2]) * 2
        w = (m[2, 1] - m[1, 2]) / s; x = 0.25 * s; y = (m[0, 1] + m[1, 0]) / s; z = (m[0, 2] + m[2, 0]) / s
    elif m[1, 1] > m[2, 2]:
        s = math.sqrt(1.0 + m[1, 1] - m[0, 0] - m[2, 2]) * 2
        w = (m[0, 2] - m[2, 0]) / s; x = (m[0, 1] + m[1, 0]) / s; y = 0.25 * s; z = (m[1, 2] + m[2, 1]) / s
    else:
        s = math.sqrt(1.0 + m[2, 2] - m[0, 0] - m[1, 1]) * 2
        w = (m[1, 0] - m[0, 1]) / s; x = (m[0, 2] + m[2, 0]) / s; y = (m[1, 2] + m[2, 1]) / s; z = 0.25 * s
    return (w, x, y, z)


def projeksiyon(Cw, B, lens, P):
    """Dünya noktası → master piksel (x sağa, y aşağı) ve önde mi."""
    v = np.asarray(P, np.float64) - Cw
    xc, yc, zc = v @ B[:, 0], v @ B[:, 1], v @ B[:, 2]
    f = fpx(lens)
    return MASTER / 2 + f * xc / zc, MASTER / 2 - f * yc / zc, zc > 0


def disk(Cw, B, lens, n=360):
    """Dünya diskinin (limb) master pikselde merkezi ve yarıçapı (limb noktalarına dairesel uydurma)."""
    O = DUNYA_MERKEZ
    v = O - Cw; D = np.linalg.norm(v); w = v / D
    a = math.asin(R / D)
    t = np.cross(w, [0.0, 0.0, 1.0]); t /= np.linalg.norm(t); s = np.cross(w, t)
    ang = np.linspace(0, 2 * math.pi, n, endpoint=False)
    yon = (math.cos(a) * w[None, :] + math.sin(a) * (np.cos(ang)[:, None] * t + np.sin(ang)[:, None] * s))
    pts = Cw + yon * math.sqrt(D * D - R * R)
    x, y, on = projeksiyon(Cw, B, lens, pts)
    A = np.stack([x, y, np.ones_like(x)], 1); bb = x * x + y * y
    c = np.linalg.lstsq(A, bb, rcond=None)[0]
    cx, cy = c[0] / 2, c[1] / 2
    r = math.sqrt(c[2] + cx * cx + cy * cy)
    return cx, cy, r, float(x.max() - x.min()), float(y.max() - y.min())


# ------------------------------------------------------------------ anahtar durumlar
# d1 (P1): alt-nokta 33 K 27 D, merkezden 21.900 km, 35 mm, Dünya merkezi y %62 (brief R3 d1-a)
D1 = dict(G=(33.0, 27.0, 0.0), d=21_900_000.0 - R, h=0.0, p=-90.0, ox=0.0, oy=math.degrees(math.atan(0.12 * MASTER / fpx(35))), lens=35.0)
# t01 başı: aynı enlem, 30° batıda (kamera eksen çevresinde 30° doğuya döner); disk merkezi (960, 768), çap 345 px
T01_BAS = dict(G=(33.0, -3.0, 0.0), d=None, h=0.0, p=-90.0, ox=0.0,
               oy=-math.degrees(math.atan((960 - 768) / fpx(35))), lens=35.0)
# d2 (P2): Akdeniz, ~1.500 km, nadire yakın, 24 mm (brief §9.1)
D2 = dict(G=(34.0, 29.2, 0.0), d=1_500_000.0, h=0.0, p=-88.0, ox=0.0, oy=0.0, lens=24.0)
# d3 (P3), B turu (orkestratör kararı 4): yerden 900 m, 35 mm (dikey hFOV 32,2°), azimut 60° (D400 hattının üstü),
# bakış 240°; hol merkezine yatay 2,3 km. Ölçüm (d3hesap): Expo alanı dikey kırpımın %24,5'i, y %52; y %68'deki yer
# 1,53 km (ön plan > 1,5 km), alt kenar 0,82 km; güneş kadrajın üstünde (dışarıda), kent y %23, körfez y %21.
# (≥ %28 genişlik ile ön plan > 1,5 km aynı anda sağlanamıyor: 2,0 km'de %27,7 ama y %68 → 1,36 km.)
D3_AZ, D3_UZ, D3_IRT, D3_BAKIS, D3_LENS = 60.0, 2300.0, 900.0, 240.0, 35.0
D3_Y = 0.52                                     # hol ekranda y %52


def salon_hedef(osm_bilgi):
    sx, sy = osm_bilgi["salon_merkez"]          # dünya X, Y (kuzey)
    return sx, sy


def d3_durum(osm_bilgi, yer_z):
    """yer_z(x, y): dünya Z (eğrilik dahil). G = salon merkezi zemini."""
    gx, gy = salon_hedef(osm_bilgi)
    gz = yer_z(gx, gy)
    az = math.radians(D3_AZ)
    cx, cy = gx + D3_UZ * math.sin(az), gy + D3_UZ * math.cos(az)
    cz = yer_z(cx, cy) + D3_IRT
    yatay = math.hypot(cx - gx, cy - gy)
    d = math.hypot(yatay, cz - gz)
    p = -math.degrees(math.atan2(cz - gz, yatay))
    oy = math.degrees(math.atan((D3_Y - 0.5) * MASTER / fpx(D3_LENS)))
    lat, lon, _ = dunya_latlon(np.array([gx, gy, 0.0]))
    return dict(G=(float(lat), float(lon), float(gz)), d=d, h=D3_BAKIS, p=p, ox=0.0, oy=oy, lens=D3_LENS,
                kamera_yer=(cx, cy, cz))


def t01_bas_coz():
    """Disk çapı 345 px (yatay/dikey ortalaması) ve uydurulmuş merkez y = 768 olacak uzaklık ve oy (ikiye bölme
    + sabit nokta yinelemesi)."""
    for _ in range(4):
        lo, hi = 30_000_000.0, 120_000_000.0
        for _ in range(60):
            mid = (lo + hi) / 2
            Cw, B = poz_yonelim(T01_BAS["G"], mid, T01_BAS["h"], T01_BAS["p"], T01_BAS["ox"], T01_BAS["oy"])
            cx, cy, r, w, hh = disk(Cw, B, T01_BAS["lens"])
            if (w + hh) / 2 > 345.0:
                lo = mid
            else:
                hi = mid
        T01_BAS["d"] = (lo + hi) / 2
        Cw, B = poz_yonelim(T01_BAS["G"], T01_BAS["d"], T01_BAS["h"], T01_BAS["p"], T01_BAS["ox"], T01_BAS["oy"])
        cx, cy, r, w, hh = disk(Cw, B, T01_BAS["lens"])
        T01_BAS["oy"] -= math.degrees(math.atan((cy - 768.0) / fpx(T01_BAS["lens"])))


T01_BAS["d"] = 60_000_000.0
t01_bas_coz()


# ------------------------------------------------------------------ C turu (brief §11.1): durgun dikişler
# t23: ln d 6,4 birimlik inişi easeInOutSine ile 84 karenin tamamına yayıyordu; sinüsün sonu doğrusal yavaşlar →
# ekranda son kareler 15 / 10 / 6 / 2 px/kare (teşhis: hız sıfıra inmiyor, kamera 83'te hâlâ 5,6 m/kare). Düzeltme:
# yerel zaman τ(f), kare T23_FA'ya dek aynı (kare 0–40, pozlama bölgesi değişmez), sonra smoothstep ile τ' ≤ 1,2
# hızlanıp T23_VARIS karesinde 83'e varır; T23_VARIS–83 arası kamera tam d3 (son 6 kare durgun, l3[0] ile birebir).
# İniş B'nin biçiminde (…, 11, 6, 2, 0 px/kare); hız tepesi (~180 px/kare) bulut perdesinin içine düşer.
# (T23_FA = 60 denendi: kare 0–60 aynı kalıyor ama iniş sertleşiyor — 32, 22, 14, 7, 2 — ve tepe perdeden sonra.)
T23_FA, T23_VARIS = 40, 78
# t34a: ln d ilerlemesi g = t^1,6 başlangıçta türev 0 ama t^0,6 ile hızla büyüyordu (kare 0→1 7,8 px). İlk T34A_F
# karede beşinci derece başlangıç (g, g', g'' = 0; T34A_F'de t^1,6 ile değer, eğim, eğrilik eşit) → hız 0'dan yumuşak
# artar; kare T34A_F sonrası B turu yolu aynen. Ayrıca t34a'nın bütün kanalları yerel zaman
# fz = max(0, f − T34A_BEKLE)·47/(47 − T34A_BEKLE) ile sürülür: kare 0 ve 1 tam d3 (l3[0] ile aynı; tek kare = 33 ms),
# kare 47 yine yolun sonu (S2 t34b ucu değişmez).
T34A_F, T34A_US, T34A_BEKLE = 30, 1.6, 1


def t34a_zaman(f):
    return max(0.0, f - T34A_BEKLE) * 47.0 / (47.0 - T34A_BEKLE)


def t23_zaman(f):
    """t23 yerel kare → yol zamanı τ (0–83)."""
    N1 = KLIPLER["t23"]["kare"] - 1
    if f <= T23_FA:
        return float(f)
    if f >= T23_VARIS:
        return float(N1)
    x = (f - T23_FA) / (T23_VARIS - T23_FA)
    return f + (N1 - T23_VARIS) * (x * x * (3 - 2 * x))


def _besinci_katsayi(p):
    A = np.array([[1.0, 1.0, 1.0], [3.0, 4.0, 5.0], [6.0, 12.0, 20.0]])
    return np.linalg.solve(A, np.array([1.0, p, p * (p - 1)]))


_T34A_K = _besinci_katsayi(T34A_US)


def t34a_ilerleme(f):
    """t34a ln d ilerlemesi g(f) ∈ [0, 1] (kare 47'de 1)."""
    t = max(0.0, f) / 47.0
    t1 = T34A_F / 47.0
    if t >= t1:
        return min(t, 1.0) ** T34A_US
    s = t / t1
    a, b, c = _T34A_K
    return t1 ** T34A_US * (a * s ** 3 + b * s ** 4 + c * s ** 5)


def karistir(a, b, t_ln, t_ac, t_G, t_lens):
    """Durum karışımı: ln d (t_ln), açılar (t_ac), hedef (t_G), lens (ln, t_lens)."""
    G = slerp_latlon(a["G"][:2], b["G"][:2], t_G) + (a["G"][2] + (b["G"][2] - a["G"][2]) * t_G,)
    d = math.exp(math.log(a["d"]) + (math.log(b["d"]) - math.log(a["d"])) * t_ln)
    out = dict(G=G, d=d)
    for k in ("h", "p", "ox", "oy"):
        out[k] = a[k] + (b[k] - a[k]) * t_ac
    out["lens"] = math.exp(math.log(a["lens"]) + (math.log(b["lens"]) - math.log(a["lens"])) * t_lens)
    return out


def durum(klip, f, d3):
    """Klip yerel kare f (kesirli olabilir) → kamera durumu."""
    K = KLIPLER[klip]
    N = K["kare"]
    if klip == "l1":
        return dict(D1)
    if klip == "l2":
        return dict(D2)
    if klip == "l3":
        return dict(d3)
    if klip == "t01":
        t = f / (N - 1)
        return karistir(T01_BAS, D1, ease_sine(t), ease_cubic(t), ease_cubic(t), 0.0)
    if klip == "t12":
        t = f / (N - 1)
        return karistir(D1, D2, ease_sine(t), ease_cubic(t), ease_cubic(t), ease_sine(t))
    if klip == "t23":
        t = t23_zaman(f) / (N - 1)
        e = ease_sine(t)
        d = math.exp(math.log(D2["d"]) + (math.log(d3["d"]) - math.log(D2["d"])) * e)
        # hedef: kalan yer kayması uzaklıkla orantılı (ekranda sabit açıyla süzülür), d → d3 iken Expo'ya varır
        wG = (D2["d"] - d) / (D2["d"] - d3["d"])
        wG = ease_cubic(min(1.0, wG * 1.02))
        G = slerp_latlon(D2["G"][:2], d3["G"][:2], wG) + (d3["G"][2] * wG,)
        h = pencere(t, [(0.34, 0.60, -40.0), (0.55, 0.93, d3["h"] - 360.0 + 40.0)], D2["h"])
        p = pencere(t, [(0.30, 0.62, -55.0 - D2["p"]), (0.58, 0.86, 35.0), (0.82, 1.0, d3["p"] + 20.0)], D2["p"])
        oy = pencere(t, [(0.70, 1.0, d3["oy"] - D2["oy"])], D2["oy"])
        # lens 24 → d3 lensi (35 mm), son %40'ta ln üzerinde (yaklaşma hissini artırır, yumuşak iniş)
        lens = math.exp(math.log(24.0) + (math.log(d3["lens"]) - math.log(24.0)) * ease_cubic((t - 0.60) / 0.40))
        return dict(G=G, d=d, h=h, p=p, ox=0.0, oy=oy, lens=lens)
    if klip == "t34a":
        T = K["toplam"]                     # 72 kare (S1: 0–47)
        hedef = d3["isik_hedef"]            # (enlem, boylam, z) ışıklık bandı üstü
        f = t34a_zaman(f)                   # C turu: kare 0–1 durgun, kare 47 yine uç
        # ln d: durgun başlar (hız 0, C turu: ilk T34A_F karede beşinci derece), hızlanarak ışıklığa dalar
        # (kare 36'da ~150 m, 46'da ~38 m; S2 yavaşlatır)
        g = t34a_ilerleme(f)
        d = math.exp(math.log(d3["d"]) - 4.4 * g)
        wG = ease_cubic(min(1.0, f / 36.0))
        G = slerp_latlon(d3["G"][:2], hedef[:2], wG) + (d3["G"][2] + (hedef[2] - d3["G"][2]) * wG,)
        h = pencere(f, [(6.0, 44.0, 62.0)], d3["h"])
        p = pencere(f, [(0.0, 36.0, -35.0 - d3["p"]), (33.0, 46.0, -35.0)], d3["p"])
        oy = pencere(f, [(0.0, 30.0, -d3["oy"])], d3["oy"])
        # lens d3 (35 mm) → 24 mm (S2 t34b ile aynı uç), kare 0–36
        lens = math.exp(math.log(d3["lens"]) + (math.log(24.0) - math.log(d3["lens"])) * ease_cubic(f / 36.0))
        return dict(G=G, d=d, h=h, p=p, ox=0.0, oy=oy, lens=lens)
    raise KeyError(klip)


def kamera(klip, f, d3):
    st = durum(klip, f, d3)
    Cw, B = poz_yonelim(st["G"], st["d"], st["h"], st["p"], st["ox"], st["oy"])
    st["C"] = Cw; st["B"] = B
    lat, lon, alt = dunya_latlon(Cw)
    st["irtifa"] = float(alt)
    return st


def kadraj_m(st):
    """Dikey teslimin (1080 px genişlik) odak uzaklığındaki genişliği (m). Uzayda disk ölçeği (limb uzaklığı),
    alçakta hedef uzaklığı; 4.000–12.000 km irtifa arası ln'de karışım."""
    hfov2 = math.atan(10.125 / st["lens"])
    Cw = st["C"]
    D = float(np.linalg.norm(Cw - DUNYA_MERKEZ))
    limb = math.sqrt(max(D * D - R * R, 1.0))
    alt = D - R
    w = min(1.0, max(0.0, (alt - 4.0e6) / 8.0e6)); w = w * w * (3 - 2 * w)
    deff = math.exp(math.log(st["d"]) * (1 - w) + math.log(limb) * w)
    return 2 * deff * math.tan(hfov2)
