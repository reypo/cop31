/**
 * Dijital broşür: küçük yardımcılar (sayaç temposu, binlik ayraç). Metinler icerik.ts'te.
 */

/**
 * Koreografi temposu: bileşenlerde yazılan gecikmeler (ms) bu katsayıyla
 * ölçeklenir. Tüm sayfanın giriş hızını tek yerden ayarlamak için.
 */
export const TEMPO = 0.6;

/** Gecikmeyi tempoya göre ölçekler (ms). */
export function tempo(ms: number): number {
  return Math.round(ms * TEMPO);
}

/**
 * Binlik ayraçlı sayı ("1.000.000"). toLocaleString yerine elle; sunucu ve
 * istemci çıktısı her ortamda aynı kalır (hidrasyon uyuşmazlığı olmaz).
 */
export function formatNumber(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
