/**
 * Dijital broşür sahnesi (istemci, React dışı): 3B sayfa çevirme, yakınlaştırma, jestler, ön yükleme.
 *
 * Sayfa görüntüleri PDF'in birebir raster'ı (scripts/brosur/uret.mjs); sahnedeki <img>'lerin src'sini yalnız bu modül
 * (ve ilk boyamadan önce brosur.tsx'teki açılış betiği) yazar, React yazmaz. Çevirme:
 *   hazırla — yaprak (iki yüzlü) çevrilecek sayfanın üstüne 0°'de konur (görünen değişmez), altındaki yuvaya hedef
 *             sayfa yazılır; yaprak yüzleri ve alt sayfa img.decode() ile çözülmeden canlandırma BAŞLAMAZ (beyaz/boş
 *             kare yok), ardından iki kare (katman raster'ı).
 *   çevir   — yalnız transform (rotateY, kitap kaydırma) ve opacity (yüz ışığı, düşen gölge) — WAAPI, bileşikleyicide;
 *             filter, @property, her karede boyama YOK.
 *   bitir   — yaprağın kapattığı yuvaya hedef sayfa yazılır, çözülünce yaprak kalkar.
 * prefers-reduced-motion: eski sayfalar üstte kalıp 220 ms'de söner (çapraz geçiş).
 *
 * Yakınlaştırma: .bro-kamera'ya translate + scale (1×–4×). Jest sırasında will-change: transform (akıcı), bitince
 * kaldırılır (tarayıcı katmanı yeni ölçekte yeniden çizsin, keskin). Gereken aygıt pikseli sığdırma görüntüsünün 1,15
 * katını aşınca görünen sayfaların yetecek büyüklükteki AVIF'i (1240 ya da 2480) iner, çözülünce .bro-net üstte sessizce
 * görünür; uzaklaşınca bırakılır (bellek).
 */
import type { Dil } from "@/lib/dil";
import {
  AVIF_SINAMA,
  CIFT_SORGU,
  adrestenSayfa,
  gorselYolu,
  gorunumBul,
  sigdirGenislik,
  type Bicim,
  type Genislik,
  type Gorunum,
} from "./arayuz";

export type KitapDurum = {
  sol: number | null;
  sag: number | null;
  cift: boolean;
  yakin: boolean;
  yukleniyor: boolean;
};

export type Baglanti = { p: number; x: number; y: number; g: number; h: number; ad: string };

type Ayar = {
  sahne: HTMLElement;
  dil: Dil;
  ozet: readonly string[];
  n: number;
  /** Sayfa görüntüsünün alt metni ("Page 3 – Message"). */
  alt: (p: number) => string;
  /** Sayfadaki görünmez bağlantı alanları (yalnız İçindekiler). */
  baglantilar: (p: number) => readonly Baglanti[];
  bildir: (d: KitapDurum) => void;
};

/** Çevirme süresi; art arda istekte (kuyruk) kısalır. */
const SURE = 820;
const HIZLI = 440;
const EGRI = "cubic-bezier(.45,.05,.2,1)";
const YAKIN_EN = 4;
const CIFT_DOKUNMA = 2.5;
/**
 * Yüz görünürlüğü: dönüş 90°'yi (tüm canlandırmalar aynı eğride, ilerleme 0,5) geçince ön yüz söner, arka yüz belirir.
 * 3B'de backface-visibility zaten gizler (kenardan görünürken değişim görünmez); 3B birleştirmesi olmayan motorda
 * (Playwright WebKit/Windows: dönüş düz yatay ölçek olarak çiziliyor, iki yüz de boyanıyordu ve arka yüz önü örtüyordu)
 * sayfa yine doğru yüzüyle çevrilir.
 */
const ONCE: Keyframe[] = [{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }];
const SONRA: Keyframe[] = [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1, offset: 0.5 }, { opacity: 1 }];
/** Görüntü çözülemezse (ağ) çevirme bu kadar bekler, sonra yine de yürür. */
const COZ_SINIR = 6000;

type Yuva = { el: HTMLElement; taban: HTMLImageElement; net: HTMLImageElement; baglar: HTMLElement; golge: HTMLElement };
type Yuz = { el: HTMLElement; img: HTMLImageElement; isik: HTMLElement };
type Nokta = { x: number; y: number };
type Jest =
  | { tur: "bir"; id: number; x0: number; y0: number; t0: number; tx0: number; ty0: number; kaydi: boolean; hedefBag: boolean; tip: string }
  | { tur: "iki"; s0: number; tx0: number; ty0: number; d0: number; m0: Nokta };

const kare = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** img.decode(): çözülünce (ya da hata/süre sınırında) biter; src yoksa hemen. */
function coz(img: HTMLImageElement): Promise<void> {
  if (!img.getAttribute("src")) return Promise.resolve();
  return Promise.race([img.decode().catch(() => undefined), new Promise<void>((r) => setTimeout(r, COZ_SINIR))]);
}

/** Tarayıcı AVIF çözüyor mu (1×1 sınama görüntüsü; birkaç ms). */
export function avifSina(): Promise<boolean> {
  return new Promise((r) => {
    const i = new Image();
    i.onload = () => r(i.naturalWidth > 0);
    i.onerror = () => r(false);
    i.src = AVIF_SINAMA;
  });
}

export class Kitap {
  private a: Ayar;
  private alan: HTMLElement;
  private kamera: HTMLElement;
  private kitap: HTMLElement;
  private yuva: { sol: Yuva; sag: Yuva };
  private yaprak: { el: HTMLElement; on: Yuz; arka: Yuz };
  private solma: { el: HTMLElement; sol: HTMLImageElement; sag: HTMLImageElement };
  private mq = window.matchMedia(CIFT_SORGU);
  private azHareket = window.matchMedia("(prefers-reduced-motion: reduce)");

