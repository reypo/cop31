# `expo-harita.ts`: Antalya Expo Center vektör haritası (H2)

`src/components/icinden/expo-harita.ts`, `/icinden` rotasının 2. durağı (küre → Antalya → Expo)
için OpenStreetMap'ten türetilmiş, sadeleştirilmiş vektör harita verisidir. Dosya **üretilmiştir**;
elle düzenlenmez, aşağıdaki "Yeniden üretim" adımlarıyla yeniden yazılır.

## 1. Kaynak ve tarih

| Dosya (scratchpad `osm-dl/`) | Kaynak | OSM veri zamanı | İçerik |
|---|---|---|---|
| `expo.json` (905 kB) | Overpass API (`out geom`) | 2026-11-02T12:00:08Z | 1.351 way: 410 highway, 311 building, 628 aeroway, 1 natural=water |
| `expo-way.json` | OSM API 0.6 (cgimap) | way 1572443333 v1, changeset 191149333, 2026-10-28 | Yalnızca Expo poligonu (15 düğüm) |
| `kiyi.json` (174 kB) | Overpass API, `overpass-api.de` | 2026-11-02T12:08:21Z | 78 way `natural=coastline` |

- İndirme tarihi: 2 Kasım 2026. Kıyı sorgusu (User-Agent `cop31-stand-site/0.1`, sunucu ilk üç denemede
  502 "at capacity" döndü, üstel geri çekilmeyle 4. denemede 200):
  `[out:json][timeout:120];way["natural"="coastline"](36.70,30.45,37.05,31.05);out geom;`
- Expo poligonu: OSM way **1572443333**, `amenity=exhibition_centre`, `name=Antalya Expo Center`,
  `name:tr=Antalya Fuar ve Kongre Merkezi` (ANFAS), `capacity=3800`, `start_date=1999`. Overpass ve OSM API
  sürümleri düğüm düğüm karşılaştırıldı (fark < 1e-7°); esas alınan OSM API sürümü.
- Poligon OSM'ye 28 Ekim 2026'da eklenmiş (v1); COP31 için kurulacak geçici yapılar OSM'de yok.

## 2. Lisans ve atıf (ZORUNLU)

- Veri © OpenStreetMap katkıda bulunanlar, **ODbL 1.0**. Haritanın göründüğü rotada (öneri: kapanış
  bloğunda küçük satır) şu metin bulunmalı: **"© OpenStreetMap katkıda bulunanlar"**. Modül bunu
  `expoHarita.atif` / `OSM_ATIF` olarak verir; metni kopyalamak yerine bu sabit kullanılmalı. Mümkünse
  `https://www.openstreetmap.org/copyright` bağlantısı (brief'teki "izin verilen linkler" listesine ek;
  ONAY gerektirir, yoksa yalnızca metin satırı yeterli).
- `expo-harita.ts` OSM'den türetilmiş bir veritabanıdır; ODbL 1.0 altında kalır (dosya başlığında yazılı).
  Ekrandaki çizim "Produced Work" sayılır, atıf satırı yeterlidir.
- `docs/onay-listesi.md`'ye eklenecek madde (entegrasyon ajanı): harita atfının yeri.

## 3. Koordinat sistemi

- **Orijin (0, 0):** Expo poligonunun alan ağırlık merkezi **36,9397171 K / 30,8175767 D** (brief'teki
  36,9398 / 30,8176 ile ~10 m fark; iki turda yerel düzlemde hesaplandı). Poligon alanı 133.935 m².
- **Projeksiyon:** equirectangular; `x = (λ − λ0)·kx`, `y = (φ0 − φ)·ky`, `kx = 88.874,70 m/°`,
  `ky = 111.195,08 m/°` (R = 6.371.008,8 m, `cos φ0`). Doğu-batı ölçek hatası ≈ tan φ0·Δφ: ±900 m'de
  < %0,02, havalimanında ~%0,05, kıyı kutusunun uçlarında ~%0,3 (görsel olarak önemsiz).
- **Eksenler:** x doğu +, **y güney +** (SVG ekseni; kuzey ekranda yukarı). Birim metre, **tam sayı**.
- **Biçim:** `Nokta = [x, y]`; `Cizgi` açık çoklu çizgi; `Halka` poligon dış halkası, ilk nokta sonda
  **tekrarlanmaz** (`alanPath()` "Z" ekler).
- Ayrıntı penceresi doğrudan `viewBox="-900 -900 1800 1800"`.

