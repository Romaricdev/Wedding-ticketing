---
name: pdf-ticket
description: Générer fidèlement les billets PDF depuis le template immuable avec QR unique.
---

# Workflow PDF

1. Lire `docs/SPECIFICATION_DE_REFERENCE_APPLICATION_MARIAGE.md` et `docs/DECISIONS_METIER_FINALES.md`.
2. Utiliser `pdf-lib` et le template original comme fond ; ne modifier aucun texte, photo ou décoration.
3. Générer QR depuis le jeton actif, jamais depuis nom/table/type.
4. Positionner le QR selon `ticket_templates` en coordonnées PDF (origine bas-gauche), avec fond blanc et marge blanche.
5. Si la génération échoue, conserver le billet et permettre une relance avec le même token.
6. Rendre le PDF puis vérifier visuellement et par lecture QR avant livraison.
