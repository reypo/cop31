/**
 * Dijital broşür görüntüleyicisinin ortak sabitleri (sunucu + istemci + açılış betiği): sayfa oranı, kip sorgusu,
 * görüntü boyutu seçimi, görüntü adresi ve arayüz yazıları (EN/TR; müşterinin görüntüleyicisindeki karşılıklar).
 */
import type { Dil } from "@/lib/dil";

/** PDF sayfası 595,276 × 841,89 pt (A4). Sayfa kutusu her ekranda tam bu oranda; görüntü object-fit: contain. */
export const SAYFA_ORAN = 595.276 / 841.89;

/** Yayılım (iki sayfa yan yana): geniş yatay ekran. CSS'teki @media ile aynı sorgu (brosur.css). */
export const CIFT_SORGU = "(min-width: 900px) and (orientation: landscape)";

/**
 * Ekrana sığdırma görüntüsü: gereken aygıt pikseli (sayfa kutusu CSS genişliği × devicePixelRatio) ≤ 840 → 800 px,
 * ≤ 1550 → 1240 px, üstü (büyük yüksek DPI masaüstü) → 2480 px. 393 px'lik DPR 3 telefon: 361 × 3 = 1083 → 1240.
 * Yakınlaşınca gereken > seçilenin 1,15 katı olursa 2480 iner (kitap.ts).
 */
export const ESIK_800 = 840;
export const ESIK_1240 = 1550;
export type Genislik = 120 | 240 | 800 | 1240 | 2480;
export type Bicim = "avif" | "webp";

export function sigdirGenislik(gereken: number): 800 | 1240 | 2480 {
  return gereken <= ESIK_800 ? 800 : gereken <= ESIK_1240 ? 1240 : 2480;
}

/**
 * Görüntü adresi. WebP yedeği yalnız 120, 240 ve 1240'ta var (AVIF çözemeyen tarayıcı: sığdırma ve yakınlaştırma 1240).
 */
export function gorselYolu(dil: Dil, ozet: readonly string[], sayfa: number, w: Genislik, bicim: Bicim): string {
  const g = bicim === "webp" && w > 240 ? 1240 : w;
  return `/brosur/${dil}/p${String(sayfa).padStart(2, "0")}-${g}.${ozet[sayfa - 1]}.${bicim}`;
}

/** 1×1 AVIF (4:4:4, 284 bayt): yükleniyorsa tarayıcı AVIF çözüyor. */
export const AVIF_SINAMA =
  "data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANZtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAACJpbG9jAAAAAERAAAEAAQAAAAAA+gABAAAAAAAAACIAAAAjaWluZgAAAAAAAQAAABVpbmZlAgAAAAABAABhdjAxAAAAAA5waXRtAAAAAAABAAAAVmlwcnAAAAA4aXBjbwAAAAxhdjFDgSACAAAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAABZpcG1hAAAAAAAAAAEAAQOBAgMAAAAqbWRhdBIACgc4AAaQENBpMhUZQmMEwAA0AACQQMkcYUIacm0BPzA=";

/** Adresteki sayfa: `#p=N` (müşterinin görüntüleyicisiyle aynı biçim). */
export function adrestenSayfa(hash: string, n: number): number | null {
  const m = /^#p=(\d+)$/.exec(hash);
  if (!m) return null;
  return Math.min(n, Math.max(1, Number(m[1])));
}

/** Görünen sayfalar: tek kipte [p]; yayılımda kapak sağda tek, son sayfa (çift sayılıysa) solda tek, arası (2,3)…(24,25). */
export type Gorunum = { sol: number | null; sag: number | null };

export function gorunumBul(p: number, cift: boolean, n: number): Gorunum {
  if (!cift) return { sol: null, sag: p };
  if (p <= 1) return { sol: null, sag: 1 };
  const a = p - (p % 2);
  return { sol: a, sag: a + 1 <= n ? a + 1 : null };
}

export const YAZI = {
  en: {
    ust: "AK Party Youth Branches · COP31",
    baslik: "1 Million Youth, One Common Home",
    geri: "Inside COP31",
    sayfa: "Page",
    bolum: "SECTION",
    sayfalar: "Pages",
    tumSayfalar: "All pages",
    metin: "Text",
    sayfaMetni: "Page text",
    pdf: "PDF",
    pdfIndir: "Download PDF",
    kapat: "Close",
    onceki: "Previous page",
    sonraki: "Next page",
    yakinlas: "Zoom in",
    uzaklas: "Zoom out",
    dil: "Language",
    ipucu: "Swipe or use ← → to turn pages · double-tap to zoom",
    ipucuMasa: "← → keys, click or swipe to turn pages · Ctrl + scroll to zoom",
    kitap: "Brochure pages",
    sayfaSecimi: "Page thumbnails",
    yukleniyor: "Loading page",
    sayac: (a: string, n: number) => `Page ${a} of ${n}`,
  },
  tr: {
    ust: "AK Parti Gençlik Kolları · COP31",
    baslik: "1 Milyon Genç, Tek Ortak Ev",
    geri: "COP31'in İçinden",
    sayfa: "Sayfa",
    bolum: "BÖLÜM",
    sayfalar: "Sayfalar",
    tumSayfalar: "Tüm sayfalar",
    metin: "Metin",
    sayfaMetni: "Sayfa metni",
    pdf: "PDF",
    pdfIndir: "PDF indir",
    kapat: "Kapat",
    onceki: "Önceki sayfa",
    sonraki: "Sonraki sayfa",
    yakinlas: "Yakınlaştır",
    uzaklas: "Uzaklaştır",
    dil: "Dil",
    ipucu: "Sayfa çevirmek için kaydırın ya da ← → · yakınlaştırmak için çift dokunun",
    ipucuMasa: "← → tuşları, tıklama ya da kaydırma ile sayfa çevirin · Ctrl + tekerlek ile yakınlaştırın",
    kitap: "Broşür sayfaları",
    sayfaSecimi: "Sayfa küçük resimleri",
    yukleniyor: "Sayfa yükleniyor",
    sayac: (a: string, n: number) => `Sayfa ${a} / ${n}`,
  },
} as const;

export type Yazilar = (typeof YAZI)[Dil];
