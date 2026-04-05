import * as THREE from 'three';
import { COLOR_OBSTACLE } from '@/types/constants';

function createObstacleTexture(): THREE.CanvasTexture {
  const size = 100;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Background (demon face base)
  ctx.fillStyle = `rgb(${COLOR_OBSTACLE[0]}, ${COLOR_OBSTACLE[1]}, ${COLOR_OBSTACLE[2]})`;
  ctx.fillRect(0, 0, size, size);

  // Horns
  ctx.fillStyle = 'rgb(255, 200, 50)';
  // Left horn
  ctx.beginPath();
  ctx.moveTo(26, 14);
  ctx.lineTo(36, 14);
  ctx.lineTo(31, 0);
  ctx.closePath();
  ctx.fill();
  // Right horn
  ctx.beginPath();
  ctx.moveTo(64, 14);
  ctx.lineTo(74, 14);
  ctx.lineTo(69, 0);
  ctx.closePath();
  ctx.fill();

  // Angry eyebrows
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(18, 28);
  ctx.lineTo(38, 34);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(82, 28);
  ctx.lineTo(62, 34);
  ctx.stroke();

  // Eyes (white → red → black)
  for (const dx of [40, 60]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(dx, 45, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgb(200, 30, 30)';
    ctx.beginPath();
    ctx.arc(dx, 45, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(dx, 45, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth
  ctx.fillStyle = 'rgb(30, 0, 0)';
  ctx.fillRect(22, 62, 56, 24);

  // Upper fangs
  ctx.fillStyle = '#fff';
  for (const dx of [26, 40, 54]) {
    ctx.beginPath();
    ctx.moveTo(dx, 62);
    ctx.lineTo(dx + 12, 62);
    ctx.lineTo(dx + 6, 74);
    ctx.closePath();
    ctx.fill();
  }
  // Lower fangs
  for (const dx of [32, 46, 60]) {
    ctx.beginPath();
    ctx.moveTo(dx, 86);
    ctx.lineTo(dx + 12, 86);
    ctx.lineTo(dx + 6, 76);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

let cachedObstacleTexture: THREE.CanvasTexture | null = null;

function getObstacleTexture(): THREE.CanvasTexture {
  if (!cachedObstacleTexture) {
    cachedObstacleTexture = createObstacleTexture();
  }
  return cachedObstacleTexture;
}

export class Obstacle {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  readonly width = 50;
  readonly height = 50;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;

    const geo = new THREE.PlaneGeometry(50, 50);
    const mat = new THREE.MeshBasicMaterial({
      map: getObstacleTexture(),
      transparent: true,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, 0.5);
  }

  syncPosition(): void {
    this.mesh.position.set(this.x, this.y, 0.5);
  }
}

// ── Hole Obstacle ──

function createHoleTexture(): THREE.CanvasTexture {
  const w = 110;
  const h = 70;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  // Hole body (dark ellipse)
  ctx.fillStyle = 'rgb(10, 10, 10)';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 50, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rim
  ctx.strokeStyle = 'rgb(80, 70, 60)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 52, 32, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Cracks
  ctx.strokeStyle = 'rgb(90, 80, 70)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(2, 33); ctx.lineTo(18, 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(85, 42); ctx.lineTo(100, 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(45, 12); ctx.lineTo(60, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(65, 58); ctx.lineTo(80, 52); ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

let cachedHoleTexture: THREE.CanvasTexture | null = null;

function getHoleTexture(): THREE.CanvasTexture {
  if (!cachedHoleTexture) {
    cachedHoleTexture = createHoleTexture();
  }
  return cachedHoleTexture;
}

export class HoleObstacle {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  readonly width = 55;
  readonly height = 35;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;

    const geo = new THREE.PlaneGeometry(55, 35);
    const mat = new THREE.MeshBasicMaterial({
      map: getHoleTexture(),
      transparent: true,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, 0.5);
  }

  syncPosition(): void {
    this.mesh.position.set(this.x, this.y, 0.5);
  }
}
