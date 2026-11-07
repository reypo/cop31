"use client";
/**
 * "← COP31'in İçinden": ziyaretçi broşüre /icinden'deki düğmeden geldiyse tarayıcı geçmişinde geri gider (dalışın
 * kaldığı yer; yeni bir /icinden yüklemesi açılıştan başlardı). İşaret: /icinden'deki broşür bağlantısı tıklanınca
 * sessionStorage "bro-geldi" (sekmeye özgü; VideoSahne yazar). Doğrudan gelindiyse (QR, paylaşılan bağlantı) /icinden'e
 * gider. JS yokken düz bağlantı.
 */
import Link from "next/link";
import type { MouseEvent } from "react";

export const GELDI_ANAHTAR = "bro-geldi";

export function GeriBaglanti({ className = "" }: { className?: string }) {
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
    <Link href="/icinden" prefetch={false} onClick={tikla} className={className}>
      <span aria-hidden="true">←</span> COP31&apos;in İçinden
    </Link>
  );
}
