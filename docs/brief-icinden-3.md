# `/icinden` v3 — sinematik storyboard ve tasarım yönü (R3 taslağı + §9 orkestratör kararları, 2 Kasım 2026)

Durum: **karar verildi** — §0–8 R3'ün taslağı, **§9 orkestratörün bağlayıcı kararları** (çelişkide §9 geçerli).
Keşif belgeleri: `docs/varliklar-icinden.md` (R1), `docs/blender-boru-hatti.md` (R2), `docs/klip-oynatma.md` (R4).
`docs/brief.md` §2 kuralları ve `docs/brief-icinden.md` (v2) içerik kararları, aşağıda "değişen" denmedikçe geçerli.
İşaretler: **(Ö)** bu oturumda ölçüldü/hesaplandı, **(V)** varsayım (render öncesi doğrulanacak), **ONAY** müşteriye sorulacak.

Çerçeve (orkestratör kararı, burada yalnızca ayrıntılandırıldı):
1. Kilitli bölüm bölüm adımlama (`src/components/dunya/adim.ts`, WebKit güvenli kalıp). Bir jest = bir durak geçişi; geçiş süresi = klip süresi (1,6–2,4 s). Scrub yok.
2. Dünya → Antalya → Expo → stant → rotunda → broşür dalışı Blender'da önceden render edilmiş kliplerle: geçiş başına ileri + geri klip, durakta sessiz döngü. Metin DOM'da. Broşür sayfaları (d5–d8) DOM.
3. Lisans temiz varlık: NASA Blue/Black Marble, Copernicus Sentinel-2 ve DEM GLO-30, OSM, Natural Earth. Google/Bing/Mapbox/ESRI ve EOX S2 cloudless YOK.

## 0. Referanstan ne alıyoruz, ne almıyoruz

Kaynak: "I Built a $10,000 3D Website…" (BuildWithAI, 10 Ağustos 2026), 25 s, AV1 608×1080, 30 fps **(Ö)**.
Gösterilen site "The Anatomy of a Suit": siyah zemin, tepeden tek spot, foto-gerçekçi giysi parçaları havada
durup birleşiyor, büyük serif başlık, parçalara ince çizgilerle bağlanan küçük etiketler; klipler Veo ile
üretilip ffmpeg ile kareye bölünmüş.

| Alıyoruz | Almıyoruz |
|---|---|
| Sahne başına **tek ana ışık**; ışığın kendisi kompozisyon | Siyah-altın lüks paleti (bizim ışığımız gerçek güneş ve fuar ışığı) |
| Yavaş başlayıp yavaş duran kamera; hareket bulanıklığı | Üretken video (Veo): coğrafi doğruluk, tekrar üretilebilirlik ve lisans belirsiz → Blender |
| Nesnenin **anatomisi**: parçalar havada, sonra birleşir (bizde: stant) | Cam kartlı sabit üst menü, "Book" çağrıları, ikinci bir vurgu rengi |
| Büyük serif başlık + parçalara bağlı ince etiketler | Fade-and-slide giriş efektleri; her bölümde ayrı gösteri |

## 1. Tasarım tezi

COP31'in "ortak evimiz" iddiasını süslemeyle değil, **tek bir gerçek güneşle** karşılıyoruz: açılış günü
9 Kasım 2026, saat 17.00 (UTC+3), Dünya o an nasıl aydınlanıyorsa öyle görünür; gündüz-gece sınırı doğu
Türkiye'den geçerken kamera aynı ışığın içinde Antalya Körfezi'ne, Expo'ya ve fuar holünde tek ışıkla
aydınlanan standımıza iner. Referanstaki "karanlık, tek ışık, yavaş kamera" dili bize giydirilmiş bir stil
olarak değil, mekânların fiziği olarak gelir: uzay karanlıktır, fuar holü loştur, stant içindeki tek parlak
nesnedir. Resmî logo beyaz kâğıtta kalır: önce bütün hâlinde yerinde söner, amblem diskinin yerinde aynı
çapta gerçek Dünya belirir, sonra beyaz kâğıt bir **lombar** gibi delinip açılır ve kamera bu delikten uzaya
geçer; logo hiçbir karede karanlık ya da fotoğrafla üst üste gelmez. Aynı lombar sonda arka kapaktaki küre
dairesinde tekrar açılır ve aynı Dünya'ya döneriz (Droste kapanışı v2'den korunur).

### 1.1 Logo çözümünün gerekçesi

| Seçenek | Karar | Neden |
|---|---|---|
| A. Kamera amblemin içinden geçer (amblem parçalanır, ebru boşlukları uzaya açılır) | Hayır | Logo parçalara bölünür ve koyu zemine konur: iki kural ihlali (`docs/cop31-logo.md` §2). |
| **B. Logo söner → aynı daire gerçek Dünya → beyaz kâğıt lombar olur** | **Seçildi** | Logo yalnız bütün hâlinde opaklık alır; karanlık yalnız logo 0 opaklığa indikten sonra, deliğin içinde görünür. Daire–daire eşleşmesi korunur. |
| C. Beyaz sayfa perde gibi yukarı kalkar, altından uzay | Yedek | Kurala uygun ama "içinden geçme" hissi yok; logo onayı gelmezse de A/B'ye gerek kalmaz. |

Zamanlama kuralı: logo opaklığı 0'a inmeden Dünya diski görünmez (v2'deki d 0,20–0,40 çakışması kaldırıldı;
onay-listesi §14 "yerinde sönme" sorusu böylece daralır). Lombar DOM'dadır, render'da değil: beyaz tam
`#FFFFFF` kalır, render renk dönüşümü (AgX) beyazı kirletmez.

### 1.2 Işık ve renk yolculuğu (tek güneş)

Güneş, Antalya Expo (36,9397 K 30,8176 D), 9 Kasım 2026 **(Ö, NOAA algoritması)**: 17.00'de yükseklik 8,6°,
azimut 241,1°; gün batımı 17.52 (deniz ufku). Alt-güneş noktası 16,96° G 34,1° B; terminatör 37° K enleminde
42,6° D (Van yöresi). Expo'dan bakışta kent merkezi 238° yönünde, yani güneşle neredeyse aynı doğrultuda.

| Bölüm | Işık | Baskın renkler (render hedefi, PIL ile posterden doğrulanır) |
|---|---|---|
| Uzay (d1, d9) | Çıplak güneş, atmosfer kenarı | uzay siyahı (render), atmosfer `#6FA8DC`, deniz `#1B3F6B`, Sahra `#C9A577`, terminatör bandı `#E08A4A`, şehir ışıkları `#FFC266` |
| İniş (T12 ortası) | Yandan alçak güneş, gölgeler KD'ye | sığ kıyı turkuazı `#3FB6B0`, derin `#12395E`, Toros kayası ışıkta `#B7A58C` / gölgede `#4B4A5E`, orman `#3E5A3A` |
| Altın saat (d2) | Karşıdan güneş, aerosol sisi | güneş halesi `#FFD9A0`, gök üstü `#5D7FAE`, körfez parıltısı `#F6C27A`, Beydağları sis katmanları `#7D7699`→`#A99FB6`, sera parıltısı `#F5E8D2` |
| Hol + stant (d3) | Tepeden tek yumuşak ışık (3.800 K) + soğuk arka kenar ışığı | hol `#121314`–`#2A2B2D`, ışıkta beyaz duvar `#ECE7DF`, ahşap `#B49168`, kanopi `#28332F` |
| Rotunda (d4) | Sıcak tepe ışığı (3.200 K) + kanopi altı LED (4.000 K) | zemin kremi `#E9DCC6`, halka `donemler` renkleri, "Bugün" diski `#F7E6CD` |
| Banko + broşür (d5–d8) | Sol üstten nötr-sıcak bankon ışığı | meşe `#C9A47A`, kâğıt `#FFFFFF`, slogan dairesi `#1B4F9C` |

## 2. Storyboard

### 2.1 Ortak kurallar

- **Master**: 1920×1920 kare, 30 fps, 16 bit PNG (bkz. §4). Kamera: 36 mm kare sensör. Aşağıdaki lens değerleri
  bu master içindir; parantezde **dikey teslimin yatay görüş açısı** (dikey kırpım genişliği master'ın %56,25'i:
  hFOV = 2·atan(10,125 / f)). 18 mm → 58,7°, 24 mm → 45,7°, 35 mm → 32,2°, 85 mm → 13,6°.
