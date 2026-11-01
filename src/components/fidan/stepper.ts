/**
 * Bölüm bölüm kaydırma: JS yönlendirmeli adımlama.
 *
 * Native `scroll-snap-type: y mandatory` ölçüldü: Chrome'da tek tekerlek
 * hareketinden sonra yaslanma ~120 ms'de bitiyor, dokunmada sıçrama anlık;
 * bölümler arasındaki büyüme/kamera vuruşu izlenemiyor. Bu yüzden:
 *
 * - Her tetikleyici (tekerlek, dokunma, klavye) bir sonraki/önceki bölüme
 *   `duration` ms'lik easeInOutCubic bir rAF animasyonu başlatır; her karede
 *   `apply(y)` hem kaydırma konumunu yazar hem sahneyi aynı karede çizer.
 * - Animasyon sürerken aynı yöndeki girdiler yok sayılır; ters yöne belirgin
 *   bir hareket animasyonu iptal eder ve geri döndürür.
 * - Tekerlek: deltaY birikir (eşik 40); adım sonrası aynı yöndeki olaylar
 *   (trackpad momentum kuyruğu) en az 700 ms ve 180 ms'lik bir sessizlik
 *   gelene kadar kilitli → trackpad'de çift adım yok.
 * - Dokunma: native kaydırma CSS ile kapalı (`touch-action: pinch-zoom`,
 *   çağıran sınıfı ekler); parmak 40 px'ten fazla dikey giderse bir adım.
 * - Bölüm viewport'tan uzunsa (stop.end > stop.top) bölüm içinde serbest
 *   kaydırma: parmak/tekerlek içeriği izler ve sınırda durur; adımı ancak
 *   sınırda başlayan yeni bir hareket tetikler (içerik tek fiskeyle atlanmaz).
 * - Kaydırma çubuğu, bul (Ctrl+F), odak gibi native kaydırmalar iki bölüm
 *   arasında kalırsa en yakın bölüme yerleşir: yarım kalmış sahne olmaz.
 */

export type Stop = {
  /** Bölümün üstü (belge koordinatı, px). */
  top: number;
  /** Bölüm içinde durulabilecek son konum: top + max(0, yükseklik - viewport). */
  end: number;
};

export type StepperOptions = {
  stops: () => readonly Stop[];
  /** Kaydırma konumunu yaz ve sahneyi aynı karede çiz. */
  apply: (y: number) => void;
  /** Bölümden bölüme geçiş süresi (ms). */
  duration: number;
  /** false dönerse girdiler native davranışa bırakılır (ör. sayfa yakınlaştırılmış). */
  enabled: () => boolean;
};

export type Stepper = {
  /** Şu anki bölüm ve bölüm içi konum (yeniden ölçümden önce). */
  where: () => { i: number; off: number } | null;
  /** Yeniden ölçümden sonra aynı bölüme, aynı bölüm içi konuma anında yerleş. */
  restore: (at: { i: number; off: number } | null) => void;
  /** Kaydırmayı şu an adımlayıcı mı sürüyor (animasyon, süzülme ya da parmak). */
  busy: () => boolean;
  destroy: () => void;
};

const WHEEL_STEP = 40;
const TOUCH_STEP = 40;
/** Adım sonrası aynı yönde yeni bir adım için en az süre. */
const MIN_GAP = 700;
/** Momentum kuyruğunun bittiğini kabul etmek için gereken sessizlik. */
const QUIET = 180;
/** Animasyon sırasında ters yönde bu kadar birikirse iptal edilip geri dönülür. */
const REVERSE = 30;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

type Anim = { from: number; to: number; t0: number; dur: number; dir: number };
type TouchState = {
  x0: number;
  y0: number;
  y: number;
  t: number;
  v: number;
  base: number;
  axis: 0 | 1 | 2;
  fired: boolean;
  range: readonly [number, number] | null;
  rev: number;
};

function indexAt(y: number, S: readonly Stop[]): number {
  let i = 0;
  for (let k = 1; k < S.length; k++) if (y >= S[k].top - 1) i = k;
  return i;
}

