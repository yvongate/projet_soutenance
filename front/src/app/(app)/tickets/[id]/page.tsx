'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Send, MessageSquareOff } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import {
  STATUT_TICKET_LABEL,
  STATUT_TICKET_STYLE,
  type TicketDetail,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';

export default function TicketConversationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuth((s) => s.user);

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [contenu, setContenu] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const filRef = useRef<HTMLDivElement>(null);

  const charger = useCallback(() => {
    if (!params.id) return;
    api<TicketDetail>(`/tickets/${params.id}`)
      .then((t) => {
        setTicket(t);
        // Défile en bas pour afficher les derniers messages
        requestAnimationFrame(() =>
          filRef.current?.scrollTo({ top: filRef.current.scrollHeight }),
        );
      })
      .catch(() => setTicket(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!contenu.trim() || !ticket) return;
    setEnvoi(true);
    try {
      await api(`/tickets/${ticket.id}/messages`, {
        method: 'POST',
        body: { contenu },
      });
      setContenu('');
      charger();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Envoi impossible');
    } finally {
      setEnvoi(false);
    }
  }

  async function changerStatut(action: 'fermer' | 'rouvrir') {
    if (!ticket) return;
    try {
      await api(`/tickets/${ticket.id}/${action}`, { method: 'POST' });
      toast.success(action === 'fermer' ? 'Ticket fermé' : 'Ticket rouvert');
      charger();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action impossible');
    }
  }

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!ticket) {
    return (
      <EmptyState
        icon={MessageSquareOff}
        title="Ticket introuvable"
        description="Ce ticket n’existe pas ou ne vous est pas accessible."
        action={
          <Button variant="outline" onClick={() => router.push('/tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux tickets
          </Button>
        }
      />
    );
  }

  const ferme = ticket.statut === 'FERME';

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="mb-1 -ml-2"
            onClick={() => router.push('/tickets')}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Tickets
          </Button>
          <h1 className="truncate text-xl font-bold">{ticket.sujet}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className={STATUT_TICKET_STYLE[ticket.statut]}>
              {STATUT_TICKET_LABEL[ticket.statut]}
            </Badge>
            <span>
              {ticket.etudiant.prenom} {ticket.etudiant.nom}
            </span>
            {ticket.prisEnCharge && (
              <span>· pris en charge par {ticket.prisEnCharge.prenom}</span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => changerStatut(ferme ? 'rouvrir' : 'fermer')}
        >
          {ferme ? 'Rouvrir' : 'Fermer'}
        </Button>
      </div>

      {/* Fil de messages */}
      <div
        ref={filRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-4"
      >
        {ticket.messages.map((m) => {
          const moi = m.expediteurId === user?.id;
          return (
            <div
              key={m.id}
              className={`flex ${moi ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  moi
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm bg-background border'
                }`}
              >
                {!moi && (
                  <div className="mb-0.5 text-xs font-medium opacity-70">
                    {m.expediteur.prenom} {m.expediteur.nom}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">
                  {m.contenu}
                </div>
                <div
                  className={`mt-1 text-[10px] ${moi ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                >
                  {new Date(m.createdAt).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone de réponse */}
      {ferme ? (
        <Card>
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            Ce ticket est fermé. Rouvrez-le pour répondre.
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={envoyer} className="flex gap-2">
          <textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Votre message…"
            rows={2}
            className="flex flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void envoyer(e);
              }
            }}
          />
          <Button type="submit" disabled={envoi || !contenu.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
