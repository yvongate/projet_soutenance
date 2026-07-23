'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search, UserPlus, Users } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import {
  ROLE_LABEL,
  type CreatedUser,
  type Paginated,
  type User,
} from '@/lib/types';
import { RequireRole } from '@/components/require-role';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import {
  CreerCompteDialog,
  MotDePasseTemporaireDialog,
} from '@/components/creer-compte-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ComptesPage() {
  return (
    <RequireRole roles={['ADMINISTRATEUR']}>
      <GestionComptes />
    </RequireRole>
  );
}

const LIMIT = 20;

function GestionComptes() {
  const moi = useAuth((s) => s.user);
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [cree, setCree] = useState<CreatedUser | null>(null);

  const charger = useCallback(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    params.set('page', String(page));
    params.set('limit', String(LIMIT));
    api<Paginated<User>>(`/users?${params.toString()}`)
      .then((res) => {
        setUsers(res.items);
        setTotal(res.total);
      })
      .catch(() => {
        setUsers([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [q, page]);

  // Recherche avec anti-rebond
  useEffect(() => {
    const t = setTimeout(charger, 300);
    return () => clearTimeout(t);
  }, [charger]);

  function changerRecherche(v: string) {
    setPage(1);
    setQ(v);
  }

  async function desactiver(id: string) {
    try {
      await api(`/users/${id}`, { method: 'DELETE' });
      toast.success('Compte désactivé');
      charger();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Action impossible');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des comptes</h1>
          <p className="text-muted-foreground">Créer et gérer les utilisateurs</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Créer un compte
        </Button>
      </div>

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher (nom, email, matricule)…"
          value={q}
          onChange={(e) => changerRecherche(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">
                    {u.matricule ?? '—'}
                  </TableCell>
                  <TableCell>
                    {u.prenom} {u.nom}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} variant="secondary" className="text-xs">
                          {ROLE_LABEL[r]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.actif ? (
                      <Badge className="border-green-200 bg-green-100 text-green-800">
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Désactivé
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {u.actif && u.id !== moi?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => desactiver(u.id)}
                      >
                        Désactiver
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && users.length === 0 && (
        <EmptyState
          icon={Users}
          title="Aucun compte trouvé"
          description="Aucun utilisateur ne correspond à cette recherche."
        />
      )}

      {!loading && users.length > 0 && (
        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      )}

      <CreerCompteDialog
        open={open}
        onOpenChange={setOpen}
        onCree={(res) => {
          setCree(res);
          charger();
        }}
      />
      <MotDePasseTemporaireDialog cree={cree} onClose={() => setCree(null)} />
    </div>
  );
}
