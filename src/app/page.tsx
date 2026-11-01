import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { networkInterfaces } from "node:os";
import type { ReactNode } from "react";
import { cover } from "@/lib/content";
import { logos, photos } from "@/lib/photos";
import QrBlock from "./qr-block";

export const metadata: Metadata = {
  title: "COP31'de AK Gençlik — Konsept önizlemeleri",
};

type Concept = {
  href: string;
  title: string;
  text: string;
};

const featured = [
  {
    href: "/dunya",
    title: "Antalya'dan Dünyaya",
    text: "Kaydırdıkça küre uzaydan Türkiye'ye ve Antalya'ya iner, ardından COP31'e gelen dünyaya açılır.",
    art: <DunyaArt />,
  },
  {
    href: "/fidan",
    title: "Bir Fidanın Yolculuğu",
    text: "Kaydırdıkça tek bir fidan kökten taca büyür; her büyüme aşaması AK Gençlik'in bir bölümünü anlatır.",
    art: <FidanArt />,
  },
] satisfies readonly (Concept & { art: ReactNode })[];

const comparison = [
  {
    href: "/brosur",
    title: "Dijital Broşür",
    text: "Basılı broşürün 12 sayfası, ekranda sayfa sayfa canlanır.",
    icon: <BookIcon />,
  },
  {
    href: "/nabiz",
    title: "Gezegenin Nabzı",
    text: "Canlı iklim sayaçlarıyla açılır, gençliğin cevabıyla kapanır.",
    icon: <PulseIcon />,
  },
] satisfies readonly (Concept & { icon: ReactNode })[];

const VIRTUAL_ADAPTER = /vethernet|wsl|hyper-v|virtualbox|vmware|docker|loopback|tailscale|zerotier|utun|bridge/i;

/**
 * Geliştirme makinesinin yerel ağ IPv4 adresi. QR bloğu yalnızca sayfa
 * localhost'tan açıldığında bunu kullanır; aksi halde window.location.origin.
 * Vercel derlemesinde atlanır (derleme makinesinin adresi HTML'e gömülmesin).
 */
