/**
 * Bölüm bölüm adımlama (Konsept A).
 *
 * Native CSS snap'in geçişi çok kısa (Chrome'da ~80–120 ms; tek tekerlek
 * hareketi bölüm bile değiştirmiyor), küre animasyonu izlenemiyordu. Bu modül
 * kaydırmayı JS ile yönetir:
 *
 *   - Tekerlek: deltaY birikir, eşik (40 px) aşılınca tek adım. Adımdan sonra
 *     tekerlek akışı "susana" (180 ms boşluk) ya da yeni bir hareket başlayana
 *     dek kapalı: trackpad'in eylemsizlik (momentum) olayları ikinci adım atmaz.
 *   - Dokunma: dikey fark > 40 px → bir adım (parmak kalkmadan tetiklenir).
 *   - Klavye: ↓ / PageDown / Space ileri, ↑ / PageUp / Shift+Space geri.
 *   - Uzun bölüm (içerik viewport'tan uzun): bölüm içinde serbest kaydırma
 *     (tekerlek/klavye kısa yumuşak kaydırma, dokunmada parmağı izleme +
 *     eylemsizlik); adım yalnızca bölüm sınırında tetiklenir.
 *   - Adım: hedef bölüme rAF ile ~1 sn easeInOutCubic. Sürerken aynı yöndeki
 *     tetikleyiciler yok sayılır; ters yön adımı iptal eder ve kalkılan bölüme
 *     geri döndürür (yarım sahne bırakmaz).
 *   - Tarayıcının kendi kaydırması (kaydırma çubuğu, odak, bul) bölümler arası
 *     bir yerde biterse en yakın bölüme yerleşir.
 *
 * Kaydırma konumu dışarıdaki tek rAF döngüsünde (DunyaScene) `frame()` ile
 * ilerletilir; böylece sahne aynı karede yeni konumu okur.
 */

export type Durak = {
  /** Dinlenme bölgesinin başı: bölümün üstü viewport üstünde (sayfa px). */
  start: number;
  /** Dinlenme bölgesinin sonu: uzun bölümde altı viewport altında; kısa bölümde = start. */
  end: number;
};

type Anim = {
  from: number;
  to: number;
  t0: number;
  dur: number;
  ease: (x: number) => number;
  /** "step": bölüm geçişi (kilitli); "soft": bölüm içi yumuşak kaydırma (yeniden hedeflenebilir). */
  kind: "step" | "soft";
  dir: 1 | -1;
  /** Adımın kalktığı/vardığı bölüm. */
  fromIdx: number;
  toIdx: number;
};

export type Stepper = {
  /** Rafta bekleyen kaydırma animasyonunu bu kareye ilerletir; animasyon sürüyorsa true. */
  frame(now: number): boolean;
  /** Animasyon (adım ya da yumuşak kaydırma) sürüyor mu. */
  busy(): boolean;
  /** Bir bölüme git (kiosk). `dur` ms. */
  goTo(idx: number, dur: number, ease?: (x: number) => number): void;
  /** Bölüm içi doğrusal kaydırma (kiosk okuma hızı). */
  glideTo(y: number, dur: number): void;
  /** Ölçü değişti: konum bölüm arasında kaldıysa en yakın bölüme anında yerleştir. */
  remeasured(): void;
  /** Şu anki konumun bölümü (dinlenmede) ya da en yakın bölüm. */
  index(): number;
  destroy(): void;
};

export const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const linear = (x: number) => x;

