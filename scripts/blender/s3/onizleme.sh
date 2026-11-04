#!/usr/bin/env bash
# S3 önizleme turu (G-A; brief-icinden-3 §14.2): EEVEE 960² TAA 16, GPU kilidiyle (--kilit), klipler sıralı (aynı anda tek
# Blender süreci). Çıktılar render/_onizleme/:
#   s3-<klip>/k_%04d.png (bütün kareler)   s3-<klip>.png (kontak, 12 kare)   s3-<klip>-d.mp4 / -y.mp4 (720p, H.264)
#   s3-json/<klip>.json (S3 JSON fragmanı; manifest-birlestir biçimi)   s3-p9/pa/pb.png (son-kare posterler)
#   s3-pc-altin.png (d12 A/B: --gok altin)   s3-p9-camsiz.png (R12: cam_k 0)   s3-maske-p9/ (1920² Workbench) s3-maske-pc/
#   s3-probe-*/ (1920² TAA 64, son render ayarı: s/kare + VRAM)   s3-posterler.png (durak sayfası + DOM taslağı)
#   s3-olc.json (GPU'suz kabul ölçümleri)   s3-gorunurluk.json (kasa S2 kliplerinde)   s3-olcum.json (dikiş, blob, ΔL*, bayt)
#   s3-vram-*.csv / s3-vram.txt (nvidia-smi 250 ms; pencere = kilit süresi)   s3-olcum.jsonl (kare süreleri)
# Kullanım: bash scripts/blender/s3/onizleme.sh [klip[:kareler] ...]   (varsayılan: t78f t89 t9a tab tbc lc; kareler "40-65")
# Ortam: S3_EK="--fidan_w 400 …" (sahne.py'ye ek argüman), S3_PROBE=0 (1920² probu atla), S3_YALNIZ_OLC=1 (render yok),
#        S3_ONEK=s3b (bütün çıktı adları s3b-*; varsayılan s3), S3_ALTIN=0 (d12 B karesini atla), S3_PROBE_KLIP="t89 lc"
# G-B K10 kısa önizlemesi (brief §14.4.1 K10; s3-* G-A dosyalarına dokunmaz, karşılaştırma için durur):
#   S3_ONEK=s3b S3_ALTIN=0 S3_PROBE_KLIP=lc bash scripts/blender/s3/onizleme.sh t9a tbc:40-65 lc:0-5 t89:50-59
set -uo pipefail
KOK="$(cd "$(dirname "$0")/../../.." && pwd)"
B=/d/soft/cop31-varlik/blender/blender-5.2.3-windows-x64/blender.exe
R=/d/soft/cop31-varlik/render
O=$R/_onizleme
ON=${S3_ONEK:-s3}
JK=$O/$ON-json
LOG=$O/$ON-olcum.jsonl
EKG=${S3_EK:-}
VRAM_ESIK=7782
mkdir -p $O $JK
KLIPLER=${*:-"t78f t89 t9a tab tbc lc"}
S3="$KOK/scripts/blender/s3"

sahne() {
  "$B" -b --factory-startup -P "$S3/sahne.py" -- "$@" $EKG 2>&1 \
    | grep --line-buffered -E "^\[(S3|OZET|JSON|KAMERA|ISIK|OLC|GORUNURLUK|KILIT|SON-KARE|IMAJ|AGAC)\]|Traceback|Error" \
    | grep --line-buffered -vE "KILIT\] dolu" | awk '{print strftime("%H:%M:%S"), substr($0, 1, 600); fflush()}'
}

vram_ozet() {   # pencere = bu koşunun kilit süresi ("[KILIT] alındı" → "bırakıldı"); öncesi boşta
  local f=$O/$ON-vram-$1.csv g=$O/$ON-gunluk-$1.txt t0="" t1=""
  [ -s "$f" ] || { echo "[VRAM] $1: örnek yok"; return; }
  if [ -s "$g" ]; then t0=$(grep "\[KILIT\] alındı" "$g" | tail -1 | cut -c1-8); t1=$(grep "\[KILIT\] bırakıldı" "$g" | tail -1 | cut -c1-8); fi
  awk -F', ' -v k="$1" -v e=$VRAM_ESIK -v t0="$t0" -v t1="$t1" '{s=substr($1, 12, 8); m=$2+0}
    t0 != "" && s < t0 {b=m; next}  t1 != "" && s > t1 {next}  {n++; if (b == "") b=m; if (m > t) t=m}
    END{d=(t<=e)?"✓":"✗"; printf "[VRAM] %s tepe %d MiB (%.2f GiB), boşta %d MiB, render payı %d MiB, eşik %d MiB %s; pencere %s–%s, %d örnek\n",
        k, t, t/1024, b, t-b, e, d, (t0 == "" ? "tümü" : t0), (t1 == "" ? "son" : t1), n}' "$f" | tee -a $O/$ON-vram.txt
}

