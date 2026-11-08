#!/usr/bin/env bash
# S2 son render: EEVEE 1920² TAA 64, PNG 16 bit → D:/soft/cop31-varlik/render-son/<klip>/k_%04d.png (0'dan) + <klip>.json.
# Her klip GPU kilidiyle (sahne.py --kilit; 10 s'de bir dener). t34b: ham/ (t34 kare F-B 36–59; E 48–71) → parlama.py →
# k_0000–k_0023.
# VRAM: nvidia-smi kart toplamı 250 ms'de bir (render-son/_onizleme/s2-vram-<klip>.csv); klip sonunda tepe / boşta özeti
# [VRAM] satırı ve s2-vram.txt (eşik §12.6: tepe ≤ 7,6 GiB = 7.782 MiB). Süre: s2-son.jsonl.
# C turu (brief §11): klipler arasında ≥ 20 s boşluk (öteki ajan kilidi yakalayabilsin; B'de 62 dk açlık).
# t34b/k_*.png K'nin render-son/t34/ dizinine sabit bağlı (hard link): parlama.py yazmadan önce yalnız t34b'deki adlar
# silinir, t34/ eski içeriğini korur (K yeniden kurar).
# E turu (brief §12.3, §12.9-4): klipler t34b l4 t45 t56 t67 t78 (l5/p5 değişmez). Posterler:
#   p6 = t56 son karesi (E k_0059, F-B k_0053), p7 = t67 son karesi (k_0047): "son-kare" — render yok, kopya + <p>.json (tip son-kare);
#   p8 = eski p6 plakası: render yok; S2c ÖNCE render-son/p6 → render-son/p8 taşır (ve p6.json → p8.json); son.sh p8.json'u
#   tip "plaka" ile yeniden yazar. p8 yoksa p6 kopyası YAPILMAZ (eski plaka ezilmesin).
#   G-B (brief §14.4.2-3): p8 = t78[59] son-kare; eski plaka render-son-f/p8'e taşındı, render-son/p8 dizini YOK ve p8.json'u
#   kodla.mjs yazar (tip "son-kare"). Bu durumda son.sh p8.json'a dokunmaz ve p6 kopyası yapılır. Koruma yalnız eski plaka
#   henüz taşınmamışsa (render-son/p8 yok VE p8.json tip "son-kare" değil) devrede kalır.
#   p4 = l4[0] ("dongu"; kodla.mjs tablosu) — ayrıca render yok.
# Dokular: duvar-arka / duvar-sol / ekran-fidan / ekran-cop / cephe-on (S2a; 8 Kasım 2026: ekran-soz.png yerine iki fotoğraf)
#   yoksa son render reddedilir (S2_GECICI=1 ile geçilir).
# Ortam: S2_EK="--yikama_w 300 …" (sahne.py'ye ek argüman), S2_BOSLUK (s), S2_GECICI=1.
# F turu (brief §13, §13.5 F-B): sahne.py varsayılanı --profil fiske (eski için S2_EK="--profil eski"). F-B süreleri: t34b
#   t34 kare 36–59 (24), t45 54, t56 54, t67 48, t78 60 kare (sahne.py SON_KARE). Parlama: F-B t34 kare 36–38 (36 tam
#   #FFF1DC, 39 temiz; parlama.py 36 3 36); "--profil eski" → 48–55 (48 8 48). Son kare dizinleri klibin render-son/<klip>.json'undan
#   (kare − 1): p6 = t56[53], p7 = t67[47], t78 tek kare yeniden = t78[59]. t34b ham/ önce temizlenir (E'nin 0048–0071'i kalmasın).
# İki dil (7 Kasım 2026): S2_DOKU = yazılı doku dizini (Windows biçimi, ör. D:/soft/cop31-varlik/s2/doku-en; sahne.py da okur),
#   S2_KOK = çıktı kökü (ör. D:/soft/cop31-varlik/render-son-en). Varsayılan kökten başka kökte p8 koruması yok (p6 kopyası yapılır).
#   İngilizce: S2_DOKU=D:/soft/cop31-varlik/s2/doku-en S2_KOK=D:/soft/cop31-varlik/render-son-en bash scripts/blender/s2/son.sh l5 t56 t67
#   t34b / l4 / t45 artık kasayla S3'ten: bash scripts/blender/s3/son.sh t34b l4 t45 (l5'te kasa görünmez).
# Kullanım: bash scripts/blender/s2/son.sh [klip ...]   (varsayılan: t34b l4 t45 t56 t67 t78)
set -uo pipefail
KOK="$(cd "$(dirname "$0")/../../.." && pwd)"
B=/d/soft/cop31-varlik/blender/blender-5.2.3-windows-x64/blender.exe
R_VARSAYILAN=/d/soft/cop31-varlik/render-son
R=${S2_KOK:-$R_VARSAYILAN}
DOKU=${S2_DOKU:-/d/soft/cop31-varlik/s2/doku}
echo "[BILGI] çıktı $R · yazılı dokular $DOKU"
O=$R/_onizleme
LOG=$O/s2-son.jsonl
BOSLUK=${S2_BOSLUK:-20}   # klipler arası bekleme (s), kilit bırakıldıktan sonra
EKG=${S2_EK:-}
if echo " $EKG " | grep -q -- " --profil eski "; then T34B_BAS=48; PARLAMA_N=8; else T34B_BAS=36; PARLAMA_N=3; fi   # F-B / E
VRAM_ESIK=7782            # MiB (7,6 GiB)
mkdir -p $O
# G-B: t78 artık S3 t78f karelerini taşır (scripts/blender/s3/son.sh); S2 ile yeniden render edilmesi kasayı siler → varsayılan listede YOK, yalnız açıkça "t78" verilirse.
KLIPLER=${*:-"t34b l4 t45 t56 t67"}

