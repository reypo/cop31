# `turkiye-silueti.ts`: Türkiye kıyı silüeti (H3)

> **Arşiv (2 Kasım 2026, /icinden v3 B turu):** bu belgedeki `.ts` dosyası v2 SVG katmanlarıyla birlikte silindi (v3 önceden render edilmiş kliplerle çalışır). Dosya git geçmişinde (b9cd9db); yeniden üretim adımları aşağıda geçerli.

`src/components/icinden/turkiye-silueti.ts`, `/icinden` rotasında d = 2'ye giden yoldaki ara katman
("Türkiye kıyı silüeti": küre → silüet → Antalya Körfezi → Expo) için kara poligonlarıdır
(`docs/brief-icinden.md` §1 d = 2, §4). Dosya **üretilmiştir**; elle düzenlenmez, §8'deki adımlarla
yeniden yazılır.

## 1. Kaynak

| | |
|---|---|
| Veri seti | Natural Earth 1:50m Cultural, "Admin 0 – Countries", sürüm **5.1.1** |
| İndirilen dosya | `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson` |
| Depo sürümü | dosyanın son commit'i `9380cca` ("v5.1.1 DBF var char length fix", 13 Mayıs 2022) |
| İndirme | 2 Kasım 2026, `curl -sSL -A "cop31-stand-site/0.1"`, ilk denemede başarılı (110m yedeğine gerek kalmadı) |
| Boyut / özet | 3.083.490 bayt, 242 öğe; MD5 `686def4ba546d1008ab4a75db581a81a`, SHA-256 `3e458fc036ad0a66…` |

## 2. Lisans ve atıf

- Natural Earth **kamu malıdır** (public domain): kullanım, değiştirme ve dağıtım serbesttir, atıf zorunlu
  değildir. Natural Earth'ün kendi önerisi "Made with Natural Earth" satırıdır.
- Modül kısa atfı `turkiyeSilueti.atif` / `NE_ATIF` = **"Natural Earth"** olarak verir. Öneri: kapanıştaki
  OSM atıf satırının yanına "Harita verisi: © OpenStreetMap katkıda bulunanlar · Natural Earth" (ONAY;
  OSM satırı ZORUNLU, Natural Earth satırı isteğe bağlı). `docs/onay-listesi.md` §14'e eklenecek madde
  (denetim/entegrasyon ajanı).
