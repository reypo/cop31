"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useRef, type ReactNode } from "react";
import { photos, type PhotoAsset } from "@/lib/photos";
import { clamp01, useScrollProgressCallback } from "@/lib/useScrollProgress";
import Sapling, { knotScale, type Cam, type Growth, type LabelBox, type SaplingHandle } from "./Sapling";
import { TREE } from "./tree";

/* ------------------------------------------------------------------ */
/* Kamera: her bölüm için ağaçta odaklanılacak dikdörtgen (ağaç birimi)   */
/* ------------------------------------------------------------------ */

type Rect = { x0: number; x1: number; y0: number; y1: number };
/**
 * y1min: kısa ekranda ağaç SOFT_S'nin altına küçülecekse odak alttan en çok
 * buraya kadar kırpılabilir (gövdenin altı/toprak kartın arkasına girer, taç büyük kalır).
 */
type Focus = Rect & { max?: number; y1min?: number };

const FOCUS: Record<string, Focus> = {
  tohum: { x0: 112, x1: 288, y0: 384, y1: 566, max: 2.2 },
  kok: { x0: 14, x1: 386, y0: 444, y1: 700 },
  govde: { x0: 70, x1: 330, y0: 56, y1: 520 },
  bogum: { x0: 64, x1: 346, y0: 306, y1: 480, max: 1.6 },
  bulusma: { x0: 4, x1: 396, y0: 4, y1: 446, y1min: 392 },
  solen: { x0: 4, x1: 396, y0: 4, y1: 446, y1min: 392 },
  yaprak: { x0: -2, x1: 402, y0: 0, y1: 448, y1min: 392 },
  iklim: { x0: -8, x1: 408, y0: -4, y1: 486, y1min: 392 },
  baskan: { x0: -34, x1: 434, y0: -10, y1: 500, y1min: 440 },
  orman: { x0: -44, x1: 444, y0: -14, y1: 540, y1min: 486 },
};
/** Bu ölçeğin altına inmemek için (yalnızca y1min verilmiş odaklarda) alt kırpılır. */
const SOFT_S = 0.8;

const STAGES = ["Tohum", "Kökler", "Gövde", "Dallar", "Yapraklar", "Orman"] as const;
const CHIP: Record<string, number> = {
  tohum: 0,
  kok: 1,
  govde: 2,
  bogum: 2,
  bulusma: 3,
  solen: 3,
  yaprak: 4,
  iklim: 4,
  baskan: 5,
  orman: 5,
};

