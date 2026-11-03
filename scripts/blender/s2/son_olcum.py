"""S2 son render ölçümleri (B turu; C turu: plaka, t34b_k0000; E turu: §12.6 dikiş listesi, t78[son] ↔ eski t56[71] / p8;
F-B: son kare dizinleri render-son/<klip>.json'dan, t34 kesmesi t34b.json t34_ofset'ten (35 ↔ 36)) → D:/soft/cop31-varlik/render-son/_onizleme/s2-olcum.json (+ poster JPG'leri).
Kare süreleri (s2-son.jsonl, medyan), VRAM (nvidia-smi kart toplamı, s2-vram-<klip>.csv), dikişler (ΔE00 + ort. mutlak
fark /255), döngü kapanışı (119→0 ↔ ardışık kare farkı), metin bandı en parlak %5 (p4 üst, p5 alt; dikey + yatay),
malzeme maskesiyle en parlak kanal (p4, p5), kapak renk sadakati (t56 son kare, p6), parlama (t34b).

  python -X utf8 -P scripts/blender/s2/son_olcum.py [--maske_dizin DIZIN]
"""
import sys, os, json, glob, statistics, argparse
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import renkbilim as RB
import olc

R = "D:/soft/cop31-varlik/render-son"
O = R + "/_onizleme"
SONRA = ""   # --sonra: bu ISO zamandan önce biten koşular (s2-son.jsonl) yok sayılır


def k(klip, n):
    return f"{R}/{klip}/k_{n:04d}.png"


def son(klip, varsayilan):
    """F turu: son kare dizini render-son/<klip>.json'dan (kare − 1); yoksa E değeri."""
    try:
        return json.load(open(f"{R}/{klip}.json", encoding="utf-8"))["kare"] - 1
    except Exception:
        return varsayilan


def sureler():
    """Kare süreleri: jsonl'de kare listesi varsa ondan; yoksa (B turunun ilk dört klibi: Sure.ek 'kareler' alanını
    eziyordu) PNG yazma zamanlarının farkından (render + yazma; ilk kare hariç)."""
    d = {}
    yol = O + "/s2-son.jsonl"
    if not os.path.exists(yol):
        return d
    enuzun = {}
    for satir in open(yol, encoding="utf-8"):   # klip başına en çok kareli koşu (yama koşuları: t45 56–59, p6)
        j = json.loads(satir)
        if SONRA and j.get("zaman", "") < SONRA:   # E: önceki turların koşuları dışarıda (D'de t56 72 kareydi)
            continue
        if j.get("kare_say", 0) >= enuzun.get(j["klip"], {}).get("kare_say", 0):
            enuzun[j["klip"]] = j
    for kl, j in enuzun.items():
        kar = j.get("kareler")
        if isinstance(kar, list) and kar and isinstance(kar[0], dict):
            rs = [x["render_sn"] for x in kar]
            kaynak = "render_sn"
        else:
            dz = f"{R}/{kl}/ham" if kl == "t34b" else f"{R}/{kl}"
            mt = sorted(os.path.getmtime(f) for f in glob.glob(dz + "/k_*.png"))
            rs = [round(b - a, 2) for a, b in zip(mt, mt[1:])] or [j.get("ilk_kare_sn") or 0]
            kaynak = "png_zaman_farki"
        d[kl] = {"kare": j.get("kare_say"), "medyan_sn": round(statistics.median(rs), 2), "ilk_kare_sn": j.get("ilk_kare_sn"),
                 "ort_sn_ilk_haric": j.get("ort_sn_ilk_haric"), "maks_sn": max(rs), "render_toplam_sn": round(sum(rs) + (0 if kaynak == "render_sn" else (j.get("ilk_kare_sn") or 0)), 1),
                 "kilit_dahil_toplam_sn": j["toplam_sn"], "bitis": j["zaman"], "kaynak": kaynak}
    return d


