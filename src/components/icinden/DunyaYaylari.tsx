import type { CSSProperties } from "react";
import { cop31 } from "@/lib/content";
import KunyeSatiri from "./KunyeSatiri";
import type { Durak, Nokta } from "./klipler";

/**
 * d1 ışık yayları ve d11 ters yayları (brief-icinden-3 §12.0-1, §12.4-2). Sunucu bileşeni: 27 COP ev sahibi kentten
 * Antalya'ya yaylar (manifest `ozel.yaylar`, S1a yaylar.py; video px, son nokta Antalya) yalnız HTML'de SVG olarak
 * çizilir; veri istemci manifestine girmez (istemciManifesti `ozel.yaylar`'ı siler).
 *
 * Tek koordinat uzayı: dikey (720×1280) ve yatay (1280×720) kırpımlar aynı 1920² master'ın 1,5 ölçekli kesitleri,
 * yalnız ötelemeleri farklı (l1/l2: yatay = dikey + (280, −280)). SVG bu yüzden master karesini (1280² video px)
 * kapsar ve CSS'te cover dönüşümüyle yerleşir (`.v3-vsvg`, `--oxd/--oyd/--oxy/--oyy`): `xMidYMid slice` ile birebir,
 * iki yön için tek yol verisi. Yollar bir kez sahne SVG'sinde (`#v3yh`; 24 noktalık kırık çizgiler uyarlanmış kübik
 * Bézier'e çevrilir), gradyanlar `YayTanimlari`'nda (reduced-motion'da da görünen d1 bölümünde); reduced posteri
 * yolları `<use href="#v3yh">` ile kullanır.
 *
 * Çizim (CSS, icinden3-isik.css): varıştan 400 ms sonra uzaktan yakına 40 ms kademe (d1), d11'de Antalya'dan uzva
 * (yakından uzağa); dinlenmede 0,55; jestte 200 ms'de söner.
 */

/** Master karesinin video px kenarı (1920 / 1,5). */
const KARE = 1280;

/** Dikey → yatay ötelemesi (video px; yatay = dikey + o). Bütün noktalar için aynı olmalı. */
export function yonOtelemesi(d: Nokta, y: Nokta): Nokta {
  return [Math.round(y[0] - d[0]), Math.round(y[1] - d[1])];
}

/**
 * SVG uzayı (u, v) = (dikey x + ox, dikey y), ox = öteleme x'i; ekranda SVG'nin sol üstü dikeyde (−ox, 0),
 * yatayda (0, oy) video px'te (öteleme (280, −280) için).
 */
export function vsvgStil(o: Nokta): CSSProperties {
  return { "--oxd": -o[0], "--oyd": 0, "--oxy": 0, "--oyy": o[1] } as CSSProperties;
}

const tam = Math.round;
/** Sayı dizisi → SVG yol sözdizimi (negatiften önce boşluk yok). */
const dizi = (n: readonly number[]) => n.map((v, i) => (i && v >= 0 ? " " : "") + String(v)).join("");

/** Uç noktaları sabit kübik Bézier (kiriş uzunluğu parametrelemesi, en küçük kareler); noktalar tam video px. */
function kubik(p: readonly Nokta[]): { c1: Nokta; c2: Nokta; hata: number; enKotu: number } {
  const n = p.length;
  const P0 = p[0];
  const P3 = p[n - 1];
  const L = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  let a11 = 0, a12 = 0, a22 = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0; // prettier-ignore
  for (let i = 0; i < n; i++) {
    const u = L[i] / L[n - 1];
    const v = 1 - u;
    const [B0, B1, B2, B3] = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
    const rx = p[i][0] - B0 * P0[0] - B3 * P3[0];
    const ry = p[i][1] - B0 * P0[1] - B3 * P3[1];
    a11 += B1 * B1;
    a12 += B1 * B2;
    a22 += B2 * B2;
    x1 += B1 * rx;
    y1 += B1 * ry;
    x2 += B2 * rx;
    y2 += B2 * ry;
  }
  const d = a11 * a22 - a12 * a12;
  const duz = n <= 3 || Math.abs(d) < 1e-9;
  const c1: Nokta = duz ? [P0[0] + (P3[0] - P0[0]) / 3, P0[1] + (P3[1] - P0[1]) / 3] : [(x1 * a22 - x2 * a12) / d, (y1 * a22 - y2 * a12) / d];
  const c2: Nokta = duz ? [P0[0] + (2 * (P3[0] - P0[0])) / 3, P0[1] + (2 * (P3[1] - P0[1])) / 3] : [(a11 * x2 - a12 * x1) / d, (a11 * y2 - a12 * y1) / d];
  const C1: Nokta = [tam(c1[0]), tam(c1[1])];
  const C2: Nokta = [tam(c2[0]), tam(c2[1])];
  const A: Nokta = [tam(P0[0]), tam(P0[1])];
  const B: Nokta = [tam(P3[0]), tam(P3[1])];
  // hata: her örnek noktanın (yuvarlanmış) eğriye en yakın uzaklığı, 128 örnekle
  const egri: Nokta[] = [];
  for (let k = 0; k <= 128; k++) {
    const u = k / 128;
    const v = 1 - u;
    const f = (j: 0 | 1) => v * v * v * A[j] + 3 * v * v * u * C1[j] + 3 * v * u * u * C2[j] + u * u * u * B[j];
    egri.push([f(0), f(1)]);
  }
  let hata = 0;
  let enKotu = 0;
  p.forEach((q, i) => {
    const e = Math.min(...egri.map((s) => Math.hypot(s[0] - q[0], s[1] - q[1])));
    if (e > hata) [hata, enKotu] = [e, i];
  });
  return { c1: C1, c2: C2, hata, enKotu };
}

