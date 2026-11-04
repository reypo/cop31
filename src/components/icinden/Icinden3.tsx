import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { backCover, bizKimiz, bulusmalar, cop31, cover, facts, genclikKollari, iklim, solenler, stats, vizyon } from "@/lib/content";
import { emanetAlanlari } from "@/lib/emanet";
import { logos } from "@/lib/photos";
import { stant } from "@/lib/stant";
import Cop31Logo from "./Cop31Logo";
import { YaylarStatik, YayTanimlari } from "./DunyaYaylari";
import { EmanetStatik } from "./EmanetIsiklari";
import { BogumEtiketleri, bogumMetinleri, KokHalkalari, Polaroidler } from "./FidanKatmani";
import IcindenKapanis from "./IcindenKapanis";
import { istemciManifesti, klipler, type Durak } from "./klipler";
import MetinBandi, { En } from "./MetinBandi";
import { dizinler, type Rol } from "./rol";
import SahneEtiketleri from "./SahneEtiketleri";
import VideoSahne from "./VideoSahne";
import "./icinden.css";
import "./icinden3.css";
import "./icinden3-isik.css";

/**
 * /icinden v3 "sinematik" (docs/brief-icinden-3.md §9, §12, G turu §14.4, W-2/W-3 §14.7): 13 durak (d0–d12) + kapanış. Sunucu bileşeni:
 * bütün metin, etiket ve logo HTML'de; istemci yalnız VideoSahne (oynatıcı + adımlama).
 *
 * Bölümler manifestin rol tablosundan (`klipler.json` `duraklar[].rol`, sıra = durak no; E turu §12.4-1): her durak
 * rolüne göre (ve aynı rolün kaçıncısı olduğuna göre: duvar 1/2) çizilir; numaralar sabit değil.
 *
 * Her durak bir `<section class="v3-durak">` (100svh, görünmez çapa); içinde sr-only başlık ve sahnenin
 * alt metni (R3 kartları (e); hareketli düzende ekran okuyucu için), metin bandı (fixed) ve reduced-motion
 * düzeninin posteri (`.v3-azalt`; hareketli düzende `display: none`, lazy: inmez). Duvara basılan her yazının
 * akışta sr-only eşi vardır (§12.4-4).
 *
 * G turu (§14.4.6) + W-3 (§14.7 C; kullanıcı: "duvarlardan sonra broşürü hiç göstermeyelim, direkt fidana"): duvarlardan
 * (d6–d7) sonra doğrudan render edilmiş fidan: d8 kökler, d9 gövde, d10 dallar, d11 yapraklar (masa durağı kalktı; "Dijital
 * broşür →" yalnız d0 şeridinde ve kapanışta). W-2 (§14.7): tur Dünya'da biter — d11'den stant tepeden →
 * Antalya → Türkiye → Dünya'ya uzaklaşma (r43 → r32 → r21 zinciri), d12 "Gezegenimiz Ortak Evimizdir" (E turundaki d11 gibi:
 * üst bant el yazısı, d1 yayları tersten). Fidan bantları altta (y ≥ %68), krem, /fidan `leaf-tag` çipiyle; metinler yalnız
 * content.ts'ten. DOM katmanı FidanKatmani.tsx'te.
 *
 * Parti içeriği d1–d3'te yok; stant içi ve fidan (d4–d11) serbest (§12, §14.0). Logo kuralı: resmî logo yalnız beyaz
 * zeminde, bütün hâlinde söner (d0 bandı); lombar deliği ancak logo söndükten sonra açılır (VideoSahne).
 */

const tr = (n: number) => n.toLocaleString("tr-TR");

/**
 * Sentinel-2 sahnelerinin yılları (atıf "Contains modified Copernicus Sentinel data <yıl>"; brief §9.6, §14.4.5). d1–d3
 * Kasım 2025 mozaiği + G4 ilkbahar sahnesi (A3 seçimi: S2A 17 Nisan 2025, `scratchpad/g-b/g4-hazirlik/secilen.txt`).
 * V, G4 son render'ından sonra `docs/varliklar-icinden.md` tablosuyla doğrular; yıl değişirse YALNIZ bu dizi değişir
 * (birden çok yıl ", " ile birleşir).
 */
export const SENTINEL_YILLARI: readonly number[] = [2025];

