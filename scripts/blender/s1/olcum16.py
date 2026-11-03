"""PNG16 ölçüm yardımcıları (sistem Python: numpy + ffmpeg). C turu kabul ölçütleri bunlarla ölçülür
(brief §11.1): ardışık ortalama mutlak fark (/255), ortalama CIEDE2000, ortalama luma.

    from olcum16 import oku, fark255, de00, luma
    a = oku("D:/soft/cop31-varlik/render-son/t23/k_0083.png")      # (h, w, 3) float32, 0–1, kodlanmış sRGB

fark255: |a − b| ortalaması × 255 (16 bit duyarlıkla). de00: piksel başına CIEDE2000, sonra ortalama (sRGB D65).
luma: kodlanmış değerlerde Rec.709 ağırlıkları (0,2126 R' + 0,7152 G' + 0,0722 B'), ortalama, %.
"""
import json
import subprocess

import numpy as np


def bilgi(yol):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,pix_fmt",
                        "-of", "json", yol], capture_output=True, text=True, check=True)
    s = json.loads(o.stdout)["streams"][0]
    return s["width"], s["height"], s["pix_fmt"]


def oku(yol):
    """PNG (8 ya da 16 bit) → float32 (h, w, 3), 0–1."""
    w, h, pf = bilgi(yol)
    o = subprocess.run(["ffmpeg", "-v", "error", "-i", yol, "-f", "rawvideo", "-pix_fmt", "rgb48le", "-"],
                       capture_output=True, check=True)
    return (np.frombuffer(o.stdout, dtype="<u2").reshape(h, w, 3).astype(np.float32) / 65535.0)


def fark255(a, b):
    return float(np.abs(a - b).mean(dtype=np.float64) * 255.0)


def luma(a):
    return float((0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]).mean(dtype=np.float64) * 100.0)


def lab(a):
    c = a.astype(np.float64)
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def _de00(i1, i2):
    L1, a1, b1 = np.moveaxis(lab(i1), -1, 0); L2, a2, b2 = np.moveaxis(lab(i2), -1, 0)
    C1 = np.hypot(a1, b1); C2 = np.hypot(a2, b2); Cm = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)))
    a1p, a2p = a1 * (1 + G), a2 * (1 + G)
    C1p, C2p = np.hypot(a1p, b1), np.hypot(a2p, b2)
    h1p = np.degrees(np.arctan2(b1, a1p)) % 360; h2p = np.degrees(np.arctan2(b2, a2p)) % 360
    dLp = L2 - L1; dCp = C2p - C1p
    dh = h2p - h1p; dh = np.where(dh > 180, dh - 360, np.where(dh < -180, dh + 360, dh)); dh = np.where(C1p * C2p == 0, 0, dh)
    dHp = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dh / 2))
    Lpm = (L1 + L2) / 2; Cpm = (C1p + C2p) / 2
    hs = h1p + h2p
    hpm = np.where(C1p * C2p == 0, hs, np.where(np.abs(h1p - h2p) <= 180, hs / 2, np.where(hs < 360, (hs + 360) / 2, (hs - 360) / 2)))
    T = (1 - 0.17 * np.cos(np.radians(hpm - 30)) + 0.24 * np.cos(np.radians(2 * hpm)) + 0.32 * np.cos(np.radians(3 * hpm + 6))
         - 0.20 * np.cos(np.radians(4 * hpm - 63)))
    dth = 30 * np.exp(-(((hpm - 275) / 25) ** 2)); Rc = 2 * np.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7))
    SL = 1 + 0.015 * (Lpm - 50) ** 2 / np.sqrt(20 + (Lpm - 50) ** 2); SC = 1 + 0.045 * Cpm; SH = 1 + 0.015 * Cpm * T
    RT = -np.sin(np.radians(2 * dth)) * Rc
    return np.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH))


def de00(i1, i2, parca=256):
    """Ortalama CIEDE2000; bellek için satır parçalarıyla."""
    top, n = 0.0, 0
    for y in range(0, i1.shape[0], parca):
        d = _de00(i1[y:y + parca], i2[y:y + parca])
        top += float(d.sum()); n += d.size
    return top / n
