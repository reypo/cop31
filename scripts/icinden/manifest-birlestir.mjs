// /icinden v3 — Blender fragmanları + kodlama listesi → src/components/icinden/klipler.json (şema `surum: 3`)
// Şema: docs/klipler-sema.md (§0.2 G turu). Durak tablosu (13 durak + rol, brief-icinden-3 §14.4.2, §14.7) BURADA; site,
// oynatıcı ve CSS onu manifestteki `rol` ve sıradan türetir (src/components/icinden/rol.ts).
//
//   node scripts/icinden/manifest-birlestir.mjs [--fragman D:/soft/cop31-varlik/render-son]
//        [--liste D:/soft/cop31-varlik/kodlama/<fragman klasör adı>.json]
//        [--cikti src/components/icinden/klipler.json] [--kaynak render|onizleme|yer-tutucu] [--public public]
//        [--yaylar <fragman>/yaylar.json] [--geri-yok r98]
//
// G-B (§14.4.3): `--gecici`, kapak tonu (`--ton`, `kapakTon`) ve broşür dikdörtgeni (`brosurDikdortgen`) KALKTI.
// W-3 (§14.7 C): d8 masa KALKTI — d7 (sol duvar) → t79 → d8 fidan-kok (p9 = t79 son karesi), d8–d11 fidan (t79 t9a tab
// tbc + lc), d12 Dünya. t79/r97 kodlama listesinde yoksa d7'nin ileri geçişi GEÇİCİ olarak t89 (geri yok; uyarı).
// `--geri-yok <ad>`: bütçe merdiveni (§14.4.1; `kodla.mjs --dus <ad>` ile birlikte): o geri klip null yazılır (site o
// geri adımda poster çapraz sönmesi yapar), uyarı verilmez.
//
// Fragman (`<dizin>/<klip>.json`, master px, §9.3): {ad, fps, kare, sure, kadraj_m[kare], dunyaR[kare] (t01),
// dunyaC [cx, cy] (t01; tek nokta ya da kare başına), capalar {ad: [x, y]} (poster karesi), kamera{}}; S3 (fidan)
// `capalar` alanları: p9/t89 `kok_uclari` [{x, y, grup, ana} × 81], pa/t9a `bogumlar` [{x, y, baslik, satirlar,
// taraf} × 2], pb/tab `dal_uclari` [[x, y] × 6] (alttan üste solAlt, sağAlt, solOrta, sağOrta, solÜst, sağÜst),
// pc/lc/tbc `dal_uclari` + `govde_ucu` [x, y]. Master → video uzayı: dikey ((x−420)/1,5, y/1,5), yatay
// (x/1,5, (y − kirpimY)/1,5); kirpimY klip başına (kodla.mjs KIRPIM_Y → liste öğesinin `kirpimY`'si; yoksa 420; §11.2-5:
// d3'te l3/p3 200; F turundan beri rampa ilerlemeye bağlı olabilir → `kareler` dizisi). Çapanın klibi ve karesi:
// etiket/sütun → poster karesi (döngü 0. karesi ya da gelen geçişin son karesi), dunyaC → t01 0. kare, duvarCapalari →
// p6 (yatayda p6 posterinin kirpimY'si, E2'den beri 293), fidan çapaları → durağın posteri (yatayda posterin kirpimY'si:
// p9 420, pa 222, pb 194, pc 165). Kırpım dışına ya da kenara 24 px'ten yakın düşen fidan noktası o yönde atlanır.
// yaylar.json (S1a yaylar.py): {dikey: [[[x, y] × ≤ 24] × 27], yatay: …} video px; yalnız d1 (d12 Dünya'ya uzaklaşmada site
// d1'in yaylarını tersten çizer; veri bir kez).
//
// W-2 (§14.7; W-3'te d12): son durak ikinci `dunya` ("Gezegenimiz Ortak Evimizdir"), fidan-yaprağın (d11) ileri geçişi ZİNCİR (`ZINCIR`): yeni dosya yok,
// parçalar d2–d4'ün geri klipleri (r43 → r32 → r21; aynı dosyalar, istemcide blob önbelleğinden). Manifestte
// `ileri: {ad, sure, kare (toplam), dosya: {}, bayt: {}, geri: null, hizGeri, parcalar: Klip[], kopruDurak}`; `kopruDurak`
// ilk parçanın 0. karesine eşit posterin durağı (r43[0] ≡ t34 son ≡ l4[0] ≡ p4 → "d4"; site d11 → p4 350 ms çapraz sönme).
// LQIP: posterden 24 px genişlikte WebP (sharp).
//
// İki dil (8 Kasım 2026; onay-listesi §15): render içindeki yazıları İngilizce olan klipler ayrı listede (`--liste-en`,
// varsayılan kodlama/render-son-en.json; fragmanlar `--fragman-en`, render-son-en). Manifest Türkçe tabanlı kalır; İngilizce
// kodlaması olan her klip / poster yönü / d6 `ozel` girdisine `dil: { en: {…} }` eklenir (klip: dosya + bayt; poster: dosya +
// bayt + lqip; ozel: duvarCapalari — İngilizce duvarın kendi çapaları). Site sunucuda dile göre çözer (klipler.ts
// dilManifesti): istemciye giden manifest ve HTML yalnız o dilin adreslerini taşır. Kare sayısı / kırpım iki dilde aynı olmalı.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import sharp from "sharp";
import { fragmanOku } from "./fragman.mjs";

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
for (const eski of ["--gecici", "--ton"]) if (argv.includes(eski)) throw new Error(`${eski} G-B'de kalktı (§14.4.3; docs/klipler-sema.md §0.2)`);
const FRAGMAN = resolve(arg("--fragman", "D:/soft/cop31-varlik/render-son"));
const LISTE = resolve(arg("--liste", `D:/soft/cop31-varlik/kodlama/${basename(FRAGMAN)}.json`));
const CIKTI = resolve(arg("--cikti", "src/components/icinden/klipler.json"));
const PUBLIC = resolve(arg("--public", "public"));
const KAYNAK = arg("--kaynak", "render");
if (!["render", "onizleme", "yer-tutucu"].includes(KAYNAK)) throw new Error(`--kaynak ${KAYNAK}: render | onizleme | yer-tutucu`);
const YAYLAR = resolve(arg("--yaylar", join(FRAGMAN, "yaylar.json")));
/** Bilerek geri klipsiz bırakılan geri klipler (bütçe merdiveni; `kodla.mjs --dus`). */
const GERI_YOK = new Set(arg("--geri-yok", "").split(",").filter(Boolean));
const LISTE_EN = resolve(arg("--liste-en", "D:/soft/cop31-varlik/kodlama/render-son-en.json"));
const FRAGMAN_EN = resolve(arg("--fragman-en", "D:/soft/cop31-varlik/render-son-en"));

