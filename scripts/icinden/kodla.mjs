// /icinden v3 — master klipleri teslim kodlamasına çevirir (docs/brief-icinden-3.md §9.4).
//
//   node scripts/icinden/kodla.mjs --kaynak <render dizini> [--cikti public/icinden] [--liste <kodlama.json>]
//        [--fragman <dizin>] [--klip t01,l1] [--preset slow] [--esle t34b=<klasör>,l4=<klasör>]
//        [--crf t23.h264=26,t34.av1=32]   (CRF ayarı; ayrıntı CRF_AYAR'da)
//        [--poster-q p3=72]               (poster WebP kalitesi; varsayılan 80)
//        [--bolge t23.h264=74-83:-4]      (x264/x265 zones: kare aralığına CRF farkı; ayrıntı BOLGE'de)
//
// Kaynak: her klip için `<kaynak>/<klip>/k_%04d.png` (Blender çıktısı). Giriş boyutu serbest: 1920² PNG 16 bit
// (son render) ya da 960² PNG 8 bit (EEVEE önizleme); kırpım master'a göre oransal (dikey x %21,875, yatay y
// KIRPIM_Y / 1920 — klip başına, §11.2-5), ölçek lanczos. 16 bit → 8 bit dönüşüm kodlayıcıdan önce, BT.709 matris
// (renk etiketi de 709). Yer tutucu: `<kaynak>/<klip>.mkv`. `--esle` ile tek tek klasör verilebilir.
//
// t34 (§9.1): `<kaynak>/t34/` yoksa `t34a/` (S1, 0–47) + `t34b/` (S2, 48–71 ya da 0'dan) art arda birleşir
// (ffmpeg concat); fragman da birleşir (fragman.mjs). Klip adları: t01 t12 t23 t34 t45 t56 (ileri), l1…l5
// (döngü), p6 (banko plakası, tek kare).
//
// Çıktı: `<cikti>/v/{d,y}/<klip>.<8 hex>.<kodek>.mp4`, posterler `<cikti>/p/{d,y}/<poster>.<8 hex>.webp`; geri
// klipler ileri klibin tersi (t12 → r21; reverse kırpım+ölçekten SONRA). Aynı klibin eski özetli dosyaları silinir.
// Liste (manifest-birlestir.mjs girdisi), varsayılan `D:/soft/cop31-varlik/kodlama/<kaynak klasör adı>.json`:
// [{kaynakKlip, klip, tur, boyut, kodek, dosya, bayt, kare, sure, crf, bolge, kalite, kirpimY, kirpim, etiket, ms,
// yol, giris}]. `kirpimY` kaynak klibin (ileri kare numarasıyla) yatay y ofsetidir; `kirpim` kullanılan ffmpeg crop
// filtresi (kodlama-dogrula.py VMAF referansını aynı kırpımla kurar).
//
// H.264 High@3.1 CRF 23/26, HEVC x265 hvc1 CRF 25/28 (yalnız dikey), AV1 SVT-AV1 p4 CRF 30/34; döngüler ileri
// CRF'le; GOP = klip uzunluğu, sahne kesmesi kapalı, +faststart, ses yok. Poster WebP q80 (döngünün 0. karesi).
// D turu teslim ayarı (§11.2-2, -6; §11.6-1, -2): `--crf t23.h264=26,t23.hevc=27,t23.av1=32,t34.h264=26,t34.hevc=27,
// t34.av1=34,l3.av1=32 --bolge t23.h264=74-83:-4 --poster-q p3=68` (öteki posterler q80; tek komut docs/klipler-sema.md
// §4). Süreç önceliği düşük.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { setPriority, constants } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fragmanOku, kareParcalari } from "./fragman.mjs";

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const KAYNAK = resolve(arg("--kaynak", "D:/soft/cop31-varlik/render-son"));
const FRAGMAN = resolve(arg("--fragman", KAYNAK));
const CIKTI = resolve(arg("--cikti", "public/icinden"));
const LISTE = resolve(arg("--liste", `D:/soft/cop31-varlik/kodlama/${basename(KAYNAK)}.json`));
const PRESET = arg("--preset", "slow");
const SECILI = arg("--klip", "");
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

