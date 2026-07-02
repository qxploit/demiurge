import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { SigninDto, SignupDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Post('signin')
  signin(@Body() dto: SigninDto) {
    return this.auth.signin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: { id: string } }) {
    return this.auth.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('status')
  setStatus(@Req() req: { user: { id: string } }, @Body() body: { status: string }) {
    return this.auth.setStatus(req.user.id, body.status);
  }

  @UseGuards(JwtAuthGuard)
  @Post('vip')
  subscribeVip(@Req() req: { user: { id: string } }) {
    return this.auth.subscribeVip(req.user.id);
  }
}
