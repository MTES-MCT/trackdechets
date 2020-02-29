# API Trackdéchets

[Trackdéchets](https://trackdechets.beta.gouv.fr/) est un outil numérique qui vise à simplifier et fiabiliser la traçabilité des déchets dangereux. Le projet est développé par le Ministère de la Transition Écologique et Solidaire au sein de la Fabrique Numérique. Cette documentation vise à exposer le fonctionnement de l'API Trackdéchets, interface par laquelle des applications informatiques peuvent éditer et suivre des BSD's numériques. Son utilisation permet à vos systèmes informatiques existants (logiciel du marché ou SI métier) de s'interconnecter avec la plateforme Trackdéchets pour la dématérialisation des BSD's.

En tant que plateforme, l'API Trackdéchets vise à standardiser l'implémentation de la réglementation au niveau informatique et donc de permettre des échanges de données entre systèmes hétérogènes ainsi que d'assurer la portabilité des données.

## Lien avec l'interface graphique Trackdéchets

Nous mettons également à disposition une [interface graphique](https://trackdechets.beta.gouv.fr/) qui permet plusieurs choses:

* Création de nouveaux utilisateurs
* Enregistrement d'établissements et gestion des droits
* Édition et suivi de BSD's
* Export de registre
* Affichage de statistiques

L'interface graphique Trackdéchets utilise la même API que l'API publique documentée sur ce site à quelques exceptions près:

* L'accès à certaines fonctionnalités comme la création de compte, la modification de mots de passe, la gestion des droits, etc, pourra être restreint à une utilisation via l'interface graphique Trackdéchets uniquement.
* À l'inverse, des fonctionnalités avancées de l'API peuvent ne pas être exploitées dans l'interface graphique.

L'interface graphique Trackdéchets n'a pas vocation à se substituer à des solutions logicielles existantes mais plutôt à fournir un point d'accès basique pour la consultation et l'édition de BSD's numériques sur la plateforme Trackdéchets.

## HTTP / GraphQL

L'API Trackdéchets est un service web basé sur le protocole HTTP, et peut donc fonctionner avec n'importe quelle librairie HTTP dans le langage de programmation de votre choix. Le standard [GraphQL](https://graphql.org/) est utilisé pour le requêtage de l'API. Les actions possibles sont catégorisées entre `queries` (lecture de données) et `mutations` (création, modification, suppression de données). L'ensemble des types, requêtes et mutations est documenté dans la [référence de l'API](api-reference/api-reference).

La racine de l'API est accessible à l'adresse suivante: [https://api.trackdechets.beta.gouv.fr](https://api.trackdechets.beta.gouv.fr). Si vous vous y rendez depuis un navigateur web, vous aurez accès à une interface graphique de prise en main de l'API (dite "playground") permettant de tester des requêtes GraphQL directement depuis votre navigateur web.

## Authentification

L'authentifcation à l'API se fait à l'aide d'un token (ou jeton d'accès) de type "Bearer". Un token est lié à un utilisateur. Les droits d'accès du token découle donc directement des droits de l'utilisateur qui a généré le token. Le token doit être être ajouté à l'en-tête `Authorization` de chaque requête faite à l'API Trackdéchets. Exemple avec la requête suivante qui permet de lister le statut de l'ensemble des BSD's d'un établissement

```
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \ # <= Header Authorization
  --data '{ "query": "{ forms(siret: \"<SIRET>\") { status } }" }' \
  https://api.trackdechets.beta.gouv.fr/
```

Les tokens ont une durée de vie illimité mais sont révocables par l'utilisateur.

Des tokens personnels peuvent être générés directement depuis l'interface graphique Trackdéchets dans la rubrique Mon Compte > Intégration API.

Si vous souhaitez récupérer un token pour utiliser l'API pour le compte d'un tiers, vous devez implémenter le protocole [OAuth2](oauth2.md).

## Environnement "Bac à Sable" et "Recette"

Afin de permettre la réalisation de tests d'intégration, nous avons mis en place un environnement "bac à sable", miroir de la production mais avec une base de données séparée. Vous pouvez créer, modifier ou supprimer autant de BSD's de test que vous voulez sur cet environnement.

Accéder à l'environnement bac à sable:

* [https://api.sandbox.trackdechets.beta.gouv.fr](https://api.sandbox.trackdechets.beta.gouv.fr) (API)
* [https://sandbox.trackdechets.beta.gouv.fr](https://sandbox.trackdechets.beta.gouv.fr) (Interface graphique)


Enfin, il y a également un environnement de "recette" permettant aux équipes Trackdéchets de tester de nouvelles fonctionnalités. Nous n'apportons aucune garantie de stabilité, de disponibilité ou de persistance des données sur cette environnement. Il peut toutefois être utilisé pour tester en avant première des fonctionnalités qui sont annoncées sur le [forum](https://forum.trackdechets.beta.gouv.fr) ou dans la newsletter tech


Accéder à l'environnement de recette:

* [https://trackdechets.fr](https://trackdechets.fr) (API)
* [https://api.trackdechets.fr](https://api.trackdechets.fr) (interface graphique)

## Évolutions de l'API

Le développement du projet Trackdéchets se fait en mode agile, c'est à dire que le produit est en constante évolution pour s'adapter aux besoins des utilisateurs de la plateforme. Ceci étant dit nous nous efforçons de limiter les changements non rétro-compatibles apportés à l'API publique et lorsqu'ils sont nécessaires de les annoncer assez de temps à l'avance. Les changements apportés à l'API sont documentés dans un [Changelog](changelog.md)



