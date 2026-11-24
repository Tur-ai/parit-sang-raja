import { SpriteAnimator } from './SpriteAnimator.js';
const PIXI = window.PIXI;

export const W = 1280, H = 720;

// Urutan layer:
//  1 bg      latar statis / panning pelan
//  2 fx      efek latar bergerak (awan, kabut, burung, riak, ...)
//  3 obj     objek/item & efek aksi (parit, debu, percikan, cahaya Batara)
//  4 chr     karakter
//  4b fxTop  efek yang harus di depan karakter (kilat, kilau, daun)
//  5 ui      UI adegan, tombol
//  hud       dialog, tombol mute (persisten antar adegan)
export class Renderer {
  async init(container, assets) {
    this.assets = assets;
    this.app = new PIXI.Application();
    await this.app.init({
      resizeTo: window, background: 0x07090c, antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true, autoStart: false,
    });
    container.appendChild(this.app.canvas);
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = new PIXI.Rectangle(-10000, -10000, 20000, 20000);

    this.root = new PIXI.Container();
    this.app.stage.addChild(this.root);
    this.viewport = new PIXI.Container();
    this.root.addChild(this.viewport);
    const mask = new PIXI.Graphics().rect(0, 0, W, H).fill(0xffffff);
    this.viewport.addChild(mask);
    this.viewport.mask = mask;

    this.shaker = new PIXI.Container();
    this.viewport.addChild(this.shaker);
    this.layers = {};
    for (const n of ['bg', 'fx', 'obj', 'chr', 'fxTop', 'ui']) {
      const c = new PIXI.Container(); c.label = n; this.layers[n] = c; this.shaker.addChild(c);
    }
    this.hud = new PIXI.Container(); this.viewport.addChild(this.hud);
    this.flash = new PIXI.Graphics().rect(0, 0, W, H).fill(0xffffff); this.flash.alpha = 0; this.flash.eventMode = 'none';
    this.viewport.addChild(this.flash);
    this.fade = new PIXI.Graphics().rect(0, 0, W, H).fill(0x000000); this.fade.alpha = 1; this.fade.eventMode = 'none';
    this.viewport.addChild(this.fade);

    this.shakeT = 0; this.shakeDur = 0; this.shakePow = 0;
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 120));
    this.resize();
  }

  // 1280x720 virtual, auto-scale + letterbox
  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const s = Math.min(w / W, h / H);
    this.scale = s;
    this.root.scale.set(s);
    this.root.position.set((w - W * s) / 2, (h - H * s) / 2);
  }

  // koordinat layar (px browser) -> koordinat virtual
  toVirtual(px, py) { return { x: (px - this.root.x) / this.scale, y: (py - this.root.y) / this.scale }; }

  clear() {
    for (const n in this.layers) {
      const l = this.layers[n];
      for (const c of l.removeChildren()) c.destroy({ children: true });
    }
    this.shaker.position.set(0, 0);
    this.flash.alpha = 0;
  }

  sprite(gid, frame = 0) { return new PIXI.Sprite(this.assets.frameTextures(gid)[frame]); }
  animator(gid, opts) { return new SpriteAnimator(this.assets, gid, opts); }

  shake(power = 14, dur = 0.6) { this.shakePow = power; this.shakeDur = dur; this.shakeT = dur; }
  doFlash(a = 0.9, dur = 0.35) { this.flash.alpha = a; this._flashDur = dur; this._flashA = a; }

  update(dt) {
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const k = Math.max(0, this.shakeT / this.shakeDur);
      this.shaker.position.set((Math.random() * 2 - 1) * this.shakePow * k, (Math.random() * 2 - 1) * this.shakePow * k);
      if (this.shakeT <= 0) this.shaker.position.set(0, 0);
    }
    if (this.flash.alpha > 0) this.flash.alpha = Math.max(0, this.flash.alpha - dt / (this._flashDur || 0.3) * (this._flashA || 1));
  }

  render() { this.app.render(); }
}

// Latar penuh: skala "cover" terhadap tinggi 720, dengan panning pelan bolak-balik bila lebih lebar dari 16:9.
export class Background extends PIXI.Container {
  constructor(renderer, gid, { pan = true, speed = 9, start = 0.5, zoom = 1 } = {}) {
    super();
    const tex = renderer.assets.tex[gid];
    this.sprite = new PIXI.Sprite(tex);
    const s = Math.max(H / tex.height, W / tex.width) * zoom;
    this.sprite.scale.set(s);
    this.addChild(this.sprite);
    this.range = Math.max(0, this.sprite.width - W);
    this.pan = pan && this.range > 4;
    this.speed = speed;
    this.dir = 1;
    this.px = this.range * start;
    this.x = -this.px;
    this.y = -(this.sprite.height - H) / 2;
    this.s = s;
  }
  // tempelkan objek pada koordinat relatif gambar (u,v 0..1) agar ikut bergeser bersama latar
  attach(obj, u, v) {
    obj.position.set(u * this.sprite.width, v * this.sprite.height);
    this.addChild(obj);
    return obj;
  }
  update(dt) {
    if (!this.pan) return;
    this.px += this.dir * this.speed * dt;
    if (this.px >= this.range) { this.px = this.range; this.dir = -1; }
    if (this.px <= 0) { this.px = 0; this.dir = 1; }
    this.x = -this.px;
  }
}
