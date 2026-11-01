/**
 * Fidan geometrisi (ağaç birimi; gövde x≈200'de, toprak y=470, kök uçları y≤700).
 *
 * Her şey modül yüklenirken, seed'li bir PRNG ile (Math.random YOK) üretilir;
 * sunucu ve istemci aynı çıktıyı verir → hydration uyuşmazlığı olmaz.
 * Koordinatlar 0,1 hassasiyete yuvarlanır.
 *
 * Zaman alanları (start/end) kendi aşamasının yerel 0–1 zamanıdır:
 * kökler "roots", gövde "trunk", dallar "branches", yörünge "rings";
 * yapraklar "leaves", orman "forest".
 */

export const GROUND_Y = 470;

type Pt = { x: number; y: number };
type Cubic = readonly [Pt, Pt, Pt, Pt];

type StrandStage = "roots" | "trunk" | "branches" | "rings";
export type StrandTone = "root" | "wood" | "ring" | "ring2";
/**
 * Bir çizginin katmanı. Kalın katmanlar yolun yalnızca başını kaplar ve
 * "butt" uçludur; üst üste binince pürüzsüz incelen bir gövde oluşur.
 * lag: büyüme cephesinin bu katmanda kaç birim geride kaldığı (uç da incelsin).
 */
type Layer = { d: string; w: number; lag: number; cap: "round" | "butt" };
export type Strand = {
  stage: StrandStage;
  tone: StrandTone;
  start: number;
  end: number;
  layers: Layer[];
};
type TipDot = { x: number; y: number; start: number; end: number };
type Leaf = {
  x: number;
  y: number;
  rot: number;
  s: number;
  tone: 0 | 1 | 2;
  start: number;
  end: number;
};
type ForestKind = "round" | "pine" | "sprout";
type ForestTree = {
  x: number;
  s: number;
  kind: ForestKind;
  tone: 0 | 1;
  alpha: number;
  /** Hangi taraftan kayarak gelir: -1 sol, +1 sağ. */
  from: -1 | 1;
  start: number;
  end: number;
};
type Knot = {
  x: number;
  y: number;
  side: -1 | 1;
  title: string;
  lines: readonly string[];
};

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const p = (x: number, y: number): Pt => ({ x, y });
const r1 = (n: number) => Math.round(n * 10) / 10;
const fx = (n: number) => String(r1(n) + 0);

function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function bezPt(c: Cubic, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * c[0].x + b * c[1].x + d * c[2].x + e * c[3].x,
    y: a * c[0].y + b * c[1].y + d * c[2].y + e * c[3].y,
  };
}

function bezTan(c: Cubic, t: number): Pt {
  const u = 1 - t;
  const x =
    3 * u * u * (c[1].x - c[0].x) + 6 * u * t * (c[2].x - c[1].x) + 3 * t * t * (c[3].x - c[2].x);
  const y =
    3 * u * u * (c[1].y - c[0].y) + 6 * u * t * (c[2].y - c[1].y) + 3 * t * t * (c[3].y - c[2].y);
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}