def vram():
    """Kart toplamı (nvidia-smi; WDDM'de süreç başı yok). Pencere: klibin kare render+yazma toplamı kadar, bitiş zamanından
    geriye (kilit beklemesi ve başka ajanın işi dışarıda kalsın)."""
    import datetime as dt
    pen = {}
    yol = O + "/s2-son.jsonl"
    if os.path.exists(yol):
        enuzun = {}
        for satir in open(yol, encoding="utf-8"):
            j = json.loads(satir)
            if SONRA and j.get("zaman", "") < SONRA:
                continue
            if j.get("kare_say", 0) >= enuzun.get(j["klip"], {}).get("kare_say", 0):
                enuzun[j["klip"]] = j
        for j in enuzun.values():
            bit = dt.datetime.strptime(j["zaman"], "%Y-%m-%dT%H:%M:%S")
            kar = j.get("kareler")
            if isinstance(kar, list) and kar and isinstance(kar[0], dict):
                sure = sum(x["render_sn"] + x["yazma_sn"] for x in kar)
            else:
                sure = (j.get("ilk_kare_sn") or 0) + (j.get("ort_sn_ilk_haric") or 0) * max(0, j.get("kare_say", 1) - 1)
            pen[j["klip"]] = (bit - dt.timedelta(seconds=sure + 3), bit + dt.timedelta(seconds=1))
    d = {}
    for f in glob.glob(O + "/s2-vram-*.csv"):
        ad = os.path.basename(f)[8:-4]
        m = []
        for s in open(f, encoding="utf-8", errors="ignore"):
            p = s.split(",")
            if len(p) >= 2 and "MiB" in p[1]:
                try:
                    t = dt.datetime.strptime(p[0].strip()[:19], "%Y/%m/%d %H:%M:%S")
                except ValueError:
                    continue
                if ad in pen and not (pen[ad][0] <= t <= pen[ad][1]):
                    continue
                m.append(int(p[1].strip().split()[0]))
        if m:
            d[ad] = {"kart_toplam_tepe_MiB": max(m), "kart_toplam_medyan_MiB": int(statistics.median(m)),
                     "kart_toplam_min_MiB": min(m), "ornek": len(m)}
    return d


def dongu(klip, n=120):
    kap = olc.dikis(k(klip, n - 1), k(klip, 0))
    ard = [olc.dikis(k(klip, i), k(klip, i + 1)) for i in (0, 59, 118)]
    return {"kapanis_119_0": kap, "ardisik_0_1": ard[0], "ardisik_59_60": ard[1], "ardisik_118_119": ard[2]}


def plaka_kars(t_yol, p_yol):
    """C turu (brief §11.1 S2-C 2) / E turu (§12.6): broşürsüz plaka (p8, eski p6) ↔ broşürlü son kare (E: t78[65];
    C/D: t56[71]) broşür dikdörtgeni (606–1314 × 460–1460) dışında, tam çözünürlük; dikdörtgene uzaklığa göre (yığının
    kâğıt taşması + gölgesi yalnız yakın bantta) ve dikdörtgen içi renk."""
    t, p = RB.png_oku(t_yol), RB.png_oku(p_yol)
    x0, y0, x1, y1 = olc.RECT
    yy, xx = np.mgrid[0:t.shape[0], 0:t.shape[1]]
    ic = (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)
    uz = np.hypot(np.maximum(np.maximum(x0 - xx, xx - (x1 - 1)), 0), np.maximum(np.maximum(y0 - yy, yy - (y1 - 1)), 0))
    f = np.abs(t - p).max(-1) * 255

    def oz(b):
        d = np.concatenate([RB.de00(t[b][i:i + 400000], p[b][i:i + 400000]) for i in range(0, int(b.sum()), 400000)])
        return {"piksel": int(b.sum()), "de00_ort": round(float(d.mean()), 4), "de00_maks": round(float(d.max()), 2),
                "maks_fark_255": round(float(f[b].max()), 2), "piksel_2_255_ustu": int((f[b] > 2).sum())}
    pi = p[ic]
    return {"dis_tum": oz(~ic), "dis_0_12px": oz(~ic & (uz <= 12)), "dis_12_45px": oz(~ic & (uz > 12) & (uz <= 45)),
            "dis_45px_ustu": oz(~ic & (uz > 45)),
            "son_kare_dis_kagit_piksel(min kanal > 0,80)": int((~ic & (t.min(-1) > 0.80)).sum()),
            "plaka_ic_ort": RB.hex_(pi.mean(0)), "plaka_ic_p1": RB.hex_(np.percentile(pi, 1, 0)), "plaka_ic_p99": RB.hex_(np.percentile(pi, 99, 0)),
            "plaka_ic_kagit_oran(min kanal > 0,80)": round(float((pi.min(1) > 0.80).mean()), 6)}


