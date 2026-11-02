"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { dAbone } from "./derinlik";

/**
 * Durak metinleri (docs/brief-icinden.md §1 "Metin" sütunu, §4 panel kuralları).
 *
 * Hareketli düzende her durak metni `position: fixed` bir katmandır (icinden.css `.ic-dm`);
 * yalnızca opaklığı d'ye bağlıdır: |d − k| ≤ 0,12 platoda tam opak, 0,12…0,32 arasında söner.
 * Metin ve panel ASLA kaymaz/oynamaz (§2 canlılık kuralı); yalnızca opacity yazılır.
 * Reduced-motion'da aynı eleman bölümün içinde akışta durur (CSS), JS hiçbir şey yazmaz.
 *
 * Hidrasyon: render'da window yok. CSS varsayılanı yalnızca durak 0 metnini gösterir (JS gelmeden
 * açılış doğru); ilk dAbone çağrısı gerçek d'yi yazar.
 */

/** [girişBaşı, girişSonu, çıkışBaşı, çıkışSonu] (d birimi). */
export type Pencere = readonly [number, number, number, number];

const PLATO = 0.12;
const SONUM = 0.32;

/** k durağının varsayılan penceresi: platoda 1, platodan 0,2 d uzakta 0. */
export function durakPenceresi(k: number): Pencere {
  return [k - SONUM, k - PLATO, k + PLATO, k + SONUM];
}

function rampa(v: number, a: number, b: number): number {
  if (b <= a) return v >= b ? 1 : 0;
  const t = (v - a) / (b - a);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function pencereOpaklik(d: number, p: Pencere): number {
  return rampa(d, p[0], p[1]) * (1 - rampa(d, p[2], p[3]));
}

/**
 * Elemanın opaklığını d'ye bağlar. Değişmeyen değer yazılmaz. `data-gorunur` (opaklık > 0,5)
 * yalnızca link taşıyan metinlerde pointer-events'i açar (icinden.css).
 */
function useDurakOpakligi(pencere: Pencere) {
  const ref = useRef<HTMLDivElement>(null);
  const [a, b, c, e] = pencere;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const p: Pencere = [a, b, c, e];
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let son = "";
    const yaz = (d: number) => {
      if (mq.matches) {
        if (son !== "") {
          el.style.removeProperty("opacity");
          el.removeAttribute("data-gorunur");
          son = "";
        }
        return;
      }
      const o = pencereOpaklik(d, p);
      const s = o.toFixed(3);
      if (s === son) return;
      son = s;
      el.style.opacity = s;
      if (o > 0.5) el.setAttribute("data-gorunur", "");
      else el.removeAttribute("data-gorunur");
    };
    const birak = dAbone((d) => yaz(d));
    return () => {
      birak();
      el.style.removeProperty("opacity");
      el.removeAttribute("data-gorunur");
    };
  }, [a, b, c, e]);
  return ref;
}

/**
 * Bir durağın panel dışı metni (açılış şeridi, harita/stant/broşür satırları, d9 sloganı).
 * `yer`: icinden.css'teki sabit konum sınıfı (ör. "ic-yer-alt", "ic-yer-ust").
 */
export function DurakMetni({
  durak,
  pencere,
  yer = "ic-yer-alt",
  className = "",
  children,
}: {
  durak: number;
  pencere?: Pencere;
  yer?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useDurakOpakligi(pencere ?? durakPenceresi(durak));
  return (
    <div ref={ref} data-durak-metni={durak} className={`ic-dm ${yer} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Panel (yalnızca d1 ve d4): %94 opak düz beyaz, backdrop-filter YOK, ≤ 42svh, başlık ≤ 2 satır,
 * gövde ≤ 45 kelime. Dikeyde altta (en çok 480 px), yatayda (vw/H ≥ 4:3) sağda en çok %38.
 * Başlık görsel; bölümün sr-only <h2>'si aynı metni ekran okuyucuya verir (çift okunmasın diye
 * görsel başlık aria-hidden). `en`: başlığın tek satırlık İngilizce karşılığı.
 */
export function Panel({
  durak,
  etiket,
  baslik,
  en,
  children,
}: {
  durak: number;
  etiket?: ReactNode;
  baslik: ReactNode;
  /** ONAY: İngilizce satırlar müşteri onayına bağlı (docs/onay-listesi.md §14). */
  en: string;
  children?: ReactNode;
}) {
  return (
    <DurakMetni durak={durak} yer="ic-yer-panel">
      <div className="ic-panel">
        {etiket ? <p className="ic-etiket">{etiket}</p> : null}
        <p aria-hidden="true" className="ic-panel-baslik">
          {baslik}
        </p>
        <En>{en}</En>
        {children}
      </div>
    </DurakMetni>
  );
}

/** Başlığın altındaki tek satır İngilizce karşılık. ONAY: metinler müşteri onayına bağlı. */
export function En({ children, className = "" }: { children: string; className?: string }) {
  return (
    <p lang="en" data-onay="en" className={`ic-en ${className}`}>
      {children}
    </p>
  );
}
