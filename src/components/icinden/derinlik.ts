/*
 * /icinden derinlik motoru (docs/brief-icinden.md §3). K2 spike'ının "MOTOR ÇEKİRDEĞİ"nin tipli,
 * saf (DOM'suz) karşılığı + katman ağacı, duraklar ve d yayını (dAbone).
 *
 * ── A İÇİN SÖZLEŞME (değişmez) ──────────────────────────────────────────────────────────────
 * • Katman: 1000×1000 nominal kutu (1 px = 1 birim). İçerik yüzde ya da px ile yerleşir.
 *   BÜTÜN katman içerikleri IcindenIcerik'ten (sunucu) gelir: <IcindenSahne katmanlar={<><Katman
 *   id="logo">…</Katman> … <Katman id="kure2">…</Katman></>}>; her id'nin children'ı o kabuğun TÜM
 *   içeriğidir (harita/logo/stant verisi istemci paketine girmez). Rotunda: <RotundaKatmani>
 *   <SutunYuzleri/></RotundaKatmani> (yüzler halkanın üstündeki .ics-yuva'ya).
 * • Broşür kutusundaki sabit daireler (A bunları tam buraya çizer; motor dalışı buna göre yapar):
 *   BROSUR_GEOMETRI.sayfa (kâğıt), .slogan (kapaktaki lacivert slogan dairesi = rotundadaki "Bugün"
 *   diski), .arkaKure (arka kapaktaki küre fotoğrafı dairesi = kure2 katmanı).
 * • dAbone(cb): rAF döngüsünden cb(d, hareketli). d sürekli (0…9), hareketli = son 180 ms'de
 *   kaydırma oldu. Dönen fonksiyon aboneliği bırakır.
 * • data-spot: B, katman kök elemanına yazar ([data-katman="stant"] 1…4, 3,5 s;
 *   [data-katman="rotunda"] 1…12, 4,5 s). Dinlenmeden 600 ms sonra başlar, geçişte ve
 *   reduced-motion'da "0".
 * • Sahne kökü (.ics-sahne) öznitelikleri: data-dinlenme="k" (k durağında dinlenme + canlılık açık,
 *   kaydırma bitince 400 ms sonra; yoksa "-"), data-azalt="1" (reduced-motion). A'nın canlılık
 *   animasyonları bunlara bağlanır (animation-play-state).
 * • data-ic-d="a b": katman içindeki elemanın opaklığı = rampa(d, a, b) (a > b ise söner). B yazar,
 *   yalnız opacity (will-change: opacity, kompozitörde). Dört sayı "a b c e": a→b girer, c→e söner
 *   (tek sarmalayıcı, iç içe ikinci kompozit katman gerekmez). data-ic-r aynı biçimde, katmanın r'sine
 *   göre log rampa (etiketler büyüyüp kesilmeden söner).
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 *
 * Kamera = benzerlik dönüşümü (ekran = z·kök + T). ln z doğrusal, merkez SABİT NOKTALI
 * (T(t) = T0 + (T1 − T0)·(z − z0)/(z1 − z0); doğrusal merkez 1,65× savuruyordu, spike'ta ölçüldü).
 * Ease yok; durakta plato (|d − k| ≤ PLATO kamera sabit).
 */

import { cop31Amblem } from "./cop31-amblem";

/* ================================= sabitler ================================= */

export const NOMINAL = 1000;
export const GORUNUR_MIN = 1 / 6;
export const GORUNUR_MAX = 6;
/** Geçişin başında/sonunda uçtaki durak dışı katmanların açılıp kapandığı pay (t). */
export const UC_PAYI = 0.15;
/** Durakta kameranın sabit kaldığı pay (|d − k| ≤ PLATO). */
export const PLATO = 0.12;
/** cobe `scale` üst sınırı (daha büyükte nokta deseni bozuluyor); küre katmanı bundan önce söner. */
export const COBE_SCALE_MAX = 4;

/** Bölüm yükseklikleri (svh): k → k+1 geçişi k. bölümün yüksekliğinde sürer; 9. bölüm 100svh. */
export const BOLUM_SVH = [100, 220, 160, 120, 120, 100, 100, 100, 160, 100] as const;

