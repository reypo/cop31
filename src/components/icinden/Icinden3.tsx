import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cop31, cover, facts, genclikKollari, iklim, stats } from "@/lib/content";
import { emanetAlanlari } from "@/lib/emanet";
import { logos } from "@/lib/photos";
import { stant } from "@/lib/stant";
import { brosurPages } from "@/components/brosur/data";
import Brosur, { BrosurKarti, BrosurMetni, type HayaletBasliklari } from "./Brosur";
import Cop31Logo from "./Cop31Logo";
import { YaylarStatik, YayTanimlari } from "./DunyaYaylari";
import { EmanetStatik } from "./EmanetIsiklari";
import IcindenKapanis from "./IcindenKapanis";
import { istemciManifesti, klipler, type Durak } from "./klipler";
import MetinBandi, { En } from "./MetinBandi";
import { brosurDizini, dizinler, type Rol } from "./rol";
import SahneEtiketleri from "./SahneEtiketleri";
import VideoSahne from "./VideoSahne";
import "./icinden.css";
import "./icinden3.css";
import "./icinden3-isik.css";

/**
 * /icinden v3 "sinematik" (docs/brief-icinden-3.md §9, §12): 12 durak (d0–d11) + kapanış. Sunucu bileşeni:
 * bütün metin, etiket ve logo HTML'de; istemci yalnız VideoSahne (oynatıcı + adımlama) ve Brosur.
 *
 * Bölümler manifestin rol tablosundan (`klipler.json` `duraklar[].rol`, sıra = durak no; E turu §12.4-1): her durak
 * rolüne göre (ve aynı rolün kaçıncısı olduğuna göre: duvar 1/2, dunya 1/2) çizilir; numaralar sabit değil.
 *
 * Her durak bir `<section class="v3-durak">` (100svh, görünmez çapa); içinde sr-only başlık ve sahnenin
 * alt metni (R3 kartları (e); hareketli düzende ekran okuyucu için), metin bandı (fixed) ve reduced-motion
 * düzeninin posteri (`.v3-azalt`; hareketli düzende `display: none`, lazy: inmez). Duvara basılan her yazının
 * akışta sr-only eşi vardır (§12.4-4).
 *
 * Parti içeriği d1–d3 ve d11'de yok; stant içi (d4–d10) serbest (§12, E turu). Logo kuralı: resmî logo yalnız beyaz
 * zeminde, bütün hâlinde söner (d0 bandı); lombar deliği ancak logo söndükten sonra açılır (VideoSahne).
 */

const tr = (n: number) => n.toLocaleString("tr-TR");

/**
 * Kapanış atıfları (§9.6; R1 §3 metni birebir). ONAY: onay-listesi §14. İngilizce kısım `lang="en"` ile
 * (ekran okuyucu Türkçe fonetikle okumasın, WCAG 3.1.2); metin birleşince yine birebir aynı. "Stant görünümü
 * temsilîdir." (§12.4-7): duvar baskıları müşteri teyidine kadar (onay-listesi §14.1); teyit gelirse çıkar.
 */
const ATIFLAR = [
  { on: "Uydu görüntüsü:", metin: "Contains modified Copernicus Sentinel data 2025.", en: true },
  {
    on: "Yükseklik:",
    metin:
      "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.",
    en: true,
  },
  { metin: "Dünya: NASA Earth Observatory (Blue Marble, Black Marble), GEBCO." },
  { metin: "Harita verisi © OpenStreetMap katkıda bulunanlar." },
  { metin: "COP31 Türkiye logosu etkinliğe atıf amacıyla kullanılmıştır." },
  { metin: "Stant görünümü temsilîdir." },
] as const;

/** Tarih aralığı satır sonunda bölünmesin ("9–" / "20 Kasım"). */
const Tarih = ({ children }: { children: ReactNode }) => <span className="v3-nowrap">{children}</span>;

/**
 * Sahnelerin alt metinleri (R3 kartları (e)), rol anahtarıyla (aynı rolün ikincisi "-2"). C turunda son render
 * posterlerine göre düzeltildi; E turu (emanet, duvar, duvar-2) planlanan render'a göre yazıldı (§12.0, §12.3):
 * S1-E/S2-E posterleri gelince doğrulanacak (D1).
 */
