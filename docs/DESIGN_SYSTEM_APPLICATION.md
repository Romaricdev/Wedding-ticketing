# Design system - Application de billetterie mariage

> **Objectif :** definir un langage visuel unique pour toutes les interfaces de l'application. Ce document est obligatoire pour toute implementation d'ecran ou de composant.
>
> **Direction :** back office professionnel, dense, clair et fonctionnel, inspire par les principes du tableau de bord Cloudflare, sans reproduire sa marque ni son interface. Le design du billet PDF de mariage est independant et ne doit pas etre reutilise comme design de l'application.

## 1. Principes de design

1. **Clarte avant decoration.** L'application sert a organiser et controler un evenement. Les donnees, actions et statuts priment sur les effets visuels.
2. **Rapide a comprendre.** Chaque page doit expliciter son but, l'action principale et l'etat des donnees sans apprentissage long.
3. **Coherent.** Un meme statut, bouton, champ, tableau ou message doit toujours avoir la meme apparence et le meme comportement.
4. **Responsive obligatoire.** Chaque ecran doit etre utilisable sur ordinateur, tablette et telephone. Aucun ecran ne peut etre considere « desktop uniquement ».
5. **Accessible.** Le contraste, le texte, le clavier, les lecteurs d'ecran et les cibles tactiles sont pris en compte des la conception.
6. **Operationnel.** Le scanner privilegie la vitesse, le contraste et une erreur visible. L'administration privilegie la lecture, la recherche et les actions fiables.

## 2. Perimetre visuel

### Application web

- Interface Admin : tableau de bord, invites, tables, billets, controleurs, historique et parametres.
- Interface Controleur : scanner camera, resultats de scan et recherche manuelle.
- Ecrans communs : connexion, session expiree, erreur reseau, acces refuse et pages vides.

### Billet PDF

Le billet est une sortie graphique distincte : il utilise le template de mariage fourni et le QR superpose. Ses couleurs, photos et typographies decoratives ne definissent pas le design system de l'application web.

## 3. Tokens de couleur

Les couleurs sont des roles semantiques et non des decorations. Centraliser ces valeurs dans des tokens CSS/Tailwind ; les composants ne doivent pas coder des couleurs arbitraires.

| Token | Valeur claire | Usage |
| --- | --- | --- |
| `background` | `#F7F8FA` | Fond global de l'application |
| `surface` | `#FFFFFF` | Formulaires, tableaux, panneaux, modales |
| `surface-subtle` | `#F1F3F5` | Zones secondaires, entetes de tableau, survol discret |
| `text` | `#1D1D1F` | Texte principal |
| `text-muted` | `#5C5F66` | Description, metadata, aide |
| `border` | `#D9DBE0` | Separateurs, contour des champs |
| `primary` | `#F48120` | Action principale, element selectionne |
| `primary-hover` | `#C8560A` | Survol et etat presse de l'action primaire |
| `primary-subtle` | `#FFF0E3` | Fond discret d'un menu actif ou d'une information primaire |
| `info` | `#2F6FED` | Liens, aide et information neutre |
| `success` | `#1A7F37` | Entree autorisee, operation reussie |
| `success-subtle` | `#E8F6EC` | Fond de succes |
| `warning` | `#B54708` | Billet deja utilise, attention a traiter |
| `warning-subtle` | `#FFF4E5` | Fond d'avertissement |
| `danger` | `#C83532` | Billet invalide, annule, erreur destructive |
| `danger-subtle` | `#FDEDEC` | Fond d'erreur |
| `focus` | `#2F6FED` | Anneau de focus clavier visible |

### Regles d'usage des couleurs

- L'orange `primary` est reserve aux actions principales et a la navigation active. Il ne doit pas colorer toutes les cartes ni tous les titres.
- Vert, orange/jaune et rouge expriment un etat metier ; ils ne sont jamais interchangeables.
- Une couleur n'est jamais la seule maniere de transmettre une information : ajouter texte, icone ou badge explicite.
- Les fonds colores doivent etre doux ; le texte doit rester suffisamment contraste.
- Un theme sombre pourra etre ajoute plus tard a partir des memes roles semantiques. Ne pas ecrire de composants bases sur des couleurs fixes qui empecheraient cette evolution.

## 4. Typographie

### Police

Utiliser **Inter** pour toute l'application. En cas d'indisponibilite : `system-ui, sans-serif`.

