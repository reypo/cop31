import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cop31, cover } from "@/lib/content";
import { emanetAlanlari } from "@/lib/emanet";
import { logos } from "@/lib/photos";
import { stant } from "@/lib/stant";
import Brosur, { BrosurKarti, BrosurMetni } from "./Brosur";
import Cop31Logo from "./Cop31Logo";
import IcindenKapanis from "./IcindenKapanis";
import { istemciManifesti, klipler, type Durak } from "./klipler";
import MetinBandi, { En } from "./MetinBandi";
import SahneEtiketleri from "./SahneEtiketleri";
import VideoSahne from "./VideoSahne";
import "./icinden.css";
import "./icinden3.css";

/**
 * /icinden v3 "sinematik" (docs/brief-icinden-3.md §9): 11 durak (d0–d10) + kapanış. Sunucu bileşeni:
 * bütün metin, etiket ve logo HTML'de; istemci yalnız VideoSahne (oynatıcı + adımlama) ve Brosur (v2).
 *
 * Her durak bir `<section class="v3-durak">` (100svh, görünmez çapa); içinde sr-only başlık ve sahnenin
 * alt metni (R3 kartları (e); hareketli düzende ekran okuyucu için), metin bandı (fixed) ve reduced-motion
 * düzeninin posteri (`.v3-azalt`; hareketli düzende `display: none`, lazy: inmez).
 *
 * Parti içeriği yalnız broşürde (d ≥ 6). Logo kuralı: resmî logo yalnız beyaz zeminde, bütün hâlinde
 * söner (d0 bandı); lombar deliği ancak logo söndükten sonra açılır (VideoSahne).
 */

const tr = (n: number) => n.toLocaleString("tr-TR");

/**
 * Kapanış atıfları (§9.6; R1 §3 metni birebir). ONAY: onay-listesi §14. İngilizce kısım `lang="en"` ile
 * (ekran okuyucu Türkçe fonetikle okumasın, WCAG 3.1.2); metin birleşince yine birebir aynı.
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
] as const;

/** Tarih aralığı satır sonunda bölünmesin ("9–" / "20 Kasım"). */
const Tarih = ({ children }: { children: ReactNode }) => <span className="v3-nowrap">{children}</span>;

/** Sahnelerin alt metinleri (R3 kartları (e), §9.1 numarasıyla; C turunda son render posterlerine göre düzeltildi). */
const ALT: Record<number, string> = {
  0: "Beyaz zemin üzerinde resmî COP31 Türkiye Antalya logosu: lale ve ebru desenli, mavi-yeşil bir dünya diski.",
  1: "Uzaydan Dünya. Avrupa, Akdeniz ve Kuzey Afrika gündüz ışığında; gece sınırı Hazar Denizi ve İran üzerinden geçiyor, doğuda şehir ışıkları yanıyor. Antalya diskin ortasının hemen üstünde.",
  2: "Yüksekten Doğu Akdeniz: üstte Anadolu kıyısı, ortanın sağında Kıbrıs, solda Girit, altta Nil deltası. Antalya kıyıda işaretli.",
  3: "Öğleden sonra güneşine karşı Antalya: önde seraların ve tarlaların arasından geçen D400 ile Aksu ovası, ortada Antalya Expo Center'ın holleri, geride kent, güneşte parlayan körfez ve Beydağları.",
  4: "Karanlık fuar holünde, ışığın altında standımız yukarıdan: ortada 12 sütunlu Emanet Rotundası ve '12.000 Yıllık Emanet' bandı, solda 'Oyna – Sen olsan ne yapardın?' alanı ve turuncu 'Gel, oyna!' pankartı, sağda amfi.",
  5: "Rotundanın içinden yere bakış: renkli dönem halkasının ortasında 'Buradasın, Bugün' yazıyor; çevrede 12 miras sütununun alt uçları.",
  6: "Karşılama bankosunda duran broşür: 'COP31'de AK Gençlik' kapağı, yaprakların arasında Dünya fotoğrafı ve lacivert dairede 'Gezegenimiz Ortak Evimizdir'.",
  10: "Uzaydan Dünya, açılıştaki gibi. Üstünde el yazısıyla: Gezegenimiz Ortak Evimizdir.",
};

