# BiblioSmart — API

Backend NestJS + Prisma + PostgreSQL de BiblioSmart. Monolithe modulaire :
un module = un domaine métier (`controller → service → PrismaService`).
Détails et invariants dans le [document d'architecture](https://claude.ai/code/artifact/4df03443-4e01-423c-8d2d-7975b5d7d36d).

## Modules

`auth` · `users` · `catalogue` · `emprunts` · `reservations` · `tickets` ·
`notifications` · `push` · `mail` · `rappels` · `recommandations` · `stats`

## Installation

```bash
npm install
cp .env.example .env   # puis renseigner les valeurs (voir ci-dessous)
npx prisma migrate deploy
npm run start:dev
```

L'API démarre sur `http://localhost:3001/api`.

## Variables d'environnement

Voir `.env.example` pour la liste complète (base de données, JWT, SMTP,
clés VAPID pour le push). `DATABASE_URL` et `JWT_SECRET` sont obligatoires ;
le reste a des comportements de repli en développement (email → Ethereal).

## Scripts utiles

| Commande | Rôle |
| --- | --- |
| `npm run start:dev` | serveur en mode watch |
| `npm run build` | build de production |
| `npm run lint` | ESLint |
| `npm test` | tests unitaires (Jest) |
| `npm run test:e2e` | tests end-to-end |
| `npx prisma migrate deploy` | applique les migrations |
| `npx prisma studio` | explorateur de la base |

## Sécurité

`helmet`, limitation de débit globale (`@nestjs/throttler`, 100 req/min/IP)
avec bridage renforcé sur `/auth/login`, `/auth/forgot-password` et
`/auth/reset-password` (5 req/min/IP), CORS restreint à `FRONT_URL`,
mots de passe `bcrypt`.

## Déploiement (Render)

- Répertoire racine du service : `back/`
- Build command : `npm install && npx prisma generate && npm run build`
- Start command : `npm run start:prod`
- Renseigner toutes les variables de `.env.example` dans le dashboard Render.
