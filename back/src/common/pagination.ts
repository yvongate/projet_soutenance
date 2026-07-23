import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Paramètres de pagination communs (query params `page` et `limit`). */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

/** Réponse paginée standard. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** Calcule skip/take pour Prisma à partir de la pagination. */
export function skipTake(p: { page: number; limit: number }) {
  return { skip: (p.page - 1) * p.limit, take: p.limit };
}
