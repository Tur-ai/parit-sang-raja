import { txt, plaqueButton, FONT } from './UI.js';
const PIXI = window.PIXI;

export const NAMES = { PS: 'Penjaga Situs', TA: 'Tetua Adat', SP: 'Sang Pemahat', RK: 'Rakyat', Narasi: null, Info: 'Petunjuk' };

const BOX = { x: 90, y: 492, w: 1100, h: 212 };
const FS = 27;

// Kotak dialog [G13], nama pembicara, efek ketik, panah ketuk [G14], S6 tiap ketukan lanjut.
export class DialogSystem {
  constructor(game) {
    this.game = game;
    const R = game.renderer, A = game.assets;
    this.c = new PIXI.Container(); this.c.visible = false;
    R.hud.addChild(this.c);

    this.box = new PIXI.NineSliceSprite({ texture: A.frameTextures('G13')[0], leftWidth: 46, rightWidth: 46, topHeight: 46, bottomHeight: 46 });
    this.box.width = BOX.w; this.box.height = BOX.h; this.box.position.set(BOX.x, BOX.y);
    this.c.addChild(this.box);

    this.plaque = new PIXI.Container();
    const pl = new PIXI.NineSliceSprite({ texture: A.frameTextures('G13P')[0], leftWidth: 30, rightWidth: 30, topHeight: 14, bottomHeight: 14 });
    pl.width = 250; pl.height = 58; this.plaque.addChild(pl);
    this.nameText = txt('', { size: 24, bold: true, fill: 0x3b2512, align: 'center' });
    this.nameText.anchor.set(0.5); this.nameText.position.set(125, 29);
    this.plaque.addChild(this.nameText);
    this.plaque.position.set(BOX.x + 40, BOX.y - 34);
    this.c.addChild(this.plaque);

    this.text = txt('', { size: FS, fill: 0x3b2512 });
    this.text.position.set(BOX.x + 62, BOX.y + 40);
    this.c.addChild(this.text);

    this.arrow = R.animator('G14', { fps: 5, anchor: [0.5, 0.5], height: 44 });
    this.arrow.position.set(BOX.x + BOX.w - 68, BOX.y + BOX.h - 52); this.arrow.visible = false;
    this.c.addChild(this.arrow);

    this.choiceLayer = new PIXI.Container(); R.hud.addChild(this.choiceLayer);
    this.toastC = new PIXI.Container(); R.hud.addChild(this.toastC);
    this.toastC.visible = false;
    this.toastT = 0;

    this.state = 'idle'; this.lines = []; this.shown = 0; this.cps = 48; this.resolve = null; this.startedAt = 0;
    game.input.on(() => this.onTap());
  }

  wrap(text, maxW, italic) {
    const ctx = this._ctx || (this._ctx = document.createElement('canvas').getContext('2d'));
    ctx.font = `${italic ? 'italic ' : ''}${FS}px ${FONT}`;
    const out = [];
    for (const para of text.split('\n')) {
      let line = '';
      for (const w of para.split(' ')) {
        const t = line ? line + ' ' + w : w;
        if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
      }
      out.push(line);
    }
    return out;
  }

  say(who, text) {
    this.cancelPending();
    const name = NAMES[who] !== undefined ? NAMES[who] : who;
    const narr = who === 'Narasi';
    this.c.visible = true;
    this.plaque.visible = !!name;
    this.nameText.text = name || '';
    this.text.style.fontStyle = narr ? 'italic' : 'normal';
    this.lines = this.wrap(text, BOX.w - 130, narr);
    this.full = this.lines.join('\n');
    this.shown = 0; this.text.text = ''; this.state = 'typing'; this.arrow.visible = false;
    this.startedAt = performance.now();
    return new Promise(res => { this.resolve = res; });
  }

  onTap() {
    if (this.choiceLayer.children.length) return;
    if (this.state === 'typing') {
      if (performance.now() - this.startedAt < 90) return;
      this.shown = this.full.length; this.text.text = this.full; this.state = 'wait'; this.arrow.visible = true;
      this.game.audio.playSFX('S6', { volume: 0.7 });
    } else if (this.state === 'wait') {
      this.game.audio.playSFX('S6', { volume: 0.8 });
      this.state = 'idle'; this.arrow.visible = false;
      const r = this.resolve; this.resolve = null; r && r();
    }
  }

  choose(options) {
    return new Promise(resolve => {
      this.choiceLayer.removeChildren();
      const n = options.length, gap = 112, y0 = 418 - (n - 1) * gap;
      options.forEach((o, i) => {
        const b = plaqueButton(this.game, o.label, { w: 860, h: 100, size: 25, icon: o.gid, onClick: () => {
          for (const c of this.choiceLayer.removeChildren()) c.destroy({ children: true });
          resolve(i);
        } });
        b.position.set(640, y0 + i * gap); b.alpha = 0; b.scale.set(0.9);
        this.game.tweens.to(b, { alpha: 1, scale: 1 }, 0.3, undefined, null, i * 0.1);
        this.choiceLayer.addChild(b);
      });
      this._choiceResolve = resolve;
    });
  }

  // Dialog mini non-blokir (Level 3)
  toast(who, text, dur = 2.4) {
    this.toastC.removeChildren();
    const name = NAMES[who] !== undefined ? NAMES[who] : who;
    const w = 660, h = 92;
    const bg = new PIXI.NineSliceSprite({ texture: this.game.assets.frameTextures('G13')[0], leftWidth: 46, rightWidth: 46, topHeight: 46, bottomHeight: 46 });
    bg.width = w; bg.height = h; this.toastC.addChild(bg);
    const t = txt((name ? name + ': ' : '') + text, { size: 24, fill: 0x3b2512, bold: !!name, wrap: w - 110, align: 'center' });
    t.anchor.set(0.5); t.position.set(w / 2, h / 2 - 1); this.toastC.addChild(t);
    this.toastC.position.set(640 - w / 2, 150);
    this.toastC.visible = true; this.toastC.alpha = 1; this.toastT = dur;
  }

  cancelPending() { const r = this.resolve; this.resolve = null; if (r) r(); }
  hide() {
    this.c.visible = false; this.state = 'idle'; this.arrow.visible = false;
    for (const c of this.choiceLayer.removeChildren()) c.destroy({ children: true });
    this.toastC.visible = false; this.toastT = 0;
  }
  cancel() { this.cancelPending(); this.hide(); }

  update(dt) {
    this.arrow.update(dt);
    if (this.state === 'typing') {
      this.shown += this.cps * dt;
      const n = Math.floor(this.shown);
      if (n >= this.full.length) { this.text.text = this.full; this.state = 'wait'; this.arrow.visible = true; }
      else this.text.text = this.full.slice(0, n);
    }
    for (const c of this.choiceLayer.children) c.update && c.update(dt);
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT < 0.4) this.toastC.alpha = Math.max(0, this.toastT / 0.4);
      if (this.toastT <= 0) this.toastC.visible = false;
    }
  }
}