  private cift: boolean;
  private gor: Gorunum;
  private bicim: Bicim | null = null;
  private sigdir: 800 | 1240 | 2480 = 1240;
  private ceviriyor = false;
  private bekleyen: number | null = null;
  private yukleniyor = false;
  private yukZaman = 0;
  private olu = false;

  // Yakınlaştırma
  private s = 1;
  private tx = 0;
  private ty = 0;
  private icerik = { x0: 0, y0: 0, x1: 0, y1: 0 };
  private rafId = 0;
  private netZaman = 0;

  // Jest
  private ptr = new Map<number, Nokta>();
  private jest: Jest | null = null;
  private sonDokunma: { t: number; x: number; y: number } | null = null;
  private tekZaman = 0;
  private teker = { birikim: 0, kilit: false, zaman: 0 };
  private safari: { s0: number } | null = null;

  private iptalBekleyen: { id: number; zaman: number } | null = null;
  private onbellek = new Map<string, HTMLImageElement>();
  private gozlemci: ResizeObserver;
  private boyutZaman = 0;
  private kaldir: (() => void)[] = [];

  constructor(a: Ayar) {
    this.a = a;
    const q = <T extends Element>(s: string, k: ParentNode = a.sahne) => k.querySelector<T>(s)!;
    this.alan = q(".bro-alan");
    this.kamera = q(".bro-kamera");
    this.kitap = q("[data-kitap]");
    const yuva = (yan: string): Yuva => {
      const el = q<HTMLElement>(`[data-yuva="${yan}"]`, this.kitap);
      return { el, taban: q(".bro-taban", el), net: q(".bro-net", el), baglar: q(".bro-baglar", el), golge: q(".bro-golge", el) };
    };
    this.yuva = { sol: yuva("sol"), sag: yuva("sag") };
    const yap = q<HTMLElement>("[data-yaprak]", this.kitap);
    const yuz = (s: string): Yuz => {
      const el = q<HTMLElement>(s, yap);
      return { el, img: q("img", el), isik: q(".bro-isik", el) };
    };
    this.yaprak = { el: yap, on: yuz(".bro-on"), arka: yuz(".bro-arka") };
    const sol = q<HTMLElement>("[data-solma]", this.kitap);
    this.solma = { el: sol, sol: q('img[data-yan="sol"]', sol), sag: q('img[data-yan="sag"]', sol) };

    this.cift = this.mq.matches;
    const p = adrestenSayfa(location.hash, a.n) ?? 1;
    this.gor = gorunumBul(p, this.cift, a.n);
    // Açılış betiği (brosur.tsx) bu sayfayı ve biçimi seçtiyse aynı adresler yeniden yazılır (yeniden indirme yok).
    const ilk = this.kitap.dataset.ilk?.split(" ");
    if (ilk?.[2] === "avif" || ilk?.[2] === "webp") this.bicim = ilk[2];

    this.olayKur();
    this.gozlemci = new ResizeObserver(() => {
      clearTimeout(this.boyutZaman);
      this.boyutZaman = window.setTimeout(() => this.boyutDegisti(), 120);
    });
    this.gozlemci.observe(this.alan);

    const basla = () => {
      if (this.olu) return;
      this.sigdir = this.sigdirHesapla();
      // Açılış betiği henüz yazmadıysa artık yazmasın (aynı seçim; yarış yok).
      this.kitap.dataset.ilk = `${this.ilk(this.gor)} ${this.sigdir} ${this.bicim}`;
      this.goster(this.gor);
      this.bildir();
      void Promise.all([coz(this.yuva.sol.taban), coz(this.yuva.sag.taban)]).then(() => this.onYukle());
    };
    if (this.bicim) basla();
    else
      void avifSina().then((v) => {
        this.bicim = v ? "avif" : "webp";
        basla();
      });
    this.bildir();
  }

  // ————— dışa açık —————

  /** Sayfaya git (görünümü o sayfayı içeren yayılım/sayfa). */
  git(p: number) {
    if (this.olu || !this.bicim) return;
    const hedef = gorunumBul(Math.min(this.a.n, Math.max(1, Math.round(p))), this.cift, this.a.n);
    if (this.ceviriyor) {
      this.bekleyen = this.ilk(hedef);
      return;
    }
    if (this.ayni(hedef, this.gor)) return;
    if (this.s > 1.01) this.yakinlik(1, null, true);
    const yon = this.ilk(hedef) > this.ilk(this.gor) ? 1 : -1;
    void this.cevir(hedef, yon);
  }

  ileri() {
    const g = this.ceviriyor && this.bekleyen !== null ? gorunumBul(this.bekleyen, this.cift, this.a.n) : this.gor;
    const son = g.sag ?? g.sol ?? 1;
    if (son < this.a.n) this.git(son + 1);
  }

  geri() {
    const g = this.ceviriyor && this.bekleyen !== null ? gorunumBul(this.bekleyen, this.cift, this.a.n) : this.gor;
    const ilk = g.sol ?? g.sag ?? 1;
    if (ilk > 1) this.git(ilk - 1);
  }

  /** Yakınlaştır/uzaklaştır (düğme, klavye): sahnenin ortasına göre kat. */
  yakinlastir(kat: number) {
    const r = this.a.sahne.getBoundingClientRect();
    this.yakinlik(this.s * kat, { x: r.width / 2, y: r.height / 2 }, true);
  }

