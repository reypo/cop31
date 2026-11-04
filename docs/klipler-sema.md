# `/icinden` v3 klip manifesti — şema ve üretim yolu

Tarih: 2 Kasım 2026 (A turu, W; B turu ön entegrasyonu: önizleme render'ı, t34 birleşimi, kapak tonu); E turu (3 Kasım
2026, W1): `surum: 2`, 12 durak + `rol`, §0; **G turu (4 Kasım 2026, k-kod): `surum: 3`, 13 durak (masa + fidan), §0.2 —
§0 ile çelişirse §0.2 geçerli**. Bağlayıcı karar: `docs/brief-icinden-3.md` §9.3–§9.5, §12.1, §12.4-9, §14.4. Oynatıcı mimarisi:
`docs/klip-oynatma.md`. Bu belge **Blender ekibi (S1, S2), kodlama ajanı ve site (W) arasındaki sözleşmedir.**
A turunda manifest yer tutucu kliplerle üretildi (`"kaynak": "yer-tutucu"`); B turunda yalnız girdiler değişir,
yol ve şema aynı kalır.

## 0. E turu: durak tablosu veride (`surum: 2`, brief §12.1, §12.4-1, §12.4-9)

Durak tablosu `scripts/icinden/manifest-birlestir.mjs` `DURAKLAR`'da ve manifestte (`duraklar[].rol`, sıra = durak
numarası, `id` "d0"…"d11"). Site numara yazmaz: `src/components/icinden/rol.ts` `dizinler()` rol tablosundan durak
numaralarını türetir (VideoSahne kesişme/dalış/sayfa dalları, kapanış = N, spot ve kiosk dinlenmesi), CSS yalnız kök
özniteliklerinin rol eşleriyle seçer (`data-rol`, `data-hedef-rol`, `data-metin-rol`, `data-dinlenme-rol`; bant ve
bölüm `data-rol`), Brosur sayfa dizinlerini prop olarak alır (`brosurDizini`). Kapanış manifest dışı: dizin N = 12,
kök rolü `kapanis`. Bir durak eklemek/çıkarmak (ör. §12.7-1 K3: d7 kalkar) = `DURAKLAR` satırı + Icinden3'te o rolün
bölümü; oynatıcı ve CSS değişmez.

| id | rol | tur | gelen (ileri) | ileri / geri | döngü | poster | okuma (dinlenme) |
|---|---|---|---|---|---|---|---|
| d0 | lombar | dom | — | t01 / r10 | — | — | — |
| d1 | dunya | klip | t01 | t12 / r21 | l1 | p1 | kadraj (t01) |
| d2 | emanet | klip | t12 | t23 / r32 | l2 | p2 | kadraj (t12) |
| d3 | expo | klip | t23 | t34 / r43 | l3 | p3 | kadraj (t23) |
| d4 | anatomi | klip | t34 | t45 / r54 | l4 | p4 | kadraj (t34) |
| d5 | sutunlar | klip | t45 | t56 / r65 | l5 | p5 | kadraj (t45) |
| d6 | duvar | klip | t56 | t67 / r76 | **yok** (t56 son karesinde durur) | p6 (son-kare) | "arka duvar · ~3 m" |
| d7 | duvar | klip | t67 | t78 / r87 | **yok** (t67 son karesinde durur) | p7 (son-kare) | "sol duvar · ~3 m" |
| d8 | brosur-kapak | dom | t78 (+ 200 ms kesişme + 420 ms FLIP) | — (DOM 2,0 s; 9→10 1,8 s, W2b) | DOM | p8 (= eski p6 plakası) | "sayfa 1/12" |
| d9 | brosur-sayfa | dom | DOM | — | DOM | p8 | "sayfa 8/12" |
| d10 | brosur-arka | dom | DOM | t01 / r10 (dalış) | DOM | p8 | "sayfa 12/12" |
| d11 | dunya | klip | t01 (dalış tekrarı) | — | l1 | p1 | "ortak evimiz" |
| (12) | kapanış | — | DOM 1 s | — | — | — | — |

Geri yön: k+1 → k = `duraklar[k].ileri.geri` (açık ad tablosu `GERI`: r10, r21, r32, r43, r54, r65, r76, r87). d8 → d7:
FLIP geri 420 ms + kesişme 200 ms + r87; d7 → d6 r76; d6 → d5 r65. Döngüsüz klip durağında oynatıcı gelen klibin son
karesini gösterir (video görünür kalır); poster kipi/yedekte posteri (son-kare) aynı kare.

**`--gecici`** (W1, yeni S2 render/kodlama yokken; **G turunda kalktı**, §0.2): `node scripts/icinden/manifest-birlestir.mjs --gecici` →
`kaynak: "onizleme"`, `gecici: {t67: "t56", t78: "t56", r76: "r65", r87: "r65", p6: "p5", p7: "p5", p8: "p6"}` (eksik klip
ve posterler mevcut dosyalarla; d8'in `brosurDikdortgen`'i eski t56 fragmanından, `kapakTon` eski ton dosyasından).
yaylar.json, emanet ve duvar çapaları yoksa ilgili alan boş (uyarı). K2 son kodlamadan sonra **bayraksız** çalıştırır.

### 0.1 F turu (4 Kasım 2026, brief §13.5–§13.6): kare sayıları, kırpım, fontlar

"Fiske" profiliyle yeniden render edilen geçişler kısaldı; şema değişmedi (`kare`/`sure` fragmandan, site sayıları
manifestten okur, kodda kare sayısına bağlı sabit yok — W-F denetimi). Geri klip = ileri klibin `reverse`'ü, aynı kare.

| Klip (+ geri) | E2 kare (s) | **F kare (s)** | Not |
|---|---|---|---|
| t01 / r10 | 54 (1,8) | 54 (1,8) | yeniden render (fiske), süre aynı |
| t12 / r21 | 60 (2,0) | **54 (1,8)** | |
| t23 / r32 | 84 (2,8) | **72 (2,4)** | bulut perdesi kalktı; son 6 kare durgun |
| t34 / r43 | 72 (2,4) | **60 (2,0)** | t34a 0–35 + t34b 36–59 (sabit bağ); kesme 35 ↔ 36 tam `#FFF1DC` (E: 47 ↔ 48) |
| t45 / r54 | 60 (2,0) | **54 (1,8)** | |
| t56 / r65 | 60 (2,0) | **54 (1,8)** | p6 = t56[53] (E: t56[59]) |
| t67 / r76 | 48 (1,6) | 48 (1,6) | p7 = t67[47] |
| t78 / r87 | 66 (2,2) | **60 (2,0)** | son kare ≡ eski t56[71] (p8 bankosu); kapak tonu `k_0059` |
| döngüler l1–l5, posterler p1–p5/p8 | | değişmedi | |

- **`kirpimY`** (yatay): t23, t56, t78 rampaları artık fragmanın kare kare `ilerleme` dizisine bağlı ve kodlamada tam
  sayı dizisine çözülüyor; t34 basamağı 35 → 36. Tablo §4'te (`KIRPIM_Y_TANIM`).
- **Fontlar** (W-F): Montserrat, Great Vibes ve Lora (`Cop31 Serif` adıyla, OFL §3) `src/app/fonts/` altında alt
  kümelenmiş woff2, `next/font/local` ile (`src/app/layout.tsx`, `src/app/icinden/page.tsx`); derleme Google'a gitmiyor.
  `/icinden`'de 4 istek, 242,4 kB (E: 8 istek, 301,7 kB). CSS değişken adları aynı; manifest ve oynatıcıyı etkilemez.

