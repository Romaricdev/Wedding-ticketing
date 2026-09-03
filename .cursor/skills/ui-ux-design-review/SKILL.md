---
name: ui-ux-design-review
description: Auditer une interface ou un flux avant livraison, avec une revue UX, responsive et accessibilité de niveau produit.
---

# Skill UI/UX Design Review

## Mission

Examiner une interface existante, identifier les problèmes actionnables et recommander des corrections cohérentes. Ne pas formuler de remarques décoratives sans impact sur compréhension, efficacité, accessibilité ou cohérence.

## Références

Lire `docs/DESIGN_SYSTEM_APPLICATION.md`, `docs/BRIEF_UI_PRET_A_IMPLEMENTER.md` et `docs/DECISIONS_METIER_FINALES.md` avant toute revue.

## Checklist

### Hiérarchie

- Objectif compris immédiatement ?
- Une action principale visible et bien libellée ?
- Actions destructives séparées et confirmées ?
- Données nécessaires visibles avant confirmation ?

### Cohérence

- Couleurs de statut correctes ?
- Composants réutilisés, icônes Lucide avec libellé clair ?
- Interface Cloudflare-inspirée, non décorative ?

### Formulaires et règles métier

- Labels, aides et erreurs explicites ?
- Contraintes métier expliquées au bon moment ?
- Table/capacité, Single/Couple et statuts lisibles ?
- Aucune interface ne suggère qu'une règle interdite est possible ?

### Scanner

- Statut compris via texte, icône et couleur ?
- Nom/type/table dominants en succès ?
- Scan suspendu pendant réponse serveur ?
- Sans Internet, aucune validation affichée ?

### Responsive/accessibilité

- Vérifié à 320, 375, 768, 1024 et 1440 px ?
- Aucun contenu coupé ou inaccessible ?
- Cibles tactiles 44px ; clavier, focus et contraste vérifiés ?
- Alternative mobile aux tableaux ?

## Priorités

- `P0` : bloque check-in, sécurité ou accès.
- `P1` : risque élevé d'erreur opérationnelle ou de données incorrectes.
- `P2` : incohérence UX/accessibilité notable avant livraison.
- `P3` : amélioration mineure.

Chaque retour indique écran, problème concret, impact et correction recommandée.
