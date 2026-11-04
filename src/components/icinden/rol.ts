/**
 * /icinden v3 durak rolleri (brief-icinden-3 §12.4-1, §12.4-9; G turu §14.4.2). Durak tablosunun tek kaynağı
 * manifesttir (`klipler.json` `duraklar[].rol`, sıra = durak numarası); oynatıcı, VideoSahne ve CSS (`data-rol`,
 * `data-*-rol`) numarayı yalnız buradaki yardımcılarla rolden türetir. Kapanış manifest dışıdır: dizini N (durak
 * sayısı; G turunda 13, W-2'de 14, W-3'te yine 13: masa kalktı, Dünya sonda), rolü "kapanis".
 *
 * İstemci güvenli: JSON içe aktarmaz (manifest istemci paketine girmesin; RSC prop'u olarak gelir).
 */

/** Fidan bölümünün rolleri, durak sırasıyla (d8 kök → d11 yaprak; W-3). */
export const FIDAN_ROLLERI = ["fidan-kok", "fidan-govde", "fidan-dal", "fidan-yaprak"] as const;
export type FidanRol = (typeof FIDAN_ROLLERI)[number];

export type Rol =
  | "lombar"
  | "dunya"
  | "emanet"
  | "expo"
  | "anatomi"
  | "sutunlar"
  | "duvar"
  | FidanRol;

/** Kök özniteliklerindeki rol: kapanış da bir "durak" (dizin N). */
export type KokRol = Rol | "kapanis";

/** Rol tablosundan türetilen dizinler (durak numaraları). Bulunamayan tek rol −1. */
export type Dizinler = {
  /** Durak sayısı = kapanış dizini (G turu: 13; W-2: 14; W-3: 13). */
  readonly N: number;
  readonly lombar: number;
  /** İlk "dunya" (d1; t01'in vardığı, lombar ve yay verisi burada). */
  readonly dunya: number;
  /**
   * Son "dunya" (W-2 §14.7, W-3'te d12: "Gezegenimiz Ortak Evimizdir"; fidandan Dünya'ya uzaklaşmanın vardığı). Tek "dunya" varsa
   * −1 (G-B tablosu).
   */
  readonly donus: number;
  readonly emanet: number;
  readonly expo: number;
  readonly anatomi: number;
  readonly sutunlar: number;
  /** Duvar durakları sırayla (d6 arka duvar, d7 sol duvar). */
  readonly duvarlar: readonly number[];
  /** Fidan durakları FIDAN_ROLLERI sırasıyla: [kök (d8), gövde (d9), dal (d10), yaprak (d11)]; olmayan −1. */
  readonly fidanlar: readonly number[];
};

export function dizinler(roller: readonly Rol[]): Dizinler {
  const hepsi = (r: Rol) => roller.flatMap((x, i) => (x === r ? [i] : []));
  const ilk = (r: Rol) => roller.indexOf(r);
  const dunyalar = hepsi("dunya");
  return {
    N: roller.length,
    lombar: ilk("lombar"),
    dunya: dunyalar[0] ?? -1,
    donus: dunyalar.length > 1 ? dunyalar[dunyalar.length - 1] : -1,
    emanet: ilk("emanet"),
    expo: ilk("expo"),
    anatomi: ilk("anatomi"),
    sutunlar: ilk("sutunlar"),
    duvarlar: hepsi("duvar"),
    fidanlar: FIDAN_ROLLERI.map(ilk),
  };
}

/** Fidan durağı mı (kök, gövde, dal, yaprak). */
export const fidanRolu = (r: KokRol | "-" | undefined): r is FidanRol => (FIDAN_ROLLERI as readonly string[]).includes(r ?? "");

/** Aynı rolün kaçıncısı (1'den; d1 dunya → 1, d12 dunya → 2): CSS `data-sira` (d12 ters yaylar, halka yalnız 1'de). */
export function sirasi(roller: readonly Rol[], j: number): number {
  const r = roller[j];
  return r ? roller.slice(0, j).filter((x) => x === r).length + 1 : 0;
}

/** j'nin kök rolü: j ≥ N kapanış; tablo dışı "-". */
export function rolu(roller: readonly Rol[], j: number): KokRol | "-" {
  if (j >= roller.length) return "kapanis";
  return roller[j] ?? "-";
}
