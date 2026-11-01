/**
 * Sayfa 2–11. Metinler src/lib/content.ts'ten, kısaltılmadan.
 * Her sayfa bir <Sheet> (tam ekran <section>); giriş: başlık yukarıdan,
 * polaroidler döndürülerek "masaya düşer", sayılar 0'dan sayar.
 */

import {
  baskanMesaji,
  bizKimiz,
  bulusmalar,
  cover,
  facts,
  genclikKollari,
  iklim,
  kapanis,
  solenler,
  stats,
  vizyon,
} from "@/lib/content";
import { photos } from "@/lib/photos";
import { Counter } from "./counter";
import { brosurPages, pageNo } from "./data";
import { RevealGroup } from "./reveal";
import { HandArrow, LeafIcon, ORBIT_CORNER, Orbits, Polaroid, Prose, Sheet, SheetHeader, cx, d } from "./ui";

/** Tam sütun polaroid (mobilde ~342px, masaüstünde ≤ 512px). */
const SIZES_FULL = "(max-width: 600px) 88vw, 512px";
const SIZES_WIDE = "(max-width: 600px) 72vw, 400px";
const SIZES_HALF = "(max-width: 600px) 46vw, 260px";

/* ------------------------------------------------------------------ */
/* 02 — İçindekiler (tıklanmaz; yalnızca görsel liste)                  */
/* ------------------------------------------------------------------ */

