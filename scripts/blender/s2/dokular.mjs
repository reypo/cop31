#!/usr/bin/env node
/**
 * S2 iç sahne dokuları (docs/brief-icinden-3.md §3.4, §9.3): sütun yüzleri, zemin halkası, kanopi bandı,
 * pankartlar, kiosk ekranı, totem. Statik HTML → PNG (playwright-core, channel "chrome", headless).
 * Dev sunucu gerekmez. Metinler kod verisinden: src/lib/emanet.ts (emanetAlanlari, donemler) ve
 * src/lib/stant.ts. Fontlar D:\soft\cop31-varlik\font\ (OFL; Chrome'da değişken font sorun değil).
 *
 *   node scripts/blender/s2/dokular.mjs [--out D:/soft/cop31-varlik/s2/doku]
 *
 * Sütun yüzlerinde FOTOĞRAF YOK: numara, ad, il, dönem çipi, emanet cümlesi, dönem rengi şeridi.
 * Değişirse yalnız t45 / l5 / p5 yeniden render edilir (onay-listesi §1–§4).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { emanetAlanlari, donemler } = await import(pathToFileURL(path.join(KOK, "src/lib/emanet.ts")).href);
const { stant } = await import(pathToFileURL(path.join(KOK, "src/lib/stant.ts")).href);

const arg = (ad, vars) => {
  const i = process.argv.indexOf(ad);
  return i > 0 ? process.argv[i + 1] : vars;
};
const OUT = arg("--out", "D:/soft/cop31-varlik/s2/doku");
const FONT_DIZIN = "D:/soft/cop31-varlik/font/";
// setContent (about:blank) file:// yazı tiplerini yükleyemez → base64 data: URL olarak gömülür
const gom = async (ad) => `data:font/ttf;base64,${(await readFile(FONT_DIZIN + ad)).toString("base64")}`;
const F = {
  lora: await gom("Lora[wght].ttf"),
  loraI: await gom("Lora-Italic[wght].ttf"),
  mont: await gom("Montserrat[wght].ttf"),
  montI: await gom("Montserrat-Italic[wght].ttf"),
};

const TR = (s) => s.toLocaleUpperCase("tr");
const iki = (n) => String(n).padStart(2, "0");
const donemRenk = (ad) => donemler.find((d) => d.ad === ad)?.renk ?? "#888";

// Dönem adlarının İngilizce karşılıkları (zemin halkası küçük satırı; stant-icerik.md §2.3'teki okunan EN etiketler)
const EN = {
  Neolitik: "Neolithic",
  "Tunç Çağı": "Bronze Age",
  "Lidya – Demir Çağı": "Lydian – Iron Age",
  "Likya – Helenistik": "Lycian – Hellenistic",
  "Helenistik – Roma": "Hellenistic – Roman",
  Bizans: "Byzantine",
  Selçuklu: "Seljuk",
  Akkoyunlu: "Aq Qoyunlu",
  Osmanlı: "Ottoman",
  "Osmanlı'dan bugüne": "Ottoman to today",
  "Doğal miras": "Natural heritage",
};

const PALET = {
  koyuYesil: stant.palet.koyuYesil, // #28332F
  krem: stant.palet.krem, // #F7E6CD
  zeminKrem: "#E9DCC6",
  bordo: "#7A2A1E",
  altin: "#C0A665",
  turuncu: "#DF9560",
  yuz: "#F4F1EB",
  murekkep: "#2B2523",
};

const CSS = `
@font-face { font-family: Lora; src: url("${F.lora}"); font-weight: 400 700; }
@font-face { font-family: Lora; src: url("${F.loraI}"); font-weight: 400 700; font-style: italic; }
@font-face { font-family: Mont; src: url("${F.mont}"); font-weight: 100 900; }
@font-face { font-family: Mont; src: url("${F.montI}"); font-weight: 100 900; font-style: italic; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: transparent; }
body { font-kerning: normal; font-variant-numeric: lining-nums tabular-nums; -webkit-font-smoothing: antialiased; }
`;

const sayfa = (w, h, ic, bg = "transparent") =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${CSS} body{width:${w}px;height:${h}px;background:${bg};overflow:hidden;position:relative}</style></head><body>${ic}</body></html>`;

/* ---------------- sütun yüzü: 0,46 × 2,30 m → 600 × 3000 px ---------------- */
function sutunYuzu(a) {
  const renk = donemRenk(a.donem);
  return sayfa(
    600,
    3000,
    `
  <div style="position:absolute;inset:0;background:${PALET.yuz}"></div>
  <div style="position:absolute;left:56px;right:50px;top:170px;color:${PALET.murekkep}">
    <div style="font:700 300px/1 Lora;letter-spacing:-8px;color:${PALET.bordo}">${iki(a.no)}</div>
    <div style="font:700 86px/1.06 Lora;margin-top:60px">${a.ad}</div>
    <div style="font:500 44px/1 Mont;color:#6E6862;margin-top:34px;letter-spacing:.5px">${a.il}</div>
    <div style="display:inline-block;margin-top:44px;background:${PALET.bordo};color:#fff;font:600 32px/1 Mont;letter-spacing:.12em;padding:16px 20px 14px">${TR(a.donem)}</div>
    <div style="height:3px;background:#D9D2C8;margin:90px 0 70px"></div>
    <div style="font:italic 400 50px/1.36 Lora;color:#3A3330">${a.emanet}</div>
  </div>
  <div style="position:absolute;left:56px;right:56px;bottom:520px;font:600 30px/1 Mont;color:#8A8178;letter-spacing:.06em">12.000 Yıllık Emanet</div>
  <div style="position:absolute;left:56px;width:120px;bottom:490px;height:6px;background:${PALET.koyuYesil}"></div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:380px;background:${renk}"></div>
  <div style="position:absolute;left:0;right:0;bottom:380px;height:10px;background:${PALET.koyuYesil}"></div>
  `,
  );
}

