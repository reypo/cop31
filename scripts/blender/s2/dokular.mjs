#!/usr/bin/env node
/**
 * S2 iç sahne dokuları (docs/brief-icinden-3.md §3.4, §9.3): sütun yüzleri, zemin halkası, kanopi bandı,
 * pankartlar, kiosk ekranı, totem. Statik HTML → PNG (playwright-core, channel "chrome", headless).
 * Dev sunucu gerekmez. Metinler kod verisinden: src/lib/emanet.ts (emanetAlanlari, donemler) ve
 * src/lib/stant.ts. Fontlar D:\soft\cop31-varlik\font\ (OFL; Chrome'da değişken font sorun değil).
 *
 *   node scripts/blender/s2/dokular.mjs [--out D:/soft/cop31-varlik/s2/doku] [--sadece a.png,b.png]
 *                                        [--onizleme .qa/icinden3/e]
 *
 * Sütun yüzlerinde FOTOĞRAF YOK: numara, ad, il, dönem çipi, emanet cümlesi, dönem rengi şeridi.
 * Değişirse yalnız t45 / l5 / p5 yeniden render edilir (onay-listesi §1–§4).
 *
 * E turu (brief §12.3): duvar-arka.png, duvar-sol.png, ekran-soz.png, cephe-on.png (500 px/m; ekran 1000 px/m).
 * Tüm yazılar tek bir SVG'de, taban çizgisi metre cinsinden verilir. Her duvar dokusu üretildikten sonra PNG'den
 * harf yükseklikleri (referans harfin mürekkep yüksekliği), WCAG kontrastı, metin kutusu çakışmaları, telefon
 * penceresi ve köşe sürekliliği ölçülür → <out>/_duvar-olcum.json; 1/8 önizlemeler → <onizleme>/doku-*.png.
 * Yalnız duvarları üretmek için (eski dokular bayt bayt değişmesin):
 *   node scripts/blender/s2/dokular.mjs --sadece duvar-arka.png,duvar-sol.png,ekran-soz.png,cephe-on.png
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { emanetAlanlari, donemler } = await import(pathToFileURL(path.join(KOK, "src/lib/emanet.ts")).href);
const { stant } = await import(pathToFileURL(path.join(KOK, "src/lib/stant.ts")).href);
const { iklim, stats } = await import(pathToFileURL(path.join(KOK, "src/lib/content.ts")).href);
const { photos } = await import(pathToFileURL(path.join(KOK, "src/lib/photos.ts")).href);

const arg = (ad, vars) => {
  const i = process.argv.indexOf(ad);
  return i > 0 ? process.argv[i + 1] : vars;
};
const OUT = arg("--out", "D:/soft/cop31-varlik/s2/doku");
const SADECE = arg("--sadece", null)?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;
const ONIZLEME = path.resolve(KOK, arg("--onizleme", ".qa/icinden3/e"));
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

/* ======================= E turu: duvar baskıları (brief §12.3; S2a) =======================
   Koordinatlar metre; doku z 0 = duvar altı (sahnede Z0 = 0,05). u = duvar boyunca, içeriden (cephede dışarıdan)
   bakana soldan sağa: arka x −7,38…−1,80, sol y −0,50…4,83, ön cephe x 1,95…7,5. Köşe: sol u = 4,83 ucu (kuzeybatı)
   ≡ arka u = −7,38 ucu; dağ silueti bu köşede kesintisiz (tek panorama). Yazı boyları büyük harf yüksekliğidir:
   Lora ve Montserrat'ta OS/2 capHeight = 700/1000 → font = h / 0,70. Rakam: Lora '1' 716/1000; '0','3' mürekkebi
   −16…716 = 732/1000 (fontTools). */
const PXM = 500; // px/m
const DUVAR_H = 4.0;
const GEBCO_8K = "D:/soft/cop31-varlik/dunya/8k-gebco-elev-8192x4096.png"; // NASA EO / GEBCO_08 (dunya/KAYNAK.md)
// Toros kesiti: her boylamda 36,3–37,9 K bandındaki en yüksek GEBCO değeri = güneyden (denizden) görülen sırt çizgisi.
// Yatay ölçek tüm duvarlarda 0,633°/m; düşey ölçek stilize (8 bit GEBCO, yalnız göreli).
const TOROS = { lat0: 36.3, lat1: 37.9, dpm: 0.633 };
// İç panorama: sol (0…5,33 m) + arka (5,33…10,91 m) → 29,00…35,91 D (Batı Toroslar → Aladağlar; Aladağ zirvesi arka
// duvarın pencere dışı kısmına, x ≈ −2,9'a düşer, pencere altındaki yazılar dağdan uzak kalır).
const IC_PAN = { lon0: 29.0, zAlt: 0.3, zUst: 0.95, uzun: 5.33 + 5.58 };
const CEPHE_DAG = { lon0: 29.6, zAlt: 0.8, zUst: 1.5 }; // 29,60…33,11 D: Beydağları, Antalya ovası çukuru, Geyik Dağları
const PAL = {
  krem: stant.palet.krem, // #F7E6CD
  yesil: stant.palet.koyuYesil, // #28332F
  turuncu: "#DF9560", // stant-icerik.md §3 (turuncu pankart birleşik medyanı)
  ahsap: stant.palet.ahsap, // #B49168
  ekran: "#17241D", // kiosk ekranı (stant-icerik.md §3)
};
// hatiraOrmaniTabela kırpımı. Kaynakta iki kişi var (tabelayı imzalayan ve yanındaki); render'da insan figürü yok
// (brief §2.1, §12.0). Tabela yazısı yatay olsun diye görüntü 2,514° saat yönünde döndürülür (kaynakta "HATIRA ORMANI"
// taban çizgisi (590; 618) → (1205; 591)); 760 × 570 (4:3) kırpım, alt kenar harflerin tabanında (döndürülmüş y 604;
// yeniden örneklemede 605. satır karışmasın diye 1 px pay). Kalem ucu 605'te, parmak 612'de, baş x ≤ 543'te başlıyor →
// kırpım dışı. Görünen: gökyüzü, OGM / AK Parti Üsküdar / Üsküdar Gençlik Kolları logoları, "AK PARTİ ÜSKÜDAR GENÇLİK
// KOLLARI HATIRA ORMANI" (AK kimliği stant içinde serbest: brief §12.0).
const FOTO_KIRP = { aci: 2.5138, mx: 900, my: 600, x: 548, y: 34, w: 760, h: 570 };
const FOTO = path.join(KOK, "public", photos.hatiraOrmaniTabela.src);

