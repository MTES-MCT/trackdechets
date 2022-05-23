---
title: Authentification
---

## Authentification avec un token personnel

L'authentification à l'API se fait avec un token qui doit être passée via l'en-tête `Authorization` de chacune de vos requêtes de la façon suivante :

```json
{ "Authorization": "Bearer YOUR_TOKEN" }
```

Chaque utilisateur inscrit sur la plateforme peut obtenir un token depuis l'interface Trackdéchets en allant sur _Mon Compte_ > _Intégration API_ puis _Générer une clé_. Les tokens ont une durée de vie inifinie. Il sera à terme possible de les révoquer depuis son compte Trackdéchets.

:::caution
La mutation `login(email, password)` qui permet d'obtenir un token via l'API GraphQL à partir de l'email et mot de passe est désormais dépréciée.
:::

Un token est lié à un utilisateur. Les permissions du token découle donc directement des droits de l'utilisateur qui a généré le token. Voir aussi la référence sur les [permissions](./permissions)

## Authentification pour le compte de tiers

Pour les logiciels (ex: logiciel SaaS déchets) désirant se connecter à l'API Trackdéchets pour le compte d'utilisateurs tiers, nous recommandons d'utiliser le protocole OAuth2 : [Créer une application OAuth2](../guides/oauth2)