/* ---------------- zemin halkası: ±2,25 m → 4096² px (910,2 px/m), alfa dışarıda ---------------- */
function halka() {
  const N = 4096;
  const pxm = N / 4.5;
  const c = N / 2;
  const r = (m) => m * pxm;
  // Etiket dizisi: 9 yönünden (batı) saat yönünde; işaretler (GİRİŞ, BUGÜN) dönem değil (stant-icerik §2.3)
  const etiketler = [
    { tr: "GİRİŞ · ~12.000 YIL ÖNCE", en: "Start · 12,000 years ago", isaret: true },
    ...donemler.slice(0, 6).map((d) => ({ tr: TR(d.ad), en: EN[d.ad] })),
    { tr: "BUGÜN", en: "Today", isaret: true, altin: true },
    ...donemler.slice(6).map((d) => ({ tr: TR(d.ad), en: EN[d.ad] })),
  ];
  const n = etiketler.length;
  const bantOrta = r((1.665 + 2.01) / 2);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N}" viewBox="0 0 ${N} ${N}">`;
  svg += `<defs>`;
  // dilimler: 0,72–1,02 m, donemler sırası, 9 yönünden saat yönünde (SVG'de y aşağı: saat yönü = +açı)
  svg += `</defs>`;
  // krem zemin (rotunda tabanı) 0–2,01 m
  svg += `<circle cx="${c}" cy="${c}" r="${r(2.01)}" fill="${PALET.zeminKrem}"/>`;
  // koyu yeşil etiket bandı 1,665–2,01
  svg += `<circle cx="${c}" cy="${c}" r="${r((1.665 + 2.01) / 2)}" fill="none" stroke="${PALET.koyuYesil}" stroke-width="${r(2.01 - 1.665)}"/>`;
  // ince altın çizgiler bandın iki kenarında
  for (const rr of [1.69, 1.985])
    svg += `<circle cx="${c}" cy="${c}" r="${r(rr)}" fill="none" stroke="${PALET.altin}" stroke-opacity=".55" stroke-width="3"/>`;
  // dilimler
  const nd = donemler.length;
  const bosluk = 1.2; // derece
  for (let i = 0; i < nd; i++) {
    const a0 = 180 + (i * 360) / nd + bosluk / 2;
    const a1 = 180 + ((i + 1) * 360) / nd - bosluk / 2;
    const yay = (rad, a) => [c + rad * Math.cos((a * Math.PI) / 180), c + rad * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = yay(r(1.02), a0), [x1, y1] = yay(r(1.02), a1);
    const [x2, y2] = yay(r(0.74), a1), [x3, y3] = yay(r(0.74), a0);
    svg += `<path d="M${x0},${y0} A${r(1.02)},${r(1.02)} 0 0 1 ${x1},${y1} L${x2},${y2} A${r(0.74)},${r(0.74)} 0 0 0 ${x3},${y3} Z" fill="${donemler[i].renk}"/>`;
  }
  // iç krem disk
  svg += `<circle cx="${c}" cy="${c}" r="${r(0.72)}" fill="${PALET.krem}"/>`;
  svg += `<circle cx="${c}" cy="${c}" r="${r(0.70)}" fill="none" stroke="${PALET.altin}" stroke-opacity=".6" stroke-width="4"/>`;
  // etiketler: bandın ortasında, üstü dışa bakar; altın üçgenler aralarda
  for (let i = 0; i < n; i++) {
    const e = etiketler[i];
    const aci = 180 + (i * 360) / n; // derece, SVG (saat yönü)
    const rot = aci + 90; // metnin tabanı merkeze teğet, üstü dışa
    const x = c + bantOrta * Math.cos((aci * Math.PI) / 180);
    const y = c + bantOrta * Math.sin((aci * Math.PI) / 180);
    const renk = e.altin ? PALET.altin : PALET.krem;
    const boy = e.isaret && !e.altin ? 52 : 62;
    svg += `<g transform="translate(${x},${y}) rotate(${rot})">`;
    svg += `<text x="0" y="-8" text-anchor="middle" font-family="Mont" font-weight="700" font-size="${boy}" letter-spacing="7" fill="${renk}">${e.tr}</text>`;
    svg += `<text x="0" y="62" text-anchor="middle" font-family="Mont" font-style="italic" font-weight="500" font-size="42" fill="${PALET.krem}" fill-opacity=".72">${e.en}</text>`;
    svg += `</g>`;
    // üçgen: iki etiketin arasında
    const au = 180 + ((i + 0.5) * 360) / n;
    const xu = c + bantOrta * Math.cos((au * Math.PI) / 180);
    const yu = c + bantOrta * Math.sin((au * Math.PI) / 180);
    svg += `<g transform="translate(${xu},${yu}) rotate(${au + 90})"><path d="M0,-30 L26,16 L-26,16 Z" fill="${PALET.altin}"/></g>`;
  }
  // orta: "Buradasın" küçük, "Bugün" büyük serif, altın ▲ — girişten (alt kenar) düz okunur
  svg += `<text x="${c}" y="${c - r(0.20)}" text-anchor="middle" font-family="Mont" font-weight="600" font-size="96" letter-spacing="10" fill="${PALET.koyuYesil}">Buradasın</text>`;
  svg += `<text x="${c}" y="${c + r(0.13)}" text-anchor="middle" font-family="Lora" font-weight="700" font-size="300" fill="${PALET.koyuYesil}">${stant.zemin.alt}</text>`;
  svg += `<path transform="translate(${c},${c + r(0.36)})" d="M0,-60 L62,44 L-62,44 Z" fill="${PALET.altin}"/>`;
  svg += `</svg>`;
  return sayfa(N, N, svg);
}

