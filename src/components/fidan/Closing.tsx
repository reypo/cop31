import Image from "next/image";
import { backCover, cover, socials } from "@/lib/content";
import { logos } from "@/lib/photos";

/**
 * Ortak kapanış bloğu: logolar, teşkilat adı, sosyal hesaplar, web sitesi.
 * Slogan ("Gezegenimiz Ortak Evimizdir") hemen üstte, ormanın önünde ortada
 * duruyor ve bu bloğun başlığı işlevini görüyor; art arda iki kez görünmesin
 * diye burada tekrarlanmıyor. Aynı nedenle COP31/"Bugünü ve Geleceği…"
 * satırları da yalnızca sloganın altında.
 */
export default function Closing() {
  const web = socials.find((s) => s.name === "Web");
  const others = socials.filter((s) => s.name !== "Web");

  return (
    <footer className="relative z-10 border-t border-brand-mist bg-white px-4 pt-14 pb-[max(3rem,env(safe-area-inset-bottom))] md:pt-20">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
        <div className="flex items-center justify-center gap-7">
          <Image
            src={logos.akParti.src}
            width={logos.akParti.width}
            height={logos.akParti.height}
            alt={logos.akParti.alt}
            sizes="64px"
            className="h-[76px] w-auto"
          />
          <Image
            src={logos.genclikKollari.src}
            width={logos.genclikKollari.width}
            height={logos.genclikKollari.height}
            alt={logos.genclikKollari.alt}
            sizes="80px"
            className="h-[76px] w-auto"
          />
        </div>

        <p className="mt-5 text-balance text-[1.3rem] leading-tight font-black text-brand-blue md:text-[1.5rem]">{cover.org}</p>
        <p className="mt-2 text-[14px] font-bold text-brand-teal">{backCover.quote}</p>

        <Image
          src={logos.sozGenclikteTurkiye.src}
          width={logos.sozGenclikteTurkiye.width}
          height={logos.sozGenclikteTurkiye.height}
          alt={logos.sozGenclikteTurkiye.alt}
          sizes="220px"
          className="mt-7 h-auto w-[200px]"
        />

        <ul className="mt-9 grid w-full grid-cols-2 gap-2.5">
          {others.map((s) => (
            <li key={s.name}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center rounded-2xl border border-brand-mist bg-brand-mist/60 px-3 py-3 transition-colors hover:border-brand-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                <span className="text-[14px] leading-tight font-black text-brand-blue">{s.name}</span>
                <span className="mt-0.5 text-[12px] font-bold text-brand-teal">{s.label}</span>
              </a>
            </li>
          ))}
        </ul>

        {web ? (
          <a
            href={web.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-blue px-6 py-3 text-[16px] font-black text-white shadow-[0_8px_20px_-8px_rgb(12_119_182/0.7)] transition-colors hover:bg-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            {backCover.social.site}
          </a>
        ) : null}

      </div>
    </footer>
  );
}
