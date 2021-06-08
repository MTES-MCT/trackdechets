---
title: API SIRENE enrichie
description: API SIRENE enrichie
sidebar_position: 6
---

### Rechercher un établissement par son SIRET

Nous exposons une query `companyInfos` qui interroge la base SIRENE (via [https://entreprise.data.gouv.fr](https://entreprise.data.gouv.fr)), la base des installations classées pour la protection de l'environnement (ICPE) et la base Trackdéchets pour obtenir des informations sur un établissement à partir de son numéro SIRET.

La query renvoie un objet de type [`CompanyPublic`](../api-reference/user-company/objects#companypublic) et permet notamment de savoir si un établissement est inscrit sur Trackdéchets grâce au champ `isRegistered`.

Exemple d'utilisation:

```graphql
query {
  companyInfos(siret: "13001045700013") {
    name
    naf
    address
    isRegistered
  }
}
```

```
{
  "data": {
    "companyInfos": {
      "name": "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
      "naf": "84.13Z",
      "address": "15 Rue Arthur Ranc 86000 Poitiers",
      "isRegistered": true
    }
  }
}
```

:::note
Nous avons crée une **fiche entreprise** pour chaque établissement sur l'interface graphique Trackdéchets qui illustre l'utilisation de cette query. Exemple avec la DREAL Nouvelle Aquitaine: [https://app.trackdechets.beta.gouv.fr/company/13001045700013](https://app.trackdechets.beta.gouv.fr/company/13001045700013)