def tam_de00(a_yol, b_yol):
    """Tam çözünürlük ΔE00 (0,05 eşiği için; olc.dikis 2'de 1 örnekler)."""
    a, b = RB.png_oku(a_yol), RB.png_oku(b_yol)
    if a.shape != b.shape:
        return {"hata": f"boyut {a.shape} ≠ {b.shape}"}
    a2, b2 = a.reshape(-1, 3), b.reshape(-1, 3)
    d = np.concatenate([RB.de00(a2[i:i + 400000], b2[i:i + 400000]) for i in range(0, len(a2), 400000)])
    f = np.abs(a - b) * 255
    return {"de00_ort": round(float(d.mean()), 4), "de00_p95": round(float(np.percentile(d, 95)), 3),
            "de00_p99_9": round(float(np.percentile(d, 99.9)), 3), "de00_maks": round(float(d.max()), 2),
            "ort_mutlak_fark_255": round(float(f.mean()), 4), "maks_fark_255": round(float(f.max()), 1),
            "piksel_1_255_ustu": int((f.max(-1) > 1).sum())}


def poster_jpg(src, ad):
    a = RB.png_oku(src)
    yol = f"{O}/s2-{ad}.jpg"
    Image.fromarray(np.clip(np.round(a * 255), 0, 255).astype(np.uint8)).save(yol, quality=92)
    return yol


RD = "D:/soft/cop31-varlik/render-son-d"   # D turu master yedekleri (§12.9-4)


