import { Controller, Get, NotFoundException, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { FriendsService } from '../friends/friends.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly friends: FriendsService,
  ) {}

  @Get(':username')
  profile(@Req() req: { user: { id: string } }, @Param('username') username: string) {
    const u = this.users.findByUsername(username);
    if (!u) throw new NotFoundException('Player not found.');
    return {
      ...this.users.publicProfile(u),
      isFriend: this.friends.isFriend(req.user.id, u.id),
      isBlocked: this.friends.isBlocked(req.user.id, u.id),
      isSelf: u.id === req.user.id,
    };
  }
}
