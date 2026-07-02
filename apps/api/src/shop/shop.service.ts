import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: 'frame' | 'banner' | 'title' | 'emote' | 'boost';
}

const CATALOG: ShopItem[] = [
  { id: 'frame-gold', name: 'Gilded Frame', price: 300, category: 'frame' },
  { id: 'frame-ember', name: 'Ember Frame', price: 550, category: 'frame' },
  { id: 'frame-void', name: 'Void Frame', price: 900, category: 'frame' },
  { id: 'banner-sun', name: 'Sun Sigil Banner', price: 250, category: 'banner' },
  { id: 'banner-dune', name: 'Dune Banner', price: 250, category: 'banner' },
  { id: 'title-warlord', name: 'Title: Warlord', price: 800, category: 'title' },
  { id: 'title-nomad', name: 'Title: Nomad', price: 400, category: 'title' },
  { id: 'emote-bow', name: 'Emote: Bow', price: 200, category: 'emote' },
  { id: 'emote-taunt', name: 'Emote: Taunt', price: 200, category: 'emote' },
  { id: 'boost-xp', name: 'XP Boost (1h)', price: 150, category: 'boost' },
];

@Injectable()
export class ShopService {
  constructor(private readonly users: UsersService) {}

  state(userId: string) {
    const u = this.users.findById(userId);
    const owned = u?.inventory || [];
    return {
      gold: u?.gold ?? 0,
      items: CATALOG.map((i) => ({ ...i, owned: owned.includes(i.id) })),
    };
  }

  buy(userId: string, itemId: string) {
    const item = CATALOG.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('No such item.');
    const u = this.users.findById(userId);
    if (!u) throw new NotFoundException('User not found.');
    if (u.inventory.includes(itemId)) throw new BadRequestException('You already own that.');
    if (!this.users.spendGold(userId, item.price)) throw new BadRequestException('Not enough gold.');
    this.users.addItem(userId, itemId);
    return this.state(userId);
  }
}
