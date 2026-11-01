"use client";

import createGlobe, { type Marker } from "cobe";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { backCover, cop31, cover, facts, stats } from "@/lib/content";
import { photos } from "@/lib/photos";
import { usePrefersReducedMotion } from "@/lib/useScrollProgress";
import {
  ANTALYA_EXPO,
  USKUDAR,
  baskentler,
  etkinlikler,
  greenRank,
  ilceler,
  iller,
  leafAngle,
  revealRank,
  type Etkinlik,
} from "./iller";
import {
  BRAND,
  GL_COLORS,
  IDLE_SPEED,
  SCALE_WORLD,
  TAU,
  capitalReveal,
  clamp01,
  easeOut,
  makeProjector,
  map,
  quantize,
  sceneAt,
  smooth,
  toVec,
  type Projector,
  type Scene,
  type Vec3,
} from "./sahne";

type Anchor = { top: number; bottom: number };
type Rect = { l: number; t: number; r: number; b: number };
type Side = Etkinlik["side"] | "right";

/** Etiket, yarı saydam panele bu kadar (px) yaklaşınca sönmeye başlar. */
const LABEL_FADE_PX = 12;

const MASK = "radial-gradient(closest-side, #000 91%, transparent 100%)";
const GLOBE_SIZE = "calc(min(100vw, 100vh) * 1.1)";
/** Final kapak kutusu: mobilde ekran genişliği → fotoğraf dairesi 72vw, mavi daire 52vw. */
const FINAL_BOX = "min(100vw, 64svh, 540px)";

const KIOSK_MS = 60_000;
const KIOSK_HOLD_MS = 3_000;
/** Kiosk: kullanıcı dokununca/kaydırınca akış durur; bu süre dokunulmazsa kaldığı yerden sürer. */
const KIOSK_RESUME_MS = 30_000;
/** Kahramanda boşta dönüş: son kaydırmadan sonra bu kadar sürer, sonra yavaşlayıp durur (pil). */
const IDLE_SPIN_MS = 12_000;
const IDLE_EASE_MS = 2_000;
/** Yükleniş: küre katmanı ve motifler bu sürede belirir (reduced-motion'da anında). */
const INTRO_MS = 700;
/** Kahraman motiflerinin scroll ile dönüşü (derece): mavi yaylar saat yönünde, kesik halka ters. */
const MOTIF_TURN_BLUE = 22;
const MOTIF_TURN_DASH = -14;
/** Antalya nabzı: 2 halka, 1,6 sn periyot. */
const PULSE_MS = 1600;
/** Nabız, son kaydırmadan bu kadar sonra sabit halkaya döner ve döngü uyur (pil). */
const PULSE_LIVE_MS = 20_000;

/** Final kompozisyonunda fotoğraf dairesinin merkezi ve yarıçapı (kutu yüzdesi). */
const PH = { cx: 57, cy: 38, r: 36 };

/** pathLength=360 çember üzerinde a0°'dan başlayıp len° süren yay (saat yönünde). */
function arcDash(len: number, a0: number): CSSProperties {
  return { strokeDasharray: `${len} ${360 - len}`, strokeDashoffset: `${-a0}` };
}
const pct = (v: number) => `${v.toFixed(2)}%`;
/** Merkez (cx, cy) ve yarıçap r (yüzde) için a° açısındaki nokta. */
function onCircle(cx: number, cy: number, r: number, a: number) {
  const t = (a * Math.PI) / 180;
  return { cx: pct(cx + r * Math.cos(t)), cy: pct(cy + r * Math.sin(t)) };
}

/** Kahraman motifleri (kürenin dışında): iki mavi yay + uç noktaları. */
const HERO_ARCS = [
  { r: 40, a0: -78, len: 90, opacity: 0.9 },
  { r: 43.5, a0: 22, len: 66, opacity: 0.55 },
] as const;
/** Final motifleri (fotoğraf dairesi çevresinde). */
const FIN_ARCS = [
  { r: 40.5, a0: -85, len: 100, opacity: 0.9 },
  { r: 43, a0: 24, len: 64, opacity: 0.55 },
] as const;

/**
 * Viewport ortasının (scroll konumu y ile) sahne koordinatına çevrilmesi.
 * k. panel ortadan geçerken s ∈ [k, k+0.5]; önceki boşlukta s ∈ [k-0.5, k].
 */
function stageAt(y: number, vh: number, anchors: readonly Anchor[]): number {
  const n = anchors.length;
  if (n === 0) return 0;
  const c = y + vh / 2;
  for (let k = 0; k < n; k++) {
    const a = anchors[k];
    // Kahraman bölümü sayfanın en üstünde: ilerleme scroll 0'dan başlar.
    const top = k === 0 ? Math.min(a.top + vh / 2, a.bottom - 1) : a.top;
    if (c < top) {
      if (k === 0) return 0;
      const prev = anchors[k - 1].bottom;
      return k - 0.5 + 0.5 * clamp01((c - prev) / Math.max(1, top - prev));
    }
    if (c <= a.bottom) return k + 0.5 * clamp01((c - top) / Math.max(1, a.bottom - top));
  }
  return n - 0.5;
}

