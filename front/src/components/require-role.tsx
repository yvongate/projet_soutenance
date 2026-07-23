'use client';

import { Lock } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { aRole, type Role } from '@/lib/types';
import { EmptyState } from '@/components/empty-state';

/** Affiche le contenu seulement si l'utilisateur a l'un des rôles requis. */
export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const user = useAuth((s) => s.user);

  if (!aRole(user, ...roles)) {
    return (
      <EmptyState
        icon={Lock}
        title="Accès réservé"
        description="Cette section est réservée à un autre rôle."
      />
    );
  }

  return <>{children}</>;
}
