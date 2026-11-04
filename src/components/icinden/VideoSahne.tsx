"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createStepper, type Durak as AdimDurak, type Jest, type Stepper } from "./adim";
import KadrajOkumasi, { okumaYaz } from "./KadrajOkumasi";
import type { Boyut, IstemciManifest, KodekAd, Nokta } from "./klipler";
import Lombar, { delikYaz } from "./Lombar";
import { kodekSec, Oynatici, type Kayit } from "./oynatici";
import { dizinler, rolu, type Rol } from "./rol";

/**
 * /icinden v3 sahnesi (brief-icinden-3 §2.4, §9.5, §12.4, G turu §14.4.6; oynatıcı docs/klip-oynatma.md). Sabit sahne
 * (poster, 3 video, yedek, lombar kâğıdı, etiketler + fidan katmanı, kadraj okuması) + belgede N durak bölümü (100svh,
 * görünmez çapa; metin bantları ve d11 polaroidleri onların içinde `position: fixed`) + kapanış (dizin N).
 *
 * Durak numaraları sabit DEĞİL: hepsi manifestin rol tablosundan (rol.ts `dizinler`; E turu, §12.4-1). Bugünkü
 * tablo (G turu, §14.4.2) d0 lombar · d1 dunya · d2 emanet · d3 expo · d4 anatomi · d5 sutunlar · d6–d7 duvar · d8 masa ·
 * d9 fidan-kok · d10 fidan-govde · d11 fidan-dal · d12 fidan-yaprak · 13 kapanış.
 *
 * Durum makinesi: DUR(k) → jest → GECIS(k→j) → DUR(j). Bir jest = bir geçiş; adım süresi = geçişin süresi
 * (klip + DOM ön/son evresi); geçiş sürerken jestler yok sayılır (ters geçiş yok, §9.5). Video geçişleri
 * Oynatici'de (döngüsüz duraklar dahil: duvar, masa, fidan d9–d11 gelen klibin son karesinde durur; fidan içi geri adım
 * geri klibi olmadığından hedef posterinin 350 ms çapraz sönmesi, `Gecis.geri === null`). DOM evresi yalnız lombar↔dunya:
 * logo sönmesi 0,3 s + amblem dairesinde ilk kare 0,3 s + lombar deliği (t01 kare kare).
 *
 * React state YOK: her şey kök öznitelikleri (data-durak, data-faz, data-hedef, data-metin, data-etiket,
 * data-dinlenme, data-spot, data-kagit, data-kiosk, data-engel; rol eşleri data-rol, data-hedef-rol,
 * data-metin-rol, data-dinlenme-rol — CSS yalnız bunlarla), polaroid figürlerinde `data-hazir` (görsel çözüldü) ve
 * doğrudan stil yazımıyla (lombar maskesi, kılavuz çizgisi). Fidan katmanının (81 halka, boğum etiketleri, polaroidler)
 * bütün animasyonu CSS geçişi (opaklık/transform), kök özniteliklerinden; her karede JS stil yazımı yok (§13.8).
 * Reduced-motion'da adımlama kurulmaz (CSS akış düzeni, video yok); oturum ortasında açılırsa sayfa yenilenir.
 * Activity (Next 16): gizlenince etkiler temizlenir (videolar durur, bloblar bırakılır, touch-action geri).
 *
 * Veri Tasarrufu / 2G–3G / prefers-reduced-data (brief §6): poster kipi — video inmez, geçişler poster çapraz
 * sönmesi (lombar ve okuma aynı zamanlamayla). `?poster=1` ile zorlanır (ölçüm).
 */

const KIOSK_KAPANIS_MS = 9000;
/**
 * Kiosk dinlenmeleri (`?auto=1`; §14.4.2: tur 115–125 s). Burada olmayan rol: spot satırı varsa her satır bir kez
 * (600 + n × aralık), yoksa 5 s. Varıştan (varildi) sayılır.
 */
const KIOSK_MS: Partial<Record<Rol, number>> = {
  masa: 3000,
  "fidan-kok": 5000,
  "fidan-govde": 4500,
  "fidan-dal": 5000,
  "fidan-yaprak": 6000,
};

