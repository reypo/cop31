/**
 * Konsept A ("Antalya'dan Dünyaya") coğrafi verisi.
 * Koordinatlar il merkezlerinin yaklaşık değerleridir (derece, K/D pozitif).
 * İlçe noktaları gerçek ilçe konumları DEĞİLDİR: il merkezinin çevresine
 * rastgele-ama-deterministik ofsetlerle türetilir (toplam 922, broşürdeki sayı).
 */

import { facts } from "@/lib/content";

export type LatLng = { readonly lat: number; readonly lng: number };

export type Il = LatLng & {
  readonly plate: number;
  readonly name: string;
  /** Göreli ilçe ağırlığı (yaklaşık gerçek ilçe sayısı); 922'ye ölçeklenir. */
  readonly w: number;
  /** İlçe bulutunun merkez kayması (kıyı illerinde noktaları karaya çekmek için). */
  readonly bias?: readonly [number, number];
};

/** 81 il, plaka sırasıyla. */
export const iller: readonly Il[] = [
  { plate: 1, name: "Adana", lat: 37.0, lng: 35.32, w: 15, bias: [0.3, 0] },
  { plate: 2, name: "Adıyaman", lat: 37.76, lng: 38.28, w: 9 },
  { plate: 3, name: "Afyonkarahisar", lat: 38.76, lng: 30.54, w: 18 },
  { plate: 4, name: "Ağrı", lat: 39.72, lng: 43.05, w: 8 },
  { plate: 5, name: "Amasya", lat: 40.65, lng: 35.83, w: 7 },
  { plate: 6, name: "Ankara", lat: 39.93, lng: 32.86, w: 25 },
  { plate: 7, name: "Antalya", lat: 36.89, lng: 30.71, w: 19, bias: [0.4, 0] },
  { plate: 8, name: "Artvin", lat: 41.18, lng: 41.82, w: 9, bias: [-0.15, 0] },
  { plate: 9, name: "Aydın", lat: 37.85, lng: 27.85, w: 17, bias: [0, 0.25] },
  { plate: 10, name: "Balıkesir", lat: 39.65, lng: 27.88, w: 20, bias: [0, 0.25] },
  { plate: 11, name: "Bilecik", lat: 40.14, lng: 29.98, w: 8 },
  { plate: 12, name: "Bingöl", lat: 38.88, lng: 40.5, w: 8 },
  { plate: 13, name: "Bitlis", lat: 38.4, lng: 42.11, w: 7 },
  { plate: 14, name: "Bolu", lat: 40.74, lng: 31.61, w: 9 },
  { plate: 15, name: "Burdur", lat: 37.72, lng: 30.29, w: 11 },
  { plate: 16, name: "Bursa", lat: 40.19, lng: 29.06, w: 17 },
  { plate: 17, name: "Çanakkale", lat: 40.15, lng: 26.41, w: 12, bias: [0, 0.3] },
  { plate: 18, name: "Çankırı", lat: 40.6, lng: 33.62, w: 12 },
  { plate: 19, name: "Çorum", lat: 40.55, lng: 34.95, w: 14 },
  { plate: 20, name: "Denizli", lat: 37.78, lng: 29.09, w: 19 },
  { plate: 21, name: "Diyarbakır", lat: 37.91, lng: 40.23, w: 17 },
  { plate: 22, name: "Edirne", lat: 41.68, lng: 26.56, w: 9, bias: [-0.1, 0.1] },
  { plate: 23, name: "Elazığ", lat: 38.67, lng: 39.22, w: 11 },
  { plate: 24, name: "Erzincan", lat: 39.75, lng: 39.49, w: 9 },
  { plate: 25, name: "Erzurum", lat: 39.9, lng: 41.27, w: 20 },
  { plate: 26, name: "Eskişehir", lat: 39.78, lng: 30.52, w: 14 },
  { plate: 27, name: "Gaziantep", lat: 37.07, lng: 37.38, w: 9 },
  { plate: 28, name: "Giresun", lat: 40.91, lng: 38.39, w: 16, bias: [-0.3, 0] },
  { plate: 29, name: "Gümüşhane", lat: 40.46, lng: 39.48, w: 6 },
  { plate: 30, name: "Hakkari", lat: 37.58, lng: 43.74, w: 5 },
  { plate: 31, name: "Hatay", lat: 36.2, lng: 36.16, w: 15, bias: [0, 0.1] },
  { plate: 32, name: "Isparta", lat: 37.76, lng: 30.55, w: 13 },
  { plate: 33, name: "Mersin", lat: 36.81, lng: 34.64, w: 13, bias: [0.35, -0.2] },
  { plate: 34, name: "İstanbul", lat: 41.01, lng: 28.98, w: 39 },
  { plate: 35, name: "İzmir", lat: 38.42, lng: 27.14, w: 30, bias: [0, 0.35] },
  { plate: 36, name: "Kars", lat: 40.6, lng: 43.1, w: 8 },
  { plate: 37, name: "Kastamonu", lat: 41.38, lng: 33.78, w: 20, bias: [-0.3, 0] },
  { plate: 38, name: "Kayseri", lat: 38.73, lng: 35.48, w: 16 },
  { plate: 39, name: "Kırklareli", lat: 41.73, lng: 27.23, w: 8, bias: [-0.1, 0] },
  { plate: 40, name: "Kırşehir", lat: 39.15, lng: 34.16, w: 7 },
  { plate: 41, name: "Kocaeli", lat: 40.77, lng: 29.92, w: 12 },
  { plate: 42, name: "Konya", lat: 37.87, lng: 32.48, w: 31 },
  { plate: 43, name: "Kütahya", lat: 39.42, lng: 29.98, w: 13 },
  { plate: 44, name: "Malatya", lat: 38.35, lng: 38.31, w: 13 },
  { plate: 45, name: "Manisa", lat: 38.61, lng: 27.43, w: 17, bias: [0, 0.2] },
  { plate: 46, name: "Kahramanmaraş", lat: 37.58, lng: 36.94, w: 11 },
  { plate: 47, name: "Mardin", lat: 37.31, lng: 40.74, w: 10 },
  { plate: 48, name: "Muğla", lat: 37.22, lng: 28.36, w: 13, bias: [0.15, 0.25] },
  { plate: 49, name: "Muş", lat: 38.75, lng: 41.51, w: 6 },
  { plate: 50, name: "Nevşehir", lat: 38.62, lng: 34.71, w: 8 },
  { plate: 51, name: "Niğde", lat: 37.97, lng: 34.68, w: 6 },
  { plate: 52, name: "Ordu", lat: 40.98, lng: 37.88, w: 19, bias: [-0.3, 0] },
  { plate: 53, name: "Rize", lat: 41.02, lng: 40.52, w: 12, bias: [-0.25, 0] },
  { plate: 54, name: "Sakarya", lat: 40.78, lng: 30.4, w: 16 },
  { plate: 55, name: "Samsun", lat: 41.29, lng: 36.33, w: 17, bias: [-0.35, 0] },
  { plate: 56, name: "Siirt", lat: 37.93, lng: 41.94, w: 7 },
  { plate: 57, name: "Sinop", lat: 42.03, lng: 35.15, w: 9, bias: [-0.35, 0] },
  { plate: 58, name: "Sivas", lat: 39.75, lng: 37.02, w: 17 },
  { plate: 59, name: "Tekirdağ", lat: 40.98, lng: 27.51, w: 11, bias: [0.15, 0] },
  { plate: 60, name: "Tokat", lat: 40.31, lng: 36.55, w: 12 },
  { plate: 61, name: "Trabzon", lat: 41.0, lng: 39.72, w: 18, bias: [-0.3, 0] },
  { plate: 62, name: "Tunceli", lat: 39.11, lng: 39.55, w: 8 },
  { plate: 63, name: "Şanlıurfa", lat: 37.16, lng: 38.79, w: 13 },
  { plate: 64, name: "Uşak", lat: 38.68, lng: 29.41, w: 6 },
  { plate: 65, name: "Van", lat: 38.49, lng: 43.38, w: 13 },
  { plate: 66, name: "Yozgat", lat: 39.82, lng: 34.81, w: 14 },
  { plate: 67, name: "Zonguldak", lat: 41.45, lng: 31.79, w: 8, bias: [-0.2, 0] },
  { plate: 68, name: "Aksaray", lat: 38.37, lng: 34.03, w: 8 },
  { plate: 69, name: "Bayburt", lat: 40.26, lng: 40.23, w: 3 },
  { plate: 70, name: "Karaman", lat: 37.18, lng: 33.23, w: 6 },
  { plate: 71, name: "Kırıkkale", lat: 39.85, lng: 33.51, w: 9 },
  { plate: 72, name: "Batman", lat: 37.89, lng: 41.13, w: 6 },
  { plate: 73, name: "Şırnak", lat: 37.52, lng: 42.46, w: 7 },
  { plate: 74, name: "Bartın", lat: 41.63, lng: 32.34, w: 4, bias: [-0.2, 0] },
  { plate: 75, name: "Ardahan", lat: 41.11, lng: 42.7, w: 6 },
  { plate: 76, name: "Iğdır", lat: 39.92, lng: 44.04, w: 4 },
  { plate: 77, name: "Yalova", lat: 40.65, lng: 29.27, w: 6 },
  { plate: 78, name: "Karabük", lat: 41.2, lng: 32.62, w: 6 },
  { plate: 79, name: "Kilis", lat: 36.72, lng: 37.12, w: 4 },
  { plate: 80, name: "Osmaniye", lat: 37.07, lng: 36.25, w: 7 },
  { plate: 81, name: "Düzce", lat: 40.84, lng: 31.16, w: 8 },
];

