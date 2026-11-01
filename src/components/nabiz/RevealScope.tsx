"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/useScrollProgress";

/**
 * Beyaz bölümdeki [data-reveal] sarmalayıcılarının ilk çocuğunu, sarmalayıcı
 * viewport'a girdikçe scroll'a bağlı olarak belirginleştirir (opacity +
 * translateY). Tek bir passive scroll dinleyicisi, rAF ile kısılır; önce tüm
 * ölçümler, sonra tüm yazımlar. Dinleyici yalnızca beyaz bölüm ekrana yakınken
 * (IntersectionObserver) bağlıdır; koyu bölümde kaydırırken her karede ölçüm
 * yapılmaz. JS yoksa ya da reduced-motion'da içerik olduğu gibi görünür kalır.
 */
export default function RevealScope({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root || reduced) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"))
      .map((wrapper) => ({ wrapper, target: wrapper.firstElementChild as HTMLElement | null, last: -1 }))
      .filter((it): it is { wrapper: HTMLElement; target: HTMLElement; last: number } => it.target !== null);

    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const tops = items.map((it) => it.wrapper.getBoundingClientRect().top);
      items.forEach((it, i) => {
        // Sarmalayıcının üstü ekranın alt %8'inden %30'una çıkarken 0 → 1.
        const raw = (vh * 0.92 - tops[i]) / (vh * 0.22);
        const t = raw <= 0 ? 0 : raw >= 1 ? 1 : raw;
        const eased = 1 - (1 - t) * (1 - t) * (1 - t);
        const q = Math.round(eased * 200) / 200;
        if (q === it.last) return;
        it.last = q;
        it.target.style.opacity = q.toFixed(3);
        it.target.style.transform = q >= 1 ? "" : `translateY(${((1 - q) * 32).toFixed(1)}px)`;
      });
    };
    const schedule = () => {
      if (raf === 0) raf = requestAnimationFrame(update);
    };

    let listening = false;
    const listen = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      if (on) {
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule, { passive: true });
      } else {
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
      }
    };

    // İlk kare: tüm öğelerin başlangıç durumu (ekranın altındakiler gizli).
    schedule();
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              listen(entries.some((e) => e.isIntersecting));
              // Bölümden çıkarken de son bir kez güncelle (hızlı kaydırmada ara durumda kalmasın).
              schedule();
            },
            { rootMargin: "25% 0px 25% 0px" },
          );
    if (io) io.observe(root);
    else listen(true);

    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      io?.disconnect();
      listen(false);
      for (const it of items) {
        it.target.style.opacity = "";
        it.target.style.transform = "";
      }
    };
  }, [reduced]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** RevealScope içinde scroll'la belirecek blok. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-reveal="" className={className}>
      <div>{children}</div>
    </div>
  );
}
