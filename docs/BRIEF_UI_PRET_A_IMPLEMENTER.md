# Brief UI prêt à implémenter

> **Destinataire :** IA ou développeur chargé de construire les interfaces.
>
> **But :** générer les écrans de l'application de billetterie mariage sans interpréter ou inventer les règles métier. Ce document complète la [spécification de référence](SPECIFICATION_DE_REFERENCE_APPLICATION_MARIAGE.md) et le [design system](DESIGN_SYSTEM_APPLICATION.md), qui sont obligatoires.
>
> Les règles de cas limite validées se trouvent dans [Décisions métier finales](DECISIONS_METIER_FINALES.md) et prévalent sur toute règle plus ancienne de ce brief.

## 1. Règles impératives d'implémentation

1. Utiliser Next.js, TypeScript, Tailwind CSS et `lucide-react`.
2. Respecter strictement le design system : back office sobre inspiré de Cloudflare, pas de site romantique ou décoratif.
3. Chaque écran est responsive et testé à 320, 375, 768, 1024 et 1440 px.
4. Chaque requête doit avoir les états chargement, vide, erreur et succès lorsque pertinents.
5. Ne jamais implémenter de validation de sécurité uniquement côté client : l'interface appelle une API qui applique les règles métier côté serveur.
6. Ne pas afficher, demander ou encoder les données personnelles dans le QR code.
7. Ne pas créer de fonctionnalités hors périmètre : paiement, e-mail/SMS/WhatsApp automatique, mode hors-ligne multi-appareils ou arrivée séparée d'un couple.
8. Utiliser un français cohérent dans toute l'interface.
9. Utiliser `Single - 1 personne` et `Couple - 2 personnes` dans les textes visibles ; ne pas laisser l'utilisateur déduire la règle.
10. Le template de mariage est un PDF fixe. Ne créer aucune interface de modification de ses textes, photos ou décorations ; l'interface de template sert uniquement à positionner le QR.

## 2. Architecture d'interface et routes proposées

Les noms de routes peuvent évoluer, mais l'organisation fonctionnelle doit rester la même.

| Route | Écran | Rôle minimal |
| --- | --- | --- |
| `/connexion` | Connexion | Public |
| `/admin` | Tableau de bord | Administrateur |
| `/admin/invites` | Liste des invités | Administrateur |
| `/admin/invites/nouveau` | Création d'un invité | Administrateur |
| `/admin/invites/[id]` | Fiche invité | Administrateur |
| `/admin/import` | Import d'invités | Administrateur |
| `/admin/tables` | Liste des tables | Administrateur |
| `/admin/tables/nouvelle` | Création de table | Administrateur |
| `/admin/tables/[id]` | Détail table | Administrateur |
| `/admin/billets` | Liste des billets | Administrateur |
| `/admin/billets/nouveau` | Création Single/Couple | Administrateur |
| `/admin/billets/[id]` | Détail billet | Administrateur |
| `/admin/template` | Configuration du template | Administrateur |
| `/admin/controleurs` | Gestion des contrôleurs | Administrateur |
| `/admin/historique` | Historique des scans | Administrateur |
| `/admin/parametres` | Paramètres événement | Administrateur |
| `/controle/scan` | Scanner | Contrôleur ou administrateur |
| `/controle/recherche` | Recherche manuelle | Contrôleur ou administrateur |

Toute route protégée doit vérifier la session et le rôle sur le serveur. Un contrôleur qui tente d'ouvrir une route `/admin/*` doit être redirigé vers `/controle/scan` ou recevoir un écran d'accès refusé selon la politique de navigation retenue.

## 3. Composants réutilisables à créer avant les pages

Créer des composants réutilisables et cohérents. Ne pas dupliquer la logique ou le style dans chaque page.