eksik=""
for d in duvar-arka.png duvar-sol.png ekran-fidan.png ekran-cop.png cephe-on.png; do [ -f "$DOKU/$d" ] || eksik="$eksik $d"; done
if [ -n "$eksik" ] && [ "${S2_GECICI:-0}" != "1" ]; then
  echo "[HATA] S2a dokuları eksik:$eksik ($DOKU). Son render yapılmadı (geçici düz renkle zorlamak için S2_GECICI=1)."
  exit 2
fi

sahne() {   # sahne.py çağrısı (render ya da yalnız json); süzülmüş günlük
  "$B" -b --factory-startup -P "$KOK/scripts/blender/s2/sahne.py" -- "$@" $EKG 2>&1 \
    | grep --line-buffered -E "^\[(P4|OZET|JSON|KILIT|DOKU|UYARI|SON-KARE)\]|Traceback|Error" | grep --line-buffered -vE "KILIT\] dolu" \
    | awk '{print strftime("%H:%M:%S"), substr($0, 1, 400); fflush()}'   # S2c: zaman damgası (VRAM penceresi için)
}

vram_ozet() {   # $1 klip. S2c: pencere = bu koşunun kilit süresi (günlükteki "[KILIT] alındı" → "bırakıldı"); öncesi boşta
  local f=$O/s2-vram-$1.csv g=$O/s2-gunluk-$1.txt t0="" t1=""
  [ -s "$f" ] || { echo "[VRAM] $1: örnek yok"; return; }
  if [ -s "$g" ]; then t0=$(grep "\[KILIT\] alındı" "$g" | tail -1 | cut -c1-8); t1=$(grep "\[KILIT\] bırakıldı" "$g" | tail -1 | cut -c1-8); fi
  awk -F', ' -v k="$1" -v e=$VRAM_ESIK -v t0="$t0" -v t1="$t1" '{s=substr($1, 12, 8); m=$2+0}
    t0 != "" && s < t0 {b=m; next}  t1 != "" && s > t1 {next}  {n++; if (b == "") b=m; if (m > t) t=m}
    END{d=(t<=e)?"✓":"✗"; printf "[VRAM] %s tepe %d MiB (%.2f GiB), boşta %d MiB, render payı %d MiB, eşik %d MiB %s; pencere %s–%s, %d örnek\n",
        k, t, t/1024, b, t-b, e, d, (t0 == "" ? "tümü" : t0), (t1 == "" ? "son" : t1), n}' "$f" \
    | tee -a $O/s2-vram.txt
}

son_kare_no() {   # $1 klip → son kare dizini (render-son/<klip>.json "kare" − 1)
  python -X utf8 -c "import json,sys; print(json.load(open(sys.argv[1], encoding='utf-8'))['kare'] - 1)" "$R/$1.json"
}

son_kare() {   # $1 poster, $2 kaynak klip, $3 kaynak kare
  local src=$R/$2/k_$(printf %04d $3).png
  if [ ! -f "$src" ]; then echo "[HATA] $1: $src yok"; return; fi
  if [ "$1" = "p6" ] && [ "$R" = "$R_VARSAYILAN" ] && [ ! -d "$R/p8" ] && [ "$(p8_tip)" != "son-kare" ]; then
    echo "[HATA] p6: render-son/p8 yok ve p8.json tip son-kare değil — eski p6 plakası henüz taşınmamış (S2c: mv render-son/p6 render-son/p8). p6 kopyası atlandı."
    return
  fi
  mkdir -p $R/$1
  rm -f $R/$1/k_*.png
  cp "$src" $R/$1/k_0000.png
  sahne --klip $1 --kok $R --yalniz_json
  echo "[SON-KARE] $1 ← $2/k_$(printf %04d $3).png"
}

