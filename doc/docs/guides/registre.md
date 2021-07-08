---
title: Exporter un registre
---

Il est possible d'exporter les données Trackdéchets correspondant aux différents types de registres réglementaires:
* registre de déchets sortants (`OUTGOING`)
* registre de déchets entrants (`INCOMING`)
* registre transporteur (`TRANSPORTED`)
* registre négociant (`TRADED`)
* registre exhaustif (`ALL`)

Les données peuvent être sélectionnées par siret, date de début, date de fin ou code déchet. Le format de l'export peut être csv (`CSV`) ou Excel (`XLXS`)

Pour ce faire vous devez utiliser la query [`formsRegister`](../reference/api-reference/bsdd/queries#formsregister) de la façon suivante

```graphql
query {
  formsRegister(sirets: ["xxxxxxxxxxxxxx"], exportType: OUTGOING, startDate: "2019-01-01", endDate: "2019-12-31", exportFormat: CSV) {
    downloadLink
  }
}
```

Vous recevrez en réponse un lien de téléchargement à utiliser pour télécharger le fichier.

```json
{
  "data": {
    "formsRegister": {
      "downloadLink": "http://api.trackdechets.beta.gouv.fr/download?token=xxxx"
    }
  }
}
```

Ce lien n'est valide que 10 secondes, il est donc nécessaire d'enchainer dans votre code client l'appel à la query GraphQL `formRegister` puis la requête `GET` classique sur le lien de téléchargement.

Voir aussi la description de la query `formsRegister` dans la [référence de l'API](../reference/api-reference/bsdd/queries#formsregister)

