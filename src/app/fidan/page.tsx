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
 * Bölüm bölüm kaydırma. 7 bölüm: Tohum, Kökler, Gövde, Dallar, Yapraklar,
 * Orman + slogan, Kapanış. Her biri bir <section data-fidan-snap>, en az
 * 100svh (desteklemeyen tarayıcıda 100vh), scroll-snap-align: start.
 *
 * Hareket serbestse: native snap kapalı (html.fidan-step), adımlamayı
 * FidanStory/stepper.ts yapar: her tekerlek/parmak/klavye hareketi bir
 * sonraki bölüme ~1 sn'lik easeInOut bir geçiş başlatır; fidanın büyümesi ve
 * kamera bu geçişte oynar, bölümde durunca ağaç o aşamanın tam halindedir.
 * Dokunmada native kaydırma `touch-action: pinch-zoom` ile kapalı (yakınlaştırma
 * açık); sayfa yakınlaştırılınca sınıf kalkar, native kaydırma geri gelir.
 * Hareket azaltılmışsa: adımlama yok, snap da yok (serbest native kaydırma);
 * fidan son karede, kartlar normal akışta. `y proximity` denendi ve ölçüldü:
 * Chrome yakınlık aralığı viewport'un 1/3'ü, bölümler tam 1 viewport; tek
 * tekerlek tıkı (100–250 px) ve yavaş parmak sürüklemesi (120–200 px) bölüm
 * başına geri çekiliyordu, sayfa tekerlekle ilerlemiyordu.
 *
 * Mobil: fidan sahnesi üstte sticky (100svh); metin katmanı sahnenin üstüne
 * bindirilir. Kart bölümün altında; sticky değil, konumu ve sönmesi kaydırmanın
 * fonksiyonu (FidanStory). Kart penceresi en fazla 50svh; taşan içerik
 * kısaltılmaz, bölüme --ovf kadar yükseklik eklenir ve bölümde dururken içerik
 * bu aralıkta (bölüm içi serbest kaydırma) pencerede akar.
 *
 * Kısa ekranlı telefonlarda (≤740px) kart tipografisi sıkılaşır, taşma azalır.
 * Orman bölümünde (slogan) kartın arkasında tam genişlikte, üstü yumuşak beyaz
 * bir zemin var: kökler sloganın arkasında kalmaz, beyaza sönerek kaybolur.
 *
 * Masaüstü (≥768): iki sütun; fidan solda sticky, kartlar sağda, her bölüm
 * 100svh ve dikey ortalı.
 */
const FIDAN_CSS = `
[data-fidan-snap]{scroll-snap-align:start}
html.fidan-step{scroll-snap-type:none}
html.fidan-step,html.fidan-step body{touch-action:pinch-zoom;overscroll-behavior-y:none}
.fidan-stage{height:100vh;height:100svh}
.fidan-overlay{margin-top:-100vh;margin-top:-100svh}
.fidan-hero,.fidan-closing{min-height:100vh;min-height:100svh}
.fidan-sec{min-height:calc(100vh + var(--ovf,0px));min-height:calc(100svh + var(--ovf,0px))}
.fidan-hint{bottom:calc(max(1rem,env(safe-area-inset-bottom)) + 1rem)}
.fidan-card{max-height:50vh;max-height:50svh}
.fidan-win{overflow:hidden}
.fidan-win[data-ovf=top]{-webkit-mask-image:linear-gradient(#000 calc(100% - 30px),transparent);mask-image:linear-gradient(#000 calc(100% - 30px),transparent)}
.fidan-win[data-ovf=mid]{-webkit-mask-image:linear-gradient(transparent,#000 22px,#000 calc(100% - 30px),transparent);mask-image:linear-gradient(transparent,#000 22px,#000 calc(100% - 30px),transparent)}
.fidan-win[data-ovf=end]{-webkit-mask-image:linear-gradient(transparent,#000 22px);mask-image:linear-gradient(transparent,#000 22px)}
.fidan-final{max-height:none;isolation:isolate}
.fidan-final::before{content:"";position:absolute;z-index:-1;top:-64px;right:-16px;bottom:calc(-1*max(1rem,env(safe-area-inset-bottom)));left:-16px;background:linear-gradient(rgb(255 255 255/0),rgb(255 255 255/.97) 64px)}
@media (max-width:767px) and (prefers-reduced-motion:no-preference){.fidan-card,.fidan-hero-card{will-change:transform,opacity}}
@media (max-width:767px) and (max-height:740px){
.fidan-flow{padding:12px 16px 12px}
.fidan-body{font-size:13.5px;line-height:1.46}
.fidan-item{margin-top:10px}
.fidan-trio{margin-top:12px;padding-inline:4%}
.fidan-h2{font-size:1.32rem}
}
@media (min-width:768px){
.fidan-overlay{margin-top:0}
.fidan-sec{min-height:100vh;min-height:100svh}
.fidan-card{max-height:none}
.fidan-win{overflow:visible}
.fidan-final::before{display:none}
}
@media (prefers-reduced-motion:reduce){
.fidan-card{max-height:none;background:#fff}
.fidan-win{overflow:visible;-webkit-mask-image:none;mask-image:none}
.fidan-final{background:#fff;border-radius:20px;box-shadow:0 14px 34px -16px rgb(27 79 156/.45)}
.fidan-final::before{display:none}
}
`;

export default function FidanPage() {
  return (
    <main className="relative bg-white">
      <style href="fidan-layout" precedence="default">
        {FIDAN_CSS}
      </style>
      <BackLink />
      <FidanStory after={<Closing />}>
        <StorySections />
      </FidanStory>
    </main>
  );
}
