"""t34b parlaması (brief-icinden-3 §9.1, §9.3): ışıklık parlaması görüntü uzayında #FFF1DC.
İlk kare B (t34b'nin ilk karesi, t34 numarasıyla) tamamen parlamanın içinde (ortalama parlaklık %93,6 ≥ %92), sonra
kenarlardan merkeze doğru söner:
  α(x, y, f) = sat(a_f · (1,15 − 0,35 r²)),  a_f = 2,3 · (1 − u)²,  u = (f − B) / N,  r = merkezden uzaklık / yarı kenar.
F turu (§13.2 t34: parlama ≤ 0,2 s): N = 3. F-B (§13.5): B = 36 → iniş kare 36–38 (kare 36 tam #FFF1DC, 39'dan temiz);
S1 t34a 33→35 rampa yapar (35 tam), toplam %80+ beyaz ≤ 6. E turu (eski): B = 48, N = 8 (kare 48–55) — S2_PARLAMA_BAS=48
S2_PARLAMA=8 (ya da 3./4. argüman).
Render (sahne.py --klip t34b) <dizin>/ham/k_####.png yazar (t34 numarasıyla, B … B+23); bu betik <dizin>/k_####.png üretir
(numara = t34 karesi − ofset; 16/8 bit korunur).

  python -X utf8 -P scripts/blender/s2/parlama.py D:/soft/cop31-varlik/render-son/t34b 36 [N] [B]   (son render: çıktı 0'dan)
  python -X utf8 -P scripts/blender/s2/parlama.py <önizleme dizini>                                    (ofset 0: t34 numarası)
"""
import sys, os, json
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from png16 import oku, yaz

TON = np.array([0xFF, 0xF1, 0xDC], dtype=np.float64) / 255.0


PARLAMA_KARE = int(os.environ.get("S2_PARLAMA", "3"))       # F: 3 (F-B 36–38); E: 8 (48–55)
PARLAMA_BAS = int(os.environ.get("S2_PARLAMA_BAS", "36"))   # t34b ilk karesi (t34 numarası): F-B 36; E / F-A 48
T34B_KARE = 24


def main(dizin, ofset=0, n=PARLAMA_KARE, bas=PARLAMA_BAS):
    ham = os.path.join(dizin, "ham")
    olcum = {}
    for f in range(bas, bas + T34B_KARE):
        src = os.path.join(ham, f"k_{f:04d}.png")
        if not os.path.exists(src):
            print(f"[UYARI] {src} yok", flush=True)
            continue
        a, bit = oku(src)
        u = (f - bas) / float(n)
        if u < 1.0:
            h, w = a.shape[:2]
            yy, xx = np.mgrid[0:h, 0:w]
            r2 = ((xx + 0.5 - w / 2) / (w / 2)) ** 2 + ((yy + 0.5 - h / 2) / (h / 2)) ** 2
            af = 2.3 * (1 - u) ** 2
            al = np.clip(af * (1.15 - 0.35 * r2), 0, 1)[..., None]
            a = a * (1 - al) + TON * al
        yaz(os.path.join(dizin, f"k_{f - ofset:04d}.png"), a, bit)
        olcum[f] = {"ort_parlaklik": round(float(a.mean()), 4), "ort_rgb": [round(float(x), 4) for x in a.reshape(-1, 3).mean(0)],
                    "parlama_kare": n, "parlama_bas": bas, "cikis": f"k_{f - ofset:04d}.png"}
        print(f, olcum[f], flush=True)
    with open(os.path.join(dizin, "_parlama.json"), "w", encoding="utf-8") as fh:
        json.dump(olcum, fh, indent=1)


if __name__ == "__main__":
    # ofset: çıktı numarası = t34 karesi − ofset (render-son: 36 → k_0000)
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 0, int(sys.argv[3]) if len(sys.argv) > 3 else PARLAMA_KARE,
         int(sys.argv[4]) if len(sys.argv) > 4 else PARLAMA_BAS)
