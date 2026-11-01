import { baskanMesaji, backCover, cop31, facts, genclikKollari, iklim } from "@/lib/content";
import { photos } from "@/lib/photos";
import Polaroid from "./Polaroid";
import RevealScope, { Reveal } from "./RevealScope";

const n = (v: number) => v.toLocaleString("tr-TR");

const STATS = [
  { value: n(facts.provinces), label: "İl", note: "Her ilde teşkilat" },
  { value: n(facts.districts), label: "İlçe", note: "Yerel yaşamın içinde" },
  {
    value: `${n(facts.meetings)}+`,
    label: "Gençlik buluşması",
    note: `Son ${facts.meetingsYears} yılda, Cumhurbaşkanımızın katılımıyla`,
  },
  {
    value: `${n(facts.solenAttendees)}+`,
    label: "Genç, tek stadyumda",
    note: `Bir Gençlik Şöleni · ${facts.solenPlace}, ${facts.solenDate}`,
  },
] as const;

/** "Genç İklim: … Kampı — 21-23 Ağustos 2026, İstanbul" → başlık / alt başlık / tarih. */
const [gencIklimFull, gencIklimWhen] = iklim.items[1].split(" — ");
const [gencIklimName, gencIklimKind] = gencIklimFull.split(": ");
/** "Üsküdar Gençlik Kolları Hatıra Ormanı — 300 fidan (2025)" → yer adı. */
const hatiraOrmani = iklim.items[0].split(" — ")[0];

const WIDE = "(max-width: 600px) 88vw, 500px";
const HALF = "(max-width: 600px) 46vw, 270px";

/**
 * Beyaz bölüm — "Gençliğin cevabı": 1.000.000+ genç, 300 fidan (Hatıra
 * Ormanı), Genç İklim kampı, fidan/orman etkinlikleri (polaroidler) ve
 * Başkan'ın mesajından alıntı.
 */