Ne pas utiliser les polices manuscrites, serif, ou decoratives du faire-part dans le back office et le scanner.

### Echelle typographique

| Element | Taille cible desktop | Taille cible mobile | Poids |
| --- | ---: | ---: | ---: |
| Titre page (`h1`) | 28 px | 24 px | 700 |
| Titre section (`h2`) | 20 px | 18 px | 600 |
| Sous-titre / panneau (`h3`) | 16 px | 16 px | 600 |
| Texte courant | 14-16 px | 16 px | 400 |
| Label de champ | 14 px | 14 px | 500 |
| Metadata | 12-14 px | 12-14 px | 400 |
| Bouton | 14 px | 14-16 px | 600 |

- Ne jamais descendre sous 12 px pour une information visible, ni sous 16 px pour un champ de saisie mobile.
- Utiliser des chiffres a chasse fixe (`font-variant-numeric: tabular-nums`) pour heures, compteurs, capacites et nombres de table.
- Les titres doivent etre courts et informatifs : « Invites », « Billet #024 », « Table 12 », pas de formulations marketing longues.

## 5. Espacement, grille et elevations

### Echelle d'espacement

Utiliser une echelle de 4 px : `4, 8, 12, 16, 20, 24, 32, 40, 48`.

- Espacement interne champ/bouton : 8 a 12 px.
- Espacement entre champs : 16 px.
- Espacement entre sections : 24 ou 32 px.
- Marges de page desktop : 24 a 32 px.
- Marges de page mobile : 16 px.

### Surfaces

- Fond de page neutre.
- Surface blanche pour formulaire, tableau, panneau lateral et modale.
- Bordure fine `border` ; ombre tres discrete seulement pour modales, menus flottants et panneaux superposes.
- Rayon : 6 a 8 px pour controles ; 8 a 12 px pour surfaces. Ne pas utiliser des rayons excessifs ou des cartes tres arrondies.
- Eviter les degradés, textures et ombres decoratives.

## 6. Structure de page Admin

### Desktop (>= 1024 px)

```text
Sidebar fixe de navigation (environ 240 px)
| zone de contenu fluide
| -> entete global : fil d'Ariane, compte, deconnexion
| -> titre de page, description courte, action principale
| -> filtres/recherche
| -> contenu principal : tableau, formulaire, detail ou statistiques
```

La sidebar contient : Tableau de bord, Invites, Tables, Billets, Controleurs, Historique et Parametres. L'item actif possede un fond `primary-subtle`, un texte fonce et une indication orange.

### Tablette (768-1023 px)

- Sidebar reduite ou repliable dans un tiroir.
- Contenu conserve sur une colonne principale.
- Les groupes de boutons peuvent revenir a la ligne.
- Les tableaux restent visibles lorsqu'ils sont courts ; sinon utiliser une zone de defilement horizontal controlee ou une version en liste.

### Mobile (< 768 px)

- Navigation dans un menu lateral ouvert par bouton.
- Entete compact avec titre de page et menu.
- Contenu sur une seule colonne.
- Action principale visible sous le titre ou dans une barre d'action fixe basse si elle est critique.
- Aucune action essentielle ne doit exiger un survol de souris.
- Une table large devient une liste de cartes/lignes ouvrables ; ne jamais exiger un zoom horizontal de page.

## 7. Responsive obligatoire - regles par composant

| Composant | Desktop | Tablette | Mobile |
| --- | --- | --- | --- |
| Sidebar | Visible et fixe | Repliable | Dans un tiroir/menu |
| En-tete | Fil d'Ariane + actions | Actions compactes | Titre + menu + action prioritaire |
| Grille de statistiques | 3-4 colonnes | 2 colonnes | 1 colonne |
| Formulaire | 2 colonnes si pertinent | 2 ou 1 colonne | 1 colonne obligatoire |
| Tableau invites/billets | Colonnes visibles | Colonnes secondaires masquees | Liste de lignes/cartes ouvrables |
| Barre de filtres | Horizontale | Retour a la ligne | Filtres dans panneau/toggle |
| Modale | Largeur contenue | Largeur adaptee | Plein ecran ou feuille basse |
| Panneau detail | Tiroir lateral | Tiroir large | Ecran detail plein format |
| Boutons | Hauteur standard | Hauteur standard | Cible tactile min. 44 x 44 px |
| Scanner | Utilisable mais secondaire | Prioritaire | Plein ecran, une action a la fois |

