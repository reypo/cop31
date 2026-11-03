"""S1 — dış sahne (uzay → Antalya → Expo çatısı), tek sahne, iki motor.

    blender -b --factory-startup -P sahne.py -- --klip t01,l1 --engine EEVEE --res 960
    blender -b --factory-startup -P sahne.py -- --klip hepsi --sadece_json        # yalnız klip JSON'ları
    blender -b --factory-startup -P sahne.py -- --klip t23 --kareler 0,40,83 --engine CYCLES --res 1920 --samples 64

Kurulum: önce `python -X utf8 -P hazirla.py hepsi` (dokular, arazi, OSM ağları → <varlik>/s1/tex/).
Dünya: metre, Expo teğet çerçevesi (geo.py): X doğu, Y kuzey, Z yukarı, Dünya merkezi (0, 0, −R).
Bütün klipler tek zaman çizelgesinde (kamera.KLIPLER, aralıklı); kareler klip-yerel adla yazılır:
<cikis>/<klip>/k_0000.png …, ayrıca <cikis>/<klip>.json (brief §9.3 alanları).
Kare başına değişen sahne değerleri (pus, gök, bulut, parlama, döngü saatleri) sahne özel özelliklerine anahtar
kare olarak yazılır, malzemeler Attribute (View Layer) düğümüyle okur → iki motorda aynı.
"""
import argparse
import json
import math
import os
import sys
import time
from datetime import datetime, timezone

import bpy
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import geo  # noqa: E402
from geo import R, LAT0, LON0, KX, KY, M_ENU, DUNYA_MERKEZ, YER_ALCALT  # noqa: E402
import kamera as KM  # noqa: E402
from yaylar import emanet_oku  # noqa: E402
from gunes import gunes  # noqa: E402
from ortak import D, ag_olustur, kure_ag, temizle, emisyon_ornekleme  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--klip", default="hepsi")
ap.add_argument("--kareler", default="")              # klip-yerel: "0-53" | "0,10,53" | boş = hepsi
ap.add_argument("--engine", default="EEVEE", choices=["EEVEE", "CYCLES"])
ap.add_argument("--res", type=int, default=960)
ap.add_argument("--onizleme", action="store_true")    # 960² (res verilmezse), 8 bit, TAA 16
ap.add_argument("--samples", type=int, default=0)     # 0: EEVEE 16 / Cycles 64
ap.add_argument("--saat", default="13:00")            # UTC (TSİ − 3)
ap.add_argument("--varlik", default="D:/soft/cop31-varlik")
ap.add_argument("--cikis", default="")                # varsayılan <varlik>/render
ap.add_argument("--depth", default="")                # "8" | "16" (varsayılan: önizleme 8, değilse 16)
ap.add_argument("--mb", type=int, default=1)
ap.add_argument("--blend", default="")
ap.add_argument("--sadece_json", action="store_true")
ap.add_argument("--olcum", default="")                # kare süreleri JSONL
ap.add_argument("--em_ornek", default="NONE")
ap.add_argument("--exposure", type=float, default=0.3)
ap.add_argument("--kure", type=int, default=-1)       # -1 otomatik (l3/t34a'da ufkun ötesinde → kapalı)
# B turu (orkestratör kararları 1, 2, 5, 6)
ap.add_argument("--yakin", default="B", choices=["A", "B"])   # A: A turu yakın alanı (önce/sonra ölçümü için)
ap.add_argument("--uzay_ev", type=float, default=1.0)         # uzay karelerinde ek pozlama (0,7 → Sahra maks %82,8; hedefe yaklaşmak için 1,0)
ap.add_argument("--kilit", action="store_true")               # klip başına GPU kilidi (render\.gpu-kilit)
ap.add_argument("--ham", default="t34a")                      # bu klipler <cikis>/<klip>/ham/'a yazılır (görüntü uzayı parlama)
# C turu (brief §11.1)
ap.add_argument("--poz", default="oto", choices=["oto", "egri", "egri_f", "rampa"])   # egri: ölçülmüş POZ_EGRI; rampa: --poz_rampa
# F turu: egri_f = POZ_EGRI'nin 25–88 km kısmı yeniden (C turunun 37–66 km negatif düğümleri kare 36'dan açılan yerel
# kümülüsün parlaklığını bastırmak içindi; bulut kalkınca kent yaklaşımında luma %23 → %16,8 çukuru yaptı; ölçüldü).
# oto: --profil fiske ve --t23_bulut yok → egri_f; aksi hâlde egri (E turu bire bir).
ap.add_argument("--poz_rampa", default="30e3,400e3")          # uzay pozlaması rampası (m); B: 150e3,1000e3
# geçişlerde sabit tohumlu kareler (l3 ile aynı tohum 31): t23'ün durgun son 6 karesi, t34a'nın ilk 3 karesi.
# F turu: "oto" = kamera.KLIPLER'den (t23: N−6…N−1, iniş/durgun kareler; t34a: 0–2) → E'de "t23:78-83;t34a:0-2", F-B'de "t23:66-71;t34a:0-2"
ap.add_argument("--sabit_tohum", default="oto")
ap.add_argument("--exr", action="store_true")                 # teşhis: her kareyi ayrıca doğrusal EXR (pozlamasız) yaz
# E turu (brief §12.2)
ap.add_argument("--rolyef_guc", type=float, default=0.2)      # Dunya ShaderNodeBump gücü (çift gölgede 0,15; 0 = kapalı)
ap.add_argument("--rolyef_mesafe", type=float, default=40000.0)   # yükseklik 1,0 ↔ m (GEBCO 8 bit 255 ≈ 6.783 m → ×5,9 abartı; TAHMİN, önizlemede ayarla)
# E turu S1b: kopuk hale düzeltmesi (hale_ic_k ile; l1'de 0)
ap.add_argument("--hale_ic_lo", type=float, default=-0.04)   # hale/pus gece sınırı (güneş·uzuv yönü); eski −0,25
ap.add_argument("--hale_ic_H", type=float, default=0.02)     # uzuv içi pus ölçeği (1 − b)
ap.add_argument("--hale_ic_A", type=float, default=0.7)      # uzuv içi pus genliği (dış hale tepesine göre)
ap.add_argument("--teshis_bulut_yok", action="store_true")   # yalnız teşhis: bulut kabuğu küçültülür
# F turu (brief §13): "fiske" zamanlaması (kamera.py; varsayılan) | "eski" (E turu zamanlaması bire bir)
ap.add_argument("--profil", default="fiske", choices=["fiske", "eski"])
# t23 bulut perdesi + yerel kümülüs: "eski" (C/E: perde kare 57, kümülüs kare 36–76), "yok" (F: perde kalkar);
# "oto" = profil eski → eski, fiske → yok
ap.add_argument("--t23_bulut", default="oto", choices=["oto", "eski", "yok"])
# t34a kipi: "kalkis" (F-B varsayılanı, brief §13.5: fiske kalkışı + sürekli ivmelenme, kamera.kalkis / KALKIS_US) |
# "fiske" (F-A adayı: kesik ease-out m 0,4). Kare sayısı kamera.KARE_FISKE (F-B 36; t34 = 60)
ap.add_argument("--t34a_kip", default="kalkis", choices=["kalkis", "fiske"])
# F turu önizleme hızı: EEVEE güneş gölgesi en büyük çözünürlüğü (m). 0,0005 (E) alçak irtifada kare başına 45–60 sn;
# Cycles bu ayarı kullanmaz (son render etkilenmez)
ap.add_argument("--golge_m", type=float, default=0.0005)
# teşhis (F turu, EEVEE çökmesi): ışıklık parıltısı isik_k çarpanı (1 = tasarım; 0 = parıltı kapalı)
ap.add_argument("--isik_carpan", type=float, default=1.0)
# teşhis (F turu, EEVEE çökmesi t34a kare 19–20): EEVEE ekran-uzayı ışın izleme + hızlı GI (1 = E ayarı)
ap.add_argument("--ee_rt", type=int, default=1)
a = ap.parse_args(argv)
KM.profil_sec(a.profil)
KM.T34A_KIP = a.t34a_kip
T23_BULUT = (("eski" if a.profil == "eski" else "yok") if a.t23_bulut == "oto" else a.t23_bulut)
if a.sabit_tohum == "oto":
    _n23 = KM.KLIPLER["t23"]["kare"]
    a.sabit_tohum = f"t23:{_n23 - KM.T23_DURGUN}-{_n23 - 1};t34a:0-2"
B_YAKIN = a.yakin == "B"
ORNEK = {"l1": 32, "l2": 32}                                  # döngülerde maks örnek (diğerleri 64)
DEKLANSOR = {"t12": 0.3, "t23": 0.25, "t34a": 0.25}            # diğerleri 0,5 (E turu: t12 0,5 → 0,3, hale şeridi)
T0 = time.perf_counter()
TEX = os.path.join(a.varlik, "s1", "tex")
CIKIS = a.cikis or os.path.join(a.varlik, "render")
klipler = KM.SIRA if a.klip == "hepsi" else a.klip.split(",")
derinlik = a.depth or ("8" if (a.onizleme or a.res < 1920) else "16")


def aralik_coz(s):
    """"0-53" | "0,10,53" | "0-60/2,76-83" → kare listesi."""
    out = []
    for part in s.split(","):
        part = part.strip()
        if not part:
            continue
        adim = 1
        if "/" in part:
            part, adim = part.split("/"); adim = int(adim)
        if "-" in part:
            x, y = part.split("-"); out += list(range(int(x), int(y) + 1, adim))
        else:
            out.append(int(part))
    return out


def klip_esle(s):
    """"t23:0-60/2,76-83;t34a:0-3" → {klip: [kareler]}; klip adı yoksa ("0-5") hepsine: {None: [...]}."""
    out = {}
    for blok in s.split(";"):
        if not blok.strip():
            continue
        if ":" in blok:
            k, v = blok.split(":", 1); out[k.strip()] = aralik_coz(v)
        else:
            out[None] = aralik_coz(blok)
    return out


KARELER = klip_esle(a.kareler) if a.kareler else {}
SABIT = {k: set(v) for k, v in klip_esle(a.sabit_tohum).items()} if a.sabit_tohum else {}


def log(*s):
    print(f"[S1 {time.perf_counter() - T0:7.1f}s]", *s, flush=True)


temizle()
sc = bpy.context.scene
sc.unit_settings.system = "METRIC"
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"

# ------------------------------------------------------------------ güneş (NOAA)
hh, mm = map(int, a.saat.split(":"))
GUN = gunes(datetime(2026, 11, 9, hh, mm, tzinfo=timezone.utc), LAT0, LON0)
L = geo.gunes_yonu_dunya(*GUN["alt_nokta"])          # dünya çerçevesinde güneşe doğru
L = L / np.linalg.norm(L)
log(f"güneş {a.saat} UTC: alt-nokta {GUN['alt_nokta'][0]:.3f}, {GUN['alt_nokta'][1]:.3f}; Expo'da yükseklik "
    f"{GUN['yukseklik']:.2f}°, azimut {GUN['azimut']:.2f}°")
Lt = tuple(float(x) for x in L)

# ------------------------------------------------------------------ yardımcılar
OSM = json.load(open(os.path.join(TEX, "osm_yakin.json")))
DTM = np.load(os.path.join(TEX, "dtm_yakin.npy"))
AR = json.load(open(os.path.join(TEX, "arazi.json")))
AR_H = np.load(os.path.join(TEX, "arazi_h.npy"))
AR_N, AR_L, AR_A = AR["N"], AR["L"], AR["A"]
AR_XS = AR_L * np.sinh(AR_A * np.linspace(-1, 1, AR_N)) / math.sinh(AR_A)
_c1 = json.load(open(os.path.join(TEX, "c1_yama.json")))
C1LA0, C1LA1 = _c1["enlem"]; C1LO0, C1LO1 = _c1["boylam"]
C1W, C1H = C1LO1 - C1LO0, C1LA1 - C1LA0
# E turu: C1 22–54 K / 16–48 D; D turu kutusu (22–46 K / 16–44 D) c1_ek_k = 0'da (alt ≥ 6.000 km, D1) aynı ağırlıkla
_c1e = _c1.get("eski", _c1)
C1E_LA0, C1E_LA1 = _c1e["enlem"]; C1E_LO0, C1E_LO1 = _c1e["boylam"]
_rf_yol = os.path.join(TEX, "rolyef_tr.json")
_rf = json.load(open(_rf_yol)) if os.path.exists(_rf_yol) else None
if _rf:
    RFLA0, RFLA1 = _rf["enlem"]; RFLO0, RFLO1 = _rf["boylam"]
    RFW, RFH = RFLO1 - RFLO0, RFLA1 - RFLA0


def yer_z(x, y):
    """Dünya X (doğu), Y (kuzey) → zemin Z (eğrilik dahil). ±3 km yakın DTM, dışında arazi ızgarası."""
    if abs(x) < 3000 and abs(y) < 3000:
        ys = -y
        c = (x + 3072) / 6 - 0.5; r = (ys + 3072) / 6 - 0.5
        c0, r0 = int(c), int(r); fc, fr = c - c0, r - r0
        h = (DTM[r0, c0] * (1 - fc) + DTM[r0, c0 + 1] * fc) * (1 - fr) + (DTM[r0 + 1, c0] * (1 - fc) + DTM[r0 + 1, c0 + 1] * fc) * fr
    else:
        j = np.interp(x, AR_XS, np.arange(AR_N)); i = np.interp(-y, -AR_XS[::-1], np.arange(AR_N))
        h = float(AR_H[int(round(i)), int(round(j))])
    return float(h) - (x * x + y * y) / (2 * R)


def ozellik(ad, deger=0.0):
    sc[ad] = float(deger)


def attr(d, ad):
    n = d("ShaderNodeAttribute", attribute_type="VIEW_LAYER", attribute_name=ad)
    return n.outputs["Fac"]


def resim(d, ad, renkli=True, vec=None, uzanti="EXTEND", interp="Linear"):
    return d.resim(os.path.join(TEX, ad), renkli, uzanti, vec, interp)


def esle(d, vec, sx, sy, lx, ly):
    mp = d("ShaderNodeMapping", vector_type="POINT")
    mp.inputs["Scale"].default_value = (sx, sy, 1.0)
    mp.inputs["Location"].default_value = (lx, ly, 0.0)
    d.b(vec, mp.inputs["Vector"])
    return mp.outputs["Vector"]


def kenar_agirlik(d, vec, kx, ky):
    """[0,1]² karesinde kenara uzaklıkla 0→1 (kx, ky: yumuşak geçiş genişliği, doku birimi)."""
    sp = d("ShaderNodeSeparateXYZ"); d.b(vec, sp.inputs[0])
    du = d.math("MINIMUM", sp.outputs["X"], d.math("SUBTRACT", 1.0, sp.outputs["X"]))
    dv = d.math("MINIMUM", sp.outputs["Y"], d.math("SUBTRACT", 1.0, sp.outputs["Y"]))
    return d.math("MINIMUM", d.aralik(du, 0.0, kx), d.aralik(dv, 0.0, ky))


