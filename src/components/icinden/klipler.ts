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
/**
 * Bu duraktan k+1'e ileri geçiş; `geri` k+1 → k ters klibi. `geri: null` (G turu §14.4.1 K4): geri klip yok — oynatıcı
 * geri adımda hedef durağın (k) posterini 350 ms çapraz söndürür (d9→d8, d10→d9, d11→d10, d12→d11; W-3 geçici t89'la d8→d7).
 *
 * Zincir (W-2 §14.7; d11 → d12 "uzaklasma"): `parcalar` mevcut klipler art arda (r43 → r32 → r21; yeni dosya yok), üst
 * düzey `sure`/`kare` toplam, `dosya`/`bayt` boş. `kopruDurak`: posteri ilk parçanın 0. karesi olan durağın id'si ("d4");
 * oynatıcı kalkış görüntüsünden ona 350 ms poster çapraz sönmesiyle geçer, parçaları kare sınırında devreder.
 */
export type Gecis = Klip & {
  readonly geri: Klip | null;
  readonly hizGeri: number;
  readonly parcalar?: readonly Klip[];
  readonly kopruDurak?: string;
};
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
/**
 * d6 arka duvar çapaları (p6; G7 §14.4.4): `bulusma` ("50+"), `solen` ("100.000+"), `motto` (backCover.quote); sıra =
 * d6 bandının 3 spot satırı. p6.json G7 render'ıyla gelene dek manifestte yok (uyarı).
 */
export type DuvarCapaAd = "bulusma" | "solen" | "motto";
export type DuvarCapasi = { readonly ad: DuvarCapaAd; readonly dikey: Nokta; readonly yatay: Nokta };
/** Yön başına video px nokta listesi (kırpım dışı ya da kenara 24 px'ten yakın nokta o yönde yok). */
export type YonluListe<T> = Readonly<Record<Boyut, readonly T[]>>;
/** fidan-kok (d8): kök ucu (81; p9 = t79 son karesi). `grup` 0 kazık kök, 1–6 ana kökler (dalga sırası); `ana` ana kökün ucu. */
export type KokUcu = { readonly x: number; readonly y: number; readonly grup: number; readonly ana: boolean };
/** fidan-govde (d9): boğum (2; tree.ts KNOTS). `taraf` −1 sol, +1 sağ (etiketin yönü). Metin content.ts'ten (manifestte yok). */
export type Bogum = { readonly x: number; readonly y: number; readonly taraf: -1 | 1 };
/** Ana dal ucu adları, alttan üste (S3 `dal_uclari` sırası). */
export type DalUcuAd = "solAlt" | "sağAlt" | "solOrta" | "sağOrta" | "solÜst" | "sağÜst";
/** fidan-dal (d10) ve fidan-yaprak (d11): ana dal ucu (6; d10'da polaroid çapaları). */
export type DalUcu = { readonly ad: DalUcuAd; readonly x: number; readonly y: number };
export type Ozel = {
  readonly dunyaR?: readonly number[];
  readonly dunyaC?: Readonly<Record<Boyut, Nokta>>;
  readonly sutunlar?: Readonly<Record<Boyut, readonly Nokta[]>>;
  /** dunya (d1): Antalya'ya ışık yayları, video px, yay başına ≤ 24 nokta, son nokta Antalya (§12.4-9). İstemciye gitmez. */
  readonly yaylar?: Readonly<Record<Boyut, readonly (readonly Nokta[])[]>>;
  /** duvar (d6): p6 çapaları (bant satırı ↔ duvardaki rakam). */
  readonly duvarCapalari?: readonly DuvarCapasi[];
  /** fidan-kok (d8): 81 kök ucu (DOM 81 halka; tek SVG katmanı). */
  readonly kokUclari?: YonluListe<KokUcu>;
  /** fidan-govde (d9): 2 boğum (2017 / TBMM etiketleri). */
  readonly bogumlar?: YonluListe<Bogum>;
  /** fidan-dal (d10, polaroidler) ve fidan-yaprak (d11): 6 ana dal ucu. */
  readonly dalUclari?: YonluListe<DalUcu>;
  /** fidan-yaprak (d11): gövde ucu (önder). Kırpım dışına düşen yön yok. */
  readonly govdeUcu?: Partial<Record<Boyut, Nokta>>;
};
export type Durak = {
  /** "d0" … "d12" (tablo sırası; kapanış = N = 13, manifest dışı). */
  readonly id: string;
  /** Durağın rolü: oynatıcı ve CSS dizinleri yalnız bundan ve tablo sırasından türetilir (rol.ts). */
  readonly rol: Rol;
  /** "klip": video taşır (döngü yoksa gelen klibin son karesinde durur, d6–d10) | "dom": dinlenme DOM (d0). */
  readonly tur: "klip" | "dom";
  /**
   * Gelen geçişin kare kare kadrajı (m; son öğe = dinlenme; fidan duraklarında ~0,23–0,64 m → site cm yazar; d12'de zincirin
   * 186 karesi, 23,8 m → 12.120 km) ya da sabit metin.
   */
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
  /** 3: G turu (13 durak, masa + fidan-*; kapakTon/brosurDikdortgen kalktı); W-2'de 14 durak (dunya-2, zincir geçiş); W-3'te 13 (masa kalktı). */
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
 * İstemciye giden kopya: sahne etiketleri, d1 yayları ve fidan katmanı (81 kök ucu, boğumlar, dal uçları, gövde ucu;
 * FidanKatmani.tsx) sunucuda HTML/SVG olarak çizilir, istemci yükünde taşınmaz. İstemci `ozel`den yalnız lombar
 * (dunyaR/dunyaC) ve kılavuz çapalarını (sutunlar, duvarCapalari) okur.
 */
export type IstemciDurak = Omit<Durak, "etiketler">;
export type IstemciManifest = Omit<Manifest, "duraklar"> & { readonly duraklar: readonly IstemciDurak[] };

/** Yalnız sunucuda çizilen `ozel` alanları (istemci manifestinden çıkarılır). */
const SUNUCU_OZEL = ["yaylar", "kokUclari", "bogumlar", "dalUclari", "govdeUcu"] as const satisfies readonly (keyof Ozel)[];

export function istemciManifesti(m: Manifest): IstemciManifest {
  return {
    ...m,
    duraklar: m.duraklar.map((d) => {
      const kopya: { -readonly [K in keyof Durak]?: Durak[K] } = { ...d };
      delete kopya.etiketler;
      if (d.ozel) {
        const ozel: { -readonly [K in keyof Ozel]?: Ozel[K] } = { ...d.ozel };
        for (const a of SUNUCU_OZEL) delete ozel[a];
        if (Object.keys(ozel).length) kopya.ozel = ozel;
        else delete kopya.ozel;
      }
      return kopya as IstemciDurak;
    }),
  };
}
