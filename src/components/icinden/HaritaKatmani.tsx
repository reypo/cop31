/*
 * Harita katmanları (d1 → d2 dalışı): Türkiye silüeti → Antalya ve kıyıları → Antalya Körfezi →
 * Expo + havalimanı → Expo ayrıntısı → fuar holü. Her biri derinlik.ts HARITA_KUTU'daki metre kutusunu
 * viewBox olarak kullanır (Expo merkezli yerel düzlem, expo-harita.ts ile aynı): ebeveyn ve çocuk
 * aynı koordinatta çizildiği için kayıt birebir.
 *
 * Çizgi kalınlıkları "kutu pikseli" (1000'lik kutuda px) cinsinden verilir: px(n) = n · kutu/1000 metre.
 * Pin YOK (salon/stant no ONAY); seralar, park yerleri ve servis yolları çizilmez. Salon katmanında
 * stantın yeri İŞARETLENMEZ (dikdörtgen/koridor ızgarası yok): stant planı yalnız dalışla belirir.
 *
 * Etiketler katmanla birlikte büyür; her etiket grubu kendi kompozit sarmalayıcısında (.ics-ara) ve
 * data-ic-r="giriş giriş çıkış çıkış" ile okunur boyda tam opak, büyüyüp kesilmeden söner. Aynı yerin
 * bir sonraki katmandaki etiketi, öncekinin çıkışı bitince (oran 5,3–5,6) girer: iki boy üst üste binmez.
 * Veri: © OpenStreetMap katkıda bulunanlar (ODbL) + Natural Earth (kamu malı); atıf kapanışta (A).
 */

import { HARITA_KUTU } from "./derinlik";
import { alanPath, birlesikPath, expoHarita, noktalar, type Halka } from "./expo-harita";
import { turkiyeSilueti } from "./turkiye-silueti";

type MK = { readonly x: number; readonly y: number; readonly w: number };
const vb = (k: MK) => `${k.x} ${k.y} ${k.w} ${k.w}`;
const pxOf = (k: MK) => (n: number) => (n * k.w) / 1000;

/**
 * Etiket pencereleri (katman r'si; durakta r = sig ≈ 1). Komşu oranlar: bolge→korfez 5,63,
 * korfez→kent 5,33, kent→expo 5,56 → çocuğun girişi ebeveynin çıkış sonuna denk (iki boy üst üste
 * binmez; dz/rler.mjs ile d'ye karşı ölçüldü: mobilde körfez etiketi d 1,61–1,63'te, kent 1,73–1,77'de söner).
 */
const ETIKET_R = {
  bolge: "0.4 0.6 1.3 1.8",
  // Havalimanı etiketi pistlerin solunda: kamera Expo'ya (doğuya) kaydıkça sol kenara itilir → erken söner.
  korfez: "0.6 0.9 1.1 1.4",
  kent: "0.28 0.4 1.1 1.5",
  expo: "0.38 0.52 1.2 1.6",
} as const;

const RENK = {
  kara: "#F3F6F8",
  karaTr: "#FFFFFF",
  denizAcik: "#DCEAF4",
  karaCizgi: "#7FA3BC",
  tr: "#0C77B6",
  deniz: "#DCEAF4",
  kiyi: "#5E8FB0",
  pist: "#9FB3C2",
  expo: "#47B27A",
  expoKoyu: "#1F8879",
  yolAna: "#B9C7D1",
  yolIkincil: "#D3DDE4",
  salon: "#F7E6CD",
  koyu: "#28332F",
  ahsap: "#B49168",
  /** Harita yazısı: marka gövde grisi (lacivert yalnız broşürün slogan dairesinde; mist üstünde ≥ 6,9:1). */
  metin: "#555454",
  /** Expo etiketi: stant koyu yeşili (teal mist üstünde 3,9:1 kalıyordu). */
  metinExpo: "#28332F",
} as const;

/* ------------------------------ ortak path'ler ------------------------------ */

const TR_PATH = birlesikPath(turkiyeSilueti.turkiye, true);
const KOMSU_PATH = birlesikPath(turkiyeSilueti.komsular, true);
const DENIZ_PATH = birlesikPath(expoHarita.deniz, true);
const KIYI_PATH = birlesikPath(expoHarita.kiyi);

/**
 * Körfez kutusu (53 × 53 km, kare) kiyiBbox'tan (53 × 39 km) 7,2 km aşağı uzanır; deniz verisi kutunun
 * güney kenarında (y = 26.655) düz bir çizgiyle bitiyordu ("kutu kenarı", K1). Güneyi açık deniz:
 * kıyının güney kenarı kestiği noktadan (x = −21.706, Kemer) kutunun altına deniz şeridi ve kıyının
 * Kemer yönünde (GGB) kısa uzantısı. Yaklaşık; şerit dairesel maskenin sönen bölgesinde kalır.
 */