export default function Answer() {
  return (
    <section
      aria-label="Gençliğin cevabı"
      className="relative z-10 -mt-[24svh] bg-white text-brand-ink motion-reduce:mt-0"
    >
      <RevealScope className="mx-auto w-full max-w-[560px] px-5 pt-4 pb-20">
        {/* 1.000.000+ */}
        <Reveal>
          <div className="text-center">
            <p className="text-[clamp(2.9rem,13.5vw,5rem)] leading-none font-black tracking-[-0.02em] text-brand-blue tabular-nums">
              {n(facts.members)}+
            </p>
            <p className="mt-2 text-xl font-bold text-brand-green">genç üye</p>
            <p className="mx-auto mt-4 max-w-[26rem] text-[15px] leading-relaxed font-medium">
              {genclikKollari.subtitle}.
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-10">
          <ul className="grid grid-cols-2 gap-3">
            {STATS.map((s) => (
              <li key={s.label} className="rounded-2xl bg-brand-mist px-4 py-4">
                <span className="block text-[1.7rem] leading-none font-black text-brand-blue tabular-nums">{s.value}</span>
                <span className="mt-1.5 block text-[13px] leading-tight font-bold text-brand-green">{s.label}</span>
                <span className="mt-1 block text-[11px] leading-snug">{s.note}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* İklim eylemleri */}
        <div className="mt-20">
          <Reveal>
            <span className="leaf-tag">{iklim.title}</span>
            <h3 className="mt-4 text-[1.7rem] leading-tight font-black text-brand-blue">
              Nabzı yeşile çeviren adımlar
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed">
              Gençler sahada: fidan dikiyor, ormanı temizliyor, iklim üzerine düşünüp konuşuyor.
            </p>
          </Reveal>

          <Reveal className="mt-10">
            <div className="flex items-end gap-4">
              <span className="text-[4.5rem] leading-[0.85] font-black text-brand-green tabular-nums">
                {n(facts.saplings)}
              </span>
              <span className="pb-1 text-base leading-snug font-bold text-brand-blue">
                fidan
                <span className="block text-[13px] font-medium text-brand-ink">
                  {hatiraOrmani}, {facts.saplingsYear}
                </span>
              </span>
            </div>
          </Reveal>

          <div className="mt-8">
            <Reveal className="w-[88%]">
              <Polaroid
                photo={photos.hatiraOrmaniTabela}
                sizes={WIDE}
                aspect="4 / 3"
                rotate={-2.5}
              />
            </Reveal>
            <Reveal className="relative z-10 -mt-8 ml-auto w-[72%]">
              <Polaroid
                photo={photos.fidanDikimiGencler}
                sizes="(max-width: 600px) 64vw, 360px"
                aspect="4 / 3"
                rotate={3}
                objectPosition="35% 40%"
              />
            </Reveal>
          </div>

          <Reveal className="mt-16">
            <h4 className="text-xl leading-tight font-black text-brand-blue">{gencIklimName}</h4>
            <p className="mt-1 text-[14px] leading-snug font-bold text-brand-green">
              {gencIklimKind} · {gencIklimWhen}
            </p>
          </Reveal>
          <Reveal className="mt-6">
            <Polaroid
              photo={photos.gencIklimPanel}
              sizes={WIDE}
              aspect="16 / 10"
              rotate={-1.5}
              objectPosition="58% 45%"
            />
          </Reveal>

          <Reveal className="mt-14">
            <div className="grid grid-cols-2 items-start gap-4">
              <Polaroid photo={photos.fidanDikimiEkip} sizes={HALF} aspect="3 / 4" rotate={-3} objectPosition="60% 50%" />
              <Polaroid
                photo={photos.copToplamaOrman}
                sizes={HALF}
                aspect="3 / 4"
                rotate={2.5}
                objectPosition="50% 70%"
                className="mt-6"
              />
            </div>
            <p className="mt-5 text-center text-[13px] font-bold text-brand-green">{iklim.items[2]}</p>
          </Reveal>
        </div>

        {/* Başkan'ın mesajı */}
        <figure className="mt-20">
          <Reveal>
            <span className="leaf-tag">Başkanımızın mesajı</span>
          </Reveal>
          <Reveal className="mx-auto mt-8 w-[84%]">
            <Polaroid
              photo={photos.baskanVeCumhurbaskani}
              sizes={WIDE}
              aspect="4 / 3"
              rotate={2}
              objectPosition="50% 30%"
            />
          </Reveal>
          <Reveal className="mt-8">
            <blockquote className="relative border-l-4 border-brand-green pl-5">
              <span
                aria-hidden="true"
                className="absolute -top-6 left-3 font-script text-[4rem] leading-none text-brand-green/35"
              >
                &ldquo;
              </span>
              <p className="relative text-[16px] leading-relaxed font-medium text-brand-ink">{baskanMesaji.paragraphs[0]}</p>
            </blockquote>
            <figcaption className="mt-5 pl-6">
              <span className="block text-lg font-black text-brand-blue">{baskanMesaji.name}</span>
              <span className="block text-[13px] font-bold text-brand-green">{baskanMesaji.role}</span>
            </figcaption>
          </Reveal>
        </figure>

        {/* COP31 */}
        <Reveal className="mt-20">
          <div className="relative overflow-hidden rounded-3xl bg-brand-mist px-6 py-8 text-center">
            <svg
              aria-hidden="true"
              viewBox="0 0 400 400"
              className="pointer-events-none absolute -right-24 -bottom-28 size-72"
              fill="none"
            >
              <circle cx="200" cy="200" r="190" stroke="#0C77B6" strokeOpacity="0.12" />
              <circle cx="200" cy="200" r="140" stroke="#47B27A" strokeOpacity="0.25" />
              <circle cx="200" cy="200" r="90" stroke="#0C77B6" strokeOpacity="0.14" strokeDasharray="3 7" />
            </svg>
            <p className="relative text-sm font-bold text-brand-green">{backCover.line1}</p>
            <p className="relative mt-2 text-[2rem] leading-none font-black text-brand-blue">{cop31.city}</p>
            <p className="relative mt-2 text-xl leading-tight font-black text-brand-blue">{cop31.dates}</p>
            <p className="relative mt-1 text-[15px] font-medium">{cop31.venue}</p>
            <p className="relative mx-auto mt-5 max-w-[20rem] text-base leading-snug font-bold text-brand-navy">
              {backCover.line2}
            </p>
          </div>
        </Reveal>
      </RevealScope>
    </section>
  );
}
