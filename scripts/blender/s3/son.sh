#!/usr/bin/env bash
# S3 SON RENDER (G-B; kullanıcı önizlemeyi onayladıktan sonra). EEVEE 1920² TAA 64, 16 bit PNG, GPU kilidi, sıralı.
# BU BETİK G-A'DA ÇALIŞTIRILMADI. render-son'a yazar:
#   render-son/t78/      ← t78f (S2 t78 + kasa; S2'nin t78.json'u korunur — kamera/broşür dikdörtgeni aynı). Eski kareler
#                          render-son-f/t78/'e taşınır. Son kare (59) S2 gibi ayrı oturumda yeniden işlenir (EEVEE dizide son
#                          kareyi önceki kareye bağlı işliyor; §12.6 / S2 son.sh notu) → t78f[59] ≡ t89[0].
#   render-son/t89 t9a tab tbc lc/  + <klip>.json (S3 JSON: kamera, ilerleme, büyüme, ışık, çapalar, kirpimY_oneri)
#   render-son/p9 pa pb/ (son-kare kopyası) + p9/pa/pb.json (tip son-kare);  render-son/pc/ = lc[0] + pc.json (dongu-ilk)
# Geri klip yalnız r98 = t89 tersi (kodla.mjs `reverse`; render yok). kodla.mjs açık ad tablosuna: t89 t9a tab tbc lc r98,
# CRF önerisi AV1 t89/t9a/tab/tbc 32, lc 30, r98 36 (t78/r87 ile aynı aile). Yatay kırpım: <klip>.json kirpimY_oneri.
# GPU tahmini (önizleme probundan; rapor.md): bkz. s3-probe-*. Ortam: S3_EK (sahne.py ek argümanları; K5 sonrası "--gok altin"
# kullanılmaz). Görünüş: G-B K10 varsayılanları sahne.py'de (gövde ×1,3, kök +1 mm, nem 0,7, spot +5°, yaprak doy 0,70,
# tbc g_yaprak 0,05–0,97 kübik) → ek ortam değişkeni gerekmez; ölçümler BENIOKU "K10" ve _onizleme/s3b-*.
# Kullanım: bash scripts/blender/s3/son.sh [klip ...]   (varsayılan: t78f t89 t9a tab tbc lc)
set -uo pipefail
KOK="$(cd "$(dirname "$0")/../../.." && pwd)"
B=/d/soft/cop31-varlik/blender/blender-5.2.3-windows-x64/blender.exe
R=/d/soft/cop31-varlik/render-son
O=$R/_onizleme
LOG=$O/s3-son.jsonl
EKG=${S3_EK:-}
BOSLUK=${S3_BOSLUK:-20}
mkdir -p $O
KLIPLER=${*:-"t78f t89 t9a tab tbc lc"}
S3="$KOK/scripts/blender/s3"

sahne() {
  "$B" -b --factory-startup -P "$S3/sahne.py" -- "$@" $EKG 2>&1 \
    | grep --line-buffered -E "^\[(S3|OZET|JSON|KILIT|SON-KARE|IMAJ|SURE)\]|Traceback|Error" | grep --line-buffered -vE "KILIT\] dolu" \
    | awk '{print strftime("%H:%M:%S"), substr($0, 1, 400); fflush()}'
}

ILK=1
for k in $KLIPLER; do
  [ $ILK -eq 0 ] && sleep $BOSLUK
  ILK=0
  nvidia-smi --query-gpu=timestamp,memory.used,utilization.gpu --format=csv,noheader -lms 250 > $O/s3-son-vram-$k.csv &
  NV=$!
  echo "[BASLA] $k $(date +%H:%M:%S)"
  if [ "$k" = "t78f" ]; then
    mkdir -p /d/soft/cop31-varlik/render-son-f/t78 && mv $R/t78/k_*.png /d/soft/cop31-varlik/render-son-f/t78/ 2>/dev/null
    sahne --klip t78f --kilit --out $R/t78 --log $LOG | tee $O/s3-son-gunluk-$k.txt
    sleep 5
    sahne --klip t78f --kareler 59 --kilit --out $R/t78 --log $LOG
  else
    rm -f $R/$k/k_*.png
    sahne --klip $k --kilit --json --kok $R --log $LOG | tee $O/s3-son-gunluk-$k.txt
  fi
  kill $NV 2>/dev/null || true
  case $k in
    t89) mkdir -p $R/p9 && cp $R/t89/k_0059.png $R/p9/k_0000.png && sahne --klip p9 --kok $R ;;
    t9a) mkdir -p $R/pa && cp $R/t9a/k_0053.png $R/pa/k_0000.png && sahne --klip pa --kok $R ;;
    tab) mkdir -p $R/pb && cp $R/tab/k_0053.png $R/pb/k_0000.png && sahne --klip pb --kok $R ;;
    lc)  mkdir -p $R/pc && cp $R/lc/k_0000.png $R/pc/k_0000.png && sahne --klip pc --kok $R ;;
  esac
  echo "[BITTI] $k $(date +%H:%M:%S)"
done
