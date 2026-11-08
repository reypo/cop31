import type { Metadata } from "next";
import type { CSSProperties } from "react";
import localFont from "next/font/local";
import { stant } from "@/lib/stant";
import DunyaIcerik from "@/components/dunya/DunyaIcerik";
import DunyaScene from "@/components/dunya/DunyaScene";

/**
 * Stant dilinin serif yazısı (sütun numaraları, "… bize miras." sloganı, "Buradasın / Bugün").
 * Yalnızca bu rotada yüklenir; `--font-serif` değişkeni /dunya sarmalayıcısına verilir
 * (layout.tsx'e dokunulmaz). Kullanım: dunya.css `.dn-serif`.
 * Değişken font (wght 400–700): ağırlık listesi gerekmez. Yalnızca normal stil: italik tek bir
 * 13 px İngilizce ifade ("A 12,000-Year Trust") için ~61 KB önyükleniyordu; <i> sentetik eğik çizilir.
 */
const seri = localFont({
  // Lora 3.008 alt kümesi ("Cop31 Serif", OFL §3); /icinden ile aynı dosya.
  src: "../../fonts/Cop31Serif.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  title: "COP31'de AK Gençlik — Antalya'dan Dünyaya",
  description: `${stant.tema}: ${stant.slogan} Antalya'dan dünyaya, COP31'de AK Gençlik. ${stant.hashtag}`,
};

/**
 * Stant paleti (src/lib/stant.ts) CSS değişkeni olarak: krem tema bölümleri (dunya.css
 * `.dn-krem`) ve sahne katmanları (zemin halkası) aynı kaynaktan okur. `satisfies`: değişken
 * adındaki yazım hatası derlemede yakalanır; CSSProperties'e dar cast yalnızca kullanım yerinde.
 */
const stantRenkleri = {
  "--dn-krem": stant.palet.krem,
  "--dn-koyu": stant.palet.koyuYesil,
  "--dn-ahsap": stant.palet.ahsap,
} satisfies Record<`--dn-${string}`, string>;

/**
 * Konsept A — "Antalya'dan Dünyaya" / "12.000 Yıllık Emanet". Sabit cobe küresi
 * arkada; önde 13 tam ekran bölüm (docs/brief-dunya-2.md §1). Her kaydırma hareketi
 * bir sonraki bölüme ~1 sn'lik geçişle gider; küre animasyonu bu geçişte oynar,
 * bölümde sahne sabit durur (spot döngüleri hariç). Tek etkileşim dikey scroll.
 * Kiosk modu (bölüm bölüm): /dunya?auto=1
 */
export default function DunyaPage() {
  return (
    <main className={`${seri.variable} dn-kok`} style={stantRenkleri as CSSProperties}>
      <DunyaScene>
        <DunyaIcerik />
      </DunyaScene>
    </main>
  );
}
