import { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import { photos } from "@/lib/photos";
import type { Boyut, DalUcuAd, Durak, KokUcu, Nokta } from "./klipler";
import type { IcindenMetin, PolaroidFoto } from "./metin";

/**
 * /icinden v3 fidan bölümünün DOM katmanı (G turu, brief-icinden-3 §14.3, §14.4.6). Sunucu bileşenleri: konumlar manifestin
 * `ozel` alanlarından (video px, yön başına), cover dönüşümü CSS'te; istemci JS'i yalnız polaroid görsellerini d9'da
 * indirip çözer (VideoSahne). Görünürlük kökün `data-dinlenme-rol` özniteliğiyle, yalnız opaklık/transform geçişi (§13.8
 * WebKit kuralları: SVG çocuğunda animasyon yok, `@property` yok, her karede `filter` yok, her karede JS stil yazımı yok).
 *
 *  - KokHalkalari (d8 fidan-kok, `ozel.kokUclari`): 81 kök ucu çevresinde 1,5 px krem halka. Yön başına TEK `<svg>` ve
 *    TEK `<path>` (81 daire yayı; HTML ve RSC yükünde 162 `<circle>`'dan ~%60 küçük); viewBox = video karesi,
 *    `preserveAspectRatio="xMidYMid slice"` = `object-fit: cover` (aynı dönüşüm, hesap yok). Animasyon yalnız `<svg>`
 *    öğesinin opaklığı (300 ms, dinlenmede). Reduced-motion'da posterin üstünde statik: aynı yol `<use href>` ile.
 *  - BogumEtiketleri (d9 fidan-govde, `ozel.bogumlar`): iki boğuma kılavuzlu etiket; metin sözlükten (metin.ts `fidanGovde.bogumlar`;
 *    TR content.ts `vizyon.items` + `facts`), `taraf` −1 sol (alt boğum, 2017) / +1 sağ (üst boğum, TBMM).
 *  - Polaroidler (d10 fidan-dal, `ozel.dalUclari`): 6 ana dal ucunun 4'üne asılı fotoğraflar (§14.4.1 K6: sol p12 + p17,
 *    sağ p19 + p22), alt metinler sözlükten (TR photos.ts). Bölümün içinde (ekran okuyucu akışında), sabit katman.
 */

/** Halka yarıçapı (video px): kök ucu kapağı ~4,1 px çaplı; halka kapağın dışında, en yakın iki uç (12,6 px) değmeden. */
const HALKA_R = 5;
/** 81 halka tek yol: her uç için sol noktadan iki yarım daire yayı (koordinat 0,5 video px'e yuvarlanır ≈ 0,3 CSS px). */
const halkaYolu = (u: readonly KokUcu[]) => {
  const y = (v: number) => Math.round(v * 2) / 2;
  return u.map((p) => `M${y(p.x - HALKA_R)} ${y(p.y)}a${HALKA_R} ${HALKA_R} 0 1 0 ${2 * HALKA_R} 0 ${HALKA_R} ${HALKA_R} 0 1 0-${2 * HALKA_R} 0`).join("");
};

/** d8: 81 kök ucu halkası. `statik`: reduced-motion posterinin üstü (figür içinde, sahnedeki yolu `<use>` ile kullanır). */
export function KokHalkalari({ D, statik = false }: { D: Durak | undefined; statik?: boolean }) {
  const u = D?.ozel?.kokUclari;
  if (!u) return null;
  return (
    <>
      {(["dikey", "yatay"] as const).map((b) =>
        u[b].length ? (
          <svg
            key={b}
            aria-hidden="true"
            className={`v3-halkalar v3-halkalar-${b}${statik ? " v3-halkalar-statik" : ""}`}
            viewBox={b === "dikey" ? "0 0 720 1280" : "0 0 1280 720"}
            preserveAspectRatio="xMidYMid slice"
            data-say={u[b].length}
          >
            {statik ? (
              <use href={`#v3-kok-${b}`} />
            ) : (
              <path id={`v3-kok-${b}`} d={halkaYolu(u[b])} vectorEffect="non-scaling-stroke" />
            )}
          </svg>
        ) : null,
      )}
    </>
  );
}

/** Video px noktası → CSS değişkenleri (iki yön; olmayan yön `data-yok`). */
function noktaDegisken(d: Nokta | undefined, y: Nokta | undefined) {
  return {
    stil: { "--xd": d?.[0] ?? 0, "--yd": d?.[1] ?? 0, "--xy": y?.[0] ?? 0, "--yy": y?.[1] ?? 0 } as CSSProperties,
    yok: !d ? "dikey" : !y ? "yatay" : undefined,
  };
}

/** d9: iki boğum etiketi (sahne katmanında, aria-hidden; okunur kopyası d9 bandında). */
export function BogumEtiketleri({ D, k, M }: { D: Durak | undefined; k: number; M: IcindenMetin }) {
  const b = D?.ozel?.bogumlar;
  if (!b) return null;
  return (
    <>
      {M.fidanGovde.bogumlar.map((t, i) => {
        const bul = (y: Boyut) => b[y].find((p) => p.taraf === t.taraf);
        const d = bul("dikey");
        const y = bul("yatay");
        if (!d && !y) return null;
        const { stil, yok } = noktaDegisken(d && [d.x, d.y], y && [y.x, y.y]);
        return (
          <div key={t.taraf} data-d={k} data-yok={yok} data-taraf={t.taraf} className="v3-bogum" style={{ ...stil, "--i": i } as CSSProperties}>
            <span className="v3-bogum-nokta" />
            <span className="v3-bogum-cizgi" />
            <span className="v3-bogum-metin">
              <span className="v3-bogum-ad">{t.ad}</span>
              <span className="v3-bogum-satir">{t.satir}</span>
            </span>
          </div>
        );
      })}
    </>
  );
}

/**
 * d10 polaroidleri (§14.4.1 K6). `uc`: asıldığı ana dal ucu (S3 `dal_uclari`); dikey fotoğraf (p22) alt uçta (altında yer
 * var). `konum`: yüzlere göre kırpım (object-position; /dunya DunyaIcerik'teki değerler). `en`: çerçeve genişliği, video px.
 */
const POLAROIDLER: readonly { uc: DalUcuAd; foto: PolaroidFoto; konum: string; oran: string; en: number }[] = [
  { uc: "solOrta", foto: "bulusmaKampusSoylesi", konum: "62% 50%", oran: "4 / 3", en: 118 }, // p12
  { uc: "solAlt", foto: "bulusmaKampusSalonSelam", konum: "72% 50%", oran: "4 / 3", en: 118 }, // p17
  { uc: "sağOrta", foto: "solenKocaeliTribunSelam", konum: "0% 50%", oran: "4 / 3", en: 118 }, // p19
  { uc: "sağAlt", foto: "solenKocaeliSahaIkili", konum: "50% 11%", oran: "3 / 4", en: 92 }, // p22
];
/**
 * Fotoğrafın ekrandaki genişliği ≈ en · s (dikey 390 px'te ~70 px, 1280 × 800'de ~120 px, 1920 × 1080'de ~165 px): srcset
 * yalnız 1x/2x (128 / 256 px; `getImageProps` genişlikle). `sizes`'lı 16 genişlikli srcset HTML'de ve RSC yükünde 4 × ~1,3 kB'tı.
 */
const POLAROID_W = 128;
/** HTML'deki yer tutucu (1 px saydam GIF): gerçek kaynak JS'le d9 dinlenmesinde atanır (ilk yüklemeye girmez). */
const BOS = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/** d10: dört polaroid (bölümün içinde; hareketli düzende sabit katman, reduced'da akışta dörtlü sıra). */
export function Polaroidler({ D, k, M }: { D: Durak | undefined; k: number; M: IcindenMetin }) {
  const u = D?.ozel?.dalUclari;
  if (!u) return null;
  return (
    <div data-d={k} className="v3-polaroidler" role="group" aria-label={M.fidanDal.polaroidEtiket}>
      {POLAROIDLER.map((p, i) => {
        const foto = photos[p.foto];
        const alt = M.fidanDal.polaroidAlt[p.foto];
        const d = u.dikey.find((x) => x.ad === p.uc);
        const y = u.yatay.find((x) => x.ad === p.uc);
        if (!d && !y) return null;
        const { stil, yok } = noktaDegisken(d && [d.x, d.y], y && [y.x, y.y]);
        const { props } = getImageProps({ src: foto.src, alt, width: POLAROID_W, height: Math.round((POLAROID_W * foto.height) / foto.width) });
        return (
          <figure key={p.uc} data-v3-pola data-uc={p.uc} data-yok={yok} className="v3-pola" style={{ ...stil, "--pw": p.en, "--i": i } as CSSProperties}>
            <span className="v3-pola-sarkac">
              <span aria-hidden="true" className="v3-pola-pin" />
              <span className="v3-pola-foto" style={{ aspectRatio: p.oran }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- kaynak JS'le d9 dinlenmesinde atanır, decode() beklenir */}
                <img
                  src={BOS}
                  alt={alt}
                  width={foto.width}
                  height={foto.height}
                  data-v3-src={props.src}
                  data-v3-srcset={props.srcSet}
                  decoding="async"
                  style={{ objectPosition: p.konum }}
                />
              </span>
            </span>
          </figure>
        );
      })}
    </div>
  );
}
