"""Blender'ı çalıştırıp süreç RAM tepesini (psutil, özel çalışma kümesi + RSS) ve GPU belleğini (nvidia-smi,
makine toplamı) örnekler; isteğe bağlı GPU kilidi (brief §9.3).

    python -X utf8 -P calis.py [--kilit] [--etiket ad] -- <sahne.py argümanları>

Kilit: D:/soft/cop31-varlik/render/.gpu-kilit/ (os.mkdir atomik) + sahip.txt; alınamazsa 10 sn'de bir dener;
45 dk'dan eski kilit ölü sayılır. Bitince silinir.
"""
import json
import os
import shutil
import subprocess
import sys
import threading
import time

import psutil

BLENDER = "D:/soft/cop31-varlik/blender/blender-5.2.3-windows-x64/blender.exe"
KILIT = "D:/soft/cop31-varlik/render/.gpu-kilit"
HERE = os.path.dirname(os.path.abspath(__file__))

args = sys.argv[1:]
dis = args[:args.index("--")] if "--" in args else args      # calis.py'nin kendi bayrakları yalnız "--" öncesinde
kilit = "--kilit" in dis                                     # (sahne.py --kilit klip başına kilidi kendisi alır)
etiket = "s1"
if "--etiket" in dis:
    etiket = dis[dis.index("--etiket") + 1]
ic = args[args.index("--") + 1:] if "--" in args else []


def gpu_mb():
    try:
        o = subprocess.run(["nvidia-smi", "--query-gpu=memory.used,utilization.gpu", "--format=csv,noheader,nounits"],
                           capture_output=True, text=True, timeout=5).stdout.strip().split(",")
        return int(o[0]), int(o[1])
    except Exception:
        return -1, -1


def kilit_al():
    while True:
        try:
            os.mkdir(KILIT)
            with open(os.path.join(KILIT, "sahip.txt"), "w", encoding="utf-8") as f:
                f.write(f"S1 {etiket} pid={os.getpid()} {time.strftime('%Y-%m-%dT%H:%M:%S')} {time.time():.0f}\n")
            return
        except FileExistsError:
            try:
                t = float(open(os.path.join(KILIT, "sahip.txt"), encoding="utf-8").read().split()[-1])
                if time.time() - t > 2700:
                    shutil.rmtree(KILIT, ignore_errors=True)
                    continue
            except Exception:
                pass
            time.sleep(10)


if kilit:
    t_k = time.time()
    kilit_al()
    print(f"[KILIT] alındı ({time.time() - t_k:.0f} sn beklendi)", flush=True)

g0, _ = gpu_mb()
t0 = time.time()
p = subprocess.Popen([BLENDER, "-b", "--factory-startup", "-P", os.path.join(HERE, "sahne.py"), "--"] + ic,
                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
ps = psutil.Process(p.pid)
tepe = {"rss": 0, "private": 0, "gpu": 0, "gpu_kul": 0}
bitti = False


def ornekle():
    while not bitti:
        try:
            m = ps.memory_full_info()
            tepe["rss"] = max(tepe["rss"], m.rss)
            tepe["private"] = max(tepe["private"], getattr(m, "private", m.uss))
        except Exception:
            pass
        g, u = gpu_mb()
        tepe["gpu"] = max(tepe["gpu"], g); tepe["gpu_kul"] = max(tepe["gpu_kul"], u)
        time.sleep(0.5)


th = threading.Thread(target=ornekle, daemon=True); th.start()
for line in p.stdout:
    if any(k in line for k in ("[S1", "[KARE]", "Error", "error", "Traceback", "File \"", "line ", "KILIT")):
        print(line.rstrip(), flush=True)
p.wait()
bitti = True
th.join(timeout=2)
if kilit:
    shutil.rmtree(KILIT, ignore_errors=True)
oz = {"etiket": etiket, "cikis_kodu": p.returncode, "sure_sn": round(time.time() - t0, 1),
      "ram_tepe_rss_gb": round(tepe["rss"] / 2 ** 30, 2), "ram_tepe_ozel_gb": round(tepe["private"] / 2 ** 30, 2),
      "gpu_bellek_tepe_mb_makine": tepe["gpu"], "gpu_bellek_baslangic_mb": g0, "gpu_kullanim_tepe": tepe["gpu_kul"],
      "args": " ".join(ic)}
print("[OZET]", json.dumps(oz, ensure_ascii=False), flush=True)
with open("D:/soft/cop31-varlik/s1/calis.jsonl", "a", encoding="utf-8") as f:
    f.write(json.dumps(oz, ensure_ascii=False) + "\n")
sys.exit(p.returncode)
