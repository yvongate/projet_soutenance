'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BellRing, BookOpen, CheckCircle2, RotateCcw, UserPlus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type {
  CreatedUser,
  EmpruntHistorique,
  Paginated,
  RetourResponse,
  ValiderEmpruntResponse,
} from '@/lib/types';
import { RequireRole } from '@/components/require-role';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { QrScanner } from '@/components/qr-scanner';
import {
  CreerCompteDialog,
  MotDePasseTemporaireDialog,
} from '@/components/creer-compte-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function GuichetPage() {
  const [inscrire, setInscrire] = useState(false);
  const [cree, setCree] = useState<CreatedUser | null>(null);

  return (
    <RequireRole roles={['BIBLIOTHECAIRE', 'ADMINISTRATEUR']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Guichet</h1>
            <p className="text-muted-foreground">
              Validez les emprunts et enregistrez les retours
            </p>
          </div>
          <Button variant="outline" onClick={() => setInscrire(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Inscrire un étudiant
          </Button>
        </div>

        <CreerCompteDialog
          open={inscrire}
          onOpenChange={setInscrire}
          rolesAutorises={['ETUDIANT']}
          titre="Inscrire un étudiant"
          onCree={setCree}
        />
        <MotDePasseTemporaireDialog cree={cree} onClose={() => setCree(null)} />

        <Tabs defaultValue="valider">
          <TabsList>
            <TabsTrigger value="valider">Valider un emprunt</TabsTrigger>
            <TabsTrigger value="retour">Enregistrer un retour</TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="valider" className="mt-4">
            <ValiderTab />
          </TabsContent>
          <TabsContent value="retour" className="mt-4">
            <RetourTab />
          </TabsContent>
          <TabsContent value="historique" className="mt-4">
            <HistoriqueTab />
          </TabsContent>
        </Tabs>
      </div>
    </RequireRole>
  );
}

function ValiderTab() {
  const [scanKey, setScanKey] = useState(0);
  const [succes, setSucces] = useState<ValiderEmpruntResponse | null>(null);

  const handle = useCallback(async (token: string) => {
    try {
      const res = await api<ValiderEmpruntResponse>('/emprunts/valider', {
        method: 'POST',
        body: { token },
      });
      setSucces(res);
      toast.success('Emprunt validé');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Validation impossible');
      setScanKey((k) => k + 1);
    }
  }, []);

  if (succes) {
    return (
      <ResultatSucces
        titre="Emprunt validé"
        detail={`À rendre avant le ${new Date(succes.dateRetourPrevue).toLocaleDateString('fr-FR')}`}
        onReset={() => {
          setSucces(null);
          setScanKey((k) => k + 1);
        }}
        resetLabel="Valider un autre"
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-3 text-sm text-muted-foreground">
          Scannez le <b>QR de transaction</b> présenté par l’étudiant.
        </p>
        <QrScanner
          key={scanKey}
          onScan={handle}
          placeholder="Token de transaction"
        />
      </CardContent>
    </Card>
  );
}

function RetourTab() {
  const [scanKey, setScanKey] = useState(0);
  const [succes, setSucces] = useState<RetourResponse | null>(null);

  const handle = useCallback(async (qrCode: string) => {
    try {
      const res = await api<RetourResponse>('/emprunts/retour', {
        method: 'POST',
        body: { qrCode },
      });
      setSucces(res);
      toast.success('Retour enregistré');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Retour impossible');
      setScanKey((k) => k + 1);
    }
  }, []);

  if (succes) {
    return (
      <ResultatSucces
        titre="Retour enregistré"
        detail={
          succes.reservataireNotifie
            ? 'Un réservataire en attente a été notifié de la disponibilité.'
            : 'Le livre est de nouveau disponible.'
        }
        icone={succes.reservataireNotifie ? 'notif' : 'retour'}
        onReset={() => {
          setSucces(null);
          setScanKey((k) => k + 1);
        }}
        resetLabel="Enregistrer un autre"
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-3 text-sm text-muted-foreground">
          Scannez le <b>QR Code du livre</b> rendu.
        </p>
        <QrScanner key={scanKey} onScan={handle} placeholder="Code du livre (BS-XXXX)" />
      </CardContent>
    </Card>
  );
}

function ResultatSucces({
  titre,
  detail,
  onReset,
  resetLabel,
  icone = 'valide',
}: {
  titre: string;
  detail: string;
  onReset: () => void;
  resetLabel: string;
  icone?: 'valide' | 'retour' | 'notif';
}) {
  const Icone =
    icone === 'notif' ? BellRing : icone === 'retour' ? RotateCcw : CheckCircle2;
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <Icone className="h-7 w-7 text-green-700" />
        </div>
        <div>
          <div className="text-lg font-semibold">{titre}</div>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{detail}</p>
        </div>
        <Button variant="outline" onClick={onReset}>
          {resetLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

const LIMIT = 20;

function HistoriqueTab() {
  const [data, setData] = useState<EmpruntHistorique[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Paginated<EmpruntHistorique>>(
      `/emprunts/historique?page=${page}&limit=${LIMIT}`,
    )
      .then((res) => {
        setData(res.items);
        setTotal(res.total);
      })
      .catch(() => {
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (data.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Aucun emprunt enregistré"
        description="L’historique des emprunts validés apparaîtra ici."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Étudiant</TableHead>
              <TableHead>Livre</TableHead>
              <TableHead>Emprunt</TableHead>
              <TableHead>Retour prévu</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  {e.user.prenom} {e.user.nom}
                </TableCell>
                <TableCell>{e.exemplaire.livre.titre}</TableCell>
                <TableCell>
                  {new Date(e.dateEmprunt).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  {new Date(e.dateRetourPrevue).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  {e.dateRetourEffective ? 'Rendu' : 'En cours'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
    </div>
  );
}
