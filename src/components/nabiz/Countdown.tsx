"use client";

import { useEffect, useRef } from "react";
import { cop31 } from "@/lib/content";
import { COP31_DAY1_ISO, COP31_DAYS, COP31_END_ISO } from "./data";

const twoDigits = new Intl.NumberFormat("tr-TR", { minimumIntegerDigits: 2, maximumFractionDigits: 0 });

const UNITS = [
  { key: "days", label: "GÜN" },
  { key: "hours", label: "SAAT" },
  { key: "minutes", label: "DAKİKA" },
  { key: "seconds", label: "SANİYE" },
] as const;

type UnitKey = (typeof UNITS)[number]["key"];

/**
 * "COP31'e kalan süre" — 9 Kasım 2026 09:00 (UTC+3) açılışına canlı geri sayım.
 * Değerler doğrudan DOM'a yazılır; bir sonraki saniye sınırına hizalı
 * setTimeout ile güncellenir, sekme gizliyken durur. Etkinlik başladıysa
 * "devam ediyor" (+ "12 günlük konferansın N. günü"), bittiyse "tamamlandı"
 * gösterilir. Başlık, kart ve alt not data-phase ile birlikte değişir.
 */
export default function Countdown() {
  const rootRef = useRef<HTMLDivElement>(null);
  const valueRefs = useRef<Partial<Record<UnitKey, HTMLSpanElement | null>>>({});
  const dayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const start = Date.parse(cop31.startIso);
    const end = Date.parse(COP31_END_ISO);
    const day1 = Date.parse(COP31_DAY1_ISO);
    let timer = 0;

    const render = () => {
      const now = Date.now();
      const phase = now >= end ? "after" : now >= start ? "live" : "before";
      if (root.dataset.phase !== phase) root.dataset.phase = phase;
      if (phase === "before") {
        const total = Math.floor((start - now) / 1000);
        const values: Record<UnitKey, number> = {
          days: Math.floor(total / 86400),
          hours: Math.floor((total % 86400) / 3600),
          minutes: Math.floor((total % 3600) / 60),
          seconds: total % 60,
        };
        for (const { key } of UNITS) {
          const el = valueRefs.current[key];
          const text = twoDigits.format(values[key]);
          if (el && el.textContent !== text) el.textContent = text;
        }
      } else if (phase === "live" && dayRef.current) {
        const day = Math.min(COP31_DAYS, Math.max(1, Math.floor((now - day1) / 86_400_000) + 1));
        const text = `${COP31_DAYS} günlük konferansın ${day}. günü`;
        if (dayRef.current.textContent !== text) dayRef.current.textContent = text;
      }
      return now;
    };

    const tick = () => {
      const now = render();
      timer = window.setTimeout(tick, 1000 - (now % 1000) + 15);
    };
    const stop = () => {
      window.clearTimeout(timer);
      timer = 0;
    };
    const onVisibility = () => {
      stop();
      if (!document.hidden) tick();
    };

    tick();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <section aria-labelledby="nabiz-countdown" className="relative overflow-hidden px-5 pt-16 pb-16">
      {/* Yörünge çizgileri (broşür motifi) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="pointer-events-none absolute -top-24 -right-40 size-[420px] opacity-60 sm:-right-24"
        fill="none"
      >
        <circle cx="200" cy="200" r="198" stroke="#7CC4F0" strokeOpacity="0.12" />
        <circle cx="200" cy="200" r="150" stroke="#7CC4F0" strokeOpacity="0.16" strokeDasharray="2 6" />
        <circle cx="200" cy="200" r="102" stroke="#47B27A" strokeOpacity="0.28" />
      </svg>

      <div ref={rootRef} data-phase="before" className="group relative mx-auto w-full max-w-[560px]">
        <span className="leaf-tag">03 · Antalya</span>
        <h2 id="nabiz-countdown" className="mt-4 text-[1.75rem] leading-tight font-black text-[#EAF2FA] sm:text-[2.1rem]">
          <span className="group-data-[phase=after]:hidden group-data-[phase=live]:hidden">COP31&apos;e kalan süre</span>
          <span className="hidden group-data-[phase=live]:inline">COP31 şu an {cop31.city}&apos;da</span>
          <span className="hidden group-data-[phase=after]:inline">Dünya {cop31.city}&apos;da buluştu</span>
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[#EAF2FA]/85">
          Dünyanın iklim gündemi, {cop31.dates} tarihlerinde {cop31.city}&apos;da.
        </p>

        <div className="mt-8">
          <div className="grid grid-cols-4 gap-2 group-data-[phase=after]:hidden group-data-[phase=live]:hidden sm:gap-3">
            {UNITS.map(({ key, label }) => (
              <div
                key={key}
                className={`rounded-2xl bg-white/[0.06] px-1 py-4 text-center ring-1 ${
                  key === "seconds" ? "ring-brand-green/60" : "ring-[#7CC4F0]/25"
                }`}
              >
                <span
                  ref={(el) => {
                    valueRefs.current[key] = el;
                  }}
                  className="block text-[clamp(1.9rem,9vw,2.75rem)] leading-none font-black text-white tabular-nums"
                >
                  00
                </span>
                <span
                  className={`mt-2 block text-[10px] font-bold tracking-[0.04em] sm:text-[11px] ${
                    key === "seconds" ? "text-brand-green" : "text-[#7CC4F0]"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="hidden items-center gap-4 rounded-2xl bg-white/[0.06] px-5 py-5 ring-1 ring-brand-green/60 group-data-[phase=live]:flex">
            <span aria-hidden="true" className="relative flex size-3 shrink-0">
              <span className="absolute inset-0 rounded-full bg-brand-green/50 motion-safe:animate-ping" />
              <span className="relative size-3 rounded-full bg-brand-green" />
            </span>
            <span>
              <span className="block text-xl leading-tight font-black text-white">
                COP31 {cop31.city}&apos;da devam ediyor
              </span>
              <span ref={dayRef} className="mt-1 block text-[13px] font-bold text-brand-green tabular-nums">
                {COP31_DAYS} günlük konferans
              </span>
            </span>
          </div>
          <p className="hidden rounded-2xl bg-white/[0.06] px-5 py-5 text-xl font-black text-white ring-1 ring-[#7CC4F0]/25 group-data-[phase=after]:block">
            COP31 {cop31.city}&apos;da tamamlandı
          </p>
        </div>

        <p className="mt-6 text-base font-bold text-[#EAF2FA]">
          {cop31.dates} · <span className="text-[#7CC4F0]">{cop31.venue}</span>
        </p>
        <p className="mt-1 text-[11px] text-[#EAF2FA]/55 group-data-[phase=after]:hidden group-data-[phase=live]:hidden">
          Açılış: 9 Kasım 2026, 09:00 (TSİ). Sayaç cihazının saatine göre işler.
        </p>
      </div>
    </section>
  );
}
