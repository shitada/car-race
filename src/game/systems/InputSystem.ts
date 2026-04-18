import type { VirtualDPad } from '@/ui/VirtualDPad';
import type { BoostButton } from '@/ui/BoostButton';

export interface InputState {
  left: boolean;
  right: boolean;
  accelerating: boolean;
  braking: boolean;
  enter: boolean;
  escape: boolean;
}

export class InputSystem {
  private state: InputState = {
    left: false,
    right: false,
    accelerating: false,
    braking: false,
    enter: false,
    escape: false,
  };

  private touchIds = new Map<number, 'left' | 'right' | 'accel'>();
  private canvas: HTMLCanvasElement;

  // Virtual controls (iPad)
  private dpad: VirtualDPad | null = null;
  private boostBtn: BoostButton | null = null;

  // One-shot flags: consumed after read
  private enterPressed = false;
  private escapePressed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('contextmenu', this.onContextMenu);
  }

  setCanvasWidth(_w: number): void {
    // reserved for future use
  }

  setVirtualControls(dpad: VirtualDPad, boostBtn: BoostButton): void {
    this.dpad = dpad;
    this.boostBtn = boostBtn;
  }

  getState(): Readonly<InputState> {
    if (this.dpad || this.boostBtn) {
      // Return a merged copy without mutating keyboard state
      return {
        left: this.state.left || (this.dpad?.left ?? false),
        right: this.state.right || (this.dpad?.right ?? false),
        accelerating: this.state.accelerating || (this.boostBtn?.pressed ?? false),
        braking: this.state.braking,
        enter: this.state.enter,
        escape: this.state.escape,
      };
    }
    return this.state;
  }

  consumeEnter(): boolean {
    if (this.enterPressed) {
      this.enterPressed = false;
      return true;
    }
    return false;
  }

  consumeEscape(): boolean {
    if (this.escapePressed) {
      this.escapePressed = false;
      return true;
    }
    return false;
  }

  // Track left/right key one-shot for menu navigation
  private leftPressed = false;
  private rightPressed = false;

  consumeLeft(): boolean {
    if (this.leftPressed) {
      this.leftPressed = false;
      return true;
    }
    return false;
  }

  consumeRight(): boolean {
    if (this.rightPressed) {
      this.rightPressed = false;
      return true;
    }
    return false;
  }

  // Track tap for menu
  private tapped = false;
  private spacePressed = false;
  consumeTap(): boolean {
    if (this.tapped) {
      this.tapped = false;
      return true;
    }
    return false;
  }

  consumeSpace(): boolean {
    if (this.spacePressed) {
      this.spacePressed = false;
      return true;
    }
    return false;
  }

  private onKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
        this.state.left = true;
        this.leftPressed = true;
        break;
      case 'ArrowRight':
        this.state.right = true;
        this.rightPressed = true;
        break;
      case 'ArrowDown':
        this.state.braking = true;
        break;
      case 'Space':
        this.state.accelerating = true;
        this.spacePressed = true;
        break;
      case 'Enter':
        this.enterPressed = true;
        break;
      case 'Escape':
        this.escapePressed = true;
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
        this.state.left = false;
        break;
      case 'ArrowRight':
        this.state.right = false;
        break;
      case 'ArrowDown':
        this.state.braking = false;
        break;
      case 'Space':
        this.state.accelerating = false;
        break;
    }
  }

  private onPointerDown(e: PointerEvent): void {
    // Skip canvas zone splitting when virtual controls are active
    if (this.dpad) {
      this.tapped = true;
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relX = x / rect.width;

    // Left 30% = move left, Right 30% = move right, center = accelerate
    if (relX < 0.3) {
      this.touchIds.set(e.pointerId, 'left');
      this.state.left = true;
      this.leftPressed = true;
    } else if (relX > 0.7) {
      this.touchIds.set(e.pointerId, 'right');
      this.state.right = true;
      this.rightPressed = true;
    } else {
      this.touchIds.set(e.pointerId, 'accel');
      this.state.accelerating = true;
    }
    this.tapped = true;
  }

  private onPointerUp(e: PointerEvent): void {
    const role = this.touchIds.get(e.pointerId);
    this.touchIds.delete(e.pointerId);
    if (role === 'left') {
      // Check if any other pointer is still left
      if (!this.hasRole('left')) this.state.left = false;
    } else if (role === 'right') {
      if (!this.hasRole('right')) this.state.right = false;
    } else if (role === 'accel') {
      if (!this.hasRole('accel')) this.state.accelerating = false;
    }
  }

  private hasRole(role: string): boolean {
    for (const r of this.touchIds.values()) {
      if (r === role) return true;
    }
    return false;
  }

  private onContextMenu(e: Event): void {
    e.preventDefault();
  }

  reset(): void {
    this.state.left = false;
    this.state.right = false;
    this.state.accelerating = false;
    this.state.braking = false;
    this.enterPressed = false;
    this.escapePressed = false;
    this.leftPressed = false;
    this.rightPressed = false;
    this.tapped = false;
    this.spacePressed = false;
    this.touchIds.clear();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
  }
}
