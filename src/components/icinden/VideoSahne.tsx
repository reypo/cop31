"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createStepper, easeInOutCubic, type Durak as AdimDurak, type Jest, type Stepper } from "./adim";
import { BROSUR_GEOMETRI } from "./brosur-geometri";
import { dSifirla, dYayinla } from "./d-yayin";
import KadrajOkumasi, { okumaYaz } from "./KadrajOkumasi";
import type { Boyut, IstemciManifest, KodekAd } from "./klipler";
import Lombar, { delikYaz } from "./Lombar";
import { kodekSec, Oynatici, type Kayit } from "./oynatici";

/**
 * /icinden v3 sahnesi (brief-icinden-3 §2.4, §9.5; oynatıcı docs/klip-oynatma.md). Sabit sahne (poster,
 * 3 video, yedek, lombar kâğıdı, broşür, etiketler, kadraj okuması) + belgede 11 durak bölümü (100svh,
 * görünmez çapa; metin bantları onların içinde `position: fixed`) + kapanış.
 *
 * Durum makinesi: DUR(k) → jest → GECIS(k→j) → DUR(j). Bir jest = bir geçiş; adım süresi = geçişin süresi
 * (klip + DOM ön/son evresi); geçiş sürerken jestler yok sayılır (ters geçiş yok, §9.5). Video geçişleri
 * Oynatici'de; DOM evreleri burada: d0→d1 logo sönmesi 0,3 s + amblem dairesinde ilk kare 0,3 s + lombar;
 * d5→d6 kesişme 200 ms + broşür FLIP 420 ms; d6–d9 sayfa çevirme 1,6 s (Brosur'a d yayını, v2 ölçeği k − 1);
 * d9→d10 broşür dalışı 0,6 s + fotoğraf → video 200 ms + T01 (delik arka kapakta ve kâğıtta).
 *
 * React state YOK: her şey kök öznitelikleri (data-durak, data-faz, data-hedef, data-metin, data-etiket,
 * data-dinlenme, data-spot, data-kagit, data-dalis, data-kiosk) ve doğrudan stil yazımıyla. Reduced-motion'da
 * hiçbir şey kurulmaz (CSS akış düzeni, video yok); oturum ortasında açılırsa sayfa yenilenir.
 * Activity (Next 16): gizlenince etkiler temizlenir (videolar durur, bloblar bırakılır, touch-action geri).
 *
 * Veri Tasarrufu / 2G–3G / prefers-reduced-data (brief §6): poster kipi — video inmez, geçişler poster çapraz
 * sönmesi (lombar, broşür ve okuma aynı zamanlamayla). `?poster=1` ile zorlanır (ölçüm).
 */

const KIOSK_KAPANIS_MS = 9000;

const DOM_SAYFA_MS = 1600;
const FLIP_MS = 420;
const KESIS_MS = 200;
const DALIS_MS = 600;
const LOGO_MS = 300;
const METIN_ONCE_MS = 250;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInCubic = (x: number) => x * x * x;

type Donusum = { tx: number; ty: number; k: number };

export default function VideoSahne({
  manifest,
  etiketler,
  brosur,
  children,
}: {
  manifest: IstemciManifest;
  etiketler: ReactNode;
  brosur: ReactNode;
  children: ReactNode;
}) {
  const kokRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const kok = kokRef.current;
    if (!kok) return;
    const azalt = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Ayar oturum ortasında değişirse (iki yönde de) düzen baştan kurulur: CSS akış düzenine geçip JS adımlama,
    // video ve touch-action'ı açık bırakmasın (denetim A2-13).
    const yenile = () => location.reload();
    azalt.addEventListener("change", yenile);
    if (azalt.matches) {
      kok.dataset.azalt = "1";
      return () => azalt.removeEventListener("change", yenile);
    }
    const q = new URLSearchParams(location.search);
    let iptal = false;
    let temizle: (() => void) | null = null;
    const boyutHesapla = (): Boyut => {
      const s = kok.querySelector<HTMLElement>(".v3-sahne")!;
      return s.clientWidth >= (s.clientHeight * 4) / 3 ? "yatay" : "dikey";
    };
    const b0 = boyutHesapla();
    void kodekSec(manifest, b0, q.get("kodek")).then((kodek) => {
      if (iptal) return;
      temizle = kur(kok, manifest, b0, kodek, q);
    });
    return () => {
      iptal = true;
      azalt.removeEventListener("change", yenile);
      temizle?.();
    };
  }, [manifest]);

  return (
    <div ref={kokRef} className="v3 ic-kok" data-durak="0" data-faz="dur" data-metin="0" data-etiket="-" data-dinlenme="-" data-spot="0">
      <div className="v3-sahne" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- poster katmanı: src JS'ten, LQIP arka planda */}
        <img data-v3-poster className="v3-poster" alt="" decoding="async" hidden />
        <video className="v3-video" muted playsInline preload="auto" disableRemotePlayback />
        <video className="v3-video" muted playsInline preload="auto" disableRemotePlayback />
        <video className="v3-video" muted playsInline preload="auto" disableRemotePlayback />
        <div data-v3-yedek className="v3-yedek" />
        <Lombar />
        <div data-v3-brosur className="v3-brosur" hidden>
          <div className="v3-brosur-kutu">{brosur}</div>
        </div>
        {etiketler}
        <div data-v3-sutun-cizgi className="v3-sutun-cizgi" />
        <div data-v3-perde className="v3-perde" />
      </div>
      {/* Sahne kabının dışında: metin bandının scrim'i (z 10) okumayı karartmasın. */}
      <KadrajOkumasi />
      {/* Ekran okuyucu: klavyeyle adım atılınca yeni durağın başlığı (odak yerinde kalır). */}
      <p data-v3-canli className="sr-only" aria-live="polite" />
      {children}
    </div>
  );
}

