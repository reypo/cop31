"""Dijital broşür birebirlik ölçümü: tarayıcının gösterdiği sayfa ↔ aynı boyutta PDF raster'ı.

    python -I scripts/brosur/birebir.py .qa/brosur-2/birebir/olcum.json

Girdi scripts/brosur/olc.mjs --birebir çıktısı (ekran görüntüsü + sayfa kutuları, CSS px). Referans: PDF'in vektörden
kayıpsız 2480 px raster'ı (.qa/brosur-2/raster/<dil>/pNN-2480.png, rasterle.py), ekrandaki çizim dikdörtgenine
(object-fit: contain) PIL Lanczos ile alt piksel konumuyla örneklenir (resize box=). Karşılaştırma tamamen sayfa içinde
kalan piksellerde, 1 px kenar payı hariç (kenar pikseli zeminle karışır):
  ort / p99     — ortalama ve %99'luk mutlak fark (0–255, RGB ortalaması)
  kayma         — faz korelasyonuyla bulunan en iyi tam piksel kayma (0,0 = yazı/fotoğraf yerinde)
  sirt_haric    — yayılımda sırt gölgesinin (iç kenar %4) dışı
  kenar_ort     — 3 px kenar şeridinin ortalama farkı (kırpılsaydı/ölçek kaysaydı burada büyük fark olurdu)
  oran_hata     — sayfa kutusu genişlik/yükseklik ↔ 595,276/841,89 bağıl hata
  icinde        — çizim dikdörtgeni sahnenin ve görüntü alanının tamamen içinde mi (kırpma/örtme yok)
Çıktı: <girdi dizini>/birebir.json ve özet.
"""

import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ORAN = 595.276 / 841.89
KOK = Path(__file__).resolve().parents[2]


def faz_kayma(a, b):
    A = np.fft.fft2(a - a.mean())
    Bf = np.fft.fft2(b - b.mean())
    R = A * np.conj(Bf)
    R /= np.abs(R) + 1e-9
    r = np.fft.ifft2(R).real
    y, x = np.unravel_index(np.argmax(r), r.shape)
    if y > a.shape[0] // 2:
        y -= a.shape[0]
    if x > a.shape[1] // 2:
        x -= a.shape[1]
    return int(x), int(y)


