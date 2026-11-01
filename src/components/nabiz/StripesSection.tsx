"use client";

import { useEffect, useRef } from "react";
import { mapRange, useScrollProgressCallback } from "@/lib/useScrollProgress";
import {
  ANOMALIES,
  ANOMALY_FIRST_YEAR,
  ANOMALY_LAST_YEAR,
  ANOMALY_NOTES,
  STRIPE_LEGEND_GRADIENT,
  STRIPE_MAX,
  STRIPE_MIN,
  stripeColor,
} from "./data";

const COUNT = ANOMALIES.length;
const COLORS = ANOMALIES.map(stripeColor);
const LAST = COUNT - 1;

const anomalyFormat = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

/** "+1,2 °C" / "−0,4 °C" (tipografik eksi). */
function formatAnomaly(v: number): string {
  return `${anomalyFormat.format(v).replace("-", "−")} °C`;
}

/** Notu, ilgili yıldan sonraki birkaç yıl boyunca da göster (hızlı kaydırmada kaybolmasın). */
function noteFor(year: number): string {
  for (let y = year; y > year - 6; y--) {
    const note = ANOMALY_NOTES[y];
    if (note) return note;
  }
  return "";
}

const tickLeft = (year: number) => `${(((year - ANOMALY_FIRST_YEAR + 0.5) / COUNT) * 100).toFixed(3)}%`;
const legendLeft = (v: number) => `${(((v - STRIPE_MIN) / (STRIPE_MAX - STRIPE_MIN)) * 100).toFixed(3)}%`;

/**
 * Isınma şeritleri (1850–2024). Şeritler canvas'a çizilir; scroll ilerledikçe
 * soldan sağa ortaya çıkar, üstteki okuma satırı o anki yılı ve anomaliyi verir.
 * Canvas yalnızca görünen şerit sayısı değiştiğinde yeniden çizilir.
 */
