// WebAudio: BGM (looping, crossfade), SFX sekali jalan, SFX loop, mute global, unlock pada klik pertama.
export class AudioManager {
  constructor() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = AC ? new AC() : null;
    this.buffers = {};
    this.meta = {};
    this.bgmId = null;
    this.bgmNode = null;
    this.loops = {};
    this.muted = { bgm: false, sfx: false };
    try {
      const saved = JSON.parse(localStorage.getItem('psr_mute') || '{}');
      if (typeof saved.bgm === 'boolean') this.muted.bgm = saved.bgm;
      if (typeof saved.sfx === 'boolean') this.muted.sfx = saved.sfx;
    } catch (e) { /* abaikan */ }
    this.unlocked = false;
    if (this.ctx) {
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      this.bgmGain = this.ctx.createGain(); this.bgmGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.connect(this.master);
      this._applyMute();
    }
  }

  async register(id, arrayBuffer, meta) {
    if (!this.ctx) return;
    this.meta[id] = meta;
    this.buffers[id] = await new Promise((res, rej) => this.ctx.decodeAudioData(arrayBuffer, res, rej));
  }

  // Dipanggil pada interaksi pertama pemain (kebijakan autoplay browser)
  unlock() {
    if (!this.ctx || this.unlocked) return;
    this.ctx.resume().then(() => { this.unlocked = true; }).catch(() => {});
    // beberapa browser butuh bunyi kosong
    const b = this.ctx.createBuffer(1, 1, 22050), s = this.ctx.createBufferSource();
    s.buffer = b; s.connect(this.ctx.destination); s.start(0);
    this.unlocked = this.ctx.state === 'running' || this.unlocked;
  }

  _applyMute() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.bgmGain.gain.setTargetAtTime(this.muted.bgm ? 0 : 0.55, t, 0.02);
    this.sfxGain.gain.setTargetAtTime(this.muted.sfx ? 0 : 0.9, t, 0.02);
  }
  _save() { try { localStorage.setItem('psr_mute', JSON.stringify(this.muted)); } catch (e) { /* abaikan */ } }
  setMuted(kind, v) { this.muted[kind] = !!v; this._applyMute(); this._save(); }
  toggleMute(kind) { this.setMuted(kind, !this.muted[kind]); return this.muted[kind]; }
  get allMuted() { return this.muted.bgm && this.muted.sfx; }
  toggleAll() { const v = !this.allMuted; this.muted.bgm = v; this.muted.sfx = v; this._applyMute(); this._save(); return v; }

  // BGM: jika id sama dan sedang berjalan -> biarkan (tidak restart). Jika berbeda -> crossfade.
  playBGM(id, { loop, fade = 0.8, volume = 1 } = {}) {
    if (!this.ctx || !this.buffers[id]) { this.bgmId = id; return; }
    if (this.bgmId === id && this.bgmNode) return;
    this.stopBGM(fade);
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[id];
    src.loop = loop !== undefined ? loop : !!this.meta[id]?.loop;
    const g = this.ctx.createGain();
    g.gain.value = 0;
    src.connect(g); g.connect(this.bgmGain);
    src.start(0);
    g.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + fade);
    this.bgmNode = { src, g };
    this.bgmId = id;
    src.onended = () => { if (this.bgmNode && this.bgmNode.src === src) { this.bgmNode = null; } };
  }
  stopBGM(fade = 0.6) {
    if (!this.ctx) { this.bgmId = null; return; }
    const n = this.bgmNode;
    this.bgmNode = null; this.bgmId = null;
    if (!n) return;
    const t = this.ctx.currentTime;
    n.g.gain.cancelScheduledValues(t);
    n.g.gain.setValueAtTime(n.g.gain.value, t);
    n.g.gain.linearRampToValueAtTime(0, t + fade);
    try { n.src.stop(t + fade + 0.05); } catch (e) { /* sudah berhenti */ }
  }

  playSFX(id, { volume = 1, rate = 1, delay = 0 } = {}) {
    if (!this.ctx || !this.buffers[id]) return null;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[id];
    src.playbackRate.value = rate;
    const g = this.ctx.createGain(); g.gain.value = volume;
    src.connect(g); g.connect(this.sfxGain);
    src.start(this.ctx.currentTime + delay);
    return src;
  }
  playLoop(id, { volume = 0.5, fade = 0.6 } = {}) {
    if (!this.ctx || !this.buffers[id] || this.loops[id]) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[id]; src.loop = true;
    const g = this.ctx.createGain(); g.gain.value = 0;
    src.connect(g); g.connect(this.sfxGain);
    src.start(0);
    g.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + fade);
    this.loops[id] = { src, g };
  }
  stopLoop(id, fade = 0.4) {
    const l = this.loops[id];
    if (!l || !this.ctx) return;
    delete this.loops[id];
    const t = this.ctx.currentTime;
    l.g.gain.cancelScheduledValues(t);
    l.g.gain.setValueAtTime(l.g.gain.value, t);
    l.g.gain.linearRampToValueAtTime(0, t + fade);
    try { l.src.stop(t + fade + 0.05); } catch (e) { /* sudah berhenti */ }
  }
  stopAllLoops(fade = 0.4) { Object.keys(this.loops).forEach(id => this.stopLoop(id, fade)); }
}
