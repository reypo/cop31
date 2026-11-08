import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import type { Dil } from "@/lib/dil";
import { paylasimGorseli } from "@/lib/paylasim";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

/*
 * Ortak kök: iki kök yerleşim bunu kullanır (rota grupları, docs: route-groups "multiple root layouts").
 * (en)/layout.tsx → <html lang="en">: /icinden, /brosur (site İngilizce açılır). (tr)/layout.tsx → <html lang="tr">:
 * /tr/icinden, /tr/brosur ve Türkçe konsept sayfaları (/, /dunya, /fidan, /nabiz). Kök yerleşimler arası geçiş tam
 * sayfa yüklemesidir (dil değişimi); /icinden durağı sessionStorage "icinden-donus" ile korunur (VideoSahne).
 */

/*
 * Yazılar depoya sabit (src/app/fonts/, OFL; kaynak github.com/google/fonts, Google Fonts'un sunduğu sürümlerle aynı:
 * Montserrat 9.000, Great Vibes 1.103). next/font/google derleme anında Google'dan indiriyordu ve bir derlemede
 * Montserrat +54,7 kB büyük geldi (M3); artık bayt belirlenimli. Alt küme: Google'ın latin + latin-ext aralıkları +
 * src/ içinde geçen ASCII dışı karakterler (← → ↔ hariç: E'de sistem yazısından çiziliyordu, öyle kalsın), ipucusuz (Google da ipucusuz sunuyor), Google'ın latin dosyasındaki OpenType
 * özellikleri (kern, liga, locl TRK, tnum, pnum …). Üretim komutları: .qa/icinden3/f/wf/ (fonttools pyftsubset).
 */

/** Değişken yazı (wght). Yüz aralığı 400–900: Google yüzleri 400/500/600/700/900 idi, 400 altı istenmiyor. */
const montserrat = localFont({
  src: "./fonts/Montserrat.woff2",
  weight: "400 900",
  style: "normal",
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: "Arial",
});

const greatVibes = localFont({
  src: "./fonts/GreatVibes.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-script",
  display: "swap",
  adjustFontFallback: "Arial",
});

const SITE = {
  tr: { baslik: "COP31'de AK Gençlik", aciklama: "Sürdürülebilir Bir Gelecek İçin Güçlü Gençlik Hareketi", yer: "tr_TR", ad: "AK Parti Gençlik Kolları" },
  en: { baslik: "AK Youth at COP31", aciklama: "A Strong Youth Movement for a Sustainable Future", yer: "en_US", ad: "AK Party Youth Branches" },
} as const;

/** Kök üst verisi (dile göre); sayfalar kendi başlık/açıklamasıyla sığ birleşir. */
export function kokMetadata(dil: Dil): Metadata {
  const t = SITE[dil];
  const gorsel = paylasimGorseli(dil);
  return {
    metadataBase: siteUrl(),
    title: t.baslik,
    description: t.aciklama,
    applicationName: t.baslik,
    openGraph: { title: t.baslik, description: t.aciklama, siteName: t.ad, locale: t.yer, type: "website", images: [gorsel] },
    twitter: { card: "summary_large_image", title: t.baslik, description: t.aciklama, images: [gorsel] },
  };
}

export const kokViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0C77B6",
};

/**
 * <html>/<body> kabuğu. data-scroll-behavior: /brosur'un yumuşak çapa kaydırması rota geçişinde Next 16'nın tepeye
 * kaydırmasını da yumuşatıyordu; öznitelikle Next geçiş sırasında geçici `auto` yazar (docs: upgrading/version-16).
 *
 * Ziyaretçi sayımı (9 Kasım 2026; kullanıcı: "siteye kaç kişinin girdiğini listeleyelim, backend bağlantısı olmasın"):
 * Vercel Web Analytics. Kendi sunucumuz/veritabanımız yok; sayfa görüntülemesi aynı kökene (/_vercel/insights/*)
 * gönderilir, rakamlar Vercel panelinde (proje → Analytics). Çerez yok, ziyaretçi 24 saatlik özetle sayılır. Adres
 * değişince bir görüntüleme: /icinden'deki duraklar ve broşürdeki #p=N sayfa çevirmeleri sayılmaz. Panelde etkinleştirilmeden
 * ve Vercel dışında betik 404 döner, site etkilenmez.
 */
export function KokBelge({ dil, children }: { dil: Dil; children: ReactNode }) {
  return (
    <html lang={dil} data-scroll-behavior="smooth" className={`${montserrat.variable} ${greatVibes.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
