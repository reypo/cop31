/**
 * /icinden v3 kilitli adımlama — `src/components/dunya/adim.ts`'in uyarlaması (o dosyaya dokunulmaz).
 *
 * Korunan (WebKit güvenli kalıp, docs/brief-dunya-apple.md): tekerlek eşiği 40 px + adımdan sonra "susana
 * dek kapı" (momentum ikinci adım atmaz), yatay jest elemesi (|dx| > 1,5·|dy| + 2), dokunma 40 px (parmak
 * kalkmadan), klavye, native dokunma kaydırması CSS ile kapalı (`touch-action: pinch-zoom`/`none`,
 * `overscroll-behavior-y: none`, destroy() geri yazar). Animasyon yazdığı konumu doğru kabul eder; geri okunan
 * `scrollY`'ye göre iptal YOK (yalnız birincil fare tuşu basılıyken ve okunan değer son yazılan 5 konumun
 * hiçbirine 2 px'ten yakın değilse: kaydırma çubuğu). Yeni hareket bayat `scrollY`'den değil son yazılan
 * konumdan başlar (`here()`), rAF t0 ilk karenin damgası.
 *
 * Farklar (brief-icinden-3 §9.5, klip-oynatma §1.2):
 *  - Adım süresi = geçişin süresi: `opts.adim(from, to, dir, jest)` süreyi (ms) ya da `false` (red) döndürür.
 *  - Geçiş sürerken HER jest yok sayılır (kilit; "D − t" ters geçiş YOK, R4 §3.8). Bekle kipinde (W-4: klip inmedi,
 *    oynatma reddedildi) geçiş adımın süresini aşar: `kilitli()` doğruyken kilit adım animasyonundan sonra da sürer.
 *  - Otomatik oynatma engelliyken (`dokunmaBitiste()`: iOS düşük güç modu) dokunma adımı parmak kalkınca
 *    atılır: `play()` yalnız kullanıcı etkinleştirmesinde (touchend) izinli, touchmove değil.
 *  - Uzun bölüm yalnız sonda (kapanış): içinde serbest kaydırma, adım yalnız üst sınırda.
 *  - Tarayıcının kendi kaydırması (kaydırma çubuğu, bul, odak, Home/End) iki durak arasında biterse en yakın
 *    durağa yerleşilir ve `opts.yerles(i)` çağrılır (sahne klipsiz o durağa atlar). Tam bir durağın üstünde
 *    biterse de `opts.yerles(i)` çağrılır (C turu, denetim A2-02: Home → y 0, End → kapanış; eşitlenmezse sahne
 *    eski durakta kalıyor, her adım `from ≠ k` diye reddediliyor, adımlama kilitleniyordu). Sahne zaten o
 *    duraktaysa ya da geçiş sürüyorsa `yerles` bir şey yapmaz.
 */

export type Durak = { start: number; end: number };
export type Jest = { t: number; ts: number; tur: string };

type Anim = {
  from: number;
  to: number;
  t0: number;
  dur: number;
  ease: (x: number) => number;
  kind: "step" | "soft";
  toIdx: number;
};

export type Stepper = {
  frame(now: number): boolean;
  busy(): boolean;
  /** Programatik adım (kiosk): jestle aynı yol. */
  adimAt(dir: 1 | -1, tur?: string): boolean;
  /** Anında bir durağa yaz (kiosk başa dönüş, ilk konum). */
  atla(idx: number): void;
  remeasured(): void;
  destroy(): void;
};

export const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

const WHEEL_THRESHOLD = 40;
const TOUCH_THRESHOLD = 40;
const WHEEL_QUIET_MS = 180;
const WHEEL_RESET_MS = 260;
const SOFT_MS = 200;
const EPS = 1.5;
const EDGE_SNAP = 0.15;
const WRITTEN_KEEP = 5;
const WRITTEN_FRESH_MS = 150;