/** Reduced-motion düzeninin posteri (video yok): yön `<picture>` ile; LQIP arka planda; lazy. */
function AzaltPoster({ D, k, etiketli = false }: { D: Durak; k: number; etiketli?: boolean }) {
  const p = D.poster;
  if (!p?.dikey) return null;
  const e = etiketli ? D.etiketler : undefined;
  return (
    <figure className="v3-azalt">
      <picture>
        {p.yatay ? <source media="(min-aspect-ratio: 4/3)" srcSet={p.yatay.dosya} type="image/webp" /> : null}
        {/* render posteri: önceden boyutlu WebP, next/image gerekmez */}
        <img
          src={p.dikey.dosya}
          alt={ALT[k] ?? ""}
          width={720}
          height={1280}
          loading="lazy"
          decoding="async"
          style={{ backgroundImage: `url("${p.dikey.lqip}")` }}
        />
      </picture>
      {e ? (
        <div aria-hidden="true" className="v3-azalt-etiketler">
          {e.dikey.map((t) => (
            <span key={t.ad} className={`v3-azalt-et v3-et-${t.tur}`} style={{ left: `${(t.x / 720) * 100}%`, top: `${(t.y / 1280) * 100}%` } as CSSProperties}>
              {t.metin}
            </span>
          ))}
        </div>
      ) : null}
    </figure>
  );
}

function Bolum({ k, baslik, h1 = false, alt = true, children }: { k: number; baslik: string; h1?: boolean; alt?: boolean; children?: ReactNode }) {
  const H = h1 ? "h1" : "h2";
  return (
    <section data-d={k} id={`d${k}`} aria-labelledby={`v3-b${k}`} className="v3-durak">
      <H id={`v3-b${k}`} className="sr-only">
        {baslik}
      </H>
      {alt && ALT[k] ? <p className="ic-yalniz-hareket">{ALT[k]}</p> : null}
      {children}
    </section>
  );
}

