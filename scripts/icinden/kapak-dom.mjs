// /icinden v3 — d6 broşür kapağının DOM hâlinin ekran görüntüsü (S2'nin banko broşürü dokusu; R3 d5 (a)).
//
//   node scripts/icinden/kapak-dom.mjs [--cikti D:/soft/cop31-varlik/s2/doku] [--port 3100] [--genislik 1600]
//
// Kendi sunucusunu açar (`next start -p 3100`, mevcut .next derlemesi; :3000'deki geliştirme sunucusuna
// dokunmaz), /icinden'i gerçek adımlamayla (ArrowDown) d6'ya getirir: kapak Brosur v2 KapakIcerik'i, görsel
// kapıları açık, AK Parti / GK logoları görünür (v3'te LOGO_D yazılmaz, d6'da açık). Sonra yalnız broşür
// kalır: kutu kâğıt (0, 0)'a ötelenir, gölge/köşe yuvarlatması kaldırılır, yörünge yayları dönüşün 0°'sinde
// (d6 varış karesi). Kırpım = kâğıt dikdörtgeni (680 × 960 nominal, oran 0,7083), deviceScaleFactor =
// genislik / 680 → gerçek piksel. Çıktılar: kapak-dom.png (d6'daki gibi, sırt gölgesi dahil),
// kapak-dom-sirtsiz.png (sol kenardaki 18 birimlik sırt gradyanı yok), kapak-dom.json.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright-core";

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const CIKTI = resolve(arg("--cikti", "D:/soft/cop31-varlik/s2/doku"));
const PORT = Number(arg("--port", "3100"));
const GENISLIK = Number(arg("--genislik", "1600"));
const KAGIT = { x: 160, y: 20, w: 680, h: 960 }; // brosur-geometri.ts BROSUR_GEOMETRI.sayfa
const DSF = GENISLIK / KAGIT.w;
const URL = `http://localhost:${PORT}/icinden`;

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function sunucuHazir(sinir = 90_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < sinir) {
    try {
      const r = await fetch(URL);
      if (r.ok) return;
    } catch {}
    await bekle(500);
  }
  throw new Error("sunucu açılmadı: " + URL);
}

mkdirSync(CIKTI, { recursive: true });
const sunucu = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], {
  cwd: resolve(import.meta.dirname, "../.."),
  stdio: ["ignore", "pipe", "pipe"],
});
sunucu.stdout.on("data", (b) => process.stdout.write("[next] " + b));
sunucu.stderr.on("data", (b) => process.stderr.write("[next] " + b));
const kapat = () => {
  if (sunucu.exitCode === null) spawnSync("taskkill", ["/PID", String(sunucu.pid), "/T", "/F"], { stdio: "ignore" });
};
process.on("exit", kapat);

