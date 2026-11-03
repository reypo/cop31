"""OSM yakın alan (osm/expo-3d.geojson, Expo ±1 km) → Blender'a hazır üçgen ağlar (.npz) + ağaç/araç örnekleme.

hazirla.py osm adımında çağrılır. Koordinat: dünya metre (X doğu, Y kuzey, Z yukarı); expo-yerel-m'den
X = x, Y = −y; Z = yakın DTM (DSM'den açma ile türetildi, hazirla.py arazi) − r²/2R (küre eğriliği).
railway=proposed modellenmez. Ağlar `ag_<ad>.npz`: v (n,3) float32, f (m,3) int32, uv (m,3,2) float32,
mat (m,) int8, rnd (m,) float32 [, renk (m,) int8].
"""
import json
import math
import os

import numpy as np
from PIL import Image, ImageFilter

R = 6371008.8


class Ag:
    def __init__(self):
        self.v, self.f, self.uv, self.mat, self.rnd, self.renk = [], [], [], [], [], []
        self.n = 0

    def ekle(self, v, f, uv, mat, rnd, renk=0):
        v = np.asarray(v, np.float32); f = np.asarray(f, np.int32)
        self.v.append(v); self.f.append(f + self.n)
        self.uv.append(np.asarray(uv, np.float32).reshape(len(f), 3, 2))
        self.mat.append(np.broadcast_to(np.asarray(mat, np.int8), (len(f),)).copy())
        self.rnd.append(np.broadcast_to(np.asarray(rnd, np.float32), (len(f),)).copy())
        self.renk.append(np.broadcast_to(np.asarray(renk, np.int8), (len(f),)).copy())
        self.n += len(v)

    def kaydet(self, yol):
        if not self.v:
            return 0
        np.savez_compressed(yol, v=np.concatenate(self.v), f=np.concatenate(self.f), uv=np.concatenate(self.uv),
                            mat=np.concatenate(self.mat), rnd=np.concatenate(self.rnd), renk=np.concatenate(self.renk))
        return int(sum(len(x) for x in self.f))


