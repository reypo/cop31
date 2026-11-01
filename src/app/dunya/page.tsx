import type { Metadata } from "next";
import { cover } from "@/lib/content";
import DunyaIcerik from "@/components/dunya/DunyaIcerik";
import DunyaScene from "@/components/dunya/DunyaScene";

export const metadata: Metadata = {
  title: "COP31'de AK Gençlik — Antalya'dan Dünyaya",
  description: cover.subtitle,
};

/**
 * Konsept A — "Antalya'dan Dünyaya". Sabit cobe küresi arkada; önde 8 tam
 * ekran bölüm. Her kaydırma hareketi bir sonraki bölüme ~1 sn'lik geçişle
 * gider; küre animasyonu bu geçişte oynar, bölümde sahne sabit durur.
 * Tek etkileşim dikey scroll. Kiosk modu (bölüm bölüm): /dunya?auto=1
 */
export default function DunyaPage() {
  return (
    <main>
      <DunyaScene>
        <DunyaIcerik />
      </DunyaScene>
    </main>
  );
}
