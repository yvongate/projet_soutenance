import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CatalogueService } from './catalogue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Gestion des exemplaires physiques.
 * La génération/impression du QR Code est réservée à l'Administrateur (§3 du cahier des charges).
 */
@Controller('exemplaires')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExemplairesController {
  constructor(private readonly catalogue: CatalogueService) {}

  /** Image du QR Code (PNG en Data URL) pour étiquetage physique. */
  @Get(':id/qrcode')
  @Roles(Role.ADMINISTRATEUR)
  qrcode(@Param('id') id: string) {
    return this.catalogue.getQrCode(id);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRATEUR)
  remove(@Param('id') id: string) {
    return this.catalogue.removeExemplaire(id);
  }
}
