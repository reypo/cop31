"""S2 B turu ölçümleri (sistem Python'u, numpy + Pillow): malzeme maskesiyle en parlak kanal (kırpma denetimi),
metin bandı altındaki en parlak %5 (dikey + yatay kırpım), dikiş farkı (ΔE00 + ortalama mutlak fark /255),
kapak renk sadakati (kâğıt / mavi daire ΔE00, DOM kapağa göre), meşe tonu.

  python -X utf8 -P scripts/blender/s2/olc.py maske <render.png> <maske.png>
  python -X utf8 -P scripts/blender/s2/olc.py bant <render.png> ust|alt
  python -X utf8 -P scripts/blender/s2/olc.py dikis <a.png> <b.png>
  python -X utf8 -P scripts/blender/s2/olc.py kapak <render.png> [<maske.png>]
"""
import sys, os, json
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import renkbilim as RB

MASKE = {"beyaz_boya": (255, 0, 0), "sutun_yuz": (0, 255, 0), "kapak": (0, 0, 255), "mese_banko": (255, 255, 0),
         "laminat": (255, 0, 255), "hali": (0, 255, 255), "mese": (128, 0, 0), "komsu_duvar": (0, 128, 0), "isik_kutu": (0, 0, 128)}
RECT = (606, 460, 1314, 1460)
DOM = "D:/soft/cop31-varlik/s2/doku/kapak-dom.png"


