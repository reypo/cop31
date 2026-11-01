/**
 * "12.000 Yıllık Emanet" sahne geometrisi (Konsept A, brief-dunya-2 §1–§2).
 *
 * - 12 miras işareti: konum (küre vektörü), grup (Emanet I: 1–6, Emanet II: 7–12),
 *   kürede kısa ad; sahne durumundan işaret ölçeği/opaklığı.
 * - Etiket yerleşimi: porthol dairesinin ve ekranın görünür kısmının içinde,
 *   arka yüzde gizli. Etiketin yönü (sağ/sol/üst/alt…) bölümün dinlenme
 *   kamerasında bir kez seçilir (açgözlü, çakışmasız); geçişte yön değişmez,
 *   etiket yalnızca daireye/ekrana sığacak kadar kaydırılır.
 * - Dönem halkası: `donemler` dilimleri (kronolojik, üstten saat yönünde),
 *   çizim ilerlemesine göre dilim uzunlukları (stroke-dasharray, pathLength 360).
 * - Zemin halkası (Stantta): dönem etiketi ve 12 sütun noktası konumları.
 * - Nabız eğrisi.
 *
 * Koordinatlar: işaret/etiket katmanı küre tuvaliyle aynı kutudadır (boyut ×
 * boyut CSS px); halka/zemin SVG'leri viewBox 0 0 100 100.
 */

import { donemler, emanetAlanlari } from "@/lib/emanet";
import { stant } from "@/lib/stant";
import { clamp01, easeOut, toVec, type Projector, type Scene, type Vec3 } from "./sahne";

/* ------------------------------------------------------------------ */
/* Renkler (standın dili: krem, koyu yeşil; vurgu marka turuncusu)     */
/* ------------------------------------------------------------------ */

export const EMANET_RENK = {
  krem: stant.palet.krem,
  koyuYesil: stant.palet.koyuYesil,
  /** Nabız halkası: marka turuncusu (pin rengi). */
  nabiz: "#F08322",
  /** İl noktalarının Emanet bölümlerindeki kum tonu (ahşabın açığı). */
  kum: "#CDB48E",
} as const;

/** Serif rakam/başlık yazı tipi (Lora, /dunya sarmalayıcısında `--font-serif`). */
export const SERIF = "var(--font-serif), Georgia, 'Times New Roman', serif";

/* ------------------------------------------------------------------ */
/* 12 işaret                                                            */
/* ------------------------------------------------------------------ */

export type EtiketYonu = "right" | "left" | "above" | "below" | "above-right" | "below-right" | "above-left" | "below-left";

export type Isaret = {
  readonly no: number;
  /** Kürede gösterilen ad (uzun adlar kısaltılır; tam ad panel listesinde). */
  readonly ad: string;
  readonly vec: Vec3;
  /** 0: Emanet I (alan 1–6), 1: Emanet II (alan 7–12). */
  readonly grup: 0 | 1;
  /** Tercih edilen etiket yönü (yer yoksa diğer yönler denenir). */
  readonly yon: EtiketYonu;
};

const KISA_AD: Readonly<Record<number, string>> = {
  6: "Derinkuyu",
  7: "Sultanhanı",
  8: "Çifte Minareli",
  9: "Hevsel",
  11: "Lületaşı",
};

/** Kabaca coğrafyaya göre: batı kıyısındakiler sola, doğudakiler sağa. */
const YON: Readonly<Record<number, EtiketYonu>> = {
  1: "above",
  2: "right",
  3: "left",
  4: "left",
  5: "below",
  6: "right",
  7: "below",
  8: "left",
  9: "below",
  10: "above",
  11: "left",
  // "below-left" iken Göbeklitepe etiketi 9'a (Hevsel) daha yakın duruyordu.
  12: "left",
};

export const isaretler: readonly Isaret[] = emanetAlanlari.map((a) => ({
  no: a.no,
  ad: KISA_AD[a.no] ?? a.ad,
  vec: toVec(a),
  grup: a.no <= 6 ? 0 : 1,
  yon: YON[a.no] ?? "right",
}));

/** İşaret çapı (CSS px, ölçek 1'de). */
export const ISARET_CAP = 19;

