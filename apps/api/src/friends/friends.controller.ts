import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Get()
  list(@Req() req: { user: { id: string } }) {
    return this.friends.list(req.user.id);
  }

  @Post()
  add(@Req() req: { user: { id: string } }, @Body() body: { username: string }) {
    return this.friends.add(req.user.id, body?.username || '');
  }

  @Delete(':id')
  remove(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.friends.remove(req.user.id, id);
  }

  @Get('blocked/list')
  blocked(@Req() req: { user: { id: string } }) {
    return this.friends.blockedList(req.user.id);
  }

  @Post('block')
  block(@Req() req: { user: { id: string } }, @Body() body: { id: string }) {
    return this.friends.block(req.user.id, body?.id || '');
  }

  @Delete('block/:id')
  unblock(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.friends.unblock(req.user.id, id);
  }
}
