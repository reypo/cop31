"""S2 iç sahne: fuar holü + "12.000 Yıllık Emanet" standı + rotunda + karşılama bankosu (tek sahne).
Bağlayıcı belge: docs/brief-icinden-3.md §9 (+ §2.3 d3–d5 kartları = yeni d4–d6, §3.4 stant tablosu).

Klipler (§9.1 numaralandırması; R3 kart adları parantezde):
  t34b  t34 kare 36–59 (24; E: 48–71): çatı ışıklığı parlamasından hole, makasların altından inip patlatılmış standa (R3 T23 sonu)
  l4    120 kare döngü: patlatılmış stant, parçalar ±1,5 cm salınır (R3 L3)          p4 = l4[0]
  t45   60 kare: montaj koreografisi + vinçten rotundaya kavisli iniş (R3 T34)
  l5    120 kare döngü: rotunda içi, "Bugün" tepe ışığı ±%6 nefes (R3 L4)            p5 = l5[0]
  E turu (brief §12.3; durak numaraları §12.1):
  t56   60 kare (2,0 s, deklanşör 0,35): P5 → baş kalkar → 120° sütun aralığı → poz A (d6, arka duvar)
  p6    "son-kare" poster = t56 master son karesi (ayrı render yok; son.sh kopyalar, p6.json tip "son-kare")
  t67   48 kare (1,6 s): poz A → poz B (d7, sol duvar); 0,54 m kayma + 62° sola pan
  p7    "son-kare" poster = t67 son karesi
  t78   66 kare (2,2 s): B → totem ile batı duvarı arası → Dn → eski t56 kuyruğu (banko_kamera; E → son, 85 mm);
        son karede broşür dikdörtgeni; son kare ≡ eski t56[71] (§12.6)
  p8    banko plakası = eski p6 plakası (yeniden render yok; render-son/p8, p8.json tip "plaka"; --yigin 0)
  olcum-hol / olcum-rotunda / olcum-banko: Cycles ölçüm kareleri (2'şer)
  --carpisma: render yok; t56/t67/t78 kamera yollarının nesne gruplarına en küçük uzaklığı (BVH, kare başına 8 alt örnek)
  F turu (brief §13, "fiske" geçişleri): --profil fiske (varsayılan) | eski (E turu, izlenebilirlik: E süreleri ve E kare
        numaraları). İlerleme ortak.py fiske(u, a, k) (ilk 0,15 s beşinci derece kalkış + ease-out 1 − (1 − u)^k; k klip başına
        FISKE_K_KLIP); açı / yön / lens / ışık / montaj pencereleri ilerlemeye (s) bağlı (T56_PEN, T67_PEN, T78_PEN; --pen ile
        deneme). F-B süreleri (§13.5, kuyruk kısaltması): t34b t34 kare 36–59 (24), t45 54, t56 54, t67 48, t78 60 kare
        (SON_KARE). t34b: ilk 3 kare parlamanın içinde hızlı (t34b_s), parlama 36–38. t45: yay ilerlemesi fiske, montaj aynı
        eğriyle sıkıştırılır (montaj_kur), eğim gecikmesi ilerleme biriminde + son 8 karede devir (T45_GECIKME). t56: aşırtmalı
        yol (G2 → A'nın güneybatısı → A'ya yaklaşarak iniş; T56_FISKE). t67: A → C → B "duvara yakınlaşma". t78: kuyruk düşey
        iniş (T78_KUYRUK_FISKE). Uç kareler E ile bire bir (l4[0], l5[0], p6, p7, eski t56[71]). JSON: kare kare `ilerleme`.
  --kamera_dok DOSYA: render yok; iki profilin kare kare kamera durumu + kadraj kenarı ışın dökümü (ölçüm: scratchpad f-s2/profil.py)

B turu (orkestratör kararları): EEVEE 1920² TAA 64 son render (son.sh), patlatma ×1,6, P4 14 mm / 11 m, "fuar holü"
(komşu stant fasya + ışık kutuları, kablo tavaları, hol dolgusu), broşür 0,708 + kapak-dom.png (AgX ön telafisi: renk.py),
bal meşesi, broşür vurgu spotu. Ölçüm: olc.py, son_olcum.py; maske: --maske (Workbench malzeme kimliği).

Çalıştırma (Blender 5.2.3):
  blender.exe -b --factory-startup -P scripts/blender/s2/sahne.py -- --klip l4 [--onizleme] [--engine CYCLES]
      [--kareler 0-119 | 0,30,60] [--out DIZIN] [--json] [--blend yol.blend] [--kilit] [--kok DIZIN] [--maske]
      [--kalibre beyaz|siyah]
Çıktı: <kok>/<klip>/k_%04d.png + <kok>/<klip>.json; kok varsayılanı D:/soft/cop31-varlik/render-son (A turu: render).
t34b ham/'a t34 kare numarasıyla yazılır (F-B: 0036–0059; E: 0048–0071); parlama.py (F-B: kare 36–38, #FFF1DC, görüntü
uzayında) çıktıyı 0'dan numaralar (k_0000 = t34 kare 36; t34b.json t34_ofset).

Koordinat: metre; stant merkezi orijin, X doğu (plan sağı), Y kuzey (plan üstü = arka), Z yukarı; stant zemini
Z0 = 0,05. Plan yüzdeleri docs/stant-icerik.md §5'ten, 15,0 × 9,9 m varsayımıyla (V, AREA SIZE ONAY).
"""
import bpy, bmesh, sys, os, math, json, time, random
from mathutils import Vector, Matrix, Euler, Quaternion
from bpy_extras.object_utils import world_to_camera_view

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ortak as O
from ortak import srgb

T_BASLA = time.perf_counter()

KLIPLER = {
    # ad: (ilk kare, son kare (dahil), tür). t34b / t45 / t56 / t67 / t78 profil_kur() ile (SON_KARE; aşağıdaki E değerleri)
    "t34b": (48, 71, "gecis"),     # F-B: t34 kare 36–59
    "l4": (0, 119, "dongu"),
    "p4": (0, 0, "poster"),
    "t45": (0, 59, "gecis"),       # F-B: 54 kare (0–53)
    "l5": (0, 119, "dongu"),
    "p5": (0, 0, "poster"),
    "t56": (0, 59, "gecis"),       # E: 2,0 s; P5 → poz A (d6). F-B: 54 kare
    "p6": (0, 0, "son-kare"),      # = t56 son karesi (F-B: t56[53])
    "t67": (0, 47, "gecis"),       # E / F-B: 1,6 s; A → B (d7)
    "p7": (0, 0, "son-kare"),      # = t67[47]
    "t78": (0, 65, "gecis"),       # E: 2,2 s; B → banko; son kare ≡ eski t56[71]. F-B: 60 kare (0–59)
    "p8": (0, 0, "plaka"),         # eski p6 plakası (t78 son karesinin kamerası, üstteki broşür gizli)
    "olcum-hol": (0, 1, "olcum"),
    "olcum-rotunda": (0, 1, "olcum"),
    "olcum-banko": (0, 1, "olcum"),
}


def ek_arg(p):
    p.add_argument("--klip", required=True, choices=list(KLIPLER))
    p.add_argument("--kareler", default="")
    p.add_argument("--json", action="store_true")
    p.add_argument("--yalniz_json", action="store_true")   # render yok, yalnız <klip>.json
    p.add_argument("--yigin", type=int, default=-1)  # p8: 1 → üstteki broşür hariç yığın kalır; 0 → yığın yok (−1: p8'de 0)
    p.add_argument("--bitki", type=int, default=1)
    p.add_argument("--p4_genislik", type=float, default=1.20)   # patlatılmış stant / dikey kadraj genişliği (B: ~%120)
    p.add_argument("--p4_egim", type=float, default=0.0)        # d4 eğimi (derece, aşağı negatif); 0 → --p4_genislik ile çöz
    p.add_argument("--p4_lens", type=float, default=14.0)       # B kararı 2: 14 mm, kamera 11 m
    p.add_argument("--patlama", type=float, default=1.6)        # patlatma ofsetleri çarpanı (B kararı 2: ×1,6)
    p.add_argument("--kok", default="D:/soft/cop31-varlik/render-son")   # çıktı kökü (B: render-son; render\ önizlemeye dokunma)
    p.add_argument("--kapak", default="")                       # kapak dokusu; boş → kapak-dom-komp.png varsa o, yoksa kapak-dom.png
    p.add_argument("--kalibre", default="", choices=["", "beyaz", "siyah"])   # kapak kalibrasyonu: düz beyaz / siyah albedo
    p.add_argument("--maske", action="store_true")              # Workbench malzeme kimliği maskesi (ölçüm)
    p.add_argument("--isik_carp", type=float, default=0.0)      # tüm lambaların enerji çarpanı; 0 → motora göre (EEVEE 1,0 / Cycles 0,45)
    # E turu (brief §12.3)
    p.add_argument("--yikama_w", type=float, default=260.0)     # duvar yıkama spotu gücü (W, EEVEE; CARP uygulanır); önizlemede ayarlanır
    p.add_argument("--yikama_golge", type=float, default=1.0)   # yıkama spotu gölge çözünürlük ölçeği (VRAM geri dönüşü §12.7-9: 0,5)
    p.add_argument("--ekran_g", type=float, default=2.0)        # "Sen de söz ver." ekranlarının emisyon gücü (kiosk ekranıyla aynı)
    p.add_argument("--t78_rampa", type=float, default=0.0)      # t78 zaman eğrisi: 0 easeInOutSine (eski t56); 0,3 → tepe hız −%9 (bulanıklık yedeği)
    p.add_argument("--carpisma", action="store_true")           # render yok: kamera yolu ↔ nesne en küçük uzaklık raporu
    p.add_argument("--carpisma_json", default="")               # rapor dosyası (boş → <kok>/_onizleme/s2-carpisma.json)
    # F turu (brief §13): kamera zaman profili. "eski" = E turu (easeInOutSine, E süreleri; izlenebilirlik ve uç kare
    # kanıtı), "fiske" = §13.1 (hızlı kalkış + uzun yumuşak iniş). t34b'de parlama/kalkış, t45–t78'de bütün kamera.
    p.add_argument("--profil", default="fiske", choices=["eski", "fiske"])
    p.add_argument("--fiske_k", type=float, default=0.0)          # ease-out kuvveti k ∈ [2; 3]; 0 → klip tablosu FISKE_K_KLIP
    p.add_argument("--fiske_a", type=float, default=O.FISKE_A_SN)  # beşinci derece kalkış süresi (s)
    p.add_argument("--montaj_c", type=float, default=1.0)         # t45 montaj sıkıştırması (fiske saatinde; 1 = aynı eğri; bkz. montaj_kur)
    p.add_argument("--pen", default="")                           # pencere/k deneme: JSON {"t56.phi1": [0, 0.5], "k.t67": 2.2, …}
    p.add_argument("--kamera_dok", default="")                    # render yok: iki profilin kare kare kamera + kenar ışın dökümü (JSON)


a = O.argumanlar(ek_arg)
KLIP = a.klip
# Cycles aynı lamba değerleriyle EEVEE'den belirgin parlak (dolaylı sekmeler; ölçüm s2-cycles-eevee-*.jpg) → motor
# başına lamba enerji çarpanı (emisyonlu yüzeyler hariç). --isik_carp ile elle.
CARP = a.isik_carp or (0.45 if a.engine == "CYCLES" else 1.0)

# ---- F turu (brief §13): profil başına son kare dizinleri. "eski" E turudur (t34b t34 kare 48–71, t45 60, t56 60, t67 48,
# t78 66 kare); "fiske" F-B kararı (§13.5 tablo: kuyruk kısaltması; t34a 36 kare olduğundan t34b t34 kare 36–59):
# KLIPLER, N_T*, T34B_BAS, POSTER_KAYNAK (p6/p7/p8 kaynak kareleri) buradan türer.
SON_KARE = {"eski": {"t34b_bas": 48, "t45": 59, "t56": 59, "t67": 47, "t78": 65},
            "fiske": {"t34b_bas": 36, "t45": 53, "t56": 53, "t67": 47, "t78": 59}}
PROFIL = a.profil
N_T45 = N_T56 = N_T67 = N_T78 = 0
T34B_BAS = 48        # t34b'nin ilk karesi t34 numarasıyla (= t34a kare sayısı; t34 kesmesi T34B_BAS − 1 ↔ T34B_BAS)
POSTER_KAYNAK = {}


def profil_kur(ad):
    """Profil değiştir (kamera fonksiyonları PROFIL ve N_T*'yi çağrı anında okur; --kamera_dok iki profili sırayla döker)."""
    global PROFIL, N_T45, N_T56, N_T67, N_T78, T34B_BAS, POSTER_KAYNAK
    PROFIL = ad
    n = SON_KARE[ad]
    N_T45, N_T56, N_T67, N_T78 = n["t45"], n["t56"], n["t67"], n["t78"]
    T34B_BAS = n["t34b_bas"]
    KLIPLER["t34b"] = (T34B_BAS, T34B_BAS + 23, "gecis")
    for k_ in ("t45", "t56", "t67", "t78"):
        KLIPLER[k_] = (0, n[k_], "gecis")
    # son-kare posterleri ve plaka: hangi klibin hangi karesi (sahne durumu o kareninki)
    POSTER_KAYNAK = {"p6": ("t56", N_T56), "p7": ("t67", N_T67), "p8": ("t78", N_T78), "olcum-banko": ("t78", N_T78)}


# k klip başına (§13.1: k ∈ [2; 3], varsayılan 2,4). Seçim ölçümle (scratchpad f-s2/rapor.md): döndürme ağırlıklı
# kliplerde (t56 baş kalkışı, t67 pan) k 2,2 = p(0,5) ≥ 0,75'i sağlayan en küçük k (S1 tanımıyla t56 0,762, t67 0,757; k 2,0
# → 0,73) — kalkış tepesi en düşük; t45 ve t78'de 2,4 (t78'de son 3 kare ≤ 6 / 3 / 0 px için).
FISKE_K_KLIP = {"t34b": 2.4, "t45": 2.4, "t56": 2.2, "t67": 2.2, "t78": 2.4}
PEN_EK = json.loads(a.pen) if a.pen else {}
for _k, _v in PEN_EK.items():
    if _k.startswith("k."):
        FISKE_K_KLIP[_k[2:]] = float(_v)


def fiske_k(klip):
    return a.fiske_k if a.fiske_k > 0 else FISKE_K_KLIP.get(klip, O.FISKE_K)


def ilerleme(f, n_son, klip=""):
    """F: fiske ilerlemesi p(f) (ortak.py; k = fiske_k(klip), kalkış --fiske_a s)."""
    return O.fiske_kare(f, n_son, a.fiske_a, fiske_k(klip), FPS)


def pen(tablo, ad, klip):
    """Pencere tablosu girdisi (--pen ile "klip.ad" üzerine yazılabilir)."""
    return tuple(PEN_EK.get(f"{klip}.{ad}", tablo[ad]))


def pencere(s, s0, s1):
    return O.clamp01((s - s0) / (s1 - s0))


profil_kur(PROFIL)
K0, K1, TUR = KLIPLER[KLIP]
if a.yigin < 0:
    a.yigin = 0 if KLIP == "p8" else 1   # C turu (§11.1 S2-C 2): plaka broşürsüz

# ================================================================== sabitler
W, DP = 15.0, 9.9
Z0 = 0.05
DUVAR_H, DUVAR_T, FASIA_ALT = 4.0, 0.12, 3.2
FPS = 30


def PX(px):
    return (px - 0.5) * W


def PY(py):
    return (0.5 - py) * DP


RC = Vector((PX(0.408), PY(0.424), Z0))   # rotunda merkezi (-1,38; 0,75)
R_KANOPI, R_SUTUN = 2.25, 2.10
SUTUN_W, SUTUN_D, SUTUN_H = 0.46, 0.10, 2.30
KANOPI_ALT, KANOPI_H = 2.80, 0.60
BANKO_C = Vector((PX(0.1445), PY(0.9325), Z0))   # (-5,33; -4,28)
BANKO_W, BANKO_D, BANKO_H = 1.60, 0.62, 1.05
# B kararı 4: broşür oranı 0,708 (DOM kapağıyla aynı; W'nin kapak-dom.png'si 1600 × 2259); 148,7 × 210 mm
BROSUR_H, BROSUR_T, BROSUR_N = 0.210, 0.0003, 40
BROSUR_W = BROSUR_H * 0.708
DOKU = O.VARLIK + "/s2/doku/"
PH = O.VARLIK + "/s2/polyhaven/"
FONT = O.VARLIK + "/font/"
LOGO = "D:/soft/cop31/public/brand/logo-genclik-kollari.png"
KAPAK_DOM = DOKU + "kapak-dom.png"
KAPAK_KOMP = DOKU + "kapak-dom-komp.png"     # AgX ön telafili (renk.py): render'da DOM kapağın tonları
KAPAK = a.kapak or (KAPAK_KOMP if os.path.exists(KAPAK_KOMP) else KAPAK_DOM)
P4_LENS = a.p4_lens
T56_ESKI_SON = 71        # D turu t56'sının son karesi (72 kare): banko_kamera(ESKI_T56) — p8 plakası, t78 sonu ≡ bu kare
# E turu son kare dizinleri (60 / 48 / 66 kare) ve POSTER_KAYNAK: F'den beri profil_kur() (SON_KARE tablosu)
# E turu duvar baskıları (brief §12.3): iç yüz düzlemleri ve doku dosyaları (S2a, dokular.mjs, 500 px/m)
Y_ARKA_IC = DP / 2 - DUVAR_T          # 4,83: arka_kapali iç yüzü (güneye bakar)
X_SOL_IC = -W / 2 + DUVAR_T           # −7,38: sol_kapali iç yüzü (doğuya bakar)
Y_ON_DIS = -DP / 2                    # −4,95: on_kapali dış yüzü (güneye bakar)
BASKI_T = 0.005                       # baskı paneli kalınlığı (5 mm)
DUVAR_DOKU = {"arka": "duvar-arka.png", "sol": "duvar-sol.png", "ekran": "ekran-soz.png", "cephe": "cephe-on.png"}
# poz A (d6, arka duvar) ve poz B (d7, sol duvar): brief z'leri stant zemininden (Z0) ölçülü (P5 gibi)
POZ_A = {"konum": Vector((-4.30, 1.90, Z0 + 1.55)), "psi": -18.0, "phi": 4.0, "lens": 18.0}
POZ_B = {"konum": Vector((-4.75, 1.60, Z0 + 1.55)), "psi": -80.0, "phi": 4.0, "lens": 18.0}
DEKLANSOR_E = 0.35                    # t56 / t67 / t78 (eski t56 ile aynı; t78 son karesi ≡ eski t56[71])
O.RENDER = a.kok

random.seed(31)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS
prefs = bpy.context.preferences
prefs.edit.keyframe_new_interpolation_type = "LINEAR"

COL = {}
for ad in ("hol", "stant", "isik", "kamera"):
    c = bpy.data.collections.new(ad)
    sc.collection.children.link(c)
    COL[ad] = c

# ================================================================== malzemeler
MAT = {}


def m_principled(ad, renk, rough=0.5, metal=0.0, spec=0.5, emis=None, emis_g=0.0, coat=0.0, bump=None):
    m = bpy.data.materials.new(ad)
    d = O.D(m.node_tree)
    out = d("ShaderNodeOutputMaterial")
    bs = d("ShaderNodeBsdfPrincipled")
    bs.inputs["Base Color"].default_value = (*renk, 1)
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Metallic"].default_value = metal
    bs.inputs["Specular IOR Level"].default_value = spec
    bs.inputs["Coat Weight"].default_value = coat
    if emis is not None:
        bs.inputs["Emission Color"].default_value = (*emis, 1)
        bs.inputs["Emission Strength"].default_value = emis_g
    if bump:  # (ölçek, güç) gürültü tümseği: boya / kumaş dokusu
        tc = d("ShaderNodeTexCoord")
        nz = d("ShaderNodeTexNoise", i_Scale=bump[0], i_Detail=6.0)
        d.b(tc.outputs["Object"], nz.inputs["Vector"])
        bp = d("ShaderNodeBump", i_Strength=bump[1], i_Distance=0.002)
        d.b(nz.outputs["Fac"], bp.inputs["Height"])
        d.b(bp.outputs["Normal"], bs.inputs["Normal"])
    d.b(bs.outputs[0], out.inputs[0])
    MAT[ad] = m
    return m


