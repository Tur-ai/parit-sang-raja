// Ketukan global (ketuk layar = lanjut cerita). Tombol memanggil stopPropagation sehingga tidak ikut memicu ketukan layar.
export class Input {
  constructor(renderer, audio) {
    this.listeners = new Set();
    const stage = renderer.app.stage;
    stage.on('pointerdown', e => { audio.unlock(); this.emit(e); });
    window.addEventListener('keydown', e => {
      if (e.code === 'Space' || e.code === 'Enter') { audio.unlock(); e.preventDefault(); this.emit(null); }
    });
  }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(e) { for (const fn of [...this.listeners]) fn(e); }
}
