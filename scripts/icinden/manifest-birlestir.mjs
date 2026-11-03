// /icinden v3 — Blender fragmanları + kodlama listesi → src/components/icinden/klipler.json (şema `surum: 2`)
// Şema: docs/klipler-sema.md. Durak tablosu (12 durak + rol, brief-icinden-3 §12.1, §12.4-9) BURADA; site,
// oynatıcı, CSS ve broşür dizinleri onu manifestteki `rol` ve sıradan türetir (src/components/icinden/rol.ts).
//
//   node scripts/icinden/manifest-birlestir.mjs [--fragman D:/soft/cop31-varlik/render-son]
//        [--liste D:/soft/cop31-varlik/kodlama/<fragman klasör adı>.json]
//        [--cikti src/components/icinden/klipler.json] [--kaynak render|onizleme|yer-tutucu] [--public public]
//        [--ton D:/soft/cop31-varlik/kodlama/<fragman klasör adı>-kapak-ton.json]
//        [--yaylar <fragman>/yaylar.json] [--gecici]
//
// --gecici (E turu, W1): yeni S2 render'ı ve kodlaması yokken 12 duraklı sitenin çalışması için. Eksik klip ve
// posterler mevcut dosyalarla doldurulur (ESLE_GECICI): t67, t78 → mevcut t56; r76, r87 → mevcut r65; p6, p7 → p5;
// p8 → mevcut p6 plakası (eski broşür dikdörtgeni ve kapak tonu t56 fragmanından). yaylar.json ya da emanet çapaları
// yoksa boş. `kaynak` varsayılanı "onizleme"; manifeste `gecici` eşlemesi yazılır. K2 son kodlamadan sonra --gecici'siz
// çalıştırır.
//
// Fragman (`<dizin>/<klip>.json`, master px, §9.3): {ad, fps, kare, sure, kadraj_m[kare], dunyaR[kare] (t01),
// dunyaC [cx, cy] (t01; tek nokta ya da kare başına), capalar {ad: [x, y]} (poster karesi), brosur_dikdortgen
// [4×[x, y]] (t78 son kare; E turundan önce t56), kamera{}}. Master → video uzayı: dikey ((x−420)/1,5, y/1,5), yatay
// (x/1,5, (y − kirpimY)/1,5); kirpimY klip başına (kodla.mjs KIRPIM_Y → liste öğesinin `kirpimY`'si; yoksa 420; §11.2-5:
// d3'te l3/p3 200; F turundan beri rampa ilerlemeye bağlı olabilir → `kareler` dizisi). Çapanın klibi ve karesi: etiket/sütun → poster karesi (döngü 0. karesi ya da gelen geçişin son
// karesi), dunyaC → t01 0. kare, brosurDikdortgen → t78 son kare, duvarCapalari → p6 (yoksa t56 son kare; yatayda
// t56 son karesinin kirpimY'si, E2'den beri 293).
// yaylar.json (S1a yaylar.py): {dikey: [[[x, y] × ≤ 24] × 27], yatay: …} video px; d1 ve d11'e aynen.
// LQIP: posterden 24 px genişlikte WebP (sharp).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import sharp from "sharp";
import { fragmanOku } from "./fragman.mjs";

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const GECICI = argv.includes("--gecici");
const FRAGMAN = resolve(arg("--fragman", "D:/soft/cop31-varlik/render-son"));
const LISTE = resolve(arg("--liste", `D:/soft/cop31-varlik/kodlama/${basename(FRAGMAN)}.json`));
const CIKTI = resolve(arg("--cikti", "src/components/icinden/klipler.json"));
const PUBLIC = resolve(arg("--public", "public"));
const KAYNAK = arg("--kaynak", GECICI ? "onizleme" : "render");
// brosur-kapak (d8) ton eşlemesi (scripts/icinden/kapak-ton.py çıktısı); yoksa kapakTon yazılmaz (site filtresiz geçer).
const TON = resolve(arg("--ton", `D:/soft/cop31-varlik/kodlama/${basename(FRAGMAN)}-kapak-ton.json`));
const YAYLAR = resolve(arg("--yaylar", join(FRAGMAN, "yaylar.json")));