| Composant | Responsabilité |
| --- | --- |
| `AppShell` | Structure globale Admin : sidebar, topbar, contenu principal |
| `AdminSidebar` | Navigation Admin et indication de page active |
| `Topbar` | Fil d'Ariane, utilisateur connecté, menu compte/déconnexion |
| `PageHeader` | Titre, description, actions principales de page |
| `DataTable` | Table desktop, états, colonnes, pagination et actions de ligne |
| `MobileList` | Alternative lisible aux tableaux larges sur téléphone |
| `StatusBadge` | Statuts de billet, invité et scan avec texte explicite |
| `EmptyState` | Message de liste vide et action suivante |
| `LoadingState` | Chargement de page, liste ou panneau |
| `ErrorState` | Erreur récupérable avec bouton réessayer |
| `ConfirmDialog` | Confirmation pour action destructive ou irréversible |
| `FormField` | Label, aide, champ et erreur accessible |
| `SearchInput` | Recherche avec délai raisonnable et bouton effacer |
| `FilterBar` | Filtres, compteurs de résultats et réinitialisation |
| `Toast` | Retour non bloquant de succès/erreur |
| `DetailDrawer` | Détail rapide desktop/tablette ; devient page/plein écran mobile |
| `ScannerViewport` | Caméra et cadre de détection QR |
| `ScanResult` | Résultat vert/orange/rouge/bleu, contenu et action suivante |
| `NetworkStatus` | État connecté, connexion faible ou indisponible |

## 4. Shell Admin

### But

Fournir une navigation stable pour toutes les pages administrateur.

### Sidebar desktop

Afficher, dans cet ordre :

1. Logo/nom court de l'événement.
2. Tableau de bord (`LayoutDashboard`).
3. Invités (`Users`).
4. Tables (`Armchair` ou `TableProperties`).
5. Billets (`Ticket`).
6. Contrôleurs (`ShieldCheck`).
7. Historique (`History`).
8. Paramètres (`Settings`).

L'élément actif est identifiable par fond orange clair, texte foncé et bordure/repère orange. Chaque entrée contient une icône et un libellé : jamais des icônes seules.

### Topbar

À droite : nom du compte, rôle, menu utilisateur et déconnexion. À gauche : fil d'Ariane si la profondeur le justifie.

### Responsive

- `>= 1024 px` : sidebar fixe ouverte.
- `768-1023 px` : sidebar repliable ou étroite ; libellés accessibles au survol/focus mais pas uniquement ainsi.
- `< 768 px` : bouton menu ouvrant un tiroir ; fermer après navigation ; titre de page visible dans le contenu.

## 5. Écran Connexion - `/connexion`

### But

Permettre à un administrateur ou contrôleur d'ouvrir une session.

### Contenu

- Nom de l'événement ou nom de l'application.
- Champ e-mail/identifiant.
- Champ mot de passe avec bouton afficher/masquer.
- Bouton primaire `Se connecter`.
- Zone d'erreur accessible si les identifiants sont invalides ou si le service est indisponible.

### Interactions

```text
Soumission valide -> authentification
-> rôle ADMIN -> /admin
-> rôle CONTROLLER -> /controle/scan
```

### Interdits

- Pas de création de compte publique.
- Pas de lien de récupération de mot de passe tant que ce flux n'est pas explicitement défini.
- Ne pas révéler si un e-mail existe ou non lors d'une erreur.

### Responsive

Formulaire unique centré, largeur maximale limitée. Sur téléphone : marges 16 px, champs et bouton pleine largeur.

## 6. Tableau de bord Admin - `/admin`

### But

Donner une vision immédiate de l'avancement et de l'accueil en cours.

### Données affichées

- Personnes attendues : total des personnes associées à des billets actifs.
- Entrées validées : personnes réellement admises ; un Couple accepté compte pour 2.
- Personnes restantes.
- Billets utilisés.
- Scans refusés, si des données existent.
- Dernières entrées : nom(s), type, table, heure et résultat.

### Composition

1. `PageHeader` : titre `Tableau de bord`, date/lieu de l'événement, action `Voir les invités`.
2. Grille de statistiques : 3 à 5 tuiles maximum.
3. Bloc `Dernières entrées` avec lien `Voir l'historique complet`.
4. Bloc d'alerte seulement si utile : aucune table créée, projet sans contrôleur, scan refusé récent ou réseau/API indisponible.

### Interactions

- Cliquer une statistique ouvre la liste filtrée correspondante.
- Cliquer une entrée ouvre son détail dans l'historique.
- Les données se rafraîchissent à l'ouverture et, le jour de l'événement, régulièrement sans perturber la lecture.

### Responsive

