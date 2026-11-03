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

/**
 * Broşür durakları arası DOM geçiş süreleri (ms; brief-icinden-3 §12.4-5). VideoSahne tween'i bu sürede d'yi doğrusal
 * yayınlar; Brosur çizelgesi aynı süreleri saniye → d kesrine çevirir. `duz`: `?brosur=duz` yedeği (eski scaleX çevirme).
 */
export const BROSUR_MS = { kapakSayfa: 2000, sayfaArka: 1800, duz: 1600 } as const;

/** `?brosur=duz`: eski scaleX çevirme, hayaletsiz (risk 7 geri dönüşü). Yalnız istemcide; sunucuda false. */
export function brosurDuzMu(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("brosur") === "duz";
  } catch {
    return false;
  }
}

/**
 * Broşür girişi (son duvar → kapak FLIP'i, 420 ms) ilerlemesi: VideoSahne yayınlar (e 0 → 1; geri FLIP'te 1 → 0;
 * durakta 1, ısınmada 0), Brosur kâğıda eğim ve gölge olarak yazar. d yayınından ayrı kanal: FLIP boyunca d sabit
 * (kapak durağı) ve d-yayin.ts'in sözleşmesi değişmesin.
 */
type GirisAbone = (e: number) => void;
const girisAboneler = new Set<GirisAbone>();
let sonGiris = 1;

export function brosurGirisYayinla(e: number): void {
  if (e === sonGiris) return;
  sonGiris = e;
  for (const cb of girisAboneler) cb(e);
}

/** Abone olunca son değer hemen verilir. Dönen fonksiyon aboneliği bırakır. */
export function brosurGirisAbone(cb: GirisAbone): () => void {
  girisAboneler.add(cb);
  cb(sonGiris);
  return () => {
    girisAboneler.delete(cb);
  };
}
