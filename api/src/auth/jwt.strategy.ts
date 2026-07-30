import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

type JwtPayload = { sub: number; email: string; role: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    /*
     * `sub` is checked rather than trusted. User ids are integers, but a token
     * issued before they were — or any hand-edited one — carries something else,
     * and handing that straight to Prisma raises a 500 on a column type
     * mismatch. A bad subject is a bad credential, so it answers 401.
     */
    const id = Number(payload?.sub);
    if (!Number.isInteger(id)) throw new UnauthorizedException();

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, role: user.role, name: user.name };
  }
}