/* ================================================================================================ */

/** Veri tasarrufu: Save-Data, 2G/3G tahmini ya da prefers-reduced-data (brief §6). */
function azVeri(q: URLSearchParams): boolean {
  if (q.get("poster") === "1") return true;
  try {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (c?.saveData) return true;
    if (/(^|-)(2g|3g)$/.test(c?.effectiveType ?? "")) return true;
    return window.matchMedia("(prefers-reduced-data: reduce)").matches;
  } catch {
    return false;
  }
}

function kur(kok: HTMLElement, m: IstemciManifest, boyut0: Boyut, kodek0: KodekAd, q: URLSearchParams): () => void {
  const sahne = kok.querySelector<HTMLElement>(".v3-sahne")!;
  const kagit = sahne.querySelector<HTMLElement>("[data-v3-kagit]");
  const brosurEl = sahne.querySelector<HTMLElement>("[data-v3-brosur]")!;
  const brosurKutu = brosurEl.querySelector<HTMLElement>(".v3-brosur-kutu")!;
  const kadrajEl = kok.querySelector<HTMLElement>("[data-v3-kadraj]");
  const perde = sahne.querySelector<HTMLElement>("[data-v3-perde]")!;
  const sutunCizgi = sahne.querySelector<HTMLElement>("[data-v3-sutun-cizgi]")!;
  const bolumler = [...kok.querySelectorAll<HTMLElement>(".v3-durak")];
  const kapanis = kok.querySelector<HTMLElement>(".ic-kapanis");
  const geriLink = kok.querySelector<HTMLAnchorElement>(".v3-geri");
  const canli = kok.querySelector<HTMLElement>("[data-v3-canli]");
  const kiosk = q.get("auto") === "1";
  if (kiosk) kok.dataset.kiosk = "1";
  const posterKipi = azVeri(q);
  const D = m.duraklar;

  let boyut = boyut0;
  let kodek = kodek0;
  let k = 0; // bulunulan durak (11 = kapanış)
  let faz: "dur" | "gecis" = "dur";
  const zamanlar = new Set<number>();
  const sonra = (ms: number, f: () => void) => {
    const id = window.setTimeout(() => {
      zamanlar.delete(id);
      f();
    }, Math.max(0, ms));
    zamanlar.add(id);
    return id;
  };
  const iptalEt = (id: number) => {
    window.clearTimeout(id);
    zamanlar.delete(id);
  };
  const olaylar: { tur: string; t: number; veri?: unknown }[] = [];
  const oy: Oynatici = new Oynatici({
    sahne,
    manifest: m,
    boyut,
    kodek,
    posterKipi,
    butceMB: Number(q.get("butce") ?? 30),
    olay: (tur, veri) => {
      olaylar.push({ tur, t: Math.round(performance.now()), veri: tur === "adim" ? undefined : veri });
      // Kiosk günlerce açık kalır: kayıt sınırlı (denetim A2-03).
      if (olaylar.length > 400) olaylar.splice(0, olaylar.length - 300);
      kok.dataset.engel = oy?.engel ? "1" : "0";
      // Kod çözme hatası dinlenmede geldiyse hemen H.264'e dön; geçişteyse varışta (varildi).
      if (tur === "kodek-yedek-iste" && faz === "dur" && k <= 10) kodekUygula();
    },
  });
  const kodekUygula = () => {
    if (oy.kodekUygula()) kodek = oy.kodek;
  };

  /* ---------------- geometri ---------------- */
  const geo = () => {
    const W = sahne.clientWidth;
    const H = sahne.clientHeight;
    const { g, y } = m.boyutlar[boyut];
    const s = Math.max(W / g, H / y);
    return { W, H, s, ox: (W - g * s) / 2, oy: (H - y * s) / 2 };
  };
  const ekran = (p: readonly [number, number]) => {
    const G = geo();
    return [G.ox + p[0] * G.s, G.oy + p[1] * G.s] as const;
  };
  const dunyaR = D[1].ozel?.dunyaR ?? [115];
  const lombar = () => {
    const c = D[1].ozel?.dunyaC?.[boyut] ?? (boyut === "dikey" ? ([360, 512] as const) : ([640, 232] as const));
    const G = geo();
    const [cx, cy] = ekran(c);
    const r0 = dunyaR[0] * G.s;
    const kose = Math.hypot(Math.max(cx, G.W - cx), Math.max(cy, G.H - cy)) + 4;
    return { cx, cy, r0, kose };
  };
  /** t01 karesi f için delik yarıçapı: paralaks (R/R0)^2,6 ve en geç 1,1 s'de köşegen. */
  const delikR = (f: number) => {
    const L = lombar();
    const R = dunyaR[Math.max(0, Math.min(dunyaR.length - 1, f))] / dunyaR[0];
    const zaman = L.r0 + (L.kose - L.r0) * easeInCubic(Math.min(1, f / m.fps / 1.1));
    return Math.max(L.r0 * Math.pow(R, 2.6), zaman);
  };
  /**
   * Dalışta (d9 ↔ d10) broşürün lombar merkezinden en uzak köşesi (px): delik bundan büyükken broşür tamamen
   * deliğin içindedir → maskesi bir kez yazılır, sonraki karelerde yeniden yazılmaz (broşür katmanı yeniden
   * boyanmaz; visibility değiştirmek de yeniden boyatırdı). 0: kapalı.
   */
  let brosurKapsam = 0;
  let brosurMaskeSabit = false;
  const kapsamOlc = (t: Donusum) => {
    const L = lombar();
    const { x, y, w, h } = BROSUR_GEOMETRI.sayfa;
    let m = 0;
    for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]])
      m = Math.max(m, Math.hypot(t.tx + px * t.k - L.cx, t.ty + py * t.k - L.cy));
    return m + 24; // gölge payı
  };
  const kagitDelik = (r: number, ic = 0) => {
    const L = lombar();
    delikYaz(kagit, { cx: L.cx, cy: L.cy, r, ic });
    if (brosurEl.hidden) return;
    const icinde = brosurKapsam > 0 && r > brosurKapsam && ic <= 0;
    if (icinde && brosurMaskeSabit) return;
    brosurMaskeSabit = icinde;
    delikYaz(brosurEl, { cx: L.cx, cy: L.cy, r, ic });
  };
  const kagitGoster = (opak: number | null) => {
    // Kâğıt (beyaz) görünürken kadraj okuması yok (CSS data-kagit; denetim A1-05).
    if (opak === null || opak <= 0) delete kok.dataset.kagit;
    else kok.dataset.kagit = "1";
    if (!kagit) return;
    if (opak === null) {
      kagit.style.display = "none";
      delikYaz(kagit, null);
      return;
    }
    kagit.style.display = "";
    kagit.style.opacity = String(opak);
  };

  /* broşür kutusu: kâğıt dikdörtgeni → dönüşüm */
  const kagitDonusum = (x: number, y: number, w: number): Donusum => {
    const kk = w / BROSUR_GEOMETRI.sayfa.w;
    return { tx: x - BROSUR_GEOMETRI.sayfa.x * kk, ty: y - BROSUR_GEOMETRI.sayfa.y * kk, k: kk };
  };
  /** t56 son karesindeki (= p6 plakasındaki) render kapağının ekran dikdörtgeni. */
  const bankoKutu = () => {
    const q4 = D[6].ozel?.brosurDikdortgen?.[boyut];
    if (!q4) return null;
    const p = q4.map((n) => ekran(n));
    return {
      x0: Math.min(...p.map((a) => a[0])),
      x1: Math.max(...p.map((a) => a[0])),
      y0: Math.min(...p.map((a) => a[1])),
      y1: Math.max(...p.map((a) => a[1])),
    };
  };
  /**
   * d6–d9 okuma düzeni. p6 plakası broşürsüz (C turu, §11.1 S2-C 2): DOM broşürün altında render kapağı yok,
   * örtme payı ve konum kaydırması gerekmez. Dikeyde ekranın ortası (üstte 52 px, altta d6 bandı için 148 px),
   * yatayda sol %62'nin ortası (bant sağda, ≤ %38).
   */
  const okumaDonusum = (): Donusum => {
    const G = geo();
    const oran = BROSUR_GEOMETRI.sayfa.w / BROSUR_GEOMETRI.sayfa.h;
    const yatay = boyut === "yatay";
    const ust = 52;
    const alt = yatay ? 32 : 148;
    const alanG = yatay ? G.W * 0.62 : G.W;
    const kenar = yatay ? 48 : 16;
    const h = Math.min(G.H - ust - alt, (alanG - 2 * kenar) / oran);
    const w = h * oran;
    return kagitDonusum((alanG - w) / 2, ust + (G.H - ust - alt - h) / 2, w);
  };
  const bankoDonusum = (): Donusum => {
    const b = bankoKutu();
    if (!b) return okumaDonusum();
    const { x0, x1, y0, y1 } = b;
    const oran = BROSUR_GEOMETRI.sayfa.w / BROSUR_GEOMETRI.sayfa.h;
    // contain: render'daki kapak oranı (DL 0,476) DOM kapağından (0,708) farklı olabilir → ortala.
    let w = x1 - x0;
    let h = w / oran;
    if (h > y1 - y0) {
      h = y1 - y0;
      w = h * oran;
    }
    return kagitDonusum((x0 + x1 - w) / 2, (y0 + y1 - h) / 2, w);
  };
  const dalisDonusum = (): Donusum => {
    const L = lombar();
    const a = BROSUR_GEOMETRI.arkaKure;
    const kk = L.r0 / a.r;
    return { tx: L.cx - a.cx * kk, ty: L.cy - a.cy * kk, k: kk };
  };
  const donusumYaz = (t: Donusum) => {
    brosurKutu.style.transform = `translate(${t.tx.toFixed(2)}px, ${t.ty.toFixed(2)}px) scale(${t.k.toFixed(5)})`;
  };
  const ara = (a: Donusum, b: Donusum, e: number): Donusum => ({
    tx: a.tx + (b.tx - a.tx) * e,
    ty: a.ty + (b.ty - a.ty) * e,
    k: a.k * Math.pow(b.k / a.k, e),
  });
  /**
   * d6 ton eşlemesi (kapak-ton.py): render kapağının ışığı/AgX tonu (kâğıt grimsi, mavi soluk) DOM kapağa CSS
   * filtresiyle verilir; t = 1 render tonu, 0 gerçek renkler (filtre kaldırılır). Kesişmede 1, FLIP'te 420 ms'de 0.
   */
  const ton = D[6].ozel?.kapakTon;
  const tonYaz = (t: number) => {
    if (!ton || t <= 0.001) {
      brosurKutu.style.removeProperty("filter");
      return;
    }
    const l = (v: number, kimlik: number) => (kimlik + (v - kimlik) * t).toFixed(3);
    brosurKutu.style.filter = `saturate(${l(ton.saturate, 1)}) contrast(${l(ton.contrast, 1)}) brightness(${l(ton.brightness, 1)}) sepia(${l(ton.sepia, 0)})`;
  };
  // Dalışta sönenler: arka kapağın yazıları/yayları (data-ic-d) ve sırt gölgesi (beyaz kâğıtta sayfa kenarı kalmasın).
  const arkaSoner = () => [...brosurEl.querySelectorAll<HTMLElement>(".ic-br-sayfa-arka [data-ic-d], .ic-br-sayfa-arka > .ic-br-sirt")];
  const arkaOpak = (o: number) => {
    for (const el of arkaSoner()) el.style.opacity = o >= 1 ? "" : o.toFixed(3);
  };

  /* ---------------- rAF: adım + ara animasyonlar ---------------- */
  type Ara = { t0: number; sure: number; f: (e: number) => void; bitis?: () => void };
  const aralar = new Set<Ara>();
  let rafId = 0;
  const dongu = (now: number) => {
    rafId = 0;
    const devam = stepper ? stepper.frame(now) : false;
    for (const a of [...aralar]) {
      if (a.t0 < 0) a.t0 = now;
      const e = a.sure > 0 ? Math.min(1, Math.max(0, (now - a.t0) / a.sure)) : 1;
      a.f(e);
      if (e >= 1) {
        aralar.delete(a);
        a.bitis?.();
      }
    }
    if (devam || aralar.size) rafId = requestAnimationFrame(dongu);
  };
  const uyandir = () => {
    if (!rafId) rafId = requestAnimationFrame(dongu);
  };
  const tween = (sure: number, f: (e: number) => void, bitis?: () => void) => {
    const a: Ara = { t0: -1, sure, f, bitis };
    aralar.add(a);
    uyandir();
    return a;
  };

  /* ---------------- metin, etiket, okuma, spot ---------------- */
  const okuma = (j: number) => {
    const d = D[j];
    if (!d) return "";
    if (d.okumaDurak) return d.okumaDurak;
    return typeof d.okuma === "string" ? d.okuma : (d.okuma.at(-1) ?? "");
  };
  let spotId = 0;
  let spotN = 0;
  const spotDurdur = () => {
    iptalEt(spotId);
    kok.dataset.spot = "0";
    sutunCizgi.style.opacity = "0";
  };
  /**
   * d5 etkin sütunun işareti (denetim A1-02). Çizgi çapadan bandın dış kenarına (dikeyde üst kenar, yatayda sol
   * kenar, etkin satırın hizası) yalnız çapa bandın dışındaysa ve çizgi ≤ 0,35 · kısa kenarsa: uzun çizgi
   * kompozisyonu boydan bölüyor, bant altındaki çapadan gelen çizgi metnin içinden geçiyordu. Uzunsa yalnız çapada
   * nokta; çapa kırpımda, bandın içinde/altında ya da üst şeritteyse (güvenli alan, kadraj okuması hizası) hiçbiri;
   * satır döngüsü her durumda sürer.
   */
  const sutunCizgisi = (no: number) => {
    sutunCizgi.style.opacity = "0";
    const s = D[5].ozel?.sutunlar?.[boyut]?.[no - 1];
    const bant = kok.querySelector<HTMLElement>('.v3-bant[data-d="5"] .v3-bant-ic');
    const satir = bant?.querySelector<HTMLElement>(`.v3-sutun-satir[data-no="${no}"]`);
    if (!s || !bant || !satir) return;
    const [x, y] = ekran(s);
    const W = sahne.clientWidth;
    const H = sahne.clientHeight;
    if (x < 12 || y < 12 || x > W - 12 || y > H - 12) return;
    const sr = sahne.getBoundingClientRect();
    const r = bant.getBoundingClientRect();
    const b = { l: r.left - sr.left, t: r.top - sr.top, r: r.right - sr.left, b: r.bottom - sr.top };
    const yatay = boyut === "yatay";
    if (yatay ? x > b.l - 16 : y > b.t - 16) return;
    // Üst şerit (durum çubuğu / güvenli alan ve kadraj okumasının hizası): işaret yok.
    const ok = kadrajEl?.getBoundingClientRect();
    if (y < (ok && ok.height > 0 ? ok.bottom - sr.top : 32) + 12) return;
    const sat = satir.getBoundingClientRect();
    const bx = yatay ? b.l - 6 : Math.min(Math.max(x, b.l + 24), b.r - 24);
    const by = yatay ? Math.min(Math.max(sat.top - sr.top + sat.height / 2, b.t + 12), b.b - 12) : b.t - 6;
    const dx = bx - x;
    const dy = by - y;
    const L = Math.hypot(dx, dy);
    if (L <= 0.35 * Math.min(W, H)) {
      delete sutunCizgi.dataset.nokta;
      sutunCizgi.style.width = `${L.toFixed(1)}px`;
      sutunCizgi.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${Math.atan2(dy, dx).toFixed(4)}rad)`;
    } else {
      sutunCizgi.dataset.nokta = "1";
      sutunCizgi.style.removeProperty("width");
      sutunCizgi.style.transform = `translate(${(x - 4.5).toFixed(1)}px, ${(y - 4.5).toFixed(1)}px)`;
    }
    sutunCizgi.style.opacity = "1";
  };
  const spotBaslat = (j: number) => {
    spotDurdur();
    const say = j === 4 ? 4 : j === 5 ? 12 : 0;
    if (!say) return;
    const aralik = j === 4 ? 3500 : 4500;
    spotN = 0;
    const adim = () => {
      spotN = (spotN % say) + 1;
      kok.dataset.spot = String(spotN);
      if (j === 5) sutunCizgisi(spotN);
      spotId = sonra(aralik, adim);
    };
    spotId = sonra(600, adim);
  };
  let dinlenmeId = 0;
  /** d0 bandı d ≠ 0'da görünmez: içindeki bağlantı Tab sırasından çıkar (denetim A2-06; odak görünmez öğeye gitmesin). */
  const geriOdak = (j: number) => {
    if (geriLink) geriLink.tabIndex = j === 0 ? 0 : -1;
  };
  const dinlen = (j: number) => {
    kok.dataset.durak = String(j);
    kok.dataset.faz = "dur";
    delete kok.dataset.hedef;
    kok.dataset.metin = String(j);
    kok.dataset.etiket = String(j);
    geriOdak(j);
    iptalEt(dinlenmeId);
    dinlenmeId = sonra(400, () => (kok.dataset.dinlenme = String(j)));
    okumaYaz(kadrajEl, okuma(j));
    spotBaslat(j);
  };
  /** Ekran okuyucuya yeni durağın başlığı (sr-only h1/h2; yalnız jestle varışta). */
  const duyur = (j: number) => {
    const b = j <= 10 ? kok.querySelector<HTMLElement>(`#v3-b${j}`)?.textContent : "";
    if (canli && b) canli.textContent = b;
  };
  const gecisBasi = (hedef: number) => {
    faz = "gecis";
    kok.dataset.faz = "gecis";
    kok.dataset.hedef = String(hedef);
    kok.dataset.metin = "-";
    kok.dataset.etiket = "-";
    kok.dataset.dinlenme = "-";
    geriOdak(-1);
    iptalEt(dinlenmeId);
    spotDurdur();
    kioskDurdurZaman();
  };
  const metinGelsin = (j: number, ms: number) =>
    sonra(ms, () => {
      kok.dataset.metin = String(j);
      kok.dataset.etiket = String(j);
    });
  /** Geçişin klibine göre kadraj okuması: gelen dizinin karesi (geri yönde tersten). */
  const okumaKare = (hedefDizi: number, f: number, n: number, ters: boolean) => {
    const o = D[hedefDizi]?.okuma;
    if (!Array.isArray(o) || !o.length) return;
    const i = ters ? n - 1 - f : f;
    okumaYaz(kadrajEl, o[Math.max(0, Math.min(o.length - 1, i))]);
  };

  /* ---------------- durak kurulumu (statik) ---------------- */
  const brosurDurak = (j: number) => {
    tonYaz(0);
    brosurKapsam = 0;
    brosurMaskeSabit = false;
    if (j >= 6 && j <= 9) {
      brosurEl.hidden = false;
      brosurEl.style.opacity = "1";
      delikYaz(brosurEl, null);
      arkaOpak(1);
      donusumYaz(okumaDonusum());
      dYayinla(j - 1, false);
    } else if (j === 5 || j === 10) {
      // Ön ısıtma (v2 KAGIT_GIRIS kalıbı): broşür, ilk görüneceği yerde neredeyse görünmez (0,003) boyanır; d5→d6'da
      // ilk görünme ve FLIP sonu yeniden raster karesi takılmasın (ölçüldü: 4× CPU mobilde 195 + 506 ms uzun kare).
      // d10'da arka kapak dalış dönüşümünde (10→9'un ilk boyaması klibin ortasına düşüp 1 kare düşürüyordu, B turu).
      // Varıştan 800 ms sonra (döngü başladıktan sonra; varış karesine binmesin: ölçüldü 136 ms).
      brosurEl.hidden = true;
      sonra(800, () => {
        if (k !== j || faz !== "dur") return;
        dYayinla(j === 5 ? 4 : 8, false); // d5: kapak ve sayfa 1 görselleri önden insin; d10: arka kapak
        brosurEl.hidden = false;
        delikYaz(brosurEl, null);
        arkaOpak(j === 5 ? 1 : 0);
        brosurEl.style.opacity = "0.003";
        donusumYaz(j === 5 ? okumaDonusum() : dalisDonusum());
      });
    } else {
      brosurEl.hidden = true;
      delikYaz(brosurEl, null);
    }
  };
  const durakKur = (j: number) => {
    k = j;
    faz = "dur";
    delete kok.dataset.dalis;
    if (j === 0) {
      kagitGoster(1);
      delikYaz(kagit, null);
    } else kagitGoster(null);
    brosurDurak(j);
    dinlen(j);
  };

  /* ---------------- adım ---------------- */
  const varildi = (j: number) => {
    if (oy.kodekBekliyor && j <= 10) kodekUygula();
    durakKur(j);
    duyur(j);
    if (olcBekliyor) yenidenOlc();
    kioskPlanla();
  };
  /** Kapanış durağı (11): videolar ve bloblar bırakılır. */
  const kapanisKur = () => {
    oy.durdur();
    k = 11;
    faz = "dur";
    kok.dataset.durak = "11";
    kok.dataset.faz = "dur";
    kok.dataset.metin = "-";
    kok.dataset.etiket = "-";
    kok.dataset.dinlenme = "-";
    delete kok.dataset.hedef;
    geriOdak(11);
  };

  const adim = (from: number, to: number, dir: 1 | -1, jest: Jest): number | false => {
    if (faz !== "dur" || from !== k) return false;
    // kapanış
    if (to === 11) {
      gecisBasi(11);
      okumaYaz(kadrajEl, "");
      sonra(1000, () => {
        kapanisKur();
        if (olcBekliyor) yenidenOlc();
        kioskPlanla();
      });
      return 1000;
    }
    if (from === 11) {
      gecisBasi(10);
      oy.basla(10);
      metinGelsin(10, 1000 - METIN_ONCE_MS);
      sonra(1000, () => varildi(10));
      return 1000;
    }
    if (oy.durum !== "dur") return false;
    gecisBasi(to);

    // d0 → d1: logo sönmesi (CSS, 300 ms) → amblem dairesinde ilk kare (300 ms) → T01 + lombar
    if (from === 0 && to === 1) {
      const L = lombar();
      kagitGoster(1);
      kagitDelik(0.97 * L.r0, 1);
      const v = oy.gec(1, 1, jest.tur, jest.t, {
        oncesiMs: 2 * LOGO_MS,
        kare: (f, n) => {
          kagitDelik(delikR(f));
          okumaKare(1, f, n, false);
        },
        varis: () => {
          kagitGoster(null);
          varildi(1);
        },
      });
      sonra(LOGO_MS, () => {
        oy.onizle(1, 1);
        tween(LOGO_MS, (e) => kagitDelik((0.97 + 0.03 * easeOutCubic(e)) * L.r0, 1 - e));
      });
      const T = 2 * LOGO_MS + v;
      metinGelsin(1, T - METIN_ONCE_MS);
      return T;
    }
    // d1 → d0: r10 (delik daralır) → video → beyaz (300 ms) → logo (300 ms)
    if (from === 1 && to === 0) {
      const L = lombar();
      kagitGoster(1);
      kagitDelik(L.kose);
      const v = oy.gec(0, -1, jest.tur, jest.t, {
        kare: (f, n) => {
          kagitDelik(delikR(n - 1 - f));
          okumaKare(1, f, n, true);
        },
        varis: () => {
          kagitDelik(L.r0);
          tween(LOGO_MS, (e) => kagitDelik(L.r0, e), () => {
            oy.gizle(0);
            delikYaz(kagit, null);
            kok.dataset.metin = "0";
            sonra(LOGO_MS, () => varildi(0));
          });
        },
      });
      okumaYaz(kadrajEl, "");
      return v + 2 * LOGO_MS;
    }
    // d5 → d6: t56 → [DOM kapak, render tonunda, son karenin dikdörtgeninde] 200 ms kesişme → FLIP okuma
    // boyutuna 420 ms + ton eşlemesi (render tonu → gerçek renkler). Yatay kırpımda dikdörtgen ekrandan taşıyorsa
    // DOM kapak da aynı (kırpılmış) konumdan başlar: ekran() kırpım dışını da çevirir.
    if (from === 5 && to === 6) {
      const v = oy.gec(6, 1, jest.tur, jest.t, {
        kare: (f, n) => okumaKare(6, f, n, false),
        varis: () => {
          dYayinla(5, false);
          brosurEl.hidden = false;
          delikYaz(brosurEl, null);
          arkaOpak(1);
          const a = bankoDonusum();
          donusumYaz(a);
          tonYaz(1);
          brosurEl.style.opacity = "0";
          oy.gizle(KESIS_MS);
          tween(KESIS_MS, (e) => (brosurEl.style.opacity = e.toFixed(3)), () => {
            const b = okumaDonusum();
            tween(
              FLIP_MS,
              (e) => {
                donusumYaz(ara(a, b, easeOutCubic(e)));
                tonYaz(1 - e);
              },
              () => varildi(6),
            );
          });
        },
      });
      const T = v + KESIS_MS + FLIP_MS;
      metinGelsin(6, T - METIN_ONCE_MS);
      return T;
    }
    // d6 → d5: FLIP geri 420 ms (gerçek renkler → render tonu) → kesişme 200 ms → r65
    if (from === 6 && to === 5) {
      const a = okumaDonusum();
      const b = bankoDonusum();
      tween(FLIP_MS, (e) => {
        donusumYaz(ara(a, b, easeInOutCubic(e)));
        tonYaz(e);
      });
      const v = oy.gec(5, -1, jest.tur, jest.t, {
        oncesiMs: FLIP_MS + KESIS_MS,
        kare: (f, n) => okumaKare(6, f, n, true),
        varis: () => varildi(5),
      });
      sonra(FLIP_MS, () => {
        oy.onizle(5, -1, KESIS_MS);
        tween(KESIS_MS, (e) => (brosurEl.style.opacity = (1 - e).toFixed(3)), () => {
          brosurEl.hidden = true;
          brosurEl.style.opacity = "1";
          tonYaz(0);
        });
      });
      const T = FLIP_MS + KESIS_MS + v;
      metinGelsin(5, T - METIN_ONCE_MS);
      return T;
    }
    // d6 ↔ d7 ↔ d8 ↔ d9: DOM sayfa çevirme 1,6 s (Brosur v2: d yayını k − 1 → j − 1)
    if (from >= 6 && from <= 9 && to >= 6 && to <= 9) {
      oy.gec(to, dir, jest.tur, jest.t);
      const d0 = from - 1;
      const d1 = to - 1;
      tween(DOM_SAYFA_MS, (e) => dYayinla(d0 + (d1 - d0) * e, e < 1), () => {
        oy.domVaris(to);
        varildi(to);
      });
      metinGelsin(to, DOM_SAYFA_MS - METIN_ONCE_MS);
      return DOM_SAYFA_MS;
    }
    // d9 → d10: broşür dalışı 0,6 s (kâğıt arkada belirir) → fotoğraf → video 200 ms → T01, delik büyür
    if (from === 9 && to === 10) {
      const a = okumaDonusum();
      const b = dalisDonusum();
      const L = lombar();
      brosurKapsam = kapsamOlc(b);
      kagitGoster(0);
      delikYaz(kagit, null);
      kok.dataset.dalis = "1"; // sayfa gölgesi söner: beyazda sayfa kenarı kalmaz (A1-06)
      tween(DALIS_MS, (e) => {
        const ee = easeInOutCubic(e);
        donusumYaz(ara(a, b, ee));
        kagitGoster(Math.min(1, e * 1.6));
        arkaOpak(1 - Math.min(1, e * 2));
      });
      const v = oy.gec(10, 1, jest.tur, jest.t, {
        oncesiMs: DALIS_MS + KESIS_MS,
        kare: (f, n) => {
          kagitDelik(delikR(f));
          okumaKare(10, f, n, false);
        },
        varis: () => {
          brosurEl.hidden = true;
          delikYaz(brosurEl, null);
          arkaOpak(1);
          kagitGoster(null);
          varildi(10);
        },
      });
      sonra(DALIS_MS, () => {
        oy.onizle(10, 1);
        tween(KESIS_MS, (e) => kagitDelik(L.r0, 1 - e));
      });
      const T = DALIS_MS + KESIS_MS + v;
      metinGelsin(10, T - METIN_ONCE_MS);
      return T;
    }
    // d10 → d9: r10 (delik daralır) → video → fotoğraf 200 ms → broşür okuma boyutuna 0,6 s
    if (from === 10 && to === 9) {
      const L = lombar();
      const a = dalisDonusum();
      const b = okumaDonusum();
      brosurKapsam = kapsamOlc(a);
      dYayinla(8, false);
      kok.dataset.dalis = "1";
      brosurEl.hidden = false;
      brosurEl.style.opacity = "1";
      arkaOpak(0);
      donusumYaz(a);
      kagitGoster(1);
      kagitDelik(L.kose);
      const v = oy.gec(9, -1, jest.tur, jest.t, {
        kare: (f, n) => {
          kagitDelik(delikR(n - 1 - f));
          okumaKare(10, f, n, true);
        },
        varis: () => {
          kagitDelik(L.r0);
          tween(KESIS_MS, (e) => kagitDelik(L.r0, e), () => {
            oy.gizle(0);
            delikYaz(brosurEl, null);
            delikYaz(kagit, null);
            delete kok.dataset.dalis; // gölge broşür okuma boyutuna dönerken geri gelir (300 ms)
            tween(DALIS_MS, (e) => {
              donusumYaz(ara(a, b, easeInOutCubic(e)));
              kagitGoster(1 - e);
              arkaOpak(Math.max(0, e * 2 - 1));
            }, () => varildi(9));
          });
        },
      });
      const T = v + KESIS_MS + DALIS_MS;
      metinGelsin(9, T - METIN_ONCE_MS);
      return T;
    }
    // d1 … d5 arası klipli geçişler (ileri ve geri)
    const ters = dir < 0;
    const v = oy.gec(to, dir, jest.tur, jest.t, {
      kare: (f, n) => okumaKare(ters ? from : to, f, n, ters),
      varis: () => varildi(to),
    });
    if (v <= 0) {
      // Beklenmeyen: klip tanımı yok → klipsiz atla.
      oy.atla(to);
      sonra(400, () => varildi(to));
      return 400;
    }
    metinGelsin(to, v - METIN_ONCE_MS);
    return v;
  };

  /* ---------------- kaydırma çapaları ---------------- */
  let duraklar: AdimDurak[] = [];
  const olc = () => {
    const vh = window.innerHeight;
    const maxY = Math.max(0, document.documentElement.scrollHeight - vh);
    duraklar = bolumler.map((b) => ({ start: b.offsetTop, end: b.offsetTop }));
    if (kapanis) {
      const top = Math.min(kapanis.offsetTop, maxY);
      duraklar.push({ start: top, end: Math.max(top, maxY) });
    }
  };
  olc();

  /* ---------------- kiosk (?auto=1) ---------------- */
  // Tur: d0 → … → d10 → kapanış (atıflar görünür; OSM/Copernicus atfı kamusal ekranda zorunlu, denetim A3-01) →
  // beyaza sönüp başa. Ziyaretçi kapanışa inse de 30 s sonra buradan başa döner (A2-03). d4 dinlenmesi dört bölgenin
  // hepsini 3,5 s gösterir (A1-07: dördüncü bölge ilerlemeyle aynı anda düşüyordu).
  let kioskId = 0;
  let kioskDuraklat = false;
  let kioskDevamId = 0;
  const dinlenmeMs = (j: number) => (j === 4 ? 600 + 4 * 3500 : j === 5 ? 600 + 3 * 4500 : j >= 11 ? KIOSK_KAPANIS_MS : 5000);
  const kioskDurdurZaman = () => iptalEt(kioskId);
  const kioskBasaDon = () => {
    perde.style.transition = "opacity 600ms ease";
    perde.style.opacity = "1";
    sonra(620, () => {
      oy.atla(0);
      stepper.atla(0);
      durakKur(0);
      perde.style.opacity = "0";
      kioskPlanla();
    });
  };
  const kioskPlanla = () => {
    if (!kiosk || kioskDuraklat) return;
    iptalEt(kioskId);
    if (k >= 11) {
      // Kapanış ekrandan uzunsa atıflara (sona) yumuşak kaydır.
      const st = duraklar[11];
      if (st && st.end - st.start > 1)
        sonra(1500, () => {
          if (k >= 11 && !kioskDuraklat) window.scrollTo({ top: st.end, behavior: "smooth" });
        });
    }
    kioskId = sonra(dinlenmeMs(k), () => {
      if (faz !== "dur" || kioskDuraklat) return;
      if (k <= 10) {
        if (!stepper.adimAt(1)) kioskPlanla();
        return;
      }
      kioskBasaDon();
    });
  };
  const girdi = () => {
    if (!kiosk) return;
    kioskDuraklat = true;
    iptalEt(kioskId);
    iptalEt(kioskDevamId);
    kioskDevamId = sonra(30000, () => {
      kioskDuraklat = false;
      if (faz === "dur") kioskPlanla();
    });
  };

  /* ---------------- adımlayıcı ---------------- */
  const stepper: Stepper = createStepper({
    stops: () => duraklar,
    viewport: () => window.innerHeight,
    wake: uyandir,
    adim,
    dokunmaBitiste: () => oy.engel,
    yerles: (i) => {
      // Tarayıcının kendi kaydırması (kaydırma çubuğu, bul, Home/End, odak): klipsiz o durağa.
      if (faz !== "dur" || i === k) return;
      if (i >= 11) {
        okumaYaz(kadrajEl, "");
        spotDurdur();
        kapanisKur();
        kioskPlanla();
        return;
      }
      oy.atla(i);
      durakKur(i);
      kioskPlanla();
    },
    girdi,
    simdiki: () => (faz === "dur" ? k : null),
  });

  /* ---------------- başlangıç ---------------- */
  // Geri yüklenen kaydırma konumu: en yakın durak.
  const y0 = window.scrollY;
  let k0 = 0;
  duraklar.forEach((s, i) => {
    if (Math.abs(s.start - y0) < Math.abs(duraklar[k0].start - y0)) k0 = i;
  });
  if (k0 >= 11) {
    kapanisKur();
    kioskPlanla();
  } else {
    stepper.atla(k0);
    oy.basla(k0);
    durakKur(k0);
    kioskPlanla();
  }

  /* ---------------- ölçü değişimi ---------------- */
  // Geçiş sürerken gelen döndürme (yön/set değişimi) varışta uygulanır: boyutDegis geçişin zamanlayıcılarını
  // silip varışı düşürüyordu; kodekSec çözülmeden jest gelirse de set değiştirilmez (denetim A2-04).
  let olcId = 0;
  let olcBekliyor = false;
  const yonBak = (): Boyut => (sahne.clientWidth >= (sahne.clientHeight * 4) / 3 ? "yatay" : "dikey");
  function yenidenOlc() {
    iptalEt(olcId);
    olcId = sonra(120, () => {
      olc();
      stepper.remeasured();
      const yeni = yonBak();
      if (faz !== "dur") {
        olcBekliyor = true;
        return;
      }
      olcBekliyor = false;
      if (yeni !== boyut) {
        void kodekSec(m, yeni, q.get("kodek")).then((kd) => {
          if (faz !== "dur" || oy.durum === "gecis") {
            olcBekliyor = true;
            return;
          }
          if (yonBak() !== yeni || boyut === yeni) return;
          boyut = yeni;
          oy.boyutDegis(yeni, kd);
          kodek = oy.kodek;
          if (k <= 10) durakKur(k);
        });
      } else if (k >= 6 && k <= 9) donusumYaz(okumaDonusum());
    });
  }
  window.addEventListener("resize", yenidenOlc);
  const ro = new ResizeObserver(yenidenOlc);
  ro.observe(document.body);

  /* ---------------- ölçüm kancası ---------------- */
  const w = window as unknown as { __icinden3?: unknown };
  w.__icinden3 = {
    oy,
    olaylar,
    durak: () => k,
    faz: () => faz,
    boyut: () => boyut,
    kodek: () => kodek,
    posterKipi: () => posterKipi,
    stops: () => duraklar,
    kiosk: () => ({ aktif: kiosk, duraklat: kioskDuraklat }),
    kayitlar: () => oy.olaylar.map((x: Kayit) => ({ ...x })),
    // Dikiş ölçümü (W-B2): lombar/broşür geometrisi ve d6 kesişmesinin DOM yarısı (kapak banko dikdörtgeninde,
    // render tonunda t). Durumu değiştirir; yalnız ölçüm betiği çağırır.
    geometri: () => ({ lombar: lombar(), banko: bankoDonusum(), okuma: okumaDonusum(), dalis: dalisDonusum(), geo: geo() }),
    kapakKes: (t: number) => {
      dYayinla(5, false);
      brosurEl.hidden = false;
      delikYaz(brosurEl, null);
      arkaOpak(1);
      donusumYaz(bankoDonusum());
      tonYaz(t);
      brosurEl.style.opacity = "1";
    },
  };

  return () => {
    for (const z of zamanlar) window.clearTimeout(z);
    zamanlar.clear();
    if (rafId) cancelAnimationFrame(rafId);
    aralar.clear();
    stepper.destroy();
    oy.yokEt();
    dSifirla();
    window.removeEventListener("resize", yenidenOlc);
    ro.disconnect();
    delete w.__icinden3;
  };
}
