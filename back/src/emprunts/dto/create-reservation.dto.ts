import { IsUUID } from 'class-validator';

/** L'étudiant réserve un livre indisponible. */
export class CreateReservationDto {
  @IsUUID('4', { message: 'Identifiant de livre invalide' })
  livreId: string;
}
