'use client';

import { useEffect } from 'react';

/** Enregistre le service worker (PWA + push) au chargement de l'app. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, []);

  return null;
}
