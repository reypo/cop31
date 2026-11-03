"""Renk yardımcıları (yalnız numpy; hem sistem Python'unda hem Blender Python'unda çalışır):
sRGB ↔ doğrusal, CIELAB (D65), CIEDE2000, PNG okuma (ffmpeg → rgb48le, 8/16 bit fark etmez), yeniden örnekleme."""
import subprocess, json
import numpy as np


def lin(c):
    c = np.asarray(c, dtype=np.float64)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def enc(l):
    l = np.clip(np.asarray(l, dtype=np.float64), 0, None)
    return np.where(l <= 0.0031308, l * 12.92, 1.055 * l ** (1 / 2.4) - 0.055)


def hex2(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def hex_(c):
    c = np.clip(np.round(np.asarray(c) * 255), 0, 255).astype(int)
    return "#%02X%02X%02X" % tuple(c)


_M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
_WP = np.array([0.95047, 1.0, 1.08883])


def lab(srgb):
    xyz = lin(srgb) @ _M.T / _WP
    f = np.where(xyz > (6 / 29) ** 3, np.cbrt(xyz), xyz / (3 * (6 / 29) ** 2) + 4 / 29)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def de00(s1, s2):
    """CIEDE2000 (kL = kC = kH = 1); girdiler sRGB 0..1 (… × 3)."""
    L1, a1, b1 = np.moveaxis(lab(s1), -1, 0)
    L2, a2, b2 = np.moveaxis(lab(s2), -1, 0)
    C1, C2 = np.hypot(a1, b1), np.hypot(a2, b2)
    Cm = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = np.hypot(a1p, b1), np.hypot(a2p, b2)
    h1p = np.degrees(np.arctan2(b1, a1p)) % 360
    h2p = np.degrees(np.arctan2(b2, a2p)) % 360
    dLp = L2 - L1
    dCp = C2p - C1p
    dh = h2p - h1p
    dh = np.where(C1p * C2p == 0, 0, np.where(dh > 180, dh - 360, np.where(dh < -180, dh + 360, dh)))
    dHp = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dh / 2))
    Lpm = (L1 + L2) / 2
    Cpm = (C1p + C2p) / 2
    hs = h1p + h2p
    hpm = np.where(C1p * C2p == 0, hs, np.where(np.abs(h1p - h2p) <= 180, hs / 2, np.where(hs < 360, (hs + 360) / 2, (hs - 360) / 2)))
    T = 1 - 0.17 * np.cos(np.radians(hpm - 30)) + 0.24 * np.cos(np.radians(2 * hpm)) + 0.32 * np.cos(np.radians(3 * hpm + 6)) \
        - 0.20 * np.cos(np.radians(4 * hpm - 63))
    dtheta = 30 * np.exp(-(((hpm - 275) / 25) ** 2))
    Rc = 2 * np.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7))
    Sl = 1 + 0.015 * (Lpm - 50) ** 2 / np.sqrt(20 + (Lpm - 50) ** 2)
    Sc = 1 + 0.045 * Cpm
    Sh = 1 + 0.015 * Cpm * T
    Rt = -np.sin(np.radians(2 * dtheta)) * Rc
    return np.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh))


def png_oku(yol):
    """Her PNG (8/16 bit) → (H, W, 3) float64 0..1 (ffmpeg rgb48le)."""
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", yol],
                       capture_output=True, text=True, check=True)
    s = json.loads(o.stdout)["streams"][0]
    w, h = s["width"], s["height"]
    o = subprocess.run(["ffmpeg", "-v", "error", "-i", yol, "-f", "rawvideo", "-pix_fmt", "rgb48le", "-"], capture_output=True, check=True)
    return np.frombuffer(o.stdout, dtype="<u2").reshape(h, w, 3).astype(np.float64) / 65535.0


def png16_yaz(yol, a):
    h, w = a.shape[:2]
    ham = np.clip(np.round(a * 65535), 0, 65535).astype("<u2").tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb48le", "-s", f"{w}x{h}", "-i", "-",
                    "-pix_fmt", "rgb48be", yol], input=ham, check=True)


def bilinear(a, H, W):
    """(h, w, c) → (H, W, c) çift doğrusal (piksel merkezleri hizalı)."""
    h, w = a.shape[:2]
    ys = np.clip((np.arange(H) + 0.5) * h / H - 0.5, 0, h - 1)
    xs = np.clip((np.arange(W) + 0.5) * w / W - 0.5, 0, w - 1)
    y0 = np.floor(ys).astype(int); x0 = np.floor(xs).astype(int)
    y1 = np.minimum(y0 + 1, h - 1); x1 = np.minimum(x0 + 1, w - 1)
    fy = (ys - y0)[:, None, None]; fx = (xs - x0)[None, :, None]
    r0 = a[y0][:, x0] * (1 - fx) + a[y0][:, x1] * fx
    r1 = a[y1][:, x0] * (1 - fx) + a[y1][:, x1] * fx
    return r0 * (1 - fy) + r1 * fy


def kutu_bulanik(a, r):
    """(h, w, c) kutu bulanıklığı, yarıçap r (kenarlar kırpık pencere)."""
    out = a
    for eks in (0, 1):
        c = np.cumsum(np.pad(out, [(1, 0) if i == eks else (0, 0) for i in range(out.ndim)]), axis=eks)
        n = out.shape[eks]
        i = np.arange(n)
        lo = np.clip(i - r, 0, n); hi = np.clip(i + r + 1, 0, n)
        cnt = (hi - lo).astype(np.float64)
        if eks == 0:
            out = (c[hi] - c[lo]) / cnt[:, None, None]
        else:
            out = (c[:, hi] - c[:, lo]) / cnt[None, :, None]
    return out
