import * as THREE from 'three';
import { SCREEN_HEIGHT, LANE_CENTERS } from '@/types/constants';
import { getCurveOffset } from '@/game/systems/RoadSystem';
import { Obstacle, HoleObstacle } from '@/game/entities/Obstacle';
import { Item } from '@/game/entities/Item';
import type { StageConfig } from '@/types';

export class SpawnSystem {
  private scene: THREE.Scene;
  private config: StageConfig;

  private obstacleTimer = 0;
  private itemTimer = 0;

  obstacles: (Obstacle | HoleObstacle)[] = [];
  items: Item[] = [];

  constructor(scene: THREE.Scene, config: StageConfig) {
    this.scene = scene;
    this.config = config;
  }

  update(dt: number, scrollY: number): void {
    this.spawnObstacles(dt, scrollY);
    this.spawnItems(dt, scrollY);
    this.cleanupOffscreen(scrollY);
  }

  private spawnObstacles(dt: number, scrollY: number): void {
    this.obstacleTimer += dt;
    if (this.obstacleTimer < this.config.obstacleInterval) return;
    this.obstacleTimer = 0;

    const spawnY = scrollY + SCREEN_HEIGHT + 100;
    const curveOff = getCurveOffset(spawnY, this.config.roadCurve);

    const count = 1 + Math.floor(Math.random() * this.config.obstacleMaxPerRow);
    const available = [...Array(LANE_CENTERS.length).keys()];
    // Shuffle and pick
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j]!, available[i]!];
    }
    const lanes = available.slice(0, Math.min(count, LANE_CENTERS.length));

    for (const li of lanes) {
      const x = LANE_CENTERS[li]! + curveOff;
      let obs: Obstacle | HoleObstacle;
      if (Math.random() < this.config.holeRatio) {
        obs = new HoleObstacle(x, spawnY);
      } else {
        obs = new Obstacle(x, spawnY);
      }
      this.scene.add(obs.mesh);
      this.obstacles.push(obs);
    }
  }

  private spawnItems(dt: number, scrollY: number): void {
    this.itemTimer += dt;
    if (this.itemTimer < this.config.itemInterval) return;
    this.itemTimer = 0;

    const spawnY = scrollY + SCREEN_HEIGHT + 100;
    const curveOff = getCurveOffset(spawnY, this.config.roadCurve);
    const lane = LANE_CENTERS[Math.floor(Math.random() * LANE_CENTERS.length)]!;
    const x = lane + curveOff;

    const type = Math.random() < 0.35 ? 'invincible' as const : 'heal' as const;
    const item = new Item(x, spawnY, type);
    this.scene.add(item.mesh);
    this.items.push(item);
  }

  private cleanupOffscreen(scrollY: number): void {
    const bottom = scrollY - 100;

    this.obstacles = this.obstacles.filter((o) => {
      if (o.y < bottom) {
        this.scene.remove(o.mesh);
        o.mesh.geometry.dispose();
        return false;
      }
      return true;
    });

    this.items = this.items.filter((i) => {
      if (i.y < bottom) {
        this.scene.remove(i.mesh);
        i.mesh.geometry.dispose();
        return false;
      }
      return true;
    });
  }

  removeObstacle(obs: Obstacle | HoleObstacle): void {
    this.scene.remove(obs.mesh);
    obs.mesh.geometry.dispose();
    this.obstacles = this.obstacles.filter((o) => o !== obs);
  }

  removeItem(item: Item): void {
    this.scene.remove(item.mesh);
    item.mesh.geometry.dispose();
    this.items = this.items.filter((i) => i !== item);
  }

  dispose(): void {
    for (const o of this.obstacles) {
      this.scene.remove(o.mesh);
      o.mesh.geometry.dispose();
    }
    this.obstacles = [];
    for (const i of this.items) {
      this.scene.remove(i.mesh);
      i.mesh.geometry.dispose();
    }
    this.items = [];
  }
}
