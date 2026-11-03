# S1 — dış sahne (uzay → Antalya → Expo çatısı)

Bağlayıcı belge: `docs/brief-icinden-3.md` §9. Klipler: `t01` (54), `l1` (120), `t12` (60), `l2` (120), `t23` (84),
`l3` (150), `t34a` (= t34 kare 0–47; 44–47 parlama). Posterler p1–p3 = l1/l2/l3 kare 0.

| Dosya | İş |
|---|---|
| `hazirla.py` | Sistem Python'u: su maskesi (`su`, D turu, scipy), dokular, arazi ızgarası, OSM ağları → `D:\soft\cop31-varlik\s1\tex\` (`python -X utf8 -P hazirla.py hepsi`, ~2,5 dk) |
| `osm_yakin.py` | OSM ±1 km → bina/sera/salon/ışıklık/zemin/yol/tramvay/araç/ağaç ağları; S2'den dolgu sera, ev, ağaç |
| `geo.py` | Küresel Dünya (R 6371008,8), Expo teğet ENU çerçevesi, eqc dönüşümleri |
| `gunes.py` | NOAA güneş konumu (`python -X utf8 gunes.py 2026-11-09T13:00`) |
| `kamera.py` | Analitik kamera yolları, easing (§2.1), disk/kadraj hesapları |
| `yaylar.py` | E turu: d1/d11 yayları (COP1–30 ev sahibi 27 kent → Antalya) → `render-son/yaylar.json` ve `src/lib/cop-kentleri.ts`; `emanet_oku()` (emanet.ts) |
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

## D turu (brief §11.6-6: Katara su maskesi — S1-D1)

Teşhis: su maskesi `hazirla.py`'de üretilmiyordu. A turunda `dunya/su-maskesi-21600x10800.png` = GEBCO_08 bath PNG
`< 255` (deniz seviyesi altı), `su-maskesi-8192x4096.png` = onun BOX küçültmesi olarak türetilmişti (ikisi de bu tanımla
0 px farkla yeniden üretildi). Maske üç yerde iş görüyor:

1. `dunya()`: 21600 maske → 8192 BILINEAR → `deniz_duzle` su piksellerini %60 okyanus tonu + %40 bulanık görüntüyle boyar
   → `gunduz_8k.jpg`. Katara'nın lacivert-mor rengi buradan (renk dokusuna gömülü).
2. `dunya()`: 8192 maske → `paket_8k.png` R → `sahne.py` Dunya malzemesi: Roughness 0,85 → 0,22, Specular IOR Level
   0,2 → 0,7. G (gece ışıkları) ve B (bulut) maskeden bağımsız.
3. `c1()`: 21600 maske penceresi (60 px/° ×4, Gauss 6, kıyı bandında mavi sınıflayıcı, medyan 5) → `c1_su.png` (Dunya
   malzemesinde C1 yaması suyu; Arazi malzemesinde ±110 km su karışımı) ve `deniz_duzle` → `c1_yama.jpg`.

Kural (`hazirla.py su`): GEBCO < 0 piksellerinin 8-bağlı bileşenleri (x döngüsel/antimeridyen, kutup satırları tek
nokta). Bir bileşen **kara** olur ⇔

1. tohum içermez — okyanus: Atlantik (0, −30), Pasifik (0, −150); göller: Hazar (42, 50), Lut (31,5, 35,5), Taberiye
   (32,8, 35,6), Salton (33,3, −115,8), Assal (11,65, 42,4);
2. BMNG Kasım 21600'de "su benzeri" piksel oranı < 0,2 (mavi sınıflayıcı ya da luma < 70);
3. **U-bağlantısı yok** (inceleme düzeltmesi): U = (bath < 255) ∪ (`gebco_08_rev_elev` 8 bit == 0, yani deniz ya da
   ~0–25 m alçak kıyı ve sığ su); U'nun 8-bağlı, x döngüsel bileşenlerinden bir tohumunkine düşen C bileşeni su kalır.
   8 bitlik bath'ta sığ kıyı suyu 255 sayılıyor: Kuveyt Körfezi, Cook Inlet, Martaban, Amazon şelfi ve Azak C maskesinde
   yok. Bu yüzden Kalmat Khor lagünü, kuzeydoğu Hazar sığlığı, Knik Arm ve Amazon ağzı gibi bulanık (yeşil, kahverengi,
   gri) kıyı suyu parçaları okyanustan kopuk görünüyor ve 2. koşulu geçiyordu (ilk D1 sürümü bunları kara yapıyordu);
4. tutulan suya uzaklığı > 30 km (yinelemeli kıyı koruması).

