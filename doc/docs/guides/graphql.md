---
title: Faire des appels à l'API GraphQL
---


## Point de terminaison GraphQL

L'API GraphQL Trackdéchets expose un point de terminaison unique

> [https://api.trackdechets.beta.gouv.fr](https://api.trackdechets.beta.gouv.fr)

Nous avons également mis en place des [environnements de test](environments.md) avec des points de terminaison distincts.


## Authentification

L'authentifcation à l'API se fait à l'aide d'un token (ou jeton d'accès) de type "Bearer". Suivez les instructions dans [Obtenir un jeton d'accès personnel](access-token.md) pour en obtenir un.

:::note
Si vous développez un logiciel SaaS désirant obtenir un token pour faire des appels à l'API pour le compte d'utilisateurs tiers, nous recommandons d'implémenter le [protocole OAuth2](oauth2.md)
:::

:::warning
La mutation `login(email, password)` qui permet d'obtenir un token via l'API GraphQL à partir de l'email et mot de passe est désormais dépréciée.
:::

 Un token est lié à un utilisateur. Les droits d'accès du token découle donc directement des droits de l'utilisateur qui a généré le token. Le token doit être ajouté à l'en-tête `Authorization` de chaque requête faite à l'API Trackdéchets.

:::note
Les tokens personnels générés depuis votre compte Trackdéchets ont une durée de validité infinie. Il sera bientôt possible de les révoquer depuis le même espace
:::


## Communiquer avec l'API GraphQL

Nous recommandons d'utiliser le playground GraphQL pour une première prise en main de l'API Voir [Guide d'utilisation du playground](playground.md). Vous pouvez également utiliser cURL ou n'importe quelle librairie HTTP dans le langage de votre choix.

Dans le standard REST, la méthode de requête HTTP (`GET`, `POST`, `PUT`, `DELETE`) détermine le type d'opération. Dans le standard GraphQL, un contenu de requête JSON est passé que ce soit pour une `query` ou une `mutation`, la méthode de requête est donc toujours `POST`. La seule exception est la requête d'introspection qui est un simple `GET` sur le point de terminaison GraphQL.

Pour faire une requête GraphQL en utilisant cURL, vous devez faire un `POST` avec un corps JSON. Le corps de la requête doit contenir une chaine de caractères appelée `query`.


```bash
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  --data " \
 { \
   \"query\": \" \
    query { \
      me { name } \
      }\" \
 } \
" https://api.trackdechets.beta.gouv.fr/
```
:::note
La chaîne de caractères de `"query"` doit échapper les sauts de lignes pour être correctement lue par le serveur. Pour le corps du message `POST`, il faut utiliser des guillemets doubles à l'extérieur et échapper tous les guillements doubles à l'intérieur du message.
:::

## À propos des opérations de type `query` et `mutation`

Les deux types d'opération autorisées sur l'API GraphQL Trackdéchets sont les `queries` et les `mutations`. Pour faire un parallèle avec le standard REST, les `queries` se comportent comme des requêtes `GET` et les mutations se comportent comme des requêtes `POST`/`PATCH`/`DELETE`. Le nom de la mutation détermine l'opération qui sera executée. Les requêtes et mutations ont une forme similaire avec quelques différences.


### Queries

Les `queries` GraphQL retournent uniquement les données spécifiées. Pour construire une `query` il faut spécifier les champs imbriqués jusqu'à un champs de type scalaire (string, int, etc).

Exemple avec une requête de profil utilisateur


```graphql
query {
  me {
    name
    email
    companies {
      name
      siret
    }
  }
}
```

Des variables peuvent également être ajoutées sur certaines `queries`.

Exemple avec une requête d'information entreprise en passant un numéro siret en variable

```graphql
query {
  companyInfos(siret: "13001045700013") {
    name,
    address
  }
}
```

### Mutations

Pour construire une mutation, il faut spécifier trois choses:

1. Le nom de la mutation qui correspond à l'opération à exécuter
2. Les données d'input passées en argument
3. Les données retournées

Exemple avec une requête permettant d'éditer son profil utilisateur Trackdéchets en ajoutant un numéro de téléphone

```graphql
mutation {
  editProfile(phone: "06xxxxxxxx"){
    id
    phone
  }
}
```
