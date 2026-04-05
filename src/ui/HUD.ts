import {
  SCREEN_WIDTH, SCREEN_HEIGHT,
  MAX_HP, PX_PER_KMH,
  COLOR_HP_FULL, COLOR_HP_EMPTY,
} from '@/types/constants';

export class HUD {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  resize(displayWidth: number, displayHeight: number): void {
    this.canvas.width = SCREEN_WIDTH;
    this.canvas.height = SCREEN_HEIGHT;
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;
  }

  draw(state: {
    hp: number;
    scrollY: number;
    stageLength: number;
    accelBonus: number;
    elapsedTime: number;
    currentSpeed: number;
    stageName: string;
    stageIndex: number;
    isItemInvincible: boolean;
  }): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    this.drawHP(ctx, state.hp);
    this.drawProgressBar(ctx, state.scrollY, state.stageLength);
    this.drawAccelBar(ctx, state.accelBonus);
    this.drawStageLabel(ctx, state.stageIndex, state.stageName);
    this.drawTime(ctx, state.elapsedTime);
    this.drawSpeedMeter(ctx, state.currentSpeed);

    if (state.isItemInvincible) {
      this.drawMuteki(ctx);
    }
  }

  private drawHP(ctx: CanvasRenderingContext2D, hp: number): void {
    for (let i = 0; i < MAX_HP; i++) {
      const x = 30 + i * 35;
      const y = 30;
      const color = i < hp ? COLOR_HP_FULL : COLOR_HP_EMPTY;
      ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      // Heart shape
      this.drawHeart(ctx, x, y, 12);
    }
  }

  private drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.4);
    ctx.bezierCurveTo(cx - size, cy - size * 0.3, cx - size * 0.5, cy - size, cx, cy - size * 0.4);
    ctx.bezierCurveTo(cx + size * 0.5, cy - size, cx + size, cy - size * 0.3, cx, cy + size * 0.4);
    ctx.fill();
  }

  private drawProgressBar(ctx: CanvasRenderingContext2D, scrollY: number, stageLength: number): void {
    const barX = SCREEN_WIDTH - 30;
    const barBottom = 60;
    const barHeight = SCREEN_HEIGHT - 120;
    const barWidth = 14;

    // Background
    ctx.fillStyle = 'rgb(60, 60, 60)';
    ctx.fillRect(barX - barWidth / 2, barBottom, barWidth, barHeight);

    // Progress fill
    const progress = Math.min(scrollY / stageLength, 1.0);
    const fillH = barHeight * progress;
    ctx.fillStyle = 'rgb(50, 200, 50)';
    ctx.fillRect(barX - barWidth / 2, barBottom + barHeight - fillH, barWidth, fillH);

    // Car icon
    const iconY = barBottom + barHeight - fillH;
    ctx.fillStyle = 'rgb(30, 120, 255)';
    ctx.fillRect(barX - 6, iconY - 5, 12, 10);

    // GOAL label
    ctx.fillStyle = 'rgb(255, 215, 0)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('G', barX, barBottom - 5);
  }

  private drawAccelBar(ctx: CanvasRenderingContext2D, accelBonus: number): void {
    const barW = 80;
    const ratio = Math.min(accelBonus / 3.0, 1.0);

    ctx.fillStyle = 'rgb(60, 60, 60)';
    ctx.fillRect(20, SCREEN_HEIGHT - 40, barW, 10);

    const r = Math.floor(50 + 205 * ratio);
    const g = Math.floor(200 * (1 - ratio));
    ctx.fillStyle = `rgb(${r}, ${g}, 50)`;
    ctx.fillRect(20, SCREEN_HEIGHT - 40, barW * ratio, 10);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ACCEL', 60, SCREEN_HEIGHT - 22);
  }

  private drawStageLabel(ctx: CanvasRenderingContext2D, stageIndex: number, stageName: string): void {
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Stage ${stageIndex + 1}: ${stageName}`, SCREEN_WIDTH / 2, 20);
  }

  private drawTime(ctx: CanvasRenderingContext2D, elapsed: number): void {
    const mins = Math.floor(elapsed) / 60 | 0;
    const secs = Math.floor(elapsed) % 60;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, SCREEN_WIDTH / 2, 45);
  }

  private drawSpeedMeter(ctx: CanvasRenderingContext2D, speed: number): void {
    const kmh = Math.floor(speed / PX_PER_KMH);
    const mx = SCREEN_WIDTH / 2;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(mx - 60, SCREEN_HEIGHT - 68, 120, 30);
    ctx.strokeStyle = 'rgb(200, 200, 200)';
    ctx.lineWidth = 2;
    ctx.strokeRect(mx - 60, SCREEN_HEIGHT - 68, 120, 30);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${kmh} km/h`, mx, SCREEN_HEIGHT - 46);
  }

  private drawMuteki(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgb(255, 100, 255)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ MUTEKI! ★', SCREEN_WIDTH / 2, 70);
  }
}
