# Instructions projet - Billetterie mariage

Lire `README.md` et tous les documents de `docs/` avant toute implémentation importante.

Règles non négociables : QR opaque sans données personnelles ; serveur source de vérité ; validation atomique unique ; Couple = exactement deux invités individuels qui arrivent ensemble ; table obligatoire et capacité jamais dépassée ; validation manuelle réservée à ADMIN ; template PDF immuable sauf QR ; sans Internet, aucune validation.

Utiliser Next.js, TypeScript strict, Tailwind, Prisma, Supabase, `lucide-react`, `pdf-lib`, `qrcode` et `@zxing/browser`. Toutes les mutations métier passent par routes serveur + Prisma. Ne jamais exposer secrets Supabase ou `DATABASE_URL` au client.

Avant de terminer : tests adaptés, états chargement/vide/erreur, permissions serveur et responsive à 320/375/768/1024/1440 px.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