- Desktop : 3 ou 4 statistiques par ligne.
- Tablette : 2 par ligne.
- Mobile : une colonne, dernières entrées sous forme de liste compacte.

## 7. Liste des invités - `/admin/invites`

### But

Trouver, créer, consulter et administrer les personnes individuellement.

### Barre d'action

- Action primaire : `Ajouter un invité` (`Plus`).
- Action secondaire : `Importer une liste` (`Upload`).
- Action facultative : `Exporter CSV` (`Download`), réservée à l'administrateur.

### Filtres

- Recherche par nom/prénoms.
- Table.
- Statut d'invité : Actif, Annulé, Archivé.
- Situation billet : Sans billet, Single, Couple, Billet utilisé, Billet révoqué.

### Tableau desktop

Colonnes, dans cet ordre : Nom et prénoms, Table, Billet, Statut, Dernière activité, Actions.

Actions de ligne : `Voir`, puis menu secondaire `Modifier`, `Annuler` si autorisé. Une ligne est cliquable vers la fiche, sans rendre le menu d'action difficile à utiliser.

### Version mobile

Chaque ligne devient un bloc compact : nom/prénoms, table, badge billet, badge statut, chevron vers fiche. Les filtres sont placés dans un panneau repliable. Ne pas afficher un tableau horizontal difficile à lire.

### États

- Vide initial : expliquer qu'il faut ajouter ou importer des personnes.
- Aucun résultat de filtre : proposer réinitialisation des filtres.
- Erreur : conserver filtres et recherche, proposer `Réessayer`.

## 8. Création/modification d'un invité - `/admin/invites/nouveau`, `/admin/invites/[id]`

### But

Créer et modifier une personne, indépendamment d'un billet.

### Champs

- Nom : requis.
- Prénoms : requis.
- Table : sélection facultative tant que les tables ne sont pas imposées par les règles d'organisation ; afficher une aide si aucune table n'existe.
- Statut : Actif par défaut ; Annulé/Archivé sur modification, avec confirmation si cela affecte un billet.

Ne pas demander ici le type de billet ni un partenaire. Ces informations appartiennent au workflow de création de billet.

### En création

```text
Saisir -> Valider côté client -> Enregistrer côté serveur
-> Toast succès -> Fiche invité
```

### Fiche invité

Afficher en sections : identité, table, billet associé, historique d'entrée. En haut : `Modifier`, puis action contextuelle `Créer un billet` si aucun billet actif, ou `Voir le billet` si billet existant.

### Changement de table

- Afficher capacité actuelle et places restantes avant confirmation.
- Si l'invité fait partie d'un Couple, prévenir que les deux personnes doivent rester à la même table.
- Si le déplacement rend les tables du couple incohérentes, ne pas enregistrer silencieusement : proposer d'ouvrir la fiche de l'autre personne ou d'annuler.

### Responsive

Formulaire 2 colonnes seulement sur desktop lorsque les champs restent lisibles. Une colonne obligatoire sur mobile.

## 9. Import d'invités - `/admin/import`

### But

Importer une liste de personnes sans créer directement les billets.

### Étapes visibles

```text
1. Importer le fichier
2. Associer les colonnes
3. Vérifier les données
4. Confirmer l'import
```

### Fichier attendu

Colonnes minimum : `nom`, `prenoms`. Colonne optionnelle : `table`.

### Écran d'aperçu

- Nombre de lignes lues, valides, avertissements, erreurs.
- Aperçu de plusieurs lignes.
- Erreurs par ligne avec colonne concernée et explication.
- Choix clair : annuler, corriger le fichier, ou confirmer si aucune erreur bloquante.

### Règles

- Ne pas créer d'invités partiellement sans confirmation explicite.
- Détecter les doublons potentiels et les signaler ; ne pas les supprimer automatiquement.
- Si une table référencée n'existe pas, indiquer l'erreur et proposer de créer/corriger la table avant import.

### Responsive

L'aperçu table est défilable horizontalement dans son conteneur sur mobile ; les actions et résumé d'erreurs restent au-dessus et visibles.

## 10. Tables - `/admin/tables`, `/admin/tables/nouvelle`, `/admin/tables/[id]`

### Liste des tables

Colonnes desktop : Nom/numéro, Capacité, Places attribuées, Places disponibles, Statut, Actions.

