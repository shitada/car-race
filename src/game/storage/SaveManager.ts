interface SaveData {
  bestTimes: Record<string, number>;
  clearedStages: number[];
}

const STORAGE_KEY = 'car-race-save';

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as SaveData;
    } catch { /* ignore */ }
    return { bestTimes: {}, clearedStages: [] };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch { /* ignore */ }
  }

  getBestTime(stageIndex: number): number | null {
    return this.data.bestTimes[String(stageIndex)] ?? null;
  }

  updateBestTime(stageIndex: number, elapsed: number): { bestTime: number; isNewRecord: boolean } {
    const key = String(stageIndex);
    const prev = this.data.bestTimes[key];
    if (prev === undefined || elapsed < prev) {
      this.data.bestTimes[key] = elapsed;
      if (!this.data.clearedStages.includes(stageIndex)) {
        this.data.clearedStages.push(stageIndex);
      }
      this.save();
      return { bestTime: elapsed, isNewRecord: true };
    }
    return { bestTime: prev, isNewRecord: false };
  }

  isStageCleared(stageIndex: number): boolean {
    return this.data.clearedStages.includes(stageIndex);
  }

  getMaxUnlockedStage(): number {
    if (this.data.clearedStages.length === 0) return 0;
    return Math.max(...this.data.clearedStages) + 1;
  }
}