/** Antalya Expo (Aksu), COP31 alanı — yaklaşık. */
export const ANTALYA_EXPO: LatLng = { lat: 36.94, lng: 30.86 };

/** Türkiye'nin görsel merkezi (küreyi ortalamak için). */
export const TURKIYE_MERKEZ: LatLng = { lat: 39.0, lng: 35.3 };

/** Üsküdar Gençlik Kolları Hatıra Ormanı (İstanbul, yaklaşık). */
export const USKUDAR: LatLng = { lat: 41.03, lng: 29.06 };

function byPlate(plate: number): Il {
  const il = iller.find((x) => x.plate === plate);
  if (!il) throw new Error(`il ${plate} yok`);
  return il;
}

export type Etkinlik = {
  readonly il: Il;
  readonly title: string;
  readonly sub: string;
  /** Etiket konumu: işaretçiye göre yön. */
  readonly side: "right" | "left" | "above" | "below" | "above-left" | "below-left";
  readonly big?: boolean;
};

/** Brief §7-A: Ankara → Osmaniye → Bursa → Samsun → Kocaeli. */
export const etkinlikler: readonly Etkinlik[] = [
  { il: byPlate(6), title: "Ankara", sub: "Söz Gençlikte · 11 Mart 2026", side: "right" },
  { il: byPlate(80), title: "Osmaniye", sub: "Söz Gençlikte · 6 Mart 2026", side: "below" },
  { il: byPlate(16), title: "Bursa", sub: "Söz Gençlikte", side: "below" },
  { il: byPlate(55), title: "Samsun", sub: "Gençlik Buluşması", side: "right" },
  {
    il: byPlate(41),
    title: "Kocaeli",
    sub: `Bir Gençlik Şöleni · ${facts.solenAttendees.toLocaleString("tr-TR")}+ genç`,
    side: "above",
    big: true,
  },
];