def m_pbr(ad, klasor, olcek, ton=(1, 1, 1), doygunluk=1.0, parlaklik=1.0, rough_carp=1.0, rough_ek=0.0, nor_guc=1.0, ek_kok=None):
    """Poly Haven PBR (diff/nor_gl/rough). UV metre cinsinden; olcek = 1 / dokunun gerçek boyu (m)."""
    m = bpy.data.materials.new(ad)
    d = O.D(m.node_tree)
    out = d("ShaderNodeOutputMaterial")
    bs = d("ShaderNodeBsdfPrincipled")
    tc = d("ShaderNodeTexCoord")
    mp = d("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (olcek, olcek, olcek)
    d.b(tc.outputs["UV"], mp.inputs["Vector"])
    p = PH + klasor + "/" + klasor
    dif = d.resim(p + "_diff_2k.jpg", True, vec=mp.outputs[0])
    nor = d.resim(p + "_nor_gl_2k.jpg", False, vec=mp.outputs[0])
    rg = d.resim(p + "_rough_2k.jpg", False, vec=mp.outputs[0])
    hsv = d("ShaderNodeHueSaturation", i_Saturation=doygunluk, i_Value=parlaklik)
    d.b(dif.outputs["Color"], hsv.inputs["Color"])
    tint = d.karistir(1.0, hsv.outputs["Color"], ton, blend="MULTIPLY")
    d.b(tint, bs.inputs["Base Color"])
    r1 = d.math("MULTIPLY", rg.outputs["Color"], rough_carp)
    r2 = d.math("ADD", r1, rough_ek, clamp=True)
    d.b(r2, bs.inputs["Roughness"])
    nm = d("ShaderNodeNormalMap", i_Strength=nor_guc)
    d.b(nor.outputs["Color"], nm.inputs["Color"])
    d.b(nm.outputs["Normal"], bs.inputs["Normal"])
    d.b(bs.outputs[0], out.inputs[0])
    MAT[ad] = m
    return m


def m_doku(ad, yol, rough=0.6, emis_g=0.0, alfa=False, uzanti="EXTEND", spec=0.4, koyu_carp=1.0, coat=0.0):
    """Baskı / ekran dokusu (UV 0..1)."""
    m = bpy.data.materials.new(ad)
    d = O.D(m.node_tree)
    out = d("ShaderNodeOutputMaterial")
    bs = d("ShaderNodeBsdfPrincipled")
    tx = d.resim(yol, True, uzanti=uzanti, interp="Cubic")
    col = tx.outputs["Color"]
    if koyu_carp != 1.0:
        col = d.karistir(1.0, col, (koyu_carp,) * 3, blend="MULTIPLY")
    d.b(col, bs.inputs["Base Color"])
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Specular IOR Level"].default_value = spec
    bs.inputs["Coat Weight"].default_value = coat
    if emis_g > 0:
        d.b(tx.outputs["Color"], bs.inputs["Emission Color"])
        bs.inputs["Emission Strength"].default_value = emis_g
    if alfa:
        d.b(tx.outputs["Alpha"], bs.inputs["Alpha"])
        m.surface_render_method = "DITHERED"
    d.b(bs.outputs[0], out.inputs[0])
    MAT[ad] = m
    return m


def m_emis(ad, renk, guc):
    m = bpy.data.materials.new(ad)
    d = O.D(m.node_tree)
    out = d("ShaderNodeOutputMaterial")
    em = d("ShaderNodeEmission", i_Strength=guc)
    em.inputs["Color"].default_value = (*renk, 1)
    d.b(em.outputs[0], out.inputs[0])
    MAT[ad] = m
    return m


YEDEK_DOKU = []   # bulunamayıp düz renkle kurulan doku dosyaları (son.sh bunlarla son render'ı reddeder)


def m_baski(ad, dosya, yedek_hex, emis_g=0.0, **kw):
    """E turu duvar baskısı / ekran (S2a dokuları, DOKU altında). Dosya yoksa düz renkli geçici malzeme (uyarıyla)."""
    yol = DOKU + dosya
    if os.path.exists(yol):
        return m_doku(ad, yol, emis_g=emis_g, **kw)
    print(f"[UYARI] doku yok: {yol} → düz {yedek_hex} (geçici; S2a üretince gerçeği kullanılır)", flush=True)
    YEDEK_DOKU.append(dosya)
    renk = srgb(yedek_hex)
    return m_principled(ad, renk, rough=kw.get("rough", 0.6), spec=kw.get("spec", 0.4), coat=kw.get("coat", 0.0),
                        emis=renk if emis_g > 0 else None, emis_g=emis_g)


def kelvin(k):
    """Kelvin → doğrusal RGB (Tanner Helland yaklaşımı, sRGB → doğrusal)."""
    t = k / 100.0
    r = 255 if t <= 66 else 329.698727446 * (t - 60) ** -0.1332047592
    g = 99.4708025861 * math.log(t) - 161.1195681661 if t <= 66 else 288.1221695283 * (t - 60) ** -0.0755148492
    b = 255 if t >= 66 else (0 if t <= 19 else 138.5177312231 * math.log(t - 10) - 305.0447927307)
    c = [min(255, max(0, x)) / 255 for x in (r, g, b)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


# temel malzemeler
m_principled("boya_beyaz", srgb("#E8E5DF"), rough=0.78, spec=0.35, bump=(140.0, 0.04))
# komşu stantlar (B kararı 3): sade, açık-orta gri boyalı paneller; bizim beyazımızdan (#E8E5DF) belirgin koyu
m_principled("boya_gri_komsu", srgb("#828382"), rough=0.8, spec=0.3, bump=(140.0, 0.03))
m_principled("boya_gri_komsu2", srgb("#2A2C2F"), rough=0.8, spec=0.3)
m_principled("boya_gri_komsu3", srgb("#95948F"), rough=0.8, spec=0.3, bump=(140.0, 0.03))
m_principled("boya_gri_komsu4", srgb("#6A6D70"), rough=0.8, spec=0.3, bump=(140.0, 0.03))
for _ad, _h in (("fasya_a", "#D9D8D3"), ("fasya_b", "#35383B"), ("fasya_c", "#4C6A69"), ("fasya_d", "#4A5A72"), ("fasya_e", "#8B7553")):
    m_principled(_ad, srgb(_h), rough=0.55, spec=0.35)
m_principled("kablo_tava", srgb("#55585C"), rough=0.6, metal=0.6)
m_principled("komsu_zemin", srgb("#5B5F63"), rough=0.7, spec=0.3)
m_principled("metal_siyah", srgb("#18191A"), rough=0.45, metal=0.6, spec=0.5)
m_principled("hol_duvar", srgb("#2A2B2D"), rough=0.85, spec=0.3)
m_principled("krom", (0.8, 0.8, 0.8), rough=0.12, metal=1.0)
m_principled("kanopi_ic", srgb("#1F2925"), rough=0.7)
m_principled("koyu_yesil", srgb("#28332F"), rough=0.55, spec=0.4)
m_principled("koyu_yesil_doseme", srgb("#2F3D35"), rough=0.92, spec=0.2, bump=(900.0, 0.12))
m_principled("minder", srgb("#9C9C8E"), rough=0.95, spec=0.2, bump=(700.0, 0.15))
m_principled("hasir", srgb("#A08260"), rough=0.85, spec=0.25, bump=(260.0, 0.6))
m_principled("toprak", srgb("#2E2620"), rough=0.95, spec=0.2, bump=(300.0, 0.4))
m_principled("ekran_kapali", (0.004, 0.004, 0.005), rough=0.06, spec=0.6, coat=1.0)
m_principled("kagit_kenar", srgb("#F2F0EA"), rough=0.85, spec=0.2, bump=(4000.0, 0.15))
m_principled("plastik_gri", srgb("#6C6E70"), rough=0.6)
m_principled("masa_beyaz", srgb("#ECEAE6"), rough=0.35, spec=0.5)
m_emis("armatur", kelvin(5000), 1.6)                                   # lineer armatürler (görünür şerit; dolgu hol_dolgu ışığında)
for _ad, _k, _g in (("isik_kutu_a", 4500, 0.42), ("isik_kutu_b", 5500, 0.36), ("isik_kutu_c", 3800, 0.30)):
    m_emis(_ad, kelvin(_k), _g)                                        # komşu stant ışık kutuları (arkadan aydınlatmalı kumaş, grafiksiz)
m_emis("isiklik", kelvin(6000), 0.35)                                  # çatı ışıklığı difüzörü (perdeli, loş hol)
m_emis("masa_isik", kelvin(4000), 2.2)                                 # oyun masası ışıklı üst
# B kararı 6: bal meşesi (#C9A47A hedefi; banko ve zemin). Doku ortalaması (doğrusal): white_oak_veneer
# (0,280; 0,193; 0,125), laminate_floor_02 (0,333; 0,220; 0,128). ton = hedef albedo / doku ortalaması (renk.py ile ölçülür).
MESE_TON = (1.45, 1.36, 1.05)    # albedo ort. (0,406; 0,262; 0,131): oran (1; 0,645; 0,323) ≈ #C9A47A oranı (1; 0,635; 0,334)
m_pbr("mese", "white_oak_veneer", 2.0, ton=MESE_TON, doygunluk=1.0, parlaklik=1.0, rough_ek=0.05)
# banko üstü: broşür vurgu spotunun altında (sahne doğrusal E ~10–11) #C9A47A görünsün diye koyu bal (albedo ort. ~0,119 /
# 0,057 / 0,009); ton üç adımda: × ters(#C9A47A) / ters(ölçülen) (renk.py; t56 son kare #DDC7B5 → #D7BEA5 → #CBAD91)
m_pbr("mese_banko", "white_oak_veneer", 2.0, ton=(0.400, 0.295, 0.070), doygunluk=1.0, parlaklik=1.0, rough_carp=0.9)
m_pbr("laminat", "laminate_floor_02", 1 / 1.7, ton=(1.30, 1.28, 1.05), doygunluk=1.0, parlaklik=1.0, rough_ek=0.05)
m_pbr("laminat_koyu", "laminate_floor_02", 1 / 1.7, ton=(0.92, 0.85, 0.76), doygunluk=0.8, parlaklik=0.62)
# koyu gri halı (B kararı 3): ortalama albedo ~0,055 (#3F4144 civarı); A turunda çift çarpımla ~0,001'di (siyah)
m_pbr("hali", "dirty_carpet", 1 / 0.6, ton=(1.15, 1.18, 1.25), doygunluk=0.0, parlaklik=1.0, rough_ek=0.2, nor_guc=0.8)
m_principled("cati", srgb("#2C2D2F"), rough=0.6, metal=0.3, bump=(3.0, 0.2))

# ================================================================== yardımcılar
PARCALAR = []   # {"o": boş nesne, "ofs": Vector, "rot": Euler (patlatılmış), "t0": montaj başlangıcı, "sure": sn, "sira": int}


def bos(ad, loc=(0, 0, 0)):
    e = bpy.data.objects.new(ad, None)
    COL["stant"].objects.link(e)
    e.location = loc
    return e


def parca(ad, ofs, t0, sure, rot=(0, 0, 0), pivot=(0, 0, 0)):
    e = bos("P_" + ad, pivot)
    PARCALAR.append({"o": e, "ad": ad, "ofs": Vector(ofs) * a.patlama, "rot": Vector(rot), "t0": t0, "sure": sure, "pivot": Vector(pivot), "sira": len(PARCALAR)})
    return e


def kutu(ad, sx, sy, sz, loc, mat, parent=None, col="stant", bev=0.004, rotz=0.0, uv=1.0):
    me = O.kutu_ag(ad, sx, sy, sz, merkez_alt=True, uv_olcek=uv)
    o = O.obje(ad, me, COL[col], mat, loc=Vector(loc) - (parent.location if parent else Vector()), parent=parent)
    o.rotation_euler.z = rotz
    if bev:
        O.bevel(o, bev, 2)
    return o


def silindir(ad, r, h, loc, mat, parent=None, col="stant", n=32, bev=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=n, radius1=r, radius2=r, depth=h)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, h / 2))
    me = bpy.data.meshes.new(ad)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = len(p.vertices) == 4
    o = O.obje(ad, me, COL[col], mat, loc=Vector(loc) - (parent.location if parent else Vector()), parent=parent)
    if bev:
        O.bevel(o, bev, 2)
    return o


def panel_doku(ad, w, h, t, loc, rotz, mat_on, mat_kenar, parent=None, dikey_metin=False, arka=None):
    """Dikey panel (w × h × t), ön yüz −Y yerel (rotz ile döner) doku; dikey_metin: yatay doku 90° (aşağıdan yukarı)."""
    x, y = w / 2, t / 2
    co = [(-x, -y, 0), (x, -y, 0), (x, y, 0), (-x, y, 0), (-x, -y, h), (x, -y, h), (x, y, h), (-x, y, h)]
    f = [(0, 1, 5, 4), (2, 3, 7, 6), (0, 3, 2, 1), (4, 5, 6, 7), (1, 2, 6, 5), (3, 0, 4, 7)]
    if dikey_metin:
        on = [(0, 1), (0, 0), (1, 0), (1, 1)]   # v0 (sol alt) → u=0,v=1 …: metin aşağıdan yukarı, üstü sola
    else:
        on = [(0, 0), (1, 0), (1, 1), (0, 1)]
    z4 = [(0, 0)] * 4
    uv = [on, [(0, 0), (1, 0), (1, 1), (0, 1)], z4, z4, z4, z4]
    me = O.ag(ad, co, f, uv)
    for i, p in enumerate(me.polygons):
        p.material_index = 0 if i == 0 else (2 if (i == 1 and arka) else 1)
    me.materials.append(mat_on)
    me.materials.append(mat_kenar)
    if arka:
        me.materials.append(arka)
    o = bpy.data.objects.new(ad, me)
    COL["stant"].objects.link(o)
    o.location = Vector(loc) - (parent.location if parent else Vector())
    o.rotation_euler.z = rotz
    if parent:
        o.parent = parent
    return o


# ================================================================== E TURU: duvar baskıları, ekranlar, yıkama spotları
# Yıkama spotları (brief §12.3): z 4,25 (Z0'dan), duvardan 0,7 m açıkta, 3.000 K, koni 35°, blend 0,6, hedef z 2,0.
YIKAMA_Z, YIKAMA_ACIK, YIKAMA_HEDEF_Z = Z0 + 4.25, 0.70, Z0 + 2.0
YIKAMA = (
    [{"ad": f"yikama_kuzey_{i}", "grup": "kuzey", "duvar": "arka",
      "konum": Vector((x, Y_ARKA_IC - YIKAMA_ACIK, YIKAMA_Z)), "hedef": Vector((x, Y_ARKA_IC, YIKAMA_HEDEF_Z)),
      "taban": Vector((x, DP / 2 - DUVAR_T / 2, Z0 + DUVAR_H))} for i, x in enumerate((-6.6, -4.9, -3.2))]
    + [{"ad": f"yikama_bati_{i}", "grup": "bati", "duvar": "sol",
        "konum": Vector((X_SOL_IC + YIKAMA_ACIK, y, YIKAMA_Z)), "hedef": Vector((X_SOL_IC, y, YIKAMA_HEDEF_Z)),
        "taban": Vector((-W / 2 + DUVAR_T / 2, y, Z0 + DUVAR_H))} for i, y in enumerate((0.6, 1.95, 3.3))]
)


def duvar_baskilari(d_on, d_arka, d_sol):
    """4 baskı (5 mm panel; duvar parçasının çocuğu → d4 patlatması ve montaj aynen) + 2 ekran + 6 yıkama armatürü."""
    bw = MAT["boya_beyaz"]
    ma = m_baski("baski_arka", DUVAR_DOKU["arka"], "#F7E6CD", rough=0.75, spec=0.3)
    ms = m_baski("baski_sol", DUVAR_DOKU["sol"], "#F7E6CD", rough=0.75, spec=0.3)
    mc = m_baski("baski_cephe", DUVAR_DOKU["cephe"], "#F7E6CD", rough=0.75, spec=0.3)
    me = m_baski("ekran_soz", DUVAR_DOKU["ekran"], "#17241D", emis_g=a.ekran_g, rough=0.08, spec=0.6, coat=1.0)
    # arka_kapali iç yüzü: x −7,38…−1,80 × z 0–4 (2.790 × 2.000 px); ön yüz −Y
    x0, x1 = X_SOL_IC, PX(0.38)
    panel_doku("baski_arka", x1 - x0, DUVAR_H, BASKI_T, ((x0 + x1) / 2, Y_ARKA_IC - BASKI_T / 2, Z0), 0.0, ma, bw, parent=d_arka)
    # sol_kapali iç yüzü: y −0,50…4,83 (2.665 × 2.000 px); ön yüz +X (u kuzeye artar: içeriden bakana soldan sağa)
    y0, y1 = -0.50, Y_ARKA_IC
    panel_doku("baski_sol", y1 - y0, DUVAR_H, BASKI_T, (X_SOL_IC + BASKI_T / 2, (y0 + y1) / 2, Z0), math.pi / 2, ms, bw, parent=d_sol)
    # 2 × 50" emisyonlu panel: 1,11 × 0,62 m, 4 cm ara, y 1,05…3,31, z 1,20–1,82; gövde 5 cm
    for i in range(2):
        yc = 1.05 + 1.11 / 2 + i * (1.11 + 0.04)
        panel_doku(f"ekran_soz_{i}", 1.11, 0.62, 0.05, (X_SOL_IC + BASKI_T + 0.025, yc, Z0 + 1.20), math.pi / 2, me,
                   MAT["metal_siyah"], parent=d_sol)
    # on_kapali dış yüzü: x 1,95…7,5 (2.775 × 2.000 px); ön yüz −Y (dışarı)
    xk = PX(0.63)
    panel_doku("baski_cephe", W / 2 - xk, DUVAR_H, BASKI_T, ((xk + W / 2) / 2, Y_ON_DIS - BASKI_T / 2, Z0), 0.0, mc, bw, parent=d_on)
    # yıkama armatürleri: duvar üstünde dikme → yatay kol (0,7 m) → çatal → silindir gövde (ışın doğrultusunda)
    ms_ = MAT["metal_siyah"]
    for y_ in YIKAMA:
        par = d_arka if y_["duvar"] == "arka" else d_sol
        L, T, B = y_["konum"], y_["hedef"], y_["taban"]
        yon = (T - L).normalized()
        govde_m = L - yon * 0.085                 # gövde merkezi (ön yüzü ışığın 1 cm gerisinde)
        z_kol = govde_m.z + 0.10
        kutu(f"{y_['ad']}_dikme", 0.03, 0.03, z_kol + 0.03 - B.z, (B.x, B.y, B.z), ms_, parent=par, bev=0)
        orta = (B + govde_m) / 2
        if y_["duvar"] == "arka":
            kutu(f"{y_['ad']}_kol", 0.03, abs(B.y - govde_m.y) + 0.015, 0.03, (B.x, orta.y, z_kol), ms_, parent=par, bev=0)
        else:
            kutu(f"{y_['ad']}_kol", abs(B.x - govde_m.x) + 0.015, 0.03, 0.03, (orta.x, B.y, z_kol), ms_, parent=par, bev=0)
        kutu(f"{y_['ad']}_catal", 0.02, 0.02, z_kol - govde_m.z, (govde_m.x, govde_m.y, govde_m.z), ms_, parent=par, bev=0)
        o = silindir(f"{y_['ad']}_govde", 0.045, 0.15, L - yon * 0.16, ms_, parent=par, n=20, bev=0.004)
        o.rotation_euler = yon.to_track_quat("Z", "Y").to_euler()


# ================================================================== HOL
KOMSU_ISIK = []   # (konum, (sx, sy), çarpan): komşu stant tavan ışıkları (gölgesiz alan ışığı)


def hol_kur(p4_y):
    """Hol: halı, duvarlar, makaslar (7,5 m ara, alt başlık 12,2 m), aşıklar, kanallar, lineer armatürler (%10),
    çatı ışıklıkları, grafiksiz komşu stant hacimleri. Makas ızgarası P4 kamerasına göre kaydırılır: t34b'de
    kamera ışıklık bandından (açıklık ortası) iner ve P4'e varmadan bir makasın altından geçer."""
    c = COL["hol"]
    XH, YA, YB, ZC = 46.0, -48.0, 40.0, 14.0
    # halı
    me = O.ag("hali", [(-XH, YA, 0), (XH, YA, 0), (XH, YB, 0), (-XH, YB, 0)], [(0, 1, 2, 3)],
              [[(-XH, YA), (XH, YA), (XH, YB), (-XH, YB)]])
    O.obje("hali", me, c, MAT["hali"])
    # duvarlar + pilastrlar
    for ad, sx, sy, loc in (("hduvar_k", 2 * XH, 0.4, (0, YB, 0)), ("hduvar_g", 2 * XH, 0.4, (0, YA, 0)),
                            ("hduvar_d", 0.4, YB - YA, (XH, (YA + YB) / 2, 0)), ("hduvar_b", 0.4, YB - YA, (-XH, (YA + YB) / 2, 0))):
        kutu(ad, sx, sy, ZC, loc, MAT["hol_duvar"], col="hol", bev=0)
    # makas ızgarası: P4 kamerasının 1,6 m gerisinde bir makas (t34b kamerası bunun altından geçer)
    y_makas0 = p4_y - 1.6
    makas_y = [y_makas0 + 7.5 * k for k in range(-8, 9) if YA + 1 < y_makas0 + 7.5 * k < YB - 1]
    # tek makas ağı (Warren): alt/üst başlık + diyagonaller, X boyunca
    bm = bmesh.new()

    def cubuk(p, q, s):
        p, q = Vector(p), Vector(q)
        d = q - p
        L = d.length
        mat = Matrix.Translation((p + q) / 2) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4()
        r = bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=(s, s, L), verts=r["verts"])
        bmesh.ops.transform(bm, matrix=mat, verts=r["verts"])

    za, zu = 12.2, 13.7
    cubuk((-XH, 0, za), (XH, 0, za), 0.26)
    cubuk((-XH, 0, zu), (XH, 0, zu), 0.30)
    n = int(2 * XH / 3.0)
    for i in range(n):
        x0 = -XH + i * 3.0
        cubuk((x0, 0, za), (x0 + 1.5, 0, zu), 0.12)
        cubuk((x0 + 1.5, 0, zu), (x0 + 3.0, 0, za), 0.12)
    me = bpy.data.meshes.new("makas")
    bm.to_mesh(me)
    bm.free()
    for i, y in enumerate(makas_y):
        O.obje(f"makas_{i}", me, c, MAT["metal_siyah"], loc=(0, y, 0))
    # aşıklar (Y boyunca, 3 m arayla)
    bm = bmesh.new()
    for i in range(int(2 * XH / 3.0) + 1):
        x = -XH + i * 3.0
        cubuk((x, YA, 13.92), (x, YB, 13.92), 0.14)
    me = bpy.data.meshes.new("asik")
    bm.to_mesh(me)
    bm.free()
    O.obje("asik", me, c, MAT["metal_siyah"])
    # çatı (ışıklık açıklıkları dışarıda) — açıklık ortaları makas aralarının ortasında, her ikinci açıklıkta
    acik_y = [y + 3.75 for y in makas_y[:-1]][::2]
    # t34b başlangıcı: P4'ün arkasındaki açıklık ortası
    y_bas = y_makas0 - 3.75
    if all(abs(y - y_bas) > 0.1 for y in acik_y):
        acik_y = sorted(acik_y + [y_bas])
    ISIKLIK_W = 2.4
    kes = sorted([(y - ISIKLIK_W / 2, y + ISIKLIK_W / 2) for y in acik_y])
    ys = [YA]
    for y0, y1 in kes:
        ys += [y0, y1]
    ys.append(YB)
    for i in range(0, len(ys), 2):
        y0, y1 = ys[i], ys[i + 1]
        if y1 - y0 < 0.05:
            continue
        me = O.ag(f"cati_{i}", [(-XH, y0, ZC), (XH, y0, ZC), (XH, y1, ZC), (-XH, y1, ZC)], [(3, 2, 1, 0)],
                  [[(-XH, y1), (XH, y1), (XH, y0), (-XH, y0)]])
        O.obje(f"cati_{i}", me, c, MAT["cati"])
    for j, (y0, y1) in enumerate(kes):
        # difüzör (opal polikarbonat): çatının 0,25 m üstünde, aşağı bakar; ince kasa
        me = O.ag(f"isiklik_{j}", [(-XH, y0, ZC + 0.25), (XH, y0, ZC + 0.25), (XH, y1, ZC + 0.25), (-XH, y1, ZC + 0.25)], [(3, 2, 1, 0)])
        o = O.obje(f"isiklik_{j}", me, c, MAT["isiklik"])
        for s, yy in (("a", y0), ("b", y1)):
            kutu(f"isiklik_kasa_{j}{s}", 2 * XH, 0.08, 0.25, (0, yy, ZC), MAT["metal_siyah"], col="hol", bev=0)
    # kanallar (yuvarlak, siyah): makas aralarında X boyunca
    for i, y in enumerate(makas_y[:-1]):
        if i % 2:
            continue
        o = silindir(f"kanal_{i}", 0.32, 2 * XH, (0, 0, 0), MAT["metal_siyah"], col="hol", n=24)
        o.rotation_euler = (0, math.pi / 2, 0)
        o.location = (-XH, y + 2.2, 12.95)
    # lineer armatürler: makas aralarının ortasında sıralar, X boyunca 4 m arayla, 11,9 m'de
    bm = bmesh.new()
    for y in [yy + 3.75 for yy in makas_y[:-1]]:
        for k in range(-11, 12):
            r = bmesh.ops.create_cube(bm, size=1.0)
            bmesh.ops.scale(bm, vec=(1.6, 0.07, 0.05), verts=r["verts"])
            bmesh.ops.translate(bm, vec=(k * 4.0, y, 12.0), verts=r["verts"])
    me = bpy.data.meshes.new("armatur")
    bm.to_mesh(me)
    bm.free()
    O.obje("armatur", me, c, MAT["armatur"])
    # komşu stantlar (B kararı 3, "fuar holü okunsun"): sade fasyalı hacimler — arka + yan paneller, açık kenarda fasya
    # bandı (düz renk, grafik yok), arka panelin iç yüzünde arkadan aydınlatmalı ışık kutusu, tezgâh/vitrin kutuları,
    # koyu platform zemin; her birinin üstünde gölgesiz yumuşak tavan ışığı. Bizim stant yine en parlak nesne.
    rnd = random.Random(7)
    bloklar = [
        # (x0, x1, y0, y1)
        (-31, -19.5, -4.95, 4.95), (-19.0, -11.5, -4.95, 4.95), (11.5, 20.0, -4.95, 4.95), (20.5, 31, -4.95, 4.95),
        (-31, -19.5, 8.95, 18.95), (-19.0, -11.5, 8.95, 18.95), (-7.5, 0.0, 8.95, 18.95), (0.5, 7.5, 8.95, 18.95),
        (11.5, 20.0, 8.95, 18.95), (20.5, 31, 8.95, 18.95),
        (-31, -11.5, 22.95, 32.0), (-7.5, 7.5, 22.95, 32.0), (11.5, 31, 22.95, 32.0),
        (-31, -19.5, -14.95, -8.95), (-19.0, -11.5, -14.95, -8.95), (11.5, 20.0, -14.95, -8.95), (20.5, 31, -14.95, -8.95),
        (-31, -11.5, -34.0, -22.0), (-7.5, 7.5, -36.0, -24.0), (11.5, 31, -34.0, -22.0),
    ]
    KOMSU_ISIK.clear()
    duvar_m = ["boya_gri_komsu", "boya_gri_komsu3", "boya_gri_komsu4"]
    fasya_m = ["fasya_a", "fasya_b", "fasya_c", "fasya_d", "fasya_e"]
    kutu_m = ["isik_kutu_a", "isik_kutu_b", "isik_kutu_c"]
    for i, (x0, x1, y0, y1) in enumerate(bloklar):
        on_sira = y1 < -9
        h = rnd.choice([2.5, 3.0]) if on_sira else rnd.choice([3.0, 3.5, 4.0, 4.5])
        mt = MAT[rnd.choice(duvar_m)]
        mf = MAT[rnd.choice(fasya_m)]
        mk = MAT[rnd.choice(kutu_m)]
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        sx, sy = x1 - x0, y1 - y0
        acik = rnd.choice(["-Y", "+Y", "-X", "+X"])
        t = 0.1
        fh = 0.75   # fasya bandı yüksekliği
        if acik in ("-Y", "+Y"):
            ya = y1 - t / 2 if acik == "-Y" else y0 + t / 2
            kutu(f"k{i}_arka", sx, t, h, (cx, ya, 0), mt, col="hol", bev=0)
            kutu(f"k{i}_yan1", t, sy, h, (x0 + t / 2, cy, 0), mt, col="hol", bev=0)
            if rnd.random() < 0.7:
                kutu(f"k{i}_yan2", t, sy * 0.6, h, (x1 - t / 2, cy + (sy * 0.2 if acik == "-Y" else -sy * 0.2), 0), mt, col="hol", bev=0)
            yb = y0 + t / 2 if acik == "-Y" else y1 - t / 2
            kutu(f"k{i}_bas", sx, t * 1.6, fh, (cx, yb, h - fh), mf, col="hol", bev=0.01)
            # ışık kutusu: arka panelin iç yüzünde (açık kenara bakar)
            lw, lh = min(sx * 0.55, 3.6), min(h - 1.1, 2.4)
            yk = ya + (-1 if acik == "-Y" else 1) * (t / 2 + 0.05)
            kutu(f"k{i}_lk", lw, 0.08, lh, (cx + rnd.uniform(-0.2, 0.2) * sx, yk, 0.55), mk, col="hol", bev=0.01)
        else:
            xa = x1 - t / 2 if acik == "-X" else x0 + t / 2
            kutu(f"k{i}_arka", t, sy, h, (xa, cy, 0), mt, col="hol", bev=0)
            kutu(f"k{i}_yan1", sx, t, h, (cx, y0 + t / 2, 0), mt, col="hol", bev=0)
            kutu(f"k{i}_yan2", sx * 0.6, t, h, (cx, y1 - t / 2, 0), mt, col="hol", bev=0)
            xb = x0 + t / 2 if acik == "-X" else x1 - t / 2
            kutu(f"k{i}_bas", t * 1.6, sy, fh, (xb, cy, h - fh), mf, col="hol", bev=0.01)
            lw, lh = min(sy * 0.55, 3.6), min(h - 1.1, 2.4)
            xk = xa + (-1 if acik == "-X" else 1) * (t / 2 + 0.05)
            kutu(f"k{i}_lk", 0.08, lw, lh, (xk, cy + rnd.uniform(-0.2, 0.2) * sy, 0.55), mk, col="hol", bev=0.01)
        for j in range(rnd.randint(1, 3)):
            bx, by = rnd.uniform(x0 + 1.5, x1 - 1.5), rnd.uniform(y0 + 1.5, y1 - 1.5)
            kutu(f"k{i}_ic{j}", rnd.uniform(0.8, 2.4), rnd.uniform(0.5, 1.0), rnd.choice([0.95, 1.05, 1.1, 1.8]), (bx, by, 0),
                 MAT[rnd.choice(["masa_beyaz", "boya_gri_komsu3", "fasya_b"])], col="hol", bev=0.006)
        kutu(f"k{i}_zemin", sx, sy, 0.04, (cx, cy, 0), MAT["komsu_zemin"], col="hol", bev=0)
        KOMSU_ISIK.append((Vector((cx, cy, h + 0.6)), (sx * 0.8, sy * 0.8), rnd.uniform(0.75, 1.15)))
    # kablo tavaları (galvaniz merdiven tava, 0,4 m): Y boyunca stantın iki yanında ve arkada X boyunca, 9,4 m'de;
    # askı çubukları makaslara. Kamera yolları (P4 ~11 m, t34b ışıklıktan iniş, t45) bunlara değmez.
    def tava(ad, p, q):
        p, q = Vector(p), Vector(q)
        d = q - p
        L = d.length
        o = kutu(ad, 0.42 if abs(d.y) > abs(d.x) else L, L if abs(d.y) > abs(d.x) else 0.42, 0.07, ((p + q) / 2).to_tuple(),
                 MAT["kablo_tava"], col="hol", bev=0)
        return o
    for i, xx in enumerate((-12.6, 10.4, -24.0, 24.5)):
        tava(f"tava_y{i}", (xx, YA + 2, 9.4), (xx, YB - 2, 9.4))
        for yy in makas_y:
            kutu(f"tava_aski_{i}_{yy:.1f}", 0.02, 0.02, 12.2 - 9.47, (xx, yy, 9.47), MAT["metal_siyah"], col="hol", bev=0)
    for i, yy in enumerate((21.0, 35.0)):
        tava(f"tava_x{i}", (-XH + 2, yy, 9.9), (XH - 2, yy, 9.9))
    return {"makas_y": makas_y, "isiklik_y": acik_y, "y_bas": y_bas, "isiklik_w": ISIKLIK_W}


