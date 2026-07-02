import { Rng } from "./rng";
import { SpatialHash } from "./spatial";
import { dist, dist2 } from "./math";
import { Kind, type Entity, type EntityId, type EntitySnapshot } from "./types";
import type { Command } from "./commands";

export interface WorldConfig {
  seed: number;
  tickRate?: number; // simulation ticks per second (default 20)
}

const AGGRO_RADIUS = 140;
const LEASH_RADIUS = 280; // mobs give up and go home past this from their spawn

// The World is the whole simulation: a bag of entities advanced by a fixed
// timestep. `step()` is pure with respect to (state, queued commands, rng) —
// no wall-clock, no Math.random — so the same inputs always produce the same
// output. That is what lets the server run it authoritatively and clients (or a
// replay) reproduce it exactly.
export class World {
  tick = 0;
  time = 0; // seconds elapsed
  readonly dt: number;
  readonly rng: Rng;
  readonly entities = new Map<EntityId, Entity>();
  map: { size: number; tileSize: number; biome: Uint8Array } | null = null;

  private nextId = 1;
  private commands: Command[] = [];
  private readonly hash = new SpatialHash(64);
  private scratch: number[] = [];

  constructor(cfg: WorldConfig) {
    this.rng = new Rng(cfg.seed);
    this.dt = 1 / (cfg.tickRate ?? 20);
  }

