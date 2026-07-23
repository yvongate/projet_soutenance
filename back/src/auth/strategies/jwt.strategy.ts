import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
}

/**
 * Vérifie le JWT présent dans l'en-tête Authorization: Bearer <token>.
 * Recharge l'utilisateur en base pour s'assurer qu'il existe toujours et est actif.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'change_me',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.actif) {
      throw new UnauthorizedException('Compte introuvable ou désactivé');
    }

    return { id: user.id, email: user.email, roles: user.roles };
  }
}
