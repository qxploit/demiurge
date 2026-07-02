export type EntityId = number;

// The world is a single continuous 2D space. Everything alive in it is an
// Entity with a Kind and an optional set of components. This is deliberately an
// "archetype object" ECS (component-per-field) - simple, cache-friendly enough
// for tens of thousands of entities, and trivially deterministic to iterate.
export enum Kind {
  Hero = 0, // the player's avatar (MMO layer)
  Unit = 1, // a commandable RTS unit
  Building = 2, // base / structure
  Resource = 3, // harvestable node
  Mob = 4, // hostile wildlife / creeps
  Chest = 5, // lootable treasure
}

export enum Rarity {
  Common = 0,
  Uncommon = 1,
  Rare = 2,
  Epic = 3,
  Legendary = 4,
}

export interface Transform {
  x: number;
  y: number;
  facing: number; // radians
}

export interface Movement {
  tx: number; // target x
  ty: number; // target y
  speed: number; // world units / second
  moving: boolean;
}

export interface Health {
  hp: number;
  max: number;
}

export interface Faction {
  owner: number; // 0 = neutral / world, else playerId / nationId
}

export interface Combat {
  damage: number;
  range: number;
  cooldown: number; // seconds between attacks
  ready: number; // seconds until next attack allowed
  targetId: EntityId; // 0 = none
}

export interface ResourceNode {
  kind: number; // resource type id
  amount: number;
}

export interface Entity {
  id: EntityId;
  kind: Kind;
  transform: Transform;
  faction: Faction;
  variant?: number; // subtype the renderer uses to pick a sprite (species / building / resource type)
  home?: { x: number; y: number }; // leash anchor (mobs return here)
  movement?: Movement;
  health?: Health;
  combat?: Combat;
  resource?: ResourceNode;
}

// ---- world taxonomy (each value binds to real sprites via assets.ts) ----

export enum Biome {
  DeepWater = 0,
  Water = 1,
  Sand = 2,
  Grass = 3,
  Forest = 4,
  Savanna = 5,
  Desert = 6,
  Hills = 7,
  Mountain = 8,
  Snow = 9,
}

export enum ResourceType {
  Wood = 0,
  Stone = 1,
  Ore = 2,
  Gold = 3,
  Food = 4,
  Crystal = 5,
}

export enum MonsterSpecies {
  Goblin = 0,
  Wolf = 1,
  Slime = 2,
  Skeleton = 3,
  Bandit = 4,
  Orc = 5,
  Troll = 6,
}

export enum BuildingType {
  TownCenter = 0, // projects territory claim, respawn/home point
  House = 1,
  Barracks = 2, // trains soldiers
  Wall = 3, // defense
  Tower = 4, // defense (ranged)
  Farm = 5, // food
  Mine = 6, // stone/ore
  LumberMill = 7, // wood
  Market = 8, // trade
}

// clan team colours map 1:1 to the six MiniWorldSprites building sets
export enum ClanColor {
  Cyan = 0,
  Lime = 1,
  Purple = 2,
  Red = 3,
  Neutral = 4,
  Enemy = 5,
}

// What the netcode ships to a client for one entity inside its area of interest.
export interface EntitySnapshot {
  id: EntityId;
  kind: Kind;
  variant: number;
  owner: number;
  x: number;
  y: number;
  facing: number;
  hp: number;
  max: number;
}
