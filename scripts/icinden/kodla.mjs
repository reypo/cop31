// /icinden v3 — master klipleri teslim kodlamasına çevirir (docs/brief-icinden-3.md §9.4, §11.2, §12.5).
//
//   node scripts/icinden/kodla.mjs --kaynak <render dizini> [--cikti public/icinden] [--liste <kodlama.json>]
//        [--fragman <dizin>] [--klip t12,r21,l3.av1,p2] [--preset slow] [--esle t34b=<klasör>,l4=<klasör>]
//        [--crf t23.h264=26,t34.av1=32]   (CRF_TABLO üstüne ayar; ayrıntı CRF_AYAR'da)
//        [--poster-q p3=72,p6=oto]        (poster WebP kalitesi; POSTER_Q_TABAN üstüne)
//        [--bolge t23.h264=74-83:-4]      (x264/x265 zones; BOLGE_TABAN üstüne; `=yok` kaldırır)
//        [--temizle]                      (kodlanan çıktının eski özetli dosyalarını iş sonunda sil)
//   node scripts/icinden/kodla.mjs --artik [--kuru]   (listede olmayan özetli dosyaları sil / yalnız listele)
//
// Kaynak: her klip için `<kaynak>/<klip>/k_%04d.png` (Blender çıktısı). Giriş boyutu serbest: 1920² PNG 16 bit
// (son render) ya da 960² PNG 8 bit (EEVEE önizleme); kırpım master'a göre oransal (dikey x %21,875, yatay y
// KIRPIM_Y / 1920 — klip başına, §11.2-5), ölçek lanczos. 16 bit → 8 bit dönüşüm kodlayıcıdan önce, BT.709 matris
// (renk etiketi de 709). Yer tutucu: `<kaynak>/<klip>.mkv`. `--esle` ile tek tek klasör verilebilir.
//
// t34 (§9.1): `<kaynak>/t34/` yoksa `t34a/` (S1, 0–47) + `t34b/` (S2, 48–71 ya da 0'dan) art arda birleşir
// (ffmpeg concat); fragman da birleşir (fragman.mjs).
//
// Ad tablosu (§12.1, açık; "r" + klip[2] + klip[1] türetmesi yok): ileri → geri GERI'de (t01→r10 … t78→r87),
// döngüler l1–l5, posterler POSTER'de: `dongu` (döngünün 0. karesi; p1–p5), `son-kare` (ileri geçişin master SON
// karesi; p6 ← t56, p7 ← t67), `plaka` (kendi tek kareli klasörü; p8 = eski p6 banko plakası, `render-son/p8/`).
// `<kaynak>/pN.json`'daki `tip` alanı ("dongu" | "son-kare" | "plaka") ve isteğe bağlı `kaynak_klip` tabloyu ezer.
// p8: master PNG özeti (`kaynakOzet`) listedeki p8 kaydıyla aynıysa ve dosya duruyorsa yeniden kodlanmaz; ilk
// kodlamada çıktı eski p6 plakasıyla bayt bayt karşılaştırılır (libwebp belirlenimci: aynı master → aynı özet).
// render-son/p8 yoksa eski p6 plaka dosyası p8 adıyla kopyalanır (yeniden kodlama yok).
//
// `--klip`: yalnız seçilen ÇIKTILAR kodlanır; öğe `ad[.kodek][.boyut]` (ad: t12, r21, l3, p6…; kodek h264 | hevc |
// av1 | webp; boyut dikey | yatay | d | y). Ör. `--klip l3.av1` yalnız l3 AV1 (dikey + yatay), p3 ve öteki kodekler
// dokunulmaz. Seçim yoksa hepsi (kaynağı olmayanlar uyarıyla atlanır). Liste kayıt kayıt güncellenir (anahtar
// klip + tür + boyut + kodek), kilitli oku-birleştir-yaz: başka koşuların kayıtları korunur.
//
// Çıktı: `<cikti>/v/{d,y}/<ad>.<8 hex>.<kodek>.mp4`, posterler `<cikti>/p/{d,y}/<ad>.<8 hex>.webp`; geri klipler
// ileri klibin tersi (reverse kırpım+ölçekten SONRA). Eski özetli dosyalar VARSAYILAN OLARAK SİLİNMEZ (yayındaki
// klipler.json onları gösteriyor olabilir; E turunda K2 temizler): `--temizle` ya da `--artik`.
// Liste (manifest-birlestir.mjs girdisi), varsayılan `D:/soft/cop31-varlik/kodlama/<kaynak klasör adı>.json`:
// [{kaynakKlip, klip, tur, boyut, kodek, dosya, bayt, kare, sure, crf, bolge, kalite, posterTip, kaynakKare,
// kaynakOzet, merdiven, esdeger, kirpimY, kirpim, etiket, ms, yol, giris}]. `kirpimY` kaynak klibin (ileri kare
// numarasıyla) yatay y ofsetidir; son-kare posterinde o karedeki sayı. `kirpim` kullanılan ffmpeg crop filtresi
// (kodlama-dogrula.py VMAF referansını aynı kırpımla kurar).
//
// H.264 High@3.1, HEVC x265 hvc1 (yalnız dikey), AV1 SVT-AV1 p4; CRF CRF_TABLO'da (§12.5); GOP = klip uzunluğu,
// sahne kesmesi kapalı, +faststart, ses yok. Posterler WebP (POSTER_Q_TABAN; p6/p7 `oto` merdiveni). Süreç önceliği
// düşük.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { setPriority, constants } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import sharp from "sharp";
import { dizi, fragmanOku, kareParcalari } from "./fragman.mjs";

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const bayrak = (k) => argv.includes(k);
const KAYNAK = resolve(arg("--kaynak", "D:/soft/cop31-varlik/render-son"));
const FRAGMAN = resolve(arg("--fragman", KAYNAK));
const CIKTI = resolve(arg("--cikti", "public/icinden"));
const LISTE = resolve(arg("--liste", `D:/soft/cop31-varlik/kodlama/${basename(KAYNAK)}.json`));
const PRESET = arg("--preset", "slow");
const TEMIZLE = bayrak("--temizle");
const ESLE = Object.fromEntries(
  arg("--esle", "")
    .split(",")
    .filter(Boolean)
    .map((s) => [s.slice(0, s.indexOf("=")), resolve(s.slice(s.indexOf("=") + 1))]),
);
const FPS = 30;
try {
  setPriority(0, constants.priority.PRIORITY_BELOW_NORMAL);
} catch {
  /* öncelik değiştirilemezse normal sürer */
}

