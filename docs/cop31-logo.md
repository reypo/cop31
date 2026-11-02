# Resmî COP31 Türkiye Antalya logosu: kaynak, kurallar, bileşen

Bileşen: `src/components/icinden/Cop31Logo.tsx` (H1, 2 Kasım 2026). `/icinden` rotasının açılış
katmanında kullanılır (`docs/brief-icinden.md` §1 d = 0 ve §4).

## 1. Kaynak

| | |
|---|---|
| Sayfa | https://cop31.tr/brand ("yatay" ve "dikey" logo, PNG + PDF indirme bağlantıları) |
| İndirme tarihi | 2 Kasım 2026 |
| Dosyalar | `cop31-turkiye-dikey-logo.pdf` (MD5 `92820fda0c3fae46fa9a47bb08cc4ea7`), `cop31-turkiye-yatay-logo.pdf` (MD5 `a365615bf6078fe9bac6ed2e19719582`), aynı adlı PNG'ler (8000×4500, saydam) |
| PDF üst verisi | Adobe Illustrator 30.1 (Macintosh), Adobe PDF library 17.00; oluşturma 23 Mart 2026 (dikey 12:12, yatay 12:09, +03:00); başlıklar "cop dikey logo", "cop yatay logo"; MediaBox 1920×1080 |
| Ara dönüşüm | PDF → SVG (oturum scratchpad'i, `logo-dl/cop31-turkiye-{dikey,yatay}-logo.svg`); bu belge ve bileşen o SVG'lerden üretildi |

Bilgi: dosyaların tam indirme URL'leri oturumda kaydedilmedi; sayfa adresi ve MD5 değerleri izlenebilirlik
için yeterli. Sayfa güncellenirse dosyalar yeniden indirilip MD5 karşılaştırılmalı.

## 2. Kullanım kuralı

- cop31.tr/brand: **"Logoları orijinal oran ve renklerinde kullanın."**
- Marka rehberi henüz yayımlanmadı (2 Kasım 2026). İletişim: **brand@cop31.tr**.
- Bu projedeki ek kurallar (`docs/brief-icinden.md` §1, §4):
  - Renk, oran ve path'ler değiştirilmez; amblem ayrı animasyon parçalarına **bölünmez**. Yalnızca iki
    grup (`amblem`, `yazi`) bütün hâlinde opaklık ve kamera dönüşümü (transform) alır.
  - Logo sitenin kendi markası gibi sunulmaz; AK Gençlik kimliği (logo + "AK Parti Gençlik Kolları")
    açılışta her zaman görünür.
  - Geri çıkışta (d = 11) COP31 logosuna dönülmez: AK sloganı resmî logoyla yan yana durmaz.
- **Organizasyona bilgi verilmesi önerilir (brand@cop31.tr):** logonun bir siyasi parti gençlik kolunun
  stant sitesinde, açılış görseli ve "içine dalınan" bir kamera geçişinin başlangıcı olarak kullanıldığı
  bildirilmeli; yanıt gelene kadar kullanım yalnızca yukarıdaki sınırlarla yapılmalı.
  (`docs/onay-listesi.md`'ye eklenecek madde; o dosya H1'in yazma alanı dışında.)

## 3. Renkler

PDF'teki ana renkler CMYK'dır (`k` operatörü, DeviceCMYK). SVG dolguları dönüştürücünün RGB karşılığıdır;
bileşen bunları **değiştirmeden** kullanır. Illustrator'ın kendi PNG çıktısındaki RGB değerleri birkaç
birim farklıdır; fark algı eşiğinin (ΔE ≈ 2,3) çok altında.

| Ad (bileşende) | SVG dolgusu (kullanılan) | PDF CMYK | Resmî PNG'de ölçülen | ΔE76 |
|---|---|---|---|---|
| `L` lacivert | `#124ea2` | C98 M80,1 Y0 K0 | `#154ea2` | 0,25 |
| `M` mavi | `#1475bc` | C85 M50 Y0 K0 | `#0f75bc` | 0,30 |
| `Y` yeşil | `#41b97d` | C70,3 M0 Y69,1 K0 | `#3eba7d` | 1,03 |
| `K` kırmızı (lale) | `#ed2124` | C0 M98,8 Y100 K0 | `#ed2024` | 0,20 |

Logo saydamdır: amblemdeki beyaz "ebru nehirleri" boya değil, boşluktur; zemin rengi oradan görünür.
Yatay PDF'teki beyaz sayfa dikdörtgeni (`#ffffff`, 1920×1080) ve iki dosyadaki sayfa kırpma yolu
(`clipPath`) atıldı.

## 4. Geometri ve dönüşüm

- Her iki PDF'te 30 boyalı path var (dikeyde ayrıca 1 kırpma yolu; yatayda ayrıca beyaz sayfa + kırpma).
- **Yatay, dikeyin aynı çizimidir:** 30 path'in hepsi 1,001459 kat ölçekli; grup başına yalnızca öteleme
  farklı (en küçük kareler artığı ≤ 0,0011 birim). Bileşen geometriyi bir kez saklar, düzen başına iki
  grubun konumunu değiştirir. Birim: dikey PDF sayfasının birimi (pt); yatay düzen 1/1,001459 ölçekte,
  oran değişmez.
- PDF'in `matrix(1,0,0,-1,tx,ty)` dönüşümleri koordinatlara işlendi; path'ler grup-yerel koordinata
  (grubun sıkı kutusunun sol üstü = 0,0) taşındı; ilk `M` mutlak, gerisi göreli (segment başına daha kısa
  olan mutlak/göreli komut), **3 ondalık**, yuvarlanmış konumdan biriktirme (kayma yok).
- ANTALYA'daki üç "A" orijinalde birebir aynı path (yalnızca ötelemesi farklı): `A_HARFI` sabiti olarak
  bir kez yazıldı, her kopya yalnızca kendi `M` başlangıcını taşır.
- viewBox, her düzende logonun **sıkı sınır kutusu** (koruma boşluğu yok; gerekirse kullanan taraf ekler).
- Dosya boyutu: `Cop31Logo.tsx` 13.879 bayt (path verisi 11.187 karakter; kaynak SVG'ler 15.046 ve
  15.082 bayt). Sunucuda üretilen SVG işaretlemesi düzen başına ~12,7 kB.

### Düzenler (viewBox birimi)

| Düzen | viewBox | Amblem grubu (x, y, g, y) | Yazı grubu (x, y, g, y) | Orijinal sayfadaki köken |
|---|---|---|---|---|
| `dikey` (varsayılan) | `0 0 450.839 636.03` | 64,808 · 0 · 321,221 · 329,766 | 0 · 361,818 · 450,838 · 274,212 | (734,581; 221,985) |
| `yatay` | `0 0 817.18 329.766` | 0 · 0 · 321,221 · 329,766 | 366,341 · 32,312 · 450,838 · 274,212 | (550,011; 374,330) × 1,001459 |

### Path grupları (PDF boyama sırası korunur)

`<g data-parca="amblem">`: 11 path (dikey PDF'teki sıra 0–10)

| # | Renk | Parça |
|---|---|---|
| 0 | lacivert | alt sağdaki ince hilal (diskin alt kenarı) |
| 1 | lacivert | üst başlık (diskin tepesi) |
| 2 | lacivert | orta-sol ebru kıvrımı |
| 3 | lacivert | sap ile yaprak arasındaki küçük parça |
| 4 | yeşil | sağ büyük yaprak (diskin sağ-alt kenarını izler) |
| 5 | mavi | lale ile yaprak arasındaki sağ yay |
| 6 | lacivert | ortadaki iç ebru şekli |
| 7 | mavi | sol büyük mavi alan |
| 8 | lacivert | sol kenar |
| 9 | yeşil | sol yaprak ve lale sapı |
| 10 | kırmızı | lale (üstte disk dışına taşar) |

`<g data-parca="yazi">`: 19 path, sırasıyla TÜRKİYE (T, Ü, R, K, İ, Y, E; 7), COP31 (C, O, P mavi;
3, 1 yeşil; 5), ANTALYA (A, N, T, A, L, Y, A; 7). Ü'nün noktaları ve İ'nin noktası kendi harf path'inin
alt yollarıdır.

## 5. `cop31Amblem`: amblem diski

Amblemin mavi dairesi gerçek bir daireye çok yakın. Lale hariç amblem sınırından 720 açısal kutuda en dış
noktalar alınıp yinelemeli, sağlam bir daire uydurması yapıldı (Kåsa en küçük kareler, aykırılar atılarak;
tolerans 8 → 1 birim).

| Düzen | viewBox | cx | cy | r |
|---|---|---|---|---|
| `dikey` | `0 0 450.839 636.03` (w 450,839, h 636,03) | **225.384** | **171.213** | **160.445** |
| `yatay` | `0 0 817.18 329.766` (w 817,18, h 329,766) | **160.576** | **171.213** | **160.445** |

- Orijinal PDF sayfasında: dikey (959,965; 393,198) r 160,445 (disk 1920'lik sayfada yatayda
  neredeyse tam ortada, x = 960'a 0,035 birim); yatay (711,624; 546,339) r 160,679.
- Uyum (15°'lik 24 dilim): lale dışındaki amblem hiçbir dilimde daireden **0,24 birimden** fazla dışarı
  taşmaz; 20 dilimde kenar daireye ±0,24 birim içinde değer. 4 dilimde tasarımın kendi beyaz aralıkları
  yüzünden en yakın nokta 1,2–3,0 birim içeride kalır: alt-sol (yaprak ucu), alt-sağ, tepe (lale yanı),
  sağ-üst (mavi yay). Lale yaprakları
  üstte daireden **37 birime** kadar taşar ("disk" bunları kapsamaz; lale tepesi diskin üstünden 10,77
  birim yukarıda).
- Disk çapı, dikey düzende viewBox genişliğinin %71,18'i; yatayda %39,27'si. Amblem grubunun sol
  kenarı diskten 0,131 birim solda; diskin alt noktası amblem kutusunun 1,89 birim altında (alt ortadaki
  beyaz çentik).
- Değerler `w`, `h` alanlarını da taşır (spesifikasyona ek). Pikselde: svg çizim genişliği `W` ise
  ölçek `k = W / w`; disk merkezi `(cx·k, cy·k)` (svg kutusunun sol üstüne göre), yarıçap `r·k`.
  `preserveAspectRatio` varsayılan (`xMidYMid meet`); svg kutusu viewBox oranında değilse ortalama
  payını da ekleyin.

## 6. Bileşen API'si

```tsx
import Cop31Logo, { cop31Amblem, type Cop31Duzen } from "@/components/icinden/Cop31Logo";

<Cop31Logo />                                   // dikey, <title>COP31 Türkiye Antalya logosu</title>, role="img"
<Cop31Logo duzen="yatay" className="w-64" />
<Cop31Logo title="" />                          // dekoratif: aria-hidden, title yok
```

- `'use client'` yok: saf SVG, server component olarak da istemci bileşeni içinde de kullanılabilir.
- Props: `duzen?: "dikey" | "yatay"` (varsayılan `"dikey"`), `className?: string`,
  `title?: string` (varsayılan `"COP31 Türkiye Antalya logosu"`; boş dize → dekoratif).
- Kök `<svg>`: `viewBox` = `cop31Amblem[duzen].viewBox`, `width/height` yok (boyut CSS ile; yalnızca
  genişlik verilirse yükseklik orandan gelir), `overflow="visible"`, `data-duzen`.
- `<g data-parca="amblem">` ve `<g data-parca="yazi">` **transform özniteliği taşımaz** (konum içteki
  `<g transform="translate(…)">`'tedir). Bu yüzden dışarıdan CSS `opacity`/`transform` güvenle verilir
  ve öznitelikle çakışmaz. SVG'de varsayılan `transform-box: view-box`, `transform-origin: 0 0`; CSS
  `px` değerleri viewBox birimine denk gelir (ör. diske göre ölçek:
  `transform-origin: 225.384px 171.213px` dikeyde).
- `fill`, `filter`, `mix-blend-mode` gibi rengi değiştiren stiller **uygulanmaz**; path'ler tek tek
  seçilip animasyonlanmaz.

## 7. Doğrulama (2 Kasım 2026)

- `npx tsc --noEmit -p . --incremental false` ve `npx eslint src/components/icinden`: temiz.
- Bileşen `typescript.transpileModule` + `react-dom/server` ile işlendi; çıktı SVG'ler orijinal PDF-SVG'lerin
  aynı bölgesiyle karşılaştırıldı:
  - Geometri: 990 noktanın (30 path, tüm uç ve kontrol noktaları) en büyük sapması dikeyde 0,001,
    yatayda 0,0018 birim; segment sayıları ve renkler birebir.
  - Piksel (Chrome, dikey 900×1270, yatay 1400×565): farklı piksel oranı %0,009 ve %0,002; yalnızca
    iki şeklin neredeyse değdiği ince beyaz aralıklarda, kenar yumuşatma düzeyinde (CPU/GPU tuvalinde
    sayı değişiyor).
  - Renk kümesi `{#124ea2, #1475bc, #41b97d, #ed2124}` her ikisinde aynı; grup içerikleri amblem 11,
    yazı 19 path; `role="img"` ve `<title>` doğru; `title=""` → `aria-hidden="true"`, title yok.
- 800×800 görsel kontrol (`kontrol.html`, playwright-core + sistem Chrome): `cop31Amblem` dairesi
  kırmızı ince çemberle çizildi; çember iki düzende de disk kenarına oturuyor, lale yaprakları üstte taşıyor.
