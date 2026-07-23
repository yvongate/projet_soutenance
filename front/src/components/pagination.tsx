'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Contrôles de pagination (Précédent / page X / Suivant) à placer en bas d'une liste. */
export function Pagination({
  page,
  total,
  limit,
  onPage,
}: {
  page: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        Précédent
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} / {totalPages}
        <span className="hidden sm:inline"> · {total} résultats</span>
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Suivant
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
