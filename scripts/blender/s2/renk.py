"""AgX ön telafisi (B kararı 4: kapak render'da DOM kapağın tonlarında; kâğıt ≥ #ECE8E4, hedef #F4F2F0; mavi ΔE00 ≤ 8).
Blender'ın OCIO yapılandırmasıyla sahne görünümünü (AgX + "AgX - Punchy", pozlama +0,3 EV) ileri/ters uygular.
Kapak düz yüzey olduğundan gölgelemesi albedoya doğrusal: L = E·a + S. Son karede iki kalibrasyon render'ı
(düz beyaz a = 1 → E + S, düz siyah a = 0 → S) her kapak pikseli için E ve S'yi verir; DOM kapak rengi c için
hedef görüntü t = enc(lin(c)·lin(#F4F2F0)) (kâğıt beyazı → #F4F2F0), gereken albedo a = (ters(t) − S) / E.

  blender -b --factory-startup -P scripts/blender/s2/renk.py -- dogrula
  blender -b --factory-startup -P scripts/blender/s2/renk.py -- kapak --beyaz W.png --siyah K.png [--cikis …]
  blender -b --factory-startup -P scripts/blender/s2/renk.py -- olc --render R.png [--maske M.png] [--json çıktı.json]
"""
import sys, os, json, argparse
import numpy as np
import bpy
import PyOpenColorIO as OCIO

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import renkbilim as RB

DOKU = "D:/soft/cop31-varlik/s2/doku/"
RECT = (606, 460, 1314, 1460)          # son karede kapak (master px): x0, y0, x1, y1
HEDEF_BEYAZ = "#F4F2F0"


def isleyici(exposure=0.3, look="AgX - Punchy", view="AgX"):
    cfgp = os.path.join(os.path.dirname(bpy.app.binary_path), "5.2", "datafiles", "colormanagement", "config.ocio")
    cfg = OCIO.Config.CreateFromFile(cfgp)
    vp = OCIO.LegacyViewingPipeline()
    vp.setDisplayViewTransform(OCIO.DisplayViewTransform(src="Linear Rec.709", display="sRGB", view=view))
    if look:
        vp.setLooksOverrideEnabled(True)
        vp.setLooksOverride(look)
    m = 2.0 ** exposure
    mt = OCIO.MatrixTransform()
    mt.setMatrix([m, 0, 0, 0, 0, m, 0, 0, 0, 0, m, 0, 0, 0, 0, 1])
    vp.setLinearCC(mt)
    p = vp.getProcessor(cfg)
    ileri = p.getDefaultCPUProcessor()
    try:
        ters = cfg.getProcessor(p.createGroupTransform(), OCIO.TRANSFORM_DIR_INVERSE).getDefaultCPUProcessor()
    except Exception as e:
        print("[RENK] ters işleyici yok:", e)
        ters = None
    return ileri, ters


ILERI, TERS = isleyici()


def uygula(proc, a):
    a = np.ascontiguousarray(a, dtype=np.float32).reshape(-1, 3).copy()
    proc.applyRGB(a)
    return a.astype(np.float64)


def ileri(L):
    sh = np.shape(L)
    return uygula(ILERI, L).reshape(sh)


def ters(d, yineleme=4):
    """Görüntü (sRGB 0..1) → sahne doğrusal: OCIO ters işleyici; ardından sönümlü düzeltme, piksel başına yalnız hata
    azalırsa kabul (koyu doygun renklerde oran yinelemesi ıraksıyor: AgX taban kelepçesi + kanal karışımı)."""
    sh = np.shape(d)
    d = np.asarray(d, dtype=np.float64).reshape(-1, 3)
    L = uygula(TERS, d) if TERS is not None else RB.lin(d)
    L = np.clip(L, 1e-6, None)
    hata = np.abs(uygula(ILERI, L) - d).max(1)
    for _ in range(yineleme):
        f = uygula(ILERI, L)
        oran = np.clip(RB.lin(d) + 1e-4, 1e-6, None) / np.clip(RB.lin(f) + 1e-4, 1e-6, None)
        L2 = np.clip(L * np.sqrt(np.clip(oran, 0.5, 2.0)), 1e-6, 64)
        h2 = np.abs(uygula(ILERI, L2) - d).max(1)
        iyi = h2 < hata
        L[iyi] = L2[iyi]
        hata[iyi] = h2[iyi]
    return L.reshape(sh)


