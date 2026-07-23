import { IsEnum, IsOptional } from 'class-validator';
import { StatutTicket } from '@prisma/client';
import { PaginationDto } from '../../common/pagination';

/** Filtre + pagination de la liste des tickets (staff). */
export class TicketsQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(StatutTicket, { message: 'Statut invalide' })
  statut?: StatutTicket;
}
