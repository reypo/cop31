"use client";

import { useRef } from "react";
import { cover } from "@/lib/content";
import { easeOutCubic, mapRange, useScrollProgressCallback } from "@/lib/useScrollProgress";

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const RINGS = [
  { lead: 0.07, color: "border-brand-green" },
  { lead: 0.14, color: "border-[#7CC4F0]" },
  { lead: 0.22, color: "border-[#7CC4F0]/60" },
] as const;

/**
 * Koyu bölümden beyaza geçiş: alttan yükselen beyaz bir "şafak" dairesi
 * (önünde yörünge halkaları) ekranı kaplar; koyu zemindeki soru metni
 * kaybolur, beyaz zeminde "Gençliğin cevabı" belirir. Yalnızca
 * transform/opacity. Sunucu çıktısı ve reduced-motion: son kare (beyaz).
 */
export default function DawnTransition() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const questionRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  useScrollProgressCallback(wrapRef, (p) => {
    const s = easeInOutCubic(mapRange(p, 0.1, 0.78));
    if (discRef.current) discRef.current.style.transform = `scale(${s.toFixed(4)})`;
    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      const lead = RINGS[i].lead;
      ring.style.transform = `scale(${Math.min(1.4, s + lead * (1 - s * 0.4)).toFixed(4)})`;
      ring.style.opacity = (Math.min(1, s * 12) * (1 - s) * 0.9).toFixed(3);
    });
    const q = mapRange(p, 0.26, 0.42);
    if (questionRef.current) {
      questionRef.current.style.opacity = (1 - q).toFixed(3);
      questionRef.current.style.transform = `translateY(${(-q * 28).toFixed(2)}px)`;
    }
    // Cevap, şafak dairesi ekranın ortasını kapladıktan hemen sonra (p ≈ 0,45) belirir;
    // soru (0,42'de biter) ile arada uzun, boş beyaz bir kare kalmasın.
    const a = easeOutCubic(mapRange(p, 0.5, 0.76));
    if (answerRef.current) {
      answerRef.current.style.opacity = a.toFixed(3);
      answerRef.current.style.transform = `translateY(${((1 - a) * 28).toFixed(2)}px)`;
    }
  });

  return (
    // -mt: geri sayımın alt boşluğuyla soru metni arasındaki yarım ekranlık boş koyu alanı kısaltır
    // (bölüm saydam; daire scale(0) ve halkalar opacity 0 başladığı için üst üste binme görünmez).
    <div ref={wrapRef} className="relative -mt-[18svh] h-[210svh] motion-reduce:mt-0 motion-reduce:h-auto">
      <section
        aria-labelledby="nabiz-answer-title"
        className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden px-5 motion-reduce:relative motion-reduce:h-auto motion-reduce:py-24"
      >
        {/* Şafak dairesi: merkezi ekranın alt ortasında */}
        <div
          ref={discRef}
          aria-hidden="true"
          className="absolute top-full left-1/2 size-[210vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        />
        {RINGS.map((r, i) => (
          <div
            key={i}
            ref={(el) => {
              ringRefs.current[i] = el;
            }}
            aria-hidden="true"
            className={`absolute top-full left-1/2 size-[210vmax] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 opacity-0 ${r.color}`}
          />
        ))}

        <div className="relative grid w-full max-w-[560px] place-items-center text-center">
          <div ref={questionRef} className="col-start-1 row-start-1 opacity-0" aria-hidden="true">
            <p className="text-[2.2rem] leading-[1.1] font-black text-[#EAF2FA] sm:text-[2.8rem]">Rakamlar ağır.</p>
            <p className="mt-4 text-lg font-bold text-[#7CC4F0]">Peki gençler ne yapıyor?</p>
          </div>

          <div ref={answerRef} className="col-start-1 row-start-1">
            <span className="leaf-tag">04 · Gençlik</span>
            <h2
              id="nabiz-answer-title"
              className="mt-5 text-[2rem] leading-[1.1] font-black text-brand-blue sm:text-[2.6rem]"
            >
              Gençliğin cevabı
            </h2>
            <p className="mx-auto mt-4 max-w-[22rem] text-lg leading-snug font-bold text-brand-green">
              {cover.subtitle}
            </p>
            <svg
              aria-hidden="true"
              viewBox="0 0 200 24"
              className="mx-auto mt-6 h-6 w-44"
              fill="none"
              stroke="#47B27A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M0 12 H70 L76 12 L81 7 L86 12 L92 12 L98 2 L104 22 L110 12 L120 12 L125 9 L131 12 H200" />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}
