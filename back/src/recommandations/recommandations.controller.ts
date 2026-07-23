import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RecommandationsService } from './recommandations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('recommandations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecommandationsController {
  constructor(private readonly recommandations: RecommandationsService) {}

  /** Recommandations personnalisées pour l'étudiant connecté. */
  @Get()
  @Roles(Role.ETUDIANT)
  pourMoi(@CurrentUser('id') userId: string) {
    return this.recommandations.pourUtilisateur(userId);
  }
}
