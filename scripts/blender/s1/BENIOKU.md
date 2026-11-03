# S1 — dış sahne (uzay → Antalya → Expo çatısı)

Bağlayıcı belge: `docs/brief-icinden-3.md` §9. Klipler: `t01` (54), `l1` (120), `t12` (60), `l2` (120), `t23` (84),
`l3` (150), `t34a` (= t34 kare 0–47; 44–47 parlama). Posterler p1–p3 = l1/l2/l3 kare 0.

| Dosya | İş |
|---|---|
| `hazirla.py` | Sistem Python'u: dokular, arazi ızgarası, OSM ağları → `D:\soft\cop31-varlik\s1\tex\` (`python -X utf8 -P hazirla.py hepsi`, ~2 dk) |
| `osm_yakin.py` | OSM ±1 km → bina/sera/salon/ışıklık/zemin/yol/tramvay/araç/ağaç ağları; S2'den dolgu sera, ev, ağaç |
| `geo.py` | Küresel Dünya (R 6371008,8), Expo teğet ENU çerçevesi, eqc dönüşümleri |
| `gunes.py` | NOAA güneş konumu (`python -X utf8 gunes.py 2026-11-09T13:00`) |
| `kamera.py` | Analitik kamera yolları, easing (§2.1), disk/kadraj hesapları |
| `sahne.py` | Blender sahnesi + render + `<klip>.json` (§9.3). `--engine EEVEE|CYCLES`, `--onizleme`, `--res`, `--klip`, `--kareler`, `--saat` (UTC), `--sadece_json` |
| `calis.py` | Blender'ı çalıştırır, RAM/VRAM tepe ölçer, `--kilit` ile GPU kilidi (§9.3) |
| `kontak.py` | Kontak sayfaları, poster önizlemeleri (işaretli + `-temiz` tam boy), 720p mp4, ölçümler (`_onizleme/s1-olcum.json`: dikiş ΔE00, döngü kapanışı, parlama, metin bandı) |
| `parlama.py` | t34a parlaması görüntü uzayında: `ham/` → kare 38'den rampa, kare 47 tam `#FFF1DC` (S2 t34b kare 48 ile aynı) |
| `olcum16.py` | C turu: PNG16 ölçüm yardımcıları (ardışık fark /255, ortalama ΔE00, luma) |
| `poz_egri.py` | C turu: t23 pozlama eğrisi tasarımı (Blender'ın Python'u, OCIO AgX Punchy; önizleme EXR'lerinden luma(EV)) |

Örnek:

```
python -X utf8 -P hazirla.py hepsi
python -X utf8 -P calis.py -- --klip t01,l1,t12,l2 --res 960 --onizleme      # küre gerekir (~3,1 GB RAM)
python -X utf8 -P calis.py -- --klip t23 --res 960 --onizleme                 # her şey (~3,8 GB RAM)
python -X utf8 -P calis.py -- --klip l3,t34a --res 960 --onizleme             # küresiz (~2,7 GB RAM)
python -X utf8 -P calis.py --kilit -- --klip t23 --engine CYCLES --res 1920 --samples 64   # son render (B turu)
python -X utf8 -P kontak.py hepsi
```

Bellek: kliplerin bu üç gruba bölünmesi süreç başına RAM'i ≤ 4 GB tutar (NVIDIA GL sürücüsü dokuların sistem RAM
kopyasını tutuyor; hepsi bir arada 5,4 GB ölçüldü).

## B turu (son render)

- d3 kamerası: yerden 900 m, 35 mm, hol merkezine yatay 2,3 km, azimut 60°, bakış 240° (`kamera.py` `D3_*`). t23 son
  %40'ta lensi 24 → 35 mm'ye, t34a kare 0–36'da 35 → 24 mm'ye taşır.
- Yakın alan (`--yakin B`, varsayılan; `--yakin A` A turu yakın alanıyla önce/sonra ölçümü): seralar gerçek tonoz/beşik
  modülleri, ağaçlar 4 biçim (narenciye sıralı bahçe parselleri, çam, geniş yapraklı, servi rüzgâr kıranları), Antalya
  için S2 kentsel sınıfında prosedürel bloklar — hepsi Geometry Nodes örneklemesi (`orn_<ad>.npz` noktaları,
  `osm_yakin.py`); arazide 70 m'lik Voronoi parsel/sıra/toprak yol katmanı (9 km'de söner), uzak planda pus ×1,26;
  çatıda parapet, HVAC, panel derzleri, buzlu camlı ışıklık kayıtları.
