const PIXI = window.PIXI;

// Sprite yang otomatis memotong sprite sheet (frame sejajar) dan menganimasikannya.
export class SpriteAnimator extends PIXI.Sprite {
  constructor(assets, gid, { fps = 6, loop = true, play = true, anchor = [0.5, 1], height, width, scale, seq, onFrame, onComplete } = {}) {
    const frames = assets.frameTextures(gid);
    super(frames[0]);
    this.assets = assets;
    this.gid = gid;
    this.frames = frames;
    this.seq = seq || frames.map((_, i) => i);
    this.fps = fps;
    this.loop = loop;
    this.playing = play;
    this.onFrame = onFrame;
    this.onComplete = onComplete;
    this.t = 0;
    this.idx = 0;
    this.anchor.set(anchor[0], anchor[1]);
    this.fit({ height, width, scale });
  }
  // atur ukuran: height/width (piksel layar) atau scale
  fit({ height, width, scale } = {}) {
    const tex = this.texture;
    if (height) this.scale.set(height / tex.height);
    else if (width) this.scale.set(width / tex.width);
    else if (scale) this.scale.set(scale);
    return this;
  }
  setFrame(i) {
    this.idx = Math.max(0, Math.min(this.seq.length - 1, i));
    this.texture = this.frames[this.seq[this.idx]];
  }
  // ganti sheet (mis. ganti pose karakter) tanpa mengubah posisi; tinggi tetap sama bila keepHeight
  swap(gid, { keepHeight = true, fps } = {}) {
    const oldH = this.height;
    this.gid = gid;
    this.frames = this.assets.frameTextures(gid);
    this.seq = this.frames.map((_, i) => i);
    this.idx = 0; this.t = 0;
    this.texture = this.frames[0];
    if (fps) this.fps = fps;
    if (keepHeight) this.scale.set(oldH / this.texture.height * Math.sign(this.scale.x || 1), oldH / this.texture.height);
    return this;
  }
  play(fps) { if (fps) this.fps = fps; this.playing = true; return this; }
  stop() { this.playing = false; return this; }
  restart() { this.idx = 0; this.t = 0; this.setFrame(0); this.playing = true; return this; }
  update(dt) {
    if (!this.playing || this.destroyed) return;
    this.t += dt;
    const step = 1 / this.fps;
    while (this.t >= step) {
      this.t -= step;
      if (this.idx + 1 >= this.seq.length) {
        if (this.loop) this.idx = 0;
        else { this.playing = false; this.onComplete && this.onComplete(this); return; }
      } else this.idx++;
      this.texture = this.frames[this.seq[this.idx]];
      this.onFrame && this.onFrame(this.idx, this);
    }
  }
}
