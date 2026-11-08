// Dijital broşür ölçümleri (Chrome, playwright-core; çıktılar .qa/brosur-2/):
//
//   node scripts/brosur/olc.mjs [--port 3141] [--birebir] [--bayt] [--akicilik]   (bayrak yoksa hepsi)
//
// Sunucu: COP_DIST=.next-a npx next build && COP_DIST=.next-a npx next start -p 3141 (prod; sıkıştırma açık).
//
// --birebir  Ekranda gösterilen sayfanın ekran görüntüsü (aygıt pikseli) + kutusu → birebir/olcum.json;
//            scripts/brosur/birebir.py aynı boyutta PDF raster'ıyla karşılaştırır (ortalama mutlak fark, kayma, kırpma).
// --bayt     Soğuk önbellekle aktarılan bayt (CDP encodedDataLength, başlıklar dahil): ilk açılış, bütün sayfaları
//            gezince toplam, bir sayfa yakınlaştırma; EN ve TR, telefon (390×844 @3) ve masaüstü (1280×800 @1).
// --akicilik 4× CPU yavaşlatmada 8 çevirme: Chrome performans izi (DrawFrame aralıkları > 50 ms), sayfa içi
//            long-animation-frame (> 50 ms) ve rAF aralıkları; telefon (tek sayfa) ve masaüstü (yayılım).
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright-core";

const KOK = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const PORT = argv.includes("--port") ? argv[argv.indexOf("--port") + 1] : "3141";
const B = `http://localhost:${PORT}`;
const Q = join(KOK, ".qa/brosur-2");
const hepsi = !["--birebir", "--bayt", "--akicilik"].some((k) => argv.includes(k));
const ister = (k) => hepsi || argv.includes(k);
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(join(Q, "birebir"), { recursive: true });

