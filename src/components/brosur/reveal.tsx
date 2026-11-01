"use client";

/**
 * Bölüm giriş animasyonu (IntersectionObserver, eşik 0.35).
 *
 * - Bölüm görünür olana kadar data-inview="0"; görününce bir kez "1" olur ve
 *   gözlemci kapanır. CSS (brosur.css) [data-a] öğelerini bu attribute'a göre
 *   gizler/gösterir; yalnızca opacity/transform geçişi.
 * - JS yoksa ya da prefers-reduced-motion: reduce ise attribute hiç
 *   konmaz → içerik baştan görünür.
 * - Viewport'tan uzun bölümlerde oran 0.35'e hiç ulaşmayabilir; bu yüzden
 *   bölüm ekranın %35'ini kapladığında da tetiklenir.
 * - Sayaçlar bölümün "girdi" sinyaline EnterContext ile abone olur.
 */

import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type RefObject,
} from "react";

export class EnterSignal {
  private entered = false;
  private listeners = new Set<() => void>();

  subscribe(fn: () => void): () => void {
    if (this.entered) {
      fn();
      return () => {};
    }
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  fire(): void {
    if (this.entered) return;
    this.entered = true;
    for (const fn of this.listeners) fn();
    this.listeners.clear();
  }
}

export const EnterContext = createContext<EnterSignal | null>(null);

const THRESHOLD = 0.35;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function useReveal(ref: RefObject<HTMLElement | null>, signal: EnterSignal): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      signal.fire();
      return;
    }
    if (el.dataset.inview === "1") {
      signal.fire();
      return;
    }

    el.dataset.inview = "0";
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const vh = window.innerHeight || document.documentElement.clientHeight;
          if (
            entry.intersectionRatio >= THRESHOLD ||
            entry.intersectionRect.height >= vh * THRESHOLD
          ) {
            io.disconnect();
            raf = requestAnimationFrame(() => {
              el.dataset.inview = "1";
              signal.fire();
            });
            return;
          }
        }
      },
      { threshold: [0, 0.1, 0.2, THRESHOLD, 0.5, 0.75, 1] },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [ref, signal]);
}

type PageProps = ComponentPropsWithoutRef<"section">;

/** Broşür sayfası: <section>, girişte bir kez canlanır. */
export function Page({ children, ...rest }: PageProps) {
  const ref = useRef<HTMLElement>(null);
  const [signal] = useState(() => new EnterSignal());
  useReveal(ref, signal);
  return (
    <EnterContext value={signal}>
      <section ref={ref} {...rest}>
        {children}
      </section>
    </EnterContext>
  );
}

type GroupProps = ComponentPropsWithoutRef<"div">;

/**
 * Uzun bölümlerin aşağıdaki fotoğraf kümeleri için: kendi gözlemcisi olan
 * alt grup (bölüm girişinden sonra, küme ekrana gelince bir kez canlanır).
 */
export function RevealGroup({ children, ...rest }: GroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [signal] = useState(() => new EnterSignal());
  useReveal(ref, signal);
  return (
    <EnterContext value={signal}>
      <div ref={ref} {...rest}>
        {children}
      </div>
    </EnterContext>
  );
}