const LN = Math.log;

/* ================================== tipler ================================== */

export type KatmanId =
  | "logo"
  | "kure"
  | "siluet"
  | "bolge"
  | "korfez"
  | "kent"
  | "expo"
  | "salon"
  | "stant"
  | "rotunda"
  | "brosur"
  | "kure2";

/** Ebeveynin 1000×1000 nominalinde KARE, eksene hizalı dikdörtgen (sol üst + kenar). */
export type Rect = { readonly x: number; readonly y: number; readonly w: number };

export type KatmanTanim = {
  readonly id: KatmanId;
  readonly ebeveyn: KatmanId | null;
  readonly rect?: Rect;
  /** cobe küresi bu katmanın kutusuna oturur (çap = kutu). */
  readonly kure?: boolean;
  /** Çıkış penceresi (r) — varsayılan [3, 6]. Küre: büyütülmüş cobe noktaları "nokta tarlası" olmasın. */
  readonly cikis?: Aralik;
};

export type RGB = readonly [number, number, number];
/** Tek sayı ya da [dikey, yatay] (vw/H ≥ 4:3 yatay). */
export type Sig = number | readonly [dikey: number, yatay: number];
export type Aralik = readonly [number, number];

export type Durak = {
  readonly ad: string;
  readonly katman: KatmanId;
  /** Durakta katman kutusu kadrajın (taban) bu oranına sığar. */
  readonly sig: Sig;
  readonly zemin: RGB;
  /** Sahnenin genel opaklığı (varsayılan 1). */
  readonly sahne?: number;
  /** Yatay ekranda kamera çapasını ortaya al (panelsiz açılış). */
  readonly ortala?: boolean;
  /** Kadraj okuması (metre değil): "stant", "Bugün", "sayfa 1/12"… */
  readonly okuma?: string;
  /** Bu durağa GELEN geçişin (k−1 → k) ayarları; t ∈ [0, 1]. */
  readonly gecis?: {
    /** Kamera ilerlemesi rampa(t, a, b). Varsayılan [PLATO, 1 − PLATO]. */
    readonly kam?: Aralik;
    /** Bu durağın katmanı rampa(t, a, b) ile girer (pencerenin giriş rampası yerine). */
    readonly gir?: Aralik;
    /** Önceki durağın katmanı 1 − rampa(t, a, b) ile çıkar (pencerenin çıkış rampası yerine). */
    readonly cik?: Aralik;
    /** Zemin karışımı rampa(t, a, b). Varsayılan [0, 1]. */
    readonly zemin?: Aralik;
  };
};

/** Ekran geometrisi: vw = genişlik, H = bölüm yüksekliği (100svh, ölçülen), L = sahne (100lvh). */
export type Geo = { readonly vw: number; readonly H: number; readonly L: number };

/* ============================ geometri: katman ağacı ============================ */

/** Expo merkezli yerel düzlemde metre kutusu (x doğu+, y güney+; expo-harita.ts ile aynı). */
type MKutu = { readonly x: number; readonly y: number; readonly w: number };

/**
 * Harita katmanlarının metre kutuları. Komşu katmanlar arası oran ≤ ~7 tutulur: pencere [1/6, 6]
 * ile ebeveyn sönerken çocuk görünür olsun (oran > 9'da boş kare/söndü-yandı oluşuyordu; bu
 * yüzden brief'teki zincire iki ara katman eklendi: "bolge" ~300 km, "kent" ~10 km).
 */
export const HARITA_KUTU = {
  /** Küre: dünya çapı, merkez Expo (ortografik ≈ düzlem; merkez yakınında). */
  kure: { x: -6_371_000, y: -6_371_000, w: 12_742_000 },
  /** Türkiye silüeti: turkiyeBbox merkezli 1.800 km. */
  siluet: { x: -506_686, y: -1_124_908, w: 1_800_000 },
  /** Antalya ve kıyıları: 300 km. */
  bolge: { x: -150_000, y: -110_000, w: 300_000 },
  /** Antalya Körfezi: kiyiBbox genişliği (53,3 km), kare. */
  korfez: { x: -32_668, y: -19_466, w: 53_325 },
  /** Expo + havalimanı pistleri + kıyı: 10 km. */
  kent: { x: -6_000, y: -2_500, w: 10_000 },
  /** Expo ayrıntı penceresi ±900 m. */
  expo: { x: -900, y: -900, w: 1_800 },
  /** Fuar holü (salonlar[0], 321 × 254 m) etrafında kare. */
  salon: { x: -185, y: -240.5, w: 347 },
  /**
   * Stant: holün ağırlık merkezinde (noktalar.salon) VARSAYILAN konum ve TEMSİLİ ölçek (62 m).
   * ONAY: salon/stant no ve gerçek konum bilinmiyor; pin yok.
   */
  stant: { x: -60, y: -115, w: 62 },
} as const satisfies Record<string, MKutu>;

