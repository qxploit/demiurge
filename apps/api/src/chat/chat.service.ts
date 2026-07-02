import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
  scryptSync,
} from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface StoredMsg {
  id: string;
  userId: string;
  username: string;
  iv: string;
  ct: string;
  tag: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  createdAt: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'chat.json');
// AES-256-GCM key derived from a secret; messages are stored encrypted at rest.
const KEY = scryptSync(process.env.CHAT_SECRET || 'demiurge-chat-secret-change-me', 'demiurge-chat-salt', 32);
const MAX = 500;

@Injectable()
export class ChatService {
  private msgs: StoredMsg[] = [];

  constructor() {
    try {
      this.msgs = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    } catch {
      this.msgs = [];
    }
  }

  private save(): void {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(this.msgs));
  }

  private encrypt(text: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', KEY, iv);
    const ct = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return {
      iv: iv.toString('base64'),
      ct: ct.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
    };
  }

  private decrypt(m: StoredMsg): string {
    try {
      const decipher = createDecipheriv('aes-256-gcm', KEY, Buffer.from(m.iv, 'base64'));
      decipher.setAuthTag(Buffer.from(m.tag, 'base64'));
      return Buffer.concat([decipher.update(Buffer.from(m.ct, 'base64')), decipher.final()]).toString('utf8');
    } catch {
      return '';
    }
  }

  add(userId: string, username: string, text: string): ChatMessage {
    const clean = text.slice(0, 500);
    const { iv, ct, tag } = this.encrypt(clean);
    const m: StoredMsg = { id: randomUUID(), userId, username, iv, ct, tag, createdAt: Date.now() };
    this.msgs.push(m);
    if (this.msgs.length > MAX) this.msgs = this.msgs.slice(-MAX);
    this.save();
    return { id: m.id, username, text: clean, createdAt: m.createdAt };
  }

  recent(limit = 60): ChatMessage[] {
    return this.msgs.slice(-limit).map((m) => ({
      id: m.id,
      username: m.username,
      text: this.decrypt(m),
      createdAt: m.createdAt,
    }));
  }
}
