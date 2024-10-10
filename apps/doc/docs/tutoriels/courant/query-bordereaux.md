---
title: Requêter et filtrer les bordereaux Bsda, Bsdasri, Bsff et Bsvhu
---

Les bordereaux Bsda, Bsdasri, Bsff et Bsvhu, ont bénéficié des retours utiilisateurs et proposent des filtres de requêtes puissants.

Veuillez noter que les Bsdd (requête forms) ne disposent pas des mêmes filtres. 

Pour une documentation exhaustive, veuillez consulter la référence des requêtes de chaque bordereau, par exemple [la requête bsdasri](../../reference/api-reference/bsdasri/queries.md#bsdasris).
 
Les exemples suivants portent sur les dasris, mais sont aisément transposables aux autres bordereaux. 
Ils ne prétendent pas avoir un intérêt métier particulier, mais simplement expliciter la syntaxe de requête.

### Filtres simples


#### Sur l'état de brouillon (boolean)
 
Renvoie les dasris non brouillons.

```graphql
query {
  bsdasris(where: { isDraft: false }) {
    edges {
      node {
        id
      }
    }
  }
}
```

#### Sur un statut


Renvoie les dasris SENT.

```graphql
query {
  bsdasris(where: {  status: {_eq : SENT} }) {
    edges {
      node {
        id
      }
    }
  }
}
```


#### Egalité stricte : Sur le siret d'un producteur

Renvoie les dasris dont le siret de l'émetteur est "UN-SIRET".

```graphql
query {
  bsdasris(where: { emitter : {company	: {siret :  {_eq: "UN-SIRET"}}} }) {
    edges {
      node {
        id
      }
    }
  }
}
```
#### Filtres temporels

Les opérateurs et formats de date acceptés sont documentés dans [la référence de DateFilter](../../reference/api-reference/bsdasri/inputObjects.md#datefilter).


Renvoie les dasris dont la date de création est égale ou postérieure au 23/11/2021.

```graphql
query {
  bsdasris(where: { createdAt: { _gte: " 2021-11-23" } }) {
    edges {
      node {
        id
      }
    }
  }
}
```


#### Filtre d'appartenance

Il est possible de filtrer certains champs sur un tableau de valeurs.

##### Sur les statuts


Renvoie les dasri en statut INITIAL ou SENT.

```
query {
  bsdasris(where: { status: { _in: [SENT, INITIAL] } }) {
    edges {
      node {
        id
      }
    }
  }
}
```

#### Sur des identifiants


Renvoie les dasris dont l'identifiant vaut "DASRI-123" ou "DASRI-456".

```
query {
  bsdasris(where: { id: { _in: ["DASRI-123", "DASRI-456"] } }) {
    edges {
      node {
        id
      }
    }
  }
}
```

### Filtres combinés

Il est possible de combiner des filtres avec _and, _or, _not. L'imbrication de tels opérateurs est néanmoins limitée.


### Not  (_not)


Renvoie les dasris non SENT

```graphql
query {
  bsdasris(where: { _not: { status: { _eq: SENT } } }) {
    edges {
      node {
        id
      }
    }
  }
}
```
### And implicite

Renvoie les dasris INITIAL non brouillons.

```graphql
query {
  bsdasris(where: { isDraft: false, status: { _eq: INITIAL } }) {
    edges {
      node {
        id
      }
    }
  }
}

```

### Or (_or)

Renvoie les dasris dont la date de création est égale ou postérieure au 03/05/2022 ou dont le statut est PROCESSED.

```graphql
query {
  bsdasris(
    where: {
      _or: [
        { createdAt: { _gte: "2022-05-03" } }
        { status: { _eq: PROCESSED } }
      ]
    }
  ) {
    edges {
      node {
        id
        updatedAt
      }
    }
  }
}
```

### And (_and)

Renvoie les dasris dont la date de création est égale ou postérieure au 03/05/2022, dont le statut est INITIAL et non brouillon.


```graphql
query {
  bsdasris(
    where: {
      createdAt: { _gte: "2022-05-03" }
      _and: [{ status: { _eq: INITIAL } }, { isDraft: false }]
    }
  ) {
    edges {
      node {
        id
        updatedAt
      }
    }
  }
}
```
