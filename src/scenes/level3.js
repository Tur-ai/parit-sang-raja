import { Scene, ABORT } from '../engine/Scene.js';
import { Ease } from '../engine/Tween.js';
import { txt, press } from '../engine/UI.js';
const PIXI = window.PIXI;

const SEG_W = 178, SEG_N = 10, HITS = 3;
const COST = 3.4, REST_RATE = 15, WARN = 25;
const ROWS = [345, 455];
const X0 = 345;

// Level 3 - Parit Panjang. Mini-game aksi ringan. Musik [S19].
export class Scene16 extends Scene {
  async run() {
    this.state.lastLevel = 3;
    this.audio.playBGM('S19');
    this.bg('G58', { pan: false });
    this.ambient(['G91', 'G92', 'G99']);

    this.energy = 100; this.stars = 0; this.cd = 0; this.resting = false; this.playing = false; this.ended = false;
    this.warned = false; this.reqT = 3; this.persons = [];

    // 10 segmen parit [G65] -> berair [G66]
    this.segs = [];
    for (let i = 0; i < SEG_N; i++) {
      const row = i < 5 ? 0 : 1, col = i % 5;
      const s = this.actor('G65', { x: X0 + SEG_W * (col + 0.5), y: ROWS[row], w: SEG_W, play: false, layer: 'obj' });
      s.hits = 0; s.done = false; this.segs.push(s);
    }
    // hit area parit
    const hit = new PIXI.Graphics().rect(X0 - 10, 240, SEG_W * 5 + 20, 240).fill({ color: 0xffffff, alpha: 0.001 });
    hit.eventMode = 'static'; hit.cursor = 'pointer';
    hit.on('pointerdown', e => { if (!this.playing) return; e.stopPropagation(); this.audio.unlock(); this.hit(); });
    this.add('obj', hit);

    // Sang Pemahat [G59]
    this.sp = this.actor('G59', { x: 190, y: 380, h: 250, fps: 18, loop: false, play: false });
    this.sp.onComplete = () => this.sp.setFrame(0);
    this.spX = 190; this.spY = 380;

    // Bar tenaga [G67] dan bintang bakti [G71]/[G72]
    this.barW = 330;
    const barEmpty = this.R.sprite('G67', 3), barFull = this.R.sprite('G67', 0);
    for (const b of [barEmpty, barFull]) { b.scale.set(this.barW / b.texture.width); b.position.set(30, 14); this.add('ui', b); }
    this.barMask = new PIXI.Graphics(); this.add('ui', this.barMask); barFull.mask = this.barMask;
    this.barFull = barFull; this.barBox = { x: 30, y: 14, w: this.barW, h: barFull.height };
    this.barMask.rect(30, 14, this.barW * 0.96, barFull.height).fill(0xffffff);
    this.warnIcon = this.actor('G69', { x: 30 + this.barW + 44, y: 80, h: 62, fps: 3, layer: 'ui', anchor: [0.5, 1] });
    this.warnIcon.visible = false;
    this.starIcons = [0, 1, 2].map(i => {
      const s = this.actor('G71', { x: 860 + i * 78, y: 82, h: 62, fps: 2, layer: 'ui', play: false });
      s.alpha = 0.3; s.tint = 0x555555; return s;
    });
    this.starTxt = txt('0/3', { size: 22, bold: true, fill: 0xfff1c9, stroke: 0x2a160a, strokeW: 5 });
    this.starTxt.position.set(1098, 52); this.add('ui', this.starTxt);

    // Tombol Pahat & Palu [G63] dan Istirahat [G68]
    const chisel = this.actor('G63', { x: 1140, y: 700, h: 150, fps: 3, layer: 'ui', play: false });
    const lblC = txt('PAHAT', { size: 22, bold: true, fill: 0xfff1c9, stroke: 0x2a160a, strokeW: 5 }); lblC.anchor.set(0.5, 1); lblC.position.set(1140, 548); this.add('ui', lblC);
    chisel.eventMode = 'static'; chisel.cursor = 'pointer';
    chisel.on('pointerdown', e => { if (!this.playing) return; e.stopPropagation(); this.audio.unlock(); chisel.scale.set(chisel.scale.x * 0.92); this.hit(); });
    const rs = chisel.scale.x; chisel.on('pointerup', () => chisel.scale.set(rs)); chisel.on('pointerupoutside', () => chisel.scale.set(rs));
    this.chisel = chisel;

    const rest = this.actor('G68', { x: 140, y: 690, h: 120, fps: 3, layer: 'ui', play: false, anchor: [0.5, 1] });
    const lblR = txt('TAHAN: ISTIRAHAT', { size: 18, bold: true, fill: 0xfff1c9, stroke: 0x2a160a, strokeW: 5 }); lblR.anchor.set(0.5, 1); lblR.position.set(140, 566); this.add('ui', lblR);
    rest.eventMode = 'static'; rest.cursor = 'pointer';
    const setRest = v => { if (this.ended || !this.playing) return; this.resting = v; rest.alpha = v ? 0.75 : 1; this.setPose(v); };
    rest.on('pointerdown', e => { if (!this.playing) return; e.stopPropagation(); this.audio.unlock(); setRest(true); });
    rest.on('pointerup', () => setRest(false)); rest.on('pointerupoutside', () => setRest(false)); rest.on('pointerout', () => setRest(false));
    window.addEventListener('keydown', this._kd = e => { if (e.code === 'KeyR') setRest(true); });
    window.addEventListener('keyup', this._ku = e => { if (e.code === 'KeyR') setRest(false); });

    await this.say('Narasi', 'Pahat parit sampai ujung. Jaga tenagamu.');
    this.hideDialog();
    this.playing = true;
  }

