import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('shop')
@UseGuards(JwtAuthGuard)
export class ShopController {
  constructor(private readonly shop: ShopService) {}

  @Get()
  state(@Req() req: { user: { id: string } }) {
    return this.shop.state(req.user.id);
  }

  @Post('buy')
  buy(@Req() req: { user: { id: string } }, @Body() body: { itemId: string }) {
    return this.shop.buy(req.user.id, body?.itemId || '');
  }
}