p8_tip() {   # render-son/p8.json "tip" (yoksa / okunamazsa boş)
  [ -f "$R/p8.json" ] || return 0
  python -X utf8 -c "import json,sys; print(json.load(open(sys.argv[1], encoding='utf-8')).get('tip', ''))" "$R/p8.json" 2>/dev/null || true
}

# p8 json'u: E/F'de eski p6 plakası (dizin varsa tip "plaka" ile yaz); G-B'de son-kare = t78[59] (kodla.mjs yazar, dokunma)
if [ "$R" != "$R_VARSAYILAN" ]; then echo "[BILGI] p8: varsayılan dışı kök ($R), p8 işi yok"
elif [ -d "$R/p8" ]; then sahne --klip p8 --kok $R --yalniz_json --yigin 0
elif [ "$(p8_tip)" = "son-kare" ]; then echo "[BILGI] p8 son-kare (G-B; p8.json kodla.mjs'nin, dokunulmadı; eski plaka render-son-f/p8)"
else echo "[UYARI] render-son/p8 yok ve p8.json tip son-kare değil (S2c taşıması bekleniyor)"; fi

ILK=1
for k in $KLIPLER; do
  if [ $ILK -eq 0 ]; then
    echo "[BOSLUK] $BOSLUK s $(date +%H:%M:%S)"
    sleep $BOSLUK
  fi
  ILK=0
  nvidia-smi --query-gpu=timestamp,memory.used,utilization.gpu --format=csv,noheader -lms 250 > $O/s2-vram-$k.csv &
  NV=$!
  echo "[BASLA] $k $(date +%H:%M:%S)"
  touch $O/.s2-basla-$k
  # S2c: eski kareler kalmasın (D'de t56 72 kareydi, E'de 60; yedek render-son-d\). t34b ham/'a yazar, parlamada temizlenir.
  [ "$k" != "t34b" ] && rm -f $R/$k/k_*.png
  [ "$k" = "t34b" ] && rm -f $R/t34b/ham/k_*.png   # F-B: ham/ t34 numarasıyla (36–59); E'nin 48–71'i karışmasın
  sahne --klip $k --kok $R --json --kilit --log $LOG | tee $O/s2-gunluk-$k.txt
  kill $NV 2>/dev/null || true
  vram_ozet $k
  if [ "$k" = "t34b" ]; then
    yeni=0   # bu koşunun 24 karesi: t34 kare T34B_BAS … T34B_BAS + 23, başlangıç işaretinden yeni
    for i in $(seq $T34B_BAS $((T34B_BAS + 23))); do [ "$R/t34b/ham/k_$(printf %04d $i).png" -nt $O/.s2-basla-$k ] && yeni=$((yeni + 1)); done
    if [ $yeni -eq 24 ]; then
      rm -f $R/t34b/k_*.png   # sabit bağı kopar (t34/ dokunulmaz)
      python -X utf8 -P "$KOK/scripts/blender/s2/parlama.py" $R/t34b $T34B_BAS $PARLAMA_N $T34B_BAS | tail -n 24 > $O/s2-t34b-parlama.txt
    else
      echo "[HATA] t34b ham/ eksik ($yeni/24, t34 kare $T34B_BAS–$((T34B_BAS + 23))); parlama atlandı"
    fi
  fi
  [ "$k" = "t56" ] && son_kare p6 t56 $(son_kare_no t56)
  [ "$k" = "t67" ] && son_kare p7 t67 $(son_kare_no t67)
  # S2c (E, ölçüldü): EEVEE dizide son kareyi önceki kareye bağlı işliyor (64→65 kamera hâlâ ~3,5 mm/kare iniyor):
  # dizideki t78[65] ↔ eski t56[71] ΔE00 0,187 (✗ > 0,05); tek başına işlenen t78[65] 0,0073 ✓ (eski t56[71] de böyle).
  # p8 plakası, brosur_dikdortgen, renk.py RECT ve kapakTon eski t56[71]'e bağlı → son kare ayrı oturumda yeniden işlenir.
  if [ "$k" = "t78" ]; then n=$(son_kare_no t78); sleep 5; sahne --klip t78 --kareler $n --kok $R --kilit --log $LOG; echo "[SON-KARE] t78[$n] tek kare yeniden"; fi
  python -X utf8 -P "$KOK/scripts/blender/s2/kontak.py" kontak $k --kaynak $R/$k --cikis $O/s2-$k.jpg --baslik "son render EEVEE TAA 64" --mp4 0
  echo "[BITTI] $k $(date +%H:%M:%S)"
done
