import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cop31, cover, stats } from "@/lib/content";
import { logos } from "@/lib/photos";
import { stant } from "@/lib/stant";
import Brosur, { BrosurKarti, BrosurMetni } from "./Brosur";
import Cop31Logo from "./Cop31Logo";
import { BOLUM_SVH } from "./derinlik";
import {
  BolgeKatmani,
  ExpoKatmani,
  KentKatmani,
  KorfezKatmani,
  SalonKatmani,
  SiluetKatmani,
} from "./HaritaKatmani";
import IcindenKapanis from "./IcindenKapanis";
import IcindenSahne from "./IcindenSahne";
import Katman from "./Katman";
import { KureKatmani } from "./KureKatmani";
import { DurakMetni, En, Panel } from "./Panel";
import RotundaKatmani from "./RotundaKatmani";
import StantKatmani from "./StantKatmani";
import SutunYuzleri, { AktifSutun, SutunListesi } from "./SutunYuzleri";
import "./icinden.css";

const tr = (n: number) => n.toLocaleString("tr-TR");

/** Bölüm yüksekliği (svh) motorun tablosundan: tek kaynak derinlik.ts BOLUM_SVH. */
const yukseklik = (k: number) => ({ "--ic-bolum": BOLUM_SVH[k] }) as CSSProperties;

function Bolum({ k, baslik, children, acilis = false }: { k: number; baslik: string; children?: ReactNode; acilis?: boolean }) {
  return (
    <section data-durak={k} aria-labelledby={`ic-durak-${k}`} className="ic-bolum" style={yukseklik(k)}>
      {k === 0 ? (
        <h1 id={`ic-durak-${k}`} className="sr-only">
          {baslik}
        </h1>
      ) : (
        <h2 id={`ic-durak-${k}`} className="sr-only">
          {baslik}
        </h2>
      )}
      <div className={`ic-ekran${acilis ? " ic-ekran-acilis" : ""}`}>{children}</div>
    </section>
  );
}

/**
 * Sahnenin katman içerikleri (sunucu bileşenleri; istemci olanlar: küre fotoğrafı, sütun kadranı,
 * broşür). Harita, logo, stant ve rotunda verisi böylece istemci JS paketine girmez, yalnızca HTML'de
 * taşınır (K2: ~32 kB gz kaynak veri). IcindenSahne katman kabuklarını KATMANLAR sırasıyla kurar ve
 * her id'nin children'ını kabuğun içine koyar. Bileşen olarak değil işlev olarak çağrılır: sahne, prop'ta
 * doğrudan <Katman id> elemanlarını (Fragment) görür.
 */
function sahneKatmanlari() {
  return (
    <>
      <Katman id="logo">
        <div className="ics-logo">
          <Cop31Logo />
        </div>
      </Katman>
      <Katman id="kure">
        <KureKatmani />
      </Katman>
      <Katman id="siluet">
        <SiluetKatmani />
      </Katman>
      <Katman id="bolge">
        <BolgeKatmani />
      </Katman>
      <Katman id="korfez">
        <KorfezKatmani />
      </Katman>
      <Katman id="kent">
        <KentKatmani />
      </Katman>
      <Katman id="expo">
        <ExpoKatmani />
      </Katman>
      <Katman id="salon">
        <SalonKatmani />
      </Katman>
      <Katman id="stant">
        <StantKatmani />
      </Katman>
      <Katman id="rotunda">
        <RotundaKatmani>
          <SutunYuzleri />
        </RotundaKatmani>
      </Katman>
      <Katman id="brosur">
        <Brosur />
      </Katman>
      <Katman id="kure2">
        <KureKatmani ikinci />
      </Katman>
    </>
  );
}