/** Kübik parçalar: hata (tam px'e yuvarlanmış eğriyle) > TOL ise en kötü noktadan bölünür. */
const TOL = 0.75;
function parcalar(p: readonly Nokta[]): { c1: Nokta; c2: Nokta; son: Nokta }[] {
  const k = kubik(p);
  if (k.hata <= TOL || p.length <= 3) return [{ c1: k.c1, c2: k.c2, son: [tam(p.at(-1)![0]), tam(p.at(-1)![1])] }];
  const h = Math.min(p.length - 2, Math.max(1, k.enKotu));
  return [...parcalar(p.slice(0, h + 1)), ...parcalar(p.slice(h))];
}

/**
 * Yay → SVG yolu (u, v uzayında): 24 noktalık kırık çizgi yerine uyarlanmış kübik Bézier parçaları, göreli "c"
 * (HTML ve RSC yükünde yol verisi küçük; parça başına en büyük sapma ≤ 0,75 video px = 390 px ekranda ≤ 0,5 px).
 */
function yol(yay: readonly Nokta[], ox: number): string {
  const p = yay.map(([x, y]) => [x + ox, y] as const);
  let [px, py] = [tam(p[0][0]), tam(p[0][1])];
  let s = `M${dizi([px, py])}c`;
  parcalar(p).forEach(({ c1, c2, son }, i) => {
    const n = [c1[0] - px, c1[1] - py, c2[0] - px, c2[1] - py, son[0] - px, son[1] - py];
    s += (i && n[0] >= 0 ? " " : "") + dizi(n);
    [px, py] = son;
  });
  return s;
}

type YayVeri = { yaylar: readonly (readonly Nokta[])[]; o: Nokta; antalya: Nokta };

/** d1'in yay verisi: uzaktan yakına sıralı (kökün Antalya'ya ekran uzaklığı; S1a km sırasıyla aynı eğilim). */
export function yayVerisi(D: Durak | undefined): YayVeri | null {
  const y = D?.ozel?.yaylar;
  const d = y?.dikey;
  if (!y || !d?.length || !y.yatay?.length) return null;
  const o = yonOtelemesi(d[0][0], y.yatay[0][0]);
  const uzak = (a: readonly Nokta[]) => Math.hypot(a[0][0] - a.at(-1)![0], a[0][1] - a.at(-1)![1]);
  const yaylar = [...d].filter((a) => a.length > 1).sort((a, b) => uzak(b) - uzak(a));
  return { yaylar, o, antalya: d[0].at(-1)! };
}

/**
 * Yayların gradyanları (bir kez; görünür bir bölümde: reduced-motion'da sahne `display: none` olduğundan gradyanlar
 * orada tanımlanamaz). Yollar sahne SVG'sinde (`#v3yh`); reduced posteri onları `<use href>` ile kullanır.
 */