function metreRect(ebeveyn: MKutu, cocuk: MKutu): Rect {
  const k = NOMINAL / ebeveyn.w;
  return { x: (cocuk.x - ebeveyn.x) * k, y: (cocuk.y - ebeveyn.y) * k, w: cocuk.w * k };
}

/** Logo kutusunda resmî logonun yeri (yükseklik 640, ortalı) ve amblem diski (= küre). */
export const LOGO_GEOMETRI = (() => {
  const a = cop31Amblem.dikey;
  const yuk = 640;
  const k = yuk / a.h;
  const gen = a.w * k;
  const x = (NOMINAL - gen) / 2;
  const y = (NOMINAL - yuk) / 2;
  return {
    /** Logo svg kutusu (nominal). */
    kutu: { x, y, w: gen, h: yuk },
    /** Amblem diski (nominal). */
    disk: { cx: x + a.cx * k, cy: y + a.cy * k, r: a.r * k },
  };
})();

/** Stant planı (1000 × 711: 657 plan + 54 giriş şeridi) stant kutusunda dikeyde ortalı. */
export const STANT_GEOMETRI = {
  planY: (NOMINAL - 711) / 2,
  /** Plandaki rotunda kanopisi (plan biriminde), StantPlani.tsx ROT ile aynı. */
  rotunda: { cx: 408, cy: 278.568, r: 150 },
} as const;

/** Rotunda kutusu = kanopi dairesi. İç içe halkalar (nominal, merkez 500, 500). */
export const ROTUNDA_GEOMETRI = {
  /** Sütun bandı (plan 111…134 → ×3,333). */
  bantIc: 370,
  bantDis: 447,
  /** Dönem (zemin) halkası (plan 48…68 → ×3,333). */
  halkaIc: 160,
  halkaDis: 227,
  /** Ortadaki "Bugün" diski: broşürün slogan dairesine eşlenir. */
  bugun: { cx: 500, cy: 500, r: 140 },
} as const;

/**
 * Broşür kutusu (1000×1000) içindeki sabit yerler — A çizer, B dalar:
 *  sayfa: kâğıdın dikdörtgeni (A5 oranı ~0,708);
 *  slogan: kapaktaki lacivert slogan dairesi ("Bugün" diskinden eşleşme kesmesi);
 *  arkaKure: arka kapaktaki küre fotoğrafı dairesi (kure2 katmanı, d9 dalışı).
 */
export const BROSUR_GEOMETRI = {
  sayfa: { x: 160, y: 20, w: 680, h: 960 },
  slogan: { cx: 390, cy: 620, r: 150 },
  arkaKure: { cx: 500, cy: 380, r: 180 },
} as const;

const daireRect = (c: { cx: number; cy: number; r: number }): Rect => ({ x: c.cx - c.r, y: c.cy - c.r, w: 2 * c.r });

/** Ebeveyndeki daire (cx, cy, r) ↔ çocuktaki daire eşlemesi: çocuğun ebeveyndeki rect'i. */
function daireEsle(e: { cx: number; cy: number; r: number }, c: { cx: number; cy: number; r: number }): Rect {
  const w = (NOMINAL * e.r) / c.r;
  const k = w / NOMINAL;
  return { x: e.cx - c.cx * k, y: e.cy - c.cy * k, w };
}