- Cycles: uyarlamalı (0,01, min 16, maks 64; l1/l2 maks 32), OIDN GPU, `emission_sampling NONE`, deklanşör 0,5
  (t23 ve t34a 0,25), pozlama +0,3 EV, uzayda +`--uzay_ev` (1,0).
- `--kilit`: klip başına GPU kilidi (`render\.gpu-kilit`, 10 sn'de bir dene, 45 dk'dan eski kilit ölü).

```
python -X utf8 -P hazirla.py osm                                   # yakın alan + örnekleme noktaları (~12 sn)
python -X utf8 -P calis.py -- --klip t01,l1,t12,l2 --engine CYCLES --res 1920 --kilit --cikis D:/soft/cop31-varlik/render-son
python -X utf8 -P calis.py -- --klip t23 --engine CYCLES --res 1920 --kilit --cikis D:/soft/cop31-varlik/render-son
python -X utf8 -P calis.py -- --klip l3,t34a --engine CYCLES --res 1920 --kilit --cikis D:/soft/cop31-varlik/render-son
python -X utf8 -P parlama.py D:/soft/cop31-varlik/render-son/t34a
python -X utf8 -P kontak.py hepsi --render D:/soft/cop31-varlik/render-son
```

## C turu (brief §11.1: t23 + t34a yeniden)

Teşhis (`kamera.py` durumu kare kare; GPU yok): t23'te hızı sıfıra inmeyen bileşen **ln d** — 6,4 ln birimlik iniş
easeInOutSine ile 84 karenin tamamına yayılıyordu; sinüs sonunda doğrusal yavaşlar, ekranda son kareler 25 / 20 / 15 /
10 / 6 / 2 px/kare (kamera kare 83'te hâlâ 5,6 m/kare). `wG·1,02` kıskacı (G kare ~60'ta varıyor, son 12 karede ΔG 0),
`h` penceresi (0,93'te bitiyor, kare 77'den sonra Δh 0) ve lens (son karede +0,0014 mm) suçsuz. t34a'da `g = t^1,6`
türevi 0'da sıfır ama t^0,6 ile hızla büyüyor: kare 0→1 7,8 px. İkinci bileşen **animasyonlu tohum**: sabit ↔ animasyonlu
tohum farkı tek başına 2,41/255 (ΔE00 1,15; l3[0] iki tohumla, 1920²). Deklanşör 0,25 hızla orantılı, ikincil.
Pozlama ve `ortam()` son 12 / ilk 6 karede sabit (0,3 EV; pus 1, gök 1, bulut 0, yerel bulut 0 (kare ≥ 76), perde 0).

Değişenler:
- `kamera.py`: t23 yerel zamanı `t23_zaman(f)` — kare 40'a dek aynı, sonra smoothstep ile (τ' ≤ 1,2) kare 78'de 83'e
  varır; **kare 78–83 kamera tam d3** (l3[0] durumu). İniş B biçiminde (…, 11, 6, 2, 0 px/kare), hız tepesi
  (~180 px/kare) bulut perdesinin içinde. t34a: yerel zaman `t34a_zaman(f)` (kare 0–1 tam d3, kare 47 yine uç) +
  ln d ilk 30 karede beşinci derece başlangıç (değer/eğim/eğrilik t^1,6 ile eşit): 0, 0,27, 1,8, 4,7, 8,7, 13,6 px/kare.
