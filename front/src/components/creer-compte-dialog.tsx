'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { ROLE_LABEL, type CreatedUser, type Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Dialog de création de compte, réutilisé par l'admin (tous rôles) et par le
 * bibliothécaire au guichet (étudiants uniquement, via `rolesAutorises`).
 */
export function CreerCompteDialog({
  open,
  onOpenChange,
  onCree,
  rolesAutorises = ['ETUDIANT', 'BIBLIOTHECAIRE'],
  titre = 'Créer un compte',
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCree: (res: CreatedUser) => void;
  rolesAutorises?: Role[];
  titre?: string;
}) {
  const [role, setRole] = useState<Role>(rolesAutorises[0]);
  const [matricule, setMatricule] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [envoi, setEnvoi] = useState(false);

  function reset() {
    setRole(rolesAutorises[0]);
    setMatricule('');
    setNom('');
    setPrenom('');
    setEmail('');
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    try {
      const res = await api<CreatedUser>('/users', {
        method: 'POST',
        body: {
          nom,
          prenom,
          email,
          roles: [role],
          ...(role === 'ETUDIANT' ? { matricule } : {}),
        },
      });
      onOpenChange(false);
      reset();
      onCree(res);
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
          <DialogTitle>{titre}</DialogTitle>
        </DialogHeader>
        <form onSubmit={soumettre} className="space-y-4">
          {rolesAutorises.length > 1 && (
            <div className="space-y-2">
              <Label>Rôle</Label>
              <div className="flex gap-2">
                {rolesAutorises.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                      role === r
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {role === 'ETUDIANT' && (
            <div className="space-y-2">
              <Label htmlFor="matricule">Matricule</Label>
              <Input
                id="matricule"
                required
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                placeholder="ETU2025-010"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={envoi}>
            {envoi ? 'Création…' : 'Créer le compte'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Affiche le mot de passe temporaire après création d'un compte. */
export function MotDePasseTemporaireDialog({
  cree,
  onClose,
}: {
  cree: CreatedUser | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!cree} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Compte créé ✅</DialogTitle>
          <DialogDescription>
            Un email a été envoyé. Voici aussi le mot de passe temporaire :
          </DialogDescription>
        </DialogHeader>
        {cree && (
          <div className="space-y-2 text-sm">
            <div>
              <b>
                {cree.user.prenom} {cree.user.nom}
              </b>{' '}
              — {cree.user.email}
            </div>
            <div className="rounded bg-muted px-3 py-2 text-center">
              <div className="text-[10px] uppercase text-muted-foreground">
                Mot de passe temporaire
              </div>
              <code className="select-all text-base">
                {cree.motDePasseTemporaire}
              </code>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