`SU_KARA_ZORLA` bölgelerinde (merkez + yarıçap; yalnız 2. koşulu geçen adaylar) 3. ve 4. koşul aranmaz. Bu bölgeler
alçak kıyı ovası üzerinden U'ya bağlanan kara çöküntüleri kapsar: Danakil (13,90, 40,54; 60 km), Afar güneyi (13,10,
41,25; 50 km), Sabhat Ghuzayyil (29,79, 19,71; 30 km) ve güneyi (29,20, 20,10; 30 km), Laguna Salada (32,35, −115,66;
30 km), Gran Bajo de San Julián (−49,55, −68,35; 25 km). Toplam 16 bileşen, 7.841 km²; bunların kalan suya en kısa
uzaklığı 31,5 km. Hazar kuzeydoğusundaki kuru sorlar (45,72K 55,13D 827 km²; 46,36K 54,87D 71 km²; Buzaçı 51 ve
19,5 km²) bilerek listede yok: tutulan su lekelerine uzaklıkları 3,9–8,5 km, yani kıyı tonu oynar. Ayrıca Hazar tohum
bileşeni kıyı ovasını zaten su sayıyor. `SU_KONTROL` (45 denetim) tutmazsa maske yazılmaz:

- 22 kıyı/haliç noktası, ±0,15° kutuda değişen 0: Kalmat, kuzeydoğu Hazar, Knik, 4 Amazon, 3 Sittaung, 2 Meghna,
  3 Kuveyt, 2 Nelson, 3 Laizhou, King Sound, Broad Sound;
- 13 su noktası: Hazar orta, kuzey ve güney; beş göl; Karadeniz, Marmara, Baltık, Antalya Körfezi, Kızıldeniz, Basra;
- 10 kara noktası, kutudaki eski suyun hepsi kara: Katara, Danakil, Turfan, Ölüm Vadisi, Şott Melrir, Karınjarık,
  Sabhat, Laguna Salada, Bajo del Gualicho, San Julián.

Sonuç (`dunya/su-maskesi.json`: `olcum`, `kontrol`, `silinen`, `U_baglantisindan_tutulan`; harita
`render-son/_onizleme/s1-maske-fark.png`, alt sırada kıyı denetim panelleri):

- 10.284 px @21600 su → kara: 80 bileşen, 29.824,5 km². Başlıcaları Katara 15.437, Danakil 6.158, Turfan 2.793,
  Karınjarık 900, Bajo del Gualicho 675, Ölüm Vadisi 601, Sabhat 492 + 162, Afar 402, Blanche (Avustralya) 300, San
  Julián 328, Laguna Salada 258 ve Şott Melrir 221 + 125 km². Ayrıca 20 Antarktika buz altı parçası (334 km²) ile
  Hambach, Sarbai ve Korkino açık ocak madenleri.
- 8192'de 1.890 px. Kara → su 0 px; kısmen değişen bileşen 0.
- Okyanus bileşeni 149.301.181 → 149.301.181 px; tohumlu göllerde değişen 0. Değişen her bileşen kalan suya
  ≥ 31,06 km, Expo'ya ≥ 738 km.
- U-bağlantısı 1.147 adayı su tuttu (21.664 km²). Bunların 148'i ilk D1 sürümünde kara olmuştu (1.728 px, 4.355 km²);
  şimdi C'deki gibi su.
- Bilerek su kalanlar (C ile aynı): Kutch Rann'ı tuzlaları (≥ 15 km²'lik parçalar 242 km²), Joseph Bonaparte kıyı ovası (−15,0 129,6; 173 +
  83 km²), Antarktika buz sahanlığı parçaları (101 + 40 km²) ve Hazar kuzeydoğusundaki sorlar.