def dogrula():
    """OCIO ileri ↔ Blender'ın kendi görünüm dönüşümü (save_render): rampa + renkli yamalar."""
    sc = bpy.context.scene
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Punchy"
    sc.view_settings.exposure = 0.3
    sc.render.dither_intensity = 0.0
    n = 64
    v = np.geomspace(0.002, 8.0, n)
    pal = np.array([[1, 1, 1], [0.009, 0.11, 0.38], [0.58, 0.37, 0.19], [0.9, 0.2, 0.05], [0.1, 0.5, 0.1]])
    L = (v[:, None, None] * pal[None, :, :]).reshape(-1, 3)
    img = bpy.data.images.new("t", len(L), 1, float_buffer=True)
    px = np.ones((1, len(L), 4), np.float32)
    px[0, :, :3] = L
    img.pixels.foreach_set(px.ravel())
    yol = os.path.join(os.environ.get("TEMP", "."), "renk_dogrula.png")
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_depth = "16"
    img.save_render(yol, scene=sc)
    b = RB.png_oku(yol)[0]
    o = ileri(L)
    fark = np.abs(b - o).max()
    geri = ters(o)
    print(json.dumps({"ocio_blender_maks_fark": round(float(fark), 5), "ters_ileri_bagil_hata_maks": round(float(np.abs(geri / L - 1)[o.max(1) < 0.985].max()), 4),
                      "beyaz_1.0": RB.hex_(ileri(np.array([1.0, 1, 1]))), "ters_F4F2F0": ters(RB.hex2("#F4F2F0")).round(3).tolist(),
                      "ters_C9A47A": ters(RB.hex2("#C9A47A")).round(4).tolist()}))


def kapak(beyaz, siyah, doku, cikis, hedef_beyaz=HEDEF_BEYAZ, ic=8, r=10):
    x0, y0, x1, y1 = RECT
    Wb, Kb = RB.png_oku(beyaz), RB.png_oku(siyah)
    Lw = ters(Wb[y0 + ic:y1 - ic, x0 + ic:x1 - ic])
    Lk = ters(Kb[y0 + ic:y1 - ic, x0 + ic:x1 - ic])
    E = RB.kutu_bulanik(np.clip(Lw - Lk, 1e-4, None), r)
    S = RB.kutu_bulanik(np.clip(Lk, 0, None), r)
    c = RB.png_oku(doku)
    H, W = c.shape[:2]
    E_t = RB.bilinear(E, H, W)
    S_t = RB.bilinear(S, H, W)
    hb = RB.lin(RB.hex2(hedef_beyaz))
    t = RB.enc(RB.lin(c) * hb)
    Lt = ters(t)
    alb = (Lt - S_t) / E_t
    ust = float((alb > 1).mean()); alt = float((alb < 0).mean())
    # ulaşılamayan koyu tonlar (hedef < parlama perdesi S): tüm kanallara eşit miktar eklenir → ton korunur, siyah kalkar
    eksi = np.clip(-alb.min(-1, keepdims=True), 0, None)
    alb = np.clip(alb + eksi, 0, 1)
    RB.png16_yaz(cikis, RB.enc(alb))
    oz = {"cikis": cikis, "E_ort": E.reshape(-1, 3).mean(0).round(3).tolist(), "E_min": E.reshape(-1, 3).min(0).round(3).tolist(),
          "E_maks": E.reshape(-1, 3).max(0).round(3).tolist(), "S_ort": S.reshape(-1, 3).mean(0).round(4).tolist(),
          "albedo_1_ustu_oran": round(ust, 4), "albedo_0_alti_oran": round(alt, 4),
          "kagit_albedo": RB.enc(np.clip((ters(RB.hex2(hedef_beyaz)) - S.reshape(-1, 3).mean(0)) / E.reshape(-1, 3).mean(0), 0, 9)).round(3).tolist(),
          "mese_hedef_albedo_dogrusal": np.clip((ters(RB.hex2("#C9A47A")) - S.reshape(-1, 3).mean(0)) / E.reshape(-1, 3).mean(0), 0, 9).round(4).tolist()}
    print("[KAPAK]", json.dumps(oz))
    return oz


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("is_", choices=["dogrula", "kapak"])
    p.add_argument("--beyaz")
    p.add_argument("--siyah")
    p.add_argument("--doku", default=DOKU + "kapak-dom.png")
    p.add_argument("--cikis", default=DOKU + "kapak-dom-komp.png")
    x = p.parse_args(argv)
    if x.is_ == "dogrula":
        dogrula()
    else:
        kapak(x.beyaz, x.siyah, x.doku, x.cikis)
