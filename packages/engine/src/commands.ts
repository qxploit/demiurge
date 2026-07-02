import type { EntityId, Kind } from "./types";

// A Command is a validated player/AI intent applied at the start of a tick.
// The server is authoritative: clients send these, the sim decides the outcome.
export type Command =
  | { t: "move"; id: EntityId; x: number; y: number }
  | { t: "attack"; id: EntityId; targetId: EntityId }
  | { t: "spawn"; kind: Kind; owner: number; x: number; y: number };