Dokular (`dunya,c1` yeniden; C'ye göre): `gunduz_8k.jpg` 5.868 px (maske farkına ≤ 9,4 px), `paket_8k.png` yalnız R
1.890 px, `c1_yama.jpg` 65.851 px (≤ 2,8 px), `c1_su.png` 15.260 px (≤ 1,4 px). Yeni maskede su olan hiçbir pikselin
rengi değişmedi; Expo ±1,5° kutusunda değişen 0 px. Bu yüzden `s2`, `arazi` ve `osm` yeniden üretilmez. İlk D1 sürümüne
göre `c1_yama.jpg` ve `c1_su.png` birebir aynı (md5); `gunduz_8k` 3.308 px ve paket R 554 px değişti, bu değişimler C1
kutusunun dışında. `sahne.py` değişmedi; doku önbelleği yok (her Blender koşusu dosyadan okur).

Önizleme (l2[0], Cycles 960², 16 örnek, sabit tohum): D ↔ ilk D1 farkı ortalama 0,067/255, en çok 1/255. Aynı girdiyle
tekrar koşunun gürültüsü 0,068 / en çok 1, yani bu kadrajda fark yok. C ↔ D farkı yalnız iki bölgede: Katara (2.098 px,
en çok 112) ve Sabhat (15 px, en çok 45). Bunların 15 px genişletilmiş dışında ortalama 0,18/255, en çok 1/255.
Katara bölgesi ort. RGB (69, 72, 73) → (153, 127, 81); 8–20 px çevre halkası (165, 146, 112). Renk dokuları eski kalıp
yalnız maske yenilenirse (78, 77, 78): göl kalır. Bu yüzden `gunduz_8k.jpg` ve `c1_yama.jpg`'nin yeniden üretimi şart.

```
python -m pip install scipy                                   # bir kez (su işi)
python -X utf8 -P hazirla.py su                               # ~31 sn, RAM tepe 4,07 GiB RSS
python -X utf8 -P hazirla.py dunya,c1                         # ~39 sn, RAM tepe 1,66 GiB RSS
```

Yedek / geri alma: `dunya/su-maskesi-21600x10800.c-yedek.png`, `dunya/su-maskesi-8192x4096.c-yedek.png` (`su` yalnız
yoksa yazar, C tanımından, yani bath < 255'ten; mevcut yedekler C ile birebir doğrulanıyor),
`s1/tex/{gunduz_8k,c1_yama,_onizleme_gunduz,_onizleme_c1}.c-yedek.jpg`, `s1/tex/{paket_8k,c1_su}.c-yedek.png`. Geri
almak için ad ekini silerek üstlerine kopyala.

Değişmeyenler (bilerek): Lut/Taberiye tohum bileşeni (4.558 km²) Ürdün vadisi tabanını da içeriyor (d2'de iki göl
arasında ince mavi şerit). Karagiye (−132 m, Hazar'a 15 km) kıyı korumasında; Hazar'ın kuzey kıyı ovası Hazar
bileşeninde. Karun (Feyyum) ve Nil deltası gölleri "su benzeri" (0,52; 0,86–0,97) olduğu için su kalır. C'nin
eksikleri D'de de duruyor: Menzale, İdku, Maryut, Venedik lagünü, Azak, Kuveyt Körfezi, Cook Inlet ve IJsselmeer C
maskesinde hiç su değil, D'de de değil.

### S1-D2: yeni maskeyle t01, l1, t12, l2, t23 render'ı

`sahne.py` ve `kamera.py` değişmedi, ayarlar C ile aynı: Cycles 1920², uyarlamalı 0,01, örnek 16–64 (l1/l2 en çok 32),
OIDN GPU, deklanşör 0,5 (t23 0,25), pozlama 0,3 + 1,0 EV uzay ve `POZ_EGRI`, tohum 31. Döngüler sabit tohumla, t23
kare 78–83 sabit, geçişlerin geri kalanı animasyonlu. Tek fark yeni maske ve ondan üretilen `s1/tex` dokuları. l3
yeniden render edilmedi.

Yedek: `render-son-c/{t01,l1,t12,l2,t23}/` ve `.json` dosyaları C/B master'larının sabit bağları (`os.link`; 443
dosya, 4,51 GiB, ek yer kaplamaz). Doğrulama `render-son-c/_md5.json` ile yapılıyor. `render-son-c/_onizleme/` eski
`s1-*.jpg`/`mp4` ve `s1-olcum.json` dosyalarının kopyası. `sahne.py` `<klip>.json`'u, Blender da kareleri yerinde
kesip yazdığı için render-son'daki bağlar her klipten hemen önce silindi. Render'dan sonra yedekte md5 bozuk 0, nlink 1.
Geri almak için `render-son-c` içeriğini `render-son`'a taşı.

```
python -X utf8 -P calis.py --kilit --etiket d_son_<klip> -- --klip <klip> --engine CYCLES --res 1920 --cikis D:/soft/cop31-varlik/render-son --olcum D:/soft/cop31-varlik/s1/d_son_olcum.jsonl
#   sırayla t01, l1, t12, l2, t23: klip başına ayrı süreç ve kilit, aralarda 25 sn
python -X utf8 -P kontak.py hepsi --render D:/soft/cop31-varlik/render-son
```

Süre (calis.py): t01 106 sn, l1 298, t12 310, l2 656, t23 790. Toplam 36,0 dk GPU (zincir 07:53–08:31). RAM tepe
RSS 3,37–3,47 GB, t23'te 4,18 GB (C'de 4,17). VRAM makine tepesi 4,86–5,04 GB. Kare süreleri C ile aynı (t23 medyan
7,44 sn).

Ölçüm `_onizleme/s1-olcum.json` → `d_turu` bloğunda. Maske farkı bölgesi şöyle kuruldu: C → D su→kara pikselleri 0,05°
ızgarada 0,5° genişletildi; her master pikselinden küreye ışın atıldı (f−1, f, f+1 kameraları), sonra ekranda 15 px
genişletildi.

- a. l2[0] Katara iç bölgesi (9.361 px) ort. RGB C'de 76,7/77,8/74,5, D'de 153,1/127,6/80,9. 8–20 px halka
  165,0/145,7/111,6, yani iç − halka = −11,9/−18,1/−30,7. **±15/255 ölçütü G ve B kanalında tutmuyor.** Aynı piksellerde
  dokunun kendisi (gunduz_8k, artık BMNG rengi) −20,7/−23,6/−27,1 veriyor: çöküntü tabanı (sabhka, kuzey yamaç) BMNG'de
  çevresinden koyu. Boyalı göl gitti; C'de iç − halka −88,3/−67,9/−37,1 idi. İç↔halka ΔE00 30,8'den 7,1'e indi.
  Görsel: `_onizleme/s1-d2-katara.jpg`.
- b. Maske farkı dışında eski↔yeni ort. fark (/255): l2[0] 0,183; t12[0] 0,0098; l1[0] 0,208; t01[0] 0,0009; t01[53]
  0,0096; t23[0] 0,065. Bütün 438 karede en çok 0,211 (l1); > 1,5 olan kare yok.
- c. Dikişler, ΔE00 ort. (D / C-B): t01[53]↔l1[0] 0,089 / 0,089; l1[119]↔l1[0] 0,048 / 0,109; l1[0]↔t12[0] 0,089 /
  0,089; l1[119]↔t12[0] 0,104 / 0,104; t12[59]↔l2[0] 0,103 / 0,103; l2[119]↔l2[0] 0,088 / 0,151; l2[0]↔t23[0] 0,101 /
  0,101; l2[119]↔t23[0] 0,150 / 0,151; t23[83]↔l3[0] 0,031 / 0,031. t23 son 4 ardışık fark 0,023/255.
- d. t23 luma: kare 0–60'ta en düşük %22,66 (kare 25); kare 10–40 azalan, en büyük geri yükseliş 2,29 puan. C'ye
  göre en büyük fark 0,12 puan.
- e. t01[0] diski C ile aynı: bbox merkezi (959,0; 771,5), çap 350/347, ağırlık merkezi (951,9; 796,8). Eşik
  maskesinde 10 px değişti (9'u maske bölgesi dışında, gürültü), eşdeğer çap 305,7'den 305,6'ya indi. Beş klibin
  `.json`'u (dunyaC/dunyaR dahil) bayt bayt aynı.

Döngü gürültüsü (ön kontrol: 3 kısa koşu, 47 sn GPU). Şimdiki kod geçişlerde B/C master'ını bit düzeyine yakın
üretiyor: t01[0] 0,0009/255, t12[0] 0,0098/255. Kendi içinde de tekrarlanabilir: l2[0] iki ayrı süreçte 0,022/255.
l1/l2'de ise B master'ından gürültü düzeyinde farklı. Ortalama renk aynı, fark 0,18–0,21/255; tek piksellerde fark
155/255'e kadar çıkıyor (gece ışıkları ve Antalya arazi yaması). Döngüleri animasyonlu tohumla render eden depo dışı
teşhis kopyası da B'yi üretemedi. Yani B'nin l1/l2'si, döngü sabit tohumundan önceki ve bugün elde olmayan bir kod
durumuyla render edilmişti. Döngüler artık gerçekten sabit tohumlu. Ardışık fark l1'de 0,259'dan 0,115/255'e, l2'de
0,325'ten 0,205'e indi. Döngü kapanışı l1'de 0,257'den 0,111'e, l2'de 0,309'dan 0,188'e indi.

## E turu (brief §12.2, S1a: CPU hazırlık; render yok)

- `kamera.py` D2: G (38,75 K; 34,66 D; 0), d 2.000 km, p −90, 24 mm → dikey kadraj 1.687,5 km (D: 34,0/29,2,
  1.500 km, p −88). t12/t23 formülleri D2'den okur; t23 yanal kayma 358,2 → 392,8 km; C zamanları aynen (T23_FA 40,
  T23_VARIS 78, sabit tohum 78–83, perde 57). t12[0] ve t23[83] kamerası D ile bayt bayt aynı (json).
- `yaylar.py`: D1 pozuyla 27 kentten Antalya'ya büyük daire yayı, H = uzunluk × 0,12 (≤ 900 km), h(t) = H·sin πt;
  481 noktada ışın–küre testi, Antalya'da biten görünür parça 24 noktaya; uzuv girişi ikiye bölmeyle. 20 yay kentten,
  7 yay uzuvdan (Kyoto, Buenos Aires, Montreal, Bali, Cancún, Lima, Belém); uzuv giriş noktaları disk merkezine
  572,3–574,6 px (disk r 574,7). Antalya dikey (386,5; 758,1), yatay (666,5; 478,1).
- `hazirla.py c1`: C1 22–54 K / 16–48 D (7.680², 16,2 MB JPEG; D: 6.720×5.760, 8,7 MB). Eski kutunun içi bayt bayt aynı
  (yalnız eski kuzey kenarının 48 px'lik bandında 1.676 px, en çok 14/255; 1,5° kenar geçişinin dışı 0 px). `c1_su.png`
  3.840² (16 px fark, hepsi eski kenarda). `c1_yama.json` `eski` kutusunu taşır; `sahne.py` yeni şeridi `c1_ek_k`
  (ss(alt; 6.000 → 4.500 km); t12 kare 29–33) ile karıştırır, D1'de eski kenar ağırlığı. Yedek: `*.d-yedek.*`.
- `hazirla.py rolyef`: GEBCO_08 C1 30″ 34–44 K / 24–46 D (2.640×1.200), σ 1,2 px, 16 bit (8 bit × 257) →
  `rolyef_tr.png` + `rolyef_tr.json`. `sahne.py` Dunya malzemesinde ShaderNodeBump (dünya metresi): güç
  `--rolyef_guc` 0,2 · `rolyef_k` · kutu kenarında 1° geçiş; `--rolyef_mesafe` 40.000 m (yükseklik 1,0 ≈ 6.783 m →
  ×5,9 abartı; tahmin, önizlemede ayarlanır). `rolyef_k` = ss(alt; 9.000 → 4.000 km) · ss(alt; 300 → 600 km):
  t12 kare 21–35'te açılır, t23 kare 24–29'da kapanır; D1'de 0.
- Hale: atmosfer halesi × `hale_k` = 0,6 + 0,4 · ss(alt; 8.000 → 12.000 km) (t12 kare 14–22). t12 deklanşörü 0,3.
- Körfez yaması: t23 k16–30'daki dikdörtgen sınır **arazi ağının ±110 km kenarı** (S2 bölge yaması değil; ölçüldü:
  t23 k24 güney kenarında deniz B 38 → 50,6/255, G 8,8 → 16,6; arazi denizi `dkol` ×0,75 + ayrı BSDF). Arazi
  malzemesinde kenardan 3–13 km ve denizde Expo'dan 55–95 km gölgelendirme küre malzemesinin eşdeğerine geçer (aynı
  renk/su, pürüz 0,85/0,22, speküler 0,2/0,7, küre normali + rölyef); en dış 3 km alfa ile saydam. Expo'dan < 55 km ve
  kara 55–95 km değişmez (l3 yeniden render edilmiyor).