const SURUM = 3;
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
 * Durak tablosu (G turu §14.4.2 + W-2/W-3 §14.7; sıra = durak numarası, id "d0"…"d12", kapanış = 13 manifest dışı). rol:
 * §14.4.2. gelen: bu durağa ileri yönde varan klip ya da zincir (kadraj okuması ondan; fidan duraklarında metre, cm
 * düzeyinde — site cm yazar; zincirde parçaların ileri klip kadrajları tersten, art arda). Döngüsüz klip durakları
 * (d6–d10) gelen klibin son karesinde durur; posterleri o kare (son-kare).
 */
const DURAKLAR = [
  { id: "d0", rol: "lombar", tur: "dom", poster: null, dongu: null, ileri: "t01", gelen: null, okuma: "" },
  { id: "d1", rol: "dunya", tur: "klip", poster: "p1", dongu: "l1", ileri: "t12", gelen: "t01" },
  { id: "d2", rol: "emanet", tur: "klip", poster: "p2", dongu: "l2", ileri: "t23", gelen: "t12" },
  { id: "d3", rol: "expo", tur: "klip", poster: "p3", dongu: "l3", ileri: "t34", gelen: "t23" },
  { id: "d4", rol: "anatomi", tur: "klip", poster: "p4", dongu: "l4", ileri: "t45", gelen: "t34" },
  { id: "d5", rol: "sutunlar", tur: "klip", poster: "p5", dongu: "l5", ileri: "t56", gelen: "t45" },
  { id: "d6", rol: "duvar", tur: "klip", poster: "p6", dongu: null, ileri: "t67", gelen: "t56", okumaDurak: "arka duvar · ~3 m" },
  // W-3 (§14.7 C, kullanıcı: "duvarlardan sonra broşürü hiç göstermeyelim, direkt fidana"): d8 masa kalktı; t79 sol
  // duvardan kök kasasına (t79/r97 yoksa GECICI tablosuyla t89).
  { id: "d7", rol: "duvar", tur: "klip", poster: "p7", dongu: null, ileri: "t79", gelen: "t67", okumaDurak: "sol duvar · ~3 m" },
  { id: "d8", rol: "fidan-kok", tur: "klip", poster: "p9", dongu: null, ileri: "t9a", gelen: "t79" },
  { id: "d9", rol: "fidan-govde", tur: "klip", poster: "pa", dongu: null, ileri: "tab", gelen: "t9a" },
  { id: "d10", rol: "fidan-dal", tur: "klip", poster: "pb", dongu: null, ileri: "tbc", gelen: "tab" },
  { id: "d11", rol: "fidan-yaprak", tur: "klip", poster: "pc", dongu: "lc", ileri: "uzaklasma", gelen: "tbc" },
  // W-2 (§14.7): Dünya'ya uzaklaşma — d11'den zincirle (stant tepeden → Antalya → Türkiye → Dünya); E turundaki d11 gibi.
  { id: "d12", rol: "dunya", tur: "klip", poster: "p1", dongu: "l1", ileri: null, gelen: "uzaklasma", okumaDurak: "ortak evimiz" },
];
/**
 * Zincir geçişler (W-2 §14.7): ileri geçiş birden çok mevcut klibin art arda oynanması; yeni dosya yok. parcalar: klip
 * adları (geri klipler: tur "geri", fragmanı GERI tablosundaki ileri klibin tersi). kopruDurak: posteri ilk parçanın 0.
 * karesi olan durak (site kalkış durağının görüntüsünden ona 350 ms poster çapraz sönmesi yapar). Geri klip yok (`geri:
 * null` → hedef durağın posterine 350 ms sönme, fidan içi geri adımlarla aynı).
 */
