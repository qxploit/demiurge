import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { PgService } from './pg.service';

@Global()
@Module({
  providers: [RedisService, PgService],
  exports: [RedisService, PgService],
})
export class InfraModule {}
