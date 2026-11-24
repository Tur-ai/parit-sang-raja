const PIXI = window.PIXI;
export const FONT = 'Georgia, "Palatino Linotype", "Book Antiqua", serif';

export function txt(str, { size = 28, fill = 0x3b2512, bold = false, italic = false, wrap = 0, align = 'left', stroke = 0, strokeW = 0, lh } = {}) {
  const style = {
    fontFamily: FONT, fontSize: size, fill, fontWeight: bold ? '700' : '400', fontStyle: italic ? 'italic' : 'normal',
    wordWrap: !!wrap, wordWrapWidth: wrap || 0, align, lineHeight: lh || Math.round(size * 1.32),
  };
  if (stroke) style.stroke = { color: stroke, width: strokeW || 4 };
  const t = new PIXI.Text({ text: str, style });
  t.resolution = 2;
  return t;
}

function press(c, onClick, game, { sfx = true } = {}) {
  c.eventMode = 'static'; c.cursor = 'pointer';
  c.on('pointerdown', e => { e.stopPropagation(); game.audio.unlock(); c._down = true; c.onDown && c.onDown(); });
  c.on('pointerup', e => { e.stopPropagation(); if (c._down) { c._down = false; c.onUp && c.onUp(); } });
  c.on('pointerupoutside', () => { c._down = false; c.onUp && c.onUp(); });
  c.on('pointerover', () => c.onOver && c.onOver());
  c.on('pointerout', () => { c._down = false; c.onOut && c.onOut(); });
  c.on('pointertap', e => {
    e.stopPropagation();
    if (c.disabled) return;
    if (sfx) game.audio.playSFX('S2');
    onClick && onClick(e);
  });
}

// Tombol plakat kayu [G3] (frame: normal, hover, ditekan, nonaktif) dengan teks & ikon opsional
export function plaqueButton(game, label, { w = 520, h = 100, size = 28, onClick, icon, sfx = true } = {}) {
  const frames = game.assets.frameTextures('G3');
  const c = new PIXI.Container();
  const bg = new PIXI.NineSliceSprite({ texture: frames[0], leftWidth: 70, rightWidth: 70, topHeight: 46, bottomHeight: 46 });
  bg.width = w; bg.height = h; bg.position.set(-w / 2, -h / 2);
  c.addChild(bg);
  const t = txt(label, { size, fill: 0xfff6d8, bold: true, stroke: 0x3a1e0c, strokeW: 5, align: 'center' });
  t.anchor.set(0.5); t.x = icon ? 44 : 0; c.addChild(t);
  if (icon) {
    const ic = game.renderer.animator(icon, { fps: 3, anchor: [0.5, 0.5], height: h - 14 });
    ic.x = -w / 2 + 62; c.addChild(ic); c.icon = ic;
  }
  c.bg = bg; c.label = t;
  c.onOver = () => { if (!c.disabled) bg.texture = frames[1]; };
  c.onOut = () => { bg.texture = c.disabled ? frames[3] : frames[0]; };
  c.onDown = () => { if (!c.disabled) { bg.texture = frames[2]; c.scale.set(0.97); } };
  c.onUp = () => { bg.texture = frames[1]; c.scale.set(1); };
  c.setEnabled = v => { c.disabled = !v; bg.texture = v ? frames[0] : frames[3]; };
  c.update = dt => { if (c.icon) c.icon.update(dt); };
  press(c, onClick, game, { sfx });
  return c;
}

// Tombol ikon bundar animasi (medali / ikon batu)
export function iconButton(game, gid, { size = 110, label, onClick, fps = 3, sfx = true, labelSize = 22 } = {}) {
  const c = new PIXI.Container();
  const a = game.renderer.animator(gid, { fps, anchor: [0.5, 0.5], height: size });
  c.addChild(a); c.anim = a;
  if (label) {
    const t = txt(label, { size: labelSize, fill: 0xfff6d8, bold: true, stroke: 0x2a160a, strokeW: 5, align: 'center' });
    t.anchor.set(0.5, 0); t.y = size / 2 + 6; c.addChild(t);
  }
  c.hitArea = new PIXI.Rectangle(-a.width / 2, -a.height / 2, a.width, a.height + (label ? 40 : 0));
  c.onOver = () => c.scale.set(1.07);
  c.onOut = () => c.scale.set(1);
  c.onDown = () => c.scale.set(0.93);
  c.onUp = () => c.scale.set(1.04);
  c.update = dt => a.update(dt);
  press(c, onClick, game, { sfx });
  return c;
}

export { press };