/**
 * /icinden akışı (docs/brief-icinden.md §1): 10 `<section data-durak="k">` (k = 0…9) + kapanış.
 * Bölüm yükseklikleri k → k+1 geçişinin süresidir (BOLUM_SVH, 100svh katları); B'nin motoru
 * offsetTop'larından d'yi hesaplar. Her bölümde sr-only başlık.
 *
 * Metinler (§1 "Metin" sütunu): ayrı panel (kart) yalnızca d1 ve d4. d2, d3, d5 satırları kartsız ve
 * NESNENİN ÜSTÜNDE/YANINDA: d2 haritanın alt kenarında, d3 planın üst kenarında, d5 kapağın hemen altında
 * (konumlar icinden.css .ic-yer-*, kamera geometrisinden). Hareketli düzende hepsi sabit katman ve yalnızca
 * opaklıkları d'ye bağlı (platoda tam opak); reduced-motion'da bölümün ilk ekranının altında akışta.
 *
 * Erişilebilirlik: sahne katmanları görseldir (broşür ve kadran aria-hidden). Hareketli düzende de
 * ekran okuyucu her durağın metnini akışta bulur: d4'te 12 sütunun listesi ve d5–d8'de broşür sayfalarının
 * metni sr-only (BrosurMetni); reduced-motion'da aynı içerik görünür kartlarda.
 *
 * Parti içeriği (Cumhurbaşkanı fotoğrafları, 2017, TBMM, AK Parti logosu) yalnızca broşürde (d ≥ 5).
 */
