// /icinden v3 — metin bandı scrim doğrulaması (docs/brief-icinden-3.md §5): her durağın metin satırlarının
// altındaki render piksellerinden 4,5:1 için gereken scrim alfasını ölçer ve CSS'teki `--a` ile karşılaştırır.
//
//   node scripts/icinden/scrim-olc.mjs [--port 3100] [--kare D:/soft/cop31-varlik/render-son]
//        [--esle l4=<klasör>,p6=<klasör>] [--adim 4] [--cikti .qa/icinden3/scrim.json]
//        [--liste D:/soft/cop31-varlik/kodlama/render-son.json]
//
// Sunucu (`next start -p <port>`) açık olmalı. Her görünümde (390×844, 1280×800, 844×390) d1, d3, d4, d5, d6,
// d10'a gerçek adımlamayla (ArrowDown) gelir; bandın metin elemanlarının ekran dikdörtgenini ve rengini, bandın
// scrim rengini ve alfasını (`--a`: metin satırlarındaki en düşük değer) okur. Dikdörtgen cover dönüşümüyle video
// uzayına, oradan master'a çevrilir (dikey x·1,5+420, yatay y·1,5+kirpimY; kirpimY klip başına kodlama listesinden,
// yoksa 420 — C turu §11.2-5: l3/p3'te 200); döngünün karelerinde (`--adim`'da bir,
// brief: "döngülerde en parlak kare") metin açık renkse en parlak %5, koyuysa en koyu %5 pikselin ortalaması ve
// tek en kötü piksel için gereken α bulunur (sRGB'de karışım, WCAG göreli parlaklık). Kare boyutu serbest
// (960² önizleme ya da 1920² son render; 16 bit PNG sharp ile 8 bite iner).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import sharp from "sharp";
import { chromium } from "playwright-core";
import { dizi } from "./fragman.mjs";

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const PORT = arg("--port", "3100");
const KARE = resolve(arg("--kare", "D:/soft/cop31-varlik/render-son"));
const ADIM = Number(arg("--adim", "4"));
const CIKTI = resolve(arg("--cikti", ".qa/icinden3/scrim.json"));
const ESLE = Object.fromEntries(
  arg("--esle", "")
    .split(",")
    .filter(Boolean)
    .map((s) => [s.slice(0, s.indexOf("=")), resolve(s.slice(s.indexOf("=") + 1))]),
);
const DURAKLAR = { 1: "l1", 3: "l3", 4: "l4", 5: "l5", 6: "p6", 10: "l1" };
/** Yatay kırpımın y ofseti (master px), klip başına: kodla.mjs'in yazdığı listeden (`kirpimY`; döngü/poster sabit). */
const LISTE = arg("--liste", "D:/soft/cop31-varlik/kodlama/render-son.json");
const KIRPIM_Y = {};
try {
  for (const s of JSON.parse(readFileSync(LISTE, "utf8")))
    if (s.boyut === "yatay" && typeof s.kirpimY === "number") KIRPIM_Y[s.klip] = s.kirpimY;
} catch {
  console.warn(`liste okunamadı (${LISTE}): yatay kırpım 420 varsayılır`);
}
const kirpimY = (klip) => KIRPIM_Y[klip] ?? 420;
const GORUNUMLER = {
  m: { viewport: { width: 390, height: 844 }, dpr: 2, touch: true },
  D: { viewport: { width: 1280, height: 800 }, dpr: 1, touch: false },
  yt: { viewport: { width: 844, height: 390 }, dpr: 2, touch: true },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- renk ---------------- */
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = ([r, g, b]) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
const oran = (a, b) => {
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** Metin T, scrim S (α), altta P: 4,5:1 için en küçük α (sRGB'de karışım). */
function gerekenAlfa(T, S, P, hedef = 4.5) {
  const B = (a) => P.map((p, i) => a * S[i] + (1 - a) * p);
  if (oran(T, B(0)) >= hedef) return 0;
  if (oran(T, B(1)) < hedef) return NaN; // scrim rengi bile yetmiyor
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (oran(T, B(m)) >= hedef) hi = m;
    else lo = m;
  }
  return hi;
}
const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);

/* ---------------- kareler ---------------- */
const kareOnbellek = new Map();
async function kareler(klip) {
  if (kareOnbellek.has(klip)) return kareOnbellek.get(klip);
  const d = dizi(ESLE[klip] ?? join(KARE, klip));
  if (!d) throw new Error(`kare yok: ${klip}`);
  const yollar = [];
  for (let n = d.bas; n < d.bas + d.kare; n += ADIM) yollar.push(join(d.dizin, `k_${String(n).padStart(4, "0")}.png`));
  const veri = [];
  for (const y of yollar) {
    const { data, info } = await sharp(y).removeAlpha().toColourspace("srgb").raw({ depth: "uchar" }).toBuffer({ resolveWithObject: true });
    veri.push({ data, w: info.width, h: info.height, yol: y });
  }
  kareOnbellek.set(klip, veri);
  return veri;
}
/** Master dikdörtgendeki pikseller (kare ölçeğine göre); açık metin için en parlak, koyu için en koyu uç. */
function uc(kare, [x0, y0, x1, y1], acikMetin) {
  const k = kare.w / 1920;
  const X0 = Math.max(0, Math.floor(x0 * k));
  const Y0 = Math.max(0, Math.floor(y0 * k));
  const X1 = Math.min(kare.w, Math.ceil(x1 * k));
  const Y1 = Math.min(kare.h, Math.ceil(y1 * k));
  const p = [];
  for (let y = Y0; y < Y1; y++)
    for (let x = X0; x < X1; x++) {
      const i = (y * kare.w + x) * 3;
      const c = [kare.data[i], kare.data[i + 1], kare.data[i + 2]];
      p.push([L(c), c]);
    }
  if (!p.length) return null;
  p.sort((a, b) => (acikMetin ? b[0] - a[0] : a[0] - b[0]));
  const n = Math.max(1, Math.round(p.length * 0.05));
  const ort = [0, 1, 2].map((i) => p.slice(0, n).reduce((s, q) => s + q[1][i], 0) / n);
  return { yuzde5: ort, enKotu: p[0][1], piksel: p.length };
}

/* ---------------- tarayıcı ---------------- */
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const sonuc = [];
for (const [ad, vp] of Object.entries(GORUNUMLER)) {
  const ctx = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: vp.dpr, isMobile: vp.touch, hasTouch: vp.touch, locale: "tr-TR" });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/icinden`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__icinden3, null, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await sleep(1500);
  for (let k = 1; k <= 10; k++) {
    await page.keyboard.press("ArrowDown");
    await sleep(150);
    await page.waitForFunction(() => window.__icinden3.faz() === "dur", null, { timeout: 15000 }).catch(() => {});
    if (!DURAKLAR[k]) continue;
    await sleep(500);
    const olcu = await page.evaluate((k) => {
      const sahne = document.querySelector(".v3-sahne");
      const W = sahne.clientWidth;
      const H = sahne.clientHeight;
      const boyut = window.__icinden3.boyut();
      const [g, y] = boyut === "dikey" ? [720, 1280] : [1280, 720];
      const s = Math.max(W / g, H / y);
      const ox = (W - g * s) / 2;
      const oy = (H - y * s) / 2;
      const satirlar = [];
      for (const bant of document.querySelectorAll(`.v3-bant[data-d="${k}"]:not(.v3-acilis)`)) {
        const cs = getComputedStyle(bant);
        const scrim = cs.getPropertyValue("--scrim").trim().split(/\s+/).map(Number);
        const a = Number(cs.getPropertyValue("--a"));
        for (const el of bant.querySelectorAll(".v3-bant-ic > *, .v3-bant-ic li")) {
          if (el.matches("ol, ul")) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) continue;
          satirlar.push({ sinif: el.className || el.tagName, renk: getComputedStyle(el).color, r: [r.left, r.top, r.right, r.bottom], scrim, a, tema: [...bant.classList].find((c) => c.startsWith("v3-tema-")) });
        }
      }
      return { boyut, s, ox, oy, satirlar };
    }, k);
    const klip = DURAKLAR[k];
    const kr = await kareler(klip);
    for (const st of olcu.satirlar) {
      const v = [(st.r[0] - olcu.ox) / olcu.s, (st.r[1] - olcu.oy) / olcu.s, (st.r[2] - olcu.ox) / olcu.s, (st.r[3] - olcu.oy) / olcu.s];
      const ky = kirpimY(klip);
      const m = olcu.boyut === "dikey" ? [v[0] * 1.5 + 420, v[1] * 1.5, v[2] * 1.5 + 420, v[3] * 1.5] : [v[0] * 1.5, v[1] * 1.5 + ky, v[2] * 1.5, v[3] * 1.5 + ky];
      const T = rgb(st.renk);
      const acik = L(T) > L(st.scrim);
      let en5 = { a: -1 };
      let enPx = { a: -1 };
      for (const kare of kr) {
        const u = uc(kare, m, acik);
        if (!u) continue;
        const a5 = gerekenAlfa(T, st.scrim, u.yuzde5);
        const ap = gerekenAlfa(T, st.scrim, u.enKotu);
        if (a5 > en5.a) en5 = { a: a5, renk: u.yuzde5.map(Math.round), kare: kare.yol.slice(-10) };
        if (ap > enPx.a) enPx = { a: ap, renk: u.enKotu };
      }
      sonuc.push({
        gorunum: ad,
        durak: `d${k}`,
        klip,
        tema: st.tema?.replace("v3-tema-", ""),
        satir: String(st.sinif).split(" ")[0],
        metin: st.renk,
        css_a: st.a,
        gereken_a_yuzde5: +en5.a.toFixed(3),
        yuzde5_renk: en5.renk,
        kare: en5.kare,
        gereken_a_tek_piksel: +enPx.a.toFixed(3),
        tamam: en5.a <= st.a + 1e-6,
      });
    }
  }
  await ctx.close();
}
await browser.close();
mkdirSync(dirname(CIKTI), { recursive: true });
writeFileSync(CIKTI, JSON.stringify(sonuc, null, 1));
// Özet: durak × tema başına en kötü
const ozet = {};
for (const r of sonuc) {
  const a = `${r.gorunum} ${r.durak} ${r.tema}`;
  if (!ozet[a] || r.gereken_a_yuzde5 > ozet[a].gereken_a_yuzde5) ozet[a] = r;
}
for (const r of Object.values(ozet))
  console.log(`${r.tamam ? "✓" : "✗"} ${r.gorunum.padEnd(2)} ${r.durak.padEnd(3)} ${String(r.tema).padEnd(5)} css α ${r.css_a.toFixed(2)} · gereken (en kötü %5) ${r.gereken_a_yuzde5.toFixed(3)} [${r.satir}, ${r.yuzde5_renk}] · tek piksel ${r.gereken_a_tek_piksel.toFixed(3)}`);
console.log(`→ ${CIKTI}${existsSync(CIKTI) ? "" : " (yazılamadı)"}`);
