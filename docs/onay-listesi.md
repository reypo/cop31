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

Kaynak brief: `docs/brief-icinden.md` (v2). (v2'nin `derinlik.ts`, `HaritaKatmani.tsx`, `IcindenSahne.tsx` vb. dosyaları v3 B turunda silindi; aşağıdaki v2 satırlarındaki dosya adları git geçmişinde, b9cd9db.) Bu bölümdeki maddeler sitede yer tutucu ya da varsayımla çözüldü; müşteri ve organizasyon yanıtıyla tek satırlık değişikliklerle güncellenir.

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

### 14.1 `/icinden` v3 "sinematik" (önceden render edilmiş klipler; `docs/brief-icinden-3.md` §7.5, §9.7)

v3'te rota yeniden yazıldı (11 durak + kapanış, kilitli adımlama, Blender klipleri). Yukarıdaki v2 satırlarından "logonun yerinde sönmesi" (v3: logo bütün hâlinde söner, SONRA amblem dairesinde Dünya belirir ve beyaz kâğıt lombar gibi açılır), "kapanıştaki atıf satırları", "kiosk süresi" ve "performans hedefleri" bu tabloyla güncellenir. **B turu (3 Kasım): sitede Cycles son render'ı (1920²) var**; ölçümler `docs/brief-icinden-3.md` §10. **C turu (3 Kasım):** düzeltilmiş render (t23, t34, l4, broşürsüz p6), yeni kodlama ve denetim düzeltmeleri sitede; sonuç tablosu `docs/brief-icinden-3.md` §11.5.

**E turu numaraları (F turu, denetim D3-04):** bu tablonun satırları C/D turunun numaralarıyla yazıldı; E turunda (§12.1) durak listesi d0–d11 oldu. Eşleme: d0–d5 aynı (d2 artık "Türkiye", Akdeniz ara durağı değil); v3 **d6** broşür kapağı → E **d8**; v3 **d7** iç sayfa (polaroid) → E **d9**; v3 **d8** iklim sayfası (11/12) → E **d6** arka duvar (broşürden çıktı); v3 **d9** arka kapak → E **d10**; v3 **d10** ortak evimiz → E **d11**; yeni **d7** "Sen de söz ver." (sol duvar). Klip adları: v3 t56 (d5 → banko) → E **t78** (d7 → d8), banko plakası p6 → **p8**. Aşağıdaki satırlar E değerleriyle güncellendi; değişmeyenler v3 numarasını korur.

v2 satırlarını v3 numaralarıyla okuyun (C turu denetimi, A3-07): "Salon ve stant numarası" satırındaki "d2'ye eklenir" v3'te **d3** (Antalya Expo); "Resmî COP31 logosu" satırındaki `DURAKLAR[0]` yedeği v3'te yok (aşağıda "Resmî logo onayı gelmezse"); "İngilizce tek satırlar" listesinin v3 hâli aşağıda; "QR'ın standdaki yeri" v3'te **d5** (Buradasın / Bugün); "Polaroid dalışı" v3'te **d7**; "AK Parti logosu (kapak)" satırının v3 karşılığı aşağıda ("Parti kimliği (v3)"). v2 satırlarındaki dosya adları (`derinlik.ts`, `HaritaKatmani.tsx`, `IcindenSahne.tsx`) silindi.

| Konu | Sitede şu an | Dayanak / dosya | Soru |
|---|---|---|---|
| Kiosk ekranı | `?auto=1`: durakta 5 s (stantta 600 + 4 × 3,5 s: dört bölgenin her biri 3,5 s; rotundada 600 + 3 × 4,5 s); d11'den sonra **kapanış 9 s** (logolar, sosyal hesaplar ve veri atıfları kamusal ekranda da görünür; kapanış ekrandan uzunsa atıflara kayar), sonra 600 ms beyaza sönme ve başa dönüş. Ziyaretçi dokunursa tur durur, 30 s sonra bulunduğu yerden (kapanıştaysa baştan) sürer. "← Konseptler" bağlantısı kioskta gizli. C turu ölçümü (W-C, 1280×800, prod): tam tur 106,5 s. **E turu ölçümü (M, 1280×800, prod): tam tur 120,1 s** (d0 → d11 → kapanış 9 s → beyaz → d0; yedek 0, hata 0); E'de d6 arka duvarda 600 + 3 × 3,5 s, d7'de 5 s. B turundaki 93 s kapanışsızdı. Dikey ve yatay iki set var (kare master'dan iki kırpım; kiosk için 720p setleri). | brief-icinden-3 §2.4, §4; `VideoSahne.tsx` kiosk | Kiosk ekranı yatay mı dikey mi, çözünürlüğü ve ağ bağlantısı ne? Açılıştaki "Aşağı kaydır / Scroll down" ipucu kioskta kalsın mı, yoksa "Dokun, kendin gez" gibi bir çağrı mı olsun? |
| Logonun "lombar" hareketi | d0→d1: logo 0,3 s'de bütün hâlinde söner; aynı dairede gerçek Dünya belirir (0,3 s); beyaz kâğıtta dairesel delik açılır ve kamera uzaya geçer. Sonda arka kapağın küre dairesinde aynı delik açılır. Logo hiçbir karede karanlıkla ya da fotoğrafla üst üste gelmez. | §1.1 B, `Lombar.tsx`, `VideoSahne.tsx` | Kabul mü? COP31 organizasyonuna (brand@cop31.tr) bu tarifle bildirilsin mi? |
| Kapanış atıfları | "Uydu görüntüsü: Contains modified Copernicus Sentinel data 2025." · "Yükseklik: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved." · "Dünya: NASA Earth Observatory (Blue Marble, Black Marble), GEBCO." · "Harita verisi © OpenStreetMap katkıda bulunanlar." · "COP31 Türkiye logosu etkinliğe atıf amacıyla kullanılmıştır." NASA logosu ya da onay izlenimi yok. Kiosk turunda kapanış 9 s gösterilir. Ana sayfadaki `/icinden` kartının görseli p1 render'ından olduğu için kartın altında tek satır: "“COP31'in İçinden” kart görseli: NASA Earth Observatory (Blue Marble, Black Marble), GEBCO; Contains modified Copernicus Sentinel data 2025." | §9.6, `varliklar-icinden.md` §3, `Icinden3.tsx` `ATIFLAR`, `src/app/page.tsx` | NASA, Copernicus (Sentinel-2, DEM) ve OSM atıfları bu metinle ve bu yerde uygun mu? |
| Ses | Site sessiz (ses izi yok, `-an`). | §6 | Onay? |
| Stantın ölçüsü | Render 15,0 × 9,9 m, duvar ~4,0 m varsayımıyla (PDF'te AREA SIZE boş). | §3.4 | Stantın gerçek ölçüsü ve duvar yüksekliği? |
| "Standın anatomisi" | d4: parçalar havada (duvarlar +1,4 m, kanopi +1,8 m, sütunlar kademeli), d4→d5'te birleşir. Son render'da ayrışma ölçülü: duvarların altından zemin görünüyor, kanopi halkası rotundanın üstünde asılı; ilk bakışta "maket" gibi okunuyor. | §2.3 d3 (R3), §9.1 d4 | Uygun mu? |
| İnsan figürü | Render'da insan yok; stant boş bir nesne olarak görünür. | §2.1 | Uygun mu? |
| Fuar alanı ve holler | OSM'de yalnız kalıcı ANFAŞ holü var; COP31 geçici holleri ve alan planı yok. Havadan görünüm temsilî; salon/stant konumunu gösteren etiket ya da pin yok. | §8, `varliklar-icinden.md` §4 | COP31 geçici holleri ve alan planı paylaşılabilir mi? |
| Broşürün basılı ölçüsü | Kapak oranı **0,708** olarak kararlaştırıldı (sitedeki DOM broşürle aynı, A5'e yakın; 149 × 210 mm varsayımı): son render'da bankodaki broşürün dokusu DOM kapağın ekran görüntüsüdür. d7→d8'de (E; v3'te d5→d6) DOM kapak son video karesindeki kapağın üstüne oturur, 420 ms'de render'ın ışık tonundan gerçek renklere geçerek okuma boyutuna büyür. Önceki gerçek kapak dosyasının oranı 0,476 (DL 99 × 210 mm olabilir). | §9.3, `kapak-dom.json`, `Brosur.tsx`, `kapak-ton.py` | Basılı ölçü ne (A5 / DL)? Bankoda yığın mı duruyor, standda mı? |
| 12 sütunun yazıları | 12 sütundan 10'unun içeriği onay bekliyor (§1–§4). Render'da sütun yüzleri kod verisinden üretilir. | §3.4, `emanet.ts` | Render'a ad ve il yazılsın mı, yalnız numara mı? (Değişirse t34b, l4, t45, l5 ve p5 yeniden render.) |
| "Akdeniz" ara durağı | **E'de değişti (brief §12.0-2a):** d2 artık ~1.700 km'den bütün Türkiye; "Akdeniz", "Anadolu", "Kıbrıs" etiketleri kalktı, 12 emanet ışığı ve alt bant ("12.000 yıl önceden bugüne.") geldi. Yeni sorular 14.1-E'de. | §9.1, §12.0 | — |
| Işık: 16.00 güneşi | Bütün dış sahneler 9 Kasım 2026, 16.00 TSİ (13.00 UTC) güneşiyle: Antalya'da altın saat başlıyor, gece sınırı Dünya diskinin sağ üçte birinde (İran–Hazar). 17.00'de Expo karesi fazla karanlık kalıyordu. | §9.2 | Saat ve ışık uygun mu? |
| d3 yakın plan ve Expo çatısı **temsilîdir** | d3 (Antalya Expo, ~650 m'den) ve d3→d4 çatı inişi: uzak plan (Beydağları, körfez, ova) uydu ve yükseklik verisinden gerçek; 0,6–2 km'lik ön plandaki evler, seralar, ağaçlar ve araçlar OSM ile Sentinel-2 sınıflamasından türetilmiş temsilî modellerdir. Expo salonunun çatı biçimi ve ışıklıkları bilinmiyor; render'daki çatı bantları temsilî. Bölge için açık lisanslı yüksek çözünürlüklü (10 m altı) hava fotoğrafı yok. | `varliklar-icinden.md`, S1 A turu raporu | Sitede küçük bir "görünüm temsilîdir" notu (kapanış atıflarının yanında) istenir mi? Salonun gerçek çatı fotoğrafı ya da planı paylaşılabilir mi? |
| Fuar alanında ağ | Klipler önceden iner (kalıcı önbellek); ağ yavaşsa (ölçülen eşik ~1,6 Mbps) site video yerine durak fotoğrafları arasında çapraz sönmeye düşer (işlevsel, sinematik değil). C turu, 4G (4 Mbps): ilk durağa hazır 2,9–3,3 s, ilk yükleme 1,3–1,5 MB, tam tur oturumu 10,5–12,0 MB (AV1 ≤ 11,0); 4 s'lik okur temposunda bütün geçişler video olarak oynadı. Geri yön klipleri yalnız durakta beklerken, ileri kliplerden sonra iner. | `klip-oynatma.md` §3.5 | Fuar alanının Wi-Fi'ı ve mobil hızı ne? Stant ekranı kablolu/yerel önbellekli olabilir mi? |
| ~150.000 ziyaretçi, marka yeşili | v2 satırlarındaki gibi (yukarıda). v3'te başlıklar Lora (stantın serif dili), İngilizce satırlar Lora italik. İngilizce satırların v3 listesi bir alttaki satırda. | §5 | Yukarıdaki sorular aynen. |
| İngilizce satırlar (v3; E numaralarıyla) | d0 "Scroll down" · d1 "The world meets in Antalya" · d2 "From 12,000 years ago to today." (E, yeni) · d3 "12 km from the city centre, 5 km from the airport" · d4 "A 12,000-Year Trust" · d5 "Climate, nature and zero waste are our heritage." · d6 arka duvar ve bandı "Climate Action" (E: iklim sayfasından duvara taşındı) · d7 "Make your pledge too." (E, yeni) · d8 "The brochure you can pick up at our stand" · broşür sayfalarında "Youth Meetings · Youth Festival" (d9), "Always by your side" (d10) · d11 "Our planet is our common home". Render'da standın kendi İngilizce bantları da okunur: "Play – What would you do?", "Come and play!", rotunda bandı "12,000-Year Trust", dönem halkasının İngilizce alt satırları. (C turu: d3'ün İngilizce satırı tarihin tekrarı yerine gövdenin çevirisi oldu; tarih d0 ve d1'de.) | `Icinden3.tsx` (`En`), `Brosur.tsx`, `scripts/blender/s2/dokular.mjs` | Çeviriler onaylanıyor mu? |
| Parti kimliği (v3) | AK Gençlik logosu ve "AK Parti Gençlik Kolları" adı d0'da ayrı üst şeritte. Render'da banko plakasında AK Gençlik logosu (d4'te ~13 px, okunmaz). Broşür kapağı dokusundaki AK Parti ve Gençlik Kolları logoları d4'te ~10 px (okunmaz), d7→d8 geçişinde (E: t78; v3'te t56) okunur hâle gelir; Cumhurbaşkanı fotoğrafları d9 ve sonrasında (E). E turunda d1–d3 ve d11'de parti içeriği yok; stant içi (d4–d10) serbest; arka duvarda Üsküdar GK Hatıra Ormanı tabelası ve sol duvarda GK sayıları (14.1-E). | brief-icinden-3 §1.1, §9.5; `s2/sahne.py` logo plakası | "Parti içeriği" bunları kapsıyor mu? |
| Resmî logo onayı gelmezse (v3) | Hazır yedek yok: d0'ı broşürün küre dairesiyle başlatmak kod değişikliği ister (d0 bölümü ve `VideoSahne` logo evresi; lombar dikişi yeniden ölçülür). | brief-icinden-3 §7.3 | — |
| Mekân adı | Metinlerde `content.ts` adı "Antalya Expo" (d0 logo altı, d1, d3 başlığı, kapanış); d3'teki harita etiketi OSM adıyla "Antalya Expo Center". | `src/lib/content.ts` `cop31.venue`, `klipler.json` d3 etiketi | Resmî ad hangisi? Tek ad seçilirse metinler `content.ts`'ten, etiket manifestten tek satırla değişir. |
| d4 "Oyna" etiketi | d4 sahne etiketi standın bölge adını tam veriyor: "Oyna – Sen olsan ne yapardın?"; render'daki koyu bant aynı cümleyi zaten gösteriyor (ekranda iki kez). **F turu: dikeyde etiket kaldırıldı** (render'daki yeşil bandın tam üstüne biniyordu; denetim D1-14); yatayda kalır, bölgenin satırı alt bantta. | `stant.ts` `bolgeler`, `klipler.json` d4 etiketleri | Etiket kısa "Oyun alanı" olsun mu? (Manifest etiketi, kodlama ajanı tek satırla değiştirir.) |
| d9 polaroidi ve d10 portresi (E; v3'te d7/d9) | d9'daki polaroid dalışı p18 (`solenKocaeliSahaSelam`), d10 arka kapak portresi p22 (`solenKocaeliSahaIkili`): ikisi sahadaki aynı yürüyüşün kareleri (`foto-yeni.md`). | `Brosur.tsx`, `docs/foto-yeni.md` | d9 için p19 (`solenKocaeliTribunSelam`, stadyum tribünü) kullanılsın mı? (Kırpım yeniden ayarlanır.) |
| Gerçek cihaz testi (v3) | Yapılmadı. Ölçümler headless Chrome (390×844 dokunma, 4× CPU, `scrollY` 1–2 kare gecikme taklidi, `play()` reddi taklidi). iOS Düşük Güç Modu'nda video oynamayabilir: site o zaman poster kipine düşer, ilk dokunuşta oynatmayı yeniden açar. C turu (makine boşta): 60 fps, 20 adımda uzun kare mobil 0–1 / masaüstü 0, düşen kare 0 (B: mobil 2); rotaya özgü JS 17,8 kB gz. C turu: iOS'ta gömülü videonun önyüklemesi metadata ile sınırlı olduğu için site her klibi bir kez görünmezken oynatıp durdurarak ısıtıyor (yalnız benzetimle sınandı); Veri Tasarrufu açık ya da bağlantı 2G/3G ise video indirilmez, geçişler durak fotoğrafları arasında çapraz sönme olur. | `klip-oynatma.md` §6 | Yayından önce iPhone (normal + Düşük Güç Modu), iOS Chrome ve orta sınıf Android'de denenmeli. |
| Bankodaki broşür (E: d8–d10 zemini; v3'te d6–d9) | **C turu: banko plakası (E: p8; v3'te p6) broşürsüz.** d7→d8'de t78'in (v3'te d5→d6, t56) son karesinde bankoda broşür yığını görünür; sitedeki kapak bu karedeki kapağın tam üstüne oturur (konum farkı ≤ 0,5 px), 420 ms'de render ışığından gerçek renklere geçerek okuma boyutuna gelir; altta boş banko kalır. Okuma yeri: telefonda ekranın ortası (×1,15 büyür), masaüstünde ekranın sol %62'si (metin sağda), yatay telefonda da sol %62. B turundaki "ikinci kapak" (yatay telefonda yığının kapağının açık broşürün yanında görünmesi) kalktı. Kesişmenin 200 ms'sinde yığının alttaki kâğıtları ve gölgesi söner (render'da yeniden üretilirse kalkar). | brief-icinden-3 §11.1, §10.3, §11.5; `VideoSahne.tsx` `okumaDonusum` | Broşür d8–d10'da bankodan kalkıp okunuyor, bankoda yığın kalmıyor: uygun mu? |
| Yatay ekranda kadraj | Masaüstünde metin sağda (%38); d8'de de (broşür solda). **F turu:** yatayda d4 bandı sol üste (karanlık hol; sağ-ortada yeni giriş pankartının üstüne biniyordu), d6/d7 duvar bantları sağ alta (yatay telefonda sol alta; duvar yazısının üstüne biniyordu; **E2'den beri** her yatay ekranda sağ sütunda, duvar yazısının sağında), yatay telefonda d2 bandı sağ alta taşındı. d4'te stantın sağ kanadı ve d5'te zemin halkasının sağı metnin altında kalıyor (kabul edildi, brief §11.4). **C turu: d3'te yatay kadraj ufka kaydırıldı** (t23 inişi boyunca kırpım yukarı kayar, d3'te kalır, d3→d4 parlamasında geri döner): 1280×800'de Beydağları, körfez, kent, Expo ve D400 kadrajda, beş etiket yerinde. 16:9'dan geniş yatay ekranlarda (ör. yatay telefon 844×390) üst ve alt biraz daha kırpılır: körfez, kent ve Expo görünür; Beydağları'nın yalnız etekleri kalır, "Beydağları" ve "D400" etiketleri gösterilmez. | brief-icinden-3 §4, §11.2-5, §10.3 | Masaüstü/kiosk yatay için d4/d5'te ayrı kadraj istenir mi (yeniden render gerekir)? |

#### 14.1-E E turu (3 Kasım 2026, `docs/brief-icinden-3.md` §12) — yeni sorular

E turunda d1'e ışık yayları, d2'ye tüm Türkiye kadrajı + 12 emanet ışığı, standa iki duvar durağı (d6 "İklim Eylemleri", d7 "Sen de söz ver.") ve DOM 3B broşür menteşesi geldi; durak numaraları d0–d11 oldu (eski d8 "sayfa 11/12" iklim sayfası arka duvara taşındı).

| Konu | Sitede şu an | Dayanak / dosya | Soru |
|---|---|---|---|
| Duvar baskıları | Arka duvar: "İklim Eylemleri / Climate Action", "300 fidan · Hatıra Ormanı 2025", Hatıra Ormanı tabelası fotoğrafı, "Genç İklim · 21-23 Ağustos 2026 · İstanbul", "#YaniBanaEmanet". Sol duvar: "1.000.000+ Genç Üye", "81 İl · 922 İlçe", iki ekranda "Sen de söz ver.". Ön cephe: PDF s.4 giriş pankartı. Kapanış atıflarına "Stant görünümü temsilîdir." eklendi. | brief §12.3, `scripts/blender/s2/dokular.mjs`, `content.ts`, `stant.ts` | Bu grafikler gerçek standa basılacak mı? Basılmayacaksa temsilî not kalır. |
| Duvarda parti sayıları | Gençlik Kolları sayıları ve Üsküdar GK Hatıra Ormanı d4'ten (stant anatomisi) itibaren duvarda görünüyor. | brief §12.0 (parti içeriği stant içinde serbest) | Uygun mu? |
| Giriş pankartı cephesi ve logo | Pankart PDF'te başka cephede; render'da ön cepheye alındı. Cephelerde AK Parti GK logosu yok. | `stant.ts` `pankartlar` | Ön cephe uygun mu? Cephelere logo konsun mu? |
| Duvarda fotoğraf | Yalnız Hatıra Ormanı tabelası (insansız). İnsanlı fidan/orman kareleri render'da yok. **Tabela fotoğrafında üç logo görünüyor: OGM (Orman Genel Müdürlüğü; üçüncü taraf), AK Parti Üsküdar ve Üsküdar GK** (denetim D3-08; p6 posterinde okunuyor). | brief §2.1, `docs/foto-yeni.md`, `cop31-varlik/s2/doku/KAYNAK.md` | İnsanlı kareler duvara basılsın mı? (Render'da insan figürü kuralı.) Tabeladaki OGM logosu kalabilir mi? (Reddedilirse duvar dokusu yeniden kırpılır; t34b/l4/t45/t56/t67/t78 yeniden render, ~30 dk GPU.) |
| Yeni metinler | d2 "12.000 yıl önceden bugüne." / "From 12,000 years ago to today."; d6 "Climate Action"; d7 "Sen de söz ver." / "Make your pledge too."; `girisMetni[1]` d4'ten d2'ye taşındı. | `stant.ts` `girisMetni`, `kiosk.cagri`; `Icinden3.tsx` | Onay? |
| d1 yayları ve künye | 1995–2025 COP ev sahibi 27 kentten Antalya'ya adsız ışık yayları; künyede açılışa kadar "Açılışa N gün", etkinlikte "COP31 · N. gün", sonrasında "9–20 Kasım 2026". | `src/lib/cop-kentleri.ts`, `DunyaYaylari.tsx` | Kent listesi ve sayaç uygun mu? |
| d2 emanet numaraları | 12 alan kronolojik sırayla yanıyor; 02, 10, 12 numaralı alanlar PDF'te yok (§1). | `emanet.ts` | Belgrad 1 / Göbeklitepe 12 numaralandırması doğru mu? |
| Broşür turu | İklim sayfası (11/12) broşür turundan çıkıp arka duvara taşındı; hayalet sayfalarda "İçindekiler", "Başkan'ın Mesajı", "Cumhurbaşkanımızın Gençlik Vizyonu", "Gençlik Şölenleri", "Kapanış Konuşması", "İklim Eylemleri" başlıkları görünüyor. | `Brosur.tsx` | Uygun mu? |
| "Genç İklim" yazımı | `content.ts` "Genç İklim", pankart "GençİKlim". Duvarda content.ts yazımı kullanıldı. | `content.ts:109`, `stant.ts:79` | Aynı program mı; hangi yazım? |
| d6 arka duvar düzeni (F turu, D1-10) | Dikeyde "Genç İklim / 21-23 Ağustos 2026 / İstanbul" bloğu Hatıra Ormanı tabelası fotoğrafının hemen altında ve sağa hizalı; fotoğrafın altyazısı gibi okunuyor (fotoğrafın asıl satırları "300 fidan / Hatıra Ormanı 2025" solda). | `cop31-varlik/s2/doku/duvar-arka.png` | Kabul mü? Değilse dokuda ≥ 0,25 m boşluk/ayraç + fotoğraf künyesi; t56, p6, t67 yeniden render (~10 dk GPU, tahmin). |
| d2 dikey kadraj (F turu, D1-16) | ~1.700 km'de dikey ekranda bütün Türkiye sığmıyor: Trakya ve Van/Ağrı kadraj dışında; ekranın üst ~%36'sı Karadeniz/Ukrayna bulutları. Yatayda tamamı görünüyor. | brief §12.0-2a, kamera D2 | Kabul mü? |
| Geri geçişlerin süresi (F turu, D2-01) | Geri yön klipleri artık 1,0 hızla oynuyor (önce 1,25×; her geri klip bir kare düşürüyordu). Geri geçişler %25 uzadı; F turu ölçümü (prod, headless Chrome, 4× CPU): 7→6 1,62 s, 11→10 ve 1→0 1,82–1,84 s, 3→2 2,82 s, 8→7 2,84–2,85 s (r87 + broşürün DOM dönüşü). | `klipler.json` `hizGeri`, `manifest-birlestir.mjs` | Geri yön temposu uygun mu? (Daha kısa istenirse geri klipler zaman sıkıştırılarak yeniden kodlanır; render gerekmez.) |
| d6/d7 yatay kadraj (E2 turu, denetim D1-02) | **Düzeltildi (render yok).** Yatayda d7 "1.000.000+" rakamı üstten kesikti (1280×800 ve kiosk 1920×1080'de de), yatay telefonda (844×390) d6 "İklim Eylemleri" başlığı da. Yatay videonun kırpımı duvar duraklarında yukarı alındı (d6 293, d7 233 master px; geçişlerde yumuşak kayar, d5 ve d8 değişmedi). Ölçülen boşluk (rakam/başlık üstü → ekran üstü): d7 1280×800'de 124 px, 1920×1080'de 168 px, 844×390'da 32 px; d6 sırasıyla 120 / 161 / 29 px. "Sen de söz ver." ekranları ve "İstanbul" satırı 844×390'da alttan 21–24 px içeride. Metin bandı her yatay ekranda sağ sütuna, duvar yazısının sağına alındı (iPad yatayında yazısı küçük). Dikey görünüm değişmedi. | brief-icinden-3 §12.12; `kodla.mjs` `KIRPIM_Y`; `icinden3.css` | Yok (bilgi). |