/* ---------------- kanopi bandı: 14,05 × 0,60 m → 8192 × 350 ---------------- */
function kanopi() {
  const metin = `${stant.tema} – ${stant.temaEn}`;
  const parca = (x) =>
    `<div style="position:absolute;left:${x}px;top:0;width:4096px;height:350px;display:flex;align-items:center;justify-content:center;font:600 150px/1 Mont;color:${PALET.krem};letter-spacing:2px;white-space:nowrap">${metin}</div>`;
  return sayfa(
    8192,
    350,
    `<div style="position:absolute;inset:0;background:${PALET.koyuYesil}"></div>
     <div style="position:absolute;left:0;right:0;top:18px;height:3px;background:${PALET.altin};opacity:.45"></div>
     <div style="position:absolute;left:0;right:0;bottom:18px;height:3px;background:${PALET.altin};opacity:.45"></div>
     ${parca(0)}${parca(4096)}`,
  );
}

/* ---------------- turuncu dikey pankartlar: 0,75 × 3,00 m. Doku YATAY üretilir (2000 × 500, metin
   soldan sağa); Blender'da UV 90° döndürülür → pankartta metin aşağıdan yukarı okunur. ---------------- */
function pankartDikey(satirlar) {
  const ic = satirlar
    .map((s) => `<div style="font:${s.agirlik} ${s.boy}px/1.02 Mont;letter-spacing:${s.aralik ?? -2}px;white-space:nowrap">${s.metin}</div>`)
    .join("");
  return sayfa(
    2000,
    500,
    `<div style="position:absolute;inset:0;background:${PALET.turuncu}"></div>
     <div style="position:absolute;inset:0;padding:0 90px;color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:flex-start">${ic}</div>`,
  );
}