def radyal_agirlik(d, vec, genislik, r0=72000.0, r1=48000.0):
    """S2 bölge yaması için dairesel karışım: Expo'dan r1'de 1, r0'da 0 (köşeli yama lekesi olmasın)."""
    m = d("ShaderNodeVectorMath", operation="SUBTRACT"); d.b(vec, m.inputs[0]); m.inputs[1].default_value = (0.5, 0.5, 0.0)
    sp = d("ShaderNodeSeparateXYZ"); d.b(m.outputs[0], sp.inputs[0])
    cb = d("ShaderNodeCombineXYZ"); d.b(sp.outputs["X"], cb.inputs["X"]); d.b(sp.outputs["Y"], cb.inputs["Y"])
    r = d.math("MULTIPLY", d.vmath("LENGTH", cb.outputs[0]), genislik)
    return d.aralik(r, r0, r1)


def periyodik_gurultu(d, vec_xy, saat_ad, olcek, detay=4.0, yaricap=1.0):
    """4B gürültü: (x, y, r·cos θ) + W = r·sin θ → θ periyodik saat; döngü dikişsiz kapanır."""
    th = attr(d, saat_ad)
    sp = d("ShaderNodeSeparateXYZ"); d.b(vec_xy, sp.inputs[0])
    cb = d("ShaderNodeCombineXYZ")
    d.b(sp.outputs["X"], cb.inputs["X"]); d.b(sp.outputs["Y"], cb.inputs["Y"])
    d.b(d.math("MULTIPLY", d.math("COSINE", th), yaricap), cb.inputs["Z"])
    nz = d("ShaderNodeTexNoise", noise_dimensions="4D", i_Scale=olcek, i_Detail=detay, i_Roughness=0.55)
    d.b(cb.outputs[0], nz.inputs["Vector"]); d.b(d.math("MULTIPLY", d.math("SINE", th), yaricap), nz.inputs["W"])
    return nz


# ------------------------------------------------------------------ hava perspektifi (pus) düğüm grubu
def pus_grubu():
    ng = bpy.data.node_groups.new("Pus", "ShaderNodeTree")
    ng.interface.new_socket(name="Shader", in_out="INPUT", socket_type="NodeSocketShader")
    ng.interface.new_socket(name="Shader", in_out="OUTPUT", socket_type="NodeSocketShader")
    d = D(ng)
    gi = d("NodeGroupInput"); go = d("NodeGroupOutput")
    HS, S0 = 8000.0, (27000.0 if B_YAKIN else 34000.0)      # B: uzak planda pus ×1,26
    geo_ = d("ShaderNodeNewGeometry"); cdn = d("ShaderNodeCameraData")
    s = cdn.outputs["View Distance"]
    iz = d("ShaderNodeSeparateXYZ"); d.b(geo_.outputs["Incoming"], iz.inputs[0])
    dz = d.math("MAXIMUM", d.math("MULTIPLY", iz.outputs["Z"], s), 1.0)
    fak = d.math("MINIMUM", d.math("DIVIDE", d.math("MULTIPLY", d.math("SUBTRACT", 1.0, d.math("EXPONENT", d.math("DIVIDE", dz, -HS))), HS), dz), 1.0)
    tau = d.math("MULTIPLY", d.math("DIVIDE", d.math("MULTIPLY", s, fak), S0), attr(d, "pus_k"))
    h = d.math("SUBTRACT", 1.0, d.math("EXPONENT", d.math("MULTIPLY", tau, -1.0)))
    # renk: Rayleigh mavisi + güneş yönünde Mie ileri saçılması (karşı ışıkta altın pus)
    vd = d.vmath("SCALE", geo_.outputs["Incoming"]) if False else None
    cosg = d.math("MULTIPLY", d.vmath("DOT_PRODUCT", geo_.outputs["Incoming"], Lt), -1.0)
    mie = d.math("POWER", d.math("MAXIMUM", cosg, 0.0), 14.0)
    yuk = max(0.0, math.sin(math.radians(GUN["yukseklik"])))
    mavi = (0.40, 0.52, 0.74)
    sicak = (1.0, 0.70, 0.40)
    renk = d.karistir(d.math("MINIMUM", d.math("MULTIPLY", mie, 1.6), 1.0), mavi, sicak)
    em = d("ShaderNodeEmission")
    d.b(renk, em.inputs["Color"])
    d.b(d.math("ADD", 0.32 * (0.4 + yuk), d.math("MULTIPLY", mie, 1.1)), em.inputs["Strength"])
    mx = d("ShaderNodeMixShader"); d.b(h, mx.inputs[0]); d.b(gi.outputs[0], mx.inputs[1]); d.b(em.outputs[0], mx.inputs[2])
    d.b(mx.outputs[0], go.inputs[0])
    return ng


PUS = pus_grubu()


def pusla(d, shader_out):
    g = d("ShaderNodeGroup"); g.node_tree = PUS
    d.b(shader_out, g.inputs[0])
    return g.outputs[0]


def malzeme(ad):
    m = bpy.data.materials.new(ad)
    return m, D(m.node_tree)


def rolyef_tumsek(d, vr, normal=None):
    """E turu (brief §12.2): GEBCO rölyefi (rolyef_tr.png, 16 bit, Non-Color) → ShaderNodeBump. Güç = rolyef_guc ·
    rolyef_k (irtifa: ss(9.000 → 4.000 km) · ss(300 → 600 km); D1'de ve arazi devrinde 0) · kutu kenarında 1° yumuşak
    geçiş. Mesafe dünya metresinde (Cycles BumpNode nesne uzayı değil). vr: kutu UV'si [0,1]² (s doğu, t kuzey)."""
    rf = resim(d, "rolyef_tr.png", False, vr, "CLIP")
    wr = kenar_agirlik(d, vr, 1.0 / RFW, 1.0 / RFH)
    bm_ = d("ShaderNodeBump", i_Distance=a.rolyef_mesafe)
    d.b(d.math("MULTIPLY", d.math("MULTIPLY", attr(d, "rolyef_k"), wr), a.rolyef_guc), bm_.inputs["Strength"])
    d.b(rf.outputs["Color"], bm_.inputs["Height"])
    if normal is not None:
        d.b(normal, bm_.inputs["Normal"])
    return bm_.outputs["Normal"]


# ------------------------------------------------------------------ hangi parçalar gerekli
uzay_klip = {"t01", "l1", "t12", "l2", "t23"}
kure_gerek = (a.kure == 1) or (a.kure == -1 and any(k in uzay_klip for k in klipler)) or a.sadece_json
yakin_gerek = any(k in ("t23", "l3", "t34a") for k in klipler)
log("klipler", klipler, "küre", kure_gerek)

# ------------------------------------------------------------------ Dünya küresi
OB = {}
if kure_gerek and not a.sadece_json:
    kure = kure_ag("KureAg", 1024, 512)
    def kure_obje(ad, olcek):
        o = bpy.data.objects.new(ad, kure if ad == "Dunya" else kure.copy())
        sc.collection.objects.link(o)
        o.matrix_world = __import__("mathutils").Matrix(
            [[M_ENU[i, 0] * olcek, M_ENU[i, 1] * olcek, M_ENU[i, 2] * olcek, DUNYA_MERKEZ[i]] for i in range(3)] + [[0, 0, 0, 1]])
        return o
    dunya = kure_obje("Dunya", R - YER_ALCALT)
    m, d = malzeme("Dunya"); dunya.data.materials.append(m)
    out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled")
    uv = d("ShaderNodeTexCoord").outputs["UV"]
    gun = resim(d, "gunduz_8k.jpg", True, uv, "REPEAT")
    pk = resim(d, "paket_8k.png", False, uv, "REPEAT")
    pks = d("ShaderNodeSeparateColor"); d.b(pk.outputs["Color"], pks.inputs[0])
    hs = d("ShaderNodeHueSaturation", i_Saturation=1.15, i_Value=1.0); d.b(gun.outputs["Color"], hs.inputs["Color"])
    col, su = hs.outputs["Color"], pks.outputs["Red"]
    # C1 yaması (BMNG 463 m; kutu c1_yama.json): s = (boylam − lo0)/(lo1 − lo0), t = (enlem − la0)/(la1 − la0)
    v1 = esle(d, uv, 360 / C1W, 180 / C1H, (-180 - C1LO0) / C1W, (-90 - C1LA0) / C1H)
    c1 = resim(d, "c1_yama.jpg", True, v1); c1s = resim(d, "c1_su.png", False, v1)
    w1 = kenar_agirlik(d, v1, 1.5 / C1W, 1.5 / C1H)
    if (C1E_LA0, C1E_LA1, C1E_LO0, C1E_LO1) != (C1LA0, C1LA1, C1LO0, C1LO1):
        # E turu: yeni şerit (46–54 K, 44–48 D) yalnız alt < 6.000 km'de (c1_ek_k); D1'de eski kutunun kenar ağırlığı
        ew, eh = C1E_LO1 - C1E_LO0, C1E_LA1 - C1E_LA0
        v1e = esle(d, v1, C1W / ew, C1H / eh, (C1LO0 - C1E_LO0) / ew, (C1LA0 - C1E_LA0) / eh)
        w1e = kenar_agirlik(d, v1e, 1.5 / ew, 1.5 / eh)
        w1 = d.karistir(attr(d, "c1_ek_k"), w1e, w1, "FLOAT")
    hs1 = d("ShaderNodeHueSaturation", i_Saturation=1.15, i_Value=1.0); d.b(c1.outputs["Color"], hs1.inputs["Color"])
    col = d.karistir(w1, col, hs1.outputs["Color"]); su = d.karistir(w1, su, c1s.outputs["Color"], "FLOAT")
    # Sentinel-2 bölge yaması (±76,8 km, eqc doğrusal → UV doğrusal)
    W2 = 153600.0
    v2 = esle(d, uv, 360 * KX / W2, 180 * KY / W2, ((-180 - LON0) * KX + 76800) / W2, ((-90 - LAT0) * KY + 76800) / W2)
    s2 = resim(d, "s2_bolge.jpg", True, v2); s2s = resim(d, "deniz-maskesi-bolge-50m.png", False, v2)
    w2 = radyal_agirlik(d, v2, W2)
    col = d.karistir(w2, col, s2.outputs["Color"]); su = d.karistir(w2, su, s2s.outputs["Color"], "FLOAT")
    d.b(col, bs.inputs["Base Color"])
    d.b(d.karistir(su, 0.85, 0.22, "FLOAT"), bs.inputs["Roughness"])
    d.b(d.karistir(su, 0.2, 0.7, "FLOAT"), bs.inputs["Specular IOR Level"])
    if _rf and a.rolyef_guc > 0:
        vr = esle(d, uv, 360 / RFW, 180 / RFH, (-180 - RFLO0) / RFW, (-90 - RFLA0) / RFH)
        d.b(rolyef_tumsek(d, vr), bs.inputs["Normal"])
    geo_ = d("ShaderNodeNewGeometry")
    nl = d.vmath("DOT_PRODUCT", geo_.outputs["Normal"], Lt)
    gecef = d.aralik(nl, 0.06, -0.20)
    bs.inputs["Emission Color"].default_value = (1.0, 0.66, 0.36, 1.0)
    d.b(d.math("MULTIPLY", d.math("MULTIPLY", pks.outputs["Green"], gecef), 3.0), bs.inputs["Emission Strength"])
    d.b(pusla(d, bs.outputs[0]), out.inputs["Surface"])
    OB["dunya"] = dunya

    # bulut kabuğu (12 km), alfa, gölge düşürür; döngülerde 4B gürültüyle yerinde biçim değiştirir
    bulut = kure_obje("Bulut", R + 12000.0)
    m, d = malzeme("Bulut"); bulut.data.materials.clear(); bulut.data.materials.append(m)
    m.surface_render_method = "DITHERED"; m.use_transparent_shadow = True
    out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.95)
    bs.inputs["Base Color"].default_value = (0.92, 0.93, 0.95, 1)
    uv = d("ShaderNodeTexCoord").outputs["UV"]
    sk = d("ShaderNodeVectorMath", operation="MULTIPLY"); sk.inputs[1].default_value = (90.0, 45.0, 1.0)
    d.b(uv, sk.inputs[0])
    nz = periyodik_gurultu(d, sk.outputs[0], "saat_bulut", 1.0, 3.0, 0.6)
    ofs = d("ShaderNodeVectorMath", operation="SUBTRACT"); d.b(nz.outputs["Color"], ofs.inputs[0])
    ofs.inputs[1].default_value = (0.5, 0.5, 0.5)
    ofs2 = d("ShaderNodeVectorMath", operation="MULTIPLY"); d.b(ofs.outputs[0], ofs2.inputs[0])
    ofs2.inputs[1].default_value = (0.35 / 360 * 2, 0.35 / 180 * 2, 0.0)      # ≈ ±0,35° (bir bulut genişliğinden az)
    uvw = d.vmath("ADD", uv, ofs2.outputs[0])
    bt = resim(d, "paket_8k.png", False, uvw, "REPEAT")
    bts = d("ShaderNodeSeparateColor"); d.b(bt.outputs["Color"], bts.inputs[0])
    alfa = d.math("MULTIPLY", d.aralik(bts.outputs["Blue"], 0.12, 0.85, tip="LINEAR"), attr(d, "bulut_k"))
    tr = d("ShaderNodeBsdfTransparent")
    mx = d("ShaderNodeMixShader"); d.b(alfa, mx.inputs[0]); d.b(tr.outputs[0], mx.inputs[1]); d.b(pusla(d, bs.outputs[0]), mx.inputs[2])
    d.b(mx.outputs[0], out.inputs["Surface"])      # pus yalnız bulutun opak kısmına (saydam kabuk pus perdesi olmasın)
    OB["bulut"] = bulut

    # atmosfer kabuğu (R2 "kabuk", --turuncu hale): r = 1,03 R
    atm = kure_obje("Atmosfer", R * 1.03)
    atm.visible_shadow = False
    m, d = malzeme("Atmosfer"); atm.data.materials.clear(); atm.data.materials.append(m)
    m.surface_render_method = "BLENDED"; m.use_backface_culling = True; m.use_transparent_shadow = True
    out = d("ShaderNodeOutputMaterial"); geo_ = d("ShaderNodeNewGeometry")
    H = 0.006
    Pe = d.vmath("SCALE", d.vmath("ADD", geo_.outputs["Position"], (0.0, 0.0, R))) if False else None
    padd = d("ShaderNodeVectorMath", operation="ADD"); d.b(geo_.outputs["Position"], padd.inputs[0])
    padd.inputs[1].default_value = (0.0, 0.0, R)
    psc = d("ShaderNodeVectorMath", operation="SCALE"); d.b(padd.outputs[0], psc.inputs[0]); psc.inputs["Scale"].default_value = 1.0 / R
    P, I = psc.outputs[0], geo_.outputs["Incoming"]
    b = d.vmath("LENGTH", d.vmath("CROSS_PRODUCT", P, I))
    hale = d.math("EXPONENT", d.math("DIVIDE", d.math("SUBTRACT", b, 1.0), -H))
    hale = d.math("MULTIPLY", hale, attr(d, "hale_k"))        # E turu: 1 (≥ 12.000 km) → 0,6 (≤ 8.000 km)
    disk = d.math("MULTIPLY", d.math("POWER", b, 8.0), 0.3)
    ishale = d.math("GREATER_THAN", b, 1.0)
    f = d.karistir(ishale, disk, hale, "FLOAT")
    sn = d("ShaderNodeVectorMath", operation="SCALE"); d.b(I, sn.inputs[0]); d.b(d.vmath("DOT_PRODUCT", P, I), sn.inputs["Scale"])
    C = d.vmath("SUBTRACT", P, sn.outputs["Vector"])
    yon = d.karistir(ishale, geo_.outputs["Normal"], d.vmath("NORMALIZE", C), "VECTOR")
    dl = d.vmath("DOT_PRODUCT", yon, Lt)
    # E turu S1b (kopuk hale, brief §12.6): hale_ic_k > 0 iken hale gece yanına −0,25 yerine --hale_ic_lo'ya kadar uzanır
    # (yüzey kararmışken uzayda süzülen turuncu yay kalkar); hale_ic_k = 0 (l1 irtifası) → eski hale bayt bayt aynı.
    # (2. tur denemesi — disk parıltısını da uzuv azimutuna bağlamak — l2'yi ΔE00 2,27 değiştirdi, geri alındı.)
    hic = attr(d, "hale_ic_k")
    gunf = d.karistir(hic, d.aralik(dl, -0.25, 0.10), d.aralik(dl, a.hale_ic_lo, 0.12), "FLOAT")
    renk = d.karistir(d.aralik(dl, -0.20, 0.06), (1.0, 0.42, 0.16), (0.30, 0.55, 1.0))
    renk = d.karistir(ishale, (0.30, 0.55, 1.0), renk)
    gunf = d.math("MAXIMUM", d.math("MULTIPLY", gunf, ishale), d.math("MULTIPLY", d.aralik(dl, -0.05, 0.25), d.math("SUBTRACT", 1.0, ishale)))
    on = d.math("SUBTRACT", 1.0, geo_.outputs["Backfacing"])
    guc = d.math("MULTIPLY", d.math("MULTIPLY", d.math("MULTIPLY", f, gunf), on), 1.3)
    em = d("ShaderNodeEmission"); d.b(renk, em.inputs["Color"]); d.b(guc, em.inputs["Strength"])
    tr = d("ShaderNodeBsdfTransparent")
    add = d("ShaderNodeAddShader"); d.b(tr.outputs[0], add.inputs[0]); d.b(em.outputs[0], add.inputs[1])
    # E turu S1b: uzvun içinde hale ile sürekli pus bandı (disk kenarı ile hale tepesi arasındaki koyu çukuru doldurur).
    # Yön = ışının merkeze en yakın noktası (uzuv azimutu; b = 1'de dış haleyle aynı), genlik exp(−(1 − b)/H_ic).
    dlC = d.vmath("DOT_PRODUCT", d.vmath("NORMALIZE", C), Lt)
    gC = d.aralik(dlC, a.hale_ic_lo, 0.12)
    renkC = d.karistir(d.aralik(dlC, -0.20, 0.06), (1.0, 0.42, 0.16), (0.30, 0.55, 1.0))
    fin = d.math("EXPONENT", d.math("DIVIDE", d.math("SUBTRACT", b, 1.0), a.hale_ic_H))
    fin = d.math("MULTIPLY", d.math("MULTIPLY", fin, d.math("SUBTRACT", 1.0, ishale)), attr(d, "hale_k"))
    guc2 = d.math("MULTIPLY", d.math("MULTIPLY", d.math("MULTIPLY", fin, gC), on), 1.3 * a.hale_ic_A)
    guc2 = d.math("MULTIPLY", guc2, hic)
    em2 = d("ShaderNodeEmission"); d.b(renkC, em2.inputs["Color"]); d.b(guc2, em2.inputs["Strength"])
    add2 = d("ShaderNodeAddShader"); d.b(add.outputs[0], add2.inputs[0]); d.b(em2.outputs[0], add2.inputs[1])
    d.b(add2.outputs[0], out.inputs["Surface"])
    OB["atmosfer"] = atm
    log("küre, bulut, atmosfer kuruldu")

