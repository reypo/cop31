import type { Metadata } from "next";
import { cover } from "@/lib/content";
import DunyaIcerik from "@/components/dunya/DunyaIcerik";
import DunyaScene from "@/components/dunya/DunyaScene";

export const metadata: Metadata = {
  title: "COP31'de AK Gençlik — Antalya'dan Dünyaya",
  description: cover.subtitle,
};

/**
 * Konsept A — "Antalya'dan Dünyaya". Sabit cobe küresi arkada; önde kayan
 * metin panelleri. Tek etkileşim dikey scroll. Kiosk modu: /dunya?auto=1
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
