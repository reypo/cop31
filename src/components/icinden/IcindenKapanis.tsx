import Image from "next/image";
import type { ReactNode } from "react";
import { socials } from "@/lib/content";
import type { Dil } from "@/lib/dil";
import { logos } from "@/lib/photos";
import { METIN } from "./metin";

/**
 * Kapanış (akış, snap'siz; docs/brief-icinden.md §1 son satır): logolar, "AK Parti Gençlik
 * Kolları Türkiye", sosyal hesaplar, akgenclik.org.tr, hashtag (stant.hashtag: #YarınBanaEmanet), slogan, "Dijital broşür" düğmesi (G turu §14.4.6,
 * slogan altı; `brosur`) ve dil seçici (`dil`, 7 Kasım: her aşamada) ve atıf satırları (v3: brief-icinden-3 §9.6 —
 * Sentinel, Copernicus DEM, NASA, GEBCO, OSM, resmî COP31 logosu; G turu: "Stant ve fidan görünümü temsilîdir."). Sahnenin
 * üstüne beyaz bir sayfa gibi kayarak gelir. İzin verilen linkler sosyal hesaplar, site, /brosur ve öteki dildeki /icinden.
 * Alıntı broşürün arka kapağıyla aynı tipografik tırnakla (“…”); meta satırlar orta noktasız, cümle. Metinler dile göre
 * (metin.ts `kapanis`); Türkçe sayfada İngilizce kalan lisans metinleri `lang="en"` (WCAG 3.1.2; birleşik metin birebir).
 */
export default function IcindenKapanis({
  dil,
  brosur,
  dilSecici,
}: {
  dil: Dil;
  brosur?: ReactNode;
  dilSecici?: ReactNode;
}) {
  const M = METIN[dil].kapanis;
  const sosyal = socials.filter((s) => s.name !== "Web");
  const web = socials.find((s) => s.name === "Web");

  return (
    <footer className="ic-kapanis">
      <div className="ic-kapanis-ic">
        <div className="ic-kapanis-logolar">
          <Image
            src={logos.akParti.src}
            alt={M.logoAkParti}
            width={logos.akParti.width}
            height={logos.akParti.height}
            sizes="56px"
            className="ic-kapanis-logo"
          />
          <span aria-hidden="true" className="ic-kapanis-ayrac" />
          <Image
            src={logos.genclikKollari.src}
            alt={M.logoGenclik}
            width={logos.genclikKollari.width}
            height={logos.genclikKollari.height}
            sizes="64px"
            className="ic-kapanis-logo"
          />
        </div>

        <p className="ic-kapanis-kurum">{M.kurum}</p>
        <p className="ic-kapanis-alinti">
          {"“"}
          {M.alinti}
          {"”"}
        </p>

        <ul className="ic-kapanis-sosyal">
          {sosyal.map((s) => (
            <li key={s.name}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                <span className="ic-kapanis-ag">{s.name}</span>
                <span className="ic-kapanis-hesap">{s.label}</span>
              </a>
            </li>
          ))}
        </ul>
        {web ? (
          <a href={web.href} target="_blank" rel="noopener noreferrer" className="ic-kapanis-web">
            {web.label}
          </a>
        ) : null}

        <p className="ic-kapanis-etiket ic-serif">{M.etiket}</p>
        <p className="ic-kapanis-slogan font-script">{M.slogan}</p>
        {brosur || dilSecici ? (
          <div className="ic-kapanis-brosur-satir">
            {brosur}
            {dilSecici}
          </div>
        ) : null}
        <p className="ic-kapanis-etkinlik">
          {M.etkinlik.on}
          <span className="v3-nowrap">{M.etkinlik.tarih}</span>
          {M.etkinlik.son}
        </p>

        {/* ONAY: atıf satırlarının yeri ve metni (docs/onay-listesi.md §14). OSM bağlantısı izinli linkler dışında: yalnızca metin. */}
        {/* v3 (sinematik): veri atıfları brief-icinden-3 §9.6 / varliklar-icinden.md §3 metniyle (ONAY). */}
        <ul className="ic-kapanis-atif v3-atiflar">
          {M.atiflar.map((a) => (
            <li key={a.metin}>
              {a.on ? `${a.on} ` : null}
              {a.en && dil !== "en" ? <span lang="en">{a.metin}</span> : a.metin}
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
