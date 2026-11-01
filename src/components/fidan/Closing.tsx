import Image from "next/image";
import { backCover, baskanMesaji, cover, socials } from "@/lib/content";
import { logos, photos } from "@/lib/photos";

/**
 * 7. bölüm: Başkan'ın mesajı + ortak kapanış bloğu (logolar, teşkilat adı,
 * sosyal hesaplar, web sitesi). Slogan ("Gezegenimiz Ortak Evimizdir") bir
 * önceki bölümde, ormanın önünde; art arda iki kez görünmesin diye burada
 * tekrarlanmıyor.
 *
 * Bölüm en az 100svh; telefonda içerik viewport'tan uzun olabilir, o zaman
 * adımlayıcı bölüm içinde serbest kaydırmaya izin verir (son bölüm).
 * Masaüstünde iki sütun: mesaj solda, kapanış sağda; tek ekrana sığar.
 */
export default function Closing() {
  const web = socials.find((s) => s.name === "Web");
  const others = socials.filter((s) => s.name !== "Web");

  return (
    <section
      data-fidan-snap=""
      aria-label="Kapanış"
      className="fidan-closing relative z-10 flex flex-col justify-center border-t border-brand-mist bg-white px-4 pt-[calc(max(0.75rem,env(safe-area-inset-top))+3rem)] pb-[max(2rem,env(safe-area-inset-bottom))] md:px-6 md:py-16"
    >
      <div className="mx-auto grid w-full max-w-xl gap-9 md:max-w-[1040px] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-16">
        <figure className="mx-auto w-full max-w-[34rem]">
          <span aria-hidden="true" className="-mb-1 block h-8 font-display text-[3.4rem] leading-[0.9] font-black text-brand-green">
            &ldquo;
          </span>
          <blockquote className="text-[15px] leading-[1.6] font-medium text-brand-ink md:text-[16.5px]">
            {baskanMesaji.paragraphs[0]}
          </blockquote>
          <figcaption className="mt-5 flex items-center gap-3">
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

        <footer className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-7">
            <Image
              src={logos.akParti.src}
              width={logos.akParti.width}
              height={logos.akParti.height}
              alt={logos.akParti.alt}
              sizes="64px"
              className="h-[72px] w-auto"
            />
            <Image
              src={logos.genclikKollari.src}
              width={logos.genclikKollari.width}
              height={logos.genclikKollari.height}
              alt={logos.genclikKollari.alt}
              sizes="80px"
              className="h-[72px] w-auto"
            />
          </div>

          <p className="mt-4 text-balance text-[1.3rem] leading-tight font-black text-brand-blue md:text-[1.5rem]">{cover.org}</p>
          <p className="mt-2 text-[14px] font-bold text-brand-teal">{backCover.quote}</p>

          <Image
            src={logos.sozGenclikteTurkiye.src}
            width={logos.sozGenclikteTurkiye.width}
            height={logos.sozGenclikteTurkiye.height}
            alt={logos.sozGenclikteTurkiye.alt}
            sizes="220px"
            className="mt-6 h-auto w-[190px]"
          />

          <ul className="mt-7 grid w-full grid-cols-2 gap-2.5">
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
        </footer>
      </div>
    </section>
  );
}
