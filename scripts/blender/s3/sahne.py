"""S3 fidan sahnesi: "masadaki kök kasası" (G-A kazananı Öneri 3 + jüri aşıları; brief-icinden-3 §14).

S2'nin kendi sahnesi (scripts/blender/s2/sahne.py, --klip t78, F-B "fiske" profili) AYNI süreçte, render bölümüne kadar
çalıştırılır (kaynak metin "MASKE" işaretinden kesilip exec edilir; S2 dosyalarına dokunulmaz). Üstüne ince bir katman
kurulur: bankonun üstünde, broşürün batısında cam yüzlü meşe bir kök gözlem kasası; içinde /fidan `tree.ts` fidanı
(agac_disa.mjs → agac.json: 81 kök ucu, gövde + 2 boğum, önder + 6 ana + 16 alt dal, 274 yaprak + derinlik yaprakları),
geometry nodes ile SABİT TOPOLOJİLİ büyüme (Resample + Sample Curve; nokta sayısı hiç değişmez), fidan_spot (3.200 K,
akkor ısınması) ve 16.00 güneşi (s1/gunes.py: 9 Kasım 2026 13.00 UTC, Expo) arka ışık olarak.

Klipler (§12.1 tek hane kuralı: a = 10, b = 11, c = 12 onaltılık; `r${klip[2]}${klip[1]}` türetmesi bozulmaz):
  t78f  60 kare: S2 t78 aynen + kasa (palamut yarı gömülü, fidan yok). G3 (yeni broşür) t78 kuyruğuyla tek seferde.
  t89   60 kare (2,0 s): broşürden kasaya kesmesiz iniş; g_kok u 0,30–0,94; fidan_spot akkor ısınması → d9 (son-kare p9)
  t79   60 kare (2,0 s; G-B sonrası): d7 (sol duvar, t78[0] ≡ t67[47]) → d9 (≡ t89[59]); broşür durağı yok. Yol t78
        koridorundan (totem ile batı duvarı arası) bankonun kuzeyine iner, kasaya bakış eksenine 15° açıyla yanaşır.
        Büyüme / ışık t89 zaman çizgisi; S2 duvar ışığı devri t78 karesiyle aynı (S2 animasyonu dondurulmaz). Geri r97.
  t9a   54 kare (1,8 s): kökten gövdeye; kanca → S gövde, boğumlar; güneş 0 → 0,15 → d10 (son-kare pa)
  tab   54 kare (1,8 s): gövdeden dallara; önder + 6 ana + 16 alt dal, sonda tomurcuk; güneş 0,15 → 0,4 → d11 (pb)
  tbc   66 kare (2,2 s): dallardan yaprağa; yapraklar açılır, güneş 0,4 → 1, spot → 0,3; titreme rampası → d12
  lc    120 kare (4 s) döngü: yaprak titremesi (periyodik, P = 120 kare); pc = lc[0] ≡ tbc[65]
  p9 / pa / pb / pc: "son-kare" posterler (render yok; json); geri klip yalnız r98 (= t89 tersi; kodla.mjs).
  kodla.mjs açık ad tablosuna eklenecekler (K): t89 t9a tab tbc lc + r98; posterler p9 pa pb pc (son-kare / lc[0]).

S2 klibi + kasa (7 Kasım 2026; onay-listesi §14.1-G "Kasa d4/d5'te yok" kapandı): `--klip t34b | l4 | t45` S2'nin o
klibini kendi kamerası, ışığı, parça animasyonu ve deklanşörüyle AYNEN kurar (t78f gibi), üstüne yalnız kasayı (palamut, fidan
yok, fidan_spot/güneş 0, pankart_gel görünür ve gölgeli) ekler. Kareler S2 numarasıyla (t34b 36–59 → `--out <kök>/t34b/ham`,
sonra S2 parlama.py); JSON S2'nin (`s2/sahne.py --klip <klip> --yalniz_json`). Yazılı dokular S2_DOKU ortam değişkeninden
(İngilizce: s2/doku-en). l5/p5'te kasa görünmez (ışın testi 0 örnek) → l5 S2 son.sh ile.

Kipler:
  (varsayılan)   render: <out>/k_%04d.png (önizleme: render/_onizleme/s3-<klip>/), --json → <kok>/<klip>.json
  --olc DOSYA    render yok, GPU yok: kare kare kamera + 81 uç / dal uçları / boğum / kasa izdüşümü, uç aralığı, güvenli
                 alan ∩ bant (390×844, 360×800, 430×932; yatay 1280×800, 844×390), son 3 kare px, büyüme cephesi hızı
  --gorunurluk DOSYA  render yok: kasanın S2 kliplerinde (t34b, p4/l4, t45, p5/l5, t56, t67, t78) görünürlüğü (ışın testi)
  --maske        Workbench malzeme kimliği (kök kapağı / kök / toprak / yaprak / kabuk / kasa): 81 uç blob sayımı

Çalıştırma (Blender 5.2.3, GPU kilidi --kilit):
  blender.exe -b --factory-startup -P scripts/blender/s3/sahne.py -- --klip t89 [--onizleme] [--kareler 0-59]
      [--out DIZIN] [--json --kok DIZIN] [--kilit] [--log DOSYA] [--gok karanlik|altin] [--cam_k 0.08]
Koordinat: S2 (metre; X doğu, Y kuzey, Z yukarı; stant zemini Z 0,05). Ağaç birimi 1,1 mm.
G-B K10 görünüş (brief §14.4.1; varsayılanlar, BENIOKU "K10"): --govde_k 1.3 --kok_gomul 0.001 --nem_k 0.7 --spot_yan 5
  --yaprak_doy 0.70 --g_yaprak_son 0.97 --g_yaprak_egri smooth. G-A görünüşü: --govde_k 1 --kok_gomul 0 --nem_k 0.5
  --spot_yan 0 --yaprak_doy 0.54 --g_yaprak_son 0.93 --g_yaprak_egri smoother.
"""
import bpy, sys, os, math, json, time, random, subprocess, argparse
from mathutils import Vector, Matrix, Euler
from bpy_extras.object_utils import world_to_camera_view

BURASI = os.path.dirname(os.path.abspath(__file__))
S2_DIR = os.path.normpath(os.path.join(BURASI, "..", "s2"))
S1_DIR = os.path.normpath(os.path.join(BURASI, "..", "s1"))
KOK_DEPO = os.path.normpath(os.path.join(BURASI, "..", "..", ".."))
sys.path.insert(0, S2_DIR)
import ortak as O   # noqa: E402  (S2 ortak: fiske, kilit, Sure, D, srgb)

T_BASLA = time.perf_counter()

# ================================================================== klipler ve argümanlar
KLIPLER3 = {
    "t78f": (0, 59, "gecis"),
    "t79": (0, 59, "gecis"),      # G-B sonrası: d7 → d9 (broşürsüz); t79[59] ≡ t89[59] (p9 değişmez)
    "t89": (0, 59, "gecis"),
    "p9": (0, 0, "son-kare"),
    "t9a": (0, 53, "gecis"),
    "pa": (0, 0, "son-kare"),
    "tab": (0, 53, "gecis"),
    "pb": (0, 0, "son-kare"),
    "tbc": (0, 65, "gecis"),
    "lc": (0, 119, "dongu"),
    "pc": (0, 0, "son-kare"),
}
# S2 klibi + kasa (kare aralığı S2'nin KLIPLER'inden, exec'ten sonra; buradaki yer tutucu)
S2_KASA = ("t34b", "l4", "t45")
for _k in S2_KASA:
    KLIPLER3[_k] = (0, 0, "s2")
SIRA = ["t78f", "t79", "t89", "t9a", "tab", "tbc", "lc"]   # t79 → t9a (d8 broşür durağı yok); t78f/t89 r87 / eski akış
POSTER = {"p9": ("t89", 59), "pa": ("t9a", 53), "pb": ("tab", 53), "pc": ("lc", 0)}

argv3 = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--klip", required=True, choices=list(KLIPLER3))
ap.add_argument("--onizleme", action="store_true")
ap.add_argument("--res", type=int, default=0)
ap.add_argument("--samples", type=int, default=0)
ap.add_argument("--kareler", default="")
ap.add_argument("--out", default="")
ap.add_argument("--kok", default="D:/soft/cop31-varlik/render-son")
ap.add_argument("--json", action="store_true")
ap.add_argument("--yalniz_json", action="store_true")
ap.add_argument("--kilit", action="store_true")
ap.add_argument("--log", default="")
ap.add_argument("--olc", default="")
ap.add_argument("--olc79", default="")   # render yok: yalnız t79 yoklaması (yol ↔ sahne, broşür boyu, dikiş durumları) → JSON
ap.add_argument("--gorunurluk", default="")
ap.add_argument("--maske", action="store_true")
ap.add_argument("--agac", default="D:/soft/cop31-varlik/s3/agac.json")
ap.add_argument("--kasa", default="")             # "x,y" kasa ayak izi merkezi (S2 m); boş → KASA_MERKEZ
ap.add_argument("--cam_k", type=float, default=0.08)   # cam yansıma ağırlığı (R12: kök maskesinde ΔL* düşüşü ≤ 5; 0 → cam yok)
ap.add_argument("--gok", default="karanlik", choices=["karanlik", "altin"])   # d12 arka plan A/B (jüri J1)
ap.add_argument("--fidan_w", type=float, default=430.0)    # fidan_spot gücü (W, 3.200 K)
ap.add_argument("--gunes_w", type=float, default=4400.0)   # 16.00 güneşi (dar spot) gücü (W)
ap.add_argument("--yaprak_boy", type=float, default=0.036) # yaprak boyu (m) × tree.ts s
ap.add_argument("--ek_yaprak", type=float, default=0.75)   # derinlik yaprakları (tree.ts yapraklarının oranı)
ap.add_argument("--kokcuk_k", type=float, default=2.2)   # kökçük kalınlık çarpanı (tree.ts 1,15 birim → 2,8 mm; uç ≥ 4 video px)
ap.add_argument("--kapak_k", type=float, default=1.5)    # kök kapağı / uç yarıçapı (krem başlık; boncuk değil, ≤ 1,5)
ap.add_argument("--kapak_min", type=float, default=0.00155)  # kapak yarıçapı alt sınırı (m): çap ≥ 4 video px (d9)
ap.add_argument("--pankart", type=int, default=0)      # 1 → pankart_gel S3 kliplerinde de görünür (yazılı; varsayılan gizli)
# G-B K10 görünüş varsayılanları (brief §14.4.1 K10; G-A değeri yorumda; G-A görünüşü: --govde_k 1 --kok_gomul 0
# --nem_k 0.5 --spot_yan 0 --yaprak_doy 0.54 --yaprak_ton 0.49 --g_yaprak_son 0.93 --g_yaprak_egri smoother)
ap.add_argument("--govde_k", type=float, default=1.3)      # gövde taban çapı çarpanı (G-A 1,0); uca doğru önder tabanına iner,
#                                                            boğum kabarması ve kanca genliği oransal; ön yüz yerinde (kalınlaşma arkaya)
ap.add_argument("--kok_gomul", type=float, default=0.001)  # kök ek gömülme (m) (G-A 0); görünen kiriş ≥ 1,39 r sınırı (kökçük
#                                                            kaybolmaz), ucun son 8 mm'si yerinde (81 kapak); nem halesi kök başına kayar
ap.add_argument("--nem_k", type=float, default=0.7)        # nem halesinde toprak koyulaşması (G-A 0,5); K10: derine inen kökte hale okunsun
ap.add_argument("--spot_yan", type=float, default=5.0)     # fidan_spot ek yan açısı (°, düşey eksen, cam normalinden uzağa; G-A 0)
ap.add_argument("--spot_telafi", type=int, default=1)      # 1 → yan açıyla düşen toprak yüzü aydınlığı gücle telafi edilir
ap.add_argument("--yaprak_doy", type=float, default=0.70)  # yaprak HSV doygunluk çarpanı merkezi (G-A 0,54); pc ölçütü ≤ 0,62, hedef 0,56–0,60 (deneme: 0,60 → 0,557; 0,70 → 0,588; 0,78 → 0,617)
ap.add_argument("--yaprak_ton", type=float, default=0.49)  # yaprak HSV ton merkezi (G-A 0,49; 0,5 = kaydırma yok)
ap.add_argument("--g_yaprak_son", type=float, default=0.97)  # tbc g_yaprak penceresi sonu (G-A 0,93); sondaki durgun kare 6–8
ap.add_argument("--g_yaprak_bas", type=float, default=0.05)  # tbc g_yaprak penceresi başı (G-A 0,05)
ap.add_argument("--g_yaprak_egri", default="smooth", choices=["smoother", "smooth"])  # pencere eğrisi (G-A smoother/quintic: 0,97 ile bile 11 durgun kare; smooth/kübik 0,97 → 8)
ap.add_argument("--t79_yan", type=float, default=30.0)   # t79 son yaklaşımın C9 bakışından sapması (°; 30 → X C9'un tam kuzeyinde: broşür kadraja kare 33'te kenardan girer, p9 boyuna tekdüze büyür)
ap.add_argument("--t79_x", default="")                  # t79 ara noktası X "x,y,z" (boş → C9 − yön(ψ − yan)·1,15 + 0,16 z)
ap.add_argument("--t79_x2", type=float, default=0.0)   # > 0: X ile C9 arasına bakış ekseni üstünde k m gerideki X2 (son teğet eksende)
ap.add_argument("--t79_phi", type=float, default=-12.0) # t79 yol ortası eğim (°; s 0,5)
ap.add_argument("--blend", default="")
A = ap.parse_args(argv3)
KLIP = A.klip
K0, K1, TUR = KLIPLER3[KLIP]
KAYNAK_KLIP = POSTER.get(KLIP, (KLIP, None))[0]   # posterlerin sahne durumu kaynak klibinki
if KLIP in POSTER:
    K0 = K1 = POSTER[KLIP][1]

# ================================================================== 1) S2 sahnesi (t78; render bölümüne kadar)
S2_SAHNE = os.path.join(S2_DIR, "sahne.py")
s2_arg = ["--klip", KLIP if KLIP in S2_KASA else "t78", "--kok", os.path.join(os.environ.get("TEMP", "C:/Temp"), "s3-s2json")]
if A.onizleme:
    s2_arg.append("--onizleme")
if A.res:
    s2_arg += ["--res", str(A.res)]
if A.samples:
    s2_arg += ["--samples", str(A.samples)]
_argv_eski = sys.argv
sys.argv = [sys.argv[0], "--"] + s2_arg
kaynak = open(S2_SAHNE, encoding="utf-8").read()
_kes = kaynak.find("\n# ================================================================== MASKE")
if _kes < 0:
    raise SystemExit("[HATA] S2 sahne.py'de MASKE işareti yok; S3 S2 kurulumunu kesemiyor")
G2 = {"__name__": "__s2__", "__file__": S2_SAHNE}
exec(compile(kaynak[:_kes], S2_SAHNE, "exec"), G2)
sys.argv = _argv_eski
sc = G2["sc"]
cam = G2["cam"]
a2 = G2["a"]
N_T78 = G2["N_T78"]
Z0 = G2["Z0"]
FPS = 30
if KLIP in S2_KASA:
    KLIPLER3[KLIP] = G2["KLIPLER"][KLIP][:2] + ("s2",)
    K0, K1, TUR = KLIPLER3[KLIP]
print(f"[S3] S2 sahnesi kuruldu ({KLIP if KLIP in S2_KASA else 't78'}, profil {G2['PROFIL']}, N_T78 {N_T78}; kareler {K0}–{K1}); "
      f"yazılı dokular {G2['DOKU_YAZI']}; {time.perf_counter() - T_BASLA:.1f} s", flush=True)

# ================================================================== 2) ağaç verisi
if not os.path.exists(A.agac):
    print(f"[S3] {A.agac} yok → node agac_disa.mjs", flush=True)
    subprocess.run(["node", os.path.join(BURASI, "agac_disa.mjs"), A.agac], check=True, cwd=KOK_DEPO)
AG = json.load(open(A.agac, encoding="utf-8"))
assert AG["sayilar"]["uc"] == 81 and AG["sayilar"]["kok_serit"] == 81 and AG["sayilar"]["dal_serit"] == 23
assert AG["sayilar"]["yaprak"] == 274 and AG["sayilar"]["bogum"] == 2
GY = AG["GROUND_Y"]
BIRIM = 0.0011   # m / ağaç birimi (52 cm'lik fidan)

# ================================================================== 3) kasa yeri ve yerel çerçeve
BANKO_C, BANKO_W, BANKO_D, BANKO_H = G2["BANKO_C"], G2["BANKO_W"], G2["BANKO_D"], G2["BANKO_H"]
BANKO_UST = Z0 + BANKO_H                     # 1,10
PSI = -150.0                                 # kamera bakış yönü (t78 sonu PSI_SON; sapma yok)
KASA_MERKEZ = (-5.86, -4.20)                 # Öneri 3 §1.0 (ayak izi merkezi); görünürlük testiyle denetlenir
if A.kasa:
    KASA_MERKEZ = tuple(float(v) for v in A.kasa.split(","))
KASA_G, KASA_D, KASA_H = 0.48, 0.16, 0.34    # dış ölçü (genişlik, derinlik, yükseklik)
CER = 0.02                                   # meşe çerçeve
TOPRAK_G, TOPRAK_D, TOPRAK_H = 0.44, 0.12, 0.28
CAM_BOSLUK = 0.003                           # cam iç yüzü ↔ toprak yüzü
# yerel çerçeve: başlangıç = toprak üst yüzü × toprak ön yüzü × orta; X ağaç +x (kamera sağı), Y kasanın içine
# (kamera ileri, yatay), Z yukarı. Kasanın ayak izi merkezi yerel (0, TOPRAK_D/2 + (cam/çerçeve payı), …).
_r = math.radians(-PSI)
KX = Vector((math.cos(math.radians(PSI)), -math.sin(math.radians(PSI)), 0.0))   # kamera sağı
KY = Vector((math.sin(math.radians(PSI)), math.cos(math.radians(PSI)), 0.0))    # kamera ileri (yatay)
_orta_y = (TOPRAK_D + CER) / 2 - CER / 2     # ayak izi merkezinin yerel Y'si (önde cam+çerçeve 0,02, arkada sırt 0,02)
KASA_O = Vector((KASA_MERKEZ[0], KASA_MERKEZ[1], 0.0)) - KY * _orta_y
KASA_O.z = BANKO_UST + CER + TOPRAK_H        # toprak üstü z (1,40)


def yerel(x, y, z):
    """Kasa yerel (m) → dünya."""
    return KASA_O + KX * x + KY * y + Vector((0, 0, z))


def agac3(tx, ty, derin=0.0):
    """Ağaç birimi (tx, ty) + derinlik (m, toprak yüzünden içeri) → yerel (m)."""
    return ((tx - 200.0) * BIRIM, derin, (GY - ty) * BIRIM)


BANKO_PARCA = next(p for p in G2["PARCALAR"] if p["ad"] == "banko")["o"]
COLS = bpy.data.collections.new("s3")
sc.collection.children.link(COLS)
KOK_BOS = bpy.data.objects.new("S3_kasa_kok", None)
COLS.objects.link(KOK_BOS)
KOK_BOS.location = KASA_O
KOK_BOS.rotation_euler = Euler((0, 0, _r))
KOK_BOS.parent = BANKO_PARCA                  # patlatılmış d4'te bankoyla birlikte kalkar (görünürlük testi)
# P_banko montajlı durumda pivot (0, 0, 0)'da: çocuk yerel = dünya. (matrix_world kurulum anında patlatılmış d4
# durumunu taşıyabiliyor — tersini almak kasayı 0,64 m gömüyordu.)
KOK_BOS.matrix_parent_inverse = Matrix.Translation(next(p for p in G2["PARCALAR"] if p["ad"] == "banko")["pivot"]).inverted()
SABLON_COL = bpy.data.collections.new("s3_sablon")
sc.collection.children.link(SABLON_COL)
SABLON_COL.hide_render = True
SABLON_COL.hide_viewport = True
bpy.context.view_layer.layer_collection.children["s3_sablon"].exclude = False


def obj(ad, data, col=COLS, parent=KOK_BOS, loc=(0, 0, 0), mat=None):
    o = bpy.data.objects.new(ad, data)
    col.objects.link(o)
    if parent is not None:
        o.parent = parent
    o.location = loc
    if mat is not None and hasattr(data, "materials"):
        data.materials.append(mat)
    return o


