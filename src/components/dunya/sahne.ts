/**
 * Konsept A sahne zaman çizelgesi ve küre izdüşümü.
 *
 * "s" (sahne koordinatı) DunyaScene'de scroll konumundan DOM'a bağlı
 * türetilir: k. metin paneli ekran ortasından geçerken s ∈ [k, k+0.5],
 * k. panelden önceki boşluk (~55vh) geçerken s ∈ [k-0.5, k]. Küre
 * "gösterileri" bu boşluklarda olur; panel geçerken küre o aşamada durur.
 * Böylece panel yükseklikleri değişse de küre hareketi panelle senkron kalır.
 *
 * "p" (sahne ilerlemesi, 0–1) kapanış bloğu hariç sayfa ilerlemesidir; final
 * bu değere bağlıdır: küre → kapak fotoğrafı 0.88–0.94, ardından mavi slogan
 * dairesi 0.925–0.96 ve slogan 0.935–0.975 (fotoğraf yerine oturduktan sonra).
 * Harita etiketleri yarı saydam panellerin altına girerken DunyaScene'de
 * ekran uzayında (panel dikdörtgenine uzaklıkla) söndürülür.
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
 * (şekli okunur), Antalya ekran ortasının biraz üstünde ve solunda durur.
 */
const ANT_FOCUS = { lat: 34.7, lng: 33.6 } as const;

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
  /** Kahramanda küre katmanının aşağı kayması (0–1; piksel DunyaScene'de ölçülür). */
  heroShift: number;
  /** Türkiye katmanı genel opaklığı. */
  tr: number;
  /** Belirmiş il sayısı (0–81, kesirli). */
  provinces: number;
  /** Yeşil dalga (0–81, kesirli, Üsküdar sırası). */
  green: number;
  /** Yaprak biçimi (0 nokta – 1 yaprak). */
  leaf: number;
  uskudar: number;
  /** Etkinlik dizisi (0–5, kesirli). */
  events: number;
  eventsAlpha: number;
  /** Antalya aşaması (0–1): ilçeler gizlenir, il noktaları küçülür ve soluklaşır. */
  dim: number;
  antalya: number;
  /** Antalya nabzı canlı mı (işaretçi panelin altına girmeden önce). */
  pulse: boolean;
  /** Dünya katmanı (yaylar) opaklığı. */
  world: number;
  /** Dünya dönüşü ilerlemesi (0–1). */
  rot: number;
  /** Başkentlerin hepsi görünür (reduced-motion). */
  allCapitals: boolean;
  /** WebGL küre katmanı opaklığı (finalde söner). */
  globe: number;
  /** Final: küre → kapak fotoğrafı geçişi (0–1; p 0.88–0.94). */
  finale: number;
  /** Final: sol alttaki lacivert→mavi daire. */
  disc: number;
  /** Final: dairedeki el yazısı slogan. */
  slogan: number;
  /** Final: yaylar ve kesik yarım halka. */
  orbits: number;
  hud: number;
  counter: number;
  porthole: number;
};

/**
 * Reduced-motion: s'yi bölümün sabit karesine yuvarlar. Kesme noktası
 * boşluğun ortası (k + 0.75): önceki panel ekrandan çıkmış, sonraki henüz
 * girmemişken sahne değişir; panel ekrandayken arkadaki sahne hep kendi aşamasıdır.
 */
export function quantize(s: number): number {
  const k = Math.max(0, Math.min(6, Math.floor(s + 0.25)));
  return k === 0 ? 0 : k + 0.25;
}

/**
 * Sahne durumu. `s` sahne koordinatı, `p` sahne ilerlemesi (0–1, kapanış
 * bloğu hariç). `idle` kahraman ekranındaki boşta dönüş açısı (rad);
 * reduced-motion'da 0 verilir.
 */