export default function DunyaScene({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  // Final fotoğrafı yalnızca sahne yaklaşınca yüklenir (zayıf sinyalde ilk yüklemeyi yormasın).
  const [finaleReady, setFinaleReady] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const ovRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const motifsRef = useRef<HTMLDivElement>(null);
  const motifBlueRef = useRef<SVGSVGElement>(null);
  const motifDashRef = useRef<SVGSVGElement>(null);
  const finaleRef = useRef<HTMLDivElement>(null);
  const finBoxRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const sloganRef = useRef<HTMLParagraphElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const finDashRef = useRef<SVGGElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const membersRef = useRef<HTMLSpanElement>(null);
  const ilRef = useRef<HTMLSpanElement>(null);
  const ilceRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    const layer = layerRef.current;
    const wrap = wrapRef.current;
    const glCanvas = glRef.current;
    const ov = ovRef.current;
    const fallback = fallbackRef.current;
    const rings = ringsRef.current;
    const motifs = motifsRef.current;
    const motifBlue = motifBlueRef.current;
    const motifDash = motifDashRef.current;
    const finale = finaleRef.current;
    const finBox = finBoxRef.current;
    const photo = photoRef.current;
    const disc = discRef.current;
    const slogan = sloganRef.current;
    const caption = captionRef.current;
    const finDash = finDashRef.current;
    const hud = hudRef.current;
    const membersEl = membersRef.current;
    const ilEl = ilRef.current;
    const ilceEl = ilceRef.current;
    if (
      !content || !layer || !wrap || !glCanvas || !ov || !fallback || !rings || !motifs ||
      !motifBlue || !motifDash || !finale || !finBox || !photo || !disc || !slogan ||
      !caption || !finDash || !hud || !membersEl || !ilEl || !ilceEl
    ) {
      return;
    }
    const ctx = ov.getContext("2d");
    if (!ctx) return;

    const heroHint = content.querySelector<HTMLElement>("[data-hero-hint]");
    const hintChevron = heroHint?.querySelector<SVGSVGElement>("svg") ?? null;
    const finArcs = Array.from(finBox.querySelectorAll<SVGCircleElement>("[data-fin-arc]"));
    const finDots = Array.from(finBox.querySelectorAll<SVGCircleElement>("[data-fin-dot]"));

    // Mobil (dar ekran): GL çözünürlüğü ve harita örneklemi düşük (brief §2.3).
    const narrow = window.innerWidth < 500;
    const deviceDpr = window.devicePixelRatio || 1;
    const glDpr = Math.min(deviceDpr, narrow ? 1.5 : 2);
    const ovDpr = Math.min(deviceDpr, 2);
    const mapSamples = narrow ? 14_000 : 36_000;

    /* ---------------- ölçüm ---------------- */
    let anchors: Anchor[] = [];
    // Yarı saydam metin panelleri (sayfa koordinatı): etiketler panelin altına
    // girerken sönsün (arkadan "hayalet" yazı görünmesin).
    let panels: Rect[] = [];
    const panelsCv: Rect[] = [];
    let vh = window.innerHeight;
    let vw = document.documentElement.clientWidth;
    let maxScroll = 1;
    let sceneMax = 1;
    let size = Math.max(1, wrap.clientWidth);
    // Küre kutusunun (kaydırmasız) viewport'taki sol/üst köşesi: katman flex ile ortalı.
    let wrL = 0;
    let wrT0 = 0;
    // Kahramanda küre katmanı, başlık paneli ile alt ipucu arasına ortalanır.
    let shiftMax = 0;
    let shiftNow = 0;
    // Tuvalin ekranda görünen kısmı (etiketleri içeride tutmak için), tuval koordinatında.
    const vis = { l: 0, t: 0, r: 1, b: 1 };
    let fontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";
    let dirty = 6; // birkaç kare zorunlu çizim
    const morph = { dx: 0, dy: 0, s0: 1, dirty: true };

    const measure = () => {
      vh = window.innerHeight;
      vw = document.documentElement.clientWidth;
      maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
      const sy = window.scrollY;
      anchors = Array.from(content.querySelectorAll<HTMLElement>("[data-stage]"))
        .sort((a, b) => Number(a.dataset.stage) - Number(b.dataset.stage))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top + sy, bottom: r.bottom + sy };
        });
      panels = Array.from(content.querySelectorAll<HTMLElement>("[data-panel]")).map((el) => {
        const r = el.getBoundingClientRect();
        return { l: r.left, t: r.top + sy, r: r.right, b: r.bottom + sy };
      });
      // Sahne ilerlemesi p: kapanış bloğu hariç (son aşamanın altı ekranın altına gelince 1).
      const end = anchors.length ? anchors[anchors.length - 1].bottom : maxScroll + vh;
      sceneMax = Math.max(1, Math.min(maxScroll, end - vh));
      size = Math.max(1, wrap.clientWidth);
      wrL = (vw - size) / 2;
      wrT0 = (vh - size) / 2;

      const heroPanel = content.querySelector<HTMLElement>('[data-stage="0"] [data-panel]');
      if (heroPanel && heroHint) {
        const pb = heroPanel.getBoundingClientRect().bottom + sy;
        const ht = heroHint.getBoundingClientRect().top + sy;
        // Motif halkası (en dış yay ≈ %43.5) ekranın altından taşmasın (masaüstü/yatay ekran).
        const room = vh / 2 - 0.435 * size - 14;
        shiftMax = Math.max(0, Math.min(0.14 * vh, room, (pb + ht) / 2 - vh / 2));
      } else {
        shiftMax = 0;
      }

      const w = Math.round(size * ovDpr);
      if (ov.width !== w || ov.height !== w) {
        ov.width = w;
        ov.height = w;
      }
      morph.dirty = true;
      dirty = 6;
    };
    measure();

    /** Final: fotoğraf dairesi, kürenin yerinden ve boyutundan kendi yerine gelir. */
    const computeMorph = () => {
      const b = finBox.getBoundingClientRect();
      const W = b.width;
      if (W <= 0) return;
      const pcx = b.left + (W * PH.cx) / 100;
      const pcy = b.top + (W * PH.cy) / 100;
      morph.dx = vw / 2 - pcx;
      morph.dy = vh / 2 - pcy;
      // Fotoğraftaki dünya, dairenin ~%54'ü: başlangıçta WebGL küresiyle örtüşsün (üst sınır 1.9×).
      const globeR = 0.4 * SCALE_WORLD * size;
      morph.s0 = Math.min(1.9, Math.max(1, globeR / (0.54 * ((W * PH.r) / 100))));
      morph.dirty = false;
    };

    /* ---------------- sahne durumu ---------------- */
    let ySmooth = window.scrollY;
    let idle = 0;
    const sOf = (y: number) => {
      const raw = stageAt(y, vh, anchors);
      return reduced ? quantize(raw) : raw;
    };
    let scene: Scene = sceneAt(sOf(ySmooth), clamp01(ySmooth / sceneMax), idle, reduced);
    let drawn: Scene | null = null; // GL'in bir sonraki/son karesinin sahnesi (onRender'da güncellenir)

    /* ---------------- overlay (2D) ---------------- */
    const provVec = iller.map((il) => toVec(il));
    const distVec = ilceler.map((d) => toVec(d));
    const capVec = baskentler.map((c) => toVec(c));
    const evVec = etkinlikler.map((e) => toVec(e.il));
    const antVec = toVec(ANTALYA_EXPO);
    const uskVec = toVec(USKUDAR);
    const pt = new Float64Array(3);
    const scratch: [number, number, number] = [0, 0, 0];
    let pulseLive = true;

    const pill = (
      x: number,
      y: number,
      title: string,
      sub: string | null,
      side: Side,
      alpha: number,
      tu: number,
      color: string,
    ) => {
      if (alpha <= 0.01) return;
      const fs1 = 12.5 * tu;
      const fs2 = 10.5 * tu;
      const padX = 8 * tu;
      const padY = 5.5 * tu;
      ctx.font = `700 ${fs1}px ${fontFamily}`;
      const w1 = ctx.measureText(title).width;
      let w2 = 0;
      if (sub) {
        ctx.font = `500 ${fs2}px ${fontFamily}`;
        w2 = ctx.measureText(sub).width;
      }
      const w = Math.max(w1, w2) + padX * 2;
      const h = padY * 2 + fs1 * 1.15 + (sub ? fs2 * 1.3 : 0);
      const gap = 10 * tu;
      let bx = x + gap;
      let by = y - h / 2;
      switch (side) {
        case "left":
          bx = x - gap - w;
          break;
        case "above":
          bx = x - w / 2;
          by = y - gap - h;
          break;
        case "below":
          bx = x - w / 2;
          by = y + gap;
          break;
        case "above-left":
          bx = x - w + 6 * tu;
          by = y - gap - h;
          break;
        case "below-left":
          bx = x - w + 6 * tu;
          by = y + gap;
          break;
        default:
          break;
      }
      // Ekrandan taşacaksa işaretçinin üstüne kaydırmak yerine karşı tarafa çevir.
      if (side === "right" && bx + w > vis.r) bx = x - gap - w;
      else if (side === "left" && bx < vis.l) bx = x + gap;
      if (by < vis.t && (side === "above" || side === "above-left")) by = y + gap;
      else if (by + h > vis.b && (side === "below" || side === "below-left")) by = y - gap - h;
      bx = Math.max(vis.l, Math.min(vis.r - w, bx));
      by = Math.max(vis.t, Math.min(vis.b - h, by));
      // Panel altına giren etiket söner (reduced-motion: geçişsiz).
      // d: etiket kutusu ile panel arasındaki boşluk (negatif = üst üste).
      let a = alpha;
      for (const p of panelsCv) {
        const d = Math.max(p.l - (bx + w), bx - p.r, p.t - (by + h), by - p.b);
        if (d < LABEL_FADE_PX) a *= reduced ? (d > 4 ? 1 : 0) : clamp01(d / LABEL_FADE_PX);
      }
      if (a <= 0.01) return;
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(255,255,255,0.94)";
      ctx.strokeStyle = "rgba(12,119,182,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") ctx.roundRect(bx, by, w, h, 8 * tu);
      else ctx.rect(bx, by, w, h);
      ctx.fill();
      ctx.stroke();
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.font = `700 ${fs1}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.fillText(title, bx + padX, by + padY + fs1 * 0.58);
      if (sub) {
        ctx.font = `500 ${fs2}px ${fontFamily}`;
        ctx.fillStyle = BRAND.ink;
        ctx.fillText(sub, bx + padX, by + padY + fs1 * 1.15 + fs2 * 0.68);
      }
    };

    const dot = (P: Projector, v: Vec3, r: number, fill: string, halo: number) => {
      P(v, 1, pt);
      if (pt[2] < 0.05) return false;
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], r + halo, 0, TAU);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], r, 0, TAU);
      ctx.fillStyle = fill;
      ctx.fill();
      return true;
    };

    const drawTurkey = (sc: Scene, P: Projector, u: number, tu: number, now: number) => {
      // Antalya aşamasında (dim → 1) ilçeler tamamen gizlenir, iller küçülüp soluklaşır.
      const baseIl = sc.tr * (1 - 0.2 * sc.dim);
      const baseIlce = sc.tr * 0.55 * (1 - sc.dim);
      if (baseIl <= 0.01) return;

      // İlçeler: küçük, soluk noktalar (ili belirince).
      if (baseIlce > 0.01) {
        const rD = 1.15 * u;
        ctx.globalAlpha = baseIlce;
        for (let pass = 0; pass < 2; pass++) {
          ctx.beginPath();
          let any = false;
          for (let i = 0; i < ilceler.length; i++) {
            const pi = ilceler[i].il;
            if (sc.provinces - revealRank[pi] < 0.6) continue;
            const isGreen = sc.green - greenRank[pi] >= 0.5;
            if ((pass === 1) !== isGreen) continue;
            P(distVec[i], 1, pt);
            if (pt[2] < 0.05) continue;
            ctx.moveTo(pt[0] + rD, pt[1]);
            ctx.arc(pt[0], pt[1], rD, 0, TAU);
            any = true;
          }
          if (any) {
            ctx.fillStyle = pass === 0 ? BRAND.navy : BRAND.teal;
            ctx.fill();
          }
        }
      }

      // İller: önce beyaz hale, sonra renkli nokta/yaprak.
      ctx.globalAlpha = baseIl;
      const rP = 3.2 * u * (1 - 0.32 * sc.dim);
      const halo = 1.4 * u * (1 - 0.25 * sc.dim);
      const items: { x: number; y: number; r: number; h: number; green: boolean; leaf: number; ang: number }[] = [];
      for (let i = 0; i < iller.length; i++) {
        const a = clamp01(sc.provinces - revealRank[i]);
        if (a <= 0) continue;
        P(provVec[i], 1, pt);
        if (pt[2] < 0.05) continue;
        const g = clamp01(sc.green - greenRank[i]);
        const green = g >= 0.5;
        const pop = easeOut(a) * (1 + 0.35 * Math.sin(Math.PI * a));
        items.push({
          x: pt[0],
          y: pt[1],
          r: rP * pop,
          h: halo * Math.min(1, pop),
          green,
          leaf: green ? sc.leaf * smooth(g * 2 - 1) : 0,
          ang: leafAngle[i],
        });
      }
      const leafPath = (it: (typeof items)[number], grow: number) => {
        const L = it.r + (7.5 * u - it.r) * it.leaf + grow;
        const W = L * 0.95;
        const ca = Math.cos(it.ang);
        const sa = Math.sin(it.ang);
        ctx.moveTo(it.x + ca * L, it.y + sa * L);
        ctx.quadraticCurveTo(it.x - sa * W, it.y + ca * W, it.x - ca * L, it.y - sa * L);
        ctx.quadraticCurveTo(it.x + sa * W, it.y - ca * W, it.x + ca * L, it.y + sa * L);
      };
      // Hale
      ctx.beginPath();
      for (const it of items) {
        if (it.leaf > 0.04) leafPath(it, it.h);
        else {
          ctx.moveTo(it.x + it.r + it.h, it.y);
          ctx.arc(it.x, it.y, it.r + it.h, 0, TAU);
        }
      }
      ctx.fillStyle = "#fff";
      ctx.fill();
      // Mavi noktalar
      ctx.beginPath();
      for (const it of items) {
        if (it.green) continue;
        ctx.moveTo(it.x + it.r, it.y);
        ctx.arc(it.x, it.y, it.r, 0, TAU);
      }
      ctx.fillStyle = BRAND.blue;
      ctx.fill();
      // Yeşil nokta/yapraklar
      ctx.beginPath();
      for (const it of items) {
        if (!it.green) continue;
        if (it.leaf > 0.04) leafPath(it, 0);
        else {
          ctx.moveTo(it.x + it.r, it.y);
          ctx.arc(it.x, it.y, it.r, 0, TAU);
        }
      }
      ctx.fillStyle = BRAND.green;
      ctx.fill();
      // Yaprak damarları
      if (sc.leaf > 0.3) {
        ctx.beginPath();
        for (const it of items) {
          if (it.leaf < 0.3) continue;
          const L = (it.r + (7.5 * u - it.r) * it.leaf) * 0.7;
          const ca = Math.cos(it.ang);
          const sa = Math.sin(it.ang);
          ctx.moveTo(it.x + ca * L, it.y + sa * L);
          ctx.lineTo(it.x - ca * L, it.y - sa * L);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = 0.8 * u;
        ctx.stroke();
      }

      // Üsküdar Hatıra Ormanı
      if (sc.uskudar > 0.01) {
        P(uskVec, 1, pt);
        if (pt[2] > 0.05) {
          const x = pt[0];
          const y = pt[1];
          ctx.globalAlpha = sc.uskudar * sc.tr;
          ctx.beginPath();
          ctx.arc(x, y, 11 * u, 0, TAU);
          ctx.strokeStyle = BRAND.green;
          ctx.lineWidth = 2 * u;
          ctx.stroke();
          pill(
            x,
            y,
            "Hatıra Ormanı · Üsküdar",
            `${facts.saplings} fidan · ${facts.saplingsYear}`,
            "above",
            sc.uskudar * sc.tr,
            tu,
            BRAND.teal,
          );
        }
      }

      // Gençlik buluşmaları / şölen
      if (sc.eventsAlpha > 0.01 && sc.events > 0) {
        const active = Math.min(etkinlikler.length - 1, Math.floor(sc.events - 1e-6));
        for (let i = 0; i < etkinlikler.length; i++) {
          const a = clamp01(sc.events - i);
          if (a <= 0) continue;
          const ev = etkinlikler[i];
          P(evVec[i], 1, pt);
          if (pt[2] < 0.1) continue;
          const x = pt[0];
          const y = pt[1];
          const r = (ev.big ? 7.5 : 5) * u * easeOut(a);
          ctx.globalAlpha = sc.eventsAlpha;
          if (a < 1) {
            ctx.beginPath();
            ctx.arc(x, y, r + 20 * u * a, 0, TAU);
            ctx.strokeStyle = BRAND.orange;
            ctx.lineWidth = 2 * u;
            ctx.globalAlpha = sc.eventsAlpha * (1 - a);
            ctx.stroke();
            ctx.globalAlpha = sc.eventsAlpha;
          }
          if (ev.big && a >= 1) {
            ctx.beginPath();
            ctx.arc(x, y, r + 6 * u, 0, TAU);
            ctx.strokeStyle = BRAND.orange;
            ctx.lineWidth = 1.5 * u;
            ctx.globalAlpha = sc.eventsAlpha * 0.45;
            ctx.stroke();
            ctx.globalAlpha = sc.eventsAlpha;
          }
          ctx.beginPath();
          ctx.arc(x, y, r + 1.6 * u, 0, TAU);
          ctx.fillStyle = "#fff";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fillStyle = BRAND.orange;
          ctx.fill();
          const showSub = i === active || (ev.big && a >= 1);
          pill(
            x,
            y,
            ev.title,
            showSub ? ev.sub : null,
            ev.side,
            sc.eventsAlpha * smooth(a * 1.6),
            tu,
            BRAND.navy,
          );
        }
      }

      // Antalya: nabız (2 halka, 1,6 sn). Reduced-motion: tek sabit halka.
      if (sc.antalya > 0.01) {
        P(antVec, 1, pt);
        if (pt[2] > 0.05) {
          const x = pt[0];
          const y = pt[1];
          const r = 7 * u;
          ctx.lineWidth = 2 * u;
          ctx.strokeStyle = BRAND.orange;
          if (reduced || !pulseLive) {
            ctx.globalAlpha = sc.antalya * 0.5;
            ctx.beginPath();
            ctx.arc(x, y, r + 14 * u, 0, TAU);
            ctx.stroke();
          } else {
            for (let k = 0; k < 2; k++) {
              const ph = (now / PULSE_MS + k / 2) % 1;
              ctx.globalAlpha = sc.antalya * (1 - ph) * 0.75;
              ctx.beginPath();
              ctx.arc(x, y, r + 30 * u * easeOut(ph), 0, TAU);
              ctx.stroke();
            }
          }
          ctx.globalAlpha = sc.antalya;
          dot(P, antVec, r, BRAND.orange, 2.2 * u);
          pill(x, y, "Antalya Expo", cop31.dates, "right", sc.antalya, tu * 1.1, BRAND.navy);
        }
      }
    };

    /**
     * Dünya aşaması: Antalya'dan başkentlere ışık yayları. Ortografik izdüşüm;
     * yalnızca görünür yarımkürenin iç kısmında çizilir: kenara (limb)
     * yaklaşırken 3 bantta soluklaşır, en dış şeritte (hz < ARC_MIN_HZ) hiç
     * çizilmez — yaylar silüet boyunca sarkıp "saç teli" gibi taşmasın.
     * Yükseklik ≤ yarıçapın %12'si ve kenara doğru sıfırlanır. Uçta küçük nokta.
     */
    const ARC_ALPHA = [0.9, 0.5, 0.22] as const;
    const ARC_MIN_HZ = 0.12;
    const drawWorld = (sc: Scene, P: Projector, u: number) => {
      const half = size / 2;
      const bands = [new Path2D(), new Path2D(), new Path2D()];
      const heads: number[] = [];
      const ax = antVec[0];
      const ay = antVec[1];
      const az = antVec[2];
      for (let i = 0; i < baskentler.length; i++) {
        const rv = capitalReveal(i, sc);
        if (rv <= 0) continue;
        const b = capVec[i];
        const cosO = Math.max(-1, Math.min(1, ax * b[0] + ay * b[1] + az * b[2]));
        const omega = Math.acos(cosO);
        const sinO = Math.sin(omega);
        if (sinO < 1e-4) continue;
        const alt = 0.02 + 0.1 * Math.min(1, omega / (Math.PI / 2)); // en çok 0.12
        const t1 = easeOut(rv);
        const N = Math.max(6, Math.ceil((omega / Math.PI) * 48));
        let px = 0;
        let py = 0;
        let pb = -1;
        for (let j = 0; j <= N; j++) {
          const t = (t1 * j) / N;
          const w1 = Math.sin((1 - t) * omega) / sinO;
          const w2 = Math.sin(t * omega) / sinO;
          scratch[0] = ax * w1 + b[0] * w2;
          scratch[1] = ay * w1 + b[1] * w2;
          scratch[2] = az * w1 + b[2] * w2;
          P(scratch, 1, pt);
          const hz = pt[2];
          // Kenara (limb) yaklaşan yay yüzeye yatar: silüetin dışına taşmaz.
          const lift = 1 + alt * Math.sin(Math.PI * t) * smooth(hz / 0.5);
          const x = half + (pt[0] - half) * lift;
          const y = half + (pt[1] - half) * lift;
          const band = hz > 0.36 ? 0 : hz > 0.22 ? 1 : hz > ARC_MIN_HZ ? 2 : -1;
          if (j > 0 && band >= 0 && pb >= 0) {
            const path = bands[Math.max(band, pb)];
            path.moveTo(px, py);
            path.lineTo(x, y);
          }
          px = x;
          py = y;
          pb = band;
        }
        if (rv < 1 && pb >= 0) heads.push(px, py, pb);
      }
      ctx.lineCap = "round";
      ctx.lineWidth = 1.4 * u;
      ctx.strokeStyle = BRAND.green;
      for (let k = 0; k < 3; k++) {
        ctx.globalAlpha = sc.world * ARC_ALPHA[k];
        ctx.stroke(bands[k]);
      }

      // Uç noktaları: büyüyen yayın başı + varılan başkent (beyaz haleli yeşil nokta).
      const rC = 2.4 * u;
      const rH = 1.1 * u;
      for (let pass = 0; pass < 2; pass++) {
        const near = new Path2D();
        const far = new Path2D();
        const r = pass === 0 ? rC + rH : rC;
        for (let k = 0; k < heads.length; k += 3) {
          const path = heads[k + 2] === 0 ? near : far;
          path.moveTo(heads[k] + r * 0.8, heads[k + 1]);
          path.arc(heads[k], heads[k + 1], r * 0.8, 0, TAU);
        }
        for (let i = 0; i < baskentler.length; i++) {
          if (capitalReveal(i, sc) < 0.97) continue;
          P(capVec[i], 1, pt);
          if (pt[2] < ARC_MIN_HZ) continue;
          const path = pt[2] > 0.3 ? near : far;
          path.moveTo(pt[0] + r, pt[1]);
          path.arc(pt[0], pt[1], r, 0, TAU);
        }
        ctx.fillStyle = pass === 0 ? "#fff" : BRAND.green;
        ctx.globalAlpha = sc.world;
        ctx.fill(near);
        ctx.globalAlpha = sc.world * 0.45;
        ctx.fill(far);
      }

      // Antalya: tüm yayların çıkış noktası
      ctx.globalAlpha = sc.world;
      dot(P, antVec, 4.5 * u, BRAND.orange, 1.8 * u);
    };

    const drawOverlay = (sc: Scene, now: number) => {
      ctx.setTransform(ovDpr, 0, 0, ovDpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, size, size);
      // Tuvalin bu karedeki üst kenarı (kahraman kaydırması dahil) ve görünen kısmı.
      const wrT = wrT0 + shiftNow;
      vis.l = Math.max(0, -wrL) + 8;
      vis.r = Math.min(size, vw - wrL) - 8;
      vis.t = Math.max(0, -wrT) + 8;
      vis.b = Math.min(size, vh - wrT) - 8;
      // Ekrandaki panellerin tuval koordinatları (bu kare için).
      const sy = window.scrollY;
      panelsCv.length = 0;
      for (const p of panels) {
        const t = p.t - sy - wrT;
        const b = p.b - sy - wrT;
        if (b < -LABEL_FADE_PX || t > size + LABEL_FADE_PX) continue;
        panelsCv.push({ l: p.l - wrL, t, r: p.r - wrL, b });
      }
      const P = makeProjector(sc.cam, size);
      const u = size / 430;
      const tu = Math.min(u, 1.35);

      // Kahraman: Antalya etiketi (Antalya bize dönükken)
      if (sc.hero > 0.01) {
        P(antVec, 1, pt);
        const facing = smooth(map(pt[2], 0.3, 0.65));
        if (facing > 0.01) {
          const x = pt[0];
          const y = pt[1];
          ctx.globalAlpha = sc.hero * facing;
          dot(P, antVec, 4.2 * u, BRAND.orange, 1.8 * u);
          pill(x, y, "Antalya", "COP31 · " + cop31.dates, "right", sc.hero * facing, tu, BRAND.navy);
        }
      }
      if (sc.tr > 0.01) drawTurkey(sc, P, u, tu, now);
      if (sc.world > 0.01) drawWorld(sc, P, u);
      ctx.globalAlpha = 1;
    };

    /* ---------------- cobe ---------------- */
    const markersFor = (sc: Scene): Marker[] => {
      const m: Marker[] = [];
      if (sc.hero > 0.01) m.push({ location: [ANTALYA_EXPO.lat, ANTALYA_EXPO.lng], size: 0.1 * sc.hero });
      if (sc.world > 0.01) {
        m.push({
          location: [ANTALYA_EXPO.lat, ANTALYA_EXPO.lng],
          size: 0.08 * sc.world,
          color: GL_COLORS.orange,
        });
        for (let i = 0; i < baskentler.length; i++) {
          const rv = capitalReveal(i, sc);
          if (rv <= 0) continue;
          m.push({ location: [baskentler[i].lat, baskentler[i].lng], size: 0.035 * easeOut(rv) * sc.world });
        }
      }
      return m;
    };

    let globe: ReturnType<typeof createGlobe> | null = null;
    let glRunning = false;
    const bw = Math.max(1, Math.floor(glCanvas.clientWidth * glDpr));
    glCanvas.width = bw;
    glCanvas.height = bw;
    try {
      globe = createGlobe(glCanvas, {
        devicePixelRatio: glDpr,
        width: bw,
        height: bw,
        phi: scene.cam.phi,
        theta: scene.cam.theta,
        scale: scene.cam.scale,
        dark: 0,
        diffuse: 1.2,
        mapSamples,
        mapBrightness: scene.mapBrightness,
        baseColor: GL_COLORS.base,
        markerColor: scene.markerColor,
        glowColor: GL_COLORS.glow,
        offset: [0, 0],
        markers: markersFor(scene),
        onRender: (state) => {
          // Önce GL'in az önce çizdiği kareyle aynı durumdaki overlay'i çiz.
          if (drawn) drawOverlay(drawn, performance.now());
          const sc = scene;
          state.phi = sc.cam.phi;
          state.theta = sc.cam.theta;
          state.scale = sc.cam.scale;
          state.mapBrightness = sc.mapBrightness;
          state.markerColor = sc.markerColor;
          state.markers = markersFor(sc);
          state.width = glCanvas.width;
          state.height = glCanvas.height;
          drawn = sc;
        },
      });
      glRunning = true;
    } catch {
      globe = null;
      fallback.style.display = "block";
    }

    /* ---------------- kiosk (?auto=1) ---------------- */
    // 60 sn'de baştan sona, sonda 3 sn bekle, başa dön, sonsuz döngü. Kullanıcı
    // dokunur/kaydırırsa akış durur; 30 sn dokunulmazsa kaldığı yerden sürer.
    const kiosk = new URLSearchParams(window.location.search).get("auto") === "1";
    let kPhase: "run" | "hold" = "run";
    let kPos = window.scrollY;
    let kResync = true;
    let kHoldUntil = 0;
    let kPauseUntil = 0;
    let kTimer = 0;
    let snap = false;
    const onUser = () => {
      kPauseUntil = performance.now() + KIOSK_RESUME_MS;
      kPhase = "run";
      kResync = true;
      window.clearTimeout(kTimer);
      kTimer = window.setTimeout(() => wake(), KIOSK_RESUME_MS + 50);
    };
    if (kiosk) {
      window.addEventListener("wheel", onUser, { passive: true });
      window.addEventListener("touchstart", onUser, { passive: true });
      window.addEventListener("pointerdown", onUser, { passive: true });
      window.addEventListener("keydown", onUser);
    }

    /* ---------------- DOM güncellemeleri ---------------- */
    const last = {
      hint: -1,
      layer: -1,
      shift: -1,
      globe: -1,
      rings: -1,
      motifs: -1,
      turn: -1,
      hud: -1,
      members: "",
      il: "",
      ilce: "",
      show: false,
      finale: -1,
      disc: -1,
      slogan: -1,
      orbits: -1,
    };
    const setOpacity = (el: HTMLElement | SVGElement, v: number) => {
      el.style.opacity = v.toFixed(3);
      el.style.visibility = v <= 0.001 ? "hidden" : "visible";
    };

    const applyDom = (sc: Scene, s: number, sRaw: number, intro: number) => {
      // "Aşağı kaydırın" ipucu kaydırma başlayınca söner (yukarı kayıp sayaçla çakışmasın).
      if (heroHint) {
        const hintO = reduced ? (sRaw > 0.3 ? 0 : 1) : 1 - smooth(map(s, 0.05, 0.28));
        if (Math.abs(hintO - last.hint) > 1e-3) {
          const wasHidden = last.hint <= 0.001;
          last.hint = hintO;
          heroHint.style.opacity = hintO.toFixed(3);
          const hidden = hintO <= 0.001;
          if (hidden !== wasHidden) {
            heroHint.style.visibility = hidden ? "hidden" : "";
            // Görünmezken ok animasyonu (bounce) her karede stil hesaplatmasın.
            if (hintChevron) hintChevron.style.animationPlayState = hidden ? "paused" : "";
          }
        }
      }
      // Küre katmanı: yükleniş + kahramanda aşağı kayma (yalnızca transform/opacity).
      if (Math.abs(intro - last.layer) > 1e-3) {
        last.layer = intro;
        layer.style.opacity = intro.toFixed(3);
      }
      const shift = Math.round(shiftMax * sc.heroShift * 10) / 10;
      if (shift !== last.shift) {
        last.shift = shift;
        layer.style.transform = shift > 0 ? `translate3d(0,${shift}px,0)` : "";
      }
      shiftNow = shift;

      if (Math.abs(sc.globe - last.globe) > 1e-3) {
        last.globe = sc.globe;
        wrap.style.opacity = sc.globe.toFixed(3);
      }
      const ringO = sc.globe * sc.porthole;
      if (Math.abs(ringO - last.rings) > 1e-3) {
        last.rings = ringO;
        setOpacity(rings, ringO);
      }
      const motifO = sc.globe * sc.motifs;
      if (Math.abs(motifO - last.motifs) > 1e-3) {
        last.motifs = motifO;
        setOpacity(motifs, motifO);
      }
      if (motifO > 0.001 && Math.abs(sc.motifTurn - last.turn) > 1e-4) {
        last.turn = sc.motifTurn;
        motifBlue.style.transform = `rotate(${(sc.motifTurn * MOTIF_TURN_BLUE).toFixed(2)}deg)`;
        motifDash.style.transform = `rotate(${(sc.motifTurn * MOTIF_TURN_DASH).toFixed(2)}deg)`;
      }

      // HUD sayaç. Reduced-motion'da son değerler; Türkiye boşluğunda görünür,
      // Biz Kimiz paneli yukarı çıkıp HUD'un altına girmeden gizlenir (ham s ile).
      const hudO = reduced ? (sRaw >= 0.75 && sRaw < 1.12 ? 1 : 0) : sc.hud;
      const c = reduced ? 1 : sc.counter;
      if (Math.abs(hudO - last.hud) > 1e-3) {
        last.hud = hudO;
        setOpacity(hud, hudO);
      }
      if (hudO > 0) {
        const members = `${Math.round(facts.members * c).toLocaleString("tr-TR")}${c >= 1 ? "+" : ""}`;
        const il = String(Math.floor(facts.provinces * c));
        const ilce = String(Math.round(facts.districts * c));
        if (members !== last.members) membersEl.textContent = last.members = members;
        if (il !== last.il) ilEl.textContent = last.il = il;
        if (ilce !== last.ilce) ilceEl.textContent = last.ilce = ilce;
      }

      // Final: küre söner, kapak (fotoğraf dairesi + slogan dairesi + yaylar) belirir.
      // Katman dünya aşamasında önceden açılır (fotoğraf zamanında yüklensin).
      const show = s > 4.3 || sc.finale > 0;
      if (show !== last.show) {
        last.show = show;
        finale.style.display = show ? "flex" : "none";
        if (show) {
          setFinaleReady(true);
          morph.dirty = true;
        }
      }
      if (!show) return;
      if (morph.dirty) computeMorph();

      if (Math.abs(sc.finale - last.finale) > 1e-4) {
        last.finale = sc.finale;
        finale.style.visibility = sc.finale > 0.001 ? "visible" : "hidden";
        const g = smooth(sc.finale);
        const k = 1 - g;
        const sc0 = morph.s0 + (1 - morph.s0) * g;
        photo.style.opacity = smooth(map(sc.finale, 0.03, 0.4)).toFixed(3);
        photo.style.transform =
          k > 1e-4
            ? `translate3d(${(morph.dx * k).toFixed(1)}px,${(morph.dy * k).toFixed(1)}px,0) scale(${sc0.toFixed(4)})`
            : "";
      }
      if (Math.abs(sc.disc - last.disc) > 1e-4) {
        last.disc = sc.disc;
        // Daire hemen opaklaşır ve küçükten büyüyerek yerine oturur (fotoğrafın
        // üstünde yarı saydam mavi "hayalet" daire kalmasın).
        disc.style.opacity = smooth(map(sc.disc, 0, 0.12)).toFixed(3);
        disc.style.transform = sc.disc < 1 ? `scale(${(0.3 + 0.7 * easeOut(sc.disc)).toFixed(4)})` : "";
      }
      if (Math.abs(sc.slogan - last.slogan) > 1e-4) {
        last.slogan = sc.slogan;
        slogan.style.opacity = sc.slogan.toFixed(3);
        slogan.style.transform = `translateY(${((1 - sc.slogan) * 8).toFixed(1)}px) rotate(-6deg)`;
        caption.style.opacity = sc.slogan.toFixed(3);
      }
      if (Math.abs(sc.orbits - last.orbits) > 1e-4) {
        last.orbits = sc.orbits;
        const o = easeOut(sc.orbits);
        finArcs.forEach((el, i) => {
          const a = FIN_ARCS[i];
          const len = a.len * o;
          el.style.strokeDasharray = `${len.toFixed(2)} ${(360 - len).toFixed(2)}`;
        });
        const dotO = smooth(map(sc.orbits, 0.75, 1)).toFixed(3);
        for (const d of finDots) d.style.opacity = dotO;
        finDash.style.opacity = smooth(map(sc.orbits, 0.1, 0.7)).toFixed(3);
      }
    };

    /* ---------------- ana döngü ---------------- */
    // İsteğe bağlı rAF: scroll/resize (passive) döngüyü uyandırır; sahne
    // oturunca (lerp bitti, boşta dönüş/nabız/kiosk yok, GL durdu) döngü uyur.
    // Küre görünmezken (final/kapanış) ve sekme arka plandayken GL çalışmaz.
    let raf = 0;
    let prev = 0;
    let quiet = 0;
    let lastY = -1;
    const t0 = performance.now();
    let lastActivity = t0;

    const tick = (now: number) => {
      raf = 0;
      if (document.hidden) {
        prev = 0;
        return;
      }
      const rawDt = prev ? (now - prev) / 1000 : 1 / 60;
      const dt = Math.min(0.1, Math.max(0, rawDt));
      prev = now;

      let kioskOn = false;
      if (kiosk && now >= kPauseUntil) {
        kioskOn = true;
        if (kPhase === "run") {
          if (kResync) {
            kPos = window.scrollY;
            kResync = false;
          }
          kPos = Math.min(maxScroll, kPos + (Math.min(rawDt, 0.25) * 1000 * maxScroll) / KIOSK_MS);
          window.scrollTo(0, kPos);
          if (kPos >= maxScroll - 0.5) {
            kPhase = "hold";
            kHoldUntil = now + KIOSK_HOLD_MS;
          }
        } else if (now >= kHoldUntil) {
          window.scrollTo(0, 0);
          kPos = 0;
          kPhase = "run";
          snap = true;
          lastActivity = now;
        }
      }

      const y = window.scrollY;
      const prevY = ySmooth;
      if (reduced || snap) {
        ySmooth = y;
        snap = false;
      } else {
        // ~0.14 / kare (60 fps'e göre), kare hızından bağımsız
        ySmooth += (y - ySmooth) * (1 - Math.pow(0.86, dt * 60));
        if (Math.abs(y - ySmooth) < 0.5) ySmooth = y;
      }
      const sRaw = stageAt(ySmooth, vh, anchors);
      const s = reduced ? quantize(stageAt(y, vh, anchors)) : sRaw;
      const p = clamp01(ySmooth / sceneMax);

      // Kahramanda boşta dönüş: son etkinlikten IDLE_SPIN_MS sonra yavaşlayıp durur.
      let idling = false;
      if (!reduced && s <= 0.1) {
        const since = now - lastActivity;
        const k = since < IDLE_SPIN_MS ? 1 : 1 - smooth((since - IDLE_SPIN_MS) / IDLE_EASE_MS);
        if (k > 0) {
          idle += IDLE_SPEED * dt * k;
          idling = true;
        }
      }
      const intro = reduced ? 1 : smooth((now - t0) / INTRO_MS);

      scene = sceneAt(s, p, idle, reduced);
      applyDom(scene, s, reduced ? stageAt(y, vh, anchors) : sRaw, intro);

      // GL'i yalnızca kamera/sahne değişirken çalıştır (pil). Nabız tek başına
      // yalnızca 2D overlay'i yeniden çizer.
      const visible = scene.globe > 0.001;
      const changing = ySmooth !== prevY || idling || dirty > 0;
      if (dirty > 0) dirty--;
      const wantGL = visible && changing;
      const live = now - lastActivity < PULSE_LIVE_MS;
      const pulsing = visible && scene.pulse && live;
      // Nabız zaman aşımına uğradı: bir kez sabit halkayla çiz, sonra uyu.
      const pulseEnded = pulseLive && !live && visible && scene.pulse;
      pulseLive = live;
      quiet = wantGL ? 0 : quiet + 1;
      if (globe) {
        if (wantGL && !glRunning) {
          glRunning = true;
          globe.toggle(true);
        } else if (!wantGL && glRunning && quiet > 2) {
          glRunning = false;
          globe.toggle(false);
        }
        if (!glRunning && (pulsing || pulseEnded || (reduced && y !== lastY && visible))) {
          // Kamera sabit: GL'in son karesiyle aynı sahnede yalnızca 2D katman
          // (nabız; reduced-motion'da panel altına giren etiketlerin sönmesi).
          drawOverlay(drawn ?? scene, now);
        }
      } else if (wantGL || pulsing || quiet < 3) {
        // WebGL yok: overlay yine çizilir, küre CSS diskiyle temsil edilir.
        fallback.style.transform = `scale(${Math.min(scene.cam.scale, 3).toFixed(3)})`;
        drawOverlay(scene, now);
      }
      lastY = y;

      const settling = dirty > 0 || (!reduced && ySmooth !== y) || intro < 1;
      const busy = kioskOn || settling || wantGL || glRunning || pulsing || (!globe && quiet < 3);
      if (busy) raf = requestAnimationFrame(tick);
      else prev = 0;
    };
    const wake = () => {
      if (raf === 0) raf = requestAnimationFrame(tick);
    };
    wake();

    /* ---------------- olaylar ---------------- */
    // Not: GL döngüsü yalnızca tick içinden açılıp kapanır (çift rAF zinciri olmasın);
    // measure() dirty'yi ayarlar, tick gerekirse küreyi yeniden çizer.
    const onScroll = () => {
      lastActivity = performance.now();
      wake();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => {
      measure();
      wake();
    };
    window.addEventListener("resize", onResize, { passive: true });
    const onVisibility = () => {
      if (document.hidden) {
        if (raf > 0) cancelAnimationFrame(raf);
        raf = 0;
        prev = 0;
        if (globe && glRunning) {
          glRunning = false;
          globe.toggle(false);
        }
      } else {
        lastActivity = performance.now();
        dirty = Math.max(dirty, 2);
        wake();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onResize);
    ro?.observe(content);
    ro?.observe(wrap);
    let alive = true;
    document.fonts?.ready
      .then(() => {
        if (!alive) return;
        fontFamily = getComputedStyle(document.body).fontFamily || fontFamily;
        measure();
        wake();
      })
      .catch(() => {});

    return () => {
      alive = false;
      if (raf > 0) cancelAnimationFrame(raf);
      raf = -1; // geç gelen scroll/resize olayları döngüyü yeniden başlatmasın
      window.clearTimeout(kTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (kiosk) {
        window.removeEventListener("wheel", onUser);
        window.removeEventListener("touchstart", onUser);
        window.removeEventListener("pointerdown", onUser);
        window.removeEventListener("keydown", onUser);
      }
      ro?.disconnect();
      globe?.destroy();
    };
  }, [reduced]);

  const space = cover.slogan.indexOf(" ");
  const sloganTop = cover.slogan.slice(0, space);
  const sloganBottom = cover.slogan.slice(space + 1);
  const heroDotA = onCircle(50, 50, HERO_ARCS[0].r, HERO_ARCS[0].a0 + HERO_ARCS[0].len);
  const heroDotB = onCircle(50, 50, HERO_ARCS[1].r, HERO_ARCS[1].a0 + HERO_ARCS[1].len);
  const finDotA = onCircle(PH.cx, PH.cy, FIN_ARCS[0].r, FIN_ARCS[0].a0 + FIN_ARCS[0].len);
  const finDotB = onCircle(PH.cx, PH.cy, FIN_ARCS[1].r, FIN_ARCS[1].a0 + FIN_ARCS[1].len);

  return (
    <>
      {/* Küre katmanı: tam ekran, sabit, arkada */}
      <div
        ref={layerRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
        style={{ opacity: reduced ? 1 : 0 }}
      >
        {/* Yakın planda "lomboz" çerçevesi (Türkiye/Antalya aşamaları) */}
        <div
          ref={ringsRef}
          className="absolute aspect-square"
          style={{ width: GLOBE_SIZE, opacity: 0, visibility: "hidden" }}
        >
          <div className="absolute inset-[3%] rounded-full border border-brand-blue/30" />
          <div className="absolute inset-[-1.5%] rounded-full border border-dashed border-brand-green/45" />
        </div>
        <div
          ref={wrapRef}
          className="relative aspect-square shrink-0"
          style={{ width: GLOBE_SIZE, maskImage: MASK, WebkitMaskImage: MASK }}
        >
          <div
            ref={fallbackRef}
            className="absolute inset-[10%] hidden rounded-full"
            style={{ background: "radial-gradient(circle at 40% 35%, #f4f8fb, #c6d8ea 65%, #a9c3dc)" }}
          />
          <canvas ref={glRef} className="absolute inset-0 block h-full w-full" />
          <canvas ref={ovRef} className="absolute inset-0 block h-full w-full" />
        </div>
        {/* Kahraman: broşür kapağı motifleri — iki ince mavi yay, solda kesik yarım halka */}
        <div ref={motifsRef} className="absolute aspect-square" style={{ width: GLOBE_SIZE }}>
          <svg ref={motifBlueRef} className="absolute inset-0 h-full w-full overflow-visible" fill="none">
            {HERO_ARCS.map((a) => (
              <circle
                key={a.r}
                cx="50%"
                cy="50%"
                r={`${a.r}%`}
                pathLength={360}
                stroke={BRAND.blue}
                strokeOpacity={a.opacity}
                strokeWidth={1.5}
                style={arcDash(a.len, a.a0)}
              />
            ))}
            <circle cx={heroDotA.cx} cy={heroDotA.cy} r={4.5} fill={BRAND.orange} />
            <circle cx={heroDotB.cx} cy={heroDotB.cy} r={3.5} fill={BRAND.green} />
          </svg>
          <svg ref={motifDashRef} className="absolute inset-0 h-full w-full overflow-visible" fill="none">
            <defs>
              <clipPath id="dunya-motif-sol">
                <rect x="0" y="0" width="50%" height="100%" />
              </clipPath>
            </defs>
            <circle
              cx="50%"
              cy="50%"
              r="42%"
              stroke={BRAND.green}
              strokeWidth={1.5}
              strokeDasharray="4 6"
              strokeLinecap="round"
              clipPath="url(#dunya-motif-sol)"
            />
          </svg>
        </div>
      </div>

      {/* Final katmanı: broşür kapağı — küre fotoğrafı, slogan dairesi, yaylar */}
      <div
        ref={finaleRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] items-center justify-center overflow-hidden"
        style={{ display: "none", visibility: "hidden" }}
      >
        <div ref={finBoxRef} className="relative aspect-square shrink-0" style={{ width: FINAL_BOX }}>
          <svg className="absolute inset-0 h-full w-full overflow-visible" fill="none">
            <defs>
              <clipPath id="dunya-final-sol">
                <rect x="0" y="0" width={`${PH.cx}%`} height="100%" />
              </clipPath>
            </defs>
            <g ref={finDashRef} style={{ opacity: 0 }}>
              <circle
                cx={`${PH.cx}%`}
                cy={`${PH.cy}%`}
                r="41.5%"
                stroke={BRAND.green}
                strokeWidth={1.5}
                strokeDasharray="4 6"
                strokeLinecap="round"
                clipPath="url(#dunya-final-sol)"
              />
            </g>
            {FIN_ARCS.map((a) => (
              <circle
                key={a.r}
                data-fin-arc
                cx={`${PH.cx}%`}
                cy={`${PH.cy}%`}
                r={`${a.r}%`}
                pathLength={360}
                stroke={BRAND.blue}
                strokeOpacity={a.opacity}
                strokeWidth={1.5}
                style={arcDash(0, a.a0)}
              />
            ))}
            <circle data-fin-dot cx={finDotA.cx} cy={finDotA.cy} r={5} fill={BRAND.orange} style={{ opacity: 0 }} />
            <circle data-fin-dot cx={finDotB.cx} cy={finDotB.cy} r={4} fill={BRAND.green} style={{ opacity: 0 }} />
          </svg>

          <div
            ref={photoRef}
            className="absolute overflow-hidden rounded-full shadow-[0_0_0_4px_#fff,0_20px_44px_-18px_rgb(27_79_156/0.55)]"
            style={{
              left: `${PH.cx - PH.r}%`,
              top: `${PH.cy - PH.r}%`,
              width: `${PH.r * 2}%`,
              height: `${PH.r * 2}%`,
              background: "#163f35",
              opacity: 0,
              willChange: "transform, opacity",
            }}
          >
            {finaleReady ? (
              <Image
                src={photos.globeFoliage.src}
                alt=""
                fill
                loading="eager"
                sizes="(max-width: 540px) 92vw, 500px"
                className="object-cover"
                style={{ objectPosition: "50% 56%" }}
              />
            ) : null}
          </div>

          <div
            ref={discRef}
            className="absolute flex items-center justify-center rounded-full shadow-[0_18px_36px_-16px_rgb(27_79_156/0.6)]"
            style={{
              left: "2%",
              bottom: "4%",
              width: "52%",
              height: "52%",
              background: `linear-gradient(20deg, ${BRAND.navy} 8%, ${BRAND.blue} 96%)`,
              containerType: "inline-size",
              opacity: 0,
            }}
          >
            <p
              ref={sloganRef}
              className="text-center font-script text-[14cqw] leading-[1.08] text-white"
              style={{ opacity: 0, transform: "rotate(-6deg)" }}
            >
              {sloganTop}
              <br />
              {sloganBottom}
            </p>
          </div>

          <div ref={captionRef} className="absolute inset-x-0 top-[calc(100%+14px)] text-center" style={{ opacity: 0 }}>
            <p className="text-[15px] leading-tight font-black text-brand-blue">Antalya&apos;dan Dünyaya</p>
            <p className="mt-1 text-[12px] font-bold text-brand-green">
              {backCover.line1} · {cop31.dates}
            </p>
          </div>
        </div>
      </div>

      {/* Biz Kimiz sayacı (scroll'a bağlı) */}
      <div
        ref={hudRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-[calc(max(12px,env(safe-area-inset-top))+44px)] z-30 flex justify-center px-4"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <div className="flex items-start gap-4 rounded-2xl bg-white/90 px-4 py-2.5 shadow-[0_10px_28px_-14px_rgb(27_79_156/0.45)] ring-1 ring-brand-blue/5">
          <div className="min-w-[8.6rem]">
            <span ref={membersRef} className="block text-[24px] leading-none font-black text-brand-blue tabular-nums">
              0
            </span>
            <span className="mt-1 block text-[11px] font-bold text-brand-green">{stats[0].label}</span>
          </div>
          <span className="mt-1 h-8 w-px bg-brand-mist" />
          <div className="min-w-[2.2rem]">
            <span ref={ilRef} className="block text-[24px] leading-none font-black text-brand-blue tabular-nums">
              0
            </span>
            <span className="mt-1 block text-[11px] font-bold text-brand-green">{stats[1].label}</span>
          </div>
          <div className="min-w-[3.2rem]">
            <span ref={ilceRef} className="block text-[24px] leading-none font-black text-brand-blue tabular-nums">
              0
            </span>
            <span className="mt-1 block text-[11px] font-bold text-brand-green">{stats[2].label}</span>
          </div>
        </div>
      </div>

      <Link
        href="/"
        className="fixed top-[max(12px,env(safe-area-inset-top))] left-3 z-50 rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-bold text-brand-navy shadow-[0_4px_14px_-6px_rgb(27_79_156/0.4)] ring-1 ring-brand-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        ← Konseptler
      </Link>

      <div ref={contentRef} className="relative z-10">
        {children}
      </div>
    </>
  );
}
