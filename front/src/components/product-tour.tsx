'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import 'driver.js/dist/driver.css';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { lancerTour } from '@/lib/tour';
import type { User } from '@/lib/types';

/**
 * Déclenche la visite guidée une seule fois par compte, à la première arrivée
 * sur l'accueil. Le drapeau « déjà vu » est mémorisé **côté serveur**
 * (`user.tutorielVu`) et non en localStorage, pour ne pas se relancer sur
 * chaque appareil / navigateur / PWA. Monté dans le layout ; ne rend rien.
 */
export function ProductTour() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const pathname = usePathname();

  useEffect(() => {
    if (!user || pathname !== '/accueil' || user.tutorielVu) return;

    // Laisse le temps au bottom nav / à la navbar de se monter (ancres du tour).
    const t = setTimeout(() => {
      lancerTour(user, () => {
        // Met à jour l'état local immédiatement (évite tout re-déclenchement)
        // puis persiste sur le compte.
        setUser({ ...user, tutorielVu: true });
        api<User>('/auth/tutoriel-vu', { method: 'POST' })
          .then(setUser)
          .catch(() => undefined);
      });
    }, 700);
    return () => clearTimeout(t);
  }, [user, pathname, setUser]);

  return null;
}
