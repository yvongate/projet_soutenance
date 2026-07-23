import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

/** Modification d'un compte (réservé à l'Administrateur). */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nom?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  prenom?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true, message: 'Rôle invalide' })
  roles?: Role[];

  @IsOptional()
  @IsBoolean()
  actif?: boolean; // pour désactiver/réactiver un compte
}
