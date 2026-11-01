/**
 * Konsept C — "Gezegenin Nabzı" — veri kaynakları (brief §7 C).
 *
 * Buradaki tüm sayılar YAKLAŞIKTIR ve anlatım içindir; resmî veri seti değildir.
 * Her sabitin kaynağı SOURCE_NOTES içinde aynı adla tutulur ve sayfada
 * ilgili bölümün altında kısa haliyle gösterilir.
 *
 * Saf TypeScript; hem server hem client bileşenlerinden import edilebilir.
 */

/* ------------------------------------------------------------------ */
/* CO₂ emisyonu (canlı sayaç)                                          */
/* ------------------------------------------------------------------ */

/** 2024 küresel fosil kaynaklı CO₂ emisyonu tahmini, ton/yıl. */
export const CO2_TONS_PER_YEAR = 37.4e9;

/** Jülyen yılı (365,25 gün) saniye cinsinden. */
export const SECONDS_PER_YEAR = 31_557_600;

/** Saniyede salınan CO₂, ton/s (≈ 1.185). */
export const CO2_TONS_PER_SECOND = CO2_TONS_PER_YEAR / SECONDS_PER_YEAR;

/* ------------------------------------------------------------------ */
/* Atmosferdeki CO₂ derişimi                                           */
/* ------------------------------------------------------------------ */

/** 2024 yıllık ortalama CO₂ derişimi, ppm (NOAA GML, Mauna Loa; yaklaşık). */
export const CO2_PPM_2024 = 424.6;

/** Sanayi öncesi (~1750) CO₂ derişimi, ppm (buz karotları; yaklaşık). */
export const PREINDUSTRIAL_PPM = 280;

/** Ölçeğin üst sınırı (ppm). Ölçek 0'dan başlar; artış dürüstçe orantılı görünür. */
export const PPM_SCALE_MAX = 450;

/** 2024 değerinin sanayi öncesine göre yüzde artışı (≈ 52). */
export const PPM_INCREASE_PERCENT = Math.round((CO2_PPM_2024 / PREINDUSTRIAL_PPM - 1) * 100);

/* ------------------------------------------------------------------ */
/* Küresel sıcaklık anomalileri (ısınma şeritleri)                     */
/* ------------------------------------------------------------------ */

export const ANOMALY_FIRST_YEAR = 1850;
export const ANOMALY_LAST_YEAR = 2024;

/**
 * 1850–2024 yıllık küresel ortalama yüzey sıcaklığı anomalisi (°C), 1961–1990
 * ortalamasına göre. HadCRUT5'e (Met Office Hadley Centre / CRU) yaklaşan,
 * elle yazılmış TEMSİLÎ değerler: genel eğri ve yıllar arası dalgalanma
 * gerçeğe yakındır, tek tek değerler ±0,1 °C sapabilir.
 *
 * Tutarlılık kontrolleri: 1850–1900 ortalaması ≈ −0,35; 1961–1990 ortalaması
 * ≈ 0; 2016 ≈ 0,93; 2023 ≈ 1,10; 2024 ≈ 1,18 (sanayi öncesine göre ≈ +1,5).
 * 175 değer; indeks 0 = 1850.
 */
