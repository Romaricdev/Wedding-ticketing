---
name: database-migration
description: Créer ou modifier les migrations Prisma/PostgreSQL de cette application.
---

# Workflow migrations

1. Lire intégralement `docs/SPECIFICATION_BASE_DE_DONNEES.md` avant toute migration.
2. Utiliser Prisma pour les modèles et migrations SQL personnalisées pour index partiels, triggers et contraintes non exprimables par Prisma.
3. Ne jamais supprimer les historiques ; utiliser statuts et migrations compatibles avec données existantes.
4. Ajouter index pour token hash, event/statut, historique et recherches prévues.
5. Tester migration sur base vide et vérifier rollback/reprise si applicable.
6. Mettre à jour documentation et seed lorsque le schéma évolue.
