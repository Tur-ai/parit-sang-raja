import { Scene, GROUND } from '../engine/Scene.js';
import { Ease } from '../engine/Tween.js';
import { plaqueButton, iconButton, txt } from '../engine/UI.js';
import { MORAL, ABOUT_END } from '../data/script.js';
const PIXI = window.PIXI;

// ENDING 1 - Pemahat Tanpa Nama
export class Scene17 extends Scene {
  async run() {
    this.audio.playBGM('S21'); this.audio.playLoop('S12', { volume: 0.25 });
    this.bg('G73', { pan: false });
    this.ambient(['G91', 'G95', 'G100']);
    this.obj('G32', { x: 640, y: 560, w: 760, fps: 4 });
    this.fx('G94', { rect: { x: 300, y: 430, w: 680 }, alpha: 0.5 });
    this.actor('G30', { x: 250, y: GROUND + 20, h: 390, fps: 4 });
    this.actor('G74', { x: 520, y: GROUND + 20, h: 370, fps: 4 });
    this.actor('G75', { x: 790, y: GROUND + 20, h: 330, fps: 3 });
    this.actor('G76', { x: 1030, y: GROUND + 20, h: 280, fps: 4 });
    await this.say('RK', 'Sawah kami hijau lagi!');
    await this.say('Narasi', 'Parit itu selesai dan air mengalir ke seluruh desa. Tak ada yang mencatat nama pemahatnya.');
    this.hideDialog();
    // latar berganti ke malam
    await this.tween(this.R.fade, { alpha: 1 }, 0.7);
    this.audio.stopAllLoops();
    this.fxs.length = 0; this.tracked.length = 0; this.R.clear();
    this.bg('G78', { pan: false });
    this.fx('G97', { x: 1000, y: 120, h: 150 });
    const sp = this.actor('G77', { x: 420, y: GROUND + 10, h: 340, fps: 5 });
    const done = this.petrify(900, 520, 600);
    await this.tween(this.R.fade, { alpha: 0 }, 0.7);
    this.walk(sp, 760, 4.5, { step: 0.55 }).then(() => this.tween(sp, { alpha: 0 }, 1.2)).catch(() => {});
    await this.say('Narasi', 'Yang tersisa hanyalah parit itu, yang kini membeku menjadi Batu Mahpar.');
    await done;
    await this.go(20);
  }
}

function endButtons(scene, again) {
  const b1 = plaqueButton(scene.game, 'Ulangi', { w: 300, h: 92, size: 30, onClick: again });
  const b2 = plaqueButton(scene.game, 'Lanjut', { w: 300, h: 92, size: 30, onClick: () => scene.go(20) });
  b1.position.set(490, 640); b2.position.set(800, 640);
  for (const b of [b1, b2]) { b.alpha = 0; scene.add('ui', b); scene.tween(b, { alpha: 1 }, 0.5); }
}

// ENDING 2 - Belum Selesai
export class Scene18 extends Scene {
  async run() {
    this.audio.playBGM('S22');
    this.bg('G79', { pan: true, speed: 6 });
    this.fx('G91', { y: 20 });
    this.actor('G81', { x: 380, y: GROUND + 8, h: 400, fps: 3 });
    this.actor('G80', { x: 780, y: GROUND + 8, h: 420, fps: 3 });
    this.actor('G82', { x: 1050, y: GROUND + 20, h: 300, fps: 3 });
    await this.say('RK', 'Air belum sampai ke desa kami.');
    await this.say('TA', 'Baktimu belum cukup. Coba lagi.');
    this.hideDialog();
    endButtons(this, () => this.go(this.state.lastLevel === 3 ? 16 : 11));
  }
}

// ENDING 3 - Jalan Pintas
export class Scene19 extends Scene {
  async run() {
    this.audio.playBGM('S23');
    this.bg('G83', { pan: false });
    this.audio.playSFX('S24');
    this.R.shake(16, 0.9);
    [300, 640, 980].forEach((x, i) => { const d = this.obj('G86', { x, y: 470, h: 380, fps: 6 + i, anchor: [0.5, 1] }); d.alpha = 0.9; });
    this.fx('G98', { first: 1.2 });
    this.actor('G85', { x: 430, y: GROUND + 10, h: 330, fps: 4 });
    this.actor('G84', { x: 860, y: GROUND + 8, h: 430, fps: 3 });
    await this.say('Narasi', 'Kesaktian dipakai, tapi tanah retak dan parit runtuh.');
    await this.say('TA', 'Kesaktian saja tidak cukup. Parit ini menuntut bakti.');
    this.hideDialog();
    endButtons(this, () => this.go(11));
  }
}

// ADEGAN 20 - Pesan Moral
export class Scene20 extends Scene {
  async run() {
    this.audio.playBGM('S26');
    this.bg('G87', { pan: false });
    this.fx('G91', { y: 10 });
    this.fx('G95', { count: 7, scale: 0.55 });
    const q = txt(MORAL, { size: 27, bold: true, fill: 0xf6e3b0, stroke: 0x1d1208, strokeW: 6, wrap: 290, align: 'center', lh: 36 });
    q.anchor.set(0.5, 0); q.position.set(585, 200); q.alpha = 0; this.add('ui', q);
    this.tween(q, { alpha: 1 }, 1.8);

    const panel = new PIXI.NineSliceSprite({ texture: this.A.frameTextures('G88')[0], leftWidth: 110, rightWidth: 110, topHeight: 36, bottomHeight: 36 });
    panel.width = 900; panel.height = 200; panel.position.set(190, 498); this.add('ui', panel);
    const t = txt(ABOUT_END, { size: 20, wrap: 560, fill: 0x3b2512, lh: 26 });
    t.position.set(360, 536); this.add('ui', t);

    const again = iconButton(this.game, 'G89', { size: 104, label: 'Ulangi', onClick: () => { this.state.poin = 0; this.go(1); } });
    again.position.set(1150, 190); this.add('ui', again);
    const menu = iconButton(this.game, 'G90', { size: 104, label: 'Menu', onClick: () => this.go(1) });
    menu.position.set(1150, 350); this.add('ui', menu);
  }
}