// ---------- ad tablosu (§12.1) ----------
/** İleri geçiş → geri klip (açık tablo). d11→d10 da r10'u kullanır (site). */
const GERI = { t01: "r10", t12: "r21", t23: "r32", t34: "r43", t45: "r54", t56: "r65", t67: "r76", t78: "r87" };
const DONGU = ["l1", "l2", "l3", "l4", "l5"];
/** Posterler: tip + kare kaynağı. pN.json `tip` / `kaynak_klip` alanı ezer (posterTablosu). */
const POSTER_TABAN = {
  p1: { tip: "dongu", kaynak: "l1" },
  p2: { tip: "dongu", kaynak: "l2" },
  p3: { tip: "dongu", kaynak: "l3" },
  p4: { tip: "dongu", kaynak: "l4" },
  p5: { tip: "dongu", kaynak: "l5" },
  p6: { tip: "son-kare", kaynak: "t56" },
  p7: { tip: "son-kare", kaynak: "t67" },
  p8: { tip: "plaka", kaynak: "p8", eski: "p6" },
};
/** Kaynak (kare dizisi) sırası: liste sırası ve kodlama sırası bu. */
const KAYNAK_SIRA = ["t01", "l1", "t12", "l2", "t23", "l3", "t34", "l4", "t45", "l5", "t56", "t67", "t78", "p8"];
const KODEK_SIRA = ["h264", "hevc", "av1", "webp"];
const TUR_SIRA = ["poster", "ileri", "dongu", "geri"];

function posterTablosu() {
  const t = {};
  for (const [ad, v] of Object.entries(POSTER_TABAN)) {
    const yol = join(FRAGMAN, `${ad}.json`);
    let f = null;
    try {
      f = existsSync(yol) ? JSON.parse(readFileSync(yol, "utf8")) : null;
    } catch {
      console.warn(`UYARI ${ad}.json okunamadı`);
    }
    const tip = f?.tip ? String(f.tip).replace("_", "-") : v.tip;
    if (!["dongu", "son-kare", "plaka"].includes(tip)) throw new Error(`${ad}.json tip "${f.tip}" tanınmıyor (dongu | son-kare | plaka)`);
    // Plaka hep kendi klasöründen (p8.json'daki kamera kaynağı t78 olsa da kare render-son/p8/k_0000.png).
    const kaynak = tip === "plaka" ? ad : (f?.kaynak_klip ?? f?.kaynakKlip ?? v.kaynak);
    if (f?.tip && tip !== v.tip) console.warn(`UYARI ${ad}: ${ad}.json tip "${tip}", tablo "${v.tip}" — json geçerli`);
    if (!f?.tip && v.tip !== "plaka" && existsSync(join(KAYNAK, ad))) console.warn(`UYARI ${ad}: ${join(KAYNAK, ad)} klasörü var ama ${ad}.json'da tip yok; tablo "${v.tip}" (← ${v.kaynak}) geçerli, klasör yok sayıldı (eski plaka mı? §12.9-4)`);
    t[ad] = { tip, kaynak, eski: v.eski ?? null, kare: f?.kaynak_kare ?? null };
  }
  return t;
}
const POSTER = posterTablosu();

/** Bir kaynaktan çıkan çıktılar (ad, tür). */
function ciktilar(kaynak) {
  const o = [];
  for (const [ad, p] of Object.entries(POSTER)) if (p.kaynak === kaynak) o.push({ ad, tur: "poster", tip: p.tip });
  if (GERI[kaynak]) o.push({ ad: kaynak, tur: "ileri" }, { ad: GERI[kaynak], tur: "geri" });
  if (DONGU.includes(kaynak)) o.push({ ad: kaynak, tur: "dongu" });
  return o;
}
const KAYNAKLAR = [...new Set([...KAYNAK_SIRA, ...Object.values(POSTER).map((p) => p.kaynak)])];
const TUM_ADLAR = new Set(KAYNAKLAR.flatMap((k) => ciktilar(k).map((c) => c.ad)));

// ---------- seçim (`--klip ad[.kodek][.boyut]`) ----------
const BOYUT_AD = { dikey: "dikey", yatay: "yatay", d: "dikey", y: "yatay" };
const SECIM = arg("--klip", "")
  .split(",")
  .filter(Boolean)
  .map((s) => {
    const [ad, ...ek] = s.split(".");
    if (!TUM_ADLAR.has(ad)) throw new Error(`--klip: "${ad}" bilinmeyen çıktı adı (${[...TUM_ADLAR].join(" ")})`);
    const x = { ad };
    for (const e of ek) {
      if (KODEK_SIRA.includes(e)) x.kodek = e;
      else if (BOYUT_AD[e]) x.boyut = BOYUT_AD[e];
      else throw new Error(`--klip ${s}: "${e}" kodek ya da boyut değil`);
    }
    return x;
  });
const secildi = (ad, boyut, kodek) => !SECIM.length || SECIM.some((x) => x.ad === ad && (!x.kodek || x.kodek === kodek) && (!x.boyut || x.boyut === boyut));
const adSecildi = (ad) => !SECIM.length || SECIM.some((x) => x.ad === ad);

