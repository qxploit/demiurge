import { Rng } from "./rng";
import { fbm } from "./noise";
import { rollLoot } from "./loot";
import type { World } from "./world";
import { Biome, BuildingType, Kind, MonsterSpecies, Rarity, ResourceType } from "./types";

export interface WorldGenConfig {
  seed: number;
  size?: number; // tiles per side (default 256 -> 4096px at 16px tiles)
  tileSize?: number; // px per tile (default 16)
}

export interface TileMap {
  size: number;
  tileSize: number;
  biome: Uint8Array; // Biome per tile
  height: Uint8Array; // 0..255
}

export interface ResourceSpot {
  type: ResourceType;
  tx: number;
  ty: number;
}
export interface MonsterCamp {
  species: MonsterSpecies;
  tx: number;
  ty: number;
  count: number;
}
export interface ChestSpot {
  tx: number;
  ty: number;
  rarity: Rarity;
}
export interface Settlement {
  tx: number;
  ty: number;
  quality: number; // 0..1 suitability for a clan village
}

export interface GeneratedWorld {
  seed: number;
  size: number;
  tileSize: number;
  tiles: TileMap;
  resources: ResourceSpot[];
  camps: MonsterCamp[];
  chests: ChestSpot[];
  settlements: Settlement[];
}