const KORFEZ_ALT = (() => {
  const K = HARITA_KUTU.korfez;
  const altY = K.y + K.w + 200;
  const kesY = expoHarita.kiyiBbox.y + expoHarita.kiyiBbox.h;
  const solust = Math.min(...expoHarita.deniz[0].filter((p) => p[1] >= kesY - 1).map((p) => p[0]));
  const sag = K.x + K.w + 200;
  // Kemer kıyısı 36,70 K'nin güneyinde ~GGB'ye iner (≈ −64 m doğu / km güney).
  const solalt = Math.round(solust - 0.064 * (altY - kesY));
  return {
    deniz: `M${solust} ${kesY - 60}H${sag}V${altY}H${solalt}Z`,
    kiyi: `M${solust} ${kesY}L${solalt} ${altY}`,
  };
})();
const PIST_PATH = birlesikPath(expoHarita.pistAna);
const EXPO_PATH = alanPath(expoHarita.expo);
const SALON_PATH = birlesikPath(expoHarita.salonlar, true);
const YOL_ANA = birlesikPath(expoHarita.yollar.ana);
const YOL_IKINCIL = birlesikPath(expoHarita.yollar.ikincil);

/** Pistlerin ortası (etiket yeri). */
const PIST_ORTA = (() => {
  let x = 0;
  let y = 0;
  let n = 0;
  for (const c of expoHarita.pistAna)
    for (const p of c) {
      x += p[0];
      y += p[1];
      n++;
    }
  return [x / n, y / n] as const;
})();

/** Pistlerin doğu ucu (kent katmanında etiket pistlerin sağına: solda kadraj dışına taşıyordu). */
const PIST_SAG = Math.max(...expoHarita.pistAna.flat().map((p) => p[0]));

/**
 * D400 etiketi: Expo'nun güneyindeki ana yolun (trunk) bir noktası; yolun yönüne döndürülür.
 * Ana yol segmentlerinden Expo'nun 380–620 m güneyindeki en uzun parça seçilir (deterministik).
 */
const D400 = (() => {
  let en: { x: number; y: number; aci: number; boy: number } | null = null;
  for (const seg of expoHarita.yollar.ana) {
    for (let i = 1; i < seg.length; i++) {
      const [x0, y0] = seg[i - 1];
      const [x1, y1] = seg[i];
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      const boy = Math.hypot(x1 - x0, y1 - y0);
      if (my < 380 || my > 620 || Math.abs(mx) > 600 || boy < 60) continue;
      if (!en || boy > en.boy) {
        let aci = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
        if (aci > 90) aci -= 180;
        if (aci < -90) aci += 180;
        en = { x: Math.round(mx), y: Math.round(my), aci: Math.round(aci), boy };
      }
    }
  }
  return en ?? { x: 0, y: 480, aci: -30, boy: 0 };
})();

/** Halkanın ağırlık merkezi (etiket için yaklaşık). */
function merkez(h: Halka): readonly [number, number] {
  let x = 0;
  let y = 0;
  for (const p of h) {
    x += p[0];
    y += p[1];
  }
  return [x / h.length, y / h.length];
}
const EXPO_M = merkez(expoHarita.expo);

/* ------------------------------ katmanlar ------------------------------ */

/**
 * Türkiye silüeti (~1.800 km). Önce noktalı (cobe'nin nokta dili; yuvarlak uçlu kısa çizgiler), ölçek
 * büyüdükçe düz çizgiye kapanır: iki ayrı kompozit katman (data-ic-r ile opaklık; boyama yok).
 */
export function SiluetKatmani() {
  const K = HARITA_KUTU.siluet;
  const px = pxOf(K);
  // Taban (tek raster): deniz, kara, ince düz kıyılar. Üstte yalnız Türkiye'nin kalın noktalı kıyısı
  // (kendi kompozit katmanı) ölçek büyüdükçe söner → noktalı çizgi düz çizgiye "kapanır". Komşu
  // kıyılarda noktalı çizgi yok (binlerce nokta raster maliyeti: d ≈ 1,27'de 67 ms'lik kare, ölçüldü).
  return (
    <>
      <svg className="ics-tam" viewBox={vb(K)} aria-hidden="true">
        <defs>
          <path id="ics-tr" d={TR_PATH} />
          <path id="ics-komsu" d={KOMSU_PATH} />
        </defs>
        <rect x={K.x} y={K.y} width={K.w} height={K.w} fill={RENK.denizAcik} />
        <use href="#ics-komsu" fill={RENK.kara} fillRule="evenodd" stroke={RENK.karaCizgi} strokeWidth={px(1.4)} strokeOpacity={0.6} />
        <use href="#ics-tr" fill={RENK.karaTr} stroke={RENK.tr} strokeWidth={px(2.4)} strokeLinejoin="round" />
      </svg>
      <div className="ics-ara" data-ic-r="1.1 0.5">
        <svg className="ics-tam" viewBox={vb(K)} aria-hidden="true">
          <use
            href="#ics-tr"
            fill={RENK.karaTr}
            stroke={RENK.tr}
            strokeWidth={px(7)}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`0 ${px(14)}`}
          />
        </svg>
      </div>
    </>
  );
}