export default function Icinden3() {
  const m = klipler;
  const D = m.duraklar;
  const sayilar = `${tr(1000000)}'u aşkın genç üye, 81 il, 922 ilçe.`;
  const dunyaC = D[1].ozel?.dunyaC;
  const r0 = D[1].ozel?.dunyaR?.[0] ?? 115;
  // Logo yerleşimi video uzayında (amblem = T01'in 0. karesindeki disk), CSS'te cover dönüşümüyle.
  const logoStil = {
    "--ax-d": dunyaC?.dikey[0] ?? 360,
    "--ay-d": dunyaC?.dikey[1] ?? 512,
    "--ax-y": dunyaC?.yatay[0] ?? 640,
    "--ay-y": dunyaC?.yatay[1] ?? 232,
    "--ar": r0,
  } as CSSProperties;
  return (
    <VideoSahne manifest={istemciManifesti(m)} etiketler={<SahneEtiketleri duraklar={D} />} brosur={<Brosur />}>
      {/* d0 — Açılış: resmî logo beyaz zeminde; AK Gençlik kimliği ayrı üst şeritte. */}
      <Bolum k={0} baslik="COP31'in İçinden" h1>
        <div data-d={0} className="v3-bant v3-acilis" style={logoStil}>
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
            <Cop31Logo title={ALT[0]} />
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

      {/* d1 — Dünya (üst bant, uzay scrim) */}
      <Bolum k={1} baslik="Dünya Antalya'da buluşuyor">
        <MetinBandi d={1} konum="ust" tema="uzay">
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
        <AzaltPoster D={D[1]} k={1} etiketli />
      </Bolum>

      {/* d2 — Akdeniz: nefes durağı, yalnız sahne etiketleri + kadraj okuması */}
      <Bolum k={2} baslik="Akdeniz">
        <AzaltPoster D={D[2]} k={2} etiketli />
      </Bolum>

      {/*
        d3 — Antalya Expo (alt bant). Tarih d0 ve d1'de var; burada yer bilgisi. Mekân adı metinde `cop31.venue`
        (sitenin her yerinde aynı); haritadaki yapı etiketi OSM adıyla "Antalya Expo Center" (ONAY: resmî ad).
      */}
      <Bolum k={3} baslik={cop31.venue}>
        <MetinBandi d={3} konum="alt" tema="altin">
          <p className="v3-baslik" aria-hidden="true">
            {cop31.venue}
          </p>
          <p className="v3-alt-satir">Aksu&apos;da; kent merkezine 12 km, havalimanına 5 km.</p>
          <En>12 km from the city centre, 5 km from the airport</En>
        </MetinBandi>
        <AzaltPoster D={D[3]} k={3} etiketli />
      </Bolum>

      {/* d4 — Stant anatomisi (üst bant, hol scrim) + etkin bölgenin kısa satırı alt bantta */}
      <Bolum k={4} baslik={`Standımız: ${stant.tema}`}>
        <MetinBandi d={4} konum="ust" tema="hol">
          <p className="v3-baslik" aria-hidden="true">
            {stant.tema}
          </p>
          <En>{stant.temaEn}</En>
          <p className="v3-govde">{stant.girisMetni[1]}</p>
          <p className="v3-etiket-satir">{stant.hashtag}</p>
        </MetinBandi>
        <MetinBandi d={4} konum="alt" tema="hol" className="v3-bant-ince v3-bant-ek">
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
        <AzaltPoster D={D[4]} k={4} etiketli />
      </Bolum>

      {/* d5 — Buradasın / Bugün (alt bant, krem scrim) + etkin sütun satırı (4,5 s) */}
      <Bolum k={5} baslik={`Buradasın, bugün. ${stant.slogan}`}>
        <MetinBandi d={5} konum="alt" tema="krem">
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
        <AzaltPoster D={D[5]} k={5} />
      </Bolum>

      {/* d6 — Broşür kapağı (alt bant %12, krem; yatayda sağda: broşür sol %62'de, broşürsüz banko plakasının üstünde) */}
      <Bolum k={6} baslik={`Standdan alabileceğin broşür: ${cover.title}`}>
        <MetinBandi d={6} konum="alt" tema="krem" className="v3-bant-ince">
          <p className="v3-satir-baslik" aria-hidden="true">
            Standdan alabileceğin broşür
          </p>
          <En>The brochure you can pick up at our stand</En>
          <p className="v3-sayilar">{sayilar}</p>
        </MetinBandi>
        <BrosurMetni sayfa="kapak" />
        <BrosurKarti sayfa="kapak" />
      </Bolum>

      {/* d7–d9 — Broşür sayfaları (DOM, v2): metin broşürün içinde; akışta sr-only kopya */}
      <Bolum k={7} baslik="Gençlik Buluşmaları ve Bir Gençlik Şöleni" alt={false}>
        <BrosurMetni sayfa="bulusma" />
        <BrosurKarti sayfa="bulusma" />
      </Bolum>
      <Bolum k={8} baslik="İklim eylemleri" alt={false}>
        <BrosurMetni sayfa="iklim" />
        <BrosurKarti sayfa="iklim" />
      </Bolum>
      <Bolum k={9} baslik="Arka kapak: Başkan'ın mesajı" alt={false}>
        <BrosurMetni sayfa="arka" />
        <BrosurKarti sayfa="arka" />
      </Bolum>

      {/* d10 — Ortak evimiz (üst bant: el yazısı slogan) */}
      <Bolum k={10} baslik={cover.slogan}>
        <MetinBandi d={10} konum="ust" tema="uzay">
          <p className="v3-slogan font-script" aria-hidden="true">
            {cover.slogan}
          </p>
          <En>Our planet is our common home</En>
        </MetinBandi>
        <AzaltPoster D={D[10]} k={10} />
      </Bolum>

      <IcindenKapanis atiflar={ATIFLAR} />
    </VideoSahne>
  );
}
