#!/usr/bin/env bash
# S2 son render: EEVEE 1920² TAA 64, PNG 16 bit → D:/soft/cop31-varlik/render-son/<klip>/k_%04d.png (0'dan) + <klip>.json.
# Her klip GPU kilidiyle (sahne.py --kilit; 10 s'de bir dener). t34b: ham/ (t34 kare 48–71) → parlama.py → k_0000–k_0023.
# VRAM: nvidia-smi kart toplamı 250 ms'de bir (render-son/_onizleme/s2-vram-<klip>.csv). Süre: s2-son.jsonl.
# C turu (brief §11): klipler arasında ≥ 20 s boşluk (öteki ajan kilidi yakalayabilsin; B'de 62 dk açlık);
# p6 broşürsüz (--yigin 0; §11.1 S2-C 2). t34b/k_*.png K'nin render-son/t34/ dizinine sabit bağlı (hard link):
# parlama.py yazmadan önce yalnız t34b'deki adlar silinir, t34/ eski içeriğini korur (K yeniden kurar).
# Kullanım: bash scripts/blender/s2/son.sh [klip ...]   (varsayılan: t34b l4 t45 l5 t56 p6)
set -uo pipefail
KOK="$(cd "$(dirname "$0")/../../.." && pwd)"
B=/d/soft/cop31-varlik/blender/blender-5.2.3-windows-x64/blender.exe
R=/d/soft/cop31-varlik/render-son
O=$R/_onizleme
LOG=$O/s2-son.jsonl
BOSLUK=${S2_BOSLUK:-20}   # klipler arası bekleme (s), kilit bırakıldıktan sonra
mkdir -p $O
KLIPLER=${*:-"t34b l4 t45 l5 t56 p6"}
ILK=1
for k in $KLIPLER; do
  if [ $ILK -eq 0 ]; then
    echo "[BOSLUK] $BOSLUK s $(date +%H:%M:%S)"
    sleep $BOSLUK
  fi
  ILK=0
  EK=""
  [ "$k" = "p6" ] && EK="--yigin 0"
  nvidia-smi --query-gpu=timestamp,memory.used,utilization.gpu --format=csv,noheader -lms 250 > $O/s2-vram-$k.csv &
  NV=$!
  echo "[BASLA] $k $(date +%H:%M:%S) $EK"
  touch $O/.s2-basla-$k
  "$B" -b --factory-startup -P "$KOK/scripts/blender/s2/sahne.py" -- --klip $k --kok $R --json --kilit --log $LOG $EK 2>&1 \
    | grep -E "^\[(P4|OZET|JSON|KILIT)\]|Traceback|Error" | grep -vE "KILIT\] dolu" | cut -c1-400
  kill $NV 2>/dev/null || true
  if [ "$k" = "t34b" ]; then
    if [ "$(find $R/t34b/ham -name 'k_00[4-7]?.png' -newer $O/.s2-basla-$k | wc -l)" -eq 24 ]; then   # bu koşunun 24 karesi
      rm -f $R/t34b/k_*.png   # sabit bağı kopar (t34/ dokunulmaz)
      python -X utf8 -P "$KOK/scripts/blender/s2/parlama.py" $R/t34b 48 | tail -n 24 > $O/s2-t34b-parlama.txt
    else
      echo "[HATA] t34b ham/ eksik; parlama atlandı"
    fi
  fi
  if [ "$k" != "p6" ]; then
    python -X utf8 -P "$KOK/scripts/blender/s2/kontak.py" kontak $k --kaynak $R/$k --cikis $O/s2-$k.jpg --baslik "son render EEVEE TAA 64" --mp4 0
  fi
  echo "[BITTI] $k $(date +%H:%M:%S)"
done