// ---------- kırpım ----------
// Oransal kırpım (master 1920: dikey 1080×1920 @ x 420, yatay 1920×1080 @ y KIRPIM_Y) → teslim boyutu, BT.709.
const RENK = "out_color_matrix=bt709:out_range=tv";
/**
 * Yatay kırpımın y ofseti, master px (§11.2-5: d3'te ufuk — Beydağları, körfez — kadraja girsin). Sayı ya da
 * {bas, son, k0, k1}: kare ≤ k0 → bas, ≥ k1 → son, arası easeInOutCubic. t34'te {200 → 420, 47 → 48} basamaktır:
 * geçiş düz parlama karelerinde (#FFF1DC) olur, 47↔48 farkı 0 kalır. Listede olmayan klip 420 (t01/l1/t12/l2 ve
 * S2 klipleri değişmez; lombar hizası bozulmaz). Geri klipler `reverse` kırpımdan SONRA olduğundan kendiliğinden doğru.
 * E turunda değişmez (§12.3: d6/d7 yatayda 420).
 */
const KIRPIM_Y = {
  t23: { bas: 420, son: 200, k0: 24, k1: 72 },
  l3: 200,
  t34: { bas: 200, son: 420, k0: 47, k1: 48 },
};
const KIRPIM_Y_VARSAYILAN = 420;
const kirpimYOf = (klip) => KIRPIM_Y[klip] ?? KIRPIM_Y_VARSAYILAN;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (2 - 2 * t) ** 3 / 2);
/** kirpimY'nin `n`. karedeki sayısal değeri (son-kare posteri için; ffmpeg crop ifadesiyle aynı eğri). */
function kirpimYKare(k, n) {
  if (typeof k === "number") return k;
  const t = Math.min(1, Math.max(0, (n - k.k0) / (k.k1 - k.k0)));
  return k.bas + (k.son - k.bas) * easeInOutCubic(t);
}
/** ffmpeg crop `y` ifadesi (kare numarası `n`; crop sonucu lrint ile tam sayıya yuvarlar, ölçekten önce). */
function kirpimYIfade(k) {
  if (typeof k === "number") return `ih*${k}/1920`;
  const t = `clip((n-${k.k0})/${k.k1 - k.k0},0,1)`;
  return `ih*(${k.bas}+(${k.son}-${k.bas})*if(lt(${t},0.5),4*pow(${t},3),1-pow(2-2*${t},3)/2))/1920`;
}
const BOYUT = {
  dikey: { kisa: "d", kirp: () => "crop=w=iw*1080/1920:h=ih:x=iw*420/1920:y=0", g: 720, y: 1280, kodekler: ["h264", "hevc", "av1"] },
  yatay: { kisa: "y", kirp: (k) => `crop=w=iw:h=ih*1080/1920:x=0:y='${kirpimYIfade(k)}'`, g: 1280, y: 720, kodekler: ["h264", "av1"] },
};

// ---------- CRF (§12.5) ----------
/** [H.264, HEVC, AV1]. Önce ad, yoksa tür. §12.5 tablosu; yeniden kodlanmayanlar (t01, l1, r10, l5) aynı değerde. */
const CRF_TABLO = {
  ileri: [23, 25, 30], // t01, t12, t45
  t23: [26, 27, 32],
  t34: [26, 27, 34],
  t56: [23, 25, 32], // duvar ileri: AV1 +2 (oturum bütçesi)
  t67: [23, 25, 32],
  t78: [23, 25, 32],
  dongu: [23, 25, 30], // l1, l4, l5
  l2: [23, 25, 32], // AV1 368 kB, H.264'ten büyük
  l3: [23, 25, 34], // yalnız yeniden kodlama (32'de VMAF 97,1)
  geri: [26, 28, 34], // r10, r43, r54
  r21: [27, 28, 34], // F turu (denetim M-1): yatay H.264 d2 penceresi 2,504 → ≤ 2,5; VMAF 92,30 / 92,17
  r32: [26.5, 28, 34], // H.264 d3 penceresi; F turu (M-2): 27'de VMAF 89,83 / 89,54 < 90 → 26,5 (91,07 / 90,93)
  r65: [26, 28, 36], // duvar geri: AV1 +2
  r76: [26, 28, 36],
  r87: [26, 28, 36],
};
const KODEK_I = { h264: 0, hevc: 1, av1: 2 };
const crfTaban = (ad, tur, kodek) => (CRF_TABLO[ad] ?? CRF_TABLO[tur])[KODEK_I[kodek]];
// Ayar (§9.4 "aşarsa önce döngü CRF, sonra geri klip CRF"; §12.7-1 merdiveni): `--crf geri=+2,r65.av1=37`.
// Seçici: tür (ileri|geri|dongu) ya da dosya adı (t01, r32, l3), isteğe bağlı `.kodek`; değer `+N`/`-N` (tablo
// değerine ek) ya da `N` (mutlak). Sıra: tablo → tür → tür.kodek → ad → ad.kodek (sonraki öncekini ezer).
const CRF_AYAR = Object.fromEntries(
  arg("--crf", "")
    .split(",")
    .filter(Boolean)
    .map((s) => s.split("=")),
);
function crfSec(kodek, tur, ad) {
  const taban = crfTaban(ad, tur, kodek);
  let c = taban;
  for (const k of [tur, `${tur}.${kodek}`, ad, `${ad}.${kodek}`]) {
    const v = CRF_AYAR[k];
    if (v !== undefined) c = /^[+-]/.test(v) ? taban + Number(v) : Number(v);
  }
  return c;
}

