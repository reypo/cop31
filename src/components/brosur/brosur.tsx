/**
 * Dijital Broşür (/brosur): basılı COP31 broşürünün (Kasım 2026, 26 sayfa) web uyarlaması. Bölümler dikey akar
 * (snap yok; uzun bölümler telefonda ekrandan uzun), İçindekiler bağlantıları çapalara yumuşak kayar.
 * Damion (el yazısı vurgular, 13 kB alt küme) yalnız bu rotada yüklenir; Montserrat kök yerleşimden gelir.
 */

import localFont from "next/font/local";
import { ArkaKapak, Dinleyen, Dunyayla, Eserler, Icindekiler, Iklim, Kapak, Kapanis, KararMasasi, Liderlik, Mesaj, Sayilarla, Solen, Taahhutler, TurkiyeTanim, Uniak } from "./bolumler";
import { GeriBaglanti } from "./geri";
import { BrosurShell } from "./shell";
import "./brosur.css";

const damion = localFont({
  src: "../../app/fonts/Damion.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-el",
  display: "swap",
  adjustFontFallback: "Arial",
});

/** İlerleme fidanındaki yaprak sayısı: kapak hariç bölümler. */
const YAPRAK = 14;

export function Brosur() {
  return (
    <BrosurShell leafCount={YAPRAK} className={damion.variable}>
      <GeriBaglanti className="bro-geri-sabit" />
      <TurkiyeTanim />
      <main className="bro">
        <Kapak />
        <Icindekiler />
        <Mesaj />
        <Sayilarla />
        <KararMasasi />
        <Iklim />
        <Liderlik />
        <Uniak />
        <Dinleyen />
        <Solen />
        <Eserler />
        <Dunyayla />
        <Taahhutler />
        <Kapanis />
        <ArkaKapak geri={<GeriBaglanti className="bro-geri-alt" />} />
      </main>
    </BrosurShell>
  );
}
