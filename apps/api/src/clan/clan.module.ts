import { Module } from '@nestjs/common';
import { ClanController } from './clan.controller';
import { ClanService } from './clan.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ClanController],
  providers: [ClanService],
})
export class ClanModule {}
