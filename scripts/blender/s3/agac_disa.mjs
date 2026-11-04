// S3 fidan geometrisi: /fidan `tree.ts`'i Node ile DOĞRUDAN içe aktarır (mulberry32'nin Python portu yok; sapma riski 0)
// ve Blender S3 sahnesinin okuyacağı agac.json'u üretir. Jüri aşısı (G-A, brief-icinden-3 §14.2): assert 81 kök şeridi,
// 81 uç, 23 dal şeridi, 274 yaprak, 2 boğum; kökçük uçları en yakın komşu ≥ UC_ARALIK birime gevşetilir (kayma ≤ UC_KAYMA).
//
//   node scripts/blender/s3/agac_disa.mjs [çıktı.json]      (Node ≥ 23.6: .ts tip ayıklama varsayılan; 22'de
//                                                             --experimental-strip-types)
// Varsayılan çıktı: D:/soft/cop31-varlik/s3/agac.json (sahne.py yoksa kendisi çağırır).
//
// Birim: ağaç birimi (tree.ts; gövde x≈200, toprak y=470, aşağı +y). 3B'ye çevirme sahne.py'de (1 birim = 1,1 mm).
import { pathToFileURL } from "node:url";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const KOK = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../../..");
const AGAC_TS = resolve(KOK, "src/components/fidan/tree.ts");
const CIKIS = process.argv[2] ?? "D:/soft/cop31-varlik/s3/agac.json";
const UC_ARALIK = 9.0;   // en yakın komşu hedefi (birim); jüri J2/J3 ve Öneri 3 §2.2
const UC_KAYMA = 4.5;    // bir ucun en çok kayması (birim); siluet farkı fark edilmesin

const { TREE, KNOTS, GROUND_Y } = await import(pathToFileURL(AGAC_TS).href);

function assert(kosul, mesaj) {
  if (!kosul) {
    console.error(`[ASSERT] ${mesaj}`);
    process.exit(2);
  }
}

// ------------------------------------------------------------------ SVG yolu → kübik zincir
function zincir(d) {
  const say = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  assert(d.startsWith("M") && (say.length - 2) % 6 === 0, `beklenmeyen yol: ${d.slice(0, 40)}`);
  const segs = [];
  let p0 = [say[0], say[1]];
  for (let i = 2; i < say.length; i += 6) {
    const c = [p0, [say[i], say[i + 1]], [say[i + 2], say[i + 3]], [say[i + 4], say[i + 5]]];
    segs.push(c);
    p0 = c[3];
  }
  return segs;
}

function bez(c, t) {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
  return [a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0], a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1]];
}

function zincirNokta(segs, u) {   // u ∈ [0, segs.length]
  const n = Math.min(segs.length - 1, Math.floor(u));
  return bez(segs[n], Math.min(1, u - n));
}

// Katmanın kapladığı kesir (taper: katman k yolun ilk frac_k'sını kaplar): katman yolunun son noktasına en yakın u.
function katmanKesri(segs, katmanD) {
  const ks = zincir(katmanD);
  const son = ks[ks.length - 1][3];
  let enIyi = 1, enAz = Infinity;
  const N = segs.length * 400;
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * segs.length;
    const p = zincirNokta(segs, u);
    const dd = Math.hypot(p[0] - son[0], p[1] - son[1]);
    if (dd < enAz) { enAz = dd; enIyi = u / segs.length; }
  }
  return enIyi;
}

// Genişlik profili: (kesir, w) noktaları; q ≤ en küçük kesir → taban; aralarda doğrusal.
function profil(segs, layers) {
  const pr = layers.map((L) => [layers.length === 1 ? 1 : katmanKesri(segs, L.d), L.w]).sort((a, b) => a[0] - b[0]);
  return (q) => {
    if (q <= pr[0][0]) return pr[0][1];
    for (let i = 1; i < pr.length; i++) {
      if (q <= pr[i][0]) {
        const t = (q - pr[i - 1][0]) / Math.max(1e-9, pr[i][0] - pr[i - 1][0]);
        return pr[i - 1][1] + (pr[i][1] - pr[i - 1][1]) * t;
      }
    }
    return pr[pr.length - 1][1];
  };
}

const r2 = (v) => Math.round(v * 100) / 100;

// Yoğun örnek: zincir parametresinde düzgün (q = u / n), her noktada [x, y, genişlik].
function ornekle(segs, layers, n) {
  const w = profil(segs, layers);
  const out = [];
  for (let i = 0; i < n; i++) {
    const q = i / (n - 1);
    const p = zincirNokta(segs, q * segs.length);
    out.push([r2(p[0]), r2(p[1]), r2(w(q))]);
  }
  return out;
}