Statut capacité : `Disponible`, `Complète`, `Dépassement` uniquement si l'exception existe. Ne pas utiliser un graphique inutile ; la valeur `8 / 10` et le nombre restant sont prioritaires.

Actions : `Ajouter une table`, ouvrir détail, modifier, supprimer si vide.

### Formulaire table

- Nom ou numéro de table : requis, unique dans l'événement.
- Capacité : entier positif requis.
- Bouton `Enregistrer`.

À la modification de capacité, afficher les places déjà attribuées. Si la nouvelle capacité est inférieure aux personnes attribuées, bloquer par défaut et expliquer pourquoi.

### Détail table

Afficher : titre `Table X`, capacité, occupées, restantes, liste des personnes attribuées. Chaque personne ouvre sa fiche. Proposer `Modifier la table` et `Ajouter un invité à cette table`.

### Responsive

Sur mobile, mettre le compteur de capacité au-dessus de la liste et afficher les personnes en cartes compactes ; ne pas réduire les chiffres ou noms.

## 11. Liste des billets - `/admin/billets`

### But

Gérer les droits d'entrée, les PDF et leur cycle de vie.

### Actions

- Primaire : `Créer un billet`.
- Secondaire : téléchargement/export groupé uniquement si le comportement est défini côté serveur.

### Filtres

- Type : Single, Couple.
- Statut : Actif, Utilisé, Révoqué, Annulé.
- Table.
- Recherche par personne associée.

### Tableau desktop

Colonnes : Identifiant court, Personne(s), Type, Table, Statut, Émis le, Entrée, Actions.

### Mobile

Carte contenant les personnes, type, table, statut et accès au détail. Ne pas afficher le QR dans la liste.

### État vide

`Aucun billet généré. Créez un billet Single ou Couple à partir des personnes enregistrées.`

## 12. Création d'un billet - `/admin/billets/nouveau`

### But

Lier une ou deux personnes existantes à un billet et générer un QR/PDF.

### Étape 1 - Choix du type

Deux choix exclusifs avec description :

- `Single - 1 personne` : un QR pour une personne.
- `Couple - 2 personnes` : un QR unique ; les deux personnes doivent arriver ensemble et être à la même table.

Ne pas afficher deux formulaires séparés. Le même workflow change dynamiquement selon le type choisi.

### Étape 2 - Sélection des personnes

Composant de recherche dans les invités sans billet actif.

- Single : un champ `Personne invitée`.
- Couple : `Première personne` puis `Seconde personne`.

Après sélection, afficher carte récapitulative : nom/prénoms, table et statut billet. Empêcher la sélection de la même personne deux fois.

### Étape 3 - Vérifications

- Personne(s) actives.
- Aucune personne n'a un billet actif.
- Single : table affichée si connue.
- Couple : les deux personnes ont exactement la même table ; sinon bloquer la continuation et expliquer les deux affectations.

### Étape 4 - Récapitulatif et génération

Afficher : type, personne(s), table, rappel `Le QR est utilisable une seule fois`. Bouton primaire `Générer le billet`.

Après succès : toast, redirection vers détail billet et bouton de téléchargement du PDF.

### Interdits

- Pas de saisie de personne libre dans ce formulaire.
- Pas de couple de plus ou moins de deux personnes.
- Pas de billet Couple avec tables différentes.
- Pas de génération si l'une des personnes a déjà un billet actif.

## 13. Détail billet - `/admin/billets/[id]`

### Contenu

1. En-tête : identifiant court, type, statut, actions contextuelles.
2. Section personnes associées : deux fiches pour un Couple, une pour un Single, avec liens vers leurs fiches.
3. Section table : table commune et occupation.
4. Section PDF : aperçu si techniquement pertinent, bouton `Télécharger le billet`.
5. Section QR : aperçu limité à l'administrateur si nécessaire ; ne pas l'exposer dans une liste publique.
6. Section historique : émission, régénération, révocation, entrée ou tentatives de scan pertinentes.

### Actions selon statut

| Statut | Actions |
| --- | --- |
| Actif non utilisé | Télécharger, Régénérer, Révoquer, Annuler |
| Utilisé | Voir historique uniquement ; aucune régénération ordinaire |
| Révoqué/Annulé | Voir l'historique ; éventuellement créer un nouveau billet via workflow dédié |