# ------------------------------------------------------------------ arazi (sinh ızgara, küreye oturur)
if not a.sadece_json:
    P = np.load(os.path.join(TEX, "arazi_p.npy"))
    EQ = np.load(os.path.join(TEX, "arazi_eqc.npy"))
    N = AR_N
    I_, J_ = np.meshgrid(np.arange(N - 1), np.arange(N - 1), indexing="ij")
    I_, J_ = I_.ravel(), J_.ravel()
    q = np.stack([I_ * N + J_, (I_ + 1) * N + J_, (I_ + 1) * N + J_ + 1, I_ * N + J_ + 1], -1)
    me = ag_olustur("AraziAg", P, np.arange(len(q)) * 4, q.ravel())
    del q, I_, J_
    at = me.attributes.new("eqc", "FLOAT2", "POINT")
    eq2 = EQ.copy(); eq2[:, 1] *= -1.0                 # (x doğu, Y kuzey)
    at.data.foreach_set("vector", eq2.ravel())
    del P, EQ, eq2
    arazi = bpy.data.objects.new("Arazi", me); sc.collection.objects.link(arazi)
    m, d = malzeme("Arazi"); me.materials.append(m)
    out = d("ShaderNodeOutputMaterial")
    eq = d("ShaderNodeAttribute", attribute_type="GEOMETRY", attribute_name="eqc").outputs["Vector"]
    vg = esle(d, eq, 1 / 61440, 1 / 61440, 0.5, 0.5)
    vb = esle(d, eq, 1 / 153600, 1 / 153600, 0.5, 0.5)
    vc = esle(d, eq, 1 / (C1W * KX), 1 / (C1H * KY), (LON0 - C1LO0) / C1W, (LAT0 - C1LA0) / C1H)
    cg = resim(d, "s2_genis.jpg", True, vg); cb_ = resim(d, "s2_bolge.jpg", True, vb); cc = resim(d, "c1_yama.jpg", True, vc)
    sg = resim(d, "deniz-maskesi-genis-30m.png", False, vg); sb = resim(d, "deniz-maskesi-bolge-50m.png", False, vb)
    scc = resim(d, "c1_su.png", False, vc)
    wg = kenar_agirlik(d, vg, 2000 / 61440, 2000 / 61440)
    wb = radyal_agirlik(d, vb, 153600.0)
    hsc = d("ShaderNodeHueSaturation", i_Saturation=1.15, i_Value=1.0); d.b(cc.outputs["Color"], hsc.inputs["Color"])
    col = d.karistir(wb, hsc.outputs["Color"], cb_.outputs["Color"]); col = d.karistir(wg, col, cg.outputs["Color"])
    su = d.karistir(wb, scc.outputs["Color"], sb.outputs["Color"], "FLOAT"); su = d.karistir(wg, su, sg.outputs["Color"], "FLOAT")
    col_kure, su_kure = col, su          # E turu: küre (Dunya) malzemesiyle aynı renk ve su (yumuşak) — kenar halkası
    su = d.aralik(su, 0.35, 0.65)
    # yakın ayrıntı: 3 km içinde ±%9 değer gürültüsü (10 m pikselin içini kırar)
    cd_ = d("ShaderNodeCameraData")
    yakinf = d.aralik(cd_.outputs["View Distance"], 3500.0, 600.0)
    nzd = d("ShaderNodeTexNoise", i_Scale=0.35, i_Detail=6.0, i_Roughness=0.6)
    d.b(eq, nzd.inputs["Vector"])
    detay = d.math("ADD", 1.0, d.math("MULTIPLY", d.math("MULTIPLY", d.math("SUBTRACT", nzd.outputs["Fac"], 0.5), 0.36), yakinf))
    if B_YAKIN:
        # 1–3 m ayrıntı (S2 renginden türetilmiş): 70 m'lik Voronoi parselleri, her parselde kendi yönünde sıralar
        # (bitkili parselde ağaç/ekin sırası koyu-açık, çıplakta sürüm izi), parsel kenarlarında toprak yol; 9 km'de söner
        vor = d("ShaderNodeTexVoronoi", feature="F1", i_Scale=1 / 70.0); d.b(eq, vor.inputs["Vector"])
        vre = d("ShaderNodeSeparateColor"); d.b(vor.outputs["Color"], vre.inputs[0])
        vke = d("ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE", i_Scale=1 / 70.0); d.b(eq, vke.inputs["Vector"])
        th_ = d.math("MULTIPLY", vre.outputs["Red"], math.pi)
        sxy = d("ShaderNodeSeparateXYZ"); d.b(eq, sxy.inputs[0])
        uu = d.math("ADD", d.math("MULTIPLY", sxy.outputs["X"], d.math("COSINE", th_)), d.math("MULTIPLY", sxy.outputs["Y"], d.math("SINE", th_)))
        ara = d.math("ADD", 4.5, d.math("MULTIPLY", vre.outputs["Green"], 2.0))
        sira = d.math("MULTIPLY", d.math("SINE", d.math("DIVIDE", d.math("MULTIPLY", uu, 2 * math.pi), ara)), 0.5)
        csp = d("ShaderNodeSeparateColor"); d.b(col, csp.inputs[0])
        yesil = d.aralik(d.math("SUBTRACT", csp.outputs["Green"], d.math("MAXIMUM", csp.outputs["Red"], csp.outputs["Blue"])), -0.004, 0.02)
        genlik = d.math("ADD", 0.16, d.math("MULTIPLY", yesil, 0.5))
        yol_ = d.math("MULTIPLY", d.aralik(d.math("MULTIPLY", vke.outputs["Distance"], 70.0), 1.8, 0.7),
                      d.math("GREATER_THAN", vre.outputs["Blue"], 0.55))
        # parsel başına ton (±%13): tek düze bej yerine tarla yamalı örtüsü
        yakin9 = d.aralik(cd_.outputs["View Distance"], 9000.0, 2500.0)
        detay = d.math("ADD", detay, d.math("MULTIPLY", d.math("MULTIPLY", d.math("SUBTRACT", vre.outputs["Blue"], 0.5), 0.26), yakin9))
        detay = d.math("ADD", detay, d.math("MULTIPLY", d.math("MULTIPLY", sira, genlik), yakin9))
        col = d.karistir(d.math("MULTIPLY", d.math("MULTIPLY", yol_, 0.75), yakin9), col, (0.332, 0.254, 0.150))   # #9c8a6c
    if B_YAKIN:     # kara rengi biraz daha doygun (müşteri: renkli); deniz rengi ayrı (dkol) etkilenmez
        hsb = d("ShaderNodeHueSaturation", i_Saturation=1.18, i_Value=1.0); d.b(col, hsb.inputs["Color"]); col_kara = hsb.outputs["Color"]
    else:
        col_kara = col
    col_k = d("ShaderNodeVectorMath", operation="SCALE"); d.b(col_kara, col_k.inputs[0]); d.b(detay, col_k.inputs["Scale"])
    kara = d("ShaderNodeBsdfPrincipled", i_Roughness=0.9)
    kara.inputs["Specular IOR Level"].default_value = 0.35
    d.b(col_k.outputs[0], kara.inputs["Base Color"])
    # su: S2 rengi, Fresnel (Principled IOR 1,33), dalga normali (L3'te periyodik), güneş parıltısı
    deniz = d("ShaderNodeBsdfPrincipled", i_Roughness=0.2, i_IOR=1.333)
    deniz.inputs["Specular IOR Level"].default_value = 0.5
    dkol = d("ShaderNodeVectorMath", operation="SCALE"); d.b(col, dkol.inputs[0]); dkol.inputs["Scale"].default_value = 0.75
    d.b(dkol.outputs[0], deniz.inputs["Base Color"])
    # dalga: 140 m'lik kabarma + 25 m'lik çırpıntı; döngü saatinde (L3, P = 5 s) büyük yarıçap → parıltı titreşimi görünür
    # (EEVEE: üçüncü 4B gürültü malzemeyi derletmiyordu → çırpıntı katmanı kaldırıldı, kabarma ayrıntısı 4)
    dz1 = periyodik_gurultu(d, eq, "saat_su", 1 / 140.0, 4.0, 2.2)
    yuks = dz1.outputs["Fac"]
    bump = d("ShaderNodeBump", i_Strength=1.0, i_Distance=7.0); d.b(yuks, bump.inputs["Height"])
    d.b(bump.outputs["Normal"], deniz.inputs["Normal"])
    # rüzgâr lekeleri: ~700 m ölçekli periyodik alan parıltı yolunun parlaklığını ve pürüzünü oynatır — 15–20 km'de
    # çözülen tek döngü motifi (alt-piksel dalga normalleri TAA'da ortalanıp görünmüyordu: L3 ardışık fark 0,03/255)
    rz = periyodik_gurultu(d, eq, "saat_su", 1 / 700.0, 2.0, 1.4)
    rzf = d.aralik(rz.outputs["Fac"], 0.35, 0.65)
    d.b(d.math("ADD", 0.12, d.math("MULTIPLY", rzf, 0.16)), deniz.inputs["Roughness"])
    d.b(d.math("ADD", 0.25, d.math("MULTIPLY", rzf, 0.6)), deniz.inputs["Specular IOR Level"])
    mx = d("ShaderNodeMixShader"); d.b(su, mx.inputs[0]); d.b(kara.outputs[0], mx.inputs[1]); d.b(deniz.outputs[0], mx.inputs[2])
    # E turu körfez yaması (brief §12.2, §12.6): t23 k16–30'daki dikdörtgen sınır arazi ağının ±110 km kenarı (ölçüldü:
    # t23 k24 güney kenarında deniz B 38 → 50,6/255; arazi denizi dkol ×0,75 ve ayrı BSDF, küre denizi ×1). Kenar halkasında
    # (kenardan 3–13 km) ve denizde Expo'dan 55–95 km'de gölgelendirme küre (Dunya) malzemesinin eşdeğerine geçer (aynı C1/S2
    # rengi, pürüz 0,85/0,22, speküler 0,2/0,7, küre normali + rölyef); en dış 3 km saydam (alfa) → küre görünür. Kara
    # 55–95 km'de değişmez (Beydağları l3'te görünüyor; l3 yeniden render edilmiyor). Expo'dan < 55 km hiçbir şey değişmez.
    kure = d("ShaderNodeBsdfPrincipled")
    d.b(col_kure, kure.inputs["Base Color"])
    d.b(d.karistir(su_kure, 0.85, 0.22, "FLOAT"), kure.inputs["Roughness"])
    d.b(d.karistir(su_kure, 0.2, 0.7, "FLOAT"), kure.inputs["Specular IOR Level"])
    gk = d("ShaderNodeNewGeometry")
    kn = d.vmath("NORMALIZE", d.vmath("ADD", gk.outputs["Position"], (0.0, 0.0, R)))
    if _rf and a.rolyef_guc > 0:
        vre = esle(d, eq, 1 / (RFW * KX), 1 / (RFH * KY), (LON0 - RFLO0) / RFW, (LAT0 - RFLA0) / RFH)
        kn = rolyef_tumsek(d, vre, kn)
    d.b(kn, kure.inputs["Normal"])
    sk_ = d("ShaderNodeSeparateXYZ"); d.b(eq, sk_.inputs[0])
    kenar = d.math("SUBTRACT", float(AR_L), d.math("MAXIMUM", d.math("ABSOLUTE", sk_.outputs["X"]), d.math("ABSOLUTE", sk_.outputs["Y"])))
    w_kenar = d.aralik(kenar, 13000.0, 3000.0)
    w_r = d.math("MULTIPLY", d.aralik(d.vmath("LENGTH", eq), 55000.0, 95000.0), su)
    mk = d("ShaderNodeMixShader"); d.b(d.math("MAXIMUM", w_kenar, w_r), mk.inputs[0])
    d.b(mx.outputs[0], mk.inputs[1]); d.b(kure.outputs[0], mk.inputs[2])
    tr_ = d("ShaderNodeBsdfTransparent")
    # S1b: gölge ışınları için saydam halka tümüyle saydam (yarı saydam halka hem altındaki küreyi gölgeliyor hem de
    # onun üstünden görülüyordu → t23 k24 güney kenarında 3–6 px'lik −4/255 koyu çizgi; ölçüldü). İç kısım (kenar ≥ 3 km)
    # kamera ve gölge ışınlarında aynen opak.
    lp_ = d("ShaderNodeLightPath")
    a_kam = d.aralik(kenar, 0.0, 3000.0)
    a_gol = d.aralik(kenar, 2990.0, 3000.0, tip="LINEAR")
    ma = d("ShaderNodeMixShader"); d.b(d.karistir(lp_.outputs["Is Shadow Ray"], a_kam, a_gol, "FLOAT"), ma.inputs[0])
    d.b(tr_.outputs[0], ma.inputs[1]); d.b(pusla(d, mk.outputs[0]), ma.inputs[2])
    d.b(ma.outputs[0], out.inputs["Surface"])
    OB["arazi"] = arazi
    log("arazi", len(me.vertices), "köşe")