# ================================================================== 4) malzemeler
MAT = G2["MAT"]
srgb = O.srgb


def m_yeni(ad):
    m = bpy.data.materials.new(ad)
    return m, O.D(m.node_tree)


def attr(d, ad, tip="GEOMETRY"):
    return d("ShaderNodeAttribute", attribute_name=ad, attribute_type=tip)


def ramp(d, fac, duraklar, interp="LINEAR"):
    r = d("ShaderNodeValToRGB")
    r.color_ramp.interpolation = interp
    el = r.color_ramp.elements
    while len(el) > 1:
        el.remove(el[-1])
    el[0].position, el[0].color = duraklar[0][0], (*srgb(duraklar[0][1]), 1)
    for p, h in duraklar[1:]:
        e = el.new(p)
        e.color = (*srgb(h), 1)
    d.b(fac, r.inputs[0])
    return r.outputs[0]


def m_kok():
    """Kök: taban #C8B08A → #E9DCC6, uç bölgesi krem #EDE3D0 + kök tüyü (sheen) halesi; %15 alt yüzey."""
    m, d = m_yeni("s3_kok")
    out = d("ShaderNodeOutputMaterial")
    bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.58)
    bs.inputs["Subsurface Weight"].default_value = 0.15
    bs.inputs["Subsurface Radius"].default_value = (0.004, 0.003, 0.002)
    bs.inputs["Subsurface Scale"].default_value = 1.0
    bs.inputs["Specular IOR Level"].default_value = 0.35
    q = attr(d, "q").outputs["Fac"]
    ub = attr(d, "uc_bolge").outputs["Fac"]
    kt = attr(d, "kton").outputs["Fac"]          # kök başına ton (−1…1)
    # yaşlı taban koyu ten-kahve, genç kısım açık ten; uç bölgesi krem (#EFE6D4): 81 uç gövdeden ayrışır (ΔL*)
    gov = ramp(d, q, [(0.0, "#7E6246"), (0.45, "#9C805E"), (0.85, "#B9A07E"), (1.0, "#C9B391")])
    nz = d("ShaderNodeTexNoise", i_Scale=260.0, i_Detail=4.0, i_Roughness=0.65)
    gov2 = d.karistir(d.math("MULTIPLY", nz.outputs["Fac"], 0.45), gov, (0.55, 0.45, 0.33), tip="RGBA", blend="MULTIPLY")
    hsv = d("ShaderNodeHueSaturation")
    d.b(d.math("ADD", 1.0, d.math("MULTIPLY", kt, 0.16)), hsv.inputs["Value"])
    d.b(d.math("ADD", 1.0, d.math("MULTIPLY", kt, -0.12)), hsv.inputs["Saturation"])
    d.b(gov2, hsv.inputs["Color"])
    renk = d.karistir(ub, hsv.outputs[0], srgb("#EFE6D4"), tip="RGBA")
    d.b(renk, bs.inputs["Base Color"])
    d.b(ub, bs.inputs["Sheen Weight"])           # kök tüyü halesi: uç arkasındaki emici bölgede tüylü parlama
    bs.inputs["Sheen Roughness"].default_value = 0.45
    bs.inputs["Sheen Tint"].default_value = (1.0, 0.97, 0.92, 1)
    d.b(bs.outputs[0], out.inputs["Surface"])
    return m


def m_kapak():
    m, d = m_yeni("s3_kok_kapak")
    out = d("ShaderNodeOutputMaterial")
    bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.45)
    bs.inputs["Base Color"].default_value = (*srgb("#EDE3D0"), 1)
    bs.inputs["Subsurface Weight"].default_value = 0.25
    bs.inputs["Subsurface Radius"].default_value = (0.003, 0.002, 0.0015)
    bs.inputs["Sheen Weight"].default_value = 0.6
    d.b(bs.outputs[0], out.inputs["Surface"])
    return m


def m_kabuk():
    """Gövde/dal kabuğu: uçta yeşil-kahve #6B6A3A → tabanda #7A5A3C; uzunlamasına çizgili gürültü; boğumda koyu halka."""
    m, d = m_yeni("s3_kabuk")
    out = d("ShaderNodeOutputMaterial")
    bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.72)
    q = attr(d, "q").outputs["Fac"]
    yas = attr(d, "yas").outputs["Fac"]        # 0 genç uç, 1 yaşlı taban (dal/gövde birlikte)
    bog = attr(d, "bogum").outputs["Fac"]
    temel = ramp(d, yas, [(0.0, "#56562E"), (0.40, "#55472C"), (1.0, "#4A3626")])
    tc = d("ShaderNodeTexCoord")
    mp = d("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (900.0, 900.0, 60.0)
    d.b(tc.outputs["Object"], mp.inputs["Vector"])
    nz = d("ShaderNodeTexNoise", i_Detail=4.0, i_Roughness=0.6)
    d.b(mp.outputs[0], nz.inputs["Vector"])
    cizgi = d.math("MULTIPLY", nz.outputs["Fac"], 0.5)
    r1 = d.karistir(cizgi, temel, (0.55, 0.47, 0.38), tip="RGBA", blend="MULTIPLY")
    r2 = d.karistir(d.math("MULTIPLY", bog, 0.55), r1, srgb("#3B2A1C"), tip="RGBA")
    d.b(r2, bs.inputs["Base Color"])
    bp = d("ShaderNodeBump", i_Strength=0.55, i_Distance=0.0008)
    d.b(nz.outputs["Fac"], bp.inputs["Height"])
    d.b(bp.outputs[0], bs.inputs["Normal"])
    _ = q
    d.b(bs.outputs[0], out.inputs["Surface"])
    return m


def m_yaprak():
    """Yaprak: 3 ton (#5E8C3A / #3F6B2E / #8DB04A), yaprak başına HSV oynaması, %1–2 kenar sararması, ~%5 kuru;
    geçirgen (Translucent 0,35 karışım), ince yüzey (kalınlık 0). Marka yeşili #47B27A render'da yok."""
    m, d = m_yeni("s3_yaprak")
    m.use_backface_culling = False
    if hasattr(m, "thickness_mode"):
        m.thickness_mode = "SLAB"
    out = d("ShaderNodeOutputMaterial")
    ton = attr(d, "ton").outputs["Fac"]
    jit = attr(d, "jit").outputs["Fac"]
    kuru = attr(d, "kuru").outputs["Fac"]
    kenar = attr(d, "kenar").outputs["Fac"]
    temel = ramp(d, d.math("MULTIPLY", ton, 0.5), [(0.0, "#4C6A2C"), (0.5, "#2E4E2E"), (1.0, "#7C8C3E")], interp="CONSTANT")
    hsv = d("ShaderNodeHueSaturation")
    d.b(d.math("ADD", d.math("MULTIPLY", jit, 0.13), A.yaprak_ton), hsv.inputs["Hue"])   # ±23° ton (P1: ton IQR ≥ 12°)
    # doygunluk çarpanı (--yaprak_doy; G-A 0,54 → pc ölçümü 0,544 "soluk-zeytin"); K10 hedefi pc 0,56–0,60, ölçüt ≤ 0,62
    d.b(d.math("ADD", d.math("MULTIPLY", jit, 0.14), A.yaprak_doy), hsv.inputs["Saturation"])
    d.b(d.math("ADD", d.math("MULTIPLY", jit, -0.18), 1.0), hsv.inputs["Value"])
    d.b(temel, hsv.inputs["Color"])
    sar = d.math("MULTIPLY", d.math("POWER", kenar, 6.0), d.math("ADD", d.math("MULTIPLY", jit, 0.25), 0.3))
    r1 = d.karistir(sar, hsv.outputs[0], srgb("#B5A14A"), tip="RGBA")
    r2 = d.karistir(d.math("MULTIPLY", kuru, d.math("ADD", 0.55, d.math("MULTIPLY", kenar, 0.45))), r1, srgb("#7A5A32"), tip="RGBA")
    bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.52)
    bs.inputs["Specular IOR Level"].default_value = 0.4
    d.b(r2, bs.inputs["Base Color"])
    tr = d("ShaderNodeBsdfTranslucent")
    acik = d.karistir(0.22, r2, (0.70, 0.74, 0.46), tip="RGBA", blend="SCREEN")   # arka ışıkta sarı-yeşil, aşırı doygun değil
    d.b(acik, tr.inputs["Color"])
    mx = d("ShaderNodeMixShader", i_Fac=0.36)
    d.b(bs.outputs[0], mx.inputs[1])
    d.b(tr.outputs[0], mx.inputs[2])
    d.b(mx.outputs[0], out.inputs["Surface"])
    out.inputs["Thickness"].default_value = 0.0
    return m


def m_toprak(on=False):
    """Toprak: #2B1F17 dolayı, Voronoi topak + gürültü, kum zerresi; ön yüzde 'nem' (kök çevresi 2–4 mm koyu, nemli)."""
    m, d = m_yeni("s3_toprak_on" if on else "s3_toprak")
    out = d("ShaderNodeOutputMaterial")
    tc = d("ShaderNodeTexCoord")
    vo = d("ShaderNodeTexVoronoi", i_Scale=230.0)
    d.b(tc.outputs["Object"], vo.inputs["Vector"])
    nz = d("ShaderNodeTexNoise", i_Scale=90.0, i_Detail=6.0, i_Roughness=0.62)
    d.b(tc.outputs["Object"], nz.inputs["Vector"])
    vo2 = d("ShaderNodeTexVoronoi", i_Scale=900.0)
    d.b(tc.outputs["Object"], vo2.inputs["Vector"])
    buyuk = d("ShaderNodeTexNoise", i_Scale=9.0, i_Detail=3.0)
    d.b(tc.outputs["Object"], buyuk.inputs["Vector"])
    mix = d.math("ADD", d.math("MULTIPLY", vo.outputs["Distance"], 0.5), d.math("MULTIPLY", nz.outputs["Fac"], 0.55))
    renk = ramp(d, mix, [(0.15, "#0B0806"), (0.40, "#17110C"), (0.60, "#221911"), (0.85, "#33271C")])
    leke = d.math("MULTIPLY", d.math("GREATER_THAN", buyuk.outputs["Fac"], 0.56), 0.45)   # nemli, koyu lekeler
    renk = d.karistir(leke, renk, (0.0, 0.0, 0.0), tip="RGBA")
    zerre = d.math("LESS_THAN", vo2.outputs["Distance"], 0.06)
    renk2 = d.karistir(d.math("MULTIPLY", zerre, 0.40), renk, srgb("#5B4F42"), tip="RGBA")
    bs = d("ShaderNodeBsdfPrincipled")
    if on:
        nem = attr(d, "nem").outputs["Fac"]
        renk3 = d.karistir(d.math("MULTIPLY", nem, A.nem_k), renk2, (0.0, 0.0, 0.0), tip="RGBA")
        d.b(renk3, bs.inputs["Base Color"])
        d.b(d.math("SUBTRACT", 0.86, d.math("MULTIPLY", nem, 0.22)), bs.inputs["Roughness"])
    else:
        d.b(renk2, bs.inputs["Base Color"])
        bs.inputs["Roughness"].default_value = 0.9
    bp = d("ShaderNodeBump", i_Strength=0.6, i_Distance=0.0015)
    d.b(mix, bp.inputs["Height"])
    d.b(bp.outputs[0], bs.inputs["Normal"])
    d.b(bs.outputs[0], out.inputs["Surface"])
    return m


def m_cam(k):
    """İnce cam: saydam + düşük ağırlıklı parlak yansıma (cam_k). BLENDED: TAA gürültüsü yok."""
    m, d = m_yeni("s3_cam")
    m.surface_render_method = "BLENDED"
    m.use_backface_culling = False
    out = d("ShaderNodeOutputMaterial")
    tr = d("ShaderNodeBsdfTransparent")
    gl = d("ShaderNodeBsdfGlossy", i_Roughness=0.035)
    fr = d("ShaderNodeFresnel", i_IOR=1.5)
    fac = d.math("ADD", k, d.math("MULTIPLY", fr.outputs[0], 0.5 * k / 0.08 if k > 0 else 0.0), clamp=True)
    mx = d("ShaderNodeMixShader")
    d.b(fac, mx.inputs[0])
    d.b(tr.outputs[0], mx.inputs[1])
    d.b(gl.outputs[0], mx.inputs[2])
    d.b(mx.outputs[0], out.inputs["Surface"])
    return m


def m_principled(ad, h, r, **kw):
    m, d = m_yeni(ad)
    out = d("ShaderNodeOutputMaterial")
    bs = d("ShaderNodeBsdfPrincipled", i_Roughness=r)
    bs.inputs["Base Color"].default_value = (*srgb(h), 1)
    for k, v in kw.items():
        bs.inputs[k].default_value = v
    d.b(bs.outputs[0], out.inputs["Surface"])
    return m


def m_palamut():
    m, d = m_yeni("s3_palamut")
    out = d("ShaderNodeOutputMaterial")
    tc = d("ShaderNodeTexCoord")
    mp = d("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (40.0, 40.0, 4.0)
    d.b(tc.outputs["Object"], mp.inputs["Vector"])
    nz = d("ShaderNodeTexNoise", i_Scale=6.0, i_Detail=3.0)
    d.b(mp.outputs[0], nz.inputs["Vector"])
    renk = ramp(d, nz.outputs["Fac"], [(0.3, "#4E2E17"), (0.55, "#6E4424"), (0.75, "#8A5A30")])
    bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.32)
    bs.inputs["Coat Weight"].default_value = 0.3
    d.b(renk, bs.inputs["Base Color"])
    d.b(bs.outputs[0], out.inputs["Surface"])
    return m


def m_canak():
    m, d = m_yeni("s3_palamut_canak")
    out = d("ShaderNodeOutputMaterial")
    tc = d("ShaderNodeTexCoord")
    vo = d("ShaderNodeTexVoronoi", i_Scale=500.0)
    d.b(tc.outputs["Object"], vo.inputs["Vector"])
    renk = ramp(d, vo.outputs["Distance"], [(0.0, "#4A3C27"), (0.6, "#7C6A4A"), (1.0, "#9A8762")])
    bs = d("ShaderNodeBsdfPrincipled", i_Roughness=0.85)
    d.b(renk, bs.inputs["Base Color"])
    bp = d("ShaderNodeBump", i_Strength=0.8, i_Distance=0.0008)
    d.b(vo.outputs["Distance"], bp.inputs["Height"])
    d.b(bp.outputs[0], bs.inputs["Normal"])
    d.b(bs.outputs[0], out.inputs["Surface"])
    return m


MS = {"kok": m_kok(), "kapak": m_kapak(), "kabuk": m_kabuk(), "yaprak": m_yaprak(), "toprak": m_toprak(False),
      "toprak_on": m_toprak(True), "cam": m_cam(A.cam_k), "palamut": m_palamut(), "canak": m_canak(),
      "sirt": m_principled("s3_kasa_sirt", "#2A2420", 0.7), "mese": MAT["mese"]}

# ================================================================== 5) kasa, toprak, cam, palamut
_kutu = O.kutu_ag


def kutu_y(ad, sx, sy, sz, x, y, z, mat, col=COLS):
    """Yerel kutu: (x, y, z) taban-ortası; boyutlar yerel eksenlerde."""
    me = _kutu(ad, sx, sy, sz, merkez_alt=True, uv_olcek=4.0)
    o = obj(ad, me, col=col, loc=(x, y, z), mat=mat)
    return o


ZT = -(TOPRAK_H + CER)          # kasa tabanı (banko üstü) yerel z
YA = TOPRAK_D + CER             # sırt iç yüzü
KASA = []
KASA.append(kutu_y("S3_kasa_taban", KASA_G, KASA_D, CER, 0, (TOPRAK_D + 0.0) / 2 + (CER - CER) / 2 - CER / 2 + CER / 2, ZT, MS["mese"]))
KASA[-1].location.y = (KASA_D / 2) - CER    # taban: ön yüzü cam düzleminin 0,02 önünde
for s in (-1, 1):
    KASA.append(kutu_y(f"S3_kasa_yan_{s}", CER, KASA_D, KASA_H - CER, s * (KASA_G / 2 - CER / 2), KASA_D / 2 - CER, ZT + CER, MS["mese"]))
KASA.append(kutu_y("S3_kasa_sirt", KASA_G - 2 * CER, CER, KASA_H - CER, 0, TOPRAK_D + CER / 2, ZT + CER, MS["sirt"]))
KASA.append(kutu_y("S3_kasa_on_alt", KASA_G - 2 * CER, 0.012, 0.012, 0, -CAM_BOSLUK - 0.004 - 0.006, ZT + CER, MS["mese"]))
# toprak gövdesi (üst + yanlar) ve ön yüz ızgarası (GN: kök çevresi nem)
TOPRAK = kutu_y("S3_toprak", TOPRAK_G, TOPRAK_D - 0.0005, TOPRAK_H, 0, TOPRAK_D / 2 + 0.0005, -TOPRAK_H, MS["toprak"])
nx, nz_ = 300, 192
co, fz = [], []
for j in range(nz_ + 1):
    for i in range(nx + 1):
        co.append((-TOPRAK_G / 2 + TOPRAK_G * i / nx, 0.0, -TOPRAK_H + TOPRAK_H * j / nz_))
for j in range(nz_):
    for i in range(nx):
        a_ = j * (nx + 1) + i
        fz.append((a_, a_ + 1, a_ + nx + 2, a_ + nx + 1))
TOPRAK_ON = obj("S3_toprak_on", O.ag("S3_toprak_on", co, fz), mat=MS["toprak_on"])
CAM = None
if A.cam_k > 0:
    cy = -CAM_BOSLUK
    co = [(-TOPRAK_G / 2 - 0.004, cy, -TOPRAK_H - 0.004), (TOPRAK_G / 2 + 0.004, cy, -TOPRAK_H - 0.004),
          (TOPRAK_G / 2 + 0.004, cy, KASA_H - TOPRAK_H - CER), (-TOPRAK_G / 2 - 0.004, cy, KASA_H - TOPRAK_H - CER)]
    CAM = obj("S3_kasa_cam", O.ag("S3_kasa_cam", co, [(0, 1, 2, 3)]), mat=MS["cam"])
# palamut: yatık, yarı gömülü, cama yaslı; sivri ucu kazık kökün başına (200, 482) bakar
PAL_UC = agac3(200, 482, 0.006)
pal_m = bpy.data.meshes.new("S3_palamut")
import bmesh  # noqa: E402
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=1.0)
for v in bm.verts:
    z = v.co.z
    k_ = 1.0 - 0.28 * max(0.0, -z) ** 1.6      # alt uç sivrilir
    v.co.x *= 0.0075 * k_
    v.co.y *= 0.0075 * k_
    v.co.z *= 0.0115
bm.to_mesh(pal_m)
bm.free()
for p in pal_m.polygons:
    p.use_smooth = True
PALAMUT = obj("S3_palamut", pal_m, mat=MS["palamut"])
can_m = bpy.data.meshes.new("S3_palamut_canak")
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=10, radius=1.0)
for v in list(bm.verts):
    if v.co.z < -0.05:
        bm.verts.remove(v)
for v in bm.verts:
    v.co.x *= 0.0086
    v.co.y *= 0.0086
    v.co.z = v.co.z * 0.0062
bm.to_mesh(can_m)
bm.free()
CANAK = obj("S3_palamut_canak", can_m, parent=PALAMUT, loc=(0, 0, 0.0052), mat=MS["canak"])
# palamut ekseni: sivri uç PAL_UC'ye, gövde sol-yukarı (yatık, 62°); merkez = uç + eksen × 0,0115
_eks = Vector((-math.sin(math.radians(62)), 0.0, math.cos(math.radians(62))))
PALAMUT.location = Vector(PAL_UC) + _eks * 0.0112
PALAMUT.rotation_euler = Vector((0, 0, 1)).rotation_difference(_eks).to_euler()

# ================================================================== 6) ağaç eğrileri (Curves, POLY) + öznitelikler
KAPAK_K = 1.30     # kökçük kalınlık çarpanı tree.ts → 3B (×1,6 kökçük; ana kökler ×1,3)


