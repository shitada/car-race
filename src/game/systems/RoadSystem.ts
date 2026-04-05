import * as THREE from 'three';
import {
  SCREEN_WIDTH, SCREEN_HEIGHT,
  ROAD_LEFT, ROAD_RIGHT, LANE_WIDTH, LANE_COUNT,
  CURVE_WAVELENGTH,
} from '@/types/constants';
import type { RGB } from '@/types/constants';

const DASH_LENGTH = 30;
const DASH_GAP = 30;
const STRIP_HEIGHT = 8;

export function getCurveOffset(worldY: number, amplitude: number): number {
  if (amplitude <= 0) return 0;
  return amplitude * Math.sin((2 * Math.PI * worldY) / CURVE_WAVELENGTH);
}

export class RoadSystem {
  private scene: THREE.Scene;
  private grassMeshes: THREE.Mesh[] = [];
  private roadMeshes: THREE.Mesh[] = [];
  private lineMeshes: THREE.Mesh[] = [];
  private dashMeshes: THREE.Mesh[] = [];
  private curveAmplitude: number;
  private colorGrass: RGB;
  private colorRoad: RGB;

  // Pool for curved road strips
  private stripPool: THREE.Mesh[] = [];
  private activeStrips: THREE.Mesh[] = [];

  constructor(
    scene: THREE.Scene,
    colorGrass: RGB,
    colorRoad: RGB,
    curveAmplitude: number,
  ) {
    this.scene = scene;
    this.colorGrass = colorGrass;
    this.colorRoad = colorRoad;
    this.curveAmplitude = curveAmplitude;
  }

  update(cameraBottom: number): void {
    // Remove old meshes
    this.clearMeshes();

    const top = cameraBottom + SCREEN_HEIGHT + 100;

    if (this.curveAmplitude <= 0) {
      this.drawStraight(cameraBottom - 50, top);
    } else {
      this.drawCurved(cameraBottom - 50, top);
    }
  }

  private clearMeshes(): void {
    for (const m of this.activeStrips) {
      this.scene.remove(m);
      this.stripPool.push(m);
    }
    this.activeStrips = [];
    for (const m of [...this.grassMeshes, ...this.roadMeshes, ...this.lineMeshes, ...this.dashMeshes]) {
      this.scene.remove(m);
      m.geometry.dispose();
    }
    this.grassMeshes = [];
    this.roadMeshes = [];
    this.lineMeshes = [];
    this.dashMeshes = [];
  }

  private drawStraight(bottom: number, top: number): void {
    const height = top - bottom;
    const midY = (top + bottom) / 2;
    const g = this.colorGrass;
    const r = this.colorRoad;

    // Left grass
    this.addRect(ROAD_LEFT / 2, midY, ROAD_LEFT, height, g, this.grassMeshes);
    // Right grass
    const rightW = SCREEN_WIDTH - ROAD_RIGHT;
    this.addRect(ROAD_RIGHT + rightW / 2, midY, rightW, height, g, this.grassMeshes);
    // Road
    this.addRect((ROAD_LEFT + ROAD_RIGHT) / 2, midY, ROAD_RIGHT - ROAD_LEFT, height, r, this.roadMeshes);
    // Road edge lines
    this.addRect(ROAD_LEFT, midY, 4, height, [255, 255, 255], this.lineMeshes);
    this.addRect(ROAD_RIGHT, midY, 4, height, [255, 255, 255], this.lineMeshes);

    // Dashed lane lines
    const total = DASH_LENGTH + DASH_GAP;
    const startOffset = bottom - (bottom % total);
    for (let lane = 1; lane < LANE_COUNT; lane++) {
      const x = ROAD_LEFT + LANE_WIDTH * lane;
      let y = startOffset;
      while (y < top) {
        const y2 = Math.min(y + DASH_LENGTH, top);
        const dh = y2 - y;
        if (dh > 0) {
          this.addRect(x, y + dh / 2, 3, dh, [255, 255, 255], this.dashMeshes);
        }
        y += total;
      }
    }
  }

  private drawCurved(bottom: number, top: number): void {
    const g = this.colorGrass;

    // Full screen grass background
    const height = top - bottom;
    const midY = (top + bottom) / 2;
    this.addRect(SCREEN_WIDTH / 2, midY, SCREEN_WIDTH, height, g, this.grassMeshes);

    const r = this.colorRoad;
    const total = DASH_LENGTH + DASH_GAP;
    let y = bottom;

    while (y < top) {
      const y2 = Math.min(y + STRIP_HEIGHT, top);
      const midStripY = (y + y2) / 2;
      const off = getCurveOffset(midStripY, this.curveAmplitude);
      const left = ROAD_LEFT + off;
      const right = ROAD_RIGHT + off;
      const sh = y2 - y;

      // Road strip
      this.addStrip((left + right) / 2, midStripY, right - left, sh, r);
      // Edge lines
      this.addStrip(left, midStripY, 3, sh, [255, 255, 255]);
      this.addStrip(right, midStripY, 3, sh, [255, 255, 255]);

      // Dashed lane lines
      const phase = ((midStripY % total) + total) % total;
      if (phase < DASH_LENGTH) {
        for (let lane = 1; lane < LANE_COUNT; lane++) {
          const lx = left + LANE_WIDTH * lane;
          this.addStrip(lx, midStripY, 3, sh, [255, 255, 255]);
        }
      }

      y = y2;
    }
  }

  private addRect(x: number, y: number, w: number, h: number, color: readonly number[], list: THREE.Mesh[]): void {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color[0]! / 255, color[1]! / 255, color[2]! / 255),
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, -1);
    this.scene.add(mesh);
    list.push(mesh);
  }

  private addStrip(x: number, y: number, w: number, h: number, color: readonly number[]): void {
    let mesh = this.stripPool.pop();
    if (mesh) {
      (mesh.material as THREE.MeshBasicMaterial).color.setRGB(color[0]! / 255, color[1]! / 255, color[2]! / 255);
      mesh.scale.set(w, h, 1);
      mesh.position.set(x, y, -0.5);
    } else {
      const geo = new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color[0]! / 255, color[1]! / 255, color[2]! / 255),
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.scale.set(w, h, 1);
      mesh.position.set(x, y, -0.5);
    }
    this.scene.add(mesh);
    this.activeStrips.push(mesh);
  }

  dispose(): void {
    this.clearMeshes();
    for (const m of this.stripPool) {
      m.geometry.dispose();
      (m.material as THREE.MeshBasicMaterial).dispose();
    }
    this.stripPool = [];
  }
}
