/**
 * Kadraj okuması (brief-icinden-3 §5): sağ üst, 16 px içeride, Montserrat 500 tabular, düz metin. Tek
 * gösterge: ölçek ("kadraj ~12.100 km" → "~2,3 km" → "~19 m"), sonra durak adı ("sayfa 1/12" … "ortak
 * evimiz"). Klip boyunca Blender'ın `kadraj_m[kare]` değeri rVFC ile akar. React state YOK: VideoSahne
 * `okumaYaz()` ile yalnız değişince `textContent` yazar.
 */
export default function KadrajOkumasi() {
  return <p data-v3-kadraj aria-hidden="true" className="v3-kadraj" />;
}

/** Okuma değerini (metre ya da sabit metin) yaz; aynı metin yeniden yazılmaz. */
export function okumaYaz(el: HTMLElement | null, deger: number | string | null | undefined) {
  if (!el) return;
  const metin = deger == null || deger === "" ? "" : typeof deger === "number" ? kadrajMetni(deger) : deger;
  if (el.textContent !== metin) el.textContent = metin;
}

/**
 * Broşür sayfa okuması ("sayfa 8/12"; manifestteki okumaDurak metinleriyle aynı biçim). Sayfa çevirmede Brosur, hayalet
 * sayfalar geçerken ara numaraları bununla yazar (§12.4-6: 2…7 → 8; 9…11 → 12); varışta VideoSahne durağın metnini yazar.
 */
export const BROSUR_SAYFA_SAYISI = 12;
export const sayfaOkumasi = (n: number) => `sayfa ${n}/${BROSUR_SAYFA_SAYISI}`;

/** Kadraj okuması (istemcide; klipler.ts'i, dolayısıyla manifest JSON'unu istemci paketine çekmemek için burada): "kadraj ~12.100 km", "~2,3 km", "~19 m", "~14 cm". */
export function kadrajMetni(m: number): string {
  const tr = (v: number, b = 0) => v.toLocaleString("tr-TR", { maximumFractionDigits: b });
  const yuvarla = (v: number) => {
    if (v >= 1000) return tr(Math.round(v / 100) * 100);
    if (v >= 100) return tr(Math.round(v / 10) * 10);
    if (v >= 10) return tr(Math.round(v));
    return tr(Math.round(v * 10) / 10, 1);
  };
  if (m >= 1000) return `kadraj ~${yuvarla(m / 1000)} km`;
  if (m >= 1) return `kadraj ~${yuvarla(m)} m`;
  return `kadraj ~${tr(Math.round(m * 100))} cm`;
}
