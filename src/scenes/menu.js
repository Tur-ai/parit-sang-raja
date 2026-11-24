import { Scene } from '../engine/Scene.js';
import { Ease } from '../engine/Tween.js';
import { plaqueButton, iconButton, txt } from '../engine/UI.js';
import { TUTORIAL, ABOUT, CREDITS } from '../data/script.js';
const PIXI = window.PIXI;

// ADEGAN 1 - Menu utama
export class Scene1 extends Scene {
  async run() {
    const { audio, state } = this.game;
    this.bg('G1', { pan: false });
    this.fx('G91', { y: 10 }); this.fx('G92', { y: 440 });
    audio.playBGM('S1'); audio.playLoop('S3', { volume: 0.35 });

    const logo = this.R.animator('G2', { fps: 3, anchor: [0.5, 0], height: 330 });
    logo.position.set(640, 18); this.add('ui', logo);

    const home = new PIXI.Container(); this.add('ui', home);
    const start = plaqueButton(this.game, 'Mulai Game', { w: 460, h: 108, size: 34, onClick: () => showLevels(true) });
    start.position.set(640, 468); home.addChild(start);
    const tut = iconButton(this.game, 'G4', { size: 104, label: 'Tutorial', onClick: () => this.go(2) });
    tut.position.set(520, 606); home.addChild(tut);
    const set = iconButton(this.game, 'G5', { size: 104, label: 'Pengaturan', onClick: () => this.go(3) });
    set.position.set(760, 606); home.addChild(set);
    this.tracked.push(start, tut, set);

    const levels = new PIXI.Container(); levels.visible = false; this.add('ui', levels);
    const defs = [
      { gid: 'G8', label: 'Level 1\nLegenda', run: () => { state.lastLevel = 1; this.go(4); } },
      { gid: 'G9', label: 'Level 2\nUjian Pemahat', run: () => { state.lastLevel = 2; state.poin = 0; this.go(11); } },
      { gid: 'G10', label: 'Level 3\nParit Panjang', run: () => { state.lastLevel = 3; this.go(16); } },
    ];
    const medals = defs.map((d, i) => {
      const b = iconButton(this.game, d.gid, { size: 150, label: d.label, labelSize: 24, onClick: d.run });
      b.position.set(380 + i * 260, 420); levels.addChild(b); this.tracked.push(b); return b;
    });
    const back = plaqueButton(this.game, 'Kembali', { w: 260, h: 76, size: 24, onClick: () => showLevels(false) });
    back.position.set(640, 668); levels.addChild(back); this.tracked.push(back);

    const showLevels = on => {
      home.visible = !on; levels.visible = on;
      if (on) medals.forEach((m, i) => { m.scale.set(0); this.game.tweens.to(m, { scale: 1 }, 0.45, Ease.outBack, this, i * 0.1); });
    };
  }
}

// ADEGAN 2 - Tutorial (3 halaman)
export class Scene2 extends Scene {
  async run() {
    this.bg('G1', { pan: false });
    this.fx('G91', { y: 10 });
    this.audio.playBGM('S1');
    for (const t of TUTORIAL) await this.say('Info', t);
    this.hideDialog();
    await this.go(1);
  }
}

// ADEGAN 3 - Pengaturan (suara + Tentang Legenda + kredit)
export class Scene3 extends Scene {
  async run() {
    const { audio } = this.game;
    this.bg('G1', { pan: false }); this.dim(0.45);
    this.audio.playBGM('S1');
    const title = txt('Pengaturan', { size: 40, bold: true, fill: 0xfff1c9, stroke: 0x2a160a, strokeW: 6 });
    title.anchor.set(0.5); title.position.set(640, 42); this.add('ui', title);

    const mk = (kind, label, x) => {
      const b = iconButton(this.game, 'G6', { size: 92, label, labelSize: 20, onClick: () => { audio.toggleMute(kind); sync(); } });
      b.position.set(x, 122); this.add('ui', b);
      const sync = () => { b.anim.stop(); b.anim.setFrame(audio.muted[kind] ? 0 : 3); b.alpha = audio.muted[kind] ? 0.6 : 1; };
      sync(); return b;
    };
    mk('bgm', 'Musik', 470); mk('sfx', 'Efek Suara', 640);
    const about = iconButton(this.game, 'G7', { size: 92, label: 'Tentang', labelSize: 20, onClick: () => {} });
    about.position.set(810, 122); this.add('ui', about);

    const panel = new PIXI.NineSliceSprite({ texture: this.A.frameTextures('G88')[0], leftWidth: 110, rightWidth: 110, topHeight: 36, bottomHeight: 36 });
    panel.width = 980; panel.height = 400; panel.position.set(150, 228); this.add('ui', panel);
    const h = txt('Tentang Legenda', { size: 26, bold: true, fill: 0x4a2a10 }); h.position.set(300, 256); this.add('ui', h);
    const p = txt(ABOUT, { size: 21, wrap: 660, fill: 0x3b2512 }); p.position.set(300, 292); this.add('ui', p);
    const c = txt(`Kredit & Lisensi\n${CREDITS.music}\n${CREDITS.sfx}\n${CREDITS.license}`, { size: 16, wrap: 660, fill: 0x5a3a20, lh: 21 });
    c.position.set(300, 290 + p.height + 14); this.add('ui', c);

    const back = plaqueButton(this.game, 'Kembali', { w: 300, h: 88, size: 28, onClick: () => this.go(1) });
    back.position.set(640, 668); this.add('ui', back);
  }
}
