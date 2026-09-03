# Specification de reference - Billetterie de mariage avec QR code a usage unique

> **Statut : document de reference produit avant implementation.**
> Toute personne ou IA qui developpe ce projet doit suivre les decisions, contraintes et non-objectifs decrits ici. En cas d'ambiguite, privilegier la securite du controle d'acces, la simplicite pour les organisateurs et la fiabilite le jour de l'evenement.
>
> Les cas limites validés après cette spécification sont définis dans [Décisions métier finales](DECISIONS_METIER_FINALES.md) et prévalent en cas de contradiction.

## 1. Vision du produit

Construire une application web privee permettant de preparer les invitations d'un mariage et de controler les entrees par QR code.

L'organisateur enregistre les personnes invitees, configure les tables, cree des billets `Single` ou `Couple`, puis genere des PDF a partir d'un template graphique existant. A l'entree, un controleur ouvre le scanner dans le navigateur de son telephone ou de sa tablette. Le scan interroge le serveur, qui renvoie les informations de l'invite et autorise le billet **une seule fois**.

L'application ne vend pas de billets : c'est un outil de gestion d'invitations et de controle d'acces pour un evenement prive.

## 2. Objectifs et principes non negociables

1. **Un billet ne peut etre accepte qu'une seule fois.** Cette regle est appliquee par la base de donnees et le serveur, jamais seulement par l'interface.
2. **Le QR ne contient aucune donnee personnelle.** Il ne contient qu'un jeton aleatoire, opaque et non devinable.
3. **La source de verite est le serveur.** Les noms, tables et statuts sont lus en base au moment du scan.
4. **Chaque personne existe independamment en base.** Un billet Couple lie deux personnes distinctes ; il ne cree pas une fiche « couple » unique.
5. **Un couple arrive ensemble.** Le scan unique valide simultanement les deux personnes du billet Couple.
6. **Le template PDF reste intact.** Aucun texte, photo ou element deja present dans le design n'est modifie. Seul le QR est superpose.
7. **L'interface de controle doit etre immediate et minimale.** Le controleur voit un resultat sans devoir naviguer ou reflechir.
8. **L'application est d'abord web responsive.** Pas d'application mobile native dans le MVP.

## 3. Perimetre du MVP

### Inclus

- Connexion securisee pour administrateurs et controleurs.
- Gestion de l'evenement de mariage.
- Gestion des personnes invitees.
- Configuration des tables et de leur capacite.
- Creation de billets Single et Couple.
- Generation d'un QR unique et d'un PDF par billet.
- Utilisation du template PDF fourni comme fond fixe.
- Scan par camera dans le navigateur.
- Recherche manuelle de secours.
- Validation atomique, historique des scans et tableau de bord.
- Import d'invites par CSV ou Excel et export CSV.

### Exclu du MVP

- Paiement, billetterie payante, remboursement, facturation.
- Envoi automatique par WhatsApp, SMS ou e-mail.
- Application iOS/Android native.
- Mode hors connexion multi-appareils.
- Reconnaissance faciale ou geolocalisation.
- Modification des textes et photos graphiques integres au template PDF.
- Gestion publique de plusieurs mariages. Une evolution multi-evenements est possible plus tard.

## 4. Roles, permissions et responsabilites

| Role | But | Autorise | Interdit |
| --- | --- | --- | --- |
| Administrateur | Preparer et piloter l'evenement | Toutes les operations de l'evenement, donnees, billets, tables, comptes et historique | Rien dans le MVP, a l'exception de la suppression des traces d'audit |
| Controleur | Accueillir et verifier | Scanner, recherche manuelle, voir nom/table/type/statut, valider manuellement si autorise | Modifier invites, tables, billets, template, comptes, exporter les donnees |
| Invite | Presenter son invitation | Aucun compte ni ecran applicatif requis | Acces aux donnees et fonctions internes |

Le role est verifie cote serveur a chaque action. Cacher un bouton dans l'interface ne constitue jamais une mesure de securite suffisante.

## 5. Glossaire et modele mental