/** Antalya ve kıyıları (~300 km): silüetin aynı verisi, daha ince çizgi; körfez ortada. */
export function BolgeKatmani() {
  const K = HARITA_KUTU.bolge;
  const px = pxOf(K);
  const [kx, ky] = noktalar.kentMerkezi;
  return (
    <>
      <svg className="ics-tam" viewBox={vb(K)} aria-hidden="true">
        <rect x={K.x} y={K.y} width={K.w} height={K.w} fill={RENK.denizAcik} />
        <use href="#ics-komsu" fill={RENK.kara} fillRule="evenodd" />
        <use href="#ics-tr" fill={RENK.karaTr} stroke={RENK.tr} strokeWidth={px(2.2)} strokeLinejoin="round" />
        <circle cx={0} cy={0} r={px(6)} fill={RENK.expo} />
      </svg>
      <div className="ics-ara" data-ic-r={ETIKET_R.bolge}>
        <svg className="ics-tam" viewBox={vb(K)} aria-hidden="true">
          <text x={kx - px(24)} y={ky - px(36)} fontSize={px(30)} textAnchor="end" className="ics-harita-yazi" fill={RENK.metin}>
            Antalya
          </text>
        </svg>
      </div>
    </>
  );
}

/** Antalya Körfezi (kiyiBbox, ~53 km): deniz, kıyı, havalimanı pistleri. */
export function KorfezKatmani() {
  const K = HARITA_KUTU.korfez;
  const px = pxOf(K);
  return (
    <>
      <svg className="ics-tam" viewBox={vb(K)} aria-hidden="true">
        <path d={DENIZ_PATH} fill={RENK.deniz} fillRule="evenodd" />
        <path d={KORFEZ_ALT.deniz} fill={RENK.deniz} />
        <path d={KIYI_PATH} fill="none" stroke={RENK.kiyi} strokeWidth={px(2.4)} strokeLinejoin="round" />
        <path d={KORFEZ_ALT.kiyi} fill="none" stroke={RENK.kiyi} strokeWidth={px(2.4)} strokeLinecap="round" />
        <path d={PIST_PATH} fill="none" stroke={RENK.pist} strokeWidth={px(4)} strokeLinecap="round" />
        <path d={EXPO_PATH} fill={RENK.expo} />
      </svg>
      {/* Etiket yalnız okunur boyda (kendi kompozit katmanı, boyama yok); büyüyüp kesilmeden söner */}
      <div className="ics-ara" data-ic-r={ETIKET_R.korfez}>
        <svg className="ics-tam" viewBox={vb(K)} aria-hidden="true">
          <text
            x={PIST_ORTA[0] - px(14)}
            y={PIST_ORTA[1]}
            fontSize={px(26)}
            textAnchor="end"
            dominantBaseline="central"
            className="ics-harita-yazi"
            fill={RENK.metin}
          >
            Antalya Havalimanı
          </text>
        </svg>
      </div>
    </>
  );
}

/** Expo + havalimanı + kıyı (~10 km). */
export function KentKatmani() {
  const K = HARITA_KUTU.kent;
  const px = pxOf(K);
  return (
    <>
      <svg className="ics-tam" viewBox={vb(K)} aria-hidden="true">
        <path d={DENIZ_PATH} fill={RENK.deniz} fillRule="evenodd" />
        <path d={KIYI_PATH} fill="none" stroke={RENK.kiyi} strokeWidth={px(2.6)} strokeLinejoin="round" />
        <path d={YOL_ANA} fill="none" stroke={RENK.yolAna} strokeWidth={px(3)} strokeLinecap="round" />
        <path d={PIST_PATH} fill="none" stroke={RENK.pist} strokeWidth={px(9)} strokeLinecap="round" />
        <path d={EXPO_PATH} fill={RENK.expo} fillOpacity={0.55} stroke={RENK.expoKoyu} strokeWidth={px(2)} />
      </svg>
      <div className="ics-ara" data-ic-r={ETIKET_R.kent}>
        <svg className="ics-tam" viewBox={vb(K)} aria-hidden="true">
          <text
            x={PIST_SAG + px(22)}
            y={PIST_ORTA[1] + px(30)}
            fontSize={px(28)}
            textAnchor="start"
            dominantBaseline="central"
            className="ics-harita-yazi"
            fill={RENK.metin}
          >
            Antalya Havalimanı
          </text>
          {/* Expo'nun SOLUNDA (sağı kutunun dairesel maskesinin sönen bandına düşüp kesiliyordu). */}
          <text
            x={EXPO_M[0] - px(26)}
            y={EXPO_M[1] - px(24)}
            fontSize={px(28)}
            textAnchor="end"
            className="ics-harita-yazi"
            fill={RENK.metinExpo}
          >
            Antalya Expo Center
          </text>
        </svg>
      </div>
    </>
  );
}

