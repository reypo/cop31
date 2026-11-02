"use client";

import { useEffect, useRef } from "react";
import { donemler, emanetAlanlari, type EmanetAlani } from "@/lib/emanet";

/**
 * Rotundanın 12 sütun yüzü (docs/brief-icinden.md §1 d = 4). B'nin `RotundaKatmani`
 * (zemin halkası + "Buradasın / Bugün") içindeki `.ics-yuva`ya `<Katman id="rotunda">` çocuğu
 * olarak girer; 1000×1000 nominal kutuda çizilir (merkez 500, 500).
 *
 * Kadran: yüzler dönem halkası (r ≤ 227) ile sütun bandı (r ≥ 370) arasındaki iç halkada,
 * merkezden YUZ_R uzaklıkta, saat yönünde 30° arayla; her yüzün üstü merkeze bakar (saat 6'daki
 * yüz dik). Aktif yüz saat 6'ya gelir, dik ve büyüktür (×1,8: telefonda ad okunur, bandın üstüne
 * taşar). Yüzler B'nin bant üstündeki 12 sütun noktasından bağımsızdır (onlar sabit, kadran döner).
 *
 * Spot sözleşmesi (§3.9): B katman kök elemanına `data-spot="1…12"` yazar (dinlenmede 4,5 s'de
 * bir artar; geçişte ve reduced'da 0). Burada MutationObserver ile okunur: kadran BİRİKİMLİ
 * açıyla döner (12 → 1 geçişi 330° geri değil 30° ileri), aktif yüz `data-aktif` alır.
 * 0/yok: son aktif yüz kalır. Görsel vurgu yalnızca CSS'te (icinden.css "sütun yüzleri").
 * Panel satırı (`AktifSutun`) aynı aktif numarayı modül içi abonelikle alır.
 *
 * Erişilebilirlik: kadran ve panel satırı görseldir (aria-hidden); 12 sütunun okunur metni akıştaki
 * `SutunListesi`nde (hareketli düzende sr-only, reduced-motion'da görünür). Çift okunmaz.
 */

const MERKEZ = 500;
/**
 * Yüz merkezlerinin yarıçapı (nominal): 298 ± 70 → 228…368, halka (227) ile bant (370) arası.
 * Aktif yüz ×1,8 (icinden.css): alt kenarı 798 + 126 = 924 < 1000, kutudan taşmaz.
 */
export const YUZ_R = 298;
/** Yüz kutusu (nominal): icinden.css `.ic-yuz` ile aynı. 120 genişlikte komşu yüzlerin iç köşeleri değmez. */
export const YUZ_G = 120;
export const YUZ_Y = 140;

const tr = (n: number) => String(n).padStart(2, "0");

function donem(ad: string) {
  return donemler.find((d) => d.ad === ad);
}

/* ---- aktif sütun: modül içi küçük yayın (kadran → panel satırı) ---- */

let aktifNo = 1;
const dinleyiciler = new Set<(n: number) => void>();

function aktifYaz(n: number) {
  if (n === aktifNo) return;
  aktifNo = n;
  dinleyiciler.forEach((cb) => cb(n));
}

function aktifAbone(cb: (n: number) => void): () => void {
  dinleyiciler.add(cb);
  cb(aktifNo);
  return () => {
    dinleyiciler.delete(cb);
  };
}

/** Yüzün kadrandaki yeri: saat 6'dan saat yönünde (i − 1)·30°. */
function yuzYeri(no: number) {
  const aci = (no - 1) * 30;
  const r = (aci * Math.PI) / 180;
  const x = MERKEZ - YUZ_R * Math.sin(r);
  const y = MERKEZ + YUZ_R * Math.cos(r);
  return { aci, sol: +(x - YUZ_G / 2).toFixed(2), ust: +(y - YUZ_Y / 2).toFixed(2) };
}

function Yuz({ a }: { a: EmanetAlani }) {
  const { aci, sol, ust } = yuzYeri(a.no);
  const d = donem(a.donem);
  return (
    <li
      data-yuz={a.no}
      data-aktif={a.no === 1 ? "" : undefined}
      className="ic-yuz"
      style={{ left: `${sol}px`, top: `${ust}px`, rotate: `${aci}deg` }}
    >
      <span aria-hidden="true" className="ic-yuz-no ic-serif">
        {tr(a.no)}
      </span>
      <span className="ic-yuz-ad">
        <span className="sr-only">{a.no}. sütun: </span>
        {a.ad}
      </span>
      <span className="ic-yuz-il">{a.il}</span>
      <span className="ic-cip">
        <span aria-hidden="true" className="ic-cip-nokta" style={{ backgroundColor: d?.renk }} />
        <span aria-hidden="true">{d?.kisa ?? a.donem}</span>
        <span className="sr-only">
          {a.donem}. {a.emanet}
        </span>
      </span>
    </li>
  );
}