- CAPALAR p2 = `emanet01`…`emanet12` (emanet.ts) + `antalya`; json'da `etiketler` (`emanet`: no, donem, metin "",
  dx/dy 04, 05, 06, 07; `kunye`: "9–20 Kasım 2026"; p1'de de Antalya künyesi).

```
python -X utf8 -P yaylar.py                                    # ~1 sn → render-son/yaylar.json, src/lib/cop-kentleri.ts
python -X utf8 -P hazirla.py c1                                # 20,9 sn, RSS tepe 2,25 GiB
python -X utf8 -P hazirla.py rolyef                            # 1,7 sn, RSS tepe 0,12 GiB
D:/soft/cop31-varlik/blender/blender-5.2.3-windows-x64/blender.exe -b --factory-startup -P sahne.py -- --klip l1,t12,l2,t23 --sadece_json --cikis D:/soft/cop31-varlik/s1/e_json
```

### S1b: önizleme, düzeltmeler, Cycles son render (brief §12.2, §12.6)

Yedek: `render-son-d/{t12,l2,t23}/` + `.json` (robocopy **kopya**, sabit bağ değil; 60/120/84 dosya, boyutlar birebir) ve
`render-son-d/_onizleme/s1-*` (24 dosya; `kontak.py olc` bu tur çalıştırılmadı, `s1-olcum.json` D bloğuyla duruyor).
Geri almak için `render-son-d` içeriğini `render-son`'a kopyala.

