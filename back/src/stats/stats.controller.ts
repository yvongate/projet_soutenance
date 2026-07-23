import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  /** Tableau de bord (bibliothécaire + admin). */
  @Get('dashboard')
  @Roles(Role.BIBLIOTHECAIRE, Role.ADMINISTRATEUR)
  dashboard() {
    return this.stats.dashboard();
  }

  /** Export CSV des emprunts (admin uniquement). */
  @Get('export/emprunts')
  @Roles(Role.ADMINISTRATEUR)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="emprunts.csv"')
  exportEmprunts() {
    return this.stats.exportEmpruntsCsv();
  }

  /** Export CSV du catalogue (admin uniquement). */
  @Get('export/livres')
  @Roles(Role.ADMINISTRATEUR)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="livres.csv"')
  exportLivres() {
    return this.stats.exportLivresCsv();
  }

  /** Export CSV des utilisateurs (admin uniquement). */
  @Get('export/utilisateurs')
  @Roles(Role.ADMINISTRATEUR)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="utilisateurs.csv"')
  exportUtilisateurs() {
    return this.stats.exportUtilisateursCsv();
  }
}