const KLIPLER = ["t01", "l1", "t12", "l2", "t23", "l3", "t34", "l4", "t45", "l5", "t56", "p6"].filter(
  (k) => !SECILI || SECILI.split(",").includes(k),
);
// Oransal kırpım (master 1920: dikey 1080×1920 @ x 420, yatay 1920×1080 @ y KIRPIM_Y) → teslim boyutu, BT.709.
const RENK = "out_color_matrix=bt709:out_range=tv";
/**
 * Yatay kırpımın y ofseti, master px (§11.2-5: d3'te ufuk — Beydağları, körfez — kadraja girsin). Sayı ya da
 * {bas, son, k0, k1}: kare ≤ k0 → bas, ≥ k1 → son, arası easeInOutCubic. t34'te {200 → 420, 47 → 48} basamaktır:
 * geçiş düz parlama karelerinde (#FFF1DC) olur, 47↔48 farkı 0 kalır. Listede olmayan klip 420 (t01/l1/t12/l2 ve
 * S2 klipleri değişmez; lombar hizası bozulmaz). Geri klipler `reverse` kırpımdan SONRA olduğundan kendiliğinden doğru.
 */
const KIRPIM_Y = {
  t23: { bas: 420, son: 200, k0: 24, k1: 72 },
  l3: 200,
  t34: { bas: 200, son: 420, k0: 47, k1: 48 },
};
const KIRPIM_Y_VARSAYILAN = 420;
const kirpimYOf = (klip) => KIRPIM_Y[klip] ?? KIRPIM_Y_VARSAYILAN;
/** ffmpeg crop `y` ifadesi (kare numarası `n`; crop sonucu lrint ile tam sayıya yuvarlar, ölçekten önce). */
function kirpimYIfade(k) {
  if (typeof k === "number") return `ih*${k}/1920`;
  const t = `clip((n-${k.k0})/${k.k1 - k.k0},0,1)`;
  return `ih*(${k.bas}+(${k.son}-${k.bas})*if(lt(${t},0.5),4*pow(${t},3),1-pow(2-2*${t},3)/2))/1920`;
}
const BOYUT = {
  dikey: { kisa: "d", kirp: () => "crop=w=iw*1080/1920:h=ih:x=iw*420/1920:y=0", g: 720, y: 1280, kodekler: ["h264", "hevc", "av1"] },
  yatay: { kisa: "y", kirp: (klip) => `crop=w=iw:h=ih*1080/1920:x=0:y='${kirpimYIfade(kirpimYOf(klip))}'`, g: 1280, y: 720, kodekler: ["h264", "av1"] },
};
const CRF = { h264: [23, 26], hevc: [25, 28], av1: [30, 34] };
// Bütçe ayarı (§9.4 "aşarsa önce döngü CRF, sonra geri klip CRF"): `--crf dongu=+2,geri=+2,t01.h264=21`.
// Seçici: tür (ileri|geri|dongu) ya da dosya adı (t01, r32, l3), isteğe bağlı `.kodek`; değer `+N`/`-N` (taban
// CRF'e ek) ya da `N` (mutlak). Sıra: taban → tür → tür.kodek → ad → ad.kodek (sonraki öncekini ezer).
const CRF_AYAR = Object.fromEntries(
  arg("--crf", "")
    .split(",")
    .filter(Boolean)
    .map((s) => s.split("=")),
);
function crfSec(kodek, tur, ad, taban) {
  let c = taban;
  for (const k of [tur, `${tur}.${kodek}`, ad, `${ad}.${kodek}`]) {
    const v = CRF_AYAR[k];
    if (v !== undefined) c = /^[+-]/.test(v) ? taban + Number(v) : Number(v);
  }
  return c;
}
// Poster kalitesi (§11.2-4): `--poster-q p3=72,p3.yatay=70`; seçici poster adı, isteğe bağlı `.boyut`.
const POSTER_Q = Object.fromEntries(
  arg("--poster-q", "")
    .split(",")
    .filter(Boolean)
    .map((s) => s.split("=")),
);
const posterQ = (ad, boyut) => Number(POSTER_Q[`${ad}.${boyut}`] ?? POSTER_Q[ad] ?? 80);
// Kare aralığına CRF farkı (§11.2-6, t23 → l3 dikişi): `--bolge t23.h264=74-83:-4,t23.hevc=74-83:-4`. x264/x265
// `zones` CRF kipinde `b=` (bit hızı çarpanı; qscale'i böler) ile uygulanır: ΔCRF −4 ≈ b = 2^(4/6). AV1'de yok.
const BOLGE = Object.fromEntries(
  arg("--bolge", "")
    .split(",")
    .filter(Boolean)
    .map((s) => {
      const [k, v] = s.split("=");
      const [aralik, d] = v.split(":");
      const [k0, k1] = aralik.split("-").map(Number);
      return [k, { k0, k1, d: Number(d) }];
    }),
);
const bolgeSec = (ad, kodek) => BOLGE[`${ad}.${kodek}`] ?? null;
const bolgeDize = (b) => `${b.k0},${b.k1},b=${Math.pow(2, -b.d / 6).toFixed(4)}`;
const RENK_ETIKET = ["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv"];