// ---------- poster kalitesi ----------
// Sayı ya da "oto" (§12.5: q68–80 arasında, master'a ΔE00 uzaklığı q80'inkinden en çok +1,0 fazla olan en düşük
// kalite; hedef ≤ 60 kB dikey). p3 q68 (§11.6-2; E'de yeniden kodlanmaz). `--poster-q p6=72,p3.yatay=70`.
// p6/p7 q80 (F turu, denetim D3-03): "oto" merdiveni q68'i seçiyor ve §12.6 başlık bölgesi sınırını (ΔE00 ≤ 2) bozuyordu
// (K2: q68 2,134–2,295 ✗, q80 1,857–1,974 ✓); E teslimi q80 ile yapıldı. "oto" `--poster-q p6=oto` ile hâlâ seçilebilir.
const POSTER_Q_TABAN = { p3: 68, p6: 80, p7: 80 };
const POSTER_Q = { ...POSTER_Q_TABAN, ...Object.fromEntries(arg("--poster-q", "").split(",").filter(Boolean).map((s) => s.split("="))) };
const posterQ = (ad, boyut) => {
  const v = POSTER_Q[`${ad}.${boyut}`] ?? POSTER_Q[ad] ?? 80;
  return v === "oto" ? "oto" : Number(v);
};
const MERDIVEN = [80, 78, 76, 74, 72, 70, 68];
const MERDIVEN_PAY = 1.0;
const POSTER_HEDEF_DIKEY = 60_000;

// ---------- bölge (§11.2-6) ----------
// Kare aralığına CRF farkı (t23 → l3 dikişi): `--bolge t23.h264=74-83:-4`. x264/x265 `zones` CRF kipinde `b=` (bit
// hızı çarpanı; qscale'i böler) ile uygulanır: ΔCRF −4 ≈ b = 2^(4/6). AV1'de yok. Taban: t23.h264 (C turundan beri).
// `--bolge t23.h264=yok` kaldırır.
const BOLGE = { "t23.h264": { k0: 74, k1: 83, d: -4 } };
for (const s of arg("--bolge", "").split(",").filter(Boolean)) {
  const [k, v] = s.split("=");
  if (v === "yok" || v === "0") {
    delete BOLGE[k];
    continue;
  }
  const [aralik, d] = v.split(":");
  const [k0, k1] = aralik.split("-").map(Number);
  BOLGE[k] = { k0, k1, d: Number(d) };
}
const bolgeSec = (ad, kodek) => BOLGE[`${ad}.${kodek}`] ?? null;
const bolgeDize = (b) => `${b.k0},${b.k1},b=${Math.pow(2, -b.d / 6).toFixed(4)}`;
const RENK_ETIKET = ["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv"];

// ---------- yardımcılar ----------
function probe(yol, alan = "stream=width,height,pix_fmt") {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", alan, "-of", "json", yol], { encoding: "utf8" });
  return JSON.parse(r.stdout).streams[0];
}

/** Giriş: ffmpeg argümanları + filtre zinciri başı (tek etiket `[g]`) + kare sayısı + son kare yolu. null: kaynak yok. */
const girdiOnbellek = new Map();
function girdi(klip) {
  if (girdiOnbellek.has(klip)) return girdiOnbellek.get(klip);
  const parcalar = kareParcalari(KAYNAK, klip, ESLE, FRAGMAN);
  if (klip === "t34" && parcalar.length === 1) t34Bayat(parcalar[0]);
  let g = null;
  if (parcalar.length) {
    const boy = parcalar.map((p) => probe(p.ilk));
    const W = boy[0].width;
    const args = parcalar.flatMap((p) => ["-framerate", String(FPS), "-start_number", String(p.bas), "-i", join(p.dizin, "k_%04d.png")]);
    // Parçalar farklı boyuttaysa ilkine ölçeklenir (uyarı); 16 bit giriş rgb48'de birleşir.
    const on = parcalar.map((p, i) => `[${i}:v]${boy[i].width !== W ? `scale=${W}:${W}:flags=lanczos,` : ""}setsar=1[p${i}]`);
    if (boy.some((b) => b.width !== W)) console.warn(`UYARI ${klip}: parça boyutları farklı (${boy.map((b) => b.width).join(", ")}), ${W}'ye ölçeklendi`);
    const bas = parcalar.length > 1 ? `${on.join(";")};${parcalar.map((_, i) => `[p${i}]`).join("")}concat=n=${parcalar.length}:v=1:a=0[g]` : `${on[0].replace("[p0]", "[g]")}`;
    const son = parcalar.at(-1);
    g = {
      args,
      bas,
      kare: parcalar.reduce((s, p) => s + p.kare, 0),
      ilkPng: parcalar[0].ilk,
      sonPng: join(son.dizin, `k_${String(son.bas + son.kare - 1).padStart(4, "0")}.png`),
      giris: `${W}² ${boy[0].pix_fmt}${parcalar.length > 1 ? ` (${parcalar.map((p) => `${basename(p.dizin)} ${p.bas}+${p.kare}`).join(" ‖ ")})` : ""}`,
    };
  } else {
    const mkv = join(KAYNAK, `${klip}.mkv`);
    if (existsSync(mkv)) {
      const s = probe(mkv, "stream=width,height,pix_fmt,nb_read_frames");
      g = { args: ["-i", mkv], bas: "[0:v]setsar=1[g]", kare: sureKare(mkv).kare, ilkPng: null, sonPng: null, giris: `${s.width}×${s.height} mkv` };
    }
  }
  girdiOnbellek.set(klip, g);
  return g;
}

/**
 * `<kaynak>/t34/` t34-birlestir.py'nin sabit bağları: t34a ya da t34b yeniden render edildiyse (dosya yeniden
 * yazıldı / klasör taşındı) bağlar ESKİ karelere bakar ve kodlama sessizce eski t34'ü üretir. Her kare kaynağıyla
 * aynı dosya mı (NTFS dosya dizini, `ino`)? Değilse dur.
 */
