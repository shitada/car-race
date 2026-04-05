import * as THREE from 'three';
import type { Scene, SceneContext } from '@/types';
import {
  SCREEN_WIDTH, SCREEN_HEIGHT,
  ROAD_LEFT, ROAD_RIGHT, PLAYER_START_Y, GOAL_TIME,
  INVINCIBLE_BGM_EARLY_END, COLOR_GOAL,
} from '@/types/constants';
import { STAGES } from '@/game/config/StageConfig';
import type { StageConfig } from '@/types';
import { RoadSystem, getCurveOffset } from '@/game/systems/RoadSystem';
import { Player } from '@/game/entities/Player';
import { SpawnSystem } from '@/game/systems/SpawnSystem';
import { checkCollisions } from '@/game/systems/CollisionSystem';
import { FlameEffect } from '@/game/effects/FlameEffect';
import type { InputSystem } from '@/game/systems/InputSystem';
import type { AudioManager } from '@/game/audio/AudioManager';
import type { SceneManager } from '@/game/SceneManager';
import type { HUD } from '@/ui/HUD';

export class StageScene implements Scene {
  private threeScene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private input: InputSystem;
  private audio: AudioManager;
  private sceneManager: SceneManager;
  private hud: HUD;

  private stageIndex = 0;
  private config!: StageConfig;
  private player!: Player;
  private road!: RoadSystem;
  private spawnSystem!: SpawnSystem;
  private flameEffect!: FlameEffect;

  private scrollY = 0;
  private stageLength = 0;
  private elapsedTime = 0;
  private currentSpeed = 0;
  private gameOver = false;
  private gameClear = false;

  // Goal mesh
  private goalMesh!: THREE.Mesh;
  private goalTextCanvas!: HTMLCanvasElement;
  private goalTextMesh!: THREE.Mesh;

  // Invincible BGM state
  private invincibleBgmActive = false;

  constructor(input: InputSystem, audio: AudioManager, sceneManager: SceneManager, hud: HUD) {
    this.input = input;
    this.audio = audio;
    this.sceneManager = sceneManager;
    this.hud = hud;
  }

  enter(context: SceneContext): void {
    this.stageIndex = context.stageIndex ?? 0;
    this.config = STAGES[this.stageIndex]!;

    this.threeScene = new THREE.Scene();
    const bg = this.config.colorBg;
    this.threeScene.background = new THREE.Color(bg[0] / 255, bg[1] / 255, bg[2] / 255);

    this.camera = new THREE.OrthographicCamera(0, SCREEN_WIDTH, SCREEN_HEIGHT, 0, -10, 100);

    // Reset state
    this.scrollY = 0;
    this.elapsedTime = 0;
    this.currentSpeed = this.config.scrollSpeed;
    this.gameOver = false;
    this.gameClear = false;
    this.invincibleBgmActive = false;

    this.stageLength = this.config.scrollSpeed * GOAL_TIME;

    // Player
    this.player = new Player();
    this.threeScene.add(this.player.mesh);

    // Road
    this.road = new RoadSystem(
      this.threeScene,
      this.config.colorGrass,
      this.config.colorRoad,
      this.config.roadCurve,
    );

    // Spawn system
    this.spawnSystem = new SpawnSystem(this.threeScene, this.config);

    // Flame effect
    this.flameEffect = new FlameEffect(this.threeScene);

    // Goal line
    this.createGoal();

    // Input
    this.input.reset();

    // Audio
    this.audio.resume();
    this.audio.playBGM();
  }

