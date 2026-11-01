"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { GROUND_Y, KNOTS, TREE, type Strand, type StrandTone } from "./tree";

/** Her aşamanın 0–1 yerel ilerlemesi (FidanStory scroll'dan hesaplar). */
export type Growth = {
  roots: number;
  trunk: number;
  knot1: number;
  knot2: number;
  branches: number;
  leaves: number;
  forest: number;
  rings: number;
};

/** Kamera: ağaç koordinatından (viewBox birimi) sahne pikseline: x·s + tx. */
export type Cam = { s: number; tx: number; ty: number };

/** Boğum etiketinin metin kutusu: boğum noktası (x, y) ve ona göre l/t/r/b (ölçeksiz). */
export type LabelBox = { x: number; y: number; l: number; t: number; r: number; b: number };

export type SaplingHandle = {
  /** labelA: boğum başına ek görünürlük (0–1); kart etiketi kesiyorsa 0. */
  render: (g: Growth, cam: Cam, labelA?: readonly number[]) => void;
  /** Boğum etiketlerinin metin kutuları (yazı tipi yüklendikten sonra yeniden ölçülmeli). */
  labelBoxes: () => LabelBox[];
};

const C = {
  blue: "#0c77b6",
  navy: "#1b4f9c",
  green: "#47b27a",
  teal: "#1f8879",
  orange: "#f08322",
  ink: "#555454",
  mist: "#eef4f8",
} as const;

