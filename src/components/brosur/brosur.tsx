/**
 * Konsept D — "Dijital Broşür" (/brosur).
 * Broşürün 12 sayfası tam ekran <section>'lar hâlinde; belge scroll'u
 * üzerinde y proximity snap. Tek etkileşim dikey kaydırma.
 */

import Link from "next/link";
import { BackCover } from "./closing";
import { Cover } from "./cover";
import {
  AkGenclik,
  BaskanMesaji,
  BizKimiz,
  Bulusmalar,
  Contents,
  Kapanis,
  Kolaj,
  Reform,
  Solenler,
  Vizyon,
} from "./pages";
import { BrosurShell } from "./shell";
import "./brosur.css";

export function Brosur() {
  return (
    <BrosurShell leafCount={11}>
      <Link
        href="/"
        className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] z-50 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-bold text-brand-blue shadow-[0_4px_14px_-6px_rgb(27_79_156/0.45)] backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        ← Konseptler
      </Link>
      <main>
        <Cover />
        <Contents />
        <AkGenclik />
        <BaskanMesaji />
        <BizKimiz />
        <Vizyon />
        <Reform />
        <Bulusmalar />
        <Solenler />
        <Kapanis />
        <Kolaj />
        <BackCover />
      </main>
    </BrosurShell>
  );
}