export function createStepper(opts: {
  stops: () => readonly Durak[];
  viewport: () => number;
  wake: () => void;
  adim: (from: number, to: number, dir: 1 | -1, jest: Jest) => number | false;
  dokunmaBitiste: () => boolean;
  /** Sahne geçişi adımın süresini aştı (W-4 bekle kipi): kilit adım animasyonundan sonra da sürer. */
  kilitli?: () => boolean;
  yerles: (idx: number) => void;
  /** Kullanıcı girdisi (kiosk duraklatma). */
  girdi?: () => void;
  /**
   * Sahnenin bulunduğu durak (dinlenmedeyse; geçişte null). Ölçü değişiminde (döndürme, adres çubuğu) konum en
   * yakın durağa değil bu durağa yazılır: sahne ile kaydırma ayrışmasın (C turu, A2-04).
   */
  simdiki?: () => number | null;
}): Stepper {
  let anim: Anim | null = null;
  let animEndAt = -Infinity;
  const kilit = () => (!!anim && anim.kind === "step") || !!opts.kilitli?.();
  let remeasurePending = false;

  const maxY = () => Math.max(0, document.documentElement.scrollHeight - opts.viewport());
  const clampY = (y: number) => Math.max(0, Math.min(maxY(), y));

  const written: number[] = [];
  let writtenAt = -Infinity;
  const remember = (y: number) => {
    written.push(y);
    if (written.length > WRITTEN_KEEP) written.shift();
  };
  const write = (y: number) => {
    window.scrollTo(0, y);
    remember(y);
    writtenAt = performance.now();
  };
  const ours = (y: number) => written.some((w) => Math.abs(y - w) <= 2);
  const here = () => {
    const y = window.scrollY;
    if (written.length > 0 && performance.now() - writtenAt < WRITTEN_FRESH_MS && ours(y)) return written[written.length - 1];
    return y;
  };

  const locate = (y: number): { rest: number; between: -1 } | { rest: -1; between: number } => {
    const st = opts.stops();
    if (st.length === 0) return { rest: 0, between: -1 };
    if (y <= st[0].end + EPS) return { rest: 0, between: -1 };
    for (let i = 0; i < st.length; i++) {
      if (y >= st[i].start - EPS && y <= st[i].end + EPS) return { rest: i, between: -1 };
      if (i + 1 < st.length && y > st[i].end + EPS && y < st[i + 1].start - EPS) return { rest: -1, between: i };
    }
    return { rest: st.length - 1, between: -1 };
  };
  const nearestIndex = (y: number) => {
    const loc = locate(y);
    if (loc.rest >= 0) return loc.rest;
    const st = opts.stops();
    const i = loc.between;
    return y - st[i].end < st[i + 1].start - y ? i : i + 1;
  };

  const start = (a: Omit<Anim, "t0">) => {
    anim = { ...a, t0: -1 };
    remember(a.from);
    opts.wake();
  };

  const frame = (now: number) => {
    if (!anim) return false;
    if (pointerDown && !touching && !ours(window.scrollY) && anim.kind === "soft") {
      anim = null;
      scheduleSettle(220);
      return false;
    }
    const a = anim;
    if (a.t0 < 0) a.t0 = now;
    const k = a.dur > 0 ? Math.min(1, Math.max(0, (now - a.t0) / a.dur)) : 1;
    write(Math.round((a.from + (a.to - a.from) * a.ease(k)) * 100) / 100);
    if (k >= 1) {
      write(a.to);
      anim = null;
      animEndAt = now;
      if (remeasurePending) {
        remeasurePending = false;
        scheduleSettle(60);
      }
      return false;
    }
    return true;
  };

  /** dir yönünde bir durak. Oynatıcı reddederse (geçiş sürüyor, uç) false. */
  const step = (dir: 1 | -1, jest: Jest) => {
    if (kilit()) return false;
    const st = opts.stops();
    if (st.length === 0) return false;
    const y = anim ? anim.to : here();
    const loc = locate(y);
    const from = loc.rest >= 0 ? loc.rest : nearestIndex(y);
    const target = from + dir;
    if (target < 0 || target >= st.length) return false;
    const dur = opts.adim(from, target, dir, jest);
    if (dur === false) return false;
    const to = clampY(st[target][dir > 0 ? "start" : "end"]);
    start({ from: here(), to, dur, ease: easeInOutCubic, kind: "step", toIdx: target });
    return true;
  };

  const soft = (to: number, dur = SOFT_MS) => {
    const y = here();
    if (Math.abs(to - y) < 0.5) return;
    start({ from: y, to, dur, ease: easeOutCubic, kind: "soft", toIdx: nearestIndex(y) });
  };

  /** Uzun bölüm (kapanış) içinde hareket: emilebilen kısım yumuşak kaydırılır. */
  const within = (delta: number, base: number, snap = 0) => {
    const st = opts.stops();
    const loc = locate(base);
    if (loc.rest < 0) return { inside: false, overflow: delta, target: base, edge: true };
    const s = st[loc.rest];
    if (s.end - s.start < EPS) return { inside: false, overflow: delta, target: base, edge: true };
    let b = base;
    if (Math.abs(b - s.end) < 1) b = s.end;
    else if (Math.abs(b - s.start) < 1) b = s.start;
    const desired = b + delta;
    let target = Math.max(s.start, Math.min(s.end, desired));
    if (snap > 0) {
      const near = snap * opts.viewport();
      if (delta > 0 && s.end - target < near) target = s.end;
      else if (delta < 0 && target - s.start < near) target = s.start;
    }
    const edge = delta > 0 ? target >= s.end - 0.5 : target <= s.start + 0.5;
    return { inside: Math.abs(target - b) > 0.5, overflow: desired - target, target, edge };
  };

  /* ---------------- tekerlek ---------------- */
  let acc = 0;
  let lastWheelAt = -Infinity;
  let lastAbs = 0;
  let gate = false;
  const onWheel = (e: WheelEvent) => {
    if (pointerDown && e.buttons === 0) onPointerUp();
    if (e.ctrlKey) return;
    if (Math.abs(e.deltaX) > 1.5 * Math.abs(e.deltaY) + 2) return;
    e.preventDefault();
    opts.girdi?.();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= opts.viewport();
    if (Math.abs(dy) < 0.5) return;
    const now = performance.now();
    const gap = now - lastWheelAt;
    lastWheelAt = now;
    const abs = Math.abs(dy);
    const prevAbs = lastAbs;
    lastAbs = abs;
    const dir: 1 | -1 = dy > 0 ? 1 : -1;
    if (kilit()) {
      gate = true; // kilit: akış adım atmaz, susunca yeni hareket gerekir
      return;
    }
    if (gate) {
      const fresh = gap > WHEEL_QUIET_MS || (now - animEndAt > 60 && abs > 24 && abs > prevAbs * 1.8);
      if (!fresh) return;
      gate = false;
      acc = 0;
    }
    const base = anim && anim.kind === "soft" ? anim.to : here();
    const w = within(dy, base, abs >= 40 ? EDGE_SNAP : 0);
    if (w.inside) {
      acc = 0;
      soft(w.target);
      if (w.edge) gate = true;
      return;
    }
    if (gap > WHEEL_RESET_MS || Math.sign(acc) !== dir) acc = 0;
    acc += dy;
    if (Math.abs(acc) < WHEEL_THRESHOLD) return;
    acc = 0;
    if (step(dir, { t: now, ts: e.timeStamp, tur: "tekerlek" })) gate = true;
  };

  /* ---------------- dokunma ---------------- */
  let touching = false;
  let ty0 = 0;
  let tScroll0 = 0;
  let tDone = false;
  let tTall = false;
  let tAtStart = false;
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      touching = false;
      return;
    }
    opts.girdi?.();
    touching = true;
    // Geçiş sürerken başlayan dokunma tükenmiş sayılır (kilit; parmak kalkınca yeni jest).
    tDone = kilit();
    ty0 = e.touches[0].clientY;
    if (anim && anim.kind === "soft") anim = null;
    tScroll0 = here();
    const loc = locate(tScroll0);
    const st = opts.stops();
    tTall = loc.rest >= 0 && st[loc.rest].end - st[loc.rest].start >= EPS;
    tAtStart = tTall && tScroll0 <= st[loc.rest].start + EPS;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (!touching || e.touches.length !== 1) return;
    if (e.cancelable) e.preventDefault();
    if (tDone) return;
    const dy = ty0 - e.touches[0].clientY;
    if (tTall) {
      const w = within(dy, tScroll0);
      if (Math.abs(w.target - here()) > 0.1) write(w.target);
      if (w.overflow < 0 && tAtStart && -w.overflow > TOUCH_THRESHOLD && !opts.dokunmaBitiste()) {
        tDone = true;
        step(-1, { t: performance.now(), ts: e.timeStamp, tur: "dokunma" });
      }
      return;
    }
    if (opts.dokunmaBitiste()) return;
    if (Math.abs(dy) > TOUCH_THRESHOLD) {
      tDone = true; // kilitliyken de bu jest tükenir (parmak kalkmadan ikinci adım yok)
      step(dy > 0 ? 1 : -1, { t: performance.now(), ts: e.timeStamp, tur: "dokunma" });
    }
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (!touching || e.touches.length > 0) return;
    touching = false;
    if (!tDone) {
      const dy = ty0 - (e.changedTouches[0]?.clientY ?? ty0);
      const tur = opts.dokunmaBitiste() ? "dokunma-bitis" : "fiske";
      if (tTall) {
        if (dy < -TOUCH_THRESHOLD && tAtStart) step(-1, { t: performance.now(), ts: e.timeStamp, tur });
      } else if (Math.abs(dy) > TOUCH_THRESHOLD) step(dy > 0 ? 1 : -1, { t: performance.now(), ts: e.timeStamp, tur });
    }
    if (!anim) scheduleSettle(60);
  };

  /* ---------------- klavye ---------------- */
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const el = e.target instanceof HTMLElement ? e.target : null;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    let dir: 0 | 1 | -1 = 0;
    if (e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) dir = 1;
    else if (e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) dir = -1;
    else return;
    e.preventDefault();
    opts.girdi?.();
    if (e.repeat || kilit()) return;
    const base = anim && anim.kind === "soft" ? anim.to : here();
    const w = within(dir * opts.viewport() * 0.5, base, EDGE_SNAP);
    if (w.inside) {
      soft(w.target, 260);
      return;
    }
    step(dir, { t: performance.now(), ts: e.timeStamp, tur: "klavye" });
  };

  /* ---------------- tarayıcının kendi kaydırması ---------------- */
  let settleTimer = 0;
  let pointerDown = false;
  const settle = () => {
    settleTimer = 0;
    if (anim || touching || pointerDown) return;
    const y = here();
    const loc = locate(y);
    if (loc.rest >= 0) {
      opts.yerles(loc.rest);
      return;
    }
    const i = nearestIndex(y);
    const st = opts.stops();
    const to = clampY(st[i][i <= loc.between ? "end" : "start"]);
    opts.yerles(i);
    start({ from: y, to, dur: 360, ease: easeOutCubic, kind: "soft", toIdx: i });
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
    if (e.pointerType === "mouse" && e.button === 0) pointerDown = true;
  };
  const onPointerUp = () => {
    if (!pointerDown) return;
    pointerDown = false;
    scheduleSettle(160);
  };

  /* ---------------- native dokunma kaydırması kapalı ---------------- */
  const cssPrev = [document.documentElement, document.body].map((el) => ({
    el,
    touchAction: el.style.touchAction,
    overscrollY: el.style.overscrollBehaviorY,
  }));
  for (const { el } of cssPrev) {
    el.style.touchAction = "none";
    el.style.touchAction = "pinch-zoom";
    el.style.overscrollBehaviorY = "none";
  }

  const ekle: [EventTarget, string, EventListener, AddEventListenerOptions | boolean | undefined][] = [
    [window, "wheel", onWheel as EventListener, { passive: false }],
    [window, "touchstart", onTouchStart as EventListener, { passive: true }],
    [window, "touchmove", onTouchMove as EventListener, { passive: false }],
    [window, "touchend", onTouchEnd as EventListener, { passive: true }],
    [window, "touchcancel", onTouchEnd as EventListener, { passive: true }],
    [window, "keydown", onKey as EventListener, undefined],
    [window, "scroll", onScroll, { passive: true }],
    [window, "pointerdown", onPointerDown as EventListener, { passive: true }],
    [window, "pointerup", onPointerUp, { passive: true }],
    [window, "pointercancel", onPointerUp, { passive: true }],
    [window, "contextmenu", onPointerUp, { passive: true }],
    [window, "dragend", onPointerUp, { passive: true }],
    [window, "blur", onPointerUp, undefined],
    [document, "visibilitychange", onPointerUp, undefined],
  ];
  for (const [t, ad, f, o] of ekle) t.addEventListener(ad, f, o);

  return {
    frame,
    busy: () => anim !== null,
    adimAt: (dir, tur = "kiosk") => step(dir, { t: performance.now(), ts: performance.now(), tur }),
    atla(idx) {
      const st = opts.stops();
      if (idx < 0 || idx >= st.length) return;
      anim = null;
      write(clampY(st[idx].start));
    },
    remeasured() {
      if (anim) {
        // Sürerken ölçü değişti (döndürme): hedef durağın yeni yerine, kalan sürede.
        remeasurePending = true;
        const a = anim;
        const st = opts.stops();
        const to = clampY(st[a.toIdx]?.start ?? a.to);
        if (Math.abs(to - a.to) >= 0.5) {
          const left = a.t0 < 0 ? a.dur : a.dur - (performance.now() - a.t0);
          start({ ...a, from: here(), to, dur: Math.max(120, left), ease: easeOutCubic });
        }
        return;
      }
      const y = here();
      const st = opts.stops();
      const k = opts.simdiki?.();
      if (k != null && k >= 0 && k < st.length) {
        const to = clampY(Math.max(st[k].start, Math.min(st[k].end, y)));
        if (Math.abs(to - y) > 0.5) write(to);
        return;
      }
      const loc = locate(y);
      if (loc.rest >= 0) {
        opts.yerles(loc.rest);
        return;
      }
      const i = nearestIndex(y);
      opts.yerles(i);
      write(clampY(i <= loc.between ? st[i].end : st[i].start));
    },
    destroy() {
      anim = null;
      window.clearTimeout(settleTimer);
      for (const [t, ad, f, o] of ekle) t.removeEventListener(ad, f, o);
      for (const p of cssPrev) {
        p.el.style.touchAction = p.touchAction;
        p.el.style.overscrollBehaviorY = p.overscrollY;
      }
    },
  };
}