## 4. Katmanlar, seçim kuralları ve eşikler

| Katman | Seçim | Kırpma / pencere | Douglas–Peucker | Adet | Nokta |
|---|---|---|---|---|---|
| `expo` | way 1572443333 | — | yok (14 köşe) | 1 | 14 |
| `salonlar` | building; köşesi Expo içinde **ya da** sınıra ≤ 10 m ve `greenhouse`/`roof` değil | — | 1 m | 1 | 38 |
| `binalar` | diğer tüm building; köşe ortalaması ±700 m kutuda | yok (köşeler en çok 707 m) | 3 m | 135 | 601 |
| `yollar.ana` | motorway, trunk, primary, secondary (+ `_link`) | ±900 m, Liang–Barsky | 4 m | 22 | 57 |
| `yollar.ikincil` | tertiary(+link), residential, unclassified, living_street, road | ±900 m | 4 m | 165 | 575 |
| `yollar.servis` | service, footway, path, steps, track, pedestrian, cycleway, bridleway, corridor | ±900 m | 4 m | 64 | 175 |
| `pist` | aeroway runway (önce) + taxiway, orta çizgi | **kırpılmadı** | 4 m | 3 + 127 | 455 |
| `pistAna` | `pist`'in ilk 3 öğesi (runway 18L/36R, 18C/36C, 18R/36L; 45 m genişlik) | — | 4 m | 3 | — |
| `su` | natural=water | — | 3 m | 1 | 7 |
| `kiyi` | natural=coastline, uç düğüm kimliğiyle zincirlenmiş | kıyı kutusuna kırpıldı | 60 m | 2 | 129 |
| `deniz` | `kiyi` ana zinciri + kutu kenarı (deniz tarafı) + adalar | kıyı kutusu | 60 m | 1 + 1 ada | 129 |

- Ham → sade nokta: yollar 1.661 → 807; kıyı 2.290 → 129; pist + taksi 1.275 → 455.
- Kıyı: 78 way → 7 zincir; ana zincir güney kenardan (Kemer yönü) girip doğu kenardan (Lara/Kundu sonrası)
  çıkar. 60 m eşiğinde 15 m'den küçük kalan **5 kayalık elendi**; 108×382 m'lik bir ada üç köşeyle kaldı.
- Elenen bina: 175 bina ±700 m dışında (159 sera, 5 havalimanı yapısı, 11 diğer); DP sonrası yozlaşan bina yok.

## 5. Kutular ve noktalar

| Ad | Metre (x, y, w, h) | Coğrafi |
|---|---|---|
| `expoHarita.bbox` (ayrıntı, ±900 m) | −900, −900, 1800, 1800 | 36,93162–36,94781 K / 30,80745–30,82770 D |
| `expoBbox` (Expo poligonu) | −195, −226, 415, 514 | — |
| `expoHarita.pistBbox` | −2947, 2211, 2398, 4332 | pistler Expo'nun 2,2–6,5 km G/GB'sinde |
| `expoHarita.kiyiBbox` | −32668, −12263, 53325, 38918 | 36,70–37,05 K / 30,45–31,05 D |

| `noktalar` | Metre | Uzaklık | Not |
|---|---|---|---|
| `expo` | [0, 0] | 0 | ağırlık merkezi (Expo poligonunun içinde) |
| `salon` | [−29, −84] | 89 m | fuar holünün ağırlık merkezi; "Standımız" pini için öneri |
| `havalimani` | [−1518, 4561] | 4,8 km | 36,8987 K, 30,8005 D (pistlerin arası) |
| `kentMerkezi` | [−9952, 6184] | 11,7 km | 36,8841 K, 30,7056 D (kıyıda) |

## 6. Modül ve API

