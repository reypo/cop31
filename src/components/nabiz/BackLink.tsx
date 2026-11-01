import Link from "next/link";

/** Sol üstte küçük, sabit "← Konseptler" bağlantısı (koyu ve beyaz zeminde okunur). */
export default function BackLink() {
  return (
    <Link
      href="/"
      className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] z-50 inline-flex items-center gap-1.5 rounded-full bg-[#0B2A4A]/95 px-3 py-1.5 text-xs font-bold text-[#EAF2FA] shadow-[0_6px_16px_-8px_rgb(0_0_0/0.6)] ring-1 ring-white/15 transition-colors hover:bg-[#0B2A4A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7CC4F0]"
    >
      <span aria-hidden="true">←</span>
      Konseptler
    </Link>
  );
}
