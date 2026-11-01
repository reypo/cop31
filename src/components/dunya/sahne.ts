/**
 * Konsept A sahne zaman çizelgesi ve küre izdüşümü.
 *
 * Sayfa bölüm bölüm ilerler (DunyaScene + adim.ts). Sahne koordinatı
 * "t" = bölüm index'i + bölümler arası geçiş ilerlemesi:
 *   - k. bölüm "dinlenme" hâlindeyken (bölümün üstü viewport üstünde ya da
 *     uzun bölümün içinde kaydırılırken) t = k ve sahne SABİTTİR;
 *   - k → k+1 geçişinde (k. bölümün altı viewport altından k+1'in üstü
 *     viewport üstüne gelene dek, tam bir ekran boyu) t ∈ (k, k+1).
 * Her animasyon vuruşu bu geçiş aralıklarından birinde oynar ve tamsayı
 * t'de biter: bir bölümde durulduğunda yarım kalmış hareket olmaz.
 *
 * Bölümler (docs/brief-dunya-2.md §1, 13 bölüm):
 *   0 kahraman · 1 Biz kimiz · 2 Emanet girişi · 3 Emanet I (alan 1–6) ·
 *   4 Emanet II (alan 7–12) · 5 İklim eylemleri · 6 Gençlik Buluşmaları ·
 *   7 Gençlik Şölenleri · 8 COP31 Antalya · 9 Stantta · 10 Dünya ·
 *   11 Kapak finali · 12 Kapanış bloğu.
 *
 * Geçiş vuruşları (k → k+1; her tamsayı t'de tüm değerler tamamlanmış):
 *   0→1  dönüş + Türkiye'ye zoom, 81 il, üye sayacı
 *   1→2  il noktaları kum tonuna söner; dönem halkası çizilir; 12 işaret
 *        1'den 12'ye yükselir; "12.000 yıllık emanet" sayacı
 *   2→3  kamera batıya (alan 1–6); 1–6 büyür + ad etiketleri, 7–12 soluklaşır
 *   3→4  kamera doğuya (alan 7–12); tersi
 *   4→5  işaretler + halka söner, iller maviye döner; yeşil dalga + yaprak, Üsküdar
 *   5→6  buluşma izi Ankara → … → Kocaeli
 *   6→7  iz söner, Kocaeli büyük nabız (kamera hafif yakın); "100.000+ genç" sayacı
 *   7→8  Antalya'ya zoom + nabız
 *   8→9  küre söner; porthol yerinde zemin halkası (krem disk + dönem halkası +
 *        "Buradasın / Bugün")
 *   9→10 zemin söner, küre geri; geri çekilme + tam tur + başkentler + yaylar
 *   10→11 kapak fotoğrafı morph'u + slogan dairesi + yaylar
 *
 * İzdüşüm cobe 0.6.4 shader'ından türetildi:
 *   dünya konumu  v = [-cos(lat)cos(lng-π), sin(lat), cos(lat)sin(lng-π)]
 *   görünüm       h = R(phi, theta) · v ,  h.z > 0 ise ön yüz
 *   ekran         (x, y) = merkez + (h.x, -h.y) · 0.8 · scale · (boyut / 2)
 */

import {
  ANTALYA_EXPO,
  TURKIYE_MERKEZ,
  baskentler,
  type LatLng,
} from "./iller";

const D2R = Math.PI / 180;
export const TAU = Math.PI * 2;

export type Vec3 = readonly [number, number, number];
export type RGB = [number, number, number];

export const clamp01 = (v: number) => (v > 0 ? (v < 1 ? v : 1) : 0);
export const map = (s: number, a: number, b: number) => clamp01((s - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const easeOut = (t: number) => {
  const x = 1 - clamp01(t);
  return 1 - x * x * x;
};
/** Ölçek için logaritmik ara değer (zoom eşit hızda hissedilsin). */
const lerpLog = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));
/** Açıyı (-π, π] aralığına sarar. */
const wrapPi = (a: number) => a - TAU * Math.floor((a + Math.PI) / TAU);

export function toVec(p: LatLng): Vec3 {
  const la = p.lat * D2R;
  const lo = p.lng * D2R - Math.PI;
  const c = Math.cos(la);
  return [-c * Math.cos(lo), Math.sin(la), c * Math.sin(lo)];
}

/** Verilen konumu küre merkezine getiren phi/theta (cobe). */
const focusPhi = (lng: number) => 1.5 * Math.PI - lng * D2R;
const focusTheta = (lat: number) => lat * D2R;

