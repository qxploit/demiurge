import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WorldService } from './world.service';
import { GameGateway } from './game.gateway';
import { GearModule } from '../gear/gear.module';
import { JWT_EXPIRES, JWT_SECRET } from '../auth/constants';

@Module({
  imports: [GearModule, JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: JWT_EXPIRES } })],
  providers: [WorldService, GameGateway],
})
export class GameModule {}
