"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { photos } from "@/lib/photos";
import { dAbone } from "./derinlik";

/* cobe ayarları (KUREGL) kure-gl.ts'te: harita verisi istemci paketine girmesin. */

/** Arka kapak fotoğrafı yalnızca d ≥ 7'de bağlanır (görsel kapısı; loading="lazy" bu yerleşimde ertelemiyor). */
function ArkaKapakFoto() {
  const [ac, setAc] = useState(false);
  useEffect(() => dAbone((d) => d >= 6.9 && setAc(true)), []);
  if (!ac) return null;
  return (
    <div className="ics-kure-foto" data-ic-d="8.9 8.55">
      <Image
        src={photos.globeFoliage.src}
        width={photos.globeFoliage.width}
        height={photos.globeFoliage.height}
        alt=""
        sizes="(max-width: 600px) 92vw, 720px"
        loading="eager"
        className="h-full w-full object-cover"
        style={{ objectPosition: "50% 56%" }}
      />
    </div>
  );
}

/**
 * Küre katmanı (d1 "kure", d9 "kure2"): kutu = küre diski. Küreyi cobe çizer (canvas sahnede
 * kardeş). Burada: WebGL yoksa ya da bağlam kaybolduysa CSS diski (sahne [data-gl="yok"]); kure2'de
 * arka kapaktaki küre fotoğrafı (dalış sırasında açık cobe küresine çözülür).
 */
export function KureKatmani({ ikinci = false }: { ikinci?: boolean }) {
  return (
    <>
      <div className="ics-kure-yedek" aria-hidden="true" />
      {ikinci ? <ArkaKapakFoto /> : null}
    </>
  );
}