| Terme | Definition |
| --- | --- |
| Personne / Invite | Une personne physique stockee individuellement dans la base. |
| Table | Une table de reception avec nom/numero et capacite. |
| Billet | Le droit d'entree, actif ou non, qui lie une ou deux personnes et porte un QR. |
| Billet Single | Billet liant exactement une personne et donnant droit a une entree. |
| Billet Couple | Billet liant exactement deux personnes, qui doivent entrer ensemble. |
| Jeton QR | Secret aleatoire lie au billet ; seul contenu du QR. |
| Scan | Tentative de verifier un QR. Chaque tentative est journalisee. |
| Check-in / entree | Acceptation effective d'un billet a l'entree. |
| Revocation | Invalidation definitive d'un ancien billet, generalement apres regeneration. |

## 6. Regles metier detaillees

### 6.1 Personnes et billets

- Une personne est creee avant d'etre ajoutee a un billet.
- Une personne ne peut appartenir qu'a **un seul billet actif** a la fois.
- Un billet actif lie une ou deux personnes, jamais zero ni plus de deux.
- `SINGLE` implique exactement une personne ; `COUPLE` implique exactement deux.
- Un billet Couple ne peut etre cree qu'avec deux personnes distinctes.
- Une personne dont le billet a deja ete utilise ne peut pas etre deplacee vers un autre billet sans action exceptionnelle explicite d'un administrateur et trace d'audit.

### 6.2 Tables

- Chaque personne peut etre affectee a une table.
- La capacite d'une table est calculee par **personnes**, pas par billets.
- Un Single compte pour une place ; deux personnes d'un Couple comptent pour deux places.
- Les deux personnes d'un billet Couple doivent etre assises a la meme table.
- Une table pleine bloque l'affectation par defaut. Un depassement n'est permis que si une regle explicite est ajoutee plus tard et que l'administrateur confirme.
- Changer la table d'une personne recalcule immediatement les capacites de l'ancienne et de la nouvelle table.
- Le scan renvoie toujours la table courante stockee en base, meme si le billet a ete genere avant une modification de placement.

### 6.3 Cycle de vie d'un billet

```text
Creation -> ACTIF -> UTILISE
                 -> REVOQUE
                 -> ANNULE
```

- Seul un billet `ACTIF` et non utilise peut etre accepte.
- La regeneration cree un nouveau billet/jeton et revoque l'ancien avant de rendre le nouveau actif.
- Un QR d'un billet revoque, annule ou remplace est refuse.
- Un billet utilise reste utilise. Ne pas proposer de bouton « reutiliser » au controleur.

### 6.4 Regle d'arrivee des couples

Un billet Couple est consomme au premier scan. Le serveur enregistre l'arrivee des deux personnes au meme instant. Les arrives separees ne sont pas prises en charge dans le MVP. Si cette regle devait changer, il faudrait soit scinder le billet en deux Singles, soit introduire une regle de passages restants ; ne pas improviser ce comportement.

## 7. QR code et securite du check-in

### 7.1 Contenu du QR

Le QR contient une URL ou un code semblable a :

```text
https://app.exemple.com/c/jeton-long-aleatoire
```

Le jeton est genere avec un generateur cryptographiquement sur, avec au minimum 128 bits d'entropie. Ne jamais encoder dans le QR : nom, prenoms, numero de table, telephone, e-mail, type de billet ou identifiant sequentiel.

Le serveur conserve un hash du jeton et non son contenu en clair. Une copie ou une photo du QR peut etre scannee, mais seul le premier scan reussira grace a la base de donnees.

### 7.2 Operation atomique obligatoire

L'API de check-in doit effectuer verification du statut et marquage de l'entree dans une meme transaction. L'implementation peut utiliser une mise a jour conditionnelle equivalente a :

```sql
UPDATE tickets
SET checked_in_at = NOW(), checked_in_by_user_id = :operator_id
WHERE token_hash = :hash
  AND status = 'ACTIVE'
  AND checked_in_at IS NULL
RETURNING id;
```

Si une ligne est retournee, l'entree est acceptee. Sinon, le serveur relit l'etat necessaire et repond `ALREADY_USED`, `REVOKED`, `CANCELLED` ou `INVALID`. Ce mecanisme protege le cas de deux scanners qui lisent le meme QR au meme moment.