export function sceneAt(s: number, p: number, idle: number, reduced: boolean): Scene {
  // Kahraman → Türkiye
  const rot0 = smooth(map(s, 0.08, 0.52));
  const zoomTR = smooth(map(s, 0.46, 0.76));
  // Türkiye → Antalya
  const toAnt = smooth(map(s, 3.55, 3.86));
  // Antalya → Dünya
  const out = smooth(map(s, 4.5, 4.8));
  const rot = reduced ? 0 : smooth(map(s, 4.62, 5.7));

  let phi: number;
  let theta: number;
  if (s < 4.5) {
    const heroOff = (1 - rot0) * wrapPi(HERO_OFFSET - idle);
    phi = lerp(PHI_TR + heroOff, PHI_ANT, toAnt);
    theta = lerp(lerp(THETA_HERO, THETA_TR, rot0), THETA_ANT, toAnt);
  } else {
    phi = lerp(PHI_ANT, PHI_WORLD, out) + rot * TAU;
    theta = lerp(THETA_ANT, THETA_WORLD, out);
  }
  const scale = lerpLog(
    lerpLog(lerpLog(SCALE_HERO, SCALE_TR, zoomTR), SCALE_ANT, toAnt),
    SCALE_WORLD,
    out,
  );

  const zoomness = clamp01(Math.log(Math.max(1, scale)) / Math.log(4));
  // Yakınlaşınca kara noktaları çok büyür/bulanıklaşır: soluklaştır, il katmanı öne çıksın.
  const mapBrightness = lerp(0.82, 0.16, zoomness);

  const tr = map(s, 0.5, 0.6) * (1 - map(s, 4.5, 4.62));
  const provinces = 81 * map(s, 0.56, 0.92);
  const green = 81 * map(s, 1.55, 1.9);
  const leaf = map(s, 1.6, 1.85) * (1 - map(s, 2.5, 2.6));
  const uskudar = map(s, 1.74, 1.86) * (1 - map(s, 2.5, 2.58));
  const events = 5 * map(s, 2.6, 2.95);
  const eventsAlpha = map(s, 2.56, 2.62) * (1 - map(s, 3.5, 3.6));
  const dim = smooth(map(s, 3.55, 3.8));
  const antalya = map(s, 3.7, 3.86) * (1 - map(s, 4.5, 4.58));
  const world = map(s, 4.58, 4.72);
  const hero = 1 - map(s, 0.45, 0.55);

  // Final (p'ye bağlı). Reduced-motion: geçişsiz, tek eşik.
  const fin = reduced ? (p >= 0.9 ? 1 : 0) : map(p, 0.88, 0.94);

  return {
    cam: { phi, theta, scale },
    mapBrightness,
    markerColor: s < 3 ? GL_COLORS.orange : GL_COLORS.green,
    hero,
    motifs: 1 - smooth(map(s, 0.36, 0.52)),
    motifTurn: reduced ? 0 : smooth(map(s, 0, 0.52)),
    heroShift: 1 - smooth(map(s, 0.12, 0.52)),
    tr,
    provinces,
    green,
    leaf,
    uskudar,
    events,
    eventsAlpha,
    dim,
    antalya,
    pulse: !reduced && antalya > 0.01 && s < 4.1,
    world,
    rot,
    allCapitals: reduced,
    // Fotoğraf (üst katman) hızla opaklaşır, küre altında söner: çift görüntü kısa
    // sürer; masaüstünde fotoğrafın örtmediği küre kenarı da erken kaybolur.
    globe: reduced ? 1 - fin : 1 - smooth(map(fin, 0.1, 0.55)),
    finale: fin,
    disc: reduced ? fin : map(p, 0.925, 0.96),
    slogan: reduced ? fin : map(p, 0.935, 0.975),
    orbits: reduced ? fin : map(p, 0.9, 0.98),
    hud: map(s, 0.54, 0.62) * (1 - map(s, 1.12, 1.24)),
    counter: map(s, 0.56, 0.92),
    porthole: clamp01((scale - 1.3) / 2),
  };
}

/** Bir başkentin dünya aşamasındaki görünürlüğü (0–1). */
export function capitalReveal(i: number, sc: Scene): number {
  if (sc.world <= 0) return 0;
  if (sc.allCapitals) return 1;
  return clamp01((sc.rot - capitalAppear[i]) / CAPITAL_GROW);
}
