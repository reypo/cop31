import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * /istatistik şifresi (ISTATISTIK_SIFRE, Vercel ortam değişkeni): tek ortak şifre; bilen herkes görür. Doğru girilince
 * 30 günlük httpOnly çerez (değeri şifreden türetilmiş imza; şifre değişince eski çerezler geçersiz). Şifre ayarlanmamışsa
 * sayfa veri göstermez, kurulum yönergesi gösterir.
 */

export const CEREZ = "istatistik";
const sifre = () => process.env.ISTATISTIK_SIFRE?.trim() || "";
const imza = (s: string) => createHmac("sha256", s).update("istatistik:v1").digest("hex");
const ozet = (s: string) => createHash("sha256").update(s).digest();

export const sifreAyarli = () => sifre() !== "";

/** Girilen şifre doğru mu (sabit sürede karşılaştırma). */
export function sifreDogru(girilen: string): boolean {
  const s = sifre();
  return s !== "" && timingSafeEqual(ozet(girilen.trim()), ozet(s));
}

/** Çerez değeri (yalnız şifre doğruysa yazılır). */
export const cerezDegeri = () => imza(sifre());

/** İstekteki çerez geçerli mi. */
export async function oturumVar(): Promise<boolean> {
  const s = sifre();
  if (!s) return false;
  const c = (await cookies()).get(CEREZ)?.value ?? "";
  const beklenen = imza(s);
  return c.length === beklenen.length && timingSafeEqual(Buffer.from(c), Buffer.from(beklenen));
}