olcerek() {   # $1 etiket, sonrası sahne argümanları (nvidia-smi örneklemesiyle)
  local et=$1; shift
  nvidia-smi --query-gpu=timestamp,memory.used,utilization.gpu --format=csv,noheader -lms 250 > $O/$ON-vram-$et.csv &
  local NV=$!
  sahne "$@" | tee $O/$ON-gunluk-$et.txt
  kill $NV 2>/dev/null || true
  vram_ozet $et
}

# 0) ağaç verisi + GPU'suz ölçümler (render yok)
[ -f /d/soft/cop31-varlik/s3/agac.json ] || (cd "$KOK" && node scripts/blender/s3/agac_disa.mjs)
sahne --klip t89 --onizleme --olc $O/$ON-olc.json
sahne --klip t78f --onizleme --gorunurluk $O/$ON-gorunurluk.json
[ "${S3_YALNIZ_OLC:-0}" = "1" ] && exit 0

# 1) klipler (960² TAA 16) + son-kare posterler ("klip:40-65" → yalnız o kareler; poster karesi aralıktaysa kopyalanır)
for ks in $KLIPLER; do
  k=${ks%%:*}
  KR=()
  [ "$ks" != "$k" ] && KR=(--kareler "${ks#*:}")
  rm -f $O/$ON-$k/k_*.png
  olcerek $ON-$k --klip $k --onizleme --kilit --json --kok $JK --out $O/$ON-$k --log $LOG "${KR[@]}"
  case $k in
    t89) [ -f $O/$ON-t89/k_0059.png ] && cp $O/$ON-t89/k_0059.png $O/$ON-p9.png; sahne --klip p9 --onizleme --kok $JK ;;
    t9a) [ -f $O/$ON-t9a/k_0053.png ] && cp $O/$ON-t9a/k_0053.png $O/$ON-pa.png; sahne --klip pa --onizleme --kok $JK ;;
    tab) [ -f $O/$ON-tab/k_0053.png ] && cp $O/$ON-tab/k_0053.png $O/$ON-pb.png; sahne --klip pb --onizleme --kok $JK ;;
    lc)  [ -f $O/$ON-lc/k_0000.png ] && cp $O/$ON-lc/k_0000.png $O/$ON-pc.png;  sahne --klip pc --onizleme --kok $JK ;;
  esac
  python -X utf8 "$S3/kontak.py" kontak $k --onek $ON
done

# 2) d12 arka plan A/B (B: altın pus perdesi; K5 sonrası S3_ALTIN=0) ve R12 (camsız p9)
if [ "${S3_ALTIN:-1}" = "1" ]; then
  olcerek $ON-pc-altin --klip lc --kareler 0 --onizleme --kilit --gok altin --out $O/$ON-pc-altin-d --log $LOG
  cp $O/$ON-pc-altin-d/k_0000.png $O/$ON-pc-altin.png
fi
olcerek $ON-p9-camsiz --klip t89 --kareler 59 --onizleme --kilit --cam_k 0 --out $O/$ON-p9-camsiz-d --log $LOG
cp $O/$ON-p9-camsiz-d/k_0059.png $O/$ON-p9-camsiz.png

# 3) maske (Workbench malzeme kimliği): p9 1920² (81 uç blob sayımı), pc 960² (yaprak doygunluğu)
sahne --klip t89 --kareler 59 --maske --kilit --res 1920 --out $O/$ON-maske-p9
sahne --klip lc --kareler 0 --maske --kilit --onizleme --out $O/$ON-maske-pc

# 4) 1920² TAA 64 probu (son render ayarı): s/kare + VRAM — p9 (t89[59]) ve pc (lc[0]); 3'er kare (ilk kare kurulum içerir)
if [ "${S3_PROBE:-1}" = "1" ]; then
  for pk in ${S3_PROBE_KLIP:-t89 lc}; do
    case $pk in t89) PKR=57,58,59 ;; *) PKR=0,1,2 ;; esac
    olcerek $ON-probe-$pk --klip $pk --kareler $PKR --kilit --out $O/$ON-probe-$pk --log $LOG
  done
fi

# 5) durak sayfası + ölçümler (dikiş ΔE00, 81 uç blob + ΔL*, yaprak, R12, bayt; s3 dışı önekte önce/sonra karşılaştırması)
python -X utf8 "$S3/kontak.py" posterler --onek $ON
python -X utf8 "$S3/kontak.py" olc --onek $ON
[ "$ON" != "s3" ] && python -X utf8 "$S3/kontak.py" karsilastir --onek $ON
echo "[BITTI] $(date +%H:%M:%S)"
