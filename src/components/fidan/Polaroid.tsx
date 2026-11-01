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
};

/** Broşürdeki yeşil çerçeveli polaroid kart + üstte turuncu pin. */
export default function Polaroid({ photo, caption, pos = "50% 50%", rot = 0, aspect = "4/3", sizes, className = "" }: Props) {
  const ratio = aspect === "4/3" ? "aspect-[4/3]" : aspect === "3/4" ? "aspect-[3/4]" : "aspect-square";
  return (
    <figure
      className={`relative rounded-[14px] border-[3px] border-brand-green bg-white p-[5px] shadow-[0_1px_2px_rgb(0_0_0/0.06),0_8px_20px_-6px_rgb(27_79_156/0.28)] ${className}`}
      style={{ transform: rot ? `rotate(${rot}deg)` : undefined }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-[8px] left-1/2 z-10 -ml-[7px] size-[14px] rounded-full bg-brand-orange shadow-[inset_0_-2px_0_rgb(0_0_0/0.14),0_1px_3px_rgb(0_0_0/0.3)]"
      />
      <div className={`relative ${ratio} overflow-hidden rounded-[8px] bg-brand-mist`}>
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
        <figcaption className="px-1 pt-1.5 pb-0.5 text-center text-[11px] leading-snug font-bold text-brand-navy">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