export type IsaretDurumu = {
  /** Opaklık (0–1). */
  o: number;
  /** Ölçek (etiket boyu çarpanı hariç). */
  s: number;
  /** Yükselişte aşağıdan kayma (px). */
  dy: number;
  /** Etiket görünürlüğü (grup vurgusu, 0–1). */
  etiket: number;
};

/**
 * i. işaretin (0 tabanlı) sahne durumundaki görünümü, `out`'a yazılır.
 * 1 → 2: sırayla yükselir (hafif taşmayla büyür); 2 → 3 / 3 → 4: vurgulanan
 * grup büyür, diğeri küçülüp soluklaşır; 4 → 5: hepsi söner.
 */
export function isaretDurumu(sc: Scene, i: number, out: IsaretDurumu): void {
  const a = clamp01(sc.rise - i);
  if (a <= 0 || sc.marks <= 0.001) {
    out.o = 0;
    out.s = 0;
    out.dy = 0;
    out.etiket = 0;
    return;
  }
  const g = isaretler[i].grup;
  const emph = g === 0 ? sc.emphI : sc.emphII;
  const other = g === 0 ? sc.emphII : sc.emphI;
  const pop = easeOut(a) * (1 + 0.28 * Math.sin(Math.PI * a));
  out.s = Math.max(0.01, pop * (1 + 0.24 * emph) * (1 - 0.34 * other));
  out.o = sc.marks * Math.min(1, a * 3) * (1 - 0.6 * other);
  out.dy = (1 - easeOut(a)) * 16;
  out.etiket = emph * sc.marks;
}

/**
 * Üst üste binen işaretleri ayırır (2. bölüm: hepsi eşit boyda, Türkiye
 * kamerasında Derinkuyu–Sultanhanı gibi yakın çiftler). `noktalar` [x, y]
 * (px), `cap` işaret çapı (px); dönüş: her işaret için [dx, dy] kayması.
 * Vurgu (3, 4) büyüdükçe kayma sıfırlanır (DunyaScene), işaret gerçek yerine oturur.
 */
export function ayristir(noktalar: readonly (readonly [number, number])[], cap: number): [number, number][] {
  const p = noktalar.map(([x, y]) => [x, y] as [number, number]);
  const min = cap * 1.08;
  for (let tur = 0; tur < 4; tur++) {
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const dx = p[j][0] - p[i][0];
        const dy = p[j][1] - p[i][1];
        const d = Math.hypot(dx, dy);
        if (d >= min) continue;
        const ux = d > 1e-6 ? dx / d : 1;
        const uy = d > 1e-6 ? dy / d : 0;
        const h = (min - d) / 2;
        p[i][0] -= ux * h;
        p[i][1] -= uy * h;
        p[j][0] += ux * h;
        p[j][1] += uy * h;
      }
    }
  }
  return p.map(([x, y], i) => [x - noktalar[i][0], y - noktalar[i][1]]);
}

/* ------------------------------------------------------------------ */
/* Etiket yerleşimi                                                     */
/* ------------------------------------------------------------------ */

export type Daire = { cx: number; cy: number; r: number };
export type Alan = { l: number; t: number; r: number; b: number };

/** Etiketin işarete uzaklığı (px, etiket ölçeği 1'de). */
const ETIKET_ARA = 7;

/**
 * Yöne göre kutunun sol üst köşesi. (x, y) işaret merkezi; w/h kutu boyu;
 * d işaret yarıçapı + ara.
 */
function kose(yon: EtiketYonu, x: number, y: number, w: number, h: number, d: number, out: Float64Array) {
  const dd = d * 0.55; // çaprazda köşe işarete yakın dursun
  switch (yon) {
    case "right":
      out[0] = x + d;
      out[1] = y - h / 2;
      break;
    case "left":
      out[0] = x - d - w;
      out[1] = y - h / 2;
      break;
    case "above":
      out[0] = x - w / 2;
      out[1] = y - d - h;
      break;
    case "below":
      out[0] = x - w / 2;
      out[1] = y + d;
      break;
    case "above-right":
      out[0] = x + dd;
      out[1] = y - dd - h;
      break;
    case "below-right":
      out[0] = x + dd;
      out[1] = y + dd;
      break;
    case "above-left":
      out[0] = x - dd - w;
      out[1] = y - dd - h;
      break;
    case "below-left":
      out[0] = x - dd - w;
      out[1] = y + dd;
      break;
  }
}

