'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { Boxes, Pencil, Plus, Printer, Search, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import {
  type LivreDetail,
  type LivreListItem,
  type Paginated,
  type QrCodeExemplaire,
} from '@/lib/types';
import { RequireRole } from '@/components/require-role';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { StatutBadge } from '@/components/statut-badge';
import { CoverPicker } from '@/components/cover-picker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/** Référence minimale d'un livre (suffit pour la gestion des exemplaires). */
type LivreRef = { id: string; titre: string };

export default function AdminCataloguePage() {
  return (
    <RequireRole roles={['ADMINISTRATEUR']}>
      <GestionCatalogue />
    </RequireRole>
  );
}

const LIMIT = 20;

function GestionCatalogue() {
  const [q, setQ] = useState('');
  const [livres, setLivres] = useState<LivreListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editLivre, setEditLivre] = useState<LivreListItem | null>(null);
  const [creer, setCreer] = useState(false);
  const [exLivre, setExLivre] = useState<LivreRef | null>(null);

  const charger = useCallback(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    params.set('page', String(page));
    params.set('limit', String(LIMIT));
    api<Paginated<LivreListItem>>(`/livres?${params.toString()}`)
      .then((res) => {
        setLivres(res.items);
        setTotal(res.total);
      })
      .catch(() => {
        setLivres([]);
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

  async function supprimer(l: LivreListItem) {
    if (!confirm(`Supprimer « ${l.titre} » ?`)) return;
    try {
      await api(`/livres/${l.id}`, { method: 'DELETE' });
      toast.success('Livre supprimé');
      charger();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Suppression impossible');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion du catalogue</h1>
          <p className="text-muted-foreground">
            Ajouter, modifier les livres et leurs exemplaires
          </p>
        </div>
        <Button onClick={() => setCreer(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un livre
        </Button>
      </div>

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher (titre, auteur, ISBN)…"
          value={q}
          onChange={(e) => changerRecherche(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : livres.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun livre trouvé"
          description="Aucun résultat pour cette recherche. Ajoutez un livre ou modifiez le filtre."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Exemplaires</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {livres.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.titre}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {l.auteur}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{l.categorie}</Badge>
                  </TableCell>
                  <TableCell>
                    {l.nbDisponibles}/{l.nbExemplaires}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        title="Gérer les exemplaires / QR"
                        aria-label={`Gérer les exemplaires de ${l.titre}`}
                        onClick={() => setExLivre({ id: l.id, titre: l.titre })}
                      >
                        <Boxes className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Modifier"
                        aria-label={`Modifier ${l.titre}`}
                        onClick={() => setEditLivre(l)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Supprimer"
                        aria-label={`Supprimer ${l.titre}`}
                        onClick={() => supprimer(l)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && livres.length > 0 && (
        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      )}

      <LivreFormDialog
        key={creer ? 'creer-open' : 'creer-closed'}
        open={creer}
        onOpenChange={setCreer}
        onDone={(nouveau) => {
          charger();
          if (nouveau) setExLivre(nouveau); // ouvre les exemplaires/QR du livre créé
        }}
      />
      <LivreFormDialog
        key={editLivre?.id ?? 'edit-closed'}
        livre={editLivre}
        open={!!editLivre}
        onOpenChange={(v) => !v && setEditLivre(null)}
        onDone={() => charger()}
      />
      <ExemplairesDialog
        key={exLivre?.id ?? 'none'}
        livre={exLivre}
        onOpenChange={(v) => !v && setExLivre(null)}
        onChange={charger}
      />
    </div>
  );
}

function formeInitiale(livre?: LivreListItem | null) {
  return {
    titre: livre?.titre ?? '',
    auteur: livre?.auteur ?? '',
    isbn: livre?.isbn ?? '',
    categorie: livre?.categorie ?? '',
    description: livre?.description ?? '',
    couverture: livre?.couverture ?? '',
    cote: livre?.cote ?? '',
    nombreExemplaires: '1',
  };
}

function LivreFormDialog({
  livre,
  open,
  onOpenChange,
  onDone,
}: {
  livre?: LivreListItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: (nouveau?: LivreRef) => void;
}) {
  const edition = !!livre;
  const [form, setForm] = useState(() => formeInitiale(livre));
  const [envoi, setEnvoi] = useState(false);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    try {
      const base = {
        titre: form.titre,
        auteur: form.auteur,
        categorie: form.categorie,
        isbn: form.isbn || undefined,
        description: form.description || undefined,
        couverture: form.couverture || undefined,
        cote: form.cote || undefined,
      };
      if (edition && livre) {
        await api(`/livres/${livre.id}`, { method: 'PATCH', body: base });
        toast.success('Livre modifié');
        onOpenChange(false);
        onDone();
      } else {
        const cree = await api<LivreRef>('/livres', {
          method: 'POST',
          body: { ...base, nombreExemplaires: Number(form.nombreExemplaires) },
        });
        toast.success('Livre ajouté');
        onOpenChange(false);
        onDone(cree);
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Enregistrement impossible',
      );
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {edition ? 'Modifier le livre' : 'Ajouter un livre'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={soumettre} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Couverture</Label>
            <CoverPicker
              value={form.couverture}
              onChange={(v) => setForm((f) => ({ ...f, couverture: v }))}
            />
          </div>
          <Champ label="Titre" required value={form.titre} onChange={set('titre')} />
          <Champ label="Auteur" required value={form.auteur} onChange={set('auteur')} />
          <div className="grid grid-cols-2 gap-3">
            <Champ label="Catégorie" required value={form.categorie} onChange={set('categorie')} />
            <Champ label="Cote" value={form.cote} onChange={set('cote')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Champ label="ISBN" value={form.isbn} onChange={set('isbn')} />
            {!edition && (
              <Champ
                label="Nb exemplaires"
                type="number"
                value={form.nombreExemplaires}
                onChange={set('nombreExemplaires')}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <textarea
              id="desc"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" className="w-full" disabled={envoi}>
            {envoi ? 'Enregistrement…' : edition ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Champ({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof Input>) {
  const id = label.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
    </div>
  );
}

function ExemplairesDialog({
  livre,
  onOpenChange,
  onChange,
}: {
  livre: LivreRef | null;
  onOpenChange: (v: boolean) => void;
  onChange: () => void;
}) {
  const [detail, setDetail] = useState<LivreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<QrCodeExemplaire | null>(null);

  const charger = useCallback(() => {
    if (!livre) return;
    api<LivreDetail>(`/livres/${livre.id}`)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [livre]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function ajouter() {
    if (!livre) return;
    try {
      await api(`/livres/${livre.id}/exemplaires`, { method: 'POST' });
      toast.success('Exemplaire ajouté');
      charger();
      onChange();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Ajout impossible');
    }
  }

  async function supprimer(id: string) {
    try {
      await api(`/exemplaires/${id}`, { method: 'DELETE' });
      toast.success('Exemplaire supprimé');
      charger();
      onChange();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Suppression impossible');
    }
  }

  async function voirQr(id: string) {
    try {
      const res = await api<QrCodeExemplaire>(`/exemplaires/${id}/qrcode`);
      setQr(res);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'QR indisponible');
    }
  }

  function imprimer(q: QrCodeExemplaire) {
    ouvrirImpression(`QR ${q.qrCode}`, [
      { qrCode: q.qrCode, image: q.image },
    ], q.titre);
  }

  /** Génère les QR côté client et lance l'impression de toute la planche. */
  async function imprimerTout() {
    if (!detail || !livre || detail.exemplaires.length === 0) return;
    const items = await Promise.all(
      detail.exemplaires.map(async (ex) => ({
        qrCode: ex.qrCode,
        image: await QRCode.toDataURL(ex.qrCode, { width: 220, margin: 1 }),
      })),
    );
    ouvrirImpression(`QR — ${livre.titre}`, items, livre.titre);
  }

  return (
    <>
      <Dialog open={!!livre} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exemplaires — {livre?.titre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={ajouter}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un exemplaire
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={imprimerTout}
                disabled={!detail || detail.exemplaires.length === 0}
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimer tous les QR
              </Button>
            </div>

            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-2">
                {detail?.exemplaires.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucun exemplaire.
                  </p>
                )}
                {detail?.exemplaires.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <span className="font-mono text-xs">{ex.qrCode}</span>
                    <div className="flex items-center gap-1">
                      <StatutBadge statut={ex.statut} />
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Voir / imprimer le QR"
                        aria-label={`Voir ou imprimer le QR de l’exemplaire ${ex.qrCode}`}
                        onClick={() => voirQr(ex.id)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Supprimer"
                        aria-label={`Supprimer l’exemplaire ${ex.qrCode}`}
                        onClick={() => supprimer(ex.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Aperçu / impression d'un QR */}
      <Dialog open={!!qr} onOpenChange={(v) => !v && setQr(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">QR Code</DialogTitle>
          </DialogHeader>
          {qr && (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr.image} alt="QR Code" className="w-48" />
              <code className="text-xs">{qr.qrCode}</code>
              <Button className="w-full" onClick={() => imprimer(qr)}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Ouvre une fenêtre d'impression avec une planche de QR Codes. */
function ouvrirImpression(
  titreFenetre: string,
  items: { qrCode: string; image: string }[],
  titreLivre: string,
) {
  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) return;
  const cartes = items
    .map(
      (it) =>
        `<div style="display:inline-block;text-align:center;margin:10px;page-break-inside:avoid">` +
        `<img src="${it.image}" style="width:150px"/>` +
        `<div style="font-family:monospace;font-size:11px">${it.qrCode}</div>` +
        `</div>`,
    )
    .join('');
  w.document.write(
    `<html><head><title>${titreFenetre}</title></head>` +
      `<body style="font-family:sans-serif;padding:16px">` +
      `<h3>${titreLivre}</h3>${cartes}` +
      `<script>window.onload=function(){window.print()}</script></body></html>`,
  );
  w.document.close();
}
