# Décisions métier finales et cas limites

> Ce document complète les spécifications fonctionnelle, UI et base de données. En cas de contradiction, les décisions ci-dessous prévalent.

## 1. Annulation d'un invité

- Lorsqu'un invité annule sa venue, l'administrateur peut annuler son billet actif.
- Cette opération est explicite : l'interface affiche une confirmation indiquant que le QR ne sera plus accepté.
- Le billet passe au statut `CANCELLED` ; l'invité peut également passer au statut `CANCELLED` selon l'action choisie par l'administrateur.
- Aucune donnée, aucun billet ni aucune trace de scan n'est supprimé.
- Un QR correspondant à un billet annulé est refusé au scanner avec un état rouge.

## 2. Composition d'un billet Couple

- Les personnes d'un billet Couple ne sont jamais modifiées après création.
- Pour modifier le couple, l'administrateur annule ou révoque le billet actif non utilisé, puis crée un nouveau billet.
- Le nouveau billet a obligatoirement un nouveau jeton QR.
- Les deux personnes d'un Couple arrivent ensemble ; un premier scan valide les deux entrées simultanément.

## 3. Validation manuelle

- Seul un administrateur peut effectuer une validation manuelle.
- Un contrôleur peut rechercher un invité et voir son statut, mais ne peut pas consommer manuellement un billet.
- Toute validation manuelle requiert un motif : `QR illisible`, `Billet oublié` ou `Autre` avec précision.
- Elle est transactionnelle, marque le billet comme utilisé et est journalisée avec l'identité de l'administrateur.

## 4. Tables et capacité

- Chaque billet créé doit être associé à une table obligatoirement.
- Par conséquent, chaque personne sélectionnée pour un billet doit avoir une table définie.
- Un billet Couple exige que les deux personnes soient affectées à la même table.
- La capacité d'une table ne peut jamais être dépassée, y compris par un administrateur.
- La capacité est calculée en personnes : un Single compte pour 1, un Couple pour 2.
- Toute affectation ou génération de billet qui dépasserait la capacité est refusée avec un message explicite.

## 5. Échec de génération PDF

- La création du billet et la génération du PDF sont deux étapes distinctes.
- Si le billet est créé mais que la génération PDF échoue, le billet actif reste le même.
- L'administrateur relance la génération depuis la fiche du billet.
- La relance utilise le même billet et le même jeton QR ; elle ne crée ni un second billet ni un nouveau QR.
- La réémission, qui invalide l'ancien QR et en crée un nouveau, est réservée au cas d'un billet perdu ou à une décision explicite de l'administrateur.

## 6. Conservation des données

- Toutes les données sont conservées après le mariage : invités, tables, billets, scans et journaux d'audit.
- Aucun mécanisme de purge ou d'anonymisation automatique n'est prévu dans le MVP.
- Les suppressions définitives d'invités, billets et traces d'audit ne sont pas exposées dans l'interface.

## 7. Absence de connexion Internet

- Le contrôle à usage unique dépend obligatoirement du serveur.
- Sans connexion Internet, l'écran scanner affiche clairement : `Le serveur ne peut pas répondre car aucune connexion Internet n'est disponible. Aucun billet ne peut être validé.`
- Le scan est désactivé et aucun succès ne peut être affiché localement.
- Aucun mode de validation hors ligne n'est implémenté dans le MVP.
- Les organisateurs doivent prévoir une connexion de secours et une liste d'invités de secours pour l'exploitation le jour J.

