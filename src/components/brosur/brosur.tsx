/**
 * Dijital Broşür (/brosur İngilizce, /tr/brosur Türkçe): müşterinin basılı broşür PDF'inin (26 sayfa A4, 7 Kasım 2026)
 * birebir sayfa görüntüleriyle 3B sayfa çeviren görüntüleyici. Sayfa içinde öğe animasyonu, bindirme, yazı yok; sayfa
 * kutusu her ekranda PDF oranında. Görüntüler: scripts/brosur/uret.mjs → public/brosur/<dil>/, manifest sayfalar.ts;
 * sayfa metinleri (Metin paneli, ekran okuyucu): metin.ts (müşterinin görüntüleyicisindeki PAGES).
 *
 * Açılış betiği (sunucu çıktısında, görüntüleyiciden hemen sonra; docs: preventing-flash-before-hydration): React
 * hidrasyonundan önce adresteki #p=N'yi, kipi (tek/yayılım) ve sayfa kutusu × DPR'ye göre görüntü boyutunu seçip görünen
 * sayfaların src'sini yazar — dil değişiminde (#p=N ile tam yükleme) kapak boşuna inmez ve yanıp sönmez. AVIF desteği
 * 1×1 sınama görüntüsüyle (birkaç ms); yoksa 1240 px WebP. kitap.ts aynı seçimi yapar, aynı adresleri yeniden yazmaz.
 */
import type { Metadata } from "next";
import { type Dil, yol } from "@/lib/dil";
import { paylasimGorseli } from "@/lib/paylasim";
import { AVIF_SINAMA, CIFT_SORGU, ESIK_1240, ESIK_800, YAZI } from "./arayuz";
import { Goruntuleyici } from "./goruntuleyici";
import { METIN } from "./metin";
import { ICINDEKILER, OZET, PDF, SAYFA_SAYISI } from "./sayfalar";
import "./brosur.css";

const ACIKLAMA: Record<Dil, string> = {
  en: "AK Party Youth Branches COP31 brochure – 1 Million Youth, One Common Home (26 pages)",
  tr: "AK Parti Gençlik Kolları COP31 broşürü – 1 Milyon Genç, Tek Ortak Ev (26 sayfa)",
};

export function brosurMetadata(dil: Dil): Metadata {
  const baslik = `${dil === "en" ? "Digital Brochure" : "Dijital Broşür"} — ${YAZI[dil].baslik}`;
  const gorsel = paylasimGorseli(dil);
  return {
    title: baslik,
    description: ACIKLAMA[dil],
    alternates: {
      canonical: yol(dil, "/brosur"),
      languages: { en: yol("en", "/brosur"), tr: yol("tr", "/brosur"), "x-default": yol("en", "/brosur") },
    },
    // Metadata sığ birleşir: openGraph verilmezse önizleme sitenin genel başlığını gösterir.
    openGraph: {
      title: baslik,
      description: ACIKLAMA[dil],
      url: yol(dil, "/brosur"),
      siteName: dil === "en" ? "AK Party Youth Branches" : "AK Parti Gençlik Kolları",
      locale: dil === "en" ? "en_US" : "tr_TR",
      alternateLocale: [dil === "en" ? "tr_TR" : "en_US"],
      type: "website",
      images: [gorsel],
    },
    twitter: { card: "summary_large_image", title: baslik, description: ACIKLAMA[dil], images: [gorsel] },
  };
}

/** Hidrasyondan önce çalışan küçük betik (ES5; ~1,1 kB). Mantığı kitap.ts / arayuz.ts ile aynı. */
function acilisBetigi(dil: Dil): string {
  const D = { d: dil, h: OZET[dil], n: SAYFA_SAYISI, q: CIFT_SORGU, e1: ESIK_800, e2: ESIK_1240, a: AVIF_SINAMA };
  const govde = `var k=document.querySelector("[data-kitap]");if(!k||k.getAttribute("data-ilk"))return;
var m=/^#p=(\\d+)$/.exec(location.hash),p=m?Math.min(D.n,Math.max(1,+m[1])):1,c=matchMedia(D.q).matches,sol=null,sag=p;
if(c){if(p<=1){sag=1}else{sol=p-p%2;sag=sol+1<=D.n?sol+1:null}}
k.setAttribute("data-sol",sol?""+sol:"");k.setAttribute("data-sag",sag?""+sag:"");
var t=sol&&sag?sol+"\\u2013"+sag:""+(sol||sag),s=document.querySelectorAll("[data-sayac]");for(var i=0;i<s.length;i++)s[i].textContent=t;
var g=k.querySelector('[data-yuva="sag"]').offsetWidth*(window.devicePixelRatio||1),w=g<=D.e1?800:g<=D.e2?1240:2480;
function koy(f){if(k.getAttribute("data-ilk"))return;var y=[["sol",c?sol:null],["sag",sag]];for(var j=0;j<2;j++){var n=y[j][1];if(!n)continue;
var b=k.querySelector('[data-yuva="'+y[j][0]+'"]');b.querySelector(".bro-taban").src="/brosur/"+D.d+"/p"+(n<10?"0":"")+n+"-"+(f==="webp"?1240:w)+"."+D.h[n-1]+"."+f;b.setAttribute("data-p",""+n)}
k.setAttribute("data-ilk",p+" "+w+" "+f)}
var v=new Image();v.onload=function(){koy(v.naturalWidth>0?"avif":"webp")};v.onerror=function(){koy("webp")};v.src=D.a;`;
  return `(function(D){try{${govde.replace(/\n/g, "")}}catch(e){}})(${JSON.stringify(D).replace(/</g, "\\u003c")})`;
}

export function Brosur({ dil }: { dil: Dil }) {
  return (
    <>
      <Goruntuleyici dil={dil} metin={METIN[dil]} ozet={OZET[dil]} icindekiler={ICINDEKILER[dil]} pdf={PDF[dil]} />
      <script dangerouslySetInnerHTML={{ __html: acilisBetigi(dil) }} />
    </>
  );
}
