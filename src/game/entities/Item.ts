import * as THREE from 'three';
import { COLOR_ITEM_INVINCIBLE, COLOR_ITEM_HEAL } from '@/types/constants';

function createInvincibleTexture(): THREE.CanvasTexture {
  const size = 60;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Circle
  ctx.fillStyle = `rgb(${COLOR_ITEM_INVINCIBLE[0]}, ${COLOR_ITEM_INVINCIBLE[1]}, ${COLOR_ITEM_INVINCIBLE[2]})`;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Star label
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', size / 2, size / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

function createHealTexture(): THREE.CanvasTexture {
  const size = 60;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Circle
  ctx.fillStyle = `rgb(${COLOR_ITEM_HEAL[0]}, ${COLOR_ITEM_HEAL[1]}, ${COLOR_ITEM_HEAL[2]})`;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Cross
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 5;
  const s = 10;
  ctx.beginPath();
  ctx.moveTo(size / 2 - s, size / 2);
  ctx.lineTo(size / 2 + s, size / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(size / 2, size / 2 - s);
  ctx.lineTo(size / 2, size / 2 + s);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

let cachedInvincibleTex: THREE.CanvasTexture | null = null;
let cachedHealTex: THREE.CanvasTexture | null = null;

export type ItemType = 'invincible' | 'heal';

export class Item {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  readonly width = 30;
  readonly height = 30;
  readonly type: ItemType;

  constructor(x: number, y: number, type: ItemType) {
    this.x = x;
    this.y = y;
    this.type = type;

    let tex: THREE.CanvasTexture;
    if (type === 'invincible') {
      if (!cachedInvincibleTex) cachedInvincibleTex = createInvincibleTexture();
      tex = cachedInvincibleTex;
    } else {
      if (!cachedHealTex) cachedHealTex = createHealTexture();
      tex = cachedHealTex;
    }

    const geo = new THREE.PlaneGeometry(30, 30);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, 0.5);
  }

  syncPosition(): void {
    this.mesh.position.set(this.x, this.y, 0.5);
  }
}
