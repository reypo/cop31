/*
 * Stant planı katmanı (d3): src/components/dunya/StantPlani.tsx'ten kopyalanıp uyarlandı (o dosyaya
 * dokunulmaz). Plan 1000 × 711 (657 plan + 54 giriş şeridi) katman kutusunda dikeyde ortalı
 * (derinlik.ts STANT_GEOMETRI); rotunda katmanının kutusu plandaki kanopi dairesidir.
 *
 * Bölge etiketleri planın üstünde, stant.bolgeler'den (kısa ad: " – " / " · " öncesi). Vurgu: sahne
 * katman köküne data-spot="1…4" yazar (3,5 s); icinden-sahne.css "spot" bloğu. Çizgiler kutu
 * biriminde (vector-effect yok: katman CSS ile ölçeklenir).
 *
 * Yazılar (bölge rozetleri, kiosk notu, "Giriş · koridor", alt satır) ayrı bir SVG'de, kendi kompozit
 * sarmalayıcısında (.ics-ara, data-ic-r): durakta (r ≈ 0,92) tam opak, rotundaya dalarken plan büyüdükçe
 * r 1,0 → 1,3 arasında söner; dev boyda kesilip d4 paneliyle çakışmaz (K1). Plan (çizim) aynı kalır.
 */

/** Stant yazılarının çıkış penceresi (katman r'si, a > b söner). */
const YAZI_R = "1.3 1";

import { donemler } from "@/lib/emanet";
import { stant } from "@/lib/stant";
import { STANT_GEOMETRI } from "./derinlik";

const W = 1000;
const H = 657;
const GIRIS_H = 54;
const X = (p: number) => p * 10;
const Y = (p: number) => p * 6.57;

const ROT = { cx: X(40.8), cy: Y(42.4), dis: 150, bantDis: 134, bantIc: 111, halkaDis: 68, halkaIc: 48 };

function polar(r: number, aDeg: number) {
  const a = ((aDeg - 90) * Math.PI) / 180;
  const yuvarla = (n: number) => Math.round(n * 10) / 10;
  return { x: yuvarla(ROT.cx + r * Math.cos(a)), y: yuvarla(ROT.cy + r * Math.sin(a)) };
}

function dilim(r0: number, r1: number, a0: number, a1: number): string {
  const p0 = polar(r1, a0);
  const p1 = polar(r1, a1);
  const p2 = polar(r0, a1);
  const p3 = polar(r0, a0);
  const buyuk = a1 - a0 > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(1);
  return `M${f(p0.x)} ${f(p0.y)}A${r1} ${r1} 0 ${buyuk} 1 ${f(p1.x)} ${f(p1.y)}L${f(p2.x)} ${f(p2.y)}A${r0} ${r0} 0 ${buyuk} 0 ${f(p3.x)} ${f(p3.y)}Z`;
}