export const KATMANLAR: readonly KatmanTanim[] = [
  { id: "logo", ebeveyn: null },
  { id: "kure", ebeveyn: "logo", rect: daireRect(LOGO_GEOMETRI.disk), kure: true, cikis: [2, 4] },
  { id: "siluet", ebeveyn: "kure", rect: metreRect(HARITA_KUTU.kure, HARITA_KUTU.siluet) },
  { id: "bolge", ebeveyn: "siluet", rect: metreRect(HARITA_KUTU.siluet, HARITA_KUTU.bolge) },
  { id: "korfez", ebeveyn: "bolge", rect: metreRect(HARITA_KUTU.bolge, HARITA_KUTU.korfez) },
  { id: "kent", ebeveyn: "korfez", rect: metreRect(HARITA_KUTU.korfez, HARITA_KUTU.kent) },
  { id: "expo", ebeveyn: "kent", rect: metreRect(HARITA_KUTU.kent, HARITA_KUTU.expo) },
  { id: "salon", ebeveyn: "expo", rect: metreRect(HARITA_KUTU.expo, HARITA_KUTU.salon) },
  { id: "stant", ebeveyn: "salon", rect: metreRect(HARITA_KUTU.salon, HARITA_KUTU.stant) },
  {
    id: "rotunda",
    ebeveyn: "stant",
    rect: daireRect({
      cx: STANT_GEOMETRI.rotunda.cx,
      cy: STANT_GEOMETRI.planY + STANT_GEOMETRI.rotunda.cy,
      r: STANT_GEOMETRI.rotunda.r,
    }),
  },
  { id: "brosur", ebeveyn: "rotunda", rect: daireEsle(ROTUNDA_GEOMETRI.bugun, BROSUR_GEOMETRI.slogan) },
  { id: "kure2", ebeveyn: "brosur", rect: daireRect(BROSUR_GEOMETRI.arkaKure), kure: true },
];

const BEYAZ: RGB = [255, 255, 255];
const MIST: RGB = [238, 244, 248];
const KREM: RGB = [247, 230, 205];

/**
 * Duraklar (k = 0…9). Kök katman DEĞİŞTİRİLEBİLİR: logo onayı gelmezse DURAKLAR[0] tek satırla
 * broşürün kendi küre dairesine çevrilebilir (motor ve diğer duraklar değişmez).
 */
export const DURAKLAR: readonly Durak[] = [
  { ad: "Açılış", katman: "logo", sig: [1, 0.86], zemin: BEYAZ, ortala: true },
  {
    ad: "Dünya",
    katman: "kure",
    sig: 0.86,
    zemin: BEYAZ,
    // d 0,10–0,40 logo yerinde söner; 0,20–0,45 küre diskte belirir; zoom ANCAK 0,45'te başlar.
    gecis: { cik: [0.1, 0.4], gir: [0.2, 0.45], kam: [0.45, 1 - PLATO] },
  },
  { ad: "Antalya Expo", katman: "expo", sig: [1, 0.95], zemin: MIST },
  // Krem, salonun (krem) dolgusu ekranın ~%60–85'ini kaplarken zemine geçer (t 0,75–0,88; ölçüldü:
  // dz/kaplama.mjs). Salon katmanının kendi sis zemini (HaritaKatmani SalonKatmani) holün dışını o ana
  // dek sis tutar; böylece krem holün içinden büyür, global renk geçişi görünmez (brief §1 d3).
  { ad: "Stant", katman: "stant", sig: [0.92, 0.95], zemin: KREM, okuma: "stant", gecis: { zemin: [0.75, 0.88] } },
  { ad: "Buradasın · Bugün", katman: "rotunda", sig: [0.95, 0.9], zemin: KREM, okuma: "Bugün" },
  {
    ad: "Broşür kapağı",
    katman: "brosur",
    sig: [1.35, 0.966],
    zemin: KREM,
    okuma: "sayfa 1/12",
    // Eşleşme kesmesi, iki adımda: önce yalnız "Bugün" diski lacivert slogan dairesine döner (Brosur.tsx
    // eşleşme diski, data-ic-d 4,15–4,35); sonra kâğıt (data-ic-d 4,40–4,62) diskin çevresinde kurulur
    // ve rotunda kısa bir pencerede söner. Katmanın kendisi erken açılır; içerik data-ic-d ile kapılı.
    gecis: { gir: [0.12, 0.2], cik: [0.42, 0.64] },
  },
  { ad: "Buluşmalar · Şölen", katman: "brosur", sig: [1.35, 0.966], zemin: KREM, okuma: "sayfa 8/12" },
  { ad: "İklim eylemleri", katman: "brosur", sig: [1.35, 0.966], zemin: KREM, okuma: "sayfa 11/12" },
  { ad: "Arka kapak", katman: "brosur", sig: [1.35, 0.966], zemin: KREM, okuma: "sayfa 12/12" },
  // Kâğıt (beyaz) ekranı kapladıktan sonra zemin beyaza geçer.
  { ad: "Ortak evimiz", katman: "kure2", sig: 0.86, zemin: BEYAZ, okuma: "ortak evimiz", gecis: { zemin: [0.3, 0.42] } },
];

