"use client";

/*
 * /icinden sabit sahnesi + çalışma zamanı (docs/brief-icinden.md §2–§3; K2 spike.js "ÇALIŞMA ZAMANI").
 *
 * - Belge native kayar; rAF her karede scrollY'yi YALNIZCA OKUR, d bölüm tablosundan (offsetTop).
 * - CSS snap YOK (html satır içi "none", cleanup'ta geri). Durak mıknatısı = YÖNLÜ JS yerleşme:
 *   220 ms sessizlik + parmak kalkık → tek okuma → son hareket yönündeki durağa 0,2·H'den yakınsa tek
 *   scrollTo({behavior: "smooth"}) + 700 ms koruma. rAF içinde scrollTo yok (kiosk hariç: o kendi
 *   pos'unu yazar ve scrollY'yi geri okumaz — WebKit eşzamansız kaydırma, brief-dunya-apple §1).
 * - Katmanlar: 1000 px kutu, translate+scale, opacity, visibility; değişmeyen string yazılmaz.
 * - cobe: canvas katmanların KARDEŞİ; kendi rAF döngüsü kapalı, aynı karede bu döngüden çizilir
 *   (GL ve DOM aynı d'yi gösterir; DunyaScene "drawn" kalıbının eşdeğeri, gecikmesiz).
 * - Reduced motion: scrub yok, sahne floor(d + 0,15) durağının dinlenme kadrajı, canlılık/yerleşme yok.
 * - Kiosk ?auto=1: kendi d'sini sürer (~2,2 s/100svh geçiş, durakta 5 s, d4'te 600 + 3×4.500 ms),
 *   sonda beyaza söner ve başa döner; kullanıcı girdisinde durur, 30 s sonra en yakın duraktan sürer.
 * - Kapanış görünür olunca küre DONAR (çizim + canlılık durur, döngü uyur); tuval görünür kalır, kapanış
 *   onu üstten örter (brief §1 "cobe durur"). WebGL bağlamı kaybolursa (iOS arka plan/bellek baskısı)
 *   CSS yedek diske düşülür, bağlam geri gelince küre yeniden kurulur.
 * - Katman İÇERİKLERİ sunucu bileşeni olarak `katmanlar` prop'uyla gelir (IcindenIcerik): harita, logo,
 *   stant ve rotunda verisi istemci paketine girmez; bu dosya yalnız katman kabuklarını ve motoru taşır.
 */

import createGlobe from "cobe";
import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  KATMANLAR,
  MODEL,
  N_DURAK,
  NOMINAL,
  PLATO,
  clamp,
  dHam,
  dHesapla,
  dSifirla,
  dYayinla,
  kadrajOkuma,
  pencere,
  rampa,
  sahneDurumu,
  yHesapla,
  type Geo,
  type KatmanId,
  type SahneDurumu,
} from "./derinlik";
import Katman from "./Katman";
import { KUREGL } from "./kure-gl";
import "./icinden-sahne.css";

type Props = {
  /**
   * Katman içerikleri: <Katman id="…"> elemanları (IcindenIcerik; sunucu ya da istemci bileşeni).
   * Her id'nin children'ı o katman kabuğunun TÜM içeriğidir (logo, harita, stant, rotunda, broşür, küre).
   */
  katmanlar?: ReactNode;
  /** Akış: 10 × <section data-durak="k"> + kapanış (A). */
  children?: ReactNode;
};

const KATMAN_ID = new Set<string>(KATMANLAR.map((k) => k.id));

/** A'nın Katman elemanlarından id → children haritası (Fragment'lerin içine de bakar). */
function ekIcerik(
  node: ReactNode,
  out: Partial<Record<KatmanId, ReactNode>> = {},
) {
  Children.forEach(node, (el) => {
    if (!isValidElement(el)) return;
    const p = (el as ReactElement<{ id?: unknown; children?: ReactNode }>)
      .props;
    if (el.type === Fragment) ekIcerik(p.children, out);
    else if (typeof p.id === "string" && KATMAN_ID.has(p.id))
      out[p.id as KatmanId] = p.children;
  });
  return out;
}

/** Bölüm başına spot döngüsü (data-spot): durak → [katman, adet, süre ms]. */
const SPOT: Partial<Record<number, readonly [KatmanId, number, number]>> = {
  3: ["stant", 4, 3500],
  4: ["rotunda", 12, 4500],
};
const SPOT_GECIKME = 600;
const CANLI_GECIKME = 400;
const YERLES_SESSIZ = 220;
const YERLES_KORUMA = 700;
const YERLES_PAY = 0.2;
const KIOSK_GIT_100SVH = 2200;
const KIOSK_PERDE = 600;
const kioskBekle = (k: number) => (k === 4 ? 600 + 3 * 4500 : 5000);
const easeIO = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x);

type Son = { tr: string; op: string; vis: string; wc: string };
type Ara = {
  el: HTMLElement;
  tip: "d" | "r";
  /** Giriş rampası a → b (a > b ise söner). */
  a: number;
  b: number;
  /** İsteğe bağlı çıkış rampası c → e (dört sayılı biçim "a b c e"). */
  c: number;
  e: number;
  katman: number;
  son: string;
};

