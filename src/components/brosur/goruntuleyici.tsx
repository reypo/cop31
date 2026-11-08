"use client";
/* eslint-disable @next/next/no-img-element -- Sayfa görüntüleri PDF'in birebir raster'ı (scripts/brosur/uret.mjs,
   AVIF/WebP, özetli adlar): next/image yeniden kodlardı; sahne img'lerinin src'sini kitap.ts yönetir. */
/**
 * Dijital broşür görüntüleyicisi (istemci kabuğu): üst çubuk (geri, başlık, EN/TR, Sayfalar/Metin/PDF), sahne
 * (kitap.ts yönetir; React yalnız iskeleti çizer, sayfa img'lerine dokunmaz), alt çubuk (oklar, sayaç, küçük resimler,
 * yakınlaştırma), Metin paneli, Tüm sayfalar ızgarası, klavye. Özellikler müşterinin görüntüleyicisinden
 * (COP31_Brosur_EN/TR.html): EN/TR, küçük resim şeridi, ızgara, metin paneli, PDF, ← → / kaydırma.
 */
import { memo, useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type RefObject } from "react";
import { type Dil, DIL_ETIKET, oteki, yol } from "@/lib/dil";
import { YAZI, gorselYolu, type Yazilar } from "./arayuz";
import { geldiSil, GeriBaglanti } from "./geri";
import { Kitap, type KitapDurum } from "./kitap";
import type { Blok, SayfaMetni } from "./metin";

type Kutu = { p: number; x: number; y: number; g: number; h: number };

type Props = {
  dil: Dil;
  metin: readonly SayfaMetni[];
  ozet: readonly string[];
  icindekiler: readonly Kutu[];
  pdf: { yol: string; bayt: number };
};

const ILK: KitapDurum = { sol: null, sag: 1, cift: false, yakin: false, yukleniyor: false };

const Ikon = {
  izgara: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  ),
  metin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  pdf: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v3h16v-3" />
    </svg>
  ),
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  geri: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  ileri: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  ),
  arti: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8M10.5 7.5v6M7.5 10.5h6" />
    </svg>
  ),
  eksi: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8M7.5 10.5h6" />
    </svg>
  ),
};

/**
 * Sahne iskeleti: React bir kez çizer, sonra hiç değiştirmez (props yok). img src/alt, data-* ve canlandırmalar
 * kitap.ts'te; açılış betiği (brosur.tsx) ilk boyamadan önce görünen sayfayı yazdığı için suppressHydrationWarning.
 */
