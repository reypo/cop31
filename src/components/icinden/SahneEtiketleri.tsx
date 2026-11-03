import type { CSSProperties } from "react";
import DunyaYaylari, { KunyeMetin } from "./DunyaYaylari";
import EmanetBaglari, { emanetIsigi } from "./EmanetIsiklari";
import type { Durak, Etiket } from "./klipler";
import { dizinler } from "./rol";

/**
 * Sahne etiketleri (brief-icinden-3 §5, §9.1): manifest çapalarından, sunucuda çizilir (istemci JS'i yok).
 * Konum video uzayında; sahne kabı `container-type: size` olduğundan cover dönüşümü CSS'te
 * (`left: calc(50% + (x − cx) · s)`, s = max(100cqw / 720, 100cqh / 1280); yatayda 1280×720 seti). Bir
 * yönde kırpımda kalan çapa o yönde yoktur (`data-yok`).
 *
 * Haritacılık kuralı: doğa (su, dağ, ada) Lora 500 italik; yapı (yer, yol, yapı) Montserrat 600 + 3 px hale.
 * d4 bölge etiketleri numarasız, ≤ 40 px kılavuz çizgiyle parçaya bağlı; spot döngüsünde etkin olmayan %60.
 * Görünürlük kökün `data-etiket="k"` özniteliğiyle (300 ms, birlikte).
 *
 * E turu (W2a, §12.4-2/3): d1/d11 ışık yayları (DunyaYaylari) ve d2 bağları (EmanetBaglari) aynı katmanda, etiketlerin
 * altında. `kunye` (d1 Antalya): 18 px kılavuz + "Antalya" + SSR satırı (KunyeSatiri, mount sonrası gün sayacı).
 * `emanet` (d2): dönem renkli çekirdek + numara (ad yok); varış dizisi ve ofsetler CSS değişkeninde (icinden3-isik.css).
 */
export default function SahneEtiketleri({ duraklar }: { duraklar: readonly Durak[] }) {
  const I = dizinler(duraklar.map((d) => d.rol));
  return (
    <div className="v3-etiketler">
      <DunyaYaylari D={duraklar[I.dunya]} />
      <EmanetBaglari D={duraklar[I.emanet]} />
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
          // d2'de Antalya d1'in buluşma çekirdeğini kullanır (denetim D1-06: 3 px nokta, 05'in çekirdeğinin yanında
          // en zayıf işaretti; bağlar bu noktada buluşuyor).
          const cekirdek = k === I.emanet && ad === "antalya";
          return <EtiketEl key={`${k}-${ad}`} k={k} t={t} stil={stil} yok={yok} cekirdek={cekirdek} />;
        });
      })}
    </div>
  );
}

function EtiketEl({ k, t, stil, yok, cekirdek }: { k: number; t: Etiket; stil: CSSProperties; yok?: string; cekirdek?: boolean }) {
  if (t.tur === "kunye")
    return (
      <div data-d={k} data-yok={yok} className="v3-et v3-et-kunye" style={stil}>
        <span className="v3-kunye-cizgi" />
        <KunyeMetin metin={t.metin} />
      </div>
    );
  if (t.tur === "emanet")
    return (
      <div data-d={k} data-yok={yok} className="v3-et v3-et-emanet" style={{ ...stil, ...emanetIsigi(t) }}>
        <span className="v3-em-isik">
          <span className="v3-em-cekirdek" />
          <span className="v3-em-no">{String(t.no ?? 0).padStart(2, "0")}</span>
        </span>
      </div>
    );
  return (
    <div
      data-d={k}
      data-no={t.no}
      data-yok={yok}
      className={`v3-et v3-et-${t.tur}${t.nokta ? " v3-et-noktali" : ""}${cekirdek ? " v3-et-cekirdekli" : ""}`}
      style={stil}
    >
      {cekirdek ? <span className="v3-yay-cekirdek" /> : t.nokta || t.tur === "bolge" ? <span className="v3-et-nokta" /> : null}
      {t.tur === "bolge" ? <span className="v3-et-cizgi" /> : null}
      <span className="v3-et-metin">{t.metin}</span>
    </div>
  );
}
