import { donemler } from "@/lib/emanet";
import { stant } from "@/lib/stant";

/*
 * Stant planı (üstten görünüm), standın plan sayfasından (PDF s.7) yeniden çizildi;
 * raster kullanılmaz. Ölçüler docs/stant-icerik.md "plan bölgeleri" tablosundan:
 * stant iç dikdörtgeninin yüzdeleri. viewBox 1000 × 657 (en/boy 1,522):
 * x% → x·10, y% → y·6,57. Yarıçaplar genişliğin yüzdesi → ·10.
 *
 * Bölgeler (`<g data-bolge="n">`, stant.bolgeler sırası): 1 Emanet Rotundası,
 * 2 Oyun alanı, 3 Söz Kiosku (sağ orta kapalı oda; konumu onay-listesi §9),
 * 4 Amfi. Altta giriş şeridi (açık ön cephe; onay-listesi §13). Vurgu: bölüm elemanındaki `data-spot="n"` → dunya.css "A: spot" bloğu.
 * Renkler yalnızca `color` üzerinden (fill/stroke = currentColor), böylece vurgu
 * geçişi color/opacity/transform ile sınırlı kalır.
 */

const W = 1000;
const H = 657;
/** Planın altında giriş (koridor) şeridi: stantın açık ön cephesi (PDF s.2 ön cephe = planın alt kenarı). */
const GIRIS_H = 54;
const X = (p: number) => p * 10;
const Y = (p: number) => p * 6.57;

/** Rotunda: merkez (40.8 %, 42.4 %), yarıçaplar genişliğin yüzdesi. */
const ROT = { cx: X(40.8), cy: Y(42.4), dis: 150, bantDis: 134, bantIc: 111, halkaDis: 68, halkaIc: 48 };

function polar(r: number, aDeg: number) {
  const a = ((aDeg - 90) * Math.PI) / 180;
  // 0,1'e yuvarlı: HTML'de kısa ve ortamdan bağımsız (trig son hanesi Node/tarayıcıda farklı olabilir).
  const yuvarla = (n: number) => Math.round(n * 10) / 10;
  return { x: yuvarla(ROT.cx + r * Math.cos(a)), y: yuvarla(ROT.cy + r * Math.sin(a)) };
}

/** Halka dilimi (iki yay arası), saat yönünde a0 → a1 derece (0 = yukarı). */
function dilim(r0: number, r1: number, a0: number, a1: number): string {
  const p0 = polar(r1, a0);
  const p1 = polar(r1, a1);
  const p2 = polar(r0, a1);
  const p3 = polar(r0, a0);
  const buyuk = a1 - a0 > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(1);
  return `M${f(p0.x)} ${f(p0.y)}A${r1} ${r1} 0 ${buyuk} 1 ${f(p1.x)} ${f(p1.y)}L${f(p2.x)} ${f(p2.y)}A${r0} ${r0} 0 ${buyuk} 0 ${f(p3.x)} ${f(p3.y)}Z`;
}

/**
 * Bölge rozeti: numaralı daire + kısa etiket (hap). (x, y) hapın sol-orta noktası.
 * Boyutlar viewBox biriminde; plan 390 px ekranda 318 px genişlikte (×0,32): etiket 44 → ~14 px,
 * numara 34 → ~11 px. Hap genişliği etiketin ölçülen genişliğinden (KISA_ETIKET.w).
 */
function Rozet({ n, x, y, etiket }: { n: number; x: number; y: number; etiket: { ad: string; w: number } }) {
  const genislik = 62 + etiket.w + 24;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={-30} width={genislik} height={60} rx={30} className="dn-bolge-hap" />
      <circle cx={30} cy={0} r={23} className="dn-bolge-daire" />
      <text x={30} y={1} textAnchor="middle" dominantBaseline="central" className="dn-serif dn-bolge-no">
        {n}
      </text>
      <text x={62} y={2} dominantBaseline="central" className="dn-bolge-etiket">
        {etiket.ad}
      </text>
    </g>
  );
}