def egri_nesne(ad, seritler, mat):
    """seritler: [{"noktalar": [(x, y, z) yerel m …], "r": [yarıçap m …], "t0", "t1", ek öznitelikler …}]."""
    c = bpy.data.hair_curves.new(ad)
    c.add_curves([len(s["noktalar"]) for s in seritler])
    c.set_types(type="POLY")
    poz = [v for s in seritler for p in s["noktalar"] for v in p]
    c.position_data.foreach_set("vector", poz)
    rad = c.attributes.new("radius", "FLOAT", "POINT")
    rad.data.foreach_set("value", [r for s in seritler for r in s["r"]])
    for ad_ in ("t0", "t1", "ana", "yas0", "yas1", "kton"):
        at = c.attributes.new(ad_, "FLOAT", "CURVE")
        at.data.foreach_set("value", [float(s.get(ad_, 0.0)) for s in seritler])
    for ad_ in ("bogum", "gomul"):   # nokta öznitelikleri: boğum halkası; kök ek gömülmesi (m; FD_Toprak nem halesini kaydırır)
        at = c.attributes.new(ad_, "FLOAT", "POINT")
        at.data.foreach_set("value", [b for s in seritler for b in s.get(ad_, [0.0] * len(s["noktalar"]))])
    c.materials.append(mat)
    return obj(ad, c)


rnd = random.Random(812)
KOK_SERIT = []
# K10 kök gömülmesi: merkez hattı G-A'da toprak yüzünün r·(0,40 + dz) içinde ("kesit yüzüne çizilmiş gibi düz"). Ek derinlik
# --kok_gomul (1 mm), iki sınırla: (1) merkez ≤ KOK_KIRIS·r → görünen kiriş ≥ 2·√(1 − 0,72²)·r = 1,39 r (kökçük r 1,1–1,7 mm:
# düz +1 mm kökçük boyunun çoğunu toprağın altına gömüyordu, bkz. [S3] gömülme satırı); (2) ucun son KOK_GOMUL_UC'si
# yerinde (kapak + 81 uç ölçümleri ve DOM halkaları değişmez). Ana köklerin kalın kısmında ≈ +1 mm (ort. 0,64 mm),
# kökçüklerde ort. 0,40 mm.
KOK_KIRIS = 0.72
KOK_GOMUL_UC = 0.008
GOMUL_IST = {"ana": [], "kokcuk": [], "duz": [0, 0, 0]}   # düz +gomul'da kökçük noktaları: [tümüyle gömülü, kiriş ≤ 1,0 r, toplam]
for k in AG["kokler"]:
    carp = 1.3 if k["ana"] else A.kokcuk_k
    pts, rr, gm = [], [], []
    dz = rnd.uniform(-0.15, 0.25)
    n_ = len(k["noktalar"])
    # organik kıvrım: yanal gürültü (iki sinüs, kök başına faz), ~0,5–0,9 mm; çapalar render geometrisinden
    f1, f2 = rnd.uniform(0, 6.3), rnd.uniform(0, 6.3)
    gen_ = (0.9 if k["ana"] else 0.55) * 1e-3
    L_k = sum(math.hypot(k["noktalar"][i][0] - k["noktalar"][i - 1][0], k["noktalar"][i][1] - k["noktalar"][i - 1][1])
              for i in range(1, n_)) * BIRIM
    for j, (x, y, w) in enumerate(k["noktalar"]):
        qj = j / (n_ - 1)
        incel = 1.0 if k["ana"] else (1.22 - 0.40 * qj)          # kökçük tabanda kalın, uca doğru incelir
        r = w / 2 * BIRIM * carp * incel
        X, _, Z = agac3(x, y)
        j0, j1 = max(0, j - 1), min(n_ - 1, j + 1)
        tx, ty = k["noktalar"][j1][0] - k["noktalar"][j0][0], k["noktalar"][j1][1] - k["noktalar"][j0][1]
        tl = math.hypot(tx, ty) or 1.0
        nx_, nz2 = -ty / tl, -tx / tl                                 # yerel X/Z düzleminde normal
        s_ = qj * L_k
        ofs = gen_ * (math.sin(s_ / 0.011 + f1) * 0.7 + math.sin(s_ / 0.0047 + f2) * 0.3) * min(1.0, qj * 6)
        c0 = r * (0.40 + dz)                                          # G-A: merkez hattı toprak yüzünün r·0,4 içinde
        uc_t = O.smoother(min(1.0, (1.0 - qj) * L_k / KOK_GOMUL_UC))  # uca uzaklık → 0 (uç yerinde)
        ek = min(A.kok_gomul, max(0.0, KOK_KIRIS * r - c0)) * uc_t
        pts.append((X + nx_ * ofs, c0 + ek, Z + nz2 * ofs))
        rr.append(r)
        gm.append(ek)
        if uc_t >= 1.0:
            GOMUL_IST["ana" if k["ana"] else "kokcuk"].append(ek)
            if not k["ana"]:
                GOMUL_IST["duz"][0] += c0 + A.kok_gomul >= r
                GOMUL_IST["duz"][1] += c0 + A.kok_gomul >= 0.866 * r
                GOMUL_IST["duz"][2] += 1
    KOK_SERIT.append({"noktalar": pts, "r": rr, "t0": k["start"], "t1": k["end"], "ana": 1.0 if k["ana"] else 0.0,
                      "grup": k["grup"], "uc": k["uc"], "kton": rnd.uniform(-1, 1), "gomul": gm})
if A.kok_gomul > 0:
    _ga, _gk = GOMUL_IST["ana"], GOMUL_IST["kokcuk"]
    print(f"[S3] kök gömülme +{A.kok_gomul * 1e3:.2f} mm (kiriş ≥ 1,39 r, uç {KOK_GOMUL_UC * 1e3:.0f} mm yerinde): ana kök ort "
          f"{sum(_ga) / len(_ga) * 1e3:.2f} mm (min {min(_ga) * 1e3:.2f}), kökçük ort {sum(_gk) / len(_gk) * 1e3:.2f} mm "
          f"(min {min(_gk) * 1e3:.2f}, maks {max(_gk) * 1e3:.2f}); sınırsız düz +{A.kok_gomul * 1e3:.1f} mm'de kökçük "
          f"gövdesinin %{100 * GOMUL_IST['duz'][0] / max(1, GOMUL_IST['duz'][2]):.0f}'i tümüyle gömülür, "
          f"%{100 * GOMUL_IST['duz'][1] / max(1, GOMUL_IST['duz'][2]):.0f}'inde görünen kiriş ≤ 1,0 r olurdu", flush=True)
def normalize(seritler):
    """tree.ts zamanları uç noktalarının (+0,07) bitişine göre normalize: şeritler ≤ 0,93'te biter → büyüme penceresinin
    sonu ölü kalıyordu. Burada aşamanın en geç şeridi t1 = 1 olacak biçimde ölçeklenir."""
    m = max(s_["t1"] for s_ in seritler)
    for s_ in seritler:
        s_["t0"] /= m
        s_["t1"] /= m
    return m


ZAMAN_OLCEK = {"kok": normalize(KOK_SERIT)}
KOKLER = egri_nesne("S3_kokler", KOK_SERIT, MS["kok"])

# gövde: derinlik 10 mm; boğumlarda yarıçap kabarması (+%30) ve koyu halka (yalnız 'bogum' özniteliği)
GOV_Y = 0.010
gv = AG["govde"]["noktalar"]
L_ = [0.0]
for i in range(1, len(gv)):
    L_.append(L_[-1] + math.hypot(gv[i][0] - gv[i - 1][0], gv[i][1] - gv[i - 1][1]))
BOG_Q = []
for kn in AG["bogumlar"]:
    j = min(range(len(gv)), key=lambda i: math.hypot(gv[i][0] - kn["x"], gv[i][1] - kn["y"]))
    BOG_Q.append(L_[j] / L_[-1])
# K10 gövde kalınlığı (--govde_k, G-A 1,0 "tel gibi"): çarpan tabanda govde_k, uca doğru doğrusal olarak önder tabanının
# gövde ucuna oranına iner (tree.ts önder tabanı 4,4 × 1,15 ↔ gövde ucu 4,6 birim: 1,10; birleşimde basamak yok). Boğum
# kabarması (+%30) yarıçapla çarpıldığından oransal; kanca genliği KANCA_A = 0,22 × govde_k. Ön yüz (kameraya bakan) yerinde
# kalır: merkez hattı r·(k − 1) arkaya kayar → taban cama/toprak ön yüzüne taşmaz, dal bağlantıları ve kamera çözümü
# (GOV_Y) değişmez; siluet yanlara ×k genişler.
_onder = next(d_ for d_ in AG["dallar"] if d_["tur"] == "onder")
GOVDE_K_UC = min(A.govde_k, max(1.0, _onder["noktalar"][0][2] * 1.15 / gv[-1][2])) if A.govde_k > 1.0 else A.govde_k
KANCA_A = 0.22 * A.govde_k
gpts, grr, gbog = [], [], []
for i, (x, y, w) in enumerate(gv):
    q = L_[i] / L_[-1]
    b = sum(math.exp(-((q - qk) / 0.014) ** 2) for qk in BOG_Q)
    X, _, Z = agac3(x, y)
    kg_ = A.govde_k + (GOVDE_K_UC - A.govde_k) * q
    r0 = w / 2 * BIRIM
    gpts.append((X, GOV_Y + r0 * (kg_ - 1.0), Z))
    grr.append(r0 * kg_ * (1.0 + 0.30 * b))
    gbog.append(min(1.0, b))
print(f"[S3] gövde ×{A.govde_k:.2f} (uçta ×{GOVDE_K_UC:.2f}): taban çapı {gv[0][2] * BIRIM * 1e3:.1f} → "
      f"{gv[0][2] * BIRIM * A.govde_k * 1e3:.1f} mm, uç {gv[-1][2] * BIRIM * 1e3:.1f} → {gv[-1][2] * BIRIM * GOVDE_K_UC * 1e3:.1f} mm "
      f"(lc kalınlığı; pa ×0,71, pb ×0,87); kanca {KANCA_A:.3f}", flush=True)
GOVDE = egri_nesne("S3_govde", [{"noktalar": gpts, "r": grr, "t0": 0.0, "t1": 1.0, "ana": 1.0, "yas0": 1.0, "yas1": 0.0,
                                 "bogum": gbog}], MS["kabuk"])

# dallar: 3B'ye dönüş — ana dal i, bağlandığı noktadan geçen düşey eksen çevresinde ±(25–40)° (sırayla); alt dallar
# ana dalıyla birlikte döner (+ kendi ±12°'si). Önden siluet /fidan'a yakın kalır, tbc yayında hacim görünür.
DAL_ACI = [32.0, -26.0, 38.0, -30.0, 25.0, -34.0]


def dondur(x, y, derin, ax, ad_aci):
    """(x, y) ağaç birimi; ax: dönme ekseninin x'i; açı + → kameradan uzağa (derinlik +)."""
    c_, s_ = math.cos(math.radians(ad_aci)), math.sin(math.radians(ad_aci))
    dx = (x - ax) * BIRIM
    return ((ax - 200.0) * BIRIM + dx * c_, derin + dx * s_, (GY - y) * BIRIM)


DAL_SERIT, DAL_DONUS = [], {}
for dl in AG["dallar"]:
    n0 = dl["noktalar"][0]
    if dl["tur"] == "onder":
        aci, ax = 0.0, n0[0]
    elif dl["tur"] == "ana":
        aci, ax = DAL_ACI[dl["ana_id"]], n0[0]
        DAL_DONUS[dl["ana_id"]] = (ax, aci)
    else:
        ax0, aci0 = DAL_DONUS[dl["ana_id"]]
        aci, ax = aci0, ax0
    pts, rr = [], []
    for x, y, w in dl["noktalar"]:
        X, Y, Z = dondur(x, y, GOV_Y, ax, aci)
        if dl["tur"] == "alt":   # alt dal: kendi ±12° (bağlandığı noktadan)
            bx, by_, _ = dondur(n0[0], n0[1], GOV_Y, ax, aci)
            e = math.radians(12.0 if (dl["i"] % 2) else -12.0)
            vx, vy = X - bx, Y - by_
            X, Y = bx + vx * math.cos(e) - vy * math.sin(e), by_ + vx * math.sin(e) + vy * math.cos(e)
        pts.append((X, Y, Z))
        rr.append(w / 2 * BIRIM * 1.15)
    DAL_SERIT.append({"noktalar": pts, "r": rr, "t0": dl["start"], "t1": dl["end"], "ana": 1.0 if dl["tur"] != "alt" else 0.0,
                      "yas0": 0.6 if dl["tur"] != "alt" else 0.3, "yas1": 0.0, "tur": dl["tur"], "ana_id": dl["ana_id"],
                      "ax": ax, "aci": aci})
ZAMAN_OLCEK["dal"] = normalize(DAL_SERIT)
DALLAR = egri_nesne("S3_dallar", DAL_SERIT, MS["kabuk"])


def dal_3b(x, y, derin_ek=0.0):
    """2B noktayı en yakın dal şeridinin dönüşüyle 3B'ye taşır (yapraklar dallarıyla birlikte döner)."""
    en, sec, qs = 1e9, None, 0.0
    for s, dl in zip(DAL_SERIT, AG["dallar"]):
        n_ = len(dl["noktalar"])
        for j, (px, py, _w) in enumerate(dl["noktalar"]):
            d_ = (px - x) ** 2 + (py - y) ** 2
            if d_ < en:
                en, sec, qs = d_, s, j / (n_ - 1)
    X, Y, Z = dondur(x, y, GOV_Y + derin_ek, sec["ax"], sec["aci"])
    return X, Y, Z, sec["t0"] + qs * (sec["t1"] - sec["t0"])


# ================================================================== 7) yaprak şablonları + nokta bulutu
def yaprak_sablon(ad, lob, gen, tepe):
    """Meşe yaprağı: ters yumurta biçimi, yuvarlak loblar + daha dar girintiler; orta damar +Y, sap başlangıçta; birim
    boy. 'kenar' öznitelik (0 damar → 1 kenar)."""
    N = 64
    co, fz, ken = [], [], []
    for i in range(N + 1):
        t = i / N
        sap = 0.09
        if t < sap:
            w = 0.010
        else:
            u = (t - sap) / (1 - sap)
            prof = math.sin(math.pi * min(1.0, u ** tepe)) ** 0.85 * (0.75 + 0.25 * u)
            dalga = 0.5 + 0.5 * math.cos(2 * math.pi * lob * u + 0.9)
            lobk = 0.58 + 0.42 * dalga ** 0.45
            uc = 1.0 - 0.35 * max(0.0, u - 0.88) / 0.12
            w = max(0.008, gen * prof * lobk * uc)
        cup = 0.08 * gen
        dz = -0.06 * t * t
        co.append((-w, t, dz + cup))
        co.append((0.0, t, dz + 0.003))
        co.append((w, t, dz + cup))
        ken += [1.0, 0.0, 1.0]
    for i in range(N):
        a_ = 3 * i
        fz.append((a_, a_ + 1, a_ + 4, a_ + 3))
        fz.append((a_ + 1, a_ + 2, a_ + 5, a_ + 4))
    me = O.ag(ad, co, fz)
    at = me.attributes.new("kenar", "FLOAT", "POINT")
    at.data.foreach_set("value", ken)
    for p in me.polygons:
        p.use_smooth = True
    return obj(ad, me, col=SABLON_COL, parent=None)


SABLON = [yaprak_sablon("S3_yaprak_0", 4.5, 0.28, 0.80), yaprak_sablon("S3_yaprak_1", 3.5, 0.31, 0.90),
          yaprak_sablon("S3_yaprak_2", 5.5, 0.25, 0.75)]
kap_m = bpy.data.meshes.new("S3_kapak_sablon")
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=7, radius=1.0)
for v in bm.verts:
    v.co.z *= 1.9
    if v.co.z > 0:
        v.co.z *= 0.7
bm.to_mesh(kap_m)
bm.free()
for p in kap_m.polygons:
    p.use_smooth = True
SABLON_KAPAK_COL = bpy.data.collections.new("s3_sablon_kapak")
sc.collection.children.link(SABLON_KAPAK_COL)
SABLON_KAPAK_COL.hide_render = True
SABLON_KAPAK_COL.hide_viewport = True
KAPAK_SABLON = obj("S3_kapak_sablon", kap_m, col=SABLON_KAPAK_COL, parent=None)


def yaprak_noktalari():
    rnd = random.Random(300)
    L = []
    for i, lf in enumerate(AG["yapraklar"]):
        L.append(dict(lf, ek=0, i=i))
    n_ek = int(len(AG["yapraklar"]) * A.ek_yaprak)
    kaynak_ = sorted(AG["yapraklar"], key=lambda l: rnd.random())[:n_ek]
    for j, lf in enumerate(kaynak_):
        L.append(dict(lf, ek=1, i=1000 + j, x=lf["x"] + rnd.uniform(-9, 9), y=lf["y"] + rnd.uniform(-7, 7),
                      start=min(0.97, lf["start"] + rnd.uniform(0.0, 0.06)), s=lf["s"] * rnd.uniform(0.8, 1.05),
                      tone=rnd.choice([0, 0, 1, 2])))
    co, at = [], {k: [] for k in ("dogum", "s", "faz", "tur", "ton", "jit", "kuru", "dal_t")}
    don = []
    for lf in L:
        derin = rnd.uniform(-0.012, 0.012) if not lf["ek"] else rnd.choice([-1, 1]) * rnd.uniform(0.016, 0.045)
        X, Y, Z, dal_t = dal_3b(lf["x"], lf["y"], derin)
        at["dal_t"].append(dal_t)
        co.append((X, Y, Z))
        rot = math.radians(lf["rot"])
        b = Vector((math.cos(rot), rnd.uniform(-0.35, 0.35), -math.sin(rot))).normalized()   # SVG y aşağı → Z yukarı
        n = Vector((rnd.uniform(-0.3, 0.3), -1.0, rnd.uniform(0.1, 0.6)))
        n = (n - b * n.dot(b)).normalized()
        xl = b.cross(n)
        M = Matrix((xl, b, n)).transposed()
        e = M.to_euler("XYZ")
        don.extend([e.x, e.y, e.z])
        at["dogum"].append(lf["start"])
        at["s"].append(lf["s"] * A.yaprak_boy)
        at["faz"].append(rnd.uniform(0, 2 * math.pi))
        at["tur"].append(rnd.randrange(3))
        at["ton"].append(float(lf["tone"]))
        at["jit"].append(rnd.uniform(-1, 1))
        at["kuru"].append(1.0 if rnd.random() < 0.05 else 0.0)
    YAPRAK_VERI.extend(zip(co, [Euler(don[i * 3:i * 3 + 3], "XYZ") for i in range(len(co))], at["s"], at["dogum"], at["dal_t"]))
    me = bpy.data.meshes.new("S3_yaprak_nokta")
    me.from_pydata(co, [], [])
    for k, v in at.items():
        tip = "INT" if k == "tur" else "FLOAT"
        a_ = me.attributes.new(k, tip, "POINT")
        a_.data.foreach_set("value", v)
    a_ = me.attributes.new("don", "FLOAT_VECTOR", "POINT")
    a_.data.foreach_set("vector", don)
    return obj("S3_yapraklar", me), len(L)


YAPRAK_VERI = []
YAPRAK, N_YAPRAK = yaprak_noktalari()

# ================================================================== 8) geometry nodes
def soket(ng, ad, tip, io="INPUT", vars_=None):
    s = ng.interface.new_socket(ad, in_out=io, socket_type=tip)
    if vars_ is not None and hasattr(s, "default_value"):
        s.default_value = vars_
    return s


