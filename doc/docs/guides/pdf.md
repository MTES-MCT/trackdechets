---
title: Exporter un bordereau en pdf
---

Il est possible à tout moment d'obtenir une version pdf du BSD (à l'exception d'un BSD à l'état brouillon). L'obtention du pdf se fait en deux temps. Il faut d'abord récupérer un lien de téléchargement grâce à la mutation `formPdf` en passant en argument l'identifiant du BSD, puis utiliser ce lien pour télécharger le fichier

```graphql
query {
  formPdf(id: "{BSD_id}") {
    downloadLink
  }
}
```

```json
{
  "data": {
    "formPdf": {
      "downloadLink": "https://api.trackdechets.beta.gouv.fr/download?token=form_pdf-xxxxxxxxx-xxxx"
    }
  }
}
```

:::warning
L'URL a une durée de validité de 10 secondes.
:::
