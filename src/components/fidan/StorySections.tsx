import Image from "next/image";
import type { ReactNode } from "react";
import {
  backCover,
  baskanMesaji,
  bizKimiz,
  bulusmalar,
  cop31,
  cover,
  facts,
  iklim,
  solenler,
  vizyon,
} from "@/lib/content";
import { photos } from "@/lib/photos";
import Polaroid from "./Polaroid";

const fmt = (n: number) => n.toLocaleString("tr-TR");

const BODY = "fidan-body text-[14.5px] leading-[1.58] font-medium text-brand-ink md:text-[15.5px] md:leading-[1.62]";
const H2 = "fidan-h2 mt-3 text-balance text-[1.5rem] leading-[1.12] font-black text-brand-blue md:text-[2rem]";
const NOTE = "text-balance text-[12.5px] leading-snug font-bold text-brand-teal md:text-[14px]";

/**
 * "21-23 Ağustos 2026" gibi tarihler satır sonunda bölünmesin; sayı aralığındaki
 * tire, broşürdeki "9–20 Kasım" gibi en dash olsun.
 */
function keepDates(text: string): ReactNode {
  const parts = text.replace(/(\d)-(\d)/g, "$1–$2").split(/(\d{1,2}(?:–\d{1,2})? \p{Lu}\p{Ll}+ \d{4})/u);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** "COP31'de AK Gençlik" → ["COP31'de", "AK Gençlik"]: marka adı bölünmesin. */
function splitTitle(title: string): [string, string] {
  const i = title.indexOf(" AK ");
  return i > 0 ? [title.slice(0, i), title.slice(i + 1)] : [title, ""];
}

/**
 * Bir bölüm. Mobilde: üstte boşluk (fidan bu sürede büyür), altta kart.
 * Kart `position: sticky; bottom` ile ekranın altında durur; bir sonraki
 * bölüm gelirken yerinde söner (FidanStory). Masaüstünde sağ sütunda,
 * dikey ortalı, normal akışta. data-fidan-section adı FidanStory'deki
 * kamera ve büyüme zamanlamasıyla eşleşir.
 */
function Screen({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section
      data-fidan-section={name}
      className="fidan-sec relative flex flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:min-h-svh md:justify-center md:px-0 md:py-16"
    >
      <div aria-hidden="true" className="fidan-spacer" />
      {children}
    </section>
  );
}

/** Metin kartı. Pencere (data-fidan-win) mobilde en fazla 46svh; taşan içerik pencerede akar. */
function Card({ tag, children }: { tag: string; children: ReactNode }) {
  return (
    <div
      data-fidan-card=""
      className="fidan-card flex w-full flex-col rounded-[20px] border border-brand-mist bg-white/95 shadow-[0_14px_34px_-16px_rgb(27_79_156/0.45)] md:max-w-[480px]"
    >
      <div data-fidan-win="" className="fidan-win min-h-0 rounded-[20px]">
        <div className="fidan-flow p-[18px] md:p-7">
          <span className="leaf-tag">{tag}</span>
          {children}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, size = "md" }: { value: string; label?: string; size?: "md" | "lg" }) {
  return (
    <div className="shrink-0">
      <div
        className={`leading-none font-black whitespace-nowrap text-brand-blue tabular-nums ${
          size === "lg" ? "text-[2.2rem] md:text-[2.8rem]" : "text-[1.4rem] md:text-[1.8rem]"
        }`}
      >
        {value}
      </div>
      {label ? (
        <div className="mt-1 text-[11.5px] leading-snug font-bold text-brand-teal md:text-[13px]">{label}</div>
      ) : null}
    </div>
  );
}

export default function StorySections() {
  const [titleA, titleB] = splitTitle(cover.title);
  return (
    <>
      {/* 0 — Tohum (kahraman). Mobilde üstte sabit durur, kökler büyürken yerinde söner. */}
      <section
        data-fidan-section="tohum"
        className="fidan-hero relative px-4 pt-[calc(max(0.75rem,env(safe-area-inset-top))+2.9rem)] md:flex md:min-h-svh md:flex-col md:justify-center md:px-0 md:py-16"
      >
        <div
          data-fidan-card=""
          className="fidan-hero-card md:max-w-[480px] motion-reduce:rounded-[20px] motion-reduce:border motion-reduce:border-brand-mist motion-reduce:bg-white motion-reduce:p-5 motion-reduce:shadow-[0_14px_34px_-16px_rgb(27_79_156/0.45)]"
        >
          <span className="leaf-tag">Bir Fidanın Yolculuğu</span>
          <h1 className="mt-4 text-[2.7rem] leading-[1.02] font-black tracking-[-0.015em] text-brand-blue md:text-[3.5rem]">
            {/* Tek metin bloğu (LCP adayı); "AK Gençlik" hiçbir genişlikte bölünmez. */}
            {titleA}
            {titleB ? (
              <>
                <br />
                <span className="whitespace-nowrap">{titleB}</span>
              </>
            ) : null}
          </h1>
          <p className="mt-3 text-balance text-[1.05rem] leading-snug font-bold text-brand-green md:text-[1.3rem]">
            {cover.subtitle}
          </p>
          <p className="mt-3 text-[13px] font-medium text-brand-ink md:text-[15px]">
            <span className="whitespace-nowrap">{cop31.dates}</span> ·{" "}
            <span className="whitespace-nowrap">{cop31.venue}</span>
          </p>
        </div>
        {/* Hareket azaltılmışsa ağaç zaten son karede: ipucu gizlenir. */}
        <div
          data-fidan-hint=""
          className="fidan-hint pointer-events-none absolute inset-x-0 flex flex-col items-center gap-1 text-[12px] font-bold text-brand-teal motion-reduce:hidden md:static md:mt-12 md:flex-row md:gap-1.5"
        >
          <span>Kaydır, fidan büyüsün</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 motion-safe:animate-bounce" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* 1 — Kökler: Biz Kimiz */}
      <Screen name="kok">
        <Card tag="Kökler">
          <h2 className={H2}>{bizKimiz.title}</h2>
          <div className="mt-3.5 flex flex-wrap items-start gap-x-5 gap-y-2">
            <Stat value={`${fmt(facts.members)}+`} label="Genç Üye" />
            <Stat value={String(facts.provinces)} label="İl" />
            <Stat value={String(facts.districts)} label="İlçe" />
          </div>
          <p className={`mt-3.5 ${BODY}`}>{bizKimiz.paragraphs[0]}</p>
          <p className="mt-3 flex items-center gap-2 text-[12px] leading-snug font-bold text-brand-teal md:text-[13px]">
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-brand-orange ring-2 ring-white" />
            Köklerin ucundaki 81 nokta: 81 il
          </p>
        </Card>
      </Screen>

      {/* 2 — Gövde: vizyon */}
      <Screen name="govde">
        <Card tag="Gövde">
          <h2 className={H2}>{vizyon.title}</h2>
          <p className={`mt-3 ${BODY}`}>{vizyon.intro}</p>
        </Card>
      </Screen>

      {/* 3 — Gövdedeki iki boğum: 2017 ve TBMM */}
      <Screen name="bogum">
        <Card tag="Gövdedeki iki boğum">
          {vizyon.items.slice(1).map((item) => (
            <div key={item.title} className="fidan-item mt-3.5 flex gap-3">
              <span
                aria-hidden="true"
                className="mt-[5px] size-3 shrink-0 rounded-full bg-brand-orange shadow-[0_0_0_2.5px_#fff,0_1px_4px_rgb(0_0_0/0.25)]"
              />
              <div className="min-w-0">
                <h3 className="text-balance text-[1.06rem] leading-snug font-black text-brand-blue md:text-[1.25rem]">
                  {item.title}
                </h3>
                <p className={`mt-1 ${BODY}`}>{item.text}</p>
              </div>
            </div>
          ))}
        </Card>
      </Screen>

      {/* 4 — Dallar: Gençlik Buluşmaları */}
      <Screen name="bulusma">
        <Card tag="Dallar">
          <h2 className={H2}>{bulusmalar.title}</h2>
          <div className="mt-3 flex items-center gap-3">
            <Stat value={`${facts.meetings}+`} size="lg" />
            <p className={NOTE}>
              gençlik buluşması: son {facts.meetingsYears} yılda, Cumhurbaşkanımızın katılımıyla
            </p>
          </div>
          <p className={`mt-3 ${BODY}`}>{bulusmalar.paragraphs[2]}</p>
        </Card>
      </Screen>

      {/* 5 — Dallar: Şölen */}
      <Screen name="solen">
        <Card tag="Dallar">
          <h2 className={H2}>{solenler.title}</h2>
          <div className="mt-3 flex items-center gap-3">
            <Stat value={`${fmt(facts.solenAttendees)}+`} label="genç" size="lg" />
            <p className={NOTE}>
              <span className="block whitespace-nowrap">{facts.solenDate}</span>
              <span className="block">{facts.solenPlace}</span>
            </p>
          </div>
          <p className={`mt-3 ${BODY}`}>{solenler.paragraphs[0]}</p>
        </Card>
      </Screen>

      {/* 6 — Yapraklar: Hatıra Ormanı */}
      <Screen name="yaprak">
        <Card tag="Yapraklar">
          <h2 className={H2}>{iklim.title}</h2>
          <div className="mt-3 flex items-center gap-3">
            <Stat value={String(facts.saplings)} size="lg" />
            <p className={NOTE}>{iklim.items[0]}</p>
          </div>
          <div className="fidan-pair mt-5 grid grid-cols-2 gap-3 px-1">
            <Polaroid
              photo={photos.hatiraOrmaniTabela}
              caption="Hatıra Ormanı"
              pos="45% 50%"
              rot={-3}
              sizes="(min-width: 768px) 220px, 45vw"
            />
            <Polaroid
              photo={photos.fidanDikimiBaskan}
              caption="Fidan dikimi"
              pos="66% 30%"
              rot={3}
              sizes="(min-width: 768px) 220px, 45vw"
            />
          </div>
        </Card>
      </Screen>

      {/* 7 — Yapraklar: Genç İklim */}
      <Screen name="iklim">
        <Card tag="Yapraklar">
          <ul className="mt-3 space-y-2">
            {iklim.items.slice(1).map((item) => (
              <li key={item} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-[6px] h-[9px] w-[9px] shrink-0 rounded-[0_60%_0_60%] bg-brand-green" />
                <span className="text-balance text-[14.5px] leading-snug font-bold text-brand-blue md:text-[16px]">
                  {keepDates(item)}
                </span>
              </li>
            ))}
          </ul>
          <div className="fidan-pair mt-5 grid grid-cols-2 gap-3 px-1">
            <Polaroid
              photo={photos.gencIklimPanel}
              caption="Genç İklim"
              pos="60% 40%"
              rot={2}
              sizes="(min-width: 768px) 220px, 45vw"
            />
            <Polaroid
              photo={photos.fidanDikimiGencler}
              caption="Fidan dikimi"
              pos="50% 40%"
              rot={-3}
              sizes="(min-width: 768px) 220px, 45vw"
            />
          </div>
        </Card>
      </Screen>

      {/* 8 — Orman: Başkan'ın mesajı (silüet ağaçlar yanlardan gelir) */}
      <Screen name="baskan">
        <Card tag="Orman">
          <figure className="mt-3">
            <span aria-hidden="true" className="-mb-1 block h-7 font-display text-[3.2rem] leading-[0.9] font-black text-brand-green">
              &ldquo;
            </span>
            <blockquote className={BODY}>{baskanMesaji.paragraphs[0]}</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-full border-[2.5px] border-brand-green bg-brand-mist">
                <Image
                  src={photos.baskanVeCumhurbaskani.src}
                  alt={baskanMesaji.name}
                  fill
                  sizes="140px"
                  className="scale-[2.6] object-cover"
                  style={{ objectPosition: "33% 30%", transformOrigin: "33% 33%" }}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] leading-tight font-black text-brand-blue">{baskanMesaji.name}</span>
                <span className="block text-[12px] leading-snug font-bold text-brand-teal">{baskanMesaji.role}</span>
              </span>
            </figcaption>
          </figure>
        </Card>
      </Screen>

      {/* 9 — Orman: slogan, ortada. Fidan kahraman kalır; altında kapanış bloğu. */}
      <Screen name="orman">
        <div
          data-fidan-card=""
          className="fidan-card fidan-final mx-auto w-full max-w-[420px] px-3 pt-5 pb-3 text-center md:max-w-[480px]"
        >
          <p className="font-script text-[2.9rem] leading-[1.05] text-balance text-brand-green md:text-[3.6rem]">{cover.slogan}</p>
          <p className="mt-2 text-balance text-[1rem] leading-snug font-black text-brand-blue md:text-[1.2rem]">
            {backCover.line2}
          </p>
          <p className="mt-1.5 text-balance text-[12.5px] font-medium text-brand-ink md:text-[13.5px]">
            <span className="whitespace-nowrap">{backCover.line1}</span> ·{" "}
            <span className="whitespace-nowrap">{cop31.dates}</span> ·{" "}
            <span className="whitespace-nowrap">{cop31.venue}</span>
          </p>
        </div>
      </Screen>
    </>
  );
}