/** Amfi: banklar konuşmacı sandalyelerinin ortasını merkez alan yaylar (bank kutusu 72.3–94.3 %, 3.3–25.5 %). */
const AMFI = { cx: X(72) + X(20.9) / 2, cy: Y(41.8), aci: 33 };
const AMFI_BANKLAR = [245, 190];

/** (cx, cy) merkezli, r yarıçaplı yay; açılar derece, 0 = yukarı, saat yönünde. */
function yay(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const nokta = (a: number) => {
    const t = ((a - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`;
  };
  return `M${nokta(a0)}A${r} ${r} 0 0 1 ${nokta(a1)}`;
}

/** Plandaki kısa bölge adları ve 44 birimlik Montserrat 700'deki ölçülmüş genişlikleri (viewBox birimi). */
const KISA_ETIKET: Record<number, { ad: string; w: number }> = {
  1: { ad: "Emanet Rotundası", w: 428 },
  2: { ad: "Oyna", w: 121 },
  3: { ad: "Söz Kiosku", w: 250 },
  4: { ad: "Amfi", w: 111 },
};

export default function StantPlani() {
  const sutunlar = Array.from({ length: 12 }, (_, i) => polar((ROT.bantDis + ROT.bantIc) / 2, i * 30 + 15));
  const dilimAci = 360 / donemler.length;

  return (
    <figure className="dn-plan-kutu mt-3">
      <svg
        viewBox={`0 0 ${W} ${H + GIRIS_H}`}
        className="dn-plan block h-auto w-full"
        role="img"
        aria-labelledby="dn-plan-baslik"
      >
        <title id="dn-plan-baslik">
          Stant planı, üstten: ortada Emanet Rotundası, altta oyun alanı, sağda söz kiosku ve amfi; giriş alt kenardan.
        </title>

        {/* Stant zemini ve dış çizgi */}
        <rect x={1.5} y={1.5} width={W - 3} height={H - 3} rx={14} className="dn-plan-zemin" />

        {/* Sabit donatılar (bölge dışı): sol duvar bankı, üst duvar üniteleri, totem, karşılama bankosu, kapalı oda 2 */}
        <g className="dn-plan-donati">
          <rect x={X(0)} y={Y(7.5)} width={X(2)} height={Y(19.8)} rx={4} />
          <rect x={X(40.8)} y={Y(0)} width={X(18.6)} height={Y(5.1)} rx={4} />
          <rect x={X(15.8)} y={Y(37.2)} width={X(2)} height={Y(12)} rx={4} />
          <rect x={X(9.1)} y={Y(88.3)} width={X(10.7)} height={Y(9.9)} rx={8} />
          <rect x={X(65.5)} y={Y(83.5)} width={X(34.5)} height={Y(16.5)} />
        </g>

        {/* 2 — Oyun alanı (ahşap zemin, iki masa, üç puf) */}
        <g data-bolge="2">
          <g className="dn-bolge-alan">
            <rect x={X(0)} y={Y(71)} width={X(63.8)} height={Y(29)} className="dn-plan-ahsap" />
            <rect x={X(25.7)} y={Y(80.5)} width={X(8.4)} height={Y(10.6)} rx={8} className="dn-plan-mobilya" />
            <rect x={X(47.6)} y={Y(80.5)} width={X(8.3)} height={Y(10.6)} rx={8} className="dn-plan-mobilya" />
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={X(2.7) + 29 + i * 58} cy={Y(71.7) + 21} r={19} className="dn-plan-mobilya" />
            ))}
          </g>
          <Rozet n={2} x={X(30)} y={Y(75.6)} etiket={KISA_ETIKET[2]} />
        </g>

        {/* 3 — Söz Kiosku / atölye (sağ orta kapalı oda, 5 istasyonlu masa) */}
        <g data-bolge="3">
          <g className="dn-bolge-alan">
            <rect x={X(65.5)} y={Y(45.3)} width={X(34.5)} height={Y(36.1)} className="dn-plan-oda" />
            <rect x={X(72.5)} y={Y(60.5)} width={X(24.3)} height={Y(8.5)} rx={6} className="dn-plan-mobilya" />
            {[0, 1, 2, 3, 4].map((i) => (
              <circle key={i} cx={X(72.5) + 24 + i * 49} cy={Y(60.5) - 14} r={9} className="dn-plan-mobilya" />
            ))}
          </g>
          {/* Hap odanın sol duvarını biraz aşar (oda 345 birim, hap 336 + kenar payı): rotunda ile oda arası boş. */}
          <Rozet n={3} x={X(64.4)} y={Y(51.6)} etiket={KISA_ETIKET[3]} />
          <text x={X(82.75)} y={Y(76)} textAnchor="middle" className="dn-plan-not">
            {stant.kiosk.cagri}
          </text>
        </g>

        {/* 4 — Amfi (kavisli banklar, konuşmacı sandalyeleri) */}
        <g data-bolge="4">
          <g className="dn-bolge-alan">
            <rect x={X(65.5)} y={Y(0)} width={X(34.5)} height={Y(45.3)} className="dn-plan-oda" />
            {/* Kavisli banklar: konuşmacı sandalyelerine bakan iki eş merkezli yay. */}
            {AMFI_BANKLAR.map((r) => (
              <path key={r} d={yay(AMFI.cx, AMFI.cy, r, -AMFI.aci, AMFI.aci)} className="dn-plan-bank" />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={X(72) + 30 + i * 50} cy={Y(38.6) + 21} r={14} className="dn-plan-mobilya" />
            ))}
          </g>
          <Rozet n={4} x={X(76.5)} y={Y(29)} etiket={KISA_ETIKET[4]} />
        </g>

        {/* 1 — Emanet Rotundası: kanopi, koyu yeşil bant + 12 sütun, dönem halkası, "Buradasın" */}
        <g data-bolge="1">
          <g className="dn-bolge-alan">
            <circle cx={ROT.cx} cy={ROT.cy} r={ROT.dis} className="dn-plan-kanopi" />
          </g>
          <circle
            cx={ROT.cx}
            cy={ROT.cy}
            r={(ROT.bantDis + ROT.bantIc) / 2}
            className="dn-plan-bant"
            strokeWidth={ROT.bantDis - ROT.bantIc}
          />
          {sutunlar.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={6.5} className="dn-plan-sutun" />
          ))}
          {donemler.map((d, i) => (
            <path
              key={d.ad}
              d={dilim(ROT.halkaIc, ROT.halkaDis, i * dilimAci + 1, (i + 1) * dilimAci - 1)}
              fill={d.renk}
            />
          ))}
          {/* Ortadaki "Bugün" yazısı yok: plan ölçeğinde 8 px'e iniyordu; büyük zemin halkası (sahne) bunu söylüyor. */}
          <Rozet n={1} x={X(3)} y={Y(11)} etiket={KISA_ETIKET[1]} />
        </g>

        {/* Giriş: açık ön cephe (karşılama bankosu ve oyun alanı tarafı, x 0–63,8 %); konum onay-listesi §13. */}
        <g className="dn-plan-giris" aria-hidden="true">
          <path d={`M${X(4)} ${H + 14}H${X(62)}`} className="dn-plan-koridor" />
          {[X(14), X(52)].map((cx) => (
            <path key={cx} d={`M${cx - 13} ${H + 34}L${cx} ${H + 21}L${cx + 13} ${H + 34}`} className="dn-plan-ok" />
          ))}
          <text x={X(33)} y={H + 31} textAnchor="middle" dominantBaseline="central" className="dn-plan-giris-yazi">
            Giriş · koridor
          </text>
        </g>
      </svg>
    </figure>
  );
}
