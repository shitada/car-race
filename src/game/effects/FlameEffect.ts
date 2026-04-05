import * as THREE from 'three';
import { PLAYER_HEIGHT } from '@/types/constants';

interface FlameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  colorIdx: number;
}

const FLAME_COLORS = [
  new THREE.Color(255 / 255, 220 / 255, 50 / 255),  // yellow
  new THREE.Color(255 / 255, 140 / 255, 20 / 255),  // orange
  new THREE.Color(255 / 255, 50 / 255, 20 / 255),   // red
];

export class FlameEffect {
  private scene: THREE.Scene;
  private particles: FlameParticle[] = [];
  private meshes: THREE.Mesh[] = [];
  private meshPool: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update(dt: number, playerX: number, playerY: number, isBoosting: boolean): void {
    // Spawn new particles
    if (isBoosting) {
      for (let i = 0; i < 4; i++) {
        this.particles.push({
          x: playerX + (Math.random() - 0.5) * 20,
          y: playerY - PLAYER_HEIGHT / 2,
          vx: (Math.random() - 0.5) * 60,
          vy: -(60 + Math.random() * 60),
          life: 0.15 + Math.random() * 0.2,
          size: 5 + Math.random() * 9,
          colorIdx: Math.floor(Math.random() * 3),
        });
      }
    }

    // Update existing
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      if (p.life <= 0) return false;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size *= 0.95;
      return true;
    });

    // Sync meshes
    this.syncMeshes();
  }

  private syncMeshes(): void {
    // Return excess meshes to pool
    while (this.meshes.length > this.particles.length) {
      const m = this.meshes.pop()!;
      this.scene.remove(m);
      this.meshPool.push(m);
    }

    // Create/reuse meshes
    while (this.meshes.length < this.particles.length) {
      let m = this.meshPool.pop();
      if (!m) {
        const geo = new THREE.CircleGeometry(1, 8);
        const mat = new THREE.MeshBasicMaterial({ transparent: true });
        m = new THREE.Mesh(geo, mat);
      }
      this.scene.add(m);
      this.meshes.push(m);
    }

    // Update positions and colors
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]!;
      const m = this.meshes[i]!;
      m.position.set(p.x, p.y, 0.8);
      m.scale.set(p.size, p.size, 1);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.color.copy(FLAME_COLORS[p.colorIdx]!);
      mat.opacity = Math.min(p.life / 0.15, 1.0) * 0.85;
    }
  }

  dispose(): void {
    for (const m of this.meshes) {
      this.scene.remove(m);
      m.geometry.dispose();
      (m.material as THREE.MeshBasicMaterial).dispose();
    }
    for (const m of this.meshPool) {
      m.geometry.dispose();
      (m.material as THREE.MeshBasicMaterial).dispose();
    }
    this.meshes = [];
    this.meshPool = [];
    this.particles = [];
  }
}