export default function StripesSection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const swatchRef = useRef<HTMLSpanElement>(null);
  const noteRef = useRef<HTMLSpanElement>(null);
  /** Görünen şerit sayısı (kesirli): 0…COUNT. */
  const revealRef = useRef(COUNT);
  const drawnRef = useRef(-1);
  const readoutIndexRef = useRef(LAST);

  const draw = (force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reveal = revealRef.current;
    // Kesirli kısmı 1/8 adımla yuvarla: gereksiz yeniden çizim olmasın.
    const key = Math.round(reveal * 8) / 8;
    if (!force && key === drawnRef.current) return;
    drawnRef.current = key;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(234, 242, 250, 0.05)";
    ctx.fillRect(0, 0, w, h);

    const full = Math.min(COUNT, Math.floor(key));
    for (let i = 0; i < full; i++) {
      const x0 = Math.round((i * w) / COUNT);
      const x1 = Math.round(((i + 1) * w) / COUNT);
      ctx.fillStyle = COLORS[i];
      ctx.fillRect(x0, 0, x1 - x0, h);
    }
    const frac = key - full;
    if (full < COUNT && frac > 0) {
      const x0 = Math.round((full * w) / COUNT);
      const x1 = Math.round(((full + 1) * w) / COUNT);
      ctx.globalAlpha = frac;
      ctx.fillStyle = COLORS[full];
      ctx.fillRect(x0, 0, x1 - x0, h);
      ctx.globalAlpha = 1;
    }
    if (key > 0 && key < COUNT) {
      const x = Math.min(w - 2, Math.round((key * w) / COUNT));
      ctx.fillStyle = "rgba(234, 242, 250, 0.9)";
      ctx.fillRect(x, 0, Math.max(1, Math.round(w / 400)), h);
    }
  };

  const updateReadout = () => {
    const index = Math.min(LAST, Math.max(0, Math.ceil(revealRef.current) - 1));
    if (index === readoutIndexRef.current) return;
    readoutIndexRef.current = index;
    const year = ANOMALY_FIRST_YEAR + index;
    if (yearRef.current) yearRef.current.textContent = String(year);
    if (valueRef.current) valueRef.current.textContent = formatAnomaly(ANOMALIES[index]);
    if (swatchRef.current) swatchRef.current.style.backgroundColor = COLORS[index];
    if (noteRef.current) noteRef.current.textContent = noteFor(year) || " ";
  };

  // Canvas boyutu: CSS boyutu × DPR (en çok 2). Boyut değişince yeniden çiz.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      draw(true);
    };
    resize();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    ro?.observe(canvas);
    return () => ro?.disconnect();
  }, []);

  useScrollProgressCallback(wrapRef, (p) => {
    revealRef.current = mapRange(p, 0.04, 0.8) * COUNT;
    draw();
    updateReadout();
  });

  const last = ANOMALIES[LAST];

  return (
    <div ref={wrapRef} className="relative h-[250svh] motion-reduce:h-auto">
      <section
        aria-labelledby="nabiz-stripes"
        className="sticky top-0 flex h-[100svh] items-start px-5 pt-[max(4.5rem,9svh)] motion-reduce:static motion-reduce:h-auto motion-reduce:py-24"
      >
        <div className="mx-auto w-full max-w-[560px]">
          <span className="leaf-tag">02 · Sıcaklık</span>
          <h2 id="nabiz-stripes" className="mt-4 text-[1.75rem] leading-tight font-black text-[#EAF2FA] sm:text-[2.1rem]">
            {COUNT} yıl, {COUNT} şerit
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#EAF2FA]/85">
            Her şerit bir yılın küresel ortalama sıcaklığı. Mavi serin, kırmızı sıcak yıllar.
          </p>

          <div className="mt-6 flex items-end justify-between gap-3" aria-live="off">
            <span ref={yearRef} className="text-[2.6rem] leading-none font-black text-white tabular-nums">
              {ANOMALY_LAST_YEAR}
            </span>
            <span className="flex items-center gap-2 pb-0.5">
              <span
                ref={swatchRef}
                aria-hidden="true"
                className="size-4 rounded-[4px] ring-1 ring-white/30"
                style={{ backgroundColor: COLORS[LAST] }}
              />
              <span ref={valueRef} className="text-[1.6rem] leading-none font-black text-[#EAF2FA] tabular-nums">
                {formatAnomaly(last)}
              </span>
            </span>
          </div>
          <p className="mt-1.5 flex justify-between gap-3 text-[11px] font-bold text-[#7CC4F0]">
            <span ref={noteRef} className="truncate">
              {noteFor(ANOMALY_LAST_YEAR)}
            </span>
            <span className="shrink-0 font-medium text-[#EAF2FA]/60">1961–1990 ortalamasına göre</span>
          </p>

          <canvas
            ref={canvasRef}
            className="mt-3 block h-[30svh] max-h-[340px] min-h-[180px] w-full rounded-[10px]"
            role="img"
            aria-label={`Isınma şeritleri: ${ANOMALY_FIRST_YEAR}–${ANOMALY_LAST_YEAR} yıllık küresel sıcaklık anomalileri; ilk yıllar mavi, son yıllar koyu kırmızı.`}
          />

          <div className="relative mt-1.5 h-4 text-[11px] font-bold text-[#EAF2FA]/65 tabular-nums">
            <span className="absolute left-0">{ANOMALY_FIRST_YEAR}</span>
            {[1900, 1950].map((y) => (
              <span key={y} className="absolute -translate-x-1/2" style={{ left: tickLeft(y) }}>
                {y}
              </span>
            ))}
            <span className="absolute right-0">{ANOMALY_LAST_YEAR}</span>
          </div>

          <div className="mt-5">
            <div className="h-2 rounded-full" style={{ backgroundImage: STRIPE_LEGEND_GRADIENT }} />
            <div className="relative mt-1 h-4 text-[11px] font-medium text-[#EAF2FA]/65 tabular-nums">
              <span className="absolute left-0">−1 °C</span>
              <span className="absolute -translate-x-1/2" style={{ left: legendLeft(0) }}>
                0
              </span>
              <span className="absolute right-0">+1,3 °C</span>
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-snug text-[#EAF2FA]/55">
            Yaklaşık/temsili veri: HadCRUT5&apos;e (Met Office, 1961–1990 referansı) yaklaşan değerler. Görselleştirme
            fikri: Ed Hawkins, &quot;Warming Stripes&quot;.
          </p>
        </div>
      </section>
    </div>
  );
}