Önizlemede bulunup `sahne.py`'de düzeltilenler:

- **Kopuk hale** (t12): hale (`Atmosfer` kabuğu) gece yanına güneş·uzuv −0,25'e kadar uzanıyordu. Yüzey kararınca turuncu
  yay uzayda süzülüyordu. Yeni ortam anahtarı `hale_ic_k` = ss(alt; 15.450 → 13.450 km) · ss(alt; 1.000 → 1.900 km):
  l1 irtifasında (15.529 km) 0, t12 k10'da 1. 1'ken iki şey olur: dış hale gece sınırı `--hale_ic_lo` −0,04'e çekilir,
  uzvun içine dış haleyle sürekli bir pus bandı eklenir (`--hale_ic_A` 0,7 · exp(−(1 − b)/`--hale_ic_H` 0,02); yön ve
  renk uzuv azimutundan). `hale_ic_k` = 0'da kabuk eskisiyle aynı: t12[0]↔l1[0] 0,0885, D ile aynı. 2. tur denemesi,
  yani disk parıltısının yönünü de uzuv azimutuna bağlamak, l2'yi ΔE00 2,27 değiştirdi ve geri alındı.
- **Körfez kenarı** (t23 k16–30): S1a'nın küre eşdeğeri halkası rengi eşitledi, ancak 3 km'lik yarı saydam dış halka iki
  kez sayılıyordu. Hem altındaki küreyi gölgeliyor hem de o gölgeli kürenin üstünden görünüyordu. Sonuç 3–6 px'lik bir
  koyu çizgiydi (−4/255). Düzeltme: Arazi malzemesinde gölge ışınları (`Is Shadow Ray`) için halka tümüyle saydam
  (kenar 2.990 → 3.000 m). Kamera ışınları ve iç kısım değişmedi; t23[83]↔l3[0] 0,0312.
