import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { UsersService, UserSummary } from '../users/users.service';

interface Clan {
  id: string;
  name: string;
  tag: string;
  ownerId: string;
  memberIds: string[];
  requests: string[];
  discord: string;
  createdAt: number;
}

export interface ClanView {
  id: string;
  name: string;
  tag: string;
  ownerId: string;
  discord: string;
  isOwner: boolean;
  members: UserSummary[];
  requests: UserSummary[]; // only populated for the owner
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'clans.json');
const MAX_MEMBERS = 20;
const CLAN_COST = 5000;

@Injectable()
export class ClanService {
  private clans: Clan[] = [];

  constructor(private readonly users: UsersService) {
    try {
      const raw: Clan[] = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
      this.clans = raw.map((c) => ({ ...c, requests: c.requests ?? [], discord: c.discord ?? '' }));
    } catch {
      this.clans = [];
    }
  }

  private save(): void {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(this.clans, null, 2));
  }

  private clanOf(userId: string): Clan | undefined {
    return this.clans.find((c) => c.memberIds.includes(userId));
  }

  private summaries(ids: string[]): UserSummary[] {
    return ids.map((id) => this.users.summary(id)).filter((s): s is UserSummary => s !== null);
  }

  private view(c: Clan, viewerId: string): ClanView {
    const isOwner = c.ownerId === viewerId;
    return {
      id: c.id,
      name: c.name,
      tag: c.tag,
      ownerId: c.ownerId,
      discord: c.discord,
      isOwner,
      members: this.summaries(c.memberIds),
      requests: isOwner ? this.summaries(c.requests) : [],
    };
  }

  private ownedClan(ownerId: string): Clan {
    const c = this.clanOf(ownerId);
    if (!c) throw new NotFoundException('You are not in a clan.');
    if (c.ownerId !== ownerId) throw new ForbiddenException('Only the leader can do that.');
    return c;
  }

  myClan(userId: string): ClanView | null {
    const c = this.clanOf(userId);
    return c ? this.view(c, userId) : null;
  }

  browse(userId: string) {
    return this.clans.map((c) => ({
      id: c.id,
      name: c.name,
      tag: c.tag,
      members: c.memberIds.length,
      discord: c.discord,
      requested: c.requests.includes(userId),
    }));
  }

  create(userId: string, name: string, tag: string): ClanView {
    name = (name || '').trim();
    tag = (tag || '').trim().toUpperCase();
    if (name.length < 3 || name.length > 24) throw new BadRequestException('Clan name must be 3-24 characters.');
    if (!/^[A-Z0-9]{2,5}$/.test(tag)) throw new BadRequestException('Tag must be 2-5 letters/numbers.');
    if (this.clanOf(userId)) throw new BadRequestException('You are already in a clan.');
    if (this.clans.some((c) => c.tag === tag)) throw new BadRequestException('That tag is taken.');
    if (!this.users.spendGold(userId, CLAN_COST)) {
      throw new BadRequestException(`Creating a clan costs ${CLAN_COST.toLocaleString()} gold.`);
    }
    const clan: Clan = { id: randomUUID(), name, tag, ownerId: userId, memberIds: [userId], requests: [], discord: '', createdAt: Date.now() };
    this.clans.push(clan);
    this.save();
    return this.view(clan, userId);
  }

  requestJoin(userId: string, clanId: string) {
    if (this.clanOf(userId)) throw new BadRequestException('You are already in a clan.');
    const c = this.clans.find((x) => x.id === clanId);
    if (!c) throw new NotFoundException('Clan not found.');
    if (c.memberIds.length >= MAX_MEMBERS) throw new BadRequestException('That clan is full.');
    if (!c.requests.includes(userId)) c.requests.push(userId);
    this.save();
    return { requested: true };
  }

  cancelRequest(userId: string, clanId: string) {
    const c = this.clans.find((x) => x.id === clanId);
    if (c) {
      c.requests = c.requests.filter((id) => id !== userId);
      this.save();
    }
    return { requested: false };
  }

  acceptRequest(ownerId: string, userId: string): ClanView {
    const c = this.ownedClan(ownerId);
    if (!c.requests.includes(userId)) throw new NotFoundException('No such request.');
    c.requests = c.requests.filter((id) => id !== userId);
    if (this.clanOf(userId)) {
      this.save();
      throw new BadRequestException('That player already joined a clan.');
    }
    if (c.memberIds.length < MAX_MEMBERS) c.memberIds.push(userId);
    this.save();
    return this.view(c, ownerId);
  }

  denyRequest(ownerId: string, userId: string): ClanView {
    const c = this.ownedClan(ownerId);
    c.requests = c.requests.filter((id) => id !== userId);
    this.save();
    return this.view(c, ownerId);
  }

  updateSettings(ownerId: string, data: { discord?: string; name?: string }): ClanView {
    const c = this.ownedClan(ownerId);
    if (data.discord !== undefined) c.discord = (data.discord || '').trim().slice(0, 200);
    if (data.name !== undefined) {
      const n = data.name.trim();
      if (n.length < 3 || n.length > 24) throw new BadRequestException('Clan name must be 3-24 characters.');
      c.name = n;
    }
    this.save();
    return this.view(c, ownerId);
  }

  kick(ownerId: string, userId: string): ClanView {
    const c = this.ownedClan(ownerId);
    if (userId === ownerId) throw new BadRequestException('You cannot kick yourself.');
    c.memberIds = c.memberIds.filter((id) => id !== userId);
    this.save();
    return this.view(c, ownerId);
  }

  leave(userId: string): null {
    const c = this.clanOf(userId);
    if (!c) return null;
    c.memberIds = c.memberIds.filter((id) => id !== userId);
    if (c.memberIds.length === 0) {
      this.clans = this.clans.filter((x) => x.id !== c.id);
    } else if (c.ownerId === userId) {
      c.ownerId = c.memberIds[0];
    }
    this.save();
    return null;
  }
}
