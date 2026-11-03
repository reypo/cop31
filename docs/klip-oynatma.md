# Klip oynatma — kilitli adımlama + önceden render edilmiş video (R4 spike)

Tarih: 2 Kasım 2026. Durum: spike tamam, üretime aktarılmadı (depo kodu değişmedi).
Prototip: `C:\Users\user\AppData\Local\Temp\claude\D--soft-cop31\4935df5b-f395-4622-886e-17daa992bcbf\scratchpad\klip-spike\` (§9).
İşaretler: **(Ö)** bu spike'ta ölçüldü, **(V)** varsayım / gerçek cihazda doğrulanmadı.

## 0. Sonuç (kısa)

- "Her jest = bir klip" Chrome mobil emülasyonunda (CPU 4×) güvenilir **(Ö)**: 30 adımda jest → klibin ilk
  yeni karesi p50 49,7 ms, p95 49,9 ms (≈ bir kare süresi, 41,7 ms + vsync); düşen kare 0 / 1.320; rAF ~60 fps;
  ekran kaydının ~1.560 karesinde ve sayfa içi ~2.000 rAF örneğinde **boş/siyah kare 0**.
- Asıl sınır ağ: gerçekçi içerikte 2 sn'lik 720×1280 klip H.264'te ~1 MB (≈ 4 Mbps). 4G'de (4 Mbps) okur
  temposunda (durakta ≥ 3 sn) yedek 0; varışta hemen jest atan kullanıcıda 12 adımın 5'i (H.264; AV1'de 3'ü) poster
  yedeğine düşer. AV1 aynı kalitede ~%40–58, HEVC ~%32 daha küçük **(Ö, VMAF)**.
- Öneri: **blob kipi** (fetch ile tam indirme → Blob URL), 3 öğelik `<video>` havuzu, poster katmanı, öncelikli
  önyükleme; H.264 taban + HEVC (Apple) + AV1 (donanımlı cihaz) kodek seçimi; iOS düşük güç modu için
  touchend'de adım + havuzun kilidini açma. WebP kare dizisi reddedildi (3,5× bayt, 169 MB çözülmüş bellek).
- **Gerçek iPhone/Android'de ölçülmedi.** iOS davranışları (§6) yayından önce cihazda sınanmalı.

## 1. Mimari

### 1.1 Katmanlar (alttan üste, `position: fixed; inset: 0`)

| z | Öğe | Görev |
|---|---|---|
| 0 | `<img id="poster">` | Bulunulan durağın posteri (= döngünün 0. karesi). Video katmanlarının hepsi boşken bile ekran dolu. |
| 1–3 | 3 × `<video muted playsinline preload="auto">` | Havuz. Görünen z3 (opaklık 1), bir önceki 80 ms daha z2'de kalır, diğerleri z1 opaklık 0. Her öğenin `poster` özniteliği klibin 0. karesi. |
| 4 | `<img id="yedek">` | Yedek geçiş (poster çapraz sönmesi). |
| 5 | `<main>` > 10 × `section{height:100svh}` | Metin (DOM). Belge kaydırması adımla aynı sürede (easeInOutCubic). |

### 1.2 Durum makinesi ve adımlama

`dur(k)` → jest → `gecis(k→j)` → klip `ended` → `dur(j)`; klip hazır değil / `play()` reddi → `yedek(k→j)` →
`dur(j)`. Adımlama `src/components/dunya/adim.ts`'in vanilla uyarlaması (`web/motor.js`): tekerlek eşiği 40 px
+ momentum kapısı, dokunma 40 px (parmak kalkmadan), klavye, `touch-action` ile native dokunma kaydırması kapalı,
WebKit güvenli konum (`here()`, geri okumaya göre iptal yok). Farklar: uzun bölüm yok; adım süresi = klip süresi;
**geçiş sürerken jest yok sayılır** (kilit; ters yön iptali yok, §7); otomatik oynatma engelliyken dokunma adımı
`touchend`'de atılır.

### 1.3 Havuz (en çok 3 canlı `<video>`)

k. durakta: döngü_k (oynuyor, `loop`), ileri_k ve geri_k (yüklü, 0. karede, readyState ≥ 3). Adım (ileri):

1. `play()` ileri_k (0. karesi zaten görünür: çözülmüş kare ya da `poster`), 180 ms çapraz sönmeyle öne al.
2. Sönme bitince (280 ms) döngü_k durdurulur; serbest kalan iki yuvaya j durağının **aynı yöndeki geçişi**
   (olası sonraki jest) ve **döngü_j** atanır (bu sırayla indirilir).
3. `ended` → döngü_j hazırsa kesme (sönme yok; üretim kuralı: döngü_j[0] ≡ geçişin son karesi ≡ poster_j),
   değilse geçişin son karesi durur, döngü hazır olunca geçilir.
4. +120 ms: geçiş yuvası j'nin ters geçişine atanır. Varıştan hemen sonra gelen ters jestte yuva zorla atanır.

Uçlarda (d0, d9) boş kalan yuvaya komşu döngü. Öğeler yeniden kullanılır, `src` değişir (iOS'ta bir kez jestle
açılan öğe açık kalır, §6). Aynı anda en çok 2 öğe oynar (yalnız 280 ms'lik sönme penceresinde; kilit açılışında
anlık 3); öğe sayısı durak sayısından bağımsız.

### 1.4 Veri katmanı ve önyükleme

- **blob kipi (önerilen):** `fetch()` → `Blob` → `URL.createObjectURL`; klip yuvaya ancak tamamen inince atanır →
  klip ortasında takılma olamaz. Kuyruk: önce yuvaların istediği (FIFO, "acil"), sonra pencere. Eşzamanlılık 1
  (ilk dosya bant genişliğini paylaşmaz). Pencere sırası (y = son gidiş yönü):
  `döngü_k, geçiş(k,y), döngü_{k+y}, geçiş(k+y,y), geçiş(k,−y), döngü_{k+2y}, geçiş(k+2y,y), geçiş(k+y,−y), döngü_{k−y}`.
  Ters klipler en düşük öncelik (hazır değilse poster yedeği). Bırakma yalnız bütçe (40 MB) aşılınca; yön her terse
  dönüşte değiştiği için hemen bırakmak aynı klibi yeniden indirtiyordu (ölçüldü: 4G'de klip başına ~1,2 sn).
- **Üretimde (C turu, `src/components/icinden/oynatici.ts`; brief-icinden-3 §11.2-3):** pencere
  `döngü_k, geçiş(k,y), döngü_{k+y}, geçiş(k+y,y), döngü_{k+2y}, geçiş(k+2y,y), döngü_{k−y}` — ters geçişler pencerede
  **yok**. Ters geçiş havuza atanır ama indirmesi ayrı `bosta` listesindedir: acil ve pencere kuyruğu boşalıp dinlenme
  ≥ 1 s (`BOSTA_MS`) olunca iner; geçiş başlayınca liste kapanır; jest ya da yön değişimi onu acile alır. Posterler
  `k+y, k+2y, k−y` (Image önyüklemesi). Bütçe 30 MB; süren indirme `durdur()`da iptal (AbortController); dosya başına ≤ 2
  deneme. Ölçüm (W-C, 4G, 4 s okur temposu, 4 koşu): 24/24 ters klip faz `dur`, acil 0, pencere 0 iken ve varıştan
  1,12–2,60 s sonra başladı; d_j dinlenmesinde inen p(j+2) + l(j+2) + t(j+2→j+3) + r(j→j−1), en çok 2,16 MB; klipli
  geçişlerin hepsi hazır (brief §10.1).
- **src kipi:** doğrudan URL, tarayıcının `preload`'u (yalnız havuzdaki 3 klip). Chrome Range (206) ile çeker.
  `canplay` (readyState 3) ile hazır sayılırsa 4G'de klip ortasında takılıyor; `canplaythrough` (4) ile takılma 0
  ama iOS'ta `canplaythrough` güvenilir değil (§6).
- **Önbellek:** `public/` dosyaları Next.js'te varsayılan `Cache-Control: public, max-age=0`
  (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/public-folder.md`). Klip/poster adlarına
  içerik özeti ekle ve `next.config` `headers()` ile `/klip/:path*` için `public, max-age=31536000, immutable` ver
  (`…/05-config/01-next-config-js/headers.md` §Cache-Control). Spike sunucusu (`sunucu.mjs`) bunu taklit eder.

