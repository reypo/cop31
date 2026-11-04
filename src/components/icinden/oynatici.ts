/**
 * /icinden v3 klip oynatıcı — R4 prototipinin (`klip-spike/web/oynatici.js`) tipli üretim uyarlaması
 * (docs/klip-oynatma.md §1, §8).
 *
 * Katmanlar (alttan üste): poster <img> (bulunulan durağın karesi; altında satır içi LQIP) → 3 <video>
 * havuzu (görünen z3, bir önceki 80 ms z2'de) → yedek <div> (poster çapraz sönmesi). Lombar, etiketler, fidan
 * katmanı (81 halka, boğum etiketleri) ve metin bunların üstünde (VideoSahne).
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
 * Poster kipi (W-2 §14.7: YALNIZ `?poster=1`; Veri Tasarrufu / 2G / 3G artık video ister): video inmez, her geçiş poster
 * çapraz sönmesi.
 *
 * Devirler kare sınırında (akıcılık turu): döngü → geçiş sönmesi geçişin ilk karesiyle başlar; geçiş → döngü devri
 * geçişin son karesi sunulunca olur ve döngü ölçülen başlama gecikmesi kadar önceden görünmezken başlatılır (ön sarma).
 * iOS ısıtmaları sırayla ve varış devri pencerelerinin dışında. Apple WebKit'te kodek sırası HEVC → AV1 → H.264.
 *
 * Havuz (en çok 3 <video>): k. durakta döngü_k + aynı yöndeki geçiş + ters geçiş (uçta komşu döngü).
 * Geri klibi olmayan geçiş (`Gecis.geri === null`; G turu §14.4.1 K4: fidan içi d9→d8, d10→d9, d11→d10; W-3 geçici t89'la d8→d7): geri adım
 * hedef durağın posterinin 350 ms çapraz sönmesidir (`posterGeri`; video yok, yedek katmanı, kayıtta `sonme: "poster"`).
 * Zincir geçiş (W-2 §14.7; `Gecis.parcalar`, d11 → d12 "uzaklasma"): kalkış görüntüsünden köprü posterine (`kopruDurak`, p4 ≡
 * r43[0]) 350 ms çapraz sönme, sonra r43 → r32 → r21 art arda; her devir parçanın son karesi sunulunca (rVFC), sıradaki parça
 * başlama gecikmesi kadar önceden görünmezken başlatılır (geçiş → döngü devriyle aynı ön sarma); son parçadan l1'e mevcut
 * varış devri. Parçalar d2–d4'ün geri klipleri (aynı dosyalar, blob önbelleğinden; ağ +0). Geri adım poster sönmesi.
 * Bekle kipi (W-4 §14.7; kullanıcı: "telefon ya da internet kötüyse animasyonları yok etmesin"): geçiş videosu HİÇBİR
 * koşulda poster sönmesiyle değiştirilmez. Klip henüz inmediyse ya da `play()` reddedildiyse mevcut kare durur (`bekle`;
 * kayıtta `bekle: neden`, VideoSahne kökte `data-bekle="1"` → 300 ms'den uzunsa köşede halka), beklenen klip kuyruğun en
 * önüne geçer (süren başka indirme kesilir), hazır olunca aynı geçiş videoyla oynar. İndirme deneme sınırına takılırsa
 * yeniden istenir; kod çözme hatasında beklerken H.264'e dönülür. 20 s'yi aşan bekleme HUD'da uyarı (yine bekler).
 * Poster sönmesi yalnız `?poster=1` (ölçüm) ve tasarım gereği (geri klibi olmayan geri adım, zincir köprüsü).
 * Otomatik oynatma engeli (W-2 §14.7; iOS Düşük Güç Modu, `play()` NotAllowedError): video katmanı gizlenmez, geçişler
 * poster sönmesine düşmez. Her kullanıcı jestinde (touchend / pointerup / keydown / click / mousedown / wheel; yakalama aşaması,
 * adımdan önce) henüz açılmamış öğelere SENKRON `play()` (→ sonra `pause()`) çağrılır (`kilitAc`; WebKit kısıtı öğe başına,
 * kullanıcı etkinleştirmesinin içinde kalkar); bekleyen döngü aynı olayda oynar. Geçiş `play()`'i de jestin içinde senkron
 * (hazır klip, ön evresiz geçiş). Ret: geçiş bekler (W-4), sıradaki jestte `kilitAc` onu jestin içinde başlatır; engel kalıcı değil, her jestte yeniden denenir (`engelSay`,
 * `sonRet`: HUD 1. satır).
 * `visibilitychange`: gizlide döngü durur, dönünce sürer. `durdur()`: kapanışta her şey bırakılır.
 */
import type { Boyut, IstemciManifest, Klip, KodekAd } from "./klipler";

/** Bekle kipi (W-4): yoklama aralığı (hazır olunca `canplay` zaten hemen uyandırır), uyarı eşiği, başarısız indirmenin yeniden denenmesi. */
const BEKLE_TIK_MS = 250;
export const BEKLE_UYARI_MS = 20000;
const BEKLE_YENIDEN_MS = 1500;
const SOLMA_MS = 180;
/**
 * Kilit denemesinin dinlendiği olaylar (W-2): HTML'de kullanıcı etkinleştiren olaylar (touchend, pointerup, keydown, click,
 * mousedown) ve adımlayıcının tekerleği (etkinleştirme değil; WebKit'te denenir, seyreltilir). adim.ts'in dinlediği olaylar.
 */
const KILIT_OLAYLARI = ["touchend", "pointerup", "keydown", "click", "mousedown", "wheel"] as const;
const YEDEK_MS = 900;
/** Ters (geri) klip ancak bu kadar dinlenmeden sonra iner (§11.2-3). */
const BOSTA_MS = 1000;
/** Isıtma: blob atandıktan sonra bu sürede HAVE_FUTURE_DATA gelmediyse öğe bir kez oynatılır (iOS). */
const ISIT_MS = 250;
/** Aynı dosyada en çok bu kadar başarısız indirme (404, ağ). */
const HATA_SINIRI = 2;
/** Olay kayıtlarının üst sınırı (kiosk günlerce açık kalır). */
const KAYIT_SINIRI = 300;
/**
 * Varış devri (akıcılık turu): döngü, geçişin son karesinden "başlama gecikmesi" kadar önce görünmezken başlatılır
 * (ön sarma); görünürlük geçişin son karesi sunulunca (rVFC) değişir, `ended` beklenmez. Döngü[0] ≡ geçişin son
 * karesi olduğundan döngü bir iki kare önde başlasa da dikiş görünmez; eskiden `ended` + arama + play() gecikmesi
 * kadar (Chrome 4× ölçüm: 67–117 ms, iOS'ta daha uzun olabilir) son kare donuyordu. Gecikme her geçişin kendi
 * play()'inden ölçülür (cihaza uyar), sınırlar içinde tutulur.
 */
const BASLAMA_ILK_MS = 50;
const BASLAMA_EN_COK_MS = 200;
/** Döngü → geçiş sönmesi geçişin saati başlayınca başlar; bu süreden sonra her durumda (öğe hiç kare sunmazsa). */
const SONME_EN_GEC_MS = 250;
/** Geri klibi olmayan geri adım (G turu K4): hedef posteri bu sürede çapraz söner (adım süresi). */
export const POSTER_GERI_MS = 350;
/**
 * Çapraz sönme bittikten sonra durum varışı bu kadar sonra: adımlayıcının kilitli adımı (aynı 350 ms, rAF'te biter) bitmeden
 * `dur`a geçilirse varışa hemen gelen ters jest kilide takılıp tükeniyordu (video varışı da `ended`'da, son kareden bir kare sonra).
 */
const POSTER_GERI_VARIS_MS = 40;
/** Çapraz sönme sonunda alttaki poster <img> yeni kaynağını en geç bu sürede çözmüş olmalı (yoksa yine kaldırılır). */
const POSTER_COZ_MS = 300;
/** Zincir köprüsü (W-2): kalkış görüntüsünden ilk parçanın 0. karesine (köprü posteri) çapraz sönme. */
export const KOPRU_MS = 350;
/** Tekerlek jesti kullanıcı etkinleştirmesi değil; kilit denemesi en çok bu aralıkla (ret sayacı şişmesin). */
const KILIT_TEKERLEK_MS = 250;
/** Aynı anda gelen retler (havuzun 3 öğesi, pointerup + touchend) tek ret sayılır. */
const RET_BIRLESTIR_MS = 50;

