"""S1 kamera yolları — analitik (elle anahtar kare yok). Saf Python + numpy; Blender'da ve sistem Python'unda aynı.

Kamera durumu: hedef G (yer noktası: enlem, boylam, yükseklik), G'den uzaklık d, G'nin yerel çerçevesinde bakış
yönü (heading h: kuzeyden saat yönü, pitch p: aşağı negatif), ekran kaydırması (ox sağa, oy yukarı bakış; G ekranda
ters yönde kayar), lens (mm, 36 mm kare sensör). Kamera = G − d·ileri(h, p).

Easing (brief §2.1, E turuna dek; PROFIL "eski"): ölçek değişen kliplerde ln(d) üzerinde easeInOutSine; açı/yön/hedef
kendi pencerelerinde easeInOutCubic. Pencereler [0,1] içinde biter → son karede hız 0 (yumuşak iniş). t34a (S1 kare
0–47) dalışın ilk kısmıdır: hızlanarak parlamaya girer (S2 kare 48–71'de yavaşlar).
F turu (brief §13; PROFIL "fiske", varsayılan): ln d ilerlemesi fiske(t) (0,15 s beşinci derece kalkış + ease-out
k), pencereler ilerlemeye (s) bağlı; ayrıntı "F turu" bölümünde (fiske, ilerleme, profil_sec). F-B (§13.5): t23 72
kare, t34a 36 kare "kalkis" kipi (kalkis(): fiske kalkışı + sürekli ivmelenme; S1 kare 0–35, S2 t34b kare 36–59).
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
# d2 (P2), E turu (brief §12.2): tüm Türkiye, nadir, d 2.000 km, 24 mm → dikey kadraj 1.687 km; 12 emanet alanı
# dikeyde x 118–597, y 520–748. t12/t23 formülleri D2'ye bağlı (t23 yanal kayma 358 → 393 km; C turu zamanları aynen).
# D turu: G = (34,0; 29,2; 0), d 1.500 km, p −88 (Akdeniz).
D2 = dict(G=(38.75, 34.66, 0.0), d=2_000_000.0, h=0.0, p=-90.0, ox=0.0, oy=0.0, lens=24.0)
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


def t34a_ilerleme(f, F=None, US=None):
    """t34a ln d ilerlemesi g(f) ∈ [0, 1] (kare 47'de 1). F, US verilmezse C/E turu değerleri (T34A_F, T34A_US)."""
    F = T34A_F if F is None else F
    US = T34A_US if US is None else US
    t = max(0.0, f) / 47.0
    t1 = F / 47.0
    if t >= t1:
        return min(t, 1.0) ** US
    s = t / t1
    a, b, c = _T34A_K if US == T34A_US else _besinci_katsayi(US)
    return t1 ** US * (a * s ** 3 + b * s ** 4 + c * s ** 5)


# ------------------------------------------------------------------ F turu (brief §13): "fiske" (flick) profili
# Kullanıcı: "geçişler v2'deki gibi şehre hızlıca yakınlaşsın". Ölçek değişen kliplerde ln d ilerlemesi s = fiske(t):
# ilk a (0,15 s) beşinci derece kalkış (s, s', s'' sürekli, hız 0'dan), sonra ease-out 1 − (1 − u)^k (k 2,4) → t = 0,5'te
# s ≥ 0,75, son karelerde hız → 0. Açı/yön/lens/hedef pencereleri ilerlemeye (s) bağlı: eski pencere fonksiyonları
# t_eski(s) = ease_sine⁻¹(s) (t34a'da t34a_ilerleme⁻¹) ile çağrılır → t01/t12/t34a'da kameranın uzaydaki YOLU E turuyla
# bire bir aynı, yalnız zamanlaması değişir (t23 hariç: yeni s pencereleri, T23_H/T23_P) (pozlama/bulut/rölyef gibi irtifaya bağlı her şey aynı irtifada aynı kalır; uç kareler
# s = 0 ve s = 1'de eski uçlarla bit düzeyinde aynı). PROFIL = "eski": E turu zamanlaması (ease_sine, t23_zaman,
# t34a_ilerleme, KARE_ESKI) bire bir — sahne.py --profil eski.
PROFIL = "fiske"
FISKE_A = 0.15                                   # s, kalkış süresi
FISKE_K = {"t01": 2.4, "t12": 2.4, "t23": 2.2, "t34a": 2.4}   # t23 2,2: tepe −%10 (F-B: 72 karede p(0,5) ölçümü profil.py)
# t34a "fiske" kipi (F-A adayı, F-B'de seçilmedi): ease-out kesik (m < 1) → son karede hız sıfıra inmez (tepe hızın
# (1 − m)^(k−1) katı). F-A'da 48 karede t34 (0–71) p(0,5) 0,775 ama dalış son ~0,45 s çatının üstünde süzülüyordu.
FISKE_M = {"t34a": 0.4}
KARE_ESKI = {"t01": 54, "t12": 60, "t23": 84, "t34a": 48}
# F-B (brief §13.5, kuyruk sorunu: fiske'de her klibin son ~%25–30'u neredeyse durağan → klipler kısalır, profil aynı):
# t12 2,0 → 1,8 s (F-A), t23 2,8 → 2,4 s (son 6 kare yine durgun), t34a 1,6 → 1,2 s (t34 72 → 60 kare; S2 t34b 36–59)
KARE_FISKE = {"t01": 54, "t12": 54, "t23": 72, "t34a": 36}
TOPLAM_T34 = {"eski": 72, "fiske": 60}           # t34 = t34a (S1) + t34b (S2, 24 kare)
T23_DURGUN = 6                                   # t23 son 6 kare tam d3 (C turu kuralı; fiske'de de)
# t34a kipi (sahne.py --t34a_kip). F-B kararı (brief §13.5): "kalkis" varsayılan = fiske kalkışı (FISKE_A 0,15 s,
# beşinci derece, "yarı hız" kuralı) + SÜREKLİ İVMELENME p ∝ t^KALKIS_US (kalkis()): hız kare kare artar, çatının
# üstünde takılma yok, son karede (ışıklık bandı, eski kare 47'nin durumu) hız en yüksek → parlamaya dalar. t34 (0–59)
# p(0,5) ≥ 0,75'i S1 taşır (t34a 36 / 60 kare). "fiske" = F-A'nın kesik ease-out adayı (m 0,4), karşılaştırma için.
T34A_KIP = "kalkis"
# t34a "kalkis" üssü (C/E T34A_US 1,6 ile karıştırmayın). Brief "~1,3"; GPU'suz tarama (scratchpad f-s1b/profil.py
# --us): 1,3 → kare 10–35 hız/tepe ln d 0,685, K 0,484, t34 p(0,5) 0,757; 1,25 → 0,730, K 0,513, p 0,764 (son hız
# 0,166 ln/kare, −%3). 1,25 seçildi: K de ≥ %50. Tam kare M'nin kare 26–30 çukuru (~0,49) eğim penceresinden (yol, E ile aynı).
KALKIS_US = 1.25
# t23 fiske pencereleri (s uzayında, ease_cubic): baş, eğim; oy ve lens eski sınırların s karşılığı (ease_sine(0,70),
# ease_sine(0,60)). Keşif (GPU'suz, scratchpad f-s1/kesif.py): kent yaklaşımında (60 → 5 km) kırpım sınırı tepesi
# 335 (eski yol, fiske zamanlaması) → 231 px/kare (k 2,2).
T23_H = (0.10, 0.90)
T23_P = (0.45, 0.99)
T23_OY = ease_sine(0.70)
T23_LENS = ease_sine(0.60)


def profil_sec(ad):
    """"fiske" (varsayılan, F turu) | "eski" (E turu zamanlaması). KLIPLER kare sayılarını da günceller."""
    global PROFIL
    if ad not in ("fiske", "eski"):
        raise ValueError(ad)
    PROFIL = ad
    for k, n in (KARE_FISKE if ad == "fiske" else KARE_ESKI).items():
        KLIPLER[k]["kare"] = n
    KLIPLER["t34a"]["toplam"] = TOPLAM_T34[ad]


def _besinci(Q, V, A):
    """q(s) = c3 s³ + c4 s⁴ + c5 s⁵, s ∈ [0, 1]: q(0) = q'(0) = q''(0) = 0; q(1) = Q, q'(1) = V, q''(1) = A."""
    M = np.array([[1.0, 1.0, 1.0], [3.0, 4.0, 5.0], [6.0, 12.0, 20.0]])
    return np.linalg.solve(M, np.array([Q, V, A], np.float64))


_FISKE_ONBELLEK = {}


def fiske(t, a, k=2.4, m=1.0):
    """Fiske ilerlemesi p(t) ∈ [0, 1], t ∈ [0, 1] (klip zamanı; a = kalkış süresi / klip süresi, aynı birimde).

    t ≥ a: p = P0 + (1 − P0) · E((t − a)/(1 − a)), E(u) = (1 − (1 − m·u)^k) / (1 − (1 − m)^k) — m = 1 tam ease-out
    (sonda hız 0), m < 1 kesik (sonda hız ≠ 0; t34a).
    t < a: beşinci derece kalkış; t = a'da değer, eğim, eğrilik ease-out ile eşit. P0 "yarı hız" kuralıyla seçilir:
    kalkışın ortalama hızı birleşme hızının yarısı (eğrilik 0 olsaydı hız tam smoothstep olurdu) → hız 0'dan tekdüze
    artar, birleşmede aşma yok (C turunun t^1,6 kalıbıyla ease-out'a değerden eşlemek kalkış içinde hızı birleşme
    hızının 1,63 katına çıkarıyordu; a 0,085, k 2,4)."""
    if t >= 1.0:
        return 1.0
    if t <= 0.0:
        return 0.0
    anahtar = (a, k, m)
    if anahtar not in _FISKE_ONBELLEK:
        Z = 1.0 - (1.0 - m) ** k
        e1 = k * m / Z                       # E'(0)
        e2 = -k * (k - 1.0) * m * m / Z      # E''(0)
        c = 0.5 * a * e1 / (1.0 - a)
        P0 = c / (1.0 + c)
        A = (1.0 - P0) * e2 * (a / (1.0 - a)) ** 2
        _FISKE_ONBELLEK[anahtar] = (Z, P0, tuple(_besinci(P0, 2.0 * P0, A)))
    Z, P0, (c3, c4, c5) = _FISKE_ONBELLEK[anahtar]
    if t >= a:
        u = (t - a) / (1.0 - a)
        return P0 + (1.0 - P0) * (1.0 - (1.0 - m * u) ** k) / Z
    s = t / a
    return c3 * s ** 3 + c4 * s ** 4 + c5 * s ** 5


_KALKIS_ONBELLEK = {}


def kalkis(t, a, us=1.25):
    """F-B t34a "kalkis" ilerlemesi p(t) ∈ [0, 1], t ∈ [0, 1]: fiske kalkışı + sürekli ivmelenme.

    t ≥ a: p = P0 + (1 − P0) · (t^us − a^us) / (1 − a^us) (us > 1: hız t^(us−1) ile artar, t = 1'de en yüksek).
    t < a: beşinci derece kalkış (fiske() ile aynı kalıp): t = a'da değer, eğim, eğrilik eşit; P0 "yarı hız" kuralıyla
    (kalkışın ortalama hızı birleşme hızının yarısı) → P0 = c / (1 + c), c = us·a^us / (2(1 − a^us)). Kalkıştaki
    normalize eğrilik x = 2(us − 1) → q''(s) = s(12 + 3x − 12(1 + x)s + 10x s²)·P0 > 0 (1 < us ≤ 1,75; us 1,25:
    s(13,5 − 18 s + 5 s²)): hız 0'dan TEKDÜZE artar, birleşmede aşma ve sonrasında düşüş (takılma) yok (C/E'nin
    t^US'ye değerden eşlemesi, us 1,3'te, kalkış içinde %13 aşıyordu)."""
    if t >= 1.0:
        return 1.0
    if t <= 0.0:
        return 0.0
    anahtar = (a, us)
    if anahtar not in _KALKIS_ONBELLEK:
        au = a ** us
        c = 0.5 * us * au / (1.0 - au)
        P0 = c / (1.0 + c)
        A = 2.0 * (us - 1.0) * P0                     # a² p''(a)
        _KALKIS_ONBELLEK[anahtar] = (au, P0, tuple(_besinci(P0, 2.0 * P0, A)))
    au, P0, (c3, c4, c5) = _KALKIS_ONBELLEK[anahtar]
    if t >= a:
        return P0 + (1.0 - P0) * (t ** us - au) / (1.0 - au)
    s = t / a
    return c3 * s ** 3 + c4 * s ** 4 + c5 * s ** 5


def ters_ease_sine(s):
    """ease_sine⁻¹: s = (1 − cos πt)/2 → t."""
    s = min(max(s, 0.0), 1.0)
    return math.acos(1.0 - 2.0 * s) / math.pi


def t34a_eski_kare(g):
    """t34a_ilerleme⁻¹ (eski yerel zaman fz, 0–47): g ∈ [0, 1] → eski yolun aynı noktasının kare zamanı."""
    if g <= 0.0:
        return 0.0
    if g >= 1.0:
        return 47.0
    lo, hi = 0.0, 47.0
    for _ in range(64):
        mid = 0.5 * (lo + hi)
        if t34a_ilerleme(mid) < g:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


def ilerleme(klip, f):
    """F turu: klip yerel kare f → (s, t_eski). s = ln d ilerlemesi (t34a'da g), t_eski = eski pencerelerin zamanı
    (t01/t12/t23: [0, 1]; t34a: eski yerel kare fz 0–47). PROFIL "eski"de eski tanımlar aynen."""
    N = KLIPLER[klip]["kare"]
    if klip in ("t01", "t12"):
        t = f / (N - 1)
        if PROFIL == "eski":
            return ease_sine(t), t
        s = fiske(t, FISKE_A * FPS / (N - 1), FISKE_K[klip])
        return s, ters_ease_sine(s)
    if klip == "t23":
        if PROFIL == "eski":
            t = t23_zaman(f) / (N - 1)
            return ease_sine(t), t
        V = N - T23_DURGUN                       # kare V…N−1 tam d3 (6 kare)
        s = fiske(f / V, FISKE_A * FPS / V, FISKE_K["t23"])
        return s, ters_ease_sine(s)
    if klip == "t34a":
        if PROFIL == "eski":
            fz = t34a_zaman(f)                   # kare 0–1 durgun (C turu), kare 47 uç
            return t34a_ilerleme(fz), fz
        # F: kare 0…T34A_BEKLE durgun (l3[0]; C kuralı), kare N−1 uç (eski kare 47'nin durumu, S2 t34b ilk karesiyle
        # aynı); hareket M = N − 1 − T34A_BEKLE gerçek kare aralığında, kalkış 0,15 s = 4,5 gerçek kare
        M = N - 1 - T34A_BEKLE
        u = max(0.0, f - T34A_BEKLE) / M
        if T34A_KIP == "kalkis":
            g = kalkis(u, FISKE_A * FPS / M, KALKIS_US)
        else:
            g = fiske(u, FISKE_A * FPS / M, FISKE_K["t34a"], FISKE_M.get("t34a", 1.0))
        return g, t34a_eski_kare(g)
    raise KeyError(klip)


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
    # F turu: e = ln d ilerlemesi (fiske ya da eski ease_sine), t = eski pencere zamanı (ilerleme()'ye bakın)
    if klip == "t01":
        e, t = ilerleme(klip, f)
        return karistir(T01_BAS, D1, e, ease_cubic(t), ease_cubic(t), 0.0)
    if klip == "t12":
        e, t = ilerleme(klip, f)
        return karistir(D1, D2, e, ease_cubic(t), ease_cubic(t), e)
    if klip == "t23":
        e, t = ilerleme(klip, f)
        d = math.exp(math.log(D2["d"]) + (math.log(d3["d"]) - math.log(D2["d"])) * e)
        # hedef: kalan yer kayması uzaklıkla orantılı (ekranda sabit açıyla süzülür), d → d3 iken Expo'ya varır
        wG = (D2["d"] - d) / (D2["d"] - d3["d"])
        wG = ease_cubic(min(1.0, wG * 1.02))
        G = slerp_latlon(D2["G"][:2], d3["G"][:2], wG) + (d3["G"][2] * wG,)
        if PROFIL == "fiske" and e < 1.0:
            # F turu: pencereler s'de (= e, ln d ilerlemesi). Eski yol (t_eski(s)) baş dönüşünü ve eğimi kent
            # yaklaşımına (60 → 5 km, s 0,52–0,90) sıkıştırıyordu (bulut perdesinin içi; kenar 335 px/kare). Yeni:
            # baş −120° s 0,10–0,90'a yayılır (güneybatıya, gidiş yönüne dönerek iner), eğim −90 → d3 s 0,45–0,99'da
            # (60 km'ye dek tepeden harita; 20 → 5 km'de ufka kalkış, gök ~5 km'de girer); oy ve lens eski s sınırları.
            h = pencere(e, [T23_H + (d3["h"] - 360.0 - D2["h"],)], D2["h"])
            p = pencere(e, [T23_P + (d3["p"] - D2["p"],)], D2["p"])
            oy = pencere(e, [(T23_OY, 1.0, d3["oy"] - D2["oy"])], D2["oy"])
            lens = math.exp(math.log(24.0) + (math.log(d3["lens"]) - math.log(24.0)) * ease_cubic((e - T23_LENS) / (1.0 - T23_LENS)))
            return dict(G=G, d=d, h=h, p=p, ox=0.0, oy=oy, lens=lens)
        # eski profil (ve fiske'de s = 1: son 6 kare, eski formülle bit düzeyinde aynı uç)
        h = pencere(t, [(0.34, 0.60, -40.0), (0.55, 0.93, d3["h"] - 360.0 + 40.0)], D2["h"])
        p = pencere(t, [(0.30, 0.62, -55.0 - D2["p"]), (0.58, 0.86, 35.0), (0.82, 1.0, d3["p"] + 20.0)], D2["p"])
        oy = pencere(t, [(0.70, 1.0, d3["oy"] - D2["oy"])], D2["oy"])
        # lens 24 → d3 lensi (35 mm), son %40'ta ln üzerinde (yaklaşma hissini artırır, yumuşak iniş)
        lens = math.exp(math.log(24.0) + (math.log(d3["lens"]) - math.log(24.0)) * ease_cubic((t - 0.60) / 0.40))
        return dict(G=G, d=d, h=h, p=p, ox=0.0, oy=oy, lens=lens)
    if klip == "t34a":
        hedef = d3["isik_hedef"]            # (enlem, boylam, z) ışıklık bandı üstü
        # C turu: kare 0–1 durgun, kare 47 yine uç. ln d: eski profilde durgun başlar (ilk T34A_F karede beşinci
        # derece), hızlanarak ışıklığa dalar (kare 36'da ~150 m, 46'da ~38 m; S2 yavaşlatır). F turu: g = kalkis
        # (F-B; ya da fiske), f = eski yolun aynı g'deki kare zamanı (0–47) → pencereler ilerlemeye bağlı, yol aynı;
        # F-B'de t34a 36 kare (t34 = K["toplam"] 60), son kare (35) ≡ eski kare 47.
        g, f = ilerleme(klip, f)
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


profil_sec(PROFIL)          # KLIPLER kare sayıları seçili profille (F turu)
