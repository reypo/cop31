#!/usr/bin/env bash
# S2 EEVEE önizleme turu (960², 8 bit, TAA 16): tüm klipler + JSON fragmanları + parlama + kontak sayfaları + mp4.
# Kullanım: bash scripts/blender/s2/onizleme.sh [klip ...]   (varsayılan: hepsi)
set -euo pipefail
KOK="$(cd "$(dirname "$0")/../../.." && pwd)"
B=/d/soft/cop31-varlik/blender/blender-5.2.3-windows-x64/blender.exe
R=/d/soft/cop31-varlik/render
LOG=$R/_onizleme/s2-olcum.jsonl
mkdir -p $R/_onizleme
KLIPLER=${*:-"t34b l4 t45 l5 t56 p6"}
for k in $KLIPLER; do
  "$B" -b --factory-startup -P "$KOK/scripts/blender/s2/sahne.py" -- --klip $k --onizleme --kok $R --json --log $LOG 2>&1 \
    | grep -E "^\[(P4|SURE|OZET|JSON)\]|Traceback|Error" | grep -vE "^\[SURE\]" || true
  if [ "$k" = "t34b" ]; then python -X utf8 -P "$KOK/scripts/blender/s2/parlama.py" $R/_onizleme/s2-t34b > /dev/null; fi
  if [ "$k" != "p6" ]; then python -X utf8 -P "$KOK/scripts/blender/s2/kontak.py" kontak $k; fi
done