  exit() {
    window.removeEventListener('keydown', this._kd); window.removeEventListener('keyup', this._ku);
    super.exit();
  }

  setPose(resting) {
    if (resting) { this.sp.swap('G51', { fps: 3 }); this.sp.play(3); this.sp.loop = true; }
    else { this.sp.swap('G59', { fps: 18 }); this.sp.loop = false; this.sp.stop(); this.sp.setFrame(0); }
  }

  active() { return this.segs.find(s => !s.done); }

  hit() {
    const now = performance.now();
    if (!this.playing || this.ended || this.resting || now - (this.lastHit || 0) < 90 || this.energy <= 0) return;
    const seg = this.active(); if (!seg) return;
    this.lastHit = now;
    this.energy = Math.max(0, this.energy - COST);
    this.sp.restart();
    this.audio.playSFX('S10', { volume: 0.8 }); this.audio.playSFX('S11', { volume: 0.7, delay: 0.04 });
    const cx = seg.x, cy = seg.y - 24;
    const sp = this.obj('G64', { x: cx, y: cy + 20, h: 90, fps: 20, loop: false, anchor: [0.5, 0.5] });
    sp.onComplete = () => sp.destroy();
    const d = this.obj('G28', { x: cx, y: seg.y + 4, h: 100, fps: 16, loop: false });
    d.alpha = 0.85; d.onComplete = () => d.destroy();
    this.R.shake(3, 0.12);
    seg.hits++;
    if (seg.hits >= HITS) {
      seg.done = true;
      seg.swap('G66', { keepHeight: false }); seg.fit({ width: SEG_W }); seg.loop = true; seg.play(4);
      this.audio.playSFX('S13', { volume: 0.8 });
      seg.alpha = 0; this.tween(seg, { alpha: 1 }, 0.3);
      if (this.segs.every(s => s.done)) this.win();
    } else seg.setFrame(seg.hits);
    if (this.energy <= 0 && !this.segs.every(s => s.done)) this.lose();
  }