export function Contents() {
  const list = brosurPages.slice(2);
  return (
    <Sheet
      n={2}
      tone="mist"
      decor={<Orbits className={ORBIT_CORNER} dashed />}
    >
      <SheetHeader n={2} tag={cover.title} title="İçindekiler" />
      <ol className="mt-7 border-t border-brand-blue/15">
        {list.map((p, i) => (
          <li
            key={p.n}
            data-a="left"
            style={d(180 + i * 55)}
            className="flex items-center gap-4 border-b border-brand-blue/15 py-[0.7rem]"
          >
            <span className="w-7 shrink-0 text-[15px] font-black text-brand-green tabular-nums">
              {pageNo(p.n)}
            </span>
            <span className="min-w-0 flex-1 text-[15px] leading-snug font-bold text-brand-blue">
              {p.title}
            </span>
            <LeafIcon className="size-3.5 shrink-0 opacity-80" />
          </li>
        ))}
      </ol>
      <p data-a="up" style={d(820)} className="mt-8 font-script text-[2.1rem] leading-none text-brand-blue">
        {cover.slogan}
      </p>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* 03 — AK Parti Gençlik Kolları + istatistikler                        */
/* ------------------------------------------------------------------ */

function StatGrid() {
  const [members, provinces, districts, pledge] = stats;
  return (
    <div className="mt-7 grid grid-cols-3 gap-2.5">
      <div data-a="pop" style={d(240)} className="col-span-3 rounded-2xl bg-brand-blue px-5 py-4 text-white shadow-[0_14px_30px_-18px_rgb(12_119_182/0.8)]">
        <p className="text-[clamp(2rem,11vw,2.6rem)] leading-none font-black whitespace-nowrap tabular-nums">
          <Counter value={members.value ?? 0} delay={240} />
          {members.suffix}
        </p>
        <p className="mt-1.5 text-sm font-bold text-white/85">{members.label}</p>
      </div>
      {[provinces, districts].map((s, i) => (
        <div
          key={s.label}
          data-a="pop"
          style={d(340 + i * 90)}
          className="flex flex-col justify-between rounded-2xl bg-brand-mist px-3 py-3"
        >
          <p className="text-[clamp(1.5rem,8vw,1.9rem)] leading-none font-black whitespace-nowrap text-brand-blue tabular-nums">
            <Counter value={s.value ?? 0} delay={340 + i * 90} />
            {s.suffix}
          </p>
          <p className="mt-2 text-[13px] font-bold text-brand-green">{s.label}</p>
        </div>
      ))}
      <div
        data-a="pop"
        style={d(520)}
        className="flex flex-col justify-between rounded-2xl border-2 border-brand-green bg-white px-2.5 py-3"
      >
        <LeafIcon className="size-7" />
        <p className="mt-2 text-[clamp(10.5px,3.3vw,12px)] leading-tight font-bold text-brand-green">{pledge.label}</p>
      </div>
    </div>
  );
}

export function AkGenclik() {
  return (
    <Sheet n={3} decor={<Orbits className={ORBIT_CORNER} />}>
      <SheetHeader
        n={3}
        tag="Hakkımızda"
        title={genclikKollari.title}
        subtitle={genclikKollari.subtitle}
      />
      <StatGrid />
      <Prose paragraphs={genclikKollari.paragraphs} delay={620} className="mt-8" />
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* 04 — Başkan'ın mesajı + fotoğraf                                     */
/* ------------------------------------------------------------------ */

function Signature({ dark = false, delay }: { dark?: boolean; delay: number }) {
  return (
    <div data-a="up" style={d(delay)} className="mt-7">
      <p className={cx("font-script text-[2.3rem] leading-none", dark ? "text-white" : "text-brand-blue")}>
        {baskanMesaji.name}
      </p>
      <p className={cx("mt-2 text-[12px] font-bold", dark ? "text-[#bfe8d2]" : "text-brand-green")}>
        {baskanMesaji.role}
      </p>
    </div>
  );
}

export function BaskanMesaji() {
  return (
    <Sheet n={4} tone="mist" decor={<Orbits className={ORBIT_CORNER} dashed />}>
      <SheetHeader n={4} tag="Başkan'ın Mesajı" title="“Ortak evimiz dünyamız”" />
      <Polaroid
        photo={photos.baskanVeCumhurbaskani}
        rotate={-2}
        aspect="5 / 4"
        pos="50% 40%"
        sizes={SIZES_FULL}
        delay={220}
        className="mt-8"
      />
      <Prose paragraphs={baskanMesaji.paragraphs} delay={480} className="mt-8" />
      <Signature delay={700} />
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* 05 — Biz Kimiz?                                                     */
/* ------------------------------------------------------------------ */

export function BizKimiz() {
  const [lead, ...rest] = bizKimiz.paragraphs;
  return (
    <Sheet n={5} decor={<Orbits className={ORBIT_CORNER} />}>
      <SheetHeader n={5} tag="Teşkilat" title={bizKimiz.title} />
      <div data-a="up" style={d(180)} className="mt-5 flex flex-wrap gap-2">
        {[`${facts.provinces} il`, `${facts.districts} ilçe`, "Genel Merkez · il · ilçe"].map((chip) => (
          <span key={chip} className="rounded-full border border-brand-green/50 bg-white px-3 py-1 text-[12px] font-bold text-brand-teal">
            {chip}
          </span>
        ))}
      </div>
      <Prose paragraphs={[lead]} delay={240} className="mt-5" first />
      <Polaroid
        photo={photos.bayrakKalabalik}
        rotate={3}
        aspect="16 / 9"
        sizes={SIZES_FULL}
        delay={360}
        className="mx-1 mt-8"
      />
      <Prose paragraphs={rest} delay={520} className="mt-8" />
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* 06 — Cumhurbaşkanımızın Gençlik Vizyonu (2 polaroid + yaprak etiket) */
/* ------------------------------------------------------------------ */

export function Vizyon() {
  const item = vizyon.items[0];
  return (
    <Sheet n={6} tone="mist" decor={<Orbits className={ORBIT_CORNER} dashed />}>
      <SheetHeader n={6} tag="Vizyon" title={vizyon.title} />
      <Prose paragraphs={[vizyon.intro]} delay={200} className="mt-5" />
      <div className="relative mt-9">
        <Polaroid
          photo={photos.genclikBulusmasiSalon}
          rotate={-3}
          aspect="4 / 3"
          pos="50% 35%"
          sizes={SIZES_WIDE}
          delay={300}
          className="w-[76%]"
        />
        <Polaroid
          photo={photos.sozGenclikteAnkara}
          rotate={4}
          aspect="4 / 3"
          pos="50% 40%"
          sizes={SIZES_HALF}
          delay={480}
          className="relative z-10 -mt-14 ml-auto w-[58%]"
        />
      </div>
      <div className="mt-8">
        <span data-a="left" style={d(620)} className="leaf-tag">
          Katılım · Liderlik · İletişim
        </span>
        <h3 data-a="up" style={d(680)} className="mt-3 text-[1.15rem] leading-snug font-bold text-brand-green">
          {item.title}
        </h3>
        <p data-a="up" style={d(740)} className="mt-2 text-[15px] leading-[1.7] text-pretty">
          {item.text}
        </p>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* 07 — 2017 Seçilme Yaşı Reformu & TBMM                               */
/* ------------------------------------------------------------------ */

function Person({ filled, delay }: { filled: boolean; delay: number }) {
  return (
    <svg data-a="pop" style={d(delay)} aria-hidden="true" viewBox="0 0 24 32" className="h-9 w-7">
      <circle cx="12" cy="7" r="5.2" fill={filled ? "var(--color-brand-green)" : "none"} stroke="var(--color-brand-green)" strokeWidth="1.6" />
      <path
        d="M3 30v-6.5C3 17.8 7 15 12 15s9 2.8 9 8.5V30z"
        fill={filled ? "var(--color-brand-green)" : "none"}
        stroke="var(--color-brand-green)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Reform() {
  const reform = vizyon.items[1];
  const tbmm = vizyon.items[2];
  return (
    <Sheet n={7} decor={<Orbits className={ORBIT_CORNER} />}>
      <SheetHeader n={7} tag={`${facts.electionAgeYear} · TBMM`} title={reform.title} />

      <div className="mt-7 flex items-center gap-5">
        <div
          data-a="pop"
          style={d(220)}
          className="relative flex size-[7.5rem] shrink-0 flex-col items-center justify-center rounded-full bg-brand-blue text-white shadow-[0_14px_30px_-16px_rgb(12_119_182/0.9)]"
        >
          <span className="text-[3.3rem] leading-none font-black tabular-nums">
            <Counter value={facts.electionAge} delay={220} />
          </span>
          <span className="mt-1 text-[10px] font-bold text-white/85">seçilme yaşı</span>
        </div>
        <p data-a="up" style={d(320)} className="text-[15px] leading-[1.65] text-pretty">
          {reform.text}
        </p>
      </div>

      <div className="mt-9 flex items-start">
        <Polaroid
          photo={photos.tbmmHavadan}
          rotate={-3}
          aspect="3 / 2"
          sizes={SIZES_HALF}
          delay={420}
          className="w-[56%]"
        />
        <Polaroid
          photo={photos.tbmmGenelKurul}
          rotate={4}
          aspect="3 / 2"
          sizes={SIZES_HALF}
          delay={560}
          className="relative z-10 mt-12 -ml-[12%] w-[56%]"
        />
      </div>

      <div className="mt-9">
        <h3 data-a="up" style={d(640)} className="text-[1.25rem] leading-snug font-black text-brand-blue">
          {tbmm.title}
        </h3>
        <div className="mt-4 flex items-center gap-4">
          <p data-a="pop" style={d(700)} className="shrink-0 text-[2.6rem] leading-none font-black whitespace-nowrap text-brand-green tabular-nums">
            <Counter value={facts.youngMpsOurs} delay={700} />
            <span className="text-brand-blue/40">/{facts.youngMps}</span>
          </p>
          <div className="flex gap-1" role="img" aria-label={`${facts.youngMps} milletvekilinden ${facts.youngMpsOurs}'ü`}>
            {Array.from({ length: facts.youngMps }, (_, i) => (
              <Person key={i} filled={i < facts.youngMpsOurs} delay={760 + i * 80} />
            ))}
          </div>
        </div>
        <p data-a="up" style={d(820)} className="mt-4 text-[15px] leading-[1.7] text-pretty">
          {tbmm.text}
        </p>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* 08 — Gençlik Buluşmaları                                            */
/* ------------------------------------------------------------------ */

export function Bulusmalar() {
  const p = bulusmalar.paragraphs;
  return (
    <Sheet n={8} tone="mist" decor={<Orbits className={ORBIT_CORNER} dashed />}>
      <SheetHeader n={8} tag="Buluşmalar" title={bulusmalar.title} />

      <div data-a="pop" style={d(200)} className="mt-6 flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-[0_10px_26px_-18px_rgb(27_79_156/0.6)]">
        <p className="shrink-0 text-[2.6rem] leading-none font-black whitespace-nowrap text-brand-blue tabular-nums">
          <Counter value={facts.meetings} delay={200} />+
        </p>
        <p className="text-[13px] leading-snug font-bold text-brand-green">
          gençlik buluşması
          <span className="block font-medium text-brand-ink">
            son {facts.meetingsYears} yılda, Cumhurbaşkanımızın katılımıyla
          </span>
        </p>
      </div>

      <div className="mt-9 flex items-start">
        <Polaroid
          photo={photos.sozGenclikteBursa}
          rotate={-2}
          aspect="4 / 3"
          sizes={SIZES_WIDE}
          delay={320}
          caption="Söz Gençlikte · Bursa"
          className="w-[66%]"
        />
        <Polaroid
          photo={photos.bulusmaSamsun}
          rotate={4}
          aspect="3 / 4"
          pos="50% 30%"
          sizes={SIZES_HALF}
          delay={480}
          caption="Buluşma · Samsun"
          className="relative z-10 mt-10 -ml-[8%] w-[42%]"
        />
      </div>

      <Prose paragraphs={p.slice(0, 3)} delay={560} className="mt-8" />

      <RevealGroup className="mt-9 flex items-start">
        <Polaroid
          photo={photos.sozGenclikteOsmaniye}
          rotate={3}
          aspect="3 / 2"
          sizes={SIZES_HALF}
          delay={0}
          caption="Söz Gençlikte · Osmaniye"
          className="relative z-10 w-[56%]"
        />
        <Polaroid
          photo={photos.sozGenclikteSenler}
          rotate={-3}
          aspect="3 / 2"
          sizes={SIZES_HALF}
          delay={160}
          caption="Söz Gençlikte · Şenler"
          className="mt-16 -ml-[12%] w-[56%]"
        />
      </RevealGroup>

      <RevealGroup className="mt-8">
        <Prose paragraphs={p.slice(3)} delay={0} />
      </RevealGroup>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* 09 — Gençlik Şölenleri                                              */
/* ------------------------------------------------------------------ */

export function Solenler() {
  return (
    <Sheet n={9} decor={<Orbits className={ORBIT_CORNER} />}>
      <SheetHeader n={9} tag={`${facts.solenDate} · Kocaeli`} title={solenler.title} />

      <div className="mt-6 flex items-end gap-3">
        <p
          data-a="pop"
          style={d(200)}
          className="shrink-0 text-[clamp(2.25rem,12vw,3rem)] leading-none font-black tracking-[-0.02em] whitespace-nowrap text-brand-blue tabular-nums"
        >
          <Counter value={facts.solenAttendees} delay={200} />+
        </p>
        <p data-a="up" style={d(300)} className="pb-1 text-[13px] leading-snug font-bold text-brand-green">
          genç
          <span className="block font-medium text-brand-ink">{facts.solenPlace}</span>
        </p>
      </div>

      <Polaroid
        photo={photos.solenKocaeliStadyum}
        rotate={-2}
        aspect="3 / 2"
        sizes={SIZES_FULL}
        delay={360}
        caption="Bir Gençlik Şöleni · Kocaeli Stadyumu"
        className="mt-9"
      />
      <div className="mt-5 flex items-start">
        <Polaroid
          photo={photos.solenKocaeliTribun}
          rotate={4}
          aspect="4 / 3"
          sizes={SIZES_HALF}
          delay={520}
          className="w-[54%]"
        />
        <Polaroid
          photo={photos.solenKocaeliSelam}
          rotate={-3}
          aspect="4 / 3"
          pos="40% 40%"
          sizes={SIZES_HALF}
          delay={640}
          className="relative z-10 mt-8 -ml-[8%] w-[54%]"
        />
      </div>

      <RevealGroup className="mt-8">
        <Prose paragraphs={solenler.paragraphs} delay={0} />
      </RevealGroup>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* 10 — Kapanış Konuşması                                              */
/* ------------------------------------------------------------------ */

export function Kapanis() {
  return (
    <Sheet
      n={10}
      tone="navy"
      decor={
        <>
          <Orbits className={ORBIT_CORNER} color="#ffffff" dashed />
          <Orbits className="-bottom-32 -left-36 hidden w-96 lg:block" color="#ffffff" />
        </>
      }
    >
      <SheetHeader n={10} tag="Kapanış" title={kapanis.title} dark />
      <div className="mt-6 flex flex-1 flex-col justify-center">
        <p
          data-a="pop"
          style={d(200)}
          aria-hidden="true"
          className="h-14 font-display text-[6rem] leading-none font-black text-brand-green"
        >
          “
        </p>
        {kapanis.paragraphs.map((t, i) => (
          <p key={i} data-a="up" style={d(300 + i * 80)} className="text-[1.05rem] leading-[1.75] font-medium text-white/95 text-pretty">
            {t}
          </p>
        ))}
        <Signature dark delay={520} />
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* 11 — Fotoğraf kolajı: 6 polaroid, 2 sütun, el çizimi oklar          */
/* ------------------------------------------------------------------ */

const collage = [
  [
    { photo: photos.fidanDikimiEkip, aspect: "3 / 4", rotate: -3, pos: "50% 35%", caption: "Fidan dikimi" },
    { photo: photos.hatiraOrmaniTabela, aspect: "4 / 3", rotate: 3, pos: "50% 40%", caption: `Hatıra Ormanı · ${facts.saplings} fidan` },
  ],
  [
    { photo: photos.gencIklimPanel, aspect: "4 / 3", rotate: 2, pos: "50% 45%", caption: "Genç İklim · İstanbul" },
    { photo: photos.copToplamaOrman, aspect: "3 / 4", rotate: -2, pos: "50% 45%", caption: "Orman temizliği" },
  ],
  [
    { photo: photos.fidanDikimiGencler, aspect: "4 / 3", rotate: -3, pos: "50% 40%", caption: "Birlikte fidan dikimi" },
    { photo: photos.fidanDikimiBaskan, aspect: "4 / 3", rotate: 4, pos: "50% 30%", caption: "Üsküdar · fidan dikimi" },
  ],
] as const;

export function Kolaj() {
  return (
    <Sheet n={11} tone="mist" decor={<Orbits className={ORBIT_CORNER} dashed />}>
      <SheetHeader n={11} tag="Sahada" title={iklim.title} />
      <ul className="mt-5 space-y-2">
        {iklim.items.map((item, i) => (
          <li key={item} data-a="left" style={d(180 + i * 70)} className="flex gap-2.5 text-[14px] leading-snug font-medium text-brand-ink">
            <LeafIcon className="mt-0.5 size-4 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/*
        İki bağımsız sütun (masonry): dikey ve yatay kartlar sütunlarda
        çaprazlandığı için satır bazlı ızgaradaki boşluklar oluşmaz. Her kart
        kendi gözlemcisiyle, ekrana gelince bir kez "masaya düşer"; soldaki
        kartın oku sağ sütundaki eşine uzanır.
      */}
      <div className="mt-8 grid grid-cols-2 items-start gap-x-6">
        {([0, 1] as const).map((col) => (
          <div key={col} className={cx("flex flex-col gap-5", col === 1 && "mt-12")}>
            {collage.map((row, r) => {
              const c = row[col];
              const delay = (r === 0 ? 300 : 0) + col * 160;
              return (
                <RevealGroup key={c.photo.src} className="relative">
                  <Polaroid
                    photo={c.photo}
                    rotate={c.rotate}
                    aspect={c.aspect}
                    pos={c.pos}
                    sizes={SIZES_HALF}
                    caption={c.caption}
                    delay={delay}
                  />
                  {col === 0 ? (
                    <HandArrow
                      className="absolute top-[16%] left-[calc(100%+0.75rem)] z-20 w-12 -translate-x-1/2"
                      style={d(delay + 420)}
                    />
                  ) : null}
                </RevealGroup>
              );
            })}
          </div>
        ))}
      </div>
    </Sheet>
  );
}