  yakinlikSifirla() {
    this.yakinlik(1, null, true);
  }

  yokEt() {
    this.olu = true;
    this.gozlemci.disconnect();
    for (const f of this.kaldir) f();
    clearTimeout(this.tekZaman);
    clearTimeout(this.netZaman);
    clearTimeout(this.boyutZaman);
    clearTimeout(this.teker.zaman);
    if (this.iptalBekleyen) clearTimeout(this.iptalBekleyen.zaman);
    cancelAnimationFrame(this.rafId);
    this.onbellek.clear();
  }

  // ————— görünüm —————

  private ilk(g: Gorunum) {
    return g.sol ?? g.sag ?? 1;
  }

  private ayni(a: Gorunum, b: Gorunum) {
    return a.sol === b.sol && a.sag === b.sag;
  }

  private url(p: number, w: Genislik) {
    return gorselYolu(this.a.dil, this.a.ozet, p, w, this.bicim ?? "webp");
  }

  /** Sayfa kutusunun CSS genişliği × DPR → sığdırma görüntüsü. */
  private sigdirHesapla(): 800 | 1240 | 2480 {
    return sigdirGenislik(this.yuva.sag.el.offsetWidth * (window.devicePixelRatio || 1));
  }

  private resim(img: HTMLImageElement, p: number | null, w: Genislik = this.sigdir) {
    if (p === null) {
      if (img.hasAttribute("src")) img.removeAttribute("src");
      img.alt = "";
      delete img.dataset.p;
      return;
    }
    const u = this.url(p, w);
    if (img.getAttribute("src") !== u) img.src = u;
    img.alt = img.classList.contains("bro-taban") ? this.a.alt(p) : "";
    img.dataset.p = String(p);
  }

  private yuvaKoy(yan: "sol" | "sag", p: number | null) {
    const y = this.yuva[yan];
    this.resim(y.taban, p);
    y.el.dataset.p = p === null ? "" : String(p);
    this.netBirak(y);
    // Görünmez bağlantı alanları (İçindekiler): yalnız o sayfa yuvadayken.
    const b = p === null ? [] : this.a.baglantilar(p);
    if (y.baglar.dataset.p !== String(p)) {
      y.baglar.replaceChildren(
        ...b.map((k) => {
          const el = document.createElement("a");
          el.className = "bro-bag";
          el.href = `#p=${k.p}`;
          el.setAttribute("aria-label", k.ad);
          el.style.cssText = `left:${k.x * 100}%;top:${k.y * 100}%;width:${k.g * 100}%;height:${k.h * 100}%`;
          el.draggable = false;
          return el;
        }),
      );
      y.baglar.dataset.p = String(p);
    }
  }

  private kaydirma(g: Gorunum): number {
    if (!this.cift) return 0;
    return g.sol === null ? -25 : g.sag === null ? 25 : 0;
  }

  /** Görünümü canlandırmasız yaz (açılış, boyut değişimi). */
  private goster(g: Gorunum) {
    this.yuvaKoy("sol", this.cift ? g.sol : null);
    this.yuvaKoy("sag", g.sag);
    this.kitap.dataset.sol = g.sol === null ? "" : String(g.sol);
    this.kitap.dataset.sag = g.sag === null ? "" : String(g.sag);
    this.gor = g;
    this.icerikOlc();
  }

  private bildir() {
    const g = this.ceviriyor && this.hedefGor ? this.hedefGor : this.gor;
    this.a.bildir({ sol: g.sol, sag: g.sag, cift: this.cift, yakin: this.s > 1.01, yukleniyor: this.yukleniyor });
  }

  private hedefGor: Gorunum | null = null;

  /** Adres: #p=N (geçmişe giriş eklemez; geri tuşu broşürden çıkar). Kapakta çapa yok. */
  private adresYaz(g: Gorunum) {
    const p = this.ilk(g);
    const yeni = p === 1 ? location.pathname + location.search : `#p=${p}`;
    if ((p === 1 && !location.hash) || location.hash === `#p=${p}`) return;
    history.replaceState(null, "", yeni);
  }

  private yukleniyorYaz(v: boolean) {
    clearTimeout(this.yukZaman);
    if (v) {
      // Kısa beklemelerde gösterge yanıp sönmesin.
      this.yukZaman = window.setTimeout(() => {
        this.yukleniyor = true;
        this.a.sahne.dataset.yukleniyor = "1";
        this.bildir();
      }, 250);
    } else if (this.yukleniyor) {
      this.yukleniyor = false;
      delete this.a.sahne.dataset.yukleniyor;
      this.bildir();
    }
  }

  // ————— çevirme —————

  private async cevir(hedef: Gorunum, yon: 1 | -1) {
    this.ceviriyor = true;
    this.hedefGor = hedef;
    const eski = this.gor;
    this.adresYaz(hedef);
    this.bildir();
    const sure = this.bekleyen !== null || this.hizliSonraki ? HIZLI : SURE;
    this.hizliSonraki = false;
    try {
      if (this.azHareket.matches) await this.solmaGecis(eski, hedef);
      else if (this.cift) await this.ciftCevir(eski, hedef, yon, sure);
      else await this.tekCevir(eski, hedef, yon, sure);
    } finally {
      this.kitap.dataset.sol = hedef.sol === null ? "" : String(hedef.sol);
      this.kitap.dataset.sag = hedef.sag === null ? "" : String(hedef.sag);
      this.gor = hedef;
      this.hedefGor = null;
      this.ceviriyor = false;
      this.yukleniyorYaz(false);
      this.icerikOlc();
    }
    if (this.olu) return;
    this.bildir();
    const b = this.bekleyen;
    this.bekleyen = null;
    if (b !== null && !this.ayni(gorunumBul(b, this.cift, this.a.n), this.gor)) {
      this.hizliSonraki = true;
      this.git(b);
    } else this.onYukle();
  }

