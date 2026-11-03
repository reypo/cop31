"""d1 / d11 yayları (brief §12.2): COP1–COP30 ev sahibi 27 kentten Antalya'ya ışık yayları — GPU yok, render yok.

    python -X utf8 -P yaylar.py [--cikis D:/soft/cop31-varlik/render-son/yaylar.json] [--ts src/lib/cop-kentleri.ts]

kamera.py D1 pozu (l1 kare 0 = p1 = d11), KM.projeksiyon. Her kentten Antalya'ya (CAPALAR p1 çapası, 30 m) büyük daire;
yükseklik profili h(t) = H · sin(πt), H = yay uzunluğu × 0,12 (en çok 900 km). İnce örnekleme (481 nokta) üstünde
ışın–küre testi: kameradan noktaya giden ışın küreye noktadan önce çarpıyorsa nokta uzvun arkasındadır. Yayın Antalya'da
biten son görünür parçası 24 noktaya (yay parametresinde eşit aralık) yeniden örneklenir; arka yüzden gelen yay böylece
uzuvdan doğar (giriş parametresi ikiye bölmeyle 1e-6'ya). Video px: dikey ((x − 420)/1,5, y/1,5), yatay (x/1,5,
(y − 420)/1,5). Çıktı d1 ve d11 için aynı (d11'de W ters yönde çizer). Ayrı fragman, çünkü l1.json'u sahne.py yazar.

Kent koordinatları elle (olgu verisi, ±0,1°; kent merkezi ya da konferans yeri). Sitede ad yazılmaz, yalnız geometri;
aynı liste src/lib/cop-kentleri.ts olarak da yazılır (--ts).

Ayrıca: `emanet_oku()` — src/lib/emanet.ts'ten 12 emanet alanının no, dönem, enlem, boylamı (sahne.py p2 çapaları).
"""
import argparse
import json
import math
import os
import re
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
DEPO = os.path.normpath(os.path.join(HERE, "..", "..", ".."))

# COP1 (1995) – COP30 (2025) ev sahibi kentleri, tekilleştirilmiş, ilk ev sahipliği sırasıyla.
# (ad, ülke, COP numaraları, enlem, boylam). Notlar: COP6'nın ikinci oturumu (COP6-bis, Temmuz 2001) Bonn'da yapıldı;
# COP numarası olarak Lahey'e yazıldı. COP13 Bali'de Nusa Dua'da; koordinat Nusa Dua. COP25 Şili başkanlığında Madrid'de.
KENTLER = [
    ("Berlin", "Almanya", [1], 52.52, 13.40),
    ("Cenevre", "İsviçre", [2], 46.20, 6.14),
    ("Kyoto", "Japonya", [3], 35.01, 135.77),
    ("Buenos Aires", "Arjantin", [4, 10], -34.60, -58.38),
    ("Bonn", "Almanya", [5, 23], 50.74, 7.10),
    ("Lahey", "Hollanda", [6], 52.08, 4.30),
    ("Marakeş", "Fas", [7, 22], 31.63, -7.99),
    ("Yeni Delhi", "Hindistan", [8], 28.61, 77.21),
    ("Milano", "İtalya", [9], 45.46, 9.19),
    ("Montreal", "Kanada", [11], 45.50, -73.57),
    ("Nairobi", "Kenya", [12], -1.29, 36.82),
    ("Bali (Nusa Dua)", "Endonezya", [13], -8.80, 115.23),
    ("Poznań", "Polonya", [14], 52.41, 16.93),
    ("Kopenhag", "Danimarka", [15], 55.68, 12.57),
    ("Cancún", "Meksika", [16], 21.16, -86.85),
    ("Durban", "Güney Afrika", [17], -29.86, 31.02),
    ("Doha", "Katar", [18], 25.29, 51.53),
    ("Varşova", "Polonya", [19], 52.23, 21.01),
    ("Lima", "Peru", [20], -12.05, -77.04),
    ("Paris", "Fransa", [21], 48.86, 2.35),
    ("Katowice", "Polonya", [24], 50.26, 19.02),
    ("Madrid", "İspanya", [25], 40.42, -3.70),
    ("Glasgow", "Birleşik Krallık", [26], 55.86, -4.25),
    ("Şarm El-Şeyh", "Mısır", [27], 27.92, 34.33),
    ("Dubai", "Birleşik Arap Emirlikleri", [28], 25.20, 55.27),
    ("Bakü", "Azerbaycan", [29], 40.41, 49.87),
    ("Belém", "Brezilya", [30], -1.46, -48.50),
]
ANTALYA = (36.8969, 30.7133, 30.0)          # sahne.py CAPALAR p1 (değişmez: dikey 386,5; 758,1)
YAY_ORAN, YAY_TAVAN = 0.12, 900_000.0
NOKTA, INCE = 24, 481


