/**
 * Konsept D yapı taşları (sunucu bileşenleri): sayfa iskeleti, polaroid,
 * başlık, sayfa altı, yörünge süsleri, el çizimi ok.
 */

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import type { PhotoAsset } from "@/lib/photos";
import { pageNo, tempo } from "./data";
import { Page } from "./reveal";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Animasyon sırası için gecikme: data-a öğelerinde --d. */
export function d(ms: number, extra?: Vars): Vars {
  return { "--d": `${tempo(ms)}ms`, ...extra };
}

export type Tone = "paper" | "mist" | "navy";

const toneClass: Record<Tone, string> = {
  paper: "bg-brand-paper",
  mist: "bg-brand-mist",
  navy: "br-navy text-white",
};

type SheetProps = {
  n: number;
  tone?: Tone;
  children: ReactNode;
  /** Bölüm arkasındaki süs (absolute). */
  decor?: ReactNode;
  footer?: boolean;
  className?: string;
};

/** Tam ekran broşür sayfası: min 100svh, snap başı, ortalanmış sütun, sayfa altı. */
export function Sheet({ n, tone = "paper", children, decor, footer = true, className }: SheetProps) {
  return (
    <Page
      id={`sayfa-${n}`}
      aria-labelledby={`sayfa-${n}-baslik`}
      className={cx("br-page relative flex min-h-svh flex-col overflow-clip", toneClass[tone], className)}
    >
      {decor}
      <div className="relative mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6 pt-20 pb-8 sm:pt-24">
        {children}
        {footer ? <PageFooter n={n} tone={tone} /> : null}
      </div>
    </Page>
  );
}

export function PageFooter({ n, tone }: { n: number; tone: Tone }) {
  const dark = tone === "navy";
  return (
    <footer
      aria-hidden="true"
      className={cx(
        "mt-auto flex items-center gap-3 pt-10 text-[11px] font-bold",
        dark ? "text-white/70" : "text-brand-blue/70",
      )}
    >
      <span className={cx("tabular-nums text-[13px] font-black", dark ? "text-white" : "text-brand-blue")}>
        {pageNo(n)}
      </span>
      <span className={cx("h-px flex-1", dark ? "bg-white/30" : "bg-brand-blue/20")} />
      <span>COP31&apos;de AK Gençlik</span>
    </footer>
  );
}

type HeaderProps = {
  n: number;
  tag: string;
  title: ReactNode;
  subtitle?: ReactNode;
  dark?: boolean;
};

