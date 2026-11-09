import { cacheLife } from "next/cache";

/**
 * /istatistik veri katmanı (9 Kasım 2026; kullanıcı: "siteye kaç kişinin girdiğini birden fazla kişi görebilsin"): sayılar
 * Vercel Web Analytics'ten (src/app/kok.tsx `<Analytics />`), Vercel'in REST API'si ile sunucuda okunur. Kendi
 * veritabanımız yok; anahtar yalnız sunucuda (tarayıcıya gitmez).
 *
 * Vercel'de gereken ortam değişkenleri (Production):
 * - VERCEL_ACCESS_TOKEN: Account Settings → Tokens ile oluşturulan anahtar; kapsamı yalnız bu proje (Project scope: takım
 *   kimliği gerekmez, başka projelere erişemez), son kullanma tarihli, "Sensitive" işaretli. Vercel'de salt okunur anahtar yok.
 * - ISTATISTIK_SIFRE: sayfanın şifresi (oturum.ts).
 * - VERCEL_PROJECT_ID: Vercel'in sistem değişkeni, kendiliğinden gelir.
 * - VERCEL_TEAM_ID (isteğe bağlı): proje bir takımdaysa; verilmezse anahtarın erişebildiği takımlar sırayla denenir.
 * - ISTATISTIK_API (yalnız yerel deneme): API kökü yerine sahte sunucu (varsayılan https://api.vercel.com).
 *
 * Sorgular: /v1/query/web-analytics/visits/count (toplam, gün gün) ve /visits/aggregate (sayfa, ülke, cihaz, kaynak).
 * İstatistik sayfasının kendi görüntülemeleri süzülür. Sonuç 2 dakika önbellekte (sayfayı açan herkes API'yi yormasın).
 */

/** Fuarın ilk günü, Türkiye saatiyle (COP31: 9–20 Kasım 2026). Günler Türkiye saatine göre bölünür (UTC+3, yaz saati yok). */
export const BASLANGIC = Date.parse("2026-11-09T00:00:00+03:00");
const TR_FARK = 3 * 3600_000;
const GUN = 86400_000;
/** Bir günün Türkiye saatiyle başlangıcı (ms). */
const gunBasi = (t: number) => Math.floor((t + TR_FARK) / GUN) * GUN - TR_FARK;
/**
 * Ücretsiz planın (Hobby) rapor penceresi 1 ay: aggregate sorguları yalnız bu pencerede veri döndürür; gün tablosu ve
 * kırılımlar son 30 güne sınırlı. (Vercel Pro'da 12 ay.)
 */
const EN_COK_GUN = 30;

const SUZGEC = "requestPath ne '/istatistik'";

export type Sayim = { giris: number; ziyaretci: number };
export type Satir = Sayim & { ad: string };
export type Gun = Sayim & { gun: number };
export type Istatistik = {
  alindi: number;
  toplam: Sayim;
  bugun: Sayim;
  gunler: Gun[];
  sayfalar: Satir[];
  ulkeler: Satir[];
  cihazlar: Satir[];
  kaynaklar: Satir[];
};
export type Sonuc = { tamam: true; veri: Istatistik } | { tamam: false; hata: string };

export class ApiHatasi extends Error {
  constructor(readonly durum: number) {
    super(`Vercel API ${durum}`);
  }
}

const kok = () => (process.env.ISTATISTIK_API || "https://api.vercel.com").replace(/\/$/, "");
const anahtar = () => process.env.VERCEL_ACCESS_TOKEN?.trim() || "";
const proje = () => process.env.VERCEL_PROJECT_ID?.trim() || process.env.VERCEL_PROJECT_NAME?.trim() || "";

/** Kurulum eksikse eksik değişkenlerin adları. */
export function eksikAyarlar(): string[] {
  const e: string[] = [];
  if (!anahtar()) e.push("VERCEL_ACCESS_TOKEN");
  if (!proje()) e.push("VERCEL_PROJECT_ID");
  return e;
}

async function getir(yol: string, q: Record<string, string | number | undefined>): Promise<unknown> {
  const u = new URL(kok() + yol);
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== "") u.searchParams.set(k, String(v));
  const r = await fetch(u, { headers: { Authorization: `Bearer ${anahtar()}` } });
  if (!r.ok) throw new ApiHatasi(r.status);
  return r.json();
}

/**
 * Takım kimliği: VERCEL_TEAM_ID verildiyse o; yoksa önce takımsız (kişisel hesap), olmazsa anahtarın gördüğü takımlar
 * sırayla denenir. Bulunan, sunucu örneği yaşadıkça hatırlanır.
 */
