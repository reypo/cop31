import Image from "next/image";
import { backCover, cop31, cover, socials } from "@/lib/content";
import { logos } from "@/lib/photos";

/**
 * Ortak kapanış bloğu (brief §7): logolar, kurum adı, sosyal hesaplar, site, slogan.
 * Son bölüm (data-stage 7): final sahnesinin (sabit katman) üstüne bir sayfa
 * gibi kayarak gelir; en az bir ekran boyu, uzunsa içinde kaydırılır.
 */
export default function DunyaKapanis() {
  const sosyal = socials.filter((s) => s.name !== "Web");
  const web = socials.find((s) => s.name === "Web");

  return (
    <footer
      data-stage="7"
      className="dn-bolum relative z-20 flex flex-col justify-center rounded-t-[28px] bg-white px-4 pt-16 pb-[max(2.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_-22px_rgb(27_79_156/0.28)] ring-1 ring-brand-blue/5"
    >
      <div className="mx-auto w-full max-w-[480px] text-center">
        <div className="flex items-center justify-center gap-6">
          <Image
            src={logos.akParti.src}
            alt={logos.akParti.alt}
            width={logos.akParti.width}
            height={logos.akParti.height}
            sizes="56px"
            className="h-[60px] w-auto"
          />
          <span aria-hidden="true" className="h-11 w-px bg-brand-mist" />
          <Image
            src={logos.genclikKollari.src}
            alt={logos.genclikKollari.alt}
            width={logos.genclikKollari.width}
            height={logos.genclikKollari.height}
            sizes="64px"
            className="h-[60px] w-auto"
          />
        </div>

        <p className="mt-5 text-[21px] leading-tight font-black text-brand-blue">{cover.org}</p>
        <p className="mt-1.5 text-[14px] font-bold text-brand-green">{backCover.quote}</p>

        <Image
          src={logos.sozGenclikteTurkiye.src}
          alt={logos.sozGenclikteTurkiye.alt}
          width={logos.sozGenclikteTurkiye.width}
          height={logos.sozGenclikteTurkiye.height}
          sizes="180px"
          className="mx-auto mt-5 h-auto w-[180px]"
        />

        <ul className="mt-6 grid grid-cols-2 gap-2">
          {sosyal.map((s) => (
            <li key={s.name}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center rounded-2xl border border-brand-mist bg-white px-3 py-2 transition-colors hover:border-brand-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                <span className="text-[13px] font-black text-brand-navy">{s.name}</span>
                <span className="text-[12px] font-medium text-brand-ink">{s.label}</span>
              </a>
            </li>
          ))}
        </ul>

        {web ? (
          <a
            href={web.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 block rounded-2xl bg-brand-blue px-4 py-3 text-[17px] font-black text-white transition-colors hover:bg-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            {web.label}
          </a>
        ) : null}

        <p className="mt-7 font-script text-[clamp(30px,9.2vw,38px)] leading-[1.1] text-balance text-brand-green">
          {cover.slogan}
        </p>
        <p className="mt-2 text-[12px] font-bold text-brand-ink">
          {backCover.line1} · {cop31.dates} · {cop31.venue}
        </p>
      </div>
    </footer>
  );
}
