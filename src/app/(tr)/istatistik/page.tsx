import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { BASLANGIC, eksikAyarlar, istatistikler, type Gun, type Sayim, type Satir } from "@/lib/istatistik";
import { oturumVar, sifreAyarli } from "@/lib/istatistik-oturum";
import { GirisFormu } from "./giris";

/**
 * /istatistik: sitenin ziyaretçi sayıları (9 Kasım 2026). Şifreli (ISTATISTIK_SIFRE), arama motorlarına kapalı, sitede
 * hiçbir yerden bağlantı yok. Veri: src/lib/istatistik.ts (Vercel Web Analytics API). Şifre/çerez: istatistik-oturum.ts.
 * Statik kabuk başlık; oturum ve sayılar istek anında, Suspense arkasında (cacheComponents).
 */
export const metadata: Metadata = {
  title: "Ziyaretçi istatistikleri",
  robots: { index: false, follow: false },
};

const sayi = new Intl.NumberFormat("tr-TR");
const gunAdi = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", weekday: "short" });
const saat = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });
const tarih = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long" });
const ulkeAdi = new Intl.DisplayNames(["tr"], { type: "region" });

const SAYFA: Record<string, string> = {
  "/icinden": "Inside COP31 (İngilizce)",
  "/tr/icinden": "COP31'in İçinden (Türkçe)",
  "/brosur": "Dijital broşür (İngilizce)",
  "/tr/brosur": "Dijital broşür (Türkçe)",
  "/": "Ana adres (/)",
};
const CIHAZ: Record<string, string> = { desktop: "Bilgisayar", mobile: "Telefon", tablet: "Tablet" };
const diger = (ad: string) => (ad === "Others" ? "Diğer" : null);
const sayfaAdi = (ad: string) => diger(ad) ?? SAYFA[ad] ?? (ad || "Bilinmiyor");
const ulke = (ad: string) => {
  if (diger(ad)) return "Diğer";
  try {
    return ad ? (ulkeAdi.of(ad.toUpperCase()) ?? ad) : "Bilinmiyor";
  } catch {
    return ad;
  }
};
const cihaz = (ad: string) => diger(ad) ?? CIHAZ[ad.toLowerCase()] ?? (ad || "Bilinmiyor");
const kaynak = (ad: string) => diger(ad) ?? (ad || "Doğrudan (QR kod, adres yazarak)");

export default function IstatistikSayfasi() {
  return (
    <main className="mx-auto min-h-svh max-w-3xl bg-white px-4 py-8 font-display text-brand-ink sm:px-6 sm:py-12">
      <p className="text-xs font-bold tracking-wider text-brand-blue uppercase">AK Parti Gençlik Kolları · COP31 sitesi</p>
      <h1 className="mt-1 text-2xl font-black text-brand-navy sm:text-3xl">Ziyaretçi istatistikleri</h1>
      <Suspense fallback={<p className="mt-8 text-sm">Yükleniyor…</p>}>
        <Icerik />
      </Suspense>
    </main>
  );
}

async function Icerik() {
  await connection(); // ortam değişkenleri ve çerez istek anında okunsun (derlemede değil)
  const eksik = [...eksikAyarlar(), ...(sifreAyarli() ? [] : ["ISTATISTIK_SIFRE"])];
  if (eksik.length) return <Kurulum eksik={eksik} />;
  if (!(await oturumVar()))
    return (
      <>
        <p className="mt-4 text-sm">Sayıları görmek için şifreyi girin.</p>
        <GirisFormu />
      </>
    );
  const sonuc = await istatistikler();
  if (!sonuc.tamam)
    return (
      <Kutu baslik="Sayılar alınamadı">
        <p className="text-sm">{sonuc.hata}</p>
      </Kutu>
    );
  const v = sonuc.veri;
  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Ozet baslik="Bugün" s={v.bugun} />
        <Ozet baslik={`${tarih.format(BASLANGIC)}'dan beri`} s={v.toplam} />
      </div>
      <GunTablosu gunler={v.gunler} />
      <Liste baslik="Sayfalar" satirlar={v.sayfalar} ad={sayfaAdi} />
      <Liste baslik="Ülkeler" satirlar={v.ulkeler} ad={ulke} />
      <Liste baslik="Cihazlar" satirlar={v.cihazlar} ad={cihaz} />
      <Liste baslik="Nereden gelindi" satirlar={v.kaynaklar} ad={kaynak} />
      <div className="mt-8 space-y-1 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-600">
        <p>
          <b>Giriş:</b> her sayfa açılışı (yenileme dahil). <b>Ziyaretçi:</b> aynı cihaz aynı gün bir kez sayılır (çerezsiz,
          yaklaşık); günler toplanınca aynı kişi farklı günlerde yeniden sayılır.
        </p>
        <p>
          Kaynak: Vercel Web Analytics. Sayılar birkaç dakikada bir yenilenir; son güncelleme {saat.format(v.alindi)}. Ücretsiz
          planda ayda 50.000 giriş sayılır, aşılırsa sayım bir süre durur.
        </p>
      </div>
    </>
  );
}