const ZINCIR = {
  // stant tepeden (r43[0] ≡ t34[59] ≡ l4[0] ≡ p4) → Antalya → Türkiye → Dünya (r21 son ≡ t12[0] ≡ l1[0] ≡ p1); 60+72+54 kare.
  uzaklasma: { parcalar: ["r43", "r32", "r21"], kopruDurak: "d4" },
};
/**
 * Açık geri klip adları (§12.1, §14.4.1 K4; kodla.mjs'in açık ad tablosuyla aynı). `null`: geri klip yok → manifestte
 * `ileri.geri: null`, site geri adımda hedef durağın posterini 350 ms çapraz söndürür (d9→d8, d10→d9, d11→d10).
 * t78/r87 (masa) W-3'te kalktı; t89 yalnız GECICI yedeği (r98 K-son'da kaldırılmıştı → geri yok).
 */
const GERI = { t01: "r10", t12: "r21", t23: "r32", t34: "r43", t45: "r54", t56: "r65", t67: "r76", t79: "r97", t89: null, t9a: null, tab: null, tbc: null };
/** Geri klibin ileri klibi (r43 → t34): zincir parçasının fragmanı/kadrajı onun tersidir. */
const ileriOf = (geriAd) => Object.keys(GERI).find((k) => GERI[k] === geriAd);
for (const [ad, z] of Object.entries(ZINCIR)) {
  for (const p of z.parcalar) if (!ileriOf(p)) throw new Error(`zincir ${ad}: ${p} GERI tablosunda geri klip değil`);
  if (!DURAKLAR.some((D) => D.id === z.kopruDurak)) throw new Error(`zincir ${ad}: kopruDurak ${z.kopruDurak} yok`);
}

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
/**
 * d6 arka duvar çapaları (p6; G7 §14.4.4, fotoğrafsız duvar): sıra = d6 bandının 3 spot satırı — `bulusma` ("30+"
 * rakamı), `solen` ("100.000+" rakamı), `motto` (`backCover.quote`). E/F'nin `fidan`/`genc_iklim`/`orman` adları
 * artık okunmaz (p6.json yeni G7 render'ıyla gelir; eski adlıysa alan boş + uyarı).
 */
const DUVAR_CAPA = ["bulusma", "solen", "motto"];
/** d11/d12 ana dal uçlarının adları, S3 `dal_uclari` dizisinin sırası (alttan üste; scripts/blender/s3/BENIOKU.md). */
const DAL_UCU_AD = ["solAlt", "sağAlt", "solOrta", "sağOrta", "solÜst", "sağÜst"];
/** Beklenen fidan noktası sayıları (S3 agac_disa.mjs assert'leri: 81 uç, 2 boğum; 6 ana dal). */
const BEKLENEN = { kokUclari: 81, bogumlar: 2, dalUclari: 6 };

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

const FRAGMAN_ADLARI = ["t01", "l1", "t12", "l2", "t23", "l3", "t34", "l4", "t45", "l5", "t56", "t67", "t79", "t89", "t9a", "tab", "tbc", "lc", "p6", "p7", "p9", "pa", "pb", "pc"];
const fragmanlar = {};
for (const ad of FRAGMAN_ADLARI) {
  // t34: t34.json yoksa S1 t34a + S2 t34b birleşimi (fragman.mjs).
  const f = fragmanOku(FRAGMAN, ad, (m) => uyarilar.push(m));
  if (f) fragmanlar[ad] = f;
  else uyarilar.push(`fragman yok: ${ad}`);
}
const ONIZLEME_FRAGMAN = Object.entries(fragmanlar)
  .filter(([, f]) => f.kaynak_set === "onizleme")
  .map(([ad]) => ad);
if (KAYNAK === "render" && ONIZLEME_FRAGMAN.length) uyarilar.push(`--kaynak render ama önizleme fragmanları var (kaynak_set "onizleme"): ${ONIZLEME_FRAGMAN.join(" ")} — A5 son render'ı bekleniyor`);
const liste = JSON.parse(readFileSync(LISTE, "utf8"));
const bul = (klip, tur) => liste.filter((x) => x.klip === klip && x.tur === tur);
/** İngilizce kodlamalar (yoksa boş: manifest yalnız Türkçe). */
const listeEn = existsSync(LISTE_EN) ? JSON.parse(readFileSync(LISTE_EN, "utf8")) : [];
if (!listeEn.length) uyarilar.push(`İngilizce liste yok ya da boş (${LISTE_EN}): manifestte dil.en yok`);
const bulEn = (klip, tur) => listeEn.filter((x) => x.klip === klip && x.tur === tur);
const kullanilanEn = new Set();
const fragmanlarEn = {};
for (const ad of FRAGMAN_ADLARI) {
  if (!listeEn.some((x) => x.kaynakKlip === ad || x.klip === ad)) continue;
  const f = fragmanOku(FRAGMAN_EN, ad, (m) => uyarilar.push(`EN ${m}`));
  if (f) fragmanlarEn[ad] = f;
}
/**
 * Geçici yedek geçişler (W-3 §14.7 C): t79 (sol duvar → kök kasası) ve r97 paralel üretiliyor. Kodlama listesinde t79
 * yoksa DURAKLAR'daki t79 (d7.ileri, d8.gelen) t89'la değişir: ilk karesi masadaki broşür (d7'den kesme), geri klip yok
 * (d8→d7 p7'ye 350 ms poster sönmesi). t79 kodlanınca bu betik yeniden koşulur, uyarı kalkar.
 */
