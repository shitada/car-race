import * as THREE from 'three';
import type { Scene, SceneContext } from '@/types';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '@/types/constants';
import { STAGES } from '@/game/config/StageConfig';
import type { InputSystem } from '@/game/systems/InputSystem';
import type { AudioManager } from '@/game/audio/AudioManager';
import type { SceneManager } from '@/game/SceneManager';

export class TitleScene implements Scene {
  private threeScene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private input: InputSystem;
  private audio: AudioManager;
  private sceneManager: SceneManager;
  private selectedStage = 0;
  private maxUnlocked: number;

  // Text sprites
  private textCanvas: HTMLCanvasElement;
  private textCtx: CanvasRenderingContext2D;
  private textTexture: THREE.CanvasTexture;
  private textMesh: THREE.Mesh;

  constructor(input: InputSystem, audio: AudioManager, sceneManager: SceneManager, maxUnlocked: number) {
    this.input = input;
    this.audio = audio;
    this.sceneManager = sceneManager;
    this.maxUnlocked = maxUnlocked;

    this.threeScene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, SCREEN_WIDTH, SCREEN_HEIGHT, 0, -10, 10);

    // Create a canvas texture for all text rendering
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

  updateMaxUnlocked(n: number): void {
    this.maxUnlocked = n;
  }

  enter(_context: SceneContext): void {
    this.threeScene.background = new THREE.Color(30 / 255, 30 / 255, 60 / 255);
    this.input.reset();
    this.audio.resume();
    this.audio.playTitleBGM();
    this.renderText();
  }

  update(_dt: number): void {
    // Handle input
    if (this.input.consumeLeft()) {
      this.selectedStage = Math.max(0, this.selectedStage - 1);
      this.renderText();
    }
    if (this.input.consumeRight()) {
      this.selectedStage = Math.min(Math.min(this.maxUnlocked, STAGES.length - 1), this.selectedStage + 1);
      this.renderText();
    }
    if (this.input.consumeEnter() || this.input.consumeSpace() || this.input.consumeTap()) {
      this.audio.stopAll();
      this.sceneManager.transition('stage', { stageIndex: this.selectedStage });
    }
  }

  exit(): void {
    this.audio.stopAll();
  }

  getThreeScene(): THREE.Scene { return this.threeScene; }
  getCamera(): THREE.Camera { return this.camera; }

  private renderText(): void {
    const ctx = this.textCtx;
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    const cx = SCREEN_WIDTH / 2;

    // Title
    ctx.fillStyle = 'rgb(255, 220, 50)';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('カーレース！', cx, 100);

    ctx.fillStyle = 'rgb(200, 200, 200)';
    ctx.font = '18px sans-serif';
    ctx.fillText('〜障害物をよけろ〜', cx, 135);

    // Car illustration
    const carY = 220;
    ctx.fillStyle = 'rgb(30, 120, 255)';
    ctx.fillRect(cx - 30, carY - 40, 60, 80);
    ctx.fillStyle = 'rgb(180, 220, 255)';
    ctx.fillRect(cx - 15, carY - 20, 30, 20);
    // Tires
    ctx.fillStyle = 'rgb(40, 40, 40)';
    for (const dx of [-32, 26]) {
      for (const dy of [-30, 20]) {
        ctx.fillRect(cx + dx, carY + dy, 8, 14);
      }
    }

    // Stage select hint
    ctx.fillStyle = 'rgb(180, 180, 180)';
    ctx.font = '14px sans-serif';
    ctx.fillText('← → でステージ選択', cx, 380);

    // Stage info
    const stage = STAGES[this.selectedStage]!;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`Stage ${this.selectedStage + 1}`, cx, 420);

    ctx.fillStyle = 'rgb(255, 255, 100)';
    ctx.font = '18px sans-serif';
    ctx.fillText(stage.name, cx, 450);

    // Start button
    ctx.fillStyle = 'rgb(50, 180, 50)';
    ctx.fillRect(cx - 100, 520, 200, 50);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 100, 520, 200, 50);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('ENTER / クリックでスタート', cx, 550);

    // Controls
    ctx.fillStyle = 'rgb(140, 140, 140)';
    ctx.font = '12px sans-serif';
    ctx.fillText('←→ 移動 / SPACE長押し 加速 / ↓ ブレーキ', cx, 620);
    ctx.fillText('タッチ: 左右で移動 / 中央で加速', cx, 640);

    this.textTexture.needsUpdate = true;
  }
}