const MASTER = 1920;
const OLCEK = 1.5;
// 1,0 (F turu, denetim D2-01): 1,25 ile her geri klip 1 kare düşürüyordu (playbackRate ≠ 1); geri geçişler %25 uzar.
const HIZ_GERI = 1;
const BOYUTLAR = {
  dikey: { g: 720, y: 1280, kirpim: [420, 0, 1080, 1920] },
  yatay: { g: 1280, y: 720, kirpim: [0, 420, 1920, 1080] },
};
const KODEKLER = [
  { ad: "av1", tip: 'video/mp4; codecs="av01.0.05M.08"', boyutlar: ["dikey", "yatay"] },
  { ad: "hevc", tip: 'video/mp4; codecs="hvc1.1.6.L93.90"', boyutlar: ["dikey"] },  // x265 çıktısının gerçek dizesi (kısıt baytı 0x90; K, klip-oynatma §5)
  { ad: "h264", tip: 'video/mp4; codecs="avc1.64001f"', boyutlar: ["dikey", "yatay"] },
];

/**
 * Durak tablosu (§12.1; sıra = durak numarası, id "d0"…"d11"). rol: §12.4-9. gelen: bu durağa ileri yönde varan
 * klip (kadraj okuması ondan). d6/d7: tur "klip", döngü yok (gelen klibin son karesinde durur; poster son-kare).
 */
const DURAKLAR = [
  { id: "d0", rol: "lombar", tur: "dom", poster: null, dongu: null, ileri: "t01", gelen: null, okuma: "" },
  { id: "d1", rol: "dunya", tur: "klip", poster: "p1", dongu: "l1", ileri: "t12", gelen: "t01" },
  { id: "d2", rol: "emanet", tur: "klip", poster: "p2", dongu: "l2", ileri: "t23", gelen: "t12" },
  { id: "d3", rol: "expo", tur: "klip", poster: "p3", dongu: "l3", ileri: "t34", gelen: "t23" },
  { id: "d4", rol: "anatomi", tur: "klip", poster: "p4", dongu: "l4", ileri: "t45", gelen: "t34" },
  { id: "d5", rol: "sutunlar", tur: "klip", poster: "p5", dongu: "l5", ileri: "t56", gelen: "t45" },
  { id: "d6", rol: "duvar", tur: "klip", poster: "p6", dongu: null, ileri: "t67", gelen: "t56", okumaDurak: "arka duvar · ~3 m" },
  { id: "d7", rol: "duvar", tur: "klip", poster: "p7", dongu: null, ileri: "t78", gelen: "t67", okumaDurak: "sol duvar · ~3 m" },
  { id: "d8", rol: "brosur-kapak", tur: "dom", poster: "p8", dongu: null, ileri: null, gelen: "t78", okumaDurak: "sayfa 1/12" },
  { id: "d9", rol: "brosur-sayfa", tur: "dom", poster: "p8", dongu: null, ileri: null, gelen: null, okuma: "sayfa 8/12" },
  { id: "d10", rol: "brosur-arka", tur: "dom", poster: "p8", dongu: null, ileri: "t01", gelen: null, okuma: "sayfa 12/12" },
  { id: "d11", rol: "dunya", tur: "klip", poster: "p1", dongu: "l1", ileri: null, gelen: "t01", okumaDurak: "ortak evimiz" },
];
/** Açık geri klip adları (§12.1; kodla.mjs'in açık ad tablosuyla aynı). d10 → d11 = t01 tekrarı, geri r10. */
const GERI = { t01: "r10", t12: "r21", t23: "r32", t34: "r43", t45: "r54", t56: "r65", t67: "r76", t78: "r87" };
/** --gecici: istenen ad → mevcut dosyanın adı (liste ve fragman aramasında; tek adım, zincir yok). */
const ESLE_GECICI = { t67: "t56", t78: "t56", r76: "r65", r87: "r65", p6: "p5", p7: "p5", p8: "p6" };
const ESLE = GECICI ? ESLE_GECICI : {};
const esle = (ad) => ESLE[ad] ?? ad;

