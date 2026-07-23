'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { ChangePasswordResponse } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

function ChangePasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuth((s) => s.setAuth);

  const [email, setEmail] = useState(params.get('email') ?? '');
  const [ancienMotDePasse, setAncien] = useState('');
  const [nouveauMotDePasse, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nouveauMotDePasse !== confirmation) {
      toast.error('La confirmation ne correspond pas.');
      return;
    }
    setLoading(true);
    try {
      const res = await api<ChangePasswordResponse>('/auth/change-password', {
        method: 'POST',
        auth: false,
        body: { email, ancienMotDePasse, nouveauMotDePasse },
      });
      setAuth(res.access_token, res.user);
      toast.success('Mot de passe modifié. Bienvenue !');
      router.replace('/');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Échec du changement';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl">Changer votre mot de passe</CardTitle>
        <CardDescription>
          Première connexion : choisissez un nouveau mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="ancien">Mot de passe temporaire</Label>
            <Input
              id="ancien"
              type="password"
              required
              value={ancienMotDePasse}
              onChange={(e) => setAncien(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nouveau">Nouveau mot de passe</Label>
            <Input
              id="nouveau"
              type="password"
              required
              minLength={6}
              value={nouveauMotDePasse}
              onChange={(e) => setNouveau(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmation">Confirmer</Label>
            <Input
              id="confirmation"
              type="password"
              required
              minLength={6}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Valider'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ChangePasswordPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Suspense fallback={null}>
        <ChangePasswordForm />
      </Suspense>
    </div>
  );
}
