"use client";

/**
 * İstatistik sayacı: bölüm ilk kez görününce 0 → değer, 1 sn, easeOutCubic.
 * Sunucu çıktısı son değerdir (JS yoksa / reduced-motion'da doğru sayı görünür).
 * Her karede React render'ı yok; metin rAF içinde doğrudan yazılır.
 */

import { useContext, useEffect, useRef } from "react";
import { easeOutCubic } from "@/lib/useScrollProgress";
import { formatNumber, tempo } from "./data";
import { EnterContext, prefersReducedMotion } from "./reveal";

function cx(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const DURATION_MS = 1000;

type Props = {
  value: number;
  /** Bölüm girişinden sonra başlama gecikmesi (ms). */
  delay?: number;
  className?: string;
};

export function Counter({ value, delay = 0, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const signal = useContext(EnterContext);

  useEffect(() => {
    const el = ref.current;
    if (!el || !signal || prefersReducedMotion()) return;

    const final = formatNumber(value);
    let raf = 0;
    let timer = 0;
    let done = false;
    el.textContent = formatNumber(0);

    const unsubscribe = signal.subscribe(() => {
      timer = window.setTimeout(() => {
        let start = -1;
        const tick = (now: number) => {
          if (start < 0) start = now;
          const t = Math.min(1, (now - start) / DURATION_MS);
          el.textContent = t >= 1 ? final : formatNumber(value * easeOutCubic(t));
          if (t < 1) {
            raf = requestAnimationFrame(tick);
          } else {
            done = true;
          }
        };
        raf = requestAnimationFrame(tick);
      }, tempo(delay));
    });

    return () => {
      unsubscribe();
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      if (!done) el.textContent = final;
    };
  }, [value, delay, signal]);

  // Son değerin genişliği görünmez kopyayla ayrılır; sayarken satır kırılımı
  // ve yerleşim değişmez (CLS / scroll anchoring sıçraması olmaz). Sayan kopya
  // erişilebilirlik ağacından gizli (bölüme girilmeden "0" okunuyordu); ekran
  // okuyucu ve sayfa içi arama sr-only kopyadan hep son değeri bulur.
  const final = formatNumber(value);
  return (
    <span className={cx("relative inline-block", className)}>
      <span aria-hidden="true" className="invisible">
        {final}
      </span>
      <span ref={ref} aria-hidden="true" className="absolute inset-y-0 right-0 whitespace-nowrap">
        {final}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
