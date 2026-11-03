import type { CSSProperties } from "react";
import { donemler } from "@/lib/emanet";
import { noktaStil, vsvgStil, yonOtelemesi } from "./DunyaYaylari";
import type { Durak, Etiket, Nokta } from "./klipler";

/**
 * d2 emanet ışıkları ve bağları (brief-icinden-3 §12.0-2a, §12.4-3). Işıklar SahneEtiketleri'nin `emanet` türü
 * (HTML; bu dosyadaki `emanetIsigi` değişkenleri); bağlar burada, sunucu SVG'si: her ışıktan Antalya'ya 1 px dönem
 * renkli çizgi. Varış dizisi 11 dilim, kronolojik (dönem sırası, donemler[]: 12 → 2 → 3 → 4 → 5 → 6 → 7+8 → 9 → 10 →
 * 11 → 1), 120 ms arayla; bağlar 1,4–2,4 s; dinlenmede %35; spot döngüsü yok. Zamanlama CSS'te (icinden3-isik.css).
 */

const RENK = new Map(donemler.map((d, i) => [d.ad, { renk: d.renk, dilim: i }]));

/** Emanet etiketinin dönem rengi ve varış dilimi (dönem sırası). */
export function emanetDonemi(t: Etiket) {
  return RENK.get(t.donem ?? "") ?? { renk: "#FFFFFF", dilim: donemler.length - 1 };
}

/**
 * Işığın CSS değişkenleri: renk, dilim (`--i`), varsa numaranın ofseti (`--dx/--dy` video px; manifest, çakışan
 * çiftler) ve hizası (`--sx/--sy` ∈ {−1, 0, 1}: numaranın çekirdeğe bakan kenarı). Ofsetsiz numara sağda: CSS
 * varsayılanı dx +10, dy 0 (HTML/RSC baytı için yalnız ofsetliler yazılır).
 */
export function emanetIsigi(t: Etiket): CSSProperties {
  const { renk, dilim } = emanetDonemi(t);
  const o = t.dx || t.dy ? { "--dx": t.dx ?? 0, "--dy": t.dy ?? 0, "--sx": Math.sign(t.dx ?? 0), "--sy": Math.sign(t.dy ?? 0) } : {};
  return { "--renk": renk, "--i": dilim, ...o } as unknown as CSSProperties;
}

type Veri = { isiklar: readonly Etiket[]; antalya: Nokta; antalyaMetin: string; o: Nokta };

function emanetVerisi(D: Durak | undefined): Veri | null {
  const e = D?.etiketler;
  if (!e) return null;
  const a = e.dikey.find((t) => t.ad === "antalya");
  const ay = e.yatay.find((t) => t.ad === "antalya");
  const isiklar = e.dikey.filter((t) => t.tur === "emanet");
  if (!a || !ay || !isiklar.length) return null;
  return { isiklar, antalya: [a.x, a.y], antalyaMetin: a.metin, o: yonOtelemesi([a.x, a.y], [ay.x, ay.y]) };
}

const r = (v: number) => Math.round(v * 2) / 2;

function Baglar({ v }: { v: Veri }) {
  const [ax, ay] = v.antalya;
  const ox = v.o[0];
  return v.isiklar.map((t) => {
    const { renk, dilim } = emanetDonemi(t);
    return (
      <path
        key={t.ad}
        d={`M${r(t.x + ox)} ${r(t.y)}L${r(ax + ox)} ${r(ay)}`}
        stroke={renk}
        vectorEffect="non-scaling-stroke"
        style={{ "--i": dilim } as CSSProperties}
      />
    );
  });
}

/** Sahne katmanı (`.v3-etiketler` içinde, ışıkların altında). */
export default function EmanetBaglari({ D }: { D: Durak | undefined }) {
  const v = emanetVerisi(D);
  if (!v) return null;
  return (
    <div className="v3-baglar">
      <svg className="v3-vsvg" style={vsvgStil(v.o)} viewBox="0 0 1280 1280" preserveAspectRatio="none">
        <g id="v3bg" fill="none" strokeWidth="1">
          <Baglar v={v} />
        </g>
      </svg>
    </div>
  );
}

/**
 * Reduced-motion posterinin üstü: bağlar (%35) + 12 ışık ve numaraları + Antalya (sahnedeki gibi çekirdek + sağda ad; iki
 * yönde). Icinden3 d2'de AzaltPoster'ın genel etiketlerini kullanmaz (ortalanmış ad 05 numarasına biniyordu).
 */
export function EmanetStatik({ D }: { D: Durak | undefined }) {
  const v = emanetVerisi(D);
  if (!v) return null;
  const [ox, oy] = v.o;
  return (
    <div aria-hidden="true" className="v3-azalt-isik">
      {/* bağlar sahnedekilerin kopyası (`#v3bg`; sahne reduced'da görünmez ama <use> kopyalar) */}
      <svg className="v3-azalt-svg v3-azalt-svg-d v3-azalt-bag" viewBox={`${ox} 0 720 1280`} preserveAspectRatio="none">
        <use href="#v3bg" />
      </svg>
      <svg className="v3-azalt-svg v3-azalt-svg-y v3-azalt-bag" viewBox={`0 ${-oy} 1280 720`} preserveAspectRatio="none">
        <use href="#v3bg" />
      </svg>
      <span className="v3-azalt-nokta" style={noktaStil(v.antalya, v.o)}>
        <span className="v3-yay-cekirdek" />
        <span className="v3-azalt-yapi">{v.antalyaMetin}</span>
      </span>
      {v.isiklar.map((t) => (
        <span key={t.ad} className="v3-azalt-nokta v3-et-emanet" style={{ ...noktaStil([t.x, t.y], v.o), ...emanetIsigi(t) }}>
          <span className="v3-em-isik">
            <span className="v3-em-cekirdek" />
            <span className="v3-em-no">{String(t.no ?? 0).padStart(2, "0")}</span>
          </span>
        </span>
      ))}
    </div>
  );
}
