/**
 * /icinden v3 durak rolleri (brief-icinden-3 §12.4-1, §12.4-9). Durak tablosunun tek kaynağı manifesttir
 * (`klipler.json` `duraklar[].rol`, sıra = durak numarası); oynatıcı, VideoSahne, CSS (`data-rol`, `data-*-rol`) ve
 * Brosur dizinleri numarayı yalnız buradaki yardımcılarla rolden türetir. Kapanış manifest dışıdır: dizini N
 * (durak sayısı), rolü "kapanis".
 *
 * İstemci güvenli: JSON içe aktarmaz (manifest istemci paketine girmesin; RSC prop'u olarak gelir).
 */
export type Rol =
  | "lombar"
  | "dunya"
  | "emanet"
  | "expo"
  | "anatomi"
  | "sutunlar"
  | "duvar"
  | "brosur-kapak"
  | "brosur-sayfa"
  | "brosur-arka";

/** Kök özniteliklerindeki rol: kapanış da bir "durak" (dizin N). */
export type KokRol = Rol | "kapanis";

/** Rol tablosundan türetilen dizinler (durak numaraları). Bulunamayan tek rol −1. */
export type Dizinler = {
  /** Durak sayısı = kapanış dizini. */
  readonly N: number;
  readonly lombar: number;
  /** İlk "dunya" (d1; t01'in vardığı, lombar ve yay verisi burada). */
  readonly dunya: number;
  /** Son "dunya" (d11, ortak evimiz; broşür dalışının vardığı). */
  readonly donus: number;
  readonly emanet: number;
  readonly expo: number;
  readonly anatomi: number;
  readonly sutunlar: number;
  /** Duvar durakları sırayla (d6 İklim Eylemleri, d7 Sen de söz ver). */
  readonly duvarlar: readonly number[];
  readonly kapak: number;
  /** Broşür iç sayfaları sırayla (d9). */
  readonly sayfalar: readonly number[];
  readonly arka: number;
};

export function dizinler(roller: readonly Rol[]): Dizinler {
  const hepsi = (r: Rol) => roller.flatMap((x, i) => (x === r ? [i] : []));
  const ilk = (r: Rol) => roller.indexOf(r);
  const dunyalar = hepsi("dunya");
  return {
    N: roller.length,
    lombar: ilk("lombar"),
    dunya: dunyalar[0] ?? -1,
    donus: dunyalar.at(-1) ?? -1,
    emanet: ilk("emanet"),
    expo: ilk("expo"),
    anatomi: ilk("anatomi"),
    sutunlar: ilk("sutunlar"),
    duvarlar: hepsi("duvar"),
    kapak: ilk("brosur-kapak"),
    sayfalar: hepsi("brosur-sayfa"),
    arka: ilk("brosur-arka"),
  };
}

/** Broşür durağı mı (kapak, iç sayfa, arka kapak). */
export const brosurRolu = (r: KokRol | undefined) => r === "brosur-kapak" || r === "brosur-sayfa" || r === "brosur-arka";

/** j'nin kök rolü: j ≥ N kapanış; tablo dışı "-". */
export function rolu(roller: readonly Rol[], j: number): KokRol | "-" {
  if (j >= roller.length) return "kapanis";
  return roller[j] ?? "-";
}

/** Broşür bileşeninin dizinleri (Brosur.tsx; sunucu hesaplar, prop olarak geçer). */
export type BrosurDizin = { readonly kapak: number; readonly bulusma: number; readonly arka: number };
export const brosurDizini = (I: Dizinler): BrosurDizin => ({ kapak: I.kapak, bulusma: I.sayfalar[0] ?? I.kapak + 1, arka: I.arka });