  private hizliSonraki = false;

  /** Çözülmeyi bekle; uzarsa yükleniyor göstergesi. */
  private async hazir(imgs: HTMLImageElement[]) {
    this.yukleniyorYaz(true);
    await Promise.all(imgs.map(coz));
    this.yukleniyorYaz(false);
    await kare();
    await kare();
  }

  private ac(el: Element, kf: Keyframe[], sure: number) {
    return el.animate(kf, { duration: sure, easing: EGRI, fill: "forwards" });
  }

  private async ciftCevir(eski: Gorunum, hedef: Gorunum, yon: 1 | -1, sure: number) {
    const Y = this.yaprak;
    const ileri = yon > 0;
    // İleri: sağ sayfa sırttan (sol kenarı) kalkar, arkası hedefin sol sayfası. Geri: sol sayfa sağ kenarından.
    Y.el.dataset.yan = ileri ? "sag" : "sol";
    delete Y.el.dataset.kagit;
    this.resim(Y.on.img, ileri ? eski.sag : eski.sol);
    this.resim(Y.arka.img, ileri ? hedef.sol : hedef.sag);
    Y.el.style.transform = "rotateY(0deg)";
    Y.arka.el.style.opacity = "0";
    Y.el.hidden = false;
    const acilan = ileri ? "sag" : "sol"; // yaprağın altından açılan yuva
    const kapanan = ileri ? "sol" : "sag"; // yaprağın üstüne kapandığı yuva
    this.yuvaKoy(acilan, ileri ? hedef.sag : hedef.sol);
    await this.hazir([Y.on.img, Y.arka.img, this.yuva[acilan].taban]);
    if (this.olu) return;

    const aci = ileri ? -180 : 180;
    const a = [
      this.ac(Y.el, [{ transform: "rotateY(0deg)" }, { transform: `rotateY(${aci}deg)` }], sure),
      this.ac(Y.on.el, ONCE, sure),
      this.ac(Y.arka.el, SONRA, sure),
      this.ac(Y.on.isik, [{ opacity: 0 }, { opacity: 0.5, offset: 0.5 }, { opacity: 0.5 }], sure),
      this.ac(Y.arka.isik, [{ opacity: 0.5 }, { opacity: 0.5, offset: 0.5 }, { opacity: 0 }], sure),
      this.ac(this.yuva[acilan].golge, [{ opacity: 0.6 }, { opacity: 0, offset: 0.7 }, { opacity: 0 }], sure),
      this.ac(this.yuva[kapanan].golge, [{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 0.4, offset: 0.85 }, { opacity: 0 }], sure),
    ];
    const k0 = this.kaydirma(eski);
    const k1 = this.kaydirma(hedef);
    if (k0 !== k1) a.push(this.ac(this.kitap, [{ transform: `translateX(${k0}%)` }, { transform: `translateX(${k1}%)` }], sure));
    await a[0].finished.catch(() => undefined);
    // Kapanan yuvaya hedef sayfa (yaprak hâlâ üstünde; aynı adres, bellekte).
    this.yuvaKoy(kapanan, ileri ? hedef.sol : hedef.sag);
    this.kitap.dataset.sol = hedef.sol === null ? "" : String(hedef.sol);
    this.kitap.dataset.sag = hedef.sag === null ? "" : String(hedef.sag);
    await coz(this.yuva[kapanan].taban);
    await kare();
    Y.el.hidden = true;
    for (const x of a) x.cancel();
    Y.arka.el.style.opacity = "";
    this.resim(Y.on.img, null);
    this.resim(Y.arka.img, null);
  }