/**
 * Hayalet sayfa başlıklarından content.ts'te karşılığı olmayan ikisi (2 İçindekiler, 4 Başkan'ın Mesajı): /brosur'un
 * sayfa listesinden sunucuda okunur ve Brosur'a prop olarak geçer (denetim D2-04: data.ts istemci paketinde 2,5 kB gz).
 */
const HAYALET_BASLIKLARI: HayaletBasliklari = Object.fromEntries(
  brosurPages.filter((p) => p.n === 2 || p.n === 4).map((p) => [p.n, p.title]),
);

const ALT: Partial<Record<string, string>> = {
  lombar: "Beyaz zemin üzerinde resmî COP31 Türkiye Antalya logosu: lale ve ebru desenli, mavi-yeşil bir dünya diski.",
  dunya: "Uzaydan Dünya. Avrupa, Akdeniz ve Kuzey Afrika gündüz ışığında; gece sınırı Hazar Denizi ve İran üzerinden geçiyor, doğuda şehir ışıkları yanıyor. Antalya diskin ortasının hemen üstünde.",
  emanet: "Yüksekten bütün Türkiye: Anadolu'nun dağları ve kıyıları, çevresinde denizler. Antalya güney kıyısında işaretli; 12 emanet alanı numaralı ışıklarla gösteriliyor.",
  expo: "Öğleden sonra güneşine karşı Antalya: önde seraların ve tarlaların arasından geçen D400 ile Aksu ovası, ortada Antalya Expo Center'ın holleri, geride kent, güneşte parlayan körfez ve Beydağları.",
  // E turu p4 (denetim D3-10): arka duvar ve ön cephe pankartı da görünüyor; metinler content.ts / stant.ts'ten.
  anatomi: `Karanlık fuar holünde, ışığın altında standımız yukarıdan: ortada 12 sütunlu Emanet Rotundası ve '12.000 Yıllık Emanet' bandı, solda 'Oyna – Sen olsan ne yapardın?' alanı ve turuncu 'Gel, oyna!' pankartı, sağda amfi; arkada '${iklim.title}' duvarı, girişte '${stant.pankartlar[1]}' pankartı.`,
  sutunlar: "Rotundanın içinden yere bakış: renkli dönem halkasının ortasında 'Buradasın, Bugün' yazıyor; çevrede 12 miras sütununun alt uçları.",
  duvar: "Standın arka duvarı, çapraz açıdan: krem zemin, altta koyu yeşil dağ silueti; büyük 'İklim Eylemleri' başlığı, solda '300 fidan', sağda Üsküdar Gençlik Kolları Hatıra Ormanı tabelasının fotoğrafı ve 'Genç İklim'.",
  "duvar-2": "Standın sol duvarı: '1.000.000+ Genç Üye' ve '81 İl · 922 İlçe' yazıları, altında iki ekranda 'Sen de söz ver.'; sağ altta bir bank.",
  "brosur-kapak": "Karşılama bankosunda duran broşür: 'COP31'de AK Gençlik' kapağı, yaprakların arasında Dünya fotoğrafı ve lacivert dairede 'Gezegenimiz Ortak Evimizdir'.",
  "dunya-2": "Uzaydan Dünya, açılıştaki gibi. Üstünde el yazısıyla: Gezegenimiz Ortak Evimizdir.",
};