  update(dt: number): void {
    if (this.gameOver || this.gameClear) return;

    // ESC → title
    if (this.input.consumeEscape()) {
      this.audio.stopAll();
      this.sceneManager.transition('title');
      return;
    }

    this.elapsedTime += dt;

    // Map input to player
    const inputState = this.input.getState();
    this.player.movingLeft = inputState.left;
    this.player.movingRight = inputState.right;
    this.player.isAccelerating = inputState.accelerating;
    this.player.isBraking = inputState.braking;

    // Player update
    this.player.update(dt);

    // Engine sound
    this.audio.updateEngine(this.player.accelBonus);

    // Invincible BGM
    this.updateInvincibleBGM();

    // Scroll
    const speed = this.config.scrollSpeed * this.player.speedMultiplier;
    this.currentSpeed = speed;
    this.scrollY += speed * dt;

    // Player Y follows scroll
    this.player.y = this.scrollY + PLAYER_START_Y;

    // Clamp player to road (with curve offset)
    const curveOff = getCurveOffset(this.player.y, this.config.roadCurve);
    const halfW = this.player.width / 2;
    const clampLeft = ROAD_LEFT + curveOff + halfW;
    const clampRight = ROAD_RIGHT + curveOff - halfW;
    this.player.x = Math.max(clampLeft, Math.min(clampRight, this.player.x));
    this.player.mesh.position.set(this.player.x, this.player.y, 0);

    // Camera
    const camY = this.scrollY + SCREEN_HEIGHT / 2;
    this.camera.top = camY + SCREEN_HEIGHT / 2;
    this.camera.bottom = camY - SCREEN_HEIGHT / 2;
    this.camera.left = 0;
    this.camera.right = SCREEN_WIDTH;
    this.camera.updateProjectionMatrix();

    // Road
    this.road.update(this.scrollY);

    // Spawn
    this.spawnSystem.update(dt, this.scrollY);

    // Flame
    this.flameEffect.update(dt, this.player.x, this.player.y, this.player.isBoosting);

    // Collisions
    const collisions = checkCollisions(
      this.player,
      this.spawnSystem.obstacles,
      this.spawnSystem.items,
    );

    for (const obs of collisions.hitObstacles) {
      if (!this.player.isInvincible) {
        this.audio.playHit();
      }
      this.player.takeDamage();
      this.spawnSystem.removeObstacle(obs);
    }

    for (const item of collisions.hitItems) {
      this.audio.playItem();
      if (item.type === 'invincible') {
        this.player.activateInvincible();
      } else {
        this.player.heal();
      }
      this.spawnSystem.removeItem(item);
    }

    // Goal check
    if (this.scrollY >= this.stageLength) {
      this.gameClear = true;
      this.audio.stopAll();
      this.audio.playGoal();
      this.sceneManager.transition('result', {
        stageIndex: this.stageIndex,
        elapsedTime: this.elapsedTime,
        isGameOver: false,
      });
      return;
    }

    // Game over check
    if (this.player.hp <= 0) {
      this.gameOver = true;
      this.audio.stopAll();
      this.audio.playGameover();
      this.sceneManager.transition('result', {
        stageIndex: this.stageIndex,
        elapsedTime: this.elapsedTime,
        isGameOver: true,
      });
      return;
    }

    // Update HUD
    this.hud.draw({
      hp: this.player.hp,
      scrollY: this.scrollY,
      stageLength: this.stageLength,
      accelBonus: this.player.accelBonus,
      elapsedTime: this.elapsedTime,
      currentSpeed: this.currentSpeed,
      stageName: this.config.name,
      stageIndex: this.stageIndex,
      isItemInvincible: this.player.isItemInvincible,
    });
  }

  exit(): void {
    this.road?.dispose();
    this.spawnSystem?.dispose();
    this.flameEffect?.dispose();
    this.audio.stopAll();
  }

  getThreeScene(): THREE.Scene { return this.threeScene; }
  getCamera(): THREE.Camera { return this.camera; }

  private createGoal(): void {
    const goalY = this.stageLength + PLAYER_START_Y;
    const w = ROAD_RIGHT - ROAD_LEFT;

    const geo = new THREE.PlaneGeometry(w, 20);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(COLOR_GOAL[0] / 255, COLOR_GOAL[1] / 255, COLOR_GOAL[2] / 255),
    });
    this.goalMesh = new THREE.Mesh(geo, mat);
    this.goalMesh.position.set((ROAD_LEFT + ROAD_RIGHT) / 2, goalY, 2);
    this.threeScene.add(this.goalMesh);

    // Goal text
    this.goalTextCanvas = document.createElement('canvas');
    this.goalTextCanvas.width = 256;
    this.goalTextCanvas.height = 64;
    const ctx = this.goalTextCanvas.getContext('2d')!;
    ctx.fillStyle = 'rgb(255, 215, 0)';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GOAL!', 128, 32);

    const tex = new THREE.CanvasTexture(this.goalTextCanvas);
    const textGeo = new THREE.PlaneGeometry(128, 32);
    const textMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    this.goalTextMesh = new THREE.Mesh(textGeo, textMat);
    this.goalTextMesh.position.set((ROAD_LEFT + ROAD_RIGHT) / 2, goalY + 30, 3);
    this.threeScene.add(this.goalTextMesh);
  }

  private updateInvincibleBGM(): void {
    const timer = this.player.invincibleItemTimer;

    if (timer > INVINCIBLE_BGM_EARLY_END && !this.invincibleBgmActive) {
      this.audio.pauseBGM();
      this.audio.playInvincibleBGM();
      this.invincibleBgmActive = true;
    } else if (timer <= INVINCIBLE_BGM_EARLY_END && this.invincibleBgmActive) {
      this.audio.stopInvincibleBGM();
      this.audio.resumeBGM();
      this.invincibleBgmActive = false;
    }
  }
}
