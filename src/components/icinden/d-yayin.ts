/**
 * d yayını (broşür sayfa çevirme, sayaç): yayıncı rAF döngüsünden dYayinla(d, hareketli) çağırır,
 * aboneler (Brosur.tsx) d'ye göre DOM'a yazar. v2'de yayıncı IcindenSahne (d sürekli 0…9); v3'te
 * VideoSahne (yalnız broşür evrelerinde, v2 ölçeğinde: v3 durağı k ↔ d = k − 1).
 */
type Abone = (d: number, hareketli: boolean) => void;
const aboneler = new Set<Abone>();
let sonYayin: { d: number; hareketli: boolean } | null = null;

/** Abone olunca son değer hemen bir kez verilir. Dönen fonksiyon aboneliği bırakır. */
export function dAbone(cb: Abone): () => void {
  aboneler.add(cb);
  if (sonYayin) cb(sonYayin.d, sonYayin.hareketli);
  return () => {
    aboneler.delete(cb);
  };
}

export function dYayinla(d: number, hareketli: boolean): void {
  if (sonYayin && sonYayin.d === d && sonYayin.hareketli === hareketli) return;
  sonYayin = { d, hareketli };
  for (const cb of aboneler) {
    try {
      cb(d, hareketli);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.error(e);
    }
  }
}

/** Unmount/Activity: eski d yeni kuruluma sızmasın. */
export function dSifirla(): void {
  sonYayin = null;
}
