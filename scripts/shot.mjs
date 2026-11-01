#!/usr/bin/env node
/**
 * Görsel kontrol aracı (brief §6).
 *
 *   node scripts/shot.mjs <route> [--desktop] [--reduced]
 *
 * - Sistemdeki Chrome'u (playwright-core, channel "chrome", headless) açar.
 * - Mobil: 390×844, deviceScaleFactor 2, isMobile, hasTouch. --desktop: 1280×800.
 * - --reduced: prefers-reduced-motion: reduce taklit edilir.
 * - http://localhost:3000<route> açılır; console error/warning, pageerror,
 *   requestfailed ve HTTP >= 400 yanıtları toplanır.
 * - %0, %20, %40, %60, %80, %100 scroll konumlarında (her birinde 400 ms
 *   bekleyip) .qa/<slug>-<nn>.png görüntüsü alınır.
 * - scrollWidth > innerWidth ise "YATAY TAŞMA" uyarısı (taşan elemanlarla).
 * - Sonda JSON özet stdout'a basılır. Çıkış kodu her zaman 0.
 * - Git Bash'in "/route" → "C:/Program Files/Git/route" dönüşümü otomatik geri alınır.
 */
import { execFileSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QA_DIR = path.join(ROOT, ".qa");
const BASE_URL = process.env.SHOT_BASE_URL ?? "http://localhost:3000";
const STEPS = [0, 20, 40, 60, 80, 100];
const SETTLE_MS = 400;
const IMAGE_WAIT_MS = 2500;

/**
 * Git Bash (MSYS) "/" ile başlayan argümanları Windows yoluna çevirir:
 * "/dunya" → "C:/Program Files/Git/dunya". Bunu geri al.
 */
function undoMsysPathConversion(arg) {
  if (!/^[A-Za-z]:[\\/]/.test(arg)) return arg;
  const normalized = arg.replace(/\\/g, "/");
  const roots = [];
  try {
    roots.push(execFileSync("cygpath", ["-m", "/"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim());
  } catch {
    // cygpath yoksa bilinen kurulum köklerine bak.
  }
  if (process.env.EXEPATH) roots.push(path.resolve(process.env.EXEPATH, "..").replace(/\\/g, "/"));
  roots.push("C:/Program Files/Git", "C:/Program Files (x86)/Git", "C:/msys64", "C:/msys32");
  for (const root of roots) {
    const r = root.replace(/\/+$/, "");
    if (r && normalized.toLowerCase().startsWith(`${r.toLowerCase()}/`)) return normalized.slice(r.length) || "/";
    if (r && normalized.toLowerCase() === r.toLowerCase()) return "/";
  }
  const m = normalized.match(/^[A-Za-z]:\/.*?\/(?:Git|msys64|msys32)(\/.*)?$/i);
  return m ? m[1] || "/" : arg;
}

const args = process.argv.slice(2);
const desktop = args.includes("--desktop");
const reduced = args.includes("--reduced");
let route = undoMsysPathConversion(args.find((a) => !a.startsWith("--")) ?? "/");
if (!route.startsWith("/")) route = `/${route}`;

const routePath = route.split(/[?#]/)[0];
const baseSlug = routePath === "/" ? "index" : routePath.replace(/^\/+|\/+$/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-");
const query = route.slice(routePath.length).replace(/^[?#]/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
const slug = [baseSlug, query, desktop ? "desktop" : "", reduced ? "reduced" : ""].filter(Boolean).join("-");

const viewport = desktop ? { width: 1280, height: 800 } : { width: 390, height: 844 };

const summary = {
  route,
  url: BASE_URL + route,
  slug,
  viewport: { ...viewport, deviceScaleFactor: desktop ? 1 : 2, mobile: !desktop, reducedMotion: reduced },
  height: null,
  viewportHeight: viewport.height,
  horizontalOverflow: false,
  errors: [],
  warnings: [],
  files: [],
  durationMs: 0,
};

const started = Date.now();
const seen = new Set();
const push = (list, msg) => {
  const key = `${list === summary.errors ? "E" : "W"}:${msg}`;
  if (seen.has(key)) return;
  seen.add(key);
  list.push(msg);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let browser;
try {
  const { chromium } = await import("playwright-core");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: desktop ? 1 : 2,
    isMobile: !desktop,
    hasTouch: !desktop,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    reducedMotion: reduced ? "reduce" : "no-preference",
    userAgent: desktop
      ? undefined
      : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    const type = msg.type();
    if (type !== "error" && type !== "warning") return;
    const loc = msg.location();
    const where = loc?.url ? ` (${loc.url.replace(BASE_URL, "")}:${loc.lineNumber ?? 0})` : "";
    const text = `console.${type === "warning" ? "warn" : "error"}: ${msg.text()}${where}`;
    push(type === "error" ? summary.errors : summary.warnings, text);
  });
  page.on("pageerror", (err) => {
    push(summary.errors, `pageerror: ${err.message}${err.stack ? `\n${err.stack.split("\n").slice(1, 4).join("\n")}` : ""}`);
  });
  page.on("requestfailed", (req) => {
    const failure = req.failure()?.errorText ?? "unknown";
    const text = `requestfailed: ${req.method()} ${req.url().replace(BASE_URL, "")} — ${failure}`;
    // Gezinme/yeniden yükleme sırasında iptal edilen istekler gürültüdür.
    push(failure.includes("ERR_ABORTED") ? summary.warnings : summary.errors, text);
  });
  page.on("response", (res) => {
    if (res.status() >= 400) {
      push(summary.errors, `HTTP ${res.status()}: ${res.request().method()} ${res.url().replace(BASE_URL, "")}`);
    }
  });

  await page.goto(summary.url, { waitUntil: "load", timeout: 90_000 });
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await sleep(300);

  await mkdir(QA_DIR, { recursive: true });

  let maxOverflow = null;
  for (const pct of STEPS) {
    const metrics = await page.evaluate((p) => {
      const doc = document.documentElement;
      const height = Math.max(doc.scrollHeight, document.body?.scrollHeight ?? 0);
      const maxY = Math.max(0, height - window.innerHeight);
      window.scrollTo({ top: Math.round((maxY * p) / 100), left: 0, behavior: "instant" });
      return { height };
    }, pct);
    summary.height = Math.max(summary.height ?? 0, metrics.height);

    await sleep(SETTLE_MS);
    // Lazy görsellerin ekrana gelenleri yüklenene kadar kısa bir bekleme (en çok 2,5 sn).
    await page
      .waitForFunction(
        () =>
          Array.from(document.images).every((img) => {
            const r = img.getBoundingClientRect();
            const visible = r.bottom > 0 && r.top < window.innerHeight && r.width > 0 && r.height > 0;
            return !visible || img.complete;
          }),
        null,
        { timeout: IMAGE_WAIT_MS, polling: 100 },
      )
      .catch(() => {});

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const vw = window.innerWidth;
      if (doc.scrollWidth <= vw) return null;
      const culprits = [];
      for (const el of document.body.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > vw + 1 || r.left < -1) {
          const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 4).join(".") : "";
          culprits.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${cls ? `.${cls}` : ""} [${Math.round(r.left)}…${Math.round(r.right)}]`);
          if (culprits.length >= 8) break;
        }
      }
      return { scrollWidth: doc.scrollWidth, innerWidth: vw, culprits };
    });
    if (overflow && (!maxOverflow || overflow.scrollWidth > maxOverflow.scrollWidth)) maxOverflow = { ...overflow, atPercent: pct };

    const file = path.join(QA_DIR, `${slug}-${String(pct).padStart(2, "0")}.png`);
    await page.screenshot({ path: file, fullPage: false });
    summary.files.push(file);
  }

  if (maxOverflow) {
    summary.horizontalOverflow = true;
    summary.warnings.push(
      `YATAY TAŞMA: scrollWidth=${maxOverflow.scrollWidth} > innerWidth=${maxOverflow.innerWidth} (%${maxOverflow.atPercent})` +
        (maxOverflow.culprits.length ? ` — taşan elemanlar: ${maxOverflow.culprits.join(" | ")}` : ""),
    );
  }
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  summary.errors.push(
    `shot.mjs: ${msg}${/ECONNREFUSED|ERR_CONNECTION_REFUSED/.test(msg) ? " — dev sunucusu http://localhost:3000 adresinde çalışıyor mu?" : ""}`,
  );
} finally {
  await browser?.close().catch(() => {});
  summary.durationMs = Date.now() - started;
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exitCode = 0;
}
