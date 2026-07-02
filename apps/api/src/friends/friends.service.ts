import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UsersService, UserSummary } from '../users/users.service';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'friends.json');
const BLOCKS_FILE = path.join(DATA_DIR, 'blocks.json');

@Injectable()
export class FriendsService {
  // userId -> list of friend userIds (mutual)
  private map: Record<string, string[]> = {};
  // userId -> list of blocked userIds (one-directional)
  private blocks: Record<string, string[]> = {};

  constructor(private readonly users: UsersService) {
    try {
      this.map = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    } catch {
      this.map = {};
    }
    try {
      this.blocks = JSON.parse(fs.readFileSync(BLOCKS_FILE, 'utf-8'));
    } catch {
      this.blocks = {};
    }
  }

  private save(): void {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(this.map, null, 2));
  }

  private saveBlocks(): void {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(BLOCKS_FILE, JSON.stringify(this.blocks, null, 2));
  }

  isFriend(a: string, b: string): boolean {
    return (this.map[a] || []).includes(b);
  }

  isBlocked(a: string, b: string): boolean {
    return (this.blocks[a] || []).includes(b);
  }

  list(userId: string): UserSummary[] {
    return (this.map[userId] || [])
      .map((id) => this.users.summary(id))
      .filter((s): s is UserSummary => s !== null);
  }

  add(userId: string, username: string): UserSummary[] {
    const friend = this.users.findByUsername((username || '').trim());
    if (!friend) throw new NotFoundException('No player with that name.');
    if (friend.id === userId) throw new BadRequestException('You cannot add yourself.');
    if (this.isBlocked(userId, friend.id)) throw new BadRequestException('Unblock them first.');
    this.map[userId] = this.map[userId] || [];
    this.map[friend.id] = this.map[friend.id] || [];
    if (this.map[userId].includes(friend.id)) {
      throw new BadRequestException('Already friends.');
    }
    this.map[userId].push(friend.id);
    this.map[friend.id].push(userId);
    this.save();
    return this.list(userId);
  }

  remove(userId: string, friendId: string): UserSummary[] {
    this.map[userId] = (this.map[userId] || []).filter((id) => id !== friendId);
    this.map[friendId] = (this.map[friendId] || []).filter((id) => id !== userId);
    this.save();
    return this.list(userId);
  }

  blockedList(userId: string): UserSummary[] {
    return (this.blocks[userId] || [])
      .map((id) => this.users.summary(id))
      .filter((s): s is UserSummary => s !== null);
  }

  block(userId: string, targetId: string): UserSummary[] {
    if (userId === targetId) throw new BadRequestException('You cannot block yourself.');
    if (!this.users.findById(targetId)) throw new NotFoundException('Player not found.');
    this.blocks[userId] = this.blocks[userId] || [];
    if (!this.blocks[userId].includes(targetId)) this.blocks[userId].push(targetId);
    // blocking drops any friendship both ways
    this.map[userId] = (this.map[userId] || []).filter((id) => id !== targetId);
    this.map[targetId] = (this.map[targetId] || []).filter((id) => id !== userId);
    this.save();
    this.saveBlocks();
    return this.blockedList(userId);
  }

  unblock(userId: string, targetId: string): UserSummary[] {
    this.blocks[userId] = (this.blocks[userId] || []).filter((id) => id !== targetId);
    this.saveBlocks();
    return this.blockedList(userId);
  }
}
