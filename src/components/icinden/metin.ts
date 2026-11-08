import type { Dil } from "@/lib/dil";
import { backCover, bizKimiz, bulusmalar, cop31, cover, facts, genclikKollari, iklim, solenler, stats, vizyon } from "@/lib/content";
import { emanetAlanlari } from "@/lib/emanet";
import { logos, photos } from "@/lib/photos";
import { stant } from "@/lib/stant";
import type { Etiket } from "./klipler";

/**
 * /icinden sözlüğü (iki dil; müşteri 7 Kasım 2026: "site açılışta İngilizce gelecek, kullanıcı isterse Türkçeye geçirecek").
 * Yalnız sunucu bileşenleri okur (Icinden3, IcindenSayfa, IcindenKapanis, FidanKatmani, SahneEtiketleri): sözlük istemci
 * paketine girmez. İstemcide yazılan iki küçük metin (kadraj okuması, d1 künyesinin gün sayacı) metin-istemci.ts'te.
 *
 *  - TR: content.ts / stant.ts / emanet.ts / photos.ts'ten türetilir (oradaki Türkçe metinler DEĞİŞMEZ; bu dosya yalnız okur).
 *    Bant metinleri v3'te Icinden3'ün kurduğu biçimiyle birebir (W-3 sonrası HTML'le aynı).
 *  - EN: olgular müşterinin İngilizce broşüründen (COP31_Brosur_EN, `PAGES` metinleri: "AK Party Youth Branches", "Youth
 *    Meetings", "Youth Festival", "By Your Side, Every Moment", "Our world is our common home" …); broşürde olmayan stant ve
 *    deneyim satırları onay-listesi §14 "İngilizce satırlar"dan ya da yeni (ONAY: müşteri onayı; çeviri tablosu raporda).
 *    Yazım Amerikan İngilizcesi (broşür: "neighborhood", "center"); tarih "November 9–20, 2026" (broşür "May 16, 2026").
 *    Sayılar facts'ten ve en-US biçiminde (12,000 · 100,000+).
 *
 * Her bant yalnız seçilen dilde (eski "Türkçe + İngilizce alt satır" düzeni, `En` / data-onay="en", kalktı).
 * Render dokularındaki yazılar (duvarlar, sütun yüzleri, zemin halkası, pankartlar) iki dilde ayrı render edilir: Türkçe
 * dokular content.ts / stant.ts / emanet.ts'ten (dokular.mjs), İngilizce dokular bu dosyanın `DOKU_EN`'inden
 * (`dokular.mjs --dil en`; tek kaynak). Ekran okuyucu eşleri (DuvarYazisi) dokudaki yazının kendisi; İngilizce sayfa
 * İngilizce klipleri oynatır (klipler.ts `dilManifesti`).
 */

/** Satır sonunda bölünmemesi gereken tarihli metin: `on` + <Tarih>{tarih}</Tarih> + `son`. */
export type Parcali = { readonly on: string; readonly tarih: string; readonly son: string };
/** Atıf satırı: isteğe bağlı önek + metin; `en`: Türkçe sayfada İngilizce kalan lisans metni (`lang="en"`). */
export type Atif = { readonly on?: string; readonly metin: string; readonly en?: boolean };
/** Duvar/cephe yazısının ekran okuyucu satırı; `lang`: sayfanın dilinden farklıysa. */
export type DuvarSatiri = { readonly metin: string; readonly lang?: Dil };
/** d10 polaroidlerinin fotoğrafları (FidanKatmani POLAROIDLER). */
export type PolaroidFoto = "bulusmaKampusSoylesi" | "bulusmaKampusSalonSelam" | "solenKocaeliTribunSelam" | "solenKocaeliSahaIkili";

export type IcindenMetin = {
  meta: { baslik: string; aciklama: string; ogAlt: string; siteAdi: string; yer: string };
  /** Sabit düğmeler ve ortak satırlar. */
  brosur: string;
  dilSecici: string;
  /** Sahnelerin alt metinleri (R3 kartları (e)), rol anahtarıyla (aynı rolün ikincisi "-2"). */
  alt: Readonly<Record<string, string>>;
  /** Sahne katmanı: manifest metinleri (klipler.json Türkçe; TR'de boş/null = manifestteki). */
  sahne: {
    /** Etiket adı → metin (d2–d4 haritacılık ve bölge etiketleri). */
    etiket: Readonly<Record<string, string>>;
    /** d1 Antalya künyesinin SSR satırı ("9–20 Kasım 2026"). */
    kunye: string | null;
    /** `okumaDurak` (Türkçe metin → çeviri): "arka duvar · ~3 m", "sol duvar · ~3 m", "ortak evimiz". */
    okumaDurak: Readonly<Record<string, string>>;
  };
  lombar: {
    baslik: string;
    kimlikAd: string;
    kimlikAlt: string;
    kimlikLogo: string;
    logoAlti: Parcali;
    ipucu: string;
    /** d0 broşür kartı (8 Kasım 2026): üst etiket, broşürün kapak başlığı, eylem. */
    brosurKart: { etiket: string; baslik: string; eylem: string };
  };
  dunya: { baslik: string; govde: Parcali };
  emanet: { srBaslik: string; baslik: string; govde: string };
  expo: { baslik: string; altSatir: string };
  anatomi: {
    srBaslik: string;
    baslik: string;
    etiketSatir: string;
    bolgeEtiket: string;
    bolgeler: readonly { no: number; ad: string; kisa: string }[];
    pankartEtiket: string;
    pankart: readonly DuvarSatiri[];
  };
  sutunlar: {
    srBaslik: string;
    baslik: string;
    sutunEtiket: string;
    sutunlar: readonly { no: number; ad: string; il: string; donem: string; emanet: string }[];
  };
  duvar: { srBaslik: string; baslik: string; satirlar: readonly [string, Parcali, string]; duvarEtiket: string; duvar: readonly DuvarSatiri[] };
  duvar2: { baslik: string; govde: string; duvarEtiket: string; duvar: readonly DuvarSatiri[] };
  fidanKok: { srBaslik: string; cip: string; baslik: string; altSatir: string; govde: string };
  fidanGovde: { srBaslik: string; cip: string; baslik: string; bogumEtiket: string; bogumlar: readonly { taraf: -1 | 1; ad: string; satir: string }[] };
  fidanDal: { srBaslik: string; cip: string; baslik: string; govde: string; polaroidEtiket: string; polaroidAlt: Readonly<Record<PolaroidFoto, string>> };
  fidanYaprak: { srBaslik: string; cip: string; baslik: string; satirlar: readonly string[] };
  dunya2: { slogan: string };
  kapanis: {
    logoAkParti: string;
    logoGenclik: string;
    kurum: string;
    alinti: string;
    etiket: string;
    slogan: string;
    etkinlik: Parcali;
    atiflar: readonly Atif[];
  };
};

