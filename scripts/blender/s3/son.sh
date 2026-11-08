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
# S2 klibi + kasa (7 Kasım 2026; sahne.py S2_KASA): t34b l4 t45 — S2 kamerası/ışığı/parçaları aynen, bankoda kasa. t34b S2 gibi
#   <kök>/t34b/ham/ (t34 numarası 36–59) → S2 parlama.py → k_0000–k_0023; JSON S2'nin (s2/sahne.py --yalniz_json). Sonra
#   python -X utf8 -P scripts/icinden/t34-birlestir.py --kok <kök>. Ortam: S3_KOK (çıktı kökü), S2_DOKU (yazılı dokular, dile göre).
#   İngilizce: S2_DOKU=D:/soft/cop31-varlik/s2/doku-en S3_KOK=D:/soft/cop31-varlik/render-son-en bash scripts/blender/s3/son.sh t34b l4 t45 t79
# Kullanım: bash scripts/blender/s3/son.sh [klip ...]   (varsayılan: t78f t89 t9a tab tbc lc; G-B sonrası t79 = genel dal:
#   bash scripts/blender/s3/son.sh t79 → render-son/t79/ + t79.json; t79[59] ≡ t89[59], p9 değişmez)
set -uo pipefail
KOK="$(cd "$(dirname "$0")/../../.." && pwd)"
B=/d/soft/cop31-varlik/blender/blender-5.2.3-windows-x64/blender.exe
R=${S3_KOK:-/d/soft/cop31-varlik/render-son}
O=$R/_onizleme
echo "[BILGI] çıktı $R · yazılı dokular ${S2_DOKU:-D:/soft/cop31-varlik/s2/doku (varsayılan)}"
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
  if [ "$k" = "t34b" ] || [ "$k" = "l4" ] || [ "$k" = "t45" ]; then
    touch $O/.s3-basla-$k
    if [ "$k" = "t34b" ]; then out=$R/t34b/ham; rm -f $out/k_*.png; else out=$R/$k; rm -f $out/k_*.png; fi
    mkdir -p $out
    sahne --klip $k --kilit --out $out --log $LOG | tee $O/s3-son-gunluk-$k.txt
    "$B" -b --factory-startup -P "$KOK/scripts/blender/s2/sahne.py" -- --klip $k --kok $R --yalniz_json 2>&1 | grep -E "^\[(JSON|DOKU)\]|Traceback|Error"
    if [ "$k" = "t34b" ]; then
      yeni=0
      for i in $(seq 36 59); do [ "$out/k_$(printf %04d $i).png" -nt $O/.s3-basla-$k ] && yeni=$((yeni + 1)); done
      if [ $yeni -eq 24 ]; then
        rm -f $R/t34b/k_*.png   # t34/ sabit bağları eski karelerde kalır → t34-birlestir.py yeniden kurar
        python -X utf8 -P "$KOK/scripts/blender/s2/parlama.py" $R/t34b 36 3 36 | tail -n 24 > $O/s3-t34b-parlama.txt
      else
        echo "[HATA] t34b ham/ eksik ($yeni/24); parlama atlandı"
      fi
    fi
  elif [ "$k" = "t78f" ]; then
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
