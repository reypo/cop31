# `/dunya` derinleştirme brief'i — "12.000 Yıllık Emanet"

Bu dosya `docs/brief.md`'nin ÜSTÜNE gelir; §2 kuralları (sadece kaydırma, mobil öncelik, performans, reduced-motion, kurumsal kimlik, gerçek içerik, Next 16, Türkçe karakter) aynen geçerlidir. Önce `docs/brief.md`'yi, sonra bunu oku. Bu dosyada "A" içerik ajanı, "B" sahne ajanı, "H1/H2" hazırlık ajanlarıdır.

## 0. Karar ve hedef

Müşteri dört konsept arasından `/dunya`'yı ("Antalya'dan Dünyaya", kaydırmayla sürülen WebGL küre) seçti. Şimdi bu rota **derinleştirilecek**:

1. Standın teması siteye omurga olarak giriyor: **"12.000 Yıllık Emanet – A 12.000-Year Trust"** (#YaniBanaEmanet, GençİKlim). Standın rotundasındaki **12 miras sütunu** kürede 12 işaret olur; standın **zemin halkası** ("Buradasın · Bugün") kürenin çevresine dönem halkası olarak gelir; standın bölgeleri (rotunda, "Oyna – Sen olsan ne yapardın?", söz kiosku, amfi) sitede "Stantta" bölümü olur.
2. Bugün gelen **22 yeni fotoğraf** (Cumhurbaşkanı + Gençlik Kolları Başkanı; Gençlik Buluşmaları söyleşileri, salonlar, Kocaeli Şöleni stadyumu, 13 Ağustos 2025 Strateji ve İstişare Kampı) ilgili bölümlere yerleşir.
3. Bölüm bölüm kaydırma (adim.ts) ve "bölümde dururken sahne sabit, geçişte animasyon" ilkesi korunur. Kullanıcıdan hiçbir seçim istenmez; "canlılık" dinlenme hâlinde kendi kendine dönen, tıklanmayan spot (vurgu) döngüleriyle verilir.

**Görsel dil kararı:** Broşür kimliği (beyaz zemin, Montserrat, mavi/yeşil/turuncu) ana kimlik olarak kalır. Standın dili (krem zemin, koyu yeşil, ahşap, serif rakamlar) yalnızca "Emanet" bölümlerinde (2, 3, 4) ve "Stantta" bölümünde (9) **bölüm içi bir tema** olarak kullanılır: panel zemini krem, büyük serif sıra numarası ("05"), koyu yeşil dönem çipi — tıpkı standdaki sütun yüzleri gibi. Böylece QR'ı stantta okutan kişi aynı dünyada kaldığını hisseder, site de kurumsal kimlikten kopmaz. Serif font: `next/font/google` **Lora** (400/600/700, `latin` + `latin-ext`), yalnızca `src/app/dunya/page.tsx` içinde yüklenir ve `--font-serif` değişkeniyle `/dunya` sarmalayıcısına verilir (layout.tsx'e dokunulmaz). `text-transform: uppercase` yasak.

## 1. Bölüm sırası (A ve B için ORTAK SÖZLEŞME)

`<section data-stage="k" class="dn-bolum dn-anlati …">`, k = 0…12, bu sırayla. 11 kapak finali `dn-bolum` (panelsiz, sabit katmanda görsel), 12 `DunyaKapanis`. Sahne koordinatı t = k + geçiş ilerlemesi (sahne.ts başlığındaki tanım aynen).

