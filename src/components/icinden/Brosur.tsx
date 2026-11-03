"use client";

import Image from "next/image";
import { memo, startTransition, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { backCover, baskanMesaji, cop31, cover, facts, iklim, kapanis, solenler, vizyon } from "@/lib/content";
import { logos, photos, type PhotoAsset } from "@/lib/photos";
import { BROSUR_GEOMETRI, BROSUR_MS, brosurDuzMu, brosurGirisAbone } from "./brosur-geometri";
import { dAbone } from "./d-yayin";
import { okumaYaz, sayfaOkumasi } from "./KadrajOkumasi";
import type { BrosurDizin } from "./rol";

/**
 * Broşür katmanı (/icinden v3 E turu, brief-icinden-3 §12.4-5: üç sayfa — kapak "1/12", Buluşmalar · Şölen "8/12",
 * arka kapak "12/12"; iklim sayfası arka duvara taşındı, /brosur rotası değişmez). d = /icinden durak numarası;
 * sayfaların durakları rol tablosundan (`dz`, sunucu manifestten hesaplar: kapak d8, bulusma d9, arka d10).
 * Krem zemin üstünde gölgeli beyaz kâğıt; kapak, iç sayfa ve arka kapak üst üste durur. Değerler dAbone'dan (B'nin
 * rAF döngüsü) okunur ve doğrudan DOM'a yazılır; React state'e yalnızca görsel kapıları girer.
 *
 * Sayfa çevirme (E turu, "3b" kipi): üstteki sayfa sırtta (sol kenar) menteşe gibi kalkar — perspective(2000px)
 * rotateY(0 → −90°) + kalkışta ±1,2° rotateX; üstünde koyulaşma (0,45·sinθ, düz renk: raster belleği yok) ve θ 20–50°'de
 * sırt parlak şeridi; alttaki sayfaya tek ortak gölge (genişlik W·cosθ, opaklık 0,35·sinθ, θ > 75°'de 120 ms'de söner).
 * Her çevirmede kâğıt bütün olarak kalkar (translateY −6 px, scale 1,012; ilk ve son 0,15 s). Kapak ile iç sayfa
 * arasında 3, iç sayfa ile arka kapak arasında 3 "hayalet" sayfa akar (yalnız başlık çipi + sayfa no; yarım boyutta
 * yerleşip scale(2) ile büyür, raster ¼). preserve-3d YOK; filter/mask yok; her şey transform/opacity.
 * `?brosur=duz`: eski scaleX çevirme (hayaletsiz, kalkmasız; risk 7 yedeği).
 *
 * Giriş (son duvar → kapak FLIP'i, 420 ms; VideoSahne `brosurGirisYayinla`): kâğıt perspective(1800px) rotateX ile
 * kalkıp oturur, gölge 24 → 34 px (iki gölge katmanının çapraz sönmesi). Eğim FLIP'in başında ve sonunda 0: kesişme
 * karesinde DOM kapak render kapağının dikdörtgenine (q4 eksen hizalı) birebir oturur (kapak eşleşmesi aynen).
 *
 * Geometri B'nin sözleşmesidir (brosur-geometri.ts `BROSUR_GEOMETRI`, katman 1000×1000 nominal):
 * kâğıt `sayfa`, kapaktaki lacivert slogan dairesi `slogan` (rotundadaki "Bugün" diski buna oturur),
 * arka kapaktaki küre fotoğrafı dairesi `arkaKure` (d9 küre katmanı buna oturur). Kapak ve arka
 * kapağın sanat karesi bu iki daireden geriye hesaplanır (/brosur cover.tsx oranları).
 *
 * Birim: sayfa içerikleri `--u` ile yazılır (katmanda `--u: 1px` = 1 nominal birim; hayaletlerde 0,5px). Aynı
 * bileşenler reduced-motion'da akıştaki kartlarda (`BrosurKarti`) küçültülmüş `--u` ile çizilir (menteşe yok).
 * Yazı boyutu nominalde ≥ 24: dikey telefonda (sig 1,35 → ölçek ~0,53) ≥ 12,6 px.
 *
 * Görseller (§3.7): sayfanın durağı k için d ∈ [k − 2, k + 1] penceresine ilk girilince mount
 * (src kapısı), sonra kalır; katmanda `loading="eager"` (kapı zaten erteliyor). Hiçbiri preload değil.
 *
 * Canlılık (§1): kapakta kesik yörünge yayları 60 s'de bir tur (kapak durağı); polaroid pin etrafında
 * ±1,2° sarkaç, 5 s (iç sayfa). VideoSahne'nin `.v3[data-dinlenme-rol]` özniteliğine bağlı, yalnızca CSS
 * (icinden3.css "canlılık"); kaydırma başlayınca genlik 0'a söner.
 *
 * Geçişler (data-ic-d sözleşmesi, v2'den; opaklık kompozitörde):
 *  - eşleşme kopyası (`icD.eslesme`, kâğıdın DIŞINDA lacivert slogan diski; v3'te kapak FLIP ile geldiği için
 *    kullanılmıyor) ve kâğıdın girişi (`kagitGiris`; bu opaklığı Brosur kendisi yazar).
 *  - Kapaktaki AK Parti / GK logoları kapak durağına varırken açılır (`icD.logo`; parti içeriği d1–d3'te yok).
 *  - arka → dönüş: arka kapağın yazıları, portresi, yayları ve slogan diski söner (arkaSonum; v3'te VideoSahne
 *    `[data-ic-d]` seçicisiyle söndürür); yalnız küre fotoğrafı dairesi kalır ve dönüş küresine dalınır.
 *
 * Erişilebilirlik: katman görseldir (aria-hidden); metnin okunur kopyası akışta (`BrosurMetni`,
 * hareketli düzende sr-only) ve reduced-motion'da kartlarda (`BrosurKarti`). Hayaletler yalnız katmanda.
 */

/* ============================ geometri ============================ */

type Daire = { readonly cx: number; readonly cy: number; readonly r: number };
type Kare = { readonly x: number; readonly y: number; readonly a: number };

const KAGIT = BROSUR_GEOMETRI.sayfa;

/** Nominal daire → kâğıt-yerel daire. */
const yerel = (c: Daire): Daire => ({ cx: c.cx - KAGIT.x, cy: c.cy - KAGIT.y, r: c.r });

/**
 * Sanat karesi (kâğıt-yerel): küre dairesi (0,60a; 0,38a; r 0,36a), slogan dairesi
 * (0,26a; 0,71a; r 0,26a) — /brosur cover.tsx'teki yüzdelerle aynı.
 */
const sloganKaresi = (c: Daire): Kare => {
  const a = c.r / 0.26;
  return { x: c.cx - 0.26 * a, y: c.cy - 0.71 * a, a };
};
const kureKaresi = (c: Daire): Kare => {
  const a = c.r / 0.36;
  return { x: c.cx - 0.6 * a, y: c.cy - 0.38 * a, a };
};

/** Kapak: slogan dairesi B'nin `slogan`ına oturur. */
const KAPAK_SANAT = sloganKaresi(yerel(BROSUR_GEOMETRI.slogan));
/** Arka kapak: küre dairesi B'nin `arkaKure`sine oturur. */
const ARKA_SANAT = kureKaresi(yerel(BROSUR_GEOMETRI.arkaKure));

/* ============================ zaman çizelgesi (d) ============================ */

type SayfaAdi = "kapak" | "bulusma" | "arka";
const SAYFALAR: readonly SayfaAdi[] = ["kapak", "bulusma", "arka"];

/**
 * Zaman çizelgesi, durak dizinlerinden (K kapak, B iç sayfa, A arka; d = durak numarası). VideoSahne broşür durakları
 * arasında d'yi süre boyunca doğrusal yayınlar (BROSUR_MS), bu yüzden pencereler saniyeden d kesrine çevrilir.
 *
 * "3b" kipi (§12.4-5):
 *  - K → B (2,0 s): kapak menteşesi 0,04–0,45 s; hayaletler 2, 4, 6 sırayla 0,45–1,30 s; polaroid dalışı + 100.000+ ve
 *    50+ sayaçları 1,30–1,90 s; kâğıt kalkması ilk ve son 0,15 s.
 *  - B → A (1,8 s): iç sayfa menteşesi 0,04–0,40 s; hayaletler 9, 10, 11 sırayla 0,40–1,20 s; arka kapak öğeleri 1,15 s'den
 *    120 ms arayla (her biri 0,16 s); kâğıt kalkması ilk ve son 0,15 s.
 * "duz" kipi (`?brosur=duz`, eski, 1,6 s): kapak → sayfa 1 (K + 0,14 … 0,5), polaroid dalışı (K + 0,5 … 0,86), sayfa 1 →
 * arka (B + 0,14 … 0,62); hayalet, kalkma, sayaç 50+ ve öğe sırası yok.
 *
 * data-ic-d pencereleri ("a b" girer/söner, "a b c e" girer ve söner): eşleşme kopyası, kapak logoları (kapağa varırken
 * açılır; parti içeriği kapaktan önce yok), arka kapak sönümü. Kâğıdın girişi (K − 0,6 → K − 0,38) burada yazılır: alt
 * sınır 0,003 (görünmez) — opaklığı tam 0 olan katman boyanmaz/raster edilmez; böylece kapaktan önceki durağın (son duvar)
 * ısınması kâğıdı ve sayfaları önceden hazırlar, ilk görünme karesi takılmaz.
 */
type Pencere = readonly [number, number];
type Kip = "3b" | "duz";
type Cizelge = {
  readonly kip: Kip;
  readonly durak: Readonly<Record<SayfaAdi, number>>;
  readonly kapakCevir: Pencere;
  readonly dalis: Pencere;
  readonly sayfaCevir: Pencere;
  readonly kagitGiris: Pencere;
  /** Hayalet pencereleri (sırayla, örtüşmez); duz kipinde boş. */
  readonly hayalet1: readonly Pencere[];
  readonly hayalet2: readonly Pencere[];
  /** Kâğıt kalkmasının süresi (d kesri) K → B ve B → A geçişlerinde; duz kipinde 0. */
  readonly kalkis1: number;
  readonly kalkis2: number;
  /** Arka kapak öğelerinin (data-sira 0…4) giriş pencereleri; duz kipinde boş. */
  readonly arkaSira: readonly Pencere[];
  readonly icD: IcD;
};
/** Katmandaki data-ic-d değerleri (akış kopyasında yok). */
type IcD = { readonly eslesme: string; readonly logo: string; readonly arkaSonum: string };
/** Arka kapakta sırayla gelen öğe grubu sayısı (alıntı + EN, sanat, COP31 satırı, portre, mesaj). */
const ARKA_SIRA = 5;

/** [a, b] aralığını n eşit, ardışık pencereye böler. */
const bol = ([a, b]: Pencere, n: number): Pencere[] =>
  Array.from({ length: n }, (_, i) => [a + ((b - a) * i) / n, a + ((b - a) * (i + 1)) / n] as const);

function cizelge({ kapak: K, bulusma: B, arka: A }: BrosurDizin, kip: Kip): Cizelge {
  const f = (v: number) => +v.toFixed(2);
  const icD: IcD = {
    eslesme: `${f(K - 0.85)} ${f(K - 0.65)} ${f(K - 0.3)} ${f(K - 0.25)}`,
    logo: `${f(K - 0.14)} ${f(K - 0.04)}`,
    arkaSonum: `${f(A + 0.72)} ${f(A + 0.45)}`,
  };
  const durak = { kapak: K, bulusma: B, arka: A };
  const kagitGiris: Pencere = [K - 0.6, K - 0.38];
  if (kip === "duz") {
    return {
      kip,
      durak,
      kapakCevir: [K + 0.14, K + 0.5],
      dalis: [K + 0.5, K + 0.86],
      sayfaCevir: [B + 0.14, B + 0.62],
      kagitGiris,
      hayalet1: [],
      hayalet2: [],
      kalkis1: 0,
      kalkis2: 0,
      arkaSira: [],
      icD,
    };
  }
  // saniye → d (k0'dan başlayan, T s süren geçiş; d doğrusal)
  const T1 = BROSUR_MS.kapakSayfa / 1000;
  const T2 = BROSUR_MS.sayfaArka / 1000;
  const s1 = (sn: number) => K + sn / T1;
  const s2 = (sn: number) => B + sn / T2;
  return {
    kip,
    durak,
    kapakCevir: [s1(0.04), s1(0.45)],
    dalis: [s1(1.3), s1(1.9)],
    sayfaCevir: [s2(0.04), s2(0.4)],
    kagitGiris,
    hayalet1: bol([s1(0.45), s1(1.3)], 3),
    hayalet2: bol([s2(0.4), s2(1.2)], 3),
    kalkis1: 0.15 / T1,
    kalkis2: 0.15 / T2,
    arkaSira: Array.from({ length: ARKA_SIRA }, (_, i) => [s2(1.15 + 0.12 * i), s2(1.15 + 0.12 * i + 0.16)] as const),
    icD,
  };
}

/**
 * Hayalet sayfalar (§12.4-5): başlık çipi + sayfa no + soyut sayfa düzeni (F turu, denetim D1-09: metin değil, %8–16
 * gri çubuklar ve bir görsel bloğu; boş şablon kartı gibi okunuyordu). Başlıklar content.ts'ten birebir; content.ts'te
 * sayfa başlığı olmayan 2 "İçindekiler" ve 4 "Başkan'ın Mesajı" /brosur'un sayfa listesinden (components/brosur/data.ts,
 * aynı metin): sunucu (Icinden3) okur, `hayaletBasliklari` prop'u olarak verir; data.ts istemci paketine girmez (D2-04).
 */
type Hayalet = { readonly no: number; readonly baslik?: string };
/** Sunucunun verdiği hayalet başlıkları (sayfa no → başlık); content.ts'te karşılığı olmayanlar için. */
export type HayaletBasliklari = Readonly<Record<number, string>>;
/** "03" gibi iki haneli sayfa numarası (components/brosur/data.ts pageNo ile aynı). */
const pageNo = (n: number) => String(n).padStart(2, "0");
const HAYALET1: readonly Hayalet[] = [{ no: 2 }, { no: 4 }, { no: 6, baslik: vizyon.title }];
const HAYALET2: readonly Hayalet[] = [
  { no: 9, baslik: solenler.title },
  { no: 10, baslik: kapanis.title },
  { no: 11, baslik: iklim.title },
];
/**
 * Kâğıt içi yığın sırası (üstten alta): kapak, hayalet 2/4/6, iç sayfa, hayalet 9/10/11, arka kapak. Ortak alt gölge
 * çevrilen sayfanın bir altına (z − 1) yazılır; aralar bu yüzden ≥ 2.
 */
const Z_SAYFA: Readonly<Record<SayfaAdi, number>> = { kapak: 60, bulusma: 40, arka: 20 };
const Z_HAYALET1 = [56, 54, 52] as const;
const Z_HAYALET2 = [36, 34, 32] as const;

/**
 * Polaroid dalışı (sayfa 1): polaroid bitiş yerinde (DALIS_SON, kâğıt-yerel) yerleşiktir; JS onu
 * başlangıçta küçük ve eğik konuma (DALIS_BAS) çeker, d 5,5 → 5,86 arasında ölçek log-doğrusal büyür.
 */
const DALIS_SON = { x: 70, y: 26, w: 540 } as const;
const DALIS_BAS = { x: 386, y: 300, s: 0.46, aci: -3 } as const;

function rampa(v: number, a: number, b: number): number {
  const t = (v - a) / (b - a);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

const tr = (n: number) => n.toLocaleString("tr-TR");
const u = (n: number) => `calc(${+n.toFixed(2)} * var(--u))`;

/** Paragrafın ilk cümlesi (metin değiştirilmeden). */
function ilkCumle(p: string): string {
  const i = p.indexOf(". ");
  return i < 0 ? p : p.slice(0, i + 1);
}

/** Düz tırnakları tipografik çiftlere çevirir ("a" → “a”). */
function tirnak(s: string): string {
  let ac = true;
  return s.replace(/"/g, () => {
    const c = ac ? "“" : "”";
    ac = !ac;
    return c;
  });
}

/* ============================ parçalar ============================ */

/**
 * Akıştaki kartların (lazy) yer tutucusu: düz marka sisi (#EEF4F8). Görsel gelene dek boş beyaz
 * yerine sis görünür; ayrıca Next'in "lazy görsel LCP oldu" geliştirme uyarısı yalnızca
 * placeholder "empty" iken çıktığı için, betikle kaydırılan ölçümlerde (kullanıcı girdisi yok,
 * LCP güncellenmeye devam ediyor) yanlış alarm vermez.
 */
const SIS =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect width='1' height='1' fill='%23EEF4F8'/%3E%3C/svg%3E";

function Gorsel({
  photo,
  acik,
  eager,
  sizes,
  position = "50% 50%",
}: {
  photo: PhotoAsset;
  acik: boolean;
  eager: boolean;
  sizes: string;
  position?: string;
}) {
  if (!acik) return null;
  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      placeholder={eager ? "empty" : SIS}
      className="object-cover"
      style={{ objectPosition: position }}
    />
  );
}