/** Depodaki metinler (birebir; content.ts / emanet.ts düzenlenince yeniden üretilir). */
const CONTENT = readFileSync(resolve("src/lib/content.ts"), "utf8");
const TARIH = /dates:\s*"([^"]+)"/.exec(CONTENT)?.[1];
if (!TARIH) throw new Error("content.ts cop31.dates okunamadı");
const EMANET_TS = readFileSync(resolve("src/lib/emanet.ts"), "utf8");
/** emanet.ts emanetAlanlari: no → dönem adı (donemler[].ad). */
const DONEM = Object.fromEntries(
  [...EMANET_TS.slice(EMANET_TS.indexOf("export const emanetAlanlari")).matchAll(/no:\s*(\d+),[\s\S]*?donem:\s*"([^"]+)"/g)].map((m) => [Number(m[1]), m[2]]),
);
if (Object.keys(DONEM).length !== 12) throw new Error(`emanet.ts: ${Object.keys(DONEM).length} alan okundu (12 beklenir)`);

/**
 * Çapa adı → etiket (durak başına). tur: "doga" (Lora italik: su, dağ, ada), "yapi" (Montserrat: yer, yapı,
 * yol), "bolge" (d4 stant bölgeleri, kılavuz çizgili; `no` spot sırası), "kunye" (d1 Antalya künyesi; metin = SSR
 * satırı), "emanet" (d2; `emanet01`…`emanet12` ya da `emanet_1` gibi, numara addan). nokta: 3 px nokta çizilir.
 * Adı sözlükte olmayan çapa uyarı verir ve atlanır (S1/S2 ile anlaşılan adlar: docs/klipler-sema.md §3).
 */
const ETIKET = {
  d1: { antalya: { metin: TARIH, tur: "kunye" } },
  d2: { antalya: { metin: "Antalya", tur: "yapi", nokta: true } },
  d3: {
    expo: { metin: "Antalya Expo Center", tur: "yapi" },
    d400: { metin: "D400", tur: "yapi" },
    antalya: { metin: "Antalya", tur: "yapi" },
    korfez: { metin: "Antalya Körfezi", tur: "doga" },
    beydaglari: { metin: "Beydağları", tur: "doga" },
  },
  d4: {
    rotunda: { metin: "Emanet Rotundası", tur: "bolge", no: 1 },
    // Dikeyde yok (F turu, denetim D1-14): render'daki aynı metinli yeşil bandın üstüne biniyordu (yineleme + çakışma);
    // bölgenin satırı alt bantta kalır. `boyutlar`: etiketin yazıldığı yönler (yoksa ikisi).
    oyun: { metin: "Oyna – Sen olsan ne yapardın?", tur: "bolge", no: 2, boyutlar: ["yatay"] },
    kiosk: { metin: "Söz Kiosku", tur: "bolge", no: 3 },
    amfi: { metin: "Amfi", tur: "bolge", no: 4 },
  },
};
/** E turunda kaldırılan atlas etiketleri (§12.0-2a): eski l2 fragmanında olsalar da uyarısız atlanır. */
const KALKAN = { d2: new Set(["akdeniz", "anadolu", "kibris"]) };
const EMANET_AD = /^emanet_?0?(\d{1,2})$/;
/**
 * d2 emanet numaralarının ofseti (video px, numaranın çekirdek merkezine göre; yoksa W2a'nın varsayılanı). Çakışan
 * çiftler (§12.4-3): 06/07 ve 04/05/Antalya; 05'in numarası Expo (Antalya) noktasının soluna. Değerler S1a'nın
 * çakışma ölçümünden (l2.json `etiketler`; E turu D2 kadrajı, dikey px: 05↔Antalya 10,2, 06↔07 44,2, 04↔05 52,5);
 * 04 W2a ekran görüntüsünde (−10, −6) → (−10, 0): çapraz numara çekirdekten kopuk duruyordu, 05 numarasıyla dikey ara 27 px.
 * Site (SahneEtiketleri, W2a) numarayı çekirdekten (dx, dy) yönünde, çekirdeğe bakan kenarıyla hizalı yerleştirir;
 * ofsetsiz numara sağda (dx +10).
 */
