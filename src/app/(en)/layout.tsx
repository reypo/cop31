import { KokBelge, kokMetadata, kokViewport } from "../kok";

/** İngilizce kök (varsayılan dil): /icinden, /brosur. */
export const metadata = kokMetadata("en");
export const viewport = kokViewport;

export default function KokEn({ children }: { children: React.ReactNode }) {
  return <KokBelge dil="en">{children}</KokBelge>;
}