| k | Bölüm | Panel (A) | Küre / sabit katman (B) — k-1 → k geçişi ve k'de dinlenme |
|---|---|---|---|
| 0 | Kahraman | Mevcut: LeafTag, "COP31'de AK Gençlik", alt başlık. EK: altına küçük serif satır "12.000 Yıllık Emanet · #YaniBanaEmanet" (koyu yeşil). İpucu "Aşağı kaydırın" kalır. | Mevcut kahraman pozu. |
| 1 | Biz kimiz | Mevcut (81 il · 922 ilçe · 1.000.000+). | Mevcut 0→1: dönüş, Türkiye'ye zoom, 81 il noktası, sayaç, HUD. |
| 2 | Emanet girişi | Krem panel. LeafTag yerine koyu yeşil serif etiket "12.000 Yıllık Emanet". Başlık: `stant.slogan` ("İklim, doğa ve sıfır atık bize miras."). 1–2 kısa cümle `stant.girisMetni`. Altta ince satır "A 12.000-Year Trust · GençİKlim". | 1→2: il noktaları kum/krem tonuna söner; portholün çevresinde **dönem halkası** çizilir (12 dilim, `donemler` renkleriyle, kronolojik); HUD "12.000 yıl" sayacı 0→12.000 (tabular, serif); **12 miras işareti** 1'den 12'ye sırayla yükselir (krem dolgulu, koyu yeşil çerçeveli küçük daire içinde serif numara). t=2'de: halka tam, 12 işaret numaralı, hepsi eşit. |
| 3 | Emanet I — alanlar 1–6 | Krem panel. Başlık "Anadolu'nun emaneti" (A karar verir), 6 kompakt satır `<li data-emanet="n">`: serif numara, ad, il, dönem çipi, "COP31'e kuş uçuşu ~X km". Altta tek satırlık **spot açıklaması** alanı: 6 adet `<p data-emanet-aciklama="n">` üst üste (absolute), yalnızca `[data-spot="n"]` olan görünür. Bölüm elemanına `data-spot-count="6"`. | 2→3: 1–6 işaretleri büyür, etiketleri (ad) belirir; 7–12 soluklaşır. Dinlenmede: **spot döngüsü** (bkz. §2): spot=n iken n. işaret nabız atar ve etiketi öne çıkar, diğer etiketler söner. |
| 4 | Emanet II — alanlar 7–12 | Aynı yapı, 7–12. `data-spot-count="6"`. | 3→4: 7–12 büyür, 1–6 soluklaşır. Dinlenmede spot döngüsü. |
| 5 | İklim eylemleri | Mevcut panel (300 fidan, maddeler, 2 polaroid). | 4→5: işaretler ve halka söner, iller geri gelir ve mevcut **yeşil dalga + yaprak** animasyonu oynar, Üsküdar etiketi. (Eski 1→2 mantığı buraya taşınır.) |
| 6 | Gençlik Buluşmaları | Mevcut (50+ buluşma, şehir izi listesi) + yeni polaroidler: söyleşi (Cumhurbaşkanı gençlerle, p12/p11) ve "Strateji ve İstişare Kampı · 13 Ağustos 2025" (p16/p13). Şölen bu bölümden ÇIKAR. | 5→6: mevcut buluşma izi Ankara→…→Kocaeli (eski 2→3). |
| 7 | Gençlik Şölenleri | Yeni bölüm: "Gençlik Şölenleri", 100.000+ genç, 16 Mayıs 2026 · Kocaeli Stadyumu, `solenler.paragraphs[0]`, 2 polaroid (stadyum selam p18 + tribün p19). | 6→7: iz söner, **Kocaeli** büyük nabız; HUD "100.000+ genç" sayacı 0→100.000+. t=7'de nabız sakin, sayaç tam. |
| 8 | COP31 Antalya + Başkan | Mevcut panel (tarih, mekân, Başkan portresi + alıntı). Portre yeni fotoğrafla (el kalpte portre p06 ya da H2'nin önerdiği). | 7→8: mevcut Antalya zoom + nabız (eski 3→4). |
| 9 | Stantta | Krem panel. Başlık "Standımızda seni ne bekliyor". **SVG stant planı** (üstten görünüm, standın 6. sayfasından yeniden çizilir; raster KULLANILMAZ): dikdörtgen stant, sol-ortada rotunda dairesi (12 küçük sütun noktası), sağ üstte amfi yayları, altta oyun masaları, sağda söz kiosku/atölye, sol altta karşılama bankosu. 4 bölge etiketi `<g data-bolge="n">`: 1 Emanet Rotundası · 2 "Oyna – Sen olsan ne yapardın?" · 3 Söz Kiosku ("Bugün … kişi söz verdi" — sayı stanttaki kiosktan gelir, sitede sabit örnek metin YOK; "Sen de söz ver" ifadesi) · 4 Amfi · söyleşiler. Bölüm elemanına `data-spot-count="4"`; `[data-spot="n"] [data-bolge="n"]` CSS ile öne çıkar. Altta "#YaniBanaEmanet · GençİKlim". | 8→9: küre solar, porthol yerinde **zemin halkası** belirir: krem disk + dönem halkası (aynı `donemler`) + ortada serif iki satır "Buradasın" / "Bugün" (DOM overlay, sabit katmanda). t=9'da halka sakin. |
| 10 | Dünya | Mevcut panel (arka kapak metni). | 9→10: halka söner, küre geri gelir; mevcut geri çekilme + tam tur + başkentler + yaylar (eski 4→5). |
| 11 | Kapak finali | Mevcut (sr-only slogan). | 10→11: mevcut kapak fotoğrafı morph'u + lacivert daire + slogan (eski 5→6). |
| 12 | Kapanış | `DunyaKapanis` mevcut + bir satır "#YaniBanaEmanet". | Mevcut. |

Geçiş sayısı 12; her geçiş ~1 s (adim.ts). Kiosk `?auto=1` 13 bölümü sırayla gezer (6 s dinlenme; spotlu bölümlerde §2). Sağ kenar göstergesi 13 nokta (B).

## 2. Spot döngüsü sözleşmesi (B uygular, A stiller)

- `data-spot-count="n"` taşıyan bölüm **dinlenme hâline** geldikten 600 ms sonra B, bölüm elemanına `data-spot="1"` yazar ve 1→n→1 döndürür: Emanet bölümlerinde (3, 4) her **4.500 ms**'de, Stantta (9) her **3.500 ms**'de (denetim K1: 2.600 ms, ~14 kelimelik açıklamayı okumaya yetmiyordu). Geçiş başlayınca ya da bölüm terk edilince `data-spot="0"`. Yazma yalnızca rAF döngüsünden, DOM attribute ile (React state yok, yeniden render yok).
- Reduced-motion: B hiç döndürmez, `data-spot="0"` kalır; A tüm satırları normal, açıklamaların **hepsini alt alta** gösterir (hiçbir içerik kaybolmaz; bu modda serbest kaydırma, uzayan bölüm kendi içinde kaydırılır).
- Kiosk modunda döngü aynen çalışır; spotlu bölümde bekleme 600 + 3 × spot − 200 ms (3 vurgu), döngünün başlangıcı her kiosk turunda +3 kayar (iki turda bütün alanlar).
- A'nın CSS'i yalnızca `opacity`/`transform`/`color`/`background-color` geçişleri kullanır (layout tetiklemez); vurgu geçişi 300 ms, açıklama değişimi 120 ms çıkış + 180 ms giriş (üst üste binmez). Spotta olmayan satırlarda yalnızca dekoratif numara söner, metin tam opak kalır.
- B, 3. ve 4. bölümlerde spot=n için kürede n. işareti nabızlatır ve etiketini gösterir. 9. bölümde B plana karışmaz (plan A'nın SVG'si, CSS ile vurgulanır).

## 3. Veri modülleri (H1 yazar; A ve B yalnızca okur)

`src/lib/emanet.ts`:
```ts
export type EmanetAlani = {
  no: number;            // 1–12, standdaki sütun numarası
  ad: string;            // "Termessos"
  il: string;            // "Antalya"
  donem: string;         // "Helenistik" — çip metni
  tur: "dogal" | "kulturel" | "karma";
  emanet: string;        // 1 cümle: nedir, neden emanet (≤ 110 karakter)
  filiz?: string;        // 1 cümle: gençliğe düşen (standdaki "FİLİZ"), varsa
  lat: number; lng: number;
  kaynak: "pdf" | "pdf-kismi" | "genel-bilgi";
  onay: boolean;         // müşteri onayı gerekiyorsa true
};
export const emanetAlanlari: readonly EmanetAlani[]; // 12, no'ya göre sıralı
export type Donem = { ad: string; renk: string; kisa: string }; // kronolojik
export const donemler: readonly Donem[];            // 8–12 dilim, dönem halkası
export function cop31KusUcusuKm(a: EmanetAlani): number; // Antalya Expo'ya haversine, 10'a yuvarlı
```
`src/lib/stant.ts`: `stant = { tema, temaEn, hashtag, program, slogan, girisMetni: string[], bolgeler: {no, ad, kisa}[], kiosk: {baslik, cagri}, pankartlar: string[], zemin: {ust: "Buradasın", alt: "Bugün"}, palet: {krem, koyuYesil, ahsap} }` — her alan PDF'ten okunabildiyse olduğu gibi, okunamadıysa `// ONAY:` yorumuyla.

PDF okunamayan sütunlar için H1, Türkiye'nin **tanınmış** miras alanlarından (ör. Göbeklitepe, Çatalhöyük, Hattuşa, Efes, Nemrut, Pamukkale, Kaz Dağları, Tuz Gölü) `kaynak: "genel-bilgi", onay: true` ile boşluğu doldurur; `docs/onay-listesi.md`'ye yazar. Uydurma ayrıntı yok: yalnızca yaygın bilinen, tek cümlelik gerçekler.

## 4. Fotoğraflar (H2 ekler; A kullanır)

Kaynak: `C:\Users\user\AppData\Local\Temp\claude\D--soft-cop31\4935df5b-f395-4622-886e-17daa992bcbf\scratchpad\yeni-foto\src\p01.jpg … p22.jpg` (temas sayfaları `…\yeni-foto\sheet\sheet-1..3.png`). H2: EXIF yönünü uygular, uzun kenar ≤ 1600 px, JPEG kalite 82, `public/photos/<kebab-ascii>.jpg`; `src/lib/photos.ts`'e mevcut anahtarlara DOKUNMADAN yeni anahtarlar (src/width/height/alt) ekler; `docs/foto-yeni.md` tablosu: anahtar, dosya, içerik, yön, önerilen bölüm, odak (`object-position`), hariç tutma gerekçesi. Hariç/önerilmeyen: el öpme karesi (p20), neredeyse aynı kareler (yalnızca en iyisi), düşük çözünürlüklü p13 (1600 px; yalnızca küçük polaroid). Hiçbir fotoğraf silinmez; önerilmeyenler yalnızca tabloda işaretlenir.

## 5. Dosya sahipliği (paralel çalışma — ÇAKIŞMA YOK)

| Ajan | Yazabildiği dosyalar |
|---|---|
| H1 | `src/lib/emanet.ts`, `src/lib/stant.ts`, `docs/stant-icerik.md`, `docs/onay-listesi.md` |
| H2 | `public/photos/*` (yalnızca yeni dosyalar), `src/lib/photos.ts` (yalnızca ekleme), `docs/foto-yeni.md` |
| A (içerik) | `src/app/dunya/page.tsx` (Lora + metadata), `src/components/dunya/DunyaIcerik.tsx`, `DunyaKapanis.tsx`, `parcalar.tsx`, `dunya.css`, YENİ `EmanetListe.tsx`, `StantPlani.tsx` |
| B (sahne) | `src/components/dunya/DunyaScene.tsx`, `sahne.ts`, `iller.ts`, `adim.ts`, YENİ `emanet-sahne.ts` (işaret/halka geometrisi), gerekiyorsa `dunya.css` içinde YALNIZCA `/* B: */` ile işaretli ayrı bir blok (A'nın bloklarına dokunma) |
| Entegrasyon / düzeltme ajanları | Hepsi |

A ve B aynı çalışma ağacında eş zamanlı çalışır; dev sunucusu ikisinin değişikliğini de canlı yükler. Karşı tarafın dosyasında eksik gördüğünü KENDİ dosyanda çözme, raporunda "karşı taraftan beklenen" olarak yaz. B, A'nın bölümleri henüz yokken test etmek için `DunyaIcerik.tsx`'i DEĞİŞTİRMEZ; mevcut 8 bölümle sahneyi kurar, 13 bölüm geldikçe doğrular (A ilk 15 dakikada iskeleti — 13 bölüm, `data-stage`, `data-spot-count`, başlıklar — yazıp sonra içeriği doldurur).

## 6. Ölçüm ve kanıt (mevcut araçlar)

- `npx tsc --noEmit -p . --incremental false`, `npx eslint src/app/dunya src/components/dunya`.
- `node scripts/shot.mjs /dunya` (+ `--desktop`, `--reduced`): 0 hata, 0 uyarı, yatay taşma yok.
- Geçiş kareleri ve fps: `C:\Users\user\AppData\Local\Temp\claude\D--soft-cop31\4935df5b-f395-4622-886e-17daa992bcbf\scratchpad\gecis.mjs` ve `…\scratchpad\kontrol.mjs` (playwright-core + sistem Chrome, CDP screencast, 40 ms scrollY örnekleme, `Emulation.setCPUThrottlingRate 4`). Bunları çoğaltıp 12 geçişe uyarlayın; kanıt kareleri `D:\soft\cop31\.qa\` altına (`.gitignore`'da).
- Hedefler: her geçiş 870–1000 ms, 4× CPU kısıtlamada ortalama ≥ 40 fps; 390×844'te hiçbir anlatı paneli alt alana sığmadığı için bölüm içi kaydırma gerektirmemeli (panel ≤ ~50svh; Emanet satırları kompakt, ≤ 46 px/satır).
- Hydration: render'da `Math.random`/`Date` yok; spot/sayaç değerleri DOM attribute/textContent ile rAF'tan yazılır.

## 7. Teslim ölçütü

1. 13 bölüm, her biri tam ekran; tek hareket = tek bölüm; geçişte animasyon görünür, dinlenmede sahne sabit (spot döngüsü hariç).
2. Emanet bölümlerinde 12 alan hem kürede hem listede; spot döngüsü kürede ve listede eşzamanlı.
3. Stantta bölümünde SVG plan + 4 bölge, zemin halkası "Buradasın · Bugün" sabit katmanda.
4. Yeni fotoğraflar `next/image` + `sizes` ile; ilk ekran dışındakiler lazy.
5. tsc/eslint temiz; shot.mjs üç modda temiz; geçiş kanıt kareleri ve fps raporu; reduced-motion'da her bölüm son karede ve tüm metinler görünür.
6. `docs/onay-listesi.md`: müşteriye sorulacak her şey tek yerde (okunamayan sütunlar, dönem halkası dilimleri, kamp fotoğrafının bölümü, kiosk metni).