/** Expo ayrıntısı (±900 m): Expo poligonu vurgulu, salon, ana/ikincil yollar, D400. */
export function ExpoKatmani() {
  const K = HARITA_KUTU.expo;
  const px = pxOf(K);
  return (
    <>
      <svg className="ics-tam" viewBox={vb(K)} aria-hidden="true">
        <path d={YOL_IKINCIL} fill="none" stroke={RENK.yolIkincil} strokeWidth={px(3)} strokeLinecap="round" strokeLinejoin="round" />
        <path d={YOL_ANA} fill="none" stroke={RENK.yolAna} strokeWidth={px(9)} strokeLinecap="round" strokeLinejoin="round" />
        <path d={EXPO_PATH} fill={RENK.expo} fillOpacity={0.16} />
        <path d={SALON_PATH} fill={RENK.salon} stroke={RENK.ahsap} strokeWidth={px(1.6)} strokeLinejoin="round" />
        {/* Kontur: düz çizgi + dinlenmede akan kesik çizgi (CSS, yalnız [data-dinlenme="2"]) */}
        <path d={EXPO_PATH} fill="none" stroke={RENK.expoKoyu} strokeWidth={px(2)} strokeLinejoin="round" />
        <path
          d={EXPO_PATH}
          fill="none"
          stroke={RENK.expo}
          strokeWidth={px(5)}
          strokeLinecap="round"
          strokeDasharray={`${px(10)} ${px(14)}`}
          className="ics-kontur-akis"
        />
      </svg>
      <div className="ics-ara" data-ic-r={ETIKET_R.expo}>
        <svg className="ics-tam" viewBox={vb(K)} aria-hidden="true">
          <text
            x={EXPO_M[0] + px(150)}
            y={EXPO_M[1] - px(170)}
            fontSize={px(34)}
            className="ics-harita-yazi"
            fill={RENK.metinExpo}
          >
            <tspan x={EXPO_M[0] + px(150)}>Antalya</tspan>
            <tspan x={EXPO_M[0] + px(150)} dy={px(40)}>
              Expo Center
            </tspan>
          </text>
          <g transform={`translate(${D400.x} ${D400.y}) rotate(${D400.aci})`}>
            <rect x={-px(36)} y={-px(17)} width={px(72)} height={px(34)} rx={px(8)} fill="#fff" stroke={RENK.yolAna} strokeWidth={px(2)} />
            <text x={0} y={px(1)} fontSize={px(22)} textAnchor="middle" dominantBaseline="central" className="ics-harita-yazi" fill={RENK.metin}>
              D400
            </text>
          </g>
        </svg>
      </div>
    </>
  );
}

/**
 * Fuar holü (~350 m): krem iç (stant kremi buradan gelir). Stantın hol içindeki yeri ÇİZİLMEZ (salon/stant
 * no bilinmiyor, ONAY): ne dikdörtgen ne koridor ızgarası; kamera holün ağırlık merkezine (noktalar.salon,
 * temsili) dalar ve stant planı orada belirir.
 *
 * Sis tabanı: Expo katmanı söndükten sonra (salon r ≥ 1,2) holün dışını sis tutar; sahne zemini kreme
 * döndükçe (d3 gecis.zemin t 0,75–0,88) söner. Böylece krem holün içinden büyür, dışarısı ancak hol
 * ekranın çoğunu kaplayınca kreme geçer (brief §1 d3: global renk geçişi YOK).
 */
export function SalonKatmani() {
  const K = HARITA_KUTU.salon;
  const px = pxOf(K);
  return (
    <>
      <div className="ics-ara ics-salon-sis" data-ic-r="1.2 2 3.2 4.6" />
      <svg className="ics-tam" viewBox={vb(K)} aria-hidden="true">
        <path d={SALON_PATH} fill={RENK.salon} stroke={RENK.ahsap} strokeWidth={px(3)} strokeLinejoin="round" />
      </svg>
    </>
  );
}
