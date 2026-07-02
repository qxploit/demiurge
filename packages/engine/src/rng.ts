// Deterministic seeded PRNG (mulberry32). Same seed + same call sequence => same
// numbers, on every machine. The whole simulation's determinism rests on this,
// so nothing in the engine may call Math.random() or Date.now().
export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  /** next float in [0, 1) */
  float(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.float() * (max - min);
  }

  int(minInclusive: number, maxExclusive: number): number {
    return Math.floor(this.range(minInclusive, maxExclusive));
  }

  chance(p: number): boolean {
    return this.float() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length)];
  }

  /** snapshot / restore the generator state (for save & replay) */
  get state(): number {
    return this.s >>> 0;
  }
  set state(v: number) {
    this.s = v >>> 0;
  }
}
