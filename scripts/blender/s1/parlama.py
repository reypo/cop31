"""t34a parlaması (B turu, orkestratör kararı 6): görüntü uzayında, S2'nin parlama.py kalıbıyla.

Render (sahne.py --klip t34a, varsayılan --ham t34a) <dizin>/ham/k_####.png yazar; bu betik <dizin>/k_####.png üretir
(0–47, 16/8 bit korunur). Kare 0–37 aynen kopyalanır. Kare 38'den rampa: önce perde (screen) aydınlatma
k_f = 0,55·u², sonra ışıklığın ekran konumundan (kare 30'dan sonra merkez) yayılan #FFF1DC:
  α(x, y, f) = sat(a_f · (1,15 − 0,35 r²)),  r = merkezden uzaklık / yarı kenar,  u = (f − 38) / 9
Kare 47'de α ≡ 1 → tam #FFF1DC (S2 t34b kare 48 ile birebir, aynı 16 bit yuvarlama). Kare 44–47 ort. ≥ %92.

  python -X utf8 -P scripts/blender/s1/parlama.py D:/soft/cop31-varlik/render-son/t34a [--bas 33] [--son 35]

F turu (brief §13.2, t34: parlama ≤ 0,2 s, %80+ beyaz kare ≤ 6): rampa kare bas…son
(a_f = 3,2 · ((f − bas + 1)/(son + 1 − bas))^2,2: 3 karede 0,29 / 1,31 / 3,2), perde aydınlatma u = (f − bas)/(son − bas);
son karede α ≡ 1 → tam #FFF1DC. F-B (§13.5, t34a 36 kare): --bas 33 (varsayılan) → rampa 33–35, kare 35 tam #FFF1DC,
S2 t34b 36–38 iner. --son verilmezse ham/ klasöründeki en büyük kare numarası (F-B 35). F-A: --bas 45 (48 kare, son 47).
--bas 38 → B/C/E turu tablosu (A_F, son 47) bire bir.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image

TON = np.array([0xFF, 0xF1, 0xDC], dtype=np.float64) / 255.0
A_F = {38: 0.10, 39: 0.22, 40: 0.40, 41: 0.65, 42: 0.95, 43: 1.35, 44: 1.9, 45: 2.3, 46: 2.7, 47: 3.2}


def bit_boyut(yol):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,pix_fmt",
                        "-of", "json", yol], capture_output=True, text=True, check=True)
    s = json.loads(o.stdout)["streams"][0]
    return s["width"], s["height"], (16 if ("48" in s["pix_fmt"] or "64" in s["pix_fmt"]) else 8)


def oku(yol):
    w, h, bit = bit_boyut(yol)
    if bit == 8:
        return np.asarray(Image.open(yol).convert("RGB"), np.float64) / 255.0, 8
    o = subprocess.run(["ffmpeg", "-v", "error", "-i", yol, "-f", "rawvideo", "-pix_fmt", "rgb48le", "-"], capture_output=True, check=True)
    return np.frombuffer(o.stdout, dtype="<u2").reshape(h, w, 3).astype(np.float64) / 65535.0, 16


def yaz(yol, a, bit):
    if bit == 8:
        Image.fromarray(np.clip(np.round(a * 255), 0, 255).astype(np.uint8)).save(yol, compress_level=6)
        return
    h, w = a.shape[:2]
    ham = np.clip(np.round(a * 65535), 0, 65535).astype("<u2").tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb48le", "-s", f"{w}x{h}", "-i", "-",
                    "-pix_fmt", "rgb48be", yol], input=ham, check=True)


def a_f(f, bas, son=47):
    if bas == 38 and son == 47:
        return A_F[f]                                  # eski (B/C/E) tablo
    # F önizlemesi: ham çatı kareleri zaten ~%72 parlak (açık renk çatı + ışıklık bantları) → üs 1,4 rampanın ilk karesini
    # %85,7 yapıyordu (%80+ beyaz kare S1'de 3, t34'te 6, pay 0); üs 2,2 ile ilk rampa karesi %80'in altında kalır
    return 3.2 * ((f - bas + 1) / (son + 1.0 - bas)) ** 2.2


def son_kare(ham):
    ks = [int(x[2:6]) for x in os.listdir(ham) if x.startswith("k_") and x.endswith(".png")]
    if not ks:
        raise SystemExit(f"ham kare yok: {ham}")
    return max(ks)


def main(dizin, bas=33, son=None):
    ham = os.path.join(dizin, "ham")
    son = son_kare(ham) if son is None else son
    if not 0 < bas < son:
        raise SystemExit(f"--bas {bas} / son kare {son} uyumsuz")
    olcum = {"bas": bas, "son": son}
    for f in range(0, son + 1):
        src = os.path.join(ham, f"k_{f:04d}.png")
        if not os.path.exists(src):
            continue
        dst = os.path.join(dizin, f"k_{f:04d}.png")
        if f < bas:
            shutil.copyfile(src, dst)
            continue
        a, bit = oku(src)
        u = (f - bas) / float(son - bas)
        k = 0.55 * u * u
        a = 1 - (1 - a) * (1 - k)
        h, w = a.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        r2 = ((xx + 0.5 - w / 2) / (w / 2)) ** 2 + ((yy + 0.5 - h / 2) / (h / 2)) ** 2
        al = np.clip(a_f(f, bas, son) * (1.15 - 0.35 * r2), 0, 1)[..., None]
        a = a * (1 - al) + TON * al
        yaz(dst, a, bit)
        olcum[f] = {"ort_parlaklik": round(float(a.mean()), 4), "ort_rgb": [round(float(x), 4) for x in a.reshape(-1, 3).mean(0)],
                    "alfa_ort": round(float(al.mean()), 4)}
        print(f, olcum[f], flush=True)
    with open(os.path.join(dizin, "_parlama.json"), "w", encoding="utf-8") as fh:
        json.dump(olcum, fh, indent=1)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("dizin")
    ap.add_argument("--bas", type=int, default=33)        # F-B (t34a 36 kare); F-A 45; eski (B/C/E): 38
    ap.add_argument("--son", type=int, default=None)      # son kare (tam #FFF1DC); boş: ham/'daki en büyük numara
    g = ap.parse_args()
    main(g.dizin, g.bas, g.son)
