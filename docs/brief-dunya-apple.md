# /dunya — Apple cihazlarda kaydırma aşağı inmiyor (düzeltme brief'i)

Tarih: 2 Kasım 2026. Geri bildirim: "Dünya kısmı Apple bir cihazda kaydırıldığında aşağı inmiyor."
Yayındaki sürüm `ad9aed4`; çalışma ağacında derinleştirme (docs/brief-dunya-2.md) var. Bu brief
yalnızca `src/components/dunya/adim.ts` (ve gerekirse testler) içindir.

## 1. Kök neden (kanıtlı)

`adim.ts` → `frame()` her karede şunu yapar:

```ts
if (Math.abs(window.scrollY - lastSet) > 2) { anim = null; scheduleSettle(220); return false; }
window.scrollTo(0, y); lastSet = window.scrollY;
```

Chrome'da `scrollTo` sonrası `scrollY` anında ve kalıcı olarak yeni değeri verir. WebKit'te (iOS Safari,
macOS Safari, iOS'taki tüm tarayıcılar) belge kaydırması eşzamansızdır: konum UI sürecinde uygulanır ve
web sürecine bir-iki kare sonra geri bildirilir; `scrollY` o sırada animasyonun yazdığından bir karelik
hareket kadar (ease'in tepe noktasında 60 Hz'de ~17 px, düşük güç modunda 30 Hz'de ~35 px) geride/ileride
okunur. 2 px'lik eşik aşılır → adım "dışarıdan kaydırma" sanılıp iptal edilir → `settle()` en yakın bölüme
(kalkılan bölüme) döner, o animasyon da aynı sebeple iptal olur → sayfa 10–20 px ilerleyip kalır.

Kanıt (scratchpad `apple.mjs stale`, Chrome'da `window.scrollY` 1 ve 2 kare gecikmeli okutuldu):
her jest 11–20 px ilerliyor, bölüm değişmiyor; gecikme olmadan aynı jest tam bölüm atlıyor
(`kontrol.mjs touch` → 0→1→2→3→4, geri 4→3). Bulgu WebKit bugzilla 179735'le uyumlu ("inputs to
window.scrollTo aren't clamped … until the UI process sends back adjusted values").

İkincil (ölçüldü, `apple.mjs fight`): dokunma sırasında tarayıcı yine de native kaydırırsa (WebKit web
süreci meşgulken touchmove'u beklemeden kaydırmaya başlayabilir) adım iptal olur ve `settle()` dokunma
sürerken (`touching`) sessizce vazgeçer; touchend yeniden planlamaz → sayfa iki bölüm arasında asılı kalır.

Üçüncül (olası, Safari masaüstü trackpad): jestin ilk `wheel` olayı hafif yatay gelirse (`|dx| > |dy|`)
preventDefault çağrılmıyor; WebKit jestin geri kalanını native kaydırır ve sonraki preventDefault'ları
yok sayar → yine çekişme.

## 2. İstenen değişiklikler (`adim.ts`)

Kalıp `src/components/fidan/stepper.ts`'tekiyle aynı olsun: animasyon kendi `pos` değerini tek doğru kabul
eder, geri okumaya göre iptal etmez; native dokunma kaydırması CSS ile kapalı.

1. **Geri-okuma iptali kalksın.** `lastSet` karşılaştırmasıyla iptal yalnızca masaüstü kaydırma çubuğu
   sürüklemesi içindir. Yeni kural: `pointerDown` (fare, pointerdown ile set ediliyor) **ve** sapma > 2 px
   ise iptal; aksi hâlde sapma ne olursa olsun animasyon hedefini yazmaya devam eder (dokunma sürerken de).
   `touching` iken asla iptal yok.
2. **Dokunma native kaydırmasını CSS ile kapat.** `createStepper` içinde `document.documentElement` ve
   `document.body` için satır içi stil: önce `touchAction = "none"`, sonra `touchAction = "pinch-zoom"`
   (desteklenmezse "none" kalır); `overscrollBehaviorY = "none"`. `destroy()` eski değerleri geri yazsın
   (Activity/geri gezinmede sızmasın). `touchmove`'daki `preventDefault` yedek olarak kalsın.
3. **touchend sonrası yerleşme.** `onTouchEnd`'de (ve `touchcancel`) animasyon yoksa ve konum iki bölüm
   arasındaysa `scheduleSettle(60)`. `settle()` `touching` yüzünden vazgeçiyorsa bu zaten yeterli; ayrıca
   `settle()` içinde `touching` ise `scheduleSettle(200)` ile yeniden dene (iki yol birden olmasın: biri seç,
   gerekçesini yorumla).
4. **Tekerlek yatay elemesi sıkılaşsın.** `if (Math.abs(e.deltaX) > 1.5 * Math.abs(e.deltaY) + 2) return;`
   — (0,0) başlangıç olayı ve (3,1) gibi hafif çapraz başlangıçlar preventDefault alır; gerçek yatay jest
   (geri gezinme) tarayıcıda kalır.
5. **rAF zaman damgası.** `frame(now)` içinde `k = (now - t0)/dur` şu an 0'a kırpılıyor; Safari'de rAF
   damgası `performance.now()`'dan geride gelebilir — mevcut kırpma yeterli, dokunma. Ama `start()`'ta
   `t0 = performance.now()` yerine ilk `frame` çağrısında `t0 = now` atamak (fidan'daki `t0 = -1` kalıbı)
   daha güvenli; uygula.
6. Dosya başındaki açıklama bloğunu güncelle (WebKit eşzamansız kaydırma notu; neden geri okumaya
   güvenilmediği). Türkçe, kısa.

Dokunulmayacaklar: `STEP_MS`, eşikler, tersine çevirme, uzun bölüm içi `within()` mantığı, klavye,
kiosk `goTo/glideTo`, DunyaScene ile arayüz (`frame/busy/goTo/glideTo/remeasured/destroy`).
`DunyaScene.tsx`, `dunya.css` ve diğer dosyalara dokunulmaz (eşzamanlı başka bir ajan düzenliyor).

## 3. Doğrulama (uygulayıcı çalıştırır, sonuçları raporlar)

Dev sunucu `http://localhost:3000` açık. Scratchpad:
`C:\Users\user\AppData\Local\Temp\claude\D--soft-cop31\4935df5b-f395-4622-886e-17daa992bcbf\scratchpad\`

- `node apple.mjs all` → `stale.lag1/lag2` her adımda `ok: true` (0→664→1328→…), `fight.ok` ya da en
  azından `fight.yEnd` bir bölüm başında (bounced false, iki bölüm arasında asılı değil), `diag.ok: true`.
- `node kontrol.mjs touch`, `node kontrol.mjs wheel`, `node kontrol.mjs trackpad`, `node kontrol.mjs rapid`
  → önceki davranış aynen (tek jest = tek bölüm, ters yön geri döner, momentum ikinci adım atmaz).
- `npx tsc --noEmit -p . --incremental false` ve `npx eslint src/components/dunya/adim.ts` temiz.
- Gerçek Apple cihaz testi yapılamıyor; bunu raporda açıkça söyle.

## 4. Sonuç (2 Kasım 2026)

Uygulama + iki bağımsız denetim (WebKit lensi, regresyon lensi) + düzeltme turu. Brief'teki altı madde
uygulandı; denetimde doğrulanan üç orta bulgu da `adim.ts` içinde giderildi:

- **Fare kapısı:** `pointerDown` yalnızca birincil tuşla (`button === 0`) açılır; `contextmenu`,
  `dragend`, `blur`, `visibilitychange` ve tuşsuz tekerlek olayı kapıyı kapatır (bağlam menüsü
  pointerup'ı yutunca settle() sonsuza dek vazgeçiyordu). Kaydırma çubuğu iptali tek geri okumayla
  değil, son 5 yazılan konumla (`ours()`) kıyaslanır.
- **`here()` (fidan'daki `pos`):** adım, ters çevirme, yumuşak kaydırma, settle, goTo, dokunma tabanı
  ve klavye artık bayat `scrollY` yerine son 150 ms içinde yazılan konumdan başlar (geri sıçrama yok).
- **`within()` 1 px sınır payı:** WebKit konumu tam sayıya keser (5474,7 → 5474); sınıra 1 px'ten
  yakın taban sınırda sayılır, yoksa yarım ekran/yatay telefonda uzun bölüm sonunda tekerlek ve klavye
  takılıyordu. (Brief'in "dokunulmaz" listesindeydi; bulgu doğrulandığı için istisna yapıldı.)
- **Adım sürerken yeniden ölçüm:** `remeasured()` süren adımı hedef bölümün yeni sınırına yöneltir
  (`retarget`), bitince yerleşmeyi denetler (döndürme, geç yüklenen görsel).

Bilinen davranış değişikliği: adım sürerken End/Home, bul, Tab odağı ve orta tuş kaydırması adımı
iptal etmez; adım hedefine varır. Doğrulama: `apple.mjs all` (lag1/lag2 3/3, fight ve diag ok),
`apple2–6.mjs` ek senaryolar, `kontrol.mjs touch/wheel/trackpad/rapid/small` öncekiyle aynı, tsc,
eslint, `shot.mjs` üç kip, `next build`. **Gerçek Apple cihaz testi yapılamadı**; yayından sonra
iPhone Safari, iOS Chrome ve macOS Safari'de (trackpad + fare) elle denenmeli.