/* ================================ Türkçe (content.ts / stant.ts'ten) ================================ */

const tr = (n: number) => n.toLocaleString("tr-TR");
const en = (n: number) => n.toLocaleString("en-US");

/** Paragrafın ilk cümlesi (birebir; ilk ". " noktasına dek, nokta dahil). */
const ilkCumle = (p: string) => {
  const i = p.indexOf(". ");
  return i < 0 ? p : p.slice(0, i + 1);
};

/**
 * Sentinel-2 sahnelerinin yılları (atıf "Contains modified Copernicus Sentinel data <yıl>"; brief §9.6, §14.4.5). d1–d3
 * Kasım 2025 mozaiği + G4 ilkbahar sahnesi (A3 seçimi: S2A 17 Nisan 2025, `scratchpad/g-b/g4-hazirlik/secilen.txt`).
 * V, G4 son render'ından sonra `docs/varliklar-icinden.md` tablosuyla doğrular; yıl değişirse YALNIZ bu dizi değişir
 * (birden çok yıl ", " ile birleşir).
 */
export const SENTINEL_YILLARI: readonly number[] = [2025];
const SENTINEL = `Contains modified Copernicus Sentinel data ${[...new Set(SENTINEL_YILLARI)].sort().join(", ")}.`;
const DEM =
  "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.";

const [uye, il, ilce] = stats;
const ilIlce = `${il.value} ${il.label} · ${ilce.value} ${ilce.label}`;
// d6 (G7 §14.4.4): "Bir Gençlik Şöleni" solenler.paragraphs[0]'daki tırnaklı addan; motto backCover.quote tırnaksız.
const solenAdi = /"([^"]+)"/.exec(solenler.paragraphs[0])?.[1] ?? solenler.title;
const motto = backCover.quote.replace(/^"|"$/g, "");
const cumle = (s: string) => (/[.?!…]$/.test(s) ? s : `${s}.`);

