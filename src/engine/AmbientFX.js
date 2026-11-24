import { W, H } from './Renderer.js';
const PIXI = window.PIXI;

const rnd = (a, b) => a + Math.random() * (b - a);

// Efek latar bergerak [G91]-[G100]. Setiap efek: { node, layer, update(dt) }.
export function createFX(game, id, o = {}) {
  const A = game.assets, R = game.renderer;
  const tile = (gid, { scale, y, speed, alpha, h }) => {
    const t = A.frameTextures(gid)[0];
    const ts = new PIXI.TilingSprite({ texture: t, width: W, height: t.height * scale });
    ts.tileScale.set(scale); ts.y = y; ts.alpha = alpha;
    ts.eventMode = 'none';
    return { ts, speed };
  };
  switch (id) {
    case 'G91': { // awan melayang (seamless)
      const node = new PIXI.Container();
      const a = tile('G91', { scale: 0.36, y: o.y ?? 40, speed: 7, alpha: 0.65 });
      const b = tile('G91', { scale: 0.55, y: (o.y ?? 40) - 40, speed: 15, alpha: 0.85 });
      b.ts.tilePosition.x = 400;
      node.addChild(a.ts, b.ts);
      return { node, layer: 'fx', update(dt) { a.ts.tilePosition.x -= a.speed * dt; b.ts.tilePosition.x -= b.speed * dt; } };
    }
    case 'G92': { // kabut melayang
      const node = new PIXI.Container();
      const a = tile('G92', { scale: 1.0, y: o.y ?? H - 290, speed: -12, alpha: 0.55 });
      const b = tile('G92', { scale: 1.4, y: (o.y ?? H - 290) - 90, speed: 6, alpha: 0.35 });
      node.addChild(b.ts, a.ts);
      return { node, layer: 'fx', update(dt) { a.ts.tilePosition.x -= a.speed * dt; b.ts.tilePosition.x -= b.speed * dt; } };
    }
    case 'G93': { // burung terbang
      const node = new PIXI.Container();
      const flocks = [0, 1].map(i => {
        const s = R.animator('G93', { fps: 5, scale: i ? 0.22 : 0.32, anchor: [0.5, 0.5] });
        s.x = i ? W * 0.9 : W * 0.4; s.y = i ? 130 : 90; s.alpha = 0.95;
        s.vx = i ? -42 : -62; s.base = s.y; s.ph = rnd(0, 6);
        node.addChild(s); return s;
      });
      return { node, layer: 'fx', update(dt) {
        for (const s of flocks) {
          s.update(dt); s.x += s.vx * dt; s.ph += dt * 1.4; s.y = s.base + Math.sin(s.ph) * 14;
          if (s.x < -200) { s.x = W + 200 + rnd(0, 400); s.base = rnd(60, 190); }
        }
      } };
    }
    case 'G94': { // riak air di atas parit: o.rect = {x,y,w}
      const r = o.rect || { x: 340, y: 520, w: 600 };
      const node = new PIXI.Container();
      const n = Math.max(1, Math.round(r.w / (o.pieceW || 220)));
      const pw = r.w / n;
      const pcs = [];
      for (let i = 0; i < n; i++) {
        const s = R.animator('G94', { fps: 4, width: pw * 1.08, anchor: [0.5, 0] });
        s.x = r.x + pw * (i + 0.5); s.y = r.y; s.alpha = o.alpha ?? 0.7; s.t = i * 0.12;
        pcs.push(s); node.addChild(s);
      }
      return { node, layer: 'obj', update(dt) { pcs.forEach(s => s.update(dt)); } };
    }
    case 'G95': { // kilau cahaya
      const node = new PIXI.Container();
      const n = o.count ?? 9;
      const reg = o.region || { x: 0, y: 40, w: W, h: 520 };
      const items = [];
      for (let i = 0; i < n; i++) {
        const s = R.animator('G95', { fps: 3.2, anchor: [0.5, 0.5], scale: rnd(0.9, 1.5) * (o.scale ?? 1), loop: true });
        s.blendMode = 'add'; s.alpha = 0.8;
        s.x = reg.x + rnd(0, reg.w); s.y = reg.y + rnd(0, reg.h);
        s.t = rnd(0, 0.3); s.setFrame(Math.floor(rnd(0, 4)));
        s.onFrame = (idx) => { if (idx === 0) { s.x = reg.x + rnd(0, reg.w); s.y = reg.y + rnd(0, reg.h); } };
        items.push(s); node.addChild(s);
      }
      return { node, layer: 'fxTop', update(dt) { items.forEach(s => s.update(dt)); } };
    }
    case 'G96': { // nyala lampu: o.points = [{x,y,s}] atau o.attach(bg)
      const node = new PIXI.Container();
      const fl = [];
      for (const p of (o.points || [])) {
        const s = R.animator('G96', { fps: 8, anchor: [0.5, 1], height: p.h ?? 52 });
        s.x = p.x; s.y = p.y; s.t = rnd(0, 0.2); s.setFrame(Math.floor(rnd(0, 4)));
        const glow = R.sprite('G96', 0); glow.anchor.set(0.5, 0.6); glow.blendMode = 'add';
        glow.scale.set((p.h ?? 52) / glow.texture.height * 2.6); glow.alpha = 0.28; glow.x = p.x; glow.y = p.y;
        node.addChild(glow, s); fl.push({ s, glow });
      }
      return { node, layer: o.layer || 'fx', update(dt) { fl.forEach(f => { f.s.update(dt); f.glow.alpha = 0.22 + Math.sin(performance.now() / 130 + f.s.x) * 0.07; }); } };
    }
    case 'G97': { // bintang malam berkelip (+ bulan sabit)
      const s = R.animator('G97', { fps: 3, anchor: [0.5, 0.5], height: o.h ?? 130 });
      s.x = o.x ?? 1060; s.y = o.y ?? 100; s.alpha = 0.95;
      return { node: s, layer: 'fx', update(dt) { s.update(dt); } };
    }
    case 'G98': { // kilat
      const node = new PIXI.Container();
      const s = R.animator('G98', { fps: 14, loop: false, play: false, anchor: [0.5, 0], height: 600 });
      s.visible = false; s.blendMode = 'add';
      node.addChild(s);
      let cd = o.first ?? 0.6;
      const strike = () => {
        s.x = rnd(260, 1020); s.y = -20; s.scale.x = (Math.random() < 0.5 ? -1 : 1) * Math.abs(s.scale.x);
        s.visible = true; s.restart();
        s.onComplete = () => { s.visible = false; };
        R.doFlash(0.55, 0.35); R.shake(9, 0.35);
        game.audio.playSFX('S25', { volume: 0.8 });
      };
      return { node, layer: 'fxTop', strike, update(dt) {
        s.update(dt);
        if (o.auto !== false) { cd -= dt; if (cd <= 0) { strike(); cd = rnd(2.4, 4.2); } }
      } };
    }
    case 'G99': { // daun tertiup angin
      const node = new PIXI.Container();
      const ls = [];
      for (let i = 0; i < 3; i++) {
        const s = R.animator('G99', { fps: 4 + i, anchor: [0.5, 0.5], scale: rnd(0.2, 0.34) });
        s.x = rnd(0, W); s.y = rnd(-60, 420); s.vx = -rnd(55, 110); s.vy = rnd(18, 42); s.ph = rnd(0, 6); s.alpha = 0.92;
        s.t = rnd(0, 0.2); ls.push(s); node.addChild(s);
      }
      return { node, layer: 'fxTop', update(dt) {
        for (const s of ls) {
          s.update(dt); s.ph += dt * 1.6; s.x += s.vx * dt; s.y += (s.vy + Math.sin(s.ph) * 24) * dt;
          if (s.x < -200 || s.y > H + 100) { s.x = W + rnd(100, 500); s.y = rnd(-120, 380); }
        }
      } };
    }
    case 'G100': { // bendera berkibar
      const node = new PIXI.Container();
      const fs = [0, 1].map(i => {
        const s = R.animator('G100', { fps: 4, anchor: [0, 0], width: W / 2 + 6 });
        s.x = i * (W / 2) - 3; s.y = o.y ?? 0; s.t = i * 0.15; node.addChild(s); return s;
      });
      return { node, layer: 'fxTop', update(dt) { fs.forEach(s => s.update(dt)); } };
    }
    default: throw new Error('FX tidak dikenal: ' + id);
  }
}
