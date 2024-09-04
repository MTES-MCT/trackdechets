---
title: Exporter un registre
---

L'[arrêté du 31 mai 2021](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000043884563) fixe le contenu des registres déchets, terres excavées et sédiments mentionnés aux articles R. 541-43 et R. 541-43-1 du code de l'environnement. Trackdéchets permet d'exporter facilement les données des bordereaux de suivi de déchets dangereux au format registre. Cette fonctionnalité permet également au registre électronique national de récupérer les données relatives à la traçabilité des déchets dangereux directement.

## Export JSON

Les `queries` permettant d'exporter les données registre sont les suivantes :
- [`incomingWastes`](../reference/api-reference/registre/queries#incomingwastes) : registre de déchets entrants
- [`outgoingWastes`](../reference/api-reference/registre/queries#outgoingwastes) : registre de déchets sortants
- [`transporteWastes`](../reference/api-reference/registre/queries#transportedwastes): registre de déchets transportés
- [`managedWastes`](../reference/api-reference/registre/queries#managedwastes) : registre de déchets gérés (courtage ou négoce)
- [`allWastes`](../reference/api-reference/registre/queries#allwastes) : registre permettant d'exporter toutes les données de bordereaux pour un ou plusieurs établissements

Des filtres avancés peuvent être appliqués pour restreindre les données exportés par code déchet, quantité, date d'expédition, etc, et son décrits dans l'objet [RegisterWhere](../reference/api-reference/registre/inputObjects#wasteregistrywhere).

Exemple de requête :

```graphql
query {
  outgoingWastes(sirets: ["53070853600038"], first: 10) {
    pageInfo {
      endCursor
      hasNextPage
    }
    edges {
      cursor
      node {
        # La date de l'expédition du déchet
        transporterTakenOverAt
        #La dénomination usuelle du déchet
        wasteDescription
        #Le code du déchet sortant au regard de l'article R. 541-7 du code de l'environnement
        wasteCode
        #S'il s'agit, de déchets POP au sens de l'article R. 541-8 du code de l'environnement"
        pop
        # Le numéro du ou des bordereaux de suivi de déchets mentionnés aux articles R. 541-45 du code de l'environnement et R. 1335-4 du code de la santé publique
        id
        #La quantité de déchet sortant en tonne
        weight
        #L'adresse de l'établissement
        emitterCompanyAddress
        #L'adresse de prise en charge lorsqu'elle se distingue de l'adresse de l'établissement
        emitterPickupsiteAddress
        #La raison sociale du producteur initial du déchet - optionnel lorsque les déchets proviennet de plusieurs producteurs
        initialEmitterCompanyName
        #Le numéro SIRET du producteur initial du déchet - optionnel lorsque les déchets proviennet de plusieurs producteurs
        initialEmitterCompanySiret
        #L'adresse du producteur initial du déchet - optionnel lorsque les déchets proviennet de plusieurs producteurs
        initialEmitterCompanyAddress
        #Lorsque les déchets apportés proviennent de plusieurs producteurs, le ou les codes postaux de la commune de collecte des déchets
        initialEmitterPostalCodes
        #la raison sociale de l'éco-organisme si le déchet est pris en charge par un éco-organisme mis en place dans
        #le cadre d'une filière à responsabilité élargie du producteur
        ecoOrganismeName
        #Le N°SIREN l'éco-organisme si le déchet est pris en charge par un éco-organisme mis en place dans
        #le cadre d'une filière à responsabilité élargie du producteur
        ecoOrganismeSiren
        #La raison sociale du négociant si le déchet est géré par un négociant
        traderCompanyName
        #Le N°SIRET du négociant si le déchet est géré par un négociant
        traderCompanySiret
        #Le numéro de récépissé du négociant mentionné à l'article R. 541-56 du code de l'environnement si le déchet est géré par un négociant
        traderRecepisseNumber
        #La raison sociale du courtier si le déchet est géré par un courtier
        brokerCompanyName
        #Le N°SIRET du courtier si le déchet est géré par un courtier"
        brokerCompanySiret
        #Le numéro de récépissé du courtier mentionné à l'article R. 541-56 du code de l'environnement si le déchet est géré par un courtier
        brokerRecepisseNumber
        #La raison sociale du transporteur
        transporterCompanyName
        #Le N°SIRET du transporteur
        transporterCompanySiret
        #Le numéro de récépissé du trasnporteur mentionné à l'article R. 541-53 du code de l'environnement
        transporterRecepisseNumber
        #L'adresse du transporteur"
        transporterCompanyAddress
        #La raison sociale de l'établissement vers lequel le déchet est expédié
        destinationCompanyName
        #Le N°SIRET de l'établissement vers lequel le déchet est expédié"
        destinationCompanySiret
        #L'adresse de l'établissement vers lequel le déchet est expédié"
        destinationCompanyAddress
        #Le code du traitement qui va être opéré dans l'installation vers laquelle le déchet est expédié, selon les annexes I et II de la directive 2008/98/CE relative aux déchets ;
        destinationPlannedOperationCode
      }
    }
  }
}
```

Les résultats sont paginés. Pour récupérer tous les déchets :
- obtenir une première page avec `first=50`.
- si `pageInfo { hasNextPage }` est `true`, refaire une requête avec `first=50` et `after=<cursor>` où `cursor` est égal à `pageInfo { endCursor }` de la requête précédente.
- continuer ainsi tant que `pageInfo { hasNextPage }` est `true`.
- `totalCount` vous donne le nombre total de déchets à récupérer à tout moment.


## Export CSV ou Excel

Les données peuvent également être téléchargées au format `CSV` ou Excel (`XLXS`).

Pour ce faire vous devez utiliser la query [`wastesRegistryCsv`](../reference/api-reference/registre/queries#wastesregistrycsv) ou [`wastesRegistryXls`](../reference/api-reference/registre/queries#wastesregistryxls) de la façon suivante :

```graphql
query {
  wastesRegistryCsv(
    registerType: OUTGOING
    sirets: ["53070853600038"]
  ) {
    downloadLink
  }
}
```


Vous recevrez en réponse un lien de téléchargement à utiliser pour télécharger le fichier.

```json
{
  "data": {
    "wastesDownloadLink": {
      "downloadLink": "http://api.trackdechets.beta.gouv.fr/download?token=xxxx"
    }
  }
}
```

Ce lien n'est valide que 10 secondes, il est donc nécessaire d'enchainer dans votre code client l'appel à la query GraphQL `wastesRegistryCsv` `wastesRegistryXls` puis une requête `GET` classique sur le lien de téléchargement.



