import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { JWT_EXPIRES, JWT_SECRET } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: JWT_EXPIRES } }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