// The world resets weekly: every player shares one global map derived from the
// ISO year + week. Date is read on the server and passed in - the engine never
// touches the clock, so generation stays pure/deterministic.
export function weekSeed(year: number, week: number): number {
  let h = 0x811c9dc5;
  const s = `demiurge-${year}-W${week}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function biomeFor(h: number, m: number): Biome {
  if (h < 0.3) return Biome.DeepWater;
  if (h < 0.4) return Biome.Water;
  if (h < 0.45) return Biome.Sand;
  if (h > 0.86) return Biome.Snow;
  if (h > 0.74) return Biome.Mountain;
  if (h > 0.64) return Biome.Hills;
  if (m < 0.28) return Biome.Desert;
  if (m < 0.48) return Biome.Savanna;
  if (m < 0.72) return Biome.Grass;
  return Biome.Forest;
}

export function generateWorld(cfg: WorldGenConfig): GeneratedWorld {
  const size = cfg.size ?? 256;
  const tileSize = cfg.tileSize ?? 16;
  const seed = cfg.seed >>> 0;

  const biome = new Uint8Array(size * size);
  const height = new Uint8Array(size * size);
  const heightF = new Float32Array(size * size);
  const half = size / 2;

  // ---- 1. heightmap: domain-warped fbm + ridged mountain chains, shaped into a
  // continent by a NOISY radial mask so the coast has bays and peninsulas.
  for (let ty = 0; ty < size; ty++) {
    for (let tx = 0; tx < size; tx++) {
      const nx = tx / size;
      const ny = ty / size;
      // domain warp -> flowing, organic landforms (not blobs)
      const wx = nx + 0.16 * (fbm(nx * 2 + 5.2, ny * 2 + 1.3, seed ^ 0xa1, 4) - 0.5);
      const wy = ny + 0.16 * (fbm(nx * 2 + 9.7, ny * 2 + 4.4, seed ^ 0xb2, 4) - 0.5);
      let h = fbm(wx * 3.2, wy * 3.2, seed, 6);
      const r = ridged(wx * 2.6 + 20, wy * 2.6 + 20, seed ^ 0xc3);
      h = h * 0.85 + r * r * 0.35 + 0.05; // ridges -> mountain ranges + land bias
      const dx = (tx - half) / half;
      const dy = (ty - half) / half;
      let d = Math.sqrt(dx * dx + dy * dy);
      d += 0.18 * (fbm(nx * 3 + 50, ny * 3 + 50, seed ^ 0xd4, 3) - 0.5); // wobble the shoreline
      h *= 1 - smoothstep(0.5, 1.1, d);
      heightF[ty * size + tx] = clampF(h);
    }
  }

  // ---- 2. rivers: carve winding channels from the highlands to the sea
  carveRivers(heightF, biome, size, new Rng(seed ^ 0x5e17e5));

  // ---- 3. biomes: height + latitude/elevation temperature + moisture (Whittaker)
  for (let ty = 0; ty < size; ty++) {
    for (let tx = 0; tx < size; tx++) {
      const i = ty * size + tx;
      const h = heightF[i];
      height[i] = Math.round(h * 255);
      if (biome[i] === Biome.Water) continue; // river already carved
      const ny = ty / size;
      const nx = tx / size;
      // hot near mid-latitude, colder toward the poles and at altitude
      const temp = clampF(0.92 - Math.abs(ny - 0.5) * 1.1 - h * 0.35 + 0.12 * (fbm(nx * 3 + 200, ny * 3 + 200, seed ^ 0x77, 3) - 0.5));
      const moist = clampF((fbm(nx * 3.5 + 100, ny * 3.5 + 100, seed ^ 0x55, 4) - 0.5) * 1.7 + 0.5);
      biome[i] = classify(h, temp, moist);
    }
  }

  // ---- features: deterministic per-tile rolls (fixed iteration order + seeded rng)
  const rng = new Rng(seed ^ 0x1234abcd);
  const resources: ResourceSpot[] = [];
  const camps: MonsterCamp[] = [];
  const chests: ChestSpot[] = [];
  const settlements: Settlement[] = [];

  for (let ty = 0; ty < size; ty++) {
    for (let tx = 0; tx < size; tx++) {
      const b = biome[ty * size + tx] as Biome;

      // resource nodes by biome
      switch (b) {
        case Biome.Forest:
          if (rng.chance(0.07)) resources.push({ type: ResourceType.Wood, tx, ty });
          else if (rng.chance(0.015)) resources.push({ type: ResourceType.Food, tx, ty });
          break;
        case Biome.Grass:
        case Biome.Savanna:
          if (rng.chance(0.02)) resources.push({ type: ResourceType.Food, tx, ty });
          else if (rng.chance(0.006)) resources.push({ type: ResourceType.Wood, tx, ty });
          break;
        case Biome.Hills:
          if (rng.chance(0.05)) resources.push({ type: ResourceType.Stone, tx, ty });
          else if (rng.chance(0.012)) resources.push({ type: ResourceType.Ore, tx, ty });
          break;
        case Biome.Mountain:
          if (rng.chance(0.04)) resources.push({ type: ResourceType.Stone, tx, ty });
          else if (rng.chance(0.02)) resources.push({ type: ResourceType.Ore, tx, ty });
          else if (rng.chance(0.005)) resources.push({ type: ResourceType.Gold, tx, ty });
          break;
        case Biome.Desert:
          if (rng.chance(0.004)) resources.push({ type: ResourceType.Crystal, tx, ty });
          break;
      }

      // monster camps - rarer, spawn a cluster
      if (b === Biome.Forest && rng.chance(0.004)) {
        camps.push({ species: rng.chance(0.5) ? MonsterSpecies.Goblin : MonsterSpecies.Wolf, tx, ty, count: 4 + rng.int(0, 5) });
      } else if (b === Biome.Savanna && rng.chance(0.003)) {
        camps.push({ species: rng.chance(0.5) ? MonsterSpecies.Bandit : MonsterSpecies.Goblin, tx, ty, count: 3 + rng.int(0, 4) });
      } else if ((b === Biome.Mountain || b === Biome.Hills) && rng.chance(0.0035)) {
        camps.push({ species: rng.chance(0.5) ? MonsterSpecies.Orc : MonsterSpecies.Troll, tx, ty, count: 3 + rng.int(0, 4) });
      } else if (b === Biome.Desert && rng.chance(0.002)) {
        camps.push({ species: MonsterSpecies.Skeleton, tx, ty, count: 3 + rng.int(0, 4) });
      } else if ((b === Biome.Water || b === Biome.Grass) && rng.chance(0.0015)) {
        camps.push({ species: MonsterSpecies.Slime, tx, ty, count: 3 + rng.int(0, 3) });
      }

      // treasure chests - rarer in safe lands, better loot in dangerous biomes
      const dangerous = b === Biome.Mountain || b === Biome.Desert || b === Biome.Forest;
      if (b !== Biome.DeepWater && b !== Biome.Water && rng.chance(dangerous ? 0.0016 : 0.0006)) {
        const roll = rng.float();
        let rarity: Rarity = Rarity.Common;
        if (roll > 0.985) rarity = Rarity.Legendary;
        else if (roll > 0.93) rarity = Rarity.Epic;
        else if (roll > 0.78) rarity = Rarity.Rare;
        else if (roll > 0.5) rarity = Rarity.Uncommon;
        if (dangerous && rarity < Rarity.Legendary) rarity = (rarity + 1) as Rarity;
        chests.push({ tx, ty, rarity });
      }

      // settlement candidates: flat grass/savanna near the coast (good village land)
      if (b === Biome.Grass || b === Biome.Savanna) {
        const nearWater = isNearBiome(biome, size, tx, ty, 3, Biome.Water) || isNearBiome(biome, size, tx, ty, 3, Biome.Sand);
        if (nearWater && rng.chance(0.02)) {
          const q = 0.5 + rng.float() * 0.5 + (b === Biome.Grass ? 0.1 : 0);
          settlements.push({ tx, ty, quality: Math.min(1, q) });
        }
      }
    }
  }

  // space settlements out so clans don't all found villages on top of each other
  const spaced = spaceOut(settlements, size * 0.06, 32);

  return { seed, size, tileSize, tiles: { size, tileSize, biome, height }, resources, camps, chests, settlements: spaced };
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function clampF(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
// ridged noise: sharp crests -> mountain ranges
function ridged(x: number, y: number, seed: number): number {
  return 1 - Math.abs(2 * fbm(x, y, seed, 5) - 1);
}
function classify(h: number, temp: number, moist: number): Biome {
  if (h < 0.3) return Biome.DeepWater;
  if (h < 0.37) return Biome.Water;
  if (h < 0.41) return Biome.Sand; // beach ring
  if (h > 0.82) return temp < 0.4 ? Biome.Snow : Biome.Mountain;
  if (h > 0.68) return Biome.Hills;
  if (temp < 0.3) return Biome.Snow; // cold tundra
  if (temp > 0.66 && moist < 0.42) return Biome.Desert; // hot + dry
  if (moist > 0.6) return Biome.Forest; // wet
  if (moist < 0.4) return Biome.Savanna; // dry temperate
  return Biome.Grass;
}
// carve winding rivers by steepest-descent from highland sources to the sea
function carveRivers(heightF: Float32Array, biome: Uint8Array, size: number, rng: Rng): void {
  const sources = Math.max(6, Math.floor(size / 20));
  for (let s = 0; s < sources; s++) {
    let sx = 0;
    let sy = 0;
    let best = -1;
    for (let t = 0; t < 40; t++) {
      const x = rng.int(4, size - 4);
      const y = rng.int(4, size - 4);
      const h = heightF[y * size + x];
      if (h > 0.6 && h < 0.85 && h > best) {
        best = h;
        sx = x;
        sy = y;
      }
    }
    if (best < 0) continue;
    let x = sx;
    let y = sy;
    for (let step = 0; step < size * 2; step++) {
      const i = y * size + x;
      if (heightF[i] < 0.34) break; // reached the sea
      biome[i] = Biome.Water;
      if (heightF[i] > 0.36) heightF[i] = 0.36;
      let nx = x;
      let ny = y;
      let low = heightF[i];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue;
          const hh = heightF[yy * size + xx];
          if (hh < low) {
            low = hh;
            nx = xx;
            ny = yy;
          }
        }
      }
      if (nx === x && ny === y) {
        // stuck in a basin: nudge toward the nearest edge (downhill to sea)
        nx = x + (x < size / 2 ? -1 : 1);
        ny = y + (y < size / 2 ? -1 : 1);
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) break;
      }
      x = nx;
      y = ny;
    }
  }
}

function isNearBiome(biome: Uint8Array, size: number, tx: number, ty: number, r: number, target: Biome): boolean {
  for (let dy = -r; dy <= r; dy++) {
    const y = ty + dy;
    if (y < 0 || y >= size) continue;
    for (let dx = -r; dx <= r; dx++) {
      const x = tx + dx;
      if (x < 0 || x >= size) continue;
      if (biome[y * size + x] === target) return true;
    }
  }
  return false;
}

function spaceOut(spots: Settlement[], minDist: number, max: number): Settlement[] {
  const kept: Settlement[] = [];
  const md2 = minDist * minDist;
  // prefer higher quality first, stable tie-break by position for determinism
  const sorted = [...spots].sort((a, b) => b.quality - a.quality || a.ty - b.ty || a.tx - b.tx);
  for (const s of sorted) {
    let ok = true;
    for (const k of kept) {
      const dx = s.tx - k.tx;
      const dy = s.ty - k.ty;
      if (dx * dx + dy * dy < md2) {
        ok = false;
        break;
      }
    }
    if (ok) {
      kept.push(s);
      if (kept.length >= max) break;
    }
  }
  return kept;
}

// Spawn a generated world's features as live entities inside a sim World.
// Resources, monster camps and chests become entities; terrain/territory stays
// on the TileMap. Uses the World's own rng so it stays part of the deterministic
// stream.
export function populate(world: World, gen: GeneratedWorld): void {
  world.map = gen.tiles; // enable terrain collision
  const ts = gen.tileSize;
  const ENEMY = 999; // hostile NPC faction id

  for (const r of gen.resources) {
    world.spawn(Kind.Resource, 0, r.tx * ts, r.ty * ts, r.type);
  }
  for (const c of gen.camps) {
    for (let i = 0; i < c.count; i++) {
      const ox = world.rng.range(-24, 24);
      const oy = world.rng.range(-24, 24);
      world.spawn(Kind.Mob, ENEMY, c.tx * ts + ox, c.ty * ts + oy, c.species);
    }
  }
  for (const ch of gen.chests) {
    world.spawn(Kind.Chest, 0, ch.tx * ts, ch.ty * ts, ch.rarity);
  }
}

// re-exported for convenience so callers can open chests without importing loot
export { rollLoot };
export { BuildingType };
