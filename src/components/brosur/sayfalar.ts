/**
 * Dijital broşür sayfa görüntülerinin manifesti. ÜRETİLMİŞ DOSYA: node scripts/brosur/uret.mjs — elle düzenleme yapma.
 * Görüntü adı: /brosur/<dil>/pNN-<genişlik>.<özet>.<avif|webp> (sayfa başına tek özet; next.config.ts kalıcı önbellek).
 */
import type { Dil } from "@/lib/dil";

export const SAYFA_SAYISI = 26;

/** Raster genişlik → yükseklik (px; PDF sayfası 595,276 × 841,89 pt, kırpma yok). */
export const RASTER: Readonly<Record<number, readonly [number, number]>> = { 120: [120, 170], 240: [240, 340], 800: [800, 1132], 1240: [1240, 1754], 2480: [2480, 3508] };

/** Sayfa başına içerik özeti (dizin 0 = sayfa 1). */
export const OZET: Record<Dil, readonly string[]> = {
  en: ["573a03e2", "30471077", "bcdaa74d", "02c1a5a1", "dc293e0b", "ec7a2057", "f45cdf0a", "da33bfd4", "4fd290d9", "dda825d1", "1d5e9c91", "9a4117f9", "4eea2129", "4c22abd2", "7feaea6c", "1b3343fb", "47c2fb60", "bfacd470", "f7397818", "9af2fb15", "670607f2", "dfe8e52d", "6fde86d1", "71794366", "ef45494a", "99ed8a46"],
  tr: ["57d4068b", "c40f7f7e", "95ce9e13", "77f0cd3d", "bfa8964f", "0e89f259", "95dec336", "595a47c4", "fbea08c3", "6e968287", "4b80da18", "ffc79117", "d9620b4e", "36db9d1a", "ee39d197", "0e5c503b", "6f71eb9b", "473f1fd9", "8507c003", "76c0f12e", "84a1d65f", "c73de6f1", "2da430f9", "27f170c1", "c496c202", "cdc7be1f"],
};

/** İçindekiler (2. sayfa) bağlantı kutuları: sayfaya oranla x, y, genişlik g, yükseklik h; p = hedef sayfa. */
export const ICINDEKILER: Record<Dil, readonly { p: number; x: number; y: number; g: number; h: number }[]> = {
  en: [
    { p: 3, x: 0.0661, y: 0.5331, g: 0.4124, h: 0.0511 },
    { p: 4, x: 0.0661, y: 0.5954, g: 0.2893, h: 0.0511 },
    { p: 6, x: 0.0661, y: 0.6577, g: 0.4129, h: 0.0511 },
    { p: 8, x: 0.0661, y: 0.72, g: 0.3652, h: 0.0511 },
    { p: 12, x: 0.0661, y: 0.7823, g: 0.2633, h: 0.0511 },
    { p: 14, x: 0.0661, y: 0.8446, g: 0.2796, h: 0.0511 },
    { p: 16, x: 0.5042, y: 0.5331, g: 0.2778, h: 0.0511 },
    { p: 17, x: 0.5042, y: 0.5954, g: 0.2271, h: 0.0511 },
    { p: 18, x: 0.5042, y: 0.6577, g: 0.3474, h: 0.0511 },
    { p: 20, x: 0.5042, y: 0.72, g: 0.2754, h: 0.0511 },
    { p: 21, x: 0.5042, y: 0.7823, g: 0.3229, h: 0.0511 },
    { p: 24, x: 0.5042, y: 0.8446, g: 0.3895, h: 0.0541 },
  ],
  tr: [
    { p: 3, x: 0.0661, y: 0.5871, g: 0.3419, h: 0.0511 },
    { p: 4, x: 0.0661, y: 0.6472, g: 0.2771, h: 0.0511 },
    { p: 6, x: 0.0661, y: 0.7072, g: 0.3173, h: 0.0511 },
    { p: 8, x: 0.0661, y: 0.7673, g: 0.2765, h: 0.0511 },
    { p: 12, x: 0.0661, y: 0.8273, g: 0.2264, h: 0.0511 },
    { p: 14, x: 0.0661, y: 0.8873, g: 0.2861, h: 0.0511 },
    { p: 16, x: 0.5042, y: 0.5871, g: 0.2483, h: 0.0511 },
    { p: 17, x: 0.5042, y: 0.6472, g: 0.2277, h: 0.0511 },
    { p: 18, x: 0.5042, y: 0.7072, g: 0.3926, h: 0.0511 },
    { p: 20, x: 0.5042, y: 0.7673, g: 0.2418, h: 0.0511 },
    { p: 21, x: 0.5042, y: 0.8273, g: 0.2929, h: 0.0511 },
    { p: 24, x: 0.5042, y: 0.8873, g: 0.3683, h: 0.0541 },
  ],
};

/** Müşterinin PDF'i ("PDF" düğmesi; yalnız tıklanınca iner). */
export const PDF: Record<Dil, { yol: string; bayt: number }> = {
  en: { yol: "/brosur/pdf/cop31-brosur-en.2c016ca0.pdf", bayt: 26900722 },
  tr: { yol: "/brosur/pdf/cop31-brosur-tr.ebbd308b.pdf", bayt: 27342359 },
};
