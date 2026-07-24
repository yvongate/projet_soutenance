'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, BookmarkPlus, BookX } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { aRole, estStaff, type LivreDetail } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dispo } from '@/components/dispo';
import { BookCover } from '@/components/book-cover';
import { StatutBadge } from '@/components/statut-badge';
import { EmptyState } from '@/components/empty-state';

export default function LivreDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [livre, setLivre] = useState<LivreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);

  async function reserver() {
    if (!livre) return;
    setReserving(true);
    try {
      await api('/reservations', {
        method: 'POST',
        body: { livreId: livre.id },
      });
      setReserved(true);
      toast.success('Livre réservé ! Vous serez notifié dès qu’il se libère.');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Réservation impossible');
    } finally {
      setReserving(false);
    }
  }

  useEffect(() => {
    if (!params.id) return;
    api<LivreDetail>(`/livres/${params.id}`)
      .then(setLivre)
      .catch((e) =>
        setErreur(e instanceof ApiError ? e.message : 'Erreur de chargement'),
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Retour
      </Button>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : erreur || !livre ? (
        <EmptyState
          icon={BookX}
          title="Livre introuvable"
          description={erreur ?? 'Ce livre n’existe pas ou n’est plus disponible.'}
        />
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-col gap-6 p-6 sm:flex-row">
              <BookCover
                src={livre.couverture}
                alt={livre.titre}
                className="h-48 w-32 shrink-0 self-center sm:self-start"
              />
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-2xl font-bold">{livre.titre}</h1>
                  <p className="text-lg text-muted-foreground">{livre.auteur}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{livre.categorie}</Badge>
                  {livre.cote && <Badge variant="outline">Cote {livre.cote}</Badge>}
                  {livre.isbn && (
                    <Badge variant="outline">ISBN {livre.isbn}</Badge>
                  )}
                </div>
                <Dispo
                  dispo={livre.nbDisponibles}
                  total={livre.exemplaires.length}
                />
                {aRole(user, 'ETUDIANT') && livre.nbDisponibles === 0 && (
                  <div>
                    <Button
                      onClick={reserver}
                      disabled={reserving || reserved}
                    >
                      <BookmarkPlus className="mr-2 h-4 w-4" />
                      {reserved
                        ? 'Réservé ✓'
                        : reserving
                          ? 'Réservation…'
                          : 'Réserver ce livre'}
                    </Button>
                  </div>
                )}
                {livre.description && (
                  <p className="pt-2 text-sm leading-relaxed">
                    {livre.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Détail des exemplaires (QR codes + statuts) : réservé au staff */}
          {estStaff(user) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Exemplaires ({livre.exemplaires.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {livre.exemplaires.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun exemplaire enregistré.
                  </p>
                ) : (
                  livre.exemplaires.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span className="font-mono text-sm">{ex.qrCode}</span>
                      <StatutBadge statut={ex.statut} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