- Boyut: **35.387 bayt** (sınır 60 kB). Satır başına bir öğe; açık tipli sabit (`ExpoHarita`).
- Dışa aktarılanlar: `expoHarita` (`ExpoHarita`, `as const`), `expoBbox` (`Kutu`), `noktalar` (`Noktalar`),
  `OSM_ATIF`, `METRE_DERECE`; fonksiyonlar `yolPath(seg)` (açık çizgi → `"M x yL x y…"`), `alanPath(ring)`
  ("Z" ile kapalı), `birlesikPath(parcalar, kapali?)` (bir katmanı tek `<path>`'e toplar),
  `konum(lat, lng)` (aynı projeksiyonla yeni nokta); tipler `Nokta`, `Cizgi`, `Halka`, `Kutu`,
  `CografiKutu`, `YolKademesi`, `ExpoHarita`, `Noktalar`.
- Kullanım örneği (SVG, d'ye bağlı çizim B'nin işi):
  `<path d={birlesikPath(expoHarita.yollar.ana)} fill="none" />`,
  deniz için `fillRule="evenodd"`.

## 7. Varsayımlar ve sınırlar

- **Salon tespiti:** Expo poligonu içinde OSM'de **tek bina** var (way 321818703, `building=commercial`,
  ~38.700 m², 321×254 m, poligonun kuzey yarısı). Kuzey kenarındaki dişli çıkıntılar (20–37 m aralıklı)
  bitişik hol modüllerine işaret ediyor ama ayrı salonlar OSM'de çizili değil; bölmek tahmin olurdu, bu
  yüzden `salonlar` tek halka. Poligonun güney yarısı boş (açık alan/otopark ya da COP31 geçici holleri;
  OSM'de yok). **Salon ve stant numarası bilinmiyor → ONAY.** `noktalar.salon` yalnızca pin için önerilen yer.
- Bitişiklik kuralı (≤ 10 m) yalnızca seraları ve çatıları dışarıda bırakmak için var: 11,5 m'deki akaryakıt
  istasyonu çatısı ve 11,3 m'deki sera `binalar`'a düştü.
- `corridor` (bina içi geçit) `servis`'e kondu; ikisi de havalimanı terminalinde, pencere dışında kaldığı için çıktıda yok.
- `pist` kırpılmadı (Expo penceresinin tamamen dışında); taksi yolları ince, `pistAna` kalın çizilmeli.
- `su`: tek küçük gölet (33×37 m), ±900 m penceresinin dışında (~1,4 km KD). Deniz için `deniz` kullanın.
- `deniz` yönü: kutu kenarı boyunca iki kapanıştan Expo'yu (0, 0) içermeyeni seçildi (denetlendi: kent
  merkezi karada, körfez içi denizde).
- Yollar parça parça (OSM way sınırlarında bölünmüş), birleştirilmedi; tek `<path>` ile çizmek yeterli.

## 8. Doğrulama (2 Kasım 2026)

- Önizleme: scratchpad `harita-islem/onizleme.html` (modülü okumadan aynı veriyi JSON olarak gömer) →
  `onizleme.png` 1000×1000 (playwright-core + sistem Chrome). Görüldü: Expo poligonu ayrıntı penceresinin
  ortasında, salon kuzey yarısında; D400 (trunk) Expo'nun hemen güneyinden KD–GB uzanıyor; ikincil/servis yollar kademeli;
  pistler güneybatıda; kıyı kent merkeziyle örtüşüyor, deniz dolgusu doğru tarafta. Konsol hatası yok.
- `modul-test.mjs` (Node 24, TS'yi doğrudan içe aktarır): 23/23 denetim — boyut, `yolPath`/`alanPath`/
  `birlesikPath` çıktısı, `konum()` ↔ `noktalar` eşitliği, tüm koordinatlar tam sayı, halkalar kapanmamış,
  orijin ve salon Expo içinde, pin salonda, yollar ±900 m'de, pistler GB çeyrekte, deniz Expo'yu içermiyor,
  kıyı kutuda, atıf metni.
- `npx tsc --noEmit -p . --incremental false` ve `npx eslint src/components/icinden` temiz.

## 9. Yeniden üretim

Betikler depoda değil, oturum scratchpad'inde (`harita-islem/`); indirilen veri ayrı klasörde (`osm-dl/`),
Python `-I` ile çalışır, girdiden yalnızca sayılar TS'ye yazılır:

```
python -I harita-islem/isle.py osm-dl/expo.json osm-dl/expo-way.json osm-dl/kiyi.json \
  src/components/icinden/expo-harita.ts harita-islem/onizleme-veri.json harita-islem/ozet.json
python -I harita-islem/onizleme.py harita-islem/onizleme-veri.json harita-islem/onizleme.html
node harita-islem/onizleme-shot.mjs harita-islem/onizleme.html harita-islem/onizleme.png
node harita-islem/modul-test.mjs src/components/icinden/expo-harita.ts
```

Kıyı çekilemezse `isle.py`'ye kıyı yolu yerine `-` verilir: `kiyi: []`, `deniz: []` üretilir.
Yeniden çekim için Overpass'ta User-Agent başlığı zorunlu (yoksa 406).