/** Yaprak etiket + 900 başlık + yeşil alt başlık; yukarıdan iner. */
export function SheetHeader({ n, tag, title, subtitle, dark }: HeaderProps) {
  return (
    <header>
      <span data-a="down" style={d(0)} className={cx("leaf-tag", dark && "br-leaf-light")}>
        {tag}
      </span>
      <h2
        id={`sayfa-${n}-baslik`}
        data-a="down"
        style={d(90)}
        className={cx(
          "mt-4 text-[clamp(1.375rem,7vw,2.25rem)] leading-[1.08] font-black text-balance",
          dark ? "text-white" : "text-brand-blue",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          data-a="down"
          style={d(170)}
          className={cx(
            "mt-3 text-[1.02rem] leading-snug font-bold text-pretty",
            dark ? "text-[#bfe8d2]" : "text-brand-green",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

/** Gövde paragrafları. */
export function Prose({
  paragraphs,
  delay = 260,
  className,
  first,
}: {
  paragraphs: readonly string[];
  delay?: number;
  className?: string;
  /** İlk paragrafı öne çıkar. */
  first?: boolean;
}) {
  return (
    <div className={cx("space-y-4 text-[15px] leading-[1.7] text-pretty", className)}>
      {paragraphs.map((p, i) => (
        <p
          key={i}
          data-a="up"
          style={d(delay + i * 70)}
          className={first && i === 0 ? "text-[1.05rem] leading-[1.6] font-medium text-brand-navy" : undefined}
        >
          {p}
        </p>
      ))}
    </div>
  );
}

type PolaroidProps = {
  photo: PhotoAsset;
  /** Son açı (derece), -3…+4. */
  rotate: number;
  /** CSS aspect-ratio, ör. "4 / 3". */
  aspect: string;
  sizes: string;
  /** object-position (yüzler için). */
  pos?: string;
  caption?: string;
  delay?: number;
  className?: string;
  style?: Vars;
  preload?: boolean;
};

/** Yeşil çerçeveli, turuncu pinli kart; girişte döndürülerek "masaya düşer". */
export function Polaroid({
  photo,
  rotate,
  aspect,
  sizes,
  pos = "50% 50%",
  caption,
  delay = 0,
  className,
  style,
  preload,
}: PolaroidProps) {
  const vars: Vars = { "--r": `${rotate}deg`, "--d": `${tempo(delay)}ms`, ...style };
  return (
    <figure data-a="drop" className={cx("polaroid br-polaroid", className)} style={vars}>
      <div className="relative overflow-hidden rounded-[6px] bg-brand-mist" style={{ aspectRatio: aspect }}>
        <Image
          src={photo.src}
          width={photo.width}
          height={photo.height}
          alt={photo.alt}
          sizes={sizes}
          preload={preload}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: pos }}
        />
      </div>
      {caption ? (
        <figcaption className="px-0.5 pt-2 pb-0.5 text-[11px] leading-snug font-bold text-brand-teal">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * Sayfa süsü yerleşimi: sağ üst köşe. Mobilde dış halka başlık satırının
 * (y ≈ 121 px) üstünde kalacak kadar köşede; geniş ekranda (lg) sütun
 * çok uzakta olduğundan daha büyük.
 */
export const ORBIT_CORNER = "-top-28 -right-28 w-60 lg:-top-24 lg:-right-24 lg:w-80";

/** İç içe ince daireler (broşür yörünge motifi). */
export function Orbits({
  className,
  color = "var(--color-brand-blue)",
  dashed = false,
  dot = true,
}: {
  className?: string;
  color?: string;
  dashed?: boolean;
  /** Dış yörüngede turuncu nokta. */
  dot?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className={cx("pointer-events-none absolute", className)}
      fill="none"
    >
      <circle cx="100" cy="100" r="98" stroke={color} strokeWidth="0.6" opacity="0.35" />
      <circle cx="100" cy="100" r="78" stroke={color} strokeWidth="0.6" opacity="0.28" strokeDasharray={dashed ? "2 3" : undefined} />
      <circle cx="100" cy="100" r="58" stroke={color} strokeWidth="0.6" opacity="0.22" />
      {dot ? <circle cx="100" cy="2" r="2.4" fill="var(--color-brand-orange)" opacity="0.9" /> : null}
    </svg>
  );
}

/** Küçük el çizimi ok. dir: okun sağa mı sola mı kıvrıldığı. */
export function HandArrow({
  className,
  flip = false,
  style,
}: {
  className?: string;
  flip?: boolean;
  style?: Vars;
}) {
  return (
    <svg
      aria-hidden="true"
      data-a="fade"
      viewBox="0 0 64 48"
      fill="none"
      className={cx("pointer-events-none", className)}
      style={{ transform: flip ? "scaleX(-1)" : undefined, ...style }}
    >
      <path
        d="M5 9c9-6 22-5 30 2 7 6 9 15 8 24"
        stroke="var(--color-brand-blue)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M36.5 29.5c2.6 2.4 4.6 4.6 6.6 7.4 1.6-3.1 3.7-5.6 6.6-8"
        stroke="var(--color-brand-blue)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Yeşil yaprak simgesi (taahhüt kutusu, liste imleri). */
export function LeafIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path
        d="M4 20C4 11 9 5 20 4c.5 9.5-4.6 15.6-13.4 15.6"
        fill="var(--color-brand-green)"
      />
      <path
        d="M4.5 19.5C8 15 11 12 15.5 8.5"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
