import Image from "next/image";
import type { ReactNode } from "react";
import type { PhotoAsset } from "@/lib/photos";

/**
 * Yarı saydam beyaz metin paneli (küre arkada sezilir). max 480px, iç boşluk
 * 20px (sm: 24px). `data-panel`: DunyaScene ölçer — küre pozu (panelin
 * üstündeki/solundaki sahne alanı), bölüm geçişinde panelin sönüp belirmesi
 * ve harita etiketlerinin panel altına girerken sönmesi.
 */
export function Panel({
  children,
  className = "",
  krem = false,
}: {
  children: ReactNode;
  className?: string;
  /** Stant teması (Emanet ve Stantta bölümleri): krem zemin, koyu yeşil başlık; bkz. dunya.css `.dn-krem`. */
  krem?: boolean;
}) {
  return (
    <div
      data-panel
      className={`dn-panel mx-auto w-full max-w-[480px] rounded-[18px] p-5 sm:p-6 ${
        krem
          ? "dn-krem" /* gölge ve kontur dunya.css .dn-krem'de (tek kaynak) */
          : "bg-white/90 shadow-[0_14px_36px_-16px_rgb(27_79_156/0.38)] ring-1 ring-brand-blue/[0.06]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function LeafTag({ children }: { children: ReactNode }) {
  return <span className="leaf-tag">{children}</span>;
}

/** Stant dilinde bölüm etiketi: koyu yeşil zemin, krem serif yazı (LeafTag'in krem tema karşılığı). */
export function SerifEtiket({ children }: { children: ReactNode }) {
  return <span className="dn-serif-etiket dn-serif">{children}</span>;
}

/** Sütun yüzlerindeki gibi iki haneli serif sıra numarası ("05"). */
export function siraNo(n: number): string {
  return String(n).padStart(2, "0");
}

/** Panel başlığı: 900, brand-blue. */
export function Baslik({ children }: { children: ReactNode }) {
  return (
    <h2 className="dn-baslik mt-3 text-[26px] leading-[1.12] font-black text-balance text-brand-blue sm:text-[30px]">
      {children}
    </h2>
  );
}

/** Alt başlık: 700, brand-green. */
export function AltBaslik({ children }: { children: ReactNode }) {
  return <p className="dn-altbaslik mt-2 text-[16px] leading-snug font-bold text-pretty text-brand-green">{children}</p>;
}

/**
 * Gövde: 16px / 1.6, brand-ink. `kompakt`: 15px / 1.5 — uzun paragraflı panellerin
 * 390×844'te sahne alanının altına (≈440 px) sığması için.
 */
export function Govde({ children, kompakt = false }: { children: ReactNode; kompakt?: boolean }) {
  return (
    <p
      className={`dn-govde text-pretty text-brand-ink ${kompakt ? "mt-2.5 text-[15px] leading-[1.5]" : "mt-3 text-[16px] leading-[1.6]"}`}
    >
      {children}
    </p>
  );
}

/** Büyük sayı + etiket. */
export function Sayi({ value, label, small = false }: { value: string; label: ReactNode; small?: boolean }) {
  return (
    <div className="dn-sayi shrink-0">
      <div
        className={`dn-sayi-deger ${small ? "text-[22px]" : "text-[34px]"} leading-none font-black whitespace-nowrap text-brand-blue tabular-nums`}
      >
        {value}
      </div>
      <div className="mt-1 text-[12px] leading-snug font-bold text-brand-teal">{label}</div>
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
  /** Alt yazı; satır sonu gerekiyorsa <br /> içeren ReactNode (kırılım kontrolü). */
  caption?: ReactNode;
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
        <figcaption className="dn-polaroid-yazi mt-1.5 px-0.5 text-[11.5px] leading-snug font-bold text-balance text-brand-ink">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Panel içindeki iki sütunlu küçük polaroid ızgarası (pinler için üstte pay). */
export function PolaroidIkili({ children, className = "mt-4" }: { children: ReactNode; className?: string }) {
  return <div className={`dn-polaroid-ikili grid grid-cols-2 gap-x-4 gap-y-5 px-1 pt-1 ${className}`}>{children}</div>;
}

/** Küçük yaprak madde işareti. */
export function YaprakMadde({ children }: { children: ReactNode }) {
  return (
    <li className="dn-madde flex gap-2.5 text-[15px] leading-snug font-medium text-brand-ink">
      <span aria-hidden="true" className="mt-[3px] size-3 shrink-0 rounded-[0_60%_0_60%] bg-brand-green" />
      <span className="min-w-0">{children}</span>
    </li>
  );
}
