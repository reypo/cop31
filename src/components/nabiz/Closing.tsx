import Image from "next/image";
import { backCover, cover, socials } from "@/lib/content";
import { logos } from "@/lib/photos";
import { SOURCE_NOTES } from "./data";

const NOTES = [
  SOURCE_NOTES.CO2_TONS_PER_YEAR,
  SOURCE_NOTES.CO2_PPM_2024,
  SOURCE_NOTES.PREINDUSTRIAL_PPM,
  SOURCE_NOTES.ICE_CORE_800K,
  SOURCE_NOTES.ANOMALIES,
  SOURCE_NOTES.STRIPE_STOPS,
] as const;

/** Ortak kapanış bloğu: slogan, logolar, kurum adı, sosyal hesaplar, web sitesi, veri notları. */
export default function Closing() {
  const site = socials.find((s) => s.name === "Web");
  const accounts = socials.filter((s) => s.name !== "Web");

  return (
    <footer className="bg-white px-5 pt-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center text-brand-ink">
      <div className="mx-auto w-full max-w-[560px]">
        <p className="font-script text-[2.6rem] leading-[1.15] text-brand-green sm:text-5xl">{cover.slogan}</p>

        <div className="mt-10 flex items-center justify-center gap-7">
          <Image
            src={logos.akParti.src}
            width={logos.akParti.width}
            height={logos.akParti.height}
            alt={logos.akParti.alt}
            sizes="64px"
            className="h-[4.5rem] w-auto"
          />
          <span aria-hidden="true" className="h-12 w-px bg-brand-mist" />
          <Image
            src={logos.genclikKollari.src}
            width={logos.genclikKollari.width}
            height={logos.genclikKollari.height}
            alt={logos.genclikKollari.alt}
            sizes="80px"
            className="h-[4.5rem] w-auto"
          />
        </div>

        <p className="mt-6 text-lg leading-tight font-black text-brand-blue">{cover.org}</p>
        <p className="mt-1 text-sm font-bold text-brand-green">{backCover.quote}</p>

        <Image
          src={logos.sozGenclikteTurkiye.src}
          width={logos.sozGenclikteTurkiye.width}
          height={logos.sozGenclikteTurkiye.height}
          alt={logos.sozGenclikteTurkiye.alt}
          sizes="200px"
          className="mx-auto mt-7 h-10 w-auto"
        />

        <p className="mt-9 text-[15px] font-black text-brand-navy">@{backCover.social.handle}</p>
        <ul className="mt-3 flex flex-wrap justify-center gap-2" aria-label="Sosyal medya hesapları">
          {accounts.map((s) => (
            <li key={s.name}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.name}: ${s.label}`}
                className="inline-flex items-center rounded-full border border-brand-green/45 bg-white px-3.5 py-2 text-[13px] font-bold text-brand-teal transition-colors hover:border-brand-green hover:bg-brand-mist focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                {s.name}
              </a>
            </li>
          ))}
        </ul>

        {site ? (
          <a
            href={site.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block text-xl font-black text-brand-blue underline decoration-brand-green decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            {site.label}
          </a>
        ) : null}

        <div className="mt-12 rounded-2xl bg-brand-mist px-4 py-4 text-left">
          <p className="text-[11px] font-bold text-brand-navy">Veri notları (yaklaşık değerler)</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[10.5px] leading-snug text-brand-ink/85">
            {NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