Toute tentative de scan cree une trace. Une contrainte en base doit empecher plus d'une entree acceptee par billet.

## 8. Ecrans de l'application et navigation

### 8.1 Navigation administrateur

```text
Connexion -> Tableau de bord
                    |- Invites
                    |- Tables
                    |- Billets
                    |- Controleurs
                    |- Historique
                    `- Parametres
```

### 8.2 Navigation controleur

```text
Connexion -> Scanner <-> Recherche manuelle
                   `-> Resultat scan -> Scanner suivant
```

### 8.3 Inventaire des ecrans administrateur

| Ecran | Contenu requis | Actions possibles |
| --- | --- | --- |
| Connexion | Identifiant, mot de passe, erreurs | Se connecter, se deconnecter |
| Premiere configuration | Informations mariage, template, regles | Enregistrer et poursuivre |
| Tableau de bord | Compteurs, dernieres entrees, alertes | Aller vers chaque module |
| Liste des invites | Tableau, recherche, filtres, pagination, actions | Ajouter, importer, ouvrir une fiche |
| Formulaire invite | Nom, prenoms, table, statut | Creer/modifier, annuler |
| Fiche invite | Informations, table, billet, historique | Modifier, creer/voir billet, annuler |
| Import | Televersement, mapping colonnes, apercu, erreurs par ligne | Corriger, confirmer, annuler |
| Liste des tables | Numero/nom, capacite, places prises/restantes | Ajouter, ouvrir detail |
| Formulaire table | Nom ou numero, capacite | Creer/modifier, supprimer si vide |
| Detail table | Personnes assises, occupation | Ouvrir invite, modifier affectation |
| Liste des billets | Filtres par type et statut | Creer, ouvrir, telecharger |
| Creation billet | Choix type, selection personnes, recapitulatif | Generer ou annuler |
| Detail billet | QR, PDF, personnes, statut, historique | Telecharger, regenerer, revoquer |
| Template | Apercu PDF et zone QR | Importer template, deplacer/redimensionner QR, tester |
| Controleurs | Liste des comptes et statut actif | Creer, desactiver, reinitialiser acces |
| Historique | Liste des scans et filtres | Ouvrir le detail d'une action |
| Parametres | Infos mariage, securite, retention | Enregistrer, deconnexion |

### 8.4 Inventaire des ecrans controleur

| Ecran | Comportement attendu |
| --- | --- |
| Scanner | Apercu camera, bouton changement camera, indicateur reseau, acces recherche manuelle |
| Demande permission camera | Explique le besoin ; si refuse, proposer recherche manuelle |
| Resultat vert | Nom/prenoms, type, nombre de personnes, table, heure ; bouton unique « Scanner le suivant » |
| Resultat orange | Billet deja utilise et heure de la premiere entree ; pas de validation automatique |
| Resultat rouge | QR inconnu, annule ou revoque ; pas de donnees sensibles inutiles |
| Recherche manuelle | Recherche par nom, prenoms ou code court de secours |
| Resultat recherche | Identite, table, type, statut et historique d'entree utile |
| Confirmation manuelle | Motif obligatoire, confirmation explicite, trace de l'operateur |

### 8.5 Etats UX transverses

Chaque ecran ayant une requete ou un formulaire doit prevoir : chargement, aucune donnee, erreur reseau, acces refuse, session expiree, erreur de validation par champ et confirmation de succes. Ne jamais laisser l'utilisateur se demander si une action critique a reussi.

## 9. Workflows pas a pas

### 9.1 Configuration initiale

```text
Admin se connecte
-> cree/edite l'evenement
-> importe le template PDF
-> configure et teste la zone QR
-> cree les tables
-> ajoute ou importe les personnes
-> cree les billets
-> cree les comptes controleurs
-> effectue un test reel de scan
```

Le template source reste stocke tel quel. Le systeme ne doit jamais rasteriser, compresser ni reecrire le visuel de fond sans raison.

### 9.2 Creer une personne

```text
Liste invites -> Ajouter
-> renseigner nom, prenoms et table
-> valider les champs
-> enregistrer
-> afficher fiche invite
```