# ================================================================== STANT
def stant_kur():
    S = {}
    # ---- zemin plakası (yerinde) + oyun alanı şeridi + rotunda baskısı
    zem = parca("zemin", (0, 0, 0), 0, 0)
    kutu("zemin_plaka", W, DP, Z0, (0, 0, 0), MAT["laminat"], parent=zem, bev=0.003)
    x0, x1 = -W / 2, PX(0.638)
    y0, y1 = PY(1.0), PY(0.71)
    me = O.ag("oyun_zemin", [(x0, y0, Z0 + 0.0015), (x1, y0, Z0 + 0.0015), (x1, y1, Z0 + 0.0015), (x0, y1, Z0 + 0.0015)], [(0, 1, 2, 3)],
              [[(x0, y0), (x1, y0), (x1, y1), (x0, y1)]])
    O.obje("oyun_zemin", me, COL["stant"], MAT["laminat_koyu"], parent=zem)
    # rotunda baskısı (r 2,01) — doku ±2,25 m
    n = 160
    co = [(RC.x, RC.y, Z0 + 0.002)] + [(RC.x + 2.01 * math.cos(2 * math.pi * i / n), RC.y + 2.01 * math.sin(2 * math.pi * i / n), Z0 + 0.002) for i in range(n)]
    f = [(0, 1 + i, 1 + (i + 1) % n) for i in range(n)]
    uvp = lambda v: (0.5 + (v[0] - RC.x) / 4.5, 0.5 + (v[1] - RC.y) / 4.5)
    uv = [[uvp(co[a_]), uvp(co[b_]), uvp(co[c_])] for a_, b_, c_ in f]
    me = O.ag("halka", co, f, uv)
    O.obje("halka", me, COL["stant"], m_doku("halka_baski", DOKU + "halka.png", rough=0.55, spec=0.35), parent=zem)

    # ---- çevre duvarları (+1,4 m yukarı, 0,6 m dışarı)
    def duvar_parca(ad, normal):
        return parca(ad, (normal[0] * 0.6, normal[1] * 0.6, 1.4), 0.0, 0.42)

    d_on = duvar_parca("duvar_on", (0, -1))
    d_sag = duvar_parca("duvar_sag", (1, 0))
    d_arka = duvar_parca("duvar_arka", (0, 1))
    d_sol = duvar_parca("duvar_sol", (-1, 0))
    yo, ya_ = -DP / 2 + DUVAR_T / 2, DP / 2 - DUVAR_T / 2
    xs, xd = -W / 2 + DUVAR_T / 2, W / 2 - DUVAR_T / 2
    bw = MAT["boya_beyaz"]
    # ön (−Y): sağda kapalı (PX 0,63 → 7,5), solda köşe dikmesi, açıklık üstünde fasya
    xk = PX(0.63)
    kutu("on_kapali", W / 2 - xk, DUVAR_T, DUVAR_H, ((xk + W / 2) / 2, yo, Z0), bw, parent=d_on)
    kutu("on_dikme", 0.30, DUVAR_T, DUVAR_H, (-W / 2 + 0.15, yo, Z0), bw, parent=d_on)
    kutu("on_fasya", xk - (-W / 2 + 0.30), DUVAR_T, DUVAR_H - FASIA_ALT, ((xk + (-W / 2 + 0.30)) / 2, yo, Z0 + FASIA_ALT), bw, parent=d_on)
    # sağ (+X): Y −4,95 → 0,5 kapalı, sonra fasya
    kutu("sag_kapali", DUVAR_T, 0.5 + DP / 2, DUVAR_H, (xd, (0.5 - DP / 2) / 2, Z0), bw, parent=d_sag)
    kutu("sag_fasya", DUVAR_T, DP / 2 - 0.5, DUVAR_H - FASIA_ALT, (xd, (0.5 + DP / 2) / 2, Z0 + FASIA_ALT), bw, parent=d_sag)
    kutu("sag_dikme", 0.30, 0.30, DUVAR_H, (W / 2 - 0.15, DP / 2 - 0.15, Z0), bw, parent=d_sag)
    # arka (+Y): X −7,5 → −1,8 kapalı, sonra fasya
    xa = PX(0.38)
    kutu("arka_kapali", xa + W / 2, DUVAR_T, DUVAR_H, ((xa - W / 2) / 2, ya_, Z0), bw, parent=d_arka)
    kutu("arka_fasya", W / 2 - xa, DUVAR_T, DUVAR_H - FASIA_ALT, ((xa + W / 2) / 2, ya_, Z0 + FASIA_ALT), bw, parent=d_arka)
    # sol (−X): Y −0,5 → 4,95 kapalı, önü fasya
    kutu("sol_kapali", DUVAR_T, DP / 2 + 0.5, DUVAR_H, (xs, (DP / 2 - 0.5) / 2, Z0), bw, parent=d_sol)
    kutu("sol_fasya", DUVAR_T, DP / 2 - 0.5, DUVAR_H - FASIA_ALT, (xs, (-0.5 - DP / 2) / 2, Z0 + FASIA_ALT), bw, parent=d_sol)
    # E turu (brief §12.3): arka / sol iç yüz + ön cephe baskıları, sol duvarda 2 ekran, 6 yıkama armatürü
    duvar_baskilari(d_on, d_arka, d_sol)
    # iç odalar (+1,4 m yukarı)
    oda = parca("odalar", (0, 0, 1.4), 0.05, 0.42)
    xo = PX(0.655)
    yo1, yo2 = PY(0.453), PY(0.835)
    kutu("oda_bati_a", DUVAR_T, yo1 - (-0.55), DUVAR_H, (xo, (yo1 - 0.55) / 2, Z0), bw, parent=oda)
    kutu("oda_bati_b", DUVAR_T, -1.55 - (yo2 + 0.0), DUVAR_H, (xo, (-1.55 + yo2) / 2, Z0), bw, parent=oda)
    kutu("oda_bati_c", DUVAR_T, (yo2 - 0.0) - (-3.9), DUVAR_H, (xo, (yo2 - 3.9) / 2, Z0), bw, parent=oda)
    kutu("oda_bati_ust", DUVAR_T, 1.0, DUVAR_H - 2.2, (xo, -1.05, Z0 + 2.2), bw, parent=oda)
    kutu("oda_bati_ust2", DUVAR_T, 0.9, DUVAR_H - 2.2, (xo, -4.35, Z0 + 2.2), bw, parent=oda)
    kutu("oda_kuzey", W / 2 - xo, DUVAR_T, DUVAR_H, ((xo + W / 2) / 2, yo1, Z0), bw, parent=oda)
    kutu("oda_ara", W / 2 - xo, DUVAR_T, DUVAR_H, ((xo + W / 2) / 2, yo2, Z0), bw, parent=oda)
    # amfi ekran duvarı: oda kuzey duvarının kuzey yüzünde 65" TV (kapalı)
    kutu("tv", 1.45, 0.05, 0.82, (5.0, yo1 + DUVAR_T / 2 + 0.03, Z0 + 1.30), MAT["ekran_kapali"], parent=oda, bev=0.004)
    # ---- meşe çıtalar (+1,0 m)
    cit = parca("citalar", (0, 0, 1.0), 0.1, 0.42)
    for gx in (-3.05, -0.05):
        for k in range(3):
            kutu(f"cita_on_{gx}_{k}", 0.08, 0.08, FASIA_ALT, (gx + k * 0.17, -DP / 2 + 0.2, Z0), MAT["mese"], parent=cit, bev=0.003)
    for gx in (-1.35, 1.0):
        for k in range(3):
            kutu(f"cita_arka_{gx}_{k}", 0.08, 0.08, FASIA_ALT, (gx + k * 0.17, DP / 2 - 0.2, Z0), MAT["mese"], parent=cit, bev=0.003)
    # ---- bantlar (ön açıklık içinde, ön duvarla birlikte)
    bp = m_doku("bant_play", DOKU + "bant-play.png", rough=0.7)
    bo = m_doku("bant_oyna", DOKU + "bant-oyna.png", rough=0.7)
    panel_doku("bant_play", 4.2, 0.40, 0.03, (-5.15, -DP / 2 + 0.16, Z0 + 2.72), 0.0, bp, MAT["koyu_yesil"], parent=d_on)
    panel_doku("bant_oyna", 1.9, 0.27, 0.03, (0.95, -DP / 2 + 0.16, Z0 + 2.80), 0.0, bo, MAT["koyu_yesil"], parent=d_on)
    # ---- turuncu dikey pankartlar (duvarların yanında: +1,1 m, 0,9 m dışarı)
    pk = parca("pankartlar", (0, -0.9, 1.1), 0.9, 0.4)
    pg = m_doku("pankart_gel", DOKU + "pankart-gel.png", rough=0.75)
    ps = m_doku("pankart_sifir", DOKU + "pankart-sifir.png", rough=0.75)
    turuncu = m_principled("turuncu", srgb("#DF9560"), rough=0.75)
    panel_doku("pankart_gel", 0.75, 3.0, 0.03, (-W / 2 + 0.45, -DP / 2 - 0.05, Z0 + 0.35), 0.0, pg, turuncu, parent=pk, dikey_metin=True)
    panel_doku("pankart_sifir", 0.75, 3.0, 0.03, (W / 2 - 0.5, -DP / 2 - 0.05, Z0 + 0.35), 0.0, ps, turuncu, parent=pk, dikey_metin=True)

    # ---- rotunda: 12 sütun (+0,3…+0,9 m, ≤ 4° dönük), kanopi (+1,8 m) + krom çubuklar
    sutunlar = []
    rnd = random.Random(12)
    beyaz_kenar = MAT["boya_beyaz"]
    for k in range(1, 13):
        th = math.radians(165 - (k - 1) * 30)
        pos = RC + Vector((R_SUTUN * math.cos(th), R_SUTUN * math.sin(th), 0))
        ofs_z = 0.3 + (k - 1) * 0.6 / 11
        rz = math.radians(rnd.choice([-1, 1]) * rnd.uniform(2.0, 4.0))
        rx = math.radians(rnd.uniform(-1.5, 1.5))
        p = parca(f"sutun_{k:02d}", (0, 0, ofs_z), 0.2 + (k - 1) * 0.06, 0.20, rot=(rx, 0, rz), pivot=pos + Vector((0, 0, SUTUN_H / 2)))
        # sütun ağı: yerel X genişlik, Y kalınlık (+Y iç yüz), Z yükseklik; UV normalize
        x, y, h = SUTUN_W / 2, SUTUN_D / 2, SUTUN_H
        co = [(-x, -y, 0), (x, -y, 0), (x, y, 0), (-x, y, 0), (-x, -y, h), (x, -y, h), (x, y, h), (-x, y, h)]
        fz = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
        z4 = [(0, 0)] * 4
        uv = [z4, z4, [(0, 0), (1, 0), (1, 1), (0, 1)], z4, [(0, 0), (1, 0), (1, 1), (0, 1)], z4]
        me = O.ag(f"sutun_{k:02d}", co, fz, uv)
        mt = m_doku(f"sutun_yuz_{k:02d}", DOKU + f"sutun-{k:02d}.png", rough=0.5, spec=0.35)
        me.materials.append(mt)
        me.materials.append(beyaz_kenar)
        for i_, pl in enumerate(me.polygons):
            pl.material_index = 0 if i_ in (2, 4) else 1
        o = bpy.data.objects.new(f"sutun_{k:02d}", me)
        COL["stant"].objects.link(o)
        o.parent = p
        o.location = pos - p.location
        o.rotation_euler.z = th + math.pi / 2
        O.bevel(o, 0.004, 2)
        sutunlar.append({"no": k, "o": o, "parca": p, "th": th, "pos": pos})
    S["sutunlar"] = sutunlar
    # kanopi: 16 kenarlı bant, dış yüz dokulu; iç yüz koyu
    kp = parca("kanopi", (0, 0, 1.8), 0.9, 0.48, pivot=RC + Vector((0, 0, KANOPI_ALT)))
    nK = 16
    r_dis, r_ic = R_KANOPI, R_KANOPI - 0.06
    co, f, uv, mi = [], [], [], []
    z_a, z_u = Z0 + KANOPI_ALT, Z0 + KANOPI_ALT + KANOPI_H
    ofs_aci = math.radians(-90 + 360 / nK / 2)   # metin girişten (güney) başlasın
    for i in range(nK):
        a0 = ofs_aci + 2 * math.pi * i / nK            # saat yönünün tersi (üstten): dışarıdan bakınca metin soldan sağa
        a1 = ofs_aci + 2 * math.pi * (i + 1) / nK
        P = lambda r, aa, z: (RC.x + r * math.cos(aa), RC.y + r * math.sin(aa), z)
        b = len(co)
        co += [P(r_dis, a0, z_a), P(r_dis, a1, z_a), P(r_dis, a1, z_u), P(r_dis, a0, z_u),
               P(r_ic, a0, z_a), P(r_ic, a1, z_a), P(r_ic, a1, z_u), P(r_ic, a0, z_u)]
        u0, u1 = i / nK, (i + 1) / nK
        f += [(b, b + 1, b + 2, b + 3), (b + 5, b + 4, b + 7, b + 6), (b + 4, b + 5, b + 1, b), (b + 3, b + 2, b + 6, b + 7)]
        uv += [[(u0, 0), (u1, 0), (u1, 1), (u0, 1)], [(0, 0)] * 4, [(0, 0)] * 4, [(0, 0)] * 4]
        mi += [0, 1, 1, 1]
    me = O.ag("kanopi", co, f, uv)
    me.materials.append(m_doku("kanopi_bant", DOKU + "kanopi.png", rough=0.6, uzanti="REPEAT"))
    me.materials.append(MAT["kanopi_ic"])
    for pl, m_ in zip(me.polygons, mi):
        pl.material_index = m_
    o = bpy.data.objects.new("kanopi", me)
    COL["stant"].objects.link(o)
    o.parent = kp
    o.location = -kp.location
    O.bevel(o, 0.003, 1)
    # krom taşıyıcılar: sütun aralarında 6 çubuk, zeminden kanopi altına (kanopiyle hareket eder); −90° (t45 girişi)
    # ve −120° (t56 çıkışı) aralıkları boş
    for j, aci_ in enumerate((150, 90, 30, -30, -60, -150)):
        th = math.radians(aci_)
        pos = RC + Vector(((R_KANOPI - 0.08) * math.cos(th), (R_KANOPI - 0.08) * math.sin(th), 0))
        silindir(f"krom_{j}", 0.022, KANOPI_ALT, pos, MAT["krom"], parent=kp, n=16)
    S["kanopi"] = kp

    # ---- amfi: iki sıra kavisli bank (+0,5 m) + konuşmacı sandalyeleri
    am = parca("amfi", (0, 0, 0.5), 0.6, 0.4)
    AC = Vector((5.0, 0.9, Z0))
    for sira, r in enumerate((1.75, 2.75)):
        aci = math.radians(38 if sira == 0 else 36)
        nseg = 24
        for parcaad, rr0, rr1, z0_, z1_, mt in (("taban", r - 0.22, r + 0.22, 0.0, 0.40, MAT["boya_beyaz"]),
                                                ("ust", r - 0.25, r + 0.25, 0.40, 0.44, MAT["mese"])):
            bm = bmesh.new()
            vs = []
            for i in range(nseg + 1):
                t_ = math.pi / 2 - aci + 2 * aci * i / nseg
                c_, s_ = math.cos(t_), math.sin(t_)
                vs.append([bm.verts.new((AC.x + rr * c_, AC.y + rr * s_, Z0 + zz)) for rr, zz in ((rr0, z0_), (rr1, z0_), (rr1, z1_), (rr0, z1_))])
            for i in range(nseg):
                A, B = vs[i], vs[i + 1]
                for q in range(4):
                    bm.faces.new((A[q], A[(q + 1) % 4], B[(q + 1) % 4], B[q]))
            bm.faces.new(list(reversed(vs[0])))
            bm.faces.new(vs[-1])
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            uvl = bm.loops.layers.uv.new("UVMap")
            for fc in bm.faces:
                for lp in fc.loops:
                    lp[uvl].uv = (lp.vert.co.x, lp.vert.co.y + lp.vert.co.z)
            me = bpy.data.meshes.new(f"bank_{sira}_{parcaad}")
            bm.to_mesh(me)
            bm.free()
            o = O.obje(f"bank_{sira}_{parcaad}", me, COL["stant"], mt, parent=am)
            o.location = -am.location
            O.bevel(o, 0.006, 2)
        # minderler
        nm = 4 if sira == 0 else 5
        for i in range(nm):
            t_ = math.pi / 2 - aci * 0.85 + 2 * aci * 0.85 * (i + 0.5) / nm
            pos = AC + Vector((r * math.cos(t_), r * math.sin(t_), 0.44))
            o = kutu(f"minder_{sira}_{i}", 0.46, 0.40, 0.09, pos, MAT["minder"], parent=am, bev=0.03, rotz=t_ - math.pi / 2)
            o.modifiers["bevel"].segments = 4
    ks = parca("konusmaci", (0, 0, 0.35), 0.65, 0.4)
    for i, x in enumerate((3.65, 4.55, 5.45, 6.35)):
        sandalye(f"ks_{i}", (x, 0.95, Z0), math.pi, MAT["koyu_yesil_doseme"], MAT["metal_siyah"], ks, kol=True)
    # sol duvar bankı
    sb = parca("sol_bank", (0, 0, 0.35), 0.7, 0.4)
    kutu("sol_bank", 0.36, 1.96, 0.44, (-W / 2 + 0.32, (PY(0.075) + PY(0.273)) / 2, Z0), MAT["mese"], parent=sb, bev=0.006)

    # ---- karşılama bankosu (+0,4 m) + broşür yığını
    bk = parca("banko", (0, 0, 0.4), 0.7, 0.4)
    bx, by = BANKO_C.x, BANKO_C.y
    for s in (-1, 1):
        kutu(f"banko_ayak_{s}", 0.32, BANKO_D, BANKO_H - 0.04, (bx + s * (BANKO_W / 2 - 0.16), by, Z0), MAT["mese"], parent=bk, bev=0.004)
    kutu("banko_govde", BANKO_W - 0.64, BANKO_D - 0.04, BANKO_H - 0.04, (bx, by + 0.02, Z0), MAT["boya_beyaz"], parent=bk, bev=0.004)
    kutu("banko_ust", BANKO_W + 0.02, BANKO_D + 0.02, 0.04, (bx, by, Z0 + BANKO_H - 0.04), MAT["mese_banko"], parent=bk, bev=0.003)
    # logo plakası (yalnız burada): ön yüzde Ø 0,46 disk
    n = 64
    yf = by - BANKO_D / 2 + 0.02 - 0.006
    zc = Z0 + 0.55
    co = [(bx, yf, zc)] + [(bx + 0.23 * math.cos(2 * math.pi * i / n), yf, zc + 0.23 * math.sin(2 * math.pi * i / n)) for i in range(n)]
    f = [(0, 1 + (i + 1) % n, 1 + i) for i in range(n)]
    uvp = lambda v: (0.5 - (v[0] - bx) / 0.46 * -1, 0.5 + (v[2] - zc) / 0.46)
    uv = [[uvp(co[a_]), uvp(co[b_]), uvp(co[c_])] for a_, b_, c_ in f]
    me = O.ag("logo", co, f, uv)
    O.obje("logo", me, COL["stant"], m_doku("logo", LOGO, rough=0.4, alfa=False), parent=bk).location -= bk.location
    # broşür yığını: 40 adet, üstteki tam hizalı (dönüklük 0), alttakiler ±1,5 mm / ±0,6°
    kap = bpy.data.materials.new("kapak")
    d = O.D(kap.node_tree)
    out = d("ShaderNodeOutputMaterial")
    # mat kuşe (DOM kapağıyla eşleşme için parlama yok denecek kadar az): pürüz 0,62, speküler 0,05
    # (B: 0,22 → 0,05; parlama perdesi mavi daireyi soldurur). --kalibre beyaz|siyah: düz albedo (renk.py ölçümü)
    bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.62)
    bs.inputs["Specular IOR Level"].default_value = 0.05     # 0,12'de parlama perdesi S ≈ 0,08 fotoğrafın koyularını kaldırıyordu
    if a.kalibre:
        bs.inputs["Base Color"].default_value = (1, 1, 1, 1) if a.kalibre == "beyaz" else (0, 0, 0, 1)
    else:
        tx = d.resim(KAPAK, True, uzanti="EXTEND", interp="Cubic")
        d.b(tx.outputs["Color"], bs.inputs["Base Color"])
    d.b(bs.outputs[0], out.inputs[0])
    MAT["kapak"] = kap
    x, y, h = BROSUR_W / 2, BROSUR_H / 2, BROSUR_T
    co = [(-x, -y, 0), (x, -y, 0), (x, y, 0), (-x, y, 0), (-x, -y, h), (x, -y, h), (x, y, h), (-x, y, h)]
    fz = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    z4 = [(0, 0)] * 4
    me = O.ag("brosur", co, fz, [z4, [(0, 0), (1, 0), (1, 1), (0, 1)], z4, z4, z4, z4])
    me.materials.append(kap)
    me.materials.append(MAT["kagit_kenar"])
    for i_, pl in enumerate(me.polygons):
        pl.material_index = 0 if i_ == 1 else 1
    rnd = random.Random(40)
    yigin = []
    z_ust = Z0 + BANKO_H
    for i in range(BROSUR_N):
        ust = i == BROSUR_N - 1
        o = bpy.data.objects.new(f"brosur_{i:02d}", me)
        COL["stant"].objects.link(o)
        o.parent = bk
        dx, dy, dr = (0, 0, 0) if ust else (rnd.uniform(-0.0015, 0.0015), rnd.uniform(-0.0015, 0.0015), math.radians(rnd.uniform(-0.6, 0.6)))
        o.location = Vector((bx + dx, by + dy, z_ust + i * BROSUR_T)) - bk.location
        o.rotation_euler.z = math.radians(-PSI_SON) + dr   # kapak üstü son karenin kadraj yukarısına (ψ yönü) bakar
        yigin.append(o)
    S["yigin"] = yigin
    S["brosur_ust_z"] = z_ust + BROSUR_N * BROSUR_T
    # ---- totem (+0,6 m): koyu yeşil yüz, beyaz kaide — rotundaya (+X) bakar
    tt = parca("totem", (0, 0, 0.6), 0.75, 0.4)
    tm = m_doku("totem", DOKU + "totem.png", rough=0.55)
    tcx, tcy = PX(0.168), PY(0.432)
    panel_doku("totem_yuz", 1.10, 2.20, 0.10, (tcx, tcy, Z0 + 0.14), math.pi / 2, tm, MAT["boya_beyaz"], parent=tt, arka=tm)
    kutu("totem_kaide", 0.20, 1.16, 0.14, (tcx, tcy, Z0), MAT["boya_beyaz"], parent=tt, bev=0.004)
    # ---- söz kiosku (+0,45 m): koyu yeşil gövde, ekranda yalnız "Sen de söz ver."
    ko = parca("kiosk", (0, 0, 0.45), 0.75, 0.4)
    kx, ky = 0.0, DP / 2 - 0.75
    kutu("kiosk_govde", 0.66, 0.34, 1.90, (kx, ky, Z0), MAT["koyu_yesil"], parent=ko, bev=0.01)
    ke = m_doku("kiosk_ekran", DOKU + "kiosk-ekran.png", rough=0.08, emis_g=2.0, spec=0.6, coat=1.0)
    panel_doku("kiosk_ekran", 0.55, 0.98, 0.01, (kx, ky - 0.175, Z0 + 0.80), 0.0, ke, MAT["ekran_kapali"], parent=ko)
    S["kiosk_ekran"] = ke
    # ---- oyun alanı (+0,35 m): iki ışıklı masa, 4'er sandalye, 3 puf
    oy = parca("oyun", (0, 0, 0.35), 0.8, 0.4)
    for j, (cx, cy) in enumerate(((PX(0.299), PY(0.858)), (PX(0.5175), PY(0.858)))):
        for sx_ in (-1, 1):
            for sy_ in (-1, 1):
                kutu(f"masa{j}_ayak_{sx_}{sy_}", 0.06, 0.06, 0.72, (cx + sx_ * 0.44, cy + sy_ * 0.44, Z0), MAT["mese"], parent=oy, bev=0.003)
        kutu(f"masa{j}_cerceve", 1.0, 1.0, 0.05, (cx, cy, Z0 + 0.72), MAT["mese"], parent=oy, bev=0.004)
        kutu(f"masa{j}_ust", 0.88, 0.88, 0.012, (cx, cy, Z0 + 0.765), MAT["masa_isik"], parent=oy, bev=0)
        for k, (dx, dy, rz) in enumerate(((0, -0.75, 0), (0, 0.75, math.pi), (-0.75, 0, -math.pi / 2), (0.75, 0, math.pi / 2))):
            sandalye(f"os{j}_{k}", (cx + dx, cy + dy, Z0), rz, MAT["mese"], MAT["mese"], oy)
    for k, x in enumerate((PX(0.06), PX(0.115), PX(0.17))):
        o = silindir(f"puf_{k}", 0.27, 0.42, (x, PY(0.75), Z0), MAT["hasir"], parent=oy, n=40, bev=0.04)
        o.modifiers["bevel"].segments = 4
    # ---- oda 1 masası + 10 sandalye (+0,3 m), oda 2 tezgâhı
    om = parca("oda_esya", (0, 0, 0.3), 0.85, 0.4)
    mcx, mcy = PX(0.8465), PY(0.6475)
    kutu("oda_masa", 3.6, 0.8, 0.74, (mcx, mcy, Z0), MAT["masa_beyaz"], parent=om, bev=0.005)
    for i in range(5):
        x = mcx - 1.44 + i * 0.72
        for s, rz in ((-1, 0.0), (1, math.pi)):
            sandalye(f"oda_s{i}_{s}", (x, mcy + s * 0.68, Z0), rz, MAT["plastik_gri"], MAT["metal_siyah"], om)
    kutu("oda2_tezgah", 1.4, 0.55, 0.9, (W / 2 - 0.9, PY(0.92), Z0), MAT["masa_beyaz"], parent=om, bev=0.005)
    return S


