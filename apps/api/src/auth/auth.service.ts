import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus, UsersService, xpToNext } from '../users/users.service';
import { SigninDto, SignupDto } from './dto';

const STATUSES: UserStatus[] = ['online', 'idle', 'dnd', 'invisible'];

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const email = (dto.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new BadRequestException('A valid email is required.');
    }
    if (!dto.username || dto.username.trim().length < 3) {
      throw new BadRequestException('Username must be at least 3 characters.');
    }
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }
    if (this.users.findByEmail(email)) {
      throw new ConflictException('That email is already registered.');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.users.create({ email, username: dto.username.trim(), passwordHash });
    return this.tokenFor(user);
  }

  async signin(dto: SigninDto) {
    const email = (dto.email || '').trim().toLowerCase();
    const user = this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid email or password.');
    const ok = await bcrypt.compare(dto.password || '', user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid email or password.');
    return this.tokenFor(user);
  }

  getProfile(userId: string) {
    const u = this.users.findById(userId);
    if (!u) throw new UnauthorizedException();
    return this.publicUser(u);
  }

  setStatus(userId: string, status: string) {
    if (!STATUSES.includes(status as UserStatus)) {
      throw new BadRequestException('Invalid status.');
    }
    const u = this.users.updateStatus(userId, status as UserStatus);
    if (!u) throw new UnauthorizedException();
    return this.publicUser(u);
  }

  // Payment integration (Stripe / crypto) comes later; for now this flips the flag.
  subscribeVip(userId: string) {
    const u = this.users.setVip(userId, true);
    if (!u) throw new UnauthorizedException();
    return this.publicUser(u);
  }

  private publicUser(u: User) {
    return {
      id: u.id,
      email: u.email,
      username: u.username,
      status: u.status,
      level: u.level,
      xp: u.xp,
      prestige: u.prestige,
      xpToNext: xpToNext(u.level),
      vip: u.vip,
    };
  }

  private tokenFor(user: User) {
    const payload = { sub: user.id, email: user.email, username: user.username };
    return {
      token: this.jwt.sign(payload),
      user: this.publicUser(user),
    };
  }
}
