---
title: Rechercher un établissement partenaire sur l'API Trackdéchets
---

# Par son nom, ou par n° SIRET ou par son n°TVA intracommunautaire pour les entreprises européennes.

Nous exposons une query [`searchCompanies`](../reference/api-reference/user-company/queries#searchcompanies) qui interroge la base SIRENE (via [les données ouvertes de l'INSEE](https://files.data.gouv.fr/insee-sirene/)), ou la base VIES (via [le service la commission européenne](https://ec.europa.eu/taxation_customs/vies/)) la base des installations classées pour la protection de l'environnement (ICPE) et la base Trackdéchets pour obtenir des informations sur un établissement à partir de son numéro SIRET, sa raison sociale, ou son numéro de TVA intra-communautaire.

Elle requiert un token d'API Trackdéchets et permet d'accéder à toutes les informations d'un établissement sur Trackdéchet et à jour des bases de l'INSEE ou de VIES (via [le service la commission européenne](https://ec.europa.eu/taxation_customs/vies/)).

La query renvoie un objet de type [`CompanySearchResult`](../reference/api-reference/user-company/objects#companysearchresult) et permet notamment de savoir si un établissement est inscrit sur Trackdéchets grâce au champ `isRegistered`, mais aussi les coordonnées de l'établissement, comme le type d'établissement sur Trackdéchets. 

Pour retourner les établissements étrangers quand on cherche par `clue : "NUMERODETVA"`, il faut activer à `true` le paramètre `allowForeignCompanies`.

Pour rechercher par raison sociale un établissement français, en filtrant par département, il faut utiliser le paramètre `department`.

Même si l'établissement demandé est enregistré auprès de l'INSEE comme "non-diffusible" ou "protégé" (c'est-à-dire si `statutDiffusionEtablissement` ne renvoie pas "O"), nous les renverrons dans cette requête `searchCompanies` car elle est protégée par authentification sur l'API Trackdechets et que ces informations sont renseignées dans la base Trackdéchets.

Exemple d'utilisation avec `clue` comme recherche plein-texte dans le nom d'établissement ou d'unité légale :

```graphql
query {
  searchCompanies(clue: "DIRECTION REGIONALE DE L'ETABLISSEMENT") {
    name
    naf
    address
    isRegistered
    contactEmail
  }
}
```

```json
{
  "data": {
    "searchCompanies": [{
      "name": "DIRECTION REGIONALE DE L'ETABLISSEMENT",
      "naf": "84.13Z",
      "address": "51 Rue Arthur Ranc 86000 Poitiers",
      "isRegistered": true,
      "contactEmail": "test@test.com"
    }]
  }
}
```


# Par son n° SIRET pour les entreprises françaises ou par son n°TVA intracommunautaire pour les entreprises européennes.

Nous exposons une query [`companyInfos`](../reference/api-reference/user-company/queries#companyinfos) qui interroge la base SIRENE (via [les données ouvertes de l'INSEE](https://files.data.gouv.fr/insee-sirene/)), ou la base VIES (via [le service la commission européenne](https://ec.europa.eu/taxation_customs/vies/)) la base des installations classées pour la protection de l'environnement (ICPE) et la base Trackdéchets pour obtenir des informations sur un établissement à partir de son numéro SIRET.

La requête renvoie un objet de type [`CompanyPublic`](../reference/api-reference/user-company/objects#companypublic) et permet notamment de savoir si un établissement est inscrit sur Trackdéchets grâce au champ `isRegistered`. Si l'établissement demandé est enregistré auprès de l'INSEE comme  "non-diffusible" ou "protégé" (c'est-à-dire si `statutDiffusionEtablissement` ne renvoie pas "O"), nous ne les révèlerons pas dans cette requête `companyInfos`. Il faudra utiliser la requête authentifiée `searchCompanies` documentée sur cette page en passant le siret comme valeur de la variable `clue`.

Exemple d'utilisation:

```graphql
query {
  companyInfos(siret: "13001045700013") {
    name
    naf
    address
    isRegistered
    allowBsdasriTakeOverWithoutSignature
  }
}
```

```json
{
  "data": {
    "companyInfos": {
      "name": "DIRECTION REGIONALE DE L'ETABLISSEMENT",
      "naf": "84.13Z",
      "address": "51 Rue Arthur Ranc 86000 Poitiers",
      "isRegistered": true,
      allowBsdasriTakeOverWithoutSignature: false
    }
  }
}
```

:::note
Nous avons créé une **fiche entreprise publique** pour chaque établissement sur l'interface graphique Trackdéchets qui illustre l'utilisation de cette query. Exemple avec la DREAL Nouvelle Aquitaine: [https://app.trackdechets.beta.gouv.fr/company/13001045700013](https://app.trackdechets.beta.gouv.fr/company/13001045700013)
