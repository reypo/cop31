import type { ReactNode } from "react";
import { cop31KusUcusuKm, donemler, type EmanetAlani } from "@/lib/emanet";
import { SerifEtiket, siraNo } from "./parcalar";

const tr = (n: number) => n.toLocaleString("tr-TR");

function donemRengi(ad: string): string {
  return donemler.find((d) => d.ad === ad)?.renk ?? "currentColor";
}

/**
 * Emanet bölümlerinin üst satırı: solda serif bölüm etiketi, sağda listenin km sütununun
 * tek başlığı ("COP31'e kuş uçuşu"). Başlık görsel; ekran okuyucu her satırda tam cümleyi duyar.
 */
export function EmanetUst({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <SerifEtiket>{children}</SerifEtiket>
      <span aria-hidden="true" className="text-right text-[12px] leading-tight font-semibold text-[color:var(--dn-koyu)]/80">
        COP31&apos;e kuş uçuşu
      </span>
    </div>
  );
}

/**
 * Emanet bölümlerinin (3 ve 4) 6 satırlık sütun listesi + spot açıklama alanı.
 *
 * Spot sözleşmesi (docs/brief-dunya-2.md §2): DunyaScene bölüm elemanına
 * `data-spot="1…6"` yazar; `data-emanet` / `data-emanet-aciklama` değeri bölüm
 * içindeki SIRA'dır (1–6), sütun numarası değil — 4. bölümde spot=1 → 7. sütun.
 * Sütun numarası `data-alan`'da. Vurgu yalnızca CSS ile (dunya.css "A: spot" bloğu).
 *
 * Açıklamalar aynı ızgara hücresinde üst üste durur (yükseklik = en uzun cümle;
 * spot değişince yerleşim kaymaz). data-spot yok/0 iken 1. açıklama görünür;
 * reduced-motion'da döngü yok ve açıklamaların hepsi alt alta görünür.
 */
export default function EmanetListe({ alanlar }: { alanlar: readonly EmanetAlani[] }) {
  return (
    <>
      <ol className="dn-emanet-liste mt-2">
        {alanlar.map((a, i) => (
          <li
            key={a.no}
            data-emanet={i + 1}
            data-alan={a.no}
            className="dn-emanet-satir grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-1.5 rounded-[10px] px-1 py-[2px]"
          >
            <span aria-hidden="true" className="dn-emanet-no dn-serif text-[24px] leading-none font-semibold tabular-nums">
              {siraNo(a.no)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] leading-[1.15] font-bold text-[color:var(--dn-koyu)]">
                <span className="sr-only">{a.no}. sütun: </span>
                {a.ad}
              </span>
              <span className="mt-[3px] flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-[12.5px] leading-none font-medium text-brand-ink">{a.il}</span>
                <span className="dn-donem-cip">
                  <span aria-hidden="true" className="dn-donem-nokta" style={{ backgroundColor: donemRengi(a.donem) }} />
                  {a.donem}
                </span>
              </span>
            </span>
            {/* Km sütunu: başlığı listenin üstünde bir kez (EmanetUst); ad ile yarışmasın diye 600 ve %80. */}
            <span className="text-right text-[12.5px] leading-none font-semibold whitespace-nowrap text-[color:var(--dn-koyu)]/80 tabular-nums">
              <span className="sr-only">COP31&apos;e kuş uçuşu </span>~{tr(cop31KusUcusuKm(a))} km
            </span>
          </li>
        ))}
      </ol>
      <div className="dn-aciklama mt-2 border-t border-[color:var(--dn-koyu)]/15 pt-2">
        {alanlar.map((a, i) => (
          <p
            key={a.no}
            data-emanet-aciklama={i + 1}
            className="text-[13.5px] leading-[1.36] font-medium text-pretty text-brand-ink"
          >
            <span className="dn-serif font-bold text-[color:var(--dn-koyu)]">{siraNo(a.no)}</span>{" "}
            <span className="font-bold text-[color:var(--dn-koyu)]">{a.ad}:</span> {a.emanet}
          </p>
        ))}
      </div>
    </>
  );
}