- `sahne.py`: `T23_PERDE` 59 → 57 (τ(57) ≈ 59: perde ve yerel bulut katmanı B'deki irtifada, 124 m fark). Tam saydam
  perde / yerel bulut katmanları `hide_render` ile render dışı (saydam yüzey de Cycles'ta sekme sayıp örnekleme dizisini
  kaydırıyordu → t23 son kareleri l3 ile aynı sahne). `--sabit_tohum` (varsayılan `t23:78-83;t34a:0-2`): bu kareler l3
  ile aynı sabit tohum (31), diğerleri animasyonlu. `--poz egri` (varsayılan): ölçülmüş `POZ_EGRI` (aşağıda); `--poz
  rampa --poz_rampa 30e3,400e3` brief önerisi. `--kareler` klip başına (`"t23:0-60/2,76-83;t34a:0-3"`). `--exr` (teşhis:
  doğrusal, pozlamasız EXR de yazar).
- Pozlama: 30–400 km rampası çukuru kapatmadı (960² ölçüm: kare 20 %15,1, kare 36 %19,3 → kare 40 %28,2 — Sahra
  kadrajdan çıkıp koyu deniz yarıyı doldurunca, sabit 1,3 EV'de). `poz_egri.py` (Blender'ın Python'u: OCIO AgX + Punchy,
  EXR → PNG doğrulaması 0,007/255) her kare için luma(EV) tablosundan düğüm çıkarır: kare ≤ 14 1,3 EV; luma tabanı %23
  (kare 16–36; en çok 2,15 EV, kare 20); kare 36→40 +2 puan (0,05 EV); kare 46'dan sonra 0,3. ≥ 966 km k = 1, ≤ 28 km
  k = 0 → l1/l2/t01/t12 ve l3/t34a pozlaması B ile aynı.
- `olcum16.py`: PNG16 ölçüm (ffmpeg rgb48): fark /255, ΔE00 (parçalı), luma. `kontak.py olc` → `s1-olcum.json`
  içinde `c_turu` (kabul ölçütleri ve sonuçları).

Sonuç (master 1920², PNG16): t23[83]↔l3[0] ΔE00 0,031; l3[0]↔t34a[0] 0,031; t23 son 4 ardışık fark 0,023/255;
t34a 0→1 0,065/255; t23[0]↔l2[0] 0,101; t23 luma kare 0–60 en düşük %22,66 (kare 25), kare 10–40 azalan, en çok
+2,29 puan geri yükseliş; parlama kare 44–47 %93,59, kare 47 tam #FFF1DC, S2 t34b k_0000 ile fark 0. Render: t23 796 sn
(medyan 7,5 sn/kare), t34a 385 sn (7,9 sn/kare). Sabit tohum t23'te 6 kare (brief 3): sabit ↔ animasyonlu tohum farkı
tek başına 2,41/255 olduğundan "son 4 ardışık fark ≤ 1,5/255" ölçütü 3 sabit kareyle tutmaz; kamera kare 78'den beri
durgun olduğu için 78–83 l3 ile aynı tohumda (brief'in tohum kuralının amacı: durgun piksel köpürmesin).

```
python -X utf8 -P calis.py --kilit -- --klip t23 --engine CYCLES --res 960 --depth 16 --kareler "t23:0-60/2,76-83" --exr --cikis D:/soft/cop31-varlik/s1/c_onizleme/on1 --olcum D:/soft/cop31-varlik/s1/c_onizleme/on1/olcum.jsonl
python -X utf8 -P calis.py --kilit -- --klip l3,t34a --engine CYCLES --res 960 --depth 16 --kareler "l3:0,1;t34a:0-5" --cikis D:/soft/cop31-varlik/s1/c_onizleme/on1
D:/soft/cop31-varlik/blender/blender-5.2.3-windows-x64/5.2/python/bin/python.exe poz_egri.py D:/soft/cop31-varlik/s1/c_onizleme/on1 --taban 23 --yuk 2.0
python -X utf8 -P calis.py --kilit -- --klip t23 --engine CYCLES --res 1920 --cikis D:/soft/cop31-varlik/render-son --olcum D:/soft/cop31-varlik/s1/c_son_olcum.jsonl
python -X utf8 -P calis.py --kilit -- --klip t34a --engine CYCLES --res 1920 --cikis D:/soft/cop31-varlik/render-son --olcum D:/soft/cop31-varlik/s1/c_son_olcum.jsonl
python -X utf8 -P parlama.py D:/soft/cop31-varlik/render-son/t34a
python -X utf8 -P kontak.py hepsi --render D:/soft/cop31-varlik/render-son
```
