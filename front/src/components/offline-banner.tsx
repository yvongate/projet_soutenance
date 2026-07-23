'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/** Affiche une bannière quand la connexion est perdue. */
export function OfflineBanner() {
  const [horsLigne, setHorsLigne] = useState(false);

  useEffect(() => {
    const online = () => setHorsLigne(false);
    const offline = () => setHorsLigne(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    // Lecture initiale différée (pas de setState synchrone dans l'effet)
    const t = setTimeout(() => setHorsLigne(!navigator.onLine), 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  if (!horsLigne) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-sm font-medium text-white">
      <WifiOff className="h-4 w-4" />
      Mode hors ligne — les disponibilités peuvent ne pas être à jour
    </div>
  );
}