function lanAddress(): string | null {
  if (process.env.VERCEL) return null;
  const rank = (ip: string) =>
    ip.startsWith("192.168.") ? 0 : ip.startsWith("10.") ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 2 : 3;
  try {
    const candidates: string[] = [];
    for (const [name, addrs] of Object.entries(networkInterfaces())) {
      if (!addrs || VIRTUAL_ADAPTER.test(name)) continue;
      for (const a of addrs) {
        if (a.family === "IPv4" && !a.internal && !a.address.startsWith("169.254.")) {
          candidates.push(a.address);
        }
      }
    }
    candidates.sort((x, y) => rank(x) - rank(y));
    return candidates[0] ?? null;
  } catch {
    return null;
  }
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[720px] px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-16">
      <header className="flex flex-col items-center text-center">
        <HeroGlobe />
        <span className="leaf-tag mt-5">9–20 Kasım 2026 · Antalya Expo</span>
        <h1 className="mt-4 text-[2.125rem] leading-[1.08] font-black text-brand-blue sm:text-5xl">
          COP31&apos;de <span className="whitespace-nowrap">AK Gençlik</span>
        </h1>
        <p className="mt-3 max-w-[26ch] text-[1.0625rem] leading-snug font-bold text-brand-green sm:max-w-none sm:text-lg">
          Stand ziyaretçileri için mobil deneyim — konsept önizlemeleri
        </p>
        <p className="mt-3 max-w-[34ch] text-sm leading-relaxed sm:max-w-none">
          Her konsept yalnızca dikey kaydırmayla çalışır; telefonda açmanızı öneririz.
        </p>
      </header>

      <section aria-labelledby="one-cikan" className="mt-12 sm:mt-16">
        <SectionHeading id="one-cikan" title="Öne çıkan konseptler" note="Hikâyeyi kaydırdıkça kuran iki ana yön." />
        <ul className="mt-5 grid gap-5 sm:grid-cols-2">
          {featured.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className={`group flex h-full flex-col overflow-hidden rounded-[20px] border border-brand-mist bg-white shadow-[0_10px_28px_-16px_rgb(27_79_156/0.45)] transition-[border-color,box-shadow,translate] duration-200 hover:border-brand-green hover:shadow-[0_16px_32px_-16px_rgb(27_79_156/0.5)] motion-safe:hover:-translate-y-0.5 ${focusRing}`}
              >
                <div className="relative aspect-[2/1] overflow-hidden">{c.art}</div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-[1.375rem] leading-tight font-black text-brand-blue">{c.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed">{c.text}</p>
                  <span className="mt-auto pt-5">
                    <span className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-blue px-5 text-sm font-bold text-white transition-colors group-hover:bg-brand-navy">
                      Aç
                      <Arrow />
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="karsilastirma" className="mt-12">
        <SectionHeading
          id="karsilastirma"
          title="Karşılaştırma için"
          note="Daha klasik ve daha veri odaklı iki alternatif."
        />
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {comparison.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className={`group flex h-full items-center gap-3.5 rounded-2xl border border-brand-mist bg-white p-4 transition-colors hover:border-brand-green ${focusRing}`}
              >
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-mist text-brand-blue transition-colors group-hover:bg-brand-green group-hover:text-white"
                >
                  {c.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base leading-snug font-black text-brand-blue">{c.title}</span>
                  <span className="mt-0.5 block text-[0.8125rem] leading-snug">{c.text}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 self-center text-sm font-bold text-brand-navy">
                  Aç
                  <Arrow />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <QrBlock lanHost={lanAddress()} />

      <footer className="mt-10 flex items-center justify-center gap-3">
        <Image
          src={logos.genclikKollari.src}
          width={40}
          height={40}
          alt={logos.genclikKollari.alt}
          className="size-10"
        />
        <span className="text-left text-xs leading-snug font-bold text-brand-ink">
          {cover.org}
          <span className="block font-script text-xl leading-tight font-normal text-brand-green">{cover.slogan}</span>
        </span>
      </footer>
    </main>
  );
}

function SectionHeading({ id, title, note }: { id: string; title: string; note: string }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 id={id} className="shrink-0 text-lg leading-tight font-black text-brand-blue">
          {title}
        </h2>
        <span aria-hidden="true" className="h-px flex-1 bg-brand-green/35" />
      </div>
      <p className="mt-1 text-sm">{note}</p>
    </div>
  );
}

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4 transition-transform group-hover:translate-x-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

/** Broşür kapağından: küre fotoğrafı dairesel maskede, çevresinde yörünge çizgileri ve turuncu pin. */
function HeroGlobe() {
  // 1067×1600 fotoğrafta küre merkezi ~(541, 885), yarıçapı ~291 px.
  // 176 px genişlikte çizilince küre 120 px dairenin ~%80'ini kaplar.
  const w = 176;
  const h = Math.round((w * photos.globeFoliage.height) / photos.globeFoliage.width);
  const left = Math.round(60 - (541 * w) / photos.globeFoliage.width);
  const top = Math.round(60 - (885 * h) / photos.globeFoliage.height);
  return (
    <div aria-hidden="true" className="relative size-[168px]">
      <svg viewBox="0 0 168 168" className="absolute inset-0 size-full" fill="none">
        <circle cx="84" cy="84" r="82" stroke="var(--color-brand-green)" strokeWidth="1.5" opacity="0.6" />
        <circle
          cx="84"
          cy="84"
          r="72"
          stroke="var(--color-brand-blue)"
          strokeWidth="1.25"
          strokeDasharray="1.5 5"
          strokeLinecap="round"
          opacity="0.55"
        />
        <circle cx={84 + 82 * Math.cos(-0.7)} cy={84 + 82 * Math.sin(-0.7)} r="6" fill="var(--color-brand-orange)" />
        <circle cx={84 + 82 * Math.cos(2.45)} cy={84 + 82 * Math.sin(2.45)} r="3.5" fill="var(--color-brand-green)" />
      </svg>
      <div className="absolute top-1/2 left-1/2 size-[120px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-brand-teal shadow-[0_10px_24px_-10px_rgb(27_79_156/0.55)]">
        <Image
          src={photos.globeFoliage.src}
          width={w}
          height={h}
          alt=""
          loading="eager"
          className="absolute max-w-none"
          style={{ left, top, width: w, height: h }}
        />
      </div>
    </div>
  );
}

/** /dunya kartı: gece mavisinde, graticule çizgili küre, yörünge ve Antalya pini. */
function DunyaArt() {
  const cx = 160;
  const cy = 92;
  const r = 52;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 160"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full bg-brand-navy"
      fill="none"
    >
      <defs>
        <radialGradient id="dunya-glow" cx="0.5" cy="0.58" r="0.5">
          <stop offset="0" stopColor="var(--color-brand-blue)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--color-brand-blue)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dunya-globe" cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="dunya-clip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="320" height="160" fill="url(#dunya-glow)" />
      <g fill="#ffffff">
        {[
          [34, 26, 1.1, 0.7],
          [78, 54, 0.9, 0.5],
          [118, 18, 0.8, 0.6],
          [226, 20, 1, 0.55],
          [266, 44, 1.3, 0.75],
          [292, 104, 0.9, 0.5],
          [26, 116, 1, 0.5],
          [58, 142, 0.8, 0.45],
          [250, 140, 1, 0.5],
          [196, 12, 0.7, 0.5],
        ].map(([x, y, rad, o]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={rad} opacity={o} />
        ))}
      </g>
      <g transform={`rotate(-14 ${cx} ${cy})`} stroke="#ffffff" strokeWidth="1.2" strokeDasharray="3 6" strokeLinecap="round" opacity="0.55">
        <path d={`M${cx - 124} ${cy} A124 30 0 0 1 ${cx + 124} ${cy}`} />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="var(--color-brand-blue)" />
      <g clipPath="url(#dunya-clip)" stroke="#ffffff" strokeWidth="0.9" opacity="0.32">
        <ellipse cx={cx} cy={cy} rx={r} ry="13" />
        <ellipse cx={cx} cy={cy - 24} rx={r - 6} ry="11" />
        <ellipse cx={cx} cy={cy + 24} rx={r - 6} ry="11" />
        <ellipse cx={cx} cy={cy - 42} rx={r - 26} ry="7" />
        <ellipse cx={cx} cy={cy + 42} rx={r - 26} ry="7" />
        <ellipse cx={cx} cy={cy} rx="18" ry={r} />
        <ellipse cx={cx} cy={cy} rx="38" ry={r} />
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="url(#dunya-globe)" />
      <circle cx={cx} cy={cy} r={r} stroke="#ffffff" strokeOpacity="0.35" />
      <g fill="var(--color-brand-green)" opacity="0.9">
        {[
          [146, 70],
          [136, 98],
          [172, 108],
          [150, 120],
          [186, 82],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" />
        ))}
      </g>
      <circle cx="178" cy="74" r="13" stroke="var(--color-brand-orange)" strokeOpacity="0.3" strokeWidth="1.5" />
      <circle cx="178" cy="74" r="8" stroke="var(--color-brand-orange)" strokeOpacity="0.6" strokeWidth="1.5" />
      <circle cx="178" cy="74" r="3.6" fill="var(--color-brand-orange)" />
      <g transform={`rotate(-14 ${cx} ${cy})`}>
        <path
          d={`M${cx + 124} ${cy} A124 30 0 0 1 ${cx - 124} ${cy}`}
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeDasharray="3 6"
          strokeLinecap="round"
          opacity="0.75"
        />
        <circle cx={cx - 62} cy={cy + 26} r="4.5" fill="var(--color-brand-orange)" />
      </g>
    </svg>
  );
}

