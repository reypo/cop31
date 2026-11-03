// /icinden v3 — Blender fragmanları + kodlama listesi → src/components/icinden/klipler.json
// Şema: docs/klipler-sema.md. A turunda yer tutucu, B turunda gerçek render AYNI yoldan geçer.
//
//   node scripts/icinden/manifest-birlestir.mjs [--fragman D:/soft/cop31-varlik/render-son]
//        [--liste D:/soft/cop31-varlik/kodlama/<fragman klasör adı>.json]
//        [--cikti src/components/icinden/klipler.json] [--kaynak render|onizleme|yer-tutucu] [--public public]
//        [--ton D:/soft/cop31-varlik/kodlama/<fragman klasör adı>-kapak-ton.json]
//
// Fragman (`<dizin>/<klip>.json`, master px, §9.3): {ad, fps, kare, sure, kadraj_m[kare], dunyaR[kare] (t01),
// dunyaC [cx, cy] (t01; tek nokta ya da kare başına), capalar {ad: [x, y]} (poster karesi), brosur_dikdortgen
// [4×[x, y]] (t56 son kare), kamera{}}. Master → video uzayı: dikey ((x−420)/1,5, y/1,5), yatay (x/1,5,
// (y − kirpimY)/1,5); kirpimY klip başına (kodla.mjs KIRPIM_Y → liste öğesinin `kirpimY`'si; yoksa 420; §11.2-5:
// d3'te l3/p3 200). Çapanın klibi ve karesi: etiket/sütun → poster karesi (döngü 0. karesi ya da gelen geçişin son
// karesi), dunyaC → t01 0. kare, brosurDikdortgen → t56 son kare. LQIP: posterden 24 px genişlikte WebP (sharp).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import sharp from "sharp";
import { fragmanOku } from "./fragman.mjs";

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const FRAGMAN = resolve(arg("--fragman", "D:/soft/cop31-varlik/render-son"));
const LISTE = resolve(arg("--liste", `D:/soft/cop31-varlik/kodlama/${basename(FRAGMAN)}.json`));
const CIKTI = resolve(arg("--cikti", "src/components/icinden/klipler.json"));
const PUBLIC = resolve(arg("--public", "public"));
const KAYNAK = arg("--kaynak", "render");
// d6 kapak ton eşlemesi (scripts/icinden/kapak-ton.py çıktısı); yoksa kapakTon yazılmaz (site filtresiz geçer).
const TON = resolve(arg("--ton", `D:/soft/cop31-varlik/kodlama/${basename(FRAGMAN)}-kapak-ton.json`));

const MASTER = 1920;
const OLCEK = 1.5;
const HIZ_GERI = 1.25;
const BOYUTLAR = {
  dikey: { g: 720, y: 1280, kirpim: [420, 0, 1080, 1920] },
  yatay: { g: 1280, y: 720, kirpim: [0, 420, 1920, 1080] },
};
const KODEKLER = [
  { ad: "av1", tip: 'video/mp4; codecs="av01.0.05M.08"', boyutlar: ["dikey", "yatay"] },
  { ad: "hevc", tip: 'video/mp4; codecs="hvc1.1.6.L93.90"', boyutlar: ["dikey"] },  // x265 çıktısının gerçek dizesi (kısıt baytı 0x90; K, klip-oynatma §5)
  { ad: "h264", tip: 'video/mp4; codecs="avc1.64001f"', boyutlar: ["dikey", "yatay"] },
];