function yay(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const nokta = (a: number) => {
    const t = ((a - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`;
  };
  return `M${nokta(a0)}A${r} ${r} 0 0 1 ${nokta(a1)}`;
}

/** Plandaki etiket: stant.bolgeler'in adı, " – " / " · " öncesi (planda kısa). */
const kisaAd = (ad: string) => ad.split(/ – | · /)[0];
/** Montserrat 700, 44 birimde ölçülmüş genişlikler (StantPlani KISA_ETIKET ile aynı metinler). */
const OLCULU: Record<string, number> = { "Emanet Rotundası": 428, Oyna: 121, "Söz Kiosku": 250, Amfi: 111 };
const etiket = (no: number) => {
  const b = stant.bolgeler.find((x) => x.no === no)!;
  const ad = kisaAd(b.ad);
  return { ad, w: OLCULU[ad] ?? ad.length * 25 };
};

function Rozet({ n, x, y }: { n: number; x: number; y: number }) {
  const e = etiket(n);
  const genislik = 62 + e.w + 24;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={-30} width={genislik} height={60} rx={30} className="ics-bolge-hap" />
      <circle cx={30} cy={0} r={23} className="ics-bolge-daire" />
      <text x={30} y={1} textAnchor="middle" dominantBaseline="central" className="ics-serif ics-bolge-no">
        {n}
      </text>
      <text x={62} y={2} dominantBaseline="central" className="ics-bolge-etiket">
        {e.ad}
      </text>
    </g>
  );
}

const AMFI = { cx: X(72) + X(20.9) / 2, cy: Y(41.8), aci: 33 };
const AMFI_BANKLAR = [245, 190];

export default function StantKatmani() {
  const sutunlar = Array.from({ length: 12 }, (_, i) => polar((ROT.bantDis + ROT.bantIc) / 2, i * 30 + 15));
  const dilimAci = 360 / donemler.length;
  const y0 = -STANT_GEOMETRI.planY;
  const viewBox = `0 ${y0} 1000 1000`;
  return (
    <>
      <svg className="ics-tam ics-plan" viewBox={viewBox} aria-hidden="true">
        <rect x={1.5} y={1.5} width={W - 3} height={H - 3} rx={14} className="ics-plan-zemin" />

        <g className="ics-plan-donati">
          <rect x={X(0)} y={Y(7.5)} width={X(2)} height={Y(19.8)} rx={4} />
          <rect x={X(40.8)} y={Y(0)} width={X(18.6)} height={Y(5.1)} rx={4} />
          <rect x={X(15.8)} y={Y(37.2)} width={X(2)} height={Y(12)} rx={4} />
          <rect x={X(9.1)} y={Y(88.3)} width={X(10.7)} height={Y(9.9)} rx={8} />
          <rect x={X(65.5)} y={Y(83.5)} width={X(34.5)} height={Y(16.5)} />
        </g>

        <g data-bolge="2">
          <g className="ics-bolge-alan">
            <rect x={X(0)} y={Y(71)} width={X(63.8)} height={Y(29)} className="ics-plan-ahsap" />
            <rect x={X(25.7)} y={Y(80.5)} width={X(8.4)} height={Y(10.6)} rx={8} className="ics-plan-mobilya" />
            <rect x={X(47.6)} y={Y(80.5)} width={X(8.3)} height={Y(10.6)} rx={8} className="ics-plan-mobilya" />
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={X(2.7) + 29 + i * 58} cy={Y(71.7) + 21} r={19} className="ics-plan-mobilya" />
            ))}
          </g>
        </g>

        <g data-bolge="3">
          <g className="ics-bolge-alan">
            <rect x={X(65.5)} y={Y(45.3)} width={X(34.5)} height={Y(36.1)} className="ics-plan-oda" />
            <rect x={X(72.5)} y={Y(60.5)} width={X(24.3)} height={Y(8.5)} rx={6} className="ics-plan-mobilya" />
            {[0, 1, 2, 3, 4].map((i) => (
              <circle key={i} cx={X(72.5) + 24 + i * 49} cy={Y(60.5) - 14} r={9} className="ics-plan-mobilya" />
            ))}
          </g>
        </g>

        <g data-bolge="4">
          <g className="ics-bolge-alan">
            <rect x={X(65.5)} y={Y(0)} width={X(34.5)} height={Y(45.3)} className="ics-plan-oda" />
            {AMFI_BANKLAR.map((r) => (
              <path key={r} d={yay(AMFI.cx, AMFI.cy, r, -AMFI.aci, AMFI.aci)} className="ics-plan-bank" />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={X(72) + 30 + i * 50} cy={Y(38.6) + 21} r={14} className="ics-plan-mobilya" />
            ))}
          </g>
        </g>

        <g data-bolge="1">
          <g className="ics-bolge-alan">
            <circle cx={ROT.cx} cy={ROT.cy} r={ROT.dis} className="ics-plan-kanopi" />
          </g>
          <circle cx={ROT.cx} cy={ROT.cy} r={(ROT.bantDis + ROT.bantIc) / 2} className="ics-plan-bant" strokeWidth={ROT.bantDis - ROT.bantIc} />
          {sutunlar.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={6.5} className="ics-plan-sutun" />
          ))}
          {donemler.map((d, i) => (
            <path key={d.ad} d={dilim(ROT.halkaIc, ROT.halkaDis, i * dilimAci + 1, (i + 1) * dilimAci - 1)} fill={d.renk} />
          ))}
          <circle cx={ROT.cx} cy={ROT.cy} r={ROT.halkaIc - 6} className="ics-plan-bugun" />
        </g>

        <g className="ics-plan-giris">
          <path d={`M${X(4)} ${H + 14}H${X(62)}`} className="ics-plan-koridor" />
          {[X(14), X(52)].map((cx) => (
            <path key={cx} d={`M${cx - 13} ${H + 34}L${cx} ${H + 21}L${cx + 13} ${H + 34}`} className="ics-plan-ok" />
          ))}
        </g>
      </svg>

      {/* Yazılar: kendi kompozit katmanı; spot vurgusu için rozetler yine [data-bolge] içinde. */}
      <div className="ics-ara" data-ic-r={YAZI_R}>
        <svg className="ics-tam ics-plan" viewBox={viewBox} aria-hidden="true">
          <g data-bolge="2">
            <Rozet n={2} x={X(30)} y={Y(75.6)} />
          </g>
          <g data-bolge="3">
            <Rozet n={3} x={X(64.4)} y={Y(51.6)} />
            <text x={X(82.75)} y={Y(76)} textAnchor="middle" className="ics-plan-not">
              {stant.kiosk.cagri}
            </text>
          </g>
          <g data-bolge="4">
            <Rozet n={4} x={X(76.5)} y={Y(29)} />
          </g>
          <g data-bolge="1">
            <Rozet n={1} x={X(3)} y={Y(11)} />
          </g>
          <text x={X(33)} y={H + 31} textAnchor="middle" dominantBaseline="central" className="ics-plan-giris-yazi">
            Giriş · koridor
          </text>
          <text x={500} y={H + GIRIS_H + 62} textAnchor="middle" className="ics-plan-alt">
            {stant.hashtag} · {stant.program}
          </text>
        </svg>
      </div>
    </>
  );
}
