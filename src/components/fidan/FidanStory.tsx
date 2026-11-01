"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useRef, type ReactNode } from "react";
import { photos, type PhotoAsset } from "@/lib/photos";
import { clamp01 } from "@/lib/useScrollProgress";
import Sapling, { knotScale, type Cam, type Growth, type LabelBox, type SaplingHandle } from "./Sapling";
import { createStepper, type Stepper, type Stop } from "./stepper";
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

/** Hikâye bölümleri, sırayla (StorySections'taki data-fidan-section adları). */
const FOCUS: Record<string, Focus> = {
  tohum: { x0: 112, x1: 288, y0: 384, y1: 566, max: 2.2 },
  kok: { x0: 14, x1: 386, y0: 444, y1: 700 },
  govde: { x0: 44, x1: 356, y0: 66, y1: 500, y1min: 470 },
  dallar: { x0: 4, x1: 396, y0: 4, y1: 446, y1min: 392 },
  yaprak: { x0: -8, x1: 408, y0: -4, y1: 486, y1min: 392 },
  orman: { x0: -44, x1: 444, y0: -14, y1: 540, y1min: 486 },
};
/** Bu ölçeğin altına inmemek için (yalnızca y1min verilmiş odaklarda) alt kırpılır. */
const SOFT_S = 0.8;

/** Üstteki aşama göstergesi: bölüm index'i (kapanışta "Orman"da kalır). */
const STAGES = ["Tohum", "Kökler", "Gövde", "Dallar", "Yapraklar", "Orman"] as const;

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
/* Sahne eşlemesi: u = bölüm index'i + geçiş ilerlemesi                  */
/* ------------------------------------------------------------------ */
/*
 * u tam sayıyken (bölümde durulmuş) sahne o bölümün tam halidir; her büyüme
 * vuruşu iki bölüm arasındaki geçişte (u: i → i+1) oynar ve i+1'e varmadan
 * biter. Pencereler i+0.02…i+0.98 içinde: bölümde durunca yarım hareket kalmaz.
 */
type Win = readonly [number, number];
const GROWTH: Record<keyof Growth, Win> = {
  roots: [0.06, 0.94], // Tohum → Kökler
  trunk: [1.06, 1.8], // Kökler → Gövde
  knot1: [1.46, 1.8],
  knot2: [1.6, 1.96],
  branches: [2.04, 2.78], // Gövde → Dallar
  leaves: [3.04, 3.95], // Dallar → Yapraklar
  forest: [4.04, 4.86], // Yapraklar → Orman
  rings: [4.3, 4.97],
};
/** Sol dal uçlarındaki buluşma ve sağdaki şölen polaroidleri (her biri kendi içinde 3 kart sırayla). */
const POL_A: Win = [2.3, 2.8];
const POL_B: Win = [2.48, 2.97];
/** Kamera geçişi bu aralıkta (geçişin başı/sonu zaten easeInOut kaydırmayla yavaş). */
const CAM: Win = [0.03, 0.97];

/** Bölümden bölüme geçiş süresi (ms), easeInOutCubic. */
const STEP_MS = 1000;

/** Mobilde ayrılan kart: geçişin ilk %24'ünde söner, bu sırada neredeyse yerinde kalır. */
const CARD_OUT = 0.24;
const CARD_HOLD = 0.85;
const HERO_OUT = 0.3;
const HERO_HOLD = 0.45;
/** Kart penceresine bu kadar (viewport oranı) taşan içerik için pencere büyür, bölüm içi kaydırma açılmaz. */
const OVF_SLACK = 0.06;

const win = (u: number, w: Win) => clamp01((u - w[0]) / (w[1] - w[0] || 1));

