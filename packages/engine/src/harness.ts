// Headless proof that the engine is deterministic. Run: pnpm --filter @demiurge/engine test
import { World } from "./world";
import { Kind } from "./types";

function run(seed: number) {
  const w = new World({ seed, tickRate: 20 });
  w.generate();

  // a hero owned by player 1, marching across the map
  const hero = w.spawn(Kind.Hero, 1, 100, 100);
  w.enqueue({ t: "move", id: hero, x: 400, y: 350 });

  // a squad of 3 units ordered to attack the nearest mob after 1s
  const units = [w.spawn(Kind.Unit, 1, 0, 0), w.spawn(Kind.Unit, 1, 20, 0), w.spawn(Kind.Unit, 1, 40, 0)];

  for (let i = 0; i < 400; i++) {
    if (i === 20) {
      // order units to hunt: attack the first surviving mob
      for (const [id, e] of w.entities) {
        if (e.kind === Kind.Mob) {
          for (const u of units) w.enqueue({ t: "attack", id: u, targetId: id });
          break;
        }
      }
    }
    w.step();
  }

  const h = w.get(hero);
  return {
    tick: w.tick,
    entities: w.count,
    heroPos: h ? { x: Math.round(h.transform.x), y: Math.round(h.transform.y) } : null,
    hash: w.hashState(),
  };
}

const a = run(1337);
const b = run(1337);
const c = run(9001);

console.log("run A (seed 1337):", a);
console.log("run C (seed 9001):", { tick: c.tick, entities: c.entities, heroPos: c.heroPos, hash: c.hash });
console.log("");
console.log("determinism  A === B (same seed):", a.hash === b.hash ? "PASS" : "FAIL");
console.log("divergence   A !== C (diff seed):", a.hash !== c.hash ? "PASS" : "FAIL");

if (a.hash !== b.hash || a.hash === c.hash) process.exit(1);
console.log("\nengine core: deterministic ✓");