const TR: IcindenMetin = {
  meta: {
    baslik: "COP31'in İçinden — AK Gençlik",
    aciklama: `Uzaydan Antalya Expo'daki standımıza, oradan bizi anlatan bir fidana ve yeniden Dünya'ya: bölüm bölüm bir dalış. ${stant.tema} · ${stant.hashtag}`,
    ogAlt: photos.globeFoliage.alt,
    siteAdi: genclikKollari.title,
    yer: "tr_TR",
  },
  brosur: "Dijital broşür",
  dilSecici: "Dil",
  // C turunda son render posterlerine göre düzeltildi; E turu (emanet, duvar-2) planlanan render'a göre yazıldı (§12.0, §12.3).
  // G turu: duvar (d6) G7 dokusuna göre (§14.4.4), fidan-* S3 önizleme posterlerine göre (960², `public/icinden/p/d/p9…pc`;
  // son render aynı kadraj). Tür adı yok (K3), "81" yok (K8).
  alt: {
    lombar: "Beyaz zemin üzerinde resmî COP31 Türkiye Antalya logosu: lale ve ebru desenli, mavi-yeşil bir dünya diski.",
    dunya: "Uzaydan Dünya. Avrupa, Akdeniz ve Kuzey Afrika gündüz ışığında; gece sınırı Hazar Denizi ve İran üzerinden geçiyor, doğuda şehir ışıkları yanıyor. Antalya diskin ortasının hemen üstünde.",
    emanet: "Yüksekten bütün Türkiye: Anadolu'nun dağları ve kıyıları, çevresinde denizler. Antalya güney kıyısında işaretli; 12 emanet alanı numaralı ışıklarla gösteriliyor.",
    // V düzeltmesi (G4-dağ, v-2): Beydağları yamaçları artık ormanlı (S1 orman katmanı, brief §14.6; p3/l3 yeni render).
    expo: "Öğleden sonra güneşine karşı Antalya: önde seraların ve yeşil tarlaların arasından geçen D400 ile Aksu ovası, ortada Antalya Expo Center'ın holleri, geride kent, güneşte parlayan körfez ve yamaçları ormanlı Beydağları.",
    // E turu p4 (denetim D3-10): arka duvar ve ön cephe pankartı da görünüyor. 7 Kasım 2026: d4/d5 güncel sahneden yeniden
    // render edildi (arka duvarda G7 "Gençlik Buluşmaları" dokusu, bankoda kök kasası; iki dil).
    anatomi: `Karanlık fuar holünde, ışığın altında standımız yukarıdan: ortada 12 sütunlu Emanet Rotundası ve '12.000 Yıllık Emanet' bandı, solda 'Oyna – Sen olsan ne yapardın?' alanı ve turuncu 'Gel, oyna!' pankartı, sağda amfi; arkada '${bulusmalar.title}' duvarı, girişte '${stant.pankartlar[1]}' pankartı.`,
    sutunlar: "Rotundanın içinden yere bakış: renkli dönem halkasının ortasında 'Buradasın, Bugün' yazıyor; çevrede 12 miras sütununun alt uçları.",
    duvar: `Standın arka duvarı, çapraz açıdan: krem zemin, altta koyu dağ silueti. Solda '${bulusmalar.title}' başlığı, büyük '${facts.meetings}+' ve 'gençlik buluşması, son ${facts.meetingsYears} yılda'; altında 'Bir Gençlik Şöleni', '${facts.solenDate} · ${facts.solenPlace}' ve büyük '${tr(facts.solenAttendees)}+ genç'.`,
    // 8 Kasım 2026 (müşteri): iki ekranda yazı yerine fotoğraf (dokular.mjs EKRAN_FOTO; t67/p7, t79 yeniden render edildi).
    "duvar-2":
      "Standın sol duvarı: '1.000.000+ Genç Üye' ve '81 İl · 922 İlçe' yazıları; altında iki ekranda fotoğraf: solda mavi yelekli gençler bir fidan dikiyor, sağda yeşil şeritli beyaz yelekli gönüllüler ormanda çöp topluyor. Sağ altta bir bank.",
    "fidan-kok":
      "Karanlık fuar holünde, bankonun üstünde ahşap çerçeveli, ön yüzü camlı bir kök kasası. Koyu toprağın içinde ortadaki tohumdan inen kazık kök ve iki yana açılan ince kökler; köklerin krem renkli uçları spot ışığında seçiliyor.",
    "fidan-govde": "Kök kasasının toprağından ince bir fidan gövdesi yükseliyor, hafif S biçiminde kıvrılarak; gövdede iki küçük boğum. Camın ardında kökler, arkada karanlık hol ve stant duvarları.",
    "fidan-dal": "Fidan dallanmış: gövdeden iki yana açılan ince dalların uçlarında küçük, açık renkli tomurcuk kümeleri. Altta kasanın camının ardında kökler; arkada karanlık hol.",
    "fidan-yaprak": "Yapraklanmış genç ağaç: dalları kenarları dilimli, zeytin yeşili yapraklarla dolu; ikindi güneşi yaprakların arkasından vuruyor. Gövde kök kasasından yükseliyor, çevrede karanlık hol.",
    // W-2 (§14.7): E turundaki metin (d12 = p1/l1, açılıştaki Dünya).
    "dunya-2": `Uzaydan Dünya, açılıştaki gibi. Üstünde el yazısıyla: ${cover.slogan}.`,
  },
  sahne: { etiket: {}, kunye: null, okumaDurak: {} },
  lombar: {
    baslik: "COP31'in İçinden",
    kimlikAd: genclikKollari.title,
    kimlikAlt: "COP31 Antalya standı",
    kimlikLogo: logos.genclikKollari.alt,
    logoAlti: { on: "", tarih: cop31.dates, son: `, ${cop31.venue}` },
    ipucu: "Aşağı kaydır",
    // Başlık broşürün kapağındaki (COP31_Brosur_TR.pdf s. 1).
    brosurKart: { etiket: "Dijital broşür", baslik: "1 Milyon Genç, Tek Ortak Ev", eylem: "Broşürü aç" },
  },
  dunya: {
    baslik: "Dünya Antalya'da buluşuyor",
    // ~150.000 ziyaretçi: docs/brief.md §1 (ONAY, onay-listesi §14).
    govde: {
      on: "BM İklim Değişikliği Konferansı COP31, ",
      tarih: `${cop31.dates}'da`,
      son: ` ${cop31.venue}'da. Yaklaşık 150.000 yabancı ziyaretçi bekleniyor.`,
    },
  },
  emanet: { srBaslik: `Türkiye: ${stant.girisMetni[0].replace(/\.$/, "")}`, baslik: stant.girisMetni[0], govde: stant.girisMetni[1] },
  // Mekân adı `cop31.venue`; haritadaki yapı etiketi OSM adıyla (ONAY).
  expo: { baslik: cop31.venue, altSatir: "Aksu'da; kent merkezine 12 km, havalimanına 5 km." },
  anatomi: {
    srBaslik: `Standımız: ${stant.tema}`,
    baslik: stant.tema,
    etiketSatir: stant.hashtag,
    bolgeEtiket: "Standın bölgeleri",
    bolgeler: stant.bolgeler.map((b) => ({ no: b.no, ad: b.no === 4 ? "Amfi" : b.ad, kisa: b.kisa })),
    // Ön cephe giriş pankartı (S2-E cephe-on, §12.3; stant.ts pankartlar birebir).
    pankartEtiket: "Standın giriş pankartı",
    pankart: [stant.pankartlar[1], stant.pankartlar[2], stant.pankartlar[3]].map((metin) => ({ metin })),
  },
  sutunlar: {
    srBaslik: `Buradasın, bugün. ${stant.slogan}`,
    baslik: stant.slogan,
    sutunEtiket: "12 sütun, 12 emanet",
    sutunlar: emanetAlanlari.map((a) => ({ no: a.no, ad: a.ad, il: a.il, donem: a.donem, emanet: a.emanet })),
  },
  duvar: {
    srBaslik: `${bulusmalar.title} · ${solenAdi}`,
    baslik: bulusmalar.title,
    satirlar: [
      // ek sayıya bağlı: 30 → "otuz'dan" (content.ts facts.meetings yorumu)
      `Son ${facts.meetingsYears} yılda ${facts.meetings}'dan fazla gençlik buluşması.`,
      { on: `${solenAdi}: `, tarih: facts.solenDate, son: `, ${facts.solenPlace}, ${tr(facts.solenAttendees)}+ genç.` },
      motto,
    ],
    duvarEtiket: "Arka duvarda yazanlar",
    duvar: [
      { metin: bulusmalar.title },
      { metin: "Youth Meetings", lang: "en" },
      { metin: `${facts.meetings}+ gençlik buluşması` },
      { metin: `son ${facts.meetingsYears} yılda` },
      { metin: solenAdi },
      { metin: `${facts.solenDate} · ${facts.solenPlace}` },
      { metin: `${tr(facts.solenAttendees)}+ genç` },
      { metin: motto },
      { metin: stant.hashtag },
    ],
  },
  duvar2: {
    baslik: stant.kiosk.cagri,
    govde: genclikKollari.subtitle,
    duvarEtiket: "Sol duvarda yazanlar",
    duvar: [`${tr(uye.value ?? 0)}${uye.suffix ?? ""} ${uye.label}`, ilIlce].map((metin) => ({ metin })), // iki ekranda yazı yok, fotoğraf (8 Kasım 2026)
  },
  // d8 — Kökler: Biz Kimiz? + 81 İl · 922 İlçe (§14.4.1 K8) + bizKimiz.paragraphs[0].
  fidanKok: { srBaslik: `Kökler: ${bizKimiz.title}`, cip: "Kökler", baslik: bizKimiz.title, altSatir: ilIlce, govde: bizKimiz.paragraphs[0] },
  fidanGovde: {
    srBaslik: `Gövde: ${vizyon.title}`,
    cip: "Gövde",
    baslik: vizyon.title,
    bogumEtiket: "Gövdedeki iki boğum",
    // Boğum etiketleri (sahnede ve bantta): sıra taraf −1 (alt boğum, 2017) → +1 (üst boğum, TBMM).
    bogumlar: [
      { taraf: -1, ad: vizyon.items[1].title, satir: `Seçilme yaşı ${facts.electionAge}` },
      { taraf: 1, ad: vizyon.items[2].title, satir: `${facts.youngMpsAgeLimit} yaş altı ${facts.youngMps} vekilden ${facts.youngMpsOurs}'ü` },
    ],
  },
  // d10 — Dallar: Gençlik Buluşmaları + paragraphs[3]'ün ilk cümlesi (birebir) + 4 polaroid.
  fidanDal: {
    srBaslik: `Dallar: ${bulusmalar.title}`,
    cip: "Dallar",
    baslik: bulusmalar.title,
    govde: ilkCumle(bulusmalar.paragraphs[3]),
    polaroidEtiket: "Fotoğraflar",
    polaroidAlt: {
      bulusmaKampusSoylesi: photos.bulusmaKampusSoylesi.alt,
      bulusmaKampusSalonSelam: photos.bulusmaKampusSalonSelam.alt,
      solenKocaeliTribunSelam: photos.solenKocaeliTribunSelam.alt,
      solenKocaeliSahaIkili: photos.solenKocaeliSahaIkili.alt,
    },
  },
  // d11 — Yapraklar: İklim Eylemleri (d6'dan taşındı, §14.4.1 K7) + 3 satır.
  fidanYaprak: { srBaslik: `Yapraklar: ${iklim.title}`, cip: "Yapraklar", baslik: iklim.title, satirlar: [...iklim.items] },
  dunya2: { slogan: cover.slogan },
  kapanis: {
    logoAkParti: logos.akParti.alt,
    logoGenclik: logos.genclikKollari.alt,
    kurum: cover.org,
    alinti: motto,
    etiket: `${stant.tema}. ${stant.hashtag}`,
    slogan: cover.slogan,
    etkinlik: { on: `${backCover.line1}: `, tarih: cop31.dates, son: `, ${cop31.venue}.` },
    // §9.6; R1 §3 metni birebir. ONAY: onay-listesi §14. İngilizce lisans metni `lang="en"` ile (WCAG 3.1.2).
    // "Stant ve fidan görünümü temsilîdir." (§14.4.1 K9): duvar baskıları ve fidan müşteri teyidine kadar.
    atiflar: [
      { on: "Uydu görüntüsü:", metin: SENTINEL, en: true },
      { on: "Yükseklik:", metin: DEM, en: true },
      { metin: "Dünya: NASA Earth Observatory (Blue Marble, Black Marble), GEBCO." },
      { metin: "Harita verisi © OpenStreetMap katkıda bulunanlar." },
      { metin: "COP31 Türkiye logosu etkinliğe atıf amacıyla kullanılmıştır." },
      { metin: "Stant ve fidan görünümü temsilîdir." },
    ],
  },
};