export default function IcindenSahne({ katmanlar, children }: Props) {
  const sahneRef = useRef<HTMLDivElement>(null);
  const akisRef = useRef<HTMLDivElement>(null);
  const tuvalRef = useRef<HTMLCanvasElement>(null);
  const kadrajRef = useRef<HTMLDivElement>(null);
  const perdeRef = useRef<HTMLDivElement>(null);
  const olcuRef = useRef<HTMLDivElement>(null);
  const ek = ekIcerik(katmanlar);

  useEffect(() => {
    const sahne = sahneRef.current;
    const akis = akisRef.current;
    const tuval = tuvalRef.current;
    const kadrajEl = kadrajRef.current;
    const perdeEl = perdeRef.current;
    const olcuEl = olcuRef.current;
    if (!sahne || !akis || !tuval || !kadrajEl || !perdeEl || !olcuEl) return;
    const html = document.documentElement;
    const dev = process.env.NODE_ENV !== "production";
    const M = MODEL;
    const N = N_DURAK;
    const els = KATMANLAR.map((k) =>
      sahne.querySelector<HTMLElement>(`:scope > [data-katman="${k.id}"]`)!,
    );
    const son: Son[] = els.map(() => ({ tr: "", op: "", vis: "", wc: "" }));
    els.forEach((el, i) => {
      el.style.zIndex = String(2 * M.W[i].derinlik + 2);
      el.style.visibility = "hidden";
      son[i].vis = "hidden";
    });

    /* ---------------- tercihler ---------------- */
    const rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = rmq.matches;
    const Q = new URLSearchParams(window.location.search);
    const KIOSK = Q.get("auto") === "1";
    const eskiSnap = html.style.scrollSnapType;
    html.style.scrollSnapType = "none";

    /* ---------------- ölçü ---------------- */
    let g: Geo = { vw: 1, H: 1, L: 1 };
    let topler: number[] = [];
    const belgeTop = (el: HTMLElement) => {
      let t = 0;
      for (
        let e: HTMLElement | null = el;
        e;
        e = e.offsetParent as HTMLElement | null
      )
        t += e.offsetTop;
      return t;
    };
    function olc() {
      const H = olcuEl!.offsetHeight || window.innerHeight;
      g = {
        vw: html.clientWidth || window.innerWidth,
        H,
        L: sahne!.clientHeight || H,
      };
      const secs = Array.from(
        akis!.querySelectorAll<HTMLElement>("section[data-durak]"),
      )
        .map((el) => ({ el, k: Number(el.dataset.durak) }))
        .filter((s) => Number.isInteger(s.k) && s.k >= 0 && s.k <= N)
        .sort((a, b) => a.k - b.k);
      if (secs.length === N + 1) {
        topler = secs.map((s) => belgeTop(s.el));
        const sonEl = secs[N].el;
        topler.push(topler[N] + sonEl.offsetHeight);
      } else {
        // A'nın bölümleri yokken (iskelet): bölüm tablosundan sentetik.
        topler = [0];
        const svh = [100, 220, 160, 120, 120, 100, 100, 100, 160, 100];
        for (const h of svh)
          topler.push(topler[topler.length - 1] + (h / 100) * H);
      }
      araTopla();
    }

    /* ---------------- d'ye bağlı katman içi opaklıklar (data-ic-d / data-ic-r) ---------------- */
    let aralar: Ara[] = [];
    function araTopla() {
      const yeni: Ara[] = [];
      for (const el of sahne!.querySelectorAll<HTMLElement>(
        "[data-ic-d], [data-ic-r]",
      )) {
        const tip = el.hasAttribute("data-ic-d") ? "d" : "r";
        const sayilar = (
          el.getAttribute(tip === "d" ? "data-ic-d" : "data-ic-r") ?? ""
        )
          .trim()
          .split(/\s+/)
          .map(Number);
        const [a, b] = sayilar;
        // "a b c e": a→b girer, c→e söner. "a b": tek rampa (c = e = ∞, çıkış yok).
        const [c, e] =
          sayilar.length >= 4 ? [sayilar[2], sayilar[3]] : [Infinity, Infinity];
        if (![a, b, c, e].every((v) => !Number.isNaN(v))) continue;
        const kEl = el.closest<HTMLElement>("[data-katman]");
        const katman = kEl
          ? KATMANLAR.findIndex((k) => k.id === kEl.dataset.katman)
          : -1;
        const eski = aralar.find((x) => x.el === el);
        yeni.push({ el, tip, a, b, c, e, katman, son: eski?.son ?? "" });
      }
      aralar = yeni;
    }

    /* ---------------- cobe ---------------- */
    const narrow = window.innerWidth < 500;
    const glDpr = Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 2);
    const glDurum = {
      phi: KUREGL.phi,
      theta: KUREGL.theta,
      scale: 1,
      offset: [0, 0] as [number, number],
      markers: [] as { location: [number, number]; size: number }[],
    };
    type Globe = ReturnType<typeof createGlobe>;
    let globe: Globe | null = null;
    let inst: { onRender?: (i: unknown) => void } | null = null;
    let glAcik = false;
    /**
     * Kurulum bir görev ertelenir: StrictMode/Activity'nin anında kur-sök döngüsünde küre hiç
     * kurulmaz (aksi hâlde sökülen kürenin geç gelen doku onload'ı silinmiş programla hata atıyor).
     */
    const kureKur = () => {
      try {
        globe = createGlobe(tuval, {
          devicePixelRatio: glDpr,
          width: Math.max(1, Math.round(tuval.clientWidth * glDpr)),
          height: Math.max(1, Math.round(tuval.clientHeight * glDpr)),
          phi: glDurum.phi,
          theta: glDurum.theta,
          scale: 1,
          dark: 0,
          diffuse: 1.2,
          mapSamples: narrow ? 14_000 : 36_000,
          mapBrightness: KUREGL.mapBrightness,
          baseColor: KUREGL.base,
          markerColor: KUREGL.orange,
          glowColor: KUREGL.glow,
          offset: [0, 0],
          markers: [],
          onRender: (st) => {
            st.phi = glDurum.phi;
            st.theta = glDurum.theta;
            st.scale = glDurum.scale;
            st.offset = glDurum.offset;
            st.markers = glDurum.markers;
            st.width = tuval.width;
            st.height = tuval.height;
          },
        });
        // Kendi döngüsü kapalı; kareyi bu döngü çizer (glCiz). Phenomenon iç yapısı yoksa toggle'a düşer.
        globe.toggle(false);
        const m = (
          globe as unknown as {
            instances?: Map<string, { onRender?: (i: unknown) => void }>;
          }
        ).instances;
        inst = m?.get("") ?? null;
        sahne.removeAttribute("data-gl");
      } catch {
        globe = null;
        sahne.dataset.gl = "yok";
      }
    };
    /**
     * Küreyi bırakır. phenomenon'un window "resize" dinleyicisi kaldırılamıyor (() => this.resize());
     * örneğin resize'ı boşa çıkarılır: eski örnek artık tuvale yazmaz, sızıntı iş yapmaz (Activity
     * dönüşlerinde birikmesin). Bağlam kaybında GL çağrıları zaten etkisizdir; destroy try içinde.
     */
    function kureBirak() {
      if (!globe) return;
      const g0 = globe as unknown as { resize?: () => void };
      g0.resize = () => {};
      try {
        globe.destroy();
      } catch {
        /* bağlam kayıp: yok say */
      }
      globe = null;
      inst = null;
      glAcik = false;
    }
    const kurZ = window.setTimeout(() => {
      if (!canli) return;
      kureKur();
      sonGl = "";
      zorla = true;
      uyan();
    }, 0);
    function glCiz() {
      if (!globe) return;
      if (inst?.onRender) {
        inst.onRender(inst); // durum → uniform (cobe'nin sarmalayıcısı)
        (globe as unknown as { render: () => void }).render(); // tek kare, döngü kapalı
      } else if (!glAcik) {
        glAcik = true;
        globe.toggle(true);
      }
    }
    // cobe'nin harita dokusu eşzamansız yüklenir; döngü kapalı olduğundan birkaç kez yeniden çiz.
    let dokuZ: number[] = [];
    function dokuPlanla() {
      dokuZ.forEach((z) => window.clearTimeout(z));
      dokuZ = [250, 800, 2000].map((ms) =>
        window.setTimeout(() => {
          sonGl = "";
          zorla = true;
          uyan();
        }, ms),
      );
    }
    dokuPlanla();
    /*
     * WebGL bağlam kaybı (iOS arka plana alma, bellek baskısı): preventDefault edilmezse tarayıcı
     * bağlamı geri VERMEZ ve küre kalıcı olarak kaybolur. Kayıpta CSS yedek diske düşülür
     * ([data-gl="yok"]); bağlam geri gelince küre aynı tuvalde yeniden kurulur.
     */
    const baglamKayip = (e: Event) => {
      e.preventDefault();
      kureBirak();
      sahne.dataset.gl = "yok";
      sonGl = "";
      zorla = true;
      uyan();
    };
    const baglamGeri = () => {
      if (!canli) return;
      kureBirak();
      kureKur();
      sonGl = "";
      zorla = true;
      uyan();
      dokuPlanla();
    };
    tuval.addEventListener("webglcontextlost", baglamKayip);
    tuval.addEventListener("webglcontextrestored", baglamGeri);
    function glDur() {
      if (globe && glAcik) {
        glAcik = false;
        globe.toggle(false);
      }
    }

    /* ---------------- yazım ---------------- */
    let sonZemin = "";
    let sonKadraj = "";
    let sonKadrajOp = "";
    let sonTuvalOp = "";
    let sonTuvalZ = "";
    let sonTuvalVis = "";
    let sonDinlenme = "";
    let sonSahneVis = "";
    /** Son çizimde kapanış ekranda mıydı (küre donuk, canlılık döngüsü uyur). */
    let sonKapanis = false;
    const sonSpot = new Map<number, string>();
    let hareketli = false;
    let sonD = -1;
    let sonDham = 0;
    let sonGl = "";
    const kayit: [number, number, number, number, number][] = [];

    function katmanYaz(i: number, st: SahneDurumu["katmanlar"][number], isit = false) {
      const c = son[i];
      const el = els[i];
      // Isınma: durakta dururken, kaydırma başlar başlamaz görünecek komşu katmanlar ~0 opaklıkla
      // önceden raster edilir (ilk görünme karesindeki raster takılması dinlenmeye kayar).
      if (isit && !st.gorunur) st = { ...st, gorunur: true, alfa: 0.003 };
      const vis = st.gorunur ? "visible" : "hidden";
      if (vis !== c.vis) {
        el.style.visibility = vis;
        c.vis = vis;
      }
      const wc = st.gorunur ? "transform" : "auto";
      if (wc !== c.wc) {
        el.style.willChange = wc;
        c.wc = wc;
      }
      if (!st.gorunur) return;
      const tr = `translate(${st.x.toFixed(2)}px,${st.y.toFixed(2)}px) scale(${st.s.toFixed(5)})`;
      if (tr !== c.tr) {
        el.style.transform = tr;
        c.tr = tr;
      }
      const op = st.alfa >= 0.998 ? "1" : st.alfa.toFixed(3);
      if (op !== c.op) {
        el.style.opacity = op;
        c.op = op;
      }
    }
    function spotYaz(i: number, v: string) {
      if (sonSpot.get(i) === v) return;
      sonSpot.set(i, v);
      els[i].setAttribute("data-spot", v);
    }

    /* ---------------- canlılık saati (yalnız dinlenmede ilerler) ---------------- */
    let canliT = 0;
    let canliOnce = 0;
    let dinlenmeBas = 0;
    let dinlenmeK = -1;
    let spotZ = 0;
    let gizli = document.hidden;

    let sonKaydirma = -1e9;
    let kTur = 0;

    /* ---------------- çizim ---------------- */
    function ciz(dGercek: number, y: number, simdi: number) {
      const t0 = performance.now();
      let d = dGercek;
      if (reduced) d = Math.min(N, Math.floor(d + 0.15));
      const S = sahneDurumu(M, d, g);
      // Kapanış görünür mü (son bölümün sonu ekranın altına girdi): küre donar, canlılık durur.
      const kapanisTop = topler[N + 1] ?? Infinity;
      const kapanisGorunur = !kiosk.aktif && y + g.H > kapanisTop + 1;
      sonKapanis = kapanisGorunur;
      const kDurak = Math.round(d);
      const durakta = !hareketli && Math.abs(d - kDurak) < 1e-3 && !reduced;
      for (let i = 0; i < els.length; i++) {
        let isit = false;
        if (durakta && !S.katmanlar[i].gorunur) {
          const yakin = (M.yollar[kDurak]?.has(i) ?? false) || (M.yollar[kDurak - 1]?.has(i) ?? false);
          isit = yakin && pencere(S.katmanlar[i].r) > 0;
        }
        katmanYaz(i, S.katmanlar[i], isit);
      }

      // Dinlenme / canlılık
      const k = Math.round(d);
      const uzak = Math.abs(d - k);
      const sakin =
        !hareketli &&
        simdi - sonKaydirma >= CANLI_GECIKME &&
        !gizli &&
        !reduced;
      const kioskGeciste = kiosk.aktif && kiosk.faz !== "bekle";
      const dinleniyor = sakin && uzak <= PLATO && !kioskGeciste && !kapanisGorunur;
      if (dinleniyor) {
        if (dinlenmeK !== k) {
          dinlenmeK = k;
          dinlenmeBas = simdi;
        }
        if (canliOnce > 0) canliT += Math.min(100, simdi - canliOnce);
        canliOnce = simdi;
      } else {
        dinlenmeK = -1;
        canliOnce = 0;
      }
      const dinlenme = dinleniyor ? String(k) : "-";
      if (dinlenme !== sonDinlenme) {
        sahne!.setAttribute("data-dinlenme", dinlenme);
        sonDinlenme = dinlenme;
      }
      // Ofset genliği: geçişin ilk %15'inde 0'a sönümlenir (saat kaydırmada durur → sıçrama yok).
      const genlik = reduced ? 0 : 1 - rampa(uzak, 0, 0.15);

      // Spot döngüsü (data-spot): dinlenmeden 600 ms sonra; geçişte ve reduced'da 0.
      for (const [kk, sp] of Object.entries(SPOT)) {
        if (!sp) continue;
        const i = M.idx.get(sp[0])!;
        let v = "0";
        if (
          dinleniyor &&
          k === Number(kk) &&
          simdi - dinlenmeBas >= SPOT_GECIKME
        ) {
          const n = Math.floor((simdi - dinlenmeBas - SPOT_GECIKME) / sp[2]);
          v = String(1 + ((n + (KIOSK ? kTur * 3 : 0)) % sp[1]));
        }
        spotYaz(i, v);
      }

      // Katman içi d/r'ye bağlı opaklıklar
      for (const a of aralar) {
        let v: number;
        if (a.tip === "d") {
          v = rampa(d, a.a, a.b);
          if (a.c !== Infinity) v *= 1 - rampa(d, a.c, a.e);
        } else {
          const r = a.katman >= 0 ? S.katmanlar[a.katman].r : 1;
          const lr = Math.log(r);
          v = rampa(lr, Math.log(a.a), Math.log(a.b));
          if (a.c !== Infinity) v *= 1 - rampa(lr, Math.log(a.c), Math.log(a.e));
        }
        const s = v >= 0.998 ? "1" : v <= 0.002 ? "0" : v.toFixed(3);
        if (s !== a.son) {
          a.el.style.opacity = s;
          a.son = s;
        }
      }

      // Zemin
      const z = `rgb(${S.zemin[0]},${S.zemin[1]},${S.zemin[2]})`;
      if (z !== sonZemin) {
        sahne!.style.backgroundColor = z;
        sonZemin = z;
      }

      // Sahne yalnız kapanış ekranı tamamen örtünce gizlenir (o zamana dek kapanış üstten kayar).
      const sahneVis = !kiosk.aktif && y >= kapanisTop ? "hidden" : "visible";
      if (sahneVis !== sonSahneVis) {
        sahne!.style.visibility = sahneVis;
        sonSahneVis = sahneVis;
      }

      // cobe. Kapanış görünürken tuval GÖRÜNÜR kalır, yalnız yeniden çizilmez (canlılık saati durduğu
      // için imza değişmez → son kare donar). İlk kez kapanışta açılırsa (geri yüklenen konum) bir kez çizer.
      // Kapanış ekranı tamamen örtünce (sahne gizli) tuval de gizlenir: satır içi "visible" ebeveynin
      // visibility:hidden'ını ezer, GL katmanı boşuna birleştirilmesin.
      let glIstek = false;
      if (globe && S.kure >= 0 && sahneVis === "visible") {
        const i = S.kure;
        const st = S.katmanlar[i];
        const cw = tuval!.clientWidth || g.vw;
        const ch = tuval!.clientHeight || g.L;
        const p = tuval!.width / Math.max(1, cw);
        const C = (NOMINAL * st.s) / (0.8 * ch);
        const cx = st.x + 500 * st.s;
        const cy = st.y + 500 * st.s;
        const ikinci = KATMANLAR[i].id === "kure2";
        let phiOfs = 0;
        let nabiz = 0;
        if (genlik > 0) {
          if (k === 1) {
            phiOfs =
              ((4 * Math.PI) / 180) *
              Math.sin((2 * Math.PI * canliT) / 12000) *
              genlik;
            nabiz =
              (0.5 - 0.5 * Math.cos((2 * Math.PI * canliT) / 2400)) * genlik;
          } else if (k === N) {
            let a = ((2 * Math.PI * canliT) / 40000) % (2 * Math.PI);
            if (a > Math.PI) a -= 2 * Math.PI;
            phiOfs = a * genlik;
          }
        }
        glDurum.phi = KUREGL.phi + phiOfs;
        glDurum.theta = KUREGL.theta;
        glDurum.scale = C;
        glDurum.offset = [
          (2 * p * (cx - cw / 2)) / C,
          (2 * p * (cy - ch / 2)) / C,
        ];
        const isaret = ikinci
          ? 0.045
          : 0.05 * (1 + 0.55 * nabiz) * (1 - rampa(C, 1.1, 2.2));
        glDurum.markers =
          isaret > 0.002 ? [{ location: KUREGL.expo, size: isaret }] : [];
        const imza = `${glDurum.phi.toFixed(5)}|${C.toFixed(5)}|${glDurum.offset[0].toFixed(2)}|${glDurum.offset[1].toFixed(2)}|${isaret.toFixed(4)}|${tuval!.width}x${tuval!.height}`;
        if (imza !== sonGl) {
          sonGl = imza;
          glIstek = true;
        }
        const op = st.alfa >= 0.998 ? "1" : st.alfa.toFixed(3);
        if (op !== sonTuvalOp) {
          tuval!.style.opacity = op;
          sonTuvalOp = op;
        }
        const zi = String(2 * M.W[i].derinlik + 1);
        if (zi !== sonTuvalZ) {
          tuval!.style.zIndex = zi;
          sonTuvalZ = zi;
        }
        if (sonTuvalVis !== "visible") {
          tuval!.style.visibility = "visible";
          sonTuvalVis = "visible";
        }
      } else {
        if (sonTuvalVis !== "hidden") {
          tuval!.style.visibility = "hidden";
          sonTuvalVis = "hidden";
          sonGl = "";
        }
        glDur();
      }
      if (glIstek) glCiz();

      // Kadraj genişliği okuması
      const okuma = kadrajOkuma(M, S, g);
      if (okuma !== sonKadraj) {
        kadrajEl!.textContent = okuma;
        sonKadraj = okuma;
      }
      const kop = kapanisGorunur ? 0 : rampa(d, 0.3, 0.7);
      const kops = kop >= 0.998 ? "1" : kop.toFixed(3);
      if (kops !== sonKadrajOp) {
        kadrajEl!.style.opacity = kops;
        sonKadrajOp = kops;
      }

      dYayinla(d, hareketli);
      sonD = d;
      // Ölçüm kaydı yalnız geliştirmede (dev kancası); üretimde bellek/GC yükü olmasın.
      if (dev) {
        const ms = performance.now() - t0;
        kayit.push([
          +t0.toFixed(1),
          +y.toFixed(1),
          +d.toFixed(5),
          +ms.toFixed(3),
          S.gorunurSay,
        ]);
        if (kayit.length > 20000) kayit.splice(0, 5000);
      }
      return { dinleniyor, k, genlik, kure: S.kure };
    }

    /* ---------------- rAF döngüsü: kaydırma uyandırır, boşta uyur ---------------- */
    let raf = 0;
    let canli = true;
    let sonY = NaN;
    let bos = 0;
    let zorla = true;
    function uyan() {
      if (!raf && canli && !gizli) raf = requestAnimationFrame(kare);
    }
    function kare() {
      raf = 0;
      if (!canli) return;
      const simdi = performance.now();
      let y: number;
      let d: number;
      if (kiosk.aktif) {
        d = kiosk.dPos;
        y = yHesapla(d, topler, g.H);
      } else {
        y = window.scrollY;
        d = dHesapla(y, topler);
      }
      sonDham = kiosk.aktif ? d : dHam(y, topler, g.H);
      const h = simdi - sonKaydirma < 180;
      // Canlılık kare kare yalnız küre duraklarında (cobe salınımı/nabız/dönüş); spotlar zamanlayıcıyla.
      // Kapanış görünürken küre donuk: döngü 30 boş kareden sonra uyur.
      const canliKare =
        !reduced &&
        !h &&
        sonD >= 0 &&
        !sonKapanis &&
        (Math.abs(sonD - 1) < 0.15 || Math.abs(sonD - N) < 0.15);
      if (zorla || y !== sonY || h !== hareketli || canliKare || kiosk.aktif) {
        const once = zorla || y !== sonY || h !== hareketli;
        hareketli = h;
        zorla = false;
        const r = ciz(d, y, simdi);
        sonY = y;
        if (once) bos = 0;
        else bos++;
        // Dinlenmeye geçiş/ spot zamanlayıcısı
        planla(r.dinleniyor, r.k, simdi);
      } else bos++;
      const devam = kiosk.aktif || bos < 30 || canliKare;
      if (devam) raf = requestAnimationFrame(kare);
    }
    /** Dinlenme başlangıcı (400 ms) ve spot değişimleri için döngüyü zamanında uyandır. */
    function planla(dinleniyor: boolean, k: number, simdi: number) {
      window.clearTimeout(spotZ);
      let bekle = -1;
      if (!dinleniyor && !reduced) {
        const kalan = CANLI_GECIKME - (simdi - sonKaydirma);
        if (kalan > 0) bekle = kalan + 20;
      } else if (dinleniyor) {
        const sp = SPOT[k];
        if (sp) {
          const gecen = simdi - dinlenmeBas - SPOT_GECIKME;
          bekle = gecen < 0 ? -gecen + 10 : sp[2] - (gecen % sp[2]) + 10;
        }
      }
      if (bekle > 0)
        spotZ = window.setTimeout(() => {
          zorla = true;
          uyan();
        }, bekle);
    }

    /* ---------------- yönlü yerleşme ---------------- */
    let yon = 0;
    let yonY = NaN;
    let yerlesZ = 0;
    let dokunuyor = false;
    let yerlesBitis = 0;
    function yerlesPlanla(ms: number) {
      window.clearTimeout(yerlesZ);
      yerlesZ = window.setTimeout(yerles, ms);
    }
    function yerles() {
      if (dokunuyor || reduced || kiosk.aktif || !canli) return; // touchend yeniden planlar
      if (performance.now() < yerlesBitis) return; // kendi smooth kaydırmamız sürüyor
      if (!yon) return;
      const y = window.scrollY; // 220 ms sessizlikten sonra TEK okuma
      const d = dHesapla(y, topler);
      const k = yon > 0 ? Math.ceil(d - 1e-6) : Math.floor(d + 1e-6);
      if (k < 0 || k > N) return;
      const hedef = topler[k];
      const fark = hedef - y;
      // Yalnız hareket yönündeki durağa: kullanıcı geldiği durağa ASLA geri çekilmez.
      if (
        Math.abs(fark) < 1 ||
        Math.abs(fark) > YERLES_PAY * g.H ||
        Math.sign(fark) !== yon
      )
        return;
      yerlesBitis = performance.now() + YERLES_KORUMA;
      window.scrollTo({ top: hedef, behavior: "smooth" });
    }
    function kaydirmaOldu() {
      const simdi = performance.now();
      sonKaydirma = simdi;
      const y = window.scrollY;
      if (!(Math.abs(y - yonY) < 0.5)) {
        if (yonY === yonY && simdi >= yerlesBitis) yon = Math.sign(y - yonY);
        yonY = y;
      }
      uyan();
      if (!kiosk.aktif) yerlesPlanla(YERLES_SESSIZ);
    }
    const dokunmaBasladi = () => {
      dokunuyor = true;
      window.clearTimeout(yerlesZ);
    };
    const dokunmaBitti = () => {
      dokunuyor = false;
      yerlesPlanla(YERLES_SESSIZ);
    };

    /* ---------------- kiosk (?auto=1): kendi d'sini yazar, scrollY'yi geri okumaz ---------------- */
    const kiosk = {
      aktif: false,
      dPos: 0,
      faz: "bekle" as "bekle" | "git" | "sonen" | "acilan",
      k: 0,
      t0: 0,
      sure: 0,
      raf: 0,
    };
    let kioskDevamZ = 0;
    let sonPerde = "";
    function perdeYaz(v: number) {
      const s = v <= 0.002 ? "0" : v >= 0.998 ? "1" : v.toFixed(3);
      if (s !== sonPerde) {
        perdeEl!.style.opacity = s;
        sonPerde = s;
      }
    }
    function kioskBaslat(k: number) {
      kiosk.aktif = true;
      kiosk.k = clamp(k, 0, N);
      kiosk.dPos = kiosk.k;
      kiosk.faz = "bekle";
      kiosk.t0 = performance.now();
      kiosk.sure = kioskBekle(kiosk.k);
      window.scrollTo(0, Math.round(yHesapla(kiosk.dPos, topler, g.H)));
      if (!kiosk.raf) kiosk.raf = requestAnimationFrame(kioskKare);
      zorla = true;
      uyan();
    }
    function kioskKare() {
      kiosk.raf = 0;
      if (!kiosk.aktif || !canli) return;
      const K = kiosk;
      const simdi = performance.now();
      const t = simdi - K.t0;
      if (K.faz === "bekle") {
        if (t >= K.sure) {
          K.t0 = simdi;
          if (K.k >= N) {
            K.faz = "sonen";
            K.sure = KIOSK_PERDE;
          } else {
            K.faz = "git";
            const h = (topler[K.k + 1] - topler[K.k]) / Math.max(1, g.H);
            K.sure = reduced ? 0 : KIOSK_GIT_100SVH * h;
          }
        }
      } else if (K.faz === "git") {
        const x = K.sure > 0 ? clamp(t / K.sure, 0, 1) : 1;
        K.dPos = K.k + easeIO(x);
        window.scrollTo(0, Math.round(yHesapla(K.dPos, topler, g.H)));
        if (x >= 1) {
          K.k += 1;
          K.dPos = K.k;
          K.faz = "bekle";
          K.t0 = simdi;
          K.sure = kioskBekle(K.k);
        }
      } else if (K.faz === "sonen") {
        perdeYaz(clamp(t / KIOSK_PERDE, 0, 1));
        if (t >= KIOSK_PERDE) {
          K.k = 0;
          K.dPos = 0;
          kTur++;
          window.scrollTo(0, 0);
          K.faz = "acilan";
          K.t0 = simdi;
          zorla = true;
        }
      } else {
        perdeYaz(1 - clamp(t / KIOSK_PERDE, 0, 1));
        if (t >= KIOSK_PERDE) {
          K.faz = "bekle";
          K.t0 = simdi;
          K.sure = kioskBekle(0);
        }
      }
      K.raf = requestAnimationFrame(kioskKare);
    }
    function kioskDurdur() {
      if (!KIOSK) return;
      if (kiosk.aktif) {
        kiosk.aktif = false;
        perdeYaz(0);
        zorla = true;
        uyan();
      }
      window.clearTimeout(kioskDevamZ);
      // 30 sn dokunulmazsa en yakın duraktan sürer (30 sn sonra tek okuma güvenli).
      kioskDevamZ = window.setTimeout(() => {
        if (canli) kioskBaslat(Math.round(dHesapla(window.scrollY, topler)));
      }, 30000);
    }
    const KIOSK_OLAY = [
      "wheel",
      "touchstart",
      "keydown",
      "pointerdown",
    ] as const;

    /* ---------------- yeniden ölçüm ---------------- */
    // Sıra önemli: resize olayı rAF'tan ÖNCE, ResizeObserver SONRA koşar. Yalnız RO'ya güvenilirse
    // o karedeki çizim eski topler + yeni konumla d'yi hesaplayıp çapayı kirletir (spike: 6 → 5,403).
    function yenidenOlc() {
      const eskiT = topler;
      const eskiVw = g.vw;
      const capaD = sonDham;
      olc();
      const degisti =
        eskiT.length === topler.length &&
        eskiT.length > 1 &&
        (Math.abs(g.vw - eskiVw) > 0.5 ||
          topler.some((v, i) => Math.abs(v - eskiT[i]) > 0.5));
      if (degisti && !kiosk.aktif)
        window.scrollTo(0, Math.round(yHesapla(capaD, topler, g.H)));
      else if (degisti && kiosk.aktif)
        window.scrollTo(0, Math.round(yHesapla(kiosk.dPos, topler, g.H)));
      zorla = true;
      uyan();
    }
    const ro =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(yenidenOlc);

    const rmqDegisti = () => {
      reduced = rmq.matches;
      sahne.toggleAttribute("data-azalt", reduced);
      zorla = true;
      // Akış yükseklikleri değişir (reduced'da min-height): yeniden ölç.
      requestAnimationFrame(() => yenidenOlc());
    };
    const gorunurluk = () => {
      gizli = document.hidden;
      if (gizli) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        glDur();
      } else {
        zorla = true;
        uyan();
      }
    };

    /* ---------------- kurulum ---------------- */
    sahne.toggleAttribute("data-azalt", reduced);
    olc();
    sahne.dataset.hazir = "1";
    window.addEventListener("scroll", kaydirmaOldu, { passive: true });
    window.addEventListener("resize", yenidenOlc, { passive: true });
    window.addEventListener("touchstart", dokunmaBasladi, { passive: true });
    window.addEventListener("touchend", dokunmaBitti, { passive: true });
    window.addEventListener("touchcancel", dokunmaBitti, { passive: true });
    if (KIOSK)
      for (const ev of KIOSK_OLAY)
        window.addEventListener(ev, kioskDurdur, { passive: true });
    rmq.addEventListener("change", rmqDegisti);
    document.addEventListener("visibilitychange", gorunurluk);
    ro?.observe(akis);
    ro?.observe(olcuEl);
    // Geç bağlanan katman içerikleri (görsel kapısı, A'nın bileşenleri): data-ic-* listesini tazele.
    let moZ = 0;
    const mo =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(() => {
            window.clearTimeout(moZ);
            moZ = window.setTimeout(() => {
              if (!canli) return;
              araTopla();
              zorla = true;
              uyan();
            }, 50);
          });
    mo?.observe(sahne, { childList: true, subtree: true });
    // İlk efekt karesi: scrollY'den d'yi okuyup zorla çiz (geri yüklenen konum dahil).
    zorla = true;
    uyan();
    let fontZ = 0;
    document.fonts?.ready
      .then(() => {
        fontZ = window.setTimeout(() => canli && yenidenOlc(), 0);
      })
      .catch(() => {});
    if (KIOSK) kioskBaslat(0);

    if (dev) {
      (window as unknown as { __icinden?: unknown }).__icinden = {
        topler: () => topler.slice(),
        sonD: () => sonD,
        g: () => g,
        H: () => g.H,
        M,
        sahneDurumu: (d: number) => sahneDurumu(M, d, g),
        yHesapla: (d: number) => yHesapla(d, topler, g.H),
        kayit,
        kayitSifirla: () => (kayit.length = 0),
        kiosk: () => ({ ...kiosk }),
        gl: () => ({
          var: !!globe,
          ic: !!inst,
          phi: glDurum.phi,
          scale: glDurum.scale,
          offset: glDurum.offset,
        }),
        els,
      };
    }

    return () => {
      canli = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (kiosk.raf) cancelAnimationFrame(kiosk.raf);
      kiosk.aktif = false;
      window.clearTimeout(yerlesZ);
      window.clearTimeout(spotZ);
      window.clearTimeout(kioskDevamZ);
      window.clearTimeout(fontZ);
      window.clearTimeout(moZ);
      dokuZ.forEach((z) => window.clearTimeout(z));
      mo?.disconnect();
      window.removeEventListener("scroll", kaydirmaOldu);
      window.removeEventListener("resize", yenidenOlc);
      window.removeEventListener("touchstart", dokunmaBasladi);
      window.removeEventListener("touchend", dokunmaBitti);
      window.removeEventListener("touchcancel", dokunmaBitti);
      if (KIOSK)
        for (const ev of KIOSK_OLAY)
          window.removeEventListener(ev, kioskDurdur);
      rmq.removeEventListener("change", rmqDegisti);
      document.removeEventListener("visibilitychange", gorunurluk);
      ro?.disconnect();
      html.style.scrollSnapType = eskiSnap;
      // DOM'u nötr bırak: Activity aynı DOM'u geri getirdiğinde eski satır içi değerler kalmasın.
      els.forEach((el) => {
        el.style.transform = "";
        el.style.opacity = "";
        el.style.visibility = "";
        el.style.willChange = "";
        el.removeAttribute("data-spot");
      });
      for (const a of aralar) a.el.style.opacity = "";
      sahne.removeAttribute("data-hazir");
      sahne.removeAttribute("data-dinlenme");
      sahne.style.backgroundColor = "";
      sahne.style.visibility = "";
      tuval.style.opacity = "";
      tuval.style.visibility = "";
      perdeEl.style.opacity = "";
      dSifirla();
      window.clearTimeout(kurZ);
      sahne.removeAttribute("data-gl");
      tuval.removeEventListener("webglcontextlost", baglamKayip);
      tuval.removeEventListener("webglcontextrestored", baglamGeri);
      // Bağlam bırakılmaz (loseContext): aynı canvas Activity dönüşünde yeniden kurulur. phenomenon'un
      // window resize dinleyicisi kaldırılamıyor; kureBirak örneğin resize'ını boşa çıkarır.
      kureBirak();
      if (dev) delete (window as unknown as { __icinden?: unknown }).__icinden;
    };
  }, []);

  return (
    <>
      <div ref={sahneRef} className="ics-sahne">
        <div ref={olcuRef} className="ics-olcu" aria-hidden="true" />
        {/* Kabuklar KATMANLAR sırasında (efekt :scope > [data-katman] ile bulur); içerik sunucudan. */}
        {KATMANLAR.map((k) => (
          <Katman key={k.id} id={k.id}>
            {ek[k.id]}
          </Katman>
        ))}
        <canvas ref={tuvalRef} className="ics-tuval" aria-hidden="true" />
        <div ref={kadrajRef} className="ics-kadraj" aria-hidden="true" />
        <div ref={perdeRef} className="ics-perde" aria-hidden="true" />
      </div>
      <div ref={akisRef} className="ics-akis">
        {children}
      </div>
    </>
  );
}