def main():
    girdi = Path(sys.argv[1])
    kayit = json.loads(girdi.read_text(encoding="utf-8"))
    raster = KOK / ".qa/brosur-2/raster"
    sonuc = []
    for k in kayit:
        ekran = Image.open(k["png"]).convert("RGB")
        dpr = k["dpr"]
        sahne = k["sahne"]
        for s in k["sayfalar"]:
            kutu = s["img"]
            nw, nh = s["dogal"]
            # object-fit: contain çizim dikdörtgeni (CSS px)
            olc = min(kutu["width"] / nw, kutu["height"] / nh)
            dw, dh = nw * olc, nh * olc
            x0 = kutu["x"] + (kutu["width"] - dw) / 2
            y0 = kutu["y"] + (kutu["height"] - dh) / 2
            X0, Y0, X1, Y1 = x0 * dpr, y0 * dpr, (x0 + dw) * dpr, (y0 + dh) * dpr
            cx0, cy0, cx1, cy1 = math.ceil(X0), math.ceil(Y0), math.floor(X1), math.floor(Y1)
            ref = Image.open(raster / k["dil"] / f"p{s['p']:02d}-2480.png").convert("RGB")
            RW, RH = ref.size
            kutu_kaynak = ((cx0 - X0) / (X1 - X0) * RW, (cy0 - Y0) / (Y1 - Y0) * RH, (cx1 - X0) / (X1 - X0) * RW, (cy1 - Y0) / (Y1 - Y0) * RH)
            r = np.asarray(ref.resize((cx1 - cx0, cy1 - cy0), Image.LANCZOS, box=kutu_kaynak), dtype=np.float32)
            e = np.asarray(ekran.crop((cx0, cy0, cx1, cy1)), dtype=np.float32)
            fark = np.abs(e - r).mean(axis=2)
            ic = fark[1:-1, 1:-1]
            g = lambda a: a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
            kx, ky = faz_kayma(g(e), g(r))
            H, W = fark.shape
            bant = max(1, round(W * 0.04))
            if len(k["sayfalar"]) == 2:
                sirt = ic[:, : W - 2 - bant] if s["yan"] == "sol" else ic[:, bant:]
            else:
                sirt = ic
            # Yayılımda sırt kenarı (sırt gölgesi) kenar şeridine katılmaz.
            seritler = [fark[:3].ravel(), fark[-3:].ravel()]
            if not (len(k["sayfalar"]) == 2 and s["yan"] == "sag"):
                seritler.append(fark[:, :3].ravel())
            if not (len(k["sayfalar"]) == 2 and s["yan"] == "sol"):
                seritler.append(fark[:, -3:].ravel())
            kenar = np.concatenate(seritler)
            vw, vh = k["vp"]
            icinde = (
                x0 >= sahne["x"] - 0.01 and y0 >= sahne["y"] - 0.01 and x0 + dw <= sahne["x"] + sahne["width"] + 0.01 and y0 + dh <= sahne["y"] + sahne["height"] + 0.01
                and x0 >= 0 and y0 >= 0 and x0 + dw <= vw and y0 + dh <= vh
            )
            fark_png = girdi.parent / f"{Path(k['png']).stem}-{s['yan']}-fark4x.png"
            Image.fromarray(np.clip(fark * 4, 0, 255).astype(np.uint8)).save(fark_png)
            sonuc.append(
                {
                    "ad": k["ad"], "dil": k["dil"], "sayfa": s["p"], "yan": s["yan"], "dpr": dpr, "src": s["src"],
                    "kutu_css": [round(kutu["x"], 2), round(kutu["y"], 2), round(kutu["width"], 2), round(kutu["height"], 2)],
                    "piksel": [cx1 - cx0, cy1 - cy0],
                    "oran_hata": round(abs(kutu["width"] / kutu["height"] / ORAN - 1), 6),
                    "object_fit": s["sigdir"], "icinde": bool(icinde), "tasma": k["tasma"],
                    "ort": round(float(ic.mean()), 2), "p99": round(float(np.percentile(ic, 99)), 1),
                    "sirt_haric_ort": round(float(sirt.mean()), 2),
                    "kenar_ort": round(float(kenar.mean()), 2),
                    "kayma": [kx, ky],
                }
            )
    (girdi.parent / "birebir.json").write_text(json.dumps(sonuc, indent=1), encoding="utf-8")
    print(f"{'görünüm':<11} {'dil':<3} {'s.':>3} {'yan':<4} {'piksel':>11} {'kaynak':<26} {'ort':>5} {'p99':>5} {'sırtsız':>7} {'kenar':>6} {'kayma':>7} {'oran':>9} içinde")
    for s in sonuc:
        print(f"{s['ad']:<11} {s['dil']:<3} {s['sayfa']:>3} {s['yan']:<4} {s['piksel'][0]:>5}×{s['piksel'][1]:<5} {s['src'][:26]:<26} {s['ort']:>5} {s['p99']:>5} {s['sirt_haric_ort']:>7} {s['kenar_ort']:>6} {str(tuple(s['kayma'])):>7} {s['oran_hata']:>9} {s['icinde'] and not s['tasma']}")
    print(
        f"\nEN BÜYÜK: ort {max(s['ort'] for s in sonuc)}, sırt hariç ort {max(s['sirt_haric_ort'] for s in sonuc)}, "
        f"kayma {max(max(abs(a) for a in s['kayma']) for s in sonuc)} px, oran hatası {max(s['oran_hata'] for s in sonuc)}, "
        f"hepsi içinde: {all(s['icinde'] and not s['tasma'] for s in sonuc)}, object-fit: {sorted({s['object_fit'] for s in sonuc})}"
    )


if __name__ == "__main__":
    main()
