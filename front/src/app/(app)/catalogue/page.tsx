'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import type { LivreListItem, Paginated } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dispo } from '@/components/dispo';
import { BookCover } from '@/components/book-cover';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { cacheLivres, livresDepuisCache } from '@/lib/db';

const LIMIT = 12;

export default function CataloguePage() {
  const [q, setQ] = useState('');
  const [categorie, setCategorie] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [livres, setLivres] = useState<LivreListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Catégories (via l'endpoint dédié)
  useEffect(() => {
    api<string[]>('/livres/categories')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Recherche + pagination (avec anti-rebond)
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (categorie) params.set('categorie', categorie);
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      api<Paginated<LivreListItem>>(`/livres?${params.toString()}`)
        .then((res) => {
          setLivres(res.items);
          setTotal(res.total);
          void cacheLivres(res.items);
        })
        .catch(async () => {
          // Hors ligne : lecture depuis le cache local (Dexie), filtré
          const cache = await livresDepuisCache();
          const ql = q.trim().toLowerCase();
          const filtres = cache.filter((l) => {
            const okQ =
              !ql ||
              l.titre.toLowerCase().includes(ql) ||
              l.auteur.toLowerCase().includes(ql) ||
              (l.isbn ?? '').toLowerCase().includes(ql);
            const okCat = !categorie || l.categorie === categorie;
            return okQ && okCat;
          });
          setLivres(filtres);
          setTotal(filtres.length);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q, categorie, page]);

  function changerRecherche(v: string) {
    setPage(1);
    setQ(v);
  }
  function changerCategorie(c: string | null) {
    setPage(1);
    setCategorie(c);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catalogue</h1>
        <p className="text-muted-foreground">
          Recherchez et consultez les livres de la bibliothèque
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Titre, auteur ou ISBN…"
          value={q}
          onChange={(e) => changerRecherche(e.target.value)}
          className="pl-9"
        />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Chip actif={categorie === null} onClick={() => changerCategorie(null)}>
            Toutes
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c}
              actif={categorie === c}
              onClick={() => changerCategorie(c)}
            >
              {c}
            </Chip>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : livres.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun livre trouvé"
          description="Essayez un autre terme de recherche ou changez de catégorie."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {livres.map((livre) => (
              <Link key={livre.id} href={`/livres/${livre.id}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardContent className="flex gap-4 p-4">
                    <BookCover
                      src={livre.couverture}
                      alt={livre.titre}
                      className="h-20 w-14 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{livre.titre}</h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {livre.auteur}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {livre.categorie}
                      </Badge>
                      <div className="mt-2">
                        <Dispo
                          dispo={livre.nbDisponibles}
                          total={livre.nbExemplaires}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function Chip({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        actif
          ? 'border-primary bg-primary text-primary-foreground'
          : 'bg-background hover:bg-accent'
      }`}
    >
      {children}
    </button>
  );
}