const GECICI = { t79: "t89" };
for (const D of DURAKLAR)
  for (const alan of ["ileri", "gelen"]) {
    const ad = D[alan];
    if (!GECICI[ad] || bul(ad, "ileri").length) continue;
    uyarilar.push(`GEÇİCİ: ${ad} kodlama listesinde yok → ${D.id}.${alan} = ${GECICI[ad]} (geri ${GERI[GECICI[ad]] ?? "yok"}); ${ad}/${GERI[ad]} gelince yeniden üret`);
    D[alan] = GECICI[ad];
  }
if (KAYNAK === "render") {
  const onizlemeGiris = [...new Set(liste.filter((s) => /^960²/.test(s.giris ?? "")).map((s) => s.klip))];
  if (onizlemeGiris.length) uyarilar.push(`--kaynak render ama listede 960² (önizleme) girişli kodlamalar var: ${onizlemeGiris.join(" ")}`);
}

/**
 * Yatay kırpımın y ofseti `kare`de: kaynak klibin `kirpimY`'si — sayı, {bas, son, k0, k1} (easeInOutCubic, kare
 * numarasıyla) ya da F turundan beri ilerlemeye bağlı rampanın kodla.mjs'in çözdüğü kare başına tam sayı dizisi
 * ({bas, son, s0, s1, kareler}; ffmpeg crop ifadesi aynı diziden kurulur → ikisi aynı eğri). Klip kaydı (ileri/geri)
 * önce; poster kaydı (son-kare posterinde o karedeki sayı) yalnız klip kaydı yoksa.
 */
