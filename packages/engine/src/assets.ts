// The single source of truth binding every art pack to a gameplay role. Paths
// are relative to the repo `assets/` folder. Nothing in here is decorative -
// each pack has a job, so "use every asset" is enforced by design. The client
// renderer resolves these keys to concrete sprites/atlas frames.

import { Biome, BuildingType, ClanColor, MonsterSpecies, ResourceType } from "./types";

export const PACKS = {
  ground: "MiniWorldSprites/Ground", // terrain / biome tiles
  nature: "MiniWorldSprites/Nature", // trees, rocks, bushes -> resource nodes
  objects: "MiniWorldSprites/Objects", // chests, props, decor
  misc: "MiniWorldSprites/Miscellaneous", // effects, markers, banners
  champions: "MiniWorldSprites/Characters/Champions", // hero avatars
  workers: "MiniWorldSprites/Characters/Workers", // villagers / gatherers
  animals: "MiniWorldSprites/Animals", // passive wildlife
  ui: "MiniWorldSprites/User Interface", // in-world UI bits
  monsters: "PunyCharacters/Puny-Characters", // goblins / soldiers / enemies
  punyEnv: "PunyCharacters/Puny-Characters/Environment",
  dungeon: "PunyDungeon/PUNY_DUNGEON_v1/Tiled", // dungeon-match interiors
  world: "PunyWorld", // extra overworld terrain
  icons: "RPGIcons_CC-BY-SA", // item / bag / shop icons
  plus: "MiniWorldPlus", // indoor + rainbow-refresh extensions
} as const;

// Each clan colour maps 1:1 to a MiniWorldSprites building set - a clan's whole
// village (town center, houses, walls, towers...) is drawn in its colour.
export const CLAN_BUILDING_SET: Record<ClanColor, string> = {
  [ClanColor.Cyan]: "MiniWorldSprites/Buildings/Cyan",
  [ClanColor.Lime]: "MiniWorldSprites/Buildings/Lime",
  [ClanColor.Purple]: "MiniWorldSprites/Buildings/Purple",
  [ClanColor.Red]: "MiniWorldSprites/Buildings/Red",
  [ClanColor.Neutral]: "MiniWorldSprites/Buildings/Wood",
  [ClanColor.Enemy]: "MiniWorldSprites/Buildings/Enemy",
};

// Ground-tile key per biome (resolved to a frame in the Ground sheet).
export const BIOME_TILE: Record<Biome, string> = {
  [Biome.DeepWater]: "ground/water_deep",
  [Biome.Water]: "ground/water",
  [Biome.Sand]: "ground/sand",
  [Biome.Grass]: "ground/grass",
  [Biome.Forest]: "ground/grass_dark",
  [Biome.Savanna]: "ground/grass_dry",
  [Biome.Desert]: "ground/sand_dune",
  [Biome.Hills]: "ground/dirt",
  [Biome.Mountain]: "ground/rock",
  [Biome.Snow]: "ground/snow",
};

// Resource node sprite (from Nature) per resource type.
export const RESOURCE_SPRITE: Record<ResourceType, string> = {
  [ResourceType.Wood]: "nature/tree",
  [ResourceType.Stone]: "nature/rock",
  [ResourceType.Ore]: "nature/rock_ore",
  [ResourceType.Gold]: "nature/rock_gold",
  [ResourceType.Food]: "nature/bush_berry",
  [ResourceType.Crystal]: "nature/crystal",
};

// Enemy sprite (from PunyCharacters) per monster species.
export const MONSTER_SPRITE: Record<MonsterSpecies, string> = {
  [MonsterSpecies.Goblin]: "monsters/goblin",
  [MonsterSpecies.Wolf]: "monsters/wolf",
  [MonsterSpecies.Slime]: "monsters/slime",
  [MonsterSpecies.Skeleton]: "monsters/skeleton",
  [MonsterSpecies.Bandit]: "monsters/bandit",
  [MonsterSpecies.Orc]: "monsters/orc",
  [MonsterSpecies.Troll]: "monsters/troll",
};

// Building sprite key per structure (colourised by the clan's building set).
export const BUILDING_SPRITE: Record<BuildingType, string> = {
  [BuildingType.TownCenter]: "buildings/town_center",
  [BuildingType.House]: "buildings/house",
  [BuildingType.Barracks]: "buildings/barracks",
  [BuildingType.Wall]: "buildings/wall",
  [BuildingType.Tower]: "buildings/tower",
  [BuildingType.Farm]: "buildings/farm",
  [BuildingType.Mine]: "buildings/mine",
  [BuildingType.LumberMill]: "buildings/lumber_mill",
  [BuildingType.Market]: "buildings/market",
};

// Loot item id -> RPGIcons sprite key (bag / chest / shop). Keys match loot.ts.
export const ITEM_ICON: Record<string, string> = {
  coin: "icons/coin",
  gem: "icons/gem",
  apple: "icons/apple",
  bread: "icons/bread",
  "potion-minor": "icons/potion_red_s",
  potion: "icons/potion_red",
  scroll: "icons/scroll",
  tome: "icons/tome",
  dagger: "icons/dagger",
  "short-sword": "icons/sword_short",
  "long-sword": "icons/sword_long",
  greatsword: "icons/sword_great",
  "war-axe": "icons/axe",
  "demiurge-blade": "icons/sword_legendary",
  "leather-cap": "icons/helm_leather",
  buckler: "icons/shield_small",
  chainmail: "icons/armor_chain",
  "plate-armor": "icons/armor_plate",
  "ring-copper": "icons/ring_copper",
  "ring-silver": "icons/ring_silver",
  "dragon-ring": "icons/ring_dragon",
  amulet: "icons/amulet",
  crown: "icons/crown",
  relic: "icons/relic",
  starfragment: "icons/star",
};
