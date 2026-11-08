"use client";
/**
 * "← Inside COP31" / "← COP31'in İçinden": ziyaretçi broşüre /icinden'deki düğmeden geldiyse tarayıcı geçmişinde geri
 * gider (dalışın kaldığı yer; yeni bir /icinden yüklemesi açılıştan başlardı). İşaret: /icinden'deki broşür bağlantısı
 * tıklanınca sessionStorage "bro-geldi" = "icinden" (sekmeye özgü; VideoSahne yazar, /icinden'e her gelişte siler).
 * Doğrudan gelindiyse (QR, paylaşılan bağlantı) dile göre /icinden'e gider. JS yokken düz bağlantı.
 *
 * Sayfa değişimi adresi `#p=N` ile history.replaceState'le yazar (kitap.ts): geçmişe giriş eklenmez, bir adım geri
 * /icinden'dir; bu yüzden adresteki `#p=` "broşür içinde çapayla gezildi" sayılmaz (eski web uyarlamasında çapa
 * girdileri vardı, # varken bağlantıya düşülüyordu). Dil değişimi (EN/TR) yeni bir yükleme ve geçmiş girdisidir:
 * orada işaret silinir (goruntuleyici.tsx), bu bağlantı da o dilin /icinden'ine gider; durak yine "icinden-donus"tan
 * (VideoSahne başlangıç bloğu).
 */
import Link from "next/link";
import type { MouseEvent } from "react";
import { type Dil, yol } from "@/lib/dil";
import { YAZI } from "./arayuz";

export const GELDI_ANAHTAR = "bro-geldi";

/** Dil değişiminde (yeni belge, yeni geçmiş girdisi) history.back() artık /icinden'e dönmez: işareti sil. */
export function geldiSil() {
  try {
    sessionStorage.removeItem(GELDI_ANAHTAR);
  } catch {
    // Depolama kapalı.
  }
}

export function GeriBaglanti({ dil, className = "" }: { dil: Dil; className?: string }) {
  const tikla = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    let geldi = false;
    try {
      geldi = sessionStorage.getItem(GELDI_ANAHTAR) === "icinden";
      sessionStorage.removeItem(GELDI_ANAHTAR);
    } catch {
      geldi = false;
    }
    if (geldi && window.history.length > 1) {
      e.preventDefault();
      window.history.back();
    }
  };
  return (
    <Link href={yol(dil, "/icinden")} prefetch={false} onClick={tikla} className={className}>
      <span className="bro-geri-ok" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5m6-6-6 6 6 6" />
        </svg>
      </span>
      <span className="bro-geri-yazi">{YAZI[dil].geri}</span>
    </Link>
  );
}