const Sahne = memo(function Sahne({ etiket }: { etiket: string }) {
  const yuva = (yan: "sol" | "sag") => (
    <div className="bro-yuva" data-yuva={yan} data-p="" suppressHydrationWarning>
      <img className="bro-taban" alt="" draggable={false} decoding="async" suppressHydrationWarning />
      <img className="bro-net" alt="" aria-hidden="true" draggable={false} decoding="async" />
      <i className="bro-golge" aria-hidden="true" />
      <div className="bro-baglar" />
    </div>
  );
  return (
    <div className="bro-sahne" data-bro-sahne role="region" aria-label={etiket}>
      <div className="bro-kamera">
        <div className="bro-alan">
          <div className="bro-kitap" data-kitap data-sol="" data-sag="1" suppressHydrationWarning>
            {yuva("sol")}
            {yuva("sag")}
            <div className="bro-yaprak" data-yaprak hidden aria-hidden="true">
              <div className="bro-yuz bro-on">
                <img alt="" draggable={false} decoding="async" />
                <i className="bro-isik" />
              </div>
              <div className="bro-yuz bro-arka">
                <img alt="" draggable={false} decoding="async" />
                <i className="bro-isik" />
              </div>
            </div>
            <div className="bro-solma" data-solma hidden aria-hidden="true">
              <img data-yan="sol" alt="" draggable={false} />
              <img data-yan="sag" alt="" draggable={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/** Sayfa metni blokları. `git` yoksa (ekran okuyucu metni) İçindekiler bağlantısız: odaklanabilir görünmez öğe olmasın. */
function Bloklar({ bloklar, git, y }: { bloklar: readonly Blok[]; git?: (p: number, e: ReactMouseEvent) => void; y: Yazilar }) {
  return bloklar.map((b, i) => {
    switch (b.t) {
      case "baslik":
        return <h3 key={i}>{b.m}</h3>;
      case "ara":
        return <h4 key={i}>{b.m}</h4>;
      case "etiket":
        return (
          <p key={i} className="bro-etiket">
            {b.m}
          </p>
        );
      case "p":
        return <p key={i}>{b.m}</p>;
      case "liste":
        return (
          <ul key={i}>
            {b.m.map((m, j) => (
              <li key={j}>{m}</li>
            ))}
          </ul>
        );
      case "icindekiler":
        return (
          <ol key={i} className="bro-icindekiler">
            {b.m.map((o) => {
              const ic = (
                <>
                  <span className="bro-cip">{o.bolum}</span>
                  <span>{o.ad}</span>
                  <span className="bro-pg">
                    <span className="bro-sr">{y.sayfa} </span>
                    {o.p}
                  </span>
                </>
              );
              return (
                <li key={o.p}>
                  {git ? (
                    <a href={`#p=${o.p}`} onClick={(e) => git(o.p, e)}>
                      {ic}
                    </a>
                  ) : (
                    ic
                  )}
                </li>
              );
            })}
          </ol>
        );
    }
  });
}

/**
 * Küçük resim (120 px şerit, 240 px ızgara; AVIF, yoksa WebP). Adres data-* özniteliğinde: `useTembel` kaydırma kabının
 * içinde görünür olunca yazar. Tarayıcının loading="lazy"'si ~1250 px önden yüklüyordu (şeritte 26 küçük resmin hepsi,
 * ~88 kB; şimdi görünenler + bir ekran payı).
 */
function Kucuk({ dil, ozet, p, w }: { dil: Dil; ozet: readonly string[]; p: number; w: 120 | 240 }) {
  const [g, h] = w === 120 ? [120, 170] : [240, 340];
  return (
    <picture>
      <source type="image/avif" data-srcset={gorselYolu(dil, ozet, p, w, "avif")} />
      <img data-src={gorselYolu(dil, ozet, p, w, "webp")} width={g} height={h} alt="" decoding="async" draggable={false} />
    </picture>
  );
}

/** Kabın içindeki küçük resimler görünür (± pay) olunca adreslerini yaz. `etkin` değilken (gizli ızgara) gözlem yok. */
function useTembel(kap: RefObject<HTMLElement | null>, pay: string, etkin = true) {
  useEffect(() => {
    const k = kap.current;
    if (!k || !etkin) return;
    const io = new IntersectionObserver(
      (girdiler) => {
        for (const g of girdiler) {
          if (!g.isIntersecting) continue;
          const img = g.target as HTMLImageElement;
          const kaynak = img.previousElementSibling as HTMLSourceElement | null;
          if (kaynak?.dataset.srcset) kaynak.srcset = kaynak.dataset.srcset;
          if (img.dataset.src) img.src = img.dataset.src;
          io.unobserve(img);
        }
      },
      { root: k, rootMargin: pay },
    );
    for (const img of k.querySelectorAll<HTMLImageElement>("img[data-src]")) if (!img.getAttribute("src")) io.observe(img);
    return () => io.disconnect();
  }, [kap, pay, etkin]);
}

export function Goruntuleyici({ dil, metin, ozet, icindekiler, pdf }: Props) {
  const y = YAZI[dil];
  const n = metin.length;
  const kokRef = useRef<HTMLDivElement>(null);
  const kitapRef = useRef<Kitap | null>(null);
  const seritRef = useRef<HTMLOListElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const izgaraRef = useRef<HTMLDivElement>(null);
  const donusRef = useRef<HTMLElement | null>(null);
  const ilkKaydirma = useRef(true);
  const [d, setD] = useState<KitapDurum>(ILK);
  const [panel, setPanel] = useState<"metin" | "sayfalar" | null>(null);

  const gorunen = [d.sol, d.sag].filter((p): p is number => p !== null);
  const ilk = gorunen[0] ?? 1;
  const son = gorunen[gorunen.length - 1] ?? 1;
  const sayac = gorunen.join("–");
  const etiket = useCallback((p: number) => `${y.sayfa} ${p} – ${metin[p - 1]?.ad ?? ""}`, [metin, y.sayfa]);

  useEffect(() => {
    const sahne = kokRef.current?.querySelector<HTMLElement>("[data-bro-sahne]");
    if (!sahne) return;
    const toc = metin[1]?.bloklar.find((b) => b.t === "icindekiler");
    const k = new Kitap({
      sahne,
      dil,
      ozet,
      n,
      alt: etiket,
      baglantilar: (p) =>
        p === 2
          ? icindekiler.map((b) => {
              const o = toc?.t === "icindekiler" ? toc.m.find((x) => x.p === b.p) : undefined;
              return { ...b, ad: `${o ? `${o.bolum} · ${o.ad}` : etiket(b.p)} — ${y.sayfa} ${b.p}` };
            })
          : [],
      bildir: setD,
    });
    kitapRef.current = k;
    return () => {
      k.yokEt();
      kitapRef.current = null;
    };
  }, [dil, etiket, icindekiler, metin, n, ozet, y.sayfa]);

  // Şeritte görünen küçük resim(ler) ortada kalsın.
  useEffect(() => {
    const s = seritRef.current;
    const el = s?.querySelector<HTMLElement>(`[data-p="${ilk}"]`);
    if (!s || !el) return;
    const sr = s.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const hedef = s.scrollLeft + er.left - sr.left - s.clientWidth / 2 + er.width * (gorunen.length > 1 ? 1 : 0.5);
    s.scrollTo({ left: hedef, behavior: ilkKaydirma.current ? "instant" : "smooth" });
    ilkKaydirma.current = false;
  }, [ilk, gorunen.length]);
  const izgaraGovdeRef = useRef<HTMLDivElement>(null);
  useTembel(seritRef, "0px 160px");
  useTembel(izgaraGovdeRef, "400px 0px", panel === "sayfalar");

  const kapat = useCallback(() => {
    setPanel(null);
    const r = donusRef.current;
    donusRef.current = null;
    if (r) requestAnimationFrame(() => r.focus({ preventScroll: true }));
  }, []);

  /** Sayfa bağlantısı (küçük resim, ızgara, İçindekiler): çapa yerine kitap.ts (adres replaceState ile). */
  const git = useCallback(
    (p: number, e?: ReactMouseEvent, kapa = false) => {
      e?.preventDefault();
      if (kapa) kapat();
      kitapRef.current?.git(p);
    },
    [kapat],
  );

  const ac = useCallback(
    (p: "metin" | "sayfalar", dugme: HTMLElement) => {
      if (panel === p) {
        kapat();
        return;
      }
      donusRef.current = dugme;
      setPanel(p);
    },
    [kapat, panel],
  );

  // Açılan panelde odak başlığa / bulunulan sayfaya.
  useEffect(() => {
    if (panel === "metin") panelRef.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    if (panel === "sayfalar") {
      const a = izgaraRef.current?.querySelector<HTMLElement>('a[aria-current="page"]');
      a?.focus({ preventScroll: true });
      a?.scrollIntoView({ block: "center" });
    }
  }, [panel]);

  // Klavye: ← → PageUp/Down Home End (Space ileri), + − 0 yakınlık, Esc panel/yakınlık.
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = kitapRef.current;
      if (!k) return;
      const t = e.target as HTMLElement | null;
      if (e.key === "Escape") {
        if (panel) {
          e.preventDefault();
          kapat();
        } else k.yakinlikSifirla();
        return;
      }
      if (panel === "sayfalar") return;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      // Metin panelinde dikey kaydırma tuşları panele kalsın; yalnız ← → sayfa çevirir.
      const panelde = !!t?.closest(".bro-panel");
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          k.ileri();
          break;
        case "ArrowLeft":
          e.preventDefault();
          k.geri();
          break;
        case "PageDown":
        case " ":
          if (panelde || (e.key === " " && t?.closest("button, a"))) return;
          e.preventDefault();
          k.ileri();
          break;
        case "PageUp":
          if (panelde) return;
          e.preventDefault();
          k.geri();
          break;
        case "Home":
          if (panelde) return;
          e.preventDefault();
          k.git(1);
          break;
        case "End":
          if (panelde) return;
          e.preventDefault();
          k.git(n);
          break;
        case "+":
        case "=":
          k.yakinlastir(1.5);
          break;
        case "-":
          k.yakinlastir(1 / 1.5);
          break;
        case "0":
          k.yakinlikSifirla();
          break;
      }
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [kapat, n, panel]);

  const otekiDil = oteki(dil);
  const dilAdres = yol(otekiDil, "/brosur") + (ilk > 1 ? `#p=${ilk}` : "");
  const pdfMB = (pdf.bayt / 1048576).toFixed(1);

  const okGeri = (sinif: string) => (
    <button type="button" className={`bro-ok ${sinif}`} data-yon="geri" aria-label={y.onceki} disabled={ilk <= 1} onClick={() => kitapRef.current?.geri()}>
      {Ikon.geri}
    </button>
  );
  const okIleri = (sinif: string) => (
    <button type="button" className={`bro-ok ${sinif}`} data-yon="ileri" aria-label={y.sonraki} disabled={son >= n} onClick={() => kitapRef.current?.ileri()}>
      {Ikon.ileri}
    </button>
  );
  const sayacEl = (
    <span className="bro-sayac" aria-hidden="true">
      <b data-sayac suppressHydrationWarning>
        {sayac}
      </b>{" "}
      / {n}
    </span>
  );

  return (
    <div className="bro" ref={kokRef} data-panel={panel ?? ""}>
      <header className="bro-ust">
        <GeriBaglanti dil={dil} className="bro-geri" />
        <div className="bro-marka">
          <span className="bro-marka-k">{y.ust}</span>
          <span className="bro-marka-t">{y.baslik}</span>
        </div>
        {sayacEl}
        <nav className="bro-dil" aria-label={y.dil}>
          <span aria-current="true" title={DIL_ETIKET[dil].ad}>
            {DIL_ETIKET[dil].kisa}
          </span>
          <a href={dilAdres} hrefLang={otekiDil} lang={otekiDil} title={DIL_ETIKET[otekiDil].ad} aria-label={DIL_ETIKET[otekiDil].ad} onClick={geldiSil}>
            {DIL_ETIKET[otekiDil].kisa}
          </a>
        </nav>
        <button type="button" className="bro-btn" aria-pressed={panel === "sayfalar"} aria-label={y.tumSayfalar} title={y.tumSayfalar} onClick={(e) => ac("sayfalar", e.currentTarget)}>
          {Ikon.izgara}
          <span className="bro-btn-etiket" aria-hidden="true">
            {y.sayfalar}
          </span>
        </button>
        <button type="button" className="bro-btn" aria-pressed={panel === "metin"} aria-label={y.sayfaMetni} title={y.sayfaMetni} onClick={(e) => ac("metin", e.currentTarget)}>
          {Ikon.metin}
          <span className="bro-btn-etiket" aria-hidden="true">
            {y.metin}
          </span>
        </button>
        <a className="bro-btn" href={pdf.yol} download={`COP31_Brosur_${dil.toUpperCase()}.pdf`} type="application/pdf" aria-label={`${y.pdfIndir} (${pdfMB} MB)`} title={`${y.pdfIndir} · ${pdfMB} MB`}>
          {Ikon.pdf}
          <span className="bro-btn-etiket" aria-hidden="true">
            {y.pdf}
          </span>
        </a>
      </header>

      <main className="bro-orta" inert={panel === "sayfalar"}>
        {okGeri("bro-yan")}
        <Sahne etiket={y.kitap} />
        {okIleri("bro-yan")}
        <p className="bro-sr" aria-live="polite">
          {y.sayac(sayac, n)}
        </p>
        <div className="bro-sr">
          {gorunen.map((p) => (
            <section key={p} className="bro-metin" lang={dil}>
              <Bloklar bloklar={metin[p - 1]?.bloklar ?? []} y={y} />
            </section>
          ))}
        </div>
      </main>

      <footer className="bro-alt" inert={panel === "sayfalar"}>
        {okGeri("")}
        {sayacEl}
        <ol className="bro-serit" ref={seritRef} aria-label={y.sayfaSecimi}>
          {metin.map((m, i) => {
            const p = i + 1;
            const on = gorunen.includes(p);
            return (
              <li key={p}>
                <a className="bro-kucuk" href={`#p=${p}`} data-p={p} aria-current={on ? "page" : undefined} aria-label={etiket(p)} title={etiket(p)} onClick={(e) => git(p, e)} draggable={false}>
                  <Kucuk dil={dil} ozet={ozet} p={p} w={120} />
                </a>
              </li>
            );
          })}
        </ol>
        <span className="bro-ipucu">{y.ipucuMasa}</span>
        <div className="bro-araclar">
          <button type="button" className="bro-ok" aria-label={y.uzaklas} title={y.uzaklas} disabled={!d.yakin} onClick={() => kitapRef.current?.yakinlastir(1 / 1.6)}>
            {Ikon.eksi}
          </button>
          <button type="button" className="bro-ok" aria-label={y.yakinlas} title={y.yakinlas} onClick={() => kitapRef.current?.yakinlastir(1.6)}>
            {Ikon.arti}
          </button>
        </div>
        {okIleri("")}
      </footer>

      <aside className="bro-panel" ref={panelRef} hidden={panel !== "metin"} aria-labelledby="bro-panel-baslik">
        <div className="bro-panel-bas">
          <h2 id="bro-panel-baslik" tabIndex={-1}>
            {y.sayfaMetni}
          </h2>
          <button type="button" className="bro-ok" aria-label={y.kapat} onClick={kapat}>
            {Ikon.x}
          </button>
        </div>
        <div className="bro-panel-govde">
          {panel === "metin" &&
            gorunen.map((p) => {
              const m = metin[p - 1];
              return (
                <section key={p} className="bro-metin" lang={dil}>
                  <div className="bro-pgh">
                    {m.bolum ? <span className="bro-cip">{`${y.bolum} ${String(m.bolum).padStart(2, "0")}`}</span> : null}
                    <span>{`${y.sayfa} ${p} · ${m.ad}`}</span>
                  </div>
                  <Bloklar bloklar={m.bloklar} git={git} y={y} />
                </section>
              );
            })}
        </div>
      </aside>

      <div className="bro-izgara" ref={izgaraRef} role="dialog" aria-labelledby="bro-izgara-baslik" hidden={panel !== "sayfalar"}>
        <div className="bro-izgara-bas">
          <h2 id="bro-izgara-baslik">{y.tumSayfalar}</h2>
          <button type="button" className="bro-ok" aria-label={y.kapat} onClick={kapat}>
            {Ikon.x}
          </button>
        </div>
        <div className="bro-izgara-govde" ref={izgaraGovdeRef}>
          <ol>
            {metin.map((m, i) => {
              const p = i + 1;
              return (
                <li key={p}>
                  <a href={`#p=${p}`} aria-current={gorunen.includes(p) ? "page" : undefined} onClick={(e) => git(p, e, true)}>
                    <Kucuk dil={dil} ozet={ozet} p={p} w={240} />
                    <span>
                      {p}
                      <em>{m.ad}</em>
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
