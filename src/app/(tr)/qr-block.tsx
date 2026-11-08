"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

type QrState = { url: string; dataUrl: string; lan: boolean };

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * Sayfanın açıldığı adres (window.location.origin). Sayfa geliştirme
 * makinesinde localhost üzerinden açıldıysa ve sunucu bir yerel ağ adresi
 * bildirdiyse, telefonun açabilmesi için o adres kullanılır.
 */
function resolveShareUrl(lanHost: string | null): { url: string; lan: boolean } {
  const { origin, protocol, hostname, port } = window.location;
  if (lanHost && LOCAL_HOSTNAMES.has(hostname)) {
    return { url: `${protocol}//${lanHost}${port ? `:${port}` : ""}`, lan: true };
  }
  return { url: origin, lan: false };
}

export default function QrBlock({ lanHost = null }: { lanHost?: string | null }) {
  const [qr, setQr] = useState<QrState | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { url, lan } = resolveShareUrl(lanHost);
    QRCode.toDataURL(url, {
      width: 400,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1B4F9C", light: "#FFFFFF" },
    })
      .then((dataUrl) => {
        if (!cancelled) setQr({ url, dataUrl, lan });
      })
      .catch(() => {
        if (!cancelled) setQr({ url, dataUrl: "", lan });
      });
    return () => {
      cancelled = true;
    };
  }, [lanHost]);

  const label = qr?.url.replace(/^https?:\/\//, "");

  return (
    <section
      aria-labelledby="qr-baslik"
      className="mt-12 flex flex-col items-center gap-6 rounded-3xl bg-brand-mist px-5 py-8 text-center sm:flex-row sm:gap-8 sm:px-8 sm:text-left"
    >
      <div className="flex size-[200px] shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_8px_24px_-14px_rgb(27_79_156/0.45)]">
        {qr?.dataUrl ? (
          <Image
            src={qr.dataUrl}
            width={184}
            height={184}
            unoptimized
            alt={`${qr.url} adresinin QR kodu`}
            className="size-[184px] [image-rendering:pixelated]"
          />
        ) : (
          <div className="size-[184px] rounded-lg bg-brand-mist" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0">
        <h2 id="qr-baslik" className="text-lg leading-tight font-black text-brand-blue">
          Telefonda açın
        </h2>
        <p className="mt-2 text-sm leading-relaxed">
          {qr?.lan
            ? "Telefonunuzun kamerasıyla okutun. Telefon bu bilgisayarla aynı Wi-Fi ağında olmalı."
            : "Telefonunuzun kamerasıyla okutun; konseptler doğrudan telefonda açılır."}
        </p>
        <p className="mt-3 min-h-6 text-base font-bold break-all text-brand-navy">{label ?? " "}</p>
      </div>
    </section>
  );
}