const icinde = (bx: number, by: number, w: number, h: number, c: Daire, v: Alan) => {
  if (bx < v.l || by < v.t || bx + w > v.r || by + h > v.b) return false;
  const r2 = c.r * c.r;
  for (const [px, py] of [
    [bx, by],
    [bx + w, by],
    [bx, by + h],
    [bx + w, by + h],
  ]) {
    const dx = px - c.cx;
    const dy = py - c.cy;
    if (dx * dx + dy * dy > r2) return false;
  }
  return true;
};

/**
 * Kutuyu (sol üst bx, by) daireye ve görünür alana sığacak kadar daire
 * merkezine doğru kaydırır; `out` = [bx, by].
 */
export function sigdir(bx: number, by: number, w: number, h: number, c: Daire, v: Alan, out: Float64Array) {
  let x = bx;
  let y = by;
  for (let k = 0; k < 10 && !icinde(x, y, w, h, c, v); k++) {
    const mx = x + w / 2;
    const my = y + h / 2;
    x += (c.cx - mx) * 0.18;
    y += (c.cy - my) * 0.18;
    // Ekran kenarı: doğrudan kırp (dairenin içindeyken de taşabilir).
    x = Math.max(v.l, Math.min(v.r - w, x));
    y = Math.max(v.t, Math.min(v.b - h, y));
  }
  out[0] = x;
  out[1] = y;
}

const YONLER: readonly EtiketYonu[] = [
  "right",
  "left",
  "above",
  "below",
  "above-right",
  "below-right",
  "above-left",
  "below-left",
];

/**
 * Bir grubun etiket yönlerini dinlenme kamerasında seçer (açgözlü): sırayla
 * tercih edilen yön, sonra diğerleri; daireye/ekrana sığan ve önceki
 * etiketlerle, grubun işaretleriyle ve `engeller` ile çakışmayan ilk yön.
 * Hiçbiri sığmazsa en az çakışan yön. Sonuç: no → yön.
 */
export function yonleriSec(
  grup: 0 | 1,
  P: Projector,
  boyut: (no: number) => { w: number; h: number },
  isaretR: number,
  c: Daire,
  v: Alan,
  engeller: readonly Alan[],
): Map<number, EtiketYonu> {
  const pt = new Float64Array(3);
  const box = new Float64Array(2);
  const noktalar: { x: number; y: number }[] = [];
  for (const m of isaretler) {
    P(m.vec, 1, pt);
    noktalar.push({ x: pt[0], y: pt[1] });
  }
  const yerlesen: Alan[] = [];
  const sonuc = new Map<number, EtiketYonu>();
  const cakisma = (a: Alan) => {
    let s = 0;
    const kes = (b: Alan) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
    for (const b of yerlesen) s += kes(b);
    for (const b of engeller) s += kes(b);
    isaretler.forEach((m, i) => {
      const r = m.grup === grup ? isaretR * 1.15 : isaretR * 0.6;
      const p = noktalar[i];
      s += kes({ l: p.x - r, t: p.y - r, r: p.x + r, b: p.y + r });
    });
    return s;
  };
  for (const m of isaretler) {
    if (m.grup !== grup) continue;
    const i = m.no - 1;
    const { w, h } = boyut(m.no);
    const d = isaretR * 1.15 + ETIKET_ARA;
    const sira = [m.yon, ...YONLER.filter((y) => y !== m.yon)];
    let enIyi: { yon: EtiketYonu; s: number; a: Alan } | null = null;
    for (const yon of sira) {
      kose(yon, noktalar[i].x, noktalar[i].y, w, h, d, box);
      const a = { l: box[0], t: box[1], r: box[0] + w, b: box[1] + h };
      let s = cakisma(a);
      if (!icinde(box[0], box[1], w, h, c, v)) s += 1e6;
      if (!enIyi || s < enIyi.s) enIyi = { yon, s, a };
      if (s === 0) break;
    }
    if (enIyi) {
      sonuc.set(m.no, enIyi.yon);
      yerlesen.push(enIyi.a);
    }
  }
  return sonuc;
}

