"use client";

import { useRef } from "react";
import { easeOutCubic, mapRange, useScrollProgressCallback } from "@/lib/useScrollProgress";
import Co2 from "./Co2";
import { CO2_PPM_2024, PPM_INCREASE_PERCENT, PPM_SCALE_MAX, PREINDUSTRIAL_PPM } from "./data";

const ppmFormat = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const intFormat = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

const pct = (v: number) => `${((v / PPM_SCALE_MAX) * 100).toFixed(3)}%`;
const BASE_WIDTH = pct(PREINDUSTRIAL_PPM);
const EXTRA_LEFT = BASE_WIDTH;
const EXTRA_WIDTH = pct(CO2_PPM_2024 - PREINDUSTRIAL_PPM);
const EXTRA_CENTER = pct((PREINDUSTRIAL_PPM + CO2_PPM_2024) / 2);
const TIP = pct(CO2_PPM_2024);

/**
 * Atmosferdeki CO₂: 2024 ≈ 424,6 ppm vs sanayi öncesi 280 ppm.
 * Uzun sarmalayıcı + sticky iç; scroll ilerlemesi ölçeği doldurur
 * (önce sanayi öncesi taban, sonra insan kaynaklı artış). Yalnızca
 * transform/opacity yazılır. Sunucu çıktısı son kareyi gösterir.
 */
export default function PpmSection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const extraRef = useRef<HTMLDivElement>(null);
  const deltaRef = useRef<HTMLSpanElement>(null);
  const pinRef = useRef<HTMLSpanElement>(null);
  const endLabelRef = useRef<HTMLSpanElement>(null);

  useScrollProgressCallback(wrapRef, (p) => {
    const base = easeOutCubic(mapRange(p, 0.04, 0.32));
    const extra = easeOutCubic(mapRange(p, 0.36, 0.78));
    const late = mapRange(p, 0.7, 0.86);
    if (baseRef.current) baseRef.current.style.transform = `scaleX(${base.toFixed(4)})`;
    if (extraRef.current) extraRef.current.style.transform = `scaleX(${extra.toFixed(4)})`;
    if (deltaRef.current) {
      deltaRef.current.style.opacity = late.toFixed(3);
      deltaRef.current.style.transform = `translateY(${((1 - late) * 6).toFixed(2)}px)`;
    }
    if (pinRef.current) {
      pinRef.current.style.opacity = late.toFixed(3);
      pinRef.current.style.transform = `scale(${(0.4 + 0.6 * late).toFixed(3)})`;
    }
    if (endLabelRef.current) endLabelRef.current.style.opacity = (0.35 + 0.65 * late).toFixed(3);
  });

  return (
    <div ref={wrapRef} className="relative h-[190svh] motion-reduce:h-auto">
      <section
        aria-labelledby="nabiz-ppm"
        className="sticky top-0 flex h-[100svh] items-end px-5 pb-[max(2.5rem,9svh)] motion-reduce:static motion-reduce:h-auto motion-reduce:py-24"
      >
        <div className="mx-auto w-full max-w-[560px]">
          <span className="leaf-tag">01 · Atmosfer</span>
          <h2 id="nabiz-ppm" className="mt-4 text-[1.75rem] leading-tight font-black text-[#EAF2FA] sm:text-[2.1rem]">
            Atmosferdeki <Co2 />
          </h2>

          <p className="mt-6 flex items-baseline gap-2 leading-none font-black text-white tabular-nums">
            <span className="text-[clamp(3.6rem,19vw,6.25rem)] tracking-[-0.02em]">{ppmFormat.format(CO2_PPM_2024)}</span>
            <span className="text-2xl font-bold text-[#7CC4F0]">ppm</span>
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-[#EAF2FA]/85">
            2024&apos;te havadaki karbondioksidin yıllık ortalaması. Sanayi devriminden önce{" "}
            {PREINDUSTRIAL_PPM} ppm idi: bugün yaklaşık{" "}
            <strong className="font-bold text-white">%{PPM_INCREASE_PERCENT} daha fazla</strong>.
          </p>

          {/* Ölçek: 0 → 450 ppm */}
          <div className="relative mt-12" role="img" aria-label={`Ölçek: sanayi öncesi ${PREINDUSTRIAL_PPM} ppm, 2024'te ${ppmFormat.format(CO2_PPM_2024)} ppm`}>
            <div className="relative h-7">
              <span
                ref={deltaRef}
                className="absolute bottom-1 -translate-x-1/2 text-[12px] font-black whitespace-nowrap text-[#7CC4F0] tabular-nums"
                style={{ left: EXTRA_CENTER }}
              >
                +{ppmFormat.format(CO2_PPM_2024 - PREINDUSTRIAL_PPM)} ppm
              </span>
            </div>
            <div className="relative">
              <div className="relative h-3.5 overflow-hidden rounded-full bg-white/[0.07] ring-1 ring-white/10">
                <div
                  ref={baseRef}
                  className="absolute inset-y-0 left-0 origin-left bg-[#EAF2FA]/40"
                  style={{ width: BASE_WIDTH }}
                />
                <div
                  ref={extraRef}
                  className="absolute inset-y-0 origin-left bg-linear-to-r from-[#7CC4F0] to-[#A9DBF7]"
                  style={{ left: EXTRA_LEFT, width: EXTRA_WIDTH }}
                />
                <div className="absolute inset-y-0 w-px bg-[#0B2A4A]/70" style={{ left: BASE_WIDTH }} />
              </div>
              <span
                ref={pinRef}
                aria-hidden="true"
                className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-orange shadow-[0_0_0_3px_rgb(240_131_34/0.25),0_0_18px_rgb(240_131_34/0.55)]"
                style={{ left: TIP }}
              />
            </div>
            <div className="relative mt-2 h-10 text-[11px] leading-tight text-[#EAF2FA]/70">
              <span className="absolute left-0 font-bold tabular-nums">0</span>
              <span className="absolute -translate-x-1/2 text-center whitespace-nowrap" style={{ left: BASE_WIDTH }}>
                <span className="block font-black text-[13px] text-[#EAF2FA] tabular-nums">{PREINDUSTRIAL_PPM}</span>
                sanayi öncesi
              </span>
              <span ref={endLabelRef} className="absolute right-0 text-right whitespace-nowrap">
                <span className="block font-black text-[13px] text-[#7CC4F0] tabular-nums">
                  {ppmFormat.format(CO2_PPM_2024)}
                </span>
                2024
              </span>
            </div>
          </div>

          <p className="mt-8 text-[13px] leading-relaxed font-medium text-[#EAF2FA]/80">
            Buz karotları, son {intFormat.format(800000)} yılda bu düzeyin hiç görülmediğini gösteriyor.
          </p>
          <p className="mt-3 text-[11px] leading-snug text-[#EAF2FA]/55">
            Kaynak: NOAA GML, Mauna Loa 2024 yıllık ortalaması (yaklaşık); sanayi öncesi değer buz karotlarından. ppm:
            milyonda bir birim.
          </p>
        </div>
      </section>
    </div>
  );
}
