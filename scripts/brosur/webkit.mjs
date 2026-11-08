// Dijital broşür WebKit sınaması (Playwright WebKit, Windows; iPhone 16: 393×852 @3, isMobile, hasTouch).
//
//   PLAYWRIGHT_BROWSERS_PATH=D:/soft/cop31-varlik/pw-browsers node scripts/brosur/webkit.mjs [--port 3141] [--chrome]
//
// Ham dokunma WebKit protokolünün Input.dispatchTouchEvent'iyle (Playwright istemcisi yalnız tap veriyor; sunucu
// nesnesine süreç içi bağlantının toImpl kancasıyla erişilir — .qa/icinden3/gb/d30/webkit/betikler/wk-ortak.mjs ile
// aynı yol). Gerçek iOS DEĞİL (UIKit jest hakemliği, Safari arayüz çubukları yok). --chrome: aynı senaryo Chrome'da
// (CDP dokunma). Çıktı: .qa/brosur-2/webkit/ (ekran görüntüleri, sonuc.json).
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium, webkit } from "playwright-core";

const KOK = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const PORT = argv.includes("--port") ? argv[argv.indexOf("--port") + 1] : "3141";
const B = `http://localhost:${PORT}`;
const CHROME = argv.includes("--chrome");
const Q = join(KOK, ".qa/brosur-2", CHROME ? "chrome-dokunma" : "webkit");
mkdirSync(Q, { recursive: true });
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

const tarayici = CHROME ? await chromium.launch({ channel: "chrome" }) : await webkit.launch();
const ctx = await tarayici.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: "en-US" });
const p = await ctx.newPage();
const hatalar = [];
p.on("pageerror", (e) => hatalar.push("pageerror: " + e.message));
p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && hatalar.push(m.type() + ": " + m.text().slice(0, 300)));
const istek = [];
p.on("requestfinished", (r) => /\/brosur\/(en|tr)\//.test(r.url()) && istek.push(r.url().replace(B, "")));

let gonder;
if (CHROME) {
  const cdp = await ctx.newCDPSession(p);
  gonder = (type, touchPoints) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints });
} else {
  const impl = p._connection.toImpl(p);
  const oturum = (impl.delegate ?? impl._delegate)._pageProxySession;
  gonder = (type, touchPoints) => oturum.send("Input.dispatchTouchEvent", { type, touchPoints });
}
const dokun = (type, noktalar) => gonder(type, noktalar.map(([x, y], i) => ({ x: Math.round(x), y: Math.round(y), id: i + 1 })));
async function kaydir(x0, y0, x1, y1, adim = 8) {
  await dokun("touchStart", [[x0, y0]]);
  for (let i = 1; i <= adim; i++) {
    await dokun("touchMove", [[x0 + ((x1 - x0) * i) / adim, y0 + ((y1 - y0) * i) / adim]]);
    await bekle(16);
  }
  await dokun("touchEnd", [[x1, y1]]);
}
async function tikla(x, y) {
  await dokun("touchStart", [[x, y]]);
  await dokun("touchEnd", [[x, y]]);
}
const durum = () =>
  p.evaluate(() => {
    const k = document.querySelector("[data-kitap]");
    return {
      hash: location.hash,
      sag: k.dataset.sag,
      ilk: k.dataset.ilk,
      yakin: document.querySelector("[data-bro-sahne]").dataset.yakin || "",
      kamera: document.querySelector(".bro-kamera").style.transform,
      net: [...document.querySelectorAll(".bro-net")].map((i) => (i.dataset.hazir ? "hazir " : "") + (i.getAttribute("src") || "").split("/").pop()),
      sayac: document.querySelector("[data-sayac]").textContent,
      tasma: document.documentElement.scrollWidth > innerWidth,
      yaprakAcik: !document.querySelector("[data-yaprak]").hidden,
    };
  });
const sakin = () =>
  p.waitForFunction(() => document.querySelector("[data-yaprak]").hidden && [...document.querySelectorAll(".bro-taban[src]")].every((i) => i.complete), null, { timeout: 15000 }).catch(() => {});

const sonuc = { tarayici: CHROME ? "chrome" : "webkit", adimlar: [] };
const kaydet = async (ad, ekstra = {}) => {
  const d = { ad, ...(await durum()), ...ekstra };
  sonuc.adimlar.push(d);
  console.log(ad, JSON.stringify(d));
  await p.screenshot({ path: join(Q, `${String(sonuc.adimlar.length).padStart(2, "0")}-${ad}.png`) });
};