/** Durak sırası (§9.1). gelen: bu durağa ileri yönde varan klip (kadraj okuması ondan). */
const DURAKLAR = [
  { id: "d0", tur: "dom", poster: null, dongu: null, ileri: "t01", gelen: null, okuma: "" },
  { id: "d1", tur: "klip", poster: "p1", dongu: "l1", ileri: "t12", gelen: "t01" },
  { id: "d2", tur: "klip", poster: "p2", dongu: "l2", ileri: "t23", gelen: "t12" },
  { id: "d3", tur: "klip", poster: "p3", dongu: "l3", ileri: "t34", gelen: "t23" },
  { id: "d4", tur: "klip", poster: "p4", dongu: "l4", ileri: "t45", gelen: "t34" },
  { id: "d5", tur: "klip", poster: "p5", dongu: "l5", ileri: "t56", gelen: "t45" },
  { id: "d6", tur: "dom", poster: "p6", dongu: null, ileri: null, gelen: "t56", okumaDurak: "sayfa 1/12" },
  { id: "d7", tur: "dom", poster: "p6", dongu: null, ileri: null, gelen: null, okuma: "sayfa 8/12" },
  { id: "d8", tur: "dom", poster: "p6", dongu: null, ileri: null, gelen: null, okuma: "sayfa 11/12" },
  { id: "d9", tur: "dom", poster: "p6", dongu: null, ileri: "t01", gelen: null, okuma: "sayfa 12/12" },
  { id: "d10", tur: "klip", poster: "p1", dongu: "l1", ileri: null, gelen: "t01", okumaDurak: "ortak evimiz" },
];

/**
 * Çapa adı → etiket (durak başına). tur: "doga" (Lora italik: su, dağ, ada), "yapi" (Montserrat: yer, yapı,
 * yol), "bolge" (d4 stant bölgeleri, kılavuz çizgili; `no` spot sırası). nokta: 3 px nokta çizilir.
 * Adı sözlükte olmayan çapa uyarı verir ve atlanır (S1/S2 ile anlaşılan adlar: docs/klipler-sema.md §3).
 */
const ETIKET = {
  d1: { antalya: { metin: "Antalya", tur: "yapi", nokta: true } },
  d2: {
    akdeniz: { metin: "Akdeniz", tur: "doga" },
    anadolu: { metin: "Anadolu", tur: "doga" },
    kibris: { metin: "Kıbrıs", tur: "doga" },
    antalya: { metin: "Antalya", tur: "yapi", nokta: true },
  },
  d3: {
    expo: { metin: "Antalya Expo Center", tur: "yapi" },
    d400: { metin: "D400", tur: "yapi" },
    antalya: { metin: "Antalya", tur: "yapi" },
    korfez: { metin: "Antalya Körfezi", tur: "doga" },
    beydaglari: { metin: "Beydağları", tur: "doga" },
  },
  d4: {
    rotunda: { metin: "Emanet Rotundası", tur: "bolge", no: 1 },
    oyun: { metin: "Oyna – Sen olsan ne yapardın?", tur: "bolge", no: 2 },
    kiosk: { metin: "Söz Kiosku", tur: "bolge", no: 3 },
    amfi: { metin: "Amfi", tur: "bolge", no: 4 },
  },
};

const uyarilar = [];
const r1 = (v) => Math.round(v * 10) / 10;
const sig = (v) => (v === 0 ? 0 : +v.toPrecision(4));
/** Master → video px. `yY`: yatay kırpımın o karedeki y ofseti (master px; kirpimYKare). */
const video = (boyut, [x, y], yY = KIRPIM_Y_VARSAYILAN) =>
  boyut === "dikey" ? [r1((x - 420) / OLCEK), r1(y / OLCEK)] : [r1(x / OLCEK), r1((y - yY) / OLCEK)];
/**
 * Etiket çapası o yönün video karesinde ve kenardan ≥ KENAR px içeride mi? Kenara yapışan çapa (B turu: d3 yatayda
 * "Antalya" y 11,9 → ekranın en üstünde, yarısı dışarıda) o yönde atlanır.
 */
const KENAR = 24;
const icinde = (boyut, [x, y]) => x >= KENAR && y >= KENAR && x <= BOYUTLAR[boyut].g - KENAR && y <= BOYUTLAR[boyut].y - KENAR;

const fragmanlar = {};
for (const ad of ["t01", "l1", "t12", "l2", "t23", "l3", "t34", "l4", "t45", "l5", "t56", "p6"]) {
  // t34: t34.json yoksa S1 t34a + S2 t34b birleşimi (fragman.mjs).
  const f = fragmanOku(FRAGMAN, ad, (m) => uyarilar.push(m));
  if (f) fragmanlar[ad] = f;
  else uyarilar.push(`fragman yok: ${ad}`);
}
const liste = JSON.parse(readFileSync(LISTE, "utf8"));
const bul = (klip, tur) => liste.filter((x) => x.klip === klip && x.tur === tur);

