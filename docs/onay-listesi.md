# Müşteri onay listesi: `/dunya` "12.000 Yıllık Emanet"

Müşteriye (AK Gençlik ve stant tasarım ekibi) sorulacak her şey burada toplanıyor. Her maddede şunlar var: sitede şu an ne kullanıldığı, dayanağı ve değişirse hangi dosyanın etkileneceği. Okuma ayrıntıları: `docs/stant-icerik.md`.

En hızlı yol: tasarım ekibinden **12 sütunun ve zemin halkasının baskı dosyalarını (metin olarak)** istemek. 1–8. maddelerin çoğu bununla kendiliğinden çözülür. PDF'teki render'larda bu metinlerin bir kısmı bozuk ya da yer tutucu.

## 1. Sütun numaralandırması (en önemli)

- **Durum:** render'da "1" numaralı sütunda Belgrad Ormanı yazıyor ("DOĞAL MİRAS"). Zemin halkasındaki dönem etiketleri ise 3–11 numaralı sütunlarla birebir aynı sırada. Bu sıraya göre 1. konum Neolitik ("GİRİŞ · ~12.000" işaretinin hemen yanı), 12. konum "DOĞAL MİRAS" olmalı.
- **Sitede:** sütun yüzüne uyuldu: 1 Belgrad Ormanı, 12 Göbeklitepe (Neolitik).
- **Soru:** Belgrad Ormanı 12. sütun, Neolitik alan 1. sütun mu olacak? Evet ise `src/lib/emanet.ts` içinde yalnızca iki `no` değeri yer değiştirir.

## 2. PDF'te okunamayan sütunlar: genel bilgiyle dolduruldu (`kaynak: "genel-bilgi"`)

| No | Render'da | Halkadaki dönem | Sitede önerilen | Soru |
|---|---|---|---|---|
| 2 | hiç görünmüyor | Tunç Çağı | **Hattuşa** (Çorum) | 2. sütunun alanı nedir? |
| 10 | 1. sütunun (Belgrad) kopyası, yer tutucu | Osmanlı | **Safranbolu** (Karabük) | 10. sütunun alanı nedir? |
| 12 | yalnızca numara görünüyor | Neolitik (kalan tek dönem) | **Göbeklitepe** (Şanlıurfa) | 12. sütunun alanı nedir? (1. madde ile bağlantılı) |

## 3. Kısmen okunan sütunlar: tamamlanan kısımlar (`kaynak: "pdf-kismi"`)