const EMANET_OFSET = { 4: { dx: -10, dy: 0 }, 5: { dx: -10, dy: 0 }, 6: { dx: 10, dy: 0 }, 7: { dx: -10, dy: 0 } };
/** d6 kılavuz çapaları (p6), sıra = iklim.items[0..2] (Hatıra Ormanı 300 fidan · Genç İklim · fidan dikimi/orman). */
const DUVAR_CAPA = ["fidan", "genc_iklim", "orman"];

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
for (const ad of ["t01", "l1", "t12", "l2", "t23", "l3", "t34", "l4", "t45", "l5", "t56", "t67", "t78", "p6", "p7"]) {
  // t34: t34.json yoksa S1 t34a + S2 t34b birleşimi (fragman.mjs). --gecici: ESLE'deki ad.
  const f = fragmanOku(FRAGMAN, esle(ad), (m) => uyarilar.push(m));
  if (f) fragmanlar[ad] = f;
  else if (!(GECICI && /^p[67]$/.test(ad))) uyarilar.push(`fragman yok: ${esle(ad)}${esle(ad) !== ad ? ` (${ad} yerine)` : ""}`);
}
const liste = JSON.parse(readFileSync(LISTE, "utf8"));
const bul = (klip, tur) => liste.filter((x) => x.klip === esle(klip) && x.tur === tur);

/**
 * Yatay kırpımın y ofseti `kare`de: kaynak klibin `kirpimY`'si — sayı, {bas, son, k0, k1} (easeInOutCubic, kare
 * numarasıyla) ya da F turundan beri ilerlemeye bağlı rampanın kodla.mjs'in çözdüğü kare başına tam sayı dizisi
 * ({bas, son, s0, s1, kareler}; ffmpeg crop ifadesi aynı diziden kurulur → ikisi aynı eğri). Klip kaydı (ileri/geri)
 * önce; poster kaydı (son-kare posterinde o karedeki sayı) yalnız klip kaydı yoksa.
 */
const KIRPIM_Y_VARSAYILAN = 420;
function kirpimYKare(klip, kare = 0) {
  const yatay = liste.filter((x) => x.kaynakKlip === esle(klip) && x.boyut === "yatay" && x.kirpimY != null);
  const k = (yatay.find((x) => x.tur !== "poster") ?? yatay[0])?.kirpimY ?? KIRPIM_Y_VARSAYILAN;
  if (typeof k === "number") return k;
  if (Array.isArray(k.kareler)) return k.kareler[Math.min(k.kareler.length - 1, Math.max(0, kare))];
  const t = Math.min(1, Math.max(0, (kare - k.k0) / (k.k1 - k.k0)));
  return Math.round(k.bas + (k.son - k.bas) * (t < 0.5 ? 4 * t ** 3 : 1 - (2 - 2 * t) ** 3 / 2));
}