function t34Bayat(t) {
  if (ESLE.t34) return;
  const fb = existsSync(join(FRAGMAN, "t34b.json")) ? JSON.parse(readFileSync(join(FRAGMAN, "t34b.json"), "utf8")) : {};
  const a = dizi(ESLE.t34a ?? join(KAYNAK, "t34a"));
  const b = dizi(ESLE.t34b ?? join(KAYNAK, "t34b"), fb.kare_baslangic ?? 0);
  if (!a || !b) return;
  const yol = (d, n) => join(d, `k_${String(n).padStart(4, "0")}.png`);
  const ino = (y) => (existsSync(y) ? statSync(y, { bigint: true }).ino : -1n);
  const ciftler = [
    ...Array.from({ length: a.kare }, (_, i) => [yol(t.dizin, t.bas + i), yol(a.dizin, a.bas + i)]),
    ...Array.from({ length: b.kare }, (_, i) => [yol(t.dizin, t.bas + a.kare + i), yol(b.dizin, b.bas + i)]),
  ];
  const kotu = ciftler.filter(([x, y]) => ino(x) !== ino(y) || ino(x) === -1n);
  if (t.kare !== a.kare + b.kare || kotu.length)
    throw new Error(`${t.dizin} bayat (t34a ${a.kare} + t34b ${b.kare} kare, t34 ${t.kare}; bağsız: ${kotu.map(([x]) => basename(x)).join(", ") || "—"}): önce python -X utf8 -P scripts/icinden/t34-birlestir.py`);
}

function calistir(args, ikili = false) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { encoding: ikili ? "buffer" : "utf8", maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr}\n${args.join(" ")}`);
  return r.stdout;
}

const ozetTam = (yol) => createHash("sha256").update(readFileSync(yol)).digest("hex");
const ozet = (yol) => ozetTam(yol).slice(0, 8);

function kodekArg(kodek, crf, kare, bolge = null) {
  const z = bolge ? `:zones=${bolgeDize(bolge)}` : "";
  if (kodek === "h264")
    return ["-c:v", "libx264", "-preset", PRESET, "-crf", String(crf), "-profile:v", "high", "-level:v", "3.1", "-g", String(kare), "-keyint_min", String(kare), "-sc_threshold", "0", "-x264-params", `open-gop=0${z}`];
  if (kodek === "hevc")
    return ["-c:v", "libx265", "-preset", PRESET, "-crf", String(crf), "-tag:v", "hvc1", "-x265-params", `keyint=${kare}:min-keyint=${kare}:scenecut=0:level-idc=31:colorprim=bt709:transfer=bt709:colormatrix=bt709:log-level=error${z}`];
  if (bolge) console.warn(`UYARI: AV1'de bölge (zones) yok, yok sayıldı`);
  return ["-c:v", "libsvtav1", "-preset", "4", "-crf", String(crf), "-g", String(kare), "-svtav1-params", "scd=0"];
}

function sureKare(yol) {
  const r = spawnSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames,codec_tag_string,profile,level,width,height,color_primaries,color_space", "-of", "json", yol], { encoding: "utf8" });
  const s = JSON.parse(r.stdout).streams[0];
  return { kare: Number(s.nb_read_frames), etiket: `${s.codec_tag_string} ${s.profile} L${s.level} ${s.width}x${s.height} ${s.color_space ?? "?"}` };
}

const OZETLI = /^([a-z]\d{1,2})\.([0-9a-f]{8})\.((?:h264|hevc|av1)\.mp4|webp)$/;
/** `<dz>` içinde `<ad>.<8 hex>.<uzantı>` biçimli, `tut` dışındaki dosyalar. */
function eskiler(dz, ad, uzanti, tut) {
  if (!existsSync(dz)) return [];
  return readdirSync(dz)
    .filter((f) => {
      const m = OZETLI.exec(f);
      return m && m[1] === ad && m[3] === uzanti && f !== tut;
    })
    .map((f) => join(dz, f));
}

