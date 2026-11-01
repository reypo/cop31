import Link from "next/link";

/** Sol üstte küçük sabit "← Konseptler" linki. */
export default function BackLink() {
  return (
    <Link
      href="/"
      className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-3 z-50 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[12px] leading-none font-bold text-brand-navy shadow-[0_2px_10px_-4px_rgb(27_79_156/0.45)] transition-colors hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
    >
      <span aria-hidden="true">←</span> Konseptler
    </Link>
  );
}