- Teşhis bayrağı `--teshis_bulut_yok`: bulut kabuğu render'a girmez. Yalnız ölçüm için kullanılır, son render'da yok.

Son render (D ayarları + yukarıdakiler; Cycles 1920², uyarlamalı, 64/32 örnek, OIDN, deklanşör t12 0,3 / t23 0,25):
t12 310 sn (kare medyanı 5,87 sn), l2 697 sn (5,74), t23 849 sn (8,05; en çok 25,2). Toplam 30,9 dk. Önizleme ve
testlerle birlikte bu turda 37,2 dk GPU harcandı. RAM tepe RSS 3,56–4,26 GB, VRAM makine tepesi 5,13–5,65 GB.
Ölçümler `render-son/_onizleme/s1-e-olcum.json`, kontak sayfaları `_onizleme/s1-e-{g12,g23,hale,korfez,p2,rolyef}.png`.
Ölçüm betikleri depo dışında (oturum scratchpad'i `s1b/`): `hale_olc.py` (E0 ölçütü + bant20), `korfez.py`, `katara.py`,
`rolyef_yon.py`, `olc_son.py`.

```
python -X utf8 -P calis.py --kilit --etiket e_onizleme -- --klip t12,l2,t23 --res 960 --onizleme --kareler "t12:0,10,14,16,18,20,22,24,26,28,30,34,40,59;l2:0,60,119;t23:0,10,16,20,24,28,30,40,60,83" --cikis D:/soft/cop31-varlik/s1/e_onizleme
python -X utf8 -P calis.py --kilit --etiket e_son_<klip> -- --klip <klip> --engine CYCLES --res 1920 --cikis D:/soft/cop31-varlik/render-son --olcum D:/soft/cop31-varlik/s1/e_son_olcum.jsonl
#   sırayla t12, l2, t23: klip başına ayrı süreç ve kilit, aralarda 25 sn
```

## F turu (brief §13: "fiske" geçişler) — S1-F tasarım + önizleme

Kullanıcı: "önceki tasarımda en güzel olan geçişlerdi; Antalya'dan fuar alanına hızlıca yakınlaşma… her geçişte olmalı".
Bu tur yalnız tasarım ve EEVEE 960² önizleme; son render yok.

**Profil** (`kamera.py`, `PROFIL = "fiske"`; `sahne.py --profil eski` E turu zamanlamasını bire bir verir):

- `fiske(t, a, k, m)`: ln d ilerlemesi. İlk `a` (0,15 s) beşinci derece kalkış (`_besinci`; s, s', s'' sürekli, hız 0'dan),
  sonra ease-out `1 − (1 − m·u)^k` (`m` = 1 tam iniş; t34a'da `m` 0,4: kare 47'de hız sıfır değil). Kalkışın değeri
  "yarı hız" kuralıyla (kalkış ortalama hızı = birleşme hızının yarısı) → hız 0'dan tekdüze artar, birleşmede aşma yok.
- `ilerleme(klip, f)` → (s, t_eski). t01/t12/t34a: pencereler eski fonksiyonlarıyla t_eski(s) = ease_sine⁻¹(s)
  (t34a: `t34a_eski_kare` = t34a_ilerleme⁻¹) noktasında → **yol E turuyla aynı, yalnız zamanlama değişti**. t23: yeni s
  pencereleri (`T23_H` baş −120° s 0,10–0,90; `T23_P` eğim s 0,45–0,99; oy/lens eski sınırların s karşılığı); eski yol
  baş dönüşünü ve eğimi kent yaklaşımına sıkıştırıyordu (bulut perdesinin içi). `s = 1`'de eski formül → uç kareler
  bit düzeyinde aynı.
- Kare sayıları `KARE_FISKE` (F-B: t01 54, t12 54, **t23 72** (2,4 s; son 6 kare durgun), **t34a 36** (1,2 s; t34
  toplamı `TOPLAM_T34` 60)), `KARE_ESKI` (54/60/84/48, t34 72); `profil_sec()` `KLIPLER`'i (ve `toplam`'ı) günceller.
  k: t01/t12 2,4, t23 2,2.
- t34a kipi `T34A_KIP` (`sahne.py --t34a_kip`, varsayılan **`kalkis`**, F-B): `kalkis(t, a, us)` = fiske kalkışı (0,15 s,
  beşinci derece, yarı hız kuralı) + sürekli ivmelenme `t^us` (`KALKIS_US` 1,25): hız kare kare artar, çatı üstünde
  takılma yok, kare 35'te (ışıklık bandı ~106 m, eski kare 47'nin durumu) hız en yüksek. `fiske` = F-A'nın kesik
  ease-out adayı (m 0,4), yalnız karşılaştırma.