/** Seçilmiş yön için kutunun sol üst köşesi (daireye/ekrana sığdırılmış); `out` = [bx, by]. */
export function etiketYeri(
  yon: EtiketYonu,
  x: number,
  y: number,
  w: number,
  h: number,
  isaretR: number,
  c: Daire,
  v: Alan,
  out: Float64Array,
) {
  kose(yon, x, y, w, h, isaretR * 1.15 + ETIKET_ARA, out);
  sigdir(out[0], out[1], w, h, c, v, out);
}

/* ------------------------------------------------------------------ */
/* Dönem halkası                                                        */
/* ------------------------------------------------------------------ */

/** Halka (viewBox 100): yarıçap, çizgi kalınlığı, dilimler arası boşluk (derece). */
export const HALKA = { r: 49, w: 1.35, bosluk: 1.4 } as const;

export type Dilim = {
  readonly ad: string;
  readonly kisa: string;
  readonly renk: string;
  /** Başlangıç açısı (derece; 0 = saat 3, saat yönünde; -90 = üst). */
  readonly a0: number;
  /** Uzunluk (derece). */
  readonly len: number;
  /** Orta açı (derece). */
  readonly orta: number;
};

const ADIM = 360 / donemler.length;

export const dilimler: readonly Dilim[] = donemler.map((d, i) => {
  const a0 = -90 + i * ADIM + HALKA.bosluk / 2;
  const len = ADIM - HALKA.bosluk;
  return { ad: d.ad, kisa: d.kisa, renk: d.renk, a0, len, orta: a0 + len / 2 };
});

/**
 * Çizim ilerlemesi p (0–1; halka üstten saat yönünde dolar) için i. dilimin
 * görünen uzunluğu (derece).
 */
export function dilimBoyu(i: number, p: number): number {
  const ucu = p * 360; // üstten itibaren çizilmiş açı
  const bas = i * ADIM + HALKA.bosluk / 2;
  return Math.max(0, Math.min(dilimler[i].len, ucu - bas));
}

/* ------------------------------------------------------------------ */
/* Zemin halkası (Stantta)                                              */
/* ------------------------------------------------------------------ */

/** Zemin (viewBox 100): krem disk, sütun noktaları ve dönem etiketlerinin yarıçapları. */
export const ZEMIN = { disk: 46.6, cizgi: 31, sutun: 22.5, sutunR: 2.65, etiket: 37.8 } as const;

const D2R = Math.PI / 180;
/**
 * SVG koordinatları 2 ondalığa yuvarlanır: sunucu (Node) ile tarayıcının
 * trigonometri sonuçları son basamakta farklı olabilir (hydration uyuşmazlığı).
 */
const r2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Dönem etiketlerinin konumları (viewBox 100): her dilimin orta açısında (`aci`, derece).
 * Bu x/y ilk çizim içindir; DunyaScene yazı boyunu ekrana göre büyütünce etiketi
 * `zeminEtiketYeri` ile disk kenarı ile sütun halkası arasına yeniden yerleştirir.
 */
export const zeminEtiketleri: readonly { x: number; y: number; kisa: string; aci: number }[] = dilimler.map((d) => ({
  x: r2(50 + ZEMIN.etiket * Math.cos(d.orta * D2R)),
  y: r2(50 + ZEMIN.etiket * Math.sin(d.orta * D2R)),
  kisa: d.kisa,
  aci: d.orta,
}));

/**
 * Etiket kutusunun (w × h, viewBox birimi) merkezi: dilim ortasındaki ışın üzerinde,
 * kutu krem diskin içinde (kenardan pay) ve sütun halkasının dışında kalacak yarıçap.
 * İkisi birden sağlanamazsa iki sınırın ortası. `kucuk`: numaralar gizli, noktalar
 * küçük (r 1,5); iç sınır daralır.
 */