/** Kadraj okumasının metre ölçeği: küre katmanında 1 nominal birim kaç metre. */
export const KURE_METRE_BIRIM = HARITA_KUTU.kure.w / NOMINAL;

/* ================================ yardımcılar ================================ */

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
/** a → b arasında 0 → 1 doğrusal rampa; a > b ise 1 → 0 (söner). */
export function rampa(v: number, a: number, b: number): number {
  if (a === b) return v >= a ? 1 : 0;
  return clamp((v - a) / (b - a), 0, 1);
}
const sigOf = (s: Sig, yatay: boolean) => (typeof s === "number" ? s : yatay ? s[1] : s[0]);
/** Yatay düzen: vw/H ≥ 4:3 (panel sağda, en fazla %38). */
export const yatayMi = (g: Geo) => g.vw >= (g.H * 4) / 3;

/**
 * Kadraj tabanı: durak katmanının sığdırıldığı kare kenarı. Dikeyde min(vw, H); yatayda panel
 * sağdaki %38'i aldığı için serbest alan min(0,62·vw, H).
 */
export function taban(g: Geo): number {
  return yatayMi(g) ? Math.min(0.62 * g.vw, g.H) : Math.min(g.vw, g.H);
}

/**
 * Kamera çapası: durak katmanının merkezinin oturduğu ekran noktası.
 * Dikey (vw/2, 0,38·H) — panel altta. Yatay (0,31·vw, H/2) — panel SAĞDA %38 (brief §1): serbest
 * alanın (0…0,62·vw) ortası. NOT: brief §1'de "yatayda 0,62·vw" yazıyor; bu, panel solda olsaydı
 * doğru olurdu (spike). Panel sağdayken 0,62·vw özneyi panelin altına koyar; bkz. rapor.
 */
export const CAPA_YATAY_X = 0.31;
export function capa(g: Geo, D?: Durak): readonly [number, number] {
  if (yatayMi(g)) return D?.ortala ? [g.vw / 2, g.H / 2] : [g.vw * CAPA_YATAY_X, g.H / 2];
  return [g.vw / 2, g.H * 0.38];
}

/* ================================== model ================================== */

/** Kök koordinatına açılmış katman: nominal (u, v) → kök (X + u·S, Y + v·S). */
export type Dunya = { X: number; Y: number; S: number; derinlik: number; ebeveyn: number };

export type Model = {
  readonly katmanlar: readonly KatmanTanim[];
  readonly duraklar: readonly Durak[];
  readonly idx: ReadonlyMap<KatmanId, number>;
  readonly W: readonly Dunya[];
  readonly durakKatman: readonly number[];
  /** Her geçişin (k → k+1) ağaç yolu: yalnızca bu katmanlar o geçişte görünebilir. */
  readonly yollar: readonly ReadonlySet<number>[];
};

export function agacYolu(W: readonly Dunya[], a: number, b: number): Set<number> {
  const atalar = (i: number) => {
    const l: number[] = [];
    for (let j = i; j >= 0; j = W[j].ebeveyn) l.push(j);
    return l;
  };
  const A = atalar(a);
  const B = atalar(b);
  const bKume = new Set(B);
  const ortak = A.find((j) => bKume.has(j));
  const s = new Set<number>();
  for (const j of A) {
    s.add(j);
    if (j === ortak) break;
  }
  for (const j of B) {
    s.add(j);
    if (j === ortak) break;
  }
  return s;
}

