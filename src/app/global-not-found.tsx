import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

/**
 * İki kök yerleşim olduğundan ((en), (tr)) eşleşmeyen adreslerin sayfası (docs: not-found "global-not-found").
 * Yerleşimleri atlar: yazı sistem yazısı, iki dilde kısa metin.
 */
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "404 — Page not found / Sayfa bulunamadı",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100svh", display: "grid", placeItems: "center", background: "#0c2446", color: "#fff", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 16 }}>
        <main>
          <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Page not found</h1>
          <p lang="tr" style={{ margin: "0 0 20px", opacity: 0.8 }}>Sayfa bulunamadı</p>
          <p style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/icinden" style={{ color: "#bee83a" }}>Inside COP31</Link>
            <Link href="/tr/icinden" lang="tr" style={{ color: "#bee83a" }}>COP31&apos;in İçinden</Link>
          </p>
        </main>
      </body>
    </html>
  );
}
