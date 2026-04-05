const SAMPLE_RATE = 22050;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  private invincibleSource: AudioBufferSourceNode | null = null;
  private engineSource: AudioBufferSourceNode | null = null;
  private currentEngineIdx = -1;
  private engineBuffers: AudioBuffer[] = [];

  private bgmBuffer: AudioBuffer | null = null;
  private titleBgmBuffer: AudioBuffer | null = null;
  private invincibleBgmBuffer: AudioBuffer | null = null;
  private hitBuffer: AudioBuffer | null = null;
  private goalBuffer: AudioBuffer | null = null;
  private itemBuffer: AudioBuffer | null = null;
  private gameoverBuffer: AudioBuffer | null = null;

  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.initialized = true;

    // Generate all sounds
    this.bgmBuffer = this.generateBGM();
    this.titleBgmBuffer = this.generateTitleBGM();
    this.invincibleBgmBuffer = this.generateInvincibleBGM();
    this.hitBuffer = this.generateHitSound();
    this.goalBuffer = this.generateGoalSound();
    this.itemBuffer = this.generateItemSound();
    this.gameoverBuffer = this.generateGameoverSound();
    this.engineBuffers = this.generateEngineTones(8);
  }

  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // ── Playback helpers ──

  playBGM(): void {
    this.stopBGM();
    if (!this.ctx || !this.bgmBuffer) return;
    const { source, gain } = this.playLooping(this.bgmBuffer, 0.25);
    this.bgmSource = source;
    this.bgmGain = gain;
  }

  stopBGM(): void {
    this.stopNode(this.bgmSource);
    this.bgmSource = null;
  }

  pauseBGM(): void {
    if (this.bgmGain) this.bgmGain.gain.value = 0;
  }

  resumeBGM(): void {
    if (this.bgmGain) this.bgmGain.gain.value = 0.25;
  }

  playTitleBGM(): void {
    this.stopBGM();
    if (!this.ctx || !this.titleBgmBuffer) return;
    const { source, gain } = this.playLooping(this.titleBgmBuffer, 0.2);
    this.bgmSource = source;
    this.bgmGain = gain;
  }

  playInvincibleBGM(): void {
    this.stopInvincibleBGM();
    if (!this.ctx || !this.invincibleBgmBuffer) return;
    const { source } = this.playLooping(this.invincibleBgmBuffer, 0.3);
    this.invincibleSource = source;
  }

  stopInvincibleBGM(): void {
    this.stopNode(this.invincibleSource);
    this.invincibleSource = null;
  }

  playHit(): void { this.playOnce(this.hitBuffer, 0.5); }
  playGoal(): void { this.playOnce(this.goalBuffer, 0.5); }
  playItem(): void { this.playOnce(this.itemBuffer, 0.4); }
  playGameover(): void { this.playOnce(this.gameoverBuffer, 0.5); }

  updateEngine(accelBonus: number): void {
    const ratio = Math.min(accelBonus / 3.0, 1.0);
    const idx = Math.floor(ratio * (this.engineBuffers.length - 1));
    if (idx === this.currentEngineIdx) return;
    this.stopEngine();
    const buf = this.engineBuffers[idx];
    if (!this.ctx || !buf) return;
    const { source } = this.playLooping(buf, 0.12);
    this.engineSource = source;
    this.currentEngineIdx = idx;
  }

  stopEngine(): void {
    this.stopNode(this.engineSource);
    this.engineSource = null;
    this.currentEngineIdx = -1;
  }

  stopAll(): void {
    this.stopBGM();
    this.stopInvincibleBGM();
    this.stopEngine();
  }

  // ── Internal helpers ──

  private playLooping(buffer: AudioBuffer, volume: number): { source: AudioBufferSourceNode; gain: GainNode } {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(ctx.destination);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    source.start();
    return { source, gain };
  }

  private playOnce(buffer: AudioBuffer | null, volume: number): void {
    if (!this.ctx || !buffer) return;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    gain.connect(this.ctx.destination);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.start();
  }

  private stopNode(source: AudioBufferSourceNode | null): void {
    if (!source) return;
    try { source.stop(); } catch { /* already stopped */ }
    try { source.disconnect(); } catch { /* already disconnected */ }
  }

  private createBuffer(samples: Float32Array<ArrayBuffer>): AudioBuffer {
    const buf = this.ctx!.createBuffer(1, samples.length, SAMPLE_RATE);
    buf.copyToChannel(samples, 0);
    return buf;
  }

  // ── Sound Generation ──

  private generateBGM(): AudioBuffer {
    const duration = 8.0;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(n);
    const beat = 60.0 / 140.0;

    // Melody (square wave)
    const melody: [number, number, number][] = [
      [0, 0.5, 523], [0.5, 0.5, 587], [1, 0.5, 659], [1.5, 0.5, 698],
      [2, 1.0, 784], [3, 0.5, 784], [3.5, 0.5, 698],
      [4, 0.5, 659], [4.5, 0.5, 587], [5, 1.0, 523],
      [6, 0.5, 659], [6.5, 0.5, 784], [7, 0.5, 880], [7.5, 0.5, 784],
      [8, 0.5, 880], [8.5, 0.5, 784], [9, 0.5, 659], [9.5, 0.5, 587],
      [10, 1.0, 523], [11, 0.5, 587], [11.5, 0.5, 659],
      [12, 1.0, 784], [13, 0.5, 880], [13.5, 0.5, 784],
      [14, 0.5, 659], [14.5, 0.5, 523], [15, 1.0, 587],
    ];

    for (const [beatPos, beatLen, freq] of melody) {
      const start = Math.floor(beatPos * beat * SAMPLE_RATE);
      const length = Math.floor(beatLen * beat * SAMPLE_RATE);
      for (let i = 0; i < length; i++) {
        const idx = start + i;
        if (idx >= 0 && idx < n) {
          const t = i / SAMPLE_RATE;
          const val = ((t * freq) % 1.0) < 0.5 ? 0.15 : -0.15;
          const env = Math.min(1.0, (length - i) / (SAMPLE_RATE * 0.05));
          samples[idx] += val * env;
        }
      }
    }

    // Bass (triangle wave)
    const bass: [number, number, number][] = [
      [0, 2, 131], [2, 2, 165], [4, 2, 175], [6, 2, 131],
      [8, 2, 165], [10, 2, 175], [12, 2, 196], [14, 2, 147],
    ];
    for (const [beatPos, beatLen, freq] of bass) {
      const start = Math.floor(beatPos * beat * SAMPLE_RATE);
      const length = Math.floor(beatLen * beat * SAMPLE_RATE);
      for (let i = 0; i < length; i++) {
        const idx = start + i;
        if (idx >= 0 && idx < n) {
          const t = i / SAMPLE_RATE;
          const phase = (t * freq) % 1.0;
          const val = 4.0 * Math.abs(phase - 0.5) - 1.0;
          samples[idx] += val * 0.12;
        }
      }
    }

    // Drums
    const seedRng = this.seededRandom(42);
    for (let b = 0; b < 16; b++) {
      const kickStart = Math.floor(b * beat * SAMPLE_RATE);
      // Kick
      for (let i = 0; i < Math.floor(0.08 * SAMPLE_RATE); i++) {
        const idx = kickStart + i;
        if (idx >= 0 && idx < n) {
          const t = i / SAMPLE_RATE;
          const freqK = 150 * Math.exp(-t * 30);
          samples[idx] += 0.2 * Math.sin(2 * Math.PI * freqK * t) * Math.exp(-t * 20);
        }
      }
      // Hi-hat
      for (const sub of [0, 0.5]) {
        const hhStart = Math.floor((b + sub) * beat * SAMPLE_RATE);
        for (let i = 0; i < Math.floor(0.03 * SAMPLE_RATE); i++) {
          const idx = hhStart + i;
          if (idx >= 0 && idx < n) {
            const env = Math.exp(-i / (SAMPLE_RATE * 0.01));
            samples[idx] += (seedRng() * 2 - 1) * 0.06 * env;
          }
        }
      }
    }

    return this.createBuffer(samples);
  }

  private generateTitleBGM(): AudioBuffer {
    const duration = 4.0;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(n);
    const beat = 60.0 / 100.0;

    const melody: [number, number, number][] = [
      [0, 1, 523], [1, 1, 659], [2, 1.5, 784], [3.5, 0.5, 659],
      [4, 1, 698], [5, 1, 659], [6, 2, 523],
    ];
    for (const [beatPos, beatLen, freq] of melody) {
      const start = Math.floor(beatPos * beat * SAMPLE_RATE);
      const length = Math.floor(beatLen * beat * SAMPLE_RATE);
      for (let i = 0; i < length; i++) {
        const idx = start + i;
        if (idx >= 0 && idx < n) {
          const t = i / SAMPLE_RATE;
          const val = Math.sin(2 * Math.PI * freq * t) * 0.15;
          const env = Math.min(1.0, i / (SAMPLE_RATE * 0.02)) * Math.min(1.0, (length - i) / (SAMPLE_RATE * 0.05));
          samples[idx] += val * env;
        }
      }
    }

    const bass: [number, number, number][] = [
      [0, 2, 131], [2, 2, 165], [4, 2, 175], [6, 2, 131],
    ];
    for (const [beatPos, beatLen, freq] of bass) {
      const start = Math.floor(beatPos * beat * SAMPLE_RATE);
      const length = Math.floor(beatLen * beat * SAMPLE_RATE);
      for (let i = 0; i < length; i++) {
        const idx = start + i;
        if (idx >= 0 && idx < n) {
          const t = i / SAMPLE_RATE;
          const phase = (t * freq) % 1.0;
          const val = 4.0 * Math.abs(phase - 0.5) - 1.0;
          samples[idx] += val * 0.08;
        }
      }
    }

    return this.createBuffer(samples);
  }

  private generateInvincibleBGM(): AudioBuffer {
    const duration = 2.0;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(n);
    const beat = 60.0 / 180.0;

    const melody: [number, number, number][] = [
      [0, 0.5, 784], [0.5, 0.5, 988], [1, 0.5, 1175],
      [1.5, 0.5, 1319], [2, 0.5, 1175], [2.5, 0.5, 988],
      [3, 0.5, 1175], [3.5, 0.5, 1319], [4, 0.5, 1568],
      [4.5, 0.5, 1319], [5, 0.5, 1175], [5.5, 0.5, 988],
    ];
    for (const [beatPos, beatLen, freq] of melody) {
      const start = Math.floor(beatPos * beat * SAMPLE_RATE);
      const length = Math.floor(beatLen * beat * SAMPLE_RATE);
      for (let i = 0; i < length; i++) {
        const idx = start + i;
        if (idx >= 0 && idx < n) {
          const t = i / SAMPLE_RATE;
          const val = ((t * freq) % 1.0) < 0.5 ? 0.15 : -0.15;
          const env = Math.min(1.0, i / (SAMPLE_RATE * 0.005)) * Math.min(1.0, (length - i) / (SAMPLE_RATE * 0.02));
          samples[idx] += val * env;
        }
      }
    }

    const bass: [number, number, number][] = [
      [0, 1.5, 262], [1.5, 1.5, 330], [3, 1.5, 349], [4.5, 1.5, 262],
    ];
    for (const [beatPos, beatLen, freq] of bass) {
      const start = Math.floor(beatPos * beat * SAMPLE_RATE);
      const length = Math.floor(beatLen * beat * SAMPLE_RATE);
      for (let i = 0; i < length; i++) {
        const idx = start + i;
        if (idx >= 0 && idx < n) {
          const t = i / SAMPLE_RATE;
          const phase = (t * freq) % 1.0;
          const val = 4.0 * Math.abs(phase - 0.5) - 1.0;
          samples[idx] += val * 0.10;
        }
      }
    }

    // Hi-hat
    const rng = this.seededRandom(77);
    for (let b = 0; b < 12; b++) {
      for (const sub of [0, 0.5]) {
        const hhStart = Math.floor((b + sub) * beat * SAMPLE_RATE);
        for (let i = 0; i < Math.floor(0.02 * SAMPLE_RATE); i++) {
          const idx = hhStart + i;
          if (idx >= 0 && idx < n) {
            const env = Math.exp(-i / (SAMPLE_RATE * 0.008));
            samples[idx] += (rng() * 2 - 1) * 0.05 * env;
          }
        }
      }
    }

    return this.createBuffer(samples);
  }

  private generateHitSound(): AudioBuffer {
    const duration = 0.3;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(n);
    const rng = this.seededRandom(123);
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 12);
      const boom = Math.sin(2 * Math.PI * 80 * t * Math.exp(-t * 5)) * 0.5;
      const noise = (rng() * 2 - 1) * 0.4;
      samples[i] = (boom + noise) * env;
    }
    return this.createBuffer(samples);
  }

  private generateGoalSound(): AudioBuffer {
    const beatLen = 0.15;
    const notes: [number, number, number][] = [
      [0, 1, 523], [1, 1, 659], [2, 1, 784], [3, 3, 1047],
      [6, 1, 784], [7, 1, 880], [8, 1, 1047], [9, 4, 1319],
    ];
    const duration = 13 * beatLen + 0.2;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(n);
    for (const [beatPos, bl, freq] of notes) {
      const start = Math.floor(beatPos * beatLen * SAMPLE_RATE);
      const length = Math.floor(bl * beatLen * SAMPLE_RATE);
      for (let i = 0; i < length; i++) {
        const idx = start + i;
        if (idx >= 0 && idx < n) {
          const t = i / SAMPLE_RATE;
          const val = ((t * freq) % 1.0) < 0.5 ? 0.2 : -0.2;
          const env = Math.min(1.0, i / (SAMPLE_RATE * 0.01)) * Math.min(1.0, (length - i) / (SAMPLE_RATE * 0.05));
          samples[idx] += val * env;
        }
      }
    }
    return this.createBuffer(samples);
  }

  private generateItemSound(): AudioBuffer {
    const duration = 0.25;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const freq = 800 + 1200 * (t / duration);
      const val = Math.sin(2 * Math.PI * freq * t) * 0.2;
      const env = Math.min(1.0, i / (n * 0.05)) * Math.min(1.0, (n - i) / (n * 0.1));
      samples[i] = val * env;
    }
    return this.createBuffer(samples);
  }

  private generateGameoverSound(): AudioBuffer {
    const duration = 1.0;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const freq = 400 * Math.exp(-t * 2);
      const val = Math.sin(2 * Math.PI * freq * t) * 0.25;
      const env = Math.exp(-t * 1.5);
      samples[i] = val * env;
    }
    return this.createBuffer(samples);
  }

  private generateEngineTones(count: number): AudioBuffer[] {
    const buffers: AudioBuffer[] = [];
    for (let i = 0; i < count; i++) {
      const freq = 80 + i * 40;
      const duration = 0.15;
      const n = Math.floor(SAMPLE_RATE * duration);
      const samples = new Float32Array(n);
      const rng = this.seededRandom(i * 17 + 7);
      for (let j = 0; j < n; j++) {
        const t = j / SAMPLE_RATE;
        const saw = 2.0 * ((t * freq) % 1.0) - 1.0;
        const noise = (rng() * 2 - 1) * 0.15;
        const env = Math.min(1.0, j / (n * 0.1)) * Math.min(1.0, (n - j) / (n * 0.1));
        samples[j] = (saw * 0.3 + noise) * env;
      }
      buffers.push(this.createBuffer(samples));
    }
    return buffers;
  }

  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return s / 2147483647;
    };
  }
}
