import type { Dil } from "@/lib/dil";

/**
 * İstemcide yazılan /icinden metinleri (iki dil; sözlüğün geri kalanı sunucuda, metin.ts). Küçük tutulur: istemci paketine
 * iki dil birlikte girer. Kullananlar: KadrajOkumasi (kadraj okuması, rVFC ile akar) ve KunyeSatiri (d1 künyesinin gün
 * sayacı, mount sonrası). Sayı biçimi dile göre: tr "12.100" / "2,3", en "12,100" / "2.3".
 */
export const ISTEMCI_METIN: Readonly<
  Record<Dil, { yerel: string; kadraj: string; acilisa: (n: number) => string; gun: (n: number) => string }>
> = {
  tr: {
    yerel: "tr-TR",
    kadraj: "kadraj",
    acilisa: (n) => `Açılışa ${n} gün`,
    gun: (n) => `COP31 · ${n}. gün`,
  },
  en: {
    yerel: "en-US",
    kadraj: "frame",
    acilisa: (n) => (n === 1 ? "Opens tomorrow" : `Opens in ${n} days`),
    gun: (n) => `COP31 · Day ${n}`,
  },
};
