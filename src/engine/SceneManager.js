// State machine antar adegan (1..20) dengan transisi fade halus.
export class SceneManager {
  constructor(game) { this.game = game; this.reg = new Map(); this.cur = null; this.curId = null; this.busy = false; }
  register(id, Cls) { this.reg.set(id, Cls); }
  async go(id, params = {}, { fade = 0.45 } = {}) {
    const { renderer: R, tweens: T } = this.game;
    while (this.busy) await T.wait(0.05);
    this.busy = true;
    if (this.cur) {
      await T.to(R.fade, { alpha: 1 }, fade);
      this.cur.exit(); this.game.dialog.cancel(); R.clear(); this.cur = null;
    }
    const Cls = this.reg.get(id);
    if (!Cls) { console.error('Adegan tidak ada:', id); this.busy = false; return; }
    const s = new Cls(this.game);
    this.cur = s; this.curId = id;
    document.title = `Parit Sang Raja - Adegan ${id}`;
    await s.enter(params);
    await T.to(R.fade, { alpha: 0 }, fade);
    this.busy = false;
  }
  update(dt) { this.cur && this.cur.update(dt); }
}
