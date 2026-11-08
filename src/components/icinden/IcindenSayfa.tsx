import type { Metadata } from "next";
import type { CSSProperties } from "react";
import localFont from "next/font/local";
import { stant } from "@/lib/stant";
import Icinden3 from "./Icinden3";
import { DILLER, oteki, yol, type Dil } from "@/lib/dil";
import { paylasimGorseli } from "@/lib/paylasim";
import { METIN } from "./metin";

/**
 * Stant dilinin serif yazısı: v3'te durak başlıkları (600), İngilizce satırlar (400 italik), doğa
 * etiketleri (500 italik), sütun numaraları (700). Değişken yazı (ağırlık ekseni) iki stil; yalnız bu
 * rotada. `--font-serif` /icinden sarmalayıcısına verilir (layout.tsx'e dokunulmaz).
 */
const seri = localFont({
  // Lora 3.008 (OFL, Reserved Font Name "Lora"): alt kümelenmiş sürüm OFL §3 gereği "Cop31 Serif" adını taşır.
  // Aynı dosyalar /dunya'da; üretim komutları layout.tsx başlığında.
  src: [
    { path: "../../app/fonts/Cop31Serif.woff2", weight: "400 700", style: "normal" },
    { path: "../../app/fonts/Cop31Serif-Italic.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

/**
 * Dile göre üst veri (metin.ts `meta`). Dil eşleri: `alternates.languages` → <link rel="alternate" hreflang="en|tr|x-default">
 * (x-default İngilizce: site İngilizce açılır), canonical bulunulan dilin adresi; göreli adresler kökteki metadataBase'le
 * (kok.tsx) mutlaklaşır. openGraph `alternateLocale` öteki dil.
 */
export function icindenMetadata(dil: Dil): Metadata {
  const t = METIN[dil].meta;
  const gorsel = { ...paylasimGorseli(dil), alt: t.ogAlt };
  const adres = yol(dil, "/icinden");
  return {
    title: t.baslik,
    // Resmî COP31 logosu paylaşım önizlemesinde deneyimin parçası gibi sunulmaz (docs/cop31-logo.md §2).
    description: t.aciklama,
    alternates: {
      canonical: adres,
      languages: { ...Object.fromEntries(DILLER.map((d) => [d, yol(d, "/icinden")])), "x-default": yol("en", "/icinden") },
    },
    // Metadata sığ birleşir: openGraph/twitter burada verilmezse paylaşım önizlemesi sitenin genel başlığını
    // gösteriyordu (denetim A3-15). Görsel: lib/paylasim.ts.
    openGraph: {
      title: t.baslik,
      description: t.aciklama,
      url: adres,
      siteName: t.siteAdi,
      locale: t.yer,
      alternateLocale: [METIN[oteki(dil)].meta.yer],
      type: "website",
      images: [gorsel],
    },
    twitter: {
      card: "summary_large_image",
      title: t.baslik,
      description: t.aciklama,
      images: [gorsel],
    },
  };
}

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
export function IcindenSayfa({ dil }: { dil: Dil }) {
  return (
    <main className={seri.variable} style={stantRenkleri as CSSProperties}>
      <Icinden3 dil={dil} />
    </main>
  );
}
