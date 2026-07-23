import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  matricule?: string; // requis pour un étudiant, facultatif sinon

  @IsString()
  @MinLength(2)
  nom: string;

  @IsString()
  @MinLength(2)
  prenom: string;

  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  /**
   * Rôles du compte. Par défaut [ETUDIANT] si non fourni.
   * Un bibliothécaire ne peut créer que des comptes ETUDIANT (contrôlé côté service).
   */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Role, { each: true, message: 'Rôle invalide' })
  roles?: Role[];
}
