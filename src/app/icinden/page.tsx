import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Lora } from "next/font/google";
import { stant } from "@/lib/stant";
import IcindenIcerik from "@/components/icinden/IcindenIcerik";

/**
 * Stant dilinin serif yazısı (sütun numaraları, "Buradasın / Bugün", emanet cümleleri).
 * Yalnızca bu rotada yüklenir; `--font-serif` değişkeni /icinden sarmalayıcısına verilir
 * (layout.tsx'e dokunulmaz). Kullanım: icinden.css `.ic-serif`.
 */
const lora = Lora({
  weight: ["400", "600", "700"],
  style: ["normal"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "COP31'in İçinden — AK Gençlik",
  // Resmî COP31 logosu paylaşım önizlemesinde deneyimin parçası gibi sunulmaz (docs/cop31-logo.md §2).
  description: `Antalya Expo'daki standımıza ve broşürümüze tek bir kaydırmayla yolculuk. ${stant.tema} · ${stant.hashtag}`,
};

/**
 * Stant paleti (src/lib/stant.ts) CSS değişkeni olarak: krem zemin, koyu yeşil, ahşap.
 * icinden.css ve katman içerikleri (sütun yüzleri, broşür) aynı kaynaktan okur.
 */
const stantRenkleri = {
  "--ic-krem": stant.palet.krem,
  "--ic-koyu": stant.palet.koyuYesil,
  "--ic-ahsap": stant.palet.ahsap,
} satisfies Record<`--ic-${string}`, string>;

/**
 * "COP31'in İçinden" (docs/brief-icinden.md): resmî COP31 logosundan başlayıp küre → Antalya
 * Expo → stant → rotunda → broşür → arka kapaktaki küre fotoğrafı → küre diye süren, kaydırmaya
 * bağlı tek bir kamera dalışı. Tek etkileşim dikey kaydırma. Kiosk: /icinden?auto=1
 */
export default function IcindenPage() {
  return (
    <main className={`${lora.variable} ic-kok`} style={stantRenkleri as CSSProperties}>
      <IcindenIcerik />
    </main>
  );
}