# ------------------------------------------------------------------ OSM yakın alan
def npz_obje(ad, malzemeler):
    z = np.load(os.path.join(TEX, f"ag_{ad}.npz"))
    v, f, uv = z["v"], z["f"], z["uv"]
    me = ag_olustur(ad, v, np.arange(len(f)) * 3, f.ravel(), uv.reshape(-1, 2))
    me.polygons.foreach_set("use_smooth", np.zeros(len(f), bool))
    me.polygons.foreach_set("material_index", z["mat"].astype(np.int32))
    for k in ("rnd", "renk"):
        at = me.attributes.new(k, "FLOAT", "FACE"); at.data.foreach_set("value", z[k].astype(np.float32))
    for mm in malzemeler:
        me.materials.append(mm)
    o = bpy.data.objects.new(ad, me); sc.collection.objects.link(o)
    return o


def fattr(d, ad):
    return d("ShaderNodeAttribute", attribute_type="GEOMETRY", attribute_name=ad).outputs["Fac"]


def palet(d, idx, renkler):
    """idx (0..n−1) → renk (basamaklı)."""
    out = renkler[0]
    for i, c in enumerate(renkler[1:], 1):
        out = d.karistir(d.math("GREATER_THAN", idx, i - 0.5), out, c)
    return out


def srgb(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def basit(ad, renk, rough=0.7, spec=0.5, metal=0.0):
    m, d = malzeme(ad)
    out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled", i_Roughness=rough, i_Metallic=metal)
    bs.inputs["Specular IOR Level"].default_value = spec
    if isinstance(renk, tuple):
        bs.inputs["Base Color"].default_value = (*renk, 1.0)
    else:
        d.b(renk(d), bs.inputs["Base Color"])
    d.b(pusla(d, bs.outputs[0]), out.inputs["Surface"])
    return m, d, bs



# ------------------------------------------------------------------ B turu: örnekleme (GN instance) ve modüller
import bmesh  # noqa: E402

MODUL_KOL = {}


def modul_ag(ad, yap, malz, duz=False):
    """yap(bm) → bmesh geometrisi; birim modül (taban z = 0)."""
    bm = bmesh.new()
    yap(bm)
    me = bpy.data.meshes.new(ad)
    bm.to_mesh(me); bm.free()
    for p_ in me.polygons:
        p_.use_smooth = not duz
    for m_ in (malz if isinstance(malz, (list, tuple)) else [malz]):
        me.materials.append(m_)
    return bpy.data.objects.new(ad, me)


def ornek_kur(ad, npz, moduller):
    """orn_<ad>.npz noktaları + moduller (sıra = tip) → Instance on Points (Pick Instance). Nokta öznitelikleri
    (tip, aci, olcek, rnd) örneklere geçer; gölgelendirici rnd'yi INSTANCER özniteliği olarak okur."""
    z = np.load(os.path.join(TEX, npz))
    P, aci, olc, tip = z["poz"].astype(np.float64), z["aci"], z["olcek"], z["tip"]
    n = len(P)
    me = bpy.data.meshes.new(ad + "Nokta")
    me.vertices.add(n)
    me.vertices.foreach_set("co", np.ascontiguousarray(P, np.float32).ravel())
    for k_, tip_, deger in (("tip", "INT", tip.astype(np.int32)), ("aci", "FLOAT", aci.astype(np.float32)),
                            ("rnd", "FLOAT", np.random.default_rng(7).random(n).astype(np.float32))):
        at = me.attributes.new(k_, tip_, "POINT"); at.data.foreach_set("value", deger)
    at = me.attributes.new("olcek", "FLOAT_VECTOR", "POINT"); at.data.foreach_set("vector", np.ascontiguousarray(olc, np.float32).ravel())
    me.update()
    kol = bpy.data.collections.new(ad + "Moduller")          # sahneye bağlı değil: modüller kendi başına görünmez
    for i, mo in enumerate(moduller):
        mo.name = f"{ad}_{i}_{mo.name}"
        kol.objects.link(mo)
    MODUL_KOL[ad] = kol
    ng = bpy.data.node_groups.new(ad + "GN", "GeometryNodeTree")
    ng.interface.new_socket(name="Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    ng.interface.new_socket(name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    N_ = ng.nodes; L_ = ng.links
    gi = N_.new("NodeGroupInput"); go = N_.new("NodeGroupOutput")
    ci = N_.new("GeometryNodeCollectionInfo")
    ci.inputs["Collection"].default_value = kol
    ci.inputs["Separate Children"].default_value = True
    ci.inputs["Reset Children"].default_value = True
    iop = N_.new("GeometryNodeInstanceOnPoints")
    iop.inputs["Pick Instance"].default_value = True
    def na(isim, tur):
        x = N_.new("GeometryNodeInputNamedAttribute"); x.data_type = tur; x.inputs["Name"].default_value = isim
        return x.outputs["Attribute"]
    L_.new(gi.outputs[0], iop.inputs["Points"]); L_.new(ci.outputs[0], iop.inputs["Instance"])
    L_.new(na("tip", "INT"), iop.inputs["Instance Index"])
    cz = N_.new("ShaderNodeCombineXYZ"); L_.new(na("aci", "FLOAT"), cz.inputs["Z"])
    e2r = N_.new("FunctionNodeEulerToRotation"); L_.new(cz.outputs[0], e2r.inputs[0])
    L_.new(e2r.outputs[0], iop.inputs["Rotation"])
    L_.new(na("olcek", "FLOAT_VECTOR"), iop.inputs["Scale"])
    L_.new(iop.outputs[0], go.inputs[0])
    o = bpy.data.objects.new(ad, me); sc.collection.objects.link(o)
    md = o.modifiers.new("Ornek", "NODES"); md.node_group = ng
    return o


def iattr(d, ad):
    return d("ShaderNodeAttribute", attribute_type="INSTANCER", attribute_name=ad).outputs["Fac"]


def yap_ikos(alt=1, cz=0.55, rz=0.45, gurultu=0.10, tohum=1, ek=()):
    def f(bm):
        rng_ = np.random.default_rng(tohum)
        for (ox, oy, oz, s) in ((0.0, 0.0, cz, 1.0),) + tuple(ek):
            r_ = bmesh.ops.create_icosphere(bm, subdivisions=alt, radius=1.0)
            for v in r_["verts"]:
                k = 1 + rng_.normal(0, gurultu)
                v.co.x = ox + v.co.x * s * k; v.co.y = oy + v.co.y * s * k; v.co.z = oz + v.co.z * rz * s * k
    return f


def yap_koni(seg=8, z0=0.28, ince=False):
    def f(bm):
        if ince:      # servi: iğ biçimi (elipsoid, üstte sivri)
            r_ = bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=6, radius=1.0)
            for v in r_["verts"]:
                t = (v.co.z + 1) / 2
                v.co.x *= (1.0 - 0.55 * t ** 1.5); v.co.y *= (1.0 - 0.55 * t ** 1.5)
                v.co.z = 0.08 + t * 0.92
        else:         # çam: gövde üstünde konik-yuvarlak tepe
            r_ = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=1.0, radius2=0.18, depth=1.0 - z0)
            for v in r_["verts"]:
                v.co.z += z0 + (1.0 - z0) / 2
    return f


def yap_sera(tonoz=True, e=0.46, seg=10):
    """Birim sera modülü: X boy [−0,5, 0,5], Y açıklık [−0,5, 0,5], Z [0, 1]; yan duvar e'ye, üstte tonoz/beşik."""
    def f(bm):
        if tonoz:
            prof = [(0.5, 0.0)] + [(0.5 * math.cos(math.pi * i / seg), e + (1 - e) * math.sin(math.pi * i / seg)) for i in range(seg + 1)] + [(-0.5, 0.0)]
        else:
            prof = [(0.5, 0.0), (0.5, e), (0.0, 1.0), (-0.5, e), (-0.5, 0.0)]
        a_ = [bm.verts.new((-0.5, y, z)) for y, z in prof]
        b_ = [bm.verts.new((0.5, y, z)) for y, z in prof]
        for i in range(len(prof) - 1):
            bm.faces.new((a_[i], a_[i + 1], b_[i + 1], b_[i]))
        bm.faces.new(list(reversed(a_))); bm.faces.new(b_)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return f


def yap_kutu(ust=False):
    def f(bm):
        r_ = bmesh.ops.create_cube(bm, size=1.0)
        for v in r_["verts"]:
            v.co.z += 0.5
        if ust:       # çatı katı: %70'lik geri çekilmiş üst kat
            r2 = bmesh.ops.create_cube(bm, size=1.0)
            for v in r2["verts"]:
                v.co.x *= 0.7; v.co.y *= 0.6; v.co.z = 1.0 + (v.co.z + 0.5) * 0.12
    return f


