import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

/** Forme du payload décodé depuis le JWT et attaché à la requête. */
export interface AuthUser {
  id: string;
  email: string;
  roles: Role[];
}

/**
 * Récupère l'utilisateur connecté (issu du JWT) dans un contrôleur.
 * Ex : maRoute(@CurrentUser() user: AuthUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