  private async tekCevir(eski: Gorunum, hedef: Gorunum, yon: 1 | -1, sure: number) {
    const Y = this.yaprak;
    const ileri = yon > 0;
    // Sayfa sol kenarından (sırt) döner; arkası koyu kâğıt. İleri: üstteki sayfa kalkar, altında hedef.
    // Geri: hedef sayfa soldan gelip üstüne kapanır.
    Y.el.dataset.yan = "sag";
    Y.el.dataset.kagit = "";
    this.resim(Y.arka.img, null);
    this.resim(Y.on.img, ileri ? eski.sag : hedef.sag);
    Y.el.style.transform = ileri ? "rotateY(0deg)" : "rotateY(-180deg)";
    Y.arka.el.style.opacity = "0";
    if (!ileri) Y.on.el.style.opacity = "0";
    Y.el.hidden = false;
    if (ileri) this.yuvaKoy("sag", hedef.sag);
    await this.hazir(ileri ? [Y.on.img, this.yuva.sag.taban] : [Y.on.img]);
    if (this.olu) return;
    const [r0, r1] = ileri ? [0, -180] : [-180, 0];
    const a = [
      this.ac(Y.el, [{ transform: `rotateY(${r0}deg)` }, { transform: `rotateY(${r1}deg)` }], sure),
      this.ac(Y.on.el, ileri ? ONCE : SONRA, sure),
      this.ac(Y.on.isik, ileri ? [{ opacity: 0 }, { opacity: 0.5, offset: 0.5 }, { opacity: 0.5 }] : [{ opacity: 0.5 }, { opacity: 0.5, offset: 0.5 }, { opacity: 0 }], sure),
      // Kâğıt arkası (yalnız dönüşün sol yarısında) sahnenin solunda: uçta sönük (geniş dikey ekranda birden belirmesin).
      this.ac(
        Y.arka.el,
        ileri
          ? [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1, offset: 0.5 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }]
          : [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.5 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }],
        sure,
      ),
      this.ac(
        this.yuva.sag.golge,
        ileri ? [{ opacity: 0.6 }, { opacity: 0, offset: 0.7 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 0.45, offset: 0.85 }, { opacity: 0 }],
        sure,
      ),
    ];
    await a[0].finished.catch(() => undefined);
    if (!ileri) {
      this.yuvaKoy("sag", hedef.sag);
      await coz(this.yuva.sag.taban);
      await kare();
    }
    Y.el.hidden = true;
    for (const x of a) x.cancel();
    Y.on.el.style.opacity = "";
    Y.arka.el.style.opacity = "";
    this.resim(Y.on.img, null);
  }

  /** Azaltılmış hareket: eski sayfalar üstte (aynı adres, çözülmüş), altta hedef; üst katman söner. */
  private async solmaGecis(eski: Gorunum, hedef: Gorunum) {
    const S = this.solma;
    this.resim(S.sol, this.cift ? eski.sol : null);
    this.resim(S.sag, eski.sag);
    S.el.style.transform = "";
    S.el.hidden = false;
    await Promise.all([coz(S.sol), coz(S.sag)]);
    this.yuvaKoy("sol", this.cift ? hedef.sol : null);
    this.yuvaKoy("sag", hedef.sag);
    await this.hazir([this.yuva.sol.taban, this.yuva.sag.taban]);
    // Kitap kayması (kapak ortalama) anında; üst katman eski konumda kalsın.
    const k0 = this.kaydirma(eski);
    const k1 = this.kaydirma(hedef);
    this.kitap.dataset.sol = hedef.sol === null ? "" : String(hedef.sol);
    this.kitap.dataset.sag = hedef.sag === null ? "" : String(hedef.sag);
    S.el.style.transform = k0 !== k1 ? `translateX(${k0 - k1}%)` : "";
    const a = S.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-out", fill: "forwards" });
    await a.finished.catch(() => undefined);
    S.el.hidden = true;
    a.cancel();
    this.resim(S.sol, null);
    this.resim(S.sag, null);
  }

  // ————— ön yükleme —————

  /**
   * Komşu görünümlerin sayfaları (bir ileri, bir geri; yayılımda ikişer sayfa) sığdırma boyutunda indirilip çözülür; en
   * çok 8 görüntü tutulur. İki ileri yüklemek ilk açılışa telefonda +~120 kB katıyordu (ölçüm: .qa/brosur-2/bayt.json);
   * bir sonraki görünüm, bu görünüme varınca iner.
   */
  private onYukle() {
    if (this.olu || !this.bicim) return;
    const g = this.gor;
    const son = g.sag ?? g.sol ?? 1;
    const ilk = g.sol ?? g.sag ?? 1;
    const sayfalar: number[] = [];
    const ekle = (p: number) => {
      if (p < 1 || p > this.a.n) return;
      for (const q of [gorunumBul(p, this.cift, this.a.n)].flatMap((v) => [v.sol, v.sag])) if (q !== null && !sayfalar.includes(q)) sayfalar.push(q);
    };
    ekle(son + 1);
    ekle(ilk - 1);
    const tut = new Set<string>();
    for (const p of sayfalar) {
      const u = this.url(p, this.sigdir);
      tut.add(u);
      if (this.onbellek.has(u)) continue;
      const i = new Image();
      i.decoding = "async";
      i.fetchPriority = "low";
      i.src = u;
      void i.decode().catch(() => undefined);
      this.onbellek.set(u, i);
    }
    // Eski girdiler (en yeniler kalır): bellekte çözülmüş görüntü sınırı.
    for (const k of this.onbellek.keys()) {
      if (this.onbellek.size <= 8) break;
      if (!tut.has(k)) this.onbellek.delete(k);
    }
  }

  // ————— yakınlaştırma —————

  /** Görünen sayfaların sahnedeki kutusu (ölçek 1'de). */
  private icerikOlc() {
    const sr = this.a.sahne.getBoundingClientRect();
    const kutu = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    for (const yan of ["sol", "sag"] as const) {
      const y = this.yuva[yan];
      if (!y.el.dataset.p || y.el.offsetWidth === 0) continue;
      const r = y.el.getBoundingClientRect();
      const x0 = (r.left - sr.left - this.tx) / this.s;
      const y0 = (r.top - sr.top - this.ty) / this.s;
      kutu.x0 = Math.min(kutu.x0, x0);
      kutu.y0 = Math.min(kutu.y0, y0);
      kutu.x1 = Math.max(kutu.x1, x0 + r.width / this.s);
      kutu.y1 = Math.max(kutu.y1, y0 + r.height / this.s);
    }
    if (Number.isFinite(kutu.x0)) this.icerik = kutu;
  }

  private sinirla() {
    if (this.s <= 1.001) {
      this.s = 1;
      this.tx = 0;
      this.ty = 0;
      return;
    }
    const W = this.a.sahne.clientWidth;
    const H = this.a.sahne.clientHeight;
    const c = this.icerik;
    const s = this.s;
    const w = (c.x1 - c.x0) * s;
    const h = (c.y1 - c.y0) * s;
    this.tx = w <= W ? W / 2 - (s * (c.x0 + c.x1)) / 2 : Math.min(-s * c.x0, Math.max(W - s * c.x1, this.tx));
    this.ty = h <= H ? H / 2 - (s * (c.y0 + c.y1)) / 2 : Math.min(-s * c.y0, Math.max(H - s * c.y1, this.ty));
  }

  private uygula(anim: boolean) {
    const k = this.kamera;
    k.style.transition = anim ? "transform 280ms cubic-bezier(.2,.7,.2,1)" : "none";
    k.style.transform = this.s === 1 ? "" : `translate3d(${this.tx}px,${this.ty}px,0) scale(${this.s})`;
  }

  private kareUygula() {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.uygula(false);
    });
  }

  /** Ölçeği `s2`'ye getir; `m` sahne koordinatında sabit kalan nokta (null: orta). */
  private yakinlik(s2: number, m: Nokta | null, anim: boolean) {
    if (this.ceviriyor && s2 > 1) return;
    const eski = this.s;
    s2 = Math.min(YAKIN_EN, Math.max(1, s2));
    if (eski <= 1.001 && s2 > 1.001) this.icerikOlc();
    const p = m ?? { x: this.a.sahne.clientWidth / 2, y: this.a.sahne.clientHeight / 2 };
    const k = s2 / eski;
    this.tx = p.x - (p.x - this.tx) * k;
    this.ty = p.y - (p.y - this.ty) * k;
    this.s = s2;
    this.sinirla();
    this.kamera.style.willChange = "transform";
    this.uygula(anim);
    this.yakinBitti(anim ? 300 : 160);
    if ((eski > 1.01) !== (this.s > 1.01)) {
      this.a.sahne.dataset.yakin = this.s > 1.01 ? "1" : "";
      this.bildir();
    }
  }

  /** Jest/geçiş durunca: will-change kalkar (keskin yeniden çizim), gerekirse 2480 px görüntü iner. */
  private yakinBitti(ms: number) {
    clearTimeout(this.netZaman);
    this.netZaman = window.setTimeout(() => {
      if (this.jest?.tur === "iki" || this.safari) return;
      this.kamera.style.willChange = "";
      this.netGuncelle();
    }, ms);
  }

  /**
   * Yakın görüntü: gereken aygıt pikseli sığdırmanın 1,15 katını aşınca, yetecek en küçük boyut (1240 ya da 2480;
   * masaüstü DPR 1'de 2,5× ≈ 1130 px → 1240, telefon DPR 3'te 2,5× ≈ 2700 px → 2480). Yakınken küçültülmez.
   * WebP yedeğinde (yalnız 1240 var) yükseltme yok.
   */
  private netGuncelle() {
    const gereken = this.s * this.yuva.sag.el.offsetWidth * (window.devicePixelRatio || 1);
    const hedef: 1240 | 2480 | null =
      this.bicim !== "avif" || this.s <= 1.01 || gereken <= this.sigdir * 1.15
        ? null
        : this.sigdir < 1240 && gereken <= 1240 * 1.15
          ? 1240
          : this.sigdir < 2480
            ? 2480
            : null;
    for (const yan of ["sol", "sag"] as const) {
      const y = this.yuva[yan];
      const p = y.el.dataset.p ? Number(y.el.dataset.p) : null;
      if (hedef === null || p === null) {
        this.netBirak(y);
        continue;
      }
      if (y.net.dataset.p === String(p) && Number(y.net.dataset.w) >= hedef) continue;
      this.resim(y.net, p, hedef);
      y.net.dataset.w = String(hedef);
      const u = y.net.src;
      void coz(y.net).then(() => {
        // Hâlâ aynı adres ve yakınsa üste al (anında; geçiş yok). Altta sığdırma görüntüsü hep duruyor.
        if (y.net.src === u && y.net.complete && y.net.naturalWidth > 0 && this.s > 1.01) y.net.dataset.hazir = "1";
      });
    }
  }

  private netBirak(y: Yuva) {
    delete y.net.dataset.hazir;
    delete y.net.dataset.w;
    this.resim(y.net, null);
  }

  // ————— jestler —————

  private nokta(e: { clientX: number; clientY: number }): Nokta {
    const r = this.a.sahne.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private dinle<K extends keyof HTMLElementEventMap>(hedef: HTMLElement, tur: K, f: (e: HTMLElementEventMap[K]) => void, o?: AddEventListenerOptions) {
    hedef.addEventListener(tur, f as EventListener, o);
    this.kaldir.push(() => hedef.removeEventListener(tur, f as EventListener, o));
  }

  private olayKur() {
    const S = this.a.sahne;
    this.dinle(S, "pointerdown", (e) => this.basildi(e));
    this.dinle(S, "pointermove", (e) => this.kaydi(e));
    this.dinle(S, "pointerup", (e) => {
      if (this.iptalBekleyen?.id === e.pointerId) {
        clearTimeout(this.iptalBekleyen.zaman);
        this.iptalBekleyen = null;
      }
      this.birakildi(e, false);
    });
    // pointercancel hemen iptal sayılmaz: Playwright WebKit (Windows) kaydırmanın sonunda pointercancel'ın ARDINDAN aynı
    // işaretçinin pointerup'ını gönderiyor; 80 ms içinde pointerup gelirse olağan bırakma. Gelmezse (iOS'ta sistem jesti
    // dokunmayı aldıysa) iptal.
    this.dinle(S, "pointercancel", (e) => {
      if (!this.ptr.has(e.pointerId)) return;
      if (this.iptalBekleyen) clearTimeout(this.iptalBekleyen.zaman);
      const id = e.pointerId;
      this.iptalBekleyen = {
        id,
        zaman: window.setTimeout(() => {
          this.iptalBekleyen = null;
          if (this.ptr.has(id)) this.birakildi(e, true);
        }, 80),
      };
    });
    // iOS: dokunarak kaydırma/yakınlaştırma tarayıcıya hiç geçmesin (touch-action: none'a ek güvence; pointercancel
    // olmasın). touchstart'a dokunulmaz: tıklama (küçük resim, İçindekiler alanı) üretilsin.
    this.dinle(S, "touchmove", (e) => e.preventDefault(), { passive: false });
    // Yalnız sahnenin kendi yakalaması koparsa: dokunmada tarayıcının hedef öğedeki örtük yakalaması, setPointerCapture
    // ile sahneye geçerken de lostpointercapture (hedefte) gelir; onu iptal saymak kaydırmayı bozuyordu.
    this.dinle(S, "lostpointercapture", (e) => {
      if (e.target === S && this.ptr.has(e.pointerId)) this.birakildi(e, true);
    });
    this.dinle(S, "wheel", (e) => this.tekerlek(e), { passive: false });
    this.dinle(S, "dragstart", (e) => e.preventDefault());
    this.dinle(S, "click", (e) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>("a.bro-bag");
      if (!a) return;
      e.preventDefault();
      const p = adrestenSayfa(a.getAttribute("href") ?? "", this.a.n);
      if (p) this.git(p);
    });
    // Safari (macOS izleme yüzeyi kıstırması; iOS'ta sayfa yakınlaştırmasını da keser).
    const g = (e: Event & { scale?: number; clientX?: number; clientY?: number }, tur: string) => {
      e.preventDefault();
      if ([...this.ptr.keys()].length > 0) return; // iOS: dokunma işaretçileri zaten işleniyor
      if (tur === "start") this.safari = { s0: this.s };
      else if (tur === "change" && this.safari && e.scale) {
        this.yakinlik(this.safari.s0 * e.scale, e.clientX !== undefined ? this.nokta(e as { clientX: number; clientY: number }) : null, false);
      } else if (tur === "end") {
        this.safari = null;
        this.yakinBitti(120);
      }
    };
    for (const t of ["start", "change", "end"]) {
      const f = (e: Event) => g(e, t);
      S.addEventListener(`gesture${t}`, f, { passive: false });
      this.kaldir.push(() => S.removeEventListener(`gesture${t}`, f));
    }
    const kipDegisti = () => this.boyutDegisti();
    this.mq.addEventListener("change", kipDegisti);
    this.kaldir.push(() => this.mq.removeEventListener("change", kipDegisti));
    const adres = () => {
      const p = adrestenSayfa(location.hash, this.a.n);
      if (p !== null && p !== this.ilk(this.gor)) this.git(p);
    };
    window.addEventListener("hashchange", adres);
    this.kaldir.push(() => window.removeEventListener("hashchange", adres));
  }

  private basildi(e: PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    this.ptr.set(e.pointerId, this.nokta(e));
    if (this.ptr.size === 1) {
      const p = this.ptr.get(e.pointerId)!;
      this.jest = {
        tur: "bir",
        id: e.pointerId,
        x0: p.x,
        y0: p.y,
        t0: e.timeStamp,
        tx0: this.tx,
        ty0: this.ty,
        kaydi: false,
        hedefBag: !!(e.target as Element).closest("a.bro-bag"),
        tip: e.pointerType,
      };
      if (e.pointerType === "mouse" && this.s > 1.01) e.preventDefault();
    } else if (this.ptr.size === 2) {
      const [a, b] = [...this.ptr.values()];
      clearTimeout(this.tekZaman);
      this.sonDokunma = null;
      if (this.ceviriyor) {
        this.jest = null;
        return;
      }
      for (const id of this.ptr.keys()) this.yakala(id);
      if (this.s <= 1.001) this.icerikOlc();
      this.jest = { tur: "iki", s0: this.s, tx0: this.tx, ty0: this.ty, d0: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), m0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
      this.kamera.style.willChange = "transform";
      clearTimeout(this.netZaman);
    }
  }

  private yakala(id: number) {
    try {
      this.a.sahne.setPointerCapture(id);
    } catch {
      // İşaretçi gitmiş.
    }
  }

  private kaydi(e: PointerEvent) {
    if (!this.ptr.has(e.pointerId)) return;
    const p = this.nokta(e);
    this.ptr.set(e.pointerId, p);
    const j = this.jest;
    if (!j) return;
    if (j.tur === "iki") {
      if (this.ptr.size < 2) return;
      const [a, b] = [...this.ptr.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const s2 = Math.min(YAKIN_EN, Math.max(1, (j.s0 * d) / j.d0));
      // İki parmak altındaki içerik noktası parmakların ortasında kalsın (kaydırma dahil).
      const cx = (j.m0.x - j.tx0) / j.s0;
      const cy = (j.m0.y - j.ty0) / j.s0;
      const eskiYakin = this.s > 1.01;
      this.s = s2;
      this.tx = m.x - cx * s2;
      this.ty = m.y - cy * s2;
      this.sinirla();
      this.kareUygula();
      if (eskiYakin !== this.s > 1.01) {
        this.a.sahne.dataset.yakin = this.s > 1.01 ? "1" : "";
        this.bildir();
      }
      return;
    }
    if (e.pointerId !== j.id) return;
    const dx = p.x - j.x0;
    const dy = p.y - j.y0;
    if (!j.kaydi && Math.hypot(dx, dy) > 8) {
      j.kaydi = true;
      this.yakala(e.pointerId);
      clearTimeout(this.tekZaman);
      if (this.s > 1.01) this.kamera.style.willChange = "transform";
    }
    if (j.kaydi && this.s > 1.01) {
      this.tx = j.tx0 + dx;
      this.ty = j.ty0 + dy;
      this.sinirla();
      this.kareUygula();
    }
  }

  private birakildi(e: PointerEvent, iptal: boolean) {
    if (!this.ptr.has(e.pointerId)) return;
    const p = this.ptr.get(e.pointerId)!;
    this.ptr.delete(e.pointerId);
    const j = this.jest;
    if (!j) return;
    if (j.tur === "iki") {
      if (this.ptr.size === 1) {
        // Kalan parmakla kaydırmaya geç.
        const [[id, q]] = [...this.ptr.entries()];
        this.jest = { tur: "bir", id, x0: q.x, y0: q.y, t0: e.timeStamp, tx0: this.tx, ty0: this.ty, kaydi: true, hedefBag: false, tip: "touch" };
      } else this.jest = null;
      if (this.s <= 1.03) this.yakinlik(1, null, true);
      else this.yakinBitti(60);
      return;
    }
    if (e.pointerId !== j.id) return;
    this.jest = null;
    if (iptal) return;
    const dx = p.x - j.x0;
    const dy = p.y - j.y0;
    const dt = e.timeStamp - j.t0;
    if (!j.kaydi) {
      if (dt < 500 && !j.hedefBag) this.dokundu(p, j.tip);
      return;
    }
    if (this.s > 1.01) {
      this.yakinBitti(60);
      return;
    }
    // Yatay kaydırma: 40 px üstü ya da hızlı fiske (≥ 0,35 px/ms, 20 px üstü).
    const hiz = Math.abs(dx) / Math.max(1, dt);
    if (Math.abs(dx) > 1.2 * Math.abs(dy) && (Math.abs(dx) > 40 || (Math.abs(dx) > 20 && hiz > 0.35))) {
      if (dx < 0) this.ileri();
      else this.geri();
    }
  }

  /** Dokunma/tık: sol yarı geri, sağ yarı ileri; dokunmatikte çift dokunma yakınlaştırır (tek dokunma 280 ms bekler). */
  private dokundu(p: Nokta, tip: string) {
    const tek = () => {
      if (this.s > 1.01) return;
      const r = this.kitap.getBoundingClientRect();
      const sr = this.a.sahne.getBoundingClientRect();
      const orta = r.left - sr.left + r.width / 2;
      if (p.x < orta) this.geri();
      else this.ileri();
    };
    if (tip === "mouse") {
      tek();
      return;
    }
    const simdi = performance.now();
    const o = this.sonDokunma;
    if (o && simdi - o.t < 320 && Math.hypot(p.x - o.x, p.y - o.y) < 40) {
      clearTimeout(this.tekZaman);
      this.sonDokunma = null;
      if (this.s > 1.01) this.yakinlik(1, null, true);
      else this.yakinlik(CIFT_DOKUNMA, p, true);
      return;
    }
    this.sonDokunma = { t: simdi, x: p.x, y: p.y };
    clearTimeout(this.tekZaman);
    this.tekZaman = window.setTimeout(() => {
      this.sonDokunma = null;
      tek();
    }, 280);
  }

  private tekerlek(e: WheelEvent) {
    e.preventDefault();
    const olcek = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    const dx = e.deltaX * olcek;
    const dy = e.deltaY * olcek;
    if (e.ctrlKey) {
      // Ctrl + tekerlek ya da izleme yüzeyi kıstırması (Chrome/Firefox ctrlKey'li wheel gönderir).
      const k = Math.abs(dy) >= 50 ? (dy > 0 ? 1 / 1.25 : 1.25) : Math.exp(-dy / 100);
      this.yakinlik(this.s * k, this.nokta(e), false);
      return;
    }
    if (this.s > 1.01) {
      this.tx -= dx;
      this.ty -= dy;
      this.sinirla();
      this.kareUygula();
      this.yakinBitti(160);
      return;
    }
    // Ölçek 1: bir tekerlek/kaydırma hareketi = bir çevirme (izleme yüzeyi ataleti tek çevirmede kalır).
    const T = this.teker;
    T.birikim += Math.abs(dx) > Math.abs(dy) ? dx : dy;
    clearTimeout(T.zaman);
    T.zaman = window.setTimeout(() => {
      T.kilit = false;
      T.birikim = 0;
    }, 220);
    if (!T.kilit && Math.abs(T.birikim) > 60) {
      T.kilit = true;
      if (T.birikim > 0) this.ileri();
      else this.geri();
    }
  }

  // ————— boyut —————

  private boyutDegisti() {
    if (this.olu || !this.bicim) return;
    if (this.ceviriyor) {
      // Çevirme bitince yeniden bak (yarıda kip değişirse yaprak eski kipin geometrisinde biter).
      clearTimeout(this.boyutZaman);
      this.boyutZaman = window.setTimeout(() => this.boyutDegisti(), 200);
      return;
    }
    const cift = this.mq.matches;
    const w = this.sigdirHesapla();
    const kip = cift !== this.cift;
    if (kip || w > this.sigdir) {
      if (this.s > 1.01) this.yakinlik(1, null, false);
      this.cift = cift;
      // Yalnız büyür: küçülen pencerede inmiş görüntü yeniden indirilmez.
      if (w > this.sigdir) this.sigdir = w;
      this.goster(gorunumBul(this.ilk(this.gor), cift, this.a.n));
      this.adresYaz(this.gor);
      this.bildir();
      this.onYukle();
    } else {
      this.icerikOlc();
      if (this.s > 1.01) {
        this.sinirla();
        this.uygula(false);
        this.netGuncelle();
      }
    }
  }
}
