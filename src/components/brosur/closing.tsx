/**
 * Sayfa 12 — Arka kapak + ortak kapanış bloğu (logolar, kurum adı,
 * sosyal hesaplar, akgenclik.org.tr, slogan).
 */

import Image from "next/image";
import { backCover, cop31, cover, socials } from "@/lib/content";
import { logos } from "@/lib/photos";
import { SocialIcon } from "./icons";
import { Orbits, Sheet, d } from "./ui";

export function ClosingBlock() {
  const accounts = socials.filter((s) => s.name !== "Web");
  const web = socials.find((s) => s.name === "Web");
  const space = cover.slogan.indexOf(" ");
  const sloganFirst = cover.slogan.slice(0, space);
  const sloganRest = cover.slogan.slice(space + 1);

  return (
    <div className="flex w-full flex-col items-center text-center">
      <div data-a="pop" style={d(380)} className="flex items-center justify-center gap-5">
        <Image
          src={logos.akParti.src}
          width={logos.akParti.width}
          height={logos.akParti.height}
          alt={logos.akParti.alt}
          sizes="64px"
          className="h-[4.5rem] w-auto"
        />
        <Image
          src={logos.genclikKollari.src}
          width={logos.genclikKollari.width}
          height={logos.genclikKollari.height}
          alt={logos.genclikKollari.alt}
          sizes="76px"
          className="size-[4.75rem]"
        />
      </div>
      <p data-a="up" style={d(460)} className="mt-4 text-[15px] font-black text-brand-blue">
        {cover.org}
      </p>
      <Image
        data-a="up"
        style={d(520)}
        src={logos.sozGenclikteTurkiye.src}
        width={logos.sozGenclikteTurkiye.width}
        height={logos.sozGenclikteTurkiye.height}
        alt={logos.sozGenclikteTurkiye.alt}
        sizes="200px"
        className="mt-3 h-auto w-[200px]"
      />

      <ul data-a="up" style={d(600)} className="mt-6 flex items-center justify-center gap-3">
        {accounts.map((s) => (
          <li key={s.name}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${s.name}: ${s.label}`}
              className="flex size-11 items-center justify-center rounded-full bg-brand-blue text-white shadow-[0_8px_18px_-10px_rgb(12_119_182/0.9)] transition-colors hover:bg-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              <SocialIcon name={s.name} className="size-[1.3rem]" />
            </a>
          </li>
        ))}
      </ul>
      <p data-a="up" style={d(640)} className="mt-2.5 text-[13px] font-bold text-brand-blue">
        @{backCover.social.handle}
      </p>

      {web ? (
        <a
          data-a="up"
          style={d(700)}
          href={web.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-brand-green bg-white px-4 py-2 text-[14px] font-bold text-brand-teal transition-colors hover:bg-brand-green hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          <SocialIcon name="Web" className="size-[1.1rem]" />
          {web.label}
        </a>
      ) : null}

      <p data-a="up" style={d(800)} className="mt-7 font-script text-[2.4rem] leading-[1.05] text-brand-blue">
        {sloganFirst}
        <br />
        {sloganRest}
      </p>
      <p data-a="up" style={d(860)} className="mt-3 text-[11px] font-bold text-brand-ink/80">
        {backCover.line1} · {cop31.dates} · {cop31.venue}
      </p>
    </div>
  );
}

export function BackCover() {
  const quote = backCover.quote.replace(/^"|"$/g, "");
  return (
    <Sheet
      n={12}
      footer={false}
      decor={
        <>
          <Orbits className="-bottom-64 left-1/2 w-[36rem] -translate-x-1/2" dot={false} />
          <Orbits className="-top-24 -left-24 w-52" dashed />
        </>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center pb-4 text-center">
        <span data-a="down" style={d(0)} className="leaf-tag">
          {backCover.line1}
        </span>
        <h2
          id="sayfa-12-baslik"
          data-a="down"
          style={d(90)}
          className="mt-5 text-[1.7rem] leading-[1.15] font-black text-balance text-brand-blue"
        >
          “{quote}”
        </h2>
        <p data-a="down" style={d(170)} className="mt-3 text-[15px] leading-snug font-bold text-balance text-brand-green">
          {backCover.line2}
        </p>
        <span aria-hidden="true" className="my-7 h-px w-16 bg-brand-blue/25" />
        <ClosingBlock />
      </div>
    </Sheet>
  );
}