Une personne peut exister sans billet tant que l'administrateur n'a pas choisi de la mettre dans un Single ou un Couple.

### 9.3 Creer un billet Single

```text
Liste billets -> Creer -> SINGLE
-> rechercher et choisir une personne sans billet actif
-> verifier la table
-> confirmation
-> creer jeton, billet et PDF
-> afficher detail du billet
```

### 9.4 Creer un billet Couple

```text
Liste billets -> Creer -> COUPLE
-> choisir personne A sans billet actif
-> choisir personne B sans billet actif et distincte de A
-> verifier que les deux sont a la meme table
-> confirmation
-> creer jeton, billet et PDF
-> afficher detail du billet
```

Si les tables different, le systeme affiche les deux affectations et demande de corriger le placement avant la creation. Ne pas choisir silencieusement une table.

### 9.5 Generation PDF

```text
Demande de generation
-> recuperer template PDF actif
-> generer QR du jeton actif
-> placer QR aux coordonnees configurees
-> produire PDF
-> stocker temporairement ou en bucket prive
-> permettre telechargement
```

Le template actuel est un visuel Photoshop aplati. C'est acceptable et souhaite. Ne pas tenter d'editer ses textes ou images. Le QR est place dans la zone validee en haut du panneau droit ; sa taille est environ 31 mm afin de rester fiable a l'impression et au scan.

### 9.6 Scan valide

```text
Controleur connecte -> Scanner -> QR lu
-> envoyer jeton a l'API HTTPS
-> verifier session et role CONTROLLER/ADMIN
-> rechercher billet et appliquer validation atomique
-> enregistrer scan ACCEPTE
-> afficher resultat vert
-> scanner suivant
```

Pour un Couple, l'ecran affiche les deux noms, « Couple - 2 personnes » et la table commune.

### 9.7 Billet deja utilise, invalide ou revoque

```text
QR lu -> API
-> aucun billet : ecran rouge « QR inconnu »
-> billet revoque/annule : ecran rouge avec statut
-> billet deja utilise : ecran orange avec heure du premier passage
```

Un controleur ne doit pas pouvoir transformer un billet deja utilise en entree valide sans la fonctionnalite de validation manuelle et une permission explicite.

### 9.8 Recherche et validation manuelle

```text
Scanner -> Recherche manuelle
-> saisir nom, prenoms ou code court
-> selectionner une personne ou un billet
-> verifier visuellement l'identite et le statut
-> saisir motif obligatoire
-> confirmer
-> operation atomique + trace MANUAL_ACCEPTED
```

Si le billet est Couple, la validation manuelle s'applique aux deux personnes, avec confirmation explicite que les deux sont presentes.

### 9.9 Regeneration / perte de billet

```text
Detail billet -> Regenerer
-> modal explicative : ancien QR sera invalide
-> confirmer
-> transaction : revoquer ancien billet, creer nouveau billet et nouveau jeton
-> generer nouveau PDF
-> afficher succes et telechargement
```

Ne jamais reutiliser le jeton d'un ancien billet.

## 10. Modele de donnees recommande

Les noms de tables peuvent varier, mais les relations et contraintes suivantes sont attendues.

### Event

`id`, `name`, `weddingDate`, `venueName`, `timezone`, `status`, `createdAt`, `updatedAt`.

### UserProfile

Lie un utilisateur Supabase Auth a l'evenement et a un role : `id`, `authUserId`, `eventId`, `displayName`, `role`, `active`, `createdAt`.

### DiningTable

`id`, `eventId`, `label`, `capacity`, `createdAt`, `updatedAt`.

Contrainte : `(eventId, label)` unique.

### Guest

`id`, `eventId`, `lastName`, `firstNames`, `tableId?`, `status`, `createdAt`, `updatedAt`.

Statuts : `ACTIVE`, `CANCELLED`, `ARCHIVED`.

### Ticket

`id`, `eventId`, `type`, `status`, `tokenHash`, `version`, `issuedAt`, `checkedInAt?`, `checkedInByUserId?`, `revokedAt?`, `revokedReason?`.

