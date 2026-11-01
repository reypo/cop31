/**
 * "12.000 Yıllık Emanet" — standın rotundasındaki 12 miras sütunu ve zemin halkasının dönemleri.
 * Brief: docs/brief-dunya-2.md §3. Okuma kaydı ve güven düzeyleri: docs/stant-icerik.md.
 * Müşteriye sorulacaklar: docs/onay-listesi.md.
 *
 * Kaynak: stant tasarım PDF'i (8 sayfa, render; metinler raster). Sütun yüzleri 1280×720 ve
 * 1536×864 gömülü render'lardan kırpılıp büyütülerek okundu; render metinlerinin bir kısmı
 * bozuk/yer tutucu. Sütun yüzünün yapısı (yukarıdan aşağı): "COP31 – N …" satırı · serif sıra
 * numarası · ad · il · bordo dönem çipi · tarih satırı (TR + EN italik) · tema çipi
 * (İKLİM / DOĞA / SIFIR ATIK) · serif slogan "… bize miras." + EN italik · KÖK / EMANET / FİLİZ.
 *
 * kaynak alanı:
 *   "pdf"         → ad, il, dönem ve emanet cümlesinin dayanağı PDF'te okunuyor.
 *   "pdf-kismi"   → ad/numara PDF'te okunuyor; il, dönem ya da cümle kısmen genel bilgiyle tamamlandı.
 *   "genel-bilgi" → PDF'te sütun içeriği okunamadı; Türkiye'nin tanınmış bir miras alanıyla dolduruldu.
 * onay: true → müşteri teyidi gerekiyor (docs/onay-listesi.md).
 *
 * filiz: sütunlardaki FİLİZ bölümünün metni hiçbir render'da okunamadı; bu yüzden hiçbir alanda yok.
 * "COP31 – N km / N Kasım" satırı (sütun başı) anlamı belirsiz olduğu için siteye taşınmadı;
 * sitede mesafe cop31KusUcusuKm() ile hesaplanır.
 */

export type EmanetAlani = {
  no: number; // 1–12, standdaki sütun numarası
  ad: string; // "Termessos"
  il: string; // "Antalya"
  donem: string; // "Helenistik" — çip metni (donemler[].ad ile birebir aynı)
  tur: "dogal" | "kulturel" | "karma";
  emanet: string; // 1 cümle: nedir, neden emanet (≤ 110 karakter)
  filiz?: string; // 1 cümle: gençliğe düşen (standdaki "FİLİZ"), varsa
  lat: number;
  lng: number;
  kaynak: "pdf" | "pdf-kismi" | "genel-bilgi";
  onay: boolean; // müşteri onayı gerekiyorsa true
};

export type Donem = { ad: string; renk: string; kisa: string }; // kronolojik

/**
 * Dönem halkası — standın zemin halkasındaki dönem etiketleri, saat yönünde ve aynı sırayla
 * ("GİRİŞ · ~12.000" işaretinden başlayıp "DOĞAL MİRAS" ile kapanır; halkadaki iki "SELÇUKLU"
 * etiketi tek dilimde birleştirildi, "GİRİŞ" ve "BUGÜN" dönem değil işaret olduğu için dilim değil).
 * Zemin halkasında büyük harfle yazılı; burada cümle düzeninde (text-transform kullanılmaz).
 *
 * renk: eski → yeni sıcak → soğuk akış. Antik dönemler turuncu/krem ailesi (toprak), orta çağ
 * mavi ailesi (su), Osmanlı'dan bugüne yeşil ailesi (yaprak), doğal miras standın koyu yeşili
 * ailesinden. Marka tokenları birebir kullanıldığında yanında not var.
 * kisa: halkanın küçük etiketleri için kısa ad (boşluk içeren ad zemin halkasında iki satıra bölünür).
 * "Bugüne" yerine "Günümüz": zemin halkasının ortasındaki büyük "Bugün"ün yanında yazım hatası gibi
 * okunuyordu. "Doğal miras" kronolojik bir dilim değil (onay-listesi §7).
 */