// ------------------------------------------------------------------ şeritler
const kokSerit = TREE.strands.filter((s) => s.stage === "roots");
const govdeSerit = TREE.strands.filter((s) => s.stage === "trunk");
const dalSerit = TREE.strands.filter((s) => s.stage === "branches");
assert(kokSerit.length === 81, `kök şeridi ${kokSerit.length} ≠ 81`);
assert(TREE.dots.length === 81, `kök ucu ${TREE.dots.length} ≠ 81`);
assert(govdeSerit.length === 1, `gövde ${govdeSerit.length} ≠ 1`);
assert(dalSerit.length === 23, `dal şeridi ${dalSerit.length} ≠ 23`);
assert(TREE.leaves.length === 274, `yaprak ${TREE.leaves.length} ≠ 274`);
assert(KNOTS.length === 2, `boğum ${KNOTS.length} ≠ 2`);
assert(TREE.tips.length === 6, `ana dal ucu ${TREE.tips.length} ≠ 6`);

// Kök grupları: tree.ts buildRoots sırası = her ROOT_DEF için [ana kök, n kökçük]. Ana kök = 5 katmanlı şerit.
const kokler = [];
let grup = -1;
kokSerit.forEach((s, i) => {
  const ana = s.layers.length > 1;
  if (ana) grup++;
  const segs = zincir(s.layers[0].d);
  const n = !ana ? 12 : grup === 0 ? 40 : 32;
  kokler.push({ i, grup, ana, start: s.start, end: s.end, segs, noktalar: ornekle(segs, s.layers, n) });
});
assert(grup === 6, `ana kök sayısı ${grup + 1} ≠ 7`);
const kokcuk = kokler.filter((k) => !k.ana).length;
assert(kokcuk === 74, `kökçük ${kokcuk} ≠ 74`);

// Uçlar: dots sırası şeritlerle aynı (ana, kökçükler, …). Şerit sonu ↔ dot eşleşmesi doğrulanır.
kokler.forEach((k, i) => {
  const d = TREE.dots[i];
  const son = k.noktalar[k.noktalar.length - 1];
  assert(Math.hypot(son[0] - d.x, son[1] - d.y) < 0.6, `uç ${i} şerit sonuyla eşleşmiyor (${son} ↔ ${d.x},${d.y})`);
  k.uc_orj = [d.x, d.y];
  k.uc_start = d.start;
  k.uc_end = d.end;
});

// ------------------------------------------------------------------ uç gevşetme (yalnız kökçükler kayar)
function nnOlc(P) {
  const nn = P.map((p, i) => Math.min(...P.map((q, j) => (i === j ? Infinity : Math.hypot(p[0] - q[0], p[1] - q[1])))));
  const s = [...nn].sort((a, b) => a - b);
  return { min: r2(s[0]), p10: r2(s[Math.floor(s.length * 0.1)]), medyan: r2(s[Math.floor(s.length / 2)]),
           alt8: nn.filter((v) => v < 8).length, alt9: nn.filter((v) => v < UC_ARALIK - 1e-6).length };
}
const B = { x0: 10, x1: 390, y0: GROUND_Y + 12, y1: 694 };   // tree.ts ROOT_BOUNDS
const P0 = kokler.map((k) => [...k.uc_orj]);
const P = kokler.map((k) => [...k.uc_orj]);
const once = nnOlc(P0);
for (let it = 0; it < 600; it++) {
  let hareket = 0;
  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      const dx = P[j][0] - P[i][0], dy = P[j][1] - P[i][1];
      const d = Math.hypot(dx, dy) || 1e-6;
      const hedef = UC_ARALIK + 0.25;
      if (d >= hedef) continue;
      const ai = kokler[i].ana ? 0 : 1, aj = kokler[j].ana ? 0 : 1;
      if (ai + aj === 0) continue;
      const it_ = (hedef - d) / (ai + aj) * 0.5;
      const ux = dx / d, uy = dy / d;
      P[i][0] -= ux * it_ * ai; P[i][1] -= uy * it_ * ai;
      P[j][0] += ux * it_ * aj; P[j][1] += uy * it_ * aj;
      hareket += it_;
    }
  }
  for (let i = 0; i < P.length; i++) {   // kayma sınırı + kök alanı
    let dx = P[i][0] - P0[i][0], dy = P[i][1] - P0[i][1];
    const m = Math.hypot(dx, dy);
    if (m > UC_KAYMA) { dx *= UC_KAYMA / m; dy *= UC_KAYMA / m; }
    P[i][0] = Math.min(B.x1, Math.max(B.x0, P0[i][0] + dx));
    P[i][1] = Math.min(B.y1, Math.max(B.y0, P0[i][1] + dy));
  }
  if (hareket < 1e-4) break;
}
const sonra = nnOlc(P);
let kaymaMaks = 0, kayan = 0;
kokler.forEach((k, i) => {
  const dx = P[i][0] - P0[i][0], dy = P[i][1] - P0[i][1];
  const m = Math.hypot(dx, dy);
  kaymaMaks = Math.max(kaymaMaks, m);
  if (m > 0.05) kayan++;
  k.uc = [r2(P[i][0]), r2(P[i][1])];
  k.kayma = r2(m);
  if (m > 0) {   // şerit gövdesi yumuşak bükülür: ofset(q) = Δ · q² (tabanda 0, uçta Δ)
    const n = k.noktalar.length;
    k.noktalar = k.noktalar.map(([x, y, w], j) => {
      const q = j / (n - 1);
      return [r2(x + dx * q * q), r2(y + dy * q * q), w];
    });
  }
});

