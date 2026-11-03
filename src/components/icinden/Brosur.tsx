"use client";

import Image from "next/image";
import { memo, startTransition, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { backCover, baskanMesaji, cop31, cover, facts, iklim } from "@/lib/content";
import { logos, photos, type PhotoAsset } from "@/lib/photos";
import { BROSUR_GEOMETRI } from "./brosur-geometri";
import { dAbone } from "./d-yayin";

/**
 * Broşür katmanı (docs/brief-icinden.md §1 d = 5…8): krem zemin üstünde gölgeli beyaz kâğıt;
 * kapak, 2 iç sayfa (Buluşmalar · Şölen, İklim eylemleri) ve arka kapak üst üste durur; d ilerledikçe
 * üstteki sayfa sırt (sol kenar) etrafında `scaleX` ile katlanarak çevrilir, gölge yalnızca
 * opacity/transform. preserve-3d YOK. Değerler dAbone'dan (B'nin rAF döngüsü) okunur ve doğrudan
 * DOM'a yazılır; React state'e yalnızca görsel kapıları girer.
 *
 * Geometri B'nin sözleşmesidir (brosur-geometri.ts `BROSUR_GEOMETRI`, katman 1000×1000 nominal):
 * kâğıt `sayfa`, kapaktaki lacivert slogan dairesi `slogan` (rotundadaki "Bugün" diski buna oturur),
 * arka kapaktaki küre fotoğrafı dairesi `arkaKure` (d9 küre katmanı buna oturur). Kapak ve arka
 * kapağın sanat karesi bu iki daireden geriye hesaplanır (/brosur cover.tsx oranları).
 *
 * Birim: sayfa içerikleri `--u` ile yazılır (katmanda `--u: 1px` = 1 nominal birim). Aynı
 * bileşenler reduced-motion'da akıştaki kartlarda (`BrosurKarti`) küçültülmüş `--u` ile çizilir.
 * Yazı boyutu nominalde ≥ 24: dikey telefonda (sig 1,35 → ölçek ~0,53) ≥ 12,6 px.
 *
 * Görseller (§3.7): sayfanın durağı k için d ∈ [k − 2, k + 1] penceresine ilk girilince mount
 * (src kapısı), sonra kalır; katmanda `loading="eager"` (kapı zaten erteliyor). Hiçbiri preload değil.
 *
 * Canlılık (§1): kapakta kesik yörünge yayları 60 s'de bir tur (d5); polaroidler pin etrafında
 * ±1,2° sarkaç, 5 s (d6, d7 faz kaydırmalı). B'nin `.ics-sahne[data-dinlenme="k"]` özniteliğine
 * bağlı, yalnızca CSS (icinden.css "broşür canlılık"); kaydırma başlayınca genlik 0'a söner.
 *
 * Geçişler (B'nin data-ic-d sözleşmesi; opaklık kompozitörde):
 *  - d4 → d5 eşleşme kesmesi İKİ ADIMDA: önce yalnız rotundadaki "Bugün" diskinin üstünde lacivert slogan
 *    diski belirir (ESLESME_D, kâğıdın DIŞINDA bir kopya), sonra kâğıt diskin çevresinde kurulur
 *    (KAGIT_GIRIS; bu opaklığı Brosur kendisi yazar).
 *  - Kapaktaki AK Parti / GK logoları d5 durağına varırken açılır (LOGO_D; parti içeriği d < 5'te yok).
 *  - d8 → d9: arka kapağın yazıları, portresi, yayları ve slogan diski söner (ARKA_SONUM_D); yalnız küre
 *    fotoğrafı dairesi kalır ve d9 küresine dalınır (d9 sloganı kapaktaki eşiyle üst üste binmez).
 *
 * Erişilebilirlik: katman görseldir (aria-hidden); metnin okunur kopyası akışta (`BrosurMetni`,
 * hareketli düzende sr-only) ve reduced-motion'da kartlarda (`BrosurKarti`).
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

/** Platolar (|d − k| ≤ 0,12) dışında: kapak → sayfa 1, polaroid dalışı, sayfa 1 → 2, sayfa 2 → arka. */
const CIZELGE = {
  kapakCevir: [5.14, 5.5],
  dalis: [5.5, 5.86],
  sayfa1Cevir: [6.14, 6.62],
  sayfa2Cevir: [7.14, 7.62],
} as const;

/** data-ic-d pencereleri (B yazar; "a b" girer/söner, "a b c e" girer ve söner). */
const ESLESME_D = "4.15 4.35 4.7 4.75";
/**
 * Kâğıdın girişi (d 4,40 → 4,62). B'nin data-ic-d'si yerine burada yazılır: alt sınır 0,003 (görünmez)
 * — opaklığı tam 0 olan katman boyanmaz/raster edilmez; böylece B'nin d4 dinlenmesindeki ısınması
 * kâğıdı ve sayfaları önceden hazırlar, ilk görünme karesi takılmaz.
 */
const KAGIT_GIRIS = [4.4, 4.62] as const;
const LOGO_D = "4.86 4.96";
const ARKA_SONUM_D = "8.72 8.45";

const SAYFA_DURAK = { kapak: 5, bulusma: 6, iklim: 7, arka: 8 } as const;
type SayfaAdi = keyof typeof SAYFA_DURAK;
const SAYFALAR: readonly SayfaAdi[] = ["kapak", "bulusma", "iklim", "arka"];

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
}: {
  s: Kare;
  acik: boolean;
  eager: boolean;
  kureSizes: string;
  /** Katmanda yaylar ve slogan diski için data-ic-d (arka kapak: d9 dalışında yalnız küre dairesi kalır). */
  soner?: string;
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
    <div className="ic-br-sanat" style={{ left: u(s.x), top: u(s.y), width: u(s.a), height: u(s.a) }}>
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

/** acik: görsel kapısı; eager: katmanda (true) / akış kartında (false); katman: d'ye bağlı data-ic-d yazılsın mı. */
type SayfaProps = { acik: boolean; eager: boolean; katman?: boolean };

function KapakIcerik({ acik, eager, katman = false }: SayfaProps) {
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
      {/* sizes arka kapakla aynı: küre fotoğrafı mobilde tek boyda iner, d6'da önbellekten gelir (K2). */}
      <SanatKaresi s={KAPAK_SANAT} acik={acik} eager={eager} kureSizes={KURE_SIZES} />
      <p className="ic-br-kapak-alt" style={{ left: u(40), top: u(782), width: u(600) }}>
        {cover.subtitle}
      </p>
      <p className="ic-br-kapak-kurum" style={{ left: u(40), top: u(852), width: u(600) }}>
        {cover.org}
      </p>
      <div
        className="ic-br-logolar"
        data-ic-d={katman ? LOGO_D : undefined}
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
 * Sayfa 1 (d6): Gençlik Buluşmaları · Bir Gençlik Şöleni. Katmanda dalış öncesi taban + küçük
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
        {facts.meetings}+ Gençlik Buluşması
        <span className="ic-br-blok-alt">son {facts.meetingsYears} yılda, Cumhurbaşkanımızın katılımıyla</span>
      </p>
      <p className="ic-br-govde" style={{ left: u(40), top: u(842), width: u(600) }}>
        {facts.electionAgeYear}&apos;de seçilme yaşı {facts.electionAge} · TBMM&apos;de {facts.youngMpsAgeLimit} yaş altı{" "}
        {facts.youngMps} milletvekilinden {facts.youngMpsOurs}&apos;ü AK Parti&apos;den
      </p>
    </>
  );
}