def sandalye(ad, loc, rz, m_dos, m_ayak, parent, kol=False):
    """Basit sandalye: 4 ayak, oturak, sırt (önü +Y yerel; rz ile döner)."""
    e = bpy.data.objects.new(ad, None)
    COL["stant"].objects.link(e)
    e.parent = parent
    e.location = Vector(loc) - parent.location
    e.rotation_euler.z = rz
    for sx in (-1, 1):
        for sy in (-1, 1):
            o = kutu(f"{ad}_ayak{sx}{sy}", 0.035, 0.035, 0.44, (sx * 0.19, sy * 0.19, 0), m_ayak, bev=0)
            o.parent = e
    o = kutu(f"{ad}_otur", 0.46, 0.44, 0.05, (0, 0, 0.44), m_dos, bev=0.015)
    o.parent = e
    o = kutu(f"{ad}_sirt", 0.44, 0.05, 0.36, (0, -0.21, 0.52), m_dos, bev=0.015)
    o.parent = e
    if kol:
        for sx in (-1, 1):
            o = kutu(f"{ad}_kol{sx}", 0.05, 0.40, 0.22, (sx * 0.23, -0.02, 0.48), m_dos, bev=0.012)
            o.parent = e
    return e


# ================================================================== bitkiler (Poly Haven CC0)
BITKI_YER = [
    # (x, y, tür) tür 1: potted_plant_01 (1,35 m), 2: potted_plant_02 (0,84 m)
    (-7.0, -3.55, 1), (-3.55, -4.45, 1), (0.55, -4.45, 2), (-6.95, -0.25, 1), (2.75, 4.45, 1), (7.05, 4.45, 1),
    (7.0, 1.05, 2), (2.8, 1.05, 2), (-3.7, 1.9, 1), (1.6, 3.6, 2), (-7.0, 4.45, 1),
]
# E turu: 3 numara (−6,9; 1,75) → (−6,95; −0,25): d7 (poz B) kadrajında sol ekranın alt ~0,3 m'sini örtüyordu; sol duvarın
# güney ucuna alındı. l5[0] ve eski t56[71]'de bu bitki görünmüyor (ışın denetimi) → değişmeyen klipler etkilenmez.


def bitkiler():
    if not a.bitki:
        return
    kaynak = {}
    for tur, adk, keep in ((1, "potted_plant_01", ("leaves", "stem")), (2, "potted_plant_02", ("leaves",))):
        once = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=f"{PH}{adk}/{adk}_1k.gltf")
        yeni = [o for o in bpy.data.objects if o not in once]
        tut = []
        for o in yeni:
            if o.type == "MESH" and any(k in o.name for k in keep):
                tut.append(o)
            else:
                bpy.data.objects.remove(o, do_unlink=True)
        for o in tut:
            for c in list(o.users_collection):
                c.objects.unlink(o)
        kaynak[tur] = tut
    bp = parca("bitkiler", (0, 0, 0), 0, 0)
    for i, (x, y, tur) in enumerate(BITKI_YER):
        hs = 0.50 if tur == 1 else 0.32
        kutu(f"saksi_{i}", 0.46, 0.46, hs, (x, y, Z0), MAT["mese"], parent=bp, bev=0.006)
        kutu(f"saksi_toprak_{i}", 0.40, 0.40, 0.01, (x, y, Z0 + hs - 0.03), MAT["toprak"], parent=bp, bev=0)
        for o in kaynak[tur]:
            k = bpy.data.objects.new(f"bitki_{i}_{o.name}", o.data)   # bağlı kopya (ağ ortak)
            COL["stant"].objects.link(k)
            k.parent = bp
            k.location = (x, y, Z0 + (0.0 if tur == 1 else -0.02))
            k.rotation_euler = (o.rotation_euler.x, o.rotation_euler.y, random.Random(i).uniform(0, 2 * math.pi))
            s_ = 1.1 if tur == 1 else 1.0
            k.scale = (o.scale.x * s_, o.scale.y * s_, o.scale.z * s_)
    for tur in kaynak:
        for o in kaynak[tur]:
            bpy.data.objects.remove(o, do_unlink=False) if o.users == 0 else None


# ================================================================== IŞIKLAR
ISIK = {}
HOL_DOLGU = 4200.0      # W (70 × 70 m alan ışığı)
BROSUR_SPOT_W = 1000.0
KOMSU_W_M2 = 1.3


def isik(ad, tip, loc, enerji, kelvin_, rot=None, boyut=None, spot=None, yon=None, gorunur=False, yumusak=0.1, spread=None):
    L = bpy.data.lights.new(ad, tip)
    # banko spotu tek başına (kapalı beyaz yüzey yok): iki motorda ölçülen parlaklık eşit (ort. lum 0,49 / 0,48) → çarpansız
    L.energy = enerji * (1.0 if ad in ("banko_spot", "brosur_spot") else CARP)
    L.use_temperature = True
    L.temperature = kelvin_
    L.color = (1, 1, 1)
    if tip == "AREA":
        L.shape = "RECTANGLE"
        L.size, L.size_y = boyut
        if spread:
            L.spread = math.radians(spread)
    if tip == "SPOT":
        L.spot_size = math.radians(spot[0])
        L.spot_blend = spot[1]
    if tip in ("SPOT", "POINT"):
        L.shadow_soft_size = yumusak
    o = bpy.data.objects.new(ad, L)
    COL["isik"].objects.link(o)
    o.location = loc
    if yon is not None:
        o.rotation_euler = Vector(yon).to_track_quat("-Z", "Y").to_euler()
    elif rot is not None:
        o.rotation_euler = rot
    o.visible_camera = gorunur
    ISIK[ad] = o
    return o


def isiklar_kur(hol):
    # dünya: çok koyu, soğuk
    w = bpy.data.worlds.new("dunya")
    sc.world = w
    d = O.D(w.node_tree)
    out = d("ShaderNodeOutputWorld")
    bg = d("ShaderNodeBackground", i_Strength=1.0)
    bg.inputs["Color"].default_value = (0.0020, 0.0022, 0.0026, 1)
    d.b(bg.outputs[0], out.inputs[0])
    # 1) yumuşak kutu: rotundanın üstünde 2 × 2 m, 3.800 K (d4 ana ışığı)
    # B: patlatma ×1,6 duvarları kutuya 2,2 m yaklaştırdı → beyaz duvar en parlak kanal p99,9 1,0 (kırpık) → 8.500 → 4.000 W
    # ve 2 × 2 m / 62° rotunda merkezinde sıcak nokta yapıyordu → 3 × 3 m, 85°, 2.600 W (daha yayvan)
    isik("yumusak_kutu", "AREA", RC + Vector((0, 0, 8.0)), 2600, 3800, rot=(0, 0, 0), boyut=(3.0, 3.0), spread=85)
    # ön dolgu: kamera tarafından, standla sınırlı (spread 28°), çok düşük — kanopi bandı ve ön yüzler siluet olmasın
    isik("on_dolgu", "AREA", Vector((-2.5, -16.0, 8.0)), 1700, 4300, boyut=(4.0, 3.0), yon=Vector((1.8, 16.0, -6.6)), spread=50)
    # 2) soğuk kenar ışığı: arkadan, 6.500 K, düşük
    isik("kenar", "AREA", Vector((1.5, 13.0, 9.5)), 1800, 6500, boyut=(9.0, 2.0), yon=Vector((0, -11.5, -8.5)))
    # 3) hol dolgusu (B kararı 3): lineer armatürlerin ve ışıklıkların toplam katkısı, stant anahtar ışığının ~%8–10'u
    #    (çatı altında geniş alan ışığı; ~2,4 W/m²). A turunda 900 W (~%0,4) → hol siyah boşluktu.
    isik("hol_dolgu", "AREA", Vector((0, 0, 11.5)), HOL_DOLGU, 6000, rot=(0, 0, 0), boyut=(70.0, 70.0))
    # komşu stantların kendi tavan ışıkları: gölgesiz, yumuşak, 3.800 K; ~3,5 W/m²
    for i, (loc, (sx, sy), k) in enumerate(KOMSU_ISIK):
        o = isik(f"komsu_isik_{i}", "AREA", loc, KOMSU_W_M2 * sx * sy * k, 4500, rot=(0, 0, 0), boyut=(sx, sy))
        o.data.use_shadow = False
    # 4) stantın kendi ışıkları (montajda yanar): fasya iç yüzünde ray spotları, 3.000 K
    duvar_spot = [
        ("on", (-5.6, -4.55), (0.0, 1.0)), ("on", (-1.6, -4.55), (0.0, 1.0)), ("on", (1.2, -4.55), (0.3, 1.0)),
        ("sol", (-7.1, -2.8), (1.0, 0.1)), ("sol", (-7.1, 2.4), (1.0, 0.0)),
        ("arka", (-4.8, 4.55), (0.1, -1.0)), ("arka", (0.0, 4.55), (0.0, -1.0)), ("arka", (4.6, 4.55), (0.0, -1.0)),
        ("sag", (7.1, 3.0), (-1.0, 0.0)), ("sag", (7.1, -2.0), (-1.0, 0.0)),
    ]
    ISIK["duvar_spotlar"] = []
    for i, (duvar, (x, y), (dx, dy)) in enumerate(duvar_spot):
        o = isik(f"spot_{duvar}_{i}", "SPOT", Vector((x, y, Z0 + 3.85)), 140, 3000, spot=(60, 0.7), yon=Vector((dx * 1.6, dy * 1.6, -3.0)), yumusak=0.05)
        ISIK["duvar_spotlar"].append((duvar, o))
    # banko ışığı: ön fasyadan, kadrajın sol üstünden (+X, −Y)
    # nötr (5.200 K) ve güçlü: kapak kâğıdı ~#F2EFEA kalsın (DOM kapakla çapraz sönmede ton sıçraması olmasın)
    # konum: ön bandın (z 2,77–3,17) altında, girişin iç yüzünde; son karede kadrajın sol üstünden gelir
    # yayın yansıma doğrultusundan ~40° uzakta (kâğıtta parlama perdesi olmasın), kadrajın sol üstünden
    isik("banko_spot", "SPOT", BANKO_C + Vector((0.30, -1.05, 2.40)), 240, 6000, spot=(34, 0.95), yon=Vector((-0.30, 1.05, -1.34)), yumusak=0.10)
    # B kararı 4: broşür vurgu spotu (22°, çok yumuşak kenar — 15°/0,55 masada sert ışık havuzu çiziyordu; aynı doğrultudan): kâğıt render'da ≥ #ECE8E4 olsun diye kapağa
    # çevresindeki meşeden ~3 kat ışık (AgX'te #F4F2F0 için sahne doğrusal ~9; meşe #C9A47A için ~1,3 / 0,68 / 0,19)
    isik("brosur_spot", "SPOT", BANKO_C + Vector((0.26, -0.92, 2.36)), BROSUR_SPOT_W, 6000, spot=(22, 0.85),
         yon=Vector((-0.26, 0.92, -(2.36 - BANKO_H))), yumusak=0.06)
    # 5) rotunda tepe ışığı 3.200 K + kanopi altı LED 4.000 K (montajda kanopiyle yanar)
    isik("rotunda_tepe", "SPOT", RC + Vector((0, -0.1, 3.35)), 560, 3200, spot=(78, 0.85), yon=Vector((0, 0.05, -1)), yumusak=0.25)
    ISIK["kanopi_led"] = []
    for i in range(16):
        th = 2 * math.pi * (i + 0.5) / 16
        p = RC + Vector(((R_KANOPI - 0.12) * math.cos(th), (R_KANOPI - 0.12) * math.sin(th), KANOPI_ALT - 0.02))
        o = isik(f"kanopi_led_{i}", "SPOT", p, 26, 4000, spot=(45, 0.9), yon=Vector((-0.25 * math.cos(th), -0.25 * math.sin(th), -1)), yumusak=0.04)
        ISIK["kanopi_led"].append(o)
    # 7) E turu duvar yıkama spotları (brief §12.3): kuzey (arka duvar) ve batı (sol duvar); isik_durum "kuzey" / "bati"
    ISIK["yikama"] = {"kuzey": [], "bati": []}
    for y_ in YIKAMA:
        o = isik(y_["ad"], "SPOT", y_["konum"], a.yikama_w, 3000, spot=(35, 0.6), yon=y_["hedef"] - y_["konum"], yumusak=0.04)
        if a.yikama_golge != 1.0:
            o.data.shadow_maximum_resolution = o.data.shadow_maximum_resolution / max(0.05, a.yikama_golge)
        ISIK["yikama"][y_["grup"]].append(o)
    # 6) oyun masası üstleri: yukarı bakan yumuşak ışık (emisyonun etrafa yayılımı; iki motorda aynı)
    for j, (cx, cy) in enumerate(((PX(0.299), PY(0.858)), (PX(0.5175), PY(0.858)))):
        isik(f"masa_isik_{j}", "AREA", Vector((cx, cy, Z0 + 0.79)), 25, 4000, rot=(math.pi, 0, 0), boyut=(0.86, 0.86))


# ================================================================== KAMERA YOLLARI
def kam_ac(psi_deg, phi_deg):
    """Pusula yönü ψ (kuzeyden doğuya), eğim φ (aşağı negatif) → Euler."""
    return Euler((math.radians(90 + phi_deg), 0, math.radians(-psi_deg)), "XYZ")


def ileri(psi_deg, phi_deg):
    p, f = math.radians(psi_deg), math.radians(phi_deg)
    return Vector((math.sin(p) * math.cos(f), math.cos(p) * math.cos(f), math.sin(f)))


def yon_aci(v):
    v = Vector(v).normalized()
    return math.degrees(math.atan2(v.x, v.y)), math.degrees(math.asin(max(-1, min(1, v.z))))


T4 = Vector((-0.3, 0.1, Z0 + 1.35))        # d4 konum hedefi: stant merkezi (patlatılmış parçaların ortası); bakış eğimi ayrıca ortalanır
PSI4 = 10.0                                 # d4 yönü: hafif 3/4 (kamera sol önde)
P4_Z = 11.0