export type Cam = { phi: number; theta: number; scale: number };

/** Ekran izdüşümü; çıktı `out` dizisine yazılır: [x, y, hz]. */
export type Projector = (v: Vec3, r: number, out: Float64Array) => void;

export function makeProjector(cam: Cam, size: number): Projector {
  const cp = Math.cos(cam.phi);
  const sp = Math.sin(cam.phi);
  const ct = Math.cos(cam.theta);
  const st = Math.sin(cam.theta);
  const half = size / 2;
  const k = 0.8 * cam.scale * half;
  return (v, r, out) => {
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const hx = cp * x + sp * z;
    const hy = sp * st * x + ct * y - cp * st * z;
    const hz = -sp * ct * x + st * y + cp * ct * z;
    out[0] = half + hx * k * r;
    out[1] = half - hy * k * r;
    out[2] = hz;
  };
}

/* ------------------------------------------------------------------ */
/* Renkler                                                              */
/* ------------------------------------------------------------------ */

const hex = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

export const BRAND = {
  blue: "#0C77B6",
  navy: "#1B4F9C",
  green: "#47B27A",
  teal: "#1F8879",
  orange: "#F08322",
  ink: "#555454",
} as const;

export const GL_COLORS = {
  base: [0.76, 0.84, 0.92] as RGB, // açık mavi-gri
  glow: [0.78, 0.88, 1.0] as RGB, // açık mavi
  orange: hex(BRAND.orange),
  green: hex(BRAND.green),
};

/* ------------------------------------------------------------------ */
/* Sabit konumlar                                                       */
/* ------------------------------------------------------------------ */

/**
 * Antalya aşamasının odağı: Antalya'nın kendisi değil, Antalya ile Türkiye
 * merkezi arasında, biraz güneyde. Böylece Türkiye'nin tamamı diskte kalır
 * (şekli okunur), Antalya diskin ortasına yakın, biraz solunda durur
 * (küre panelin üstündeki sahne alanında tamamen görünür).
 */
const ANT_FOCUS = { lat: 36.4, lng: 33.2 } as const;

/**
 * Emanet I (alan 1–6, batı ve orta Anadolu) ve Emanet II (alan 7–12, orta ve
 * doğu) kameraları: grup porthol içinde ortalanır, etiketlere yer kalır.
 * Şölen: Kocaeli'ye hafif yakınlaşma (Marmara + İç Anadolu diskte kalır).
 */
const G1_FOCUS = { lat: 38.75, lng: 31.6 } as const;
const G2_FOCUS = { lat: 39.2, lng: 36.1 } as const;
const KOC_FOCUS = { lat: 39.6, lng: 32.6 } as const;
const SCALE_G1 = 7.4;
const SCALE_G2 = 6.3;
const SCALE_KOC = 6.6;

const PHI_TR = focusPhi(TURKIYE_MERKEZ.lng);
const THETA_TR = focusTheta(TURKIYE_MERKEZ.lat);
const PHI_ANT = focusPhi(ANT_FOCUS.lng);
const THETA_ANT = focusTheta(ANT_FOCUS.lat);
/** Dünya aşaması Antalya boylamından döner (yaylar Antalya'dan çıkar). */
const PHI_WORLD = focusPhi(ANTALYA_EXPO.lng);
const THETA_HERO = 0.5; // Türkiye dikeyde ortaya yakın (masaüstünde başlık panelinin altında kalmasın)
const THETA_WORLD = 0.42;

/** Kahramanda küre biraz küçük: çevresindeki kapak motiflerine (yaylar) yer kalsın. */
const SCALE_HERO = 0.9;
const SCALE_TR = 5.9;
/** Türkiye'nin şekli hâlâ okunur; Türkiye aşamasına göre hafif yakınlaşma + Antalya'ya kayma. */
const SCALE_ANT = 6.8;
export const SCALE_WORLD = 1.02;

/** Kahraman ekranında Türkiye'nin merkeze göre başlangıç açısı (doğuda). */
const HERO_OFFSET = 0.75;
/** Kahraman ekranındaki boşta dönüş hızı (rad/sn). */
export const IDLE_SPEED = 0.09;

/* Dünya aşaması: başkentlerin dönüşle birlikte beliriş anları (0–1). */
const VISIBLE_HALF = 70;
const wrap180 = (d: number) => d - 360 * Math.floor((d + 180) / 360);
const capitalAppear: readonly number[] = baskentler.map((c) => {
  const d0 = wrap180(c.lng - ANTALYA_EXPO.lng);
  if (Math.abs(d0) <= VISIBLE_HALF) return 0.01 + (0.12 * Math.abs(d0)) / VISIBLE_HALF;
  if (d0 < -VISIBLE_HALF) return (-VISIBLE_HALF - d0) / 360;
  return (360 - VISIBLE_HALF - d0) / 360;
});
const CAPITAL_GROW = 0.06;