if yakin_gerek and not a.sadece_json:
    # binalar: sıva paleti, çatı beton/kiremit, güneş paneli
    def duvar_renk(d):
        return palet(d, fattr(d, "renk"), [srgb("#d8d0bf"), srgb("#e4e0d6"), srgb("#c9bda4"), srgb("#d6c3a2"),
                                            srgb("#bdb7ad"), srgb("#e0d6c6")])
    def duvar_pencereli(d):
        uvn = d("ShaderNodeUVMap").outputs["UV"]; sp = d("ShaderNodeSeparateXYZ"); d.b(uvn, sp.inputs[0])
        pu = d.math("FRACT", d.math("DIVIDE", sp.outputs["X"], 3.3)); pv = d.math("FRACT", d.math("DIVIDE", d.math("SUBTRACT", sp.outputs["Y"], 0.4), 3.1))
        pen = d.math("MULTIPLY", d.math("MULTIPLY", d.math("GREATER_THAN", pu, 0.28), d.math("LESS_THAN", pu, 0.72)),
                     d.math("MULTIPLY", d.math("GREATER_THAN", pv, 0.32), d.math("LESS_THAN", pv, 0.78)))
        pen = d.math("MULTIPLY", pen, d.math("GREATER_THAN", sp.outputs["Y"], 0.9))
        return d.karistir(pen, duvar_renk(d), srgb("#2b3036"))
    m_duvar, d, bs = basit("BinaDuvar", duvar_pencereli, 0.85, 0.3)
    def cati_renk(d):
        r = fattr(d, "rnd")
        return d.karistir(d.math("GREATER_THAN", r, 0.72), srgb("#a9a49b"), srgb("#a55a3c"))
    m_cati, d, bs = basit("BinaCati", cati_renk, 0.8, 0.3)
    m_panel, d, bs = basit("Panel", srgb("#1d2a3a"), 0.18, 0.8)
    OB["bina"] = npz_obje("bina", [m_duvar, m_cati, m_panel])
    # seralar: süt beyazı plastik örtü, çatıda 8 m'lik tonoz sırtları (bump), karşı ışıkta parlar
    m_sd, d, bs = basit("SeraDuvar", srgb("#b8bfbd"), 0.35, 0.6)
    bs.inputs["Transmission Weight"].default_value = 0.35
    m_sc, d = malzeme("SeraCati")
    out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.22)
    bs.inputs["Specular IOR Level"].default_value = 0.9; bs.inputs["Transmission Weight"].default_value = 0.2
    uvn = d("ShaderNodeUVMap").outputs["UV"]
    sp = d("ShaderNodeSeparateXYZ"); d.b(uvn, sp.inputs[0])
    tonoz = d.math("ABSOLUTE", d.math("SINE", d.math("MULTIPLY", sp.outputs["X"], math.pi / 8.0)))
    nzs = d("ShaderNodeTexNoise", i_Scale=0.08, i_Detail=3.0); d.b(uvn, nzs.inputs["Vector"])
    oluk = d.math("POWER", d.math("SUBTRACT", 1.0, tonoz), 6.0)
    d.b(d.karistir(oluk, d.karistir(nzs.outputs["Fac"], srgb("#a9b2b1"), srgb("#d3d8d4")), srgb("#5b625f")), bs.inputs["Base Color"])
    bp = d("ShaderNodeBump", i_Strength=1.0, i_Distance=2.0); d.b(tonoz, bp.inputs["Height"]); d.b(bp.outputs["Normal"], bs.inputs["Normal"])
    d.b(pusla(d, bs.outputs[0]), out.inputs["Surface"])
    if not B_YAKIN:
        OB["sera"] = npz_obje("sera", [m_sd, m_sc])
    # Expo salonu: açık gri nervürlü panel duvar, çatı #e0d4ba dikişli metal
    m_hd, d = malzeme("SalonDuvar")
    out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.45, i_Metallic=0.3)
    uvn = d("ShaderNodeUVMap").outputs["UV"]; sp = d("ShaderNodeSeparateXYZ"); d.b(uvn, sp.inputs[0])
    nerv = d.math("ABSOLUTE", d.math("SINE", d.math("MULTIPLY", sp.outputs["X"], math.pi / 0.9)))
    bp = d("ShaderNodeBump", i_Strength=0.6, i_Distance=0.05); d.b(nerv, bp.inputs["Height"]); d.b(bp.outputs["Normal"], bs.inputs["Normal"])
    bant = d.math("LESS_THAN", sp.outputs["Y"], 1.2)
    d.b(d.karistir(bant, srgb("#c9ccce"), srgb("#5d6266")), bs.inputs["Base Color"])
    d.b(pusla(d, bs.outputs[0]), out.inputs["Surface"])
    m_hc, d = malzeme("SalonCati")
    out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.42, i_Metallic=0.45)
    uvn = d("ShaderNodeUVMap").outputs["UV"]; sp = d("ShaderNodeSeparateXYZ"); d.b(uvn, sp.inputs[0])
    dikis = d.math("POWER", d.math("ABSOLUTE", d.math("SINE", d.math("MULTIPLY", sp.outputs["Y"], math.pi / 0.6))), 12.0)
    bp = d("ShaderNodeBump", i_Strength=0.7, i_Distance=0.03); d.b(dikis, bp.inputs["Height"]); d.b(bp.outputs["Normal"], bs.inputs["Normal"])
    nzk = d("ShaderNodeTexNoise", i_Scale=0.05, i_Detail=8.0, i_Roughness=0.65); d.b(uvn, nzk.inputs["Vector"])
    kir = d.aralik(nzk.outputs["Fac"], 0.35, 0.75)
    cati_c = d.karistir(kir, srgb("#e0d4ba"), srgb("#b9ae97"))
    if B_YAKIN:
        derz = d.math("LESS_THAN", d.math("PINGPONG", sp.outputs["X"], 6.0), 0.05)          # 12 m'de bir enine derz
        pnl = d("ShaderNodeTexWhiteNoise", noise_dimensions="2D")
        pcb = d("ShaderNodeCombineXYZ"); d.b(d.math("FLOOR", d.math("DIVIDE", sp.outputs["X"], 12.0)), pcb.inputs["X"])
        d.b(d.math("FLOOR", d.math("DIVIDE", sp.outputs["Y"], 0.6)), pcb.inputs["Y"]); d.b(pcb.outputs[0], pnl.inputs["Vector"])
        cati_c = d.karistir(d.math("MULTIPLY", pnl.outputs["Value"], 0.18), cati_c, srgb("#cdbf9f"))
        cati_c = d.karistir(derz, cati_c, srgb("#7d7564"))
    d.b(cati_c, bs.inputs["Base Color"])
    d.b(pusla(d, bs.outputs[0]), out.inputs["Surface"])
    OB["salon"] = npz_obje("salon", [m_hd, m_hc])
    # ışıklık bantları: cam; dalışın sonunda güneşi alıp parlar (isik_k)
    m_is, d = malzeme("Isiklik")
    out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.06, i_IOR=1.5)
    bs.inputs["Base Color"].default_value = (*srgb("#5f7480"), 1); bs.inputs["Specular IOR Level"].default_value = 1.0
    if B_YAKIN:
        uvi = d("ShaderNodeUVMap").outputs["UV"]; spi = d("ShaderNodeSeparateXYZ"); d.b(uvi, spi.inputs[0])
        kayit = d.math("LESS_THAN", d.math("PINGPONG", spi.outputs["X"], 0.75), 0.05)
        d.b(d.karistir(kayit, srgb("#d9dde0"), srgb("#8d9196")), bs.inputs["Base Color"])
        d.b(d.karistir(kayit, 0.3, 0.45, "FLOAT"), bs.inputs["Roughness"])
        d.b(d.karistir(kayit, 0.0, 0.8, "FLOAT"), bs.inputs["Metallic"])
    bs.inputs["Emission Color"].default_value = (*srgb("#FFF1DC"), 1)
    d.b(d.math("MULTIPLY", attr(d, "isik_k"), 30.0), bs.inputs["Emission Strength"])
    d.b(pusla(d, bs.outputs[0]), out.inputs["Surface"])
    OB["isiklik"] = npz_obje("isiklik", [m_is])
    # zemin döşemeleri
    m_ex, d = malzeme("ExpoZemin")
    out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.8)
    uvn = d("ShaderNodeUVMap").outputs["UV"]
    br = d("ShaderNodeTexBrick", i_Scale=1 / 6.0, i_Mortar__Size=0.012)
    d.b(uvn, br.inputs["Vector"])
    br.inputs["Color1"].default_value = (*srgb("#bdb7ab"), 1); br.inputs["Color2"].default_value = (*srgb("#c9c3b6"), 1)
    br.inputs["Mortar"].default_value = (*srgb("#8f8a82"), 1)
    d.b(br.outputs["Color"], bs.inputs["Base Color"])
    d.b(pusla(d, bs.outputs[0]), out.inputs["Surface"])
    m_ot, d = malzeme("Otopark")
    out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.85)
    uvn = d("ShaderNodeUVMap").outputs["UV"]; sp = d("ShaderNodeSeparateXYZ"); d.b(uvn, sp.inputs[0])
    cizgi_u = d.math("LESS_THAN", d.math("PINGPONG", sp.outputs["X"], 1.3), 0.07)
    cizgi_v = d.math("LESS_THAN", d.math("ABSOLUTE", d.math("SUBTRACT", d.math("PINGPONG", sp.outputs["Y"], 8.0), 0.0)), 0.06)
    serit_alan = d.math("LESS_THAN", d.math("PINGPONG", d.math("ADD", sp.outputs["Y"], 8.0), 8.0), 5.0)
    cz = d.math("MINIMUM", d.math("MAXIMUM", d.math("MULTIPLY", cizgi_u, serit_alan), cizgi_v), 1.0)
    nza = d("ShaderNodeTexNoise", i_Scale=0.2, i_Detail=5.0); d.b(uvn, nza.inputs["Vector"])
    asf = d.karistir(nza.outputs["Fac"], srgb("#3a3b3c"), srgb("#55565a"))
    d.b(d.karistir(cz, asf, srgb("#d9d6cc")), bs.inputs["Base Color"])
    d.b(pusla(d, bs.outputs[0]), out.inputs["Surface"])
    m_pr, d, bs = basit("Peron", srgb("#a6a29a"), 0.8)
    OB["zemin"] = npz_obje("zemin", [m_ex, m_ot, m_pr])
    # yollar: asfalt + şerit çizgileri (uv: boyuna m, enine −1..1)
    def yol_malz(ad, taban, acik, cizgi):
        m, d = malzeme(ad)
        out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.88)
        bs.inputs["Specular IOR Level"].default_value = 0.25
        uvn = d("ShaderNodeUVMap").outputs["UV"]; sp = d("ShaderNodeSeparateXYZ"); d.b(uvn, sp.inputs[0])
        nz = d("ShaderNodeTexNoise", i_Scale=0.15, i_Detail=6.0); d.b(uvn, nz.inputs["Vector"])
        c = d.karistir(nz.outputs["Fac"], taban, acik)
        if cizgi:
            kenar = d.math("GREATER_THAN", d.math("ABSOLUTE", sp.outputs["Y"]), 0.92)
            orta = d.math("MULTIPLY", d.math("LESS_THAN", d.math("ABSOLUTE", d.math("SUBTRACT", d.math("ABSOLUTE", sp.outputs["Y"]), 0.33)), 0.04),
                          d.math("LESS_THAN", d.math("PINGPONG", sp.outputs["X"], 6.0), 3.0))
            c = d.karistir(d.math("MAXIMUM", kenar, orta), c, srgb("#e8e6df"))
        d.b(c, bs.inputs["Base Color"])
        d.b(pusla(d, bs.outputs[0]), out.inputs["Surface"])
        return m
    m_tram, d = malzeme("Tramvay")
    out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.7)
    uvn = d("ShaderNodeUVMap").outputs["UV"]; sp = d("ShaderNodeSeparateXYZ"); d.b(uvn, sp.inputs[0])
    ay = d.math("ABSOLUTE", sp.outputs["Y"])
    ray = d.math("MAXIMUM", d.math("LESS_THAN", d.math("ABSOLUTE", d.math("SUBTRACT", ay, 0.30)), 0.03),
                 d.math("LESS_THAN", d.math("ABSOLUTE", d.math("SUBTRACT", ay, 0.75)), 0.03))
    trav = d.math("LESS_THAN", d.math("PINGPONG", sp.outputs["X"], 0.33), 0.12)
    c = d.karistir(trav, srgb("#6a675f"), srgb("#55524c"))
    c = d.karistir(ray, c, srgb("#b8b6b0"))
    d.b(c, bs.inputs["Base Color"]); d.b(d.karistir(ray, 0.75, 0.25, "FLOAT"), bs.inputs["Roughness"])
    bs.inputs["Metallic"].default_value = 0.0
    d.b(pusla(d, bs.outputs[0]), out.inputs["Surface"])
    OB["yol"] = npz_obje("yol", [yol_malz("YolAna", srgb("#34363a"), srgb("#45474b"), True),
                                 yol_malz("YolMahalle", srgb("#4a4a4a"), srgb("#5f5d5a"), False),
                                 yol_malz("YolToprak", srgb("#8a7558"), srgb("#a08a6a"), False),
                                 yol_malz("Kaldirim", srgb("#a9a59c"), srgb("#bdb8ae"), False), m_tram])
    # araçlar: boya paleti (beyaz, gümüş, gri, siyah, kırmızı, mavi, bej), cam
    def boya(d):
        return palet(d, fattr(d, "renk"), [srgb("#e9e9e6"), srgb("#a7aaae"), srgb("#5c5f63"), srgb("#141516"),
                                            srgb("#8e1f1f"), srgb("#1f3d6b"), srgb("#b9a684")])
    m_ab, d, bs = basit("AracGovde", boya, 0.25, 0.8)
    bs.inputs["Coat Weight"].default_value = 0.6
    m_ac, d, bs = basit("AracCam", srgb("#15191c"), 0.08, 1.0)
    OB["arac"] = npz_obje("arac", [m_ab, m_ac])
    # ağaçlar: narenciye/geniş yaprak (koyu parlak yeşil), çam
    def yaprak(d):
        return palet(d, fattr(d, "renk"), [srgb("#2f4a24"), srgb("#3c5a2a"), srgb("#4a6630"), srgb("#36502a")])
    m_ag, d, bs = basit("Agac", yaprak, 0.75, 0.35)
    bs.inputs["Subsurface Weight"].default_value = 0.0
    m_cm, d, bs = basit("Cam", srgb("#2a3f26"), 0.8, 0.3)
    if not B_YAKIN:
        OB["agac"] = npz_obje("agac", [m_ag, m_cm])
    if B_YAKIN:
        # B turu seralar: gerçek tonoz/beşik modülleri (orn_sera.npz), yarı saydam kirli-beyaz plastik, speküler;
        # örnek başına renk/toz değişimi (rnd) + dünya konumunda toz lekeleri; karşı ışıkta geçirgenlik parlar
        m_pl, d = malzeme("SeraPlastik")
        out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.26)
        bs.inputs["Specular IOR Level"].default_value = 0.6
        r_ = iattr(d, "rnd")
        taban = palet(d, d.math("FLOOR", d.math("MULTIPLY", r_, 4.0)), [srgb("#dcdfd9"), srgb("#c9cbc2"), srgb("#d3dbdc"), srgb("#bdbcb1")])
        pz = d("ShaderNodeNewGeometry").outputs["Position"]
        nzt = d("ShaderNodeTexNoise", i_Scale=0.18, i_Detail=4.0, i_Roughness=0.6); d.b(pz, nzt.inputs["Vector"])
        toz = d.aralik(nzt.outputs["Fac"], 0.45, 0.75, 0.0, 0.22)
        d.b(d.karistir(toz, taban, srgb("#9a968a")), bs.inputs["Base Color"])
        d.b(d.math("ADD", 0.2, d.math("MULTIPLY", r_, 0.16)), bs.inputs["Roughness"])
        tl = d("ShaderNodeBsdfTranslucent"); tl.inputs["Color"].default_value = (*srgb("#f3ecdb"), 1)
        mxs = d("ShaderNodeMixShader"); mxs.inputs[0].default_value = 0.45
        d.b(bs.outputs[0], mxs.inputs[1]); d.b(tl.outputs[0], mxs.inputs[2])
        d.b(pusla(d, mxs.outputs[0]), out.inputs["Surface"])
        OB["sera"] = ornek_kur("sera", "orn_sera.npz", [modul_ag("tonoz", yap_sera(True), m_pl), modul_ag("besik", yap_sera(False), m_pl, duz=True)])
        # ağaçlar: 4 biçim (narenciye, çam, geniş yapraklı küme, servi); örnek başına ton ve parlaklık değişimi;
        # karşı ışıkta yaprak geçirgenliği (sarı-yeşil)
        def agac_malz(ad, renkler, gecir=0.18):
            m_, d = malzeme(ad)
            out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.7)
            bs.inputs["Specular IOR Level"].default_value = 0.3
            r_ = iattr(d, "rnd")
            c_ = palet(d, d.math("FLOOR", d.math("MULTIPLY", r_, len(renkler) - 0.001)), [srgb(h) for h in renkler])
            pz = d("ShaderNodeNewGeometry").outputs["Position"]
            nz_ = d("ShaderNodeTexNoise", i_Scale=1.2, i_Detail=3.0); d.b(pz, nz_.inputs["Vector"])
            c_ = d.karistir(d.aralik(nz_.outputs["Fac"], 0.3, 0.7, 0.0, 0.35), c_, srgb("#1a2612"))
            d.b(c_, bs.inputs["Base Color"])
            tl = d("ShaderNodeBsdfTranslucent"); tl.inputs["Color"].default_value = (*srgb("#7d9a3a"), 1)
            mxs = d("ShaderNodeMixShader"); mxs.inputs[0].default_value = gecir
            d.b(bs.outputs[0], mxs.inputs[1]); d.b(tl.outputs[0], mxs.inputs[2])
            d.b(pusla(d, mxs.outputs[0]), out.inputs["Surface"])
            return m_
        m_nar = agac_malz("AgacNarenciye", ["#2b4a1e", "#33551f", "#3d5c26", "#2f4620", "#4a6230"])
        m_cam = agac_malz("AgacCam", ["#24361d", "#2c3f22", "#33462a"], 0.08)
        m_gen = agac_malz("AgacGenis", ["#3b5a24", "#4f6b2c", "#5d6f38", "#6b7440", "#465f2b"])
        m_ser = agac_malz("AgacServi", ["#1f3019", "#26381e"], 0.06)
        OB["agac"] = ornek_kur("agac", "orn_agac.npz", [
            modul_ag("narenciye", yap_ikos(1, 0.55, 0.45, 0.10, 1), m_nar),
            modul_ag("cam", yap_koni(8, 0.30), m_cam),
            modul_ag("genis", yap_ikos(1, 0.52, 0.42, 0.12, 2, ((0.45, 0.2, 0.62, 0.7), (-0.35, -0.3, 0.6, 0.65))), m_gen),
            modul_ag("servi", yap_koni(8, ince=True), m_ser)])
        # Antalya kenti: 12 km'de siluet veren prosedürel bloklar (S2 kentsel sınıf); duvar paleti + çatı (düz beton,
        # yer yer kiremit); z araziye bırakılır (eğrilik dahil)
        zk = np.load(os.path.join(TEX, "orn_kent.npz"))
        Pk = zk["poz"].astype(np.float64)
        Pk[:, 2] = [yer_z(float(x_), float(y_)) - 2.0 for x_, y_ in Pk[:, :2]]
        np.savez(os.path.join(TEX, "orn_kent_z.npz"), poz=Pk.astype(np.float32), aci=zk["aci"], olcek=zk["olcek"] + np.array([0, 0, 2.0], np.float32), tip=zk["tip"])
        m_kt, d = malzeme("KentBlok")
        out = d("ShaderNodeOutputMaterial"); bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.8)
        bs.inputs["Specular IOR Level"].default_value = 0.35
        r_ = iattr(d, "rnd")
        duvar = palet(d, d.math("FLOOR", d.math("MULTIPLY", r_, 6.0)), [srgb("#e6dccb"), srgb("#eceae4"), srgb("#d8c7a8"),
                                                                          srgb("#c8c8c4"), srgb("#d9b8a0"), srgb("#cfd2cf")])
        cati_r = d.karistir(d.math("GREATER_THAN", d.math("FRACT", d.math("MULTIPLY", r_, 7.0)), 0.8), srgb("#a29e96"), srgb("#a8664a"))
        nzk = d.vmath("DOT_PRODUCT", d("ShaderNodeNewGeometry").outputs["Normal"], (0.0, 0.0, 1.0))
        d.b(d.karistir(d.math("GREATER_THAN", nzk, 0.7), duvar, cati_r), bs.inputs["Base Color"])
        d.b(pusla(d, bs.outputs[0]), out.inputs["Surface"])
        OB["kent"] = ornek_kur("kent", "orn_kent_z.npz", [modul_ag("blok", yap_kutu(False), m_kt, duz=True),
                                                           modul_ag("blokust", yap_kutu(True), m_kt, duz=True)])
        # çatı ayrıntısı (t34a): parapet, HVAC gövdesi, fan ızgarası
        m_pa, d, bs = basit("Parapet", srgb("#cfcac0"), 0.5, 0.5, 0.3)
        m_hv, d, bs = basit("HVAC", srgb("#b9bcbb"), 0.42, 0.5, 0.45)
        m_fn, d, bs = basit("Fan", srgb("#2a2c2e"), 0.6, 0.4, 0.2)
        OB["cati"] = npz_obje("cati", [m_pa, m_hv, m_fn])
    log("OSM yakın alan:", {k: len(o.data.polygons) if o.data.polygons else len(o.data.vertices) for k, o in OB.items()
                            if k in ("bina", "sera", "salon", "isiklik", "zemin", "yol", "arac", "agac", "kent", "cati")})