def maske_oku(yol, H):
    m = np.round(RB.png_oku(yol) * 255).astype(int)
    m = np.where(m > 220, 255, np.where(m > 150, 128, 0))   # Workbench sRGB: 1,0 → 254, 0,5 → 187
    if m.shape[0] != H:   # en yakın komşu
        i = (np.arange(H) * m.shape[0] // H)
        m = m[i][:, i]
    return m


def asindir(b, n=2):
    for _ in range(n):
        b = b & np.roll(b, 1, 0) & np.roll(b, -1, 0) & np.roll(b, 1, 1) & np.roll(b, -1, 1)
    return b


def maske_stat(render, maske):
    a = RB.png_oku(render)
    m = maske_oku(maske, a.shape[0])
    out = {}
    for ad, rk in MASKE.items():
        b = asindir(np.all(m == rk, -1), 2)
        if b.sum() < 50:
            continue
        p = a[b]
        mx = p.max(1)
        out[ad] = {"piksel": int(b.sum()), "ort": RB.hex_(p.mean(0)), "en_parlak_kanal_p50": round(float(np.percentile(mx, 50)), 3),
                   "p99": round(float(np.percentile(mx, 99)), 3), "p99_9": round(float(np.percentile(mx, 99.9)), 3),
                   "maks": round(float(mx.max()), 3), "oran_092_ustu": round(float((mx > 0.92).mean()), 5),
                   "oran_kirpik": round(float((mx > 0.998).mean()), 5)}
    return out


def bant(render, yer):
    """Dikey: x 420–1500, üst bant y 0–%28 ya da alt bant y %68–100 (A turu tanımı). Yatay: y 420–1500, sağ %38
    (x 1191–1920, W'nin bandı). En parlak %5 ortalaması, p95, maks."""
    a = RB.png_oku(render)
    H = a.shape[0]
    k = H / 1920
    bolge = {"dikey": a[(0 if yer == "ust" else round(H * 0.68)):(round(H * 0.28) if yer == "ust" else H), round(420 * k):round(1500 * k)],
             "yatay": a[round(420 * k):round(1500 * k), round(1191 * k):]}
    out = {}
    for ad, b in bolge.items():
        p = b.reshape(-1, 3)
        L = 0.2126 * RB.lin(p[:, 0]) + 0.7152 * RB.lin(p[:, 1]) + 0.0722 * RB.lin(p[:, 2])
        s = np.argsort(L)
        n5 = max(1, len(L) // 20)
        out[ad] = {"en_parlak_5_ort": RB.hex_(p[s[-n5:]].mean(0)), "p95": RB.hex_(p[s[int(len(L) * 0.95)]]),
                   "maks": RB.hex_(p[s[-1]]), "en_koyu_5_ort": RB.hex_(p[s[:n5]].mean(0)), "ort_luminans": round(float(L.mean()), 4)}
    return out


def dikis(a_yol, b_yol):
    a, b = RB.png_oku(a_yol), RB.png_oku(b_yol)
    if a.shape != b.shape:
        return {"hata": f"boyut {a.shape} ≠ {b.shape}"}
    st = slice(None, None, 2)   # 960² örnek (hız)
    d = RB.de00(a[st, st], b[st, st])
    return {"de00_ort": round(float(d.mean()), 3), "de00_p95": round(float(np.percentile(d, 95)), 3),
            "ort_mutlak_fark_255": round(float(np.abs(a - b).mean() * 255), 3), "maks_fark_255": round(float(np.abs(a - b).max() * 255), 1)}


def kapak(render, maske=None):
    """Son karede kapak dikdörtgeni ↔ DOM kapak (aynı uv'de örneklenmiş). Kâğıt: DOM'da beyaz (min kanal > 0,97) ve
    düz bölge; mavi: DOM'da mavi daire gövdesi. Ortalama renkler arası ΔE00 + piksel başına ΔE00 medyanı."""
    a = RB.png_oku(render)
    x0, y0, x1, y1 = RECT
    r = a[y0 + 6:y1 - 6, x0 + 6:x1 - 6]
    c = RB.png_oku(DOM)
    H, W = r.shape[:2]
    yi = np.clip(((np.arange(H) + 6 + 0.5) / (y1 - y0) * c.shape[0]).astype(int), 0, c.shape[0] - 1)
    xi = np.clip(((np.arange(W) + 6 + 0.5) / (x1 - x0) * c.shape[1]).astype(int), 0, c.shape[1] - 1)
    cs = c[yi][:, xi]
    duz = RB.kutu_bulanik(cs, 4)
    duz_fark = np.abs(cs - duz).max(-1)
    kagit = (cs.min(-1) > 0.97) & (duz_fark < 0.01)
    mavi = (cs[..., 2] > 0.55) & (cs[..., 0] < 0.15) & (cs[..., 1] > 0.25) & (cs[..., 1] < 0.55) & (duz_fark < 0.03)
    out = {"kagit_piksel": int(kagit.sum()), "mavi_piksel": int(mavi.sum())}
    hb = RB.hex2("#F4F2F0")
    for ad, b in (("kagit", kagit), ("mavi", mavi)):
        if b.sum() == 0:
            continue
        rm, cm = r[b].mean(0), cs[b].mean(0)
        out[ad] = {"render_ort": RB.hex_(rm), "dom_ort": RB.hex_(cm), "de00_ort_renk": round(float(RB.de00(rm, cm)), 2),
                   "de00_piksel_medyan": round(float(np.median(RB.de00(r[b], cs[b]))), 2)}
        if ad == "kagit":
            out[ad]["de00_F4F2F0"] = round(float(RB.de00(rm, hb)), 2)
            out[ad]["ECE8E4_ustu"] = bool(np.all(rm >= RB.hex2("#ECE8E4") - 1e-9))
    out["tum_kapak_de00_medyan"] = round(float(np.median(RB.de00(r, cs))), 2)
    if maske:
        m = maske_oku(maske, a.shape[0])
        b = asindir(np.all(m == MASKE["mese_banko"], -1), 3)
        if b.sum() > 50:
            mm = a[b].mean(0)
            out["mese_banko"] = {"piksel": int(b.sum()), "ort": RB.hex_(mm), "de00_C9A47A": round(float(RB.de00(mm, RB.hex2("#C9A47A"))), 2)}
    return out


if __name__ == "__main__":
    is_ = sys.argv[1]
    if is_ == "maske":
        r = maske_stat(sys.argv[2], sys.argv[3])
    elif is_ == "bant":
        r = bant(sys.argv[2], sys.argv[3])
    elif is_ == "dikis":
        r = dikis(sys.argv[2], sys.argv[3])
    elif is_ == "kapak":
        r = kapak(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
    print(json.dumps(r, ensure_ascii=False))
