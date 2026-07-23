import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CatalogueService } from './catalogue.service';
import { CreateLivreDto } from './dto/create-livre.dto';
import { UpdateLivreDto } from './dto/update-livre.dto';
import { SearchLivreDto } from './dto/search-livre.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Catalogue des livres.
 * - Consultation / recherche : tous les rôles connectés.
 * - Ajout / modif / suppression : Administrateur uniquement.
 */
@Controller('livres')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Post()
  @Roles(Role.ADMINISTRATEUR)
  create(@Body() dto: CreateLivreDto) {
    return this.catalogue.createLivre(dto);
  }

  @Get()
  findAll(@Query() search: SearchLivreDto) {
    return this.catalogue.findAllLivres(search);
  }

  /** Catégories distinctes (déclarée AVANT :id pour éviter le conflit de route). */
  @Get('categories')
  categories() {
    return this.catalogue.categories();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catalogue.findOneLivre(id);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRATEUR)
  update(@Param('id') id: string, @Body() dto: UpdateLivreDto) {
    return this.catalogue.updateLivre(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRATEUR)
  remove(@Param('id') id: string) {
    return this.catalogue.removeLivre(id);
  }

  /** Ajouter un exemplaire physique (avec QR Code) à un livre. */
  @Post(':id/exemplaires')
  @Roles(Role.ADMINISTRATEUR)
  addExemplaire(@Param('id') id: string) {
    return this.catalogue.addExemplaire(id);
  }
}