| No | Okunan | Tamamlanan / varsayılan | Soru |
|---|---|---|---|
| 3 Sardes | ad, il (Manisa), "LİDYA - DE…", "MÖ 7. y…" | dönem "Lidya – Demir Çağı" (halkadan); cümle genel bilgi | Slogan ("Ka…") ve metin |
| 4 Letoon | ad, il (Muğla), "LİKYA - HEL…", "MÖ 2. yüzyıl - ~2.200 yıl", "İKLİM" | slogan "Birlikte karar vermek bize miras." (iki açıdan birleştirildi) | Slogan doğru mu? |
| 5 Termessos | ad, il (Antalya), "Hellenistik-Roma", "DOĞA - NATURE", "Ormanla yaş… bize miras" | slogan "Ormanla yaşamak bize miras." | "yaşamak" doğru mu? |
| 6 Derinkuyu Yeraltı Şehri | ad | il **Nevşehir** (render'da bozuk "Nevyalta"); dönem **Bizans** (çip bozuk, halkadan) | İl, dönem, slogan ("Enerjiyi … etmemek …"?) |
| 7 Sultanhanı Kervansarayı | ad, "1229-12…" | il **Aksaray** (görünmüyor) | Doğru alan mı? |
| 8 Çifte Minareli Medrese | ad ("Çifte Minare…"), "1?. yüzyıl" | il **Erzurum** varsayıldı | **Erzurum mu, Sivas mı?** İkisinde de 13. yüzyıldan aynı adlı medrese var. |
| 9 Hevsel | "Hevsel", "Diyarbakır" (soluk), "15. yüzyıl" | ad **Hevsel Bahçeleri**; dönem **Akkoyunlu** (soluk çip ve halka) | Slogan ("Kendi … beslenen miras"?) |
| 11 Lületaşı Atölyeleri | ad, il (Eskişehir), "SIFIR ATIK - ZERO WASTE", "Taşı israf … işlemek bi…" | slogan "Taşı israf etmeden işlemek bize miras." | "etmeden" doğru mu? |

## 4. Sitedeki 12 "emanet" cümlesi

`src/lib/emanet.ts` içinde her alan için tek cümle var (≤ 110 karakter). 1 (Belgrad) PDF'teki metinden, 4, 5 ve 11 sütun sloganlarından türedi. Diğerleri yaygın bilinen tek cümlelik bilgiler. 1 dışındaki 11 cümle `onay: true` ile işaretli. **Soru:** 12 cümle onaylanıyor mu, ya da sütunlardaki EMANET metinleri gönderilebilir mi?

## 5. KÖK / EMANET / FİLİZ metinleri

Her sütunun alt bölümünde KÖK · EMANET · FİLİZ başlıkları var. Altlarındaki metinler render'da yalnızca gri çizgi (yer tutucu). Sitedeki `filiz` alanı bu yüzden **12 alanda da boş**. **Soru:** bu metinler hazır mı? Sitede FİLİZ ("gençliğe düşen") cümlesi gösterilsin mi?

## 6. Sütun başındaki "COP31 - N km / N Kasım" satırı

Değerler: 1 "25 km", 03 "13 K…", 04 "20 Kasım", 05 "15 ka…", 06 "10 ka…", 08 "14 ka…", 09 "14 km", 10 "25 km", 11 "16 K…", 12 "10 ka…".

- Mesafe olamaz: Belgrad Ormanı Antalya Expo'ya ~500 km, Termessos ~40 km.
- Tarih ise 25, COP31 tarihlerinin (9–20 Kasım) dışında kalıyor, ayrıca bazı değerler tekrar ediyor.

**Sitede:** satır taşınmadı. Mesafe "COP31'e kuş uçuşu ~X km" olarak koordinattan hesaplanıyor. **Soru:** bu satır neyi gösterecek? (Her sütunun COP31'de öne çıkacağı gün mü?)

## 7. Dönem halkası (sitede kürenin çevresinde ve Stantta bölümünde)

- **Sitede:** 11 dilim: Neolitik · Tunç Çağı · Lidya – Demir Çağı · Likya – Helenistik · Helenistik – Roma · Bizans · Selçuklu · Akkoyunlu · Osmanlı · Osmanlı'dan bugüne · Doğal miras. Zemin halkasındaki 12 etiketten iki "SELÇUKLU" tek dilimde birleştirildi. "GİRİŞ · ~12.000" ve "BUGÜN" dilim değil, işaret olarak ele alındı.
- **Varsayım:** GİRİŞ ile TUNÇ ÇAĞI arasındaki etiket okunamadı, **Neolitik** kabul edildi.
- **Renkler:** marka paletinden, eskiden yeniye sıcaktan soğuğa (turuncu/krem → mavi → yeşil). Zemin halkasının iç segmentleri (4 yeşil, 4 mavi, 4 oker) kronolojik görünmüyor. Bunlara bağlı kalınması isteniyor mu?
- **Sorular:** okunamayan etiket nedir? Dilimler ve sıra onaylanıyor mu?
- **Not:** "Doğal miras" kronolojik bir dilim değil (halkada sonda duruyor, ama "en yeni dönem" anlamına gelmiyor). Sitede dönem şeridinin sağ ucunda artık "Doğal miras · Bugün" değil yalnızca "Bugün" yazıyor; halkadaki kısa etiketler "Günümüz" (Osmanlı'dan bugüne) ve iki satırlı "Doğal miras". Zemin halkasında her sütun numarası kendi dönem diliminin yanına yerleşiyor; §1 çözülmediği için sıra şu an üstten saat yönünde 12, 2, 3 … 11, 1. Numaralar yer değiştirince kendiliğinden 1 … 12 olur.

## 8. Stant metinleri

| Konu | Sitede | Soru |
|---|---|---|
| Ana slogan | "İklim, doğa ve sıfır atık bize miras." (koyu totemdeki yazım) | Büyük pankartta "İklim, doğa, sıfır atık bize miras." yazıyor. Hangisi esas? |
| Totem alt satırı | "12.000 yıl önceden bugüne." | Tam metin "Tarihe göre - 12.000 yıl önceden bugüne." mi? ("Tarihe göre" soluk) |
| Totem üst ikinci satır | kullanılmadı | "Bir Gelecek İnşası" mı? |
| Giriş metninin 2. cümlesi | "Rotundadaki 12 sütunun her biri, Anadolu'nun doğal ve kültürel mirasından bir emaneti taşıyor." | Öneri metni, PDF'te yok. Onay? |
| Program adı | "GençİKlim" | Yazımı (büyük İ ve K) doğru mu? |
| Sağ turuncu pankart | "Sıfır Atık Yöneticileri - COP31'e Giden Yol - DengeCOP31" | "DengeCOP31" doğru mu? Siteye taşınsın mı? |

## 9. Stantta bölümü: bölge adları ve kiosk

| Konu | Sitede | Dayanak | Soru |
|---|---|---|---|
| Bölge 1 adı | "Emanet Rotundası" | PDF'te yok (bant metni "12.000 Yıllık Emanet") | Ad uygun mu? |
| Bölge 2 adı | "Oyna – Sen olsan ne yapardın?" · "Gel, oyna!" | PDF'te okundu | Oyun masalarında ne oynanıyor? (Sitede tek cümle açıklama için) |
| Bölge 3 adı | "Söz Kiosku" | PDF'te yok | Ad uygun mu? Kiosk standın neresinde? Perspektif 3'te rotundanın önünde, planda belirsiz (sağdaki 5 istasyonlu kapalı oda mı, rotunda yanındaki totem mi?) |
| Kiosk çağrısı | "Sen de söz ver." | PDF'te yok | Onay? Söz nereden veriliyor (kiosk ekranı, QR, site)? |
| Kiosk başlığı | "Bugün … kişi söz verdi." (sitede sayı yok) | PDF'te "Bugün 112 kişi söz verdi." | Kiosktaki 3 çubuğun etiketleri ne? (mavi 324, yeşil 126, turuncu 112; sonuncusu "Ziyaretçi" olabilir) Üstteki URL ve hashtag ne? |
| Bölge 4 adı | "Amfi · söyleşiler" ve "Kavisli banklarda söyleşiler ve sunumlar." | PDF'te yok (planda banklar, 4 konuşmacı sandalyesi ve ekran var) | Ad ve program (söyleşi saatleri) var mı? |
| Kapalı oda 1 | planda 5 istasyonlu masa ve 10 sandalye | PDF'te etiket yok | Bu oda ne? (atölye, dijital istasyonlar, söz kiosku?) |

## 10. Stant künyesi

- Salon ve stant numarası: kapakta "Hall: …… / Stand Number: ……" boş. Sitede "Standımız: Salon X, Stant Y" satırı istenir mi?
- Stant ölçüsü: antetteki AREA SIZE boş. Sitedeki plan, render'daki oranla (1,52 : 1) çiziliyor.

## 11. Palet ve yazı tipi

- Renkler render'lardan örneklendi: krem `#F7E6CD`, koyu yeşil `#28332F`, ahşap `#B49168`, turuncu `#DF9560`, bordo `#58281F`. Işık bu tonları kaydırıyor olabilir. **Soru:** stant baskısının renk kodları (Pantone/CMYK/HEX) gönderilebilir mi?
- Stantta serif bir yazı tipi kullanılıyor (sütun adları, sloganlar). Sitede muadil olarak Lora kullanılacak. **Soru:** stantta kullanılan yazı tipinin adı nedir?
- **Sitede şu an:** krem bölümlerde (2, 3, 4, 9) Montserrat başlıklar marka mavisi, panel konturu marka yeşili; koyu yeşil `#28332F` yalnızca serif slogan, bölüm etiketi, dönem çipi, sıra numaraları ve stant planı/zemin halkası çizgilerinde. Ekranda bu ton neredeyse siyah okunuyor. Gerçek baskı kodu gelince `stant.palet.koyuYesil` güncellenir; daha yeşil okunan bir ton (ör. `#17614F`) marka paletinde olmadığı için kendiliğinden kullanılmadı.

## 12. Fotoğraflar (H2'nin `docs/foto-yeni.md` dosyasından aktarıldı)

- **Strateji ve İstişare Kampı (13 Ağustos 2025)** fotoğrafları "Gençlik Buluşmaları" bölümüne (6) yerleştiriliyor (p16 `kamp2025Selam`, yedek p13). Kamp bu bölümde mi kalsın, ayrı bir satır mı olsun?
- **GençFest** kareleri (p14, p15): Kocaeli Şöleni değil, ayrı bir etkinlik. Yeri ve tarihi ne? Kullanılsın mı?
- **8. bölüm (Başkan mesajı) portresi:** brief p06'yı (el kalpte) öneriyordu. Ama p06'da yalnızca Cumhurbaşkanı var ve panel Av. Yusuf İbiş'in alıntısını taşıyor. H2, p22'yi (`solenKocaeliSahaIkili`) öneriyor. Onay?

## 13. Sitede yazılan metinler, görsel seçimleri ve erişilebilirlik istisnaları

Bunlar PDF'te ya da broşürde yok; site ekibi yazdı/seçti. Onay ya da düzeltme gerekiyor.

| Konu | Sitede | Dayanak | Soru |
|---|---|---|---|
| 3. ve 4. bölüm başlıkları | "Anadolu'nun emaneti" ve "Kuşaktan kuşağa" (`DunyaIcerik.tsx`) | Öneri; PDF'te ve broşürde yok | Başlıklar uygun mu? |
| 2. bölüm sayıları | "11 dönem" ve "12 miras sütunu" | "12.000 yıllık emanet" kürenin üstündeki sayaçta; panelde tekrar etmemek için dönem sayısı | "Miras sütunu" ifadesi uygun mu? |
| 7. bölüm fotoğrafları | p19 (tribün selam) + p08 (kürsü selam), alt yazılar "Kocaeli Stadyumu" ve "Bir Gençlik Şöleni" | Brief p18 + p19 diyordu; p18, 8. bölümdeki p22 ile aynı an (docs/foto-yeni.md) | Seçim onaylanıyor mu? |
| Kapanış polaroidleri | p10 (kamp özçekimi) + p06 (Şölen'de el kalpte; yalnızca Cumhurbaşkanı) | Brief'te kapanışta fotoğraf yoktu | Kapanışta fotoğraf istenir mi, p06 uygun mu? |
| İngilizce tema | Sitede "A 12,000-Year Trust" (`stant.temaEn`) | Rotunda bandında "A 12.000-Year Trust". İngilizcede binlik ayıracı virgül; 150.000 yabancı ziyaretçi "12.000"i "12" gibi okuyabilir | Sitede virgüllü yazım onaylanıyor mu? Bant da aynı hatayı taşıyorsa tasarım ekibine iletilsin. |
| Stant planında giriş | Planın alt kenarı "Giriş · koridor" (iki ok) | Ön cephe render'ı (PDF s.2): karşılama bankosu solda, oyun alanı sağda; planda ikisi de alt kenarda. Planın kendisinde giriş işaretli değil | Giriş/koridor tarafı doğru mu? Köşe stant ise ikinci açık kenar var mı? |
| Stant planı etiketleri | "Emanet Rotundası", "Oyna", "Söz Kiosku", "Amfi"; rotunda ortasındaki "Bugün" yazısı plandan kaldırıldı (zemin halkası bunu büyük gösteriyor) | §9 ile bağlantılı | — |
| Marka yeşili küçük metinde | Alt başlıklar (16 px kalın), yaprak etiketi ve el yazısı slogan marka yeşilinde (`#47B27A`): beyaz üstünde 2,56–2,65:1, WCAG AA'nın altında. 11–15 px'lik etiket ve satırlar (sayı etiketleri, rol/mekân, HUD etiketleri, kapanış alıntısı) marka teal'ine (`#1F8879`; beyaz üstünde 4,32:1, yarı saydam panelde 4,17:1, AA'ya yakın ama altında) alındı | Broşür kimliği: "yeşil 700 alt başlık" | Alt başlık ve yaprak etiketinde marka yeşili bilinçli istisna olarak kalsın mı, yoksa teal'e mi geçilsin? Küçük etiketlerde tam AA için lacivert (`#1B4F9C`, 7,9:1) gerekir. |

## 14. `/icinden` "COP31'in İçinden"

Kaynak brief: `docs/brief-icinden.md` (v2). Bu bölümdeki maddeler sitede yer tutucu ya da varsayımla çözüldü; müşteri ve organizasyon yanıtıyla tek satırlık değişikliklerle güncellenir.

| Konu | Sitede şu an | Dayanak / dosya | Soru |
|---|---|---|---|
| Salon ve stant numarası | Haritada **pin yok**; "Salon · Stant" satırı hiç gösterilmiyor. Kamera fuar holünün ağırlık merkezine (`noktalar.salon`) dalıyor, stant planı orada beliriyor. Stantın hol içindeki konumu ve ölçeği (62 m) **temsilî**; holde stant dikdörtgeni ve koridor ızgarası çizilmiyor. | `derinlik.ts` `HARITA_KUTU.stant`, `HaritaKatmani.tsx` `SalonKatmani`, `expo-harita.md` §7 | Salon ve stant numarası nedir? Stant holün neresinde (köşe/koridor)? Gelince konum tek satırla değişir; "Salon X · Stant Y" satırı d2'ye eklenir. |
| Resmî COP31 logosu | Açılışta (d0) logo orijinal oran ve renkte, beyaz zeminde tek başına; altında nötr satır (~32 px koruma payı). Logo kendi diskinde sönerek küreye dönüşüyor; kapanışta "COP31 Türkiye logosu etkinliğe atıf amacıyla kullanılmıştır." | `docs/cop31-logo.md` §2; cop31.tr/brand "orijinal oran ve renklerinde" | **Organizasyona bildirim (brand@cop31.tr) yapıldı mı, yanıt geldi mi?** Marka rehberindeki koruma alanı nedir? Onay gelmezse kök katman değiştirilebilir: d0 broşürün kendi küre dairesiyle başlar (`DURAKLAR[0]` tek satır), diğer duraklar değişmez. |
| "Logonun yerinde sönerek küreye dönüşmesi" | d 0,10–0,40'ta logonun tamamı kırpılmadan ve ölçeklenmeden söner; d 0,20–0,45'te küre aynı diskte belirir; zoom ancak 0,45'te başlar. Arada (d ≈ 0,30–0,42) ekran kısa süre neredeyse boş. | brief §1 d1 | Bu hareket kabul ediliyor mu? (Resmî işaretin bir animasyonun parçası olması organizasyonun da onayına bağlı.) |
| Kapanıştaki iki atıf satırı | "Harita verisi © OpenStreetMap katkıda bulunanlar · Natural Earth." ve "COP31 Türkiye logosu etkinliğe atıf amacıyla kullanılmıştır." Yalnız metin, bağlantı yok. | OSM ODbL (zorunlu), Natural Earth kamu malı (isteğe bağlı), `IcindenKapanis.tsx` | Yer ve metin uygun mu? openstreetmap.org/copyright bağlantısı eklensin mi (izinli linkler listesine ek)? |
| ~150.000 yabancı ziyaretçi | d1 panelinde "Yaklaşık 150.000 yabancı ziyaretçi bekleniyor". | Yalnız `docs/brief.md` §1; `content.ts`'te yok | Sayının resmî kaynağı var mı? Yoksa cümle çıkarılsın mı? |
| İngilizce tek satırlar | Her durak başlığının altında (`data-onay="en"`): "Scroll down", "The world meets in Antalya", "Antalya Expo Center · Aksu · 9–20 November 2026", "Our stand · A 12,000-Year Trust", "Climate, nature and zero waste are our heritage.", "The brochure you can pick up at our stand", "Youth Meetings · Youth Festival", "Climate Action", arka kapakta "Always by your side", "Our planet is our common home". | brief §1 (ONAY) | Çeviriler onaylanıyor mu? Kurumun resmî İngilizce karşılıkları (özellikle slogan ve "AK Parti Her Anında Hep Yanında") var mı? |
| Kiosk süresi | `/icinden?auto=1`: geçiş ~2,2 s/ekran, durakta 5 s (rotundada 600 ms + 3 × 4,5 s), sonda 600 ms beyaz perde ve başa dönüş; tur ≈ 85 s. Dokunma/tekerlek girdisinde durur, 30 s sonra en yakın duraktan sürer. | brief §2, `IcindenSahne.tsx` | Stanttaki ekranda tur süresi uygun mu (daha kısa/uzun)? Ekran dikey mi yatay mı? |
| QR'ın standdaki yeri | Rotunda durağı (d4) "Buradasın · Bugün": zemin halkasının ortasındaki "Bugün" diski. | brief §1 d4 | QR kod standda nerede duracak? "Buradasın" işareti QR'ın yanına/rotundaya göre mi konumlansın? |
| Polaroid dalışı | d6'da Kocaeli stadyum karesi (p18) broşür **sayfasını** dolduruyor (kâğıdın ~%79'u); ekranı doldurmuyor. Kamera d5–d8'de sabit ve katman kutusu kırptığı için ekranı doldurmak sayfadaki "50+ Gençlik Buluşması" ve 2017/TBMM satırlarını örterdi. | brief §1 d6 "ekranı doldurur" (sapma) | Sayfayı dolduran dalış kabul edilebilir mi? |
| Kadraj okuması (sayfa numaraları) | Sağ üstte "sayfa 1/12" (kapak), "8/12" (Buluşmalar · Şölen), "11/12" (İklim Eylemleri), "12/12" (arka kapak). | `/brosur` sayfa sırası (`src/components/brosur/data.ts`) | Basılı broşürdeki numaralar aynı mı? |
| AK Parti logosu (kapak) | Broşür kapağındaki AK Parti ve Gençlik Kolları logoları d ≈ 4,86–4,96'da, kapak durağına varırken beliriyor; Cumhurbaşkanı fotoğrafları, 2017 ve TBMM satırları d ≥ 5'te. | brief §1 "parti içeriği d < 5'te görünmez" | "Parti içeriği" AK Parti logosunu da kapsıyor mu? Kapsamıyorsa logolar kapakla birlikte (d ≈ 4,4) gelebilir. |
| Marka yeşili ve küçük metin kontrastı | Broşürdeki yeşil alt başlıklar, yaprak etiketleri (yeşil üstünde beyaz) ve el yazısı slogan `#47B27A`: beyaz üstünde 2,65:1 (WCAG AA altı). Küçük teal metinler gövde grisine/marka mavisine alındı; lacivert yalnız slogan dairesinde. | brief §3 broşür dili; §13 son satır ile aynı soru | Broşür yeşili bilinçli istisna olarak kalsın mı, yoksa metinde koyu yeşil (ör. `#2E7D57`, ~5:1) mi kullanılsın? |
| Gerçek Apple cihaz testi | Yapılmadı. Bütün ölçümler headless Chrome taklidi (CDP dokunma, `scrollY` 1–2 kare gecikme taklidi, 4× CPU). | brief §6 | Yayından sonra iPhone Safari, iOS Chrome ve macOS Safari'de (trackpad + fare) elle denenmeli: yönlü yerleşme, 100lvh/100svh, cobe performansı, WebGL bağlam kaybı (arka plana alıp dönme), maske ve sayfa çevirme. |
| Performans hedefleri | 4× CPU mobilde sürekli 0→9 jestinde ortalama ≥ 40 fps sağlanıyor; uzun kare (> 50 ms) hedefi ≤ 3, ölçülen 4–5 (önce 11–14): kalanlar katmanların ilk boyanma kareleri. Durak durak ve dokunmayla gezintide hedef sağlanıyor. İlk yükleme JS ≤ 130 kB gz hedefi karşılanamaz: aynı Next/React sürümünün çatı JS'i tek başına 128,8 kB gz (harita/logo/stant verisi istemci paketinden çıkarıldı). | brief §3.10, denetim K2 | Hedef "rota payı ≤ 50 kB gz" olarak güncellensin mi? `next build` ile kesin toplam yayından önce ölçülmeli. |