type Baskent = LatLng & { readonly name: string };

/** COP31'e gelen dünya: ~40 başkent (yaklaşık koordinatlar). */
export const baskentler: readonly Baskent[] = [
  { name: "Atina", lat: 37.98, lng: 23.73 },
  { name: "Bakü", lat: 40.41, lng: 49.87 },
  { name: "Tiflis", lat: 41.72, lng: 44.78 },
  { name: "Kahire", lat: 30.04, lng: 31.24 },
  { name: "Riyad", lat: 24.71, lng: 46.68 },
  { name: "Tahran", lat: 35.69, lng: 51.39 },
  { name: "Doha", lat: 25.29, lng: 51.53 },
  { name: "Roma", lat: 41.9, lng: 12.5 },
  { name: "Kiev", lat: 50.45, lng: 30.52 },
  { name: "Varşova", lat: 52.23, lng: 21.01 },
  { name: "Berlin", lat: 52.52, lng: 13.4 },
  { name: "Brüksel", lat: 50.85, lng: 4.35 },
  { name: "Paris", lat: 48.86, lng: 2.35 },
  { name: "Londra", lat: 51.51, lng: -0.13 },
  { name: "Madrid", lat: 40.42, lng: -3.7 },
  { name: "Rabat", lat: 34.02, lng: -6.83 },
  { name: "Moskova", lat: 55.76, lng: 37.62 },
  { name: "Astana", lat: 51.17, lng: 71.45 },
  { name: "Taşkent", lat: 41.3, lng: 69.24 },
  { name: "İslamabad", lat: 33.68, lng: 73.05 },
  { name: "Yeni Delhi", lat: 28.61, lng: 77.21 },
  { name: "Dakka", lat: 23.81, lng: 90.41 },
  { name: "Addis Ababa", lat: 9.03, lng: 38.74 },
  { name: "Nairobi", lat: -1.29, lng: 36.82 },
  { name: "Abuja", lat: 9.08, lng: 7.4 },
  { name: "Dakar", lat: 14.72, lng: -17.47 },
  { name: "Pretoria", lat: -25.75, lng: 28.19 },
  { name: "Brasília", lat: -15.79, lng: -47.88 },
  { name: "Buenos Aires", lat: -34.6, lng: -58.38 },
  { name: "Santiago", lat: -33.45, lng: -70.67 },
  { name: "Lima", lat: -12.05, lng: -77.04 },
  { name: "Bogota", lat: 4.71, lng: -74.07 },
  { name: "Meksiko", lat: 19.43, lng: -99.13 },
  { name: "Washington", lat: 38.9, lng: -77.04 },
  { name: "Ottawa", lat: 45.42, lng: -75.7 },
  { name: "Wellington", lat: -41.29, lng: 174.78 },
  { name: "Canberra", lat: -35.28, lng: 149.13 },
  { name: "Tokyo", lat: 35.68, lng: 139.69 },
  { name: "Seul", lat: 37.57, lng: 126.98 },
  { name: "Pekin", lat: 39.9, lng: 116.41 },
  { name: "Cakarta", lat: -6.21, lng: 106.85 },
  { name: "Kuala Lumpur", lat: 3.14, lng: 101.69 },
];

