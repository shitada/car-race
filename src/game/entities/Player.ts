import * as THREE from 'three';
import {
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED,
  PLAYER_START_Y, MAX_HP, INVINCIBLE_TIME,
  ACCEL_RATE, DECEL_RATE, BRAKE_MULTIPLIER,
  INVINCIBLE_ITEM_DURATION,
  LANE_CENTERS, COLOR_PLAYER,
} from '@/types/constants';

export class Player {
  mesh: THREE.Group;
  private bodyMesh: THREE.Mesh;
  private windshieldMesh: THREE.Mesh;
  private tires: THREE.Mesh[] = [];

  x: number;
  y: number;
  readonly width = PLAYER_WIDTH;
  readonly height = PLAYER_HEIGHT;

  hp = MAX_HP;
  movingLeft = false;
  movingRight = false;
  invincibleTimer = 0;
  isAccelerating = false;
  accelBonus = 0;
  invincibleItemTimer = 0;
  isBraking = false;

  constructor() {
    this.x = LANE_CENTERS[1]!;
    this.y = PLAYER_START_Y;

    this.mesh = new THREE.Group();

    // Body
    const bodyGeo = new THREE.PlaneGeometry(PLAYER_WIDTH, PLAYER_HEIGHT);
    const bodyMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(COLOR_PLAYER[0] / 255, COLOR_PLAYER[1] / 255, COLOR_PLAYER[2] / 255),
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.z = 1;
    this.mesh.add(this.bodyMesh);

    // Windshield
    const wsGeo = new THREE.PlaneGeometry(28, 12);
    const wsMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(180 / 255, 220 / 255, 255 / 255) });
    this.windshieldMesh = new THREE.Mesh(wsGeo, wsMat);
    this.windshieldMesh.position.set(0, 8, 1.1);
    this.mesh.add(this.windshieldMesh);

    // Tires
    const tireMat = new THREE.MeshBasicMaterial({ color: 0x1e1e1e });
    const tirePositions = [[-22, -20], [18, -20], [-22, 16], [18, 16]];
    for (const [dx, dy] of tirePositions) {
      const tireGeo = new THREE.PlaneGeometry(6, 10);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.position.set(dx!, dy!, 1.1);
      this.mesh.add(tire);
      this.tires.push(tire);
    }

    this.syncMeshPosition();
  }

  get isInvincible(): boolean {
    return this.invincibleTimer > 0 || this.invincibleItemTimer > 0;
  }

  get isItemInvincible(): boolean {
    return this.invincibleItemTimer > 0;
  }

  get speedMultiplier(): number {
    if (this.isBraking) return BRAKE_MULTIPLIER;
    return 1.0 + this.accelBonus;
  }

  get isBoosting(): boolean {
    return this.accelBonus > 0.1;
  }

  takeDamage(): void {
    if (this.isInvincible) return;
    this.hp -= 1;
    this.invincibleTimer = INVINCIBLE_TIME;
  }

  activateInvincible(): void {
    this.invincibleItemTimer = INVINCIBLE_ITEM_DURATION;
  }

  heal(): void {
    if (this.hp < MAX_HP) this.hp += 1;
  }

  update(dt: number): void {
    // Horizontal movement
    if (this.movingLeft && !this.movingRight) {
      this.x -= PLAYER_SPEED * dt;
    } else if (this.movingRight && !this.movingLeft) {
      this.x += PLAYER_SPEED * dt;
    }

    // Damage invincible timer
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }

    // Acceleration
    if (this.isAccelerating && !this.isBraking) {
      this.accelBonus += ACCEL_RATE * dt;
    } else {
      this.accelBonus -= DECEL_RATE * dt;
      if (this.accelBonus < 0) this.accelBonus = 0;
    }

    // Invincible item timer
    if (this.invincibleItemTimer > 0) {
      this.invincibleItemTimer -= dt;
      if (this.invincibleItemTimer < 0) this.invincibleItemTimer = 0;
    }

    // Visual effects
    this.updateVisuals();
    this.syncMeshPosition();
  }

  private updateVisuals(): void {
    const mat = this.bodyMesh.material as THREE.MeshBasicMaterial;

    if (this.isItemInvincible) {
      // Rainbow color cycle
      const t = performance.now() / 1000;
      const hue = (t * 5) % 1;
      mat.color.setHSL(hue, 1, 0.5);
      mat.opacity = 1;
      mat.transparent = false;
    } else if (this.invincibleTimer > 0) {
      // Blink
      mat.color.setRGB(COLOR_PLAYER[0] / 255, COLOR_PLAYER[1] / 255, COLOR_PLAYER[2] / 255);
      const blink = Math.floor(performance.now() / 100) % 2 === 0;
      mat.transparent = true;
      mat.opacity = blink ? 0.3 : 1.0;
    } else {
      mat.color.setRGB(COLOR_PLAYER[0] / 255, COLOR_PLAYER[1] / 255, COLOR_PLAYER[2] / 255);
      mat.opacity = 1;
      mat.transparent = false;
    }
  }

  private syncMeshPosition(): void {
    this.mesh.position.set(this.x, this.y, 0);
  }

  reset(): void {
    this.x = LANE_CENTERS[1]!;
    this.y = PLAYER_START_Y;
    this.hp = MAX_HP;
    this.movingLeft = false;
    this.movingRight = false;
    this.invincibleTimer = 0;
    this.isAccelerating = false;
    this.accelBonus = 0;
    this.invincibleItemTimer = 0;
    this.isBraking = false;
    this.syncMeshPosition();
  }
}
