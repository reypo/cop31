# Blender render boru hattı — spike (R2, 2 Kasım 2026)

Durum: **spike**, nihai sahne değil. Soru: `/icinden` v3'ün Dünya → Antalya → Expo → stant dalışı bu makinede
(RTX 5060 8 GB, Ryzen 5 7500F, 16 GB) Blender'la önceden render edilen kliplerle üretilebilir mi, kaç saatte,
kaç MB'a? İşaretler: **(Ö)** bu oturumda ölçüldü, **(V)** varsayım/tahmin.

## 0. Kısa sonuç

- **Boru hattı çalışıyor (Ö):** Blender 5.2.3 LTS taşınabilir, headless (`-b`), EEVEE GPU'da (OpenGL, RTX 5060),
  Cycles OptiX + OIDN-GPU. Betik → PNG 16 bit → ffmpeg → H.264/HEVC/AV1 + poster, tek komut zinciri.
- **Süre (1080×1920, kare başına):** EEVEE 0,6–0,7 sn; Cycles 64 örnek **2,3–3,9 sn** — ancak
  `material.cycles.emission_sampling='NONE'` ile (varsayılan `AUTO`'da 4,2–6,7 sn; arazide motion blur ×4,3).
  ~2.200 kare: EEVEE ~26 dk, Cycles 64 örnek ~1,9 sa; geri klipler ters çevrilirse 1.700 kare.
- **Boyut (2 sn geçiş, H.264 CRF 23):** 720p 0,86–1,0 MB, 1080p ~2,0 MB; geri klip %24–47 daha büyük;
  5 sn döngü 720p 0,52 MB, 1080p 1,56 MB. HEVC −%25, AV1 −%40.
- **Görünüm:** Dünya foto-gerçekçi (BMNG + 500 m yama + Black Marble + 8K bulut + "kabuk" atmosfer); Sentinel-2
  drape'li arazi 100 km–5 km arası foto-gerçekçi, 300 m'de 10 m/px yetmiyor → OSM geometrisi + modelleme.
- **Öneri:** son render Cycles 1080p 64 örnek (`NONE`), önizleme EEVEE 720p; atmosfer kabuk; AgX Punchy;
  sitede 720p varsayılan + 1080p/HEVC seçenekli (§10).

## 1. Kurulum

- **Blender 5.2.3 LTS** (hash `e13b728c6880`, 22.10.2026) **taşınabilir ZIP**:
  `D:\soft\cop31-varlik\blender\blender-5.2.3-windows-x64\blender.exe` (depo dışı). SHA-256
  `723f08a4…5dc2fb`, download.blender.org'daki `blender-5.2.3.sha256` ile eşleşti **(Ö)**.
- winget MSI kurulumu (`BlenderFoundation.Blender` 5.2.3) **UAC onayında bekliyor** (`consent.exe` açık) — ajan
  onaylayamaz. ZIP yönetici hakkı istemez, tek klasör; üretimde de bu yeterli. Onaylanırsa `C:\Program Files\Blender
  Foundation\Blender 5.2\` ikinci kopya olur, betikler sürüm-bağımsız.
- Komut kalıbı: `blender.exe -b --factory-startup -P betik.py -- --engine CYCLES --res 1080 --samples 64 …`
  (`--` sonrası betiğin argümanları). `--factory-startup` kullanıcı tercihlerinden bağımsız ve tekrarlanabilir;
  bu yüzden Cycles cihazı betikte seçilir (§2).
- GPU: sürücü 610.88; Cycles cihaz listesi `OPTIX` + `CUDA` (RTX 5060), `HIPEW … failed` uyarısı zararsız **(Ö)**.
  Blackwell için OptiX çekirdekleri hazır geliyor: ilk Cycles karesi 3,0–3,6 sn, derleme beklemesi yok **(Ö)**.

## 2. Blender 5.2 API notları (eğitim verisindeki 3.x/4.x'ten farklar)

| Konu | 5.2'de doğru kullanım **(Ö)** |
|---|---|
| Motor adı | `scene.render.engine = 'BLENDER_EEVEE'` (EEVEE Next'in adı; `'BLENDER_EEVEE_NEXT'` YOK), `'CYCLES'`, `'BLENDER_WORKBENCH'` |
| OptiX | `pr = bpy.context.preferences.addons['cycles'].preferences; pr.compute_device_type='OPTIX'; pr.get_devices(); for d in pr.devices: d.use = d.type=='OPTIX'`; `scene.cycles.device='GPU'` |
| Gürültü giderme | `cycles.use_denoising=True`, `denoiser='OPENIMAGEDENOISE'`, `denoising_use_gpu=True` |
| Görünüm dönüşümü | `Standard, ACES 1.3, ACES 2.0, Khronos PBR Neutral, AgX (varsayılan), Filmic, Filmic Log, False Color, Raw`; look: `'AgX - Punchy'`, `'AgX - High Contrast'` … (dinamik enum: yanlış değer atayıp hata metninden okunur) |
| Gök | `ShaderNodeTexSky.sky_type`: `SINGLE_SCATTERING`, `MULTIPLE_SCATTERING` (yeni), `PREETHAM`, `HOSEK_WILKIE` (`'NISHITA'` adı yok) |
| Saydam malzeme | `mat.surface_render_method = 'DITHERED' / 'BLENDED'`, `mat.use_transparent_shadow`, `mat.use_backface_culling` (`blend_method` eski) |
| Çıktı | `image_settings.media_type='IMAGE'`, `file_format='PNG'`, `color_depth='16'`, `compression=15` |
| Compositor | `scene.compositing_node_group` (`scene.node_tree` YOK) |
| Animasyon | Katmanlı Action: `action.fcurves`'e dokunma. `preferences.edit.keyframe_new_interpolation_type='LINEAR'` + her kareye `keyframe_insert` (motion blur alt-kareleri de doğru) |
| Büyük ağ | `mesh.vertices.add / loops.add / polygons.add` + `foreach_set` (numpy): 4,19 M vertex'lik arazi 3,5–3,8 sn **(Ö)** |
| Emisyon örnekleme | `mat.cycles.emission_sampling = 'NONE'` (pus, atmosfer, gece ışıkları): ışık ağacına girmez; %41–48 hız, MB'de ×4 kazanç (§5) |
| Günlük | 5.x arka planda `Fra: … Mem/Peak` satırı basmıyor; VRAM `nvidia-smi -lms 250` ile örneklendi |

**EEVEE headless GPU'yu kullanıyor (Ö):** `-b` altında EEVEE OpenGL arka ucunu açıyor;
`gpu.platform.renderer_get()` = `NVIDIA GeForce RTX 5060/PCIe/SSE2`, `nvidia-smi` GPU kullanımı tepe %92–93.
Soğuk ilk kare 22,6 sn (shader derleme; tek seferlik), önbellek dolunca yeni süreçte ilk kare 2,3 sn.

## 3. Koordinat sistemleri

**Küre sahnesi (Dünya yarıçapı birimi).** 1 birim = 6371 km. +Z kuzey kutbu, +X (0° K, 0° D), +Y (0° K, 90° D).
`(φ, λ) → r·(cos φ cos λ, cos φ sin λ, sin φ)`. Küre ağı betikte üretilir (512×256), UV
`u = (λ+180)/360`, `v = (φ+90)/180` → eşdikdörtgen doku tanım gereği doğru oturur (hazır UV sphere'in UV yönüne
güvenme). Dikiş vertex'leri ortak, UV loop başına; kutuplar üçgen yelpaze.
- Bölgesel yama (yakın plan): BMNG 500 m C1 karosundan 25–45 K / 15–45 D kırpıldı (7200×4800).
  Mapping düğümü `u' = 12u − 6,5`, `v' = 9v − 5,75`; kenarda 1,5° yumuşak geçiş. Aynı mozaiğin
  düşük ve yüksek çözünürlüğü olduğu için renk dikişi yok **(Ö)**.
- Güneş: güneş-altı noktası `L = latlon(δ, λs)`; `λs = −15°·(UTC saat − 12 + EoT/60)`. 9 Kasım 2026 14:00 UTC
  (17:00 TSİ): δ ≈ −16,6°, EoT ≈ +16 dk → λs ≈ −34° (`--gunes=-16.6,-34`). Lamba yönü
  `(-L).to_track_quat('-Z','Y')`; gece ışıkları ve atmosfer aynı `L`'yi düğümde sabit vektör olarak kullanır.

**Arazi sahnesi (metre, Expo-merkez orijin).** Orijin 36,9397171 K / 30,8175767 D (OSM Expo merkezi,
`kure-gl.ts`). Blender'da **X doğu, Y kuzey, Z yukarı**. R1'in `expo-yerel-m` çerçevesi (y güney +,
`docs/varliklar-icinden.md`) ile: `X = x`, `Y = −y`, `Z = h`. R1 rasterlerinde satır 0 kuzey → düzlemin UV'sinde
v = 1 kuzey, görüntü olduğu gibi oturur; ölçek R1 ile aynı tutulmalı (eqc, R = 6371008,8). Spike kendi
4 karolu GLO-30 mozaiğini elipsoid metre/derece (110 976,5 / 89 081,9) ile örnekledi; fark %0,2, üretimde R1
dosyaları kullanılacak.
- Tek ağ, 2048², `x = L·sinh(a·u)/sinh(a)` (L = 80 km, a = 3,65): merkezde 14,8 m, kenarda 285 m aralık. LOD
  tek ağda, dikiş yok; 160 km kare ufka kadar zemin verir.
- Doku: iç 60 km (4096²) + dış 160 km (2048²), merkezden 26–29 km arasında karışır. Spike'ta prosedürel yer
  tutucu (parsel/sera/orman/kaya); `--ic_doku/--ic_yari` ile R1 Sentinel-2 drape'i aynı düğüme bağlanır.
- **Hava perspektifi sürücüsüz:** `τ = s·(Hs/Δz)·(1−e^(−Δz/Hs))/S0`, `Δz = Incoming.z · ViewDistance`,
  Hs = 8 km, S0 = 40 km; `Mix Shader(1−e^(−τ), Principled, Emission(pus rengi))`. Dikey bakışta bütün
  atmosfer ~Hs kadar sayılır (100 km'den bakınca pus ~%16), yere yakın yatay bakışta s/S0. Kamera irtifasından
  bağımsız tek formül; ilk denemedeki "uzaklık sisi" 100 km'de görüntüyü tamamen yıkıyordu **(Ö)**.
- Kamera: irtifa log-lineer 100 km → 300 m, smootherstep; eğim 0° → 58°; DOF odak = irtifa/cos(eğim).

## 4. Sahne kalıpları (Dünya)

| Katman | Kurulum |
|---|---|
| Yüzey | Principled; Base = BMNG 5400×2700 (+ 7200×4800 yama) × Hue/Sat 1,18; su maskesi → Roughness 0,82/0,30, Specular IOR Level 0,15/0,75 (okyanusta güneş parıltısı) |
| Gece | Emission = BlackMarble 2016 (0,1°) · smoothstep(N·L: +0,06 → −0,20) · 3,0; renk (1, 0,66, 0,36) |
| Bulut | Ayrı küre r = 1,004 (≈ 25 km; gerçek ~10 km, gölge kayması görünsün diye abartı), Principled alfa (8192×4096), `DITHERED` + `use_transparent_shadow`; Cycles'ta gölge kendiliğinden |
| Atmosfer **kabuk** (önerilen) | r = 1,03 küre, `BLENDED`, gölge yok. Işının merkeze en yakın uzaklığı `b = |P × I|`: b > 1 hale `e^(−(b−1)/H)`, b < 1 disk pusu `0,3·b⁸`; gün çarpanı ve gün batımı turuncusu en yakın noktanın normaliyle; arka yüz `Backfacing` ile sıfır (Cycles `use_backface_culling`'i yok sayar) |
| Atmosfer fresnel | `LayerWeight.Facing⁴` emisyon kabuğu — en parlak yer kabuğun dış kenarı, sert çizgi (§6) |
| Atmosfer hacim | r = 1,025 küre, Volume Scatter renk (0,18, 0,42, 1,0) (Rayleigh λ⁻⁴ oranı), yoğunluk `40·e^(−(r−1)/H)`, H = 0,006 |
| Yıldız | Dünya gölgelendiricisi: Voronoi (ölçek 260), hücrelerin ~%14'ü, yalnız `Is Camera Ray` |
| Kamera | 35 mm, 9:16 dikey; başlangıç 20 K / 24 D üstü 3 R irtifa, bitiş Antalya'nın 5,5° güneyi 0,12 R (~760 km) irtifa, hedef merkezden Expo'ya kayar; 48 kare @24 fps |

## 5. Ölçülen süreler (Ö)

Yöntem: `bpy.app.handlers.render_pre/render_post/render_write` ile kare başına duvar saati (PNG 16 bit yazma
dahil), `nvidia-smi -lms 250` ile VRAM/GPU. Her koşu ayrı `blender -b` süreci (`olc.sh`). VRAM sütunu
makinenin toplamıdır: boşta başka uygulamalarla ~1,9 GB dolu, Blender'ın payı = sütun − ~1,9 GB.
Ham veri: `out/olcum.jsonl` (kare kare), `out/olcum_ozet.txt`.

**Kare başına süre, sn (ilk kare hariç ortalama; 48 kare ya da her 7. kare).** Cycles iki değerle:
**emisyon örnekleme kapalı** (`material.cycles.emission_sampling = 'NONE'`, önerilen; betiklerde artık varsayılan) / Blender varsayılanı `AUTO`.

| Sahne | Kalite | EEVEE 720×1280 | EEVEE 1080×1920 | Cycles 720×1280 (NONE / AUTO) | Cycles 1080×1920 (NONE / AUTO) |
|---|---|---|---|---|---|
| (a) Dünya dalışı, kabuk atmosfer | TAA 32 / 64 örnek + OIDN | **0,45** (en kötü 0,53) | **0,69** (0,94) | **1,76** / 3,00 | **3,93** / 6,69 |
| (a) Dünya dalışı | TAA 64 / 128 örnek | 0,67 | — | — / 4,34 | **4,91** / 9,48 |
| (a) Sessiz döngü, sabit kamera, 144 kare | TAA 32 / 64 örnek | — | 0,58 | — / 1,94 | — |
| (b) Arazi inişi, 4,19 M vertex + 4.170 kutu | TAA 32 / 64 örnek | **0,39** | **0,62–0,66** | **1,06** / 1,89 | **2,31** / 4,20 |
| (b) Arazi inişi | 128 örnek | — | — | — | **3,57** / 6,91 |

**En büyük kazanç: emisyon örneklemeyi kapatmak.** Pus (arazide 4 M üçgenin hepsi), atmosfer kabuğu ve gece
ışıkları birer "ışık kaynağı" olarak Cycles'ın ışık ağacına giriyor; hiçbir şeyi aydınlatmaları gerekmiyor.
`NONE` ile süre %41–48 düşüyor, arazinin ilk karesi 11 sn → 2,1 sn, VRAM 5,2 → 3,6 GB, görüntü farkı
ort. 0,13–0,42/255 (gürültü düzeyi, parlaklık ortalaması aynı) **(Ö)**. Ölçümler makine boştayken tekrarlandı
(`r_*` koşuları): sapma %1–3.

İlk kare: EEVEE soğuk önbellekte 22,6 sn (shader derleme, bir kez), sonra 1,6–2,3 sn; Cycles Dünya 1,8–3,5 sn,
arazi 2,1–3,5 sn (`NONE`) / 11–14 sn (`AUTO`). Sahne kurulumu (Python) Dünya 0,3 sn, arazi 3,7 sn. VRAM toplam
tepe (boşta ~1,9 GB dolu): EEVEE 3,3–3,8 GB, Cycles `NONE` 3,5–4,1 GB → Blender payı ≤ 2,3 GB / 8 GB. GPU
kullanımı: Cycles ort. %80–90, EEVEE ort. %20–40 (EEVEE'de kare başına CPU/PNG yazma baskın).

**Seçeneklerin maliyeti (aynı kareler, 720p):**

| Seçenek | Cycles 64 örnek | EEVEE TAA 32 | Not |
|---|---|---|---|
| Atmosfer yok → kabuk (`AUTO`) | 2,15 → 3,43–3,57 (+%60–66) | 0,47 | iki motorda aynı görünüm; `NONE` ile kabuk dahil 1,76 |
| Atmosfer fresnel | 3,39 | — | görünüm zayıf (§6) |
| Atmosfer hacim | **21,79** (kabuğun ×6,2'si) | 0,45 | EEVEE'de froxel çözünürlüğü yetmiyor (§6) |
| Motion blur (Dünya) | 3,00 → 3,40 (+%13) | 0,46 → 0,47 | |
| DOF (Dünya) | 3,00 → 2,98 (bedava) | 0,46 → 0,51 (+%11) | |
| Motion blur (arazi) | `AUTO`: 1,89 → **8,19–8,37 (×4,3)**; `NONE`: 1,06 → **1,07** | — | `AUTO`'da ışık ağacı (4 M emisyonlu üçgen) her karede yeniden kuruluyor, GPU ort. %20; `NONE` ile MB bedava |
| MB + DOF (arazi) | `AUTO` 8,49 | 0,39 → **0,50** (+%28) | EEVEE MB/DOF görünümü Cycles'a çok yakın (§6) |
| Film > Transparent | 3,59 (≈ 0) | — | görünüm sorunu (§6) |
| Görünüm dönüşümü (AgX/Filmic/Standard/Punchy) | 3,52–3,55 (≈ 0) | — | yalnızca renk |

## 6. Kareler okunarak dürüst değerlendirme

Karşılaştırma kareleri: `…\blender-spike\out\` (`t2_cy_kabuk_seri.jpg`, `d_ee720_seri.jpg`,
`atmosfer_karsilastirma.jpg`, `gorunum_donusumu.jpg`, `seffaf_karsilastirma.png`, `g_aksam_cy_ee.jpg`,
`a_mbdof_cy_ee.jpg`, `bant_terminator.png`, `bulut_golge_fark.png`, `s2_arazi_seri.jpg`,
`duz_turuncu_once_sonra.jpg`; önerilen ayarlarla 1080p Cycles örneği **`oneri_dunya_1080.jpg`** — kare 4,4 sn).

**Dünya (a) — gerçekçi mi? Evet, uzaktan ve orta mesafede.** 3 R irtifada küre, NASA "Blue Marble"
fotoğraflarıyla aynı dilde: Akdeniz, Nil deltası, Kızıldeniz, Kıbrıs, Tuz Gölü okunuyor; okyanusta güneş
parıltısı, kıyıda sığ deniz tonu var. Mevcut cobe noktalı küresiyle kıyaslanınca müşterinin istediği
"gerçekçi, renkli" farkı açık. 760 km'de (dalışın sonu) global 5400 px doku bulanık (7,4 km/px) — **500 m
bölgesel yama şart**, yamayla Antalya Körfezi ve Toroslar keskin. EEVEE ve Cycles kareleri yan yana neredeyse
ayırt edilemiyor (normal güneşte).

| Ölçüt | Bulgu |
|---|---|
| Atmosfer kenarı | **kabuk**: uzuvda ince mavi hale, dışa üstel söner, gece tarafında hale yok — doğal. **fresnel**: kabuğun dış kenarı en parlak yer, ufukta keskin çizgi ve bütün kareye süt beyazı pus — yapay. **hacim (Cycles)**: en fiziksel (ufukta yumuşak pus, terminatörde kendiliğinden kızıllık) ama ×6,2 süre. **hacim (EEVEE)**: disk üstünde atmosfer neredeyse yok, ufukta kahverengi bant — kullanılamaz. **yok**: ufuk siyah, "ölü" görünüm |
| Terminatör | Yumuşak geçiş, gece tarafında Black Marble şehir ışıkları (Arap Yarımadası, İran, Hindistan) iyi okunuyor. Kusur: varsayılan kabukta terminatör üstündeki disk pusu kahverengi-turuncu ve geniş, "kirli" görünüyor → `--turuncu hale` (turuncu yalnız uzuvda, disk pusu mavi) — denendi (`duz_turuncu_once_sonra.jpg`): kirli bant kalkıyor, uzuvdaki gün batımı kalıyor; betikte **varsayılan yapıldı** (ölçüm tabloları eski varsayılanla) |
| Bulut gölgesi | Var, iki motorda da. Kanıt: aynı kareler `visible_shadow` açık/kapalı render edilip farkı alındı (`bulut_golge_fark.png`). Kare 24 (Akdeniz–Avrupa, bulutlu): Cycles piksellerin %5,2'sini >4/255 karartıyor (en çok 108/255), EEVEE %3,5 (en çok 104) — EEVEE gölgeleri aynı yerde, kapsamı ~%70. Kare 47 (Antalya, az bulut) %0,75 / %0,45. Güzellik karesinde gölge ince; bulut kabuğu 25 km'de (abartılı) olduğu için kayma okunuyor. Bulut dokusu 8192 px (~5 km/px) son karede yumuşak |
| Bantlaşma | PNG 16 bit + Blender dither (1,0): 8 bite inince kontur bandı yok (seviye sayısı 380 → 379). Kodlanmış karede karanlık terminatör bölgesi ×6 gerilerek bakıldı (`bant_terminator.png`): H.264 CRF 23/26 karanlıkta hafif bloklaşma ve şehir ışığı noktalarında yayılma (ort. sapma 0,80 / 0,89 /255); HEVC 10 bit ve AV1 10 bit daha temiz (0,75 / 0,74). Normal parlaklıkta CRF 23'te gözle bant görülmedi; 10 bit H.264 tarayıcılarda çözülmediği için kullanılmaz |
| Batimetri | BMNG "topo.bathy" yakında deniz tabanı kabartmasını gösteriyor (gerçek uydu görüntüsünde görünmez, "kabartma harita" hissi). `yama_duz.py` denizi 24 px bulanıklaştırıp kıyıya göre sığ/derin tonla karıştırıyor — denendi (`duz_turuncu_once_sonra.jpg`): kabartma kayboluyor, kıyı turkuazı kalıyor; betikte **varsayılan yapıldı** |
| Mevsim | 200412 (Aralık) dokusunda Anadolu karla beyaz; Kasım (200411) R1'de var, üretimde o kullanılmalı |
| Düşük güneş | 9 Kasım 17:00 TSİ (`--gunes=-16.6,-34`, Antalya'da güneş ~9°): uzak karede terminatör Doğu Türkiye–Orta Doğu üstünden geçiyor, en etkileyici kare bu. Dalışın sonu (Antalya) belirgin karanlık ve düşük kontrastlı; pozlama/renk derecelendirme ya da saat 15–16'ya çekme gerekir (ONAY). EEVEE'de ilk denemede (eski ayarlar, alçak güneş) son karenin altında keskin kenarlı, dairesel karanlık bir bölge görüldü (nedeni doğrulanmadı; güneş gölge haritası olası); son ayarlarla ve 17:00 güneşiyle tekrar görülmedi, Cycles'ta hiç görülmedi |
| Görünüm dönüşümü | AgX (varsayılan) nötr, biraz soluk; **AgX - Punchy** daha kontrastlı ve doygun (müşterinin "renkli" isteğine en yakın, okyanus koyulaşıyor); Filmic daha düz/sıcak; Standard en doygun ama bulut ve parıltı vurguları patlıyor. Öneri: AgX + Punchy ya da AgX + compositor'da hafif doygunluk |
| Film > Transparent | Halo/atmosfer saf emisyon olduğu için alfası 0 → düz (straight) alfalı PNG'de **hale tamamen kayboluyor**; krem zemine bindirince sert kenarlı disk ve gece tarafı koyu leke. H.264/HEVC tarayıcıda alfa taşımıyor zaten → **arka planı render'a göm** (uzay siyahı ya da sayfanın zemini); şeffaflık yalnızca hale içermeyen durağan nesneler (poster/kesik) için |
| Yıldızlar | Voronoi yıldızları 720p'de 1–2 px; kodlamada sönükleşiyor (en parlak 40 pikselin ortalaması PNG 123–178 → H.264 CRF 23 109–177). Hareket hâlinde titreme (aliasing) ölçülmedi — telefonda izlenerek kontrol edilmeli; gerekirse yıldız yarıçapı büyütülür ya da yıldızlar ayrı, yavaş bir DOM/CSS katmanına alınır **(V)** |

**Arazi (b) — yer tutucu dokuyla gerçekçi DEĞİL; boru hattı ve süre için yeterli.** Prosedürel parsel
dokusu 5 km'nin altında "kamuflaj/patchwork" gibi okunuyor, 300 m'de 14,6 m/px doku bulanık, kutu binalar
blok-model. İlk pus modeli (uzaklık sisi) 100 km'den bakışta görüntüyü tamamen yıkıyordu; yükseklik-bilinçli
τ formülü (§3) ile düzeldi ama pus emisyonu 1,0 hâlâ fazla (gri-mavi perde) → 0,45 ile denendi. **R1 Sentinel-2 (10 m, ±30,72 km) drape'iyle (`s2_arazi_seri.jpg`, `--ic_doku …/s2-genis.png --ic_yari 30720 --pus_guc 0.45`):** 100 km'de gerçek Antalya — kent, körfez, Toroslar, Aksu seraları — foto-gerçekçi; ~5 km'de seralar, D400, Expo alanı fotoğraf gibi (spike'ın en ikna edici arazi karesi). Kusurlar: (1) iç doku sınırında (±30 km) prosedürel dış dokuyla **sert dikiş** — dış halka için R1'in `s2-bolge` (25 m, ±76,8 km) bağlanmalı; (2) **300 m'de 10 m/px bulanık**, rastgele kutular gerçek dokuyla çelişiyor → son 2 km'de OSM bina/yol geometrisi (R1 `osm/expo-3d.geojson`), sera/yol için prosedürel PBR ve Expo'nun modellenmiş hâli şart; 2 m'ye büyütülmüş `s2-yakin` ayrıntı eklemez. Süre: EEVEE 0,43 sn; Cycles 1,1 sn — ama bu hız dokudan değil, pus gücü 0,45'te `AUTO` sezgiselinin pusu ışık ağacına almamasından (aynı ayar S2'siz 1,02 sn, S2 + pus 1,0 1,80 sn); keşfin kaynağı bu, bkz. §5.
MB+DOF: EEVEE (0,50 sn) ile Cycles (`AUTO` 8,49 sn; `NONE` ile ~1,1 sn) kareleri pratikte aynı (radyal iniş bulanıklığı + ön plan DOF).

## 7. Kodlama (ffmpeg 8.1) ve boyutlar (Ö)

```bash
# ileri klip (kaynak: PNG 16 bit, 24 fps)
ffmpeg -framerate 24 -start_number 1 -i k_%04d.png -c:v libx264 -preset slow -crf 23 \
  -pix_fmt yuv420p -profile:v high -movflags +faststart -an ileri.mp4
# geri klip: aynı kareler ters sırada — AYRICA RENDER EDİLMEZ (kamera yolu simetrik, MB merkezli)
ffmpeg -framerate 24 -i k_%04d.png -vf reverse  …aynı bayraklar…  geri.mp4
# Safari/iOS için HEVC (hvc1 etiketi şart), isteğe bağlı AV1
ffmpeg … -c:v libx265 -preset slow -crf 26 -pix_fmt yuv420p -tag:v hvc1 -movflags +faststart -an ileri.hevc.mp4
ffmpeg … -c:v libsvtav1 -preset 5 -crf 34 -pix_fmt yuv420p10le -movflags +faststart -an ileri.av1.mp4
# poster: ilk ve son kare → WebP q80 / AVIF q60 (PIL 12, AVIF destekli)
```

**2 sn'lik klip (48 kare), MB:**

| Klip | H.264 CRF 20 | **CRF 23** | CRF 26 | Geri, CRF 23 | HEVC 8 bit CRF 26 | HEVC 10 bit | AV1 10 bit CRF 34 |
|---|---|---|---|---|---|---|---|
| Dünya dalışı, Cycles 720p | 1,28 | **0,86** (3,5 Mbit/s) | 0,59 | 1,27 | 0,64 | 0,67 | 0,55 |
| Dünya dalışı, EEVEE 1080p | 3,10 | **1,97** (7,9 Mbit/s) | 1,24 | 2,44 | 1,52 | 1,55 | 1,16 |
| Arazi inişi, Cycles 720p | 1,36 | **0,97** (3,9 Mbit/s) | 0,69 | 0,94 | 0,66 | 0,66 | 0,59 |
| Dünya dalışı, EEVEE 720p | — | 1,01 | — | — | — | — | — |
| Arazi inişi, EEVEE 720p | — | 0,92 | — | — | — | — | — |

**5 sn'lik sessiz döngü (120 kare, Dünya sabit kamera, küre 1,6° ve bulutlar 2,6° döner):** 144 kare render
edilip son 24 kare ilk 24 kareyle çapraz geçirildi (`kodla.py --dongu 144`). Dikiş farkı ardışık kare farkı
kadar: 0,45 vs 0,46/255 (720p), 0,34 vs 0,38/255 (1080p) — dikiş görünmez **(Ö)**.

| Döngü | H.264 CRF 20 | **CRF 23** | CRF 26 | HEVC 8 bit | AV1 10 bit |
|---|---|---|---|---|---|
| Cycles 720p | 0,87 | **0,52** (0,84 Mbit/s) | 0,31 | 0,35 | 0,19 |
| EEVEE 1080p | 2,42 | **1,56** (2,50 Mbit/s) | 0,95 | 1,27 | 0,56 |

- 1080p ≈ 720p'nin 2,3 katı. HEVC ≈ H.264 CRF 23'ün %70–75'i, AV1 ≈ %60'ı.
- **Geri klip ileri klipten %24–47 büyük** (Dünya): uzaklaşmada kenarlardan sürekli yeni ayrıntı giriyor;
  bütçede iki yön ayrı sayılmalı.
- Poster (ilk / son kare): WebP 30–110 KB, AVIF 27–97 KB (720p 27–57 KB).
- Kodlama süresi (preset slow, düşük öncelikte, 6 çekirdek): H.264 1,2–5,8 sn, HEVC 3–9 sn, AV1 2–4 sn / klip.

## 8. Deterministik render (Ö)

Aynı kareler (1, 24, 47) ayrı süreçte yeniden render edilip 16 bit piksel piksel karşılaştırıldı:
- **EEVEE: bit-özdeş** (üç karede fark 0).
- **Cycles (OptiX + OIDN-GPU, `seed=31`, `use_animated_seed=True`): bit-özdeş DEĞİL** — piksellerin %17–47'sinde
  fark, en çok 121/65535 (= 0,47/255): 8 bitte en çok 1 seviyelik yuvarlama farkı, gözle görünmez. Kaynak büyük
  olasılıkla GPU'da kayan nokta toplama sırası / GPU denoiser **(V)**. Pratik sonuç: tek bir kareyi sonradan
  yeniden render edip diziye eklemek güvenli.
- Tekrarlanabilirlik için: `--factory-startup`, sabit Blender (5.2.3) ve sürücü (610.88) sürümü, sabit doku
  dosyaları (R1 `KAYNAK.md` MD5'leri), her klip için `--blend` ile sahne dosyası saklanır, kamera yolu
  betikte analitik (anahtar kare elle düzenlenmez).

## 9. Rezervasyon: ~2.200 kare için toplam süre

Varsayım **(V)**: ~10 geçiş × 2 yön × ~50 kare = 1.000 + 10 döngü × ~120 kare = 1.200 → **2.200 kare**.
Geri klipler ters çevrilerek üretilirse render edilecek kare **1.700**. Kare süreleri spike sahnelerinden
(1080p ortalaması Dünya + arazi): EEVEE TAA 32 ~0,7 sn; Cycles `NONE` 64 örnek ~3,1 sn, 128 örnek ~4,2 sn;
720p Cycles `NONE` 64 örnek ~1,4 sn. Stant/rotunda iç mekânı ölçülmedi: karelerin yarısı ×2,5 sayıldı **(V)**.

| Senaryo | 2.200 kare | 1.700 kare (geri = ters) | 1.700 kare + iç mekân payı |
|---|---|---|---|
| EEVEE 1080p, TAA 32 | **26 dk** | **20 dk** | ~35 dk |
| EEVEE 1080p, TAA 64 (~1,0 sn) | 37 dk | 28 dk | ~50 dk |
| Cycles 720p, 64 örnek, `NONE` | 51 dk | 40 dk | ~1,2 sa |
| **Cycles 1080p, 64 örnek, `NONE`** | **1,9 sa** | **1,5 sa** | **~2,6 sa** |
| Cycles 1080p, 128 örnek, `NONE` | 2,6 sa | 2,0 sa | ~3,5 sa |
| Cycles 1080p, 64 örnek, `AUTO` (karşılaştırma) | 3,4 sa | 2,6 sa | ~4,6 sa |

Ek sabit maliyet: süreç açılışı + ilk kare klip başına 3–5 sn (~30 klip → ~3 dk), kodlama (4 codec + poster)
klip başına ~20 sn (~10 dk). Sanat yönetiminde 3–5 tam tur: EEVEE toplam 1–3 sa; Cycles 1080p 64 örnek
8–13 sa (son tur(lar) gece). 9 Kasım'a 7 gün var; GPU tek, render sırasında makine başka iş görmemeli
(paralel CPU işi ilk karede BVH/ışık ağacını yavaşlatıyor). 24 yerine 30 fps (referans video 30 fps) seçilirse
kare, süre ve MB +%25.

## 10. Önerilen seçim

1. **Son render: Cycles, OptiX, 1080×1920, 64 örnek + OIDN (GPU), `emission_sampling='NONE'` tüm emisyonlu
   malzemelerde, motion blur açık (artık bedava).** Toplam ~1,5–2,6 sa. Gerekçe: bulut gölgesi tam
   (EEVEE ~%70), alçak güneşte ve saydamlıkta EEVEE'ye özgü riskler yok (gölge haritası, dithered alfa
   gürültüsü, hacim froxel'i), aynı görüntü EEVEE ile neredeyse eş ama Cycles öngörülebilir.
2. **Önizleme ve sanat yönetimi turları: EEVEE 720p TAA 16–32** (kare 0,4 sn; 48 karelik klip ~25 sn).
   Aynı `.blend`/betik iki motorda çalışıyor (`--engine`). Zaman sıkışırsa son render da EEVEE 1080p olabilir
   (20–35 dk), arazi/stant için görsel fark ölçülemeyecek kadar küçük.
3. **Atmosfer: kabuk** (iki motorda aynı, `--turuncu hale` varsayılan). Hacim yalnızca Cycles'ta ve ufuk
   planlarında, ×6 maliyet kabul edilirse.
4. **Renk: AgX + "AgX - Punchy"** (ya da AgX + compositor doygunluk); Punchy denizi ve dalışın sonunu
   koyulaştırıyor (`oneri_dunya_1080.jpg`) → pozlama +0,3–0,5 EV ile dengelenmeli **(V)**. Film > Transparent
   KULLANILMAZ, arka plan render'a gömülür.
5. **Teslim:** 1080p ana kopya; sitede varsayılan **720×1280 H.264 CRF 23** (geçiş ~0,9–1,0 MB ileri +
   ~0,9–1,3 MB geri, döngü 5 sn ~0,5 MB), geniş/yüksek DPR ekranda 1080p (geçiş ~2,0 + 2,4 MB, döngü
   1,6 MB); Safari/iOS için `<source type='video/mp4; codecs="hvc1"'>` HEVC (−%25). 10 durak için 720p
   toplam ~25–30 MB, 1080p ~60–65 MB (durak başına tembel yükleme şart). Poster: ilk/son kare AVIF + WebP.
6. **Geri klipler render edilmez** (`-vf reverse`); kamera yolları simetrik easing ile yazılır.
7. Ölçek zinciri: Dünya sahnesinde global BMNG (7,4 km/px) → 500 m yama (spike'ta 760 km'ye kadar keskin)
   → **ikinci yama olarak R1 `s2-bolge` (25 m, ±76,8 km)** küreye aynı Mapping kalıbıyla eklenir, böylece
   küre ~120 km'ye inebilir. Arazi sahnesi (düz, Expo-merkez metre) ~120 km'den devralır: 77 km'de eğrilik
   düşüşü d²/2R ≈ 0,47 km, düz yaklaşım yeterli. Devir aynı kamera pozu, güneş yönü ve renkle eşleşme
   kesmesi; spike'taki 760 km → 100 km boşluğu bu yamayla kapanır **(V, denenmedi)**. Son 2 km'de OSM
   geometrisi ve modellenmiş Expo şart (§6).

## 11. Dosyalar

Betikler (oturum scratchpad'i; benimsenirse depoda `scripts/blender/` altına taşınmalı — karar orkestratörün):
`C:\Users\user\AppData\Local\Temp\claude\D--soft-cop31\4935df5b-f395-4622-886e-17daa992bcbf\scratchpad\blender-spike\py\`

| Betik | İş |
|---|---|
| `hazirla.py` | Sistem Python'u (numpy/PIL): BMNG/Black Marble/bulut dokuları, su maskesi, GLO-30 mozaik → sinh ızgara (`arazi_x.npy`, `arazi_h.npy`), prosedürel arazi dokusu |
| `yama.py`, `yama_duz.py` | BMNG 500 m C1 → 25–45 K/15–45 D yama + su maskesi; batimetri kabartması düzleştirilmiş varyant |
| `ortak.py` | Argümanlar, render ayarları (EEVEE/Cycles-OptiX), `render_pre/post/write` ile kare süresi, numpy→mesh, eşdikdörtgen küre ağı, düğüm kısayolları |
| `dunya.py` | Sahne (a): dalış / döngü; `--atmo kabuk|fresnel|hacim|yok`, `--gunes=enlem,boylam`, `--yama_dosya`, `--turuncu hale` |
| `arazi.py` | Sahne (b): arazi inişi; `--ic_doku/--ic_yari` (R1 Sentinel-2), `--pus_guc`, `--fstop`; her iki sahnede `--em_ornek NONE` |
| `olc.sh` | Ölçüm matrisi (gruplar a–h, n, r, x), `nvidia-smi` VRAM/kullanım örneklemesi, `out/olcum.jsonl` |
| `kodla.py` | PNG16 → H.264/HEVC/AV1 + geri klip + döngü çapraz geçişi + WebP/AVIF poster |
| `bant.py`, `tablo.py` | Bantlaşma incelemesi, ölçüm tablosu |

Çıktılar: kare dizileri `D:\soft\cop31-varlik\spike\kare\<koşu>\`, videolar/posterler
`D:\soft\cop31-varlik\spike\video\`, ham ölçüm `…\blender-spike\out\olcum.jsonl` ve `olcum_ozet.txt`,
karşılaştırma kareleri `…\blender-spike\out\*.jpg|png`. İndirilen kaynaklar: `…\blender-spike\dl-nasa\`
(BMNG 200407/200412, C1 karoları, Black Marble 2016 0,1°, bulut 2048/8192; NASA, kamu malı),
`D:\soft\cop31-varlik\spike\dl-dem\` (GLO-30 N36–37 E030–031).
