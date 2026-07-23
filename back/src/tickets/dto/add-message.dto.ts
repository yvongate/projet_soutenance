import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Ajouter un message à un ticket existant (étudiant propriétaire ou staff). */
export class AddMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Le message ne peut pas être vide' })
  @MaxLength(2000)
  contenu: string;
}
