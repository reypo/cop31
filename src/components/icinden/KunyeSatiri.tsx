"use client";

import { useSyncExternalStore } from "react";
import type { Dil } from "@/lib/dil";
import { ISTEMCI_METIN } from "./metin-istemci";

/**
 * d1 Antalya künyesinin ikinci satırı (brief-icinden-3 §12.4-2). Sunucu (ve hidrasyon) metni manifestin SSR satırı
 * ("9–20 Kasım 2026"; content.ts cop31.dates). Mount sonrası Europe/Istanbul takvim gününe göre: açılıştan önce
 * "Açılışa N gün" / "Opens in N days", 9–20 Kasım arası "COP31 · N. gün" / "COP31 · Day N", sonrasında SSR metni kalır. Sunucuda Date kullanılmaz:
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

export function kunyeMetni(metin: string, bas: string, son: string, dil: Dil, simdi = new Date()): string {
  const bugun = istanbulBugun(simdi);
  if (!bugun) return metin;
  const g = gunNo(bugun);
  const b = gunNo(bas);
  const s = gunNo(son);
  if (![g, b, s].every(Number.isFinite)) return metin;
  const M = ISTEMCI_METIN[dil];
  if (g < b) return M.acilisa(b - g);
  if (g <= s) return M.gun(g - b + 1);
  return metin;
}

/** metin: SSR satırı (dile göre, sözlükten: "9–20 Kasım 2026" / "November 9–20, 2026"); sayaç metni metin-istemci.ts'ten. */
export default function KunyeSatiri({ metin, bas, son, dil }: { metin: string; bas: string; son: string; dil: Dil }) {
  const s = useSyncExternalStore(
    abone,
    () => kunyeMetni(metin, bas, son, dil),
    () => metin,
  );
  return <span className="v3-kunye-alt">{s}</span>;
}
