import type { Metadata } from "next";
import BackLink from "@/components/fidan/BackLink";
import Closing from "@/components/fidan/Closing";
import FidanStory from "@/components/fidan/FidanStory";
import StorySections from "@/components/fidan/StorySections";

export const metadata: Metadata = {
  title: "COP31'de AK Gençlik — Bir Fidanın Yolculuğu",
  description: "Kaydırdıkça tek bir fidan kökten taca büyür; her aşama AK Gençlik'in bir bölümü.",
};

/*
 * Yerleşim (svh destekleyen tarayıcıda "küçük viewport"; adres çubuğu açılıp
 * kapanırken zıplamaz, desteklemeyende vh).
 *
 * Mobil: fidan sahnesi üstte sticky; metin katmanı sahnenin üstüne bindirilir.
 * Her bölüm = boşluk (fidan bu sürede büyür) + kart. Kart `sticky; bottom`
 * ile ekranın altında durur ve bir sonraki kart girmeden yerinde söner
 * (FidanStory); hiçbir kart fidanın üstünden yukarı kaymaz. Kart en fazla
 * 46svh; taşan içerik kısaltılmaz, --ovf kadar ek kaydırma payıyla pencerede
 * sayfa kaydırmasıyla aynı hızda akar.
 *
 * Kısa ekranlı telefonlarda (≤740px) kart tipografisi sıkılaşır, taşma azalır.
 * Son bölümde (slogan) kartın arkasında tam genişlikte, üstü yumuşak beyaz bir
 * zemin var: kökler sloganın arkasında kalmaz, beyaza sönerek kaybolur.
 *
 * Masaüstü (≥768): iki sütun; fidan solda sticky, kartlar sağda normal akışta.
 * Hareket azaltılmışsa: kartlar normal akışta, aralarında fidanın son karesi görünür.
 */
const FIDAN_CSS = `
.fidan-stage{height:100vh;height:100svh}
.fidan-overlay{margin-top:-100vh;margin-top:-100svh}
.fidan-hero{height:145vh;height:145svh}
.fidan-hero-card{position:sticky;top:calc(max(0.75rem,env(safe-area-inset-top)) + 2.9rem)}
.fidan-hint{top:calc(100vh - 5.5rem);top:calc(100svh - 5.5rem - env(safe-area-inset-bottom))}
.fidan-spacer{flex:none;height:calc(68vh + var(--ovf,0px));height:calc(68svh + var(--ovf,0px))}
.fidan-card{position:sticky;bottom:max(1rem,env(safe-area-inset-bottom));max-height:46vh;max-height:46svh}
.fidan-win{overflow:hidden}
.fidan-win[data-ovf=top]{-webkit-mask-image:linear-gradient(#000 calc(100% - 30px),transparent);mask-image:linear-gradient(#000 calc(100% - 30px),transparent)}
.fidan-win[data-ovf=mid]{-webkit-mask-image:linear-gradient(transparent,#000 22px,#000 calc(100% - 30px),transparent);mask-image:linear-gradient(transparent,#000 22px,#000 calc(100% - 30px),transparent)}
.fidan-win[data-ovf=end]{-webkit-mask-image:linear-gradient(transparent,#000 22px);mask-image:linear-gradient(transparent,#000 22px)}
.fidan-final{max-height:none;isolation:isolate}
.fidan-final::before{content:"";position:absolute;z-index:-1;top:-64px;right:-16px;bottom:calc(-1*max(1rem,env(safe-area-inset-bottom)));left:-16px;background:linear-gradient(rgb(255 255 255/0),rgb(255 255 255/.97) 64px)}
@media (max-width:767px) and (max-height:740px){
.fidan-flow{padding:12px 16px 12px}
.fidan-body{font-size:13.5px;line-height:1.46}
.fidan-item{margin-top:10px}
.fidan-pair{margin-top:14px;padding-inline:8%}
.fidan-h2{font-size:1.32rem}
}
@media (min-width:768px){
.fidan-overlay{margin-top:0}
.fidan-hero{height:auto}
.fidan-hero-card,.fidan-card{position:relative;top:auto;bottom:auto;max-height:none}
.fidan-spacer{display:none}
.fidan-win{overflow:visible}
.fidan-final::before{display:none}
}
@media (prefers-reduced-motion:reduce){
.fidan-hero{height:auto}
.fidan-hero-card,.fidan-card{position:relative;top:auto;bottom:auto;max-height:none}
.fidan-spacer{height:38vh;height:38svh}
.fidan-hero+.fidan-sec .fidan-spacer{height:62vh;height:62svh}
.fidan-card{background:#fff}
.fidan-win{overflow:visible;-webkit-mask-image:none;mask-image:none}
.fidan-final{background:#fff;border-radius:20px;box-shadow:0 14px 34px -16px rgb(27 79 156/.45)}
.fidan-final::before{display:none}
}
@media (min-width:768px) and (prefers-reduced-motion:reduce){.fidan-spacer{display:none}}
`;

export default function FidanPage() {
  return (
    <main className="relative bg-white">
      <style href="fidan-layout" precedence="default">
        {FIDAN_CSS}
      </style>
      <BackLink />
      <FidanStory>
        <StorySections />
      </FidanStory>
      <Closing />
    </main>
  );
}
