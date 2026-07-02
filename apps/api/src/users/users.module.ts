import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

// Single shared UsersService instance for every feature module.
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
