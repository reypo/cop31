// Dijital broşür (/brosur, /tr/brosur) sayfa görüntüleri: müşterinin PDF'lerinden (26 sayfa A4, vektör + gömülü yazı)
// birebir raster → AVIF/WebP, içerik özetli adlar, görüntüleyicinin manifesti.
//
//   node scripts/brosur/uret.mjs [--en <pdf>] [--tr <pdf>] [--onbellek .qa/brosur-2/raster] [--dil en,tr]
//
// PDF varsayılanı public/brosur/pdf/cop31-brosur-<dil>.<8 hex>.pdf (tek dosya olmalı). Başka yerden verilen PDF oraya
// özetli adla kopyalanır (eski kopya silinir); "PDF" düğmesi bu dosyayı indirir.
//
// 1. scripts/brosur/rasterle.py (pymupdf): her sayfa 120/240/800/1240/2480 px genişlikte kayıpsız PNG, ölçek = genişlik /
//    595,276 pt (yükseklik 170/340/1132/1754/3508; kırpma yok). İçindekiler bağlantı kutuları da oradan.
// 2. Kodlama (sharp; libaom AVIF 4:4:4, libwebp). Kalite kararları .qa/brosur-2/kalite/ taramasından (rapor: metin
//    kenarı PSNR'ı ≥ 34 dB en küçük bayt; WebP 4:2:0 renkli metin kenarında AVIF 4:4:4'ün ~2 katı hata):
//      sayfa:  800 / 1240 / 2480 AVIF q65 (ekrana sığdırma: 800 ya da 1240; yakınlaştırma: 2480)
//      yedek:  1240 WebP q80 (AVIF çözemeyen tarayıcı; yakınlaştırmada da 1240 kalır)
//      küçük:  120 AVIF q60 + WebP q75 (alt şerit), 240 AVIF q55 + WebP q75 (Tüm sayfalar ızgarası)
// 3. Adlar: public/brosur/<dil>/pNN-<genişlik>.<özet>.<avif|webp>; özet = sayfanın bütün çıktılarının SHA-256'sının
//    ilk 8 hanesi (sayfa başına tek özet: manifest küçük kalır). next.config.ts bu dizinlere kalıcı önbellek verir.
//    Aynı sayfanın eski özetli dosyaları silinir.
// 4. src/components/brosur/sayfalar.ts (ÜRETİLMİŞ): özetler, İçindekiler kutuları, PDF yolları/baytları.
//    Bayt dökümü: .qa/brosur-2/uretim.json.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";

const KOK = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const ONBELLEK = resolve(KOK, arg("--onbellek", ".qa/brosur-2/raster"));
const DILLER = arg("--dil", "en,tr").split(",");
const PDF_DIZIN = join(KOK, "public/brosur/pdf");

/** Raster genişlikleri (rasterle.py'ye) ve kodlama tablosu. Sıra özet hesabına girer: değiştirirsen adlar değişir. */
const GENISLIK = [120, 240, 800, 1240, 2480];
const KODLA = [
  { w: 120, tur: "avif", q: 60 },
  { w: 120, tur: "webp", q: 75 },
  { w: 240, tur: "avif", q: 55 },
  { w: 240, tur: "webp", q: 75 },
  { w: 800, tur: "avif", q: 65 },
  { w: 1240, tur: "avif", q: 65 },
  { w: 1240, tur: "webp", q: 80 },
  { w: 2480, tur: "avif", q: 65 },
];

function kodlayici(png, { tur, q }) {
  const s = sharp(png);
  return tur === "avif" ? s.avif({ quality: q, effort: 5, chromaSubsampling: "4:4:4" }).toBuffer() : s.webp({ quality: q, effort: 6 }).toBuffer();
}

const ozet8 = (b) => createHash("sha256").update(b).digest("hex").slice(0, 8);

function pdfBul(dil) {
  const verilen = arg(`--${dil}`);
  mkdirSync(PDF_DIZIN, { recursive: true });
  const mevcut = readdirSync(PDF_DIZIN).filter((f) => new RegExp(`^cop31-brosur-${dil}\\.[0-9a-f]{8}\\.pdf$`).test(f));
  if (!verilen) {
    if (mevcut.length !== 1) throw new Error(`${dil}: public/brosur/pdf'te tek PDF yok (${mevcut.length}); --${dil} <pdf> ver`);
    return join(PDF_DIZIN, mevcut[0]);
  }
  const ad = `cop31-brosur-${dil}.${ozet8(readFileSync(verilen))}.pdf`;
  for (const f of mevcut) if (f !== ad) rmSync(join(PDF_DIZIN, f));
  const hedef = join(PDF_DIZIN, ad);
  if (!existsSync(hedef)) copyFileSync(verilen, hedef);
  return hedef;
}

/** Eşzamanlı en çok `n` iş (sharp kendi iş parçacıklarını da kullanır). */
async function havuz(isler, n) {
  const sonuc = new Array(isler.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < isler.length) {
        const j = i++;
        sonuc[j] = await isler[j]();
      }
    }),
  );
  return sonuc;
}

const rapor = { tarih: new Date().toISOString(), diller: {} };
const manifest = { ozet: {}, icindekiler: {}, pdf: {}, sayfa: 0, boyut: {} };

