/**
 * ブーストボタン — 画面右下に配置
 * 派手な炎グラデーション + パルスアニメ
 */
export class BoostButton {
  private button: HTMLButtonElement;
  private _pressed = false;

  get pressed(): boolean { return this._pressed; }

  constructor() {
    this.button = document.createElement('button');
    this.setupDOM();
    this.setupEvents();
  }

  private setupDOM(): void {
    const b = this.button;
    b.innerHTML = '🔥<br><span style="font-size:0.6em">BOOST</span>';
    b.style.cssText = `
      position: fixed;
      right: max(20px, env(safe-area-inset-right, 20px));
      bottom: max(30px, env(safe-area-inset-bottom, 30px));
      width: 110px;
      height: 110px;
      border-radius: 50%;
      border: 3px solid rgba(255, 200, 50, 0.8);
      background: linear-gradient(135deg, #FF4500, #FF6B00, #FFD700, #FF4500);
      background-size: 300% 300%;
      color: #fff;
      font-size: clamp(1.2rem, 4vmin, 1.6rem);
      font-weight: 900;
      line-height: 1.2;
      text-shadow: 0 0 8px rgba(255,100,0,0.8), 0 2px 4px rgba(0,0,0,0.5);
      box-shadow:
        0 0 20px rgba(255, 100, 0, 0.5),
        0 0 40px rgba(255, 150, 0, 0.3),
        inset 0 0 15px rgba(255, 200, 50, 0.3);
      cursor: pointer;
      z-index: 30;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      display: none;
      align-items: center;
      justify-content: center;
      animation: boostGlow 1.5s ease-in-out infinite, boostGradient 3s ease infinite;
      transition: transform 0.1s, box-shadow 0.1s;
    `;

    if (!document.getElementById('boost-btn-style')) {
      const style = document.createElement('style');
      style.id = 'boost-btn-style';
      style.textContent = `
        @keyframes boostGlow {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255,100,0,0.5), 0 0 40px rgba(255,150,0,0.3), inset 0 0 15px rgba(255,200,50,0.3); }
          50% { transform: scale(1.08); box-shadow: 0 0 30px rgba(255,100,0,0.7), 0 0 60px rgba(255,150,0,0.5), inset 0 0 20px rgba(255,200,50,0.5); }
        }
        @keyframes boostGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  private setupEvents(): void {
    const b = this.button;

    const onDown = (e: Event) => {
      e.preventDefault();
      this._pressed = true;
      b.style.transform = 'scale(1.15)';
      b.style.boxShadow = '0 0 40px rgba(255,100,0,0.9), 0 0 80px rgba(255,150,0,0.6), inset 0 0 25px rgba(255,200,50,0.6)';
    };

    const onUp = () => {
      this._pressed = false;
      b.style.transform = '';
      b.style.boxShadow = '';
    };

    b.addEventListener('touchstart', onDown, { passive: false });
    b.addEventListener('touchend', onUp);
    b.addEventListener('touchcancel', onUp);
    b.addEventListener('mousedown', onDown);
    b.addEventListener('mouseup', onUp);
    b.addEventListener('mouseleave', onUp);
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.button);
  }

  unmount(): void {
    this.button.remove();
  }

  show(): void {
    this.button.style.display = 'flex';
  }

  hide(): void {
    this.button.style.display = 'none';
  }
}
