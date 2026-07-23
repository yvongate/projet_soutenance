'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MessageSquare, MessageSquarePlus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import {
  estStaff,
  STATUT_TICKET_LABEL,
  STATUT_TICKET_STYLE,
  type Paginated,
  type StatutTicket,
  type TicketListItem,
} from '@/lib/types';
import { Pagination } from '@/components/pagination';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FILTRES: { valeur: StatutTicket | null; label: string }[] = [
  { valeur: null, label: 'Tous' },
  { valeur: 'OUVERT', label: 'Ouverts' },
  { valeur: 'EN_COURS', label: 'En cours' },
  { valeur: 'FERME', label: 'Fermés' },
];

const LIMIT = 20;

export default function TicketsPage() {
  const user = useAuth((s) => s.user);
  const staff = estStaff(user);

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statut, setStatut] = useState<StatutTicket | null>(null);
  const [open, setOpen] = useState(false);

  const charger = useCallback(() => {
    if (staff) {
      const params = new URLSearchParams();
      if (statut) params.set('statut', statut);
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      api<Paginated<TicketListItem>>(`/tickets?${params.toString()}`)
        .then((res) => {
          setTickets(res.items);
          setTotal(res.total);
        })
        .catch(() => {
          setTickets([]);
          setTotal(0);
        })
        .finally(() => setLoading(false));
    } else {
      // Vue étudiant : liste simple (non paginée)
      api<TicketListItem[]>('/tickets/mes-tickets')
        .then((res) => {
          setTickets(res);
          setTotal(0); // pas de pagination côté étudiant
        })
        .catch(() => setTickets([]))
        .finally(() => setLoading(false));
    }
  }, [staff, statut, page]);

  useEffect(() => {
    charger();
  }, [charger]);

  function changerStatut(v: StatutTicket | null) {
    setPage(1);
    setStatut(v);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {staff ? 'Tickets — boîte partagée' : 'Mes tickets'}
          </h1>
          <p className="text-muted-foreground">
            {staff
              ? 'Toutes les demandes des étudiants'
              : 'Vos demandes d’assistance'}
          </p>
        </div>
        {!staff && (
          <Button onClick={() => setOpen(true)}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Nouveau ticket
          </Button>
        )}
      </div>

      {staff && (
        <div className="flex flex-wrap gap-2">
          {FILTRES.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => changerStatut(f.valeur)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                statut === f.valeur
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={staff ? 'Aucun ticket' : 'Aucun ticket pour l’instant'}
          description={
            staff
              ? 'Les demandes des étudiants apparaîtront ici.'
              : 'Ouvrez un ticket pour poser une question à la bibliothèque.'
          }
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/tickets/${t.id}`}>
              <Card className="transition-colors hover:border-primary">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{t.sujet}</span>
                      {t.nonLus > 0 && (
                        <Badge className="bg-red-500 text-white">
                          {t.nonLus}
                        </Badge>
                      )}
                    </div>
                    {staff && t.etudiant && (
                      <div className="text-xs text-muted-foreground">
                        {t.etudiant.prenom} {t.etudiant.nom}
                        {t.etudiant.matricule
                          ? ` · ${t.etudiant.matricule}`
                          : ''}
                      </div>
                    )}
                    <div className="truncate text-sm text-muted-foreground">
                      {t.dernierMessage ?? '—'}
                    </div>
                  </div>
                  <Badge variant="outline" className={STATUT_TICKET_STYLE[t.statut]}>
                    {STATUT_TICKET_LABEL[t.statut]}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {staff && !loading && tickets.length > 0 && (
        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      )}

      {!staff && (
        <NouveauTicketDialog
          open={open}
          onOpenChange={setOpen}
          onCree={charger}
        />
      )}
    </div>
  );
}

function NouveauTicketDialog({
  open,
  onOpenChange,
  onCree,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCree: () => void;
}) {
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    try {
      await api('/tickets', { method: 'POST', body: { sujet, message } });
      toast.success('Ticket créé');
      setSujet('');
      setMessage('');
      onOpenChange(false);
      onCree();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Création impossible');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={soumettre} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sujet">Sujet</Label>
            <Input
              id="sujet"
              required
              minLength={3}
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              placeholder="Ex : Prolongation d’emprunt"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre demande…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" className="w-full" disabled={envoi}>
            {envoi ? 'Envoi…' : 'Envoyer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