/**
 * Kapanış atıfları (§9.6; R1 §3 metni birebir). ONAY: onay-listesi §14. İngilizce kısım `lang="en"` ile
 * (ekran okuyucu Türkçe fonetikle okumasın, WCAG 3.1.2); metin birleşince yine birebir aynı. "Stant ve fidan görünümü
 * temsilîdir." (§14.4.1 K9): duvar baskıları ve fidan müşteri teyidine kadar (onay-listesi §14.1).
 */
const ATIFLAR = [
  { on: "Uydu görüntüsü:", metin: `Contains modified Copernicus Sentinel data ${[...new Set(SENTINEL_YILLARI)].sort().join(", ")}.`, en: true },
  {
    on: "Yükseklik:",
    metin:
      "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.",
    en: true,
  },
  { metin: "Dünya: NASA Earth Observatory (Blue Marble, Black Marble), GEBCO." },
  { metin: "Harita verisi © OpenStreetMap katkıda bulunanlar." },
  { metin: "COP31 Türkiye logosu etkinliğe atıf amacıyla kullanılmıştır." },
  { metin: "Stant ve fidan görünümü temsilîdir." },
] as const;

/** Tarih aralığı satır sonunda bölünmesin ("9–" / "20 Kasım"). */
const Tarih = ({ children }: { children: ReactNode }) => <span className="v3-nowrap">{children}</span>;

/**
 * Dijital broşür bağlantısı (§14.4.6: d0 üst şeridi ve kapanış; W-3'te masa bandı kalktı). Kiosk'ta gizli (stant ekranı döngüden çıkmasın).
 * Ön getirme yok (`prefetch={false}`): d0 şeridindeki bağlantı açılışta görünür, /brosur'un RSC yükü ve stil dosyası her
 * oturumda inip mobil bütçeye (§14.4.1, ≤ 12,0 MB) giriyordu ve Chrome "preload edilip kullanılmadı" uyarısı veriyordu.
 */
export function DijitalBrosur({ className = "" }: { className?: string }) {
  return (
    <Link href="/brosur" prefetch={false} className={`v3-dijital ${className}`}>
      Dijital broşür <span aria-hidden="true">→</span>
    </Link>
  );
}

/** Paragrafın ilk cümlesi (birebir; ilk ". " noktasına dek, nokta dahil). */
const ilkCumle = (p: string) => {
  const i = p.indexOf(". ");
  return i < 0 ? p : p.slice(0, i + 1);
};

/**
 * Sahnelerin alt metinleri (R3 kartları (e)), rol anahtarıyla (aynı rolün ikincisi "-2"). C turunda son render
 * posterlerine göre düzeltildi; E turu (emanet, duvar-2) planlanan render'a göre yazıldı (§12.0, §12.3). G turu: duvar
 * (d6) G7 dokusuna göre (§14.4.4; A6 render'ı gelince V doğrular), fidan-* S3 önizleme posterlerine göre
 * (960², `public/icinden/p/d/p9…pc`; son render aynı kadraj). Tür adı yok (K3), "81" yok (K8).
 */
