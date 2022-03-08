---
title: Introduction à GraphQL
---


## Comparaison avec le standard REST

Dans le standard REST, la méthode de requête HTTP (`GET`, `POST`, `PUT`, `DELETE`) détermine le type d'opération. Dans le standard GraphQL, un contenu de requête JSON est passé que ce soit pour une `query` ou une `mutation`, la méthode de requête est donc toujours `POST`. La seule exception est la requête d'introspection qui est un simple `GET` sur le point de terminaison GraphQL.

Toutes les requêtes se font sur un point de terminaison unique à la [racine de l'API](../reference/environments/environments.mdx)

Pour faire une requête GraphQL en utilisant cURL, vous devez faire un `POST` avec un corps JSON. Le corps de la requête doit contenir une chaine de caractères appelée `query`.



```bash
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --data '{"query": "query { me { name} }"}' https://api.trackdechets.beta.gouv.fr/
```


## À propos des opérations de type `query` et `mutation`

Les deux types d'opération autorisées sur l'API GraphQL Trackdéchets sont les *queries* et les *mutations*. Pour faire un parallèle avec le standard REST, les *queries* se comportent comme des requêtes `GET` et les mutations se comportent comme des requêtes `POST`/`PATCH`/`DELETE`. Le nom de la mutation détermine l'opération qui sera executée. Les requêtes et mutations ont une forme similaire avec quelques différences.

:::info
La clé JSON utilisée est toujours `"query"`, que ce soit pour une *query* ou une *mutation* GraphQL. La différence se fait dans la chaine de caractère passée en valeur :

```json
// exemple de query
{ "query": "query { ... }" }

// exemple de mutation
{ "query" : "mutation { ... }"}
```
:::


### Queries

Les *queries* GraphQL retournent uniquement les données spécifiées. Pour construire une *query* il faut spécifier les champs imbriqués jusqu'à un champs de type scalaire (string, int, etc).

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

Des variables peuvent également être ajoutées sur certaines *queries*.

Exemple avec une requête d'information entreprise en passant un numéro siret en variable :

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

Exemple avec une requête permettant de valider la réception d'un bordereau de déchets dangereux :

```graphql
mutation {
  markAsReceived(
    id: "sju8d6g0JU61G76F",
    receivedInfo: {
      receivedBy: "Bill",
      receivedAt: "2019-01-17",
      signedAt: "2019-01-17",
      wasteAcceptationStatus: "ACCEPTED",
      quantityReceived: 0
    }){
    id
    status
  }
}
```