**Sahne** (`sahne.py`): `--profil fiske|eski`; `--t23_bulut oto|eski|yok` (fiske'de perde ve yerel kümülüs yok;
`eski` anlamlı olan `--profil eski` ile); `--sabit_tohum oto` (t23 son 6 durgun kare: F-B 66–71, E 78–83; t34a 0–2);
t34a ışıklık parıltısı `isik_k` yolun aynı noktasına (t_eski) bağlı; JSON'da `f_turu` (profil, a, k, m, kare,
kare kare ilerleme, t23 pencereleri). Pozlama zaten irtifaya bağlı (`pozlama(st["irtifa"])`, `POZ_EGRI` ln irtifa).
`parlama.py --bas 33` (varsayılan, F-B): rampa 33–35 (a_f 0,29 / 1,31 / 3,2), kare 35 tam #FFF1DC (`--son` boşsa
ham/'daki en büyük kare); F-A `--bas 45` (son 47); `--bas 38` eski tablo. t34a.json `kesme` alanı K için: `s1_son_kare`
35, `s2_ilk_kare` 36, `t34b_t34_ofset` 36, `parlama_bas` 33, `kirpim_y_t34` {200 → 420, k0 35, k1 36}; `toplam_kare_t34`
60, `t34_kare` [0, 35]. `t34-birlestir.py` t34a uzunluğunu `kare`'den okur (kod değişikliği gerekmez).
`kontak.py --n 0 --onek s1-f- --bicim png --on <dizin>`: bütün kareler ızgarada (kare no + irtifa).
- Pozlama: `--poz oto` → fiske + bulutsuz t23'te `egri_f`. `POZ_EGRI`'nin 25–88 km düğümleri F önizlemesinden yeniden
  çıkarıldı; luma tabanı %22,5, ölçülen EV duyarlılığı ≈ 8,4 puan/EV. C'nin negatif düğümleri yerel kümülüsü
  bastırmak içindi ve bulutsuz kentte kare 23'ü %16,8'e indiriyordu. ≥ 100 km ve ≤ 25 km E ile aynı.
- Teşhis bayrakları (yalnız EEVEE; Cycles etkilenmez): `--golge_m` (güneş gölgesi en büyük çözünürlüğü),
  `--ee_rt` (ekran-uzayı ışın izleme + hızlı GI), `--isik_carpan` (ışıklık parıltısı çarpanı).

Önizleme (F-A, 960²; kareler `render/_onizleme/s1-f*`, kontak `s1-f-<klip>.png`, mp4, kent kareleri
`s1-f-t23-kent-*.png`, kaplama grafiği `s1-f-t23-kaplama.png`):

- Dikişler: t01[53]↔l1[0] ΔE00 0,000; t12[53]↔l2[0] 0,000; t23[83]↔l3[0] 0,020; l3[0]↔t34a[0] 0,040.
- t23 bulut kaplaması en çok %0,88 (güneş parıltısı). Luma kare 0–31 %20,4–25,7, sonra l3'ün %40'ına tekdüze.
- OSM 40 km açılışında (kare 28) sıçrama yok.
- t34a parlaması: kare 45 %78,1, 46 %93,2, 47 tam #FFF1DC. %80+ beyaz kare S1'de 2.
- **EEVEE uyarıları:**
  - t23 alçak irtifada TAA 16 ile kare başına 46–75 sn; maliyet örnek başına (TAA 4 19–23 sn; MB ya da gölge değil).
  - t34a'da ışıklığa ~310 m kala (fiske kare 19–20, eski kare 29) EEVEE süreci 0xC0000409 ile çöküyor. MB, gölge,
    ışın izleme ve parıltı kapatılınca da çöküyor.
  - Önizlemede bu yüzden t23 kare 43–83 TAA 4, t34a Cycles 960² 16 örnek + OIDN (kare başına 2,3 sn).
  - Sonraki önizlemeler için Cycles 960² düşük örnek EEVEE'den hızlı ve kararlı.

```
python -X utf8 -P calis.py --etiket f_on_g1 -- --klip t01,l1,t12,l2 --kareler "t01:0-53;l1:0;t12:0-53;l2:0" --res 960 --onizleme --kilit --cikis D:/soft/cop31-varlik/render/_onizleme/s1-f
python -X utf8 -P calis.py --etiket f_on_g2 -- --klip t23,l3 --kareler "t23:0-83;l3:0" --res 960 --onizleme --kilit --samples 4 --cikis D:/soft/cop31-varlik/render/_onizleme/s1-f
python -X utf8 -P calis.py --etiket f_on_g3 -- --klip l3,t34a --kareler "l3:0;t34a:0-47" --engine CYCLES --res 960 --samples 16 --depth 8 --kilit --cikis D:/soft/cop31-varlik/render/_onizleme/s1-f-34
python -X utf8 -P parlama.py D:/soft/cop31-varlik/render/_onizleme/s1-f-34/t34a --bas 45
python -X utf8 kontak.py kontak t23 --render D:/soft/cop31-varlik/render/_onizleme/s1-f --on D:/soft/cop31-varlik/render/_onizleme --onek s1-f- --n 0 --bicim png
```