def gn_egri():
    """FD_Egri: sabit topolojili büyüme. p = clamp((g − t0)/(t1 − t0)) şerit başına; Resample (Sayı sabit) → her nokta
    Sample Curve(asıl eğri, faktör = q·p) → konum + yarıçap; uç her zaman ince; uç bölgesi 'uc_bolge'; kapak örneği."""
    ng = bpy.data.node_groups.new("FD_Egri", "GeometryNodeTree")
    soket(ng, "Geometry", "NodeSocketGeometry")
    soket(ng, "g", "NodeSocketFloat", vars_=0.0)
    soket(ng, "kalin", "NodeSocketFloat", vars_=1.0)
    soket(ng, "kapak", "NodeSocketFloat", vars_=0.0)
    soket(ng, "kanca", "NodeSocketFloat", vars_=0.0)
    soket(ng, "sayi", "NodeSocketInt", vars_=24)
    soket(ng, "kapak_nesne", "NodeSocketObject")
    soket(ng, "kapak_mat", "NodeSocketMaterial")
    soket(ng, "mat", "NodeSocketMaterial")
    soket(ng, "profil", "NodeSocketInt", vars_=8)
    soket(ng, "uc_ince", "NodeSocketFloat", vars_=0.38)
    soket(ng, "kapak_min", "NodeSocketFloat", vars_=0.0)
    soket(ng, "Geometry", "NodeSocketGeometry", io="OUTPUT")
    d = O.D(ng)
    gi = d("NodeGroupInput")
    go = d("NodeGroupOutput")

    def na(ad, tip="FLOAT"):
        n = d("GeometryNodeInputNamedAttribute", data_type=tip)
        n.inputs["Name"].default_value = ad
        return n.outputs["Attribute"]

    def m(op, x, y=None, z=None):
        n = d("ShaderNodeMath", operation=op)
        for i, v in enumerate((x, y, z)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                d.b(v, n.inputs[i])
        return n.outputs[0]

    def harita(x, a0, a1, b0=0.0, b1=1.0, tip="SMOOTHSTEP"):
        n = d("ShaderNodeMapRange", interpolation_type=tip, clamp=True)
        d.b(x, n.inputs["Value"])
        n.inputs["From Min"].default_value = a0
        n.inputs["From Max"].default_value = a1
        n.inputs["To Min"].default_value = b0
        n.inputs["To Max"].default_value = b1
        return n.outputs["Result"]

    res = d("GeometryNodeResampleCurve")
    res.inputs["Mode"].default_value = "Count"
    d.b(gi.outputs["Geometry"], res.inputs["Curve"])
    d.b(gi.outputs["sayi"], res.inputs["Count"])
    t0, t1 = na("t0"), na("t1")
    p = m("DIVIDE", m("SUBTRACT", gi.outputs["g"], t0), m("MAXIMUM", m("SUBTRACT", t1, t0), 1e-4))
    p = m("MINIMUM", m("MAXIMUM", p, 0.0), 1.0)
    sp = d("GeometryNodeSplineParameter")
    q = sp.outputs["Factor"]
    cop = d("GeometryNodeCurveOfPoint")
    smp = d("GeometryNodeSampleCurve", data_type="FLOAT", mode="FACTOR", use_all_curves=False)
    d.b(gi.outputs["Geometry"], smp.inputs["Curves"])
    rad_in = d("GeometryNodeInputRadius")
    d.b(rad_in.outputs["Radius"], smp.inputs["Value"])
    d.b(m("MULTIPLY", q, p), smp.inputs["Factor"])
    d.b(cop.outputs["Curve Index"], smp.inputs["Curve Index"])
    uzun = d("GeometryNodeSplineLength").outputs["Length"]
    d_uc = m("MULTIPLY", m("MULTIPLY", m("SUBTRACT", 1.0, q), p), uzun)       # uca uzaklık (m)
    # kanca (gövde çıkışı): büyüyen son %25 aşağı ve yana kıvrılır; genlik = kanca × büyüyen boy
    kq = harita(q, 0.72, 1.0)
    kq2 = m("MULTIPLY", kq, kq)
    kg = m("MULTIPLY", m("MULTIPLY", gi.outputs["kanca"], m("MULTIPLY", p, uzun)), kq2)
    kof = d("ShaderNodeCombineXYZ")
    d.b(m("MULTIPLY", kg, 0.55), kof.inputs["X"])
    d.b(m("MULTIPLY", kg, -0.95), kof.inputs["Z"])
    sp_ = d("GeometryNodeSetPosition")
    d.b(res.outputs["Curve"], sp_.inputs["Geometry"])
    d.b(smp.outputs["Position"], sp_.inputs["Position"])
    d.b(kof.outputs["Vector"], sp_.inputs["Offset"])
    # yarıçap: örneklenen asıl yarıçap × kalınlaşma × uç incelmesi × görünürlük
    incel = m("ADD", gi.outputs["uc_ince"], m("MULTIPLY", m("SUBTRACT", 1.0, gi.outputs["uc_ince"]), harita(d_uc, 0.0, 0.006)))
    gor = harita(p, 0.0, 0.015)
    kal = m("ADD", 0.55, m("MULTIPLY", 0.45, gi.outputs["kalin"]))
    yr = m("MULTIPLY", m("MULTIPLY", smp.outputs["Value"], kal), m("MULTIPLY", incel, gor))
    scr = d("GeometryNodeSetCurveRadius")
    d.b(sp_.outputs["Geometry"], scr.inputs["Curve"])
    d.b(yr, scr.inputs["Radius"])
    # öznitelikler (Curve to Mesh noktadan yüze taşır): q (asıl eğri parametresi), uc_bolge, yas
    def sakla(geo, ad, deger):
        n = d("GeometryNodeStoreNamedAttribute", data_type="FLOAT", domain="POINT")
        n.inputs["Name"].default_value = ad
        d.b(geo, n.inputs["Geometry"])
        d.b(deger, n.inputs["Value"])
        return n.outputs["Geometry"]
    g1 = sakla(scr.outputs["Curve"], "q", m("MULTIPLY", q, p))
    ub = m("MULTIPLY", m("SUBTRACT", 1.0, harita(d_uc, 0.003, 0.016)), m("SUBTRACT", 1.0, na("ana")))
    g2 = sakla(g1, "uc_bolge", m("MAXIMUM", ub, m("MULTIPLY", m("SUBTRACT", 1.0, harita(d_uc, 0.002, 0.010)), 0.8)))
    yas = m("ADD", na("yas1"), m("MULTIPLY", m("SUBTRACT", na("yas0"), na("yas1")), m("SUBTRACT", 1.0, m("MULTIPLY", q, p))))
    g3 = sakla(g2, "yas", yas)
    g3b = sakla(g3, "bogum", na("bogum"))
    # K10: kökün ek gömülmesi (m) büyüyen noktanın asıl eğri konumundan örneklenir → mesh'e taşınır (FD_Toprak nem halesi)
    smp_g = d("GeometryNodeSampleCurve", data_type="FLOAT", mode="FACTOR", use_all_curves=False)
    d.b(gi.outputs["Geometry"], smp_g.inputs["Curves"])
    d.b(na("gomul"), smp_g.inputs["Value"])
    d.b(m("MULTIPLY", q, p), smp_g.inputs["Factor"])
    d.b(cop.outputs["Curve Index"], smp_g.inputs["Curve Index"])
    g3c = sakla(g3b, "gomul", smp_g.outputs["Value"])
    prof = d("GeometryNodeCurvePrimitiveCircle")
    prof.inputs["Radius"].default_value = 1.0
    d.b(gi.outputs["profil"], prof.inputs["Resolution"])
    c2m = d("GeometryNodeCurveToMesh")
    d.b(g3c, c2m.inputs["Curve"])
    d.b(prof.outputs["Curve"], c2m.inputs["Profile Curve"])
    d.b(d("GeometryNodeInputRadius").outputs["Radius"], c2m.inputs["Scale"])
    c2m.inputs["Fill Caps"].default_value = True
    smat = d("GeometryNodeSetMaterial")
    d.b(c2m.outputs["Mesh"], smat.inputs["Geometry"])
    d.b(gi.outputs["mat"], smat.inputs["Material"])
    ss = d("GeometryNodeSetShadeSmooth")
    d.b(smat.outputs["Geometry"], ss.inputs["Mesh"])
    # kök kapağı: uç noktasında elipsoit (Z teğete), ölçek = uç yarıçapı × 1,35 × kapak × görünürlük
    uc = d("GeometryNodeCurveEndpointSelection")
    uc.inputs["Start Size"].default_value = 0
    uc.inputs["End Size"].default_value = 1
    oi = d("GeometryNodeObjectInfo", transform_space="ORIGINAL")
    d.b(gi.outputs["kapak_nesne"], oi.inputs["Object"])
    al = d("FunctionNodeAlignRotationToVector", axis="Z")
    d.b(d("GeometryNodeInputTangent").outputs["Tangent"], al.inputs["Vector"])
    iop = d("GeometryNodeInstanceOnPoints")
    d.b(g3b, iop.inputs["Points"])
    d.b(uc.outputs["Selection"], iop.inputs["Selection"])
    d.b(oi.outputs["Geometry"], iop.inputs["Instance"])
    d.b(al.outputs["Rotation"], iop.inputs["Rotation"])
    rr_ = d("GeometryNodeInputRadius").outputs["Radius"]
    kol = m("MAXIMUM", m("MULTIPLY", rr_, gi.outputs["kapak"]),
            m("MULTIPLY", m("MULTIPLY", gi.outputs["kapak_min"], m("MINIMUM", m("DIVIDE", rr_, 0.0004), 1.0)),
              m("GREATER_THAN", gi.outputs["kapak"], 0.0)))
    d.b(kol, iop.inputs["Scale"])
    rz = d("GeometryNodeRealizeInstances")
    d.b(iop.outputs["Instances"], rz.inputs["Geometry"])
    kmat = d("GeometryNodeSetMaterial")
    d.b(rz.outputs["Geometry"], kmat.inputs["Geometry"])
    d.b(gi.outputs["kapak_mat"], kmat.inputs["Material"])
    j = d("GeometryNodeJoinGeometry")
    d.b(kmat.outputs["Geometry"], j.inputs["Geometry"])
    d.b(ss.outputs["Mesh"], j.inputs["Geometry"])
    d.b(j.outputs["Geometry"], go.inputs["Geometry"])
    return ng


def gn_yaprak():
    """FD_Yaprak: yaprak örnekleri. Ölçek: boy önce, en sonra açılır (tomurcuk → yaprak; aşma yok); tomurcuk taban ölçeği;
    titreme = A·genlik·sin(2π·(kare + ofs)/120 + faz) yerel eksende (periyodik; lc dikişsiz)."""
    ng = bpy.data.node_groups.new("FD_Yaprak", "GeometryNodeTree")
    soket(ng, "Geometry", "NodeSocketGeometry")
    soket(ng, "g", "NodeSocketFloat", vars_=0.0)
    soket(ng, "tomurcuk", "NodeSocketFloat", vars_=0.0)
    soket(ng, "g_dal", "NodeSocketFloat", vars_=0.0)
    soket(ng, "titreme", "NodeSocketFloat", vars_=0.0)
    soket(ng, "ofs", "NodeSocketFloat", vars_=0.0)
    soket(ng, "sablon", "NodeSocketCollection")
    soket(ng, "mat", "NodeSocketMaterial")
    soket(ng, "Geometry", "NodeSocketGeometry", io="OUTPUT")
    d = O.D(ng)
    gi = d("NodeGroupInput")
    go = d("NodeGroupOutput")

    def na(ad, tip="FLOAT"):
        n = d("GeometryNodeInputNamedAttribute", data_type=tip)
        n.inputs["Name"].default_value = ad
        return n.outputs["Attribute"]

    def m(op, x, y=None):
        n = d("ShaderNodeMath", operation=op)
        for i, v in enumerate((x, y)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                d.b(v, n.inputs[i])
        return n.outputs[0]

    def harita(x, a0, a1, tip="SMOOTHERSTEP"):
        n = d("ShaderNodeMapRange", interpolation_type=tip, clamp=True)
        d.b(x, n.inputs["Value"])
        if isinstance(a0, (int, float)):
            n.inputs["From Min"].default_value = a0
        else:
            d.b(a0, n.inputs["From Min"])
        if isinstance(a1, (int, float)):
            n.inputs["From Max"].default_value = a1
        else:
            d.b(a1, n.inputs["From Max"])
        return n.outputs["Result"]

    dog = na("dogum")
    k = m("SUBTRACT", gi.outputs["g"], dog)
    boy = harita(k, 0.0, 0.10)
    en = harita(k, 0.03, 0.14)
    dal_var = harita(m("SUBTRACT", gi.outputs["g_dal"], na("dal_t")), 0.0, 0.05, "SMOOTHSTEP")   # dal o noktaya vardı mı
    tm = m("MULTIPLY", m("MULTIPLY", gi.outputs["tomurcuk"], 0.11), dal_var)
    boy = m("MAXIMUM", boy, tm)
    en = m("MAXIMUM", en, m("MULTIPLY", tm, 0.22))
    s = na("s")
    olc = d("ShaderNodeCombineXYZ")
    d.b(m("MULTIPLY", s, m("ADD", 0.12, m("MULTIPLY", en, 0.88))), olc.inputs["X"])
    d.b(m("MULTIPLY", s, boy), olc.inputs["Y"])
    d.b(m("MULTIPLY", s, m("ADD", 0.4, m("MULTIPLY", en, 0.6))), olc.inputs["Z"])
    # görünmeyen (doğmamış) yaprak: ölçek 0 (sayı sabit); MAXIMUM(boy, tm) zaten 0 → X/Z 0'a çarpılır
    gor = m("GREATER_THAN", boy, 1e-4)
    olc2 = d("ShaderNodeVectorMath", operation="SCALE")
    d.b(olc.outputs["Vector"], olc2.inputs[0])
    d.b(gor, olc2.inputs["Scale"])
    ci = d("GeometryNodeCollectionInfo", transform_space="ORIGINAL")
    d.b(gi.outputs["sablon"], ci.inputs["Collection"])
    ci.inputs["Separate Children"].default_value = True
    ci.inputs["Reset Children"].default_value = True
    er = d("FunctionNodeEulerToRotation")
    d.b(na("don", "FLOAT_VECTOR"), er.inputs["Euler"])
    iop = d("GeometryNodeInstanceOnPoints")
    d.b(gi.outputs["Geometry"], iop.inputs["Points"])
    d.b(ci.outputs["Instances"], iop.inputs["Instance"])
    iop.inputs["Pick Instance"].default_value = True
    d.b(na("tur", "INT"), iop.inputs["Instance Index"])
    d.b(er.outputs["Rotation"], iop.inputs["Rotation"])
    d.b(olc2.outputs["Vector"], iop.inputs["Scale"])
    # titreme
    st = d("GeometryNodeInputSceneTime")
    faz = m("ADD", m("MULTIPLY", m("ADD", st.outputs["Frame"], gi.outputs["ofs"]), 2 * math.pi / 120.0), na("faz"))
    aci = m("MULTIPLY", m("SINE", faz), m("MULTIPLY", gi.outputs["titreme"], math.radians(5.0)))
    ev = d("ShaderNodeCombineXYZ")
    d.b(aci, ev.inputs["X"])
    d.b(m("MULTIPLY", aci, 0.35), ev.inputs["Y"])
    e2r = d("FunctionNodeEulerToRotation")
    d.b(ev.outputs["Vector"], e2r.inputs["Euler"])
    ri = d("GeometryNodeRotateInstances")
    d.b(iop.outputs["Instances"], ri.inputs["Instances"])
    d.b(e2r.outputs["Rotation"], ri.inputs["Rotation"])
    ri.inputs["Local Space"].default_value = True
    rz = d("GeometryNodeRealizeInstances")
    d.b(ri.outputs["Instances"], rz.inputs["Geometry"])
    smat = d("GeometryNodeSetMaterial")
    d.b(rz.outputs["Geometry"], smat.inputs["Geometry"])
    d.b(gi.outputs["mat"], smat.inputs["Material"])
    d.b(smat.outputs["Geometry"], go.inputs["Geometry"])
    return ng


def gn_toprak():
    """FD_Toprak: ön yüz ızgarasında kök yüzeyine uzaklık → 'nem' (≤ 2 mm tam, 5 mm'de 0): kök gömülü görünür."""
    ng = bpy.data.node_groups.new("FD_Toprak", "GeometryNodeTree")
    soket(ng, "Geometry", "NodeSocketGeometry")
    soket(ng, "kok", "NodeSocketObject")
    soket(ng, "Geometry", "NodeSocketGeometry", io="OUTPUT")
    d = O.D(ng)
    gi = d("NodeGroupInput")
    go = d("NodeGroupOutput")
    oi = d("GeometryNodeObjectInfo", transform_space="RELATIVE")
    d.b(gi.outputs["kok"], oi.inputs["Object"])
    ayr = d("GeometryNodeSeparateGeometry", domain="FACE")
    d.b(oi.outputs["Geometry"], ayr.inputs["Geometry"])
    alan = d("ShaderNodeMath", operation="GREATER_THAN")
    d.b(d("GeometryNodeInputMeshFaceArea").outputs["Area"], alan.inputs[0])
    alan.inputs[1].default_value = 2e-8
    d.b(alan.outputs[0], ayr.inputs["Selection"])
    px = d("GeometryNodeProximity", target_element="FACES")
    d.b(ayr.outputs["Selection"], px.inputs["Geometry"])
    d.b(d("GeometryNodeInputPosition").outputs["Position"], px.inputs["Sample Position"])
    # K10: hale penceresi en yakın kök yüzeyinin ek gömülmesi kadar dışa kayar (1,5 + g … 5 + g mm): derine inen kökün
    # üstündeki ince toprak omzu nemli/koyu kalır, hale görünen kök kenarından aynı oranda taşar (g = 0 → G-A aynen)
    sns = d("GeometryNodeSampleNearestSurface", data_type="FLOAT")
    d.b(ayr.outputs["Selection"], sns.inputs["Mesh"])
    gmn = d("GeometryNodeInputNamedAttribute", data_type="FLOAT")
    gmn.inputs["Name"].default_value = "gomul"
    d.b(gmn.outputs["Attribute"], sns.inputs["Value"])
    d.b(d("GeometryNodeInputPosition").outputs["Position"], sns.inputs["Sample Position"])
    mr = d("ShaderNodeMapRange", interpolation_type="SMOOTHSTEP", clamp=True)
    d.b(px.outputs["Distance"], mr.inputs["Value"])
    for ad_, v_ in (("From Min", 0.0015), ("From Max", 0.005)):
        ek_ = d("ShaderNodeMath", operation="ADD")
        ek_.inputs[1].default_value = v_
        d.b(sns.outputs["Value"], ek_.inputs[0])
        d.b(ek_.outputs[0], mr.inputs[ad_])
    mr.inputs["To Min"].default_value = 1.0
    mr.inputs["To Max"].default_value = 0.0
    # G-B düzeltmesi: kök henüz büyümemişken (t78f, t89 ~0–20; hedef boş) Proximity uzaklığı 0 döndürüyordu → bütün ön yüz
    # nem = 1 (koyu, parlak), kökler belirince tek karede normale sıçrıyordu (t89 20 → 21). Is Valid ile boş hedefte nem 0.
    gec = d("ShaderNodeMath", operation="MULTIPLY")
    d.b(mr.outputs["Result"], gec.inputs[0])
    d.b(px.outputs["Is Valid"], gec.inputs[1])
    st = d("GeometryNodeStoreNamedAttribute", data_type="FLOAT", domain="POINT")
    st.inputs["Name"].default_value = "nem"
    d.b(gi.outputs["Geometry"], st.inputs["Geometry"])
    d.b(gec.outputs[0], st.inputs["Value"])
    d.b(st.outputs["Geometry"], go.inputs["Geometry"])
    return ng


NG_EGRI, NG_YAPRAK, NG_TOPRAK = gn_egri(), gn_yaprak(), gn_toprak()


def mod_kur(o, ng, deg):
    md = o.modifiers.new("buyume", "NODES")
    md.node_group = ng
    kim = {}
    for it in ng.interface.items_tree:
        if it.item_type == "SOCKET" and it.in_out == "INPUT" and it.socket_type != "NodeSocketGeometry":
            kim[it.name] = it.identifier
    for k, v in deg.items():
        getattr(md.properties.inputs, kim[k]).value = v     # Blender 5.x: girdiler md.properties.inputs.Socket_N.value
    return md, kim


MOD = {}
MOD["kok"] = mod_kur(KOKLER, NG_EGRI, {"sayi": 28, "kapak": A.kapak_k, "kapak_nesne": KAPAK_SABLON, "kapak_mat": MS["kapak"],
                                       "mat": MS["kok"], "profil": 7, "uc_ince": 0.75,
                                       "kapak_min": A.kapak_min})
MOD["govde"] = mod_kur(GOVDE, NG_EGRI, {"sayi": 72, "kapak": 0.0, "kapak_nesne": KAPAK_SABLON, "kapak_mat": MS["kabuk"],
                                        "mat": MS["kabuk"], "profil": 12})
MOD["dal"] = mod_kur(DALLAR, NG_EGRI, {"sayi": 24, "kapak": 0.0, "kapak_nesne": KAPAK_SABLON, "kapak_mat": MS["kabuk"],
                                       "mat": MS["kabuk"], "profil": 8})
MOD["yaprak"] = mod_kur(YAPRAK, NG_YAPRAK, {"sablon": SABLON_COL, "mat": MS["yaprak"]})
MOD["toprak"] = mod_kur(TOPRAK_ON, NG_TOPRAK, {"kok": KOKLER})


def mod_anahtar(ad, alan, f, v):
    md, kim = MOD[ad]
    it = getattr(md.properties.inputs, kim[alan])
    it.value = v
    md.id_data.keyframe_insert(it.path_from_id("value"), frame=f)


# ================================================================== 9) ışık: fidan_spot (3.200 K) + 16.00 güneşi
sys.path.insert(0, S1_DIR)
from gunes import gunes as _gunes, gunes_vektor_enu  # noqa: E402
from datetime import datetime, timezone  # noqa: E402
_g = _gunes(datetime(2026, 11, 9, 13, 0, tzinfo=timezone.utc), 36.9397171, 30.8175767)
GUNES_YUK, GUNES_AZ = _g["yukseklik"], _g["azimut"]
GUNES_V = Vector(gunes_vektor_enu(GUNES_YUK, GUNES_AZ))     # güneşe doğru (X doğu, Y kuzey)
AGAC_ORTA = yerel(0.0, GOV_Y, 0.22)                        # taç–gövde ortası


def isik3(ad, loc, hedef, w, k_, boyut_deg, blend, yumusak):
    L = bpy.data.lights.new(ad, "SPOT")
    L.energy = w
    L.use_temperature = True
    L.temperature = k_
    L.color = (1, 1, 1)
    L.spot_size = math.radians(boyut_deg)
    L.spot_blend = blend
    L.shadow_soft_size = yumusak
    o = bpy.data.objects.new(ad, L)
    G2["COL"]["isik"].objects.link(o)
    o.location = loc
    o.rotation_euler = (hedef - loc).to_track_quat("-Z", "Y").to_euler()
    o.visible_camera = False
    return o


# fidan_spot: kamera solundan ve üstten, cama ~24° sıyırarak (yansıması kameradan uzağa). K10 (--spot_yan 5°): konum,
# hedeften geçen düşey eksen çevresinde cam normalinden 5° daha uzağa döner (G-A yerel (−0,85; −0,62) → 54,5°, K10 59,5°);
# uzaklık ve yükseklik aynı → kök kabartması daha yan ışıkla okunur. --spot_telafi: toprak ön yüzünün kök bölgesindeki
# ortalama aydınlığı (cos θ/d² × koni maskesi) G-A ile aynı kalsın diye güç çarpılır.
FS_HEDEF = yerel(0.02, 0.0, 0.08)
FS_SPOT_DEG, FS_BLEND = 48.0, 0.8
_fs0 = (-0.87, -0.62)                                      # hedefe göre yerel (x, y), G-A
_fsR = math.hypot(*_fs0)
_fsaz0 = math.atan2(-_fs0[0], -_fs0[1])


def _fs_loc(yan_deg):
    az = _fsaz0 + math.radians(yan_deg)
    return yerel(0.02 - _fsR * math.sin(az), -_fsR * math.cos(az), 0.78)


def _fs_yuz_aydinlik(loc):
    """Toprak ön yüzü (yerel y 0, normal −KY) kök bölgesi ızgarasında ortalama cos θ / d² × spot koni maskesi."""
    eks = (FS_HEDEF - loc).normalized()
    c_kon = math.cos(math.radians(FS_SPOT_DEG) / 2)
    top = 0.0
    n_ = 0
    for ix in range(9):
        for iz in range(7):
            p_ = yerel(-0.18 + 0.36 * ix / 8, 0.0, -0.24 + 0.22 * iz / 6)
            v = loc - p_
            d2 = v.length_squared
            cos_y = max(0.0, v.normalized().dot(-KY))
            x = (-v.normalized()).dot(eks)
            mask = O.clamp01((x - c_kon) / max(1e-6, FS_BLEND * (1 - c_kon)))
            top += cos_y / d2 * mask * mask * (3 - 2 * mask)
            n_ += 1
    return top / n_


FS_LOC = _fs_loc(A.spot_yan)
FS_TELAFI = (_fs_yuz_aydinlik(_fs_loc(0.0)) / _fs_yuz_aydinlik(FS_LOC)) if (A.spot_telafi and A.spot_yan) else 1.0
FIDAN_SPOT = isik3("fidan_spot", FS_LOC, FS_HEDEF, A.fidan_w * FS_TELAFI, 3200, FS_SPOT_DEG, FS_BLEND, 0.06)
print(f"[ISIK] fidan_spot yan açı {math.degrees(_fsaz0):.1f}° + {A.spot_yan:.1f}° → yerel ({0.02 - _fsR * math.sin(_fsaz0 + math.radians(A.spot_yan)):.3f}, "
      f"{-_fsR * math.cos(_fsaz0 + math.radians(A.spot_yan)):.3f}, 0.78); güç {A.fidan_w:.0f} × {FS_TELAFI:.3f} = "
      f"{A.fidan_w * FS_TELAFI:.0f} W (toprak yüzü aydınlığı telafisi)", flush=True)
K10 = {"govde_k": A.govde_k, "govde_k_uc": round(GOVDE_K_UC, 4), "kanca": round(KANCA_A, 4), "kok_gomul_m": A.kok_gomul,
       "kok_kiris_sinir": KOK_KIRIS, "nem_k": A.nem_k, "kok_gomul_uc_m": KOK_GOMUL_UC, "spot_yan_deg": A.spot_yan, "spot_telafi": round(FS_TELAFI, 4),
       "fidan_w_etkin": round(A.fidan_w * FS_TELAFI, 1), "yaprak_doy": A.yaprak_doy, "yaprak_ton": A.yaprak_ton,
       "g_yaprak_pencere": [A.g_yaprak_bas, A.g_yaprak_son], "g_yaprak_egri": A.g_yaprak_egri}
# güneş: ağaçtan güneş yönünde; yolu ışınla denetlenir, engelden 0,25 m önce durur (en çok 4 m)
bpy.context.view_layer.update()
_dg = bpy.context.evaluated_depsgraph_get()
# güneş ışınının yolundaki S2 nesneleri (pankart, cephe) yalnız S3 kliplerinde gölge düşürmez: "holün batı cephesinden
# giren 16.00 güneşi" kurgusu; spot dar ve ağaca dönük olduğundan yalnız fidanı aydınlatır. t78f'de dokunulmaz.
GUNES_MESAFE = 4.0
GUNES_ENGEL = []
_o = AGAC_ORTA + GUNES_V * 0.35
for _ in range(8):
    _hit, _loc, _n, _i, _ob, _m = sc.ray_cast(_dg, _o, GUNES_V, distance=GUNES_MESAFE)
    if not _hit:
        break
    GUNES_ENGEL.append(f"{_ob.name} @{(_loc - AGAC_ORTA).length:.2f} m")
    _o = _loc + GUNES_V * 1e-3
    if not _ob.name.startswith("S3_") and KLIP != "t78f" and KLIP not in S2_KASA:
        _ob.visible_shadow = False
GUNES_LOC = AGAC_ORTA + GUNES_V * GUNES_MESAFE
_yay = math.degrees(math.atan(0.50 / GUNES_MESAFE)) * 2 + 4
GUNES = isik3("gunes", GUNES_LOC, AGAC_ORTA, A.gunes_w * (GUNES_MESAFE / 4.0) ** 2, 4300, _yay, 0.55, 0.12)
print(f"[ISIK] güneş 16.00: yükseklik {GUNES_YUK:.2f}° azimut {GUNES_AZ:.2f}°; spot {GUNES_MESAFE:.2f} m, koni {_yay:.1f}°; "
      f"yoldaki S2 nesneleri (S3'te gölgesiz): {GUNES_ENGEL}", flush=True)

# d12 arka plan A/B (jüri J1): "altin" → güneş yönünde, uzakta, odak dışı sıcak pus perdesi (#5D7FAE üst → #E9C9A0 ufuk)
PERDE = None
if A.gok == "altin":
    pm, d = m_yeni("s3_perde")
    out = d("ShaderNodeOutputMaterial")
    tc = d("ShaderNodeTexCoord")
    sep = d("ShaderNodeSeparateXYZ")
    d.b(tc.outputs["Generated"], sep.inputs["Vector"])
    rr_ = ramp(d, sep.outputs["Z"], [(0.0, "#E9C9A0"), (0.35, "#C9A88A"), (1.0, "#5D7FAE")])
    em = d("ShaderNodeEmission")
    d.b(rr_, em.inputs["Color"])
    pm["guc"] = 0.0
    em.inputs["Strength"].default_value = 0.0
    d.b(em.outputs[0], out.inputs["Surface"])
    ufuk = AGAC_ORTA + Vector((GUNES_V.x, GUNES_V.y, 0)).normalized() * 7.0
    co = [(-12, 0, -2.0), (12, 0, -2.0), (12, 0, 8.0), (-12, 0, 8.0)]
    PERDE = bpy.data.objects.new("S3_perde", O.ag("S3_perde", co, [(0, 1, 2, 3)]))
    COLS.objects.link(PERDE)
    PERDE.data.materials.append(pm)
    PERDE.location = Vector((ufuk.x, ufuk.y, Z0 + 1.2))
    PERDE.rotation_euler = Euler((0, 0, math.atan2(-GUNES_V.x, GUNES_V.y) + math.pi))
    PERDE.visible_shadow = False
    PERDE_EM = em


# ================================================================== 10) kamera çözümü (/fidan FOCUS + fit() portu)
SAG = lambda psi: Vector((math.cos(math.radians(psi)), -math.sin(math.radians(psi)), 0.0))   # noqa: E731
ileri = G2["ileri"]


def ust_v(psi, phi):
    p_, f_ = math.radians(psi), math.radians(phi)
    return Vector((-math.sin(f_) * math.sin(p_), -math.sin(f_) * math.cos(p_), math.cos(f_)))


def proj_kam(pos, psi, phi, lens, w):
    """Dünya noktası → master px (1920²; 36 mm kare sensör); kamera arkasındaysa None."""
    fw, sg, up = ileri(psi, phi), SAG(psi), ust_v(psi, phi)
    v = Vector(w) - pos
    z = v.dot(fw)
    if z <= 1e-4:
        return None
    fpx = lens * 1920.0 / 36.0
    return (960.0 + fpx * v.dot(sg) / z, 960.0 - fpx * v.dot(up) / z, z)


def video_d(p):
    return ((p[0] - 420.0) / 1.5, p[1] / 1.5)


# FidanStory FOCUS (ağaç birimi). S3: d12 = taç + gövde (kökler bandın arkasında kalır; jüri J1/J3)
FOCUS = {
    "kok": {"x0": 14, "x1": 386, "y0": 444, "y1": 700},
    "govde": {"x0": 44, "x1": 356, "y0": 66, "y1": 500, "y1min": 470},
    "dallar": {"x0": 4, "x1": 396, "y0": 4, "y1": 446, "y1min": 392},
    "yaprak": {"x0": -8, "x1": 408, "y0": -4, "y1": 486, "y1min": 392},
}
# fit() bölgesi: dikey video (720×1280) px. Yatay güvenli alan %76 (x 86–634); özne bant dışında (alt bant y ≥ %68).
# d9: toprak çizgisi ~%30–36, kökler %32–64 (jüri J1 d9 düzeni). /fidan sabitleri CSS px'tir: SOFT_S 0,8 ve max 1,6
# CSS px/birim → telefonda (390×844: 1 CSS px = 1,517 video px) ×1,517.
BOLGE = {
    "kok": {"x0": 86.4, "x1": 633.6, "y0": 0.30 * 1280, "y1": 0.655 * 1280},
    "govde": {"x0": 86.4, "x1": 633.6, "y0": 0.13 * 1280, "y1": 0.655 * 1280},
    "dallar": {"x0": 86.4, "x1": 633.6, "y0": 0.12 * 1280, "y1": 0.655 * 1280},
    "yaprak": {"x0": 86.4, "x1": 633.6, "y0": 0.12 * 1280, "y1": 0.655 * 1280},
}
CSS_VIDEO = 1280.0 / 844.0
SOFT_S, MAX_S = 0.8 * CSS_VIDEO, 1.6 * CSS_VIDEO


def fit(f, r):
    """FidanStory.fit() birebir (ölçek sabitleri video px'e çevrilmiş): ağaç birimi → video px (s, tx, ty)."""
    rh = r["y1"] - r["y0"]
    sx = (r["x1"] - r["x0"]) / (f["x1"] - f["x0"])
    sy = rh / (f["y1"] - f["y0"])
    sy_min = rh / (f["y1min"] - f["y0"]) if f.get("y1min") else sy
    s = min(sx, f.get("max", MAX_S), max(sy, min(sy_min, SOFT_S)))
    yv = min(f["y1"], f["y0"] + rh / s)
    return {"s": s, "tx": (r["x0"] + r["x1"]) / 2 - s * (f["x0"] + f["x1"]) / 2,
            "ty": (r["y0"] + r["y1"]) / 2 - s * (f["y0"] + yv) / 2, "yv": yv}


def kamera_coz(ad, lens, derin, psi=PSI):
    """FOCUS[ad] dikdörtgeni fit() hedefine otursun: bilinmeyenler (uzaklık d, yükseklik h, eğim φ); kamera yatayda
    dikdörtgen ortasının hizasında, kasa normalinde. Hedefler: üst kenar y, alt (görünen yv) kenar y, orta genişlik."""
    f, r = FOCUS[ad], BOLGE[ad]
    ft = fit(f, r)
    cx = (f["x0"] + f["x1"]) / 2
    yv = ft["yv"]
    hedef = [ft["ty"] + ft["s"] * f["y0"], ft["ty"] + ft["s"] * yv, ft["s"] * (f["x1"] - f["x0"])]
    ym = (f["y0"] + yv) / 2
    P_ust = yerel(*agac3(cx, f["y0"], derin))
    P_alt = yerel(*agac3(cx, yv, derin))
    P_sol = yerel(*agac3(f["x0"], ym, derin))
    P_sag = yerel(*agac3(f["x1"], ym, derin))
    taban = yerel(*agac3(cx, ym, derin))
    fw0 = ileri(psi, 0.0)

    def durum(x):
        d_, h_, phi = x
        pos = taban - fw0 * d_
        pos.z = h_
        return pos, phi

    def hata(x):
        pos, phi = durum(x)
        a_, b_ = proj_kam(pos, psi, phi, lens, P_ust), proj_kam(pos, psi, phi, lens, P_alt)
        c_, e_ = proj_kam(pos, psi, phi, lens, P_sol), proj_kam(pos, psi, phi, lens, P_sag)
        if None in (a_, b_, c_, e_):
            return [1e6, 1e6, 1e6]
        return [video_d(a_)[1] - hedef[0], video_d(b_)[1] - hedef[1], (video_d(e_)[0] - video_d(c_)[0]) - hedef[2]]

    import numpy as np
    px_m = ft["s"] / BIRIM                                      # video px / m
    d0 = 35.556 * lens / px_m
    # başlangıç: dikdörtgen ortası hedef ortasına (eğimle), yükseklik dikdörtgen ortası
    vm = (hedef[0] + hedef[1]) / 2
    phi0 = -math.degrees(math.atan((vm - 640.0) * 1.5 / (lens * 1920.0 / 36.0)))
    x = [d0, taban.z, phi0]
    for _ in range(80):
        e = hata(x)
        n0 = sum(v * v for v in e)
        if max(abs(v) for v in e) < 0.01:
            break
        J = []
        for k in range(3):
            xx = list(x)
            xx[k] += 1e-5 if k < 2 else 1e-4
            ek = hata(xx)
            J.append([(ek[i] - e[i]) / (xx[k] - x[k]) for i in range(3)])
        dx = np.linalg.lstsq(np.array(J).T, -np.array(e), rcond=None)[0]   # J[k][i] = ∂e_i/∂x_k
        adim = 1.0
        while adim > 1e-4:
            xn = [x[i] + adim * float(dx[i]) for i in range(3)]
            if sum(v * v for v in hata(xn)) < n0:
                x = xn
                break
            adim *= 0.5
        else:
            break
    pos, phi = durum(x)
    return {"pos": pos, "psi": psi, "phi": phi, "lens": lens, "d": x[0], "fit": ft, "hedef_px": hedef, "hata": hata(x),
            "odak": (taban - pos).dot(ileri(psi, phi))}


def yaprak_zarfi(pay=4.0):
    """3B yaprak uçları ve kenarları ağaç birimine geri çevrilir (yerel X/Z → tree x/y); FOCUS.yaprak bununla genişler."""
    xs, ys = [], []
    for co_, eu, sz, dog, dt in YAPRAK_VERI:
        M = eu.to_matrix()
        for v in (Vector((0, sz, 0)), Vector((0.3 * sz, 0.6 * sz, 0)), Vector((-0.3 * sz, 0.6 * sz, 0)), Vector((0, 0, 0))):
            w = Vector(co_) + M @ v
            xs.append(w.x / BIRIM + 200.0)
            ys.append(GY - w.z / BIRIM)
    return min(xs) - pay, max(xs) + pay, min(ys) - pay


_zx0, _zx1, _zy0 = yaprak_zarfi()
FOCUS["yaprak"] = dict(FOCUS["yaprak"], x0=min(FOCUS["yaprak"]["x0"], _zx0), x1=max(FOCUS["yaprak"]["x1"], _zx1),
                       y0=min(FOCUS["yaprak"]["y0"], _zy0))
print(f"[KAMERA] d12 yaprak zarfı (ağaç birimi): x {_zx0:.0f}–{_zx1:.0f}, y0 {_zy0:.0f} → FOCUS.yaprak {FOCUS['yaprak']}", flush=True)
C9 = kamera_coz("kok", 50.0, 0.0)
CA = kamera_coz("govde", 50.0, GOV_Y)
CB = kamera_coz("dallar", 50.0, GOV_Y + 0.01)
CC = kamera_coz("yaprak", 50.0, GOV_Y + 0.01, psi=PSI + 3.0)
for ad_, c_ in (("C9", C9), ("CA", CA), ("CB", CB), ("CC", CC)):
    print(f"[KAMERA] {ad_}: konum {tuple(round(v, 3) for v in c_['pos'])} ψ {c_['psi']:.1f} φ {c_['phi']:.2f} "
          f"{c_['lens']:.0f} mm uzaklık {c_['d']:.3f} m s {c_['fit']['s']:.3f} video px/birim; hata px "
          f"{[round(v, 3) for v in c_['hata']]}", flush=True)

# t78 son kare kamerası (dikiş: t89[0] ≡ t78f[59])
_k8 = G2["kamera_durum"]("t78", N_T78)
C8 = {"pos": Vector(_k8["pos"]), "psi": _k8["psi"], "phi": _k8["phi"], "lens": _k8["lens"], "odak": _k8["odak"],
      "fstop": _k8["fstop"]}

# t79 (G-B sonrası; kullanıcı: "duvarlardan sonra broşürü hiç göstermeyelim, direkt fidana atlayalım"): d7 → d9.
# Baş: t78[0] = B pozu (t67[47]; 18 mm, f/16, duvar odağı). Son: C9 (t89[59]). Yol (Catmull-Rom, yay uzunluğu, fiske):
# B → T78_WA → T78_W1 (t78 koridoru: totem ile batı duvarı arası, iki yanda ≥ 0,95 m) → X → C9. X = C9'un bakış
# doğrultusundan --t79_yan (15°) kuzeye açılı bir doğru üzerinde 1,15 m geride, 0,16 m yukarıda: son parça kasaya bakış
# ekseni boyunca iner (son karelerde ekranda yalnız yakınlaşma); broşür yığınının (banko ortası) tepesine yaklaşılmaz.
_k7 = G2["kamera_durum"]("t78", 0)
C7 = {"pos": Vector(_k7["pos"]), "psi": _k7["psi"], "phi": _k7["phi"], "lens": _k7["lens"], "odak": _k7["odak"],
      "fstop": _k7["fstop"]}
FW9 = ileri(C9["psi"], C9["phi"])
HEDEF9 = C9["pos"] + FW9 * C9["odak"]       # d9 odak noktası (kasa camı düzlemi)


def _yon_yatay(psi):
    return Vector((math.sin(math.radians(psi)), math.cos(math.radians(psi)), 0.0))


if A.t79_x:
    T79_X = Vector(tuple(float(v) for v in A.t79_x.split(",")))
else:
    T79_X = C9["pos"] - _yon_yatay(C9["psi"] - A.t79_yan) * 1.15 + Vector((0, 0, 0.16))
_p79 = [C7["pos"], G2["T78_WA"].copy(), G2["T78_W1"].copy(), T79_X]
if A.t79_x2 > 0:   # son teğet bakış ekseninde (son karelerde ekranda yalnız yakınlaşma)
    _p79.append(C9["pos"] - _yon_yatay(C9["psi"]) * A.t79_x2 + Vector((0, 0, 0.16 * A.t79_x2 / 1.15)))
_p79.append(C9["pos"].copy())
T79_NOKTA = [_p79[0] + (_p79[0] - _p79[1]) * 0.4] + _p79 + [C9["pos"] + (C9["pos"] - _p79[-2])]
T79_ORNEK, T79_L = G2["cr_ornek"](T79_NOKTA)
print(f"[KAMERA] t79: B {tuple(round(v, 3) for v in C7['pos'])} → Wa → W1 → X {tuple(round(v, 3) for v in T79_X)} → C9; "
      f"yol {T79_L[-1]:.2f} m; odak B {C7['odak']:.3f} m f/{C7['fstop']:.1f}", flush=True)

# ================================================================== 11) zaman çizelgesi
FISKE_K = 2.4


def ilerleme(f, n):
    return O.fiske_kare(f, n, O.FISKE_A_SN, FISKE_K, FPS)


def pen(u, a0, a1):
    return O.clamp01((u - a0) / (a1 - a0))


def _smooth(x):
    x = O.clamp01(x)
    return x * x * (3 - 2 * x)


G_YAPRAK_EGRI = O.smoother if A.g_yaprak_egri == "smoother" else _smooth


def bez3(p0, p1, p2, p3, t):
    u = 1 - t
    return p0 * u ** 3 + p1 * 3 * u * u * t + p2 * 3 * u * t * t + p3 * t ** 3


def yay_uzunluk(pts_fn, n=400):
    L = [0.0]
    prev = pts_fn(0.0)
    for i in range(1, n + 1):
        p_ = pts_fn(i / n)
        L.append(L[-1] + (p_ - prev).length)
        prev = p_
    return L


def yay_param(L, s):
    hedef = s * L[-1]
    n = len(L) - 1
    for i in range(1, n + 1):
        if L[i] >= hedef:
            t0 = (i - 1) / n
            return t0 + (hedef - L[i - 1]) / max(1e-9, L[i] - L[i - 1]) / n
    return 1.0


def yol(cA, cB, kalkis, varis):
    """Kübik Bézier: cA → cB; kalkış ve varış teğetleri (m); yay uzunluğuyla parametre (ilerleme = yol oranı)."""
    p0, p3 = cA["pos"], cB["pos"]
    p1, p2 = p0 + kalkis, p3 + varis
    fn = lambda t: bez3(p0, p1, p2, p3, t)   # noqa: E731
    L = yay_uzunluk(fn)
    return lambda s: fn(yay_param(L, s))


def ln_lerp(a, b, s):
    return math.exp(math.log(a) + (math.log(b) - math.log(a)) * s)


# klip başına durum fonksiyonu: f → {kamera…, isik…, buyume…}. Uç durumlar: önceki klibin sonu ≡ sonrakinin başı.
SON = {"kok": 1.0, "govde": 1.0, "dal": 1.0, "yaprak": 1.0}
YOL89 = yol(C8, C9, Vector((0, 0, 0.22)), -ileri(PSI, 0.0) * 0.30 + Vector((0, 0, 0.20)))
YOL9A = yol(C9, CA, Vector((0, 0, 0.05)) - ileri(PSI, 0.0) * 0.02, Vector((0, 0, -0.08)))
YOLAB = yol(CA, CB, -ileri(PSI, 0.0) * 0.05, Vector((0, 0, -0.05)) - ileri(PSI, 0.0) * 0.03)
YOLBC = yol(CB, CC, -ileri(PSI, 0.0) * 0.06 + SAG(PSI) * 0.02, -ileri(CC["psi"], 0.0) * 0.04)


def durum(klip, f):
    n = KLIPLER3[klip][1]
    u = f / n if n else 0.0
    D = {"g_kok": 0.0, "g_govde": 0.0, "g_dal": 0.0, "g_yaprak": 0.0, "tomurcuk": 0.0, "kalin": 0.0, "kanca": 0.0,
         "titreme": 0.0, "ofs": 0.0, "fidan": 0.0, "fidan_k": 3200.0, "gunes": 0.0, "perde": 0.0, "s": 0.0}
    if klip in S2_KASA:   # S2 klibi aynen (kamera S2'nin anahtarları); kayıt için S2'nin kare kaydı
        pos, psi, phi, lens = G2["KAYIT"]["kamera"].get(f, G2["KAYIT"]["kamera"][min(max(f, K0), K1)])
        D.update(pos=Vector(pos), psi=psi, phi=phi, lens=lens, odak=None, fstop=None, s2=True)
        return D
    if klip == "t78f":
        k = G2["kamera_durum"]("t78", f)
        D.update(pos=Vector(k["pos"]), psi=k["psi"], phi=k["phi"], lens=k["lens"], odak=k["odak"], fstop=k["fstop"], s=k["s"],
                 s2=True)
        return D
    s = ilerleme(min(max(f, 0), n), n)
    D["s"] = s
    if klip == "t89":
        D["pos"] = YOL89(s)
        D["psi"] = PSI
        D["phi"] = O.lerp(C8["phi"], C9["phi"], O.ease_in_out_cubic(pen(s, 0.05, 0.80)))
        D["lens"] = ln_lerp(C8["lens"], C9["lens"], O.ease_in_out_sine(pen(s, 0.0, 0.85)))
        D["odak"] = O.lerp(C8["odak"], C9["odak"], O.smoother(pen(s, 0.10, 0.85)))
        D["fstop"] = O.lerp(C8["fstop"], 2.8, O.smoother(pen(s, 0.2, 0.9)))
        D["g_kok"] = O.smoother(pen(u, 0.30, 0.94))
        D["kalin"] = 0.0
        fk = O.ease_out_cubic(pen(u, 0.20, 0.70))      # akkor ısınması: enerji easeOutCubic, renk 2.400 → 3.200 K
        D["fidan"] = fk
        D["fidan_k"] = O.lerp(2400.0, 3200.0, O.smoother(pen(u, 0.20, 0.80)))
        return D
    if klip == "t79":
        D["pos"] = G2["cr_konum"](T79_ORNEK, T79_L, s) if s < 1.0 else C9["pos"].copy()
        D["psi"] = O.lerp(C7["psi"], C9["psi"], O.ease_in_out_sine(pen(s, 0.0, 0.90)))
        if s < 0.5:
            D["phi"] = O.lerp(C7["phi"], A.t79_phi, O.ease_in_out_sine(pen(s, 0.0, 0.5)))
        else:
            D["phi"] = O.lerp(A.t79_phi, C9["phi"], O.ease_in_out_sine(pen(s, 0.5, 0.92)))
        D["lens"] = ln_lerp(C7["lens"], C9["lens"], O.ease_in_out_sine(pen(s, 0.40, 0.95)))
        fw = ileri(D["psi"], D["phi"])
        od_d = G2["duvar_mesafe"](D["pos"], fw, 8.0)          # B pozunda duvar odağı (t78 başıyla sürekli)
        od_k = max(0.3, (HEDEF9 - D["pos"]).dot(fw))          # d9 kasa camı düzlemi
        D["odak"] = O.lerp(od_d, od_k, O.smoother(pen(s, 0.35, 0.85)))
        D["fstop"] = ln_lerp(C7["fstop"], 2.8, O.ease_in_out_sine(pen(s, 0.45, 0.95)))
        if s >= 1.0:
            D.update(psi=C9["psi"], phi=C9["phi"], lens=C9["lens"], odak=C9["odak"], fstop=2.8)
        D["g_kok"] = O.smoother(pen(u, 0.30, 0.94))           # büyüme ve ışık: t89 zaman çizgisi bire bir (u)
        D["kalin"] = 0.0
        D["fidan"] = O.ease_out_cubic(pen(u, 0.20, 0.70))
        D["fidan_k"] = O.lerp(2400.0, 3200.0, O.smoother(pen(u, 0.20, 0.80)))
        return D
    D["g_kok"] = 1.0
    if klip == "t9a":
        D["pos"] = YOL9A(s)
        D["psi"] = PSI
        D["phi"] = O.lerp(C9["phi"], CA["phi"], O.ease_in_out_cubic(pen(s, 0.0, 0.9)))
        D["lens"] = O.lerp(C9["lens"], CA["lens"], s)
        D["odak"] = O.lerp(C9["odak"], CA["odak"], s)
        D["fstop"] = O.lerp(2.8, 4.0, O.smoother(s))
        g = O.smoother(pen(u, 0.12, 0.92))
        D["g_govde"] = g
        D["kanca"] = KANCA_A * (1.0 - O.smoother(pen(g, 0.22, 0.42))) * O.smoother(pen(g, 0.0, 0.05))
        D["kalin"] = 0.35 * g
        D["fidan"] = 1.0
        D["gunes"] = 0.15 * O.smoother(pen(u, 0.2, 0.9))
        return D
    D["g_govde"] = 1.0
    if klip == "tab":
        D["pos"] = YOLAB(s)
        D["psi"] = PSI
        D["phi"] = O.lerp(CA["phi"], CB["phi"], O.ease_in_out_cubic(pen(s, 0.0, 0.9)))
        D["lens"] = O.lerp(CA["lens"], CB["lens"], s)
        D["odak"] = O.lerp(CA["odak"], CB["odak"], s)
        D["fstop"] = 4.0
        g = O.smoother(pen(u, 0.10, 0.92))
        D["g_dal"] = g
        D["tomurcuk"] = O.smoother(pen(u, 0.55, 0.92))
        D["kalin"] = 0.35 + 0.35 * g
        D["fidan"] = O.lerp(1.0, 0.9, O.smoother(u))
        D["gunes"] = O.lerp(0.15, 0.40, O.smoother(pen(u, 0.1, 0.9)))
        return D
    D["g_dal"] = 1.0
    D["tomurcuk"] = 1.0
    if klip == "tbc":
        D["pos"] = YOLBC(s)
        D["psi"] = O.lerp(CB["psi"], CC["psi"], O.ease_in_out_sine(s))
        D["phi"] = O.lerp(CB["phi"], CC["phi"], O.ease_in_out_cubic(pen(s, 0.0, 0.9)))
        D["lens"] = O.lerp(CB["lens"], CC["lens"], s)
        D["odak"] = O.lerp(CB["odak"], CC["odak"], s)
        D["fstop"] = 4.0
        D["g_yaprak"] = G_YAPRAK_EGRI(pen(u, A.g_yaprak_bas, A.g_yaprak_son))   # K10 penceresi (G-A 0,05–0,93 quintic: sonda 13 durgun kare)
        D["kalin"] = 0.70 + 0.30 * O.smoother(pen(u, 0.0, 0.86))
        D["gunes"] = O.lerp(0.40, 1.0, O.smoother(pen(u, 0.10, 0.85)))
        D["fidan"] = O.lerp(0.9, 0.3, O.smoother(pen(u, 0.10, 0.85)))
        D["perde"] = O.smoother(pen(u, 0.10, 0.85))
        D["titreme"] = O.smoother(pen(u, 0.55, 1.0))   # bitişte eğim 0 → lc[0] ile konum + hız eşit
        D["ofs"] = -float(n)
        return D
    if klip == "lc":
        D.update(pos=CC["pos"].copy(), psi=CC["psi"], phi=CC["phi"], lens=CC["lens"], odak=CC["odak"], fstop=4.0)
        D.update(g_yaprak=1.0, kalin=1.0, gunes=1.0, fidan=0.3, perde=1.0, titreme=1.0, ofs=0.0, s=0.0)
        return D
    raise ValueError(klip)


# ================================================================== 12) animasyon: S2'yi t78[59]'da dondur, S3'ü anahtarla
def fcurves(idb):
    ad = getattr(idb, "animation_data", None)
    if not ad or not ad.action:
        return []
    act = ad.action
    out = []
    if hasattr(act, "layers"):
        for L in act.layers:
            for st in L.strips:
                for cb in st.channelbags:
                    out += list(cb.fcurves)
    if not out and hasattr(act, "fcurves"):
        out = list(act.fcurves)
    return out


def dondur_s2(f_):
    n = 0
    for coll in (bpy.data.objects, bpy.data.lights, bpy.data.cameras, bpy.data.materials, bpy.data.worlds):
        for idb in coll:
            for fc in fcurves(idb):
                v = fc.evaluate(f_)
                fc.keyframe_points.clear()
                fc.keyframe_points.insert(0.0, v)
                n += 1
    return n


S2_ANIM = KAYNAK_KLIP == "t78f" or KLIP in S2_KASA
# t79: S2'nin t78 ışık/malzeme anahtarları (kuzey/batı duvar yıkama 0,3/1 → 0/0) korunur — t79 ilerlemesi t78'inkiyle bire
# bir aynı (fiske k 2,4, 60 kare) → t79[0] ışığı ≡ t67[47], t79[59] ≡ t78[59] = t89'un dondurulmuş durumu. Kamera S3'ün.
S2_ISIK79 = KAYNAK_KLIP == "t79"
# pankart_gel (turuncu, dikey YAZILI) d9–d12'de kasanın 2,5–3 m arkasında: f/2,8–4'te harfler okunur (jüri: arka planda
# yazı/logo okunmasın) → S3 kliplerinde gizli. t89[0] tepeden bakar, pankart kadrajda değil: dikiş bozulmaz.
PANKART_GIZLI = []
if not S2_ANIM and not A.pankart:
    for o in bpy.data.objects:
        if o.name.startswith("pankart_gel"):
            o.hide_render = True
            PANKART_GIZLI.append(o.name)
if S2_ISIK79:
    cam.animation_data_clear()
    cam.data.animation_data_clear()
    print("[S3] t79: S2 t78 animasyonu (ışık devri) kare kare korunur; kamera S3'ün", flush=True)
elif not S2_ANIM:
    nf = dondur_s2(float(N_T78))
    cam.animation_data_clear()
    cam.data.animation_data_clear()
    print(f"[S3] S2 animasyonu t78[{N_T78}]'de donduruldu ({nf} eğri)", flush=True)
FS_TABAN = FIDAN_SPOT.data.energy
GN_TABAN = GUNES.data.energy
KAYIT = {}
nK = KLIPLER3[KAYNAK_KLIP][1]
TUM3 = list(range(KLIPLER3[KAYNAK_KLIP][0] - 1, nK + 2))
for f in TUM3:
    D = durum(KAYNAK_KLIP, f if KAYNAK_KLIP != "lc" else f)
    KAYIT[f] = D
    if not D.get("s2"):
        G2["kamera_uygula"](f, D["pos"], D["psi"], D["phi"], D["lens"], odak=D["odak"], dof=True, fstop=D["fstop"])
    for ad, alan, deger in (("kok", "g", D["g_kok"]), ("kok", "kalin", 1.0), ("govde", "g", D["g_govde"]),
                            ("govde", "kalin", D["kalin"]), ("govde", "kanca", D["kanca"]), ("dal", "g", D["g_dal"]),
                            ("dal", "kalin", D["kalin"]), ("yaprak", "g", D["g_yaprak"]), ("yaprak", "tomurcuk", D["tomurcuk"]), ("yaprak", "g_dal", D["g_dal"]),
                            ("yaprak", "titreme", D["titreme"]), ("yaprak", "ofs", D["ofs"])):
        mod_anahtar(ad, alan, f, deger)
    FIDAN_SPOT.data.energy = FS_TABAN * D["fidan"]
    FIDAN_SPOT.data.keyframe_insert("energy", frame=f)
    FIDAN_SPOT.data.temperature = D["fidan_k"]
    FIDAN_SPOT.data.keyframe_insert("temperature", frame=f)
    GUNES.data.energy = GN_TABAN * D["gunes"]
    GUNES.data.keyframe_insert("energy", frame=f)
    if PERDE is not None:
        PERDE_EM.inputs["Strength"].default_value = 0.55 * D["perde"]
        PERDE_EM.inputs["Strength"].keyframe_insert("default_value", frame=f)
for idb in [bpy.data.objects[o] for o in ("S3_kokler", "S3_govde", "S3_dallar", "S3_yapraklar")] + [FIDAN_SPOT.data, GUNES.data]:
    for fc in fcurves(idb):
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"
if KLIP not in S2_KASA:   # S2 klibi + kasa: S2'nin deklanşörü (t34b/l4/t45 varsayılanı) aynen
    sc.render.motion_blur_shutter = G2["DEKLANSOR_E"]
print(f"[S3] {KAYNAK_KLIP}: {len(TUM3)} kare anahtarlandı; yaprak {N_YAPRAK} (tree.ts 274 + derinlik "
      f"{N_YAPRAK - 274}); kurulum {time.perf_counter() - T_BASLA:.1f} s", flush=True)


# ================================================================== 13) analitik izdüşüm (GN ile aynı: yay uzunluğu oranı)
def poli_ornek(pts, p):
    """POLY eğri, yay uzunluğu oranı p → nokta (GN Sample Curve FACTOR ile aynı)."""
    L = [0.0]
    for i in range(1, len(pts)):
        L.append(L[-1] + (Vector(pts[i]) - Vector(pts[i - 1])).length)
    h = p * L[-1]
    for i in range(1, len(pts)):
        if L[i] >= h:
            t = (h - L[i - 1]) / max(1e-12, L[i] - L[i - 1])
            return Vector(pts[i - 1]).lerp(Vector(pts[i]), t)
    return Vector(pts[-1])


def p_serit(s, g):
    return O.clamp01((g - s["t0"]) / max(1e-4, s["t1"] - s["t0"]))


MW = None


def dunya(v):
    return KOK_BOS.matrix_world @ Vector(v)


def uclar(D):
    """Kare durumu → kök uçları (81), ana dal uçları (6), gövde ucu: dünya koordinatı."""
    ku = [dunya(poli_ornek(s["noktalar"], p_serit(s, D["g_kok"]))) for s in KOK_SERIT]
    du = []
    for s in DAL_SERIT:
        if s["tur"] == "ana":
            du.append(dunya(poli_ornek(s["noktalar"], p_serit(s, D["g_dal"]))))
    gu = dunya(poli_ornek(gpts, D["g_govde"]))
    return ku, du, gu


def kam_d(D):
    return D["pos"], D["psi"], D["phi"], D["lens"]


def _sm(x):
    x = O.clamp01(x)
    return x * x * (3 - 2 * x)


def cephe(D):
    """Büyüme cephesi: 81 kök ucu, 23 dal ucu, gövde ucu, yaprak uçları (GN formülleriyle) — dünya."""
    P = [dunya(poli_ornek(s["noktalar"], p_serit(s, D["g_kok"]))) for s in KOK_SERIT]
    P += [dunya(poli_ornek(s["noktalar"], p_serit(s, D["g_dal"]))) for s in DAL_SERIT]
    P.append(dunya(poli_ornek(gpts, D["g_govde"])))
    for co_, eu, sz, dog, dt in YAPRAK_VERI:
        boy = O.smoother((D["g_yaprak"] - dog) / 0.10)
        boy = max(boy, 0.11 * D["tomurcuk"] * _sm((D["g_dal"] - dt) / 0.05))
        P.append(dunya(Vector(co_) + eu.to_matrix() @ Vector((0.0, sz * boy, 0.0))))
    return P


# ================================================================== 14) --gorunurluk: kasa S2 kliplerinde görünüyor mu?
def kasa_ornekleri():
    pts = []
    for o in [o for o in bpy.data.objects if o.name.startswith(("S3_kasa", "S3_toprak", "S3_palamut")) and o.type == "MESH"]:
        me = o.data
        mw = o.matrix_world
        vs = [mw @ v.co for v in me.vertices]
        if len(vs) > 400:
            vs = vs[:: max(1, len(vs) // 400)]
        pts += [(v, o.name) for v in vs]
    return pts


def gorunurluk(yol_):
    t0 = time.perf_counter()
    PIK = kasa_ornekleri()
    s3_adlar = {o.name for o in bpy.data.objects if o.name.startswith("S3_")}
    sonuc = {}
    parcalar = G2["PARCALAR"]
    pd = G2["parca_durum"]

    def parca_ayarla(t):
        for p in parcalar:
            l_, r_ = pd(p, t, None)
            p["o"].location = l_
            p["o"].rotation_euler = r_
        bpy.context.view_layer.update()
        PIK[:] = kasa_ornekleri()            # kasa bankoyla birlikte kalkar (patlatılmış d4 / montaj): örnekler yeniden
        return bpy.context.evaluated_depsgraph_get()

    TANI = {}

    def kare_test(dg, pos, psi, phi, lens, etiket=None):
        gor, kenar = 0, None
        xs, ys = [], []
        icerde, engel = 0, {}
        for w, ad in PIK:
            p = proj_kam(pos, psi, phi, lens, w)
            if p is None or not (0 <= p[0] <= 1920 and 0 <= p[1] <= 1920):
                continue
            icerde += 1
            d_ = w - pos
            hit, loc, _n, _i, ob, _m = sc.ray_cast(dg, pos, d_.normalized(), distance=d_.length + 0.01)
            if hit and ob.name in s3_adlar and (loc - w).length < 0.03:
                gor += 1
                xs.append(p[0]); ys.append(p[1])
            elif hit:
                engel[ob.name] = engel.get(ob.name, 0) + 1
        if gor:
            kenar = [round(min(xs)), round(min(ys)), round(max(xs)), round(max(ys))]
        if etiket:
            TANI[etiket] = {"kadrajda": icerde, "gorunen": gor, "engel": dict(sorted(engel.items(), key=lambda kv: -kv[1])[:5])}
        return gor, kenar

    G2["profil_kur"]("fiske")
    G2["montaj_kur"]()
    durumlar = []
    T34B = G2["T34B_BAS"]
    for klip, ilk, son in (("t34b", T34B, T34B + 23), ("t45", 0, G2["N_T45"]), ("t56", 0, G2["N_T56"]), ("t67", 0, G2["N_T67"]),
                           ("t78", 0, N_T78)):
        durumlar.append((klip, ilk, son))
    P4, P5 = G2["P4"], G2["P5"]
    dg = parca_ayarla(None)
    g, k = kare_test(dg, P4["konum"], P4["psi"], P4["phi"], G2["P4_LENS"], etiket="p4")
    sonuc["p4/l4"] = {"gorunen_ornek": g, "kutu_px": k}
    dg = parca_ayarla(9.0)
    g, k = kare_test(dg, P5["konum"], P5["psi"], P5["phi"], 18.0, etiket="p5")
    sonuc["p5/l5"] = {"gorunen_ornek": g, "kutu_px": k}
    for klip, ilk, son in durumlar:
        kar = []
        dg = parca_ayarla(None if klip == "t34b" else 9.0)
        for f in range(ilk, son + 1):
            if klip == "t45":
                dg = parca_ayarla(f / 30.0)
            st = G2["kamera_durum"](klip, f)
            g, k = kare_test(dg, st["pos"], st["psi"], st["phi"], st["lens"], etiket=f"{klip}[{f}]" if f % 6 == 0 else None)
            if g:
                kar.append({"f": f, "ornek": g, "kutu_px": k})
        sonuc[klip] = {"gorunen_kare": len(kar), "kare_say": son - ilk + 1, "kareler": kar}
        if klip == "t78":   # R9: t78 kamera yolu ↔ kasa (+ toprak üstü 0,52 m fidan zarfı) en küçük uzaklık, 8 alt örnek/kare
            kutu_ = [o for o in bpy.data.objects if o.name.startswith(("S3_kasa_", "S3_toprak"))]
            vs = [o.matrix_world @ Vector(c) for o in kutu_ for c in o.bound_box]
            lo = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
            hi = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
            en = (1e9, None)
            for i in range((son - ilk) * 8 + 1):
                ff = ilk + i / 8.0
                q = Vector(G2["kamera_durum"]("t78", ff)["pos"])
                c_ = Vector((min(max(q.x, lo.x), hi.x), min(max(q.y, lo.y), hi.y), min(max(q.z, lo.z), hi.z)))
                if (q - c_).length < en[0]:
                    en = ((q - c_).length, ff)
            sonuc[klip]["kasa_en_yakin_m"] = round(en[0], 3)
            sonuc[klip]["kasa_en_yakin_kare"] = en[1]
            sonuc[klip]["olcut_R9"] = "≥ 0,25 m"
            print(f"[GORUNURLUK] t78 kamera ↔ kasa en yakın {en[0]:.3f} m (kare {en[1]})", flush=True)
    js = {"uretim": time.strftime("%Y-%m-%dT%H:%M:%S"), "kasa_merkez": KASA_MERKEZ, "ornek_say": len(PIK),
          "olcut": "ışın testi: kasa örnek noktası (köşe/ızgara) kare içinde ve kameradan ilk çarpılan S3 nesnesi (≤ 3 cm) → görünür",
          "sonuc": sonuc, "tani": TANI, "sure_sn": round(time.perf_counter() - t0, 1)}
    os.makedirs(os.path.dirname(os.path.abspath(yol_)), exist_ok=True)
    json.dump(js, open(yol_, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for k_, v in sonuc.items():
        print(f"[GORUNURLUK] {k_}: " + (f"{v['gorunen_kare']}/{v['kare_say']} kare" if "gorunen_kare" in v else
                                         f"{v['gorunen_ornek']} örnek {v['kutu_px']}"), flush=True)
    print(f"[GORUNURLUK] {yol_} ({js['sure_sn']} s)", flush=True)


if A.gorunurluk:
    gorunurluk(A.gorunurluk)
    raise SystemExit(0)


# ================================================================== 15) --olc: GPU'suz kabul ölçümleri (bütün klipler)
EKRAN_D = [(390, 844), (360, 800), (430, 932)]     # dikey telefon (CSS px)
EKRAN_Y = [(1280, 800), (844, 390)]                # yatay (masaüstü, telefon yatay)


def kirpim_y_oneri(kutu):
    """Yatay teslim kırpım ofseti (master px): öznenin dikey ortası yatay karenin %46'sında; [0, 840]."""
    y0, y1 = kutu
    orta = (y0 + y1) / 2
    return int(max(0, min(840, round(orta - 0.46 * 1080))))


def olc_klip(klip):
    n = KLIPLER3[klip][1]
    kar = []
    for f in range(0, n + 1):
        D = durum(klip, f)
        pos, psi, phi, lens = kam_d(D)
        ku, du, gu = uclar(D)
        kp = [proj_kam(pos, psi, phi, lens, w) for w in ku]
        dp = [proj_kam(pos, psi, phi, lens, w) for w in du]
        gp = proj_kam(pos, psi, phi, lens, gu)
        kasa_k = [proj_kam(pos, psi, phi, lens, yerel(x, y, z)) for x in (-0.24, 0.24) for y in (-0.02, 0.14)
                  for z in (ZT, KASA_H + ZT)]
        hed = pos + ileri(psi, phi) * D["odak"]
        kar.append({"f": f, "kamera": [round(v, 4) for v in pos] + [round(psi, 3), round(phi, 3), round(lens, 2)],
                    "kadraj_m": round(D["odak"] * 20.25 / lens, 4), "s": round(D["s"], 5),
                    "kok_uc": [None if p is None else [round(p[0], 2), round(p[1], 2)] for p in kp],
                    "dal_uc": [None if p is None else [round(p[0], 2), round(p[1], 2)] for p in dp],
                    "govde_uc": None if gp is None else [round(gp[0], 2), round(gp[1], 2)],
                    "kasa": [None if p is None else [round(p[0], 1), round(p[1], 1)] for p in kasa_k],
                    "buyume": [round(D[k], 4) for k in ("g_kok", "g_govde", "g_dal", "g_yaprak")],
                    "isik": [round(D["fidan"], 4), round(D["gunes"], 4)], "hedef": [round(v, 3) for v in hed]})
    return kar


def hareket(a_, b_):
    m = 0.0
    for p, q in zip(a_, b_):
        if p is None or q is None:
            continue
        m = max(m, math.hypot(p[0] - q[0], p[1] - q[1]))
    return m


def nokta_kumesi(k, buyume_uc=True):
    pts = [p for p in k["kok_uc"] if p] + [p for p in k["dal_uc"] if p] + ([k["govde_uc"]] if k["govde_uc"] else [])
    return pts + [p for p in k["kasa"] if p]


def olc(yol_):
    t0 = time.perf_counter()
    R = {"uretim": time.strftime("%Y-%m-%dT%H:%M:%S"), "kasa_merkez": KASA_MERKEZ, "birim_mm": BIRIM * 1000,
         "kameralar": {k: {"pos": [round(v, 4) for v in c["pos"]], "psi": c["psi"], "phi": round(c["phi"], 3), "lens": c["lens"],
                           "uzaklik_m": round(c["d"], 4), "fit_s_video_px_birim": round(c["fit"]["s"], 4),
                           "hata_px": [round(v, 3) for v in c["hata"]]} for k, c in (("C9", C9), ("CA", CA), ("CB", CB), ("CC", CC))},
         "gunes": {"yukseklik": round(GUNES_YUK, 3), "azimut": round(GUNES_AZ, 3), "spot_mesafe_m": round(GUNES_MESAFE, 3),
                   "engel": GUNES_ENGEL}, "k10": K10, "klipler": {}, "kabul": {}}
    for klip in ("t89", "t9a", "tab", "tbc", "lc"):
        kar = olc_klip(klip)
        n = len(kar) - 1
        # son 3 kare: kare kare ekran hareketi (master px; uçlar + dal uçları + gövde ucu + kasa köşeleri; büyüme dahil)
        son3 = [round(hareket(nokta_kumesi(kar[n - i - 1]), nokta_kumesi(kar[n - i])), 3) for i in (2, 1, 0)]
        # büyüme cephesi hızı: cephe noktalarının kare başına en büyük ekran yer değiştirmesi (master px); kamera hareketi
        # ayrılır (iki kare de bu karenin kamerasıyla izdüşer). lc: döngü (büyüme yok), ölçülmez.
        hiz = []
        onceki = cephe(durum(klip, 0))
        for f in range(1, n + 1):
            Dc = durum(klip, f)
            simdi = cephe(Dc)
            pos, psi, phi, lens = kam_d(Dc)
            m = 0.0
            for w0, w1 in zip(onceki, simdi):
                if (w1 - w0).length < 1e-7:
                    continue
                p0, p1 = proj_kam(pos, psi, phi, lens, w0), proj_kam(pos, psi, phi, lens, w1)
                if p0 and p1:
                    m = max(m, math.hypot(p1[0] - p0[0], p1[1] - p0[1]))
            hiz.append(round(m, 3))
            onceki = simdi
        k0 = int(math.ceil(0.70 * n))
        f_son = max([f for f in range(1, n + 1) if hiz[f - 1] >= 2.0], default=0)
        bas = min([f for f in range(1, n + 1) if hiz[f - 1] >= 2.0], default=0)
        kuyruk = [hiz[f - 1] for f in range(k0, f_son + 1)]
        R["klipler"][klip] = {"kare": len(kar), "son3_px": son3, "son3_olcut": "≤ 6 / 3 / 0 (n−3→n−2, n−2→n−1, n−1→n)",
                              "buyume_hizi_px": hiz, "buyume_ilk_kare": bas, "buyume_son_kare": f_son,
                              "sondaki_durgun_kare": n - f_son if klip != "lc" else None,
                              "durgun_olcut": "6–8 (K10)" if klip != "lc" else None,
                              "durgun_gecti": (6 <= n - f_son <= 8) if klip != "lc" else None,
                              "kuyruk_kare": [k0, f_son], "kuyruk_min_px": min(kuyruk) if kuyruk else None,
                              "kuyruk_alt2_kare": sum(1 for v in kuyruk if v < 2.0),
                              "plato_kare": sum(1 for f in range(bas, f_son + 1) if hiz[f - 1] < 2.0),
                              "kadraj_m": [k["kadraj_m"] for k in kar], "ilerleme": [k["s"] for k in kar],
                              "kareler": kar if klip != "lc" else kar[:1]}
    # p9: 81 uç — video px aralığı (dikey teslim 720×1280), CSS px (390×844), güvenli alan, bant
    p9 = R["klipler"]["t89"]["kareler"][-1]
    uv = [video_d(p) for p in p9["kok_uc"]]
    nn = []
    for i, p in enumerate(uv):
        nn.append(min(math.hypot(p[0] - q[0], p[1] - q[1]) for j, q in enumerate(uv) if j != i))
    nn_s = sorted(nn)
    # uç kapağı çapı (video px): kökçük ucu yarıçapı × 1,35 kapak × 2 → izdüşüm
    rcap, rkok = [], []
    pos, psi, phi, lens = kam_d(durum("t89", 59))
    for s in KOK_SERIT:
        r_uc = s["r"][-1] * 0.75 * 1.0          # GN: uc_ince 0,75 × kalın (kök 1,0 → 0,55 + 0,45 = 1)
        w = dunya(s["noktalar"][-1])
        z = (w - pos).dot(ileri(psi, phi))
        k_ = lens * 1920 / 36 / 1.5 / z         # video px / m
        rcap.append(2 * max(r_uc * A.kapak_k, A.kapak_min) * k_)  # kapak çapı (teğete dik; GN: max(r·kapak_k, kapak_min))
        rkok.append(2 * s["r"][len(s["r"]) // 2] * k_)
    R["kabul"]["uc81"] = {"video_px_nn_min": round(nn_s[0], 2), "p10": round(nn_s[8], 2), "medyan": round(nn_s[40], 2),
                          "nn_alt_8px": sum(1 for v in nn if v < 8), "nn_alt_9px": sum(1 for v in nn if v < 9),
                          "olcut": "uçların %90'ı ≥ 8 video px aralıkta (R2)",
                          "yuzde90_8px": sum(1 for v in nn if v >= 8) / 81 >= 0.9,
                          "kapak_cap_video_px_min": round(min(rcap), 2), "kapak_cap_video_px_medyan": round(sorted(rcap)[40], 2),
                          "kok_kalinlik_video_px_min": round(min(rkok), 2), "kok_kalinlik_video_px_medyan": round(sorted(rkok)[40], 2),
                          "css_390_nn_min": round(nn_s[0] * 844 / 1280, 2)}
    # güvenli alan ∩ bant: durak başına özne kutusu (video px) ↔ ekranda görünen bölge ve alt bant (y ≥ %68)
    durak = {"p9": ("t89", "kok"), "pa": ("t9a", "govde"), "pb": ("tab", "dallar"), "pc": ("tbc", "yaprak")}
    gk = {}
    for ps, (klip, fo) in durak.items():
        kr = R["klipler"][klip]["kareler"][-1] if klip != "lc" else R["klipler"]["lc"]["kareler"][0]
        D = durum(klip, KLIPLER3[klip][1])
        pos, psi, phi, lens = kam_d(D)
        f_ = FOCUS[fo]
        yv = fit(f_, BOLGE[fo])["yv"]
        kose = [proj_kam(pos, psi, phi, lens, yerel(*agac3(x, y, GOV_Y if fo != "kok" else 0.0)))
                for x in (f_["x0"], f_["x1"]) for y in (f_["y0"], yv)]
        vx = [video_d(p)[0] for p in kose]
        vy = [video_d(p)[1] for p in kose]
        kutu = [round(min(vx), 1), round(min(vy), 1), round(max(vx), 1), round(max(vy), 1)]
        ek = {}
        for W_, H_ in EKRAN_D:
            olc_ = max(W_ / 720.0, H_ / 1280.0)
            gx0 = (720 - W_ / olc_) / 2
            gy0 = (1280 - H_ / olc_) / 2
            bant = gy0 + 0.68 * H_ / olc_
            ek[f"{W_}x{H_}"] = {"gorunen_x": [round(gx0, 1), round(720 - gx0, 1)], "bant_y": round(bant, 1),
                                "yan_tasma_px": round(max(0, gx0 - kutu[0], kutu[2] - (720 - gx0)), 1),
                                "bant_kesisim_px": round(max(0.0, kutu[3] - bant), 1)}
        master = [[round(p[0], 1), round(p[1], 1)] for p in kose]
        # json_yaz ile aynı kural: gövde hattında FOCUS y0 … y1min (yoksa y1) arasının ortası yatay karenin %46'sında
        ys_m = [proj_kam(pos, psi, phi, lens, yerel(*agac3(200, y, GOV_Y)))[1] for y in (f_["y0"], f_.get("y1min", f_["y1"]))]
        ky = kirpim_y_oneri((min(ys_m), max(ys_m)))
        yt = {}
        for W_, H_ in EKRAN_Y:
            olc_ = max(W_ / 1280.0, H_ / 720.0)
            gx0 = (1280 - W_ / olc_) / 2
            gy0 = (720 - H_ / olc_) / 2
            xs_ = [p[0] / 1.5 for p in kose]
            ys_ = [(p[1] - ky) / 1.5 for p in kose]
            yt[f"{W_}x{H_}"] = {"ust_tasma_px": round(max(0.0, gy0 - min(ys_)), 1), "alt_tasma_px": round(max(0.0, max(ys_) - (720 - gy0)), 1),
                                "yan_tasma_px": round(max(0.0, gx0 - min(xs_), max(xs_) - (1280 - gx0)), 1)}
        gk[ps] = {"klip": klip, "focus": fo, "ozne_kutu_video_d": kutu, "dikey": ek, "kirpimY_oneri": ky, "yatay": yt,
                  "master_kose": master}
    R["kabul"]["guvenli_alan"] = gk
    kutu_ = [o for o in bpy.data.objects if o.name.startswith(("S3_kasa_", "S3_toprak"))]
    bpy.context.view_layer.update()
    vs = [o.matrix_world @ Vector(c) for o in kutu_ for c in o.bound_box]
    lo = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
    hi = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs) + 0.55))   # + fidan zarfı
    pay = {}
    for klip in ("t89", "t9a", "tab", "tbc"):
        n = KLIPLER3[klip][1]
        en = (1e9, None)
        for i in range(n * 8 + 1):
            q = durum(klip, i / 8.0)["pos"]
            c_ = Vector((min(max(q.x, lo.x), hi.x), min(max(q.y, lo.y), hi.y), min(max(q.z, lo.z), hi.z)))
            if (q - c_).length < en[0]:
                en = ((q - c_).length, i / 8.0)
        pay[klip] = {"en_yakin_m": round(en[0], 3), "kare": en[1]}
    R["kabul"]["kamera_kasa_payi"] = pay
    print("[OLC] kamera ↔ kasa(+fidan zarfı) en yakın: " + ", ".join(f"{k} {v['en_yakin_m']} m (kare {v['kare']})" for k, v in pay.items()),
          flush=True)
    # arka plan yoklaması: durak kamerasından dikey kırpım içinde 7 × 9 ışın; S3 dışında ilk çarpılan nesne + uzaklık
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    s3_adlar = {o.name for o in bpy.data.objects if o.name.startswith("S3_")}
    ap_ = {}
    for ps, (klip, _fo) in durak.items():
        D = durum(klip, KLIPLER3[klip][1])
        pos, psi, phi, lens = kam_d(D)
        fw, sg, up = ileri(psi, phi), SAG(psi), ust_v(psi, phi)
        fpx = lens * 1920 / 36
        say = {}
        for ix in range(7):
            for iy in range(9):
                x, y = 440 + ix * 1040 / 6, 30 + iy * 1860 / 8
                dvec = (fw + sg * ((x - 960) / fpx) - up * ((y - 960) / fpx)).normalized()
                o_, dist = pos.copy(), 0.0
                ad = "-"
                for _ in range(6):
                    hit, loc, _n, _i, ob, _m = sc.ray_cast(dg, o_, dvec, distance=80.0)
                    if not hit:
                        break
                    if ob.name in s3_adlar or ob.hide_render:
                        o_ = loc + dvec * 1e-3
                        continue
                    ad, dist = ob.name, (loc - pos).length
                    break
                k_ = ad.split(".")[0]
                say.setdefault(k_, []).append(round(dist, 2))
        ap_[ps] = {k: {"isin": len(v), "uzaklik_m": [min(v), max(v)]} for k, v in sorted(say.items(), key=lambda kv: -len(kv[1]))}
    R["kabul"]["arka_plan"] = ap_
    for ps, v in ap_.items():
        print(f"[OLC] arka plan {ps}: " + ", ".join(f"{k} {e['isin']} ({e['uzaklik_m'][0]}–{e['uzaklik_m'][1]} m)" for k, e in list(v.items())[:6]),
              flush=True)
    os.makedirs(os.path.dirname(os.path.abspath(yol_)), exist_ok=True)
    json.dump(R, open(yol_, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"[OLC] {yol_} ({time.perf_counter() - t0:.1f} s)", flush=True)
    for klip, v in R["klipler"].items():
        print(f"[OLC] {klip}: kare {v['kare']} son3 {v['son3_px']} px; büyüme ≥ 2 px kare {v['buyume_ilk_kare']}–"
              f"{v['buyume_son_kare']}, sonda durgun {v['sondaki_durgun_kare']}; kuyruk {v['kuyruk_kare']} min {v['kuyruk_min_px']} "
              f"px/kare, < 2 px {v['kuyruk_alt2_kare']} kare; plato {v['plato_kare']}; tepe {max(v['buyume_hizi_px']):.1f} px; "
              f"kadraj {v['kadraj_m'][0]:.3f} → {v['kadraj_m'][-1]:.3f} m", flush=True)
    print(f"[OLC] uc81: {json.dumps(R['kabul']['uc81'], ensure_ascii=False)}", flush=True)
    for ps, v in gk.items():
        print(f"[OLC] {ps}: özne {v['ozne_kutu_video_d']} kirpimY {v['kirpimY_oneri']} dikey " +
              ", ".join(f"{k} yan {e['yan_tasma_px']} bant {e['bant_kesisim_px']}" for k, e in v["dikey"].items()) + " | yatay " +
              ", ".join(f"{k} üst {e['ust_tasma_px']} alt {e['alt_tasma_px']}" for k, e in v["yatay"].items()), flush=True)


# ================================================================== 15b) t79 yoklaması (GPU'suz)
T79_GRUP = (("kasa_fidan", ("S3_",)), ("banko", ("banko_", "brosur_", "logo")), ("totem", ("totem_",)),
            ("sutun", ("sutun_",)), ("kanopi", ("kanopi", "krom_")), ("bitki", ("bitki_", "saksi_")), ("kiosk", ("kiosk_",)),
            ("sol_bank", ("sol_bank",)),
            ("duvar", ("on_", "sag_", "arka_", "sol_kapali", "sol_fasya", "baski_", "ekran_soz", "yikama_", "bant_", "cita_", "oda_")))


def _grup79(ad):
    for g, on in T79_GRUP:
        if ad.startswith(on):
            return g
    return "diger"


def olc79():
    """t79: (1) kamera yolu ↔ sahne: kare başına 8 alt örnek; yakınlık (AABB ön süzgeç 0,8 m → closest_point_on_mesh) grup
    başına en küçük uzaklık + ışın yoklaması (ardışık örnekler arası ray_cast: yol bir yüzeyi delerse isabet); (2) broşür
    yığını kutusunun kadrajdaki boyu kare kare (master px); (3) t79[0]'da kasa kadraj dışı; (4) t79[59] ≡ t89[59] ve
    t79[0] ≡ t78[0] durum farkı; (5) son 3 kare ekran hareketi (olc_klip / nokta_kumesi ile aynı)."""
    t0 = time.perf_counter()
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    n = KLIPLER3["t79"][1]
    ALT = 8
    Q = [(i / ALT, durum("t79", i / ALT)["pos"].copy()) for i in range(n * ALT + 1)]
    lo = Vector((min(q.x for _, q in Q), min(q.y for _, q in Q), min(q.z for _, q in Q)))
    hi = Vector((max(q.x for _, q in Q), max(q.y for _, q in Q), max(q.z for _, q in Q)))
    ESIK = 0.8
    grup = {}
    aday = 0
    for ob in sc.objects:
        if ob.type != "MESH" or ob.hide_render or not ob.visible_get():
            continue
        ev = ob.evaluated_get(dg)
        mw = ev.matrix_world
        vs = [mw @ Vector(c) for c in ev.bound_box]
        blo = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
        bhi = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
        if any(blo[i] > hi[i] + ESIK or bhi[i] < lo[i] - ESIK for i in range(3)):
            continue
        inv = mw.inverted()
        en = (1e9, None, None)
        for ff, q in Q:
            c_ = Vector((min(max(q.x, blo.x), bhi.x), min(max(q.y, blo.y), bhi.y), min(max(q.z, blo.z), bhi.z)))
            if (q - c_).length > ESIK:
                continue
            aday += 1
            try:
                ok, loc, _n, _i = ev.closest_point_on_mesh(inv @ q)
            except Exception:
                continue
            if ok:
                d = (mw @ loc - q).length
                if d < en[0]:
                    en = (d, ff, [round(v, 3) for v in q])
        if en[1] is None:
            continue
        g = _grup79(ob.name)
        if en[0] < grup.get(g, {"m": 1e9})["m"]:
            grup[g] = {"m": round(en[0], 3), "nesne": ob.name, "kare": en[1], "konum": en[2]}
    isabet = []
    for (f0, q0), (f1, q1) in zip(Q[:-1], Q[1:]):
        d_ = q1 - q0
        if d_.length < 1e-6:
            continue
        hit, loc, _n, _i, ob, _m = sc.ray_cast(dg, q0, d_.normalized(), distance=d_.length)
        if hit:
            isabet.append({"kare": f0, "nesne": ob.name})
    # (2) broşür yığını (bütün brosur_* nesnelerinin AABB'si) kare kare izdüşüm
    br = [o for o in sc.objects if o.name.startswith("brosur_") and o.type == "MESH" and not o.hide_render]
    bv = [o.matrix_world @ Vector(c) for o in br for c in o.bound_box]
    bk = []
    if bv:
        bk = [Vector((x, y, z)) for x in (min(v.x for v in bv), max(v.x for v in bv))
              for y in (min(v.y for v in bv), max(v.y for v in bv)) for z in (min(v.z for v in bv), max(v.z for v in bv))]
    brosur = []
    for f in range(n + 1):
        D = durum("t79", f)
        ps = [proj_kam(D["pos"], D["psi"], D["phi"], D["lens"], w) for w in bk]
        if not ps or any(p is None for p in ps):
            brosur.append({"f": f, "kadrajda": False, "gen_px": 0, "yuk_px": 0})
            continue
        x0, x1 = max(0.0, min(p[0] for p in ps)), min(1920.0, max(p[0] for p in ps))
        y0, y1 = max(0.0, min(p[1] for p in ps)), min(1920.0, max(p[1] for p in ps))
        ic = x1 > x0 and y1 > y0
        brosur.append({"f": f, "kadrajda": ic, "gen_px": round(x1 - x0, 1) if ic else 0, "yuk_px": round(y1 - y0, 1) if ic else 0,
                       "uzaklik_m": round(min(p[2] for p in ps), 3)})
    en_b = max(brosur, key=lambda b: b["gen_px"] * b["yuk_px"])
    # (3) kasa t79[0]'da: köşeler kadrajda mı
    D0 = durum("t79", 0)
    kk = [proj_kam(D0["pos"], D0["psi"], D0["phi"], D0["lens"], yerel(x, y, z)) for x in (-0.24, 0.24) for y in (-0.02, 0.14)
          for z in (ZT, KASA_H + ZT)]
    kasa0 = sum(1 for p in kk if p and 0 <= p[0] <= 1920 and 0 <= p[1] <= 1920)
    # (4) t79[59] ≡ t89[59]; t79[0] ≡ t78[0] (B pozu)
    A_, B_ = durum("t79", n), durum("t89", KLIPLER3["t89"][1])
    fark = {}
    for k_ in ("pos", "psi", "phi", "lens", "odak", "fstop", "g_kok", "g_govde", "fidan", "fidan_k", "gunes", "kalin", "perde"):
        a_, b_ = A_[k_], B_[k_]
        fark[k_] = round((a_ - b_).length if isinstance(a_, Vector) else abs(a_ - b_), 9)
    fark0 = {"pos": round((D0["pos"] - C7["pos"]).length, 9), "psi": abs(D0["psi"] - C7["psi"]), "phi": abs(D0["phi"] - C7["phi"]),
             "lens": abs(D0["lens"] - C7["lens"]), "odak": round(abs(D0["odak"] - C7["odak"]), 9),
             "fstop": abs(D0["fstop"] - C7["fstop"])}
    # (5) son 3 kare ekran hareketi + kare başına kamera hızı
    kar = olc_klip("t79")
    son3 = [round(hareket(nokta_kumesi(kar[n - i - 1]), nokta_kumesi(kar[n - i])), 3) for i in (2, 1, 0)]
    hiz = [round((durum("t79", f)["pos"] - durum("t79", f - 1)["pos"]).length * FPS, 3) for f in range(1, n + 1)]
    R = {"uretim": time.strftime("%Y-%m-%dT%H:%M:%S"), "yol_m": round(T79_L[-1], 3),
         "noktalar": [[round(v, 3) for v in p] for p in T79_NOKTA[1:-1]], "yan_deg": A.t79_yan, "phi_orta": A.t79_phi,
         "yakinlik_m": dict(sorted(grup.items(), key=lambda kv: kv[1]["m"])), "yakinlik_olcut": "≥ 0,25 m",
         "aday_ornek": aday, "isin_isabet": isabet, "brosur_en_buyuk": en_b, "brosur_59": brosur[-1],
         "brosur_kareler": [[b["f"], b["gen_px"], b["yuk_px"]] for b in brosur], "kasa_t79_0_kadrajda_kose": kasa0,
         "fark_59_t89": fark, "fark_0_t78": fark0, "son3_px": son3, "hiz_m_sn": hiz,
         "kamera": [k["kamera"] for k in kar], "odak": [round(durum("t79", f)["odak"], 4) for f in range(n + 1)],
         "fstop": [round(durum("t79", f)["fstop"], 3) for f in range(n + 1)], "sure_sn": round(time.perf_counter() - t0, 1)}
    print(f"[OLC79] yol {R['yol_m']} m; yakınlık " + ", ".join(f"{g} {v['m']} ({v['nesne']} @{v['kare']})" for g, v in
          list(R["yakinlik_m"].items())[:7]) + f"; ışın isabeti {len(isabet)}", flush=True)
    print(f"[OLC79] broşür en büyük kare {en_b['f']}: {en_b['gen_px']}×{en_b['yuk_px']} px; t79[59] {brosur[-1]['gen_px']}×"
          f"{brosur[-1]['yuk_px']}; kasa t79[0] kadrajda köşe {kasa0}/8; son3 {son3} px; tepe hız {max(hiz):.2f} m/s", flush=True)
    print(f"[OLC79] fark t79[59]−t89[59] {fark}; t79[0]−t78[0] {fark0}", flush=True)
    return R


if A.olc79:
    _r79 = olc79()
    os.makedirs(os.path.dirname(os.path.abspath(A.olc79)), exist_ok=True)
    json.dump(_r79, open(A.olc79, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"[OLC79] {A.olc79}", flush=True)
    raise SystemExit(0)

if A.olc:
    olc(A.olc)
    raise SystemExit(0)


# ================================================================== 16) JSON (S2 biçimi + S3 alanları; manifest-birlestir)
def proj_dunya(w, f):
    D = KAYIT[f]
    p = proj_kam(D["pos"], D["psi"], D["phi"], D["lens"], w)
    return None if p is None else [round(p[0], 1), round(p[1], 1)]


def json_yaz():
    klip = KLIP
    kk = KAYNAK_KLIP
    n = KLIPLER3[kk][1]
    js = {"ad": klip, "fps": FPS, "master": 1920, "kaynak": "scripts/blender/s3/sahne.py", "uretim": time.strftime("%Y-%m-%dT%H:%M:%S"),
          "sahne": "S3 (S2 t78 + kök kasası)", "deklansor": G2["DEKLANSOR_E"]}
    if klip in POSTER:
        js.update(tip="son-kare" if klip != "pc" else "dongu-ilk", kaynak_klip=kk, kaynak_kare=POSTER[klip][1], kare=1,
                  not_=f"{klip} = {kk}[{POSTER[klip][1]}] (ayrı render yok; onizleme.sh / son.sh kopyalar)")
        fr = [POSTER[klip][1]]
    else:
        js.update(tip=TUR, kare=n + 1, sure=round((n + 1) / FPS, 3), kare_baslangic=0)
        fr = list(range(0, n + 1))
    D_ = [KAYIT[f] for f in fr]
    js["kadraj_m"] = [round(D["odak"] * 20.25 / D["lens"], 4) for D in D_]
    js["kadraj_tanim"] = "dikey teslimin (1080 master px) genişliği, kamera ekseni boyunca odak düzleminde (m) = d·20,25/f"
    js["kamera"] = {"kare": [[*(round(v, 4) for v in D["pos"]), round(D["psi"], 3), round(D["phi"], 3)] for D in D_],
                    "lens_mm_kare": [round(D["lens"], 3) for D in D_], "kare_tanim": "kare başına [x, y, z (m), yön ψ, eğim φ]",
                    "sensor_mm": 36}
    js["ilerleme"] = [round(D["s"], 5) for D in D_]
    js["profil"] = "fiske"
    js["fiske_k"] = FISKE_K
    js["buyume"] = {k: [round(D[f"g_{k}"], 5) for D in D_] for k in ("kok", "govde", "dal", "yaprak")}
    js["isik"] = {"fidan": [round(D["fidan"], 4) for D in D_], "gunes": [round(D["gunes"], 4) for D in D_],
                  "tanim": "fidan_spot (3.200 K; t89'da 2.400 → 3.200 K akkor ısınması) ve 16.00 güneşi, taban gücün oranı"}
    js["gunes"] = {"yukseklik_deg": round(GUNES_YUK, 3), "azimut_deg": round(GUNES_AZ, 3), "kaynak": "s1/gunes.py, 9 Kasım 2026 13.00 UTC"}
    son = fr[-1]
    D = KAYIT[son]
    ku, du, gu = uclar(D)
    yatay_ky = None
    if klip == "t79":
        # yatay kırpım: d7 233 (p7) → d9 420 (p9), t78'in rampasıyla aynı (ilerleme s 0 → 0,6773 ≡ kare 0 → 24, easeInOutCubic;
        # kodla.mjs KIRPIM_Y_TANIM.t79 bu diziyi JSON 'ilerleme'sinden yeniden çözer)
        ky = [round(233 + (420 - 233) * O.ease_in_out_cubic(O.clamp01(D["s"] / 0.6773))) for D in D_]
        js["kirpimY_oneri"] = {"bas": 233, "son": 420, "s0": 0.0, "s1": 0.6773, "kareler": ky}
        js["dikis"] = {"bas": "t67[47] ≡ t78[0] (B pozu, d7; S2 ışık devri t78 karesiyle)", "son": "t89[59] ≡ p9 (d9)"}
        js["sahne"] = "S3 (S2 t78 + kök kasası; S2 t78 ışık devri kare kare, kamera S3)"
    if klip in ("t89", "p9"):
        cap = []
        for s, w in zip(KOK_SERIT, ku):
            p = proj_dunya(w, son)
            cap.append({"x": p[0], "y": p[1], "grup": s["grup"], "ana": bool(s["ana"])})
        js["capalar"] = {"kok_uclari": cap}
        js["capa_tanim"] = ("p9 (t89 son karesi): 81 kök ucu, master px; grup 0 kazık kök, 1–6 ana kökler (dalga sırası); "
                            "dikey video ((x − 420)/1,5, y/1,5), yatay (x/1,5, (y − kirpimY)/1,5)")
    if klip in ("t9a", "pa"):
        bg = []
        for kn, qk in zip(AG["bogumlar"], BOG_Q):
            w = dunya(poli_ornek(gpts, qk))
            p = proj_dunya(w, son)
            bg.append({"x": p[0], "y": p[1], "baslik": kn["title"], "satirlar": kn["lines"], "taraf": kn["side"]})
        js["capalar"] = {"bogumlar": bg}
        js["capa_tanim"] = "pa: iki boğum (tree.ts KNOTS; metin DOM'da facts/tree.ts'ten), master px"
    if klip in ("tab", "pb"):
        js["capalar"] = {"dal_uclari": [proj_dunya(w, son) for w in du]}
        js["capa_tanim"] = ("pb: 6 ana dal ucu (alttan üste: solAlt, sağAlt, solOrta, sağOrta, solÜst, sağÜst), master px; "
                            "DOM polaroidleri (4: p12/p17 sol, p19/p22 sağ — ONAY) bu uçlara asılır")
    if klip in ("tbc", "lc", "pc"):
        js["capalar"] = {"dal_uclari": [proj_dunya(w, son) for w in du], "govde_ucu": proj_dunya(gu, son)}
    # yatay kırpım önerisi: durak öznesinin dikey ortası
    fo = {"t89": "kok", "p9": "kok", "t9a": "govde", "pa": "govde", "tab": "dallar", "pb": "dallar", "tbc": "yaprak",
          "lc": "yaprak", "pc": "yaprak"}.get(klip)
    if fo:
        f_ = FOCUS[fo]
        ys = [proj_dunya(yerel(*agac3(200, y, GOV_Y)), son)[1] for y in (f_["y0"], f_.get("y1min", f_["y1"]))]
        yatay_ky = kirpim_y_oneri((min(ys), max(ys)))
        js["kirpimY_oneri"] = yatay_ky
    yol_ = os.path.join(A.kok, f"{klip}.json")
    os.makedirs(A.kok, exist_ok=True)
    js = {k.rstrip("_"): v for k, v in js.items()}
    json.dump(js, open(yol_, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("[JSON]", yol_, flush=True)


if A.json or A.yalniz_json or TUR == "son-kare":
    json_yaz()
if A.yalniz_json or TUR == "son-kare":
    if TUR == "son-kare":
        print(f"[SON-KARE] {KLIP} = {KAYNAK_KLIP}[{K0}]; render yok, yalnız json", flush=True)
    raise SystemExit(0)

# görüntü dökümü (render'da yazı / logo / insan yok denetimi; yalnız kadrajdaki S3 + S2 dokuları adla)
print("[IMAJ] " + ", ".join(sorted(os.path.basename(i.filepath) for i in bpy.data.images if i.filepath)), flush=True)

if A.blend:
    bpy.ops.wm.save_as_mainfile(filepath=A.blend, compress=True)

# ================================================================== 17) maske (Workbench malzeme kimliği)
MASKE3 = {"s3_kok_kapak": (1, 0, 0), "s3_kok": (0, 1, 0), "s3_toprak": (0.3, 0.2, 0.1), "s3_yaprak": (0, 0.6, 0),
          "s3_kabuk": (0.6, 0.3, 0), "s3_cam": (0, 0, 0), "s3_palamut": (1, 0, 1), "kapak": (0, 0, 1)}
if A.maske:
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
        rk = (0.08, 0.08, 0.08)
        for on, r in sorted(MASKE3.items(), key=lambda kv: -len(kv[0])):
            if m.name.startswith(on):
                rk = r
                break
        m.diffuse_color = (*rk, 1)
    if CAM is not None:
        CAM.hide_render = True
    sc.world.color = (0, 0, 0)

# ================================================================== 18) render
kareler = list(range(K0, K1 + 1))
if A.kareler:
    if "-" in A.kareler and "," not in A.kareler:
        x_, y_ = A.kareler.split("-")
        kareler = list(range(int(x_), int(y_) + 1))
    else:
        kareler = [int(v) for v in A.kareler.split(",")]
out = A.out or os.path.join(A.kok, KLIP if not A.onizleme else f"_onizleme/s3-{KLIP}")
os.makedirs(out, exist_ok=True)
t_kurulum = time.perf_counter() - T_BASLA
sure = O.Sure(a2, f"S3-{KLIP}-EEVEE-{a2.res}", {"klip": KLIP, "kare_aralik": [kareler[0], kareler[-1]], "out": out,
                                                "yaprak": N_YAPRAK, "kasa": KASA_MERKEZ, "gok": A.gok, "cam_k": A.cam_k,
                                                "k10": K10})
if A.kilit:
    O.kilit_al(f"S3 {KLIP} EEVEE {a2.res}")
try:
    for f in kareler:
        sc.frame_set(f)
        sc.render.filepath = os.path.join(out, f"k_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
finally:
    if A.kilit:
        O.kilit_birak()
if A.log:
    a2.log = A.log
sure.bitir(t_kurulum)
