"use client";

/**
 * Scroll ilerlemesi yardımcıları (brief §5).
 *
 *   const ref = useRef<HTMLDivElement>(null);
 *   const p = useScrollProgress(ref); // 0…1, reduced-motion'da sabit 1
 *   const intro = easeOutCubic(mapRange(p, 0, 0.12));
 *
 * Her karede React render'ı istemiyorsanız (önerilen; brief §2.3) stilleri
 * doğrudan yazın:
 *
 *   useScrollProgressCallback(ref, (p) => {
 *     el.style.transform = `scale(${1 + p})`;
 *   });
 *
 * Not: Bu modül "use client"; clamp01/mapRange/easeOutCubic'i yalnızca
 * istemci bileşenlerinden import edin (server component'te istemci referansı olur).
 */

import {
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

/** Değeri [0, 1] aralığına sıkıştırır (NaN → 0). */
export function clamp01(v: number): number {
  if (!(v > 0)) return 0;
  return v > 1 ? 1 : v;
}

/** p'yi [a, b] aralığından 0–1'e eşler ve sıkıştırır. a === b ise basamak fonksiyonu. */
export function mapRange(p: number, a: number, b: number): number {
  if (b === a) return p >= b ? 1 : 0;
  return clamp01((p - a) / (b - a));
}

/** Hızlı başlayıp yavaşlayan yumuşatma (t: 0–1). */
export function easeOutCubic(t: number): number {
  const x = 1 - clamp01(t);
  return 1 - x * x * x;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionOnServer(): boolean {
  return false;
}

/** Kullanıcı hareketi azaltmayı tercih ediyorsa true (sunucuda false). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionOnServer,
  );
}

/**
 * Elemanın viewport'a göre ilerlemesi: üstü viewport üstüne geldiğinde 0,
 * altı viewport altına geldiğinde 1. Eleman viewport'tan kısaysa üstü
 * viewport üstünü geçtiği anda 1 olur.
 */
export function measureScrollProgress(el: Element): number {
  const rect = el.getBoundingClientRect();
  const range = rect.height - window.innerHeight;
  if (range <= 0) return rect.top <= 0 ? 1 : 0;
  return clamp01(-rect.top / range);
}

/**
 * İlerleme her değiştiğinde onProgress'i requestAnimationFrame içinde çağırır;
 * React render'ı tetiklemez. Reduced-motion'da bir kez 1 ile çağrılır ve dinlemez.
 */
export function useScrollProgressCallback(
  ref: RefObject<HTMLElement | null>,
  onProgress: (progress: number) => void,
): void {
  const reduced = usePrefersReducedMotion();
  const emit = useEffectEvent(onProgress);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      const raf = requestAnimationFrame(() => emit(1));
      return () => cancelAnimationFrame(raf);
    }

    let raf = 0;
    let last = -1;

    const update = () => {
      raf = 0;
      const p = measureScrollProgress(el);
      if (p !== last) {
        last = p;
        emit(p);
      }
    };

    const schedule = () => {
      if (raf === 0) raf = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    const ro =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    ro?.observe(el);

    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro?.disconnect();
    };
  }, [ref, reduced]);
}

/**
 * ref'teki (uzun bir sarmalayıcı) elemanın 0–1 scroll ilerlemesi.
 * rAF ile kısılır; scroll/resize dinleyicileri passive.
 * prefers-reduced-motion: reduce ise her zaman 1 döner ve dinlemez.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>): number {
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  useScrollProgressCallback(ref, setProgress);
  return reduced ? 1 : progress;
}

export default useScrollProgress;
