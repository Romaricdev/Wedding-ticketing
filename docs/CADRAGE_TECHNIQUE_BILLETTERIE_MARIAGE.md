# Cadrage technique — invitations de mariage avec QR code

## Objectif

L'application permet aux organisateurs de créer les invitations d'un mariage, générer un QR code par invité et contrôler l'accès le jour J. Le premier scan autorise l'entrée et horodate le passage ; tout scan ultérieur est refusé comme « déjà utilisé ».

## Périmètre MVP

### Administration

- Créer un événement : nom des mariés, date, lieu, identité visuelle facultative.
- Ajouter, modifier, rechercher, annuler et archiver les invités.
- Enregistrer au minimum : nom, prénoms, numéro de table. Téléphone, e-mail et nombre d'accompagnants restent facultatifs.
- Importer et exporter les invités au format CSV.
- Générer un billet individuel imprimable en PDF, puis télécharger tous les billets dans un ZIP.
- Consulter les statistiques : attendus, entrées validées, billets déjà utilisés et refusés.

### Contrôle d'accès

- Interface mobile/tablette protégée par connexion.
- Scan par caméra ou saisie d'un code de secours.
- Résultat instantané : accès autorisé (nom, table, heure), déjà utilisé, invalide ou révoqué.
- Validation manuelle exceptionnelle, avec motif obligatoire.
- Garantie contre deux validations simultanées du même billet.

### Hors périmètre initial

- Paiement, vente, remboursement ou facturation.
- Application mobile native.
- Envoi automatique par e-mail/SMS/WhatsApp (phase ultérieure possible).
- Mode hors ligne multi-appareils : il ne permet pas de garantir l'unicité des entrées.

## Rôles

| Rôle | Droits |
| --- | --- |
| Administrateur | Événement, invités, billets, exports, comptes contrôleurs, statistiques. |
| Contrôleur | Scanner, validation et recherche limitée d'invités. |
| Lecture seule (optionnel) | Tableau de bord sans modification ni validation. |

Les opérations sensibles sont journalisées : connexion, modification d'invité, régénération de billet et contrôle.

## Parcours principal

```text
Administrateur → crée l'événement → importe/crée les invités
→ génère les billets → distribue les PDF ou les imprime.

Contrôleur → se connecte → scanne le QR → le serveur valide ou refuse
→ résultat affiché et opération inscrite au journal.
```

Le QR ne contient pas les informations personnelles. Il porte une URL ou un jeton opaque, qui permet au serveur de retrouver l'invité.

## Architecture recommandée

| Couche | Choix | Rôle |
| --- | --- | --- |
| Web | Next.js + TypeScript | Administration, billet et scanner responsive. |
| Serveur | API Next.js/Node.js | Autorisations et règles métier. |
| Données | PostgreSQL managé | Invités, billets, scans et comptes. |
| Accès aux données | Prisma + migrations | Schéma, contraintes et évolutions. |
| Authentification | Sessions serveur / Auth.js | Comptes admin et contrôleur. |
| QR/PDF | Génération serveur | QR haute correction d'erreur et billets PDF. |
| Stockage | Bucket privé compatible S3 | Archives et PDF, si conservés. |
| Exploitation | Logs structurés + suivi d'erreurs | Diagnostic le jour J. |

Une application web est préférable au MVP : aucun téléchargement n'est nécessaire, et la caméra du téléphone est utilisable depuis le navigateur. HTTPS est obligatoire pour l'accès à la caméra.

## Données minimales

### Event

`id`, `name`, `weddingDate`, `venueName`, `timezone`, `status`, `createdAt`.

### Guest

`id`, `eventId`, `lastName`, `firstNames`, `tableNumber`, `phone?`, `email?`, `partySize`, `status`, `createdAt`, `updatedAt`.

Statuts : `ACTIVE`, `CANCELLED`, `ARCHIVED`.

### Ticket

`id`, `eventId`, `guestId`, `tokenHash`, `version`, `status`, `issuedAt`, `checkedInAt?`, `revokedAt?`.

Statuts : `ACTIVE`, `REVOKED`. Un invité n'a qu'un billet actif. Une régénération révoque l'ancien QR avant d'en créer un nouveau.

### CheckIn

`id`, `eventId`, `ticketId`, `operatorId?`, `result`, `scannedAt`, `deviceLabel?`, `reason?`.

Résultats : `ACCEPTED`, `ALREADY_USED`, `INVALID`, `REVOKED`, `MANUAL_ACCEPTED`.

### User

`id`, `eventId`, `name`, `login`, `passwordHash`, `role`, `active`, `lastLoginAt?`.

## QR code à usage unique

Le QR contient un jeton aléatoire cryptographiquement sûr (au moins 128 bits), par exemple :

`https://controle.exemple.com/c/jeton-opaque`

Le serveur conserve uniquement le hash du jeton. Nom, prénoms, table, téléphone et e-mail ne doivent jamais être encodés dans le QR, car un QR peut être copié ou photographié.

La validation doit être atomique dans la base de données :

```sql
UPDATE tickets
SET checked_in_at = now()
WHERE token_hash = :hash
  AND status = 'ACTIVE'
  AND checked_in_at IS NULL
RETURNING id, guest_id;
```