function dosyalar(klip, tur) {
  const satir = bul(klip, tur);
  if (!satir.length) {
    uyarilar.push(`kodlama yok: ${esle(klip)} (${tur})`);
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

const posterOnbellek = new Map();
async function poster(ad) {
  if (!ad) return null;
  if (posterOnbellek.has(ad)) return posterOnbellek.get(ad);
  const p = {};
  for (const boyut of Object.keys(BOYUTLAR)) {
    const s = liste.find((x) => x.klip === esle(ad) && x.tur === "poster" && x.boyut === boyut);
    if (!s) {
      uyarilar.push(`poster yok: ${esle(ad)} ${boyut}`);
      continue;
    }
    const yol = s.yol && existsSync(s.yol) ? s.yol : join(PUBLIC, s.dosya);
    p[boyut] = { dosya: s.dosya, bayt: s.bayt, lqip: await lqip(yol) };
  }
  posterOnbellek.set(ad, p);
  return p;
}

function capalarDurak(D) {
  // Poster karesinin çapaları: önce döngü fragmanı (0. kare), yoksa gelen geçişinki (son kare = poster).
  if (fragmanlar[D.dongu]?.capalar) return { capa: fragmanlar[D.dongu].capalar, yY: kirpimYKare(D.dongu, 0) };
  const g = fragmanlar[D.gelen];
  if (g?.capalar) return { capa: g.capalar, yY: kirpimYKare(D.gelen, g.kare - 1) };
  return { capa: null, yY: KIRPIM_Y_VARSAYILAN };
}

/** Çapa → etiket (sözlük ya da emanet adı); null: atla. */
function etiketTanimi(durakId, ad) {
  const e = ETIKET[durakId]?.[ad];
  if (e) return e;
  if (durakId === "d2") {
    const m = EMANET_AD.exec(ad);
    if (m) {
      const no = Number(m[1]);
      if (!DONEM[no]) {
        uyarilar.push(`d2: emanet çapası "${ad}" için emanet.ts'te alan yok`);
        return null;
      }
      return { metin: "", tur: "emanet", no, donem: DONEM[no], ...(EMANET_OFSET[no] ?? {}) };
    }
  }
  if (KALKAN[durakId]?.has(ad)) return null;
  if (!/^sutun\d\d$/.test(ad) && !(durakId === "d6" && DUVAR_CAPA.includes(ad))) uyarilar.push(`${durakId}: sözlükte olmayan çapa "${ad}"`);
  return null;
}

/** yaylar.json → {dikey, yatay} (video px; yay başına ≤ 24 nokta). Yoksa null (W2a yaysız çizer). */
function yaylarOku() {
  if (!existsSync(YAYLAR)) {
    uyarilar.push(`yaylar yok (${YAYLAR}): d1/d11 ozel.yaylar boş`);
    return null;
  }
  const y = JSON.parse(readFileSync(YAYLAR, "utf8"));
  const o = {};
  for (const b of Object.keys(BOYUTLAR)) {
    const yb = y[b] ?? [];
    o[b] = yb.map((yay) => yay.map(([px, py]) => [r1(px), r1(py)]));
    const fazla = o[b].filter((yay) => yay.length > 24).length;
    if (fazla) uyarilar.push(`yaylar ${b}: ${fazla} yay 24 noktadan uzun`);
  }
  if (o.dikey.length !== 27) uyarilar.push(`yaylar: ${o.dikey.length} yay (27 beklenir)`);
  return o;
}
const yaylar = yaylarOku();

const duraklar = [];
let emanetSay = 0;
for (const D of DURAKLAR) {
  const o = { id: D.id, rol: D.rol, tur: D.tur };
  // okuma: gelen klibin kare kare kadrajı (metre; son öğe dinlenme değeri) ya da sabit metin.
  const gk = D.gelen ? fragmanlar[D.gelen]?.kadraj_m : null;
  o.okuma = gk ? gk.map(sig) : (D.okuma ?? "");
  if (D.okumaDurak) o.okumaDurak = D.okumaDurak;
  o.poster = await poster(D.poster);
  o.dongu = D.dongu ? klipNesnesi(D.dongu, "dongu") : null;
  if (D.ileri) {
    const ileri = klipNesnesi(D.ileri, "ileri");
    const geri = klipNesnesi(GERI[D.ileri], "geri");
    o.ileri = ileri ? { ...ileri, geri, hizGeri: HIZ_GERI } : null;
  } else o.ileri = null;

  // Sahne etiketleri (dikey/yatay video px); kırpımda kalan ya da kenara 24 px'ten yakın çapa o yönde atlanır.
  const { capa, yY } = capalarDurak(D);
  if (capa && (ETIKET[D.id] || D.id === "d2")) {
    o.etiketler = { dikey: [], yatay: [] };
    for (const [ad, xy] of Object.entries(capa)) {
      const e = etiketTanimi(D.id, ad);
      if (!e) continue;
      if (e.tur === "emanet") emanetSay++;
      for (const boyut of Object.keys(BOYUTLAR)) {
        if (e.boyutlar && !e.boyutlar.includes(boyut)) continue;
        const v = video(boyut, xy, yY);
        if (!icinde(boyut, v)) continue;
        o.etiketler[boyut].push({
          ad,
          metin: e.metin,
          x: v[0],
          y: v[1],
          tur: e.tur,
          ...(e.no ? { no: e.no } : {}),
          ...(e.nokta ? { nokta: true } : {}),
          ...(e.donem ? { donem: e.donem } : {}),
          ...(e.dx ? { dx: e.dx } : {}),
          ...(e.dy ? { dy: e.dy } : {}),
        });
      }
    }
    if (!o.etiketler.dikey.length && !o.etiketler.yatay.length) delete o.etiketler;
  }

  // Özel alanlar.
  const ozel = {};
  if (D.gelen === "t01" && fragmanlar.t01?.dunyaR) {
    const f = fragmanlar.t01;
    ozel.dunyaR = f.dunyaR.map((r) => r1(r / OLCEK));
    const c = Array.isArray(f.dunyaC?.[0]) ? f.dunyaC[0] : (f.dunyaC ?? [960, 768]);
    if (Array.isArray(f.dunyaC?.[0])) uyarilar.push("t01 dunyaC kare başına verilmiş; yalnız 0. kare kullanıldı (lombar merkezi sabit)");
    ozel.dunyaC = { dikey: video("dikey", c), yatay: video("yatay", c, kirpimYKare("t01", 0)) };
    if (yaylar) ozel.yaylar = yaylar;
  }
  if (D.rol === "sutunlar" && capa) {
    const s = Object.keys(capa).filter((k) => /^sutun\d\d$/.test(k)).sort();
    if (s.length) ozel.sutunlar = { dikey: s.map((k) => video("dikey", capa[k])), yatay: s.map((k) => video("yatay", capa[k], yY)) };
    if (s.length !== 12) uyarilar.push(`${D.id}: ${s.length} sütun çapası (12 beklenir)`);
  }
  if (D.rol === "duvar" && D.gelen === "t56") {
    // p6 çapaları (S2b json_yaz): önce p6 fragmanının yön başına `duvarCapalari` listesi (master px; her yön kendi
    // kırpımına giren nokta), yoksa p6 `capalar` (iki kırpıma da giren tek nokta), yoksa t56 son karesi. --gecici'de
    // eski p6 plakasında yok → boş.
    // Yatay: p6 = t56 son karesi, kırpımı o karedeki `kirpimY` (E2: 293; §12.12). Kırpım dışına düşen yatay çapa uyarı
    // verir ama yazılır (site F'den beri duvarda kılavuz çizmez; alan yalnız kayıt).
    const yP6 = kirpimYKare("t56", (fragmanlar.t56?.kare ?? 1) - 1);
    const yonlu = Array.isArray(fragmanlar.p6?.duvarCapalari) ? Object.fromEntries(fragmanlar.p6.duvarCapalari.map((x) => [x.ad, x])) : null;
    const kaynak = fragmanlar.p6?.capalar ? { c: fragmanlar.p6.capalar, yY: yP6 } : capa ? { c: capa, yY } : null;
    const bulunan = DUVAR_CAPA.filter((ad) => yonlu?.[ad] || kaynak?.c[ad]);
    if (bulunan.length)
      ozel.duvarCapalari = bulunan.map((ad) =>
        yonlu?.[ad]
          ? { ad, dikey: video("dikey", yonlu[ad].dikey), yatay: video("yatay", yonlu[ad].yatay, yP6) }
          : { ad, dikey: video("dikey", kaynak.c[ad]), yatay: video("yatay", kaynak.c[ad], kaynak.yY) },
      );
    for (const c of ozel.duvarCapalari ?? []) if (!icinde("yatay", c.yatay)) uyarilar.push(`${D.id}: duvar çapası "${c.ad}" yatay kırpım dışında (${c.yatay.join(", ")}; kirpimY ${yP6})`);
    if (bulunan.length !== DUVAR_CAPA.length) uyarilar.push(`${D.id}: duvar çapası ${bulunan.length}/${DUVAR_CAPA.length} (${DUVAR_CAPA.join(", ")})`);
  }
  if (D.rol === "brosur-kapak") {
    const f = fragmanlar[D.gelen];
    if (f?.brosur_dikdortgen) {
      const b = f.brosur_dikdortgen;
      const yB = kirpimYKare(D.gelen, f.kare - 1);
      ozel.brosurDikdortgen = { dikey: b.map((p) => video("dikey", p)), yatay: b.map((p) => video("yatay", p, yB)) };
    } else uyarilar.push(`${D.id}: ${esle(D.gelen)} fragmanında brosur_dikdortgen yok (kesişme okuma düzeninden başlar)`);
    if (existsSync(TON)) {
      const t = JSON.parse(readFileSync(TON, "utf8"));
      ozel.kapakTon = { saturate: t.saturate, contrast: t.contrast, brightness: t.brightness, sepia: t.sepia };
    } else uyarilar.push(`kapak tonu yok (${TON}): ${D.id} kesişmesi filtresiz`);
  }
  if (Object.keys(ozel).length) o.ozel = ozel;
  duraklar.push(o);
}
if (emanetSay !== 12) uyarilar.push(`d2: ${emanetSay} emanet çapası (12 beklenir; S1a l2.json capalar "emanet01"…"emanet12")`);

const manifest = {
  surum: 2,
  olusturma: new Date().toISOString(),
  kaynak: KAYNAK,
  ...(GECICI ? { gecici: ESLE_GECICI } : {}),
  fps: 30,
  master: MASTER,
  boyutlar: BOYUTLAR,
  kodekler: KODEKLER,
  duraklar,
};
// Girintili, ama sayı dizileri tek satırda (okuma, dunyaR, yay noktaları): diff okunur kalsın.
const metin = JSON.stringify(manifest, null, 1).replace(/\[\s+(-?[\d.]+(?:,\s+-?[\d.]+)*)\s+\]/g, (_, a) => `[${a.split(/,\s+/).join(", ")}]`);
writeFileSync(CIKTI, metin + "\n");

// Özet: bayt tablosu (liste toplamı) ve rol tablosu
const kb = (n) => (n / 1024).toFixed(0);
let toplam = { dikey: {}, yatay: {} };
for (const s of liste) if (s.tur !== "poster") toplam[s.boyut][s.kodek] = (toplam[s.boyut][s.kodek] ?? 0) + s.bayt;
console.log(`yazıldı: ${CIKTI} (${(JSON.stringify(manifest).length / 1024).toFixed(1)} KB; surum 2; kaynak ${KAYNAK}${GECICI ? "; GEÇİCİ" : ""})`);
console.log("video toplamı (KB):", JSON.stringify(Object.fromEntries(Object.entries(toplam).map(([b, o]) => [b, Object.fromEntries(Object.entries(o).map(([k, v]) => [k, kb(v)]))]))));
console.log("id | rol | tur | gelen | ileri / geri | döngü | poster | okuma");
for (const [i, o] of duraklar.entries()) {
  const D = DURAKLAR[i];
  const okuma = typeof o.okuma === "string" ? o.okuma || "—" : `${o.okuma.length} kare`;
  console.log(
    [o.id, o.rol, o.tur, D.gelen ? `${D.gelen}${esle(D.gelen) !== D.gelen ? `←${esle(D.gelen)}` : ""}` : "—",
      o.ileri ? `${o.ileri.ad}/${o.ileri.geri?.ad ?? "—"}${esle(o.ileri.ad) !== o.ileri.ad ? ` ←${esle(o.ileri.ad)}/${esle(GERI[o.ileri.ad])}` : ""}` : "—",
      o.dongu?.ad ?? "—", D.poster ? `${D.poster}${esle(D.poster) !== D.poster ? `←${esle(D.poster)}` : ""}` : "—", `${okuma}${o.okumaDurak ? ` · "${o.okumaDurak}"` : ""}`].join(" | "),
  );
}
if (uyarilar.length) console.log("UYARILAR:\n - " + [...new Set(uyarilar)].join("\n - "));