- **Video uzayı**: dikey teslim 720×1280; sayfada `object-fit: cover` ile oturur. 390×844'te ölçek 0,659, görünen
  genişlik 592 video px (yanlardan 64'er px kırpılır). **Güvenli alan**: ortadaki %76 genişlik × %75 yükseklik
  (9:21 telefon ile 3:4 tablet arasındaki ortak bölge). Anlamlı her şey (Dünya diski, Expo, stant, broşür) burada.
- **Metin bantları**: üst band y 0–%28, alt band y %68–100. Video kompozisyonunun öznesi y %30–66 arasında
  durur; bir durakta yalnızca bir bant kullanılır (diğeri resmin).
- **Klip zinciri**: L_k[0] ≡ T_(k−1→k) son karesi ≡ P_k (poster). Döngülerde kamera sabittir ve bütün çevre
  hareketi **periyodik saattir** (P = döngü süresi; gürültü 4B'de daire üzerinde döner, ışık sin ile): döngü
  dikişsiz kapanır, crossfade gerekmez. Jest döngünün ortasında gelirse geçiş klibine 160 ms çapraz sönme
  (kamera aynı, fark yalnızca bulut/su).
- **Easing**: ölçek değişen kliplerde `ln(kadraj)` üzerinde easeInOutSine; açı ve yön değişimleri kendi
  pencerelerinde easeInOutCubic; tüm kliplerin son 0,25 s'si yumuşak iniş (hız → 0). Hareket bulanıklığı açık
  (deklanşör 0,5).
- **Metin zamanı**: jestte metin 200 ms'de 0 opaklığa iner; klibin son 250 ms'sinde 350 ms'lik yalnız opaklık
  girişi (kayma yok). Kadraj okuması klip boyunca Blender'dan dışa aktarılan kare kare değerle akar.
- **Render'da yok**: COP31 logosu, insan figürü, sınır çizgileri, yıldızlar (parlak Dünya pozunda fotoğrafta
  görünmez), anamorfik parlama.

### 2.2 Özet tablo

| d | Durak | Poster (dinlenme karesi) | Gelen klip, süre | Döngü (tek motif) | Metin bandı |
|---|---|---|---|---|---|
| 0 | Açılış | DOM: beyaz zemin, resmî logo | — | yok | logo altı + alt satır |
| 1 | Dünya | 15.500 km'den Dünya, terminatör doğu Türkiye'de | T01 lombar, 0,6 + 1,8 s | L1 bulutlar yerinde akar, 4 s | üst |
| 2 | Antalya Expo | 650 m'den akşam güneşine karşı Expo, kent, körfez, Beydağları | T12 iniş, 2,4 s | L2 körfezde güneş parıltısı, 5 s | alt |
| 3 | Stant | Loş holde tek ışık altında "patlatılmış" stant | T23 çatıdan hole, 2,4 s | L3 parçalar nefes alır, 4 s | üst + parça etiketleri |
| 4 | Buradasın / Bugün | Rotundanın içinden zemin halkası, 12 sütun | T34 montaj, 2,0 s | L4 tepe ışığı nefesi, 4 s | alt + sütun etiketi |
| 5 | Broşür kapağı | Banko plakası + DOM kapak | T45 bankoya süzülüş, 2,0 s → DOM | DOM (v2 yörünge yayları) | alt (%12) |
| 6 | Buluşmalar · Şölen | DOM sayfa (v2) | DOM sayfa çevirme, 1,6 s | DOM polaroid sarkacı | broşürün içinde |
| 7 | İklim eylemleri | DOM sayfa (v2) | DOM sayfa çevirme, 1,6 s | DOM polaroid sarkacı | broşürün içinde |
| 8 | Arka kapak | DOM sayfa (v2) | DOM sayfa çevirme, 1,6 s | — | broşürün içinde |
| 9 | Ortak evimiz | P1 (aynı Dünya) | DOM yakınlaşma 0,6 s + T01 tekrar 1,8 s | L1 | üst (script slogan) |
| — | Kapanış | DOM, beyaz, snap'siz akış | — | — | akış |

### 2.3 Durak kartları

**d0 — Açılış (yalnız DOM)**
- (a) Beyaz `#FFFFFF`. Resmî dikey logo **video uzayında** yerleşir: amblem merkezi (360; 512), amblem çapı
  230 video px (logo genişliği 323, yüksekliği 456 video px; `cop31Amblem.dikey` oranından). Böylece amblem,
  T01'in ilk karesindeki Dünya diskiyle piksel piksel çakışır. Üst şerit (sayfanın sahibi): AK Gençlik logosu,
  yanında iki satır "AK Parti Gençlik Kolları" / "COP31 Antalya standı". Logonun altında "COP31 Türkiye, Antalya,
  9–20 Kasım 2026".
- (b) Çıkış: T01 (d1'de).
- (c) Hareket yok (resmî işaret).
- (d) Alt kenarda "Aşağı kaydır" / "Scroll down" (düz metin, zıplamaz).
- (e) Alt metin: "Beyaz zemin üzerinde resmî COP31 Türkiye Antalya logosu: lale ve ebru desenli, mavi-yeşil bir
  dünya diski." Reduced-motion: aynı ekran.

**d1 — Dünya**
- (a) P1: kamera Dünya merkezinden 21.900 km (irtifa ~15.500 km), alt-nokta ~33° K 27° D; 35 mm (32,2°).
  Disk çapı dikey genişliğin %105'i, merkez y %62 (disk üstü y %32,5, altı %91,5); Antalya diskin merkezinin
  hemen sağ üstünde. Faz açısı ~77° **(Ö)**: diskin ~%61'i aydınlık; sağ üçte birde gece, Black Marble şehir
  ışıkları (Körfez, İran, Kafkasya). Terminatörde ince turuncu bant, kenarda ince mavi atmosfer. Bulutlar Akdeniz
  üstünde seyrek. Pozlama: Sahra parlaklığı ≤ %92 (AgX, kırpma yok).
- (b) T01, d0→d1, toplam 2,4 s: 0–0,30 s DOM, logo bütün hâlinde 1→0 (ease-out) ve üst şerit söner;
  0,30–0,60 s amblem dairesinde T01'in ilk karesi belirir (Dünya ~72.000 km'den, faz ~45°, diski daireyi tam
  doldurur; ölçek 0,97→1). 0,60–2,40 s video: kamera Dünya'ya yaklaşır (uzaklık ×1/3,3), Dünya merkezi y %40 →
  %62 iner, kamera Dünya ekseni etrafında 30° doğuya döner ve terminatör sağdan girer. Lombar (DOM): beyaz
  katmanda dairesel delik, yarıçap amblem yarıçapından başlar, ease-in (kübik) ile 1,1 s'de ekran köşegenini
  geçer; delik Dünya'dan 2,6× hızlı büyür (kâğıt kameraya daha yakın: paralaks). Delik kenarında 1 px
  yumuşatma + 2 px iç gölge `rgba(0,0,0,.12)` (kâğıt kalınlığı). Delik yarıçapı, klipten dışa aktarılan
  `dunyaR[kare]` eğrisinden hesaplanır (`requestVideoFrameCallback`).
- (c) L1, 4 s: kamera sabit; bulut katmanı yerinde, 4B gürültüyle ağır ağır biçim değiştirir (genlik ≤ bir
  bulut genişliği). Başka hareket yok.
- (d) Üst band, sola hizalı, 24 px kenar. Başlık "Dünya Antalya'da buluşuyor"; İngilizce "The world meets in
  Antalya"; gövde (≤ 45 kelime, `content.cop31`): "BM İklim Değişikliği Konferansı COP31, 9–20 Kasım 2026'da
  Antalya Expo'da. Yaklaşık 150.000 yabancı ziyaretçi bekleniyor." (sayı ONAY, §14). Sahnede tek DOM etiketi
  "Antalya" + 3 px nokta (nabız yok). Scrim: üstten `#070B14`, 0–%36, metin satırlarında α ≥ 0,68 (atmosfer
  kenarı banda değiyor; bu değer saf beyaz piksel üstünde ikincil renkte bile 4,5:1 sağlar **(Ö)**, §5).
- (e) "Uzaydan Dünya. Akdeniz ve Türkiye akşamüstü ışığında; doğu Türkiye'den itibaren gece başlıyor, Orta
  Doğu'nun şehir ışıkları yanıyor. Antalya diskin ortasının hemen üstünde." Reduced: P1.

**d2 — Antalya Expo**
- (a) P2, 17.00: kamera Expo'nun 2,6 km DKD'sinde (Expo'dan azimut 70°; ~36,948 K 30,845 D, Aksu ovası), irtifa
  650 m, yön 250°, eğim −12°, 24 mm (45,7°). Hesaplanan yerleşim **(Ö, düz projeksiyon)**: güneş merkezin 9°
  solunda y ≈ %25; Beydağları sırtı (~2° yükseklik açısı, V) y ≈ %33, arkada 3 sis katmanı; körfez parıltısı
  y ≈ %37; kent silueti y ≈ %40 (12 km); Expo holleri y ≈ %52, genişliğin ~%24'ü; ön planda (0,6–1,3 km) karşı
  ışıkta parlayan seralar, narenciye bahçeleri, Expo'ya akan D400 çizgisi. Gölgeler kameraya doğru, cismin
  6,6 katı. Aerosol: görüş ~25 km (V). Kadraj Expo'da ~2,3 km.
- (b) T12, d1→d2, 2,4 s (72 kare), hedef kilitli kamera (Track To: başta Dünya merkezi, %30'a kadar Expo'ya geçer):
  - 0–0,9 s: 15.500 → 1.200 km, nadire yakın, kuzey yukarıda; disk kenarı ve terminatör kadrajdan çıkar.
  - 0,9–1,6 s: 1.200 → 60 km; Doğu Akdeniz → Antalya Körfezi; yön 0° → −40°, eğim −90° → −55°. **Turkuaz anı**:
    Lara–Kundu kumsalının sığ şeridi ve Kemer koyları, güneş soldan-arkadan (parıltısız, doygun); Beydağları ve
    Toros yamaçları sıyırıcı ışıkta; Aksu Çayı ağzı (Kundu doğusu, OSM ile doğrula).
  - 1,6–2,0 s: 60 → 5 km; eğim −55° → −20°, yön −40° → −110°; ~3,5 km'deki seyrek kümülüsten geçiş: **bulut
    perdesi** (en beyaz kare ~1,85 s) = model değişimi (küresel Dünya → bölge araziisi → yerel 3B).
    %80 civarında havalimanının üç pisti kadrajın solundan geçer.
  - 2,0–2,4 s: 5 km → 650 m, eğim −20° → −12°, güneş sol üstten kadraja girer; yumuşak iniş.
- (c) L2, 5 s: körfezdeki güneş parıltısı dalga normalleriyle titreşir (P = 5 s). Araçlar, bulutlar, ağaçlar sabit.
- (d) Alt band (ön plan karşı ışıkta koyu). Başlık "Antalya Expo Center"; İngilizce satır yok (özel ad), yerine
  alt satır "Aksu, Antalya. 9–20 Kasım 2026." / "9–20 November 2026"; gövde tek cümle: "Kent merkezine 12 km,
  havalimanına 5 km." (`expo-harita` noktaları: 11,7 ve 4,8 km). Sahne etiketleri (en çok 5, birlikte 300 ms
  belirir): "Antalya Expo Center", "D400", "Antalya" (Montserrat); "Antalya Körfezi", "Beydağları" (Lora italik).
  "Salon · Stant" satırı ONAY'a kadar yok. Scrim: alttan `#0B1A2E`, %60'tan başlar, metin satırlarında α ≥ 0,66.
- (e) "Akşam güneşine karşı Antalya: önde seraların parladığı Aksu ovası ve D400, ortada Antalya Expo Center'ın
  holleri, geride kent, altın renkli körfez ve Beydağları'nın siluetleri." Reduced: P2 + etiketler.

**d3 — Stant: "standın anatomisi"**
- (a) P3: loş fuar holü (siyah makaslar, lineer armatürler %10, koyu gri halı; komşu stantlar grafiksiz koyu
  hacimler). Stant parçalarına ayrılmış, havada: zemin plakası (açık meşe, basılı zemin halkası) yerinde; çevre
  duvarları +1,4 m yukarıda ve 0,6 m dışarıda; yeşil kanopi halkası (üzerinde "12.000 Yıllık Emanet – A 12,000-Year
  Trust") +1,8 m; 12 sütun numaraya göre +0,3…+0,9 m kademeli, her biri ≤ 4° dönük; amfi bankları +0,5 m;
  karşılama bankosu broşür yığınıyla +0,4 m; turuncu pankartlar duvarların yanında; saksılar yerde. Işık:
  rotundanın üstünde 2×2 m yumuşak kutu (3.800 K) + arkadan soğuk kenar ışığı (6.500 K, düşük) + oyun masası
  üstleri ve kiosk ekranı kendi ışığında. Kamera: hol zemininden 11 m, stant merkezinden 13 m geride, eğim −48°,
  18 mm (58,7°); stantın açık giriş cephesi kameraya dönük; stant genişliği dikey kadrajın ≤ %70'i. Kadraj ~19 m.
- (b) T23, d2→d3, 2,4 s: 0–1,2 s kamera D400 koridorunu izleyerek BGB'ye dalar, 650 → 120 m, eğim −12° → −35°,
  otoparkın üstünden (uzun gölgeli araçlar). 1,2–1,55 s hol çatısının üstünde eğim −70°, güneşi alan çatı
  ışıklığı bandına iner. **Kesme**: kare 46–49 (≈1,53–1,63 s) ışıklık parlaması kadrajı doldurur (tepe ~%95,
  `#FFF1DC`); dış sahneden iç sahneye geçiş bu karelerde. 1,6–2,4 s makasların altından çıkış, 14 → 11 m iniş,
  25° yana dönüş, patlatılmış stant görünür. Kadraj ~2,3 km → ~19 m.
- (c) L3, 4 s: her parça ±1,5 cm yükselip alçalır, faz parça sırasına göre kaydırılmış (sin, P = 4 s).
- (d) Üst band (hol tavanı koyu). Başlık "12.000 Yıllık Emanet" (`stant.tema`), İngilizce "A 12,000-Year Trust";
  gövde `stant.girisMetni[1]` (ONAY'lı öneri metni) ve altında küçük "#YaniBanaEmanet". Dört bölge etiketi
  parçalara ≤ 40 px kılavuz çizgiyle bağlı, numarasız: "Emanet Rotundası", "Oyna – Sen olsan ne yapardın?",
  "Söz Kiosku", "Amfi". v2 spot döngüsü (3,5 s): etkin bölgenin `kisa` satırı alt bantta; etkin olmayan etiketler
  %60 opak (metin rengi değişmez). Scrim: üstten `#16181B`, metin satırlarında α ≥ 0,65.
- (e) "Karanlık fuar holünde tek ışığın altında standımız, parçalarına ayrılmış hâlde havada: ortada yeşil
  kanopili rotunda ve 12 sütun, sağda amfi, önde karşılama bankosu, yanlarda turuncu 'Gel, oyna!' pankartları."
  Reduced: P3 + dört etiket + dört `kisa` satırı alt alta.

**d4 — Buradasın / Bugün**
- (a) P4: monte edilmiş rotundanın içi. Kamera zemin halkası merkezinin 2,4 m üstünde, girişe doğru 0,25 m
  kaçık (yazı düz okunsun), eğim −78°, 18 mm (58,7°; dikey 90°). Zemin halkası (dış Ø ~2,04 m, V) y %35–70'te;
  ortada "Buradasın" küçük, "Bugün" büyük serif ve altın ▲ (render dokusu, fiziksel baskı). 12 sütun geniş açıyla
  kadraj kenarlarına doğru ışınsal; yüzleri (numara, ad, il, dönem çipi) kenarlarda okunur. Üst %15'te kavisli
  kanopi bandı. Işık: halkada sıcak havuz (3.200 K), kanopi altı LED sütunları sıyırır, sütunların ardı karanlık.
  Kadraj ~2,7 m.
- (b) T34, d3→d4, 2,0 s: **montaj** (0–1,5 s) ve kamera inişi (0–2,0 s) birlikte. 0–0,5 s duvarlar iner ve yerine
  kayar; 0,2–1,0 s sütunlar 1→12 sırayla 60 ms arayla yerine oturur, dönüşleri sıfırlanır; 0,6–1,3 s amfi, banko,
  pankartlar; 0,9–1,5 s kanopi iner. Her oturma %2 aşma + 120 ms yerleşme (mıknatıs gibi, sekme yok). Kamera
  vinç konumundan girişin önünden kavis çizerek rotundaya girer, ~1,3 s'de kanopi kenarının altından geçer (bant
  yazısı üstten akar), 2,4 m'de durur; eğim kamera yolundan 0,15 s geride gelir. Parçalar yerine oturdukça
  stantın kendi ışıkları yanar; yumuşak kutu 1,6 s'de rotunda tepe ışığına devreder. Kadraj ~19 → ~2,7 m.
- (c) L4, 4 s: "Bugün" üstündeki tepe ışığı ±%6 nefes alır (sin, P = 4 s). Sütun bilgisi DOM'da (aşağıda).
- (d) Alt band, krem scrim `#F7E6CD`, metin satırlarında α ≥ 0,70 (0,66 siyah pikselde bile 4,5:1 **(Ö)**). Başlık
  `stant.slogan` "İklim, doğa ve sıfır atık bize miras."; İngilizce "Climate, nature and zero waste are our
  heritage."; etkin sütun satırı (4,5 s'de bir, v2 kuralları): "01 Belgrad Ormanı, İstanbul. Doğal miras." + `emanet`
  cümlesi. Etkin sütunun yüzünden alt banda 1 px `#28332F` kılavuz çizgi (sütun konumları P4'ten dışa aktarılır).
- (e) "Rotundanın içinden yere bakış: renkli dönem halkasının ortasında 'Buradasın, Bugün' yazıyor; çevrede 12
  miras sütunu, üstte yeşil kanopi." Reduced: P4 + 12 satırlık liste (v2).

**d5 — Broşür kapağı**
- (a) P5 "banko plakası": karşılama bankosunun meşe üstü tepeden, broşür YOK (DOM broşür bunun üstüne oturur),
  yığının kenarı ve hafif vinyet, ışık sol üstten; f/2 alan derinliği (kenarlar yumuşak).
- (b) T45, d4→d5, 2,0 s: kamera 2,4 m'den 1,5 m göz yüksekliğine kalkar, girişe döner (−100°), banko yönündeki
  sütun aralığından 5 m süzülür, bankonun üstünde eğim −90°'ye iner ve broşür yığınının 0,58 m üstünde durur
  (85 mm, 13,6°). Son karede üstteki broşürün kapağı **broşür dikdörtgeni**ne oturur: video uzayında yatay ortalı,
  genişlik 504 px (%70), yükseklik 1.057 px (oran 0,477), y %5–87,5; dönüklük ≤ 0,3°. Kapak dokusu DOM
  `cover.tsx`'in ekran görüntüsü (aynı tasarım). **Eşleşme**: son video karesi → [P5 + aynı dikdörtgende DOM kapak]
  200 ms çapraz sönme; sonra DOM kapak FLIP ile okuma boyutuna 420 ms (easeOutCubic). Kapağın altındaki AK Parti
  logosu ~1,8 s'de (d ≈ 4,9) görünür, v2 ile aynı.
- (c) DOM: v2 yörünge yayları (60 s/tur).
- (d) Alt band %12: "Standdan alabileceğin broşür" / "The brochure you can pick up at our stand"; sayılar
  cümleyle: "1.000.000'u aşkın genç üye, 81 il, 922 ilçe." Okuma: "sayfa 1/12".
- (e) "Karşılama bankosunda duran broşür: 'COP31'de AK Gençlik' kapağı, yaprakların arasında Dünya fotoğrafı ve
  lacivert dairede 'Gezegenimiz Ortak Evimizdir'." Reduced: P5 + DOM kapak.

**d6–d8 — Sayfalar ve arka kapak (DOM, v2'den)**
- (a) P5 plakası sabit; broşür DOM'da, gölgesi render ışığına uyar: `+6 px, +10 px, 24 px, rgba(40,30,20,.28)`.
- (b) Sayfa çevirme 1,6 s (sırt çizgisi etrafında `scaleX` katlama + gölge gradyanı; `preserve-3d` yok).
- (c) v2 polaroid sarkacı (d6, d7); d8 hareketsiz.
- (d) Metin broşürün içinde (v2 içerikleri: `bulusmalar`, `solenler`, `facts`, `iklim`, `backCover`,
  `baskanMesaji`; portre p22, p06 yok). Okuma "sayfa 8/12", "11/12", "12/12".
- (e) Her sayfa için v2 alt metinleri. Reduced: sayfalar alt alta.

**d9 — Ortak evimiz**
- (a) P1 (aynı Dünya).
- (b) d8→d9: DOM arka kapak, küre fotoğrafı dairesinin merkezine doğru 0,6 s büyür (dalış); daire T01'in ilk
  karesindeki disk boyutuna ulaşınca fotoğraf → video karesi 200 ms çapraz sönme; ardından **T01 aynen** oynar,
  lombarın "kâğıdı" bu kez arka kapağın kendisidir. Yeni render yok.
- (c) L1.
- (d) Üst band: Great Vibes "Gezegenimiz Ortak Evimizdir" (≥ 44 px, beyaz), altında Lora italik "Our planet is
  our common home". Okuma: "ortak evimiz".
- (e) d1 alt metni + "Üstünde el yazısıyla: Gezegenimiz Ortak Evimizdir." Reduced: P1 + slogan.

**Kapanış** (snap'siz akış, beyaz): v2 `IcindenKapanis` + yeni atıf satırları (§7.4). Kapanış görünür olunca
tüm videolar durur ve bellekten bırakılır.

### 2.4 Adımlama ve oynatma (DOM ekibi için davranış sözleşmesi)

- Durum: `DURAK(k)` → ileri jest → `GECIS(k→k+1, t)` → klip bitince `DURAK(k+1)`. Geçiş sürerken aynı yöndeki
  jestler yok sayılır; ters jest, geri klibe **D − t** anından geçer (geri klip ileri klibin tersi olduğu için
  kare aynıdır) ve `DURAK(k)`'ya döner. `adim.ts`'in adım süresi = klip süresi; belge kaydırması görünmez çapa.
- Geri klipler `playbackRate = 1,25` ile oynar (geri dönüş daha çabuk).
- Kiosk `?auto=1`: v2 mantığı; durak dinlenmesi 5 s, d3'te 600 + 3 × 3.500 ms, d4'te 600 + 3 × 4.500 ms; tur
  ≈ 85 s **(hesap: d0 5 s + 5 klip 11,2 s + 3 sayfa çevirme 4,8 s + T01 tekrarı 2,4 s + dinlenmeler 60,2 s + 0,6 s perde)**;
  sonda 600 ms beyaza sönme.

## 3. Ölçek merdiveni ve gerçekçilik kaynakları

### 3.1 Merdiven (iki klipte 15.500 km → 11 m)

| Nokta | Zaman | Kamera | Kadraj (odakta) | Görünen | Yüzey kaynağı → devreden |
|---|---|---|---|---|---|
| d1 | T12 0 s | 15.500 km, nadir (Dünya merkezi) | ~12.100 km | tüm disk, terminatör | Blue Marble NG Kasım (~2 km/px) + Black Marble (500 m) + bulut |
| | T12 0,9 s | 1.200 km, nadir | ~700 km | Doğu Akdeniz, Anadolu, Kıbrıs | BMNG C1 karosu 463 m/px (20–50° D, 25–45° K kırpımı) |
| | T12 1,4 s | 120 km, eğim −62° | ~70 km | Antalya Körfezi, Beydağları, Toroslar | Sentinel-2 L2A 10 m (20 m'ye indirilmiş dış halka) + GLO-30 |
| | T12 1,85 s | ~3,5 km, eğim −28° | ~3 km | bulut perdesi (kesme) | — |
| d2 | T12 2,4 s | 650 m, eğim −12° | ~2,3 km | Expo, D400, seralar, kent, körfez | Ön plan: **OSM 3B** (bina, sera, yol, otopark) + örneklenmiş ağaç/araç; S2 yalnız düşük frekanslı zemin rengi; uzak plan GLO-30 + S2 |
| | T23 1,2 s | 120 m, eğim −35° | ~250 m | otopark, hol çatısı | OSM ayak izi + elle hol çatısı (ışıklıklar V) |
| | T23 1,6 s | çatı ışıklığı | — | parlama (kesme) | — |
| d3 | T23 2,4 s | holde 11 m | ~19 m | patlatılmış stant | elle model (plan: `docs/stant-icerik.md` §5) |
| d4 | T34 2,0 s | 2,4 m | ~2,7 m | zemin halkası, sütunlar | elle model + dokular |
| d5 | T45 2,0 s | 0,58 m | ~14 cm | broşür kapağı | kapak dokusu → DOM |

T12, 15.500 km'den 650 m'ye ln oranı 10,1'lik bir inişi 2,4 s'ye sığdırıyor (en sıkışık klip). Hareket
bulanıklığı ve bulut perdesi bunu taşıyacak; gerçek cihazda baş dönmesi/okunmazlık görülürse çözüm §8'de.

### 3.2 Sentinel-2 nerede yetmez

S2 RGB 10 m. P2'de ön plan 0,6–1,3 km uzakta, orada ekran pikseli ~1,5 m'ye denk geliyor **(hesap: 650 m
irtifa, 45,7° hFOV, 720 px)**: S2 6–7 kat kaba. Kural: kadraj genişliği 7 km'nin altına inince (≈ 10 m/px)
yer geometrisi OSM'ye geçer; S2 yalnızca renk tabanı olur, üstüne arazi örtüsüne göre prosedürel ayrıntı
(S2 B8/B4'ten NDVI > 0,45 → ağaç örnekleme; OSM `landuse=orchard|farmland`, `building=greenhouse`). Seralar
(Aksu ovası; `expo-harita.md` §4'te ±700 m'de 159 sera elendi) yarı saydam plastik malzemeyle karşı ışıkta
parlar: bölgenin en gerçek ayrıntısı. GLO-30 (30 m) uzak dağlar için yeter; ova zaten düz.

### 3.3 Veri kaynakları (hepsi serbest; atıf §7.4)

| Veri | Kaynak | Ayrıntı | Lisans |
|---|---|---|---|
| Gündüz Dünya | NASA Visible Earth, Blue Marble Next Generation, **Kasım** (topo+bati) | küresel 21.600×10.800 + C1 karosu 21.600² (kırpılarak) | Kamu malı |
| Gece ışıkları | NASA Earth Observatory, Black Marble 2016 | 500 m karolar (C1) | Kamu malı |
| Bulut | NASA Visible Earth "Blue Marble: Clouds" | 8.192 px | Kamu malı |
| Arazi | Copernicus DEM GLO-30, karolar N36E030, N36E031, N37E030, N37E031 (AWS `copernicus-dem-30m`) | 30 m | Serbest, atıf zorunlu (metni indirme sayfasından birebir alın) |
| Uydu görüntüsü | Copernicus Sentinel-2 L2A, Copernicus Data Space; bulutsuz bir **Kasım 2025** sahnesi (mevsim uyumu); MGRS 36STF + 36SUF (+ kuzey 36STG/36SUG) **(hesap, tarayıcıda doğrula)** | 10 m | Serbest, "Contains modified Copernicus Sentinel data 2025" |
| Vektör | OpenStreetMap (Overpass, User-Agent zorunlu): building, landuse, highway, amenity=parking, aeroway, waterway, natural | — | ODbL, atıf |
| Model/doku | Poly Haven (ahşap zemin, halı, kumaş, saksı bitkileri), Kenney Car Kit / Quaternius (uzak araç, ağaç) | — | CC0 |
| Yazı dokuları | Lora, Montserrat (sütun yüzleri, halka, kanopi bandı) | — | OFL |

Araçlar: Blender ≥ 4.4 (RTX 50/Blackwell için; Cycles + OptiX), Sun Position eklentisi (tarih/konumdan güneş),
BlenderGIS (GitHub domlysz/BlenderGIS, GPL; **yalnız** yerel GeoTIFF ve OSM içe aktarma; Google/ESRI/Bing
altlık servisleri KAPALI). blosm kullanılırsa Google 3D Tiles özelliği YASAK. GeoTIFF işleme: Python 3.14
için rasterio/GDAL tekerleği yoksa Blender'ın kendi Python'u (pip) ya da QGIS (winget `OSGeo.QGIS`).

### 3.4 Stantın 3B'si

Ölçüler `docs/stant-icerik.md` §5 plan yüzdelerinden, **15,0 m genişlik varsayımıyla (V)** metreye çevrilir
(en/boy 1,522 → 15,0 × 9,9 m; rotunda kanopisi Ø ~4,5 m, PDF s.5'teki insan ölçeğiyle tutarlı). AREA SIZE ONAY.

| Öğe | Model ve malzeme (PDF render'ları s.1–7) |
|---|---|
| Çevre duvarları | ~4,0 m (V; render'da insan boyunun ~2,2 katı). Dış yüz **beyaz** mat boya (albedo 0,85), iç yüzler beyaz; krem `#F7E6CD` yalnız büyük pankart zemininde (render bunu gösteriyor, "krem duvar" değil). |
| Zemin | açık meşe laminat (Poly Haven CC0), oyun alanı şeridi koyu ahşap |
| Dikey çıtalar | meşe `#B49168`, pürüzlülük 0,6, giriş iki yanında |
| Rotunda kanopisi | ~16 kenarlı halka, bant yüksekliği 0,6 m, alt kenar 2,8 m (V); koyu yeşil `#28332F`, krem yazı "12.000 Yıllık Emanet – A 12,000-Year Trust" |
| 12 sütun | ince dikey beyaz levhalar, r ≈ 1,9 m çemberde eşit aralıklı (V); yüz dokusu `emanet.ts`'ten üretilir (numara, ad, il, bordo dönem çipi) |
| Zemin halkası | `donemler` renkli 11 dilim + iç krem disk "Buradasın" / "Bugün" + altın ▲ |
| Söz kiosku | koyu yeşil totem; ekranda yalnız "Sen de söz ver." (sitede sayı yok kuralı) |
| Amfi | iki sıra kavisli meşe bank, gri-yeşil minder; koyu yeşil konuşmacı sandalyeleri; ekran duvarı |
| Oyun alanı | üstü ışıklı iki masa, 4'er sandalye, 3 puf |
| Pankartlar | turuncu `#DF9560` dikey: "Gel, oyna! Come and play!", "Sıfır Atık Yöneticileri – COP31'e Giden Yol – DengeCOP31"; "Play – What would you do?" bandı |
| Karşılama bankosu | meşe çıtalı gövde, beyaz üst, AK Gençlik logosu plakası, ~40 broşürlük yığın (12 mm) |
| Bitkiler | ahşap saksılarda yapraklı bitkiler (Poly Haven) |
| Hol | makaslar siyah, lineer armatürler, koyu gri halı; komşu stantlar grafiksiz hacimler |

Görünüm açıları: d3 vinç 3/4 ön (11 m, −48°), T34 girişten rotundaya kavis, d4 rotunda içi neredeyse tepeden,
T45 göz hizasında bankoya süzülüş, P5 banko tepeden. Sütun yüzleri ve halka dokusu kod verisinden üretildiği için
ONAY değişikliğinde yalnız T34, L4, P4 yeniden render edilir.

## 4. Biçimler: mobil dikey ana, masaüstü ve kiosk

| Seçenek | Maliyet | Kalite | Karar |
|---|---|---|---|
| A. Ayrı 16:9 render | 2× render + her çekim için ikinci kamera kurgusu | En iyi | Hayır (zaman) |
| B. Dikey video ortada, iki yanda bulanık kopya | ~0 | Telefon ekranı masaüstünde: ucuz görünür | Hayır |
| **C. Kare master 1.920², iki kırpım** | render 1,78× (3,69 / 2,07 MP), kurgu tek | Dikey ve yatay ikisi de gerçek kadraj | **Öneri** |
| D. Yalnız dikey 1.080×1.920 + masaüstünde dikey pencere ve yan panel | 1× | Orta | C'nin yedeği (render süresi yetmezse) |

C'nin kuralı: özne master'ın ortadaki karesinde; dikey kırpım (1.080×1.920) üst/alt bantları metne bırakır,
yatay kırpım (1.920×1.080) ortadaki bandı alır ve sağ %38'i sakin tutulur (uzay, gök, hol tavanı, zemin).
Teslim: dikey 720×1.280 (telefon), yatay 1.280×720 (masaüstü), yatay ya da dikey 1.920/1.080 tam çözünürlük
(kiosk, yerel önyükleme). Kiosk ekranının yönü ve çözünürlüğü **ONAY**; C iki yönü de karşılar.
Masaüstü düzeni (vw/H ≥ 4:3): yatay kırpım `cover`; metin sağda ≤ %38 genişlikte, sağdan sola scrim.
3:4 ile 4:3 arası (tablet dikey): dikey teslim `cover` (üst/alttan ≤ %12,5 kırpılır).

## 5. Tipografi ve renk (video üstü)

| Rol | Yazı | Mobil (390 px) | Masaüstü | Not |
|---|---|---|---|---|
| Durak başlığı | Lora 600 | 34/38 px (`clamp(30px, 8.8vw, 44px)`) | 52/56 | ≤ 2 satır, cümle düzeni, tek kelime vurgusu yok |
| İngilizce satır | Lora 400 italik | 16/22 | 18/26 | ONAY (v2 listesi) |
| Gövde | Montserrat 400 | 15/23, ≤ 38 karakter satır | 17/27 | ≤ 45 kelime |
| Sahne etiketi, doğa | Lora 500 italik | 14 | 16 | haritacılık kuralı: su ve dağ adları italik serif |
| Sahne etiketi, yapı | Montserrat 600 | 12 | 13 | halo: `paint-order: stroke`, 3 px, α 0,55 |
| Sütun numarası | Lora 700, lining + tabular | 15 | 17 | standdaki fiziksel numaralandırma |
| Slogan | Great Vibes | ≥ 44 | ≥ 64 | yalnız "Gezegenimiz Ortak Evimizdir" |
| Kadraj okuması | Montserrat 500, tabular | 12/16 | 13 | sağ üst, 16 px içeride, düz metin |

Serif başlık değişikliği: v2'de başlıklar Montserrat'tı; v3'te video duraklarında Lora (standın serif dili,
`stant-icerik.md` §4), broşür sayfalarında broşürün kendi kimliği (Montserrat, mavi/yeşil) aynen.

| Durak | Metin | İkincil | Scrim (gradyan, bandın dış kenarından) | Ölçülen en kötü durum **(Ö)** |
|---|---|---|---|---|
| d1, d9 (uzay) | `#FFFFFF` | `#C9D6E3` | `#070B14`, metin satırlarında α ≥ 0,68 | beyaz/gece 19,7:1; ikincil 13,3:1; saf beyaz piksel üstünde 4,5:1 için α: beyaz 0,56, ikincil 0,67 |
| d2 (altın saat) | `#FFFFFF` | `#F2E6D3` | `#0B1A2E`, α ≥ 0,66 | saf beyaz piksel üstünde α: beyaz 0,60, ikincil 0,66 |
| d3 (hol) | `#F7E6CD` | çizgi `#B49168` | `#16181B`, α ≥ 0,65 | krem/hol 14,5:1; ahşap/hol 6,1:1; saf beyaz pikselde krem için α 0,65 |
| d4, d5–d8 alt bant | `#28332F` (İngilizce satır da, italikle ayrılır) | — | `#F7E6CD`, α ≥ 0,70 | krem üstünde 10,7:1; siyah piksel üstünde α 0,66. `#555454` krem üstünde 6,2:1 ama en kötü durumda α 0,87 ister: bantta kullanılmaz |

Alfa değerleri gradyanın metin satırlarının bulunduğu yerdeki değeridir; gradyan bandın iç kenarında 0'a iner.
Kurallar: `backdrop-filter` yok, panel kartı yok (v2'nin %94 beyaz paneli kalkar). Scrim alfası her posterde,
metin kutusunun altındaki en parlak %5 pikselden bir PIL betiğiyle doğrulanır; döngülerde en parlak kare
kullanılır. Geçiş sırasında metin görünmediği için ölçüm yalnız poster ve döngü içindir. Turuncu `#F08322`
krem üstünde 2,15:1: metin rengi olarak kullanılmaz; yalnız broşürün kendi baskısında ve render'daki fiziksel
pankartlarda. Marka yeşili `#47B27A` beyaz üstünde 2,65:1 (onay-listesi §14 sorusu sürüyor).

**Kadraj okuması kalsın mı?** Kalsın, tek gösterge olarak: v2'de onaylı bilgi (ölçek), referanstaki ince
kadran yazılarının işlevli karşılığı. Klip boyunca Blender'dan dışa aktarılan `kadraj_m[kare]` ile akar
("kadraj ~12.100 km" → "~2,3 km" → "~19 m" → "~2,7 m" → "sayfa 1/12" … "ortak evimiz"). Koordinat, nişangâh,
tarama çizgisi yok.

## 6. Performans bütçesi

Kodlama: H.264 High 4.0, yuv420p, 30 fps, ses izi YOK (`-an`), `+faststart`, GOP 15 (ters geçişte hızlı arama),
x264 `veryslow`, `tune film`. Boyutlar **tahmindir**; ilk render'da `ffprobe` ile ölçülüp tablo güncellenir.
Kalite hedefi: master'a karşı VMAF ≥ 90 (ffmpeg'de libvmaf varsa).

| Varlık | Adet | Süre | Hedef | Tahmini boyut | **Ölçülen (D turu, dikey H.264 / HEVC / AV1)** |
|---|---|---|---|---|---|
| İleri geçiş t01, t12, t23, t34, t45, t56 | 6 | 1,8–2,8 s | CRF 23 / 25 / 30; **t23, t34: 26 / 27 / 32** (§11.2-2); t23 H.264 son 10 kare −4 (`zones`, §11.2-6) | 500–660 KB | t01 259/277/220 · t12 682/552/471 · **t23 1.377/1.234/1.281** · **t34 951/947/1.042** (AV1 CRF 34, §11.6-1) · t45 768/550/602 · t56 626/386/378 kB (C: t23 1.383/1.243/1.283, t34 AV1 1.172; B: t23 1.867/1.551/1.471, t34 1.468/1.278/1.397) |
| Geri geçiş r10…r65 | 6 | aynı | CRF 26 / 28 / 34 (C: B'deki +2 geri alındı) | 300–420 KB | 202/186/177 · 452/376/360 · 1.272/982/1.128 · 1.085/910/1.003 · 529/401/474 · 501/288/290 kB |
| Döngü l1–l5 | 5 | 4–5 s | CRF 23 / 25 / 30 (C: +2 geri alındı) | 300–450 KB | 524/426/410 · 347/293/369 · 324/260/**498** (l3 AV1 CRF 32, §11.6-1) · 170/108/211 · 180/72/151 kB (C: l1 462/427/411, l3 AV1 533) |
| Poster p1–p6 | 6 | — | WebP q80, 720×1.280 | 60–110 KB | 72 · 68 · **169** (p3 q68, §11.6-2) · 45 · 44 · 26 kB (yatay 56 · 61 · 176 · 38 · 46 · 28; p6 broşürsüz, yatay p3 kırpım 200); C: p3 q80 218 / 229 |
| Broşür fotoğrafları (v2) | ~6 | — | mevcut `public/photos` | ~0,9 MB | (ölçülmedi) |

**Ölçüm (C turu, 3 Kasım, kodlama ajanı K-C; ayrıntı, VMAF ve dikişler `docs/klip-oynatma.md` §5; MB = 10⁶ bayt).**
Kodlama §9.4 + §11.2'ye göre (yukarıdaki "High 4.0, GOP 15, veryslow" satırı geçersiz). Dikey set toplamı (video +
poster): **H.264 10,67 / HEVC 8,73 / AV1 9,71 MB ✓**; yatay H.264 10,26 / AV1 9,53 MB. VMAF (ort.) 85/85 dosyada ≥ 90 ✓:
ileri 94,0–99,8, döngü 93,4–97,2, geri 91,7–99,6. (B turu: dikey 10,55 / 8,49 / 9,50 MB; r32 H.264 VMAF 85,7.)

- **İlk yükleme ≤ 2,5 MB** (d1'e hazır olana dek): HTML+JS+CSS+yazı tipleri ~0,45 MB + T01 0,5 + P1 0,09 + L1 0,4
  + boşta T12 0,66 ≈ **2,1 MB**. Logo satır içi SVG. **Ölçülen (C):** 0,5 + t01 + p1 + l1 + t12 = H.264 1,98 / HEVC
  1,84 / AV1 1,67 MB ✓ (yatay H.264 1,77 / AV1 1,51).
- **Adım başına ≤ 1,5 MB**: k+1'e varınca indirilenler T(k+1→k+2) 0,62 + L(k+2) 0,42 + P(k+2) 0,09 + R(k+1→k)
  0,36 ≈ **1,49 MB**. Sığmazsa geri klip isteğe bağlı iner (ilk geri jestte 450 ms poster çapraz sönmesi).
  **§11.2-3 ile yeniden tanımlandı:** kritik yol (ileri + varış döngüsü + poster) ≤ 1,8 MB, pencere (+ geri) ≤ 2,5 MB.
  **Ölçülen (C, d1…d5 varışı, dikey):** kritik H.264 1,09 · **1,93** · 1,17 · 0,99 · 0,65; HEVC 0,91 · 1,72 · 1,10 ·
  0,67 · 0,41 ✓; AV1 0,91 · **2,03** · 1,43 · 0,80 · 0,40 MB. Pencere H.264 en çok 2,44 ✓, HEVC 2,10 ✓, AV1 1,08 · 2,40
  · **2,56** · 1,80 · 0,88. Yatay: kritik d2 H.264 **1,95** / AV1 **2,12**, pencere d3 AV1 **2,57**. d2 aşımı t23 (1,24–1,38
  MB; H.264'te zones +0,11) + l3 + p3 (0,22); ölçülmüş seçenekler `docs/klip-oynatma.md` §5. (B, eski adım tanımı:
  d2 H.264 2,72, d3 2,66.)
- **Toplam ≤ 15 MB**: mobil video+poster ≈ 6,7 MB + fotoğraflar + çatı ≈ **8,1 MB**. Masaüstü (1.280×720) ayrı
  set, benzer boyut; kullanıcı yalnız kendi setini indirir. **Ölçülen (C):** dikey video + poster H.264 10,67 /
  HEVC 8,73 / AV1 9,71 MB ✓ (+ broşür fotoğrafları ~0,9). Tam tur oturumu (0→10; set + 1,27 MB medya dışı, W-B2):
  AV1 dikey 10,98 / yatay 10,80 MB ✓ (≤ 12, §11.2-3); H.264 11,94, HEVC 10,00.
- **Önyükleme k±1**, öncelik: T(k→k+1) > P(k+1) > L(k+1) > R(k→k−1). Klipler `fetch` ile Blob'a alınır
  (iOS `preload`'ı yok sayar); bellekte en çok 8 Blob (~5 MB), en çok 4 `<video>` öğesi; pencere dışındakiler
  `removeAttribute('src')` + `load()` ile bırakılır.
- `<video muted playsinline disableRemotePlayback aria-hidden="true">`; altında her zaman poster `<img>`; video
  ancak ilk karesi `requestVideoFrameCallback` ile çizilince görünür (siyah kare yok).
- **Poster kipi** (video oynamazsa): `play()` reddedilirse (iOS Düşük Güç Modu), `navigator.connection.saveData`
  ya da `effectiveType` 2g/3g ise geçiş = poster k → poster k+1 çapraz sönmesi 900 ms + gelen posterde CSS
  "kamera itişi" (ölçek 1,00 → 1,06, easeOutCubic). İlk dokunmada (`touchend`, kullanıcı etkinleştirmesi) bir kez
  `play()` yeniden denenir. Gerçek iPhone'da doğrulanmalı (bu ortamda yapılamaz).
- Reduced-motion: hiç video indirilmez; serbest kaydırma, her bölüm kendi posteri + metni (yalnız posterler
  ~0,5 MB). Gizli sekmede döngüler durur.
- JS: cobe ve `derinlik.ts` motoru bu rotadan çıkar; rota payı hedefi ≤ 50 kB gz (onay-listesi §14 önerisi).

## 7. Üretim listesi

### 7.1 Blender ekibi: sahneler ve klipler

Sahne dosyaları (`D:\soft\cop31-varlik\blender\`): **S1 Dünya** (küre, gündüz/gece/bulut dokuları, atmosfer
kabuğu, güneş 9 Kasım 2026 17.00), **S2 Antalya** (GLO-30 yükseklik + S2 doku, 36–38° K / 30–32° D; su düzlemi:
S2'nin gerçek su rengi + dalga normali + güneş parıltısı; Nishita gökyüzü + aerosol sisi; kümülüs kümesi),
**S3 Expo yakın** (OSM ±3 km 3B: bina, sera, yol şeritleri, otopark araçları, ağaç örnekleme; elle hol çatısı ve
ışıklıklar), **S4 Hol + stant** (§3.4). Geçişler sahne sınırında bulut perdesi (S1/S2→S3) ve ışıklık parlaması
(S3→S4) ile yapılır.

| Ad | Tür | Sahne | Süre | Kare | Not |
|---|---|---|---|---|---|
| T01 | ileri | S1 | 1,8 s | 54 | ilk kare: disk = amblem dairesi; `dunyaR[]` dışa aktarılır |
| T12 | ileri | S1→S2→S3 | 2,4 s | 72 | bulut perdesi ~kare 55 |
| T23 | ileri | S3→S4 | 2,4 s | 72 | ışıklık kesmesi kare 46–49 |
| T34 | ileri | S4 | 2,0 s | 60 | montaj koreografisi §2.3 |
| T45 | ileri | S4 | 2,0 s | 60 | son kare: broşür dikdörtgeni (4 köşe dışa aktarılır) |
| R10…R54 | geri | — | aynı | aynı | ffmpeg `reverse`, master PNG'den |
| L1 | döngü | S1 | 4,0 s | 120 | bulut 4B gürültüsü, P = 4 s |
| L2 | döngü | S3 | 5,0 s | 150 | su normali, P = 5 s |
| L3 | döngü | S4 | 4,0 s | 120 | parça salınımı, P = 4 s |
| L4 | döngü | S4 | 4,0 s | 120 | ışık nefesi, P = 4 s |
| P1–P4 | poster | — | 1 kare | — | = ilgili döngünün 0. karesi |
| P5 | plaka | S4 | 1 kare | — | banko, broşürsüz, f/2 |

Toplam 828 kare (+ 4 poster) 1.920²'de. Süre tahmini (V): uzay 2–4 s/kare, arazi 10–25 s, iç mekân 8–15 s →
~3 saat; ilk karelerde ölçülür. 8 GB VRAM: küresel doku ≤ 16k, BMNG C1 ve S2 kırpılarak, uzak halka 20 m.

Dışa aktarım (`klipler.json`, Blender Python betiği, `world_to_camera_view`): her klip için `kare`, `fps`,
`kadraj_m[kare]`; T01 için `dunyaR[kare]` ve `amblemDaire {cx, cy, r}`; durak başına sahne etiketi çapaları
(dikey 720×1.280 ve yatay 1.280×720 video uzayında); P4 için 12 sütun çapası; T45 son karesi için broşür
dikdörtgeni.

Kodlama (örnek, dikey):
```
ffmpeg -framerate 30 -i T12/%04d.png -vf "crop=1080:1920:420:0,scale=720:1280:flags=lanczos,format=yuv420p" ^
  -c:v libx264 -preset veryslow -tune film -crf 23 -maxrate 3000k -bufsize 6000k -profile:v high -level:v 4.0 ^
  -g 15 -keyint_min 15 -sc_threshold 0 -an -movflags +faststart T12-d.mp4
```
Yatay: `crop=1920:1080:0:420,scale=1280:720`. Geri: aynı girişe `reverse,` öneki ve `-crf 26 -maxrate 1600k`.
Poster: master'ın son karesinden `-c:v libwebp -quality 78`. Teslim yolu `public/icinden/v/` ve
`public/icinden/p/`; master'lar depo dışında (`D:\soft\cop31-varlik\render\`).

### 7.2 DOM ekibi: bileşenler

| Bileşen | İş |
|---|---|
| `VideoSahne.tsx` ('use client') | sabit sahne (100lvh), video uzayı kabı (cover dönüşümü), video havuzu, poster katmanı, durum makinesi (§2.4), önyükleme, poster kipi, kiosk, cleanup (Next 16 Activity) |
| `adim.ts` | `/dunya`'dan kopyalanıp uyarlanır: adım süresi klipten, ters jestte D − t |
| `klipler.ts` | `klipler.json`'dan üretilen tipli manifest |
| `Lombar.tsx` | beyaz kâğıt + dairesel delik maskesi, yarıçap rVFC'den |
| `KadrajOkumasi.tsx` | `kadraj_m[kare]`'den metin (textContent, React state yok) |
| `SahneEtiketleri.tsx` | d1, d2, d3, d4 etiketleri ve kılavuz çizgiler, çapalar manifestten |
| `MetinBandi.tsx` | üst/alt bant, scrim, giriş/çıkış zamanı |
| `Brosur.tsx` (v2) | P5 plakası üstünde; T45 dikdörtgeninden FLIP; sayfa çevirme 1,6 s |
| `IcindenKapanis.tsx` (v2) | yeni atıf satırları |
| `icinden.mjs` (ölçüm) | adım başına ağ baytı (CDP Network), `getVideoPlaybackQuality` düşen kare, poster kipi (play reddi taklidi), reduced, yatay taşma |

### 7.3 v2'den kalan ve değişen

**Kalan:** anlatı sırası ve 10 durak + kapanış; içerik kaynakları (`content.ts`, `stant.ts`, `emanet.ts`,
`photos.ts`; p22, p06 yok); parti içeriği d < 5'te yok; kök katman değiştirilebilir (logo onayı gelmezse d0 =
broşürün küre dairesi, lombar aynen çalışır); AK Gençlik üst şeridi ve kapanış; İngilizce satırlar (ONAY);
"Salon · Stant" satırı ONAY'a kadar yok; `uppercase` yasağı; broşür sayfaları DOM, sayfa çevirme, polaroidler;
spot döngüsü kuralları (brief-dunya-2 §2); kiosk; reduced-motion'da her şey okunur; kadraj okuması; tsc/eslint/
shot.mjs kanıtı.

**Değişen:** scrub + yönlü yerleşme → kilitli adım, süre = klip; cobe + SVG harita + SVG plan → önceden render
klip ve poster; "lacivert uzay YOK" → uzay ve altın saat (müşteri isteği: gerçekçi, renkli); %94 beyaz panel →
scrim üstünde doğrudan metin; durak başlıkları Lora; d0→d1 çakışan sönme → sıralı sönme + lombar; d3 SVG plan
→ patlatılmış 3B stant; d4 kadran dönüşü → render sütunlar + DOM sütun etiketi; d4→d5 "Bugün" diski → slogan
dairesi eşleşmesi → banko üstündeki gerçek broşür → DOM FLIP; d9 cobe → T01 tekrarı; bölge numaraları (1–4)
kalkar; JS hedefi ≤ 130 kB → rota payı ≤ 50 kB + medya bütçesi (§6); `derinlik.ts` motoru emekli.

### 7.4 Atıf satırları (kapanış, ONAY)

- "Harita verisi © OpenStreetMap katkıda bulunanlar." (ODbL, zorunlu)
- "Contains modified Copernicus Sentinel data 2025." (zorunlu; yıl sahne yılı)
- Copernicus DEM GLO-30 atıf metni (zorunlu; indirme sayfasındaki metin birebir)
- "Dünya görüntüleri: NASA Visible Earth ve Earth Observatory (Blue Marble, Black Marble)." (kamu malı, nezaket)
- "COP31 Türkiye logosu etkinliğe atıf amacıyla kullanılmıştır." (v2)

### 7.5 Müşteriye yeni sorular (onay-listesi §14'e eklenecek)

1. Kiosk ekranı yatay mı dikey mi, çözünürlüğü ve ağ bağlantısı ne? (C seçeneği ikisini de karşılar.)
2. Logonun "lombar" hareketi (söner, yerinde gerçek Dünya, beyaz kâğıt açılır) kabul mü? COP31 organizasyonuna
   (brand@cop31.tr) bu tarifle bildirilsin mi?
3. Kapanıştaki NASA, Copernicus (Sentinel-2, DEM) ve OSM atıfları bu metinle uygun mu?
4. Site sessizdir (ses izi yok). Onay?
5. Stantın gerçek ölçüsü (PDF'te AREA SIZE boş) ve duvar yüksekliği? 15 × 9,9 m varsayıldı.
6. "Standın anatomisi" (parçalar havada, sonra birleşiyor) uygun mu?
7. Render'da insan yok; stant boş bir nesne olarak görünüyor. Uygun mu?
8. COP31 geçici holleri ve alan planı paylaşılabilir mi? OSM'de yalnız kalıcı ANFAS holü var; havadan görünüm
   şimdilik temsilî.
9. Broşürün basılı ölçüsü (render oranı 0,477; DL 99×210 mm olabilir) ve bankoda yığın mı, standda mı duruyor?
10. 12 sütundan 10'unun içeriği onay bekliyor; render'a ad ve il yazılsın mı, yalnız numara mı? (Değişirse yalnız
    T34/L4/P4 yeniden render.)

## 8. Riskler (orkestratöre)

- **Blender kurulu değil** (bu oturumdaki denetimde `C:\Program Files\Blender Foundation` yok). RTX 5060 için
  ≥ 4.4 şart; sürücü 610.88 **(Ö)**.
- **T12 sıkışık**: 2,4 s'de ln oranı 10,1. Cihazda okunmazsa iki çözüm: (a) T12'yi 2,4 s'de tutup bulut perdesini
  erkene alarak son 0,8 s'yi yavaşlatmak, (b) "Akdeniz" adlı metinsiz ara durak (sıra korunur, durak sayısı 11
  olur; orkestratör kararı).
- **Konum temsilî**: salon/stant no, hol yüksekliği, çatı ışıklıkları ve geçici holler bilinmiyor; render bunları
  kesin bilgi gibi göstermemeli (etiket yok, pin yok).
- **iOS Düşük Güç Modu**: video oynamayabilir; poster kipi tasarlandı, gerçek cihazda sınanmalı.
- **GIS araç zinciri**: Python 3.14 tekerlekleri eksik olabilir (yedek: Blender Python ya da QGIS).
- Boyut ve render süreleri tahmin; ilk klipte ölçülüp §6 güncellenecek.

## Öz-eleştiri (klişe denetimi)

Taslağı `frontend-design` ölçütleriyle ve "üretilmiş site" kalıplarına karşı denetledim.

| Seçim | Klişe riski | Karar |
|---|---|---|
| Krem + serif başlık + turuncu (stant paleti) | "Krem zemin, yüksek kontrastlı serif, kil turuncusu" kalıbı | **Gerekçeli, daraltıldı.** Renkler standın fiziksel malzemesi (PDF'ten ölçüldü). v2'nin düz krem sayfa zemini kaldırıldı; krem yalnız render içinde ışık alan malzeme ve d4 scrim'i. Turuncu hiçbir arayüz öğesinde yok. |
| Uzay ve hol karanlığı | "Koyu zemin + tek parlak vurgu" | **Gerekçeli.** Karanlık fiziksel (uzay, loş hol), arayüz rengi değil; vurgu rengi yok, metin beyaz/krem. DOM'da tonlu siyah yalnız scrim. |
| v2'nin %94 beyaz panelleri | Kart kiti | **Söküldü.** Metin doğrudan scrim üstünde; cam efekti ve gölgeli kart yok. |
| Bölge numaraları 1–4 | Sıra olmayan içerikte numaralı işaret | **Söküldü.** Bölgeler adla. Sütun numaraları 1–12 kaldı: standda fiziksel olarak yazılı ve kronolojik sıra. |
| Orta noktalı meta satırlar ("A · B · C") | Şablon dizgisi | **Söküldü.** "Aksu, Antalya. 9–20 Kasım 2026." gibi cümleler; "Buradasın / Bugün" iki satır (standdaki gibi). Bölge adı "Oyna – Sen olsan ne yapardın?" standın kendi bandı olduğu için tire kaldı. |
| Her durakta kayan metin girişi | Fade-and-slide | **Söküldü.** Yalnız opaklık, kameranın inişine bağlı. Tek koreografi kameranın hareketi. |
| Kadraj okuması | HUD/teknoloji süsü | **Gerekçeli, tekleştirildi.** Ölçek bilgisi taşıyor; koordinat, nişangâh, tarama çizgisi, mono yazı yok. |
| Uzaydan Dünya açılışı | İklim sitelerinin en genel görseli | **Gerekçeli.** Müşterinin kendi fikri (logo zaten küre) ve görüntü özgül: açılış gününün gerçek güneşi, terminatör doğu Türkiye'de. |
| Altın saat ve güneşe karşı çekim | "Sinematik" stok görüntü | **Gerekçeli, frenlendi.** Saat ve azimut hesaplı (17.00, 241°); kent tam bu doğrultuda. Anamorfik parlama yok, güneş metin bandının dışında. |
| Patlatılmış stant | Referansın kopyası gibi okunabilir | **Gerekçeli, ayrıştırıldı.** İçeriğe hizmet ediyor (dört bölge nesne olarak okunur; montaj rotundaya geçişin kendisi). Referansın siyah-altın kenar ışığı, dönen parçaları ve lüks tonu alınmadı. Müşteri onayına bağlandı (§7.5-6). |
| Lombar (iris) geçişi | Eski film "iris" klişesi | **Gerekçeli, sınırlandı.** Logo kuralından doğdu, yalnız iki kez (açılış ve dönüş) ve aynı daireyle kullanılıyor. |
| Sahne etiketlerinde iki yazı ailesi | Gereksiz tipografik çeşit | **Gerekçeli.** Haritacılık kuralı: doğal öğe italik serif, yapı sans. |

Aynadan son bakışta çıkarılan aksesuarlar: Antalya noktasındaki nabız (d1), yıldızlar, insan figürleri, araç
farlarının akışı (d2'de ikinci motif olurdu), d3'te dönen parçalar. Kalan risk: d2'de beş etiket + başlık +
gövde, alt bantta kalabalık okunabilir; ilk posterde ölçülüp gerekirse gövde cümlesi kaldırılmalı.

## 9. Orkestratör kararları (bağlayıcı; §0–8 ile çelişirse bu bölüm geçerli)

R1–R4 bulguları üzerine verilen kararlar. Gerekçeler kısa; ölçüm kaynağı parantezde.

### 9.1 Duraklar: 11 + kapanış (yeni numaralama)

R3'ün T12'si 2,4 s'de ln 10,1'lik iniş sığdırıyordu (R3 §8); R2 kürenin `s2-bolge` yamasıyla ~120 km'ye kadar
inebildiğini gösterdi. Karar: **"Akdeniz" ara durağı eklenir** (R3 §8-b). Numaralar kayar; aşağıdaki id'ler
kod, manifest ve dosya adlarında kullanılır (R3 kartlarındaki eski id parantezde).

| id | Durak | Kaynak | Gelen geçiş (ad, süre) | Döngü (ad, süre) | Metin |
|---|---|---|---|---|---|
| d0 | Açılış (logo) | DOM | — | — | R3 d0 |
| d1 | Dünya | S1 | **t01** 1,8 s video (+0,6 s DOM logo sönmesi, R3 d1-b) | **l1** 4 s | R3 d1 (üst) |
| d2 | Akdeniz (yeni) | S1 | **t12** 2,0 s: 15.500 km → ~1.500 km nadir | **l2** 4 s | **yalnız sahne etiketleri** (Lora italik: "Akdeniz", "Anadolu", "Kıbrıs"; Montserrat: "Antalya" + nokta) + kadraj okuması. Başlık/gövde yok: nefes durağı |
| d3 | Antalya Expo (R3 d2) | S1 | **t23** 2,8 s: ~1.500 km → 650 m; bulut perdesi ~%70'te | **l3** 5 s | R3 d2 (alt) |
| d4 | Stant anatomisi (R3 d3) | S1+S2 | **t34** 2,4 s = 72 kare: **S1 kare 0–47** (650 m → çatı ışıklığı; kare 44–47 parlama), **S2 kare 48–71** (parlamadan hole) | **l4** 4 s | R3 d3 (üst) |
| d5 | Buradasın / Bugün (R3 d4) | S2 | **t45** 2,0 s montaj | **l5** 4 s | R3 d4 (alt) |
| d6 | Broşür kapağı (R3 d5) | S2 plakası **p6** + DOM | **t56** 2,0 s bankoya süzülüş → DOM FLIP | DOM | R3 d5 |
| d7, d8, d9 | Sayfalar, arka kapak (R3 d6–d8) | DOM | DOM sayfa çevirme 1,6 s | DOM | R3 |
| d10 | Ortak evimiz (R3 d9) | p1 + t01 tekrarı | DOM 0,6 s + t01 | l1 | R3 d9 |
| — | Kapanış | DOM | — | — | atıflar §9.6 |

d2 kamera: ~1.500 km irtifa, nadire yakın, 24 mm (dikey hFOV 45,7° → kadraj ~1.260 km): Anadolu üstte, Kıbrıs
merkezin sağında, Girit solda, Nil deltası altta; güneş sağ-alttan (16.00 güneşi), terminatör kadraj dışında.
Geçiş süreleri toplamı (ileri): 1,8 + 2,0 + 2,8 + 2,4 + 2,0 + 2,0 = 13,0 s video.

### 9.2 Güneş: 9 Kasım 2026, **16.00 TSİ (13.00 UTC)**

R2: 17.00 güneşi uzak karede çarpıcı ama dalışın sonu (Antalya) karanlık ve düşük kontrastlı. 16.00'da Antalya'da
güneş yüksekliği ~19° (R3 verisinden doğrusal: 16.45 → 11,2°, 17.00 → 8,6°; S1 NOAA ile yeniden hesaplar),
altın saat sürüyor, terminatör d1 diskinin sağ üçte birinde (İran–Hazar) kalıyor. S1 d1 ve d3 posterlerini
16.00 ve 16.30 ile EEVEE'de kıyaslar; d3'te ön plan ortalama parlaklığı %18'in altına düşmüyorsa 16.00 kalır.

### 9.3 Render (S1 dış, S2 iç)

- **Master 1920×1920, 30 fps, PNG 16 bit** (R3 §4-C). Dikey teslim 1080×1920 merkez kırpım → 720×1280; yatay
  1920×1080 merkez kırpım → 1280×720. Anlamlı özne ortadaki 1080² karede; d1 diski yalnız dikey yönde taşabilir.
- **Son render: Cycles OptiX, 64 örnek + OIDN GPU, tüm emisyonlu malzemelerde `emission_sampling='NONE'`,
  motion blur açık (deklanşör 0,5), AgX + "AgX - Punchy", pozlama S1/S2 ölçerek (+0,3 EV başlangıç)**
  (R2 §10). Film > Transparent YOK; arka plan render'a gömülü. Önizleme turları EEVEE 960² TAA 16.
  Süre tahmini: ~1.050 kare × 5–7 s ≈ 1,5–2 sa (R2 §5 ölçümlerinden ×1,78 kare ölçeği). İç mekân karesi 12 s'yi
  aşarsa S2 32 örnek + OIDN'e iner; yine aşarsa EEVEE 1920² TAA 64.
- **GPU kilidi** (iki ajan paralel çalışır): Cycles son render ve 1920² EEVEE dizileri başlamadan önce
  `D:\soft\cop31-varlik\render\.gpu-kilit\` dizini `os.mkdir` ile (atomik) alınır, klip bitince silinir; alınamazsa
  5 s'de bir yeniden denenir; 30 dk'dan eski kilit (içindeki `sahip.txt` zamanı) ölü sayılıp silinebilir.
  Kısa EEVEE önizlemeleri kilitsiz.
- **S1 tek sahne** (tek betik/`.blend`): küre (BMNG **Kasım** 21600 + C1 Kasım yaması 463 m + `s2-bolge-kasim`
  25 m yaması + Black Marble + 8K bulut kabuğu + kabuk atmosfer `--turuncu hale` + batimetri düzleştirme) **ve**
  arazi (R1 `dem-genis-30m` + `dem-yakin-6m` sinh ızgara, `s2-genis-kasim` drape, dış halka `s2-bolge-kasim`,
  `deniz-maskesi-*` ile su shader'ı: Fresnel + dalga normali + güneş parıltısı) **ve** yakın alan
  (`osm/expo-3d.geojson` ±1 km bina/sera/yol/otopark/tramvay ekstrüzyonu; Expo salonu 14 m, çatı `#e0d4ba`,
  elle çatı ışıklık bantları; seralar yarı saydam; ağaç/araç örnekleme; `railway=proposed` yok). Küre → arazi
  devri sahne içinde: arazi ağı küre yüzeyine (Expo teğet düzlemi) oturur ya da görünürlük bulut perdesinde
  değişir; S1 devir karesini kendi ölçer (ardışık kare farkı komşu karelerden büyük olmamalı). Gök:
  `MULTIPLE_SCATTERING` + yükseklik-bilinçli pus (R2 §3). Koordinat: `expo-yerel-m`, Blender X = x, Y = −y, Z = h.
- **S2 tek sahne**: hol + stant (§3.4) + rotunda + banko. Sütun yüzü ve zemin halkası dokuları `emanet.ts` /
  `donemler`'den Playwright ile (statik HTML, dev sunucu gerekmez; `SutunYuzleri.tsx` kaynak alınabilir).
  Broşür kapağı dokusu `D:\soft\cop31-varlik\brosur\brosur-01.png`. Malzeme/dokular Poly Haven (CC0) ya da
  prosedürel; indirilen her dosya `D:\soft\cop31-varlik\s2\KAYNAK.md`'ye yazılır.
- **Klip dikişleri:** `l_k[0] ≡ t_(k−1→k)` son karesi `≡ p_k` (döngüler periyodik saat, R3 §2.1). t34'te S1'in
  kare 47'si ve S2'nin kare 48'i ortalama parlaklık ≥ %92, ton `#FFF1DC` (ikisi de parlamanın içinde). t01'in
  0. karesinde Dünya diski master uzayında merkez (960, 768), çap 345 px (= dikey video uzayında (360, 512), 230 px).
- **Geri klipler render edilmez** (ffmpeg `reverse`; oynatıcıda hız 1,25). Döngüler sabit kamera, düşük genlik.
- **Çıktı:** `D:\soft\cop31-varlik\render\<klip>\k_%04d.png` (0'dan) + `D:\soft\cop31-varlik\render\<klip>.json`:
  `{ad, fps, kare, sure, kadraj_m[kare], dunyaR[kare] (yalnız t01: master px yarıçap) + dunyaC (cx, cy),
  capalar{ad: [x, y]} (poster karesi, master px; etiketler ve d5'te 12 sütun), brosur_dikdortgen[4×[x,y]] (t56 son
  kare, master px), kamera{...}}`. Posterler = döngünün 0. karesi (`p1`–`p5`), `p6` = banko plakası (tek kare).
  Önizleme kontak sayfaları `D:\soft\cop31-varlik\render\_onizleme\*.jpg` (her klipten 6 kare + iki kırpım kutusu
  çizili). Betikler depoda `scripts/blender/s1/`, `scripts/blender/s2/` (yeniden üretilebilir, `--engine` ile iki
  motor); `.blend` ve kareler depo dışında.

### 9.4 Kodlama ve teslim (kodlama ajanı, render bitince)

- Kırpım + ölçek ffmpeg (lanczos). Dikey set: **H.264** High@3.1 CRF 23 ileri / 26 geri, **HEVC** x265 `hvc1`
  CRF 25 / 28, **AV1** SVT-AV1 preset 4 CRF 30 / 34, hepsi 8 bit yuv420p, GOP = klip uzunluğu, `-sc_threshold 0`,
  `+faststart`, `-an`. Yatay set: yalnız H.264 + AV1. Döngüler ileri CRF'le.
- Poster WebP q80 (iki kırpım) + satır içi LQIP (24 px, base64). Dosya adı `<klip>.<8 hex içerik özeti>.<kodek>.mp4`
  → `public/icinden/v/{d,y}/`, posterler `public/icinden/p/{d,y}/`. Manifest `src/components/icinden/klipler.json`
  (şema: W'nin `docs/klipler-sema.md`'si; çapalar iki video uzayına çevrilir: dikey `((x−420)/1,5, y/1,5)`, yatay
  `(x/1,5, (y−420)/1,5)`).
- Doğrulama: ffprobe kodek dizeleri (`avc1.64001f`, `hvc1.1.6.L93.B0`, `av01.0.05M.08`); her geçişin kodlanmış son
  karesi ↔ hedef posterin kodlanmış döngü 0. karesi ΔE00 ortalama ≤ 3; döngü dikişi (son→ilk) ardışık kare farkına
  eşit; boyut tablosu `docs/klip-oynatma.md` §5'e işlenir. Bütçe: ilk yükleme ≤ 2,5 MB, adım ≤ 1,5 MB, dikey set
  toplam ≤ 15 MB/kodek. Aşarsa önce döngü CRF, sonra geri klip CRF yükseltilir.

### 9.5 Site (W)

- Rota `/icinden` yeniden: kilitli adımlama (`src/components/dunya/adim.ts` kopyalanıp uyarlanır, `/dunya`'ya
  dokunulmaz; adım süresi = klip süresi; geçiş sürerken jest yok sayılır — **D − t ters geçiş YOK**, R4 §3.8);
  oynatıcı R4 §1 (blob kipi, 3 öğelik havuz, poster katmanı, öncelik kuyruğu, 300 ms → poster yedeği,
  `play()` reddinde touchend adımı + kilit açma, bütçe 30 MB, `visibilitychange`); DOM: lombar, metin bantları
  (scrim kuralları §5), sahne etiketleri (manifest çapaları), kadraj okuması, Broşür (v2) FLIP, kapanış + atıflar;
  kiosk `?auto=1` (R3 §2.4); reduced-motion = serbest kaydırma + posterler, video yok; `next.config` `headers()`
  ile `/icinden/v/:path*` ve `/icinden/p/:path*` immutable. Rota istemci JS ≤ 50 kB gz (cobe ve `derinlik.ts` bu
  rotadan çıkar; v2 dosyaları son temizlikte silinir).
- Ölçüm betiği: scratchpad `icinden.mjs` yeni motora uyarlanır (perf, kare, tuzak, stale, boyut, lazy, kiosk,
  reduced + adım başına ağ baytı, düşen kare, play reddi benzetimi, yatay taşma). Yeni kaydırma kodu önce `stale`
  ile sınanır (WebKit kuralı).

### 9.6 Atıflar (kapanış; onay-listesi §14'e)

R1 §3 metni birebir: Sentinel ("Contains modified Copernicus Sentinel data 2025"), Copernicus DEM uzun metni,
"NASA Earth Observatory (Blue Marble, Black Marble)", "GEBCO", OSM. NASA logosu/onay izlenimi YOK. Poly Haven
(CC0) atıf gerektirmez. Font OFL.

### 9.7 Müşteriye (onay-listesi §14'e eklenecek)

R3 §7.5'in 10 sorusu + "Akdeniz ara durağı" + "16.00 güneşi" + fuar alanı Wi-Fi/mobil hızı (R4: 1,6 Mbps'de site
poster kipine düşer).

## 10. Uygulama ve ölçüm (B turu W-B2; C turu W-C; D turu W-D, 3 Kasım 2026)

Girdi (C): Cycles 1920² son render (`render-son`; S1-C t23/t34a, S2-C t34b/l4/p6 yeniden), K-C'nin kodladığı set (§6
tablosu, `docs/klip-oynatma.md` §5; 97 dosya + kart, 47,5 MB) ve `src/components/icinden/klipler.json` (`kaynak:
"render"`, 03.12 UTC). Ölçüm: `next build` + `next start -p 3100`, headless Chrome (playwright-core), scratchpad
`c/w-c/icinden3.mjs` (senaryolar: perf, kare, gecis, tuzak, stale, boyut, lazy, kiosk, kioskTur, reduced, engel, yatay,
lombar, kapak, dalis, d3yatay, okuma) + `scripts/icinden/scrim-olc.mjs`; çıktılar `.qa/icinden3/c/` (B turu
`.qa/icinden3/b2/`). Blender/GPU boşta (nvidia-smi %0), CPU yükü perf başında %4–5. Parantez içi: B turu.

**D turu (W-D):** girdi S1-D2'nin yeni su maskesiyle (Katara, §11.6-6) yeniden render ettiği t01/l1/t12/l2/t23 ve K-D'nin
§11.6-1/2 bayraklarıyla kodladığı set (97 dosya + kart, 47,19 MB; manifestte yalnız dosya/bayt/lqip/oluşturma alanları
değişti, öteki alanlar C ile birebir). Aynı ölçüm zinciri scratchpad `d/w-d/` kopyasıyla (`icinden3.mjs`'e `katara`
senaryosu, `boyut`/`lazy`'ye konsol hatası alanı eklendi); çıktılar `.qa/icinden3/d/`. Kod değişikliği yok. GPU %0,
Blender yok; CPU yükü perf başında %14 / %6. Aşağıda **"C → D"** yazan sayılar D'de değişti; ötekiler D'de yeniden
ölçüldü ve C ile aynı çıktı.

### 10.1 Gerçek boyutlar ve bütçe

- **JS** (prerender HTML'deki betikler, gzip -9): `/icinden` toplam 205,0 kB; `/` ve `/dunya` ile ortak 187,1 kB;
  **rotaya özgü 17,8 kB ✓** (≤ 50; B 16,4 — fark F'nin motor düzeltmeleri). HTML 42,6 kB gz, RSC 22,0 kB gz (manifest
  burada, JS'te değil). D'de aynı (`js-boyut.json`).
- **Medya** (K-C → K-D): dikey set video + poster H.264 10,67 → 10,67 / HEVC 8,73 → 8,67 / AV1 9,71 → 9,49 MB ✓ (≤ 15);
  yatay H.264 10,26 → 10,24 / AV1 9,53 → 9,31 (B: 10,55 / 8,49 / 9,50; yatay 10,75 / 9,99).
- **Bütçe, §11.2-3 tanımı, §11.6-1 sınırlarıyla (C turu → D turu)** (manifest baytları, MB = 10⁶; W-D `butce.py` ile
  bağımsız hesap, K-D'nin `kodlama-dogrula.py` sonucuyla 75/75 değer birebir). d_j'de kritik = t(j→j+1) + l(j+1) +
  p(j+1), pencere = kritik + r(j→j−1); ilk yükleme = 0,5 + t01 + p1 + l1 + t12; oturum = set + 1,27. Hücrelerde D;
  değişenlerde parantez içi C:

  | Set | İlk ≤ 2,5 | Kritik d1 · d2 · d3 · d4 · d5 (≤ 1,8; **d2 ≤ 2,1**) | Pencere d1 · d2 · d3 · d4 · d5 (≤ 2,5; **AV1 d3 ≤ 2,6**) | Oturum (≤ 12, AV1) |
  |---|---|---|---|---|
  | dikey H.264 | 2,04 (1,98) ✓ | 1,10 (1,09) · **1,87** (1,93) · 1,17 · 0,99 · 0,65 ✓ | 1,30 · 2,32 (2,38) · 2,44 · 2,08 · 1,18 ✓ | 11,94 |
  | dikey HEVC | 1,83 (1,84) ✓ | 0,91 · 1,66 (1,72) · 1,10 · 0,67 · 0,41 ✓ | 1,10 (1,09) · 2,04 (2,10) · 2,08 · 1,58 · 0,81 ✓ | 9,94 (10,00) |
  | dikey AV1 | 1,67 ✓ | 0,91 · **1,95** (2,03) · 1,30 (1,43) · 0,80 · 0,40 ✓ | 1,08 · 2,31 (2,40) · 2,43 (**2,56**) · 1,80 · 0,88 ✓ | 10,76 (10,98) ✓ |
  | yatay H.264 | 1,79 (1,77) ✓ | 0,91 · **1,90** (1,95) · 1,15 · 0,98 · 0,69 ✓ | 1,09 · 2,33 (2,38) · 2,41 · 1,98 · 1,22 ✓ | 11,51 (11,53) |
  | yatay AV1 | 1,51 ✓ | 0,79 · **2,04** (2,12) · 1,25 (1,38) · 0,76 · 0,45 ✓ | 0,95 · 2,38 (2,46) · 2,43 (**2,57**) · 1,76 · 0,89 ✓ | 10,58 (10,80) ✓ |

  §11.6-1 sınırlarıyla 5/5 set ✓; pencere katı 2,5'le de ✓ (AV1 d3 istisnasına gerek kalmadı). Katı 1,8'le d2 hâlâ
  aşılıyor: H.264 1,87 / 1,90, AV1 1,95 / 2,04 (HEVC 1,66 ✓); d2 = t23 (1,23–1,38 MB) + l3 + p3 (0,17 / 0,18). C → D farkı
  t34 AV1 CRF 34 (−130 / −136 kB), l3 AV1 CRF 32 (−35 / −37), p3 q68 (−50 / −53) ve l1 H.264 (+62 / +19 kB, S1-D2'nin
  sabit tohumlu l1'i; K-D raporu).
- **4G ölçümü (C turu → D turu)** (4 Mbps / 50 ms, HTTP önbelleği kapalı, okur temposu 4 s/durak, d0'da 8 s boşta;
  dikey 390×844, yatay 1280×800; kodek `?kodek=` ile sabit). "Pencere" burada ölçülendir: d_j'ye geçiş + 4 s
  dinlenmede inen bayt. Hücrelerde D; farkı ≥ 0,02 MB / 0,05 s olanlarda parantez içi C:

  | Set | d1 hazır | İlk yükleme (d1 hazır) | İlk yükleme, tanım (t12 de inmiş) | 8 s boşta | Pencere d1 · d2 · d3 · d4 · d5 · d6 | Oturum 0→10 + kapanış |
  |---|---|---|---|---|---|---|
  | dikey H.264 | 3,47 s (3,33) | 1,58 (1,52) ✓ | 2,26 (2,20) ✓ (4,9 s) | 3,99 (3,93) | 1,65 (1,70) · 1,44 · 2,12 · 1,11 · 0,81 · 0,81 ✓ | 11,95 |
  | dikey AV1 | 3,15 s | 1,43 ✓ | 1,90 ✓ (4,2 s; C 4,1) | 3,55 | **1,89** (2,10) · 1,22 · 1,70 · 1,03 · 0,76 · 0,60 ✓ | **10,76 (10,98) ✓** |
  | yatay H.264 | 3,06 s | 1,38 (1,36) ✓ | 2,01 (1,99) ✓ (4,4 s) | 3,61 (3,59) | 1,67 (1,72) · 1,38 · 2,16 · 1,02 · 0,67 · 0,65 ✓ | 11,17 (11,19) |
  | yatay AV1 | 2,86 s | 1,29 ✓ | 1,73 ✓ (3,8 s) | 3,35 | **1,92** (2,15) · 1,10 · 1,80 · 1,04 · 0,59 · 0,43 ✓ | **10,24 (10,46) ✓** |

  İlk yükleme (dikey H.264, d1 hazır): font 0,30 · JS 0,19 · video 0,78 (t01 + l1; C 0,72 — l1 H.264 +62 kB) · poster
  0,14 (p1, p2) · görsel 0,09 · CSS + HTML 0,07 MB (B 1,38 MB: l1 o turda CRF +2 idi). Ölçülen pencere tanımdakinden
  farklıdır: oynatıcı iki durak ileri önyüklediği için d_j'nin kritik yolu çoğunlukla d_(j−1)'de iner, d_j'de inen p(j+2)
  + l(j+2) + t(j+2→j+3) + r(j→j−1)'dir (ör. d1: p3 169 (C 219) + l3 325 + t34 951 + r10 202 kB). En büyük ölçülen pencere
  D'de 1,89–2,16 MB ✓ (C 2,10–2,16; B 2,32 / 2,44 ✗): AV1 d1'de t34 + l3 + p3 küçüldüğü için −0,21 / −0,23 MB; d6'dan sonra
  ~0. Dört koşuda klipli 7 geçişin hepsi hazırdı (yedek 0).
- **Geri klip sırası (§11.2-3):** 4 koşu × 6 ters klip = **24/24** indirme yalnız dinlenmede başladı: faz `dur`, acil
  kuyruk 0, pencere kuyruğu 0, `bostaAcik`, varıştan 1,12–2,15 s sonra (C 1,12–2,60; ≥ 1 s ✓). İniş 4G'de r32 2,3–2,6 s,
  r43 2,1–2,3 s. Sıra (dikey H.264): d0'da t01 → l1 → t12 → l2 → t23; 0→1 geçişinde l3 → t34; d1 dinlenmesinde r10; 1→2'de
  l4 → t45; d2'de r21; … d6'da r65 (`boyut.json` → `sira`, `ters`; D'de aynı sıra).

### 10.2 Performans (prod, 4× CPU, 20 adım 0→10→0, iki koşu; C turu → D turu)

| Giriş | fps | uzun kare (> 50 ms) / 20 adım | en uzun | düşen kare | jest → ilk yeni kare |
|---|---|---|---|---|---|
| mobil dokunma 390×844, C | 59,8 / 59,8 | **0 / 1** (7→6 sayfa çevirme 50,1 ms) ✓ | 46,1 / 50,1 ms | **0 / 856** ×2 ✓ | klipli adım p50 33–49 ms; 0→1 650 ms, 9→10 850 ms, 6→5 650–667 ms (tasarımdaki DOM ön evresi 600 / 800 / 620 ms) |
| mobil dokunma 390×844, **D** | 59,8 / 59,8 | **1 / 0** (10→9, 55,4 ms) ✓ | 55,4 / 48,3 ms | **1 / 856** (3→4) · **1 / 856** (4→5) ✗; ek iki koşu 0 / 856 ×2 | p50 49 ms; 0→1 633–650, 9→10 833–850, 6→5 667 ms |
| masaüstü fare 1280×800, C | 59,9 / 59,9 | **0 / 0** ✓ | 39,4 / 38,4 ms | **0 / 856** ×2 ✓ | p50 49 ms |
| masaüstü fare 1280×800, **D** | 60,0 / 60,0 | **0 / 0** ✓ | 40,2 / 35,5 ms | **0 / 856** ×2 ✓ (ek iki koşu da 0) | p50 49 ms |

(B: mobil 2 uzun kare, en uzun 53,6 ms; masaüstü 0.) D'de mobilde iki ana koşunun her birinde 1 düşen kare var, farklı
geçişlerde (t34 AV1 3→4, t45 AV1 4→5; t45 C ile bayt bayt aynı); aynı koşullarda iki ek koşu (`perf-3`, `perf-4`; CPU
%13 / %5) mobilde 0 / 856 ×2, uzun kare 1 / 0 (5→6, 52,8 ms). Headless Chrome'da CPU kısıtı medya çözücüyü yavaşlatmaz;
tek düşen kare ölçüm gürültüsü düzeyinde, gerçek cihaz değil. Geçiş süreleri (ileri): 2,41 · 2,01 · 2,82 · 2,41 · 2,02 ·
2,41 (+0,62 DOM) · 1,60 ×3 · 2,62 s (D'de ±15 ms içinde aynı); geri 1,25×. **Kiosk tam tur 106,5 s** (C 106,55 → D
106,54 s; 1280×800, d0 → … → d10 → kapanış 9 s → beyaz → d0; yedek 0). B'deki 93,0 s kapanışsızdı; fark kapanışta 9 s
(A3-01) ve d4'te dört bölgenin hepsi (600 + 4 × 3,5 s, A1-07). Girdide tur durur (`girdiSonrasi.duraklat`).

### 10.3 Dikişler (ekran görüntüsünde ölçüldü)

- **Lombar** (t01 kare 0 diski ↔ DOM amblem dairesi; yarı yükseklik daire uydurma, 362–378 ışın): merkez sapması C →
  D 0,31 → 0,31 / 0,55 → 0,48 / 0,75 → 0,76 px, yarıçap +0,77 → +0,78 / +1,20 → +1,27 / +0,74 → +0,74 px — 390×844 /
  1280×800 / 844×390 ✓ (≤ 2 px). t01 D'de yeni su maskesiyle yeniden render edildi (S1-D2: disk geometrisi C ile aynı);
  farklar uydurma gürültüsü düzeyinde. Sıra kuralı karelerde: logo 0 opaklığa inmeden disk görünmüyor.
- **d6 kapak** (t56 son video karesi ↔ DOM kapak, `brosurDikdortgen`'in contain'i; kapağın iç %92'si): konum kayması
  −0,48 / 0,02 / −0,47 px ✓ (≤ 0,5). ΔE00 ortalama render tonunda 3,59 / 3,16 / 3,93 (medyan 2,15 / 2,11 / 2,19), gerçek
  renkte 4,75 / 4,31 / 5,09 (B ile aynı; §11.4'te kabul; t56 D'de değişmedi, sayılar D'de aynı). Kesişmede DOM kapak
  bu dikdörtgenden okuma boyutuna FLIP'le geçer: telefonda ×1,15 büyür, masaüstünde ×0,97, yatay telefonda ×0,70.
- **p6 broşürsüz** (S2-C): kapak dikdörtgeninde p6 ↔ son video karesi ΔE00 29,5, korelasyon ≤ 0,008 (render broşürü
  yok); d6–d9'da üç görünümde DOM broşür gizlenince altta yalnız boş banko var, 844×390'daki "ikinci kapak" **kalktı**.
  Dikdörtgen dışı fark (yığının taşan kâğıtları ve gölgesi; S2-C master 0,537 ✗ ≤ 0,05; kodlanmışta 2,13–2,24, 45 px payla
  1,08–1,19, K-C) 200 ms kesişmede söner.
- **d10 dönüş**: arka kapak küre dairesi dalış sonunda lombar dairesine DOM'da 0 px (üç görünüm).
- **Yatay d3** (kirpimY 200): 1280×800'de Beydağları, körfez, kent, Expo ve D400 kadrajda; beş etiket öğelerinin üstünde
  (Beydağları sırtta y 45, Antalya Körfezi suda, Antalya kıyıda, Expo Center holde, D400 yolda), metin bandıyla kesişme 0.
  844×390'da (cover kırpımı üstten/alttan 64 video px) körfez, kent ve Expo görünür; Beydağları'nın yalnız etekleri kalır,
  "Beydağları" (y −16) ve "D400" (y 404) etiketleri ekran dışında.
- **Scrim** (`scrim-olc.mjs`, render-son döngülerinin her 4. karesi, metin altındaki en parlak/koyu %5; yatay
  dönüşüm artık klip başına `kirpimY`): gereken en çok α uzay 0,17 → 0,16 (yeni l1; d1 1280×800) · altın 0,54 · hol 0,50
  · krem 0,62 (tek piksel en kötü 0,65) → `--a` 0,68 / 0,66 / 0,65 / 0,70 (d5 dikey krem 0,84, A1-11) ile **18 durak ×
  görünüm ✓** (C ve D). d3 scrim `#1A1714` (A1-13).
- **Kodlanmış klip dikişleri** (ΔE00 ort., K-C → K-D): t23 son → l3 0 2,21–2,97 → 2,20–2,95 ✓ (H.264'te `zones`), r32
  son → l2 0 1,48–1,83 → 1,47–1,84 ✓, t01 son → l1 0 0,91–1,53 → 0,92–1,19, kalkış l3 0 → t34 0 2,36–3,00 → 2,44–3,00
  (AV1 2,36 / 2,49 → 2,44 / 2,59; t34 AV1 CRF 34); r43 son → l3 0 2,88–3,60 (değişmedi; §11.6-5 kabul).

### 10.4 Değişenler

**D turu (W-D):** sitede kod değişikliği yok (tsc, eslint temiz; rota JS 17,8 kB aynı; manifest alanları C ile birebir).
Ölçüm betiği (scratchpad `d/w-d/icinden3.mjs`): `boyut` ve `lazy` JSON'larına konsol hatası alanı (§11.6-8), `katara`
senaryosu (d1, d2, d10; doğal ve döngü kare 0 + metin gizli) ve `katara-ekran.py` (K-D'nin master maskesi ekran pikseline).
Değişmeyen ölçümler D'de de aynı çıktı: tuzak, stale, engel (yoklama 337 ms, kilit 4607 ms'de, 53/59/83/71 kare), lazy,
reduced (video 0, 5 poster 0,45 → 0,40 MB — p3 q68), yatay taşma 0, d6 bandı %64, d3 yatay etiketler, okuma düzeni, d10
dönüşü 0 px; konsol hatası 0 (`errors` alanı olan 21 JSON'un hepsi boş).

**C turu (W-C):**

1. **`okumaDonusum` sadeleşti** (p6 broşürsüz): örtme payı, konum sıkıştırması, `data-brosur-ortada` ve `--bk-x0`
   kaldırıldı. Okuma yeri dikeyde ekranın ortası (üst 52, alt 148 px; B'deki 14 px kayma yok), yatayda sol %62'nin
   ortası; **d6 bandı yatayda sağda** (diğer duraklarla aynı, A1-09; `yatay` senaryosu: bant sol kenarı %64).
2. `scrim-olc.mjs`: yatay master dönüşümü klip başına `kirpimY` (K'nin kodlama listesinden; yoksa 420). B'deki sabit
   420 d3 yatayda yanlış satırları ölçerdi.
3. `MetinBandi`: kullanılmayan `stil` prop'u kaldırıldı; tema yorumunda altın scrim `#1A1714`.

**B turu (W-B2), özet:** d9→d10'da t01 öğesinin `poster` özniteliği kaldırıldı (lombar deliğinde p6 hayaleti);
d10'da broşür ön ısıtması (10→9 düşen kare 1 → 0); HEVC dizesi `hvc1.1.6.L93.90`; kenara 24 video px'ten yakın çapa o
yönde atlanır; ölçüm kancası `__icinden3.geometri()` / `kapakKes(t)`. B'deki "DOM broşür render kapağını örter"
düzeni C'de kalktı (yukarıda 1).

Değişmeyen ölçümler (C'de yeniden koşuldu): tuzak (geçişte jest tek adım, uçlar, hızlı ileri-geri 1,0,1,0,1,0 yedeksiz,
kapanış maxY sabit ve geri dönüşte video oynuyor, trackpad momentumu 1 adım, ters tekerlek yok sayılıyor) ✓; stale
(WebKit `scrollY` 0/1/2 kare gecikme) yol 1,2,3,4,3,4,5,4,3 ve durak sınırında ✓; engel (play() reddi) yoklama ilk
jestten önce (303 ms), kilit ilk dokunuşta açıldı, 0→1…3→4 video (53/59/83/71 kare), yedek 0 ✓; lazy: broşür görselleri
d4'e dek 0, d5'te 2, d6'da 4 ✓; reduced: video 0, 5 poster 0,45 MB, taşma 0 ✓; yatay taşma 0 (1280×800, 844×390) ✓;
konsol hatası 0 (22 ölçüm dosyası); tsc, eslint temiz.

### 10.5 Bilinen sınırlar (D turu sonrası)

- **Gerçek iOS/Android testi yok.** Düşük Güç Modu, Safari'nin `poster`/ilk kare davranışı, iOS ısıtması (A2-01), kap
  birimi yedeği (iOS 15, A2-10), 100svh ve bellek yalnız benzetimle ya da hiç sınanmadı.
- **Bütçe (§11.2-3 tanımı, §11.6-1 sınırları):** D'de hepsi tutuyor. Kritik yol d2 H.264 1,87 / 1,90, AV1 1,95 / 2,04 MB
  — d2 istisnasıyla (≤ 2,1) ✓, katı 1,8'in üstünde (HEVC 1,66 ✓). Pencere en çok 2,44 (dikey H.264 d3); AV1 d3 2,43 /
  2,43, katı 2,5'le de ✓. İlk yükleme en çok 2,04 (dikey H.264; l1 H.264 +62 kB). 4G'de 4 s okur temposunda ölçülen
  pencere ≤ 2,16 MB, bütün geçişler hazır; daha yavaş ağda ya da hızlı adımlamada 300 ms → poster yedeği devreye girer.
- **d3 temsilî** (onay-listesi §14.1): ön plan OSM ekstrüzyonu + örneklenmiş ağaç. 16:9'dan geniş yatay ekranlarda
  (844×390) Beydağları kırpılır, iki etiketi ekran dışında.
- **p6 dikdörtgen dışı** fark (S2-C ✗; §11.6-3 kabul): kesişmede yığın kenarı ve gölgesi 200 ms'de söner.
- p3 posteri q68'de (168,6 / 176,2 kB; §11.6-2; 150 kB hedefi yine tutmadı). r43 son → l3 0 dikişi 2,88–3,60 (§11.6-5).
  AV1'de t34 47↔48 0,47 / 0,41 /255 (C 0,98 / 0,99; kodlayıcı, master 0; §11.6-4).
- Yatay kırpımda d4 stantı ve d5 halkası sağ %38'e taşıyor (kabul, §11.4).

## 11. C turu kararları (orkestratör, 3 Kasım 2026 03.30; bağlayıcı — §9 ile çelişirse bu bölüm geçerli)

B turu çıktısı (§10, K raporu `klip-oynatma.md` §5) incelendi: d1, d2, d5 foto-gerçekçi; d3 ön plan temsilî (kabul,
onay-listesi §14.1); d4 ölçülü "maket" (kabul). Düzeltilecekler ve kabul edilenler aşağıda. C turunda GPU'yu yalnız
S1-C ve S2-C kullanır (kilit: `render\.gpu-kilit`, 10 sn yoklama, klipler arasında ≥ 20 sn boşluk — B'de S2 62 dk aç kaldı).

### 11.1 Render düzeltmeleri

**S1-C (t23 + t34a yeniden, ~20 dk GPU).**

1. **t23 bitişi / t34a başlangıcı durgun değil.** Master ardışık fark: t23 son kareler 19,5 → 11,5/255, t34 0→1
   21,4/255, l3 durağan 0,025/255; t23[83]↔l3[0] ΔE00 1,02. Önce teşhis: `kamera.py` durumunu (d, h, p, oy, lens),
   pozlamayı ve `ortam()` değerlerini t23'ün son 12 ve t34a'nın ilk 6 karesi için kare kare yazdır; hangi bileşenin
   hızı sıfıra inmiyor bul (şüpheliler: `wG*1.02` kıskacı, `h` penceresinin 0,93'te bitmesi, animasyonlu tohum,
   deklanşör 0,25 hareket bulanıklığı). Sonra: t23 son karesi = l3[0] durumu birebir (d3), son 6 karede hız → 0;
   t34a ilk 6 karede aynı. **t23'ün son 3 ve t34a'nın ilk 3 karesi l3 ile aynı sabit tohumla** (geri kalanı animasyonlu).
   Kabul: master t23[83]↔l3[0] ve l3[0]↔t34a[0] ΔE00 ≤ 0,3; t23 son 4 ardışık fark ≤ 1,5/255; t34a 0→1 ≤ 1,5/255.
2. **t23 parlaklık çukuru** (%31 → %11 → %81, kare 0 → 21–24 → 60): pozlama rampası `ss(irtifa, 150e3, 1000e3)` →
   **30–400 km** (ya da ölçüp daha iyisi); kabul: kare 0–60 ortalama luma hiçbir karede %20'nin altına inmez ve
   kare 10–40 arasında tek yönlü (±%3 pay). l2 ve t12 yeniden render EDİLMEZ (t23[0] = l2[0] pozlaması değişmemeli:
   l2 irtifası ~1.500 km, rampanın üstünde kalır — doğrula).
3. Parlama yeniden uygulanır (`parlama.py`; kare 47 tam #FFF1DC, S2 t34b k_0000 ile fark 0,0). `t23.json`, `t34a.json`
   güncel. `render-son\t34\` (K'nin sabit bağları) **silinmez** — K yeniden kurar. Kontak sayfaları ve
   `_onizleme/s1-olcum.json` yenilenir. Ham kareler `t34a\ham\` kalır.

**S2-C (t34b + l4 + p6, ~13 dk GPU).**

1. `bash scripts/blender/s2/son.sh t34b l4` — bal meşesi (koyu ton) ve `kapak-dom-komp.png` dokusu ile; l4 → t45
   banko ton atlaması gider. Kabul: t45[0]↔l4[0] en büyük mutlak fark ≤ 5/255 (banko üstü dâhil), l4[0]↔t34b[23]
   ΔE00 ≤ 0,05, t34b k_0000 tam #FFF1DC.
2. **p6 broşürsüz** (`--yigin 0`; §9.1 "banko, broşürsüz"): DOM broşür d6–d9'da plakanın üstünde serbestçe büyür,
   844×390'daki "ikinci kapak" ve (−5,6; −3,0) px'lik yığın kayması kalmaz. Kabul: p6 ↔ t56[71] broşür dikdörtgeni
   (606–1314 × 460–1460) DIŞINDA ΔE00 ≤ 0,05. `p6.json` güncel (`yigin: 0` notu).
3. Kontak sayfaları, `s2-olcum.json` yenilenir. Diğer S2 klipleri (t45, l5, t56) değişmez.

### 11.2 Kodlama (K-C; GPU yok, render'lar bitince)

1. **t34 yeniden birleştirme:** `render-son\t34\` silinir, sabit bağlar yeniden (t34a 0–47 + t34b k_0000–0023 → 48–71),
   `t34.json` yenilenir, kare 47↔48 fark 0,0 doğrulanır.
2. **CRF politikası (B'deki döngü/geri +2 geri alınır):** döngü taban 23/25/30, geri taban 26/28/34, ileri taban
   23/25/30; **yalnız t23 ve t34 ileri: H.264 26 / HEVC 27 / AV1 32** (720p'de ~4 Mbps yeter; d3 içeriği zaten
   temsilî). Hedef VMAF ortalaması her dosyada ≥ 90 (t23/t34 ≥ 93 beklenir).
3. **Bütçe yeniden tanımı (§6 ve §9.4'ün adım maddesi yerine):** kritik yol (ileri + varış döngüsü + poster) ≤ 1,8
   MB/adım; pencere toplamı (geri klip dâhil) ≤ 2,5 MB; ilk yükleme ≤ 2,5 MB; set ≤ 15 MB/kodek; tam tur oturumu
   (0→10, AV1) ≤ 12 MB. Geri klip kuyrukta en sonda ve yalnız boşta iner (W-C doğrular).
4. **p3 posteri:** q80 → q80'e göre ΔE00 ortalaması ≤ 1,0 kalan en düşük WebP kalitesi (q68–76 dene), hedef ≤ 150 kB
   dikey; diğer posterler q80 kalır.
5. **Yatay kırpım d3 (ufuk kadraja girsin):** yatay kırpımın y ofseti klip başına: t23'te 420 → **200** (kare 24–72
   arası easeInOutCubic; ffmpeg `crop` y ifadesinde `n`), l3 / p3 / t34 kare 0–47 → 200, t34 kare ≥ 48 → 420 (geçiş düz
   parlama karelerinde, kare 47↔48 farkı 0 kalır), diğer klipler 420 (t01/l1/t12/l2 ve S2 değişmez; lombar hizası
   bozulmaz). Geri klipler `reverse` ile kendiliğinden doğru. `kodla.mjs`: liste öğesine `kirpimY` (sayı ya da
   `{bas, son, k0, k1}`); `manifest-birlestir.mjs`: yatay çapa dönüşümü `(x/1,5, (y − kirpimY)/1,5)` klip başına
   (d3 yatayda Beydağları/körfez/Antalya çapaları yeniden değerlendirilir; kenar kuralı aynı). Kabul: yatay t23 son ↔
   l3 0 ΔE00 ≤ 3, r32 son ↔ l2 0 ≤ 3, yatay t34 47↔48 fark 0, yatay p3'te Beydağları ve körfez görünür.
6. **t23 → l3 dikişi:** S1-C sonrası ölç; kodlanmışta hâlâ > 3 ise x264/x265 `zones` ile t23'ün son 10 karesine CRF −4
   (AV1'de yok; ΔE orada zaten en düşük).
7. Doğrulama `kodlama-dogrula.py` (+VMAF), `kapak-ton.py` (t56 k_0071 değişmedi), `manifest-birlestir.mjs`,
   `kart.mjs`; `klipler-sema.md` §4 tek komutu gerçek bayraklarla güncellenir (k_0071, `--crf …`); `klip-oynatma.md` §5
   ve §6 tablosu yeni sayılarla.

### 11.3 Site (F: denetim düzeltmeleri; W-C: son entegrasyon ve ölçüm)

- Denetim üç gözle (tasarım/görsel; motor/WebKit/perf/erişilebilirlik; içerik/kimlik/lisans/belge) yalnız bulgu yazar;
  **F** her bulguyu kod ve karelerle doğrular, doğrulananı düzeltir (kapsam: `src/components/icinden`, `src/app`,
  `docs`; K'nin dosyalarına — `kodla.mjs`, `manifest-birlestir.mjs`, `klipler.json`, `public/icinden`,
  `klipler-sema.md`, `klip-oynatma.md` — dokunmaz), reddettiğini gerekçesiyle listeler.
- **W-C**: K'nin manifestiyle tam ölçüm (perf, kare, gecis, tuzak, stale, boyut, lazy, kiosk, reduced, engel, yatay,
  lombar, kapak, dalis; 4G; scrim), yatay d3 çapaları ve ufuk, d6–d9'da broşürsüz plaka (örtme payı artık gerekmez →
  `okumaDonusum` sadeleştirilebilir, mobilde 14 px kayma kalkar), geri klip kuyruk önceliği; §10 tabloları ve §10.5
  güncellenir, onay-listesi §14.1 (bankodaki broşür satırı → "plaka broşürsüz", yatay kadraj satırı) güncellenir.

#### F notları (C turu denetim düzeltmeleri, 3 Kasım 2026)

Üç denetçinin 47 bulgusu kodda ve karelerde doğrulandı; düzeltilenler aşağıda, devredilenler en sonda. Ölçüm:
`next build` + `next start -p 3103`, headless Chrome; scratchpad `c/f/dogrula.mjs`, `dogrula2.mjs` ve `icinden3.mjs`
(stale, tuzak, engel, reduced, yatay, kare, gecis). Build B turu manifestiyle (K-C seti o sırada yazılıyordu).

- **Adımlama (adim.ts).** Tarayıcının kendi kaydırması tam bir durağın üstünde biterse de `yerles(i)` çağrılır:
  Home, End, Bul ve odak kaydırması sahneyi eski durakta bırakıp adımlamayı kilitliyordu (A2-02; ölçüldü: Home'dan
  sonra durak 5'te kaldı, sonraki ok tuşu reddedildi). Ölçü değişiminde konum en yakın durağa değil sahnenin
  durağına yazılır (`simdiki`). `stale` (gecikme 0/1/2) ve `tuzak` yeniden koşuldu: değişmedi.
- **Ölçü değişimi (VideoSahne).** Geçiş sürerken gelen döndürme varışta uygulanır; set yalnız dinlenmede değişir
  (A2-04: `boyutDegis` geçişin zamanlayıcılarını silip varışı düşürüyordu). Kapanışta set yalnız kaydedilir.
- **Oynatıcı (oynatici.ts).** (1) iOS önyükleme: blob atanıp 250 ms'de `readyState < 3` ise görünmez öğe bir kez
  oynatılıp durdurulur (ısıtma; A2-01; cihazda doğrulanmadı, oynatılmamış öğede `readyState ≤ 1` ve `canplay`
  yutulan benzetimde 0→5 yedeksiz). (2) Ters geçiş havuza atanır ama indirmesi `bosta` listesinde: acil ve pencere
  kuyruğu boşalıp ≥ 1 s dinlenme olunca iner; pencere listesinde ters geçiş yok; jest gelirse öne alınır (A2-05,
  §11.2-3). (3) Video `error` (kod 3/4) → dinlenmede H.264'e dönüş (`kodekYedekIste` / `kodekUygula`); başarısız
  indirme dosya başına ≤ 2; `decodingInfo`'ya manifestteki tepe bit hızı (A2-07). (4) `durdur()` süren indirmeyi
  iptal eder (AbortController + nesil; A2-09). (5) Kayıtlar ≤ 300 (kiosk).
- **Poster kipi (§6).** Save-Data, `effectiveType` 2g/3g ya da `prefers-reduced-data` → video inmez, geçişler poster
  çapraz sönmesi; `?poster=1` zorlar (A2-08; ölçüldü: mp4 isteği 0, 0→6 hepsi `poster-kipi`).
- **Kiosk.** Tur d10'dan sonra kapanışta 9 s durur (atıflar kamusal ekranda görünür, A3-01), sonra beyaza sönüp başa;
  kapanıştan da başa dönülür (A2-03); d4 dinlenmesi 600 + 4 × 3,5 s (dördüncü bölge görünür, A1-07); "← Konseptler"
  gizli. **Tam tur ~107 s** (ölçüldü 1280×800; §10.2'deki 93 s eski, W-C kesinleştirir).
- **Erişilebilirlik.** d0 bağlantısı d ≠ 0'da Tab sırasında değil; varışta durak başlığı `aria-live` bölgesine;
  atıfların İngilizce kısmı `lang="en"`; d6 bant başlığı `aria-hidden` (sr-only h2 var); hareketi azalt oturum
  ortasında açılırsa sayfa yenilenir (A2-06, A2-12, A3-17, A2-13). Kap birimi olmayan tarayıcı (iOS 15) için
  `@supports not (width: 1cqw)` ile vw/vh yedeği (A2-10; Chrome'da sınanamaz).
- **Görsel.** d4 bölge etiketleri hol renginde 4 px hale, etkin olmayan %80, rotunda etiketi solda yatay kılavuzla
  (kılavuz × metin kesişmesi 3 görünümde 0; A1-03). d5 sütun işareti: çizgi yalnız ≤ 0,35 · kısa kenar ve metne
  değmiyorsa, değilse çapada 9 px halka, çapa kırpımda/bant altında/üst şeritteyse hiçbiri (A1-02; bugünkü
  kırpımlarda pratikte yalnız yatay telefonda sütun 12 için halka). Kadraj okumasına hale; lombar kâğıdı görünürken
  gizli; hedef d5–d9 ise geçişte de koyu (A1-05, A2-11). d3 scrim `#1A1714` (A1-13), d5 dikeyde krem α 0,84
  (A1-11; halka yazısının izi std 21 → 12/255). Dalışta (d9 ↔ d10) sayfa gölgesi ayrı katmanda söner, sırt gölgesi
  arka kapak yazılarıyla söner (A1-06-1). Masaüstü başlığı `clamp(40px, 3,6vw, 52px)` (1280'de 46 px; "≤ 2 satır"
  kuralı "52 px"in önünde), gövde `32ch` (mobil en uzun satır 33–40 karakter), tarih aralığı bölünmez, `text-wrap:
  pretty` (A1-10, A1-09 kısmen). d9 imza rolü 22u tek satır, blok 690u'da: alt pay 25u (A1-01).
- **İçerik.** d4 "yapardın?." (A1-04/A3-03); d0 logo altı "9–20 Kasım 2026, Antalya Expo"; d3 başlık `cop31.venue`,
  alt satır "Aksu'da; kent merkezine 12 km, havalimanına 5 km.", İngilizce satır gövdenin çevirisi (A1-08, A3-14);
  ALT 1/3/4/5 son posterlere göre (A3-04); kapanışta “…” tırnak, orta noktasız meta, sola hizalı atıflar (A1-12/A3-16);
  ana sayfa kart metni ve altında atıf satırı (A1-14-b, A3-05, A3-15-a); `/icinden` openGraph/twitter + kök paylaşım
  görseli açıkça (sayfa openGraph verince dosya kuralı görseli miras alınmıyor; A3-15-b).
- **Belge tutarlılığı (A3-19).** GPU kilidi: 10 sn yoklama, 45 dk'dan eski kilit ölü (§9.3'teki 5 s / 30 dk yerine).
  "İlk yükleme" iki tanımla: §6'daki H.264 1,84 MB **hesap** (0,5 + t01 + p1 + l1 + t12), §10.1'deki 1,38 MB **ölçüm**
  (4G, d1 hazır olana dek inen). §11.2-7'deki "`klip-oynatma.md` §5 ve §6 tablosu" = `klip-oynatma.md` §5 ve bu
  belgenin §6 tablosu.
- **W-C'ye kalan:** d6 bandının yeri (broşürsüz p6 ile `okumaDonusum` sadeleşince bant sağa; A1-09), `scrim-olc` yeniden
  (d3 rengi, d5 α), 4G'de geri klip sırası ve §11.2-3 tabloları, kiosk tur süresi, gerçek C manifestiyle kare/gecis.
  **Orkestratöre:** dalışta broşürün küçülmesi (A1-06-2; t01 karesini ölçekleyen değişiklik lombar dikişini etkiler),
  Katara Çöküntüsü (A3-02), GEBCO atıf metni (A3-20), ana sayfa kart görseli (A1-14-a).

### 11.4 Kabul edilenler (C'de değişmez)

d3 ön/orta plan temsilî · Sahra tavanı ~%84 (AgX Punchy) · t34 tepesinde ~4 düz #FFF1DC kare (0,13 s) · l1/l2
animasyonlu tohum (film greni) · döngülerde GOP sonu I-kare sıçraması (ΔE ≤ 0,64) · d6 kesişmesi ΔE00 3,2–3,9
(medyan 2,1) · kiosk için 1080p set yok (müşteri yanıtı) · yatayda d4/d5'in sağ %38'e taşması · gerçek iOS/Android
testi kullanıcıda.

### 11.5 C turu sonucu (W-C, 3 Kasım 2026)

S1-C, S2-C, K-C, F ve W-C çıktılarının kabul ölçütleri. Kaynak: K-C raporu (master ve kodlanmış set), W-C ölçümleri
(§10; `.qa/icinden3/c/`). t23 parlaklık ölçütünü S1-C'nin raporu elimde olmadığı için W-C `render-son/t23`'ten yeniden
ölçtü (Rec.709 Y', 4× seyreltilmiş ortalama).

| # | Ölçüt (§) | Hedef | Ölçülen | |
|---|---|---|---|---|
| 1 | t23 son ↔ l3 0, master (11.1 S1-C 1) | ΔE00 ≤ 0,3 | 0,04 (0,023/255) | ✓ |
| 2 | l3 0 ↔ t34a 0, master | ΔE00 ≤ 0,3 | aynı kare | ✓ |
| 3 | t23 son 4 ardışık fark / t34a 0→1 | ≤ 1,5/255 | 0,023 ×4 / 0,065 | ✓ |
| 4 | t23 parlaklık (11.1 S1-C 2) | kare 0–60 luma ≥ %20; 10–40 tek yönlü ±%3 | en düşük %22,6 (kare 19); en büyük geri dönüş %2,3 | ✓ |
| 5 | t23 0 = l2 0 (l2 yeniden render edilmedi) | pozlama değişmez | ΔE00 0,17 (8 bit, yarım ızgara) | ✓ |
| 6 | t34 kare 47 / 48 (11.1 S1-C 3, 11.2-1) | tam #FFF1DC, 47↔48 fark 0 | %100 #FFF1DC; master fark 0 | ✓ |
| 7 | t45 0 ↔ l4 0 (11.1 S2-C 1) | en büyük fark ≤ 5/255 | 3,09 | ✓ |
| 8 | l4 0 ↔ t34b 23 | ΔE00 ≤ 0,05 | 0,0001 | ✓ |
| 9 | p6 broşürsüz: dikdörtgen dışı (11.1 S2-C 2) | ΔE00 ≤ 0,05 | 0,537 (master); kodlanmışta 2,13–2,24 | ✗ |
| 10 | t34 47↔48 kodlanmış (11.2-5) | fark 0 | H.264 0,002–0,003, HEVC 0,005; AV1 0,98 (komşu düz kareler de 0,97–1,03) | ✓ / AV1 ✗ |
| 11 | VMAF (11.2-2) | her dosya ort. ≥ 90 | 85/85; en düşük r32 H.264 91,7 | ✓ |
| 12 | İlk yükleme (11.2-3) | ≤ 2,5 MB | tanım 1,51–1,98; 4G ölçülen d1 hazır 1,30–1,52, t12 dahil 1,73–2,20 | ✓ |
| 13 | Kritik yol (11.2-3) | ≤ 1,8 MB/adım | d2: H.264 1,93 / 1,95, AV1 2,03 / 2,12; HEVC 1,72 | ✗ (HEVC ✓) |
| 14 | Pencere (11.2-3) | ≤ 2,5 MB | tanım: AV1 d3 2,56 / 2,57, diğerleri ≤ 2,46; 4G ölçülen en çok 2,16 | ✗ AV1 (ölçülen ✓) |
| 15 | Set (11.2-3) | ≤ 15 MB/kodek | 8,73–10,67 | ✓ |
| 16 | Tam tur oturumu AV1 (11.2-3) | ≤ 12 MB | tanım 10,98 / 10,80; 4G ölçülen 10,98 / 10,46 | ✓ |
| 17 | Geri klip kuyrukta en son, yalnız boşta (11.2-3) | her ters klip | 24/24 (4 koşu): faz dur, acil 0, pencere 0, varıştan ≥ 1,12 s | ✓ |
| 18 | p3 posteri (11.2-4) | q80'e göre ΔE00 ≤ 1,0, ≤ 150 kB | q60–78 hepsi 2,0–3,0; p3 q80 218 / 229 kB | ✗ |
| 19 | Yatay t23 son ↔ l3 0 / r32 son ↔ l2 0 (11.2-5) | ΔE00 ≤ 3 | 2,79 / 2,36 · 1,48–1,65 | ✓ |
| 20 | Yatay p3'te Beydağları ve körfez (11.2-5) | görünür | p3 ✓; site 1280×800 beş etiket yerinde; 844×390'da Beydağları kırpık | ✓ (16:9) |
| 21 | t23 → l3 kodlanmış (11.2-6) | ΔE00 ≤ 3 | 2,21–2,97 (H.264 `zones` ile 2,66 / 2,79) | ✓ |
| 22 | tsc, eslint | temiz | temiz | ✓ |
| 23 | Rota JS (§9.5) | ≤ 50 kB gz | 17,8 | ✓ |
| 24 | Perf, 4× CPU, 20 adım (§10.2) | uzun kare ≤ 3, düşen 0 | mobil 0 / 1, masaüstü 0 / 0; düşen 0/856 ×4 | ✓ |
| 25 | Lombar hizası, üç görünüm | ≤ 2 px | merkez 0,31 / 0,55 / 0,75; r +0,77 / +1,20 / +0,74 | ✓ |
| 26 | d5→d6 kapak hizası, üç görünüm | ≤ 0,5 px | 0,48 / 0,02 / 0,47 | ✓ |
| 27 | d6–d9 broşür (11.3) | mobilde konum kayması 0; 844×390'da ikinci kapak yok | örtme kaldırıldı (kayma 0); DOM gizliyken üç görünümde boş banko | ✓ |
| 28 | Scrim (render-son) | 18 durak × görünüm | 18/18 (gereken en çok 0,62; tek piksel 0,65) | ✓ |
| 29 | tuzak, stale, engel, reduced, lazy, yatay taşma | §10.4 | hepsi B ile aynı | ✓ |
| 30 | 4G geçiş hazırlığı | yedek 0 | 4 koşu × 7 klipli geçiş hazır | ✓ |
| 31 | Konsol / sayfa hatası | 0 | 0 (22 ölçüm dosyası) | ✓ |
| 32 | F düzeltmeleri gerilemedi | — | F'nin `dogrula.mjs` / `dogrula2.mjs` testleri 3100'de: Home → 0 / End → 11 ve adımlama sürüyor, imza payı 25,1u, d4 kesişme 0, d5 işareti yalnız 844×390'da sütun 12 halkası, döndürme varışta, ısıtma 16, poster kipi mp4 0, kodek yedeği H.264, 404'te 2 deneme, azalt → yenileme | ✓ |
| 33 | Kiosk tam tur | ölç (F ~107 s) | 106,5 s (kapanış 9 s dahil), yedek 0 | — |

**Tutmayanlar ve karar bekleyenler (orkestratöre):** (13–14) d2 kritik yol ve AV1 d3 penceresi: K-C seçenekleri (AV1
t23/l3/t34 CRF 34 + p3 q68 → kritik 1,77, pencere 2,43; ya da sınırı 2,0–2,1'e çekmek); site tarafında çözülmez, 4G'de
4 s tempoda görünür etkisi yok. (18) p3: "master'a uzaklık q80'e göre en çok +1,0" okunursa q68 (−50 / −53 kB). (9) p6
dikdörtgen dışı: t56 yeniden render'ı (yığın gölgesi) ya da kabul. (10) AV1'de t34 47↔48 ~1/255: kodlayıcı kaynaklı,
gözle görülmez. Ayrıca kabul listesi dışında: r43 son → l3 0 dikişi 2,88–3,60.

### 11.6 Orkestratör kararları, C sonucu (3 Kasım 2026 ~07.30; §11.5'teki açık maddeler)

1. **Bütçe (§11.5 #13–14).** Seçenek (c): kritik yol sınırı ≤ 1,8 MB kalır, **d2 için istisna ≤ 2,1 MB** (t23 en uzun ve en
   ayrıntılı klip, 2,8 s; HEVC 1,72 ✓). Pencere ≤ 2,5 MB, **AV1 d3 için istisna ≤ 2,6 MB**. Gerekçe: 4G'de ölçülen pencere
   en çok 2,16 MB ve okur temposunda yedek 0; AV1 t23 CRF 34 en kötü karede VMAF 76,8'e düşüyor, kabul edilmez. D turunda
   bedelsiz olanlar uygulanır: t34 AV1 CRF 34 (VMAF 98,6), l3 AV1 CRF 32 (97,1), p3 q68 → AV1 d3 penceresi ≈ 2,4 MB.
2. **p3 posteri (#18).** Koşul "master'a uzaklık q80'e göre en çok +1,0 ΔE00" diye okunur → **q68** (D turunda, `--poster-q p3=68`).
   C teslimi q80 (218 / 229 kB).
3. **p6 dikdörtgen dışı (#9).** Kabul. Fark 45 master px'lik bantta yığının kâğıt kenarı ve gölgesi; 200 ms'lik kesişmede
   söner. t56'yı (ve bankoyu gören t34b/l4/t45/l5'i) yığınsız yeniden render etmek S2 setinin tamamıdır; kazanç gölgenin
   sönmesi kadar. Yapılmaz.
4. **AV1 t34 47↔48 ~1/255 (#10).** Kabul (SVT-AV1 kaynaklı, düz beyaz karelerde gözle görülmez).
5. **r43 son → l3 0 dikişi (2,88–3,60).** `zones` uygulanmaz (+153–174 kB; yatay H.264 yine 3,10). Geri klip, kabul listesi dışı.
6. **Katara Çöküntüsü (A3-02).** D turunda düzeltilir: `hazirla.py` su maskesi "GEBCO < 0" yerine "GEBCO < 0 **ve** okyanusa
   bağlı" (taşkın doldurma) + Hazar ve Lut Gölü tohumları; yalnız maske dokusu yenilenir, renk dokularına dokunulmaz.
   t01/l1/t12/l2/t23 birlikte yeniden render edilir (C'nin kamera/pozlama/tohum ayarlarıyla; ≥ 20 s aralık), K yeniden
   kodlar, W yeniden ölçer. Kabul: l2[0]'da çöküntü çöl renginde; maske farkı dışında kalan piksellerde B/C master'a göre
   fark ≤ 1,5/255; §11.1'deki dikiş ölçütleri yeniden tutar.
7. **F'nin soruları.** A1-11 α 0,84 kabul (opak levha istenmez). Başlık clamp(40px, 3,6vw, 52px) kabul. Gövde 32ch (en uzun
   satır 40) kabul; 30ch'ye inilmez. A1-06-2 (dalışta broşürün büyüyerek değil küçülerek oturması): lombar dikişini bozacak
   hareket tasarımı değişikliği, **ertelendi**; onay-listesi'ne yazılmaz, iç not. A3-20 GEBCO atıf metni değişmez (§9.6
   metni GEBCO'nun istediği biçimde). A1-14-a ana sayfa kart görseli: kalır.
8. **W-C'nin soruları.** Masaüstünde okuma boyutu ×0,97 ve sol %62: kabul. 844×390'da Beydağları/D400 etiketleri ekran
   dışı: kabul, bilinen sınır (§10.5). boyut/lazy JSON'larına konsol alanı: D'de W ekler.
9. **Teslim.** C turu bu hâliyle commit edilir ve `origin/main`'e gönderilir (deploy kullanıcıda). D turu (6, 1, 2) hemen
   ardından başlar; D bitince ikinci commit.

### 11.7 D turu sonucu (W-D, 3 Kasım 2026)

S1-D2 (t01/l1/t12/l2/t23 yeni su maskesiyle, C'nin kamera/pozlama/tohum ayarlarıyla), K-D (§11.6-1/2: t34 AV1 CRF 34,
l3 AV1 CRF 32, p3 q68; 97 dosya + kart, 47,19 MB) ve W-D (prod ölçüm, §10) çıktıları. Kaynak: S1-D2
`render-son/_onizleme/s1-olcum.json` → `d_turu`; K-D raporu ve `kodlama/dogrula-render-son.json`; W-D `.qa/icinden3/d/`.

**§11.5'in 9–18. satırları, C → D:**

| # | Ölçüt (§) | Hedef | C | D | |
|---|---|---|---|---|---|
| 9 | p6 broşürsüz: dikdörtgen dışı (11.1 S2-C 2) | ΔE00 ≤ 0,05 | 0,537 (master); kodlanmışta 2,13–2,24 | aynı (p6 ve t56 değişmedi); 45 px payla 1,08–1,19 | ✗ — §11.6-3 kabul |
| 10 | t34 47↔48 kodlanmış (11.2-5) | fark 0 | H.264 0,002–0,003, HEVC 0,005; AV1 0,98 / 0,99 | H.264 / HEVC 0,002–0,005; AV1 0,47 / 0,41 (CRF 34); k47 #FFF1DC'ye ΔE00 0,51–0,88 | ✓ / AV1 ✗ — §11.6-4 kabul |
| 11 | VMAF (11.2-2) | her dosya ort. ≥ 90 | 85/85; en düşük r32 H.264 91,7 | 85/85; en düşük r32 H.264 dikey 91,68 (en kötü kare 80,4); t34 AV1 98,60 / 98,45; l3 AV1 97,11 / 97,06 | ✓ |
| 12 | İlk yükleme (11.2-3) | ≤ 2,5 MB | tanım 1,51–1,98; 4G d1 hazır 1,30–1,52, t12 dahil 1,73–2,20 | tanım 1,51–2,04; 4G d1 hazır 1,29–1,58, t12 dahil 1,73–2,26 | ✓ |
| 13 | Kritik yol (11.2-3, 11.6-1) | ≤ 1,8 MB/adım; d2 ≤ 2,1 | d2: H.264 1,93 / 1,95, AV1 2,03 / 2,12; HEVC 1,72 | d2: H.264 1,87 / 1,90, AV1 1,95 / 2,04; HEVC 1,66; öteki duraklar ≤ 1,30 | ✓ (katı 1,8'le d2 ✗, HEVC ✓) |
| 14 | Pencere (11.2-3, 11.6-1) | ≤ 2,5 MB; AV1 d3 ≤ 2,6 | tanım AV1 d3 2,56 / 2,57; 4G ölçülen en çok 2,16 | tanım en çok 2,44; AV1 d3 2,43 / 2,43; 4G ölçülen en çok 2,16 (AV1 d1 2,10 / 2,15 → 1,89 / 1,92) | ✓ (katı 2,5'le de) |
| 15 | Set (11.2-3) | ≤ 15 MB/kodek | 8,73–10,67 | 8,67–10,67 | ✓ |
| 16 | Tam tur oturumu AV1 (11.2-3) | ≤ 12 MB | tanım 10,98 / 10,80; 4G 10,98 / 10,46 | tanım 10,76 / 10,58; 4G 10,76 / 10,24 | ✓ |
| 17 | Geri klip kuyrukta en son, yalnız boşta (11.2-3) | her ters klip | 24/24; varıştan ≥ 1,12 s | 24/24 (4 koşu): faz dur, acil 0, pencere 0, varıştan 1,12–2,15 s | ✓ |
| 18 | p3 posteri (11.2-4, 11.6-2) | master'a uzaklık q80'e göre en çok +1,0 ΔE00; ≤ 150 kB | q80 218 / 229 kB | q68 168,6 / 176,2 kB; master'a 3,26 / 3,42 (q80 2,86 / 3,01 → +0,40 / +0,41) | ✓ (§11.6-2 okuması); 150 kB ✗ |

Statik bütçe W-D `butce.py` ile bağımsız hesaplandı; K-D'nin `kodlama-dogrula.py` çıktısıyla 5 set × 15 değer = 75/75
birebir (fark 0,0005 MB'tan küçük). Bütçe tablosu §10.1.

**§11.6-6 (Katara) ve S1-D2 kabulü:**

| # | Ölçüt | Hedef | Ölçülen (C → D) | |
|---|---|---|---|---|
| D1 | l2[0] master'da çöküntü çöl renginde (S1-D2) | koyu göl yok | iç RGB 76,7 / 77,8 / 74,5 → 153,1 / 127,6 / 80,9; iç − halka (8–20 px) −88,3 / −67,9 / −37,1 → −11,9 / −18,1 / −30,7; ΔE00 30,8 → 7,1; koyu leke payı %88,1 → %36,8 (BMNG dokusunun kendisinde %40,5) | ✓ |
| D2 | Maske farkı dışında B/C master'a göre fark, bütün kareler (S1-D2) | ≤ 1,5/255 | ortalama en çok: l1 0,21 · l2 0,18 · t23 0,065 · t12 0,065 · t01 0,010 | ✓ |
| D3 | t23[83] ↔ l3[0] master (11.1 S1-C 1) | ΔE00 ≤ 0,3 | 0,031 → 0,031 | ✓ |
| D4 | t23[0] ↔ l2[0] master | ΔE00 ≤ 0,3 | 0,101 → 0,101 | ✓ |
| D5 | t23 son 4 ardışık fark | ≤ 1,5/255 | 0,023 ×4 | ✓ |
| D6 | t23 parlaklık (11.1 S1-C 2) | kare 0–60 ≥ %20; 10–40 tek yönlü ±%3 | S1-D2 tam çözünürlükle %22,66 (kare 25); W-D 4× seyreltmeyle %22,57 (kare 19); en büyük geri dönüş 2,29 (C ile 0,12 puan içinde) | ✓ |
| D7 | t01[0] diski (lombar) | C ile aynı | S1-D2: kutu merkezi (959; 771,5), çap 350 × 347 aynı; sitede lombar 0,31 / 0,48 / 0,76 px, r +0,78 / +1,27 / +0,74 | ✓ |
| D8 | Kodlanmış dikişler (11.2-5/6) | ΔE00 ≤ 3 | t23 son → l3 0 2,21–2,97 → 2,20–2,95; r32 son → l2 0 1,48–1,83 → 1,47–1,84 | ✓ |
| D9 | Katara iç − çevre, kanal başına (S1-D2'nin önerdiği sayı) | ±15/255 | master l2[0] −11,9 / −18,1 / −30,7; p2 −12,5 / −17,9 / −29,9; site d2 −12,0 / −18,3 / −30,5 (390×844), −12,1 / −18,2 / −30,3 (1280×800); site d1/d10 +17,0…+19,7 / +8,0…+10,2 / −7,0…−9,7 | ✗ (d2'de G, B; d1/d10'da R) |
| D10 | Render − BMNG dokusu (aynı piksellerde iç − çevre farkının farkı) | ±10/255 | master l2 +8,8 / +5,5 / −3,6; p1/p2 en çok 8,6; site d2 +8,8 / +5,4 / −3,1 ve +8,4 / +5,2 / −3,4; site d1/d10 en çok 3,5 | ✓ |

Site ölçümü (W-D `katara-ekran.py`): K-D'nin bölge tanımı (S1-D2 `d_olcum` a — maske farkının kare 0 izdüşümü, 2 px
aşındırılmış; çevre 8–20 master px halka, öteki değişen bileşenler dışarıda) `geo` dönüşümüyle ekran pikseline taşındı.
İç bölge d2'de 7.234 (390×844, dpr 2) / 5.138 (1280×800) cihaz pikseli, d1/d10'da 72 / 46. Ölçülen kareler: D doğal,
D yalın (döngü kare 0, metin/etiket/kadraj gizli; d2'de doğalla aynı sayı, bant çöküntünün üstünde değil) ve W-C'nin
C kareleri. Koyu leke payı (iç piksellerin, halkanın %1'lik luma eşiğinin altında kalan payı) d2'de %89,2 / %89,3 →
%37,5 / %38,0; dokunun kendisinde %40,5 / %40,2. d1/d10'da hem C'de hem D'de %0 (çöküntü 72 px; koyu göl C'de gözle
seçiliyordu, iç − çevre −70 / −56 / −29). Kırpımlar: `.qa/icinden3/d/kontak-katara.png` (d1, d2, d10 × iki görünüm: C |
D | D yalın | D + Katara sınırı), `kontak-m.png` ve `kontak-D.png`'nin son hücresi (d2 yakın, C | D).

**Katara kabulü (W-D değerlendirmesi; karar orkestratörde).** §11.6-6'nın yazılı kabulü ("l2[0]'da çöküntü çöl renginde",
maske dışı ≤ 1,5/255, dikişler) tutuyor: koyu göl üç kaynakta da (master, poster, site) kalktı; C'nin −88 / −68 / −37'lik
farkı −12 / −18 / −30'a, ΔE00 31'den 7'ye indi; koyu leke payı dokunun kendi payı düzeyinde. S1-D2'nin eklediği ±15/255
sayısı ise tutmuyor: kalan fark doku kaynaklı (çöküntünün sabhka tabanı ve kuzey yamacı BMNG'de çevresinden koyu; dokuda
−20,7 / −23,6 / −27,1), render bu farkı ±9/255 içinde izliyor. ±15'e çekmek doku boyamayı gerektirir; §11.6-6 "renk
dokularına dokunulmaz" dediği için yapılmadı. Öneri: ölçüt D10 biçiminde ("render iç − çevre farkı, BMNG dokusunun
farkına ±10/255") okunsun: master, dört poster ve altı site karesinin hepsinde tutuyor (en çok 8,8).

**S1-D2 master dikişleri (ΔE00 ort.; C → D):** t01[53] ↔ l1[0] 0,089 → 0,089 · l1[119] ↔ l1[0] (döngü kapanışı) 0,109 →
0,048 · l1[119] ↔ t12[0] 0,104 → 0,104 · t12[59] ↔ l2[0] 0,103 → 0,103 · l2[119] ↔ l2[0] 0,151 → 0,088 · l2[0] ↔ t23[0]
0,101 → 0,101 · t23[83] ↔ l3[0] 0,031 → 0,031. Döngüler artık sabit tohumlu: ardışık master farkı l1 0,259 → 0,115, l2
0,325 → 0,205 /255. Kodlanmışta l1 H.264 döngü kapanışı 1,55 → 1,15/255 (ΔE00 0,97 → 0,59), t01 son → l1 0 dikişi
0,91–1,53 → 0,92–1,19 (K-D).

**Site (W-D, §10):** tsc, eslint temiz · rota JS 17,8 kB ✓ · lombar ≤ 0,76 px ✓ · d5→d6 kapak −0,48 / 0,02 / −0,47 px ✓ ·
scrim 18/18 ✓ · tuzak, stale, engel, reduced, lazy, yatay, d3 yatay, okuma ✓ (C ile aynı) · 4G 4 koşu × 7 klipli geçiş
hazır, yedek 0 ✓ · konsol hatası 0 (21 JSON; `boyut` ve `lazy` artık alanlı) ✓ · kiosk tam tur 106,5 s · perf: uzun kare
mobil 1 / 0, masaüstü 0 / 0 ✓; **düşen kare mobilde 1 / 856 ×2** (3→4, 4→5; C'de 0) — iki ek koşuda 0 / 856 ×2, masaüstü
dört koşuda 0.

**Açık maddeler (orkestratöre):** (D9) Katara ±15 yerine doku-göreli ölçüt (D10) kabul mü? · l1 H.264 +61,6 / +19,2 kB
(S1-D2'nin sabit tohumlu l1'i; VMAF aynı; ilk yükleme 2,04 ≤ 2,5, bütçeyi bozmuyor) için ayrı CRF istenir mi (K-D sorusu)?
· Mobil perf'te koşu başına 1 düşen kare (ek iki koşuda 0): gürültü kabul mü? · §11.6-9'a göre D turu commit'i.

### 11.8 Orkestratör kararları, D sonucu (3 Kasım 2026 ~11.15)

1. **Katara ölçütü.** §11.6-6'daki "çevre çöl ±15/255" yanlış kurulmuştu: BMNG dokusunda çöküntü tabanı (sabhka, kuzey
   yamaç) zaten çevresinden 20–27/255 koyu. Kabul ölçütü W-D'nin önerdiği biçime çevrildi: render iç − çevre farkı, dokunun
   kendi farkına **±10/255** içinde (ölçülen en çok 8,8; master, 4 poster, 6 site karesi ✓). Boyalı göl kalktı (iç↔çevre
   ΔE00 31 → 7). Doku boyanmaz.
2. **Perf.** Mobil 4× CPU'da iki ana koşuda 1/856 düşen kare, iki ek koşuda 0, masaüstü 4 koşuda 0: gürültü, kabul.
3. **l1 H.264 +62 kB.** Ayrı CRF yok; ilk yükleme 2,04 MB ≤ 2,5. Sabit tohumlu döngü bu kodekte biraz pahalı, HEVC/AV1'de etkisi yok.
4. **Bütçe.** §11.6-1 tanımıyla 5 set 5 ✓ (kritik d2 1,66–2,04; pencere en çok 2,43; AV1 oturum 10,24–10,76; set ≤ 10,7).
   Katı 1,8 MB d2'de yine aşılıyor (HEVC hariç) — istisna kalıcı.
5. **Teslim.** D turu commit edilir ve `origin/main`'e gönderilir. Sonraki iş gerçek cihaz testi ve müşteri yanıtları
   (onay-listesi §14.1); yeni render turu planlanmıyor.

## 12. E turu kararları (orkestratör; bağlayıcı — §9/§11 ile çelişirse bu bölüm geçerli)

Tarih: 3 Kasım 2026. Bu bölüm kullanıcının dört maddelik revizyon isteğini karşılıyor. Temel jürinin kazananı olan "anlatı-önce" önerisi (12 durak, 2 duvar durağı, DOM 3B broşür). Diğer iki önerinin şu fikirleri de eklendi: ışık devri, ön cephe pankartı, 3/4 duvar kadrajı, ölçülebilir hata düzeltmeleri, broşür perf sınırları ve ölçülmüş broşür tasarrufu.

Bu bölüm şu eski kararları değiştirir:
- §2.3 d1 "nabız yok" → tek seferlik varış halkasına izin.
- §9.1 d2 "nefes durağı, başlık yok" → Türkiye durağı, alt bantla.
- §9.1 durak sayısı 11 → 12.
- Icinden3.tsx:26 "parti içeriği yalnız broşürde (d ≥ 6)" → **d1–d3 ve d11'de parti içeriği yok; stant içi (d4–d10) serbest.**
- §11.2-2 CRF tablosu → §12.5.

Değişmeyenler: kilitli adımlama, "yalnız kaydırma", geçişler 1,6–2,8 s, döngülerde kamera sabit, lombar/Droste, logo kuralları, lisans listesi, render'da insan figürü yok.

### 12.0 İstek okuması → karar

| # | Kullanıcının sözü | Okuma | Karar |
|---|---|---|---|
| 1 | "12.100 km kadrajında Antalya fazla basit ve sade" | Antalya'yı buluşma noktası yapan hiçbir şey görünmüyor: 3 px nokta + 12 px yazı, l1 neredeyse fotoğraf (kareler arası fark 0,115/255). | Video **değişmez**. d1'e DOM katmanı gelir: 27 COP ev sahibi kentinden Antalya'ya ışık yayları, tek seferlik varış halkası, iki satırlı künye. d11'de aynı yaylar ters yönde. 0 GPU, 0 video baytı. İlk yükleme, lombar ve ana sayfa kartı korunur. |
| 2a | "1.300 km'de gereksiz bilgiler… boş, detaysız, yüzeysel" | Gereksiz olan atlas etiketleri (Akdeniz/Anadolu/Kıbrıs). Boşluk hem içerikte (başlık yok) hem görselde: kadrajın %40'ı Mısır çölü, rölyef yok, 3 emanet alanı kadraj dışında. | Etiketler kalkar. Kadraj **tüm Türkiye'ye** döner (nadir, ~1.700 km). GEBCO rölyefi eklenir. 12 emanet DOM ışığı kronolojik sırayla yanar ve Antalya'ya bağlanır. Alt banda başlık ve gövde gelir. t12, l2, t23 yeniden render edilir. |
| 2b | "bu kısımlarda animasyon hataları mevcut" | Hem tasarım eleştirisi hem gerçek kusurlar: t12 k16–28'de kopuk turuncu hale ve ışık çizgileri; t23 k16–30'da körfezdeki dikdörtgen yama sınırı. | İki kusur aynı render'da ölçütle düzeltilir (§12.6). g-1→2 ve g-2→3 kontak sayfaları (bugün yok) **E0'da** çekilir ve teslimle kullanıcıya gösterilir. t23 k56 gri bulut perdesi ve d1 üst kenarındaki sepya leke bu turda değişmez; kullanıcı işaret ederse F turu. |
| 3 | "bilgileri broşüre gömmektense standın duvarlarını dolduralım, oraları gezdirelim" | Bilgi broşür ile duvarlar arasında bölüşülecek ("da"). Duvarlarda durulacak, yani en az iki duraklık sınırlı bir tur. | Arka ve sol duvar iç yüzleri ile ön cephe dış yüzü basılır. İki yeni durak: **d6 İklim Eylemleri** (arka duvar) ve **d7 Sen de söz ver** (sol duvar). Broşürdeki 11/12 sayfası ve kapak bandındaki sayılar satırı duvarlara taşınır. Gezinti geçiş kliplerinde yaşanır. |
| 4 | "broşürün animasyonu çok basit" | Sayfa çevirme düz scaleX; kâğıt hissi yok. | Broşür DOM'da kalır ve **3 sayfa korunur** (1/12, 8/12, 12/12). Yeni öğeler: perspective() + rotateY menteşe, ışık ve gölge katmanları, kalkma, gerçek başlıklı en çok 3 hayalet sayfa, "50+" sayacı. Polaroid dalışı ve Droste kapanışı aynen. Blender kâğıt kıvrımı yok. |

**Bu turda yapılmayanlar (karar):**
- **Yıldız:** §2.1'e aykırı, parlak pozda fiziksel olarak görünmez.
- **Eğik d2 ufku:** limb hale kusuru 4 s boyunca durağan görünürdü; kuzey uzvu kutup gecesinde kalıyor; t23'te ln aralığı +%9 ve lens değişikliği dikiş riskini artırıyor. Kullanıcı "hâlâ düz" derse F turunda önizlemeyle denenir.
- **Blender'da yay, ışık sütunu ya da boncuk:** liste değişince yeniden render gerekir, ilk yüklemeye biner, klişe riski var.
- **Blender broşür (c89 ya da sayfa kıvrımı):** +0,34–1,8 MB, broşürü küçültüyor.
- **Bütçe dışı kalanlar:** amfi duvarı, l6/l7 duvar döngüleri, global geri klip CRF 36.
- **d1 videosuna dokunmak:** sepya leke düzeltmesi ilk yüklemeyi, lombarı ve kartı etkiler.
- **d1 "mercek":** d3'ün ödülünü önceden açar.
- **Fotoğraf yasakları:** insanlı ya da Cumhurbaşkanlı fotoğraf baskısı yok; gencIklimPanel hiçbir koşulda kullanılmaz (fonunda COP31 logosu var); fidanDikimiGencler kullanılmaz (çocuk var).
- **d4/d5 bantlarını duvara gömmek:** okunurluk ve erişilebilirlik bozulur, her düzeltme yeniden render ister.

### 12.1 Durak listesi

**Numaralama kararı: yeniden numaralandırılır (d0–d11 + kapanış); d5a/d5b gibi ara adlar yok.**

Gerekçe: adim.ts bölüm dizini, `data-adim` ve `data-dinlenme` seçicileri, manifest `id`, kodla.mjs'teki `r${klip[2]}${klip[1]}` türetmesi ve ölçüm betikleri tamsayı dizin varsayıyor. "d5a" bunların hepsine özel durum ekler.

Yeniden numaralama tek seferlik bir göç. Bu turda durak tablosu veriye taşınıyor (`rol` alanı, §12.4), bu yüzden bir sonraki eklemenin bedeli düşük olur. Video taşıyan en büyük durak d8 olduğu için klip adları tek haneli kalır. kodla.mjs yine de açık ad tablosuna geçer.

| id | Durak (okuma) | Kaynak | Gelen geçiş | Döngü | Metin bandı | Poster |
|---|---|---|---|---|---|---|
| d0 | Açılış | DOM logo | — | — | değişmez | — |
| d1 | Dünya (~12.100 km) | S1 (değişmez) + DOM yaylar/künye | t01 1,8 s (+0,6 s DOM), değişmez | l1 4 s, değişmez | üst, uzay, değişmez | p1 |
| d2 | Türkiye (~1.700 km) | **S1-E** + DOM 12 emanet | **t12** 2,0 s YENİ | **l2** 4 s YENİ | **alt, YENİ** | **p2** YENİ |
| d3 | Antalya Expo (~1,4 km) | S1 | **t23** 2,8 s YENİ (zamanlama C turu) | l3 5 s (yalnız yeniden kodlama) | değişmez | p3 |
| d4 | Stant anatomisi (~24 m) | S1 + **S2-E** | t34 2,4 s (**t34b** YENİ) | **l4** 4 s YENİ | üst; gövde cümlesi d2'ye taşınır | **p4** YENİ |
| d5 | Buradasın, bugün (~3 m) | S2 | **t45** 2,0 s YENİ | l5, değişmez | değişmez | p5 |
| d6 | **İklim Eylemleri** (arka duvar, ~3 m) | **S2-E** | **t56** 2,0 s YENİ (yeni anlam) | yok, son kare durur | alt, krem, 3 spot satırı | **p6** YENİ (son-kare) |
| d7 | **Sen de söz ver** (sol duvar, ~3 m) | **S2-E** | **t67** 1,6 s YENİ | yok | alt, krem | **p7** YENİ (son-kare) |
| d8 | Broşür kapağı, "sayfa 1/12" | DOM | **t78** 2,2 s YENİ + 200 ms kesişme + 420 ms FLIP | DOM | %12 alt; sayılar satırı çıkar | **p8** = eski p6 plakası |
| d9 | Buluşmalar · Şölen, "sayfa 8/12" | DOM | DOM 2,0 s (menteşe + hayaletler + dalış) | DOM | — | p8 |
| d10 | Arka kapak, "sayfa 12/12" | DOM | DOM 1,8 s | DOM | — | p8 |
| d11 | Ortak evimiz | S1 + DOM ters yaylar | DOM 0,6 s + t01 tekrarı | l1 | üst, uzay, değişmez | p1 |
| — | Kapanış | DOM | — | — | atıflara "Stant görünümü temsilîdir." eklenir | — |

- **Geri klipler:** r10, r21, r32, r43, r54, r65 (yeni), r76, r87 (eski t56'nın yerine). d11→d10 için r10.
- **Kalkanlar:** eski d8 "sayfa 11/12" (İklim) arka duvara taşınır.
- **Kiosk turu:** 106,5 s → ~120 s. Eklenenler: t56 2,0 + d6 11,1 (600 + 3 × 3.500) + t67 1,6 + d7 5,0 + çevirmeler +0,6. Düşenler: iklim sayfası −6,6, t78 −0,2.

### 12.2 S1-E (Cycles OptiX 1920², D turu ayarları, `--kilit`)

**d1: render yok.**
- Yeni `scripts/blender/s1/yaylar.py` (GPU yok) kamera.py D1 pozuyla yay çapalarını üretir: KM.projeksiyon, 24 nokta/yay, yükseklik = yay uzunluğu × 0,12 (en çok 900 km), ışın–küre testiyle uzuv arkası kırpımı. Çıktı `render-son/yaylar.json` ({dikey, yatay}; d1 ve d11 aynı). Ayrı fragman, çünkü l1.json'u sahne.py yeniden yazıyor.
- **Kent listesi:** COP1–COP30 ev sahibi 27 kent, tekilleştirilmiş: Berlin, Cenevre, Kyoto, Buenos Aires, Bonn, Lahey, Marakeş, Yeni Delhi, Milano, Montreal, Nairobi, Bali, Poznań, Kopenhag, Cancún, Durban, Doha, Varşova, Lima, Paris, Katowice, Madrid, Glasgow, Şarm El-Şeyh, Dubai, Bakü, Belém.
  - Ad yazılmaz. Koordinatlar elle girilir (olgu verisi).
  - Avrupa'daki kısa yaylar seyreltilmez: gerçek bir ev sahibini çıkarmak editoryal bir eksiltme olurdu.
- Antalya çapası değişmez: dikey (386,5; 758,1), yatay (666,5; 478,1).
- Yıldız yok.

**d2: yeniden hedefleme.**
- `kamera.py` D2 (satır 144): G = (38,75; 34,66; 0), d = 2.000 km, p −90, 24 mm. Kadraj 1.687 km.
  - 12 alan dikeyde x 118–597, y 520–748; yatayda x 398–877, y 240–468.
  - t12/t23 formülleri D2'ye bağlı. t23'te yanal kayma 358 → 393 km; C turu zamanları aynen (T23_FA 40, T23_VARIS 78, tohum 78–83, bulut perdesi).
- `hazirla.py` (CPU ~8 dk):
  - C1_ENLEM/C1_BOYLAM 22–54 K / 16–48 D, ardından `hazirla.py c1` (RAM +~80 MB). Yeni şerit (46–54 K, 44–48 D) yalnız alt < 6.000 km'de karışır (ortam `c1_ek_k`), böylece t12[0] l1 ile özdeş kalır.
  - Yeni `rolyef()`: GEBCO C1 30″, 34–44 K / 24–46 D, 1,2 px Gauss, 16 bit → `s1/tex/rolyef_tr.png`.
  - **Körfez yaması:** s2-bolge yamasına 3 km kenar alfası + 10 km halkada BMNG'ye histogram eşleme.
- `sahne.py`:
  - Dünya malzemesine (263–292) ShaderNodeBump → Normal, güç 0,2. `rolyef_k` = ss(alt; 9.000 → 4.000 km) × ss(alt; 300 → 600 km), yani D1'de ve arazi devrinde 0.
  - **Hale:** atmosfer hale çarpanı irtifaya bağlanır, 1 (≥ 12.000 km) → 0,6 (≤ 8.000 km). t12 deklanşörü 0,5 → 0,3. Önizlemede şerit sürerse aynı turda kabuk H'si irtifaya bağlanır (+3 dk önizleme).
  - CAPALAR p2 (1106–1113) = 12 emanet (emanet.ts lat/lng) + Antalya. Akdeniz/Anadolu/Kıbrıs çıkar, KIMLIK güncellenir.
  - Bulut: değişmez (aynı tohum). Deniz parıltısı: yok; ayna noktası 27 K 19 D'de, Libya'da, kadraj dışında.
- **Önizleme** EEVEE 960² (~3 dk): rölyefte çift gölge (BMNG'de pişmiş kuzeybatı gölgesi var; gerekirse güç 0,15), kuzey kenarda doku sınırı, körfez, 12 alanın konumu.
- **Son render:** t12 60 kare 5,1 dk + l2 120 kare 10,8 dk + t23 84 kare 13,1 dk + bump payı ~2 dk = **~31 dk**. Önizlemeyle **S1 ≈ 34 dk GPU**.
- **Değişmeyenler:** t01, l1, p1, l3, p3, kart, lombar.

### 12.3 S2-E (EEVEE TAA 64 1920², son.sh)

**Duvar dokuları** (`dokular.mjs` `isler` listesine eklenir; Playwright; **500 px/m**):
- Master'da duvar en çok ~280 px/m görülüyor; 500 px/m bunun 1,8 katı. 600 px/m'ye göre VRAM %30 düşük.
- Fontlar Lora ve Montserrat (OFL). Büyük harfler metnin kendisine yazılır (TR()); `uppercase` kullanılmaz.

| Dosya | Yüzey | px | İçerik |
|---|---|---|---|
| `duvar-arka.png` | arka_kapali iç yüzü, x −7,38…−1,80 × z 0–4 | 2.790 × 2.000 | Krem #F7E6CD zemin; z 0–0,95 koyu yeşil #28332F dağ silueti (GEBCO Toros kesiti, 37 K). **Telefon penceresi** (x −7,0…−3,95): "İklim Eylemleri" (Lora 600, büyük harf 0,26 m, z 3,0–3,3) + "Climate Action" (Lora italik 0,14 m). Solda "300" (Lora 700, 0,60 m) / "fidan" (0,20 m) / "Hatıra Ormanı · 2025" (0,14 m). Sağda hatiraOrmaniTabela 4:3, 1,30 × 0,98 m, 4 cm paspartu, altında "Genç İklim" (0,20 m) / "21-23 Ağustos 2026 · İstanbul" (0,14 m; content.ts:109 noktalama sınırından bölündü). Pencere dışında (x −3,9…−1,8): "Fidan dikimi ve orman temizliği etkinlikleri" (0,16 m) + "#YaniBanaEmanet". |
| `duvar-sol.png` | sol_kapali iç yüzü, y −0,50…4,83 | 2.665 × 2.000 | Dağ silueti köşeden kesintisiz. z 2,25–3,25: "1.000.000+" (0,42 m) / "Genç Üye" (0,18 m), "81 İl · 922 İlçe" (0,20 m), content.ts:22–24. Ekran alanı boş bırakılır. |
| `ekran-soz.png` | sol duvarda 2 × 50″ emisyonlu panel (2 × 1,11 × 0,62 m, 4 cm ara, y 1,05…3,31, z 1,20–1,82; PDF s.2 düzeni, ölçü temsilî) | 1.110 × 620 (× 2) | Yalnız "Sen de söz ver." (kioskEkran dili, #17241D zemin). Sayı ve çubuk yok. |
| `cephe-on.png` | on_kapali dış yüzü, x 1,95…7,5 | 2.775 × 2.000 | PDF s.4 büyük giriş pankartı: krem zemin, Toros silueti, "İklim, doğa, sıfır atık bize miras." · "#YaniBanaEmanet" · "GençİKlim – 12.000 Yıllık Emanet – İçeride →" (stant.ts:77–79, birebir). Logo yok. |

**Okunurluk kuralı** (telefon, 18 mm):
- Başlık büyük harfi ≥ 40 video px, rakam ≥ 60 video px, ikincil satır ≥ 24 video px (≥ 16 CSS px).
- Bunun altına düşen her şey yalnız DOM'da.
- Duvarda paragraf yok.

**Yerleşim ve ışık:**
- `panel_doku` 5 mm panel olarak duvarın parca'sına bağlanır (d_arka, d_sol, d_on); patlatma ve montaj korunur.
- **Duvar yıkama spotları** (siyah kol + gövde modeli, z 4,25, duvardan 0,7 m açıkta, 3.000 K, koni 35°, blend 0,6, hedef z 2,0):
  - kuzey: x −6,6 / −4,9 / −3,2;
  - batı: y 0,6 / 1,95 / 3,3.
- `isik_durum` iki yeni anahtar alır: **`kuzey`** ve **`bati`**. d4'te (patlatılmış), montajda, l5 boyunca ve banko anında 0. Patlatılmış baskıları d4'te yumuşak kutu aydınlatır.
- Mevcut `duvar` anahtarına ve spotlarına dokunulmaz. Böylece t56[0] ≡ l5[0] ve t78 sonu ≡ eski t56[71] kalır.

**Pozlar:**
- **A (d6):** (−4,30; 1,90; 1,55), ψ −18°, φ +4°, 18 mm; 3/4 galeri açısı.
  - Telefonda arka duvar x −7,0…−3,95, duvar y %16–80, üstte karanlık hol.
  - Yatayda başlık kadrajda (kirpimY 420 kalır).
  - Kiosk, sütunlar ve kanopi kadraj dışında.
- **B (d7):** (−4,75; 1,60; 1,55), ψ −80° (10° kuzeye eksen dışı), φ +4°, 18 mm.
  - Telefonda duvar y ≈ 0,9…3,4.
  - Sol bank sağ altta ön planda; totem arkada, kadraj dışında.

| Klip | Süre / kare | Yol |
|---|---|---|
| **t56** | 2,0 s / 60 | P5 (−1,38; 0,05; 2,65; ψ 0; φ −78; 18 mm) → u 0–0,30: baş kalkar (φ −78 → −6), z → 1,75, (−1,75; 1,25)'e → u 0,30–0,60: **120° sütun aralığı** (−2,41; 2,51; 1,60); krom yok; iki yanda ≥ 0,30 m pay; sütunlar ön planı siler → u 0,60–1: batıya kayma + 0,6 m geri çekilme, A'ya (ψ −27 → −18). Son 0,25 s yumuşak iniş. `kuzey` u 0,55–0,95'te 0 → 1. Deklanşör 0,35. |
| **t67** | 1,6 s / 48 | A → B: 0,54 m kayma + 62° sola pan (easeInOutSine). Dağ şeridi köşede kesintisiz akar. `kuzey` 1 → 0,3, `bati` 0,15 → 1. Deklanşör 0,35. |
| **t78** | 2,2 s / 66 | B → (−6,00; 0,40; 1,62) → (−6,00; −1,60; 1,62): totem ile batı duvarı arasından, iki yanda ≥ 0,95 m. → Dn (−4,28; −3,03; 1,62) → **eski t56 kuyruğu birebir** (E → son, ψ −150, φ −90, 85 mm, D_SON 0,955 m, odak mantığı). `bati` ve `kuzey` u 0,25–0,60'ta 0'a iner. Son karede `isik_durum` eski t56[71] ile aynı (rotunda nefes fazı dahil). |

- Çarpışma payı (sütun R 2,10, kanopi R 2,25, totem, sol bank, kiosk) ≥ 0,25 m; betikle denetlenir (GPU yok).
- **Posterler:** p6 = t56 master son karesi; p7 = t67 son karesi (yeni `son-kare` tipi); p8 = eski p6 plakası (yeniden render yok); p4 yeniden.
- `json_yaz`: brosur_dikdortgen → t78. p6 çapaları: `fidan` ("300"), `genc_iklim`, `orman` (dağ şeridi). d6/d7'de `kadraj()` hedefi duvar düzlemi. `KLIPLER` ve son.sh güncellenir.
- **Broşür:** render yok.
- **Önizleme** 960² (~6 dk): okunurluk, ışık havuzları, sütun silmesi, t78 son kare, **VRAM tepesi ≤ 7,6 GB**.
- **Son render:**

| Klip | Kare | s/kare | GPU |
|---|---|---|---|
| t34b | 24 | 3,56 | 1,4 dk |
| l4 | 120 | 3,66 | 7,3 dk |
| t45 | 60 | 5,64 | 5,6 dk |
| t56 | 60 | 5,4 | 5,4 dk |
| t67 | 48 | 5,4 | 4,3 dk |
| t78 | 66 | 5,35 | 5,9 dk |

  Toplam 29,9 dk; yıkama ışığı payı ×1,08 → ~32 dk. Önizlemeyle **S2 ≈ 38 dk GPU**. Ardından parlama.py + t34-birlestir.py.
- **Değişmeyenler:** l5, p5, p8.

**GPU toplamı ≈ 72 dk** (S1 34 + S2 38).

### 12.4 DOM / W-E

Kod yazmadan önce: `node_modules/next/dist/docs` içindeki ilgili rehber okunur (Next 16). Port 3000'e dokunulmaz; ölçüm `next start -p 3100` ile yapılır.

1. **Durak tablosu veriye taşınır.**
   - Her durağa `rol` alanı: lombar, dunya, emanet, expo, anatomi, sutunlar, duvar, brosur-kapak, brosur-sayfa, brosur-arka.
   - Rol okuyacak yerler: VideoSahne'deki ~34 sabit satır (5→6 kesişme dalı, 6↔9 DOM dalı, `to === 11`, `j <= 10`, spot ve dinlenme tabloları, D[1]/D[5]/D[6]), icinden3.css seçicileri (`data-rol`), Brosur dizinleri (SAYFA_DURAK, ESLESME_D, LOGO_D, ARKA_SONUM_D, KAGIT_GIRIS, CIZELGE).
   - Hepsi tek bir tablodan türetilir. Kapanış dizini N'den hesaplanır.
2. **d1 (yeni `DunyaYaylari.tsx`, sunucu SVG):**
   - viewBox 720×1280 / 1280×720, `xMidYMid slice` (object-fit:cover ile birebir).
   - Varıştan 400 ms sonra, uzaktan yakına 40 ms kademeyle bir kez çizilir; toplam ≤ 1,6 s.
   - Görünüm: 1,25 px, #FFC266 → #FFF1DC (Antalya ucu), opaklık kökte 0 → Antalya'da 0,8. Dinlenmede 0,55'te durur; jestte 200 ms'de söner.
   - Antalya: 7 px çekirdek + #FFC266 hale. ~1,4 s'de çift halka bir kez genişler (6 → 34 px, 1,1 s, yalnız transform/opacity).
   - **Künye** (SahneEtiketleri'nde yeni `kunye` türü): 18 px kılavuz çizgi, "Antalya" (Montserrat 600, 14 px), ikinci satır Lora italik 13 px.
     - SSR'da "9–20 Kasım 2026" yazar. Mount sonrası Europe/Istanbul tarihine göre: 9 Kasım öncesi "Açılışa N gün", 9–20 Kasım "COP31 · N. gün", sonrasında SSR metni kalır.
     - Sunucuda Date kullanılmaz.
   - 3 px nokta kalkar. d11'de yaylar Antalya'dan uzva doğru 1,6 s'de çizilir.
3. **d2:**
   - Yeni `emanet` etiket türü: 6 px dönem renkli çekirdek (donemler[].renk) + 1,5 px beyaz halka + 3 px rgba(0,0,0,.45) hale. Numara Lora 700, lining + tabular, 13 px. Ad yok.
   - Çakışan çiftler (06/07, 04/05/Antalya) için manifest'te ofset tablosu; 05'in numarası Expo noktasının soluna.
   - Varış dizisi: 11 dilim, kronolojik (12 → 2 → 3 → 4 → 5 → 6 → 7+8 → 9 → 10 → 11 → 1), 120 ms arayla. Ardından 1,4–2,4 s arasında her ışıktan Antalya'ya 1 px dönem renkli bağ (`ozel.baglar`), dinlenmede %35. Sonra durağan; spot döngüsü yok (d5 tekrar edilmez).
   - **Bant** (alt, #0B1A2E, %60'tan; metin satırlarında α ≥ 0,66; yatayda sol altta):
     - başlık `stant.girisMetni[0]` "12.000 yıl önceden bugüne.";
     - EN "From 12,000 years ago to today." (`data-onay="en"`);
     - gövde `stant.girisMetni[1]`, d4'ten taşınır; d4'te başlık, EN, hashtag ve bölge spotları kalır.
   - Okuma "kadraj ~1.700 km". Bolum başlığı "Türkiye: 12.000 yıl önceden bugüne".
4. **d6 ve d7 Bolum'leri:**
   - **d6:** alt krem bant (#F7E6CD, α ≥ 0,70, metin #28332F). Başlık "İklim Eylemleri", EN "Climate Action". 3 spot satırı `iklim.items[0..2]` birebir, 600 + 3 × 3.500 ms. Etkin satırdan p6 çapasına 1 px kılavuz (d5 sutunCizgisi kalıbı).
   - **d7:** başlık "Sen de söz ver.", EN "Make your pledge too.", gövde `genclikKollari.subtitle`. Spot yok; dinlenme 5 s.
   - Duvara basılan her yazının sr-only eşi vardır. ALT[6] ve ALT[7] yazılır.
   - d8 kapak bandındaki `sayilar` satırı kalkar.
5. **Broşür (Brosur.tsx):**
   - SAYFALAR ["kapak", "bulusma", "arka"]. İklim sayfası ve iki polaroidi /icinden'den çıkar; /brosur değişmez.
   - **Giriş:** FLIP süresi 420 ms kalır; aynı süre içinde perspective(1800px) rotateX(−7° → 0) ve gölge 24 → 34 px.
   - **cevir() menteşe:**
     - perspective(2000px) rotateY(0 → −90°), origin sırtta; kalkışta ±1,2° rotateX.
     - Koyulaşma katmanı 0,45·sinθ; sırt parlak şeridi θ 20–50°'de 0,25.
     - Alttaki sayfada gölge: genişlik W·cosθ, opaklık 0,35·sinθ. θ > 75°'de 120 ms'de söner.
     - Her çevirmede broşür bütün olarak kalkar: translateY(−6 px) scale(1,012), 0–0,15 s.
     - preserve-3d yok; filter ve mask dinlenmede kapalı.
   - **Hayaletler**, çevirme başına en çok 3; yarım boyutta yerleşip scale(2) ile büyütülür (raster ¼); içerik yalnız başlık çipi + pageNo:
     - d8→d9 (2,0 s): 2 "İçindekiler", 4 "Başkan'ın Mesajı", 6 "Cumhurbaşkanımızın Gençlik Vizyonu". 0,45–1,30 s akar; ardından polaroid dalışı + 100.000+ sayacı + yeni "50+" (0 → 50).
     - d9→d10 (1,8 s): 9 "Gençlik Şölenleri", 10 "Kapanış Konuşması", 11 "İklim Eylemleri". 12/12 öğeleri 120 ms aralıklarla gelir.
     - Isınma: d8 varışında 0,003 opaklık.
   - Yedek: `?brosur=duz` (eski scaleX).
   - Polaroid sarkacı ve kapak yörüngesi aynen.
6. **KadrajOkumasi:** "sayfa n/12" hayaletlerle adım adım akar (2…7 → 8; 9…11 → 12).
7. **Kapanış:** atıflara "Stant görünümü temsilîdir." eklenir; müşteri baskıyı teyit ederse çıkarılır.
8. **Reduced-motion ve poster kipi:**
   - Reduced-motion: d1, d2 ve d11 posterlerinin üstünde statik SVG (yaylar, işaretler, bağlar, künye; halka yok). d6/d7 için poster + bant + tam liste; iklim listesi d6 altında. Broşür kartları kapak, 8/12, 12/12; menteşe yok.
   - Poster kipi (Save-Data, 2g/3g): 900 ms poster sönmesi; DOM menteşe kalır.
9. **klipler.ts / manifest şeması (W1 ile K0 arasında sözleşme; `surum: 2`):**
   - `Durak.rol`: `"lombar" | "dunya" | "emanet" | "expo" | "anatomi" | "sutunlar" | "duvar" | "brosur-kapak" | "brosur-sayfa" | "brosur-arka"`. Oynatıcı, CSS ve Brosur dizinleri yalnız `rol`'den ve tablo sırasından türetilir; `id` "d0"…"d11" kalır.
   - `Etiket.tur` += `"kunye" | "emanet"`; `emanet` etiketinde `no` (1–12), `donem` (emanet.ts dönem anahtarı), isteğe bağlı `dx`/`dy` (video px ofset); `metin` boş (ad yazılmaz). `kunye` etiketinde `metin` SSR satırı ("9–20 Kasım 2026").
   - `Ozel.yaylar?: Record<Boyut, readonly (readonly Nokta[])[]>` — her yay video px'te ≤ 24 nokta, uzuv arkası kırpılmış, son nokta Antalya; d1 ve d11'de aynı veri (manifest-birlestir `render-son/yaylar.json`'dan okur). `istemciManifesti` `etiketler` gibi `ozel.yaylar`'ı da siler.
   - `Ozel.duvarCapalari?: readonly { ad: string; dikey: Nokta; yatay: Nokta }[]` — d6 kılavuz çizgileri için p6 çapaları (`fidan`, `genc_iklim`, `orman`).
   - d6/d7: `tur: "klip"`, `dongu: null`, `poster` son-kare, `okuma` kare kare (gelen geçiş), `okumaDurak` "arka duvar · ~3 m" / "sol duvar · ~3 m".
   - Klip adları: t56, t67, t78 (ileri), r65, r76, r87 (geri); posterler p6, p7 (son-kare), p8 (eski p6 plakası, dosya aynı). `brosurDikdortgen`/`kapakTon` D[8] (rol `brosur-kapak`).
   - **Sahiplik:** `klipler.ts`, `manifest-birlestir.mjs`, `docs/klipler-sema.md` → W1; `kodla.mjs`, `kodlama-dogrula.py`, `kapak-ton.py`, `t34-birlestir.py` → K0. İki taraf da bu maddeyi okur, birbirinin dosyasına dokunmaz.
10. **Bütçe:** rota JS 17,8 → ~20,5 kB gz (≤ 50 ✓); HTML +6–9 kB gz.

### 12.5 K-E kodlama

**CRF politikası** (H.264 / HEVC / AV1; yalnız değişenler yeniden kodlanır):

| Grup | H.264 | HEVC | AV1 | Not |
|---|---|---|---|---|
| İleri taban (t12, t45) | 23 | 25 | 30 | değişmez |
| t23 / t34 | 26 | 27 | 32 / 34 | değişmez |
| **Duvar ileri** t56, t67, t78 | 23 | 25 | **32** | AV1 +2 (oturum bütçesi) |
| Döngü l4 | 23 | 25 | 30 | |
| **l2** | 23 | 25 | **32** | AV1 368 kB, H.264'ten büyük |
| **l3** (yalnız yeniden kodlama, dikey + yatay) | 23 | 25 | **34** | 32'de VMAF 97,1 ölçülmüştü |
| Geri taban r21, r43, r54 | 26 | 28 | 34 | |
| **r32** | **27 → 26,5 (F, §12.10)** | 28 | 34 | H.264 d3 penceresi için; 27'de VMAF 89,8 < 90 |
| r21 (F) | **27** | 28 | 34 | F: yatay H.264 d2 penceresi 2,504 → 2,454 |
| **Duvar geri** r65, r76, r87 | 26 | 28 | **36** | AV1 +2 |

- **Posterler:** p2 ve p4 q80. p6/p7 için q80'e göre ΔE00 ≤ +1,0 kalan en düşük kalite (q68–80), hedef ≤ 60 kB dikey. **E teslimi q80 (§12.6 başlık bölgesi sınırı öncelikli; "oto" q68'i seçip ΔE00 2,13–2,30 veriyordu); F'den beri `kodla.mjs` tabanı p6/p7 80 (§12.10).** p8 = eski p6 dosyası, yeniden kodlanmaz.
- **Yeniden kodlanmayanlar:** t01, l1, r10, p1, p3, l5, p5, kart.
- **kodla.mjs:** açık ad tablosu, `son-kare` poster tipi. **manifest-birlestir:** 12 durak + rol; `D.gelen === "t56"` → "t78"; brosurDikdortgen/kapakTon D[8]; ETIKET d1 `kunye`, d2 `emanet` ×12 + Antalya; ozel.yaylar/baglar/duvarCapalari. **kapak-ton.py:** girdi t78 son karesi. **kodlama-dogrula.py:** HEDEF zinciri ve aralıklar yeni zincire göre.

**Bayt tahmini** (AV1 dikey kB; D ölçümünden ölçeklendi; duvar klipleri t45/t56 kB/s oranından):

| Kalem | D → E | Δ |
|---|---|---|
| S1: t12 470→490, l2 368→345, t23 1.281→1.350, r21 359→374, r32 1.127→1.187, p2 68→78 | | +153 |
| S2-C1: t34 1.042→1.077, r43 1.003→1.031, l4 210→245, p4 45→53, t45 602→647, r54 473→505 | | +183 |
| Duvar: t56 356, r65 278, p6 60, t67 285, r76 222, p7 60, t78 343, r87 267, p8 25 (eski t56 + r65 + p6: 692) | 692 → 1.896 | +1.204 |
| l3 CRF 34 | 498 → 448 | −50 |
| Broşür iklim görselleri (ölçülmüş: fidanDikimiEkip 104 + copToplamaOrman 200) | | −305 |
| DOM (HTML/JS) | | +10 |

**Bütçe karşılaştırması:**
- **AV1 tam tur oturumu: 10,76 → ~11,96 MB** (aralık 11,6–12,3; sınır ≤ 12,0). Sınırda; kapı §12.7-1.
- **Dikey set:** AV1 ~10,98 · H.264 ~13,0 · HEVC ~10,1 MB (≤ 15 ✓).

| Durak | Kritik yol (ileri + döngü + poster) | Pencere (+ geri) |
|---|---|---|
| d1 | 0,91 ✓ | 1,09 ✓ |
| d2 | AV1 1,97 / H.264 1,94 / yatay AV1 2,06 (≤ 2,1 ✓) | 2,34 / 2,41 ✓ |
| d3 | 1,38 ✓ | AV1 2,56 (istisna ≤ 2,6 ✓) / H.264 2,48 (≤ 2,5 ✓) |
| d4 | 0,84 ✓ | 1,87 ✓ |
| d5 | 0,42 ✓ | 0,92 ✓ |
| d6 | 0,35 ✓ | 0,62 ✓ |
| d7 | 0,65 (broşür görselleri dahil) ✓ | 0,87 ✓ |
| d8–d10 | ≤ 0,03 ✓ | r87 0,27 ✓ |

- **İlk yükleme:** AV1 tanım 1,90 → ~1,93; H.264 W 2,26 → ~2,30 (≤ 2,5 ✓).
- **CPU süresi:** ~25 dk kodlama + ~10 dk VMAF ve doğrulama.

### 12.6 Kabul ölçütleri

**Dikişler** (master ΔE00 ≤ 0,3; kodlanmışta ≤ 3):
- S1: t12[0]↔l1[0], t12[59]↔l2[0], l2 döngüsü, l2[0]↔t23[0], t23[83]↔l3[0].
- S2: t34 47↔48 fark 0, t34[71]↔l4[0], l4 döngüsü, t45[59]↔l5[0], l5[0]↔t56[0], t56[59]↔t67[0], t67[47]↔t78[0].
- **t78[65] ↔ eski t56[71] ≤ 0,05**: p8, brosur_dikdortgen, renk.py RECT ve kapakTon'un yeniden kullanım koşulu.

**Eşleşmeler:**
- Kapak DOM↔video −0,5…0,5 px.
- d10→d11 dalışı 0 px; lombar ≤ 2 px.

**Hata düzeltmeleri:**
- Körfez yaması: t23 k24 master'da sınır sıçraması 2,3/255 → **≤ 0,5/255**.
- t12 k10–30: radyal kesitte disk kenarı ile hale tepesi arasında ≥ 3/255'lik çukur yok (kopuk şerit yok).
- Katara: §11.8-1 (±10/255).
- t23 kare 0–60 luma ≥ %20.

**Rölyef:** d2 posterinde sırt gölgeleri güneşin geldiği yön olan güneybatıyla tutarlı; ters gölge yok (gözle + kontak).

**Bayt:** §12.5 sınırları. Ölçüm: mobile-av1 4G, önbellek kapalı, oturum ≤ 12,00 MB; 5 set × kritik/pencere/ilk yükleme/set.

**VMAF:**
- Her dosyada ortalama ≥ 90.
- l3 CRF 34 ≥ 93.
- Duvar klipleri ortalama ≥ 90 ve en kötü kare ≥ 80.
- Kodlanmış p6/p7 ve t56/t67 son karelerinde başlık/rakam bölgesinde master'a göre ΔE00 ortalaması ≤ 2.

**Okunurluk** (p6/p7, dikey): başlık büyük harfi ≥ 40, rakam ≥ 60, ikincil ≥ 24 video px.

**Perf** (prod, 4× CPU, 24 adım 0→11→0, mobil dokunma + masaüstü tekerlek, 2 + 2 koşu):
- fps ≥ 59,5; uzun kare (> 50 ms) ≤ 3; düşen kare ≤ 1/1.000.
- Yay/emanet varış penceresinde boyama ≤ 4 ms p95 ve kare ≤ 33 ms p95.
- Menteşenin ilk karesi ≤ 33 ms; çevirme penceresinde uzun kare 0; katman belleği artışı ≤ 15 MB.

**Diğer:**
- Scrim ≥ 4,5:1 (scrim-olc: d2, d6, d7).
- WebKit stale/tuzak (apple.mjs) geçer.
- Kiosk turu 115–125 s.
- S2 VRAM tepesi ≤ 7,6 GB.
- Kontak sayfaları: g-1→2, 2→3, 5→6, 6→7, 7→8, 8→9, 9→10.

### 12.7 Riskler ve geri dönüş planı

| # | Risk | Tetik | Geri dönüş |
|---|---|---|---|
| 1 | AV1 oturumu aşar | Ölçüm > 12,00 MB | (a) r65/r76/r87 AV1 CRF 37 + t67 AV1 33 (VMAF ≥ 90 ve okunurluk tutarsa; ~−55 kB). (b) Hâlâ > 12,00 → **K3:** d7 kalkar, t67 + t78 yerine A → banko tek klip, B duvarının önünden (2,6 s, 78 kare, ~7 dk GPU). Durak sayısı 11'e iner (rol tablosu sayesinde manifest ve Bolum değişikliği), ~−0,5 MB. |
| 2 | t12[0]↔l1[0] tutmaz | > 0,3 | `c1_ek_k` ve `rolyef_k` rampaları D1'de 0'a sabitlenir; yine tutmazsa C1 genişletmesi yalnız alt < 3.000 km. |
| 3 | t23[83]↔l3[0] tutmaz (yama) | > 0,3 | Yama kenar alfası Expo çevresinde 0; tutmazsa l3 yeniden render (~12 dk). |
| 4 | t78 sonu eski t56'dan sapar (duvar yansıması) | > 0,05 | p8 plakası yeniden (1 kare) + kapak-ton + RECT + FLIP ölçümü (+~5 dk). |
| 5 | Kamera çarpması ya da aşırı bulanıklık | Pay < 0,25 m ya da önizlemede iz | t56 2,2 s (+~35 kB); t67 pan 55°'ye iner. |
| 6 | Rölyefte çift gölge | Önizleme | Güç 0,15; sürerse rölyef kapalı (−~60 kB). |
| 7 | Menteşe ya da hayalet perf | Ölçüt dışı | Hayalet 3 → 1, ardından `?brosur=duz`. |
| 8 | SVG yay boyaması | > 4 ms p95 | Önceden çizili yollar + yalnız opaklık kademesi. |
| 9 | VRAM | > 7,6 GB | Duvar dokuları 400 px/m; yıkama spotlarında gölge çözünürlüğü yarıya. |
| 10 | Yeniden numaralamada atlanan dizin | stale/tuzak ya da kiosk | Rol tablosundan türetme; eksik seçici tek tabloda düzeltilir. |
| 11 | Müşteri duvarda parti içeriğini reddeder | §12.8 yanıtı | B duvarında yalnız ekran + dağ şeridi kalır; dokular + t34b/l4/t45/t67/t78 yeniden (~30 dk GPU). |
| 12 | Kullanıcı E0'da başka kusur gösterir | Teslim sonrası | F turu (ör. sepya leke: t01 + l1 +7 dk, lombar ve kart yeniden ölçülür). |

Gerçek iPhone testi açık kalır; memory'deki madde kapatılmaz.

### 12.8 Müşteriye sorular (onay-listesi §14.1'e)

1. Arka duvar ("İklim Eylemleri / 300 fidan / Genç İklim"), sol duvar ("1.000.000+ / 81 / 922", iki ekranda "Sen de söz ver.") ve ön cephe giriş pankartı gerçek standa basılacak mı? Yanıt gelene kadar kapanışta "Stant görünümü temsilîdir." satırı durur.
2. Gençlik Kolları sayıları ve Üsküdar GK Hatıra Ormanı, d4'ten itibaren duvarda görünüyor. Uygun mu?
3. Giriş pankartı PDF'te başka bir cephede. Ön cepheye uyarlanması uygun mu? Cephelere AK Parti GK logosu konsun mu (şu an yok)?
4. Duvarda yalnız Hatıra Ormanı tabelası var (insansız). İnsanlı fidan ya da orman karelerinin duvara basılmasını ister misiniz?
5. Yeni metinler: d2 "12.000 yıl önceden bugüne." (totem satırı kısmen okundu) ve "From 12,000 years ago to today."; "Climate Action"; "Sen de söz ver." (PDF'te yok) ve "Make your pledge too."; girisMetni[1]'in d4'ten d2'ye taşınması.
6. d1'deki yaylar 1995–2025 COP ev sahibi 27 kentten çiziliyor (adsız). Künyede "Açılışa N gün / COP31 · N. gün" satırı var. Uygun mu?
7. d2 haritasında 02, 10 ve 12 numaralı alanlar (PDF'te yok) belirgin görünüyor. Belgrad 1 / Göbeklitepe 12 numaralandırması doğru mu?
8. İklim sayfası (11/12) broşür turundan çıkıp arka duvara taşındı. Hayalet sayfalarda "Cumhurbaşkanımızın Gençlik Vizyonu" başlığı görünüyor. Uygun mu?
9. "Genç İklim" (content.ts) ile pankarttaki "GençİKlim" aynı program mı? Duvarda hangi yazım kullanılsın?

### 12.9 Orkestratör kararları (3 Kasım 2026, ~15.15) ve iş kırılımı

1. **Paket:** jüri kazananı "anlatı-önce" (ağırlıklı 7,68 / 6,93; bütçe jürisi "DOM-önce"yi 7,05 ile öne aldı) + aşılar:
   ışık devri (`kuzey`/`bati`), ön cephe pankartı, 3/4 duvar kadrajı, ölçülebilir hata ölçütleri, E0 kontak sayfaları,
   ters yaylar d11, ölçülmüş broşür tasarrufu. Yıldız, Blender yay/sütun, Blender broşür, eğik d2, global CRF 36 **reddedildi**.
2. **Numaralama:** d0–d11 yeniden numaralanır; durak tablosu `rol` ile veriye taşınır (§12.4-1, §12.4-9). Geçici "d5a" yok.
3. **Bütçe kapısı:** ölçülen mobil AV1 oturumu ≤ 12,00 MB. Aşarsa §12.7-1 (a) merdiveni F turunda uygulanır; (b) K3 (d7'nin
   kalkması) **orkestratör kararıdır**, ajanlar kendiliğinden uygulamaz.
4. **Render yedekleri:** S1 t12/l2/t23 ve S2 t34b/l4/t45/t56/p6 D master'ları `render-son-d\` altına **kopyalanır**
   (sabit bağ değil; §11.8 tuzağı). Eski p6 plakası master'ı `p8` adıyla taşınır (S2c).
5. **Sahiplik ve portlar:** W1 3100, W2a 3101, W2b 3102, D/M 3103 (ve W bitince 3100). Port 3000 kullanıcının; dokunulmaz.
   GPU işleri yalnız S1b ve S2c; ikisi de `.gpu-kilit` protokolüyle (brief §9.3) ve asla eş zamanlı değil.
6. **Teslim:** D-E kapısı (bütçe, perf, dikiş, okunurluk, scrim, stale/tuzak) geçince orkestratör doğrular, commit eder,
   `origin/main`'e gönderir; Vercel kullanıcıda.

| Ajan | İş | Bağımlılık |
|---|---|---|
| **E0** | Mevcut D setinden (master PNG + kodlanmış dikey AV1) t12 k10–30, t23 k16–60, d1 üst kenar kontak sayfaları → `.qa/icinden3/e0/`; kuşkulu kareleri işaretler | yok |
| **S1a** (CPU) | `yaylar.py` → `render-son/yaylar.json`; `kamera.py` D2; `hazirla.py` (c1 genişletme, rölyef, körfez yaması); `sahne.py` CAPALAR p2, bump, hale; `--sadece_json` ile d2 çapaları | yok |
| **S1b** (GPU) | EEVEE önizleme 960² → kusur denetimi → Cycles son t12/l2/t23 → dikişler, §12.6 ölçütleri | S1a |
| **S2a** (CPU) | `dokular.mjs` 4 doku (500 px/m) → `D:\soft\cop31-varlik\s2\doku\` | yok |
| **S2b** (CPU) | `sahne.py`: paneller, 6 yıkama spotu, `kuzey`/`bati`, t56/t67/t78 kameraları, KLIPLER, json_yaz, p6/p7 son-kare, çarpışma betiği, son.sh/onizleme.sh | yok (doku adları §12.3) |
| **S2c** (GPU) | eski p6 → p8; önizleme 960² (VRAM, okunurluk, ışık, t78 sonu ≡ eski t56[71]) → son render (t34b, l4, t45, t56, t67, t78, p4, p6, p7) → parlama + t34-birlestir → dikişler | S2a, S2b |
| **W1** | Rol tablosu göçü, şema (§12.4-9), `manifest-birlestir.mjs`, geçici 12 duraklı `klipler.json` (eski dosyalarla), d6/d7 Bolum'leri, kiosk, Home/End, reduced/poster kipi, kapanış satırı, `klipler-sema.md` | yok |
| **W2a** | `DunyaYaylari.tsx`, `kunye`/`emanet` etiketleri, varış dizileri ve bağlar, d2 bandı, d11 ters yaylar, reduced statik SVG | W1, S1a |
| **W2b** | `Brosur.tsx` menteşe, hayaletler, kalkma, gölge, "50+" sayacı, `?brosur=duz`, SAYFALAR 3, KadrajOkumasi sayfa akışı | W1 |
| **K0** (CPU) | `kodla.mjs` açık ad tablosu + son-kare + §12.5 CRF; `kodlama-dogrula.py` zinciri; `kapak-ton.py` t78 | yok |
| **K1** | S1 klipleri + r21/r32 + l3 (AV1 34) + p2; VMAF | S1b, K0 |
| **K2** | S2 klipleri + geri + p4/p6/p7 + p8; kapak-ton; `manifest-birlestir` (son); `kodlama-dogrula`; VMAF; bayt tablosu; artık dosya temizliği | S2c, K1, W1 |
| **D1 / D2 / D3 / M** | Tasarım-görsel · motor-perf-WebKit · içerik-lisans-depo denetimleri; M: 4G bayt (5 set), perf, kiosk, scrim, dikiş, kontak sayfaları | K2, W2a, W2b |
| **F** | Site/kodlama düzeyinde düzeltmeler; render gerektirenler orkestratöre | D1–D3, M |
| **M2** | F sonrası yeniden ölçüm (perf, stale/tuzak, bayt, tsc/eslint/build) | F |

GPU sırası beklenen: S1 önizleme (3 dk) → S2 önizleme (6 dk) → S1 son (31 dk) → S2 son (32 dk); toplam ~75 dk.
Tahmini duvar saati 4,5–5 saat.


### 12.10 E turu sonucu (D1/D2/D3/M denetimi + F düzeltmeleri, 3 Kasım 2026)

Ortam: prod (`COP_DIST=.next-e next build`, `next start -p 3100`), Chrome headless (playwright-core), gerçek cihaz değil.
MB = 10^6 bayt. "M" = F öncesi ölçüm (`.qa/icinden3/e/olcum-M.json`); "F" = F düzeltmelerinden sonra (`.qa/icinden3/e/f/`).

**1. Kapılar**

| Kapı | M (F öncesi) | F sonrası | |
|---|---|---|---|
| mobile-av1 tam tur oturumu ≤ 12,00 MB (4G) | 11,953 (×2) | AV1 dosyası değişmedi; hesap 11,953 | ✓ (§12.7-1 merdiveni gerekmedi) |
| İlk yükleme ≤ 2,5 | AV1 1,798–1,942 · H.264 2,038–2,252 | aynı | ✓ |
| Kritik yol ≤ 1,8 (d2 ≤ 2,1) | maks 2,045 (d2) | aynı | ✓ |
| Pencere ≤ 2,5 (AV1 d3 ≤ 2,6) | **yatay H.264 d2 2,504 ✗** | r21 H.264 CRF 27: yatay d2 **2,454**, dikey d2 2,406; r32 CRF 26,5 ile H.264 d3 2,423 / 2,428 | ✓ |
| Set ≤ 15 / kodek | maks 12,695 (dikey H.264) | 12,714 | ✓ |
| VMAF her dosya ort. ≥ 90 | **r32 H.264 89,83 / 89,54 ✗** | r32 H.264 CRF 26,5: **91,07 / 90,93** (en kötü kare 78,58 / 78,96); r21 H.264 CRF 27: 92,30 / 92,17 | ✓ |
| Dikiş (kodlanmış ≤ 3) | ✓ | r21/r32 geri dikişleri yeniden: son ↔ varış posteri 1,66–2,38, son ↔ döngü 0. kare 1,14–2,15 | ✓ |
| Scrim ≥ 4,5:1 | 33/33 | 12/12 (d2, d4, d6, d7 × 390×844, 1280×800, 844×390; yeni yerleşimler). En dar pay: D d7 0,048, m d7 0,049, D d6 0,052 | ✓ |
| d2 yatay scrim dikişi (D1-04) | x 706→708 luma adımı +22,8 (satır 720–780) | +2,5 (scrim gizliyken de +2,5) | ✓ |
| Kapak / lombar / kiosk | ✓ (0,004 px · ≤ 0,76 px · 120,1 s) | F bunlara dokunmadı (kiosk turu yalnız ileri geçiş kullanır) | ✓ (M2 yeniden ölçmeli) |
| Perf düşen kare ≤ 1/1.000 | **mobil 3, masaüstü 4 / 1.044 ✗** (tek koşu, eşzamanlı yük) | 4× CPU, 0→11→0, 22 adım, 2 + 2 koşu (`perf-F1/-F2`): mobil dokunma **0 ve 2** / 1.044, masaüstü tekerlek **2 ve 5** / 1.044. Düşenler ileri kliplerde de (1→2, 2→3) ve r10'da (11→10, 1→0; hız 1,0'da da) | ✗ (4 koşunun 3'ü; §3) |
| Perf fps / > 50 ms kare | 59,9 / mobil 1 (7→8) | fps 59,8–59,9; > 50 ms kare mobil 1 + 1 (7→8: 59 / 70 ms), masaüstü 0 + 2 (7→6: 53 / 57 ms) | ✓ |
| Katman belleği artışı ≤ 15 MB (3b − duz) | d8 +10,73 … d9 +13,18 | d8 +12,01 · 8→9 +12,42 · d9 +12,18 · 9→10 +5,54 · d10 +5,51 (koyulaşma gradyanı + hayalet düzeni dahil) | ✓ |
| Rota JS ≤ 50 kB gz | 23,0 | **20,9** (data.ts istemci paketinden çıktı, D2-04) | ✓ |
| HTML gz (bütçe +6–9 kB, D'ye göre) | 54,9 (+12,3) | 55,5 (+12,9; hayalet düzeni +0,6) | ✗ (orkestratör kararı, aşağıda) |
| eslint (argümansız, tüm proje) | 577 dosya, 979 hata (`.next-*` derleme çıktısı) | 83 dosya, 0 hata, 0 uyarı | ✓ |
| tsc / build | ✓ | ✓ | ✓ |

**2. F'de değişenler** (bulgu id'leriyle; ayrıntı F raporu):
- Yatay bant yerleşimleri (icinden3.css "yatay köşe bantları"): d6/d7 duvar bandı sağ altta, dağ şeridi/bank üstünde
  (yatay telefonda sol altta, `--a` 0,84), başlık ikincil boy (28 px; telefonda 20 px), metin ≤ 560 px (D1-01, D1-12'nin
  ikinci seçeneği yalnız yatayda). d4 bandı sol üstte (D1-03). Yatay telefonda d1 bandı sağda ≤ 300 px ve üstte, d2 bandı
  sağ altta, başlık tek satır (D1-07). Scrim'ler bir yönden doğrusal + öteki yönden maske (elips köşe sorunu yok).
- d2 yatay scrim elipsi son durak 83% (D1-04). Yatay duvar duraklarında kadraj okuması koyu, halesiz (D1-15).
- Duvar durağında kılavuz yok (D1-11; `ozel.duvarCapalari` manifestte kalır, §12.4-4'ten sapma).
- d1 varış halkası tek, 2,1 s'de, #FFF1DC 2 px, 6 → 48 px (D1-05). d2 Antalya işareti d1'in 7 px çekirdeği (D1-06).
- Broşür: sayaçlar dalış bir kez bitince kilitli (geride akmaz), ileride son değerin %60'ından, "+" baştan; "50+" dalışın
  ikinci yarısına dek görünmez (D1-08). Hayaletlerde soyut düzen (gri çubuklar + görsel bloğu), koyulaşma sırttan kenara
  gradyan (0,15 → 0,5·sinθ; 1/40 genişlikte boyanıp gerilir), geride arka kapak öğeleri son hayalet örtene dek tam (D1-09).
- `hizGeri` 1,25 → 1 (D2-01): geri geçişler %25 uzun (ölçülen: 7→6 1,62 s, 11→10 / 1→0 1,82–1,84 s, 3→2 2,82 s, 8→7
  2,84–2,85 s). Künye satırı dakikada bir yeniden okunur (D2-02). Broşür ön ısıtmasında önce okuma sonra yazma (D2-03-1).
- r21 H.264 CRF 27, r32 H.264 CRF 26,5 (M-1, M-2; `kodla.mjs` CRF_TABLO); POSTER_Q_TABAN p6/p7 80 (D3-03).
- d4 `oyun` etiketi yalnız yatay (D1-14). `data-onay="en"` d6 duvar kopyasında (D2-08/D3-07). ALT.anatomi (D3-10).

**3. Tutmayanlar ve açık kalanlar**
- Düşen kare ölçütü (≤ 1/1.000) headless Chrome'da 4× CPU'da tutmuyor: F'de 4 koşuda 0, 2, 2, 5 / 1.044 (M: 3, 4). `hizGeri` 1,0 geri kliplerdeki sistematik 1 kareyi kaldırdı (D2: 1× CPU'da 8/1.044 → 0/1.044); kalan düşüşler ileri ve geri kliplere dağınık (headless çözücü + 4× kısıt; tahmin). Orkestratör: ölçüt 1× CPU'da ya da gerçek cihazda ölçülsün veya headless 4× için yeniden tanımlansın. Stale (gecikme 0/1/2) 3/3, tuzak senaryolarının hepsi geçti; yedek 0, konsol hatası 0.
- HTML gz D'ye göre +12,9 kB (bütçe +6–9). Orkestratör: bütçeyi +13 kB'a çekmek ya da reduced statik katmanlarını
  (1,44 kB gz) yalnız reduced kipinde üretmek.
- D2-03: (1) uygulandı; (2) broşürün `display:none` yerine `content-visibility:hidden`/`visibility:hidden` tutulması
  uygulanmadı (görsel kapıları ve her adımda stil yeniden hesabı riski; ayrı ölçüm ister). F ölçümü (`iz78 --varis 7`, 4× CPU mobil, 2 koşu): zorunlu yerleşim kalktı, ama aynı yerleşim bir sonraki karenin yaşam döngüsüne kaydı: d7 varış +814 / +809 ms'de 101,2 / 233,2 ms kare (Layout 79 / 161 ms; D2'de 82–85 ms). Yani (1) maliyeti kaldırmadı; dinlenme takılması sürüyor (kapı ölçütü yalnız geçiş pencerelerini sayıyor). (2) M2/orkestratör adayı.
- Render gerektirenler (bu turda yapılmadı): D1-02 (d7 "1.000.000+" ve yatay telefonda d6 başlığı üstten kesik → B pozu
  φ +7° ya da z +0,15 m; t67 kuyruğu + p7 + t78 başı, ~5 dk GPU, t78 dikişi yeniden), D1-10 (d6 dikey "Genç İklim" bloğu
  fotoğraf altyazısı gibi; doku + t56/p6/t67, ~10 dk GPU), D1-16 (t12 sepya leke, d2 dikey kadraj; kabul/F adayı).
- Gerçek iPhone testi açık (D2-10).

**4. Uygulama sapmaları (D3-09) ve notlar**
1. Broşür girişi: eğim 0 → −7° → 0 (girisEgri, e = 1/3'te tepe); brief §12.4-5 "−7° → 0" yazıyordu.
2. p6/p7 posterleri q80 (§12.5 "oto" kuralı §12.6 başlık bölgesi ΔE00 ≤ 2 sınırını bozuyordu; §12.6 öncelikli). F'den beri
   `kodla.mjs` tabanı da 80.
3. `ozel.baglar` manifest alanı yok: d2 bağları EmanetIsiklari'nde etiket konumlarından sunucuda çizilir (§12.4-3, -9).
4. Hayalet ısınması d8'de değil, son duvarın (d7) ön ısıtmasında başlar (kesişme karesinde raster olmasın).
5. Duvarda kılavuz yok (F, D1-11); geri klipler 1,0 hızla (F, D2-01); d4 `oyun` etiketi yalnız yatay (F, D1-14).
6. Kapanış bölümü "AK kimliği yalnız d0 üst şeridi + stant içi" kuralından muaf (v2'den beri; logolar, kurum adı, alıntı;
   D3-13). d1–d3 ve d11'de parti öğesi 0.
7. CSS kimlik eşleşmeleri (`data-etiket` / `data-metin` 0–11) elle yazılı: N > 12 olursa (yeni durak) icinden3.css'te
   iki listeye satır eklenmeli (D2-07; §12.7-10). TS tarafı rol tablosundan türer.
8. QA yöntemi (D1-17): geçiş ortası kareleri CDP `Page.startScreencast` ile alınmalı; `page.screenshot` programatik
   kaydırmada üst/alt beyaz bant üretir (sitede yok).
9. Poster kipinde adım kilidi klip süresi kadar (1,0–2,9 s), sönme 900 ms (D2-09): brief metni mi, kod mu düzelecek,
   orkestratör kararı.

### 12.11 Orkestratör kapanış kararları (3 Kasım 2026, ~20.30; E turu commit'inden önce)

Aşağıdakiler §12.6/§12.10'daki açık kapıları kapatır; §12.6 ile çelişirse bu bölüm geçerli.

1. **Düşen kare ölçütü** (§12.6 "≤ 1/1.000"): kapı **1× CPU'da ya da gerçek cihazda** ölçülür (M2: 0/1.044 + 0/1.044). 4× CPU
   headless sonucu bilgi satırıdır (M2: 1, 2, 1, 6 / 1.044; F: 0, 2, 2, 5; toplam ≈ 2,4‰). Gerekçe: düşüşler ileri ve geri
   kliplere dağınık, hız 1,0'da da var, 1× CPU'da sıfır; headless çözücü + 4× kısıt kaynaklı (tahmin). fps ≥ 59,5 ve
   > 50 ms kare ≤ 3 kapıları 4× CPU'da kalır (ikisi de ✓).
2. **HTML gz bütçesi**: D'ye göre **+13 kB** (ölçülen 55,5 kB, +12,9). Reduced statik katmanları (1,44 kB gz) her kipte
   üretilmeye devam eder (reduced kipinde ilk boyama için gerekli; ayrı üretim rota JS'ine koşul ekler).
3. **Geri geçiş süresi**: `hizGeri` 1,0 ile 3→2 2,82–2,84 s ve 8→7 2,85 s **kabul**; sınır geri geçişler için "≤ 2,9 s"
   olarak okunur (+0,02–0,05 s algılanmaz). Zaman sıkıştırarak yeniden kodlama (D2-01-b) reddedildi: VMAF ve bayt
   yeniden ölçümü ister, kazanç yalnız 0,05 s.
4. **D1-12**: duvar duraklarında DOM bandı dikeyde olduğu gibi kalır (başlık + özet; duvar yazısının okunur ve
   erişilebilir eşi). Yatayda F'nin ikincil boyu geçerli.
5. **D2-09**: kod kalır; brief metni düzeltildi: poster kipinde adım kilidi klip süresi kadar (1,0–2,9 s), çapraz sönme
   900 ms.
6. **D3-06**: hayalet sayfa başlıklarının kaynağı `src/components/brosur/data.ts` (aynı metin; §12.4-5 ile birebir)
   **izinli istisna**; başlıklar sunucuda prop olarak verilir (D2-04), istemci paketine girmez.
7. **D3-05**: `/icinden` temiz. `gencIklimPanel` ve `fidanDikimiGencler` öteki rotalarda (/dunya, /fidan, /nabiz, /brosur;
   5fa0394'ten beri) kullanılıyor; E kapsamı dışında, kullanıcıya soru olarak raporlandı.
8. **D2-03-2** (broşürü `display:none` dışında tutmak) uygulanmadı: d7/d11 dinlenmesindeki 101/233 ms kare geçiş
   penceresi dışında, kapı değil; ayrı ölçüm turu ister.
9. **D3-14**: E ölçüm araçları oturum scratchpad'inde kaldı (W1 harness `icinden3.mjs`, D2 harness, M `butce-e.py`,
   `kapak-piksel.mjs`, F `fqa.mjs`/`bellek2.mjs`/`iz78.mjs`, M2 `apple-ic.mjs`/`poster.mjs`/`shots.mjs`). Depoya taşıma
   sonraki tur.
10. **Render gerektirenler → E2 turu** (bu commit'ten sonra, ayrı commit): **D1-02** d7 "1.000.000+" üstten kesik
    (1280×800 ve 1920×1080'de de; kiosk yatay) → B pozu (ve gerekirse A) yukarı; t56?/t67/p7/t78 yeniden render; t78[65]
    ≡ eski t56[71] korunur; kodlama t56/r65/p6/t67/r76/p7/t78/r87 + manifest + bütçe (pay 45 kB; gerekirse §12.7-1 (a)).
    Aynı turda CSS: 1280×800 d3 scrim kenarı x≈650 kırık çizgi (yumuşak durak). **D1-10** ve **D1-16** kabul; onay
    listesinde soru.
11. **Commit**: `git add -A src scripts docs public/icinden .gitignore next.config.ts eslint.config.mjs`; 68 eski D medya
    dosyası silinir, 92 yeni E dosyası eklenir; `.next-*`, `tsconfig.next-*.json`, `.qa/` izlenmez.

### 12.12 E2 turu (yatay kırpım rampası, render yok; denetim D1-02, 3 Kasım 2026)

§12.11-10'daki D1-02 render yerine kodlamada çözüldü: yatay teslimin kırpım ofseti (`kirpimY`, master px) duvar
kliplerinde rampa (`kodla.mjs` `KIRPIM_Y`; easeInOutCubic, `manifest-birlestir.mjs` `kirpimYKare` aynı eğri). Geri klipler
ileri klibin nesnesini ileri kare numarasıyla kullanır, ters rampa `reverse`'ten gelir (r43'teki gibi; kodda doğrulandı).
Dikey dosyaların hiçbiri değişmedi. Ortam: prod `.next-e2`, `next start -p 3103`, headless Chrome (playwright-core);
QA çıktıları `.qa/icinden3/e2/k/`.

**1. Ölçüm (master PNG16, `render-son`) ve seçim**

| | Glif üstü | Alt sınır | Kısıtlar → aralık | Seçilen |
|---|---|---|---|---|
| d7 (t67[47] ≡ p7/k_0000) | "1.000.000+" y **401** (x 560–640) | "Sen de söz ver." ekranlarının alt kenarı y **1161** (x 568–1381) | (a) ≤ 341 · (b) ≤ 265 · (c) ≥ 201 | **Y7 = 233** |
| d6 (t56[59] ≡ p6/k_0000) | "İklim Eylemleri" y **454** (x 1240–1280; "leri") | "İstanbul" alt kenarı y **1228** (x ≤ 1388) | (b) ≤ 318 · (c) ≥ 268 | **Y6 = 293** |

(a) 1280×800 ve 1920×1080'de glif üstü ≥ Y + 60; (b) 844×390'da (cover üst/alt 96 master px keser) ≥ Y + 96 + 40;
(c) alt sınır ≤ Y + 1080 − 96 − 24. İkisi de aralığın ortası (üst ve alt payları eşit). d6 koşulu sağlandı (844×390'da
başlık önceden −27 css px, yani kesikti) → d6'ya da uygulandı.

| Klip | `kirpimY` | Not |
|---|---|---|
| t56 (r65) | `{420 → 293, 30 → 59}` | t56[0] ≡ l5[0] 420'de |
| p6 | 293 | t56[59] |
| t67 (r76) | `{293 → 233, 0 → 47}` | |
| p7 | 233 | t67[47] |
| t78 (r87) | `{233 → 420, 0 → 40}` | 41–65 = 420: `brosurDikdortgen`, `bankoDonusum`, p8 dikişi aynı |

**2. Glif payı** (ekran görüntüsünde ölçülen glif üstü → çerçeve üstü, CSS px; geometriden beklenenle ±1 px)

| Görünüm | d7 "1.000.000+" E → E2 | d6 "İklim Eylemleri" E → E2 | Alt sınır → çerçeve altı (E2) |
|---|---|---|---|
| 1280×800 | 0 (kesik; beklenen −14) → **124** | 25 → **120** | d7 ekranlar 113 · d6 "İstanbul" 107 |
| 1920×1080 | 0 (kesik; −19) → **168** | 34 → **161** | 152 · 145 |
| 844×390 | 0 (kesik; −51) → **32** | 0 (kesik; −27) → **29** | **24** · **21** |
| 390×844 | değişmedi (piksel farkı 0; d3/d6/d7) | | |

Master px karşılığı: d7 168 (a, ≥ 60 ✓), 844×390'da 72 (b, ≥ 40 ✓); d6 161 / 65 ✓. (b)'de kalan açık yok.

**3. DOM bandı** (`icinden3.css` "Yatay köşe bantları"): kırpım yukarı alınınca duvar yazısı kadrajın altına dek iniyor
(1280×800'de d7 ekranları x 350–952, y 498–687; F'nin sağ alt bandı x ≥ 680, metin y ≥ 646 → çakışırdı). Duvar bandı her yatay ekranda
**sağ sütuna**, duvar yazı bloğunun (master x ≤ 1390) sağına alındı: genişlik `50vw − 0,2292·--wv − --yan`
(`--wv = max(100vw, 100vh·16/9)`, cover video genişliği; master x 1400'ün CSS karşılığı), yan sönüm sütunun içinde
(ekrana/yazıya açık scrim düşmez). Yatay telefonda (≤ 480 px) sol alt (F) kalktı, sağ sütun, `--sonum` 24 px. 4:3–3:2
(iPad yatay) ayrı: başlık 22 px, gövde 14 px, genişlik ≥ 176 px. Ölçülen bant metin kutusu ↔ duvar içeriği: 1280×800,
1920×1080, 844×390, 1024×768'de d6/d7'de kesişme yok (yatay ara 30–88 px); 1024×768 d6'da sönümün en sol 2 px'i
(α ≈ 0) "İstanbul" bloğunun sağ kenarına değiyor. Başlık boyları: 28 px (≥ 3:2), 22 px (iPad), 20 px (telefon).

**4. d3 scrim kenarı** (§12.11-10 CSS; M2 gözlemi x ≈ 650 kırık çizgi): varsayılan yatay bandın sol sönümü
(`--sonum` + 40 px) doğrusal yerine smoothstep (3t² − 2t³) eğrisinde 16 parçalı durak. Gök sütun profili (1280×800,
satır 4–30): luma x 640/660/680 226,7 / 216,4 / 197,5 → 226,7 / 223,7 / 209,9; sol uçta eğim atlaması 0,725 → **0,207**/px,
sağ uçta 0,904 → **0,099**/px (1920×1080: 0,798 → 0,241, 0,827 → 0,049); en dik eğim 1,15 → 1,51/px (smoothstep ortası);
4 px pencerede en büyük eğim değişimi 1,05 → 0,67. Metin düzlükte; scrim-olc d3 ✓ (aşağıda). Dikey değişmedi.

**5. Kodlama** (CRF_TABLO değişmedi; 14 yatay dosya, 29 s)

| Dosya (yatay) | H.264 E → E2 (B) | AV1 E → E2 (B) | VMAF ort / en kötü kare H.264 · AV1 |
|---|---|---|---|
| t56 | 632.746 → 636.100 | 401.462 → 406.278 | 99,23 / 88,60 · 99,63 / 93,68 |
| r65 | 543.431 → 549.237 | 314.171 → 318.325 | 98,71 / 89,16 · 99,43 / 92,72 |
| t67 | 338.233 → 336.399 | 218.077 → 220.603 | 99,22 / 90,06 · 99,64 / 93,39 |
| r76 | 246.946 → 243.934 | 176.337 → 177.453 | 98,65 / 83,78 · 99,57 / 93,42 |
| t78 | 569.171 → 583.360 | 293.994 → 301.227 | 99,80 / 93,98 · 99,84 / 94,83 |
| r87 | 393.318 → 394.391 | 229.538 → 233.174 | 99,03 / 86,39 · 99,48 / 89,14 |
| **Toplam** | 2.723.845 → 2.743.421 (+19.576) | 1.633.579 → 1.657.060 (+23.481) | hepsi ≥ 90 ort., duvar en kötü ≥ 80 ✓ |

Posterler (WebP q80): p6 44.924 → 44.364, p7 30.704 → 27.178 (−4.086 B). Eski 14 dosya `--artik` ile silindi (4,433 MB).

**6. Kapılar** (`kodlama-dogrula.py --temel 0.673 --oturum-temel 0.989`, `dogrula-render-son-E2.json`; MB = 10^6 B)

| Kapı | F (E commit) | E2 | |
|---|---|---|---|
| Yatay H.264: ilk / kritik maks / pencere maks / set | 2,038 / 2,045 (d2) / 2,454 / 12,429 | 2,038 / 2,045 / 2,454 / **12,445** | ✓ |
| Yatay AV1: ilk / kritik maks / pencere maks / set / oturum | 1,798 / 2,045 / 2,519 (d3) / 10,870 / 11,859 | 1,798 / 2,045 / 2,519 / **10,889** / **11,878** | ✓ |
| Yatay AV1 d6 / d7 kritik · pencere | 0,249 / 0,322 · 0,563 / 0,499 | 0,248 / 0,329 · 0,566 / 0,507 | ✓ |
| mobile-av1 (dikey) oturum | 11,953 | 11,953 (dikey dosya değişmedi) | ✓ |
| Dikiş (kodlanmış ≤ 3), yatay H.264 / AV1 | | t56→p6 1,65 / 1,47 · t67→p7 1,53 / 1,44 · d6 t56son↔t67[0] 1,25 / 0,94 · d7 t67son↔t78[0] 1,06 / 0,89 · l5[0]↔t56[0] 1,21 / 1,04 · r76 son↔t56son 1,24 / 1,11 · r87 son↔t67son 1,12 / 0,99 · r65 son↔l5[0] 1,56 / 1,55 | ✓ |
| t78 son ↔ p8 (broşür dışı, pay 45) | 1,117 / 1,152 | 1,119 / 1,187 | ✓ |
| Manifest | | yalnız d5/d6/d7 yatay yol + bayt + p6/p7 yatay lqip + d6 `duvarCapalari` yatay y (293 ile); dikey/HEVC farkı 0; `brosurDikdortgen` aynı | ✓ |
| Kapak DOM↔video | ≤ 0,004 px | dx/dy ≤ 0,002, dw/dh ≤ 0,004 px (3 görünüm) | ✓ |
| Scrim ≥ 4,5:1 (d2, d3, d4, d6, d7 × 390×844, 1280×800, 844×390) | 12/12 | **15/15**; en dar pay m d7 0,049, 1280×800 d6 0,055, d7 0,066 | ✓ |
| Perf (4× CPU, 0→11→0, 22 adım; mobil dokunma / masaüstü fare) | | fps 59,9 / 60,0; > 50 ms kare 1 (7→8, 54 ms) / 0; düşen 1 / 1 (/1.044; bilgi, §12.11-1); yedek 0, konsol hatası 0 | ✓ |
| tsc / eslint (argümansız) / build | ✓ | ✓ / 0 hata / ✓ | ✓ |

Geçiş ortası kareleri (CDP `Page.startScreencast`, %30/50/70; 6→7 ve 7→8; 1280×800, 1920×1080, 844×390, 390×844):
kırpım kayması kamera hareketi içinde okunmuyor; bant geçişte sönük.

**7. Bilinen**
- `manifest-birlestir.mjs`: d6 `duvarCapalari` yatayı artık p6'nın `kirpimY`'siyle (önce sabit 420); `orman` çapası (master
  y 1434) 293 kırpımında kadraj dışı (video y 760,8) → uyarı. Site duvarda kılavuz çizmediği için (F, D1-11) etkisiz.
- 1024×768 gibi 4:3 ekranlarda duvar bandı dar (176 px); metin küçük. Gerçek iPad'de görülmedi.
- Gerçek iPhone testi açık (değişmedi).

## 13. F turu: "hızlı yakınlaşma" geçişleri (orkestratör kararları, 3 Kasım 2026 ~21.45; bağlayıcı — §9/§11/§12 ile çelişirse bu bölüm geçerli)

### 13.0 İstek ve okuma

Kullanıcı (E ve E2 push edildikten sonra): "Önceki tasarımda en güzel olan şeyler geçiş animasyonlarıydı; Antalya'dan fuar
alanına geçerken şehre hızlıca yakınlaşma gibi. Bunları çıkarmışsın; her geçişte olmalı."

Okuma: v2'de (b9cd9db, `derinlik.ts`) her geçiş sürekli bir ölçek artışıydı: ln z doğrusal, ease yok, parmağın fiske
hareketi → hızlı yakınlaşma + yönlü yerleşme (hız sonda 0). v3'te ölçülen eksikler (kare şeritleri `scratchpad/gecis/hepsi.png`):

| Geçiş | Bugün | Eksik |
|---|---|---|
| t12 d1→d2 | ×7 iniş, easeInOutSine (yarı zamanda yolun yarısı) | ağır dolly; fiske hissi yok |
| t23 d2→d3 | 60 → 5 km aralığı (kare 36–76) bulut perdesi + yerel kümülüs altında | **kent yaklaşımı görünmüyor** (kullanıcının örneği) |
| t34 d3→d4 | çatıya dalış → 44–55 beyaz parlama → hol | kesme 0,4 s; dalış yarıda saklanıyor |
| t45 d4→d5 | montaj + kavisli iniş, easeInOutSine | ağır |
| t56 d5→d6 | baş kalkar → sütun aralığı → yana kayma | yakınlaşma değil, tur |
| t67 d6→d7 | 0,54 m kayma + 62° pan | yakınlaşma değil, pan |
| t78 d7→d8 | totem yanından → bankoya iniş, easeInOutSine | sonu iyi, başı ağır |
| t01 d0→d1 | ×3,3 yaklaşma, easeInOutSine | ağır |
| DOM (d8→d9→d10 çevirme, d10→d11 dalış) | v2 ile aynı türde | bu turda değişmez |

Kilitli adımlama, klip oynatıcı, süre aralığı (1,6–2,8 s), geri = reverse ×1,0, bütçe kapıları (§11.2, §12.6, §12.11) değişmez.

### 13.1 Karar: "fiske" (flick) profili, bütün render geçişlerinde

- **Tanım.** Ölçek değişen kliplerde ln(kadraj) (S2'de yay ilerlemesi) üzerinde p(t): ilk **a = 0,15 s** beşinci derece
  kalkış (p, p', p'' sürekli; hız 0'dan; `kamera.py` `_besinci_katsayi` kalıbı), ardından **ease-out kuvvet k** (p = 1 −
  (1 − t)^k, k ∈ [2; 3], varsayılan 2,4), son 0,25 s'de hız → 0 (ekranda son 3 kare ≤ 6 / 3 / 0 px). Kabul: **t = 0,5'te
  p ≥ 0,75** (bugün 0,50). Tepe hareket kadraj kenarında ≤ 150 master px/kare (deklanşör 0,5) / ≤ 110 (deklanşör 0,25–0,35).
  Açı, yön, lens ve montaj pencereleri **ilerlemeye (s)** bağlanır, ham zamana (u) değil.
- **Süre.** 1,6–2,8 s; tasarımcı kısaltabilir (fiske profilinde iniş uzun; kısa klip = az bayt). Kiosk turu 115–125 s
  kalır (W ayarlar).
- **Uç pozlar değişmez** (dikişler): t01 sonu ≡ l1[0], t12 sonu ≡ l2[0], t23 sonu ≡ l3[0], t34 sonu ≡ l4[0], t45 sonu ≡ l5[0],
  t56 sonu ≡ p6, t67 sonu ≡ p7, t78 sonu ≡ eski t56[71] ≡ p8 bankosu (broşür dikdörtgeni). t01[0] amblem diski, lombar
  geometrisi, döngüler, p1–p5/p8, DOM çapaları değişmez. `dunyaR`, kadraj okuması, çapalar yeniden dışa aktarılır
  (manifest-birlestir).
- **Geri klipler** yine ileri klibin tersi (×1,0): dönüşte "hızla uzaklaşıp 0,15 s'de durma" kabul.

### 13.2 Klip klip

- **t01**: fiske (k 2,4). `dunyaR` yeniden; lombar DOM otomatik.
- **t12**: fiske; süre ≤ 2,0 s (tasarımcı).
- **t23**: **bulut perdesi kalkar** (`perde_k` = 0; `yerel_bulut_k` yalnız kaplama ≤ %35/kare ve kent/körfez görünür
  kalıyorsa, yoksa 0). Fiske; 60 → 5 km kent yaklaşımı açıkta. LOD dikişi (yakın alan ±1 km sınırı, Voronoi parsel sönümü
  9 km, S2 10 m dokusu) önizlemede kare kare denetlenir; görünür kenar varsa sönüm genişletilir/bulanıklaştırılır,
  **perdeyle gizleme yok**. Pozlama irtifaya bağlı kalır (POZ_EGRI; doğrula). `--sabit_tohum` iniş karelerine taşınır.
  C turunun T23_FA/T23_VARIS zaman eğrisi yeni profilin içinde erir (iniş yine 6 kare durgun).
- **t34** (t34a + t34b): fiske dalış; **parlama ≤ 0,2 s** (%80+ beyaz kare ≤ 6; ör. t34a 45–47 rampa + t34b 48–50 iniş);
  kesme karesi 47 ≡ 48 (`#FFF1DC`) aynen; t34b'nin easeOut çıkışı korunur.
- **t45**: fiske (yay ilerlemesi); **montaj** aynı zaman eğrisiyle sıkıştırılır (parçalar kamera kanopi kenarına varmadan
  yerinde; mıknatıs korunur); `--carpisma`.
- **t56**: yol geometrisi (baş kalkar → 120° aralık → batıya) kalır; zaman eğrisi fiske; ψ/φ pencereleri s'ye; duvara
  yaklaşma = iniş.
- **t67**: **"duvara yakınlaşma"**: A → C (duvardan daha uzak ara nokta, ör. x ≈ −3,9, y ≈ 1,7) → B; pan ilk yarıda,
  son yarıda duvara dolly; "1.000.000+" bloğunun ekran ölçeği son %50'de ≥ 1,25× büyür. Lens 18 sabit. Çarpışma ≥ 0,25 m.
- **t78**: `banko_kamera` yay ilerlemesi fiske; lens 18 → 85 ve φ pencereleri s'ye; son kare bire bir eski t56[71].
- **DOM**: sayfa çevirmeleri, d10→d11 dalışı, lombar değişmez. **W-F**: fontlar `next/font/local` ile depoya sabitlenir
  (M3 font sapması: Google Fonts derleme anında +54,7 kB verdi, oturum 12,010 MB); OFL kaynak (google/fonts), pyftsubset
  ile Latin + Latin-ext (Türkçe) + içerikte geçen özel karakterler; toplam ≤ E'nin 301,7 kB'ı; `.notdef` 0. Kiosk 120 s.

### 13.3 Ölçüm ve kabul

- GPU'suz, kamera modelinden kare kare: p(t), kadraj kenarı px/kare, son 3 kare px; rapor tablosu (klip × {p(0,5), tepe
  px/kare, son 3 kare, süre}).
- Önizleme EEVEE 960² (`render/_onizleme/`): kontak sayfaları `s1-f-*.png`, `s2-f-*.png`; t23 bulut kaplaması kare kare
  (luma > 0,9 ∧ doygunluk < 0,08 oranı) ≤ 0,35 ve 60 → 5 km aralığında kent/körfez görünür; t34 beyaz kare ≤ 6; LOD
  dikişi notu; çarpışma ≥ 0,25 m.
- Son render sonrası: dikişler C/D/E ölçütleriyle (master uç kareler döngülerle/posterlerle birebir; kodlanmış ΔE00 ≤ 3);
  bütçe §11.2/§12.6 (mobil AV1 oturum ≤ 12,00 MB; merdiven §12.7-1); perf §12.11; kiosk 115–125 s.

### 13.4 Sıra

1. **F-A** (bu workflow): S1-F ∥ S2-F tasarım + önizleme (GPU kilidi, EEVEE 960²; render-son'a dokunulmaz) → orkestratör
   kontak sayfalarına bakar, onaylar ya da düzeltir.
2. **F-B**: E master yedeği `render-son-e\` (yalnız değişen klipler, kopya) → son render S1 (Cycles) ∥ S2 (EEVEE) → K-F
   kodlama (8 ileri + 8 geri + p6/p7 son-kare) → W-F (fontlar, kiosk) → denetim D1 (görsel, geçiş kareleri) + M (kapılar)
   → F düzeltme → ayrı commit → push.
- GPU tahmini: önizleme ~15 dk; son render S1 ~30 dk (t01 4,5 + t12 5,1 + t23 13,1 + t34a 7,5) + S2 ~23 dk.

### 13.5 F-A sonucu ve F-B kararları (orkestratör, 3 Kasım 2026 ~23.20; bağlayıcı)

F-A (S1-F ∥ S2-F, EEVEE/Cycles 960² önizleme, raporlar scratchpad `f-s1/rapor.md`, `f-s2/rapor.md`; kontak sayfaları
`render/_onizleme/s1-f-*.png`, `s2-f-*.png`, `s2-f-*-ef.png`) sonucu:

- **Fiske tanımı düzeltildi:** ilk a = 0,15 s beşinci derece kalkış "yarı hız" kuralıyla (aşma yok), sonra ease-out
  [a, 1] aralığında; bu tanımla p(0,5) ≥ 0,75 için **k ≥ 2,2** (§13.1'deki "k ∈ [2; 3]" buna göre okunur). S1 `kamera.py`
  `fiske()` ve S2 `ortak.py` `fiske()` aynı kod. Uç kareler E ile bit düzeyinde aynı (S1 ve S2'de konum/açı/lens farkı 0;
  önizleme ΔE00 ≤ 0,04). t23 bulutsuz: kent ve körfez 60 → 5 km'de açıkta (kaplama ≤ %0,9), pozlama `egri_f`. ✓
- **px/kare eşikleri (§13.1) E'de de tutmuyordu;** kabul ölçütü değişti: kalkış patlaması (ilk 0,3 s) serbest, geri kalan
  kısımda K ≤ 110/150; S1 t23 (a) olduğu gibi kabul; S2 t45 218, t56 489, t67 191, t78 441 kabul (deklanşör 0,35 kalır; S2-F2
  önizlemede strob görürse t56/t78 için 0,5 yapabilir — son kareler durgun, p6/p7/p8 etkilenmez).
- **Kuyruk sorunu (orkestratör gözlemi):** fiske profilinde her klibin son ~%25–30'u neredeyse durağan (t23 kare 60–83'te
  1,2 km → 920 m; t56 kare 42–59; t45 42–59; t67 34–47; t78 46–65). Kilitli adımlamada bu ölü zaman. Çözüm: **klipler
  kısalır**, profil aynı:

| Klip | E / F-A kare (s) | **F-B kare (s)** | Not |
|---|---|---|---|
| t01 | 54 (1,8) | 54 (1,8) | değişmez (d10→d11 tekrarı, lombar) |
| t12 | 60 → 54 (1,8) | **54 (1,8)** | onay |
| t23 | 84 (2,8) | **72 (2,4)**, k 2,2 | son 6 kare durgun (C kuralı) kalır |
| t34a | 48 (1,6) | **36 (1,2)** | **"kalkis" kipi** (sürekli ivmelenme, çatı üstünde takılma yok): fiske kalkışı (0,15 s) + kuvvet ~1,3; kare 35'te ışıklık bandı (~106 m), hız yüksek; kare 10–35'te hız tepe'nin ≥ %50'si; parlama rampası **33–35**, 35 tam `#FFF1DC` |
| t34b | 24 (0,8) | **24 (0,8)**, t34 kare **36–59** | iniş **36–38**, 39 temiz; kare 36 tam `#FFF1DC`; t34 toplamı **60 kare (2,0 s)**, p(0,5) ≥ 0,75 (t34a taşır: kare 30'da p ≥ 0,75) |
| t45 | 60 (2,0) | **54 (1,8)** | eğim gecikmesi ilerleme birimine, son devir son 8 kareye → son 3 kare ≤ 6/3/0 px (izin verildi); montaj payı ≥ 0,25 s; `--carpisma` |
| t56 | 60 (2,0) | **54 (1,8)** | **aşırtmalı yol:** aralık çıkışı (G2) → hızlı fazda A'nın GÜNEYBATISINA aşırt (Wk ≈ (−4,9; 1,0)…(−5,2; 0,8), z 1,55; t78'in geçtiği boş bölge) → inişte A'ya **yaklaşarak** gel (merkez derinliği orta/son ≥ 1,2; son %40'ta duvar bloğu ≥ ×1,2 büyür); çarpışma ≥ 0,25 m; **önizle** (~35 s GPU), kontak `s2-f2-t56.png` |
| t67 | 48 (1,6) | **48 (1,6)** | F-A hâli kabul (pan s 0–0,80; C = (−3,96; 1,46); ×1,257) |
| t78 | 66 (2,2) | **60 (2,0)** | F-A yolu (düşey iniş) kabul; son kare ≡ eski t56[71] |

  Kiosk turu ≈ 120,2 − 1,2 − 0,4 (t34) ≈ **118,6 s** (115–125 ✓; W doğrular).
- **Kare sayısı değişen her şey güncellenir:** S1 `KLIPLER` (t23 72, t34a 36 + `toplam` 60), `--sabit_tohum` (t23 son 6, t34a
  0–2), parlama.py `--bas 33`; S2 `KLIPLER` t34b (36, 59), t34b_poz (f − 36)/23, parlama.py iniş 36–38, N_T45 54 / N_T56 54 /
  N_T78 60, `POSTER_KAYNAK` (p6 = t56[53], p7 = t67[47], p8 = t78[59]), son.sh/onizleme.sh/son_olcum.py/t34-birlestir (K);
  K `KIRPIM_Y` rampaları **ilerlemeye** göre yeniden anahtarlanır (t34 {200→420, k0 35, k1 36}; t56 {420→293} ve t78 {233→420}
  S2'nin fragman JSON'una yazacağı kare kare `ilerleme` alanıyla ya da S2'nin vereceği kare numaralarıyla); `manifest-birlestir`
  `kirpimYKare` aynı eğri. `render-son/<klip>/` eski kare dosyaları (ör. t12 k_0054–0059, t23 72–83, t34a 36–47) son render
  ÖNCE silinir (yedek `render-son-e\`'ye kopyalandıktan sonra).
- **Son render sıralı** (tek R-F ajanı; iki Blender süreci aynı anda bellekte olmasın: C: %96 dolu, sayfa dosyası
  büyüyemiyor; t23 EEVEE 4,5 GB RSS): S1 Cycles 1920² (t01, t12, t23, t34a; `--kilit`, aralarda ≥ 20 s) → parlama → S2 `son.sh
  t34b t45 t56 t67 t78` → `son_olcum.py` → kontak/dikiş ölçümleri. Tahmin S1 ~27 + S2 ~24 = **~55 dk GPU**.
- **t23 Cycles sonrası:** luma eğrisi (egri_f) ve LOD dikişi (kare 36–47, 5 → 2,7 km) kontak.py `olc` ile; deniz rüzgâr
  lekesi (kare 32–35, 25–15 km, iri benek) ve sol alt parıltı (kare 7–11) bilgi; dalış karesi "kent görünür" görsel denetim D1'de.
- **W-F:** fontlar `next/font/local` (OFL; Montserrat `src/app/layout.tsx`, Great Vibes aynı dosya, Lora `src/app/icinden/page.tsx`;
  pyftsubset Latin + Latin-ext + içerikteki özel karakterler; toplam ≤ 301,7 kB; `.notdef` 0; tüm rotalar); kiosk süresi
  ölçümü; manifestten kare sayıları/okuma/dunyaR/çapalar otomatik (kod değişikliği beklenmiyor; varsa yaz).
- **DOM broşür kesişmesi (d7→d8):** t78'in son ~15 karesi broşürün üstüne düşey iniş (kapak ekranda büyür); son kare aynı
  olduğundan 200 ms kesişme ve FLIP değişmez; D1 bu geçişi CDP screencast ile denetler.

### 13.6 F turu sonucu (R-F son render + K-F kodlama + W-F fontlar + V doğrulama, 4 Kasım 2026)

Ortam (V): prod `.next-f`, `next start -p 3101`, headless Chrome (playwright-core, sistem Chrome), **gerçek cihaz değil**;
QA `.qa/icinden3/f/v/`; MB = 10^6 B. Araçlar M3 ile aynı (`scratchpad/e2m/icinden3.mjs`, `font.mjs`, `kapak-geo.mjs`,
`scrim-olc-m3.mjs`, `poster.mjs`; `b2/dikis-analiz.py`); geçiş kareleri `f-v/gecis-kontak.mjs` + `kontak.py`.

**1. Kare ve süre (E2 → F)** — ölçülen: tuşa basıştan sonra faz `gecis` → `dur` (CDP screencast, ms). Durağan kuyruk:
geçiş penceresinde ardışık kare farkı (ortalama mutlak RGB) ≥ 2/255 olan son kareden varışa kadar geçen süre.

| Geçiş | Klip | E2 kare (s) | **F kare (s)** | Ölçülen 390×844 / 1280×800 (ms) | Durağan kuyruk m / yt (ms) |
|---|---|---|---|---|---|
| d0→d1 | t01 | 54 (1,8) | 54 (1,8) | 2.408 / 2.404 (lombar DOM ~620 ms + klip) | 130 / 190 |
| d1→d2 | t12 | 60 (2,0) | **54 (1,8)** | 1.803 / 1.806 | 68 / 143 |
| d2→d3 | t23 | 84 (2,8) | **72 (2,4)** | 2.403 / 2.412 | 213 / 35 (son 6 kare durgun, C kuralı) |
| d3→d4 | t34 (t34a 0–35 + t34b 36–59) | 72 (2,4) | **60 (2,0)** | 2.002 / 2.005; **beyaz 106 / 125 ms** (≤ 0,2 s ✓) | 105 / 131 |
| d4→d5 | t45 | 60 (2,0) | **54 (1,8)** | 1.817 / 1.813 | 38 / 42 |
| d5→d6 | t56 | 60 (2,0) | **54 (1,8)** | 1.808 / 1.813 | 44 / 69 |
| d6→d7 | t67 | 48 (1,6) | 48 (1,6) | 1.619 / 1.615 | 44 / 374 |
| d7→d8 | t78 + 200 ms kesişme + 420 ms FLIP | 66 (2,2) | **60 (2,0)** | 2.668 / 2.685 | 148 / 179 |
| d8→d9 · d9→d10 | DOM | — | — | 2.003 / 2.014 · 1.814 / 1.802 | 90 / 91 · 74 / 62 |
| d10→d11 | t01 (dalış) | 54 | 54 | 2.605 / 2.608 | 128 / 171 |
| **Toplam render geçişi** | 8 klip | 504 kare (16,8 s) | **456 kare (15,2 s)** | | |

Geri (390×844, reverse ×1,0): 11→10 2.636 · 10→9 1.785 · 9→8 2.016 · 8→7 2.623 · 7→6 1.604 · 6→5 1.816 · 5→4 1.817 ·
4→3 2.015 (beyaz 94 ms) · 3→2 2.415 · 2→1 1.807 · 1→0 2.437 ms; kuyruk 6–94 ms, yalnız 1→0 714 ms (r10 sonu = t01'in
amblem diski; ardından lombar DOM'u, render değil). Kiosk turu **118,47 s** (E2/M3 120,19; hesap 118,6).

**2. Kapılar (M3 = E2 commit'i ↔ F)**

| Kapı | Eşik | M3 | **F** | |
|---|---|---|---|---|
| Mobil AV1 oturum (4G, önbelleksiz, 0→12) | ≤ 12,00 | 11,955 | **11,470** | ✓ |
| Masaüstü AV1 / mobil H.264 oturum | bilgi | 11,727 / 13,705 | 11,046 / 13,083 | |
| İlk yükleme (temel + t01 + p1 + l1 + t12): mobil AV1 / masaüstü AV1 / mobil H.264 | ≤ 2,5 | 2,041 / 1,883 / 2,350 | 1,998 / 1,821 / 2,345 | ✓ |
| d1 hazır (mobil AV1) | | 1,473 | 1,441 (font 0,242, JS 0,192, video 0,661) | |
| Adım penceresi maks, ölçülen (geçiş + 4 s): mobil AV1 / masaüstü AV1 / mobil H.264 | ≤ 2,5 | 1,871 / 1,904 / 2,040 | 1,849 / 1,852 / 2,076 | ✓ |
| Hesap (K-F `dogrula-render-son-F.json`): dikey AV1 kritik / pencere / set | ≤ 2,1 (d2) / 2,6 (d3) / 15 | — | 1,997 (d2) / 2,493 (d3) / 10,542 | ✓ |
| Hesap: yatay AV1 · dikey H.264 · yatay H.264 kritik / pencere | ≤ 2,1 / 2,5 (AV1 d3 2,6) | yatay AV1 2,045 / 2,519; yatay H.264 2,045 / 2,454 (§12.12) | 1,981 / 2,411 · 2,023 / 2,448 · 2,033 / 2,411 | ✓ |
| Rota JS (gz) · HTML gz · RSC gz | ≤ 50 · ≤ 56,0 kB | 20,9 · 55,5 · 30,1 | 20,9 · **55,1** · 29,8 | ✓ |
| Font (`/icinden`, mobil = masaüstü) | ≤ 301,7 kB | 301,7 (8 istek) | **242,4 (4 istek)**, Google isteği 0 | ✓ |
| Perf 4× CPU (0→11→0, 22 adım; mobil dokunma / masaüstü fare): fps · > 50 ms kare · düşen | ≥ 59,5 · ≤ 3 · bilgi | 59,9 / 59,9 · 1 (7→8, 60 ms) / 0 · 1 / 4 (/1.044) | **59,9 / 60,0 · 1 (7→8, 61 ms) / 0 · 0 / 1 (/948)**; yedek 0 | ✓ |
| Perf 1× CPU (mobil / masaüstü): düşen kare | ≤ 1/1.000 | 0 / 0 (/1.044); > 50 ms 1 / 0 | **0 / 0 (/948)**; fps 59,9 / 60,0; > 50 ms 1 (7→8, 52 ms) / 0 | ✓ |
| Kiosk tam tur | 115–125 s | 120,19 | **118,47**; yedek 0 | ✓ |
| Kapak DOM ↔ video (3 görünüm, kesişmenin ilk karesi) | ≤ 0,5 px | ≤ 0,004 | dx/dy ≤ 0,002, dw/dh ≤ 0,004 | ✓ |
| Lombar (t01 kare 0 disk ↔ DOM amblem; m / D / yt) | ≤ 2 px | merkez 0,31 / 0,48 / 0,76 | merkez 0,30 / 0,55 / 0,76; dr 0,78 / 1,18 / 0,72 | ✓ |
| Scrim ≥ 4,5:1 (d2, d3, d4, d6, d7 × m, D, yt, fhd, iPad) | 25/25 | 25/25 | 25/25 | ✓ |
| Stale (`scrollY` gecikmesi 0/1/2 kare) · tuzak (geçişte jest, uç, hızlı ileri-geri, kapanış, tekerlek) | | 3/3 · ✓ | 3/3 · ✓ | ✓ |
| Reduced motion · poster kipi: video isteği | 0 | 0 · 0 | 0 (poster 7 istek, 0,509 MB) · 0 (`?poster=1` ve saveData; 22 adım, poster 8 istek 0,535 MB) | ✓ |
| Konsol hatası (bütün koşular) | 0 | 0 | 0 | ✓ |
| tsc · eslint `src scripts` · build | 0 | ✓ · 0 · ✓ | ✓ · 0 hata (2 uyarı) · ✓ | ✓ |

Argümansız `npx eslint` F'de 518 hata veriyor: hepsi `.claude/worktrees/` (G6 akıcılık ajanının worktree'si, F'nin dışı;
`eslint.config.mjs` `.claude/**`'u yok saymıyor) + `.qa/` ve `scripts/blender/s3/` (G-A) uyarıları.

**3. GPU ve süre.** R-F son render sıralı, 23:48:23 → 00:37:25 (49 dk duvar saati): S1 Cycles 23,0 dk (t01, t12, t23,
t34a) + S2 EEVEE 18,2 dk (t34b, t45, t56, t67, t78) = **41,2 dk GPU** (tahmin ~55); VRAM tepe 4,52 GiB. K-F kodlama 5 dk
(84 dosya, iki paralel süreç) + `kodlama-dogrula --vmaf` iki tam koşu (8 + 10 dk). F-A/S1-F2/S2-F2 önizleme GPU
süreleri bu bölümde toplanmadı (raporlarda).

**4. Dikişler.** Master (R-F): bütün uç kareler ΔE00 ≤ 0,135; t34 kesmesi 35 ↔ 36 bit düzeyinde aynı (ikisi tam
`#FFF1DC`); t78[59] ↔ eski t56[71] 0,0072. Kodlanmış (K-F, ΔE00 ≤ 3): ileri son ↔ döngü 0 en çok 2,94 ✓; t34 kesme farkı
≤ 0,25 (8 bit) ✓. Aşanlar (hepsi kodekten, master temiz): **d3 kalkışı** l3[0] ↔ t34[0] 3,03–3,27 (H.264/HEVC; AV1 ≤ 2,73;
E2 ≤ 3,00); **r43 son** ↔ l3[0] 3,00–3,98 (E2 2,86–3,60; §11.6-5 kabulü), ↔ p3 3,42–4,18; t23 son ↔ p3 3,24–3,45 (p3 q68,
bilinen; döngüye 2,94 ✓). Lombar ve kapak yukarıda ✓. VMAF: 84 dosyada eşik altı yok; CRF değişiklikleri t23 AV1 32→35,
r32 AV1 34→35, r32 H.264 26,5→27 (d2 kritik ve d2/d3 pencereleri için; `kodla.mjs` `CRF_TABLO`).

**5. Görsel kanıt** (`.qa/icinden3/f/v/`): `gecisler-m.png` (390×844), `gecisler-yt.png` (1280×800), `gecisler-geri-m.png`
(satır = geçiş; sütun %0/15/30/50/70/85/100, altta kare zamanı ms), `lombar-5kare-{m,yt}.png` (0→1, ilk video karesi
çevresi ~620–680 ms), `brosur-5kare-{m,yt}.png` (7→8 kesişmesi), sayılar `gecisler-F.json`. 390×844 ileri: d2→d3'te
kent ve körfez %30–%70 karelerinde açıkta; d3→d4 %50 karesi parlama; d5→d6, d6→d7 duvara yaklaşma; d7→d8 bankoya iniş →
broşür.

**6. Bilinenler / açıklar**
- t23 kare 6→7 pozlama sıçraması (+4,69 luma, `egri_f` tümseği; R-F); kalkış patlamasının içinde. Düzeltme render ister.
- d3 kalkış dikişi (3,03–3,27) ve r43 aralığının genişlemesi (3,98): K-F seçenekleri (kabul ya da BOLGE t34 0-2:-4 +
  r32 H.264 27,5); karar bekliyor.
- Yatay d6→d7 durağan kuyruk 374 ms (dikeyde 44 ms): t67'nin son kareleri yatay kırpımda daha az piksel değiştiriyor
  (tepe farkın %5'i eşiğiyle 170 ms). Bilgi.
- Gerçek iPhone/Android testi açık (§14.1, §14.1-F).
- 4:3 duvar bandı darlığı (E2) ve t56/t78 rampalarının görsel denetimi (D1) değişmedi / açık.

**7. Render gerektiren bulgular:** yalnız t23 pozlama sıçraması (isteğe bağlı; POZ_EGRI 78–1.580 km düğümleri, yalnız
t23, ~11 dk Cycles GPU; t23[71] ↔ l3[0] etkilenmez). Kapı aşımı yok; V'de düzeltme yapılmadı.

### 13.7 F-B kabulleri (orkestratör, 4 Kasım 2026 ~01.45; bağlayıcı)

Ajanların (S1-F2, S2-F2, R-F, K-F, W-F, V) açık bıraktığı maddeler şöyle karara bağlandı; F bu hâliyle commit edildi.

| madde | karar |
|---|---|
| t23 kalkış sonrası K hızı 141 px/kare (sınır 110) | **kabul** (§13.5 "kalkış patlaması serbest"); aynı yol %14 daha az kareye sığıyor |
| t34a `KALKIS_US` 1,25 (brief "~1,3") | kabul; 1,3'te kare 10–35 K hızı tepenin %48'ine düşüyordu (< %50) |
| t56 aşırtmalı yol totemin doğusundan (G2 → (−4,40; 2,40) → dip (−4,29; 0,79) → (−3,96; 0,86) → A), tepe 729 px/kare | kabul; batı yolu duvar bloğunu küçültüyordu |
| d3 kalkış dikişi l3[0] ↔ t34[0] kodlanmışta 3,03–3,27 ΔE00 (AV1 ≤ 2,73) | **kabul**, §11.6-5 kapsamına alınır; zones −4 çözümü d3 H.264 penceresini 2,502'ye çıkarıyordu |
| r43 son ↔ l3[0] 3,98 (önceki kabul aralığı 2,88–3,60) | kabul aralığı **≤ 4,2**'ye genişler (geri klip, zones yok) |
| CRF: t23 AV1 32 → 35, r32 AV1 34 → 35, r32 H.264 26,5 → 27 | kabul (VMAF ≥ 95,3 / 90,86; d2 kritik ve d3 pencereleri ancak böyle tutuyor) |
| t23 pozlama sıçraması kare 6 → 7 (+4,69 luma, `egri_f` tümseği) | F'de kabul (kalkış patlamasının 0,2. saniyesi); **G4'te** t23 zaten yeniden render edilecek: `POZ_EGRI` 78–1.580 km düğümleri yumuşatılır, "tek yönlü ±3" ölçütü o zaman aranır |
| Yatay 6→7 durağan kuyruk 374 ms (dikey 44) | bilgi; G7'de t67 yeniden render edilirse kuyruk 2–3 kare kısaltılır |
| W-F: Lora alt kümesi "Cop31 Serif" adıyla (OFL §3 Reserved Font Name) | kabul; lisans metni `src/app/fonts/OFL-Lora.txt` |
| W-F: ← → ↔ sistem yazısından (E'deki gibi); `.ic-br-imza-ad` 800 → 900 | kabul |
| eslint kökten koşunca `.claude/worktrees/` taranıyordu | `eslint.config.mjs` ignore listesine `.claude/**` eklendi (bu commit) |
| `render-son-e` (8,2 GB, D:) | G-B bitene kadar durur; sonra silinebilir |
| Gerçek cihaz (iPhone 16) testi | **açık**; akıcılık ajanının yaması ve kontrol listesi ayrı commit |

## 14. G turu: müşteri revizyonu (3 Kasım 2026 gece; orkestratör okuması — bağlayıcı taslak, kullanıcı onayıyla kesinleşir)

### 14.0 Müşteri mesajı ve kullanıcı ekleri

Müşteri: "Dünya animasyonunu seçtik, ama standa gelip masadaki broşürü gösteren kısma kadar. Sonrasında ise o broşür
yerine, üçüncü konseptteki fidan köklenmesi ve büyümesini görelim. Bizi tanıtan bir fidan yani. Broşürü de değiştiriyoruz.
Site açılınca dünya ile başlasa bile bir yerde 'dijital broşür' seçeneği olsun. O atacağımız broşürü oraya yedirelim.
Antalya çö[l] gibi gözüküyor değiştirebiliriz görüntüyü. Bir de kaydırmalı geçişler hızlanabilir."
Kullanıcı: animasyonlarda hafif takılmalar var, daha akıcı olmalı; duvarlar kalıyor ama COP'tan ziyade genel bilgi;
**fidan kısmı /fidan'daki gibi (kaydırmayla çizilen SVG) değil, animasyonlu olsun** (render edilmiş, dalışla aynı dilde).

### 14.1 İş listesi

| # | İş | Kaynak | Durum |
|---|---|---|---|
| G1 | Dalış d0–d8 kalır (logo → … → masadaki broşür) | müşteri | değişmez |
| G2 | **Fidan bölümü**: d9+ broşür sayfaları ve d11 Dünya dönüşü yerine render edilmiş fidan (köklenme → gövde → dallar → yaprak), kilitli adımlama, metin kartları DOM | müşteri + kullanıcı | **G-A tasarım paneli** (bu bölüm) |
| G3 | "Dijital broşür" bağlantısı: üst şerit + kapanış → `/brosur`; yeni broşür gelince /brosur sayfaları ve masadaki kapak dokusu (t78 kuyruğu yeniden render, ~6 dk) | müşteri | broşür gelince |
| G4 | Antalya çöl görünümü: d3/t23/t34a için ilkbahar Sentinel-2 L2A sahnesi (Copernicus; lisans aynı), `hazirla.py` yeniden; t23/l3/t34a/p3 yeniden render (~25 dk GPU) | müşteri | F'den sonra |
| G5 | Geçişler hızlansın | müşteri | **F turu** (§13) |
| G6 | Takılmalar (akıcılık): d7/d11 dinlenme 101/233 ms, FLIP 54–60 ms, klip devirleri | kullanıcı | `icinden-akicilik` ajanı (worktree) |
| G7 | Duvarlar genel bilgi: **varsayım** d6 arka duvar "Gençlik Buluşmaları · Bir Gençlik Şöleni" (50+ buluşma/5 yıl; 100.000+ genç · 16 Mayıs 2026 · Kocaeli Stadyumu; 2017 seçilme yaşı 18; TBMM'de 30 yaş altı 5 vekilden 4'ü; fotoğraf p18/p22 şölen), d7 sol duvar aynen; dokular + t56/t67/t78/p6/p7 yeniden render (~15 dk) | kullanıcı | kullanıcı onayı bekliyor |

Varsayımlar (kullanıcı düzeltmezse geçerli): kapanış fidanla biter, Dünya'ya dönüş (d11) kalkar; fidan içerikleri
content.ts'ten (bizKimiz, vizyon, genclikKollari, baskanMesaji, iklim, kapanis; olgular `facts`), fotoğraflar photos.ts
(foto-yeni.md kuralları; p06 portre değil); parti içeriği stant içinde serbest. Bütçe: fidan bölümü +4 geçiş +4 döngü ≈
+2,5–3 MB mobil AV1; F'nin kısalttığı kliplerle oturum ~10,8 → ~13,5–14 MB; **yeni oturum kapısı kullanıcıya sorulacak**
(öneri ≤ 14,0 MB; alternatif: döngüler 3 s, fidan döngüleri DOM'suz poster + hafif CSS salınım).

### 14.2 G-A tasarım paneli (fidan bölümü)

Üç bağımsız tasarımcı (Opus) + üç jüri. Her öneri: storyboard (d8'den kapanışa; d8 masadaki broşürden fidana GEÇİŞ nasıl:
ör. kapaktaki Dünya fotoğrafı dairesine dalış → toprak kesiti → tohum; ya da stanttaki ahşap saksı), duraklar (3–4: kök →
gövde → dallar → yaprak/ağaç; her durak = geçiş klibi 1,6–2,4 s + döngü 3–4 s + poster; kadraj okuması "kök", "gövde"…),
teknik (Blender 5.2 S3 sahnesi: geometry nodes ile büyüme parametresi — eğri kırpma + yarıçap + yaprak örnekleme; kökler
toprak kesitinde 81 uç [81 il, /fidan tree.ts]; polaroidler dallarda [p18/p22]; ışık: stant dili [3.200 K spot, karanlık]
→ büyüdükçe 16.00 güneşi; EEVEE TAA 64 1920²; kare sayısı ve GPU tahmini), DOM (kartlar /fidan'dan; d8→d9 devri; kapanış),
bütçe tahmini (bayt), riskler (bitki büyümesinin "oyuncak" görünmesi, köklerin okunurluğu, telefon dikey kadraj güvenli
alan §2.1). Jüri ölçütleri: müşterinin cümlesi ("bizi tanıtan bir fidan", "köklenmesi ve büyümesi"), dalışla üslup birliği
(§1, §2.1), gerçekçilik/uygulanabilirlik (Blender'da 1 gün içinde), bütçe, telefonda okunurluk. Kazanan: S3 kurulumu +
EEVEE 960² önizleme (GPU kilidi; F renderları bitince) → kullanıcı sabah bakar → G-B son render + DOM.

### 14.3 G-A sonucu ve G-B kararları (orkestratör, 4 Kasım 2026 ~01.30; bağlayıcı taslak — kullanıcının sabah bakışıyla kesinleşir)

**Panel:** üç bağımsız öneri (anlatı-önce "Kâğıttan Toprağa"; üslup-önce "Işık devri: palamuttan meşeye"; uygulanabilirlik-önce "Masadaki kök kasası") ve üç jüri. İki jüri Öneri 3'ü, biri Öneri 2'yi seçti; üçünün aşı listesi büyük ölçüde aynı. Uygulanan: **Öneri 3'ün iskeleti + Öneri 2'nin ışık/gerçekçilik disiplini + Öneri 1'in bant/bütçe kuralları.** Kurulum ve 960² önizleme bitti (`scripts/blender/s3/`, rapor `scratchpad/g-a/s3/rapor.md`, ilk bakılacak `render\_onizleme\s3-posterler.png`).

**Fidan bölümü (kesin tasarım):**

| durak | klip | süre | içerik |
|---|---|---|---|
| d8 (davranış değişir) | t78f (t78'in yerine; kasa inişte bulanık geçer, son karede kadrajda değil) | 2,0 s | son-kare durak: render'daki broşür kapağı; DOM kapak katmanı, FLIP ve 200 ms kesişme **kalkar**; bantta "Dijital broşür →" (`/brosur`) |
| d9 Kökler | t89 | 2,0 s | kamera broşürden kalkar, bankoda broşürün 0,53 m batısındaki cam yüzlü meşe kök gözlem kasasına iner; fidan_spot akkor ısınmasıyla yanar (2.400 → 3.200 K); kamera yavaşlarken palamuttan kazık kök, 6 ana kök, 74 kökçük: **81 krem uç**. Kart: `bizKimiz.title` + "81 İl · 922 İlçe" (facts) |
| d10 Gövde | t9a | 1,8 s | gövde kanca hâlinde topraktan çıkar, S biçiminde boy atar; iki boğum. DOM etiketleri 2017 / TBMM (`vizyon`) |
| d11 Dallar | tab | 1,8 s | önder + 6 ana + 16 alt dal, tomurcuklar. DOM'da 4 polaroid (dal uçlarına çapalı, yalnız dinlenmede). Kart: `genclikKollari` / Buluşmalar |
| d12 Yapraklar | tbc + lc (4 s döngü) | 2,2 s | yapraklar uçtan gövdeye açılır; 16.00 güneşi (s1/gunes.py: 18,51° / 230,47°) arkadan güçlenir, spot 0,3'e iner; tek karede bütün ağaç. Kart: `iklim` + 300 fidan |
| kapanış | DOM | — | slogan + "Dijital broşür" + sosyal + atıflar; Dünya'ya dönüş yok (d11 küre dönüşü ve broşür sayfaları kalkar) |

- Geri: yalnız **r98** (d9→d8) ters klip; fidan içi geri adımlar (d10→d9, d11→d10, d12→d11) **350 ms poster çapraz sönmesi** (§13.1 "geri = reverse" kuralına bilinçli istisna: −0,6…−0,75 MB, iPhone'da üç çözücü devri daha az, "köklerin geri çekilmesi" görüntüsü yok).
- d9–d11 döngüsüz son-kare durak; döngü yalnız lc (yaprak titremesi). Posterler p9 = t89[59], pa = t9a[53], pb = tab[53], pc = lc[0].
- Bant hep altta (y ≥ %68), /fidan `leaf-tag` çipleri (Kökler / Gövde / Dallar / Yapraklar); metinler yalnız `content.ts`'ten.
- 81 uç DOM güvencesi: tek SVG katmanı, tek 300 ms opaklık, 1,5 px krem halka (turuncu nokta değil); 7 dalga ancak gerçek iPhone ölçümü temiz çıkarsa. Reduced-motion: statik halkalar.
- Polaroidler: 4 kart, opaklık + 8 px translateY (easeOutBack yok), d10 dinlenmesinde `img.decode()`, sarkaç yalnız transform ±1,2°.
- Render'da insan yok (polaroid plakaları render'a konmadı, §12.0), yazı yok (`pankart_gel` S3 kliplerinde gizli; harfler okunuyordu).
- Ağaç geometrisi `tree.ts`'ten Node ile (`agac_disa.mjs`; 81 kök şeridi / 81 uç / 23 dal / 274 yaprak / 2 boğum assert), GN sabit topolojili büyüme; S2 `sahne.py` MASKE işaretinden kesilip aynı süreçte çalışır (S2'ye dokunulmadı).

**Önizleme ölçümleri (960² TAA 16; `s3-olcum.json`, `s3-olc.json`):** dikişler ΔE00 ≤ 0,0011 (lc kapanışı 0,061 ≈ ardışık kare); 81 uç blob sayımı 80 (81 ± 2), uç ↔ toprak ΔL* min 28 (≥ 20), uç aralığı min 12,6 video px, kapak çapı 4,14 px; yaprak doygunluk 0,544 (≤ 0,55) ve ton IQR 12,1° (≥ 12°) **sınırda**; cam yansıması ΔL* 2,4 (≤ 5); son 3 kare ≤ 1,6/0,8/0,2 px; büyüme cephesi kuyrukta ≥ 2 px/kare (plato 0); güvenli alan ∩ bant 0; 1920² probu 5,2 s/kare, VRAM tepe 4,33 GiB, RAM 1,81 GB. Tek sapma: tbc sonunda 13 durgun kare (hedef 6–8; `g_yaprak` 0,93 → 0,97 ile GPU'suz düzelir).

**Bütçe:** fidan bölümü mobil AV1 ≈ 1,27 MB (son posterlerle 1,33–1,37 MB); DOM broşür görselleri ve eski d9–d11 dosyaları düşülünce oturum **≈ 11,9–12,1 MB** (K ölçer). §14.1'deki "14 MB kapısı" sorusu büyük ihtimalle gereksiz: hedef **≤ 12,0 MB korunur**, aşarsa önce lc CRF 30 → 32, sonra r98 düşer; kapı en çok 12,5 MB'a esner (kullanıcıya bildirilir).

**GPU (G-B son render, 1920² TAA 64):** t78f 61 + t89 60 + t9a 54 + tab 54 + tbc 66 + lc 120 = 415 kare ≈ **38 dk** (34–43). Komut: `bash scripts/blender/s3/son.sh` (render-son/t78 → t78f ile değişir, eski kareler `render-son-f\t78\`).

**Orkestratör gözlemleri (kontaklardan):** (1) t9a'da gövde ince ve tel gibi okunuyor; fidan için doğru ama "oyuncak" sınırında → gövde tabanı çapı ×1,3 denenir (GPU'suz, önizlemede bakılır). (2) Kökler kesit yüzüne çizilmiş gibi düz; Geometry Proximity nemi var ama derinlik az → kök gömülme derinliği +1 mm, spot açısı biraz yan. (3) Yaprak tonu soluk-zeytin; ölçüt sınırında. Daha yeşil istenirse doygunluk ölçütü 0,55 → 0,62'ye gevşer (ölçütün amacı neon yeşili engellemek). (4) t89'un 14–27. kareleri (hızlı bölüm) neredeyse boş ve karanlık: fiske kalkışı bunu 0,4 s'de geçiyor, kabul.

**Kararlar (varsayılanlar; kullanıcı "devam" derse bunlarla gidilir):**

| # | konu | varsayılan | gerekçe |
|---|---|---|---|
| K1 | Kasa d4'te (l4/t34b/t45 ilk 17 kare) görünmüyor, d8'de var | **kabul** | 11 m'den ~23 × 19 video px; yeniden render +16 dk GPU, G1'i bozar |
| K2 | `pankart_gel` S3 kliplerinde gizli | kabul | yazı render'da okunmamalı |
| K3 | Meşe / palamut | meşe (tür adı hiçbir metinde yazılmaz) | banko meşe; /fidan'da tür yok |
| K4 | Fidan içi geri adım = poster çapraz sönmesi | kabul | bayt + iPhone |
| K5 | d12 arka planı | **A (karanlık hol)**; B (altın pus) yedek | hol fiziksel kalır; `s3-pc.png` ↔ `s3-pc-altin.png` |
| K6 | d11 polaroid seti | sol p12 + p17, sağ p19 + p22 (J1/J2) | p22 kapanışta da kullanılıyorsa J3'ün p08'i |
| K7 | G7 duvar metni | d6 duvarı **fotoğrafsız** metin/sayı (Buluşmalar · Şölen); 2017/TBMM fidan gövdesinde kalır | §12.0: render'da insanlı fotoğraf yok; §14.1 G7'deki p18/p22 varsayımı **geri çekildi** |
| K8 | "Köklerin ucundaki 81 nokta: 81 il" cümlesi | yalnız "81 İl" (`facts.provinces`) | cümle content.ts'te yok, onay-listesine yazılır |
| K9 | Atıf satırı | "Stant ve fidan görünümü temsilîdir." | onay-listesine |
| K10 | Görünüş ayarları (gövde, kök gömülme, yaprak tonu, tbc kuyruğu) | sabah bakışı | GPU'suz, önizlemede doğrulanır |

**G-B sırası (F push'tan sonra, tek commit):** (1) K1–K10 kesinleşir → S3 görünüş düzeltmeleri + 960² kısa önizleme (~5 dk GPU) → `son.sh` (~38 dk GPU) ∥ Antalya ilkbahar Sentinel-2 hazırlığı (G4; t23/l3/t34a/p3 yeniden render ~25 dk, S1 kilitle sırayla) ∥ duvar dokuları (G7; t56/t67/t78f/p6/p7 yeniden render ~15 dk; t78f S3 ile birleşir) → (2) K: `kodla.mjs` ad tablosu (t89 t9a tab tbc lc r98, p9 pa pb pc; CRF AV1 32 / lc 30 / r98 36), `manifest-birlestir` S3 JSON (kirpimY: p9 420, pa 222, pb 194, pc 165; `capalar`) → (3) W: rol tablosu (`masa`, `fidan-kok/govde/dal/yaprak`, N = 13), d8 son-kare + "Dijital broşür →" (üst şeritte de), kartlar, 81 halka, polaroidler, kapanış, kiosk 115–125 s, akıcılık yaması birleşik → (4) V: bütçe (≤ 12,0), perf, kiosk, kontaklar, belgeler → commit + push. Yeni broşür gelince (G3) kapak dokusu + t78f kuyruğu + t89 yeniden (~8 dk).
