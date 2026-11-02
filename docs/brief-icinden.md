# `/icinden` — "COP31'in İçinden" brief'i (v2, 2 Kasım 2026)

Bu dosya `docs/brief.md`'nin ÜSTÜNE gelir; oradaki §2 kuralları (sadece kaydırma, mobil öncelik,
performans, reduced-motion, kurumsal kimlik, gerçek içerik, Next 16, Türkçe karakter) aynen geçerli.
Okuma sırası: `docs/brief.md` → bu dosya → `docs/brief-dunya-apple.md` §1/§4 (WebKit dersleri) →
`docs/cop31-logo.md` ve `docs/expo-harita.md` (hazır varlıklar). v1'in iki bağımsız denetimi (tasarım
K1, teknik spike K2) bu sürüme işlendi; K2'nin ölçülmüş motoru
`C:\Users\user\AppData\Local\Temp\claude\D--soft-cop31\4935df5b-f395-4622-886e-17daa992bcbf\scratchpad\icinden-spike\spike.js`
(+ `olc.mjs`, `index.html`) B için kaynak koddur.

## 0. Müşterinin yönü ve yorum

> "cop31 logosu zaten dünyaya benziyor; bunun içinden antalya fuar alanı, stant, stanttaki broşürler
> gibi sürekli bir interaktivite hâlinde olan animasyonlar ile ilerleyeceğiz."

Tek, kesintisiz bir **kamera dalışı**; animasyon zamana değil **kaydırmaya** bağlı (scrub), parmak her
an kamerayı sürer. Kural: **ölçek yalnızca artar**; döngü, son katmanın içinde ilk katmanın (küre)
yeniden bulunmasıyla kapanır (Droste). Dalış noktalarının çoğu daire: amblem diski → küre; rotunda →
zemin halkası → "Bugün" diski → broşürdeki slogan dairesi; arka kapaktaki küre fotoğrafı → küre.
Bölüm bölüm kilitli adımlama (`adim.ts`) bu rotada YOK.

Rota `/icinden`, başlık "COP31'in İçinden". Klasörler `src/app/icinden/`, `src/components/icinden/`.
Diğer rotalar aynen kalır.

## 1. Duraklar ve katmanlar (10 durak + kapanış)

Sahne koordinatı **d** sürekli; tam sayı d = durak. Belge: 10 `<section data-durak="k">` (k = 0…9) ve
ardından snap'siz kapanış bölümü. Bölüm yükseklikleri geçişin ölçek oranına göre (svh):
`[100, 220, 160, 120, 120, 100, 100, 100, 160]` (k→k+1 geçişi k. bölümün yüksekliğinde sürer; 9. bölüm
100svh). d = k + (y − top_k)/(top_{k+1} − top_k); top'lar `offsetTop` ile ölçülür (`innerHeight` ASLA).

Her durakta **plato**: |d − k| ≤ 0,12 iken kamera sabit, panel tam opak. Kamera çapası dikeyde
(vw/2, 0,38·H), yatayda (0,62·vw, H/2). Her katman 1000×1000 nominal birimde yazılır; durakta
`min(vw, H)·sig` kadar sığdırılır (K2 modeli).