// ---------- ΔE00 (poster merdiveni; kodlama-dogrula.py de00 ile aynı formül, D65, sRGB) ----------
const SRGB_LIN = Float64Array.from({ length: 256 }, (_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
function labDizi(rgb) {
  const n = rgb.length / 3;
  const L = new Float64Array(n);
  const A = new Float64Array(n);
  const B = new Float64Array(n);
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  for (let i = 0; i < n; i++) {
    const r = SRGB_LIN[rgb[3 * i]];
    const g = SRGB_LIN[rgb[3 * i + 1]];
    const b = SRGB_LIN[rgb[3 * i + 2]];
    const fx = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047);
    const fy = f(0.2126729 * r + 0.7151522 * g + 0.072175 * b);
    const fz = f((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883);
    L[i] = 116 * fy - 16;
    A[i] = 500 * (fx - fy);
    B[i] = 200 * (fy - fz);
  }
  return { L, A, B };
}
const RAD = Math.PI / 180;
function de00Ort(x, y) {
  const n = x.L.length;
  let top = 0;
  const p7 = 25 ** 7;
  for (let i = 0; i < n; i++) {
    const L1 = x.L[i], a1 = x.A[i], b1 = x.B[i], L2 = y.L[i], a2 = y.A[i], b2 = y.B[i];
    const Cm = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
    const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + p7)));
    const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
    const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
    const h1p = ((Math.atan2(b1, a1p) / RAD) % 360 + 360) % 360;
    const h2p = ((Math.atan2(b2, a2p) / RAD) % 360 + 360) % 360;
    const dLp = L2 - L1, dCp = C2p - C1p;
    let dh = h2p - h1p;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
    if (C1p * C2p === 0) dh = 0;
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh / 2) * RAD);
    const Lpm = (L1 + L2) / 2, Cpm = (C1p + C2p) / 2;
    const hs = h1p + h2p;
    const hpm = C1p * C2p === 0 ? hs : Math.abs(h1p - h2p) <= 180 ? hs / 2 : hs < 360 ? (hs + 360) / 2 : (hs - 360) / 2;
    const T = 1 - 0.17 * Math.cos((hpm - 30) * RAD) + 0.24 * Math.cos(2 * hpm * RAD) + 0.32 * Math.cos((3 * hpm + 6) * RAD) - 0.2 * Math.cos((4 * hpm - 63) * RAD);
    const Sl = 1 + (0.015 * (Lpm - 50) ** 2) / Math.sqrt(20 + (Lpm - 50) ** 2);
    const Sc = 1 + 0.045 * Cpm, Sh = 1 + 0.015 * Cpm * T;
    const Rt = -2 * Math.sqrt(Cpm ** 7 / (Cpm ** 7 + p7)) * Math.sin(60 * Math.exp(-(((hpm - 275) / 25) ** 2)) * RAD);
    top += Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
  }
  return top / n;
}
/** WebP'yi libwebp ile çöz (sharp; tarayıcı çözücüsüne yakın, "fancy upsampling") → RGB Lab. */
async function webpLab(yol) {
  // Arabellekten: libvips dosyayı açık tutarsa Windows'ta silme EPERM verir.
  const { data } = await sharp(readFileSync(yol)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return labDizi(data);
}

// ---------- liste (kilitli oku-birleştir-yaz) ----------
mkdirSync(dirname(LISTE), { recursive: true });
const listeOku = () => (existsSync(LISTE) ? JSON.parse(readFileSync(LISTE, "utf8")) : []);
const ESKI_LISTE = listeOku(); // koşu başındaki görüntü (p8 ← eski p6 karşılaştırması)
const anahtar = (s) => `${s.klip}|${s.tur}|${s.boyut}|${s.kodek}`;
const siraAnahtar = (s) => {
  const k = KAYNAKLAR.indexOf(s.kaynakKlip);
  return [k < 0 ? 99 : k, s.boyut === "dikey" ? 0 : 1, TUR_SIRA.indexOf(s.tur), KODEK_SIRA.indexOf(s.kodek)];
};
const siraKarsilastir = (x, y) => {
  const a = siraAnahtar(x), b = siraAnahtar(y);
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};
function kilitli(fn) {
  const k = `${LISTE}.kilit`;
  const t0 = Date.now();
  for (;;) {
    try {
      writeFileSync(k, String(process.pid), { flag: "wx" });
      break;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      try {
        if (Date.now() - statSync(k).mtimeMs > 60_000) rmSync(k, { force: true });
      } catch {
        /* kilit bu arada kalktı */
      }
      if (Date.now() - t0 > 180_000) throw new Error(`liste kilidi alınamadı: ${k}`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
    }
  }
  try {
    return fn();
  } finally {
    rmSync(k, { force: true });
  }
}
const yeniKayitlar = new Map();
function yaz() {
  kilitli(() => {
    const l = listeOku().filter((s) => !yeniKayitlar.has(anahtar(s)));
    l.push(...yeniKayitlar.values());
    l.sort(siraKarsilastir);
    const gec = `${LISTE}.${process.pid}.tmp`;
    writeFileSync(gec, JSON.stringify(l, null, 1));
    renameSync(gec, LISTE);
  });
}
const kaydet = (s) => yeniKayitlar.set(anahtar(s), s);

// ---------- artık temizliği (`--artik`) ----------
if (bayrak("--artik")) {
  const kuru = bayrak("--kuru");
  const l = listeOku();
  const tut = new Set(l.map((s) => resolve(s.yol ?? join(CIKTI, "..", s.dosya))));
  let n = 0, bayt = 0;
  for (const alt of ["v/d", "v/y", "p/d", "p/y"]) {
    const dz = join(CIKTI, alt);
    if (!existsSync(dz)) continue;
    for (const f of readdirSync(dz)) {
      const yol = join(dz, f);
      const gecici = /\.tmp\./.test(f);
      if (!(OZETLI.test(f) || gecici) || tut.has(resolve(yol))) continue;
      n++;
      bayt += statSync(yol).size;
      console.log(`${kuru ? "silinecek" : "silindi"}: ${alt}/${f} (${(statSync(yol).size / 1000).toFixed(1)} kB)`);
      if (!kuru) rmSync(yol);
    }
  }
  console.log(`artık: ${n} dosya, ${(bayt / 1e6).toFixed(3)} MB${kuru ? " (kuru koşu, silinmedi)" : ""}; liste ${l.length} kayıt → ${LISTE}`);
  process.exit(0);
}

// ---------- poster ----------
/** Tek kare kaynağı (ffmpeg girişi + filtre başı) ve kaynak karesi. */
function posterGirdi(p, G) {
  if (p.tip === "son-kare") {
    const n = p.kare ?? G.kare - 1;
    if (!G.sonPng || n !== G.kare - 1) {
      // mkv yer tutucu ya da açık kare: diziden seç
      return { args: G.args, bas: `${G.bas.replace(/\[g\]$/, "")}[g0];[g0]select='eq(n\\,${n})'[g]`, kaynakKare: n, png: null };
    }
    return { args: ["-i", G.sonPng], bas: "[0:v]setsar=1[g]", kaynakKare: n, png: G.sonPng };
  }
  return { args: G.args, bas: G.bas, kaynakKare: 0, png: G.ilkPng };
}

async function posterKodla({ ad, p, G, boyut, B, pdz }) {
  const PG = posterGirdi(p, G);
  const kY = boyut === "yatay" ? kirpimYKare(kirpimYOf(p.kaynak), PG.kaynakKare) : undefined;
  // Son-kare posterinde tek kare girdi: kırpım o karenin sabit sayısıyla (kare numarası `n` artık 0).
  const kirp = boyut === "yatay" ? (p.tip === "son-kare" ? BOYUT.yatay.kirp(kY) : B.kirp(kirpimYOf(p.kaynak))) : B.kirp();
  const vf = `${PG.bas};[g]${kirp},scale=${B.g}:${B.y}:flags=lanczos,format=rgb24[o]`;
  const kaynakOzet = PG.png ? ozetTam(PG.png).slice(0, 16) : null;
  const kayit = { kaynakKlip: p.kaynak, klip: ad, tur: "poster", boyut, kodek: "webp", posterTip: p.tip, kaynakKare: PG.kaynakKare, kaynakOzet, kirpimY: kY, kirpim: kirp, giris: G.giris };

  // p8 (plaka): master aynı ve dosya duruyorsa yeniden kodlama yok.
  if (p.tip === "plaka") {
    const once = ESKI_LISTE.find((s) => s.klip === ad && s.tur === "poster" && s.boyut === boyut);
    if (once && kaynakOzet && once.kaynakOzet === kaynakOzet && existsSync(once.yol)) {
      console.log(`${boyut} ${ad}: master değişmedi (${kaynakOzet}), dosya duruyor → yeniden kodlama yok (${basename(once.yol)})`);
      return null;
    }
  }
  const kodla = (q, yol) => calistir([...PG.args, "-filter_complex", vf, "-map", "[o]", "-frames:v", "1", "-c:v", "libwebp", "-quality", String(q), "-compression_level", "6", yol]);
  let q = posterQ(ad, boyut);
  const gecici = join(pdz, `${ad}.tmp.webp`);
  let merdiven;
  if (q === "oto") {
    // Referans: aynı kırpım + ölçek, rgb24 (kodlayıcıya giren görüntü).
    const ref = labDizi(calistir([...PG.args, "-filter_complex", vf, "-map", "[o]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], true));
    merdiven = [];
    let q80 = null;
    for (const mq of MERDIVEN) {
      const y = join(pdz, `${ad}.q${mq}.tmp.webp`);
      kodla(mq, y);
      const lab = await webpLab(y);
      q80 ??= lab;
      merdiven.push({ q: mq, bayt: statSync(y).size, dE00_master: +de00Ort(lab, ref).toFixed(3), dE00_q80: +de00Ort(lab, q80).toFixed(3) });
    }
    const sinir = merdiven[0].dE00_master + MERDIVEN_PAY;
    const sec = merdiven.filter((m) => m.dE00_master <= sinir).sort((a, b) => a.q - b.q)[0];
    q = sec.q;
    for (const m of merdiven) {
      const y = join(pdz, `${ad}.q${m.q}.tmp.webp`);
      if (m.q === q) renameSync(y, gecici);
      else rmSync(y, { force: true });
    }
    console.log(`${boyut} ${ad} merdiven (ΔE00 master'a, sınır q80 + ${MERDIVEN_PAY} = ${sinir.toFixed(3)}): ${merdiven.map((m) => `q${m.q} ${(m.bayt / 1000).toFixed(1)} kB ${m.dE00_master}`).join(" · ")} → q${q}${boyut === "dikey" && sec.bayt > POSTER_HEDEF_DIKEY ? ` (UYARI: hedef ≤ ${POSTER_HEDEF_DIKEY / 1000} kB tutmadı)` : ""}`);
  } else kodla(q, gecici);

  const h = ozet(gecici);
  const son = join(pdz, `${ad}.${h}.webp`);
  if (existsSync(son)) rmSync(son);
  renameSync(gecici, son);
  Object.assign(kayit, { dosya: `/icinden/p/${B.kisa}/${ad}.${h}.webp`, bayt: statSync(son).size, kalite: q, ...(merdiven ? { merdiven } : {}), yol: son });
  if (p.eski) {
    // p8 ≡ eski p6 plakası mı (aynı master → libwebp belirlenimci → aynı özet)?
    const e = ESKI_LISTE.find((s) => s.klip === p.eski && s.tur === "poster" && s.boyut === boyut && (s.posterTip ?? "plaka") === "plaka" && s.kaynakKlip === p.eski);
    const eh = e ? /\.([0-9a-f]{8})\.webp$/.exec(e.dosya)?.[1] : null;
    kayit.esdeger = eh === h ? `${p.eski}.${eh}` : null;
    if (eh && eh !== h) console.warn(`UYARI ${boyut} ${ad}: eski ${p.eski} plakası ${eh}, yeni ${h} — master değişmiş (§12.7-4: p8 + kapak-ton + RECT + FLIP yeniden)`);
    else if (eh) console.log(`${boyut} ${ad} ≡ eski ${p.eski} (${eh}; bayt bayt aynı)`);
  }
  console.log(`${boyut} ${ad} poster (${p.tip} ← ${p.kaynak}[${PG.kaynakKare}]): q${q} ${(kayit.bayt / 1000).toFixed(1)} kB → ${basename(son)}`);
  return kayit;
}

/** render-son/p8 yoksa: eski p6 plaka dosyası p8 adıyla kopyalanır (yeniden kodlama yok). */
function plakaKopyala({ ad, p, boyut, B, pdz }) {
  const e = ESKI_LISTE.find((s) => s.klip === p.eski && s.tur === "poster" && s.boyut === boyut && s.kaynakKlip === p.eski && (s.posterTip ?? "plaka") === "plaka" && s.yol && existsSync(s.yol));
  if (!e) return null;
  const h = /\.([0-9a-f]{8})\.webp$/.exec(e.dosya)[1];
  const son = join(pdz, `${ad}.${h}.webp`);
  copyFileSync(e.yol, son);
  console.log(`${boyut} ${ad} ← eski ${p.eski} dosyası (${basename(e.yol)} kopyası; yeniden kodlama yok)`);
  return { ...e, kaynakKlip: ad, klip: ad, posterTip: "plaka", esdeger: `${p.eski}.${h}`, dosya: `/icinden/p/${B.kisa}/${ad}.${h}.webp`, bayt: statSync(son).size, yol: son };
}

// ---------- ana döngü ----------
const t00 = Date.now();
const silinecek = [];
const tutulan = [];
let sayac = 0;
if (SECIM.length) console.log(`seçim: ${SECIM.map((x) => [x.ad, x.kodek, x.boyut].filter(Boolean).join(".")).join(", ")}`);
for (const [ad, p] of Object.entries(POSTER))
  if (p.tip === "son-kare" && SECIM.some((x) => x.ad === p.kaynak) && !adSecildi(ad))
    console.warn(`UYARI: ${ad} ${p.kaynak}'nın son karesinden; ${p.kaynak} seçildi ama ${ad} seçilmedi — master değiştiyse ${ad} eski kalır`);

for (const kaynak of KAYNAKLAR) {
  const cik = ciktilar(kaynak).filter((c) => adSecildi(c.ad));
  if (!cik.length) continue;
  const G = girdi(kaynak);
  if (!G) {
    const p8 = cik.every((c) => c.tur === "poster" && POSTER[c.ad].tip === "plaka" && POSTER[c.ad].eski);
    if (!p8) {
      const m = `kaynak yok: ${kaynak} (${join(KAYNAK, kaynak)}\\k_0000.png ya da ${join(KAYNAK, kaynak)}.mkv) — ${cik.map((c) => c.ad).join(", ")} atlandı`;
      if (SECIM.length) throw new Error(m);
      console.warn(`UYARI ${m}`);
      continue;
    }
  }
  if (G) {
    const fr = fragmanOku(FRAGMAN, kaynak, (m) => console.warn(`UYARI ${m}`));
    if (fr && fr.kare !== G.kare) console.warn(`UYARI ${kaynak}: fragman ${fr.kare} kare, kaynak ${G.kare} kare`);
    console.log(`${kaynak}: ${G.kare} kare, giriş ${G.giris} → ${cik.map((c) => c.ad).join(", ")}`);
  }
  for (const [boyut, B] of Object.entries(BOYUT)) {
    const dz = join(CIKTI, boyut === "dikey" ? "v/d" : "v/y");
    const pdz = join(CIKTI, boyut === "dikey" ? "p/d" : "p/y");
    mkdirSync(dz, { recursive: true });
    mkdirSync(pdz, { recursive: true });
    for (const c of cik) {
      if (c.tur === "poster") {
        if (!secildi(c.ad, boyut, "webp")) continue;
        const p = POSTER[c.ad];
        const k = G ? await posterKodla({ ad: c.ad, p, G, boyut, B, pdz }) : plakaKopyala({ ad: c.ad, p, boyut, B, pdz });
        if (!G && !k) throw new Error(`${c.ad}: ne ${join(KAYNAK, p.kaynak)} ne de eski ${p.eski} plaka dosyası var`);
        if (k) {
          kaydet(k);
          sayac++;
          const es = eskiler(pdz, c.ad, "webp", basename(k.yol));
          (TEMIZLE ? silinecek : tutulan).push(...es);
        }
        continue;
      }
      const kirp = B.kirp(kirpimYOf(kaynak));
      const kirpimY = boyut === "yatay" ? kirpimYOf(kaynak) : undefined;
      for (const kodek of B.kodekler) {
        if (!secildi(c.ad, boyut, kodek)) continue;
        const t0 = Date.now();
        const gecici = join(dz, `${c.ad}.tmp.${kodek}.mp4`);
        const vf = `${G.bas};[g]${kirp},scale=${B.g}:${B.y}:flags=lanczos:${RENK},format=yuv420p${c.tur === "geri" ? ",reverse" : ""}[o]`;
        const crf = crfSec(kodek, c.tur, c.ad);
        const bolge = kodek === "av1" ? null : bolgeSec(c.ad, kodek);
        calistir([...G.args, "-filter_complex", vf, "-map", "[o]", "-r", String(FPS), ...kodekArg(kodek, crf, G.kare, bolge), ...RENK_ETIKET, "-an", "-movflags", "+faststart", gecici]);
        const h = ozet(gecici);
        const son = join(dz, `${c.ad}.${h}.${kodek}.mp4`);
        if (existsSync(son)) rmSync(son);
        renameSync(gecici, son);
        (TEMIZLE ? silinecek : tutulan).push(...eskiler(dz, c.ad, `${kodek}.mp4`, basename(son)));
        const p = sureKare(son);
        if (p.kare !== G.kare) console.warn(`UYARI ${c.ad} ${kodek}: kodlanmış ${p.kare} kare, kaynak ${G.kare}`);
        kaydet({ kaynakKlip: kaynak, klip: c.ad, tur: c.tur, boyut, kodek, dosya: `/icinden/v/${B.kisa}/${c.ad}.${h}.${kodek}.mp4`, bayt: statSync(son).size, kare: p.kare, sure: +(p.kare / FPS).toFixed(4), crf, ...(bolge ? { bolge: bolgeDize(bolge) } : {}), kirpimY, kirpim: kirp, etiket: p.etiket, ms: Date.now() - t0, yol: son, giris: G.giris });
        sayac++;
        console.log(`${boyut} ${c.ad} ${kodek}: ${(statSync(son).size / 1000).toFixed(1)} kB, ${p.kare} kare, crf ${crf}${bolge ? ` zones ${bolgeDize(bolge)}` : ""}, ${p.etiket}, ${Date.now() - t0} ms → ${basename(son)}`);
      }
    }
  }
  yaz();
}
yaz();
for (const y of silinecek) {
  rmSync(y, { force: true });
  console.log(`silindi (--temizle): ${y}`);
}
const tutulanSet = [...new Set(tutulan)];
if (tutulanSet.length) console.log(`eski özetli dosyalar TUTULDU (${tutulanSet.length}; silmek için --temizle ya da --artik): ${tutulanSet.map((y) => basename(y)).join(", ")}`);
console.log(`bitti: ${sayac} dosya kodlandı/güncellendi, ${((Date.now() - t00) / 1000).toFixed(0)} s → ${LISTE}`);
