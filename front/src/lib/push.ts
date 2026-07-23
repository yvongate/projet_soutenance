import { api } from '@/lib/api';

/** Convertit une clé VAPID base64url en Uint8Array (format attendu par PushManager). */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/** True si le navigateur supporte les notifications push. */
export function pushSupporte(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Active les notifications push : demande la permission, enregistre le service
 * worker, s'abonne au PushManager et envoie l'abonnement au backend.
 */
export async function activerPush(): Promise<void> {
  if (!pushSupporte()) {
    throw new Error('Notifications push non supportées par ce navigateur');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permission de notification refusée');
  }

  const { publicKey } = await api<{ publicKey: string | null }>(
    '/push/public-key',
  );
  if (!publicKey) throw new Error('Clé de notification serveur indisponible');

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  const json = subscription.toJSON();
  await api('/push/subscribe', {
    method: 'POST',
    body: { endpoint: json.endpoint, keys: json.keys },
  });
}