type Yuva = {
  el: HTMLVideoElement;
  i: number;
  url: string | null;
  hazir: boolean;
  surum: number;
  cozum: ((ok: boolean) => void)[];
  oynat: boolean;
  /** Öğenin bir `play()`'i çözüldü (WebKit kısıtı öğe başına; `src` değişince de açık kalır, R4 §3.6-b). */
  acik: boolean;
};

export type KlipBilgi = { url: string; sure: number; hiz: number; kare: number; ad: string };
/** Zincir geçiş (W-2 §14.7): parçalar sırayla, her parçanın 0. karesinin posteri (durak dizini), köprü durağı. */
export type Zincir = { ad: string; sure: number; kare: number; parcalar: KlipBilgi[]; ilkPoster: number[]; kopru: number };
/** Zincir parçasının kaydı (HUD/ölçüm): ilk kare (jestten), devir (önceki parçanın son karesi → bunun ilk yeni karesi). */
export type ParcaKayit = { ad: string; ilkKareMs?: number; devirMs?: number; onSarMs?: number; dusen?: number; cozulen?: number; devredildi?: boolean };

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
  /** Geçiş öğesinin play() → saatin başlaması (ms; rVFC: ilk karenin zamanı − medya zamanı). */
  baslamaMs?: number;
  /** Döngü ön sarması (varıştan ne kadar önce, ms) ya da hiç (döngü hazır değil / döngüsüz durak). */
  onSarMs?: number;
  /** Geçişin son karesi → görünen döngünün ilk YENİ karesi (ms; 30 fps'de ideal ≈ 33). */
  devirMs?: number;
  /** "poster": geri klibi olmayan geri adım (hedef posterine 350 ms çapraz sönme; yedek DEĞİL, tasarım). */
  sonme?: "poster";
  /** Zincir geçişin parçaları (W-2). */
  zincir?: ParcaKayit[];
  /** Zincir köprüsünün bittiği an (jestten, ms). */
  kopruMs?: number;
  /** Bekle kipi (W-4): ilk bekleme nedeni ("hazir-degil", "engel", "play …"; zincirde parça adıyla), bekleme sayısı, 20 s aşıldı. */
  bekle?: string;
  bekleSay?: number;
  bekleUzun?: boolean;
  bitti?: boolean;
};

export type GecisSecenek = {
  /** Video bu kadar ms sonra başlar (DOM ön evresi: logo sönmesi). */
  oncesiMs?: number;
  /** Kare geri çağrısı (rVFC; klibin kendi kare numarası). */
  kare?: (f: number, n: number) => void;
  /** Varış (klip bitti ya da yedek tamamlandı). */
  varis?: (kayit: Kayit) => void;
  /** Bekle kipi (W-4): bekleme başladı (true) / bitti, geçiş şimdi başlıyor (false; kalan = videonun süresi, ms). */
  bekle?: (basladi: boolean, kalanMs: number) => void;
};