def p4_kamera_coz(cam):
    """d4 kamerası: 11 m'de, ψ = 10°, 18 mm; eğim, patlatılmış stantın (duvarlar 0,6 m dışarıda) dikey kadrajdaki
    genişliği --p4_genislik (varsayılan %85 = 918 master px) olacak biçimde ikiye bölmeyle bulunur. R3'ün '≤ %70' kuralı
    kendi '11 m, 13 m geride, kadraj ~19 m' sayılarıyla çelişiyor (15 m / 19 m = %79, patlatılmış %85): %85 seçildi."""
    hedef = a.p4_genislik * 1080
    # patlatılmış durumdaki gerçek stant ağlarının köşe noktaları (bitkiler hariç)
    for p in PARCALAR:
        l_, r_ = parca_durum(p, None, 0.0)
        p["o"].location = l_
        p["o"].rotation_euler = r_
    bpy.context.view_layer.update()
    ex = []
    for o in COL["stant"].objects:
        # E turu baskı / ekran / yıkama armatürleri hariç: P4 (ve l4/t45/t34b kadrajı) D turuyla bire bir kalsın
        if o.type != "MESH" or o.name.startswith(("bitki_", "brosur_", "baski_", "ekran_soz", "yikama_")):
            continue
        mw = o.matrix_world
        for c in o.bound_box:
            ex.append(mw @ Vector(c))
    cam.data.lens = P4_LENS

    def genislik(phi):
        d = (P4_Z - T4.z) / math.sin(math.radians(-phi))
        pos = T4 - ileri(PSI4, phi) * d
        cam.location = pos
        cam.rotation_euler = kam_ac(PSI4, phi)
        bpy.context.view_layer.update()
        xs = [world_to_camera_view(sc, cam, v).x for v in ex]
        return (max(xs) - min(xs)) * 1920, pos

    lo, hi = -55.0, -20.0     # dik → geniş, yatık → dar
    for _ in range(40):
        mid = (lo + hi) / 2
        g, _ = genislik(mid)
        if g > hedef:
            lo = mid          # fazla geniş → daha yatık (φ büyür)
        else:
            hi = mid
    if a.p4_egim:
        hi = a.p4_egim
    g, pos = genislik(hi)
    # konum sabit; bakış eğimi, stant kutusunun dikey ortası master y %51'e gelecek biçimde ayarlanır (özne y %30–72)
    phi = hi
    for _ in range(30):
        cam.rotation_euler = kam_ac(PSI4, phi)
        bpy.context.view_layer.update()
        ys = [1 - world_to_camera_view(sc, cam, v).y for v in ex]
        orta = (min(ys) + max(ys)) / 2
        if abs(orta - 0.51) < 0.002:
            break
        phi -= (orta - 0.51) * 40.0
    cam.rotation_euler = kam_ac(PSI4, phi)
    bpy.context.view_layer.update()
    ys = [1 - world_to_camera_view(sc, cam, v).y for v in ex]
    xs = [world_to_camera_view(sc, cam, v).x for v in ex]
    return {"konum": pos, "psi": PSI4, "phi": phi, "lens": P4_LENS, "genislik_px": (max(xs) - min(xs)) * 1920,
            "y_aralik": (min(ys), max(ys)), "x_aralik": (min(xs), max(xs))}


# d5 kamera: halka (Ø 2,04 m) y %31–67'de; yükseklik 2,65 m, girişe doğru 0,70 m, eğim −78°, 18 mm (bkz. JSON notu)
P5 = {"konum": RC + Vector((0, -0.70, 2.65)), "psi": 0.0, "phi": -78.0, "lens": 18.0}
PSI_SON = -150.0   # t56 son yönü: rotundadan bankoya süzülüş doğrultusu (~−142°) yakını; yığın da bu yöne döndürülür


# F (§13.2 t34): parlama 3 kareye iner (parlama.py PARLAMA_KARE 3; F-B t34 kare 36–38, E 48–55); ilk 3 kare (B → B+3,
# parlamanın içi) hızlı — S1 dalışının devamı —, kare B+3'ten (ilk temiz kare) B+23'e easeOutCubic çıkış (E'nin eğrisi)
# korunur (B = T34B_BAS: F-B 36, E 48). İlerleme P: kare B–B+3 hız v0'dan v1'e doğrusal azalır (P1'e varır), B+3–B+23
# P = P1 + (1 − P1)·(1 − (1 − y)³) (y = (f − B − 3) / 20; B+3'te hız v1, C¹). z E'deki gibi önde: 1 − (1 − P)^(4/3)
# (E: quart ↔ cubic). P1 ölçümle: ilk temiz kareden sonra kenar akışı ≤ 150 px/kare (deklanşör 0,5). F-B: yalnız kare
# numaraları 12 geri kaydı (S1 t34a 36 kare); eğri, uç pozlar ve 24 kare F-A ile aynı (kare 36 ≡ F-A/E kare 48).
T34B_P1 = 0.63


def t34b_s(f):
    """t34b ilerlemesi (xy / ψ / φ; z bundan türer). E: easeOutCubic((f − 48) / 23)."""
    if PROFIL == "eski":
        return 1 - (1 - O.clamp01((f - T34B_BAS) / 23.0)) ** 3
    P1 = float(PEN_EK.get("t34b.P1", T34B_P1))
    v1 = 3.0 * (1.0 - P1) / 20.0
    v0 = 2.0 * P1 / 3.0 - v1
    d = f - float(T34B_BAS)
    if d <= 0:
        return 0.0
    if d < 3.0:
        return v0 * d + (v1 - v0) * d * d / 6.0
    y = O.clamp01((d - 3.0) / 20.0)
    return P1 + (1.0 - P1) * (1.0 - (1.0 - y) ** 3)


def t34b_poz(f, P4, hol):
    """t34 kare B–B+23 (F-B 36–59, E 48–71): ışıklık bandının içinden (13,85 m, −70°, ψ4−25°) P4'e; z önde (easeOutQuart),
    yatay easeOutCubic, açılar easeOutCubic. Başlangıç hızı yüksek (S1 dalışının devamı), son 0,25 s yumuşak iniş.
    F: bkz. t34b_s (ilk 3 kare parlamanın içinde hızlı)."""
    tau = O.clamp01((f - T34B_BAS) / 23.0)
    bas_xy = Vector((P4["konum"].x - 1.2, hol["y_bas"], 0))
    if PROFIL == "eski":
        z = O.lerp(13.85, P4["konum"].z, 1 - (1 - tau) ** 4)
        s = 1 - (1 - tau) ** 3
    else:
        s = t34b_s(f)
        z = O.lerp(13.85, P4["konum"].z, 1 - (1 - s) ** (4.0 / 3.0))
    xy = bas_xy.lerp(Vector((P4["konum"].x, P4["konum"].y, 0)), s)
    psi = O.lerp(P4["psi"] - 25.0, P4["psi"], s)
    phi = O.lerp(-70.0, P4["phi"], s)
    return Vector((xy.x, xy.y, z)), psi, phi, P4_LENS


def t45_yol(P4):
    """Vinç (P4) → giriş önü → ön açıklık (z 3,0, kare ~31) → kanopi kenarı altı (~1,35 s) → P5.
    Yol Catmull-Rom; ilerleme, hedefe uzaklığın ln'i easeInOutSine olacak biçimde yay uzunluğundan eşlenir."""
    p0 = P4["konum"]
    p5 = P5["konum"]
    W1 = Vector((-2.6, -10.5, 5.6))
    W2 = Vector((-1.55, -5.6, 3.05))
    W3 = Vector((RC.x, RC.y - R_KANOPI - 0.1, Z0 + 2.45))   # sütun tepesi 2,35 ile kanopi altı 2,80 arası
    pts = [p0 + (p0 - W1) * 0.3, p0, W1, W2, W3, p5, p5 + (p5 - W3) * 0.3]

    def cr(i, t):
        P0, P1, P2, P3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        t2, t3 = t * t, t * t * t
        return 0.5 * ((2 * P1) + (-P0 + P2) * t + (2 * P0 - 5 * P1 + 4 * P2 - P3) * t2 + (-P0 + 3 * P1 - 3 * P2 + P3) * t3)

    ornek = []
    for i in range(1, len(pts) - 2):
        for k in range(200):
            ornek.append(cr(i, k / 200))
    ornek.append(pts[-2])
    L = [0.0]
    for i in range(1, len(ornek)):
        L.append(L[-1] + (ornek[i] - ornek[i - 1]).length)
    return ornek, L


HEDEF5 = P5["konum"] + ileri(0.0, -78.0) * 2.7


def t45_yay(f):
    """F (fiske): t45 yay ilerlemesi a_f = fiske(u) (§13.2 "t45: fiske (yay ilerlemesi)"). E'de yay oranı, ln(uzaklık)
    easeInOutSine'dan türer (bkz. t45_poz)."""
    return ilerleme(f, N_T45, "t45")


def t45_s(f):
    """t45 hedef/lens/ışık ilerlemesi s: hedefe uzaklığın ln'i (E tanımı). E (eski): easeInOutSine(f / 59). F: kameranın
    fiske yay konumundaki ln-uzaklık ilerlemesi — bakış hedefi, lens ve ışık devri yolun her noktasında E ile aynı."""
    if PROFIL == "eski":
        return O.ease_in_out_sine(f / 59.0)    # son kare (59) = yolun sonu (u = 1); hız sonda 0
    L = YOL45[1]
    d0, d1 = L[-1] + 2.7, 2.7
    d = L[-1] * (1.0 - t45_yay(f)) + 2.7
    return (math.log(d0) - math.log(d)) / (math.log(d0) - math.log(d1))


def t45_saat(f):
    """t45 ışık saati (s): E'de gerçek zaman f / 30. F'de ilerlemeye bağlı: s'ye E'nin hangi anında varılıyorsa o an
    (isik_durum eşikleri E saatinde; yumuşak kutu → rotunda tepe devri kameranın aynı konumunda olur)."""
    if PROFIL == "eski":
        return f / 30.0
    return O.sine_ters(t45_s(f)) * 59.0 / 30.0


def montaj_kur():
    """F: montaj (PARCALAR t0 / sure, E saatinde) fiske zaman eğrisiyle sıkıştırılır. E'deki olay anı τ (s) klibin
    oranına çevrilir (r = τ / (59/30)), --montaj_c ile ölçeklenir ve fiske'nin tersinden yeni gerçek zamana taşınır:
    t' = T · fiske⁻¹(c · r). Mıknatıs %2 aşma + 120 ms yerleşme (gerçek zaman) korunur (O.miknatis). Amaç: bütün
    parçalar kamera kanopi kenarının (R 2,25) altına girmeden yerinde (bkz. --kamera_dok 'montaj')."""
    T, T_eski = N_T45 / 30.0, 59.0 / 30.0
    ak = a.fiske_a * 30.0 / N_T45
    kk = fiske_k("t45")
    for p in PARCALAR:
        if PROFIL == "eski":
            p["t0_f"], p["sure_f"] = p["t0"], p["sure"]
            continue
        b = T * O.fiske_ters(a.montaj_c * p["t0"] / T_eski, ak, kk)
        s_ = T * O.fiske_ters(a.montaj_c * (p["t0"] + p["sure"]) / T_eski, ak, kk)
        p["t0_f"], p["sure_f"] = b, s_ - b


def t45_poz(f, P4, yol):
    t = f / 30.0
    ornek, L = yol
    # ilerleme: ln(hedef uzaklığı) easeInOutSine; uzaklık ~ kalan yay + 2,7 m. F: yay oranı fiske (t45_yay), s ondan.
    d0 = L[-1] + 2.7
    d1 = 2.7
    s = t45_s(f)
    if PROFIL == "eski":
        d = math.exp(math.log(d0) + (math.log(d1) - math.log(d0)) * s)
        kalan = d - 2.7
        hedef_L = max(0.0, L[-1] - kalan)
    else:
        hedef_L = L[-1] * t45_yay(f)
    import bisect
    i = min(len(L) - 1, max(1, bisect.bisect_left(L, hedef_L)))
    u = (hedef_L - L[i - 1]) / max(1e-9, L[i] - L[i - 1])
    pos = ornek[i - 1].lerp(ornek[i], u)
    return pos, s


# F-B (§13.5 t45): eğim gecikmesi ilerleme biriminde, son devir son 8 karede → son 3 kare ≤ 6 / 3 / 0 px. F-A'da gecikme
# 4,5 kare (zaman) ve devir son 4 kareydi: fiske kuyruğunda kamera 4,5 kare önce ~0,15–0,4 m gerideydi, devir 4 karede
# 3–5° döndürüyordu (son 3 kare 51,7 / 30,9 / 5,3 px). F-B: gecikmeli eğim, yay ilerlemesinde a_g = a − λ·(1 − a)
# noktasından okunur ("ilerleme birimi": gecikme kalan yolla orantılı → yolun sonunda kendiliğinden 0; λ, kalkıştan
# sonraki hızlı fazda E'nin 4,5 karelik gecikmesine denk seçildi, bkz. rapor). Devir: son `devir` karenin ilerleme
# penceresinde (a(N − devir) → 1) smoother; ağırlık ilerlemeye bağlı olduğu için sonda hem a' hem w' sıfıra iner.
T45_GEC = {"tip": "ilerleme", "lam": 0.10, "kare": 4.5, "devir": 8.0, "devir_tip": "ilerleme"}


def t45_gec(ad):
    v = PEN_EK.get(f"t45.{ad}", T45_GEC[ad])
    return v if isinstance(v, str) else float(v)


def t45_konum_yay(a_, yol):
    """F: yay ilerlemesi a_ (0–1) → (konum, s_ln) (t45_poz'un fiske dalı, kare yerine ilerlemeden)."""
    import bisect
    ornek, L = yol
    hedef_L = L[-1] * O.clamp01(a_)
    i = min(len(L) - 1, max(1, bisect.bisect_left(L, hedef_L)))
    u = (hedef_L - L[i - 1]) / max(1e-9, L[i] - L[i - 1])
    d0, d1 = L[-1] + 2.7, 2.7
    d = L[-1] * (1.0 - O.clamp01(a_)) + 2.7
    return ornek[i - 1].lerp(ornek[i], u), (math.log(d0) - math.log(d)) / (math.log(d0) - math.log(d1))


def t45_kamera(f, P4, yol):
    pos, s = t45_poz(f, P4, yol)
    # bakış hedefi: T4 → HEDEF5 (aynı ilerleme), eğim 0,15 s geriden
    T4b = P4["konum"] + ileri(P4["psi"], P4["phi"]) * (T4 - P4["konum"]).length
    hed = T4b.lerp(HEDEF5, O.smoother(s))
    psi, phi = yon_aci(hed - pos)
    if PROFIL == "eski":
        pos_g, s_g = t45_poz(max(0, f - 4.5), P4, yol)
    else:
        a_ = t45_yay(f)
        if t45_gec("tip") == "ilerleme":
            a_g = max(0.0, a_ - t45_gec("lam") * (1.0 - a_))
        else:   # "zaman": E'nin 4,5 karesi klip oranıyla (F-A: 4,5 kare)
            a_g = t45_yay(max(0.0, f - t45_gec("kare") * N_T45 / 59.0))
        pos_g, s_g = t45_konum_yay(a_g, yol)
    hed_g = T4b.lerp(HEDEF5, O.smoother(s_g))
    _, phi_g = yon_aci(hed_g - pos_g)
    # B: geriden gelen eğim son karede P5'e (−78°) tek karede ~1,5° sıçrıyordu (kare 58→59 ΔE00 ort. 8,4, 57→58 4,5;
    # t45[59] ↔ l5[0] ΔE00 1,45). Son 4 karede (56–59) gecikme anlık eğime yumuşakça devredilir; kare ≤ 55 değişmez.
    # F-B: devir son 8 karede (T45_GEC), ağırlık ilerleme penceresinde; son kare P5 bire bir (konum dahil).
    n = 59 if PROFIL == "eski" else N_T45
    if PROFIL == "eski":
        if f > n - 4:
            phi_g = O.lerp(phi_g, phi, O.smoother((f - (n - 4)) / 4.0))
    else:
        dv = t45_gec("devir")
        if f > n - dv:
            if t45_gec("devir_tip") == "ilerleme":
                a0 = t45_yay(n - dv)
                w = O.smoother((t45_yay(f) - a0) / max(1e-9, 1.0 - a0))
            else:
                w = O.smoother((f - (n - dv)) / dv)
            phi_g = O.lerp(phi_g, phi, w)
    if f >= n:
        psi, phi_g = P5["psi"], P5["phi"]
        if PROFIL != "eski":
            pos = P5["konum"].copy()
    lens = O.lerp(P4_LENS, 18.0, O.smoother(s))     # P4 14 mm → P5 18 mm
    return pos, psi, phi_g, lens, (hed - pos).length


_CR_ON = {}


def cr_ornek(pts, n=200):
    """Catmull-Rom (düzgün parametre) örnekleri + yay uzunluğu tablosu; pts[0] ve pts[-1] hayalet noktalar.
    F: aynı noktalar için önbellek (sonuç değişmez; --kamera_dok / --carpisma binlerce çağrı yapar)."""
    anahtar = (n,) + tuple(tuple(p) for p in pts)
    if anahtar in _CR_ON:
        return _CR_ON[anahtar]
    _CR_ON[anahtar] = _cr_ornek(pts, n)
    return _CR_ON[anahtar]


def _cr_ornek(pts, n=200):
    def cr(i, tt):
        P0, P1, P2, P3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        t2, t3 = tt * tt, tt * tt * tt
        return 0.5 * ((2 * P1) + (-P0 + P2) * tt + (2 * P0 - 5 * P1 + 4 * P2 - P3) * t2 + (-P0 + 3 * P1 - 3 * P2 + P3) * t3)

    ornek = []
    for i in range(1, len(pts) - 2):
        for k in range(n):
            ornek.append(cr(i, k / n))
    ornek.append(pts[-2])
    L = [0.0]
    for i in range(1, len(ornek)):
        L.append(L[-1] + (ornek[i] - ornek[i - 1]).length)
    return ornek, L


def cr_konum(ornek, L, s):
    """Yay uzunluğu oranı s (0–1) → konum."""
    import bisect
    hl = s * L[-1]
    i = min(len(L) - 1, max(1, bisect.bisect_left(L, hl)))
    uu = (hl - L[i - 1]) / max(1e-9, L[i] - L[i - 1])
    return ornek[i - 1].lerp(ornek[i], uu)


def duvar_mesafe(pos, fw, en_cok=12.0):
    """Bakış ışınının stant zeminine (Z0), arka iç düzleme (y 4,83) ya da sol iç düzleme (x −7,38) ilk değdiği uzaklık
    (d6/d7 kadraj ve odak hedefi: duvar düzlemi; aşağı bakarken zemin)."""
    ts = []
    if fw.z < -1e-6:
        ts.append((Z0 - pos.z) / fw.z)
    if fw.y > 1e-6:
        ts.append((Y_ARKA_IC - pos.y) / fw.y)
    if fw.x < -1e-6:
        ts.append((X_SOL_IC - pos.x) / fw.x)
    ts = [t for t in ts if t > 0]
    return max(0.3, min(en_cok, min(ts))) if ts else en_cok


# banko_kamera: D turu t56'sının (P5 → sütun aralığı −120° → banko üstü, 72 kare) genelleştirilmiş hâli. Yolun başı (`bas`)
# ve yön/eğim profili (`pr`) parametre; kuyruk (Dn → E → son, PSI_SON, −90°, 85 mm, D_SON, odak/diyafram) ortak.
# ESKI_T56 profiliyle eski t56_kamera'yı bire bir verir (73 kare karşılaştırıldı); t78 kuyruğu bu fonksiyonun çağrısı.
def banko_noktalari():
    D_SON = BROSUR_W * 1920 / (708 * 36 / 85)          # ~0,955 m (B kararı 4: kapak x 606–1314, y 460–1460)
    ust = S_["brosur_ust_z"]
    br_c = Vector((BANKO_C.x, BANKO_C.y, ust))
    kay = 0.0                                 # kapak merkezi = kare merkezi
    son = br_c - ileri(PSI_SON, 0.0) * kay + Vector((0, 0, D_SON))
    Dn = Vector((BANKO_C.x + 1.05, BANKO_C.y + 1.25, Z0 + 1.62))
    E = son + Vector((0, 0.10, 0.06))
    return Dn, E, son, ust


def zaman_egrisi(u, rampa=0.0):
    """Yay ilerlemesi s(u). rampa 0 → easeInOutSine (eski t56; tepe hız ortalamanın π/2 katı). rampa a > 0 → iki uçta
    a süreli sinüs rampalı yamuk hız (tepe 1/(1 − a) kat; ör. 0,3 → %9 düşük tepe); uçlarda hız yine 0."""
    u = O.clamp01(u)
    if rampa <= 0:
        return O.ease_in_out_sine(u)
    v = 1.0 / (1.0 - rampa)
    def bas_(x):
        return v * (x / 2 - rampa / (2 * math.pi) * math.sin(math.pi * x / rampa))
    if u < rampa:
        return bas_(u)
    if u > 1 - rampa:
        return 1.0 - bas_(1 - u)
    return v * (rampa / 2 + (u - rampa))


# F (t78): pencereler yay ilerlemesi s üzerinde (E'de u üzerindeydi; E'nin konum eşdeğerleri s = sine(u): ψ 0–0,685,
# φ 0–0,238 / 0,238–0,685 / 0,685–1, lens 0,42–1, odak düzlemi 0,42–0,976, diyafram 0,5–1, ışık 0,146–0,655). ψ ve ilk iki φ
# parçası fiske kalkışındaki tepe dönüş hızını düşürmek için genişletildi; iniş (φ −30 → −90, lens 18 → 85) s 0,97'de biter →
# son ~15 kare yalnız düşey iniş (T78_KUYRUK_FISKE; bakış ekseni boyunca, ekranda saf yakınlaşma).
# F: kuyruk ara noktaları (son'a göre). E turu / eski t56: tek nokta E = son + (0; 0,10; 0,06) — son yaklaşım %86 yanal,
# 85 mm'de son kareler 13 / 7 / 2 px (§13.1 ≤ 6 / 3 / 0 tutmaz). F: broşürün tam üstünde iki nokta → son parça düz düşey
# iniş (bakış ekseni boyunca; ekranda yalnız yakınlaşma). Son kare (son, ψ −150, φ −90, 85 mm) değişmez.
T78_KUYRUK_FISKE = [(0.0, 0.0, 0.30), (0.0, 0.0, 0.12)]
T78_PEN = {"psi": (0.0, 0.90), "phi1": (0.0, 0.50), "phi2": (0.50, 0.75), "phi3": (0.75, 0.97), "lens": (0.42, 0.97),
           "odak": (0.42, 0.95), "fstop": (0.5, 0.97), "isik": (0.146, 0.655)}


