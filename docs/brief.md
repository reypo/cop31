# COP31 — AK Gençlik prototip sitesi: ajan brief'i

Bu dosya, prototip konseptlerini kodlayan tüm ajanların ortak referansıdır. Önce bunu, sonra kendi konsept bölümünü oku.

## 1. Bağlam

- Etkinlik: COP31 (BM İklim Konferansı), 9–20 Kasım 2026, Antalya Expo. ~150.000 yabancı ziyaretçi bekleniyor.
- Müşteri: AK Parti Gençlik Kolları ("AK Gençlik"). Standlarında bir QR kod olacak; ziyaretçi telefonuyla okutup siteye gelecek.
- Bugün 1 Kasım 2026. Bu aşamada **4 farklı konsepti temel düzeyde, canlı görülebilir** hale getiriyoruz; müşteri/ekip birini seçecek. Cilalı final değil, ama her konseptin fikri ekranda net okunmalı ve telefonda akıcı çalışmalı.
- Kaynak materyal: 12 sayfalık Türkçe broşür. Metinleri `src/lib/content.ts` içinde, fotoğrafları `public/photos/` içinde hazır.

## 2. Kesin kurallar (her konsept için)

1. **Sadece kaydırma.** Kullanıcıdan hiçbir seçim, form, buton, modal, swipe-galeri istenmez. Tek etkileşim: dikey scroll. İzin verilen linkler: sayfa sonundaki sosyal medya/web sitesi linkleri ve sol üstte küçük bir "← Konseptler" linki (`/`'a döner).
2. **Mobil öncelik.** 390×844 ekran birincil hedef; masaüstünde de bozulmamalı (içeriği ortala, max genişlik ver). Yatay scroll asla olmasın.
3. **Performans.** Kalabalık alanda, zayıf sinyalde açılacak. three.js, GSAP, lottie, büyük kütüphane yok. Animasyon: `requestAnimationFrame` içinde scroll ilerlemesi okunup CSS `transform`/`opacity` ile uygulanır (layout tetikleyen özellikler animasyonlanmaz). Scroll dinleyicileri `{ passive: true }`. Fotoğraflar `next/image` ile ve `sizes` verilerek; ekran dışı fotoğraflar lazy. İlk ekranda fotoğraf varsa `priority`.
4. **`prefers-reduced-motion`**: scroll-bağlı animasyonlar sabit/son karede durur, içerik tamamen okunabilir kalır.
5. **Kurumsal kimlik.** Aşağıdaki renk/font tokenları dışına çıkma. Dekoratif emoji yok. Broşürün motifleri (yeşil çerçeveli polaroid kart + turuncu pin, yaprak etiketi, iç içe daireler/yörünge çizgileri, el yazısı slogan) serbestçe kullanılabilir.
6. **Gerçek içerik.** Lorem ipsum yok; metinler `src/lib/content.ts`'ten. Sayılar broşürdeki gibi: 1.000.000+ üye, 81 il, 922 ilçe, 50+ buluşma, 100.000+ genç (16 Mayıs 2026 Kocaeli), 300 fidan (Üsküdar Hatıra Ormanı), 2017 seçilme yaşı 18, TBMM'de 30 yaş altı 5 mv'den 4'ü.
7. **Dosya sınırları.** Her konsept yalnızca kendi klasörlerine yazar: `src/app/<slug>/` ve `src/components/<slug>/`. `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/*`, `src/app/page.tsx`, `scripts/*` ve diğer konseptlerin klasörlerine dokunma (Temel ajanı hariç). Ortak bir şeye ihtiyacın varsa kendi klasöründe kopyala.
8. **Komutlar.** `next build` ÇALIŞTIRMA (dev sunucusu zaten http://localhost:3000 adresinde çalışıyor ve dosya değişince kendini günceller). Kontrol için: `npx tsc --noEmit -p .` ve `npx eslint src/app/<slug> src/components/<slug>`. Görsel kontrol için `node scripts/shot.mjs /<slug>` (bkz. §6).
9. **Next.js 16.** Bu sürümde kırıcı değişiklikler var; emin olmadığın API için `node_modules/next/dist/docs/01-app/` altındaki dokümanı oku. Bilinen noktalar: App Router; `cacheComponents: true` açık (sayfalar statik prerender edilir; `headers()`/`cookies()`/`searchParams` gibi dinamik API'leri kullanma — `?auto=1` gibi parametreleri istemci tarafında `window.location.search` ile oku); scroll/WebGL/`window` kullanan her bileşen `'use client'` ile başlar ve `page.tsx` server component olarak onu sarar; `page.tsx` içinde `export const metadata = { title: '...' }` ver; Tailwind v4 `@import "tailwindcss"` ile ve `@theme inline` tokenları `globals.css`'te.
10. **Türkçe karakterler.** Fontlar `latin-ext` alt kümesiyle yüklü; İ/ı/ş/ğ/ü/ö/ç doğru görünmeli. `text-transform: uppercase` kullanma (Türkçe `i→İ` sorunu); büyük harf gereken metni doğrudan büyük yaz.

## 3. Marka tokenları (globals.css'te tanımlı, Tailwind sınıfı olarak kullan)

| Token | Hex | Kullanım |
|---|---|---|
| `--color-brand-blue` | `#0C77B6` | Ana başlıklar, vurgular |
| `--color-brand-navy` | `#1B4F9C` | Koyu mavi (kapak dairesi gradyan başlangıcı), koyu zeminler |
| `--color-brand-green` | `#47B27A` | Alt başlıklar, polaroid çerçeveleri, yaprak etiketleri |
| `--color-brand-teal` | `#1F8879` | Yeşilin koyu tonu, ikincil |
| `--color-brand-orange` | `#F08322` | Pin noktaları, küçük vurgular (az kullan) |
| `--color-brand-ink` | `#555454` | Gövde metni |
| `--color-brand-paper` | `#FFFFFF` | Zemin |
| `--color-brand-mist` | `#EEF4F8` | Mavimsi açık gri zemin alternatifi |

Tailwind'de: `text-brand-blue`, `bg-brand-green`, `border-brand-green` vb.

Fontlar (layout.tsx'te `next/font/google` ile yüklü, CSS değişkeni olarak):
- `--font-display` → **Montserrat** (Gotham'ın ücretsiz muadili). Ağırlıklar 400/500/700/900. Başlıklar 900 (Gotham Ultra hissi), alt başlıklar 700, gövde 400/500. Tailwind: `font-display`.
- `--font-script` → **Great Vibes** (slogan "Gezegenimiz Ortak Evimizdir" için). Tailwind: `font-script`.

Broşür görsel dili: beyaz zemin, bol boşluk, mavi 900 ağırlık başlık + yeşil 700 alt başlık + gri gövde. Fotoğraflar yeşil (`#47B27A`) 3px çerçeveli, 14px köşe yarıçaplı, hafif (-3°…+4°) döndürülmüş kartlarda; kartın üst ortasında turuncu yuvarlak "pin". Bölüm etiketi olarak yeşil yaprak şekli (içinde beyaz kısa metin).

## 4. Fotoğraflar (`public/photos/*.jpg`, genişlik×yükseklik)

| Dosya | İçerik | Boyut |
|---|---|---|
| `globe-foliage.jpg` | Yeşil yapraklar arasında dünya küresi — broşür kapağı, HERO | 1067×1600 (dikey) |
| `baskan-ve-cumhurbaskani.jpg` | Av. Yusuf İbiş ve Cumhurbaşkanı Erdoğan, ikili portre | 1600×1387 |
| `bayrak-kalabalik.jpg` | Gece, AK Parti ve Türk bayraklı kalabalık | 1120×630 |
| `genclik-bulusmasi-salon.jpg` | Salonda gençlerin arasında oturan Cumhurbaşkanı | 1600×1119 |
| `bulusma-samsun.jpg` | "Gençlik Buluşmaları Samsun" sahnesi | 550×751 (düşük çöz.) |
| `tbmm-genel-kurul.jpg` | TBMM Genel Kurul salonu, boş | 1600×900 |
| `tbmm-havadan.jpg` | TBMM binası havadan, Ankara | 1093×728 |
| `soz-genclikte-ankara.jpg` | "Söz Gençlikte Ramazan Ankara" sahne sohbeti, 11 Mart 2026 | 1600×1067 |
| `soz-genclikte-osmaniye.jpg` | "Söz Gençlikte Ramazan Osmaniye" panel, 6 Mart 2026 | 1600×1067 |
| `soz-genclikte-bursa.jpg` | Bursa, dolu amfi salon, yukarıdan | 1600×1066 |
| `soz-genclikte-senler.jpg` | Gece, ateş başında gençler, "Söz Gençlikte Şenler" pankartı | 1600×1067 |
| `solen-kocaeli-stadyum.jpg` | Kocaeli Stadyumu, Cumhurbaşkanı sahada, dolu tribünler | 820×550 |
| `solen-kocaeli-tribun.jpg` | Tribünde el sallayan gençler, "Gençlik Şöleni" pankartı | 824×550 |
| `solen-kocaeli-selam.jpg` | Cumhurbaşkanı el sallıyor, arkada "Gençlik Şöleni" yazısı | 831×550 |
| `fidan-dikimi-baskan.jpg` | Takım elbiseli genç kürekle fidan dikiyor | 1600×1067 |
| `cop-toplama-orman.jpg` | Ormanda çöp toplayan yelekli gönüllüler | 1200×1600 (dikey) |
| `genc-iklim-panel.jpg` | "Genç İklim" paneli, COP31 Türkiye logolu fon, 21-23 Ağustos 2026 İstanbul | 1600×900 |
| `hatira-ormani-tabela.jpg` | "AK Parti Üsküdar Gençlik Kolları Hatıra Ormanı" tabelasını imzalayan kişi | 1600×1200 |
| `fidan-dikimi-gencler.jpg` | İki genç birlikte fidan dikiyor | 1080×812 |
| `fidan-dikimi-ekip.jpg` | Mavi yelekli ekip fidan dikiyor | 1200×1600 (dikey) |

Logolar (`public/brand/*.png`, şeffaf): `logo-ak-parti.png` (1000×1200), `logo-genclik-kollari.png` (1200×1200), `soz-genclikte-turkiye.png` (1200×369, "Söz Gençlikte Türkiye" yazı logosu).

Yüzler önemli: `object-position` ile kırpma noktasını yüzlere göre ayarla.

## 5. Ortak teknik iskelet (Temel ajanı kurar)

- `src/app/layout.tsx`: Montserrat + Great Vibes (`latin`, `latin-ext`), `lang="tr"`, metadata `title: "COP31'de AK Gençlik"`, viewport `viewport-fit=cover`, `themeColor: '#0C77B6'`.
- `src/app/globals.css`: Tailwind v4 + `@theme inline` içinde yukarıdaki tokenlar; `html { scroll-behavior: auto }`; `.polaroid` ve `.leaf-tag` gibi 2-3 ortak yardımcı sınıf (isteğe bağlı, her konsept kendi stilini de yazabilir).
- `src/lib/content.ts`: broşür metinleri (bölüm bölüm, `as const`), istatistikler, sosyal linkler (`akgenclikgm` → X/Instagram/Facebook/TikTok, `https://akgenclik.org.tr`).
- `src/lib/photos.ts`: yukarıdaki tabloyu `{ src, width, height, alt }` objeleri olarak dışa aktarır.
- `src/lib/useScrollProgress.ts`: `'use client'`; verilen bir `ref`'in (uzun bir sarmalayıcı) viewport'a göre 0–1 ilerlemesini rAF ile hesaplayan, `prefers-reduced-motion` durumunda `1` döndüren hook. Konseptler bunu kendi klasörlerine kopyalayabilir ya da doğrudan import edebilir (`src/lib` yalnızca okunur).
- `src/app/page.tsx` (`/`): konsept seçici. Başlık, bir cümle açıklama, 4 konsept kartı (ad, bir cümle, "Aç" linki), en altta QR (istemci bileşeni `qrcode` paketiyle `window.location.origin` için QR üretir, "Telefonunla okut" notu). Sade, hızlı.
- `scripts/shot.mjs`: bkz. §6.

## 6. Görsel kontrol aracı: `node scripts/shot.mjs <route> [--desktop]`

`playwright-core` ile sistemdeki Chrome'u (`channel: 'chrome'`, headless) açar; iPhone benzeri viewport (390×844, deviceScaleFactor 2, isMobile, hasTouch); `http://localhost:3000<route>` adresine gider; `console.error`/`console.warn`/`pageerror` mesajlarını toplar; sayfa yüksekliğini ölçer; %0, %20, %40, %60, %80, %100 scroll konumlarında (her birinde 400 ms bekleyip) `.qa/<slug>-<nn>.png` ekran görüntüsü alır; `document.documentElement.scrollWidth > innerWidth` ise "YATAY TAŞMA" uyarısı verir; sonunda JSON özet basar (yükseklik, hata listesi, dosya yolları). `--desktop` ile 1280×800. Ekran görüntülerini `Read` aracıyla açıp kendin bak.

## 7. Konseptler

Rotalar: `/dunya` (A), `/fidan` (B), `/nabiz` (C), `/brosur` (D). Her sayfa en altta ortak kapanış bloğu içerir: logolar, "AK Parti Gençlik Kolları Türkiye", sosyal hesaplar, akgenclik.org.tr, slogan.

### A — `/dunya` "Antalya'dan Dünyaya"

Tek sürekli sahne: `cobe` WebGL küresi (`node_modules/cobe/README.md`'yi oku; ~5 kB, mobilde 60 fps). Küre `position: fixed`, tam ekran arkada; önde uzun bir scroll konteyneri (yaklaşık 8 ekran yüksekliği) ve bölüm metinleri (yarı saydam beyaz paneller, mavi başlık) kayarak geçer. Scroll ilerlemesi (0–1) küre durumunu sürer: `phi/theta` (dönüş), `scale` (zoom), işaretçiler.

Storyboard (ilerleme → küre → metin):
- 0.00–0.12: uzaydan dünya, ağır dönüş; Türkiye görünür tarafa geliyor. Başlık: "COP31'de AK Gençlik", alt: "Sürdürülebilir Bir Gelecek İçin Güçlü Gençlik Hareketi".
- 0.12–0.30: küre Türkiye'ye zoom (scale ~2.5–3); **81 il işaretçisi** sırayla beliriyor (ilerlemeye göre ilk N il), **922 ilçe** daha küçük/soluk noktalar olarak (il koordinatlarına rastgele-ama-deterministik ofsetlerle türet); sayaç 0→1.000.000+ (sayaç animasyonu scroll'a bağlı, zamana değil). Metin: "Biz kimiz" bölümü.
- 0.30–0.45: il işaretçileri yeşile döner, "fidan" hissi; polaroid kartlar (fidan dikimi fotoğrafları) metin akışında. Metin: iklim eylemleri, Hatıra Ormanı 300 fidan, Genç İklim paneli.
- 0.45–0.60: Ankara → Osmaniye → Bursa → Samsun → Kocaeli işaretçileri sırayla parlıyor (turuncu), Kocaeli'de büyük işaretçi. Metin: Gençlik Buluşmaları (50+), Şölen (100.000+).
- 0.60–0.72: Antalya'ya zoom (scale ~4), Antalya işaretçisi nabız gibi; metin: "COP31'de buradayız", 9–20 Kasım 2026, Antalya Expo; Başkan'ın kısa mesajı.
- 0.72–0.88: küre geri çekilir (scale 1), dünya genelinde ~40 başkent işaretçisi sırayla belirir (COP31'e gelen dünya). Metin: "Bugünü ve Geleceği Birlikte Şekillendiriyoruz" + kapanış konuşmasından 1-2 cümle.
- 0.88–1.00: WebGL küre söner, yerine `globe-foliage.jpg` dairesel maskede + kapaktaki yörünge çizgileri (SVG, `stroke-dashoffset` ile çizilir) + `font-script` slogan "Gezegenimiz Ortak Evimizdir". Sonra kapanış bloğu.

Detaylar: 81 ilin lat/lng tablosunu kendin yaz (yaklaşık değerler yeterli). cobe'de `onRender(state)` ile `state.phi`, `state.theta`, `state.scale`, `state.markers` güncellenir; Türkiye'yi ortalamak için gereken phi/theta'yı deneyerek bul (Türkiye ~39°K, 35°D). `?auto=1` ile kiosk modu: sayfa kendi kendine 60 saniyede sonuna kayar, 3 sn bekler, başa döner (stand ekranı için). Küre canvas'ı DPR'ı `Math.min(devicePixelRatio, 2)` ile sınırla.

### B — `/fidan` "Bir Fidanın Yolculuğu"

Ekranda `position: sticky` tek bir SVG fidan; scroll ilerledikçe büyür. Sağda/altta metin bölümleri kayar. Büyüme aşamaları = bölümler:
- 0.00–0.15: toprak çizgisi, tohum; başlık.
- 0.15–0.35: **kökler** aşağı/yanlara yayılır (`stroke-dasharray` ile çizilir), uçlarında 81 küçük nokta belirir → "81 il, 922 ilçe, 1.000.000+ üye" (Biz kimiz).
- 0.35–0.50: **gövde** yükselir → Cumhurbaşkanının gençlik vizyonu; 2017 seçilme yaşı reformu ve TBMM gövdede iki "boğum" olarak işaretlenir.
- 0.50–0.70: **dallar** açılır; dal uçlarında polaroid kartlar (buluşma/şölen fotoğrafları) `scale(0→1)` ile belirir → Gençlik Buluşmaları, Şölen.
- 0.70–0.85: **yapraklar** çıkar (yüzlerce küçük yaprak, deterministik dağılım) → iklim eylemleri, Hatıra Ormanı.
- 0.85–1.00: taç tamamlanır, arka planda silüet olarak başka fidanlar belirip **orman** olur; slogan; kapanış.

SVG: yaklaşık 400×700 viewBox; kök/gövde/dallar için el yazımı kübik bezier yollar; organik ve dengeli dursun; `stroke-linecap: round`. Renkler: kökler `brand-teal`, gövde `brand-ink`→`brand-green` gradyan, yapraklar `brand-green`, boğum/vurgular `brand-orange`. Scroll ilerlemesi her path için ayrı bir aralığa eşlenir (ör. `map(p, 0.15, 0.35)`), doğrudan `style.strokeDashoffset`/`transform` ile. Tamamen hafif; hiçbir kütüphane yok.

### C — `/nabiz` "Gezegenin Nabzı"

Koyu lacivert zemin (`brand-navy`→`#0B2A4A` gradyan; "uzay/gece" hissi) üzerinde veri anlatısı, sonunda beyaza geçerek AK Gençlik cevabı.
- Açılış: büyük **canlı sayaç**: "Bu sayfayı açtığından beri dünya **X ton** CO₂ saldı" (yıllık ~37,4 milyar ton → ~1.186 t/s; her karede güncelle, binlik ayraçlı, `tabular-nums`). Altında küçük: "Kaynak: Global Carbon Project 2024 tahmini, yaklaşık".
- Bölüm: atmosferdeki CO₂ ~424 ppm (2024 ortalaması, NOAA) — sanayi öncesi 280 ppm ile karşılaştırma; scroll'a bağlı dolan yatay ölçek.
- Bölüm: **ısınma şeritleri** (warming stripes): 1850–2024 yıllık küresel sıcaklık anomalilerini yaklaşık değerlerle (HadCRUT5, 1961–1990 referans) kendi yazdığın bir diziden `canvas` ile çiz; scroll ilerledikçe şeritler soldan sağa ortaya çıkar. Altına "yaklaşık/temsili veri" notu.
- Bölüm: "COP31'e kalan süre" canlı geri sayım (9 Kasım 2026 09:00 Antalya, gün:saat:dk:sn) — etkinlik başladıysa "COP31 Antalya'da devam ediyor".
- Geçiş: zemin beyaza açılır: "Gençliğin cevabı" — 1.000.000+ genç, 300 fidan, Genç İklim paneli, Hatıra Ormanı; polaroid fotoğraflar; Başkan mesajından alıntı; kapanış.
Sayaçlar zamana bağlı tek istisna (scroll'a değil); `visibilitychange` ile sekme arka plandayken durdur. Tüm değerleri `src/components/nabiz/data.ts` içinde kaynak notlarıyla tut.

### D — `/brosur` "Dijital Broşür"

Broşürün 12 sayfasını sadık biçimde, tam ekran bölümler halinde taşır (scroll-snap `y proximity`; kullanıcı istediği hızda kaydırabilsin). Her bölüm viewport'a girerken tek bir orkestre giriş yapar (IntersectionObserver): başlık yukarıdan, polaroid kartlar döndürülerek "masaya düşer", istatistik kutuları sayar (0→değer, ~1 sn, yalnızca ilk görünmede). Kapak bölümü: broşür kapağının yeniden kurulumu — iç içe daireler, küre fotoğrafı dairesel maskede, çizgili yarım daire, slogan `font-script`. Sağ kenarda ince ilerleme göstergesi: düz çubuk yerine aşağıdan yukarıya büyüyen ince bir fidan çizgisi (SVG, yüksekliği ilerlemeyle). Sayfalar: kapak, içindekiler (tıklanmaz, sadece liste), AK Gençlik + istatistikler, Başkan mesajı + fotoğraf, Biz kimiz, Gençlik vizyonu (2 polaroid + yaprak etiket), 2017 reformu & TBMM, Gençlik Buluşmaları, Şölenler, Kapanış konuşması, fotoğraf kolajı (6 polaroid, el çizimi ok), arka kapak (sosyal + logolar). En güvenli, en "kurumsal" seçenek; cilası yüksek olmalı.

## 8. Teslim ölçütü (her konsept)

- `npx tsc --noEmit -p .` ve eslint temiz.
- `node scripts/shot.mjs /<slug>` konsol hatası yok, yatay taşma yok; 6 ekran görüntüsünde fikir okunuyor.
- 390px'te metinler kesilmiyor, kartlar taşmıyor; masaüstünde içerik makul (max-w ~ 480–720px, ortalanmış).
- Reduced motion'da sayfa tamamen okunabilir.
