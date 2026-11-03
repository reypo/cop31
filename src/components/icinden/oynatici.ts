/**
 * /icinden v3 klip oynatıcı — R4 prototipinin (`klip-spike/web/oynatici.js`) tipli üretim uyarlaması
 * (docs/klip-oynatma.md §1, §8).
 *
 * Katmanlar (alttan üste): poster <img> (bulunulan durağın karesi; altında satır içi LQIP) → 3 <video>
 * havuzu (görünen z3, bir önceki 80 ms z2'de) → yedek <div> (poster çapraz sönmesi). Lombar, broşür,
 * etiketler ve metin bunların üstünde (VideoSahne).
 *
 * Veri: blob kipi — fetch → Blob → object URL; klip yuvaya ancak tamamen inince atanır (klip ortasında
 * takılma yapısal olarak yok). Eşzamanlılık 1. Kuyruk: önce yuvaların istediği (acil, FIFO), sonra pencere
 * (R4 §1.4 sırası), en son ters geçiş (geri klip; yalnız ≥ 1 s dinlenmede, brief-icinden-3 §11.2-3). Bırakma
 * yalnız bütçe (30 MB) aşılınca. Süren indirme `durdur()`da iptal edilir (AbortController); başarısız dosya en
 * çok 2 kez denenir.
 *
 * iOS (WebKit) gömülü medyada önyüklemeyi metadata ile sınırlar (AutoPreloadingNotPermitted; öğe bir kez
 * oynatılana dek readyState 1): blob atanıp 250 ms'de hâlâ HAVE_FUTURE_DATA yoksa öğe görünmezken bir kez
 * oynatılıp durdurulur (ısıtma; sessiz satır içi oynatma Düşük Güç dışında izinli, reddi = engel). Kod çözme
 * hatasında (MEDIA_ERR_DECODE / SRC_NOT_SUPPORTED) AV1/HEVC'den H.264'e bir kez dönülür (`kodekYedekIste`).
 * Poster kipi (Veri Tasarrufu, 2G/3G; VideoSahne karar verir): video inmez, her geçiş poster çapraz sönmesi.
 *
 * Havuz (en çok 3 <video>): k. durakta döngü_k + aynı yöndeki geçiş + ters geçiş (uçta komşu döngü).
 * Yedekler: geçiş hazır değilse 300 ms bekle → hedef posterine çapraz sönme (süre = klip süresi);
 * `play()` reddi (NotAllowedError, iOS Düşük Güç) → aynı yedek + ilk touchend/click/keydown'da (yakalama
 * aşaması, adımdan önce) havuzun kilidi açılır; döngü reddedilirse poster dural kalır.
 * `visibilitychange`: gizlide döngü durur, dönünce sürer. `durdur()`: kapanışta her şey bırakılır.
 */
import type { Boyut, IstemciManifest, Klip, KodekAd } from "./klipler";

const BEKLE_MS = 300;
const SOLMA_MS = 180;
const YEDEK_MS = 900;
/** Ters (geri) klip ancak bu kadar dinlenmeden sonra iner (§11.2-3). */
const BOSTA_MS = 1000;
/** Isıtma: blob atandıktan sonra bu sürede HAVE_FUTURE_DATA gelmediyse öğe bir kez oynatılır (iOS). */
const ISIT_MS = 250;
/** Aynı dosyada en çok bu kadar başarısız indirme (404, ağ). */
const HATA_SINIRI = 2;
/** Olay kayıtlarının üst sınırı (kiosk günlerce açık kalır). */
const KAYIT_SINIRI = 300;

type Yuva = {
  el: HTMLVideoElement;
  i: number;
  url: string | null;
  hazir: boolean;
  surum: number;
  cozum: ((ok: boolean) => void)[];
  oynat: boolean;
};

export type KlipBilgi = { url: string; sure: number; hiz: number; kare: number; ad: string };

export type Kayit = {
  no: number;
  yon: 1 | -1;
  from: number;
  to: number;
  tur: string;
  tJest: number;
  klip?: string;
  hazirdi?: boolean;
  yuvadaYoktu?: boolean;
  beklemeMs?: number;
  engel?: boolean;
  yedek?: string;
  playHata?: string;
  tPlay?: number;
  ilkKareMs?: number;
  sunulan?: number;
  cozulen?: number;
  dusen?: number;
  gecisMs?: number;
  donguHazirdi?: boolean;
  bitti?: boolean;
};

export type GecisSecenek = {
  /** Video bu kadar ms sonra başlar (DOM ön evresi: logo sönmesi, broşür dalışı). */
  oncesiMs?: number;
  /** Kare geri çağrısı (rVFC; klibin kendi kare numarası). */
  kare?: (f: number, n: number) => void;
  /** Varış (klip bitti ya da yedek tamamlandı). */
  varis?: (kayit: Kayit) => void;
};

class Veri {
  bloblar = new Map<string, { url: string; bayt: number }>();
  bekleyen = new Map<string, Promise<string>>();
  kuyruk: string[] = [];
  acil: string[] = [];
  /** Ters geçişler: en sonda, yalnız `bostaAcik` iken (Oynatici ≥ 1 s dinlenmede açar). */
  bosta: string[] = [];
  bostaAcik = false;
  sozler = new Map<string, { p: Promise<string>; res: (u: string) => void; rej: (e: unknown) => void }>();
  calisan = 0;
  kullanimda = new Set<string>();
  indirilen = 0;
  getirmeler: { dosya: string; bayt: number; ms: number; t: number }[] = [];
  hatalar = new Map<string, number>();
  kapali = false;
  private ac = new AbortController();
  private nesil = 0;
  constructor(public butce: number) {}

