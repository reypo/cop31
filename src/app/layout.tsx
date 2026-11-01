import type { Metadata, Viewport } from "next";
import { Great_Vibes, Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-script",
  display: "swap",
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
