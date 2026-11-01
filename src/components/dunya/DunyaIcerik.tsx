import {
  backCover,
  baskanMesaji,
  bizKimiz,
  bulusmalar,
  cop31,
  cover,
  facts,
  genclikKollari,
  iklim,
  kapanis,
  solenler,
  stats,
} from "@/lib/content";
import { donemler, emanetAlanlari } from "@/lib/emanet";
import { photos } from "@/lib/photos";
import { stant } from "@/lib/stant";
import DunyaKapanis from "./DunyaKapanis";
import "./dunya.css";
import EmanetListe, { EmanetUst } from "./EmanetListe";
import { etkinlikler } from "./iller";
import {
  AltBaslik,
  Baslik,
  Govde,
  LeafTag,
  Panel,
  Polaroid,
  PolaroidIkili,
  Sayi,
  SerifEtiket,
  YaprakMadde,
} from "./parcalar";
import StantPlani from "./StantPlani";

const tr = (n: number) => n.toLocaleString("tr-TR");

/** Paragrafı cümlelere böler (metni değiştirmeden). */
function cumleler(p: string): string[] {
  const parts = p.split(". ");
  return parts.map((x, i) => (i < parts.length - 1 ? `${x}.` : x));
}

/**
 * Kayan içerik: 13 bölüm (docs/brief-dunya-2.md §1), her biri bir ekran
 * (`dn-bolum`, snap başı). `data-stage` = bölüm index'i; DunyaScene bölüm bölüm
 * adımlar ve küre animasyonunu iki bölümün başlangıçları arasındaki geçişte oynatır.
 *
 * 0 kahraman · 1 biz kimiz · 2 emanet girişi · 3–4 emanet listeleri (spot) ·
 * 5 iklim · 6 buluşmalar · 7 şölen · 8 COP31 Antalya · 9 stantta (spot) ·
 * 10 dünya · 11 kapak finali (görsel sabit katmanda) · 12 kapanış bloğu.
 *
 * `data-spot-count` taşıyan bölümlere DunyaScene dinlenmede `data-spot="1…n"`
 * yazar; vurgu yalnızca CSS'te (dunya.css "A: spot" bloğu).
 *
 * Panel yükseklik disiplini: 390×844'te her anlatı paneli sahne alanının
 * (46svh) altındaki ~440 px'e sığar; bölüm içi kaydırma yok.
 */
