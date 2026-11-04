/**
 * Lombar (brief-icinden-3 §1.1 B, R3 d1-b): beyaz kâğıtta dairesel delik. Logo bütün hâlinde söndükten
 * SONRA amblem dairesinde T01'in ilk karesi belirir; sonra delik ease-in ile büyür ve kamera uzaya geçer.
 * Delik yarıçapı klipten dışa aktarılan `dunyaR[kare]` eğrisinden (rVFC): r = r0 · (R/R0)^2,6 (kâğıt
 * kameraya daha yakın: paralaks), en geç 1,1 s'de ekran köşegenini geçer. Kenarda 1 px yumuşatma + 2 px iç
 * gölge rgba(0,0,0,.12) (kâğıt kalınlığı). Beyaz tam #FFFFFF: DOM'da, render renk dönüşümü dokunmaz.
 *
 * Delik `mask-image` radyal gradyanıyla; yalnız bu katman boyanır (transform yok, ölçek bulanıklığı yok). G turunda
 * Dünya'ya dönüş (eski d10 → d11 broşür dalışı) kalktı: lombar yalnız d0 ↔ d1.
 */
export default function Lombar() {
  return <div data-v3-kagit aria-hidden="true" className="v3-kagit" />;
}

/**
 * Elemanda (cx, cy) merkezli r yarıçaplı delik. ic: deliğin içinin opaklığı (1 = delik kapalı/dolu,
 * 0 = açık); fotoğraf → video çapraz sönmesi bununla yapılır. r ≤ 0 ya da null: maske kaldırılır.
 */
export function delikYaz(el: HTMLElement | null, d: { cx: number; cy: number; r: number; ic?: number } | null) {
  if (!el) return;
  if (!d) {
    el.style.removeProperty("mask-image");
    el.style.removeProperty("-webkit-mask-image");
    return;
  }
  const { cx, cy, r } = d;
  const ic = d.ic ?? 0;
  const a = `rgb(0 0 0 / ${ic.toFixed(3)})`;
  const g = `radial-gradient(circle at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, ${a} 0, ${a} ${Math.max(0, r - 0.5).toFixed(1)}px, #000 ${(r + 0.5).toFixed(1)}px)`;
  el.style.setProperty("mask-image", g);
  el.style.setProperty("-webkit-mask-image", g);
}
