/**
 * Dijital broşür bölümleri (sunucu bileşenleri). Basılı broşürün ("Cop31 Son.pdf", 26 sayfa) sırası ve görsel dili:
 * lacivert / orman yeşili / krem zeminler, Montserrat Black başlıklar, Damion el yazısı vurgular, büyük rakamlar.
 * Metinler icerik.ts'ten. Piktogramlar (kare, nokta, çizgi, fidan ızgaraları) CSS degradesi/maskesidir: bayt ve DOM
 * düğümü yok denecek kadar az. Fotoğraflar next/image (tembel, `sizes` ile ekran boyunda WebP).
 */

import Image, { type StaticImageData } from "next/image";
import type { CSSProperties, ReactNode } from "react";
import Cop31Logo from "@/components/icinden/Cop31Logo";
import { socials } from "@/lib/content";
import { logos } from "@/lib/photos";
import { Counter } from "./counter";
import {
  dinleyen,
  dunyayla,
  eserler,
  iklim,
  icindekiler,
  kapak,
  kapanis,
  kararMasasi,
  kimlik,
  liderlik,
  mesaj,
  sayilarla,
  solen,
  taahhutler,
  uniak,
} from "./icerik";
import { Page } from "./reveal";
import { turkiye } from "./turkiye";
import arkaDunya from "./gorsel/arka-dunya.webp";
import baskan from "./gorsel/baskan.webp";
import bulusmaSamsun from "./gorsel/bulusma-samsun.jpg";
import dinleyenFoto from "./gorsel/dinleyen.jpg";
import ellerFidan from "./gorsel/eller-fidan.jpg";
import fidanDikimi from "./gorsel/fidan-dikimi.jpg";
import icindekiler1 from "./gorsel/icindekiler-1.jpg";
import icindekiler2 from "./gorsel/icindekiler-2.jpg";
import ilkDurak from "./gorsel/ilk-durak.webp";
import kapakDunya from "./gorsel/kapak-dunya.webp";
import kapanisFoto from "./gorsel/kapanis.jpg";
import liderlikFoto from "./gorsel/liderlik.jpg";
import solenFoto from "./gorsel/solen.jpg";
import uniak1 from "./gorsel/uniak-1.jpg";
import uniak2 from "./gorsel/uniak-2.jpg";

/* ============================== küçük parçalar ============================== */

type Tema = "gece" | "orman" | "krem" | "mavi";

function Bolum({ id, tema, className = "", children, etiket }: { id: string; tema: Tema; className?: string; children: ReactNode; etiket: string }) {
  return (
    <Page id={id} aria-label={etiket} className={`bro-bolum bro-${tema} ${className}`}>
      {children}
    </Page>
  );
}

/** "01 | BÖLÜM" etiketi. */
function Kicker({ no }: { no: string }) {
  return (
    <p className="bro-kicker" data-a="up">
      <b>{no}</b>
      <span>BÖLÜM</span>
    </p>
  );
}

const El = ({ children, className = "" }: { children: ReactNode; className?: string }) => <span className={`bro-el ${className}`}>{children}</span>;

/** Büyük rakam + el yazısı birim ("250 bin fidan"). `sayac` verilirse rakam girişte sayılır. */
function Rakam({ sayi, sayac, el, className = "" }: { sayi?: string; sayac?: number; el: string; className?: string }) {
  return (
    <p className={`bro-rakam ${className}`}>
      <span className="bro-rakam-sayi">{sayac !== undefined ? <Counter value={sayac} /> : sayi}</span>
      <El>{el}</El>
    </p>
  );
}

/**
 * Bulanık yer tutucu yok (`placeholder="blur"` her görsel için ~1,2 kB base64 × 2, HTML + RSC: ~37 kB ham); fotoğraf
 * kalıpları CSS'te koyu düz zemin alır.
 */