- Sınırlar eritildiği için (bkz. §4) çizimde Türkiye'nin kendi sınırı dışında hiçbir siyasi sınır yoktur;
  Kıbrıs tek ada olarak görünür (Natural Earth'teki "Cyprus" ve "N. Cyprus" öğeleri birleşir).

## 3. Koordinat sistemi ve sapma

- `docs/expo-harita.md` §3 ile **birebir aynı**: orijin Expo poligonunun ağırlık merkezi
  (36,9397171 K / 30,8175767 D), `x = (λ − λ0)·88.874,6981`, `y = (φ0 − φ)·111.195,0802` (metre;
  `METRE_DERECE` ve `konum()` expo-harita.ts'te), x doğu +, **y güney +**, tam sayı metre. Böylece silüet,
  körfez ve Expo katmanları aynı sayılarla üst üste oturur; ölçek değişimi yalnızca katman dönüşümündedir.
- Projeksiyon **Expo enleminde ölçeklenmiş sabit equirectangular**tır: kuzey-güney ölçeği her yerde doğru,
  doğu-batı ölçeği `cos φ0 / cos φ` oranında sapar (haritadaki uzunluk / gerçek uzunluk):

| Enlem | Yer | Doğu-batı sapması |
|---|---|---|
| 35,81 K | Hatay, Türkiye'nin güneyi | −%1,4 |
| 36,94 K | Expo | 0 |
| 39,93 K | Ankara | +%4,2 |
| 41,68 K | Edirne | +%7,0 |
| 42,11 K | İnceburun (Türkiye'nin en kuzeyi) | **+%7,7** |
| 53,13 K | kadrajın kuzey kenarı (Belarus, Polonya) | +%33 |
| 20,75 K | kadrajın güney kenarı (Sudan, Suudi Arabistan) | −%14,5 |

  Türkiye'nin Karadeniz kıyısı yatayda ~%7 geniş, Anadolu'nun ortası ~%4 geniş çizilir; kadraj uçlarında
  sapma büyür ama o bölgeler yalnızca ±1.800 km'lik tam kadrajda (~9 km/CSS px) görünür. Kürenin (cobe,
  ortografik) Türkiye'si ile silüet birebir örtüşmez; geçiş çapraz sönmeyle yapılacağı için (brief §3.4)
  kabul edildi. Daha doğru bir şekil gerekirse aynı orijinli azimutal eşit uzaklık projeksiyonu kullanılabilir,
  ama o zaman `konum()` ile tutarlılık bozulur.

## 4. İşleme, seçim kuralları ve eşikler

1. **Seçim:** sınır kutusu kırpma kutusuyla (±1.850 km + 1,5°) kesişen 60 öğe (sınır kutusu antimeridyeni
   aşan ABD ve Rusya dahil; kadraj dışındaki parçalar kırpmada düşer). Türkiye (`ADM0_A3 = TUR`, 3 poligon,
   delik yok) ayrı; geri kalan 59 öğe komşu kara.
2. **Eritme (komşular):** ülke poligonları ortak kenarlarla birleştirilir (yön tutarlı hâle getirilir, iki
   yönde de bulunan kenarlar silinir, kalanlar halkalara dikilir). Natural Earth ortak sınırlarda aynı
   köşeleri kullandığı için 27.267 kenarın 9.124'ü iptal oldu; sonuç ülke sınırı içermeyen kara:
   yalnızca kıyılar ve Türkiye sınırı. Önizlemede iç sınır kalıntısı görülmedi.
3. **Projeksiyon** (§3), sonra **kırpma**: Sutherland–Hodgman, kare **±1.850 km**. Kadraj (`bbox`)
   ±1.800 km; kırpmanın 50 km fazlası sayesinde kutu kenarı boyunca uzanan yapay çizgiler `viewBox = bbox`
   dışında kalır (inline `<svg>` taşanı keser).
4. **Douglas–Peucker** (kapalı halka iki zincire bölünerek) ve **ada eşiği**:

| Katman | DP eşiği | Ada eşiği (alan) | Ham → sade nokta | Halka |
|---|---|---|---|---|
| `turkiye` | **1.200 m** sabit | < 20 km² elenir | 559 → 401 | 3 (Anadolu 778.011 km², Trakya 24.762 km², Gökçeada 249 km²) |
| `komsular` | **2.000 m**; Expo'dan r > 600 km'de `2 km · r/600 km` (kadraj kenarında ~6 km, köşede ~8,5 km) | < 60 km²; r > 600 km'de `60 km² · (r/600 km)²` | 2.756 → 1.105 | 43 (42 dış + 1 delik) |

   Uzaklığa bağlı eşiğin gerekçesi: kamera Expo'ya doğru dalar; Expo'dan r uzaklıktaki kıyı yalnızca ekran
   ölçeği r ile orantılıyken kadrajdadır, dolayısıyla `eşik ∝ r` ekranda sabit piksel hatası verir
   (tam kadrajda kenardaki 6 km ≈ 0,6 CSS px). Sabit 2 km ile dosya 37,6 kB oluyordu (sınır 30 kB);
   2,5 km / 100 km² ile 33,4 kB, 3 km / 100 km² ile 31,1 kB. Türkiye ve 600 km içi (Ege adaları, Kıbrıs,
   Suriye–Lübnan kıyısı, Kırım'ın güneyi) tam 2 km eşikle kaldı.
5. Tam sayıya yuvarlama; ardışık yinelenen nokta silinir; ilk nokta sonda tekrarlanmaz. Halkalar büyükten
   küçüğe sıralı: `turkiye[0]` Anadolu, `komsular[0]` Avrasya–Afrika ana karası (kırpılmış, 971 nokta),
   `komsular[1]` Hazar Denizi deliği.
6. **Yön:** SVG ekseninde (y aşağı) dış halkalar alan > 0 (ekranda saat yönü), delik (yalnızca Hazar)
   alan < 0. Bu yüzden `fill-rule` `evenodd` da `nonzero` da doğru çizer, YETER Kİ halkalar tek `<path>`'te
   birleşik olsun: `birlesikPath(turkiyeSilueti.komsular, true)`. Halkaları ayrı `<path>`'lere bölmek Hazar'ı
   kara gibi doldurur.

Kalan halkalar arasında (ağırlık merkezinden tanındı): Kıbrıs (8.923 km²), Girit, Sicilya, Eğriboz, Rodos,
Midilli, Sakız, Sisam, İstanköy ve Ege'nin diğer büyük adaları, Malta, Cerbe, Bubiyan, Bahreyn. Türkiye'nin 1:50m verisinde Bozcaada, Marmara Adası ve Kızıl Adalar
yok (yalnız Gökçeada var).

## 5. Modül ve API

- Boyut **29.089 bayt** (sınır 30 kB); düz sayı dizileri, çalışma anı kodu yok (yalnız `kara` için dizi
  birleştirme).
- Tipler `Halka`, `Kutu`, `CografiKutu` `./expo-harita`'dan içe aktarılır; çizim yardımcıları da oradan:
  `alanPath(halka)`, `birlesikPath(halkalar, true)`.

```ts
import { turkiyeSilueti, NE_ATIF, type TurkiyeSilueti } from "@/components/icinden/turkiye-silueti";

turkiyeSilueti.turkiye      // readonly Halka[]  Türkiye (3 halka, 401 nokta)
turkiyeSilueti.komsular     // readonly Halka[]  Türkiye dışı kara, eritilmiş (43 halka, 1.105 nokta; [1] delik)
turkiyeSilueti.kara         // readonly Halka[]  [...komsular, ...turkiye] (kopya değil, aynı diziler)
turkiyeSilueti.bbox         // { x: -1800000, y: -1800000, w: 3600000, h: 3600000,
                            //   guney: 20.752, bati: 10.5643, kuzey: 53.1275, dogu: 51.0708 }
turkiyeSilueti.turkiyeBbox  // { x: -457583, y: -573049, w: 1701794, h: 696283 }  (Türkiye halkalarının kutusu)
turkiyeSilueti.atif         // "Natural Earth"
```

- Kullanım örneği (d'ye bağlı çizim B'nin işi, `HaritaKatmani.tsx`):

```tsx
const { x, y, w, h } = turkiyeSilueti.bbox;
<svg viewBox={`${x} ${y} ${w} ${h}`}>
  <path d={birlesikPath(turkiyeSilueti.komsular, true)} fillRule="evenodd" />
  <path d={birlesikPath(turkiyeSilueti.turkiye, true)} />
</svg>
```

- **Noktalı kıyı** (brief §1 d = 2, "round cap + dasharray"): `fill="none"`, `stroke-linecap="round"`,
  `stroke-dasharray="0 g"` (sıfır uzunluklu tire + yuvarlak uç = nokta); `stroke-width` ve `g` viewBox
  biriminde (metre) verilir ve katman CSS `scale(s)` ile büyüdükçe birlikte büyür; ekranda sabit nokta
  boyutu için B bunları ölçeğe bölerek yazar, ölçek büyüdükçe `g` 0'a inip çizgi kapanır. Komşuların Türkiye sınırı boyunca uzanan
  kenarı Türkiye halkasının sınırıyla (farklı DP eşiği yüzünden ≤ ~2 km farkla) çakışır; yalnızca kıyı
  istenirse `kara` tek path olarak çizilip Türkiye ayrıca dolgu alabilir.
- Katman ölçeği: `bbox` katmanın 1000 nominal birimine sığdırılırsa 1 birim = 3,6 km. Antalya Körfezi kutusu
  (`expoHarita.kiyiBbox`, 53 × 39 km) bu katmanda ~15 × 11 birimdir; Expo (0, 0) katmanın tam ortasıdır
  (nominal 500, 500).

## 6. Varsayımlar ve sınırlar

- 1:50m genelleştirmesi kıyıda **~1–3 km** sapma demektir. Antalya Körfezi'nde OSM kıyısıyla (`expoHarita.kiyi`,
  DP 60 m) karşılaştırma: OSM kıyı noktalarının Natural Earth kıyısına uzaklığı ortalama 765 m, medyan 630 m,
  %90'ı ≤ 1.482 m, en çok 2.519 m. Expo'nun kıyıya uzaklığı Natural Earth'te 9,3 km, OSM'de 10,0 km.
  Silüet → körfez geçişi çapraz sönmeyle yapılırsa fark görünmez (o anda 1 km < 1 px).
- Kıyıdaki noktalar tam kıyı çizgisinde ya da hemen dışında kalabilir: ör. Kadıköy (40,99 K / 29,03 D)
  sadeleşmiş Boğaz kıyısının 2,3 km denize düşen tarafında. Silüet üstüne şehir işareti konacaksa iç
  noktalar seçilmeli ya da işaret kıyıdan uzak tutulmalı.
- Natural Earth 1:50m'de Boğaz ve Çanakkale Boğazı açıktır (Trakya ayrı halka); Marmara'nın küçük adaları yok.
- Natural Earth tartışmalı bölgeleri kendi varsayılan görüşüyle çizer; komşularda sınırlar eritildiği için
  bu çizimde hiçbiri görünmez (yalnızca Türkiye'nin kendi sınırı, Türkiye halkasının kenarı olarak).
- İç göller (Van, Tuz, Beyşehir…) Türkiye poligonunda delik değildir (1:50m Türkiye öğesinde delik yok);
  çizimde yoktur. Gerekirse `ne_50m_lakes` ayrıca işlenebilir (bu turda kapsam dışı; boyut sınırı).

## 7. Doğrulama (2 Kasım 2026)

- Önizleme: scratchpad `ne-islem/onizleme.html` (modülden değil, aynı veriyi JSON olarak gömer; SVG,
  `viewBox = bbox`, kara, Türkiye, ±1.600 km kesik kare, körfez kutusu, Expo ve 14 şehir noktası `konum()`
  formülüyle) → `onizleme.png` (tam kadraj) ve `onizleme-turkiye.png` (Türkiye'ye yakın, 1.800 km),
  playwright-core + sistem Chrome, konsol hatası yok. Görüldü: Türkiye tanınır; Expo noktası Antalya
  Körfezi'nin kuzeyinde, güney kıyısında; Kıbrıs, Girit, Rodos ve Ege adaları yerinde; İstanbul Boğaz'da,
  Trabzon/Tiflis/Bakü/Bağdat/Kahire/Hayfa/Atina/Roma/Kiev doğru karada; Karadeniz, Azak, Hazar, Kızıldeniz,
  Basra Körfezi'nin ucu deniz; komşularda iç sınır yok.
- `modul-test.mjs` (Node 24, TS'yi doğrudan içe aktarır): **35/35** denetim: boyut ≤ 30 kB, atıf, tam sayı,
  halkalar kapanmamış, `kara` = `komsular + turkiye` (aynı başvurular), yönler (Türkiye > 0, tek delik),
  kırpma kutusu, `bbox` ↔ `konum()` (≤ 5 m), Expo (0, 0) Türkiye'nin içinde ve kıyıya 3–20 km (9,3 km),
  orijin expo-harita ile aynı, 13 kara noktası (İstanbul ×2, Ankara, Van, Trabzon, Lefkoşa, Atina, Girit,
  Rodos, Tiflis, Bağdat, Kahire, Bakü) ve 5 deniz noktası (Karadeniz, Antalya Körfezi açığı, Ege, Hazar,
  Marmara), `turkiyeBbox`, `alanPath`/`birlesikPath` çıktısı, tip içe aktarımı.
- `kiyi-karsilastir.mjs`: §6'daki Natural Earth ↔ OSM kıyı sapması.
- `npx tsc --noEmit -p . --incremental false` ve `npx eslint src/components/icinden` temiz.

## 8. Yeniden üretim

Betikler depoda değil, oturum scratchpad'inde (`ne-islem/`); indirilen veri ayrı klasörde (`ne-dl/`), Python
`-I` ile çalışır, girdiden yalnızca sayılar TS'ye yazılır (ülke kodları yalnızca özet JSON'a):

```
curl -sSL -A "cop31-stand-site/0.1" -o ne-dl/ne_50m_admin_0_countries.geojson \
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
python -I ne-islem/isle.py ne-dl/ne_50m_admin_0_countries.geojson src/components/icinden/turkiye-silueti.ts \
  ne-islem/cikti/onizleme-veri.json ne-islem/cikti/ozet.json \
  --dp 2000 --min-km2 60 --r0 600000 --tr-dp 1200 --tr-min-km2 20
python -I ne-islem/onizleme.py ne-islem/cikti/onizleme-veri.json ne-islem/onizleme.html
node ne-islem/onizleme-shot.mjs ne-islem/onizleme.html ne-islem/onizleme.png
node ne-islem/onizleme-shot.mjs ne-islem/onizleme.html ne-islem/onizleme-turkiye.png -500000 -800000 1800000
node ne-islem/modul-test.mjs src/components/icinden/turkiye-silueti.ts src/components/icinden/expo-harita.ts
node ne-islem/kiyi-karsilastir.mjs src/components/icinden/turkiye-silueti.ts src/components/icinden/expo-harita.ts
```

1:50m indirilemezse aynı yolun `ne_110m_admin_0_countries.geojson` sürümü aynı betikle işlenir (Türkiye
daha kaba olur; eşikler düşürülebilir). `--r0 0` uzaklığa bağlı eşiği kapatır (sabit DP; dosya 30 kB'ı aşar).