/** Broşür polaroidi: beyaz çerçeve, yeşil kontur, turuncu pin (nominal ölçüde). */
function Polaroid({
  photo,
  acik,
  eager,
  sizes,
  position,
  aspect,
  yazi,
}: {
  photo: PhotoAsset;
  acik: boolean;
  eager: boolean;
  sizes: string;
  position?: string;
  aspect: string;
  yazi?: string;
}) {
  return (
    <figure className="ic-br-polaroid">
      <span aria-hidden="true" className="ic-br-pin" />
      <div className="ic-br-polaroid-foto" style={{ aspectRatio: aspect }}>
        <Gorsel photo={photo} acik={acik} eager={eager} sizes={sizes} position={position} />
      </div>
      {yazi ? <figcaption className="ic-br-polaroid-yazi">{yazi}</figcaption> : null}
    </figure>
  );
}

/** Kapak ve arka kapaktaki sanat: küre fotoğrafı dairesi, lacivert slogan dairesi, yörünge yayları. */
function SanatKaresi({
  s,
  acik,
  eager,
  kureSizes,
  soner,
  sira,
}: {
  s: Kare;
  acik: boolean;
  eager: boolean;
  kureSizes: string;
  /** Katmanda yaylar ve slogan diski için data-ic-d (arka kapak: d9 dalışında yalnız küre dairesi kalır). */
  soner?: string;
  /** Arka kapakta öğe giriş sırası (data-sira; Brosur yazar). */
  sira?: number;
}) {
  const CX = 240;
  const CY = 152;
  const polar = (r: number, deg: number): [number, number] => {
    const a = (deg * Math.PI) / 180;
    return [+(CX + r * Math.cos(a)).toFixed(2), +(CY + r * Math.sin(a)).toFixed(2)];
  };
  const yay = (r: number, a0: number, a1: number) => {
    const [x0, y0] = polar(r, a0);
    const [x1, y1] = polar(r, a1);
    return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const [ox, oy] = polar(158, 22);
  const [gx, gy] = polar(168, 90);

  return (
    <div className="ic-br-sanat" data-sira={sira} style={{ left: u(s.x), top: u(s.y), width: u(s.a), height: u(s.a) }}>
      <svg aria-hidden="true" viewBox="0 0 400 400" className="ic-br-yaylar" fill="none" data-ic-d={soner}>
        <g className="ic-br-yorunge">
          <path d={yay(170, 96, 250)} stroke="var(--color-brand-green)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="4 6" />
          <path
            d={yay(186, 112, 238)}
            stroke="var(--color-brand-blue)"
            strokeOpacity="0.45"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="4 6"
          />
        </g>
        <path d={yay(158, -78, 22)} stroke="var(--color-brand-blue)" strokeWidth="1.6" strokeLinecap="round" />
        <path d={yay(168, 24, 90)} stroke="var(--color-brand-blue)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="350" cy="46" r="30" fill="var(--color-brand-blue)" fillOpacity="0.16" />
        <circle cx={ox} cy={oy} r="5" fill="var(--color-brand-orange)" />
        <circle cx={gx} cy={gy} r="4" fill="var(--color-brand-green)" />
      </svg>
      <div className="ic-br-kure">
        <Gorsel photo={photos.globeFoliage} acik={acik} eager={eager} sizes={kureSizes} position="50% 56%" />
      </div>
      <SloganDiski soner={soner} />
    </div>
  );
}

/** Lacivert slogan diski (sanat karesinin %52'si; yazı 7,6cqw). Kapak, arka kapak ve eşleşme kopyası. */
function SloganDiski({ soner }: { soner?: string }) {
  const bosluk = cover.slogan.indexOf(" ");
  return (
    <div className="ic-br-slogan-diski" data-ic-d={soner}>
      <p className="ic-br-slogan font-script">
        {cover.slogan.slice(0, bosluk)}
        <br />
        {cover.slogan.slice(bosluk + 1)}
      </p>
    </div>
  );
}

/* ============================ sayfalar (kâğıt-yerel, 680 × 960) ============================ */

/** Kapak ve arka kapaktaki küre fotoğrafı: tek `sizes` (aynı dosya iki boyda inmesin). */
const KURE_SIZES = "(max-width: 600px) 92vw, 720px";

/** acik: görsel kapısı; eager: katmanda (true) / akış kartında (false); katman: katmandaysa d'ye bağlı data-ic-d değerleri. */
type SayfaProps = { acik: boolean; eager: boolean; katman?: IcD };

function KapakIcerik({ acik, eager, katman }: SayfaProps) {
  const bosluk = cover.title.indexOf(" ");
  return (
    <>
      <p className="ic-br-yaprak" style={{ left: u(40), top: u(36) }}>
        COP31 · {cop31.city} · {cop31.dates}
      </p>
      <p className="ic-br-kapak-baslik" style={{ left: u(40), top: u(86) }}>
        {cover.title.slice(0, bosluk)}
        <br />
        {cover.title.slice(bosluk + 1)}
      </p>
      {/* sizes arka kapakla aynı: küre fotoğrafı mobilde tek boyda iner, d8'de (broşür kapağı) önbellekten gelir (K2). */}
      <SanatKaresi s={KAPAK_SANAT} acik={acik} eager={eager} kureSizes={KURE_SIZES} />
      <p className="ic-br-kapak-alt" style={{ left: u(40), top: u(782), width: u(600) }}>
        {cover.subtitle}
      </p>
      <p className="ic-br-kapak-kurum" style={{ left: u(40), top: u(852), width: u(600) }}>
        {cover.org}
      </p>
      <div
        className="ic-br-logolar"
        data-ic-d={katman?.logo}
        style={{ left: u(40), top: u(896), width: u(600), height: u(48) }}
      >
        {acik ? (
          <>
            <Image
              src={logos.akParti.src}
              width={logos.akParti.width}
              height={logos.akParti.height}
              alt={logos.akParti.alt}
              sizes="48px"
              loading={eager ? "eager" : "lazy"}
              className="ic-br-logo"
            />
            <span aria-hidden="true" className="ic-br-logo-ayrac" />
            <Image
              src={logos.genclikKollari.src}
              width={logos.genclikKollari.width}
              height={logos.genclikKollari.height}
              alt={logos.genclikKollari.alt}
              sizes="48px"
              loading={eager ? "eager" : "lazy"}
              className="ic-br-logo"
            />
          </>
        ) : null}
      </div>
    </>
  );
}

/**
 * Sayfa 1 (d9): Gençlik Buluşmaları · Bir Gençlik Şöleni. Katmanda dalış öncesi taban + küçük
 * polaroid ile başlar; akıştaki kartta (`.ic-br-statik`) dalış bitmiş hâliyle görünür.
 */
function BulusmaIcerik({ acik, eager }: SayfaProps) {
  return (
    <>
      {/* dalış öncesi taban (kapak çevrilirken görünür; polaroid büyürken söner) */}
      <div data-br="taban" className="ic-br-taban">
        <p aria-hidden="true" lang="en" data-onay="en" className="ic-br-en" style={{ left: u(40), top: u(98) }}>
          Youth Meetings · Youth Festival
        </p>
        <p className="ic-br-taban-baslik" style={{ left: u(40), top: u(150), width: u(330) }}>
          Bir Gençlik
          <br />
          Şöleni
        </p>
        <p className="ic-br-taban-alt" style={{ left: u(40), top: u(268), width: u(330) }}>
          {facts.solenDate}
          <br />
          {facts.solenPlace}
        </p>
      </div>

      {/* etiket (sayfada, her iki hâlde) */}
      <p className="ic-br-yaprak" style={{ left: u(40), top: u(40) }}>
        Gençlik Buluşmaları · Şölen
      </p>

      {/*
        Polaroid dalışı: dikey stadyum karesi (p18). Foto üstü yazılar (İngilizce satır, sayaç) dalış
        elemanının içinde, sarkacın DIŞINDA: dalışla birlikte büyür, dinlenmede sallanmaz.
      */}
      <div data-br="dalis" className="ic-br-dalis" style={{ left: u(DALIS_SON.x), top: u(DALIS_SON.y), width: u(DALIS_SON.w) }}>
        <div className="ic-sarkac ic-sarkac-a">
          <Polaroid
            photo={photos.solenKocaeliSahaSelam}
            acik={acik}
            eager={eager}
            sizes="(max-width: 600px) 80vw, 560px"
            position="50% 50%"
            aspect="1233 / 1600"
          />
        </div>
        <p data-br="en-foto" lang="en" data-onay="en" className="ic-br-en ic-br-en-foto" style={{ left: u(30), top: u(72) }}>
          Youth Meetings · Youth Festival
        </p>
        <div data-br="sayac-kutu" className="ic-br-sayac-kutu" style={{ left: u(30), top: u(482), width: u(480) }}>
          <p className="ic-br-sayac">
            <span data-br="sayac">{tr(facts.solenAttendees)}+</span>
          </p>
          <p className="ic-br-sayac-alt">
            genç · {facts.solenPlace}
            <br />
            {facts.solenDate}
          </p>
        </div>
      </div>

      {/* alt yazılar (her iki hâlde de görünür) */}
      <p className="ic-br-blok-baslik" style={{ left: u(40), top: u(740), width: u(600) }}>
        <span data-br="sayac50" className="ic-br-sayi">
          {facts.meetings}+
        </span>{" "}
        Gençlik Buluşması
        <span className="ic-br-blok-alt">son {facts.meetingsYears} yılda, Cumhurbaşkanımızın katılımıyla</span>
      </p>
      <p className="ic-br-govde" style={{ left: u(40), top: u(842), width: u(600) }}>
        {facts.electionAgeYear}&apos;de seçilme yaşı {facts.electionAge} · TBMM&apos;de {facts.youngMpsAgeLimit} yaş altı{" "}
        {facts.youngMps} milletvekilinden {facts.youngMpsOurs}&apos;ü AK Parti&apos;den
      </p>
    </>
  );
}

/** Arka kapak (d10): alıntı, küre fotoğrafı dairesi + slogan dairesi, Başkan'ın ilk cümlesi, p22 portre. */
function ArkaKapakIcerik({ acik, eager, katman }: SayfaProps) {
  const alinti = backCover.quote.replace(/^"|"$/g, "");
  const bosluk = alinti.indexOf(" Hep ");
  const satir = backCover.line2.split(" ");
  const soner = katman?.arkaSonum;
  return (
    <>
      <SanatKaresi s={ARKA_SANAT} acik={acik} eager={eager} kureSizes={KURE_SIZES} soner={soner} sira={1} />
      {/*
        Küre dairesi dışındaki her şey tek kompozit sarmalayıcıda söner (dönüşe dalış). data-sira: hayaletlerden sonra
        arka kapak öğeleri 120 ms arayla gelir (alıntı + EN 0, sanat 1, COP31 satırı 2, portre 3, mesaj 4).
      */}
      <div className="ic-br-arka-metin" data-ic-d={soner}>
        <p className="ic-br-arka-alinti" data-sira={0} style={{ left: u(30), top: u(30), width: u(620) }}>
          {"“"}
          {alinti.slice(0, bosluk)}
          <br />
          {alinti.slice(bosluk + 1)}
          {"”"}
        </p>
        {/* ONAY: İngilizce satır (docs/onay-listesi.md §14). */}
        <p lang="en" data-onay="en" className="ic-br-en ic-br-arka-en" data-sira={0} style={{ left: u(30), top: u(128), width: u(620) }}>
          Always by your side
        </p>
        <p className="ic-br-arka-satir" data-sira={2} style={{ left: u(316), top: u(552), width: u(330) }}>
          <span className="ic-br-arka-cop">{backCover.line1}</span>
          <br />
          {satir.slice(0, 3).join(" ")}
          <br />
          {satir[3]}
          <br />
          {satir.slice(4).join(" ")}
        </p>
        <div className="ic-br-portre" data-sira={3} style={{ left: u(36), top: u(706), width: u(214) }}>
          <Polaroid
            photo={photos.solenKocaeliSahaIkili}
            acik={acik}
            eager={eager}
            sizes="(max-width: 600px) 34vw, 220px"
            position="50% 11%"
            aspect="1 / 1"
          />
        </div>
        <blockquote className="ic-br-mesaj" data-sira={4} style={{ left: u(278), top: u(690), width: u(366) }}>
          <p>{tirnak(ilkCumle(baskanMesaji.paragraphs[0]))}</p>
          <footer className="ic-br-imza">
            <span className="ic-br-imza-ad">{baskanMesaji.name}</span>
            <span className="ic-br-imza-rol">{baskanMesaji.role}</span>
          </footer>
        </blockquote>
      </div>
    </>
  );
}

const ICERIK: Record<SayfaAdi, (p: SayfaProps) => ReactNode> = {
  kapak: KapakIcerik,
  bulusma: BulusmaIcerik,
  arka: ArkaKapakIcerik,
};

const SAYFA_ADI: Record<SayfaAdi, string> = {
  kapak: "Broşür kapağı: COP31'de AK Gençlik",
  bulusma: "Broşür sayfası: Gençlik Buluşmaları ve Bir Gençlik Şöleni",
  arka: "Broşür arka kapağı: Başkan'ın mesajı",
};

/* ============================ katman ============================ */

/**
 * Görsel kapısı: d ∈ [k − 2, k + 1] (k sayfanın durağı). Reduced-motion'da katman yalnızca kapağı
 * gösterir (sayfalar akıştaki kartlarda, kendi lazy görselleriyle): kapağın kapısı d ≥ k − 2'de üst
 * sınırsız açılır, iç sayfalarınki hiç açılmaz (gizli katmanda boşuna indirme olmasın).
 */
function kapiAcikMi(ad: SayfaAdi, d: number, azalt: boolean, durak: Readonly<Record<SayfaAdi, number>>): boolean {
  const k = durak[ad];
  if (azalt) return ad === "kapak" && d >= k - 2;
  return d >= k - 2 && d <= k + 1;
}

type Kapilar = Readonly<Record<SayfaAdi, boolean>>;
const KAPALI: Kapilar = { kapak: false, bulusma: false, arka: false };

/**
 * Katmandaki tek sayfa. memo: bir görsel kapısı açılınca yalnız o sayfa yeniden render edilir (bütün sayfalar
 * birden değil; K2: kapı açılışı kaydırma karesinde ana iş parçacığını meşgul ediyordu).
 */
const KatmanSayfasi = memo(function KatmanSayfasi({ ad, i, acik, icD }: { ad: SayfaAdi; i: number; acik: boolean; icD: IcD }) {
  const Icerik = ICERIK[ad];
  const cevrilir = i < SAYFALAR.length - 1;
  return (
    <section data-sayfa={ad} aria-label={SAYFA_ADI[ad]} className={`ic-br-sayfa ic-br-sayfa-${ad}`} style={{ zIndex: Z_SAYFA[ad] }}>
      <Icerik acik={acik} eager katman={icD} />
      <span aria-hidden="true" className="ic-br-sirt" />
      {/* bu sayfa çevrilirken üstüne düşen koyulaşma ("3b": düz renk; "duz": kıvrım gölgesi) ve sırt parlak şeridi */}
      {cevrilir ? <span aria-hidden="true" data-br={`kivrim-${ad}`} className="ic-br-kivrim" /> : null}
      {cevrilir ? <span aria-hidden="true" data-br={`parlak-${ad}`} className="ic-br-parlak" /> : null}
      {/* duz kipi: üstteki sayfa çevrilirken bu sayfada katlanan kenarı izleyen gölge ("3b"de ortak alt gölge) */}
      {i > 0 ? <span aria-hidden="true" data-br={`golge-${ad}`} className="ic-br-golge" /> : null}
    </section>
  );
});

/**
 * Hayalet sayfa: kâğıdın sol yarısının ortasına yarım boyutta (340 × 480, `--u` 0,5px) yerleşir ve sırt ortası
 * (0, %50) etrafında scale(2) ile tam sayfaya büyür: raster ¼, menteşe dönüşümü tam sayfadakiyle aynı (perspective ve
 * rotateY scale'in solunda). İçerik yalnız başlık çipi + sayfa no (+ sırt gölgesi). JS gelmeden görünmez
 * (`.ic-br-sayfa:not(.ic-br-sayfa-kapak)`); "duz" kipinde hiç açılmaz.
 */
/**
 * Hayaletin soyut sayfa düzeni (nominal birim; [sol, üst, genişlik, yükseklik, tür]): "g" görsel bloğu, "a" ara başlık
 * çubuğu, "m" metin çubuğu. İki düzen sırayla (çift/tek sayfa no). Hepsi hayaletin kendi katmanında boyanır (yeni
 * katman yok; raster ¼, ısınmada bir kez).
 */
type Blok = readonly [number, number, number, number, "g" | "a" | "m"];
const satirlar = (ust: number, genislikler: readonly number[]): Blok[] => genislikler.map((w, i) => [40, ust + i * 30, w, 12, "m"] as const);
const HAYALET_DUZEN: readonly (readonly Blok[])[] = [
  [[40, 120, 600, 290, "g"], [40, 446, 360, 22, "a"], ...satirlar(492, [600, 584, 596, 430]), ...satirlar(642, [600, 572, 590, 520, 310])],
  [[40, 124, 420, 24, "a"], ...satirlar(172, [600, 590, 600, 560, 600, 410]), [40, 372, 600, 300, "g"], ...satirlar(706, [596, 580, 350])],
];

const HayaletSayfa = memo(function HayaletSayfa({ h, z, baslik }: { h: Hayalet; z: number; baslik: string }) {
  return (
    <section
      aria-hidden="true"
      data-hayalet={h.no}
      className="ic-br-sayfa ic-br-hayalet"
      style={
        {
          "--u": "0.5px",
          inset: "auto",
          left: 0,
          top: KAGIT.h / 4,
          width: u(KAGIT.w),
          height: u(KAGIT.h),
          zIndex: z,
          transform: "scale(2)",
        } as CSSProperties
      }
    >
      <p className="ic-br-yaprak" style={{ left: u(40), top: u(40) }}>
        {baslik}
      </p>
      {HAYALET_DUZEN[h.no % 2].map(([x, y, w, hh, t], i) => (
        <span key={i} className={`ic-br-h-blok ic-br-h-${t}`} style={{ left: u(x), top: u(y), width: u(w), height: u(hh) }} />
      ))}
      <p className="ic-br-hayalet-no" style={{ left: u(40), top: u(836) }}>
        {pageNo(h.no)}
      </p>
      <span className="ic-br-sirt" />
      <span data-br={`kivrim-h${h.no}`} className="ic-br-kivrim" />
      <span data-br={`parlak-h${h.no}`} className="ic-br-parlak" />
    </section>
  );
});

/** Çevrilen bir yaprak (sayfa ya da hayalet): menteşe yazımı için öğeleri ve yığın sırası. */
type Yaprak = {
  readonly ad: string;
  readonly e: HTMLElement | null;
  readonly kivrim: HTMLElement | null;
  readonly parlak: HTMLElement | null;
  readonly z: number;
  /** Dönüşümün sağ ucu (hayalette " scale(2)"). */
  readonly olcek: string;
};

const DERECE = Math.PI / 180;
/** easeInOutSine: menteşe açısı ve kalkma. */
const kolay = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x);
/** Giriş eğimi eğrisi: 0'da ve 1'de 0, e = 1/3'te 1 (hızlı kalkar, yavaş oturur). */
const girisEgri = (e: number) => 6.75 * e * (1 - e) * (1 - e);
/** Sırt parlak şeridi: θ 20–50°'de 0,25 (kenarlarda ±3° yumuşak). */
const parlakBant = (th: number) => 0.25 * Math.min(rampa(th, 17, 23), 1 - rampa(th, 47, 53));
/** Ortak alt gölgenin yumuşak kenarı (nominal birim). */
const GOLGE_KENAR = 96;

