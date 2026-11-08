# S3 — "Masadaki kök kasası" (fidan bölümü, G turu)

Bağlayıcı belge: `docs/brief-icinden-3.md` §14 (G turu). Tasarım: G-A paneli kazananı Öneri 3 (uygulanabilirlik önce) +
jüri aşıları (J1–J3). Müşterinin cümlesi: "o broşür yerine, üçüncü konseptteki fidan köklenmesi ve büyümesini görelim.
Bizi tanıtan bir fidan yani." Kullanıcı: "/fidan'daki gibi değil, animasyonlu" → dalışla aynı üslupta render.

## Ne yapar

S2'nin kendi sahnesi (`scripts/blender/s2/sahne.py --klip t78`, F-B fiske profili) **aynı Blender sürecinde**, kaynak
metni `# ===… MASKE` işaretinden kesilerek çalıştırılır (S2 dosyalarına dokunulmaz; işaret değişirse S3 açıkça durur).
Üstüne ince bir S3 katmanı kurulur:

- **Kasa**: bankonun üstünde, broşürün 0,53 m batısında (ayak izi merkezi −5,86; −4,20), cam yüzü kameraya (ψ +30)
  bakan meşe kök gözlem kasası: dış 0,48 × 0,16 × 0,34 m, toprak 0,44 × 0,12 × 0,28 m, 3 mm boşlukla ince cam
  (`--cam_k`, BLENDED). Kasa `P_banko` parçasına bağlı (patlatılmış d4'te bankoyla kalkar).
- **Fidan**: `/fidan` `tree.ts` → `agac_disa.mjs` → `agac.json` (Node doğrudan içe aktarır; assert 81 kök şeridi /
  81 uç / 23 dal şeridi / 274 yaprak / 2 boğum; kökçük uçları en yakın komşu ≥ 9 birime gevşetilir, kayma ≤ 4,5).
  1 ağaç birimi = 1,1 mm (52 cm'lik fidan). Kökler toprak yüzünde %40 gömülü + K10 ek gömülme (≤ 1 mm, görünen kiriş
  ≥ 1,39 r, ucun son 8 mm'si yerinde), organik yanal kıvrım (~0,5–0,9 mm);
  dallar gövde ekseni çevresinde ±25–38° (3B hacim); 274 tree.ts yaprağı + 205 derinlik yaprağı (loblu meşe, 3 şablon).
- **Büyüme**: geometry nodes, **sabit topoloji** (`FD_Egri`: Resample Count sabit → her nokta Sample Curve(asıl eğri,
  faktör q·p) → konum + yarıçap; p = clamp((g − t0)/(t1 − t0)) şerit başına). Nokta sayısı hiç değişmez → EEVEE
  hareket bulanıklığı ve deterministik kare. Uç her zaman ince, krem kök kapağı (yarıçap ≥ `--kapak_min`),
  `uc_bolge` → kök tüyü halesi (sheen). Gövde çıkışında kanca (g < 0,4), boğumlarda kabarma + koyu halka; gövde K10'da
  tabanda ×1,3 (uca doğru ×1,10'a iner; ön yüz yerinde, kalınlaşma arkaya; boğum kabarması ve kanca oransal).
  `FD_Yaprak`: boy önce, en sonra açılır (aşma yok), tomurcuk dal ucu oraya varınca; titreme
  A·sin(2π(kare + ofs)/120 + faz) — periyodik (lc dikişsiz; tbc'de ofs −65, genlik rampası eğimi 0 biter).
  `FD_Toprak`: ön yüz ızgarasında büyümüş kök yüzeyine uzaklık → `nem` (toprak koyulaşır ×`--nem_k`, pürüz −0,22): kök
  gömülü. K10: hale penceresi (1,5 … 5 mm) en yakın kök yüzeyinin `gomul` özniteliği kadar dışa kayar (Sample Nearest Surface).
- **Işık**: `fidan_spot` 3.200 K (t89'da 2.400 → 3.200 K akkor ısınması, enerji easeOutCubic), kamera solundan cama
  ~24° sıyırarak (K10: düşey eksende cam normalinden 54,5° → 59,5°, toprak yüzü aydınlığı ×1,141 güçle telafi); `gunes` = 16.00 güneşi (`s1/gunes.py`: 9 Kasım 2026 13.00 UTC Expo, yükseklik 18,51°, azimut
  230,47°), ağaçtan 4 m, dar spot, arka ışık. Işın yolundaki `pankart_gel` yalnız S3 kliplerinde gölgesiz.
- **Kamera**: /fidan `FOCUS` dikdörtgenleri `fit()` portuyla (ölçek sabitleri CSS → video px) dikey video bölgesine
  (güvenli alan x %12–88; d9 y %30–65,5, d10–d12 y %12–65,5) oturtulur; 3 bilinmeyen (uzaklık, yükseklik, eğim)
  sönümlü Newton ile çözülür (hata < 0,01 px). 50 mm, f/2,8 (d9) → f/4. Yollar kübik Bézier + yay uzunluğu, ilerleme
  `ortak.fiske()` (k 2,4, kalkış 0,15 s). Deklanşör 0,35 (S2 t78 ile aynı).
- **Gizlenen**: `pankart_gel` (turuncu, dikey YAZILI pankart) d9–d12'de 2,5–3 m arkada okunur → S3 kliplerinde gizli
  (`--pankart 1` ile görünür). t89[0] tepeden bakar, pankart kadrajda değil.

## Klipler (§12.1 tek hane: a = 10, b = 11, c = 12)

| klip | kare | durak | büyüme penceresi (u) | ışık | poster |
|---|---|---|---|---|---|
| t78f | 60 | d8 | — (S2 t78 + kasa, palamut) | S2 aynen | p8 = t78f[59] (son-kare) |
| t79 | 60 | d7 → fidan-kök (broşürsüz; G-B sonrası; W-3 numarasıyla d8) | g_kok 0,30–0,94 (t89 ile aynı) | t89 ile aynı; S2 duvar ışığı t78 karesiyle | — (son ≡ t89[59] = p9) |
| t89 | 60 | d8 → d9 | g_kok 0,30–0,94 | fidan_spot 0 → 1 (2.400 → 3.200 K) | p9 = t89[59] |
| t9a | 54 | d9 → d10 | g_govde 0,12–0,92, kanca | güneş 0 → 0,15 | pa = t9a[53] |
| tab | 54 | d10 → d11 | g_dal 0,10–0,92, tomurcuk 0,55–0,92 | güneş → 0,40, spot → 0,9 | pb = tab[53] |
| tbc | 66 | d11 → d12 | g_yaprak 0,05–0,97 kübik (K10; G-A 0,93 quintic), titreme 0,55–1 | güneş → 1, spot → 0,3 | — |
| lc | 120 | d12 döngü | — (titreme P = 120) | sabit | pc = lc[0] ≡ tbc[65] |

Geri: G-A tasarımında yalnız **r98** (= t89 tersi, kodla.mjs `reverse`); **G-B K-son'da bütçe merdiveninin 4. adımıyla
kalktı** (`GERI.t89 = null`), bütün fidan içi geri adımlar ve d9 → d8 350 ms poster çapraz sönmesi (jüri; §13.1 istisnası →
ONAY). `kodla.mjs` ad tablosu: t89 t9a tab tbc lc; posterler p9 pa pb (son-kare) ve pc (lc[0]). CRF (G-A önerisi AV1
t89/t9a/tab/tbc 32, lc 30, r98 36) K-son'da [H.264, HEVC, AV1] t89/t9a/tab 25/27/34, tbc 23/27/34, lc 23/27/32 oldu.

**t79** (kullanıcı: "duvarlardan sonra broşürü hiç göstermeyelim, direkt fidana atlayalım"): t78[0] (B pozu ≡ t67[47];
18 mm, f/16, duvar odağı) → C9. Yol Catmull-Rom (yay uzunluğu, fiske): B → T78_WA → T78_W1 (t78 koridoru) → X → C9; X, C9'un
bakışından `--t79_yan` (30°) açılı doğruda 1,15 m geride + 0,16 m yukarıda (30° → C9'un tam kuzeyi; 15/20° broşürü p9'dan
büyük gösteriyordu, 45° son3 büyür). ψ −80 → −150 (s 0–0,90), φ +4 → `--t79_phi` (−12, s 0,5) → C9, lens 18 → 50 (ln, s
0,40–0,95), odak duvar → kasa camı (s 0,35–0,85), f/16 → f/2,8 (s 0,45–0,95). S2'nin t78 animasyonu dondurulmaz (duvar ışığı
devri kare kare; ilerleme dizileri eşit), yalnız kamera anahtarları silinir. Yoklama: `--olc79 DOSYA` (render yok; yol ↔ sahne
yakınlığı + ışın isabeti, broşür kutusunun kare kare boyu, t79[0] kasa, t79[59] − t89[59] durum farkı, son3).

## JSON (`<kok>/<klip>.json`; S2 biçimi + S3 alanları)

`ad, tip (gecis | dongu | son-kare | dongu-ilk), kare, sure, fps, master, deklansor, kadraj_m[], kamera{kare[], lens_mm_kare[]},
ilerleme[], profil, fiske_k, buyume{kok, govde, dal, yaprak}[], isik{fidan, gunes}[], gunes{yukseklik, azimut},
kirpimY_oneri, capalar`:
- p9/t89 `capalar.kok_uclari`: 81 × {x, y (master px), grup 0 kazık / 1–6 ana kök, ana} — DOM 81 halka (tek SVG katmanı)
- pa/t9a `capalar.bogumlar`: 2 × {x, y, baslik, satirlar, taraf} (tree.ts KNOTS)
- pb/tab `capalar.dal_uclari`: 6 ana dal ucu (alttan üste solAlt, sağAlt, solOrta, sağOrta, solÜst, sağÜst) — polaroidler
- tbc/lc/pc: `dal_uclari`, `govde_ucu`
Dönüşüm (manifest-birlestir): dikey ((x − 420)/1,5, y/1,5), yatay (x/1,5, (y − kirpimY)/1,5).

## Çalıştırma

```bash
node scripts/blender/s3/agac_disa.mjs                    # agac.json (sahne.py yoksa kendisi çağırır)
bash scripts/blender/s3/onizleme.sh                       # 960² TAA 16 önizleme + ölçüm (GPU kilidi)
S3_YALNIZ_OLC=1 bash scripts/blender/s3/onizleme.sh       # yalnız GPU'suz ölçümler
bash scripts/blender/s3/son.sh                            # G-B: 1920² TAA 64 son render (render-son; K10 varsayılanları, ek ortam yok)
# G-B K10 kısa önizlemesi (s3b-* çıktıları; s3-* G-A dosyalarına dokunmaz):
S3_ONEK=s3b S3_ALTIN=0 S3_PROBE_KLIP=lc bash scripts/blender/s3/onizleme.sh t9a tbc:40-65 lc:0-5 t89:50-59
# tek klip / kare:
blender.exe -b --factory-startup -P scripts/blender/s3/sahne.py -- --klip t89 --onizleme --kareler 59 --kilit --out DIZIN
```

Kipler: `--olc DOSYA` (GPU'suz kabul ölçümleri: son 3 kare px, büyüme cephesi hızı, 81 uç aralığı + kapak çapı, güvenli
alan ∩ bant 390×844 / 360×800 / 430×932 + yatay 1280×800 / 844×390, kirpimY önerisi, arka plan ışın yoklaması),
`--gorunurluk DOSYA` (kasa S2 kliplerinde: p4/l4, p5/l5, t34b, t45, t56, t67, t78 ışın testi + t78 kamera payı),
`--maske` (Workbench malzeme kimliği: kök kapağı kırmızı, kök yeşil, yaprak koyu yeşil…). Ayarlar: `--gok
karanlik|altin` (d12 A/B), `--cam_k`, `--fidan_w`, `--gunes_w`, `--kokcuk_k`, `--kapak_k`, `--kapak_min`,
`--yaprak_boy`, `--ek_yaprak`, `--kasa x,y`, `--pankart 1`; K10 (G-B): `--govde_k`, `--kok_gomul`, `--nem_k`, `--spot_yan`,
`--spot_telafi`, `--yaprak_doy`, `--yaprak_ton`, `--g_yaprak_bas`, `--g_yaprak_son`, `--g_yaprak_egri smoother|smooth`.

`kontak.py`: `kontak <klip>` (12 kare, kırpım/güvenli alan/bant), `posterler` (p8 → pc dikey + DOM taslağı: 81 halka,
boğum etiketleri, 4 polaroid — render değil), `olc` (dikiş ΔE00, 81 uç blob sayımı ve ΔL*, yaprak doygunluğu ≤ 0,62 /
ton IQR ≥ 12° / luma > 0,97 ≤ %1, R12 cam, bayt: t78f önizlemesi F-B t78 mobil AV1'iyle kalibre; `--onek s3b` ile önce/sonra
bayt oranı), `karsilastir --onek s3b` (G-A ↔ K10 yakın kırpımlar). Bütün işler `--onek` alır (varsayılan s3).

## K10 görünüş ayarları (G-B, 4 Kasım 2026; brief §14.4.1 K10)

Varsayılanlar `sahne.py`'de; `son.sh` ek ortam değişkeni istemez. G-A görünüşüne dönmek için:
`S3_EK="--govde_k 1 --kok_gomul 0 --nem_k 0.5 --spot_yan 0 --yaprak_doy 0.54 --g_yaprak_son 0.93 --g_yaprak_egri smoother"`.

| ayar | G-A | K10 | not |
|---|---|---|---|
| `--govde_k` | 1,0 | **1,3** | tabanda ×1,3 (çap 20,9 → 27,2 mm, lc kalınlığı), uca doğru doğrusal ×1,10'a iner (önder tabanı 4,4 × 1,15 ↔ gövde ucu 4,6 birim; basamak yok). Boğum kabarması (+%30) yarıçapla çarpıldığı için oransal; kanca genliği 0,22 → **0,286** (× govde_k). Ön yüz yerinde: merkez hattı r·(k − 1) arkaya kayar → cama/toprak ön yüzüne taşma yok, dal bağlantıları ve kamera çözümü (GOV_Y) değişmez |
| `--kok_gomul` | 0 | **0,001 m** | merkez hattı r·(0,40 + dz) + ek; iki sınır: görünen kiriş ≥ 1,39 r (merkez ≤ 0,72 r) ve ucun son 8 mm'si yerinde. Gerçekleşen: ana kök ort. 0,64 mm (kalın kısımda 1,0), kökçük ort. 0,40 mm (0,11–0,76). Sınırsız düz +1 mm kökçük gövdesinin %83'ünü tümüyle gömüyordu (kökçük r 1,1–1,7 mm). 81 kapak ve DOM çapaları değişmez (p9 çapa kayması 0,0 px) |
| nem halesi | 1,5–5 mm | **1,5 + g … 5 + g mm**, `--nem_k` **0,7** (0,5) | `gomul` nokta özniteliği GN'de örneklenir; FD_Toprak en yakın kök yüzeyinin `gomul`'unu (Sample Nearest Surface) pencereye ekler |
| nem düzeltmesi | — | Is Valid | kök henüz yokken (t78f, t89 0–~20) Proximity 0 döndürüyor, bütün ön yüz nem = 1 (koyu/parlak) oluyor, t89 20 → 21'de tek karede normale sıçrıyordu (toprak L* sıçraması G-A 9,6 → K10 3,0 = kamera hareketi) |
| `--spot_yan` | 0° | **5°** | fidan_spot düşey eksende cam normalinden 54,5° → 59,5° (yerel −0,849/−0,620 → −0,901/−0,542; yükseklik 0,78 m aynı); `--spot_telafi 1`: toprak yüzü aydınlığı korunsun diye 430 × 1,141 = **491 W** |
| `--yaprak_doy` | 0,54 | **0,70** | HSV doygunluk çarpanı merkezi; deneme (lc[0], 960² TAA 16): 0,60 → 0,557 · 0,70 → 0,588 · 0,78 → 0,617; ton kaydırması (0,49 → 0,52) ölçülen doygunluğu düşürdü, `--yaprak_ton` 0,49 kaldı |
| tbc `g_yaprak` | 0,05–0,93 quintic | **0,05–0,97 kübik** (`--g_yaprak_egri smooth`) | quintic ile 0,97'de bile sonda 11 durgun kare (0,99 → 10, 1,0 → 9); kübik 0,97 → **8**, 1,0 → 6. Uçta eğim 0 (lc dikişi) |

**Ölçümler** (`_onizleme/s3b-olc.json` GPU'suz; `s3b-olcum.json` render; 960² TAA 16 kısa önizleme: t9a 0–53, tbc 0 + 40–65,
lc 0–5, t89 0–24 + 50–59, t78f 59, tab 0 + 53):

| ölçüt | G-A | K10 | eşik |
|---|---|---|---|
| Yaprak doygunluğu (pc maskesi) | 0,544 | **0,588** | ≤ 0,62 (hedef 0,56–0,60) |
| Ton IQR / medyan | 12,1° / 43,1° | **14,1°** / 46,6° | ≥ 12° |
| Luma > 0,97 | %0 | **%0** | ≤ %1 |
| 81 uç blob (maske 1920²) | 80 (1 uç blobsuz) | **81** (81 uç ↔ 81 blob, ±4 px; en küçük blob 1 px) | 81 ± 2 |
| Uç ↔ toprak ΔL* medyan / p10 / min | 61 / 49 / 28 | **62,6 / 57,1 / 44,4** | ≥ 20 |
| Cam R12 (kök L* düşüşü) | 2,44 | **2,52** | ≤ 5 |
| Dikiş ΔE00 ort.: t78f[59]→t89[0] · t89[59]→t9a[0] · t9a[53]→tab[0] · tab[53]→tbc[0] · tbc[65]→lc[0] | 0,0005 · 0,0009 · 0,0003 · 0,0007 · 0,0011 | **0,0005 · 0,0007 · 0,0003 · 0,0006 · 0,0011** | ≤ 0,3 |
| Sondaki durgun kare t89 / t9a / tab / tbc | 8 / 7 / 9 / 13 | 8 / 7 / 9 / **8** | 6–8 (tab 9 G-A'dan aynen) |
| Son 3 kare (px) tbc | 0,14/0,1/0,1 | 0,14/0,1/0,1 | ≤ 6/3/0 |
| Güvenli alan ∩ bant (p9/pa/pb/pc) | 0 | 0 | 0 |
| kirpimY p9/pa/pb/pc | 420/222/194/165 | 420/222/194/165 (pa boğum çapası 0,3 px) | — |
| 1920² TAA 64 probu (lc 0–2) | 5,07 s/kare | **5,34 s/kare** (ilk 6,6), VRAM tepe 4,31 GiB | ≤ 7,6 GiB |
| AV1 bayt oranı (aynı kareler, SVT-AV1 p4) | 1 | t89 50–59 ×1,038 · t9a ×1,050 · tbc 40–65 ×1,055 · lc 0–5 ×1,017; WebP p9/pa/pb/pc ×1,045/1,065/1,037/1,034 | fidan bölümü ≈ +37 kB (~1,27 → ~1,31 MB) |

Önce/sonra: `_onizleme/s3b-karsilastir.png` (p9 kökler, pa gövde, pc yaprak, tbc[52]); kontaklar `s3b-t9a.png`,
`s3b-tbc.png`, `s3b-lc.png`, `s3b-t89.png`; durak sayfası `s3b-posterler.png`. G-A dosyaları (`s3-*`) değişmedi.

## Son render (G-B A5, 4 Kasım 2026 13.17–13.59; `bash scripts/blender/s3/son.sh`, K10 varsayılanları, ek ortam yok)

EEVEE 1920² TAA 64, 16 bit, `D:\soft\cop31-varlik\render-son\`: t78 (= t78f) 60 · t89 60 · t9a 54 · tab 54 · tbc 66 · lc 120 =
**415 kare** (4,93 GB). Eski S2 t78 kareleri `render-son-f\t78\`. Posterler p9/pa/pb/pc `k_0000.png` = t89[59] / t9a[53] /
tab[53] / lc[0] (MD5 eşit). `t78.json` S2'nin dosyası olarak kaldı (MD5 66214c68…); S3 JSON'larını `son.sh` yazdı, üstlerine
`kaynak_set: "render"` eklendi. GPU net **35,3 dk** (2.119,5 s, ort. 5,11 s/kare; ilk kare 5,9–6,9 s), duvar saati 41,5 dk
(S1 ajanı kilidi iki kez aldı), VRAM tepe 4,63 GiB (lc). Ölçümler `.qa/icinden3/gb/s3-son/olcum.json` (ölçüm betiği G-B
scratchpad `s3-son/olc_son.py`; `kontak.py olc` yalnız `render/_onizleme`'de çalışır):

| ölçüt | son render (1920²) | eşik |
|---|---|---|
| Dikiş ΔE00 ort. t78f[59]→t89[0] · t89[59]→t9a[0] · t9a[53]→tab[0] · tab[53]→tbc[0] · tbc[65]→lc[0] | 0,0004 · 0,0012 · 0,0007 · 0,0017 · 0,0012 | ≤ 0,3 |
| lc döngüsü lc[119]↔lc[0] / ardışık medyan | 0,0316 / 0,0314 (oran 1,006) | ≤ 1,2 |
| 81 uç blob (maske) | 81; 81/81 uç ↔ blob ≤ 4 px (en büyük 1,58 px) | 81 ± 2 |
| Uç ↔ toprak ΔL* (960 yöntemi) medyan / p10 / min | 63,4 / 58,4 / 45,8 (1920'de min 54,5) | ≥ 20 |
| Yaprak doygunluğu · ton IQR · medyan · luma > 0,97 | 0,594 · 14,6° · 46,8° · %0 | ≤ 0,62 (hedef 0,56–0,60) · ≥ 12° · — · ≤ %1 |
| Cam R12 düşüşü | 2,40 | ≤ 5 |
| Sondaki durgun kare t89 / t9a / tab / tbc | 8 / 7 / 9 / 8 | 6–8 (tab 9, G-A'dan) |
| kirpimY p9 / pa / pb / pc · çapa kayması | 420 / 222 / 194 / 165 · K10 önizlemesine göre 0,0 px | — |

**Kodlanmış (K-son, V; `public/icinden/`, dikey mobil AV1 / HEVC, ΔE00 ortalaması):** t78 son ↔ t89[0] 0,99 / 1,35 ·
t89 son ↔ t9a[0] 1,05 / 1,19 · t9a son ↔ tab[0] 0,90 / 1,23 · tab son ↔ tbc[0] 1,09 / 1,40 · tbc son ↔ lc[0] 1,10 / 1,39;
son ↔ poster ≤ 1,93; lc kapanışı 0,32 / 0,49 (ardışık 0,03; döngü başı anahtar karesi) — hepsi ≤ 3. **r98 yok** (K-son, bütçe
merdiveninin 4. adımı; d9 → d8 de 350 ms poster çapraz sönmesi). CRF (H.264 / HEVC / AV1): t89 t9a tab 25/27/34, tbc 23/27/34,
lc 23/27/32. Fidan bölümü dikey AV1 1,134 MB, HEVC 1,114 MB (posterler dahil). Sonuç tablosu `docs/brief-icinden-3.md` §14.5.

## Bilinen sınırlar / açık

- Kasa d4'te (l4/p4, t34b, t45 ilk 17 kare) bankoda ~23 × 19 video px görünür; bu klipler G1 gereği yeniden render
  edilmez → d4–d5'te kasa yok, d8'de var (ONAY; yedek: l4 + t34b + t45 S3 katmanıyla yeniden render).
- Polaroidler render'da YOK (insan figürü kuralı §12.0): DOM, `dal_uclari` çapasına asılır.
- Işık ve yaprak rengi önizlemeye göre (`--fidan_w 430` × 1,141 telafi, `--gunes_w 4400`; K10 yaprak doygunluğu 0,588 /
  ton IQR 14,1°). Yaprak tonu (medyan ~47°) sıcak ışıkta hâlâ sarı-yeşil/zeytine yakın; daha yeşil ton yalnız `--yaprak_ton`
  ile ve ölçülen doygunluğu düşürerek gelir (K10 kapsamı dışı, ölçüt doygunluk).
- Önizleme 960² TAA 16; son render 1920² TAA 64'te yaprak doygunluğu ve ΔL* biraz farklı çıkabilir (V ölçer).
- tbc'de büyüme ≥ 2 px kare 12–57, sonda 8 kare durgun (K10; G-A 13). tab sonda 9 (G-A'dan aynen, K10 kapsamı dışı).
- `--olc` arka plan yoklaması render'da gizli nesneleri atlar; kamera ↔ kasa (+0,55 m fidan zarfı) en yakın t89 0,29 m.

## İki dil ve "S2 klibi + kasa" (8 Kasım 2026; onay-listesi §14.1-G, §15)

- **S2 klibi + kasa** (`sahne.py --klip t34b | l4 | t45`, `S2_KASA`): S2'nin o klibi kendi kamerası, ışık devri, parça
  animasyonu ve deklanşörüyle aynen kurulur (t78f gibi; S2 `KLIPLER` kare aralığı), üstüne yalnız kasa (palamut, fidan yok,
  fidan_spot / güneş 0, `pankart_gel` görünür ve gölgeli). Kasa bankoyla birlikte patlatılmış d4'te kalkar. l5/p5'te kasa görünmez
  (ışın testi 0 örnek) → l5 S2 `son.sh` ile. `son.sh t34b l4 t45`: t34b `<kök>/t34b/ham/` (t34 numarası 36–59) → S2 `parlama.py`
  → `k_0000–0023`; JSON S2'nin (`s2/sahne.py --klip <klip> --yalniz_json`); sonra `scripts/icinden/t34-birlestir.py --kok <kök>`.
  Böylece d4/d5 de güncel sahnede (G7 arka duvarı + kasa); eski "Kasa d4/d5'te yok" sınırı kalktı.
- **Dil**: yazılı dokular `S2_DOKU` ortam değişkeninden (S2 `sahne.py --doku`; boş → `s2/doku` Türkçe). İngilizce dokular
  `node scripts/blender/s2/dokular.mjs --dil en` → `s2/doku-en` (metinler `src/components/icinden/metin.ts` `DOKU_EN`). Çıktı kökü
  `S3_KOK` (S2'de `S2_KOK`). İngilizce yalnız yazının göründüğü klipler: S3 t34b l4 t45 **t79** (başı d7 sol duvarı, ekranlar), S2 l5
  t56 t67 (+ p6/p7). t89/t9a/tab/tbc/lc ve p9–pc'de okunur yazı yok → iki dilde ortak.
  ```bash
  S2_DOKU=D:/soft/cop31-varlik/s2/doku bash scripts/blender/s3/son.sh t34b l4 t45                       # Türkçe (render-son)
  S2_DOKU=D:/soft/cop31-varlik/s2/doku-en S3_KOK=D:/soft/cop31-varlik/render-son-en bash scripts/blender/s3/son.sh t34b l4 t45 t79
  S2_DOKU=D:/soft/cop31-varlik/s2/doku-en S2_KOK=D:/soft/cop31-varlik/render-son-en bash scripts/blender/s2/son.sh l5 t56 t67
  ```
  `render-son-en/t34a/` = `render-son/t34a/` sabit bağları (S1, yazısız). Kodlama: `kodla.mjs --dil en` (docs/klip-oynatma.md §10).
- **d7 ekran fotoğrafları + hashtag düzeltmesi (8 Kasım 2026, müşteri; onay-listesi §14.1-G):** sol duvardaki iki 50″ ekranda yazı
  yerine fotoğraf (`ekran-fidan.png` / `ekran-cop.png`, iki dilde aynı; S2 `sahne.py` ekran başına malzeme `ekran_foto_0/1`,
  `EKRAN_G` 1,8, koyu panel tabanı 0,04), "#YarınBanaEmanet" (arka duvar, ön cephe, kiosk). Hangi klipte göründüğü ışın testiyle
  ölçüldü (`.qa/icinden-ekran/gorunurluk-ozet.json`; teslim kırpımları): iki dilde S3 t34b l4 t45 t79 ve S2 t56 t67 (+ p6/p7) yeniden;
  l5/p5'te değişen yüzey yok (0 örnek), dokunulmadı. Komut: `.qa/icinden-ekran/render/calistir.sh` (klip başına son.sh, kaldığı yerden).
- EEVEE arızası (7 Kasım önizlemesi, iki kez): kare ışıksız (yalnız emisyonlu yüzeyler), 13–16 s/kare; aynı komut sonra normal.
  Tam render'da her klipten sonra `.qa/icinden-en/render/parlaklik.py` (karşı master'a luma oranı) denetler, karanlık kare yeniden işlenir.