### 1.5 Yedekler

| Durum | Davranış | Ölçüm |
|---|---|---|
| Geçiş klibi hazır değil | En çok 300 ms bekle; sonra hedef posterine çapraz sönme (opaklık 900 ms, ölçek 1,08→1 1,8 sn), toplam süre = klip süresi (metin kaydırmasıyla tutarlı); hedef durağın klipleri yedek sürerken yüklenir | §3.5 |
| `play()` reddi (NotAllowedError) | Aynı yedek; açılışta döngü reddedilirse poster dural kalır; dokunma adımı `touchend`'e kayar; ilk `touchend`/`click`/`keydown`'da (yakalama aşaması, adımdan önce) havuzdaki 3 öğe `play()`→`pause()` ile açılır | §3.6 |
| Döngü hazır değil | Geçişin son karesi durur (`ended`), döngü hazır olunca kesme | §3.1 "döngü hazırdı" |
| Hiç video karesi yok | Poster `<img>` (z0); o da yoksa sahne zemini → **üretimde satır içi LQIP gerekir** (negatif kontrol, §3.3) | §3.3 |

### 1.6 Manifest şeması (`web/manifest.json`, üretim önerisi)

```jsonc
{
  "surum": 1, "fps": 24, "genislik": 720, "yukseklik": 1280,
  "kodekler": [                     // tercih sırası; istemci ilk "supported && powerEfficient" olanı seçer
    { "ad": "av1",  "tip": "video/mp4; codecs=\"av01.0.05M.08\"",   "yol": "/klip/av1/" },
    { "ad": "hevc", "tip": "video/mp4; codecs=\"hvc1.1.6.L93.B0\"", "yol": "/klip/hevc/" },
    { "ad": "h264", "tip": "video/mp4; codecs=\"avc1.64001f\"",     "yol": "/klip/h264/" }   // her zaman son yedek
  ],
  "duraklar": [
    {
      "id": "d1",                     // brief-icinden durak kimliği
      "tur": "klip",                  // "klip" | "dom" (d0, d6–d8: klip yok, sahne gizli/poster)
      "poster": { "dosya": "/klip/poster/d1.3f9a.webp", "bayt": 23898, "lqip": "data:image/webp;base64,…" },
      "dongu":  { "dosya": "d1.8c21.mp4",   "sure": 4,   "bayt": { "av1": 379857, "hevc": 341238, "h264": 353759 } },
      "ileri":  { "dosya": "g1-2.77ab.mp4", "sure": 2.4, "bayt": { "…": 0 } },  // null: son durak ya da DOM geçişi
      "geri":   { "dosya": "g1-0.1c0e.mp4", "sure": 2.4, "bayt": { "…": 0 }, "hiz": 1.25 }
    }
  ]
}
```

Kurallar: geçiş k→j'nin 0. karesi ≡ poster_k ≡ döngü_k[0]; son karesi ≡ poster_j ≡ döngü_j[0]. Döngüler düşük
genlikli (döngüden geçişe 180 ms sönme var, büyük fark "atlama" gibi görünür). `sure` metin kaydırmasının da
süresi; `hiz` verilirse süre `sure / hiz`. Bayt alanı önyükleme bütçesi ve ilerleme için. Dosya adı içerik özetli.
`tur`, `lqip`, `hiz` ve özetli adlar prototipte yok (üretim önerisi); prototip manifesti `manifest-yap.mjs` üretir.

## 2. Ölçüm ortamı

Chrome 156 (sistem, `channel: chrome`, headless) + playwright-core 1.58.2; GPU açık (ANGLE D3D11, RTX 5060;
`mediaCapabilities`: H.264/HEVC/AV1 üçü de `powerEfficient: true`, telefonu temsil etmez). Mobil emülasyon
390×844, DPR 3, `isMobile`, `hasTouch`; dokunma CDP `Input.dispatchTouchEvent` (160 px, 8 adım × 16 ms);
CPU 4× (`Emulation.setCPUThrottlingRate`; yalnız ana iş parçacığını yavaşlatır, çözücü/GPU değil). Ağ:
`Network.emulateNetworkConditions` — 4G = 4 Mbps / 50 ms, yavaş = 1,6 Mbps / 150 ms. Sunucu `sunucu.mjs`
(Range 206 + immutable önbellek). Bellek: CDP `SystemInfo.getProcessInfo` PID'leri → Windows özel bayt
(Private Bytes), süreç türüne göre; JS heap: CDP `Performance.getMetrics`.

Klip setleri: **test** (sentetik testsrc2 + akan gradyan + drawtext "İLERİ k − j", kare sayacı; 10 durak,
18 geçiş × 2 sn, 10 döngü × 4 sn, 24 fps, 720×1280) ve **ağır** (aynı yapı, gerçekçi içerik vekili: NASA Blue
Marble 2004-08 üzerinde Antalya'ya 4× yakınlaşma; kamu malı; Blender render'ının bit hızına yakın-kötü durum).

## 3. Ölçümler

### 3.1 Jest → ilk kare, kare düşmesi, bellek, ağ (test seti, yerel, CPU 4×, 30 adım = 19 ileri + 11 geri)

10 durakta net hareket en çok +9 olduğundan "20 ileri 10 geri" yerine 19/11 (0→9→0→9, sonra 9→8→9→8).
"İlk kare" = `play()` sonrası ilk `requestVideoFrameCallback` (mediaTime 0,042 = 1. kare; 0. kare jestten önce
zaten ekranda).

