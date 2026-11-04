import type { Metadata } from "next";
import type { CSSProperties } from "react";
import localFont from "next/font/local";
import { stant } from "@/lib/stant";
import Icinden3 from "@/components/icinden/Icinden3";
// Kökteki paylaşım görseli: sayfada openGraph verilince dosya kuralıyla gelen görsel miras alınmıyor (ölçüldü).
import ogGorsel from "../opengraph-image.jpg";

/**
 * Stant dilinin serif yazısı: v3'te durak başlıkları (600), İngilizce satırlar (400 italik), doğa
 * etiketleri (500 italik), sütun numaraları (700). Değişken yazı (ağırlık ekseni) iki stil; yalnız bu
 * rotada. `--font-serif` /icinden sarmalayıcısına verilir (layout.tsx'e dokunulmaz).
 */
const seri = localFont({
  // Lora 3.008 (OFL, Reserved Font Name "Lora"): alt kümelenmiş sürüm OFL §3 gereği "Cop31 Serif" adını taşır.
  // Aynı dosyalar /dunya'da; üretim komutları layout.tsx başlığında.
  src: [
    { path: "../fonts/Cop31Serif.woff2", weight: "400 700", style: "normal" },
    { path: "../fonts/Cop31Serif-Italic.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const BASLIK = "COP31'in İçinden — AK Gençlik";
const OG_GORSEL = { url: ogGorsel.src, width: ogGorsel.width, height: ogGorsel.height, alt: "Yeşil yapraklar arasında dünya küresi" };
const ACIKLAMA = `Uzaydan Antalya Expo'daki standımıza, oradan bizi anlatan bir fidana ve yeniden Dünya'ya: bölüm bölüm bir dalış. ${stant.tema} · ${stant.hashtag}`;

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
 * "COP31'in İçinden" v3 (docs/brief-icinden-3.md §9, G turu §14.4, §14.7): resmî logodan Dünya'ya, Akdeniz'e, Antalya Expo'ya,
 * standa, rotundaya, duvarlara, oradan köklenip büyüyen fidana ve yeniden Dünya'ya (W-3: masa durağı kalktı); önceden
 * render edilmiş kliplerle kilitli bölüm
 * bölüm adımlama. Tek etkileşim dikey kaydırma. Kiosk: /icinden?auto=1. v2 motoru B turunda, DOM broşürü (Brosur.tsx)
 * G turunda silindi ("Dijital broşür" bağlantısı /brosur'a gider); v2'den yalnız kapanış kaldı.
 */
export default function IcindenPage() {
  return (
    <main className={seri.variable} style={stantRenkleri as CSSProperties}>
      <Icinden3 />
    </main>
  );
}