/** Yatay kırpımın y ofseti: kaynak klibin `kirpimY`'si (sayı ya da {bas, son, k0, k1}, easeInOutCubic) `kare`de. */
const KIRPIM_Y_VARSAYILAN = 420;
function kirpimYKare(klip, kare = 0) {
  const k = liste.find((x) => x.kaynakKlip === klip && x.boyut === "yatay" && x.kirpimY != null)?.kirpimY ?? KIRPIM_Y_VARSAYILAN;
  if (typeof k === "number") return k;
  const t = Math.min(1, Math.max(0, (kare - k.k0) / (k.k1 - k.k0)));
  return Math.round(k.bas + (k.son - k.bas) * (t < 0.5 ? 4 * t ** 3 : 1 - (2 - 2 * t) ** 3 / 2));
}

function dosyalar(klip, tur) {
  const satir = bul(klip, tur);
  if (!satir.length) {
    uyarilar.push(`kodlama yok: ${klip} (${tur})`);
    return null;
  }
  const dosya = {};
  const bayt = {};
  for (const s of satir) {
    (dosya[s.boyut] ??= {})[s.kodek] = s.dosya;
    (bayt[s.boyut] ??= {})[s.kodek] = s.bayt;
  }
  return { dosya, bayt, kare: satir[0].kare, sure: satir[0].sure };
}

function klipNesnesi(ad, tur) {
  const d = dosyalar(ad, tur);
  if (!d) return null;
  const fr = fragmanlar[ad];
  if (fr && fr.kare !== d.kare) uyarilar.push(`${ad}: fragman ${fr.kare} kare, kodlanmış ${d.kare} kare`);
  return { ad, sure: d.sure, kare: d.kare, dosya: d.dosya, bayt: d.bayt };
}

async function lqip(yol) {
  const b = await sharp(yol).resize({ width: 24 }).webp({ quality: 50 }).toBuffer();
  return `data:image/webp;base64,${b.toString("base64")}`;
}

async function poster(ad) {
  if (!ad) return null;
  const p = {};
  for (const boyut of Object.keys(BOYUTLAR)) {
    const s = liste.find((x) => x.klip === ad && x.tur === "poster" && x.boyut === boyut);
    if (!s) {
      uyarilar.push(`poster yok: ${ad} ${boyut}`);
      continue;
    }
    const yol = s.yol && existsSync(s.yol) ? s.yol : join(PUBLIC, s.dosya);
    p[boyut] = { dosya: s.dosya, bayt: s.bayt, lqip: await lqip(yol) };
  }
  return p;
}

function capalarDurak(durakId) {
  const D = DURAKLAR.find((x) => x.id === durakId);
  // Poster karesinin çapaları: önce döngü fragmanı (0. kare), yoksa gelen geçişinki (son kare = poster).
  if (fragmanlar[D.dongu]?.capalar) return { capa: fragmanlar[D.dongu].capalar, yY: kirpimYKare(D.dongu, 0) };
  const g = fragmanlar[D.gelen];
  if (g?.capalar) return { capa: g.capalar, yY: kirpimYKare(D.gelen, g.kare - 1) };
  return { capa: null, yY: KIRPIM_Y_VARSAYILAN };
}

