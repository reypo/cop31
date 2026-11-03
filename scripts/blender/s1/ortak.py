"""S1 ortak yardımcıları (R2 spike ortak.py'den): emisyon örnekleme, numpy→mesh, eşdikdörtgen küre ağı,
düğüm kısayolları. Blender 5.2.3 LTS."""
import bpy, sys, os, time, json, math, argparse
import numpy as np


def emisyon_ornekleme(a):
    """Pus/atmosfer/gece ışığı emisyonu sahneyi aydınlatmak için değil: Cycles ışık ağacına girmesin."""
    if a.em_ornek == "AUTO":
        return
    for m in bpy.data.materials:
        if hasattr(m, "cycles") and hasattr(m.cycles, "emission_sampling"):
            m.cycles.emission_sampling = a.em_ornek


def temizle():
    bpy.ops.wm.read_factory_settings(use_empty=True)


# ------------------------------------------------------------------ ağ üretimi
def ag_olustur(ad, co, yuz_basla, yuz_index, uv=None):
    """co: (n,3) float; yuz_basla: her poligonun loop başlangıcı; yuz_index: düz loop->vertex dizisi"""
    me = bpy.data.meshes.new(ad)
    me.vertices.add(len(co))
    me.vertices.foreach_set("co", np.ascontiguousarray(co, dtype=np.float32).ravel())
    me.loops.add(len(yuz_index))
    me.loops.foreach_set("vertex_index", np.ascontiguousarray(yuz_index, dtype=np.int32))
    me.polygons.add(len(yuz_basla))
    me.polygons.foreach_set("loop_start", np.ascontiguousarray(yuz_basla, dtype=np.int32))
    if uv is not None:
        lay = me.uv_layers.new(name="UVMap")
        lay.data.foreach_set("uv", np.ascontiguousarray(uv, dtype=np.float32).ravel())
    me.update(calc_edges=True)
    me.validate(clean_customdata=False)
    me.polygons.foreach_set("use_smooth", np.ones(len(yuz_basla), dtype=bool))
    me.update()
    return me


def latlon_xyz(lat, lon, r=1.0):
    """Dünya-yarıçapı birimi; +Z kuzey kutbu, +X (0K,0D), +Y (0K,90D)."""
    la, lo = math.radians(lat), math.radians(lon)
    return (r * math.cos(la) * math.cos(lo), r * math.cos(la) * math.sin(lo), r * math.sin(la))


def kure_ag(ad, nlon=512, nlat=256):
    """Eşdikdörtgen UV'li küre: u=(boylam+180)/360, v=(enlem+90)/180 — doku eşlemesi tanım gereği doğru.
    Dikiş (±180) vertex'leri ortak, UV'leri loop başına; kutuplarda üçgen yelpaze."""
    lats = np.linspace(-90, 90, nlat + 1)[1:-1]             # kutuplar hariç halkalar
    lons = np.linspace(-180, 180, nlon + 1)[:-1]
    LA, LO = np.meshgrid(np.radians(lats), np.radians(lons), indexing="ij")
    co = np.stack([np.cos(LA) * np.cos(LO), np.cos(LA) * np.sin(LO), np.sin(LA)], -1).reshape(-1, 3)
    co = np.vstack([co, [[0, 0, -1], [0, 0, 1]]])
    gs, gn = len(co) - 2, len(co) - 1
    nr = nlat - 1
    vid = lambda i, j: i * nlon + (j % nlon)
    starts, idx, uvs = [], [], []
    def u_(j): return j / nlon
    def v_(i): return (lats[i] + 90) / 180
    # orta şeritler (dörtgen)
    I, J = np.meshgrid(np.arange(nr - 1), np.arange(nlon), indexing="ij")
    I, J = I.ravel(), J.ravel()
    q = np.stack([I * nlon + J, I * nlon + (J + 1) % nlon, (I + 1) * nlon + (J + 1) % nlon, (I + 1) * nlon + J], -1)
    quv = np.stack([
        np.stack([J / nlon, (lats[I] + 90) / 180], -1),
        np.stack([(J + 1) / nlon, (lats[I] + 90) / 180], -1),
        np.stack([(J + 1) / nlon, (lats[I + 1] + 90) / 180], -1),
        np.stack([J / nlon, (lats[I + 1] + 90) / 180], -1)], 1)
    # güney kutup üçgenleri (dışa dönük sıra: kutup, j+1, j)
    J2 = np.arange(nlon)
    ts = np.stack([np.full(nlon, gs), (J2 + 1) % nlon, J2], -1)
    tsuv = np.stack([np.stack([(J2 + 0.5) / nlon, np.zeros(nlon)], -1),
                     np.stack([(J2 + 1) / nlon, np.full(nlon, v_(0))], -1),
                     np.stack([J2 / nlon, np.full(nlon, v_(0))], -1)], 1)
    top = (nr - 1) * nlon
    tn = np.stack([top + J2, top + (J2 + 1) % nlon, np.full(nlon, gn)], -1)
    tnuv = np.stack([np.stack([J2 / nlon, np.full(nlon, v_(nr - 1))], -1),
                     np.stack([(J2 + 1) / nlon, np.full(nlon, v_(nr - 1))], -1),
                     np.stack([(J2 + 0.5) / nlon, np.ones(nlon)], -1)], 1)
    idx = np.concatenate([q.ravel(), ts.ravel(), tn.ravel()])
    uv = np.concatenate([quv.reshape(-1, 2), tsuv.reshape(-1, 2), tnuv.reshape(-1, 2)])
    starts = np.concatenate([np.arange(len(q)) * 4, len(q) * 4 + np.arange(2 * nlon) * 3])
    return ag_olustur(ad, co, starts, idx, uv)


# ------------------------------------------------------------------ düğüm kısayolları
class D:
    """Malzeme düğüm ağacı kısayolu."""
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

    def vmath(self, op, a, b_=None):
        nd = self("ShaderNodeVectorMath", operation=op)
        for i, v in enumerate((a, b_)):
            if v is None:
                continue
            if isinstance(v, (tuple, list)):
                nd.inputs[i].default_value = v
            else:
                self.b(v, nd.inputs[i])
        out = "Value" if op in ("DOT_PRODUCT", "LENGTH", "DISTANCE") else "Vector"
        return nd.outputs[out]

    def aralik(self, v, a, b_, c=0.0, d=1.0, tip="SMOOTHSTEP"):
        nd = self("ShaderNodeMapRange", interpolation_type=tip, clamp=True)
        nd.inputs["From Min"].default_value = a; nd.inputs["From Max"].default_value = b_
        nd.inputs["To Min"].default_value = c; nd.inputs["To Max"].default_value = d
        self.b(v, nd.inputs["Value"])
        return nd.outputs["Result"]

    def resim(self, yol, renkli=True, uzanti="REPEAT", vec=None, interp="Linear"):
        img = bpy.data.images.load(yol, check_existing=True)
        img.colorspace_settings.name = "sRGB" if renkli else "Non-Color"
        nd = self("ShaderNodeTexImage", image=img, extension=uzanti, interpolation=interp)
        if vec is not None:
            self.b(vec, nd.inputs["Vector"])
        return nd

    def karistir(self, fac, a, b_, tip="RGBA"):
        # ShaderNodeMix girişleri: 0 Factor(float) | 2,3 A/B float | 4,5 A/B vektör | 6,7 A/B renk
        nd = self("ShaderNodeMix", data_type=tip)
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