  get count(): number {
    return this.entities.size;
  }
  get(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  // land only: biomes 0 (deep water) and 1 (water) are impassable
  passableAt(x: number, y: number): boolean {
    const m = this.map;
    if (!m) return true;
    const tx = Math.floor(x / m.tileSize);
    const ty = Math.floor(y / m.tileSize);
    if (tx < 0 || ty < 0 || tx >= m.size || ty >= m.size) return false;
    return m.biome[ty * m.size + tx] > 1;
  }

  spawn(kind: Kind, owner: number, x: number, y: number, variant = 0): EntityId {
    const id = this.nextId++;
    const e: Entity = { id, kind, faction: { owner }, transform: { x, y, facing: 0 }, variant };
    switch (kind) {
      case Kind.Hero:
        e.movement = { tx: x, ty: y, speed: 60, moving: false };
        e.health = { hp: 100, max: 100 };
        e.combat = { damage: 12, range: 22, cooldown: 0.6, ready: 0, targetId: 0 };
        break;
      case Kind.Unit:
        e.movement = { tx: x, ty: y, speed: 42, moving: false };
        e.health = { hp: 40, max: 40 };
        e.combat = { damage: 7, range: 18, cooldown: 0.8, ready: 0, targetId: 0 };
        break;
      case Kind.Mob:
        e.movement = { tx: x, ty: y, speed: 28, moving: false };
        e.health = { hp: 26, max: 26 };
        e.combat = { damage: 5, range: 15, cooldown: 1.0, ready: 0, targetId: 0 };
        e.home = { x, y };
        break;
      case Kind.Building:
        e.health = { hp: 400, max: 400 };
        break;
      case Kind.Resource:
        e.resource = { kind: variant, amount: 500 };
        break;
      case Kind.Chest:
        break;
    }
    this.entities.set(id, e);
    return id;
  }

  despawn(id: EntityId): void {
    this.entities.delete(id);
  }

  enqueue(cmd: Command): void {
    this.commands.push(cmd);
  }

  /** deterministic worldgen: scatter resource nodes and roaming mobs */
  generate(): void {
    for (let i = 0; i < 40; i++) {
      this.spawn(Kind.Resource, 0, this.rng.range(-800, 800), this.rng.range(-800, 800));
    }
    for (let i = 0; i < 25; i++) {
      this.spawn(Kind.Mob, 0, this.rng.range(-700, 700), this.rng.range(-700, 700));
    }
  }

  // stable iteration order — every system walks entities lowest-id-first so the
  // outcome never depends on Map internals.
  private order(): EntityId[] {
    return [...this.entities.keys()].sort((a, b) => a - b);
  }

  step(): void {
    const order = this.order();
    this.applyCommands();
    this.rebuildHash(order);
    this.systemMobAI(order);
    this.systemCombat(order);
    this.systemMovement(order);
    this.systemDeath(order);
    this.tick++;
    this.time += this.dt;
  }

  private applyCommands(): void {
    for (const c of this.commands) {
      if (c.t === "spawn") {
        this.spawn(c.kind, c.owner, c.x, c.y);
        continue;
      }
      const e = this.entities.get(c.id);
      if (!e) continue;
      if (c.t === "move" && e.movement) {
        e.movement.tx = c.x;
        e.movement.ty = c.y;
        e.movement.moving = true;
        if (e.combat) e.combat.targetId = 0;
      } else if (c.t === "attack" && e.combat) {
        e.combat.targetId = c.targetId;
      }
    }
    this.commands.length = 0;
  }

  private rebuildHash(order: EntityId[]): void {
    this.hash.clear();
    for (const id of order) {
      const e = this.entities.get(id)!;
      this.hash.insert(id, e.transform.x, e.transform.y);
    }
  }

  private systemMobAI(order: EntityId[]): void {
    for (const id of order) {
      const e = this.entities.get(id);
      if (!e || e.kind !== Kind.Mob || !e.combat || e.combat.targetId) continue;
      const t = e.transform;
      this.scratch.length = 0;
      this.hash.queryBox(t.x - AGGRO_RADIUS, t.y - AGGRO_RADIUS, t.x + AGGRO_RADIUS, t.y + AGGRO_RADIUS, this.scratch);
      this.scratch.sort((a, b) => a - b);
      let best = 0;
      let bestD = AGGRO_RADIUS * AGGRO_RADIUS;
      for (const oid of this.scratch) {
        const o = this.entities.get(oid);
        if (!o || (o.kind !== Kind.Hero && o.kind !== Kind.Unit) || !o.health) continue;
        const dd = dist2(t.x, t.y, o.transform.x, o.transform.y);
        if (dd < bestD) {
          bestD = dd;
          best = oid;
        }
      }
      if (best) e.combat.targetId = best;
      else if (e.home && e.movement) {
        // no prey nearby — wander back home
        const dh = dist(t.x, t.y, e.home.x, e.home.y);
        if (dh > 8) {
          e.movement.tx = e.home.x;
          e.movement.ty = e.home.y;
          e.movement.moving = true;
        }
      }
    }
  }

  private systemCombat(order: EntityId[]): void {
    for (const id of order) {
      const e = this.entities.get(id);
      if (!e || !e.combat) continue;
      if (e.combat.ready > 0) e.combat.ready -= this.dt;
      if (!e.combat.targetId) continue;

      let target = this.entities.get(e.combat.targetId);
      if (target && (!target.health || target.health.hp <= 0)) target = undefined;
      if (!target) {
        e.combat.targetId = 0;
        continue;
      }

      // leash: a mob dragged too far from home breaks off and returns
      if (e.kind === Kind.Mob && e.home) {
        const dh = dist(e.transform.x, e.transform.y, e.home.x, e.home.y);
        if (dh > LEASH_RADIUS) {
          e.combat.targetId = 0;
          if (e.movement) {
            e.movement.tx = e.home.x;
            e.movement.ty = e.home.y;
            e.movement.moving = true;
          }
          continue;
        }
      }

      const d = dist(e.transform.x, e.transform.y, target.transform.x, target.transform.y);
      if (d > e.combat.range) {
        // chase
        if (e.movement) {
          e.movement.tx = target.transform.x;
          e.movement.ty = target.transform.y;
          e.movement.moving = true;
        }
      } else {
        if (e.movement) e.movement.moving = false;
        e.transform.facing = Math.atan2(target.transform.y - e.transform.y, target.transform.x - e.transform.x);
        if (e.combat.ready <= 0 && target.health) {
          target.health.hp -= e.combat.damage;
          e.combat.ready = e.combat.cooldown;
          // victim fights back if it's idle (defend / retaliate)
          if (target.combat && !target.combat.targetId) target.combat.targetId = e.id;
        }
      }
    }
  }

  private systemMovement(order: EntityId[]): void {
    for (const id of order) {
      const e = this.entities.get(id);
      if (!e || !e.movement || !e.movement.moving) continue;
      const m = e.movement;
      const t = e.transform;
      const dx = m.tx - t.x;
      const dy = m.ty - t.y;
      const d = Math.hypot(dx, dy);
      const stepDist = m.speed * this.dt;
      let nx: number;
      let ny: number;
      let arrived = false;
      if (d <= stepDist || d < 1e-4) {
        nx = m.tx;
        ny = m.ty;
        arrived = true;
      } else {
        nx = t.x + (dx / d) * stepDist;
        ny = t.y + (dy / d) * stepDist;
        t.facing = Math.atan2(dy, dx);
      }
      // collide with water; slide along the coast if one axis is blocked
      if (this.passableAt(nx, ny)) {
        t.x = nx;
        t.y = ny;
        if (arrived) m.moving = false;
      } else if (this.passableAt(nx, t.y)) {
        t.x = nx;
      } else if (this.passableAt(t.x, ny)) {
        t.y = ny;
      } else {
        m.moving = false;
      }
    }
  }

  private systemDeath(order: EntityId[]): void {
    for (const id of order) {
      const e = this.entities.get(id);
      if (e && e.health && e.health.hp <= 0) this.despawn(id);
    }
  }

  /** entities inside a client's area of interest, sorted by id */
  snapshotAoI(cx: number, cy: number, halfW: number, halfH: number): EntitySnapshot[] {
    this.scratch.length = 0;
    this.hash.queryBox(cx - halfW, cy - halfH, cx + halfW, cy + halfH, this.scratch);
    this.scratch.sort((a, b) => a - b);
    const out: EntitySnapshot[] = [];
    for (const id of this.scratch) {
      const e = this.entities.get(id);
      if (!e) continue;
      const t = e.transform;
      if (t.x < cx - halfW || t.x > cx + halfW || t.y < cy - halfH || t.y > cy + halfH) continue;
      out.push({
        id,
        kind: e.kind,
        variant: e.variant ?? 0,
        owner: e.faction.owner,
        x: Math.round(t.x * 100) / 100,
        y: Math.round(t.y * 100) / 100,
        facing: Math.round(t.facing * 1000) / 1000,
        hp: e.health ? e.health.hp : 0,
        max: e.health ? e.health.max : 0,
      });
    }
    return out;
  }

  /** stable fingerprint of the entire world — used to prove determinism */
  hashState(): string {
    let h = 0x811c9dc5;
    const order = this.order();
    for (const id of order) {
      const e = this.entities.get(id)!;
      const s = `${id},${e.kind},${e.faction.owner},${e.transform.x.toFixed(3)},${e.transform.y.toFixed(3)},${e.health ? e.health.hp : -1};`;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
      }
    }
    return (h >>> 0).toString(16).padStart(8, "0") + ":" + order.length;
  }
}
