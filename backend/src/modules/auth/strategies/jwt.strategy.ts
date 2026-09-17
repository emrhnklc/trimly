import 'dotenv/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service';

type JwtPayload = {
  sub: string;
  email: string;
  sid?: string;
  authVersion?: number;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  sessionId: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is not configured.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sid) {
      throw new UnauthorizedException('Oturum geçersiz veya süresi dolmuş.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        authSessions: { some: { id: payload.sid, revokedAt: null } },
      },
      select: {
        authVersion: true,
        deletedAt: true,
        email: true,
        emailVerifiedAt: true,
      },
    });

    if (
      !user?.emailVerifiedAt ||
      user.deletedAt ||
      user.authVersion !== (payload.authVersion ?? 0)
    ) {
      throw new UnauthorizedException('Oturum geçersiz veya süresi dolmuş.');
    }

    return {
      id: payload.sub,
      email: user.email,
      sessionId: payload.sid,
    };
  }
}
