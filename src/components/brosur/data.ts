/**
 * Konsept D — Dijital Broşür: sayfa listesi ve küçük yardımcılar.
 * Metinler src/lib/content.ts'ten gelir; burada yalnızca sayfa sırası/başlıkları var.
 */

export type BrosurPage = {
  readonly n: number;
  readonly title: string;
};

/** Broşürün 12 sayfası (İçindekiler listesi ve sayfa numaraları için). */
export const brosurPages: readonly BrosurPage[] = [
  { n: 1, title: "Kapak" },
  { n: 2, title: "İçindekiler" },
  { n: 3, title: "AK Parti Gençlik Kolları" },
  { n: 4, title: "Başkan'ın Mesajı" },
  { n: 5, title: "Biz Kimiz?" },
  { n: 6, title: "Cumhurbaşkanımızın Gençlik Vizyonu" },
  { n: 7, title: "2017 Reformu ve TBMM" },
  { n: 8, title: "Gençlik Buluşmaları" },
  { n: 9, title: "Gençlik Şölenleri" },
  { n: 10, title: "Kapanış Konuşması" },
  { n: 11, title: "İklim Eylemleri" },
  { n: 12, title: "COP31 Türkiye" },
] as const;

/**
 * Koreografi temposu: bileşenlerde yazılan gecikmeler (ms) bu katsayıyla
 * ölçeklenir. Tüm sayfanın giriş hızını tek yerden ayarlamak için.
 */
export const TEMPO = 0.6;

/** Gecikmeyi tempoya göre ölçekler (ms). */
export function tempo(ms: number): number {
  return Math.round(ms * TEMPO);
}

/** "03" gibi iki haneli sayfa numarası. */
export function pageNo(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Binlik ayraçlı sayı ("1.000.000"). toLocaleString yerine elle; sunucu ve
 * istemci çıktısı her ortamda aynı kalır (hidrasyon uyuşmazlığı olmaz).
 */
export function formatNumber(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