# ------------------------------------------------------------------ gök (MULTIPLE_SCATTERING) + uzay siyahı
w = bpy.data.worlds.new("Gok"); sc.world = w
d = D(w.node_tree)
out = d("ShaderNodeOutputWorld"); bg = d("ShaderNodeBackground")
sky = d("ShaderNodeTexSky", sky_type="MULTIPLE_SCATTERING")
# MULTIPLE_SCATTERING sun_direction'ı kullanmıyor (ölçüldü): sun_rotation = pusula azimutu (kuzeyden saat yönü,
# +Y kuzey), sun_elevation = yükseklik (doğu işaretli panorama ile doğrulandı)
sky.sun_elevation = math.asin(max(-1.0, min(1.0, Lt[2])))
sky.sun_rotation = math.atan2(Lt[0], Lt[1]) % (2 * math.pi)
sky.sun_disc = True
sky.sun_size = math.radians(0.545)
sky.sun_intensity = 1.0
sky.altitude = 0.0
sky.aerosol_density = 1.0
d.b(sky.outputs["Color"], bg.inputs["Color"])
lp = d("ShaderNodeLightPath")
# görünen gök 0,16; sahneyi aydınlatan gök 0,10 (karşı ışıkta gölge tarafı daha derin)
d.b(d.math("MULTIPLY", attr(d, "gok_k"), d.math("ADD", 0.10, d.math("MULTIPLY", lp.outputs["Is Camera Ray"], 0.06))), bg.inputs["Strength"])
d.b(bg.outputs[0], out.inputs["Surface"])
GOK = sky

# ------------------------------------------------------------------ güneş lambası
gl = bpy.data.lights.new("Gunes", "SUN"); gl.energy = 4.0; gl.angle = math.radians(0.53)
for k, v in (("shadow_maximum_resolution", a.golge_m), ("use_shadow_jitter", False)):     # yalnız EEVEE (Cycles kullanmaz)
    if hasattr(gl, k):
        setattr(gl, k, v)
go = bpy.data.objects.new("Gunes", gl); sc.collection.objects.link(go)
from mathutils import Vector, Matrix, Quaternion  # noqa: E402
go.rotation_mode = "QUATERNION"; go.rotation_quaternion = (-Vector(Lt)).to_track_quat("-Z", "Y")

# ------------------------------------------------------------------ kamera
cd = bpy.data.cameras.new("Kamera"); cd.sensor_width = KM.SENSOR; cd.sensor_fit = "HORIZONTAL"
cam = bpy.data.objects.new("Kamera", cd); sc.collection.objects.link(cam); sc.camera = cam
cam.rotation_mode = "QUATERNION"

# d3 durumu ve t34a hedefi (ışıklık bandı)
D3 = KM.d3_durum(OSM, yer_z)
bantlar = OSM["isiklik_bantlari"]
sx, sy = OSM["salon_merkez"]
otx, oty = OSM["otopark_merkez"]
# otopark tarafına (güneydoğu) en yakın bandın ortası
en = min(bantlar, key=lambda b_: math.hypot((b_[0][0] + b_[1][0]) / 2 - otx, (b_[0][1] + b_[1][1]) / 2 - oty))
hx, hy = (en[0][0] + en[1][0]) / 2, (en[0][1] + en[1][1]) / 2
# bandın otopark ucuna doğru %25 kaydır
u0 = np.array(en[0]); u1 = np.array(en[1])
uc = u0 if np.hypot(*(u0 - [otx, oty])) < np.hypot(*(u1 - [otx, oty])) else u1
hx, hy = hx + (uc[0] - hx) * 0.25, hy + (uc[1] - hy) * 0.25
hz = OSM["salon_cati_z"] + 1.3
hlat, hlon, _ = geo.dunya_latlon(np.array([hx, hy, 0.0]))
D3["isik_hedef"] = (float(hlat), float(hlon), float(hz))
log("d3:", {k: (round(v, 3) if isinstance(v, float) else v) for k, v in D3.items() if k != "G"}, "G", D3["G"])

# ------------------------------------------------------------------ yerel kümülüs (t23 bulut perdesi)
# klip-yerel kare (~%68). C turu: t23 yerel zamanı (kamera.t23_zaman) kare 40'tan sonra hızlandığı için τ(57) ≈ 59 —
# perde ve yerel bulut katmanı B turundaki konumda/irtifada (~5,5 km) kalır.
T23_PERDE = 57
YEREL_BULUT = []
if not a.sadece_json and "t23" in klipler and T23_BULUT == "eski":
    st_p = KM.kamera("t23", T23_PERDE, D3)
    pc = st_p["C"]
    n_kat = 9
    kat_ara = 55.0
    m_bl, d = malzeme("YerelBulut")
    m_bl.surface_render_method = "BLENDED"; m_bl.use_transparent_shadow = True
    out = d("ShaderNodeOutputMaterial")
    geo_ = d("ShaderNodeNewGeometry")
    pos = geo_.outputs["Position"]
    nz1 = d("ShaderNodeTexNoise", i_Scale=1 / 1400.0, i_Detail=6.0, i_Roughness=0.62); d.b(pos, nz1.inputs["Vector"])
    nz2 = d("ShaderNodeTexNoise", i_Scale=1 / 260.0, i_Detail=4.0, i_Roughness=0.6); d.b(pos, nz2.inputs["Vector"])
    # geçiş noktasında bulutun içi garanti: radyal tümsek
    rel = d("ShaderNodeVectorMath", operation="SUBTRACT"); d.b(pos, rel.inputs[0]); rel.inputs[1].default_value = tuple(pc)
    rr = d("ShaderNodeSeparateXYZ"); d.b(rel.outputs[0], rr.inputs[0])
    yat = d.vmath("LENGTH", d("ShaderNodeCombineXYZ").outputs[0]) if False else None
    cxy = d("ShaderNodeCombineXYZ"); d.b(rr.outputs["X"], cxy.inputs["X"]); d.b(rr.outputs["Y"], cxy.inputs["Y"])
    ryat = d.vmath("LENGTH", cxy.outputs[0])
    tumsek = d.aralik(ryat, 2600.0, 300.0)
    kume = d.aralik(ryat, 13000.0, 4000.0)                 # küme dışında bulut yok (uzak kenar çizgisi olmasın)
    dikey = d.aralik(d.math("ABSOLUTE", rr.outputs["Z"]), n_kat * kat_ara / 2, 0.0)
    yog = d.math("ADD", d.math("ADD", nz1.outputs["Fac"], d.math("MULTIPLY", d.math("SUBTRACT", nz2.outputs["Fac"], 0.5), 0.35)),
                 d.math("MULTIPLY", tumsek, 0.32))
    yog = d.math("MULTIPLY", d.math("MULTIPLY", d.aralik(yog, 0.56, 0.74), dikey), kume)
    alfa = d.math("MULTIPLY", d.math("MULTIPLY", yog, 0.42), attr(d, "yerel_bulut_k"))
    # aydınlatma: üst katlar güneşte parlak, alt katlar gri (sahte hacim)
    ust = d.aralik(rr.outputs["Z"], -n_kat * kat_ara / 2, n_kat * kat_ara / 2, 0.55, 1.0)
    em = d("ShaderNodeEmission"); em.inputs["Color"].default_value = (1.0, 0.975, 0.95, 1)
    d.b(d.math("MULTIPLY", ust, 2.1), em.inputs["Strength"])
    tr = d("ShaderNodeBsdfTransparent")
    mx = d("ShaderNodeMixShader"); d.b(alfa, mx.inputs[0]); d.b(tr.outputs[0], mx.inputs[1]); d.b(pusla(d, em.outputs[0]), mx.inputs[2])
    d.b(mx.outputs[0], out.inputs["Surface"])
    for k in range(n_kat):
        dz = (k - (n_kat - 1) / 2) * kat_ara
        bm_ = bpy.data.meshes.new(f"bulut{k}")
        s_ = 14000.0
        vv = np.array([[-s_, -s_, 0], [s_, -s_, 0], [s_, s_, 0], [-s_, s_, 0]]) + pc + [0, 0, dz]
        bm_.from_pydata([tuple(x) for x in vv], [], [(0, 1, 2, 3)])
        bm_.materials.append(m_bl)
        o = bpy.data.objects.new(f"YerelBulut{k}", bm_); sc.collection.objects.link(o)
        o.visible_shadow = False
        YEREL_BULUT.append(o)
    log("yerel kümülüs katmanı: merkez", np.round(pc, 1), "irtifa", round(st_p["irtifa"]), "m")

# ------------------------------------------------------------------ kameraya bağlı düzlemler: bulut perdesi (t23), parlama (t34a son 4 kare; yalnız --yakin A)
def kamera_duzlem(ad, renk, guc, attr_ad):
    m_, d = malzeme(ad)
    m_.surface_render_method = "BLENDED"
    out = d("ShaderNodeOutputMaterial")
    em = d("ShaderNodeEmission"); em.inputs["Color"].default_value = (*renk, 1); em.inputs["Strength"].default_value = guc
    tr = d("ShaderNodeBsdfTransparent")
    mx = d("ShaderNodeMixShader"); d.b(attr(d, attr_ad), mx.inputs[0]); d.b(tr.outputs[0], mx.inputs[1]); d.b(em.outputs[0], mx.inputs[2])
    d.b(mx.outputs[0], out.inputs["Surface"])
    bm_ = bpy.data.meshes.new(ad)
    bm_.from_pydata([(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)], [], [(0, 1, 2, 3)])
    bm_.materials.append(m_)
    o = bpy.data.objects.new(ad, bm_); sc.collection.objects.link(o)
    o.parent = cam; o.visible_shadow = False
    o.visible_diffuse = o.visible_glossy = o.visible_transmission = False
    return o


if not a.sadece_json and "t23" in klipler and T23_BULUT == "eski":
    # bulutun içi: düzgün, güneşli bulut beyazı (en beyaz kare 59 ≈ %70). F turu (--t23_bulut yok): perde kalkar
    OB["perde"] = kamera_duzlem("Perde", (1.0, 0.975, 0.95), 2.2, "perde_k")
if not a.sadece_json and "t34a" in klipler and not B_YAKIN:
    # AgX Punchy + pozlama 0,3 altında #FFF1DC'ye en yakın (ölçüldü: 250,240,220; ort. %92,8)
    OB["parlama"] = kamera_duzlem("Parlama", (1.0, 0.70, 0.15), 12.0, "parlama_k")


# ------------------------------------------------------------------ kare başına anahtarlar
def ss(x, a_, b_):
    t = min(1.0, max(0.0, (x - a_) / (b_ - a_)))
    return t * t * (3 - 2 * t)


POZ_RAMPA = tuple(float(x) for x in a.poz_rampa.split(","))
if a.poz == "oto":
    a.poz = "egri_f" if (a.profil == "fiske" and T23_BULUT == "yok") else "egri"
# C turu, ölçülmüş eğri (poz_egri.py; önizleme EXR + OCIO AgX Punchy): (irtifa km, k), pozlama = exposure + uzay_ev · k.
# Uçlarda kıskaç: ≥ 965,6 km → k = 1 (l2/t12/l1/t01: B ile aynı), ≤ 28,1 km → k = 0 (l3/t34a: B ile aynı). Arada
# luma tabanı %23 (kare 16–36), kare 36–40 en çok +2 puan; 30–400 km rampası çukuru kapatmıyordu (ölçüm: kare 20 %15,1,
# kare 30 %20,9 → kare 36 %19,3 → kare 40 %28,2; içerik: Sahra kadrajdan çıkıp koyu deniz yarıyı doldurunca).
POZ_EGRI = [(28.13, 0.000), (37.30, -0.082), (49.77, -0.164), (66.42, -0.247), (88.35, 0.105), (115.42, 0.479),
            (147.87, 0.561), (187.08, 0.664), (234.41, 0.770), (291.10, 1.082), (358.12, 1.462), (436.07, 1.650),
            (525.01, 1.775), (624.33, 1.845), (732.59, 1.603), (847.45, 1.113), (965.62, 1.000)]


def _fc_egimleri(xs, ys):
    """Fritsch–Carlson (tekdüze kübik Hermite) eğimleri: düğümler arasında aşma yok."""
    n = len(xs)
    h = [xs[i + 1] - xs[i] for i in range(n - 1)]
    dl = [(ys[i + 1] - ys[i]) / h[i] for i in range(n - 1)]
    m = [dl[0]] + [0.0] * (n - 2) + [dl[-1]]
    for i in range(1, n - 1):
        if dl[i - 1] * dl[i] > 0:
            w1 = 2 * h[i] + h[i - 1]; w2 = h[i] + 2 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / dl[i - 1] + w2 / dl[i])
    return m


# F turu (bulutsuz t23, --poz egri_f): ≥ 115 km POZ_EGRI aynen; 25–88 km düğümleri F önizlemesinden (EEVEE 960², eski
# eğriyle kare 19–30 luma 23,0 → 16,8 → 22,2; EV duyarlılığı kare 19–23'te ölçülen ≈ 8,4 luma puanı/EV) luma tabanı
# %22,5 hedefiyle; ≤ 25 km k = 0 (l3/t34a ve t23'ün kare 31 sonrası E ile aynı 0,3 EV).
POZ_EGRI_F = [(25.00, 0.000), (28.27, 0.030), (31.93, 0.130), (36.06, 0.220), (40.75, 0.290), (46.13, 0.360),
              (52.32, 0.410), (59.50, 0.430), (66.42, 0.440), (88.35, 0.450)] + [q for q in POZ_EGRI if q[0] > 100.0]
_PE = POZ_EGRI_F if a.poz == "egri_f" else POZ_EGRI
_PX = [math.log(x) for x, _ in _PE]
_PY = [k for _, k in _PE]
_PM = _fc_egimleri(_PX, _PY)


