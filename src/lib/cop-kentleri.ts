/**
 * COP1–COP30 (1995–2025) ev sahibi kentleri, tekilleştirilmiş (27 kent), ilk ev sahipliği sırasıyla.
 * /icinden d1 ve d11'deki ışık yaylarının kaynağı (brief-icinden-3 §12.2). Sitede ad yazılmaz, yalnız
 * geometri kullanılır; yayların video px'leri scripts/blender/s1/yaylar.py ile üretilir (render-son/yaylar.json).
 * Koordinatlar elle girildi (olgu verisi, ±0,1°; kent merkezi). COP6'nın ikinci oturumu (2001) Bonn'da
 * yapıldı, numara Lahey'e yazıldı. COP13 Bali'de Nusa Dua'da. Bu dosya yaylar.py tarafından yazılır.
 */
export type CopKenti = {
  ad: string;
  ulke: string;
  coplar: readonly number[];
  lat: number;
  lng: number;
};

export const copKentleri: readonly CopKenti[] = [
  { ad: "Berlin", ulke: "Almanya", coplar: [1], lat: 52.52, lng: 13.4 },
  { ad: "Cenevre", ulke: "İsviçre", coplar: [2], lat: 46.2, lng: 6.14 },
  { ad: "Kyoto", ulke: "Japonya", coplar: [3], lat: 35.01, lng: 135.77 },
  { ad: "Buenos Aires", ulke: "Arjantin", coplar: [4, 10], lat: -34.6, lng: -58.38 },
  { ad: "Bonn", ulke: "Almanya", coplar: [5, 23], lat: 50.74, lng: 7.1 },
  { ad: "Lahey", ulke: "Hollanda", coplar: [6], lat: 52.08, lng: 4.3 },
  { ad: "Marakeş", ulke: "Fas", coplar: [7, 22], lat: 31.63, lng: -7.99 },
  { ad: "Yeni Delhi", ulke: "Hindistan", coplar: [8], lat: 28.61, lng: 77.21 },
  { ad: "Milano", ulke: "İtalya", coplar: [9], lat: 45.46, lng: 9.19 },
  { ad: "Montreal", ulke: "Kanada", coplar: [11], lat: 45.5, lng: -73.57 },
  { ad: "Nairobi", ulke: "Kenya", coplar: [12], lat: -1.29, lng: 36.82 },
  { ad: "Bali (Nusa Dua)", ulke: "Endonezya", coplar: [13], lat: -8.8, lng: 115.23 },
  { ad: "Poznań", ulke: "Polonya", coplar: [14], lat: 52.41, lng: 16.93 },
  { ad: "Kopenhag", ulke: "Danimarka", coplar: [15], lat: 55.68, lng: 12.57 },
  { ad: "Cancún", ulke: "Meksika", coplar: [16], lat: 21.16, lng: -86.85 },
  { ad: "Durban", ulke: "Güney Afrika", coplar: [17], lat: -29.86, lng: 31.02 },
  { ad: "Doha", ulke: "Katar", coplar: [18], lat: 25.29, lng: 51.53 },
  { ad: "Varşova", ulke: "Polonya", coplar: [19], lat: 52.23, lng: 21.01 },
  { ad: "Lima", ulke: "Peru", coplar: [20], lat: -12.05, lng: -77.04 },
  { ad: "Paris", ulke: "Fransa", coplar: [21], lat: 48.86, lng: 2.35 },
  { ad: "Katowice", ulke: "Polonya", coplar: [24], lat: 50.26, lng: 19.02 },
  { ad: "Madrid", ulke: "İspanya", coplar: [25], lat: 40.42, lng: -3.7 },
  { ad: "Glasgow", ulke: "Birleşik Krallık", coplar: [26], lat: 55.86, lng: -4.25 },
  { ad: "Şarm El-Şeyh", ulke: "Mısır", coplar: [27], lat: 27.92, lng: 34.33 },
  { ad: "Dubai", ulke: "Birleşik Arap Emirlikleri", coplar: [28], lat: 25.2, lng: 55.27 },
  { ad: "Bakü", ulke: "Azerbaycan", coplar: [29], lat: 40.41, lng: 49.87 },
  { ad: "Belém", ulke: "Brezilya", coplar: [30], lat: -1.46, lng: -48.5 },
];