function Foto({ src, alt, sizes, className = "", oncelik = false }: { src: StaticImageData; alt: string; sizes: string; className?: string; oncelik?: boolean }) {
  return (
    <Image
      src={src}
      alt={alt}
      sizes={sizes}
      className={className}
      {...(oncelik ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
    />
  );
}

/** Piktogram ızgarası: `tur` CSS sınıfı, `x`×`y` hücre (son satır `son` hücreyle kısalabilir). */
function Izgara({ tur, x, y, lejant, className = "" }: { tur: "kare" | "nokta" | "cizgi" | "fidan" | "halka" | "daire"; x: number; y: number; lejant: string; className?: string }) {
  return (
    <figure className={`bro-izgara ${className}`}>
      <span className={`bro-ig bro-ig-${tur}`} style={{ "--x": x, "--y": y } as CSSProperties} aria-hidden="true" />
      <figcaption>{lejant}</figcaption>
    </figure>
  );
}

/** Türkiye silüeti tanımı (bir kez; haritalar <use> ile çizer). */
export function TurkiyeTanim() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="bro-tanim">
      <defs>
        <path id="bro-tr" d={turkiye.d} />
        <pattern id="bro-tr-nokta" width="13" height="13" patternUnits="userSpaceOnUse">
          <circle cx="6.5" cy="6.5" r="3.6" fill="#fff" />
        </pattern>
      </defs>
    </svg>
  );
}

const TR_VB = `0 0 ${turkiye.w} ${turkiye.h}`;

/* ============================== kapak ============================== */

