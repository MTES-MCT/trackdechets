---
id: introduction
title: API Trackdéchets
sidebar_label: API Trackdéchets
---


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

Voir la rubrique [Faire des appels à l'API GraphQL](graphql.md) pour un guide d'utilisation de l'API.

## Évolutions de l'API

Le développement du projet Trackdéchets se fait en mode agile, c'est à dire que le produit est en constante évolution pour s'adapter aux besoins des utilisateurs de la plateforme. Ceci étant dit nous nous efforçons de limiter les changements non rétro-compatibles apportés à l'API publique et lorsqu'ils sont nécessaires de les annoncer assez de temps à l'avance. Les changements apportés à l'API sont documentés dans un [Changelog](changelog.md)



