# Plan d'implémentation et processus de développement

> **Objectif :** construire l'application par étapes sûres et testables, sans commencer les fonctions dépendantes avant que leurs fondations soient validées.
>
> **Références obligatoires :** [spécification produit](SPECIFICATION_DE_REFERENCE_APPLICATION_MARIAGE.md), [décisions métier finales](DECISIONS_METIER_FINALES.md), [design system](DESIGN_SYSTEM_APPLICATION.md), [brief UI](BRIEF_UI_PRET_A_IMPLEMENTER.md) et [spécification base de données](SPECIFICATION_BASE_DE_DONNEES.md).

## 1. Ordre global

```text
Fondations projet
-> Base de données et authentification
-> Shell UI et design system
-> Tables et invités
-> Billets, QR et PDF
-> Check-in et scanner
-> Historique, tests et recette
-> Déploiement et préparation jour J
```

Ne pas inverser cet ordre : le scanner dépend des billets, les billets dépendent des invités et tables, et toutes les actions dépendent des droits et de la base de données.

## 2. Phase 0 - Préparation technique

### Objectif

Initialiser le dépôt de façon cohérente et préparer les environnements local, test et production gratuite.

### Actions

1. Créer l'application Next.js avec TypeScript strict et App Router.
2. Ajouter Tailwind CSS, `lucide-react`, React Hook Form, Zod, Prisma, Supabase et les bibliothèques QR/PDF/scanner retenues.
3. Configurer ESLint, formatage, scripts de test et variables d'environnement.
4. Créer les projets Supabase et Vercel nécessaires.
5. Préparer les fichiers `.env.example` sans aucun secret.
6. Configurer le stockage Supabase privé pour le template et les PDF si leur conservation est nécessaire.

### Livrables

- Projet Next.js lançable localement.
- Guide de démarrage dans le README.
- Variables d'environnement documentées.
- Déploiement de prévisualisation fonctionnel.

### Critères de fin

- `lint`, `typecheck` et build réussissent.
- Aucun secret n'est versionné dans Git.
- L'application se déploie sur Vercel.

## 3. Phase 1 - Base de données et authentification

### Objectif

Mettre en place la source de vérité et les droits avant toute interface métier.

### Actions

1. Créer le schéma Prisma selon la spécification de base de données.
2. Écrire les migrations PostgreSQL, index, contraintes et SQL complémentaire nécessaires.
3. Mettre en place Supabase Auth.
4. Créer `event_users` et les rôles `ADMIN` / `CONTROLLER`.
5. Protéger les routes serveur et les pages selon le rôle.
6. Écrire un seed de développement avec événement, utilisateurs fictifs, tables, invités et billets de test.

### Tests obligatoires

- Un Admin accède à `/admin`.
- Un Contrôleur accède à `/controle/scan` mais pas aux routes Admin.
- Une personne non connectée est redirigée vers la connexion.
- Les migrations peuvent être appliquées à une base vide.

### Critères de fin

- Les tables et contraintes principales existent.
- Les rôles sont appliqués côté serveur.
- Aucun accès métier n'est fait directement depuis le navigateur vers PostgreSQL.

## 4. Phase 2 - Shell UI et design system

### Objectif

Construire les composants réutilisables et le cadre responsive avant de produire les pages métier.

### Actions

1. Construire `AppShell`, sidebar, topbar et navigation responsive.
2. Créer boutons, champs, messages d'erreur, badges, tableaux, listes mobiles, tiroirs et dialogues de confirmation.
3. Implémenter les états chargement, vide, erreur et accès refusé.
4. Installer les tokens de couleurs, typographies, espacements et focus du design system.
5. Construire l'écran de connexion et le tableau de bord avec données de seed.

### Critères de fin

- Les composants sont réutilisables, accessibles et cohérents.
- Le shell fonctionne à 320, 375, 768, 1024 et 1440 px.
- Les icônes viennent exclusivement de `lucide-react`.

## 5. Phase 3 - Gestion des tables

### Objectif

Permettre à l'administrateur de préparer les places avant l'émission des billets.

### Actions

1. Créer liste, formulaire et détail de table.
2. Ajouter validation du nom/numéro unique et de la capacité positive.
3. Calculer places attribuées et restantes à partir des personnes actives.
4. Bloquer toute modification ou affectation dépassant la capacité.
5. Ajouter l'historique/audit des créations et modifications importantes.

### Critères de fin

- Une table ne peut pas dépasser sa capacité.
- Une table non vide n'est pas supprimée silencieusement.
- Les vues mobile et desktop restent lisibles.

## 6. Phase 4 - Gestion des invités et import

### Objectif

Créer les personnes individuellement et les placer avant toute création de billet.

### Actions

1. Créer liste, filtres, recherche, formulaire et fiche invité.
2. Gérer nom, prénoms, table et statut.
3. Implémenter import CSV/Excel avec aperçu, mapping, erreurs par ligne et confirmation.
4. Ajouter export CSV réservé à l'Admin.
5. Implémenter l'annulation d'un invité et l'action explicite d'annulation de son billet actif si nécessaire.

### Tests obligatoires

- Les doublons potentiels sont signalés à l'import.
- Une table complète bloque l'affectation.
- Un invité annulé et son billet annulé restent dans l'historique.

### Critères de fin

- Une personne peut exister sans billet.
- Toutes les personnes destinées à un billet possèdent une table.
- Les actions Admin sont auditées.

## 7. Phase 5 - Billets, QR et PDF

### Objectif

Créer les billets Single/Couple et générer fidèlement les PDF à partir du template fixe.

### Actions