/** Rengi beyazla önceden karıştır: saydamlık katmanı (opacity) gerekmez, boyama ucuz kalır. */
function onWhite(hex: string, a: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const ch = (v: number) =>
    Math.round(255 + (v - 255) * a)
      .toString(16)
      .padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

const STROKE: Record<StrandTone, string> = {
  root: C.teal,
  wood: "url(#fidan-wood)",
  ring: onWhite(C.blue, 0.32),
  ring2: onWhite(C.green, 0.38),
};

const LEAF_FILL = [C.green, C.teal, C.green] as const;
const LEAF_OPACITY = [1, 0.95, 0.62] as const;

/** Taç silüetinin son saydamlığı (tek grup saydamlığı; kümeler üst üste binince koyulaşmaz). */
const CANOPY_ALPHA = 0.2;
/** Kök uçlarındaki 81 noktanın son yarıçapı. */
const DOT_R = 2.7;
/** Orman ağaçlarının yandan kayma mesafesi (viewBox birimi). */
const FOREST_SLIDE = 80;
/** Boğum etiketinin alt satırları (ağaç birimi); ekranda en az 10 px kalsın. */
const KNOT_LINE = 11;
/** Kamera uzaklaşınca boğum etiketinin karşı ölçeği (FidanStory de polaroid yerleşiminde kullanır). */
export const knotScale = (camS: number) => Math.max(1, 10 / (KNOT_LINE * camS));

const clamp01 = (v: number) => (v > 0 ? (v < 1 ? v : 1) : 0);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const smooth = (t: number) => t * t * (3 - 2 * t);
function easeOutBack(t: number): number {
  const c1 = 1.6;
  const c3 = c1 + 1;
  const x = t - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}
/** Aşama zamanı → öğenin yerel 0–1 zamanı, q adımına yuvarlanmış (gereksiz yazımları keser). */
const localT = (t: number, start: number, end: number, q: number) =>
  Math.round(clamp01((t - start) / (end - start)) * q) / q;

type PathRt = { el: SVGPathElement; len: number; lag: number; off: number; vis: boolean };
type StrandRt = { def: Strand; paths: PathRt[]; gMax: number; last: number };
type ItemRt = { el: SVGElement; start: number; end: number; last: number };
type LeafRt = ItemRt & { pre: string; s: number };
type TreeRt = ItemRt & { x: number; from: number; s: number };
type Runtime = {
  cam: SVGGElement;
  camLast: string;
  strands: StrandRt[];
  dots: ItemRt[];
  leaves: LeafRt[];
  forest: TreeRt[];
  canopy: SVGGElement;
  canopyLast: number;
  clusters: (ItemRt & { pre: string })[];
  knots: { el: SVGGElement; pre: string; last: string }[];
  seed: SVGGElement | null;
  seedLast: number;
  halo: SVGGElement | null;
  haloLast: number;
};

function applyStrand(rt: StrandRt, stageT: number) {
  const local = localT(stageT, rt.def.start, rt.def.end, 1000);
  if (local === rt.last) return;
  rt.last = local;
  const grown = easeOut(local) * rt.gMax;
  for (const p of rt.paths) {
    const vis = Math.min(grown - p.lag, p.len);
    if (vis <= 0.05) {
      if (p.vis) {
        p.vis = false;
        p.el.style.visibility = "hidden";
      }
      continue;
    }
    // Değişmeyen path'e yazma: son değeri hatırla, eşitse atla.
    const off = Math.round((p.len - vis) * 10) / 10;
    if (off !== p.off) {
      p.off = off;
      p.el.style.strokeDashoffset = String(off);
    }
    if (!p.vis) {
      p.vis = true;
      p.el.style.visibility = "visible";
    }
  }
}

export default function Sapling({ ref }: { ref?: Ref<SaplingHandle> }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rtRef = useRef<Runtime | null>(null);
  const pendingRef = useRef<[Growth, Cam, readonly number[] | undefined] | null>(null);

  const apply = (g: Growth, cam: Cam, labelA?: readonly number[]) => {
    const rt = rtRef.current;
    if (!rt) {
      pendingRef.current = [g, cam, labelA];
      return;
    }

    // Kamera: tek bir <g> üzerinde tek bir transform.
    const camStr = `matrix(${cam.s.toFixed(4)} 0 0 ${cam.s.toFixed(4)} ${cam.tx.toFixed(1)} ${cam.ty.toFixed(1)})`;
    if (camStr !== rt.camLast) {
      rt.camLast = camStr;
      rt.cam.setAttribute("transform", camStr);
    }

    for (const s of rt.strands) applyStrand(s, g[s.def.stage]);

    for (const d of rt.dots) {
      const v = localT(g.roots, d.start, d.end, 200);
      if (v === d.last) continue;
      d.last = v;
      d.el.setAttribute("r", (DOT_R * Math.max(0, easeOutBack(v))).toFixed(2));
    }

    for (const l of rt.leaves) {
      const v = localT(g.leaves, l.start, l.end, 200);
      if (v === l.last) continue;
      l.last = v;
      l.el.setAttribute("transform", `${l.pre}${(Math.max(0, easeOutBack(v)) * l.s).toFixed(3)})`);
    }

    // Taç silüeti: yapraklar %60 dolmadan görünmez.
    const co = Math.round(smooth(clamp01((g.leaves - 0.6) / 0.32)) * 100) / 100;
    if (co !== rt.canopyLast) {
      rt.canopyLast = co;
      rt.canopy.setAttribute("opacity", (CANOPY_ALPHA * co).toFixed(3));
      rt.canopy.setAttribute("visibility", co > 0 ? "visible" : "hidden");
    }
    if (co > 0) {
      for (const c of rt.clusters) {
        const v = localT(g.leaves, c.start, c.end, 200);
        if (v === c.last) continue;
        c.last = v;
        c.el.setAttribute("transform", `${c.pre}${(0.72 + 0.28 * easeOut(v)).toFixed(3)})`);
      }
    }

    // Orman: fidana yakından uzağa, kendi tarafından içeri kayarak büyür.
    for (const f of rt.forest) {
      const v = localT(g.forest, f.start, f.end, 200);
      if (v === f.last) continue;
      f.last = v;
      const e = easeOut(v);
      f.el.setAttribute(
        "transform",
        `translate(${(f.x + f.from * FOREST_SLIDE * (1 - e)).toFixed(1)} ${GROUND_Y}) scale(${(f.s * e).toFixed(3)})`,
      );
    }

    // Boğumlar: belirirken zıplar; kamera uzaklaşınca etiket okunur boyda kalır.
    const ls = knotScale(cam.s);
    const kv = [g.knot1, g.knot2];
    rt.knots.forEach((k, i) => {
      const v = Math.round(kv[i] * 200) / 200;
      const a = Math.round(clamp01(v * 2) * clamp01(labelA?.[i] ?? 1) * 100) / 100;
      const str = a <= 0 ? "" : `${k.pre}${(Math.max(0, easeOutBack(v)) * ls).toFixed(3)})`;
      const key = `${str}|${a}`;
      if (key === k.last) return;
      k.last = key;
      if (a <= 0) {
        k.el.setAttribute("visibility", "hidden");
        return;
      }
      k.el.setAttribute("visibility", "visible");
      k.el.setAttribute("transform", str);
      k.el.setAttribute("opacity", String(a));
    });

    if (rt.halo) {
      const hv = Math.round(clamp01(1 - g.roots * 2.2) * 100) / 100;
      if (hv !== rt.haloLast) {
        rt.haloLast = hv;
        rt.halo.setAttribute("opacity", String(hv));
        rt.halo.setAttribute("transform", `scale(${(1 + (1 - hv) * 0.35).toFixed(3)})`);
        rt.halo.setAttribute("visibility", hv > 0 ? "visible" : "hidden");
      }
    }

    if (rt.seed) {
      const sv = Math.round(clamp01(1 - (g.trunk - 0.05) * 3) * 100) / 100;
      if (sv !== rt.seedLast) {
        rt.seedLast = sv;
        rt.seed.setAttribute("opacity", String(sv));
      }
    }
  };

  const labelBoxes = (): LabelBox[] => {
    const svg = svgRef.current;
    if (!svg) return [];
    return Array.from(svg.querySelectorAll<SVGGElement>("[data-knot]")).map((g, i) => {
      const k = KNOTS[i];
      let l = Infinity;
      let t = Infinity;
      let r = -Infinity;
      let b = -Infinity;
      for (const tx of Array.from(g.querySelectorAll("text"))) {
        try {
          const bb = tx.getBBox();
          l = Math.min(l, bb.x);
          t = Math.min(t, bb.y);
          r = Math.max(r, bb.x + bb.width);
          b = Math.max(b, bb.y + bb.height);
        } catch {
          // ölçülemezse aşağıdaki yaklaşık kutu kullanılır
        }
      }
      if (!Number.isFinite(l)) {
        l = k.side < 0 ? -140 : 40;
        r = k.side < 0 ? -40 : 140;
        t = -32;
        b = 16;
      }
      return { x: k.x, y: k.y, l, t, r, b };
    });
  };

  useImperativeHandle(ref, () => ({ render: apply, labelBoxes }));

  // Mount'ta path uzunluklarını bir kez ölç, dasharray'i kur (geometri sabit).
  useEffect(() => {
    const svg = svgRef.current;
    const cam = svg?.querySelector<SVGGElement>("[data-cam]");
    const canopy = svg?.querySelector<SVGGElement>("[data-canopy]");
    if (!svg || !cam || !canopy) return;

    const strands: StrandRt[] = [];
    svg.querySelectorAll<SVGGElement>("[data-strand]").forEach((grp) => {
      const def = TREE.strands[Number(grp.dataset.strand)];
      const paths = Array.from(grp.querySelectorAll<SVGPathElement>("path")).map((el, j) => {
        const len = Math.round(el.getTotalLength() * 100) / 100;
        el.style.strokeDasharray = `${len} ${len + 4}`;
        el.style.strokeDashoffset = String(len);
        return { el, len, lag: def.layers[j].lag, off: len, vis: false };
      });
      const gMax = Math.max(...paths.map((p) => p.len + p.lag));
      strands.push({ def, paths, gMax, last: -1 });
    });

    const items = <T extends { start: number; end: number }>(sel: string, defs: readonly T[]) =>
      Array.from(svg.querySelectorAll<SVGElement>(sel)).map((el, i) => ({
        el,
        start: defs[i].start,
        end: defs[i].end,
        last: -1,
      }));

    rtRef.current = {
      cam,
      camLast: "",
      strands,
      dots: items("[data-dot]", TREE.dots),
      leaves: items("[data-leaf]", TREE.leaves).map((it, i) => {
        const l = TREE.leaves[i];
        return { ...it, pre: `translate(${l.x} ${l.y}) rotate(${l.rot}) scale(`, s: l.s };
      }),
      forest: items("[data-ft]", TREE.forest).map((it, i) => ({
        ...it,
        x: TREE.forest[i].x,
        from: TREE.forest[i].from,
        s: TREE.forest[i].s,
      })),
      canopy,
      canopyLast: -1,
      clusters: items("[data-cluster]", TREE.canopy).map((it, i) => ({
        ...it,
        pre: `translate(${TREE.canopy[i].x} ${TREE.canopy[i].y}) scale(`,
      })),
      knots: Array.from(svg.querySelectorAll<SVGGElement>("[data-knot]")).map((el, i) => ({
        el,
        pre: `translate(${KNOTS[i].x} ${KNOTS[i].y}) scale(`,
        last: "",
      })),
      seed: svg.querySelector<SVGGElement>("[data-seed]"),
      seedLast: -1,
      halo: svg.querySelector<SVGGElement>("[data-halo]"),
      haloLast: -1,
    };

    if (pendingRef.current) {
      const [g, c, la] = pendingRef.current;
      pendingRef.current = null;
      apply(g, c, la);
    }
  }, []);

  const strandEls = (filter: (s: Strand) => boolean) =>
    TREE.strands.map((s, i) =>
      filter(s) ? (
        <g key={i} data-strand={i} stroke={STROKE[s.tone]} fill="none" strokeLinejoin="round">
          {s.layers.map((l, j) => (
            <path key={j} d={l.d} strokeWidth={l.w} strokeLinecap={l.cap} visibility="hidden" />
          ))}
        </g>
      ) : null,
    );

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 block size-full select-none"
    >
      <defs>
        <linearGradient id="fidan-wood" gradientUnits="userSpaceOnUse" x1="0" y1={GROUND_Y} x2="0" y2="40">
          <stop offset="0.05" stopColor={C.ink} />
          <stop offset="1" stopColor={C.green} />
        </linearGradient>
        <linearGradient id="fidan-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.mist} stopOpacity="1" />
          <stop offset="0.75" stopColor={C.mist} stopOpacity="0.55" />
          <stop offset="1" stopColor={C.mist} stopOpacity="0" />
        </linearGradient>
        {/* Yaprak: tabanı (0,0)'da, +x yönüne bakan damla; tüm yapraklar bunu <use> ile çizer. */}
        <symbol id="leaf" overflow="visible">
          <path d="M0 0C3.2-4.6 9-5.6 15.5 0C9 5.6 3.2 4.6 0 0Z" />
          <path d="M1.6 0L13 0" stroke="#fff" strokeOpacity="0.38" strokeWidth="0.7" fill="none" strokeLinecap="round" />
        </symbol>
        <symbol id="fidan-round" overflow="visible">
          <path d="M0 0C1-14-1-28 0-44" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <g fill="currentColor">
            <circle cx="0" cy="-62" r="23" />
            <circle cx="-17" cy="-50" r="16" />
            <circle cx="17" cy="-52" r="17" />
            <circle cx="3" cy="-80" r="15" />
          </g>
        </symbol>
        <symbol id="fidan-pine" overflow="visible">
          <path d="M0 0V-18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M0-98L-13-68H-7L-21-42H-13L-28-16H28L13-42H21L7-68H13Z" fill="currentColor" strokeLinejoin="round" />
        </symbol>
        <symbol id="fidan-sprout" overflow="visible">
          <path d="M0 0C0-7 1-13 0-20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          <g fill="currentColor">
            <path d="M0-18C-3-25-10-27-15-24C-11-18-4-16 0-18Z" />
            <path d="M0-16C4-22 11-23 15-19C11-14 4-13 0-16Z" />
          </g>
        </symbol>
      </defs>

      {/* Kamera: tüm ağaç bu tek <g>'nin içinde; ölçek/kaydırma yalnızca burada. */}
      <g data-cam="" transform="matrix(1 0 0 1 0 0)">
        {/* toprak */}
        <rect x={-700} y={GROUND_Y} width={1800} height={330} fill="url(#fidan-soil)" />

        {/* yörünge yayları (broşür kapağındaki çizgiler) */}
        {strandEls((s) => s.stage === "rings")}

        {/* arka plandaki fidanlar → orman (renkler beyazla önceden karıştırılmış, saydamlık yok) */}
        {TREE.forest.map((f, i) => (
          <use
            key={i}
            href={`#fidan-${f.kind}`}
            data-ft=""
            color={onWhite(f.tone === 0 ? C.green : C.teal, f.alpha)}
            transform={`translate(${f.x} ${GROUND_Y}) scale(0)`}
          />
        ))}

        {/* toprak çizgisi */}
        <path
          d={`M-700 ${GROUND_Y + 1}C-300 ${GROUND_Y - 3} -100 ${GROUND_Y + 4} 100 ${GROUND_Y}S300 ${GROUND_Y - 2} 500 ${GROUND_Y + 1}S900 ${GROUND_Y + 2} 1100 ${GROUND_Y}`}
          stroke={onWhite(C.ink, 0.55)}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* kökler */}
        {strandEls((s) => s.stage === "roots")}

        {/* 81 kök ucu = 81 il (yarıçap scroll ile büyür) */}
        <g fill={C.orange} stroke="#fff" strokeWidth="0.9">
          {TREE.dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="0" data-dot="" />
          ))}
        </g>

        {/* tohumun etrafında broşürdeki iç içe daireler (köklerle birlikte söner) */}
        <g transform={`translate(${TREE.seed.x} ${TREE.seed.y - 4})`}>
          <g data-halo="" fill="none" strokeLinecap="round">
            <circle r="22" stroke={C.green} strokeOpacity="0.55" strokeWidth="1.2" />
            <circle r="38" stroke={C.blue} strokeOpacity="0.32" strokeWidth="1" strokeDasharray="1 4.5" />
            <circle r="56" stroke={C.green} strokeOpacity="0.28" strokeWidth="1" />
            <circle r="76" stroke={C.blue} strokeOpacity="0.18" strokeWidth="0.9" strokeDasharray="1 4.5" />
            <circle cx="0" cy="-56" r="2.6" fill={C.orange} stroke="none" />
          </g>
        </g>

        {/* tohum */}
        <g transform={`translate(${TREE.seed.x} ${TREE.seed.y}) rotate(-18)`}>
          <g data-seed="">
            <ellipse rx="9" ry="6" fill={C.ink} />
            <path d="M-6 -1.5C-2 -4 3 -4 6.5 -1.5" stroke="#fff" strokeOpacity="0.5" strokeWidth="1" fill="none" strokeLinecap="round" />
          </g>
        </g>

        {/* taç silüeti: birbirine geçen 3 küme, tek saydamlıkla (üst üste binen yerler koyulaşmaz) */}
        <g data-canopy="" fill={C.green} opacity="0" visibility="hidden">
          {TREE.canopy.map((c, i) => (
            <g key={i} data-cluster="" transform={`translate(${c.x} ${c.y}) scale(0.72)`}>
              {c.circles.map((d, j) => (
                <circle key={j} cx={d.x} cy={d.y} r={d.r} />
              ))}
            </g>
          ))}
        </g>

        {/* gövde + dallar */}
        {strandEls((s) => s.stage === "trunk" || s.stage === "branches")}

        {/* gövdedeki boğumlar: 2017 ve TBMM */}
        {KNOTS.map((k, i) => (
          <g key={i} data-knot="" transform={`translate(${k.x} ${k.y}) scale(0)`} visibility="hidden">
            <path
              d={`M0 0L${k.side * 40} -12`}
              stroke={C.orange}
              strokeWidth="1.4"
              strokeDasharray="2 3"
              strokeLinecap="round"
              fill="none"
            />
            <circle r="7" fill={C.orange} stroke="#fff" strokeWidth="2.6" />
            <text
              x={k.side * 46}
              y={-15}
              textAnchor={k.side < 0 ? "end" : "start"}
              fontSize="18"
              fontWeight="900"
              fill={C.blue}
            >
              {k.title}
            </text>
            {k.lines.map((line, j) => (
              <text
                key={j}
                x={k.side * 46}
                y={-1 + j * 12.5}
                textAnchor={k.side < 0 ? "end" : "start"}
                fontSize={KNOT_LINE}
                fontWeight="700"
                fill={C.ink}
              >
                {line}
              </text>
            ))}
          </g>
        ))}

        {/* yapraklar: tek symbol + use; her yaprak tek öğe, tek transform */}
        <g>
          {TREE.leaves.map((l, i) => (
            <use
              key={i}
              href="#leaf"
              data-leaf=""
              transform={`translate(${l.x} ${l.y}) rotate(${l.rot}) scale(0)`}
              fill={LEAF_FILL[l.tone]}
              fillOpacity={LEAF_OPACITY[l.tone]}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
