// Proof that weekly world generation is deterministic and rotates each week.
// Run: pnpm --filter @demiurge/engine worldgen
import { generateWorld, weekSeed, populate, type GeneratedWorld } from "./worldgen";
import { World } from "./world";
import { Biome } from "./types";

function summarize(gen: GeneratedWorld) {
  const hist = new Array(10).fill(0);
  for (let i = 0; i < gen.tiles.biome.length; i++) hist[gen.tiles.biome[i]]++;
  const total = gen.tiles.biome.length;
  return {
    biomes: hist.map((n, i) => `${Biome[i]} ${((100 * n) / total).toFixed(1)}%`),
    resources: gen.resources.length,
    monsterCamps: gen.camps.length,
    chests: gen.chests.length,
    settlements: gen.settlements.length,
  };
}

function fingerprint(gen: GeneratedWorld): string {
  let h = 0x811c9dc5;
  const b = gen.tiles.biome;
  for (let i = 0; i < b.length; i++) {
    h ^= b[i];
    h = Math.imul(h, 0x01000193);
  }
  return `${(h >>> 0).toString(16)}:${gen.resources.length}:${gen.camps.length}:${gen.chests.length}`;
}

const s1 = weekSeed(2026, 27);
const w1a = generateWorld({ seed: s1, size: 256 });
const w1b = generateWorld({ seed: s1, size: 256 });
const s2 = weekSeed(2026, 28);
const w2 = generateWorld({ seed: s2, size: 256 });

console.log("week 2026-W27 seed:", s1, "\n");
console.log("W27 summary:", summarize(w1a));
console.log("\nfingerprint W27:", fingerprint(w1a));
console.log("fingerprint W28:", fingerprint(w2));
console.log("");
console.log("weekly determinism (W27 a === b):", fingerprint(w1a) === fingerprint(w1b) ? "PASS" : "FAIL");
console.log("weekly rotation   (W27 !== W28):", fingerprint(w1a) !== fingerprint(w2) ? "PASS" : "FAIL");

// drop the generated features into a live sim world and tick it
const world = new World({ seed: s1, tickRate: 20 });
populate(world, w1a);
const before = world.count;
for (let i = 0; i < 100; i++) world.step();
console.log("");
console.log(`populated sim: ${before} entities -> ${world.count} after 100 ticks (monsters fighting/dying live)`);

if (fingerprint(w1a) !== fingerprint(w1b) || fingerprint(w1a) === fingerprint(w2)) process.exit(1);
console.log("\nworld generation: deterministic weekly global maps OK");
