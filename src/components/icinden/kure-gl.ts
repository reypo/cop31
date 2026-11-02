/*
 * cobe ayarları (/icinden küresi). Ayrı, küçük modül: IcindenSahne (istemci) bunu okur; harita verisi
 * (expo-harita.ts, ~35 kB) istemci paketine girmesin diye Expo'nun coğrafi konumu burada sayı olarak
 * durur. Değer expo-harita.ts `expoHarita.merkez` ile AYNIDIR (o dosyadaki konum() de aynı sabitleri
 * kullanır); harita yeniden üretilip orijin değişirse ikisi birlikte güncellenir.
 */

type RGB = [number, number, number];
const hex = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

/** Expo poligonunun alan ağırlık merkezi (expo-harita.ts `expoHarita.merkez`). */
export const EXPO_KONUM = { lat: 36.9397171, lng: 30.8175767 } as const;

/**
 * /dunya'nın açık GL_COLORS'ı (DunyaScene/sahne.ts'ten kopya; beyaz zemin, lacivert uzay YOK).
 * Expo koordinatı öne bakar (phi/theta = sahne.ts focusPhi/focusTheta).
 */
export const KUREGL = {
  base: [0.76, 0.84, 0.92] as RGB,
  glow: [0.78, 0.88, 1.0] as RGB,
  orange: hex("#F08322"),
  mapBrightness: 0.82,
  expo: [EXPO_KONUM.lat, EXPO_KONUM.lng] as [number, number],
  phi: 1.5 * Math.PI - (EXPO_KONUM.lng * Math.PI) / 180,
  theta: (EXPO_KONUM.lat * Math.PI) / 180,
};
