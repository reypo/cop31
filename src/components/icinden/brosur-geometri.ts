/**
 * Broşür kutusu (1000×1000 nominal) içindeki sabit yerler (v2 derinlik.ts'ten ayrıldı; v3 VideoSahne de
 * kullanır, motor istemci paketine girmesin):
 *  sayfa: kâğıdın dikdörtgeni (A5 oranı ~0,708);
 *  slogan: kapaktaki lacivert slogan dairesi (v2: "Bugün" diskinden eşleşme kesmesi);
 *  arkaKure: arka kapaktaki küre fotoğrafı dairesi (v2: kure2 katmanı; v3: d9 → d10 dalışı, lombar).
 */
export const BROSUR_GEOMETRI = {
  sayfa: { x: 160, y: 20, w: 680, h: 960 },
  slogan: { cx: 390, cy: 620, r: 150 },
  arkaKure: { cx: 500, cy: 380, r: 180 },
} as const;
