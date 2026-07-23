'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Bookmark, BellRing, Library } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { MaReservation } from '@/lib/types';
import { RequireRole } from '@/components/require-role';
import { EmptyState } from '@/components/empty-state';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReservationsPage() {
  return (
    <RequireRole roles={['ETUDIANT']}>
      <MesReservations />
    </RequireRole>
  );
}

function MesReservations() {
  const [reservations, setReservations] = useState<MaReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [annulId, setAnnulId] = useState<string | null>(null);

  const charger = useCallback(() => {
    api<MaReservation[]>('/reservations/mes-reservations')
      .then(setReservations)
      .catch(() => setReservations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function annuler(id: string) {
    setAnnulId(id);
    try {
      await api(`/reservations/${id}/annuler`, { method: 'POST' });
      toast.success('Réservation annulée');
      charger();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Annulation impossible');
    } finally {
      setAnnulId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes réservations</h1>
        <p className="text-muted-foreground">
          Suivez votre position dans les files d’attente
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Aucune réservation en cours"
          description="Réservez un livre indisponible : vous serez notifié dès qu’il se libère."
          action={
            <Link
              href="/catalogue"
              className={buttonVariants({ variant: 'outline' })}
            >
              <Library className="mr-2 h-4 w-4" />
              Parcourir le catalogue
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const dispo = r.statut === 'NOTIFIEE';
            return (
              <Card key={r.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded ${
                      dispo ? 'bg-green-100' : 'bg-muted'
                    }`}
                  >
                    {dispo ? (
                      <BellRing className="h-5 w-5 text-green-700" />
                    ) : (
                      <Bookmark className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{r.livre.titre}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {r.livre.auteur}
                    </div>
                    <div className="mt-1">
                      {dispo ? (
                        <Badge variant="outline" className="badge-dispo">
                          Disponible — à récupérer !
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Position n°{r.positionActuelle} dans la file
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={annulId === r.id}
                    onClick={() => annuler(r.id)}
                  >
                    {annulId === r.id ? 'Annulation…' : 'Annuler'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
