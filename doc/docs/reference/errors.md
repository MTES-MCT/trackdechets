---
title: Erreurs
---

## Formattage des erreurs


Dans le cas où une erreur a lieu avant ou pendant l'exécution d'une requête GraphQL, un champ `errors` sera présent dans le corps de la réponse. Ce champ correspond à une liste non vide d'erreurs formatées de la façon suivante:

```json
{
  "errors": [
    {
      "message": "Vous n'êtes pas authentifié",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```
Voir [GraphQL Response Format](https://spec.graphql.org/June2018/#sec-Response-Format) pour plus d'information sur le formattage des erreurs GraphQL.

Le champ `code` permet au client de l'API d'être informé du type d'erreur renvoyé et d'effectuer une action adéquate.

## Liste des codes erreur GraphQL

La liste des codes erreur utilisés est la suivante:

* `GRAPHQL_PARSE_FAILED`: Erreur de syntaxe dans la requête GraphQL. Exemple

```graphql
query {
  me  // accolade manquante
    email
  }
}
```

* `GRAPHQL_VALIDATION_FAILED`: La syntaxe de la requête GraphQL est correcte mais elle ne correspond pas au schéma. Exemple:

```graphql
{
  query {
    me {
      hair_color // le champ hair_color n'existe pas sur le type User
    }
  }
}
```

* `UNAUTHENTICATED`: Vous n'êtes pas authentifié
* `FORBIDDEN`: Vous n'avez pas les droits pour effectuer l'action désirée. Exemple: vous essayez de finaliser un bordereau sur lesquel aucune entreprise dont vous êtes membre n'apparait.

* `BAD_USER_INPUT`: La requête GraphQL est valide mais la valeur des arguments fournis ne l'est pas. Exemple: vous essayez de passer un SIRET qui ne fait pas 14 caractères.

* `EXTERNAL_SERVICE_ERROR`: La requête GraphQL est valide mais un service tiers externe à Trackdéchets a renvoyé une erreur.

```graphql
query {
  companyInfos(siret: "123"){
    siret
  }
}
```

Dans le cas des erreurs `BAD_USER_INPUT` un champ additionnel `invalidArgs` pourra être présent dans la réponse

```json
{
  "errors": [
    {
      "message": "Le siret doit faire 14 caractères",
      "extensions": {
        "code": "BAD_USER_INPUT",
        "invalidArgs": [
          "siret"
        ]
      }
    }
  ]
}
```

* `INTERNAL_SERVER_ERROR`: Une erreur inconnue s'est produite. Ce code s'accompagne du message d'erreur "Erreur serveur"

```json
{
  "errors": [
    {
      "message": "Erreur serveur",
      "extensions": {
        "code": "INTERNAL_SERVER_ERROR"
      }
    }
  ]
}
```

* `GRAPHQL_MAX_OPERATIONS_ERROR`: La limite du nombre d'opérations GraphQL groupées est dépassée.

```json
{
  "errors": [
    {
      "message": "Batching by query merging is limited to 5 operations per query.",
      "extensions": {
        "code": "GRAPHQL_MAX_OPERATIONS_ERROR"
      }
    }
  ]
}
```


## Liste des codes HTTP

Ci-dessous un tableau récapitulatif des différents codes HTTP et codes GraphQL possibles :

| Code HTTP | Code GraphQL         | Erreur        |
| :-------- |:-------------------- | :------------- |
| 200       | UNAUTHENTICATED      | Vous n'êtes pas authentifié |
| 200       | FORBIDDEN            | Vous n'avez pas les droits pour effectuer l'action désirée |
| 200       | BAD_USER_INPUT       | La requête GraphQL est valide mais la valeur des arguments fournis ne l'est pas |
| 400       | GRAPHQL_PARSE_FAILED | Erreur de syntaxe GraphQL |
| 400       | GRAPHQL_VALIDATION_FAILED | La syntaxe de la requête GraphQL est correcte mais elle ne correspond pas au schéma |
| 400       | GRAPHQL_MAX_OPERATIONS_ERROR | La limite du nombre d'opérations GraphQL groupées est dépassée. |
| 502       |  N/A | Le serveur GraphQL est indisponible |
| 503       |  N/A | Le serveur GraphQL est indisponible |
| 504       |  N/A | Le serveur GraphQL met trop de temps à répondre |


:::tip
Le code HTTP renvoyé par le serveur GraphQL est toujours 200 lorsque la requête GraphQL a été "comprise" par le serveur (la syntaxe est bonne et la requête correspond au schéma). <br/>
En cas d'indisponibilité ou de surcharge du serveur GraphQL, l'erreur renvoyée provient du serveur proxy et ne comporte pas de code erreur GraphQL.
:::