// ------------------------------------------------------------------ gövde, dallar
const govde = govdeSerit[0];
const govdeSegs = zincir(govde.layers[0].d);
const gov = { start: govde.start, end: govde.end, segs: govdeSegs, noktalar: ornekle(govdeSegs, govde.layers, 72) };

// Dal sırası: tree.ts buildBranches = [önder, (ana dal i, alt dalları …) × 6]. Ana dal = 5 katman, önder = 4, alt = 3.
const dallar = [];
let ana = -1;
dalSerit.forEach((s, i) => {
  const L = s.layers.length;
  const tur = L === 4 ? "onder" : L === 5 ? "ana" : "alt";
  if (tur === "ana") ana++;
  const segs = zincir(s.layers[0].d);
  dallar.push({ i, tur, ana_id: tur === "onder" ? -1 : ana, start: s.start, end: s.end, segs,
                noktalar: ornekle(segs, s.layers, tur === "alt" ? 14 : 28) });
});
assert(dallar.filter((d) => d.tur === "ana").length === 6 && dallar.filter((d) => d.tur === "onder").length === 1,
       "dal türleri: 1 önder + 6 ana beklenir");
assert(dallar.filter((d) => d.tur === "alt").length === 16, "alt dal 16 beklenir");
// Ana dal uçları ↔ TREE.tips
dallar.filter((d) => d.tur === "ana").forEach((d, k) => {
  const son = d.noktalar[d.noktalar.length - 1];
  assert(Math.hypot(son[0] - TREE.tips[k].x, son[1] - TREE.tips[k].y) < 0.6, `dal ucu ${k} eşleşmiyor`);
});

const js = {
  kaynak: "src/components/fidan/tree.ts (Node içe aktarımı; scripts/blender/s3/agac_disa.mjs)",
  uretim: new Date().toISOString(),
  birim: "ağaç birimi (tree.ts): gövde x≈200, toprak y=GROUND_Y, aşağı +y; sahne.py 1 birim = 1,1 mm",
  GROUND_Y,
  sayilar: { kok_serit: kokler.length, uc: TREE.dots.length, kokcuk, ana_kok: 7, govde: 1, dal_serit: dallar.length,
             yaprak: TREE.leaves.length, bogum: KNOTS.length, ana_dal_ucu: TREE.tips.length },
  uc_gevsetme: { hedef_birim: UC_ARALIK, kayma_siniri: UC_KAYMA, once, sonra, kayma_maks: r2(kaymaMaks), kayan_uc: kayan },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- segs alanı dışa aktarılmaz
  kokler: kokler.map(({ segs, ...k }) => k),
  govde: { start: gov.start, end: gov.end, noktalar: gov.noktalar },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- segs alanı dışa aktarılmaz
  dallar: dallar.map(({ segs, ...d }) => d),
  yapraklar: TREE.leaves,
  uclar81: kokler.map((k) => ({ x: k.uc[0], y: k.uc[1], grup: k.grup, sira: k.i, ana: k.ana })),
  dal_uclari: TREE.tips,
  bogumlar: KNOTS,
  canopy: TREE.canopy,
};
mkdirSync(dirname(CIKIS), { recursive: true });
writeFileSync(CIKIS, JSON.stringify(js));
console.log(`[AGAC] ${CIKIS}: kök ${kokler.length} (ana 7, kökçük ${kokcuk}), uç ${TREE.dots.length}, dal ${dallar.length}, ` +
            `yaprak ${TREE.leaves.length}, boğum ${KNOTS.length} ✓`);
console.log(`[AGAC] uç en yakın komşu (birim): önce min ${once.min} · p10 ${once.p10} · medyan ${once.medyan} · <8: ${once.alt8}; ` +
            `sonra min ${sonra.min} · p10 ${sonra.p10} · medyan ${sonra.medyan} · <${UC_ARALIK}: ${sonra.alt9}; ` +
            `kayma maks ${r2(kaymaMaks)} birim, ${kayan} uç`);
if (sonra.alt9 > 0) console.log(`[UYARI] ${sonra.alt9} uç hâlâ ${UC_ARALIK} birimin altında`);