/* ================================ English ================================ */
/* Kaynak etiketi: (B) broşür, (O) onay-listesi §14 / mevcut `En` satırı, (Y) yeni (ONAY). */

const EN_TARIH = "November 9–20, 2026"; // (Y) cop31.dates; broşürün tarih biçimi ("May 16, 2026")
const EN_SOLEN_TARIH = "May 16, 2026"; // (B) facts.solenDate
const EN_SOLEN = "Youth Festival"; // (B) bölüm 07 başlığı; "Bir Gençlik Şöleni"nin broşürdeki karşılığı
const EN_BULUSMA = "Youth Meetings"; // (B)
const EN_MOTTO = "By Your Side, Every Moment"; // (B) "Her Anında Hep Yanında"
const EN_SLOGAN = "Our world is our common home"; // (B) "Ortak evimiz dünyamız" / kapak "1 Million Youth, One Common Home"
const EN_TEMA = stant.temaEn; // (O) "A 12,000-Year Trust" (rotunda bandı "A 12.000-Year Trust"; binlik virgülle)
const EN_ROTUNDA = "Heritage Rotunda"; // (Y) "Emanet Rotundası"
const EN_IL_ILCE = `${facts.provinces} Provinces · ${facts.districts} Districts`; // (B) "81 provinces, 922 districts"
const EN_CAGRI = "Make your pledge too."; // (O)
const EN_OYUN = "Play – What would you do?"; // (S) standın kendi İngilizce oyun bandı (stant.ts pankartlar[6])
const EN_GEL = "Come and play!"; // (S) turuncu pankartın İngilizce satırı (stant.ts pankartlar[4])
const EN_BURADA = "You are here, today."; // (O) zemin halkasının ortası "Buradasın / Bugün"
const EN_SLOGAN_TOTEM = "Climate, nature and zero waste are our heritage."; // (O) stant.slogan (totem)
const EN_SLOGAN_CEPHE = "Climate, nature, zero waste are our heritage."; // (O) stant.pankartlar[1] (giriş pankartı)
const EN_GIRIS = "From 12,000 years ago to today."; // (O) stant.girisMetni[0]

