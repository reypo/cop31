/**
 * Site dili. İngilizce varsayılan (müşteri, 7 Kasım 2026: "site açılışta İngilizce gelecek, kullanıcı isterse Türkçeye
 * geçirecek"). Adresler: İngilizce kökte (/icinden, /brosur), Türkçe /tr altında (/tr/icinden, /tr/brosur).
 */
export type Dil = "en" | "tr";

export const DILLER: readonly Dil[] = ["en", "tr"];

/** Ziyaretçiye açık yolun dile göre adresi: yol("tr", "/icinden") → "/tr/icinden". */
export function yol(dil: Dil, p: "/icinden" | "/brosur"): string {
  return dil === "tr" ? `/tr${p}` : p;
}

export const oteki = (dil: Dil): Dil => (dil === "en" ? "tr" : "en");

/** Dil düğmesinin etiketi (kısa) ve erişilebilir adı. */
export const DIL_ETIKET: Record<Dil, { kisa: string; ad: string }> = {
  en: { kisa: "EN", ad: "English" },
  tr: { kisa: "TR", ad: "Türkçe" },
};
