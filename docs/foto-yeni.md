# Yeni fotoğraflar (H2) — 22 kare, `/dunya` derinleştirmesi

Kaynak: `scratchpad/yeni-foto/src/p01.jpg … p22.jpg` (orijinaller 0,1–9,5 MB; 2560–7008 px).
İşlem (`PIL`): `ImageOps.exif_transpose` (yalnızca p06'da EXIF yönü 8 → dikey), uzun kenar ≤ 1600 px (LANCZOS), JPEG kalite 82, progressive + optimize, EXIF/GPS silindi (kaynakların renk profili sRGB ya da yok; sRGB varsayılır).
p13 zaten 1600×1066 ve yeniden kodlama dosyayı 100 KB'tan 109 KB'a büyüttüğü için kaynak baytları olduğu gibi kopyalandı (kuşak kaybı yok).
Çıktı: `public/photos/` altında 22 yeni dosya, toplam ~3,7 MB (tek dosya 93–256 KB). Mevcut 20 dosyaya dokunulmadı; ad çakışması yok.
Anahtarlar: `src/lib/photos.ts` içinde `photos` nesnesinin sonuna eklendi (mevcut 20 anahtar, sıra ve tipler aynı). Kanıt: `.qa/foto-yeni-temas.jpg` (22 çıktı), `.qa/foto-yeni-kirp-1.jpg` ve `-2.jpg` (aşağıdaki `object-position` önerilerinin `object-fit: cover` benzetimi).

## Kısa karar — bölüm başına en iyi kareler

| Bölüm | EN İYİ | Anahtar | Oran / `position` | Neden |
|---|---|---|---|---|
| 6 Buluşmalar (söyleşi) | **p12** | `bulusmaKampusSoylesi` | 4:3 · `40% 50%` | Söyleşi biçimini doğrudan anlatıyor: koltuklarda gençler, Cumhurbaşkanı mikrofonla konuşuyor; üç yüz net, sıcak ifade. |
| 6 Buluşmalar (kamp) | **p16** | `kamp2025Selam` | 4:3 · `50% 8%` | "…Gücü AK Gençlik · Strateji ve İstişare Kampı" fonu kadrajda, bölümün başlığını kendisi söylüyor; iki yüz net, el sallama küçük boyutta da okunuyor. |
| 7 Şölen | **p19** | `solenKocaeliTribunSelam` | 4:3 · `0% 50%` | 100.000+ ölçeğini taşıyan tek kare: dolu tribün, "Kocaeli" pankartı, Cumhurbaşkanı tribünü selamlıyor. |
| 7 Şölen | **p08** | `solenKocaeliKursuSelam` | 4:3 · `100% 50%` | "Bir Gençlik Şöleni" logosu ve "KOCAELİ" kürsü plakası kadrajda; iki el havada. `100%` soldaki yarım kesik kişiyi dışarıda bırakır. |
| 8 Başkan portresi | **p22** | `solenKocaeliSahaIkili` | 1:1 · `50% 11%` | Gençlik Kolları Başkanı yüzü net ve kameraya dönük, yanında Cumhurbaşkanı el sallıyor; arka plan bulanık tribün, kare kırpımda iki yüz de rahat. |
| 12 Kapanış | **p10** | `kamp2025Ozcekim` | 4:3 · `42% 50%` (ya da 3:2 · `50% 50%`) | "Bugünü ve Geleceği Birlikte Şekillendiriyoruz" satırının görsel karşılığı: sahnede özçekim, arkada salonu dolduran gençler. |
| 12 Kapanış | **p06** | `solenKocaeliElKalpte` | 3:4 · `50% 35%` (1:1 · `50% 34%`) | El kalpte, gülümseyen tek kişilik portre; vedada "teşekkür" jesti olarak oturur. Dikey, yüz keskin, sade fon. |

### Önemli: p06 Başkan portresi olarak kullanılmamalı

`brief-dunya-2.md` §1 satır 8'de "el kalpte portre p06" önerilmiş. Ancak 8. bölümdeki panelde ad ve alıntı **Av. Yusuf İbiş, AK Parti Gençlik Kolları Başkanı**'na ait (`content.ts` → `baskanMesaji`). p06'da ise yalnızca Cumhurbaşkanı Erdoğan var; bu karenin İbiş'in adı ve alıntısının yanında durması, alıntıyı yanlış kişiye atfetmiş gibi görünür. Bu yüzden 8 için p22 öneriliyor, p06 kapanışa (ya da 7'ye yedek) alındı.

### Alternatif plan (brief'teki p18'e sadık kalınmak istenirse)

p18, p21 ve p22 sahada aynı yürüyüşün kareleri. 7'de p18, 8'de p22 kullanılırsa art arda iki bölümde aynı ikili, aynı selam görünür. p18 7'ye konacaksa:
- 7: p19 + p18 (`solenKocaeliSahaSelam`, 4:3 · `50% 17%`)
- 8: p16 (`kamp2025Selam`, 1:1 · `50% 0%`): üstteki kamp yazısı kırpımda yarım kalır, kabul edilebilir.
- 6: p12 + p10 (kamp karesi olarak özçekim; kamp adı fotoğraf yazısında verilmeli)
- 12: p06 + p05

## Tam tablo

Yön: Y = yatay, D = dikey. Bölüm: 6 Buluşmalar · 7 Şölen · 8 Başkan portresi · 12 Kapanış · yok. Odak, `Polaroid` bileşenindeki `position` (= `object-position`) değeri; oran belirtilmediyse varsayılan `4 / 3`.

| # | Anahtar | Dosya | Boyut / KB | İçerik | Yön | Bölüm | Odak | Karar ve gerekçe |
|---|---|---|---|---|---|---|---|---|
| p01 | `bulusmaKampusHediye` | `bulusma-kampus-hediye.jpg` | 1600×1067 / 119 | Gençlik Buluşmaları "Kampüs" (13 Aralık 2025): Cumhurbaşkanı'na "Gençlik · Lider · Özgüven · Vizyon" yazılı kutu takdimi; fonda gençlik fotoğrafları çerçevelerde. | Y | 6 (yedek) | 4:3 `50% 50%`; 1:1 `50% 35%` | Öner (yedek): ayrı bir an, iki yüz net; kutu üzerindeki küçük yazılar polaroid boyutunda gürültü yapar. |
| p02 | `bulusmaKampusMikrofon` | `bulusma-kampus-mikrofon.jpg` | 1600×1098 / 96 | Aynı söyleşi: Cumhurbaşkanı mikrofonla konuşuyor, ön planda alkışlayan genç eller (bilinçli bulanık). | Y | 6 (yedek) | `40% 40%` | Öner (yedek): yakın ve samimi; ama ön plandaki bulanık el ve yüz küçük boyutta karışık okunur, p12 daha net. |
| p03 | `bulusmaKampusGenclerSohbet` | `bulusma-kampus-gencler-sohbet.jpg` | 1600×1215 / 171 | Aynı salon: Cumhurbaşkanı arkadan, bir genç kız ona doğrudan konuşuyor; fonda "Gençlik Buluşmaları" pankartı. EXIF tarihi 15.12.2025. | Y | yok | `60% 50%` | Önerme: **yüz kesik**. Cumhurbaşkanı arkadan, sağ öndeki gencin yüzü kadrajın kenarında kesik. Anlamı güçlü ("doğrudan iletme"), istenirse yalnızca büyük kırpımda. |
| p04 | `kamp2025KonusmaTablo` | `kamp-2025-konusma-tablo.jpg` | 1600×1094 / 137 | Strateji ve İstişare Kampı (13 Ağustos 2025): kürsüde konuşma; fonda cami, bayrak ve Cumhurbaşkanı yüzünün resmedildiği büyük tablo. | Y | yok | `55% 40%` | Önerme: **aynı anın tekrarı** (kamp kürsü konuşması; p09 daha sade). Fondaki ikinci dev yüz küçük boyutta dikkati böler. |
| p05 | `kamp2025SalonIsiklar` | `kamp-2025-salon-isiklar.jpg` | 1600×997 / 205 | Kamp salonu: telefon ışıklarını yakan yüzlerce genç, "AK Gençlik" pankartları; Cumhurbaşkanı sağ kenarda kürsüde. | Y | 12 (yedek) | 3:2 `100% 50%` | Öner (yedek): atmosfer karesi, geniş bant için iyi; yüzler çok küçük, kişi odaklı polaroidde zayıf. |
| p06 | `solenKocaeliElKalpte` | `solen-kocaeli-el-kalpte.jpg` | 1067×1600 / 107 | Bir Gençlik Şöleni (Kocaeli, 16 Mayıs 2026): kürsüde el kalpte, gülümseyen Cumhurbaşkanı; sade lacivert fon. EXIF yönü 8 düzeltildi. | D | **12 (EN İYİ)**; 7 (yedek) | 3:4 `50% 35%`; 1:1 `50% 34%`; 4:3 `50% 36%` | Öner: kapanışta teşekkür jesti. 8 için **önerme**: panel Başkan İbiş'in adını ve alıntısını taşıyor (yukarıya bakın). |
| p07 | `solenKocaeliKursuKonusma` | `solen-kocaeli-kursu-konusma.jpg` | 1600×1067 / 109 | Şölen kürsüsü: "Kocaeli" mikrofon plakası, "Bir Gençlik Şöleni" logosu; konuşma anı, ağız açık. | Y | yok | `35% 45%` | Önerme: **aynı anın tekrarı** (Şölen kürsüsü; p08 daha iyi: iki el havada, logo ortada). Konuşma anı ifadesi sert. |
| p08 | `solenKocaeliKursuSelam` | `solen-kocaeli-kursu-selam.jpg` | 1600×1067 / 93 | Şölen kürsüsü: iki el havada selam, "Bir Gençlik Şöleni" logosu ve "KOCAELİ" plakası; sol kenarda yarım kesik bir kişi. | Y | **7 (EN İYİ)** | 4:3 `100% 50%`; 1:1 `45% 50%` | Öner: etkinlik kimliğini kadrajda taşıyan tek kare. `100%` sol kenardaki kesik kişiyi dışarıda bırakır. |
| p09 | `kamp2025KursuBasparmak` | `kamp-2025-kursu-basparmak.jpg` | 1600×1067 / 116 | Kamp: mavi fon önünde ahşap kürsü, başparmak yukarıda, gülümseyen Cumhurbaşkanı. | Y | 6 (yedek) | `45% 30%` | Öner (yedek): net ve olumlu; ama fonda kamp adı yok (adı p13 ve p16 taşıyor). |
| p10 | `kamp2025Ozcekim` | `kamp-2025-ozcekim.jpg` | 1600×1067 / 256 | Kamp: Gençlik Kolları Başkanı sahnede Cumhurbaşkanı'yla özçekim yapıyor, arkada salonu dolduran gençler ve pankartlar. | Y | **12 (EN İYİ)**; 6 (alternatif) | 4:3 `42% 50%`; 3:2 `50% 50%` | Öner: "birlikte" duygusunun en güçlü karesi. 256 KB ile setin en büyüğü (kalabalık detayı); `sizes` doğru verilirse sorun değil. |
| p11 | `bulusmaKampusSoylesiGenis` | `bulusma-kampus-soylesi-genis.jpg` | 1600×1067 / 153 | "Kampüs" söyleşisi geniş: beş kişi koltuklarda, ortada mikrofonla Cumhurbaşkanı; fonda çerçeveli gençlik fotoğrafları. | Y | yok | `50% 50%` | Önerme: **aynı anın tekrarı** (p12'nin geniş hâli). Yüzler polaroid boyutunda çok küçük kalıyor. |
| p12 | `bulusmaKampusSoylesi` | `bulusma-kampus-soylesi.jpg` | 1600×1067 / 140 | "Kampüs" söyleşisi yakın: gülümseyen Başkan, genç kız, mikrofonla konuşan Cumhurbaşkanı. | Y | **6 (EN İYİ)** | 4:3 `40% 50%` | Öner: söyleşi biçimini ve sıcaklığı en iyi taşıyan kare. 1:1 kırpımda soldaki yüz kesilir; 4:3 ya da 3:2 kullanın. |
| p13 | `kamp2025Pankart` | `kamp-2025-pankart.jpg` | 1600×1066 / 100 | Kamp sahnesi: "13 Ağustos 2025 · Bu Senin Hikayen · Türkiye'nin Gücü AK Gençlik · Strateji ve İstişare Kampı" fonu, küçük kürsüde Cumhurbaşkanı. | Y | 6 (yedek, yalnızca küçük polaroid) | `50% 50%` | Öner (yalnızca küçük polaroid): **düşük çözünürlük** (kaynak zaten 1600 px, 100 KB) ve **metin ağırlıklı**; kişi kadrajın %10'u. Tarih ve kamp adı lazımsa yazıyı başlık/altyazıda vermek daha iyi. |
| p14 | `gencfestYuruyus` | `gencfest-yuruyus.jpg` | 1600×1060 / 212 | "GençFest – Bir Gençlik Festivali" (kapalı spor salonu, turkuaz LED halka): Cumhurbaşkanı ve gençler kalabalığın arasından yürüyor. EXIF 16.05.2025. | Y | 7 (yedek, onaylı ise) | `45% 40%` | Öner (yedek): güçlü kompozisyon; ama Kocaeli Şöleni **değil**, ayrı bir etkinlik. Yer ve tarih müşteriye sorulmalı. |
| p15 | `gencfestSalonKonusma` | `gencfest-salon-konusma.jpg` | 1600×1049 / 253 | GençFest salonu: dev ekran, "Artık eski Türkiye yok! … Bu bir öz güven devrimi" pankartı; Cumhurbaşkanı sağ kenarda kürsüde. | Y | yok | `100% 50%` | Önerme: **metin ağırlıklı sahne** (sloganlı dev pankart), kişi kenarda; etkinlik onaysız. |
| p16 | `kamp2025Selam` | `kamp-2025-selam.jpg` | 1275×1600 / 174 | Kamp sahnesi: Cumhurbaşkanı el sallıyor, yanında Gençlik Kolları Başkanı; fonda kamp adı ve logolar; ön planda uzanan eller. | D | **6 (EN İYİ)**; 8 (alternatif) | 4:3 `50% 8%`; 1:1 `50% 0%` | Öner: kamp karesi. Dikey kaynak 4:3'e kırpılınca fon yazısı ve iki yüz birlikte kalıyor (`.qa/foto-yeni-kirp-2.jpg`). |
| p17 | `bulusmaKampusSalonSelam` | `bulusma-kampus-salon-selam.jpg` | 1600×1081 / 226 | Gençlik Buluşmaları "Kampüs" salonu (kemerli tarihî salon): alkışlayan gençleri selamlayan Cumhurbaşkanı; ekranda "Gençlik Buluşmaları 'Kampüs' 13 Aralık 2025". | Y | 6 (yedek) | `60% 50%` | Öner (yedek): etkinlik adını ve kalabalığı birlikte veren güçlü ikinci seçenek. Cumhurbaşkanı sağ kenarda yarım profil. |
| p18 | `solenKocaeliSahaSelam` | `solen-kocaeli-saha-selam.jpg` | 1233×1600 / 254 | Kocaeli Stadyumu sahası: Cumhurbaşkanı tribünü selamlıyor, yanında Gençlik Kolları Başkanı; arkada "Bir Gençlik Şöleni" pankartları. EXIF 18.05.2026 (farklı makine saati; ceket, rozet ve pankart Şölen ile aynı). | D | 7 (yedek) | 4:3 `50% 17%`; 1:1 `50% 0%` | Öner (yedek): stadyumu gösteriyor; ama p22 ile **aynı an**. Yalnızca 8'de p22 kullanılmıyorsa (alternatif plan). |
| p19 | `solenKocaeliTribunSelam` | `solen-kocaeli-tribun-selam.jpg` | 1600×1063 / 251 | Cumhurbaşkanı dolu tribünü selamlıyor; "Kocaeli her zamanki yerinde" turuncu pankartı, el sallayan gençler. | Y | **7 (EN İYİ)** | 4:3 `0% 50%` | Öner: şölenin ölçeği. `0%` sol kenardaki Cumhurbaşkanı profilini kadrajda tutar; daha sağa kaydırmayın. |
| p20 | `solenKocaeliElOpme` | `solen-kocaeli-el-opme.jpg` | 1600×1152 / 138 | Şölen sahnesi: bir genç Cumhurbaşkanı'nın elini öpüyor. | Y | yok | — | Önerme: **el öpme karesi**. Uluslararası COP31 ziyaretçisine yönelik sitede yanlış okunabilir (brief §4). Dosya yalnızca arşiv için duruyor. |
| p21 | `solenKocaeliSahaYuruyus` | `solen-kocaeli-saha-yuruyus.jpg` | 1186×1600 / 213 | Sahada yürüyüş: Cumhurbaşkanı el kalpte, yanında Gençlik Kolları Başkanı, arkada bir görevli. | D | yok | 4:3 `50% 0%` | Önerme: **aynı anın tekrarı** (p22 ve p18 ile aynı yürüyüş). Bakışlar kameradan uzak, arkadaki üçüncü kişi dikkati böler. |
| p22 | `solenKocaeliSahaIkili` | `solen-kocaeli-saha-ikili.jpg` | 1242×1600 / 172 | Sahada ikili: Gençlik Kolları Başkanı (net, kameraya dönük) ve el sallayan Cumhurbaşkanı; arka plan bulanık tribün. | D | **8 (EN İYİ)** | 1:1 `50% 11%`; 4:3 `50% 18%` | Öner: Başkan portresi. Yürüyüş üçlüsünün (p18, p21, p22) en iyisi: iki yüz de net, sade fon, kare kırpıma en uygun kare. |

## Kullanım (A için)

```tsx
<Polaroid photo={photos.bulusmaKampusSoylesi} caption="Gençlik Buluşmaları · Kampüs" position="40% 50%" />
<Polaroid photo={photos.kamp2025Selam} caption="Strateji ve İstişare Kampı · 13 Ağustos 2025" position="50% 8%" />
<Polaroid photo={photos.solenKocaeliTribunSelam} caption="Bir Gençlik Şöleni · Kocaeli" position="0% 50%" />
<Polaroid photo={photos.solenKocaeliKursuSelam} caption="16 Mayıs 2026 · Kocaeli Stadyumu" position="100% 50%" />
<Polaroid photo={photos.solenKocaeliSahaIkili} aspect="1 / 1" position="50% 11%" sizes="(max-width: 520px) 38vw, 190px" />
```

Dikey kaynaklarda (p06, p16, p18, p21, p22) `position`'ın y değeri belirleyici; yatay kaynaklarda (4:3 kırpımda en fazla %11 genişlik gider) x değeri.

## Notlar ve onay

- **Kişiler:** Alt metinlerde ad yazılmadı; "Gençlik Kolları Başkanı" rolü brief-dunya-2 §0 bağlamına ("Cumhurbaşkanı + Gençlik Kolları Başkanı") ve mevcut `baskanVeCumhurbaskani` karesine dayanıyor. Ad eklenecekse müşteri onayıyla eklenmeli.
- **Tarihler:** Kamp tarihi fondan (p13) okundu, "Kampüs" tarihi ekrandan (p17) okundu. Şölen kareleri: p06, p07, p08 ve p19'un EXIF'i 16.05.2026; p18, p20, p21 ve p22'nin EXIF'i 18.05.2026. Aynı ceket, rozet ve pankart olduğu için makine saati farkı sayıldı; alt metinlerde bu karelere tarih yazılmadı.
- **GençFest (p14, p15):** brief'te geçmeyen ayrı bir etkinlik (EXIF 16.05.2025, kapalı salon). Yeri ve adı onaylanmadan Kocaeli Şöleni gibi etiketlenmemeli. `docs/onay-listesi.md` H1'e ait; bu madde oraya eklenmek üzere raporda iletildi.
- **Kamp fotoğrafının bölümü:** Brief'te "Buluşmalar" (6) olarak geçiyor. Kamp bir buluşma değil, teşkilat kampı; müşteriye sorulacaklar listesinde zaten var (brief-dunya-2 §7.6).
- `photos.ts`'teki `photoList` ve `imageList` artık 42 fotoğraf içeriyor (`Object.values(photos)`). "20 fotoğraf" yorumları değiştirilmedi (yalnızca ekleme kuralı). `src/` altında bu iki listeyi kullanan kod yok (grep ile doğrulandı).
