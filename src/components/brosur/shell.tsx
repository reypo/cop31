"use client";

/**
 * Broşür kökü + sağ kenarda sabit ilerleme fidanı.
 *
 * Fidan: 3px'lik dikey gövde aşağıdan yukarı dolar (scaleY), tepesinde küçük
 * yeşil yaprak (translateY). Her sayfa başlangıcında gövdenin yanında küçük
 * bir yaprak açılır. Scroll ilerlemesi src/lib/useScrollProgress ile rAF
 * içinde okunur; yalnızca CSS değişkeni/transform yazılır, React render'ı yok.
 * Reduced-motion'da hook sabit 1 verir → fidan tamamlanmış hâlde durur.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { useScrollProgressCallback } from "@/lib/useScrollProgress";

/** Snap yok (bölümler telefonda ekrandan uzun); İçindekiler çapaları yumuşak kayar (hareket azaltmada anlık). */
const SNAP_CSS = "@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}";

/** Görünürken stili açar, Activity gizleyince/unmount'ta kapatır. */
function enableWhileVisible(style: HTMLStyleElement | null) {
  if (!style) return;
  style.media = "all";
  return () => {
    style.media = "not all";
  };
}

type Props = {
  children: ReactNode;
  /** Kapak hariç sayfa sayısı (her biri için gövdede bir yaprak). */
  leafCount: number;
  /** Köke ek sınıf (rota yazısının CSS değişkeni). */
  className?: string;
};

export function BrosurShell({ children, leafCount, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const leafPos = useRef<number[]>([]);
  const leafEls = useRef<HTMLElement[]>([]);

  // Sayfa başlangıçlarının belge ilerlemesindeki yerleri (0–1).
  useEffect(() => {
    const root = rootRef.current;
    const bar = barRef.current;
    if (!root || !bar) return;

    const measure = () => {
      const pages = Array.from(root.querySelectorAll<HTMLElement>(".bro-bolum")).slice(1);
      const leaves = Array.from(bar.querySelectorAll<HTMLElement>("[data-leaf]"));
      // Önce tüm okumalar, sonra yazmalar: döngüde okuma/yazma karışırsa her
      // yaprak için ayrı zorunlu layout olur.
      const rootTop = root.getBoundingClientRect().top;
      const range = Math.max(1, root.offsetHeight - window.innerHeight);
      const tops = leaves.map((_, i) => {
        const page = pages[i];
        return page ? page.getBoundingClientRect().top - rootTop : range;
      });
      leafPos.current = tops.map((top, i) => {
        const pos = Math.min(1, Math.max(0, top / range));
        leaves[i].style.bottom = `${(pos * 100).toFixed(3)}%`;
        return pos;
      });
      leafEls.current = leaves;
    };

    measure();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(root);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useScrollProgressCallback(rootRef, (p) => {
    const bar = barRef.current;
    if (!bar) return;
    bar.style.setProperty("--p", p.toFixed(4));
    const leaves = leafEls.current;
    const pos = leafPos.current;
    for (let i = 0; i < leaves.length; i++) {
      const on = p >= (pos[i] ?? 1) - 0.004 ? "1" : "0";
      if (leaves[i].dataset.on !== on) leaves[i].dataset.on = on;
    }
  });

  return (
    <div ref={rootRef} className={`br-root relative ${className}`}>
      {/*
        Belge kaydırma davranışı (yumuşak çapa). Next 16 (cacheComponents)
        ayrılan rotayı <Activity hidden> ile DOM'da tutar; ref temizliği
        stili kapatır, böylece öteki sayfalara (/icinden adımlayıcısı) sızmaz.
      */}
      <style ref={enableWhileVisible}>{SNAP_CSS}</style>
      {children}
      <div ref={barRef} className="br-sapling" aria-hidden="true">
        <span className="br-sapling__track" />
        <span className="br-sapling__stem" />
        {Array.from({ length: leafCount }, (_, i) => (
          <span
            key={i}
            data-leaf=""
            data-side={i % 2 === 0 ? "r" : "l"}
            className="br-sapling__leaf"
            style={{ bottom: `${(((i + 1) / (leafCount + 1)) * 100).toFixed(3)}%` }}
          />
        ))}
        <span className="br-sapling__soil" />
        <span className="br-sapling__tip">
          <svg viewBox="0 0 16 16" width="16" height="16">
            <path
              d="M8 15C8 10 8.6 6.2 12.8 2.2c.6 3.7-.6 7.4-4.8 9.3"
              fill="var(--color-brand-green)"
            />
            <path
              d="M8 15c0-3.4-.5-5.5-3.8-7.6-.3 2.6.8 4.6 3.8 5.6"
              fill="var(--color-brand-teal)"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}
