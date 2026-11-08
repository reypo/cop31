"""Dijital broşür sayfa metinleri: müşterinin görüntüleyicisindeki `PAGES` dizisini TS veri modülüne aktarır.

    python -I scripts/brosur/metin-aktar.py <COP31_Brosur_EN.html> <COP31_Brosur_TR.html> [çıktı .ts]

Girdi güvenilmeyen veri: HTML yalnız metin olarak okunur (betik çalıştırılmaz); `const PAGES = [...]` satırı JSON
olarak ayrıştırılır, her sayfanın `text` parçası izinli etiketlerden (p, h2, h3, ul/ol, li, a, span) yapısal bloklara
çevrilir; tanınmayan etiket ya da sınıf hata verir (sessizce HTML taşınmasın). Çıktı varsayılanı
src/components/brosur/metin.ts (elle düzenleme yok: bu betikle yeniden üret).
"""

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

KOK = Path(__file__).resolve().parents[2]


class Ayristir(HTMLParser):
    """PAGES[i].text → bloklar: baslik | etiket | ara | p | liste | icindekiler."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.bloklar = []
        self.yigin = []  # (etiket, sınıf)
        self.metin = None  # açık blok metni
        self.liste = None
        self.toc = None
        self.oge = None  # içindekiler öğesi

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        sinif = a.get("class", "")
        self.yigin.append((tag, sinif))
        if tag in ("p", "h2", "h3"):
            tur = {"t-title": "baslik", "t-label": "etiket", "t-head": "ara", "": "p", "muted": "p"}.get(sinif)
            if tur is None:
                raise ValueError(f"tanınmayan sınıf <{tag} class={sinif}>")
            self.metin = [tur, ""]
        elif tag == "ul":
            self.liste = []
        elif tag == "ol":
            if sinif != "toc":
                raise ValueError(f"tanınmayan <ol class={sinif}>")
            self.toc = []
        elif tag == "li":
            if self.liste is not None:
                self.liste.append("")
        elif tag == "a":
            m = re.fullmatch(r"#p=(\d+)", a.get("href", ""))
            if self.toc is None or not m:
                raise ValueError(f"beklenmeyen bağlantı {a}")
            self.oge = {"p": int(m.group(1)), "bolum": "", "ad": "", "_": None}
        elif tag == "span":
            if self.oge is None or sinif not in ("chip", "pg"):
                raise ValueError(f"beklenmeyen <span class={sinif}>")
            self.oge["_"] = sinif
        else:
            raise ValueError(f"tanınmayan etiket <{tag}>")

    def handle_endtag(self, tag):
        t, _ = self.yigin.pop()
        if t != tag:
            raise ValueError(f"etiket dengesi bozuk: <{t}> … </{tag}>")
        if tag in ("p", "h2", "h3") and self.metin:
            tur, m = self.metin
            self.bloklar.append({"t": tur, "m": tidy(m)})
            self.metin = None
        elif tag == "ul":
            self.bloklar.append({"t": "liste", "m": [tidy(x) for x in self.liste]})
            self.liste = None
        elif tag == "ol":
            self.bloklar.append({"t": "icindekiler", "m": self.toc})
            self.toc = None
        elif tag == "span" and self.oge is not None:
            self.oge["_"] = None
        elif tag == "a":
            o = self.oge
            self.toc.append({"p": o["p"], "bolum": tidy(o["bolum"]), "ad": tidy(o["ad"])})
            self.oge = None

    def handle_data(self, data):
        if self.oge is not None:
            if self.oge["_"] == "chip":
                self.oge["bolum"] += data
            elif self.oge["_"] is None:
                self.oge["ad"] += data
            # "pg" (sayfa numarası) atlanır: `p` alanından gelir.
        elif self.metin is not None:
            self.metin[1] += data
        elif self.liste is not None and self.yigin and self.yigin[-1][0] == "li":
            self.liste[-1] += data
        elif data.strip():
            raise ValueError(f"blok dışında metin: {data!r}")


def tidy(s):
    return re.sub(r"\s+", " ", s).strip()


def oku(yol):
    html = Path(yol).read_text(encoding="utf-8")
    m = re.search(r"^const PAGES = (\[.*\]);\s*$", html, re.M)
    if not m:
        raise SystemExit(f"{yol}: PAGES dizisi bulunamadı")
    sayfalar = json.loads(m.group(1))
    cikti = []
    for i, s in enumerate(sayfalar, 1):
        if s["n"] != i:
            raise SystemExit(f"{yol}: sayfa sırası bozuk ({s['n']} ≠ {i})")
        a = Ayristir()
        a.feed(s["text"])
        a.close()
        cikti.append({"ad": s["label"], "bolum": s["sec"], "bloklar": a.bloklar})
    return cikti


def js(d):
    """Tek satır TS değeri (anahtarlar tırnaksız)."""
    if isinstance(d, dict):
        return "{ " + ", ".join(f"{k}: {js(v)}" for k, v in d.items()) + " }"
    if isinstance(d, list):
        return "[" + ", ".join(js(v) for v in d) + "]"
    return json.dumps(d, ensure_ascii=False)


def ts(sayfalar):
    """Sayfa başına bir nesne, blok başına bir satır."""
    satirlar = ["["]
    for i, s in enumerate(sayfalar, 1):
        satirlar.append(f"    // {i}")
        satirlar.append(f"    {{ ad: {js(s['ad'])}, bolum: {js(s['bolum'])}, bloklar: [")
        for b in s["bloklar"]:
            satirlar.append(f"      {js(b)},")
        satirlar.append("    ] },")
    satirlar.append("  ]")
    return "\n".join(satirlar)


def duzelt(sayfalar, ad):
    """PDF'le hizalama (7 Kasım 2026): müşterinin PAGES verisinde 12. sayfaya (fotoğraf + "LEADERSHIP SCHOOL" başlığı)
    konmuş iki paragraf ("We are a great school…", "Through the Organization Academies…") PDF'te 13. sayfanın başında.
    Başlık 12'de kalır, paragraflar 13'ün başına taşınır. Veri değişirse sessizce yanlış taşımasın diye biçim denetlenir."""
    s12, s13 = sayfalar[11], sayfalar[12]
    turler = [b["t"] for b in s12["bloklar"]]
    if turler != ["baslik", "p", "p"]:
        raise SystemExit(f"{ad}: 12. sayfa beklenen biçimde değil ({turler}); duzelt() gözden geçirilmeli")
    s13["bloklar"] = s12["bloklar"][1:] + s13["bloklar"]
    s12["bloklar"] = s12["bloklar"][:1]
    return sayfalar


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    en, tr = duzelt(oku(sys.argv[1]), "EN"), duzelt(oku(sys.argv[2]), "TR")
    if len(en) != len(tr):
        raise SystemExit("EN/TR sayfa sayısı farklı")
    hedef = Path(sys.argv[3]) if len(sys.argv) > 3 else KOK / "src/components/brosur/metin.ts"
    govde = f"""/**
 * Dijital broşür sayfa metinleri (Text / Metin paneli ve ekran okuyucu metni). Kaynak: müşterinin görüntüleyicisindeki
 * `PAGES` dizisi (COP31_Brosur_EN.html / _TR.html, 7 Kasım 2026). ÜRETİLMİŞ DOSYA: scripts/brosur/metin-aktar.py —
 * elle düzenleme yapma, betiği yeniden çalıştır.
 */
import type {{ Dil }} from "@/lib/dil";

/** baslik: sayfa başlığı · etiket: üst etiket (ör. "Meeting 1") · ara: ara başlık · p: paragraf · liste: madde listesi ·
 * icindekiler: İçindekiler sayfasının bölüm listesi (p = hedef sayfa). */
export type Blok =
  | {{ t: "baslik" | "etiket" | "ara" | "p"; m: string }}
  | {{ t: "liste"; m: readonly string[] }}
  | {{ t: "icindekiler"; m: readonly {{ p: number; bolum: string; ad: string }}[] }};

export type SayfaMetni = {{ ad: string; bolum: number | null; bloklar: readonly Blok[] }};

export const METIN: Record<Dil, readonly SayfaMetni[]> = {{
  en: {ts(en)},
  tr: {ts(tr)},
}};
"""
    hedef.write_text(govde, encoding="utf-8", newline="\n")
    print(f"{hedef}: {len(en)} sayfa, {hedef.stat().st_size} bayt")


if __name__ == "__main__":
    main()