/** (Y) emanet.ts'in 12 sütunu, aynı sırayla (no 1–12): d5 bandı ve İngilizce sütun yüzleri (dokular.mjs) aynı metin. */
const EN_SUTUNLAR = [
  { ad: "Belgrad Forest", il: "Istanbul", donem: "Natural heritage", emanet: "A forest whose historic dams made it Istanbul's water source from Byzantine to Ottoman times." },
  { ad: "Hattusa", il: "Çorum", donem: "Bronze Age", emanet: "The Hittite capital; a UNESCO World Heritage Site with its walls, temples and thousands of clay tablets." },
  { ad: "Sardis", il: "Manisa", donem: "Lydian – Iron Age", emanet: "Capital of the Lydian Kingdom; the city of the Lydians, who minted the first coins." },
  { ad: "Letoon", il: "Muğla", donem: "Lycian – Hellenistic", emanet: "Lycia's shared sanctuary, with its trilingual inscription: deciding together is our heritage." },
  { ad: "Termessos", il: "Antalya", donem: "Hellenistic – Roman", emanet: "An ancient mountain city in the forests of Mount Güllük: living with the forest is our heritage." },
  { ad: "Derinkuyu Underground City", il: "Nevşehir", donem: "Byzantine", emanet: "A multi-level underground city carved into tuff, breathing through its ventilation shafts." },
  { ad: "Sultanhanı Caravanserai", il: "Aksaray", donem: "Seljuk", emanet: "Built in 1229, one of the largest Seljuk caravanserais on the Silk Road." },
  { ad: "Twin Minaret Madrasa", il: "Erzurum", donem: "Seljuk", emanet: "A 13th-century stone madrasa with a twin-minaret portal; the symbol of Erzurum." },
  { ad: "Hevsel Gardens", il: "Diyarbakır", donem: "Aq Qoyunlu", emanet: "Gardens on the Tigris that have fed the city for centuries; UNESCO heritage together with the city walls." },
  { ad: "Safranbolu", il: "Karabük", donem: "Ottoman", emanet: "A UNESCO-listed town whose timber and adobe mansions keep the Ottoman urban fabric alive." },
  { ad: "Meerschaum Workshops", il: "Eskişehir", donem: "Ottoman to today", emanet: "The handiwork of Eskişehir's meerschaum masters: working stone without waste is our heritage." },
  { ad: "Göbekli Tepe", il: "Şanlıurfa", donem: "Neolithic", emanet: "The oldest known monumental structures, with pillars some 12,000 years old; where the trust began." },
].map((s, i) => ({ no: i + 1, ...s })); // sıra = sütun numarası (emanetAlanlari 1–12)

