import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  World,
  generateWorld,
  populate,
  weekSeed,
  Kind,
  type EntitySnapshot,
  type GeneratedWorld,
} from '@demiurge/engine';
import { GearService } from '../gear/gear.service';

const TICK_MS = 50; // 20 Hz simulation
const VIEW_HALF = 520; // area-of-interest half-extent, world px

interface Player {
  userId: string;
  username: string;
  heroId: number;
}

function isoWeek(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
    );
  return { year: date.getUTCFullYear(), week };
}

function factionOf(userId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < userId.length; i++) {
    h ^= userId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 900000) + 1; // 1..900000 (0 = neutral, 999 = mobs)
}

// Owns the one global, weekly-regenerated world and advances it at a fixed tick.
@Injectable()
export class WorldService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('WorldService');
  world!: World;
  gen!: GeneratedWorld;
  season = { year: 0, week: 0, seed: 0 };

  private players = new Map<string, Player>(); // socketId -> player
  private timer?: ReturnType<typeof setInterval>;
  private onTick?: () => void;

  constructor(private readonly gear: GearService) {}

  // spawn a hero for a player and scale its damage to the equipped weapon
  private spawnHero(p: Player): number {
    const { x, y } = this.homeFor(p);
    const id = this.world.spawn(Kind.Hero, factionOf(p.userId), x, y);
    const h = this.world.get(id);
    if (h && h.combat) h.combat.damage = 8 + this.gear.equippedPower(p.userId);
    return id;
  }

  onModuleInit(): void {
    const { year, week } = isoWeek(new Date());
    const seed = weekSeed(year, week);
    this.season = { year, week, seed };
    this.gen = generateWorld({ seed, size: 256, tileSize: 16 });
    this.world = new World({ seed, tickRate: 20 });
    populate(this.world, this.gen);
    this.log.log(
      `world ${year}-W${week} (seed ${seed}): ${this.world.count} entities, ${this.gen.settlements.length} settlement sites`,
    );
    this.timer = setInterval(() => {
      this.world.step();
      this.onTick?.();
    }, TICK_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  setTickListener(fn: () => void): void {
    this.onTick = fn;
  }

  mapMeta() {
    return {
      size: this.gen.size,
      tileSize: this.gen.tileSize,
      season: this.season,
      online: this.players.size,
      biome: Buffer.from(this.gen.tiles.biome).toString('base64'),
    };
  }

  private homeFor(_p: Player): { x: number; y: number } {
    const ts = this.gen.tileSize;
    const s = this.gen.settlements[0];
    return s ? { x: s.tx * ts, y: s.ty * ts } : { x: 0, y: 0 };
  }

  join(socketId: string, userId: string, username: string) {
    const p: Player = { userId, username, heroId: 0 };
    p.heroId = this.spawnHero(p);
    this.players.set(socketId, p);
    const h = this.world.get(p.heroId);
    return { heroId: p.heroId, x: h?.transform.x ?? 0, y: h?.transform.y ?? 0, faction: h?.faction.owner ?? 0 };
  }

  leave(socketId: string): void {
    const p = this.players.get(socketId);
    if (p) {
      this.world.despawn(p.heroId);
      this.players.delete(socketId);
    }
  }

  move(socketId: string, x: number, y: number): void {
    const p = this.players.get(socketId);
    if (p) this.world.enqueue({ t: 'move', id: p.heroId, x, y });
  }

  attack(socketId: string, targetId: number): void {
    const p = this.players.get(socketId);
    if (p) this.world.enqueue({ t: 'attack', id: p.heroId, targetId });
  }

  // For each connected player: respawn a dead hero at home, then build its AoI
  // snapshot centred on the hero.
  eachPlayer(fn: (socketId: string, heroId: number, snap: EntitySnapshot[]) => void): void {
    for (const [sid, p] of this.players) {
      let h = this.world.get(p.heroId);
      if (!h) {
        p.heroId = this.spawnHero(p);
        h = this.world.get(p.heroId);
      }
      const cx = h ? h.transform.x : 0;
      const cy = h ? h.transform.y : 0;
      fn(sid, p.heroId, this.world.snapshotAoI(cx, cy, VIEW_HALF, VIEW_HALF));
    }
  }
}