/** Sayfa 2 (d7): İklim eylemleri. */
function IklimIcerik({ acik, eager }: SayfaProps) {
  return (
    <>
      <p className="ic-br-yaprak" style={{ left: u(40), top: u(40) }}>
        {iklim.title}
      </p>
      <p lang="en" data-onay="en" className="ic-br-en" style={{ left: u(40), top: u(98) }}>
        Climate Action
      </p>
      <p className="ic-br-dev-sayi" style={{ left: u(40), top: u(136) }}>
        {facts.saplings} fidan
      </p>
      <p className="ic-br-yesil" style={{ left: u(40), top: u(232), width: u(600) }}>
        Üsküdar Gençlik Kolları Hatıra Ormanı · {facts.saplingsYear}
      </p>
      <p className="ic-br-govde ic-br-govde-koyu" style={{ left: u(40), top: u(318), width: u(600) }}>
        Genç İklim: İklim Liderliği ve Okuryazarlığı Kampı
        <br />
        21–23 Ağustos 2026 · İstanbul
      </p>
      <div className="ic-br-ikili ic-br-ikili-sol" style={{ left: u(38), top: u(470), width: u(288) }}>
        <div className="ic-sarkac ic-sarkac-b">
          <Polaroid
            photo={photos.fidanDikimiEkip}
            acik={acik}
            eager={eager}
            sizes="(max-width: 600px) 42vw, 300px"
            position="50% 40%"
            aspect="3 / 4"
            yazi="Fidan dikimi"
          />
        </div>
      </div>
      <div className="ic-br-ikili ic-br-ikili-sag" style={{ left: u(354), top: u(500), width: u(288) }}>
        <div className="ic-sarkac ic-sarkac-c">
          <Polaroid
            photo={photos.copToplamaOrman}
            acik={acik}
            eager={eager}
            sizes="(max-width: 600px) 42vw, 300px"
            position="50% 45%"
            aspect="3 / 4"
            yazi="Orman temizliği"
          />
        </div>
      </div>
    </>
  );
}

