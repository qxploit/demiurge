# Demiurge - Core Logic (every asset has a job)

A 2D open-world MMORPG/RTS. One global map regenerates weekly. Clans found
villages, claim territory, gather, build defenses, and war. The sim is
server-authoritative and deterministic.

> **On "3D":** the packs are 2D pixel art - they can't become real 3D models.
> What we CAN do (next visual pass) is a **2.5D depth look**: y-sorted sprites,
> drop shadows, elevation via cliff tiles, and tall building sprites drawn with
> a height offset. That reads like a polished Pokémon/Zelda overworld.

## Terrain - `Ground/`, `PunyWorld`, `MiniWorldPlus/terrain`
Biomes drive **walkability + movement**: deep water/water = impassable (need a
boat or bridge), sand/grass/forest = walkable, mountain = slow. Cliffs give
elevation (2.5D layering).

## Nature - `Nature/` (Trees, PineTrees, Rocks, Cactus, Wheatfield, Tumbleweed)
**Resource nodes.** Trees → Wood, Rocks → Stone/Ore/Gold, Wheatfield/berries →
Food, Cactus/crystal → rare. Workers harvest them; nodes deplete and regrow.

## Buildings - `Buildings/<ClanColor>/` (one colour per clan)
Clan **village** structures, each with a function:
- **Keep / TownCenter** - claims territory (projection radius), respawn/**HOME** point.
- **House / Hut** - population cap (more villagers).
- **Barracks** - trains **Soldiers** (melee/archer/mage).
- **Tower / Wall** - **defense** (towers auto-shoot intruders).
- **Market** - trade resources ↔ gold. **Tavern** - recruit heroes.
- **Docks** - build **boats/ships**. **Workshop** - upgrades. **Chapel** - buffs.

## Heroes - `Characters/Champions/` (Arthax, Grum, Zhinja…)
Playable **player avatars** (the MMO layer). Each champion = a class/skin. Damage
scales with the **equipped sword** (see Weapons). ✅ combat + equip live.

## Workers - `Characters/Workers/` (Farmer)
**Villager units**: gather resources, construct buildings, repair. Non-combat.

## Soldiers - `Characters/Soldiers/Melee|Ranged/<ClanColor>/` (Swordsman, Archer…)
**RTS combat units**, trained at Barracks, owned by a clan:
- **Swordsman** - melee frontline. **Archer** - ranged. **Mage** - AoE/caster.
- Follow move/attack orders, auto-retaliate, defend territory, siege enemy villages.

## Monsters - `PunyCharacters/`, champion stand-ins (hostile faction 999)
Each species has distinct AI (aggro + **leash to home** already live):
- **Goblin** - pack raiders; roam forests, raid nearby resources/villages.
- **Wolf** - wildlife; hunt in packs, aggressive.
- **Slime** - weak; splits into two smaller slimes on death.
- **Skeleton** - undead; spawn from ruins/deserts, stronger at night.
- **Bandit** - ambush players/caravans on routes, drop gold.
- **Orc** - heavy; siege villages in groups.
- **Troll** - mini-boss; guards mountains + high-tier chests.

## Chests - `Objects`, `MiniWorldPlus/chests`
**Treasure.** Walk up + open → loot (coins + weapons/items by rarity). Better
loot in dangerous biomes. ✅ generation + loot table live.

## Weapons - `Objects/` swords + gear system  ✅ LIVE
Swords are **tiers with power** (Rusty → Iron → Steel → Ember → Frost →
Demiurge Blade). Buy in the Bag, **equip** (the sword becomes your **cursor**),
**enchant** (+15% power/level, up to +5). Equipped power = hero damage.

## Boats & Ships - `Miscellaneous/Boat, WarShip, TransportShip, PirateShip`, clan `Ship/Dock`
**Water travel + naval layer.** Built at Docks. Boat = personal crossing,
TransportShip = move units/goods, WarShip = naval combat, **PirateShip** = enemy
raiders that attack coasts. Bridges (`Miscellaneous/Bridge`) = buildable land
crossing over water.

## Animals - `Animals/` (Horse, MarineAnimals)
**Horse** = mount (faster travel). **MarineAnimals** = water wildlife/mobs.

## Icons - `RPGIcons/Icons.png` (60-icon atlas)
UI item icons: bag, shop, chest loot, consumables (potions, food, rings, gems).

## Items / Decor - `Objects`, `Miscellaneous`, `MiniWorldPlus/things`
Projectiles (arrows, fireball, ballista bolt) for ranged combat; banners, props,
effects for world decoration.

---
### Build order from here
1. **Interaction**: harvest nodes, open chests → bag, attack tuning. (combat ✅)
2. **Villages**: place Keep → claim zone → build houses/walls/towers (clan colour).
3. **Units**: Barracks trains Soldiers/Workers; move/attack commands.
4. **2.5D visual pass**: y-sort, shadows, cliffs, tall buildings; PunyWorld autotiles.
5. **Water**: Docks → boats, bridges, naval combat, PirateShip raids.
6. **Mounts, markets, matchmaking battles, weekly reset rewards.**
