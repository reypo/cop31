import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import Answer from "@/components/nabiz/Answer";
import BackLink from "@/components/nabiz/BackLink";
import Closing from "@/components/nabiz/Closing";
import Countdown from "@/components/nabiz/Countdown";
import DawnTransition from "@/components/nabiz/DawnTransition";
import Hero from "@/components/nabiz/Hero";
import PpmSection from "@/components/nabiz/PpmSection";
import StripesSection from "@/components/nabiz/StripesSection";

export const metadata: Metadata = {
  title: "Gezegenin Nabzı — COP31'de AK Gençlik",
  description:
    "Canlı sayaçlar ve iklim verisi: dünya her saniye ne kadar CO₂ salıyor, atmosfer ve sıcaklık nasıl değişti — ve gençliğin cevabı.",
};

export const viewport: Viewport = {
  themeColor: "#0B2A4A",
};

/**
 * Gece göğü: üç farklı döşeme boyutunda (asal sayılar; tekrar fark edilmesin)
 * deterministik, seyrek yıldız noktaları. Yalnızca CSS, sabit (animasyonsuz).
 */
const STARS: CSSProperties = (() => {
  let seed = 31;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const images: string[] = [];
  const sizes: string[] = [];
  for (const tile of [293, 431, 587]) {
    for (let i = 0; i < 5; i++) {
      const x = Math.round(rand() * tile);
      const y = Math.round(rand() * tile);
      const r = (0.8 + rand() * 0.7).toFixed(2);
      const a = (0.25 + rand() * 0.4).toFixed(2);
      const color = rand() > 0.7 ? `rgb(124 196 240 / ${a})` : `rgb(234 242 250 / ${a})`;
      images.push(`radial-gradient(${r}px ${r}px at ${x}px ${y}px, ${color} 50%, transparent 52%)`);
      sizes.push(`${tile}px ${tile}px`);
    }
  }
  return { backgroundImage: images.join(", "), backgroundSize: sizes.join(", ") };
})();

export default function NabizPage() {
  return (
    <main className="relative overflow-x-clip bg-white">
      <BackLink />

      {/* Koyu bölüm: brand-navy → #0B2A4A, "uzay/gece" */}
      <div className="relative bg-[#0B2A4A] bg-[linear-gradient(180deg,#1B4F9C_0,#0B2A4A_120svh,#0B2A4A_100%)] text-[#EAF2FA]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-80" style={STARS} />
        <Hero />
        <PpmSection />
        <StripesSection />
        <Countdown />
        <DawnTransition />
      </div>

      <Answer />
      <Closing />
    </main>
  );
}
