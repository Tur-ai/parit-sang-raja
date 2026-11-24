import { IMAGES, AUDIO } from '../assetManifest.js';

const PIXI = window.PIXI;
// Potongan khusus (sebagian sprite sheet punya sisa bayangan tipis di bawah badan utama)
const CROPS = { G3: { h: 232 } };

// Deteksi sprite sheet saat preloading: pakai jumlah frame dari manifest, tetapi diverifikasi dengan dimensi nyata gambar.
// Jika manifest tidak menyebut frame, tebak dari rasio lebar/tinggi (>= 2.2:1 -> 4 frame sejajar horizontal).
export function detectFrames(w, h, hint) {
  if (hint && hint > 1 && w % hint === 0) return hint;
  if (hint === 1) return 1;
  const r = w / h;
  if (r >= 2.2 && r < 9) return 4;
  return 1;
}

export class Assets {
  constructor() { this.tex = {}; this.frames = {}; this.meta = {}; this.audioData = {}; }

  async loadImages(onProgress) {
    const ids = Object.keys(IMAGES);
    let done = 0;
    const jobs = ids.map(async id => {
      const m = IMAGES[id];
      const t = await PIXI.Assets.load(m.path);
      t.source.scaleMode = 'linear';
      this.tex[id] = t;
      const frames = detectFrames(t.width, t.height, m.frames);
      const fw = Math.floor(t.width / frames);
      const crop = CROPS[id];
      const fh = crop ? crop.h : t.height;
      this.meta[id] = { frames, fw, fh, w: t.width, h: t.height, mode: m.mode };
      this.frames[id] = [];
      for (let i = 0; i < frames; i++) {
        this.frames[id].push(new PIXI.Texture({ source: t.source, frame: new PIXI.Rectangle(i * fw, 0, fw, fh) }));
      }
      if (m.plaque) {
        const pt = await PIXI.Assets.load(m.plaque.path);
        pt.source.scaleMode = 'linear';
        this.tex[id + 'P'] = pt;
        this.frames[id + 'P'] = [pt];
        this.meta[id + 'P'] = { frames: 1, fw: pt.width, fh: pt.height, w: pt.width, h: pt.height };
      }
      onProgress && onProgress(++done / ids.length * 0.7);
    });
    await Promise.all(jobs);
  }

  async loadAudio(audio, onProgress) {
    const ids = Object.keys(AUDIO);
    let done = 0;
    await Promise.all(ids.map(async id => {
      try {
        const url = encodeURI(`asset batu mahpar/${AUDIO[id].file}`);
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        await audio.register(id, buf, AUDIO[id]);
      } catch (e) {
        console.warn('Audio gagal dimuat', id, e);
      }
      onProgress && onProgress(0.7 + (++done / ids.length) * 0.3);
    }));
  }

  frameTextures(id) { return this.frames[id]; }
  info(id) { return this.meta[id]; }
}