/**
 * İngilizce render dokularının yazıları (`node scripts/blender/s2/dokular.mjs --dil en` bunu içe aktarır → D:\soft\cop31-varlik\
 * s2\doku-en\). Kaynak etiketleri yukarıdaki gibi; (S) standın kendi İngilizce yazısı (stant tasarım PDF'i, docs/stant-icerik.md).
 * Satır bölmeleri dokuda (boşluktan; metin değişmez). Türkçe dokular content.ts / stant.ts / emanet.ts'ten (değişmedi).
 * DOM eşleri (DuvarYazisi listeleri, d5 sütun satırları) aşağıda bu değerlerden kurulur: dokuda ne yazıyorsa o.
 */
export const DOKU_EN = {
  /** Kanopi bandı (rotunda), sütun yüzlerinin alt satırı; kiosk ekranı ve totemin üst satırı (büyük harfle). */
  tema: EN_TEMA,
  /** Zemin halkası: ortada küçük `ust`, büyük serif `alt` (EN_BURADA'nın iki parçası); bant işaretleri (S). */
  zemin: { ust: "You are here", alt: "Today" },
  halka: { giris: "Start · 12,000 years ago", bugun: "Today" },
  /** Oyun bandı (iki bant da İngilizce; küçük bantta "Play" altın). */
  oyun: EN_OYUN,
  /** Turuncu dikey pankartlar: sol (S), sağ (Y: "Zero Waste" standın tema çipi "SIFIR ATIK – ZERO WASTE" ve broşürden). */
  gel: EN_GEL,
  sifir: ["Zero Waste Managers", "The Road to COP31 – DengeCOP31"],
  kiosk: EN_CAGRI,
  totem: { slogan: EN_SLOGAN_TOTEM, alt: EN_GIRIS },
  /** Ön cephe giriş pankartı; `program` dokuda sonunda " →" ile (Türkçedeki gibi). */
  cephe: { slogan: EN_SLOGAN_CEPHE, hashtag: stant.hashtag, program: `GençİKlim – ${EN_TEMA} – Inside` },
  /** d6 arka duvar (G7 düzeni; pencere dışında motto + hashtag). */
  arka: {
    baslik: EN_BULUSMA,
    bulusmaSayi: `${facts.meetings}+`,
    bulusma: "youth meetings",
    bulusmaYil: `in the last ${facts.meetingsYears} years`,
    solen: EN_SOLEN,
    solenTarihYer: `${EN_SOLEN_TARIH} · Kocaeli Stadium`,
    solenSayi: `${en(facts.solenAttendees)}+`,
    genc: "young people",
    motto: EN_MOTTO,
    hashtag: stant.hashtag,
  },
  /** d7 sol duvar (iki ekranda yazı yok, fotoğraf: 8 Kasım 2026). */
  sol: { uye: `${en(facts.members)}+`, uyeEt: "Young Members", ilIlce: EN_IL_ILCE },
  sutunlar: EN_SUTUNLAR,
} as const;
const DA = DOKU_EN.arka;
const DS = DOKU_EN.sol;