1. Construire le workflow de création unique avec choix Single/Couple.
2. Ajouter la sélection de une ou deux personnes sans billet actif.
3. Vérifier table obligatoire, capacité et table identique pour un Couple.
4. Générer un jeton cryptographique, en stocker uniquement le hash, puis créer le billet transactionnellement.
5. Configurer le template PDF et les coordonnées QR.
6. Générer le PDF avec `pdf-lib` et un QR noir sur fond blanc.
7. Permettre téléchargement, réémission, révocation et annulation selon les règles métier.
8. Si la génération PDF échoue, permettre la relance sur le même billet et le même QR.

### Tests obligatoires

- Single : une personne associée.
- Couple : deux personnes distinctes, même table, arrivée commune.
- Création refusée si personne sans table, table pleine ou billet actif existant.
- Un QR est unique et le jeton brut n'est pas en base.
- Ancien QR refusé après réémission.
- PDF lisible et QR scannable sur papier/écran.

### Critères de fin

- Les PDF conservent le template sans modification graphique autre que le QR.
- Aucun billet Couple ne peut être modifié ; il doit être remplacé par un nouveau billet.

## 8. Phase 6 - Check-in et scanner

### Objectif

Permettre le contrôle réel à l'entrée, de manière rapide et atomique.

### Actions

1. Implémenter l'API de check-in avec transaction PostgreSQL.
2. Créer l'écran scanner mobile avec `@zxing/browser`.
3. Gérer permission caméra, changement de caméra, scan suspendu après lecture et état réseau.
4. Afficher les résultats : accepté, déjà utilisé, invalide, révoqué, annulé.
5. Créer recherche manuelle ; seul Admin peut confirmer une entrée manuelle avec motif.
6. Journaliser toutes les tentatives de scan.
7. Détecter l'absence de connexion et afficher qu'aucune validation n'est possible sans serveur.

### Tests obligatoires

- Premier scan : accepté une seule fois.
- Deux scans simultanés : exactement une acceptation.
- Second scan : déjà utilisé.
- Couple : deux personnes affichées et validées ensemble.
- QR annulé/révoqué/inconnu : refusé.
- Contrôleur sans permission : aucune validation manuelle.
- Sans Internet : aucun succès local ne peut être affiché.

### Critères de fin

- Scanner utilisable sur téléphone/tablette.
- Résultat lisible immédiatement avec texte, icône et couleur.
- La base constitue la seule source de vérité du statut d'entrée.

## 9. Phase 7 - Historique, recette et qualité

### Objectif

Finaliser la visibilité opérationnelle et vérifier le produit avant usage réel.

### Actions

1. Construire l'historique Admin avec filtres par résultat, opérateur, table et heure.
2. Finaliser tableau de bord et dernières entrées.
3. Ajouter tests unitaires des règles métier et tests end-to-end des parcours.
4. Tester les permissions, erreurs réseau, session expirée et responsive.
5. Vérifier sécurité des variables, RLS, URLs signées et absence de secrets dans les réponses/API.

### Recette opérationnelle obligatoire

1. Tester Chrome Android et Safari iOS si utilisés le jour J.
2. Scanner le même QR depuis deux appareils au même instant.
3. Tester QR sur papier, écran, faible lumière et caméra moyenne qualité.
4. Tester Single, Couple, annulé, révoqué, utilisé, inconnu et recherche manuelle.
5. Tester la génération d'un volume réaliste de billets.
6. Vérifier que le projet Supabase gratuit est bien actif quelques jours avant le mariage.

### Critères de fin

- Tous les critères d'acceptation des documents de référence sont passants.
- Aucune erreur bloquante ouverte.
- Les organisateurs savent utiliser Admin et Scanner.

## 10. Phase 8 - Déploiement et préparation du jour J

### Objectif

Mettre l'application en ligne et rendre l'exploitation fiable dans les limites du plan gratuit.

### Actions

1. Déployer la version validée sur Vercel.
2. Configurer domaine HTTPS si disponible.
3. Définir les variables de production dans Vercel et ne jamais les exposer.
4. Créer les comptes Admin/Contrôleur définitifs.
5. Importer les données réelles, configurer les tables et générer les billets.
6. Vérifier l'état actif de Supabase avant l'événement.
7. Préparer connexion Internet de secours, chargeurs et liste d'invités/table de secours.
8. Effectuer une répétition générale avec les appareils des contrôleurs.

### Critères de fin

- Les contrôleurs peuvent se connecter et scanner.
- Les billets réels sont téléchargeables et testés.
- Le plan de secours est disponible.

## 11. Processus de travail pour chaque fonctionnalité

Pour chaque élément développé, appliquer ce cycle :

```text
Lire les documents de référence
-> identifier rôle, règle métier et écran concernés
-> implémenter base de données/API si nécessaire
-> implémenter composant/interface responsive
-> écrire ou mettre à jour tests
-> vérifier desktop, tablette et mobile
-> tester les erreurs et permissions
-> faire relire le résultat
```

Ne jamais implémenter une interface qui suppose une règle métier non documentée. En cas d'ambiguïté, demander une décision avant de coder.

## 12. Définition finale de « terminé »

Une phase ou fonctionnalité est terminée seulement si :

- Le comportement respecte les documents de référence.
- Les tests pertinents passent.
- Les permissions sont vérifiées côté serveur.
- Le responsive est contrôlé aux cinq largeurs de référence.
- Les états vide, chargement, erreur et succès sont couverts.
- Les données sensibles et secrets ne sont pas exposés.
- Aucun cas limite validé n'est contourné par l'interface.

