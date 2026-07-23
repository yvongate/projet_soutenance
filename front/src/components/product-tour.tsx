'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import 'driver.js/dist/driver.css';
import { useAuth } from '@/store/auth';
import { cleTour, lancerTour } from '@/lib/tour';

/**
 * Déclenche la visite guidée une seule fois par profil, à la première
 * arrivée sur l'accueil. Le drapeau « déjà vu » est stocké en localStorage.
 * Monté dans le layout des pages protégées ; ne rend rien.
 */
export function ProductTour() {
  const user = useAuth((s) => s.user);
  const pathname = usePathname();

  useEffect(() => {
    if (!user || pathname !== '/') return;
    const cle = cleTour(user);
    if (localStorage.getItem(cle)) return;

    // Laisse le temps au bottom nav / à la navbar de se monter (ancres du tour).
    const t = setTimeout(() => {
      lancerTour(user, () => localStorage.setItem(cle, '1'));
    }, 700);
    return () => clearTimeout(t);
  }, [user, pathname]);

  return null;
}
