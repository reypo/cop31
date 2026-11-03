/**
 * /icinden v3 klip manifesti — tipler (şema: docs/klipler-sema.md). Veri `klipler.json`'da; onu
 * scripts/icinden/manifest-birlestir.mjs üretir (elle düzenlenmez). Sunucu bileşeni okur, istemciye prop
 * olarak geçer: manifest RSC yükünde taşınır, istemci JS paketine girmez.
 */
import ham from "./klipler.json";
import type { Rol } from "./rol";

export type { Rol } from "./rol";

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
/**
 * doga/yapi/bolge: haritacılık etiketleri (§5). kunye (d1, §12.4-2): Antalya künyesi; `metin` SSR satırı
 * ("9–20 Kasım 2026"). emanet (d2, §12.4-3): 12 emanet ışığı; `no` 1–12, `donem` emanet.ts dönem adı
 * (donemler[].ad), `metin` boş (ad yazılmaz), `dx`/`dy` numaranın video px ofseti (çakışan çiftler).
 */
export type EtiketTur = "doga" | "yapi" | "bolge" | "kunye" | "emanet";
export type Etiket = {
  readonly ad: string;
  readonly metin: string;
  readonly x: number;
  readonly y: number;
  readonly tur: EtiketTur;
  readonly no?: number;
  readonly nokta?: boolean;
  readonly donem?: string;
  readonly dx?: number;
  readonly dy?: number;
};
/** d6 kılavuz çizgilerinin p6 çapaları (`fidan`, `genc_iklim`, `orman`; sıra = iklim.items sırası). */
export type DuvarCapasi = { readonly ad: string; readonly dikey: Nokta; readonly yatay: Nokta };
export type Ozel = {
  readonly dunyaR?: readonly number[];
  readonly dunyaC?: Readonly<Record<Boyut, Nokta>>;
  readonly sutunlar?: Readonly<Record<Boyut, readonly Nokta[]>>;
  readonly brosurDikdortgen?: Readonly<Record<Boyut, readonly Nokta[]>>;
  /** brosur-kapak (d8): render kapağının tonu (CSS filtresi, sRGB; scripts/icinden/kapak-ton.py). Kesişmede tam, FLIP'te kimliğe iner. */
  readonly kapakTon?: KapakTon;
  /** dunya (d1, d11): Antalya'ya ışık yayları, video px, yay başına ≤ 24 nokta, son nokta Antalya (§12.4-9). İstemciye gitmez. */
  readonly yaylar?: Readonly<Record<Boyut, readonly (readonly Nokta[])[]>>;
  /** duvar (d6): p6 çapaları (kılavuz çizgi). */
  readonly duvarCapalari?: readonly DuvarCapasi[];
};
export type KapakTon = { readonly saturate: number; readonly contrast: number; readonly brightness: number; readonly sepia: number };
export type Durak = {
  /** "d0" … "d11" (tablo sırası). */
  readonly id: string;
  /** Durağın rolü: oynatıcı, CSS ve Brosur dizinleri yalnız bundan ve tablo sırasından türetilir (rol.ts). */
  readonly rol: Rol;
  /** "klip": video taşır (döngü yoksa gelen klibin son karesinde durur, d6/d7) | "dom": dinlenme DOM. */
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

/**
 * İstemciye giden kopya: sahne etiketleri ve d1/d11 yayları sunucuda HTML/SVG olarak çizilir, istemci yükünde
 * taşınmaz.
 */
export type IstemciDurak = Omit<Durak, "etiketler">;
export type IstemciManifest = Omit<Manifest, "duraklar"> & { readonly duraklar: readonly IstemciDurak[] };

export function istemciManifesti(m: Manifest): IstemciManifest {
  return {
    ...m,
    duraklar: m.duraklar.map((d) => {
      const kopya: { -readonly [K in keyof Durak]?: Durak[K] } = { ...d };
      delete kopya.etiketler;
      if (d.ozel?.yaylar) {
        const ozel: { -readonly [K in keyof Ozel]?: Ozel[K] } = { ...d.ozel };
        delete ozel.yaylar;
        kopya.ozel = ozel;
      }
      return kopya as IstemciDurak;
    }),
  };
}