/**
 * `<Katman id="brosur">` içeriği (katmanın tamamı). Reduced-motion'da yalnızca kapak görünür;
 * sayfalar akıştaki `BrosurKarti`larda. dz: sayfaların durak numaraları (rol tablosundan; Icinden3 verir).
 */
export default function Brosur({ dz, hayaletBasliklari }: { dz: BrosurDizin; hayaletBasliklari: HayaletBasliklari }) {
  const kokRef = useRef<HTMLDivElement>(null);
  const [kapi, setKapi] = useState<Kapilar>(KAPALI);
  const { kapak: dK, bulusma: dB, arka: dA } = dz;
  // data-ic-d pencereleri kipten bağımsız (SSR'da da aynı).
  const icD = useMemo(() => cizelge({ kapak: dK, bulusma: dB, arka: dA }, "3b").icD, [dK, dB, dA]);

  useEffect(() => {
    const kok = kokRef.current;
    if (!kok) return;
    const cz = cizelge({ kapak: dK, bulusma: dB, arka: dA }, brosurDuzMu() ? "duz" : "3b");
    const uc = cz.kip === "3b";
    kok.dataset.kip = cz.kip;
    const q = (s: string) => kok.querySelector<HTMLElement>(`[data-br="${s}"]`);
    const sayfa = (ad: SayfaAdi) => kok.querySelector<HTMLElement>(`[data-sayfa="${ad}"]`);
    const el = {
      kagit: kok.querySelector<HTMLElement>(".ic-br-kagit"),
      zeminA: q("zemin-a"),
      zeminB: q("zemin-b"),
      altGolge: q("altgolge"),
      altDolu: q("altgolge-dolu"),
      altKenar: q("altgolge-kenar"),
      kapak: sayfa("kapak"),
      bulusma: sayfa("bulusma"),
      arka: sayfa("arka"),
      kapakKivrim: q("kivrim-kapak"),
      bulusmaKivrim: q("kivrim-bulusma"),
      bulusmaGolge: q("golge-bulusma"),
      arkaGolge: q("golge-arka"),
      dalis: q("dalis"),
      taban: q("taban"),
      sayac: q("sayac"),
      sayac50: q("sayac50"),
      sayacKutu: q("sayac-kutu"),
      enFoto: q("en-foto"),
    };
    const yaprak = (ad: string, e: HTMLElement | null, z: number, olcek: string): Yaprak => ({
      ad,
      e,
      kivrim: q(`kivrim-${ad}`),
      parlak: q(`parlak-${ad}`),
      z,
      olcek,
    });
    const hayalet = (h: Hayalet, z: number) => yaprak(`h${h.no}`, kok.querySelector<HTMLElement>(`[data-hayalet="${h.no}"]`), z, " scale(2)");
    // Sırayla çevrilenler: grubun ilki asıl sayfa (kapak / iç sayfa), ardından hayaletler.
    const grup1: readonly Yaprak[] = [yaprak("kapak", el.kapak, Z_SAYFA.kapak, ""), ...HAYALET1.map((h, i) => hayalet(h, Z_HAYALET1[i]))];
    const grup2: readonly Yaprak[] = [yaprak("bulusma", el.bulusma, Z_SAYFA.bulusma, ""), ...HAYALET2.map((h, i) => hayalet(h, Z_HAYALET2[i]))];
    const arkaSira = Array.from({ length: ARKA_SIRA }, (_, i) => [...(el.arka?.querySelectorAll<HTMLElement>(`[data-sira="${i}"]`) ?? [])]);
    const kadraj = document.querySelector<HTMLElement>("[data-v3-kadraj]");
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let kapilar = KAPALI;

    /** Değişmeyen değer yazılmaz (anahtar: eleman adı + özellik). Dokunulan öğeler temizlikte geri alınır. */
    const onbellek = new Map<string, string>();
    const dokunulan = new Set<HTMLElement>();
    const yaz = (e: HTMLElement | null, ad: string, ozellik: string, deger: string) => {
      if (!e) return;
      const k = `${ad}|${ozellik}`;
      if (onbellek.get(k) === deger) return;
      onbellek.set(k, deger);
      dokunulan.add(e);
      e.style.setProperty(ozellik, deger);
    };
    const metin = (e: HTMLElement | null, ad: string, deger: string) => {
      if (!e || onbellek.get(`${ad}|metin`) === deger) return;
      onbellek.set(`${ad}|metin`, deger);
      e.textContent = deger;
    };
    // "visible" DEĞİL "inherit": katman kökü (B) visibility:hidden iken sayfa da gizli kalmalı.
    const gorunur = (e: HTMLElement | null, ad: string, v: boolean) => yaz(e, ad, "visibility", v ? "inherit" : "hidden");

    /**
     * duz kipi — sayfa çevirme (p 0→1): üst sayfa sırt etrafında scaleX(1 − p), üstüne kıvrım gölgesi;
     * alttaki sayfada katlanan kenarı izleyen gölge şeridi (yalnızca transform/opacity).
     */
    const cevirDuz = (ust: HTMLElement | null, ad: string, kivrim: HTMLElement | null, golge: HTMLElement | null, p: number) => {
      yaz(ust, ad, "transform", p > 0 ? `scaleX(${Math.max(0.0001, 1 - p).toFixed(4)})` : "none");
      yaz(kivrim, `${ad}-kivrim`, "opacity", (p * 0.55).toFixed(3));
      yaz(golge, `${ad}-golge`, "opacity", (Math.min(1, p * 5) * (1 - p) * 0.9).toFixed(3));
      yaz(golge, `${ad}-golge`, "transform", `translateX(${((1 - p) * KAGIT.w).toFixed(2)}px)`);
    };

    /**
     * "3b" menteşe (p 0→1): θ = 90°·kolay(p); perspective(2000px) rotateY(−θ) + kalkışta rotateX(1,2°·sin πp), origin
     * sırtta (CSS `.ic-br-sayfa` 0 50%). Koyulaşma 0,45·sinθ; sırt parlak şeridi θ 20–50°'de 0,25. Döndürür: θ (derece).
     */
    const mentese = (y: Yaprak, p: number): number => {
      const th = p > 0 ? 90 * kolay(Math.min(1, p)) : 0;
      if (th <= 0) {
        yaz(y.e, y.ad, "transform", y.olcek ? y.olcek.trim() : "none");
        yaz(y.kivrim, `${y.ad}-kivrim`, "opacity", "0");
        yaz(y.parlak, `${y.ad}-parlak`, "opacity", "0");
        return 0;
      }
      const phi = 1.2 * Math.sin(Math.PI * Math.min(1, p));
      yaz(y.e, y.ad, "transform", `perspective(2000px) rotateY(${(-th).toFixed(2)}deg) rotateX(${phi.toFixed(3)}deg)${y.olcek}`);
      // Koyulaşma sırttan serbest kenara gradyan (CSS 0,3 → 1): 0,15 → 0,5·sinθ (F turu, D1-09; düz 0,45·sinθ gri kart).
      yaz(y.kivrim, `${y.ad}-kivrim`, "opacity", (0.5 * Math.sin(th * DERECE)).toFixed(3));
      // Parlak şerit dinlenmede 0 (çizilmez; 8 şerit ≈ 2 MB karo, ölçüldü); dar gradyan, ilk karesi ucuz.
      yaz(y.parlak, `${y.ad}-parlak`, "opacity", parlakBant(th).toFixed(3));
      return th;
    };

    /*
     * Kâğıdın dönüşümü: giriş eğimi (VideoSahne FLIP'i, brosurGirisYayinla) × çevirme kalkması. translateY ekranda −6 px:
     * kâğıt nominal kutuda, kutunun ölçeği VideoSahne'nin yazdığı satır içi dönüşümden okunur (yerleşim okuması yok).
     */
    let giris = 1;
    let kalkma = 0;
    const kutuOlcek = () => {
      const m = /scale\(([\d.]+)\)/.exec(kok.parentElement?.style.transform ?? "");
      const k = m ? Number(m[1]) : 1;
      return k > 0.05 ? k : 1;
    };
    const kagitYaz = () => {
      if (!uc) return;
      const a = -7 * girisEgri(giris);
      if (Math.abs(a) < 0.001 && kalkma <= 0) {
        yaz(el.kagit, "kagit", "transform", "none");
        return;
      }
      const ty = (-6 / kutuOlcek()) * kalkma;
      const s = 1 + 0.012 * kalkma;
      yaz(el.kagit, "kagit", "transform", `perspective(1800px) rotateX(${a.toFixed(3)}deg) translateY(${ty.toFixed(2)}px) scale(${s.toFixed(4)})`);
    };
    /** Giriş (e 0 → 1): eğim + gölge 24 → 34 px (iki gölge katmanı çapraz söner; alt sınır 0,003 = ısınma). */
    const girisYaz = (e: number) => {
      giris = Math.min(1, Math.max(0, e));
      if (!uc) return;
      yaz(el.zeminA, "zemin-a", "opacity", Math.max(0.003, 1 - giris).toFixed(3));
      yaz(el.zeminB, "zemin-b", "opacity", Math.max(0.003, giris).toFixed(3));
      kagitYaz();
    };

    // Ortak alt gölge: θ > 75°'de 120 ms'de söner (zamanla; d çevirme bitince de akmaya devam eder).
    let golgeYaprak: Yaprak | null = null;
    let solma = 1;
    let sonT = 0;
    const altGolge = (y: Yaprak | null, th: number, icinde: boolean) => {
      const simdi = performance.now();
      if (!y) {
        golgeYaprak = null;
        yaz(el.altGolge, "alt", "opacity", icinde ? "0.003" : "0");
      } else {
        const hedef = th > 75 ? 0 : 1;
        if (y !== golgeYaprak) {
          golgeYaprak = y;
          solma = hedef;
        } else {
          const adim = Math.min(50, Math.max(0, simdi - sonT)) / 120;
          solma = hedef > solma ? Math.min(1, solma + adim) : Math.max(0, solma - adim);
        }
        const r = th * DERECE;
        const cw = KAGIT.w * Math.cos(r);
        yaz(el.altGolge, "alt", "z-index", String(y.z - 1));
        yaz(el.altGolge, "alt", "opacity", Math.max(0.003, 0.35 * Math.sin(r) * solma).toFixed(3));
        yaz(el.altDolu, "alt-dolu", "transform", `scaleX(${Math.max(0.0001, (cw - GOLGE_KENAR) / KAGIT.w).toFixed(4)})`);
        yaz(el.altKenar, "alt-kenar", "transform", `translateX(${(cw - GOLGE_KENAR).toFixed(2)}px)`);
      }
      sonT = simdi;
    };

    /*
     * Sayaçlar (denetim D1-08): dalış bir kez bitince (qd = 1) son değer kilitlenir; geri çevirmede ve yeniden
     * ileride sayaç akmaz ("0 Gençlik Buluşması" bir an yanlış olgu gibi okunuyordu). Kilit broşürden çıkınca (d < kapak)
     * açılır. İleride sayı son değerin %60'ından başlar, "+" baştan durur; "50+" dalışın ikinci yarısına dek görünmez.
     */
    let sayacKilit = false;
    const SAYAC_BAS = 0.6;
    /** Hareket yönü (d azalıyorsa geri): geri çevirmede arka kapak öğeleri sayfa dönmeden sönmesin (D1-09). */
    let sonD = Number.NaN;
    let geri = false;

    const ciz = (d: number, hareketli: boolean) => {
      // Görsel kapıları (bir kez açılır; yalnızca değişince React'e gider).
      let yeni: Kapilar | null = null;
      for (const ad of SAYFALAR) {
        if (!kapilar[ad] && kapiAcikMi(ad, d, mq.matches, cz.durak)) yeni = { ...(yeni ?? kapilar), [ad]: true };
      }
      if (yeni) {
        kapilar = yeni;
        const k = yeni;
        // Kaydırma karesini bloklamasın: görsel bağlama işi kesintiye uğrayabilir öncelikte (K2).
        startTransition(() => setKapi(k));
      }
      if (mq.matches) {
        // reduced: katmanda yalnızca kapak (CSS), hareket yok. (v2: akış kartları okunurken sahnedeki kapak
        // soluklaşırdı, icinden.css data-k; v3'te reduced-motion'da yayın yok, bu dal çalışmaz.)
        const k = String(Math.round(d));
        if (kok.dataset.k !== k) kok.dataset.k = k;
        return;
      }
      const { kapak: K, bulusma: B, arka: A } = cz.durak;

      if (d < sonD - 1e-6) geri = true;
      else if (d > sonD + 1e-6) geri = false;
      sonD = d;
      const p1 = rampa(d, ...cz.kapakCevir);
      const qd = rampa(d, ...cz.dalis);
      const p2 = rampa(d, ...cz.sayfaCevir);
      if (qd >= 1) sayacKilit = true;
      else if (d < K) sayacKilit = false;
      const sayacBitti = sayacKilit || qd >= 1;

      if (!uc) {
        cevirDuz(el.kapak, "kapak", el.kapakKivrim, el.bulusmaGolge, p1);
        cevirDuz(el.bulusma, "bulusma", el.bulusmaKivrim, el.arkaGolge, p2);
      } else {
        // Menteşe: grup sırayla (asıl sayfa, sonra hayaletler); aynı anda en çok bir yaprak döner → tek ortak alt gölge.
        let donen: Yaprak | null = null;
        let donenTh = 0;
        const grup = (g: readonly Yaprak[], ana: number, pencereler: readonly Pencere[], aktif: boolean, acik: boolean) => {
          for (let i = 0; i < g.length; i++) {
            const y = g[i];
            const p = i === 0 ? ana : rampa(d, ...pencereler[i - 1]);
            const th = mentese(y, p);
            if (i > 0) {
              // Hayalet: grubun durağında ısınır (0,003; raster hazır), asıl sayfa kalkınca açılır, kendi çevrilince kapanır.
              gorunur(y.e, y.ad, aktif && p < 1);
              yaz(y.e, y.ad, "opacity", acik ? "1" : "0.003");
            }
            if (!donen && th > 0 && th < 90) {
              donen = y;
              donenTh = th;
            }
          }
        };
        // İlk grup son duvarın ön ısıtmasında (VideoSahne d = K − 1 yayınlar) açılır: kesişme karesinde raster olmasın
        // (ölçüldü: kesişmenin ilk karesi 50 ms → ısınmayla ≤ 33 ms).
        grup(grup1, p1, cz.hayalet1, d >= K - 1 && d < B, d > cz.kapakCevir[0]);
        grup(grup2, p2, cz.hayalet2, d >= B && d < A, d > cz.sayfaCevir[0]);
        altGolge(donen, donenTh, d >= K && d <= A);

        // Kâğıt kalkması: her çevirmede ilk ve son 0,15 s (d kesri kalkis1/2).
        const f1 = (d - K) / Math.max(1e-6, B - K);
        const f2 = (d - B) / Math.max(1e-6, A - B);
        const kalk = (f: number, L: number) => (L > 0 ? kolay(Math.min(1, f / L, (1 - f) / L)) : 0);
        kalkma = d > K && d < B ? kalk(f1, cz.kalkis1) : d > B && d < A ? kalk(f2, cz.kalkis2) : 0;
        kagitYaz();

        // Arka kapak öğeleri 120 ms arayla (iç sayfa → arka geçişinin sonunda); öncesinde 0,003 (ısınık, örtülü).
        // Geride (A → B) son hayalet arka kapağı örtene dek (d ≤ penceresinin başı) tam kalır: önce sönüp sayfayı boş
        // bırakıyordu (D1-09).
        const sonHayalet = cz.hayalet2[cz.hayalet2.length - 1];
        const geriTut = geri && sonHayalet !== undefined && d > sonHayalet[0] && d <= A;
        for (let i = 0; i < arkaSira.length; i++) {
          const o = geriTut ? 1 : Math.max(0.003, rampa(d, ...cz.arkaSira[i]));
          const deger = o >= 0.998 ? "1" : o.toFixed(3);
          arkaSira[i].forEach((e, j) => yaz(e, `sira${i}-${j}`, "opacity", deger));
        }

        // Kadraj okuması hayaletlerle adım adım (yalnız hareket sırasında; varışta VideoSahne durağın metnini yazar).
        if (hareketli && kadraj) {
          const h1 = cz.hayalet1;
          const h2 = cz.hayalet2;
          let n = 0;
          if (d >= K && d <= B) {
            n = d < cz.kapakCevir[1] ? 1 : d < h1[h1.length - 1][1] ? 2 + Math.min(5, Math.floor(6 * rampa(d, h1[0][0], h1[h1.length - 1][1]))) : 8;
          } else if (d > B && d <= A) {
            n = d < cz.sayfaCevir[1] ? 8 : d < h2[h2.length - 1][1] ? 9 + Math.min(2, Math.floor(3 * rampa(d, h2[0][0], h2[h2.length - 1][1]))) : 12;
          }
          if (n) okumaYaz(kadraj, sayfaOkumasi(n));
        }

        // "50+" sayacı (facts.meetings) polaroid dalışının ikinci yarısında %60 → 50+ (0,45–0,60'ta belirir).
        const e50 = 1 - Math.pow(1 - rampa(qd, 0.45, 1), 3);
        const n50 = Math.round((SAYAC_BAS + (1 - SAYAC_BAS) * e50) * facts.meetings);
        metin(el.sayac50, "sayac50", `${sayacBitti ? facts.meetings : n50}+`);
        yaz(el.sayac50, "sayac50", "opacity", sayacBitti ? "1" : rampa(qd, 0.45, 0.6).toFixed(3));
      }
      // Sayfalar üst üste ve opak: alttakiler baştan görünür (boyanır/raster edilir, üstteki örter);
      // yalnız tam çevrilen sayfa kapanır. Sayfa "çevrilmeye başlayınca açılmak" her çevirmenin ilk
      // karesinde tüm sayfayı boyatıyordu (4× CPU mobilde v2 d 5,15 / 6,15 / 7,15'te 67–101 ms, ölçüldü).
      gorunur(el.kapak, "kapak", p1 < 1);
      gorunur(el.bulusma, "bulusma", p2 < 1);
      gorunur(el.arka, "arka", true);
      const ka = Math.max(0.003, rampa(d, ...cz.kagitGiris));
      yaz(el.kagit, "kagit", "opacity", ka >= 0.998 ? "1" : ka.toFixed(3));

      // Polaroid dalışı: ölçek log-doğrusal, öteleme ölçekle orantılı (sabit noktalı, savrulmaz).
      const s0 = DALIS_BAS.s;
      const s = s0 * Math.pow(1 / s0, qd);
      const w = (s - s0) / (1 - s0);
      const dx = (DALIS_BAS.x - DALIS_SON.x) * (1 - w);
      const dy = (DALIS_BAS.y - DALIS_SON.y) * (1 - w);
      const aci = DALIS_BAS.aci * (1 - w);
      yaz(
        el.dalis,
        "dalis",
        "transform",
        qd >= 1 ? "none" : `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${aci.toFixed(3)}deg) scale(${s.toFixed(4)})`,
      );
      yaz(el.taban, "taban", "opacity", (1 - rampa(qd, 0, 0.55)).toFixed(3));

      // 100.000+ sayacı d'ye bağlı akar (zamana değil); fotoğrafla birlikte büyür. İngilizce satır
      // tabandaki eşi tamamen sönünce belirir (çift yazı görünmesin).
      yaz(el.sayacKutu, "sayac-kutu", "opacity", rampa(qd, 0.15, 0.45).toFixed(3));
      yaz(el.enFoto, "en-foto", "opacity", rampa(qd, 0.62, 0.92).toFixed(3));
      const e = 1 - Math.pow(1 - rampa(qd, 0.3, 1), 3);
      const n = Math.round(((SAYAC_BAS + (1 - SAYAC_BAS) * e) * facts.solenAttendees) / 100) * 100;
      metin(el.sayac, "sayac", `${tr(sayacBitti ? facts.solenAttendees : n)}+`);
    };

    const birak = dAbone(ciz);
    const birakGiris = brosurGirisAbone(girisYaz);
    return () => {
      birak();
      birakGiris();
      delete kok.dataset.k;
      delete kok.dataset.kip;
      for (const e of dokunulan) {
        for (const o of ["transform", "opacity", "visibility", "z-index"]) e.style.removeProperty(o);
      }
      // Hayaletlerin SSR dönüşümü (yarım boy → tam sayfa) geri.
      for (const y of [...grup1.slice(1), ...grup2.slice(1)]) y.e?.style.setProperty("transform", "scale(2)");
    };
  }, [dK, dB, dA]);

  return (
    <div ref={kokRef} aria-hidden="true" className="ic-br" style={{ "--u": "1px" } as CSSProperties}>
      <div className="ic-br-kagit" style={{ left: u(KAGIT.x), top: u(KAGIT.y), width: u(KAGIT.w), height: u(KAGIT.h) }}>
        {/* Kâğıt gölgesi: 24 px (render ışığı, kesişme) → 34 px (okuma), FLIP'te çapraz söner; dalışta ikisi birlikte söner. */}
        <div className="ic-br-zeminler">
          <span data-br="zemin-a" className="ic-br-zemin ic-br-zemin-a" />
          <span data-br="zemin-b" className="ic-br-zemin ic-br-zemin-b" />
        </div>
        {SAYFALAR.map((ad, i) => (
          <KatmanSayfasi key={ad} ad={ad} i={i} acik={kapi[ad]} icD={icD} />
        ))}
        {HAYALET1.map((h, i) => (
          <HayaletSayfa key={h.no} h={h} z={Z_HAYALET1[i]} baslik={h.baslik ?? hayaletBasliklari[h.no] ?? ""} />
        ))}
        {HAYALET2.map((h, i) => (
          <HayaletSayfa key={h.no} h={h} z={Z_HAYALET2[i]} baslik={h.baslik ?? hayaletBasliklari[h.no] ?? ""} />
        ))}
        {/* "3b": çevrilen yaprağın altındaki sayfaya düşen ortak gölge (düz gövde + yumuşak kenar; z = yaprak − 1). */}
        <div data-br="altgolge" className="ic-br-altgolge">
          <span data-br="altgolge-dolu" className="ic-br-altgolge-dolu" />
          <span data-br="altgolge-kenar" className="ic-br-altgolge-kenar" />
        </div>
      </div>
      {/* Eşleşme kopyası: "Bugün" diskinin tam üstünde (kâğıt dışı), kâğıt kurulunca söner. */}
      <div
        className="ic-br-sanat"
        data-ic-d={icD.eslesme}
        style={{ left: u(KAGIT.x + KAPAK_SANAT.x), top: u(KAGIT.y + KAPAK_SANAT.y), width: u(KAPAK_SANAT.a), height: u(KAPAK_SANAT.a) }}
      >
        <SloganDiski />
      </div>
    </div>
  );
}

/**
 * Hareketli düzende sayfanın ekran okuyucu kopyası (akışta, sr-only; görselsiz). Katman aria-hidden;
 * reduced-motion'da gizli (orada kartlar okunur). Metin katmandakiyle aynı bileşenden gelir.
 */
export function BrosurMetni({ sayfa }: { sayfa: SayfaAdi }) {
  const Icerik = ICERIK[sayfa];
  return (
    <section aria-label={SAYFA_ADI[sayfa]} className="ic-yalniz-hareket">
      <Icerik acik={false} eager={false} />
    </section>
  );
}

/**
 * Reduced-motion düzeni: broşür sayfaları akışta, okunur kartlar (hareketli düzende `display:none`,
 * içindeki lazy görseller yüklenmez). Sayfa 1 dalış bitmiş hâliyle (sayaç 100.000+).
 */
export function BrosurKarti({ sayfa }: { sayfa: SayfaAdi }) {
  const Icerik = ICERIK[sayfa];
  return (
    <div className="ic-br-kart">
      <section aria-label={SAYFA_ADI[sayfa]} className={`ic-br-sayfa ic-br-sayfa-${sayfa} ic-br-statik`}>
        <Icerik acik eager={false} />
      </section>
    </div>
  );
}
