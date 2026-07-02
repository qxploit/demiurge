import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

export interface Weapon {
  id: string;
  name: string;
  tier: number;
  power: number;
  price: number;
  color: string; // tint used for the icon + the in-game cursor
}

// Every sword is a tier with a power level. The equipped one drives your damage
// AND becomes your cursor.
export const WEAPONS: Weapon[] = [
  { id: 'rusty', name: 'Rusty Blade', tier: 0, power: 4, price: 0, color: '#8a7355' },
  { id: 'iron', name: 'Iron Sword', tier: 1, power: 10, price: 120, color: '#c9cdd4' },
  { id: 'steel', name: 'Steel Sword', tier: 2, power: 18, price: 350, color: '#eef2f7' },
  { id: 'ember', name: 'Ember Blade', tier: 3, power: 30, price: 900, color: '#ff8a3c' },
  { id: 'frost', name: 'Frost Fang', tier: 4, power: 44, price: 2000, color: '#7fd3f5' },
  { id: 'demiurge', name: 'Demiurge Blade', tier: 5, power: 70, price: 6000, color: '#c07adf' },
];

const MAX_ENCHANT = 5;
const byId = (id: string): Weapon | undefined => WEAPONS.find((w) => w.id === id);
const powerWith = (id: string, enchant: number): number => {
  const w = byId(id);
  return w ? Math.round(w.power * (1 + 0.15 * enchant)) : 0;
};
const enchantCost = (w: Weapon, enchant: number): number => Math.round((w.price * 0.5 + 60) * (enchant + 1));

@Injectable()
export class GearService {
  constructor(private readonly users: UsersService) {}

  equippedPower(userId: string): number {
    const u = this.users.findById(userId);
    if (!u) return 0;
    const w = u.weapons.find((x) => x.id === u.equipped);
    return w ? powerWith(w.id, w.enchant) : 0;
  }

  state(userId: string) {
    const u = this.users.findById(userId);
    if (!u) throw new NotFoundException();
    const owned = new Set(u.weapons.map((w) => w.id));
    return {
      gold: u.gold,
      equipped: u.equipped,
      maxEnchant: MAX_ENCHANT,
      weapons: WEAPONS.map((w) => {
        const e = u.weapons.find((x) => x.id === w.id);
        return {
          ...w,
          owned: owned.has(w.id),
          enchant: e ? e.enchant : 0,
          effectivePower: e ? powerWith(w.id, e.enchant) : w.power,
          enchantCost: enchantCost(w, e ? e.enchant : 0),
        };
      }),
    };
  }

  buy(userId: string, wid: string) {
    const w = byId(wid);
    if (!w) throw new NotFoundException('No such weapon.');
    const u = this.users.findById(userId);
    if (!u) throw new NotFoundException();
    if (u.weapons.some((x) => x.id === wid)) throw new BadRequestException('Already owned.');
    if (!this.users.spendGold(userId, w.price)) throw new BadRequestException('Not enough gold.');
    this.users.addWeapon(userId, wid);
    return this.state(userId);
  }

  equip(userId: string, wid: string) {
    const u = this.users.findById(userId);
    if (!u || !u.weapons.some((x) => x.id === wid)) throw new BadRequestException("You don't own that.");
    this.users.equipWeapon(userId, wid);
    return this.state(userId);
  }

  enchant(userId: string, wid: string) {
    const w = byId(wid);
    const u = this.users.findById(userId);
    const owned = u?.weapons.find((x) => x.id === wid);
    if (!w || !u || !owned) throw new BadRequestException("You don't own that.");
    if (owned.enchant >= MAX_ENCHANT) throw new BadRequestException('Already at max enchant.');
    if (!this.users.spendGold(userId, enchantCost(w, owned.enchant))) throw new BadRequestException('Not enough gold.');
    this.users.enchantWeapon(userId, wid);
    return this.state(userId);
  }
}
