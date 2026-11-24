import { Scene, GROUND } from '../engine/Scene.js';
import { Ease } from '../engine/Tween.js';
import { txt } from '../engine/UI.js';

// Level 2 - Ujian Pemahat. poinBakti mulai 0. Musik [S14] sepanjang level.
export class Scene11 extends Scene {   // Halaman kerajaan: tantangan
  async run() {
    this.state.poin = 0; this.state.lastLevel = 2;
    this.audio.playBGM('S14'); this.audio.playLoop('S15', { volume: 0.3 });
    this.bg('G37', { pan: false });
    this.fx('G96', { points: [{ x: 215, y: 342, h: 58 }, { x: 1065, y: 342, h: 58 }] });
    this.fx('G97', { x: 1090, y: 170, h: 120 });
    this.actor('G39', { x: 380, y: GROUND + 8, h: 410, fps: 3 });
    this.actor('G38', { x: 900, y: GROUND + 8, h: 430, fps: 3 });
    await this.say('TA', 'Apakah kau menerima tantangan ini?');
    const c = await this.choose([
      { label: 'Aku akan memahat parit dengan tanganku sendiri.', gid: 'G40' },
      { label: 'Aku punya kesaktian. Parit ini jadi dalam sekejap.', gid: 'G41' },
    ]);
    if (c === 0) { await this.say('TA', 'Mulailah. Rakyat menunggu.'); await this.go(13); }
    else await this.go(12);
  }
}

export class Scene12 extends Scene {   // Cabang kesaktian -> Ending 3
  async run() {
    this.audio.playBGM('S14');
    this.bg('G42', { pan: false });
    this.hideDialog();
    await this.wait(0.5);
    this.audio.playSFX('S16');
    const b = this.obj('G43', { x: 640, y: 560, h: 420, fps: 5, loop: false, anchor: [0.5, 1] });
    b.blendMode = 'add';
    this.R.shake(22, 1.2); this.R.doFlash(0.8, 0.8);
    this.tween(b, { scale: b.scale.x * 2.6 }, 1.0, Ease.outCubic);
    await this.wait(1.0);
    await this.tween(b, { alpha: 0 }, 0.7);
    await this.wait(0.8);
    await this.go(19);
  }
}

export class Scene13 extends Scene {   // Desa kering
  async run() {
    this.audio.playBGM('S14');
    this.bg('G44', { pan: true, speed: 8 });
    this.ambient(['G91', 'G99']);
    const rk = this.actor('G45', { x: 330, y: GROUND + 8, h: 410, fps: 3 });
    const sp = this.actor('G39', { x: 940, y: GROUND + 8, h: 410, fps: 3 });
    const bubble = this.obj('G47', { x: 470, y: 190, h: 170, fps: 3, anchor: [0.5, 0.5] });
    const tube = this.obj('G48', { x: 470, y: 182, h: 78, fps: 3, anchor: [0.5, 0.5] });
    await this.say('RK', 'Tolong kami. Sumur kering dan anak-anak kehausan.');
    const c = await this.choose([
      { label: 'Aku bantu kalian dulu.' },
      { label: 'Maaf, aku harus menyelesaikan parit.' },
    ]);
    if (c === 0) {
      this.state.poin += 2;
      sp.swap('G46', { fps: 3 }); rk.swap('G30', { fps: 4 });
      bubble.visible = tube.visible = false;
      await this.say('SP', 'Ambil bumbung ini. Aku akan segera mengalirkan air.');
    } else {
      this.state.poin += 1;
      await this.say('RK', 'Kami akan menunggu.');
    }
    await this.go(14);
  }
}

export class Scene14 extends Scene {   // Lereng pahat: kelelahan
  async run() {
    this.audio.playBGM('S14');
    this.bg('G49', { pan: true, speed: 8 });
    this.ambient(['G91', 'G99']);
    const sp = this.actor('G50', { x: 640, y: GROUND + 8, h: 410, fps: 3 });
    const sweat = this.obj('G53', { x: 590, y: GROUND - 300, h: 90, fps: 5, anchor: [0.5, 0.5] });
    await this.say('Narasi', 'Tangan Sang Pemahat gemetar, napasnya berat.');
    const c = await this.choose([{ label: 'Istirahat sebentar.' }, { label: 'Paksakan terus.' }]);
    if (c === 0) {
      this.state.poin += 1;
      sp.swap('G51', { fps: 3 }); sweat.visible = false;
      await this.say('SP', 'Sebentar saja, lalu lanjut.');
    } else {
      sp.swap('G52', { fps: 6 });
      this.audio.playSFX('S17'); this.R.shake(10, 0.5);
      const crack = this.obj('G54', { x: 930, y: GROUND + 8, h: 230, fps: 3, loop: false });
      await this.say('Narasi', 'Pahat meleset dan batu retak. Parit jadi lebih lama selesai.');
    }
    await this.go(15);
  }
}

export class Scene15 extends Scene {   // Hasil
  async run() {
    this.audio.playBGM('S14');
    this.bg('G55', { pan: false });
    this.fx('G95', { count: 8 });
    const poin = Math.min(3, this.state.poin);
    const board = this.obj('G56', { x: 640, y: 290, w: 480, play: false, anchor: [0.5, 1] });
    const t = txt('Poin Bakti', { size: 40, bold: true, fill: 0xfff1c9, stroke: 0x2a160a, strokeW: 7 });
    t.anchor.set(0.5); t.position.set(640, 70); this.add('ui', t);
    const stars = [0, 1, 2].map(i => this.actor('G57', { x: 480 + i * 160, y: 520, h: 150, play: false, layer: 'obj' }));
    await this.wait(0.8);
    for (let i = 0; i < poin; i++) {
      this.audio.playSFX('S18');
      for (let f = 1; f <= 3; f++) { stars[i].setFrame(f); await this.wait(0.12); }
      this.tween(stars[i], { scale: stars[i].scale.x * 1.18 }, 0.18, Ease.outQuad).then(() => this.tween(stars[i], { scale: stars[i].scale.x / 1.18 }, 0.2));
      board.setFrame(Math.min(3, i + 1));
      await this.wait(0.55);
    }
    const ok = this.state.poin >= 3;
    const msg = txt(`${this.state.poin} poin bakti. ${ok ? 'Baktimu diakui rakyat!' : 'Baktimu belum cukup...'}`, { size: 32, bold: true, fill: 0xfff1c9, stroke: 0x2a160a, strokeW: 6 });
    msg.anchor.set(0.5); msg.position.set(640, 640); this.add('ui', msg);
    await this.wait(2.8);
    await this.go(ok ? 17 : 18);
  }
}