export function YayTanimlari({ D }: { D: Durak | undefined }) {
  const v = yayVerisi(D);
  if (!v) return null;
  const ox = v.o[0];
  return (
    <svg className="v3-tanim" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="v3yg">
          <stop offset="0" stopColor="#FFC266" stopOpacity="0" />
          <stop offset="1" stopColor="#FFF1DC" stopOpacity="0.8" />
        </linearGradient>
        {v.yaylar.map((a, i) => {
          const [x1, y1] = a[0];
          const [x2, y2] = a.at(-1)!;
          return <linearGradient key={i} id={`v3yg${i}`} href="#v3yg" gradientUnits="userSpaceOnUse" x1={Math.round(x1 + ox)} y1={Math.round(y1)} x2={Math.round(x2 + ox)} y2={Math.round(y2)} />;
        })}
      </defs>
    </svg>
  );
}

/** Antalya'nın video px'i → CSS değişkenleri (iki yön). */
export const noktaStil = (a: Nokta, o: Nokta) => ({ "--xd": a[0], "--yd": a[1], "--xy": a[0] + o[0], "--yy": a[1] + o[1] }) as CSSProperties;

/**
 * Sahne katmanı (VideoSahne `etiketler` yuvasında, `.v3-etiketler` içinde): d1 ve d11 aynı öğeyi kullanır (ikisi aynı
 * anda görünmez; yön kökün `data-sira`sından). Antalya merkezi HTML'de (ekran px'i: 7 px çekirdek + hale, d1'de tek
 * varış halkası, 2,1 s; yalnız transform/opacity).
 */
export default function DunyaYaylari({ D }: { D: Durak | undefined }) {
  const v = yayVerisi(D);
  if (!v) return null;
  const n = v.yaylar.length;
  return (
    <>
      <div className="v3-yaylar">
        <svg className="v3-vsvg" style={{ ...vsvgStil(v.o), "--n": n } as CSSProperties} viewBox={`0 0 ${KARE} ${KARE}`} preserveAspectRatio="none">
          <g id="v3yh" fill="none" strokeWidth="1.25" strokeLinecap="round">
            {v.yaylar.map((a, i) => (
              <path key={i} d={yol(a, v.o[0])} stroke={`url(#v3yg${i})`} vectorEffect="non-scaling-stroke" style={{ "--i": i } as CSSProperties} />
            ))}
          </g>
        </svg>
      </div>
      <div className="v3-yay-merkez" style={noktaStil(v.antalya, v.o)}>
        <span className="v3-yay-halka" />
        <span className="v3-yay-cekirdek" />
      </div>
    </>
  );
}

/** Künye metni: "Antalya" + SSR satırı (mount sonrası geri sayım/gün; KunyeSatiri). */
export function KunyeMetin({ metin }: { metin: string }) {
  // Açılış ve kapanış günleri content.ts'ten: başlangıç startIso, bitiş tarih aralığının ikinci günü ("9–20 Kasım 2026").
  const bas = cop31.startIso.slice(0, 10);
  const sonGun = /–(\d{1,2})\s/.exec(cop31.dates)?.[1];
  const son = sonGun ? `${bas.slice(0, 8)}${sonGun.padStart(2, "0")}` : bas;
  return (
    <span className="v3-kunye-metin">
      <span className="v3-kunye-ad">{cop31.city}</span>
      <KunyeSatiri metin={metin} bas={bas} son={son} />
    </span>
  );
}

/** Reduced-motion posterinin üstü: aynı yollar dinlenme opaklığında, Antalya çekirdeği, (d1'de) künye; halka yok. */
export function YaylarStatik({ D, kunye }: { D: Durak | undefined; kunye?: string }) {
  const v = yayVerisi(D);
  if (!v) return null;
  const [ox, oy] = v.o;
  return (
    <div aria-hidden="true" className="v3-azalt-isik" style={noktaStil(v.antalya, v.o)}>
      <svg className="v3-azalt-svg v3-azalt-svg-d" viewBox={`${ox} 0 720 1280`} preserveAspectRatio="none">
        <use href="#v3yh" />
      </svg>
      <svg className="v3-azalt-svg v3-azalt-svg-y" viewBox={`0 ${-oy} 1280 720`} preserveAspectRatio="none">
        <use href="#v3yh" />
      </svg>
      <span className="v3-azalt-nokta">
        <span className="v3-yay-cekirdek" />
      </span>
      {kunye ? (
        <span className="v3-azalt-nokta v3-azalt-kunye">
          <span className="v3-kunye-cizgi" />
          <KunyeMetin metin={kunye} />
        </span>
      ) : null}
    </div>
  );
}
