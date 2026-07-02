import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';
import { FriendsModule } from './friends/friends.module';
import { ClanModule } from './clan/clan.module';
import { ShopModule } from './shop/shop.module';
import { GameModule } from './game/game.module';
import { GearModule } from './gear/gear.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [InfraModule, UsersModule, AuthModule, ChatModule, FriendsModule, ClanModule, ShopModule, GameModule, GearModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
