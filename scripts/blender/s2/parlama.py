"""t34b parlaması (brief-icinden-3 §9.1, §9.3): t34 kare 48–55, ışıklık parlaması görüntü uzayında #FFF1DC.
Kare 48 tamamen parlamanın içinde (ortalama parlaklık %93,6 ≥ %92), sonra kenarlardan merkeze doğru söner:
  α(x, y, f) = sat(a_f · (1,15 − 0,35 r²)),  a_f = 2,3 · (1 − u)²,  u = (f − 48) / 8,  r = merkezden uzaklık / yarı kenar.
Render (sahne.py --klip t34b) <dizin>/ham/k_####.png yazar; bu betik <dizin>/k_####.png üretir (48–71, 16/8 bit korunur).

  python -X utf8 -P scripts/blender/s2/parlama.py D:/soft/cop31-varlik/render-son/t34b 48   (B: çıktı 0'dan)
"""
import sys, os, json
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from png16 import oku, yaz

TON = np.array([0xFF, 0xF1, 0xDC], dtype=np.float64) / 255.0


def main(dizin, ofset=0):
    ham = os.path.join(dizin, "ham")
    olcum = {}
    for f in range(48, 72):
        src = os.path.join(ham, f"k_{f:04d}.png")
        if not os.path.exists(src):
            continue
        a, bit = oku(src)
        u = (f - 48) / 8.0
        if u < 1.0:
            h, w = a.shape[:2]
            yy, xx = np.mgrid[0:h, 0:w]
            r2 = ((xx + 0.5 - w / 2) / (w / 2)) ** 2 + ((yy + 0.5 - h / 2) / (h / 2)) ** 2
            af = 2.3 * (1 - u) ** 2
            al = np.clip(af * (1.15 - 0.35 * r2), 0, 1)[..., None]
            a = a * (1 - al) + TON * al
        yaz(os.path.join(dizin, f"k_{f - ofset:04d}.png"), a, bit)
        olcum[f] = {"ort_parlaklik": round(float(a.mean()), 4), "ort_rgb": [round(float(x), 4) for x in a.reshape(-1, 3).mean(0)]}
        print(f, olcum[f], flush=True)
    with open(os.path.join(dizin, "_parlama.json"), "w", encoding="utf-8") as fh:
        json.dump(olcum, fh, indent=1)


if __name__ == "__main__":
    # ofset: çıktı numarası = t34 karesi − ofset (render-son: 48 → k_0000)
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 0)
