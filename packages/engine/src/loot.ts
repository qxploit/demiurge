import { Rng } from "./rng";
import { Rarity } from "./types";

// Loot pools. Item ids are stable keys the client resolves to RPGIcons sprites
// (see assets.ts ITEM_ICONS). Rarer chests roll from richer pools and drop more.
const POOLS: Record<Rarity, readonly string[]> = {
  [Rarity.Common]: ["coin", "dagger", "leather-cap", "apple", "potion-minor"],
  [Rarity.Uncommon]: ["short-sword", "buckler", "potion", "ring-copper", "bread"],
  [Rarity.Rare]: ["long-sword", "chainmail", "ring-silver", "scroll", "gem"],
  [Rarity.Epic]: ["war-axe", "plate-armor", "amulet", "greatsword", "tome"],
  [Rarity.Legendary]: ["demiurge-blade", "crown", "relic", "dragon-ring", "starfragment"],
};

const COINS: Record<Rarity, readonly [number, number]> = {
  [Rarity.Common]: [5, 25],
  [Rarity.Uncommon]: [20, 60],
  [Rarity.Rare]: [50, 150],
  [Rarity.Epic]: [150, 400],
  [Rarity.Legendary]: [400, 1200],
};

export interface Loot {
  coins: number;
  items: string[];
}

export function rollLoot(rng: Rng, rarity: Rarity): Loot {
  const [lo, hi] = COINS[rarity];
  const coins = Math.round(rng.range(lo, hi));
  const pool = POOLS[rarity];
  const drops = 1 + rng.int(0, rarity >= Rarity.Rare ? 2 : 1);
  const items: string[] = [];
  for (let i = 0; i < drops; i++) items.push(rng.pick(pool));
  return { coins, items };
}
