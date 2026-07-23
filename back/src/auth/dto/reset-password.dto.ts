import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Jeton manquant' })
  token: string;

  @IsString()
  @MinLength(6, {
    message: 'Le nouveau mot de passe doit faire au moins 6 caractères',
  })
  nouveauMotDePasse: string;
}
