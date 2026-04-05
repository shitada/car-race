import * as THREE from 'three';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '@/types/constants';
import { GameLoop } from '@/game/GameLoop';
import { SceneManager } from '@/game/SceneManager';
import { InputSystem } from '@/game/systems/InputSystem';
import { AudioManager } from '@/game/audio/AudioManager';
import { SaveManager } from '@/game/storage/SaveManager';
import { HUD } from '@/ui/HUD';
import { TitleScene } from '@/game/scenes/TitleScene';
import { StageScene } from '@/game/scenes/StageScene';
import { ResultScene } from '@/game/scenes/ResultScene';

// ── Canvas setup ──
const gameCanvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const hudCanvas = document.getElementById('hud-canvas') as HTMLCanvasElement;

// ── Three.js renderer ──
const renderer = new THREE.WebGLRenderer({
  canvas: gameCanvas,
  antialias: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ── Managers ──
const inputSystem = new InputSystem(gameCanvas);
const audioManager = new AudioManager();
const saveManager = new SaveManager();
const sceneManager = new SceneManager();
const hud = new HUD(hudCanvas);

// ── Scenes ──
const titleScene = new TitleScene(inputSystem, audioManager, sceneManager, saveManager.getMaxUnlockedStage());
const stageScene = new StageScene(inputSystem, audioManager, sceneManager, hud);
const resultScene = new ResultScene(inputSystem, audioManager, sceneManager, saveManager);

sceneManager.register('title', titleScene);
sceneManager.register('stage', stageScene);
sceneManager.register('result', resultScene);

// ── Resize handler ──
function resize(): void {
  const container = document.getElementById('game-container')!;
  const containerW = container.clientWidth;
  const containerH = container.clientHeight;

  // Maintain aspect ratio 480:720 = 2:3
  const aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
  let displayW: number;
  let displayH: number;

  if (containerW / containerH > aspect) {
    displayH = containerH;
    displayW = containerH * aspect;
  } else {
    displayW = containerW;
    displayH = containerW / aspect;
  }

  renderer.setSize(displayW, displayH);
  gameCanvas.style.width = `${displayW}px`;
  gameCanvas.style.height = `${displayH}px`;

  hud.resize(displayW, displayH);
  inputSystem.setCanvasWidth(displayW);

  // Position HUD canvas to match game canvas
  const left = (containerW - displayW) / 2;
  const top = (containerH - displayH) / 2;
  hudCanvas.style.left = `${left}px`;
  hudCanvas.style.top = `${top}px`;
  gameCanvas.style.position = 'absolute';
  gameCanvas.style.left = `${left}px`;
  gameCanvas.style.top = `${top}px`;
}

window.addEventListener('resize', resize);
resize();

// ── Game loop ──
const gameLoop = new GameLoop(
  (dt) => sceneManager.update(dt),
  () => {
    const scene = sceneManager.getScene();
    const camera = sceneManager.getCamera();
    if (scene && camera) {
      renderer.render(scene, camera);
    }
  },
);

// ── Init & Start ──
async function init(): Promise<void> {
  await audioManager.init();

  // Update title scene maxUnlocked after save manager is ready
  titleScene.updateMaxUnlocked(saveManager.getMaxUnlockedStage());

  sceneManager.transition('title');
  gameLoop.start();
}

// Resume audio on first interaction
const resumeAudio = (): void => {
  audioManager.resume();
  document.removeEventListener('pointerdown', resumeAudio);
  document.removeEventListener('keydown', resumeAudio);
};
document.addEventListener('pointerdown', resumeAudio);
document.addEventListener('keydown', resumeAudio);

init();