### Largeurs de reference a verifier

Chaque nouvel ecran doit etre verifie au minimum a :

- 320 px : telephone compact.
- 375 px : telephone courant.
- 768 px : tablette portrait.
- 1024 px : tablette paysage / petit ordinateur.
- 1440 px : desktop.

Un ecran n'est pas termine tant que texte, champs, actions, tableaux et messages ne restent pas lisibles et accessibles a ces largeurs.

## 8. Navigation et composants communs

### Boutons

| Variante | Usage |
| --- | --- |
| Primaire | Une action principale par zone : « Ajouter un invite », « Creer un billet », « Valider l'entree » |
| Secondaire | Action reversible ou de soutien : « Annuler », « Apercu », « Telecharger » |
| Tertiaire / lien | Action peu frequente ou navigation secondaire |
| Danger | Action destructive : « Revoquer », « Annuler le billet », « Supprimer » |

- Toujours utiliser un libelle d'action explicite.
- Ne pas avoir plusieurs boutons primaires concurrents dans une meme barre.
- Les actions destructives demandent une confirmation.
- Etat desactive visible avec explication si necessaire.

### Formulaires

- Label visible au-dessus de chaque champ ; le placeholder ne remplace jamais le label.
- Champ requis indique par texte ou marqueur accessible.
- Aide courte sous le champ lorsque cela reduit une erreur.
- Erreur affichee sous le champ concerne et annoncable par lecteur d'ecran.
- Les validations critiques sont aussi effectuees cote serveur.
- Conserver les valeurs saisies si une erreur reseau survient.

### Tableaux et listes

- Recherche en tete de liste.
- Filtres lisibles et combinables : statut, type de billet, table, presence.
- En-tete de tableau fixe seulement si cela apporte une reelle valeur sur longues listes.
- Colonnes prioritaires pour les invites : nom, table, billet, statut, action.
- Colonnes secondaires masquees en tablette/mobile avant de cacher les informations critiques.
- Chaque ligne doit offrir une action explicite pour ouvrir le detail.

### Badges de statut

| Statut | Texte visible | Couleur |
| --- | --- | --- |
| Billet actif | `Actif` | Neutre/vert discret |
| Billet utilise | `Utilise` | Orange/avertissement |
| Billet revoque | `Revoque` | Rouge |
| Billet annule | `Annule` | Rouge |
| Type Single | `Single - 1 personne` | Neutre |
| Type Couple | `Couple - 2 personnes` | Neutre |

Les badges ne remplacent jamais le texte detaille dans la fiche ou le resultat de scan.

### Modales et confirmations

Utiliser une modale uniquement pour : revocation, regeneration, suppression, annulation, validation manuelle et tout effet difficilement reversible.

Elle doit inclure : titre clair, consequence, element concerne, bouton d'annulation et bouton confirme. Sur mobile, elle devient une feuille basse ou un ecran plein pour garder les boutons accessibles.

### Toasts et alertes

- Toast : confirmation non bloquante apres sauvegarde ou generation reussie.
- Alerte inline : erreur de formulaire ou absence de permission.
- Bannière : probleme systemique (reseau indisponible, projet en maintenance).
- Les erreurs critiques ne doivent pas disparaitre automatiquement avant lecture.

## 9. Design du scanner controleur

Le scanner est une interface operationnelle, distincte du back office. Il doit etre optimize pour le telephone et la tablette en situation d'accueil.

### Composition mobile

```text
Entete : nom evenement / controleur connecte / etat reseau
Zone camera : element dominant de l'ecran
Resultat : grand bloc colore, texte clair, nom/table/type
Action unique : « Scanner le billet suivant »
Lien secondaire : « Recherche manuelle »
```

### Etats visuels de scan

| Etat | Fond/indication | Contenu minimal | Action |
| --- | --- | --- | --- |
| Autorise | Vert success | Nom(s), Single/Couple, table, heure | Scanner le suivant |
| Deja utilise | Orange warning | Nom(s), heure du premier passage | Retour au scanner |
| Invalide/revoque/annule | Rouge danger | Motif non ambigu | Retour ou recherche |
| Recherche manuelle | Bleu info | Champ recherche et resultats | Ouvrir un billet |

### Regles scanner

