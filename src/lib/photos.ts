/**
 * Fotoğraf ve logo kataloğu (brief §4). next/image ile:
 *   <Image src={photos.globeFoliage.src} width={...} height={...} alt={...} sizes="..." />
 * ya da kısaca <Image {...photos.globeFoliage} sizes="..." />.
 * Yüzler önemli: kırparken object-position'ı yüzlere göre ayarlayın.
 */

export type PhotoAsset = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
};

export const photos = {
  globeFoliage: {
    src: "/photos/globe-foliage.jpg",
    width: 1067,
    height: 1600,
    alt: "Yeşil yapraklar arasında dünya küresi",
  },
  baskanVeCumhurbaskani: {
    src: "/photos/baskan-ve-cumhurbaskani.jpg",
    width: 1600,
    height: 1387,
    alt: "Av. Yusuf İbiş ve Cumhurbaşkanı Recep Tayyip Erdoğan",
  },
  bayrakKalabalik: {
    src: "/photos/bayrak-kalabalik.jpg",
    width: 1120,
    height: 630,
    alt: "Gece, AK Parti ve Türk bayraklarıyla kalabalık",
  },
  genclikBulusmasiSalon: {
    src: "/photos/genclik-bulusmasi-salon.jpg",
    width: 1600,
    height: 1119,
    alt: "Salonda gençlerin arasında oturan Cumhurbaşkanı Erdoğan",
  },
  bulusmaSamsun: {
    src: "/photos/bulusma-samsun.jpg",
    width: 550,
    height: 751,
    alt: "Gençlik Buluşmaları Samsun sahnesi",
  },
  tbmmGenelKurul: {
    src: "/photos/tbmm-genel-kurul.jpg",
    width: 1600,
    height: 900,
    alt: "TBMM Genel Kurul salonu",
  },
  tbmmHavadan: {
    src: "/photos/tbmm-havadan.jpg",
    width: 1093,
    height: 728,
    alt: "Ankara'da TBMM binası, havadan görünüm",
  },
  sozGenclikteAnkara: {
    src: "/photos/soz-genclikte-ankara.jpg",
    width: 1600,
    height: 1067,
    alt: "Söz Gençlikte Ramazan Ankara sahne sohbeti, 11 Mart 2026",
  },
  sozGenclikteOsmaniye: {
    src: "/photos/soz-genclikte-osmaniye.jpg",
    width: 1600,
    height: 1067,
    alt: "Söz Gençlikte Ramazan Osmaniye paneli, 6 Mart 2026",
  },
  sozGenclikteBursa: {
    src: "/photos/soz-genclikte-bursa.jpg",
    width: 1600,
    height: 1066,
    alt: "Bursa'da gençlerle dolu amfi salon",
  },
  sozGenclikteSenler: {
    src: "/photos/soz-genclikte-senler.jpg",
    width: 1600,
    height: 1067,
    alt: "Söz Gençlikte Şenler: gece ateş başında gençler",
  },
  solenKocaeliStadyum: {
    src: "/photos/solen-kocaeli-stadyum.jpg",
    width: 820,
    height: 550,
    alt: "Kocaeli Stadyumu'nda Gençlik Şöleni, dolu tribünler",
  },
  solenKocaeliTribun: {
    src: "/photos/solen-kocaeli-tribun.jpg",
    width: 824,
    height: 550,
    alt: "Gençlik Şöleni'nde tribünde el sallayan gençler",
  },
  solenKocaeliSelam: {
    src: "/photos/solen-kocaeli-selam.jpg",
    width: 831,
    height: 550,
    alt: "Gençlik Şöleni'nde gençleri selamlayan Cumhurbaşkanı Erdoğan",
  },
  fidanDikimiBaskan: {
    src: "/photos/fidan-dikimi-baskan.jpg",
    width: 1600,
    height: 1067,
    alt: "Kürekle fidan diken genç",
  },
  copToplamaOrman: {
    src: "/photos/cop-toplama-orman.jpg",
    width: 1200,
    height: 1600,
    alt: "Ormanda çöp toplayan gönüllü gençler",
  },
  gencIklimPanel: {
    src: "/photos/genc-iklim-panel.jpg",
    width: 1600,
    height: 900,
    alt: "Genç İklim paneli, 21-23 Ağustos 2026, İstanbul",
  },
  hatiraOrmaniTabela: {
    src: "/photos/hatira-ormani-tabela.jpg",
    width: 1600,
    height: 1200,
    alt: "Üsküdar Gençlik Kolları Hatıra Ormanı tabelası",
  },
  fidanDikimiGencler: {
    src: "/photos/fidan-dikimi-gencler.jpg",
    width: 1080,
    height: 812,
    alt: "Birlikte fidan diken iki genç",
  },
  fidanDikimiEkip: {
    src: "/photos/fidan-dikimi-ekip.jpg",
    width: 1200,
    height: 1600,
    alt: "Mavi yelekli gençler fidan dikiyor",
  },

  // --- 1 Kasım 2026'da eklenen 22 fotoğraf (kaynak p01–p22; seçim ve odak: docs/foto-yeni.md) ---

  // Gençlik Buluşmaları "Kampüs", 13 Aralık 2025
  bulusmaKampusSoylesi: {
    // p12
    src: "/photos/bulusma-kampus-soylesi.jpg",
    width: 1600,
    height: 1067,
    alt: "Gençlik Buluşmaları söyleşisinde gençlerin yanında elinde mikrofonla konuşan Cumhurbaşkanı Erdoğan, 13 Aralık 2025",
  },
  bulusmaKampusSoylesiGenis: {
    // p11
    src: "/photos/bulusma-kampus-soylesi-genis.jpg",
    width: 1600,
    height: 1067,
    alt: "Gençlik Buluşmaları \"Kampüs\" söyleşisinde dört gençle birlikte koltuklarda oturan Cumhurbaşkanı Erdoğan, 13 Aralık 2025",
  },
  bulusmaKampusHediye: {
    // p01
    src: "/photos/bulusma-kampus-hediye.jpg",
    width: 1600,
    height: 1067,
    alt: "Gençlik Buluşmaları'nda Cumhurbaşkanı Erdoğan'a üzerinde \"Gençlik\", \"Lider\" ve \"Vizyon\" yazan bir hediye kutusu takdim ediliyor",
  },
  bulusmaKampusMikrofon: {
    // p02
    src: "/photos/bulusma-kampus-mikrofon.jpg",
    width: 1600,
    height: 1098,
    alt: "Gençlik Buluşmaları söyleşisinde elinde mikrofonla gençlere seslenen Cumhurbaşkanı Erdoğan; ön planda alkışlayan gençler",
  },
  bulusmaKampusGenclerSohbet: {
    // p03
    src: "/photos/bulusma-kampus-gencler-sohbet.jpg",
    width: 1600,
    height: 1215,
    alt: "Gençlik Buluşmaları salonunda Cumhurbaşkanı Erdoğan'la ayakta sohbet eden gençler",
  },
  bulusmaKampusSalonSelam: {
    // p17
    src: "/photos/bulusma-kampus-salon-selam.jpg",
    width: 1600,
    height: 1081,
    alt: "Gençlik Buluşmaları \"Kampüs\" salonunda kendisini alkışlayan gençleri selamlayan Cumhurbaşkanı Erdoğan, 13 Aralık 2025",
  },

  // Strateji ve İstişare Kampı, 13 Ağustos 2025
  kamp2025Selam: {
    // p16
    src: "/photos/kamp-2025-selam.jpg",
    width: 1275,
    height: 1600,
    alt: "Strateji ve İstişare Kampı sahnesinde gençleri selamlayan Cumhurbaşkanı Erdoğan ve AK Parti Gençlik Kolları Başkanı, 13 Ağustos 2025",
  },
  kamp2025Ozcekim: {
    // p10
    src: "/photos/kamp-2025-ozcekim.jpg",
    width: 1600,
    height: 1067,
    alt: "Strateji ve İstişare Kampı'nda sahnede Cumhurbaşkanı Erdoğan'la özçekim yapan Gençlik Kolları Başkanı; arkada salonu dolduran gençler",
  },
  kamp2025Pankart: {
    // p13 — kaynak zaten 1600 px; yalnızca küçük polaroid
    src: "/photos/kamp-2025-pankart.jpg",
    width: 1600,
    height: 1066,
    alt: "\"Bu Senin Hikayen – Türkiye'nin Gücü AK Gençlik\" Strateji ve İstişare Kampı sahnesinde kürsüdeki Cumhurbaşkanı Erdoğan, 13 Ağustos 2025",
  },
  kamp2025KursuBasparmak: {
    // p09
    src: "/photos/kamp-2025-kursu-basparmak.jpg",
    width: 1600,
    height: 1067,
    alt: "Strateji ve İstişare Kampı'nda kürsüden başparmağını kaldırarak gençlere seslenen Cumhurbaşkanı Erdoğan, 13 Ağustos 2025",
  },
  kamp2025KonusmaTablo: {
    // p04
    src: "/photos/kamp-2025-konusma-tablo.jpg",
    width: 1600,
    height: 1094,
    alt: "Strateji ve İstişare Kampı'nda arkasında büyük bir tablo bulunan kürsüde konuşan Cumhurbaşkanı Erdoğan, 13 Ağustos 2025",
  },
  kamp2025SalonIsiklar: {
    // p05
    src: "/photos/kamp-2025-salon-isiklar.jpg",
    width: 1600,
    height: 997,
    alt: "Strateji ve İstişare Kampı'nda telefon ışıklarını yakan gençlerle dolu salona kürsüden seslenen Cumhurbaşkanı Erdoğan, 13 Ağustos 2025",
  },

  // Bir Gençlik Şöleni, Kocaeli Stadyumu (16 Mayıs 2026)
  solenKocaeliTribunSelam: {
    // p19
    src: "/photos/solen-kocaeli-tribun-selam.jpg",
    width: 1600,
    height: 1063,
    alt: "Bir Gençlik Şöleni'nde Kocaeli Stadyumu tribünlerini dolduran gençleri selamlayan Cumhurbaşkanı Erdoğan",
  },
  solenKocaeliKursuSelam: {
    // p08
    src: "/photos/solen-kocaeli-kursu-selam.jpg",
    width: 1600,
    height: 1067,
    alt: "\"Bir Gençlik Şöleni\" logolu Kocaeli kürsüsünde iki elini kaldırarak gençleri selamlayan Cumhurbaşkanı Erdoğan",
  },
  solenKocaeliSahaIkili: {
    // p22
    src: "/photos/solen-kocaeli-saha-ikili.jpg",
    width: 1242,
    height: 1600,
    alt: "Kocaeli Stadyumu'nda Bir Gençlik Şöleni'nde gençleri selamlayan Cumhurbaşkanı Erdoğan ve AK Parti Gençlik Kolları Başkanı",
  },
  solenKocaeliSahaSelam: {
    // p18
    src: "/photos/solen-kocaeli-saha-selam.jpg",
    width: 1233,
    height: 1600,
    alt: "Bir Gençlik Şöleni'nde Kocaeli Stadyumu sahasından tribünleri selamlayan Cumhurbaşkanı Erdoğan ve Gençlik Kolları Başkanı",
  },
  solenKocaeliSahaYuruyus: {
    // p21
    src: "/photos/solen-kocaeli-saha-yuruyus.jpg",
    width: 1186,
    height: 1600,
    alt: "Bir Gençlik Şöleni'nde elini kalbine koyarak sahada yürüyen Cumhurbaşkanı Erdoğan ve Gençlik Kolları Başkanı, Kocaeli Stadyumu",
  },
  solenKocaeliElKalpte: {
    // p06
    src: "/photos/solen-kocaeli-el-kalpte.jpg",
    width: 1067,
    height: 1600,
    alt: "Bir Gençlik Şöleni kürsüsünde elini kalbine koyarak gençleri selamlayan Cumhurbaşkanı Erdoğan, Kocaeli",
  },
  solenKocaeliKursuKonusma: {
    // p07
    src: "/photos/solen-kocaeli-kursu-konusma.jpg",
    width: 1600,
    height: 1067,
    alt: "Bir Gençlik Şöleni'nde Kocaeli kürsüsünden mikrofonla konuşan Cumhurbaşkanı Erdoğan",
  },
  solenKocaeliElOpme: {
    // p20 — önerilmez (docs/foto-yeni.md)
    src: "/photos/solen-kocaeli-el-opme.jpg",
    width: 1600,
    height: 1152,
    alt: "Bir Gençlik Şöleni sahnesinde Cumhurbaşkanı Erdoğan'ın elini öpen genç",
  },

  // GençFest – Bir Gençlik Festivali, kapalı salon (yer ve tarih müşteri onayına)
  gencfestYuruyus: {
    // p14
    src: "/photos/gencfest-yuruyus.jpg",
    width: 1600,
    height: 1060,
    alt: "GençFest'te gençlerle dolu salonda yürüyen Cumhurbaşkanı Erdoğan",
  },
  gencfestSalonKonusma: {
    // p15
    src: "/photos/gencfest-salon-konusma.jpg",
    width: 1600,
    height: 1049,
    alt: "GençFest'te kürsüden dolu salona seslenen Cumhurbaşkanı Erdoğan",
  },
} as const satisfies Record<string, PhotoAsset>;

/** Şeffaf PNG logolar (public/brand). */
export const logos = {
  akParti: {
    src: "/brand/logo-ak-parti.png",
    width: 1000,
    height: 1200,
    alt: "AK Parti logosu",
  },
  genclikKollari: {
    src: "/brand/logo-genclik-kollari.png",
    width: 1200,
    height: 1200,
    alt: "AK Parti Gençlik Kolları logosu",
  },
  sozGenclikteTurkiye: {
    src: "/brand/soz-genclikte-turkiye.png",
    width: 1200,
    height: 369,
    alt: "Söz Gençlikte Türkiye",
  },
} as const satisfies Record<string, PhotoAsset>;

export type PhotoKey = keyof typeof photos;
export type LogoKey = keyof typeof logos;

/** Fotoğraflar + logolar, isimle (images.globeFoliage, images.akParti). */
export const images = { ...photos, ...logos } as const;

/** 20 fotoğraf, broşür sırasıyla. */
export const photoList: readonly PhotoAsset[] = Object.values(photos);

/** 3 logo. */
export const logoList: readonly PhotoAsset[] = Object.values(logos);

/** 20 fotoğraf + 3 logo. */
export const imageList: readonly PhotoAsset[] = [...photoList, ...logoList];

export default photos;