export function createStepper(o: StepperOptions): Stepper {
  let pos = window.scrollY;
  let raf = 0;
  let anim: Anim | null = null;
  let revAcc = 0;
  let freeTarget = Number.NaN;
  let glide = { v: 0, last: 0, lo: 0, hi: 0 };
  // tekerlek
  let acc = 0;
  let lastWheel = -Infinity;
  let prevMag = 0;
  let lockDir = 0;
  let lockMin = 0;
  // dokunma
  let touch: TouchState | null = null;
  let settleTimer = 0;

  const maxY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const clampY = (v: number) => Math.min(Math.max(v, 0), maxY());

  const set = (v: number) => {
    pos = v;
    o.apply(v);
  };

  const halt = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    anim = null;
    freeTarget = Number.NaN;
    glide.v = 0;
  };

  const frame = (t: number) => {
    raf = 0;
    if (anim) {
      if (anim.t0 < 0) anim.t0 = t;
      const k = Math.min(1, (t - anim.t0) / anim.dur);
      set(anim.from + (anim.to - anim.from) * easeInOutCubic(k));
      if (k < 1) raf = requestAnimationFrame(frame);
      else anim = null;
      return;
    }
    if (!Number.isNaN(freeTarget)) {
      const d = freeTarget - pos;
      if (Math.abs(d) < 0.5) {
        set(freeTarget);
        freeTarget = Number.NaN;
        return;
      }
      set(pos + d * 0.3);
      raf = requestAnimationFrame(frame);
      return;
    }
    if (glide.v !== 0) {
      const dt = Math.min(48, t - glide.last || 16);
      glide.last = t;
      let next = pos + glide.v * dt;
      glide.v *= 0.996 ** dt;
      const stopNow = next <= glide.lo || next >= glide.hi || Math.abs(glide.v) < 0.03;
      next = Math.min(Math.max(next, glide.lo), glide.hi);
      set(next);
      if (stopNow) glide.v = 0;
      else raf = requestAnimationFrame(frame);
    }
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const sync = () => {
    if (!raf) pos = window.scrollY;
  };

  const go = (to: number, dir: number, dur = o.duration) => {
    halt();
    const target = clampY(to);
    if (Math.abs(target - pos) < 0.5) return;
    anim = { from: pos, to: target, t0: -1, dur, dir };
    revAcc = 0;
    kick();
  };

  /** Bölüm içi serbest aralık [top, end]; bölüm viewport'a sığıyorsa ya da iki bölüm arasındaysak null. */
  const freeRange = (y: number): readonly [number, number] | null => {
    const S = o.stops();
    if (S.length === 0) return null;
    const s = S[indexAt(y, S)];
    const hi = Math.min(s.end, maxY());
    if (hi - s.top < 2 || y < s.top - 1 || y > hi + 1) return null;
    return [s.top, hi];
  };

  /** Bir bölüm ileri/geri. İki bölüm arasındaysak geri yön, geldiğimiz bölüme döner. */
  const step = (dir: number, now: number): boolean => {
    const S = o.stops();
    if (S.length === 0) return false;
    const i = indexAt(pos, S);
    let to: number;
    if (dir > 0) {
      if (i + 1 >= S.length) return false;
      to = S[i + 1].top;
    } else if (pos > S[i].end + 1) {
      to = S[i].end;
    } else if (i === 0) {
      if (pos <= 1) return false;
      to = 0;
    } else {
      to = S[i - 1].end;
    }
    lockDir = dir;
    lockMin = now + MIN_GAP;
    go(to, dir);
    return true;
  };

  const reverse = (dir: number, now: number) => {
    halt();
    step(dir, now);
  };

  /* ------------------------------ tekerlek ------------------------------ */

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.defaultPrevented || !o.enabled()) return;
    const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
    if (Math.abs(e.deltaX) > Math.abs(d)) return;
    e.preventDefault();
    if (d === 0) return;
    const now = e.timeStamp || performance.now();
    const dir = d > 0 ? 1 : -1;
    const mag = Math.abs(d);
    const quiet = now - lastWheel;
    lastWheel = now;

    if (anim) {
      if (dir !== anim.dir) {
        revAcc += mag;
        if (revAcc >= REVERSE) reverse(dir, now);
      } else {
        revAcc = 0;
      }
      prevMag = mag;
      return;
    }

    if (lockDir === dir) {
      // trackpad momentum kuyruğu: sessizlik gelene kadar (ya da belirgin yeni bir itiş) kilitli
      const rising = now >= lockMin && mag > prevMag * 1.5 + 8;
      prevMag = mag;
      if (now < lockMin || (quiet < QUIET && !rising)) return;
    }
    prevMag = mag;
    lockDir = 0;
    sync();

    const r = freeRange(Number.isNaN(freeTarget) ? pos : freeTarget);
    if (r) {
      const base = Number.isNaN(freeTarget) ? pos : freeTarget;
      if ((dir > 0 && base < r[1] - 0.5) || (dir < 0 && base > r[0] + 0.5)) {
        glide.v = 0;
        freeTarget = Math.min(Math.max(base + d, r[0]), r[1]);
        acc = 0;
        // sınıra bu olayla varıldıysa aynı hareketin kuyruğu bir sonraki bölüme atlamasın
        if (freeTarget === r[0] || freeTarget === r[1]) {
          lockDir = dir;
          lockMin = now;
        }
        kick();
        return;
      }
    }
    if (quiet > 240 || Math.sign(acc) !== dir) acc = 0;
    acc += d;
    if (Math.abs(acc) >= WHEEL_STEP) {
      acc = 0;
      step(dir, now);
    }
  };

  /* ------------------------------ dokunma ------------------------------- */

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1 || !o.enabled()) {
      touch = null;
      return;
    }
    if (!anim && raf) halt(); // parmak süzülmeyi durdurur
    sync();
    const t = e.touches[0];
    touch = {
      x0: t.clientX,
      y0: t.clientY,
      y: t.clientY,
      t: e.timeStamp,
      v: 0,
      base: pos,
      axis: 0,
      fired: anim !== null,
      range: anim ? null : freeRange(pos),
      rev: 0,
    };
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!touch) return;
    if (e.touches.length !== 1) {
      touch = null;
      return;
    }
    // iOS'ta touch-action desteği eksikse yedek: native kaydırmayı engelle
    if (e.cancelable) e.preventDefault();
    const t = e.touches[0];
    const dx = touch.x0 - t.clientX;
    const dy = touch.y0 - t.clientY; // > 0: parmak yukarı = aşağı kaydır
    if (touch.axis === 0) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      touch.axis = Math.abs(dy) >= Math.abs(dx) ? 1 : 2;
    }
    if (touch.axis !== 1) return;
    const dt = e.timeStamp - touch.t;
    if (dt > 0) touch.v = 0.8 * ((touch.y - t.clientY) / dt) + 0.2 * touch.v;
    touch.t = e.timeStamp;
    touch.y = t.clientY;
    const dir = dy > 0 ? 1 : -1;

    if (anim) {
      if (dir !== anim.dir && Math.abs(dy) > TOUCH_STEP * 0.6) {
        touch.fired = true;
        reverse(dir, e.timeStamp);
      }
      return;
    }
    if (touch.fired) return;

    const r = touch.range;
    if (r) {
      const want = touch.base + dy;
      const next = Math.min(Math.max(want, r[0]), r[1]);
      if (Math.abs(next - pos) > 0.1) set(next);
      const over = want - next;
      // Adım yalnızca hareket o yöndeki sınırda başladıysa (tekerlekteki
      // kilitle aynı): bölüm içeriğini kaydıran parmak sınırda durur, sonraki
      // bölüme ancak yeni bir hareket geçer. Yoksa kısa bir taşma (ör. 320×568'de
      // Yapraklar kartının 64 px'lik polaroid sırası) tek fiskeyle atlanır.
      const fromEdge = over > 0 ? touch.base >= r[1] - 1 : touch.base <= r[0] + 1;
      if (fromEdge && Math.abs(over) > TOUCH_STEP) {
        touch.fired = true;
        step(over > 0 ? 1 : -1, e.timeStamp);
      }
      return;
    }
    if (Math.abs(dy) > TOUCH_STEP) {
      touch.fired = true;
      step(dir, e.timeStamp);
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    const tt = touch;
    touch = null;
    if (!tt || tt.fired || anim || !tt.range || tt.axis !== 1) return;
    // bölüm içi serbest kaydırmada kısa süzülme (sınırda durur, bölüm atlamaz)
    if (Math.abs(tt.v) > 0.12 && e.timeStamp - tt.t < 90) {
      glide = { v: tt.v, last: performance.now(), lo: tt.range[0], hi: tt.range[1] };
      kick();
    }
  };

  const onTouchCancel = () => {
    touch = null;
  };

  /* ------------------------------ klavye -------------------------------- */

  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !o.enabled()) return;
    const el = e.target as HTMLElement | null;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName))) return;
    const V = window.innerHeight;
    let dir = 0;
    let amount = 0;
    switch (e.key) {
      case "ArrowDown":
        dir = 1;
        amount = 80;
        break;
      case "ArrowUp":
        dir = -1;
        amount = 80;
        break;
      case "PageDown":
        dir = 1;
        amount = V * 0.85;
        break;
      case "PageUp":
        dir = -1;
        amount = V * 0.85;
        break;
      case " ":
      case "Spacebar":
        dir = e.shiftKey ? -1 : 1;
        amount = V * 0.85;
        break;
      case "Home":
        e.preventDefault();
        sync();
        go(0, -1);
        return;
      case "End":
        e.preventDefault();
        sync();
        go(maxY(), 1);
        return;
      default:
        return;
    }
    e.preventDefault();
    const now = e.timeStamp || performance.now();
    if (anim) {
      if (dir !== anim.dir) reverse(dir, now);
      return;
    }
    if (e.repeat && lockDir === dir && now < lockMin) return;
    sync();
    const base = Number.isNaN(freeTarget) ? pos : freeTarget;
    const r = freeRange(base);
    if (r && ((dir > 0 && base < r[1] - 0.5) || (dir < 0 && base > r[0] + 0.5))) {
      freeTarget = Math.min(Math.max(base + dir * amount, r[0]), r[1]);
      kick();
      return;
    }
    if (!Number.isNaN(freeTarget)) halt();
    step(dir, now);
  };

  /* ---------------- native kaydırma iki bölüm arasında kalırsa ---------------- */

  const settle = () => {
    settleTimer = 0;
    if (raf || touch || !o.enabled()) return;
    pos = window.scrollY;
    const S = o.stops();
    if (S.length === 0) return;
    const i = indexAt(pos, S);
    if (i === S.length - 1 || pos <= S[i].end + 1) return;
    const a = S[i].end;
    const b = S[i + 1].top;
    const to = pos - a < b - pos ? a : b;
    go(to, to > pos ? 1 : -1, Math.max(380, (o.duration * Math.abs(to - pos)) / Math.max(1, b - a)));
  };

  const onScroll = () => {
    if (raf || touch) return;
    if (settleTimer) window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, 160);
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchCancel, { passive: true });
  window.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onScroll, { passive: true });

  return {
    where: () => {
      const S = o.stops();
      if (S.length === 0) return null;
      const y = raf && anim ? anim.to : window.scrollY;
      const i = indexAt(y, S);
      if (y > S[i].end + 1) return null; // iki bölüm arasında: yeniden ölçümden sonra yerleşir
      return { i, off: Math.max(0, y - S[i].top) };
    },
    restore: (at) => {
      const S = o.stops();
      if (S.length === 0) return;
      if (at && at.i < S.length) {
        const s = S[at.i];
        const y = clampY(Math.min(s.top + at.off, s.end));
        // animasyon sürüyorsa kesme, yalnızca hedefi güncelle
        if (anim) {
          anim.to = y;
          return;
        }
        halt();
        set(y);
        return;
      }
      halt();
      set(window.scrollY);
      if (o.enabled()) settle();
    },
    busy: () => raf !== 0 || touch !== null,
    destroy: () => {
      halt();
      if (settleTimer) window.clearTimeout(settleTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    },
  };
}
