'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { BookOpen, Library, ScanLine } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { MonEmprunt, ScanTransactionResponse } from '@/lib/types';
import { RequireRole } from '@/components/require-role';
import { EmptyState } from '@/components/empty-state';
import { QrScanner } from '@/components/qr-scanner';
import { QrDisplay } from '@/components/qr-display';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function EmpruntsPage() {
  return (
    <RequireRole roles={['ETUDIANT']}>
      <EmpruntsEtudiant />
    </RequireRole>
  );
}

function EmpruntsEtudiant() {
  const [emprunts, setEmprunts] = useState<MonEmprunt[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [transaction, setTransaction] = useState<ScanTransactionResponse | null>(
    null,
  );
  const [scanKey, setScanKey] = useState(0);
  const [now, setNow] = useState(0);

  const charger = useCallback(() => {
    api<MonEmprunt[]>('/emprunts/mes-emprunts')
      .then(setEmprunts)
      .catch(() => setEmprunts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  // Compte à rebours : l'heure est lue uniquement dans le timer (pas pendant le
  // render, ni de façon synchrone dans l'effet), puis stockée dans `now`.
  useEffect(() => {
    if (!transaction) return;
    const maj = () => setNow(Date.now());
    const premier = setTimeout(maj, 0);
    const iv = setInterval(maj, 1000);
    return () => {
      clearTimeout(premier);
      clearInterval(iv);
    };
  }, [transaction]);

  const restant =
    transaction && now
      ? Math.max(
          0,
          Math.round((new Date(transaction.expireAt).getTime() - now) / 1000),
        )
      : (transaction?.expireDansSecondes ?? 0);

  const handleScanLivre = useCallback(async (qrCode: string) => {
    try {
      const res = await api<ScanTransactionResponse>('/emprunts/scanner', {
        method: 'POST',
        body: { qrCode },
      });
      setTransaction(res);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Scan impossible');
      setScanKey((k) => k + 1); // relance le scanner
    }
  }, []);

  function fermer() {
    setOpen(false);
    setTransaction(null);
    setScanKey((k) => k + 1);
  }

  function rescanner() {
    setTransaction(null);
    setScanKey((k) => k + 1);
  }

  const mmss = `${Math.floor(restant / 60)}:${String(restant % 60).padStart(2, '0')}`;
  // Urgence visuelle : ambre sous 1 min, rouge sous 20 s
  const timerCouleur =
    restant <= 20
      ? 'text-red-600'
      : restant <= 60
        ? 'text-amber-600'
        : 'text-foreground';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes emprunts</h1>
          <p className="text-muted-foreground">
            Scannez un livre pour l’emprunter au guichet
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <ScanLine className="mr-2 h-4 w-4" />
          Emprunter
        </Button>
      </div>

      {/* Liste des emprunts */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : emprunts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Aucun emprunt pour le moment"
          description="Parcourez le catalogue puis scannez un livre pour l’emprunter."
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
          {emprunts.map((e) => {
            const rendu = !!e.dateRetourEffective;
            return (
              <Card key={e.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {e.exemplaire.livre.titre}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {e.exemplaire.livre.auteur}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      À rendre avant le{' '}
                      {new Date(e.dateRetourPrevue).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={rendu ? 'badge-dispo' : 'badge-emprunte'}
                  >
                    {rendu ? 'Rendu' : 'En cours'}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de scan / QR de transaction */}
      <Dialog
        open={open}
        onOpenChange={(v) => (v ? setOpen(true) : fermer())}
      >
        <DialogContent className="sm:max-w-md">
          {!transaction ? (
            <>
              <DialogHeader>
                <DialogTitle>Scanner un livre</DialogTitle>
                <DialogDescription>
                  Visez le QR Code de l’exemplaire à emprunter.
                </DialogDescription>
              </DialogHeader>
              <QrScanner key={scanKey} onScan={handleScanLivre} />
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Présentez ce QR au guichet</DialogTitle>
                <DialogDescription>
                  « {transaction.livre} » — le bibliothécaire va le scanner pour
                  valider.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-2">
                {restant > 0 ? (
                  <>
                    <QrDisplay value={transaction.token} />
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold tabular-nums transition-colors ${timerCouleur}`}
                      >
                        {mmss}
                      </div>
                      <div
                        className={`text-xs ${restant <= 60 ? timerCouleur : 'text-muted-foreground'}`}
                      >
                        {restant <= 20
                          ? 'Dépêchez-vous, le code va expirer !'
                          : `Valable encore ${restant} seconde${restant > 1 ? 's' : ''}`}
                      </div>
                    </div>
                    {/* Token en texte : aide au test sur un seul appareil.
                        Masqué automatiquement en production (sécurité). */}
                    {process.env.NODE_ENV !== 'production' && (
                      <div className="w-full rounded bg-muted px-3 py-2 text-center">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Code (test — masqué en production)
                        </div>
                        <code className="select-all break-all text-xs">
                          {transaction.token}
                        </code>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3 text-center">
                    <p className="text-destructive">QR expiré.</p>
                    <Button variant="outline" onClick={rescanner}>
                      Scanner à nouveau
                    </Button>
                  </div>
                )}
                <Button className="w-full" onClick={fermer}>
                  Terminé
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