let tarayici;
try {
  await sunucuHazir();
  tarayici = await chromium.launch({ channel: "chrome", headless: true, args: ["--force-color-profile=srgb", "--autoplay-policy=no-user-gesture-required"] });
  const bag = await tarayici.newContext({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: DSF, reducedMotion: "no-preference" });
  const sayfa = await bag.newPage();
  sayfa.on("pageerror", (e) => console.error("[sayfa hata]", e.message));
  await sayfa.goto(URL, { waitUntil: "load" });
  await sayfa.evaluate(() => document.fonts.ready);

  const durak = () => sayfa.evaluate(() => {
    const k = document.querySelector(".v3");
    return { d: k?.dataset.durak, faz: k?.dataset.faz };
  });
  await bekle(800);
  for (let hedef = 1; hedef <= 6; hedef++) {
    await sayfa.keyboard.press("ArrowDown");
    const t0 = Date.now();
    for (;;) {
      const s = await durak();
      if (s.d === String(hedef) && s.faz === "dur") break;
      if (Date.now() - t0 > 20_000) throw new Error(`d${hedef}'e varılamadı: ${JSON.stringify(s)}`);
      await bekle(100);
    }
    console.log(`d${hedef} (${Date.now() - t0} ms)`);
    await bekle(400);
  }

  // Kapağın görselleri (küre fotoğrafı + 2 logo) ve fontlar yüklenmiş olmalı.
  await sayfa.waitForFunction(() => {
    const im = [...document.querySelectorAll(".v3-brosur .ic-br-sayfa-kapak img")];
    return im.length >= 3 && im.every((i) => i.complete && i.naturalWidth > 0);
  }, null, { timeout: 30_000 });
  await sayfa.evaluate(() => document.fonts.ready);
  const fontlar = await sayfa.evaluate(() => {
    const k = document.querySelector(".ic-br-sayfa-kapak");
    const cs = getComputedStyle(k);
    const slogan = getComputedStyle(k.querySelector(".ic-br-slogan"));
    const yuklu = [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight}`);
    return {
      govde: cs.fontFamily,
      slogan: slogan.fontFamily,
      kontrol900: document.fonts.check(`900 60px ${cs.fontFamily}`),
      kontrolSlogan: document.fonts.check(`40px ${slogan.fontFamily}`),
      yuklu: [...new Set(yuklu)],
    };
  });
  console.log("fontlar", JSON.stringify(fontlar));

  // Yalnız broşür: kutu kâğıdı (0, 0)'a getirir; gölge, köşe ve yörünge dönüşü yok; başka her şey gizli.
  await sayfa.addStyleTag({
    content: `
      html, body { background: #fff !important; }
      body * { visibility: hidden !important; }
      .v3-brosur, .v3-brosur .ic-br-kagit, .v3-brosur .ic-br-sayfa-kapak, .v3-brosur .ic-br-sayfa-kapak * { visibility: visible !important; }
      .v3-brosur .ic-br-sayfa-kapak .ic-br-sanat [data-ic-d], .v3-brosur .ic-br-logolar { opacity: 1 !important; }
      .v3-brosur { position: fixed !important; inset: 0 !important; z-index: 2147483647 !important; opacity: 1 !important;
                   mask: none !important; -webkit-mask: none !important; clip-path: none !important; }
      .v3-brosur-kutu { transform: translate(${-KAGIT.x}px, ${-KAGIT.y}px) !important; }
      .v3-brosur .ic-br-kagit { box-shadow: none !important; border-radius: 0 !important; opacity: 1 !important; }
      .v3-brosur .ic-br-sayfa-kapak { border-radius: 0 !important; transform: none !important; }
      .v3-brosur .ic-br-kivrim { opacity: 0 !important; }
      .ic-br-yorunge { animation: none !important; transform: none !important; }
    `,
  });
  await bekle(600);
  const kutu = await sayfa.evaluate(() => {
    const r = document.querySelector(".v3-brosur .ic-br-sayfa-kapak").getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  console.log("kapak dikdörtgeni (CSS px)", JSON.stringify(kutu), "DSF", DSF);
  if (Math.abs(kutu.x) > 0.01 || Math.abs(kutu.y) > 0.01 || Math.abs(kutu.w - KAGIT.w) > 0.01 || Math.abs(kutu.h - KAGIT.h) > 0.01)
    throw new Error("kapak (0, 0, 680, 960)'da değil: " + JSON.stringify(kutu));

  const kirp = { x: 0, y: 0, width: KAGIT.w, height: KAGIT.h };
  const png = join(CIKTI, "kapak-dom.png");
  await sayfa.screenshot({ path: png, clip: kirp, scale: "device", animations: "disabled", type: "png" });
  await sayfa.addStyleTag({ content: `.v3-brosur .ic-br-sirt { display: none !important; }` });
  await bekle(200);
  const pngS = join(CIKTI, "kapak-dom-sirtsiz.png");
  await sayfa.screenshot({ path: pngS, clip: kirp, scale: "device", animations: "disabled", type: "png" });

  const surum = await tarayici.version();
  const boyut = (f) => {
    const b = readFileSync(f);
    return [b.readUInt32BE(16), b.readUInt32BE(20)];
  };
  const [g, y] = boyut(png);
  writeFileSync(
    join(CIKTI, "kapak-dom.json"),
    JSON.stringify(
      {
        px: [g, y],
        oran: +(g / y).toFixed(4),
        oran_nominal: +(KAGIT.w / KAGIT.h).toFixed(4),
        mm: [149, 210],
        mm_not: "varsayım (A5 kesim 148 × 210 değil; oran 149/210 = 0,7095, nominal kâğıt 680/960 = 0,7083)",
        nominal: { w: KAGIT.w, h: KAGIT.h, birim: "BROSUR_GEOMETRI.sayfa, --u = 1px" },
        dsf: DSF,
        kaynak: "src/components/icinden/Brosur.tsx KapakIcerik (v2 kapak; katmanda, /icinden v3 d6 durağı) + icinden.css .ic-br-*",
        dosyalar: { "kapak-dom.png": "d6'daki gibi (soldaki sırt gradyanı dahil)", "kapak-dom-sirtsiz.png": "sırt gradyanı yok (.ic-br-sirt gizli)", "boyut": boyut(pngS) },
        farklar_d6: "gölge (+6, +10, 24 px) ve 6 birimlik köşe yuvarlatması yok; yörünge yayları 0° (d6 varış karesi, 60 s/tur dönüş durdurulmuş)",
        fontlar: { govde: fontlar.govde, slogan: fontlar.slogan, yuklu: fontlar.yuklu, kontrol: [fontlar.kontrol900, fontlar.kontrolSlogan] },
        renk: "sRGB (Chrome --force-color-profile=srgb), PNG 8 bit RGB(A)",
        uretici: "scripts/icinden/kapak-dom.mjs",
        tarayici: `Chrome ${surum} (playwright-core, headless)`,
        url: URL,
        tarih: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );
  console.log("yazıldı", png, pngS);
} finally {
  await tarayici?.close().catch(() => {});
  kapat();
}