export default function IcindenIcerik() {
  const sayilar = stats.filter((s) => s.value !== undefined);

  return (
    <IcindenSahne katmanlar={sahneKatmanlari()}>
      {/* 0 — Açılış: resmî COP31 logosu (sahnede tek başına); AK Gençlik kimliği ayrı üst şeritte. */}
      <Bolum k={0} baslik="COP31'in İçinden" acilis>
        <DurakMetni durak={0} pencere={[-1, -1, 0.06, 0.24]} yer="ic-yer-ust" className="ic-dm-link">
          <div className="ic-serit">
            <Link href="/" className="ic-geri">
              <span aria-hidden="true">←</span> Konseptler
            </Link>
            <div className="ic-kimlik">
              <Image
                src={logos.genclikKollari.src}
                width={logos.genclikKollari.width}
                height={logos.genclikKollari.height}
                alt={logos.genclikKollari.alt}
                sizes="40px"
                preload
                className="ic-kimlik-logo"
              />
              <p>
                <span className="ic-kimlik-ad">AK Parti Gençlik Kolları</span>
                <span className="ic-kimlik-alt">COP31 Antalya standı</span>
              </p>
            </div>
          </div>
        </DurakMetni>
        <span aria-hidden="true" className="ic-bosluk" />
        <DurakMetni durak={0} pencere={[-1, -1, 0.06, 0.24]} yer="ic-yer-logo-alti">
          <p className="ic-notr">
            COP31 Türkiye · {cop31.city} · {cop31.dates}
          </p>
        </DurakMetni>
        <DurakMetni durak={0} pencere={[-1, -1, 0.04, 0.18]} yer="ic-yer-ipucu">
          <p className="ic-ipucu">Aşağı kaydır</p>
          <En>Scroll down</En>
        </DurakMetni>
      </Bolum>

      {/* 1 — Dünya */}
      <Bolum k={1} baslik="Dünya Antalya'da buluşuyor">
        <Panel
          durak={1}
          etiket={`COP31 · ${cop31.city} · ${cop31.dates}`}
          baslik="Dünya Antalya'da buluşuyor"
          en="The world meets in Antalya"
        >
          {/* ~150.000 ziyaretçi: docs/brief.md §1 (content.ts'te yok; ONAY, onay-listesi §14). */}
          <p className="ic-govde">
            BM İklim Konferansı COP31, {cop31.dates} tarihlerinde {cop31.venue}&apos;da. Yaklaşık 150.000 yabancı
            ziyaretçi bekleniyor; standımız da orada.
          </p>
        </Panel>
      </Bolum>

      {/* 2 — Antalya Expo: satır haritanın alt kenarında, kartsız (harita etiketleri B'nin haritasında) */}
      <Bolum k={2} baslik="Antalya Expo Center, Aksu">
        <DurakMetni durak={2} yer="ic-yer-harita">
          <div className="ic-yazi ic-yazi-harita">
            <p className="ic-satir-baslik">Antalya Expo Center · Aksu · {cop31.dates}</p>
            <En>Antalya Expo Center · Aksu · 9–20 November 2026</En>
            {/* ONAY: "Salon · Stant" satırı salon/stant no gelene kadar hiç gösterilmez. */}
          </div>
        </DurakMetni>
      </Bolum>

      {/* 3 — Stant: başlık planın üst kenarında (bölge adları planın üstünde, B) */}
      <Bolum k={3} baslik={`Standımız: ${stant.tema}`}>
        {/* Çıkış kısa (3,12 → 3,22): yatayda plan sağa doğru büyür, sağ sütundaki satır plan etiketine binmesin. */}
        <DurakMetni durak={3} pencere={[2.68, 2.88, 3.12, 3.22]} yer="ic-yer-plan-ustu">
          <div className="ic-yazi">
            <p className="ic-stant-baslik ic-serif">Standımız · {stant.tema}</p>
            <En>{`Our stand · ${stant.temaEn}`}</En>
            {/* "#YaniBanaEmanet · GençİKlim" satırı planın altında (StantKatmani), burada tekrar edilmez. */}
          </div>
        </DurakMetni>
      </Bolum>

      {/* 4 — Buradasın · Bugün: rotunda, 12 sütun yüzü (katmanda), panel */}
      <Bolum k={4} baslik={`Buradasın, bugün: ${stant.slogan} 12 sütun, 12 emanet`}>
        <Panel durak={4} etiket={`${stant.tema} · 12 sütun`} baslik={stant.slogan} en="Climate, nature and zero waste are our heritage.">
          <AktifSutun />
        </Panel>
        {/* 12 sütunun okunur listesi: reduced-motion'da görünür, hareketli düzende sr-only (ekran okuyucu). */}
        <div className="ic-yalniz-azalt">
          <SutunListesi />
        </div>
      </Bolum>

      {/* 5 — Broşür kapağı (kapak katmanda): satır kapağın hemen altında, kartsız */}
      <Bolum k={5} baslik={`Standdan alabileceğin broşür: ${cover.title}`}>
        <DurakMetni durak={5} yer="ic-yer-kapak-alti">
          <div className="ic-yazi">
            <p className="ic-satir-baslik">Standdan alabileceğin broşür</p>
            <En>The brochure you can pick up at our stand</En>
            <p className="ic-sayilar">
              {sayilar.map((s, i) => (
                <span key={s.label}>
                  {i > 0 ? " · " : ""}
                  {tr(s.value ?? 0)}
                  {s.suffix ?? ""} {s.label === "Genç Üye" ? "genç üye" : s.label.toLocaleLowerCase("tr-TR")}
                </span>
              ))}
            </p>
          </div>
        </DurakMetni>
        <BrosurMetni sayfa="kapak" />
      </Bolum>

      {/* 6–8 — Broşür sayfaları: metin katmanda (görsel); akışta sr-only kopya, reduced-motion'da kart */}
      <Bolum k={6} baslik="Gençlik Buluşmaları ve Bir Gençlik Şöleni">
        <BrosurKarti sayfa="bulusma" />
        <BrosurMetni sayfa="bulusma" />
      </Bolum>
      <Bolum k={7} baslik="İklim eylemleri">
        <BrosurKarti sayfa="iklim" />
        <BrosurMetni sayfa="iklim" />
      </Bolum>
      <Bolum k={8} baslik="Arka kapak: Başkan'ın mesajı">
        <BrosurKarti sayfa="arka" />
        <BrosurMetni sayfa="arka" />
      </Bolum>

      {/*
        9 — Ortak evimiz: arka kapaktaki küre dairesinden açık cobe küresine. Slogan, arka kapağın
        yazıları ve slogan diski söndükten SONRA belirir (Brosur ARKA_SONUM_D 8,45–8,72; iki slogan üst
        üste binmesin). Reduced-motion'da gizli: slogan kapanışta zaten var.
      */}
      <Bolum k={9} baslik={cover.slogan}>
        <DurakMetni durak={9} pencere={[8.74, 8.88, 9.12, 9.32]} yer="ic-yer-kure-alti" className="ic-azaltta-yok">
          <p aria-hidden="true" className="ic-d9-slogan font-script">
            {cover.slogan}
          </p>
          <En>Our planet is our common home</En>
        </DurakMetni>
      </Bolum>

      <IcindenKapanis />
    </IcindenSahne>
  );
}