/** /fidan kartı: toprak çizgisi, teal kökler, gövde gradyanı, turuncu boğumlar, yapraklar ve arkada silüet fidanlar. */
function FidanArt() {
  const leaf = "M0 0C3 -5 10 -6 14 0C10 6 3 5 0 0Z";
  // [x, y, açı, opaklık] — dal uçları ve gövde tepesi çevresinde (dallarla aynı koordinatlar).
  const leaves: [number, number, number, number?][] = [
    [126, 89, 196],
    [133, 90, 230, 0.8],
    [142, 93, 150, 0.85],
    [196, 74, -24],
    [186, 76, -70, 0.8],
    [176, 80, 20, 0.85],
    [138, 58, 210],
    [146, 62, 250, 0.8],
    [160, 66, -92],
    [160, 66, -128, 0.85],
    [160, 66, -56, 0.85],
    [151, 80, 200, 0.75],
    [168, 90, -10, 0.8],
  ];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 160"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
      fill="none"
      strokeLinecap="round"
    >
      <defs>
        <linearGradient id="fidan-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="var(--color-brand-mist)" />
        </linearGradient>
        <linearGradient id="fidan-trunk" gradientUnits="userSpaceOnUse" x1="0" y1="117" x2="0" y2="52">
          <stop offset="0" stopColor="var(--color-brand-ink)" />
          <stop offset="1" stopColor="var(--color-brand-green)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="320" height="116" fill="url(#fidan-sky)" />
      <rect x="0" y="116" width="320" height="44" fill="var(--color-brand-teal)" fillOpacity="0.09" />

      <g fill="var(--color-brand-green)" stroke="var(--color-brand-green)" strokeWidth="3" opacity="0.2">
        <path d="M58 116V86" />
        <circle cx="58" cy="78" r="15" stroke="none" />
        <path d="M264 116V90" />
        <circle cx="264" cy="83" r="13" stroke="none" />
        <path d="M26 116V100" strokeWidth="2" />
        <circle cx="26" cy="95" r="8" stroke="none" />
        <path d="M296 116V98" strokeWidth="2" />
        <circle cx="296" cy="92" r="9" stroke="none" />
        <path d="M222 116V104" strokeWidth="2" />
        <circle cx="222" cy="100" r="6" stroke="none" />
        <path d="M96 116V106" strokeWidth="2" />
        <circle cx="96" cy="102" r="5" stroke="none" />
      </g>

      <path d="M16 116H304" stroke="var(--color-brand-teal)" strokeOpacity="0.4" strokeWidth="1.5" />

      <g transform="translate(0 -14)">
        <g stroke="var(--color-brand-teal)" strokeWidth="2.2">
          <path d="M160 130C158 142 148 151 132 157" />
          <path d="M160 130C163 143 174 150 192 155" />
          <path d="M160 130C160 144 161 153 158 164" />
          <path d="M148 149C140 150 130 147 118 151" />
          <path d="M175 150C185 149 195 144 206 146" />
        </g>
        <g fill="var(--color-brand-teal)">
          <circle cx="132" cy="157" r="2.2" />
          <circle cx="192" cy="155" r="2.2" />
          <circle cx="158" cy="164" r="2.2" />
          <circle cx="118" cy="151" r="2.2" />
          <circle cx="206" cy="146" r="2.2" />
        </g>

        <path d="M160 131C161 112 157 96 160 66" stroke="url(#fidan-trunk)" strokeWidth="5" />
        <g stroke="var(--color-brand-teal)" strokeWidth="2.6">
          <path d="M159.2 100C150 94 140 90 126 89" />
          <path d="M158.9 86C170 79 181 75 196 74" />
          <path d="M159.3 75C153 67 147 62 138 58" />
        </g>
        <g fill="var(--color-brand-green)">
          {leaves.map(([x, y, rot, o]) => (
            <path key={`${x}-${y}-${rot}`} d={leaf} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={o ?? 1} />
          ))}
        </g>
        <g fill="var(--color-brand-orange)">
          <circle cx="159.9" cy="114.3" r="3.6" />
          <circle cx="159" cy="96.4" r="3.6" />
        </g>
      </g>
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d="M3 6.2C5.6 4.9 8.6 5 12 6.8c3.4-1.8 6.4-1.9 9-.6V19c-2.6-1.3-5.6-1.2-9 .6-3.4-1.8-6.4-1.9-9-.6Z" />
      <path d="M12 6.8v12.8" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d="M2.5 12.5h4l2.2-5.5 3.8 11 2.8-8 1.9 2.5h4.3" />
    </svg>
  );
}