export const donemler: readonly Donem[] = [
  // ONAY: zemin halkasında GİRİŞ ile TUNÇ ÇAĞI arasındaki etiket okunamadı; konumu ve "~12.000" işareti
  // nedeniyle Neolitik varsayıldı.
  { ad: "Neolitik", renk: "#F2C48D", kisa: "Neolitik" },
  { ad: "Tunç Çağı", renk: "#F0A35A", kisa: "Tunç" },
  { ad: "Lidya – Demir Çağı", renk: "#F08322", kisa: "Lidya" }, // brand-orange
  { ad: "Likya – Helenistik", renk: "#D46F1C", kisa: "Likya" },
  { ad: "Helenistik – Roma", renk: "#A9581C", kisa: "Roma" },
  { ad: "Bizans", renk: "#5FA3CF", kisa: "Bizans" },
  { ad: "Selçuklu", renk: "#0C77B6", kisa: "Selçuklu" }, // brand-blue
  { ad: "Akkoyunlu", renk: "#1B4F9C", kisa: "Akkoyunlu" }, // brand-navy
  { ad: "Osmanlı", renk: "#47B27A", kisa: "Osmanlı" }, // brand-green
  { ad: "Osmanlı'dan bugüne", renk: "#1F8879", kisa: "Günümüz" }, // brand-teal
  { ad: "Doğal miras", renk: "#2F5D4A", kisa: "Doğal miras" }, // stant koyu yeşilinin (#28332F) bir ton açığı
] as const;

/**
 * Rotundanın 12 sütunu, standdaki numaraya göre sıralı.
 * Koordinatlar gerçek konumdur (alanın kendisi; ilçe/il merkezi değil), ~0,01° hassasiyet.
 *
 * Not (onay-listesi §1): sütun yüzünde 1 = Belgrad Ormanı okunuyor, ama zemin halkasının sırası
 * 3–11 numaralı sütunların dönemleriyle birebir örtüşüyor ve bu sıraya göre 1. konum Neolitik,
 * 12. konum "Doğal miras" olmalı. Müşteri Belgrad'ı 12'ye, Göbeklitepe'yi 1'e almak isterse
 * yalnızca iki `no` değeri yer değiştirir.
 */
