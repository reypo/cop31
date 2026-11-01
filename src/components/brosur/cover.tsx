/**
 * Sayfa 1 — Kapak: broşür kapağının yeniden kurulumu.
 * 1) büyük daire içinde küre fotoğrafı, 2) sol altta lacivert→mavi gradyan
 * daire içinde el yazısı slogan, 3) solda ince çizgili yarım halka,
 * 4) etrafta iki ince mavi yay. Açılış animasyonu yalnızca CSS (JS beklemez).
 */

import Image from "next/image";
import { cop31, cover } from "@/lib/content";
import { logos, photos } from "@/lib/photos";
import { d } from "./ui";

/** SVG koordinatları (viewBox 0 0 400 400); küre dairesinin merkezi ve yarıçapı. */
const CX = 240;
const CY = 152;

function polar(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [+(CX + r * Math.cos(a)).toFixed(2), +(CY + r * Math.sin(a)).toFixed(2)];
}

/** Merkez etrafında a0° → a1° (saat yönü) yay yolu. */
function arc(r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0}A${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

function CoverArt() {
  const space = cover.slogan.indexOf(" ");
  const sloganFirst = cover.slogan.slice(0, space);
  const sloganRest = cover.slogan.slice(space + 1);
  const [ox, oy] = polar(158, 22);
  const [gx, gy] = polar(168, 90);
  return (
    <div className="br-cover-art relative mx-auto aspect-square w-full max-w-[min(420px,46svh)]">
      {/* 3 + 4: yarım halka ve yaylar (fotoğrafın arkasında) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full overflow-visible"
        fill="none"
      >
        <path
          className="br-c br-c-spin"
          style={d(250)}
          d={arc(170, 96, 250)}
          stroke="var(--color-brand-green)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="4 6"
        />
        <path
          className="br-c br-c-spin"
          style={d(380)}
          d={arc(186, 112, 238)}
          stroke="var(--color-brand-blue)"
          strokeOpacity="0.45"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="4 6"
        />
        <path
          className="br-c br-c-draw"
          style={d(500)}
          d={arc(158, -78, 22)}
          pathLength={1}
          stroke="var(--color-brand-blue)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          className="br-c br-c-draw"
          style={d(750)}
          d={arc(168, 24, 90)}
          pathLength={1}
          stroke="var(--color-brand-blue)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle className="br-c br-c-fade" style={d(1700)} cx={ox} cy={oy} r="5" fill="var(--color-brand-orange)" />
        <circle className="br-c br-c-fade" style={d(1900)} cx={gx} cy={gy} r="4" fill="var(--color-brand-green)" />
      </svg>

      {/* 1: küre fotoğrafı dairesel maskede */}
      <div
        className="br-c br-c-scale br-globe absolute overflow-hidden rounded-full bg-[#0f3b2e]"
        style={d(80, { left: "24%", top: "2%", width: "72%", height: "72%" })}
      >
        <Image
          src={photos.globeFoliage.src}
          width={photos.globeFoliage.width}
          height={photos.globeFoliage.height}
          alt={photos.globeFoliage.alt}
          sizes="(max-width: 480px) 72vw, 310px"
          preload
          className="h-full w-full object-cover"
          style={{ objectPosition: "50% 56%" }}
        />
      </div>

      {/* 2: gradyan daire + slogan */}
      <div
        className="br-c br-c-pop br-disc absolute flex items-center justify-center rounded-full"
        style={d(420, { left: "0%", bottom: "3%", width: "52%", height: "52%" })}
      >
        <p className="br-slogan -rotate-6 text-center font-script leading-[1.08] text-white">
          {sloganFirst}
          <br />
          {sloganRest}
        </p>
      </div>
    </div>
  );
}

export function Cover() {
  const space = cover.title.indexOf(" ");
  const line1 = cover.title.slice(0, space);
  const line2 = cover.title.slice(space + 1);

  return (
    <section
      id="sayfa-1"
      aria-labelledby="sayfa-1-baslik"
      className="br-page br-cover relative flex min-h-svh flex-col overflow-clip bg-brand-paper"
    >
      <div className="relative mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6 pt-[4.5rem] pb-6 sm:pt-20">
        <div>
          <p className="br-c br-c-down leaf-tag" style={d(40)}>
            COP31 · {cop31.city} · {cop31.dates}
          </p>
          <h1
            id="sayfa-1-baslik"
            className="br-c br-c-down mt-4 text-[2.85rem] leading-[0.98] font-black tracking-[-0.01em] text-brand-blue sm:text-[3.4rem]"
            style={d(120)}
          >
            {line1}
            <br />
            {line2}
          </h1>
          <p
            className="br-c br-c-down mt-3 max-w-[17.5rem] text-[15px] leading-snug font-bold text-brand-green"
            style={d(220)}
          >
            {cover.subtitle}
          </p>
        </div>

        <div className="flex flex-1 items-center py-4">
          <CoverArt />
        </div>

        <div className="br-c br-c-fade flex items-center gap-3 pt-2" style={d(900)}>
          <Image
            src={logos.genclikKollari.src}
            width={logos.genclikKollari.width}
            height={logos.genclikKollari.height}
            alt={logos.genclikKollari.alt}
            sizes="44px"
            className="size-11 shrink-0"
          />
          <Image
            src={logos.akParti.src}
            width={logos.akParti.width}
            height={logos.akParti.height}
            alt={logos.akParti.alt}
            sizes="36px"
            className="h-11 w-auto shrink-0"
          />
          <p className="min-w-0 flex-1 text-[12px] leading-tight font-bold text-brand-blue">
            {cover.org}
            <span className="mt-0.5 block font-medium text-brand-ink">{cop31.venue}</span>
          </p>
          <span className="br-hint flex shrink-0 flex-col items-center text-[10px] font-bold text-brand-blue/80">
            Kaydırın
            <svg aria-hidden="true" viewBox="0 0 16 10" className="mt-0.5 h-2.5 w-4">
              <path d="M2 2l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}
