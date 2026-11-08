import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { NextConfig } from "next";

/** /icinden v3 klip ve posterleri: adlarında içerik özeti var (scripts/icinden/kodla.mjs) → kalıcı önbellek. */
const KALICI = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

/**
 * Paralel ajan derlemeleri (brief-icinden-3 §12.9-5): `COP_DIST=.next-<ajan> next build` / `next start -p <port>`
 * her ajanı kendi dizinine yazar; port 3000'deki `next dev` (`.next/dev`) ve öteki ajanlar etkilenmez. Boşsa `.next`.
 *
 * `next build` tsconfig'in `include`'una `<distDir>/types/**` ekler (Next 16, writeConfigurationDefaults): her ajan
 * paylaşılan tsconfig.json'u değiştirmesin diye COP_DIST'li derleme `tsconfig.<dizin>.json`'u (tsconfig.json'u
 * genişletir, gitignore'lu) kullanır; dosya burada, eksikse yazılır. Path takma adları (`@/*`) tabandan gelir.
 */
const DIST = process.env.COP_DIST?.trim() || ".next";
function ajanTsconfig(dist: string): string | undefined {
  if (dist === ".next") return undefined;
  if (!/^\.next-[\w-]+$/.test(dist)) throw new Error(`COP_DIST "${dist}" geçersiz: .next-<ajan> biçiminde olmalı`);
  const ad = `tsconfig${dist}.json`;
  const taban = JSON.parse(readFileSync("tsconfig.json", "utf8")) as { include?: string[] };
  const icerik = JSON.stringify(
    {
      extends: "./tsconfig.json",
      include: [...(taban.include ?? []), `${dist}/types/**/*.ts`, `${dist}/dev/types/**/*.ts`],
      exclude: ["node_modules"],
    },
    null,
    2,
  );
  if (!existsSync(ad) || readFileSync(ad, "utf8") !== icerik) writeFileSync(ad, icerik);
  return ad;
}
const TSCONFIG = ajanTsconfig(DIST);

const nextConfig: NextConfig = {
  /* config options here */
  distDir: DIST,
  ...(TSCONFIG ? { typescript: { tsconfigPath: TSCONFIG } } : {}),
  cacheComponents: true,
  // İki kök yerleşim ((en) ve (tr) rota grupları): eşleşmeyen adreslerin 404'ü app/global-not-found.tsx (docs: not-found).
  experimental: { globalNotFound: true },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Site doğrudan /icinden ile açılır (8 Kasım 2026; varsayılan dil İngilizce, Türkçe /tr/icinden). Öteki konseptler
  // (/dunya, /fidan, /nabiz) ve konsept önizleme sayfası kaldırıldı; paylaşılmış eski adresler de /icinden'e gider.
  // 307 (permanent: false): tarayıcılar yönlendirmeyi kalıcı önbelleğe almaz.
  async redirects() {
    return [
      { source: "/", destination: "/icinden", permanent: false },
      { source: "/:eski(dunya|fidan|nabiz|konseptler)", destination: "/icinden", permanent: false },
    ];
  },
  async headers() {
    return [
      { source: "/icinden/v/:path*", headers: KALICI },
      { source: "/icinden/p/:path*", headers: KALICI },
      // Dijital broşür sayfa görüntüleri ve PDF'ler (adlarında içerik özeti: scripts/brosur/uret.mjs). "/brosur/:path*"
      // DEĞİL: `:path*` boş da eşleşir, /brosur sayfasının kendisi bir yıl önbelleğe girerdi.
      { source: "/brosur/en/:path*", headers: KALICI },
      { source: "/brosur/tr/:path*", headers: KALICI },
      { source: "/brosur/pdf/:path*", headers: KALICI },
      // Sekme simgeleri: adreste içerik özeti var (/icon.png?icon.<özet>.png). Next'in varsayılanı "max-age=0,
      // must-revalidate" ve doğrulayıcı (ETag) yok: broşürde her sayfa değişimi (#p=N, replaceState) Chrome'da simgeyi
      // yeniden istetiyordu (88 kB/çevirme, ölçüm .qa/brosur-2/bayt.json).
      { source: "/icon.png", headers: KALICI },
      { source: "/apple-icon.png", headers: KALICI },
    ];
  },
};

export default nextConfig;