Types : `SINGLE`, `COUPLE`. Statuts : `ACTIVE`, `USED`, `REVOKED`, `CANCELLED`.

### TicketGuest

Table de liaison : `ticketId`, `guestId`, `position`.

Contrainte : un `guestId` ne peut pas etre rattache a deux tickets actifs. Cette contrainte peut necessiter un index partiel PostgreSQL ou une verification transactionnelle robuste.

### CheckInAttempt

`id`, `eventId`, `ticketId?`, `operatorUserId?`, `result`, `scannedAt`, `manual`, `manualReason?`, `deviceLabel?`.

Resultats : `ACCEPTED`, `MANUAL_ACCEPTED`, `ALREADY_USED`, `INVALID`, `REVOKED`, `CANCELLED`, `DENIED`.

### Template

`id`, `eventId`, `storagePath`, `pageNumber`, `qrX`, `qrY`, `qrSize`, `active`, `createdAt`.

Les coordonnees sont en points PDF, avec une convention documentee (origine bas-gauche recommandee si `pdf-lib` est utilise). Ne pas stocker des positions en pixels d'ecran sans conversion explicite.

## 11. Stack technique retenue

| Besoin | Choix |
| --- | --- |
| Application | Next.js, React, TypeScript |
| Style | Tailwind CSS et composants accessibles |
| Base | PostgreSQL heberge par Supabase |
| Acces donnees | Prisma ORM et migrations Prisma |
| Authentification | Supabase Auth |
| Fichiers | Supabase Storage prive |
| Generation QR | Bibliotheque `qrcode` |
| PDF | `pdf-lib` |
| Scan camera | `@zxing/browser` |
| Formulaires | React Hook Form + Zod |
| Tests | Vitest et Playwright |

### 11.1 Coexistence Supabase / Prisma

Supabase fournit l'infrastructure : PostgreSQL, Auth et Storage. Prisma est l'unique couche applicative d'acces aux tables metier (`Guest`, `Ticket`, `DiningTable`, `CheckInAttempt`, etc.).

Le navigateur utilise Supabase pour la session d'authentification et eventuellement pour recevoir une URL signee de fichier. Il ne doit pas ecrire directement les donnees metier. Les ecritures passent par les routes serveur Next.js, qui verifient le role puis utilisent Prisma.

Ne jamais exposer `SUPABASE_SERVICE_ROLE` au navigateur. Garder toutes les cles de service, chaines de connexion Prisma et secrets QR dans les variables d'environnement serveur.

### 11.2 Hebergement gratuit assume

Le projet vise Vercel Hobby et Supabase Free pour le developpement et le MVP gratuit. Cette decision impose des precautions : verifier que le projet Supabase n'est pas mis en pause avant l'evenement, limiter le stockage de PDF generes, conserver le template dans un bucket prive et tester le flux de bout en bout peu avant le jour J.

Ne pas promettre une disponibilite equivalente a une offre professionnelle. Prevoir une liste de secours imprimee ou PDF et une connexion mobile de secours.

## 12. Securite et protection des donnees

- Toutes les pages et API sont servies en HTTPS.
- Les mots de passe sont geres et haches par Supabase Auth ; jamais stockes en clair dans les tables metier.
- Les sessions sont verifiees cote serveur.
- Les autorisations sont appliquees cote serveur par role et evenement.
- Le jeton QR est aleatoire, non sequentiel et stocke sous forme de hash.
- Les endpoints de scan sont limites en debit pour reduire les essais abusifs.
- Les donnees retournees au controleur sont minimales : identite, table, type, statut, heure pertinente.
- Les tentatives de scan et actions critiques sont journalisees et non supprimables par un controleur.
- Les exports sont reserves a l'administrateur.
- Les fichiers PDF et templates sont prives ; pas de lien public permanent contenant des donnees.
- Definir avant mise en production une date de purge/anonymisation des donnees apres le mariage.

## 13. Bonnes pratiques de developpement

### A faire