function Kutu({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 p-4 sm:p-5">
      <h2 className="mb-3 text-base font-extrabold text-brand-navy">{baslik}</h2>
      {children}
    </section>
  );
}

function Ozet({ baslik, s }: { baslik: string; s: Sayim }) {
  return (
    <section className="rounded-2xl bg-brand-mist p-4 sm:p-5">
      <h2 className="text-sm font-bold text-brand-navy">{baslik}</h2>
      <p className="mt-1 text-4xl font-black text-brand-blue tabular-nums">{sayi.format(s.giris)}</p>
      <p className="text-sm">
        giriş · <b className="tabular-nums">{sayi.format(s.ziyaretci)}</b> ziyaretçi
      </p>
    </section>
  );
}

function GunTablosu({ gunler }: { gunler: Gun[] }) {
  const enCok = Math.max(1, ...gunler.map((g) => g.giris));
  return (
    <Kutu baslik="Günlere göre">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500">
            <th className="pb-2 font-semibold">Gün</th>
            <th className="w-2/5 pb-2 font-semibold">
              <span className="sr-only">Grafik</span>
            </th>
            <th className="pb-2 text-right font-semibold">Giriş</th>
            <th className="pb-2 text-right font-semibold">Ziyaretçi</th>
          </tr>
        </thead>
        <tbody>
          {gunler.map((g) => (
            <tr key={g.gun} className="border-t border-slate-100">
              <td className="py-2 pr-2 whitespace-nowrap">{gunAdi.format(g.gun)}</td>
              <td className="py-2 pr-3" aria-hidden="true">
                <div className="h-2 rounded-full bg-brand-blue" style={{ width: `${(g.giris / enCok) * 100}%`, minWidth: g.giris ? 4 : 0 }} />
              </td>
              <td className="py-2 text-right font-bold tabular-nums">{sayi.format(g.giris)}</td>
              <td className="py-2 pl-3 text-right tabular-nums">{sayi.format(g.ziyaretci)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Kutu>
  );
}

function Liste({ baslik, satirlar, ad }: { baslik: string; satirlar: Satir[]; ad: (s: string) => string }) {
  return (
    <Kutu baslik={baslik}>
      {satirlar.length ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="pb-2 font-semibold">
                <span className="sr-only">{baslik}</span>
              </th>
              <th className="pb-2 pl-3 text-right font-semibold">Giriş</th>
              <th className="pb-2 pl-3 text-right font-semibold">Ziyaretçi</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.map((s) => (
              <tr key={s.ad} className="border-t border-slate-100">
                <td className="py-2 pr-2 break-words">{ad(s.ad)}</td>
                <td className="py-2 pl-3 text-right font-bold tabular-nums">{sayi.format(s.giris)}</td>
                <td className="py-2 pl-3 text-right tabular-nums">{sayi.format(s.ziyaretci)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-slate-500">Henüz veri yok.</p>
      )}
    </Kutu>
  );
}

function Kurulum({ eksik }: { eksik: string[] }) {
  return (
    <Kutu baslik="Kurulum bekleniyor">
      <p className="text-sm">Vercel&apos;de şu ortam değişkenleri eksik:</p>
      <ul className="mt-2 list-disc pl-5 text-sm font-semibold">
        {eksik.map((e) => (
          <li key={e}>
            <code>{e}</code>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">
        Proje → Settings → Environment Variables bölümünden ekleyip projeyi yeniden yayınlayın (Deployments → Redeploy).
      </p>
    </Kutu>
  );
}
