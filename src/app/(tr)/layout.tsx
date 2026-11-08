import { KokBelge, kokMetadata, kokViewport } from "../kok";

/** Türkçe kök: /tr/icinden, /tr/brosur ve Türkçe konsept sayfaları (/, /dunya, /fidan, /nabiz). */
export const metadata = kokMetadata("tr");
export const viewport = kokViewport;

export default function KokTr({ children }: { children: React.ReactNode }) {
  return <KokBelge dil="tr">{children}</KokBelge>;
}
