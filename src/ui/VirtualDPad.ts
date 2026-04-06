/**
 * バーチャルジョイスティック（タッチ対応）
 * 画面左側に配置 — 左右移動用
 * kids-crane-catch の VirtualJoystick と同じスタイル
 */
export class VirtualDPad {
  private container: HTMLDivElement;
  private stick: HTMLDivElement;
  private active = false;
  private startX = 0;
  private maxDist = 40;

  /** -1〜1 のX方向入力 */
  x = 0;

  /** 左移動中か */
  get left(): boolean { return this.x < -0.25; }
  /** 右移動中か */
  get right(): boolean { return this.x > 0.25; }

  constructor() {
    this.container = document.createElement('div');
    this.stick = document.createElement('div');
    this.setupDOM();
    this.setupEvents();
  }

  private setupDOM(): void {
    const c = this.container;
    c.style.cssText = `
      position: fixed;
      left: max(20px, env(safe-area-inset-left, 20px));
      bottom: max(30px, env(safe-area-inset-bottom, 30px));
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(255,255,255,0.12);
      border: 2px solid rgba(255,255,255,0.25);
      z-index: 30;
      touch-action: none;
      display: none;
      align-items: center;
      justify-content: center;
    `;

    // Direction arrows
    const arrowLeft = document.createElement('div');
    arrowLeft.style.cssText = `
      position: absolute; left: 8px; top: 50%; transform: translateY(-50%);
      width: 0; height: 0;
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-right: 14px solid rgba(255,255,255,0.3);
      pointer-events: none;
    `;
    const arrowRight = document.createElement('div');
    arrowRight.style.cssText = `
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      width: 0; height: 0;
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-left: 14px solid rgba(255,255,255,0.3);
      pointer-events: none;
    `;
    c.appendChild(arrowLeft);
    c.appendChild(arrowRight);

    const s = this.stick;
    s.style.cssText = `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF6B6B, #FFD93D);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: transform 0.05s;
      pointer-events: none;
      z-index: 1;
    `;

    c.appendChild(s);
  }

  private setupEvents(): void {
    const c = this.container;

    const onStart = (cx: number, _cy: number) => {
      this.active = true;
      const rect = c.getBoundingClientRect();
      this.startX = rect.left + rect.width / 2;
      this.handleMove(cx, _cy);
    };

    const onMove = (cx: number, cy: number) => {
      if (!this.active) return;
      this.handleMove(cx, cy);
    };

    const onEnd = () => {
      this.active = false;
      this.x = 0;
      this.stick.style.transform = 'translate(0, 0)';
    };

    c.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) onStart(t.clientX, t.clientY);
    }, { passive: false });

    c.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    }, { passive: false });

    c.addEventListener('touchend', onEnd);
    c.addEventListener('touchcancel', onEnd);

    // Mouse fallback
    c.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEnd);
  }

  private handleMove(cx: number, _cy: number): void {
    let dx = cx - this.startX;
    if (Math.abs(dx) > this.maxDist) {
      dx = Math.sign(dx) * this.maxDist;
    }
    this.x = dx / this.maxDist;
    // Only horizontal movement for this game
    this.stick.style.transform = `translate(${dx}px, 0)`;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }

  show(): void {
    this.container.style.display = 'flex';
  }

  hide(): void {
    this.container.style.display = 'none';
  }
}
