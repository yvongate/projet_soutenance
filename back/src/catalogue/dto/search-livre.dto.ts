import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/pagination';

/** Filtres de recherche du catalogue (query params) + pagination. */
export class SearchLivreDto extends PaginationDto {
  /** Recherche libre : titre, auteur ou ISBN. */
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  categorie?: string;
}