/* ------------------------------------------------------------------ */
/* Sahne                                                                */
/* ------------------------------------------------------------------ */

export type Scene = {
  cam: Cam;
  mapBrightness: number;
  markerColor: RGB;
  /** Kahraman: Antalya işaretçisi + etiketi. */
  hero: number;
  /** Kahraman çevresindeki kapak motifleri (iki mavi yay + kesik yarım halka) opaklığı. */
  motifs: number;
  /** Motiflerin scroll'a bağlı yavaş dönüşü (0–1; derece DunyaScene'de). */
  motifTurn: number;
  /** Kahraman pozundan bölüm pozuna geçiş (1 = kahraman; katman konumu DunyaScene'de ölçülür). */
  heroShift: number;
  /** Türkiye katmanı genel opaklığı. */
  tr: number;
  /** Belirmiş il sayısı (0–81, kesirli). */
  provinces: number;
  /** İl noktalarının kum tonuna dönüşü (Emanet bölümleri, 0–1). */
  sand: number;
  /** Yeşil dalga (0–81, kesirli, Üsküdar sırası). */
  green: number;
  /** Yaprak biçimi (0 nokta – 1 yaprak). */
  leaf: number;
  uskudar: number;
  /** Etkinlik dizisi (0–5, kesirli). */
  events: number;
  eventsAlpha: number;
  /** Şölen: Kocaeli dışındaki buluşma noktalarının opaklığı (6 → 7'de söner). */
  eventsOthers: number;
  /** Şölen: Kocaeli büyük nabzı (0–1, geçişe bağlı; 1 = sakin halka). */
  kocaeli: number;
  /** Antalya aşaması (0–1): ilçeler gizlenir, il noktaları küçülür ve soluklaşır. */
  dim: number;
  antalya: number;
  /** Antalya nabzı canlı mı (Antalya bölümü ve ona geçiş). */
  pulse: boolean;
  /** Emanet: 12 işaretin genel opaklığı (4 → 5'te söner). */
  marks: number;
  /** Emanet: yükselen işaret sayısı (0–12, kesirli; 1'den 12'ye sırayla). */
  rise: number;
  /** Emanet I (1–6) / Emanet II (7–12) vurgusu (0–1). */
  emphI: number;
  emphII: number;
  /** Dönem halkası opaklığı ve çizim ilerlemesi (0–1, üstten saat yönünde). */
  ring: number;
  ringDraw: number;
  /** Stantta: zemin halkası opaklığı (krem disk, dönem etiketleri, "Buradasın / Bugün"). */
  ground: number;
  /** Stantta: zemin halkasının kuruluş ilerlemesi (8 → 9; disk, sütunlar, etiketler sırayla). */
  groundIn: number;
  /** Dünya katmanı (yaylar) opaklığı. */
  world: number;
  /** Dünya dönüşü ilerlemesi (0–1). */
  rot: number;
  /** Başkentlerin hepsi görünür (reduced-motion). */
  allCapitals: boolean;
  /** WebGL küre katmanı opaklığı (zemin halkasında ve finalde söner). */
  globe: number;
  /** Final: küre → kapak fotoğrafı geçişi (0–1; t 10.0–10.55). */
  finale: number;
  /** Final: sol alttaki lacivert→mavi daire. */
  disc: number;
  /** Final: dairedeki el yazısı slogan. */
  slogan: number;
  /** Final: yaylar ve kesik yarım halka. */
  orbits: number;
  /** HUD: üye sayacı (Biz kimiz) — opaklık + sayaç (0–1). */
  hud: number;
  counter: number;
  /** HUD: "12.000 yıllık emanet" (Emanet girişi). */
  hudYears: number;
  years: number;
  /** HUD: "100.000+ genç" (Şölen). */
  hudYouth: number;
  youth: number;
  porthole: number;
};

/** Bölüm sayısı (kapanış bloğu dahil). */
export const BOLUM_SAYISI = 13;

/** Spot döngüsünün kürede işlendiği bölümler: Emanet I (alan 1–6), Emanet II (alan 7–12). */
export const EMANET_I = 3;
export const EMANET_II = 4;

/**
 * Reduced-motion: sahne her zaman bir bölümün dinlenme karesindedir; kesme
 * noktası geçişin ortası (iki panel de ekranın ortasından uzaktayken).
 */
