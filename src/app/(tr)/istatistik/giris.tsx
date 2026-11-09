"use client";

import { useActionState } from "react";
import { girisYap, type GirisDurumu } from "./eylemler";

export function GirisFormu() {
  const [durum, gonder, bekliyor] = useActionState<GirisDurumu, FormData>(girisYap, null);
  return (
    <form action={gonder} className="mt-6 flex max-w-sm flex-col gap-3">
      <label htmlFor="sifre" className="text-sm font-bold text-brand-navy">
        Şifre
      </label>
      <input
        id="sifre"
        name="sifre"
        type="password"
        required
        autoComplete="current-password"
        className="rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
        aria-describedby={durum?.hata ? "sifre-hata" : undefined}
      />
      {durum?.hata ? (
        <p id="sifre-hata" role="alert" className="text-sm font-semibold text-red-700">
          {durum.hata}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={bekliyor}
        className="rounded-full bg-brand-blue px-6 py-3 text-base font-extrabold text-white disabled:opacity-60"
      >
        {bekliyor ? "Kontrol ediliyor…" : "Göster"}
      </button>
    </form>
  );
}