export function modelKur(katmanlar: readonly KatmanTanim[], duraklar: readonly Durak[]): Model {
  const idx = new Map<KatmanId, number>(katmanlar.map((k, i) => [k.id, i]));
  const W: Dunya[] = [];
  katmanlar.forEach((k, i) => {
    if (k.ebeveyn == null) {
      W.push({ X: 0, Y: 0, S: 1, derinlik: 0, ebeveyn: -1 });
      return;
    }
    const p = idx.get(k.ebeveyn);
    if (p === undefined || p >= i || !k.rect) throw new Error("ebeveyn önce gelmeli ve rect olmalı: " + k.id);
    const P = W[p];
    const r = k.rect;
    W.push({ X: P.X + r.x * P.S, Y: P.Y + r.y * P.S, S: (P.S * r.w) / NOMINAL, derinlik: P.derinlik + 1, ebeveyn: p });
  });
  const durakKatman = duraklar.map((d) => {
    const i = idx.get(d.katman);
    if (i === undefined) throw new Error("durak katmanı yok: " + d.katman);
    return i;
  });
  const yollar: Set<number>[] = [];
  for (let k = 0; k < duraklar.length - 1; k++) yollar.push(agacYolu(W, durakKatman[k], durakKatman[k + 1]));
  return { katmanlar, duraklar, idx, W, durakKatman, yollar };
}

export type Kamera = { z: number; tx: number; ty: number };

/** Durak j'nin kamerası: ekran = z·kök + (tx, ty). */
export function durakKamera(M: Model, j: number, g: Geo): Kamera {
  const D = M.duraklar[j];
  const w = M.W[M.durakKatman[j]];
  const fit = taban(g) * sigOf(D.sig, yatayMi(g));
  const z = fit / (NOMINAL * w.S);
  const [ax, ay] = capa(g, D);
  return { z, tx: ax - z * (w.X + 500 * w.S), ty: ay - z * (w.Y + 500 * w.S) };
}

export type KameraAn = Kamera & { k: number; t: number; u: number };

/** d ∈ [0, n] için kamera ("sabit nokta" dalı). u = kamera ilerlemesi (plato ve kam penceresi). */
export function kameraAt(M: Model, d: number, g: Geo): KameraAn {
  const n = M.duraklar.length - 1;
  d = clamp(d, 0, n);
  const k = Math.min(Math.floor(d), n - 1);
  const t = d - k;
  const kam = M.duraklar[k + 1].gecis?.kam ?? [PLATO, 1 - PLATO];
  const u = rampa(t, kam[0], kam[1]);
  const c0 = durakKamera(M, k, g);
  const c1 = durakKamera(M, k + 1, g);
  const z = c0.z * Math.pow(c1.z / c0.z, u);
  const dz = c1.z - c0.z;
  const f = Math.abs(dz) > 1e-9 * c0.z ? (z - c0.z) / dz : u;
  return { z, tx: c0.tx + (c1.tx - c0.tx) * f, ty: c0.ty + (c1.ty - c0.ty) * f, k, t, u };
}

/** Ölçek penceresi: [1/6, 1/3] giriş, [3, 6] çıkış rampası (log ölçekte). */
export function pencereGiris(r: number): number {
  return r <= GORUNUR_MIN ? 0 : rampa(LN(r), LN(GORUNUR_MIN), LN(1 / 3));
}
export function pencereCikis(r: number): number {
  return r >= GORUNUR_MAX ? 0 : 1 - rampa(LN(r), LN(3), LN(GORUNUR_MAX));
}
export function pencere(r: number): number {
  return Math.min(pencereGiris(r), pencereCikis(r));
}

export type KatmanDurumu = {
  /** alfa > 0,002 */
  gorunur: boolean;
  alfa: number;
  /** CSS ölçeği (1000 px kutuya). */
  s: number;
  /** Kadraja göre ölçek (1 = taban kadar). */
  r: number;
  x: number;
  y: number;
};

