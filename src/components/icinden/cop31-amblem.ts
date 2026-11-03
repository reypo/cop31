/*
 * Resmî COP31 logosunun amblem diski (docs/cop31-logo.md §5). Ayrı modül: bu sayılar (v3'te logo
 * yerleşimi CSS'te, `icinden3.css` .v3-logo sabitleri) logo path'leri (Cop31Logo.tsx) olmadan okunabilsin
 * diye; v2'de istemcideki derinlik motoru (derinlik.ts, silindi) kullanıyordu. Cop31Logo.tsx aynı nesneyi
 * yeniden dışa verir.
 */

/** Amblemin dairesel diski (lale hariç), ilgili düzenin viewBox biriminde. */
export const cop31Amblem = {
  dikey: { viewBox: "0 0 450.839 636.03", w: 450.839, h: 636.03, cx: 225.384, cy: 171.213, r: 160.445 },
  yatay: { viewBox: "0 0 817.18 329.766", w: 817.18, h: 329.766, cx: 160.576, cy: 171.213, r: 160.445 },
} as const;
