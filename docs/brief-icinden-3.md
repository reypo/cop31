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

| Varlık | Adet | Süre | Hedef | Tahmini boyut | **Ölçülen (C turu, dikey H.264 / HEVC / AV1)** |
|---|---|---|---|---|---|
| İleri geçiş t01, t12, t23, t34, t45, t56 | 6 | 1,8–2,8 s | CRF 23 / 25 / 30; **t23, t34: 26 / 27 / 32** (§11.2-2); t23 H.264 son 10 kare −4 (`zones`, §11.2-6) | 500–660 KB | t01 259/288/219 · t12 686/553/470 · **t23 1.383/1.243/1.283** · **t34 951/947/1.172** · t45 768/550/602 · t56 626/386/378 kB (B: t23 1.867/1.551/1.471, t34 1.468/1.278/1.397) |
| Geri geçiş r10…r65 | 6 | aynı | CRF 26 / 28 / 34 (C: B'deki +2 geri alındı) | 300–420 KB | 205/186/177 · 453/374/362 · 1.277/975/1.130 · 1.085/910/1.003 · 529/401/474 · 501/288/290 kB |
| Döngü l1–l5 | 5 | 4–5 s | CRF 23 / 25 / 30 (C: +2 geri alındı) | 300–450 KB | 462/427/411 · 340/286/368 · 324/260/533 · 170/108/211 · 180/72/151 kB |
| Poster p1–p6 | 6 | — | WebP q80, 720×1.280 | 60–110 KB | 72 · 69 · **218** · 45 · 44 · 26 kB (yatay 56 · 62 · 229 · 38 · 46 · 28; p6 broşürsüz, yatay p3 kırpım 200); p3 q68–76 denendi, q80'e göre ΔE00 ≤ 1,0 tutmadı → q80 |
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

## 10. Uygulama ve ölçüm (B turu W-B2; C turu W-C, 3 Kasım 2026)

Girdi (C): Cycles 1920² son render (`render-son`; S1-C t23/t34a, S2-C t34b/l4/p6 yeniden), K-C'nin kodladığı set (§6
tablosu, `docs/klip-oynatma.md` §5; 97 dosya + kart, 47,5 MB) ve `src/components/icinden/klipler.json` (`kaynak:
"render"`, 03.12 UTC). Ölçüm: `next build` + `next start -p 3100`, headless Chrome (playwright-core), scratchpad
`c/w-c/icinden3.mjs` (senaryolar: perf, kare, gecis, tuzak, stale, boyut, lazy, kiosk, kioskTur, reduced, engel, yatay,
lombar, kapak, dalis, d3yatay, okuma) + `scripts/icinden/scrim-olc.mjs`; çıktılar `.qa/icinden3/c/` (B turu
`.qa/icinden3/b2/`). Blender/GPU boşta (nvidia-smi %0), CPU yükü perf başında %4–5. Parantez içi: B turu.

### 10.1 Gerçek boyutlar ve bütçe

