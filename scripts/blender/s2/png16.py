"""16 bit PNG okuma/yazma (ffmpeg rgb48le borusu; Pillow 16 bit RGB'yi 8 bite indiriyor). 8 bit PNG'ler Pillow ile."""
import subprocess, json
import numpy as np
from PIL import Image


def boyut_bit(yol):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,pix_fmt",
                        "-of", "json", yol], capture_output=True, text=True, check=True)
    s = json.loads(o.stdout)["streams"][0]
    return s["width"], s["height"], (16 if "48" in s["pix_fmt"] or "64" in s["pix_fmt"] else 8)


def oku(yol):
    """→ (H, W, 3) float64 0..1, bit derinliği."""
    w, h, bit = boyut_bit(yol)
    if bit == 8:
        return np.asarray(Image.open(yol).convert("RGB"), dtype=np.float64) / 255.0, 8
    o = subprocess.run(["ffmpeg", "-v", "error", "-i", yol, "-f", "rawvideo", "-pix_fmt", "rgb48le", "-"], capture_output=True, check=True)
    a = np.frombuffer(o.stdout, dtype="<u2").reshape(h, w, 3)
    return a.astype(np.float64) / 65535.0, 16


def yaz(yol, a, bit):
    if bit == 8:
        Image.fromarray(np.clip(np.round(a * 255), 0, 255).astype(np.uint8)).save(yol, compress_level=6)
        return
    h, w = a.shape[:2]
    ham = np.clip(np.round(a * 65535), 0, 65535).astype("<u2").tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb48le", "-s", f"{w}x{h}", "-i", "-",
                    "-pix_fmt", "rgb48be", yol], input=ham, check=True)