export function quantize(t: number): number {
  return Math.max(0, Math.min(BOLUM_SAYISI - 1, Math.round(t)));
}

type CamKey = { phi: number; theta: number; scale: number };
const camAt = (f: LatLng, scale: number): CamKey => ({ phi: focusPhi(f.lng), theta: focusTheta(f.lat), scale });
const CAM_G1 = camAt(G1_FOCUS, SCALE_G1);
const CAM_G2 = camAt(G2_FOCUS, SCALE_G2);
const CAM_KOC = camAt(KOC_FOCUS, SCALE_KOC);
const CAM_TR: CamKey = { phi: PHI_TR, theta: THETA_TR, scale: SCALE_TR };
const CAM_ANT: CamKey = { phi: PHI_ANT, theta: THETA_ANT, scale: SCALE_ANT };

/** Kamerayı `to` anahtarına `e` (0–1) oranında yaklaştırır (yerinde). */
function towards(c: CamKey, to: CamKey, e: number) {
  if (e <= 0) return;
  c.phi = lerp(c.phi, to.phi, e);
  c.theta = lerp(c.theta, to.theta, e);
  c.scale = lerpLog(c.scale, to.scale, e);
}

/**
 * Sahne durumu. `t` sahne koordinatı (bkz. dosya başı), `idle` kahraman
 * ekranındaki boşta dönüş açısı (rad); reduced-motion'da 0 verilir.
 * Tüm aralıklar [k, k+1] geçişlerinin içindedir ve tamsayı t'de tamamlanır.
 */