/* ---------------- yatay bantlar ---------------- */
function bantPlay() {
  return sayfa(
    2200,
    210,
    `<div style="position:absolute;inset:0;background:#1E2A25"></div>
     <div style="position:absolute;inset:0;display:flex;align-items:center;padding-left:120px;color:#fff;font:italic 500 120px/1 Mont;letter-spacing:6px;white-space:nowrap">Play – What would you do?</div>`,
  );
}
function bantOyna() {
  return sayfa(
    1500,
    210,
    `<div style="position:absolute;inset:0;background:#1E2A25"></div>
     <div style="position:absolute;inset:0;display:flex;align-items:center;padding-left:70px;color:#fff;font:500 82px/1 Mont;white-space:nowrap"><span style="color:${PALET.altin};font-weight:700">Oyna</span>&nbsp;– Sen olsan ne yapardın?</div>`,
  );
}

/* ---------------- kiosk ekranı: 0,55 × 0,98 m → 550 × 980 (yalnız "Sen de söz ver.", sayı yok) ---------------- */
function kioskEkran() {
  return sayfa(
    550,
    980,
    `<div style="position:absolute;inset:0;background:#17241D"></div>
     <div style="position:absolute;left:50px;top:90px;font:600 26px/1 Mont;color:#9FB2A8;letter-spacing:.08em">${TR(stant.tema)}</div>
     <div style="position:absolute;left:50px;right:40px;top:330px;font:700 92px/1.08 Lora;color:#fff">${stant.kiosk.cagri}</div>
     <div style="position:absolute;left:50px;width:150px;top:600px;height:8px;background:${PALET.altin}"></div>
     <div style="position:absolute;left:50px;bottom:80px;font:500 30px/1 Mont;color:#9FB2A8">${stant.hashtag}</div>`,
  );
}

/* ---------------- koyu totem: 1,10 × 2,20 m → 550 × 1100 ---------------- */
function totem() {
  return sayfa(
    550,
    1100,
    `<div style="position:absolute;inset:0;background:${PALET.koyuYesil}"></div>
     <div style="position:absolute;left:46px;top:70px;font:700 24px/1 Mont;color:#C9D2CC;letter-spacing:.12em">${TR(stant.tema)}</div>
     <div style="position:absolute;left:46px;right:40px;top:300px;font:700 74px/1.12 Lora;color:${PALET.krem}">${stant.slogan}</div>
     <div style="position:absolute;left:46px;right:40px;bottom:110px;font:500 28px/1.35 Mont;color:#C9D2CC">${stant.girisMetni[0]}</div>`,
  );
}

const isler = [
  ...emanetAlanlari.map((a) => [`sutun-${iki(a.no)}.png`, sutunYuzu(a), 600, 3000, false]),
  ["halka.png", halka(), 4096, 4096, true],
  ["kanopi.png", kanopi(), 8192, 350, false],
  [
    "pankart-gel.png",
    pankartDikey([
      { metin: "Gel, oyna!", boy: 205, agirlik: 800 },
      { metin: "Come and play!", boy: 130, agirlik: 600 },
    ]),
    2000,
    500,
    false,
  ],
  [
    "pankart-sifir.png",
    pankartDikey([
      { metin: "Sıfır Atık Yöneticileri", boy: 150, agirlik: 800 },
      { metin: "COP31'e Giden Yol – DengeCOP31", boy: 96, agirlik: 600 },
    ]),
    2000,
    500,
    false,
  ],
  ["bant-play.png", bantPlay(), 2200, 210, false],
  ["bant-oyna.png", bantOyna(), 1500, 210, false],
  ["kiosk-ekran.png", kioskEkran(), 550, 980, false],
  ["totem.png", totem(), 550, 1100, false],
];

await mkdir(OUT, { recursive: true });
const tarayici = await chromium.launch({ channel: "chrome", headless: true });
const sayfaB = await tarayici.newPage({ deviceScaleFactor: 1 });
for (const [ad, html, w, h, alfa] of isler) {
  await sayfaB.setViewportSize({ width: w, height: h });
  await sayfaB.setContent(html, { waitUntil: "load" });
  await sayfaB.evaluate(() => document.fonts.ready);
  await sayfaB.screenshot({ path: path.join(OUT, ad), omitBackground: alfa, clip: { x: 0, y: 0, width: w, height: h } });
  console.log("yazıldı", ad, w, "×", h);
}
await tarayici.close();
await writeFile(
  path.join(OUT, "_dokular.json"),
  JSON.stringify({ uretim: new Date().toISOString(), betik: "scripts/blender/s2/dokular.mjs", dosyalar: isler.map((i) => i[0]) }, null, 1),
);