export type SahneDurumu = {
  d: number;
  cam: KameraAn;
  katmanlar: KatmanDurumu[];
  gorunurSay: number;
  sahne: number;
  zemin: [number, number, number];
  /** Etkin küre katmanı (cobe) indeksi ya da −1; ve onun cobe ölçeği. */
  kure: number;
  cobeScale: number;
};

/**
 * d'deki tüm sahne durumu (saf). Her katman için CSS dönüşümü translate(x px, y px) scale(s) —
 * 1000 px kutuya. Dev ölçek sayıları yalnızca z'de yaşar (double), CSS'e yalnızca görünür
 * katmanların sınırlı değerleri gider (r ≤ 6).
 */
export function sahneDurumu(M: Model, d: number, g: Geo): SahneDurumu {
  const cam = kameraAt(M, d, g);
  const { k, t } = cam;
  const a = M.durakKatman[k];
  const b = M.durakKatman[k + 1];
  const yol = M.yollar[k];
  const gec = M.duraklar[k + 1].gecis;
  const tb = taban(g) / NOMINAL;
  const katmanlar: KatmanDurumu[] = [];
  let gorunurSay = 0;
  let kure = -1;
  let cobeScale = 0;
  for (let i = 0; i < M.W.length; i++) {
    const w = M.W[i];
    const s = cam.z * w.S;
    const r = s / tb;
    let alfa = 0;
    if (yol.has(i)) {
      // Geçişin iki ucundaki katman aynıysa (broşür d5–d8) pencere dışı kural yok.
      if (a === b && i === a) alfa = 1;
      else {
        const giris = i === b && gec?.gir ? rampa(t, gec.gir[0], gec.gir[1]) : pencereGiris(r);
        const ozel = M.katmanlar[i].cikis;
        const cikis =
          i === a && gec?.cik
            ? 1 - rampa(t, gec.cik[0], gec.cik[1])
            : ozel
              ? Math.min(pencereCikis(r), 1 - rampa(LN(r), LN(ozel[0]), LN(ozel[1])))
              : pencereCikis(r);
        alfa = Math.min(giris, cikis);
        // Uç bekçisi: tam durakta yalnızca durağın katmanı görünür (d0'da logo tek başına).
        if (alfa > 0 && i !== a) alfa *= rampa(t, 0, UC_PAYI);
        if (alfa > 0 && i !== b) alfa *= 1 - rampa(t, 1 - UC_PAYI, 1);
      }
      if (alfa > 0 && M.katmanlar[i].kure) {
        // cobe ölçeği: küre çapı = kutu (1000·s), sahne yüksekliği L'ye göre (0,8·scale·L).
        const sc = (NOMINAL * s) / (0.8 * g.L);
        alfa *= 1 - rampa(LN(sc), LN(COBE_SCALE_MAX * 0.55), LN(COBE_SCALE_MAX));
        if (alfa > 0.002 && (kure < 0 || alfa > katmanlar[kure]?.alfa)) {
          kure = i;
          cobeScale = sc;
        }
      }
    }
    const gorunur = alfa > 0.002;
    if (gorunur) gorunurSay++;
    katmanlar.push({ gorunur, alfa, s, r, x: cam.tx + cam.z * w.X, y: cam.ty + cam.z * w.Y });
  }
  const D0 = M.duraklar[k];
  const D1 = M.duraklar[k + 1];
  const zt = gec?.zemin ? rampa(t, gec.zemin[0], gec.zemin[1]) : t;
  const sahne = (D0.sahne ?? 1) + ((D1.sahne ?? 1) - (D0.sahne ?? 1)) * t;
  const zemin: [number, number, number] = [0, 1, 2].map((j) =>
    Math.round(D0.zemin[j] + (D1.zemin[j] - D0.zemin[j]) * zt),
  ) as [number, number, number];
  return { d, cam, katmanlar, gorunurSay, sahne, zemin, kure, cobeScale };
}

/* ============================ kaydırma → d (bölüm tablosu) ============================ */

/**
 * scrollY → d. topler: bölümlerin offsetTop'ları (k = 0…n) + son bölümün sonu (n+1. değer).
 * d = k + (y − top_k)/(top_{k+1} − top_k); top_n'den sonra n (kapanış akışı). WebKit konumu tam
 * sayıya keser: durağa 1 px'ten yakınsa tam durak.
 */
