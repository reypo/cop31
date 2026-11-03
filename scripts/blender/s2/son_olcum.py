"""S2 son render ölçümleri (B turu; C turu: p6_c, t34b_k0000) → D:/soft/cop31-varlik/render-son/_onizleme/s2-olcum.json (+ poster JPG'leri).
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


def k(klip, n):
    return f"{R}/{klip}/k_{n:04d}.png"


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


def p6_c():
    """C turu (brief §11.1 S2-C 2): p6 broşürsüz. p6 ↔ t56[71] broşür dikdörtgeni (606–1314 × 460–1460) dışında, tam
    çözünürlük; dikdörtgene uzaklığa göre (yığının kâğıt taşması + gölgesi yalnız yakın bantta) ve dikdörtgen içi renk."""
    t, p = RB.png_oku(k("t56", 71)), RB.png_oku(k("p6", 0))
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
            "t56_71_dis_kagit_piksel(min kanal > 0,80)": int((~ic & (t.min(-1) > 0.80)).sum()),
            "p6_ic_ort": RB.hex_(pi.mean(0)), "p6_ic_p1": RB.hex_(np.percentile(pi, 1, 0)), "p6_ic_p99": RB.hex_(np.percentile(pi, 99, 0)),
            "p6_ic_kagit_oran(min kanal > 0,80)": round(float((pi.min(1) > 0.80).mean()), 6)}


def poster_jpg(src, ad):
    a = RB.png_oku(src)
    yol = f"{O}/s2-{ad}.jpg"
    Image.fromarray(np.clip(np.round(a * 255), 0, 255).astype(np.uint8)).save(yol, quality=92)
    return yol


def main(maske_dizin):
    out = {"sure": sureler(), "vram": vram(), "dikis": {}, "dongu": {}, "bant": {}, "maske": {}, "kapak": {}, "poster_jpg": []}
    ciftler = {"t45[59]↔l5[0]": (k("t45", 59), k("l5", 0)), "l4[0]↔t34b[23]": (k("l4", 0), k("t34b", 23)),
               "t56[0]↔l5[0]": (k("t56", 0), k("l5", 0)), "t45[0]↔l4[0]": (k("t45", 0), k("l4", 0)),
               "t56[71]↔p6 (C: yığın yok; tüm kare)": (k("t56", 71), k("p6", 0))}
    for ad, (a, b) in ciftler.items():
        if os.path.exists(a) and os.path.exists(b):
            out["dikis"][ad] = olc.dikis(a, b)
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
    m56 = f"{maske_dizin}/maske-t56/k_0071.png"
    if os.path.exists(k("t56", 71)):
        out["kapak"]["t56_71"] = olc.kapak(k("t56", 71), m56 if os.path.exists(m56) else None)
    if os.path.exists(R + "/t56.json"):
        j = json.load(open(R + "/t56.json", encoding="utf-8"))
        out["kapak"]["brosur_dikdortgen"] = j.get("brosur_dikdortgen")
        out["kapak"]["brosur_olcum"] = j.get("brosur_olcum")
    if os.path.exists(k("p6", 0)) and os.path.exists(k("t56", 71)):
        out["p6_c"] = p6_c()
    if os.path.exists(k("t34b", 0)):
        a16 = RB.png_oku(k("t34b", 0)).reshape(-1, 3)
        u = np.unique(np.round(a16 * 65535).astype(int), axis=0)
        out["t34b_k0000"] = {"tekil_renk": len(u), "renk_16bit": u[0].tolist() if len(u) == 1 else None,
                             "tam_FFF1DC": bool(len(u) == 1 and u[0].tolist() == [65535, 61937, 56540])}
    if os.path.exists(R + "/t34b/_parlama.json"):
        p = json.load(open(R + "/t34b/_parlama.json", encoding="utf-8"))
        out["parlama"] = {f: {"ort": v["ort_parlaklik"], "rgb": RB.hex_(np.array(v["ort_rgb"]))} for f, v in p.items() if int(f) <= 56}
    for src, ad in ((k("l4", 0), "p4"), (k("l5", 0), "p5"), (k("p6", 0), "p6"), (k("t56", 71), "t56-son")):
        if os.path.exists(src):
            out["poster_jpg"].append(poster_jpg(src, ad))
    with open(O + "/s2-olcum.json", "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--maske_dizin", default="D:/soft/cop31-varlik/render-son/_onizleme/maske")
    main(p.parse_args().maske_dizin)