export default function DunyaIcerik() {
  const kapanisCumleleri = cumleler(kapanis.paragraphs[0]);
  const emanetI = emanetAlanlari.slice(0, 6);
  const emanetII = emanetAlanlari.slice(6, 12);
  const bulusmaIzi = etkinlikler.filter((e) => !e.big);

  return (
    <>
      {/* 0 — Uzaydan dünya */}
      <section
        data-stage="0"
        className="dn-bolum relative flex flex-col items-center justify-between px-4 pt-[calc(max(12px,env(safe-area-inset-top))+52px)] pb-[max(18px,env(safe-area-inset-bottom))]"
      >
        <Panel className="text-center">
          <LeafTag>
            COP31 · {cop31.city} · {cop31.dates}
          </LeafTag>
          <h1 className="mt-3 text-[40px] leading-[1.02] font-black text-brand-blue sm:text-[46px]">
            COP31&apos;de
            <br />
            AK Gençlik
          </h1>
          <p className="mx-auto mt-3 max-w-[22rem] text-[16px] leading-snug font-bold text-balance text-brand-green">
            {cover.subtitle}
          </p>
          <p className="dn-serif mt-2.5 text-[15px] leading-snug font-semibold text-[color:var(--dn-koyu)]">
            {stant.tema} · {stant.hashtag}
          </p>
        </Panel>

        <div data-hero-hint className="flex flex-col items-center text-center">
          <span className="text-[13px] font-black text-brand-navy">Antalya&apos;dan Dünyaya</span>
          <span className="mt-0.5 text-[12px] font-medium text-brand-ink">Aşağı kaydırın</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="mt-1 size-5 text-brand-green motion-safe:animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </section>

      {/* 1 — Biz kimiz: 81 il, 922 ilçe, 1.000.000+ üye */}
      <section data-stage="1" className="dn-bolum dn-anlati relative px-4">
        <Panel>
          <LeafTag>{genclikKollari.title}</LeafTag>
          <Baslik>{bizKimiz.title}</Baslik>
          {/* 81 il · 922 ilçe · 1.000.000+ üye: kürenin üstündeki HUD sayaçları ve alt başlık
              aynı sayıları veriyor; panelde ayrı istatistik satırı yok (aynı ekranda 3–4 kez tekrar). */}
          <AltBaslik>{genclikKollari.subtitle}</AltBaslik>
          <Govde>{bizKimiz.paragraphs[0]}</Govde>
        </Panel>
      </section>

      {/* 2 — Emanet girişi: 12.000 Yıllık Emanet (krem tema) */}
      <section data-stage="2" className="dn-bolum dn-anlati relative px-4">
        <Panel krem>
          <SerifEtiket>{stant.tema}</SerifEtiket>
          <h2 className="dn-serif dn-slogan mt-3 text-[27px] leading-[1.15] font-bold text-balance text-[color:var(--dn-koyu)] sm:text-[31px]">
            {stant.slogan}
          </h2>
          {/* "12.000 yıllık emanet" kürenin üstündeki HUD'da; panel yeni bilgi verir: dönem sayısı. */}
          <div className="dn-emanet-sayilar mt-3.5 flex items-end gap-5">
            <div className="shrink-0">
              <div className="dn-serif text-[34px] leading-none font-bold text-[color:var(--dn-koyu)] tabular-nums">
                {donemler.length}
              </div>
              <div className="mt-1 text-[12px] leading-snug font-bold text-[color:var(--dn-koyu)]/75">dönem</div>
            </div>
            <div className="shrink-0">
              <div className="dn-serif text-[34px] leading-none font-bold text-[color:var(--dn-koyu)] tabular-nums">
                {emanetAlanlari.length}
              </div>
              <div className="mt-1 text-[12px] leading-snug font-bold text-[color:var(--dn-koyu)]/75">miras sütunu</div>
            </div>
          </div>
          {/* Dönem şeridi: kürenin çevresindeki dönem halkasının (B) düz hâli; renkler donemler'den. */}
          <div className="dn-donem-serit mt-3.5">
            <div aria-hidden="true" className="flex h-2 gap-[2px] overflow-hidden rounded-full">
              {donemler.map((d) => (
                <span key={d.ad} className="min-w-0 flex-1" style={{ backgroundColor: d.renk }} />
              ))}
            </div>
            {/* Şeridin uçları: en eski dönem → "Bugün". "Doğal miras" (son dilim) kronolojik bir dönem
                değil; "Doğal miras · Bugün" en yeni dönemmiş gibi okunuyordu. Tam liste ekran okuyucuda. */}
            <p className="mt-1 flex justify-between gap-3 text-[11px] leading-none font-bold text-[color:var(--dn-koyu)]/75">
              <span className="sr-only">Dönemler: {donemler.map((d) => d.ad).join(", ")}.</span>
              <span aria-hidden="true">{donemler[0].ad}</span>
              <span aria-hidden="true">{stant.zemin.alt}</span>
            </p>
          </div>
          <div className="dn-giris mt-3 grid gap-1.5">
            {stant.girisMetni.map((p) => (
              <p key={p} className="text-[15px] leading-[1.5] text-pretty text-brand-ink">
                {p}
              </p>
            ))}
          </div>
          <p className="dn-serif dn-alt-satir mt-3.5 border-t border-[color:var(--dn-koyu)]/15 pt-2.5 text-[13px] leading-snug text-[color:var(--dn-koyu)]">
            <i lang="en">{stant.temaEn}</i> · {stant.program}
          </p>
        </Panel>
      </section>

      {/* 3 — Emanet I: sütunlar 1–6 (spot döngüsü) */}
      <section data-stage="3" data-spot-count="6" className="dn-bolum dn-anlati relative px-4">
        <Panel krem>
          <EmanetUst>Emanet · 01–06</EmanetUst>
          <Baslik>Anadolu&apos;nun emaneti</Baslik>
          <EmanetListe alanlar={emanetI} />
        </Panel>
      </section>

      {/* 4 — Emanet II: sütunlar 7–12 (spot döngüsü) */}
      <section data-stage="4" data-spot-count="6" className="dn-bolum dn-anlati relative px-4">
        <Panel krem>
          <EmanetUst>Emanet · 07–12</EmanetUst>
          <Baslik>Kuşaktan kuşağa</Baslik>
          <EmanetListe alanlar={emanetII} />
        </Panel>
      </section>

      {/* 5 — İklim eylemleri: iller yeşile döner */}
      <section data-stage="5" className="dn-bolum dn-anlati relative px-4">
        <Panel>
          <LeafTag>{stats[3].label}</LeafTag>
          <Baslik>{iklim.title}</Baslik>
          {/* Sıkı aralıklar + 3:2 kartlar: 390×844'te bölüm tek ekrana sığar (fazladan kaydırma yok). */}
          <div className="dn-sayi-satir mt-2.5 flex items-end gap-4">
            <Sayi value={tr(facts.saplings)} label="fidan" />
            <p className="min-w-0 pb-0.5 text-[14px] leading-snug font-bold text-brand-teal">
              Üsküdar Gençlik Kolları Hatıra Ormanı ({facts.saplingsYear})
            </p>
          </div>
          <ul className="dn-maddeler mt-2.5 grid gap-2">
            {iklim.items.slice(1).map((item) => (
              <YaprakMadde key={item}>{item}</YaprakMadde>
            ))}
          </ul>
          <PolaroidIkili>
            <Polaroid
              photo={photos.fidanDikimiGencler}
              caption="Fidan dikimi"
              rotate={-3}
              aspect="3 / 2"
              position="30% 35%"
            />
            <Polaroid
              photo={photos.gencIklimPanel}
              caption="Genç İklim · İstanbul"
              rotate={2.5}
              aspect="3 / 2"
              position="60% 40%"
            />
          </PolaroidIkili>
        </Panel>
      </section>

      {/* 6 — Gençlik buluşmaları: şehir izi + söyleşi ve kamp */}
      <section data-stage="6" className="dn-bolum dn-anlati relative px-4">
        <Panel>
          <LeafTag>Söz Gençlikte</LeafTag>
          <Baslik>{bulusmalar.title}</Baslik>
          <div className="dn-sayi-satir mt-3 flex items-end gap-4">
            <Sayi value={`${facts.meetings}+`} label="buluşma" />
            <p className="min-w-0 pb-0.5 text-[14px] leading-snug font-bold text-brand-teal">
              Son {facts.meetingsYears} yılda Cumhurbaşkanımızın katılımıyla
            </p>
          </div>
          {/* Buluşma izi Samsun'da biter: Kocaeli (Şölen) kendi bölümünde (7). */}
          <ol className="dn-iz mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] font-bold text-brand-navy">
            {bulusmaIzi.map((e, i) => (
              <li key={e.title} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2 rounded-full bg-brand-orange" />
                {e.title}
                {i < bulusmaIzi.length - 1 ? (
                  <span aria-hidden="true" className="text-brand-ink/50">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          <PolaroidIkili>
            {/* Alt yazılar iki satır, satır sonu elle: "·" satır başına düşmesin, tarih bölünmesin. */}
            <Polaroid
              photo={photos.bulusmaKampusSoylesi}
              caption={
                <>
                  Gençlik Buluşmaları
                  <br />
                  Kampüs söyleşisi
                </>
              }
              rotate={-2.5}
              aspect="4 / 3"
              position="40% 50%"
            />
            <Polaroid
              photo={photos.kamp2025Selam}
              caption={
                <>
                  Strateji ve İstişare Kampı
                  <br />
                  <span className="whitespace-nowrap">13 Ağustos 2025</span>
                </>
              }
              rotate={3}
              aspect="4 / 3"
              position="50% 8%"
            />
          </PolaroidIkili>
        </Panel>
      </section>

      {/* 7 — Gençlik şölenleri: 100.000+ genç, Kocaeli Stadyumu */}
      <section data-stage="7" className="dn-bolum dn-anlati relative px-4">
        <Panel>
          <LeafTag>Bir Gençlik Şöleni</LeafTag>
          <Baslik>{solenler.title}</Baslik>
          {/* "100.000+ genç · Kocaeli Stadyumu" kürenin üstündeki HUD'da, tarih ve yer paragrafta:
              ayrı sayı satırı yok. 4:3 kartlar (3:2 kaynakta 3:2 kırpım hiç kırpmıyordu; p08'in sol
              kenarındaki yarım kişi ancak 4:3 + "100% 50%" ile dışarıda kalır), alt yazılı. */}
          <p className="dn-metin mt-2.5 text-[14.5px] leading-[1.5] text-pretty text-brand-ink">{solenler.paragraphs[0]}</p>
          <PolaroidIkili className="mt-3.5">
            <Polaroid
              photo={photos.solenKocaeliTribunSelam}
              caption={facts.solenPlace}
              rotate={2.5}
              aspect="4 / 3"
              position="0% 50%"
            />
            <Polaroid
              photo={photos.solenKocaeliKursuSelam}
              caption="Bir Gençlik Şöleni"
              rotate={-3}
              aspect="4 / 3"
              position="100% 50%"
            />
          </PolaroidIkili>
        </Panel>
      </section>

      {/* 8 — Antalya: COP31'de buradayız */}
      <section data-stage="8" className="dn-bolum dn-anlati relative px-4">
        <Panel>
          <LeafTag>{cop31.city}</LeafTag>
          <Baslik>COP31&apos;de buradayız</Baslik>
          {/* Kompakt düzen (tarih + mekân tek satır, küçük portre, 14.5px alıntı): 390×844'te ≤ 440 px. */}
          <p className="dn-tarih mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="text-[22px] leading-none font-black whitespace-nowrap text-brand-navy tabular-nums">
              {cop31.dates}
            </span>
            <span className="text-[15px] leading-none font-bold text-brand-teal">{cop31.venue}</span>
          </p>
          <div className="dn-portre mt-3.5 grid grid-cols-[33%_1fr] items-center gap-4 pl-1">
            {/* Başkan ve Cumhurbaşkanı, Kocaeli Şöleni sahası (p22; odak foto-yeni.md: 1:1, 50% 11%). */}
            <Polaroid
              photo={photos.solenKocaeliSahaIkili}
              rotate={-2.5}
              aspect="1 / 1"
              position="50% 11%"
              sizes="(max-width: 520px) 32vw, 160px"
            />
            <div className="min-w-0">
              <p className="text-[15px] leading-snug font-black text-brand-blue">{baskanMesaji.name}</p>
              <p className="mt-1 text-[13px] leading-snug font-bold text-brand-teal">{baskanMesaji.role}</p>
            </div>
          </div>
          <blockquote className="dn-alinti mt-3 border-l-[3px] border-brand-green pl-3 text-[14.5px] leading-[1.5] font-medium text-pretty text-brand-ink">
            {baskanMesaji.paragraphs[0]}
          </blockquote>
        </Panel>
      </section>

      {/* 9 — Stantta: SVG plan + 4 bölge (spot döngüsü) */}
      <section data-stage="9" data-spot-count="4" className="dn-bolum dn-anlati relative px-4">
        <Panel krem>
          <SerifEtiket>Stantta</SerifEtiket>
          <Baslik>Standımızda seni ne bekliyor</Baslik>
          <StantPlani />
          <div className="dn-aciklama mt-2">
            {stant.bolgeler.map((b) => (
              <p key={b.no} data-bolge-aciklama={b.no} className="text-[13px] leading-[1.4] font-medium text-pretty text-brand-ink">
                <span className="dn-serif font-bold text-[color:var(--dn-koyu)]">{b.no}</span>{" "}
                <span className="font-bold text-[color:var(--dn-koyu)]">{/[?!]$/.test(b.ad) ? b.ad : `${b.ad}:`}</span> {b.kisa}
              </p>
            ))}
          </div>
          <p className="dn-serif dn-alt-satir mt-2.5 border-t border-[color:var(--dn-koyu)]/15 pt-2 text-[13px] leading-snug font-semibold text-[color:var(--dn-koyu)]">
            {stant.hashtag} · {stant.program}
          </p>
        </Panel>
      </section>

      {/* 10 — Dünya: COP31'e gelen dünya */}
      <section data-stage="10" className="dn-bolum dn-anlati relative px-4">
        <Panel>
          <LeafTag>{backCover.line1}</LeafTag>
          <Baslik>{backCover.line2}</Baslik>
          <Govde kompakt>{kapanisCumleleri[0]}</Govde>
          <Govde kompakt>{kapanisCumleleri[kapanisCumleleri.length - 1]}</Govde>
        </Panel>
      </section>

      {/* 11 — Kapak finali: Gezegenimiz Ortak Evimizdir (görsel sahne sabit katmanda) */}
      {/* aria-label yok: sr-only paragraf sloganı bir kez okutur (ikisi birlikte iki kez okutuyordu). */}
      <section data-stage="11" className="dn-bolum relative">
        <p className="sr-only">{cover.slogan}</p>
      </section>

      <DunyaKapanis />
    </>
  );
}
