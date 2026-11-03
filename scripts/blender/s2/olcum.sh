#!/usr/bin/env bash
# Cycles 1920² 64 örnek (emission_sampling NONE, OIDN GPU, MB açık) ölçümü + aynı karelerin EEVEE 1920² TAA 64 karşılığı.
# Üç sahne × 2 kare: hol geniş plan (l4 0, 30), rotunda içi (l5 0, 30), banko makro (t78 F-B 43, 59; E 56, 65) + p8 plakası.
# F-B (§13.5): t78 60 kare; kare 43 ≈ E kare 56 ile aynı yay ilerlemesi (s 0,952 / 0,953; kuyruk F-B düşey iniş), 59 = son kare (≡ eski t56[71]).
# l4[0] = p4, l5[0] = p5, p8 (eski p6 plakası): tam boy posterler iki motorda. E turu: t56 → t78, p6 → p8. GPU kilidiyle (sahne.py --kilit).
# VRAM: nvidia-smi toplamı (boşta ~1,8–1,9 GB başka uygulamalar); süre: render_pre/post/write.
set -euo pipefail
KOK="$(cd "$(dirname "$0")/../../.." && pwd)"
B=/d/soft/cop31-varlik/blender/blender-5.2.3-windows-x64/blender.exe
R=/d/soft/cop31-varlik/render
O=$R/_onizleme/s2-olcum
LOG=$O/olcum.jsonl
mkdir -p $O
for spec in "hol:l4:0,30" "rotunda:l5:0,30" "banko:t78:43,59" "plaka:p8:0"; do
  IFS=: read ad klip kareler <<< "$spec"
  for motor in CYCLES EEVEE; do
    nvidia-smi --query-gpu=timestamp,memory.used,utilization.gpu --format=csv,noheader -lms 250 > $O/vram-$ad-$motor.csv &
    NV=$!
    "$B" -b --factory-startup -P "$KOK/scripts/blender/s2/sahne.py" -- --klip $klip --engine $motor --res 1920 --depth 16 \
      --kareler $kareler --kilit --log $LOG --out $O/$ad-$motor 2>&1 | grep -E "^\[(SURE|OZET|KILIT)\]|Traceback|Error" || true
    kill $NV 2>/dev/null || true
  done
done