function probe(yol, alan = "stream=width,height,pix_fmt") {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", alan, "-of", "json", yol], { encoding: "utf8" });
  return JSON.parse(r.stdout).streams[0];
}

/** Giriş: ffmpeg argümanları + filtre zinciri başı (tek etiket `[g]`) + kare sayısı + özet. */
const girdiOnbellek = new Map();
function girdi(klip) {
  if (girdiOnbellek.has(klip)) return girdiOnbellek.get(klip);
  const parcalar = kareParcalari(KAYNAK, klip, ESLE, FRAGMAN);
  let g;
  if (parcalar.length) {
    const boy = parcalar.map((p) => probe(p.ilk));
    const W = boy[0].width;
    const args = parcalar.flatMap((p) => ["-framerate", String(FPS), "-start_number", String(p.bas), "-i", join(p.dizin, "k_%04d.png")]);
    // Parçalar farklı boyuttaysa ilkine ölçeklenir (uyarı); 16 bit giriş rgb48'de birleşir.
    const on = parcalar.map((p, i) => `[${i}:v]${boy[i].width !== W ? `scale=${W}:${W}:flags=lanczos,` : ""}setsar=1[p${i}]`);
    if (boy.some((b) => b.width !== W)) console.warn(`UYARI ${klip}: parça boyutları farklı (${boy.map((b) => b.width).join(", ")}), ${W}'ye ölçeklendi`);
    const bas = parcalar.length > 1 ? `${on.join(";")};${parcalar.map((_, i) => `[p${i}]`).join("")}concat=n=${parcalar.length}:v=1:a=0[g]` : `${on[0].replace("[p0]", "[g]")}`;
    g = {
      args,
      bas,
      kare: parcalar.reduce((s, p) => s + p.kare, 0),
      giris: `${W}² ${boy[0].pix_fmt}${parcalar.length > 1 ? ` (${parcalar.map((p) => `${basename(p.dizin)} ${p.bas}+${p.kare}`).join(" ‖ ")})` : ""}`,
    };
  } else {
    const mkv = join(KAYNAK, `${klip}.mkv`);
    if (!existsSync(mkv)) throw new Error(`kaynak yok: ${klip} (${join(KAYNAK, klip)}\\k_0000.png ya da ${mkv})`);
    const s = probe(mkv, "stream=width,height,pix_fmt,nb_read_frames");
    g = { args: ["-i", mkv], bas: "[0:v]setsar=1[g]", kare: sureKare(mkv).kare, giris: `${s.width}×${s.height} mkv` };
  }
  girdiOnbellek.set(klip, g);
  return g;
}

