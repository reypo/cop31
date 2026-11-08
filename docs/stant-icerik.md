# Stant PDF'i: içerik çıkarımı (H1)

"12.000 Yıllık Emanet" stant tasarım PDF'inden okunan her metin, güven düzeyi, palet, tipografi, üstten plan ölçüleri ve kiosk ekranının yapısı burada. Veri modülleri bu dosyaya dayanıyor: `src/lib/emanet.ts`, `src/lib/stant.ts`. Müşteriye sorulacak her şey ayrıca `docs/onay-listesi.md` dosyasında.

Güven düzeyleri:

- **okundu**: harf harf net.
- **kısmen**: bir kısmı net, eksik kısım köşeli parantezle tamamlandı ya da `…` ile bırakıldı.
- **okunamadı**: görünüyor ama okunmuyor, ya da render metni bozuk (yapay zekâ render'ının uydurma harfleri).

## 1. Kaynak ve yöntem

- Kaynak: `stant.pdf`, 8 sayfa, A4 yatay (842×595 pt). Metin katmanı yok; PyMuPDF `get_text` yalnızca sayfa numarası veriyor.
- Her sayfada bir antet (1985×1404) ve bir render bulunuyor. Render'lar gömülü JPEG: s.2–4 ve s.6–8 için 1536×864, s.5 için 1280×720. Sayfayı 6–8 kat zoom'la render etmek ayrıntı eklemiyor; bu yüzden gömülü görseller **doğal çözünürlükte çıkarıldı** (`fitz.extract_image`). Bölgeler PIL ile kırpıldı, 3–8 kat LANCZOS ile büyütüldü, keskinleştirildi (UnsharpMask 2/120/2), kontrastı 1,3–1,5 artırıldı. Dikey pankartlar döndürülerek okundu.
- Aynı sütun birden fazla render'da görünüyorsa en net olanı esas alındı ve açılar birleştirildi (örneğin 04 Letoon iki açıdan okundu).
- Çalışma dosyaları: `C:\Users\user\AppData\Local\Temp\claude\D--soft-cop31\4935df5b-f395-4622-886e-17daa992bcbf\scratchpad\h1\` (`scripts/` ve `out/`).
- Kanıt kırpımları (`.qa/`, gitignore'da): `h1-plan-bolgeler.png` (bölge kutuları ve halka yarıçaplarıyla işaretli plan), `h1-zemin-halkasi.png`, `h1-sutun-01.png`, `h1-sutun-04-05-06.png`, `h1-sutun-11.png`, `h1-kiosk.png`, `h1-giris-pankarti.png`.

### Sayfa haritası

| PDF sayfası | Antet | İçerik |
|---|---|---|
| 1 | Kapak | COP31 kapak, firma bilgisi kutusu, 5 ilke ikonu |
| 2 | 1 PERSPECTIVE / PAGE 1 | Ön cephe: karşılama bankosu, rotunda, koyu totem, oyun alanı, sağ turuncu dikey pankart |
| 3 | 2 PERSPECTIVE / PAGE 2 | Yan cephe: sol turuncu "Gel, oyna!" pankartı, Oyna bandı, oyun masaları, 07–10 sütunları |
| 4 | 3 PERSPECTIVE / PAGE 3 | Arka cephe: amfi, söz kiosku, büyük giriş pankartı |
| 5 | 4 PERSPECTIVE / PAGE 4 | Rotunda yakın: 03, 04, 1, 09, 10, 11, 12 sütunları ve koyu totem |
| 6 | 5 PERSPECTIVE / PAGE 5 | Amfi ve rotunda: 09, 10, 11, 06, 05, 04 sütunları |
| 7 | 6 PERSPECTIVE / PAGE 6 | **Üstten plan**: zemin halkası ve bölgeler |
| 8 | 7 PERSPECTIVE / PAGE 7 | Kapalı yan cephe, amfi girişi |

Not: brief'te geçen "standın 6. sayfası" antetteki PAGE 6'dır, yani PDF'in 7. sayfası.

## 2. Okunan metinler

### 2.1 Kapak (PDF s.1)

| Yer | Metin | Güven |
|---|---|---|
| Üst sol | UNFCCC · COP31 · CMP21 · CMA8 | okundu |
| Logo | COP31 TÜRKİYE ANTALYA | okundu |
| Üst sağ | COP31 EXPO CENTER / NOVEMBER 9-20, 2026 | okundu |
| Bilgi kutusu | Company Name: AK PARTİ GENÇLİK KOLLARI | okundu |
| Bilgi kutusu | Hall: …… / Stand Number: …… | okundu (boş bırakılmış) |
| İkonlar | LOW CARBON · CIRCULAR APPROACH · NATURAL MATERIALS · SOCIAL IMPACT · INNOVATIVE DESIGN | okundu |
| Örnek stant ekranı | TOGETHER FOR A SUSTAINABLE FUTURE | okundu (genel şablon görseli; bizim stant değil) |

### 2.2 Rotunda, totem, pankartlar

| Yer (sayfa) | Metin | Güven |
|---|---|---|
| Rotunda üst bandı, koyu yeşil (s.2, 5, 6) | 12.000 Yıllık Emanet - A 12.000 - Year Trust | okundu |
| Koyu totem, üst küçük (s.2, 5) | 12.000 YILLIK EMANET | okundu |
| Koyu totem, üst küçük ikinci satır (s.2, 5) | Bir Gelecek İnşası | kısmen (çok küçük; "Geleceğ/Gelecek" ayrımı yapılamıyor) |
| Koyu totem, ana (s.2, 5) | İklim, doğa ve sıfır atık bize miras. | okundu |
| Koyu totem, alt (s.5; s.2'de kısmen) | Tarihe göre - 12.000 yıl önceden bugüne. | kısmen ("Tarihe göre" soluk) |
| Büyük giriş pankartı, krem zemin üzerinde koyu yeşil dağ silüeti (s.4) | İklim, doğa, sıfır atık bize miras. | okundu (totemdeki "ve"li yazımdan farklı) |
| Büyük giriş pankartı, sol alt (s.4) | #YarınBanaEmanet | stant PDF'inde #YaniBanaEmanet okunmuştu, müşteri 8 Kasım'da #YarınBanaEmanet olarak düzeltti |
| Büyük giriş pankartı, sağ alt (s.4) | GençİKlim - 12.000 Yıllık Emanet - İçeride → | okundu |
| Sol turuncu dikey pankart (s.3) | Gel, oyna! Come and play! | okundu |
| Oyun alanı koyu bandı, TR (s.3) | Oyna - Sen olsan ne yapardın? ("Oyna" altın sarısı) | okundu |
| Oyun alanı koyu bandı, EN (s.2, 3, 5) | Play - What would you do? | okundu |
| Sağ turuncu dikey pankart (s.2) | Sıfır Atık Yöneticileri - COP31'e Giden Yol - DengeCOP31 | okundu ("DengeCOP31" küçük; yazımı teyit edilmeli). Önceki incelemedeki "Sıfır Atık Yönetimi … GençİKlim" okuması yanlış. |
| Cephe logoları (s.2, 3, 4, 8) | AK PARTİ gençlik kolları | okundu (logo) |

### 2.3 Zemin halkası (PDF s.7, üstten plan)

Rotunda zeminindeki halka iki parçadan oluşuyor:

1. Dışta koyu yeşil etiket bandı. Etiketler büyük harfli TR, altlarında küçük EN; aralarda ▲ biçiminde altın üçgenler var.
2. İçte 12 renkli segment (4 yeşil, 4 mavi, 4 oker) ve ortada krem disk.

Etiketler saat yönünde, soldan (saat 9 yönü) başlayarak:

| # | TR | EN | Güven |
|---|---|---|---|
| işaret | GİRİŞ · ~12.0… | Start · 12… | kısmen (bir kişi üstünü örtüyor; büyük olasılıkla "~12.000 yıl önce") |
| 1 | okunamadı | okunamadı | okunamadı (soluk küçük etiket; konumu Neolitik'e karşılık geliyor) |
| 2 | TUNÇ ÇAĞI | Bronze Age | okundu |
| 3 | LİDYA - DEMİR ÇAĞI | Lydian - Iron Age | okundu |
| 4 | LİKYA - HELENİSTİK | Lycian - Hellenistic | okundu |
| 5 | HELENİSTİK - ROMA | Hellenistic - Roman | okundu |
| 6 | BİZANS | Byzantine | okundu |
| işaret | BUGÜN (altın sarısı) | Today | okundu |
| 7 | SELÇUKLU | Seljuk | okundu |
| 8 | SELÇUKLU | Seljuk | okundu |
| 9 | AKKOYUNLU | Aq Qoyunlu | okundu |
| 10 | OSMANLI | Ottoman | okundu |
| 11 | OSMANLI'DAN BUGÜNE | Ottoman to today | okundu |
| 12 | DOĞAL MİRAS | Natural heritage | okundu |
| orta | Buradasın (küçük) / Bugün (büyük serif) | — | okundu |

**Önemli bulgu:** okunabilen 3–11 numaralı sütunların dönem çipleri, halkadaki 3–11. etiketlerle birebir aynı sırada (03 Sardes LİDYA, 04 Letoon LİKYA, 05 Termessos HELENİSTİK-ROMA, 07 Sultanhanı ve 08 Çifte Minareli SELÇUKLU, 09 Hevsel AKKOYUNLU, 11 Lületaşı OSMANLI'DAN BUGÜNE). Yani halka, sütun sırasının haritası. Buna göre 1. konum Neolitik, 2. konum Tunç Çağı, 10. konum Osmanlı, 12. konum Doğal miras olmalı. Oysa render'da "1" numaralı sütunda **Belgrad Ormanı / DOĞAL MİRAS** yazıyor; bu yüz 10. sütunda da tekrar ediyor (yer tutucu). `emanet.ts` sütun yüzüne uyuyor (1 = Belgrad). Kalan dönemler genel bilgiyle dolduruldu: 2 Tunç Çağı, Hattuşa; 10 Osmanlı, Safranbolu; 12 Neolitik, Göbeklitepe. Bu çelişki onay listesinde 1. madde.

### 2.4 Sütun yüzü yapısı (anatomi)

Krem/beyaz dikey levhalar, yukarıdan aşağıya:

1. `COP31 - N km` ya da `COP31 - N kasım` satırı. Küçük, gri, sans-serif. Anlamı için §2.6'ya bakın.
2. Büyük serif sıra numarası, iki haneli ("03", "05", "11"). 1, 09 ve 10 bordo, diğerleri siyah. 1. sütunda tek hane ("1").
3. Ad: kalın serif, 1–2 satır.
4. İl: küçük sans-serif.
5. Bordo dönem çipi: beyaz, büyük harfli, harf aralıklı sans-serif (örn. "LİDYA - DEMİR ÇAĞI").
6. Tarih satırı: bordo sans-serif (örn. "MÖ 2. yüzyıl - ~2.200 yıl"). Altında EN italik ("2nd century BCE - 2,200 years").
7. Tema çipi: gri ya da bordo, büyük harfli. Örnekler: "DOĞA - EKOSİSTEM", "DOĞA - NATURE", "İKLİM - CLIMATE", "SIFIR ATIK - ZERO WASTE". Standın sloganındaki üçlüye (iklim, doğa, sıfır atık) karşılık geliyor.
8. Slogan: kalın serif, "… bize miras." kalıbında. Altında EN italik.
9. Alt bölüm: KÖK · EMANET · FİLİZ başlıkları (bordo/siyah, büyük harf) ve her birinin altında gri metin çizgileri. **Bu üç bölümün metni hiçbir render'da okunmuyor**, yer tutucu çizgi olarak çizilmiş.

### 2.5 Sütunlar tek tek

| No | Okunan | Güven | `emanet.ts` |
|---|---|---|---|
| 1 | COP31 - 25 km · **1** · Belgrad Or[manı] · İstanbul · DOĞAL MİRAS · Bizans - Osmanlı'da / Şehrin Su Kaynağı · DOĞA - EKOSİSTEM · "Benli ve um…" (slogan bozuk) · "Tarihi bentleri ve su… / ile şehrin can dama[rı] / Zengin flora ve faun[a]" · EMANET · FİLİZ (s.2, 5, 8) | ad/il/çip/alt satır okundu; slogan okunamadı | `pdf`, onay yok |
| 2 | Hiçbir render'da görünmüyor | okunamadı | Hattuşa, `genel-bilgi` |
| 3 | COP31 - 13 K… · 03 · Sardes · Manisa · LİDYA - DE[MİR ÇAĞI] · MÖ 7. y[üzyıl] / 7th cen[tury] · İKL[İM]? · "Ka…" (s.5; önünde bir kişi duruyor) | kısmen | `pdf-kismi` |
| 4 | COP31 - 20 Kas[ım] · 04 · Letoon · Muğla · LİKYA - HEL[ENİSTİK] / [LY]C[IAN] - … · MÖ 2. yüzyıl - [~]2.200 yıl / 2nd century BCE - 2,200 years · İKLİM - CLIMATE · "Birlikte [karar] ver[mek] bize miras." / "Deciding together…" (s.5 ve s.6, iki açı birleştirildi) | kısmen (slogan iki açıdan tamamlandı) | `pdf-kismi` |
| 5 | COP31 - 15 ka[sım] · 05 · Termesso[s] · Antalya · HELLENİSTİK - H… · Hellenistik-Roma / Hellenistik - Roma Dö[nemi] · DOĞA - NATURE · "Ormanla yaş[amak] / bize miras" · "Living with the …" (s.4, 6) | kısmen ("yaşamak" tamamlaması tahmin) | `pdf-kismi` |
| 6 | COP31 - 10 ka[sım] · 06 · Derinkuy[u] / Yeraltı Şe[hri] · "Nevyalta" (bozuk; Nevşehir) · "[?]LANS OZZANR" (bozuk çip; halkaya göre BİZANS) · "Bizane bizrann" / "Bizzewe ewravbo" (bozuk) · "DOĞA MAT - TERM…" (bozuk) · "Enerjiji ku… / etmemek l a…" (bozuk; "Enerjiyi … etmemek" olabilir) · "Way waring wrong…" (bozuk) (s.6, 8) | ad okundu; geri kalanı okunamadı | `pdf-kismi` |
| 7 | 07 · Sultanh[anı] / Kervans[arayı] · "1229-12…" (s.3) | kısmen; il görünmüyor | `pdf-kismi`, il Aksaray (genel bilgi) |
| 8 | COP31 - 14 ka… · 08 · "HELLENİS - SEROI" (bozuk çip; halkaya göre SELÇUKLU) · "1?. yüzyıl - ~7?0 yıl" · "DOĞA - CLIMATE" (bozuk) · "Çifte Minare[li] / Medrese \| m… / asuram…" (s.3) | ad kısmen; il okunamadı | `pdf-kismi`, il Erzurum varsayıldı (Sivas da olabilir) |
| 9 | COP31 - 14 km · 09 · Hevsel · Diyarbakır (soluk) · [AKKOYUNLU] (soluk bordo çip) · 15. yüzyıl - 20… · "DOĞA - CLIMATE" (soluk) · "Kendi la ve / beslennen / miras." (bozuk; "… beslenen miras") (s.5, 6) | kısmen | `pdf-kismi`, ad "Hevsel Bahçeleri" diye tamamlandı |
| 10 | COP31 - 25 km · 10 · Belgrad Or… · İstanbul · DOĞAL MİRAS · … 1. sütunun **birebir kopyası** (s.3, 5, 6) | yer tutucu | Safranbolu, `genel-bilgi` (halkada 10 = OSMANLI) |
| 11 | COP31 - 16 K… · 11 · Lületaşı / Atölyele[ri] · Eskişehir · OSMANLI'DAN … · "1?. yüzyıldan …" · SIFIR ATIK - ZERO [WASTE] · "Taşı israf … / işlemek bi[ze miras]" · "Carving stone without … heritage" · KÖK · EMANET · FİLİZ (s.6) | kısmen | `pdf-kismi` |
| 12 | COP31 - 10 ka[sım] · 12 (yarısı kapalı) · içerik okunamadı (s.2, 5) | okunamadı | Göbeklitepe, `genel-bilgi` (halkada kalan tek dönem Neolitik) |

`emanet` cümleleri (≤ 110 karakter, standın sesinde) okunan sloganları kullanıyor: "birlikte karar vermek bize miras" (04), "ormanla yaşamak bize miras" (05), "taşı israf etmeden işlemek bize miras" (11). Geri kalan kısımlar yaygın bilinen tek cümlelik bilgiler; hepsi `onay: true` ile işaretli (1 hariç).

### 2.6 "COP31 - N …" satırı: belirsiz, siteye taşınmadı

Okunan değerler: 1 → "25 km", 03 → "13 K…", 04 → "20 Kas[ım]", 05 → "15 ka…", 06 → "10 ka…", 08 → "14 ka…", 09 → "14 km", 10 → "25 km", 11 → "16 K…", 12 → "10 ka…".

- **Mesafe olamaz.** Belgrad Ormanı Antalya Expo'ya kuş uçuşu ~500 km, Termessos ~40 km; satırda 25 ve 15 yazıyor.
- **Tarih olabilir** ("COP31 - 15 Kasım"): çoğu yüzde "Kas…/ka…" okunuyor. Ama 25 COP31 aralığının (9–20 Kasım) dışında ve değerler tekrar ediyor (14 iki kez, 10 iki kez, 25 iki kez).
- Büyük olasılıkla render yer tutucusu. Sitede mesafe `cop31KusUcusuKm()` (haversine, Antalya Expo 36,94 K / 30,86 D, 10 km'ye yuvarlı) ile hesaplanıyor. Hesaplanan değerler: 1: 500, 2: 470, 3: 300, 4: 160, 5: 40, 6: 380, 7: 280, 8: 960, 9: 830, 10: 500, 11: 320, 12: 720 km.

### 2.7 Kiosk ve duvar ekranı (s.4 kiosk, s.2 sol duvar)

| Öğe | Metin | Güven |
|---|---|---|
| Kiosk üst (çok küçük, 2 satır) | URL + "#İklim…" türünde bir etiket | okunamadı |
| Kiosk üst etiket | Türkiye'de | okundu (küçük, gri) |
| Kiosk başlık | Bugün 112 kişi söz verdi. | okundu (112 örnek sayı) |
| Çubuk 1 (mavi) | etiket okunamadı · 324 | etiket okunamadı, sayı kısmen |
| Çubuk 2 (yeşil) | etiket okunamadı · 126 | etiket okunamadı, sayı kısmen |
| Çubuk 3 (turuncu) | "Ziyaretçi"? · 112 | kısmen |
| QR altı | URL + etiket | okunamadı |
| Alt | Türkiye'de | okundu |
| Sol duvar ekranı (s.2) | Aynı düzen iki kez yan yana: "Bugün 112 kişi söz verdi." + 3 çubuk | okundu (başlık) |

## 3. Palet

Renkler render'lardan PIL ile örneklendi (bölge medyanı). Render ışığı (salon spotları, gölge) tonları koyulaştırıyor; aynı malzemenin farklı sayfalardaki örnekleri aşağıda.

| Öğe | Örnekler | Seçilen (`stant.palet`) |
|---|---|---|
| Koyu yeşil (totem, zemin halkası bandı, pankart dağı) | totem s.5 `#283231`, totem s.2 `#27332F`, zemin halkası s.7 `#2D3429`, pankart koyu dağ s.4 `#303C2A`. Birleşik medyan (44.377 px): `#28332F`. Aydınlık rotunda bandı s.5 `#377568`. Kiosk ekranı `#17241D`, oyun bandı `#0A1811`. | `koyuYesil: "#28332F"` |
| Krem panel | büyük pankart zemini s.4 `#F7E6CD` (en iyi aydınlanan yüzey). Sütun yüzleri gölgede `#B5ACA7`…`#756453`, zemin diski s.7 `#B6A48C`. | `krem: "#F7E6CD"` |
| Turuncu pankart | sağ dikey s.2 `#D98D5A`, sol dikey s.3 `#E69A64`; birleşik `#DF9560` | (stant.ts'te alan yok) `#DF9560`. Marka turuncusu `#F08322` bu ailede. |
| Ahşap | dikey çıtalar s.3/s.4 birleşik `#B49168`; amfi bankı (aydınlık) s.6 `#DBB484` | `ahsap: "#B49168"` |
| Bordo (sütun çipi ve numarası) | s.5 `#58281F` (render koyu; gözle `#7A2A1E` civarı) | — |
| Altın vurgu ("Oyna", "#YarınBanaEmanet", halkadaki "BUGÜN" ve ▲) | "Oyna" s.3 `#C0A665`, hashtag s.4 `#AA9671` | — |
| Zemin halkası iç segmentleri | yeşil `#495F35`, mavi `#3B4C5E`, oker `#8B5C24` (gölgede) | `donemler` renkleri bu üç aileye ve marka tokenlarına dayanıyor |

`donemler` renkleri kronolojik sıcaktan soğuğa ilerliyor. Antik dönemler turuncu ve krem tonlarında (Neolitik `#F2C48D` → Helenistik-Roma `#A9581C`, Lidya'da marka turuncusu `#F08322`). Orta çağ mavi ailesinde (Bizans `#5FA3CF`, Selçuklu marka mavisi `#0C77B6`, Akkoyunlu marka lacivert `#1B4F9C`). Osmanlı marka yeşili `#47B27A`, Osmanlı'dan bugüne marka teal `#1F8879`. Doğal miras `#2F5D4A`: standın koyu yeşilinin bir ton açığı, küre üzerinde boşluk gibi görünmesin diye.

## 4. Tipografi

- **Serif** (yüksek kontrastlı, kalın; Lora 700 iyi bir muadil): sütun numaraları ("03", "05"), sütun adları, sloganlar ("Ormanla yaşamak bize miras", "Birlikte karar vermek bize miras"), totem ve büyük pankart başlığı ("İklim, doğa, sıfır atık bize miras."), zemin halkası ortasındaki "Bugün". Rakamlar eski stil değil, düz (lining). Sitede "12.000" sayacı ve sıra numaraları için `font-variant-numeric: lining-nums tabular-nums` önerilir.
- **Sans-serif:** il adları, tarih satırları, "COP31 - …" satırı, kiosk ekranı, rotunda bandı ("12.000 Yıllık Emanet - A 12.000 - Year Trust"), totem üst etiketi ("12.000 YILLIK EMANET").
- **Çipler:** büyük harfli, harf aralıklı sans-serif, bordo zemin üzerinde beyaz. Sitede büyük harf metnin kendisine yazılmalı; `text-transform: uppercase` kullanılmamalı (İ/ı).
- **EN satırlar:** küçük italik sans-serif, TR satırın hemen altında.
- **Pankartlar:** turuncu dikey pankartlarda dar ve kalın sans-serif (beyaz). "Play - What would you do?" bandında geniş, eğik sans-serif. "Oyna" kelimesi altın sarısı.

## 5. Üstten plan (PDF s.7): `StantPlani.tsx` için ölçüler

Ölçüler gömülü 1536×864 render üzerinde piksel olarak alındı. Stant iç dikdörtgeni (zemin, duvar bandı hariç): x 200–1276, y 102–809 px, yani 1076×707 px (en/boy **1,522**; antetteki AREA SIZE boş, gerçek ölçü bilinmiyor). Tüm değerler bu dikdörtgenin yüzdesi. x ve genişlik dikdörtgen genişliğine, y ve yükseklik dikdörtgen yüksekliğine göre. Kontrol görseli: `.qa/h1-plan-bolgeler.png`.

| Bölge | x % | y % | genişlik % | yükseklik % |
|---|---|---|---|---|
| Stant iç alanı (zemin) | 0.0 | 0.0 | 100.0 | 100.0 |
| **Rotunda** (dış kanopi halkası) | 25.9 | 19.7 | 29.8 | 45.5 |
| **Amfi bölgesi** (banklar ve sahne) | 65.5 | 0.0 | 34.5 | 45.3 |
| Amfi kavisli banklar (2 sıra, minderli) | 72.3 | 3.3 | 22.0 | 22.2 |
| Konuşmacı sandalyeleri (4, koyu yeşil) | 72.0 | 38.6 | 20.9 | 6.4 |
| **Kapalı oda 1**: 5 istasyonlu masa, 10 sandalye (atölye / dijital istasyonlar) | 65.5 | 45.3 | 34.5 | 36.1 |
| İstasyon masası | 72.5 | 60.5 | 24.3 | 8.5 |
| Kapalı oda 2 (depo/ofis tezgâhı) | 65.5 | 83.5 | 34.5 | 16.5 |
| **Oyun alanı** (ahşap zemin şeridi) | 0.0 | 71.0 | 63.8 | 29.0 |
| Oyun masası 1 (ışıklı üst yüzey, 4 sandalye) | 25.7 | 80.5 | 8.4 | 10.6 |
| Oyun masası 2 (ışıklı üst yüzey, 4 sandalye) | 47.6 | 80.5 | 8.3 | 10.6 |
| 3 puf | 2.7 | 71.7 | 17.4 | 6.5 |
| **Karşılama / logo** (AK Parti Gençlik Kolları; görselde 180° dönük) | 9.1 | 88.3 | 10.7 | 9.9 |
| Totem / panel (beyaz, rotundanın solunda) | 15.8 | 37.2 | 2.0 | 12.0 |
| Sol duvar bankı | 0.0 | 7.5 | 2.0 | 19.8 |
| Üst duvar üniteleri (2) | 40.8 | 0.0 | 18.6 | 5.1 |

Rotunda ve zemin halkası. Merkez x **40,8 %**, y **42,4 %**. Yarıçaplar dikdörtgen genişliğinin yüzdesi olarak (dış yarıçapa oranı parantezde):

- dış kanopi: 15,0 % (1,00)
- koyu yeşil etiket bandı: dışta 13,4 % (0,90), içte 11,1 % (0,74)
- 12 renkli segment halkası: dışta 6,8 % (0,46), içte 4,8 % (0,32)

Kanopi üstten bakınca yaklaşık 16 kenarlı bir çokgen. Sütunlar kanopinin altında kaldığı için planda görünmüyor; perspektiflerde bant hizasında, çember üzerinde eşit aralıklı 12 dikey levha.

Yerleşim notları:

- Brief §1'deki tarifle örtüşüyor: rotunda sol-ortada, amfi sağ üstte, oyun masaları altta, atölye (kapalı oda 1) sağda, karşılama sol altta.
- Söz kioskunun plandaki yeri kesin değil. Perspektif 3'te (s.4) kiosk, rotundanın önünde iki ahşap çıta grubunun arasında tek başına duruyor. Planda buna karşılık gelebilecek tek nesne rotundanın solundaki beyaz totem. Brief'teki "sağda söz kiosku/atölye" tarifi için kapalı oda 1 kullanılabilir (onay listesi).
- Render'lar arası yön tutarsızlığı var: s.2'de karşılama bankosu solda, s.7 planında sol altta ve logo ters. Plan bu nedenle "basıldığı gibi" ölçüldü.
- Önerilen `data-bolge` eşlemesi: 1 → Rotunda, 2 → Oyun alanı, 3 → Kapalı oda 1 (ya da totem; onaya bağlı), 4 → Amfi bölgesi.

## 6. Kiosk ekranının yapısı

Dikey ekran, koyu yeşil zemin (`#17241D` civarı), beyaz sans-serif metin. Ayakta duran beyaz gövdeli bir totem; aynı içerik sol duvardaki geniş ekranda iki sütun halinde tekrar ediyor. Yukarıdan aşağıya:

1. Çok küçük iki satır: URL ve hashtag (okunamadı).
2. Küçük gri etiket: "Türkiye'de".
3. Başlık, kalın: "Bugün **112** kişi söz verdi." Sayı canlı.
4. Üç yatay çubuk. Her birinin üstünde küçük etiket, sağında sayı: mavi (324), yeşil (126), turuncu (112). Etiketler okunamadı; üçüncüsü "Ziyaretçi" olabilir. Turuncu çubuğun 112 değeri başlıktaki sayıyla aynı. Bu yüzden çubuklar büyük olasılıkla söz veren grupları (ya da söz kategorilerini) gösteriyor, turuncu olan da stant ziyaretçileri.
5. Ortada QR kod. Altında URL ve hashtag (okunamadı).
6. Alt satır: "Türkiye'de".

Siteye taşınabilecek tek kesin kalıp: "Bugün … kişi söz verdi." (`stant.kiosk.baslik`). Sitede sabit sayı yok; sayı yalnızca standdaki ekranda canlı.
