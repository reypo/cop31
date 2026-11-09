"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CEREZ, cerezDegeri, sifreDogru } from "@/lib/istatistik-oturum";

export type GirisDurumu = { hata?: string } | null;

/** Şifre formu: doğruysa 30 günlük çerez, sayfaya dön; yanlışsa 1 sn bekleyip hata (deneme hızını düşürür). */
export async function girisYap(_onceki: GirisDurumu, form: FormData): Promise<GirisDurumu> {
  const girilen = String(form.get("sifre") ?? "");
  if (!sifreDogru(girilen)) {
    await new Promise((r) => setTimeout(r, 1000));
    return { hata: "Şifre yanlış." };
  }
  (await cookies()).set(CEREZ, cerezDegeri(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/istatistik",
    maxAge: 30 * 86400,
  });
  redirect("/istatistik");
}