function calistir(args) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr}\n${args.join(" ")}`);
}

function ozet(yol) {
  return createHash("sha256").update(readFileSync(yol)).digest("hex").slice(0, 8);
}

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

/** `<dz>` içinde `<ad>.<8 hex>.<uzantı>` biçimli, `tut` dışındaki eski dosyaları siler. */
function eskileriSil(dz, ad, uzanti, tut) {
  if (!existsSync(dz)) return;
  const re = new RegExp(`^${ad}\\.[0-9a-f]{8}\\.${uzanti.replace(".", "\\.")}$`);
  for (const f of readdirSync(dz)) if (re.test(f) && f !== tut) rmSync(join(dz, f));
}

mkdirSync(dirname(LISTE), { recursive: true });
const liste = existsSync(LISTE) ? JSON.parse(readFileSync(LISTE, "utf8")).filter((x) => !KLIPLER.includes(x.kaynakKlip)) : [];
const yaz = () => writeFileSync(LISTE, JSON.stringify(liste, null, 1));
const t00 = Date.now();

for (const klip of KLIPLER) {
  const tur = klip.startsWith("t") ? "ileri" : klip.startsWith("l") ? "dongu" : "plaka";
  const G = girdi(klip);
  const fr = fragmanOku(FRAGMAN, klip, (m) => console.warn(`UYARI ${m}`));
  if (fr && fr.kare !== G.kare) console.warn(`UYARI ${klip}: fragman ${fr.kare} kare, kaynak ${G.kare} kare`);
  console.log(`${klip}: ${G.kare} kare, giriş ${G.giris}`);
  for (const [boyut, B] of Object.entries(BOYUT)) {
    const dz = join(CIKTI, boyut === "dikey" ? "v/d" : "v/y");
    const pdz = join(CIKTI, boyut === "dikey" ? "p/d" : "p/y");
    mkdirSync(dz, { recursive: true });
    mkdirSync(pdz, { recursive: true });
    const kirp = B.kirp(klip);
    const kirpimY = boyut === "yatay" ? kirpimYOf(klip) : undefined;
    // Poster (döngünün 0. karesi ya da plaka): WebP q80 (ya da --poster-q), RGB.
    if (tur !== "ileri") {
      const ad = tur === "dongu" ? `p${klip.slice(1)}` : klip;
      const q = posterQ(ad, boyut);
      const gecici = join(pdz, `${ad}.tmp.webp`);
      calistir([...G.args, "-filter_complex", `${G.bas};[g]${kirp},scale=${B.g}:${B.y}:flags=lanczos,format=rgb24[o]`, "-map", "[o]", "-frames:v", "1", "-c:v", "libwebp", "-quality", String(q), "-compression_level", "6", gecici]);
      const h = ozet(gecici);
      const son = join(pdz, `${ad}.${h}.webp`);
      renameSync(gecici, son);
      eskileriSil(pdz, ad, "webp", basename(son));
      liste.push({ kaynakKlip: klip, klip: ad, tur: "poster", boyut, kodek: "webp", dosya: `/icinden/p/${B.kisa}/${ad}.${h}.webp`, bayt: statSync(son).size, kalite: q, kirpimY, kirpim: kirp, yol: son, giris: G.giris });
    }
    if (tur === "plaka") continue;
    const yonler = tur === "ileri" ? [["ileri", klip, 0], ["geri", `r${klip[2]}${klip[1]}`, 1]] : [["dongu", klip, 0]];
    for (const [yTur, ad, crfI] of yonler) {
      for (const kodek of B.kodekler) {
        const t0 = Date.now();
        const gecici = join(dz, `${ad}.tmp.${kodek}.mp4`);
        const vf = `${G.bas};[g]${kirp},scale=${B.g}:${B.y}:flags=lanczos:${RENK},format=yuv420p${yTur === "geri" ? ",reverse" : ""}[o]`;
        const crf = crfSec(kodek, yTur, ad, CRF[kodek][crfI]);
        const bolge = kodek === "av1" ? null : bolgeSec(ad, kodek);
        calistir([...G.args, "-filter_complex", vf, "-map", "[o]", "-r", String(FPS), ...kodekArg(kodek, crf, G.kare, bolge), ...RENK_ETIKET, "-an", "-movflags", "+faststart", gecici]);
        const h = ozet(gecici);
        const son = join(dz, `${ad}.${h}.${kodek}.mp4`);
        if (existsSync(son)) rmSync(son);
        renameSync(gecici, son);
        eskileriSil(dz, ad, `${kodek}.mp4`, basename(son));
        const p = sureKare(son);
        if (p.kare !== G.kare) console.warn(`UYARI ${ad} ${kodek}: kodlanmış ${p.kare} kare, kaynak ${G.kare}`);
        liste.push({ kaynakKlip: klip, klip: ad, tur: yTur, boyut, kodek, dosya: `/icinden/v/${B.kisa}/${ad}.${h}.${kodek}.mp4`, bayt: statSync(son).size, kare: p.kare, sure: +(p.kare / FPS).toFixed(4), crf, ...(bolge ? { bolge: bolgeDize(bolge) } : {}), kirpimY, kirpim: kirp, etiket: p.etiket, ms: Date.now() - t0, yol: son, giris: G.giris });
        console.log(`${boyut} ${ad} ${kodek}: ${(statSync(son).size / 1024).toFixed(0)} KB, ${p.kare} kare, crf ${crf}${bolge ? ` zones ${bolgeDize(bolge)}` : ""}, ${p.etiket}, ${Date.now() - t0} ms`);
      }
    }
  }
  yaz();
}
yaz();
console.log(`bitti: ${liste.length} dosya, ${((Date.now() - t00) / 1000).toFixed(0)} s → ${LISTE}`);
