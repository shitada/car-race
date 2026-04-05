export class GameLoop {
  private animationId = 0;
  private lastTime = 0;
  private running = false;
  private onUpdate: (dt: number) => void;
  private onRender: () => void;

  constructor(onUpdate: (dt: number) => void, onRender: () => void) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.handleVisibility = this.handleVisibility.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  private tick(now: number): void {
    if (!this.running) return;
    this.animationId = requestAnimationFrame((t) => this.tick(t));

    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Cap delta to prevent spiral of death
    if (dt > 0.1) dt = 0.1;

    this.onUpdate(dt);
    this.onRender();
  }

  private handleVisibility(): void {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  }

  dispose(): void {
    this.stop();
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }
}
