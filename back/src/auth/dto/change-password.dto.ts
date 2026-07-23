import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Changement de mot de passe (utilisé notamment à la première connexion).
 * On revérifie l'ancien mot de passe : pas besoin d'être déjà authentifié par JWT.
 */
export class ChangePasswordDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Ancien mot de passe requis' })
  ancienMotDePasse: string;

  @IsString()
  @MinLength(6, {
    message: 'Le nouveau mot de passe doit faire au moins 6 caractères',
  })
  nouveauMotDePasse: string;
}
