/**
 * /icinden v3 klip manifesti — tipler (şema: docs/klipler-sema.md). Veri `klipler.json`'da; onu
 * scripts/icinden/manifest-birlestir.mjs üretir (elle düzenlenmez). Sunucu bileşeni okur, istemciye prop
 * olarak geçer: manifest RSC yükünde taşınır, istemci JS paketine girmez.
 */
import ham from "./klipler.json";

export type Boyut = "dikey" | "yatay";
export type KodekAd = "av1" | "hevc" | "h264";
export type Nokta = readonly [number, number];
export type BoyutKodek<T> = Partial<Record<Boyut, Partial<Record<KodekAd, T>>>>;

export type Klip = {
  readonly ad: string;
  readonly sure: number;
  readonly kare: number;
  readonly dosya: BoyutKodek<string>;
  readonly bayt: BoyutKodek<number>;
};
export type Gecis = Klip & { readonly geri: Klip | null; readonly hizGeri: number };
export type Poster = { readonly dosya: string; readonly bayt: number; readonly lqip: string };
export type EtiketTur = "doga" | "yapi" | "bolge";
export type Etiket = {
  readonly ad: string;
  readonly metin: string;
  readonly x: number;
  readonly y: number;
  readonly tur: EtiketTur;
  readonly no?: number;
  readonly nokta?: boolean;
};
export type Ozel = {
  readonly dunyaR?: readonly number[];
  readonly dunyaC?: Readonly<Record<Boyut, Nokta>>;
  readonly sutunlar?: Readonly<Record<Boyut, readonly Nokta[]>>;
  readonly brosurDikdortgen?: Readonly<Record<Boyut, readonly Nokta[]>>;
  /** d6: render kapağının tonu (CSS filtresi, sRGB; scripts/icinden/kapak-ton.py). Kesişmede tam, FLIP'te kimliğe iner. */
  readonly kapakTon?: KapakTon;
};
export type KapakTon = { readonly saturate: number; readonly contrast: number; readonly brightness: number; readonly sepia: number };
export type Durak = {
  readonly id: string;
  readonly tur: "klip" | "dom";
  /** Gelen geçişin kare kare kadrajı (m; son öğe = dinlenme) ya da sabit metin. */
  readonly okuma: readonly number[] | string;
  readonly okumaDurak?: string;
  readonly poster: Partial<Record<Boyut, Poster>> | null;
  readonly dongu: Klip | null;
  readonly ileri: Gecis | null;
  readonly etiketler?: Readonly<Record<Boyut, readonly Etiket[]>>;
  readonly ozel?: Ozel;
};
export type KodekTanim = { readonly ad: KodekAd; readonly tip: string; readonly boyutlar: readonly Boyut[] };
export type Manifest = {
  readonly surum: number;
  readonly olusturma: string;
  readonly kaynak: "render" | "onizleme" | "yer-tutucu";
  readonly fps: number;
  readonly master: number;
  readonly boyutlar: Readonly<Record<Boyut, { readonly g: number; readonly y: number; readonly kirpim: readonly number[] }>>;
  readonly kodekler: readonly KodekTanim[];
  readonly duraklar: readonly Durak[];
};

export const klipler = ham as unknown as Manifest;

/** İstemciye giden kopya: sahne etiketleri sunucuda HTML olarak çizilir, istemci yükünde taşınmaz. */
export type IstemciDurak = Omit<Durak, "etiketler">;
export type IstemciManifest = Omit<Manifest, "duraklar"> & { readonly duraklar: readonly IstemciDurak[] };

export function istemciManifesti(m: Manifest): IstemciManifest {
  return {
    ...m,
    duraklar: m.duraklar.map((d) => {
      const kopya: { -readonly [K in keyof Durak]?: Durak[K] } = { ...d };
      delete kopya.etiketler;
      return kopya as IstemciDurak;
    }),
  };
}
