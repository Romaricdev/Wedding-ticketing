# Invitations de mariage avec QR code

Application privée de gestion d'invitations et de contrôle d'accès par QR code à usage unique.

> **Statut actuel : Phase 1 terminée** — schéma PostgreSQL, authentification Supabase, rôles `ADMIN` / `CONTROLLER`, routes protégées et seed de développement. Les écrans métier complets débutent en Phase 2.

## Prérequis

- [Node.js](https://nodejs.org/) 20 LTS ou supérieur
- [npm](https://www.npmjs.com/) 10 ou supérieur
- Compte [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
- Compte [Vercel](https://vercel.com/) pour le déploiement (optionnel en local)

## Installation

```bash
git clone <url-du-depot>
cd wedding
npm install
cp .env.example .env.local
# Renseigner les variables dans .env.local (voir ci-dessous)
npm run db:generate
npm run db:migrate:dev
npm run db:seed
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner :

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (serveur/seed uniquement) |
| `DATABASE_URL` | URL PostgreSQL poolée (runtime Prisma) |
| `DIRECT_URL` | URL PostgreSQL directe (migrations Prisma) |
| `QR_TOKEN_SECRET` | Secret serveur HMAC pour jetons QR déterministes (recommandé) |
| `QR_TOKEN_PEPPER` | Secours / alias historique du secret QR |
| `SEED_*_EMAIL` / `SEED_*_PASSWORD` | Identifiants fictifs pour le seed de développement |

Ne jamais committer de secrets réels. Seul `.env.example` est versionné.

Les commandes Prisma du projet lisent `.env.local` via `dotenv-cli`.

## Authentification locale

1. Appliquer les migrations (`npm run db:migrate:dev`).
2. Exécuter le seed (`npm run db:seed`) après avoir défini les variables `SEED_*` dans `.env.local`.
3. Ouvrir [http://localhost:3000/connexion](http://localhost:3000/connexion).
4. Se connecter avec un compte seed :
   - **ADMIN** → redirection vers `/admin`
   - **CONTROLLER** → redirection vers `/controle/scan`

Routes protégées minimales : `/admin`, `/controle/scan`, `/acces-refuse`.

## Commandes Prisma

| Commande | Description |
| --- | --- |
| `npm run db:generate` | Génère le client Prisma |
| `npm run db:validate` | Valide le schéma Prisma |
| `npm run db:migrate:dev` | Crée/applique une migration en développement |
| `npm run db:migrate:deploy` | Applique les migrations versionnées (production/staging) |
| `npm run db:seed` | Seed de développement idempotent (jamais en production) |

**Production :** les migrations sont appliquées manuellement et de façon contrôlée avec `npm run db:migrate:deploy` (ou `npx dotenv -e .env.local -- prisma migrate deploy` sur l'environnement cible). Ne pas utiliser `prisma db push` comme stratégie de migration.

## Commandes de développement

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement Next.js |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production local |
| `npm run lint` | Vérification ESLint |
| `npm run typecheck` | Vérification TypeScript |
| `npm run test` | Tests unitaires Vitest |
| `npm run test:e2e` | Tests end-to-end Playwright |

### Tests E2E de rôle (optionnels)

Les tests Playwright de permissions réutilisent automatiquement `SEED_*` si `E2E_*` est absent.

Ils **s'exécutent seulement si la connexion seed fonctionne** (après `npm run db:migrate:deploy` et `npm run db:seed`). Sinon, ils sont ignorés avec un message explicite ; la couverture des permissions reste assurée par les tests unitaires Vitest.

## RLS et accès base de données

- Toutes les tables métier `public.*` ont **RLS activé** sans politique permissive anonyme.
- Le navigateur n'accède **pas** directement aux tables métier : mutations futures via Next.js + Prisma.
- Prisma serveur utilise `DATABASE_URL` (rôle PostgreSQL direct/poolé) et **contourne RLS** ; l'autorisation est donc **obligatoire côté serveur** (`requireAdmin`, `requireControllerOrAdmin`, etc.).
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, `QR_TOKEN_SECRET` ou `QR_TOKEN_PEPPER` au client.

## Structure du projet

```text
src/
├── app/              # Routes (connexion, admin, controle, acces-refuse)
├── components/
├── lib/              # Prisma, Supabase, env
├── server/auth/      # Helpers requireUser/requireAdmin + actions
├── types/
prisma/
├── schema.prisma
├── migrations/       # Migrations versionnées + SQL complémentaire
└── seed.ts           # Seed de développement
tests/
├── unit/
└── e2e/
docs/
```

## Documentation

| Document | Description |
| --- | --- |
| [Spécification de référence](docs/SPECIFICATION_DE_REFERENCE_APPLICATION_MARIAGE.md) | Vision produit, périmètre MVP, règles métier |
| [Décisions métier finales](docs/DECISIONS_METIER_FINALES.md) | Cas limites validés (prévalent sur les autres docs) |
| [Design system](docs/DESIGN_SYSTEM_APPLICATION.md) | Tokens, typographie, composants, responsive |
| [Brief UI prêt à implémenter](docs/BRIEF_UI_PRET_A_IMPLEMENTER.md) | Écrans, routes, composants métier |
| [Spécification base de données](docs/SPECIFICATION_BASE_DE_DONNEES.md) | Schéma PostgreSQL, contraintes, index |
| [Plan d'implémentation](docs/PLAN_IMPLEMENTATION.md) | Phases de développement |
| [Cadrage technique initial](docs/CADRAGE_TECHNIQUE_BILLETTERIE_MARIAGE.md) | Contexte technique initial |

## Déploiement (Vercel + Supabase)

1. Configurer les variables d'environnement dans Vercel.
2. Déployer l'application (`npm run build`).
3. Appliquer manuellement les migrations sur la base de production : `npm run db:migrate:deploy`.
4. Ne pas exécuter le seed en production.

## Stack technique

Next.js (App Router), TypeScript strict, Tailwind CSS, Prisma, Supabase Auth, `lucide-react`, Zod, React Hook Form, Vitest, Playwright, ESLint, Prettier.
