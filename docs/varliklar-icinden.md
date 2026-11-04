# `/icinden` v3 varlıkları: dünyadan standa render için kaynaklar (R1)

Görev: 2 Kasım 2026 müşteri geri bildirimi (foto-gerçekçi, renkli, "içine çeken" dalış; bölüm bölüm adımlama, uzun geçişler). Blender'da önceden render edilecek klipler için lisansı temiz ham varlıklar toplandı. Site koduna dokunulmadı.

- **Konum:** `D:\soft\cop31-varlik\` (depo dışında, git'e girmez). Toplam ~2,0 GB (R1 klasörleri: dunya 439 MB, sentinel 1,4 GB, dem 221 MB, diğerleri 30 MB). Her alt klasörde `KAYNAK.md` var: URL, tarih, MD5, işlem, atıf.
- **Ortak koordinat çerçevesi `expo-yerel-m`:** v2 `expo-harita.ts` ile aynı (dosya v3 B turunda silindi; git b9cd9db). Orijin Expo poligon merkezi 36,9397171 K / 30,8175767 D. `x=(lon−30,8175767)·88874,70`, `y=(36,9397171−lat)·111195,08`, x doğu +, y güney +, metre. Sentinel, DEM ve OSM ürünleri bu çerçevede; **Expo (0,0) her rasterin tam ortasında**. GeoTIFF'lerdeki eşdeğer proj4: `+proj=eqc +lat_ts=36.9397171 +lat_0=36.9397171 +lon_0=30.8175767 +R=6371008.8` (pyproj ile formüle cm düzeyinde eşit).

## 1. Tablo

| Varlık | Dosya (`cop31-varlik\…`) | Boyut | Çözünürlük | Kaynak | Lisans | Zorunlu atıf |
|---|---|---|---|---|---|---|
| Dünya, gündüz (Ağustos) | `dunya\world.topo.bathy.200408.3x21600x10800.jpg` | 27,2 MB | 21600×10800 (~1,85 km/px ekvator) | NASA Visible Earth, Blue Marble NG + topo/bati | kamu malı | "NASA Earth Observatory" |
| Dünya, gündüz (Kasım) | `dunya\world.topo.bathy.200411.3x21600x10800.jpg` | 29,7 MB | 21600×10800 | aynı (COP31 ayı, Toroslarda kar) | kamu malı | aynı |
| Bölge karosu (Ağustos / Kasım) | `dunya\world.topo.bathy.20040{8,11}.3x21600x21600.C1.jpg` | 89,1 / 98,6 MB | 21600² (0–90 D, 0–90 K; ~463 m/px) | aynı | kamu malı | aynı |
| Gece ışıkları | `dunya\BlackMarble_2016_3km.jpg`, `…_C1.jpg` | 8,1 / 59,1 MB | 13500×6750 (3 km), C1 21600² (~500 m) | NASA EO, Black Marble 2016 (VIIRS) | kamu malı | "NASA Earth Observatory / Joshua Stevens, Suomi NPP VIIRS (M. Román, NASA GSFC)" |
| Bulutlar | `dunya\cloud_combined_8192.tif` | 35,9 MB | 8192×4096 | NASA GSFC, Blue Marble Clouds | kamu malı | "NASA GSFC / Reto Stöckli" |
| Yükseklik (bump) | `dunya\gebco_08_rev_elev_21600x10800.png`, `…_C1_grey_geo.tif` | 18,4 / 27,5 MB | 21600×10800 8 bit; C1 10800² GeoTIFF (~1 km) | NASA EO, GEBCO_08 | NASA görseli kamu malı; GEBCO ızgarası ücretsiz, atıf ister | "GEBCO" |
| Batimetri / su maskesi | `dunya\gebco_08_rev_bath_21600x10800.png` → `su-maskesi-{21600x10800,8192x4096}.png` | 35,1 MB / 0,8 MB | 21600×10800 | aynı, maske türetildi (iç göller yok) | aynı | "GEBCO" |
| 8K kolaylık kopyaları | `dunya\8k-*.jpg/png` | 4–10 MB | 8192×4096 | yukarıdakilerden Lanczos | kamu malı | — |
| **Antalya uydu, bölge (Kasım, önerilen)** | `sentinel\s2-bolge-kasim.png`, `-4096.png`, `-tci.png`, `-refl16.tif`, `.json` | 78,0 MB png (+ 4096: 34,4; tci 77,5; refl16 tif 146,4) | ±76,8 km, 25 m/px, 6144² | Copernicus Sentinel-2 L2A, **16.11.2025**, 4 karo | Copernicus açık veri | **"Contains modified Copernicus Sentinel data 2025"** |
| **Antalya uydu, geniş (Kasım)** | `sentinel\s2-genis-kasim.*` | 73,5 MB png (+ 4096: 34,0; tci 70,5; refl16 tif 148,0) | ±30,72 km, **10 m/px (doğal)**, 6144² | aynı | aynı | aynı |
| **Expo uydu, yakın (Kasım)** | `sentinel\s2-yakin-kasim.*` | 12,2 MB png (tci 13,5; refl16 tif 36,4) | ±3,072 km, 2 m/px (10 m'den büyütme), 3072² | aynı | aynı | aynı |
| **Antalya uydu, bölge / geniş / yakın (İlkbahar, G4)** | `sentinel\s2-{bolge,genis,yakin}-ilkbahar.*`; Blender dokuları `s1\tex\s2_{bolge,genis,yakin}_ilkbahar.jpg` | 76,4 / 71,0 / 12,0 MB png (bölge 4096: 34,0; tci 77,3 / 69,7 / 13,1; refl16 tif 150,8 / 147,5 / 36,7); doku jpg 18,7 / 22,4 / 3,5 MB | aynı kutular | Copernicus Sentinel-2 L2A, **17.04.2025**, 4 karo, tek datatake | Copernicus açık veri | **"Contains modified Copernicus Sentinel data 2025"** (yıl değişmedi) |
| Antalya uydu, Eylül yedeği | `sentinel\s2-{bolge,genis,yakin}.*` (ek yok) | 78,1 / 71,5 / 12,5 MB png | aynı kutular | Sentinel-2 L2A, 24.09.2025, 4 karo | aynı | aynı |
| Yükseklik, bölge / geniş / yakın | `dem\dem-{bolge-50m,genis-30m,yakin-6m}.tif` + `-u16.png` + `.json`; `deniz-maskesi-*.png` | 18,0 / 8,1 / 2,5 MB (tif) | 50 / 30 / 6 m; 3072² / 2048² / 1024² | Copernicus DEM GLO-30 (AWS), 6 karo N36–37 E029–031 | Copernicus DEM GLO-30 lisansı (ücretsiz) | **"produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved"** |
| Expo 2 km, 3B | `osm\expo-3d.geojson` (+ ham `overpass-expo-2km.json`) | 189 kB | 596 öğe, 0,1 m | OpenStreetMap, Overpass 2026-11-02T16:52Z | ODbL 1.0 | "© OpenStreetMap katkıda bulunanlar" (sitede kapanış atıflarında, `Icinden3.tsx` `ATIFLAR`) |
| Broşür sayfaları | `brosur\brosur-01…12.png` | 18 MB | 1600×3360 (~406 dpi) | müşteri PDF'i (416 MB) | müşteri materyali | — |
| Stant taslağı | `stant\stant-1…8.png`, `stant-sN-gomulu-*.jpeg` | 6,7 MB | sayfa render + gömülü 1536×864 / 1280×720 render | müşteri PDF'i | müşteri materyali | — |
| Fontlar | `font\Montserrat-*.ttf`, `Lora-*.ttf`, `GreatVibes-Regular.ttf` | 4,7 MB | statik + değişken | Google Fonts / proje GitHub depoları | SIL OFL 1.1 | gerekmez |

Kullanılabilir fotoğrafların listesi `brosur\KAYNAK.md` §3'te (42 foto + 3 logo). p06 `solen-kocaeli-el-kalpte.jpg` **yasak**, p20 el öpme karesi önerilmez.

## 2. Ölçümler ve doğrulama

- **Bütünlük:** Bütün NASA dosyaları PIL ile tam çözüldü. Başlıklar doğru (JPEG `ffd8`, PNG `8950`, TIFF `4d4d`/`4949`). MD5'ler `dunya\_dogrulama.json` içinde. Copernicus DEM karoları rasterio ile açıldı (3600², float32, EPSG:4326).
- **Görsel denetim:** Her varlığın Antalya kırpımına bakıldı (`dunya\_onizleme\`, `sentinel\_onizleme-*.jpg`, `dem\_onizleme-dem-*.jpg`). Antalya Körfezi, kent, havalimanı pistleri, Aksu ve Köprüçay, Beydağları ve Toroslar doğru yerde.
- **Georef kanıtı** (`sentinel\_kanit-osm-bindirme.jpg`): OSM Expo poligonu, yollar ve 199 sera, Sentinel "yakın" mozaiğine bindirildi. Expo salonunun beyaz çatısı (way/321818703, 38.720 m²) ve ANFAŞ otoparkı poligonun içinde; yollar piksel düzeyinde örtüşüyor.
- **Expo konumu:** Rasterlerin tam ortası. `s2-bolge` ve `s2-genis` için piksel (3072, 3072) / 6144; `s2-genis-4096` için (2048, 2048); `s2-yakin` için (1536, 1536) / 3072. DEM: (1536, 1536) / 3072, (1024, 1024) / 2048, (512, 512) / 1024. NASA küresel 21600 dokuda (12649,1; 3183,6), C1 karolarında (7396,2; 12734,5).
- **Yükseklik:** Expo 59 m (DSM). Geniş kutuda en yüksek nokta 1996 m, bölge kutusunda 3057 m. Deniz 0.
- **Sentinel sahneleri:** Üç sahne var, her biri 4 karodan ve tek datatake'ten.
  - **İlkbahar 2025-04-17** (`GS2A_20250417T083741_051284_N05.11`; G4, müşteri "Antalya çöl gibi" dedi, brief §14.4.5): bulut %0,004–0,07, boş piksel bölgede %0,032 (KB köşesi), genişte %0,0004, yakında 0. Ova ve Döşemealtı yeşil, Toroslar ve Beydağları doruklarında kar, pus yok, deniz koyu lacivert. Güneş yüksekliği ~60°. Nisan–Mayıs 2026'da bulut < %3 olan tek dört karolu tarih 2026-05-30'du. O tarih elendi: ova hasat/sürüm kızılı (Kasım'daki "çöl" görüntüsü), bölge kutusunun doğusunda kümülüs, denizde güneş parıltısı var. Gerekçe ve aday listesi `sentinel\KAYNAK.md` "İlkbahar sahnesi" bölümünde. Dalışta irtifaya bağlı karışım kullanılıyor: d2 ve l2 Kasım dokusuyla kalır, d3 ve yakın alan ilkbahar dokusunu alır (`scripts/blender/s1/BENIOKU.md` G4).
  - **Kasım 2025-11-16** (`GS2B_20251116T084129_045421_N05.11`; `brief-icinden-3` mevsim uyumu istediği için önerilen; G4'ten sonra yalnız ≥ 500 km'de, d2'de): bulut 36SUF'ta %2,09 (açık denizde, geniş ve yakın kutuların dışında), diğer karolarda %0,004–0,23. Güneş yüksekliği ~33°: uzun gölgeler, yeşil ova, mavi-gri seralar.
  - **Eylül 2025-09-24** (`GS2A_20250924T083741_053572_N05.11`, görev ölçütü Haziran–Eylül): bulut %0,0015–0,084. Seralar beyaz ve parlak, ova kuru.
  - İkisinde de karo dikişleri 8 km'lik ağırlıklı geçişle giderildi. Denizde verinin kendisinden gelen ince çapraz dedektör bantları kaldı (su shader'ı altında kaybolur). Boş piksel oranları: bölge %0,067 / %0,12 (KB köşesi, Eylül / Kasım), geniş en çok %0,007, yakın 0. Kasım bölge karesinin GD köşesinde açık denizde küçük bulutlar var.

## 3. Sitedeki atıf satırı (öneri, ONAY)

Kapanıştaki mevcut satıra eklenecek:

> Uydu görüntüsü: Contains modified Copernicus Sentinel data 2025 · Yükseklik: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved · Dünya: NASA Earth Observatory (Blue Marble, Black Marble), GEBCO · Harita verisi © OpenStreetMap katkıda bulunanlar

Sentinel atıf yılı **2025**. Kasım (2025-11-16) ve ilkbahar (2025-04-17, G4) sahnelerinin ikisi de 2025 tarihli, bu yüzden G4'te satır değişmedi (`Icinden3.tsx` `ATIFLAR` ve `page.tsx` aynen kalır). NASA logosu ya da onay izlenimi verecek bir ifade **kullanılmamalı**. `docs/onay-listesi.md` §14'teki "kapanıştaki atıf satırları" maddesi bu metinle güncellenmeli (entegrasyon ajanı).

## 4. Eksikler

- **10 m'nin altı yok.** Açık lisanslı yüksek çözünürlüklü ortofoto bulunamadı. OpenAerialMap (CC BY 4.0) sorgusu bu bölge için 0 sonuç döndü; Google, Bing, Mapbox, ESRI ve EOX yasak. Kamera ~1,5 km irtifanın altına inince Sentinel dokusu yumuşar. Son yaklaşım OSM'den modellenmiş 3B Expo/salon + prosedürel doku + stant modeliyle yapılmalı.
- COP31 geçici yapıları (Mavi/Yeşil Bölge çadırları, girişler) hiçbir açık kaynakta yok. Görüntüler Nisan, Eylül ve Kasım 2025 tarihli.
- Salonun gerçek yüksekliği ve çatı biçimi bilinmiyor; 14 m varsayıldı. Stantın salon içindeki yeri ve numarası da bilinmiyor (onay §14).
- Su maskesinde iç göller yok (GEBCO bati). Antalya yakın planında DEM'den türetilen `deniz-maskesi-*` kullanılmalı.
- Bulut dokusu tek bir anlık görüntü (döngü animasyonu için kaydırma/gürültüyle oynatılmalı).

## 5. Riskler

- **Atıf yükümlülüğü:** Copernicus DEM uyarlanmış veri atfı uzun ve İngilizce, yazılması zorunlu. Sentinel atfı da zorunlu. İkisi olmadan klipler yayımlanmamalı.
- **NASA marka kuralı:** Atıf serbest, ancak logo ya da "NASA ile" gibi bir ifade siyasi bir kurum sitesinde onay izlenimi verir; kesinlikle kullanılmamalı.
- **Planetary Computer erişimi:** SAS belirteci ~1 saat geçerli. Anonim erişim hız sınırlı. Yeniden üretim betikle 10–15 dakika sürer (`_betikler\s2.py`). Ham bantlar diskte değil, yalnızca mozaikler var.
- **Değişken font tuzağı:** Blender değişken fontun varsayılan örneğini yükler (Montserrat'ta Thin). Statik TTF'ler kullanılmalı. Lora'da `₂` glifi yok.
- **Ay seçimi:** Kasım dokusu gerçeğe uygun ama Kuzey Yarıküre karlı. Ağustos dokusu daha yeşil. Bu bir sanat yönetimi kararı (müşteriye sorulabilir).

## 6. Yeniden üretim

Betikler `D:\soft\cop31-varlik\_betikler\` (Overpass sorgusu dahil): `s2.py` (Sentinel), `dem.py`, `osm3d.py`, `brosur.py`, `nasa_dogrula.py`. Python 3.14 + rasterio 1.5.2, pyproj 3.8, shapely, PyMuPDF 2.0, PIL 12.3. Çalıştırma: `python -X utf8 -P betik.py …` (`--user` paketleri için `-I` değil `-P`).
