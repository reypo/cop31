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
 * E turu (brief §12.3): duvar-arka.png, duvar-sol.png, ekran-soz.png (8 Kasım'dan beri iki fotoğraf dokusu, aşağıda),
 * cephe-on.png (500 px/m; ekran 1000 px/m).
 * Tüm yazılar tek bir SVG'de, taban çizgisi metre cinsinden verilir. Her duvar dokusu üretildikten sonra PNG'den
 * harf yükseklikleri (referans harfin mürekkep yüksekliği), WCAG kontrastı, metin kutusu çakışmaları, telefon
 * penceresi ve köşe sürekliliği ölçülür → <out>/_duvar-olcum.json; 1/8 önizlemeler → <onizleme>/doku-*.png.
 * Yalnız duvarları üretmek için (eski dokular bayt bayt değişmesin):
 *   node scripts/blender/s2/dokular.mjs --sadece duvar-arka.png,duvar-sol.png,cephe-on.png,ekran-fidan.png,ekran-cop.png
 *
 * G-B turu (brief §14.4.4, karar K7): arka duvar FOTOĞRAFSIZ, genel bilgi: "Gençlik Buluşmaları" (30+ · son 5 yılda)
 * ve "Bir Gençlik Şöleni" (100.000+ genç · 16 Mayıs 2026 · Kocaeli Stadyumu); pencere dışında "AK Parti / Her Anında /
 * Hep Yanında" + hashtag (stant.hashtag). Metinler content.ts (bulusmalar, solenler, backCover, facts) ve stant.ts'ten birebir;
 * kelimelerin kaynak cümlede geçtiği düzenli ifadeyle denetlenir (değişirse betik durur). Yerleşim ölçülerek kurulur
 * (ARKA boyları + canvas metrikleri; satırlar yukarıdan aşağı). Çapalar: bulusma ("30+"), solen ("100.000+"), motto
 * (pencere dışı üç satırın birleşik kutusu). Yalnız arka duvar (öteki dokular bayt bayt aynı kalır):
 *   node scripts/blender/s2/dokular.mjs --sadece duvar-arka.png --onizleme .qa/icinden3/gb/g7-doku
 * Kısmi çalışmada _duvar-olcum.json'daki öteki dokuların ölçümleri ve çapaları (sol duvar: uye, il_ilce) korunur.
 *
 * İki dil (7 Kasım 2026; onay-listesi §15): `--dil en` İngilizce dokuları yazar (varsayılan çıktı D:/soft/cop31-varlik/s2/
 * doku-en, önizleme .qa/icinden-en/doku). Metinler `src/components/icinden/metin.ts` `DOKU_EN`'den (DOM sözlüğüyle tek
 * kaynak; "@/" takma adı Node çözümleme kancasıyla), yalnız İngilizce (Türkçe alt satır yok), sayılar en-US. Düzen Türkçeyle
 * aynı kurallarla ölçülerek kurulur; İngilizce satır uzunlukları farklı olduğundan: arka duvar başlığı sığarsa tek satır,
 * "100,000+" ile "young people" alt alta, sol duvarda "81 Provinces · 922 Districts" sığmazsa iki satır, pankart / kiosk /
 * totem / sütun yazıları taşarsa küçültülür (`data-sig`; ölçü günlükte ve _dokular.json `sigdirma`). Varsayılan (Türkçe)
 * çıktı bayt bayt aynı kalır (Türkçe HTML'e dokunulmadı; .qa/icinden-en/doku/md5-*).
 *   node scripts/blender/s2/dokular.mjs --dil en
 *
 * Müşteri düzeltmeleri (8 Kasım 2026; onay-listesi §14.1-G, §15):
 *  - Hashtag "#YarınBanaEmanet" (stant PDF'inde "#YaniBanaEmanet" okunmuştu; kaynak stant.ts). Arka duvarın pencere dışı
 *    hashtag'i bir harf uzadı: duvar ucuna (x −1,80) payı G-B'deki gibi ≥ 0,118 m kalsın diye gerekirse küçülür (HASH_PAY).
 *    İngilizce dokularda da Türkçe yazılır (özel ad; TR_IZINLI).
 *  - d7 sol duvarındaki iki 50″ ekranda yazı ("Sen de söz ver." / "Make your pledge too.") yerine FOTOĞRAF (EKRAN_FOTO):
 *    ekran-fidan.png (ekran 0, güney, içeriden bakana solda) ve ekran-cop.png (ekran 1, kuzey, sağda); public/photos'tan
 *    sharp ile "cover" kırpım (1110 × 620, 1000 px/m), dilden bağımsız (iki dizine aynı bayt). Brief §12.0'daki "insanlı
 *    fotoğraf baskısı yok" kuralı müşteri kararıyla yalnız bu iki ekran için kalktı. ekran-soz.png artık üretilmez.
 *   node scripts/blender/s2/dokular.mjs --sadece duvar-arka.png,duvar-sol.png,cephe-on.png,kiosk-ekran.png,ekran-fidan.png,ekran-cop.png
 *  DİKKAT (ölçüldü): bir dokunun baytları aynı tarayıcı oturumunda ondan ÖNCE çizilen yazılara bağlı (Chrome glif önbelleği;
 *  ör. İngilizce duvar-sol.png'de "1,000,000+" kenar yumuşatması ±2 düzey, 249 px). Türkçe duvar-sol.png yukarıdaki komutla
 *  bayt bayt aynı çıktı; İngilizcesi değişti ve 7/8 Kasım tam çalışmasının baytları geri kondu. Değişmeyecek dokuları
 *  yeniden yazdırmayın ya da önce geçici --out dizinine üretip md5 karşılaştırarak yalnız değişenleri kopyalayın.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import sharp from "sharp";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { emanetAlanlari, donemler } = await import(pathToFileURL(path.join(KOK, "src/lib/emanet.ts")).href);
const { stant } = await import(pathToFileURL(path.join(KOK, "src/lib/stant.ts")).href);
const { stats, bulusmalar, solenler, backCover, facts } = await import(pathToFileURL(path.join(KOK, "src/lib/content.ts")).href);

const arg = (ad, vars) => {
  const i = process.argv.indexOf(ad);
  return i > 0 ? process.argv[i + 1] : vars;
};
const DIL = arg("--dil", "tr");
if (!["tr", "en"].includes(DIL)) throw new Error(`--dil ${DIL}: tr | en`);
const EN_MI = DIL === "en";
const OUT = arg("--out", EN_MI ? "D:/soft/cop31-varlik/s2/doku-en" : "D:/soft/cop31-varlik/s2/doku");
const SADECE = arg("--sadece", null)?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;
const ONIZLEME = path.resolve(KOK, arg("--onizleme", EN_MI ? ".qa/icinden-en/doku" : ".qa/icinden3/e"));
// İngilizce metinler: DOM sözlüğü (metin.ts DOKU_EN). metin.ts "@/lib/…" takma adlarıyla içe aktarır → src/…ts'e çözülür.
let DOKU_EN = null;
if (EN_MI) {
  registerHooks({
    resolve(belirtec, baglam, sonraki) {
      if (belirtec.startsWith("@/")) return sonraki(pathToFileURL(path.join(KOK, "src", `${belirtec.slice(2)}.ts`)).href, baglam);
      return sonraki(belirtec, baglam);
    },
  });
  ({ DOKU_EN } = await import(pathToFileURL(path.join(KOK, "src/components/icinden/metin.ts")).href));
}
/** Dile göre büyük harf (Türkçede İ/ı kuralı; İngilizcede "A 12,000-YEAR TRUST"). */
const BUYUK = (s) => s.toLocaleUpperCase(DIL);
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

// İngilizce dokular: dönem adı (zemin halkası, sütun çipi) DOM sözlüğünün sütunlarından (emanetAlanlari no ↔ DOKU_EN.sutunlar
// no); standda okunan EN etiketlerle (yukarıdaki EN) aynı olmalı, değilse dur (iki kaynak ayrıştı).
const EN_SUTUN = EN_MI ? Object.fromEntries(DOKU_EN.sutunlar.map((s) => [s.no, s])) : null;
if (EN_MI) {
  for (const a of emanetAlanlari) {
    const e = EN_SUTUN[a.no];
    if (!e) throw new Error(`metin.ts DOKU_EN.sutunlar: no ${a.no} yok`);
    if (EN[a.donem] !== e.donem) throw new Error(`dönem ${a.donem}: stant EN etiketi "${EN[a.donem]}", metin.ts "${e.donem}" — iki kaynak ayrıştı`);
  }
  for (const d of donemler) if (!EN[d.ad]) throw new Error(`EN dönem adı yok: ${d.ad}`);
}

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
function sutunYuzu(a, y = { ad: a.ad, il: a.il, donem: TR(a.donem), emanet: a.emanet, alt: "12.000 Yıllık Emanet" }) {
  const renk = donemRenk(a.donem);
  return sayfa(
    600,
    3000,
    `
  <div style="position:absolute;inset:0;background:${PALET.yuz}"></div>
  <div style="position:absolute;left:56px;right:50px;top:170px;color:${PALET.murekkep}">
    <div style="font:700 300px/1 Lora;letter-spacing:-8px;color:${PALET.bordo}">${iki(a.no)}</div>
    <div style="font:700 86px/1.06 Lora;margin-top:60px">${y.ad}</div>
    <div style="font:500 44px/1 Mont;color:#6E6862;margin-top:34px;letter-spacing:.5px">${y.il}</div>
    <div style="display:inline-block;margin-top:44px;background:${PALET.bordo};color:#fff;font:600 32px/1 Mont;letter-spacing:.12em;padding:16px 20px 14px">${y.donem}</div>
    <div style="height:3px;background:#D9D2C8;margin:90px 0 70px"></div>
    <div${y.sig ?? ""} style="font:italic 400 50px/1.36 Lora;color:#3A3330">${y.emanet}</div>
  </div>
  <div style="position:absolute;left:56px;right:56px;bottom:520px;font:600 30px/1 Mont;color:#8A8178;letter-spacing:.06em">${y.alt}</div>
  <div style="position:absolute;left:56px;width:120px;bottom:490px;height:6px;background:${PALET.koyuYesil}"></div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:380px;background:${renk}"></div>
  <div style="position:absolute;left:0;right:0;bottom:380px;height:10px;background:${PALET.koyuYesil}"></div>
  `,
  );
}

// İngilizce sütun yüzü: emanet cümlesi alt satırın (bottom 520 → y 2480) en az 80 px üstünde bitmeli (taşarsa küçült)
const sutunYuzuEn = (a) => {
  const e = EN_SUTUN[a.no];
  return sutunYuzu(a, { ad: e.ad, il: e.il, donem: BUYUK(e.donem), emanet: e.emanet, alt: DOKU_EN.tema, sig: ` data-sig="alt:2400"` });
};

/* ---------------- zemin halkası: ±2,25 m → 4096² px (910,2 px/m), alfa dışarıda ---------------- */
function halka() {
  const N = 4096;
  const pxm = N / 4.5;
  const c = N / 2;
  const r = (m) => m * pxm;
  // Etiket dizisi: 9 yönünden (batı) saat yönünde; işaretler (GİRİŞ, BUGÜN) dönem değil (stant-icerik §2.3)
  // İngilizce: tek satır (`en: null`), standın kendi EN etiketleri büyük harfle (DOKU_EN.halka; dönemler sözlükle denetli EN).
  const etiketler = EN_MI
    ? [
        { tr: BUYUK(DOKU_EN.halka.giris), en: null, isaret: true },
        ...donemler.slice(0, 6).map((d) => ({ tr: BUYUK(EN[d.ad]), en: null })),
        { tr: BUYUK(DOKU_EN.halka.bugun), en: null, isaret: true, altin: true },
        ...donemler.slice(6).map((d) => ({ tr: BUYUK(EN[d.ad]), en: null })),
      ]
    : [
        { tr: "GİRİŞ · ~12.000 YIL ÖNCE", en: "Start · 12,000 years ago", isaret: true },
        ...donemler.slice(0, 6).map((d) => ({ tr: TR(d.ad), en: EN[d.ad] })),
        { tr: "BUGÜN", en: "Today", isaret: true, altin: true },
        ...donemler.slice(6).map((d) => ({ tr: TR(d.ad), en: EN[d.ad] })),
      ];
  const orta = EN_MI ? DOKU_EN.zemin : { ust: "Buradasın", alt: stant.zemin.alt };
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
    if (e.en != null) {
      svg += `<text x="0" y="-8" text-anchor="middle" font-family="Mont" font-weight="700" font-size="${boy}" letter-spacing="7" fill="${renk}">${e.tr}</text>`;
      svg += `<text x="0" y="62" text-anchor="middle" font-family="Mont" font-style="italic" font-weight="500" font-size="42" fill="${PALET.krem}" fill-opacity=".72">${e.en}</text>`;
    } else {
      // tek satır (İngilizce): büyük harf yüksekliği (0,70 em) bandın ortasında. İngilizce adlar Türkçeden uzun ("LYCIAN –
      // HELLENISTIC"): taban çizgisi boyunca ≤ 740 px (etiket merkezinden komşu üçgene 400 px, üçgen yarısı 26 px; Türkçe en uzun
      // etiket ~830 px) — önce harf aralığı 7 → 3, sonra yazı boyu küçülür.
      svg += `<text data-halka="${i}" data-sig="svgw:740" x="0" y="${(0.35 * boy).toFixed(1)}" text-anchor="middle" font-family="Mont" font-weight="700" font-size="${boy}" letter-spacing="7" fill="${renk}">${e.tr}</text>`;
    }
    svg += `</g>`;
    // üçgen: iki etiketin arasında
    const au = 180 + ((i + 0.5) * 360) / n;
    const xu = c + bantOrta * Math.cos((au * Math.PI) / 180);
    const yu = c + bantOrta * Math.sin((au * Math.PI) / 180);
    svg += `<g transform="translate(${xu},${yu}) rotate(${au + 90})"><path d="M0,-30 L26,16 L-26,16 Z" fill="${PALET.altin}"/></g>`;
  }
  // orta: "Buradasın" küçük, "Bugün" büyük serif, altın ▲ — girişten (alt kenar) düz okunur
  svg += `<text x="${c}" y="${c - r(0.20)}" text-anchor="middle" font-family="Mont" font-weight="600" font-size="96" letter-spacing="10" fill="${PALET.koyuYesil}">${orta.ust}</text>`;
  svg += `<text x="${c}" y="${c + r(0.13)}" text-anchor="middle" font-family="Lora" font-weight="700" font-size="300" fill="${PALET.koyuYesil}">${orta.alt}</text>`;
  svg += `<path transform="translate(${c},${c + r(0.36)})" d="M0,-60 L62,44 L-62,44 Z" fill="${PALET.altin}"/>`;
  svg += `</svg>`;
  return sayfa(N, N, svg);
}

/* ---------------- kanopi bandı: 14,05 × 0,60 m → 8192 × 350 ---------------- */
function kanopi() {
  const metin = EN_MI ? DOKU_EN.tema : `${stant.tema} – ${stant.temaEn}`;
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
    .map((s) => `<div${EN_MI ? ` data-sig="w:1820"` : ""} style="font:${s.agirlik} ${s.boy}px/1.02 Mont;letter-spacing:${s.aralik ?? -2}px;white-space:nowrap">${s.metin}</div>`)
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
     <div style="position:absolute;inset:0;display:flex;align-items:center;padding-left:120px;color:#fff;font:italic 500 120px/1 Mont;letter-spacing:6px;white-space:nowrap">${EN_MI ? DOKU_EN.oyun : "Play – What would you do?"}</div>`,
  );
}
function bantOyna() {
  // Türkçe "Oyna – Sen olsan ne yapardın?"; İngilizce aynı bant düzeniyle "Play – What would you do?" ("Play" altın)
  const [on, soru] = EN_MI ? DOKU_EN.oyun.split(" – ") : ["Oyna", "Sen olsan ne yapardın?"];
  return sayfa(
    1500,
    210,
    `<div style="position:absolute;inset:0;background:#1E2A25"></div>
     <div style="position:absolute;inset:0;display:flex;align-items:center;padding-left:70px;color:#fff;font:500 82px/1 Mont;white-space:nowrap"><span style="color:${PALET.altin};font-weight:700">${on}</span>&nbsp;– ${soru}</div>`,
  );
}

/* ---------------- kiosk ekranı: 0,55 × 0,98 m → 550 × 980 (yalnız "Sen de söz ver.", sayı yok) ---------------- */
function kioskEkran() {
  return sayfa(
    550,
    980,
    `<div style="position:absolute;inset:0;background:#17241D"></div>
     <div style="position:absolute;left:50px;top:90px;font:600 26px/1 Mont;color:#9FB2A8;letter-spacing:.08em">${EN_MI ? BUYUK(DOKU_EN.tema) : TR(stant.tema)}</div>
     <div${EN_MI ? ` data-sig="alt:580"` : ""} style="position:absolute;left:50px;right:40px;top:330px;font:700 92px/1.08 Lora;color:#fff">${EN_MI ? DOKU_EN.kiosk : stant.kiosk.cagri}</div>
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
     <div style="position:absolute;left:46px;top:70px;font:700 24px/1 Mont;color:#C9D2CC;letter-spacing:.12em">${EN_MI ? BUYUK(DOKU_EN.tema) : TR(stant.tema)}</div>
     <div${EN_MI ? ` data-sig="alt:860"` : ""} style="position:absolute;left:46px;right:40px;top:300px;font:700 74px/1.12 Lora;color:${PALET.krem}">${EN_MI ? DOKU_EN.totem.slogan : stant.slogan}</div>
     <div style="position:absolute;left:46px;right:40px;bottom:110px;font:500 28px/1.35 Mont;color:#C9D2CC">${EN_MI ? DOKU_EN.totem.alt : stant.girisMetni[0]}</div>`,
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
const RAKAM_0 = 0.732; // Lora '0' mürekkebi (−16…716)/1000 → "rakam mürekkebi h" için font = h / 0,732 ('5' bayrağı 765'e çıkar)
// G-B arka duvar boyları (m; büyük harf yüksekliği, rakamlarda '0' mürekkebi) ve dikey aralıklar (mürekkep → mürekkep).
// Brief §14.4.4'ün boyları (başlık 0,26, buluşma rakamı 0,60, etiket 0,20, Şölen 0,20, "100.000+" 0,35, tarih/yer 0,14) pencereye
// (2,95 × ~2,8 m) birlikte sığmıyor: "Gençlik Buluşmaları" 0,26'da 3,55 m → iki satır; "gençlik buluşması" 0,20'de 2,42 m,
// "Bir Gençlik Şöleni" 2,43 m, "100.000+" 0,35'te 2,06 m → iki sütun yan yana kurulamıyor, satırlar alt alta. Okunurluk
// tabanları §12.3: başlık ≥ 40, rakam ≥ 60, ikincil ≥ 24 video px (POZ_A'da pencerede ~165–245 video px/m).
const ARKA = {
  zUst: 3.72, // "Gençlik" yükselen üstü: yatay telefonda (kirpimY 293, 844×390 cover) başlığın sağ ucu y ≥ 64 video px
  baslik: 0.26,
  baslikAra: 0.38, // iki başlık satırı taban aralığı (font boyunun 1,02'si; glif aralığı ≥ 0,09 m)
  cubukAra: 0.17, // turuncu vurgu çubuğu, büyük harf üstünden (E turu 3,26 → 3,43)
  en: 0.14,
  gEn: 0.07,
  gRakam: 0.07,
  bulusmaRakam: 0.48, // POZ_A'da ~86 video px; "100.000+"dan büyük kalır (blok hiyerarşisi)
  etiket: 0.14,
  etiketAra: 0.12, // "+" mürekkebi → etiket
  gBolum: 0.09, // Buluşmalar bloğu → Şölen bloğu
  solenBaslik: 0.2,
  gTarih: 0.06, // Şölen başlığı → tarih · yer
  tarihYer: 0.13, // 2,88 m; 0,13 altında sol uçta ikincil < 24 video px
  gSolen: 0.07, // tarih · yer → "100.000+"
  solenRakam: 0.35, // brief; satır "100.000+ genç" 2,77 m; sol uçtaki '1' ~62 video px (≥ 60)
  genc: 0.2,
  gencAra: 0.07, // "100.000+" → "genç" (sözcük arası)
  motto: 0.16,
  hashtag: 0.13,
};
const PAL = {
  krem: stant.palet.krem, // #F7E6CD
  yesil: stant.palet.koyuYesil, // #28332F
  turuncu: "#DF9560", // stant-icerik.md §3 (turuncu pankart birleşik medyanı)
};
// Metinler (birebir kaynaktan). G-B arka duvar (brief §14.4.4): kelimelerin kaynak cümlede geçtiği düzenli ifadeyle
// denetlenir; sayılar facts'ten toLocaleString("tr-TR") + "+". Kaynak değişirse betik durur (duvar yeniden bölünmeli).
const sayiYaz = (st) => st.value.toLocaleString("tr-TR") + (st.suffix ?? "");
const arti = (n) => {
  const s = n.toLocaleString("tr-TR") + "+";
  if (!/^\d{1,3}(\.\d{3})*\+$/.test(s)) throw new Error(`toLocaleString("tr-TR") beklenmedik: ${s} (Node ICU?)`);
  return s;
};
const bP = bulusmalar.paragraphs[3]; // content.ts:83 "… son 5 yılda … 30'dan fazla gençlik buluşması gerçekleştirilmiştir."
const mB = bP.match(/\b(son (\d+) yılda) .+? (\d+)'[dt][ae]n fazla (gençlik buluşması) /); // ek sayıya bağlı: 30'dan, 50'den
if (!mB || +mB[2] !== facts.meetingsYears || +mB[3] !== facts.meetings)
  throw new Error("content.ts bulusmalar.paragraphs[3] ya da facts.meetings/meetingsYears değişti; arka duvar yeniden kurulmalı");
const sP = solenler.paragraphs[0]; // content.ts:91 "16 Mayıs 2026 tarihinde Kocaeli Stadyumu'nda düzenlenen "Bir Gençlik Şöleni", … 100 binden fazla genci …"
const mS = sP.match(/^(.+?) tarihinde (.+?)'nda düzenlenen "(Bir Gençlik Şöleni)", .+ (\d+) binden fazla (genci) /);
if (!mS || mS[1] !== facts.solenDate || mS[2] !== facts.solenPlace || +mS[4] * 1000 !== facts.solenAttendees)
  throw new Error("content.ts solenler.paragraphs[0] ya da facts.solen* değişti; arka duvar yeniden kurulmalı");
// "genç": paragraphs[0]'daki "genci"nin yalın hâli (ç → c yumuşaması); "genç" gövdesi aynı bölümde birebir geçer
// (solenler.paragraphs[1] "gençlerle", [2] "gençlerin"). Uydurma kelime değil, ölçüt değişirse dur.
const GENC = "genç";
if (mS[5] !== "genci" || !solenler.paragraphs.slice(1).some((p) => p.includes(GENC)))
  throw new Error('content.ts solenler: "genci" / "genç…" bulunamadı');
const mQ = backCover.quote.match(/^"(AK Parti) (Her Anında) (Hep Yanında)"$/); // content.ts:115 (tırnaksız)
if (!mQ) throw new Error("content.ts backCover.quote değişti; pencere dışı slogan satırları yeniden bölünmeli");
const bB = bulusmalar.title.split(" "); // content.ts:78 "Gençlik Buluşmaları" → iki satır (tek satırda 3,55 m; pencere 2,95 m)
if (bB.length !== 2) throw new Error("content.ts bulusmalar.title iki kelime değil; başlık satırları yeniden bölünmeli");
const METIN_TR = {
  baslik: bB, // ["Gençlik", "Buluşmaları"]
  baslikEn: "Youth Meetings", // d6 EN satırı (brief §14.4.4; DOM'da data-onay="en"; onay-listesi)
  bulusmaSayi: arti(facts.meetings), // content.ts:153 → "30+"
  bulusma: mB[4], // "gençlik buluşması" (bulusmalar.paragraphs[3])
  bulusmaYil: mB[1], // "son 5 yılda" (aynı cümle; sayı = facts.meetingsYears denetlendi)
  solen: mS[3], // "Bir Gençlik Şöleni" (solenler.paragraphs[0])
  solenSayi: arti(facts.solenAttendees), // content.ts:155 → "100.000+"
  genc: GENC,
  solenTarihYer: `${facts.solenDate} · ${facts.solenPlace}`, // content.ts:156–157 (" · " ayırıcı, sol duvardaki "81 İl · 922 İlçe" gibi)
  motto: [mQ[1], mQ[2], mQ[3]], // "AK Parti" / "Her Anında" / "Hep Yanında"
  hashtag: stant.hashtag, // stant.ts:24 (= pankartlar[2], :78)
  uye: sayiYaz(stats[0]), // content.ts:22 → "1.000.000+"
  uyeEt: stats[0].label, // "Genç Üye"
  ilIlce: `${stats[1].value} ${stats[1].label} · ${stats[2].value} ${stats[2].label}`, // content.ts:23–24
  slogan: stant.pankartlar[1], // stant.ts:77
  program: `${stant.pankartlar[3]} →`, // stant.ts:79 (+ sondaki "→", stant.ts:25 ve :79 yorumu)
};
// İngilizce duvarlar (metin.ts DOKU_EN; EN alt satırı yok — başlık zaten İngilizce). baslik/motto/ilIlce düzen sırasında bölünür.
const METIN_EN = EN_MI
  ? {
      baslik: DOKU_EN.arka.baslik.split(" "),
      baslikTek: DOKU_EN.arka.baslik,
      baslikEn: null,
      bulusmaSayi: DOKU_EN.arka.bulusmaSayi,
      bulusma: DOKU_EN.arka.bulusma,
      bulusmaYil: DOKU_EN.arka.bulusmaYil,
      solen: DOKU_EN.arka.solen,
      solenSayi: DOKU_EN.arka.solenSayi,
      genc: DOKU_EN.arka.genc,
      solenTarihYer: DOKU_EN.arka.solenTarihYer,
      motto: DOKU_EN.arka.motto.split(/(?<=,) /), // "By Your Side," / "Every Moment"
      hashtag: DOKU_EN.arka.hashtag,
      uye: DOKU_EN.sol.uye,
      uyeEt: DOKU_EN.sol.uyeEt,
      ilIlce: DOKU_EN.sol.ilIlce,
      slogan: DOKU_EN.cephe.slogan,
      program: `${DOKU_EN.cephe.program} →`,
    }
  : null;
const METIN = EN_MI ? METIN_EN : METIN_TR;
// İngilizce dokularda kalmaması gereken Türkçe harfler (özel adlar hariç: GençİKlim, il adları, Göbekli Tepe …)
const TR_HARF = /[çğıöşüÇĞİÖŞÜ]/;
// (hashtag özel ad: İngilizce dokularda da "#YarınBanaEmanet"; müşteri düzeltmesi 8 Kasım 2026)
const TR_IZINLI = ["GençİKlim", "Göbekli", "Çorum", "Muğla", "Nevşehir", "Sultanhanı", "Diyarbakır", "Karabük", "Eskişehir", "Şanlıurfa", "Güllük", "Türkiye", stant.hashtag];
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
    `<svg xmlns="http://www.w3.org/2000/svg" width="${d.w}" height="${d.h}" viewBox="0 0 ${d.w} ${d.h}" lang="${DIL}" xml:lang="${DIL}" style="display:block;font-variant-numeric:normal;font-kerning:normal;font-variant-ligatures:no-common-ligatures">${ic}</svg>`,
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

  const L =(o) => ({ aile: "Lora", agirlik: 400, renk: PAL.yesil, zemin: PAL.krem, ...o });
  const M = (o) => ({ aile: "Mont", agirlik: 600, renk: PAL.yesil, zemin: PAL.krem, ...o });
  const kh = (h) => h / 0.7; // büyük harf yüksekliği → font boyu

  /* ---------- arka duvar (G-B §14.4.4): x −7,38…−1,80; telefon penceresi x −7,0…−3,95 (390×844'te görünen 592 video px,
     brief §2.1); fotoğraf yok. Satırlar font = 1 m ile ölçülür (canvas mürekkep üst/alt, genişlik), sonra yukarıdan aşağı
     dizilir: başlık iki satır (tek satırda 3,55 m) → EN → buluşma rakamı ("30+") ve yanında iki satır etiket → Şölen bloğu (sağa hizalı)
     → tarih · yer. Pencere dışında (yalnız yatay) slogan üç satır + hashtag (E turu "etkinlik" bloğunun yerinde). ---------- */
  const A = { ad: "duvar-arka.png", w: 2790, h: 2000, pxm: PXM, u0: -7.38, H: DUVAR_H, ofs: 5.33, pencere: [-7.0, -3.95] };
  A.zDag = (u) => zIc(A.ofs + (u - A.u0));
  const XL = -6.95; // pencere içi sol hiza
  const XR = -4.0; // Şölen bloğu sağ hizası (text-anchor end)
  const XD = -3.7; // pencere dışı (yalnız yatay)
  const B = ARKA;
  // Hashtag (pencere dışı, XD'ye sola hizalı): sağ ucu ile duvar ucu (A.u0 + A.w/PXM = −1,80) arasında ≥ HASH_PAY kalsın
  // (G-B'deki "#YaniBanaEmanet" payı 0,118 m). 8 Kasım 2026: "#YarınBanaEmanet" bir harf uzun → büyük harf 0,13 m'den
  // gerektiği kadar küçülür (ölçü _duvar-olcum.json "hashtag" kutusu ve arka_yerlesim.hashtag).
  const HASH_PAY = 0.118;
  const [mHash] = await metinMetrik(sayfaB, [M({ metin: METIN.hashtag, font: 1, ref: 1 })], 1000);
  const fHash = Math.min(kh(B.hashtag), (A.u0 + A.w / PXM - HASH_PAY - XD) / mHash.sag);
  const hashYerlesim = { buyuk_harf_m: +(0.7 * fHash).toFixed(4), hedef_m: B.hashtag, sag_pay_m: HASH_PAY, olcek: +(fHash / kh(B.hashtag)).toFixed(4) };
  const f = {
    t: kh(B.baslik),
    en: kh(B.en),
    n1: B.bulusmaRakam / RAKAM_0,
    e1: kh(B.etiket),
    e2: kh(B.etiket),
    s1: kh(B.solenBaslik),
    n2: B.solenRakam / RAKAM_0,
    g: kh(B.genc),
    ty: kh(B.tarihYer),
  };
  if (!EN_MI) {
    const sat = {
      b1: L({ metin: METIN.baslik[0], agirlik: 600, ref: 0 }),
      b2: L({ metin: METIN.baslik[1], agirlik: 600, ref: 0 }),
      en: L({ metin: METIN.baslikEn, italik: true, ref: 6 }),
      n1: L({ metin: METIN.bulusmaSayi, agirlik: 700, ref: 1 }),
      e1: L({ metin: METIN.bulusma, agirlik: 600, ref: 4 }),
      e2: L({ metin: METIN.bulusmaYil, ref: 4 }),
      s1: L({ metin: METIN.solen, agirlik: 600, ref: 0 }),
      n2: L({ metin: METIN.solenSayi, agirlik: 700, ref: 0 }),
      g: L({ metin: METIN.genc, agirlik: 600, ref: 2 }),
      ty: L({ metin: METIN.solenTarihYer, ref: 3 }),
    };
    const anah = Object.keys(sat);
    const olc = await metinMetrik(sayfaB, anah.map((k) => ({ ...sat[k], font: 1 })), 1000);
    const m = Object.fromEntries(anah.map((k, i) => [k, olc[i]]));
    const ust = (k) => m[k].ust * (f[k] ?? f.t), alt = (k) => m[k].alt * (f[k] ?? f.t);
    const z = {};
    z.b1 = B.zUst - m.b1.ust * f.t;
    z.b2 = z.b1 - B.baslikAra;
    z.en = z.b2 - m.b2.alt * f.t - B.gEn - ust("en");
    const ust50 = z.en - alt("en") - B.gRakam; // buluşma rakamının mürekkep üstü ("30+": '3'/'0' 716/1000; G'deki "50+": '5' bayrağı 765)
    z.n1 = ust50 - ust("n1");
    z.e1 = ust50 - ust("e1"); // etiket 1. satır: yükselenler rakamın mürekkep üstüyle aynı
    z.e2 = z.n1; // etiket 2. satır: rakamla aynı taban
    // Şölen bloğu: başlık → tarih · yer → "100.000+ genç" (rakam satırı en altta: tarih satırı 2,88 m, sol ucu bitkinin
    // önünde kalmasın diye z ≥ 1,3'te; rakam satırı −6,42'den başlar, dağın alçak kısmının üstünde; DOM bant satırı (2) ile
    // aynı sıra)
    z.s1 = Math.min(z.n1 - alt("n1"), z.e2 - alt("e2")) - B.gBolum - ust("s1");
    z.ty = z.s1 - alt("s1") - B.gTarih - ust("ty");
    z.n2 = z.ty - alt("ty") - B.gSolen - ust("n2");
    z.g = z.n2;
    const uEt = XL + m.n1.sag * f.n1 + B.etiketAra; // etiketler "+" mürekkebinin sağında
    const uN2 = XR - m.g.gen * f.g - B.gencAra; // "100.000+" sonu → boşluk → "genç"
    const altSinir = Math.min(z.n2 - alt("n2"), z.g - alt("g"));
    A.yerlesim = {
      boylar_m: B,
      font_m: Object.fromEntries(Object.entries(f).map(([k, v]) => [k, +v.toFixed(4)])),
      taban_z_m: Object.fromEntries(Object.entries(z).map(([k, v]) => [k, +v.toFixed(4)])),
      etiket_u_m: +uEt.toFixed(4),
      solen_sayi_bitis_u_m: +uN2.toFixed(4),
      son_satir_alt_z_m: +altSinir.toFixed(4),
      hashtag: hashYerlesim,
    };
    const Yz = (k, ad, o) => Y(ad, sat[k].metin, { ...sat[k], font: f[k] ?? f.t, z: z[k], ...o });
    A.yazilar = [
      Yz("b1", "baslik_1", { u: XL, hedef: ["başlık büyük harf ('G', taşma payıyla)", B.baslik] }),
      Yz("b2", "baslik_2", { u: XL, hedef: ["başlık büyük harf ('B')", B.baslik] }),
      Yz("en", "baslik_en", { u: XL, hedef: ["ikincil (EN) büyük harf ('M')", B.en] }),
      Yz("n1", "bulusma_sayi", { u: XL, hedef: ["rakam mürekkebi ('0')", B.bulusmaRakam], capa: "bulusma" }),
      Yz("e1", "bulusma", { u: uEt, hedef: ["ikincil, büyük harf ölçeği ('l' yükselen)", B.etiket] }),
      Yz("e2", "bulusma_yil", { u: uEt, hedef: ["ikincil (rakam '5')", B.etiket] }),
      Yz("s1", "solen", { u: XR, hiza: "end", hedef: ["büyük harf ('B')", B.solenBaslik] }),
      Yz("n2", "solen_sayi", { u: uN2, hiza: "end", hedef: ["rakam mürekkebi ('0'; ölçülen '1')", B.solenRakam], capa: "solen" }),
      Yz("g", "genc", { u: XR, hiza: "end", hedef: ["büyük harf ölçeği ('n' x yüksekliği)", B.genc] }),
      Yz("ty", "solen_tarih_yer", { u: XR, hiza: "end", hedef: ["ikincil büyük harf ('M')", B.tarihYer] }),
      // pencere dışı (x −3,7…−1,8): yalnız yatayda; E turu "etkinlik" bloğunun satır düzeni
      Y("motto_1", METIN.motto[0], L({ u: XD, z: 2.7, font: kh(B.motto), ref: 1, hedef: ["büyük harf ('K')", B.motto], capa: "motto", pencereDisi: true })),
      Y("motto_2", METIN.motto[1], L({ u: XD, z: 2.42, font: kh(B.motto), ref: 0, hedef: ["büyük harf ('H')", B.motto], capa: "motto", pencereDisi: true })),
      Y("motto_3", METIN.motto[2], L({ u: XD, z: 2.14, font: kh(B.motto), ref: 0, hedef: ["büyük harf ('H')", B.motto], capa: "motto", pencereDisi: true })),
      Y("hashtag", METIN.hashtag, M({ u: XD, z: 1.8, font: fHash, ref: 1, hedef: ["büyük harf", hashYerlesim.buyuk_harf_m], pencereDisi: true })),
    ];
    const cubuk = z.b1 + 0.7 * f.t + B.cubukAra; // başlık büyük harf üstü + 0,17 m (E turu: 3,26 → 3,43)
    A.sekiller = [
      kutuSvg(A, XL, XL + 0.4, cubuk, cubuk + 0.03, PAL.turuncu), // başlık üstü vurgu (metin değil)
      kutuSvg(A, XD, XD + 0.4, 2.98, 3.01, PAL.turuncu), // pencere dışı blok vurgusu (E turu ile aynı)
    ];
  } else {
    // İngilizce arka duvar (DOKU_EN.arka): aynı boylar, hizalar ve dikey aralıklar; EN alt satırı yok (başlık zaten İngilizce).
    // Başlık pencereye (sağ pay ≥ 0,05 m) sığarsa tek satır. "100,000+ young people" tek satıra sığmıyor (rakam 0,35 m'de
    // ≈ 2,0 m + sözcük ≈ 1,8 m > 2,95 m) → "young people" rakamın altında, sağa hizalı (sığarsa Türkçedeki gibi yan yana).
    // Etiket satırları ("youth meetings" / "in the last 5 years") rakamın sağına sığmazsa küçülür (ikincil ≥ 0,12 m).
    const PAY = 0.05;
    // Tek satır başlık pencerenin sağ ucuna (−4,2) dek uzanır; o uç kameraya yakın, yatay telefon kırpımında (kirpimY 293,
    // 844×390 cover) zUst 3,72'de üstü y 29 video px'e çıkıyordu (Türkçe kural ≥ 64; önizleme .qa/icinden-en/render) →
    // başlık bloğu 0,24 m aşağıda (~210 video px/m: y ≈ 80). Türkçedeki EN satırı (≈ 0,25 m) kalktığı için blok araları biraz
    // geniş (başlık → rakam 0,12; buluşma → Şölen 0,11; tarih → rakam 0,08); alt kenar Türkçeyle aynı düzeyde.
    const EK = { zUstTek: B.zUst - 0.24, gRakam: 0.12, gBolum: 0.11, gSolen: 0.08, gGenc: 0.07, etiketEnAz: 0.12 };
    const refi = (t, ch) => {
      const i = t.indexOf(ch);
      if (i < 0) throw new Error(`"${t}" içinde '${ch}' yok (ölçü harfi)`);
      return i;
    };
    const sat = {
      bt: L({ metin: METIN.baslikTek, agirlik: 600, ref: 0 }),
      b1: L({ metin: METIN.baslik[0], agirlik: 600, ref: 0 }),
      b2: L({ metin: METIN.baslik.slice(1).join(" "), agirlik: 600, ref: 0 }),
      n1: L({ metin: METIN.bulusmaSayi, agirlik: 700, ref: 1 }),
      e1: L({ metin: METIN.bulusma, agirlik: 600, ref: refi(METIN.bulusma, "h") }),
      e2: L({ metin: METIN.bulusmaYil, ref: refi(METIN.bulusmaYil, "5") }),
      s1: L({ metin: METIN.solen, agirlik: 600, ref: 0 }),
      n2: L({ metin: METIN.solenSayi, agirlik: 700, ref: 0 }),
      g: L({ metin: METIN.genc, agirlik: 600, ref: refi(METIN.genc, "n") }),
      ty: L({ metin: METIN.solenTarihYer, ref: 0 }),
    };
    const anah = Object.keys(sat);
    const olc = await metinMetrik(sayfaB, anah.map((k) => ({ ...sat[k], font: 1 })), 1000);
    const m = Object.fromEntries(anah.map((k, i) => [k, olc[i]]));
    const tek = XL + m.bt.sag * f.t <= A.pencere[1] - PAY;
    const uEt = XL + m.n1.sag * f.n1 + B.etiketAra; // etiketler "+" mürekkebinin sağında
    f.e1 = f.e2 = Math.min(kh(B.etiket), (A.pencere[1] - PAY - uEt) / Math.max(m.e1.sag, m.e2.sag));
    if (0.7 * f.e1 < EK.etiketEnAz) throw new Error(`EN etiket satırları sığmıyor (büyük harf ${(0.7 * f.e1).toFixed(3)} m)`);
    f.bt = f.b1 = f.b2 = f.t;
    const ust = (k) => m[k].ust * f[k], alt = (k) => m[k].alt * f[k];
    const z = {};
    let altBaslik;
    if (tek) {
      z.bt = EK.zUstTek - ust("bt");
      altBaslik = z.bt - alt("bt");
    } else {
      z.b1 = B.zUst - ust("b1");
      z.b2 = z.b1 - B.baslikAra;
      altBaslik = z.b2 - alt("b2");
    }
    const ustN = altBaslik - EK.gRakam; // buluşma rakamının mürekkep üstü
    z.n1 = ustN - ust("n1");
    z.e1 = ustN - ust("e1");
    z.e2 = z.n1;
    z.s1 = Math.min(z.n1 - alt("n1"), z.e2 - alt("e2")) - EK.gBolum - ust("s1");
    z.ty = z.s1 - alt("s1") - B.gTarih - ust("ty");
    z.n2 = z.ty - alt("ty") - EK.gSolen - ust("n2");
    // "100,000+" + "young people" yan yana sığar mı (sol uç pencere payının içinde)?
    const yanYana = XR - m.g.gen * f.g - B.gencAra - m.n2.gen * f.n2 - m.n2.sol * f.n2 >= A.pencere[0] + PAY;
    const uN2 = yanYana ? XR - m.g.gen * f.g - B.gencAra : XR;
    z.g = yanYana ? z.n2 : z.n2 - alt("n2") - EK.gGenc - ust("g");
    const altSinir = Math.min(z.n2 - alt("n2"), z.g - alt("g"));
    A.yerlesim = {
      dil: DIL,
      baslik_tek_satir: tek,
      genc_yan_yana: yanYana,
      boylar_m: { ...B, etiket: +(0.7 * f.e1).toFixed(4) },
      ek_aralik_m: EK,
      font_m: Object.fromEntries(Object.entries(f).map(([k, v]) => [k, +v.toFixed(4)])),
      taban_z_m: Object.fromEntries(Object.entries(z).map(([k, v]) => [k, +v.toFixed(4)])),
      etiket_u_m: +uEt.toFixed(4),
      solen_sayi_bitis_u_m: +uN2.toFixed(4),
      son_satir_alt_z_m: +altSinir.toFixed(4),
      hashtag: hashYerlesim,
    };
    const Yz = (k, ad, o) => Y(ad, sat[k].metin, { ...sat[k], font: f[k], z: z[k], ...o });
    const ml = METIN.motto; // pencere dışı (yalnız yatay): Türkçe üç satırın ortasına iki satır, aynı satır aralığı (0,28 m)
    const zM = [2.56, 2.28];
    if (ml.length !== zM.length) throw new Error(`EN motto ${ml.length} satır (2 beklenir): ${ml.join(" / ")}`);
    A.yazilar = [
      ...(tek
        ? [Yz("bt", "baslik", { u: XL, hedef: ["başlık büyük harf ('Y', tek satır)", B.baslik] })]
        : [Yz("b1", "baslik_1", { u: XL, hedef: ["başlık büyük harf", B.baslik] }), Yz("b2", "baslik_2", { u: XL, hedef: ["başlık büyük harf", B.baslik] })]),
      Yz("n1", "bulusma_sayi", { u: XL, hedef: ["rakam mürekkebi ('0')", B.bulusmaRakam], capa: "bulusma" }),
      Yz("e1", "bulusma", { u: uEt, hedef: ["ikincil, büyük harf ölçeği ('h' yükselen)", +(0.7 * f.e1).toFixed(3)] }),
      Yz("e2", "bulusma_yil", { u: uEt, hedef: ["ikincil (rakam '5')", +(0.7 * f.e2).toFixed(3)] }),
      Yz("s1", "solen", { u: XR, hiza: "end", hedef: ["büyük harf ('Y')", B.solenBaslik] }),
      Yz("n2", "solen_sayi", { u: uN2, hiza: "end", hedef: ["rakam mürekkebi ('0'; ölçülen '1')", B.solenRakam], capa: "solen" }),
      Yz("g", "genc", { u: XR, hiza: "end", hedef: ["büyük harf ölçeği ('n' x yüksekliği)", B.genc] }),
      Yz("ty", "solen_tarih_yer", { u: XR, hiza: "end", hedef: ["ikincil büyük harf ('M')", B.tarihYer] }),
      ...ml.map((t, i) => Y(`motto_${i + 1}`, t, L({ u: XD, z: zM[i], font: kh(B.motto), ref: 0, hedef: ["büyük harf", B.motto], capa: "motto", pencereDisi: true }))),
      Y("hashtag", METIN.hashtag, M({ u: XD, z: zM.at(-1) - 0.34, font: fHash, ref: 1, hedef: ["büyük harf", hashYerlesim.buyuk_harf_m], pencereDisi: true })),
    ];
    const cubuk = (tek ? z.bt : z.b1) + 0.7 * f.t + B.cubukAra;
    const cubukM = zM[0] + 0.7 * kh(B.motto) + 0.11; // Türkçede motto üstü + 0,11 m (2,868 → 2,98)
    A.sekiller = [
      kutuSvg(A, XL, XL + 0.4, cubuk, cubuk + 0.03, PAL.turuncu), // başlık üstü vurgu (metin değil)
      kutuSvg(A, XD, XD + 0.4, cubukM, cubukM + 0.03, PAL.turuncu), // pencere dışı blok vurgusu
    ];
  }

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
  if (EN_MI) {
    // "81 Provinces · 922 Districts" 0,20 m büyük harfle telefon penceresine (2,5 m) sığmıyorsa " · "dan iki satır, aynı boy:
    // üst satırın üstü "Young Members"ın inen harflerinden ≥ 0,10 m aşağıda, alt satır ekranların (z 1,82) ≥ 0,12 m üstünde.
    const [gIl] = await metinMetrik(sayfaB, [{ ...S.yazilar[2], font: 1 }], 1000);
    if (gIl.gen * kh(0.2) > S.pencere[1] - S.pencere[0] - 0.1) {
      const [p1, p2] = METIN.ilIlce.split(" · ");
      S.yazilar[2] = Y("il_ilce", p1, L({ u: YC, z: 2.23, font: kh(0.2), agirlik: 600, hiza: "middle", ref: 1, hedef: ["büyük harf (rakam '1')", 0.2], capa: "il_ilce" }));
      S.yazilar.push(Y("il_ilce_2", p2, L({ u: YC, z: 1.94, font: kh(0.2), agirlik: 600, hiza: "middle", ref: 0, hedef: ["büyük harf (rakam '9')", 0.2], capa: "il_ilce" })));
    }
  }
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
  const slTaban = CEPHE_DAG.zUst + 0.15 + (EN_MI ? slM.at(-1).alt * fSl : 0); // İngilizce: "heritage"deki 'g' dağa değmesin
  C.yazilar = [
    ...sl.map((s, i) =>
      Y(`slogan_${i + 1}`, s, L({ u: 2.15, z: slTaban + (sl.length - 1 - i) * slAra, font: fSl, agirlik: 700, ref: [1, 2, 0][i], hedef: ["büyük harf (ölçek)", 0.7 * fSl] })),
    ),
    Y("c_hashtag", METIN.hashtag, M({ u: 2.15, z: 0.42, font: kh(0.2), renk: PAL.turuncu, zemin: PAL.yesil, ref: 1, hedef: ["büyük harf", 0.2] })),
    Y("c_program", METIN.program, M({ u: 6.4, z: 0.14, font: kh(0.13), renk: PAL.krem, zemin: PAL.yesil, hiza: "end", ref: 5, hedef: ["büyük harf", 0.13] })),
  ];
  C.sekiller = []; // logo yok; süs çubuğu da yok (slogan duvarın üst kenarına yakın)
  C.zDag = (u) => zCep(u - C.u0);

  // 2 × 50″ ekran: 8 Kasım 2026'dan beri yazı yok, fotoğraf (EKRAN_FOTO; sharp, Chrome'suz).

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
  for (const d of [A, S, C]) d.html = ciz(d);
  return {
    duvarlar: [A, S, C],
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
        harf.push({ ad: o.ad, harf: o.metin[o.ref], olculen_px: b - a + 1, ust_px: ya + a, alt_px: ya + b, taban_px: +yb.toFixed(2), font_px: +fs.toFixed(2), x_px: [Math.round(e.x), Math.round(e.x + e.width)] });
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
  const komsu = []; // farklı yazıların glif kutuları arası en küçük açıklık < 0,15 m (yerleşim payı; bilgi)
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
      if (best.ara < 0.15) komsu.push({ a: adlar[i], b: adlar[j], harfler: `${best.a}|${best.b}`, ara_m: +best.ara.toFixed(3) });
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
    komsu_aralik: komsu.sort((p, q) => p.ara_m - q.ara_m),
    uyari,
  };
}

const isler = [
  ...emanetAlanlari.map((a) => [`sutun-${iki(a.no)}.png`, sutunYuzu(a), 600, 3000, false]),
  ["halka.png", halka(), 4096, 4096, true],
  ["kanopi.png", kanopi(), 8192, 350, false],
  [
    "pankart-gel.png",
    // İngilizce: yalnız standın EN satırı "Come and play!" (Türkçedeki büyük satır boyunda; taşarsa sığdırılır)
    pankartDikey(
      EN_MI
        ? [{ metin: DOKU_EN.gel, boy: 205, agirlik: 800 }]
        : [
            { metin: "Gel, oyna!", boy: 205, agirlik: 800 },
            { metin: "Come and play!", boy: 130, agirlik: 600 },
          ],
    ),
    2000,
    500,
    false,
  ],
  [
    "pankart-sifir.png",
    pankartDikey(
      EN_MI
        ? [
            { metin: DOKU_EN.sifir[0], boy: 150, agirlik: 800 },
            { metin: DOKU_EN.sifir[1], boy: 96, agirlik: 600 },
          ]
        : [
            { metin: "Sıfır Atık Yöneticileri", boy: 150, agirlik: 800 },
            { metin: "COP31'e Giden Yol – DengeCOP31", boy: 96, agirlik: 600 },
          ],
    ),
    2000,
    500,
    false,
  ],
  ["bant-play.png", bantPlay(), 2200, 210, false],
  ["bant-oyna.png", bantOyna(), 1500, 210, false],
  ["kiosk-ekran.png", kioskEkran(), 550, 980, false],
  ["totem.png", totem(), 550, 1100, false],
];

// İngilizce: sütun yüzleri İngilizce metinle (Türkçe sıra ve renkler aynı)
if (EN_MI) for (const [i, a] of emanetAlanlari.entries()) isler[i][1] = sutunYuzuEn(a);

/** `data-sig="w:<px>"` (genişlik) / `"alt:<px>"` (alt kenar y) sınırını aşan öğenin yazısı 2 px adımla küçülür (yalnız --dil en). */
async function sigdir(sayfaB) {
  return sayfaB.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("[data-sig]")) {
      const [tip, sinir] = el.dataset.sig.split(":");
      const olc = () => (tip === "svgw" ? el.getComputedTextLength() : tip === "w" ? el.getBoundingClientRect().width : el.getBoundingClientRect().bottom);
      const ilk = parseFloat(getComputedStyle(el).fontSize);
      let fs = ilk;
      const bas = olc();
      let ls = parseFloat(el.getAttribute("letter-spacing") ?? "0");
      const ls0 = ls;
      while (tip === "svgw" && olc() > +sinir && ls > 3) el.setAttribute("letter-spacing", String(--ls));
      while (olc() > +sinir && fs > 8) {
        fs -= 2;
        el.style.fontSize = `${fs}px`;
        if (el.dataset.halka != null) el.setAttribute("y", (0.35 * fs).toFixed(1)); // zemin halkası: bandın ortasında kalsın
      }
      out.push({ metin: el.textContent, tip, sinir: +sinir, olcu_px: +bas.toFixed(1), son_olcu_px: +olc().toFixed(1), font_px: [ilk, fs], ...(ls !== ls0 ? { harf_araligi: [ls0, ls] } : {}) });
    }
    return out;
  });
}
/** İngilizce dokunun metinlerinde Türkçe harf (izinli özel adlar dışında) kalmış mı? */
function trHarfDenetim(ad, metinler) {
  const kalan = [];
  for (const t of metinler)
    for (const sozcuk of String(t).split(/[\s,.;:–·/!?()"]+/))
      if (TR_HARF.test(sozcuk) && !TR_IZINLI.some((iz) => sozcuk.startsWith(iz))) kalan.push(sozcuk);
  if (kalan.length) throw new Error(`${ad}: İngilizce dokuda Türkçe harfli sözcük: ${kalan.join(", ")}`);
}

const DUVAR_ADLARI = ["duvar-arka.png", "duvar-sol.png", "cephe-on.png"];
/* ---------- 2 × 50″ ekran (d7 sol duvarı): 1,11 × 0,62 m → 1110 × 620 (1000 px/m), FOTOĞRAF (8 Kasım 2026, müşteri: "bu panolara
   fotoğraf koyulabilir, 3 tane make your pledge too fazla olmuş"). Kaynak 1200 × 1600 dikey; "cover": genişlik 1110'a (lanczos3,
   1110 × 1480), `ust` px'ten 620 satır (kaynakta ust / 0,925 … + 670 px). Kırpımlar başlar kesilmeden seçildi: fidan merkez kırpımda
   (430) sağdaki gencin saçı üst kenara ~10 px kalıyordu → 390 (üstte ~45 px pay; sol ve ortadaki gençler dizden yukarı); çöp
   toplamada kişiler alt-ortada → 675 (üç gönüllü başlarından, iki gencin ayakları ve torbalar kadrajda). Dilden bağımsız. ---------- */
const EKRAN_FOTO = [
  { ad: "ekran-fidan.png", kaynak: "public/photos/fidan-dikimi-ekip.jpg", ust: 390, ekran: "ekran_soz_0 (güney, y 1,05…2,16; içeriden bakana solda)" },
  { ad: "ekran-cop.png", kaynak: "public/photos/cop-toplama-orman.jpg", ust: 675, ekran: "ekran_soz_1 (kuzey, y 2,20…3,31; sağda)" },
];
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
const sigdirma = {};
const metinler = {};
for (const [ad, html, w, h, alfa, d] of isler) {
  if (!ister(ad)) continue;
  await sayfaB.setViewportSize({ width: w, height: h });
  await sayfaB.setContent(html, { waitUntil: "load" });
  await sayfaB.evaluate(() => document.fonts.ready);
  await sayfaB.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  if (EN_MI) {
    const sg = await sigdir(sayfaB);
    if (sg.length) {
      sigdirma[ad] = sg;
      for (const x of sg)
        if (x.font_px[0] !== x.font_px[1] || x.harf_araligi)
          console.log(`  sığdırma ${ad}: "${x.metin}" ${x.tip} ${x.olcu_px} > ${x.sinir} → font ${x.font_px[0]} → ${x.font_px[1]} px${x.harf_araligi ? `, harf aralığı ${x.harf_araligi.join(" → ")}` : ""}`);
      await sayfaB.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    }
    const yazilar = await sayfaB.evaluate(() => {
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const o = [];
      while (w.nextNode()) if (w.currentNode.textContent.trim()) o.push(w.currentNode.textContent.trim());
      return o;
    });
    trHarfDenetim(ad, yazilar);
    metinler[ad] = yazilar; // _dokular.json: dokuya basılan bütün yazılar (rapor / denetim)
  }
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
const fotolar = {};
for (const e of EKRAN_FOTO) {
  if (!ister(e.ad)) continue;
  const W = 1110, H = 620;
  const kaynak = path.join(KOK, e.kaynak);
  const meta = await sharp(kaynak).metadata();
  if (meta.width !== 1200 || meta.height !== 1600) throw new Error(`${e.kaynak}: ${meta.width}×${meta.height} (kırpım 1200×1600 için seçildi)`);
  const hOlcek = Math.round((meta.height * W) / meta.width); // 1480
  if (e.ust < 0 || e.ust + H > hOlcek) throw new Error(`${e.ad}: ust ${e.ust} + ${H} > ${hOlcek}`);
  const png = await sharp(kaynak).resize(W, hOlcek, { kernel: "lanczos3" }).extract({ left: 0, top: e.ust, width: W, height: H }).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(path.join(OUT, e.ad), png);
  uretilen.push(e.ad);
  // doku istatistikleri (sRGB 8 bit): Rec.709 luma ortalaması / p99, beyaza yakın (en büyük kanal ≥ 250) piksel oranı
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const lumalar = [];
  let beyaz = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    lumalar.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
    if (Math.max(data[i], data[i + 1], data[i + 2]) >= 250) beyaz++;
  }
  lumalar.sort((p, q) => p - q);
  const n = lumalar.length;
  fotolar[e.ad] = {
    kaynak: e.kaynak,
    ekran: e.ekran,
    kirpim: { olcekli: [W, hOlcek], ust_px: e.ust, kaynak_y_px: [+(e.ust / (W / meta.width)).toFixed(1), +((e.ust + H) / (W / meta.width)).toFixed(1)] },
    bayt: png.length,
    luma_ort: +(lumalar.reduce((p, q) => p + q, 0) / n).toFixed(1),
    luma_p99: +lumalar[Math.floor(0.99 * n)].toFixed(1),
    beyaz_oran: +(beyaz / n).toFixed(4),
  };
  console.log("yazıldı", e.ad, W, "×", H, `${png.length} B · ${e.kaynak} y ${e.ust} · luma ort ${fotolar[e.ad].luma_ort} p99 ${fotolar[e.ad].luma_p99} · ≥250 %${(100 * fotolar[e.ad].beyaz_oran).toFixed(2)}`);
}
if (duvar) {
  // Kısmi çalışma (--sadece): bu çalışmada üretilmeyen duvar dokularının ölçümleri ve çapaları eski _duvar-olcum.json'dan
  // korunur (ör. yalnız arka duvar yeniden üretilince sol duvarın uye / il_ilce çapaları p7 için kalır).
  const OLCUM = path.join(OUT, "_duvar-olcum.json");
  let eski = null;
  if (!DUVAR_ADLARI.every(ister)) {
    try {
      eski = JSON.parse(await readFile(OLCUM, "utf8"));
    } catch {
      eski = null;
    }
  }
  const korunan = Object.keys(eski?.dokular ?? {}).filter((ad) => !olcum[ad]);
  const tumOlcum = { ...Object.fromEntries(korunan.map((ad) => [ad, eski.dokular[ad]])), ...olcum };
  const kose =
    tumOlcum["duvar-sol.png"] && tumOlcum["duvar-arka.png"]
      ? { sol_sag_kenar_px: tumOlcum["duvar-sol.png"].kenar.sag, arka_sol_kenar_px: tumOlcum["duvar-arka.png"].kenar.sol }
      : null;
  if (kose) console.log(`köşe sürekliliği (siluet üst satırı): sol sağ ucu ${kose.sol_sag_kenar_px} px, arka sol ucu ${kose.arka_sol_kenar_px} px`);
  // p6/p7 çapaları (S2 sahne.py duvar_capalari): aynı adı taşıyan yazıların birleşik mürekkep kutusunun ortası (motto:
  // üç satır); dünya = montajlı durum (Z0 = 0,05; baskı 5 mm). kutu_*: yedek aday aralığı (sahne.py, kırpım dışına düşerse).
  const Z0 = 0.05, BASKI = 0.005;
  const dunya = (ad, u, z) =>
    ad === "duvar-sol.png" ? [-7.38 + BASKI, u, Z0 + z] : ad === "duvar-arka.png" ? [u, 4.83 - BASKI, Z0 + z] : [u, -4.95 - BASKI, Z0 + z];
  const capalar = {};
  for (const [ad, v] of Object.entries(eski?.capalar ?? {})) if (korunan.includes(v.doku)) capalar[ad] = v;
  for (const [ad, o] of Object.entries(olcum)) {
    const grup = {};
    for (const k of o.kutular ?? []) if (k.capa) (grup[k.capa] ??= []).push(k);
    for (const [c, ks] of Object.entries(grup)) {
      const u0 = Math.min(...ks.map((k) => k.u_m[0])), u1 = Math.max(...ks.map((k) => k.u_m[1]));
      const z0 = Math.min(...ks.map((k) => k.z_m[0])), z1 = Math.max(...ks.map((k) => k.z_m[1]));
      const u = (u0 + u1) / 2, z = (z0 + z1) / 2;
      capalar[c] = {
        doku: ad,
        u_m: +u.toFixed(3),
        z_m: +z.toFixed(3),
        dunya: dunya(ad, u, z).map((v) => +v.toFixed(3)),
        kutu_u_m: [+u0.toFixed(3), +u1.toFixed(3)],
        kutu_z_m: [+z0.toFixed(3), +z1.toFixed(3)],
        yazilar: ks.map((k) => k.ad),
      };
    }
  }
  const arkaD = duvar.duvarlar.find((d) => d.ad === "duvar-arka.png");
  await writeFile(
    OLCUM,
    JSON.stringify(
      {
        uretim: new Date().toISOString(),
        betik: "scripts/blender/s2/dokular.mjs",
        brief: "docs/brief-icinden-3.md §12.3 (E turu duvarları), §14.4.4 (G-B arka duvar)",
        koordinat: "u: duvar boyunca (arka/cephe x, sol y), z: duvar altından (sahnede Z0 = 0,05 eklenir); px = (u − u0)·500, (4 − z)·500",
        bu_calisma: Object.keys(olcum),
        korunan: korunan.length ? { dokular: korunan, kaynak: `önceki _duvar-olcum.json (${eski.uretim})` } : null,
        profil: duvar.profil,
        kose,
        capalar,
        arka_yerlesim: olcum["duvar-arka.png"] ? arkaD.yerlesim : (eski?.arka_yerlesim ?? null),
        palet_kontrast: {
          "#28332F/#F7E6CD": +kontrast(PAL.yesil, PAL.krem).toFixed(2),
          "#F7E6CD/#28332F": +kontrast(PAL.krem, PAL.yesil).toFixed(2),
          "#DF9560/#28332F": +kontrast(PAL.turuncu, PAL.yesil).toFixed(2),
          "#DF9560/#F7E6CD (yalnız süs çubuğu, yazı değil)": +kontrast(PAL.turuncu, PAL.krem).toFixed(2),
        },
        dokular: tumOlcum,
      },
      null,
      1,
    ),
  );
}
const tumu = [...new Set([...isler.map((i) => i[0]), ...DUVAR_ADLARI, ...EKRAN_FOTO.map((e) => e.ad)])];
await writeFile(
  path.join(OUT, "_dokular.json"),
  JSON.stringify({ uretim: new Date().toISOString(), betik: "scripts/blender/s2/dokular.mjs", ...(EN_MI ? { dil: DIL, metin: "src/components/icinden/metin.ts DOKU_EN", sigdirma, metinler } : {}), dosyalar: tumu, bu_calisma: uretilen, ...(Object.keys(fotolar).length ? { ekran_fotograflari: fotolar } : {}) }, null, 1),
);
