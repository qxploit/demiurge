<div align="center">

# ⚔️ Demiurge

**A 2D open-world MMORPG / RTS hybrid.**
One global map regenerates every week. Clans found villages, claim territory,
gather, build defenses, and go to war — while a deterministic, server-authoritative
world ticks beneath it all.

*Source-available · contributors welcome · not for commercial use or clones*

</div>

---

## What it is

Demiurge is a persistent 2D world you play in the browser. You're both a **hero**
(walk the map, fight, loot) and a **commander** (build a village, train units,
claim land with your clan). The entire world lives on the server — the client is
a thin renderer, so there's no game logic to cheat.

- 🌍 **Weekly global world** — every player shares one map, regenerated each ISO
  week from a deterministic seed (biomes, rivers, mountains, resources, monster
  camps, chests, settlement sites).
- 🧭 **Live open world** — walk a continent rendered from pixel-art sprites,
  camera-follow, click-to-move, water collision.
- ⚔️ **Combat** — attack monsters, auto-retaliate, monster leashing; damage
  scales with your equipped sword.
- 🗡️ **Weapons & gear** — swords in power tiers; buy, equip (**the sword becomes
  your cursor**), and enchant them.
- 👥 **Social** — global encrypted chat, party (up to 4), friends + block,
  player profile cards, clans (browse / request-to-join / Discord / settings),
  shop, VIP, leveling + prestige.

See **[`GAME_LOGIC.md`](./GAME_LOGIC.md)** for the full design — every asset's
role and behavior (goblins raid, soldiers defend, boats sail, rivers need
bridges, etc.).

## Tech

Turborepo · pnpm workspaces

| Package | What |
|---|---|
| `packages/engine` (`@demiurge/engine`) | Framework-agnostic **deterministic sim** — ECS, fixed-timestep tick, seeded RNG, spatial hash, area-of-interest snapshots, world generation. |
| `apps/api` | **NestJS 11** — REST (auth/chat/friends/clans/shop/gear) + **socket.io** game gateway running the world at 20 Hz. |
| `apps/web` | **Next 16** + React 19 + Tailwind v4 — lobby HUD + `<canvas>` world renderer. |
| infra | **Postgres 16** + **Redis 7** via Docker (env-gated in the backend). |

Server-authoritative + deterministic: same seed + same inputs → byte-identical
world, so the server is the single source of truth and everything is replayable.

## Getting started

```bash
pnpm install
pnpm --filter @demiurge/engine build     # build the shared sim once

# run both dev servers (separate terminals)
pnpm --filter api start:dev               # http://localhost:3001
pnpm --filter web dev                     # http://localhost:3000
```

Postgres/Redis are optional in dev (the backend falls back to file stores).
To run the full stack with databases:

```bash
docker compose up --build                 # web :3000 · api :3001 · pg :5433 · redis :6380
```

Prove the engine is deterministic:

```bash
pnpm --filter @demiurge/engine test       # sim determinism
pnpm --filter @demiurge/engine worldgen   # weekly worldgen
```

## Repo layout

```
apps/
  api/        NestJS backend (auth, social, gear, game gateway, infra)
  web/        Next.js frontend (HUD + world canvas)
packages/
  engine/     deterministic sim + world generation
assets/       pixel-art packs (see assets/README.txt for licenses)
docker-compose.yml · Dockerfile
```

## Contributing

Contributions are welcome — fork, branch, and open a PR. By contributing you
agree your work is licensed to the project under the repo license.

## License

Source-available under the **[Demiurge Source-Available License](./LICENSE)**:
read it, learn from it, contribute back — but **no commercial use and no
clones/variants**. Art under `/assets` keeps its own CC0 / CC-BY / CC-BY-SA
licenses.
