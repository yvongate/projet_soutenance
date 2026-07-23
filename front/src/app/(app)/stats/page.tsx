'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  BarChart3,
  BookCopy,
  Bookmark,
  Download,
  Library,
  MessageSquare,
  Users,
} from 'lucide-react';
import { api, ApiError, downloadFile } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { aRole, type StatsDashboard } from '@/lib/types';
import { RequireRole } from '@/components/require-role';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatsPage() {
  return (
    <RequireRole roles={['BIBLIOTHECAIRE', 'ADMINISTRATEUR']}>
      <Dashboard />
    </RequireRole>
  );
}

function Dashboard() {
  const user = useAuth((s) => s.user);
  const admin = aRole(user, 'ADMINISTRATEUR');
  const [stats, setStats] = useState<StatsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<StatsDashboard>('/stats/dashboard')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  async function exporter(type: 'emprunts' | 'livres' | 'utilisateurs') {
    try {
      await downloadFile(`/stats/export/${type}`, `${type}.csv`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Export impossible');
    }
  }

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!stats) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Statistiques indisponibles"
        description="Impossible de charger le tableau de bord pour le moment."
      />
    );
  }

  const { catalogue, emprunts, utilisateurs } = stats;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">Vue d’ensemble de la bibliothèque</p>
        </div>
        {admin && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exporter('emprunts')}>
              <Download className="mr-2 h-4 w-4" /> Emprunts
            </Button>
            <Button variant="outline" size="sm" onClick={() => exporter('livres')}>
              <Download className="mr-2 h-4 w-4" /> Livres
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exporter('utilisateurs')}
            >
              <Download className="mr-2 h-4 w-4" /> Utilisateurs
            </Button>
          </div>
        )}
      </div>

      {/* Chiffres clés (stat tiles) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Livres" value={catalogue.livres} icon={Library} />
        <Tile label="Exemplaires" value={catalogue.exemplaires} icon={BookCopy} />
        <Tile label="Emprunts en cours" value={emprunts.enCours} icon={BookCopy} />
        <Tile
          label="En retard"
          value={emprunts.enRetard}
          icon={AlertTriangle}
          accent={emprunts.enRetard > 0 ? 'text-retard' : undefined}
        />
        <Tile label="Utilisateurs" value={utilisateurs.total} icon={Users} />
        <Tile label="Étudiants" value={utilisateurs.etudiants} icon={Users} />
        <Tile
          label="Réservations en attente"
          value={stats.reservationsEnAttente}
          icon={Bookmark}
        />
        <Tile
          label="Tickets ouverts"
          value={stats.ticketsOuverts}
          icon={MessageSquare}
        />
      </div>

      {/* Répartition des exemplaires (barre segmentée) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition des exemplaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SegmentedBar
            total={catalogue.exemplaires}
            segments={[
              { label: 'Disponibles', valeur: catalogue.disponibles, couleur: 'fill-dispo' },
              { label: 'Empruntés', valeur: catalogue.empruntes, couleur: 'fill-emprunte' },
              { label: 'Réservés', valeur: catalogue.reserves, couleur: 'fill-reserve' },
            ]}
          />
        </CardContent>
      </Card>

      {/* Classements (barres horizontales, une seule teinte) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Livres les plus empruntés</CardTitle>
          </CardHeader>
          <CardContent>
            <Bars items={stats.topLivres} vide="Aucun emprunt." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catégories les plus empruntées</CardTitle>
          </CardHeader>
          <CardContent>
            <Bars items={stats.topCategories} vide="Aucun emprunt." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${accent ?? 'text-muted-foreground'}`} />
        </div>
        <div className={`mt-1 text-2xl font-bold ${accent ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function SegmentedBar({
  total,
  segments,
}: {
  total: number;
  segments: { label: string; valeur: number; couleur: string }[];
}) {
  const t = Math.max(1, total);
  return (
    <div className="space-y-3">
      <div className="flex h-6 gap-0.5 overflow-hidden rounded-full bg-muted">
        {segments
          .filter((s) => s.valeur > 0)
          .map((s) => (
            <div
              key={s.label}
              className={s.couleur}
              style={{ width: `${(s.valeur / t) * 100}%` }}
              title={`${s.label} : ${s.valeur}`}
            />
          ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-sm">
            <span className={`h-3 w-3 rounded-sm ${s.couleur}`} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-semibold">{s.valeur}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bars({
  items,
  vide,
}: {
  items: { nom: string; emprunts: number }[];
  vide: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{vide}</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.emprunts));
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.nom} className="flex items-center gap-3">
          <div className="w-36 shrink-0 truncate text-sm" title={it.nom}>
            {it.nom}
          </div>
          <div className="h-5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-5 rounded-full bg-primary"
              style={{ width: `${(it.emprunts / max) * 100}%` }}
            />
          </div>
          <div className="w-8 shrink-0 text-right text-sm font-medium tabular-nums">
            {it.emprunts}
          </div>
        </div>
      ))}
    </div>
  );
}
