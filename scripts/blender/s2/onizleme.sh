#!/usr/bin/env bash
# S2 EEVEE önizleme turu (960², 8 bit, TAA 16): klipler + JSON fragmanları + parlama + kontak sayfaları + mp4.
# E turu (brief §12.3 "Önizleme"): GPU kilidiyle (--kilit); önce çarpışma raporu (CPU, render yok); p6/p7 son-kare
# kopyaları (_onizleme/s2-p6.png, s2-p7.png); VRAM: her klipte nvidia-smi 250 ms örnekleme + 1920² TAA 64 VRAM/okunurluk
# probu (t56 k59 = p6, t67 k47 = p7, t78 k65 = p8 eşdeğeri; son render ayarlarıyla) → _onizleme/s2-vram-*.csv, [VRAM].
# Ortam: S2_EK="--yikama_w 300 …" (sahne.py'ye ek argüman), S2_PROBU=0 (1920² probu atla).
# Kullanım: bash scripts/blender/s2/onizleme.sh [klip ...]   (varsayılan: t34b l4 t45 t56 t67 t78)
set -uo pipefail
KOK="$(cd "$(dirname "$0")/../../.." && pwd)"
B=/d/soft/cop31-varlik/blender/blender-5.2.3-windows-x64/blender.exe
R=/d/soft/cop31-varlik/render
O=$R/_onizleme
LOG=$O/s2-olcum.jsonl
EKG=${S2_EK:-}
VRAM_ESIK=7782            # MiB (7,6 GiB; §12.6)
mkdir -p $O
KLIPLER=${*:-"t34b l4 t45 t56 t67 t78"}

sahne() {
  "$B" -b --factory-startup -P "$KOK/scripts/blender/s2/sahne.py" -- "$@" $EKG 2>&1 \
    | grep --line-buffered -E "^\[(P4|OZET|JSON|DOKU|UYARI|CARPISMA|KILIT)\]|Traceback|Error" | grep --line-buffered -vE "KILIT\] dolu" \
    | awk '{print strftime("%H:%M:%S"), substr($0, 1, 500); fflush()}'   # S2c: zaman damgası (VRAM penceresi için)
}

vram_ozet() {   # S2c: pencere = bu koşunun kilit süresi (günlükteki "[KILIT] alındı" → "bırakıldı"); öncesi boşta, başka ajan dışarıda
  local f=$O/s2-vram-$1.csv g=$O/s2-gunluk-$1.txt t0="" t1=""
  [ -s "$f" ] || { echo "[VRAM] $1: örnek yok"; return; }
  if [ -s "$g" ]; then t0=$(grep "\[KILIT\] alındı" "$g" | tail -1 | cut -c1-8); t1=$(grep "\[KILIT\] bırakıldı" "$g" | tail -1 | cut -c1-8); fi
  awk -F', ' -v k="$1" -v e=$VRAM_ESIK -v t0="$t0" -v t1="$t1" '{s=substr($1, 12, 8); m=$2+0}
    t0 != "" && s < t0 {b=m; next}  t1 != "" && s > t1 {next}  {n++; if (b == "") b=m; if (m > t) t=m}
    END{d=(t<=e)?"✓":"✗"; printf "[VRAM] %s tepe %d MiB (%.2f GiB), boşta %d MiB, render payı %d MiB, eşik %d MiB %s; pencere %s–%s, %d örnek\n",
        k, t, t/1024, b, t-b, e, d, (t0 == "" ? "tümü" : t0), (t1 == "" ? "son" : t1), n}' "$f" \
    | tee -a $O/s2-vram.txt
}

olcerek() {   # $1 etiket, sonrası sahne argümanları: nvidia-smi örneklemesiyle
  local et=$1; shift
  nvidia-smi --query-gpu=timestamp,memory.used,utilization.gpu --format=csv,noheader -lms 250 > $O/s2-vram-$et.csv &
  local NV=$!
  sahne "$@" | tee $O/s2-gunluk-$et.txt
  kill $NV 2>/dev/null || true
  vram_ozet $et
}

# 0) çarpışma (CPU): üç kamera yolu ↔ sütun / kanopi / totem / sol bank / kiosk / duvar / bitki, eşik 0,25 m
sahne --klip t56 --carpisma --kok $R

for k in $KLIPLER; do
  olcerek $k --klip $k --onizleme --kok $R --json --kilit --log $LOG
  if [ "$k" = "t34b" ]; then python -X utf8 -P "$KOK/scripts/blender/s2/parlama.py" $O/s2-t34b > /dev/null; fi
  [ "$k" = "t56" ] && cp $O/s2-t56/k_0059.png $O/s2-p6.png 2>/dev/null && echo "[SON-KARE] p6 ← s2-t56/k_0059.png"
  [ "$k" = "t67" ] && cp $O/s2-t67/k_0047.png $O/s2-p7.png 2>/dev/null && echo "[SON-KARE] p7 ← s2-t67/k_0047.png"
  python -X utf8 -P "$KOK/scripts/blender/s2/kontak.py" kontak $k
done

# 1920² TAA 64 probu: VRAM tepesi (son render ayarları) + p6/p7 tam çözünürlük okunurluk kareleri + t78 sonu (≡ eski t56[71])
if [ "${S2_PROBU:-1}" = "1" ]; then
  for spec in "t56:59" "t67:47" "t78:65"; do
    IFS=: read k f <<< "$spec"
    olcerek probu-$k --klip $k --kareler $f --res 1920 --depth 16 --kilit --log $LOG --out $O/s2-probu-$k
  done
fi
