# Recette opérationnelle — Phase 7

Cette recette doit être effectuée avant le jour du mariage, sur l'URL de production Vercel et avec les appareils réellement prévus à l'entrée.

## Contrôles fonctionnels

- Se connecter avec un compte `ADMIN`, vérifier le tableau de bord et l'historique.
- Se connecter avec un compte `CONTROLLER`, vérifier que `/admin/*` est inaccessible et que `/controle/scan` est utilisable.
- Scanner un billet Single actif : une seule validation doit être enregistrée.
- Scanner le même billet depuis deux appareils presque simultanément : un seul résultat doit être accepté ; l'autre doit indiquer que le billet est déjà utilisé.
- Scanner un billet Couple : les deux invités et la table commune doivent être affichés ; une seule validation doit être enregistrée.
- Scanner un QR annulé, révoqué et inconnu : aucun ne doit autoriser l'entrée.
- Vérifier qu'une validation manuelle est proposée uniquement à l'Administrateur, avec une trace dans l'historique.
- Vérifier l'historique Admin : recherche, filtres résultat / contrôleur / table / date, pagination et dernières entrées du tableau de bord.

## Conditions réelles de scan

- Tester Chrome Android et Safari iOS si ces navigateurs seront utilisés.
- Tester un QR imprimé, un QR affiché sur écran, une faible luminosité et une caméra de qualité moyenne.
- Couper Internet : l'écran doit signaler que le serveur ne peut pas répondre et ne doit jamais afficher de succès local.
- Réactiver Internet puis vérifier qu'un nouveau scan est à nouveau validé par le serveur.

## Sécurité et exploitation

- Vérifier dans Vercel que les variables `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `QR_TOKEN_SECRET` restent secrètes et ne portent jamais le préfixe `NEXT_PUBLIC_`.
- Vérifier que les liens PDF et templates ne sont accessibles qu'avec une session autorisée et utilisent des URLs signées.
- Vérifier, quelques jours avant l'événement, que le projet Supabase gratuit est actif.
- Préparer un partage de connexion ou une seconde connexion Internet, les chargeurs et une liste papier de secours des invités et tables.

## Critère de passage

La recette est validée uniquement lorsqu'aucun contrôle ci-dessus ne révèle de comportement bloquant. Les données de production doivent être importées et les billets réels testés avant l'événement.
