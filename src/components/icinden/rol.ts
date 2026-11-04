/**
 * /icinden v3 durak rolleri (brief-icinden-3 §12.4-1, §12.4-9; G turu §14.4.2). Durak tablosunun tek kaynağı
 * manifesttir (`klipler.json` `duraklar[].rol`, sıra = durak numarası); oynatıcı, VideoSahne ve CSS (`data-rol`,
 * `data-*-rol`) numarayı yalnız buradaki yardımcılarla rolden türetir. Kapanış manifest dışıdır: dizini N (durak
 * sayısı; G turunda 13), rolü "kapanis".
 *
 * İstemci güvenli: JSON içe aktarmaz (manifest istemci paketine girmesin; RSC prop'u olarak gelir).
 */

/** Fidan bölümünün rolleri, durak sırasıyla (d9 kök → d12 yaprak). */
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
  /** d8: bankodaki broşür (son-kare durak; "Dijital broşür →" bağlantısı). */
  | "masa"
  | FidanRol;

/** Kök özniteliklerindeki rol: kapanış da bir "durak" (dizin N). */
export type KokRol = Rol | "kapanis";

/** Rol tablosundan türetilen dizinler (durak numaraları). Bulunamayan tek rol −1. */
export type Dizinler = {
  /** Durak sayısı = kapanış dizini (G turu: 13). */
  readonly N: number;
  readonly lombar: number;
  /** "dunya" (d1; t01'in vardığı, lombar ve yay verisi burada). G turunda Dünya'ya dönüş yok. */
  readonly dunya: number;
  readonly emanet: number;
  readonly expo: number;
  readonly anatomi: number;
  readonly sutunlar: number;
  /** Duvar durakları sırayla (d6 arka duvar, d7 sol duvar). */
  readonly duvarlar: readonly number[];
  /** d8: masadaki broşür. */
  readonly masa: number;
  /** Fidan durakları FIDAN_ROLLERI sırasıyla: [kök (d9), gövde (d10), dal (d11), yaprak (d12)]; olmayan −1. */
  readonly fidanlar: readonly number[];
};

export function dizinler(roller: readonly Rol[]): Dizinler {
  const hepsi = (r: Rol) => roller.flatMap((x, i) => (x === r ? [i] : []));
  const ilk = (r: Rol) => roller.indexOf(r);
  return {
    N: roller.length,
    lombar: ilk("lombar"),
    dunya: ilk("dunya"),
    emanet: ilk("emanet"),
    expo: ilk("expo"),
    anatomi: ilk("anatomi"),
    sutunlar: ilk("sutunlar"),
    duvarlar: hepsi("duvar"),
    masa: ilk("masa"),
    fidanlar: FIDAN_ROLLERI.map(ilk),
  };
}

/** Fidan durağı mı (kök, gövde, dal, yaprak). */
export const fidanRolu = (r: KokRol | "-" | undefined): r is FidanRol => (FIDAN_ROLLERI as readonly string[]).includes(r ?? "");

/** j'nin kök rolü: j ≥ N kapanış; tablo dışı "-". */
export function rolu(roller: readonly Rol[], j: number): KokRol | "-" {
  if (j >= roller.length) return "kapanis";
  return roller[j] ?? "-";
}