function fit(f: Focus, r: Rect): Cam {
  const rh = r.y1 - r.y0;
  const sx = (r.x1 - r.x0) / (f.x1 - f.x0);
  const sy = rh / (f.y1 - f.y0);
  const syMin = f.y1min ? rh / (f.y1min - f.y0) : sy;
  const s = Math.min(sx, f.max ?? 1.6, Math.max(sy, Math.min(syMin, SOFT_S)));
  // Görünen pencere [y0, yv] bölgeye ortalanır; odak sığmıyorsa üstten hizalanır.
  const yv = Math.min(f.y1, f.y0 + rh / s);
  return {
    s,
    tx: (r.x0 + r.x1) / 2 - (s * (f.x0 + f.x1)) / 2,
    ty: (r.y0 + r.y1) / 2 - (s * (f.y0 + yv)) / 2,
  };
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function easeOutBack(t: number): number {
  const x = t - 1;
  return 1 + 2.4 * x * x * x + 1.4 * x * x;
}

/* ------------------------------------------------------------------ */
/* Dal uçlarındaki polaroidler                                           */
/* ------------------------------------------------------------------ */

type ScenePhoto = { photo: PhotoAsset; caption: string; pos: string; rot: number; tip: number };

/** Sol dallar: Gençlik Buluşmaları. Sağ dallar: Gençlik Şöleni. */
const SCENE_PHOTOS: readonly ScenePhoto[] = [
  { photo: photos.genclikBulusmasiSalon, caption: "Buluşma", pos: "55% 38%", rot: -4, tip: 0 },
  { photo: photos.sozGenclikteBursa, caption: "Bursa", pos: "50% 40%", rot: 3, tip: 2 },
  { photo: photos.sozGenclikteAnkara, caption: "Ankara", pos: "50% 42%", rot: -2, tip: 4 },
  { photo: photos.solenKocaeliStadyum, caption: "Kocaeli", pos: "40% 35%", rot: 4, tip: 1 },
  { photo: photos.solenKocaeliTribun, caption: "Şölen", pos: "50% 55%", rot: -3, tip: 3 },
  { photo: photos.solenKocaeliSelam, caption: "16 Mayıs", pos: "30% 50%", rot: 2, tip: 5 },
];

/** Polaroidin CSS genişliği (ölçek 1'de) ve pinin kart üstünden uzaklığı. */
const CARD_W = 92;
const PIN_Y = 6;
/**
 * Polaroid ağaçla birlikte ölçeklenir (dal uçlarının aralığı kartları ayırır);
 * en küçük hali 74 px genişlik, altyazı 12.5 px × 0.8 = 10 px.
 */
const K_MIN = 0.8;
const K_MAX = 1.2;
/** Kartla kart/etiket arasında en az boşluk ve kartın çıkabileceği en üst nokta (geri linki ve aşama göstergesinin altı), px. */
const GAP = 4;
const CEIL = 46;

/** Yerleşim sırası: en alttaki uçtan yukarı (alttaki kart yerinde kalır, üstteki gerekirse yukarı kayar). */
const ORDER = SCENE_PHOTOS.map((_, i) => i).sort(
  (a, b) => TREE.tips[SCENE_PHOTOS[b].tip].y - TREE.tips[SCENE_PHOTOS[a].tip].y,
);
/** Döndürülmüş kartın sınır kutusu payı için |sin(açı)|. */
const ROT_PAD = SCENE_PHOTOS.map((p) => Math.abs(Math.sin((p.rot * Math.PI) / 180)));

/* ------------------------------------------------------------------ */
/* Zamanlama sabitleri (ekran yüksekliği oranı)                          */
/* ------------------------------------------------------------------ */

/** Kart yerinde sönme mesafesi (mobil). */
const FADE = 0.16;

/* ------------------------------------------------------------------ */

type Win = readonly [number, number];
/** labels: bu karede boğum etiketleri görünür mü (kart etiketin üstünü kesiyorsa 0). */
type Key = { from: number; at: number; cam: Cam; labels: number[] };
type Fader = { el: HTMLElement; from: number; to: number; last: number };
type Flow = { el: HTMLElement; win: HTMLElement; at: number; ovf: number; last: number; state: string };
type PolRt = { last: string; shown: boolean };

type Layout = {
  range: number;
  keys: Key[];
  chips: { at: number; chip: number }[];
  growth: Record<keyof Growth, Win>;
  polA: Win;
  polB: Win;
  faders: Fader[];
  flows: Flow[];
  /** Polaroid yükseklikleri (ölçek 1'de) ve boğum etiketlerinin kutuları. */
  polH: number[];
  labels: LabelBox[];
};

/** y0: kutunun asıl çapa noktası (dal ucu ya da boğum), kaydırılmadan önce. */
type Box = { l: number; r: number; t: number; b: number; y0: number };

const win = (y: number, w: Win) => clamp01((y - w[0]) / (w[1] - w[0] || 1));

export default function FidanStory({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const saplingRef = useRef<SaplingHandle>(null);
  const polEls = useRef<(HTMLDivElement | null)[]>([]);
  const polRt = useRef<PolRt[]>(SCENE_PHOTOS.map(() => ({ last: "", shown: false })));
  const chipLabelRef = useRef<HTMLSpanElement>(null);
  const chipDotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const layoutRef = useRef<Layout | null>(null);
  const lastP = useRef(0);
  const lastChip = useRef(-1);

  const measure = (): Layout | null => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return null;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sticky = !desktop && !reduced;
    const V = window.innerHeight;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const secs = Array.from(wrap.querySelectorAll<HTMLElement>("[data-fidan-section]"));

    // 1) Mobilde kart penceresi 46svh ile sınırlı. Taşan içerik kısaltılmaz:
    //    bölüme taşan kadar ek kaydırma payı (--ovf) eklenir, içerik sayfa
    //    kaydırmasıyla aynı hızda pencerede akar.
    for (const sec of secs) {
      const w = sec.querySelector<HTMLElement>("[data-fidan-win]");
      const flow = w?.firstElementChild as HTMLElement | null;
      if (flow && !sticky) {
        flow.style.transform = "";
        w?.removeAttribute("data-ovf");
      }
      const ovf = sticky && w && flow ? Math.max(0, Math.round(flow.offsetHeight - w.clientHeight)) : 0;
      const v = `${ovf}px`;
      if (sec.style.getPropertyValue("--ovf") !== v) sec.style.setProperty("--ovf", v);
    }

    // 2) Geometri: her bölüm için e (kartın girmeye başladığı) ve a (kartın
    //    yerine oturduğu) scroll konumu.
    const wr = wrap.getBoundingClientRect();
    const info = secs.map((sec) => {
      const name = sec.dataset.fidanSection ?? "";
      const r = sec.getBoundingClientRect();
      const top = r.top - wr.top;
      const card = sec.querySelector<HTMLElement>("[data-fidan-card]");
      const ch = card?.offsetHeight ?? 0;
      const cs = card ? getComputedStyle(card) : null;
      let e: number;
      let a: number;
      let region: Rect;
      let cardTop = Number.POSITIVE_INFINITY;
      if (desktop) {
        a = top + r.height / 2 - V / 2;
        e = a - 0.6 * V;
        region = { x0: 24, x1: W - 24, y0: 66, y1: H - 34 };
      } else if (name === "tohum") {
        a = 0;
        e = -V;
        const heroBottom = (Number.parseFloat(cs?.top ?? "") || 58) + ch;
        region = { x0: 10, x1: W - 10, y0: heroBottom + 14, y1: H - 92 };
      } else {
        const b = Number.parseFloat(cs?.bottom ?? "") || 16;
        e = top - V;
        a = e + ch + b;
        region = { x0: 8, x1: W - 8, y0: 54, y1: V - b - ch - 12 };
        if (!reduced) cardTop = V - b - ch;
      }
      if (region.y1 - region.y0 < H * 0.26) region = { x0: 8, x1: W - 8, y0: 54, y1: H * 0.56 };
      const flowWin = sec.querySelector<HTMLElement>("[data-fidan-win]");
      const ovf = Number.parseFloat(sec.style.getPropertyValue("--ovf")) || 0;
      return { name, top, e, a, card, cardTop, region, flowWin, ovf, hint: sec.querySelector<HTMLElement>("[data-fidan-hint]") };
    });
    if (info.length === 0) return null;

    const range = Math.max(1, wrap.offsetHeight - V);
    const by = (n: string) => info.find((s) => s.name === n) ?? info[info.length - 1];
    const E = (n: string) => by(n).e;
    const A = (n: string) => by(n).a;

    // Hareket azaltılmışsa yalnızca son kare çizilir: ağaç, kahraman kartın
    // altındaki alana sığar (kartlar üstünden normal akışla geçer).
    if (reduced) {
      const hero = info[0];
      const heroBottom = desktop ? 66 : (hero.card?.getBoundingClientRect().bottom ?? 0) - wr.top + 14;
      const rr: Rect = desktop
        ? { x0: 24, x1: W - 24, y0: 66, y1: H - 34 }
        : { x0: 8, x1: W - 8, y0: Math.min(heroBottom, H * 0.5), y1: H - 14 };
      info[info.length - 1].region = rr;
    }

    // Boğum etiketi kartın üst kenarına değiyorsa o karede gizlenir (yarısı
    // kartın arkasında kesik bir etiket kalmasın; kısa ekranlarda olur).
    const labels = saplingRef.current?.labelBoxes() ?? [];
    const keys: Key[] = info.map((s, i) => {
      let from = s.e - (desktop ? 0 : FADE * V);
      if (i === 0) from = -Infinity;
      else if (s.name === "kok") from = 0.03 * V;
      const cam = fit(FOCUS[s.name] ?? FOCUS.orman, s.region);
      const ls = knotScale(cam.s);
      const vis = labels.map((lb) => (cam.ty + cam.s * (lb.y + ls * lb.b) > s.cardTop - 4 ? 0 : 1));
      return { from, at: s.a, cam, labels: vis };
    });

    const end = range - 2;
    const w = (a: number, b: number): Win => {
      const b2 = Math.min(b, end);
      return [Math.min(a, b2 - 1), b2];
    };
    const growth: Layout["growth"] = {
      roots: w(0.03 * V, A("kok") + 0.25 * V),
      trunk: w(E("govde") - 0.12 * V, A("govde") + 0.25 * V),
      knot1: w(lerp(E("bogum"), A("bogum"), 0.15), lerp(E("bogum"), A("bogum"), 0.8)),
      knot2: w(lerp(E("bogum"), A("bogum"), 0.6), A("bogum") + 0.22 * V),
      branches: w(E("bulusma") - 0.12 * V, A("bulusma") + 0.3 * V),
      leaves: w(E("yaprak") - 0.12 * V, A("iklim") + 0.25 * V),
      forest: w(E("baskan") - 0.1 * V, A("orman") - 0.04 * V),
      rings: w(E("orman") - 0.18 * V, A("orman") + 0.1 * V),
    };

    // 3) Mobilde kartlar yukarı kaymaz: bir sonraki kart girmeden yerinde söner.
    const faders: Fader[] = [];
    const flows: Flow[] = [];
    if (sticky) {
      info.forEach((s, i) => {
        const next = info[i + 1];
        if (s.name === "tohum") {
          if (s.card) faders.push({ el: s.card, from: 0.1 * V, to: Math.max(0.2 * V, (next?.e ?? V) - 0.04 * V), last: -1 });
          if (s.hint) faders.push({ el: s.hint, from: 0, to: 0.08 * V, last: -1 });
          return;
        }
        if (s.card && next) faders.push({ el: s.card, from: next.e - FADE * V, to: next.e, last: -1 });
        const flow = s.flowWin?.firstElementChild as HTMLElement | null;
        if (s.flowWin && flow && s.ovf > 0) {
          flows.push({ el: flow, win: s.flowWin, at: s.a, ovf: s.ovf, last: Number.NaN, state: "" });
        }
      });
    } else {
      for (const s of info) {
        for (const el of [s.card, s.hint]) {
          if (!el) continue;
          el.style.opacity = "";
          el.style.visibility = "";
        }
      }
    }

    return {
      range,
      keys,
      chips: info.map((s, i) => ({ at: i === 0 ? -Infinity : lerp(s.e, s.a, 0.5), chip: CHIP[s.name] ?? 0 })),
      growth,
      polA: w(lerp(E("bulusma"), A("bulusma"), 0.6), A("bulusma") + 0.35 * V),
      polB: w(E("solen") - 0.05 * V, A("solen") + 0.25 * V),
      faders,
      flows,
      polH: SCENE_PHOTOS.map((_, i) => polEls.current[i]?.offsetHeight || 90),
      labels,
    };
  };

  /**
   * Kartlar alttan yukarı yerleşir: bir kart altındaki karta ya da boğum
   * etiketine değecekse yukarı kayar (dal ucu kartın arkasında kalır). Kayma
   * kameranın sürekli bir fonksiyonu; henüz görünmeyen kartlar da hesaba
   * girer, böylece bir kart belirince diğerleri zıplamaz.
   */
  const placePolaroids = (L: Layout, cam: Cam, polA: number, polB: number) => {
    const k0 = Math.min(Math.max(cam.s, K_MIN), K_MAX);
    const ls = knotScale(cam.s);
    const placed: Box[] = L.labels.map((b) => ({
      l: cam.tx + cam.s * (b.x + ls * b.l),
      r: cam.tx + cam.s * (b.x + ls * b.r),
      t: cam.ty + cam.s * (b.y + ls * b.t),
      b: cam.ty + cam.s * (b.y + ls * b.b),
      y0: cam.ty + cam.s * b.y,
    }));
    for (const i of ORDER) {
      const tip = TREE.tips[SCENE_PHOTOS[i].tip];
      const cx = cam.tx + cam.s * tip.x;
      const cy0 = cam.ty + cam.s * tip.y;
      const h = L.polH[i];
      const pad = ROT_PAD[i] * (h / 2) * k0;
      const hw = (CARD_W / 2) * k0 + pad;
      const up = 2 * PIN_Y * k0;
      const dn = (h - PIN_Y) * k0 + pad;
      let cy = cy0;
      for (const o of placed) {
        // yalnızca yatayda çakışan ve çapası belirgin biçimde aşağıda olan engeller
        // (yan yana duran kartlar birbirini itmez)
        if (o.r <= cx - hw || o.l >= cx + hw || o.y0 - cy0 < 0.4 * (up + dn)) continue;
        const over = cy + dn + GAP - o.t;
        if (over > 0) cy -= over;
      }
      cy = Math.max(cy, Math.min(cy0, CEIL + up));
      placed.push({ l: cx - hw, r: cx + hw, t: cy - up, b: cy + dn, y0: cy0 });

      const el = polEls.current[i];
      const pr = polRt.current[i];
      if (!el || !pr) continue;
      const local = clamp01(((i < 3 ? polA : polB) - (i % 3) * 0.22) / 0.56);
      const show = local > 0;
      if (show !== pr.shown) {
        pr.shown = show;
        el.style.visibility = show ? "visible" : "hidden";
      }
      if (!show) continue;
      const k = Math.max(0, easeOutBack(local)) * k0;
      const str = `translate3d(${(cx - CARD_W / 2).toFixed(1)}px,${(cy - PIN_Y).toFixed(1)}px,0) scale(${k.toFixed(3)})`;
      if (str !== pr.last) {
        pr.last = str;
        el.style.transform = str;
      }
    }
  };

  const paint = (p: number) => {
    lastP.current = p;
    const L = layoutRef.current;
    if (!L) return;
    const y = p * L.range;
    const G = L.growth;
    const g: Growth = {
      roots: win(y, G.roots),
      trunk: win(y, G.trunk),
      knot1: win(y, G.knot1),
      knot2: win(y, G.knot2),
      branches: win(y, G.branches),
      leaves: win(y, G.leaves),
      forest: win(y, G.forest),
      rings: win(y, G.rings),
    };

    // Kamera: geçiş penceresinde bir önceki karenin kamerasından yumuşakça.
    const keys = L.keys;
    let cam = keys[0].cam;
    let labelA = keys[0].labels;
    for (let i = keys.length - 1; i >= 1; i--) {
      const k = keys[i];
      if (y >= k.from) {
        const a = keys[i - 1];
        const t = smooth(clamp01((y - k.from) / (k.at - k.from || 1)));
        cam = { s: lerp(a.cam.s, k.cam.s, t), tx: lerp(a.cam.tx, k.cam.tx, t), ty: lerp(a.cam.ty, k.cam.ty, t) };
        labelA = k.labels.map((v, j) => lerp(a.labels[j] ?? 1, v, t));
        break;
      }
    }
    saplingRef.current?.render(g, cam, labelA);

    // Kart sönmeleri (yalnızca değer değişince yaz).
    for (const f of L.faders) {
      const o = Math.round((1 - clamp01((y - f.from) / (f.to - f.from || 1))) * 100) / 100;
      if (o === f.last) continue;
      f.last = o;
      f.el.style.opacity = o === 1 ? "" : String(o);
      f.el.style.visibility = o === 0 ? "hidden" : "";
    }

    // Uzun kartlar: içerik pencerede sayfa kaydırmasıyla aynı hızda akar.
    for (const f of L.flows) {
      const t = Math.round(Math.min(Math.max(y - f.at, 0), f.ovf));
      if (t !== f.last) {
        f.last = t;
        f.el.style.transform = t === 0 ? "" : `translate3d(0,${-t}px,0)`;
      }
      const state = t <= 0 ? "top" : t >= f.ovf ? "end" : "mid";
      if (state !== f.state) {
        f.state = state;
        f.win.dataset.ovf = state;
      }
    }

    // Polaroidler ekran uzayında: pin dal ucunda, boyut kamerayla (alt sınırlı).
    placePolaroids(L, cam, win(y, L.polA), win(y, L.polB));

    // Aşama göstergesi
    let chip = 0;
    for (const c of L.chips) if (y >= c.at) chip = c.chip;
    if (chip !== lastChip.current) {
      lastChip.current = chip;
      if (chipLabelRef.current) chipLabelRef.current.textContent = STAGES[chip];
      chipDotRefs.current.forEach((d, i) => {
        if (d) d.dataset.on = i <= chip ? "true" : "false";
      });
    }
  };

  useScrollProgressCallback(wrapRef, paint);

  const relayout = useEffectEvent(() => {
    layoutRef.current = measure();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    paint(reduced ? 1 : lastP.current);
    if (sceneRef.current) sceneRef.current.style.opacity = "1";
  });

  useEffect(() => {
    relayout();
    const wrap = wrapRef.current;
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => relayout());
    if (wrap) ro?.observe(wrap);
    const onResize = () => relayout();
    window.addEventListener("resize", onResize, { passive: true });
    // Hareket tercihi sayfa açıkken değişirse yerleşimi yeniden kur.
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    motion.addEventListener("change", onResize);
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) relayout();
    });
    return () => {
      alive = false;
      ro?.disconnect();
      window.removeEventListener("resize", onResize);
      motion.removeEventListener("change", onResize);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto w-full md:grid md:max-w-[1100px] md:grid-cols-2 md:gap-x-10 md:px-6 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:gap-x-14"
    >
      <div
        ref={stageRef}
        aria-hidden="true"
        className="fidan-stage sticky top-0 z-0 overflow-hidden md:col-start-1 md:row-start-1 md:self-start"
      >
        <div
          ref={sceneRef}
          className="absolute inset-0 opacity-0 transition-opacity duration-500 motion-reduce:transition-none"
        >
          <Sapling ref={saplingRef} />
          {/* masaüstünde sütun kenarlarında toprak/orman yumuşakça sönsün (maske yerine beyaz geçiş) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-12 bg-linear-to-r from-white to-white/0 md:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-linear-to-l from-white to-white/0 md:block" />
          {SCENE_PHOTOS.map((sp, i) => (
            <div
              key={sp.photo.src}
              ref={(el) => {
                polEls.current[i] = el;
              }}
              className="absolute top-0 left-0 will-change-transform"
              style={{
                width: CARD_W,
                transform: "scale(0)",
                transformOrigin: `50% ${PIN_Y}px`,
                visibility: "hidden",
              }}
            >
              <div
                className="relative rounded-[10px] border-2 border-brand-green bg-white p-[4px] pb-[3px] shadow-[0_6px_14px_-6px_rgb(27_79_156/0.45)]"
                style={{ transform: `rotate(${sp.rot}deg)` }}
              >
                <span className="absolute -top-[6px] left-1/2 z-10 -ml-[6px] size-[12px] rounded-full bg-brand-orange shadow-[inset_0_-1.5px_0_rgb(0_0_0/0.15),0_1px_2px_rgb(0_0_0/0.3)]" />
                <div className="relative aspect-[4/3] overflow-hidden rounded-[6px] bg-brand-mist">
                  <Image
                    src={sp.photo.src}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                    style={{ objectPosition: sp.pos }}
                  />
                </div>
                <p className="truncate pt-[3px] text-center text-[12.5px] leading-[1.2] font-bold text-brand-navy">
                  {sp.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* aşama göstergesi */}
        <div className="pointer-events-none absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 flex items-center gap-2 rounded-full bg-white/90 py-1.5 pr-2.5 pl-3 shadow-[0_2px_10px_-4px_rgb(27_79_156/0.35)] md:right-4">
          <span ref={chipLabelRef} className="text-[11px] leading-none font-bold text-brand-teal">
            {STAGES[0]}
          </span>
          <span className="flex items-center gap-[3px]">
            {STAGES.map((s, i) => (
              <span
                key={s}
                ref={(el) => {
                  chipDotRefs.current[i] = el;
                }}
                data-on={i === 0 ? "true" : "false"}
                className="h-[6px] w-[6px] rounded-[0_60%_0_60%] bg-brand-mist data-[on=true]:bg-brand-green"
              />
            ))}
          </span>
        </div>
      </div>

      <div className="fidan-overlay relative z-10 md:col-start-2 md:row-start-1">{children}</div>
    </div>
  );
}
