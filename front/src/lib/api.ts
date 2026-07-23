import { useAuth } from '@/store/auth';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Ajouter le token JWT (par défaut : oui). */
  auth?: boolean;
}

/**
 * Appelle l'API backend. Ajoute automatiquement le JWT, gère les erreurs
 * et déconnecte l'utilisateur en cas de 401.
 */
export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = useAuth.getState().token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch rejette (réseau coupé, serveur injoignable) : message clair et humain
    const horsLigne =
      typeof navigator !== 'undefined' && navigator.onLine === false;
    throw new ApiError(
      horsLigne
        ? 'Vous êtes hors ligne — cette action nécessite une connexion.'
        : 'Serveur injoignable — vérifiez votre connexion et réessayez.',
      0,
    );
  }

  if (res.status === 401 && auth) {
    useAuth.getState().logout();
  }

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message = extraireMessage(data) ?? `Erreur ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

/**
 * Télécharge un fichier depuis une route protégée (ajoute le JWT) et déclenche
 * l'enregistrement côté navigateur. Utilisé pour les exports CSV.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = useAuth.getState().token;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError('Téléchargement impossible', res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Extrait le message d'erreur du backend (string ou tableau class-validator). */
function extraireMessage(data: unknown): string | null {
  if (data && typeof data === 'object' && 'message' in data) {
    const m = (data as { message: unknown }).message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  return null;
}