def main(maske_dizin):
    """E turu (brief §12.6): S2 dikişleri master ΔE00 ≤ 0,3; t78[65] ↔ eski t56[71] (render-son-d) ≤ 0,05 tam kare;
    t78[65] ↔ p8 (eski p6 plakası, broşürsüz) broşür dikdörtgeni dışında ≤ 0,05."""
    out = {"tur": "F-B", "sure": sureler(), "vram": vram(), "dikis": {}, "dongu": {}, "bant": {}, "maske": {}, "kapak": {},
           "poster_jpg": []}
    n45, n56, n67, n78 = son("t45", 59), son("t56", 59), son("t67", 47), son("t78", 65)
    # F-B (§13.5): t34 kesmesi t34a son karesi ↔ t34b ilk karesi = (b − 1) ↔ b; b = t34b.json t34_ofset (F-B 36, E 48);
    # t34 son karesi b + 23 (F-B 59, E 71) ↔ l4[0]. t34/ K'nin t34-birlestir.py çıktısı (t34a 0…b−1 + t34b → b…b+23).
    try:
        b34 = int(json.load(open(f"{R}/t34b.json", encoding="utf-8"))["t34_ofset"])
    except Exception:
        b34 = 36
    out["t34_kesme"] = [b34 - 1, b34]
    ciftler = {f"t34[{b34 - 1}]↔t34[{b34}]": (k("t34", b34 - 1), k("t34", b34)),
               f"t34[{b34 + 23}]↔l4[0]": (k("t34", b34 + 23), k("l4", 0)),
               "t45[0]↔l4[0]": (k("t45", 0), k("l4", 0)), f"t45[{n45}]↔l5[0]": (k("t45", n45), k("l5", 0)),
               "l5[0]↔t56[0]": (k("l5", 0), k("t56", 0)), f"t56[{n56}]↔t67[0]": (k("t56", n56), k("t67", 0)),
               f"t67[{n67}]↔t78[0]": (k("t67", n67), k("t78", 0)), f"p6↔t56[{n56}]": (k("p6", 0), k("t56", n56)),
               f"p7↔t67[{n67}]": (k("p7", 0), k("t67", n67))}
    for ad, (a, b) in ciftler.items():
        if os.path.exists(a) and os.path.exists(b):
            out["dikis"][ad] = olc.dikis(a, b)
    eski71 = f"{RD}/t56/k_0071.png"
    if os.path.exists(k("t78", n78)) and os.path.exists(eski71):
        out["dikis"][f"t78[{n78}]↔eski t56[71] (tam kare, tam çözünürlük)"] = tam_de00(k("t78", n78), eski71)
    if os.path.exists(k("t78", n78)) and os.path.exists(k("p8", 0)):
        out["p8_e"] = plaka_kars(k("t78", n78), k("p8", 0))
    for kl in ("l4", "l5"):
        if os.path.exists(k(kl, 119)):
            out["dongu"][kl] = dongu(kl)
    if os.path.exists(k("l4", 0)):
        out["bant"]["p4_ust"] = olc.bant(k("l4", 0), "ust")
    if os.path.exists(k("l5", 0)):
        out["bant"]["p5_alt"] = olc.bant(k("l5", 0), "alt")
    for kl, ad in (("l4", "p4"), ("l5", "p5")):
        m = f"{maske_dizin}/maske-{kl}/k_0000.png"
        if os.path.exists(k(kl, 0)) and os.path.exists(m):
            out["maske"][ad] = olc.maske_stat(k(kl, 0), m)
    if os.path.exists(k("t78", n78)):
        out["kapak"][f"t78_{n78}"] = olc.kapak(k("t78", n78))
    if os.path.exists(R + "/t78.json"):
        j = json.load(open(R + "/t78.json", encoding="utf-8"))
        out["kapak"]["brosur_dikdortgen"] = j.get("brosur_dikdortgen")
        out["kapak"]["brosur_olcum"] = j.get("brosur_olcum")
    if os.path.exists(k("t34b", 0)):
        a16 = RB.png_oku(k("t34b", 0)).reshape(-1, 3)
        u = np.unique(np.round(a16 * 65535).astype(int), axis=0)
        out["t34b_k0000"] = {"tekil_renk": len(u), "renk_16bit": u[0].tolist() if len(u) == 1 else None,
                             "tam_FFF1DC": bool(len(u) == 1 and u[0].tolist() == [65535, 61937, 56540])}
    if os.path.exists(R + "/t34b/_parlama.json"):
        p = json.load(open(R + "/t34b/_parlama.json", encoding="utf-8"))
        out["parlama"] = {f: {"ort": v["ort_parlaklik"], "rgb": RB.hex_(np.array(v["ort_rgb"]))} for f, v in p.items()
                          if int(f) <= b34 + 8}   # F-B: 36–44 (parlama 36–38 + 6 temiz); E: 48–56
    for src, ad in ((k("l4", 0), "p4"), (k("p6", 0), "p6"), (k("p7", 0), "p7"), (k("p8", 0), "p8"), (k("t78", n78), "t78-son")):
        if os.path.exists(src):
            out["poster_jpg"].append(poster_jpg(src, ad))
    with open(O + "/s2-olcum.json", "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--maske_dizin", default="D:/soft/cop31-varlik/render-son/_onizleme/maske")
    p.add_argument("--sonra", default="2026-11-03T23:45:00")   # F-B son render'ı bu saatten sonra (E: 2026-11-03T15:00:00)
    x = p.parse_args()
    SONRA = x.sonra
    main(x.maske_dizin)
