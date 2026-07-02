import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { GearService } from './gear.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('gear')
@UseGuards(JwtAuthGuard)
export class GearController {
  constructor(private readonly gear: GearService) {}

  @Get()
  state(@Req() req: { user: { id: string } }) {
    return this.gear.state(req.user.id);
  }

  @Post('buy')
  buy(@Req() req: { user: { id: string } }, @Body() body: { weaponId: string }) {
    return this.gear.buy(req.user.id, body?.weaponId || '');
  }

  @Post('equip')
  equip(@Req() req: { user: { id: string } }, @Body() body: { weaponId: string }) {
    return this.gear.equip(req.user.id, body?.weaponId || '');
  }

  @Post('enchant')
  enchant(@Req() req: { user: { id: string } }, @Body() body: { weaponId: string }) {
    return this.gear.enchant(req.user.id, body?.weaponId || '');
  }
}