### Régénération

Ouvre `ConfirmDialog` : expliquer que l'ancien QR/PDF devient invalide. Après confirmation, l'API révoque l'ancien jeton, crée le nouveau et génère le PDF. Ne jamais remplacer silencieusement le billet existant.

## 14. Template PDF - `/admin/template`

### But

Configurer le PDF de fond et la zone où le QR sera superposé.

### Contenu

- État du template actif : nom, date d'import, aperçu de page.
- Import/remplacement du PDF, réservé Admin.
- Zone QR sélectionnable, déplaçable et redimensionnable dans l'aperçu.
- Contrôles numériques synchronisés : page, position X, position Y, taille.
- Bouton `Tester la génération` utilisant un QR de démonstration.
- Bouton `Enregistrer la configuration`.

### Règles critiques

- Ne permettre aucune édition du texte, des photos ou décorations du PDF.
- Afficher une consigne : QR noir sur fond blanc, marge blanche, taille d'impression suffisante.
- Les coordonnées doivent être stockées en points PDF, pas seulement en pixels d'aperçu.
- Le template actuel comporte le QR dans le panneau droit supérieur, dans la zone validée avec l'organisateur. Le QR est environ 31 mm à l'impression.

### Responsive

- Desktop : aperçu et panneau de propriétés côte à côte.
- Mobile : aperçu en haut, contrôles sous l'aperçu ; gestes de déplacement possibles mais contrôles numériques toujours disponibles.
- Ne pas exiger une précision tactile au pixel : boutons de déplacement fin ou champs X/Y/taille indispensables.

## 15. Contrôleurs - `/admin/controleurs`

### But

Donner à l'administrateur le contrôle des personnes qui peuvent scanner.

### Liste

Colonnes : Nom, Identifiant/e-mail, Statut, Dernière connexion, Actions.

### Création

Champs : nom affiché, e-mail/identifiant, mot de passe temporaire ou mécanisme d'invitation selon la solution Auth retenue.

Après création, afficher clairement comment transmettre les identifiants de manière sûre. Ne pas afficher le mot de passe dans des listes ou journaux.

### Actions

- Créer contrôleur.
- Désactiver/réactiver avec confirmation.
- Réinitialiser accès si ce workflow est disponible.

Un contrôleur désactivé ne peut plus accéder au scanner, même avec une session existante après vérification serveur.

## 16. Historique - `/admin/historique`

### But

Auditer l'accueil et résoudre les litiges.

### Filtres

- Résultat : accepté, manuel, déjà utilisé, invalide, révoqué, annulé.
- Date/heure.
- Contrôleur.
- Table.
- Recherche par personne ou identifiant de billet.

### Liste

Afficher : heure, résultat, personne(s) si connues, table, billet court, contrôleur, mode normal/manuelle. Un clic ouvre un détail sans exposer de secret QR.

### Détail tentative

Afficher le contexte utile : horodatage, résultat, opérateur, motif manuel, billet/personnes si trouvés. Ne jamais afficher le jeton QR en clair.

## 17. Paramètres événement - `/admin/parametres`

### Contenu MVP

- Nom de l'événement.
- Date et heure.
- Lieu.
- Fuseau horaire.
- Politique de conservation des données, si configurée.

Ne pas mélanger ici les paramètres du template, des tables ou des contrôleurs : ils ont leur propre module.

## 18. Scanner - `/controle/scan`

### But

Permettre au contrôleur de scanner vite, lire le résultat serveur et accueillir ou refuser l'entrée.

### Composition obligatoire

1. En-tête compact : nom événement, contrôleur connecté, indicateur réseau.
2. Vue caméra dominante avec cadre de détection.
3. Bouton `Changer de caméra` si l'appareil en possède plusieurs.
4. Lien/bouton secondaire `Recherche manuelle`.
5. Zone résultat qui remplace ou apparaît sous la caméra après réponse serveur.

### Comportement caméra

