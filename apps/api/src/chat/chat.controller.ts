import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  recent() {
    return this.chat.recent(60);
  }

  @Post()
  send(@Req() req: { user: { id: string; username: string } }, @Body() body: { text: string }) {
    const text = (body?.text || '').trim();
    if (!text) return { ok: false };
    return this.chat.add(req.user.id, req.user.username, text);
  }
}
