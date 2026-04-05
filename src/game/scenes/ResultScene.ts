import * as THREE from 'three';
import type { Scene, SceneContext } from '@/types';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '@/types/constants';
import { STAGES } from '@/game/config/StageConfig';
import type { InputSystem } from '@/game/systems/InputSystem';
import type { AudioManager } from '@/game/audio/AudioManager';
import type { SceneManager } from '@/game/SceneManager';
import type { SaveManager } from '@/game/storage/SaveManager';

export class ResultScene implements Scene {
  private threeScene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private input: InputSystem;
  private audio: AudioManager;
  private sceneManager: SceneManager;
  private saveManager: SaveManager;

  private textCanvas: HTMLCanvasElement;
  private textCtx: CanvasRenderingContext2D;
  private textTexture: THREE.CanvasTexture;
  private textMesh: THREE.Mesh;

  private stageIndex = 0;
  private elapsedTime = 0;
  private isGameOver = false;
  private ready = false;

  constructor(
    input: InputSystem,
    audio: AudioManager,
    sceneManager: SceneManager,
    saveManager: SaveManager,
  ) {
    this.input = input;
    this.audio = audio;
    this.sceneManager = sceneManager;
    this.saveManager = saveManager;

    this.threeScene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, SCREEN_WIDTH, SCREEN_HEIGHT, 0, -10, 10);

    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = SCREEN_WIDTH;
    this.textCanvas.height = SCREEN_HEIGHT;
    this.textCtx = this.textCanvas.getContext('2d')!;
    this.textTexture = new THREE.CanvasTexture(this.textCanvas);
    this.textTexture.magFilter = THREE.NearestFilter;

    const geo = new THREE.PlaneGeometry(SCREEN_WIDTH, SCREEN_HEIGHT);
    const mat = new THREE.MeshBasicMaterial({ map: this.textTexture, transparent: true });
    this.textMesh = new THREE.Mesh(geo, mat);
    this.textMesh.position.set(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 5);
    this.threeScene.add(this.textMesh);
  }

  enter(context: SceneContext): void {
    this.stageIndex = context.stageIndex ?? 0;
    this.elapsedTime = context.elapsedTime ?? 0;
    this.isGameOver = context.isGameOver ?? false;
    this.ready = false;
    this.input.reset();

    if (this.isGameOver) {
      this.threeScene.background = new THREE.Color(60 / 255, 10 / 255, 10 / 255);
      this.renderGameOver();
    } else {
      this.threeScene.background = new THREE.Color(20 / 255, 20 / 255, 80 / 255);
      this.renderClear();
    }

    // Prevent immediate input processing
    setTimeout(() => {
      this.input.reset();
      this.ready = true;
    }, 500);
  }

  update(_dt: number): void {
    if (!this.ready) return;

    if (this.input.consumeEscape()) {
      this.audio.stopAll();
      this.sceneManager.transition('title');
      return;
    }

    if (this.input.consumeEnter() || this.input.consumeSpace() || this.input.consumeTap()) {
      if (this.isGameOver) {
        // Retry
        this.sceneManager.transition('stage', { stageIndex: this.stageIndex });
      } else {
        // Next stage or title
        if (this.stageIndex < STAGES.length - 1) {
          this.sceneManager.transition('stage', { stageIndex: this.stageIndex + 1 });
        } else {
          this.sceneManager.transition('title');
        }
      }
    }
  }

  exit(): void {
    this.audio.stopAll();
  }

  getThreeScene(): THREE.Scene { return this.threeScene; }
  getCamera(): THREE.Camera { return this.camera; }

  private renderGameOver(): void {
    const ctx = this.textCtx;
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    const cx = SCREEN_WIDTH / 2;
    const stage = STAGES[this.stageIndex]!;

    ctx.fillStyle = 'rgb(255, 60, 60)';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', cx, 200);

    ctx.fillStyle = 'rgb(180, 180, 180)';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Stage ${this.stageIndex + 1}: ${stage.name}`, cx, 260);

    // Retry button
    ctx.fillStyle = 'rgb(50, 120, 200)';
    ctx.fillRect(cx - 120, 370, 240, 50);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('SPACE: リトライ', cx, 400);

    // Title button
    ctx.fillStyle = 'rgb(100, 100, 100)';
    ctx.fillRect(cx - 120, 450, 240, 50);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('ESC: タイトルへ', cx, 480);

    this.textTexture.needsUpdate = true;
  }

  private renderClear(): void {
    const ctx = this.textCtx;
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    const cx = SCREEN_WIDTH / 2;
    const stage = STAGES[this.stageIndex]!;
    const isLast = this.stageIndex >= STAGES.length - 1;

    // Save score
    const { bestTime, isNewRecord } = this.saveManager.updateBestTime(this.stageIndex, this.elapsedTime);

    // Title
    if (isLast) {
      ctx.fillStyle = 'rgb(255, 215, 0)';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('全ステージクリア！！', cx, 100);
      ctx.fillStyle = '#fff';
      ctx.font = '22px sans-serif';
      ctx.fillText('おめでとう！！', cx, 140);
    } else {
      ctx.fillStyle = 'rgb(255, 215, 0)';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ゴール！！', cx, 100);
    }

    // Stage info
    ctx.fillStyle = 'rgb(200, 200, 200)';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Stage ${this.stageIndex + 1}: ${stage.name}`, cx, 195);

    // Time
    const mins = Math.floor(this.elapsedTime / 60);
    const secs = Math.floor(this.elapsedTime) % 60;
    const msec = Math.floor((this.elapsedTime % 1) * 100);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`タイム: ${mins}:${secs.toString().padStart(2, '0')}.${msec.toString().padStart(2, '0')}`, cx, 250);

    // Best time
    const bMins = Math.floor(bestTime / 60);
    const bSecs = Math.floor(bestTime) % 60;
    const bMsec = Math.floor((bestTime % 1) * 100);
    let bestStr = `ベスト: ${bMins}:${bSecs.toString().padStart(2, '0')}.${bMsec.toString().padStart(2, '0')}`;
    if (isNewRecord) bestStr += '  ★NEW RECORD!★';
    ctx.fillStyle = isNewRecord ? 'rgb(255, 200, 50)' : 'rgb(180, 180, 180)';
    ctx.font = isNewRecord ? 'bold 18px sans-serif' : '18px sans-serif';
    ctx.fillText(bestStr, cx, 290);

    // Stars
    let stars: string;
    if (this.elapsedTime < 180) stars = '★★★';
    else if (this.elapsedTime < 240) stars = '★★☆';
    else stars = '★☆☆';
    ctx.fillStyle = 'rgb(255, 220, 50)';
    ctx.font = '36px sans-serif';
    ctx.fillText(stars, cx, 340);

    // Next / Title buttons
    if (!isLast) {
      ctx.fillStyle = 'rgb(50, 150, 50)';
      ctx.fillRect(cx - 120, 430, 240, 50);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('SPACE: 次のステージへ', cx, 460);
    }

    ctx.fillStyle = 'rgb(100, 100, 100)';
    ctx.fillRect(cx - 120, 510, 240, 50);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('ESC: タイトルへ', cx, 540);

    this.textTexture.needsUpdate = true;
  }
}
