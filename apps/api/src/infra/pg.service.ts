import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, type QueryResultRow } from 'pg';

// Connects only when DATABASE_URL is set (docker compose). Otherwise stays null
// so local dev keeps running on the file-backed stores.
@Injectable()
export class PgService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('Postgres');
  pool: Pool | null = null;

  onModuleInit(): void {
    const url = process.env.DATABASE_URL;
    if (!url) {
      this.log.log('DATABASE_URL not set — Postgres disabled');
      return;
    }
    this.pool = new Pool({ connectionString: url });
    this.pool
      .query('SELECT 1')
      .then(() => this.log.log('Postgres connected'))
      .catch((e) => this.log.warn(`Postgres: ${(e as Error).message}`));
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) {
    if (!this.pool) throw new Error('Postgres not configured (set DATABASE_URL)');
    return this.pool.query<T>(text, params as unknown[]);
  }
}
