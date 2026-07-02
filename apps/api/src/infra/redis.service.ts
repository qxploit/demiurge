import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

// Connects only when REDIS_URL is set (docker compose). Otherwise stays null so
// local dev keeps running on the file-backed stores.
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('Redis');
  client: Redis | null = null;

  onModuleInit(): void {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.log.log('REDIS_URL not set - Redis disabled');
      return;
    }
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 300, 2000)),
    });
    this.client.on('connect', () => this.log.log('Redis connected'));
    this.client.on('error', (e) => this.log.warn(`Redis: ${e.message}`));
  }

  onModuleDestroy(): void {
    this.client?.disconnect();
  }
}