const duraklar = [];
for (const D of DURAKLAR) {
  const o = { id: D.id, tur: D.tur };
  // okuma: gelen klibin kare kare kadrajı (metre; son öğe dinlenme değeri) ya da sabit metin.
  const gk = D.gelen ? fragmanlar[D.gelen]?.kadraj_m : null;
  o.okuma = gk ? gk.map(sig) : (D.okuma ?? "");
  if (D.okumaDurak) o.okumaDurak = D.okumaDurak;
  o.poster = await poster(D.poster);
  o.dongu = D.dongu ? klipNesnesi(D.dongu, "dongu") : null;
  if (D.ileri) {
    const ileri = klipNesnesi(D.ileri, "ileri");
    const geriAd = `r${D.ileri[2]}${D.ileri[1]}`;
    const geri = klipNesnesi(geriAd, "geri");
    o.ileri = ileri ? { ...ileri, geri, hizGeri: HIZ_GERI } : null;
  } else o.ileri = null;

  // Sahne etiketleri (dikey/yatay video px); kırpımda kalan ya da kenara 24 px'ten yakın çapa o yönde atlanır.
  const { capa, yY } = capalarDurak(D.id);
  const sozluk = ETIKET[D.id];
  if (capa && sozluk) {
    o.etiketler = { dikey: [], yatay: [] };
    for (const [ad, xy] of Object.entries(capa)) {
      const e = sozluk[ad];
      if (!e) {
        if (!/^sutun\d\d$/.test(ad)) uyarilar.push(`${D.id}: sözlükte olmayan çapa "${ad}"`);
        continue;
      }
      for (const boyut of Object.keys(BOYUTLAR)) {
        const v = video(boyut, xy, yY);
        if (!icinde(boyut, v)) continue;
        o.etiketler[boyut].push({ ad, metin: e.metin, x: v[0], y: v[1], tur: e.tur, ...(e.no ? { no: e.no } : {}), ...(e.nokta ? { nokta: true } : {}) });
      }
    }
  }

  // Özel alanlar.
  const ozel = {};
  if (D.gelen === "t01" && fragmanlar.t01?.dunyaR) {
    const f = fragmanlar.t01;
    ozel.dunyaR = f.dunyaR.map((r) => r1(r / OLCEK));
    const c = Array.isArray(f.dunyaC?.[0]) ? f.dunyaC[0] : (f.dunyaC ?? [960, 768]);
    if (Array.isArray(f.dunyaC?.[0])) uyarilar.push("t01 dunyaC kare başına verilmiş; yalnız 0. kare kullanıldı (lombar merkezi sabit)");
    ozel.dunyaC = { dikey: video("dikey", c), yatay: video("yatay", c, kirpimYKare("t01", 0)) };
  }
  if (D.id === "d5" && capa) {
    const s = Object.keys(capa).filter((k) => /^sutun\d\d$/.test(k)).sort();
    if (s.length) ozel.sutunlar = { dikey: s.map((k) => video("dikey", capa[k])), yatay: s.map((k) => video("yatay", capa[k], yY)) };
    if (s.length !== 12) uyarilar.push(`d5: ${s.length} sütun çapası (12 beklenir)`);
  }
  if (D.gelen === "t56" && fragmanlar.t56?.brosur_dikdortgen) {
    const b = fragmanlar.t56.brosur_dikdortgen;
    const yB = kirpimYKare("t56", fragmanlar.t56.kare - 1);
    ozel.brosurDikdortgen = { dikey: b.map((p) => video("dikey", p)), yatay: b.map((p) => video("yatay", p, yB)) };
    if (existsSync(TON)) {
      const t = JSON.parse(readFileSync(TON, "utf8"));
      ozel.kapakTon = { saturate: t.saturate, contrast: t.contrast, brightness: t.brightness, sepia: t.sepia };
    } else uyarilar.push(`kapak tonu yok (${TON}): d6 kesişmesi filtresiz`);
  }
  if (Object.keys(ozel).length) o.ozel = ozel;
  duraklar.push(o);
}

const manifest = {
  surum: 1,
  olusturma: new Date().toISOString(),
  kaynak: KAYNAK,
  fps: 30,
  master: MASTER,
  boyutlar: BOYUTLAR,
  kodekler: KODEKLER,
  duraklar,
};
writeFileSync(CIKTI, JSON.stringify(manifest, null, 1) + "\n");

// Özet: bayt tablosu (ilk yükleme ve adım başına; H.264 dikey)
const kb = (n) => (n / 1024).toFixed(0);
let toplam = { dikey: {}, yatay: {} };
for (const s of liste) if (s.tur !== "poster") toplam[s.boyut][s.kodek] = (toplam[s.boyut][s.kodek] ?? 0) + s.bayt;
console.log(`yazıldı: ${CIKTI} (${(JSON.stringify(manifest).length / 1024).toFixed(1)} KB)`);
console.log("video toplamı (KB):", JSON.stringify(Object.fromEntries(Object.entries(toplam).map(([b, o]) => [b, Object.fromEntries(Object.entries(o).map(([k, v]) => [k, kb(v)]))]))));
if (uyarilar.length) console.log("UYARILAR:\n - " + [...new Set(uyarilar)].join("\n - "));
