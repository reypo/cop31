"use client";

import createGlobe, { type Marker } from "cobe";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { backCover, cop31, cover, facts, stats } from "@/lib/content";
import { photos } from "@/lib/photos";
import { stant } from "@/lib/stant";
import {
  EMANET_RENK,
  HALKA,
  ISARET_CAP,
  NABIZ_MS,
  SERIF,
  ZEMIN,
  ayristir,
  dilimBoyu,
  sigdir,
  dilimler,
  etiketYeri,
  isaretDurumu,
  isaretler,
  kocaeliHalkaFazi,
  nabiz,
  sutunGorunur,
  yonleriSec,
  zeminEtiketleri,
  zeminEtiketYeri,
  zeminSutunlari,
  type Alan,
  type Daire,
  type EtiketYonu,
  type IsaretDurumu,
} from "./emanet-sahne";
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
import { createStepper, type Durak, type Stepper } from "./adim";
import {
  BOLUM_SAYISI,
  BRAND,
  EMANET_I,
  EMANET_II,
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

type Rect = { l: number; t: number; r: number; b: number };
/** Ölçülmüş panel (sayfa koordinatı) + bölümü + o anki opaklığı. */
type PanelInfo = Rect & { el: HTMLElement; sec: number; o: number };
/** Küre katmanının pozu: ekran merkezine göre kayma (px) ve ölçek. */
type Pose = { x: number; y: number; k: number };
type Side = Etkinlik["side"] | "right";

/** Etiket, yarı saydam panele bu kadar (px) yaklaşınca sönmeye başlar. */
const LABEL_FADE_PX = 12;
/**
 * Bölüm içeriği ekranın altından en çok bu kadar (px) taşarsa bölüm sığmış
 * sayılır (panelin 20 px'lik iç dolgusunun yarısı: metin/kart kesilmez).
 */
const FIT_TOLERANCE_PX = 10;

const MASK = "radial-gradient(closest-side, #000 91%, transparent 100%)";
const GLOBE_SIZE = "calc(min(100vw, 100vh) * 1.1)";
/** Final kapak kutusu: mobilde ekran genişliği (sağ kenar göstergesine pay bırakarak). */
const FINAL_BOX = "min(calc(100vw - 28px), 64svh, 540px)";

/** Kiosk (?auto=1): her bölümde bekleme, bölüm geçişi ve uzun bölümde okuma hızı. */
const KIOSK_DWELL_MS = 6_000;
const KIOSK_STEP_MS = 1_200;
const KIOSK_READ_PX_S = 70;
const KIOSK_READ_HOLD_MS = 2_000;
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
/** Sağ kenar bölüm göstergesi: nokta çapı + aralık (px). */
const DOT_STEP = 15;
/** Antalya nabzı: 2 halka, 1,6 sn periyot. */
const PULSE_MS = 1600;
/**
 * Dinlenmede (t = 8) nabız DOM halkalarında, Web Animations ile döner (compositor;
 * rAF uyur). Geçişte (7 → 8) ve WebGL yokken 2D katmanda çizilir.
 */
/** Nabız, son kaydırmadan bu kadar sonra sabit halkaya döner ve döngü uyur (pil; yalnızca 2D yolu). */
const PULSE_LIVE_MS = 6_000;
/**
 * Spot döngüsü (brief-dunya-2 §2): `data-spot-count` taşıyan bölüm dinlenmeye
 * geçtikten SPOT_DELAY_MS sonra `data-spot="1"`, her spot süresinde 1 → n → 1.
 * Süre okumaya göre: Emanet açıklamaları ~14 kelime (390 px'te 3–4 satır; yabancı
 * ziyaretçi ve aynı anda küreye bakan göz için ≈4 sn) → 4.500 ms; Stantta bölge
 * açıklamaları kısa → 3.500 ms.
 */
const SPOT_DELAY_MS = 600;
const SPOT_MS_EMANET = 4_500;
const SPOT_MS_STANT = 3_500;
/**
 * Kiosk: spotlu bölümde 3 spot görülür (bekleme = gecikme + 3 spot − pay); döngünün
 * başlangıcı her kiosk turunda +3 kayar, böylece iki turda bütün alanlar vurgulanır.
 */
const KIOSK_SPOT_SAYI = 3;
const kioskSpotDwell = (spotMs: number) => SPOT_DELAY_MS + KIOSK_SPOT_SAYI * spotMs - 200;
/** Spot değişince etiket/işaret vurgusunun geçişi (ms). */
const SPOT_BLEND_MS = 300;
/**
 * Spotta olmayan küre etiketlerinin opaklığı: 0 — spotta yalnızca tek etiket görünür
 * (soluk etiketler soluk işaretlerin üstüne binip küreyi kirletiyordu). İşaretler 1'de kalır.
 */
const SPOT_DIM = 0;

/**
 * prefers-reduced-motion. Sunucuda (ve hidrasyon commit'inde) null: ana efekt
 * istemci değeri gelene dek kurulmaz; böylece reduced-motion açık kullanıcıda küre
 * önce hareketli, hemen ardından reduced olarak iki kez kurulmaz.
 */
const RM_QUERY = "(prefers-reduced-motion: reduce)";
const rmAbone = (cb: () => void) => {
  const mq = window.matchMedia(RM_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const rmIstemci = () => window.matchMedia(RM_QUERY).matches;
const rmSunucu = () => null;
function useReducedMotion(): boolean | null {
  return useSyncExternalStore(rmAbone, rmIstemci, rmSunucu);
}
/** Etiketler için porthol dairesi (tuval boyutunun oranı; maske %45,5'te opak). */
const LABEL_CIRCLE = 0.44;

/**
 * Küre pozu küçükken (kısa ekran: k < 0,8) etiket ve işaretler de en çok %82'ye
 * küçülür; yoksa ekranda sabit boyda kalıp küçük portholde üst üste binerler.
 * 390×844 (k ≈ 0,89) ve masaüstünde 1.
 */
const smallPose = (k: number) => Math.min(1, Math.max(0.82, k / 0.8));

/** "#rrggbb" → [r, g, b] (0–255). */
const rgb255 = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const BLUE_255 = rgb255(BRAND.blue);
const NAVY_255 = rgb255(BRAND.navy);
const KUM_255 = rgb255(EMANET_RENK.kum);
/** İki renk arası (canvas fillStyle). */
function mixRgb(a: readonly number[], b: readonly number[], t: number): string {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

/** "12.000 Yıllık Emanet" sayacının hedefi (yıl). */
const EMANET_YIL = 12_000;

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
 * Scroll konumunu sahne koordinatına çevirir (bkz. sahne.ts başı): k. bölümün
 * dinlenme bölgesinde t = k; k. bölgenin sonundan k+1'in başına dek t ∈ (k, k+1).
 */
function tAt(y: number, stops: readonly Durak[]): number {
  const n = stops.length;
  if (n === 0) return 0;
  for (let i = 0; i < n - 1; i++) {
    // Sınırlar kesirli (DPR), scrollY yuvarlanır: 1,5 px pay (adim.ts ile aynı).
    const a = stops[i].end;
    if (y <= a + 1.5) return i;
    const b = stops[i + 1].start;
    if (y < b - 1.5) return i + clamp01((y - a) / Math.max(1, b - a));
  }
  return n - 1;
}

/**
 * Bölüm geçişinde panel opaklığı: giden panel erken söner, gelen geç belirir (küre görünsün).
 * 10 → 11: büyüyen kapak fotoğrafı panelin bulunduğu yere gelmeden panel sönmüş olsun
 * (yarı saydam yazı fotoğrafın üstünde çift görüntü veriyordu).
 */
function panelOpacity(sec: number, t: number): number {
  const d = t - sec;
  if (d >= 0) return 1 - smooth(sec === 10 ? map(d, 0, 0.1) : map(d, 0.03, 0.28));
  return smooth(map(d, -0.5, -0.12));
}

export default function DunyaScene({ children }: { children: ReactNode }) {
  const reducedPref = useReducedMotion();
  // Final fotoğrafı yalnızca sahne yaklaşınca yüklenir (zayıf sinyalde ilk yüklemeyi yormasın).
  const [finaleReady, setFinaleReady] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef<HTMLDivElement>(null);
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
  const hudUyeRef = useRef<HTMLDivElement>(null);
  const hudYilRef = useRef<HTMLDivElement>(null);
  const hudGencRef = useRef<HTMLDivElement>(null);
  const membersRef = useRef<HTMLSpanElement>(null);
  const ilRef = useRef<HTMLSpanElement>(null);
  const ilceRef = useRef<HTMLSpanElement>(null);
  const yearsRef = useRef<HTMLSpanElement>(null);
  const youthRef = useRef<HTMLSpanElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const isaretRef = useRef<HTMLDivElement>(null);
  const halkaRef = useRef<HTMLDivElement>(null);
  const zeminRef = useRef<HTMLDivElement>(null);
  const antNabizRef = useRef<HTMLDivElement>(null);

  // Native snap bu rotada kapalı: hareketli modda kaydırmayı JS adımlama
  // (adim.ts) yönetir. Reduced-motion'da adımlama yok ve serbest kaydırma:
  // "y proximity" denendi, ama Chrome ekranın ~1/3'ü içindeki her konumu bölüm
  // başına geri çektiği için yavaş kaydırma (100 px'lik tekerlek çentikleri,
  // yavaş parmak sürüklemesi) ilk ekrandan hiç çıkamıyordu. Sahne yine en
  // yakın bölümün son karesinde durur. Activity rotayı gizleyince/unmount'ta
  // eski değer geri yüklenir, stil başka sayfaya sızmaz.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollSnapType;
    html.style.scrollSnapType = "none";
    return () => {
      html.style.scrollSnapType = prev;
    };
  }, []);

  useEffect(() => {
    // Hidrasyon commit'inde (sunucu değeri null) kurulmaz; istemci değeriyle tek kurulum.
    if (reducedPref === null) return;
    const reduced: boolean = reducedPref;
    const content = contentRef.current;
    const layer = layerRef.current;
    const poseEl = poseRef.current;
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
    const hudUye = hudUyeRef.current;
    const hudYil = hudYilRef.current;
    const hudGenc = hudGencRef.current;
    const membersEl = membersRef.current;
    const ilEl = ilRef.current;
    const ilceEl = ilceRef.current;
    const yearsEl = yearsRef.current;
    const youthEl = youthRef.current;
    const link = linkRef.current;
    const thumb = thumbRef.current;
    const isaretKatman = isaretRef.current;
    const halka = halkaRef.current;
    const zemin = zeminRef.current;
    const antNabiz = antNabizRef.current;
    if (
      !content || !layer || !poseEl || !wrap || !glCanvas || !ov || !fallback || !rings || !motifs ||
      !motifBlue || !motifDash || !finale || !finBox || !photo || !disc || !slogan ||
      !caption || !finDash || !hud || !hudUye || !hudYil || !hudGenc || !membersEl || !ilEl ||
      !ilceEl || !yearsEl || !youthEl || !link || !thumb || !isaretKatman || !halka || !zemin || !antNabiz
    ) {
      return;
    }
    /**
     * Rota Activity ile gizlenince (ör. "← Konseptler", sonra tarayıcıda Geri) ağaç
     * display:none olur ve efekt temizliği bir süre sonra çalışır. Bu arada gelen
     * scroll/resize/rAF sıfır kutularla ölçüp DOM'a yazmasın (panel opaklığı, adımlayıcının
     * '/' sayfasını kaydırması).
     */
    const gizli = () => content.getClientRects().length === 0;
    const ctx = ov.getContext("2d");
    if (!ctx) return;

    const heroHint = content.querySelector<HTMLElement>("[data-hero-hint]");
    const hintChevron = heroHint?.querySelector<SVGSVGElement>("svg") ?? null;
    const finArcs = Array.from(finBox.querySelectorAll<SVGCircleElement>("[data-fin-arc]"));
    const finDots = Array.from(finBox.querySelectorAll<SVGCircleElement>("[data-fin-dot]"));
    // Emanet: 12 işaret (+ nabız halkası), 12 etiket, dönem halkası dilimleri, zemin halkası.
    const isEls = isaretler.map((m) => isaretKatman.querySelector<HTMLElement>(`[data-isaret="${m.no}"]`));
    const haloEls = isEls.map((el) => el?.querySelector<HTMLElement>("[data-halo]") ?? null);
    const etEls = isaretler.map((m) => isaretKatman.querySelector<HTMLElement>(`[data-etiket="${m.no}"]`));
    const dilimEls = Array.from(halka.querySelectorAll<SVGCircleElement>("[data-dilim]"));
    const zeminDisk = zemin.querySelector<HTMLElement>("[data-zemin-disk]");
    const zeminMetin = zemin.querySelector<HTMLElement>("[data-zemin-metin]");
    const zeminEtiket = zemin.querySelector<SVGGElement>("[data-zemin-etiket]");
    const zeminEtiketEls = Array.from(zemin.querySelectorAll<SVGTextElement>("[data-zemin-etiket] text"));
    const zeminSutunEls = Array.from(zemin.querySelectorAll<SVGGElement>("[data-sutun]"));
    // Antalya nabzı (dinlenmede DOM halkaları; bkz. PULSE_LIVE_MS üstü).
    const antNokta = antNabiz.querySelector<HTMLElement>("[data-ant-nokta]");
    const antHalkalar = Array.from(antNabiz.querySelectorAll<HTMLElement>("[data-ant-halka]"));

    // Mobil (dar ekran): GL çözünürlüğü ve harita örneklemi düşük (brief §2.3).
    const narrow = window.innerWidth < 500;
    const deviceDpr = window.devicePixelRatio || 1;
    const glDpr = Math.min(deviceDpr, narrow ? 1.5 : 2);
    const ovDpr = Math.min(deviceDpr, 2);
    const mapSamples = narrow ? 14_000 : 36_000;

    /* ---------------- ölçüm ---------------- */
    // Bölümlerin dinlenme bölgeleri (sayfa px): adımlama hedefleri ve t eşlemesi.
    let stops: Durak[] = [];
    // Yarı saydam metin panelleri (sayfa koordinatı): geçişte sönüp belirir;
    // harita etiketleri panelin altına girerken söner (arkadan "hayalet" yazı olmasın).
    let panels: PanelInfo[] = [];
    const panelsCv: Rect[] = [];
    let vh = window.innerHeight;
    let vw = document.documentElement.clientWidth;
    let size = Math.max(1, wrap.clientWidth);
    // Küre pozları: kahraman (başlık ile ipucu arası) ve anlatı bölümleri
    // (panelin üstündeki ya da solundaki sahne alanı). Poz, tuvalin ekrana
    // izdüşümünü de belirler: ekran = merkez + poz + k · (tuval − boyut/2).
    const heroPose: Pose = { x: 0, y: 0, k: 1 };
    const stagePose: Pose = { x: 0, y: 0, k: 1 };
    const pose: Pose = { x: 0, y: 0, k: 1 };
    // Tuvalin ekranda görünen kısmı (etiketleri içeride tutmak için), tuval koordinatında.
    const vis = { l: 0, t: 0, r: 1, b: 1 };
    let fontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";
    let dirty = 6; // birkaç kare zorunlu çizim
    const morph = { dx: 0, dy: 0, s0: 1, dirty: true };
    // Bölüm elemanları (spot döngüsü) ve Emanet bölümlerindeki liste satırlarının alan no'ları.
    let secEls: HTMLElement[] = [];
    let secEmanet: number[][] = [];
    // Etiketlerin ölçek 1'deki boyu (px) ve dinlenme kamerasında seçilen yönleri.
    const etBoy = isaretler.map(() => ({ w: 0, h: 0 }));
    const etYon = new Map<number, EtiketYonu>();
    // 2. bölümde üst üste binen işaretlerin kayması (px, tuval); vurgu büyüdükçe sıfırlanır.
    const nudge = isaretler.map(() => [0, 0]);
    const pt = new Float64Array(3);
    const linkRect = { l: 0, t: 0, r: 0, b: 0 };
    let emanetDirty = true;

    /**
     * Bir pozun ekran geometrisi: tuvalin (0,0) köşesinin ekrandaki yeri, ölçek
     * ve etiketlerin kalacağı görünür alan (tuval koordinatı; sağda bölüm
     * göstergesine pay).
     */
    const poseGeom = (p: Pose) => {
      const k = p.k;
      const ox = vw / 2 + p.x - (k * size) / 2;
      const oy = vh / 2 + p.y - (k * size) / 2;
      const vis: Alan = {
        l: Math.max(0, -ox / k) + 6 / k,
        t: Math.max(0, -oy / k) + 6 / k,
        r: Math.min(size, (vw - ox) / k) - 20 / k,
        b: Math.min(size, (vh - oy) / k) - 6 / k,
      };
      return { k, ox, oy, vis };
    };
    /** Etiket/işaret ölçeği: ekranda sabit boy (küre katmanı k ile ölçeklenir). */
    const labelScale = (k: number) => (Math.min(size / 430, 1.35) / k) * smallPose(k);
    const labelCircle = (): Daire => ({ cx: size / 2, cy: size / 2, r: LABEL_CIRCLE * size });
    const etiketBoylari = () => {
      etEls.forEach((el, i) => {
        etBoy[i].w = el?.offsetWidth ?? 0;
        etBoy[i].h = el?.offsetHeight ?? 0;
      });
    };

    const measure = () => {
      vh = window.innerHeight;
      vw = document.documentElement.clientWidth;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
      const sy = window.scrollY;
      secEls = Array.from(content.querySelectorAll<HTMLElement>("[data-stage]")).sort(
        (a, b) => Number(a.dataset.stage) - Number(b.dataset.stage),
      );
      secEmanet = secEls.map((el) =>
        Array.from(el.querySelectorAll<HTMLElement>("[data-emanet]"), (li) => Number(li.dataset.emanet)),
      );
      // Spot döngüsü olmayan (reduced-motion) durumda da A'nın `[data-spot="0"]` stilleri geçerli olsun.
      for (const el of secEls) {
        if (el.hasAttribute("data-spot-count") && !el.hasAttribute("data-spot")) el.setAttribute("data-spot", "0");
      }
      const secs = secEls
        .map((el) => {
          const r = el.getBoundingClientRect();
          // İçeriğin (panel, ipucu, kapanış kutusu) altı; bölümün alt dolgusu hariç.
          let contentBottom = r.top;
          for (const c of Array.from(el.children)) {
            const cr = c.getBoundingClientRect();
            if (cr.height > 1) contentBottom = Math.max(contentBottom, cr.bottom);
          }
          return { top: r.top + sy, bottom: r.bottom + sy, content: contentBottom + sy };
        });
      stops = secs.map((sec) => {
        const start = Math.min(maxScroll, sec.top);
        // Bölüm ekrandan yalnızca alt dolgusu kadar uzunsa (içerik sığıyor) "uzun"
        // sayılmaz: aksi hâlde birkaç px'lik bölüm içi kaydırma, görünür hiçbir
        // şey yapmayan "ölü" bir hareket olur (ör. 1280×800'de 807 px'lik bölüm).
        const fits = sec.content - (sec.top + vh) <= FIT_TOLERANCE_PX;
        return { start, end: fits ? start : Math.min(maxScroll, Math.max(start, sec.bottom - vh)) };
      });
      // Panelin son yazılan opaklığı yeniden ölçümde korunur; ilk ölçümde NaN (ilk kare
      // her panele yazar: Activity dönüşünde DOM'da önceki kurulumun stili kalmış olabilir).
      const eskiO = new Map(panels.map((p) => [p.el, p.o]));
      panels = Array.from(content.querySelectorAll<HTMLElement>("[data-panel]")).map((el) => {
        const r = el.getBoundingClientRect();
        const sec = Number(el.closest<HTMLElement>("[data-stage]")?.dataset.stage ?? -1);
        return { el, sec, o: eskiO.get(el) ?? NaN, l: r.left, t: r.top + sy, r: r.right, b: r.bottom + sy };
      });
      size = Math.max(1, wrap.clientWidth);

      // Kahraman: küre, başlık paneli ile alt ipucu arasına ortalanır.
      const heroPanel = panels.find((p) => p.sec === 0);
      heroPose.x = 0;
      heroPose.k = 1;
      heroPose.y = 0;
      if (heroPanel && heroHint) {
        const ht = heroHint.getBoundingClientRect().top + sy;
        // Motif halkası (en dış yay ≈ %43.5) ekranın altından taşmasın (masaüstü/yatay ekran).
        const room = vh / 2 - 0.435 * size - 14;
        heroPose.y = Math.max(0, Math.min(0.14 * vh, room, (heroPanel.b + ht) / 2 - vh / 2));
      }

      // Anlatı bölümleri: sahne alanı = panelin üstü (dar ekran) ya da solu
      // (geniş yatay ekran; CSS paneli sağa alır). En kısıtlayıcı panel esas.
      const lr = link.getBoundingClientRect();
      linkRect.l = lr.left;
      linkRect.t = lr.top;
      linkRect.r = lr.right;
      linkRect.b = lr.bottom;
      // Kısa ekranda (yükseklik < 844; panel sahne alanını daraltır) küre linkin
      // altından değil ekranın üstünden başlar: link küçük ve solda, kürenin üst
      // ortası boş; böylece küre ~%15 büyük kalır (etiketler linki engel sayar).
      const topInset = vh < 844 ? lr.top + 6 : lr.bottom + 8;
      let minTop = Infinity;
      let minLeft = Infinity;
      for (const p of panels) {
        // 1–10: küre/zemin halkası panelin üstünde (11 kapak finali, 12 kapanış panelsiz).
        if (p.sec < 1 || p.sec > 10 || !secs[p.sec]) continue;
        minTop = Math.min(minTop, p.t - secs[p.sec].top);
        minLeft = Math.min(minLeft, p.l);
      }
      if (Number.isFinite(minTop)) {
        const side = minLeft > vw * 0.42;
        const R = side ? minLeft - 24 : vw;
        const T = side ? 12 : topInset;
        const B = side ? vh - 12 : minTop - 10;
        // Geniş yatay ekranda küre solda tek başına: dönem/zemin halkası (çap ≈ tuvalin
        // %99'u) ekranın sol/üst/alt kenarında kesilmesin, panele değmesin.
        const fitW = side ? 1.0 : 0.92;
        const fitH = side ? 1.0 : 0.86;
        stagePose.k = Math.max(0.45, Math.min(1, R / (fitW * size), (B - T) / (fitH * size)));
        stagePose.x = R / 2 - vw / 2;
        stagePose.y = (T + B) / 2 - vh / 2;
      }

      const w = Math.round(size * ovDpr);
      if (ov.width !== w || ov.height !== w) {
        ov.width = w;
        ov.height = w;
      }

      // Emanet etiketleri: boy (ölçek 1) ve dinlenme kamerasında (t = 3, 4) yön.
      etiketBoylari();
      etYon.clear();
      const geo = poseGeom(stagePose);
      const tuRest = labelScale(stagePose.k);
      const pad = 6 / stagePose.k;
      const engeller: Alan[] = [
        {
          l: (linkRect.l - geo.ox) / geo.k - pad,
          t: (linkRect.t - geo.oy) / geo.k - pad,
          r: (linkRect.r - geo.ox) / geo.k + pad,
          b: (linkRect.b - geo.oy) / geo.k + pad,
        },
      ];
      const daire = labelCircle();
      for (const [grup, tt] of [
        [0, EMANET_I],
        [1, EMANET_II],
      ] as const) {
        const P = makeProjector(sceneAt(tt, 0, true).cam, size);
        const yon = yonleriSec(
          grup,
          P,
          (no) => ({ w: etBoy[no - 1].w * tuRest, h: etBoy[no - 1].h * tuRest }),
          (ISARET_CAP / 2) * 1.24 * tuRest,
          daire,
          geo.vis,
          engeller,
        );
        yon.forEach((v, k) => etYon.set(k, v));
      }
      // Emanet girişi (t = 2, hepsi eşit boyda): üst üste binen işaretleri ayır.
      {
        const P = makeProjector(sceneAt(2, 0, true).cam, size);
        const nok = isaretler.map((m) => {
          P(m.vec, 1, pt);
          return [pt[0], pt[1]] as const;
        });
        ayristir(nok, ISARET_CAP * tuRest).forEach((d, i) => {
          nudge[i][0] = d[0];
          nudge[i][1] = d[1];
        });
      }
      // Zemin halkası (Stantta, t = 9 → stagePose): yazılar ekranda en az 11 px (dönem
      // etiketi) / 10 px (sütun numarası). Disk 300 px'ten küçükse numaralar gizlenir,
      // yalnızca nokta kalır. Etiketler disk kenarı ile sütun halkası arasına sığdırılır.
      {
        const zs = zemin.offsetWidth * stagePose.k; // 100 viewBox biriminin ekran boyu (px)
        if (zs > 1) {
          const birim = 100 / zs;
          const kucuk = zs * (ZEMIN.disk / 50) < 300;
          zemin.style.setProperty("--zemin-et", `${Math.max(2.7, 11 * birim).toFixed(2)}px`);
          zemin.style.setProperty("--zemin-no", `${Math.max(2.6, 10 * birim).toFixed(2)}px`);
          zemin.toggleAttribute("data-kucuk", kucuk);
          zeminEtiketEls.forEach((el, i) => {
            const d = zeminEtiketleri[i];
            if (!d) return;
            let w = 0;
            let h = 0;
            try {
              const bb = el.getBBox();
              w = bb.width;
              h = bb.height;
            } catch {
              return;
            }
            const p = zeminEtiketYeri(d.aci, w, h, kucuk);
            el.setAttribute("x", p.x.toFixed(2));
            el.setAttribute("y", p.y.toFixed(2));
            for (const ts of Array.from(el.querySelectorAll("tspan"))) ts.setAttribute("x", p.x.toFixed(2));
          });
        }
      }

      // Antalya nabız halkaları (tuval px): en dış yarıçap 37u, çizgi 2u (2D çizimle aynı).
      {
        const u = size / 430;
        const R = 37 * u;
        for (const el of antHalkalar) {
          el.style.width = el.style.height = `${(2 * R).toFixed(1)}px`;
          el.style.margin = `${(-R).toFixed(1)}px 0 0 ${(-R).toFixed(1)}px`;
          el.style.borderWidth = `${(2 * u).toFixed(2)}px`;
        }
        antPos = "";
      }

      emanetDirty = true;
      morph.dirty = true;
      dirty = 6;
    };
    let antPos = "";
    measure();

    /** Final: fotoğraf dairesi, kürenin (anlatı pozundaki) yerinden ve boyutundan kendi yerine gelir. */
    const computeMorph = () => {
      const b = finBox.getBoundingClientRect();
      const W = b.width;
      if (W <= 0) return;
      const pcx = b.left + (W * PH.cx) / 100;
      const pcy = b.top + (W * PH.cy) / 100;
      morph.dx = vw / 2 + stagePose.x - pcx;
      morph.dy = vh / 2 + stagePose.y - pcy;
      // Fotoğraftaki dünya, dairenin ~%54'ü: başlangıçta WebGL küresiyle örtüşsün (üst sınır 1.9×).
      const globeR = 0.4 * SCALE_WORLD * size * stagePose.k;
      morph.s0 = Math.min(1.9, Math.max(0.6, globeR / (0.54 * ((W * PH.r) / 100))));
      morph.dirty = false;
    };

    /* ---------------- sahne durumu ---------------- */
    let idle = 0;
    const tOf = (y: number) => {
      const raw = tAt(y, stops);
      return reduced ? quantize(raw) : raw;
    };
    let scene: Scene = sceneAt(tOf(window.scrollY), idle, reduced);
    let drawn: Scene | null = null; // GL'in bir sonraki/son karesinin sahnesi (onRender'da güncellenir)

    /* ---------------- overlay (2D) ---------------- */
    const provVec = iller.map((il) => toVec(il));
    const distVec = ilceler.map((d) => toVec(d));
    const capVec = baskentler.map((c) => toVec(c));
    const evVec = etkinlikler.map((e) => toVec(e.il));
    const antVec = toVec(ANTALYA_EXPO);
    const uskVec = toVec(USKUDAR);
    const scratch: [number, number, number] = [0, 0, 0];
    const pillFit = new Float64Array(2);
    let pulseLive = true;
    /** Antalya nabzı DOM halkalarında mı (dinlenme, t = 8). */
    let antDom = false;

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
      // Porthol maskesi (%45,5'te opak) dışına taşan etiket kesilirdi (kısa ekranda küre
      // küçük, etiket ekranda sabit boy): daireye sığacak kadar merkeze kaydır.
      sigdir(bx, by, w, h, labelCircle(), vis, pillFit);
      bx = pillFit[0];
      by = pillFit[1];
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
      // Emanet bölümlerinde (sand → 1) iller kum tonuna döner, ilçeler neredeyse söner:
      // 12 miras işareti öne çıkar.
      const baseIl = sc.tr * (1 - 0.2 * sc.dim) * (1 - 0.3 * sc.sand);
      const baseIlce = sc.tr * 0.55 * (1 - sc.dim) * (1 - 0.8 * sc.sand);
      const ilFill = sc.sand > 0.002 ? mixRgb(BLUE_255, KUM_255, sc.sand) : BRAND.blue;
      const ilceFill = sc.sand > 0.002 ? mixRgb(NAVY_255, KUM_255, sc.sand) : BRAND.navy;
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
            ctx.fillStyle = pass === 0 ? ilceFill : BRAND.teal;
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
      // Mavi (Emanet'te kum tonu) noktalar
      ctx.beginPath();
      for (const it of items) {
        if (it.green) continue;
        ctx.moveTo(it.x + it.r, it.y);
        ctx.arc(it.x, it.y, it.r, 0, TAU);
      }
      ctx.fillStyle = ilFill;
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

      // Gençlik buluşmaları (5 → 6 izi); şölende (6 → 7) yalnızca Kocaeli kalır, büyük nabız.
      if (sc.eventsAlpha > 0.01 && sc.events > 0) {
        const active = Math.min(etkinlikler.length - 1, Math.floor(sc.events - 1e-6));
        for (let i = 0; i < etkinlikler.length; i++) {
          const a = clamp01(sc.events - i);
          if (a <= 0) continue;
          const ev = etkinlikler[i];
          const evA = sc.eventsAlpha * (ev.big ? 1 : sc.eventsOthers);
          if (evA <= 0.01) continue;
          P(evVec[i], 1, pt);
          if (pt[2] < 0.1) continue;
          const x = pt[0];
          const y = pt[1];
          // Kocaeli (Şölen) buluşma izinde (6) diğer şehirlerle aynı boyda; büyüme, nabız ve
          // sakin halka yalnızca 6 → 7'de (Şölen kendi bölümünde; brief "Şölen bu bölümden ÇIKAR").
          const kb = ev.big ? sc.kocaeli : 0;
          const r = (5 + 5 * easeOut(kb)) * u * easeOut(a);
          ctx.globalAlpha = evA;
          if (a < 1) {
            ctx.beginPath();
            ctx.arc(x, y, r + 20 * u * a, 0, TAU);
            ctx.strokeStyle = BRAND.orange;
            ctx.lineWidth = 2 * u;
            ctx.globalAlpha = evA * (1 - a);
            ctx.stroke();
            ctx.globalAlpha = evA;
          }
          if (ev.big && kb > 0 && kb < 1) {
            // Şölen nabzı: geçişe bağlı 3 genişleyen halka (zamana değil, scroll'a bağlı).
            ctx.strokeStyle = BRAND.orange;
            ctx.lineWidth = 2.2 * u;
            for (let j = 0; j < 3; j++) {
              const ph = kocaeliHalkaFazi(kb, j);
              if (ph <= 0 || ph >= 1) continue;
              ctx.globalAlpha = evA * 0.8 * (1 - ph);
              ctx.beginPath();
              ctx.arc(x, y, r + 44 * u * easeOut(ph), 0, TAU);
              ctx.stroke();
            }
            ctx.globalAlpha = evA;
          }
          if (ev.big && a >= 1 && kb > 0) {
            // Sakin halka (yalnızca şölende; geçişle belirir).
            ctx.beginPath();
            ctx.arc(x, y, r + (6 + 5 * kb) * u, 0, TAU);
            ctx.strokeStyle = BRAND.orange;
            ctx.lineWidth = (1.5 + 0.5 * kb) * u;
            ctx.globalAlpha = evA * (0.45 + 0.2 * kb) * smooth(kb * 3);
            ctx.stroke();
            ctx.globalAlpha = evA;
          }
          ctx.beginPath();
          ctx.arc(x, y, r + 1.6 * u, 0, TAU);
          ctx.fillStyle = "#fff";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fillStyle = BRAND.orange;
          ctx.fill();
          // Kocaeli'nin alt satırı ("Bir Gençlik Şöleni · 100.000+ genç") gösterilmez: Şölen
          // artık kendi bölümünde (7; brief-dunya-2 §1 "Şölen bu bölümden ÇIKAR") ve orada
          // HUD sayacı + panel aynı bilgiyi verir. Buluşma izinde yalnızca etkin etkinliğin
          // alt satırı görünür; dinlenmede (t = 6) etiketlerin hepsi yalnızca ad.
          const showSub = i === active && !ev.big;
          pill(
            x,
            y,
            ev.title,
            showSub ? ev.sub : null,
            ev.side,
            evA * smooth(a * 1.6),
            tu * (1 + 0.1 * kb),
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
          if (antDom) {
            // Dinlenme: nabız DOM halkalarında (compositor), burada yalnızca nokta + etiket.
          } else if (reduced || !pulseLive) {
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
      // Tuvalin (0,0) köşesinin ekrandaki yeri (poz: kayma + ölçek) ve görünen kısmı.
      const k = pose.k;
      const ox = vw / 2 + pose.x - (k * size) / 2;
      const oy = vh / 2 + pose.y - (k * size) / 2;
      vis.l = Math.max(0, -ox / k) + 8;
      vis.r = Math.min(size, (vw - ox) / k) - 8;
      vis.t = Math.max(0, -oy / k) + 8;
      vis.b = Math.min(size, (vh - oy) / k) - 8;
      // Ekrandaki (sönmemiş) panellerin tuval koordinatları (bu kare için).
      const sy = window.scrollY;
      panelsCv.length = 0;
      for (const p of panels) {
        if (p.o < 0.35) continue;
        const t = (p.t - sy - oy) / k;
        const b = (p.b - sy - oy) / k;
        if (b < -LABEL_FADE_PX || t > size + LABEL_FADE_PX) continue;
        panelsCv.push({ l: (p.l - ox) / k, t, r: (p.r - ox) / k, b });
      }
      const P = makeProjector(sc.cam, size);
      const u = size / 430;
      // Etiket boyu ekranda sabit kalsın (küre katmanı k ile ölçeklenir; küçük pozda biraz küçülür).
      const tu = (Math.min(u, 1.35) / k) * smallPose(k);

      // Kahraman: Antalya etiketi (Antalya bize dönükken)
      if (sc.hero > 0.01) {
        P(antVec, 1, pt);
        const facing = smooth(map(pt[2], 0.3, 0.65));
        if (facing > 0.01) {
          const x = pt[0];
          const y = pt[1];
          ctx.globalAlpha = sc.hero * facing;
          dot(P, antVec, 4.2 * u, BRAND.orange, 1.8 * u);
          // Nokta başlık panelinin hemen altındaysa (geniş ekran: küre aşağı inemiyor, motif
          // halkası ekrandan taşardı) sağdaki etiket panele değip sönerdi: etiket noktanın altına.
          let yan: Side = "right";
          for (const p of panelsCv) {
            if (x > p.l - 24 && x < p.r + 24 && y > p.t && y - p.b < 34 * tu) yan = "below";
          }
          pill(x, y, "Antalya", "COP31 · " + cop31.dates, yan, sc.hero * facing, tu, BRAND.navy);
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

    /* ---------------- adımlama + kiosk (?auto=1) ---------------- */
    // Hareket tercihi varsa adımlama yok (native proximity snap, sahne son karede).
    const stepper: Stepper | null = reduced
      ? null
      : createStepper({ stops: () => stops, viewport: () => vh, wake: () => wake() });

    // Kiosk: bölüm bölüm; her bölümde KIOSK_DWELL_MS bekler, KIOSK_STEP_MS'de
    // geçer; uzun bölümde okuma hızında sonuna kayar. Sonda başa döner.
    // Kullanıcı dokunur/kaydırırsa akış durur; 30 sn dokunulmazsa kaldığı yerden sürer.
    const kiosk = new URLSearchParams(window.location.search).get("auto") === "1";
    let kTimer = 0;
    let kPauseUntil = 0;
    /** Kiosk tur sayacı (başa her dönüşte +1): spot döngüsünün başlangıç kayması. */
    let kTur = 0;
    let alive = true;
    /** Bölümün spot süresi: Emanet listeleri (3, 4) uzun açıklama, Stantta (9) kısa. */
    const spotMsOf = (idx: number) => (idx === EMANET_I || idx === EMANET_II ? SPOT_MS_EMANET : SPOT_MS_STANT);
    const kSchedule = (ms: number) => {
      window.clearTimeout(kTimer);
      kTimer = window.setTimeout(kRun, Math.max(0, ms));
    };
    const kRun = () => {
      if (!alive) return;
      const now = performance.now();
      if (document.hidden) return kSchedule(1000);
      if (now < kPauseUntil) return kSchedule(kPauseUntil - now + 50);
      if (stepper?.busy()) return kSchedule(250);
      const y = window.scrollY;
      const i = Math.round(tAt(y, stops));
      const st = stops[i];
      if (!st) return kSchedule(KIOSK_DWELL_MS);
      if (st.end - st.start > 2 && y < st.end - 1) {
        const dur = ((st.end - y) / KIOSK_READ_PX_S) * 1000;
        if (stepper) stepper.glideTo(st.end, dur);
        else window.scrollTo(0, st.end);
        return kSchedule((stepper ? dur : 0) + KIOSK_READ_HOLD_MS);
      }
      if (i >= stops.length - 1) {
        // Başa dön: küre katmanı yükleniş geçişiyle yeniden belirir.
        window.scrollTo(0, 0);
        t0 = now;
        kTur++;
        wake();
        return kSchedule(KIOSK_DWELL_MS);
      }
      if (stepper) stepper.goTo(i + 1, KIOSK_STEP_MS);
      else window.scrollTo(0, stops[i + 1].start);
      // Spot döngülü bölümde (3, 4, 9) bekleme üç tam vurguyla biter: 600 + 3 × spot − 200 ms
      // (3/4: 13,9 sn; 9: 10,9 sn); 4. spot başlamadan geçilir. Sonraki turda döngü +3'ten başlar.
      const spotlu = secEls[i + 1]?.hasAttribute("data-spot-count") && !reduced;
      kSchedule((stepper ? KIOSK_STEP_MS : 0) + (spotlu ? kioskSpotDwell(spotMsOf(i + 1)) : KIOSK_DWELL_MS));
    };
    const onUser = () => {
      kPauseUntil = performance.now() + KIOSK_RESUME_MS;
      kSchedule(KIOSK_RESUME_MS + 50);
    };
    if (kiosk) {
      window.addEventListener("wheel", onUser, { passive: true });
      window.addEventListener("touchstart", onUser, { passive: true });
      window.addEventListener("pointerdown", onUser, { passive: true });
      window.addEventListener("keydown", onUser);
      kSchedule(KIOSK_DWELL_MS);
    }

    /* ---------------- DOM güncellemeleri ---------------- */
    const last = {
      hint: -1,
      layer: -1,
      pose: "",
      hudX: NaN,
      thumb: -1,
      globe: -1,
      rings: -1,
      motifs: -1,
      turn: -1,
      hud: -1,
      hudUye: -1,
      hudYil: -1,
      hudGenc: -1,
      members: "",
      il: "",
      ilce: "",
      years: "",
      youth: "",
      // null: ilk kare final katmanının display'ini her durumda yazar (Activity dönüşü).
      show: null as boolean | null,
      finale: -1,
      disc: -1,
      slogan: -1,
      orbits: -1,
    };
    let finalePrep = false;
    const setOpacity = (el: HTMLElement | SVGElement, v: number) => {
      el.style.opacity = v.toFixed(3);
      el.style.visibility = v <= 0.001 ? "hidden" : "visible";
    };

    const applyDom = (sc: Scene, t: number, tRaw: number, intro: number) => {
      // "Aşağı kaydırın" ipucu ilk geçişin başında söner.
      if (heroHint) {
        const hintO = reduced ? (tRaw > 0.3 ? 0 : 1) : 1 - smooth(map(t, 0.02, 0.2));
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
      // Küre katmanı: yükleniş (opaklık) + poz (kahraman ↔ anlatı; yalnızca transform).
      if (Math.abs(intro - last.layer) > 1e-3) {
        last.layer = intro;
        layer.style.opacity = intro.toFixed(3);
      }
      const h = sc.heroShift;
      pose.x = stagePose.x + (heroPose.x - stagePose.x) * h;
      pose.y = stagePose.y + (heroPose.y - stagePose.y) * h;
      pose.k = stagePose.k + (heroPose.k - stagePose.k) * h;
      const poseKey = `${pose.x.toFixed(1)}px,${pose.y.toFixed(1)}px,0) scale(${pose.k.toFixed(4)}`;
      if (poseKey !== last.pose) {
        last.pose = poseKey;
        poseEl.style.transform = `translate3d(${poseKey})`;
      }

      // Paneller: giden erken söner, gelen geç belirir (reduced-motion: hep görünür).
      // Yalnızca opacity: visibility yazılmaz, böylece ekran okuyucu dinlenmede ekran dışında
      // duran diğer bölümlerin başlık ve metinlerine de ulaşır (panellerde odaklanabilir öğe yok).
      for (const p of panels) {
        const o = reduced ? 1 : panelOpacity(p.sec, t);
        if (Math.abs(o - p.o) <= 1e-3) continue;
        p.o = o;
        p.el.style.opacity = o >= 0.999 ? "" : o.toFixed(3);
      }

      // Sağ kenar bölüm göstergesi (yalnızca gösterge; tıklanmaz).
      const thumbY = t * DOT_STEP;
      if (Math.abs(thumbY - last.thumb) > 0.05) {
        last.thumb = thumbY;
        thumb.style.transform = `translate3d(0,${thumbY.toFixed(2)}px,0)`;
      }

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

      // HUD sayaçları: geçişte 0 → değer, bölümde tam değerde durur.
      // Biz kimiz: 1.000.000+ üye · Emanet girişi: 12.000 yıllık emanet · Şölen: 100.000+ genç.
      const hudO = Math.max(sc.hud, sc.hudYears, sc.hudYouth);
      if (Math.abs(hudO - last.hud) > 1e-3) {
        last.hud = hudO;
        hud.style.visibility = hudO <= 0.001 ? "hidden" : "visible";
      }
      if (Math.abs(sc.hud - last.hudUye) > 1e-3) setOpacity(hudUye, (last.hudUye = sc.hud));
      if (Math.abs(sc.hudYears - last.hudYil) > 1e-3) setOpacity(hudYil, (last.hudYil = sc.hudYears));
      if (Math.abs(sc.hudYouth - last.hudGenc) > 1e-3) setOpacity(hudGenc, (last.hudGenc = sc.hudYouth));
      if (hudO > 0) {
        // Sayaç kürenin üstünde ortalı kalsın (geniş ekranda küre solda).
        const hx = Math.round(pose.x);
        if (hx !== last.hudX) {
          last.hudX = hx;
          hud.style.transform = hx !== 0 ? `translate3d(${hx}px,0,0)` : "";
        }
      }
      if (sc.hud > 0) {
        const c = sc.counter;
        const members = `${Math.round(facts.members * c).toLocaleString("tr-TR")}${c >= 1 ? "+" : ""}`;
        const il = String(Math.floor(facts.provinces * c));
        const ilce = String(Math.round(facts.districts * c));
        if (members !== last.members) membersEl.textContent = last.members = members;
        if (il !== last.il) ilEl.textContent = last.il = il;
        if (ilce !== last.ilce) ilceEl.textContent = last.ilce = ilce;
      }
      if (sc.hudYears > 0) {
        const years = Math.round(EMANET_YIL * sc.years).toLocaleString("tr-TR");
        if (years !== last.years) yearsEl.textContent = last.years = years;
      }
      if (sc.hudYouth > 0) {
        const y = sc.youth;
        const youth = `${Math.round(facts.solenAttendees * y).toLocaleString("tr-TR")}${y >= 1 ? "+" : ""}`;
        if (youth !== last.youth) youthEl.textContent = last.youth = youth;
      }

      // Final: küre söner, kapak (fotoğraf dairesi + slogan dairesi + yaylar) belirir.
      // Fotoğraf (React state → <Image>) Antalya bölümünde DİNLENİRKEN bağlanır, katman
      // Stantta bölümünde dinlenirken (görünmez) açılır: 9 → 10 geçişinde React render'ı
      // ve düzen işi olmasın (4× CPU'da 50 ms'lik kare). Kiosk/serbest atlamada yine açılır.
      if (!finalePrep && tRaw >= 8 && Number.isInteger(tRaw)) {
        finalePrep = true;
        setFinaleReady(true);
      }
      const show = t >= 9 || sc.finale > 0;
      if (show !== last.show) {
        last.show = show;
        finale.style.display = show ? "flex" : "none";
        if (show) {
          if (!finalePrep) {
            finalePrep = true;
            setFinaleReady(true);
          }
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
        // 0,12'den başlar: 10. bölümün paneli (t = 10,1'de sönmüş) büyüyen fotoğrafın altında yarı saydam kalmasın.
        photo.style.opacity = smooth(map(sc.finale, 0.12, 0.45)).toFixed(3);
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

    /* ---------------- Emanet: spot döngüsü ---------------- */
    // Bölüm elemanındaki `data-spot` (A'nın listesi/planı CSS ile buna bakar) ve
    // küredeki karşılığı: Emanet bölümlerinde spot = n → o bölümün n. alanı (no).
    const spot = { el: null as HTMLElement | null, since: 0, val: 0, ms: SPOT_MS_EMANET, kayma: 0 };
    const gs = { cur: 0, prev: 0, t0: -Infinity };

    /** Yalnızca rAF'tan çağrılır; DOM attribute yazar (React state yok). */
    const updateSpot = (tRaw: number, now: number) => {
      let el: HTMLElement | null = null;
      let n = 0;
      // Dinlenme: tAt bölüm içinde tam sayı döndürür (geçişte kesirli).
      const restIdx = Number.isInteger(tRaw) ? tRaw : -1;
      // Reduced-motion: döngü yok (data-spot="0"); A bu durumda bütün açıklamaları alt alta gösterir.
      if (!reduced && restIdx >= 0) {
        const s = secEls[restIdx];
        const c = s ? Number(s.getAttribute("data-spot-count")) : 0;
        if (c >= 1) {
          el = s;
          n = Math.floor(c);
        }
      }
      if (el !== spot.el) {
        // Geçiş başladı / bölüm terk edildi: eski bölüm "0"a döner.
        spot.el?.setAttribute("data-spot", "0");
        spot.el = el;
        spot.since = now;
        spot.val = 0;
        spot.ms = spotMsOf(restIdx);
        // Kiosk: her turda döngü +3'ten başlar (iki turda bütün alanlar vurgulanır).
        spot.kayma = kiosk && n > 0 ? (kTur * KIOSK_SPOT_SAYI) % n : 0;
      }
      let v = 0;
      if (el) {
        const e = now - spot.since;
        v = e < SPOT_DELAY_MS ? 0 : 1 + ((Math.floor((e - SPOT_DELAY_MS) / spot.ms) + spot.kayma) % n);
        if (v !== spot.val) {
          spot.val = v;
          el.setAttribute("data-spot", String(v));
        }
      }
      let no = 0;
      if (v > 0 && (restIdx === EMANET_I || restIdx === EMANET_II)) {
        // Listedeki n. satırın alan no'su; liste yoksa grup sırası (I: 1–6, II: 7–12).
        const x = secEmanet[restIdx]?.[v - 1] ?? 0;
        if (x >= 1 && x <= 12) no = restIdx === EMANET_II && x <= 6 ? x + 6 : x;
        else no = restIdx === EMANET_II ? 6 + v : v;
      }
      if (no !== gs.cur) {
        gs.prev = gs.cur;
        gs.cur = no;
        gs.t0 = now;
      }
    };

    /* ---------------- Emanet: işaretler, etiketler, dönem halkası, zemin ---------------- */
    const durum: IsaretDurumu = { o: 0, s: 0, dy: 0, etiket: 0 };
    const kutu = new Float64Array(2);
    const nb = new Float64Array(2);
    const em = {
      t: NaN,
      pose: "",
      ring: -1,
      draw: -1,
      ground: -1,
      groundIn: -1,
      layer: null as boolean | null,
      o: isaretler.map(() => -1),
      tr: isaretler.map(() => ""),
      eo: isaretler.map(() => -1),
      etr: isaretler.map(() => ""),
      act: isaretler.map(() => false),
    };
    const spotOf = (no: number, s: number) => (s === 0 || s === no ? 1 : SPOT_DIM);
    // Spottaki işaretin nabzı: `nabiz` eğrisinden örneklenmiş Web Animations kareleri
    // (transform + opacity, compositor'da döner; rAF döngüsü spotlar arasında uyuyabilir).
    const nabizKareleri: Keyframe[] = Array.from({ length: 13 }, (_, k) => {
      nabiz(k / 12, nb);
      return { offset: k / 12, transform: `scale(${nb[0].toFixed(3)})`, opacity: Number(nb[1].toFixed(3)) };
    });
    const haloAnim: (Animation | null)[] = isaretler.map(() => null);
    const stopHalos = () => {
      haloAnim.forEach((a, i) => {
        a?.cancel();
        haloAnim[i] = null;
      });
    };

    const applyEmanet = (sc: Scene, t: number, now: number) => {
      // Dönem halkası: opaklık + üstten saat yönünde çizim (stroke-dasharray).
      if (Math.abs(sc.ring - em.ring) > 1e-3) {
        em.ring = sc.ring;
        setOpacity(halka, sc.ring);
      }
      if (sc.ring > 0.001 && Math.abs(sc.ringDraw - em.draw) > 1e-4) {
        em.draw = sc.ringDraw;
        for (let i = 0; i < dilimEls.length; i++) {
          const len = dilimBoyu(i, sc.ringDraw);
          dilimEls[i].style.strokeDasharray = `${len.toFixed(2)} ${(360 - len).toFixed(2)}`;
        }
      }

      // Zemin halkası (Stantta): krem disk büyüyerek, sütunlar sırayla, etiketler ve yazı.
      if (Math.abs(sc.ground - em.ground) > 1e-3) {
        em.ground = sc.ground;
        setOpacity(zemin, sc.ground);
      }
      if (sc.ground > 0.001 && Math.abs(sc.groundIn - em.groundIn) > 1e-4) {
        const g = sc.groundIn;
        em.groundIn = g;
        if (zeminDisk) zeminDisk.style.transform = g < 1 ? `scale(${(0.86 + 0.14 * easeOut(map(g, 0, 0.5))).toFixed(4)})` : "";
        if (zeminMetin) {
          const m = smooth(map(g, 0.5, 1));
          zeminMetin.style.opacity = m.toFixed(3);
          zeminMetin.style.transform = m < 1 ? `translate3d(0,${((1 - m) * 8).toFixed(1)}px,0)` : "";
        }
        if (zeminEtiket) zeminEtiket.style.opacity = smooth(map(g, 0.35, 0.85)).toFixed(3);
        zeminSutunEls.forEach((el, i) => {
          const v = sutunGorunur(g, i);
          el.style.opacity = v.toFixed(3);
          el.style.transform = v < 1 ? `scale(${(0.3 + 0.7 * easeOut(v)).toFixed(4)})` : "";
        });
      }

      // 12 işaret + etiketler (yalnızca Emanet bölümlerinde ve geçişlerinde).
      const on = sc.marks > 0.001 && sc.globe > 0.001;
      if (on !== em.layer) {
        em.layer = on;
        isaretKatman.style.visibility = on ? "visible" : "hidden";
      }
      if (!on) {
        stopHalos();
        return;
      }

      const blend = now - gs.t0 < SPOT_BLEND_MS + 40;
      if (t !== em.t || blend || emanetDirty || em.pose !== last.pose) {
        em.t = t;
        em.pose = last.pose;
        emanetDirty = false;
        const geo = poseGeom(pose);
        const tu = labelScale(pose.k);
        const P = makeProjector(sc.cam, size);
        const daire = labelCircle();
        const m = smooth((now - gs.t0) / SPOT_BLEND_MS);
        const sy = window.scrollY;
        for (let i = 0; i < isaretler.length; i++) {
          const mk = isaretler[i];
          const el = isEls[i];
          const et = etEls[i];
          if (!el || !et) continue;
          isaretDurumu(sc, i, durum);
          P(mk.vec, 1, pt);
          const face = smooth(map(pt[2], 0.08, 0.2)); // arka yüzde gizli
          // 2. bölümün ayırma kayması; grup vurgusu büyüdükçe işaret gerçek yerine oturur.
          const nw = sc.rise > 0 ? 1 - Math.max(sc.emphI, sc.emphII) : 0;
          const x = pt[0] + nudge[i][0] * nw;
          const y = pt[1] + nudge[i][1] * nw;
          const spotW = (gs.prev === mk.no ? 1 - m : 0) + (gs.cur === mk.no ? m : 0);

          // İşaret
          const o = durum.o * face;
          if (Math.abs(o - em.o[i]) > 1e-3) {
            const wasHidden = em.o[i] <= 0.001;
            em.o[i] = o;
            el.style.opacity = o.toFixed(3);
            if (wasHidden !== o <= 0.001) el.style.visibility = o <= 0.001 ? "hidden" : "";
          }
          if (o > 0.001) {
            const s = durum.s * tu * (1 + 0.22 * spotW);
            const tr = `translate3d(${x.toFixed(1)}px,${(y + durum.dy * tu).toFixed(1)}px,0) scale(${s.toFixed(4)})`;
            if (tr !== em.tr[i]) el.style.transform = em.tr[i] = tr;
          }
          const act = gs.cur === mk.no;
          if (act !== em.act[i]) {
            em.act[i] = act;
            // Spottaki işaret ve etiketi ters renk (koyu yeşil zemin, krem yazı). Zemin 300 ms'de
            // geçer, yazı rengi geçişin ortasında anlık döner (ikisi birlikte geçince ortada aynı
            // tona gelip rakam ~100 ms kayboluyordu); bkz. JSX'teki transition.
            el.style.backgroundColor = act ? EMANET_RENK.koyuYesil : "";
            el.style.color = act ? EMANET_RENK.krem : "";
            et.style.backgroundColor = act ? EMANET_RENK.koyuYesil : "";
            et.style.color = act ? EMANET_RENK.krem : "";
            et.style.zIndex = act ? "2" : "";
          }

          // Etiket: grup vurgusunda görünür; spotta olmayanlar söner; panele yaklaşınca söner.
          let eo = durum.etiket * face;
          if (eo > 0.001) {
            eo *= spotOf(mk.no, gs.prev) * (1 - m) + spotOf(mk.no, gs.cur) * m;
            const W = etBoy[i].w * tu;
            const H = etBoy[i].h * tu;
            etiketYeri(etYon.get(mk.no) ?? mk.yon, x, y, W, H, (ISARET_CAP / 2) * durum.s * tu, daire, geo.vis, kutu);
            const sl = geo.ox + kutu[0] * geo.k;
            const st = geo.oy + kutu[1] * geo.k;
            const sr = sl + W * geo.k;
            const sb = st + H * geo.k;
            for (const p of panels) {
              if (p.o < 0.35) continue;
              const d = Math.max(p.l - sr, sl - p.r, p.t - sy - sb, st - (p.b - sy));
              if (d < LABEL_FADE_PX) eo *= reduced ? (d > 4 ? 1 : 0) : clamp01(d / LABEL_FADE_PX);
            }
            const tr = `translate3d(${kutu[0].toFixed(1)}px,${kutu[1].toFixed(1)}px,0) scale(${tu.toFixed(4)})`;
            if (tr !== em.etr[i]) et.style.transform = em.etr[i] = tr;
          }
          if (Math.abs(eo - em.eo[i]) > 1e-3) {
            const wasHidden = em.eo[i] <= 0.001;
            em.eo[i] = eo;
            et.style.opacity = eo.toFixed(3);
            if (wasHidden !== eo <= 0.001) et.style.visibility = eo <= 0.001 ? "hidden" : "";
          }
        }
      }

      // Spottaki işaretin nabzı (yalnızca dinlenmede; reduced-motion'da spot hep 0, nabız yok).
      for (let i = 0; i < isaretler.length; i++) {
        const halo = haloEls[i];
        if (!halo) continue;
        const live = gs.cur === isaretler[i].no && em.o[i] > 0.01;
        const anim = haloAnim[i];
        if (live && !anim && typeof halo.animate === "function") {
          haloAnim[i] = halo.animate(nabizKareleri, { duration: NABIZ_MS, iterations: Infinity });
        } else if (!live && anim) {
          anim.cancel();
          haloAnim[i] = null;
        }
      }
    };


    /* ---------------- ana döngü ---------------- */
    // İsteğe bağlı rAF: scroll/resize (passive) ve adımlama döngüyü uyandırır;
    // sahne oturunca (adım bitti, boşta dönüş/nabız yok, GL durdu) döngü uyur.
    // Adımlama kaydırmayı bu döngüde ilerletir: sahne aynı karede yeni konumu okur.
    // Küre görünmezken (final/kapanış) ve sekme arka plandayken GL çalışmaz.
    let raf = 0;
    let prev = 0;
    let quiet = 0;
    let lastY = -1;
    let lastT = -1;
    let t0 = performance.now();
    let lastActivity = t0;

    /**
     * Antalya nabzı (t = 8 dinlenme): iki DOM halkası Web Animations ile döner; 2D katman
     * yalnızca noktayı ve etiketi çizer, rAF uyur. Geçişte 2D katman çizer (döngü zaten açık).
     */
    const antKareleri: Keyframe[] = Array.from({ length: 13 }, (_, k) => {
      const ph = k / 12;
      return { offset: ph, transform: `scale(${((7 + 30 * easeOut(ph)) / 37).toFixed(4)})`, opacity: 0.75 * (1 - ph) };
    });
    const antAnim: Animation[] = [];
    const setAntDom = (on: boolean, sc: Scene) => {
      if (on) {
        const P = makeProjector(sc.cam, size);
        P(antVec, 1, pt);
        const key = `${pt[0].toFixed(1)}px,${pt[1].toFixed(1)}px`;
        if (key !== antPos && antNokta) {
          antPos = key;
          antNokta.style.transform = `translate3d(${key},0)`;
        }
      }
      if (on === antDom) return;
      antDom = on;
      antNabiz.style.visibility = on ? "visible" : "hidden";
      for (const a of antAnim) a.cancel();
      antAnim.length = 0;
      if (on) {
        antHalkalar.forEach((el, k) => {
          if (typeof el.animate !== "function") return;
          antAnim.push(el.animate(antKareleri, { duration: PULSE_MS, iterations: Infinity, delay: -k * (PULSE_MS / 2) }));
        });
      }
      // 2D katman halkalarını bıraksın/geri alsın: bir kez yeniden çiz.
      dirty = Math.max(dirty, 1);
    };

    const tick = (now: number) => {
      raf = 0;
      if (document.hidden || gizli()) {
        prev = 0;
        return;
      }
      const rawDt = prev ? (now - prev) / 1000 : 1 / 60;
      const dt = Math.min(0.1, Math.max(0, rawDt));
      prev = now;

      const stepping = stepper ? stepper.frame(now) || stepper.busy() : false;
      const y = window.scrollY;
      const tRaw = tAt(y, stops);
      const t = reduced ? quantize(tRaw) : tRaw;

      // Kahramanda boşta dönüş: son etkinlikten IDLE_SPIN_MS sonra yavaşlayıp durur.
      let idling = false;
      if (!reduced && t <= 0.1) {
        const since = now - lastActivity;
        const k = since < IDLE_SPIN_MS ? 1 : 1 - smooth((since - IDLE_SPIN_MS) / IDLE_EASE_MS);
        if (k > 0) {
          idle += IDLE_SPEED * dt * k;
          idling = true;
        }
      }
      const intro = reduced ? 1 : smooth((now - t0) / INTRO_MS);

      scene = sceneAt(t, idle, reduced);
      applyDom(scene, t, tRaw, intro);
      updateSpot(tRaw, now);
      applyEmanet(scene, t, now);

      // GL'i yalnızca kamera/sahne değişirken çalıştır (pil). Bölüm içinde
      // kaydırma (t sabit) ve nabız yalnızca 2D overlay'i yeniden çizer.
      const visible = scene.globe > 0.001;
      // Antalya nabzı dinlenmede DOM'da (WebGL varsa; yoksa 2D yolu sürer).
      setAntDom(!!globe && visible && scene.pulse && Number.isInteger(tRaw), scene);
      const changing = t !== lastT || idling || dirty > 0;
      if (dirty > 0) dirty--;
      const wantGL = visible && changing;
      const live = now - lastActivity < PULSE_LIVE_MS;
      const pulsing = visible && scene.pulse && live && !antDom;
      // Nabız zaman aşımına uğradı: bir kez sabit halkayla çiz, sonra uyu.
      const pulseEnded = pulseLive && !live && visible && scene.pulse && !antDom;
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
        if (!glRunning && (pulsing || pulseEnded || (y !== lastY && visible))) {
          // Kamera sabit: GL'in son karesiyle aynı sahnede yalnızca 2D katman
          // (nabız; panel altına giren etiketlerin sönmesi).
          drawOverlay(drawn ?? scene, now);
        }
      } else if (wantGL || pulsing || quiet < 3 || y !== lastY) {
        // WebGL yok: overlay yine çizilir, küre CSS diskiyle temsil edilir.
        fallback.style.transform = `scale(${Math.min(scene.cam.scale, 3).toFixed(3)})`;
        drawOverlay(scene, now);
      }
      lastY = y;
      lastT = t;

      const settling = dirty > 0 || intro < 1;
      // Spot döngüsü: değişimden sonraki 300 ms'lik vurgu geçişinde kare kare;
      // aradaki sürede döngü uyur, zamanlayıcı onu bir sonraki spot anında
      // uyandırır (yazma yine bu rAF'ta). Nabız compositor animasyonu.
      const blending = now - gs.t0 < SPOT_BLEND_MS + 60;
      const busy = stepping || settling || wantGL || glRunning || pulsing || blending || (!globe && quiet < 3);
      if (spot.el) {
        const e = now - spot.since;
        const next =
          e < SPOT_DELAY_MS ? SPOT_DELAY_MS : SPOT_DELAY_MS + (Math.floor((e - SPOT_DELAY_MS) / spot.ms) + 1) * spot.ms;
        scheduleSpotWake(spot.since + next);
      } else scheduleSpotWake(0);
      if (busy) raf = requestAnimationFrame(tick);
      else prev = 0;
    };
    let spotTimer = 0;
    let spotWakeAt = 0;
    /**
     * `at` (performance.now) anında döngüyü uyandırır; 0 = iptal. Zamanlayıcı
     * ateşlenmiş ama sınır henüz geçilmemişse (rAF zaman damgası) yeniden kurulur.
     */
    const scheduleSpotWake = (at: number) => {
      if (at === spotWakeAt && (spotTimer !== 0 || at === 0)) return;
      spotWakeAt = at;
      window.clearTimeout(spotTimer);
      spotTimer = 0;
      if (at > 0) {
        spotTimer = window.setTimeout(
          () => {
            spotTimer = 0;
            wake();
          },
          Math.max(0, at - performance.now()) + 2,
        );
      }
    };
    const wake = () => {
      if (raf === 0) raf = requestAnimationFrame(tick);
    };
    wake();

    /* ---------------- olaylar ---------------- */
    // Not: GL döngüsü yalnızca tick içinden açılıp kapanır (çift rAF zinciri olmasın);
    // measure() dirty'yi ayarlar, tick gerekirse küreyi yeniden çizer.
    const onScroll = () => {
      if (gizli()) return;
      lastActivity = performance.now();
      wake();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => {
      // Activity ile gizliyken (display:none) sıfır kutularla ölçme, '/' sayfasını kaydırma.
      if (gizli()) return;
      measure();
      // Ölçü değişti (döndürme, yazı tipi, görsel): bölüm arasında kalındıysa yerleş.
      stepper?.remeasured();
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
    document.fonts?.ready
      .then(() => {
        if (!alive || gizli()) return;
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
      window.clearTimeout(spotTimer);
      stopHalos();
      for (const a of antAnim) a.cancel();
      // DOM'u nötr bırak: Activity aynı DOM'u geri getirdiğinde (tarayıcıda Geri) yeni kurulum
      // eski satır içi opaklıkları/spot'u devralmasın; reduced-motion açılıp kapanınca da aynı.
      for (const p of panels) {
        p.el.style.opacity = "";
        p.el.style.visibility = "";
      }
      for (const el of secEls) if (el.hasAttribute("data-spot-count")) el.setAttribute("data-spot", "0");
      antNabiz.style.visibility = "hidden";
      stepper?.destroy();
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
  }, [reducedPref]);

  const reduced = reducedPref === true;

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
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        style={{ opacity: reduced ? 1 : 0 }}
      >
        {/* Poz kabı: kahramanda ortada, anlatı bölümlerinde panelin üstünde/solunda */}
        <div
          ref={poseRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{ willChange: "transform" }}
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

        {/* Stantta: zemin halkası — krem disk, 12 sütun, dönem etiketleri, "Buradasın / Bugün" */}
        <div
          ref={zeminRef}
          className="absolute aspect-square"
          style={{ width: GLOBE_SIZE, opacity: 0, visibility: "hidden", containerType: "inline-size" }}
        >
          <div
            data-zemin-disk
            className="absolute rounded-full"
            style={{
              inset: `${50 - ZEMIN.disk}%`,
              background: EMANET_RENK.krem,
              boxShadow: "0 22px 44px -24px rgb(40 51 47 / 0.55), inset 0 0 0 1.5px rgb(40 51 47 / 0.16)",
            }}
          />
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" fill="none">
            <circle cx={50} cy={50} r={ZEMIN.cizgi} stroke={EMANET_RENK.koyuYesil} strokeOpacity={0.28} strokeWidth={0.3} />
            {/* Yazı boyları ekrana göre (DunyaScene measure: --zemin-et / --zemin-no, en az 11 / 10 px);
                küçük diskte (data-kucuk) sütun numaraları gizlenir, nokta kalır (dunya.css "B: zemin"). */}
            <g data-zemin-etiket style={{ opacity: 0, fontSize: "var(--zemin-et, 2.7px)" }}>
              {zeminEtiketleri.map((e) => {
                const satir = e.kisa.split(" ");
                return (
                  <text
                    key={e.kisa}
                    x={e.x}
                    y={e.y}
                    dy={satir.length > 1 ? undefined : "0.36em"}
                    textAnchor="middle"
                    fontWeight={700}
                    fill={EMANET_RENK.koyuYesil}
                  >
                    {satir.length > 1
                      ? satir.map((s, i) => (
                          <tspan key={s} x={e.x} dy={i === 0 ? "-0.22em" : "1.15em"}>
                            {s}
                          </tspan>
                        ))
                      : e.kisa}
                  </text>
                );
              })}
            </g>
            {zeminSutunlari.map((s) => (
              <g
                key={s.no}
                data-sutun
                className="dn-zemin-sutun"
                style={{ opacity: 0, transformBox: "fill-box", transformOrigin: "center" }}
              >
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={ZEMIN.sutunR}
                  fill={EMANET_RENK.krem}
                  stroke={EMANET_RENK.koyuYesil}
                  strokeWidth={0.35}
                />
                <text
                  x={s.x}
                  y={s.y}
                  dy="0.36em"
                  textAnchor="middle"
                  fontWeight={700}
                  fill={EMANET_RENK.koyuYesil}
                  style={{ fontFamily: SERIF, fontSize: "var(--zemin-no, 2.6px)" }}
                >
                  {s.no}
                </text>
              </g>
            ))}
          </svg>
          <div
            data-zemin-metin
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{ color: EMANET_RENK.koyuYesil, opacity: 0 }}
          >
            <span className="text-[4.1cqw] leading-none font-semibold">{stant.zemin.ust}</span>
            <span className="mt-[0.8cqw] text-[11.5cqw] leading-none" style={{ fontFamily: SERIF, fontWeight: 600 }}>
              {stant.zemin.alt}
            </span>
          </div>
        </div>

        {/* Dönem halkası: Emanet bölümlerinde porthol çevresinde, Stantta zemin halkasında */}
        <div
          ref={halkaRef}
          className="absolute aspect-square"
          style={{ width: GLOBE_SIZE, opacity: 0, visibility: "hidden" }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" fill="none">
            {dilimler.map((d) => (
              <circle
                key={d.ad}
                data-dilim
                cx={50}
                cy={50}
                r={HALKA.r}
                pathLength={360}
                stroke={d.renk}
                strokeWidth={HALKA.w}
                style={{ strokeDasharray: "0 360", strokeDashoffset: -d.a0 }}
              />
            ))}
          </svg>
        </div>

        {/* 12 miras işareti + ad etiketleri (konum/ölçek/opaklık rAF'tan, transform ile) */}
        <div
          ref={isaretRef}
          className="absolute aspect-square"
          style={{ width: GLOBE_SIZE, visibility: "hidden", willChange: "transform" }}
        >
          {isaretler.map((m) => (
            <div
              key={m.no}
              data-isaret={m.no}
              className="absolute top-0 left-0 flex items-center justify-center rounded-full"
              style={{
                width: ISARET_CAP,
                height: ISARET_CAP,
                marginLeft: -ISARET_CAP / 2,
                marginTop: -ISARET_CAP / 2,
                background: EMANET_RENK.krem,
                color: EMANET_RENK.koyuYesil,
                border: `1.5px solid ${EMANET_RENK.koyuYesil}`,
                boxShadow: "0 2px 6px -2px rgb(40 51 47 / 0.5)",
                fontFamily: SERIF,
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1,
                fontVariantNumeric: "lining-nums tabular-nums",
                opacity: 0,
                visibility: "hidden",
                // Zemin 300 ms'de geçer; yazı rengi ortada (150 ms) anlık döner: rakam hiç kaybolmaz.
                transition: "background-color 300ms, color 0s linear 150ms",
              }}
            >
              <span
                data-halo
                className="absolute inset-[-2.5px] rounded-full"
                style={{ border: `2px solid ${EMANET_RENK.nabiz}`, opacity: 0 }}
              />
              {m.no}
            </div>
          ))}
          {isaretler.map((m) => (
            <div
              key={m.no}
              data-etiket={m.no}
              className="absolute top-0 left-0 rounded-[7px] px-[7px] py-[4.5px] text-[12px] leading-none font-bold whitespace-nowrap"
              style={{
                transformOrigin: "0 0",
                background: "rgb(247 230 205 / 0.96)",
                color: EMANET_RENK.koyuYesil,
                boxShadow: "0 4px 12px -6px rgb(40 51 47 / 0.55), inset 0 0 0 1px rgb(40 51 47 / 0.14)",
                opacity: 0,
                visibility: "hidden",
                transition: "background-color 300ms, color 0s linear 150ms",
              }}
            >
              {m.ad}
            </div>
          ))}
        </div>

        {/* Antalya nabzı (8. bölümde dinlenirken): iki halka, Web Animations (compositor) */}
        <div
          ref={antNabizRef}
          className="absolute aspect-square"
          style={{ width: GLOBE_SIZE, visibility: "hidden" }}
        >
          <span data-ant-nokta className="absolute top-0 left-0 block">
            {[0, 1].map((k) => (
              <span
                key={k}
                data-ant-halka
                className="absolute top-0 left-0 block rounded-full"
                style={{ borderStyle: "solid", borderColor: BRAND.orange, opacity: 0 }}
              />
            ))}
          </span>
        </div>
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
                sizes="(max-width: 568px) calc(72vw - 20px), 389px"
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
            <p className="mt-1 text-[12px] font-bold text-brand-teal">
              {backCover.line1} · {cop31.dates}
            </p>
          </div>
        </div>
      </div>

      {/* HUD sayaçları (scroll'a bağlı): Biz kimiz · 12.000 yıllık emanet · Şölen */}
      <div
        ref={hudRef}
        aria-hidden="true"
        className="dn-hud pointer-events-none fixed inset-x-0 top-[calc(max(12px,env(safe-area-inset-top))+44px)] z-30 grid justify-items-center px-4"
        style={{ visibility: "hidden" }}
      >
        <div
          ref={hudYilRef}
          className="flex items-center gap-3 rounded-2xl px-4 py-2 [grid-area:1/1]"
          style={{
            background: "rgb(247 230 205 / 0.95)",
            color: EMANET_RENK.koyuYesil,
            boxShadow: "0 10px 28px -14px rgb(40 51 47 / 0.5), inset 0 0 0 1px rgb(40 51 47 / 0.12)",
            opacity: 0,
            visibility: "hidden",
          }}
        >
          <span
            ref={yearsRef}
            className="block min-w-[4.6ch] text-right text-[30px] leading-none"
            style={{ fontFamily: SERIF, fontWeight: 600, fontVariantNumeric: "lining-nums tabular-nums" }}
          >
            0
          </span>
          <span className="block text-[12px] leading-tight font-bold">
            yıllık
            <br />
            emanet
          </span>
        </div>
        <div
          ref={hudGencRef}
          className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-2.5 shadow-[0_10px_28px_-14px_rgb(27_79_156/0.45)] ring-1 ring-brand-blue/5 [grid-area:1/1]"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <span
            ref={youthRef}
            className="block min-w-[5.4ch] text-right text-[24px] leading-none font-black text-brand-blue tabular-nums"
          >
            0
          </span>
          <span className="block text-[11px] leading-tight font-bold text-brand-teal">
            genç
            <br />
            {facts.solenPlace}
          </span>
        </div>
        <div
          ref={hudUyeRef}
          className="flex items-start gap-4 rounded-2xl bg-white/90 px-4 py-2.5 shadow-[0_10px_28px_-14px_rgb(27_79_156/0.45)] ring-1 ring-brand-blue/5 [grid-area:1/1]"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <div className="min-w-[8.6rem]">
            <span ref={membersRef} className="block text-[24px] leading-none font-black text-brand-blue tabular-nums">
              0
            </span>
            <span className="mt-1 block text-[11px] font-bold text-brand-teal">{stats[0].label}</span>
          </div>
          <span className="mt-1 h-8 w-px bg-brand-mist" />
          <div className="min-w-[2.2rem]">
            <span ref={ilRef} className="block text-[24px] leading-none font-black text-brand-blue tabular-nums">
              0
            </span>
            <span className="mt-1 block text-[11px] font-bold text-brand-teal">{stats[1].label}</span>
          </div>
          <div className="min-w-[3.2rem]">
            <span ref={ilceRef} className="block text-[24px] leading-none font-black text-brand-blue tabular-nums">
              0
            </span>
            <span className="mt-1 block text-[11px] font-bold text-brand-teal">{stats[2].label}</span>
          </div>
        </div>
      </div>

      {/* Bölüm göstergesi: sağ kenarda ince noktalar (yalnızca gösterge, tıklanmaz) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 right-[max(5px,env(safe-area-inset-right))] z-40 -translate-y-1/2"
      >
        <div className="relative flex flex-col items-center" style={{ gap: DOT_STEP - 5 }}>
          {Array.from({ length: BOLUM_SAYISI }, (_, i) => (
            <span key={i} className="size-[5px] rounded-full bg-brand-navy/25" />
          ))}
          <span
            ref={thumbRef}
            className="absolute top-[-5px] left-1/2 -ml-[3.5px] h-[15px] w-[7px] rounded-full bg-brand-blue shadow-[0_0_0_2px_rgb(255_255_255/0.9)]"
          />
        </div>
      </div>

      <Link
        ref={linkRef}
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