### F-B (brief §13.5): kısalan klipler, t34a "kalkis" — S1-F2

GPU'suz ölçüm (`scratchpad/f-s1b/profil.py`; master 1920², K = dikey kırpım kenar ortası, S = kırpım sınırları):

| klip | kare / s | p(0,5) ln kadraj | tepe K (kare) | K > 0,3 s | son 3 S px |
|---|---|---|---|---|---|
| t01 | 54 / 1,8 | 0,804 | uzay | — | 0,48 / 0,24 / 0,05 |
| t12 | 54 / 1,8 | 0,821 | 39,9 (6) | 39,0 | 1,08 / 0,53 / 0,12 |
| t23 | **72 / 2,4** (k 2,2) | 0,776 | 274,8 (5) | 141,1 (9) | 0 / 0 / 0 (66–71 durgun) |
| t34a | **36 / 1,2** (kalkis 1,25) | t34 (0–59) **0,764**; kare 30'da 0,784 | 97,6 (34) | 97,6 | 254 / 263 / 266 (parlamaya dalış) |

t34a kare 10–35 hız / tepe en az: ln d 0,73, K 0,513, S 0,51 (tam kare M 0,485: eğim penceresi, yol E ile aynı); hız
kare 2–35 tekdüze artar. Uç eşitlik (konum/yönelim/lens farkı 0): t23[71] ≡ E t23[83] ≡ l3[0], t34a[35] ≡ E t34a[47],
t34a[0..1] ≡ l3[0]. Önizleme: Cycles 960², 16 örnek + OIDN, `render/_onizleme/s1-f2-34/`, kontak `s1-f2-t34a.png`.

```
python -X utf8 -P calis.py --kilit --etiket f2_on_t34a -- --klip l3,t34a --kareler "l3:0;t34a:0-35" --engine CYCLES --res 960 --samples 16 --depth 8 --kilit --cikis D:/soft/cop31-varlik/render/_onizleme/s1-f2-34
python -X utf8 -P parlama.py D:/soft/cop31-varlik/render/_onizleme/s1-f2-34/t34a --bas 33
python -X utf8 kontak.py kontak t34a --render D:/soft/cop31-varlik/render/_onizleme/s1-f2-34 --on D:/soft/cop31-varlik/render/_onizleme --onek s1-f2- --n 0 --bicim png
```

**Son render (R-F; sıralı, tek Blender süreci, aralarda ≥ 20 sn; cwd `scripts/blender/s1`).** Önce E yedeği
(`render-son-e\`, yalnız t01/t12/t23/t34a + json, kopya) doğrulanır, sonra `render-son/{t01,t12,t23,t34a}` silinir
(eski t12 54–59, t23 72–83, t34a 36–47 kalmasın). Varsayılanlar (`--profil fiske`, `--t23_bulut oto` → yok, `--poz oto`
→ egri_f, `--sabit_tohum oto`, `--t34a_kip kalkis`) doğru; ek bayrak yok.

```
python -X utf8 -P calis.py --etiket f_son_t01  -- --klip t01  --engine CYCLES --res 1920 --kilit --cikis D:/soft/cop31-varlik/render-son --olcum D:/soft/cop31-varlik/s1/f_son_olcum.jsonl
python -X utf8 -P calis.py --etiket f_son_t12  -- --klip t12  --engine CYCLES --res 1920 --kilit --cikis D:/soft/cop31-varlik/render-son --olcum D:/soft/cop31-varlik/s1/f_son_olcum.jsonl
python -X utf8 -P calis.py --etiket f_son_t23  -- --klip t23  --engine CYCLES --res 1920 --kilit --cikis D:/soft/cop31-varlik/render-son --olcum D:/soft/cop31-varlik/s1/f_son_olcum.jsonl
python -X utf8 -P calis.py --etiket f_son_t34a -- --klip t34a --engine CYCLES --res 1920 --kilit --cikis D:/soft/cop31-varlik/render-son --olcum D:/soft/cop31-varlik/s1/f_son_olcum.jsonl
python -X utf8 -P parlama.py D:/soft/cop31-varlik/render-son/t34a --bas 33
python -X utf8 -P kontak.py hepsi --render D:/soft/cop31-varlik/render-son
```

Tahmin (ölçülmedi; D/E kare sürelerinden): t01 ~1,8 + t12 ~4,7 + t23 ~11–13 + t34a ~4,9 ≈ **22–25 dk** GPU.
