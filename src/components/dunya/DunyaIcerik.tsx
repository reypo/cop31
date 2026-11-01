import {
  backCover,
  baskanMesaji,
  bizKimiz,
  bulusmalar,
  cop31,
  cover,
  facts,
  genclikKollari,
  iklim,
  kapanis,
  solenler,
  stats,
} from "@/lib/content";
import { photos } from "@/lib/photos";
import DunyaKapanis from "./DunyaKapanis";
import "./dunya.css";
import { etkinlikler } from "./iller";
import {
  AltBaslik,
  Baslik,
  Govde,
  LeafTag,
  Panel,
  Polaroid,
  PolaroidIkili,
  Sayi,
  YaprakMadde,
} from "./parcalar";

const tr = (n: number) => n.toLocaleString("tr-TR");

/** Paragrafı cümlelere böler (metni değiştirmeden). */
function cumleler(p: string): string[] {
  const parts = p.split(". ");
  return parts.map((x, i) => (i < parts.length - 1 ? `${x}.` : x));
}

/**
 * Kayan içerik: 8 bölüm, her biri en az bir ekran (`dn-bolum`, snap başı).
 * `data-stage` = bölüm index'i; DunyaScene bölüm bölüm adımlar ve küre
 * animasyonunu iki bölümün başlangıçları arasındaki geçişte oynatır.
 * 0 kahraman · 1–5 anlatı (küre üstte, panel altta) · 6 kapak finali
 * (görsel sabit katmanda) · 7 kapanış bloğu.
 */