/** Bekle kipi (W-4) durumu. Beklenen klibin URL'si her bakışta yeniden (kodek değişebilir); `devam` aynı geçişi başlatır. */
export type Bekleme = {
  kayit: Kayit;
  neden: string;
  kalanMs: number;
  sec: GecisSecenek;
  url: () => string | null;
  yerlestir: () => void;
  devam: (T: Yuva) => void;
  tb: number;
  id: number;
  sonDeneme: number;
  uyan?: Yuva;
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
  /** İndirme başına iptal (W-4: bekle kipi süren başka indirmeyi keser); kesilen dosyanın sözü açık kalır, yeniden sıraya. */
  private kesiciler = new Map<string, AbortController>();
  private kesilen = new Set<string>();
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
  /** Bekle kipi (W-4): beklenen klip kuyruğun en önüne; süren başka indirme kesilir (sözü açık, sonra baştan iner). */
  oncelikli(d: string) {
    if (this.bloblar.has(d) || this.tukendi(d)) return;
    for (const l of [this.acil, this.kuyruk, this.bosta]) {
      const i = l.indexOf(d);
      if (i >= 0) l.splice(i, 1);
    }
    if (!this.bekleyen.has(d)) this.acil.unshift(d);
    for (const [x, a] of this.kesiciler)
      if (x !== d && !this.kesilen.has(x)) {
        this.kesilen.add(x);
        a.abort();
      }
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
    const ac = new AbortController();
    this.kesiciler.set(d, ac);
    try {
      const r = await fetch(d, { signal: ac.signal });
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
      if (n === this.nesil && this.kesilen.delete(d)) {
        // Bekle kipi öne geçti (`oncelikli`): söz açık kalır, dosya acil kuyruğun sonuna döner.
        if (!this.acil.includes(d)) this.acil.push(d);
      } else if (n === this.nesil) {
        const ad = (e as Error)?.name;
        if (ad !== "AbortError" && (e as Error)?.message !== "kapali") this.hatalar.set(d, (this.hatalar.get(d) ?? 0) + 1);
        const s = this.sozler.get(d);
        this.sozler.delete(d);
        s?.rej(e);
      }
      throw e;
    } finally {
      this.calisan--;
      if (this.kesiciler.get(d) === ac) this.kesiciler.delete(d);
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
    for (const a of this.kesiciler.values()) a.abort();
    this.kesiciler.clear();
    this.kesilen.clear();
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
  /**
   * Otomatik oynatma engeli şu an var mı (son `play()` NotAllowedError ile reddedildi, sonraki kilit denemesi henüz
   * başarmadı). Kalıcı kip DEĞİL (W-2): dokunma adımı parmak kalkınca atılır, her jestte kilit yeniden denenir.
   */
  engel = false;
  /** NotAllowedError ret sayısı (aynı ana düşenler birleşik) ve son retin yeri (HUD 1. satır). */
  engelSay = 0;
  sonRet = "";
  private sonRetT = -Infinity;
  private kilitT = -Infinity;
  /** Yalnız `?poster=1` (W-2 §14.7): video inmez, geçişler poster çapraz sönmesi (§6). */
  posterKipi: boolean;
  /** Kod çözme hatası: bir sonraki dinlenmede H.264'e dönülecek (beklerken hemen, `kodekBeklerken`). */
  kodekBekliyor = false;
  /** Bekle kipi (W-4): süren bekleme, bekleyen geçiş sayısı, toplam bekleme (ms; biten beklemeler). HUD 5. satır. */
  bekleme: Bekleme | null = null;
  bekleSay = 0;
  bekleToplamMs = 0;
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
  private kilitDinle: (e: Event) => void;
  private gorunurlukDinle: () => void;
  private onYukleme = new Map<string, HTMLImageElement>();
  /** play() → oynatma saatinin başlaması (ms), son geçişlerden üstel ortalama; ön sarmanın öncülüğü. */
  baslamaMs = BASLAMA_ILK_MS;
  /** Video geçişinin beklenen varış anı (performance.now; geçişte) ve son varış anı (ısıtma devir penceresi). */
  private varisBek = 0;
  private varisT = -Infinity;

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
      return { el, i, url: null, hazir: false, surum: 0, cozum: [], oynat: false, acik: false };
    });
    this.kilitDinle = (e: Event) => {
      if (!e.isTrusted) return;
      if (e.type === "wheel") {
        const t = performance.now();
        if (t - this.kilitT < KILIT_TEKERLEK_MS) return;
        this.kilitT = t;
      }
      this.kilitAc(e.type);
    };
    for (const t of KILIT_OLAYLARI) addEventListener(t, this.kilitDinle, { capture: true, passive: true });
    this.gorunurlukDinle = () => {
      const L = this.yuva(this.dongu(this.k)?.url ?? "");
      if (!L || this.durum !== "dur") return;
      if (document.hidden) L.el.pause();
      else if (L.oynat)
        L.el.play().then(
          () => (L.acik = true),
          (e: Error) => {
            if (e?.name === "NotAllowedError") this.engelVar(`görünürlük ${this.dongu(this.k)?.ad ?? ""}`, L);
          },
        );
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
  /**
   * k'dan ileri zincir geçiş (W-2 §14.7; `Gecis.parcalar`): parçalar (bu yönün kodeği, yoksa H.264), her parçanın 0.
   * karesinin posteri (parça, bir geçişin geri klibi: r43 = t34 tersi → 0. karesi d4'ün posteri) ve köprü durağı. Önbellekli.
   */
  private zincirOnbellek = new Map<string, Zincir | null>();
  zincir(k: number): Zincir | null {
    const anahtar = `${k}|${this.boyut}|${this.kodek}`;
    if (this.zincirOnbellek.has(anahtar)) return this.zincirOnbellek.get(anahtar)!;
    const D = this.m.duraklar;
    const g = D[k]?.ileri;
    let z: Zincir | null = null;
    if (g?.parcalar?.length) {
      const parcalar: KlipBilgi[] = [];
      const ilkPoster: number[] = [];
      for (const c of g.parcalar) {
        const u = this.url(c);
        if (!u) break;
        parcalar.push({ url: u, sure: c.sure, hiz: 1, kare: c.kare, ad: c.ad });
        const i = D.findIndex((d) => d.ileri?.geri?.ad === c.ad);
        ilkPoster.push(i >= 0 ? i + 1 : -1);
      }
      if (parcalar.length === g.parcalar.length) {
        const kd = g.kopruDurak ? D.findIndex((d) => d.id === g.kopruDurak) : -1;
        z = { ad: g.ad, sure: g.sure, kare: g.kare, parcalar, ilkPoster, kopru: kd >= 0 ? kd : ilkPoster[0] };
      }
    }
    this.zincirOnbellek.set(anahtar, z);
    return z;
  }
  /** Geçiş dosyaları (j, yy): klip ya da (ileri) zincirin parçaları. */
  private gecisUrlleri(j: number, yy: number): string[] {
    const u = this.gecis(j, yy)?.url;
    if (u) return [u];
    const z = yy > 0 ? this.zincir(j) : null;
    return z ? z.parcalar.map((p) => p.url) : [];
  }
  /** k → k−1 geri adımı poster çapraz sönmesi mi: geri klip tanımsız (`geri === null`; G turu K4) ve hedefin posteri var. */
  posterGeriMi(k: number): boolean {
    const g = this.m.duraklar[k - 1]?.ileri;
    return !!g && g.geri === null && !!this.posterUrl(k - 1);
  }
  posterUrl(k: number): string | null {
    return this.m.duraklar[k]?.poster?.[this.boyut]?.dosya ?? null;
  }
  lqip(k: number): string | null {
    return this.m.duraklar[k]?.poster?.[this.boyut]?.lqip ?? null;
  }
  /**
   * Geçiş öğesinin `poster` özniteliği için durak: klibin 0. karesi o durağın posteri olmalı (klip zinciri). DOM
   * durağından (lombar, d0) ileri giden klibin posteri yok (-1): d0'ın posteri yok, t01'in 0. karesi lombar deliğinde
   * görünür. Döngüsüz klip durakları (duvar d6/d7, fidan d8–d10) "klip" türündedir: posteri gelen klibin son
   * karesi = giden klibin 0. karesi (son-kare posteri, §12.4-9, §14.4.2).
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
    // Zincir (W-2, d11'den ileri): ileri yöndeyse ilk iki parça (sıradaki jest), geri yöndeyse ilk parça ters geçiş
    // gibi (boşta). Parçalar d2–d4'ün geri klipleri: çoğunlukla zaten blob, atama ağsız.
    const z = !(yon > 0 ? ayni : ters) ? this.zincir(k) : null;
    if (ayni) l.push({ url: ayni.url, dongu: false, k: this.ilkKarePosteri(k, yon) });
    else if (z && yon > 0) z.parcalar.slice(0, 2).forEach((p, i) => l.push({ url: p.url, dongu: false, k: z.ilkPoster[i] }));
    if (ters) l.push({ url: ters.url, dongu: false, k: this.ilkKarePosteri(k, -yon), bosta: true });
    else if (z && yon < 0) l.push({ url: z.parcalar[0].url, dongu: false, k: z.ilkPoster[0], bosta: true });
    // Uç ya da DOM durağı, ya da bir yönü klipsiz durak (fidan d8–d10: geri poster sönmesi): boş kalan yuvaya varılacak
    // döngü (aynı yönde en çok 2 durak ötedeki ilk döngü; fidanda d9'dan d11'in lc'si). Döngüsüz klip durağında
    // (duvar) iki yönün geçişi zaten yuvada; üçüncü yuva boş kalır, sıradaki geçiş pencereden iner (uzaktaki l1'i buradan
    // indirmek d6'da ~1 MB boşa bayt olurdu; G turunda d11'den geri bakınca 6 durak ötedeki l5 de öyle).
    const uc = this.m.duraklar[k]?.tur === "dom" || !(ayni || (z && yon > 0)) || !(ters || (z && yon < 0));
    for (let j = k + yon; uc && l.length < 3 && j >= 0 && j < this.N && Math.abs(j - k) <= 2; j += yon) {
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
    // Zincirde (W-2) bütün parçalar sırayla: d10/d11'de r43 r32 r21 + l1 (normal oturumda d2–d4'te zaten inmiş: ağsız).
    const g = (j: number, yy: number) => this.gecisUrlleri(j, yy);
    const l = [d(k), ...g(k, y), d(k + y), ...g(k + y, y), d(k + 2 * y), ...g(k + 2 * y, y), d(k - y)];
    // Bu yönde klip yoksa (fidan içinde geri: poster sönmeleri) ilk klipli geçişe kadar bak (d10'da geri → r97; geçici t89'da d7'nin geri klibi).
    if (!l.some(Boolean)) for (let j = k; j >= 0 && j < this.N; j += y) if (g(j, y).length) {
      l.push(...g(j, y), d(j + y));
      break;
    }
    return [...new Set(l.filter((x): x is string => !!x))];
  }
  /**
   * Posterleri pencere sırasıyla önyükle (k±2). Geri adımı poster sönmesi olan durakta (fidan) hedef posteri ayrıca
   * çözülür (`decode()`): sönmenin ilk karesinde yedek katmanının arka planı kod çözmeyi beklemesin.
   */
  private posterOnyukle(k: number, y: 1 | -1) {
    // Zincirin köprü posteri (W-2: d11'den ileri p4) de çözülür: köprü sönmesi kod çözmeyi beklemesin.
    const kopru = y > 0 ? (this.zincir(k)?.kopru ?? -1) : -1;
    for (const j of [k + y, k + 2 * y, k - y, kopru]) {
      const u = this.posterUrl(j);
      if (!u) continue;
      let im = this.onYukleme.get(u);
      if (!im) {
        im = new Image();
        im.decoding = "async";
        im.src = u;
        this.onYukleme.set(u, im);
      }
      if ((j === k - 1 && this.posterGeriMi(k)) || j === kopru) im.decode().catch(() => {});
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
  /** Varış devrine yakın mı: beklenen varıştan önceki 400 ms ya da varıştan sonraki 300 ms (döngü başlıyor). */
  private devirYakin() {
    const t = performance.now();
    if (this.durum === "gecis") return this.varisBek > 0 && this.varisBek - t < 400;
    return t - this.varisT < 300;
  }
  /**
   * Görünmez öğeyi bir kez oynatıp durdur (WebKit'te prepareToPlay veriyi yükler; canplay gelir). Akıcılık turu: her
   * ısıtma bir çözücü oturumu açar → aynı anda yalnız bir ısıtma (görünen geçişle en çok iki etkin çözücü; eskiden geçişin
   * +530 ms'sinde iki öğe birlikte) ve devir pencerelerinde ısıtma yok. Bekleyen (hazirBekle) öğe sıra beklemez.
   */
  private isitan: Yuva | null = null;
  private isit(y: Yuva, s: number) {
    const el = y.el;
    // Engelde yalnız kilidi açılmamış öğe beklemez (reddedilecek; jestte kilitAc oynatıp durdurur = ısıtma).
    if (y.surum !== s || y.hazir || y.oynat || el === this.aktif || (this.engel && !y.acik) || this.durum === "kapali") return;
    if (el.readyState >= 3 || !el.paused) return;
    const acil = y.cozum.length > 0;
    if (!acil && ((this.isitan && this.isitan !== y) || this.devirYakin())) {
      this.sonra(120, () => this.isit(y, s));
      return;
    }
    this.isitan = y;
    const birak = () => {
      if (this.isitan === y) this.isitan = null;
    };
    this.sonra(1000, birak); // play() çözülmezse sıra kilitlenmesin
    this.olay("isitma", { url: y.url, readyState: el.readyState });
    el.play().then(
      () => {
        birak();
        y.acik = true;
        if (y.surum === s && !y.oynat && el !== this.aktif) {
          el.pause();
          el.currentTime = 0;
        }
      },
      (e: Error) => {
        birak();
        if (e?.name === "NotAllowedError") this.engelVar("ısıtma", y);
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
        y.acik = true;
        if (!y.oynat) {
          y.el.pause();
          y.el.currentTime = 0;
        }
      },
      (e: Error) => {
        if (e?.name === "NotAllowedError") this.engelVar("yoklama", y);
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
    ger.splice(this.yuvalar.length - mesgul.length - this.disarida(ger, mesgul, zorla));
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
  /**
   * Görünen öğe (ve zorla değilse 80 ms'lik eski) listede değilse tuttuğu yuva sayısı: liste o kadar kısalır, sondakiler
   * (ters geçiş) düşer. W-4: varış döngüsü hazır olmadan gelen jestte görünen öğe gelen geçişin son karesiydi; döngü ve ters
   * klip iki yuvayı tutunca beklenen geçiş yer bulamıyor, bekleme kilitleniyordu (eskiden 300 ms sonra poster sönmesi).
   */
  private disarida(l: { url: string }[], mesgul: Yuva[], zorla: boolean) {
    return this.yuvalar.filter(
      (y) => !mesgul.includes(y) && (y.el === this.aktif || (!zorla && y.el === this.eski)) && !l.some((g) => g.url === y.url),
    ).length;
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
      // Zaten 0'daysa arama yok: gereksiz arama play()'i bir çözme turu geciktirir.
      if (L.el.currentTime > 0.001) L.el.currentTime = 0;
      await L.el.play();
      L.acik = true;
      if (this.k !== j || this.durum !== "dur") return;
      this.goster(L.el, 0);
      this.yedekKaldir();
    } catch (e) {
      L.oynat = false;
      if ((e as Error)?.name === "NotAllowedError") this.engelVar(`döngü ${d.ad}`, L);
      // Engelli: poster dural kalır; sıradaki jestte kilitAc döngüyü aynı olayda başlatır.
      this.gizle(0);
      this.yedekKaldir();
    }
  }

  /* ---------------- otomatik oynatma kilidi (W-2 §14.7) ---------------- */
  /**
   * play() NotAllowedError ile reddedildi: engel (kalıcı değil; sıradaki jestte kilitAc yeniden dener). Reddeden öğe açık
   * sayılmaz (src değişince WebKit'in kısıtı geri gelirse de kilitAc onu yeniden dener).
   */
  private engelVar(neden: string, y?: Yuva) {
    if (y) y.acik = false;
    this.engel = true;
    const t = performance.now();
    if (t - this.sonRetT > RET_BIRLESTIR_MS) this.engelSay++;
    this.sonRetT = t;
    this.sonRet = neden;
    this.olay("engel", { neden, n: this.engelSay });
  }
  /**
   * Kullanıcı jesti (yakalama aşaması, adımlayıcıdan önce; `tur` olay adı). Engel varken kilidi açılmamış her öğeye
   * (kaynağı henüz atanmamış olan da: WebKit kısıtı öğe başına, sonradan src alınca açık kalır, R4 §3.6-b) SENKRON
   * `play()`: kullanıcı etkinleştirmesi yalnız olay işleyicisinin içinde geçerli (await/rAF/setTimeout'tan sonra değil).
   * Çözülen öğe açık sayılır ve (oynaması gerekmiyorsa) durdurulur. Bulunulan durağın döngüsü bekliyorsa aynı olayda
   * oynar. Bir ret engeli sürdürür; hiç ret yoksa engel kalkar. Geçişin kendi `play()`'i de bu olayın içinde (gec()).
   */
  kilitAc(tur = "jest") {
    if (!this.engel || this.durum === "kapali") return;
    // Bekleyen geçiş (W-4): klibi hazırsa jestin içinde, senkron başlar (WebKit: play() yalnız kullanıcı etkinleştirmesinde).
    const b = this.bekleme;
    const bu = b?.url();
    const bT = bu ? this.yuva(bu) : null;
    if (b && bT?.hazir) this.bekleDevam(b, bT);
    const k = this.k;
    const d = this.durum === "dur" ? this.dongu(k) : null;
    const L = d ? this.yuva(d.url) : null;
    let ret = false;
    let deneme = 0;
    for (const y of this.yuvalar) {
      const el = y.el;
      // Bekleyen döngü: hazır ve duruyor (açılışta reddedilmişti) → şimdi oynat.
      const dongum = y === L && y.hazir && el.paused;
      if (y.acik && !dongum) continue;
      // Oynayan öğe zaten açık; görünen (son-kare durağında bitmiş) geçiş yeniden başlamasın.
      if (!dongum && (!el.paused || el === this.aktif)) continue;
      if (dongum) {
        y.oynat = true;
        el.loop = true;
      }
      deneme++;
      let p: Promise<void>;
      try {
        p = el.play();
      } catch (e) {
        p = Promise.reject(e);
      }
      p.then(
        () => {
          y.acik = true;
          if (!ret) this.engel = false;
          if (dongum) {
            if (y.oynat && this.k === k && this.durum === "dur" && y.url === d?.url) {
              this.goster(el, 0);
              this.yedekKaldir();
            } else if (el !== this.aktif) {
              // Aynı jest geçiş başlattı: bekleyen döngü görünmeden durur.
              y.oynat = false;
              el.pause();
            }
          } else if (!y.oynat && el !== this.aktif) {
            el.pause();
            if (el.currentTime > 0.001) el.currentTime = 0;
          }
        },
        (e: Error) => {
          if (dongum) y.oynat = false;
          if (e?.name === "NotAllowedError") {
            ret = true;
            this.engelVar(`kilit ${tur}`, y);
          }
        },
      );
    }
    // Açılacak öğe kalmadı (hepsi açık): engel bayağı.
    if (!deneme) this.engel = false;
    this.olay("kilit-ac", { tur, deneme });
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
    const z = !g && dir > 0 ? this.zincir(k) : null;
    const kayit: Kayit = { no: ++this.kayitNo, yon: dir, from: k, to: j, tur, tJest, klip: g?.ad ?? z?.ad, engel: this.engel };
    this.olaylar.push(kayit);
    if (this.olaylar.length > KAYIT_SINIRI) this.olaylar.splice(0, this.olaylar.length - KAYIT_SINIRI);
    this.durum = "gecis";
    this.sonYon = dir;
    this.varisBek = 0;
    this.bostaPlanla();
    this.olay("adim", kayit);
    if (z) return this.zincirGec(j, kayit, z, sec);
    if (!g) {
      // Geri klibi yok (fidan içi geri adım, d12→d11): hedef posterine 350 ms çapraz sönme.
      if (dir < 0 && j === k - 1 && this.posterGeriMi(k)) return this.posterGeri(j, kayit, sec);
      return 0;
    }
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
    // Bekle kipi (W-4): klip hazır değil / play() reddedildi → mevcut kare durur, klip hazır olunca aynı geçiş (video).
    const bekleGecis = (neden: string, gecikme = 0): void =>
      this.bekle(
        {
          kayit,
          neden,
          sec,
          kalanMs: sureMs,
          url: () => this.gecis(k, dir)?.url ?? null,
          yerlestir: () => this.dagit(k, dir, [], false, true),
          devam: (T) => this.oynat(T, j, dir, kayit, this.gecis(k, dir) ?? g, sec, bekleGecis),
        },
        gecikme,
      );
    const basla = () => {
      if (kayit.bitti) return;
      if (this.posterKipi) return this.yedek(j, dir, kayit, "poster-kipi", g, sec);
      const T = this.yuva(g.url);
      // Hazır klip: play() hemen (W-2: ön evresiz geçişte jestin olay işleyicisinin içinde, senkron — iOS Düşük Güç
      // Modu'nda yalnız kullanıcı etkinleştirmesindeki play() izinli).
      if (T?.hazir && this.durum === "gecis") {
        kayit.beklemeMs = 0;
        return this.oynat(T, j, dir, kayit, g, sec, bekleGecis);
      }
      bekleGecis("hazir-degil");
    };
    if (sec.oncesiMs) this.sonra(sec.oncesiMs, basla);
    else basla();
    return sureMs;
  }

  private oynat(T: Yuva, j: number, dir: 1 | -1, kayit: Kayit, g: KlipBilgi, sec: GecisSecenek, bekle: (neden: string, gecikme?: number) => void) {
    const L = this.aktif;
    const s = T.surum;
    T.oynat = true;
    T.el.loop = false;
    T.el.playbackRate = g.hiz;
    const q0 = T.el.getVideoPlaybackQuality?.();
    const tPlay = (kayit.tPlay = performance.now());
    this.varisBek = tPlay + (g.sure * 1000) / g.hiz;
    if (T.el.currentTime > 0.001) T.el.currentTime = 0;
    T.el.play().then(
      () => (T.acik = true),
      (e: Error) => {
        kayit.playHata = e?.name;
        T.oynat = false;
        const engel = e?.name === "NotAllowedError";
        if (engel) this.engelVar(`geçiş ${g.ad}`, T);
        // W-4: poster sönmesi yok, aynı geçiş bekler (engelde sıradaki jestte kilitAc başlatır; başka ret kısa aralıkla
        // yeniden). Bu denemenin kare/varış geri çağrıları yuva sürümüyle düşer.
        if (this.durum === "gecis" && !kayit.bitti && T.surum === s) {
          T.surum++;
          bekle(engel ? "engel" : `play ${e?.name ?? "?"}`, BEKLE_TIK_MS);
        }
      },
    );
    /*
     * Döngüden geçişe devir (akıcılık turu): akan döngü varsa çapraz sönme geçişin saati başlayınca (ilk rVFC karesi ya
     * da `playing`) başlar; o ana dek döngü akar. Eskiden sönme play() anında başlıyor, geçiş başlama gecikmesi boyunca
     * 0. karede donuk görünüyordu. Güvenlik: en geç SONME_EN_GEC_MS. Önizlemede (lombar deliğinin altı) zaten görünür:
     * yeniden söndürüp açma. Döngü sönme bitince (+100 ms) durur; serbest yuvalar o zaman dağıtılır.
     */
    const akanDongu = !!L && L !== T.el && !L.paused;
    let sonme = false;
    const sonmeBaslat = () => {
      T.el.removeEventListener("playing", sonmeBaslat);
      if (sonme || T.surum !== s || kayit.bitti) return;
      sonme = true;
      if (L !== T.el) this.goster(T.el, L ? SOLMA_MS : 0);
      this.sonra(SOLMA_MS + 100, () => {
        if (kayit.bitti || T.surum !== s) return;
        if (L && L !== T.el) L.pause();
        this.dagit(j, dir, [T]);
      });
    };
    if (!akanDongu) sonmeBaslat();
    else {
      T.el.addEventListener("playing", sonmeBaslat, { once: true });
      this.sonra(SONME_EN_GEC_MS, sonmeBaslat);
    }
    let sunulan = 0;
    const fps = this.m.fps;
    let onSarildi = false;
    let tSon: number | undefined;
    const kare = (now: number, meta: VideoFrameCallbackMetadata) => {
      if (T.surum !== s || kayit.bitti) return;
      sunulan++;
      if (sunulan === 1) {
        sonmeBaslat();
        kayit.ilkKareMs = Math.round((now - kayit.tJest) * 10) / 10;
        // Saatin başlaması = bu karenin gösterim zamanı − medya zamanı (hız dahil) − play() anı; ön sarmanın öncülüğü
        // buna uyar. Hızlı cihazda ölçü sıfırın altına düşebilir (kare gösterime saatten önce hazır): 0 sayılır.
        const b = (meta.expectedDisplayTime || now) - tPlay - (meta.mediaTime * 1000) / g.hiz;
        if (b < 1000) {
          const bb = Math.max(0, b);
          kayit.baslamaMs = Math.round(bb);
          this.baslamaMs = Math.min(BASLAMA_EN_COK_MS, Math.max(16, (this.baslamaMs + bb) / 2));
        }
      }
      kayit.sunulan = sunulan;
      const f = Math.min(g.kare - 1, Math.round(meta.mediaTime * fps));
      sec.kare?.(f, g.kare);
      // Ön sarma: varış döngüsü son kareden "başlama gecikmesi" kadar önce görünmezken başlar.
      const kalan = ((g.kare - 1 - f) * 1000) / fps / g.hiz;
      if (!onSarildi && kalan <= this.baslamaMs) onSarildi = this.onSar(j, kayit, kalan);
      // Son kare sunuldu: görsel devir şimdi (ended bir kare süresi + olay gecikmesi sonra gelir). Durum varışı
      // (VideoSahne `dur`, jest kabulü) eskisi gibi `ended`'da: adımlayıcının kilitli adımı bitmeden `dur`a geçilirse
      // varışa hemen gelen ters jest kilide takılıp tükeniyordu (tuzak "hızlı ileri-geri").
      if (f >= g.kare - 1) {
        tSon = now;
        return this.devir(j, kayit, now);
      }
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
    const bitir = () => {
      if (T.surum !== s || kayit.bitti) return;
      kayit.bitti = true;
      window.clearTimeout(guvenlik);
      const q1 = T.el.getVideoPlaybackQuality?.();
      if (q0 && q1) {
        kayit.cozulen = q1.totalVideoFrames - q0.totalVideoFrames;
        kayit.dusen = q1.droppedVideoFrames - q0.droppedVideoFrames;
      }
      this.varis(j, dir, kayit, sec, tSon);
    };
    T.el.onended = bitir;
    const guvenlik = this.sonra(((g.sure / g.hiz) + 1.5) * 1000, bitir);
  }

  /**
   * Görsel devir (geçişin son karesi sunulunca): ön sarılmış varış döngüsü öne alınır (döngü[0] ≡ son kare). Ön
   * sarılmadıysa (hazır değil, engel) bir şey yapılmaz; varış eski yolla (arama + play) yapar.
   */
  private devir(j: number, kayit: Kayit, tSon: number) {
    const d = this.dongu(j);
    const L = d ? this.yuva(d.url) : null;
    // `paused`a bakılmaz: saat henüz başlamadıysa döngü 0. karesini (≡ son kare) gösterir, fark görünmez. Ön sarmanın
    // play()'i reddedildiyse `oynat` false (engel): devir yok, varış eski yolla.
    if (!L || !L.hazir || !L.oynat || L.el === this.aktif) return;
    this.goster(L.el, 0);
    this.devirOlc(L, kayit, tSon);
  }
  /** Devir ölçümü (HUD, ölçüm betiği): geçişin son karesinden görünen döngünün ilk YENİ karesine (rVFC). */
  private devirOlc(L: Yuva, kayit: Kayit, tSon: number) {
    if (kayit.devirMs !== undefined) return;
    // Ön sarılan döngü 1. kareyi geçtiyse yeni kare öne alındığı karede görünür (döngü[0] ≡ son kare; ondan sonrası
    // yeni): ölçü bir sonraki kare (rVFC içinden istenen rAF aynı karede koşabildiği için iki kat).
    if (L.el.currentTime >= 1 / this.m.fps) {
      requestAnimationFrame(() =>
        requestAnimationFrame((now) => {
          if (kayit.devirMs === undefined) kayit.devirMs = Math.round(now - tSon);
        }),
      );
      return;
    }
    if (typeof L.el.requestVideoFrameCallback !== "function") return;
    const s = L.surum;
    const ilk = (now: number, meta: VideoFrameCallbackMetadata) => {
      if (L.surum !== s || kayit.devirMs !== undefined) return;
      if (meta.mediaTime <= 0.001 && now - tSon < 400) return void L.el.requestVideoFrameCallback(ilk);
      kayit.devirMs = Math.round(now - tSon);
    };
    L.el.requestVideoFrameCallback(ilk);
  }

  /**
   * Ön sarma (BASLAMA_*): j'nin döngüsü hazırsa görünmezken (z1, opaklık 0) 0. kareden başlatılır; görünürlük varışta
   * değişir. Hazır değilse false (sonraki karede yeniden denenir); engel/poster kipinde ya da döngüsüz durakta true.
   */
  private onSar(j: number, kayit: Kayit, kalan: number): boolean {
    const d = this.dongu(j);
    if (!d) return true;
    const L = this.yuva(d.url);
    if (!L || L.el === this.aktif) return true;
    if (!L.hazir) return false;
    // Engelde kilidi açılmamış öğe reddedilir: ön sarma yok, varış donguBaslat ile (poster kalır, sıradaki jestte açılır).
    if (this.engel && !L.acik) return true;
    L.oynat = true;
    L.el.loop = true;
    if (L.el.currentTime > 0.001) L.el.currentTime = 0;
    L.el.play().then(
      () => (L.acik = true),
      (e: Error) => {
        L.oynat = false;
        if (e?.name === "NotAllowedError") this.engelVar(`ön sarma ${d.ad}`, L);
      },
    );
    kayit.onSarMs = Math.round(kalan);
    return true;
  }

  private varis(j: number, dir: 1 | -1, kayit: Kayit, sec: GecisSecenek, tSon?: number) {
    this.k = j;
    this.varisT = performance.now();
    this.varisBek = 0;
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
    if (L && L.hazir && !(this.engel && !L.acik)) {
      // Döngünün 0. karesi = geçişin son karesi (üretim kuralı): kesme, sönme yok. Ön sarıldıysa zaten oynuyor.
      L.oynat = true;
      if (L.el.paused) {
        L.el.currentTime = 0;
        L.el.play().then(
          () => (L.acik = true),
          (e: Error) => {
            // Reddedildi (engel): döngünün 0. karesi (≡ son kare) durur; sıradaki jestte kilitAc oynatır.
            L.oynat = false;
            if (e?.name === "NotAllowedError") this.engelVar(`döngü ${d?.ad ?? ""}`, L);
          },
        );
      }
      // Ön sarılıp son karede öne alındıysa (devir) yeniden gösterme yok.
      if (this.aktif !== L.el) {
        this.goster(L.el, 0);
        if (tSon !== undefined) this.devirOlc(L, kayit, tSon);
      }
      sonra();
    } else if (d) void this.donguBaslat(j).then(sonra);
    else sonra(); // döngüsüz durak (duvar, DOM): son kare durur; DOM durağında VideoSahne gizle() ile söndürür
    this.olay("varis", kayit);
    sec.varis?.(kayit);
  }

  /**
   * Geri klibi olmayan geri adım (G turu §14.4.1 K4; d9→d8, d10→d9, d11→d10): hedef durağın posteri (= hedefin son karesi)
   * yedek katmanında POSTER_GERI_MS'de üste çapraz söner, sonra video katmanları kalkar ve durum varışı olur (`varis`; ters
   * jest tuzağı için adımın bitişinden POSTER_GERI_VARIS_MS sonra). Kadraj okuması `sec.kare` ile zamana bağlı akar (giden
   * durağın okuması tersten). Engel/poster kipi fark etmez (video oynatılmaz). Yedek katmanı kaldırılmadan önce alttaki
   * poster <img>'in yeni kaynağı çözülür (en çok POSTER_COZ_MS): eski poster bir kare görünmesin.
   */
  private posterGeri(j: number, kayit: Kayit, sec: GecisSecenek): number {
    kayit.sonme = "poster";
    const el = this.yedekEl;
    const u = this.posterUrl(j);
    const lq = this.lqip(j);
    el.style.backgroundImage = u ? `url("${u}")${lq ? `, url("${lq}")` : ""}` : "none";
    el.style.transition = "none";
    el.style.opacity = "0";
    el.style.transform = "none";
    void el.offsetWidth;
    el.style.transition = `opacity ${POSTER_GERI_MS}ms linear`;
    el.style.opacity = "1";
    // Okuma: hedefin ileri klibinin kare sayısıyla (giden durağın okuma dizisi o uzunlukta), zamana bağlı.
    const n = this.m.duraklar[j]?.ileri?.kare ?? 2;
    const t0 = performance.now();
    const raf = () => {
      if (kayit.bitti) return;
      const f = Math.min(n - 1, Math.round(((performance.now() - t0) / POSTER_GERI_MS) * (n - 1)));
      sec.kare?.(f, n);
      if (f < n - 1) requestAnimationFrame(raf);
    };
    if (sec.kare) requestAnimationFrame(raf);
    this.sonra(POSTER_GERI_MS + POSTER_GERI_VARIS_MS, () => {
      if (kayit.bitti) return;
      kayit.bitti = true;
      for (const y of this.yuvalar) {
        y.el.pause();
        y.oynat = false;
      }
      this.gizle(0);
      this.k = j;
      this.posterAyarla(j);
      this.durum = "dur";
      this.varisT = performance.now();
      kayit.gecisMs = Math.round(performance.now() - kayit.tJest);
      if (this.posterKipi) this.posterOnyukle(j, -1);
      else {
        this.dagit(j, -1);
        this.bostaPlanla();
        void this.donguBaslat(j);
      }
      this.olay("varis", kayit);
      sec.varis?.(kayit);
      let kalkti = false;
      const kaldir = () => {
        if (kalkti) return;
        kalkti = true;
        if (this.k === j && this.durum !== "gecis") this.yedekKaldir(0);
      };
      this.sonra(POSTER_COZ_MS, kaldir);
      (this.poster.hidden ? Promise.resolve() : this.poster.decode()).then(kaldir, kaldir);
    });
    return POSTER_GERI_MS;
  }

  /* ---------------- zincir geçiş (W-2 §14.7; d11 → d12 Dünya'ya uzaklaşma) ---------------- */
  /**
   * Kalkış görüntüsünden (lc döngüsü akarken) köprü posterine (p4 ≡ r43[0]; önceden çözüldü) KOPRU_MS çapraz sönme, sonra
   * parçalar art arda (`parcaOynat`). Dönen: adımın toplam süresi (köprü + parçalar; adımlayıcının kilidi bu süre). Poster
   * kipinde bütün süre hedef posterine yedek.
   */
  private zincirGec(j: number, kayit: Kayit, z: Zincir, sec: GecisSecenek): number {
    // Görsel süre: parça devirleri son karede (sıradaki parçanın 0. karesi ≡ o kare) → her devir bir kare kısaltır
    // (186 kare → 183 görünür kare, 6,1 s + köprü = 6,45 s). Varış (son parçanın `ended`'ı) adımlayıcının kilitli adımı
    // bittikten sonra gelsin: varışa hemen gelen ters jest kilide takılmasın (tuzak; geçiş → döngü devriyle aynı kural).
    const toplamMs = KOPRU_MS + ((z.kare - (z.parcalar.length - 1)) * 1000) / this.m.fps;
    kayit.zincir = z.parcalar.map((p) => ({ ad: p.ad }));
    if (this.posterKipi) {
      this.yedek(j, 1, kayit, "poster-kipi", { url: "", sure: toplamMs / 1000, hiz: 1, kare: z.kare, ad: z.ad }, sec);
      return toplamMs;
    }
    const T0 = this.yuva(z.parcalar[0].url);
    kayit.hazirdi = !!T0?.hazir;
    if (!T0 || (z.parcalar[1] && !this.yuva(z.parcalar[1].url))) {
      kayit.yuvadaYoktu = !T0;
      this.zincirDagit(j, z, 0, true);
    } else if (!T0.hazir) this.veri.oncele(z.parcalar[0].url);
    const el = this.yedekEl;
    const u = this.posterUrl(z.kopru);
    const lq = this.lqip(z.kopru);
    el.style.backgroundImage = u ? `url("${u}")${lq ? `, url("${lq}")` : ""}` : "none";
    el.style.transition = "none";
    el.style.opacity = "0";
    el.style.transform = "none";
    void el.offsetWidth;
    el.style.transition = `opacity ${KOPRU_MS}ms linear`;
    el.style.opacity = "1";
    sec.kare?.(0, z.kare);
    // Devir penceresi (ısıtma beklesin): köprünün sonunda ilk parça başlar.
    this.varisBek = performance.now() + KOPRU_MS + 60;
    this.sonra(KOPRU_MS, () => {
      if (kayit.bitti || this.durum !== "gecis") return;
      kayit.kopruMs = Math.round(performance.now() - kayit.tJest);
      this.parcaBasla(j, kayit, z, 0, sec);
    });
    return toplamMs;
  }

  /** Parça i: hazırsa hemen (ön sarılmışsa yalnız öne alınır), değilse bekle kipi (W-4; son kare / köprü posteri durur). */
  private parcaBasla(j: number, kayit: Kayit, z: Zincir, i: number, sec: GecisSecenek, tOnceSon?: number) {
    const T = this.yuva(z.parcalar[i].url);
    if (T?.hazir) return this.parcaOynat(T, j, kayit, z, i, sec, tOnceSon);
    this.parcaBekle(j, kayit, z, i, sec, tOnceSon, "hazir-degil");
  }
  /** Zincirin i. parçası için bekle kipi (W-4): parça hazır olunca zincir aynı yerden sürer (kodek değişirse yeni URL'ler). */
  private parcaBekle(j: number, kayit: Kayit, z: Zincir, i: number, sec: GecisSecenek, tOnceSon: number | undefined, neden: string, gecikme = 0) {
    const zz = () => this.zincir(kayit.from) ?? z;
    this.bekle(
      {
        kayit,
        neden: `${neden} ${z.parcalar[i].ad}`,
        sec,
        kalanMs: z.parcalar.slice(i).reduce((a, x) => a + x.sure, 0) * 1000,
        url: () => zz().parcalar[i]?.url ?? null,
        yerlestir: () => this.zincirDagit(j, zz(), i, true),
        devam: (T) => this.parcaOynat(T, j, kayit, zz(), i, sec, tOnceSon),
      },
      gecikme,
    );
  }

  /**
   * Parça i'yi oynat. İlk parça ilk karesi sunulunca öne alınır ve köprü katmanı kalkar (p4 ≡ r43[0]); sonrakiler önceki
   * parçanın son karesinde, ön sarılmış olarak (`parcaOnSar`; 0. karesi ≡ önceki son kare). Kadraj okuması zincirin
   * toplam karesiyle (`sec.kare(ofset + f, z.kare)`). Son parça → varış döngüsü: mevcut ön sarma/devir/varış yolu.
   */
  private parcaOynat(T: Yuva, j: number, kayit: Kayit, z: Zincir, i: number, sec: GecisSecenek, tOnceSon?: number) {
    const p = z.parcalar[i];
    const pk = kayit.zincir![i];
    const s = T.surum;
    const fps = this.m.fps;
    const son = i === z.parcalar.length - 1;
    const ofset = z.parcalar.slice(0, i).reduce((a, x) => a + x.kare, 0);
    const q0 = T.el.getVideoPlaybackQuality?.();
    const onSarili = T.oynat && !T.el.paused;
    let tPlay = performance.now();
    if (!onSarili) {
      T.oynat = true;
      T.el.loop = false;
      T.el.playbackRate = 1;
      if (T.el.currentTime > 0.001) T.el.currentTime = 0;
      T.el.play().then(
        () => (T.acik = true),
        (e: Error) => {
          T.oynat = false;
          kayit.playHata = e?.name;
          const engel = e?.name === "NotAllowedError";
          if (engel) this.engelVar(`zincir ${p.ad}`, T);
          // W-4: zincir bekler (poster sönmesi yok); bu denemenin geri çağrıları yuva sürümüyle düşer.
          if (this.durum === "gecis" && !kayit.bitti && T.surum === s) {
            T.surum++;
            this.parcaBekle(j, kayit, z, i, sec, tOnceSon, engel ? "engel" : `play ${e?.name ?? "?"}`, BEKLE_TIK_MS);
          }
        },
      );
    } else tPlay -= T.el.currentTime * 1000;
    if (i === 0) kayit.tPlay = tPlay;
    this.varisBek = tPlay + p.sure * 1000;
    let gorundu = false;
    const one = () => {
      if (gorundu || T.surum !== s || kayit.bitti) return;
      gorundu = true;
      this.goster(T.el, 0);
      if (i === 0) this.yedekKaldir(0);
      // Eski parça / kalkış döngüsü durur, boşalan yuvaya sıradaki parça ya da varış döngüsü (blob: ağsız).
      this.sonra(SOLMA_MS - 60, () => {
        if (!kayit.bitti && this.durum === "gecis") this.zincirDagit(j, z, i);
      });
    };
    if (onSarili) one();
    else {
      // Görünmez öğe ilk kareyi sunmazsa (rVFC gelmez): saat başlayınca ya da en geç SONME_EN_GEC_MS'de öne al.
      T.el.addEventListener("playing", one, { once: true });
      this.sonra(SONME_EN_GEC_MS, one);
    }
    let sunulan = 0;
    let onSarildi = false;
    let tSon: number | undefined;
    const kare = (now: number, meta: VideoFrameCallbackMetadata) => {
      if (T.surum !== s || kayit.bitti || pk.devredildi) return;
      sunulan++;
      if (!gorundu) one();
      if (sunulan === 1) {
        pk.ilkKareMs = Math.round((now - kayit.tJest) * 10) / 10;
        if (i === 0) {
          kayit.ilkKareMs = pk.ilkKareMs;
          const b = (meta.expectedDisplayTime || now) - tPlay - meta.mediaTime * 1000;
          if (b < 1000) {
            const bb = Math.max(0, b);
            kayit.baslamaMs = Math.round(bb);
            this.baslamaMs = Math.min(BASLAMA_EN_COK_MS, Math.max(16, (this.baslamaMs + bb) / 2));
          }
        }
      }
      if (tOnceSon !== undefined && pk.devirMs === undefined && (onSarili || meta.mediaTime > 0.001)) pk.devirMs = Math.round(now - tOnceSon);
      kayit.sunulan = (kayit.sunulan ?? 0) + 1;
      const f = Math.min(p.kare - 1, Math.round(meta.mediaTime * fps));
      sec.kare?.(ofset + f, z.kare);
      const kalan = ((p.kare - 1 - f) * 1000) / fps;
      if (!onSarildi && kalan <= this.baslamaMs) {
        if (son) onSarildi = this.onSar(j, kayit, kalan);
        else if ((onSarildi = this.parcaOnSar(z, i + 1))) kayit.zincir![i + 1].onSarMs = Math.round(kalan);
      }
      if (f >= p.kare - 1) {
        tSon = now;
        if (son) return this.devir(j, kayit, now);
        return this.parcaDevir(T, q0, j, kayit, z, i, sec, now);
      }
      T.el.requestVideoFrameCallback(kare);
    };
    if (typeof T.el.requestVideoFrameCallback === "function") T.el.requestVideoFrameCallback(kare);
    else {
      // rVFC yok (Safari < 15.4): devir `ended`'da, okuma rAF'te currentTime.
      one();
      const raf = () => {
        if (T.surum !== s || kayit.bitti || pk.devredildi) return;
        sec.kare?.(ofset + Math.min(p.kare - 1, Math.round(T.el.currentTime * fps)), z.kare);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
    const bitir = () => {
      if (T.surum !== s || kayit.bitti) return;
      if (!son) return this.parcaDevir(T, q0, j, kayit, z, i, sec, tSon ?? performance.now());
      kayit.bitti = true;
      this.parcaKalite(T, q0, pk);
      kayit.cozulen = kayit.zincir!.reduce((a, x) => a + (x.cozulen ?? 0), 0);
      kayit.dusen = kayit.zincir!.reduce((a, x) => a + (x.dusen ?? 0), 0);
      this.varis(j, 1, kayit, sec, tSon);
    };
    T.el.onended = bitir;
    this.sonra((p.sure + 1.5) * 1000, bitir);
  }

  private parcaKalite(T: Yuva, q0: VideoPlaybackQuality | undefined, pk: ParcaKayit) {
    const q1 = T.el.getVideoPlaybackQuality?.();
    if (q0 && q1) {
      pk.cozulen = q1.totalVideoFrames - q0.totalVideoFrames;
      pk.dusen = q1.droppedVideoFrames - q0.droppedVideoFrames;
    }
  }

  /** Parça i'nin son karesi sunuldu (ya da `ended`): sıradaki parça ön sarılmışsa hemen öne, değilse başlatılır. */
  private parcaDevir(T: Yuva, q0: VideoPlaybackQuality | undefined, j: number, kayit: Kayit, z: Zincir, i: number, sec: GecisSecenek, tSon: number) {
    const pk = kayit.zincir![i];
    if (pk.devredildi || kayit.bitti) return;
    pk.devredildi = true;
    this.parcaKalite(T, q0, pk);
    const n = this.yuva(z.parcalar[i + 1].url);
    if (n?.hazir && n.oynat && !n.el.paused) this.parcaOynat(n, j, kayit, z, i + 1, sec, tSon);
    else this.parcaBasla(j, kayit, z, i + 1, sec, tSon);
  }

  /** Sıradaki parçayı görünmezken 0. kareden başlat (ön sarma; geçiş → döngü devriyle aynı). Hazır değilse false. */
  private parcaOnSar(z: Zincir, i: number): boolean {
    const p = z.parcalar[i];
    const L = this.yuva(p.url);
    if (!L || L.el === this.aktif) return true;
    if (!L.hazir) return false;
    if (this.engel && !L.acik) return true;
    L.oynat = true;
    L.el.loop = false;
    L.el.playbackRate = 1;
    if (L.el.currentTime > 0.001) L.el.currentTime = 0;
    L.el.play().then(
      () => (L.acik = true),
      (e: Error) => {
        L.oynat = false;
        if (e?.name === "NotAllowedError") this.engelVar(`zincir ${p.ad}`, L);
      },
    );
    return true;
  }

  /**
   * Zincir havuzu: [parça i, i+1, i+2, varış döngüsü] ilk 3'ü (en çok 3 öğe). Görünen ve (zorla değilse) 80 ms'lik eski öğe
   * dışındaki boş yuvalar durdurulur, eksikler atanır. Parçalar blob önbelleğinde: atama ağsız; iOS ısıtması devir
   * pencereleri dışında (varisBek = parçanın bitişi).
   */
  private zincirDagit(j: number, z: Zincir, i: number, zorla = false) {
    if (this.durum === "kapali") return;
    const d = this.dongu(j);
    const ist: { url: string; dongu: boolean; k: number }[] = [];
    for (let x = i; x < z.parcalar.length; x++) ist.push({ url: z.parcalar[x].url, dongu: false, k: z.ilkPoster[x] });
    if (d) ist.push({ url: d.url, dongu: true, k: j });
    ist.splice(this.yuvalar.length - this.disarida(ist, [], zorla));
    const tutulan = new Set<Yuva>();
    for (const g of ist) {
      const y = this.yuva(g.url);
      if (y) tutulan.add(y);
    }
    const bos = this.yuvalar.filter((y) => !tutulan.has(y) && y.el !== this.aktif && (zorla || y.el !== this.eski));
    for (const y of bos) {
      y.el.pause();
      y.oynat = false;
    }
    for (const g of ist) {
      if (this.yuva(g.url)) {
        this.veri.oncele(g.url);
        continue;
      }
      const y = bos.shift();
      if (!y) break;
      this.ata(y, g.url, g.dongu, g.k);
    }
  }

  /** DOM geçişi bitti (klipsiz beklenmeyen geçişin yedeği; kapanış dönüşü). */
  domVaris(j: number) {
    const kayit = this.olaylar.at(-1);
    this.k = j;
    this.durum = "dur";
    this.varisT = performance.now();
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

  /** Poster kipi (YALNIZ `?poster=1`, ölçüm): j durağının posterine çapraz sönme; süre = klip süresi. W-4'ten beri başka yedek yok. */
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
      this.varisT = performance.now();
      kayit.gecisMs = Math.round(performance.now() - kayit.tJest);
      if (!this.posterKipi) {
        this.dagit(j, dir);
        this.bostaPlanla();
      }
      this.olay("varis", kayit);
      sec.varis?.(kayit);
      // Engelde de denenir (W-2): reddedilirse donguBaslat posteri bırakır, sıradaki jestte kilitAc döngüyü başlatır.
      if (!this.posterKipi && this.dongu(j)) void this.donguBaslat(j).then(() => this.yedekKaldir(200));
      else this.sonra(60, () => this.yedekKaldir(0)); // poster katmanı aynı kare
    });
  }

  /* ---------------- bekle kipi (W-4 §14.7) ---------------- */
  /**
   * Geçiş bekler: mevcut kare durur (döngü akar ya da geçişin 0. karesi / köprü posteri), VideoSahne göstergeyi açar ve
   * metni erteler (`sec.bekle`). `gecikme`: play() reddinden sonra ilk yoklama (ret döngüsü sıkışmasın).
   */
  private bekle(b: Pick<Bekleme, "kayit" | "neden" | "kalanMs" | "sec" | "url" | "yerlestir" | "devam">, gecikme = 0) {
    const { kayit } = b;
    if (kayit.bitti || this.durum !== "gecis") return;
    if (this.bekleme) this.bekleBitir(this.bekleme, false);
    const yb: Bekleme = { ...b, tb: performance.now(), id: 0, sonDeneme: -Infinity };
    this.bekleme = yb;
    if (!kayit.bekleSay) this.bekleSay++;
    kayit.bekle ??= b.neden;
    kayit.bekleSay = (kayit.bekleSay ?? 0) + 1;
    this.olay("bekle", { no: kayit.no, neden: b.neden });
    b.sec.bekle?.(true, 0);
    if (gecikme > 0) yb.id = this.sonra(gecikme, () => this.bekleTik(yb));
    else this.bekleTik(yb);
  }
  private bekleTik(b: Bekleme) {
    if (this.bekleme !== b) return;
    window.clearTimeout(b.id);
    this.zamanlar.delete(b.id);
    const { kayit } = b;
    if (kayit.bitti || this.durum !== "gecis") return this.bekleBitir(b, false);
    const t = performance.now();
    if (!kayit.bekleUzun && t - b.tb > BEKLE_UYARI_MS) {
      kayit.bekleUzun = true;
      this.olay("bekle-uzun", { no: kayit.no, neden: b.neden });
    }
    // Kod çözme hatası (seçilen kodek bu cihazda çözülemiyor): dinlenmeyi bekleyemez, H.264'e şimdi dönülür.
    if (this.kodekBekliyor) this.kodekBeklerken();
    const u = b.url();
    let T = u ? this.yuva(u) : null;
    if (u && T && !T.hazir && !this.veri.hazirMi(u) && !this.veri.sozler.has(u) && t - b.sonDeneme > BEKLE_YENIDEN_MS) {
      // İndirme başarısız (deneme sınırı): yuva boşaltılıp dosya yeniden istenir.
      b.sonDeneme = t;
      this.veri.hatalar.delete(u);
      this.veri.kullanimda.delete(u);
      T.url = null;
      T = null;
    }
    if (u && !T) {
      b.yerlestir();
      T = this.yuva(u);
    }
    // Engelde kilidi açılmamış öğe: sıradaki jestte kilitAc başlatır (burada denenirse yine reddedilir).
    if (T?.hazir && !(this.engel && !T.acik)) return this.bekleDevam(b, T);
    if (u) this.veri.oncelikli(u);
    if (T && !T.hazir && b.uyan !== T) {
      // Hazır olunca hemen (canplay); dolu `cozum` ısıtmayı da sıradan çıkarır (acil).
      b.uyan = T;
      T.cozum.push(() => this.bekleTik(b));
    }
    b.id = this.sonra(BEKLE_TIK_MS, () => this.bekleTik(b));
  }
  private bekleDevam(b: Bekleme, T: Yuva) {
    if (this.bekleme !== b) return;
    this.bekleBitir(b, true);
    b.devam(T);
  }
  private bekleBitir(b: Bekleme, devam: boolean) {
    if (this.bekleme !== b) return;
    this.bekleme = null;
    window.clearTimeout(b.id);
    this.zamanlar.delete(b.id);
    const ms = Math.round(performance.now() - b.tb);
    b.kayit.beklemeMs = (b.kayit.beklemeMs ?? 0) + ms;
    this.bekleToplamMs += ms;
    this.olay("bekle-bitti", { no: b.kayit.no, ms, devam });
    b.sec.bekle?.(false, b.kalanMs);
  }
  /** Beklerken kod çözme hatası (W-4): H.264'e yerinde dönülür; görünen öğe kalır, beklenen klip yeni kodekle istenir. */
  private kodekBeklerken() {
    this.kodekBekliyor = false;
    if (this.kodek === "h264") return;
    const eski = this.kodek;
    this.kodekYasak.add(eski);
    this.kodek = "h264";
    this.olay("kodek-yedek", { eski, yeni: "h264", bekle: true });
  }

  /* ---------------- kapanış / temizlik ---------------- */
  /** Kapanış görünür: her video durur, kaynaklar ve bloblar bırakılır. */
  durdur() {
    this.durum = "kapali";
    this.bekleme = null;
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
    for (const t of KILIT_OLAYLARI) removeEventListener(t, this.kilitDinle, { capture: true });
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

/**
 * Apple WebKit (iOS/iPadOS'taki her tarayıcı ve Safari; `navigator.vendor`). Akıcılık turu: burada HEVC (hvc1) AV1'in
 * önünde denenir. AV1 donanım çözücüsü yalnız A17 Pro/A18 ve M3 sonrasında var; daha eski Apple cihazları zaten HEVC'ye
 * düşüyordu, yani AV1 yalnız en yeni iPhone'larda (kullanıcının iPhone 16'sı) seçiliyordu. HEVC Apple'da en olgun
 * donanım yolu; dikey HEVC seti AV1'den küçük (21 dosya 9,998 / 10,431 MB). Kanıt (AV1'in iOS'ta takıldığı) yok: cihazda
 * `?kodek=av1` / `?kodek=hevc` ve `?hud=1` ile karşılaştırılmalı.
 */
function appleWebKit(): boolean {
  try {
    return /Apple/.test(navigator.vendor);
  } catch {
    return false;
  }
}

/** Kodek seçimi (R4 §4): mediaCapabilities (destekli + güç verimli + akıcı) → canPlayType → H.264. */
export async function kodekSec(m: IstemciManifest, boyut: Boyut, istek?: string | null): Promise<KodekAd> {
  const tum = m.kodekler.filter((k) => k.boyutlar.includes(boyut));
  const zorla = tum.find((k) => k.ad === istek);
  if (zorla) return zorla.ad;
  const adaylar = appleWebKit() ? [...tum.filter((k) => k.ad === "hevc"), ...tum.filter((k) => k.ad !== "hevc")] : tum;
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
