import Image from "next/image";
import { backCover, cop31, cover, socials } from "@/lib/content";
import { logos } from "@/lib/photos";
import { stant } from "@/lib/stant";

/** Atıf satırı: isteğe bağlı Türkçe önek + metin; İngilizce metin `lang="en"` ile (birleşik metin birebir). */
export type Atif = { readonly on?: string; readonly metin: string; readonly en?: boolean };

/**
 * Kapanış (akış, snap'siz; docs/brief-icinden.md §1 son satır): logolar, "AK Parti Gençlik
 * Kolları Türkiye", sosyal hesaplar, akgenclik.org.tr, #YaniBanaEmanet, slogan ve atıf satırları
 * (v3: brief-icinden-3 §9.6 — Sentinel, Copernicus DEM, NASA, GEBCO, OSM, resmî COP31 logosu). Sahnenin
 * üstüne beyaz bir sayfa gibi kayarak gelir. İzin verilen linkler yalnızca sosyal hesaplar ve site.
 * Alıntı broşürün arka kapağıyla aynı tipografik tırnakla (“…”); meta satırlar orta noktasız, cümle.
 */
export default function IcindenKapanis({ atiflar }: { atiflar: readonly Atif[] }) {
  const sosyal = socials.filter((s) => s.name !== "Web");
  const web = socials.find((s) => s.name === "Web");

  return (
    <footer className="ic-kapanis">
      <div className="ic-kapanis-ic">
        <div className="ic-kapanis-logolar">
          <Image
            src={logos.akParti.src}
            alt={logos.akParti.alt}
            width={logos.akParti.width}
            height={logos.akParti.height}
            sizes="56px"
            className="ic-kapanis-logo"
          />
          <span aria-hidden="true" className="ic-kapanis-ayrac" />
          <Image
            src={logos.genclikKollari.src}
            alt={logos.genclikKollari.alt}
            width={logos.genclikKollari.width}
            height={logos.genclikKollari.height}
            sizes="64px"
            className="ic-kapanis-logo"
          />
        </div>

        <p className="ic-kapanis-kurum">{cover.org}</p>
        <p className="ic-kapanis-alinti">
          {"“"}
          {backCover.quote.replace(/^"|"$/g, "")}
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

        <p className="ic-kapanis-etiket ic-serif">
          {stant.tema}. {stant.hashtag}
        </p>
        <p className="ic-kapanis-slogan font-script">{cover.slogan}</p>
        <p className="ic-kapanis-etkinlik">
          {backCover.line1}: <span className="v3-nowrap">{cop31.dates}</span>, {cop31.venue}.
        </p>

        {/* ONAY: atıf satırlarının yeri ve metni (docs/onay-listesi.md §14). OSM bağlantısı izinli linkler dışında: yalnızca metin. */}
        {/* v3 (sinematik): veri atıfları brief-icinden-3 §9.6 / varliklar-icinden.md §3 metniyle (ONAY). */}
        <ul className="ic-kapanis-atif v3-atiflar">
          {atiflar.map((a) => (
            <li key={a.metin}>
              {a.on ? `${a.on} ` : null}
              {a.en ? <span lang="en">{a.metin}</span> : a.metin}
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
