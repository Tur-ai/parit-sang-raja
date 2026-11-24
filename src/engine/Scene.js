import { Background } from './Renderer.js';
import { createFX } from './AmbientFX.js';
import { Ease } from './Tween.js';
const PIXI = window.PIXI;

export const ABORT = Symbol('abort');
export const GROUND = 520;

export class Scene {
  constructor(game) {
    this.game = game; this.alive = true; this.tracked = []; this.fxs = []; this.bgObj = null;
  }
  get R() { return this.game.renderer; }
  get A() { return this.game.assets; }
  get audio() { return this.game.audio; }
  get state() { return this.game.state; }

  async enter(params) {
    this.params = params || {};
    this._p = this.run(this.params).catch(e => { if (e !== ABORT) console.error('Scene error', e); });
  }
  async run() {}
  exit() {
    this.alive = false;
    this.game.tweens.cancel(this);
    this.audio.stopAllLoops();
  }
  update(dt) {
    if (this.bgObj) this.bgObj.update(dt);
    for (const f of this.fxs) f.update(dt);
    for (const o of this.tracked) if (!o.destroyed) o.update(dt);
    this.tick && this.tick(dt);
  }

  // --- penambahan objek ---
  add(layer, obj) {
    this.R.layers[layer].addChild(obj);
    if (typeof obj.update === 'function') this.tracked.push(obj);
    return obj;
  }
  bg(gid, opts) {
    this.bgObj = new Background(this.R, gid, opts);
    this.R.layers.bg.addChild(this.bgObj);
    return this.bgObj;
  }
  fx(id, opts = {}) {
    const f = createFX(this.game, id, opts);
    this.R.layers[opts.layer || f.layer].addChild(f.node);
    this.fxs.push(f);
    return f;
  }
  ambient(ids, opts = {}) { return ids.map(id => this.fx(id, opts[id] || {})); }
  // karakter / objek ber-animasi. h = tinggi di layar; y = posisi kaki
  actor(gid, { x = 640, y = GROUND, h, w, fps = 4, flip = false, layer = 'chr', loop = true, play = true, seq, anchor } = {}) {
    const a = this.R.animator(gid, { fps, height: h, width: w, loop, play, seq, anchor });
    a.position.set(x, y);
    if (flip) a.scale.x *= -1;
    return this.add(layer, a);
  }
  obj(gid, o = {}) { return this.actor(gid, { layer: 'obj', ...o }); }
  dim(alpha = 0.5) {
    const g = new PIXI.Graphics().rect(0, 0, 1280, 720).fill(0x000000); g.alpha = alpha; g.eventMode = 'none';
    this.R.layers.bg.addChild(g); return g;
  }

  // --- alur async (berhenti otomatis bila scene sudah berganti) ---
  async wait(s) { await this.game.tweens.wait(s, this); if (!this.alive) throw ABORT; }
  async tween(obj, props, dur, ease = Ease.outQuad, delay = 0) {
    await this.game.tweens.to(obj, props, dur, ease, this, delay); if (!this.alive) throw ABORT;
  }
  async say(who, text) {
    await this.game.dialog.say(who, text); if (!this.alive) throw ABORT;
  }
  async choose(opts) {
    const i = await this.game.dialog.choose(opts); if (!this.alive) throw ABORT; return i;
  }
  hideDialog() { this.game.dialog.hide(); }
  go(id, params) { return this.game.scenes.go(id, params); }
  pop(obj, to = 1, dur = 0.45) {
    obj.visible = true; obj.scale.set(0);
    return this.tween(obj, { scale: to }, dur, Ease.outBack);
  }
  // berjalan dengan bunyi langkah [S7]
  async walk(a, toX, dur, { sfx = 'S7', step = 0.5 } = {}) {
    const base = a.y;
    const tw = this.tween(a, { x: toX }, dur, Ease.linear);
    for (let t = 0; t < dur - 0.05; t += step) {
      this.audio.playSFX(sfx, { volume: 0.55 });
      a.y = base - 7; await this.wait(step / 2); a.y = base; await this.wait(step / 2);
    }
    await tw; a.y = base;
  }
  // Parit membatu [G35] + efek membatu [G36]
  async petrify(x, y, w) {
    const trench = this.actor('G35', { x, y, w, play: false, layer: 'obj' });
    const fxs = this.actor('G36', { x, y: y + 30, h: 280, fps: 6, layer: 'obj' });
    fxs.alpha = 0;
    await this.wait(0.8);
    this.tween(fxs, { alpha: 1 }, 0.5);
    for (let i = 1; i < trench.seq.length; i++) {
      await this.wait(1.3); trench.setFrame(i); this.audio.playSFX('S11', { volume: 0.4 });
    }
    await this.wait(0.6);
    await this.tween(fxs, { alpha: 0 }, 0.8);
  }
}