export default function DunyaIcerik() {
  const kapanisCumleleri = cumleler(kapanis.paragraphs[0]);

  return (
    <>
      {/* 0 — Uzaydan dünya */}
      <section
        data-stage="0"
        className="dn-bolum relative flex flex-col items-center justify-between px-4 pt-[calc(max(12px,env(safe-area-inset-top))+52px)] pb-[max(18px,env(safe-area-inset-bottom))]"
      >
        <Panel className="text-center">
          <LeafTag>
            COP31 · {cop31.city} · {cop31.dates}
          </LeafTag>
          <h1 className="mt-3 text-[40px] leading-[1.02] font-black text-brand-blue sm:text-[46px]">
            COP31&apos;de
            <br />
            AK Gençlik
          </h1>
          <p className="mx-auto mt-3 max-w-[22rem] text-[16px] leading-snug font-bold text-balance text-brand-green">
            {cover.subtitle}
          </p>
        </Panel>

        <div data-hero-hint className="flex flex-col items-center text-center">
          <span className="text-[13px] font-black text-brand-navy">Antalya&apos;dan Dünyaya</span>
          <span className="mt-0.5 text-[12px] font-medium text-brand-ink">Aşağı kaydırın</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="mt-1 size-5 text-brand-green motion-safe:animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </section>

      {/* 1 — Biz kimiz: 81 il, 922 ilçe, 1.000.000+ üye */}
      <section data-stage="1" className="dn-bolum dn-anlati relative px-4">
        <Panel>
          <LeafTag>{genclikKollari.title}</LeafTag>
          <Baslik>{bizKimiz.title}</Baslik>
          <AltBaslik>{genclikKollari.subtitle}</AltBaslik>
          <div className="mt-4 flex justify-between gap-3 border-y border-brand-mist py-3">
            {stats.slice(0, 3).map((s) => (
              <Sayi
                key={s.label}
                small
                value={`${s.value !== undefined ? tr(s.value) : ""}${s.suffix ?? ""}`}
                label={s.label}
              />
            ))}
          </div>
          <Govde>{bizKimiz.paragraphs[0]}</Govde>
        </Panel>
      </section>

      {/* 2 — İklim eylemleri: iller yeşile döner */}
      <section data-stage="2" className="dn-bolum dn-anlati relative px-4">
        <Panel>
          <LeafTag>{stats[3].label}</LeafTag>
          <Baslik>{iklim.title}</Baslik>
          {/* Sıkı aralıklar + 3:2 kartlar: 390×844'te bölüm tek ekrana sığar (fazladan kaydırma yok). */}
          <div className="mt-3 flex items-end gap-4">
            <Sayi value={tr(facts.saplings)} label="fidan" />
            <p className="min-w-0 pb-0.5 text-[14px] leading-snug font-bold text-brand-green">
              Üsküdar Gençlik Kolları Hatıra Ormanı ({facts.saplingsYear})
            </p>
          </div>
          <ul className="mt-3 grid gap-2">
            {iklim.items.slice(1).map((item) => (
              <YaprakMadde key={item}>{item}</YaprakMadde>
            ))}
          </ul>
          <PolaroidIkili>
            <Polaroid
              photo={photos.fidanDikimiGencler}
              caption="Fidan dikimi"
              rotate={-3}
              aspect="3 / 2"
              position="30% 35%"
            />
            <Polaroid
              photo={photos.gencIklimPanel}
              caption="Genç İklim · İstanbul"
              rotate={2.5}
              aspect="3 / 2"
              position="60% 40%"
            />
          </PolaroidIkili>
        </Panel>
      </section>

      {/* 3 — Gençlik buluşmaları ve şölen */}
      <section data-stage="3" className="dn-bolum dn-anlati relative px-4">
        <Panel>
          <LeafTag>Söz Gençlikte</LeafTag>
          <Baslik>{bulusmalar.title}</Baslik>
          <div className="mt-4 flex items-end gap-4">
            <Sayi value={`${facts.meetings}+`} label="buluşma" />
            <p className="min-w-0 pb-0.5 text-[14px] leading-snug font-bold text-brand-green">
              Son {facts.meetingsYears} yılda Cumhurbaşkanımızın katılımıyla
            </p>
          </div>
          <ol className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] font-bold text-brand-navy">
            {etkinlikler.map((e, i) => (
              <li key={e.title} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2 rounded-full bg-brand-orange" />
                {e.title}
                {i < etkinlikler.length - 1 ? (
                  <span aria-hidden="true" className="text-brand-ink/50">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>

          <h3 className="mt-6 text-[21px] leading-tight font-black text-brand-blue">{solenler.title}</h3>
          <div className="mt-3 flex items-end gap-4">
            <Sayi value={`${tr(facts.solenAttendees)}+`} label="genç" />
            <p className="min-w-0 pb-0.5 text-[14px] leading-snug font-bold text-brand-green">
              {facts.solenDate} · {facts.solenPlace}
            </p>
          </div>
          <Govde>{solenler.paragraphs[0]}</Govde>
          <PolaroidIkili>
            <Polaroid
              photo={photos.sozGenclikteAnkara}
              caption="Söz Gençlikte · Ankara"
              rotate={2.5}
              position="50% 35%"
            />
            <Polaroid
              photo={photos.solenKocaeliTribun}
              caption="Gençlik Şöleni · Kocaeli"
              rotate={-3}
              position="45% 55%"
            />
          </PolaroidIkili>
        </Panel>
      </section>

      {/* 4 — Antalya: COP31'de buradayız */}
      <section data-stage="4" className="dn-bolum dn-anlati relative px-4">
        <Panel>
          <LeafTag>{cop31.city}</LeafTag>
          <Baslik>COP31&apos;de buradayız</Baslik>
          <p className="mt-3 text-[24px] leading-none font-black text-brand-navy tabular-nums">{cop31.dates}</p>
          <p className="mt-1.5 text-[16px] font-bold text-brand-green">{cop31.venue}</p>
          <div className="mt-5 grid grid-cols-[40%_1fr] items-center gap-4">
            <Polaroid
              photo={photos.baskanVeCumhurbaskani}
              rotate={-2.5}
              aspect="1 / 1"
              position="50% 26%"
              sizes="(max-width: 520px) 38vw, 190px"
            />
            <div className="min-w-0">
              <p className="text-[15px] leading-snug font-black text-brand-blue">{baskanMesaji.name}</p>
              <p className="mt-1 text-[13px] leading-snug font-bold text-brand-green">{baskanMesaji.role}</p>
            </div>
          </div>
          <blockquote className="mt-4 border-l-[3px] border-brand-green pl-3 text-[16px] leading-[1.6] font-medium text-pretty text-brand-ink">
            {baskanMesaji.paragraphs[0]}
          </blockquote>
        </Panel>
      </section>

      {/* 5 — Dünya: COP31'e gelen dünya */}
      <section data-stage="5" className="dn-bolum dn-anlati relative px-4">
        <Panel>
          <LeafTag>{backCover.line1}</LeafTag>
          <Baslik>{backCover.line2}</Baslik>
          <Govde>{kapanisCumleleri[0]}</Govde>
          <Govde>{kapanisCumleleri[kapanisCumleleri.length - 1]}</Govde>
        </Panel>
      </section>

      {/* 6 — Kapak finali: Gezegenimiz Ortak Evimizdir (görsel sahne sabit katmanda) */}
      <section data-stage="6" className="dn-bolum relative" aria-label={cover.slogan}>
        <p className="sr-only">{cover.slogan}</p>
      </section>

      <DunyaKapanis />
    </>
  );
}
