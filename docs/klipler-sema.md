# `/icinden` v3 klip manifesti — şema ve üretim yolu

Tarih: 2 Kasım 2026 (A turu, W; B turu ön entegrasyonu: önizleme render'ı, t34 birleşimi, kapak tonu); **E turu (3 Kasım
2026, W1): `surum: 2`, 12 durak + `rol`, §0**. Bağlayıcı karar: `docs/brief-icinden-3.md` §9.3–§9.5, §12.1, §12.4-9. Oynatıcı mimarisi:
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

**`--gecici`** (W1, yeni S2 render/kodlama yokken): `node scripts/icinden/manifest-birlestir.mjs --gecici` →
`kaynak: "onizleme"`, `gecici: {t67: "t56", t78: "t56", r76: "r65", r87: "r65", p6: "p5", p7: "p5", p8: "p6"}` (eksik klip
ve posterler mevcut dosyalarla; d8'in `brosurDikdortgen`'i eski t56 fragmanından, `kapakTon` eski ton dosyasından).
yaylar.json, emanet ve duvar çapaları yoksa ilgili alan boş (uyarı). K2 son kodlamadan sonra **bayraksız** çalıştırır.

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
siler ve NTFS sabit bağlarla yeniden kurar (t34a k_0000–0047 → 0–47, t34b k_0000–0023 → 48–71; kopya yok), `t34.json`
yazar ve kare 47 ↔ 48'in 16 bit farkının 0 olduğunu doğrular. t34a ya da t34b yeniden render edilirse yeniden
çalıştırılır. `render-son/t34/` yoksa betikler yine çalışır: `t34a/` + `t34b/` ffmpeg `concat` ile tek 72 karelik
t34 olur, fragmanlar `t34a.json` + `t34b.json` → tek t34 (`kare` = 48 + 24, `kadraj_m` art arda, `sure` = kare / 30;
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
| `brosur_dikdortgen` | [[x, y] × 4] | yalnız t78 (E turundan önce t56) | son karede broşür kapağının köşeleri (sol üst, sağ üst, sağ alt, sol alt); manifestte d8 (`brosur-kapak`) `ozel.brosurDikdortgen` |
| `kamera` | {} | hayır | serbest (manifeste girmez) |

Ayrı fragmanlar (E turu): `p6.json` `capalar` {`fidan`, `genc_iklim`, `orman`} (S2b json_yaz; yoksa t56 son karesinin
`capalar`'ı) → d6 `ozel.duvarCapalari`. `yaylar.json` (S1a `scripts/blender/s1/yaylar.py`): `{dikey: [[[x, y] × ≤ 24] ×
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
| d6 | p6 (yoksa t56 son kare) | `fidan` ("300"), `genc_iklim`, `orman` (dağ şeridi) → `ozel.duvarCapalari` sırası = `iklim.items[0..2]`. Manifestte kalır; **site F turundan beri duvarda kılavuz çizmez** (D1-11: nokta glifin üstüne düşüyordu; spot satır döngüsü sürer) |

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
`kodla.mjs` tablolarında (`CRF_TABLO`, `POSTER_Q_TABAN` p3 68 / p6 80 / p7 80, `BOLGE_TABAN` t23.h264=74-83:-4);
bayrak gerekmez. Kapak tonu t78'in son karesinden (E: t78 66 kare, son kare **k_0065**; eski t56/k_0071 artık yok):

```
python -X utf8 -P scripts/icinden/t34-birlestir.py && node scripts/icinden/kodla.mjs --kaynak D:/soft/cop31-varlik/render-son --temizle && python -X utf8 -P scripts/icinden/kapak-ton.py --kare D:/soft/cop31-varlik/render-son/t78/k_0065.png --fragman D:/soft/cop31-varlik/render-son/t78.json --cikti D:/soft/cop31-varlik/kodlama/render-son-kapak-ton.json && node scripts/icinden/manifest-birlestir.mjs
```

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
```

Doğrulama (C turunda 8 dk 08 s: dikişler + 22 FFV1 referansının yeniden kurulması + 85 VMAF; D turunda 7 dk 57 s: dikişler + t01/l1/t12/l2/t23 için 10 yeni FFV1 referansı + 85 VMAF; referanslar önbellekteyse daha kısa):
`python -X utf8 -P scripts/icinden/kodlama-dogrula.py --vmaf` → `D:/soft/cop31-varlik/kodlama/dogrula-render-son.json`.

1. `t34-birlestir.py`: §1'deki t34 birleşimi (sabit bağlar + `t34.json` + 47↔48 doğrulaması).
2. `kodla.mjs`: 12 kaynak klip (t34 birleşik) → dikey H.264/HEVC/AV1 + yatay H.264/AV1, ileri + geri (`reverse`),
   posterler (WebP q80) ve aynı klibin eski özetli dosyalarının silinmesi. x264/x265 `-preset slow`, SVT-AV1 p4;
   BT.709 matris ve renk etiketi (16 bit → 8 bit dönüşüm kodlayıcıdan önce, `scale` içinde). Süreç önceliği düşük.
   - **CRF tabanı** (§9.4): ileri ve döngü H.264 23 / HEVC 25 / AV1 30, geri 26 / 28 / 34. `--crf` seçicisi tür
     (`ileri|geri|dongu`) ya da dosya adı (`t23`, `r32`, `l3`), isteğe bağlı `.kodek`; değer `+N`/`-N` (tabana ek) ya
     da `N` (mutlak). C turu: yalnız t23 ve t34 ileri H.264 26 / HEVC 27 / AV1 32 (geri r32/r43 tabanda). D turu
     (§11.6-1): t34 ileri AV1 **34**, l3 AV1 **32** (dikey + yatay); t23 AV1 32'de kalır (34'te en kötü kare VMAF 76,8).
   - **`--bolge ad.kodek=k0-k1:ΔCRF`**: x264/x265 `zones` (`b=` bit hızı çarpanı = 2^(−ΔCRF/6); CRF kipinde qscale'i
     böler). C turu: `t23.h264=74-83:-4` (t23 → l3 dikişi H.264'te > 3 idi; HEVC 2,97 ve AV1 2,21 ≤ 3, uygulanmadı).
     AV1'de yok sayılır.
   - **`--poster-q ad[.boyut]=q`**: poster WebP kalitesi (varsayılan 80). C turu: hepsi 80. D turu (§11.6-2): `p3=68`
     (dikey + yatay; p3 merdiveni `docs/klip-oynatma.md` §5), öteki posterler 80.
   - **Yatay kırpım `kirpimY`** (master px, `KIRPIM_Y` tablosu; §11.2-5): sayı ya da `{bas, son, k0, k1}` (kare ≤ k0 →
     bas, ≥ k1 → son, arası easeInOutCubic). **t23 `{420 → 200, 24 → 72}`**, **l3 (ve p3) 200**, **t34
     `{200 → 420, 47 → 48}`** (basamak düz #FFF1DC parlama karelerinde; 47↔48 farkı 0 kalır), diğerleri 420 (t01/l1/t12/l2
     ve S2 klipleri değişmez; lombar hizası, `dunyaC`, `sutunlar`, `brosurDikdortgen` aynı). ffmpeg: `crop=w=iw:h=ih*1080/1920:x=0:y='ih*(<bas>+(<son>-<bas>)*e(n))/1920'`,
     `e` kare numarası `n` ile easeInOutCubic; crop değeri tam sayıya yuvarlar (lrint), ölçekten önce. Geri klipler
     `reverse` kırpım + ölçekten SONRA olduğundan kendiliğinden doğru. Dikey kırpım (x 420) değişmez.
   - Tek klip: `--klip t56`. Önizleme seti örneği: `--kaynak D:/soft/cop31-varlik/render --esle
     t34b=D:/soft/cop31-varlik/render/_onizleme/s2-t34b,l4=…` (A/B turu ön entegrasyonu). Liste varsayılanı
     `D:/soft/cop31-varlik/kodlama/<kaynak klasör adı>.json` (render-son → `render-son.json`).
3. `kapak-ton.py`: d8 kesişmesi için render kapağının tonu (CSS `saturate contrast brightness sepia`, sRGB en küçük
   kareler; E turunda t78 son karesi **k_0065**'teki `brosur_dikdortgen` ↔ `D:/soft/cop31-varlik/s2/doku/kapak-dom-sirtsiz.png`;
   D turuna dek t56/k_0071).
   Render kapak oranı 0,708 değilse uyarır (doku farklı → sonuç güvenilmez; o zaman `--cift FFFFFF=<kâğıt>,…`).
4. `manifest-birlestir.mjs`: varsayılanları son render içindir (`--fragman render-son`, `--liste
   kodlama/render-son.json`, `--ton kodlama/render-son-kapak-ton.json`, `--yaylar render-son/yaylar.json`, `--kaynak
   render`). Yatay çapalar klip başına `kirpimY` ile çevrilir (listeden; çapanın klibi/karesi: etiket ve sütun → poster
   karesi, `dunyaC` → t01 0. kare, `brosurDikdortgen` → t78 son kare, `duvarCapalari` → p6). Uyarıları okuyun (kare
   sayısı, poster, sözlük dışı çapa, 12 sütun, 12 emanet, 3 duvar çapası, 27 yay); E turu son çalıştırmada beklenen tek
   uyarı t01 `dunyaC`'nin kare başına verilmiş olması. Çıktının sonunda rol tablosu (id | rol | tur | gelen | ileri/geri
   | döngü | poster | okuma) basılır. Yeni render yokken: `--gecici` (§0). E turunda liste `p8` poster satırları
   (eski p6 plakası, K0) ve t67/t78/r76/r87, p6/p7 satırları içermeli.
5. `kart.mjs`: ana sayfa kartı `public/icinden/kart-icinden.webp` (p1 = `render-son/l1/k_0000.png`, ≤ 60 KB).
6. `kodlama-dogrula.py`: kodek dizeleri (`avc1.64001f`, `hvc1.1.6.L93.90`, `av01.0.05M.08`), kare sayıları, dikişler
   (ileri son ↔ döngü 0 / poster, kalkış, geri son ↔ önceki döngü 0, t56 son ↔ p6 dikdörtgen dışı), döngü kapanışı,
   t34 47↔48, bütçe (§11.2-3: ilk yükleme, kritik yol, pencere, set, tam tur oturumu; §11.6-1 istisnaları kritik d2
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
  "surum": 2, "olusturma": "2026-11-03T…Z", "kaynak": "render",   // "onizleme" (EEVEE 960² ya da --gecici) | "yer-tutucu" (A)
  // "gecici": { "t67": "t56", … }                                  // yalnız --gecici (§0)
  "fps": 30, "master": 1920,
  "boyutlar": {
    "dikey": { "g": 720,  "y": 1280, "kirpim": [420, 0, 1080, 1920] },   // [x, y, g, y] master px
    "yatay": { "g": 1280, "y": 720,  "kirpim": [0, 420, 1920, 1080] }   // varsayılan; d3 (t23 sonu, l3, p3, t34 0–47)
  },                                                                     // y 200 — çapalar zaten buna göre çevrili (§4)
  "kodekler": [                                  // tercih sırası; istemci mediaCapabilities → canPlayType
    { "ad": "av1",  "tip": "video/mp4; codecs=\"av01.0.05M.08\"",   "boyutlar": ["dikey", "yatay"] },
    { "ad": "hevc", "tip": "video/mp4; codecs=\"hvc1.1.6.L93.90\"", "boyutlar": ["dikey"] },
    { "ad": "h264", "tip": "video/mp4; codecs=\"avc1.64001f\"",     "boyutlar": ["dikey", "yatay"] }  // her zaman yedek
  ],
  "duraklar": [                                  // d0 … d11 (sıra = durak numarası; §0 tablosu)
    {
      "id": "d3",
      "rol": "expo",                             // lombar|dunya|emanet|expo|anatomi|sutunlar|duvar|brosur-kapak|brosur-sayfa|brosur-arka
      "tur": "klip",                             // "klip": video (döngü varsa oynar; yoksa gelen klibin son karesi) | "dom": dinlenme DOM (ops. sabit poster)
      "okuma": [1260000, 1104000, …, 2300],      // gelen geçişin kare kare kadrajı (m), son öğe = dinlenme; ya da sabit metin
      "okumaDurak": "sayfa 1/12",                // (ops.) dinlenmede diziye üstün sabit metin (d6, d7, d8, d11)
      "poster": { "dikey": { "dosya": "/icinden/p/d/p3.1a2b3c4d.webp", "bayt": 31000, "lqip": "data:image/webp;base64,…" },
                  "yatay": { … } },              // null: posteri yok (d0)
      "dongu":  { "ad": "l3", "sure": 5, "kare": 150,
                  "dosya": { "dikey": { "h264": "/icinden/v/d/l3.….h264.mp4", "hevc": "…", "av1": "…" },
                             "yatay": { "h264": "…", "av1": "…" } },
                  "bayt":  { "dikey": { "h264": 0, … }, "yatay": { … } } },
      "ileri":  { "ad": "t34", "sure": 2.4, "kare": 72, "dosya": { … }, "bayt": { … },   // bu duraktan k+1'e
                  "geri": { "ad": "r43", "sure": 2.4, "kare": 72, "dosya": { … }, "bayt": { … } },  // k+1'den k'ya
                  "hizGeri": 1 },                // null: DOM geçişi ya da son durak. F turunda 1,25 → 1 (D2-01)
      "etiketler": { "dikey": [ { "ad": "expo", "metin": "Antalya Expo Center", "x": 360, "y": 657, "tur": "yapi" } ],
                     "yatay": [ … ] },           // tur: doga | yapi | bolge (+ "no" 1–4) | kunye (d1) | emanet (d2: no, donem, dx?, dy?); "nokta": true
      "ozel": {                                  // yalnız ilgili duraklarda
        "dunyaR": [115, …, 378],                 // d1, d11: t01 kare başına disk yarıçapı (video px, iki yön aynı)
        "dunyaC": { "dikey": [360, 512], "yatay": [640, 232] },
        "yaylar": { "dikey": [[[x, y] × ≤ 24] × 27], "yatay": [ … ] },  // d1, d11 (yaylar.json; istemciye GİTMEZ)
        "sutunlar": { "dikey": [[x, y] × 12], "yatay": [ … ] },        // d5
        "duvarCapalari": [ { "ad": "fidan", "dikey": [x, y], "yatay": [x, y] }, … ],  // d6 (p6; fidan, genc_iklim, orman)
        "brosurDikdortgen": { "dikey": [[x, y] × 4], "yatay": [ … ] },  // d8 (t78 son kare)
        "kapakTon": { "saturate": 1.49, "contrast": 0.51, "brightness": 1.11, "sepia": 0.09 }  // d8 (kapak-ton.py)
      }
    }
  ]
}
```

Durak tablosu: §0 (E turu, 12 durak). `istemciManifesti()` istemciye giden kopyadan `etiketler`'i ve `ozel.yaylar`'ı
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
