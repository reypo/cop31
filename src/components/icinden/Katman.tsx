"use client";

import type { ReactNode } from "react";
import type { KatmanId } from "./derinlik";

/**
 * Derinlik katmanı: 1000×1000 nominal kutu (1 px = 1 birim). Konum/ölçek/opaklık YALNIZCA
 * IcindenSahne'nin efektinden satır içi yazılır; bu sarmalayıcıda React `style` prop'u yoktur
 * (yeniden render dönüşümü ezmesin). İçerik yüzde ya da px ile yerleşir.
 *
 * A: <IcindenSahne katmanlar={<Katman id="brosur">…</Katman>}> — sahne bu elemanı kendi sırasına
 * yerleştirir (bkz. derinlik.ts başlığı).
 */
export default function Katman({ id, children }: { id: KatmanId; children?: ReactNode }) {
  return (
    <div data-katman={id} className="ic-katman">
      {children}
    </div>
  );
}
