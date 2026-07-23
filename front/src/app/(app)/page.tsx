'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bookmark,
  Library,
  MessageSquare,
  ScanLine,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import {
  aRole,
  estStaff,
  type LivreRecommande,
  type MaReservation,
  type MonEmprunt,
  type Recommandations,
  type StatsDashboard,
} from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { BookCover } from '@/components/book-cover';

export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  if (!user) return null;
  return estStaff(user) ? (
    <StaffHome prenom={user.prenom} admin={aRole(user, 'ADMINISTRATEUR')} />
  ) : (
    <EtudiantHome prenom={user.prenom} />
  );
}

// ---------------------- Accueil étudiant ----------------------

function EtudiantHome({ prenom }: { prenom: string }) {
  const [emprunts, setEmprunts] = useState<number | null>(null);
  const [reservations, setReservations] = useState<number | null>(null);
  const [recos, setRecos] = useState<LivreRecommande[]>([]);

  useEffect(() => {
    api<MonEmprunt[]>('/emprunts/mes-emprunts')
      .then((e) => setEmprunts(e.filter((x) => !x.dateRetourEffective).length))
      .catch(() => setEmprunts(0));
    api<MaReservation[]>('/reservations/mes-reservations')
      .then((r) => setReservations(r.length))
      .catch(() => setReservations(0));
    api<Recommandations>('/recommandations')
      .then((r) => setRecos([...r.parSimilarite, ...r.parCategories].slice(0, 4)))
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bonjour {prenom} 👋</h1>

      {/* Appel à l'action principal */}
      <Link href="/emprunts">
        <Card className="border-0 bg-primary text-primary-foreground transition-transform hover:scale-[1.01]">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-lg font-semibold">Emprunter un livre</div>
              <div className="text-sm text-primary-foreground/80">
                Scannez le QR Code d’un livre pour l’emprunter au guichet
              </div>
            </div>
            <ScanLine className="h-8 w-8 shrink-0" />
          </CardContent>
        </Card>
      </Link>

      {/* Chiffres perso */}
      <div className="grid grid-cols-2 gap-4">
        <Tile href="/emprunts" label="Emprunts en cours" value={emprunts} icon={BookOpen} />
        <Tile href="/reservations" label="Réservations" value={reservations} icon={Bookmark} />
      </div>

      {/* Recommandations */}
      {recos.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-5 w-5 text-primary" />
              Suggestions pour vous
            </h2>
            <Link
              href="/recommandations"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Voir tout <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recos.map((l) => (
              <Link key={l.id} href={`/livres/${l.id}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardContent className="flex gap-3 p-3">
                    <BookCover
                      src={l.couverture ?? null}
                      alt={l.titre}
                      className="h-14 w-10 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{l.titre}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {l.auteur}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------- Accueil staff ----------------------

function StaffHome({ prenom, admin }: { prenom: string; admin: boolean }) {
  const [stats, setStats] = useState<StatsDashboard | null>(null);

  useEffect(() => {
    api<StatsDashboard>('/stats/dashboard')
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const retard = stats?.emprunts.enRetard ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bonjour {prenom} 👋</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Emprunts en cours" value={stats?.emprunts.enCours ?? null} icon={BookOpen} />
        <Tile
          label="En retard"
          value={stats?.emprunts.enRetard ?? null}
          icon={AlertTriangle}
          accent={stats && retard > 0 ? 'text-retard' : undefined}
        />
        <Tile
          href="/tickets"
          label="Tickets ouverts"
          value={stats?.ticketsOuverts ?? null}
          icon={MessageSquare}
        />
        <Tile
          label="Réservations en attente"
          value={stats?.reservationsEnAttente ?? null}
          icon={Bookmark}
        />
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Accès rapides</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Action href="/guichet" label="Guichet" icon={ScanLine} />
          <Action href="/stats" label="Statistiques" icon={BarChart3} />
          <Action href="/tickets" label="Messagerie" icon={MessageSquare} />
          {admin && <Action href="/admin/catalogue" label="Catalogue" icon={Library} />}
          {admin && <Action href="/admin/comptes" label="Comptes" icon={Users} />}
        </div>
      </div>
    </div>
  );
}

// ---------------------- Blocs réutilisables ----------------------

function Tile({
  href,
  label,
  value,
  icon: Icon,
  accent,
}: {
  href?: string;
  label: string;
  value: number | null;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  const contenu = (
    <Card className={href ? 'h-full transition-colors hover:border-primary' : 'h-full'}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${accent ?? 'text-muted-foreground'}`} />
        </div>
        <div className={`mt-1 text-2xl font-bold ${accent ?? ''}`}>
          {value ?? '—'}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{contenu}</Link> : contenu;
}

function Action({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary">
        <CardContent className="flex items-center gap-3 p-4">
          <Icon className="h-5 w-5 text-primary" />
          <span className="font-medium">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