for (const dil of DILLER) {
  const pdf = pdfBul(dil);
  const raster = join(ONBELLEK, dil);
  const py = spawnSync("python", ["-I", join(KOK, "scripts/brosur/rasterle.py"), pdf, raster, ...GENISLIK.map(String)], { stdio: "inherit" });
  if (py.status !== 0) throw new Error(`rasterle.py ${dil}: çıkış ${py.status}`);
  const bilgi = JSON.parse(readFileSync(join(raster, "bilgi.json"), "utf8"));
  if (manifest.sayfa && manifest.sayfa !== bilgi.sayfa) throw new Error("EN/TR sayfa sayısı farklı");
  manifest.sayfa = bilgi.sayfa;
  manifest.boyut = bilgi.boyutlar;
  const cikti = join(KOK, "public/brosur", dil);
  mkdirSync(cikti, { recursive: true });
  const t0 = performance.now();
  const sayfalar = await havuz(
    Array.from({ length: bilgi.sayfa }, (_, i) => async () => {
      const nn = String(i + 1).padStart(2, "0");
      const bufs = [];
      for (const k of KODLA) bufs.push(await kodlayici(join(raster, `p${nn}-${k.w}.png`), k));
      const h = ozet8(Buffer.concat(bufs));
      const dosyalar = KODLA.map((k, j) => ({ ad: `p${nn}-${k.w}.${h}.${k.tur}`, bayt: bufs[j].length, ...k }));
      for (const [j, d] of dosyalar.entries()) {
        const yol = join(cikti, d.ad);
        if (!existsSync(yol) || statSync(yol).size !== bufs[j].length) writeFileSync(yol, bufs[j]);
      }
      // Aynı sayfanın eski özetli çıktıları.
      const yeni = new Set(dosyalar.map((d) => d.ad));
      for (const f of readdirSync(cikti)) if (f.startsWith(`p${nn}-`) && !yeni.has(f)) rmSync(join(cikti, f));
      process.stdout.write(`${dil} p${nn} ${h}\n`);
      return { n: i + 1, ozet: h, dosyalar };
    }),
    4,
  );
  manifest.ozet[dil] = sayfalar.map((s) => s.ozet);
  manifest.icindekiler[dil] = bilgi.icindekiler;
  manifest.pdf[dil] = { yol: `/brosur/pdf/${pdf.split(/[\\/]/).pop()}`, bayt: statSync(pdf).size };
  const toplam = {};
  for (const s of sayfalar) for (const d of s.dosyalar) toplam[`${d.w}.${d.tur}`] = (toplam[`${d.w}.${d.tur}`] ?? 0) + d.bayt;
  rapor.diller[dil] = { pdf: manifest.pdf[dil], sure_sn: Math.round((performance.now() - t0) / 1000), toplam, sayfalar };
  console.log(dil, Object.fromEntries(Object.entries(toplam).map(([k, v]) => [k, `${(v / 1024).toFixed(0)} KB (ort ${(v / 1024 / bilgi.sayfa).toFixed(1)})`])));
}

const ts = `/**
 * Dijital broşür sayfa görüntülerinin manifesti. ÜRETİLMİŞ DOSYA: node scripts/brosur/uret.mjs — elle düzenleme yapma.
 * Görüntü adı: /brosur/<dil>/pNN-<genişlik>.<özet>.<avif|webp> (sayfa başına tek özet; next.config.ts kalıcı önbellek).
 */
import type { Dil } from "@/lib/dil";

export const SAYFA_SAYISI = ${manifest.sayfa};

/** Raster genişlik → yükseklik (px; PDF sayfası 595,276 × 841,89 pt, kırpma yok). */
export const RASTER: Readonly<Record<number, readonly [number, number]>> = { ${Object.entries(manifest.boyut).map(([w, [g, y]]) => `${w}: [${g}, ${y}]`).join(", ")} };

/** Sayfa başına içerik özeti (dizin 0 = sayfa 1). */
export const OZET: Record<Dil, readonly string[]> = {
${DILLER.map((d) => `  ${d}: [${manifest.ozet[d].map((h) => `"${h}"`).join(", ")}],`).join("\n")}
};

/** İçindekiler (2. sayfa) bağlantı kutuları: sayfaya oranla x, y, genişlik g, yükseklik h; p = hedef sayfa. */
export const ICINDEKILER: Record<Dil, readonly { p: number; x: number; y: number; g: number; h: number }[]> = {
${DILLER.map((d) => `  ${d}: [\n${manifest.icindekiler[d].map((k) => `    { ${Object.entries(k).map(([a, v]) => `${a}: ${v}`).join(", ")} },`).join("\n")}\n  ],`).join("\n")}
};

/** Müşterinin PDF'i ("PDF" düğmesi; yalnız tıklanınca iner). */
export const PDF: Record<Dil, { yol: string; bayt: number }> = {
${DILLER.map((d) => `  ${d}: { yol: ${JSON.stringify(manifest.pdf[d].yol)}, bayt: ${manifest.pdf[d].bayt} },`).join("\n")}
};
`;
if (DILLER.length === 2) writeFileSync(join(KOK, "src/components/brosur/sayfalar.ts"), ts);
else console.warn("Tek dil kodlandı: sayfalar.ts yazılmadı (iki dil birlikte gerekli).");
mkdirSync(join(KOK, ".qa/brosur-2"), { recursive: true });
writeFileSync(join(KOK, ".qa/brosur-2/uretim.json"), JSON.stringify(rapor, null, 1));