def banko_kamera(f, n_son, bas, pr):
    u = f / float(n_son)                      # son kare = u 1
    Dn, E, son, ust = banko_noktalari()
    kuyruk = [E]
    if pr.get("fiske") and PROFIL == "fiske":   # F: kuyruğun son yaklaşımı (bkz. T78_KUYRUK_FISKE)
        kuyruk = [son + Vector(v) for v in PEN_EK.get("t78.kuyruk", T78_KUYRUK_FISKE)]
        E = kuyruk[-1]
    pts = [bas[0] + (bas[0] - bas[1]) * 0.4] + list(bas) + [Dn] + kuyruk + [son, son + (son - E)]
    ornek, L = cr_ornek(pts)
    if pr.get("fiske") and PROFIL == "fiske":
        # F (t78): yay ilerlemesi fiske; ψ / φ / lens / odak / diyafram pencereleri ilerleme s'ye bağlı (T78_PEN)
        s = ilerleme(f, n_son, "t78")
        pos = cr_konum(ornek, L, s)
        P = {k_: pen(T78_PEN, k_, "t78") for k_ in T78_PEN}
        x_psi = pencere(s, *P["psi"])
        parca_phi = 0 if s < P["phi2"][0] else (1 if s < P["phi3"][0] else 2)
        x_phi = pencere(s, *P[("phi1", "phi2", "phi3")[parca_phi]])
        x_lens, x_odak, x_f = pencere(s, *P["lens"]), pencere(s, *P["odak"]), pencere(s, *P["fstop"])
    else:
        pos = cr_konum(ornek, L, zaman_egrisi(u, pr.get("rampa", 0.0)))
        a0, du = pr["psi_u"]
        x_psi = (u - a0) / du
        parca_phi = 0 if u < 0.34 else (1 if u < 0.62 else 2)
        x_phi = (u / 0.34, (u - 0.34) / 0.28, (u - 0.62) / 0.38)[parca_phi]
        x_lens, x_odak, x_f = (u - 0.45) / 0.55, (u - 0.45) / 0.45, (u - 0.5) / 0.5
    # yön: ψ0 → PSI_SON; eğim üç parça (eski: −78 → −26 → −32, sonra −30 → −90 easeInOutCubic)
    psi = O.lerp(pr["psi0"], PSI_SON, O.ease_in_out_sine(x_psi))
    p0, p1, p2, p3 = pr["phi"]
    if parca_phi == 0:
        phi = O.lerp(p0, p1, O.ease_in_out_sine(x_phi))
    elif parca_phi == 1:
        phi = O.lerp(p1, p2, O.ease_in_out_sine(x_phi))
    else:
        phi = O.lerp(p3, -90.0, O.ease_in_out_cubic(x_phi))
    # odak uzaklığı: 18 → 85 mm, ln uzayında, u 0,45–1
    lens = math.exp(math.log(18) + (math.log(85) - math.log(18)) * O.ease_in_out_sine(x_lens))
    if f >= n_son:
        pos, psi, phi, lens = son, PSI_SON, -90.0, 85.0
    # odak: bakış doğrultusunun hedef düzlemi (zemin → broşür üstü) ile kesişimi; diyafram f/16 → f/2 (l5 dikişi keskin)
    fw = ileri(psi, phi)
    z_h = O.lerp(Z0, ust, O.smoother(x_odak))
    if pr["odak"] == "duvar":                 # t78: B pozundaki (t67 sonu) duvar odağından sürekli
        d_d = duvar_mesafe(pos, fw, 8.0)
        odak = min(d_d, max(0.3, min(8.0, (pos.z - z_h) / -fw.z))) if fw.z < -0.05 else d_d
    elif fw.z < -0.05:
        odak = max(0.3, min(8.0, (pos.z - z_h) / -fw.z))
    else:
        odak = 4.0
    fstop = math.exp(math.log(16) + (math.log(2) - math.log(16)) * O.ease_in_out_sine(x_f))
    if f >= n_son:
        odak, fstop = pos.z - ust, 2.0
    return pos, psi, phi, lens, odak, fstop


# D turu t56 (eski): P5 → göz hizası → sütun aralığı (−120°) → banko üstü; p8 plakası ve t78 sonu bunun 71. karesi
ESKI_T56 = {"psi0": 0.0, "psi_u": (0.12, 0.76), "phi": (-78.0, -26.0, -32.0, -30.0), "odak": "eski"}


def eski_t56_kamera(f):
    A = P5["konum"]
    B = Vector((RC.x - 0.55, RC.y - 0.95, Z0 + 1.62))   # dönüş ve iniş
    C = Vector((RC.x + R_SUTUN * math.cos(math.radians(-120)), RC.y + R_SUTUN * math.sin(math.radians(-120)), Z0 + 1.55))
    return banko_kamera(f, T56_ESKI_SON, [A, B, C], ESKI_T56)


# ---- E turu: t56 (P5 → A), t67 (A → B), t78 (B → banko)
RAD120 = Vector((math.cos(math.radians(120)), math.sin(math.radians(120)), 0))


def t56_noktalari():
    """P5 → (u 0–0,30) baş kalkar, z 1,75, (−1,68; 1,27) → (u 0,30–0,60) 120° sütun aralığı (R 2,10'da radyal geçiş;
    krom yok, iki yanda ≥ 0,30 m) → dışarıda batıya kayma + geri çekilme → A. Brief'teki (−1,75; 1,25) ve (−2,41; 2,51)
    120° radyal doğrusuna oturtuldu (geçiş sütun aralığına dik olsun diye)."""
    P1 = RC + RAD120 * 0.60 + Vector((0, 0, 1.75))
    G = RC + RAD120 * R_SUTUN + Vector((0, 0, 1.60))
    G2 = RC + RAD120 * 2.75 + Vector((0, 0, 1.58))
    if PROFIL == "eski":
        return [P5["konum"], P1, G, G2, Vector((-4.15, 2.85, Z0 + 1.55)), POZ_A["konum"]]
    # F-B: aşırtma noktası (A'nın güneybatısı) ve isteğe bağlı ara noktalar (G2 → Wk arası; bitki/totem payı)
    wk = PEN_EK.get("t56.Wk", T56_FISKE["Wk"])
    Wk = Vector((wk[0], wk[1], Z0 + (wk[2] if len(wk) > 2 else T56_FISKE["z"])))
    ara = [Vector((p[0], p[1], Z0 + (p[2] if len(p) > 2 else T56_FISKE["z"]))) for p in PEN_EK.get("t56.ara", T56_FISKE["ara"])]
    on = [Vector((p[0], p[1], Z0 + p[2])) for p in PEN_EK.get("t56.on", T56_FISKE["on"])]   # Wk ile A arası (iniş biçimi)
    return [P5["konum"], P1, G, G2] + ara + [Wk] + on + [POZ_A["konum"]]


# F (fiske): pencereler yay ilerlemesi s üzerinde (s = konum; E'de s = sine(u)). E'nin konum eşdeğerleri: ψ1 s 0,035–0,578,
# ψ2 / φ2 s 0,655–1, kuzey s 0,578–0,994, φ1 (baş kalkar) s 0–0,206. Fiske kalkışında baş kalkışı + ψ1 + hızlı öteleme üst
# üste biniyordu (kenar akışı 510 px/kare): φ1 s 0–0,60'a yayıldı (sütun aralığında, s ≈ 0,50, φ ≈ −11°), ψ1 s 0,30–0,65'e
# kaydırıldı (baş kalkarken dönme yok) → 423 (tarama f-s2/tara*.txt). Pencere içi easeInOutSine (E ile aynı).
T56_PEN = {"psi1": (0.30, 0.65), "psi2": (0.655, 1.0), "phi1": (0.0, 0.60), "phi2": (0.655, 1.0), "kuzey": (0.578, 0.994)}
# F-B (§13.5 t56, "aşırtmalı yol"): F-A'nın inişi bir uzaklaşmaydı (merkez derinliği orta / son 0,64). Yeni yol: P5 → baş
# kalkar → 120° sütun aralığı (G, G2) → hızlı fazda A'nın güneybatısına aşırt (Wk) → inişte A'ya YAKLAŞARAK gel. Wk
# orkestratör adayları (−4,9; 1,0) / (−5,1; 0,9) / (−5,2; 0,8) totem paneline (x −5,03…−4,93, y 0,12…1,22, z 0,19…2,39)
# 0,03–0,17 m'de (çarpışma ✗). Totemin BATISI (t78 bölgesi, ör. (−5,6; 1,1)): dönüş totemin kuzey ucundan doğuya yanal
# kayma olur → duvar bloğu son %40'ta ×0,95 (küçülür) ✗. Seçilen: totemin DOĞUSU, A'nın güneyi; döngü (A'nın batısından
# aşağı, dipten doğuya, güney-güneydoğudan A'ya). Yol: G2 → ara (−4,40; 2,40) (hızlı fazda A'nın 0,5 m kuzeybatısından
# geçer) → Wk (−4,29; 0,79) (dip; totem 0,51 m) → on (−3,96; 0,86) (dönüş; sütun 1'e ≥ 0,45 m) → A: son yaklaşma bakış
# eksenine yakın → merkez derinliği orta / son 1,24, blok (fidan ↔ genç iklim) son %40'ta ×1,36, ψ s 0,655–1 easeInOutSine
# ile −18'e. İlk deneme (Wk (−4,5; 0,75), on (−4,15; 0,9); önizleme render/_onizleme/s2-f2-t56-v1.png): kare 29–31'de
# totem dikey kırpımın %32'sini örttü → dip doğuya alındı (dikey kırpımda totem 0). Tarama: scratchpad f-s2b/t56_model.py,
# t56_tara*.py, tara-g1. Pencereler s üzerinde (T56_PEN_FISKE; F-A ile aynı). Son kare POZ_A bire bir (f ≥ N_T56).
T56_FISKE = {"Wk": (-4.29, 0.79), "z": 1.55, "ara": [(-4.40, 2.40)], "on": [(-3.96, 0.86, 1.55)]}
T56_PEN_FISKE = dict(T56_PEN)


def t56_s(f):
    return O.ease_in_out_sine(O.clamp01(f / float(N_T56))) if PROFIL == "eski" else ilerleme(f, N_T56, "t56")


def t56_kamera(f):
    u = O.clamp01(f / float(N_T56))
    bas = t56_noktalari()
    A = bas[-1]
    pts = [bas[0] + (bas[0] - bas[1]) * 0.4] + bas + [A + (A - bas[-2]) * 0.4]
    ornek, L = cr_ornek(pts)
    if PROFIL == "eski":
        pos = cr_konum(ornek, L, O.ease_in_out_sine(u))     # son 0,25 s yumuşak iniş (easeInOutSine)
        # yön: 0 (u < 0,12; yere bakarken dönme yok) → −27 (u 0,55; radyal geçiş doğrultusu) → −18 (A)
        if u < 0.6:
            psi = O.lerp(P5["psi"], -27.0, O.ease_in_out_sine((u - 0.12) / 0.43))
        else:
            psi = O.lerp(-27.0, POZ_A["psi"], O.ease_in_out_sine((u - 0.6) / 0.4))
        # eğim: −78 → −6 (u 0–0,30, baş kalkar) → −6 → +4 (u 0,60–1)
        if u < 0.6:
            phi = O.lerp(P5["phi"], -6.0, O.ease_in_out_sine(u / 0.30))
        else:
            phi = O.lerp(-6.0, POZ_A["phi"], O.ease_in_out_sine((u - 0.6) / 0.4))
    else:
        s = t56_s(f)
        pos = cr_konum(ornek, L, s)
        P = {k_: pen(T56_PEN_FISKE, k_, "t56") for k_ in T56_PEN_FISKE}
        if s < P["psi2"][0]:
            psi = O.lerp(P5["psi"], -27.0, O.ease_in_out_sine(pencere(s, *P["psi1"])))
        else:
            psi = O.lerp(-27.0, POZ_A["psi"], O.ease_in_out_sine(pencere(s, *P["psi2"])))
        if s < P["phi2"][0]:
            phi = O.lerp(P5["phi"], -6.0, O.ease_in_out_sine(pencere(s, *P["phi1"])))
        else:
            phi = O.lerp(-6.0, POZ_A["phi"], O.ease_in_out_sine(pencere(s, *P["phi2"])))
    if f <= 0:
        pos, psi, phi = P5["konum"].copy(), P5["psi"], P5["phi"]
    if f >= N_T56:
        pos, psi, phi = POZ_A["konum"].copy(), POZ_A["psi"], POZ_A["phi"]
    odak = duvar_mesafe(pos, ileri(psi, phi), 8.0)
    return pos, psi, phi, 18.0, odak, 16.0


# F (§13.2 "duvara yakınlaşma"): A → C (duvardan uzak ara nokta) → B; pan (ψ −18 → −80) ilk yarıda, son yarıda sol
# duvara dolly. Yol Catmull-Rom (A, C, B), yay ilerlemesi s = fiske. Lens 18 sabit, eğim +4 sabit.
# C = B'nin son bakış ekseninin 0,8 m gerisi (≈ B − 0,8·ileri(−80°, 0)): A'nın güneydoğusu, bitki (−3,7; 1,9), sütun 1
# (−3,41; 1,30) ve totemin arasında. "1.000.000+" ölçeği (§13.2: duvar düzlemine uzaklık ve lens) son yarıda (s 0,5 → 1)
# ×1,257 (E ×1,086). Denenenler (scratchpad f-s2/tara5–9): öneri (−3,9; 1,7) ×1,19 (yayın %34'ünde); yay ortasındaki güneyli
# (−3,86; 0,75) ×1,33 ama totem dikey kırpımın %53'ünü kare 13–26'da örtüyordu (ilk önizleme); (−3,30; 1,75) sütun halkasının
# içinde (kanopi 0,06 m ✗). Pan s 0–0,80 (s 0,5'te %69'u bitmiş): 0–0,6'da totem görüntüye giriyor (%13–28) ve kenar akışı
# ~240; 0–0,8'de 191 px/kare, totem 0. Işık devri pan ile.
T67_C = Vector((-3.96, 1.46, Z0 + 1.55))
T67_PEN = {"pan": (0.0, 0.80), "isik": (0.0, 0.80)}


def t67_s(f):
    return O.ease_in_out_sine(f / float(N_T67)) if PROFIL == "eski" else ilerleme(f, N_T67, "t67")


def t67_yol():
    A, B = POZ_A["konum"], POZ_B["konum"]
    C = Vector((*PEN_EK["t67.C"], T67_C.z)) if "t67.C" in PEN_EK else T67_C
    return cr_ornek([A + (A - C) * 0.5, A, C, B, B + (B - C) * 0.5])


def t67_kamera(f):
    """A → B. E (eski): 0,54 m kayma + 62° sola pan (easeInOutSine), eğim +4°, 18 mm. F: A → C → B (bkz. T67_C)."""
    if PROFIL == "eski":
        e = O.ease_in_out_sine(f / float(N_T67))
        pos = POZ_A["konum"].lerp(POZ_B["konum"], e)
        psi = O.lerp(POZ_A["psi"], POZ_B["psi"], e)
        phi = O.lerp(POZ_A["phi"], POZ_B["phi"], e)
    else:
        s = t67_s(f)
        ornek, L = t67_yol()
        pos = cr_konum(ornek, L, s)
        psi = O.lerp(POZ_A["psi"], POZ_B["psi"], O.ease_in_out_sine(pencere(s, *pen(T67_PEN, "pan", "t67"))))
        phi = POZ_A["phi"]
        if f <= 0:
            pos = POZ_A["konum"].copy()
        if f >= N_T67:
            pos, psi, phi = POZ_B["konum"].copy(), POZ_B["psi"], POZ_B["phi"]
    odak = duvar_mesafe(pos, ileri(psi, phi), 8.0)
    return pos, psi, phi, 18.0, odak, 16.0


# t78: B → batıya (totemin kuzey ucunun önünden) → (−6,00; 0,40) → (−6,00; −1,60): totem ile batı duvarı arası (iki yanda
# ≥ 0,95 m) → Dn → E → son. Kuyruk banko_kamera (eski t56 ile aynı fonksiyon ve aynı Dn/E/son); son kare ≡ eski t56[71].
# Wa brief'te yok: B → (−6,00; 0,40) doğrusu totemin kuzey ucunu ~0,11 m'den geçiyordu → önce batıya (çarpışma betiği).
T78_WA = Vector((-5.70, 1.50, Z0 + 1.58))
T78_W1 = Vector((-6.00, 0.40, Z0 + 1.62))
T78_W2 = Vector((-6.00, -1.60, Z0 + 1.62))
T78_PROFIL = {"psi0": POZ_B["psi"], "psi_u": (0.0, 0.62), "phi": (POZ_B["phi"], -16.0, -30.0, -30.0), "odak": "duvar",
              "rampa": a.t78_rampa, "fiske": True}   # fiske: yalnız PROFIL == "fiske" iken (eski: rampa / easeInOutSine)


def t78_kamera(f):
    if f <= 0:   # B pozu (t67 sonu) bire bir
        pos, psi, phi = POZ_B["konum"].copy(), POZ_B["psi"], POZ_B["phi"]
        return pos, psi, phi, 18.0, duvar_mesafe(pos, ileri(psi, phi), 8.0), 16.0
    return banko_kamera(f, N_T78, [POZ_B["konum"], T78_WA, T78_W1, T78_W2], T78_PROFIL)


P_DONGU = 4.0
A_SALINIM = 0.015


def parca_durum(p, t_montaj, t_dongu):
    """Parçanın konum/dönüşü. t_montaj None → patlatılmış (+ döngü salınımı); sayı → montaj zamanı (s)."""
    ofs, rot = p["ofs"], p["rot"]
    if ofs.length == 0 and rot.length == 0:
        return p["pivot"].copy(), Euler((0, 0, 0))
    if t_montaj is None:
        faz = 2 * math.pi * p["sira"] / max(1, len(PARCALAR))
        bob = A_SALINIM * (math.sin(2 * math.pi * t_dongu / P_DONGU + faz) - math.sin(faz)) if t_dongu is not None else 0.0
        return p["pivot"] + ofs + Vector((0, 0, bob)), Euler(rot)
    # F: montaj_kur() fiske saatine taşınmış t0_f / sure_f (eski profilde t0 / sure'nin aynısı)
    k = O.miknatis(t_montaj, p.get("t0_f", p["t0"]), p.get("sure_f", p["sure"]))
    return p["pivot"] + ofs * (1 - k), Euler(rot * (1 - k))


# ================================================================== KUR
hol = None
P4 = None
S_ = {}


def kur():
    global hol, P4, S_
    camd = bpy.data.cameras.new("kamera")
    camd.sensor_fit = "HORIZONTAL"
    camd.sensor_width = 36.0
    camd.sensor_height = 36.0
    camd.clip_start = 0.02
    camd.clip_end = 300.0
    cam = bpy.data.objects.new("kamera", camd)
    COL["kamera"].objects.link(cam)
    sc.camera = cam
    sc.render.resolution_x = sc.render.resolution_y = a.res
    S_.update(stant_kur())
    bitkiler()
    P4 = p4_kamera_coz(cam)
    hol = hol_kur(P4["konum"].y)
    isiklar_kur(hol)
    return cam


O.render_ayarla(a)
if KLIP in ("t56", "t67", "t78"):
    sc.render.motion_blur_shutter = DEKLANSOR_E     # B kararı 5 (eski t56); E: t56/t67/t78 aynı (t78 sonu ≡ eski t56[71])
cam = kur()
print(f"[P4] konum {tuple(round(v, 3) for v in P4['konum'])} ψ {P4['psi']} φ {P4['phi']:.2f} genişlik {P4['genislik_px']:.0f} px "
      f"x {P4['x_aralik'][0]:.3f}–{P4['x_aralik'][1]:.3f} y {P4['y_aralik'][0]:.3f}–{P4['y_aralik'][1]:.3f}", flush=True)

# ================================================================== ANİMASYON
def isik_durum(t_montaj, nefes=1.0, kuzey=0.0, bati=0.0):
    """t_montaj None → d4 (patlatılmış: yumuşak kutu açık, stant ışıkları kapalı); ≥ 2,0 → d5.
    E turu: "kuzey" / "bati" duvar yıkama spotları (brief §12.3); d4'te, montajda, l5 boyunca ve banko anında 0 —
    yalnız t56/t67/t78 (duvar_isik) açar. Mevcut "duvar" anahtarı değişmedi."""
    if t_montaj is None:
        return {"yumusak_kutu": 1.0, "duvar": 0.0, "rotunda": 0.0, "banko": 0.0, "kuzey": 0.0, "bati": 0.0}
    t = t_montaj
    return {
        # kamera ışığın altına girerken yumuşak kutu söner; 1,6 s'de devir tamam (brief: "1,6 s'de devreder")
        "yumusak_kutu": 1.0 - O.smoother((t - 0.95) / 0.65),
        "duvar": O.smoother((t - 0.45) / 0.25),
        "banko": O.smoother((t - 0.95) / 0.3),
        "rotunda": O.smoother((t - 1.15) / 0.45) * nefes,
        "kuzey": kuzey,
        "bati": bati,
    }


def duvar_isik(klip, f):
    """(kuzey, bati) ışık devri, klip karesi f'de (brief §12.3 tablosu). Sınırlarda dikiş: t56 sonu (1; 0,15) = t67 başı;
    t67 sonu (0,3; 1) = t78 başı; t78 sonu (0; 0) = eski t56[71] (banko anı)."""
    # F (fiske): anahtarlar ilerlemeye (s) bağlı — t56 kuzey s penceresi (E'de u 0,55–0,95 ≡ s 0,578–0,994), t67 pan
    # ilerlemesiyle, t78 T78_PEN["isik"] (E'de u 0,25–0,60 ≡ s 0,146–0,655).
    if klip == "t56":   # kuzey u 0,55–0,95'te 0 → 1; bati t67 başının 0,15'ine aynı rampayla
        if PROFIL == "eski":
            k = O.ease_in_out_sine((f / N_T56 - 0.55) / 0.40)
        else:
            k = O.ease_in_out_sine(pencere(t56_s(f), *pen(T56_PEN_FISKE, "kuzey", "t56")))
        return k, 0.15 * k
    if klip == "t67":   # kuzey 1 → 0,3, bati 0,15 → 1 (pan ile aynı easeInOutSine)
        if PROFIL == "eski":
            e = O.ease_in_out_sine(f / N_T67)
        else:
            e = O.ease_in_out_sine(pencere(t67_s(f), *pen(T67_PEN, "isik", "t67")))
        return O.lerp(1.0, 0.3, e), O.lerp(0.15, 1.0, e)
    if klip == "t78":   # ikisi de u 0,25–0,60'ta 0'a
        if PROFIL == "eski":
            d = 1.0 - O.ease_in_out_sine((f / N_T78 - 0.25) / 0.35)
        else:
            d = 1.0 - O.ease_in_out_sine(pencere(ilerleme(f, N_T78, "t78"), *pen(T78_PEN, "isik", "t78")))
        return 0.3 * d, 1.0 * d
    return 0.0, 0.0


TABAN = {}


def isik_uygula(dur, f):
    if not TABAN:
        TABAN["yumusak_kutu"] = ISIK["yumusak_kutu"].data.energy
        TABAN["rotunda_tepe"] = ISIK["rotunda_tepe"].data.energy
        TABAN["led"] = ISIK["kanopi_led"][0].data.energy
        TABAN["duvar"] = ISIK["duvar_spotlar"][0][1].data.energy
        TABAN["banko"] = ISIK["banko_spot"].data.energy
        TABAN["brosur"] = ISIK["brosur_spot"].data.energy
    def k(L, v):
        L.energy = v
        L.keyframe_insert("energy", frame=f)
    k(ISIK["yumusak_kutu"].data, TABAN["yumusak_kutu"] * dur["yumusak_kutu"])
    k(ISIK["rotunda_tepe"].data, TABAN["rotunda_tepe"] * dur["rotunda"])
    k(ISIK["banko_spot"].data, TABAN["banko"] * max(dur["banko"], dur["duvar"] * 0.0))
    k(ISIK["brosur_spot"].data, TABAN["brosur"] * dur["banko"])
    for o in ISIK["kanopi_led"]:
        k(o.data, TABAN["led"] * min(1.0, dur["rotunda"]))
    for _, o in ISIK["duvar_spotlar"]:
        k(o.data, TABAN["duvar"] * dur["duvar"])
    if "yikama" not in TABAN:
        TABAN["yikama"] = ISIK["yikama"]["kuzey"][0].data.energy
    for grup in ("kuzey", "bati"):
        for o in ISIK["yikama"][grup]:
            k(o.data, TABAN["yikama"] * dur.get(grup, 0.0))


