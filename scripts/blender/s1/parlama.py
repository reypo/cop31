"""t34a parlaması (B turu, orkestratör kararı 6): görüntü uzayında, S2'nin parlama.py kalıbıyla.

Render (sahne.py --klip t34a, varsayılan --ham t34a) <dizin>/ham/k_####.png yazar; bu betik <dizin>/k_####.png üretir
(0–47, 16/8 bit korunur). Kare 0–37 aynen kopyalanır. Kare 38'den rampa: önce perde (screen) aydınlatma
k_f = 0,55·u², sonra ışıklığın ekran konumundan (kare 30'dan sonra merkez) yayılan #FFF1DC:
  α(x, y, f) = sat(a_f · (1,15 − 0,35 r²)),  r = merkezden uzaklık / yarı kenar,  u = (f − 38) / 9
Kare 47'de α ≡ 1 → tam #FFF1DC (S2 t34b kare 48 ile birebir, aynı 16 bit yuvarlama). Kare 44–47 ort. ≥ %92.

  python -X utf8 -P scripts/blender/s1/parlama.py D:/soft/cop31-varlik/render-son/t34a
"""
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


def main(dizin):
    ham = os.path.join(dizin, "ham")
    olcum = {}
    for f in range(0, 48):
        src = os.path.join(ham, f"k_{f:04d}.png")
        if not os.path.exists(src):
            continue
        dst = os.path.join(dizin, f"k_{f:04d}.png")
        if f < 38:
            shutil.copyfile(src, dst)
            continue
        a, bit = oku(src)
        u = (f - 38) / 9.0
        k = 0.55 * u * u
        a = 1 - (1 - a) * (1 - k)
        h, w = a.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        r2 = ((xx + 0.5 - w / 2) / (w / 2)) ** 2 + ((yy + 0.5 - h / 2) / (h / 2)) ** 2
        al = np.clip(A_F[f] * (1.15 - 0.35 * r2), 0, 1)[..., None]
        a = a * (1 - al) + TON * al
        yaz(dst, a, bit)
        olcum[f] = {"ort_parlaklik": round(float(a.mean()), 4), "ort_rgb": [round(float(x), 4) for x in a.reshape(-1, 3).mean(0)],
                    "alfa_ort": round(float(al.mean()), 4)}
        print(f, olcum[f], flush=True)
    with open(os.path.join(dizin, "_parlama.json"), "w", encoding="utf-8") as fh:
        json.dump(olcum, fh, indent=1)


if __name__ == "__main__":
    main(sys.argv[1])
