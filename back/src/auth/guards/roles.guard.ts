import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../decorators/current-user.decorator';

/**
 * Guard « as-tu le bon rôle ? » : à utiliser APRÈS JwtAuthGuard.
 * Accorde l'accès si l'utilisateur possède au moins un des rôles requis.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Aucune restriction de rôle sur cette route
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: AuthUser }>();

    const autorise = user?.roles?.some((role) => requiredRoles.includes(role));
    if (!autorise) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits nécessaires pour cette action",
      );
    }
    return true;
  }
}