const ALT: Partial<Record<string, string>> = {
  lombar: "Beyaz zemin üzerinde resmî COP31 Türkiye Antalya logosu: lale ve ebru desenli, mavi-yeşil bir dünya diski.",
  dunya: "Uzaydan Dünya. Avrupa, Akdeniz ve Kuzey Afrika gündüz ışığında; gece sınırı Hazar Denizi ve İran üzerinden geçiyor, doğuda şehir ışıkları yanıyor. Antalya diskin ortasının hemen üstünde.",
  emanet: "Yüksekten bütün Türkiye: Anadolu'nun dağları ve kıyıları, çevresinde denizler. Antalya güney kıyısında işaretli; 12 emanet alanı numaralı ışıklarla gösteriliyor.",
  // V düzeltmesi (G4-dağ, v-2): Beydağları yamaçları artık ormanlı (S1 orman katmanı, brief §14.6; p3/l3 yeni render).
  expo: "Öğleden sonra güneşine karşı Antalya: önde seraların ve yeşil tarlaların arasından geçen D400 ile Aksu ovası, ortada Antalya Expo Center'ın holleri, geride kent, güneşte parlayan körfez ve yamaçları ormanlı Beydağları.",
  // E turu p4 (denetim D3-10): arka duvar ve ön cephe pankartı da görünüyor; metinler content.ts / stant.ts'ten. d4
  // G turunda yeniden render edilmedi (§14.4.4): arka duvarda E/F dokusu.
  anatomi: `Karanlık fuar holünde, ışığın altında standımız yukarıdan: ortada 12 sütunlu Emanet Rotundası ve '12.000 Yıllık Emanet' bandı, solda 'Oyna – Sen olsan ne yapardın?' alanı ve turuncu 'Gel, oyna!' pankartı, sağda amfi; arkada '${iklim.title}' duvarı, girişte '${stant.pankartlar[1]}' pankartı.`,
  sutunlar: "Rotundanın içinden yere bakış: renkli dönem halkasının ortasında 'Buradasın, Bugün' yazıyor; çevrede 12 miras sütununun alt uçları.",
  duvar: `Standın arka duvarı, çapraz açıdan: krem zemin, altta koyu dağ silueti. Solda '${bulusmalar.title}' başlığı, büyük '${facts.meetings}+' ve 'gençlik buluşması, son ${facts.meetingsYears} yılda'; altında 'Bir Gençlik Şöleni', '${facts.solenDate} · ${facts.solenPlace}' ve büyük '${tr(facts.solenAttendees)}+ genç'.`,
  "duvar-2": "Standın sol duvarı: '1.000.000+ Genç Üye' ve '81 İl · 922 İlçe' yazıları, altında iki ekranda 'Sen de söz ver.'; sağ altta bir bank.",
  "fidan-kok": "Karanlık fuar holünde, bankonun üstünde ahşap çerçeveli, ön yüzü camlı bir kök kasası. Koyu toprağın içinde ortadaki tohumdan inen kazık kök ve iki yana açılan ince kökler; köklerin krem renkli uçları spot ışığında seçiliyor.",
  "fidan-govde": "Kök kasasının toprağından ince bir fidan gövdesi yükseliyor, hafif S biçiminde kıvrılarak; gövdede iki küçük boğum. Camın ardında kökler, arkada karanlık hol ve stant duvarları.",
  "fidan-dal": "Fidan dallanmış: gövdeden iki yana açılan ince dalların uçlarında küçük, açık renkli tomurcuk kümeleri. Altta kasanın camının ardında kökler; arkada karanlık hol.",
  "fidan-yaprak": "Yapraklanmış genç ağaç: dalları kenarları dilimli, zeytin yeşili yapraklarla dolu; ikindi güneşi yaprakların arkasından vuruyor. Gövde kök kasasından yükseliyor, çevrede karanlık hol.",
  // W-2 (§14.7): E turundaki metin (d12 = p1/l1, açılıştaki Dünya).
  "dunya-2": "Uzaydan Dünya, açılıştaki gibi. Üstünde el yazısıyla: Gezegenimiz Ortak Evimizdir.",
};

/**
 * Reduced-motion düzeninin posteri (video yok): yön `<picture>` ile; lazy. LQIP yok (G turu: 12 poster × satır içi base64
 * HTML'de ve RSC yükünde iki kez ~9 kB'tı; HTML gz hedefi ≤ 56 kB): yer tutucu CSS'te düz koyu zemin.
 */
function AzaltPoster({ D, alt, etiketli = false, ust }: { D: Durak; alt: string; etiketli?: boolean; ust?: ReactNode }) {
  const p = D.poster;
  if (!p?.dikey) return null;
  // Yalnız metinli etiketler (künye/emanet işaretleri W2a'nın statik SVG'sinde).
  const e = etiketli ? D.etiketler?.dikey.filter((t) => t.metin && t.tur !== "kunye") : undefined;
  return (
    <figure className="v3-azalt">
      <picture>
        {p.yatay ? <source media="(min-aspect-ratio: 4/3)" srcSet={p.yatay.dosya} type="image/webp" /> : null}
        {/* render posteri: önceden boyutlu WebP, next/image gerekmez */}
        <img
          src={p.dikey.dosya}
          alt={alt}
          width={720}
          height={1280}
          loading="lazy"
          decoding="async"
        />
      </picture>
      {/* d1/d2 statik ışık katmanı (W2a, §12.4-8): yaylar, emanet ışıkları, bağlar, künye; d8 81 halka (G turu). */}
      {ust}
      {e?.length ? (
        <div aria-hidden="true" className="v3-azalt-etiketler">
          {e.map((t) => (
            <span key={t.ad} className={`v3-azalt-et v3-et-${t.tur}`} style={{ left: `${(t.x / 720) * 100}%`, top: `${(t.y / 1280) * 100}%` } as CSSProperties}>
              {t.metin}
            </span>
          ))}
        </div>
      ) : null}
    </figure>
  );
}