// Metinler (birebir kaynaktan; yeni EN satırı yalnız "Climate Action")
const m0 = iklim.items[0].match(/(Hatıra Ormanı) — (\d+) (fidan) \((\d{4})\)$/); // content.ts:108
const m1 = iklim.items[1].match(/^(Genç İklim): .+ — (.+), (.+)$/); // content.ts:109
if (!m0 || !m1) throw new Error("content.ts iklim.items biçimi değişti; duvar metinleri yeniden bölünmeli");
const sayiYaz = (st) => st.value.toLocaleString("tr-TR") + (st.suffix ?? "");
const METIN = {
  baslik: iklim.title, // content.ts:106 "İklim Eylemleri"
  baslikEn: "Climate Action", // d6 EN satırı: Icinden3.tsx <En> (data-onay="en"; HEAD'de Brosur.tsx:409); onay-listesi.md:178
  fidanSayi: m0[2], // "300"
  fidan: m0[3], // "fidan"
  orman: m0[1], // "Hatıra Ormanı"
  ormanYil: m0[4], // "2025"
  genc: m1[1], // "Genç İklim"
  gencTarih: m1[2], // "21-23 Ağustos 2026"
  gencYer: m1[3], // "İstanbul"
  etkinlik: iklim.items[2], // content.ts:110
  hashtag: stant.hashtag, // stant.ts:24 (= pankartlar[2], :78)
  uye: sayiYaz(stats[0]), // content.ts:22 → "1.000.000+"
  uyeEt: stats[0].label, // "Genç Üye"
  ilIlce: `${stats[1].value} ${stats[1].label} · ${stats[2].value} ${stats[2].label}`, // content.ts:23–24
  soz: stant.kiosk.cagri, // stant.ts:72 "Sen de söz ver."
  slogan: stant.pankartlar[1], // stant.ts:77
  program: `${stant.pankartlar[3]} →`, // stant.ts:79 (+ sondaki "→", stant.ts:25 ve :79 yorumu)
};
// satır bölme yalnız boşluktan (metin değişmez): kelime dizisini verilen kelime sayılarına böl
const bol = (s, ...adet) => {
  const k = s.split(" ");
  const out = [];
  let i = 0;
  for (const n of adet) out.push(k.slice(i, (i += n)).join(" "));
  if (i < k.length) out.push(k.slice(i).join(" "));
  return out;
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const lumi = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const kontrast = (a, b) => {
  const [x, y] = [lumi(a), lumi(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** GEBCO 8k → [lonMin, lonMax] aralığında sütun maksimumları (tarayıcıda; renk dönüşümü kapalı). */
async function torosProfili(sayfaB, lonMin, lonMax) {
  const W = 8192, H = 4096;
  const c0 = Math.floor(((lonMin + 180) / 360) * W) - 2;
  const c1 = Math.ceil(((lonMax + 180) / 360) * W) + 2;
  const r0 = Math.floor(((90 - TOROS.lat1) / 180) * H);
  const r1 = Math.ceil(((90 - TOROS.lat0) / 180) * H);
  const url = `data:image/png;base64,${(await readFile(GEBCO_8K)).toString("base64")}`;
  const kol = await sayfaB.evaluate(
    async ({ url, c0, c1, r0, r1 }) => {
      const bm = await createImageBitmap(await (await fetch(url)).blob(), { colorSpaceConversion: "none", premultiplyAlpha: "none" });
      const w = c1 - c0, h = r1 - r0;
      const cx = new OffscreenCanvas(w, h).getContext("2d", { willReadFrequently: true });
      cx.drawImage(bm, c0, r0, w, h, 0, 0, w, h);
      const d = cx.getImageData(0, 0, w, h).data;
      const m = [];
      for (let x = 0; x < w; x++) {
        let v = 0;
        for (let y = 0; y < h; y++) v = Math.max(v, d[(y * w + x) * 4]);
        m.push(v);
      }
      return { m, bw: bm.width, bh: bm.height };
    },
    { url, c0, c1, r0, r1 },
  );
  if (kol.bw !== W || kol.bh !== H) throw new Error(`GEBCO boyutu beklenmedik: ${kol.bw}×${kol.bh}`);
  const P = (lon) => {
    const f = ((lon + 180) / 360) * W - 0.5 - c0;
    const i = Math.floor(f);
    const t = f - i;
    return kol.m[i] * (1 - t) + kol.m[i + 1] * t;
  };
  return { P, satir: [r0, r1], sutun: [c0, c1], max: Math.max(...kol.m) };
}

/** Dağ yolu (SVG path): u ∈ [0, uzun] m boyunca z(u) metre; 2 px adım. */
function dagYolu(zFn, wPx, hPx) {
  let d = `M0,${hPx}`;
  for (let i = 0; i <= wPx; i += 2) d += ` L${i},${((DUVAR_H - zFn(i / PXM)) * PXM).toFixed(2)}`;
  if (wPx % 2) d += ` L${wPx},${((DUVAR_H - zFn(wPx / PXM)) * PXM).toFixed(2)}`;
  return `${d} L${wPx},${hPx} Z`;
}

/** Yazı öğesi: taban çizgisi z (m), u (m, duvar boyunca), font (m). ref: ölçülecek harfin dizini. */
const Y = (ad, metin, o) => ({ ad, metin, hiza: "start", italik: false, ...o });
function yaziSvg(t, d) {
  const x = (t.u - d.u0) * d.pxm, y = (d.H - t.z) * d.pxm;
  return `<text data-ad="${t.ad}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-family="${t.aile}" font-weight="${t.agirlik}"${
    t.italik ? ' font-style="italic"' : ""
  } font-size="${(t.font * d.pxm).toFixed(3)}" text-anchor="${t.hiza}" fill="${t.renk}">${esc(t.metin)}</text>`;
}
const kutuSvg = (d, u0, u1, z0, z1, renk) =>
  `<rect x="${((u0 - d.u0) * d.pxm).toFixed(2)}" y="${((d.H - z1) * d.pxm).toFixed(2)}" width="${((u1 - u0) * d.pxm).toFixed(2)}" height="${((z1 - z0) * d.pxm).toFixed(2)}" fill="${renk}"/>`;
const duvarSayfa = (d, ic) =>
  sayfa(
    d.w,
    d.h,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${d.w}" height="${d.h}" viewBox="0 0 ${d.w} ${d.h}" lang="tr" xml:lang="tr" style="display:block;font-variant-numeric:normal;font-kerning:normal;font-variant-ligatures:no-common-ligatures">${ic}</svg>`,
  );

async function duvarlariHazirla(sayfaB) {
  // İç panorama + cephe profili
  const ic = await torosProfili(sayfaB, IC_PAN.lon0 - 0.1, IC_PAN.lon0 + IC_PAN.uzun * TOROS.dpm + 0.1);
  const cep = await torosProfili(sayfaB, CEPHE_DAG.lon0 - 0.1, CEPHE_DAG.lon0 + 5.55 * TOROS.dpm + 0.1);
  const aralik = (P, lon0, uzun) => {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= uzun * PXM; i++) {
      const v = P(lon0 + (i / PXM) * TOROS.dpm);
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    return [lo, hi];
  };
  const [icLo, icHi] = aralik(ic.P, IC_PAN.lon0, IC_PAN.uzun);
  const [cLo, cHi] = aralik(cep.P, CEPHE_DAG.lon0, 5.55);
  const zIc = (pos) => IC_PAN.zAlt + ((ic.P(IC_PAN.lon0 + pos * TOROS.dpm) - icLo) / (icHi - icLo)) * (IC_PAN.zUst - IC_PAN.zAlt);
  const zCep = (pos) => CEPHE_DAG.zAlt + ((cep.P(CEPHE_DAG.lon0 + pos * TOROS.dpm) - cLo) / (cHi - cLo)) * (CEPHE_DAG.zUst - CEPHE_DAG.zAlt);
  const fotoUrl = `data:image/jpeg;base64,${(await readFile(FOTO)).toString("base64")}`;

  const L = (o) => ({ aile: "Lora", agirlik: 400, renk: PAL.yesil, zemin: PAL.krem, ...o });
  const M = (o) => ({ aile: "Mont", agirlik: 600, renk: PAL.yesil, zemin: PAL.krem, ...o });
  const kh = (h) => h / 0.7; // büyük harf yüksekliği → font boyu

  /* ---------- arka duvar: x −7,38…−1,80; telefon penceresi x −7,0…−3,95 ---------- */
  const A = { ad: "duvar-arka.png", w: 2790, h: 2000, pxm: PXM, u0: -7.38, H: DUVAR_H, ofs: 5.33, pencere: [-7.0, -3.95] };
  const XL = -6.95; // pencere içi sol hiza
  // fotoğraf: 1,30 × 0,976 m (650 × 488 px, 4:3), 4 cm paspartu (krem, dışta 8 mm ahşap çizgi)
  const pas = { u0: -5.38, u1: -4.0, z0: 1.844, z1: 2.9 }; // sağ kenar pencere sınırından 5 cm içeride
  const foto = { u0: pas.u0 + 0.04, u1: pas.u1 - 0.04, z0: pas.z0 + 0.04, z1: pas.z1 - 0.04 };
  const etk = bol(METIN.etkinlik, 3, 2); // "Fidan dikimi ve" / "orman temizliği" / "etkinlikleri"
  const fRakam = 0.6 / 0.732; // "300" mürekkebi 0,60 m (300 px)
  A.yazilar = [
    Y("baslik", METIN.baslik, L({ u: XL, z: 3.0, font: kh(0.26), agirlik: 600, ref: 6, hedef: ["başlık büyük harf", 0.26] })),
    Y("baslik_en", METIN.baslikEn, L({ u: XL, z: 2.7, font: kh(0.14), italik: true, ref: 8, hedef: ["ikincil (EN) büyük harf", 0.14] })),
    Y("fidan_sayi", METIN.fidanSayi, L({ u: XL, z: 1.993, font: fRakam, agirlik: 700, ref: 0, hedef: ["rakam mürekkebi", 0.6], capa: "fidan" })),
    Y("fidan", METIN.fidan, L({ u: XL, z: 1.704, font: kh(0.2), agirlik: 600, ref: 2, hedef: ["büyük harf (ölçek)", 0.2] })),
    Y("orman", METIN.orman, L({ u: XL, z: 1.474, font: kh(0.14), ref: 0, hedef: ["ikincil büyük harf", 0.14] })),
    Y("orman_yil", METIN.ormanYil, L({ u: XL, z: 1.259, font: kh(0.14), ref: 1, hedef: ["ikincil (rakam)", 0.14] })),
    Y("genc", METIN.genc, L({ u: pas.u1, z: 1.54, font: kh(0.2), agirlik: 600, hiza: "end", ref: 0, hedef: ["büyük harf", 0.2], capa: "genc_iklim" })),
    Y("genc_tarih", METIN.gencTarih, L({ u: pas.u1, z: 1.26, font: kh(0.14), hiza: "end", ref: 1, hedef: ["ikincil (rakam)", 0.14] })),
    Y("genc_yer", METIN.gencYer, L({ u: pas.u1, z: 0.995, font: kh(0.14), hiza: "end", ref: 5, hedef: ["ikincil büyük harf (ölçek)", 0.14] })),
    // pencere dışı (x −3,9…−1,8): yalnız yatayda
    Y("etkinlik_1", etk[0], L({ u: -3.7, z: 2.7, font: kh(0.16), ref: 0, hedef: ["büyük harf", 0.16], pencereDisi: true })),
    Y("etkinlik_2", etk[1], L({ u: -3.7, z: 2.42, font: kh(0.16), ref: 11, hedef: ["büyük harf (ölçek)", 0.16], pencereDisi: true })),
    Y("etkinlik_3", etk[2], L({ u: -3.7, z: 2.14, font: kh(0.16), ref: 2, hedef: ["büyük harf (ölçek)", 0.16], pencereDisi: true })),
    Y("hashtag", METIN.hashtag, M({ u: -3.7, z: 1.8, font: kh(0.13), ref: 1, hedef: ["büyük harf", 0.13], pencereDisi: true })),
  ];
  A.sekiller = [
    kutuSvg(A, XL, XL + 0.4, 3.43, 3.46, PAL.turuncu), // başlık üstü vurgu (metin değil)
    kutuSvg(A, -3.7, -3.3, 2.98, 3.01, PAL.turuncu),
    // paspartu: krem, dışta 8 mm ahşap çizgi
    kutuSvg(A, pas.u0, pas.u1, pas.z0, pas.z1, PAL.ahsap),
    kutuSvg(A, pas.u0 + 0.008, pas.u1 - 0.008, pas.z0 + 0.008, pas.z1 - 0.008, PAL.krem),
    `<svg x="${((foto.u0 - A.u0) * PXM).toFixed(2)}" y="${((A.H - foto.z1) * PXM).toFixed(2)}" width="${((foto.u1 - foto.u0) * PXM).toFixed(2)}" height="${((foto.z1 - foto.z0) * PXM).toFixed(2)}" viewBox="${FOTO_KIRP.x} ${FOTO_KIRP.y} ${FOTO_KIRP.w} ${FOTO_KIRP.h}" preserveAspectRatio="none" overflow="hidden"><image href="${fotoUrl}" x="0" y="0" width="${photos.hatiraOrmaniTabela.width}" height="${photos.hatiraOrmaniTabela.height}" transform="rotate(${FOTO_KIRP.aci} ${FOTO_KIRP.mx} ${FOTO_KIRP.my})"/></svg>`,
  ];
  A.zDag = (u) => zIc(A.ofs + (u - A.u0));
  A.foto = foto;

  /* ---------- sol duvar: y −0,50…4,83; telefonda y ≈ 0,9…3,4; ekranlar y 1,05…3,31 × z 1,20–1,82 boş ---------- */
  const S = { ad: "duvar-sol.png", w: 2665, h: 2000, pxm: PXM, u0: -0.5, H: DUVAR_H, ofs: 0, pencere: [0.9, 3.4], bos: [1.05, 3.31, 1.2, 1.82] };
  const YC = 2.15; // telefon penceresi ortası (ekranların ortası 2,18)
  // "1.000.000+" brief'te 0,42 m; o boyda 3,06 m genişlik telefon penceresine (2,5 m) sığmıyor → 0,32 m (2,33 m)
  const fUye = 0.32 / 0.716;
  S.yazilar = [
    Y("uye", METIN.uye, L({ u: YC, z: 2.93, font: fUye, agirlik: 700, hiza: "middle", ref: 0, hedef: ["rakam ('1')", 0.32], capa: "uye" })),
    Y("uye_et", METIN.uyeEt, L({ u: YC, z: 2.62, font: kh(0.18), agirlik: 600, hiza: "middle", ref: 0, hedef: ["büyük harf", 0.18] })),
    Y("il_ilce", METIN.ilIlce, L({ u: YC, z: 2.15, font: kh(0.2), agirlik: 600, hiza: "middle", ref: 1, hedef: ["büyük harf (rakam '1')", 0.2], capa: "il_ilce" })),
  ];
  S.sekiller = [kutuSvg(S, YC - 0.2, YC + 0.2, 3.4, 3.43, PAL.turuncu)];
  S.zDag = (u) => zIc(S.ofs + (u - S.u0));

  /* ---------- ön cephe dış yüzü: x 1,95…7,5; pankart_sifir x 6,625…7,375 önünde → yazı x ≤ 6,40 ---------- */
  const C = { ad: "cephe-on.png", w: 2775, h: 2000, pxm: PXM, u0: 1.95, H: DUVAR_H, ofs: 0, pencere: [1.95, 6.5] };
  // slogan üç satır ("İklim, doğa," / "sıfır atık" / "bize miras."): d4'te cephe ~24 m'den görülüyor → en büyük
  // harf; font = min(büyük harf 0,48 m, en geniş satır 4,25 m'ye sığacak boy). Son satır tabanı dağ tepesinin 0,15 m üstü.
  const sl = bol(METIN.slogan, 2, 2);
  const slM = await metinMetrik(sayfaB, sl.map((s) => ({ metin: s, aile: "Lora", agirlik: 700, font: 1, ref: 0 })), 1000);
  const fSl = Math.min(kh(0.48), 4.25 / Math.max(...slM.map((m) => m.gen)));
  const slAra = 1.08 * fSl;
  const slTaban = CEPHE_DAG.zUst + 0.15;
  C.yazilar = [
    ...sl.map((s, i) =>
      Y(`slogan_${i + 1}`, s, L({ u: 2.15, z: slTaban + (sl.length - 1 - i) * slAra, font: fSl, agirlik: 700, ref: [1, 2, 0][i], hedef: ["büyük harf (ölçek)", 0.7 * fSl] })),
    ),
    Y("c_hashtag", METIN.hashtag, M({ u: 2.15, z: 0.42, font: kh(0.2), renk: PAL.turuncu, zemin: PAL.yesil, ref: 1, hedef: ["büyük harf", 0.2] })),
    Y("c_program", METIN.program, M({ u: 6.4, z: 0.14, font: kh(0.13), renk: PAL.krem, zemin: PAL.yesil, hiza: "end", ref: 5, hedef: ["büyük harf", 0.13] })),
  ];
  C.sekiller = []; // logo yok; süs çubuğu da yok (slogan duvarın üst kenarına yakın)
  C.zDag = (u) => zCep(u - C.u0);

  /* ---------- 2 × 50″ ekran: 1,11 × 0,62 m → 1110 × 620 (1000 px/m); yalnız "Sen de söz ver." ---------- */
  const E = { ad: "ekran-soz.png", w: 1110, h: 620, pxm: 1000, u0: 0, H: 0.62, zemin: PAL.ekran };
  const sz = bol(METIN.soz, 2); // "Sen de" / "söz ver."
  // font: geniş satır 0,68 × 1110 px; iki satır dikeyde ortalı (aşağıda ölçülerek)
  E.yazilar = [
    Y("soz_1", sz[0], L({ u: 0.555, z: 0, font: 0.2, agirlik: 700, renk: PAL.krem, zemin: PAL.ekran, hiza: "middle", ref: 0, hedef: ["büyük harf", null] })),
    Y("soz_2", sz[1], L({ u: 0.555, z: 0, font: 0.2, agirlik: 700, renk: PAL.krem, zemin: PAL.ekran, hiza: "middle", ref: 2, hedef: ["büyük harf (ölçek)", null] })),
  ];
  E.sekiller = [];

  // ekran yazısını ölçerek boyutla
  const [g1, g2] = await metinMetrik(sayfaB, E.yazilar.map((t) => ({ ...t, font: 1 })), 1000);
  const fE = (0.68 * 1.11) / Math.max(g1.gen, g2.gen); // m
  const satir = 1.1 * fE;
  const blok = g1.ust * fE + satir + g2.alt * fE;
  const z1 = 0.62 - (0.62 - blok) / 2 - g1.ust * fE;
  E.yazilar[0] = { ...E.yazilar[0], font: fE, z: z1, hedef: ["büyük harf", 0.7 * fE] };
  E.yazilar[1] = { ...E.yazilar[1], font: fE, z: z1 - satir, hedef: ["büyük harf (ölçek)", 0.7 * fE] };

  for (const d of [A, S, C]) {
    d.zemin = PAL.krem;
    d.dag = dagYolu((u) => d.zDag(d.u0 + u), d.w, d.h);
  }
  const ciz = (d) =>
    duvarSayfa(
      d,
      `<rect width="${d.w}" height="${d.h}" fill="${d.zemin}"/>` +
        (d.dag ? `<path d="${d.dag}" fill="${PAL.yesil}"/>` : "") +
        d.sekiller.join("") +
        d.yazilar.map((t) => yaziSvg(t, d)).join(""),
    );
  for (const d of [A, S, C, E]) d.html = ciz(d);
  return {
    duvarlar: [A, S, E, C],
    profil: {
      kaynak: GEBCO_8K,
      bant_K: [TOROS.lat0, TOROS.lat1],
      derece_m: TOROS.dpm,
      ic: { lon: [IC_PAN.lon0, +(IC_PAN.lon0 + IC_PAN.uzun * TOROS.dpm).toFixed(3)], gebco8: [icLo, icHi], z_m: [IC_PAN.zAlt, IC_PAN.zUst] },
      cephe: { lon: [CEPHE_DAG.lon0, +(CEPHE_DAG.lon0 + 5.55 * TOROS.dpm).toFixed(3)], gebco8: [cLo, cHi], z_m: [CEPHE_DAG.zAlt, CEPHE_DAG.zUst] },
      kose_z_m: { sol_sag_uc: +zIc(5.33).toFixed(4), arka_sol_uc: +zIc(5.33).toFixed(4) },
    },
  };
}

/** Tarayıcıda canvas ile metin metrikleri (font = 1 m → px/m ölçekli): genişlik ve mürekkep kutusu (font oranı). */
async function metinMetrik(sayfaB, yazilar, pxm) {
  return sayfaB.evaluate(
    async ({ yazilar, pxm }) => {
      const cx = document.createElement("canvas").getContext("2d");
      const out = [];
      for (const t of yazilar) {
        const fpx = t.font * pxm;
        const f = `${t.italik ? "italic " : ""}${t.agirlik} ${fpx}px ${t.aile}`;
        await document.fonts.load(f, t.metin);
        cx.font = f;
        cx.fontKerning = "normal";
        const m = cx.measureText(t.metin);
        const r = cx.measureText(t.metin[t.ref]);
        out.push({
          gen: m.width / fpx,
          sol: m.actualBoundingBoxLeft / fpx,
          sag: m.actualBoundingBoxRight / fpx,
          ust: m.actualBoundingBoxAscent / fpx,
          alt: m.actualBoundingBoxDescent / fpx,
          refUst: r.actualBoundingBoxAscent / fpx,
          refAlt: r.actualBoundingBoxDescent / fpx,
          fontYuklu: document.fonts.check(f, t.metin),
        });
      }
      return out;
    },
    { yazilar, pxm },
  );
}

/** Üretilen PNG'den ölçüm: referans harf mürekkep yüksekliği, dağ kenarları, boş alan, 1/8 önizleme. */
async function duvarOlc(sayfaB, d, png) {
  const met = await metinMetrik(sayfaB, d.yazilar, d.pxm);
  const r = await sayfaB.evaluate(
    async ({ b64, ogeler, zemin, bos, H, pxm, u0 }) => {
      const bm = await createImageBitmap(await (await fetch("data:image/png;base64," + b64)).blob(), { colorSpaceConversion: "none" });
      const cx = new OffscreenCanvas(bm.width, bm.height).getContext("2d", { willReadFrequently: true });
      cx.drawImage(bm, 0, 0);
      const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      const L = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const harf = [];
      const glifler = {}; // her harfin mürekkep kutusu (px): SVG konumu + canvas glif sınırları
      const tc = document.createElement("canvas").getContext("2d");
      for (const o of ogeler) {
        const el = document.querySelector(`text[data-ad="${o.ad}"]`);
        const e = el.getExtentOfChar(o.ref);
        const yb = el.y.baseVal[0].value;
        const fs = parseFloat(el.getAttribute("font-size"));
        tc.font = `${el.getAttribute("font-style") === "italic" ? "italic " : ""}${el.getAttribute("font-weight")} ${fs}px ${el.getAttribute("font-family")}`;
        glifler[o.ad] = [];
        for (let i = 0; i < el.getNumberOfChars(); i++) {
          const ch = o.metin[i];
          if (!ch || !ch.trim()) continue;
          const g = tc.measureText(ch);
          const ex = el.getExtentOfChar(i);
          glifler[o.ad].push([ch, ex.x - g.actualBoundingBoxLeft, ex.x + g.actualBoundingBoxRight, yb - g.actualBoundingBoxAscent, yb + g.actualBoundingBoxDescent]);
        }
        const xa = Math.round(e.x + 0.18 * e.width), xb = Math.round(e.x + 0.82 * e.width);
        const ya = Math.max(0, Math.round(yb - 1.25 * fs)), yb2 = Math.min(bm.height, Math.round(yb + 0.45 * fs));
        const d = cx.getImageData(xa, ya, xb - xa, yb2 - ya).data;
        const Lb = L(...rgb(o.zemin)), Lt = L(...rgb(o.renk));
        const satir = [];
        for (let y = 0; y < yb2 - ya; y++) {
          let k = 0;
          for (let x = 0; x < xb - xa; x++) {
            const i = (y * (xb - xa) + x) * 4;
            k = Math.max(k, (L(d[i], d[i + 1], d[i + 2]) - Lb) / (Lt - Lb));
          }
          satir.push(k >= 0.5);
        }
        // taban çizgisinin hemen üstündeki satırdan başlayan bitişik mürekkep koşusu
        let s = Math.round(yb) - 2 - ya;
        while (s > 0 && !satir[s]) s--;
        let a = s, b = s;
        while (a > 0 && satir[a - 1]) a--;
        while (b < satir.length - 1 && satir[b + 1]) b++;
        harf.push({ ad: o.ad, harf: o.metin[o.ref], olculen_px: b - a + 1, ust_px: ya + a, alt_px: ya + b, taban_px: +yb.toFixed(2), font_px: +fs.toFixed(2) });
      }
      // dağ silueti üst kenarı: ilk ve son sütunda alttan yukarı ilk krem satır (yarı kapsama)
      const kenar = (x) => {
        if (zemin !== "#F7E6CD") return null;
        const d = cx.getImageData(x, 0, 1, bm.height).data;
        const Lk = L(...rgb("#F7E6CD")), Ly = L(...rgb("#28332F"));
        let y = bm.height - 1;
        while (y > 0 && (L(d[y * 4], d[y * 4 + 1], d[y * 4 + 2]) - Ly) / (Lk - Ly) < 0.5) y--;
        return y + 1; // siluetin ilk koyu satırı
      };
      // ekran alanı boş mu (krem dışı piksel sayısı)
      let bosKirli = null;
      if (bos) {
        const [ua, ub, za, zb] = bos;
        const x0 = Math.round((ua - u0) * pxm), x1 = Math.round((ub - u0) * pxm);
        const y0 = Math.round((H - zb) * pxm), y1 = Math.round((H - za) * pxm);
        const d = cx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
        const k = rgb("#F7E6CD");
        bosKirli = 0;
        for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - k[0]) + Math.abs(d[i + 1] - k[1]) + Math.abs(d[i + 2] - k[2]) > 6) bosKirli++;
      }
      // 1/8 önizleme
      const ow = Math.round(bm.width / 8), oh = Math.round(bm.height / 8);
      const oc = new OffscreenCanvas(ow, oh);
      const ox = oc.getContext("2d");
      ox.imageSmoothingEnabled = true;
      ox.imageSmoothingQuality = "high";
      ox.drawImage(bm, 0, 0, ow, oh);
      const blob = await oc.convertToBlob({ type: "image/png" });
      const u8 = new Uint8Array(await blob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
      return { harf, glifler, kenar: { sol: kenar(0), sag: kenar(bm.width - 1) }, bosKirli, onizleme: btoa(bin), boyut: [bm.width, bm.height] };
    },
    { b64: png.toString("base64"), ogeler: d.yazilar, zemin: d.zemin, bos: d.bos ?? null, H: d.H, pxm: d.pxm, u0: d.u0 },
  );
  // mürekkep kutuları (m) → çakışma, pencere, dağ payı
  const kutular = d.yazilar.map((t, i) => {
    const m = met[i];
    const bas = t.hiza === "end" ? t.u - m.gen * t.font : t.hiza === "middle" ? t.u - (m.gen * t.font) / 2 : t.u;
    return { ad: t.ad, u: [bas - m.sol * t.font, bas + m.sag * t.font], z: [t.z - m.alt * t.font, t.z + m.ust * t.font], t, m };
  });
  const uyari = [];
  // farklı satırların harfleri arasındaki en küçük açıklık (glif kutusu; m). < 3 cm → uyarı
  const enYakin = [];
  const adlar = Object.keys(r.glifler);
  for (let i = 0; i < adlar.length; i++)
    for (let j = i + 1; j < adlar.length; j++) {
      let best = { ara: Infinity };
      for (const a of r.glifler[adlar[i]])
        for (const b of r.glifler[adlar[j]]) {
          const du = Math.max(a[1], b[1]) - Math.min(a[2], b[2]);
          const dz = Math.max(a[3], b[3]) - Math.min(a[4], b[4]);
          const ara = Math.max(du, dz) / d.pxm;
          if (ara < best.ara) best = { ara, a: a[0], b: b[0] };
        }
      if (best.ara < 0.06) enYakin.push({ a: adlar[i], b: adlar[j], harfler: `${best.a}|${best.b}`, ara_m: +best.ara.toFixed(3) });
      if (best.ara < 0.03) uyari.push(`harfler yakın/çakışık: ${adlar[i]} '${best.a}' ↔ ${adlar[j]} '${best.b}' (${best.ara.toFixed(3)} m)`);
    }
  delete r.glifler;
  const pencereler = [];
  for (const k of kutular) {
    if (d.pencere && !k.t.pencereDisi) {
      const pay = Math.min(k.u[0] - d.pencere[0], d.pencere[1] - k.u[1]);
      pencereler.push({ ad: k.ad, pay_m: +pay.toFixed(3) });
      if (pay < 0) uyari.push(`pencere dışı: ${k.ad} (pay ${pay.toFixed(3)} m)`);
    }
    if (d.zDag) {
      let dagMax = -Infinity, dagMin = Infinity;
      for (let u = k.u[0]; u <= k.u[1]; u += 0.01) {
        dagMax = Math.max(dagMax, d.zDag(u));
        dagMin = Math.min(dagMin, d.zDag(u));
      }
      k.dagPay = k.t.zemin === PAL.yesil ? dagMin - k.z[1] : k.z[0] - dagMax; // koyu zemindeki yazı dağın içinde kalmalı
      if (k.dagPay < 0.04) uyari.push(`dağ payı küçük: ${k.ad} (${k.dagPay.toFixed(3)} m)`);
    }
  }
  return {
    ...r,
    kutular: kutular.map((k) => ({
      ad: k.ad,
      metin: k.t.metin,
      font: `${k.t.aile} ${k.t.agirlik}${k.t.italik ? " italik" : ""}`,
      font_m: +k.t.font.toFixed(4),
      buyuk_harf_px: +(0.7 * k.t.font * d.pxm).toFixed(1),
      hedef: k.t.hedef,
      u_m: k.u.map((v) => +v.toFixed(3)),
      z_m: k.z.map((v) => +v.toFixed(3)),
      dag_pay_m: k.dagPay == null ? null : +k.dagPay.toFixed(3),
      kontrast: +kontrast(k.t.renk, k.t.zemin).toFixed(2),
      ref_beklenen_px: +((k.m.refUst + k.m.refAlt) * k.t.font * d.pxm).toFixed(1),
      capa: k.t.capa ?? null,
    })),
    pencereler,
    en_yakin_harfler: enYakin,
    uyari,
  };
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

const DUVAR_ADLARI = ["duvar-arka.png", "duvar-sol.png", "ekran-soz.png", "cephe-on.png"];
const ister = (ad) => !SADECE || SADECE.includes(ad);

await mkdir(OUT, { recursive: true });
const tarayici = await chromium.launch({ channel: "chrome", headless: true });
const sayfaB = await tarayici.newPage({ deviceScaleFactor: 1 });
// Duvar dokuları: GEBCO profili ve metin ölçüleri tarayıcıda alınır → önce boş bir sayfada (fontlar yüklü) hazırlık
let duvar = null;
if (DUVAR_ADLARI.some(ister)) {
  await sayfaB.setViewportSize({ width: 64, height: 64 });
  await sayfaB.setContent(sayfa(64, 64, ""), { waitUntil: "load" });
  duvar = await duvarlariHazirla(sayfaB);
  isler.push(...duvar.duvarlar.map((d) => [d.ad, d.html, d.w, d.h, false, d]));
}
const uretilen = [];
const olcum = {};
for (const [ad, html, w, h, alfa, d] of isler) {
  if (!ister(ad)) continue;
  await sayfaB.setViewportSize({ width: w, height: h });
  await sayfaB.setContent(html, { waitUntil: "load" });
  await sayfaB.evaluate(() => document.fonts.ready);
  await sayfaB.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const png = await sayfaB.screenshot({ omitBackground: alfa, clip: { x: 0, y: 0, width: w, height: h } });
  await writeFile(path.join(OUT, ad), png);
  uretilen.push(ad);
  console.log("yazıldı", ad, w, "×", h, `${png.length} B`);
  if (d) {
    const o = await duvarOlc(sayfaB, d, png);
    await mkdir(ONIZLEME, { recursive: true });
    const oniz = path.join(ONIZLEME, `doku-${ad}`);
    await writeFile(oniz, Buffer.from(o.onizleme, "base64"));
    delete o.onizleme;
    olcum[ad] = { bayt: png.length, px: o.boyut, px_m: d.pxm, onizleme: path.relative(KOK, oniz).replaceAll("\\", "/"), ...o };
    for (const k of o.kutular) {
      const hf = o.harf.find((x) => x.ad === k.ad);
      console.log(
        `  ${k.ad.padEnd(12)} ${k.font.padEnd(15)} büyük harf ${String(k.buyuk_harf_px).padStart(6)} px · '${hf.harf}' ölçülen ${String(hf.olculen_px).padStart(3)} / beklenen ${String(k.ref_beklenen_px).padStart(5)} px · kontrast ${k.kontrast} · u ${k.u_m.join("…")} z ${k.z_m.join("…")}`,
      );
    }
    for (const u of o.uyari) console.log("  UYARI", u);
  }
}
await tarayici.close();
if (duvar) {
  const kose =
    olcum["duvar-sol.png"] && olcum["duvar-arka.png"]
      ? { sol_sag_kenar_px: olcum["duvar-sol.png"].kenar.sag, arka_sol_kenar_px: olcum["duvar-arka.png"].kenar.sol }
      : null;
  if (kose) console.log(`köşe sürekliliği (siluet üst satırı): sol sağ ucu ${kose.sol_sag_kenar_px} px, arka sol ucu ${kose.arka_sol_kenar_px} px`);
  // p6/p7 çapaları (S2b json_yaz için): yazı mürekkep kutusunun ortası; dünya = montajlı durum (Z0 = 0,05; baskı 5 mm)
  const Z0 = 0.05, BASKI = 0.005;
  const dunya = (ad, u, z) =>
    ad === "duvar-sol.png" ? [-7.38 + BASKI, u, Z0 + z] : ad === "duvar-arka.png" ? [u, 4.83 - BASKI, Z0 + z] : [u, -4.95 - BASKI, Z0 + z];
  const capalar = {};
  for (const [ad, o] of Object.entries(olcum))
    for (const k of o.kutular ?? [])
      if (k.capa) {
        const u = (k.u_m[0] + k.u_m[1]) / 2, z = (k.z_m[0] + k.z_m[1]) / 2;
        capalar[k.capa] = { doku: ad, u_m: +u.toFixed(3), z_m: +z.toFixed(3), dunya: dunya(ad, u, z).map((v) => +v.toFixed(3)) };
      }
  const arkaD = duvar.duvarlar.find((d) => d.ad === "duvar-arka.png");
  if (olcum["duvar-arka.png"]) {
    const u = (arkaD.pencere[0] + arkaD.pencere[1]) / 2, z = arkaD.zDag(u) / 2; // dağ şeridinin pencere ortasındaki yarısı
    capalar.orman = { doku: "duvar-arka.png", u_m: +u.toFixed(3), z_m: +z.toFixed(3), dunya: dunya("duvar-arka.png", u, z).map((v) => +v.toFixed(3)) };
  }
  await writeFile(
    path.join(OUT, "_duvar-olcum.json"),
    JSON.stringify(
      {
        uretim: new Date().toISOString(),
        betik: "scripts/blender/s2/dokular.mjs",
        brief: "docs/brief-icinden-3.md §12.3",
        koordinat: "u: duvar boyunca (arka/cephe x, sol y), z: duvar altından (sahnede Z0 = 0,05 eklenir); px = (u − u0)·500, (4 − z)·500",
        profil: duvar.profil,
        kose,
        capalar,
        foto: { kaynak: photos.hatiraOrmaniTabela.src, kirpim: FOTO_KIRP, not: "döndür (saat yönü, merkez mx,my) → kırp x,y,w,h; kişiler, el ve kalem kırpım dışı" },
        palet_kontrast: {
          "#28332F/#F7E6CD": +kontrast(PAL.yesil, PAL.krem).toFixed(2),
          "#F7E6CD/#28332F": +kontrast(PAL.krem, PAL.yesil).toFixed(2),
          "#DF9560/#28332F": +kontrast(PAL.turuncu, PAL.yesil).toFixed(2),
          "#F7E6CD/#17241D": +kontrast(PAL.krem, PAL.ekran).toFixed(2),
          "#DF9560/#F7E6CD (yalnız süs çubuğu, yazı değil)": +kontrast(PAL.turuncu, PAL.krem).toFixed(2),
          "#B49168/#F7E6CD (yalnız paspartu çizgisi)": +kontrast(PAL.ahsap, PAL.krem).toFixed(2),
        },
        dokular: olcum,
      },
      null,
      1,
    ),
  );
}
const tumu = [...new Set([...isler.map((i) => i[0]), ...DUVAR_ADLARI])];
await writeFile(
  path.join(OUT, "_dokular.json"),
  JSON.stringify({ uretim: new Date().toISOString(), betik: "scripts/blender/s2/dokular.mjs", dosyalar: tumu, bu_calisma: uretilen }, null, 1),
);
