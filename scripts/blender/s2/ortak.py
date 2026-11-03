"""S2 ortak yardımcıları (Blender 5.2.3 LTS): argümanlar, render ayarları, kare süresi, GPU kilidi,
easing, ağ/düğüm kısayolları, anahtar kare. Kaynak: R2 spike `ortak.py` (docs/blender-boru-hatti.md §2, §11)."""
import bpy, sys, os, time, json, math, argparse, socket
import numpy as np

VARLIK = "D:/soft/cop31-varlik"
RENDER = VARLIK + "/render"
KILIT = RENDER + "/.gpu-kilit"


# ------------------------------------------------------------------ easing (brief-icinden-3 §2.1)
def clamp01(x):
    return 0.0 if x < 0 else 1.0 if x > 1 else x


def ease_in_out_sine(x):
    x = clamp01(x)
    return 0.5 - 0.5 * math.cos(math.pi * x)


def ease_in_out_cubic(x):
    x = clamp01(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_out_cubic(x):
    x = clamp01(x)
    return 1 - (1 - x) ** 3


def ease_in_cubic(x):
    x = clamp01(x)
    return x ** 3


def smoother(x):
    x = clamp01(x)
    return x * x * x * (x * (6 * x - 15) + 10)


# ------------------------------------------------------------------ F turu "fiske" (flick) ilerlemesi (brief §13.1)
# S1 scripts/blender/s1/kamera.py fiske() ile BİRE BİR aynı tanım (iki sahne aynı eğri): p(t), t ∈ [0, 1] (t = kare / son kare;
# a = kalkış süresi / klip süresi, ör. 0,15 s · 30 / son kare).
#   t ≥ a: p = P0 + (1 − P0) · E((t − a) / (1 − a)),  E(u) = (1 − (1 − m·u)^k) / (1 − (1 − m)^k)  (m = 1: tam ease-out, sonda hız 0)
#   t < a: beşinci derece kalkış q(s) = c3 s³ + c4 s⁴ + c5 s⁵ (s = t / a; p, p', p'' sürekli, hız 0'dan); t = a'da değer, eğim,
#          eğrilik ease-out ile eşit. P0 "yarı hız" kuralı: kalkışın ortalama hızı birleşme hızının yarısı → hız tekdüze artar,
#          birleşmede aşma yok (ease-out'a değerden eşlemek hızı %40–60 aşırtıyordu; S2 ölçümü: tepe kalkışta 1,4–1,6×).
# k ∈ [2; 3] (varsayılan 2,4). Kabul p(0,5) ≥ 0,75: bu tanımda S2 sürelerinde k ≥ 2,2 gerekir (k 2,0 → 0,73).
FISKE_A_SN, FISKE_K = 0.15, 2.4
_FISKE_ONBELLEK = {}


def _besinci(Q, V, A):
    """q(s) = c3 s³ + c4 s⁴ + c5 s⁵, s ∈ [0, 1]: q(0) = q'(0) = q''(0) = 0; q(1) = Q, q'(1) = V, q''(1) = A."""
    M = np.array([[1.0, 1.0, 1.0], [3.0, 4.0, 5.0], [6.0, 12.0, 20.0]])
    return np.linalg.solve(M, np.array([Q, V, A], np.float64))


def fiske(t, a, k=FISKE_K, m=1.0):
    """Fiske ilerlemesi p(t) ∈ [0, 1] (S1 kamera.fiske ile aynı; bkz. yukarı)."""
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


def fiske_kare(f, n_son, a_sn=FISKE_A_SN, k=FISKE_K, fps=30.0):
    """Kare f (0 … n_son) → p. Kalkış payı saniye cinsinden (a_sn) klip süresine (n_son / fps) oranlanır."""
    return fiske(f / float(n_son), a_sn * fps / float(n_son), k)


def fiske_ters(p, a, k=FISKE_K):
    """p → u (fiske'nin tersi; ikiye bölme, 1e-10)."""
    p = clamp01(p)
    lo, hi = 0.0, 1.0
    for _ in range(60):
        m = (lo + hi) / 2
        if fiske(m, a, k) < p:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


def sine_ters(s):
    """easeInOutSine'ın tersi: s → u (E turu zaman eğrisinde s ilerlemesine varılan u)."""
    return math.acos(1.0 - 2.0 * clamp01(s)) / math.pi


def miknatis(t, t0, sure, asma=0.02, yerlesme=0.12):
    """Montaj oturması (R3 T34 kartı): t0'da başlar, `sure` içinde easeInOutCubic ile 0 → 1+asma,
    sonra `yerlesme` (120 ms) içinde easeInOutSine ile 1+asma → 1. Sekme yok."""
    if t <= t0:
        return 0.0
    if t < t0 + sure:
        return (1 + asma) * ease_in_out_cubic((t - t0) / sure)
    if t < t0 + sure + yerlesme:
        return 1 + asma - asma * ease_in_out_sine((t - t0 - sure) / yerlesme)
    return 1.0


def lerp(a, b, s):
    return a + (b - a) * s


def vlerp(a, b, s):
    return tuple(x + (y - x) * s for x, y in zip(a, b))


# ------------------------------------------------------------------ argümanlar
def argumanlar(ek=None):
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--engine", default="EEVEE", choices=["EEVEE", "CYCLES"])
    p.add_argument("--res", type=int, default=1920)          # kare master kenarı (px)
    p.add_argument("--onizleme", action="store_true")         # 960², 8 bit, TAA 16
    p.add_argument("--samples", type=int, default=0)          # 0 → motor varsayılanı (EEVEE TAA 16 / 64, Cycles 64)
    p.add_argument("--denoise", type=int, default=1)
    p.add_argument("--mb", type=int, default=1)
    p.add_argument("--depth", default="", choices=["", "8", "16"])
    p.add_argument("--exposure", type=float, default=0.3)
    p.add_argument("--look", default="AgX - Punchy")
    p.add_argument("--vt", default="AgX")                     # görünüm dönüşümü (AgX | Khronos PBR Neutral | Standard)
    p.add_argument("--out", default="")
    p.add_argument("--log", default="")
    p.add_argument("--seed", type=int, default=31)
    p.add_argument("--blend", default="")
    p.add_argument("--kilit", action="store_true")            # GPU kilidi (Cycles / 1920² EEVEE dizileri)
    p.add_argument("--em_ornek", default="NONE", choices=["AUTO", "NONE"])
    if ek:
        ek(p)
    a = p.parse_args(argv)
    if a.onizleme:
        a.res = 960
        a.depth = a.depth or "8"
    a.depth = a.depth or "16"
    if a.samples == 0:
        a.samples = 64 if a.engine == "CYCLES" else (16 if a.onizleme else 64)
    return a


def render_ayarla(a):
    sc = bpy.context.scene
    r = sc.render
    r.resolution_x = r.resolution_y = a.res
    r.resolution_percentage = 100
    r.fps = 30
    r.film_transparent = False
    r.use_motion_blur = bool(a.mb)
    r.motion_blur_shutter = 0.5
    r.dither_intensity = 1.0
    sc.view_settings.view_transform = a.vt
    sc.view_settings.look = a.look if a.vt == "AgX" else "None"
    sc.view_settings.exposure = a.exposure
    im = r.image_settings
    im.media_type = "IMAGE"
    im.file_format = "PNG"
    im.color_mode = "RGB"
    im.color_depth = a.depth
    im.compression = 15
    r.use_file_extension = True
    if a.engine == "CYCLES":
        r.engine = "CYCLES"
        pr = bpy.context.preferences.addons["cycles"].preferences
        pr.compute_device_type = "OPTIX"
        pr.get_devices()
        for d in pr.devices:
            d.use = d.type == "OPTIX"
        cy = sc.cycles
        cy.device = "GPU"
        cy.samples = a.samples
        cy.use_adaptive_sampling = True
        cy.adaptive_threshold = 0.01
        cy.use_denoising = bool(a.denoise)
        cy.denoiser = "OPENIMAGEDENOISE"
        cy.denoising_use_gpu = True
        cy.seed = a.seed
        cy.use_animated_seed = True
        cy.max_bounces = 8
        cy.diffuse_bounces = 4
        cy.glossy_bounces = 4
        cy.transmission_bounces = 8
        cy.transparent_max_bounces = 16
        cy.volume_bounces = 0
        cy.caustics_reflective = False
        cy.caustics_refractive = False
        cy.blur_glossy = 1.0
        cy.sample_clamp_indirect = 8.0
        r.use_persistent_data = True
    else:
        r.engine = "BLENDER_EEVEE"
        ee = sc.eevee
        ee.taa_render_samples = a.samples
        son = not a.onizleme   # B turu son render: 1920² TAA 64, ışın izlemeli GI/yansıma tam çözünürlük, yüksek gölge havuzu
        ee.use_shadows = True
        ee.shadow_ray_count = 3 if son else 2
        ee.shadow_step_count = 10 if son else 6
        ee.shadow_resolution_scale = 1.0
        if son:
            ee.shadow_pool_size = "1024"
        ee.use_raytracing = True
        ee.ray_tracing_method = "SCREEN"
        ee.ray_tracing_options.resolution_scale = "1" if son else "2"
        ee.ray_tracing_options.trace_max_roughness = 0.5
        ee.ray_tracing_options.use_denoise = True
        ee.use_fast_gi = True
        ee.fast_gi_method = "GLOBAL_ILLUMINATION"
        ee.fast_gi_resolution = "1" if son else "2"
        ee.fast_gi_step_count = 12 if son else 8
        ee.fast_gi_distance = 6.0
        ee.motion_blur_steps = 1
        ee.clamp_surface_indirect = 10.0


def emisyon_ornekleme(a):
    """Emisyonlu malzemeler (ekran, ışıklık difüzörü, armatür, masa üstü) Cycles ışık ağacına girmesin (R2 §5)."""
    if a.em_ornek == "AUTO":
        return
    for m in bpy.data.materials:
        if hasattr(m, "cycles") and hasattr(m.cycles, "emission_sampling"):
            m.cycles.emission_sampling = a.em_ornek


# ------------------------------------------------------------------ GPU kilidi (brief §9.3)
def kilit_al(sahip, bekle=10.0, olu_dk=45.0):
    """sahip.txt tek satır: '<ajan> <klip …> pid=N <ISO zaman> <epoch>' — son belirteç epoch (S1 calis.py da böyle okur)."""
    while True:
        try:
            os.mkdir(KILIT)
            with open(KILIT + "/sahip.txt", "w", encoding="utf-8") as f:
                f.write(f"{sahip} pid={os.getpid()} {time.strftime('%Y-%m-%dT%H:%M:%S')} {time.time():.0f}\n")
            print(f"[KILIT] alındı: {sahip}", flush=True)
            return
        except FileExistsError:
            try:
                satir = open(KILIT + "/sahip.txt", encoding="utf-8").read().strip()
                yas = time.time() - float(satir.split()[-1])
                if yas > olu_dk * 60:
                    print(f"[KILIT] ölü kilit ({yas / 60:.0f} dk: {satir}) siliniyor", flush=True)
                    kilit_birak(zorla=True)
                    continue
                print(f"[KILIT] dolu: {satir[:60]} ({yas:.0f} sn); {bekle:.0f} sn sonra", flush=True)
            except Exception:
                pass
            time.sleep(bekle)


def kilit_birak(zorla=False):
    if not zorla:   # yalnız kendi kilidini bırak (başkası ölü sayıp devraldıysa dokunma)
        try:
            if f"pid={os.getpid()} " not in open(KILIT + "/sahip.txt", encoding="utf-8").read():
                print("[KILIT] kilit artık bende değil; dokunulmadı", flush=True)
                return
        except OSError:
            return
    try:
        os.remove(KILIT + "/sahip.txt")
    except OSError:
        pass
    try:
        os.rmdir(KILIT)
        print("[KILIT] bırakıldı", flush=True)
    except OSError:
        pass


# ------------------------------------------------------------------ kare süresi
class Sure:
    def __init__(self, a, etiket, ek=None):
        self.a = a; self.etiket = etiket; self.ek = ek or {}
        self.t_basla = time.perf_counter(); self.kareler = []; self._t = None; self._tw = None
        self.stat_son = ""; self.stat_kare = ""
        h = bpy.app.handlers
        h.render_pre.append(self.pre); h.render_post.append(self.post); h.render_write.append(self.write)
        if hasattr(h, "render_stats"):
            h.render_stats.append(self.stats)

    def stats(self, s, *_):
        # Cycles: "… | Mem:1.21G, Peak:1.35G | …" — kare sonundaki son satır saklanır (VRAM/RAM tepe tahmini)
        if isinstance(s, str) and ("Mem" in s or "Peak" in s):
            self.stat_son = s

    def pre(self, sc, *_):
        self._t = time.perf_counter()

    def post(self, sc, *_):
        self._tw = time.perf_counter()

    def write(self, sc, *_):
        t = time.perf_counter()
        kayit = {"kare": sc.frame_current, "render_sn": round(self._tw - self._t, 3), "yazma_sn": round(t - self._tw, 3)}
        if self.stat_son:
            kayit["stat"] = self.stat_son[-160:]
        self.kareler.append(kayit)
        print(f"[SURE] {self.etiket} kare {sc.frame_current}: {self._tw - self._t:.2f} sn (+yazma {t - self._tw:.2f})", flush=True)

    def bitir(self, t_kurulum):
        rs = [k["render_sn"] for k in self.kareler]
        oz = {
            "etiket": self.etiket, "engine": self.a.engine, "res": self.a.res, "samples": self.a.samples, "mb": self.a.mb,
            "kurulum_sn": round(t_kurulum, 2), "toplam_sn": round(time.perf_counter() - self.t_basla, 2),
            "ilk_kare_sn": rs[0] if rs else None,
            "ort_sn_ilk_haric": round(sum(rs[1:]) / max(1, len(rs) - 1), 3) if len(rs) > 1 else None,
            "kare_say": len(rs), "kareler": self.kareler, "zaman": time.strftime("%Y-%m-%dT%H:%M:%S"),
        }
        oz.update(self.ek)
        print("[OZET]", json.dumps({k: v for k, v in oz.items() if k != "kareler"}, ensure_ascii=False), flush=True)
        if self.a.log:
            with open(self.a.log, "a", encoding="utf-8") as f:
                f.write(json.dumps(oz, ensure_ascii=False) + "\n")


# ------------------------------------------------------------------ ağ
def ag(ad, co, yuzler, uv=None):
    """co: (n,3); yuzler: list of vertex-index lists; uv: list (yüz başına loop uv listesi) ya da None."""
    me = bpy.data.meshes.new(ad)
    me.from_pydata([tuple(map(float, c)) for c in co], [], [list(f) for f in yuzler])
    if uv is not None:
        lay = me.uv_layers.new(name="UVMap")
        k = 0
        for f, fuv in zip(me.polygons, uv):
            for li, u in zip(f.loop_indices, fuv):
                lay.data[li].uv = u
    me.validate()
    me.update()
    return me


def obje(ad, me, col, mat=None, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(ad, me)
    col.objects.link(o)
    o.location = loc
    if mat is not None:
        if isinstance(mat, (list, tuple)):
            for m in mat:
                me.materials.append(m)
        else:
            me.materials.append(mat)
    if parent is not None:
        o.parent = parent
    return o


def kutu_ag(ad, sx, sy, sz, merkez_alt=True, uv_olcek=1.0):
    """Kutu (sx × sy × sz), taban z=0 (merkez_alt) ya da merkezli. UV: her yüz kendi düzleminde metre × uv_olcek."""
    x, y = sx / 2, sy / 2
    z0, z1 = (0.0, sz) if merkez_alt else (-sz / 2, sz / 2)
    co = [(-x, -y, z0), (x, -y, z0), (x, y, z0), (-x, y, z0), (-x, -y, z1), (x, -y, z1), (x, y, z1), (-x, y, z1)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    s = uv_olcek
    uv = [
        [(0, 0), (0, sy * s), (sx * s, sy * s), (sx * s, 0)],
        [(0, 0), (sx * s, 0), (sx * s, sy * s), (0, sy * s)],
        [(0, 0), (sx * s, 0), (sx * s, sz * s), (0, sz * s)],
        [(0, 0), (sy * s, 0), (sy * s, sz * s), (0, sz * s)],
        [(0, 0), (sx * s, 0), (sx * s, sz * s), (0, sz * s)],
        [(0, 0), (sy * s, 0), (sy * s, sz * s), (0, sz * s)],
    ]
    return ag(ad, co, f, uv)


def bevel(o, w=0.006, seg=2):
    m = o.modifiers.new("bevel", "BEVEL")
    m.width = w
    m.segments = seg
    m.limit_method = "ANGLE"
    m.harden_normals = False
    return m


# ------------------------------------------------------------------ anahtar kare
def anahtar(o, kareler, fn, ozellikler=("location", "rotation_euler")):
    """fn(kare) → dict(location=…, rotation_euler=…, scale=…); her kareye LINEAR anahtar."""
    for f in kareler:
        d = fn(f)
        for k in ozellikler:
            if k in d:
                setattr(o, k, d[k])
                o.keyframe_insert(k, frame=f)


def deger_anahtar(idblok, yol, kareler, fn):
    for f in kareler:
        v = fn(f)
        # yol: "energy" ya da düğüm girişi "nodes[\"Emission\"].inputs[1].default_value"
        if yol.startswith("nodes"):
            exec(f"idblok.{yol} = v", {"idblok": idblok, "v": v})
        else:
            setattr(idblok, yol, v)
        idblok.keyframe_insert(yol, frame=f)


# ------------------------------------------------------------------ düğüm kısayolu (R2)
class D:
    def __init__(self, tree):
        self.t = tree; self.n = tree.nodes; self.l = tree.links
        for x in list(self.n):
            self.n.remove(x)

    def __call__(self, tip, **kw):
        nd = self.n.new(tip)
        for k, v in kw.items():
            if k.startswith("i_"):
                key = k[2:].replace("__", " ")
                sock = nd.inputs[int(key)] if key.isdigit() else nd.inputs[key]
                sock.default_value = v
            else:
                setattr(nd, k, v)
        return nd

    def b(self, a, b_):
        self.l.new(a, b_)

    def resim(self, yol, renkli=True, uzanti="REPEAT", vec=None, interp="Linear", alfa="STRAIGHT"):
        img = bpy.data.images.load(yol, check_existing=True)
        img.colorspace_settings.name = "sRGB" if renkli else "Non-Color"
        img.alpha_mode = alfa
        nd = self("ShaderNodeTexImage", image=img, extension=uzanti, interpolation=interp)
        if vec is not None:
            self.b(vec, nd.inputs["Vector"])
        return nd

    def math(self, op, a, b_=None, clamp=False):
        nd = self("ShaderNodeMath", operation=op, use_clamp=clamp)
        for i, v in enumerate((a, b_)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                nd.inputs[i].default_value = v
            else:
                self.b(v, nd.inputs[i])
        return nd.outputs[0]

    def karistir(self, fac, a, b_, tip="RGBA", blend="MIX"):
        nd = self("ShaderNodeMix", data_type=tip)
        if tip == "RGBA":
            nd.blend_type = blend
        f = nd.inputs[0]
        if isinstance(fac, (int, float)):
            f.default_value = fac
        else:
            self.b(fac, f)
        ia = {"RGBA": 6, "FLOAT": 2, "VECTOR": 4}[tip]
        for k, v in ((ia, a), (ia + 1, b_)):
            if isinstance(v, (tuple, list)):
                nd.inputs[k].default_value = (*v, 1.0) if (tip == "RGBA" and len(v) == 3) else v
            elif isinstance(v, (int, float)):
                nd.inputs[k].default_value = v
            else:
                self.b(v, nd.inputs[k])
        oa = {"RGBA": 2, "FLOAT": 0, "VECTOR": 1}[tip]
        return nd.outputs[oa]


def srgb(h):
    """'#RRGGBB' → doğrusal RGB (Principled Base Color doğrusal ister)."""
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)