export const ANOMALIES: readonly number[] = [
  // 1850–1859
  -0.42, -0.23, -0.23, -0.27, -0.29, -0.30, -0.32, -0.47, -0.39, -0.28,
  // 1860–1869
  -0.39, -0.43, -0.54, -0.34, -0.47, -0.33, -0.34, -0.36, -0.35, -0.32,
  // 1870–1879 (1877–78: güçlü El Niño)
  -0.28, -0.33, -0.31, -0.32, -0.38, -0.42, -0.40, -0.12, -0.05, -0.26,
  // 1880–1889
  -0.32, -0.27, -0.31, -0.37, -0.46, -0.46, -0.43, -0.48, -0.37, -0.27,
  // 1890–1899
  -0.47, -0.42, -0.53, -0.53, -0.49, -0.44, -0.27, -0.28, -0.45, -0.35,
  // 1900–1909
  -0.23, -0.29, -0.44, -0.53, -0.60, -0.47, -0.40, -0.55, -0.59, -0.59,
  // 1910–1919
  -0.56, -0.59, -0.47, -0.47, -0.26, -0.19, -0.42, -0.54, -0.42, -0.32,
  // 1920–1929
  -0.30, -0.24, -0.32, -0.31, -0.32, -0.24, -0.11, -0.22, -0.22, -0.37,
  // 1930–1939
  -0.18, -0.10, -0.17, -0.32, -0.17, -0.21, -0.16, -0.04, -0.03, -0.03,
  // 1940–1949
  0.06, 0.08, 0.04, 0.05, 0.14, 0.03, -0.09, -0.07, -0.11, -0.13,
  // 1950–1959
  -0.19, -0.06, -0.02, 0.05, -0.15, -0.20, -0.23, 0.00, 0.03, 0.01,
  // 1960–1969
  -0.04, 0.05, 0.02, 0.04, -0.24, -0.16, -0.09, -0.07, -0.12, 0.01,
  // 1970–1979
  -0.03, -0.14, -0.04, 0.08, -0.15, -0.09, -0.20, 0.07, -0.02, 0.06,
  // 1980–1989
  0.13, 0.17, 0.04, 0.20, 0.04, 0.01, 0.08, 0.21, 0.24, 0.15,
  // 1990–1999 (1998: güçlü El Niño)
  0.30, 0.26, 0.08, 0.11, 0.18, 0.31, 0.21, 0.37, 0.53, 0.30,
  // 2000–2009
  0.29, 0.44, 0.50, 0.51, 0.44, 0.57, 0.53, 0.55, 0.43, 0.56,
  // 2010–2019
  0.64, 0.50, 0.54, 0.58, 0.64, 0.79, 0.93, 0.85, 0.76, 0.89,
  // 2020–2024
  0.92, 0.76, 0.80, 1.10, 1.18,
];

/** Okuma satırında gösterilen kısa notlar (yıl → not). */
export const ANOMALY_NOTES: Readonly<Record<number, string>> = {
  1850: "Ölçüm serisinin başı",
  1878: "Güçlü El Niño yılı",
  1904: "Serinin en serin yıllarından",
  1961: "1961–1990: referans dönemi",
  1998: "Güçlü El Niño yılı",
  2016: "El Niño; o güne dek en sıcak yıl",
  2023: "Rekor sıcak yıl",
  2024: "Kayıtlardaki en sıcak yıl",
};

/* ------------------------------------------------------------------ */
/* Isınma şeritleri renk ölçeği                                       */
/* ------------------------------------------------------------------ */

/** Renk ölçeği alt/üst sınırı (°C). 0 (1961–1990 ortalaması) beyazımsı. */
export const STRIPE_MIN = -1;
export const STRIPE_MAX = 1.3;

/**
 * Iraksak ölçek: koyu mavi (#08306B) → beyazımsı (#F7F7F7) → koyu kırmızı
 * (#67000D). Ara duraklar ColorBrewer Blues/Reds tonlarıdır.
 */
export const STRIPE_STOPS: readonly (readonly [value: number, hex: string])[] = [
  [-1.0, "#08306B"],
  [-0.7, "#08519C"],
  [-0.45, "#2171B5"],
  [-0.25, "#6BAED6"],
  [-0.1, "#C6DBEF"],
  [0.0, "#F7F7F7"],
  [0.15, "#FEE0D2"],
  [0.35, "#FCBBA1"],
  [0.55, "#FC9272"],
  [0.75, "#FB6A4A"],
  [0.95, "#EF3B2C"],
  [1.1, "#CB181D"],
  [1.3, "#67000D"],
];

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Anomali değerini (°C) ölçekteki renge çevirir: "rgb(r, g, b)". */
export function stripeColor(value: number): string {
  const v = Math.min(STRIPE_MAX, Math.max(STRIPE_MIN, value));
  for (let i = 1; i < STRIPE_STOPS.length; i++) {
    const [v1, c1] = STRIPE_STOPS[i];
    if (v <= v1) {
      const [v0, c0] = STRIPE_STOPS[i - 1];
      const t = v1 === v0 ? 1 : (v - v0) / (v1 - v0);
      const a = hexToRgb(c0);
      const b = hexToRgb(c1);
      const mix = (k: 0 | 1 | 2) => Math.round(a[k] + (b[k] - a[k]) * t);
      return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
    }
  }
  return STRIPE_STOPS[STRIPE_STOPS.length - 1][1];
}