/** Kadran (hareketli düzen; reduced-motion'da sabit resim olarak kalır, liste akışta). */
export default function SutunYuzleri() {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const kadran = ref.current;
    if (!kadran) return;
    const kok = kadran.closest<HTMLElement>("[data-katman]") ?? kadran.parentElement;
    if (!kok) return;
    const yuzler = Array.from(kadran.querySelectorAll<HTMLElement>("[data-yuz]"));
    let son = 1;
    let aci = 0;

    const uygula = () => {
      const s = Number(kok.getAttribute("data-spot") ?? 0);
      if (!Number.isInteger(s) || s < 1 || s > 12 || s === son) return;
      let fark = (((s - son) % 12) + 12) % 12;
      if (fark > 6) fark -= 12;
      aci -= fark * 30;
      son = s;
      kadran.style.transform = `rotate(${aci}deg)`;
      for (const y of yuzler) {
        if (Number(y.dataset.yuz) === s) y.setAttribute("data-aktif", "");
        else y.removeAttribute("data-aktif");
      }
      aktifYaz(s);
    };

    uygula();
    const mo = new MutationObserver(uygula);
    mo.observe(kok, { attributes: true, attributeFilter: ["data-spot"] });
    return () => {
      mo.disconnect();
      kadran.style.removeProperty("transform");
      for (const y of yuzler) {
        if (y.dataset.yuz === "1") y.setAttribute("data-aktif", "");
        else y.removeAttribute("data-aktif");
      }
      aktifYaz(1);
    };
  }, []);

  return (
    <ol ref={ref} aria-hidden="true" className="ic-kadran">
      {emanetAlanlari.map((a) => (
        <Yuz key={a.no} a={a} />
      ))}
    </ol>
  );
}

/**
 * d4 panelindeki "aktif sütunun tek satırı": ad · il · dönem — emanet cümlesi.
 * 12 satır aynı ızgara hücresinde üst üste (yükseklik = en uzun satır; spot değişince panel
 * zıplamaz); yalnızca aktif olan görünür. Reduced-motion'da gizli (yerine `SutunListesi`).
 */
export function AktifSutun() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const kap = ref.current;
    if (!kap) return;
    const satirlar = Array.from(kap.querySelectorAll<HTMLElement>("[data-satir]"));
    return aktifAbone((n) => {
      for (const s of satirlar) {
        if (Number(s.dataset.satir) === n) s.setAttribute("data-gorunen", "");
        else s.removeAttribute("data-gorunen");
      }
    });
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="ic-aktif-sutun">
      {emanetAlanlari.map((a) => (
        <p key={a.no} data-satir={a.no} data-gorunen={a.no === 1 ? "" : undefined} className="ic-aktif-satir">
          <span className="ic-serif ic-aktif-no">{tr(a.no)}</span>{" "}
          <span className="ic-aktif-ad">{a.ad}</span>
          <span className="ic-aktif-meta">
            {" "}
            · {a.il} · {a.donem}
          </span>
          <span className="ic-aktif-cumle"> — {a.emanet}</span>
        </p>
      ))}
    </div>
  );
}

/** Reduced-motion düzeni: 12 satırlık liste (bölüm 4'te akışta). */
export function SutunListesi() {
  return (
    <ol className="ic-sutun-listesi" aria-label="12 sütun, 12 emanet">
      {emanetAlanlari.map((a) => {
        const d = donem(a.donem);
        return (
          <li key={a.no} className="ic-liste-satir">
            <span aria-hidden="true" className="ic-serif ic-liste-no">
              {tr(a.no)}
            </span>
            <span className="min-w-0">
              <span className="ic-liste-ad">
                <span className="sr-only">{a.no}. sütun: </span>
                {a.ad}
              </span>
              <span className="ic-liste-meta">
                {a.il}
                <span className="ic-cip ic-liste-cip">
                  <span aria-hidden="true" className="ic-cip-nokta" style={{ backgroundColor: d?.renk }} />
                  {a.donem}
                </span>
              </span>
              <span className="ic-liste-cumle">{a.emanet}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