  hazirMi(d: string) {
    return this.bloblar.has(d);
  }
  private tukendi(d: string) {
    return (this.hatalar.get(d) ?? 0) >= HATA_SINIRI;
  }
  /** Bekleyen ters klip artık gerekli (yön değişti / jest): boşta listesinden acile. */
  oncele(d: string) {
    const i = this.bosta.indexOf(d);
    if (i < 0) return;
    this.bosta.splice(i, 1);
    if (!this.acil.includes(d)) this.acil.push(d);
    this.pompa();
  }
  bostaAc(acik: boolean) {
    this.bostaAcik = acik;
    if (acik) this.pompa();
  }
  al(d: string, bosta = false): Promise<string> {
    const b = this.bloblar.get(d);
    if (b) return Promise.resolve(b.url);
    if (this.tukendi(d)) return Promise.reject(new Error(`deneme sınırı ${d}`));
    let s = this.sozler.get(d);
    if (!s) {
      let res!: (u: string) => void;
      let rej!: (e: unknown) => void;
      const p = new Promise<string>((a, b2) => {
        res = a;
        rej = b2;
      });
      p.catch(() => {});
      s = { p, res, rej };
      this.sozler.set(d, s);
    }
    if (!this.bekleyen.has(d)) {
      if (!bosta) {
        const i = this.bosta.indexOf(d);
        if (i >= 0) this.bosta.splice(i, 1);
        if (!this.acil.includes(d)) this.acil.push(d);
      } else if (!this.acil.includes(d) && !this.bosta.includes(d)) this.bosta.push(d);
    }
    this.pompa();
    return s.p;
  }
  private async getir(d: string): Promise<string> {
    this.calisan++;
    const n = this.nesil;
    const t0 = performance.now();
    try {
      const r = await fetch(d, { signal: this.ac.signal });
      if (!r.ok) throw new Error(`${r.status} ${d}`);
      const b = await r.blob();
      if (this.kapali || n !== this.nesil) throw new Error("kapali");
      const url = URL.createObjectURL(b);
      this.bloblar.set(d, { url, bayt: b.size });
      this.indirilen += b.size;
      this.getirmeler.push({ dosya: d, bayt: b.size, ms: Math.round(performance.now() - t0), t: Math.round(t0) });
      const s = this.sozler.get(d);
      this.sozler.delete(d);
      s?.res(url);
      return url;
    } catch (e) {
      // İptal edilen nesil (durdur/boyut değişimi): sözler birak()'ta reddedildi; yeni nesle dokunma.
      if (n === this.nesil) {
        const ad = (e as Error)?.name;
        if (ad !== "AbortError" && (e as Error)?.message !== "kapali") this.hatalar.set(d, (this.hatalar.get(d) ?? 0) + 1);
        const s = this.sozler.get(d);
        this.sozler.delete(d);
        s?.rej(e);
      }
      throw e;
    } finally {
      this.calisan--;
      if (n === this.nesil) this.bekleyen.delete(d);
      this.pompa();
    }
  }
  private pompa() {
    while (!this.kapali && this.calisan < 1) {
      let d: string | undefined;
      if (this.acil.length) d = this.acil.shift();
      else if (this.kuyruk.length) d = this.kuyruk.shift();
      else if (this.bostaAcik && this.bosta.length) d = this.bosta.shift();
      else break;
      if (!d || this.bloblar.has(d) || this.bekleyen.has(d) || this.tukendi(d)) continue;
      const p = this.getir(d);
      p.catch(() => {});
      this.bekleyen.set(d, p);
    }
  }
  pencere(liste: string[]) {
    const p = new Set(liste);
    if (this.blobBayt() > this.butce) {
      for (const [d, b] of this.bloblar) {
        if (this.blobBayt() <= this.butce * 0.8) break;
        if (!p.has(d) && !this.kullanimda.has(d)) {
          URL.revokeObjectURL(b.url);
          this.bloblar.delete(d);
        }
      }
    }
    this.kuyruk = liste.filter((d) => !this.bloblar.has(d) && !this.bekleyen.has(d) && !this.tukendi(d));
    this.pompa();
  }
  blobBayt() {
    let s = 0;
    for (const b of this.bloblar.values()) s += b.bayt;
    return s;
  }
  birak() {
    // Süren indirme iptal (döndürmeden sonra yeni set eski dosyayı beklemesin, eski yönün blob'u bütçeye girmesin).
    this.ac.abort();
    this.ac = new AbortController();
    this.nesil++;
    for (const b of this.bloblar.values()) URL.revokeObjectURL(b.url);
    this.bloblar.clear();
    for (const s of this.sozler.values()) s.rej(new Error("birakildi"));
    this.sozler.clear();
    this.bekleyen.clear();
    this.kuyruk = [];
    this.acil = [];
    this.bosta = [];
    this.bostaAcik = false;
  }
}