/* ------------------------------------------------------------------ */
/* İlçe noktaları (922)                                                 */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ağırlıkları toplam `total` olacak şekilde tam sayılara dağıtır (en büyük kalan). */
function distribute(weights: readonly number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w * total) / sum);
  const out = raw.map((r) => Math.max(1, Math.floor(r)));
  let diff = total - out.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((x, y) => y.frac - x.frac || x.i - y.i);
  for (let k = 0; diff !== 0 && k < order.length * 4; k++) {
    const i = order[k % order.length].i;
    if (diff > 0) {
      out[i] += 1;
      diff -= 1;
    } else if (out[i] > 1) {
      out[i] -= 1;
      diff += 1;
    }
  }
  return out;
}

type Ilce = LatLng & { readonly il: number /* iller dizisindeki indeks */ };

/** 922 ilçe noktası; her il için ilk nokta il merkezine yakın. */
export const ilceler: readonly Ilce[] = (() => {
  const counts = distribute(
    iller.map((il) => il.w),
    facts.districts,
  );
  const out: Ilce[] = [];
  iller.forEach((il, idx) => {
    const n = counts[idx];
    const rnd = mulberry32(il.plate * 7919 + 17);
    const radius = 0.16 + 0.075 * Math.sqrt(n);
    const [bLat, bLng] = il.bias ?? [0, 0];
    const cosLat = Math.cos((il.lat * Math.PI) / 180);
    for (let j = 0; j < n; j++) {
      if (j === 0) {
        out.push({ lat: il.lat + bLat * 0.2, lng: il.lng + bLng * 0.2, il: idx });
        continue;
      }
      const a = rnd() * Math.PI * 2;
      const r = radius * Math.sqrt(0.08 + 0.92 * rnd());
      out.push({
        lat: il.lat + bLat + r * Math.sin(a) * 0.75,
        lng: il.lng + bLng + (r * Math.cos(a)) / cosLat,
        il: idx,
      });
    }
  });
  return out;
})();

/* ------------------------------------------------------------------ */
/* Sıralamalar                                                          */
/* ------------------------------------------------------------------ */

function angularDistance(a: LatLng, b: LatLng): number {
  const r = Math.PI / 180;
  const s =
    Math.sin(a.lat * r) * Math.sin(b.lat * r) +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.cos((a.lng - b.lng) * r);
  return Math.acos(Math.max(-1, Math.min(1, s)));
}

function rankBy(origin: LatLng): number[] {
  const order = iller
    .map((il, i) => ({ i, d: angularDistance(il, origin) }))
    .sort((x, y) => x.d - y.d)
    .map((x) => x.i);
  const rank = new Array<number>(iller.length);
  order.forEach((i, r) => {
    rank[i] = r;
  });
  return rank;
}

/** İllerin beliriş sırası: Antalya'dan dışa doğru ("Antalya'dan Dünyaya"). */
export const revealRank: readonly number[] = rankBy(ANTALYA_EXPO);

/** Yeşile dönüş dalgası: Üsküdar Hatıra Ormanı'ndan dışa doğru. */
export const greenRank: readonly number[] = rankBy(USKUDAR);

/** Her il için deterministik yaprak açısı (radyan). */
export const leafAngle: readonly number[] = iller.map(
  (il) => ((-50 + ((il.plate * 37) % 100)) * Math.PI) / 180,
);
