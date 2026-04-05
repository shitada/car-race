import type { Player } from '@/game/entities/Player';
import type { Obstacle, HoleObstacle } from '@/game/entities/Obstacle';
import type { Item } from '@/game/entities/Item';

interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

function intersects(a: AABB, b: AABB): boolean {
  return (
    Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
    Math.abs(a.y - b.y) < (a.height + b.height) / 2
  );
}

export interface CollisionResult {
  hitObstacles: (Obstacle | HoleObstacle)[];
  hitItems: Item[];
}

export function checkCollisions(
  player: Player,
  obstacles: (Obstacle | HoleObstacle)[],
  items: Item[],
): CollisionResult {
  const result: CollisionResult = { hitObstacles: [], hitItems: [] };

  const pBox: AABB = {
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height,
  };

  for (const obs of obstacles) {
    if (intersects(pBox, obs)) {
      result.hitObstacles.push(obs);
    }
  }

  for (const item of items) {
    if (intersects(pBox, item)) {
      result.hitItems.push(item);
    }
  }

  return result;
}