/** Arka kapak (d8): alıntı, küre fotoğrafı dairesi + slogan dairesi, Başkan'ın ilk cümlesi, p22 portre. */
function ArkaKapakIcerik({ acik, eager, katman = false }: SayfaProps) {
  const alinti = backCover.quote.replace(/^"|"$/g, "");
  const bosluk = alinti.indexOf(" Hep ");
  const satir = backCover.line2.split(" ");
  const soner = katman ? ARKA_SONUM_D : undefined;
  return (
    <>
      <SanatKaresi s={ARKA_SANAT} acik={acik} eager={eager} kureSizes={KURE_SIZES} soner={soner} />
      {/* Küre dairesi dışındaki her şey tek kompozit sarmalayıcıda söner (d9'a dalış). */}
      <div className="ic-br-arka-metin" data-ic-d={soner}>
        <p className="ic-br-arka-alinti" style={{ left: u(30), top: u(30), width: u(620) }}>
          {"“"}
          {alinti.slice(0, bosluk)}
          <br />
          {alinti.slice(bosluk + 1)}
          {"”"}
        </p>
        {/* ONAY: İngilizce satır (docs/onay-listesi.md §14). */}
        <p lang="en" data-onay="en" className="ic-br-en ic-br-arka-en" style={{ left: u(30), top: u(128), width: u(620) }}>
          Always by your side
        </p>
        <p className="ic-br-arka-satir" style={{ left: u(316), top: u(552), width: u(330) }}>
          <span className="ic-br-arka-cop">{backCover.line1}</span>
          <br />
          {satir.slice(0, 3).join(" ")}
          <br />
          {satir[3]}
          <br />
          {satir.slice(4).join(" ")}
        </p>
        <div className="ic-br-portre" style={{ left: u(36), top: u(706), width: u(214) }}>
          <Polaroid
            photo={photos.solenKocaeliSahaIkili}
            acik={acik}
            eager={eager}
            sizes="(max-width: 600px) 34vw, 220px"
            position="50% 11%"
            aspect="1 / 1"
          />
        </div>
        <blockquote className="ic-br-mesaj" style={{ left: u(278), top: u(690), width: u(366) }}>
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
  iklim: IklimIcerik,
  arka: ArkaKapakIcerik,
};

const SAYFA_ADI: Record<SayfaAdi, string> = {
  kapak: "Broşür kapağı: COP31'de AK Gençlik",
  bulusma: "Broşür sayfası: Gençlik Buluşmaları ve Bir Gençlik Şöleni",
  iklim: "Broşür sayfası: İklim eylemleri",
  arka: "Broşür arka kapağı: Başkan'ın mesajı",
};

/* ============================ katman ============================ */

/**
 * Görsel kapısı: d ∈ [k − 2, k + 1]. Reduced-motion'da katman d5–d9 boyunca yalnızca kapağı
 * gösterir (sayfalar akıştaki kartlarda, kendi lazy görselleriyle): kapağın kapısı d ≥ 3'te üst
 * sınırsız açılır, iç sayfalarınki hiç açılmaz (gizli katmanda boşuna indirme olmasın).
 */
function kapiAcikMi(ad: SayfaAdi, d: number, azalt: boolean): boolean {
  const k = SAYFA_DURAK[ad];
  if (azalt) return ad === "kapak" && d >= k - 2;
  return d >= k - 2 && d <= k + 1;
}

type Kapilar = Readonly<Record<SayfaAdi, boolean>>;
const KAPALI: Kapilar = { kapak: false, bulusma: false, iklim: false, arka: false };

/**
 * Katmandaki tek sayfa. memo: bir görsel kapısı açılınca yalnız o sayfa yeniden render edilir (dört sayfa
 * birden değil; K2: kapı açılışı kaydırma karesinde ana iş parçacığını meşgul ediyordu).
 */
const KatmanSayfasi = memo(function KatmanSayfasi({ ad, i, acik }: { ad: SayfaAdi; i: number; acik: boolean }) {
  const Icerik = ICERIK[ad];
  return (
    <section data-sayfa={ad} aria-label={SAYFA_ADI[ad]} className={`ic-br-sayfa ic-br-sayfa-${ad}`} style={{ zIndex: SAYFALAR.length - i }}>
      <Icerik acik={acik} eager katman />
      <span aria-hidden="true" className="ic-br-sirt" />
      {/* bu sayfa çevrilirken üstüne düşen kıvrım gölgesi */}
      {i < SAYFALAR.length - 1 ? <span aria-hidden="true" data-br={`kivrim-${ad}`} className="ic-br-kivrim" /> : null}
      {/* üstteki sayfa çevrilirken bu sayfada katlanan kenarı izleyen gölge */}
      {i > 0 ? <span aria-hidden="true" data-br={`golge-${ad}`} className="ic-br-golge" /> : null}
    </section>
  );
});

/**
 * `<Katman id="brosur">` içeriği (katmanın tamamı). Reduced-motion'da yalnızca kapak görünür;
 * sayfalar akıştaki `BrosurKarti`larda.
 */
export default function Brosur() {
  const kokRef = useRef<HTMLDivElement>(null);
  const [kapi, setKapi] = useState<Kapilar>(KAPALI);

  useEffect(() => {
    const kok = kokRef.current;
    if (!kok) return;
    const q = (s: string) => kok.querySelector<HTMLElement>(`[data-br="${s}"]`);
    const sayfa = (ad: SayfaAdi) => kok.querySelector<HTMLElement>(`[data-sayfa="${ad}"]`);
    const el = {
      kagit: kok.querySelector<HTMLElement>(".ic-br-kagit"),
      kapak: sayfa("kapak"),
      bulusma: sayfa("bulusma"),
      iklim: sayfa("iklim"),
      arka: sayfa("arka"),
      kapakKivrim: q("kivrim-kapak"),
      bulusmaKivrim: q("kivrim-bulusma"),
      iklimKivrim: q("kivrim-iklim"),
      bulusmaGolge: q("golge-bulusma"),
      iklimGolge: q("golge-iklim"),
      arkaGolge: q("golge-arka"),
      dalis: q("dalis"),
      taban: q("taban"),
      sayac: q("sayac"),
      sayacKutu: q("sayac-kutu"),
      enFoto: q("en-foto"),
    };
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let kapilar = KAPALI;

    /** Değişmeyen değer yazılmaz (anahtar: eleman adı + özellik). */
    const onbellek = new Map<string, string>();
    const yaz = (e: HTMLElement | null, ad: string, ozellik: string, deger: string) => {
      if (!e) return;
      const k = `${ad}|${ozellik}`;
      if (onbellek.get(k) === deger) return;
      onbellek.set(k, deger);
      e.style.setProperty(ozellik, deger);
    };
    // "visible" DEĞİL "inherit": katman kökü (B) visibility:hidden iken sayfa da gizli kalmalı.
    const gorunur = (e: HTMLElement | null, ad: string, v: boolean) => yaz(e, ad, "visibility", v ? "inherit" : "hidden");

    /**
     * Sayfa çevirme (p 0→1): üst sayfa sırt etrafında scaleX(1 − p), üstüne kıvrım gölgesi;
     * alttaki sayfada katlanan kenarı izleyen gölge şeridi (yalnızca transform/opacity).
     */
    const cevir = (ust: HTMLElement | null, ad: string, kivrim: HTMLElement | null, golge: HTMLElement | null, p: number) => {
      yaz(ust, ad, "transform", p > 0 ? `scaleX(${Math.max(0.0001, 1 - p).toFixed(4)})` : "none");
      yaz(kivrim, `${ad}-kivrim`, "opacity", (p * 0.55).toFixed(3));
      yaz(golge, `${ad}-golge`, "opacity", (Math.min(1, p * 5) * (1 - p) * 0.9).toFixed(3));
      yaz(golge, `${ad}-golge`, "transform", `translateX(${((1 - p) * KAGIT.w).toFixed(2)}px)`);
    };

    const ciz = (d: number) => {
      // Görsel kapıları (bir kez açılır; yalnızca değişince React'e gider).
      let yeni: Kapilar | null = null;
      for (const ad of SAYFALAR) {
        if (!kapilar[ad] && kapiAcikMi(ad, d, mq.matches)) yeni = { ...(yeni ?? kapilar), [ad]: true };
      }
      if (yeni) {
        kapilar = yeni;
        const k = yeni;
        // Kaydırma karesini bloklamasın: görsel bağlama işi kesintiye uğrayabilir öncelikte (K2).
        startTransition(() => setKapi(k));
      }
      if (mq.matches) {
        // reduced: katmanda yalnızca kapak (CSS), hareket yok. d6–d8'de akış kartları okunurken
        // sahnedeki kapak soluklaşır (icinden.css), kartların arasında ayrı bir sayfa gibi görünmesin.
        const k = String(Math.round(d));
        if (kok.dataset.k !== k) kok.dataset.k = k;
        return;
      }

      const p1 = rampa(d, ...CIZELGE.kapakCevir);
      const qd = rampa(d, ...CIZELGE.dalis);
      const p2 = rampa(d, ...CIZELGE.sayfa1Cevir);
      const p3 = rampa(d, ...CIZELGE.sayfa2Cevir);

      cevir(el.kapak, "kapak", el.kapakKivrim, el.bulusmaGolge, p1);
      cevir(el.bulusma, "bulusma", el.bulusmaKivrim, el.iklimGolge, p2);
      cevir(el.iklim, "iklim", el.iklimKivrim, el.arkaGolge, p3);
      // Sayfalar üst üste ve opak: alttakiler baştan görünür (boyanır/raster edilir, üstteki örter);
      // yalnız tam çevrilen sayfa kapanır. Sayfa "çevrilmeye başlayınca açılmak" her çevirmenin ilk
      // karesinde tüm sayfayı boyatıyordu (4× CPU mobilde d 5,15 / 6,15 / 7,15'te 67–101 ms, ölçüldü).
      gorunur(el.kapak, "kapak", p1 < 1);
      gorunur(el.bulusma, "bulusma", p2 < 1);
      gorunur(el.iklim, "iklim", p3 < 1);
      gorunur(el.arka, "arka", true);
      const ka = Math.max(0.003, rampa(d, ...KAGIT_GIRIS));
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
      const deger = qd >= 1 ? `${tr(facts.solenAttendees)}+` : tr(Math.round((e * facts.solenAttendees) / 100) * 100);
      if (el.sayac && onbellek.get("sayac|metin") !== deger) {
        onbellek.set("sayac|metin", deger);
        el.sayac.textContent = deger;
      }
    };

    const birak = dAbone(ciz);
    return () => {
      birak();
      delete kok.dataset.k;
      for (const e of Object.values(el)) {
        e?.style.removeProperty("transform");
        e?.style.removeProperty("opacity");
        e?.style.removeProperty("visibility");
      }
    };
  }, []);

  return (
    <div ref={kokRef} aria-hidden="true" className="ic-br" style={{ "--u": "1px" } as CSSProperties}>
      <div className="ic-br-kagit" style={{ left: u(KAGIT.x), top: u(KAGIT.y), width: u(KAGIT.w), height: u(KAGIT.h) }}>
        {SAYFALAR.map((ad, i) => (
          <KatmanSayfasi key={ad} ad={ad} i={i} acik={kapi[ad]} />
        ))}
      </div>
      {/* Eşleşme kopyası: "Bugün" diskinin tam üstünde (kâğıt dışı), kâğıt kurulunca söner. */}
      <div
        className="ic-br-sanat"
        data-ic-d={ESLESME_D}
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