### 0.2 G turu (4 Kasım 2026, brief §14.4): 13 durak, masa + fidan, `surum: 3`

Müşteri revizyonu: dalış d0–d8 (masadaki broşür) kalır; broşür sayfaları (d9–d10) ve Dünya dönüşü (d11) yerine render
edilmiş fidan bölümü (S3, `scripts/blender/s3/`). Durak tablosu `manifest-birlestir.mjs` `DURAKLAR`'da (§0'daki 12 duraklı
tablonun yerine); site numarayı `rol.ts` `dizinler()`'den türetir, kapanış dizini **N = 13**.

| id | rol | tur | gelen (ileri) | ileri / geri | döngü | poster | okuma (dinlenme) |
|---|---|---|---|---|---|---|---|
| d0 | lombar | dom | — | t01 / r10 | — | — | — |
| d1 | dunya | klip | t01 | t12 / r21 | l1 | p1 | kadraj (t01) |
| d2 | emanet | klip | t12 | t23 / r32 | l2 | p2 | kadraj (t12) |
| d3 | expo | klip | t23 | t34 / r43 | l3 | p3 | kadraj (t23) |
| d4 | anatomi | klip | t34 | t45 / r54 | l4 | p4 | kadraj (t34) |
| d5 | sutunlar | klip | t45 | t56 / r65 | l5 | p5 | kadraj (t45) |
| d6 | duvar | klip | t56 | t67 / r76 | — | p6 = t56[53] | "arka duvar · ~3 m" |
| d7 | duvar | klip | t67 | t78 / r87 | — | p7 = t67[47] | "sol duvar · ~3 m" |
| d8 | **masa** | klip | t78 (= S3 t78f kareleri; S2'nin `t78.json`'u) | **t89 / null** (r98 K-son'da kalktı) | — | **p8 = t78[59]** (son-kare; plaka kalktı) | "banko · broşür" |
| d9 | **fidan-kok** | klip | t89 | t9a / **null** | — | p9 = t89[59] | kadraj (t89; m, ~0,23 → 0,54) |
| d10 | **fidan-govde** | klip | t9a | tab / null | — | pa = t9a[53] | kadraj (t9a; ~0,54 → 0,51) |
| d11 | **fidan-dal** | klip | tab | tbc / null | — | pb = tab[53] | kadraj (tab; ~0,51 → 0,57) |
| d12 | **fidan-yaprak** | klip | tbc | — | **lc** (4 s, 120 kare) | pc = lc[0] | kadraj (tbc; ~0,57 → 0,64) |
| (13) | kapanış | — | DOM | — | — | — | — |

- **Geri**: `duraklar[k].ileri.geri` k+1 → k. `geri: null` (d8, d9, d10, d11'in ileri geçişlerinde) = geri klip YOK: oynatıcı
  hedef durağın (k) posterini 350 ms çapraz söndürür (§14.4.1 K4; d9→d8, d10→d9, d11→d10, d12→d11). d8→d7 = r87. `hizGeri` 1.
  **r98 (t89 `reverse`'ü) K-son'da bütçe merdiveninin 4. adımıyla kalktı** (aşağıda "K-son sonucu"): `GERI.t89 = null`
  üç betikte de (`kodla.mjs`, `manifest-birlestir.mjs`, `kodlama-dogrula.py`); `--dus`/`--geri-yok` bayrakları artık gerekmez.
  Geri almak: üç tabloda `t89: "r98"` + `kodla.mjs --klip r98` + manifest.
- **Kalkanlar**: roller `brosur-kapak`/`brosur-sayfa`/`brosur-arka` ve ikinci `dunya` (d11 dönüşü; `ozel.yaylar` artık
  yalnız d1); `ozel.kapakTon`, `ozel.brosurDikdortgen` (tipler `KapakTon` dahil); `manifest-birlestir.mjs --gecici` ve
  `--ton` (verilirse hata); `kapak-ton.py`, `kapak-dom.mjs` (depodan silindi; G3 yeni broşür kapak dokusu ayrı iş);
  `kodla.mjs` `plaka` poster tipi ve eski p6 → p8 kopya mantığı (json'da `tip: "plaka"` → uyarı, tablo geçerli). Eski
  plaka master'ı ve `p8.json`'u `D:\soft\cop31-varlik\render-son-f\p8\`'de; yeni `render-son/p8.json` `{tip: "son-kare",
  kaynak_klip: "t78", kaynak_kare: 59}`.
- **`rol.ts`** `Dizinler`: `N, lombar, dunya, emanet, expo, anatomi, sutunlar, duvarlar[], masa, fidanlar[]`
  (`fidanlar` = `FIDAN_ROLLERI` sırasıyla [kök, gövde, dal, yaprak] dizinleri, olmayan −1); `donus/kapak/sayfalar/arka`,
  `brosurRolu`, `BrosurDizin`, `brosurDizini` kalktı; yerine `fidanRolu(r)` (tip koruyucu), `FIDAN_ROLLERI`, `FidanRol`.

**Ad tablosu (`kodla.mjs`; tek hane a = 10, b = 11, c = 12):**

| Kaynak (kare dizisi) | Çıktılar | Kare (önizleme) | CRF H.264 / HEVC / AV1 | `kirpimY` (yatay, master px) |
|---|---|---|---|---|
| t78 (t78f) | t78 ileri, r87 geri, **p8** son-kare | 60 | 23/25/32 · r87 26/28/36 | {233 → 420, s 0 → 0,6773} (aynı) |
| **t89** | t89 ileri (geri yok; r98 K-son'da kalktı), **p9** son-kare | 60 | **25/27/34** (K-son merdiveni; A4'te 23/25/32) | **420** sabit |
| **t9a** | t9a ileri (geri yok), **pa** son-kare | 54 | **25/27/34** | **{420 → 222, s 0,04 → 0,90}** (değişen kareler 5–29) |
| **tab** | tab ileri, **pb** son-kare | 54 | **25/27/34** | **{222 → 194, s 0,04 → 0,90}** (7–25) |
| **tbc** | tbc ileri | 66 | **23/27/34** (H.264 +2'de yatay VMAF 90,91 < 93) | **{194 → 165, s 0,04 → 0,90}** (8–31) |
| **lc** | lc döngü, **pc** (döngü 0. karesi; `pc.json` tip `dongu-ilk`) | 120 | **23/27/32** (K-son; A4'te 23/25/30) | **165** sabit |

`GERI` artık bütün ileri geçişleri anahtar olarak taşır (`t9a/tab/tbc: null`); `DONGU` + lc; `POSTER_TABAN` p8 ← t78,
p9 ← t89, pa ← t9a, pb ← tab (son-kare), pc ← lc (dongu); `KAYNAK_SIRA` … t78 t89 t9a tab tbc lc. Rampalar S3
fragmanlarının `ilerleme` dizisine bağlı (fiske profilinin hızlı bölümü; §4 biçimi), uçlar S3 `kirpimY_oneri`'yle aynı:
p9 420, pa 222, pb 194, pc 165 (öznenin dikey ortası yatay karenin %46'sında). Dikişler kırpımsız: t78 sonu 420 = t89,
t9a sonu 222 = pa, tab sonu 194 = pb, tbc sonu 165 = lc = pc. Özetli dosya adı deseni `[a-z][0-9a-z]{1,2}` (t9a, tab, lc,
pa… `--artik`/`--temizle` tanır). Posterler q80 (`POSTER_Q_TABAN`'da fidan için ayar yok).

**Manifest `ozel` yeni alanları** (video px, yön başına; master → video dönüşümü durağın **posterinin** `kirpimY`'siyle —
listedeki yatay poster kaydının sayısal `kirpimY`'si: p9 420, pa 222, pb 194, pc 165; kırpım dışı ya da kenara < 24 px nokta o
yönde atlanır, uyarı yön başına sayı verir). Kaynak önce poster fragmanı (`p9.json`…), yoksa gelen geçiş (d12'de lc, tbc):

```jsonc
// d9 fidan-kok — p9.capalar.kok_uclari (81; grup 0 kazık, 1–6 ana kökler; ana: ana kökün ucu)
"kokUclari": { "dikey": [ {"x": 354.4, "y": 778.8, "grup": 0, "ana": true}, … × 81 ], "yatay": [ … × 81 ] },
// d10 fidan-govde — pa.capalar.bogumlar (2; taraf −1 sol / +1 sağ). JSON'daki baslik/satirlar YAZILMAZ (metin content.ts'ten)
"bogumlar": { "dikey": [ {"x": 359.7, "y": 722.2, "taraf": -1}, {"x": 349.7, "y": 626, "taraf": 1} ], "yatay": [ … ] },
// d11 fidan-dal — pb.capalar.dal_uclari (6, alttan üste; polaroid çapaları)
"dalUclari": { "dikey": [ {"ad": "solAlt", "x": 174.9, "y": 543.9}, {"ad": "sağAlt", …}, "solOrta", "sağOrta", "solÜst", "sağÜst" ], "yatay": [ … ] },
// d12 fidan-yaprak — pc.capalar.dal_uclari + govde_ucu
"dalUclari": { … × 6 }, "govdeUcu": { "dikey": [356.8, 350.7], "yatay": [636.8, 240.7] }   // kırpım dışı yön yazılmaz
```

Tipler (`klipler.ts`): `KokUcu {x, y, grup, ana}`, `Bogum {x, y, taraf: -1 | 1}`, `DalUcuAd` ("solAlt" | "sağAlt" |
"solOrta" | "sağOrta" | "solÜst" | "sağÜst"), `DalUcu {ad, x, y}`, `YonluListe<T> = Record<Boyut, T[]>`; `Ozel.kokUclari`,
`bogumlar`, `dalUclari: YonluListe<…>`, `govdeUcu: Partial<Record<Boyut, Nokta>>`. d6 **`duvarCapalari`** (G7, §14.4.4)
yeni adlarla: `DuvarCapaAd` = `bulusma` ("50+"), `solen` ("100.000+"), `motto` (`backCover.quote`); sıra = d6 bandının 3 spot
satırı. Yatay dönüşüm p6 posterinin `kirpimY`'si (293). Yeni adlar `p6.json`'da yoksa (A6 G7 render'ından önce; şimdiki
p6.json `fidan/genc_iklim/orman`) alan **yazılmaz** ve uyarı verilir.

**S3 fragmanları** (`render-son/<klip>.json`, S2 biçimi + S3 alanları; `scripts/blender/s3/BENIOKU.md` "JSON"): `t89 t9a
tab tbc lc` (`tip` gecis/dongu, `kare`, `kadraj_m[]`, `ilerleme[]`, `buyume{}`, `isik{}`, `capalar`, `kirpimY_oneri`) ve
`p9 pa pb` (`tip: "son-kare"`, `kaynak_klip`, `kaynak_kare`) + `pc` (`tip: "dongu-ilk"`). G-B A4'te önizleme kopyalarıdır
(`kaynak_set: "onizleme"`, `kaynak_not`); A5 `son.sh` üstüne yazar. `manifest-birlestir.mjs --kaynak render` önizleme
fragmanı ya da 960² girişli liste kaydı görürse uyarır.

**Önizleme kodlaması (A4, G-B):** S3 960² kareleri `D:\soft\cop31-varlik\kodlama\onizleme-gb\<klip>\` anlık kopyası
(A1'in olası önizleme yeniden render'ı koşuyu bozmasın diye; içerik `render\_onizleme\s3-<klip>\` ile aynı):

```
node scripts/icinden/kodla.mjs --kaynak D:/soft/cop31-varlik/render-son --esle t78=D:/soft/cop31-varlik/kodlama/onizleme-gb/t78f,t89=…/t89,t9a=…/t9a,tab=…/tab,tbc=…/tbc,lc=…/lc --klip t78,r87,p8,t89,r98,t9a,tab,tbc,lc,p9,pa,pb,pc
node scripts/icinden/manifest-birlestir.mjs --kaynak onizleme
python -X utf8 -P scripts/icinden/kodlama-dogrula.py --vmaf --sec t78,r87,p8,t89,r98,t9a,tab,tbc,lc,p9,pa,pb,pc --esle t78=…/t78f,… --temel 0.673 --oturum-temel 0.928 --cikti D:/soft/cop31-varlik/kodlama/dogrula-render-son-GB-onizleme.json
```

**K-son sonucu (A8, 4 Kasım 2026 ~15.45; son render 1920², hepsi `kaynak_set` render, liste girişleri `1920² rgb48be`).**
Koşulan komutlar (depo kökü; `kapak-ton.py` adımı YOK; t34 sabit bağları G4'te kurulmuştu, 60/60 aynı dosya):

```
node scripts/icinden/kodla.mjs --kaynak D:/soft/cop31-varlik/render-son --klip t23,r32,l3,p3,t34,r43,t56,r65,p6,t67,r76,p7,t78,r87,p8,t89,r98,t9a,tab,tbc,lc,p9,pa,pb,pc --temizle
#   101 dosya, 206 s; --temizle 113 eski özetli dosya (F'nin t23…r87/p8 + A4 önizlemesi)
# bütçe merdiveni (§14.4.1), CRF_TABLO'ya kalıcı yazıldı:
node scripts/icinden/kodla.mjs --kaynak D:/soft/cop31-varlik/render-son --klip lc.av1,lc.hevc,t89,t9a,tab,tbc --temizle
node scripts/icinden/kodla.mjs --kaynak D:/soft/cop31-varlik/render-son --klip tbc.h264 --temizle   # tbc H.264 23'e geri (VMAF)
node scripts/icinden/kodla.mjs --dus r98        # 4. adım; sonra GERI.t89 = null (üç betik)
node scripts/icinden/kodla.mjs --kaynak D:/soft/cop31-varlik/render-son --klip t34.h264 --temizle   # BOLGE t34.h264 0-0:-1
node scripts/icinden/manifest-birlestir.mjs
node scripts/icinden/kodla.mjs --artik --kuru && node scripts/icinden/kodla.mjs --artik             # 5 dosya (r98), 0,991 MB
python -X utf8 -P scripts/icinden/kodlama-dogrula.py --vmaf --sec t23,r32,l3,p3,t34,r43,t56,r65,p6,t67,r76,p7,t78,r87,p8,t89,t9a,tab,tbc,lc,p9,pa,pb,pc --temel 0.697 --oturum-temel 0.664 --cikti D:/soft/cop31-varlik/kodlama/dogrula-render-son-G.json
```

- **CRF değişiklikleri** (`CRF_TABLO`, [H.264, HEVC, AV1]): lc [23, 25, 30] → **[23, 27, 32]**; t89/t9a/tab **[25, 27, 34]**;
  tbc **[23, 27, 34]** (H.264 25'te yatay VMAF 90,91 < 93; 23'te 92,56, H.264 oturum kapısında değil). `BOLGE` + **`t34.h264`
  0-0:-1**: d3 kalkış dikişi yatay H.264 3,36 → 3,21 (kapı ≤ 3,27; dikey 3,22 → 3,05), bedeli dikey +13,4 kB (d3 H.264
  penceresi 2,497 ≤ 2,5; −2'de 2,509 ✗).
- **r98 kalktı** (merdiven 4. adımı): lc + fidan +2 sonrası oturum AV1 12,615 > 12,25.
- **Bütçe** (dikey, MB = 10⁶; oturum = set + W'nin medya dışı payı 0,664; ilk yükleme temeli 0,697 = W'nin ölçtüğü 1,985 −
  1,289):

  | | ilk | kritik maks | pencere maks | set | oturum | F oturum (temel 0,928) |
  |---|---|---|---|---|---|---|
  | AV1 | 1,986 | 2,026 (d2 ≤ 2,1) | 2,523 (d3 ≤ 2,6) | 11,791 | **12,455** ✗ 12,0 · ✓ 12,5 | 11,470 |
  | HEVC | 2,163 | 1,927 (d2) | 2,302 | 11,435 | **12,099** ✗ 12,0 · ✓ 12,25 | 11,208 |
  | H.264 | 2,333 | 2,047 (d2) | 2,497 (d3) | 13,919 | — | 13,083 |

  Merdiven adım adım (AV1 / HEVC oturum): ilk kodlama 12,733 / 12,513 → (1) lc 12,700 / 12,469 → (2) fidan +2 12,615 /
  12,269 → (4) r98 kalkar 12,455 / 12,099. Fidan bölümü (t89 t9a tab tbc lc + p9 pa pb pc) dikey AV1 1,134, HEVC 1,114 MB.
- **Dikişler** (kodlanmış ΔE00): ileri son ↔ döngü 0 ≤ 2,94; d3 kalkış ≤ 3,21; r43 son ↔ l3[0] ≤ 3,80, ↔ p3 ≤ 4,05 (≤ 4,2);
  t23 son ↔ p3 3,18–3,49 (p3 q68, F'de 3,24–3,45); fidan son ↔ poster ≤ 1,97, kalkışlar d8–d11 ≤ 1,45; lc kapanışı AV1 0,316.
- **VMAF** (80 dosya): eşik altı 0; ortalama en düşük 90,88 (r32 yatay H.264), l3 ≥ 94,94, duvar en kötü kare ≥ 83,04,
  fidan AV1/HEVC ortalaması ≥ 93,78.
- Manifest: `kaynak` render, 154 dosya (liste = manifest), 24 poster LQIP'i; uyarılar yalnız t01 `dunyaC` ve d6 `motto`
  dikey kırpım dışı (o yönde yazılmadı, §14.4.4).

**Bütçe merdiveni (kalan seçenek, uygulanmadı):** d3/d4 AV1 +2 (`--crf t34.av1=36,r43.av1=36,l3.av1=36`) dikey AV1 −269,9
kB (oturum ≈ 12,185), VMAF ortalaması ≥ 96,97, kalkış 2,81/3,04, r43 son ↔ l3[0] 3,24/3,52 (K-son denemesi, rapor).

**V doğrulaması (A9, 4 Kasım ~16.00; prod, headless Chrome, 4G, önbelleksiz):** oturum HEVC **12,098** / AV1 **12,454** MB
(K-son tahmini ile ±1 kB), ilk yükleme 2,163 / 1,985, adım penceresi maks 1,737 / 1,877; geri klipler yalnız boşta. Kodlanmış
dikişler ve kapılar `docs/brief-icinden-3.md` §14.5.

## 1. Yol (üç adım, hepsi depodan yeniden üretilebilir)

```
Blender (S1/S2)                          kodlama (§9.4)                          birleştirme (W)
render-son/<klip>/k_%04d.png  ──►  node scripts/icinden/kodla.mjs        ──►  node scripts/icinden/manifest-birlestir.mjs
render-son/<klip>.json (fragman)     --kaynak D:/soft/cop31-varlik/render-son     (--fragman render-son varsayılan)
                                     → public/icinden/v/{d,y}/*.mp4               → src/components/icinden/klipler.json
                                     → public/icinden/p/{d,y}/*.webp
                                     → D:/soft/cop31-varlik/kodlama/render-son.json (liste)
```

B turu (2 Kasım): son render `D:\soft\cop31-varlik\render-son\` (Cycles 1920², PNG 16 bit); önizleme seti
`render\` (EEVEE 960², 8 bit; S2'nin dizileri `render\_onizleme\s2-<klip>\`, `--esle` ile). Betikler giriş
boyutundan bağımsızdır: kırpım master'a göre oransaldır (dikey x %21,875; yatay y `kirpimY` / 1920, klip başına — §4).
Yer tutucu (A turu): `python -X utf8 -P scripts/icinden/yer-tutucu.py` → `D:\soft\cop31-varlik\yer-tutucu\render\<klip>.{mkv,json}`;
sonra aynı iki komut `--kaynak/--fragman D:/soft/cop31-varlik/yer-tutucu/render --kaynak yer-tutucu` ile.
`kodla.mjs` PNG dizisi yoksa `<klip>.mkv`'yi okur.

**t34 birleşimi** (§9.1): son render'da `python -X utf8 -P scripts/icinden/t34-birlestir.py` `render-son/t34/`'ü
siler ve NTFS sabit bağlarla yeniden kurar (F-B, §13.5: t34a k_0000–0035 → 0–35, t34b k_0000–0023 → 36–59; kopya yok;
E'de 0–47 + 48–71), `t34.json` yazar ve kesme kareleri 35 ↔ 36'nın 16 bit farkının 0 olduğunu doğrular (ikisi de tam
`#FFF1DC`). t34a ya da t34b yeniden render edilirse yeniden çalıştırılır. `render-son/t34/` yoksa betikler yine çalışır:
`t34a/` + `t34b/` ffmpeg `concat` ile tek 60 karelik t34 olur, fragmanlar `t34a.json` + `t34b.json` → tek t34 (`kare` = 36 + 24, `kadraj_m` art arda, `sure` = kare / 30;
ortak kod `scripts/icinden/fragman.mjs`). VMAF referansı (`kodlama-dogrula.py`) `render-son/t34/`'ü ister.

## 2. Blender fragmanı (`render/<klip>.json`, master 1920² px, §9.3)

| Alan | Tür | Zorunlu | Not |
|---|---|---|---|
| `ad` | string | evet | klip adı |
| `fps`, `kare`, `sure` | sayı | evet | `kare` kodlanmış kare sayısıyla karşılaştırılır (uyuşmazsa uyarı) |
| `kadraj_m` | number[kare] | geçişlerde evet | dikey kırpımın (1080 master px) odaktaki genişliği, metre. Site kare kare "kadraj ~12.100 km" yazar |
| `dunyaR` | number[kare] | yalnız t01 | Dünya diskinin yarıçapı, master px. Lombar deliği bundan büyür |
| `dunyaC` | [x, y] | yalnız t01 | 0. karede disk merkezi, master px. **Sabit nokta beklenir** (lombarın merkezi = amblem merkezi (960, 768)); kare başına dizi verilirse yalnız 0. öğe kullanılır |
| `capalar` | {ad: [x, y]} | döngülerde | poster karesindeki etiket noktaları (adlar §3). Döngü fragmanında yoksa gelen geçişinkinden okunur (d6/d7: t56/t67 son karesi = p6/p7) |
| `brosur_dikdortgen` | [[x, y] × 4] | **G'de okunmaz** (t78'de durabilir) | E/F: son karede broşür kapağının köşeleri; manifestte d8 `ozel.brosurDikdortgen` idi (§0.2 kalkanlar) |
| `ilerleme` | number[kare] | kırpım rampalı geçişlerde | F turundan beri kirpimY rampası buna bağlı (§4) |
| `capalar.kok_uclari` / `bogumlar` / `dal_uclari` / `govde_ucu` | S3 | p9/t89, pa/t9a, pb/tab, pc/lc/tbc | fidan çapaları → `ozel.kokUclari` / `bogumlar` / `dalUclari` / `govdeUcu` (§0.2) |
| `kamera` | {} | hayır | serbest (manifeste girmez) |

Ayrı fragmanlar: `p6.json` `duvarCapalari` [{ad, dikey: [x, y], yatay: [x, y]}] ve `capalar` {ad: [x, y]} (S2 json_yaz;
G-B G7: `bulusma`, `solen`, `motto`; E/F: `fidan`, `genc_iklim`, `orman`; yoksa t56 son karesinin `capalar`'ı) → d6
`ozel.duvarCapalari`. `yaylar.json` (S1a `scripts/blender/s1/yaylar.py`): `{dikey: [[[x, y] × ≤ 24] ×
27], yatay: …}` **video px** (master değil), son nokta Antalya → d1 ve d11 `ozel.yaylar` (aynı veri; `--yaylar` ile
başka yol).

Master → video uzayı (birleştirme yapar): **dikey** `((x − 420) / 1,5, y / 1,5)` (720×1280), **yatay**
`(x / 1,5, (y − kirpimY) / 1,5)` (1280×720; `kirpimY` çapanın klibinin o karedeki yatay kırpım ofseti, varsayılan 420,
d3'te 200 — §4). Kırpım dışına (ya da kenara 24 px'ten yakın) düşen çapa o yönde atlanır (ör. d5'te üst/alt sütunlar
yatay kırpımda yok).

## 3. Çapa adları (S1/S2 bu adları kullanmalı)

| Durak | Klip | Çapa → etiket (tür) |
|---|---|---|
| d1 | l1 | `antalya` → **künye** (`tur: "kunye"`, `metin` = SSR satırı `content.ts` `cop31.dates` "9–20 Kasım 2026"; E turu, §12.4-2) |
| d2 | l2 | **`emanet01` … `emanet12`** (ya da `emanet_1`, `emanet1`; numara addan) → `tur: "emanet"`, `no`, `donem` (emanet.ts `emanetAlanlari[no].donem` = `donemler[].ad`), `metin` boş, çakışan çiftlerde `dx`/`dy` (manifest-birlestir `EMANET_OFSET`, video px, numaranın çekirdeğe göre ofseti; 04/05/06/07 S1a'nın l2 çapalarındaki çakışma ölçümünden, `manifest-birlestir.mjs` yorumu); `antalya` → "Antalya" (yapı, nokta; sitede F turundan beri d1'in 7 px buluşma çekirdeğiyle çizilir, D1-06). `akdeniz`/`anadolu`/`kibris` E turunda kalktı (§12.0-2a): fragmanda olsalar da uyarısız atlanır |
| d3 | l3 | `expo` → "Antalya Expo Center", `d400` → "D400", `antalya` → "Antalya" (yapı); `korfez` → "Antalya Körfezi", `beydaglari` → "Beydağları" (doğa) |
| d4 | l4 | `rotunda` → "Emanet Rotundası", `oyun` → "Oyna – Sen olsan ne yapardın?" (**yalnız yatay**, `ETIKET` `boyutlar: ["yatay"]`; F turu, D1-14: dikeyde render'daki aynı metinli bandın üstüne biniyordu), `kiosk` → "Söz Kiosku", `amfi` → "Amfi" (bölge, kılavuz çizgili, spot sırası 1–4) |
| d5 | l5 | `sutun01` … `sutun12` → 12 sütun yüzünün ortası (etkin sütundan alt banda kılavuz çizgi) |
| d6 | p6 (`duvarCapalari`, yoksa `capalar`; yoksa t56 son kare) | **G-B (G7, §14.4.4):** `bulusma` ("50+" rakamı), `solen` ("100.000+" rakamı), `motto` (`backCover.quote`) → `ozel.duvarCapalari` sırası = d6 bandının 3 spot satırı (`li[data-capa]`). Kırpım dışına ya da kenara < 24 px düşen yön **yazılmaz** (`motto` dikeyde x ≈ 911 video px → yalnız `yatay`). Site G-B'de d6 kılavuzunu yeniden çizer: nokta yok, çizgi ≤ 0,35 · kısa kenar ise ve rakamdan 22 px önce biter; çapa yoksa çizilmez. (E/F: `fidan`, `genc_iklim`, `orman`; F'de kılavuz yoktu, D1-11) |

Sözlük `manifest-birlestir.mjs` `ETIKET` sabitinde. Bilinmeyen ad uyarı verir ve atlanır. Bir yönün video karesinde kenara
24 px'ten yakın çapa o yönde atlanır (B turu: d3 yatayda "Antalya" y 11,9).

**d3 yatay ve `kirpimY` (C turu, §11.2-5).** l3/p3'ün yatay kırpımı y 200'den (420 değil) alındığı için d3'ün yatay
çapaları `(x / 1,5, (y − 200) / 1,5)` ile çevrilir; beşi de kadrajda: Beydağları (622,3; 40,2), Antalya Körfezi
(506,3; 136,7), Antalya (643,7; 158,6), Expo (640; 525), D400 (491,9; 676,5). B'de kenar kuralıyla düşen "Antalya" geri
geldi. Sitede 1280×800'de beşi de öğelerinin üstünde (W-C, brief §10.3). Kenar kuralı **video karesine** göredir, ekrana
göre değil: 16:9'dan geniş ekranda (844×390) cover kırpımı üstten ve alttan ~64 video px daha keser, Beydağları ve D400
etiketleri ekran dışında kalır (gizlenmez, görünmez). Başka bir klibe kırpım eklenirse çapaları o klibin poster
karesindeki `kirpimY` ile çevrilir (`manifest-birlestir.mjs` listeden okur); `boyutlar.yatay.kirpim` alanı varsayılan
(420) olarak kalır, site kullanmaz.

## 4. Kodlama listesi (`kodlama.json`, `kodla.mjs` yazar) ve K ajanı için tek komut

**Son render, tek komut** (depo kökünde; render-son'daki bütün klipler bitince; GPU kullanmaz, kilit gerekmez). E turu +
F turu teslim seti (brief-icinden-3 §12.5 + §12.10). CRF'ler, poster kaliteleri ve t23 H.264 bölgesi artık
`kodla.mjs` tablolarında (`CRF_TABLO`, `POSTER_Q_TABAN` p3 68 / p6 80 / p7 80, `BOLGE` t23.h264=62-71:-4 — F-B'de t23 72
kare, son 10 kare; E'de 74-83); bayrak gerekmez. Kapak tonu t78'in son karesinden (F-B: t78 60 kare, son kare **k_0059**;
E'de 66 kare, k_0065; eski t56/k_0071 artık yok):

```
python -X utf8 -P scripts/icinden/t34-birlestir.py && node scripts/icinden/kodla.mjs --kaynak D:/soft/cop31-varlik/render-son --temizle && python -X utf8 -P scripts/icinden/kapak-ton.py --kare D:/soft/cop31-varlik/render-son/t78/k_0065.png --fragman D:/soft/cop31-varlik/render-son/t78.json --cikti D:/soft/cop31-varlik/kodlama/render-son-kapak-ton.json && node scripts/icinden/manifest-birlestir.mjs
```

(F-B'den beri kapak tonu karesi `render-son/t78/k_0059.png`.)

Bu tam zincir §12.5'in "yeniden kodlanmayanlar" listesini (t01, l1, r10, p1, p3, l5, p5) de yeniden kodlar (aynı CRF;
x264 belirlenimci, SVT-AV1 için bayt eşliği denenmedi) ve `kart.mjs` (ana sayfa kartı, E'de değişmedi) çalıştırmaz.
E/F turlarında gerçekte koşulan artımlı komutlar:

```
# K2 (E turu, S2 klipleri + geri + posterler):
node scripts/icinden/kodla.mjs --kaynak D:/soft/cop31-varlik/render-son --klip t34,r43,l4,p4,t45,r54,t56,r65,p6,t67,r76,p7,t78,r87,p8 --poster-q p6=80,p7=80
python -X utf8 -P scripts/icinden/kapak-ton.py --kare D:/soft/cop31-varlik/render-son/t78/k_0065.png --fragman D:/soft/cop31-varlik/render-son/t78.json --cikti D:/soft/cop31-varlik/kodlama/render-son-kapak-ton.json
# F turu (denetim M-1/M-2; CRF_TABLO r21 H.264 27, r32 H.264 26,5):
node scripts/icinden/kodla.mjs --kaynak D:/soft/cop31-varlik/render-son --klip r21.h264,r32.h264 --temizle
node scripts/icinden/manifest-birlestir.mjs   # bayraksız; F'de HIZ_GERI 1,0 (D2-01) ve d4 `oyun` yalnız yatay (D1-14)
# E2 turu (§12.12, D1-02; render yok; KIRPIM_Y t56/t67/t78 rampaları, yalnız yatay):
node scripts/icinden/kodla.mjs --kaynak D:/soft/cop31-varlik/render-son --klip t56.yatay,r65.yatay,p6.yatay,t67.yatay,r76.yatay,p7.yatay,t78.yatay,r87.yatay
node scripts/icinden/manifest-birlestir.mjs
python -X utf8 -P scripts/icinden/kodlama-dogrula.py --vmaf --sec t56.yatay,r65.yatay,p6.yatay,t67.yatay,r76.yatay,p7.yatay,t78.yatay,r87.yatay --temel 0.673 --oturum-temel 0.989 --cikti D:/soft/cop31-varlik/kodlama/dogrula-render-son-E2.json
node scripts/icinden/kodla.mjs --artik --kuru && node scripts/icinden/kodla.mjs --artik   # 14 eski yatay dosya
# F-B (K-F, 4 Kasım; "fiske" geçişleri yeniden render, §13.5): 8 ileri + 8 geri + p6/p7, KIRPIM_Y ilerlemeye bağlı,
# CRF_TABLO t23 AV1 35 / r32 H.264 27 / AV1 35, BOLGE t23.h264 62-71 (tablolarda; bayrak gerekmez):
node scripts/icinden/kodla.mjs --kaynak D:/soft/cop31-varlik/render-son --klip t01,r10,t12,r21,t23,r32,t34,r43,t45,r54,t56,r65,t67,r76,t78,r87,p6,p7
python -X utf8 -P scripts/icinden/kapak-ton.py --kare D:/soft/cop31-varlik/render-son/t78/k_0059.png --fragman D:/soft/cop31-varlik/render-son/t78.json --cikti D:/soft/cop31-varlik/kodlama/render-son-kapak-ton.json
node scripts/icinden/manifest-birlestir.mjs
python -X utf8 -P scripts/icinden/kodlama-dogrula.py --vmaf --sec t01,r10,t12,r21,t23,r32,t34,r43,t45,r54,t56,r65,t67,r76,t78,r87,p6,p7 --temel 0.673 --oturum-temel 0.989 --cikti D:/soft/cop31-varlik/kodlama/dogrula-render-son-F.json
node scripts/icinden/kodla.mjs --artik --kuru && node scripts/icinden/kodla.mjs --artik   # 90 eski dosya (E2 özetleri)
```

Doğrulama (C turunda 8 dk 08 s: dikişler + 22 FFV1 referansının yeniden kurulması + 85 VMAF; D turunda 7 dk 57 s: dikişler + t01/l1/t12/l2/t23 için 10 yeni FFV1 referansı + 85 VMAF; referanslar önbellekteyse daha kısa):
`python -X utf8 -P scripts/icinden/kodlama-dogrula.py --vmaf` → `D:/soft/cop31-varlik/kodlama/dogrula-render-son.json`.

1. `t34-birlestir.py`: §1'deki t34 birleşimi (sabit bağlar + `t34.json` + kesme 35↔36 doğrulaması; E'de 47↔48).
2. `kodla.mjs`: 12 kaynak klip (t34 birleşik) → dikey H.264/HEVC/AV1 + yatay H.264/AV1, ileri + geri (`reverse`),
   posterler (WebP q80) ve aynı klibin eski özetli dosyalarının silinmesi. x264/x265 `-preset slow`, SVT-AV1 p4;
   BT.709 matris ve renk etiketi (16 bit → 8 bit dönüşüm kodlayıcıdan önce, `scale` içinde). Süreç önceliği düşük.
   - **CRF tabanı** (§9.4): ileri ve döngü H.264 23 / HEVC 25 / AV1 30, geri 26 / 28 / 34. `--crf` seçicisi tür
     (`ileri|geri|dongu`) ya da dosya adı (`t23`, `r32`, `l3`), isteğe bağlı `.kodek`; değer `+N`/`-N` (tabana ek) ya
     da `N` (mutlak). C turu: yalnız t23 ve t34 ileri H.264 26 / HEVC 27 / AV1 32 (geri r32/r43 tabanda). D turu
     (§11.6-1): t34 ileri AV1 **34**, l3 AV1 **32** (dikey + yatay); t23 AV1 32'de kalır (34'te en kötü kare VMAF 76,8).
     **F-B (K-F, 4 Kasım):** bulutsuz t23/r32 büyüdü; t23 AV1 **35** (d2 kritik 2,314 → ≤ 2,1; VMAF 96,13 / 95,26),
     r32 H.264 **27** (d3 penceresi H.264 2,535 → ≤ 2,5; VMAF 92,52) ve AV1 **35** (d3 AV1 2,602 → ≤ 2,6; 96,24 / 95,47).
   - **`--bolge ad.kodek=k0-k1:ΔCRF`**: x264/x265 `zones` (`b=` bit hızı çarpanı = 2^(−ΔCRF/6); CRF kipinde qscale'i
     böler). C turu: `t23.h264=74-83:-4` (t23 → l3 dikişi H.264'te > 3 idi; HEVC 2,97 ve AV1 2,21 ≤ 3, uygulanmadı).
     F-B: t23 72 kare → `62-71` (yine son 10 kare).
     AV1'de yok sayılır.
   - **`--poster-q ad[.boyut]=q`**: poster WebP kalitesi (varsayılan 80). C turu: hepsi 80. D turu (§11.6-2): `p3=68`
     (dikey + yatay; p3 merdiveni `docs/klip-oynatma.md` §5), öteki posterler 80.
   - **Yatay kırpım `kirpimY`** (master px, `KIRPIM_Y_TANIM` tablosu; §11.2-5, §12.12, §13.5): sayı; `{bas, son, k0, k1}`
     (kare ≤ k0 → bas, ≥ k1 → son, arası easeInOutCubic, kare numarasıyla); ya da F-B'den beri **ilerlemeye bağlı**
     `{bas, son, s0, s1}`: fragmanın kare kare `ilerleme` dizisi (S2 `<klip>.json` `ilerleme`, S1 `f_turu.ilerleme`)
     s(n) ile kirpimY(n) = bas + (son − bas)·easeInOutCubic(clamp((s(n) − s0)/(s1 − s0))). Bu biçim kodlamada kare başına
     **tam sayı dizisine** çözülür ve listeye `{bas, son, s0, s1, kareler: [...]}` olarak yazılır; ffmpeg ifadesi o
     diziden basamak toplamıdır, `manifest-birlestir.mjs` `kirpimYKare` aynı diziyi okur (ikisi aynı eğri). İlerleme
     yoksa tablodaki `k0`/`k1` (S2'nin verdiği kare aralığı) kullanılır (uyarı). Geri klipler ileri klibin nesnesini
     ileri kare numarasıyla kullanır; ters rampa `reverse`'ten gelir. Tablo (F-B, 4 Kasım 2026):

     | Klip (+ geri, poster) | `kirpimY` | Kare karşılığı (F-B) | Neden |
     |---|---|---|---|
     | t23 (r32), 72 kare | `{420 → 200, s 0,1822 → 0,985}` | 0–10 = 420, 11–45 rampa, 46–71 = 200 | d3'te ufuk (C turu, §11.2-5). Eşikler E'nin kare 24 / 72'sinin (84 kare) ln-kadraj ilerlemesi (E `t23.json` `kadraj_m`) |
     | l3, p3 | 200 | | |
     | t34 (r43), 60 kare | `{200 → 420, 35 → 36}` | 0–35 = 200, 36–59 = 420 | basamak düz `#FFF1DC` parlama karelerinde (t34a 35 ↔ t34b 36, ikisi de tam); 35↔36 farkı 0 (E: 47 → 48) |
     | **t56 (r65), p6 = t56[53]**, 54 kare | **`{420 → 293, s 0,5133 → 1}`** | 0–18 = 420, 19–40 rampa, 41–53 = 293 | E2 (§12.12, D1-02): d6 "İklim Eylemleri" 844×390'da görünsün; t56[0] ≡ l5[0] 420'de. Eşik E'nin kare 30 → 59'unun ilerlemesi (S2-F2) |
     | **t67 (r76), p7 = t67[47]**, 48 kare | **`{293 → 233, 0 → 47}`** | kare numarasıyla (değişmedi) | E2: d7 "1.000.000+" üstü bütün yatay ekranlarda görünsün |
     | **t78 (r87)**, 60 kare | **`{233 → 420, s 0 → 0,6773}`** | 0–3 = 233, 4–21 rampa, 22–59 = 420 | E2: E'nin 0 → 40 rampası (ilerleme 0,6773); son 38 kare 420 → d8 kapak geometrisi (`brosurDikdortgen`, `bankoDonusum`), p8 dikişi değişmez |
     | diğerleri | 420 | | t01/l1/t12/l2/t45/l4/l5: lombar hizası, `dunyaC`, `sutunlar` aynı |

     `duvarCapalari` yatayı p6'nın `kirpimY`'siyle (293) çevrilir; `orman` çapası (master y 1434) bu kırpımda kadraj
     dışında kalır (manifest uyarısı; F'de site duvarda kılavuz çizmezdi). G-B'de çapalar `bulusma`/`solen`/`motto`
     (§0.2, §3); `motto` dikeyde kırpım dışı, yalnız yatay.
     ffmpeg: kare numarası biçiminde `crop=w=iw:h=ih*1080/1920:x=0:y='ih*(<bas>+(<son>-<bas>)*e(n))/1920'` (`e`
     easeInOutCubic); ilerleme biçiminde `y='ih*(y0-d1*gte(n,i1)-…)/1920'` (yalnız değişen kareler terim). Crop değeri
     tam sayıya yuvarlar (lrint), ölçekten önce. Geri klipler
     `reverse` kırpım + ölçekten SONRA olduğundan kendiliğinden doğru. Dikey kırpım (x 420) değişmez.
   - Tek klip: `--klip t56`. Önizleme seti örneği: `--kaynak D:/soft/cop31-varlik/render --esle
     t34b=D:/soft/cop31-varlik/render/_onizleme/s2-t34b,l4=…` (A/B turu ön entegrasyonu). Liste varsayılanı
     `D:/soft/cop31-varlik/kodlama/<kaynak klasör adı>.json` (render-son → `render-son.json`).
3. ~~`kapak-ton.py`~~ (**G turunda silindi**, §0.2; aşağısı E/F kaydı): d8 kesişmesi için render kapağının tonu (CSS `saturate contrast brightness sepia`, sRGB en küçük
   kareler; F-B'de t78 son karesi **k_0059**'daki (E'de k_0065) `brosur_dikdortgen` ↔ `D:/soft/cop31-varlik/s2/doku/kapak-dom-sirtsiz.png`;
   D turuna dek t56/k_0071).
   Render kapak oranı 0,708 değilse uyarır (doku farklı → sonuç güvenilmez; o zaman `--cift FFFFFF=<kâğıt>,…`).
4. `manifest-birlestir.mjs`: varsayılanları son render içindir (`--fragman render-son`, `--liste
   kodlama/render-son.json`, `--ton kodlama/render-son-kapak-ton.json`, `--yaylar render-son/yaylar.json`, `--kaynak
   render`). Yatay çapalar klip başına `kirpimY` ile çevrilir (listeden; çapanın klibi/karesi: etiket ve sütun → poster
   karesi, `dunyaC` → t01 0. kare, `brosurDikdortgen` → t78 son kare, `duvarCapalari` → p6). Uyarıları okuyun (kare
   sayısı, poster, sözlük dışı çapa, 12 sütun, 12 emanet, 3 duvar çapası, 27 yay); E2 turu son çalıştırmada beklenen
   uyarılar t01 `dunyaC`'nin kare başına verilmiş olması ve d6 `orman` duvar çapasının yatay kırpım dışında kalması. Çıktının sonunda rol tablosu (id | rol | tur | gelen | ileri/geri
   | döngü | poster | okuma) basılır. Yeni render yokken: `--gecici` (§0). E turunda liste `p8` poster satırları
   (eski p6 plakası, K0) ve t67/t78/r76/r87, p6/p7 satırları içermeli.
5. `kart.mjs`: ana sayfa kartı `public/icinden/kart-icinden.webp` (p1 = `render-son/l1/k_0000.png`, ≤ 60 KB).
6. `kodlama-dogrula.py`: kodek dizeleri (`avc1.64001f`, `hvc1.1.6.L93.90`, `av01.0.05M.08`), kare sayıları, dikişler
   (ileri son ↔ döngü 0 / poster, kalkış, geri son ↔ önceki döngü 0, t56 son ↔ p6 dikdörtgen dışı), döngü kapanışı,
   t34 kesmesi (t34a kare − 1 ↔ +1; F-B 35↔36), bütçe (§11.2-3: ilk yükleme, kritik yol, pencere, set, tam tur oturumu; §11.6-1 istisnaları kritik d2
   ≤ 2,1 ve AV1 pencere d3 ≤ 2,6 `*_tamam`'da, katı 1,8 / 2,5 `*_katı_tamam`'da), `--vmaf` (referans listedeki
   `kirpim` filtresiyle kurulur, önbellek adı kırpım + kaynak kare zamanından özetli).

Sonra site doğrulaması (W): `next build` + `next start -p 3100`, `node scripts/icinden/scrim-olc.mjs --port 3100
--kare D:/soft/cop31-varlik/render-son` (scrim alfaları, §5).

Liste biçimi: dizi; her öğe bir dosya: `{kaynakKlip, klip, tur: "ileri"|"geri"|"dongu"|"poster", boyut: "dikey"|"yatay",
kodek: "h264"|"hevc"|"av1"|"webp", dosya: "/icinden/v/d/t12.3f9a0c1d.h264.mp4", bayt, kare, sure, crf, bolge, kalite,
kirpimY, kirpim, etiket, ms, yol, giris}`. `etiket` ffprobe özeti (`hvc1 Main L93 720x1280 bt709` gibi), `giris`
kaynak özeti (`1920² rgb48be`); `bolge` yalnız zones uygulanan dosyada (`74,83,b=1.5874`), `kalite` yalnız posterde,
`kirpimY` yalnız yatayda (kaynak klibin ileri kare numarasıyla; geri klipte de aynı nesne), `kirpim` kullanılan crop filtresi.
Dosya adı `<klip>.<sha256 ilk 8 hex>.<kodek>.mp4`, poster `<p>.<8 hex>.webp`; `next.config.ts` `headers()`
`/icinden/v/:path*` ve `/icinden/p/:path*` için `public, max-age=31536000, immutable` verir. Kodlama deterministiktir:
aynı master + aynı ayar → aynı özet (değişmeyen klipler yeniden kodlamada aynı adı alır).

## 5. Manifest (`src/components/icinden/klipler.json`)

Tipler: `src/components/icinden/klipler.ts`. Sunucu bileşeni (`page.tsx`) okur; istemciye prop olarak geçer
(RSC yükünde, JS paketinde değil).

```jsonc
{
  "surum": 3, "olusturma": "2026-11-04T…Z", "kaynak": "render",   // "onizleme" (EEVEE 960²) | "yer-tutucu" (A); G: 3 (§0.2)
  "fps": 30, "master": 1920,
  "boyutlar": {
    "dikey": { "g": 720,  "y": 1280, "kirpim": [420, 0, 1080, 1920] },   // [x, y, g, y] master px
    "yatay": { "g": 1280, "y": 720,  "kirpim": [0, 420, 1920, 1080] }   // varsayılan; d3 (t23 sonu, l3, p3, t34 0–35)
  },                                                                     // y 200 — çapalar zaten buna göre çevrili (§4)
  "kodekler": [                                  // tercih sırası; istemci mediaCapabilities → canPlayType
    { "ad": "av1",  "tip": "video/mp4; codecs=\"av01.0.05M.08\"",   "boyutlar": ["dikey", "yatay"] },
    { "ad": "hevc", "tip": "video/mp4; codecs=\"hvc1.1.6.L93.90\"", "boyutlar": ["dikey"] },
    { "ad": "h264", "tip": "video/mp4; codecs=\"avc1.64001f\"",     "boyutlar": ["dikey", "yatay"] }  // her zaman yedek
  ],
  "duraklar": [                                  // d0 … d12 (sıra = durak numarası; §0.2 tablosu, G turu)
    {
      "id": "d3",
      "rol": "expo",                             // lombar|dunya|emanet|expo|anatomi|sutunlar|duvar|masa|fidan-kok|fidan-govde|fidan-dal|fidan-yaprak (G, §0.2)
      "tur": "klip",                             // "klip": video (döngü varsa oynar; yoksa gelen klibin son karesi) | "dom": dinlenme DOM (ops. sabit poster)
      "okuma": [1260000, 1104000, …, 2300],      // gelen geçişin kare kare kadrajı (m), son öğe = dinlenme; ya da sabit metin
      "okumaDurak": "banko · broşür",            // (ops.) dinlenmede diziye üstün sabit metin (d6, d7, d8)
      "poster": { "dikey": { "dosya": "/icinden/p/d/p3.1a2b3c4d.webp", "bayt": 31000, "lqip": "data:image/webp;base64,…" },
                  "yatay": { … } },              // null: posteri yok (d0)
      "dongu":  { "ad": "l3", "sure": 5, "kare": 150,
                  "dosya": { "dikey": { "h264": "/icinden/v/d/l3.….h264.mp4", "hevc": "…", "av1": "…" },
                             "yatay": { "h264": "…", "av1": "…" } },
                  "bayt":  { "dikey": { "h264": 0, … }, "yatay": { … } } },
      "ileri":  { "ad": "t34", "sure": 2.4, "kare": 72, "dosya": { … }, "bayt": { … },   // bu duraktan k+1'e
                  "geri": { "ad": "r43", "sure": 2.4, "kare": 72, "dosya": { … }, "bayt": { … } },  // k+1'den k'ya
                  "hizGeri": 1 },                // ileri null: son durak (d12); geri null: geri klip yok → 350 ms poster çapraz sönmesi (G, §0.2). F: hizGeri 1,25 → 1
      "etiketler": { "dikey": [ { "ad": "expo", "metin": "Antalya Expo Center", "x": 360, "y": 657, "tur": "yapi" } ],
                     "yatay": [ … ] },           // tur: doga | yapi | bolge (+ "no" 1–4) | kunye (d1) | emanet (d2: no, donem, dx?, dy?); "nokta": true
      "ozel": {                                  // yalnız ilgili duraklarda
        "dunyaR": [115, …, 378],                 // d1: t01 kare başına disk yarıçapı (video px, iki yön aynı)
        "dunyaC": { "dikey": [360, 512], "yatay": [640, 232] },
        "yaylar": { "dikey": [[[x, y] × ≤ 24] × 27], "yatay": [ … ] },  // d1 (yaylar.json; istemciye GİTMEZ)
        "sutunlar": { "dikey": [[x, y] × 12], "yatay": [ … ] },        // d5
        "duvarCapalari": [ { "ad": "bulusma", "dikey": [x, y], "yatay": [x, y] }, … ],  // d6 G7 adları: bulusma, solen, motto
        "kokUclari": { "dikey": [ {"x", "y", "grup", "ana"} × 81 ], "yatay": [ … ] },  // d9 (§0.2)
        "bogumlar": { "dikey": [ {"x", "y", "taraf"} × 2 ], "yatay": [ … ] },          // d10
        "dalUclari": { "dikey": [ {"ad", "x", "y"} × 6 ], "yatay": [ … ] },            // d11, d12
        "govdeUcu": { "dikey": [x, y], "yatay": [x, y] }                               // d12
        // E/F'deki brosurDikdortgen ve kapakTon G'de kalktı
      }
    }
  ]
}
```

Durak tablosu: §0.2 (G turu, 13 durak; §0 E turu kaydı). `istemciManifesti()` istemciye giden kopyadan `etiketler`'i ve `ozel.yaylar`'ı
siler (sunucuda HTML/SVG çizilir).

Geri yön: k+1 → k, `duraklar[k].ileri.geri` klibi `hizGeri` hızında (süre = `sure / hizGeri`; F turundan beri 1: 1,25× her geri klipte 1 kare düşürüyordu, denetim D2-01); kadraj okuması
`duraklar[k+1].okuma` tersten.

## 6. Doğrulama (birleştirme betiği uyarır)

- Fragman ↔ kodlanmış kare sayısı eşit; her durağın posteri iki yönde; d5'te 12 sütun; sözlükte olmayan çapa.
- Kodlama ajanı ayrıca (§9.4, §11.2; `kodlama-dogrula.py`): kodek dizeleri, ΔE00 (geçiş son karesi ↔ hedef döngü
  0. karesi) ≤ 3, döngü dikişi, VMAF ≥ 90 (her dosya), bütçe: ilk yükleme ≤ 2,5 MB, kritik yol (ileri + varış
  döngüsü + poster) ≤ 1,8 MB/adım (§11.6-1: d2 ≤ 2,1), pencere (+ geri) ≤ 2,5 MB (§11.6-1: AV1 d3 ≤ 2,6), set ≤ 15
  MB/kodek, tam tur oturumu (0→11, AV1) ≤ 12,00 MB (E turu, §12.9-3).
  Ölçülen değerler `docs/klip-oynatma.md` §5.