/** Kaydırma konumu → u. Bölüm içi serbest aralıkta (top…end) u sabit. */
function storyU(y: number, S: readonly Stop[]): number {
  for (let i = 0; i < S.length; i++) {
    if (y <= S[i].end) {
      if (i === 0 || y >= S[i].top) return i;
      const a = S[i - 1].end;
      return i - 1 + clamp01((y - a) / (S[i].top - a || 1));
    }
  }
  return Math.max(0, S.length - 1);
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

/** labels: bu bölümde boğum etiketleri görünür mü (kart etiketin üstünü kesiyorsa 0). */
type Key = { cam: Cam; labels: number[] };
/**
 * Mobilde bir bölümün kartı (belge koordinatları): top/end bölümün dinlenme
 * aralığı, out sönme mesafesi (0: sönmez), hold ayrılırken kaydırmaya karşı
 * tutma oranı (1: tam yerinde).
 */
type CardRt = {
  el: HTMLElement;
  flow: HTMLElement | null;
  win: HTMLElement | null;
  top: number;
  end: number;
  ovf: number;
  out: number;
  hold: number;
  lastT: string;
  lastO: number;
  lastF: number;
  state: string;
};
type PolRt = { last: string; shown: boolean };

type Layout = {
  /** Tüm bölümler (hikâye + kapanış), adımlayıcının durakları. */
  stops: Stop[];
  /** Hikâye bölümlerinin kameraları. */
  keys: Key[];
  cards: CardRt[];
  hint: { el: HTMLElement; len: number; last: number } | null;
  reduced: boolean;
  /** Polaroid yükseklikleri (ölçek 1'de) ve boğum etiketlerinin kutuları. */
  polH: number[];
  labels: LabelBox[];
};

/** y0: kutunun asıl çapa noktası (dal ucu ya da boğum), kaydırılmadan önce. */
type Box = { l: number; r: number; t: number; b: number; y0: number };

const REDUCE = "(prefers-reduced-motion: reduce)";

export default function FidanStory({ children, after }: { children: ReactNode; after?: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const saplingRef = useRef<SaplingHandle>(null);
  const polEls = useRef<(HTMLDivElement | null)[]>([]);
  const polRt = useRef<PolRt[]>(SCENE_PHOTOS.map(() => ({ last: "", shown: false })));
  const chipLabelRef = useRef<HTMLSpanElement>(null);
  const chipDotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const layoutRef = useRef<Layout | null>(null);
  const lastY = useRef(Number.NaN);
  const lastChip = useRef(-1);

  const measure = (): Layout | null => {
    const root = rootRef.current;
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!root || !wrap || !stage) return null;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const reduced = window.matchMedia(REDUCE).matches;
    const mobile = !desktop && !reduced;
    const V = window.innerHeight;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const secs = Array.from(wrap.querySelectorAll<HTMLElement>("[data-fidan-section]"));
    const snaps = Array.from(root.querySelectorAll<HTMLElement>("[data-fidan-snap]"));

    // 1) Mobilde kart penceresi 50svh ile sınırlı. Taşan içerik kısaltılmaz:
    //    bölüme taşan kadar ek yükseklik (--ovf) verilir; bölümde dururken
    //    içerik bu aralıkta (bölüm içi kaydırma) pencerede akar. Taşma çok
    //    küçükse (≤ OVF_SLACK) kart sınırı aşıp büyür: birkaç piksellik bölüm
    //    içi kaydırma "boşa giden" bir parmak hareketi olurdu.
    for (const sec of secs) {
      const card = sec.querySelector<HTMLElement>("[data-fidan-card]");
      const w = sec.querySelector<HTMLElement>("[data-fidan-win]");
      const flow = w?.firstElementChild as HTMLElement | null;
      if (card?.style.maxHeight) card.style.maxHeight = "";
      if (!mobile) {
        if (card) {
          card.style.transform = "";
          card.style.opacity = "";
          card.style.visibility = "";
        }
        if (flow) flow.style.transform = "";
        w?.removeAttribute("data-ovf");
      }
      let ovf = mobile && w && flow ? Math.max(0, Math.round(flow.offsetHeight - w.clientHeight)) : 0;
      if (ovf > 0 && ovf <= OVF_SLACK * V && card) {
        card.style.maxHeight = "none";
        ovf = 0;
      }
      const v = `${ovf}px`;
      if (sec.style.getPropertyValue("--ovf") !== v) sec.style.setProperty("--ovf", v);
    }
    const hintEl = secs[0]?.querySelector<HTMLElement>("[data-fidan-hint]") ?? null;
    if (!mobile && hintEl) {
      hintEl.style.opacity = "";
      hintEl.style.visibility = "";
    }

    // 2) Duraklar: her bölümün üstü ve bölüm içinde durulabilecek son konum.
    const sy = window.scrollY;
    const stops: Stop[] = snaps.map((el) => {
      const top = Math.round(el.getBoundingClientRect().top + sy);
      return { top, end: top + Math.max(0, Math.round(el.offsetHeight - V)) };
    });

    // 3) Her hikâye bölümü için kamera bölgesi: kart dururken onun üstündeki alan.
    const info = secs.map((sec) => {
      const name = sec.dataset.fidanSection ?? "";
      const card = sec.querySelector<HTMLElement>("[data-fidan-card]");
      const ovf = Number.parseFloat(sec.style.getPropertyValue("--ovf")) || 0;
      let region: Rect;
      let cardTop = Number.POSITIVE_INFINITY;
      if (desktop) {
        region = { x0: 24, x1: W - 24, y0: 66, y1: H - 34 };
      } else if (name === "tohum") {
        const bottom = card ? card.offsetTop + card.offsetHeight : H * 0.4;
        region = { x0: 10, x1: W - 10, y0: bottom + 14, y1: H - 92 };
      } else {
        // dinlenmede kart (ovf kadar yukarı kaydırılmış) ekranın altında
        const top = card ? card.offsetTop - ovf : H * 0.56;
        region = { x0: 8, x1: W - 8, y0: 54, y1: top - 12 };
        if (!reduced) cardTop = top;
      }
      if (region.y1 - region.y0 < H * 0.26) region = { x0: 8, x1: W - 8, y0: 54, y1: H * 0.56 };
      return { name, sec, card, ovf, region, cardTop, stop: stops[snaps.indexOf(sec)] };
    });
    if (info.length === 0) return null;

    // Hareket azaltılmışsa yalnızca son kare çizilir: ağaç, kahraman kartın
    // altındaki alana sığar (kartlar üstünden normal akışla geçer).
    if (reduced) {
      const hero = info[0];
      const heroBottom = desktop ? 66 : hero.card ? hero.card.offsetTop + hero.card.offsetHeight + 14 : 0;
      info[info.length - 1].region = desktop
        ? { x0: 24, x1: W - 24, y0: 66, y1: H - 34 }
        : { x0: 8, x1: W - 8, y0: Math.min(heroBottom, H * 0.5), y1: H - 14 };
    }

    // Boğum etiketi kartın üst kenarına değiyorsa o bölümde gizlenir (yarısı
    // kartın arkasında kesik bir etiket kalmasın; kısa ekranlarda olur).
    const labels = saplingRef.current?.labelBoxes() ?? [];
    const keys: Key[] = info.map((s) => {
      const cam = fit(FOCUS[s.name] ?? FOCUS.orman, s.region);
      const ls = knotScale(cam.s);
      const vis = labels.map((lb) => (cam.ty + cam.s * (lb.y + ls * lb.b) > s.cardTop - 4 ? 0 : 1));
      return { cam, labels: vis };
    });

    // 4) Mobil kartlar: dinlenme aralığında ekranın altında; ayrılırken yerinde söner.
    const cards: CardRt[] = [];
    if (mobile) {
      info.forEach((s, i) => {
        if (!s.card || !s.stop) return;
        const next = stops[stops.indexOf(s.stop) + 1];
        const D = next ? next.top - s.stop.end : V;
        const hero = i === 0;
        // Son hikâye bölümü (orman + slogan) sahneyle birlikte yukarı kayar.
        const last = i === info.length - 1;
        const w = s.sec.querySelector<HTMLElement>("[data-fidan-win]");
        cards.push({
          el: s.card,
          flow: (w?.firstElementChild as HTMLElement | null) ?? null,
          win: w,
          top: s.stop.top,
          end: s.stop.end,
          ovf: s.ovf,
          out: last ? 0 : D * (hero ? HERO_OUT : CARD_OUT),
          hold: last ? 0 : hero ? HERO_HOLD : CARD_HOLD,
          lastT: "?",
          lastO: -1,
          lastF: Number.NaN,
          state: "",
        });
      });
    }
    const D0 = stops[1] ? stops[1].top - stops[0].end : V;

    return {
      stops,
      keys,
      cards,
      hint: mobile && hintEl ? { el: hintEl, len: 0.1 * D0, last: -1 } : null,
      reduced,
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

  /** Mobil kart konumu/sönmesi ve uzun kart içeriğinin akışı (yalnızca değişince yazılır). */
  const placeCards = (L: Layout, y: number) => {
    for (const c of L.cards) {
      let k: number;
      let o = 1;
      if (y < c.top) k = -c.ovf;
      else if (y <= c.end) k = -(c.end - y);
      else {
        const d = y - c.end;
        k = d * c.hold;
        if (c.out > 0) o = 1 - smooth(clamp01(d / c.out));
      }
      o = Math.round(o * 100) / 100;
      const ks = Math.abs(k) < 0.05 ? "" : `translate3d(0,${k.toFixed(1)}px,0)`;
      if (ks !== c.lastT) {
        c.lastT = ks;
        c.el.style.transform = ks;
      }
      if (o !== c.lastO) {
        c.lastO = o;
        c.el.style.opacity = o === 1 ? "" : String(o);
        c.el.style.visibility = o === 0 ? "hidden" : "";
      }
      if (c.flow && c.win && c.ovf > 0) {
        const t = Math.round(Math.min(Math.max(y - c.top, 0), c.ovf));
        if (t !== c.lastF) {
          c.lastF = t;
          c.flow.style.transform = t === 0 ? "" : `translate3d(0,${-t}px,0)`;
        }
        const state = t <= 0 ? "top" : t >= c.ovf ? "end" : "mid";
        if (state !== c.state) {
          c.state = state;
          c.win.dataset.ovf = state;
        }
      }
    }
    const h = L.hint;
    if (h) {
      const o = Math.round((1 - clamp01(y / (h.len || 1))) * 100) / 100;
      if (o !== h.last) {
        h.last = o;
        h.el.style.opacity = o === 1 ? "" : String(o);
        h.el.style.visibility = o === 0 ? "hidden" : "";
      }
    }
  };

  const paint = (y: number) => {
    lastY.current = y;
    const L = layoutRef.current;
    if (!L) return;
    const n = L.keys.length;
    // Hareket azaltılmışsa sahne son karede; aşama göstergesi yine bölümü izler.
    const uy = Math.min(storyU(y, L.stops), n - 1);
    const u = L.reduced ? n - 1 : uy;
    const g: Growth = {
      roots: win(u, GROWTH.roots),
      trunk: win(u, GROWTH.trunk),
      knot1: win(u, GROWTH.knot1),
      knot2: win(u, GROWTH.knot2),
      branches: win(u, GROWTH.branches),
      leaves: win(u, GROWTH.leaves),
      forest: win(u, GROWTH.forest),
      rings: win(u, GROWTH.rings),
    };

    // Kamera: iki bölümün kamerası arasında, geçiş ilerlemesiyle.
    const i0 = Math.max(0, Math.min(Math.floor(u), n - 2));
    const a = L.keys[i0];
    const b = L.keys[Math.min(i0 + 1, n - 1)];
    const t = win(u - i0, CAM);
    const cam: Cam = { s: lerp(a.cam.s, b.cam.s, t), tx: lerp(a.cam.tx, b.cam.tx, t), ty: lerp(a.cam.ty, b.cam.ty, t) };
    const labelA = b.labels.map((v, j) => lerp(a.labels[j] ?? 1, v, t));
    saplingRef.current?.render(g, cam, labelA);

    placeCards(L, y);

    // Polaroidler ekran uzayında: pin dal ucunda, boyut kamerayla (alt sınırlı).
    placePolaroids(L, cam, win(u, POL_A), win(u, POL_B));

    // Aşama göstergesi = bölüm index'i (geçişin ortasında değişir).
    const chip = Math.min(STAGES.length - 1, Math.round(uy));
    if (chip !== lastChip.current) {
      lastChip.current = chip;
      if (chipLabelRef.current) chipLabelRef.current.textContent = STAGES[chip];
      chipDotRefs.current.forEach((d, i) => {
        if (d) d.dataset.on = i <= chip ? "true" : "false";
      });
    }
  };

  const frame = useEffectEvent((y: number) => paint(y));
  const remeasure = useEffectEvent(() => {
    layoutRef.current = measure();
  });

  useEffect(() => {
    const html = document.documentElement;
    const motion = window.matchMedia(REDUCE);
    const vv = window.visualViewport;
    const zoomed = () => (vv?.scale ?? 1) > 1.01;
    let stepper: Stepper | null = null;
    let raf = 0;

    const syncMode = () => {
      const reduced = motion.matches;
      if (!reduced && !stepper) {
        stepper = createStepper({
          stops: () => layoutRef.current?.stops ?? [],
          apply: (y) => {
            window.scrollTo(0, y);
            frame(y);
          },
          duration: STEP_MS,
          enabled: () => !zoomed(),
        });
      } else if (reduced && stepper) {
        stepper.destroy();
        stepper = null;
      }
      // Adımlama modunda native kaydırma kapalı. Hareket azaltılmışsa snap de
      // yok: proximity, tekerlek tıklarını bölüm başına geri çekiyordu (page.tsx).
      html.classList.toggle("fidan-step", !reduced && !zoomed());
    };

    const relayout = () => {
      const at = stepper?.where() ?? null;
      remeasure();
      if (stepper) stepper.restore(at);
      else frame(window.scrollY);
      if (sceneRef.current) sceneRef.current.style.opacity = "1";
    };

    // Native kaydırma (hareket azaltılmış, kaydırma çubuğu, odak): rAF'te çiz.
    // Adımlayıcı sürerken kendi karesinde çizdiği için atlanır.
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (stepper?.busy()) return;
        const y = window.scrollY;
        if (Math.abs(y - lastY.current) >= 0.5) frame(y);
      });
    };

    syncMode();
    relayout();
    // Dal ucu polaroidleri ilk kez Gövde → Dallar geçişinin ortasında görünür:
    // görüntüleri önceden çöz, o karede çözme maliyeti olmasın.
    for (const el of polEls.current) el?.querySelector("img")?.decode().catch(() => {});
    const root = rootRef.current;
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => relayout());
    if (root) ro?.observe(root);
    const onResize = () => relayout();
    const onMotion = () => {
      syncMode();
      relayout();
    };
    const onZoom = () => html.classList.toggle("fidan-step", !motion.matches && !zoomed());
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    motion.addEventListener("change", onMotion);
    vv?.addEventListener("resize", onZoom, { passive: true });
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) relayout();
    });
    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      stepper?.destroy();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      motion.removeEventListener("change", onMotion);
      vv?.removeEventListener("resize", onZoom);
      html.classList.remove("fidan-step");
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
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

          {/* aşama göstergesi: bölüm index'i (tıklanmaz) */}
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
      {after}
    </div>
  );
}