export function zeminEtiketYeri(aci: number, w: number, h: number, kucuk: boolean): { x: number; y: number } {
  const c = Math.cos(aci * D2R);
  const s = Math.sin(aci * D2R);
  const dis = ZEMIN.disk - 1.1;
  const ic = ZEMIN.sutun + (kucuk ? 1.5 + 0.8 : ZEMIN.sutunR + 1.2);
  /** r yarıçaplı konumda kutunun merkeze en uzak ve en yakın noktası. */
  const uzaklik = (r: number) => {
    const x = r * c;
    const y = r * s;
    const ux = Math.abs(x) + w / 2;
    const uy = Math.abs(y) + h / 2;
    const yx = Math.max(Math.abs(x) - w / 2, 0);
    const yy = Math.max(Math.abs(y) - h / 2, 0);
    return { enUzak: Math.hypot(ux, uy), enYakin: Math.hypot(yx, yy) };
  };
  // Geçerli aralık [rMin, rMax]: iç sınırı geçen en küçük, dış sınırda kalan en büyük yarıçap.
  let rMin = Infinity;
  let rMax = -Infinity;
  for (let r = 16; r <= ZEMIN.disk; r += 0.1) {
    const u = uzaklik(r);
    if (u.enYakin >= ic && r < rMin) rMin = r;
    if (u.enUzak <= dis) rMax = r;
  }
  let r: number = ZEMIN.etiket;
  if (Number.isFinite(rMin) && Number.isFinite(rMax)) {
    r = rMin <= rMax ? Math.min(rMax, Math.max(rMin, r)) : (rMin + rMax) / 2;
  }
  return { x: 50 + r * c, y: 50 + r * s };
}

/**
 * 12 sütun noktası (viewBox 100): her sütun kendi dönem diliminin ortasında, böylece
 * numara yanındaki dönem etiketiyle eşleşir (aynı dilimdeki sütunlar — Selçuklu 7 ve 8 —
 * dilimi eşit böler). Dönemi `donemler`de bulunamayan sütun eski düzene (no × 30°) düşer.
 * Dizi açıya göre sıralı (üstten saat yönünde): sırayla beliriş bu sırayı izler.
 * Not: emanet.ts'te 1 = Belgrad (Doğal miras, son dilim), 12 = Göbeklitepe (Neolitik, ilk
 * dilim); onay-listesi §1 çözülüp numaralar yer değiştirince sıra kendiliğinden 1…12 olur.
 */
export const zeminSutunlari: readonly { no: number; x: number; y: number }[] = (() => {
  const dilimde = new Map<number, number[]>();
  for (const a of emanetAlanlari) {
    const i = dilimler.findIndex((d) => d.ad === a.donem);
    if (i < 0) continue;
    dilimde.set(i, [...(dilimde.get(i) ?? []), a.no].sort((x, y) => x - y));
  }
  const aciOf = (no: number, sira: number): number => {
    for (const [i, nolar] of dilimde) {
      const j = nolar.indexOf(no);
      if (j >= 0) return dilimler[i].a0 + (dilimler[i].len * (j + 0.5)) / nolar.length;
    }
    return -90 + sira * 30;
  };
  return emanetAlanlari
    .map((a, sira) => ({ no: a.no, aci: aciOf(a.no, sira) }))
    .sort((p, q) => p.aci - q.aci)
    .map(({ no, aci }) => ({
      no,
      x: r2(50 + ZEMIN.sutun * Math.cos(aci * D2R)),
      y: r2(50 + ZEMIN.sutun * Math.sin(aci * D2R)),
    }));
})();

/** Zemin ilerlemesi g (0–1) için i. sütun noktasının görünürlüğü (sırayla). */
export function sutunGorunur(g: number, i: number): number {
  return clamp01((g - 0.25 - i * 0.045) / 0.18);
}

/* ------------------------------------------------------------------ */
/* Nabız                                                                */
/* ------------------------------------------------------------------ */

/** Spot nabzı periyodu (ms): 4.500 ms'lik Emanet spotuna üç nabız sığar. */
export const NABIZ_MS = 1500;

/**
 * Nabız eğrisi: faz ph (0–1) → halka ölçeği ve opaklığı; `out` = [ölçek, opaklık].
 * Halka hızla açılır (easeOut), opaklık sona doğru yumuşakça biter.
 */
export function nabiz(ph: number, out: Float64Array, buyume = 1.5) {
  const p = clamp01(ph);
  out[0] = 1 + buyume * easeOut(p);
  const k = 1 - p;
  out[1] = 0.85 * k * k;
}

/**
 * Şölen (6 → 7): Kocaeli'de geçişe bağlı 3 genişleyen halka. k (0–1) için
 * j. halkanın fazı; 0 ya da 1 ise çizilmez.
 */
export function kocaeliHalkaFazi(k: number, j: number): number {
  return clamp01((k - j * 0.2) / 0.56);
}