def emanet_oku(yol=None):
    """src/lib/emanet.ts → [{no, donem, lat, lng}] (no sırasıyla). Alan sırası dosyada: no … donem … lat, lng."""
    yol = yol or os.path.join(DEPO, "src", "lib", "emanet.ts")
    s = open(yol, encoding="utf-8").read()
    s = s[s.index("export const emanetAlanlari"):]
    s = s[:re.search(r"\n\]", s).start()]                  # "] as const;" ya da "];"
    out = []
    parcalar = re.split(r"\n\s*no:\s*", s)[1:]
    for p in parcalar:
        no = int(re.match(r"(\d+)", p).group(1))
        donem = re.search(r"\n\s*donem:\s*\"([^\"]+)\"", p).group(1)
        lat = float(re.search(r"\n\s*lat:\s*(-?[\d.]+)", p).group(1))
        lng = float(re.search(r"\n\s*lng:\s*(-?[\d.]+)", p).group(1))
        out.append({"no": no, "donem": donem, "lat": lat, "lng": lng})
    out.sort(key=lambda e: e["no"])
    assert [e["no"] for e in out] == list(range(1, 13)), [e["no"] for e in out]
    return out


def video(xy):
    x, y = xy
    return {"dikey": [round((x - 420) / 1.5, 1), round(y / 1.5, 1)],
            "yatay": [round(x / 1.5, 1), round((y - 420) / 1.5, 1)]}


