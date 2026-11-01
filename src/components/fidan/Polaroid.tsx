import Image from "next/image";
import type { PhotoAsset } from "@/lib/photos";

type Props = {
  photo: PhotoAsset;
  caption?: string;
  /** Yüzlere göre kırpma noktası (object-position). */
  pos?: string;
  rot?: number;
  aspect?: "4/3" | "3/4" | "1/1";
  sizes: string;
  className?: string;
  /** Üçlü sıra için daha ince çerçeve/boşluk (kart ~100 px genişlikte). */
  compact?: boolean;
};

/** Broşürdeki yeşil çerçeveli polaroid kart + üstte turuncu pin. */
export default function Polaroid({
  photo,
  caption,
  pos = "50% 50%",
  rot = 0,
  aspect = "4/3",
  sizes,
  className = "",
  compact = false,
}: Props) {
  const ratio = aspect === "4/3" ? "aspect-[4/3]" : aspect === "3/4" ? "aspect-[3/4]" : "aspect-square";
  return (
    <figure
      className={`relative border-brand-green bg-white shadow-[0_1px_2px_rgb(0_0_0/0.06),0_8px_20px_-6px_rgb(27_79_156/0.28)] ${
        compact ? "rounded-[11px] border-[2.5px] p-[3.5px]" : "rounded-[14px] border-[3px] p-[5px]"
      } ${className}`}
      style={{ transform: rot ? `rotate(${rot}deg)` : undefined }}
    >
      <span
        aria-hidden="true"
        className={`absolute left-1/2 z-10 rounded-full bg-brand-orange shadow-[inset_0_-2px_0_rgb(0_0_0/0.14),0_1px_3px_rgb(0_0_0/0.3)] ${
          compact ? "-top-[7px] -ml-[6px] size-[12px]" : "-top-[8px] -ml-[7px] size-[14px]"
        }`}
      />
      <div className={`relative ${ratio} overflow-hidden bg-brand-mist ${compact ? "rounded-[7px]" : "rounded-[8px]"}`}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          className="object-cover"
          style={{ objectPosition: pos }}
        />
      </div>
      {caption ? (
        <figcaption
          className={`text-center leading-snug font-bold text-brand-navy ${
            compact ? "truncate pt-1 text-[10.5px] md:text-[12px]" : "px-1 pt-1.5 pb-0.5 text-[11px]"
          }`}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
