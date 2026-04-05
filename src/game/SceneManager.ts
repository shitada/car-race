import type * as THREE from 'three';
import type { Scene, SceneContext, SceneName } from '@/types';

export class SceneManager {
  private scenes = new Map<SceneName, Scene>();
  private currentScene: Scene | null = null;
  private currentName: SceneName | null = null;

  register(name: SceneName, scene: Scene): void {
    this.scenes.set(name, scene);
  }

  transition(name: SceneName, context: SceneContext = {}): void {
    if (this.currentScene) {
      this.currentScene.exit();
    }
    const scene = this.scenes.get(name);
    if (!scene) throw new Error(`Scene "${name}" not registered`);
    this.currentScene = scene;
    this.currentName = name;
    scene.enter(context);
  }

  update(dt: number): void {
    this.currentScene?.update(dt);
  }

  getScene(): THREE.Scene | null {
    return this.currentScene?.getThreeScene() ?? null;
  }

  getCamera(): THREE.Camera | null {
    return this.currentScene?.getCamera() ?? null;
  }

  getCurrentName(): SceneName | null {
    return this.currentName;
  }
}