/** Reduced-motion düzeninin posteri (video yok): yön `<picture>` ile; LQIP arka planda; lazy. */
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
          style={{ backgroundImage: `url("${p.dikey.lqip}")` }}
        />
      </picture>
      {/* d1/d2/d11 statik ışık katmanı (W2a, §12.4-8): yaylar, emanet ışıkları, bağlar, künye; halka yok. */}
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
  /** Sahnenin alt metni (hareketli düzende ekran okuyucu için akışta); broşür sayfalarında yok. */
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

  // Duvar metinleri content.ts'ten birebir (S2-E dokuları, §12.3): Genç İklim satırı items[1]'in " — " sınırından.
  const [kamp, kampTarih] = iklim.items[1].split(" — ");
  const gencIklim = kamp.split(":")[0];
  const [uye, il, ilce] = stats;

  /** Durak k'nın bölümü: rolü ve aynı rolün kaçıncısı olduğu (duvar 1/2, dunya 1/2). */
  const bolum = (d: Durak, k: number): ReactNode => {
    const sira = D.slice(0, k).filter((x) => x.rol === d.rol).length;
    const anahtar = sira ? `${d.rol}-${sira + 1}` : d.rol;
    const alt = ALT[anahtar] ?? "";
    switch (anahtar) {
      case "lombar":
        // d0 — Açılış: resmî logo beyaz zeminde; AK Gençlik kimliği ayrı üst şeritte.
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
        // d6 — İklim Eylemleri (arka duvar; alt krem bant; 3 spot satırı 600 + 3 × 3.500 ms; etkin satırdan p6
        // çapasına 1 px kılavuz — VideoSahne, manifest ozel.duvarCapalari).
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={iklim.title} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem">
              <p className="v3-baslik" aria-hidden="true">
                {iklim.title}
              </p>
              <En>Climate Action</En>
              <ul className="v3-spot-satirlari v3-duvar-satirlari" aria-label={iklim.title}>
                {iklim.items.map((x, i) => (
                  <li key={x} data-no={i + 1} className="v3-spot-satir">
                    {x}
                  </li>
                ))}
              </ul>
            </MetinBandi>
            <DuvarYazisi
              etiket="Arka duvarda yazanlar"
              satirlar={[
                iklim.title,
                <span key="en" lang="en" data-onay="en">
                  Climate Action
                </span>,
                `${facts.saplings} fidan`,
                `Hatıra Ormanı · ${facts.saplingsYear}`,
                gencIklim,
                kampTarih,
                iklim.items[2],
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
              satirlar={[
                `${tr(uye.value ?? 0)}${uye.suffix ?? ""} ${uye.label}`,
                `${il.value} ${il.label} · ${ilce.value} ${ilce.label}`,
                `İki ekranda: ${stant.kiosk.cagri}`,
              ]}
            />
            <AzaltPoster D={d} alt={alt} />
          </Bolum>
        );
      case "brosur-kapak":
        // d8 — Broşür kapağı (alt bant %12, krem; yatayda sağda). Sayılar satırı duvara taşındı (§12.4-4).
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={`Standdan alabileceğin broşür: ${cover.title}`} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem" className="v3-bant-ince">
              <p className="v3-satir-baslik" aria-hidden="true">
                Standdan alabileceğin broşür
              </p>
              <En>The brochure you can pick up at our stand</En>
            </MetinBandi>
            <BrosurMetni sayfa="kapak" />
            <BrosurKarti sayfa="kapak" />
          </Bolum>
        );
      case "brosur-sayfa":
        // d9 — Broşür iç sayfası (DOM): metin broşürün içinde; akışta sr-only kopya
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik="Gençlik Buluşmaları ve Bir Gençlik Şöleni">
            <BrosurMetni sayfa="bulusma" />
            <BrosurKarti sayfa="bulusma" />
          </Bolum>
        );
      case "brosur-arka":
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik="Arka kapak: Başkan'ın mesajı">
            <BrosurMetni sayfa="arka" />
            <BrosurKarti sayfa="arka" />
          </Bolum>
        );
      case "dunya-2":
        // d11 — Ortak evimiz (üst bant: el yazısı slogan). Ters yaylar W2a.
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={cover.slogan} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="ust" tema="uzay">
              <p className="v3-slogan font-script" aria-hidden="true">
                {cover.slogan}
              </p>
              <En>Our planet is our common home</En>
            </MetinBandi>
            <AzaltPoster D={d} alt={alt} ust={<YaylarStatik D={D[I.dunya]} />} />
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
      etiketler={<SahneEtiketleri duraklar={D} />}
      brosur={<Brosur dz={brosurDizini(I)} hayaletBasliklari={HAYALET_BASLIKLARI} />}
    >
      {D.map(bolum)}
      <IcindenKapanis atiflar={ATIFLAR} />
    </VideoSahne>
  );
}
