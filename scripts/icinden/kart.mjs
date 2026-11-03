// Ana sayfa /icinden kartının görseli: gerçek render posterinden kırpım (WebP, ≤ 60 KB).
//
//   node scripts/icinden/kart.mjs [--kare D:/soft/cop31-varlik/render-son/l1/k_0000.png]
//        [--kutu 0,600,1920,960] [--cikti public/icinden/kart-icinden.webp] [--genislik 1200] [--sinir 61440]
//
// Kutu master px'tir (x, y, genişlik, yükseklik; 1920² master). Kare 960² önizlemeyse oranla ölçeklenir.
// Varsayılan kutu p1 (Dünya, l1 0. karesi): üstte Avrupa/Akdeniz, ortada Antalya ve terminatör, 2:1. Kart
// mobilde 2:1, geniş ekranda 3:1 (`object-fit: cover`, ortadan kırpılır). Kalite 82'den başlayıp sınırın altına
// inene dek düşürülür. Görsel src/app/page.tsx'te statik içe aktarılır (adı içerik özetli /_next/static/media/).
import { mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const KARE = resolve(arg("--kare", "D:/soft/cop31-varlik/render-son/l1/k_0000.png"));
const KUTU = arg("--kutu", "0,600,1920,960").split(",").map(Number);
const CIKTI = resolve(arg("--cikti", "public/icinden/kart-icinden.webp"));
const GEN = Number(arg("--genislik", "1200"));
const SINIR = Number(arg("--sinir", String(60 * 1024)));

const meta = await sharp(KARE).metadata();
const k = meta.width / 1920;
const [x, y, w, h] = KUTU.map((v) => Math.round(v * k));
mkdirSync(dirname(CIKTI), { recursive: true });
let q = 82;
for (;;) {
  await sharp(KARE)
    .extract({ left: x, top: y, width: w, height: h })
    .resize({ width: GEN, kernel: "lanczos3" })
    .toColourspace("srgb")
    .webp({ quality: q, effort: 6, smartSubsample: true })
    .toFile(CIKTI);
  const b = statSync(CIKTI).size;
  if (b <= SINIR || q <= 40) {
    console.log(`${CIKTI}: ${GEN}×${Math.round((GEN * h) / w)}, q ${q}, ${(b / 1024).toFixed(1)} KB (kaynak ${meta.width}² ${meta.depth}, kutu ${KUTU.join(",")})`);
    break;
  }
  q -= 4;
}
