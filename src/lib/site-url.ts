/**
 * Paylaşım önizlemelerindeki mutlak URL'lerin (og:image vb.) kökü (metadataBase).
 * Öncelik: NEXT_PUBLIC_SITE_URL → Vercel üretim alan adı → yerel geliştirme.
 * Şemasız verilen alan adına https:// eklenir; bozuk değer derlemeyi kırmaz.
 */
export function siteUrl(): URL {
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