export function dHesapla(y: number, topler: readonly number[]): number {
  const n = topler.length - 2;
  if (n < 1) return 0;
  if (y <= topler[0]) return 0;
  if (y >= topler[n]) return n;
  let k = 0;
  while (k < n - 1 && y >= topler[k + 1]) k++;
  const h = topler[k + 1] - topler[k];
  if (h <= 0) return k;
  if (Math.abs(y - topler[k]) < 1) return k;
  if (Math.abs(topler[k + 1] - y) < 1) return k + 1;
  return k + (y - topler[k]) / h;
}

/** d → scrollY (dHesapla'nın tersi; d > n ise son bölüm içinde H birimiyle uzar). */
export function yHesapla(d: number, topler: readonly number[], H: number): number {
  const n = topler.length - 2;
  if (n < 1) return 0;
  if (d >= n) return topler[n] + (d - n) * H;
  const k = clamp(Math.floor(d), 0, n - 1);
  return topler[k] + (d - k) * (topler[k + 1] - topler[k]);
}

/** Ham (sınırsız) d: kapanışa doğru n'yi aşar; boyut değişiminde çapa olarak kullanılır. */
export function dHam(y: number, topler: readonly number[], H: number): number {
  const n = topler.length - 2;
  if (n >= 1 && y > topler[n]) return n + (y - topler[n]) / Math.max(1, H);
  return dHesapla(y, topler);
}

/* ============================== kadraj okuması ============================== */

const sayiTR = (v: number) => Math.round(v).toLocaleString("tr-TR");
function yuvarla(v: number): string {
  if (v >= 10_000) return sayiTR(Math.round(v / 100) * 100);
  const us = Math.pow(10, Math.floor(Math.log10(v)) - 1);
  const r = Math.round(v / us) * us;
  return r >= 10 ? sayiTR(r) : r.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
}

/**
 * Kadraj genişliği okuması: küre ve harita duraklarında kadrajın (taban·0,86) metre karşılığı
 * ("~12.700 km" → "~1,5 km" → "~300 m"), sonra durak adı ("stant", "Bugün", "sayfa n/12", …).
 */
export function kadrajOkuma(M: Model, S: SahneDurumu, g: Geo): string {
  const d = S.d;
  const k = clamp(Math.round(d), 0, M.duraklar.length - 1);
  // Metre okuması yalnız küre → harita → salon yolunda (d < 2,6); sonra durak adı.
  if (d >= 2.6) return M.duraklar[Math.max(3, k)].okuma ?? "";
  const kureI = M.idx.get("kure")!;
  const metrePx = KURE_METRE_BIRIM / (S.cam.z * M.W[kureI].S);
  const m = Math.min(HARITA_KUTU.kure.w, taban(g) * 0.86 * metrePx);
  if (m >= 1000) return `~${yuvarla(m / 1000)} km`;
  return `~${yuvarla(m)} m`;
}

/* ================================ d yayını ================================ */

type Abone = (d: number, hareketli: boolean) => void;
const aboneler = new Set<Abone>();
let sonYayin: { d: number; hareketli: boolean } | null = null;

/**
 * d aboneliği (A: sayfa çevirme, sayaç). cb rAF döngüsünden (d, hareketli) ile çağrılır; abone
 * olunca son değer hemen bir kez verilir. Dönen fonksiyon aboneliği bırakır.
 */
export function dAbone(cb: (d: number, hareketli: boolean) => void): () => void {
  aboneler.add(cb);
  if (sonYayin) cb(sonYayin.d, sonYayin.hareketli);
  return () => {
    aboneler.delete(cb);
  };
}

/** Yalnız IcindenSahne çağırır. */
export function dYayinla(d: number, hareketli: boolean): void {
  sonYayin = { d, hareketli };
  for (const cb of aboneler) {
    try {
      cb(d, hareketli);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.error(e);
    }
  }
}

/** Yalnız IcindenSahne çağırır (unmount/Activity: eski d yeni kuruluma sızmasın). */
export function dSifirla(): void {
  sonYayin = null;
}

export const MODEL: Model = modelKur(KATMANLAR, DURAKLAR);
export const N_DURAK = DURAKLAR.length - 1;
