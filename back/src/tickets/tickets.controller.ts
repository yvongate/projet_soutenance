import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketsQueryDto } from './dto/tickets-query.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  // ---- Étudiant ----

  /** Ouvrir un ticket. */
  @Post()
  @Roles(Role.ETUDIANT)
  creer(@Body() dto: CreateTicketDto, @CurrentUser('id') userId: string) {
    return this.tickets.creerTicket(userId, dto);
  }

  /** Mes tickets. */
  @Get('mes-tickets')
  @Roles(Role.ETUDIANT)
  mesTickets(@CurrentUser('id') userId: string) {
    return this.tickets.mesTickets(userId);
  }

  /** Badge étudiant : réponses non lues. */
  @Get('mes-tickets/non-lus')
  @Roles(Role.ETUDIANT)
  monBadge(@CurrentUser('id') userId: string) {
    return this.tickets.compteNonLusEtudiant(userId);
  }

  // ---- Staff (boîte partagée) ----

  /** Tous les tickets (paginé), filtrable par ?statut=OUVERT|EN_COURS|FERME. */
  @Get()
  @Roles(Role.BIBLIOTHECAIRE, Role.ADMINISTRATEUR)
  tous(@Query() query: TicketsQueryDto) {
    return this.tickets.tousLesTickets(query);
  }

  /** Badge staff : messages d'étudiants non lus. */
  @Get('non-lus')
  @Roles(Role.BIBLIOTHECAIRE, Role.ADMINISTRATEUR)
  badgeStaff() {
    return this.tickets.compteNonLusStaff();
  }

  // ---- Commun (accès contrôlé dans le service) ----

  /** Détail d'un ticket + messages. */
  @Get(':id')
  voir(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tickets.voirTicket(id, user);
  }

  /** Répondre / ajouter un message. */
  @Post(':id/messages')
  repondre(
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tickets.repondre(id, user, dto);
  }

  /** Fermer un ticket. */
  @Post(':id/fermer')
  fermer(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tickets.fermer(id, user);
  }

  /** Rouvrir un ticket. */
  @Post(':id/rouvrir')
  rouvrir(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tickets.rouvrir(id, user);
  }
}