- Utiliser TypeScript strict et valider toute entree API avec Zod.
- Ecrire les migrations Prisma dans le depot et ne jamais modifier la base manuellement sans migration.
- Centraliser les constantes de statuts et les permissions.
- Encapsuler la validation de billet dans un service serveur unique, teste et transactionnel.
- Ecrire des tests unitaires pour toutes les regles de billets, couples, tables et statuts.
- Ecrire des tests end-to-end pour les parcours admin et controleur.
- Utiliser des messages d'erreur clairs, en francais, sans exposer de secret technique.
- Optimiser le scanner pour mobile : gros boutons, contraste fort, vibration/son facultatifs, retour immediat.
- Mettre le QR sur fond blanc avec marge blanche suffisante ; ne pas le compresser en JPEG.
- Conserver un journal d'audit avec l'heure et l'operateur.

### A ne pas faire

- Ne pas mettre les noms, tables ou donnees personnelles dans le QR.
- Ne pas valider un billet seulement cote client.
- Ne pas faire « lire puis ecrire » sans transaction pour le check-in.
- Ne pas autoriser un billet Couple avec arrivee separee dans le MVP.
- Ne pas permettre a un controleur de modifier la liste, les tables ou les billets.
- Ne pas ecraser un ancien billet lors d'une regeneration : le revoquer et creer un nouveau jeton.
- Ne pas editer le visuel fixe du template PDF.
- Ne pas servir les PDF prives depuis une URL publique permanente.
- Ne pas depend re exclusivement d'Internet sans plan de secours le jour J.
- Ne pas ajouter paiement, messagerie ou mode hors ligne avant que le controle d'acces soit robuste.

## 14. Critères d'acceptation

### Billets et personnes

- Une personne peut etre creee sans billet.
- Un Single lie exactement une personne.
- Un Couple lie exactement deux personnes distinctes.
- Une personne ne peut pas etre dans deux billets actifs.
- Un Couple est refuse si les deux personnes sont a des tables differentes.
- La capacite de table compte les personnes, y compris celles liees a un Couple.
- Chaque billet actif obtient un jeton QR unique.

### Check-in

- Le premier scan d'un billet actif retourne `ACCEPTED`.
- Le scan suivant du meme billet retourne `ALREADY_USED`.
- Deux scans concurrents produisent exactement une acceptance.
- Un billet revoque ou annule est refuse.
- Le controleur voit les bonnes personnes, le bon type et la table actuelle.
- La validation manuelle exige un motif et cree une trace.

### PDF et template

- Le PDF final conserve le visuel de fond sans alteration visible.
- Le QR est imprime avec une marge blanche et est scannable depuis papier et ecran.
- Un PDF genere pour un billet contient le QR du billet actif, jamais celui d'un autre billet.
- Une regeneration rend l'ancien PDF inutilisable au scan.

### Securite

- Un controleur ne peut pas appeler les API administrateur.
- Une session expiree conduit a la connexion, pas a une erreur silencieuse.
- Aucun secret Supabase/Prisma n'est livre au navigateur.
- Une requete de scan ne retourne aucune donnee personnelle pour un QR invalide.

## 15. Tests operationnels avant evenement

1. Tester sur les telephones/tablettes reels des controleurs.
2. Tester la permission camera dans Chrome Android et Safari iOS si ces appareils sont cibles.
3. Scanner le meme QR sur deux appareils au meme instant.
4. Tester Single, Couple, billet deja utilise, annule, revoque et QR inconnu.
5. Tester une faible luminosite et un QR affiche sur ecran ou imprime.
6. Verifier tables et capacites apres import et changements de placement.
7. Generer un lot realiste de billets et controler leur ouverture/scan.
8. Verifier la connexion de secours et garder une liste de secours accessible.
9. Verifier que Supabase est actif avant l'evenement dans le cadre du plan gratuit.

## 16. Evolution apres MVP

Les evolutions suivantes sont possibles mais ne doivent pas ralentir le MVP : envoi WhatsApp/e-mail, plusieurs evenements, plusieurs templates, badges/impression avancee, dashboard enrichi, export PDF de plan de table, invitations de groupe, mode hors ligne controle et synchronise.

Toute evolution qui autorise des arrivees separees pour un Couple doit etre specifiee et testee comme une nouvelle regle metier ; elle ne doit pas etre deduite du comportement actuel.