| d | Durak | Katman ve içerik | Kamera / geçiş | Metin (nesnenin üstünde; ayrı panel yalnızca d1 ve d4) | Dinlenmede canlılık (tek motif) |
|---|---|---|---|---|---|
| 0 | Açılış | **Resmî COP31 Türkiye Antalya logosu** (dikey, `Cop31Logo`, orijinal oran/renk) saf beyaz zeminde, koruma alanıyla, ortada TEK BAŞINA. AK Gençlik kimliği AYRI bir üst şeritte (sayfanın sahibi): `logo-genclik-kollari.png` + "AK Parti Gençlik Kolları · COP31 Antalya standı". Logonun altında nötr satır "COP31 Türkiye · Antalya · 9–20 Kasım 2026". "Aşağı kaydır" zıplamayan düz metin. | Sabit. | — | Hiç hareket yok (resmî işaret). |
| 1 | Dünya | **cobe küresi** (/dunya'daki açık GL_COLORS, beyaz zemin; lacivert uzay YOK). Küre `cop31Amblem.dikey` diskiyle aynı merkez/çapta belirir. | d 0,10–0,40: logonun TAMAMI yerinde, kırpılmadan ve ölçeklenmeden 1→0 söner; d 0,20–0,45: küre aynı diskte 0→1; zoom ANCAK d ≥ 0,45'te başlar. Küre Expo koordinatını (36,9398 K 30,8176 D) öne çevirir. | Panel (≤ 45 kelime): "Dünya Antalya'da buluşuyor" — COP31, 9–20 Kasım 2026, Antalya Expo, ~150.000 yabancı ziyaretçi (`content.cop31`, `facts`). | phi'de ±4°, 12 s salınım (Türkiye önde); Expo işaretinde 2,4 s nabız. |
| 2 | Antalya Expo | Durak olmayan iki ara katman: **Türkiye kıyı silüeti** (`turkiye-silueti.ts`, H3) ve **Antalya Körfezi** (`expoHarita.kiyi/deniz`, havaalanı `pistAna`). Sonra **Expo ayrıntı haritası** (`expoHarita`: expo poligonu vurgulu, salon, `yollar.ana/ikincil`, D400; seralar/park konumları/servis yolları ÇİZİLMEZ; `binalar` çok soluk ya da yok). Harita etiketleri haritada: "Antalya Expo Center", "Antalya Havalimanı", "D400". **Pin YOK** (salon/stant no bilinmiyor; ONAY). | Küre scale ≤ 4 ile ~3.200 km kadraja iner; silüet önce noktalı (round cap + dasharray) başlar, ölçek büyüdükçe düz çizgiye kapanır (cobe'nin nokta dili haritaya akar); körfez → Expo poligonu. Odak d ≥ 1,3'ten itibaren Expo koordinatında. | Haritanın üstünde: "Antalya Expo Center · Aksu · 9–20 Kasım 2026" ve "Salon · Stant: —" (ONAY'a kadar boş bırakılmaz, satır hiç gösterilmez). | Expo konturunda akan kesik çizgi. |
| 3 | Stant | Expo poligonu → durak olmayan **salon dikdörtgeni** (`expoHarita.salonlar[0]`) → **stant planı** (`StantPlani.tsx`'ten kopyalanıp uyarlanır; üstten görünüm; krem zemin). 4 bölge adı PLANIN ÜSTÜNDE (`stant.bolgeler`), spot döngüsü 3,5 s; altta tek satır "#YaniBanaEmanet · GençİKlim". | Krem, planın dikdörtgeni ekranı doldurdukça gelir; global renk animasyonu YOK. | Planda. | Bölge spot döngüsü. |
| 4 | Buradasın · Bugün | Rotunda: **zemin halkası** (dönemler, `donemler`) ve ortasında büyük serif "Buradasın / Bugün" (`stant.zemin`). Çevresinde **12 sütun yüzü** kadran gibi (`emanet.ts`: serif numara, ad, il, dönem çipi); aktif yüz saat 6 konumunda dik ve büyük. Reduced-motion: 12 satırlık liste. | Planda rotunda dairesine dalış; dış yolculuğun doruğu. | Panel: `stant.slogan` + aktif sütunun tek satırı (ad · il · dönem · emanet cümlesi). | Kadran her 4,5 s'de 30° döner (spot = aktif sütun). |
| 5 | Broşür kapağı | "Bugün" diski büyüyerek kapaktaki **lacivert slogan dairesine** ("Gezegenimiz Ortak Evimizdir", script) dönüşür; kapak onun çevresinde kurulur: globe-foliage dairesel maske, iç içe daireler, "COP31'de AK Gençlik", "AK Parti Gençlik Kolları Türkiye" (`/brosur` cover.tsx'ten YALNIZCA geometri; `br-c-*` zamanlı girişler ve reveal.tsx ALINMAZ). Broşür, krem zemin üstünde gölgeli beyaz kâğıt nesnesi; kenarlarda krem görünür. | Eşleşme kesmesi: daire → daire (broşür katmanının ebeveyni rotunda, rect = "Bugün" diski). | Kapağın altında tek satır "Standdan alabileceğin broşür" ve sayılar: 1.000.000+ genç üye · 81 il · 922 ilçe (`stats`). | Kesik yörünge yayları 60 s'de bir tur. |
| 6 | Buluşmalar · Şölen | Aynı broşür katmanı; **sayfa çevirme** (sırt çizgisi etrafında `scaleX` katlama + gölge gradyanı; `preserve-3d` YOK). Sayfa: 50+ Gençlik Buluşması, 100.000+ genç · 16 Mayıs 2026 Kocaeli (`bulusmalar`, `solenler`), tek satır "2017'de seçilme yaşı 18 · TBMM'de 30 yaş altı 5 milletvekilinden 4'ü AK Parti'den" (`facts`). Tek **polaroid dalışı**: dikey stadyum karesi (`solenKocaeliSahaSelam` p18) ekranı doldurur, 100.000+ sayacı d'ye bağlı akar. | Kapak → sayfa çevrilir; sayfadaki polaroide dalış. | Sayfada. | Polaroid pin etrafında ±1,2° sarkaç, 5 s. |
| 7 | İklim eylemleri | Sayfa: 300 fidan · Üsküdar Hatıra Ormanı · Genç İklim paneli (`iklim`); dikey polaroidler (`fidanDikimiEkip`, `copToplamaOrman`). | Sayfa çevirme. | Sayfada. | Sarkaç (faz kaydırmalı). |
| 8 | Arka kapak | Arka kapak (bro-12 geometrisi: küre fotoğrafı dairesi + slogan dairesi): `backCover` alıntısı, Başkan'ın mesajından ilk cümle, Av. Yusuf İbiş (`baskanMesaji`); portre **p22 `solenKocaeliSahaIkili`** (p06 KULLANILMAZ, bkz. foto-yeni.md). | Sayfa çevirme. | Sayfada. | — |
| 9 | Ortak evimiz | Arka kapaktaki **küre fotoğrafı dairesine** dalınır; fotoğraf aynı dairenin içinde açılıştaki açık cobe küresine çözülür. Üstünde script slogan "Gezegenimiz Ortak Evimizdir". COP31 logosuna DÖNÜLMEZ. | Döngü kapanır; kamera hiç geri çekilmez. Küre dairesi ekranı doldurdukça kremden beyaza. | Yalnızca slogan. | Küre 40 s'de bir tur. |
| — | Kapanış (akış, snap'siz) | `IcindenKapanis`: logolar, "AK Parti Gençlik Kolları Türkiye", sosyal hesaplar, akgenclik.org.tr, "#YaniBanaEmanet", "© OpenStreetMap katkıda bulunanlar" (`OSM_ATIF`), "COP31 Türkiye logosu etkinliğe atıf amacıyla kullanılmıştır." | Kapanış görünür olunca cobe durur. | — | — |

Ek kurallar: parti içeriği (Cumhurbaşkanı fotoğrafları, 2017, TBMM) d < 5'te GÖRÜNMEZ. Kök katman
**değiştirilebilir** kurulur: logo onayı gelmezse d0, broşürün kendi küre dairesiyle başlar; motor ve
diğer duraklar değişmez (`DURAKLAR[0]` tek satır). İlerleme göstergesi 13 nokta DEĞİL, **kadraj genişliği
okuması** (sabit katmanda küçük satır): "~12.700 km" → "~1.500 km" → "~50 km" → "~2 km" → "~300 m" →
"stant" → "Bugün" → "sayfa n/12" → "ortak evimiz". Her durak başlığının altına tek satır İngilizce
karşılık (ONAY; stant bantları iki dilli). Yatay ekranda (vw/H ≥ 4:3) panel sağda, en fazla %38 genişlik.

## 2. Kaydırma modeli (K2 ölçümleriyle)

- **Native kaydırma + scrub.** rAF döngüsü her karede `scrollY`'yi YALNIZCA OKUR; d yukarıdaki
  bölüm tablosundan. d tam sayıya 1 px'ten yakınsa tam sayı (WebKit tam sayıya keser).
- **CSS snap YOK** (`html.style.scrollSnapType = "none"` efektte satır içi, cleanup'ta geri; Chrome'da
  proximity tekerlekte ve yavaş dokunmada d=0'dan çıkılamıyor, ölçüldü). **Durak mıknatısı = YÖNLÜ JS
  yerleşme** (spike.js `yerles`, settle=yon): kaydırma 220 ms susup parmak kalkınca scrollY bir kez
  okunur; SON HAREKET YÖNÜNDEKİ durağa (ileri `ceil`, geri `floor`) 0,2·H'den yakınsa tek
  `scrollTo({top, behavior: "smooth"})` + 700 ms koruma; kullanıcı geldiği durağa ASLA geri çekilmez;
  rAF içinde scrollTo YOK. Uzaktaysa serbest.
- **Boyut/döndürme:** `resize` olayında (rAF'tan önce) top'lar yeniden ölçülür ve son çizilen d
  korunarak tek `scrollTo`; ResizeObserver yalnızca yazı tipi/geç yerleşim için (tek başına yetmez,
  ölçüldü 6 → 5,403). Sahne `position: fixed; inset: 0; height: 100lvh`; bölümler `100svh` katları.
- **Reduced motion:** scrub kapalı; sahne = `floor(d + 0,15)` durağının dinlenme kadrajı; paneller
  akışta (bölümlerin içinde); yerleşme kapalı; d9 tek kare; canlılık kapalı.
- **Kiosk `?auto=1`:** kiosk kendi `pos` değişkenini yazar ve sahne d'yi pos'tan alır; geçiş ~2,2 s/durak
  (bölüm yüksekliğiyle orantılı), durakta 5 s (d4'te 600 + 3×4.500 ms), sonda ekran 600 ms içinde beyaza
  söner ve d=0'a döner (tur ≈ 85 s); yerleşme kapalı; kullanıcı girdisinde durur, 30 s sonra en yakın
  duraktan sürer. `window.location.search` istemcide okunur.
- **Canlılık (dinlenme):** durak başına §1'deki tek motif; ayrı ofset olarak tutulur, geçişin ilk
  %15'inde 0'a sönümlenir (scrub sıçramaz); kaydırma sürerken durur, 400 ms sessizlikten sonra başlar;
  gizli sekmede ve reduced-motion'da kapalı; yalnızca transform/opacity; metin ve panel asla oynamaz.
- Tek etkileşim kaydırma; izin verilen linkler brief.md §2.1.

## 3. Derinlik motoru (B: `derinlik.ts`, `Katman.tsx`, `IcindenSahne.tsx`) — K2 spike'ından taşınır

1. `derinlik.ts` = spike.js "MOTOR ÇEKİRDEĞİ" (tipli, saf modül): `NOMINAL=1000`, `GORUNUR_MIN=1/6`,
   `GORUNUR_MAX=6`, `UC_PAYI=0,15`; `clamp, rampa, modelKur, agacYolu, capa, durakKamera, kameraAt`
   (YALNIZ "sabit" dalı), `pencere, sahneDurumu, dHesapla` (bölüm tablosuyla, değişken yükseklik).
2. Katman `{ id, ebeveyn, rect: {x, y, w} }`: rect ebeveynin 1000×1000 nominalinde KARE ve eksene hizalı;
   ebeveyn dizide önce; ağaç zincir olmak zorunda değil. Dünya dönüşümü modelKur'da bir kez.
   Durak `{ katman, sig, zemin, sahne?, gir?, cik? }`. Aynı katman birden çok durağa bağlanabilir
   (broşür: d5–d8; küre: d1 ve d9).
3. Kamera = benzerlik dönüşümü; `ln(z)` doğrusal, merkez **sabit noktalı**:
   `T(t) = T0 + (T1 − T0)·(z(t) − z0)/(z1 − z0)` (doğrusal merkez hedefi 1,65× savuruyordu, ölçüldü).
   Ease yok; plato §1.
4. Görünürlük: yalnızca k→k+1 geçişinin AĞAÇ YOLUNDAKİ katmanlar aday; `r = ekran ölçeği / durak ölçeği`,
   alfa = pencere(ln r; 1/6…1/3 giriş, 3…6 çıkış); **uç bekçisi** (başlangıç katmanı dışındakiler
   t ∈ [0; 0,15]'te açılır, bitiş katmanı dışındakiler t ∈ [0,85; 1]'de kapanır) → tam durakta yalnız
   durağın katmanı görünür (d0'da logo tek başına). Durak başına `gir/cik` override (0→1 çapraz geçişi
   §1'deki d aralıklarıyla). En fazla 3 katman görünür. Giren katmanın kare kutu kenarı görünmez:
   kenar ebeveyn bölgesiyle birebir ya da `mask-image` ile yumuşatılır.
5. Transform yazımı: kutu 1000×1000 px, `position:absolute; left/top:0; transform-origin:0 0;
   contain:strict`; `transform: translate(x px, y px) scale(s)` (s = r·min(vw,H)/1000 ≤ 2,34 mobil,
   ≤ 4,8 masaüstü); opacity `toFixed(3)`; gizleme `visibility:hidden` (display:none layout'u 1,5 → 135 ms
   yapıyor, ölçüldü); `will-change: transform` yalnız görünürken; değişmeyen string yazılmaz; sarmalayıcıda
   React `style` prop'u YOK (yalnızca efektten yazılır). Sahne `contain: strict; overflow: hidden;
   pointer-events: none`.
6. cobe: canvas, katman kutularının KARDEŞİ (kamera dönüşümü almaz); z-index küre derinliği, opacity küre
   alfası; `scale/offset` küre katmanının ekran kutusundan türetilir (çap 1000·s, merkez x+500s, y+500s);
   yalnız küre katmanı yolda ve alfa > 0 iken (+0,2 d ısınma) `toggle(true)`; DunyaScene'deki "drawn"
   kalıbı (phenomenon `onRender`'ı çizimden sonra çağırır) ile GL ve DOM aynı d'yi gösterir; DPR
   `min(dpr, 2)`, dar ekranda 1,5; cobe `scale` ≤ 4; unmount/Activity'de `globe.destroy()`; phenomenon'un
   resize dinleyicisi sızıntısına dikkat.
7. Görseller: `loading="lazy"` bu yerleşimde ertelemiyor (ölçüldü) → katman görseli durağı `[k−2, k+1]`
   penceresine girince mount edilir (src kapısı); Next 16'da `priority` yerine `preload`, yalnız d0–d1
   görsellerinde; ≤ 3× büyütme; dalınan fotoğraflar dikey ve hedef ekran boyutunda.
8. Hidrasyon: render'da `Math.random`/`Date`/`window` yok; logo katmanı JS gelmeden CSS ile dinlenme
   kadrajında görünür; ilk efekt karesi scrollY'den d'yi okuyup zorla çizer; html satır içi stiller,
   rAF, zamanlayıcılar, dinleyiciler ve cobe cleanup'ta geri alınır (Next 16 Activity: rota gizlenir,
   DOM tutulur; `node_modules/next/dist/docs/01-app/` ilgili sayfalar).
9. A ile sözleşme: `IcindenSahne` 'use client'; A'nın katman içerikleri `children` olarak
   `<Katman id="...">` içine geçer (sunucu ya da istemci bileşeni olabilir). B, d'yi dışa verir:
   `derinlik.ts`'te `export function dAbone(cb: (d: number, hareketli: boolean) => void): () => void`
   (rAF döngüsünden çağrılır) — A'nın broşür sayfa çevirme ve sayaç bileşenleri bununla kendi
   transform'larını yazar. Spot: B, katman kök elemanına `data-spot="n"` yazar (brief-dunya-2 §2
   kuralları: 600 ms sonra başlar, geçişte 0; reduced'da 0); A CSS ile vurgular/kadranı döndürür.
   Dev kancası `window.__icinden = { topler, sonD, sahneDurumu }` (yalnız `NODE_ENV !== "production"`).
10. Performans hedefi: 4× CPU kısıtlamada ortalama ≥ 40 fps (spike'ta 59–60), uzun kare (> 50 ms) ≤ 3;
    ilk yükleme JS ≤ 130 kB gz (cobe dahil); 390×844'te yatay taşma yok.

## 4. Varlıklar (hazır)

- `src/components/icinden/Cop31Logo.tsx` (H1): `duzen "dikey"|"yatay"`, gruplar `data-parca="amblem"|"yazi"`,
  `cop31Amblem.dikey = { viewBox "0 0 450.839 636.03", cx 225.384, cy 171.213, r 160.445 }`. Renk/oran
  değiştirilmez, parçalar ayrı animasyonlanmaz; yalnızca bütün hâlinde opaklık. Bkz. `docs/cop31-logo.md`.
- `src/components/icinden/expo-harita.ts` (H2): metre, orijin Expo ağırlık merkezi (36,93972 K
  30,81758 D), y güneye artar; `expoHarita.{expo, salonlar, binalar, yollar{ana,ikincil,servis},
  pistAna, kiyi, deniz, kiyiBbox}`, `noktalar.{expo, havalimani, kentMerkezi, salon}`, `yolPath/alanPath/
  birlesikPath/konum`, `OSM_ATIF`. Bkz. `docs/expo-harita.md`.
- `turkiye-silueti.ts` (H3, bu turda): Natural Earth 1:50m (kamu malı) ülke sınırları → Türkiye + komşu
  kıyılar silüeti, aynı projeksiyon ve orijin (Expo), DP ~2 km, ≤ 30 kB; `turkiyeSilueti: { kara:
  Halka[], bbox }`; kaynak notu `docs/turkiye-silueti.md`.
- Stant: `src/components/dunya/StantPlani.tsx` (kopyala/uyarla), `src/lib/stant.ts`, `src/lib/emanet.ts`;
  render'lar sitede KULLANILMAZ (referans: scratchpad `pdf/stant-{1..8}.png`).
- Broşür: `src/lib/content.ts`, `src/components/brosur/cover.tsx` (yalnız geometri), `src/lib/photos.ts`,
  `docs/foto-yeni.md`, `public/photos/*`. cobe: `node_modules/cobe/README.md`, `DunyaScene.tsx` (açık GL_COLORS,
  Antalya/Expo koordinatı, "drawn" kalıbı; kopyala, dokunma).
- Fontlar: Montserrat (display), Great Vibes (script), Lora (serif; `/icinden` page.tsx'te
  `next/font/google`, `--font-serif`, 400/600/700, latin + latin-ext). `uppercase` yasak.
- Palet: dışarısı (d0–2) beyaz/mist + açık küre + açık harita; içerisi (d3–8) stant kremi `#F7E6CD`,
  koyu yeşil `#28332F`, ahşap `#B49168`; broşür kremin üstünde beyaz kâğıt; d9 ve kapanış beyaz.
  Tek turuncu: marka `#F08322`. Lacivert yalnızca broşürün slogan dairesinde. Panel: %94 opak düz beyaz,
  `backdrop-filter` YOK, ≤ 42svh, başlık ≤ 2 satır, gövde ≤ 45 kelime.

## 5. Dosya sahipliği (paralel çalışma, ÇAKIŞMA YOK)

| Ajan | Yazabildiği dosyalar |
|---|---|
| H3 | `src/components/icinden/turkiye-silueti.ts`, `docs/turkiye-silueti.md` |
| B (motor + sahne) | `derinlik.ts`, `Katman.tsx`, `IcindenSahne.tsx` (sabit sahne, kamera, cobe, yerleşme, kiosk, canlılık ofsetleri, kadraj okuması), katman görselleri: `KureKatmani.tsx`, `HaritaKatmani.tsx` (silüet, körfez, Expo, salon), `StantKatmani.tsx` (plan), `RotundaKatmani.tsx` (halka + "Buradasın/Bugün"; sütun yüzleri A'dan `children`), `icinden-sahne.css` |
| A (içerik) | `src/app/icinden/page.tsx` (metadata, Lora), `IcindenIcerik.tsx` (10 bölüm + kapanış akışı, paneller, reduced-motion düzeni), `Panel.tsx`, `SutunYuzleri.tsx` (12 yüz, kadran CSS), `Brosur.tsx` (kapak, 3 sayfa, arka kapak, sayfa çevirme `dAbone` ile, polaroid dalış görseli, sayaç), `IcindenKapanis.tsx`, `icinden.css` |
| Denetim/düzeltme | Hepsi + `src/app/page.tsx` (yeni öne çıkan kart "COP31'in İçinden") + `docs/onay-listesi.md` (§14: salon/stant no, logo bildirimi brand@cop31.tr, atıf satırları, İngilizce satırlar, kiosk süresi, QR'ın standdaki yeri) |

B ilk 20 dakikada `derinlik.ts` + `Katman` + `dAbone` + 10 duraklı iskeleti (yer tutucu katmanlar) teslim
eder ve raporuna yazar; A o API ile doldurur. A, B'nin iskeleti gelene dek `IcindenIcerik`'i bölümler,
paneller ve `Brosur` içeriğiyle yazar. Karşı tarafın dosyasına dokunulmaz; eksikler raporda "karşı
taraftan beklenen" olarak yazılır. Dev sunucu çalışıyor; `next build` ÇALIŞTIRMA.

## 6. Ölçüm ve kanıt

- `npx tsc --noEmit -p . --incremental false`; `npx eslint src/app/icinden src/components/icinden`.
- `node scripts/shot.mjs /icinden` (+ `--desktop`, `--reduced`): 0 hata/uyarı, yatay taşma yok.
- `scratchpad/icinden.mjs` = spike `olc.mjs`'in `http://localhost:3000/icinden`'e uyarlanmışı
  (seçiciler `section[data-durak]`, `[data-katman]`; kanca `window.__icinden`): senaryolar perf (4× CPU,
  mobil + masaüstü), kare (d adım 0,25 → `.qa/icinden-d-*.png`, pano), sure, tuzak (6 × 150 px dokunma,
  8 × 100 px tekerlek, geri yön), stale (scrollY 1–2 kare gecikmeli, titreme 0), boyut (döndürmede d
  korunur), lazy (görsel kapısı), kiosk, reduced. Headless'ta sentetik touch jesti kaydırmaz:
  dokunma için `Input.dispatchTouchEvent`.
- Reduced-motion'da 10 durağın hepsi son karede, paneller okunur.
- Gerçek Apple cihaz testi bu ortamda yapılamaz; raporda açıkça yazılır (onay-listesi'ne de).

## 7. Teslim ölçütü

1. Tek kesintisiz dalış (logo → küre → silüet/körfez → Expo → salon → stant → rotunda → broşür → sayfalar
   → arka kapak → küre); her geçişte "içine giriş" hissi; kamera hiç geri çekilmez; d0'da logo tek başına.
2. Kaydırma her an kamerayı sürer; durağa yakın bırakınca yönlü yerleşme; iOS taklidinde titreme 0.
3. Resmî logo orijinal oran/renkte, yerinde sönerek küreye dönüşür; AK Gençlik kimliği üst şerit ve
   kapanışta; parti içeriği d < 5'te yok; kök katman değiştirilebilir.
4. Gerçek içerik; yeni fotoğraflar `next/image` + `sizes`; p06 yok.
5. tsc/eslint temiz; shot.mjs üç kipte temiz; icinden.mjs perf/kare/tuzak/stale kanıtı.
6. `docs/onay-listesi.md` §14 ve ana sayfa kartı.
