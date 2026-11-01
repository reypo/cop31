import Image from "next/image";
import type { PhotoAsset } from "@/lib/photos";

type PolaroidProps = {
  photo: PhotoAsset;
  /** next/image sizes; kartın ekrandaki genişliğine göre. */
  sizes: string;
  /** Derece (broşürdeki gibi −3…+4). */
  rotate?: number;
  /** CSS aspect-ratio, ör. "4 / 3". */
  aspect: string;
  /** Yüzlere göre kırpma noktası, ör. "50% 30%". */
  objectPosition?: string;
  caption?: string;
  className?: string;
};

/** Broşür polaroid kartı: yeşil çerçeve, turuncu pin (globals.css .polaroid). */
export default function Polaroid({
  photo,
  sizes,
  rotate = 0,
  aspect,
  objectPosition = "50% 50%",
  caption,
  className = "",
}: PolaroidProps) {
  return (
    <figure className={`polaroid ${className}`} style={{ rotate: `${rotate}deg` }}>
      <div className="relative w-full overflow-hidden rounded-[6px] bg-brand-mist" style={{ aspectRatio: aspect }}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          className="object-cover"
          style={{ objectPosition }}
        />
      </div>
      {caption ? (
        <figcaption className="px-1 pt-2 pb-0.5 text-[12px] leading-snug font-medium text-brand-ink">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