/** Bölüm geçiş süresi (ms). */
export const STEP_MS = 1000;
const WHEEL_THRESHOLD = 40;
const TOUCH_THRESHOLD = 40;
/** İki adım arasında en az bu kadar süre (ms). */
const STEP_GAP_MS = 700;
/** Bu kadar (ms) olay gelmezse tekerlek hareketi bitmiş sayılır. */
const WHEEL_QUIET_MS = 180;
/** Birikimin sıfırlanacağı boşluk (ms). */
const WHEEL_RESET_MS = 260;
/** Yerel (bölüm içi) tekerlek kaydırmasının süresi. */
const SOFT_MS = 200;
const EPS = 1.5;
/** Bölüm içi kaydırma sınıra bu kadar (viewport oranı) yaklaşırsa sınıra tamamlanır. */
const EDGE_SNAP = 0.15;
/** Parmak (eylemsizlik olmadan) kalktığında aynı tamamlama; daha dar: okuyucu konumunu korur. */
const EDGE_SNAP_TOUCH = 0.08;

export function createStepper(opts: {
  /** Dinlenme bölgeleri, sırayla (her ölçüde güncellenir). */
  stops: () => readonly Durak[];
  /** Viewport yüksekliği (px). */
  viewport: () => number;
  /** Animasyon başladı: rAF döngüsünü uyandır. */
  wake: () => void;
  /** Kullanıcı girdisi (kiosk duraklatma vb.). */
  onUser?: () => void;
}): Stepper {
  let anim: Anim | null = null;
  let lastStepAt = -Infinity;
  let animEndAt = -Infinity;

  /* ------------------------------------------------------------ */
  /* konum yardımcıları                                            */
  /* ------------------------------------------------------------ */

  const maxY = () => Math.max(0, document.documentElement.scrollHeight - opts.viewport());
  const clampY = (y: number) => Math.max(0, Math.min(maxY(), y));

  /**
   * Konumun yeri: dinlenmede ise {rest: i}; iki bölüm arasında ise
   * {between: i} (i ile i+1 arası). Liste boşsa rest 0.
   */
  const locate = (y: number): { rest: number; between: -1 } | { rest: -1; between: number } => {
    const st = opts.stops();
    if (st.length === 0) return { rest: 0, between: -1 };
    // Bölüm sınırları kesirli olabilir (DPR), scrollY ise cihaz pikseline yuvarlanır: EPS payı.
    if (y <= st[0].end + EPS) return { rest: 0, between: -1 };
    for (let i = 0; i < st.length; i++) {
      if (y >= st[i].start - EPS && y <= st[i].end + EPS) return { rest: i, between: -1 };
      if (i + 1 < st.length && y > st[i].end + EPS && y < st[i + 1].start - EPS) {
        return { rest: -1, between: i };
      }
    }
    return { rest: st.length - 1, between: -1 };
  };

  const nearestIndex = (y: number) => {
    const loc = locate(y);
    if (loc.rest >= 0) return loc.rest;
    const st = opts.stops();
    const i = loc.between;
    const a = st[i].end;
    const b = st[i + 1].start;
    return y - a < b - y ? i : i + 1;
  };

  /* ------------------------------------------------------------ */
  /* animasyon                                                     */
  /* ------------------------------------------------------------ */

  /** Animasyonun en son yazdığı konum (geri okunan değer): dışarıdan kaydırmayı ayırt eder. */
  let lastSet = NaN;

  const start = (a: Omit<Anim, "t0">) => {
    anim = { ...a, t0: performance.now() };
    lastSet = window.scrollY;
    opts.wake();
  };

  const frame = (now: number) => {
    if (!anim) return false;
    // Animasyon sürerken sayfa dışarıdan kaydırıldı (kaydırma çubuğu, sayfada
    // bul, betik): her karede eski hedefe geri çekip onunla çekişme; bırak,
    // kaydırma bitince en yakın bölüme yerleşilir.
    if (Math.abs(window.scrollY - lastSet) > 2) {
      anim = null;
      animEndAt = -Infinity;
      scheduleSettle(220);
      return false;
    }
    const a = anim;
    const k = a.dur > 0 ? Math.min(1, Math.max(0, (now - a.t0) / a.dur)) : 1;
    const y = a.from + (a.to - a.from) * a.ease(k);
    window.scrollTo(0, Math.round(y * 100) / 100);
    lastSet = window.scrollY;
    if (k >= 1) {
      window.scrollTo(0, a.to);
      anim = null;
      animEndAt = now;
      return false;
    }
    return true;
  };

  /** dir yönünde bir bölüm adımı (o an bulunulan yerden). */
  const step = (dir: 1 | -1, dur = STEP_MS) => {
    const st = opts.stops();
    if (st.length === 0) return false;
    const y = window.scrollY;
    const loc = locate(y);
    let target: number;
    if (loc.rest >= 0) target = loc.rest + dir;
    else target = dir > 0 ? loc.between + 1 : loc.between;
    if (target < 0 || target >= st.length) return false;
    const from = loc.rest >= 0 ? loc.rest : dir > 0 ? loc.between : loc.between + 1;
    const to = clampY(dir > 0 ? st[target].start : st[target].end);
    const dist = Math.abs(to - y);
    if (dist < 1) return false;
    // Bölüm arasından (kaydırma çubuğu vb.) başlıyorsa kalan yola göre kısalt.
    const vh = opts.viewport();
    const d = dur * Math.max(0.45, Math.min(1, dist / Math.max(1, vh)));
    lastStepAt = performance.now();
    start({ from: y, to, dur: d, ease: easeInOutCubic, kind: "step", dir, fromIdx: from, toIdx: target });
    return true;
  };

  /** Süren adımı tersine çevir: kalkılan bölüme geri dön (kalan yol kadar). */
  const reverse = () => {
    if (!anim || anim.kind !== "step") return;
    const st = opts.stops();
    const back = anim.fromIdx;
    if (back < 0 || back >= st.length) return;
    const y = window.scrollY;
    const to = clampY(anim.dir > 0 ? st[back].end : st[back].start);
    const total = Math.max(1, Math.abs(anim.to - anim.from));
    const left = Math.abs(to - y);
    const dur = Math.max(320, STEP_MS * Math.min(1, left / total));
    const dir: 1 | -1 = anim.dir > 0 ? -1 : 1;
    lastStepAt = performance.now();
    start({
      from: y,
      to,
      dur,
      ease: easeOutCubic,
      kind: "step",
      dir,
      fromIdx: anim.toIdx,
      toIdx: back,
    });
  };

  /** Bölüm içi yumuşak kaydırma (yeniden hedeflenebilir). */
  const soft = (to: number, dur = SOFT_MS, ease = easeOutCubic) => {
    const y = window.scrollY;
    if (Math.abs(to - y) < 0.5) return;
    const dir: 1 | -1 = to > y ? 1 : -1;
    const idx = nearestIndex(y);
    start({ from: y, to, dur, ease, kind: "soft", dir, fromIdx: idx, toIdx: idx });
  };

  /**
   * Hareketi (px, + aşağı) bölüm içinde uygula. Uzun bölümün dinlenme
   * bölgesinde emilebilen kısım yumuşak kaydırılır; `overflow` sınırdan taşan
   * kısımdır (0 ise hareket bölüm içinde kaldı), `edge` hedefin hareket
   * yönündeki sınıra dayanıp dayanmadığıdır.
   *
   * `snap` (viewport oranı; tekerlek çentiği, klavye, eylemsizlik, parmak
   * kalkışı): hedef sınıra bundan yakın kalırsa sınıra kadar gidilir; yoksa
   * ardından gelen hareket yalnızca birkaç px kaydırıp hiçbir şey yapmamış
   * gibi görünür (bir sonraki bölüme geçmek için fazladan hareket gerekir).
   */
  const within = (
    delta: number,
    base: number,
    snap = 0,
  ): { inside: boolean; overflow: number; target: number; edge: boolean } => {
    const st = opts.stops();
    const loc = locate(base);
    if (loc.rest < 0) return { inside: false, overflow: delta, target: base, edge: true };
    const s = st[loc.rest];
    if (s.end - s.start < EPS) return { inside: false, overflow: delta, target: base, edge: true };
    const desired = base + delta;
    let target = Math.max(s.start, Math.min(s.end, desired));
    if (snap > 0) {
      const near = snap * opts.viewport();
      if (delta > 0 && s.end - target < near) target = s.end;
      else if (delta < 0 && target - s.start < near) target = s.start;
    }
    const edge = delta > 0 ? target >= s.end - 0.5 : target <= s.start + 0.5;
    return { inside: Math.abs(target - base) > 0.5, overflow: desired - target, target, edge };
  };

  /* ------------------------------------------------------------ */
  /* tekerlek                                                      */
  /* ------------------------------------------------------------ */

  let acc = 0;
  let lastWheelAt = -Infinity;
  let lastAbs = 0;
  /** Adımdan sonra tekerlek akışı kapalı (momentum çift adım atmasın). */
  let gate = false;

  const onWheel = (e: WheelEvent) => {
    // Ctrl + tekerlek / trackpad sıkıştırma: tarayıcı yakınlaştırması kalsın.
    if (e.ctrlKey) return;
    // Yatay kaydırma (trackpad geri hareketi) tarayıcıda kalsın.
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    opts.onUser?.();
    const vh = opts.viewport();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= vh;
    if (Math.abs(dy) < 0.5) return;
    const now = performance.now();
    const gap = now - lastWheelAt;
    lastWheelAt = now;
    const abs = Math.abs(dy);
    const prevAbs = lastAbs;
    lastAbs = abs;
    const dir: 1 | -1 = dy > 0 ? 1 : -1;

    if (anim && anim.kind === "step") {
      // Ters yön: adımı iptal et, kalkılan bölüme dön.
      if (dir !== anim.dir && now - anim.t0 > 90 && abs > 6) {
        reverse();
        gate = true;
      }
      return;
    }
    if (gate) {
      // Yeni hareket: ya sessizlik sonrası ya da momentum sönerken belirgin yeni itme.
      const fresh = gap > WHEEL_QUIET_MS || (now - animEndAt > 60 && abs > 24 && abs > prevAbs * 1.8);
      if (!fresh) return;
      gate = false;
      acc = 0;
    }

    // Uzun bölümün içi: doğrudan kaydır.
    const base = anim && anim.kind === "soft" ? anim.to : window.scrollY;
    // Çentikli tekerlek (büyük delta) sınıra yakın kalmasın; trackpad'in küçük
    // deltaları parmağı birebir izler.
    const w = within(dy, base, abs >= 40 ? EDGE_SNAP : 0);
    if (w.inside) {
      acc = 0;
      soft(w.target);
      // Sınıra dayandı: aynı hareket (momentum) sonraki bölüme geçirmesin;
      // bölümün sonu görünür, adım için yeni bir hareket gerekir.
      if (w.edge) gate = true;
      return;
    }

    if (gap > WHEEL_RESET_MS || Math.sign(acc) !== dir) acc = 0;
    acc += dy;
    if (Math.abs(acc) < WHEEL_THRESHOLD) return;
    acc = 0;
    if (now - lastStepAt < STEP_GAP_MS) return;
    if (step(dir)) gate = true;
  };

  /* ------------------------------------------------------------ */
  /* dokunma                                                       */
  /* ------------------------------------------------------------ */

  let touching = false;
  let ty0 = 0;
  let tScroll0 = 0;
  let tDone = false;
  let tTall = false;
  /** Dokunma uzun bölümün dinlenme bölgesinin başında/sonunda mı başladı. */
  let tAtStart = false;
  let tAtEnd = false;
  let tAnimDir: 0 | 1 | -1 = 0;
  const tSamples: number[] = []; // [t, y, t, y, ...] son ~120 ms

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      touching = false;
      return;
    }
    touching = true;
    tDone = false;
    ty0 = e.touches[0].clientY;
    tSamples.length = 0;
    tSamples.push(performance.now(), ty0);
    tAnimDir = anim && anim.kind === "step" ? anim.dir : 0;
    // Yumuşak (bölüm içi) eylemsizliği parmak yakalar.
    if (anim && anim.kind === "soft") anim = null;
    tScroll0 = window.scrollY;
    const loc = locate(tScroll0);
    const st = opts.stops();
    tTall = loc.rest >= 0 && st[loc.rest].end - st[loc.rest].start >= EPS;
    tAtStart = tTall && tScroll0 <= st[loc.rest].start + EPS;
    tAtEnd = tTall && tScroll0 >= st[loc.rest].end - EPS;
    opts.onUser?.();
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!touching || e.touches.length !== 1) return; // iki parmak: yakınlaştırma serbest
    if (e.cancelable) e.preventDefault();
    const yNow = e.touches[0].clientY;
    const now = performance.now();
    tSamples.push(now, yNow);
    while (tSamples.length > 4 && now - tSamples[0] > 120) tSamples.splice(0, 2);
    if (tDone) return;
    const dy = ty0 - yNow; // + : içerik yukarı (aşağı kaydırma)

    if (tAnimDir !== 0) {
      // Adım sürerken dokunuldu: ters yöne çekilirse geri dön, yoksa bekle.
      if (anim && anim.kind === "step" && Math.sign(dy) === -anim.dir && Math.abs(dy) > TOUCH_THRESHOLD) {
        reverse();
        tDone = true;
      }
      return;
    }

    if (tTall) {
      // Bölüm içinde parmağı izle; adım yalnızca hareket bölüm sınırında
      // başladıysa (içeriden gelen hareket sınırda durur, sonu görünür).
      const w = within(dy, tScroll0);
      if (Math.abs(w.target - window.scrollY) > 0.1) window.scrollTo(0, w.target);
      const canStep = w.overflow > 0 ? tAtEnd : tAtStart;
      if (canStep && Math.abs(w.overflow) > TOUCH_THRESHOLD) {
        if (step(w.overflow > 0 ? 1 : -1)) tDone = true;
      }
      return;
    }
    if (Math.abs(dy) > TOUCH_THRESHOLD) {
      if (step(dy > 0 ? 1 : -1)) tDone = true;
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!touching) return;
    if (e.touches.length > 0) return;
    touching = false;
    if (tDone || tAnimDir !== 0) return;
    const yEnd = e.changedTouches[0]?.clientY ?? ty0;
    const dy = ty0 - yEnd;
    if (tTall) {
      // Sınırda başlayıp touchmove eşiği yakalanamadıysa (hızlı fiske): adım.
      if ((dy > TOUCH_THRESHOLD && tAtEnd) || (dy < -TOUCH_THRESHOLD && tAtStart)) {
        const w = within(dy, tScroll0);
        if (Math.abs(w.overflow) > TOUCH_THRESHOLD) {
          step(dy > 0 ? 1 : -1);
          return;
        }
      }
      // Eylemsizlik: son ~120 ms'nin hızı, bölüm içinde kalacak şekilde.
      const n = tSamples.length;
      if (n >= 4) {
        const dt = tSamples[n - 2] - tSamples[0];
        const v = dt > 0 ? (tSamples[1] - tSamples[n - 1]) / dt : 0; // px/ms, + aşağı
        if (Math.abs(v) > 0.15 && performance.now() - tSamples[n - 2] < 80) {
          const w = within(v * 320, window.scrollY, EDGE_SNAP);
          if (w.inside) {
            soft(w.target, Math.min(900, 300 + Math.abs(v) * 260), easeOutCubic);
            return;
          }
        }
      }
      // Eylemsizlik yok: parmak sınırın hemen önünde kalktıysa sınıra tamamla
      // (sonraki kaydırma birkaç px'lik boş hareket olmasın, doğrudan adım atsın).
      if (Math.abs(dy) > 4) {
        const w = within(Math.sign(dy) * 0.5, window.scrollY, EDGE_SNAP_TOUCH);
        if (w.inside) soft(w.target, 260, easeOutCubic);
      }
      return;
    }
    // Hızlı fiske: touchmove eşiği yakalayamadıysa.
    if (Math.abs(dy) > TOUCH_THRESHOLD) step(dy > 0 ? 1 : -1);
  };

  /* ------------------------------------------------------------ */
  /* klavye                                                        */
  /* ------------------------------------------------------------ */

  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const el = e.target as HTMLElement | null;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    let dir: 0 | 1 | -1 = 0;
    let amount = 0;
    const vh = opts.viewport();
    switch (e.key) {
      case "ArrowDown":
        dir = 1;
        amount = vh * 0.25;
        break;
      case "ArrowUp":
        dir = -1;
        amount = vh * 0.25;
        break;
      case "PageDown":
        dir = 1;
        amount = vh * 0.85;
        break;
      case "PageUp":
        dir = -1;
        amount = vh * 0.85;
        break;
      case " ":
      case "Spacebar":
        dir = e.shiftKey ? -1 : 1;
        amount = vh * 0.85;
        break;
      default:
        return;
    }
    e.preventDefault();
    opts.onUser?.();
    if (anim && anim.kind === "step") {
      if (dir !== anim.dir) reverse();
      return;
    }
    const base = anim && anim.kind === "soft" ? anim.to : window.scrollY;
    const w = within(dir * amount, base, EDGE_SNAP);
    if (w.inside) {
      soft(w.target, 260);
      return;
    }
    if (performance.now() - lastStepAt < STEP_GAP_MS) return;
    step(dir);
  };

  /* ------------------------------------------------------------ */
  /* tarayıcının kendi kaydırması bölüm arasında biterse yerleş   */
  /* ------------------------------------------------------------ */

  let settleTimer = 0;
  let pointerDown = false;
  const settle = () => {
    settleTimer = 0;
    if (anim || touching || pointerDown) return;
    const y = window.scrollY;
    const loc = locate(y);
    if (loc.rest >= 0) return;
    const st = opts.stops();
    const i = nearestIndex(y);
    const to = clampY(i <= loc.between ? st[i].end : st[i].start);
    const vh = Math.max(1, opts.viewport());
    const dur = Math.max(360, STEP_MS * Math.min(1, Math.abs(to - y) / vh));
    const dir: 1 | -1 = to > y ? 1 : -1;
    start({ from: y, to, dur, ease: easeOutCubic, kind: "step", dir, fromIdx: i, toIdx: i });
  };
  const scheduleSettle = (ms: number) => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, ms);
  };
  const onScroll = () => {
    if (anim || touching) return;
    if (performance.now() - animEndAt < 120) return;
    scheduleSettle(220);
  };
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse") pointerDown = true;
  };
  const onPointerUp = () => {
    if (!pointerDown) return;
    pointerDown = false;
    scheduleSettle(160);
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });

  return {
    frame,
    busy: () => anim !== null,
    goTo(idx, dur, ease = easeInOutCubic) {
      const st = opts.stops();
      if (idx < 0 || idx >= st.length) return;
      const y = window.scrollY;
      const cur = nearestIndex(y);
      const to = clampY(idx >= cur ? st[idx].start : st[idx].end);
      if (Math.abs(to - y) < 0.5) return;
      const dir: 1 | -1 = to > y ? 1 : -1;
      lastStepAt = performance.now();
      start({ from: y, to, dur, ease, kind: "step", dir, fromIdx: cur, toIdx: idx });
    },
    glideTo(y, dur) {
      soft(clampY(y), dur, linear);
    },
    remeasured() {
      if (anim) return;
      const y = window.scrollY;
      const loc = locate(y);
      if (loc.rest >= 0) return;
      const st = opts.stops();
      const i = nearestIndex(y);
      window.scrollTo(0, clampY(i <= loc.between ? st[i].end : st[i].start));
    },
    index: () => nearestIndex(window.scrollY),
    destroy() {
      anim = null;
      window.clearTimeout(settleTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    },
  };
}