def main():
    import geo
    import kamera as KM
    from geo import R, DUNYA_MERKEZ

    ap = argparse.ArgumentParser()
    ap.add_argument("--cikis", default="D:/soft/cop31-varlik/render-son/yaylar.json")
    ap.add_argument("--ts", default=os.path.join(DEPO, "src", "lib", "cop-kentleri.ts"))
    a = ap.parse_args()

    st = KM.kamera("l1", 0, None)            # D1 (l1 kare 0 = p1)
    C, B, lens = st["C"], st["B"], st["lens"]

    def gorunur(P):
        """P (n×3, dünya m) kameradan görünür mü: önde ve kameradan P'ye ışın küreye P'den önce çarpmıyor."""
        P = np.atleast_2d(P)
        v = P - C; L = np.linalg.norm(v, axis=1); w = v / L[:, None]
        oc = C - DUNYA_MERKEZ
        b = w @ oc; c = oc @ oc - R * R
        disk = b * b - c
        t1 = -b - np.sqrt(np.maximum(disk, 0.0))
        engel = (disk > 0) & (t1 > 0) & (t1 < L - 1.0)
        _, _, on = KM.projeksiyon(C, B, lens, P)
        return on & ~engel

    def yay_noktalari(k, t):
        """Kent k → Antalya büyük dairesinde t ∈ [0, 1] (dizi) için dünya noktaları ve yay uzunluğu (m)."""
        pa = geo.ecef_birim(k[3], k[4]); pb = geo.ecef_birim(ANTALYA[0], ANTALYA[1])
        om = math.acos(max(-1.0, min(1.0, float(pa @ pb))))
        t = np.asarray(t, np.float64)
        p = (np.sin((1 - t) * om)[:, None] * pa + np.sin(t * om)[:, None] * pb) / math.sin(om)
        lat = np.degrees(np.arcsin(p[:, 2])); lon = np.degrees(np.arctan2(p[:, 1], p[:, 0]))
        H = min(YAY_ORAN * R * om, YAY_TAVAN)
        h = H * np.sin(np.pi * t) + ANTALYA[2] * t
        return geo.latlon_enu(lat, lon, h), R * om, H

    ant = geo.latlon_enu(*ANTALYA)
    ax, ay, _ = KM.projeksiyon(C, B, lens, ant)
    ant_v = video((float(ax), float(ay)))

    dik, yat, kentler, ozet = [], [], [], []
    for k in KENTLER:
        tt = np.linspace(0, 1, INCE)
        P, L, H = yay_noktalari(k, tt)
        g = gorunur(P)
        assert g[-1], f"Antalya görünmüyor? {k[0]}"
        # Antalya'da biten son görünür parça
        i = INCE - 1
        while i > 0 and g[i - 1]:
            i -= 1
        ara = int((~g[:i]).sum()) if i > 0 else 0
        sonra_gizli = int((~g[i:]).sum())
        if i == 0:
            t0 = 0.0
            giris = "kent"
        else:
            lo, hi = tt[i - 1], tt[i]          # lo gizli, hi görünür
            for _ in range(40):
                m = (lo + hi) / 2
                if gorunur(yay_noktalari(k, [m])[0])[0]:
                    hi = m
                else:
                    lo = m
            t0 = hi
            giris = "uzuv"
        # gizli parçadan önce görünür bir parça var mı (çift görünür bölüt — olmamalı)
        cift = bool(i > 0 and g[:i].any())
        t24 = np.linspace(t0, 1.0, NOKTA)
        P24, _, _ = yay_noktalari(k, t24)
        x, y, _ = KM.projeksiyon(C, B, lens, P24)
        assert gorunur(P24).all() or giris == "uzuv"
        x[-1], y[-1] = ax, ay
        vd = [[round((float(u) - 420) / 1.5, 1), round(float(v) / 1.5, 1)] for u, v in zip(x, y)]
        vy = [[round(float(u) / 1.5, 1), round((float(v) - 420) / 1.5, 1)] for u, v in zip(x, y)]
        dik.append(vd); yat.append(vy)
        kent_gor = bool(gorunur(geo.latlon_enu(k[3], k[4], 0.0))[0])
        disari_d = sum(1 for u, v in vd if not (0 <= u <= 720 and 0 <= v <= 1280))
        disari_y = sum(1 for u, v in vy if not (0 <= u <= 1280 and 0 <= v <= 720))
        kentler.append({"ad": k[0], "lat": k[3], "lng": k[4], "gorunur": kent_gor, "km": round(L / 1000.0),
                        "tepe_km": round(H / 1000.0), "giris": giris, "t0": round(float(t0), 4)})
        ozet.append((k[0], round(L / 1000.0), round(H / 1000.0), kent_gor, giris, round(float(t0), 3), cift,
                     disari_d, disari_y, vd[0], vy[0]))

    js = {"dikey": dik, "yatay": yat, "antalya": {"dikey": ant_v["dikey"], "yatay": ant_v["yatay"]}, "kentler": kentler,
          "kaynak": "scripts/blender/s1/yaylar.py (kamera.py D1, l1 kare 0 = p1; d1 ve d11 ayni)",
          "tanim": {"nokta": NOKTA, "yukseklik": "yay uzunlugu x 0,12, en cok 900 km; h(t) = H sin(pi t)",
                    "kirpim": "isin-kure testi; uzuv arkasi kirpilir, yay uzuvdan dogar; son nokta Antalya",
                    "video": "dikey ((x-420)/1,5, y/1,5), yatay (x/1,5, (y-420)/1,5); master 1920"}}
    os.makedirs(os.path.dirname(a.cikis), exist_ok=True)
    json.dump(js, open(a.cikis, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"yaylar.json: {os.path.getsize(a.cikis)} bayt → {a.cikis}")
    print(f"Antalya master ({ax:.2f}; {ay:.2f}) → dikey {ant_v['dikey']}, yatay {ant_v['yatay']}")
    print("kent | km | tepe km | kent görünür | giriş | t0 | çift | dışarı nokta dikey/yatay | ilk nokta dikey | yatay")
    for o in ozet:
        print(" | ".join(str(x) for x in o))
    n_on = sum(1 for k in kentler if k["giris"] == "kent")
    print(f"tamamen önde (kentten başlayan): {n_on}; uzuvdan giren: {len(kentler) - n_on}; toplam {len(kentler)}")

    # src/lib/cop-kentleri.ts (yalnız geometri; sitede ad yazılmaz)
    satir = []
    for k in KENTLER:
        satir.append(f'  {{ ad: "{k[0]}", ulke: "{k[1]}", coplar: [{", ".join(str(n) for n in k[2])}], '
                     f'lat: {k[3]}, lng: {k[4]} }},')
    ts = (
        "/**\n"
        " * COP1–COP30 (1995–2025) ev sahibi kentleri, tekilleştirilmiş (27 kent), ilk ev sahipliği sırasıyla.\n"
        " * /icinden d1 ve d11'deki ışık yaylarının kaynağı (brief-icinden-3 §12.2). Sitede ad yazılmaz, yalnız\n"
        " * geometri kullanılır; yayların video px'leri scripts/blender/s1/yaylar.py ile üretilir (render-son/yaylar.json).\n"
        " * Koordinatlar elle girildi (olgu verisi, ±0,1°; kent merkezi). COP6'nın ikinci oturumu (2001) Bonn'da\n"
        " * yapıldı, numara Lahey'e yazıldı. COP13 Bali'de Nusa Dua'da. Bu dosya yaylar.py tarafından yazılır.\n"
        " */\n"
        "export type CopKenti = {\n"
        "  ad: string;\n"
        "  ulke: string;\n"
        "  coplar: readonly number[];\n"
        "  lat: number;\n"
        "  lng: number;\n"
        "};\n\n"
        "export const copKentleri: readonly CopKenti[] = [\n" + "\n".join(satir) + "\n];\n"
    )
    with open(a.ts, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(ts)
    print(f"{a.ts}: {len(KENTLER)} kent")


if __name__ == "__main__":
    main()