let bulunanTakim: string | undefined | null = null; // null: henüz bilinmiyor; undefined: takımsız
async function takimBul(dene: (takim: string | undefined) => Promise<unknown>): Promise<string | undefined> {
  const ortam = process.env.VERCEL_TEAM_ID?.trim();
  if (ortam) return ortam;
  if (bulunanTakim !== null) return bulunanTakim;
  try {
    await dene(undefined);
    return (bulunanTakim = undefined);
  } catch (e) {
    if (!(e instanceof ApiHatasi) || (e.durum !== 403 && e.durum !== 404)) throw e;
    const ilkHata = e;
    // Tek projeye sınırlı anahtar takımları listeleyemeyebilir: o zaman asıl hata gösterilsin.
    const yanit = (await getir("/v2/teams", { limit: 20 }).catch(() => ({}))) as { teams?: { id: string }[] };
    for (const t of yanit.teams ?? []) {
      try {
        await dene(t.id);
        return (bulunanTakim = t.id);
      } catch (e2) {
        if (!(e2 instanceof ApiHatasi) || (e2.durum !== 403 && e2.durum !== 404)) throw e2;
      }
    }
    throw ilkHata;
  }
}

const sayi = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const sayim = (d: unknown): Sayim => {
  const o = (d ?? {}) as { pageviews?: unknown; visitors?: unknown };
  return { giris: sayi(o.pageviews), ziyaretci: sayi(o.visitors) };
};

async function topla(simdi: number): Promise<Istatistik> {
  const projectId = proje();
  const sayimGetir = (takim: string | undefined, since: number, until: number) =>
    getir("/v1/query/web-analytics/visits/count", { projectId, teamId: takim, since, until, filter: SUZGEC }).then(
      (y) => sayim((y as { data?: unknown }).data),
    );
  const takim = await takimBul((t) => sayimGetir(t, BASLANGIC, simdi));

  const bugunBasi = gunBasi(simdi);
  const ilkGun = Math.max(BASLANGIC, bugunBasi - (EN_COK_GUN - 1) * GUN);
  const kirilimBasi = Math.max(BASLANGIC, simdi - EN_COK_GUN * GUN + 3600_000);
  const gunBaslari: number[] = [];
  for (let g = ilkGun; g <= bugunBasi; g += GUN) gunBaslari.push(g);

  const kirilim = async (by: string, limit: number): Promise<Satir[]> => {
    const y = (await getir("/v1/query/web-analytics/visits/aggregate", {
      projectId,
      teamId: takim,
      by,
      since: kirilimBasi,
      until: simdi,
      limit,
      filter: SUZGEC,
    })) as { data?: Record<string, unknown>[] };
    // Doğrudan gelişler "" ve null olarak iki satır gelebiliyor: aynı ada düşenler birleşir (ziyaretçi toplamı yaklaşık).
    // "Others" (limit dışı kalanlar) sıradan bir satır olarak, çoğu zaman başta gelir: sona alınır.
    const birlesik = new Map<string, Satir>();
    for (const s of y.data ?? []) {
      const ad = typeof s[by] === "string" ? (s[by] as string) : "";
      const n = sayim(s);
      const o = birlesik.get(ad);
      birlesik.set(ad, o ? { ad, giris: o.giris + n.giris, ziyaretci: o.ziyaretci + n.ziyaretci } : { ad, ...n });
    }
    return [...birlesik.values()].sort((a, b) => Number(a.ad === "Others") - Number(b.ad === "Others") || b.giris - a.giris);
  };

  const [toplam, gunler, sayfalar, ulkeler, cihazlar, kaynaklar] = await Promise.all([
    sayimGetir(takim, BASLANGIC, simdi),
    Promise.all(gunBaslari.map(async (g) => ({ gun: g, ...(await sayimGetir(takim, g, Math.min(simdi, g + GUN - 1))) }))),
    kirilim("requestPath", 20),
    kirilim("country", 12),
    kirilim("deviceType", 6),
    kirilim("referrerHostname", 10),
  ]);
  const son = gunler[gunler.length - 1];
  const bugun = son && son.gun === bugunBasi ? { giris: son.giris, ziyaretci: son.ziyaretci } : { giris: 0, ziyaretci: 0 };
  return { alindi: simdi, toplam, bugun, gunler: gunler.reverse(), sayfalar, ulkeler, cihazlar, kaynaklar };
}

const HATA: Record<number, string> = {
  400: "Vercel sorguyu geçersiz buldu (400).",
  401: "Anahtar geçersiz ya da süresi dolmuş (401). Vercel'de yeni bir anahtar oluşturup VERCEL_ACCESS_TOKEN'ı güncelleyin.",
  402: "Vercel bu sorguya bu planda izin vermiyor (402).",
  403: "Anahtarın bu projeye yetkisi yok (403). Anahtarı projenin bulunduğu hesap/takım kapsamında oluşturun.",
  404: "Proje bulunamadı ya da Web Analytics etkin değil (404). Vercel'de projede Analytics → Enable.",
  429: "Çok sık sorgulandı (429). Birkaç dakika sonra yenileyin.",
};

/** Bütün sayılar; 2 dakika önbellekte (sunucu örneği başına, en iyi çaba). Hata da önbelleğe girer: API'yi yormaz. */
export async function istatistikler(): Promise<Sonuc> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 600 });
  try {
    return { tamam: true, veri: await topla(Date.now()) };
  } catch (e) {
    const durum = e instanceof ApiHatasi ? e.durum : 0;
    return { tamam: false, hata: HATA[durum] ?? (durum ? `Vercel API hatası (${durum}).` : "Vercel'e ulaşılamadı.") };
  }
}