def kamera_uygula(f, pos, psi, phi, lens, odak=None, dof=False, fstop=2.0):
    cam.location = pos
    cam.keyframe_insert("location", frame=f)
    cam.rotation_euler = kam_ac(psi, phi)
    cam.keyframe_insert("rotation_euler", frame=f)
    cam.data.lens = lens
    cam.data.keyframe_insert("lens", frame=f)
    cam.data.dof.use_dof = dof
    if dof:
        cam.data.dof.aperture_fstop = fstop
        cam.data.dof.aperture_blades = 7
        cam.data.dof.focus_distance = odak
        cam.data.dof.keyframe_insert("focus_distance", frame=f)
        cam.data.dof.keyframe_insert("aperture_fstop", frame=f)


YOL45 = t45_yol(P4)
montaj_kur()   # F: PARCALAR t0_f / sure_f (eski profilde t0 / sure)
KAYIT = {"kadraj_m": {}, "kamera": {}}
ISIK_KAYIT = {}   # f → (kuzey, bati)


def kadraj(pos, psi, phi, lens, hedef):
    fw = ileri(psi, phi)
    d = max(0.01, (hedef - pos).dot(fw))
    return d * 36 * 0.5625 / lens


def kare_kur(f):
    """Seçili klip için f karesinin tüm durumunu anahtarlar."""
    if KLIP in ("t34b",):
        pos, psi, phi, lens = t34b_poz(f, P4, hol)
        for p in PARCALAR:
            l_, r_ = parca_durum(p, None, None)
            p["o"].location = l_; p["o"].rotation_euler = r_
            p["o"].keyframe_insert("location", frame=f); p["o"].keyframe_insert("rotation_euler", frame=f)
        isik_uygula(isik_durum(None), f)
        kamera_uygula(f, pos, psi, phi, lens)
        return kadraj(pos, psi, phi, lens, T4), (pos, psi, phi, lens)
    if KLIP in ("l4", "p4", "olcum-hol"):
        t = f / 30.0
        for p in PARCALAR:
            l_, r_ = parca_durum(p, None, t if KLIP == "l4" else 0.0)
            p["o"].location = l_; p["o"].rotation_euler = r_
            p["o"].keyframe_insert("location", frame=f); p["o"].keyframe_insert("rotation_euler", frame=f)
        isik_uygula(isik_durum(None), f)
        kamera_uygula(f, P4["konum"], P4["psi"], P4["phi"], P4_LENS)
        return kadraj(P4["konum"], P4["psi"], P4["phi"], P4_LENS, T4), (P4["konum"], P4["psi"], P4["phi"], P4_LENS)
    if KLIP == "t45":
        t = f / 30.0
        for p in PARCALAR:
            l_, r_ = parca_durum(p, t, None)     # F: montaj_kur() sıkıştırması (gerçek zamanda)
            p["o"].location = l_; p["o"].rotation_euler = r_
            p["o"].keyframe_insert("location", frame=f); p["o"].keyframe_insert("rotation_euler", frame=f)
        isik_uygula(isik_durum(t45_saat(f)), f)  # F: ışık devri ilerlemeye bağlı (E'de t45_saat = f / 30)
        pos, psi, phi, lens, _ = t45_kamera(f, P4, YOL45)
        kamera_uygula(f, pos, psi, phi, lens)
        s = t45_s(f)
        T4b = P4["konum"] + ileri(P4["psi"], P4["phi"]) * (T4 - P4["konum"]).length
        return kadraj(pos, psi, phi, lens, T4b.lerp(HEDEF5, O.smoother(s))), (pos, psi, phi, lens)
    # d5 / d6: montaj tamam
    for p in PARCALAR:
        l_, r_ = parca_durum(p, 9.0, None)
        p["o"].location = l_; p["o"].rotation_euler = r_
        p["o"].keyframe_insert("location", frame=f); p["o"].keyframe_insert("rotation_euler", frame=f)
    if KLIP in ("l5", "p5", "olcum-rotunda"):
        t = f / 30.0
        nefes = 1.0 + 0.06 * math.sin(2 * math.pi * t / P_DONGU) if KLIP == "l5" else 1.0
        isik_uygula(isik_durum(9.0, nefes), f)
        kamera_uygula(f, P5["konum"], P5["psi"], P5["phi"], 18.0)
        return kadraj(P5["konum"], P5["psi"], P5["phi"], 18.0, HEDEF5), (P5["konum"], P5["psi"], P5["phi"], 18.0)
    # E turu: t56 (d6) / t67 (d7) / t78 (banko) ve son-kare posterleri p6 / p7, plaka p8, olcum-banko
    klip, ff = POSTER_KAYNAK.get(KLIP, (KLIP, f))
    kuzey, bati = duvar_isik(klip, ff)
    isik_uygula(isik_durum(9.0, kuzey=kuzey, bati=bati), f)
    pos, psi, phi, lens, odak, fstop = {"t56": t56_kamera, "t67": t67_kamera, "t78": t78_kamera}[klip](ff)
    kamera_uygula(f, pos, psi, phi, lens, odak=odak, dof=True, fstop=fstop)
    # kadraj hedefi: d6/d7'de duvar düzlemi (zemin/arka/sol iç yüz ilk kesişimi); t78'de odak noktası (eski t56 mantığı)
    hed = pos + ileri(psi, phi) * (odak if klip == "t78" else duvar_mesafe(pos, ileri(psi, phi)))
    ISIK_KAYIT[f] = (kuzey, bati)
    return kadraj(pos, psi, phi, lens, hed), (pos, psi, phi, lens)


def kare_listesi():
    if a.kareler:
        if "-" in a.kareler and "," not in a.kareler:
            x, y = a.kareler.split("-")
            return list(range(int(x), int(y) + 1))
        return [int(x) for x in a.kareler.split(",")]
    return list(range(K0, K1 + 1))


# ================================================================== ÇARPIŞMA (--carpisma; render yok, GPU yok)
CARPISMA_GRUP = [   # (grup, ad süzgeci, eşik m | None = bilgi)
    ("sutunlar", lambda n: n.startswith("sutun_"), 0.25),
    ("kanopi", lambda n: n.startswith(("kanopi", "krom_")), 0.25),
    ("totem", lambda n: n.startswith("totem_"), 0.25),
    ("sol_bank", lambda n: n == "sol_bank", 0.25),
    ("kiosk", lambda n: n.startswith("kiosk_"), 0.25),
    ("duvarlar", lambda n: n.startswith(("on_", "sag_", "arka_", "sol_kapali", "sol_fasya", "baski_", "ekran_soz", "yikama_",
                                         "bant_", "cita_", "oda_bati", "oda_kuzey", "oda_ara")), 0.25),
    ("bitkiler", lambda n: n.startswith(("bitki_", "saksi_")), 0.25),
    ("banko", lambda n: n.startswith(("banko_", "brosur_", "logo")), None),
    ("diger", None, None),   # oyun alanı, amfi, oda eşyası, pankartlar, zemin dışı her şey
]


def carpisma_raporu():
    """t56/t67/t78: montajı tamam sahne (E ile aynı). F: t45 (montaj sürerken; hareketli parça başına BVH, kamera parçanın
    o anki dönüşümünün tersiyle montajlı çerçeveye taşınır — katı dönüşüm uzaklığı korur) ve t34b (patlatılmış) eklendi;
    t45/t34b'de hol nesneleri (makas, ışıklık, fasya, komşu stantlar) de sayılır. Profil: --profil."""
    from mathutils.bvhtree import BVHTree
    for p in PARCALAR:   # d5+ : montaj tamam
        l_, r_ = parca_durum(p, 9.0, None)
        p["o"].location = l_
        p["o"].rotation_euler = r_
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()

    def ag_topla(objeler):
        vs, ps = [], []
        for o in objeler:
            oe = o.evaluated_get(dg)
            me = oe.to_mesh()
            b = len(vs)
            mw = oe.matrix_world
            vs.extend(mw @ v.co for v in me.vertices)
            ps.extend([b + i for i in pl.vertices] for pl in me.polygons)
            oe.to_mesh_clear()
        return BVHTree.FromPolygons(vs, ps) if ps else None

    gruplar = {g: [] for g, _, _ in CARPISMA_GRUP}
    for o in COL["stant"].objects:
        if o.type != "MESH" or o.name in ("zemin_plaka", "oyun_zemin", "halka"):
            continue
        g = next((g for g, fn, _ in CARPISMA_GRUP if fn and fn(o.name)), "diger")
        gruplar[g].append(o)
    agac = {g: t for g, t in ((g, ag_topla(ob)) for g, ob in gruplar.items()) if t}
    # F: hareketli parçalar (t45) ve hol
    bos_parca = {p["o"].name: p for p in PARCALAR if not (p["ofs"].length == 0 and p["rot"].length == 0)}

    def parca_bul(o):
        q = o.parent
        while q is not None:
            if q.name in bos_parca:
                return bos_parca[q.name]
            q = q.parent
        return None
    parca_ob, sabit_ob = {}, []
    for o in COL["stant"].objects:
        if o.type != "MESH" or o.name in ("zemin_plaka", "oyun_zemin", "halka"):
            continue
        pp = parca_bul(o)
        if pp is None:
            sabit_ob.append(o)
        else:
            parca_ob.setdefault(pp["ad"], []).append(o)
    hol_ob = [o for o in COL["hol"].objects if o.type == "MESH" and not o.name.startswith(("hol_zemin", "zemin"))]
    agac_parca = {ad: ag_topla(ob) for ad, ob in parca_ob.items()}
    agac_sabit = ag_topla(sabit_ob)
    agac_hol = ag_topla(hol_ob)
    parca_ad = {p["ad"]: p for p in PARCALAR}

    def en_yakin_hareketli(pos, t):
        """(grup, uzaklık) listesi: parçalar t anındaki konumlarında (t None → patlatılmış), sabit stant + hol."""
        cik = []
        for ad, tr in agac_parca.items():
            if tr is None:
                continue
            pp = parca_ad[ad]
            l_, r_ = parca_durum(pp, t, None)
            Mt = Matrix.Translation(l_) @ Euler(r_).to_matrix().to_4x4()
            M1 = Matrix.Translation(pp["pivot"])
            q = M1 @ Mt.inverted() @ pos
            r = tr.find_nearest(q, 50.0)
            if r[0] is not None:
                cik.append((ad, r[3]))
        for ad, tr in (("stant_sabit", agac_sabit), ("hol", agac_hol)):
            if tr is not None:
                r = tr.find_nearest(pos, 50.0)
                if r[0] is not None:
                    cik.append((ad, r[3]))
        return cik

    yollar = {"t56": (t56_kamera, N_T56), "t67": (t67_kamera, N_T67), "t78": (t78_kamera, N_T78)}
    ALT = 8
    rapor = {"esik_m": 0.25, "alt_ornek": ALT, "klipler": {}, "uretim": time.strftime("%Y-%m-%dT%H:%M:%S"), "profil": PROFIL,
             "tanim": "kamera merkezinin (z Z0 + …) grup yüzeylerine en küçük uzaklığı (BVH, montajı tamam sahne); kare başına "
                      f"{ALT} alt örnek (hareket bulanıklığı aralığını kapsar). F: t45 montaj sürerken (parça başına), t34b "
                      "patlatılmış; ikisinde hol dahil (t34b'de hol yalnız bilgi: kamera ışıklık bandının içinden girer)"}
    tutmayan = []
    for klip, (fn, n) in yollar.items():
        en = {g: (1e9, None, None) for g in agac}
        hiz = []
        onceki = None
        for i in range(n * ALT + 1):
            f = i / ALT
            pos = fn(f)[0]
            if onceki is not None:
                hiz.append((pos - onceki).length * FPS * ALT)
            onceki = pos
            for g, t in agac.items():
                r = t.find_nearest(pos, 50.0)
                if r[0] is not None and r[3] < en[g][0]:
                    en[g] = (r[3], f, [round(v, 3) for v in pos])
        rk = {}
        for g, esik in ((g, e) for g, _, e in CARPISMA_GRUP):
            if g not in en:
                continue
            d, f, p = en[g]
            ok = None if esik is None else d >= esik
            rk[g] = {"min_m": round(d, 3), "kare": round(f, 3), "konum_m": p, "esik_m": esik, "tamam": ok}
            if ok is False:
                tutmayan.append(f"{klip}/{g} {d:.3f} m (kare {f:.2f})")
        rapor["klipler"][klip] = {"grup": rk, "hiz_tepe_m_s": round(max(hiz), 2), "hiz_tepe_kare": round(hiz.index(max(hiz)) / ALT, 2)}
        print(f"[CARPISMA] {klip}: " + "  ".join(f"{g} {v['min_m']:.3f}@{v['kare']:.1f}{'' if v['tamam'] is None else (' ✓' if v['tamam'] else ' ✗')}"
                                               for g, v in rk.items()) + f"  | hız tepe {max(hiz):.2f} m/s", flush=True)
    # F: t45 (montaj sürerken) ve t34b (patlatılmış, hol)
    for klip, n, ilk in (("t45", N_T45, 0), ("t34b", T34B_BAS + 23, T34B_BAS)):
        en, hiz, onceki = {}, [], None
        for i in range((n - ilk) * ALT + 1):
            f = ilk + i / ALT
            if klip == "t45":
                pos = t45_kamera(f, P4, YOL45)[0]
                yak = en_yakin_hareketli(pos, f / 30.0)
            else:
                pos = t34b_poz(f, P4, hol)[0]
                yak = en_yakin_hareketli(pos, None)
            if onceki is not None:
                hiz.append((pos - onceki).length * FPS * ALT)
            onceki = pos
            for g, d in yak:
                if d < en.get(g, (1e9,))[0]:
                    en[g] = (d, f, [round(v, 3) for v in pos])
        rk = {}
        for g, (d, f, p) in sorted(en.items(), key=lambda kv: kv[1][0]):
            esik = None if (g == "hol" and klip == "t34b") else 0.25
            ok = None if esik is None else d >= esik
            rk[g] = {"min_m": round(d, 3), "kare": round(f, 3), "konum_m": p, "esik_m": esik, "tamam": ok}
            if ok is False:
                tutmayan.append(f"{klip}/{g} {d:.3f} m (kare {f:.2f})")
        rapor["klipler"][klip] = {"grup": rk, "hiz_tepe_m_s": round(max(hiz), 2), "hiz_tepe_kare": round(ilk + hiz.index(max(hiz)) / ALT, 2)}
        enk = list(rk.items())[:6]
        print(f"[CARPISMA] {klip}: " + "  ".join(f"{g} {v['min_m']:.3f}@{v['kare']:.1f}{'' if v['tamam'] is None else (' ✓' if v['tamam'] else ' ✗')}"
                                               for g, v in enk) + f"  | hız tepe {max(hiz):.2f} m/s", flush=True)
    rapor["tutmayan"] = tutmayan
    yol = a.carpisma_json or os.path.join(O.RENDER, "_onizleme", "s2-carpisma.json")
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    with open(yol, "w", encoding="utf-8") as fh:
        json.dump(rapor, fh, ensure_ascii=False, indent=1)
    print(f"[CARPISMA] {'TAMAM' if not tutmayan else 'TUTMAYAN: ' + '; '.join(tutmayan)} → {yol}", flush=True)


# ================================================================== KAMERA DÖKÜMÜ (--kamera_dok; render yok, GPU yok)
# F turu ölçümü (brief §13.3): iki profil (eski = E, fiske = F) × t34b/t45/t56/t67/t78, kare kare kamera durumu +
# kadraj kenarı örnek piksellerinden sahneye atılan ışınların çarptığı noktalar (dünya, m). Ekran hareketi (px/kare),
# ilerleme, uç kare eşitliği vb. Blender dışında hesaplanır (scratchpad f-s2/profil.py). Kenar pikselleri: dikey kırpım
# (x 420 / 1500, y 0–1920; üst/alt kenar), yatay kırpım (y 420 / 1500, x 0–1920; sol/sağ kenar), iç 7×7 ızgara.
# "1.000.000+" bloğu (sol duvar baskısı, _duvar-olcum.json kutusu): t67 ekran ölçeği için.
METIN_1M = {"x": X_SOL_IC + BASKI_T, "y": (0.996, 3.289), "z": (Z0 + 2.922, Z0 + 3.25)}


def kenar_pikselleri():
    def ara(a0, a1, n):
        return [a0 + (a1 - a0) * i / (n - 1) for i in range(n)]
    P = []
    for x in (420.5, 1499.5):
        P += [(x, y, "dikey_yan") for y in ara(0.5, 1919.5, 17)]
    for y in (0.5, 1919.5):
        P += [(x, y, "dikey_ustalt") for x in ara(420.5, 1499.5, 9)]
    for y in (420.5, 1499.5):
        P += [(x, y, "yatay_ustalt") for x in ara(0.5, 1919.5, 17)]
    for x in (0.5, 1919.5):
        P += [(x, y, "yatay_yan") for y in ara(420.5, 1499.5, 9)]
    P += [(x, y, "ic") for x in ara(240, 1680, 7) for y in ara(240, 1680, 7)]
    return P


def kamera_durum(klip, f):
    """Klip karesi f (kesirli olabilir) → kamera durumu (konum, ψ, φ, lens, odak, diyafram, ilerleme s)."""
    if klip == "t34b":
        pos, psi, phi, lens = t34b_poz(f, P4, hol)
        return {"pos": pos, "psi": psi, "phi": phi, "lens": lens, "odak": None, "fstop": None, "s": t34b_s(f)}
    if klip == "t45":
        pos, psi, phi, lens, _ = t45_kamera(f, P4, YOL45)
        return {"pos": pos, "psi": psi, "phi": phi, "lens": lens, "odak": None, "fstop": None,
                "s": t45_yay(f) if PROFIL == "fiske" else t45_s(f), "s_ln": t45_s(f)}
    fn = {"t56": (t56_kamera, t56_s), "t67": (t67_kamera, t67_s),
          "t78": (t78_kamera, lambda ff: ilerleme(ff, N_T78, "t78") if PROFIL == "fiske" else zaman_egrisi(ff / N_T78, a.t78_rampa))}[klip]
    pos, psi, phi, lens, odak, fstop = fn[0](f)
    return {"pos": pos, "psi": psi, "phi": phi, "lens": lens, "odak": odak, "fstop": fstop, "s": fn[1](f)}


def kamera_dokumu(yol):
    t_bas = time.perf_counter()
    PIK = kenar_pikselleri()
    ad_tablo = {}

    def parcalar(t):
        for p in PARCALAR:
            l_, r_ = parca_durum(p, t, None)
            p["o"].location = l_
            p["o"].rotation_euler = r_
        bpy.context.view_layer.update()
        return bpy.context.evaluated_depsgraph_get()

    def isinlar(dg, st):
        fw, sag, ust = ileri(st["psi"], st["phi"]), None, None
        p_, f_ = math.radians(st["psi"]), math.radians(st["phi"])
        sag = Vector((math.cos(p_), -math.sin(p_), 0.0))
        ust = Vector((-math.sin(f_) * math.sin(p_), -math.sin(f_) * math.cos(p_), math.cos(f_)))
        fpx = st["lens"] * 1920.0 / 36.0
        cik = []
        for x, y, _ in PIK:
            d = (fw + sag * ((x - 960.0) / fpx) - ust * ((y - 960.0) / fpx)).normalized()
            hit, loc, _n, _i, ob, _m = sc.ray_cast(dg, st["pos"], d, distance=300.0)
            if not hit:
                loc, ad = st["pos"] + d * 300.0, "-"
            else:
                ad = ob.name
            cik.append([round(loc.x, 5), round(loc.y, 5), round(loc.z, 5), ad_tablo.setdefault(ad, len(ad_tablo))])
        return cik

    def durum_js(st):
        return {"pos": [st["pos"].x, st["pos"].y, st["pos"].z], "psi": st["psi"], "phi": st["phi"], "lens": st["lens"],
                "odak": st["odak"], "fstop": st["fstop"], "s": st["s"]}

    js = {"uretim": time.strftime("%Y-%m-%dT%H:%M:%S"), "kaynak": "scripts/blender/s2/sahne.py --kamera_dok",
          "fiske": {"k": a.fiske_k, "a_sn": a.fiske_a, "montaj_c": a.montaj_c}, "fps": FPS, "master": 1920,
          "pikseller": [[x, y, e] for x, y, e in PIK], "metin_1m": METIN_1M, "rc": [RC.x, RC.y], "r_kanopi": R_KANOPI,
          "kanopi_alt_z": Z0 + KANOPI_ALT, "profiller": {}}
    profil0 = PROFIL
    for prof in ("eski", "fiske"):
        profil_kur(prof)
        montaj_kur()
        P = {}
        for klip in ("t34b", "t45", "t56", "t67", "t78"):
            n = {"t34b": T34B_BAS + 23, "t45": N_T45, "t56": N_T56, "t67": N_T67, "t78": N_T78}[klip]
            ilk = T34B_BAS if klip == "t34b" else 0
            dg = parcalar(None if klip == "t34b" else 9.0) if klip != "t45" else None
            if klip == "t34b":   # t34b: patlatılmış, salınımsız (kare_kur ile aynı)
                for p in PARCALAR:
                    l_, r_ = parca_durum(p, None, None)
                    p["o"].location = l_; p["o"].rotation_euler = r_
                bpy.context.view_layer.update()
                dg = bpy.context.evaluated_depsgraph_get()
            kareler = []
            for f in range(ilk, n + 1):
                if klip == "t45":
                    dg = parcalar(f / 30.0)
                st = kamera_durum(klip, f)
                k_ = durum_js(st)
                k_["f"] = f
                k_["isin"] = isinlar(dg, st)
                if klip in ("t56", "t67", "t78"):
                    k_["isik"] = list(duvar_isik(klip, f))
                if klip == "t45":
                    k_["isik_saat"] = t45_saat(f)
                    k_["isik"] = isik_durum(t45_saat(f))
                kareler.append(k_)
            # yarım kare durumları (deklanşör aralığı; ekran hareketi yalnız tam karelerden)
            P[klip] = {"ilk": ilk, "son": n, "kareler": kareler}
            if klip == "t45":   # montaj çizelgesi + kanopi kenarı geçişi (alt örnek 1/16 kare)
                gecis = None
                for i in range(n * 16 + 1):
                    ff = i / 16.0
                    q = kamera_durum("t45", ff)["pos"]
                    if math.hypot(q.x - RC.x, q.y - RC.y) <= R_KANOPI:
                        gecis = ff
                        break
                cizelge = []
                for p in PARCALAR:
                    if p["ofs"].length == 0 and p["rot"].length == 0:
                        continue
                    t0, su = p.get("t0_f", p["t0"]), p.get("sure_f", p["sure"])
                    cizelge.append({"ad": p["ad"], "t0": round(t0, 4), "sure": round(su, 4), "bitis_s": round(t0 + su + 0.12, 4),
                                    "t0_eski": p["t0"], "sure_eski": p["sure"]})
                P[klip]["montaj"] = {"kanopi_gecis_kare": gecis, "kanopi_gecis_s": None if gecis is None else round(gecis / 30.0, 4),
                                     "cizelge": cizelge, "son_bitis_s": max(c["bitis_s"] for c in cizelge)}
            if klip == "t78":
                e = eski_t56_kamera(T56_ESKI_SON)
                P[klip]["eski_t56_71"] = {"pos": list(e[0]), "psi": e[1], "phi": e[2], "lens": e[3], "odak": e[4], "fstop": e[5]}
        js["profiller"][prof] = P
        print(f"[DOKUM] {prof}: " + ", ".join(f"{k} {len(v['kareler'])}" for k, v in P.items()), flush=True)
    profil_kur(profil0)
    montaj_kur()
    js["nesneler"] = {v: k for k, v in ad_tablo.items()}
    js["sure_sn"] = round(time.perf_counter() - t_bas, 2)
    os.makedirs(os.path.dirname(os.path.abspath(yol)), exist_ok=True)
    with open(yol, "w", encoding="utf-8") as fh:
        json.dump(js, fh, ensure_ascii=False)
    print(f"[DOKUM] {yol} ({js['sure_sn']} s)", flush=True)


