"""Dijital broşür: PDF sayfalarını vektör kaynaktan kayıpsız PNG'ye çevirir (pymupdf) + İçindekiler bağlantı alanları.

    python -I scripts/brosur/rasterle.py <pdf> <çıktı dizini> <genişlik> [<genişlik> …]

Her sayfa `<çıktı>/pNN-<genişlik>.png` (RGB, alfa yok). Ölçek = genişlik / sayfa genişliği (pt); yükseklik pymupdf'in
tam sayıya yuvarlaması (A4 595,276 × 841,89 pt → 1240 × 1754, 2480 × 3508): kırpma yok, oran ±0,5 px. Önbellek: PDF'in
SHA-256'sı ve istenen genişlikler `<çıktı>/bilgi.json`'dakiyle aynıysa ve PNG'ler duruyorsa yeniden çizilmez.

bilgi.json: {pdf_sha256, sayfa, pt: [g, y], genislikler, boyutlar: {genişlik: [g, y]}, icindekiler: [{p, x, y, g, h}]}
İçindekiler: 2. sayfadaki "NN" sayfa numarası blokları + sağlarındaki bölüm adı (aynı satır) → sayfaya oranla kutu
(0–1); görüntüleyici bunları görünmez bağlantı alanı olarak koyar.
"""

import hashlib
import json
import re
import sys
from pathlib import Path

import pymupdf


def sha256(yol):
    h = hashlib.sha256()
    with open(yol, "rb") as f:
        for parca in iter(lambda: f.read(1 << 20), b""):
            h.update(parca)
    return h.hexdigest()


def icindekiler(sayfa):
    """2. sayfa: numara bloğu (iki hane) + aynı satırda sağındaki ad bloğu → bağlantı kutusu (sayfaya oranla)."""
    W, H = sayfa.rect.width, sayfa.rect.height
    bloklar = [(b[0], b[1], b[2], b[3], b[4].strip()) for b in sayfa.get_text("blocks")]
    # Alt bilgi satırı ("02 CONTENTS", sayfanın en altı) hariç.
    numaralar = [b for b in bloklar if re.fullmatch(r"\d{2}", b[4]) and b[1] < H * 0.95]
    kutular = []
    for x0, y0, x1, y1, m in numaralar:
        adlar = [b for b in bloklar if b is not None and abs(b[1] - y0) < 8 and x1 < b[0] < x1 + 40 and not re.fullmatch(r"\d{2}", b[4])]
        if len(adlar) != 1:
            raise SystemExit(f"İçindekiler: {m} numarasının ad bloğu bulunamadı ({len(adlar)})")
        a = adlar[0]
        kx0, ky0, kx1, ky1 = x0 - 6, min(y0, a[1]) - 5, a[2] + 8, max(y1, a[3]) + 5
        kutular.append({"p": int(m), "x0": kx0, "y0": ky0, "x1": kx1, "y1": ky1})
    # Sol sütun kutusu sağ sütuna taşmasın.
    sag_sutun = min((k["x0"] for k in kutular if k["x0"] > W * 0.4), default=W)
    for k in kutular:
        if k["x0"] < W * 0.4:
            k["x1"] = min(k["x1"], sag_sutun - 8)
    kutular.sort(key=lambda k: k["p"])
    return [
        {"p": k["p"], "x": round(k["x0"] / W, 4), "y": round(k["y0"] / H, 4), "g": round((k["x1"] - k["x0"]) / W, 4), "h": round((k["y1"] - k["y0"]) / H, 4)}
        for k in kutular
    ]


def main():
    if len(sys.argv) < 4:
        raise SystemExit(__doc__)
    pdf, cikti, genislikler = Path(sys.argv[1]), Path(sys.argv[2]), [int(x) for x in sys.argv[3:]]
    cikti.mkdir(parents=True, exist_ok=True)
    ozet = sha256(pdf)
    bilgi_yol = cikti / "bilgi.json"
    d = pymupdf.open(pdf)
    eski = json.loads(bilgi_yol.read_text(encoding="utf-8")) if bilgi_yol.exists() else {}
    tamam = (
        eski.get("pdf_sha256") == ozet
        and eski.get("genislikler") == genislikler
        and all((cikti / f"p{n:02d}-{w}.png").exists() for n in range(1, d.page_count + 1) for w in genislikler)
    )
    pt = [d[0].rect.width, d[0].rect.height]
    for s in d:
        if [s.rect.width, s.rect.height] != pt or s.rotation != 0:
            raise SystemExit(f"{pdf}: sayfa {s.number + 1} boyutu/dönüşü farklı")
    boyutlar = {}
    for w in genislikler:
        olcek = w / pt[0]
        for s in d:
            n = s.number + 1
            hedef = cikti / f"p{n:02d}-{w}.png"
            if not tamam:
                pm = s.get_pixmap(matrix=pymupdf.Matrix(olcek, olcek), alpha=False, colorspace=pymupdf.csRGB)
                if pm.width != w:
                    raise SystemExit(f"{pdf} s{n}: genişlik {pm.width} ≠ {w}")
                pm.save(hedef)
                boyutlar[str(w)] = [pm.width, pm.height]
            elif str(w) not in boyutlar:
                boyutlar[str(w)] = eski["boyutlar"][str(w)]
        print(f"{pdf.name} {w}px: {boyutlar[str(w)]}{' (önbellek)' if tamam else ''}", flush=True)
    bilgi = {
        "pdf_sha256": ozet,
        "sayfa": d.page_count,
        "pt": pt,
        "genislikler": genislikler,
        "boyutlar": boyutlar,
        "icindekiler": icindekiler(d[1]),
    }
    bilgi_yol.write_text(json.dumps(bilgi, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
