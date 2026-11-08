import gorsel from "@/app/paylasim.jpg";
import type { Dil } from "@/lib/dil";

/**
 * Paylaşım önizleme görseli (og:image, twitter:image; 1200×630, resmî logo yok, atıf gerektirmez).
 * Dosya kuralı (app/opengraph-image.jpg) kullanılmıyor: kök yerleşimler rota gruplarında ((en), (tr)) olduğundan
 * kökteki dosya, yerleşimin openGraph'ı tarafından eziliyordu ve /, /dunya, /brosur önizlemesiz kalıyordu (ölçüldü).
 * Görseli her openGraph/twitter nesnesi açıkça verir: metadata sığ birleşir.
 */
const ALT: Record<Dil, string> = {
  en: "A globe among green leaves",
  tr: "Yeşil yapraklar arasında dünya küresi",
};

export function paylasimGorseli(dil: Dil) {
  return { url: gorsel.src, width: gorsel.width, height: gorsel.height, alt: ALT[dil] };
}