if a.kamera_dok:
    kamera_dokumu(a.kamera_dok)
    raise SystemExit(0)

if a.carpisma:
    carpisma_raporu()
    raise SystemExit(0)

KARELER = kare_listesi()
TUM = list(range(K0 - 1, K1 + 2))   # hareket bulanıklığı için klip sınırının bir dışı da anahtarlanır
kadrajlar = {}
for f in TUM:
    kj, poz = kare_kur(f)
    kadrajlar[f] = kj
    KAYIT["kamera"][f] = poz

# p8 (eski p6 plakası): üstteki broşür yok (DOM kapak bu dikdörtgene oturur); --yigin 0 → yığın tamamen yok
if KLIP == "p8":
    S_["yigin"][-1].hide_render = True
    if not a.yigin:
        for o in S_["yigin"]:
            o.hide_render = True

O.emisyon_ornekleme(a)


# ================================================================== DIŞA AKTARIM (JSON)
def proj(v, f):
    sc.frame_set(f)
    p = world_to_camera_view(sc, cam, Vector(v))
    return [round(p.x * 1920, 1), round((1 - p.y) * 1920, 1), round(p.z, 3)]


def kirpim_ici(x, y):
    return {"dikey": 420 <= x <= 1500 and 0 <= y <= 1920, "yatay": 0 <= x <= 1920 and 420 <= y <= 1500}


# Duvar çapaları (brief §12.4-9 `Ozel.duvarCapalari`; G-B §14.4.2 / §14.4.4): p6 → d6 arka duvar: bulusma ("50+"), solen
# ("100.000+"), motto (pencere dışı üç satırlık slogan "AK Parti / Her Anında / Hep Yanında"; yalnız yatay, dikeyde kırpım
# dışı kalır → kirpimda false, W yön başına atlar); p7 → sol duvar çapaları (uye, il_ilce; manifest kullanmıyor, bilgi).
# Kaynak: dokular.mjs `_duvar-olcum.json` → capalar[ad].dunya (montajlı sahne, m; mürekkep kutusu ortası, motto: üç satırın
# birleşik kutusu). Dosya yoksa §14.4.4 G-B dokusunun ölçülen yerleşiminden TAHMİN (yalnız p6). Yön başına kırpımın
# (kenardan ≥ 24 video px) içinde kalan ilk aday seçilir; kutusu bilinen çapada (json kutu_u_m ya da DUVAR_CAPA_KUTU) yedek
# adaylar aynı z'de kutunun içinde, pencereye doğru (−x) 0,15 m adımla.
DUVAR_CAPA_VARSAYILAN = {   # (x, z − Z0) arka duvar iç yüzü, m — dokular.mjs _duvar-olcum.json (G-B, 4 Kasım 2026)
    "bulusma": (-6.39, 2.352),       # "50+" rakamı
    "solen": (-5.751, 1.165),        # "100.000+" rakamı
    "motto": (-3.032, 2.474),        # pencere dışı slogan (3 satır)
}
DUVAR_CAPA_KUTU = {"motto": (-3.702, -2.362)}   # yedek aday x aralığı (json'da kutu_u_m yoksa)
CAPA_PAY = 36   # master px (= 24 video px)
CAPA_DUVAR = {"p6": "duvar-arka.png", "p7": "duvar-sol.png"}


def kirpimda(boyut, x, y, pay=CAPA_PAY):
    if boyut == "dikey":
        return 420 + pay <= x <= 1500 - pay and pay <= y <= 1920 - pay
    return pay <= x <= 1920 - pay and 420 + pay <= y <= 1500 - pay


def duvar_capalari(klip):
    kaynak, noktalar, kutu = None, {}, {}
    yol = DOKU + "_duvar-olcum.json"
    if os.path.exists(yol):
        try:
            for ad, v in json.load(open(yol, encoding="utf-8")).get("capalar", {}).items():
                if v.get("doku") == CAPA_DUVAR[klip]:
                    noktalar[ad] = Vector(v["dunya"])
                    if klip == "p6" and v.get("kutu_u_m"):
                        kutu[ad] = tuple(v["kutu_u_m"])
            kaynak = yol + " (capalar.dunya)"
        except Exception as e:   # bozuk dosya: varsayılanla devam, uyar
            print(f"[UYARI] {yol} okunamadı ({e}); varsayılan çapalar", flush=True)
            noktalar, kutu = {}, {}
    if not noktalar and klip == "p6":
        noktalar = {ad: Vector((x, Y_ARKA_IC - BASKI_T, Z0 + z)) for ad, (x, z) in DUVAR_CAPA_VARSAYILAN.items()}
        kutu = dict(DUVAR_CAPA_KUTU)
        kaynak = "varsayılan (brief §14.4.4 G-B yerleşiminden; _duvar-olcum.json yok)"
        print("[UYARI] _duvar-olcum.json yok: duvar çapaları tahmin", flush=True)
    capalar, liste, video, ayrinti = {}, [], [], {}
    for ad, w0 in noktalar.items():
        aday = [w0]
        if ad in kutu:   # kutunun içinde, aynı z'de pencereye doğru (−x) yedekler (motto: pencere dışı slogan)
            aday += [w0 + Vector((-0.15 * i, 0, 0)) for i in range(1, 9) if w0.x - 0.15 * i >= kutu[ad][0] + 0.05]
        sec = {}
        for boyut in ("dikey", "yatay", "ikisi"):
            for w in aday:
                px, py, pz = proj(w, K0)
                ok = pz > 0 and (kirpimda("dikey", px, py) and kirpimda("yatay", px, py) if boyut == "ikisi" else kirpimda(boyut, px, py))
                if ok:
                    sec[boyut] = (px, py, w, True)
                    break
            else:
                px, py, pz = proj(w0, K0)
                sec[boyut] = (px, py, w0, False)
        capalar[ad] = [sec["ikisi"][0], sec["ikisi"][1]]
        liste.append({"ad": ad, "dikey": [sec["dikey"][0], sec["dikey"][1]], "yatay": [sec["yatay"][0], sec["yatay"][1]]})
        video.append({"ad": ad, "dikey": [round((sec["dikey"][0] - 420) / 1.5, 1), round(sec["dikey"][1] / 1.5, 1)],
                      "yatay": [round(sec["yatay"][0] / 1.5, 1), round((sec["yatay"][1] - 420) / 1.5, 1)]})
        ayrinti[ad] = {b: {"dunya_m": [round(v, 3) for v in sec[b][2]], "kirpimda": sec[b][3]} for b in ("dikey", "yatay", "ikisi")}
    return {
        "capalar": capalar,
        "capa_tanim": (f"{klip}: duvar yazılarının mürekkep kutusu ortası (S2a _duvar-olcum.json), master px; iki kırpıma da "
                       "giren nokta (manifest-birlestir bunu okur: dikey ((x − 420) / 1,5, y / 1,5), yatay (x / 1,5, (y − 420) / 1,5))"),
        "duvarCapalari": liste,
        "duvarCapalari_video": video,
        "duvarCapalari_ayrinti": ayrinti,
        "duvarCapalari_kaynak": kaynak,
        "duvarCapalari_tanim": ("§12.4-9 biçimi, master px (1920²); yön başına kırpım içinde kalan nokta. duvarCapalari_video: "
                                "video px (kirpimY 420). dunya_m: montajlı sahne koordinatı."),
    }


def doku_denetim():
    """E turu dokuları: bulunan / eksik, piksel boyutu (beklenen 500 px/m), bit derinliği (16 bit PNG Blender'da float →
    VRAM ×4)."""
    bekl = {"duvar-arka.png": (2790, 2000), "duvar-sol.png": (2665, 2000), "ekran-soz.png": (1110, 620), "cephe-on.png": (2775, 2000)}
    for ad, (bw_, bh_) in bekl.items():
        im = next((i for i in bpy.data.images if i.filepath and os.path.basename(i.filepath) == ad), None)
        if im is None:
            print(f"[DOKU] {ad}: YOK (düz renk yedek)", flush=True)
            continue
        w_, h_ = im.size
        print(f"[DOKU] {ad}: {w_}×{h_} (beklenen {bw_}×{bh_}) {'✓' if (w_, h_) == (bw_, bh_) else '✗'} "
              f"kanal {im.channels} derinlik {im.depth} bit float {im.is_float}", flush=True)


def json_yaz():
    ad = KLIP
    n = K1 - K0 + 1
    js = {
        "ad": ad, "fps": FPS, "kare": n, "sure": round(n / FPS, 3), "master": 1920,
        "kare_baslangic": 0 if KLIP == "t34b" else K0,   # dosya numarası (render-son: hepsi 0'dan)
        "kadraj_m": [round(kadrajlar[f], 3) for f in range(K0, K1 + 1)],
        "kadraj_tanim": "dikey teslimin (1080 master px) genişliği, kamera ekseni boyunca hedef noktası derinliğinde (m) = d·20,25/f",
        "kamera": {},
        "kaynak": "scripts/blender/s2/sahne.py",
        "uretim": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    k0, k1 = KAYIT["kamera"][K0], KAYIT["kamera"][K1]
    js["kamera"] = {
        "ilk": {"konum_m": [round(v, 3) for v in k0[0]], "yon_deg": round(k0[1], 2), "egim_deg": round(k0[2], 2), "lens_mm": round(k0[3], 2)},
        "son": {"konum_m": [round(v, 3) for v in k1[0]], "yon_deg": round(k1[1], 2), "egim_deg": round(k1[2], 2), "lens_mm": round(k1[3], 2)},
        "sensor_mm": 36, "koordinat": "stant merkezi orijin; X doğu, Y kuzey (stant arkası), Z yukarı; zemin Z 0,05",
    }
    if KLIP in ("l4", "p4"):
        # çapa adları docs/klipler-sema.md §3 (W'nin sözlüğü)
        n4 = {
            "rotunda": RC + Vector((0, 0, 1.25 + 0.6)),
            "oyun": Vector((PX(0.41), PY(0.86), Z0 + 0.78 + 0.35)),
            "kiosk": Vector((0.0, DP / 2 - 0.75 - 0.18, Z0 + 1.29 + 0.45)),
            "amfi": Vector((5.0, 0.9 + 2.25, Z0 + 0.44 + 0.5)),
        }
        js["capalar"] = {}
        js["capa_kirpim"] = {}
        for k, v in n4.items():
            x, y, z = proj(v, K0)
            js["capalar"][k] = [x, y]
            js["capa_kirpim"][k] = kirpim_ici(x, y)
        js["capa_tanim"] = "poster karesi (kare 0) master px; parça merkezleri (patlatılmış konumda)"
        js["stant_genislik_px"] = round(P4["genislik_px"], 1)
    if KLIP in ("l5", "p5"):
        js["capalar"] = {}
        js["capa_kirpim"] = {}
        js["capa_yuz_merkezi"] = {}
        for s in S_["sutunlar"]:
            th = s["th"]
            ic = lambda h: s["pos"] + Vector((-math.cos(th) * (SUTUN_D / 2 + 0.001), -math.sin(th) * (SUTUN_D / 2 + 0.001), Z0 + h))
            no = f"sutun{s['no']:02d}"
            x, y, z = proj(ic(SUTUN_H / 2), K0)
            js["capa_yuz_merkezi"][no] = [x, y]
            # görünür çapa: iç yüz orta çizgisinde, master karenin %2 içinde kalan en yüksek nokta (yüz merkezi
            # P5'te çoğu sütunda kadraj dışında: kamera 2,70 m, eğim −78°)
            secim = None
            for i in range(46):
                h = SUTUN_H - 0.05 - i * 0.05
                if h < 0.05:
                    break
                xx, yy, zz = proj(ic(h), K0)
                if zz > 0 and 38 <= xx <= 1882 and 38 <= yy <= 1882:
                    secim = (xx, yy, round(h, 2))
                    break
            if secim:
                js["capalar"][no] = [secim[0], secim[1]]
                js["capa_kirpim"][no] = {**kirpim_ici(secim[0], secim[1]), "yukseklik_m": secim[2]}
            else:
                js["capa_kirpim"][no] = {"dikey": False, "yatay": False, "yukseklik_m": None}
        js["capa_tanim"] = ("12 sütunun iç yüz orta çizgisinde master karenin %2 içinde kalan en yüksek nokta (poster karesi, "
                            "master px); yüz merkezi (1,15 m) 'capa_yuz_merkezi'nde, çoğu kadraj dışında")
        js["halka_merkez"] = proj(RC + Vector((0, 0, 0.002)), K0)[:2]
    if KLIP == "t78":
        # E turu: broşür dikdörtgeni t56'dan t78'e taşındı (son kare ≡ eski t56[71]; manifest D[8] brosurDikdortgen)
        ust = S_["yigin"][-1]
        sc.frame_set(K1)
        mw = ust.matrix_world
        x, y, h = BROSUR_W / 2, BROSUR_H / 2, BROSUR_T
        kose = [mw @ Vector(c) for c in ((-x, y, h), (x, y, h), (x, -y, h), (-x, -y, h))]   # kapak: sol üst, sağ üst, sağ alt, sol alt
        js["brosur_dikdortgen"] = [proj(v, K1)[:2] for v in kose]
        js["brosur_tanim"] = f"son kare ({N_T78}), üstteki broşürün kapak köşeleri: sol üst, sağ üst, sağ alt, sol alt (master px)"
        xs = [p[0] for p in js["brosur_dikdortgen"]]
        ys = [p[1] for p in js["brosur_dikdortgen"]]
        dx = js["brosur_dikdortgen"][1][0] - js["brosur_dikdortgen"][0][0]
        dy = js["brosur_dikdortgen"][1][1] - js["brosur_dikdortgen"][0][1]
        js["brosur_olcum"] = {"genislik_px": round(max(xs) - min(xs), 1), "yukseklik_px": round(max(ys) - min(ys), 1),
                               "donukluk_deg": round(math.degrees(math.atan2(dy, dx)), 3),
                               "hedef": "x 606–1314, y 460–1460 (oran 0,708, iki kırpıma da sığar; dönüklük 0)",
                               "kapak_dokusu": os.path.basename(KAPAK), "brosur_m": [round(BROSUR_W, 4), BROSUR_H]}
        e = eski_t56_kamera(T56_ESKI_SON)
        k = KAYIT["kamera"][K1]
        js["esdeger"] = {"eski": "t56[71] (D turu; render-son-d/t56/k_0071.png, p8 plakası)",
                         "konum_fark_m": round((k[0] - e[0]).length, 6), "yon_fark_deg": round(abs(k[1] - e[1]), 6),
                         "egim_fark_deg": round(abs(k[2] - e[2]), 6), "lens_fark_mm": round(abs(k[3] - e[3]), 6),
                         "olcut": f"§12.6: t78[{K1}] ↔ eski t56[71] ΔE00 ≤ 0,05"}
    if KLIP in ("t34b", "t45", "t56", "t67", "t78"):
        # F-B (§13.5): K'nin kirpimY rampaları ve manifest kirpimYKare bu alana bağlanır (E2 §12.12 eşikleri ilerlemeyle).
        il = [kamera_durum(KLIP, f) for f in range(K0, K1 + 1)]
        js["ilerleme"] = [round(float(d_["s"]), 5) for d_ in il]
        js["ilerleme_tanim"] = {
            "t34b": "t34b_s: ışıklık bandı (13,85 m) → P4 konum/açı ilerlemesi (0 → 1); dizin = dosya k_0000…",
            "t45": "yay ilerlemesi (fiske; E'de ln-uzaklık ilerlemesi); 'ilerleme_ln' = hedef uzaklığının ln ilerlemesi",
            "t56": "yay ilerlemesi s (konum; E'de easeInOutSine(u))", "t67": "yay ilerlemesi s (A → C → B)",
            "t78": "yay ilerlemesi s (B → … → banko; E'de easeInOutSine(u))"}[KLIP]
        js["profil"] = PROFIL
        js["fiske_k"] = fiske_k(KLIP)
        if KLIP == "t45":
            js["ilerleme_ln"] = [round(float(d_["s_ln"]), 5) for d_ in il]
    if KLIP in ("t56", "t67", "t78"):
        js["deklansor"] = DEKLANSOR_E
        js["kamera"]["lens_mm_kare"] = [round(KAYIT["kamera"][f][3], 3) for f in range(K0, K1 + 1)]
        js["kamera"]["kare"] = [[*(round(v, 4) for v in KAYIT["kamera"][f][0]), round(KAYIT["kamera"][f][1], 3),
                                 round(KAYIT["kamera"][f][2], 3)] for f in range(K0, K1 + 1)]
        js["kamera"]["kare_tanim"] = "kare başına [x, y, z (m), yön ψ, eğim φ (derece)]"
        js["isik"] = {"kuzey": [round(ISIK_KAYIT[f][0], 4) for f in range(K0, K1 + 1)],
                      "bati": [round(ISIK_KAYIT[f][1], 4) for f in range(K0, K1 + 1)],
                      "tanim": "duvar yıkama spotları (isik_durum 'kuzey' / 'bati'), taban gücün oranı; brief §12.3"}
        js["kadraj_hedef"] = "duvar düzlemi (zemin / arka iç y 4,83 / sol iç x −7,38 ilk kesişimi)" if KLIP != "t78" else \
            "odak noktası (eski t56 mantığı: zemin → broşür üstü düzlemi; B pozunda duvar)"
    if KLIP in ("p6", "p7"):
        kk, kn = POSTER_KAYNAK[KLIP]
        js["tip"] = "son-kare"
        js["kaynak_klip"] = kk
        js["kaynak_kare"] = kn
        js["not"] = (f"{KLIP} = {kk} master son karesi ({kn}); ayrı render yok (son.sh {kk}/k_{kn:04d}.png → {KLIP}/k_0000.png "
                     "kopyalar). kodla.mjs 'son-kare' tipini bu dosyadan okur.")
        js.update(duvar_capalari(KLIP))   # p6: d6 kılavuz çapaları (manifest `capalar`); p7: sol duvar (bilgi)
    if KLIP == "p8":
        # C turu (brief §11.1 S2-C 2): plaka broşürsüz; DOM broşür d8–d10'da üstünde serbestçe büyür. E: eski p6 plakası.
        js["tip"] = "plaka"
        js["eski"] = "p6"
        js["yigin"] = a.yigin
        js["not"] = ("banko plakası = eski p6 plakası (D/C turu render'ı; yeniden render yok, S2c render-son/p6 → p8 taşır). "
                     "Kamera t78 son karesi = eski t56[71]; üstteki broşür hep gizli. yigin 0 → broşür yığını tamamen yok "
                     "(dikdörtgen x 606–1314, y 460–1460 içinde yalnız banko meşesi).")
    if KLIP == "t34b":
        js["not"] = (f"t34'ün S2 parçası: dosyalar k_0000–k_0023 = t34 kare {K0}–{K1} (t34_ofset). "
                     f"t34 kare {K0}–{K0 + 2} parlaması parlama.py ile (#FFF1DC, kare {K0} tam; {K0 + 3} temiz).")
        js["t34_ofset"] = K0
        js["isiklik_y_m"] = round(hol["y_bas"], 3)
    yol = os.path.join(O.RENDER, f"{ad}.json")
    os.makedirs(O.RENDER, exist_ok=True)
    with open(yol, "w", encoding="utf-8") as fh:
        json.dump(js, fh, ensure_ascii=False, indent=1)
    print("[JSON]", yol, flush=True)


doku_denetim()
if (a.json or a.yalniz_json or TUR == "son-kare") and TUR != "olcum":
    json_yaz()
if a.yalniz_json:
    raise SystemExit(0)
if TUR == "son-kare":   # p6 / p7: ayrı render yok (kaynak klibin master son karesi; son.sh / onizleme.sh kopyalar)
    print(f"[SON-KARE] {KLIP} = {POSTER_KAYNAK[KLIP][0]}[{POSTER_KAYNAK[KLIP][1]}]; render yok, yalnız json", flush=True)
    raise SystemExit(0)

if a.blend:
    bpy.ops.wm.save_as_mainfile(filepath=a.blend, compress=True)

# ================================================================== MASKE (ölçüm)
MASKE_RENK = {   # malzeme adı öneki → kimlik rengi (Workbench, düz, AA yok)
    "boya_beyaz": (1, 0, 0), "sutun_yuz_": (0, 1, 0), "kapak": (0, 0, 1), "mese_banko": (1, 1, 0),
    "laminat": (1, 0, 1), "hali": (0, 1, 1), "mese": (0.5, 0, 0), "boya_gri_komsu": (0, 0.5, 0), "isik_kutu": (0, 0, 0.5),
}
if a.maske:
    sc.render.engine = "BLENDER_WORKBENCH"
    sh = sc.display.shading
    sh.light = "FLAT"
    sh.color_type = "MATERIAL"
    sc.display.render_aa = "OFF"
    sc.render.use_motion_blur = False
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = 0.0
    sc.render.dither_intensity = 0.0
    sc.render.image_settings.color_depth = "8"
    for m in bpy.data.materials:
        rk = (0, 0, 0)
        for on, r in sorted(MASKE_RENK.items(), key=lambda kv: -len(kv[0])):
            if m.name.startswith(on):
                rk = r
                break
        m.diffuse_color = (*rk, 1)
    sc.world.color = (0, 0, 0)
    for o in bpy.data.objects:
        if o.type == "MESH" and not o.material_slots:
            o.hide_render = True

# ================================================================== RENDER
if YEDEK_DOKU and not a.onizleme and os.environ.get("S2_GECICI") != "1":
    print(f"[HATA] E turu dokuları eksik ({', '.join(YEDEK_DOKU)}): son render düz renkli yedekle yapılmaz (S2_GECICI=1 ile zorla)",
          flush=True)
    raise SystemExit(3)
out = a.out or os.path.join(O.RENDER, KLIP if not a.onizleme else f"_onizleme/s2-{KLIP}")
if KLIP == "t34b":
    out = os.path.join(out, "ham")      # parlama.py ham/ → üst klasör (F-B kare 36–38 parlama; çıktı 0'dan: k_0000 = t34 kare 36)
os.makedirs(out, exist_ok=True)
t_kurulum = time.perf_counter() - T_BASLA
sure = O.Sure(a, f"{KLIP}-{a.engine}-{a.res}", {"klip": KLIP, "kare_aralik": [KARELER[0], KARELER[-1]], "out": out})
if a.kilit:
    O.kilit_al(f"S2 {KLIP} {a.engine} {a.res}")
try:
    for f in KARELER:
        sc.frame_set(f)
        sc.render.filepath = os.path.join(out, f"k_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
finally:
    if a.kilit:
        O.kilit_birak()
sure.bitir(t_kurulum)