def uret(V, OUT, log):
    import shapely
    from shapely.geometry import shape, Polygon, MultiPolygon, LineString, LinearRing, Point
    from shapely.ops import unary_union
    rng = np.random.default_rng(31)
    g = json.load(open(os.path.join(V, "osm", "expo-3d.geojson"), encoding="utf-8"))
    dtm = np.load(os.path.join(OUT, "dtm_yakin.npy"))           # 1024², 6 m, ±3072, satır 0 kuzey

    def zemin(x, y_s):
        """x doğu, y_s güney (+) → dünya Z (eğrilik dahil)."""
        x = np.asarray(x, np.float64); y_s = np.asarray(y_s, np.float64)
        c = np.clip((x + 3072) / 6 - 0.5, 0, 1022.999); r = np.clip((y_s + 3072) / 6 - 0.5, 0, 1022.999)
        c0 = np.floor(c).astype(int); r0 = np.floor(r).astype(int); fc = c - c0; fr = r - r0
        h = (dtm[r0, c0] * (1 - fc) + dtm[r0, c0 + 1] * fc) * (1 - fr) + (dtm[r0 + 1, c0] * (1 - fc) + dtm[r0 + 1, c0 + 1] * fc) * fr
        return h - (x * x + y_s * y_s) / (2 * R)

    def W(x, y_s, z):
        return np.stack([x, -np.asarray(y_s), z], -1)

    feats = g["features"]
    kat = lambda k: [f for f in feats if f["properties"].get("katman") == k]

    def ucgenle(poly):
        tris = shapely.constrained_delaunay_triangles(poly)
        out = []
        for t in tris.geoms:
            if not poly.buffer(0.01).contains(t.centroid):
                continue
            c = np.array(t.exterior.coords[:3])
            # saat yönü tersi (yukarıdan, x doğu / y güney çerçevesinde y ters → işaret)
            ar = (c[1, 0] - c[0, 0]) * (c[2, 1] - c[0, 1]) - (c[2, 0] - c[0, 0]) * (c[1, 1] - c[0, 1])
            if ar > 0:          # y güney: pozitif alan = dünya çerçevesinde saat yönü → çevir
                c = c[[0, 2, 1]]
            out.append(c)
        return np.array(out) if out else np.zeros((0, 3, 2))

    def poligonlar(geom):
        if isinstance(geom, Polygon):
            return [geom]
        if isinstance(geom, MultiPolygon):
            return list(geom.geoms)
        return []

    def eksen_aci(poly):
        r = poly.minimum_rotated_rectangle
        c = np.array(r.exterior.coords)
        e = [(np.hypot(*(c[i + 1] - c[i])), c[i + 1] - c[i]) for i in range(2)]
        L, d = max(e, key=lambda t: t[0])
        return math.atan2(d[1], d[0])

    def prizma(ag, poly, yuk, mat_duvar, mat_cati, rnd, renk=0, taban_ek=0.6, cati_uv_aci=None, ust_sabit=None):
        poly = poly.buffer(0)
        if poly.is_empty:
            return None
        for pp in poligonlar(poly):
            ext = np.array(pp.exterior.coords)
            zs = zemin(ext[:, 0], ext[:, 1])
            z0 = float(zs.min()) - taban_ek
            z1 = ust_sabit if ust_sabit is not None else float(zs.max()) + yuk
            halkalar = [pp.exterior] + list(pp.interiors)
            for hi, ring in enumerate(halkalar):
                c = np.array(ring.coords)
                if LinearRing(c).is_ccw == (hi == 0):   # y güney çerçevesinde dış halka saat yönünde olmalı
                    c = c[::-1]
                n = len(c) - 1
                s = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(c, axis=0).T))])
                for i in range(n):
                    a_, b_ = c[i], c[i + 1]
                    v = W(np.array([a_[0], b_[0], b_[0], a_[0]]), np.array([a_[1], b_[1], b_[1], a_[1]]),
                          np.array([z0, z0, z1, z1]))
                    uv = np.array([[s[i], z0], [s[i + 1], z0], [s[i + 1], z1], [s[i], z0], [s[i + 1], z1], [s[i], z1]])
                    uv[:, 1] -= z0
                    ag.ekle(v, [[0, 1, 2], [0, 2, 3]], uv, mat_duvar, rnd, renk)
            tr = ucgenle(pp)
            if len(tr):
                v = W(tr[..., 0].ravel(), tr[..., 1].ravel(), np.full(tr.shape[0] * 3, z1))
                f = np.arange(len(v)).reshape(-1, 3)
                xy = tr.reshape(-1, 2).copy()
                if cati_uv_aci is not None:
                    ca, sa = math.cos(-cati_uv_aci), math.sin(-cati_uv_aci)
                    xy = np.stack([xy[:, 0] * ca - xy[:, 1] * sa, xy[:, 0] * sa + xy[:, 1] * ca], -1)
                ag.ekle(v, f, xy, mat_cati, rnd, renk)
        return z1

    # ------------------------------------------------------------------ B turu: örnekleme (instance) noktaları
    # her kayıt: dünya X, Y, Z (zemin), açı (dünya Z ekseni çevresinde, rad), ölçek x, y, z, tip
    ORN = {"sera": [], "agac": [], "kent": []}
    from shapely import affinity
    from shapely.geometry import box as kutu_poly
    import kamera as KM_                                  # d3 kamerasının yeri (seyreltme uzaklığı buna göre)
    _h = shape(kat("expo_salonu")[0]["geometry"]).centroid
    KAMX = _h.x + KM_.D3_UZ * math.sin(math.radians(KM_.D3_AZ))
    KAMY = _h.y - KM_.D3_UZ * math.cos(math.radians(KM_.D3_AZ))

    def sera_tunel(poly):
        """Sera bloğu → uzun eksen boyunca 7,5–9,6 m açıklıklı modüller (tip 0 tonoz, 1 çatılı). Her şerit, gerçek
        çokgenle kesişiminin boyuna uzunluğunda bir örnek olur."""
        poly = poly.buffer(0)
        if poly.is_empty or poly.area < 60:
            return 0
        aci = eksen_aci(poly)
        c0 = poly.centroid
        rp = affinity.rotate(poly, -aci, origin=c0, use_radians=True)
        minu, minv, maxu, maxv = rp.bounds
        tip = 0 if rng.random() < 0.45 else 1
        H = float(rng.uniform(3.3, 4.6)) if tip == 0 else float(rng.uniform(3.6, 5.0))
        acik = float(rng.uniform(7.5, 9.6))
        n = max(1, int(round((maxv - minv) / acik)))
        acik = (maxv - minv) / n
        ca, sa = math.cos(aci), math.sin(aci)
        say = 0
        for k in range(n):
            v0 = minv + k * acik
            parca = rp.intersection(kutu_poly(minu - 1, v0, maxu + 1, v0 + acik))
            if parca.is_empty or parca.area < 0.4 * acik * 6:
                continue
            b = parca.bounds
            uc, vc = (b[0] + b[2]) / 2 - c0.x, v0 + acik / 2 - c0.y
            x = c0.x + uc * ca - vc * sa; y = c0.y + uc * sa + vc * ca
            ORN["sera"].append((x, -y, float(zemin(x, y)) - 0.15, -aci, b[2] - b[0], acik * 0.985,
                                H * float(rng.uniform(0.97, 1.03)), tip))
            say += 1
        return say

    # ------------------------------------------------------------------ binalar, seralar, Expo salonu
    bina, sera, salon, isik = Ag(), Ag(), Ag(), Ag()
    dislama = []
    for f in kat("bina"):
        p = f["properties"]; poly = shape(f["geometry"])
        h = float(p.get("yukseklik_m") or 6.0)
        r_ = float(rng.random())
        if p.get("building") == "greenhouse":
            sera_tunel(poly)
            dislama.append(poly.buffer(1.5))
        else:
            renk = int(rng.integers(0, 6))
            z1 = prizma(bina, poly, h, 0, 1, r_, renk)
            dislama.append(poly.buffer(2.5))
            # güneş enerjili su ısıtıcıları (Antalya çatılarının imzası): küçük panel + depo kutuları
            if p.get("building") in ("yes", "house", "apartments", "residential") and poly.area > 60 and z1:
                for _ in range(int(rng.integers(1, 4))):
                    pt = poly.buffer(-2.0)
                    if pt.is_empty:
                        break
                    minx, miny, maxx, maxy = pt.bounds
                    for _t in range(10):
                        x = rng.uniform(minx, maxx); y = rng.uniform(miny, maxy)
                        if pt.contains(Point(x, y)):
                            kutu(bina, x, y, z1, 2.0, 1.3, 0.9, float(rng.uniform(0, math.pi)), 2, r_)
                            break
    expo_hall = shape(kat("expo_salonu")[0]["geometry"])
    hall_aci = eksen_aci(expo_hall)
    z_cati = prizma(salon, expo_hall, 14.0, 0, 1, 0.5, cati_uv_aci=hall_aci)
    dislama.append(expo_hall.buffer(3))
    # elle çatı ışıklık bantları: uzun eksene paralel, 24 m arayla, 3,2 m geniş, 1,3 m yüksek üçgen prizma (cam)
    ca, sa = math.cos(hall_aci), math.sin(hall_aci)
    cx, cy = expo_hall.centroid.x, expo_hall.centroid.y
    ic = expo_hall.buffer(-6)
    bantlar = []
    for k in range(-4, 5):
        off = k * 24.0
        nx, ny = -sa, ca
        L = 400
        a_ = (cx + nx * off - ca * L, cy + ny * off - sa * L); b_ = (cx + nx * off + ca * L, cy + ny * off + sa * L)
        seg = LineString([a_, b_]).intersection(ic)
        for s_ in ([seg] if isinstance(seg, LineString) else list(getattr(seg, "geoms", []))):
            if s_.length < 20:
                continue
            c = np.array(s_.coords)
            p0, p1 = c[0], c[-1]
            w2 = 1.6
            q = [p0 + np.array([nx, ny]) * w2, p1 + np.array([nx, ny]) * w2, p1 - np.array([nx, ny]) * w2,
                 p0 - np.array([nx, ny]) * w2]
            ridge0 = p0; ridge1 = p1
            zt = z_cati + 1.3; zb = z_cati + 0.15
            v = W(np.array([q[0][0], q[1][0], q[2][0], q[3][0], ridge0[0], ridge1[0]]),
                  np.array([q[0][1], q[1][1], q[2][1], q[3][1], ridge0[1], ridge1[1]]),
                  np.array([zb, zb, zb, zb, zt, zt]))
            Ls = float(np.hypot(*(p1 - p0)))
            fcs = [[0, 1, 5], [0, 5, 4], [2, 3, 4], [2, 4, 5], [3, 0, 4], [1, 2, 5]]
            uv = np.array([[0, 0], [Ls, 0], [Ls, 1], [0, 0], [Ls, 1], [0, 1]] * 3, np.float32)
            isik.ekle(v, fcs, uv, 0, 0.0)
            bantlar.append([[float(p0[0]), float(-p0[1])], [float(p1[0]), float(-p1[1])]])
    log("Expo salonu çatı z", round(z_cati, 2), "ışıklık bandı", len(bantlar), "eksen (°)", round(math.degrees(hall_aci), 1))
    # B turu çatı ayrıntısı (t34a inişi): parapet (1,1 m, 0,35 m), bantların arasında HVAC üniteleri + fan kapakları.
    # mat 0 parapet/kaplama, 1 HVAC gövde, 2 fan ızgarası (koyu)
    cati = Ag()
    par = expo_hall.buffer(0.05, join_style=2).difference(expo_hall.buffer(-0.35, join_style=2))
    for pp in poligonlar(par):
        for hi, ring in enumerate([pp.exterior] + list(pp.interiors)):
            c = np.array(ring.coords)
            if LinearRing(c).is_ccw == (hi == 0):
                c = c[::-1]
            for i in range(len(c) - 1):
                a_, b_ = c[i], c[i + 1]
                v = W(np.array([a_[0], b_[0], b_[0], a_[0]]), np.array([a_[1], b_[1], b_[1], a_[1]]),
                      np.array([z_cati - 0.05, z_cati - 0.05, z_cati + 1.1, z_cati + 1.1]))
                L_ = float(np.hypot(*(b_ - a_)))
                cati.ekle(v, [[0, 1, 2], [0, 2, 3]], [[0, 0], [L_, 0], [L_, 1.15], [0, 0], [L_, 1.15], [0, 1.15]], 0, 0.0)
        tr = ucgenle(pp)
        if len(tr):
            v = W(tr[..., 0].ravel(), tr[..., 1].ravel(), np.full(tr.shape[0] * 3, z_cati + 1.1))
            cati.ekle(v, np.arange(len(v)).reshape(-1, 3), tr.reshape(-1, 2), 0, 0.0)
    ic2 = expo_hall.buffer(-9)
    hvac = 0
    for k in range(-4, 4):
        off = (k + 0.5) * 24.0
        for _ in range(int(rng.integers(2, 5))):
            t_ = float(rng.uniform(-150, 150))
            x = cx + (-sa) * off + ca * t_; y = cy + ca * off + sa * t_
            if not ic2.contains(Point(x, y)):
                continue
            L_, W2_ = float(rng.uniform(2.8, 4.2)), float(rng.uniform(1.8, 2.4))
            kutu(cati, x, y, z_cati, L_, W2_, float(rng.uniform(1.2, 1.7)), hall_aci, 1, 0.0)
            zt_ = z_cati + 1.7
            for j in range(int(rng.integers(1, 3))):
                kutu(cati, x + ca * (j - 0.5) * 1.1 * (L_ / 3.5), y + sa * (j - 0.5) * 1.1 * (L_ / 3.5), zt_ - 0.45,
                     1.0, 1.0, 0.5, hall_aci, 2, 0.0)
            hvac += 1
    log("çatı ayrıntısı: parapet + HVAC", hvac)

    # ------------------------------------------------------------------ yer döşemeleri: Expo alanı, otopark, peron
    zemin_ag = Ag()

    def doseme(poly, dz, mat, aci=0.0, rnd=0.0):
        for pp in poligonlar(poly.buffer(0)):
            tr = ucgenle(pp.segmentize(12.0))
            if not len(tr):
                continue
            x = tr[..., 0].ravel(); y = tr[..., 1].ravel()
            v = W(x, y, zemin(x, y) + dz)
            ca_, sa_ = math.cos(-aci), math.sin(-aci)
            uv = np.stack([x * ca_ - y * sa_, x * sa_ + y * ca_], -1)
            zemin_ag.ekle(v, np.arange(len(v)).reshape(-1, 3), uv, mat, rnd)

    expo_alani = shape(kat("expo_alani")[0]["geometry"])
    otopark = shape(kat("otopark")[0]["geometry"])
    ot_aci = eksen_aci(otopark)
    doseme(expo_alani.difference(expo_hall).difference(otopark), 0.06, 0)
    doseme(otopark, 0.10, 1, ot_aci)
    for f in kat("peron"):
        doseme(shape(f["geometry"]), 0.45, 2)
    dislama += [expo_alani.buffer(1)]

    # ------------------------------------------------------------------ yollar ve tramvay (şerit, uv: boyuna m, enine −1..1)
    yol_ag = Ag()
    sinif_dz = {"trunk": 0.34, "trunk_link": 0.30, "primary": 0.28, "secondary": 0.26, "tertiary": 0.24,
                "tertiary_link": 0.24, "unclassified": 0.20, "residential": 0.20, "service": 0.17, "track": 0.14,
                "footway": 0.12, "path": 0.12, "steps": 0.12}
    sinif_mat = {"trunk": 0, "trunk_link": 0, "primary": 0, "secondary": 0, "tertiary": 1, "tertiary_link": 1,
                 "unclassified": 1, "residential": 1, "service": 1, "track": 2, "footway": 3, "path": 2, "steps": 3}
    yol_cizgileri = []

    def serit(c, w, dz, mat, rnd=0.0):
        ls = LineString(c).segmentize(6.0)
        c = np.array(ls.coords)
        if len(c) < 2:
            return
        d = np.diff(c, axis=0); L = np.hypot(*d.T); d = d / np.maximum(L, 1e-6)[:, None]
        t = np.vstack([d[:1], d[:-1] + d[1:], d[-1:]]); t /= np.maximum(np.linalg.norm(t, axis=1), 1e-6)[:, None]
        n = np.stack([-t[:, 1], t[:, 0]], -1)
        cosh_ = np.clip(np.einsum("ij,ij->i", n, np.vstack([np.stack([-d[:, 1], d[:, 0]], -1)[:1],
                                                                  np.stack([-d[:, 1], d[:, 0]], -1)])), 0.5, 1)
        n = n / cosh_[:, None]
        s = np.concatenate([[0], np.cumsum(L)])
        sol = c + n * w / 2; sag = c - n * w / 2
        x = np.concatenate([sol[:, 0], sag[:, 0]]); y = np.concatenate([sol[:, 1], sag[:, 1]])
        v = W(x, y, zemin(x, y) + dz)
        m = len(c)
        f = []; uv = []
        for i in range(m - 1):
            # y güney çerçevesi → dünya'da yön ters; normal yukarı olsun diye sıra
            f += [[i, m + i, m + i + 1], [i, m + i + 1, i + 1]]
            uv += [[s[i], 1], [s[i], -1], [s[i + 1], -1], [s[i], 1], [s[i + 1], -1], [s[i + 1], 1]]
        yol_ag.ekle(v, f, uv, mat, rnd)

    for f in kat("yol"):
        p = f["properties"]; hw = p.get("highway", "residential")
        w = float(p.get("genislik_m") or 6.0)
        geom = shape(f["geometry"])
        for ls in ([geom] if isinstance(geom, LineString) else list(geom.geoms)):
            serit(np.array(ls.coords), w, sinif_dz.get(hw, 0.2), sinif_mat.get(hw, 1), float(rng.random()))
            yol_cizgileri.append((hw, w, np.array(ls.coords), p.get("ref")))
            dislama.append(ls.buffer(w / 2 + 1.0))
    tram_say = 0
    for f in kat("demiryolu"):
        p = f["properties"]
        if p.get("railway") not in ("tram", "light_rail"):
            continue
        geom = shape(f["geometry"])
        for ls in ([geom] if isinstance(geom, LineString) else list(geom.geoms)):
            serit(np.array(ls.coords), 6.6, 0.38, 4)
            dislama.append(ls.buffer(4.5)); tram_say += 1

    # ------------------------------------------------------------------ araçlar: otopark sıraları + yollar
    arac = Ag()
    PALET_SAY = 7

    def arac_ekle(x, y, aci, ag=arac):
        z = float(zemin(x, y)) + 0.1
        renk = int(rng.choice(PALET_SAY, p=[0.30, 0.22, 0.16, 0.14, 0.07, 0.06, 0.05]))
        L_ = rng.uniform(4.0, 4.8); W_ = rng.uniform(1.7, 1.85)
        kutu(ag, x, y, z + 0.28, L_, W_, 0.78, aci, 0, 0.0, renk)
        kutu(ag, x - 0.15 * L_ * math.cos(aci), y - 0.15 * L_ * math.sin(aci), z + 1.06, L_ * 0.52, W_ * 0.88, 0.5,
             aci, 1, 0.0, renk)

    ca_, sa_ = math.cos(ot_aci), math.sin(ot_aci)
    ic_ot = otopark.buffer(-2.5)
    minx, miny, maxx, maxy = otopark.bounds
    arac_say = 0
    cx0, cy0 = otopark.centroid.x, otopark.centroid.y
    for row in np.arange(-200, 200, 16.0):           # iki sıra + 6 m koridor = 16 m
        for side in (-2.6, 2.6):
            for col in np.arange(-200, 200, 2.6):
                x = cx0 + ca_ * col - sa_ * (row + side); y = cy0 + sa_ * col + ca_ * (row + side)
                if not ic_ot.contains(Point(x, y)) or rng.random() > 0.78:
                    continue
                arac_ekle(x + rng.normal(0, 0.12), y + rng.normal(0, 0.12), ot_aci + math.pi / 2 + rng.normal(0, 0.03))
                arac_say += 1
    yolda = 0
    for hw, w, c, ref in yol_cizgileri:
        if hw not in ("trunk", "trunk_link", "primary", "secondary", "tertiary", "residential", "unclassified"):
            continue
        ls = LineString(c)
        aralik = {"trunk": 22.0, "trunk_link": 45.0, "primary": 35.0, "secondary": 45.0, "tertiary": 60.0}.get(hw, 110.0)
        s = rng.uniform(0, aralik)
        while s < ls.length:
            pt = ls.interpolate(s); pt2 = ls.interpolate(min(ls.length, s + 1.0))
            aci = math.atan2(pt2.y - pt.y, pt2.x - pt.x)
            off = rng.uniform(-w / 2 + 1.3, w / 2 - 1.3) if w > 3 else 0
            x = pt.x - math.sin(aci) * off; y = pt.y + math.cos(aci) * off
            arac_ekle(x, y, aci); yolda += 1
            s += rng.exponential(aralik) + 6.0

    # ------------------------------------------------------------------ S2 sınıflaması (OSM çokgenlerinde ölçüldü):
    # sera L~162 doygunluk~15 nötr/soğuk; bina çatısı L~185 doygunluk~24 sıcak (R>B); bitki örtüsü L~76, R≥G>B
    yakin = np.asarray(Image.open(os.path.join(OUT, "s2_yakin.jpg")).convert("RGB"), np.float32)  # 3072², ±3072 m, 2 m
    YAR = 2900.0
    P4 = 4.0                                                                  # sınıflama ızgarası 4 m
    n4 = int(2 * YAR / P4)
    k0 = int((3072 - YAR) / 2)
    blok = yakin[k0:k0 + n4 * 2, k0:k0 + n4 * 2].reshape(n4, 2, n4, 2, 3).mean((1, 3))
    del yakin
    R_, G_, B_ = blok[..., 0], blok[..., 1], blok[..., 2]
    Lm = blok.mean(-1); doy = blok.max(-1) - blok.min(-1)
    from rasterio import features as rfeat
    from rasterio.transform import from_origin
    tf = from_origin(-YAR, -YAR, P4, -P4)                                     # x doğu, y güney (+): satır = (y+YAR)/4
    dis = unary_union(dislama)
    dis_r = rfeat.rasterize([(dis.buffer(2.0), 1)], out_shape=(n4, n4), transform=tf, dtype="uint8").astype(bool)
    sera_m = (Lm > 128) & (doy < 34) & (B_ >= 0.88 * (R_ + G_) / 2) & ~dis_r
    ev_m = (Lm > 135) & (doy >= 16) & (R_ > B_ + 10) & ~dis_r & ~sera_m
    bitki = np.clip((G_ - B_ - 12) / 25.0, 0, 1) * np.clip((118 - Lm) / 40.0, 0, 1) * (~dis_r)

    def acma(m, r=1):
        im = Image.fromarray((m * 255).astype(np.uint8))
        im = im.filter(ImageFilter.MinFilter(2 * r + 1)).filter(ImageFilter.MaxFilter(2 * r + 1))
        return np.asarray(im) > 127
    sera_m = acma(sera_m, 1)
    # --- dolgu seralar: bağlı bölgeler → döndürülmüş ızgarayla 40-60 × 28-40 m bloklara bölünür, 0,8 m aralık
    dsera = 0
    for geom, val in rfeat.shapes(sera_m.astype(np.uint8), mask=sera_m, transform=tf, connectivity=4):
        poly = shape(geom).simplify(3.0)
        if poly.area < 350:
            continue
        aci = eksen_aci(poly)
        ca_, sa_ = math.cos(aci), math.sin(aci)
        c0 = poly.centroid
        minx, miny, maxx, maxy = poly.bounds
        Rr = math.hypot(maxx - minx, maxy - miny)
        bw, bd = rng.uniform(40, 60), rng.uniform(28, 40)
        for i in np.arange(-Rr, Rr, bw):
            for j in np.arange(-Rr, Rr, bd):
                hucre = Polygon([(c0.x + ca_ * u - sa_ * v, c0.y + sa_ * u + ca_ * v)
                                 for u, v in ((i, j), (i + bw, j), (i + bw, j + bd), (i, j + bd))])
                parca = poly.intersection(hucre).buffer(-0.8)
                for pp in poligonlar(parca):
                    if pp.area < 140:
                        continue
                    sera_tunel(pp.simplify(1.0))
                    dsera += 1
    # --- dolgu evler: sıcak parlak çatı pikselleri, 12 m titreşimli ızgara; yön en yakın yol parçasından
    yol_nok = []; yol_yon = []
    for hw, w, c, ref in yol_cizgileri:
        d_ = np.diff(c, axis=0)
        yol_nok.append((c[:-1] + c[1:]) / 2); yol_yon.append(np.arctan2(d_[:, 1], d_[:, 0]))
    yol_nok = np.concatenate(yol_nok); yol_yon = np.concatenate(yol_yon)
    gx, gy = np.meshgrid(np.arange(-YAR, YAR, 12.0), np.arange(-YAR, YAR, 12.0))
    gx = (gx + rng.uniform(-3, 3, gx.shape)).ravel(); gy = (gy + rng.uniform(-3, 3, gy.shape)).ravel()
    ci = np.clip(((gx + YAR) / P4).astype(int), 0, n4 - 1); ri = np.clip(((gy + YAR) / P4).astype(int), 0, n4 - 1)
    # d3 kamerasına (KAMX, KAMY) uzak bölgelerde seyrelt: uzakta ≤ 2 px, bellek
    yak = np.clip(1.5 - np.hypot(gx - KAMX, gy - KAMY) / 2600.0, 0.22, 1.0)
    sec = ev_m[ri, ci] & (Lm[ri, ci] > 148) & (rng.random(len(gx)) < 0.75 * yak)
    gx, gy = gx[sec], gy[sec]
    dev = 0
    zz = zemin(gx, gy)
    for i in range(len(gx)):
        k = int(np.argmin((yol_nok[:, 0] - gx[i]) ** 2 + (yol_nok[:, 1] - gy[i]) ** 2))
        if math.hypot(*(yol_nok[k] - [gx[i], gy[i]])) < 150:
            aci = float(yol_yon[k]) + rng.normal(0, 0.06)
        else:
            aci = rng.uniform(0, math.pi)
        L_, W_ = rng.uniform(8, 14), rng.uniform(7, 11)
        kat_ = int(rng.choice([1, 2, 3, 4], p=[0.3, 0.38, 0.22, 0.10]))
        H_ = kat_ * 3.1 + 0.6
        renk = int(rng.integers(0, 6)); r_ = float(rng.random())
        kutu_bina(bina, gx[i], gy[i], float(zz[i]) - 0.4, L_, W_, H_ + 0.4, aci, renk, r_)
        if rng.random() < 0.65:
            kutu(bina, gx[i] + rng.uniform(-2, 2), gy[i] + rng.uniform(-2, 2), float(zz[i]) + H_, 2.0, 1.3, 0.9,
                 aci + rng.normal(0, 0.1), 2, r_)
        dev += 1
    # --- ağaçlar (B turu, örnekleme noktaları): tip 0 narenciye (yuvarlak, küçük), 1 çam, 2 geniş yapraklı küme,
    # 3 servi. Bahçe parselleri: 70 m'lik titreşimli tohumların Voronoi hücreleri; her parselin kendi sıra yönü
    # (semt yönü + 0/90°) ve aralığı (4,5–6,5 × 3,5–5 m). Parselin bitki ortalaması yüksekse sıralı bahçe, değilse
    # seyrek serpiştirme. Orman çokgenlerinde çam, parsel kenarlarında yer yer servi (rüzgâr kıran).
    orman = unary_union([shape(f["geometry"]) for f in kat("arazi")
                         if f["properties"].get("landuse") in ("forest",) or f["properties"].get("natural") in ("wood", "scrub")]
                        or [Polygon()])
    PAR = 70.0
    ns = int(2 * YAR / PAR) + 1
    tx = np.arange(ns) * PAR - YAR + PAR / 2
    SX, SY = np.meshgrid(tx, tx, indexing="ij")
    SX = SX + rng.uniform(-22, 22, SX.shape); SY = SY + rng.uniform(-22, 22, SY.shape)
    semt = rng.uniform(0, math.pi, (ns // 8 + 2, ns // 8 + 2))
    agac_say = {"bahce": 0, "serpme": 0, "servi": 0, "cam": 0}

    def bk_ornek(x, y):
        ci_ = np.clip(((x + YAR) / P4).astype(int), 0, n4 - 1); ri_ = np.clip(((y + YAR) / P4).astype(int), 0, n4 - 1)
        return bitki[ri_, ci_], dis_r[ri_, ci_]

    def agac_ekle(x, y, tip, r, H):
        zz_ = zemin(x, y)
        for k in range(len(x)):
            ORN["agac"].append((float(x[k]), -float(y[k]), float(zz_[k]) - 0.1, float(rng.uniform(0, 2 * math.pi)),
                                float(r[k]), float(r[k] * rng.uniform(0.85, 1.15)), float(H[k]), int(tip[k])))

    for i in range(ns):
        for j in range(ns):
            ox, oy = SX[i, j], SY[i, j]
            dk = math.hypot(ox - KAMX, oy - KAMY)
            th = semt[i // 8, j // 8] + (math.pi / 2 if rng.random() < 0.5 else 0.0) + rng.normal(0, 0.04)
            a_s, b_s = rng.uniform(4.5, 6.5), rng.uniform(3.5, 5.0)
            u = np.arange(-62, 62, a_s) + rng.uniform(0, a_s); v = np.arange(-62, 62, b_s) + rng.uniform(0, b_s)
            U, V = np.meshgrid(u, v); U = U.ravel(); V = V.ravel()
            ct, st_ = math.cos(th), math.sin(th)
            x = ox + U * ct - V * st_ + rng.normal(0, 0.25, U.shape); y = oy + U * st_ + V * ct + rng.normal(0, 0.25, U.shape)
            # Voronoi üyeliği: 5×5 komşu tohum içinde en yakın bu mu
            i0_, i1_ = max(0, i - 2), min(ns, i + 3); j0_, j1_ = max(0, j - 2), min(ns, j + 3)
            nx_ = SX[i0_:i1_, j0_:j1_].ravel(); ny_ = SY[i0_:i1_, j0_:j1_].ravel()
            dd = (x[:, None] - nx_[None]) ** 2 + (y[:, None] - ny_[None]) ** 2
            ben = (i - i0_) * (j1_ - j0_) + (j - j0_)
            uye = dd.argmin(1) == ben
            x, y = x[uye], y[uye]
            if len(x) == 0:
                continue
            bk, dr = bk_ornek(x, y)
            orm = shapely.contains_xy(orman, x, y) if not orman.is_empty else np.zeros(len(x), bool)
            yak_ = float(np.clip(1.6 - dk / 3000.0, 0.35, 1.0))
            yak_ *= float(np.clip((YAR - max(abs(ox), abs(oy))) / 700.0, 0.0, 1.0))   # ±2,9 km kenarında sönsün
            if bk.mean() > 0.30 and (bk > 0.3).mean() > 0.5 and orm.mean() < 0.5:
                sec_ = (bk > 0.12) & ~dr & (rng.random(len(x)) < yak_)
                xs_, ys_ = x[sec_], y[sec_]
                r = rng.uniform(1.4, 2.0, len(xs_)) * (0.55 * min(a_s, b_s * 1.3) / 2.6)
                H = r * rng.uniform(1.5, 1.9, len(xs_))
                tip = np.where(rng.random(len(xs_)) < 0.12, 2, 0)
                agac_ekle(xs_, ys_, tip, r, H); agac_say["bahce"] += len(xs_)
            else:
                sec_ = (rng.random(len(x)) < bk * 0.22 * yak_ * (1 + 2.0 * orm)) & ~dr
                xs_, ys_, om = x[sec_], y[sec_], orm[sec_]
                n_ = len(xs_)
                tip = np.where(om, 1, np.where(rng.random(n_) < 0.55, 2, 0))
                r = np.where(tip == 1, rng.uniform(1.6, 2.6, n_), np.where(tip == 2, rng.uniform(2.2, 4.2, n_), rng.uniform(1.5, 2.4, n_)))
                H = np.where(tip == 1, rng.uniform(7, 13, n_), r * rng.uniform(1.3, 1.9, n_))
                agac_ekle(xs_, ys_, tip, r, H); agac_say["serpme"] += int((tip != 1).sum()); agac_say["cam"] += int((tip == 1).sum())
            # rüzgâr kıran: parsellerin %18'inde bir kenar boyunca servi sırası (yüksek u sınırı)
            if rng.random() < 0.18 and len(x) > 20:
                uu = (x - ox) * ct + (y - oy) * st_
                kenar = uu > np.percentile(uu, 96)
                xs_, ys_ = x[kenar], y[kenar]
                _, dr2 = bk_ornek(xs_, ys_)
                xs_, ys_ = xs_[~dr2], ys_[~dr2]
                n_ = len(xs_)
                agac_ekle(xs_, ys_, np.full(n_, 3), rng.uniform(0.7, 1.1, n_), rng.uniform(8, 14, n_)); agac_say["servi"] += n_
    log("ağaç örnekleri", agac_say, "toplam", len(ORN["agac"]))

    # --- Antalya kenti (B turu): S2 geniş mozaiğinin (±30,72 km, 10 m) kentsel sınıfında prosedürel bloklar.
    # Sınıf: deniz değil, L 80–200, sıcak (R > B + 2), yeşil değil, 20 m'de yerel doku (std) > 9; Expo'dan > 3,4 km;
    # d3 kamerasından bakış konisi içinde (240° ± 45°, ≤ 27 km). Bloklar 28 m titreşimli ızgarada, semt yönlü;
    # yükseklik kent merkezine (36,889 K 30,705 D) yakınlıkla artar. Z: Blender'da araziye bırakılır (0 → yer_z).
    g_ = Image.open(os.path.join(OUT, "s2_genis.jpg")).convert("RGB")
    NG = 3072; PG = 20.0; YG = 30720.0
    ga = np.asarray(g_.resize((NG, NG), Image.BOX), np.float32); del g_
    su_g = np.asarray(Image.open(os.path.join(OUT, "deniz-maskesi-genis-30m.png")).convert("L").resize((NG, NG), Image.BILINEAR), np.float32) / 255
    Rg, Gg, Bg = ga[..., 0], ga[..., 1], ga[..., 2]
    Lg = ga.mean(-1)

    def kutu_ort(a, r):
        """(2r+1)² kutu ortalaması (kenar: yansıtma yok, kenar değeri)."""
        a = a.astype(np.float64)
        for ax in (0, 1):
            pd = np.pad(a, [(r + 1, r) if i == ax else (0, 0) for i in range(2)], mode="edge")
            c = np.cumsum(pd, axis=ax)
            a = (c[2 * r + 1:] - c[:-2 * r - 1]) / (2 * r + 1) if ax == 0 else (c[:, 2 * r + 1:] - c[:, :-2 * r - 1]) / (2 * r + 1)
        return a.astype(np.float32)
    std = np.sqrt(np.maximum(kutu_ort(Lg * Lg, 1) - kutu_ort(Lg, 1) ** 2, 0))
    kent_m = (su_g < 0.3) & (Lg > 80) & (Lg < 200) & (Rg > Bg + 2) & ((Gg - (Rg + Bg) / 2) < 8) & (std > 9)
    oran = kutu_ort(kent_m.astype(np.float32), 4)                      # ~180 m pencerede kentsel oran (orman yolları elensin)
    del ga, std
    gxk, gyk = np.meshgrid(np.arange(-YG + 300, YG - 300, 28.0), np.arange(-YG + 300, YG - 300, 28.0))
    gxk = (gxk + rng.uniform(-6, 6, gxk.shape)).ravel(); gyk = (gyk + rng.uniform(-6, 6, gyk.shape)).ravel()
    dxk, dyk = gxk - KAMX, -(gyk - KAMY)                                # doğu, kuzey
    bak = np.degrees(np.arctan2(dxk, dyk)) % 360
    mes = np.hypot(dxk, dyk)
    on = (np.abs(bak - 240) < 45) & (mes < 27000) & (np.hypot(gxk, gyk) > 3400)
    on &= ~((gxk > -3000) & (gxk < 300) & (gyk > 1000) & (gyk < 7600))     # havalimanı
    gxk, gyk = gxk[on], gyk[on]
    cik = np.clip(((gxk + YG) / PG).astype(int), 0, NG - 1); rik = np.clip(((gyk + YG) / PG).astype(int), 0, NG - 1)
    sec = (oran[rik, cik] > 0.40) & kent_m[rik, cik] & (su_g[rik, cik] < 0.2)
    sec &= rng.random(len(gxk)) < np.clip(oran[rik, cik] * 1.1, 0, 0.92)
    gxk, gyk = gxk[sec], gyk[sec]
    mx_, my_ = (30.705 - 30.8175767) * 88874.70, (36.9397171 - 36.889) * 111195.08
    merk = np.hypot(gxk - mx_, gyk - my_)
    Hmed = np.where(merk < 5500, 21.0, np.where(merk < 9000, 14.0, 8.0))
    Hk = np.clip(Hmed * np.exp(rng.normal(0, 0.45, len(gxk))), 4.0, 62.0)
    semt_k = rng.uniform(0, math.pi, (80, 80))
    th = semt_k[np.clip(((gxk + YG) / 800).astype(int), 0, 79), np.clip(((gyk + YG) / 800).astype(int), 0, 79)]
    th = th + np.where(rng.random(len(gxk)) < 0.5, math.pi / 2, 0.0) + rng.normal(0, 0.03, len(gxk))
    Lb = rng.uniform(13, 24, len(gxk)); Wb = rng.uniform(11, 17, len(gxk))
    tipk = (rng.random(len(gxk)) < 0.3).astype(int)
    for k in range(len(gxk)):
        ORN["kent"].append((float(gxk[k]), -float(gyk[k]), 0.0, -float(th[k]), float(Lb[k]), float(Wb[k]), float(Hk[k]), int(tipk[k])))
    log("kent blokları", len(ORN["kent"]), "yükseklik medyan", round(float(np.median(Hk)), 1) if len(Hk) else 0)
    log(f"dolgu sera {dsera} (tünel örneği {len(ORN['sera'])}), dolgu ev {dev}, araç otopark {arac_say} + yol {yolda}, tramvay şeridi {tram_say}")

    say = {}
    for ad, ag in (("bina", bina), ("salon", salon), ("isiklik", isik), ("zemin", zemin_ag),
                   ("yol", yol_ag), ("arac", arac), ("cati", cati)):
        say[ad] = ag.kaydet(os.path.join(OUT, f"ag_{ad}.npz"))
    for ad, lst in ORN.items():
        A = np.asarray(lst, np.float64).reshape(-1, 8)
        np.savez_compressed(os.path.join(OUT, f"orn_{ad}.npz"), poz=A[:, :3].astype(np.float32), aci=A[:, 3].astype(np.float32),
                            olcek=A[:, 4:7].astype(np.float32), tip=A[:, 7].astype(np.int32))
        say["orn_" + ad] = len(A)
    # dış: çapalar ve kamera için önemli noktalar
    d400 = [c for hw, w, c, ref in yol_cizgileri if ref == "D400"]
    bilgi = {"ucgen": say, "salon_cati_z": z_cati, "salon_eksen_deg": math.degrees(hall_aci),
             "salon_merkez": [cx, -cy], "isiklik_bantlari": bantlar,
             "otopark_merkez": [otopark.centroid.x, -otopark.centroid.y],
             "expo_alani_merkez": [expo_alani.centroid.x, -expo_alani.centroid.y],
             "d400": [[[float(x), float(-y)] for x, y in c] for c in d400],
             "agac": len(ORN["agac"]), "sera_ornek": len(ORN["sera"]), "kent_blok": len(ORN["kent"]),
             "arac": arac_say + yolda, "dolgu_sera": dsera, "dolgu_ev": dev, "kamera_d3_yerel": [KAMX, KAMY]}
    json.dump(bilgi, open(os.path.join(OUT, "osm_yakin.json"), "w"), indent=1)
    log("OSM ağları", say)


def kutu_bina(ag, x, y, z, L, W_, H, aci, renk, rnd):
    """Duvar (mat 0, uv: çevre m / yükseklik m) + çatı (mat 1) ayrı kutu ev."""
    ca, sa = math.cos(aci), math.sin(aci)
    k = np.array([[-1, -1], [1, -1], [1, 1], [-1, 1]], float) * [L / 2, W_ / 2]
    px = x + k[:, 0] * ca - k[:, 1] * sa; py = y + k[:, 0] * sa + k[:, 1] * ca
    v = np.stack([np.concatenate([px, px]), -np.concatenate([py, py]), np.concatenate([np.full(4, z), np.full(4, z + H)])], -1)
    duv = [[0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7]]
    s_ = [0, L, L + W_, 2 * L + W_, 2 * (L + W_)]
    uv = []
    for e in range(4):
        uv += [[s_[e], 0], [s_[e + 1], 0], [s_[e + 1], H], [s_[e], 0], [s_[e + 1], H], [s_[e], H]]
    ag.ekle(v, duv, uv, 0, rnd, renk)
    ag.ekle(v, [[4, 6, 5], [4, 7, 6]], np.zeros((2, 3, 2)), 1, rnd, renk)


def kutu(ag, x, y, z, L, W_, H, aci, mat, rnd, renk=0):
    """x, y expo-yerel (y güney), aci expo-yerel çerçevesinde; taban z (dünya). Alt yüz yok."""
    ca, sa = math.cos(aci), math.sin(aci)
    k = np.array([[-1, -1], [1, -1], [1, 1], [-1, 1]], float) * [L / 2, W_ / 2]
    px = x + k[:, 0] * ca - k[:, 1] * sa; py = y + k[:, 0] * sa + k[:, 1] * ca
    v = np.stack([np.concatenate([px, px]), -np.concatenate([py, py]), np.concatenate([np.full(4, z), np.full(4, z + H)])], -1)
    # dünya çerçevesinde (Y = −y) halka saat yönünde → yüz sıraları buna göre (dışa dönük normaller)
    f = [[4, 6, 5], [4, 7, 6], [0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7]]
    ag.ekle(v, f, np.zeros((len(f), 3, 2)), mat, rnd, renk)


def ico1():
    t = (1 + 5 ** 0.5) / 2
    v = np.array([[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
                  [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]], float)
    v /= np.linalg.norm(v, axis=1)[:, None]
    f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6],
         [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7],
         [9, 8, 1]]
    vl = [tuple(x) for x in v]; cache = {}
    def orta(a, b):
        k = (min(a, b), max(a, b))
        if k not in cache:
            m = (np.array(vl[a]) + np.array(vl[b])) / 2; m /= np.linalg.norm(m); vl.append(tuple(m)); cache[k] = len(vl) - 1
        return cache[k]
    f2 = []
    for a, b, c in f:
        ab, bc, ca = orta(a, b), orta(b, c), orta(c, a)
        f2 += [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]]
    global ICO_F
    ICO_F = np.array(f2, np.int32)
    return np.array(vl)


ICO_F = None
ico1()
# ağaç tacı: ikosahedron (12 köşe, 20 üçgen) — bellek: ~40 bin ağaç × 12 köşe
_t = (1 + 5 ** 0.5) / 2
ICO0_V = np.array([[-1, _t, 0], [1, _t, 0], [-1, -_t, 0], [1, -_t, 0], [0, -1, _t], [0, 1, _t], [0, -1, -_t], [0, 1, -_t],
                   [_t, 0, -1], [_t, 0, 1], [-_t, 0, -1], [-_t, 0, 1]], float)
ICO0_V /= np.linalg.norm(ICO0_V, axis=1)[:, None]
ICO0_F = np.array([[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2],
                   [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11],
                   [6, 2, 10], [8, 6, 7], [9, 8, 1]], np.int32)
