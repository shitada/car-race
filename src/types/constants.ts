// ── Screen ──
export const SCREEN_WIDTH = 480;
export const SCREEN_HEIGHT = 720;

// ── Road Layout ──
export const ROAD_LEFT = 90;
export const ROAD_RIGHT = 390;
export const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT; // 300
export const LANE_COUNT = 3;
export const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT; // 100
export const LANE_CENTERS = [
  ROAD_LEFT + LANE_WIDTH * 0 + LANE_WIDTH / 2, // 140
  ROAD_LEFT + LANE_WIDTH * 1 + LANE_WIDTH / 2, // 240
  ROAD_LEFT + LANE_WIDTH * 2 + LANE_WIDTH / 2, // 340
];

// ── Player ──
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 60;
export const PLAYER_SPEED = 300;
export const PLAYER_START_Y = 120;

// ── Life ──
export const MAX_HP = 3;
export const INVINCIBLE_TIME = 1.5;

// ── Acceleration ──
export const ACCEL_RATE = 0.6;
export const DECEL_RATE = 2.5;

// ── Invincible Item ──
export const INVINCIBLE_ITEM_DURATION = 5.0;
export const INVINCIBLE_BGM_EARLY_END = 1.0;

// ── Brake ──
export const BRAKE_MULTIPLIER = 0.3;

// ── Speed meter ──
export const PX_PER_KMH = 2.0;

// ── Goal ──
export const GOAL_TIME = 90;

// ── Curve ──
export const CURVE_WAVELENGTH = 2000;

// ── Colors (r, g, b) normalized to 0-1 for Three.js ──
export const COLOR_ROAD = [60, 60, 60] as const;
export const COLOR_ROAD_LINE = [255, 255, 255] as const;
export const COLOR_GRASS = [50, 150, 50] as const;
export const COLOR_PLAYER = [30, 120, 255] as const;
export const COLOR_OBSTACLE = [100, 50, 50] as const;
export const COLOR_HOLE = [20, 20, 20] as const;
export const COLOR_ITEM_HEAL = [0, 220, 100] as const;
export const COLOR_ITEM_INVINCIBLE = [255, 100, 255] as const;
export const COLOR_GOAL = [255, 215, 0] as const;
export const COLOR_HP_FULL = [255, 50, 50] as const;
export const COLOR_HP_EMPTY = [80, 80, 80] as const;

export type RGB = readonly [number, number, number];
