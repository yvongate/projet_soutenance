'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="text-2xl font-bold">Lien invalide</h1>
        <p className="text-sm text-muted-foreground">
          Ce lien de réinitialisation est incomplet ou a expiré.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm underline-offset-4 hover:underline"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nouveau !== confirmation) {
      toast.error('La confirmation ne correspond pas.');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        auth: false,
        body: { token, nouveauMotDePasse: nouveau },
      });
      toast.success('Mot de passe réinitialisé. Connectez-vous.');
      router.replace('/login');
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Réinitialisation impossible',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Choisissez un nouveau mot de passe pour votre compte
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="nouveau">Nouveau mot de passe</FieldLabel>
          <Input
            id="nouveau"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmation">Confirmer</FieldLabel>
          <Input
            id="confirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </Field>
        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Réinitialiser'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
