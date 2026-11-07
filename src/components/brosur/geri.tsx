"use client";
/**
 * "← COP31'in İçinden": ziyaretçi broşüre /icinden'deki düğmeden geldiyse tarayıcı geçmişinde geri gider (dalışın
 * kaldığı yer; yeni bir /icinden yüklemesi açılıştan başlardı). İşaret: /icinden'deki broşür bağlantısı tıklanınca
 * sessionStorage "bro-geldi" (sekmeye özgü; VideoSahne yazar, /icinden'e her gelişte siler). Doğrudan gelindiyse (QR,
 * paylaşılan bağlantı) /icinden'e gider. JS yokken düz bağlantı.
 * Broşür içi çapa (İçindekiler, "Aşağı kaydır") geçmişe aynı belgede `/brosur#…` girdisi ekler: adreste # varken bir adım
 * geri broşürde kalırdı (sayfa yukarı zıplıyor, işaret de siliniyordu). O durumda bağlantı /icinden'e gider; durak yine
 * "icinden-donus"tan (VideoSahne başlangıç bloğu), sonuç aynı.
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
    if (geldi && window.history.length > 1 && !window.location.hash) {
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
