/*
 * Rotunda katmanı (d4 "Buradasın · Bugün"): kutu = plandaki rotunda kanopisi (derinlik.ts
 * ROTUNDA_GEOMETRI). Krem disk, 12 sütunlu koyu yeşil bant, dönem (zemin) halkası (donemler) ve
 * ortada "Bugün" diski: küçük "Buradasın", büyük serif "Bugün" (stant.zemin). "Bugün" diski
 * broşürün slogan dairesine eşlenir (d4 → d5 eşleşme kesmesi).
 *
 * Sütun n (1…12) açısı: (n − 1)·30 + 15 derece (0 = yukarı, saat yönü), bant yarıçapı 408.
 * A'nın <SutunYuzleri> children'ı .ics-yuva içine (1000×1000, tam kutu, halkanın üstünde) girer.
 * Spot: sahne katman köküne data-spot="1…12" yazar (4,5 s); tek vurgu A'nın aktif yüzü (kadran döner,
 * aktif yüz saat 6'da). Banttaki sütun noktaları boyanmaz (sabit açıda durdukları için çelişiyordu).
 * Sunucu bileşeni: IcindenIcerik `<Katman id="rotunda"><RotundaKatmani>…</RotundaKatmani></Katman>`.
 */

import type { ReactNode } from "react";
import { donemler } from "@/lib/emanet";
import { stant } from "@/lib/stant";
import { ROTUNDA_GEOMETRI as R } from "./derinlik";

const C = 500;
function polar(r: number, aDeg: number) {
  const a = ((aDeg - 90) * Math.PI) / 180;
  return { x: Math.round((C + r * Math.cos(a)) * 10) / 10, y: Math.round((C + r * Math.sin(a)) * 10) / 10 };
}
function dilim(r0: number, r1: number, a0: number, a1: number): string {
  const p0 = polar(r1, a0);
  const p1 = polar(r1, a1);
  const p2 = polar(r0, a1);
  const p3 = polar(r0, a0);
  const buyuk = a1 - a0 > 180 ? 1 : 0;
  return `M${p0.x} ${p0.y}A${r1} ${r1} 0 ${buyuk} 1 ${p1.x} ${p1.y}L${p2.x} ${p2.y}A${r0} ${r0} 0 ${buyuk} 0 ${p3.x} ${p3.y}Z`;
}

export const SUTUN_ACI = (n: number) => (n - 1) * 30 + 15;

export default function RotundaKatmani({ children }: { children?: ReactNode }) {
  const bantR = (R.bantIc + R.bantDis) / 2;
  const dilimAci = 360 / donemler.length;
  return (
    <>
      <svg className="ics-tam ics-rotunda" viewBox="0 0 1000 1000" aria-hidden="true">
        <circle cx={C} cy={C} r={498} className="ics-rot-kanopi" />
        <circle cx={C} cy={C} r={bantR} className="ics-rot-bant" strokeWidth={R.bantDis - R.bantIc} />
        {Array.from({ length: 12 }, (_, i) => {
          const p = polar(bantR, SUTUN_ACI(i + 1));
          return <circle key={i} data-sutun={i + 1} cx={p.x} cy={p.y} r={21} className="ics-rot-sutun" />;
        })}
        {donemler.map((d, i) => (
          <path key={d.ad} d={dilim(R.halkaIc, R.halkaDis, i * dilimAci + 0.6, (i + 1) * dilimAci - 0.6)} fill={d.renk} />
        ))}
        <circle cx={C} cy={C} r={R.bugun.r} className="ics-rot-bugun" />
        <text x={C} y={C - 46} textAnchor="middle" dominantBaseline="central" className="ics-serif ics-rot-ust">
          {stant.zemin.ust}
        </text>
        <text x={C} y={C + 22} textAnchor="middle" dominantBaseline="central" className="ics-serif ics-rot-alt">
          {stant.zemin.alt}
        </text>
      </svg>
      <div className="ics-yuva">{children}</div>
    </>
  );
}
