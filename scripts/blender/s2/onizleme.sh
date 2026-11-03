#!/usr/bin/env bash
# S2 EEVEE önizleme turu (960², 8 bit, TAA 16): klipler + JSON fragmanları + parlama + kontak sayfaları + mp4.
# E turu (brief §12.3 "Önizleme"): GPU kilidiyle (--kilit); önce çarpışma raporu (CPU, render yok); p6/p7 son-kare
# kopyaları (_onizleme/s2-p6.png, s2-p7.png); VRAM: her klipte nvidia-smi 250 ms örnekleme + 1920² TAA 64 VRAM/okunurluk
# probu (t56 son = p6, t67 son = p7, t78 son = p8 eşdeğeri; son render ayarlarıyla) → _onizleme/s2-vram-*.csv, [VRAM].
# F turu (brief §13): çıktı adları S2_ONEK ile ayrılır (varsayılan "s2-f-": kareler _onizleme/s2-f-<klip>/, kontak sayfası
# s2-f-<klip>.png (12 kare, 4 sütun), mp4 s2-f-<klip>-d|y.mp4, p6/p7 s2-f-p6.png / s2-f-p7.png, JSON _onizleme/s2-f-json/,
# çarpışma s2-f-carpisma.json; t67'de 8 kare tam boy s2-f-t67-<kare>.png). E'nin s2-<klip>/ önizlemeleri ezilmez.
# Son kare dizinleri klibin JSON'undan (kare − 1) okunur (profil süreleri sahne.py SON_KARE). Parlama: parlama.py (F-B: t34 kare 36–38; "--profil eski" → 48–55).
# Ortam: S2_EK="--profil eski …" (sahne.py'ye ek argüman), S2_ONEK (çıktı öneki; E biçimi için "s2-"), S2_PROBU=0
# (1920² probu atla). F-B süreleri (§13.5): t34b 36–59, t45 54, t56 54, t67 48, t78 60 kare; p6 = t56[53], p7 = t67[47].
# Kullanım: bash scripts/blender/s2/onizleme.sh [klip ...]   (varsayılan: t34b l4 t45 t56 t67 t78)
set -uo pipefail
KOK="$(cd "$(dirname "$0")/../../.." && pwd)"
B=/d/soft/cop31-varlik/blender/blender-5.2.3-windows-x64/blender.exe
R=/d/soft/cop31-varlik/render
O=$R/_onizleme
LOG=$O/s2-olcum.jsonl
EKG=${S2_EK:-}
if echo " $EKG " | grep -q -- " --profil eski "; then T34B_BAS=48; PARLAMA_N=8; else T34B_BAS=36; PARLAMA_N=3; fi   # F-B / E
ON=${S2_ONEK:-s2-f-}
JK=$O/${ON}json            # JSON fragmanları (render/<klip>.json E önizlemesinindir; ezilmesin)
VRAM_ESIK=7782            # MiB (7,6 GiB; §12.6)
mkdir -p $O $JK
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

son_kare_no() {   # $1 klip → son kare dizini (JSON "kare" − 1)
  python -X utf8 -c "import json,sys; print(json.load(open(sys.argv[1], encoding='utf-8'))['kare'] - 1)" "$JK/$1.json"
}

# 0) çarpışma (CPU): t56/t67/t78 + (F) t45 montaj sürerken + t34b ↔ sütun / kanopi / totem / sol bank / kiosk / duvar / bitki
sahne --klip t56 --carpisma --kok $JK --carpisma_json $O/${ON}carpisma.json

for k in $KLIPLER; do
  olcerek ${ON}$k --klip $k --onizleme --kok $JK --out $O/${ON}$k --json --kilit --log $LOG
  if [ "$k" = "t34b" ]; then python -X utf8 -P "$KOK/scripts/blender/s2/parlama.py" $O/${ON}t34b 0 $PARLAMA_N $T34B_BAS > /dev/null; fi
  if [ "$k" = "t56" ]; then n=$(son_kare_no t56); cp $O/${ON}t56/k_$(printf %04d $n).png $O/${ON}p6.png && echo "[SON-KARE] p6 ← ${ON}t56/k_$(printf %04d $n).png"; fi
  if [ "$k" = "t67" ]; then
    n=$(son_kare_no t67); cp $O/${ON}t67/k_$(printf %04d $n).png $O/${ON}p7.png && echo "[SON-KARE] p7 ← ${ON}t67/k_$(printf %04d $n).png"
    for i in 0 1 2 3 4 5 6 7; do f=$(( (i * n + 3) / 7 )); cp $O/${ON}t67/k_$(printf %04d $f).png $O/${ON}t67-$(printf %04d $f).png; done
  fi
  python -X utf8 -P "$KOK/scripts/blender/s2/kontak.py" kontak $k --kaynak $O/${ON}$k --cikis $O/${ON}$k.png --n 12 --sut 4 --karo 400 \
    --baslik "önizleme EEVEE ($ON)" --mp4_onek ${ON}
done

# 1920² TAA 64 probu: VRAM tepesi (son render ayarları) + p6/p7 tam çözünürlük okunurluk kareleri + t78 sonu (≡ eski t56[71])
if [ "${S2_PROBU:-1}" = "1" ]; then
  for k in t56 t67 t78; do
    f=$(son_kare_no $k)
    olcerek probu-$k --klip $k --kareler $f --res 1920 --depth 16 --kilit --log $LOG --kok $JK --out $O/${ON}probu-$k
  done
fi