def uzay_k(irtifa):
    x = math.log(max(irtifa, 1.0) / 1000.0)
    if x <= _PX[0]:
        return _PY[0]
    if x >= _PX[-1]:
        return _PY[-1]
    i = max(j for j in range(len(_PX) - 1) if _PX[j] <= x)
    h = _PX[i + 1] - _PX[i]; t = (x - _PX[i]) / h
    return ((2 * t ** 3 - 3 * t ** 2 + 1) * _PY[i] + (t ** 3 - 2 * t ** 2 + t) * h * _PM[i]
            + (-2 * t ** 3 + 3 * t ** 2) * _PY[i + 1] + (t ** 3 - t ** 2) * h * _PM[i + 1])


def pozlama(irtifa):
    """Görünüm pozlaması (EV). B turu: exposure + uzay_ev · ss(irtifa, 150 km, 1.000 km) → t23'te 570–440 km arasında
    ortalama luma %31 → %11 çukuru (brief §11.1-2). C turu (--poz egri, varsayılan): ölçülmüş POZ_EGRI; --poz rampa:
    ss(irtifa, POZ_RAMPA) (brief önerisi 30–400 km). l1/l2/t01/t12 (≥ 1.499 km) ve l3/t34a (< 1 km) iki kipte de B ile
    aynı pozlamada."""
    if a.poz == "rampa":
        return a.exposure + a.uzay_ev * ss(irtifa, *POZ_RAMPA)
    return a.exposure + a.uzay_ev * uzay_k(irtifa)


def ortam(klip, f, st):
    K = KM.KLIPLER[klip]
    alt = st["irtifa"]
    o = {
        "pus_k": 1.0 - ss(alt, 100e3, 400e3),
        "gok_k": 1.0 - ss(alt, 25e3, 120e3),
        "bulut_k": ss(alt, 60e3, 250e3),
        "yerel_bulut_k": 0.0, "parlama_k": 0.0, "perde_k": 0.0, "isik_k": 0.0, "saat_bulut": 0.0, "saat_su": 0.0,
        # E turu (brief §12.2): rölyef yalnız d2 bandında (D1'de ve arazi devrinde 0), C1 yeni şeridi alt < 6.000 km,
        # atmosfer halesi 1 (≥ 12.000 km) → 0,6 (≤ 8.000 km)
        "rolyef_k": ss(alt, 9.0e6, 4.0e6) * ss(alt, 300e3, 600e3),
        "c1_ek_k": ss(alt, 6.0e6, 4.5e6),
        "hale_k": 0.6 + 0.4 * ss(alt, 8.0e6, 12.0e6),
        # S1b: kopuk hale düzeltmesi l1 irtifasında (15.529 km) 0 → t12 k10 (13.475 km) 1; 1.000 km altında yine 0
        "hale_ic_k": ss(alt, 15.45e6, 13.45e6) * ss(alt, 1.0e6, 1.9e6),
    }
    if klip == "t23" and T23_BULUT == "eski":
        o["yerel_bulut_k"] = ss(f, 36, 50) * (1 - ss(f, 66, 76))
        o["perde_k"] = 0.97 * math.exp(-((f - T23_PERDE) / 2.6) ** 2)
    if K["tur"] == "dongu":
        n = K["kare"]
        th = 2 * math.pi * f / n
        if klip in ("l1", "l2"):
            o["saat_bulut"] = th
        else:
            o["saat_su"] = th
    if klip == "t34a":
        # F turu: ışıklık parıltısı yolun aynı noktasına bağlı (eski yerel kare fz; fiske'de ilerlemeden geri çözülür)
        f_yol = KM.ilerleme("t34a", f)[1] if a.profil == "fiske" else f
        o["isik_k"] = ss(f_yol, 28, 44) * a.isik_carpan
        # parlama düzlemi (yalnız --yakin A; B'de kurulmaz): klibin sonuna bağıl (48 karede 41–43 rampa, 44– tam; F-B 36
        # karede 29–31, 32–)
        n_ = K["kare"]
        o["parlama_k"] = {n_ - 7: 0.12, n_ - 6: 0.4, n_ - 5: 0.78}.get(int(round(f)), 1.0 if f >= n_ - 4 else 0.0)
    # güneş rengi: uzayda beyaz, atmosferde alçak güneşin sıcak tonu
    yuk = GUN["yukseklik"]
    sicak = np.array([1.0, 0.86, 0.70]) if yuk < 12 else np.array([1.0, 0.91, 0.80])
    k = 1.0 - ss(alt, 15e3, 120e3)
    o["gunes_renk"] = tuple(np.array([1.0, 1.0, 1.0]) * (1 - k) + sicak * k)
    return o


def kamera_kur(klip, f, st):
    Cw, B = st["C"], st["B"]
    cam.location = Vector(tuple(Cw))
    cam.rotation_quaternion = Quaternion(KM.quat_from_basis(B))
    cd.lens = st["lens"]
    alt = st["irtifa"]
    ag = max(5.0, alt - (yer_z(float(Cw[0]), float(Cw[1])) if abs(Cw[0]) < 1e5 and abs(Cw[1]) < 1e5 and alt < 2e4 else 0.0))
    cd.clip_start = max(0.3, 0.04 * ag)
    Dm = float(np.linalg.norm(Cw - DUNYA_MERKEZ))
    cd.clip_end = Dm * 1.01 if alt > 50e3 else 450e3
    return cd.clip_start


onceki_q = [None]


def anahtarla():
    """Tüm istenen kliplerin her karesine (±2 kare pay) kamera ve ortam anahtarları."""
    for klip in klipler:
        K = KM.KLIPLER[klip]
        for f in range(-2, K["kare"] + 2):
            g = K["bas"] + f
            st = KM.kamera(klip, f, D3)
            cs = kamera_kur(klip, f, st)
            q = cam.rotation_quaternion.copy()
            if onceki_q[0] is not None and onceki_q[0].dot(q) < 0:
                q.negate(); cam.rotation_quaternion = q
            onceki_q[0] = q
            cam.keyframe_insert("location", frame=g); cam.keyframe_insert("rotation_quaternion", frame=g)
            cd.keyframe_insert("lens", frame=g); cd.keyframe_insert("clip_start", frame=g); cd.keyframe_insert("clip_end", frame=g)
            o = ortam(klip, f, st)
            for k_, v_ in o.items():
                if k_ == "gunes_renk":
                    gl.color = v_; gl.keyframe_insert("color", frame=g)
                else:
                    sc[k_] = float(v_); sc.keyframe_insert(f'["{k_}"]', frame=g)
            # pozlama: uzayda +uzay_ev (d1'de Sahra en parlak pikseli kuralı ölçülerek); geçiş eğrisi pozlama() (C turu)
            sc.view_settings.exposure = pozlama(st["irtifa"])
            sc.view_settings.keyframe_insert("exposure", frame=g)
            GOK.altitude = float(min(max(st["irtifa"], 0.0), 59000.0))
            GOK.keyframe_insert("altitude", frame=g)
            for k_ in ("parlama", "perde"):
                if k_ in OB:
                    par = OB[k_]
                    dist = cs * 1.6
                    par.location = (0, 0, -dist)
                    s_ = dist * math.tan(math.atan(KM.SENSOR / 2 / st["lens"])) * 1.15
                    par.scale = (s_, s_, 1)
                    par.keyframe_insert("location", frame=g); par.keyframe_insert("scale", frame=g)
            # C turu: tam saydam (katsayı ≈ 0) perde ve yerel bulut katmanları render'dan çıkar. Saydam yüzeyler de
            # Cycles'ta saydam sekme sayıp örnekleme dizisini kaydırıyordu → t23 son kareleri l3 ile aynı sahne olsun
            # (sabit tohumla gürültü birebir). Görüntüye etkisi yok (katsayı 0'ken ikisi de tümüyle saydam).
            if "perde" in OB:
                OB["perde"].hide_render = o["perde_k"] < 1e-4
                OB["perde"].keyframe_insert("hide_render", frame=g)
            for ob_ in YEREL_BULUT:
                ob_.hide_render = o["yerel_bulut_k"] <= 0.0
                ob_.keyframe_insert("hide_render", frame=g)
            yk = st["irtifa"] < 40e3          # OSM yakın alan 40 km üstünde < 1 px: gizli (l2 ≡ t23[0] özdeş kalsın)
            for k_ in ("bina", "sera", "salon", "isiklik", "zemin", "yol", "arac", "agac", "kent", "cati"):
                if k_ in OB:
                    OB[k_].hide_render = not yk
                    OB[k_].keyframe_insert("hide_render", frame=g)
            if "dunya" in OB:
                gor = st["irtifa"] > 1500.0
                for k_ in ("dunya", "bulut", "atmosfer"):
                    OB[k_].hide_render = not gor
                    OB[k_].keyframe_insert("hide_render", frame=g)


# ------------------------------------------------------------------ JSON fragmanları (brief §9.3)
# E turu (brief §12.2, §12.4-9): p2 = 12 emanet alanı (src/lib/emanet.ts; ad yazılmaz) + Antalya künyesi; atlas
# etiketleri (Akdeniz, Anadolu, Kıbrıs) kalktı.
EMANET = emanet_oku()
KUNYE_SSR = "9–20 Kasım 2026"
# numaranın çekirdek merkezine göre video px ofseti (dikey ve yatayda aynı ölçek); dx < 0 → numara solda (bitişi çekirdeğe
# 10 px). Çakışanlar (l2 kare 0, dikey px): 05↔Antalya 10,2, 05↔Expo 13,5, 06↔07 44,2, 04↔05 52,5.
EMANET_OFSET = {4: (-10.0, -6.0), 5: (-10.0, 0.0), 6: (10.0, 0.0), 7: (-10.0, 0.0)}
CAPALAR = {
    "p1": {"Antalya": (36.8969, 30.7133, 30.0)},
    "p2": {**{f"Emanet {e['no']:02d}": (e["lat"], e["lng"], 0.0) for e in EMANET},
           "Antalya": (36.8969, 30.7133, 30.0)},
    "p3": {"Antalya Expo Center": None, "D400": None, "Antalya": (36.8890, 30.7050, 60.0),
           "Antalya Körfezi": (36.8434, 30.6543, 0.0), "Beydağları": None},     # B: körfez çapası dikey kırpımın içinde
}


def p3_capalari():
    st = KM.kamera("l3", 0, D3)
    sx_, sy_ = OSM["salon_merkez"]
    c = {"Antalya Expo Center": np.array([sx_, sy_, OSM["salon_cati_z"] + 2.0])}
    # D400: dikey kırpımda (x 480–1440), alt metin bandının hemen üstünde (y %60–67) görünen en alçak D400 noktası
    # (B: 35 mm kadrajda en yakın nokta y %79'a, banda düşüyordu)
    best = None
    for ln in OSM["d400"]:
        for x, y in ln:
            p = np.array([x, y, yer_z(x, y) + 1.0])
            u, v, on = KM.projeksiyon(st["C"], st["B"], st["lens"], p)
            if on and 480 < u < 1440 and 1150 < v < 1290:
                if best is None or v > best[0]:
                    best = (v, p)
    if best is not None:
        c["D400"] = best[1]
    # Beydağları: batı-güneybatıda (29,9–30,6 D, 36,3–36,9 K) ekranda görünen en yüksek DEM noktası
    hb = AR_H
    xs = AR_XS
    J, I = np.meshgrid(np.arange(AR_N), np.arange(AR_N))
    X = xs[J]; Y = xs[::-1][I]
    lat, lon = geo.eqc_latlon(X, -Y)
    msk = (lon > 29.9) & (lon < 30.62) & (lat > 36.3) & (lat < 36.95) & (hb > 600)
    idx = np.argsort(hb[msk])[::-1][:400]
    lat_s, lon_s, h_s = lat[msk][idx], lon[msk][idx], hb[msk][idx]
    for la_, lo_, h_ in zip(lat_s, lon_s, h_s):
        p = geo.latlon_enu(la_, lo_, h_)
        u, v, on = KM.projeksiyon(st["C"], st["B"], st["lens"], p)
        if on and 0 < u < 1920 and 0 < v < 1920:
            c["Beydağları"] = p
            break
    for ad in ("Antalya", "Antalya Körfezi"):
        la_, lo_, h_ = CAPALAR["p3"][ad]
        c[ad] = geo.latlon_enu(la_, lo_, h_)
    return st, c