/** Lejant için CSS linear-gradient (soldan sağa STRIPE_MIN → STRIPE_MAX). */
export const STRIPE_LEGEND_GRADIENT = `linear-gradient(90deg, ${STRIPE_STOPS.map(
  ([v, c]) => `${c} ${(((v - STRIPE_MIN) / (STRIPE_MAX - STRIPE_MIN)) * 100).toFixed(1)}%`,
).join(", ")})`;

/* ------------------------------------------------------------------ */
/* COP31 geri sayımı                                                   */
/* ------------------------------------------------------------------ */

/** COP31 kapanışı: 20 Kasım 2026 gün sonu (Antalya, UTC+3). Başlangıç: content.cop31.startIso. */
export const COP31_END_ISO = "2026-11-20T23:59:59+03:00";

/** Konferansın 1. gününün başlangıcı (Antalya gece yarısı); "N. gün" hesabı için. */
export const COP31_DAY1_ISO = "2026-11-09T00:00:00+03:00";

/** Konferans gün sayısı (9–20 Kasım dahil = 12). */
export const COP31_DAYS = Math.round((Date.parse(COP31_END_ISO) + 1000 - Date.parse(COP31_DAY1_ISO)) / 86_400_000);

/* ------------------------------------------------------------------ */
/* Kaynak notları                                                      */
/* ------------------------------------------------------------------ */

export const SOURCE_NOTES = {
  CO2_TONS_PER_YEAR:
    "Global Carbon Project, Global Carbon Budget 2024: 2024 için fosil kaynaklı CO₂ emisyonu projeksiyonu ≈ 37,4 milyar ton (arazi kullanımı değişikliği hariç).",
  SECONDS_PER_YEAR: "Jülyen yılı: 365,25 gün × 86.400 s = 31.557.600 s.",
  CO2_TONS_PER_SECOND:
    "CO2_TONS_PER_YEAR / SECONDS_PER_YEAR ≈ 1.185 ton/s. Yıl içine eşit dağıtılmış ortalama; gerçek emisyon saatten saate değişir.",
  CO2_PPM_2024:
    "NOAA Global Monitoring Laboratory, Mauna Loa Gözlemevi 2024 yıllık ortalaması ≈ 424,6 ppm (yaklaşık).",
  PREINDUSTRIAL_PPM:
    "Antarktika buz karotu kayıtlarına göre sanayi öncesi (~1750) düzey ≈ 280 ppm (yaklaşık).",
  PPM_INCREASE_PERCENT: "424,6 / 280 − 1 ≈ %52.",
  ICE_CORE_800K:
    "Antarktika buz karotları (EPICA Dome C vb.): son 800.000 yılda CO₂ yaklaşık 170–300 ppm arasında kaldı; bugünkü düzey bu aralığın çok üstünde.",
  ANOMALIES:
    "HadCRUT5 (Met Office Hadley Centre & University of East Anglia CRU) yıllık küresel ortalamalarına yaklaşan temsilî değerler, 1961–1990 referansı. Resmî seri için: crudata.uea.ac.uk / metoffice.gov.uk/hadobs.",
  ANOMALY_NOTES: "El Niño yılları ve rekorlar: WMO ve Met Office yıllık iklim raporları.",
  STRIPE_STOPS:
    "Görselleştirme fikri: Ed Hawkins (University of Reading), \"Warming Stripes\" / #ShowYourStripes. Renk tonları: ColorBrewer Blues/Reds.",
  COP31_END_ISO:
    "COP31 tarihleri 9–20 Kasım 2026 (content.cop31.dates); açılış 9 Kasım 09:00 (UTC+3) kabul edilmiştir.",
  COP31_DAY1_ISO: "9 Kasım 2026 00:00 (UTC+3); etkinlik sürerken \"12 günün N. günü\" satırı buna göre hesaplanır.",
} as const;

export type SourceKey = keyof typeof SOURCE_NOTES;
