# BiblioSmart — Front

PWA Next.js 16 (App Router) de BiblioSmart : catalogue, emprunt par scan QR,
réservations, recommandations, messagerie (tickets), notifications push,
mode hors-ligne. Trois tableaux de bord adaptés au rôle (étudiant,
bibliothécaire, administrateur). Détails dans le
[document d'architecture](https://claude.ai/code/artifact/4df03443-4e01-423c-8d2d-7975b5d7d36d).

## Installation

```bash
npm install
# créer .env.local avec les variables ci-dessous
npm run dev
```

L'app démarre sur `http://localhost:3000`.

## Variables d'environnement (`.env.local`)

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL de l'API backend (ex. `http://localhost:3001/api`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | clé publique VAPID pour les notifications push |

## Scripts utiles

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de dev (Turbopack) |
| `npm run build` | build de production |
| `npm run start` | sert le build de production |
| `npm run lint` | ESLint |

## Stack notable

Tailwind 4 + shadcn/ui (base-ui, pas Radix), Zustand (`persist`) pour l'auth,
Dexie pour le cache hors-ligne du catalogue, jsQR pour le scan caméra,
driver.js pour la visite guidée. PWA via service worker manuel
(`public/sw.js`, stratégie network-first) — pas de `next-pwa`/serwist.

## Déploiement (Vercel)

- Répertoire racine du projet : `front/`
- Build command : `next build` (détecté automatiquement)
- Renseigner `NEXT_PUBLIC_API_URL` (et `NEXT_PUBLIC_VAPID_PUBLIC_KEY` si le
  push est utilisé) dans les variables d'environnement du projet Vercel.
