import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/pagination';

/** Filtres de la liste des utilisateurs (recherche + pagination). */
export class UsersQueryDto extends PaginationDto {
  /** Recherche libre : nom, prénom, email ou matricule. */
  @IsOptional()
  @IsString()
  q?: string;
}
