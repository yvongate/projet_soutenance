'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, Tag, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import type { LivreRecommande, Recommandations } from '@/lib/types';
import { RequireRole } from '@/components/require-role';
import { BookCover } from '@/components/book-cover';
import { EmptyState } from '@/components/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecommandationsPage() {
  return (
    <RequireRole roles={['ETUDIANT']}>
      <RecoContenu />
    </RequireRole>
  );
}

function RecoContenu() {
  const [reco, setReco] = useState<Recommandations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Recommandations>('/recommandations')
      .then(setReco)
      .catch(() => setReco(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!reco || !reco.aDesRecommandations) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Pas encore de recommandations"
        description="Empruntez quelques livres et l’on vous suggérera des lectures adaptées à vos goûts."
        action={
          <Link
            href="/catalogue"
            className={buttonVariants({ variant: 'outline' })}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Parcourir le catalogue
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" />
          Suggestions pour vous
        </h1>
        <p className="text-muted-foreground">{reco.raison}</p>
        {reco.categoriesFavorites && reco.categoriesFavorites.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {reco.categoriesFavorites.map((c) => (
              <Badge key={c} variant="secondary">
                <Tag className="mr-1 h-3 w-3" />
                {c}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {reco.parCategories.length > 0 && (
        <Section
          titre="D’après vos catégories favorites"
          icone={<Tag className="h-5 w-5 text-primary" />}
          livres={reco.parCategories}
        />
      )}

      {reco.parSimilarite.length > 0 &&
        (() => {
          // Fallback "populaires" (nouvel étudiant) vs vraie similarité TF-IDF
          const estTfIdf = typeof reco.parSimilarite[0]?.score === 'number';
          return (
            <Section
              titre={
                estTfIdf
                  ? 'Similaires à vos lectures (TF-IDF)'
                  : 'Les plus empruntés'
              }
              icone={<TrendingUp className="h-5 w-5 text-primary" />}
              livres={reco.parSimilarite}
              montrerScore={estTfIdf}
            />
          );
        })()}
    </div>
  );
}

function Section({
  titre,
  icone,
  livres,
  montrerScore,
}: {
  titre: string;
  icone: React.ReactNode;
  livres: LivreRecommande[];
  montrerScore?: boolean;
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-semibold">
        {icone}
        {titre}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {livres.map((l) => (
          <Link key={l.id} href={`/livres/${l.id}`}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardContent className="flex gap-3 p-4">
                <BookCover
                  src={l.couverture ?? null}
                  alt={l.titre}
                  className="h-16 w-12 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{l.titre}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {l.auteur}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {l.categorie}
                  </Badge>
                  {montrerScore && typeof l.score === 'number' && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Similarité {Math.round(l.score * 100)}%
                    </div>
                  )}
                  {typeof l.emprunts === 'number' && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {l.emprunts} emprunt{l.emprunts > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