| Kip | İlk kare p50 / p95 / en çok (ms) | Jest → `play()` p50 | Olay gecikmesi p50 | Düşen / çözülen kare | Sunulan kare ort. (48'de) | rAF fps ort. / en az | > 50 ms kare | Yedek | Döngü hazırdı |
|---|---|---|---|---|---|---|---|---|---|
| blob | 49,7 / 49,9 / 49,9 | 0,1 ms | 9,3 ms | 0 / 1.320 | 47 | 60,2 / 59,9 | 0 | 0 | 30/30 |
| src | 49,7 / 49,9 / 50,0 | 0,2 ms | 9,3 ms | 0 / 1.320 | 47 | 60,3 / 59,9 | 0 | 0 | 30/30 |

Geçiş süresi (jest → varış) p50 2.002 ms; ileri ve geri aynı (49,7 / 49,7–49,8 ms). "Olay gecikmesi" =
`event.timeStamp` → işleyici (CPU 4×). Sunulan 47 = 0. kare jestten önce ekranda olduğundan.

| Kip | Bellek (özel bayt, tüm süreçler) başta → 30 adım sonra | Sonra: renderer / GPU / browser | JS heap | Blob | Ağ: açılış / toplam | Klip isteği (Range) | Adım başına |
|---|---|---|---|---|---|---|---|
| blob | 355 → 456 MB | 173 / 197 / 55 MB | 1,6 MB | 9,75 MB (tüm klipler; bütçe 40 MB) | 2,77 / 10,05 MB | 28 (0) | ilk 8 adım 0,32–1,08 MB, sonra 0 |
| src | 355 → 438 MB | 157 / 202 / 46 MB | 1,9 MB | — | 1,43 / 10,05 MB | 68 (68) | ilk 9 adım 0,63–1,06 MB, sonra 0 (HTTP önbelleği) |

Ayrıntı: `sonuc/temel-h264-x4.json` (her adımın `olaylar` kaydı).

### 3.2 Klip boyutları

Test seti (sentetik; CRF'ler aynı kaliteyi temsil etmez, karşılaştırma için §3.2b):

| Kodek (ayar) | Geçiş 2 sn ort. (min–maks) | Döngü 4 sn ort. | 28 klip toplam |
|---|---|---|---|
| H.264 libx264 slow CRF 23, High@3.1, GOP 48, faststart | 310 KB (276–337) | 415 KB | 9,75 MB |
| HEVC libx265 slow CRF 26, `hvc1` | 270 KB (261–285) | 346 KB | 8,33 MB |
| AV1 SVT-AV1 p6 CRF 34 | 287 KB (267–322) | 360 KB | 8,78 MB |
| Poster WebP q78 (10 adet) | — | — | 0,25 MB |

Ağır set (gerçekçi vekil; HEVC/AV1 H.264 çıktısından yeniden kodlandı):

| Kodek | İleri 2 sn ort. | Geri 2 sn ort. | Döngü 4 sn ort. | 28 klip toplam |
|---|---|---|---|---|
| H.264 CRF 23 | 1.028 KB | 827 KB | 751 KB | 24,2 MB |
| HEVC CRF 25 | 699 KB | 700 KB | 439 KB | 17,0 MB |
| AV1 CRF 33 | 576 KB | 621 KB | 395 KB | 14,7 MB |

### 3.2b Aynı kalitede boyut (kodek merdiveni, VMAF)

Gerçekçi vekil, 2 sn, 48 kare; VMAF v0.6.1 (libvmaf, kare hizalı `setpts=N/24/TB`; telefon modeli bu içerikte
100'e doyuyor, ayırt etmiyor). `sonuc/merdiven-*-hizali.csv`.

| 720×1280 | ≈ VMAF 96 | ≈ VMAF 99,3–99,7 |
|---|---|---|
| H.264 x264 slow | CRF 26: 681 KB (95,7) | CRF 23: 1.073 KB (99,3) |
| HEVC x265 slow | CRF 28: 460 KB (96,0) | CRF 25: 731 KB (99,4) |
| AV1 SVT p4 | CRF 38: 315 KB (96,2) | CRF 33: 448 KB (98,8) · CRF 28: 645 KB (99,7) |
| H.264 NVENC p7 | cq 27: 683 KB (97,8) | cq 23: 1.148 KB (99,9) |
| AV1 NVENC p7 | cq 36: 431 KB (94,8) | cq 30: 770 KB (99,7) |

1080×1920: H.264 CRF 23 1.619 KB (99,7), CRF 26 1.017 KB (96,5); HEVC CRF 25 1.471 KB (99,7); AV1 CRF 33
944 KB (99,1), CRF 38 666 KB (96,9) → 720p'nin ~1,5×'i. Oran (aynı VMAF): **HEVC ≈ 0,68× H.264, AV1 ≈ 0,42–0,60×**.
Kodlama süresi klip başına: x264 0,9 sn, x265 2,2–2,6 sn, SVT p4 1,6 sn, NVENC 0,4–0,5 sn (720p).

### 3.3 Boş / siyah kare

İki yöntem, 6 adım (ileri ×3, geri, ileri ×2), CPU 4×, sahne zemini macenta (`?bos=ff00ff`: boş kare = macenta):

| Kip | Sayfa içi rAF örneği (görünen üst video 8×8 canvas'a çizilir) | CDP screencast (~50 fps, 15,5 sn) |
|---|---|---|
| blob | 1.005 kare: siyah 0, boş 0 | 781 kare: kenarı macenta 0, siyah 0, en düşük ort. parlaklık 125 |
| src | 1.005 kare: siyah 0, boş 0 | 780 kare: kenarı macenta 0, siyah 0, en düşük ort. parlaklık 125 |

~41 rAF karesinde üstteki video 180 ms sönmenin ilk yarısındaydı (opaklık < 0,5); altında bir önceki video
(z2) ve poster vardı, boş değil. **Negatif kontrol:** 20 KB/s ağda poster gelmeden alınan karede kenarların
%100'ü macenta → dedektör boşluğu yakalıyor; aynı zamanda üretimde açılış için satır içi LQIP gerektiğini gösteriyor.
(`sonuc/siyah.json`, `sonuc/screencast-analiz.json`, `kare-analiz.py`)

### 3.4 blob: URL ile doğrudan `src` (9 klip art arda, soğuk önbellek, CPU 4×)

| Set · ağ · yöntem | Hazır (canplay) p50 / en çok (ms) | play → ilk kare p50 (ms) | Takılma | Bellek önce→sonra (MB) |
|---|---|---|---|---|
| test (~310 KB) · yerel · src | 16 / 56 | 32 | 0 | 218 → 293 |
| test · yerel · blob | 18 / 52 | 27 | 0 | 217 → 290 |
| test · 4G · src | 205 / 272 | 24 | 0 | 219 → 284 |
| test · 4G · blob | 719 / 788 | 37 | 0 | 219 → 286 |
| ağır (~1 MB) · yerel · src | 27 / 62 | 22 | 0 | 217 → 310 |
| ağır · yerel · blob | 32 / 62 | 32 | 0 | 217 → 323 (browser +10) |
| ağır · 4G · src | 536 / 546 | 23 | 0 | 219 → 300 |
| ağır · 4G · blob | 2.165 / 2.186 | 20 | 0 | 220 → 315 (browser +11) |

Tek akışta 4G `src` daha erken başlar (kısmi veriyle), ancak havuzda 3 öğe aynı anda yüklenince bant paylaşılır ve
klip ortasında takılır (§3.5). blob bellek maliyeti = klip baytı (tarayıcı sürecinde; 9 MB ≈ +10 MB).

### 3.5 Ağ: 4G ve yavaş ağ, "hazır değilken jest"

Tempo: **okur** = 9 ileri adım, her varıştan 3 sn sonra jest; **acele** = 12 adım (3'ü ters), varış anında jest.
Yedek = §1.5 poster çapraz sönmesi.

| Koşul | Kip · tempo | Açılışta hazır (ms) | Adım | Yedek | İlk kare p50 / p95 (ms) | Takılma (adet / ms) | Düşen kare | Döngü hazırdı | İndirilen |
|---|---|---|---|---|---|---|---|---|---|
| 4G · test · H.264 | blob · okur | 2.508 | 9 | 0 | 49,7 / 50,0 | 0 | 0 | 9/9 | 10,0 MB |
| | blob · acele | 2.486 | 12 | 1 | 49,6 / 49,8 | 0 | 0 | 11/11 | 8,7 MB |
| | src · okur | 1.568 | 9 | 0 | 49,7 / 49,7 | 0 | 0 | 9/9 | 9,7 MB |
| | src · acele | 1.585 | 12 | 0 | 49,8 / 183 | 0 | 0 | 12/12 | 6,3 MB |
| 4G · ağır · H.264 | blob · okur | 5.978 | 9 | **0** | 49,5 / 49,9 | 0 | 0 | 5/9 | 24,4 MB |
| | blob · acele | 5.988 | 12 | **5** | 49,7 / 49,9 | 0 | 0 | 3/7 | 15,0 MB |
| | src (eşik 3) · okur | 3.598 | 9 | 0 | 49,6 / 49,8 | **4 / 1.954** | 4 | 9/9 | 17,6 MB |
| | src (eşik 3) · acele | 3.563 | 12 | 3 | 49,6 / 49,9 | **9 / 4.706** | 9 | 9/9 | 9,1 MB |
| | src (eşik 4) · okur | 6.577 | 9 | 0 | 49,6 / 50,0 | 0 | 0 | 9/9 | 19,4 MB |
| | src (eşik 4) · acele | 6.520 | 12 | 4 | 49,6 / 283 | 0 | 0 | 8/8 | 10,5 MB |
| 4G · ağır · AV1 | blob · okur | 4.375 | 9 | **0** | 49,6 / 49,7 | 0 | 0 | 9/9 | 15,7 MB |
| | blob · acele | 4.389 | 12 | **3** | 49,7 / 49,9 | 0 | 0 | 9/9 | 12,5 MB |
| | src (eşik 3) · okur | 3.183 | 9 | 0 | 49,8 / 600 | 3 / 687 | 3 | 9/9 | 15,3 MB |
| | src (eşik 3) · acele | 3.153 | 12 | 3 | 49,6 / 617 | 2 / 711 | 2 | 9/9 | 7,7 MB |
| 1,6 Mbps / 150 ms · ağır · AV1 | blob · okur | 10.678 | 9 | 7 | 49,6 | 0 | 0 | 1/2 | 10,5 MB |
| | blob · acele | 10.752 | 12 | 9 | 49,7 | 0 | 0 | 1/3 | 6,7 MB |
| | src (eşik 4) · okur | 11.801 | 9 | 7 | 49,8 | 0 | 0 | 1/2 | 6,1 MB |
| | src (eşik 4) · acele | 11.798 | 12 | 6 | 49,8 | 3 / 1.728 | 3 | 4/6 | 4,3 MB |

"Açılışta hazır" = d0 döngüsü + ilk ileri geçiş hazır (poster_0 baştan görünür). "İlk kare" yalnız klip
oynatılan adımlar. Okumalar:

- **"Hazır değilken jest" çözümü** (uygulandı ve ölçüldü): 300 ms bekleme + poster çapraz sönmesi. Kullanıcı hiçbir
  zaman boş ekran ya da donmuş yarım klip görmez; yalnız o adım "hareketsiz" geçer. Hedef durağın klipleri yedek
  sürerken yüklenir. İlk sürümde (yönle hemen bırakma, yedekte yükleme yok) acele tempoda yedek zinciri oluştu:
  AV1 4G 9/12 → şimdi 3/12 (o koşuda spike sunucusu ağır seti önbellek başlığısız sunuyordu; kıyas yaklaşık).
- **src kipi canplay (eşik 3) ile klip ortasında donuyor** (H.264 4G okur: 9 adımda 4 takılma, 1,95 sn). Eşik 4
  (`canplaythrough`) Chrome'da takılmayı sıfırlıyor ama iOS'ta güvenilir değil (§6). blob kipinde takılma yapısal
  olarak yok.
- **Bayt belirleyici:** aynı acele tempoda yedek H.264 5/12 → AV1 3/12; okur temposunda ikisi de 0. 1,6 Mbps'de
  AV1 bile yetmiyor (7/9): yavaş ağda site poster sönmelerine iner (işlevsel, sinematik değil) → ağ hızı ölçülüp
  daha düşük bit hızlı bir set (540×960 ya da yüksek CRF) seçilmeli (§8).
- blob kipinde açılış daha geç "hazır" (tam indirme): H.264 6,0 sn, AV1 4,4 sn (src 3,2–3,6 sn). Poster_0 zaten
  görünür; yine de ilk döngü için `src` akışı önerilir (§8).
- Okur temposunda blob, oturum boyunca tüm seti indirir (pencere + ters klipler): H.264 24,4 MB, AV1 15,7 MB.

### 3.6 Otomatik oynatma engeli

**(a) Chrome `--autoplay-policy=user-gesture-required`:** etkinleştirme yokken (CDP `userGesture:false`,
`isActive=false`) sessiz döngü **oynadı**, sesli video `NotAllowedError`. Chrome sessiz videoyu muaf tutuyor; bu
bayrak iOS düşük güç modunu taklit edemiyor.

**(b) iOS düşük güç modu benzetimi** (init script: `HTMLMediaElement.prototype.play` yalnız güvenilir
`touchend/click/keydown/mousedown/pointerup` işlenirken izinli; bir kez açılan öğe açık kalır):

| Adım | Ne oldu |
|---|---|
| Açılış | d0 döngüsünün `play()`'i reddedildi (1 ret) → `engel=true`, video katmanı gizli, poster_0 görünür (yüklü) |
| 1. jest (0→1) | `touchmove` adım atmadı; `touchend`'de yakalama aşamasında 3 öğenin kilidi açıldı, aynı olayda adım: klip oynadı, ilk kare touchend'den 14,5 ms sonra, 48/48 kare |
| 2.–4. jest (1→2→3→2) | Normal (`touchmove`), ilk kare 33–50 ms, 47 kare, ret yok; `src` değişse de öğeler açık (toplam 3 açılış, 1 ret) |

Gerçek iOS'ta WebKit'in öğe başına kısıtının `src` değişince korunduğu **(V)**; cihazda sınanmalı.
(`sonuc/engel.json`, ekran: `sonuc/engel-0-poster.png`, `sonuc/engel-1-sonra.png`)

### 3.7 Alternatif: WebP kare dizisi → canvas

Aynı 2 sn geçiş, 48 × WebP q75 720×1280, `createImageBitmap` + `drawImage`, 24 fps hedefi:

| | WebP kare dizisi | Video (aynı klip) |
|---|---|---|
| Boyut (test klibi g0-1) | 1.193 KB (48 kare) | H.264 332 KB (3,6× küçük) |
| Boyut (gerçekçi vekil) | 3.716 KB (JPEG q5: 4.449 KB) | H.264 CRF 23 1.073 KB (3,5×), AV1 448–645 KB |
| Kare çözme (`createImageBitmap`) | p50 3,8 ms, p95 5,3 ms; 48 kare 186 ms (CPU 4×; 1×: 3,2 / 3,8 ms, 154 ms) — masaüstü Ryzen, çözme ana iş parçacığında değil | Donanım çözücü |
| Oynatma | Önceden çözülmüş: 48/48 kare, 60,4 fps rAF; anlık (3 kare ileri bakış): 48/48, 59,9 fps | 0 düşen kare (§3.1) |
| Bellek | Çözülmüş 48 bitmap = 169 MB; süreç özel baytı 217 → 545 MB (GPU +310 MB) | 3 öğelik havuz: 30 adımda tüm süreçler +83–101 MB |

Masaüstünde akıcı, ama telefon için 3,5× bayt ve klip başına ~170 MB çözülmüş bellek kabul edilemez → **reddedildi**.
(`web/webp.html`, `sonuc/webp-x4.json`, `sonuc/webp-x1.json`)

### 3.8 Geçiş yarıda tersine (brief-icinden-3 "D − t" önerisi için)

brief-icinden-3: "ters jest, geri klibe **D − t** anından geçer". Ölçüm (`web/ters.html`): ileri klip t ∈
{0,3; 0,6; …; 1,8 sn} anındayken önceden yüklenmiş geri klipte `currentTime = 2 − t`, `seeked` ve ilk kare
(CPU 4×, gerçekçi vekil, blob):

| Geri klip | Boyut | seek p50 / en çok (ms) | seek → ilk kare p50 / en çok (ms) |
|---|---|---|---|
| H.264 GOP 48 | 782 KB | 7 / 12 | 16 / 33 |
| H.264 GOP 24 | 904 KB (+%16) | 5 / 6 | 16 / 33 |
| H.264 GOP 12 | 1.137 KB (+%45) | 4 / 4 | 16 / 33 |
| AV1 GOP 48 | 622 KB | 15 / 25 | 33 / 33 |
| AV1 GOP 24 | 655 KB (+%5) | 5 / 8 | 16 / 33 |
| AV1 GOP 12 | 689 KB (+%11) | 4 / 6 | 33 / 33 |

`playbackRate = 1,25` (geri, H.264): 2.006 → 1.608 ms, 47 kare sunuldu, 0 düşen. Masaüstü donanım çözücüde
arama ucuz; telefonda GOP 48 aramanın 47 kareye kadar çözmesi gerekir **(V: 100–300 ms olabilir)** → ters geçiş
uygulanacaksa GOP 24 (H.264 +%16, AV1 +%5). Asıl maliyet yuva: ters klip ileri geçiş sürerken hazır olmalı
(bu spike'ta varıştan sonra atanıyor) → 4. `<video>` ya da "aynı yöndeki sonraki geçiş"ten vazgeçmek.
(`sonuc/ters-x4.json`)

## 4. Kodek önerisi

1. **H.264 taban** (her tarayıcı, her iPhone): High, level 3.1 (720×1280@24; 1080p için 4.0), x264 `slow`
   CRF 23–24, GOP 48 (klip başına tek I-kare; §3.8 ters geçiş istenirse 12–24), `-sc_threshold 0`,
   `-movflags +faststart`, `-an`, `yuv420p`.
2. **HEVC (Apple ve donanımlı Android):** x265 `slow` CRF 25, MP4 etiketi **`hvc1`** (Safari `hev1`'i oynatmaz).
   Aynı kalitede ~%32 küçük.
3. **AV1:** SVT-AV1 preset 4, CRF 28–33. Aynı kalitede ~%40–58 küçük. Safari'de yalnız donanım çözücüyle
   (A17 Pro / M3 ve sonrası) **(V)**; Chrome Android'de dav1d yazılım çözücü hep var ama `powerEfficient`
   false olabilir → pil.
4. **Seçim JS'te** (`src` elle atandığı için `<source>` listesi kullanılmaz): `navigator.mediaCapabilities.decodingInfo({type:"file", video:{contentType, width, height, bitrate, framerate}})`
   → sırayla AV1, HEVC; `supported && powerEfficient && smooth` ilk olan, yoksa H.264. API yoksa
   `canPlayType(tip) === "probably"`. `<source>` ile kullanılırsa sıra AV1 → HEVC → H.264 ve `type`'ta codecs
   dizesi. Kodek dizeleri: `avc1.64001f`, `hvc1.1.6.L93.90` (x265'in gerçek dizesi, §5), `av01.0.05M.08` (MP4 örnek tanımından doğrulandı).
5. Çözünürlük: 720×1280 (DPR 3 telefonda ~1,6× büyütme; foto-gerçekçi hareketli içerikte kabul edilebilir **(V)**).
   1080×1920 ~1,5× bayt; yalnız AV1/HEVC kolunda düşünülebilir.

## 5. Bütçe — gerçek render ile ölçüldü (C turu, 3 Kasım 2026, kodlama ajanı K-C)

Kaynak: `D:\soft\cop31-varlik\render-son\` (Cycles 1920², PNG 16 bit; C turunda S1 t23 + t34a, S2 t34b + l4 + p6
yeniden render edildi; t34 = `scripts/icinden/t34-birlestir.py`, kare 47 ↔ 48 16 bit farkı 0). Tek komut
`docs/klipler-sema.md` §4 (x264/x265 `slow`, SVT-AV1 p4, GOP = klip, `-sc_threshold 0`, +faststart, `-an`, yuv420p,
BT.709). Liste `D:\soft\cop31-varlik\kodlama\render-son.json`, doğrulama `python -X utf8 -P
scripts/icinden/kodlama-dogrula.py --vmaf` → `kodlama\dogrula-render-son.json`. **kB = 1.000 bayt, MB = 10⁶ bayt.**
VMAF v0.6.1, master → aynı kırpım/ölçek (lanczos) referansına karşı, ortalama (parantezde en düşük kare).

**Ayarlar (brief-icinden-3 §11.2).**

- **CRF:** B'deki döngü/geri +2 geri alındı → ileri ve döngü H.264 23 / HEVC 25 / AV1 30, geri 26 / 28 / 34; yalnız
  **t23 ve t34 ileri 26 / 27 / 32** (geri r32/r43 tabanda kaldı).
- **t23 → l3 dikişi (§11.2-6):** CRF'den sonra kodlanmış t23 son ↔ l3 0 H.264 dikey 3,21 / yatay 3,33 ✗, HEVC 2,97,
  AV1 2,21 / 2,36 → **yalnız t23 H.264'e `zones` kare 74–83, CRF −4** (`b=1,5874`; tabloda `*`): 2,66 / 2,79 ✓, bedeli
  +114 / +118 kB. HEVC'de de denendi (2,97 → 2,43, +184 kB): eşiğin altında olduğu için uygulanmadı.
- **Yatay kırpım `kirpimY` (§11.2-5):** yatay kırpımın y ofseti klip başına (master px): t23 420 → 200 (kare 24–72,
  easeInOutCubic; ffmpeg `crop` y ifadesi kare numarası `n` ile, tam sayıya yuvarlanır, ölçekten önce), l3 ve p3 200,
  t34 kare 0–47 200 / ≥ 48 420 (basamak düz #FFF1DC parlamasında), diğerleri 420. Geri klipler `reverse` ile
  kendiliğinden doğru (r32 son = t23 0 = 420). Manifestte d3 yatay çapaları 200 ile çevrildi: Expo (640; 525), D400
  (491,9; 676,5), **Beydağları (622,3; 40,2)**, Antalya (643,7; 158,6), **Antalya Körfezi (506,3; 136,7)** — B'de
  yalnız Expo ve D400 kadrajdaydı. `dunyaC`, `sutunlar`, `brosurDikdortgen`, d4 etiketleri ve lombar hizası B
  manifestiyle bayt bayt aynı. Yatay p3'te Beydağları sırtı (y ≈ 30–120) ve körfez suyu (y ≈ 110–165) görünür.
- **Posterler WebP q80.** p3 için q68–76 denendi (aşağıda); hiçbiri q80'e göre ΔE00 ≤ 1,0 koşulunu sağlamadı → q80.

| Klip | tür | kare | CRF (264/265/AV1) | dikey H.264 | dikey HEVC | dikey AV1 | yatay H.264 | yatay AV1 | VMAF dikey 264/265/AV1 (min) | VMAF yatay 264/AV1 |
|---|---|---|---|---|---|---|---|---|---|---|
| t01 | ileri | 54 | 23/25/30 | 259 | 288 | 219 | 234 | 204 | 96,5/97,1/97,4 (87,7) | 96,1/96,8 |
| r10 | geri | 54 | 26/28/34 | 205 | 186 | 177 | 178 | 167 | 92,3/94,2/96,1 (87,6) | 91,9/95,6 |
| l1 | döngü | 120 | 23/25/30 | 462 | 427 | 411 | 359 | 321 | 93,8/93,8/94,5 (90,0) | 94,0/94,6 |
| p1 | poster WebP q80 | 1 | — | 72 | | | 56 | | — | — |
| t12 | ileri | 60 | 23/25/30 | 686 | 553 | 470 | 626 | 433 | 98,3/98,4/99,0 (86,8) | 97,8/98,5 |
| r21 | geri | 60 | 26/28/34 | 453 | 374 | 362 | 430 | 340 | 93,8/95,9/97,9 (81,0) | 93,5/97,2 |
| l2 | döngü | 120 | 23/25/30 | 340 | 286 | 368 | 221 | 291 | 94,2/93,4/95,4 (92,8) | 94,1/95,7 |
| p2 | poster WebP q80 | 1 | — | 69 | | | 62 | | — | — |
| t23 | ileri | 84 | 26*/27/32 | 1.383 | 1.243 | 1.283 | 1.374 | 1.324 | 94,1/94,6/95,6 (79,0) | 94,0/96,0 |
| r32 | geri | 84 | 26/28/34 | 1.277 | 975 | 1.130 | 1.256 | 1.186 | 91,7/92,0/94,3 (73,7) | 91,9/94,7 |
| l3 | döngü | 150 | 23/25/30 | 324 | 260 | 533 | 349 | 569 | 95,5/94,9/97,2 (94,9) | 95,5/97,1 |
| p3 | poster WebP q80 | 1 | — | 218 | | | 229 | | — | — |
| t34 | ileri | 72 | 26/27/32 | 951 | 947 | 1.172 | 959 | 1.182 | 97,9/98,3/98,7 (87,9) | 97,4/98,5 |
| r43 | geri | 72 | 26/28/34 | 1.085 | 910 | 1.003 | 994 | 1.010 | 97,6/98,0/98,5 (78,7) | 97,3/98,3 |
| l4 | döngü | 120 | 23/25/30 | 170 | 108 | 211 | 154 | 163 | 96,1/95,9/97,1 (94,8) | 95,6/96,9 |
| p4 | poster WebP q80 | 1 | — | 45 | | | 38 | | — | — |
| t45 | ileri | 60 | 23/25/30 | 768 | 550 | 602 | 751 | 556 | 99,6/99,7/99,8 (93,3) | 99,2/99,6 |
| r54 | geri | 60 | 26/28/34 | 529 | 401 | 474 | 520 | 442 | 98,9/99,2/99,6 (88,0) | 97,7/99,3 |
| l5 | döngü | 120 | 23/25/30 | 180 | 72 | 151 | 188 | 152 | 95,7/95,7/97,2 (95,3) | 95,7/97,2 |
| p5 | poster WebP q80 | 1 | — | 44 | | | 46 | | — | — |
| t56 | ileri | 72 | 23/25/30 | 626 | 386 | 378 | 666 | 418 | 99,8/99,8/99,8 (92,5) | 99,6/99,8 |
| r65 | geri | 72 | 26/28/34 | 501 | 288 | 290 | 541 | 316 | 99,0/99,3/99,6 (86,2) | 98,4/99,4 |
| p6 | poster WebP q80 (plaka, broşürsüz) | 1 | — | 26 | | | 28 | | — | — |
| **video toplamı** | | | | **10.199** | **8.254** | **9.234** | **9.801** | **9.073** | | |
| poster toplamı | | | | 474 | | | 460 | | | |

Bütçe (§11.2-3; MB). İlk yükleme = HTML+JS+CSS+font 0,5 + t01 + p1 + l1 + t12; d_j varışında **kritik yol** =
t(j→j+1) + l(j+1) + p(j+1), **pencere** = kritik + r(j→j−1); set = video + poster; **tam tur oturumu (0→10)** = set +
1,27 MB medya dışı (W-B2 ölçümü: oturum 11,82 − set 10,55; font, JS, HTML, broşür görselleri), d10 dönüşü önbellekten.

| Set | İlk yükleme ≤ 2,5 | kritik d1 · d2 · d3 · d4 · d5 (≤ 1,8) | pencere d1 · d2 · d3 · d4 · d5 (≤ 2,5) | Set ≤ 15 | Tam tur oturumu (≤ 12, AV1) |
|---|---|---|---|---|---|
| dikey H.264 | 1,98 ✓ | 1,09 · **1,93** · 1,17 · 0,99 · 0,65 ✗ | 1,30 · 2,38 · 2,44 · 2,08 · 1,18 ✓ | 10,67 ✓ | 11,94 |
| dikey HEVC | 1,84 ✓ | 0,91 · 1,72 · 1,10 · 0,67 · 0,41 ✓ | 1,09 · 2,10 · 2,08 · 1,58 · 0,81 ✓ | 8,73 ✓ | 10,00 |
| dikey AV1 | 1,67 ✓ | 0,91 · **2,03** · 1,43 · 0,80 · 0,40 ✗ | 1,08 · 2,40 · **2,56** · 1,80 · 0,88 ✗ | 9,71 ✓ | 10,98 ✓ |
| yatay H.264 | 1,77 ✓ | 0,91 · **1,95** · 1,15 · 0,98 · 0,69 ✗ | 1,09 · 2,38 · 2,41 · 1,98 · 1,22 ✓ | 10,26 ✓ | 11,53 |
| yatay AV1 | 1,51 ✓ | 0,79 · **2,12** · 1,38 · 0,76 · 0,45 ✗ | 0,95 · 2,46 · **2,57** · 1,76 · 0,89 ✗ | 9,53 ✓ | 10,80 ✓ |

- **Tutanlar:** ilk yükleme 1,51–1,98 MB ✓; set 8,73–10,67 MB/kodek ✓; tam tur oturumu AV1 dikey 10,98 / yatay 10,80 MB ✓
  (H.264 11,94 / 11,53, HEVC 10,00); HEVC'de kritik ve pencere ✓; H.264'te pencere ✓ (en çok 2,44).
- **Kritik yol d2 aşılıyor:** H.264 dikey 1,93 / yatay 1,95, AV1 2,03 / 2,12 MB ✗ (≤ 1,8). d2 = t23 + l3 + p3; t23 tek
  başına 1,24–1,38 MB. H.264'te zones olmadan 1,81 / 1,83 idi (zones +0,11). AV1'de l3 533 / 569 kB: yakın-durağan
  sahnenin tek I-karesi CRF 30'da H.264 CRF 23'ten daha ayrıntılı (VMAF 97,2 ↔ 95,5).
- **Pencere d3 AV1 2,56 / 2,57 MB ✗** (t34 1,17 + l4 0,21 + p4 0,05 + r32 1,13); H.264 ve HEVC ✓.
- B'ye göre (eski adım tanımı t + l + p + r): d2 dikey H.264 2,72 → 2,38, d3 2,66 → 2,44 MB; t23 H.264 1,87 → 1,38 MB,
  t34 1,47 → 0,95 MB. Döngü ve geri tabana dönünce set +0,1–0,2 MB büyüdü (H.264 10,55 → 10,67).
- **Ölçülmüş seçenekler** (dikey, ayrı kodlama, teslim EDİLMEDİ; kB ve VMAF ort. (en düşük)): p3 q68 168,6 (−49,8);
  l3 H.264 CRF 25 274,2 (−50,1; 94,7); l3 AV1 CRF 32 498,3 (−35,0; 97,1), CRF 34 468,9 (−64,4; 97,0); t23 AV1 CRF 34
  1.128,0 (−154,8; 94,4 (76,8) — H.264 t23 94,1 ile eş); t34 AV1 CRF 34 1.042,2 (−129,8; 98,6); r32 AV1 CRF 36 969,9
  (−160,0; 92,6 (68,9)). Örnek hesap: AV1'de t23 CRF 34 + l3 CRF 34 + p3 q68 → kritik d2 2,03 → 1,77 ✓; t34 CRF 34 →
  pencere d3 2,56 → 2,43 ✓. H.264'te p3 q68 + l3 CRF 25 → 1,93 → 1,83 (yine ✗); üstüne zones da kaldırılırsa 1,71 ama t23 → l3
  3,21 ✗. Karar orkestratörün.

**p3 poster kalitesi (§11.2-4).** Aynı filtre zinciri (kırpım + lanczos + rgb24 → libwebp, `-compression_level 6`);
WebP libwebp ile (Pillow) çözüldü; ΔE00 piksel ortalaması.

| q | dikey kB | ΔE00 q80'e | ΔE00 master'a | yatay kB | ΔE00 q80'e | ΔE00 master'a |
|---|---|---|---|---|---|---|
| 60 | 154,8 | 2,85 | 3,39 | 160,5 | 3,02 | 3,57 |
| 68 | 168,6 | 2,66 | 3,26 | 176,2 | 2,83 | 3,42 |
| 70 | 172,2 | 2,62 | 3,23 | 180,4 | 2,76 | 3,39 |
| 72 | 176,2 | 2,56 | 3,20 | 184,4 | 2,71 | 3,36 |
| 74 | 180,6 | 2,51 | 3,17 | 191,1 | 2,62 | 3,29 |
| 76 | 190,0 | 2,33 | 3,08 | 199,1 | 2,48 | 3,23 |
| 78 | 203,2 | 2,03 | 2,99 | 211,6 | 2,18 | 3,14 |
| **80 (teslim)** | **218,3** | 0 | 2,86 | **229,4** | 0 | 3,01 |

Koşul (q80'e göre ΔE00 ≤ 1,0) hiçbir kalitede tutmuyor: p3 çok ayrıntılı arazi ve her kalite basamağı piksel
düzeyinde ~2 ΔE00 doku gürültüsü üretiyor (8×8 blok ortalamasında bile q78 1,12, q68 1,28). 150 kB hedefi q60'ta bile
aşılıyor (154,8). 2× büyütmede q68 ile q80 arasında yalnız hafif yumuşama görülüyor; ölçüt "master'a uzaklık q80'e
göre en çok +1,0" olsaydı q68 seçilirdi (dikey +0,40, yatay +0,41; −49,8 / −53,2 kB). Karar orkestratörün:
`--poster-q p3=68`.

Dikişler (kodlanmış, ΔE00 ortalaması; aynı kodek ve kırpım; parantezde hedef posterine karşı):

| Dikiş (ΔE00 ort.) | dikey H.264 | dikey HEVC | dikey AV1 | yatay H.264 | yatay AV1 |
|---|---|---|---|---|---|
| t01 son → l1 0 (poster) | 1,53 (1,79) | 1,37 (1,85) | 1,14 (1,66) | 1,21 (1,62) | 0,91 (1,52) |
| t12 son → l2 0 (poster) | 1,67 (1,89) | 1,65 (1,88) | 1,59 (1,84) | 1,53 (1,73) | 1,45 (1,68) |
| t23 son → l3 0 (poster) | 2,66 (3,20) | 2,97 (3,52) | 2,21 (3,02) | 2,79 (3,30) | 2,36 (3,19) |
| t34 son → l4 0 (poster) | 1,30 (1,93) | 1,39 (1,90) | 1,08 (1,73) | 1,27 (1,82) | 1,06 (1,70) |
| t45 son → l5 0 (poster) | 1,31 (1,61) | 1,34 (1,60) | 1,27 (1,58) | 1,35 (1,67) | 1,27 (1,61) |
| t56 son → p6, dikdörtgen dışı 0 / 45 px pay (tüm kare) | 2,13 / 1,08 (11,0) | 2,24 / 1,19 (11,1) | 2,18 / 1,12 (11,0) | 2,15 / 1,10 (11,0) | 2,17 / 1,12 (11,0) |
| kalkış l2 0 → t23 0 | 1,56 | 1,57 | 1,32 | 1,39 | 1,33 |
| kalkış l3 0 → t34 0 | 2,93 | 2,78 | 2,36 | 3,00 | 2,49 |
| geri r21 son → l1 0 | 1,63 | 1,58 | 1,36 | 1,35 | 1,17 |
| geri r32 son → l2 0 | 1,81 | 1,83 | 1,60 | 1,65 | 1,48 |
| geri r43 son → l3 0 | 3,48 | 3,42 | 2,88 | 3,60 | 3,00 |
| geri r54 son → l4 0 | 1,41 | 1,51 | 1,24 | 1,32 | 1,23 |
| geri r65 son → l5 0 | 1,45 | 1,48 | 1,28 | 1,52 | 1,32 |
| t34 47 ↔ 48 fark /255 (komşu 43–47) | 0,002 (0,00–0,12) | 0,005 (0,00–0,02) | 0,979 (0,97–1,00) | 0,003 (0,00–0,30) | 0,985 (0,98–1,03) |

- **Dikiş özeti:** t23 → l3 zones sonrası 2,21–2,97 ✓ (hedef ≤ 3; posterine karşı 3,02–3,52, poster WebP ile video
  I-karesi arasındaki fark payı +0,5). r32 son → l2 0 1,48–1,83 ✓. Kalkış l3 0 → t34 0 2,36–3,00 (B 2,73–3,31).
  **Geri r43 son → l3 0 2,88–3,60** (kabul listesinde yok; geri CRF'de GOP sonundaki yumuşak kare ↔ l3 I-karesi):
  r43'e zones 62–71 CRF −4 denendi → H.264 3,48 → 2,96 dikey / 3,60 → 3,10 yatay, HEVC 3,42 → 2,88; bedeli +166 / +153
  / +174 kB → uygulanmadı.
- **t56 → p6:** p6 artık broşürsüz (§11.1 S2-C 2); tüm karede 11,0 beklenen fark (kapak + yığın t56'da var, DOM broşür
  örter). Broşür dikdörtgeninin dışında 2,13–2,24, 45 master px pay ile 1,08–1,19 (öteki poster dikişleri 1,5–1,9):
  aradaki bant yığının taşan kâğıtları ve gölgesi (S2-C ölçümü ≤ 37 master px).
- **t34 47 ↔ 48** (yatayda kırpım 200 → 420 basamağı burada): H.264/HEVC 0,002–0,005/255; AV1 0,98/255, ama komşu düz
  kareler arasında da 0,97–1,03 (SVT-AV1'in hiyerarşik QP katmanları düz kremde ±1 seviye oynatıyor; kırpımdan değil,
  master'da 47 ↔ 48 16 bit farkı 0). Kare 47 tonu #FFF1DC'ye ΔE00 0,51–1,09.
- **Döngü kapanışı** (son→ilk / ardışık ortalama, /255; ΔE00 son→ilk ≤ 0,97): I-kare sıçraması sürüyor (§11.4 kabul),
  en belirgin l1 H.264 1,55 / 0,18 (dikey), 1,14 / 0,13 (yatay); l3'te 0,00–0,17.
- **VMAF ≥ 90: 85/85 dosya ✓.** İleri 94,0–99,8, döngü 93,4–97,2, geri 91,7–99,6; en düşük r32 H.264 dikey 91,7 (B'de
  +2 CRF'le 85,7). t23/t34 (CRF 26/27/32) 94,0–96,0 / 97,4–98,7: t23 için beklenen ≥ 93 tuttu.
- **Kodek dizeleri** (MP4 örnek tanımından): `avc1.64001f` 34/34, `hvc1.1.6.L93.90` 17/17 (manifest de bu), `av01.0.05M.08`
  34/34 ✓; kare sayıları 85/85 fragmanla eşit.
- **Süre:** tam set 227 s (97 dosya; 6 çekirdek, GPU ajanları bitmişti); t23 + t34 yeniden (zones) 63 s; doğrulama +
  22 FFV1 referansı + 85 VMAF 8 dk 08 s. Kodlama deterministik: B ile aynı master ve ayardaki 27 dosya (t01/t12/t45/t56
  ileri, p1/p2/p5, p3 dikey) aynı özetle çıktı.
- **Teslim:** `public/icinden` 97 listedeki dosya + `kart-icinden.webp` = 98 dosya, 47.548.632 bayt; fazla 0, eksik 0;
  manifestteki 97 yolun hepsi diskte. Kapak tonu (t56 k_0071) B ile aynı: saturate 0,934, contrast 0,894, brightness
  1,0, sepia 0,057 (RMS 5,8/255).

Eski tahmin (R4, ağır vekil set): H.264 ~16 MB, HEVC ~12, AV1 ~10 — gerçek dikey video (C) 10,2 / 8,3 / 9,2 MB.

## 6. iOS riskleri (gerçek cihazda sınanmadı)

- **Düşük güç modu:** sessiz videoda bile otomatik oynatma kapalı; `play()` NotAllowedError ile reddedilir **(V)**.
  `touchmove` kullanıcı etkinleştirmesi değildir (HTML: etkinleştiren olaylar `keydown`, `mousedown`, `pointerup`
  (fare dışı), `touchend`…). Çözüm uygulandı: engel algılanınca dokunma adımı `touchend`'de, aynı olayda 3 öğenin
  kilidi açılır; öğeler yeniden kullanılır (WebKit kısıtı öğe başına; `src` değişince açık kalması **(V)**).
  Chrome bayrağı bunu taklit edemiyor (§3.6); benzetim JS katmanıyla yapıldı.
- **preload:** iOS Safari `preload="auto"`'yu çoğu durumda yalnız metadata gibi uygular, `canplaythrough` oynatma
  başlamadan gelmeyebilir **(V)**. blob kipi bu yüzden önerildi: `fetch` medya önyükleme politikasına tabi değil,
  Blob'tan yükleme yerel. Hazır ölçütü readyState ≥ 3; gelmezse 0. kare `poster` özniteliğiyle zaten görünür.
- **İlk kare:** iOS duraklatılmış videonun 0. karesini oynatmadan çizmeyebilir **(V)** → her öğede `poster`.
- **Range:** Safari videoyu Range (206) ile ister; Vercel statik dosyada destekler. Blob URL'de gerekmez.
- **`playsinline` + `muted`** (öznitelik olarak da) şart; yoksa tam ekran oynatıcı.
- **100svh:** native kaydırma kapalı ve programatik `scrollTo` araç çubuğunu daraltmadığından svh = görünen alan,
  sahne `inset: 0` + `object-fit: cover` **(V)**. Döndürmede yeniden ölçüm (adim.ts `remeasured`).
- **Eşzamanlı çözücü/bellek:** 3 yüklü öğe, en çok 2'si aynı anda oynar (280 ms'lik sönme penceresi). Blob bütçesi iOS'ta 25–30 MB
  önerilir **(V)**. Sekme arka plana gidince iOS videoyu durdurur: `visibilitychange`'de döngüyü yeniden başlat.
- **rVFC:** Safari 15.4+. Yoksa `playing` + `timeupdate` yedeği gerekir (spike'ta yok).
- **Data Saver / Düşük Veri Modu:** önyükleme penceresini daraltmak gerekebilir **(V)**.

## 7. Bilinen sınırlar

- Ölçümler masaüstü Chrome'da mobil emülasyon; CPU kısıtı medya çözücüyü ve GPU'yu yavaşlatmaz. Gerçek iPhone
  Safari ve orta sınıf Android'de jest→kare, kare düşmesi ve bellek yeniden ölçülmeli.
- Playwright'ın `page.evaluate`'i sayfaya kullanıcı etkinleştirmesi verir (`userGesture: true`; ölçüldü:
  `goto` + `evaluate` sonrası `isActive = true`). Otomatik oynatma testleri CDP `Runtime.evaluate(userGesture:false)`
  ile yapıldı.
- Geçiş sürerken ters jest desteklenmiyor (kilit). §3.8 maliyeti ölçüldü; uygulamak için ters klibin geçiş
  sürerken yuvada hazır olması gerekir (4. öğe ya da aynı yöndeki sonraki geçişten vazgeçmek).
- Test setindeki geçiş klipleri durak posterleriyle kare kare eşleşmiyor (sentetik); eşleşme kesmesinin
  görsel dikişsizliği ancak gerçek render'da sınanır.
- Ağır setin tüm geçişleri aynı yakınlaşma (farklı dosyalar); döngüler yavaş yakınlaşma (gerçekte sabit kamera,
  daha küçük).
- Açılışta poster_0 gelmeden sahne zemini görünür (negatif kontrol); üretimde satır içi LQIP + `fetchpriority=high`.

## 8. Üretim için somut öneriler

1. Blob kipi + öncelik kuyruğu (§1.4) + 3 öğelik havuz + poster katmanı. brief-icinden-3'te d0 DOM (logo):
   kullanıcı logoyu okurken önce T01, sonra d1 döngüsü iner (4G'de AV1 ~1,3 sn, H.264 ~2 sn); ilk jest daha
   önce gelirse T01'in DOM kısmı (logo sönmesi, 0–0,30 sn) beklemeyi örter, yetmezse §1.5 yedeği. Açılış
   yalnız klipli bir durakla başlarsa o durağın döngüsü `src` ile akış olarak başlatılabilir (blob'a göre
   ~1–2,5 sn erken, §3.5).
2. Kodek: H.264 + HEVC(`hvc1`) + AV1, seçim `mediaCapabilities` (§4). Klip başına bayt manifestte.
3. Bekleme 300 ms → poster yedeği; yedek süresi = klip süresi; hedef klipler yedek sürerken yüklenir.
4. Döngüler düşük genlikli ve küçük (sabit kamera, ≤ 0,4 MB/4 sn); gerekirse döngü yerine posterde CSS
   Ken Burns (0 bayt).
5. `next.config` `headers()`: `/klip/:path*` immutable; dosya adlarında içerik özeti.
6. Gerçek cihaz testi: iPhone (normal + düşük güç modu), iOS Chrome, orta sınıf Android; ölçüm sayfası
   prototipteki HUD (`?hud=1`) ve `window.__klip.oy.olaylar` ile.

## 9. Prototip dosyaları

Kök: `C:\Users\user\AppData\Local\Temp\claude\D--soft-cop31\4935df5b-f395-4622-886e-17daa992bcbf\scratchpad\klip-spike\`

| Dosya | İçerik |
|---|---|
| `uret.sh` | Test seti: ffv1 ara dosyalar (`ara/`, yeniden üretilebilir) → H.264/HEVC/AV1, posterler, WebP kareler |
| `uret-agir.sh` | Ağır set (`gercekci/ref720.mkv`, NASA Blue Marble vekili) |
| `merdiven.sh`, `yeniden-vmaf.sh` | Kodek merdiveni + kare hizalı VMAF |
| `manifest-yap.mjs` | `web/manifest.json` |
| `sunucu.mjs` | Statik sunucu, Range 206 + immutable önbellek, `http://localhost:5199/` |
| `web/index.html` | Prototip sayfa. Parametreler: `mod` (blob, src), `kodek` (h264, hevc, av1, oto), `set=agir`, `esik` (3, 4), `butce` (MB), `hud=0`, `ornek=1`, `bos=ff00ff` |
| `web/motor.js` | adim.ts uyarlaması (kilitli adımlama) |
| `web/oynatici.js` | Havuz, veri katmanı (blob/src), yedekler, ölçüm kancaları |
| `web/webp.html`, `web/ters.html`, `web/bos.html` | WebP kıyası, ters geçiş ölçümü, boş sayfa |
| `web/klip/`, `web/klip-agir/`, `web/klip-ters/`, `web/poster*/`, `web/kare/` | Klipler, posterler, WebP kareler |
| `olc.mjs` | Ölçümler: `duman, temel, ag, engel, siyah, webp, blobsrc, ters` |
| `hepsi.sh`, `ozet.mjs`, `kare-analiz.py` | Son ölçüm takımı, tablolar, ekran kaydı analizi |
| `kodek-yokla.mjs`, `onbellek-yokla.mjs`, `engel-yokla.mjs`, `negatif-kontrol.mjs` | Yoklamalar |
| `sonuc/` | Tüm JSON/CSV/log ve ekran görüntüleri |
