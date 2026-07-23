import { Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RappelsService } from './rappels.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('rappels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RappelsController {
  constructor(private readonly rappels: RappelsService) {}

  /** Déclenche manuellement les rappels J-3 (utile pour la démonstration). */
  @Post('executer')
  @Roles(Role.ADMINISTRATEUR)
  async executer() {
    const count = await this.rappels.executer();
    return { message: `${count} rappel(s) envoyé(s)`, count };
  }
}
