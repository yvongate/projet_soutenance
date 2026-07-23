# BiblioSmart

PWA de gestion de bibliothèque universitaire : catalogue, emprunt par QR Code
à deux temps, réservations en file d'attente, recommandations, tickets
d'assistance et notifications multicanal. Trois rôles cumulables : étudiant,
bibliothécaire, administrateur.

Projet de soutenance — voir le [document d'architecture](https://claude.ai/code/artifact/4df03443-4e01-423c-8d2d-7975b5d7d36d) pour le détail des décisions techniques.

## Structure

```
back/   API NestJS + Prisma + PostgreSQL
front/  Next.js 16 (App Router) — PWA
```

Chaque dossier a son propre `README.md` avec les instructions détaillées.

## Stack

| Composant | Techno |
| --- | --- |
| Backend | NestJS 11, Prisma 6, PostgreSQL |
| Auth | JWT + bcrypt, rôles cumulables |
| Sécurité | helmet, throttling, CORS restreint |
| Frontend | Next.js 16, React 19, Tailwind 4, shadcn/ui |
| État | Zustand (persist), Dexie (cache hors-ligne) |
| PWA | Service worker manuel, manifest, icônes iOS/Android |

## Démarrer en local

```bash
# Backend — http://localhost:3001/api
cd back
npm install
npm run start:dev

# Frontend — http://localhost:3000
cd front
npm install
npm run dev
```

Chaque dossier nécessite son propre `.env` (voir `back/.env.example` et les
variables `NEXT_PUBLIC_*` côté front).

## Déploiement

- **Backend** → Render (Web Service), répertoire racine `back/`.
- **Frontend** → Vercel, répertoire racine `front/`.

Penser à renseigner `FRONT_URL` côté back (whitelist CORS) et
`NEXT_PUBLIC_API_URL` côté front une fois les deux déployés.