const PROFIL = {
  tel: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  "tel-yatay": { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  "masa-1280": { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  "masa-1920": { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
};

const tarayici = await chromium.launch({ channel: "chrome" });

/** Görünen sayfa görüntüleri yüklenip çözülene ve çevirme bitene dek bekle. */
async function sakin(p) {
  await p.waitForFunction(
    () => {
      const k = document.querySelector("[data-kitap]");
      if (!k?.dataset.ilk) return false;
      const y = document.querySelector("[data-yaprak]");
      if (y && !y.hidden) return false;
      const imgs = [...document.querySelectorAll(".bro-yuva")].filter((v) => v.dataset.p && v.offsetWidth > 0).map((v) => v.querySelector(".bro-taban"));
      return imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0);
    },
    null,
    { timeout: 30000 },
  );
  await p.evaluate(() => Promise.all([...document.querySelectorAll(".bro-taban[src]")].map((i) => i.decode().catch(() => {}))));
  await bekle(250);
}

// ————— (a) birebir —————
if (ister("--birebir")) {
  const kayit = [];
  const plan = [
    ["tel", "en", [1, 2, 13, 19, 26]],
    ["tel", "tr", [2, 13]],
    ["tel-yatay", "en", [1, 2, 13]],
    ["masa-1280", "en", [1, 2, 12, 26]],
    ["masa-1920", "en", [1, 2, 12, 18, 26]],
    ["masa-1920", "tr", [2, 12]],
  ];
  for (const [ad, dil, sayfalar] of plan) {
    const c = await tarayici.newContext(PROFIL[ad]);
    for (const n of sayfalar) {
      const p = await c.newPage();
      await p.goto(`${B}${dil === "tr" ? "/tr" : ""}/brosur#p=${n}`, { waitUntil: "load" });
      await sakin(p);
      const bilgi = await p.evaluate(() => {
        const sahne = document.querySelector("[data-bro-sahne]").getBoundingClientRect();
        return {
          sahne: sahne.toJSON(),
          vp: [innerWidth, innerHeight],
          tasma: document.documentElement.scrollWidth > innerWidth,
          sayfalar: [...document.querySelectorAll(".bro-yuva")]
            .filter((v) => v.dataset.p && v.offsetWidth > 0)
            .map((v) => {
              const i = v.querySelector(".bro-taban");
              return { p: Number(v.dataset.p), yan: v.dataset.yuva, kutu: v.getBoundingClientRect().toJSON(), img: i.getBoundingClientRect().toJSON(), src: i.currentSrc.split("/").pop(), dogal: [i.naturalWidth, i.naturalHeight], sigdir: getComputedStyle(i).objectFit };
            }),
        };
      });
      const png = join(Q, "birebir", `${ad}-${dil}-p${String(n).padStart(2, "0")}.png`);
      await p.screenshot({ path: png });
      kayit.push({ ad, dil, n, dpr: PROFIL[ad].deviceScaleFactor, png, ...bilgi });
      await p.close();
    }
    await c.close();
  }
  writeFileSync(join(Q, "birebir", "olcum.json"), JSON.stringify(kayit, null, 1));
  const py = spawnSync("python", ["-I", join(KOK, "scripts/brosur/birebir.py"), join(Q, "birebir", "olcum.json")], { stdio: "inherit" });
  if (py.status !== 0) console.error("birebir.py hata", py.status);
}

// ————— (b) bayt —————
function tur(u, mime) {
  if (/\/brosur\/(en|tr)\/p\d\d-(800|1240|2480)\./.test(u)) return /-2480\./.test(u) ? "sayfa-2480" : "sayfa";
  if (/\/brosur\/(en|tr)\/p\d\d-(120|240)\./.test(u)) return "kucuk";
  if (/\.woff2?(\?|$)/.test(u) || mime?.includes("font")) return "yazi";
  if (/\.css(\?|$)/.test(u) || mime?.includes("css")) return "css";
  if (/\.js(\?|$)/.test(u) || mime?.includes("javascript")) return "js";
  if (mime?.includes("html")) return "html";
  return "diger";
}

async function baytOturum(ad, dil) {
  const c = await tarayici.newContext(PROFIL[ad]);
  const p = await c.newPage();
  const cdp = await c.newCDPSession(p);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
  const istek = new Map();
  let evre = "ilk";
  cdp.on("Network.requestWillBeSent", (e) => istek.set(e.requestId, { url: e.request.url.replace(B, ""), evre }));
  cdp.on("Network.responseReceived", (e) => {
    const r = istek.get(e.requestId);
    if (r) Object.assign(r, { mime: e.response.mimeType, durum: e.response.status, onbellek: e.response.fromDiskCache || e.response.fromServiceWorker });
  });
  cdp.on("Network.loadingFinished", (e) => {
    const r = istek.get(e.requestId);
    if (r) r.bayt = e.encodedDataLength;
  });
  const dokun = (tip, nokta) => cdp.send("Input.dispatchTouchEvent", { type: tip, touchPoints: nokta.map(([x, y], i) => ({ x, y, id: i })) });
  const yol = `${dil === "tr" ? "/tr" : ""}/brosur`;
  await p.goto(B + yol, { waitUntil: "load" });
  await sakin(p);
  // İlk görünen sayfa çözüldü; ön yükleme ve küçük resimler için ağ sussun.
  await p.waitForLoadState("networkidle");
  await bekle(1200);
  const gorunenIlk = await p.evaluate(() => [...document.querySelectorAll(".bro-taban[src]")].map((i) => i.currentSrc.replace(location.origin, "")));
  evre = "gezinti";
  const n = 26;
  for (let i = 0; i < n; i++) {
    const son = await p.evaluate(() => {
      const k = document.querySelector("[data-kitap]");
      return Number(k.dataset.sag || k.dataset.sol);
    });
    if (son >= n || (await p.evaluate(() => !document.querySelector("[data-kitap]").dataset.sag))) break;
    await p.keyboard.press("ArrowRight");
    await bekle(150);
    await sakin(p);
  }
  await p.waitForLoadState("networkidle");
  await bekle(800);
  // Yakınlaştırma: 3. sayfaya dön, çift dokun (telefon) / + düğmesi iki kez (masaüstü).
  await p.evaluate(() => (location.hash = "#p=3"));
  await bekle(300);
  await sakin(p);
  await p.waitForLoadState("networkidle");
  evre = "yakin";
  if (PROFIL[ad].hasTouch) {
    for (let k = 0; k < 2; k++) {
      await dokun("touchStart", [[195, 400]]);
      await dokun("touchEnd", []);
      await bekle(70);
    }
  } else {
    await p.click('button[aria-label="Zoom in"], button[aria-label="Yakınlaştır"]');
    await bekle(350);
    await p.click('button[aria-label="Zoom in"], button[aria-label="Yakınlaştır"]');
  }
  await p.waitForFunction(() => [...document.querySelectorAll(".bro-net")].some((i) => i.dataset.hazir), null, { timeout: 20000 }).catch(() => {});
  await p.waitForLoadState("networkidle");
  const olcek = await p.evaluate(() => document.querySelector(".bro-kamera").style.transform);
  await c.close();
  const L = [...istek.values()].filter((r) => r.bayt !== undefined && !r.url.startsWith("data:"));
  const topla = (f) => {
    const o = {};
    for (const r of L.filter(f)) {
      const t = tur(r.url, r.mime);
      o[t] = o[t] ?? { adet: 0, bayt: 0 };
      o[t].adet++;
      o[t].bayt += r.bayt;
    }
    o.toplam = { adet: Object.values(o).reduce((a, b) => a + b.adet, 0), bayt: Object.values(o).reduce((a, b) => a + b.bayt, 0) };
    return o;
  };
  const gorunen = (r) => gorunenIlk.includes(r.url);
  return {
    ad,
    dil,
    olcek,
    ilkGorunenSayfa: gorunenIlk,
    ilk: topla((r) => r.evre === "ilk"),
    ilkKritik: topla((r) => r.evre === "ilk" && (["html", "js", "css", "yazi"].includes(tur(r.url, r.mime)) || gorunen(r))),
    gezinti: topla((r) => r.evre === "gezinti"),
    tumSayfalarToplam: topla((r) => r.evre !== "yakin"),
    yakin: topla((r) => r.evre === "yakin"),
    istekler: L.map((r) => ({ url: r.url, evre: r.evre, tur: tur(r.url, r.mime), bayt: r.bayt })),
  };
}

if (ister("--bayt")) {
  const sonuc = [];
  for (const ad of ["tel", "masa-1280"]) for (const dil of ["en", "tr"]) sonuc.push(await baytOturum(ad, dil));
  writeFileSync(join(Q, "bayt.json"), JSON.stringify(sonuc, null, 1));
  const kb = (b) => (b / 1024).toFixed(1);
  for (const s of sonuc) {
    const f = (o) => Object.entries(o).map(([k, v]) => `${k} ${v.adet}×/${kb(v.bayt)} kB`).join(", ");
    console.log(`\n${s.ad} ${s.dil.toUpperCase()}  (yakın: ${s.olcek})`);
    console.log("  ilk açılış (kritik):", f(s.ilkKritik));
    console.log("  ilk açılış (ön yükleme + küçük resim dahil):", f(s.ilk));
    console.log("  bütün sayfalar gezilince toplam:", f(s.tumSayfalarToplam));
    console.log("  bir sayfa yakınlaştırma:", f(s.yakin));
  }
}

// ————— (c) akıcılık —————
async function akicilik(ad) {
  const c = await tarayici.newContext(PROFIL[ad]);
  const p = await c.newPage();
  const cdp = await c.newCDPSession(p);
  await p.goto(`${B}/brosur`, { waitUntil: "load" });
  await sakin(p);
  await p.waitForLoadState("networkidle");
  await p.evaluate(() => {
    const w = (window.__olc = { raf: [], loaf: [], cevir: [], yaprak: [] });
    // Çevirme canlandırmasının gerçek penceresi: yaprağın WAAPI canlandırması başlayınca/bitince işaret (yalnız ölçümde).
    const asil = Element.prototype.animate;
    Element.prototype.animate = function (kf, o) {
      const a = asil.call(this, kf, o);
      if (this.matches?.("[data-yaprak]")) {
        performance.mark("yaprak-basla");
        const t0 = performance.now();
        a.finished.then(() => {
          performance.mark("yaprak-bitti");
          w.yaprak.push([t0, performance.now()]);
        }, () => {});
      }
      return a;
    };
    const dongu = (t) => {
      w.raf.push(t);
      requestAnimationFrame(dongu);
    };
    requestAnimationFrame(dongu);
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) w.loaf.push({ t: e.startTime, sure: e.duration, engel: e.blockingDuration });
      }).observe({ type: "long-animation-frame", buffered: false });
    } catch {
      w.loaf = null;
    }
  });
  await cdp.send("Tracing.start", {
    traceConfig: { includedCategories: ["devtools.timeline", "disabled-by-default-devtools.timeline.frame", "toplevel", "blink.user_timing"], recordMode: "recordUntilFull" },
    transferMode: "ReturnAsStream",
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  for (let i = 0; i < 8; i++) {
    await p.evaluate(() => {
      performance.mark("cevir");
      window.__olc.cevir.push(performance.now());
    });
    await p.keyboard.press("ArrowRight");
    await bekle(1600);
  }
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  const parcalar = [];
  const bitti = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
  await cdp.send("Tracing.end");
  const { stream } = await bitti;
  for (;;) {
    const { data, eof, base64Encoded } = await cdp.send("IO.read", { handle: stream });
    parcalar.push(base64Encoded ? Buffer.from(data, "base64").toString("utf8") : data);
    if (eof) break;
  }
  await cdp.send("IO.close", { handle: stream });
  const iz = JSON.parse(parcalar.join(""));
  const olaylar = iz.traceEvents ?? iz;
  writeFileSync(join(Q, `iz-${ad}.json`), JSON.stringify(olaylar));
  const w = await p.evaluate(() => window.__olc);
  await c.close();
  // Pencere: yaprak canlandırmasının başı → sonu (+1 kare). Tuşa basma ile başlangıç arası (görüntü çözme bekleyişi,
  // ekran durgun) ve çevirmeler arası boşluk "uzun kare" sayılmaz; başlangıçtan ilk kareye gecikme sayılır.
  const isaret = olaylar.filter((e) => e.name === "cevir" && e.cat?.includes("user_timing")).map((e) => e.ts);
  const bas = olaylar.filter((e) => e.name === "yaprak-basla" && e.cat?.includes("user_timing")).map((e) => e.ts).sort((a, b) => a - b);
  const son = olaylar.filter((e) => e.name === "yaprak-bitti" && e.cat?.includes("user_timing")).map((e) => e.ts).sort((a, b) => a - b);
  const pencereler = bas.map((t) => [t, (son.find((x) => x > t) ?? t + 900e3) + 17e3]);
  const pencere = (ts) => pencereler.some(([a, b]) => ts >= a && ts <= b);
  const ana = olaylar.find((e) => e.name === "thread_name" && e.args?.name === "CrRendererMain" && olaylar.some((x) => x.pid === e.pid && x.name === "cevir"));
  const cizim = olaylar
    .filter((e) => e.name === "DrawFrame" && (!ana || e.pid === ana.pid))
    .map((e) => e.ts)
    .sort((a, b) => a - b);
  let uzunKare = 0;
  const araliklar = [];
  for (let i = 1; i < cizim.length; i++) {
    if (!pencere(cizim[i])) continue;
    const onceki = Math.max(cizim[i - 1], pencereler.find(([a, b]) => cizim[i] >= a && cizim[i] <= b)[0]);
    const d = (cizim[i] - onceki) / 1000;
    araliklar.push(d);
    if (d > 50) uzunKare++;
  }
  const uzunGorev = olaylar.filter((e) => ana && e.pid === ana.pid && e.tid === ana.tid && e.ph === "X" && e.name === "RunTask" && e.dur > 50e3 && pencere(e.ts)).map((e) => +(e.dur / 1000).toFixed(1));
  const rafPencere = (t) => w.yaprak.some(([a, b]) => t >= a && t <= b + 17);
  const raf = [];
  for (let i = 1; i < w.raf.length; i++) if (rafPencere(w.raf[i])) raf.push(w.raf[i] - w.raf[i - 1]);
  const sirala = (a) => [...a].sort((x, y) => x - y);
  const yuzde = (a, q) => (a.length ? +sirala(a)[Math.min(a.length - 1, Math.floor(a.length * q))].toFixed(1) : null);
  return {
    ad,
    cevirme: isaret.length,
    canlandirma: pencereler.length,
    // Tuşa basma → yaprak canlandırmasının başlaması (görüntü çözme + iki kare), 4× yavaşlatmada.
    tepkiMs: isaret.map((t) => {
      const b = bas.find((x) => x >= t);
      return b === undefined ? null : Math.round((b - t) / 1000);
    }),
    canlandirmaMs: w.yaprak.map(([a, b]) => Math.round(b - a)),
    iz: { drawFrame: araliklar.length, uzunKare50: uzunKare, enUzunMs: araliklar.length ? +Math.max(...araliklar).toFixed(1) : null, p95: yuzde(araliklar, 0.95), ortalamaMs: araliklar.length ? +(araliklar.reduce((a, b) => a + b, 0) / araliklar.length).toFixed(1) : null },
    anaIsParcacigiUzunGorev50: uzunGorev,
    raf: { kare: raf.length, uzun50: raf.filter((d) => d > 50).length, enUzunMs: raf.length ? +Math.max(...raf).toFixed(1) : null, p95: yuzde(raf, 0.95) },
    loaf50: w.loaf === null ? "desteklenmiyor" : w.loaf.filter((e) => rafPencere(e.t) && e.sure > 50).map((e) => ({ sure: +e.sure.toFixed(1), engel: +e.engel.toFixed(1) })),
  };
}

if (ister("--akicilik")) {
  const s = [];
  for (const ad of ["tel", "masa-1280"]) s.push(await akicilik(ad));
  writeFileSync(join(Q, "akicilik.json"), JSON.stringify(s, null, 1));
  console.log(JSON.stringify(s, null, 1));
}

await tarayici.close();
