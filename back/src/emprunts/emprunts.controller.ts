import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EmpruntsService } from './emprunts.service';
import { PaginationDto } from '../common/pagination';
import { ScannerLivreDto } from './dto/scanner-livre.dto';
import { ValiderEmpruntDto } from './dto/valider-emprunt.dto';
import { RetourDto } from './dto/retour.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('emprunts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpruntsController {
  constructor(private readonly emprunts: EmpruntsService) {}

  /** Étape 1 : l'étudiant scanne le QR du livre → QR de transaction. */
  @Post('scanner')
  @Roles(Role.ETUDIANT)
  scanner(@Body() dto: ScannerLivreDto, @CurrentUser('id') userId: string) {
    return this.emprunts.scannerLivre(dto.qrCode, userId);
  }

  /** Étape 2 : le bibliothécaire valide en scannant le QR de transaction. */
  @Post('valider')
  @Roles(Role.BIBLIOTHECAIRE, Role.ADMINISTRATEUR)
  valider(@Body() dto: ValiderEmpruntDto) {
    return this.emprunts.validerEmprunt(dto.token);
  }

  /** Retour d'un livre (scan du QR du livre par le bibliothécaire). */
  @Post('retour')
  @Roles(Role.BIBLIOTHECAIRE, Role.ADMINISTRATEUR)
  retour(@Body() dto: RetourDto) {
    return this.emprunts.enregistrerRetour(dto.qrCode);
  }

  /** L'étudiant consulte ses emprunts. */
  @Get('mes-emprunts')
  @Roles(Role.ETUDIANT)
  mesEmprunts(@CurrentUser('id') userId: string) {
    return this.emprunts.mesEmprunts(userId);
  }

  /** Historique global des emprunts (paginé). */
  @Get('historique')
  @Roles(Role.BIBLIOTHECAIRE, Role.ADMINISTRATEUR)
  historique(@Query() pagination: PaginationDto) {
    return this.emprunts.historique(pagination);
  }
}
