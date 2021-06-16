---
title: Regroupement
---

_Avertissement: l'implémentation Dasri et cette documentation constituent une version Beta et sont destinées à l'évaluation des intégrateurs. L'api est suceptible d'évoluer_

## Création d'un DASRI de regroupement

Pour effectuer un regroupement, il faut adapter la mutation de création `createBsdasri` et passer les IDs des dasirs à regrouper dans le champ `regroupedBsdasris`.

Le dasris à regrouper doivent:

- être dans l'état PROCESSED
- avoir un processingOperation égal à D12 ou R12
- ne pas être regroupés ailleurs ou être eux-mêmes des bordereaux de regroupement
- leur destinataire doit être l'émetteur du bordereau de regroupement

```graphql
mutation createBsdasri($input: BsdasriCreateInput!) {
  createBsdasri(bsdasriCreateInput: $input) {
    id
    status
  }
}
Variables:
{
  "input": {
    "emitter": {…},
     "emission": {…},
    },
   "regroupedBsdasris": [
       {"id": "DASRI-20201…"},
       {"id": "DASRI-20201…"},
       {"id": "DASRI-20201…"}
    ]
  }
}
```

# Consulter les bordereaux regroupés

Lors de la query d'un dasri de regroupement,  les numéros des bordereau regroupés sont accessibles

Query
```graphql
query {
  bsdasri(id: "DASRI-2021…") {
    id
    status
    regroupedBsdasris
  }
}
```

Réponse
```json
{
  "data": {
    "bsdasri": {
        "id": "DASRI-2021…",
      "regroupedBsdasris": [
        "DASRI-2021…",
        "DASRI-2021…",
        "DASRI-2021…",
        "DASRI-2021…"
      ],
      "status": "PROCESSED"
    }
  }
}
```