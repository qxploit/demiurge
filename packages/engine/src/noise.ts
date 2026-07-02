// Deterministic 2D value noise with fractal (fBm) octaves. Pure integer-hash
// based: no internal state, identical on every machine for a given seed. Used
// for heightmaps and moisture so a weekly seed always regenerates the same world.

function hash2(x: number, y: number, seed: number): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (x | 0), 0x27d4eb2d);
  h = Math.imul(h ^ (y | 0), 0x165667b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296; // [0,1)
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const v00 = hash2(xi, yi, seed);
  const v10 = hash2(xi + 1, yi, seed);
  const v01 = hash2(xi, yi + 1, seed);
  const v11 = hash2(xi + 1, yi + 1, seed);
  const sx = smooth(xf);
  const sy = smooth(yf);
  const a = v00 + sx * (v10 - v00);
  const b = v01 + sx * (v11 - v01);
  return a + sy * (b - a); // [0,1)
}

export function fbm(
  x: number,
  y: number,
  seed: number,
  octaves = 4,
  freq = 1,
  lacunarity = 2,
  gain = 0.5,
): number {
  let amp = 1;
  let sum = 0;
  let norm = 0;
  let f = freq;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * f, y * f, (seed + i * 1013904223) >>> 0);
    norm += amp;
    amp *= gain;
    f *= lacunarity;
  }
  return sum / norm; // [0,1)
}
