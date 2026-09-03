---
name: wedding-checkin
description: Implémenter ou modifier le scan et la validation de billets mariage à usage unique.
---

# Workflow check-in

1. Lire `docs/DECISIONS_METIER_FINALES.md` et `docs/SPECIFICATION_BASE_DE_DONNEES.md`.
2. Vérifier authentification et rôle : CONTROLLER ou ADMIN pour scan ; ADMIN seul pour manuel.
3. Ne jamais accepter un QR côté client. Hash du jeton côté serveur, puis transaction PostgreSQL.
4. Mettre à jour seulement un ticket ACTIVE non utilisé ; insérer la tentative de scan dans la même transaction.
5. Pour un Couple, retourner les deux personnes et la table commune ; le billet est consommé pour les deux.
6. Pour QR déjà utilisé, révoqué, annulé ou inconnu, ne créer aucune entrée acceptée.
7. Couvrir scans concurrents, réseau indisponible, QR inconnu et permission caméra refusée par tests.
