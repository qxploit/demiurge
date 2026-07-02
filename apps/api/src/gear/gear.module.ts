import { Module } from '@nestjs/common';
import { GearController } from './gear.controller';
import { GearService } from './gear.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [GearController],
  providers: [GearService],
  exports: [GearService],
})
export class GearModule {}
