---
title: Gestion des erreurs
description: Gestion des erreurs
sidebar_position: 1
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

Le champs `code` permet au client de l'API d'être informé du type d'erreur renvoyé et d'effectuer une action adéquate.


## Liste des codes erreurs

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

* `BAD_USER_INPUT`: La requête GraphQL est valide mais la valeur des arguments fourni ne l'est pas. Exemple: vous essayez de passer un SIRET qui ne fait pas 14 caractères.

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