- **JS** (prerender HTML'deki betikler, gzip -9): `/icinden` toplam 205,0 kB; `/` ve `/dunya` ile ortak 187,1 kB;
  **rotaya özgü 17,8 kB ✓** (≤ 50; B 16,4 — fark F'nin motor düzeltmeleri). HTML 42,6 kB gz, RSC 22,0 kB gz (manifest
  burada, JS'te değil).
- **Medya** (K-C): dikey set video + poster H.264 10,67 / HEVC 8,73 / AV1 9,71 MB ✓ (≤ 15); yatay H.264 10,26 / AV1 9,53
  (B: 10,55 / 8,49 / 9,50; yatay 10,75 / 9,99).
- **Bütçe, §11.2-3 tanımıyla** (manifest baytları, MB = 10⁶; W-C `butce.py` ile bağımsız hesap, K-C'nin
  `kodlama-dogrula.py` sonucuyla birebir). d_j'de kritik = t(j→j+1) + l(j+1) + p(j+1), pencere = kritik + r(j→j−1);
  ilk yükleme = 0,5 + t01 + p1 + l1 + t12; oturum = set + 1,27:

  | Set | İlk ≤ 2,5 | Kritik d1 · d2 · d3 · d4 · d5 (≤ 1,8) | Pencere d1 · d2 · d3 · d4 · d5 (≤ 2,5) | Oturum (≤ 12, AV1) |
  |---|---|---|---|---|
  | dikey H.264 | 1,98 ✓ | 1,09 · **1,93** · 1,17 · 0,99 · 0,65 ✗ | 1,30 · 2,38 · 2,44 · 2,08 · 1,18 ✓ | 11,94 |
  | dikey HEVC | 1,84 ✓ | 0,91 · 1,72 · 1,10 · 0,67 · 0,41 ✓ | 1,09 · 2,10 · 2,08 · 1,58 · 0,81 ✓ | 10,00 |
  | dikey AV1 | 1,67 ✓ | 0,91 · **2,03** · 1,43 · 0,80 · 0,40 ✗ | 1,08 · 2,40 · **2,56** · 1,80 · 0,88 ✗ | 10,98 ✓ |
  | yatay H.264 | 1,77 ✓ | 0,91 · **1,95** · 1,15 · 0,98 · 0,69 ✗ | 1,09 · 2,38 · 2,41 · 1,98 · 1,22 ✓ | 11,53 |
  | yatay AV1 | 1,51 ✓ | 0,79 · **2,12** · 1,38 · 0,76 · 0,45 ✗ | 0,95 · 2,46 · **2,57** · 1,76 · 0,89 ✗ | 10,80 ✓ |

  d2 aşımı t23 (1,24–1,38 MB) + l3 + p3 (0,22); seçenekler K-C raporunda ve `klip-oynatma.md` §5 (karar orkestratörde).
- **4G ölçümü** (4 Mbps / 50 ms, HTTP önbelleği kapalı, okur temposu 4 s/durak, d0'da 8 s boşta; dikey 390×844, yatay
  1280×800; kodek `?kodek=` ile sabit). "Pencere" burada ölçülendir: d_j'ye geçiş + 4 s dinlenmede inen bayt.

  | Set | d1 hazır | İlk yükleme (d1 hazır) | İlk yükleme, tanım (t12 de inmiş) | 8 s boşta | Pencere d1 · d2 · d3 · d4 · d5 · d6 | Oturum 0→10 + kapanış |
  |---|---|---|---|---|---|---|
  | dikey H.264 | 3,33 s | 1,52 ✓ | 2,20 ✓ (4,8 s) | 3,93 | 1,70 · 1,44 · 2,13 · 1,11 · 0,81 · 0,81 ✓ | 11,95 |
  | dikey AV1 | 3,13 s | 1,43 ✓ | 1,90 ✓ (4,1 s) | 3,55 | 2,10 · 1,22 · 1,70 · 1,03 · 0,76 · 0,60 ✓ | **10,98 ✓** |
  | yatay H.264 | 3,02 s | 1,36 ✓ | 1,99 ✓ (4,4 s) | 3,59 | 1,72 · 1,37 · 2,16 · 1,02 · 0,67 · 0,65 ✓ | 11,19 |
  | yatay AV1 | 2,88 s | 1,30 ✓ | 1,73 ✓ (3,8 s) | 3,35 | 2,15 · 1,10 · 1,80 · 1,04 · 0,59 · 0,43 ✓ | **10,46 ✓** |

  İlk yükleme (dikey H.264, d1 hazır): font 0,30 · JS 0,19 · video 0,72 (t01 + l1) · poster 0,14 (p1, p2) · görsel 0,09 ·
  CSS + HTML 0,07 MB (B 1,38 MB: l1 o turda CRF +2 idi). Ölçülen pencere tanımdakinden farklıdır: oynatıcı iki durak ileri
  önyüklediği için d_j'nin kritik yolu çoğunlukla d_(j−1)'de iner, d_j'de inen p(j+2) + l(j+2) + t(j+2→j+3) +
  r(j→j−1)'dir (ör. d1: p3 219 + l3 325 + t34 951 + r10 205 kB). En büyük ölçülen pencere 2,10–2,16 MB ✓ (B 2,32 / 2,44
  ✗); d6'dan sonra ~0. Dört koşuda klipli 7 geçişin hepsi hazırdı (yedek 0).
- **Geri klip sırası (§11.2-3):** 4 koşu × 6 ters klip = **24/24** indirme yalnız dinlenmede başladı: faz `dur`, acil
  kuyruk 0, pencere kuyruğu 0, `bostaAcik`, varıştan 1,12–2,60 s sonra (≥ 1 s ✓). İniş 4G'de r32 2,3–2,6 s, r43 2,1–2,3
  s. Sıra (dikey H.264): d0'da t01 → l1 → t12 → l2 → t23; 0→1 geçişinde l3 → t34; d1 dinlenmesinde r10; 1→2'de l4 → t45;
  d2'de r21; … d6'da r65 (`boyut.json` → `sira`, `ters`).

### 10.2 Performans (prod, 4× CPU, 20 adım 0→10→0, iki koşu)

| Giriş | fps | uzun kare (> 50 ms) / 20 adım | en uzun | düşen kare | jest → ilk yeni kare |
|---|---|---|---|---|---|
| mobil dokunma 390×844 | 59,8 / 59,8 | **0 / 1** (7→6 sayfa çevirme 50,1 ms) ✓ | 46,1 / 50,1 ms | **0 / 856** ×2 ✓ | klipli adım p50 33–49 ms; 0→1 650 ms, 9→10 850 ms, 6→5 650–667 ms (tasarımdaki DOM ön evresi 600 / 800 / 620 ms) |
| masaüstü fare 1280×800 | 59,9 / 59,9 | **0 / 0** ✓ | 39,4 / 38,4 ms | **0 / 856** ×2 ✓ | p50 49 ms |

(B: mobil 2 uzun kare, en uzun 53,6 ms; masaüstü 0.) Geçiş süreleri (ileri): 2,41 · 2,01 · 2,82 · 2,41 · 2,02 · 2,41
(+0,62 DOM) · 1,60 ×3 · 2,62 s; geri 1,25×. **Kiosk tam tur 106,5 s** (1280×800, d0 → … → d10 → kapanış 9 s → beyaz →
d0; yedek 0). B'deki 93,0 s kapanışsızdı; fark kapanışta 9 s (A3-01) ve d4'te dört bölgenin hepsi (600 + 4 × 3,5 s,
A1-07). Girdide tur durur (`girdiSonrasi.duraklat`).

### 10.3 Dikişler (ekran görüntüsünde ölçüldü)

- **Lombar** (t01 kare 0 diski ↔ DOM amblem dairesi; yarı yükseklik daire uydurma, 366–378 ışın): merkez sapması 0,31 /
  0,55 / 0,75 px, yarıçap +0,77 / +1,20 / +0,74 px — 390×844 / 1280×800 / 844×390 ✓ (≤ 2 px). t01 C turunda değişmedi;
  sayılar B ile aynı. Sıra kuralı karelerde: logo 0 opaklığa inmeden disk görünmüyor.
- **d6 kapak** (t56 son video karesi ↔ DOM kapak, `brosurDikdortgen`'in contain'i; kapağın iç %92'si): konum kayması
  −0,48 / 0,02 / −0,47 px ✓ (≤ 0,5). ΔE00 ortalama render tonunda 3,59 / 3,16 / 3,93 (medyan 2,15 / 2,11 / 2,19), gerçek
  renkte 4,75 / 4,31 / 5,09 (B ile aynı; §11.4'te kabul). Kesişmede DOM kapak bu dikdörtgenden okuma boyutuna FLIP'le
  geçer: telefonda ×1,15 büyür, masaüstünde ×0,97, yatay telefonda ×0,70.
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
  dönüşüm artık klip başına `kirpimY`): gereken en çok α uzay 0,17 · altın 0,54 · hol 0,50 · krem 0,62 (tek piksel en
  kötü 0,65) → `--a` 0,68 / 0,66 / 0,65 / 0,70 (d5 dikey krem 0,84, A1-11) ile **18 durak × görünüm ✓**. d3 scrim
  `#1A1714` (A1-13).
- **Kodlanmış klip dikişleri** (K-C, ΔE00 ort.): t23 son → l3 0 2,21–2,97 ✓ (H.264'te `zones`), r32 son → l2 0
  1,48–1,83 ✓, kalkış l3 0 → t34 0 2,36–3,00; r43 son → l3 0 2,88–3,60 (kabul listesinde değil).

### 10.4 Değişenler

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

### 10.5 Bilinen sınırlar (C turu sonrası)

- **Gerçek iOS/Android testi yok.** Düşük Güç Modu, Safari'nin `poster`/ilk kare davranışı, iOS ısıtması (A2-01), kap
  birimi yedeği (iOS 15, A2-10), 100svh ve bellek yalnız benzetimle ya da hiç sınanmadı.
- **Bütçe (§11.2-3, statik tanım):** kritik yol d2 H.264 1,93 / 1,95, AV1 2,03 / 2,12 MB (> 1,8); pencere d3 AV1 2,56 /
  2,57 MB (> 2,5). HEVC ✓. 4G'de 4 s okur temposunda görünür etkisi yok (ölçülen pencere ≤ 2,16 MB, bütün geçişler hazır);
  daha yavaş ağda ya da hızlı adımlamada 300 ms → poster yedeği devreye girer. Karar orkestratörde (K-C seçenekleri).
- **d3 temsilî** (onay-listesi §14.1): ön plan OSM ekstrüzyonu + örneklenmiş ağaç. 16:9'dan geniş yatay ekranlarda
  (844×390) Beydağları kırpılır, iki etiketi ekran dışında.
- **p6 dikdörtgen dışı** fark (S2-C ✗): kesişmede yığın kenarı ve gölgesi 200 ms'de söner; t56 yeniden render'la kapanır.
- p3 posteri q80'de (218 / 229 kB; hedef 150 kB tutmadı). r43 son → l3 0 dikişi 2,88–3,60. Yatay AV1'de t34 47↔48
  ~1/255 (kodlayıcı; master 0).
- Yatay kırpımda d4 stantı ve d5 halkası sağ %38'e taşıyor (kabul, §11.4).
- **Katara Çöküntüsü (Mısır) d1/d2/d10'da koyu bir göl gibi** (A3-02): `hazirla.py` su maskesi deniz seviyesi altındaki
  karayı su sayıyor. C teslimi bu hâliyle; D turunda düzeltilir (§11.6-6).

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
