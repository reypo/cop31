"use client";

import { useEffect, useRef } from "react";
import { cover } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/useScrollProgress";
import Co2 from "./Co2";
import { CO2_TONS_PER_SECOND } from "./data";

const tonsFormat = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
const PER_SECOND_LABEL = tonsFormat.format(CO2_TONS_PER_SECOND);

/** Sayının karakter sayısına göre yazı boyutu (uzun oturumlarda taşmasın). */
function fontSizeFor(length: number): string {
  if (length >= 11) return "min(9.5vw, 3.75rem)";
  if (length >= 9) return "min(12vw, 4.5rem)";
  return "";
}

/** EKG çizgisi: düz hat + ortada tek bir kalp atışı kompleksi (viewBox 400×40). */
const ECG_PATH =
  "M0 20 H150 L158 20 L165 14 L172 20 L182 20 L190 3 L199 37 L207 20 L220 20 L228 15 L238 20 H400";

/**
 * Açılış: "Bu sayfayı açtığından beri dünya X ton CO₂ saldı".
 * Değer performance.now() farkından hesaplanır; her karede DOM'a doğrudan
 * yazılır (React render'ı yok). Sekme gizliyken ya da bölüm ekranda değilken
 * döngü durur; geri gelindiğinde aradaki süre de sayılır (sayfa açık kaldı).
 * Nabız halkası ve EKG ışığı aynı döngüde, saniyede bir "atar".
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const ecgRef = useRef<SVGPathElement>(null);
  /** Sayacın başlangıç anı; reduced-motion tercihi değişip efekt yeniden kurulsa da sıfırlanmaz. */
  const t0Ref = useRef<number | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const num = numberRef.current;
    const pulse = pulseRef.current;
    const ecg = ecgRef.current;
    if (!section || !num) return;

    t0Ref.current ??= performance.now();
    const t0 = t0Ref.current;
    let raf = 0;
    let onScreen = true;
    let lastText = "";
    let lastLength = 0;
    let lastPaint = -Infinity;

    const frame = (now: number) => {
      raf = 0;
      const elapsed = Math.max(0, (now - t0) / 1000);

      // Hareket azaltılmışsa sayı saniyede 4 kez güncellenir.
      if (!reduced || now - lastPaint >= 250) {
        lastPaint = now;
        const text = tonsFormat.format(Math.floor(elapsed * CO2_TONS_PER_SECOND));
        if (text !== lastText) {
          num.textContent = text;
          lastText = text;
          if (text.length !== lastLength) {
            lastLength = text.length;
            num.style.fontSize = fontSizeFor(text.length);
          }
        }
      }

      if (!reduced) {
        const phase = elapsed % 1;
        if (pulse) {
          pulse.style.transform = `scale(${(0.72 + phase * 1.05).toFixed(4)})`;
          pulse.style.opacity = (0.6 * (1 - phase) * (1 - phase)).toFixed(3);
        }
        if (ecg) ecg.style.strokeDashoffset = (160 - phase * 1160).toFixed(1);
      }

      schedule();
    };

    const schedule = () => {
      if (raf === 0 && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else schedule();
    };

    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => {
            onScreen = entries.some((e) => e.isIntersecting);
            if (onScreen) schedule();
            else stop();
          });
    io?.observe(section);
    document.addEventListener("visibilitychange", onVisibility);
    schedule();

    return () => {
      stop();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] flex-col overflow-hidden px-5 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-[560px] flex-1 flex-col">
        <header>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="leaf-tag">COP31 · Antalya</span>
            <span className="text-[13px] font-bold text-[#7CC4F0]">{cover.title}</span>
          </p>
          <h1 className="mt-3 text-[2.1rem] leading-[1.05] font-black text-[#EAF2FA] sm:text-[2.6rem]">
            Gezegenin Nabzı
          </h1>
        </header>

        <div className="relative flex flex-1 flex-col items-center justify-center py-10 text-center">
          {/* Yörünge halkaları (broşür motifi) + saniyede bir atan nabız halkası */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="absolute size-[380px] rounded-full border border-[#7CC4F0]/10" />
            <div className="absolute size-[300px] rounded-full border border-[#7CC4F0]/15" />
            <div className="absolute size-[220px] rounded-full border border-[#7CC4F0]/25" />
            <div
              ref={pulseRef}
              className="absolute size-[220px] rounded-full border-2 border-brand-green opacity-0 motion-reduce:hidden"
            />
            <div className="absolute size-[140px] rounded-full bg-[radial-gradient(circle,rgb(71_178_122/0.22),transparent_70%)]" />
          </div>

          <p className="relative text-[15px] font-medium text-[#EAF2FA]/85 sm:text-base">
            Bu sayfayı açtığından beri dünya
          </p>
          <p className="relative mt-3 leading-none font-black text-white tabular-nums">
            <span
              ref={numberRef}
              className="block text-[clamp(3.1rem,16vw,6rem)] tracking-[-0.02em]"
            >
              0
            </span>
          </p>
          <p className="relative mt-3 text-xl font-bold text-[#7CC4F0] sm:text-2xl">
            ton <Co2 /> saldı
          </p>
        </div>

        <div className="text-center">
          <p className="text-[13px] font-medium text-[#EAF2FA]/85">
            Her saniye yaklaşık <strong className="font-bold text-brand-green">{PER_SECOND_LABEL} ton</strong>{" "}
            fosil kaynaklı <Co2 />.
          </p>
          <p className="mt-1 text-[11px] text-[#EAF2FA]/55">
            Kaynak: Global Carbon Project 2024 tahmini, yaklaşık
          </p>
        </div>

        <svg
          viewBox="0 0 400 40"
          className="mt-6 block h-auto w-full"
          aria-hidden="true"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={ECG_PATH} pathLength={1000} stroke="#7CC4F0" strokeOpacity={0.28} strokeWidth={1.5} />
          <path
            ref={ecgRef}
            d={ECG_PATH}
            pathLength={1000}
            stroke="#47B27A"
            strokeWidth={2.25}
            strokeDasharray="160 1200"
            strokeDashoffset={160}
            className="motion-reduce:hidden"
          />
        </svg>

        <p className="mt-3 flex flex-col items-center gap-1 text-[11px] font-bold text-[#EAF2FA]/60">
          Kaydır
          <span aria-hidden="true" className="block h-6 w-px bg-linear-to-b from-[#7CC4F0]/70 to-transparent" />
        </p>
      </div>
    </section>
  );
}
