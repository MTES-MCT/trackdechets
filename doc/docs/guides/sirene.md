---
title: Rechercher un établissement partenaire par son n° SIRET
---

Nous exposons une query `companyInfos` qui interroge la base SIRENE (via [l'API de l'INSEE](https://api.insee.fr/catalogue/)), la base des installations classées pour la protection de l'environnement (ICPE) et la base Trackdéchets pour obtenir des informations sur un établissement à partir de son numéro SIRET.

La query renvoie un objet de type [`CompanyPublic`](../reference/api-reference/user-company/objects#companypublic) et permet notamment de savoir si un établissement est inscrit sur Trackdéchets grâce au champ `isRegistered`. Voir le détail de la query dans la [référence de l'API](../reference/api-reference/user-company/queries#companyinfos).

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