export function sceneAt(t: number, idle: number, reduced: boolean): Scene {
  // 0 → 1: kahraman → Türkiye (dönüş, yakınlaşma, iller, sayaç)
  const rot0 = smooth(map(t, 0.0, 0.62));
  const zoomTR = smooth(map(t, 0.28, 0.86));
  // 9 → 10: Antalya → Dünya (geri çekilme + tam tur, başkentler)
  const out = smooth(map(t, 9.0, 9.42));
  const rot = reduced ? (t >= 9.5 ? 1 : 0) : smooth(map(t, 9.14, 9.97));

  let phi: number;
  let theta: number;
  let scale: number;
  if (t < 9) {
    const heroOff = (1 - rot0) * wrapPi(HERO_OFFSET - idle);
    const c: CamKey = {
      phi: PHI_TR + heroOff,
      theta: lerp(THETA_HERO, THETA_TR, rot0),
      scale: lerpLog(SCALE_HERO, SCALE_TR, zoomTR),
    };
    // Anahtar kareler sırayla; her pencerenin dışında oran 0 ya da 1.
    towards(c, CAM_G1, smooth(map(t, 2.0, 2.62))); // 2 → 3: Emanet I
    towards(c, CAM_G2, smooth(map(t, 3.0, 3.62))); // 3 → 4: Emanet II
    towards(c, CAM_TR, smooth(map(t, 4.0, 4.4))); // 4 → 5: tüm Türkiye (yeşil dalga)
    towards(c, CAM_KOC, smooth(map(t, 6.04, 6.6))); // 6 → 7: Kocaeli
    towards(c, CAM_ANT, smooth(map(t, 7.1, 7.8))); // 7 → 8: Antalya
    phi = c.phi;
    theta = c.theta;
    scale = c.scale;
  } else {
    phi = lerp(PHI_ANT, PHI_WORLD, out) + rot * TAU;
    theta = lerp(THETA_ANT, THETA_WORLD, out);
    scale = lerpLog(SCALE_ANT, SCALE_WORLD, out);
  }

  const zoomness = clamp01(Math.log(Math.max(1, scale)) / Math.log(4));
  // Yakınlaşınca kara noktaları çok büyür/bulanıklaşır: soluklaştır, il katmanı öne çıksın.
  const mapBrightness = lerp(0.82, 0.16, zoomness);

  const tr = map(t, 0.44, 0.58) * (1 - map(t, 9.0, 9.12));
  const provinces = 81 * map(t, 0.48, 0.97);
  // 1 → 2: iller kum tonuna söner; 4 → 5: maviye döner (yeşil dalgadan önce).
  const sand = smooth(map(t, 1.04, 1.4)) * (1 - smooth(map(t, 4.02, 4.24)));
  // 1 → 2: 12 işaret sırayla yükselir; dönem halkası üstten saat yönünde çizilir.
  const rise = 12 * map(t, 1.24, 1.9);
  const marks = map(t, 1.2, 1.26) * (1 - smooth(map(t, 4.0, 4.2)));
  const emphI = smooth(map(t, 2.08, 2.56)) * (1 - smooth(map(t, 3.04, 3.42)));
  const emphII = smooth(map(t, 3.42, 3.9)) * (1 - smooth(map(t, 4.0, 4.16)));
  // 8 → 9: küre söner, zemin halkası belirir; 9 → 10: zemin söner, küre geri.
  const groundIn = map(t, 8.3, 8.96);
  const ground = smooth(map(t, 8.3, 8.6)) * (1 - smooth(map(t, 9.0, 9.22)));
  const ringEmanet = smooth(map(t, 1.06, 1.2)) * (1 - smooth(map(t, 4.0, 4.2)));
  const ringGround = smooth(map(t, 8.3, 8.5)) * (1 - smooth(map(t, 9.0, 9.22)));
  const ringDraw = t < 6 ? smooth(map(t, 1.1, 1.78)) : smooth(map(t, 8.34, 8.96));
  const globeAway = smooth(map(t, 8.04, 8.42)) * (1 - smooth(map(t, 9.0, 9.26)));

  // 4 → 5: iller yeşile döner, yaprak olur; Üsküdar Hatıra Ormanı.
  const green = 81 * map(t, 4.25, 4.82);
  const leaf = map(t, 4.38, 4.88) * (1 - map(t, 5.12, 5.32));
  const uskudar = map(t, 4.72, 4.94) * (1 - map(t, 5.08, 5.26));
  // 5 → 6: buluşma izi (Ankara → … → Kocaeli); 6 → 7: iz söner, Kocaeli nabız.
  const events = 5 * map(t, 5.34, 5.96);
  const eventsAlpha = map(t, 5.28, 5.36) * (1 - map(t, 7.04, 7.2));
  const eventsOthers = 1 - smooth(map(t, 6.02, 6.3));
  const kocaeli = map(t, 6.08, 6.94);
  // 7 → 8: Antalya.
  const dim = smooth(map(t, 7.1, 7.7));
  const antalya = map(t, 7.55, 7.86) * (1 - map(t, 9.0, 9.1));
  const world = map(t, 9.1, 9.24);
  const hero = 1 - map(t, 0.0, 0.24);

  // 10 → 11: küre → kapak fotoğrafı, ardından slogan dairesi ve yaylar.
  const fin = map(t, 10.0, 10.55);

  return {
    cam: { phi, theta, scale },
    mapBrightness,
    markerColor: t < 9.05 ? GL_COLORS.orange : GL_COLORS.green,
    hero,
    motifs: 1 - smooth(map(t, 0.04, 0.42)),
    motifTurn: reduced ? 0 : smooth(map(t, 0, 0.6)),
    heroShift: 1 - smooth(map(t, 0.08, 0.7)),
    tr,
    provinces,
    sand,
    green,
    leaf,
    uskudar,
    events,
    eventsAlpha,
    eventsOthers,
    kocaeli,
    dim,
    antalya,
    pulse: !reduced && antalya > 0.01,
    marks,
    rise,
    emphI,
    emphII,
    ring: Math.max(ringEmanet, ringGround),
    ringDraw,
    ground,
    groundIn,
    world,
    rot,
    allCapitals: reduced,
    // Fotoğraf (üst katman) hızla opaklaşır, küre altında söner: çift görüntü kısa sürer.
    globe: (1 - smooth(map(fin, 0.1, 0.55))) * (1 - globeAway),
    finale: fin,
    disc: map(t, 10.42, 10.76),
    slogan: map(t, 10.54, 10.9),
    orbits: map(t, 10.18, 10.95),
    hud: map(t, 0.34, 0.5) * (1 - map(t, 1.0, 1.16)),
    counter: map(t, 0.48, 0.97),
    hudYears: map(t, 1.28, 1.42) * (1 - map(t, 2.0, 2.16)),
    years: smooth(map(t, 1.32, 1.94)),
    hudYouth: map(t, 6.3, 6.44) * (1 - map(t, 7.0, 7.16)),
    youth: smooth(map(t, 6.34, 6.94)),
    porthole: clamp01((scale - 1.3) / 2),
  };
}

/** Bir başkentin dünya aşamasındaki görünürlüğü (0–1). */
export function capitalReveal(i: number, sc: Scene): number {
  if (sc.world <= 0) return 0;
  if (sc.allCapitals) return 1;
  return clamp01((sc.rot - capitalAppear[i]) / CAPITAL_GROW);
}