const EN: IcindenMetin = {
  meta: {
    baslik: "Inside COP31 — AK Youth",
    aciklama: `From space to our stand at Antalya Expo, then to a sapling that tells our story, and back to Earth: a dive, section by section. ${EN_TEMA} · ${stant.hashtag}`,
    ogAlt: "A globe among green leaves",
    siteAdi: "AK Party Youth Branches",
    yer: "en_US",
  },
  brosur: "Digital brochure",
  dilSecici: "Language",
  alt: {
    lombar: "The official COP31 Türkiye Antalya logo on a white background: a blue-green globe with tulip and marbling patterns.",
    dunya: "Earth from space. Europe, the Mediterranean and North Africa in daylight; the night line crosses the Caspian Sea and Iran, with city lights glowing to the east. Antalya sits just above the center of the disc.",
    emanet: "All of Türkiye from high above: Anatolia's mountains and coasts, surrounded by seas. Antalya is marked on the south coast; 12 heritage sites are shown as numbered lights.",
    expo: "Antalya against the afternoon sun: in front, the Aksu plain with the D400 running between greenhouses and green fields; in the middle, the halls of Antalya Expo Center; behind, the city, the gulf shining in the sun and the forested slopes of the Bey Mountains.",
    // İngilizce dokularla render (d4: arka duvarda G7 "Youth Meetings" duvarı, bankoda kök kasası; 7 Kasım 2026).
    anatomi: `Our stand from above, under the lights of a dark exhibition hall: in the middle, the 12-column ${EN_ROTUNDA} with its '${EN_TEMA}' band; on the left, the '${EN_OYUN}' area and the orange '${EN_GEL}' banner; on the right, the amphitheater; at the back, the '${EN_BULUSMA}' wall; at the entrance, the '${EN_SLOGAN_CEPHE}' banner.`,
    sutunlar: `Looking down from inside the rotunda: in the middle of the colorful ring of periods it reads '${DOKU_EN.zemin.ust}, ${DOKU_EN.zemin.alt}'; around it, the bases of the 12 heritage columns.`,
    duvar: `The stand's back wall at an angle: cream background with a dark mountain silhouette along the bottom. On the left, the heading '${DA.baslik}', a large '${DA.bulusmaSayi}' and '${DA.bulusma} ${DA.bulusmaYil}'; below, '${DA.solen}', '${DA.solenTarihYer}' and a large '${DA.solenSayi}' above '${DA.genc}'.`,
    "duvar-2": `The stand's left wall: '${DS.uye} ${DS.uyeEt}' and '${DS.ilIlce}'; below, two screens show photos: on the left, young people in blue vests planting a sapling; on the right, volunteers in white vests with green stripes collecting litter in a forest. A bench at bottom right.`,
    "fidan-kok":
      "A wooden-framed root box with a glass front, on a counter in the dark exhibition hall. In the dark soil, a taproot descends from the seed in the middle and fine roots spread to both sides; the cream-colored root tips catch the spotlight.",
    "fidan-govde": "A slender sapling trunk rises from the soil of the root box in a gentle S-curve, with two small nodes. Behind the glass, the roots; beyond, the dark hall and the stand walls.",
    "fidan-dal": "The sapling has branched: thin branches spread to both sides of the trunk, with small clusters of pale buds at their tips. Below, the roots behind the glass of the box; beyond, the dark hall.",
    "fidan-yaprak": "A young tree in full leaf: its branches covered with serrated, olive-green leaves, lit from behind by the late-afternoon sun. The trunk rises from the root box amid the dark hall.",
    "dunya-2": `Earth from space, as at the opening. Above it, in handwriting: ${EN_SLOGAN}.`,
  },
  sahne: {
    // (Y) haritacılık etiketleri (OSM adları İngilizce yazımıyla); bölge adları anatomi bandıyla aynı.
    etiket: {
      expo: "Antalya Expo Center",
      d400: "D400",
      beydaglari: "Bey Mountains",
      antalya: "Antalya",
      korfez: "Gulf of Antalya",
      rotunda: EN_ROTUNDA,
      oyun: EN_OYUN,
      kiosk: "Pledge Kiosk",
      amfi: "Amphitheater",
    },
    kunye: EN_TARIH,
    okumaDurak: { "arka duvar · ~3 m": "back wall · ~3 m", "sol duvar · ~3 m": "left wall · ~3 m", "ortak evimiz": "our common home" },
  },
  lombar: {
    baslik: "Inside COP31",
    kimlikAd: "AK Party Youth Branches",
    kimlikAlt: "COP31 Antalya stand",
    kimlikLogo: "AK Party Youth Branches logo",
    logoAlti: { on: "", tarih: EN_TARIH, son: `, ${cop31.venue}` },
    ipucu: "Scroll down",
    // Kapak başlığı (COP31_Brosur_EN.pdf s. 1).
    brosurKart: { etiket: "Digital brochure", baslik: "1 Million Youth, One Common Home", eylem: "Open the brochure" },
  },
  dunya: {
    baslik: "The world meets in Antalya",
    govde: {
      on: "COP31, the UN Climate Change Conference, takes place at Antalya Expo on ",
      tarih: EN_TARIH,
      son: ". Around 150,000 international visitors are expected.",
    },
  },
  emanet: {
    srBaslik: `Türkiye: ${EN_GIRIS.replace(/\.$/, "")}`,
    baslik: EN_GIRIS,
    govde: "Each of the rotunda's 12 columns holds a piece of Anatolia's natural and cultural heritage, entrusted to us.",
  },
  expo: { baslik: cop31.venue, altSatir: "In Aksu; 12 km from the city center, 5 km from the airport." },
  anatomi: {
    srBaslik: `Our stand: ${EN_TEMA}`,
    baslik: EN_TEMA,
    etiketSatir: stant.hashtag,
    bolgeEtiket: "Areas of the stand",
    bolgeler: [
      { no: 1, ad: EN_ROTUNDA, kisa: `12 columns, 12 legacies; at the center, the floor ring: ${EN_BURADA}` },
      // Standın kendi İngilizce bantları (stant.ts pankartlar: "Play – What would you do?", "Come and play!").
      { no: 2, ad: EN_OYUN, kisa: EN_GEL },
      { no: 3, ad: "Pledge Kiosk", kisa: `How many pledged today? ${EN_CAGRI}` },
      { no: 4, ad: "Amphitheater", kisa: "Talks and presentations on curved benches." },
    ],
    pankartEtiket: "Written on the entrance banner",
    pankart: [DOKU_EN.cephe.slogan, DOKU_EN.cephe.hashtag, DOKU_EN.cephe.program].map((metin) => ({ metin })),
  },
  sutunlar: {
    srBaslik: `${EN_BURADA} ${EN_SLOGAN_TOTEM}`,
    // (O) "Climate, nature and zero waste are our heritage." 390 px'de 3 satır (≤ 2, §5): bantta kısaltıldı; sr-only başlıkta tam cümle.
    baslik: "Heritage: climate, nature, zero waste.",
    sutunEtiket: "12 columns, 12 legacies",
    // (Y) emanet.ts'in 12 sütunu (EN_SUTUNLAR; İngilizce sütun yüzleri aynı metin).
    sutunlar: EN_SUTUNLAR,
  },
  duvar: {
    srBaslik: `${EN_BULUSMA} · ${EN_SOLEN}`,
    baslik: EN_BULUSMA,
    satirlar: [
      `More than ${facts.meetings} Youth Meetings in the last ${facts.meetingsYears} years.`, // (B) bölüm 06
      { on: `${EN_SOLEN}: `, tarih: EN_SOLEN_TARIH, son: `, Kocaeli Stadium, ${en(facts.solenAttendees)}+ young people.` }, // (B) bölüm 07
      EN_MOTTO,
    ],
    // Dokudaki satırlar (DOKU_EN.arka), yukarıdan aşağı.
    duvarEtiket: "Written on the back wall",
    duvar: [
      DA.baslik,
      `${DA.bulusmaSayi} ${DA.bulusma}`,
      DA.bulusmaYil,
      DA.solen,
      DA.solenTarihYer,
      `${DA.solenSayi} ${DA.genc}`,
      DA.motto,
      DA.hashtag,
    ].map((metin) => ({ metin })),
  },
  duvar2: {
    baslik: EN_CAGRI,
    // (B) bölüm 01: "The largest youth movement in Türkiye and the world, with more than 1 million members" + "81 provinces, 922 districts"
    govde: `The largest youth movement in Türkiye and the world, with more than 1 million members in ${facts.provinces} provinces and ${facts.districts} districts`,
    duvarEtiket: "Written on the left wall",
    duvar: [`${DS.uye} ${DS.uyeEt}`, DS.ilIlce].map((metin) => ({ metin })),
  },
  fidanKok: {
    srBaslik: "Roots: Who We Are",
    cip: "Roots",
    baslik: "Who We Are",
    altSatir: EN_IL_ILCE,
    govde: `AK Party Youth Branches is the AK Party's youth organization, organized in ${facts.provinces} provinces and built on young people's participation in politics and community work.`,
  },
  fidanGovde: {
    srBaslik: "Trunk: Our President's Youth Vision",
    cip: "Trunk",
    baslik: "Our President's Youth Vision",
    bogumEtiket: "Two nodes on the trunk",
    bogumlar: [
      // (B) bölüm 02: "lowering the minimum age to run for office to 18 in 2017"
      { taraf: -1, ad: `${facts.electionAgeYear} Candidacy Age Reform`, satir: `Age to run for office: ${facts.electionAge}` },
      // (B) "Of the 5 MPs under the age of 30 … 4 were elected from our party"
      { taraf: 1, ad: "Youth Voice in Parliament", satir: `${facts.youngMpsOurs} of the ${facts.youngMps} MPs under ${facts.youngMpsAgeLimit}` },
    ],
  },
  fidanDal: {
    srBaslik: `Branches: ${EN_BULUSMA}`,
    cip: "Branches",
    baslik: EN_BULUSMA,
    // (B) bölüm 06 birebir
    govde: `In the last ${facts.meetingsYears} years, we have held more than ${facts.meetings} Youth Meetings attended by our President.`,
    polaroidEtiket: "Photos",
    polaroidAlt: {
      bulusmaKampusSoylesi: "President Erdoğan speaking into a microphone among young people at a Youth Meetings talk, December 13, 2025",
      bulusmaKampusSalonSelam: "President Erdoğan greeting the young people applauding him in the hall of the Youth Meetings “Kampüs” talk, December 13, 2025",
      solenKocaeliTribunSelam: `President Erdoğan greeting the young people filling the stands of Kocaeli Stadium at the ${EN_SOLEN}`,
      solenKocaeliSahaIkili: `President Erdoğan and the Chairman of AK Party Youth Branches greeting young people at the ${EN_SOLEN} in Kocaeli Stadium`,
    },
  },
  fidanYaprak: {
    srBaslik: "Leaves: Climate Action",
    cip: "Leaves",
    baslik: "Climate Action",
    satirlar: [
      `Üsküdar Youth Branches Memorial Forest — ${facts.saplings} saplings (${facts.saplingsYear})`,
      "Genç İklim: Climate Leadership and Literacy Camp — August 21–23, 2026, Istanbul",
      "Sapling planting and forest clean-up events",
    ],
  },
  dunya2: { slogan: EN_SLOGAN },
  kapanis: {
    logoAkParti: "AK Party logo",
    logoGenclik: "AK Party Youth Branches logo",
    kurum: "AK Party Youth Branches Türkiye",
    alinti: EN_MOTTO,
    etiket: `${EN_TEMA}. ${stant.hashtag}`,
    slogan: EN_SLOGAN,
    etkinlik: { on: `${backCover.line1}: `, tarih: EN_TARIH, son: `, ${cop31.venue}.` },
    // Lisans metinleri (Copernicus, DEM) birebir; OSM atfı OSM'nin önerdiği İngilizce biçim.
    atiflar: [
      { on: "Satellite imagery:", metin: SENTINEL },
      { on: "Elevation:", metin: DEM },
      { metin: "Earth: NASA Earth Observatory (Blue Marble, Black Marble), GEBCO." },
      { metin: "Map data © OpenStreetMap contributors." },
      { metin: "The COP31 Türkiye logo is used to refer to the event." },
      { metin: "Stand and sapling visuals are illustrative." },
    ],
  },
};

export const METIN: Readonly<Record<Dil, IcindenMetin>> = { tr: TR, en: EN };

/** Bölge adı bantta noktayla biter (ad zaten noktalama ile bitiyorsa — "…ne yapardın?" — eklenmez). */
export const bolgeAdi = cumle;

/** Sahne etiketinin metni: sözlükte çevirisi varsa o, yoksa manifestteki (Türkçe). Künye d1'in tarih satırı. */
export function etiketMetni(M: IcindenMetin, t: Etiket): string {
  if (t.tur === "kunye") return M.sahne.kunye ?? t.metin;
  return M.sahne.etiket[t.ad] ?? t.metin;
}
