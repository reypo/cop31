import type { ReactNode } from "react";

/**
 * Durak metin bandı (brief-icinden-3 §5): scrim üstünde doğrudan metin (kart/panel yok, backdrop-filter yok).
 * Hareketli düzende `position: fixed`; görünürlüğü kökün `data-metin` özniteliği belirler (CSS:
 * `.v3[data-metin="k"] .v3-bant[data-d="k"]`): jestte 200 ms'de söner, klibin son 250 ms'sinde 350 ms'lik
 * opaklık girişi (kayma yok). Reduced-motion'da aynı eleman akışta, düz zeminde.
 *
 * konum: "ust" | "alt" (mobil); yatay ekranda (vw/H ≥ 4:3) hepsi sağda ≤ %38 genişlikte, sağdan sola scrim.
 * tema: scrim rengi ve alfası §5 tablosundan (uzay #070B14 ≥ 0,68; altın #1A1714 ≥ 0,66 — C turu, A1-13;
 * hol #16181B ≥ 0,65; krem #F7E6CD ≥ 0,70).
 */
export type BantTema = "uzay" | "altin" | "hol" | "krem";

export default function MetinBandi({
  d,
  konum,
  tema,
  className = "",
  children,
}: {
  d: number;
  konum: "ust" | "alt";
  tema: BantTema;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-d={d} className={`v3-bant v3-bant-${konum} v3-tema-${tema} ${className}`}>
      <div className="v3-bant-ic">{children}</div>
    </div>
  );
}

/** İngilizce tek satır (ONAY, onay-listesi §14). */
export function En({ children }: { children: ReactNode }) {
  return (
    <p lang="en" data-onay="en" className="v3-en">
      {children}
    </p>
  );
}