// Geçmiş: about:blank → /brosur (geri bağlantısı history.back() ile buraya dönmeli; #p= girdisi eklenmemeli).
await p.goto("about:blank");
await p.goto(`${B}/brosur`, { waitUntil: "load" });
await p.waitForFunction(() => !!document.querySelector("[data-kitap]")?.dataset.ilk && document.querySelector('[data-yuva="sag"] .bro-taban').complete, null, { timeout: 30000 });
await bekle(600);
const gecmis0 = await p.evaluate(() => history.length);
await kaydet("acilis", { gecmis: gecmis0, avif: (await durum()).ilk?.endsWith("avif") });

await kaydir(320, 450, 70, 455);
await bekle(380);
await p.screenshot({ path: join(Q, "02a-kaydirma-ortasi.png") });
await sakin();
await bekle(200);
await kaydet("sola-kaydir");
await kaydir(70, 450, 330, 452);
await sakin();
await bekle(200);
await kaydet("saga-kaydir");
await tikla(330, 450);
await bekle(400);
await sakin();
await bekle(200);
await kaydet("sag-yari-dokun");
await p.click('button.bro-ok[data-yon="ileri"]:visible');
await sakin();
await bekle(200);
await kaydet("ileri-dugmesi");

// Çift dokunma ~2,5× (dokunulan noktaya) → 2480 px iner.
await tikla(200, 330);
await bekle(90);
await tikla(200, 330);
await p.waitForFunction(() => [...document.querySelectorAll(".bro-net")].some((i) => i.dataset.hazir), null, { timeout: 20000 }).catch(() => {});
await bekle(300);
await kaydet("cift-dokunma");
await kaydir(300, 450, 120, 430);
await bekle(400);
await kaydet("yakinken-kaydir");
await tikla(200, 330);
await bekle(90);
await tikla(200, 330);
await bekle(600);
await kaydet("cift-dokunma-geri");

// İki parmak (iki dokunma noktası).
await dokun("touchStart", [
  [175, 420],
  [225, 420],
]);
for (let i = 1; i <= 10; i++) {
  await dokun("touchMove", [
    [175 - i * 7, 420 - i * 5],
    [225 + i * 7, 420 + i * 5],
  ]);
  await bekle(16);
}
await dokun("touchEnd", [
  [105, 370],
  [295, 470],
]);
await bekle(1200);
await kaydet("iki-parmak");
await p.keyboard.press("Escape");
await bekle(500);

// Izgara + Metin.
await p.click('button[aria-label="All pages"]');
await bekle(700);
await kaydet("izgara");
await p.click('.bro-izgara a[href="#p=21"]');
await sakin();
await bekle(300);
await kaydet("izgaradan-21");
await p.click('button[aria-label="Page text"]');
await bekle(300);
await kaydet("metin-paneli", { metin: await p.evaluate(() => document.querySelector(".bro-panel-govde").innerText.slice(0, 120)) });
await p.click(".bro-panel .bro-ok");

// Geri bağlantısı: /icinden'den gelmiş gibi işaret; #p= değişimleri geçmişe giriş eklememiş olmalı.
const gecmis1 = await p.evaluate(() => history.length);
await p.evaluate(() => sessionStorage.setItem("bro-geldi", "icinden"));
await p.click("a.bro-geri");
await p.waitForURL((u) => u.toString() === "about:blank", { timeout: 8000 }).catch(() => {});
sonuc.geri = { gecmisAcilis: gecmis0, gecmisGezintiSonrasi: gecmis1, sonra: p.url() };
console.log("geri", JSON.stringify(sonuc.geri));

// Dil geçişi: aynı sayfada TR; işaret silinir; kapak inmez.
await p.goto(`${B}/brosur#p=13`, { waitUntil: "load" });
await sakin();
await bekle(400);
await p.evaluate(() => sessionStorage.setItem("bro-geldi", "icinden"));
istek.length = 0;
await p.click(".bro-dil a");
await p.waitForURL(/\/tr\/brosur#p=13/, { timeout: 10000 }).catch(() => {});
await p.waitForFunction(() => !!document.querySelector("[data-kitap]")?.dataset.ilk, null, { timeout: 20000 });
await sakin();
await bekle(400);
await kaydet("dil-tr", { url: p.url(), geldi: await p.evaluate(() => sessionStorage.getItem("bro-geldi")), sayfaIstekleri: istek.filter((u) => !/-(120|240)\./.test(u)) });

sonuc.hatalar = hatalar;
writeFileSync(join(Q, "sonuc.json"), JSON.stringify(sonuc, null, 1));
console.log("hatalar", hatalar);
await tarayici.close();
