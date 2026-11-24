import { Scene, GROUND } from '../engine/Scene.js';
import { Ease } from '../engine/Tween.js';

// Level 1 - Legenda. Pemain hanya mengetuk layar. Musik [S4] sepanjang level.
export class Scene4 extends Scene {   // Batu Mahpar masa kini
  async run() {
    this.bg('G11', { pan: true, speed: 16, start: 0 });
    this.ambient(['G91', 'G93', 'G99']);
    this.audio.playBGM('S4'); this.audio.playLoop('S5', { volume: 0.3 });
    const ps = this.actor('G12', { x: -170, y: GROUND + 8, h: 410, fps: 3 });
    await this.walk(ps, 430, 3.4);
    await this.say('PS', 'Selamat datang di Batu Mahpar, hamparan batu di kaki Gunung Galunggung, Desa Sukamulih, Kabupaten Tasikmalaya.');
    await this.say('PS', 'Menurut tuturan warga yang diwariskan turun-temurun, tempat ini berkaitan erat dengan masa kejayaan Kerajaan Galunggung.');
    await this.go(5);
  }
}

export class Scene5 extends Scene {   // Close-up batu
  async run() {
    this.audio.playBGM('S4'); this.audio.playLoop('S5', { volume: 0.25 });
    this.bg('G11', { pan: false, start: 0.2 }); this.dim(0.6);
    const stone = this.obj('G15', { x: 660, y: 500, w: 640, anchor: [0.5, 1] });
    this.actor('G16', { x: 210, y: GROUND + 8, h: 400, fps: 3 });
    const mk = (gid, y) => { const a = this.obj(gid, { x: 1080, y, h: 190, fps: 3, seq: [0, 1, 2, 3, 2, 1], anchor: [0.5, 0.5] }); a.scale.set(0); return a; };
    const foot = mk('G17', 165), rune = mk('G18', 365);
    const sc = h => h / this.A.frameTextures('G17')[0].height;
    foot.target = sc(190); rune.target = 190 / this.A.frameTextures('G18')[0].height;
    foot.alpha = rune.alpha = 0;
    const popIcon = a => { this.audio.playSFX('S8'); a.alpha = 1; return this.tween(a, { scale: a.target }, 0.5, Ease.outBack); };
    popIcon(foot);
    await this.say('PS', 'Lihat lekukan di batu ini. Dipercaya, ini bekas jejak kaki.');
    popIcon(rune);
    await this.say('PS', 'Di sebelahnya ada pahatan aksara Sunda kuno, peninggalan para leluhur kerajaan.');
    await this.go(6);
  }
}

export class Scene6 extends Scene {   // Penjaga situs bercerita
  async run() {
    this.audio.playBGM('S4');
    this.bg('G19', { pan: true, speed: 8 });
    this.fx('G92', { y: 420 });
    const batara = this.obj('G23', { x: 830, y: 500, h: 440, fps: 4 }); batara.alpha = 0;
    this.obj('G21', { x: 830, y: 545, h: 160, fps: 3 });
    this.obj('G22', { x: 960, y: 535, h: 250, fps: 3 });
    this.actor('G20', { x: 330, y: GROUND + 8, h: 410, fps: 3 });
    this.audio.playSFX('S9'); this.tween(batara, { alpha: 1 }, 2.0);
    await this.say('PS', 'Dahulu tempat ini disakralkan. Warga memakainya untuk upacara ritual, dan percaya para Batara berkumpul di sini.');
    await this.say('PS', 'Cerita yang paling terkenal bilang batu ini sebenarnya bekas parit besar. Mari kita lihat ceritanya.');
    await this.go(7);
  }
}

export class Scene7 extends Scene {   // Halaman kerajaan: aturan adat
  async run() {
    this.audio.playBGM('S4');
    this.bg('G24', { pan: true, speed: 8 });
    this.fx('G91', { y: 20 });
    this.actor('G25', { x: 700, y: GROUND + 8, h: 420, fps: 3 });
    await this.say('TA', 'Dengarlah. Untuk diangkat menjadi Raja Galunggung, seseorang tidak diukur dari keturunan atau kesaktian saja.');
    await this.say('TA', 'Ia wajib membuktikan baktinya lebih dulu: memahat parit dan mengalirkan air demi kesejahteraan rakyat.');
    await this.say('Narasi', 'Seseorang menerima tantangan itu. Sampai kini, tak ada yang tahu siapa dia.');
    await this.go(8);
  }
}

export class Scene8 extends Scene {   // Lereng pahat: memahat
  async run() {
    this.audio.playBGM('S4');
    this.bg('G26', { pan: true, speed: 8 });
    this.ambient(['G91', 'G92', 'G99']);
    const sp = this.actor('G27', { x: 640, y: GROUND + 10, h: 410, fps: 4 });
    // ayunan palu 4 frame; hantaman di frame ke-3 -> [S10] memahat + [S11] serpihan + debu [G28]
    sp.onFrame = idx => {
      if (idx !== 2) return;
      this.audio.playSFX('S10'); this.audio.playSFX('S11', { delay: 0.05, volume: 0.8 });
      const d = this.obj('G28', { x: sp.x + 6, y: GROUND - 120, h: 170, fps: 14, loop: false });
      d.onComplete = () => d.destroy();
    };
    await this.say('Narasi', 'Hari demi hari, batu dipahat sedikit demi sedikit.');
    await this.say('SP', 'Satu pukulan lagi. Untuk rakyat.');
    await this.go(9);
  }
}

export class Scene9 extends Scene {   // Desa makmur: air mengalir
  async run() {
    this.audio.playBGM('S4'); this.audio.playLoop('S12', { volume: 0.35 });
    this.bg('G29', { pan: true, speed: 8 });
    this.ambient(['G91', 'G93', 'G99']);
    this.obj('G32', { x: 870, y: 520, w: 600, fps: 4 });
    this.fx('G94', { rect: { x: 600, y: 395, w: 540 }, alpha: 0.5 });
    const drop = this.obj('G31', { x: 1180, y: 470, h: 170, fps: 5 });
    drop.onFrame = i => { if (i === 0) this.audio.playSFX('S13', { volume: 0.6 }); };
    this.actor('G30', { x: 300, y: GROUND + 8, h: 410, fps: 4 });
    await this.say('RK', 'Air! Airnya mengalir sampai ke desa!');
    await this.say('Narasi', 'Parit itu menghidupkan sawah dan menyejahterakan rakyat.');
    await this.go(10);
  }
}

export class Scene10 extends Scene {   // Parit membeku jadi Batu Mahpar
  async run() {
    this.audio.playBGM('S4');
    this.bg('G33', { pan: true, speed: 8 });
    this.ambient(['G91', 'G93']);
    this.actor('G34', { x: 300, y: GROUND + 8, h: 420, fps: 3 });
    const done = this.petrify(880, 520, 620);
    await this.say('PS', 'Parit kerja keras itu kini membeku menjadi Batu Mahpar.');
    await this.say('PS', 'Sampai sekarang, tidak ada yang tahu siapa pemahatnya.');
    await done;
    await this.go(20);
  }
}