const KIRPIM_Y_VARSAYILAN = 420;
function kirpimYKare(klip, kare = 0) {
  const yatay = liste.filter((x) => x.kaynakKlip === klip && x.boyut === "yatay" && x.kirpimY != null);
  const k = (yatay.find((x) => x.tur !== "poster") ?? yatay[0])?.kirpimY ?? KIRPIM_Y_VARSAYILAN;
  if (typeof k === "number") return k;
  if (Array.isArray(k.kareler)) return k.kareler[Math.min(k.kareler.length - 1, Math.max(0, kare))];
  const t = Math.min(1, Math.max(0, (kare - k.k0) / (k.k1 - k.k0)));
  return Math.round(k.bas + (k.son - k.bas) * (t < 0.5 ? 4 * t ** 3 : 1 - (2 - 2 * t) ** 3 / 2));
}
/** Posterin yatay kırpım ofseti (master px): listedeki yatay poster kaydının sayısal `kirpimY`'si (kodla.mjs posterKodla). */
function posterKirpimY(poster, yedekKlip, yedekKare) {
  const s = liste.find((x) => x.klip === poster && x.tur === "poster" && x.boyut === "yatay");
  if (typeof s?.kirpimY === "number") return s.kirpimY;
  uyarilar.push(`${poster}: yatay poster kaydında sayısal kirpimY yok; ${yedekKlip}[${yedekKare}] kırpımı kullanıldı`);
  return kirpimYKare(yedekKlip, yedekKare);
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

/** İngilizce kodlamanın dosya + bayt eşi (yön/kodek kümesi Türkçeyle aynı olmalı); yoksa null. */
function dilEn(ad, tur, d) {
  const satir = bulEn(ad, tur);
  if (!satir.length) return null;
  const dosya = {};
  const bayt = {};
  for (const s of satir) {
    (dosya[s.boyut] ??= {})[s.kodek] = s.dosya;
    (bayt[s.boyut] ??= {})[s.kodek] = s.bayt;
    kullanilanEn.add(s.dosya);
    if (s.kare !== d.kare) uyarilar.push(`EN ${ad} ${s.boyut} ${s.kodek}: ${s.kare} kare, Türkçe ${d.kare}`);
  }
  for (const [b, kd] of Object.entries(d.dosya))
    for (const k of Object.keys(kd)) if (!dosya[b]?.[k]) uyarilar.push(`EN ${ad} (${tur}): ${b} ${k} kodlaması yok → İngilizce sayfa bu yön/kodekte Türkçe dosyayı alır`);
  return { dosya, bayt };
}

function klipNesnesi(ad, tur) {
  const d = dosyalar(ad, tur);
  if (!d) return null;
  // Geri klip ileri klibin tersidir: fragmanı ileri klibinki.
  const ileriAd = tur === "geri" ? ileriOf(ad) : ad;
  const fr = fragmanlar[ileriAd];
  if (fr && fr.kare !== d.kare) uyarilar.push(`${ad}: fragman ${fr.kare} kare, kodlanmış ${d.kare} kare`);
  const en = dilEn(ad, tur, d);
  return { ad, sure: d.sure, kare: d.kare, dosya: d.dosya, bayt: d.bayt, ...(en ? { dil: { en } } : {}) };
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
    const s = liste.find((x) => x.klip === ad && x.tur === "poster" && x.boyut === boyut);
    if (!s) {
      uyarilar.push(`poster yok: ${ad} ${boyut}`);
      continue;
    }
    const yol = s.yol && existsSync(s.yol) ? s.yol : join(PUBLIC, s.dosya);
    p[boyut] = { dosya: s.dosya, bayt: s.bayt, lqip: await lqip(yol) };
    const e = listeEn.find((x) => x.klip === ad && x.tur === "poster" && x.boyut === boyut);
    if (e) {
      kullanilanEn.add(e.dosya);
      const ey = e.yol && existsSync(e.yol) ? e.yol : join(PUBLIC, e.dosya);
      if (e.kirpimY !== s.kirpimY) uyarilar.push(`EN poster ${ad} ${boyut}: kirpimY ${e.kirpimY} ≠ Türkçe ${s.kirpimY}`);
      p[boyut].dil = { en: { dosya: e.dosya, bayt: e.bayt, lqip: await lqip(ey) } };
    }
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
  if (!/^sutun\d\d$/.test(ad)) uyarilar.push(`${durakId}: sözlükte olmayan çapa "${ad}"`);
  return null;
}

/** yaylar.json → {dikey, yatay} (video px; yay başına ≤ 24 nokta). Yoksa null (site yaysız çizer). */
function yaylarOku() {
  if (!existsSync(YAYLAR)) {
    uyarilar.push(`yaylar yok (${YAYLAR}): d1 ozel.yaylar boş`);
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

// ---------- fidan çapaları (S3; §14.4.2) ----------
/** Durağın S3 çapası: önce poster fragmanı (p9/pa/pb/pc), sonra sırayla yedek klipler (gelen geçiş, döngü). */
function s3Capa(alan, poster, ...yedek) {
  for (const ad of [poster, ...yedek]) {
    const c = fragmanlar[ad]?.capalar?.[alan];
    if (c != null) return { c, ad };
  }
  return null;
}
/** Nokta biçimleri: [x, y] | {x, y, …}. */
const xy = (n) => (Array.isArray(n) ? [n[0], n[1]] : [n.x, n.y]);
/**
 * Master px noktaları → yön başına video px; kırpım dışı / kenara 24 px'ten yakın nokta o yönde atlanır (uyarı: yön
 * başına sayı). `ek(n)`: noktanın taşıdığı ek alanlar.
 */
function yonlu(durakId, alan, noktalar, yY, ek) {
  const o = { dikey: [], yatay: [] };
  for (const boyut of Object.keys(BOYUTLAR)) {
    let atla = 0;
    for (const [i, n] of noktalar.entries()) {
      const v = video(boyut, xy(n), yY);
      if (!icinde(boyut, v)) {
        atla++;
        continue;
      }
      o[boyut].push({ ...(ek ? ek(n, i).on ?? {} : {}), x: v[0], y: v[1], ...(ek ? ek(n, i).arka ?? {} : {}) });
    }
    if (atla) uyarilar.push(`${durakId} ${alan}: ${boyut} ${atla}/${noktalar.length} nokta kırpım dışı ya da kenara < ${KENAR} px (atlandı; kirpimY ${boyut === "yatay" ? yY : "—"})`);
  }
  return o;
}
/** S3 `dal_uclari`: [[x, y] × 6] (sıra DAL_UCU_AD) | [{ad, x, y}] | {ad: [x, y]} → [{ad, n}]. */
function dalUcuListesi(c) {
  if (Array.isArray(c)) return c.map((n, i) => ({ ad: n?.ad ?? DAL_UCU_AD[i] ?? `dal${i}`, n }));
  return Object.entries(c).map(([ad, n]) => ({ ad, n }));
}
function dalUclari(durakId, kaynak, yY) {
  const l = dalUcuListesi(kaynak.c);
  if (l.length !== BEKLENEN.dalUclari) uyarilar.push(`${durakId} dalUclari: ${l.length} uç (${BEKLENEN.dalUclari} beklenir; ${kaynak.ad})`);
  for (const { ad } of l) if (!DAL_UCU_AD.includes(ad)) uyarilar.push(`${durakId} dalUclari: bilinmeyen ad "${ad}" (${DAL_UCU_AD.join(", ")})`);
  return yonlu(durakId, "dalUclari", l.map((x) => x.n), yY, (_, i) => ({ on: { ad: l[i].ad } }));
}

/**
 * d6 arka duvar çapaları (G7 §14.4.4): `fr` = p6 fragmanı (yön başına `duvarCapalari`, yoksa tek nokta `capalar`), yatay
 * kırpım p6 posterinin kirpimY'si. Kırpım dışına ya da kenara 24 px'ten yakın düşen yön YAZILMAZ (motto dikeyde x ≈ 911
 * video px); site o yönde çapa yoksa kılavuz çizmez (VideoSahne kilavuzCapa `?.[boyut] ?? null`). G7 adları yoksa null.
 */
function duvarCapalari(D, fr, yP6, onek) {
  const yon = Array.isArray(fr?.duvarCapalari) ? Object.fromEntries(fr.duvarCapalari.map((x) => [x.ad, x])) : null;
  const tek = fr?.capalar ?? null;
  const bulunan = DUVAR_CAPA.filter((ad) => yon?.[ad] || tek?.[ad]);
  if (bulunan.length !== DUVAR_CAPA.length) {
    const eski = Object.keys(yon ?? tek ?? {});
    uyarilar.push(`${onek}${D.id}: duvar çapası ${bulunan.length}/${DUVAR_CAPA.length} (${DUVAR_CAPA.join(", ")}; p6.json'da: ${eski.join(", ") || "—"})`);
  }
  if (!bulunan.length) return null;
  return bulunan.map((ad) => {
    const v = {
      dikey: video("dikey", yon?.[ad]?.dikey ?? tek[ad]),
      yatay: video("yatay", yon?.[ad]?.yatay ?? tek[ad], yP6),
    };
    const c = { ad };
    for (const b of Object.keys(BOYUTLAR)) {
      if (icinde(b, v[b])) c[b] = v[b];
      else uyarilar.push(`${onek}${D.id}: duvar çapası "${ad}" ${b} kırpım dışında ya da kenara < ${KENAR} px (${v[b].join(", ")}${b === "yatay" ? `; kirpimY ${yP6}` : ""}) — o yönde yazılmadı (§14.4.4)`);
    }
    return c;
  });
}

const duraklar = [];
let emanetSay = 0;
for (const D of DURAKLAR) {
  const o = { id: D.id, rol: D.rol, tur: D.tur };
  // okuma: gelen klibin kare kare kadrajı (metre; son öğe dinlenme değeri) ya da sabit metin. Zincirde parçaların ileri
  // klip kadrajları tersten, art arda (r43 = t34 tersi …; son öğe Dünya, t12[0]).
  const zg = ZINCIR[D.gelen];
  const gk = zg
    ? zg.parcalar.every((p) => fragmanlar[ileriOf(p)]?.kadraj_m)
      ? zg.parcalar.flatMap((p) => [...fragmanlar[ileriOf(p)].kadraj_m].reverse())
      : null
    : D.gelen
      ? fragmanlar[D.gelen]?.kadraj_m
      : null;
  o.okuma = gk ? gk.map(sig) : (D.okuma ?? "");
  if (D.gelen && !gk) uyarilar.push(`${D.id}: ${D.gelen} fragmanında kadraj_m yok (okuma boş)`);
  if (D.okumaDurak) o.okumaDurak = D.okumaDurak;
  o.poster = await poster(D.poster);
  o.dongu = D.dongu ? klipNesnesi(D.dongu, "dongu") : null;
  if (ZINCIR[D.ileri]) {
    // Zincir (W-2 §14.7): parçalar mevcut geri klip kayıtları; üst düzey süre/kare toplam, dosya/bayt boş (yeni dosya yok).
    const z = ZINCIR[D.ileri];
    const parcalar = z.parcalar.map((p) => klipNesnesi(p, "geri"));
    if (parcalar.some((p) => !p)) uyarilar.push(`${D.id}: zincir ${D.ileri} parçası eksik (${z.parcalar.join(" ")})`);
    const tam = parcalar.filter(Boolean);
    o.ileri =
      tam.length === z.parcalar.length
        ? {
            ad: D.ileri,
            sure: Math.round(tam.reduce((s, p) => s + p.sure, 0) * 1000) / 1000,
            kare: tam.reduce((s, p) => s + p.kare, 0),
            dosya: {},
            bayt: {},
            geri: null,
            hizGeri: HIZ_GERI,
            parcalar: tam,
            kopruDurak: z.kopruDurak,
          }
        : null;
  } else if (D.ileri) {
    const ileri = klipNesnesi(D.ileri, "ileri");
    if (!(D.ileri in GERI)) throw new Error(`GERI tablosunda yok: ${D.ileri}`);
    const gAd = GERI[D.ileri];
    // null: fidan içi geri adım (poster çapraz sönmesi) ya da bütçe merdiveninde bilerek kaldırılan geri klip.
    const geri = gAd && !GERI_YOK.has(gAd) ? klipNesnesi(gAd, "geri") : null;
    o.ileri = ileri ? { ...ileri, geri, hizGeri: HIZ_GERI } : null;
  } else o.ileri = null;

  // Sahne etiketleri (dikey/yatay video px); kırpımda kalan ya da kenara 24 px'ten yakın çapa o yönde atlanır.
  const { capa, yY } = capalarDurak(D);
  if (capa && (ETIKET[D.id] || D.id === "d2")) {
    o.etiketler = { dikey: [], yatay: [] };
    for (const [ad, nokta] of Object.entries(capa)) {
      const e = etiketTanimi(D.id, ad);
      if (!e) continue;
      if (e.tur === "emanet") emanetSay++;
      for (const boyut of Object.keys(BOYUTLAR)) {
        if (e.boyutlar && !e.boyutlar.includes(boyut)) continue;
        const v = video(boyut, nokta, yY);
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
    // p6 çapaları (S2 json_yaz): önce p6 fragmanının yön başına `duvarCapalari` listesi (master px; her yön kendi
    // kırpımına giren nokta), yoksa p6 `capalar` (iki kırpıma da giren tek nokta). Yatay: p6 posterinin kirpimY'si
    // (E2: 293; §12.12). G-B'de site d6 kılavuzunu yeniden çizer (bant satırı → rakam); kırpım dışına düşen yön
    // yazılmaz (uyarı). G7 adları (bulusma, solen, motto) yoksa alan yazılmaz. İngilizce duvar (render-son-en/p6.json)
    // kendi yerleşimiyle: ozel.dil.en.duvarCapalari.
    const yP6 = posterKirpimY("p6", "t56", (fragmanlar.t56?.kare ?? 1) - 1);
    const dc = duvarCapalari(D, fragmanlar.p6, yP6, "");
    if (dc) ozel.duvarCapalari = dc;
    if (fragmanlarEn.p6) {
      const dcEn = duvarCapalari(D, fragmanlarEn.p6, yP6, "EN ");
      if (dcEn) ozel.dil = { en: { duvarCapalari: dcEn } };
    }
  }
  if (D.rol === "fidan-kok") {
    // d8: 81 kök ucu (p9 = t79 son karesi, geçicide t89; DOM 81 halka). grup 0 kazık, 1–6 ana kökler; ana: ana kökün ucu mu.
    const k = s3Capa("kok_uclari", D.poster, D.gelen);
    if (k) {
      const yP = posterKirpimY(D.poster, D.gelen, (fragmanlar[D.gelen]?.kare ?? 1) - 1);
      if (k.c.length !== BEKLENEN.kokUclari) uyarilar.push(`${D.id} kokUclari: ${k.c.length} uç (${BEKLENEN.kokUclari} beklenir; ${k.ad})`);
      ozel.kokUclari = yonlu(D.id, "kokUclari", k.c, yP, (n) => ({ arka: { grup: n.grup ?? 0, ana: !!n.ana } }));
    } else uyarilar.push(`${D.id}: kok_uclari yok (${D.poster}.json / ${D.gelen}.json capalar)`);
  }
  if (D.rol === "fidan-govde") {
    // d9: 2 boğum (2017 / TBMM; metin DOM'da content.ts'ten — JSON'daki baslik/satirlar KULLANILMAZ). taraf −1 sol, +1 sağ.
    const k = s3Capa("bogumlar", D.poster, D.gelen);
    if (k) {
      const yP = posterKirpimY(D.poster, D.gelen, (fragmanlar[D.gelen]?.kare ?? 1) - 1);
      if (k.c.length !== BEKLENEN.bogumlar) uyarilar.push(`${D.id} bogumlar: ${k.c.length} (${BEKLENEN.bogumlar} beklenir; ${k.ad})`);
      ozel.bogumlar = yonlu(D.id, "bogumlar", k.c, yP, (n) => ({ arka: { taraf: n.taraf < 0 ? -1 : 1 } }));
    } else uyarilar.push(`${D.id}: bogumlar yok (${D.poster}.json / ${D.gelen}.json capalar)`);
  }
  if (D.rol === "fidan-dal") {
    // d10: 6 ana dal ucu (polaroid çapaları; K6: sol p12 + p17, sağ p19 + p22).
    const k = s3Capa("dal_uclari", D.poster, D.gelen);
    if (k) ozel.dalUclari = dalUclari(D.id, k, posterKirpimY(D.poster, D.gelen, (fragmanlar[D.gelen]?.kare ?? 1) - 1));
    else uyarilar.push(`${D.id}: dal_uclari yok (${D.poster}.json / ${D.gelen}.json capalar)`);
  }
  if (D.rol === "fidan-yaprak") {
    // d11: dal uçları + gövde ucu (pc = lc[0] ≡ tbc son karesi).
    const yP = posterKirpimY(D.poster, D.dongu ?? D.gelen, 0);
    const k = s3Capa("dal_uclari", D.poster, D.dongu, D.gelen);
    if (k) ozel.dalUclari = dalUclari(D.id, k, yP);
    else uyarilar.push(`${D.id}: dal_uclari yok (${D.poster}/${D.dongu}/${D.gelen} capalar)`);
    const g = s3Capa("govde_ucu", D.poster, D.dongu, D.gelen);
    if (g) {
      const v = yonlu(D.id, "govdeUcu", [g.c], yP);
      ozel.govdeUcu = Object.fromEntries(Object.entries(v).filter(([, l]) => l.length).map(([b, [n]]) => [b, [n.x, n.y]]));
    } else uyarilar.push(`${D.id}: govde_ucu yok (${D.poster}/${D.dongu}/${D.gelen} capalar)`);
  }
  if (Object.keys(ozel).length) o.ozel = ozel;
  duraklar.push(o);
}
if (emanetSay !== 12) uyarilar.push(`d2: ${emanetSay} emanet çapası (12 beklenir; S1a l2.json capalar "emanet01"…"emanet12")`);

const manifest = {
  surum: SURUM,
  olusturma: new Date().toISOString(),
  kaynak: KAYNAK,
  fps: 30,
  master: MASTER,
  boyutlar: BOYUTLAR,
  kodekler: KODEKLER,
  duraklar,
};
// Girintili, ama sayı dizileri tek satırda (okuma, dunyaR, yay noktaları) ve fidan noktaları tek satırda: diff okunur kalsın.
const metin = JSON.stringify(manifest, null, 1)
  .replace(/\[\s+(-?[\d.]+(?:,\s+-?[\d.]+)*)\s+\]/g, (_, a) => `[${a.split(/,\s+/).join(", ")}]`)
  .replace(/\{\s+("(?:ad|x)":[^{}[\]]+?)\s+\}/g, (_, a) => `{${a.replace(/\s*\n\s*/g, " ")}}`);
writeFileSync(CIKTI, metin + "\n");

// ---------- özet: medya baytları (manifestin gösterdiği tekil dosyalar), rol tablosu, özel alanlar ----------
const MB = 1e6;
const medya = {};
const ekle = (anahtar, dosya, bayt) => ((medya[anahtar] ??= new Map()).set(dosya, bayt));
for (const d of duraklar) {
  for (const k of [d.dongu, d.ileri, d.ileri?.geri, ...(d.ileri?.parcalar ?? [])].filter(Boolean))
    for (const [b, kd] of Object.entries(k.dosya)) for (const [kodek, dosya] of Object.entries(kd)) ekle(`${b}-${kodek}`, dosya, k.bayt[b][kodek]);
  for (const [b, p] of Object.entries(d.poster ?? {})) for (const kodek of ["h264", "hevc", "av1"]) if (KODEKLER.find((x) => x.ad === kodek).boyutlar.includes(b)) ekle(`${b}-${kodek}`, p.dosya, p.bayt);
}
console.log(`yazıldı: ${CIKTI} (${(JSON.stringify(manifest).length / 1024).toFixed(1)} KB; surum ${SURUM}; kaynak ${KAYNAK}; ${duraklar.length} durak + kapanış = N ${duraklar.length})`);
{
  // İngilizce oturumun medyası: Türkçe manifestin tekil dosyaları, dil.en olan girdide İngilizce dosyayla
  const medyaEn = {};
  const ekleEn = (anahtar, dosya, bayt) => ((medyaEn[anahtar] ??= new Map()).set(dosya, bayt));
  for (const d of duraklar) {
    for (const k of [d.dongu, d.ileri, d.ileri?.geri, ...(d.ileri?.parcalar ?? [])].filter(Boolean)) {
      const kk = k.dil?.en ?? k;
      for (const [b, kd] of Object.entries(k.dosya)) for (const kodek of Object.keys(kd)) ekleEn(`${b}-${kodek}`, kk.dosya[b]?.[kodek] ?? kd[kodek], kk.bayt[b]?.[kodek] ?? k.bayt[b][kodek]);
    }
    for (const [b, p] of Object.entries(d.poster ?? {}))
      for (const kodek of ["h264", "hevc", "av1"]) if (KODEKLER.find((x) => x.ad === kodek).boyutlar.includes(b)) ekleEn(`${b}-${kodek}`, (p.dil?.en ?? p).dosya, (p.dil?.en ?? p).bayt);
  }
  console.log(
    "İngilizce oturum medyası (aynı tanım):",
    Object.entries(medyaEn)
      .map(([k, m]) => `${k} ${([...m.values()].reduce((s, v) => s + v, 0) / MB).toFixed(3)}`)
      .join(" · "),
  );
  const bos = listeEn.filter((x) => !kullanilanEn.has(x.dosya)).map((x) => x.dosya);
  if (bos.length) uyarilar.push(`İngilizce listede manifestin kullanmadığı ${bos.length} kayıt: ${bos.join(" ")}`);
  console.log(`dil.en: ${kullanilanEn.size}/${listeEn.length} İngilizce kayıt manifestte`);
}
console.log(
  "manifest medyası (video + poster, tekil dosya, MB = 10^6; oturum = bu + W'nin medya dışı ölçümü):",
  Object.entries(medya)
    .map(([k, m]) => `${k} ${([...m.values()].reduce((s, v) => s + v, 0) / MB).toFixed(3)}`)
    .join(" · "),
);
console.log("id | rol | tur | gelen | ileri / geri | döngü | poster | okuma");
for (const [i, o] of duraklar.entries()) {
  const D = DURAKLAR[i];
  const okuma = typeof o.okuma === "string" ? o.okuma || "—" : `${o.okuma.length} kare (${o.okuma[0]} → ${o.okuma.at(-1)} m)`;
  console.log(
    [o.id, o.rol, o.tur, D.gelen ?? "—", o.ileri ? `${o.ileri.ad}${o.ileri.parcalar ? `(${o.ileri.parcalar.map((p) => p.ad).join("→")}; köprü ${o.ileri.kopruDurak})` : ""}/${o.ileri.geri?.ad ?? "—"}` : "—", o.dongu?.ad ?? "—", D.poster ?? "—", `${okuma}${o.okumaDurak ? ` · "${o.okumaDurak}"` : ""}`].join(" | "),
  );
}
const say = (v) => (Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.entries(v).map(([b, l]) => `${b} ${Array.isArray(l) ? (typeof l[0] === "number" ? "[x,y]" : l.length) : "?"}`).join(", ") : String(v));
for (const o of duraklar) if (o.ozel) console.log(`ozel ${o.id}: ${Object.entries(o.ozel).map(([k, v]) => `${k} (${k === "dunyaR" ? v.length : say(v)})`).join("; ")}`);
if (uyarilar.length) console.log("UYARILAR:\n - " + [...new Set(uyarilar)].join("\n - "));
else console.log("UYARILAR: yok");