function rotate(v: Pt, a: number): Pt {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

function split(c: Cubic, t: number): [Cubic, Cubic] {
  const p01 = lerp(c[0], c[1], t);
  const p12 = lerp(c[1], c[2], t);
  const p23 = lerp(c[2], c[3], t);
  const p012 = lerp(p01, p12, t);
  const p123 = lerp(p12, p23, t);
  const m = lerp(p012, p123, t);
  return [
    [c[0], p01, p012, m],
    [m, p123, p23, c[3]],
  ];
}

/** Zincirin baştan u (0…segs.length) parametresine kadar olan kısmı. */
function chainPrefix(segs: readonly Cubic[], u: number): Cubic[] {
  const n = Math.floor(u);
  const f = u - n;
  const out: Cubic[] = segs.slice(0, Math.min(n, segs.length));
  if (n < segs.length && f > 0.001) out.push(split(segs[n], f)[0]);
  return out;
}

function chainD(segs: readonly Cubic[]): string {
  let d = `M${fx(segs[0][0].x)} ${fx(segs[0][0].y)}`;
  for (const s of segs) {
    d += `C${fx(s[1].x)} ${fx(s[1].y)} ${fx(s[2].x)} ${fx(s[2].y)} ${fx(s[3].x)} ${fx(s[3].y)}`;
  }
  return d;
}

/**
 * Zincirden pürüzsüz incelen katmanlar: n katman, uçta wTip, tabanda wBase
 * kalınlık; en kalın katman yolun minFrac kadarını kaplar.
 */
function taper(
  segs: readonly Cubic[],
  n: number,
  wTip: number,
  wBase: number,
  minFrac: number,
  lagStep = 1.2,
): Layer[] {
  const out: Layer[] = [];
  for (let k = 0; k < n; k++) {
    const q = n === 1 ? 0 : k / (n - 1);
    const frac = 1 - (1 - minFrac) * q;
    out.push({
      d: chainD(chainPrefix(segs, segs.length * frac)),
      w: Math.round((wTip + (wBase - wTip) * q) * 100) / 100,
      lag: Math.round(k * lagStep * 10) / 10,
      cap: k === 0 ? "round" : "butt",
    });
  }
  return out;
}

function cubicChord(c: Cubic): number {
  return Math.hypot(c[3].x - c[0].x, c[3].y - c[0].y);
}

/* ------------------------------------------------------------------ */
/* Kökler: 7 ana kök + 74 kökçük = 81 uç (81 il)                         */
/* ------------------------------------------------------------------ */

const ROOT_SEED = p(200, 480);

type RootDef = { c: Cubic; start: number; dur: number; n: number; w: readonly [number, number] };

const MAIN_W = [1.5, 3.9] as const;

const ROOT_DEFS: readonly RootDef[] = [
  // kazık kök
  {
    c: [p(200, 482), p(205, 546), p(188, 608), p(196, 686)],
    start: 0,
    dur: 0.5,
    n: 12,
    w: [1.8, 5],
  },
  { c: [p(197, 481), p(166, 492), p(104, 494), p(32, 534)], start: 0.05, dur: 0.46, n: 10, w: MAIN_W },
  { c: [p(203, 481), p(236, 491), p(302, 494), p(370, 526)], start: 0.08, dur: 0.46, n: 10, w: MAIN_W },
  { c: [p(198, 483), p(174, 526), p(118, 560), p(60, 644)], start: 0.12, dur: 0.46, n: 11, w: MAIN_W },
  { c: [p(202, 483), p(228, 528), p(290, 568), p(344, 654)], start: 0.15, dur: 0.46, n: 11, w: MAIN_W },
  { c: [p(199, 484), p(190, 558), p(156, 622), p(122, 690)], start: 0.18, dur: 0.44, n: 10, w: MAIN_W },
  { c: [p(201, 484), p(214, 562), p(246, 628), p(276, 693)], start: 0.21, dur: 0.44, n: 10, w: MAIN_W },
];

const ROOT_BOUNDS = { x0: 10, x1: 390, y0: GROUND_Y + 12, y1: 694 };

function buildRoots(): { strands: Strand[]; dots: TipDot[] } {
  const R = mulberry32(81922);
  const strands: Strand[] = [];
  const dots: TipDot[] = [];

  for (const def of ROOT_DEFS) {
    const end = def.start + def.dur;
    strands.push({ stage: "roots", tone: "root", start: def.start, end, layers: taper([def.c], 5, def.w[0], def.w[1], 0.22) });
    dots.push({ x: r1(def.c[3].x), y: r1(def.c[3].y), start: end - 0.01, end: end + 0.07 });

    for (let j = 0; j < def.n; j++) {
      const t = 0.14 + ((j + 0.2 + R() * 0.6) / def.n) * 0.8;
      const P = bezPt(def.c, t);
      const T = bezTan(def.c, t);
      const side = (j % 2 === 0 ? 1 : -1) * (R() < 0.22 ? -1 : 1);
      const ang = (0.55 + R() * 0.55) * side;
      let dir = rotate(T, ang);
      if (dir.y < -0.12) dir = rotate(T, -ang);
      let len = (15 + R() * 26) * (1 - t * 0.3);

      // Uç sınırların dışına taşmasın.
      for (let k = 0; k < 6; k++) {
        const ex = P.x + dir.x * len;
        const ey = P.y + dir.y * len + len * 0.18;
        if (ex > ROOT_BOUNDS.x0 && ex < ROOT_BOUNDS.x1 && ey > ROOT_BOUNDS.y0 && ey < ROOT_BOUNDS.y1) break;
        len *= 0.7;
      }

      const E = p(P.x + dir.x * len, P.y + dir.y * len + len * 0.18);
      const nrm = p(-dir.y, dir.x);
      const bend = (R() - 0.5) * len * 0.55;
      const c1 = p(P.x + dir.x * len * 0.35 + nrm.x * bend * 0.6, P.y + dir.y * len * 0.35 + nrm.y * bend * 0.6);
      const c2 = p(P.x + dir.x * len * 0.7 + nrm.x * bend, P.y + dir.y * len * 0.7 + nrm.y * bend + len * 0.08);
      const s = def.start + def.dur * t * 0.96;
      const e = s + 0.15 + R() * 0.08;
      strands.push({
        stage: "roots",
        tone: "root",
        start: s,
        end: e,
        layers: [{ d: chainD([[P, c1, c2, E]]), w: 1.15, lag: 0, cap: "round" }],
      });
      dots.push({ x: r1(E.x), y: r1(E.y), start: e - 0.01, end: e + 0.07 });
    }
  }

  // Aşamanın yerel zamanını 0–1'e normalize et.
  const maxEnd = Math.max(...dots.map((d) => d.end), ...strands.map((s) => s.end));
  for (const s of strands) {
    s.start /= maxEnd;
    s.end /= maxEnd;
  }
  for (const d of dots) {
    d.start /= maxEnd;
    d.end /= maxEnd;
  }
  return { strands, dots };
}

/* ------------------------------------------------------------------ */
/* Gövde: hafif S kıvrımlı, 24 katmanlı incelme                           */
/* ------------------------------------------------------------------ */

const TRUNK: readonly Cubic[] = [
  [p(200, 484), p(207, 430), p(189, 383), p(194, 334)],
  [p(194, 334), p(199, 286), p(213, 252), p(205, 204)],
  [p(205, 204), p(197, 156), p(191, 128), p(197, 86)],
];

function trunkAt(seg: number, t: number): Pt {
  return bezPt(TRUNK[seg], t);
}

function buildTrunk(): Strand {
  return { stage: "trunk", tone: "wood", start: 0, end: 1, layers: taper(TRUNK, 24, 4.6, 19, 0.07, 1.2) };
}

/* ------------------------------------------------------------------ */
/* Dallar: önder + 6 ana dal, her birinde 2–3 alt dal                    */
/* ------------------------------------------------------------------ */

type BranchDef = { at: Pt; c1: Pt; c2: Pt; tip: Pt };

/**
 * Alttan üste, sol/sağ dönüşümlü. Uçlarda polaroid asılı: aynı taraftaki uçlar
 * arasında ~95+ birim dikey boşluk var, kartlar (kamera ölçeğinde) üst üste binmez.
 */
const BRANCH_DEFS: readonly BranchDef[] = [
  { at: trunkAt(1, 0.2), c1: p(166, 302), c2: p(96, 290), tip: p(54, 244) },
  { at: trunkAt(1, 0.5), c1: p(238, 264), c2: p(306, 266), tip: p(348, 220) },
  { at: trunkAt(1, 0.86), c1: p(178, 214), c2: p(118, 198), tip: p(84, 140) },
  { at: trunkAt(2, 0.2), c1: p(236, 166), c2: p(298, 154), tip: p(336, 118) },
  { at: trunkAt(2, 0.5), c1: p(174, 124), c2: p(146, 96), tip: p(130, 46) },
  { at: trunkAt(2, 0.78), c1: p(214, 94), c2: p(240, 74), tip: p(252, 34) },
];

const LEADER: Cubic = [p(197, 86), p(201, 70), p(195, 52), p(199, 30)];

/** k: yaprak boyu çarpanı (polaroidin arkasından taşan uç kümeleri daha iri). */
type Cluster = { at: Pt; dir: Pt; n: number; r: number; order: number; k?: number };

function buildBranches(): { strands: Strand[]; clusters: Cluster[]; tips: Pt[]; along: { c: Cubic; n: number; order: number }[] } {
  const R = mulberry32(2017);
  const strands: Strand[] = [];
  const clusters: Cluster[] = [];
  const along: { c: Cubic; n: number; order: number }[] = [];
  const tips: Pt[] = [];

  // önder (gövdenin devamı)
  strands.push({
    stage: "branches",
    tone: "wood",
    start: 0,
    end: 0.4,
    layers: taper([LEADER], 4, 2.3, 4.4, 0.35),
  });
  clusters.push({ at: LEADER[3], dir: bezTan(LEADER, 1), n: 18, r: 22, order: 0.4, k: 1.1 });

  BRANCH_DEFS.forEach((b, i) => {
    const c: Cubic = [b.at, b.c1, b.c2, b.tip];
    const start = 0.04 + i * 0.07;
    const dur = 0.42;
    strands.push({
      stage: "branches",
      tone: "wood",
      start,
      end: start + dur,
      layers: taper([c], 5, 2.1, 6, 0.2),
    });
    tips.push(b.tip);
    // Ana dal ucunda polaroid asılı: yaprak kümesi ucun biraz üstünde, kartın
    // arkasından taşarak görünsün (kartın altında kaybolmasın).
    const td = bezTan(c, 1);
    clusters.push({ at: p(b.tip.x + td.x * 6, b.tip.y - 18), dir: td, n: 10, r: 30, order: start + dur, k: 1.2 });
    along.push({ c, n: 6, order: start + dur * 0.8 });

    const len = cubicChord(c) * 1.08;
    const count = R() < 0.55 ? 3 : 2;
    const up: 1 | -1 = bezTan(c, 0.5).x < 0 ? 1 : -1;
    for (let j = 0; j < count; j++) {
      const t = 0.3 + ((j + 0.25 + R() * 0.5) / count) * 0.58;
      const P = bezPt(c, t);
      const T = bezTan(c, t);
      const side = j % 2 === 0 ? up : (-up as 1 | -1);
      const ang = (0.42 + R() * 0.36) * side;
      let dir = rotate(T, ang);
      if (dir.y > 0.2) dir = rotate(T, -ang * 0.8);
      const l = len * (1 - t) * (0.55 + R() * 0.3) + 12;
      const E = p(P.x + dir.x * l, P.y + dir.y * l - l * 0.16);
      const nrm = p(-dir.y, dir.x);
      const bend = (R() - 0.5) * l * 0.35;
      const s1 = p(P.x + dir.x * l * 0.33 + nrm.x * bend * 0.5, P.y + dir.y * l * 0.33 + nrm.y * bend * 0.5);
      const s2 = p(P.x + dir.x * l * 0.68 + nrm.x * bend, P.y + dir.y * l * 0.68 + nrm.y * bend - l * 0.08);
      const sc: Cubic = [P, s1, s2, E];
      const ss = start + dur * t;
      const se = ss + 0.24 + R() * 0.08;
      strands.push({
        stage: "branches",
        tone: "wood",
        start: ss,
        end: se,
        layers: taper([sc], 3, 1.3, 2.6, 0.4, 0.8),
      });
      clusters.push({ at: E, dir: bezTan(sc, 1), n: 9, r: 18, order: se });
      along.push({ c: sc, n: 1, order: se * 0.95 });
    }
  });

  const maxEnd = Math.max(...strands.map((s) => s.end));
  for (const s of strands) {
    s.start /= maxEnd;
    s.end /= maxEnd;
  }
  return { strands, clusters, tips, along };
}

/* ------------------------------------------------------------------ */
/* Yapraklar: dal uçlarında kümeler + dallar boyunca seyrek             */
/* ------------------------------------------------------------------ */

function buildLeaves(clusters: Cluster[], along: { c: Cubic; n: number; order: number }[]): Leaf[] {
  const R = mulberry32(300);
  const raw: (Omit<Leaf, "start" | "end"> & { order: number })[] = [];
  const tone = (): 0 | 1 | 2 => {
    const v = R();
    return v < 0.58 ? 0 : v < 0.86 ? 1 : 2;
  };

  for (const cl of clusters) {
    const base = Math.atan2(cl.dir.y, cl.dir.x);
    const ox = cl.at.x - cl.dir.x * cl.r * 0.45;
    const oy = cl.at.y - cl.dir.y * cl.r * 0.45;
    for (let i = 0; i < cl.n; i++) {
      const a = base + (R() - 0.5) * 3.4;
      const dist = cl.r * Math.sqrt(R());
      const x = cl.at.x + Math.cos(a) * dist * 0.85 + cl.dir.x * cl.r * 0.18;
      const y = cl.at.y + Math.sin(a) * dist * 0.85 + cl.dir.y * cl.r * 0.18;
      const rot = (Math.atan2(y - oy, x - ox) * 180) / Math.PI + (R() - 0.5) * 50;
      raw.push({ x: r1(x), y: r1(y), rot: Math.round(rot), s: Math.round((0.95 + R() * 0.55) * (cl.k ?? 1) * 100) / 100, tone: tone(), order: cl.order + (dist / cl.r) * 0.08 });
    }
  }

  for (const a of along) {
    for (let i = 0; i < a.n; i++) {
      const t = 0.42 + ((i + R()) / a.n) * 0.5;
      const P = bezPt(a.c, t);
      const T = bezTan(a.c, t);
      const side = i % 2 === 0 ? 1 : -1;
      const rot = (Math.atan2(T.y, T.x) * 180) / Math.PI + side * (38 + R() * 30);
      raw.push({ x: r1(P.x), y: r1(P.y), rot: Math.round(rot), s: Math.round((0.85 + R() * 0.4) * 100) / 100, tone: tone(), order: a.order * (0.6 + t * 0.4) });
    }
  }

  // Büyüme sırası: dalların büyüme sırasını izler, biraz da rastgele.
  const orders = raw.map((l) => l.order);
  const lo = Math.min(...orders);
  const hi = Math.max(...orders);
  const leaves: Leaf[] = raw.map(({ order, ...l }) => {
    const start = ((order - lo) / (hi - lo || 1)) * 0.72 + R() * 0.12;
    return { ...l, start, end: start + 0.12 + R() * 0.05 };
  });
  const maxEnd = Math.max(...leaves.map((l) => l.end));
  for (const l of leaves) {
    l.start /= maxEnd;
    l.end /= maxEnd;
  }
  // Arkadakiler (koyu ton) önce çizilsin: derinlik hissi.
  leaves.sort((a, b) => (a.tone === 1 ? 0 : 1) - (b.tone === 1 ? 0 : 1));
  return leaves;
}

/* ------------------------------------------------------------------ */
/* Taç silueti: dalların arkasında birbirine geçen 3 yumuşak küme        */
/* ------------------------------------------------------------------ */

type Circle = { x: number; y: number; r: number };
/** Küme merkezi (x, y) ve merkeze göre daireler; start/end yaprak aşamasının yerel zamanı. */
type CanopyCluster = { x: number; y: number; circles: readonly Circle[]; start: number; end: number };

/**
 * Sol, sağ ve üst küme; birbirlerinin içine geçerek tek bir taç silüeti
 * oluşturur. Yalnızca yapraklar %60'ı geçtikten sonra görünür (bkz. Sapling).
 */
const CANOPY: readonly CanopyCluster[] = [
  {
    x: 112,
    y: 176,
    circles: [
      { x: 0, y: 6, r: 62 },
      { x: -42, y: 56, r: 44 },
      { x: 8, y: -66, r: 48 },
      { x: 46, y: -22, r: 46 },
    ],
    start: 0.6,
    end: 0.84,
  },
  {
    x: 290,
    y: 158,
    circles: [
      { x: 0, y: 4, r: 60 },
      { x: 44, y: 48, r: 46 },
      { x: -22, y: -64, r: 46 },
      { x: -46, y: -8, r: 44 },
    ],
    start: 0.66,
    end: 0.9,
  },
  {
    x: 200,
    y: 92,
    circles: [
      { x: 0, y: 0, r: 64 },
      { x: -36, y: -32, r: 42 },
      { x: 36, y: -40, r: 44 },
      { x: 0, y: 62, r: 54 },
    ],
    start: 0.72,
    end: 0.96,
  },
];

/* ------------------------------------------------------------------ */
/* Orman, yörünge yayları, boğumlar                                      */
/* ------------------------------------------------------------------ */

/** [x, tür, ölçek, ton, renk yoğunluğu]. Merkez (x 110–290) fidana boş bırakılır. */
const FOREST_SPOTS: readonly (readonly [number, ForestKind, number, 0 | 1, number])[] = [
  [-336, "round", 1.55, 1, 0.22],
  [-268, "pine", 1.3, 0, 0.3],
  [-204, "round", 1.1, 0, 0.32],
  [-146, "pine", 1.55, 1, 0.3],
  [-92, "round", 1.3, 0, 0.36],
  [-40, "pine", 1.15, 1, 0.42],
  [12, "round", 0.95, 0, 0.5],
  [100, "sprout", 1.2, 0, 0.85],
  [304, "sprout", 1.1, 0, 0.85],
  [344, "pine", 0.82, 1, 0.55],
  [392, "round", 1.0, 1, 0.5],
  [444, "pine", 1.15, 0, 0.42],
  [496, "round", 1.3, 1, 0.36],
  [552, "pine", 1.5, 0, 0.32],
  [614, "round", 1.15, 1, 0.28],
  [678, "pine", 1.35, 0, 0.25],
  [744, "round", 1.55, 0, 0.22],
];

/**
 * Ağaçlar fidana yakından uzağa doğru sırayla, kendi taraflarından (sol/sağ)
 * içeri kayarak büyür: from = kayma yönü (-1 soldan, +1 sağdan).
 */
function buildForest(): ForestTree[] {
  const maxDist = Math.max(...FOREST_SPOTS.map(([x]) => Math.abs(x - 200)));
  return FOREST_SPOTS.map(([x, kind, s, tone, alpha]) => {
    const start = Math.round((Math.abs(x - 200) / maxDist) * 0.5 * 1000) / 1000;
    return { x, kind, s, tone, alpha, from: x < 200 ? -1 : 1, start, end: start + 0.5 };
  });
}

function arcD(r: number): string {
  const cx = 200;
  return `M${cx - r} ${GROUND_Y}A${r} ${r} 0 0 1 ${cx + r} ${GROUND_Y}`;
}

function buildRings(): Strand[] {
  return [
    { stage: "rings", tone: "ring", start: 0, end: 0.8, layers: [{ d: arcD(492), w: 1.6, lag: 0, cap: "round" }] },
    { stage: "rings", tone: "ring2", start: 0.2, end: 1, layers: [{ d: arcD(540), w: 1.2, lag: 0, cap: "round" }] },
  ];
}

// Boğumlar gövdenin alt yarısında: etiketler dal uçlarındaki polaroidlerin altında kalır.
const K1 = trunkAt(0, 0.38);
const K2 = trunkAt(0, 0.82);

export const KNOTS: readonly Knot[] = [
  { x: r1(K1.x), y: r1(K1.y), side: -1, title: "2017", lines: ["Seçilme yaşı 18"] },
  { x: r1(K2.x), y: r1(K2.y), side: 1, title: "TBMM", lines: ["30 yaş altı", "5 vekilden 4'ü"] },
];

/* ------------------------------------------------------------------ */
/* Dışa aktarım                                                         */
/* ------------------------------------------------------------------ */

const roots = buildRoots();
const branches = buildBranches();

export const TREE = {
  seed: ROOT_SEED,
  strands: [...buildRings(), ...roots.strands, buildTrunk(), ...branches.strands] as readonly Strand[],
  dots: roots.dots as readonly TipDot[],
  leaves: buildLeaves(branches.clusters, branches.along) as readonly Leaf[],
  forest: buildForest() as readonly ForestTree[],
  canopy: CANOPY,
  /** Ana dal uçları, alttan üste: [solAlt, sağAlt, solOrta, sağOrta, solÜst, sağÜst]. */
  tips: branches.tips.map((t) => ({ x: r1(t.x), y: r1(t.y) })) as readonly Pt[],
} as const;