export class Oynatici {
  m: IstemciManifest;
  N: number;
  boyut: Boyut;
  kodek: KodekAd;
  veri: Veri;
  k = 0;
  durum: "dur" | "gecis" | "kapali" = "dur";
  engel = false;
  kilitAcildi = false;
  /** Veri Tasarrufu / yavaş bağlantı: video inmez, geçişler poster çapraz sönmesi (§6). */
  posterKipi: boolean;
  /** Kod çözme hatası: bir sonraki dinlenmede H.264'e dönülecek. */
  kodekBekliyor = false;
  private kodekYasak = new Set<KodekAd>();
  olaylar: Kayit[] = [];
  private kayitNo = 0;
  private bostaId = 0;
  yuvalar: Yuva[];
  aktif: HTMLVideoElement | null = null;
  eski: HTMLVideoElement | null = null;
  poster: HTMLImageElement;
  yedekEl: HTMLElement;
  sonYon: 1 | -1 = 1;
  private olay: (tur: string, veri?: unknown) => void;
  private zamanlar = new Set<number>();
  private kilitDinle: () => void;
  private gorunurlukDinle: () => void;
  private onYukleme = new Map<string, HTMLImageElement>();

  constructor(o: {
    sahne: HTMLElement;
    manifest: IstemciManifest;
    boyut: Boyut;
    kodek: KodekAd;
    butceMB?: number;
    posterKipi?: boolean;
    olay?: (tur: string, veri?: unknown) => void;
  }) {
    this.m = o.manifest;
    this.posterKipi = !!o.posterKipi;
    this.N = o.manifest.duraklar.length;
    this.boyut = o.boyut;
    this.kodek = o.kodek;
    this.veri = new Veri((o.butceMB ?? 30) * 1e6);
    this.olay = o.olay ?? (() => {});
    this.poster = o.sahne.querySelector<HTMLImageElement>("[data-v3-poster]")!;
    this.yedekEl = o.sahne.querySelector<HTMLElement>("[data-v3-yedek]")!;
    this.yuvalar = [...o.sahne.querySelectorAll<HTMLVideoElement>("video")].map((el, i) => {
      el.muted = true;
      el.defaultMuted = true;
      el.playsInline = true;
      el.setAttribute("muted", "");
      el.setAttribute("playsinline", "");
      el.preload = "auto";
      el.disablePictureInPicture = true;
      return { el, i, url: null, hazir: false, surum: 0, cozum: [], oynat: false };
    });
    this.kilitDinle = () => this.kilitAc();
    for (const t of ["touchend", "click", "keydown"]) addEventListener(t, this.kilitDinle, { capture: true, passive: true });
    this.gorunurlukDinle = () => {
      const L = this.yuva(this.dongu(this.k)?.url ?? "");
      if (!L || this.durum !== "dur") return;
      if (document.hidden) L.el.pause();
      else if (L.oynat && !this.engel) L.el.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", this.gorunurlukDinle);
  }

  /* ---------------- manifest yardımcıları ---------------- */
  private url(c: Klip | null | undefined): string | null {
    const d = c?.dosya[this.boyut];
    return d?.[this.kodek] ?? d?.h264 ?? null;
  }
  dongu(k: number): KlipBilgi | null {
    const c = this.m.duraklar[k]?.dongu;
    const u = this.url(c);
    return c && u ? { url: u, sure: c.sure, hiz: 1, kare: c.kare, ad: c.ad } : null;
  }
  gecis(k: number, dir: number): KlipBilgi | null {
    if (dir > 0) {
      const c = this.m.duraklar[k]?.ileri;
      const u = this.url(c);
      return c && u ? { url: u, sure: c.sure, hiz: 1, kare: c.kare, ad: c.ad } : null;
    }
    const g = this.m.duraklar[k - 1]?.ileri;
    const u = this.url(g?.geri);
    return g?.geri && u ? { url: u, sure: g.geri.sure, hiz: g.hizGeri, kare: g.geri.kare, ad: g.geri.ad } : null;
  }
  posterUrl(k: number): string | null {
    return this.m.duraklar[k]?.poster?.[this.boyut]?.dosya ?? null;
  }
  lqip(k: number): string | null {
    return this.m.duraklar[k]?.poster?.[this.boyut]?.lqip ?? null;
  }
  /**
   * Geçiş öğesinin `poster` özniteliği için durak: klibin 0. karesi o durağın posteri olmalı (klip zinciri). DOM
   * durağından ileri giden klip (brosur-arka → t01: 0. kare amblem boyunda Dünya) durağın posterine (p8 plakası)
   * eşit DEĞİL → poster yok (-1). Hiç oynamamış öğe poster bayrağı nedeniyle 0. kare yerine posteri gösterir; B
   * turunda dalış kesişmesinde lombar deliğinde plakanın broşürü görünüyordu. Döngüsüz klip durağı (duvar, d6/d7)
   * "klip" türündedir: posteri gelen klibin son karesi = giden klibin 0. karesi (son-kare posteri, §12.4-9).
   */
  private ilkKarePosteri(k: number, dir: number) {
    return dir > 0 && this.m.duraklar[k]?.tur === "dom" ? -1 : k;
  }
  /** k'da havuzda olması gerekenler (öncelik sırasıyla). Ters geçiş yuvaya atanır ama indirmesi boşta (§11.2-3). */
  private gerekli(k: number, yon: 1 | -1) {
    const l: { url: string; dongu: boolean; k: number; bosta?: boolean }[] = [];
    const d = this.dongu(k);
    if (d) l.push({ url: d.url, dongu: true, k });
    const ayni = this.gecis(k, yon);
    const ters = this.gecis(k, -yon);
    if (ayni) l.push({ url: ayni.url, dongu: false, k: this.ilkKarePosteri(k, yon) });
    if (ters) l.push({ url: ters.url, dongu: false, k: this.ilkKarePosteri(k, -yon), bosta: true });
    // Uç ya da DOM durağı: boş kalan yuvaya varılacak döngü (aynı yönde ilk klipli durak). Döngüsüz klip durağında
    // (duvar) iki yönün geçişi zaten yuvada; üçüncü yuva boş kalır, sıradaki geçiş pencereden iner (uzaktaki l1'i
    // buradan indirmek d6'da ~1 MB boşa bayt olurdu).
    const uc = this.m.duraklar[k]?.tur === "dom" || !ayni || !ters;
    for (let j = k + yon; uc && l.length < 3 && j >= 0 && j < this.N; j += yon) {
      const dj = this.dongu(j);
      if (dj) {
        l.push({ url: dj.url, dongu: true, k: j });
        break;
      }
    }
    return l;
  }
  /**
   * R4 §1.4 pencere sırası (y = son gidiş yönü). Ters geçişler (g(k, −y), g(k+y, −y)) pencerede DEĞİL: §11.2-3'e
   * göre kuyruğun en sonunda ve yalnız boşta iner (havuz ataması `bosta` listesine koyar).
   */
  private pencereListesi(k: number, y: 1 | -1) {
    const d = (j: number) => this.dongu(j)?.url;
    const g = (j: number, yy: number) => this.gecis(j, yy)?.url;
    const l = [d(k), g(k, y), d(k + y), g(k + y, y), d(k + 2 * y), g(k + 2 * y, y), d(k - y)];
    // Broşür (DOM) durakları arasında sıradaki klip uzaktadır: ilk klipli geçişe kadar ileri bak.
    if (!l.some(Boolean)) for (let j = k; j >= 0 && j < this.N; j += y) if (g(j, y)) {
      l.push(g(j, y), d(j + y));
      break;
    }
    return [...new Set(l.filter((x): x is string => !!x))];
  }
  /** Posterleri pencere sırasıyla önyükle (k±2). */
  private posterOnyukle(k: number, y: 1 | -1) {
    for (const j of [k + y, k + 2 * y, k - y]) {
      const u = this.posterUrl(j);
      if (!u || this.onYukleme.has(u)) continue;
      const im = new Image();
      im.decoding = "async";
      im.src = u;
      this.onYukleme.set(u, im);
    }
  }

  /* ---------------- zaman yardımcıları ---------------- */
  private sonra(ms: number, f: () => void) {
    const id = window.setTimeout(() => {
      this.zamanlar.delete(id);
      f();
    }, ms);
    this.zamanlar.add(id);
    return id;
  }

  /* ---------------- yuva ---------------- */
  yuva(url: string): Yuva | null {
    return this.yuvalar.find((y) => y.url === url) ?? null;
  }
  private ata(y: Yuva, url: string, dongu: boolean, posterK: number, bosta = false) {
    if (y.url === url) return;
    const s = ++y.surum;
    if (y.url) this.veri.kullanimda.delete(y.url);
    y.url = url;
    y.hazir = false;
    y.oynat = false;
    this.veri.kullanimda.add(url);
    y.el.loop = dongu;
    const p = this.posterUrl(posterK);
    if (p) y.el.poster = p;
    else y.el.removeAttribute("poster");
    this.veri.al(url, bosta).then(
      (src) => {
        if (y.surum !== s) return;
        const el = y.el;
        el.src = src;
        const temizle = () => {
          el.removeEventListener("canplay", tamam);
          el.removeEventListener("error", hata);
        };
        const tamam = () => {
          if (y.surum !== s) return temizle();
          if (y.hazir || el.readyState < 3) return;
          temizle();
          y.hazir = true;
          y.cozum.splice(0).forEach((f) => f(true));
          this.yokla(y);
        };
        const hata = () => {
          if (y.surum !== s) return temizle();
          const kod = el.error?.code;
          temizle();
          this.olay("video-hata", { url, kod });
          // 3 = MEDIA_ERR_DECODE, 4 = MEDIA_ERR_SRC_NOT_SUPPORTED: seçilen kodek bu cihazda çözülemiyor.
          if (kod === 3 || kod === 4) this.kodekYedekIste();
        };
        el.addEventListener("canplay", tamam);
        el.addEventListener("error", hata);
        tamam();
        // iOS: önyükleme metadata ile sınırlı; oynatılmamış öğe HAVE_FUTURE_DATA'ya ulaşmaz → bir kez oynat-durdur.
        if (!y.hazir) this.sonra(ISIT_MS, () => this.isit(y, s));
      },
      () => {},
    );
  }
  /** Görünmez öğeyi bir kez oynatıp durdur (WebKit'te prepareToPlay veriyi yükler; canplay gelir). */
  private isit(y: Yuva, s: number) {
    const el = y.el;
    if (y.surum !== s || y.hazir || y.oynat || el === this.aktif || this.engel || this.durum === "kapali") return;
    if (el.readyState >= 3 || !el.paused) return;
    this.olay("isitma", { url: y.url, readyState: el.readyState });
    el.play().then(
      () => {
        if (y.surum === s && !y.oynat && el !== this.aktif) {
          el.pause();
          el.currentTime = 0;
        }
      },
      (e: Error) => {
        if (e?.name === "NotAllowedError") {
          this.engelVar();
          this.olay("engel", { yer: "isitma" });
        }
      },
    );
  }
  /**
   * Otomatik oynatma engelini ilk hazır klipte önceden yokla (görünmez öğe, oynat → durdur): engel
   * ilk jestten ÖNCE bilinirse dokunma adımı doğrudan touchend'e kayar ve ilk geçiş de video olur.
   */
  private yoklandi = false;
  private yokla(y: Yuva) {
    if (this.yoklandi || y.el === this.aktif || y.oynat) return;
    this.yoklandi = true;
    y.el.play().then(
      () => {
        if (!y.oynat) {
          y.el.pause();
          y.el.currentTime = 0;
        }
      },
      (e: Error) => {
        if (e?.name === "NotAllowedError") {
          this.engelVar();
          this.olay("engel", { yer: "yoklama" });
        }
      },
    );
  }
  private hazirBekle(y: Yuva | null, ms: number): Promise<boolean> {
    if (!y) return Promise.resolve(false);
    if (y.hazir) return Promise.resolve(true);
    return new Promise((res) => {
      y.cozum.push(res);
      if (ms < Infinity) this.sonra(ms, () => res(y.hazir));
    });
  }
  dagit(k: number, yon: 1 | -1, mesgul: Yuva[] = [], donguOnce = false, zorla = false) {
    if (this.durum === "kapali") return;
    const ger = this.gerekli(k, yon);
    // Yolculukta önce aynı yöndeki geçiş (sonraki jest), sonra döngü; açılışta önce döngü (ilk izlenim).
    if (!donguOnce && ger.length > 1 && ger[0].dongu && ger[0].k === k) ger.splice(1, 0, ger.shift()!);
    ger.splice(this.yuvalar.length - mesgul.length);
    const tutulan = new Set(mesgul);
    for (const g of ger) {
      const y = this.yuva(g.url);
      if (y) tutulan.add(y);
    }
    const bos = this.yuvalar.filter((y) => !tutulan.has(y) && y.el !== this.aktif && (zorla || y.el !== this.eski));
    for (const g of ger) {
      if (this.yuva(g.url)) {
        // Önceden ters geçiş olarak atanmış, şimdi aynı yön (yön değişti): indirmesi öne alınır.
        if (!g.bosta) this.veri.oncele(g.url);
        continue;
      }
      const y = bos.shift();
      if (!y) break;
      y.el.pause();
      this.ata(y, g.url, g.dongu, g.k, g.bosta);
    }
    this.veri.pencere(this.pencereListesi(k, yon));
    this.posterOnyukle(k, yon);
  }
  /** Dinlenme ≥ 1 s sürünce ters geçişlerin indirmesi açılır; geçiş başlayınca kapanır. */
  private bostaPlanla() {
    window.clearTimeout(this.bostaId);
    this.zamanlar.delete(this.bostaId);
    this.veri.bostaAc(false);
    if (this.durum !== "dur") return;
    this.bostaId = this.sonra(BOSTA_MS, () => {
      if (this.durum === "dur") this.veri.bostaAc(true);
    });
  }

  /* ---------------- görünürlük ---------------- */
  goster(el: HTMLVideoElement, solma: number) {
    const eski = this.aktif;
    this.aktif = el;
    for (const y of this.yuvalar) {
      if (y.el === el || y.el === eski) continue;
      y.el.style.transition = "none";
      y.el.style.opacity = "0";
      y.el.style.zIndex = "1";
    }
    if (eski && eski !== el) {
      this.eski = eski;
      eski.style.transition = "none";
      eski.style.zIndex = "2";
      this.sonra(solma + 80, () => {
        if (this.aktif !== eski) {
          eski.style.opacity = "0";
          eski.style.zIndex = "1";
        }
        if (this.eski === eski) this.eski = null;
      });
    }
    el.style.zIndex = "3";
    if (solma > 0) {
      el.style.transition = "none";
      el.style.opacity = "0";
      void el.offsetWidth;
      el.style.transition = `opacity ${solma}ms linear`;
    } else el.style.transition = "none";
    el.style.opacity = "1";
  }
  /** Görünen videoyu `ms` içinde söndür (DOM durağına varış: alttaki poster/DOM görünür). */
  gizle(ms = 0) {
    for (const y of this.yuvalar) {
      y.el.style.transition = ms > 0 ? `opacity ${ms}ms linear` : "none";
      y.el.style.opacity = "0";
      if (y.el !== this.aktif || ms === 0) y.el.style.zIndex = "1";
    }
    const a = this.aktif;
    this.aktif = null;
    this.eski = null;
    if (a) this.sonra(ms + 20, () => {
      if (this.aktif !== a) a.pause();
    });
  }
  posterAyarla(k: number) {
    const u = this.posterUrl(k);
    const lq = this.lqip(k);
    if (!u) {
      this.poster.hidden = true;
      return;
    }
    this.poster.hidden = false;
    this.poster.style.backgroundImage = lq ? `url("${lq}")` : "";
    if (this.poster.getAttribute("src") !== u) this.poster.src = u;
  }
  yedekKaldir(ms = 0) {
    const el = this.yedekEl;
    el.style.transition = ms ? `opacity ${ms}ms linear` : "none";
    el.style.opacity = "0";
  }

  /* ---------------- başlangıç ---------------- */
  basla(k: number) {
    this.k = k;
    this.durum = "dur";
    this.veri.kapali = false;
    this.posterAyarla(k);
    if (this.posterKipi) {
      this.posterOnyukle(k, this.sonYon);
      return;
    }
    this.dagit(k, this.sonYon, [], true);
    this.bostaPlanla();
    void this.donguBaslat(k);
  }
  async donguBaslat(j: number) {
    const d = this.dongu(j);
    if (!d) return;
    const L = this.yuva(d.url);
    if (!L) return;
    const ok = await this.hazirBekle(L, 15000);
    if (!ok || this.k !== j || this.durum !== "dur") return;
    if (this.aktif === L.el && !L.el.paused) return;
    L.oynat = true;
    try {
      L.el.currentTime = 0;
      await L.el.play();
      if (this.k !== j || this.durum !== "dur") return;
      this.goster(L.el, 0);
      this.yedekKaldir();
      this.engel = false;
    } catch (e) {
      L.oynat = false;
      if ((e as Error)?.name === "NotAllowedError") {
        this.engelVar();
        this.olay("engel", { yer: "dongu", j });
      }
      // Engelli: poster dural kalır.
      this.gizle(0);
      this.yedekKaldir();
    }
  }

  /* ---------------- otomatik oynatma kilidi ---------------- */
  /** play() reddedildi: engel kipine geç; sonraki kullanıcı etkinleştirmesinde kilit yeniden açılır. */
  private engelVar() {
    this.engel = true;
    this.kilitAcildi = false;
  }
  kilitAc() {
    if (!this.engel || this.kilitAcildi || this.durum === "kapali") return;
    this.kilitAcildi = true;
    this.engel = false; // iyimser: reddedilirse yeniden true
    // Üç öğenin HEPSİ (kaynağı henüz atanmamış olan da) bu etkinleştirmede oynatılır: WebKit kısıtı öğe
    // başınadır; boş öğe sonradan src alınca da açık kalsın (R4 §3.6-b). Boş öğenin NotSupportedError'ı yok sayılır.
    for (const y of this.yuvalar) {
      const gorunur = y.el === this.aktif;
      y.el.play().then(
        () => {
          if (!y.oynat && !gorunur) {
            y.el.pause();
            y.el.currentTime = 0;
          }
        },
        (e: Error) => {
          if (e?.name === "NotAllowedError") {
            this.engel = true;
            this.kilitAcildi = false;
          }
        },
      );
    }
    this.olay("kilit-ac");
    queueMicrotask(() => {
      if (this.durum === "dur" && !this.engel) void this.donguBaslat(this.k);
    });
  }

  /* ---------------- geçiş ---------------- */
  /**
   * k → j geçişini başlat. Video yoksa (DOM geçişi) yalnız durum tutulur; varışı `domVaris(j)` bildirir.
   * Dönen: video kısmının süresi (ms; hız dahil), DOM geçişinde 0.
   */
  gec(j: number, dir: 1 | -1, tur: string, tJest: number, sec: GecisSecenek = {}): number {
    if (this.durum !== "dur") return -1;
    const k = this.k;
    const g = this.gecis(k, dir);
    const kayit: Kayit = { no: ++this.kayitNo, yon: dir, from: k, to: j, tur, tJest, klip: g?.ad, engel: this.engel };
    this.olaylar.push(kayit);
    if (this.olaylar.length > KAYIT_SINIRI) this.olaylar.splice(0, this.olaylar.length - KAYIT_SINIRI);
    this.durum = "gecis";
    this.sonYon = dir;
    this.bostaPlanla();
    this.olay("adim", kayit);
    if (!g) return 0;
    const sureMs = (g.sure * 1000) / g.hiz;
    const T0 = this.posterKipi ? null : this.yuva(g.url);
    kayit.hazirdi = !!T0?.hazir;
    if (this.posterKipi) {
      // Poster kipi: video yok, geçiş = hedef posterine çapraz sönme (lombar/okuma zamana bağlı akar).
    } else if (!T0) {
      // Havuzda değil (varıştan hemen sonra ters jest ya da DOM durağından): hemen ata.
      kayit.yuvadaYoktu = true;
      this.dagit(k, dir, [], false, true);
    } else if (!T0.hazir) this.veri.oncele(g.url); // boşta bekleyen ters klip: jest geldi, öne al
    this.sonra(sec.oncesiMs ?? 0, () => {
      if (kayit.bitti) return;
      if (this.posterKipi) return this.yedek(j, dir, kayit, "poster-kipi", g, sec);
      if (this.engel) return this.yedek(j, dir, kayit, "otomatik-oynatma-engeli", g, sec);
      const T = this.yuva(g.url);
      const tb = performance.now();
      void this.hazirBekle(T, BEKLE_MS).then((ok) => {
        kayit.beklemeMs = Math.round(performance.now() - tb);
        if (kayit.bitti) return;
        if (ok && T && this.durum === "gecis") this.oynat(T, j, dir, kayit, g, sec);
        else this.yedek(j, dir, kayit, "hazir-degil", g, sec);
      });
    });
    return sureMs;
  }

  private oynat(T: Yuva, j: number, dir: 1 | -1, kayit: Kayit, g: KlipBilgi, sec: GecisSecenek) {
    const L = this.aktif;
    const s = T.surum;
    T.oynat = true;
    T.el.loop = false;
    T.el.playbackRate = g.hiz;
    const q0 = T.el.getVideoPlaybackQuality?.();
    kayit.tPlay = performance.now();
    if (T.el.currentTime > 0.001) T.el.currentTime = 0;
    T.el.play().catch((e: Error) => {
      kayit.playHata = e?.name;
      T.oynat = false;
      if (e?.name === "NotAllowedError") this.engelVar();
      if (this.durum === "gecis" && !kayit.bitti) this.yedek(j, dir, kayit, "play-red", g, sec);
    });
    // Önizlemede (lombar deliğinin altı) zaten görünür: yeniden söndürüp açma.
    if (L !== T.el) this.goster(T.el, L ? SOLMA_MS : 0);
    let sunulan = 0;
    const fps = this.m.fps;
    const kare = (now: number, meta: VideoFrameCallbackMetadata) => {
      if (T.surum !== s || kayit.bitti) return;
      sunulan++;
      if (sunulan === 1) kayit.ilkKareMs = Math.round((now - kayit.tJest) * 10) / 10;
      kayit.sunulan = sunulan;
      sec.kare?.(Math.min(g.kare - 1, Math.round(meta.mediaTime * fps)), g.kare);
      T.el.requestVideoFrameCallback(kare);
    };
    if (typeof T.el.requestVideoFrameCallback === "function") T.el.requestVideoFrameCallback(kare);
    else {
      // rVFC yok (Safari < 15.4): rAF'te currentTime.
      const raf = () => {
        if (T.surum !== s || kayit.bitti) return;
        sec.kare?.(Math.min(g.kare - 1, Math.round(T.el.currentTime * fps)), g.kare);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
    this.sonra(SOLMA_MS + 100, () => {
      if (kayit.bitti) return;
      if (L && L !== T.el) L.pause();
      this.dagit(j, dir, [T]);
    });
    const bitir = () => {
      if (T.surum !== s || kayit.bitti) return;
      kayit.bitti = true;
      window.clearTimeout(guvenlik);
      const q1 = T.el.getVideoPlaybackQuality?.();
      if (q0 && q1) {
        kayit.cozulen = q1.totalVideoFrames - q0.totalVideoFrames;
        kayit.dusen = q1.droppedVideoFrames - q0.droppedVideoFrames;
      }
      this.varis(j, dir, kayit, sec);
    };
    T.el.onended = bitir;
    const guvenlik = this.sonra(((g.sure / g.hiz) + 1.5) * 1000, bitir);
  }

  private varis(j: number, dir: 1 | -1, kayit: Kayit, sec: GecisSecenek) {
    this.k = j;
    kayit.gecisMs = Math.round(performance.now() - kayit.tJest);
    this.posterAyarla(j);
    this.durum = "dur";
    const d = this.dongu(j);
    const L = d ? this.yuva(d.url) : null;
    kayit.donguHazirdi = !!L?.hazir;
    const sonra = () =>
      this.sonra(120, () => {
        this.dagit(j, dir);
        this.bostaPlanla();
      });
    if (L && L.hazir && !this.engel) {
      // Döngünün 0. karesi = geçişin son karesi (üretim kuralı): kesme, sönme yok.
      L.oynat = true;
      L.el.currentTime = 0;
      L.el.play().catch(() => {});
      this.goster(L.el, 0);
      sonra();
    } else if (d) void this.donguBaslat(j).then(sonra);
    else sonra(); // döngüsüz durak (duvar, DOM): son kare durur; DOM durağında VideoSahne gizle() ile söndürür
    this.olay("varis", kayit);
    sec.varis?.(kayit);
  }

  /** DOM geçişi bitti (broşür durakları arası, kapanış dönüşü). */
  domVaris(j: number) {
    const kayit = this.olaylar.at(-1);
    this.k = j;
    this.durum = "dur";
    this.posterAyarla(j);
    if (kayit && !kayit.bitti) {
      kayit.bitti = true;
      kayit.gecisMs = Math.round(performance.now() - kayit.tJest);
    }
    if (!this.posterKipi) {
      this.dagit(j, this.sonYon);
      this.bostaPlanla();
      if (this.dongu(j)) void this.donguBaslat(j);
    } else this.posterOnyukle(j, this.sonYon);
    this.olay("varis", kayit);
  }

  /** Yedek: j durağının posterine çapraz sönme (klip yok / hazır değil / engel); süre = klip süresi. */
  private yedek(j: number, dir: 1 | -1, kayit: Kayit, neden: string, g: KlipBilgi, sec: GecisSecenek) {
    if (kayit.bitti) return;
    kayit.bitti = true;
    kayit.yedek = neden;
    this.olay("yedek", kayit);
    const el = this.yedekEl;
    const u = this.posterUrl(j);
    el.style.backgroundImage = u ? `url("${u}")${this.lqip(j) ? `, url("${this.lqip(j)}")` : ""}` : "none";
    el.style.transition = "none";
    el.style.opacity = "0";
    el.style.transform = "scale(1.08)";
    void el.offsetWidth;
    el.style.transition = `opacity ${YEDEK_MS}ms ease, transform ${YEDEK_MS + 900}ms cubic-bezier(.2,.7,.2,1)`;
    el.style.opacity = "1";
    el.style.transform = "scale(1)";
    const n = g.kare;
    const t0 = performance.now();
    const sure = (g.sure * 1000) / g.hiz;
    // Kadraj/lombar zamana bağlı akar (video yok).
    const raf = () => {
      const f = Math.min(n - 1, Math.round(((performance.now() - t0) / sure) * (n - 1)));
      sec.kare?.(f, n);
      if (f < n - 1 && this.durum === "gecis") requestAnimationFrame(raf);
    };
    if (sec.kare) requestAnimationFrame(raf);
    if (this.posterKipi) this.posterOnyukle(j, dir);
    else this.dagit(j, dir);
    this.sonra(Math.max(YEDEK_MS, sure - (kayit.beklemeMs ?? 0)), () => {
      for (const y of this.yuvalar) if (!y.oynat || y.url !== this.dongu(j)?.url) y.el.pause();
      this.gizle(0);
      this.k = j;
      this.posterAyarla(j);
      this.durum = "dur";
      kayit.gecisMs = Math.round(performance.now() - kayit.tJest);
      if (!this.posterKipi) {
        this.dagit(j, dir);
        this.bostaPlanla();
      }
      this.olay("varis", kayit);
      sec.varis?.(kayit);
      if (!this.engel && !this.posterKipi && this.dongu(j)) void this.donguBaslat(j).then(() => this.yedekKaldir(200));
      else this.sonra(60, () => this.yedekKaldir(0)); // poster katmanı aynı kare
    });
  }

  /* ---------------- kapanış / temizlik ---------------- */
  /** Kapanış görünür: her video durur, kaynaklar ve bloblar bırakılır. */
  durdur() {
    this.durum = "kapali";
    this.veri.kapali = true;
    for (const z of this.zamanlar) window.clearTimeout(z);
    this.zamanlar.clear();
    for (const y of this.yuvalar) {
      y.surum++;
      y.el.pause();
      y.el.removeAttribute("src");
      y.el.load();
      y.url = null;
      y.hazir = false;
      y.oynat = false;
      y.cozum.splice(0).forEach((f) => f(false));
    }
    this.aktif = null;
    this.eski = null;
    this.veri.kullanimda.clear();
    this.veri.birak();
  }
  /** Klipsiz atlama (tarayıcının kendi kaydırması iki durak arasında bitti, kiosk başa dönüş). */
  atla(j: number) {
    if (this.durum === "gecis") return;
    for (const y of this.yuvalar) {
      y.el.pause();
      y.oynat = false;
    }
    this.gizle(0);
    this.yedekKaldir(0);
    this.basla(j);
  }
  /** Video yuvasını gelecekteki geçiş için 0. karesiyle göster (lombar deliğinin altı); hazır değilse yok. */
  onizle(j: number, dir: 1 | -1, solma = 0) {
    const g = this.gecis(this.k, dir);
    const T = g ? this.yuva(g.url) : null;
    if (!T || !T.hazir || this.engel) return false;
    // Her zaman ara (0'da olsa da): arama, hiç oynamamış öğenin "poster göster" bayrağını kaldırır, 0. kare çizilir.
    T.el.currentTime = 0;
    this.goster(T.el, solma);
    return j >= 0;
  }
  /**
   * Yön değişti (dikey ↔ yatay): set değişir, havuz yeniden kurulur. Yalnız dinlenmede çağrılır (VideoSahne
   * geçiş sırasındaki ölçümü varışa erteler). Kapanışta (kapali) yalnız set kaydedilir; dönüşte basla() onu kullanır.
   */
  boyutDegis(b: Boyut, kodek: KodekAd) {
    const kd = this.kodekYasak.has(kodek) ? "h264" : kodek;
    if (b === this.boyut && kd === this.kodek) return;
    if (this.durum === "kapali") {
      this.boyut = b;
      this.kodek = kd;
      return;
    }
    const k = this.k;
    this.durdur();
    this.boyut = b;
    this.kodek = kd;
    this.basla(k);
  }
  /** Kod çözme hatası: H.264'e dönüş istenir; dinlenmede `kodekUygula()` (VideoSahne çağırır). */
  kodekYedekIste() {
    if (this.kodek === "h264" || this.kodekBekliyor) return;
    this.kodekBekliyor = true;
    this.olay("kodek-yedek-iste", { kodek: this.kodek });
  }
  /** Bekleyen H.264 dönüşünü uygula (yalnız dinlenmede; havuz ve bloblar yeni kodekle yeniden kurulur). */
  kodekUygula() {
    if (!this.kodekBekliyor || this.durum === "gecis") return false;
    this.kodekBekliyor = false;
    const eski = this.kodek;
    this.kodekYasak.add(eski);
    if (this.durum === "kapali") {
      this.kodek = "h264";
      return true;
    }
    const k = this.k;
    this.durdur();
    this.kodek = "h264";
    this.basla(k);
    this.olay("kodek-yedek", { eski, yeni: "h264" });
    return true;
  }
  yokEt() {
    this.durdur();
    for (const t of ["touchend", "click", "keydown"]) removeEventListener(t, this.kilitDinle, { capture: true });
    document.removeEventListener("visibilitychange", this.gorunurlukDinle);
  }
}

/** Setin bu kodekteki en yüksek ortalama bit hızı (bps; manifest bayt / süre); decodingInfo'ya verilir. */
function tepeBitHizi(m: IstemciManifest, boyut: Boyut, kodek: KodekAd) {
  let tepe = 0;
  for (const d of m.duraklar) {
    for (const c of [d.dongu, d.ileri, d.ileri?.geri]) {
      const b = c?.bayt?.[boyut]?.[kodek];
      if (c && b && c.sure > 0) tepe = Math.max(tepe, (b * 8) / c.sure);
    }
  }
  return Math.round(tepe) || 2_000_000;
}

/** Kodek seçimi (R4 §4): mediaCapabilities (destekli + güç verimli + akıcı) → canPlayType → H.264. */
export async function kodekSec(m: IstemciManifest, boyut: Boyut, istek?: string | null): Promise<KodekAd> {
  const adaylar = m.kodekler.filter((k) => k.boyutlar.includes(boyut));
  const zorla = adaylar.find((k) => k.ad === istek);
  if (zorla) return zorla.ad;
  const { g, y } = m.boyutlar[boyut];
  for (const k of adaylar) {
    if (k.ad === "h264") continue;
    try {
      if (navigator.mediaCapabilities?.decodingInfo) {
        const r = await navigator.mediaCapabilities.decodingInfo({
          type: "file",
          video: { contentType: k.tip, width: g, height: y, bitrate: tepeBitHizi(m, boyut, k.ad), framerate: m.fps },
        });
        if (r.supported && r.powerEfficient && r.smooth) return k.ad;
      } else if (document.createElement("video").canPlayType(k.tip) === "probably") return k.ad;
    } catch {
      // sonraki aday
    }
  }
  return "h264";
}