export function Kapak() {
  return (
    <section id="kapak" aria-label="Kapak" className="bro-bolum bro-gece bro-kapak">
      <div className="bro-kapak-logolar">
        <span className="bro-logo-disk">
          <Image src={logos.genclikKollari.src} width={logos.genclikKollari.width} height={logos.genclikKollari.height} alt={logos.genclikKollari.alt} sizes="64px" />
        </span>
        <span className="bro-logo-cop">
          <Cop31Logo duzen="yatay" title="COP31 Türkiye Antalya logosu" />
        </span>
      </div>
      <h1 className="bro-kapak-baslik">
        <span className="bro-kapak-acilis">{kapak.ust}</span>
        <span className="bro-kapak-acilis bro-kapak-acilis-2">{kapak.alt}</span>
        <El className="bro-kapak-el">{kapak.el}</El>
      </h1>
      <p className="bro-kapak-alt">{kimlik}</p>
      <div className="bro-kapak-dunya" aria-hidden="true">
        <Foto src={kapakDunya} alt="" sizes="(min-width: 900px) 900px, 100vw" oncelik />
      </div>
      <a href="#icindekiler" className="bro-ipucu">
        Aşağı kaydır <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}

/* ============================== içindekiler ============================== */

export function Icindekiler() {
  return (
    <Bolum id="icindekiler" tema="krem" etiket="İçindekiler" className="bro-icindekiler">
      <div className="bro-ic">
        <div className="bro-ic-fotolar" aria-hidden="true">
          <Foto src={icindekiler1} alt="" sizes="(min-width: 900px) 360px, 60vw" className="bro-polaroid bro-pola-1" />
          <Foto src={icindekiler2} alt="" sizes="(min-width: 900px) 300px, 50vw" className="bro-polaroid bro-pola-2" />
        </div>
        <div>
          <El className="bro-ic-el">{kapak.el}</El>
          <h2 className="bro-baslik bro-lacivert-yazi" data-a="up">
            İÇİNDEKİLER
          </h2>
          <ol className="bro-ic-liste">
            {icindekiler.map((b) => (
              <li key={b.id}>
                <a href={`#${b.id}`}>
                  <span className="bro-ic-etiket">{b.etiket}</span>
                  <span className="bro-ic-baslik">{b.baslik}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Bolum>
  );
}

/* ============================== mesaj ============================== */

export function Mesaj() {
  return (
    <Bolum id="mesaj" tema="gece" etiket="Mesaj" className="bro-mesaj">
      <div className="bro-ic bro-mesaj-ic">
        <div className="bro-mesaj-bas">
          <h2 className="bro-baslik">
            <span className="bro-baslik-kucuk">1 MİLYON GENÇ,</span>
            <span className="bro-yesil-yazi">TEK</span> <span className="bro-yesil-yazi">ORTAK</span> <span className="bro-yesil-yazi">EV</span>
          </h2>
          <Foto src={baskan} alt="AK Parti Gençlik Kolları Başkanı Av. Yusuf İbiş" sizes="(min-width: 900px) 340px, 46vw" className="bro-baskan" />
        </div>
        <article className="bro-mektup" data-a="up">
          <p className="bro-mektup-ust">{kimlik}</p>
          {mesaj.paragraflar.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <p className="bro-imza">
            <b>{mesaj.imza}</b>
            <span>{mesaj.unvan}</span>
          </p>
        </article>
      </div>
    </Bolum>
  );
}

/* ============================== 01 sayılarla ============================== */

export function Sayilarla() {
  const k = sayilarla.kartlar;
  return (
    <Bolum id="sayilarla" tema="gece" etiket="Bölüm 01: Sayılarla AK Gençlik" className="bro-sayilarla">
      <div className="bro-ic">
        <Kicker no="01" />
        <h2 className="bro-baslik">
          SAYILARLA <span className="bro-sari-yazi">AK GENÇLİK</span>
        </h2>
        <div className="bro-uye">
          <p className="bro-dev bro-yesil-yazi">
            <Counter value={sayilarla.uye.deger} />
          </p>
          <p>
            <El className="bro-uye-el">{sayilarla.uye.el}</El> <span className="bro-uye-metin">{sayilarla.uye.metin}</span>
          </p>
        </div>
        <figure className="bro-harita bro-harita-uye" data-a="up">
          <svg viewBox={TR_VB} role="img" aria-label="Türkiye haritası">
            <use href="#bro-tr" />
          </svg>
          <span className="bro-etiket bro-etiket-beyaz bro-harita-81">81 İL</span>
          <span className="bro-etiket bro-etiket-sari bro-harita-922">922 İLÇE</span>
          <figcaption>{sayilarla.teskilat}</figcaption>
        </figure>

        <div className="bro-kartlar">
          <article className="bro-kart bro-kart-yesil">
            <Rakam sayi={k.okul.sayi} el={k.okul.el} />
            <p>{k.okul.metin}</p>
            <Izgara tur="kare" x={10} y={1} lejant={k.okul.lejant} />
          </article>
          <article className="bro-kart bro-kart-lacivert">
            <Rakam sayi={k.ilkOy.sayi} el={k.ilkOy.el} />
            <p>{k.ilkOy.metin}</p>
            <Izgara tur="kare" x={6.5} y={1} lejant={k.ilkOy.lejant} className="bro-ig-sari" />
          </article>
          <article className="bro-kart bro-kart-mavi bro-kart-genis">
            <Rakam sayi={k.saha.sayi} el={k.saha.el} />
            <p>{k.saha.metin}</p>
            <Izgara tur="kare" x={5} y={1} lejant={k.saha.lejant} />
          </article>
          <article className="bro-kart bro-kart-krem">
            <Rakam sayi={k.universite.sayi} el={k.universite.el} />
            <p>{k.universite.metin}</p>
            <Izgara tur="nokta" x={16} y={13} lejant={k.universite.lejant} />
          </article>
          <article className="bro-kart bro-kart-sari">
            <Rakam sayi={k.proje.sayi} el={k.proje.el} />
            <p>{k.proje.metin}</p>
            <Izgara tur="cizgi" x={13} y={1} lejant={k.proje.lejant} className="bro-ig-uzun" />
          </article>
          <article className="bro-kart bro-kart-cimen bro-kart-genis">
            <Rakam sayi={k.fidan.sayi} el={k.fidan.el} />
            <p>{k.fidan.metin}</p>
            <Izgara tur="fidan" x={25} y={1} lejant={k.fidan.lejant} />
          </article>
        </div>
      </div>
    </Bolum>
  );
}

/* ============================== 02 karar masası ============================== */

export function KararMasasi() {
  const m = kararMasasi;
  return (
    <Bolum id="karar-masasi" tema="krem" etiket="Bölüm 02: Gençlik Karar Masasında" className="bro-karar">
      <div className="bro-kahraman">
        <Foto src={bulusmaSamsun} alt="Gençlik Buluşmaları, Samsun: Cumhurbaşkanı Erdoğan gençlerle sahnede" sizes="100vw" className="bro-kahraman-foto" />
        <div className="bro-kahraman-yazi">
          <Kicker no="02" />
          <h2 className="bro-baslik">
            <span className="bro-baslik-kucuk">GENÇLİK</span>
            KARAR <span className="bro-sari-yazi">MASASINDA</span>
          </h2>
        </div>
      </div>
      <div className="bro-ic">
        <div className="bro-iki-sutun">
          {m.paragraflar.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <p className="bro-etiket bro-etiket-lacivert bro-gosterge">
          {m.gostergeEtiket} <span aria-hidden="true">→</span>
        </p>
      </div>
      <div className="bro-panel bro-gece">
        <div className="bro-ic bro-karar-panel">
          <div className="bro-yas" data-a="up">
            <p className="bro-dev bro-yesil-yazi">{m.yas.sayi}</p>
            <div>
              <span className="bro-etiket bro-etiket-yesil">{m.yas.yil}</span>
              <El className="bro-yas-el">{m.yas.el}</El>
            </div>
          </div>
          <div className="bro-vekil">
            <p className="bro-ust-etiket">{m.vekil.etiket}</p>
            <p className="bro-vekil-noktalar" aria-label={`${m.vekil.toplam} vekilden ${m.vekil.bizden}'ü`}>
              {Array.from({ length: m.vekil.toplam }, (_, i) => (
                <span key={i} data-dolu={i < m.vekil.bizden ? "1" : "0"} />
              ))}
            </p>
            <p>{m.vekil.metin}</p>
          </div>
          <div className="bro-meclis">
            <Rakam sayac={m.meclis.sayi} el={m.meclis.el} />
            <p>{m.meclis.metin}</p>
          </div>
          <blockquote className="bro-alinti bro-sari-yazi">{m.miras}</blockquote>
          <p className="bro-nesil">{m.nesil}</p>
        </div>
      </div>
    </Bolum>
  );
}

/* ============================== 03 iklim ============================== */

export function Iklim() {
  const i = iklim;
  return (
    <Bolum id="iklim" tema="orman" etiket="Bölüm 03: İklim İçin Sahadayız" className="bro-iklim">
      <div className="bro-ic">
        <div className="bro-iklim-bas">
          <figure className="bro-polaroid-cerceve" data-a="up">
            <Foto src={fidanDikimi} alt="AK Gençlik fidan dikimi" sizes="(min-width: 900px) 520px, 88vw" className="bro-polaroid" />
            <span className="bro-etiket bro-etiket-limon">{i.etiket}</span>
          </figure>
          <div>
            <Kicker no="03" />
            <h2 className="bro-baslik">
              İKLİM İÇİN <span className="bro-limon-yazi">SAHADAYIZ</span>
            </h2>
            <p className="bro-giris">{i.giris}</p>
          </div>
        </div>

        <div className="bro-fidan-blok">
          <Rakam sayac={i.fidan.sayi} el={i.fidan.el} className="bro-rakam-dev bro-limon-yazi" />
          <p>{i.fidan.metin}</p>
          <Izgara tur="fidan" x={25} y={10} lejant={i.fidan.lejant} className="bro-ig-fidan-250" />
          <div className="bro-yan-yana">
            <Rakam sayac={i.il.sayi} el={i.il.el} />
            <Rakam sayac={i.genc.sayi} el={i.genc.el} />
          </div>
          <div className="bro-hatira">
            <Rakam sayac={i.orman.sayi} el={i.orman.el} />
            <Izgara tur="halka" x={9} y={1} lejant={i.orman.metin} />
          </div>
        </div>

        <div className="bro-saha">
          <div className="bro-saha-bas">
            <El className="bro-saha-el">{i.el}</El>
            <Foto src={ellerFidan} alt="Toprağa fidan diken eller" sizes="(min-width: 900px) 360px, 64vw" className="bro-daire-foto" />
          </div>
          <ol className="bro-saha-kartlar">
            {i.kartlar.map((k, n) => (
              <li key={k.etiket} className={`bro-saha-kart bro-saha-kart-${n + 1}`} data-a="up">
                <b>{String(n + 1).padStart(2, "0")}</b>
                <div>
                  <p className="bro-ust-etiket">{k.etiket}</p>
                  <p>{k.metin}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="bro-iki-sutun bro-iklim-son">
          <div>
            <Rakam sayac={i.gonullu.sayi} el={i.gonullu.el} className="bro-limon-yazi" />
            <p>{i.gonullu.metin}</p>
          </div>
          <div>
            <Rakam sayac={i.kampus.sayi} el={i.kampus.el} className="bro-limon-yazi" />
            <p>{i.kampus.metin}</p>
          </div>
        </div>
        <blockquote className="bro-alinti">{i.dava}</blockquote>
      </div>
    </Bolum>
  );
}

/* ============================== 04 liderlik ============================== */

export function Liderlik() {
  const l = liderlik;
  return (
    <Bolum id="liderlik" tema="krem" etiket="Bölüm 04: Liderlik Okulu" className="bro-liderlik">
      <div className="bro-kahraman bro-kahraman-uzun">
        <Foto src={liderlikFoto} alt="Cumhurbaşkanı Erdoğan, telefon ışıklarıyla dolu salonda gençlerin arasında" sizes="100vw" className="bro-kahraman-foto" />
        <div className="bro-kahraman-yazi">
          <Kicker no="04" />
          <h2 className="bro-baslik">
            LİDERLİK <span className="bro-sari-yazi">OKULU</span>
          </h2>
        </div>
      </div>
      <div className="bro-ic">
        <p className="bro-giris bro-lacivert-yazi">{l.giris}</p>
        <div className="bro-uclu">
          {l.rakamlar.map((r, n) => (
            <div key={r.ust} className={`bro-kutu ${n === 2 ? "bro-kart-cimen" : "bro-kart-lacivert"}`} data-a="up">
              <p className="bro-ust-etiket">{r.ust}</p>
              <Rakam sayi={r.sayi} el={r.el} />
              <p>{r.alt}</p>
            </div>
          ))}
        </div>
        <p>{l.akademi}</p>
        <div className="bro-iki-sutun bro-liderlik-alt">
          <ol className="bro-dersler">
            {l.dersler.map((d, n) => (
              <li key={d}>
                <b>{n + 1}</b>
                {d}
              </li>
            ))}
          </ol>
          <div>
            <p className="bro-360" aria-label="360 derece">
              <span>360</span>
              <El>derece</El>
            </p>
            <p>{l.sahne}</p>
          </div>
        </div>
        <p className="bro-vurgu bro-lacivert-yazi">{l.okul}</p>
        <p className="bro-etiket bro-etiket-turuncu">{l.okulEtiket}</p>
      </div>
    </Bolum>
  );
}

/* ============================== 05 üniak ============================== */

export function Uniak() {
  const u = uniak;
  return (
    <Bolum id="uniak" tema="orman" etiket="Bölüm 05: ÜniAK: Kampüs Hattı" className="bro-uniak">
      <div className="bro-ic">
        <div className="bro-uniak-fotolar">
          <Foto src={uniak1} alt="ÜniAK Kampüse Hoş Geldin standında gençler" sizes="(min-width: 900px) 520px, 80vw" className="bro-polaroid bro-pola-1" />
          <Foto src={uniak2} alt="Kampüste ÜniAK standı" sizes="(min-width: 900px) 320px, 52vw" className="bro-polaroid bro-pola-2" />
          <Foto src={ilkDurak} alt="İlk Durak ÜniAK" sizes="140px" className="bro-ilk-durak" />
        </div>
        <Kicker no="05" />
        <h2 className="bro-baslik">
          ÜNİAK <span className="bro-limon-yazi">KAMPÜS HATTI</span>
        </h2>
        <div className="bro-iki-sutun">
          {u.paragraflar.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </div>
      <div className="bro-panel bro-krem">
        <div className="bro-ic">
          <ol className="bro-hat" aria-label="İlk günden mezuniyete">
            <li className="bro-hat-uc">
              <span className="bro-etiket bro-etiket-cimen">{u.basla}</span>
            </li>
            {u.hat.map((h) => (
              <li key={h.sayi} className="bro-hat-durak" data-a="left">
                <Rakam sayac={h.sayi} el={h.el} className="bro-lacivert-yazi" />
                <p>{h.metin}</p>
              </li>
            ))}
            <li className="bro-hat-uc">
              <span className="bro-etiket bro-etiket-cimen">{u.bitis}</span>
            </li>
          </ol>
          <p className="bro-cagri bro-kart-cimen">{u.kapanis}</p>
        </div>
      </div>
    </Bolum>
  );
}

/* ============================== 06 dinleyen ============================== */

/** Ses dalgası çubukları (dekor): sabit, belirlenimli boylar. */
const DALGA = [18, 34, 52, 30, 64, 88, 46, 72, 100, 58, 36, 80, 54, 28, 66, 92, 48, 30, 70, 40, 22, 56, 84, 44, 26, 60, 38, 20];

export function Dinleyen() {
  return (
    <Bolum id="dinleyen" tema="krem" etiket="Bölüm 06: Dinleyen Siyaset" className="bro-dinleyen">
      <div className="bro-kahraman bro-kahraman-krem">
        <Foto src={dinleyenFoto} alt="Cumhurbaşkanı Erdoğan gençlerle sohbet ediyor" sizes="100vw" className="bro-kahraman-foto" />
      </div>
      <div className="bro-ic">
        <div className="bro-dinleyen-bas">
          <div>
            <Kicker no="06" />
            <h2 className="bro-baslik bro-lacivert-yazi">
              DİNLEYEN <span className="bro-cimen-yazi">SİYASET</span>
            </h2>
          </div>
          <p className="bro-dalga" aria-hidden="true">
            {DALGA.map((h, n) => (
              <span key={n} style={{ height: `${h}%` }} />
            ))}
          </p>
        </div>
        <p className="bro-giris">{dinleyen.giris}</p>
        <div className="bro-uclu">
          {dinleyen.rakamlar.map((r) => (
            <div key={r.sayi} data-a="up">
              <Rakam sayi={r.sayi} el={r.el} className="bro-lacivert-yazi" />
              <p>{r.metin}</p>
            </div>
          ))}
        </div>
      </div>
    </Bolum>
  );
}

/* ============================== 07 şölen ============================== */

export function Solen() {
  return (
    <Bolum id="solen" tema="gece" etiket="Bölüm 07: Gençlik Şöleni" className="bro-solen">
      <div className="bro-kahraman">
        <Foto src={solenFoto} alt="Gençlik Şöleni, Kocaeli Stadyumu: sahnede yürüyüş" sizes="100vw" className="bro-kahraman-foto" />
        <div className="bro-kahraman-yazi">
          <h2 className="bro-baslik">
            <span className="bro-baslik-kucuk">BİR GENÇLİK</span>
            <span className="bro-sari-yazi bro-baslik-dev">ŞÖLENİ</span>
          </h2>
        </div>
      </div>
      <div className="bro-ic bro-iki-sutun bro-solen-ic">
        <div>
          <Kicker no="07" />
          <Rakam sayac={solen.sayi} el={solen.el} className="bro-rakam-dev" />
          <p className="bro-etiket bro-etiket-sari">{solen.tarih}</p>
        </div>
        <div>
          <p>{solen.paragraf}</p>
          <p className="bro-vurgu bro-sari-yazi">{solen.gelenek}</p>
        </div>
      </div>
    </Bolum>
  );
}

/* ============================== 08 eserler ============================== */

export function Eserler() {
  const P = turkiye.noktalar;
  const [g, t, h] = [P.gabar, P.togg, P.hatay];
  // 1 → 2 → 3: Gabar'dan kuzeyden kavisle Gemlik'e, oradan güneydoğuya Hatay'a.
  const rota = `M${g[0]} ${g[1]} Q${(g[0] + t[0]) / 2} ${-60} ${t[0]} ${t[1]} Q${(t[0] + h[0]) / 2 - 40} ${h[1] + 40} ${h[0]} ${h[1]}`;
  return (
    <Bolum id="eserler" tema="mavi" etiket="Bölüm 08: Büyük Türkiye’nin Büyük Eserleri" className="bro-eserler">
      <div className="bro-ic">
        <Kicker no="08" />
        <h2 className="bro-baslik bro-baslik-orta">
          BÜYÜK TÜRKİYE’NİN <span className="bro-sari-yazi">BÜYÜK ESERLERİ</span>
        </h2>
        <div className="bro-iki-sutun">
          {eserler.paragraflar.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <figure className="bro-harita bro-harita-eser" data-a="up">
          <svg viewBox={`0 -70 ${turkiye.w} ${turkiye.h + 90}`} role="img" aria-label="Türkiye haritasında üç buluşma: Gabar, TOGG Gemlik, Hatay">
            <use href="#bro-tr" className="bro-tr-eser" />
            <path d={rota} className="bro-rota" />
            {eserler.bulusmalar.map((b) => {
              const [x, y] = P[b.nokta];
              return (
                <g key={b.ad}>
                  <circle cx={x} cy={y} r="22" className="bro-nokta-hale" />
                  <circle cx={x} cy={y} r="10" className="bro-nokta" />
                </g>
              );
            })}
          </svg>
          {eserler.bulusmalar.map((b) => {
            const [x, y] = P[b.nokta];
            return (
              <span key={b.ad} className="bro-etiket bro-etiket-sari bro-harita-ad" style={{ left: `${(x / turkiye.w) * 100}%`, top: `${((y + 70) / (turkiye.h + 90)) * 100}%` }}>
                {Number(b.no)} · {b.ad}
              </span>
            );
          })}
        </figure>
        <ol className="bro-bulusmalar">
          {eserler.bulusmalar.map((b, n) => (
            <li key={b.ad} className={`bro-bulusma bro-bulusma-${n + 1}`} data-a="up">
              <p className="bro-ust-etiket">{Number(b.no)}. BULUŞMA</p>
              <h3>{b.ad}</h3>
              <p className="bro-bulusma-yer">{b.yer}</p>
              <p>{b.metin}</p>
              <span className="bro-bulusma-no" aria-hidden="true">
                {b.no}
              </span>
            </li>
          ))}
        </ol>
        <p className="bro-vurgu">{eserler.kapanis}</p>
      </div>
    </Bolum>
  );
}

/* ============================== 09 dünyayla köprü ============================== */

/** Küre üstü yaylar: merkez (Türkiye) → çevre noktaları; viewBox 0 0 400 400. */
const YAYLAR = [
  [70, 120], [110, 60], [200, 40], [300, 70], [350, 150], [345, 260], [290, 340], [190, 360], [95, 310], [50, 220],
] as const;

/** Uçuş yayı: Türkiye'den hedefe, uzaklıkla orantılı yukarı (kuzeye) kavis; sarmal görünmesin diye hep aynı yöne. */
const yay = (x0: number, y0: number, x1: number, y1: number) => {
  const d = Math.hypot(x1 - x0, y1 - y0);
  return `M${x0} ${y0} Q${((x0 + x1) / 2).toFixed(1)} ${(Math.min(y0, y1) - d * 0.32).toFixed(1)} ${x1} ${y1}`;
};

export function Dunyayla() {
  const [cx, cy] = [212, 168];
  return (
    <Bolum id="dunyayla" tema="gece" etiket="Bölüm 09: Dünyayla Köprü" className="bro-dunyayla">
      <div className="bro-ic bro-iki-sutun bro-dunyayla-ic">
        <div>
          <Kicker no="09" />
          <h2 className="bro-baslik">
            DÜNYAYLA <span className="bro-yesil-yazi">KÖPRÜ</span>
          </h2>
          <p className="bro-giris">{dunyayla}</p>
        </div>
        <figure className="bro-kure" aria-hidden="true" data-a="up">
          <span className="bro-kure-nokta" />
          <svg viewBox="0 0 400 400">
            {YAYLAR.map(([x, y]) => (
              <path key={`${x}-${y}`} d={yay(cx, cy, x, y)} />
            ))}
            {YAYLAR.map(([x, y]) => (
              <circle key={`n${x}-${y}`} cx={x} cy={y} r="4" />
            ))}
            <circle cx={cx} cy={cy} r="9" className="bro-kure-merkez" />
          </svg>
        </figure>
      </div>
    </Bolum>
  );
}

/* ============================== 10 taahhütler ============================== */

export function Taahhutler() {
  const [bir, ...diger] = taahhutler.liste;
  const piktogram = (no: string) => {
    switch (no) {
      case "02":
        return <Izgara tur="kare" x={10} y={10} lejant={diger[0].lejant} />;
      case "03":
        return <Izgara tur="nokta" x={16} y={13} lejant={diger[1].lejant} />;
      case "04":
        return (
          <figure className="bro-izgara">
            <svg viewBox={TR_VB} className="bro-tr-noktali" aria-hidden="true">
              <use href="#bro-tr" />
            </svg>
            <figcaption>{diger[2].lejant}</figcaption>
          </figure>
        );
      default:
        return <Izgara tur="daire" x={5} y={5} lejant={diger[3].lejant} />;
    }
  };
  return (
    <Bolum id="taahhutler" tema="orman" etiket="Bölüm 10: COP31 Taahhütlerimiz" className="bro-taahhut">
      <div className="bro-ic">
        <Kicker no="10" />
        <h2 className="bro-baslik bro-taahhut-baslik">
          <span className="bro-limon-yazi bro-baslik-dev">COP31</span>
          <El className="bro-taahhut-el">Taahhütlerimiz</El>
        </h2>
        <p className="bro-giris">{taahhutler.giris}</p>
        <p className="bro-plan">
          <span className="bro-etiket bro-etiket-sari">2027</span> {taahhutler.plan}
        </p>

        <article className="bro-taahhut-bir" data-a="up">
          <div className="bro-halka-1" aria-hidden="true">
            <span className="bro-halka-noktalar" />
            <span className="bro-halka-sayi">{bir.sayi}</span>
            <span className="bro-halka-alt">MİLYON FİDAN</span>
          </div>
          <div>
            <p className="bro-ust-etiket">
              {bir.no} · {taahhutler.sure}
            </p>
            <h3>{bir.baslik}</h3>
            <p>{bir.metin}</p>
            <p className="bro-lejant">{bir.lejant}</p>
          </div>
        </article>

        <div className="bro-taahhut-kartlar">
          {diger.map((t, n) => (
            <article key={t.no} className={`bro-taahhut-kart bro-tk-${n + 2}`} data-a="up">
              <p className="bro-ust-etiket">
                {t.no} · {taahhutler.sure}
              </p>
              {piktogram(t.no)}
              <Rakam sayi={t.sayi} el={t.el} />
              <h3>{t.baslik}</h3>
              <p>{t.metin}</p>
            </article>
          ))}
        </div>
        <p className="bro-soz">
          <El>{taahhutler.soz}</El>
        </p>
      </div>
    </Bolum>
  );
}

/* ============================== kapanış ============================== */

export function Kapanis() {
  const [a, b, c] = kapanis.baslik;
  return (
    <Bolum id="kapanis" tema="krem" etiket="Kapanış" className="bro-kapanis">
      <div className="bro-kahraman bro-kahraman-uzun">
        <Foto src={kapanisFoto} alt="Cumhurbaşkanı Erdoğan ve AK Gençlik yöneticileri gençlerin arasında yürüyor" sizes="100vw" className="bro-kahraman-foto" />
        <div className="bro-kahraman-yazi bro-kahraman-ust">
          <h2 className="bro-baslik">
            <span className="bro-baslik-kucuk">{a}</span>
            <span className="bro-sari-yazi">{b}</span> {c}
          </h2>
        </div>
      </div>
      <div className="bro-ic">
        <El className="bro-kapanis-el">{kapanis.el}</El>
        <div className="bro-iki-sutun">
          {kapanis.paragraflar.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <p className="bro-cagri bro-kart-lacivert">{kapanis.vurgu}</p>
      </div>
    </Bolum>
  );
}

/* ============================== arka kapak ============================== */

export function ArkaKapak({ geri }: { geri: ReactNode }) {
  return (
    <section id="arka-kapak" aria-label="Arka kapak" className="bro-bolum bro-gece bro-arka">
      <div className="bro-ic bro-arka-ic">
        <span className="bro-logo-disk bro-logo-disk-buyuk">
          <Image src={logos.genclikKollari.src} width={logos.genclikKollari.width} height={logos.genclikKollari.height} alt={logos.genclikKollari.alt} sizes="120px" />
        </span>
        <span className="bro-logo-cop bro-logo-cop-buyuk">
          <Cop31Logo duzen="yatay" title="COP31 Türkiye Antalya logosu" />
        </span>
        <p className="bro-arka-el">
          <El>{kapanis.el}</El>
        </p>
        <p className="bro-arka-soz">{taahhutler.soz}</p>
        <ul className="bro-sosyal">
          {socials.map((s) => (
            <li key={s.name}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                <b>{s.name}</b> {s.label}
              </a>
            </li>
          ))}
        </ul>
        {geri}
      </div>
      <div className="bro-arka-dunya" aria-hidden="true">
        <Foto src={arkaDunya} alt="" sizes="(min-width: 900px) 1100px, 120vw" />
      </div>
    </section>
  );
}
