import { IsOptional, IsString, MinLength } from 'class-validator';

/** Modification d'un livre (Administrateur uniquement). Tous les champs facultatifs. */
export class UpdateLivreDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  titre?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  auteur?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  categorie?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  couverture?: string;

  @IsOptional()
  @IsString()
  cote?: string;
}
