import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export type UserStatus = 'online' | 'idle' | 'dnd' | 'invisible';

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  status: UserStatus;
  level: number; // 1..100
  xp: number;
  prestige: number; // 0..10
  gold: number;
  inventory: string[]; // owned shop item ids
  vip: boolean;
  weapons: { id: string; enchant: number }[]; // owned swords
  equipped: string; // equipped weapon id (also the cursor)
  createdAt: number;
}

export interface UserSummary {
  id: string;
  username: string;
  status: UserStatus;
  level: number;
  prestige: number;
  vip: boolean;
}

export const LEVEL_CAP = 100;
export const PRESTIGE_CAP = 10;

// XP required to advance from `level` to the next one.
export function xpToNext(level: number): number {
  return 100 + (level - 1) * 40;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'users.json');

@Injectable()
export class UsersService {
  private users: User[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw: User[] = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
      this.users = raw.map((u) => ({
        ...u,
        status: u.status ?? 'online',
        level: u.level ?? 1,
        xp: u.xp ?? 0,
        prestige: u.prestige ?? 0,
        gold: u.gold ?? 500,
        inventory: u.inventory ?? [],
        vip: u.vip ?? false,
        weapons: u.weapons ?? [{ id: 'rusty', enchant: 0 }],
        equipped: u.equipped ?? 'rusty',
      }));
    } catch {
      this.users = [];
    }
  }

  private save(): void {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(this.users, null, 2));
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findByUsername(username: string): User | undefined {
    return this.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  findById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  summary(id: string): UserSummary | null {
    const u = this.findById(id);
    if (!u) return null;
    return { id: u.id, username: u.username, status: u.status, level: u.level, prestige: u.prestige, vip: u.vip };
  }

  publicProfile(u: User) {
    return {
      id: u.id,
      username: u.username,
      status: u.status,
      level: u.level,
      prestige: u.prestige,
      vip: u.vip,
      joined: u.createdAt,
    };
  }

  create(data: { email: string; username: string; passwordHash: string }): User {
    const user: User = {
      id: randomUUID(),
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      status: 'online',
      level: 1,
      xp: 0,
      prestige: 0,
      gold: 500,
      inventory: [],
      vip: false,
      weapons: [{ id: 'rusty', enchant: 0 }],
      equipped: 'rusty',
      createdAt: Date.now(),
    };
    this.users.push(user);
    this.save();
    return user;
  }

  updateStatus(id: string, status: UserStatus): User | undefined {
    const u = this.findById(id);
    if (u) {
      u.status = status;
      this.save();
    }
    return u;
  }

  // Award XP, rolling levels over and prestiging at the cap.
  addXp(id: string, amount: number): User | undefined {
    const u = this.findById(id);
    if (!u || amount <= 0) return u;
    u.xp += amount;
    while (u.xp >= xpToNext(u.level)) {
      u.xp -= xpToNext(u.level);
      if (u.level < LEVEL_CAP) {
        u.level += 1;
      } else if (u.prestige < PRESTIGE_CAP) {
        u.prestige += 1;
        u.level = 1;
      } else {
        u.xp = 0; // fully maxed
        break;
      }
    }
    this.save();
    return u;
  }

  spendGold(id: string, amount: number): boolean {
    const u = this.findById(id);
    if (!u || u.gold < amount) return false;
    u.gold -= amount;
    this.save();
    return true;
  }

  addItem(id: string, itemId: string): void {
    const u = this.findById(id);
    if (u && !u.inventory.includes(itemId)) {
      u.inventory.push(itemId);
      this.save();
    }
  }

  setVip(id: string, vip: boolean): User | undefined {
    const u = this.findById(id);
    if (u) {
      u.vip = vip;
      this.save();
    }
    return u;
  }

  addWeapon(id: string, wid: string): void {
    const u = this.findById(id);
    if (u && !u.weapons.some((w) => w.id === wid)) {
      u.weapons.push({ id: wid, enchant: 0 });
      this.save();
    }
  }

  equipWeapon(id: string, wid: string): void {
    const u = this.findById(id);
    if (u && u.weapons.some((w) => w.id === wid)) {
      u.equipped = wid;
      this.save();
    }
  }

  enchantWeapon(id: string, wid: string): number {
    const u = this.findById(id);
    const w = u?.weapons.find((x) => x.id === wid);
    if (w) {
      w.enchant += 1;
      this.save();
      return w.enchant;
    }
    return 0;
  }
}

