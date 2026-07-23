import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Déclare les rôles autorisés sur une route.
 * Ex : @Roles(Role.ADMINISTRATEUR, Role.BIBLIOTHECAIRE)
 * L'accès est accordé si l'utilisateur possède AU MOINS un de ces rôles.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
