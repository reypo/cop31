import type { CSSProperties } from "react";
import type { Durak, Etiket } from "./klipler";

/**
 * Sahne etiketleri (brief-icinden-3 §5, §9.1): manifest çapalarından, sunucuda çizilir (istemci JS'i yok).
 * Konum video uzayında; sahne kabı `container-type: size` olduğundan cover dönüşümü CSS'te
 * (`left: calc(50% + (x − cx) · s)`, s = max(100cqw / 720, 100cqh / 1280); yatayda 1280×720 seti). Bir
 * yönde kırpımda kalan çapa o yönde yoktur (`data-yok`).
 *
 * Haritacılık kuralı: doğa (su, dağ, ada) Lora 500 italik; yapı (yer, yol, yapı) Montserrat 600 + 3 px hale.
 * d4 bölge etiketleri numarasız, ≤ 40 px kılavuz çizgiyle parçaya bağlı; spot döngüsünde etkin olmayan %60.
 * Görünürlük kökün `data-etiket="k"` özniteliğiyle (300 ms, birlikte).
 */
export default function SahneEtiketleri({ duraklar }: { duraklar: readonly Durak[] }) {
  return (
    <div className="v3-etiketler">
      {duraklar.map((D, k) => {
        const e = D.etiketler;
        if (!e) return null;
        // Aynı ad iki yönde tek eleman: konumlar CSS değişkeninde.
        const adlar = [...new Set([...e.dikey, ...e.yatay].map((x) => x.ad))];
        return adlar.map((ad) => {
          const d = e.dikey.find((x) => x.ad === ad);
          const y = e.yatay.find((x) => x.ad === ad);
          const t = (d ?? y)!;
          const stil = {
            "--xd": d?.x ?? 0,
            "--yd": d?.y ?? 0,
            "--xy": y?.x ?? 0,
            "--yy": y?.y ?? 0,
          } as CSSProperties;
          const yok = !d ? "dikey" : !y ? "yatay" : undefined;
          return <EtiketEl key={`${k}-${ad}`} k={k} t={t} stil={stil} yok={yok} />;
        });
      })}
    </div>
  );
}

function EtiketEl({ k, t, stil, yok }: { k: number; t: Etiket; stil: CSSProperties; yok?: string }) {
  return (
    <div data-d={k} data-no={t.no} data-yok={yok} className={`v3-et v3-et-${t.tur}${t.nokta ? " v3-et-noktali" : ""}`} style={stil}>
      {t.nokta || t.tur === "bolge" ? <span className="v3-et-nokta" /> : null}
      {t.tur === "bolge" ? <span className="v3-et-cizgi" /> : null}
      <span className="v3-et-metin">{t.metin}</span>
    </div>
  );
}