- Au premier accès, expliquer pourquoi l'autorisation est nécessaire puis demander la permission.
- Si permission accordée : démarrer la caméra arrière de préférence.
- Si refusée ou indisponible : afficher le message et la recherche manuelle, sans bloquer l'utilisateur.
- Éviter les scans multiples successifs : suspendre la lecture dès qu'un QR valide est détecté jusqu'à action `Scanner le billet suivant`.

### Appel API

Après décodage, envoyer le jeton une seule fois à l'API. Pendant la réponse, afficher `Vérification du billet...` et empêcher un nouveau scan. Le succès n'est affiché qu'après confirmation du serveur.

### Résultat autorisé

```text
ACCES AUTORISE
Jean Dupont & Marie Martin
Couple - 2 personnes
Table 12
Entrée enregistrée à 18:42

[Scanner le billet suivant]
```

Single : afficher une seule personne et `Single - 1 personne`.

### Résultat déjà utilisé

```text
BILLET DEJA UTILISE
Jean Dupont & Marie Martin
Premier passage à 18:42

[Scanner le billet suivant]
[Recherche manuelle]
```

### Résultat invalide, révoqué ou annulé

Afficher le motif sans afficher les données d'un billet inconnu. Actions : `Scanner le billet suivant` et `Recherche manuelle`.

### Responsive

Cette page est mobile-first. Sur téléphone, aucun shell Admin, sidebar ou tableau ne doit réduire la caméra. Les boutons font au moins 44 px de haut. Le statut est lisible immédiatement, avec texte, icône et couleur.

## 19. Recherche manuelle - `/controle/recherche`

### But

Traiter les QR illisibles, la caméra indisponible ou l'oubli du billet.

### Contenu

- Champ de recherche : nom, prénoms ou code court de secours.
- Liste des résultats pertinents : nom, table, type billet, statut.
- Accès au détail pour vérifier avant une action manuelle.

### Sélection et validation

Après sélection, afficher les mêmes informations que pour un scan. Si l'entrée est possible, proposer une validation manuelle avec motif obligatoire : `QR illisible`, `Billet oublié`, `Autre` avec précision.

Pour un Couple : afficher les deux personnes et un message de confirmation que les deux sont présentes. La validation manuelle consomme le billet entier.

### Cas déjà utilisé

Ne pas présenter de bouton permettant de valider à nouveau par défaut. Afficher le premier passage et inviter à contacter l'administrateur si un traitement exceptionnel est nécessaire.

## 20. États d'erreur et de sécurité transverses

### Accès refusé

Écran simple : `Accès non autorisé`, description courte, bouton vers l'espace autorisé ou déconnexion. Ne pas montrer de détails techniques.

### Session expirée

Message clair et bouton `Se reconnecter`. Si un formulaire non envoyé était ouvert, conserver localement les valeurs si cela peut être fait de façon sûre.

### Réseau indisponible

Sur le scanner : bannière persistante indiquant que les billets ne peuvent pas être validés sans serveur. Désactiver l'impression de succès. Garder la recherche disponible seulement si les données sont accessibles selon la politique retenue ; ne pas prétendre garantir un check-in hors ligne.

### Erreur API

Message utilisateur non technique, identifiant de trace facultatif pour le support, bouton `Réessayer`. Journaliser le détail côté serveur.

## 21. Checklist de livraison UI pour l'IA développeuse

Avant de déclarer une interface terminée, vérifier :

- [ ] Le bon rôle peut atteindre l'écran ; le mauvais rôle est bloqué côté serveur.
- [ ] Les données, actions et transitions de ce brief sont présentes.
- [ ] Les composants existants du design system sont réutilisés.
- [ ] Les états chargement, vide, erreur, succès et désactivé sont couverts.
- [ ] Les formulaires ont labels, validation client et erreurs serveur affichables.
- [ ] Les confirmations protègent les actions irréversibles.
- [ ] Le rendu est vérifié à 320, 375, 768, 1024 et 1440 px.
- [ ] Les tableaux ont une alternative mobile compréhensible.
- [ ] Les cibles tactiles ont au moins 44 px sur mobile.
- [ ] Les états de scan ne reposent pas sur la couleur seule.
- [ ] Les icônes viennent de `lucide-react` et ont un libellé ou `aria-label` pertinent.
- [ ] Aucun écran n'introduit de paiement, d'envoi automatique, d'édition graphique du template ou de couples arrivant séparément.
