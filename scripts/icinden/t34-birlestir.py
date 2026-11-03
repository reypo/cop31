# /icinden v3 — t34'ü iki sahneden tek klasöre birleştirir (docs/brief-icinden-3.md §9.1, §11.2-1).
#
#   python -X utf8 -P scripts/icinden/t34-birlestir.py [--kok D:/soft/cop31-varlik/render-son]
#
# S1 `t34a/k_0000–0047` → `t34/k_0000–0047`, S2 `t34b/k_<bas>–<bas+23>` → `t34/k_0048–0071` (NTFS sabit bağ: disk
# kullanımı 0, kopya yok). `t34/` önce tümüyle silinir (yalnız bağlar gider, t34a/t34b kareleri kalır), sonra yeniden
# kurulur; `t34.json` iki fragmandan yazılır. Doğrulama: her bağ kaynağıyla aynı dosya (samefile), kare 47 ↔ 48
# 16 bit fark (ffmpeg rgb48le), ikisinin de #FFF1DC tonu. t34a ya da t34b yeniden render edilirse bu betik yeniden
# çalıştırılır (kodla.mjs ve kodlama-dogrula.py `t34/`'ü doğrudan okur).
import argparse
import json
import os
import shutil
import subprocess
import sys

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--kok", default="D:/soft/cop31-varlik/render-son")
a = ap.parse_args()
R = a.kok
oku = lambda ad: json.load(open(f"{R}/{ad}.json", encoding="utf8"))
A, B = oku("t34a"), oku("t34b")
NA, NB = A["kare"], B["kare"]
assert len(A["kadraj_m"]) == NA and len(B["kadraj_m"]) == NB, "kadraj_m uzunluğu kare sayısıyla uyuşmuyor"
bas_b = B.get("kare_baslangic", 0)
if not os.path.exists(f"{R}/t34b/k_{bas_b:04d}.png"):
    bas_b = NA  # eski düzen: t34b dosyaları 48'den numaralı
hedef = f"{R}/t34"
if os.path.isdir(hedef):
    shutil.rmtree(hedef)
os.makedirs(hedef)
bag = []
for i in range(NA):
    bag.append((f"{R}/t34a/k_{i:04d}.png", f"{hedef}/k_{i:04d}.png"))
for i in range(NB):
    bag.append((f"{R}/t34b/k_{bas_b + i:04d}.png", f"{hedef}/k_{NA + i:04d}.png"))
for s, d in bag:
    os.link(s, d)
ayni = sum(os.path.samefile(s, d) for s, d in bag)
assert ayni == len(bag), f"sabit bağ doğrulaması: {ayni}/{len(bag)}"


def kare16(yol):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", yol, "-f", "rawvideo", "-pix_fmt", "rgb48le", "-"], capture_output=True, check=True)
    return np.frombuffer(r.stdout, "<u2").reshape(1920, 1920, 3) if len(r.stdout) == 1920 * 1920 * 6 else None


k47, k48 = kare16(f"{hedef}/k_{NA - 1:04d}.png"), kare16(f"{hedef}/k_{NA:04d}.png")
fark16 = np.abs(k47.astype(np.int32) - k48.astype(np.int32))
ort = k47.reshape(-1, 3).mean(0) / 65535
lum = float(ort @ np.array([0.2126, 0.7152, 0.0722]))
FFF1DC = np.array([255, 241, 220]) * 257
dikis = {
    "ort_rgb_8bit": [round(float(v) * 255, 2) for v in ort],
    "luma709": round(lum, 4),
    "ort_rgb": round(float(ort.mean()), 4),
    "k47_tam_FFF1DC_oran": round(float((k47 == FFF1DC).all(-1).mean()), 6),
    "k48_tam_FFF1DC_oran": round(float((k48 == FFF1DC).all(-1).mean()), 6),
    "fark_47_48_255": round(float(fark16.mean()) / 257, 4),
    "fark_47_48_maks_16bit": int(fark16.max()),
}
t = {
    "ad": "t34",
    "fps": A.get("fps", 30),
    "kare": NA + NB,
    "sure": round((NA + NB) / A.get("fps", 30), 4),
    "master": 1920,
    "kaynak": f"birleşik (scripts/icinden/t34-birlestir.py): S1 t34a k_0000–{NA - 1:04d} → t34 0–{NA - 1} ‖ S2 t34b k_{bas_b:04d}–{bas_b + NB - 1:04d} → t34 {NA}–{NA + NB - 1} (NTFS sabit bağ; t34a/t34b yeniden render edilirse betik yeniden çalıştırılır)",
    "kadraj_m": A["kadraj_m"] + B["kadraj_m"],
    "kadraj_tanimi": {f"0-{NA - 1}": A.get("kadraj_tanimi") or A.get("kadraj_tanim"), f"{NA}-{NA + NB - 1}": B.get("kadraj_tanimi") or B.get("kadraj_tanim")},
    "gunes_utc": A.get("gunes_utc"),
    "parcalar": [
        {"ad": "t34a", "kare": NA, "t34_kare": [0, NA - 1], "kaynak": A.get("kaynak"), "not": A.get("not"), "c_turu": A.get("c_turu")},
        {"ad": "t34b", "kare": NB, "t34_kare": [NA, NA + NB - 1], "dosya_baslangic": bas_b, "kaynak": B.get("kaynak"), "uretim": B.get("uretim"), "not": B.get("not")},
    ],
    "dikis_47_48": dikis,
    "kamera": {"t34a": A.get("kamera"), "t34b": B.get("kamera")},
}
json.dump(t, open(f"{R}/t34.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(f"{len(bag)} sabit bağ (samefile {ayni}/{len(bag)}); kadraj {len(t['kadraj_m'])}: {t['kadraj_m'][0]} … {t['kadraj_m'][NA - 1]} | {t['kadraj_m'][NA]} … {t['kadraj_m'][-1]}")
print("dikiş 47↔48:", json.dumps(dikis, ensure_ascii=False))
if dikis["fark_47_48_maks_16bit"] != 0:
    print("UYARI: kare 47 ↔ 48 farkı 0 değil", file=sys.stderr)
    sys.exit(2)