  async win() {
    this.ended = true; this.resting = false;
    await this.wait(0.7);
    if (this.stars < 3) await this.say('Narasi', 'Parit selesai, tetapi rakyat belum cukup terbantu.');
    else await this.say('Narasi', 'Parit selesai. Air mengalir.');
    await this.go(this.stars >= 3 ? 17 : 18);
  }
  async lose() {
    this.ended = true; this.resting = false;
    const d = this.actor('G70', { x: this.sp.x, y: this.sp.y - 150, h: 110, fps: 6, layer: 'ui', anchor: [0.5, 0.5] });
    this.audio.playSFX('S20');
    await this.wait(1.0);
    await this.say('Narasi', 'Tenaga habis sebelum parit selesai.');
    await this.go(18);
  }

  spawnPerson() {
    if (this.persons.length >= 2) return;
    const child = Math.random() < 0.5;
    const x = 560 + Math.random() * 420;
    const p = this.actor(child ? 'G60' : 'G61', { x, y: 640, h: child ? 160 : 190, fps: 3, layer: 'chr' });
    const b = this.actor('G62', { x, y: 640 - p.height - 6, h: 96, fps: 3, layer: 'ui', anchor: [0.5, 1] });
    p.life = 8; p.bubble = b; p.eventMode = 'static'; p.cursor = 'pointer';
    p.hitArea = new PIXI.Rectangle(-p.texture.width * 0.7, -p.texture.height - 120, p.texture.width * 1.4, p.texture.height + 120);
    p.on('pointerdown', e => { e.stopPropagation(); this.audio.unlock(); this.help(p); });
    this.persons.push(p);
    this.game.dialog.toast('RK', 'Kami butuh air...', 2.2);
  }

  async help(p) {
    if (p.helped || this.ended) return;
    p.helped = true; p.bubble.visible = false;
    this.audio.playSFX('S18');
    const i = Math.min(this.stars, 2);
    this.stars++;
    this.starTxt.text = `${this.stars}/3`;
    const s = this.starIcons[i];
    if (s) { s.swap('G72', { keepHeight: false }); s.fit({ height: 88 }); s.alpha = 1; s.tint = 0xffffff; s.play(4); }
    this.tween(p, { y: p.y - 24 }, 0.15).then(() => this.tween(p, { y: p.y + 24 }, 0.15)).catch(() => {});
    this.persons = this.persons.filter(q => q !== p);
    await this.wait(0.9).catch(() => {});
    if (!p.destroyed) { await this.tween(p, { alpha: 0 }, 0.5).catch(() => {}); p.destroy(); }
  }

  tick(dt) {
    if (this.sp) { this.spX += (this.targetX() - this.spX) * Math.min(1, dt * 6); this.spY += (this.targetY() - this.spY) * Math.min(1, dt * 6); this.sp.position.set(this.spX, this.spY); }
    if (!this.playing || this.ended) return;
    this.cd -= dt;
    if (this.resting) this.energy = Math.min(100, this.energy + REST_RATE * dt);
    // bar tenaga
    const pct = this.energy / 100, b = this.barBox;
    this.barMask.clear().rect(b.x, b.y, b.w * (0.1 + 0.86 * pct), b.h).fill(0xffffff);
    // peringatan
    if (this.energy < WARN && !this.warned && this.energy > 0) {
      this.warned = true; this.warnIcon.visible = true;
      this.audio.playSFX('S20');
      this.game.dialog.toast('SP', 'Aku perlu istirahat.', 2.4);
    }
    if (this.energy > 40 && this.warned) { this.warned = false; this.warnIcon.visible = false; }
    // rakyat meminta air
    this.reqT -= dt;
    if (this.reqT <= 0) { this.spawnPerson(); this.reqT = 4.5 + Math.random() * 1.5; }
    for (const p of [...this.persons]) {
      p.life -= dt;
      if (p.life <= 0 && !p.helped) { p.bubble.visible = false; p.helped = true; this.persons = this.persons.filter(q => q !== p); this.tween(p, { alpha: 0 }, 0.6).then(() => p.destroy()).catch(() => {}); }
    }
  }
  targetX() { const s = this.active() || this.segs[this.segs.length - 1]; return s.x - 150; }
  targetY() { const s = this.active() || this.segs[this.segs.length - 1]; return s.y + 36; }
}