Une ligne retournée signifie que l'entrée est autorisée. Sinon l'API détermine si le billet est inconnu, révoqué ou déjà utilisé et crée un journal de scan. Une contrainte unique sur les entrées acceptées par billet apporte une seconde sécurité.

## API indicative

| Méthode | Route | Usage |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Ouvrir une session. |
| `GET/POST` | `/api/events/:id/guests` | Lister/créer des invités. |
| `PATCH` | `/api/events/:id/guests/:guestId` | Modifier ou annuler. |
| `POST` | `/api/events/:id/guests/import` | Importer un CSV validé. |
| `POST` | `/api/tickets/:guestId/reissue` | Révoquer/régénérer un billet. |
| `GET` | `/api/tickets/:guestId/pdf` | Télécharger un PDF. |
| `POST` | `/api/check-in` | Scanner et valider atomiquement. |
| `POST` | `/api/check-in/manual` | Validation manuelle motivée. |
| `GET` | `/api/events/:id/dashboard` | Statistiques et journal. |

La réponse de contrôle ne contient que les informations utiles à l'accueil : identité, table et statut. Les coordonnées privées ne sont pas renvoyées aux contrôleurs.

## Sécurité et données personnelles

- HTTPS, sessions `HttpOnly`, `Secure`, `SameSite`, avec expiration courte.
- Mots de passe hachés avec Argon2id ou bcrypt, jamais stockés en clair.
- Vérification des rôles et de l'événement côté serveur, sur chaque route.
- Jetons QR non devinables, hachés en base et limitation de débit sur le scan.
- Journal d'audit non modifiable par les contrôleurs.
- Sauvegardes chiffrées et restauration testée.
- Collecte minimale : téléphone/e-mail facultatifs ; supprimer ou anonymiser les données après la durée définie (par exemple 30 à 90 jours après l'événement).
- Informer les invités du traitement de leurs données conformément à la réglementation applicable.

## Préparation du jour J

- Prévoir Internet stable, partage de connexion de secours, chargeurs et batteries externes.
- Créer au moins deux comptes contrôleurs et tester leurs appareils la veille.
- Tester la concurrence : deux appareils scannent le même QR simultanément ; un seul doit être accepté.
- Prévoir une liste PDF/papier des invités et des tables comme secours.
- Identifier l'opérateur/appareil dans le journal pour résoudre les litiges.

Le MVP fonctionne en ligne : le serveur est indispensable pour garantir le premier scan. Un mode hors ligne n'est envisageable que plus tard, avec une procédure stricte (par exemple un seul appareil hors ligne).

## Billet PDF

Contenu recommandé : noms des mariés, date, lieu, nom complet de l'invité, numéro de table, QR, identifiant court de secours et consigne de présentation à l'entrée.

Le billet est conçu pour A6 ou A5, impression et lecture écran. Le QR est noir sur fond clair, possède une marge blanche et est testé sur de vrais téléphones avant l'envoi massif.

## Critères de recette

- Chaque invité obtient un QR unique et un PDF lisible.
- Le premier scan crée exactement une entrée `ACCEPTED`.
- Le second scan renvoie `ALREADY_USED` et préserve l'heure du premier passage.
- Deux scans simultanés produisent exactement un accès autorisé.
- Un QR inconnu, altéré ou révoqué est refusé.
- Le numéro de table affiché est à jour.
- Un contrôleur ne peut ni exporter ni modifier les invités.
- L'import CSV décrit les erreurs de ligne avant insertion.
- Le scanner fonctionne sur les navigateurs mobiles ciblés, en HTTPS.

## Livrables de conception avant développement

1. Cahier des charges fonctionnel validé.
2. Maquettes : connexion, liste/fiches invités, billet, scanner, résultat et tableau de bord.
3. Schéma de base et dictionnaire des données.
4. Contrat d'API OpenAPI.
5. Charte graphique/modèle de billet validé.
6. Politique de sécurité et de conservation des données.
7. Plan de tests et protocole opérationnel du jour J.
8. Guide d'une page pour administrateurs et contrôleurs.

## Décisions à obtenir du client

| Sujet | Décision |
| --- | --- |
| Diffusion des billets | Impression, PDF/WhatsApp, e-mail, ou plusieurs canaux. |
| Admission | Billet individuel ou billet de famille/groupe. |
| Données visibles au scan | Nom et table seulement, ou autre besoin justifié. |
| Portée | Application dédiée à ce mariage ou plateforme réutilisable. |
| Langues | Français ou français/anglais. |
| Visuel | Thème du mariage, monogramme, format final du billet. |
| Accueil | Nombre de contrôleurs, appareils et état du réseau sur le lieu. |
| Conservation | Date de purge des données et responsable de traitement. |

## Phasage

1. Valider les décisions, les maquettes et le modèle de billet.
2. Développer administration, invités et import/export.
3. Ajouter QR, génération PDF, révocation et régénération.
4. Ajouter scanner, validation atomique, journal et tableau de bord.
5. Réaliser recette mobile, concurrence et répétition générale.
6. Déployer le domaine HTTPS, sauvegardes, comptes et former les organisateurs.
