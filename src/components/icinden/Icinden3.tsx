import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { DIL_ETIKET, DILLER, yol, type Dil } from "@/lib/dil";
import { logos } from "@/lib/photos";
import Cop31Logo from "./Cop31Logo";
import { YaylarStatik, YayTanimlari } from "./DunyaYaylari";
import { EmanetStatik } from "./EmanetIsiklari";
import { BogumEtiketleri, KokHalkalari, Polaroidler } from "./FidanKatmani";
import IcindenKapanis from "./IcindenKapanis";
import { dilManifesti, istemciManifesti, klipler, type Durak } from "./klipler";
import MetinBandi from "./MetinBandi";
import { bolgeAdi, etiketMetni, METIN, type DuvarSatiri, type IcindenMetin, type Parcali } from "./metin";
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
 * İki dil (7 Kasım 2026; /icinden İngilizce, /tr/icinden Türkçe): bütün metinler sözlükten (metin.ts `METIN[dil]`; TR değerleri
 * content.ts / stant.ts'ten türetilir). Her bant yalnız seçilen dilde. Dil seçici (DilSecici) her aşamada: d0 şeridinde, sağ
 * üst sabit kümede (kadraj okuması · dil · "Dijital broşür →"; d1–d12) ve kapanışta; geçişte durak korunur (VideoSahne,
 * sessionStorage "icinden-donus").
 *
 * Bölümler manifestin rol tablosundan (`klipler.json` `duraklar[].rol`, sıra = durak no; E turu §12.4-1): her durak
 * rolüne göre (ve aynı rolün kaçıncısı olduğuna göre: duvar 1/2) çizilir; numaralar sabit değil.
 *
 * Her durak bir `<section class="v3-durak">` (100svh, görünmez çapa); içinde sr-only başlık ve sahnenin
 * alt metni (R3 kartları (e); hareketli düzende ekran okuyucu için), metin bandı (fixed) ve reduced-motion
 * düzeninin posteri (`.v3-azalt`; hareketli düzende `display: none`, lazy: inmez). Duvara basılan her yazının
 * akışta sr-only eşi vardır (§12.4-4; İngilizcede çevirisi).
 *
 * G turu (§14.4.6) + W-3 (§14.7 C; kullanıcı: "duvarlardan sonra broşürü hiç göstermeyelim, direkt fidana"): duvarlardan
 * (d6–d7) sonra doğrudan render edilmiş fidan: d8 kökler, d9 gövde, d10 dallar, d11 yapraklar. W-2 (§14.7): tur Dünya'da biter —
 * d11'den stant tepeden → Antalya → Türkiye → Dünya'ya uzaklaşma (r43 → r32 → r21 zinciri), d12 "Gezegenimiz Ortak Evimizdir"
 * (üst bant el yazısı, d1 yayları tersten). Fidan bantları altta (y ≥ %68), krem, /fidan `leaf-tag` çipiyle. DOM katmanı
 * FidanKatmani.tsx'te.
 *
 * Parti içeriği d1–d3'te yok; stant içi ve fidan (d4–d11) serbest (§12, §14.0). Logo kuralı: resmî logo yalnız beyaz
 * zeminde, bütün hâlinde söner (d0 bandı); lombar deliği ancak logo söndükten sonra açılır (VideoSahne).
 */

// Kapanış atıfları ve Sentinel yılları (`SENTINEL_YILLARI`, eski `ATIFLAR`) metin.ts'te (`kapanis.atiflar`, iki dil).

/** Tarih aralığı satır sonunda bölünmesin ("9–" / "20 Kasım"). */
const Tarih = ({ children }: { children: ReactNode }) => <span className="v3-nowrap">{children}</span>;
/** Tarihli metin: `on` + bölünmez tarih + `son`. */
const TarihliMetin = ({ p }: { p: Parcali }) => (
  <>
    {p.on}
    <Tarih>{p.tarih}</Tarih>
    {p.son}
  </>
);

/**
 * Dijital broşür bağlantısı (§14.4.6: d0 üst şeridi ve kapanış; 7 Kasım: d1'den kapanışa dek sağ üstte sabit düğme, müşteri
 * isteği "her aşamada broşüre erişim"). Dile göre /brosur ya da /tr/brosur. Kiosk'ta gizli (stant ekranı döngüden çıkmasın).
 * Ön getirme yok (`prefetch={false}`): d0 şeridindeki bağlantı açılışta görünür, broşürün RSC yükü ve stil dosyası her
 * oturumda inip mobil bütçeye (§14.4.1, ≤ 12,0 MB) giriyordu ve Chrome "preload edilip kullanılmadı" uyarısı veriyordu.
 */
export function DijitalBrosur({ dil, className = "" }: { dil: Dil; className?: string }) {
  return (
    <Link href={yol(dil, "/brosur")} prefetch={false} className={`v3-dijital ${className}`}>
      {METIN[dil].brosur} <span aria-hidden="true">→</span>
    </Link>
  );
}

/**
 * Dil seçici (EN | TR): seçili dil yalnız görsel işaret (sayfanın dili zaten o), öteki dil düz bağlantı (kök yerleşimler arası
 * geçiş tam sayfa yüklemesidir; Next Link'in ön getirmesi boşa gider). Erişilebilir ad "TR – Türkçe" (görünen kısa ad başta,
 * WCAG 2.5.3), `lang` + `hrefLang` hedef dilde. VideoSahne: bağlantının sorgusunu bulunulan adresinkiyle eşler (?azalt=1 vb.)
 * ve tıkta durağı "icinden-donus"a yazar (öteki dilde aynı duraktan sürer). Kiosk'ta gizli.
 */
export function DilSecici({ dil, className = "" }: { dil: Dil; className?: string }) {
  return (
    <nav aria-label={METIN[dil].dilSecici} className={`v3-dil ${className}`}>
      {DILLER.map((d) =>
        d === dil ? (
          <span key={d} aria-hidden="true" data-secili="" className="v3-dil-oge">
            {DIL_ETIKET[d].kisa}
          </span>
        ) : (
          <a key={d} href={yol(d, "/icinden")} hrefLang={d} lang={d} data-v3-dil={d} aria-label={`${DIL_ETIKET[d].kisa} – ${DIL_ETIKET[d].ad}`} className="v3-dil-oge">
            {DIL_ETIKET[d].kisa}
          </a>
        ),
      )}
    </nav>
  );
}

/**
 * Reduced-motion düzeninin posteri (video yok): yön `<picture>` ile; lazy. LQIP yok (G turu: 12 poster × satır içi base64
 * HTML'de ve RSC yükünde iki kez ~9 kB'tı; HTML gz hedefi ≤ 56 kB): yer tutucu CSS'te düz koyu zemin.
 */
function AzaltPoster({ D, M, alt, etiketli = false, ust }: { D: Durak; M: IcindenMetin; alt: string; etiketli?: boolean; ust?: ReactNode }) {
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
              {etiketMetni(M, t)}
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
function DuvarYazisi({ etiket, satirlar }: { etiket: string; satirlar: readonly DuvarSatiri[] }) {
  return (
    <ul className="sr-only" aria-label={etiket}>
      {satirlar.map((s, i) => (
        <li key={i} lang={s.lang}>
          {s.metin}
        </li>
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

export default function Icinden3({ dil }: { dil: Dil }) {
  const M = METIN[dil];
  // Dile göre çözülmüş manifest (klipler.ts dilManifesti): İngilizce sayfa d4–d7'de İngilizce yazılı klipleri/posterleri alır.
  const m = dilManifesti(klipler, dil);
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

  // Fidan durakları (rol.ts FIDAN_ROLLERI sırasıyla): sahne katmanı kök ve gövdeninkini kullanır.
  const [fKok, fGovde] = I.fidanlar;
  // İstemci manifesti: durağın sabit okuması (`okumaDurak`, manifestte Türkçe) dile göre sunucuda çevrilir; kodlama çıktısı
  // (klipler.json) değişmez.
  const im = istemciManifesti(m);
  const manifest = { ...im, duraklar: im.duraklar.map((d) => (d.okumaDurak ? { ...d, okumaDurak: M.sahne.okumaDurak[d.okumaDurak] ?? d.okumaDurak } : d)) };

  /** Durak k'nın bölümü: rolü ve aynı rolün kaçıncısı olduğu (duvar 1/2). */
  const bolum = (d: Durak, k: number): ReactNode => {
    const sira = D.slice(0, k).filter((x) => x.rol === d.rol).length;
    const anahtar = sira ? `${d.rol}-${sira + 1}` : d.rol;
    const alt = M.alt[anahtar] ?? "";
    switch (anahtar) {
      case "lombar": {
        // d0 — Açılış: resmî logo beyaz zeminde; AK Gençlik kimliği ayrı üst şeritte; sağda dil seçici + "Dijital broşür →".
        const T = M.lombar;
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={T.baslik} alt={alt} h1>
            <div data-d={k} data-rol={d.rol} className="v3-bant v3-acilis" style={logoStil}>
              <div className="v3-serit">
                <Link href="/" hrefLang={dil === "tr" ? undefined : "tr"} className="v3-geri">
                  <span aria-hidden="true">←</span> {T.geri}
                </Link>
                <div className="v3-kimlik">
                  <Image
                    src={logos.genclikKollari.src}
                    width={logos.genclikKollari.width}
                    height={logos.genclikKollari.height}
                    alt={T.kimlikLogo}
                    sizes="40px"
                    preload
                    className="v3-kimlik-logo"
                  />
                  <p>
                    <span className="v3-kimlik-ad">{T.kimlikAd}</span>
                    <span className="v3-kimlik-alt">{T.kimlikAlt}</span>
                  </p>
                </div>
                <div className="v3-serit-sag">
                  <DilSecici dil={dil} className="v3-dil-serit" />
                  <DijitalBrosur dil={dil} className="v3-dijital-serit" />
                </div>
              </div>
              <div className="v3-logo">
                <Cop31Logo title={alt} />
              </div>
              {/* Logo zaten "COP31 Türkiye Antalya" diyor: altında yalnız yeni bilgi (tarih, yer). */}
              <p className="v3-logo-alti">
                <TarihliMetin p={T.logoAlti} />
              </p>
              <div className="v3-ipucu">
                <p>{T.ipucu}</p>
              </div>
            </div>
          </Bolum>
        );
      }
      case "dunya": {
        // d1 — Dünya (üst bant, uzay scrim). Yaylar ve künye W2a (DunyaYaylari, SahneEtiketleri kunye).
        const kunye = d.etiketler?.dikey.find((t) => t.tur === "kunye");
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={M.dunya.baslik} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="ust" tema="uzay">
              <p className="v3-baslik" aria-hidden="true">
                {M.dunya.baslik}
              </p>
              <p className="v3-govde">
                <TarihliMetin p={M.dunya.govde} />
              </p>
            </MetinBandi>
            <AzaltPoster D={d} M={M} alt={alt} etiketli ust={<YaylarStatik D={d} kunye={kunye && etiketMetni(M, kunye)} dil={dil} />} />
            {/* Yay yolları ve gradyanları (bir kez; sahne ve reduced posteri <use> ile kullanır). */}
            <YayTanimlari D={d} />
          </Bolum>
        );
      }
      case "emanet":
        // d2 — Türkiye (§12.4-3): alt bant (gece #0B1A2E; yatayda sol altta). Emanet ışıkları ve bağlar W2a.
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={M.emanet.srBaslik} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="gece">
              <p className="v3-baslik" aria-hidden="true">
                {M.emanet.baslik}
              </p>
              <p className="v3-govde">{M.emanet.govde}</p>
            </MetinBandi>
            <AzaltPoster D={d} M={M} alt={alt} ust={<EmanetStatik D={d} />} />
          </Bolum>
        );
      case "expo":
        // d3 — Antalya Expo (alt bant). Haritadaki yapı etiketi OSM adıyla (ONAY).
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={M.expo.baslik} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="altin">
              <p className="v3-baslik" aria-hidden="true">
                {M.expo.baslik}
              </p>
              <p className="v3-alt-satir">{M.expo.altSatir}</p>
            </MetinBandi>
            <AzaltPoster D={d} M={M} alt={alt} etiketli />
          </Bolum>
        );
      case "anatomi": {
        // d4 — Stant anatomisi (üst bant, hol scrim) + etkin bölgenin kısa satırı alt bantta. Gövde cümlesi d2'de.
        const T = M.anatomi;
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={T.srBaslik} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="ust" tema="hol">
              <p className="v3-baslik" aria-hidden="true">
                {T.baslik}
              </p>
              <p className="v3-etiket-satir">{T.etiketSatir}</p>
            </MetinBandi>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="hol" className="v3-bant-ince v3-bant-ek">
              <ul className="v3-spot-satirlari" aria-label={T.bolgeEtiket}>
                {T.bolgeler.map((b) => (
                  <li key={b.no} data-no={b.no} className="v3-spot-satir">
                    <span className="v3-spot-ad">{bolgeAdi(b.ad)}</span> {b.kisa}
                  </li>
                ))}
              </ul>
            </MetinBandi>
            {/* Ön cephe giriş pankartı (S2-E cephe-on, §12.3; stant.ts pankartlar birebir; İngilizcede çevirisi). */}
            <DuvarYazisi etiket={T.pankartEtiket} satirlar={T.pankart} />
            <AzaltPoster D={d} M={M} alt={alt} etiketli />
          </Bolum>
        );
      }
      case "sutunlar": {
        // d5 — Buradasın / Bugün (alt bant, krem scrim) + etkin sütun satırı (4,5 s)
        const T = M.sutunlar;
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={T.srBaslik} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem">
              <p className="v3-baslik" aria-hidden="true">
                {T.baslik}
              </p>
              <ol className="v3-sutun-satirlari" aria-label={T.sutunEtiket}>
                {T.sutunlar.map((a) => (
                  <li key={a.no} data-no={a.no} className="v3-sutun-satir">
                    <span className="v3-sutun-no">{String(a.no).padStart(2, "0")}</span> {a.ad}, {a.il}. {a.donem}.{" "}
                    <span className="v3-sutun-cumle">{a.emanet}</span>
                  </li>
                ))}
              </ol>
            </MetinBandi>
            <AzaltPoster D={d} M={M} alt={alt} />
          </Bolum>
        );
      }
      case "duvar": {
        // d6 — Gençlik Buluşmaları · Bir Gençlik Şöleni (arka duvar, G7 §14.4.4; fotoğrafsız). Alt krem bant; 3 spot satırı
        // 600 + 3 × 3.500 ms; etkin satırdan p6 çapasına (bulusma, solen, motto; `data-capa`) kılavuz — VideoSahne,
        // manifest ozel.duvarCapalari (yoksa çizilmez).
        const T = M.duvar;
        const [bulusma, solen, motto] = T.satirlar;
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={T.srBaslik} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem">
              <p className="v3-baslik" aria-hidden="true">
                {T.baslik}
              </p>
              <ul className="v3-spot-satirlari v3-duvar-satirlari" aria-label={T.baslik}>
                <li data-no={1} data-capa="bulusma" className="v3-spot-satir">
                  {bulusma}
                </li>
                <li data-no={2} data-capa="solen" className="v3-spot-satir">
                  <TarihliMetin p={solen} />
                </li>
                <li data-no={3} data-capa="motto" className="v3-spot-satir">
                  {motto}
                </li>
              </ul>
            </MetinBandi>
            <DuvarYazisi etiket={T.duvarEtiket} satirlar={T.duvar} />
            <AzaltPoster D={d} M={M} alt={alt} />
          </Bolum>
        );
      }
      case "duvar-2":
        // d7 — Sen de söz ver (sol duvar; alt krem bant; spot yok, dinlenme 5 s).
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={M.duvar2.baslik} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem">
              <p className="v3-baslik" aria-hidden="true">
                {M.duvar2.baslik}
              </p>
              <p className="v3-govde">{M.duvar2.govde}</p>
            </MetinBandi>
            <DuvarYazisi etiket={M.duvar2.duvarEtiket} satirlar={M.duvar2.duvar} />
            <AzaltPoster D={d} M={M} alt={alt} />
          </Bolum>
        );
      case "fidan-kok": {
        // d8 — Kökler: Biz Kimiz? + 81 İl · 922 İlçe (§14.4.1 K8) + ilk paragraf. 81 halka sahnede (FidanKatmani).
        const T = M.fidanKok;
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={T.srBaslik} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem" className="v3-bant-fidan">
              <Cip>{T.cip}</Cip>
              <p className="v3-baslik" aria-hidden="true">
                {T.baslik}
              </p>
              <p className="v3-alt-satir">{T.altSatir}</p>
              <p className="v3-govde">{T.govde}</p>
            </MetinBandi>
            <AzaltPoster D={d} M={M} alt={alt} ust={<KokHalkalari D={d} statik />} />
          </Bolum>
        );
      }
      case "fidan-govde": {
        // d9 — Gövde: vizyon başlığı; boğum etiketleri sahnede (2017 / TBMM), okunur kopyası burada (reduced'da görünür).
        const T = M.fidanGovde;
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={T.srBaslik} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem" className="v3-bant-fidan">
              <Cip>{T.cip}</Cip>
              <p className="v3-baslik" aria-hidden="true">
                {T.baslik}
              </p>
              <ul className="v3-bogum-liste" aria-label={T.bogumEtiket}>
                {T.bogumlar.map((b) => (
                  <li key={b.taraf}>
                    <span className="v3-bogum-liste-ad">{b.ad}</span> {b.satir}
                  </li>
                ))}
              </ul>
            </MetinBandi>
            <AzaltPoster D={d} M={M} alt={alt} />
          </Bolum>
        );
      }
      case "fidan-dal": {
        // d10 — Dallar: Gençlik Buluşmaları + tek cümle (TR content.ts birebir, EN broşür) + 4 polaroid (dal uçlarında).
        const T = M.fidanDal;
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={T.srBaslik} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem" className="v3-bant-fidan">
              <Cip>{T.cip}</Cip>
              <p className="v3-baslik" aria-hidden="true">
                {T.baslik}
              </p>
              <p className="v3-govde">{T.govde}</p>
            </MetinBandi>
            <Polaroidler D={d} k={k} M={M} />
            <AzaltPoster D={d} M={M} alt={alt} />
          </Bolum>
        );
      }
      case "fidan-yaprak": {
        // d11 — Yapraklar: İklim Eylemleri (d6'dan taşındı, §14.4.1 K7) + 3 satır; lc döngüsü (yaprak titremesi).
        const T = M.fidanYaprak;
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={T.srBaslik} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="alt" tema="krem" className="v3-bant-fidan">
              <Cip>{T.cip}</Cip>
              <p className="v3-baslik" aria-hidden="true">
                {T.baslik}
              </p>
              <ul className="v3-iklim-satirlari" aria-label={T.baslik}>
                {T.satirlar.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </MetinBandi>
            <AzaltPoster D={d} M={M} alt={alt} />
          </Bolum>
        );
      }
      case "dunya-2":
        // d12 — Ortak evimiz (W-2 §14.7; E turundaki d11): fidandan Dünya'ya uzaklaşmanın vardığı durak. Üst bant el yazısı
        // slogan; d1'in ışık yayları tersten (Antalya'dan dünyaya; DunyaYaylari, CSS `data-sira="2"`), varış halkası yok.
        // Reduced düzende (`?azalt=1`) p1 + statik yaylar.
        return (
          <Bolum key={k} k={k} rol={d.rol} baslik={M.dunya2.slogan} alt={alt}>
            <MetinBandi d={k} rol={d.rol} konum="ust" tema="uzay">
              <p className="v3-slogan font-script" aria-hidden="true">
                {M.dunya2.slogan}
              </p>
            </MetinBandi>
            <AzaltPoster D={d} M={M} alt={alt} ust={<YaylarStatik D={dunya} dil={dil} />} />
          </Bolum>
        );
      default:
        // Tabloda bu bileşenin bilmediği bir rol/sıra: boş durak (adımlama sayısı tutsun).
        return <Bolum key={k} k={k} rol={d.rol} baslik={d.id} alt={alt} />;
    }
  };

  return (
    <VideoSahne
      manifest={manifest}
      dil={dil}
      etiketler={
        <>
          <SahneEtiketleri duraklar={D} dil={dil} />
          {/* Fidan sahne katmanı (aria-hidden sahnede): d8 81 halka, d9 boğum etiketleri. */}
          <div className="v3-fidan">
            <KokHalkalari D={D[fKok]} />
            <BogumEtiketleri D={D[fGovde]} k={fGovde} M={M} />
          </div>
        </>
      }
      ust={
        <>
          {/* Her aşamada dil ve broşüre doğrudan erişim (sağ üst; d0'da şeritteki eşleri görünür, kiosk'ta gizli). */}
          <DilSecici dil={dil} className="v3-dil-sabit" />
          <DijitalBrosur dil={dil} className="v3-brosur-sabit" />
        </>
      }
    >
      {D.map(bolum)}
      <IcindenKapanis dil={dil} brosur={<DijitalBrosur dil={dil} className="ic-kapanis-brosur" />} dilSecici={<DilSecici dil={dil} className="ic-kapanis-dil" />} />
    </VideoSahne>
  );
}
