// /icinden v3 — Blender fragmanlarını okur (kodla.mjs ve manifest-birlestir.mjs ortak).
//
// t34 iki sahneden gelir (§9.1): S1 `t34a` (kare 0–47, dış) + S2 `t34b` (kare 48–71, iç; `kare_baslangic` 48).
// `<dizin>/t34.json` yoksa ikisi tek fragmana birleştirilir: kare = a + b, kadraj_m = a ‖ b, sure = kare / fps.
// Kare dizileri de iki klasörden okunur (`kareParcalari`): t34a/k_0000…0047 + t34b/k_0048…0071 (ya da 0'dan).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const oku = (yol) => JSON.parse(readFileSync(yol, "utf8"));

/** `<dizin>/<ad>.json`; t34 için gerekirse t34a + t34b birleşimi. Yoksa null. */
export function fragmanOku(dizin, ad, uyar = () => {}) {
  const yol = join(dizin, `${ad}.json`);
  if (existsSync(yol)) return oku(yol);
  if (ad !== "t34") return null;
  const ya = join(dizin, "t34a.json");
  const yb = join(dizin, "t34b.json");
  if (!existsSync(ya) || !existsSync(yb)) return null;
  const a = oku(ya);
  const b = oku(yb);
  const fps = a.fps ?? 30;
  // t34b: `t34_ofset` (t34 kare numarası, C turu) ya da eski `kare_baslangic` (dosya numarası 48'den başlıyorsa).
  const ofset = b.t34_ofset ?? (b.kare_baslangic || a.kare);
  if (ofset !== a.kare) uyar(`t34b ofseti ${ofset}, t34a ${a.kare} kare: birleşim aralığı kayık`);
  if ((a.kadraj_m?.length ?? 0) !== a.kare || (b.kadraj_m?.length ?? 0) !== b.kare) uyar("t34a/t34b kadraj_m uzunluğu kare sayısıyla uyuşmuyor");
  const kare = a.kare + b.kare;
  return {
    ad: "t34",
    fps,
    kare,
    sure: +(kare / fps).toFixed(4),
    master: 1920,
    kadraj_m: [...(a.kadraj_m ?? []), ...(b.kadraj_m ?? [])],
    capalar: b.capalar ?? a.capalar,
    parcalar: [
      { ad: "t34a", kare: a.kare, kaynak: a.kaynak },
      { ad: "t34b", kare: b.kare, kare_baslangic: ofset, kaynak: b.kaynak },
    ],
  };
}

const kareYolu = (dz, n) => join(dz, `k_${String(n).padStart(4, "0")}.png`);

/** Bir klasördeki bitişik kare dizisi: ilk numara (0 ya da `ipucu`) ve uzunluk. Yoksa null. */
export function dizi(dz, ipucu = 0) {
  let bas = existsSync(kareYolu(dz, 0)) ? 0 : existsSync(kareYolu(dz, ipucu)) ? ipucu : -1;
  if (bas < 0) {
    for (let n = 1; n < 4000 && bas < 0; n++) if (existsSync(kareYolu(dz, n))) bas = n;
    if (bas < 0) return null;
  }
  let n = bas;
  while (existsSync(kareYolu(dz, n))) n++;
  return { dizin: dz, bas, kare: n - bas, ilk: kareYolu(dz, bas) };
}

/**
 * Klibin kare parçaları (sırayla oynatılır). `esle` = {klip: klasör} (önizleme seti başka klasördeyse).
 * t34: önce `<kaynak>/t34`, yoksa t34a + t34b. Bulunamazsa boş dizi.
 */
export function kareParcalari(kaynak, klip, esle = {}, fragmanDizini = kaynak) {
  const dz = (k) => esle[k] ?? join(kaynak, k);
  const tek = dizi(dz(klip));
  if (tek) return [tek];
  if (klip !== "t34") return [];
  const a = dizi(dz("t34a"));
  const fb = existsSync(join(fragmanDizini, "t34b.json")) ? oku(join(fragmanDizini, "t34b.json")) : {};
  const b = dizi(dz("t34b"), fb.kare_baslangic ?? a?.kare ?? 48);
  return a && b ? [a, b] : [];
}
