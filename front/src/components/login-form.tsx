'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { LoginResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, motDePasse },
      });

      if (res.premiereConnexion) {
        toast.info('Première connexion : choisissez un nouveau mot de passe.');
        router.push(`/change-password?email=${encodeURIComponent(email)}`);
        return;
      }

      if (res.access_token && res.user) {
        setAuth(res.access_token, res.user);
        toast.success(`Bienvenue ${res.user.prenom} !`);
        router.replace('/accueil');
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Impossible de se connecter',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      {...props}
      onSubmit={onSubmit}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Entrez vos identifiants pour accéder à votre espace
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
            <Link
              href="/forgot-password"
              className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </Field>
        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </Field>
        <p className="text-center text-xs text-muted-foreground">
          Votre compte est créé par l’administration de la bibliothèque.
        </p>
      </FieldGroup>
    </form>
  );
}
