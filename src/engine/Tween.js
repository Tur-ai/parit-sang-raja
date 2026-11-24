export const Ease = {
  linear: t => t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inQuad: t => t * t,
  inOutQuad: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic: t => 1 - Math.pow(1 - t, 3),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: t => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
};

// Tween + timer sederhana. "owner" = scene, agar semua tween ikut berhenti saat scene berganti.
export class Tweens {
  constructor() { this.list = []; }
  to(obj, props, dur, ease = Ease.outQuad, owner = null, delay = 0) {
    return new Promise(resolve => {
      const from = {};
      for (const k in props) from[k] = k === 'scale' ? obj.scale.x : obj[k];
      this.list.push({ obj, from, to: props, t: -delay, dur: Math.max(dur, 0.0001), ease, resolve, owner });
    });
  }
  wait(sec, owner = null) {
    return new Promise(resolve => this.list.push({ obj: null, from: {}, to: {}, t: 0, dur: Math.max(sec, 0.0001), ease: Ease.linear, resolve, owner }));
  }
  cancel(owner) { this.list = this.list.filter(t => t.owner !== owner); }
  update(dt) {
    if (!this.list.length) return;
    const done = [];
    for (const tw of this.list) {
      tw.t += dt;
      if (tw.t < 0) continue;
      const k = Math.min(1, tw.t / tw.dur);
      const e = tw.ease(k);
      if (tw.obj && !tw.obj.destroyed) {
        for (const key in tw.to) {
          const v = tw.from[key] + (tw.to[key] - tw.from[key]) * e;
          if (key === 'scale') tw.obj.scale.set(v); else tw.obj[key] = v;
        }
      }
      if (k >= 1) done.push(tw);
    }
    if (done.length) {
      this.list = this.list.filter(t => !done.includes(t));
      for (const tw of done) tw.resolve();
    }
  }
}
