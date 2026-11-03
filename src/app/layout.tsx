import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

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

const SITE_TITLE = "COP31'de AK Gençlik";
const SITE_DESCRIPTION = "Sürdürülebilir Bir Gelecek İçin Güçlü Gençlik Hareketi";

/**
 * Paylaşım önizlemelerindeki mutlak URL'lerin (og:image vb.) kökü.
 * Öncelik: NEXT_PUBLIC_SITE_URL → Vercel üretim alan adı → yerel geliştirme.
 * Şemasız verilen alan adına https:// eklenir; bozuk değer derlemeyi kırmaz.
 */
function siteUrl(): URL {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  ];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    } catch {
      // Geçersiz değer: bir sonrakine geç.
    }
  }
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_TITLE,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "AK Parti Gençlik Kolları",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0C77B6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${montserrat.variable} ${greatVibes.variable}`}>
      <body>{children}</body>
    </html>
  );
}
