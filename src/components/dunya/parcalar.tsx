import Image from "next/image";
import type { ReactNode } from "react";
import type { PhotoAsset } from "@/lib/photos";

/**
 * Yarı saydam beyaz metin paneli (küre arkada sezilir). max 480px, iç boşluk
 * 20px (sm: 24px). `data-panel`: DunyaScene harita etiketlerini panelin
 * altına girerken söndürmek için ölçer.
 */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-panel
      className={`mx-auto w-full max-w-[480px] rounded-[18px] bg-white/90 p-5 shadow-[0_14px_36px_-16px_rgb(27_79_156/0.38)] ring-1 ring-brand-blue/[0.06] sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function LeafTag({ children }: { children: ReactNode }) {
  return <span className="leaf-tag">{children}</span>;
}

/** Panel başlığı: 900, brand-blue. */
export function Baslik({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-3 text-[26px] leading-[1.12] font-black text-balance text-brand-blue sm:text-[30px]">
      {children}
    </h2>
  );
}

/** Alt başlık: 700, brand-green. */
export function AltBaslik({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-[16px] leading-snug font-bold text-pretty text-brand-green">{children}</p>;
}

/** Gövde: 16px / 1.6, brand-ink. */
export function Govde({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[16px] leading-[1.6] text-pretty text-brand-ink">{children}</p>;
}

/** Büyük sayı + etiket. */
export function Sayi({ value, label, small = false }: { value: string; label: ReactNode; small?: boolean }) {
  return (
    <div className="shrink-0">
      <div
        className={`${small ? "text-[22px]" : "text-[34px]"} leading-none font-black whitespace-nowrap text-brand-blue tabular-nums`}
      >
        {value}
      </div>
      <div className="mt-1 text-[12px] leading-snug font-bold text-brand-green">{label}</div>
    </div>
  );
}

/**
 * Broşür polaroidi: yeşil çerçeve, turuncu pin, hafif döndürülmüş (statik).
 * Panel içinde iki sütunlu küçük kart olarak kullanılır. Fotoğraf next/image,
 * lazy; `sizes` kart genişliğine göre.
 */
export function Polaroid({
  photo,
  caption,
  rotate = 0,
  aspect = "4 / 3",
  position = "50% 50%",
  sizes = "(max-width: 520px) 42vw, 210px",
}: {
  photo: PhotoAsset;
  caption?: string;
  rotate?: number;
  aspect?: string;
  position?: string;
  sizes?: string;
}) {
  return (
    <figure className="polaroid p-1.5" style={{ transform: `rotate(${rotate}deg)` }}>
      <div className="relative w-full overflow-hidden rounded-[6px] bg-brand-mist" style={{ aspectRatio: aspect }}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          className="object-cover"
          style={{ objectPosition: position }}
        />
      </div>
      {caption ? (
        <figcaption className="mt-1.5 px-0.5 text-[11.5px] leading-snug font-bold text-pretty text-brand-ink">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Panel içindeki iki sütunlu küçük polaroid ızgarası (pinler için üstte pay). */
export function PolaroidIkili({ children }: { children: ReactNode }) {
  return <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 px-1 pt-1">{children}</div>;
}

/** Küçük yaprak madde işareti. */
export function YaprakMadde({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[15px] leading-snug font-medium text-brand-ink">
      <span aria-hidden="true" className="mt-[3px] size-3 shrink-0 rounded-[0_60%_0_60%] bg-brand-green" />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

/**
 * Bölümler arası boşluk: küre "nefes alsın" diye ~55vh. Mobilde küre (≈ 0.9 ×
 * ekran genişliği) bu boşluğa sığar; boşluk ekran ortasından geçerken küre
 * tamamen görünür. `svh`: mobil adres çubuğu açılıp kapanırken yükseklik zıplamasın.
 */
export function Bosluk() {
  return <div aria-hidden="true" className="h-[56svh]" />;
}
