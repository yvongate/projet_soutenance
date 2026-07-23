import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  /** Réserver un livre indisponible. */
  @Post()
  @Roles(Role.ETUDIANT)
  reserver(
    @Body() dto: CreateReservationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reservations.reserver(dto.livreId, userId);
  }

  /** Voir mes réservations et ma position dans la file. */
  @Get('mes-reservations')
  @Roles(Role.ETUDIANT)
  mesReservations(@CurrentUser('id') userId: string) {
    return this.reservations.mesReservations(userId);
  }

  /** Annuler une de mes réservations. */
  @Post(':id/annuler')
  @Roles(Role.ETUDIANT)
  annuler(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.reservations.annuler(id, userId);
  }
}
