---
name: ui-ux-product-designer
description: Concevoir des interfaces UI/UX de niveau produit pour l'application de billetterie mariage, fidèles au design system et aux workflows métier.
---

# Skill UI/UX Product Designer

## Mission

Concevoir des interfaces claires, élégantes, accessibles et prêtes à implémenter. Le produit est un back office opérationnel inspiré de Cloudflare, pas un site vitrine de mariage. L'identité graphique du billet PDF ne doit pas contaminer l'interface d'administration.

## Sources obligatoires

Lire avant toute conception : `docs/DESIGN_SYSTEM_APPLICATION.md`, `docs/BRIEF_UI_PRET_A_IMPLEMENTER.md`, `docs/SPECIFICATION_DE_REFERENCE_APPLICATION_MARIAGE.md` et `docs/DECISIONS_METIER_FINALES.md`.

## Processus de conception

1. Identifier rôle, objectif, données indispensables et action principale.
2. Définir le parcours avant de placer les composants.
3. Réutiliser les composants existants avant d'en créer un nouveau.
4. Concevoir les états normal, chargement, vide, erreur, succès, désactivé et accès refusé.
5. Concevoir desktop, tablette et mobile simultanément.
6. Vérifier clavier, focus, lisibilité et cibles tactiles.

## Principes de décision

- Une page = un objectif clair et une action primaire identifiable.
- Mettre les données nécessaires à la décision avant toute action irréversible.
- Réduire les choix au moment du scan ; le scanner doit être immédiatement compréhensible.
- Préférer tableaux pour comparer, formulaires structurés pour créer/modifier et panneaux détail pour consulter sans perdre le contexte.
- Utiliser confirmations uniquement pour annulation, révocation, réémission, validation manuelle et suppression.
- Ne jamais utiliser couleur seule ou cacher une action importante au survol/menu ambigu.

## Direction visuelle

- Back office dense, sobre, surfaces blanches, fond neutre, bordures fines et faible élévation.
- Orange réservé aux actions/navigation actives ; vert succès, orange attention, rouge refus, bleu information.
- Inter et `lucide-react` exclusivement.
- Aucun élément romantique, fleur, photo, police décorative ou dégradé dans le back office.

## Responsive obligatoire

- Vérifier 320, 375, 768, 1024 et 1440 px.
- Mobile : une colonne, menu tiroir, champs 16px minimum, cibles 44px minimum.
- Transformer tableaux larges en listes/cartes avec détail ouvrable ; jamais de zoom horizontal de page.
- Modales : feuille basse ou écran plein sur téléphone.
- Scanner mobile-first, sans shell dense de l'administration.

## Contrat de sortie

Pour chaque écran, documenter ou vérifier : objectif/rôle, hiérarchie visuelle, composants/données, états/erreurs, interactions/confirmations, variantes responsive et accessibilité.
