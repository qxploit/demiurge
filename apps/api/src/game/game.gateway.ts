import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { WorldService } from './world.service';
import { JWT_SECRET } from '../auth/constants';

@WebSocketGateway({ path: '/gamesock', addTrailingSlash: false, cors: { origin: true } })
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly world: WorldService,
    private readonly jwt: JwtService,
  ) {}

  afterInit(): void {
    // stream area-of-interest snapshots to every player each simulation tick
    this.world.setTickListener(() => {
      this.world.eachPlayer((sid, heroId, ents) => {
        const socket = this.server.sockets.sockets.get(sid);
        if (socket) socket.emit('snap', { tick: this.world.world.tick, hero: heroId, ents });
      });
    });
  }

  handleConnection(client: Socket): void {
    try {
      const raw = client.handshake.auth?.token || (client.handshake.query?.token as string);
      const payload = this.jwt.verify<{ sub: string; username: string }>(raw, { secret: JWT_SECRET });
      const info = this.world.join(client.id, payload.sub, payload.username);
      client.emit('welcome', { ...this.world.mapMeta(), you: info });
    } catch {
      client.emit('kick', 'auth failed');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.world.leave(client.id);
  }

  @SubscribeMessage('move')
  onMove(@ConnectedSocket() c: Socket, @MessageBody() b: { x: number; y: number }): void {
    if (b && Number.isFinite(b.x) && Number.isFinite(b.y)) this.world.move(c.id, b.x, b.y);
  }

  @SubscribeMessage('attack')
  onAttack(@ConnectedSocket() c: Socket, @MessageBody() b: { targetId: number }): void {
    if (b && Number.isFinite(b.targetId)) this.world.attack(c.id, b.targetId);
  }
}
