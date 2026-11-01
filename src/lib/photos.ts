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
