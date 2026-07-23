'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Bell, BellRing, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { activerPush } from '@/lib/push';
import type { AppNotification } from '@/lib/types';

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [activation, setActivation] = useState(false);
  const [abonne, setAbonne] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // État de l'abonnement push (pour n'afficher le bouton que si nécessaire)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setAbonne(!!sub))
      .catch(() => undefined);
  }, []);

  const chargerCount = useCallback(() => {
    api<{ nonLues: number }>('/notifications/non-lues')
      .then((r) => setCount(r.nonLues))
      .catch(() => undefined);
  }, []);

  // Sondage du compteur toutes les 30 s
  useEffect(() => {
    chargerCount();
    const iv = setInterval(chargerCount, 30000);
    return () => clearInterval(iv);
  }, [chargerCount]);

  // Chargement de la liste à l'ouverture
  useEffect(() => {
    if (!open) return;
    api<AppNotification[]>('/notifications')
      .then(setItems)
      .catch(() => undefined);
  }, [open]);

  // Fermeture au clic extérieur
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function toutMarquerLu() {
    try {
      await api('/notifications/tout-lu', { method: 'POST' });
      setCount(0);
      const maj = await api<AppNotification[]>('/notifications');
      setItems(maj);
    } catch {
      toast.error('Action impossible');
    }
  }

  async function activer() {
    setActivation(true);
    try {
      await activerPush();
      setAbonne(true);
      toast.success('Notifications push activées 🔔');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Activation impossible');
    } finally {
      setActivation(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="font-semibold">Notifications</span>
            <button
              type="button"
              onClick={toutMarquerLu}
              className="flex items-center gap-1 rounded text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Check className="h-3.5 w-3.5" />
              Tout lire
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Aucune notification.
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-2 border-b px-3 py-2 text-sm last:border-0 ${
                    n.lu ? '' : 'bg-accent/40'
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.lu ? 'bg-transparent' : 'bg-blue-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="break-words">{n.message}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(n.dateEnvoi).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t p-2">
            {abonne ? (
              <div className="flex items-center justify-center gap-2 py-1.5 text-sm text-muted-foreground">
                <BellRing className="h-4 w-4 text-green-600" />
                Notifications push activées
              </div>
            ) : (
              <button
                type="button"
                onClick={activer}
                disabled={activation}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              >
                <BellRing className="h-4 w-4" />
                {activation ? 'Activation…' : 'Activer les notifications push'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