def disari_aktar():
    os.makedirs(CIKIS, exist_ok=True)
    for klip in klipler:
        K = KM.KLIPLER[klip]
        n = K["kare"]
        kad, kam, dR, dC = [], [], [], []
        for f in range(n):
            st = KM.kamera(klip, f, D3)
            kad.append(round(KM.kadraj_m(st), 1))
            q = KM.quat_from_basis(st["B"])
            kam.append({"poz": [round(float(x), 3) for x in st["C"]], "quat": [round(float(x), 7) for x in q],
                        "lens": round(st["lens"], 4), "irtifa_m": round(st["irtifa"], 1), "hedef": [round(x, 6) for x in st["G"]],
                        "uzaklik_m": round(st["d"], 2), "heading": round(st["h"], 4), "pitch": round(st["p"], 4)})
            if klip == "t01":
                cx, cy, r, ww, hh_ = KM.disk(st["C"], st["B"], st["lens"])
                dR.append(round(r, 2)); dC.append([round(cx, 2), round(cy, 2)])
        js = {"ad": klip, "fps": KM.FPS, "kare": n, "sure": round(n / KM.FPS, 3), "master": [1920, 1920],
              "kaynak": "S1 dış sahne (scripts/blender/s1/sahne.py)", "gunes_utc": f"2026-11-09T{a.saat}Z",
              "kadraj_m": kad,
              "kadraj_tanimi": "dikey teslim genisligi (1080 master px) odak uzakliginda; uzayda disk olcegi (limb uzakligi), 4000-12000 km arasi ln karisim",
              "kamera": {"sensor_mm": KM.SENSOR, "cerceve": "Expo teget ENU metre (X dogu, Y kuzey, Z yukari), Dunya merkezi (0,0,-6371008.8)",
                         "quat_sirasi": "w,x,y,z (Blender kamera -Z bakar)", "kareler": kam}}
        if klip == "t01":
            js["dunyaR"] = dR; js["dunyaC"] = dC
            js["amblemDaire"] = {"cx": 960, "cy": 768, "r": 172.5}
        if klip == "t34a":
            T34 = K["toplam"]                       # F-B 60 (eski 72); S2 t34b = T34 − n kare
            pb = n - 3                              # parlama.py --bas (F-B 33: rampa 33–35)
            js["not"] = ((f"t34 = {T34} kare; S1 kare 0-{n - 1} (dis), S2 kare {n}-{T34 - 1} (ic). Parlama goruntu uzayinda "
                          f"(s1/parlama.py --bas {pb}): kare {pb}-{n - 1} rampa, kare {n - 1} tam #FFF1DC (S2 kare {n} ile birebir); "
                          f"%80+ beyaz kare t34'te <= 6 (S1 {pb}-{n - 1} + S2 {n}-{n + 2}).")
                         if a.profil == "fiske" else
                         ("t34 = 72 kare; S1 kare 0-47 (dis), S2 kare 48-71 (ic). Parlama goruntu uzayinda (s1/parlama.py --bas 38): kare 38'den "
                          "rampa, 44-47 ort. parlaklik >= %92, kare 47 tam #FFF1DC (S2 kare 48 ile birebir)."))
            js["toplam_kare_t34"] = T34
            # K (t34-birlestir.py, fragman.mjs, kodla.mjs) t34a'nın uzunluğunu "kare"dan okur: S1 t34a k_0000…k_{n−1} →
            # t34 0…n−1, S2 t34b k_0000… → t34 n… (t34b.json "t34_ofset" = n olmalı). Kesme (iki sahnenin birleştiği
            # kare çifti) ikisi de tam #FFF1DC: n−1 ↔ n. KIRPIM_Y t34 basamağı {k0: n−1, k1: n} (brief §13.5).
            js["t34_kare"] = [0, n - 1]
            js["kesme"] = {"s1_son_kare": n - 1, "s2_ilk_kare": n, "t34b_t34_ofset": n, "ton": "#FFF1DC",
                           "parlama_bas": pb if a.profil == "fiske" else 38,
                           "kirpim_y_t34": {"bas": 200, "son": 420, "k0": n - 1, "k1": n},
                           "not": (f"S1 t34a son karesi (t34 {n - 1}) ve S2 t34b ilk karesi (t34 {n}) tam #FFF1DC, fark 0; "
                                   f"t34a[{n - 1}] kamera durumu = eski (E) t34a[47] (isiklik bandi, ~{KM.kamera('t34a', n - 1, D3)['irtifa']:.0f} m)")}
        if klip in ("t01", "t12", "t23", "t34a"):
            js["f_turu"] = {"profil": a.profil, "t34a_kip": a.t34a_kip if klip == "t34a" else None,
                            "fiske_a_s": KM.FISKE_A, "fiske_k": KM.FISKE_K[klip],
                            "fiske_m": KM.FISKE_M.get(klip, 1.0), "kare": n,
                            "ilerleme": [round(KM.ilerleme(klip, f)[0], 6) for f in range(n)],
                            "not": ("ln d ilerlemesi s = fiske(t) (kamera.py); aci/yon/lens/hedef pencereleri s'ye bagli; "
                                    "uc kareler E turu ile bit duzeyinde ayni")}
            if klip == "t34a" and a.profil == "fiske":
                js["f_turu"].update({"bekle_kare": KM.T34A_BEKLE,
                                     "eski_kare": [round(KM.ilerleme(klip, f)[1], 4) for f in range(n)]})
                if a.t34a_kip == "kalkis":
                    js["f_turu"].update({"fiske_k": None, "fiske_m": None, "kalkis_us": KM.KALKIS_US,
                                         "not": ("t34a 'kalkis' (F-B): ln d ilerlemesi g = kalkis(u) (kamera.py; fiske kalkisi 0,15 s "
                                                 "+ surekli ivmelenme t^us); kare 0-1 durgun (l3[0]); pencereler eski yolun ayni "
                                                 "g'deki karesinde (eski_kare); son kare eski kare 47 ile bit duzeyinde ayni")})
            if klip == "t23":
                js["f_turu"].update({"t23_bulut": T23_BULUT, "durgun_kare": KM.T23_DURGUN,
                                     "pencere_s": {"bas": KM.T23_H, "egim": KM.T23_P, "oy": [KM.T23_OY, 1.0], "lens": [KM.T23_LENS, 1.0]}})
        if klip in ("t23", "t34a"):
            js["c_turu"] = {
                "sabit_tohum_kareleri": sorted(SABIT.get(klip, ())), "tohum": 31,
                "tohum_notu": "bu kareler l3 ile ayni sabit tohumla (use_animated_seed=False), digerleri animasyonlu",
                "pozlama": ({"kip": a.poz, "egri_km_k": _PE, "exposure": a.exposure, "uzay_ev": a.uzay_ev,
                             "not": "pozlama = exposure + uzay_ev * k(irtifa); k Fritsch-Carlson, ln irtifa (poz_egri.py)"
                                    + ("; egri_f: 25-88 km dugumleri luma tabani %22,5 (F turu, bulutsuz)" if a.poz == "egri_f" else "")}
                            if a.poz in ("egri", "egri_f") else {"kip": "rampa", "rampa_m": list(POZ_RAMPA)}),
                "zaman": (({"T23_FA": KM.T23_FA, "T23_VARIS": KM.T23_VARIS, "perde_karesi": T23_PERDE,
                            "not": "kare T23_VARIS-83 kamera tam d3 (l3[0]); kare <= T23_FA B turu yolu"} if klip == "t23" else
                           {"T34A_F": KM.T34A_F, "T34A_BEKLE": KM.T34A_BEKLE,
                            "not": "kare 0-T34A_BEKLE tam d3 (l3[0]); ln d ilk T34A_F karede besinci derece baslangic"})
                          if a.profil == "eski" else
                          ({"durgun_kareler": [n - KM.T23_DURGUN, n - 1],
                            "not": f"F turu: kare {n - KM.T23_DURGUN}-{n - 1} kamera tam d3 (l3[0]); zaman egrisi f_turu.ilerleme"}
                           if klip == "t23" else
                           {"T34A_BEKLE": KM.T34A_BEKLE,
                            "not": f"F turu: kare 0-{KM.T34A_BEKLE} tam d3 (l3[0]); kare {n - 1} = eski kare 47; zaman egrisi f_turu.ilerleme"})),
            }
        # poster çapaları (döngünün 0. karesi, master px)
        poster = {"l1": "p1", "l2": "p2", "l3": "p3"}.get(klip)
        if poster:
            st = KM.kamera(klip, 0, D3)
            if poster == "p3":
                st, pts = p3_capalari()
            else:
                pts = {k: geo.latlon_enu(*v) for k, v in CAPALAR[poster].items()}
            # anahtarlar W'nin şemasındaki kimlikler (docs/klipler-sema.md §3); görünen adlar capa_adlari'nda
            KIMLIK = {"Antalya": "antalya", "Antalya Expo Center": "expo", "D400": "d400", "Antalya Körfezi": "korfez",
                      "Beydağları": "beydaglari", **{f"Emanet {e['no']:02d}": f"emanet{e['no']:02d}" for e in EMANET}}
            cap, adlar = {}, {}
            for ad, p in pts.items():
                if p is None:
                    continue
                u, v, on = KM.projeksiyon(st["C"], st["B"], st["lens"], p)
                if not on:
                    continue
                cap[KIMLIK[ad]] = [round(float(u), 1), round(float(v), 1)]
                adlar[KIMLIK[ad]] = ad
            js["capalar"] = cap
            js["capa_adlari"] = adlar
            js["capa_kirpim"] = {k: {"dikey": 420 <= v_[0] <= 1500, "yatay": 420 <= v_[1] <= 1500} for k, v_ in cap.items()}
            js["poster"] = poster
            # E turu etiketleri (brief §12.4-9 şeması; anahtarlar capalar ile aynı): d1/d11 Antalya künyesi, d2 12 emanet
            # (metin boş, ad yazılmaz) + Antalya künyesi. Görünür metin W'nin sözlüğünde; buradaki künye satırı SSR metni.
            et = {}
            if "antalya" in cap and poster in ("p1", "p2"):
                et["antalya"] = {"tur": "kunye", "metin": KUNYE_SSR}
            if poster == "p2":
                for e in EMANET:
                    k_ = f"emanet{e['no']:02d}"
                    if k_ not in cap:
                        continue
                    et[k_] = {"tur": "emanet", "no": e["no"], "donem": e["donem"], "metin": ""}
                    if e["no"] in EMANET_OFSET:
                        et[k_]["dx"], et[k_]["dy"] = EMANET_OFSET[e["no"]]
                js["etiket_ofset_notu"] = ("dx/dy: numaranin cekirdek merkezine gore video px ofseti (dikey ve yatay ayni); "
                                           "dx < 0 numara solda, cekirdege 10 px")
            if et:
                js["etiketler"] = et
        json.dump(js, open(os.path.join(CIKIS, f"{klip}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        log(f"{klip}.json", "kadraj", kad[0], "→", kad[-1], ("çapalar " + str(js.get("capalar"))) if poster else "")


disari_aktar()
if a.sadece_json:
    log("yalnız JSON"); sys.exit(0)

anahtarla()
if a.teshis_bulut_yok and "bulut" in OB:          # teşhis (S1b hale ölçümü): bulut kabuğu görünmez
    OB["bulut"].scale = (1e-4, 1e-4, 1e-4)

# ------------------------------------------------------------------ render ayarları
r = sc.render
r.resolution_x = r.resolution_y = a.res; r.resolution_percentage = 100
r.fps = KM.FPS
r.use_motion_blur = bool(a.mb); r.motion_blur_shutter = 0.5
r.dither_intensity = 1.0
r.film_transparent = False
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = "AgX - Punchy"
im = r.image_settings
im.media_type = "IMAGE"; im.file_format = "PNG"; im.color_mode = "RGB"; im.color_depth = derinlik; im.compression = 15
if a.engine == "CYCLES":
    r.engine = "CYCLES"
    pr = bpy.context.preferences.addons["cycles"].preferences
    pr.compute_device_type = "OPTIX"; pr.get_devices()
    for dv in pr.devices:
        dv.use = dv.type == "OPTIX"
    cy = sc.cycles
    cy.device = "GPU"; cy.samples = a.samples or 64
    cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.01; cy.adaptive_min_samples = 16
    cy.use_denoising = True; cy.denoiser = "OPENIMAGEDENOISE"; cy.denoising_use_gpu = True
    cy.seed = 31; cy.use_animated_seed = True
    cy.max_bounces = 6; cy.volume_bounces = 0; cy.transparent_max_bounces = 24
    r.use_persistent_data = True
else:
    r.engine = "BLENDER_EEVEE"
    ee = sc.eevee
    ee.taa_render_samples = a.samples or 16
    ee.use_shadows = True; ee.shadow_ray_count = 2; ee.shadow_step_count = 6
    # önizlemenin Cycles'a yaklaşması için: ekran-uzayı ışın izleme + hızlı GI, 16× anizotropik doku süzgeci
    ee.use_raytracing = bool(a.ee_rt)
    ee.ray_tracing_method = "SCREEN"
    ee.use_fast_gi = bool(a.ee_rt)
    ee.fast_gi_method = "GLOBAL_ILLUMINATION"
    ee.shadow_pool_size = "512"
    ee.motion_blur_steps = 1
    try:
        bpy.context.preferences.system.anisotropic_filter = "FILTER_16"
    except Exception as e:
        log("anizotropik", e)
emisyon_ornekleme(a)

if a.blend:
    bpy.ops.wm.save_as_mainfile(filepath=a.blend, compress=False)
    log("blend", a.blend)


def kare_listesi(klip):
    n = KM.KLIPLER[klip]["kare"]
    if not KARELER:
        return list(range(n))
    out = KARELER.get(klip, KARELER.get(None, []))
    return [f for f in out if 0 <= f < n]


def sabit_tohum_mu(klip, f):
    """Döngüler hep sabit tohum (B); geçişlerde --sabit_tohum kareleri (C: kamera durgun → l3 ile aynı gürültü)."""
    return KM.KLIPLER[klip]["tur"] == "dongu" or f in SABIT.get(klip, ())


t_kur = time.perf_counter() - T0
log(f"kurulum {t_kur:.1f} sn")
olcum = []
KILIT = "D:/soft/cop31-varlik/render/.gpu-kilit"


def kilit_al(klip):
    """Orkestratör kuralı: os.mkdir atomik; sahip.txt (ajan, klip, zaman); 10 sn'de bir dene; 45 dk'dan eski ölü."""
    t0 = time.time()
    while True:
        try:
            os.mkdir(KILIT)
            with open(os.path.join(KILIT, "sahip.txt"), "w", encoding="utf-8") as fh:
                fh.write(f"S1 {klip} {time.strftime('%Y-%m-%dT%H:%M:%S')} {time.time():.0f}\n")
            return time.time() - t0
        except FileExistsError:
            try:
                t_ = float(open(os.path.join(KILIT, "sahip.txt"), encoding="utf-8").read().split()[-1])
                if time.time() - t_ > 2700:
                    log("KILIT ölü sayıldı (45 dk), siliniyor")
                    import shutil; shutil.rmtree(KILIT, ignore_errors=True)
                    continue
            except Exception:
                pass
            time.sleep(10)


def kilit_birak():
    import shutil
    shutil.rmtree(KILIT, ignore_errors=True)


for klip in klipler:
    K = KM.KLIPLER[klip]
    kd = os.path.join(CIKIS, klip, "ham") if klip in a.ham.split(",") else os.path.join(CIKIS, klip)
    os.makedirs(kd, exist_ok=True)
    r.motion_blur_shutter = DEKLANSOR.get(klip, 0.5)
    if a.engine == "CYCLES":
        cy.samples = a.samples or ORNEK.get(klip, 64)
        # döngülerde sabit tohum: durağan piksellerin gürültüsü kareden kareye aynı kalır (l3'te animasyonlu tohumla
        # ardışık fark 2,42/255 ölçüldü — köpüren gürültü); geçişlerde animasyonlu tohum
        cy.use_animated_seed = KM.KLIPLER[klip]["tur"] != "dongu"
    bekle = kilit_al(klip) if a.kilit else 0.0
    if a.kilit:
        log(f"KILIT alındı {klip}: {bekle:.0f} sn beklendi")
    tk0 = time.perf_counter()
    try:
        for f in kare_listesi(klip):
            sabit = sabit_tohum_mu(klip, f)
            if a.engine == "CYCLES":
                cy.use_animated_seed = not sabit
            sc.frame_set(K["bas"] + f)
            r.filepath = os.path.join(kd, f"k_{f:04d}")
            t1 = time.perf_counter()
            bpy.ops.render.render(write_still=True)
            dt = time.perf_counter() - t1
            if a.exr:
                # doğrusal sahne değerleri (görünüm dönüşümü ve pozlama uygulanmaz) → pozlama eğrisi çevrimdışı tasarlanır
                im.file_format = "OPEN_EXR"; im.color_depth = "16"; im.exr_codec = "ZIP"
                bpy.data.images["Render Result"].save_render(os.path.join(kd, f"k_{f:04d}.exr"), scene=sc)
                im.file_format = "PNG"; im.color_depth = derinlik
            olcum.append({"klip": klip, "kare": f, "sn": round(dt, 3), "kilit_bekleme_sn": round(bekle, 1),
                          "pozlama": round(sc.view_settings.exposure, 5), "sabit_tohum": sabit})
            print(f"[KARE] {klip} {f:4d} {dt:6.2f} sn  poz {sc.view_settings.exposure:.4f}  tohum {'sabit' if sabit else 'anim'}",
                  flush=True)
    finally:
        if a.kilit:
            kilit_birak()
            log(f"KILIT bırakıldı {klip}: klip {time.perf_counter() - tk0:.0f} sn")
if a.olcum:
    with open(a.olcum, "a", encoding="utf-8") as fh:
        for o in olcum:
            o.update({"engine": a.engine, "res": a.res, "samples": a.samples or (ORNEK.get(o["klip"], 64) if a.engine == "CYCLES" else 16),
                      "deklansor": DEKLANSOR.get(o["klip"], 0.5), "yakin": a.yakin,
                      "saat": a.saat, "kurulum_sn": round(t_kur, 1)})
            fh.write(json.dumps(o) + "\n")
log("bitti")
