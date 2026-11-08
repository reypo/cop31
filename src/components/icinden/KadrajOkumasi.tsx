import type { Dil } from "@/lib/dil";
import { ISTEMCI_METIN } from "./metin-istemci";

/**
 * Kadraj okuması (brief-icinden-3 §5): sağ üst, Montserrat 500 tabular, düz metin. Tek gösterge: ölçek ("kadraj ~12.100 km"
 * → "~2,3 km" → "~19 m" → fidanda "~54 cm"; İngilizcede "frame ~12,100 km", "~2.3 km"), ya da durağın sabit adı (manifest
 * `okumaDurak`, sunucuda dile çevrilir: "arka duvar · ~3 m" / "back wall · ~3 m"). Klip boyunca Blender'ın `kadraj_m[kare]`
 * değeri rVFC ile akar (fidan içi geri adımın poster sönmesinde zamana bağlı). React state YOK: VideoSahne `okumaYaz()` ile
 * yalnız değişince `textContent` yazar. Yerleşim: sağ üst kümede (`.v3-ust`) dil seçici ve "Dijital broşür →" düğmesinin solu.
 */
export default function KadrajOkumasi() {
  return <p data-v3-kadraj aria-hidden="true" className="v3-kadraj" />;
}

/** Okuma değerini (metre ya da sabit metin) yaz; aynı metin yeniden yazılmaz. */
export function okumaYaz(el: HTMLElement | null, deger: number | string | null | undefined, dil: Dil) {
  if (!el) return;
  const metin = deger == null || deger === "" ? "" : typeof deger === "number" ? kadrajMetni(deger, dil) : deger;
  if (el.textContent !== metin) el.textContent = metin;
}

/** Kadraj okuması (istemcide; klipler.ts'i, dolayısıyla manifest JSON'unu istemci paketine çekmemek için burada). */
export function kadrajMetni(m: number, dil: Dil): string {
  const { yerel, kadraj } = ISTEMCI_METIN[dil];
  const bic = (v: number, b = 0) => v.toLocaleString(yerel, { maximumFractionDigits: b });
  const yuvarla = (v: number) => {
    if (v >= 1000) return bic(Math.round(v / 100) * 100);
    if (v >= 100) return bic(Math.round(v / 10) * 10);
    if (v >= 10) return bic(Math.round(v));
    return bic(Math.round(v * 10) / 10, 1);
  };
  if (m >= 1000) return `${kadraj} ~${yuvarla(m / 1000)} km`;
  if (m >= 1) return `${kadraj} ~${yuvarla(m)} m`;
  return `${kadraj} ~${bic(Math.round(m * 100))} cm`;
}
