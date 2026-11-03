"use client";

import { useSyncExternalStore } from "react";

/**
 * d1 Antalya künyesinin ikinci satırı (brief-icinden-3 §12.4-2). Sunucu (ve hidrasyon) metni manifestin SSR satırı
 * ("9–20 Kasım 2026"; content.ts cop31.dates). Mount sonrası Europe/Istanbul takvim gününe göre: açılıştan önce
 * "Açılışa N gün", 9–20 Kasım arası "COP31 · N. gün", sonrasında SSR metni kalır. Sunucuda Date kullanılmaz:
 * useSyncExternalStore sunucu anlık görüntüsü SSR metni, istemcide hidrasyondan sonra hesaplanan metin (uyarısız).
 */
/**
 * Kiosk sayfayı günlerce yenilemeden açık tutar (denetim D2-02): gün değişince satır da değişsin diye dakikada bir
 * yeniden okunur. getSnapshot metin (string) döndürdüğü için yeniden çizim yalnız metin değişince olur.
 */
const abone = (cb: () => void) => {
  const id = window.setInterval(cb, 60_000);
  return () => window.clearInterval(id);
};

/** "YYYY-AA-GG" → UTC gün numarası. */
const gunNo = (iso: string) => {
  const [y, a, g] = iso.split("-").map(Number);
  return Date.UTC(y, a - 1, g) / 864e5;
};

/** İstanbul'daki bugünün "YYYY-AA-GG"si (Intl yoksa null). */
function istanbulBugun(simdi: Date): string | null {
  try {
    const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(simdi);
    const al = (t: string) => p.find((x) => x.type === t)?.value;
    return `${al("year")}-${al("month")}-${al("day")}`;
  } catch {
    return null;
  }
}

export function kunyeMetni(metin: string, bas: string, son: string, simdi = new Date()): string {
  const bugun = istanbulBugun(simdi);
  if (!bugun) return metin;
  const g = gunNo(bugun);
  const b = gunNo(bas);
  const s = gunNo(son);
  if (![g, b, s].every(Number.isFinite)) return metin;
  if (g < b) return `Açılışa ${b - g} gün`;
  if (g <= s) return `COP31 · ${g - b + 1}. gün`;
  return metin;
}

export default function KunyeSatiri({ metin, bas, son }: { metin: string; bas: string; son: string }) {
  const s = useSyncExternalStore(
    abone,
    () => kunyeMetni(metin, bas, son),
    () => metin,
  );
  return <span className="v3-kunye-alt">{s}</span>;
}
