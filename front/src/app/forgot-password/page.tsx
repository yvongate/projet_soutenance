'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        auth: false,
        body: { email },
      });
      setEnvoye(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      {envoye ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <MailCheck className="h-6 w-6 text-green-700" />
          </div>
          <h1 className="text-2xl font-bold">Email envoyé</h1>
          <p className="text-sm text-muted-foreground">
            Si un compte existe avec <b>{email}</b>, un lien de réinitialisation
            vient d’être envoyé. Vérifiez votre boîte mail.
          </p>
          <Link
            href="/login"
            className="mt-2 inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
              <p className="text-sm text-balance text-muted-foreground">
                Entrez votre email pour recevoir un lien de réinitialisation
              </p>
            </div>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
              />
            </Field>
            <Field>
              <Button type="submit" disabled={loading}>
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </Button>
            </Field>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </FieldGroup>
        </form>
      )}
    </AuthShell>
  );
}