export const emanetAlanlari: readonly EmanetAlani[] = [
  {
    // PDF okundu: "1 · Belgrad Or[manı] · İstanbul · DOĞAL MİRAS · Bizans – Osmanlı'da Şehrin Su
    // Kaynağı · DOĞA – EKOSİSTEM · Benli ve um… (okunamadı) · Tarihi bentleri ve su… ile şehrin can
    // damar[ı]… Zengin flora ve faun[a]…". Render'da 10. sütunda da aynı yüz tekrar ediyor.
    no: 1,
    ad: "Belgrad Ormanı",
    il: "İstanbul",
    donem: "Doğal miras",
    tur: "dogal",
    emanet: "Tarihi bentleriyle Bizans'tan Osmanlı'ya İstanbul'un su kaynağı olmuş orman.",
    lat: 41.18,
    lng: 28.97,
    kaynak: "pdf",
    onay: false,
  },
  {
    // PDF: 2. sütun hiçbir render'da görünmüyor. Zemin halkasında 2. konum "TUNÇ ÇAĞI".
    no: 2,
    ad: "Hattuşa",
    il: "Çorum",
    donem: "Tunç Çağı",
    tur: "kulturel",
    emanet: "Hititlerin başkenti; surları, tapınakları ve binlerce kil tabletiyle UNESCO Dünya Mirası.",
    lat: 40.02,
    lng: 34.62,
    kaynak: "genel-bilgi",
    onay: true,
  },
  {
    // PDF kısmen: "COP31 – 13 K… · 03 · Sardes · Manisa · LİDYA – DE[MİR ÇAĞI] · MÖ 7. y[üzyıl] /
    // 7th cen[tury] · Ka… (slogan okunamadı)". Zemin halkası 3. konum: "LİDYA – DEMİR ÇAĞI".
    no: 3,
    ad: "Sardes",
    il: "Manisa",
    donem: "Lidya – Demir Çağı",
    tur: "kulturel",
    emanet: "Lidya Krallığı'nın başkenti; ilk madeni paraları basan Lidyalıların kenti.",
    lat: 38.49,
    lng: 28.04,
    kaynak: "pdf-kismi",
    onay: true,
  },
  {
    // PDF kısmen (iki açıdan birleştirildi): "COP31 – 20 Kas[ım] · 04 · Letoon · Muğla ·
    // LİKYA – HEL[ENİSTİK] · MÖ 2. yüzyıl – ~2.200 yıl / 2nd century BCE · İKLİM – CLIMATE ·
    // Birlikte [karar] ver[mek] bize miras. / Deciding together…".
    no: 4,
    ad: "Letoon",
    il: "Muğla",
    donem: "Likya – Helenistik",
    tur: "kulturel",
    emanet: "Üç dilli yazıtıyla Likya'nın ortak kutsal alanı: birlikte karar vermek bize miras.",
    lat: 36.33,
    lng: 29.29,
    kaynak: "pdf-kismi",
    onay: true,
  },
  {
    // PDF kısmen: "COP31 – 15 ka… · 05 · Termesso[s] · Antalya · HELLENİSTİK – H… ·
    // Hellenistik-Roma Dö[nemi] · DOĞA – NATURE · Ormanla yaş[amak] bize miras · Living with the …".
    no: 5,
    ad: "Termessos",
    il: "Antalya",
    donem: "Helenistik – Roma",
    tur: "karma",
    emanet: "Güllük Dağı ormanlarının içindeki antik dağ kenti: ormanla yaşamak bize miras.",
    lat: 36.98,
    lng: 30.46,
    kaynak: "pdf-kismi",
    onay: true,
  },
  {
    // PDF kısmen: "COP31 – 10 ka… · 06 · Derinkuyu Yeraltı Şe[hri] · 'Nevyalta' (bozuk; Nevşehir) ·
    // dönem çipi bozuk ('…LANS OZZANR', büyük olasılıkla BİZANS) · Enerjiyi … etmemek … (bozuk)".
    // Zemin halkası 6. konum: "BİZANS".
    no: 6,
    ad: "Derinkuyu Yeraltı Şehri",
    il: "Nevşehir",
    donem: "Bizans",
    tur: "kulturel",
    emanet: "Tüf kayaya oyulmuş, havalandırma bacalarıyla nefes alan çok katlı yeraltı şehri.",
    lat: 38.37,
    lng: 34.73,
    kaynak: "pdf-kismi",
    onay: true,
  },
  {
    // PDF kısmen: "07 · Sultanh[anı] Kervans[arayı] · 1229–12… ". İl okunamadı (Aksaray, genel bilgi).
    // Zemin halkası 7. konum: "SELÇUKLU".
    no: 7,
    ad: "Sultanhanı Kervansarayı",
    il: "Aksaray",
    donem: "Selçuklu",
    tur: "kulturel",
    emanet: "1229'da yapılan, İpek Yolu'nun en büyük Selçuklu kervansaraylarından biri.",
    lat: 38.25,
    lng: 33.55,
    kaynak: "pdf-kismi",
    onay: true,
  },
  {
    // PDF kısmen: "COP31 – 14 ka… · 08 · (dönem çipi bozuk) · 1?. yüzyıl – ~7?0 yıl ·
    // Çifte Minare[li] Medrese…". İl okunamadı: Erzurum varsayıldı; Sivas'ta da aynı adlı
    // 13. yüzyıl medresesi var (onay-listesi). Zemin halkası 8. konum: "SELÇUKLU".
    no: 8,
    ad: "Çifte Minareli Medrese",
    il: "Erzurum",
    donem: "Selçuklu",
    tur: "kulturel",
    emanet: "İki minareli taç kapısıyla 13. yüzyıldan kalan taş medrese; Erzurum'un simgesi.",
    lat: 39.9,
    lng: 41.28,
    kaynak: "pdf-kismi",
    onay: true,
  },
  {
    // PDF kısmen: "COP31 – 14 km · 09 · Hevsel · Diyarbakır · [AKKOYUNLU] (soluk) · 15. yüzyıl – …
    // · Kendi … beslenen miras. (bozuk)". Zemin halkası 9. konum: "AKKOYUNLU".
    no: 9,
    ad: "Hevsel Bahçeleri",
    il: "Diyarbakır",
    donem: "Akkoyunlu",
    tur: "karma",
    emanet: "Dicle kıyısında kenti yüzyıllardır besleyen bahçeler; surlarla birlikte UNESCO mirası.",
    lat: 37.9,
    lng: 40.24,
    kaynak: "pdf-kismi",
    onay: true,
  },
  {
    // PDF: 10. sütunun yüzü render'da 1. sütunun (Belgrad Ormanı) birebir kopyası — yer tutucu.
    // Zemin halkası 10. konum: "OSMANLI".
    no: 10,
    ad: "Safranbolu",
    il: "Karabük",
    donem: "Osmanlı",
    tur: "kulturel",
    emanet: "Ahşap ve kerpiç konaklarıyla Osmanlı kent dokusunu yaşatan, UNESCO listesindeki kent.",
    lat: 41.24,
    lng: 32.69,
    kaynak: "genel-bilgi",
    onay: true,
  },
  {
    // PDF kısmen: "COP31 – 16 K… · 11 · Lületaşı Atölyele[ri] · Eskişehir · OSMANLI'DAN … ·
    // 1?. yüzyıldan … · SIFIR ATIK – ZERO [WASTE] · Taşı israf … işlemek bi[ze miras] ·
    // Carving stone without … heritage". Zemin halkası 11. konum: "OSMANLI'DAN BUGÜNE".
    no: 11,
    ad: "Lületaşı Atölyeleri",
    il: "Eskişehir",
    donem: "Osmanlı'dan bugüne",
    tur: "kulturel",
    emanet: "Eskişehir'in lületaşı ustalarının el emeği: taşı israf etmeden işlemek bize miras.",
    lat: 39.77,
    lng: 30.52,
    kaynak: "pdf-kismi",
    onay: true,
  },
  {
    // PDF: yalnızca numara ("12") ve başlık satırı görünüyor, içerik okunamadı. Zemin halkasında
    // sütunlara dağıtılmamış tek dönem Neolitik kaldı; "12.000 Yıllık Emanet" temasının çıkış noktası.
    no: 12,
    ad: "Göbeklitepe",
    il: "Şanlıurfa",
    donem: "Neolitik",
    tur: "kulturel",
    emanet: "Yaklaşık 12.000 yıllık dikilitaşlarıyla bilinen en eski anıtsal yapılar; emanetin başladığı yer.",
    lat: 37.22,
    lng: 38.92,
    kaynak: "genel-bilgi",
    onay: true,
  },
] as const;

/**
 * Antalya Expo (Aksu) — COP31 alanı. Değer src/components/dunya/iller.ts içindeki ANTALYA_EXPO
 * sabitinden KOPYALANDI (import edilmez: src/lib bileşen klasörlerine bağımlı olmasın).
 * İki dosyada da aynı kalmalı.
 */
const ANTALYA_EXPO = { lat: 36.94, lng: 30.86 } as const;

const DUNYA_YARICAPI_KM = 6371;

/** Alanın Antalya Expo'ya kuş uçuşu uzaklığı (haversine), 10 km'ye yuvarlı. */
export function cop31KusUcusuKm(a: EmanetAlani): number {
  const rad = Math.PI / 180;
  const dLat = (a.lat - ANTALYA_EXPO.lat) * rad;
  const dLng = (a.lng - ANTALYA_EXPO.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(ANTALYA_EXPO.lat * rad) * Math.cos(a.lat * rad) * Math.sin(dLng / 2) ** 2;
  const km = 2 * DUNYA_YARICAPI_KM * Math.asin(Math.min(1, Math.sqrt(h)));
  return Math.round(km / 10) * 10;
}