function Bolum({
  k,
  rol,
  baslik,
  alt,
  h1 = false,
  children,
}: {
  k: number;
  rol: Rol;
  baslik: string;
  /** Sahnenin alt metni (hareketli düzende ekran okuyucu için akışta). */
  alt?: string;
  h1?: boolean;
  children?: ReactNode;
}) {
  const H = h1 ? "h1" : "h2";
  return (
    <section data-d={k} data-rol={rol} id={`d${k}`} aria-labelledby={`v3-b${k}`} className="v3-durak">
      <H id={`v3-b${k}`} className="sr-only">
        {baslik}
      </H>
      {alt ? <p className="ic-yalniz-hareket">{alt}</p> : null}
      {children}
    </section>
  );
}

/** Duvara/cepheye basılı yazıların ekran okuyucu eşi (§12.4-4): hareketli düzende ve reduced'da akışta, görünmez. */
function DuvarYazisi({ etiket, satirlar }: { etiket: string; satirlar: readonly ReactNode[] }) {
  return (
    <ul className="sr-only" aria-label={etiket}>
      {satirlar.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  );
}

/** Fidan bandının çipi (/fidan `leaf-tag`; §14.4.6). Başlığın parçası olarak sr-only başlıkta da geçer. */
const Cip = ({ children }: { children: string }) => (
  <span className="leaf-tag v3-cip" aria-hidden="true">
    {children}
  </span>
);

export default function Icinden3() {
  const m = klipler;
  const D = m.duraklar;
  const I = dizinler(D.map((d) => d.rol));
  const dunya = D[I.dunya];
  const dunyaC = dunya?.ozel?.dunyaC;
  const r0 = dunya?.ozel?.dunyaR?.[0] ?? 115;
  // Logo yerleşimi video uzayında (amblem = T01'in 0. karesindeki disk), CSS'te cover dönüşümüyle.
  const logoStil = {
    "--ax-d": dunyaC?.dikey[0] ?? 360,
    "--ay-d": dunyaC?.dikey[1] ?? 512,
    "--ax-y": dunyaC?.yatay[0] ?? 640,
    "--ay-y": dunyaC?.yatay[1] ?? 232,
    "--ar": r0,
  } as CSSProperties;

  const [uye, il, ilce] = stats;
  const ilIlce = `${il.value} ${il.label} · ${ilce.value} ${ilce.label}`;
  // d6 (G7 §14.4.4): "Bir Gençlik Şöleni" solenler.paragraphs[0]'daki tırnaklı addan; motto backCover.quote tırnaksız.
  const solenAdi = /"([^"]+)"/.exec(solenler.paragraphs[0])?.[1] ?? solenler.title;
  const motto = backCover.quote.replace(/^"|"$/g, "");
  // Fidan durakları (rol.ts FIDAN_ROLLERI sırasıyla): sahne katmanı kök ve gövdeninkini kullanır.
  const [fKok, fGovde] = I.fidanlar;

  /** Durak k'nın bölümü: rolü ve aynı rolün kaçıncısı olduğu (duvar 1/2). */
  const bolum = (d: Durak, k: number): ReactNode => {
    const sira = D.slice(0, k).filter((x) => x.rol === d.rol).length;
    const anahtar = sira ? `${d.rol}-${sira + 1}` : d.rol;
    const alt = ALT[anahtar] ?? "";
    switch (anahtar) {
      case "lombar":
        // d0 — Açılış: resmî logo beyaz zeminde; AK Gençlik kimliği ayrı üst şeritte; sağda "Dijital broşür →" (§14.4.6).
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik="COP31'in İçinden" alt={alt} h1>
            <div data-d={k} data-rol={d.rol} className="v3-bant v3-acilis" style={logoStil}>
              <div className="v3-serit">
                <Link href="/" className="v3-geri">
                  <span aria-hidden="true">←</span> Konseptler
                </Link>
                <div className="v3-kimlik">
                  <Image
                    src={logos.genclikKollari.src}
                    width={logos.genclikKollari.width}
                    height={logos.genclikKollari.height}
                    alt={logos.genclikKollari.alt}
                    sizes="40px"
                    preload
                    className="v3-kimlik-logo"
                  />
                  <p>
                    <span className="v3-kimlik-ad">AK Parti Gençlik Kolları</span>
                    <span className="v3-kimlik-alt">COP31 Antalya standı</span>
                  </p>
                </div>
                <DijitalBrosur className="v3-dijital-serit" />
              </div>
              <div className="v3-logo">
                <Cop31Logo title={alt} />
              </div>
              {/* Logo zaten "COP31 Türkiye Antalya" diyor: altında yalnız yeni bilgi (tarih, yer). */}
              <p className="v3-logo-alti">
                <Tarih>{cop31.dates}</Tarih>, {cop31.venue}
              </p>
              <div className="v3-ipucu">
                <p>Aşağı kaydır</p>
                <p lang="en" data-onay="en">
                  Scroll down
                </p>
              </div>
            </div>
          </Bolum>
        );
      case "dunya":
        // d1 — Dünya (üst bant, uzay scrim). Yaylar ve künye W2a (DunyaYaylari, SahneEtiketleri kunye).
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik="Dünya Antalya'da buluşuyor" alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="ust" tema="uzay">
              <p className="v3-baslik" aria-hidden="true">
                Dünya Antalya&apos;da buluşuyor
              </p>
              <En>The world meets in Antalya</En>
              {/* ~150.000 ziyaretçi: docs/brief.md §1 (ONAY, onay-listesi §14). */}
              <p className="v3-govde">
                BM İklim Değişikliği Konferansı COP31, <Tarih>{cop31.dates}&apos;da</Tarih> {cop31.venue}&apos;da. Yaklaşık 150.000
                yabancı ziyaretçi bekleniyor.
              </p>
            </MetinBandi>
            <AzaltPoster D={d} alt={alt} etiketli ust={<YaylarStatik D={d} kunye={d.etiketler?.dikey.find((t) => t.tur === "kunye")?.metin} />} />
            {/* Yay yolları ve gradyanları (bir kez; sahne ve reduced posteri <use> ile kullanır). */}
            <YayTanimlari D={d} />
          </Bolum>
        );
      case "emanet":
        // d2 — Türkiye (§12.4-3): alt bant (gece #0B1A2E; yatayda sol altta). Emanet ışıkları ve bağlar W2a.
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={`Türkiye: ${stant.girisMetni[0].replace(/\.$/, "")}`} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="gece">
              <p className="v3-baslik" aria-hidden="true">
                {stant.girisMetni[0]}
              </p>
              <En>From 12,000 years ago to today.</En>
              <p className="v3-govde">{stant.girisMetni[1]}</p>
            </MetinBandi>
            <AzaltPoster D={d} alt={alt} ust={<EmanetStatik D={d} />} />
          </Bolum>
        );
      case "expo":
        // d3 — Antalya Expo (alt bant). Mekân adı metinde `cop31.venue`; haritadaki yapı etiketi OSM adıyla (ONAY).
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={cop31.venue} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="altin">
              <p className="v3-baslik" aria-hidden="true">
                {cop31.venue}
              </p>
              <p className="v3-alt-satir">Aksu&apos;da; kent merkezine 12 km, havalimanına 5 km.</p>
              <En>12 km from the city centre, 5 km from the airport</En>
            </MetinBandi>
            <AzaltPoster D={d} alt={alt} etiketli />
          </Bolum>
        );
      case "anatomi":
        // d4 — Stant anatomisi (üst bant, hol scrim) + etkin bölgenin kısa satırı alt bantta. Gövde cümlesi d2'de.
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={`Standımız: ${stant.tema}`} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="ust" tema="hol">
              <p className="v3-baslik" aria-hidden="true">
                {stant.tema}
              </p>
              <En>{stant.temaEn}</En>
              <p className="v3-etiket-satir">{stant.hashtag}</p>
            </MetinBandi>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="hol" className="v3-bant-ince v3-bant-ek">
              <ul className="v3-spot-satirlari" aria-label="Standın bölgeleri">
                {stant.bolgeler.map((b) => {
                  const ad = b.no === 4 ? "Amfi" : b.ad;
                  // Ad zaten noktalama ile bitiyorsa ("…ne yapardın?") nokta eklenmez.
                  return (
                    <li key={b.no} data-no={b.no} className="v3-spot-satir">
                      <span className="v3-spot-ad">
                        {ad}
                        {/[.?!…]$/.test(ad) ? "" : "."}
                      </span>{" "}
                      {b.kisa}
                    </li>
                  );
                })}
              </ul>
            </MetinBandi>
            {/* Ön cephe giriş pankartı (S2-E cephe-on, §12.3; stant.ts pankartlar birebir). */}
            <DuvarYazisi etiket="Standın giriş pankartı" satirlar={[stant.pankartlar[1], stant.pankartlar[2], stant.pankartlar[3]]} />
            <AzaltPoster D={d} alt={alt} etiketli />
          </Bolum>
        );
      case "sutunlar":
        // d5 — Buradasın / Bugün (alt bant, krem scrim) + etkin sütun satırı (4,5 s)
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={`Buradasın, bugün. ${stant.slogan}`} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem">
              <p className="v3-baslik" aria-hidden="true">
                {stant.slogan}
              </p>
              <En>Climate, nature and zero waste are our heritage.</En>
              <ol className="v3-sutun-satirlari" aria-label="12 sütun, 12 emanet">
                {emanetAlanlari.map((a) => (
                  <li key={a.no} data-no={a.no} className="v3-sutun-satir">
                    <span className="v3-sutun-no">{String(a.no).padStart(2, "0")}</span> {a.ad}, {a.il}. {a.donem}.{" "}
                    <span className="v3-sutun-cumle">{a.emanet}</span>
                  </li>
                ))}
              </ol>
            </MetinBandi>
            <AzaltPoster D={d} alt={alt} />
          </Bolum>
        );
      case "duvar":
        // d6 — Gençlik Buluşmaları · Bir Gençlik Şöleni (arka duvar, G7 §14.4.4; fotoğrafsız). Alt krem bant; 3 spot satırı
        // 600 + 3 × 3.500 ms; etkin satırdan p6 çapasına (bulusma, solen, motto; `data-capa`) kılavuz — VideoSahne,
        // manifest ozel.duvarCapalari (yoksa çizilmez).
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={`${bulusmalar.title} · ${solenAdi}`} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem">
              <p className="v3-baslik" aria-hidden="true">
                {bulusmalar.title}
              </p>
              <En>Youth Meetings</En>
              <ul className="v3-spot-satirlari v3-duvar-satirlari" aria-label={bulusmalar.title}>
                <li data-no={1} data-capa="bulusma" className="v3-spot-satir">
                  Son {facts.meetingsYears} yılda {facts.meetings}&apos;den fazla gençlik buluşması.
                </li>
                <li data-no={2} data-capa="solen" className="v3-spot-satir">
                  {solenAdi}: <span className="v3-nowrap">{facts.solenDate}</span>, {facts.solenPlace}, {tr(facts.solenAttendees)}+ genç.
                </li>
                <li data-no={3} data-capa="motto" className="v3-spot-satir">
                  {motto}
                </li>
              </ul>
            </MetinBandi>
            <DuvarYazisi
              etiket="Arka duvarda yazanlar"
              satirlar={[
                bulusmalar.title,
                <span key="en" lang="en" data-onay="en">
                  Youth Meetings
                </span>,
                `${facts.meetings}+ gençlik buluşması`,
                `son ${facts.meetingsYears} yılda`,
                solenAdi,
                `${facts.solenDate} · ${facts.solenPlace}`,
                `${tr(facts.solenAttendees)}+ genç`,
                motto,
                stant.hashtag,
              ]}
            />
            <AzaltPoster D={d} alt={alt} />
          </Bolum>
        );
      case "duvar-2":
        // d7 — Sen de söz ver (sol duvar; alt krem bant; spot yok, dinlenme 5 s).
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={stant.kiosk.cagri} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem">
              <p className="v3-baslik" aria-hidden="true">
                {stant.kiosk.cagri}
              </p>
              <En>Make your pledge too.</En>
              <p className="v3-govde">{genclikKollari.subtitle}</p>
            </MetinBandi>
            <DuvarYazisi
              etiket="Sol duvarda yazanlar"
              satirlar={[`${tr(uye.value ?? 0)}${uye.suffix ?? ""} ${uye.label}`, ilIlce, `İki ekranda: ${stant.kiosk.cagri}`]}
            />
            <AzaltPoster D={d} alt={alt} />
          </Bolum>
        );
      case "fidan-kok":
        // d8 — Kökler: Biz Kimiz? + 81 İl · 922 İlçe (§14.4.1 K8) + bizKimiz.paragraphs[0]. 81 halka sahnede (FidanKatmani).
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={`Kökler: ${bizKimiz.title}`} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem" className="v3-bant-fidan">
              <Cip>Kökler</Cip>
              <p className="v3-baslik" aria-hidden="true">
                {bizKimiz.title}
              </p>
              <p className="v3-alt-satir">{ilIlce}</p>
              <p className="v3-govde">{bizKimiz.paragraphs[0]}</p>
            </MetinBandi>
            <AzaltPoster D={d} alt={alt} ust={<KokHalkalari D={d} statik />} />
          </Bolum>
        );
      case "fidan-govde":
        // d9 — Gövde: vizyon başlığı; boğum etiketleri sahnede (2017 / TBMM), okunur kopyası burada (reduced'da görünür).
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={`Gövde: ${vizyon.title}`} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem" className="v3-bant-fidan">
              <Cip>Gövde</Cip>
              <p className="v3-baslik" aria-hidden="true">
                {vizyon.title}
              </p>
              <ul className="v3-bogum-liste" aria-label="Gövdedeki iki boğum">
                {bogumMetinleri().map((b) => (
                  <li key={b.taraf}>
                    <span className="v3-bogum-liste-ad">{b.ad}</span> {b.satir}
                  </li>
                ))}
              </ul>
            </MetinBandi>
            <AzaltPoster D={d} alt={alt} />
          </Bolum>
        );
      case "fidan-dal":
        // d10 — Dallar: Gençlik Buluşmaları + paragraphs[3]'ün ilk cümlesi (birebir) + 4 polaroid (dal uçlarında).
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={`Dallar: ${bulusmalar.title}`} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem" className="v3-bant-fidan">
              <Cip>Dallar</Cip>
              <p className="v3-baslik" aria-hidden="true">
                {bulusmalar.title}
              </p>
              <p className="v3-govde">{ilkCumle(bulusmalar.paragraphs[3])}</p>
            </MetinBandi>
            <Polaroidler D={d} k={k} />
            <AzaltPoster D={d} alt={alt} />
          </Bolum>
        );
      case "fidan-yaprak":
        // d11 — Yapraklar: İklim Eylemleri (d6'dan taşındı, §14.4.1 K7) + 3 satır; lc döngüsü (yaprak titremesi).
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={`Yapraklar: ${iklim.title}`} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem" className="v3-bant-fidan">
              <Cip>Yapraklar</Cip>
              <p className="v3-baslik" aria-hidden="true">
                {iklim.title}
              </p>
              <En>Climate Action</En>
              <ul className="v3-iklim-satirlari" aria-label={iklim.title}>
                {iklim.items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </MetinBandi>
            <AzaltPoster D={d} alt={alt} />
          </Bolum>
        );
      case "dunya-2":
        // d12 — Ortak evimiz (W-2 §14.7; E turundaki d11): fidandan Dünya'ya uzaklaşmanın vardığı durak. Üst bant el yazısı
        // slogan (broşür kapağı `cover.slogan`) + En; d1'in ışık yayları tersten (Antalya'dan dünyaya; DunyaYaylari, CSS
        // `data-sira="2"`), varış halkası yok. Reduced düzende (`?azalt=1`) p1 + statik yaylar.
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={cover.slogan} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="ust" tema="uzay">
              <p className="v3-slogan font-script" aria-hidden="true">
                {cover.slogan}
              </p>
              <En>Our planet is our common home</En>
            </MetinBandi>
            <AzaltPoster D={d} alt={alt} ust={<YaylarStatik D={dunya} />} />
          </Bolum>
        );
      default:
        // Tabloda bu bileşenin bilmediği bir rol/sıra: boş durak (adımlama sayısı tutsun).
        return <Bolum key={k} k={k} rol={d.rol} baslik={d.id} alt={alt} />;
    }
  };

  return (
    <VideoSahne
      manifest={istemciManifesti(m)}
      etiketler={
        <>
          <SahneEtiketleri duraklar={D} />
          {/* Fidan sahne katmanı (aria-hidden sahnede): d8 81 halka, d9 boğum etiketleri. */}
          <div className="v3-fidan">
            <KokHalkalari D={D[fKok]} />
            <BogumEtiketleri D={D[fGovde]} k={fGovde} />
          </div>
        </>
      }
    >
      {D.map(bolum)}
      <IcindenKapanis atiflar={ATIFLAR} brosur={<DijitalBrosur className="ic-kapanis-brosur" />} />
    </VideoSahne>
  );
}