const LOGO_MS = 300;
const METIN_ONCE_MS = 250;
/** d10 (gövde) dinlenmesinde polaroid görsellerinin indirilip çözülmesi varıştan bu kadar sonra (devir penceresinin dışında). */
const POLAROID_HAZIRLA_MS = 700;
/** Duvar kılavuzunun çapa ucunda bıraktığı boşluk (px): çizgi duvardaki rakamın içine girmesin (F turu D1-11 dersi). */
const DUVAR_KILAVUZ_BOSLUK = 22;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInCubic = (x: number) => x * x * x;

export default function VideoSahne({
  manifest,
  etiketler,
  children,
}: {
  manifest: IstemciManifest;
  etiketler: ReactNode;
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
      // Akış düzeninde polaroidler bölümün içinde statik: tarayıcının tembel yüklemesiyle.
      polaroidYukle(kok, true);
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
    <div
      ref={kokRef}
      className="v3 ic-kok"
      data-durak="0"
      data-rol={manifest.duraklar[0]?.rol}
      data-faz="dur"
      data-metin="0"
      data-metin-rol={manifest.duraklar[0]?.rol}
      data-etiket="-"
      data-dinlenme="-"
      data-dinlenme-rol="-"
      data-spot="0"
    >
      <div className="v3-sahne" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- poster katmanı: src JS'ten, LQIP arka planda */}
        <img data-v3-poster className="v3-poster" alt="" decoding="async" hidden />
        <video className="v3-video" muted playsInline preload="auto" disableRemotePlayback />
        <video className="v3-video" muted playsInline preload="auto" disableRemotePlayback />
        <video className="v3-video" muted playsInline preload="auto" disableRemotePlayback />
        <div data-v3-yedek className="v3-yedek" />
        <Lombar />
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

/**
 * d11 polaroidleri (Icinden3 `Polaroidler`): görseller sunucuda `data-v3-src`/`data-v3-srcset` olarak gelir (HTML'de 1 px
 * yer tutucu; ilk yüklemede inmez). Hareketli düzende d10 dinlenmesinde (ya da doğrudan d11/d12'ye varışta) kaynak atanır ve
 * `img.decode()` beklenir; çözülen figür `data-hazir` alır (CSS ancak o zaman gösterir). Reduced'da tembel yükleme.
 */
function polaroidYukle(kok: HTMLElement, tembel: boolean): Promise<void>[] {
  return [...kok.querySelectorAll<HTMLImageElement>("img[data-v3-src]")].map((img) => {
    const fig = img.closest<HTMLElement>("[data-v3-pola]");
    if (tembel) img.loading = "lazy";
    const srcset = img.dataset.v3Srcset;
    if (srcset) img.srcset = srcset;
    img.src = img.dataset.v3Src!;
    img.removeAttribute("data-v3-src");
    return img.decode().then(
      () => {
        if (fig) fig.dataset.hazir = "1";
      },
      () => {
        // Çözme hatası (ağ): figür gösterilmez; boş çerçeve görünmesin.
      },
    );
  });
}

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
  const kadrajEl = kok.querySelector<HTMLElement>("[data-v3-kadraj]");
  const perde = sahne.querySelector<HTMLElement>("[data-v3-perde]")!;
  const sutunCizgi = sahne.querySelector<HTMLElement>("[data-v3-sutun-cizgi]")!;
  const bolumler = [...kok.querySelectorAll<HTMLElement>(".v3-durak")];
  const kapanis = kok.querySelector<HTMLElement>(".ic-kapanis");
  const canli = kok.querySelector<HTMLElement>("[data-v3-canli]");
  const kiosk = q.get("auto") === "1";
  if (kiosk) kok.dataset.kiosk = "1";
  const posterKipi = azVeri(q);
  const D = m.duraklar;
  /** Rol tablosu → durak numaraları (rol.ts). N: kapanış. */
  const R = D.map((d) => d.rol);
  const I = dizinler(R);
  const N = I.N;
  const [, govde] = I.fidanlar;
  /**
   * Bantlardaki bağlantılar (d0 şeridi: "← Konseptler", "Dijital broşür →"; d8 masa: "Dijital broşür →"): yalnız bandı
   * görünürken Tab sırasında (denetim A2-06; bant opaklık 0'da odaklanmasın).
   */
  const baglantilar = D.map((_, j) => [...kok.querySelectorAll<HTMLAnchorElement>(`.v3-bant[data-d="${j}"] a`)]);

  let boyut = boyut0;
  let kodek = kodek0;
  let k = 0; // bulunulan durak (N = kapanış)
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
      if (tur === "kodek-yedek-iste" && faz === "dur" && k < N) kodekUygula();
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
  const dunyaR = D[I.dunya]?.ozel?.dunyaR ?? [115];
  const lombar = () => {
    const c = D[I.dunya]?.ozel?.dunyaC?.[boyut] ?? (boyut === "dikey" ? ([360, 512] as const) : ([640, 232] as const));
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
  const kagitDelik = (r: number, ic = 0) => {
    const L = lombar();
    delikYaz(kagit, { cx: L.cx, cy: L.cy, r, ic });
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
  /** Kök öznitelikleri: numara + rol eşi (CSS rol seçicileri; §12.4-1). "-" yok demek. */
  const kokRol = (j: number) => rolu(R, j);
  const durakYaz = (j: number) => {
    kok.dataset.durak = String(j);
    kok.dataset.rol = kokRol(j);
  };
  const hedefYaz = (j: number | null) => {
    if (j === null) {
      delete kok.dataset.hedef;
      delete kok.dataset.hedefRol;
      return;
    }
    kok.dataset.hedef = String(j);
    kok.dataset.hedefRol = kokRol(j);
  };
  /** Metin bandı ve sahne etiketleri birlikte (dunya→lombar dönüşünde yalnız bant: `etiket` false). */
  const metinYaz = (j: number | "-", etiket = true) => {
    kok.dataset.metin = String(j);
    kok.dataset.metinRol = j === "-" ? "-" : kokRol(j);
    if (etiket) kok.dataset.etiket = String(j);
  };
  const dinlenmeYaz = (j: number | "-") => {
    kok.dataset.dinlenme = String(j);
    kok.dataset.dinlenmeRol = j === "-" ? "-" : kokRol(j);
  };
  const okuma = (j: number) => {
    const d = D[j];
    if (!d) return "";
    if (d.okumaDurak) return d.okumaDurak;
    return typeof d.okuma === "string" ? d.okuma : (d.okuma.at(-1) ?? "");
  };
  /**
   * Spot döngüsü: durağın bandındaki satır sayısı kadar (anatomi 4 bölge, sutunlar 12 sütun, ilk duvar 3 satır; satırsız
   * durakta yok). Sayılar DOM'dan bir kez okunur: tablo değişince Icinden3'ün bandı belirler.
   */
  const spotSay = D.map((_, j) => kok.querySelectorAll(`.v3-bant[data-d="${j}"] :is(.v3-spot-satir, .v3-sutun-satir)`).length);
  const spotAralik = (j: number) => (R[j] === "sutunlar" ? 4500 : 3500);
  let spotId = 0;
  let spotN = 0;
  const spotDurdur = () => {
    iptalEt(spotId);
    kok.dataset.spot = "0";
    sutunCizgi.style.opacity = "0";
  };
  /**
   * Etkin satırın sahnedeki çapası (video px): sutunlar → ozel.sutunlar[no − 1]; duvar (d6, G7 §14.4.4) → satırın
   * `data-capa` adıyla ozel.duvarCapalari (bulusma "50+", solen "100.000+", motto). Çapa yoksa (p6.json G7 adlarını
   * taşımıyorsa ya da o yönde kırpımdaysa) null: kılavuz çizilmez, satır döngüsü sürer.
   */
  const kilavuzCapa = (j: number, no: number, satir: HTMLElement): Nokta | null => {
    if (R[j] === "sutunlar") return D[j]?.ozel?.sutunlar?.[boyut]?.[no - 1] ?? null;
    const ad = satir.dataset.capa;
    if (R[j] === "duvar" && ad) return D[j]?.ozel?.duvarCapalari?.find((c) => c.ad === ad)?.[boyut] ?? null;
    return null;
  };
  /**
   * Etkin satırın işareti (d5 sütun, d6 duvar; denetim A1-02 kalıbı). Çizgi çapadan bandın dış kenarına (dikeyde üst
   * kenar, yatayda sol kenar, etkin satırın hizası) yalnız çapa bandın dışındaysa ve çizgi ≤ 0,35 · kısa kenarsa: uzun
   * çizgi kompozisyonu boydan bölüyor, bant altındaki çapadan gelen çizgi metnin içinden geçiyordu. Uzunsa sutunlarda
   * yalnız çapada nokta; duvarda hiçbiri (F turu D1-11: nokta duvardaki glifin üstüne düşüp leke gibi görünüyordu) ve
   * duvar çizgisi çapadan DUVAR_KILAVUZ_BOSLUK px önce biter (rakamın içine girmez). Çapa yoksa (manifestte yok,
   * kırpımda), bandın içinde/altında ya da üst şeritteyse (güvenli alan, kadraj okuması hizası) hiçbiri; satır döngüsü
   * her durumda sürer.
   */
  const kilavuz = (j: number, no: number) => {
    sutunCizgi.style.opacity = "0";
    const satir = kok.querySelector<HTMLElement>(`.v3-bant[data-d="${j}"] :is(.v3-sutun-satir, .v3-spot-satir)[data-no="${no}"]`);
    const bant = satir?.closest<HTMLElement>(".v3-bant-ic");
    if (!bant || !satir) return;
    const s = kilavuzCapa(j, no, satir);
    if (!s) return;
    const duvar = R[j] === "duvar";
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
      const bosluk = duvar ? DUVAR_KILAVUZ_BOSLUK : 0;
      if (L - bosluk < 12) return;
      const x0 = x + (dx / L) * bosluk;
      const y0 = y + (dy / L) * bosluk;
      delete sutunCizgi.dataset.nokta;
      sutunCizgi.style.width = `${(L - bosluk).toFixed(1)}px`;
      sutunCizgi.style.transform = `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px) rotate(${Math.atan2(dy, dx).toFixed(4)}rad)`;
    } else {
      if (duvar) return;
      sutunCizgi.dataset.nokta = "1";
      sutunCizgi.style.removeProperty("width");
      sutunCizgi.style.transform = `translate(${(x - 4.5).toFixed(1)}px, ${(y - 4.5).toFixed(1)}px)`;
    }
    sutunCizgi.style.opacity = "1";
  };
  const spotBaslat = (j: number) => {
    spotDurdur();
    const say = spotSay[j] ?? 0;
    if (!say) return;
    const aralik = spotAralik(j);
    spotN = 0;
    const adim = () => {
      spotN = (spotN % say) + 1;
      kok.dataset.spot = String(spotN);
      kilavuz(j, spotN);
      spotId = sonra(aralik, adim);
    };
    spotId = sonra(600, adim);
  };
  /** Bandı görünmeyen durağın bağlantıları Tab sırasından çıkar (denetim A2-06). j: metni görünen durak (−1: hiçbiri). */
  const baglantiOdak = (j: number) => {
    baglantilar.forEach((l, i) => {
      for (const a of l) a.tabIndex = i === j ? 0 : -1;
    });
  };

  /* ---------------- fidan: polaroid görselleri ---------------- */
  let polaroidIstendi = false;
  const polaroidHazirla = () => {
    if (polaroidIstendi) return;
    polaroidIstendi = true;
    polaroidYukle(kok, false);
  };

  let dinlenmeId = 0;
  let polaroidId = 0;
  const dinlen = (j: number) => {
    durakYaz(j);
    kok.dataset.faz = "dur";
    hedefYaz(null);
    metinYaz(j);
    baglantiOdak(j);
    iptalEt(dinlenmeId);
    dinlenmeId = sonra(400, () => dinlenmeYaz(j));
    okumaYaz(kadrajEl, okuma(j));
    spotBaslat(j);
    // d11 polaroidleri: d10 (gövde) dinlenmesinde, varış devrinin dışında indirilip çözülür (§14.4.6); d11/d12'ye doğrudan
    // varışta (yerleşme, kiosk başa dönüşü değil) hemen.
    iptalEt(polaroidId);
    if (!polaroidIstendi && govde >= 0 && j >= govde && j < N) polaroidId = sonra(j === govde ? POLAROID_HAZIRLA_MS : 0, polaroidHazirla);
  };
  /** Ekran okuyucuya yeni durağın başlığı (sr-only h1/h2; yalnız jestle varışta). */
  const duyur = (j: number) => {
    const b = j < N ? kok.querySelector<HTMLElement>(`#v3-b${j}`)?.textContent : "";
    if (canli && b) canli.textContent = b;
  };
  const gecisBasi = (hedef: number) => {
    faz = "gecis";
    kok.dataset.faz = "gecis";
    hedefYaz(hedef);
    metinYaz("-");
    dinlenmeYaz("-");
    baglantiOdak(-1);
    iptalEt(dinlenmeId);
    iptalEt(polaroidId);
    spotDurdur();
    kioskDurdurZaman();
  };
  const metinGelsin = (j: number, ms: number) => sonra(ms, () => metinYaz(j));
  /** Geçişin klibine göre kadraj okuması: gelen dizinin karesi (geri yönde tersten). */
  const okumaKare = (hedefDizi: number, f: number, n: number, ters: boolean) => {
    const o = D[hedefDizi]?.okuma;
    if (!Array.isArray(o) || !o.length) return;
    const i = ters ? n - 1 - f : f;
    okumaYaz(kadrajEl, o[Math.max(0, Math.min(o.length - 1, i))]);
  };

  /* ---------------- durak kurulumu (statik) ---------------- */
  const durakKur = (j: number) => {
    k = j;
    faz = "dur";
    if (j === I.lombar) {
      kagitGoster(1);
      delikYaz(kagit, null);
    } else kagitGoster(null);
    dinlen(j);
  };

  /* ---------------- adım ---------------- */
  const varildi = (j: number) => {
    if (oy.kodekBekliyor && j < N) kodekUygula();
    durakKur(j);
    duyur(j);
    if (olcBekliyor) yenidenOlc();
    kioskPlanla();
  };
  /** Kapanış durağı (N): videolar ve bloblar bırakılır. */
  const kapanisKur = () => {
    oy.durdur();
    k = N;
    faz = "dur";
    durakYaz(N);
    kok.dataset.faz = "dur";
    metinYaz("-");
    dinlenmeYaz("-");
    hedefYaz(null);
    baglantiOdak(-1);
  };

  const adim = (from: number, to: number, dir: 1 | -1, jest: Jest): number | false => {
    if (faz !== "dur" || from !== k) return false;
    // kapanış (son fidan durağı → kapanış: DOM, 1 s)
    if (to === N) {
      gecisBasi(N);
      okumaYaz(kadrajEl, "");
      sonra(1000, () => {
        kapanisKur();
        if (olcBekliyor) yenidenOlc();
        kioskPlanla();
      });
      return 1000;
    }
    if (from === N) {
      gecisBasi(N - 1);
      oy.basla(N - 1);
      metinGelsin(N - 1, 1000 - METIN_ONCE_MS);
      sonra(1000, () => varildi(N - 1));
      return 1000;
    }
    if (oy.durum !== "dur") return false;
    gecisBasi(to);

    // lombar → dunya (d0 → d1): logo sönmesi (CSS, 300 ms) → amblem dairesinde ilk kare (300 ms) → T01 + lombar
    if (from === I.lombar && to === I.dunya) {
      const L = lombar();
      kagitGoster(1);
      kagitDelik(0.97 * L.r0, 1);
      const v = oy.gec(to, 1, jest.tur, jest.t, {
        oncesiMs: 2 * LOGO_MS,
        kare: (f, n) => {
          kagitDelik(delikR(f));
          okumaKare(to, f, n, false);
        },
        varis: () => {
          kagitGoster(null);
          varildi(to);
        },
      });
      sonra(LOGO_MS, () => {
        oy.onizle(to, 1);
        tween(LOGO_MS, (e) => kagitDelik((0.97 + 0.03 * easeOutCubic(e)) * L.r0, 1 - e));
      });
      const T = 2 * LOGO_MS + v;
      metinGelsin(to, T - METIN_ONCE_MS);
      return T;
    }
    // dunya → lombar (d1 → d0): r10 (delik daralır) → video → beyaz (300 ms) → logo (300 ms)
    if (from === I.dunya && to === I.lombar) {
      const L = lombar();
      kagitGoster(1);
      kagitDelik(L.kose);
      const v = oy.gec(to, -1, jest.tur, jest.t, {
        kare: (f, n) => {
          kagitDelik(delikR(n - 1 - f));
          okumaKare(from, f, n, true);
        },
        varis: () => {
          kagitDelik(L.r0);
          tween(LOGO_MS, (e) => kagitDelik(L.r0, e), () => {
            oy.gizle(0);
            delikYaz(kagit, null);
            metinYaz(to, false);
            sonra(LOGO_MS, () => varildi(to));
          });
        },
      });
      okumaYaz(kadrajEl, "");
      return v + 2 * LOGO_MS;
    }
    // Klipli geçişler (ileri ve geri; d1 … d12). Döngüsüz duraklar (duvar, masa, fidan d9–d11) gelen klibin son karesinde
    // durur. Fidan içi geri adımda (geri klip yok) oynatıcı hedef posterini 350 ms çapraz söndürür; okuma aynı geri çağrıyla.
    const ters = dir < 0;
    const v = oy.gec(to, dir, jest.tur, jest.t, {
      kare: (f, n) => okumaKare(ters ? from : to, f, n, ters),
      varis: () => varildi(to),
    });
    if (v <= 0) {
      // Beklenmeyen: klip tanımı yok → klipsiz atla.
      sonra(400, () => {
        oy.domVaris(to);
        varildi(to);
      });
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
  // Tur: d0 → … → d12 → kapanış (atıflar görünür; OSM/Copernicus atfı kamusal ekranda zorunlu, denetim A3-01) →
  // beyaza sönüp başa. Ziyaretçi kapanışa inse de 30 s sonra buradan başa döner (A2-03). Spot satırlı durak her satırı
  // bir kez gösterir (anatomi 4 × 3,5 s, A1-07; ilk duvar 3 × 3,5 s = 11,1 s, §12.1); sutunlar 12 satırın 3'ünü
  // (3 × 4,5 s); masa ve fidan durakları KIOSK_MS'ten; öteki satırsız durak 5 s.
  let kioskId = 0;
  let kioskDuraklat = false;
  let kioskDevamId = 0;
  const dinlenmeMs = (j: number) => {
    if (j >= N) return KIOSK_KAPANIS_MS;
    const sabit = KIOSK_MS[R[j]];
    if (sabit) return sabit;
    const say = Math.min(spotSay[j] ?? 0, R[j] === "sutunlar" ? 3 : Infinity);
    return say ? 600 + say * spotAralik(j) : 5000;
  };
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
    if (k >= N) {
      // Kapanış ekrandan uzunsa atıflara (sona) yumuşak kaydır.
      const st = duraklar[N];
      if (st && st.end - st.start > 1)
        sonra(1500, () => {
          if (k >= N && !kioskDuraklat) window.scrollTo({ top: st.end, behavior: "smooth" });
        });
    }
    kioskId = sonra(dinlenmeMs(k), () => {
      if (faz !== "dur" || kioskDuraklat) return;
      if (k < N) {
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
      if (i >= N) {
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
  if (k0 >= N) {
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
  // silip varışı düşürüyordu; kodekSec çözülmeden jest gelirse de set değiştirilmez (denetim A2-04). Fidan katmanı
  // (halkalar, etiketler, polaroidler) CSS'te yerleşir: yön değişiminde JS yok.
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
          if (k < N) durakKur(k);
        });
      }
    });
  }
  window.addEventListener("resize", yenidenOlc);
  const ro = new ResizeObserver(yenidenOlc);
  ro.observe(document.body);

  /* ---------------- ölçüm kancası ---------------- */
  const w = window as unknown as { __icinden3?: unknown };
  w.__icinden3 = {
    oy,
    m,
    olaylar,
    durak: () => k,
    faz: () => faz,
    boyut: () => boyut,
    kodek: () => kodek,
    posterKipi: () => posterKipi,
    stops: () => duraklar,
    kiosk: () => ({ aktif: kiosk, duraklat: kioskDuraklat }),
    kayitlar: () => oy.olaylar.map((x: Kayit) => ({ ...x })),
    // Dikiş ölçümü (W-B2): lombar geometrisi ve video kapak dönüşümü. dizinler/roller: rol tablosu (E turu).
    geometri: () => ({ lombar: lombar(), geo: geo() }),
    dizinler: () => I,
    roller: () => R,
    polaroid: () => ({ istendi: polaroidIstendi, hazir: kok.querySelectorAll("[data-v3-pola][data-hazir]").length }),
  };

  /* ---------------- cihaz göstergesi (?hud=1; ayrı parça, rota JS'ine girmez) ---------------- */
  let hudSil: (() => void) | null = null;
  let hudIptal = false;
  if (q.get("hud") === "1")
    void import("./hud").then(({ hudKur }) => {
      if (!hudIptal) hudSil = hudKur(oy);
    });

  return () => {
    hudIptal = true;
    hudSil?.();
    for (const z of zamanlar) window.clearTimeout(z);
    zamanlar.clear();
    if (rafId) cancelAnimationFrame(rafId);
    aralar.clear();
    stepper.destroy();
    oy.yokEt();
    window.removeEventListener("resize", yenidenOlc);
    ro.disconnect();
    delete w.__icinden3;
  };
}
