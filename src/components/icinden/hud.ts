import type { Oynatici } from "./oynatici";

/**
 * Cihazda akıcılık göstergesi (`/icinden?hud=1`; akıcılık turu): gerçek iPhone'da Web Denetçisi olmadan okunur sayılar.
 * Yalnız sorguyla, ayrı parça olarak yüklenir (rota JS'ine girmez). Satırlar:
 *  1. seçilen kodek · yön (· poster kipi · otomatik oynatma ENGELİ)
 *  2. son geçiş: klip, jest → ilk yeni kare (ms), devir = geçişin son karesi → döngünün ilk yeni karesi (ms; 30 fps'de
 *     ideal ≈ 33), düşen/çözülen kare (getVideoPlaybackQuality), yedek nedeni
 *  3. bütün geçişlerin ortancaları ve toplamları
 *  4. ana iş parçacığı: > 25 ms / > 50 ms rAF aralığı (sayfa açıldığından beri; 60 Hz'de > 25 ms = en az bir kare kaçtı),
 *     play() başlama gecikmesi tahmini (ön sarmanın öncülüğü)
 */
export function hudKur(oy: Oynatici): () => void {
  const el = document.createElement("pre");
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, {
    position: "fixed",
    left: "8px",
    bottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
    zIndex: "99",
    margin: "0",
    padding: "6px 8px",
    font: "11px/1.35 ui-monospace, Menlo, monospace",
    color: "#fff",
    background: "rgb(0 0 0 / 0.72)",
    borderRadius: "6px",
    pointerEvents: "none",
    whiteSpace: "pre",
  });
  document.body.appendChild(el);
  let son = 0;
  let n25 = 0;
  let n50 = 0;
  let rafId = 0;
  const kare = (t: number) => {
    if (son && !document.hidden) {
      const g = t - son;
      if (g > 25) n25++;
      if (g > 50) n50++;
    }
    son = t;
    rafId = requestAnimationFrame(kare);
  };
  rafId = requestAnimationFrame(kare);
  const p50 = (a: number[]) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : "-");
  const sayi = (a: (number | undefined)[]) => a.filter((x): x is number => typeof x === "number");
  const yaz = () => {
    const k = oy.olaylar.filter((x) => x.klip);
    const s = k.at(-1);
    const dusen = sayi(k.map((x) => x.dusen)).reduce((a, b) => a + b, 0);
    const cozulen = sayi(k.map((x) => x.cozulen)).reduce((a, b) => a + b, 0);
    el.textContent = [
      `kodek ${oy.kodek} · ${oy.boyut}${oy.posterKipi ? " · poster" : ""}${oy.engel ? " · ENGEL" : ""}`,
      `son ${s?.klip ?? "-"} ilk ${s?.ilkKareMs ?? "-"} devir ${s?.devirMs ?? "-"} düşen ${s?.dusen ?? "-"}/${s?.cozulen ?? "-"}${s?.yedek ? ` YEDEK ${s.yedek}` : ""}`,
      `p50 ilk ${p50(sayi(k.map((x) => x.ilkKareMs)))} devir ${p50(sayi(k.map((x) => x.devirMs)))} · düşen ${dusen}/${cozulen} · yedek ${k.filter((x) => x.yedek).length}`,
      `kare >25ms ${n25} · >50ms ${n50} · başla ${Math.round(oy.baslamaMs)}`,
    ].join("\n");
  };
  yaz();
  const id = window.setInterval(yaz, 500);
  return () => {
    window.clearInterval(id);
    cancelAnimationFrame(rafId);
    el.remove();
  };
}
