import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ClanService } from './clan.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('clan')
@UseGuards(JwtAuthGuard)
export class ClanController {
  constructor(private readonly clan: ClanService) {}

  @Get()
  mine(@Req() req: { user: { id: string } }) {
    return this.clan.myClan(req.user.id);
  }

  @Get('browse')
  browse(@Req() req: { user: { id: string } }) {
    return this.clan.browse(req.user.id);
  }

  @Post()
  create(@Req() req: { user: { id: string } }, @Body() body: { name: string; tag: string }) {
    return this.clan.create(req.user.id, body?.name || '', body?.tag || '');
  }

  @Post('request')
  request(@Req() req: { user: { id: string } }, @Body() body: { clanId: string }) {
    return this.clan.requestJoin(req.user.id, body?.clanId || '');
  }

  @Post('request/cancel')
  cancelRequest(@Req() req: { user: { id: string } }, @Body() body: { clanId: string }) {
    return this.clan.cancelRequest(req.user.id, body?.clanId || '');
  }

  @Post('requests/accept')
  accept(@Req() req: { user: { id: string } }, @Body() body: { userId: string }) {
    return this.clan.acceptRequest(req.user.id, body?.userId || '');
  }

  @Post('requests/deny')
  deny(@Req() req: { user: { id: string } }, @Body() body: { userId: string }) {
    return this.clan.denyRequest(req.user.id, body?.userId || '');
  }

  @Patch('settings')
  settings(@Req() req: { user: { id: string } }, @Body() body: { discord?: string; name?: string }) {
    return this.clan.updateSettings(req.user.id, body || {});
  }

  @Post('kick')
  kick(@Req() req: { user: { id: string } }, @Body() body: { userId: string }) {
    return this.clan.kick(req.user.id, body?.userId || '');
  }

  @Post('leave')
  leave(@Req() req: { user: { id: string } }) {
    return this.clan.leave(req.user.id);
  }
}
