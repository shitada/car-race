import type * as THREE from 'three';

export interface Scene {
  enter(context: SceneContext): void;
  update(deltaTime: number): void;
  exit(): void;
  getThreeScene(): THREE.Scene;
  getCamera(): THREE.Camera;
}

export interface SceneContext {
  stageIndex?: number;
  elapsedTime?: number;
  isGameOver?: boolean;
}

export interface StageConfig {
  name: string;
  scrollSpeed: number;
  obstacleInterval: number;
  obstacleMaxPerRow: number;
  itemInterval: number;
  colorGrass: readonly [number, number, number];
  colorRoad: readonly [number, number, number];
  colorBg: readonly [number, number, number];
  roadCurve: number;
  holeRatio: number;
}

export interface GameEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  mesh: THREE.Mesh;
}

export type SceneName = 'title' | 'stage' | 'result';
