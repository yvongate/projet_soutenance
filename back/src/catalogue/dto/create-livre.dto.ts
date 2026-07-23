import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLivreDto {
  @IsString()
  @MinLength(1)
  titre: string;

  @IsString()
  @MinLength(1)
  auteur: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsString()
  @MinLength(1)
  categorie: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  couverture?: string; // URL de l'image de couverture

  @IsOptional()
  @IsString()
  cote?: string; // cote de rangement

  /** Nombre d'exemplaires physiques à créer d'emblée (chacun avec son QR Code). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  nombreExemplaires?: number;
}
