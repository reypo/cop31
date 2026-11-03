import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Lora } from "next/font/google";
import { stant } from "@/lib/stant";
import Icinden3 from "@/components/icinden/Icinden3";
// Kökteki paylaşım görseli: sayfada openGraph verilince dosya kuralıyla gelen görsel miras alınmıyor (ölçüldü).
import ogGorsel from "../opengraph-image.jpg";

/**
 * Stant dilinin serif yazısı: v3'te durak başlıkları (600), İngilizce satırlar (400 italik), doğa
 * etiketleri (500 italik), sütun numaraları (700). Değişken yazı (ağırlık ekseni) iki stil; yalnız bu
 * rotada. `--font-serif` /icinden sarmalayıcısına verilir (layout.tsx'e dokunulmaz).
 */
const lora = Lora({
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
});

const BASLIK = "COP31'in İçinden — AK Gençlik";
const OG_GORSEL = { url: ogGorsel.src, width: ogGorsel.width, height: ogGorsel.height, alt: "Yeşil yapraklar arasında dünya küresi" };
const ACIKLAMA = `Uzaydan Antalya Expo'daki standımıza ve broşürümüze, bölüm bölüm bir dalış. ${stant.tema} · ${stant.hashtag}`;

export const metadata: Metadata = {
  title: BASLIK,
  // Resmî COP31 logosu paylaşım önizlemesinde deneyimin parçası gibi sunulmaz (docs/cop31-logo.md §2).
  description: ACIKLAMA,
  // Metadata sığ birleşir: openGraph/twitter burada verilmezse paylaşım önizlemesi sitenin genel başlığını
  // gösteriyordu (denetim A3-15). Görsel kökteki opengraph-image (resmî logo yok, atıf gerektirmez).
  openGraph: {
    title: BASLIK,
    description: ACIKLAMA,
    siteName: "AK Parti Gençlik Kolları",
    locale: "tr_TR",
    type: "website",
    images: [OG_GORSEL],
  },
  twitter: {
    card: "summary_large_image",
    title: BASLIK,
    description: ACIKLAMA,
    images: [OG_GORSEL],
  },
};

/** Stant paleti (src/lib/stant.ts) CSS değişkeni olarak. */
const stantRenkleri = {
  "--ic-krem": stant.palet.krem,
  "--ic-koyu": stant.palet.koyuYesil,
  "--ic-ahsap": stant.palet.ahsap,
} satisfies Record<`--ic-${string}`, string>;

/**
 * "COP31'in İçinden" v3 (docs/brief-icinden-3.md §9): resmî logodan Dünya'ya, Akdeniz'e, Antalya Expo'ya,
 * standa, rotundaya ve broşüre; önceden render edilmiş kliplerle kilitli bölüm bölüm adımlama. Tek
 * etkileşim dikey kaydırma. Kiosk: /icinden?auto=1. v2 motoru (derinlik.ts, cobe, SVG katmanları) B turunda
 * silindi; v2'den yalnız broşür (Brosur.tsx) ve kapanış kaldı.
 */
export default function IcindenPage() {
  return (
    <main className={lora.variable} style={stantRenkleri as CSSProperties}>
      <Icinden3 />
    </main>
  );
}
