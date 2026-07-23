import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/** L'étudiant ouvre un ticket : un sujet + un premier message. */
export class CreateTicketDto {
  @IsString()
  @MinLength(3, { message: 'Le sujet doit faire au moins 3 caractères' })
  @MaxLength(150)
  sujet: string;

  @IsString()
  @IsNotEmpty({ message: 'Le message ne peut pas être vide' })
  @MaxLength(2000)
  message: string;
}
