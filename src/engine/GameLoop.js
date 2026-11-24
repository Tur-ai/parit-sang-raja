// Loop berbasis requestAnimationFrame dengan deltaTime stabil (di-clamp agar tidak melompat saat tab di-background).
export class GameLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.last = 0;
    this.maxDt = 1 / 20;
    this.time = 0;
    this._tick = this._tick.bind(this);
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._tick);
  }
  stop() { this.running = false; }
  _tick(now) {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (!(dt > 0)) dt = 1 / 60;
    dt = Math.min(dt, this.maxDt);
    this.time += dt;
    this.update(dt, this.time);
    this.render();
    requestAnimationFrame(this._tick);
  }
}