- Cibles tactiles d'au moins 44 x 44 px.
- Texte principal suffisamment grand pour etre lu rapidement, au moins 18 px pour le nom/etat.
- Retour visuel instantane apres scan, avec vibration/son optionnels et jamais comme seule indication.
- Pas de tableau, sidebar, menu complexe ni accumulation de metriques.
- Une erreur ne doit pas etre confondue avec un succes : icone, titre et couleur changent ensemble.
- Si la permission camera est refusee, expliquer clairement et proposer la recherche manuelle.
- Afficher l'etat du reseau pour que le controleur sache qu'une validation depend du serveur.

## 10. Iconographie

- Utiliser une bibliotheque unique, par exemple Lucide.
- Icones simples, lineaires, de taille coherente.
- Une icone accompagne un libelle d'action ; ne pas utiliser une icone seule pour une action ambiguë.
- Utiliser les memes icones partout : camera/scan, recherche, ajouter, modifier, supprimer, telecharger, table, invite, billet, historique.
- Toute icone sans texte doit avoir un `aria-label` clair.

## 11. Accessibilite obligatoire

- Contraste WCAG AA minimum pour texte, boutons et etats.
- Navigation clavier complete : menu, champs, tableau, modales et boutons.
- Focus visible avec le token `focus` ; ne jamais supprimer le focus natif sans alternative visible.
- Labels relies aux champs ; erreurs associees aux champs.
- Annoncer les resultats de scan par une zone `aria-live` appropriee, sans annoncer chaque image de camera.
- Ne pas utiliser la couleur seule pour determiner un statut.
- Respecter `prefers-reduced-motion` et eviter les animations inutiles.
- Tester les formulaires et le scanner avec zoom navigateur a 200 %.

## 12. Etats et messages

### Etats vides

Chaque module doit expliquer pourquoi il est vide et proposer la prochaine action utile.

Exemples :

- Invites : « Aucun invite pour le moment. Ajoutez une personne ou importez une liste. »
- Tables : « Aucune table configuree. Creez les tables avant d'attribuer les places. »
- Billets : « Aucun billet genere. Creez un billet Single ou Couple. »
- Historique : « Aucun scan enregistre pour le moment. »

### Erreurs reseau

Utiliser un message explicite : « La connexion au serveur est indisponible. Le billet n'a pas ete valide. Verifiez Internet puis reessayez. » Ne jamais afficher un succes optimiste tant que le serveur n'a pas confirme la validation.

### Session expiree

Expliquer que la session a expire et proposer la reconnexion. Conserver si possible les donnees de formulaire non envoyees.

## 13. Ce qu'il ne faut pas faire

- Ne pas transformer l'administration en site romantique avec fleurs, photos ou typographies decoratives.
- Ne pas utiliser le template PDF comme fond d'ecran de l'application.
- Ne pas surcharger les pages avec beaucoup de cartes ou de graphiques inutiles.
- Ne pas multiplier les couleurs d'accent ni les boutons primaires.
- Ne pas rendre un tableau mobile illisible ou exiger le zoom de la page.
- Ne pas cacher une action importante au survol ou dans un menu sans libelle.
- Ne pas creer des modales pour des operations simples.
- Ne pas faire dependre une information de la couleur seule.
- Ne pas faire du scanner un ecran dense de configuration.
- Ne pas considerer le responsive comme une etape de finition : il est une exigence de chaque composant.

## 14. Checklist de revue visuelle avant validation

### Pour tout nouvel ecran

- [ ] Le titre, l'objectif et l'action principale sont visibles immediatement.
- [ ] Les permissions utilisateur sont respectees visuellement et cote serveur.
- [ ] Tous les etats : chargement, vide, erreur, succes et acces refuse sont prevus.
- [ ] Les boutons et champs ont les variantes du design system.
- [ ] Les labels et messages d'erreur sont presents.
- [ ] Le rendu est teste a 320, 375, 768, 1024 et 1440 px.
- [ ] Aucun contenu n'est coupe, superpose ou inaccessible par manque d'espace.
- [ ] Les cibles tactiles critiques mesurent au moins 44 px sur mobile.
- [ ] Navigation clavier, focus et contraste sont verifies.

### Pour l'ecran scanner

- [ ] Le resultat est lisible en moins d'une seconde.
- [ ] Le statut contient couleur, icone et texte.
- [ ] Le nom, le type et la table sont lisibles a distance raisonnable.
- [ ] L'action suivante est unique et evidente.
- [ ] La recherche manuelle reste accessible en cas de probleme de camera/QR.
- [ ] L'etat reseau est comprehensible.

