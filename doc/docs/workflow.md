---
id: workflow
title: Cycle de vie du bordereau
sidebar_label: Cycle de vie du bordereau
---

## Tableau de bord

Nous intégrons petit à petit l'ensemble des cas d'usage du suivi de déchets au bordereau numérique.

| Fonctionnalité                                                                                                             | État     |
| -------------------------------------------------------------------------------------------------------------------------- | -------- |
| BSD simple (case 1-6, 9, 11)                                                                                               | OK       |
| Signature Transporteur (case 8)                                                                                            | OK       |
| Négociant (case 7)                                                                                                         | OK       |
| Destinatation ultérieure (case 12)                                                                                         | OK       |
| Rupture de traçabilité                                                                                                     | OK       |
| Refus de déchets                                                                                                           | OK       |
| Collecte de petites quantités de déchets relevant d'une même rubrique (Annexe 1)                                           | OK       |
| Réexpédition après transformation ou traitement aboutissant à des déchets dont la provenance reste identifiable (Annexe 2) | OK       |
| Entreposage provisoire ou reconditionnement (case 13-19)                                                                   | OK       |
| Transport multi-modal simple (case 20-21)                                                                                  | OK       |
| Transport multi-modal complexe                                                                                             | Planifié |

Pour plus d'informations sur le calendrier de déploiement des fonctionnalités, vous pouvez consulter notre [roadmap produit](https://trello.com/b/2pkc7bFg/trackd%C3%A9chets-roadmap-produit)

## Numéro de BSD

Chaque BSD est associé à un identifiant opaque unique. Cet identifiant correspond au champ `id` et doit être utilisé lors des différentes requêtes. En plus de l'identifiant opaque, un identifiant "lisible" est généré (champ `readableId`). Cet identifiant apparait sur le bordereau dans la case "Bordereau n°". L'identifiant est sous la forme `TD-{année}-{identifiant}` (Ex: `TD-20-AAA00136`). Il peut être utiliser pour récupérer l'identifiant opaque unique via la query `form`.

Vous pouvez également ajouter un identifiant qui vous est propre pour faire le lien avec votre SI. Il vous faut pour cela utiliser le champ `customId`.

:::tip
Un QRCode généré dans l'interface utilisateur encode le champ `readableId`.
:::

## États du BSD

L'ensemble des champs du BSD numérique est décrit dans la [référence de l'API](api-reference.md#form). Au cours de son cycle de vie, un BSD numérique peut passer par différents états décrits [ici](api-reference.md#formstatus).

- `DRAFT` (brouillon): État initial à la création d'un BSD. Des champs obligatoires peuvent manquer.
- `SEALED` (finalisé): BSD finalisé. Les données sont validées et un numéro de BSD `readableId` est affecté.
- `SENT` (envoyé): BSD en transit vers l'installation de destination, d'entreposage ou de reconditionnement
- `RECEIVED` (reçu): BSD reçu sur l'installation de destination, d'entreposage ou de reconditionnement
- `REFUSED` (refusé): Déchet refusé
- `PROCESSED` (traité): BSD dont l'opération de traitement a été effectué
- `NO_TRACEABILITY` (rupture de traçabilité): Rupture de traçabilité autorisée par arrêté préfectoral avec transfert de responsabilité.
- `AWAITING_GROUP`: BSD en attente de regroupement (code de traitement D 13, D 14, D 15, R 12, R 13)
- `GROUPED`: BSD qui a été ajouté à une annexe 2

Chaque changement d'état s'effectue grâce à une mutation.

| Mutation              | Transition                                                                                                                      | Données                                                                           | Permissions                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createForm`          | `-> DRAFT` <br />                                                                                                               | [FormInput](api-reference.md#forminput)                                           | <div><ul><li>émetteur</li><li>destinataire</li><li>transporteur</li><li>négociant</li><li>éco-organisme</li></ul></div>                                                                 |
| `updateForm`          | `DRAFT -> DRAFT` <br />    `SEALED -> SEALED` <br />                                                                                                       | [FormInput](api-reference.md#forminput)                                           | <div><ul><li>émetteur</li><li>destinataire</li><li>transporteur</li><li>négociant</li><li>éco-organisme</li></ul></div>                                                                 |
| `markAsSealed`        | `DRAFT -> SEALED`                                                                                                               |                                                                                   | <div><ul><li>émetteur</li><li>destinataire</li><li>transporteur</li><li>négociant</li><li>éco-organisme</li></ul></div>                                                                 |
| `signedByTransporter` | <div><ul><li>`SEALED -> SENT`</li><li>`RESEALED -> RESENT`</li></ul></div>                                                      | [TransporterSignatureFormInput](api-reference.md#s#transportersignatureforminput) | Uniquement le collecteur-transporteur, l'émetteur ou le site d'entreposage provisoire/reconditionnement étant authentifié grâce au code de signature présent en paramètre de la mutation |
| `markAsReceived`      | <div><ul><li>`SENT -> RECEIVED`</li><li>`SENT -> REFUSED`</li></ul></div>                                                       | [ReceivedFormInput](api-reference.md#receivedforminput)                           | Uniquement le destinataire du BSD                                                                                                                                                       |
| `markAsProcessed`     | <div><ul><li>`RECEIVED -> PROCESSED`</li><li>`RECEIVED -> NO_TRACEABILITY`</li><li>`RECEIVED -> AWAITING_GROUP`</li></ul></div> | [ProcessedFormInput](api-reference.md#processedforminput)                         | Uniquement le destinataire du BSD                                                                                                                                                       |
| `markAsTempStored`    | <div><ul><li>`SENT -> TEMP_STORED`</li><li>`SENT -> REFUSED`</li></ul></div>                                                    | [TempStoredFormInput](api-reference.md#tempstoredforminput)                       | Uniquement le site d'entreposage temporaire ou de reconditionnement                                                                                                                     |
| `markAsResealed`      | `TEMP_STORED -> RESEALED`                                                                                                       | [ResealedFormInput](api-reference.md#resealedtoredforminput)                      | Uniquement le site d'entreposage temporaire ou de reconditionnement                                                                                                                     |
| `importPaperForm` | `SEALED -> PROCESSED` | [ImportPaperFormInput](api-reference#importpaperforminput)| Uniquement l'entreprise de destination |

<script src="https://unpkg.com/mermaid@8.1.0/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true});</script>

Le diagramme ci dessous retrace le cycle de vie d'un BSD dans Trackdéchets:

<div class="mermaid">
graph TD
AO(NO STATE) -->|createForm| A
A -->|updateForm| A
B -->|updateForm| B
A[DRAFT] -->|markAsSealed| B(SEALED)
B -->|signedByTransporter| C(SENT)
B -->|importPaperForm| E(PROCESSED)
C -->|markAsReceived| D(ACCEPTED)
C -->|markAsReceived - sans signature| M(RECEIVED)
M -->|markAsAccepted| D
M -->|markAsReceived - avec refus| I
D -->|markAsProcessed| E(PROCESSED)
D -->|markAsProcessed - avec rupture de traçabalité |G(NO_TRACEABILITY)
D -->|markAsProcessed - avec opération de regroupement | F(AWAITING_GROUP)
C -->|markAsReceived - avec refus| I(REFUSED)
C -->|markAsTempStored - avec refus| I
F.->|createForm - appendix2Forms |A
F-->|Lors de la création d'un nouveau BSD avec annexe 2|H[GROUPED]
H-->|Lorsque markAsProcessed est appelé sur le BSD avec annexe 2|E
C -->|markAsTempStored - |J(TEMP_STORED)
C -->|markAsTempStored|N
J -->|markAsTempStorerAccepted - avec refus|I
J -->|markAsTempStorerAccepted|N(TEMP_STORER_ACCEPTED)
N -->|markAsResealed| K(RESEALED)
K -->|signedByTransporter| L(RESENT)
L --> D
</div>

## Exemples

Vous pouvez consulter [ce test d'intégration](https://github.com/MTES-MCT/trackdechets/blob/master/back/src/forms/workflow/__tests__/workflow.integration.ts) écrit en Node.js pour voir des exemples concrets d'utilisation de l'API pour différents cas d'usage (acheminement direct du producteur à l'installation de traitement, entreposage provisoire, multi-modal, etc)

## BSD au format pdf

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

## Flux de modifications de BSD

Il est possible d'accéder à un flux des modifications d'états qui ont eu lieu sur un BSD en particulier ou sur l'ensemble des BSD's liés à un établissement. En faisant des appels réguliers sur ce flux, il est possible d'implémenter des systèmes de notifications en quasi temps réel pour vos utilisateurs (par exemple lors du traitement d'un déchets).

Ce flux est accessible via la query `formsLifeCycle`. Pour plus d'informations se référer à la [référence de l'API](api-reference/#query)


## Import d'un BSD signé papier

L'installation de traitement a la possibilité d'importer un BSD signé papier dans Trackdéchet après l'étape de traitement final dans
le cas simple d'un acheminement direct du producteur à l’installation de traitement.
Cet import se fait via la mutation `importFormPaper`. Deux cas de figures se présentent:

* Le BSD est crée initialement dans Trackdéchet puis imprimé avant l'enlèvement par le transporteur. La signature du collecteur-transporteur en case 8
ainsi que les informations et signatures en case 9, 10 et 11 sont renseignées sur le bordereau papier. Après la phase de traitement finale, le BSD numérique
initial est mis à jour pour l'entreprise de destination en renseignant son `id` et les informations manquantes.

:::tip
Afin d'obtenir d'obtenir l'identifiant d'un bordereau numérique à partir du numéro *TD-xxx* apparaissant sur le bordereau papier, il suffit d'utiliser la query `form` en lui passant
le paramètre `{ readableId: "TD-XXX"}`
:::

* Le BSD initial n'a pas été émis via Trackdéchets et dispose d'un numéro qui lui est propre. Après la phase de traitement finale, le bordereau papier
est importé dans Trackdéchets en reportant l'ensemble des informations y apparaissant. Le numéro du BSD papier doit être renseigné grâce au champ `customId`.
Ce champ permettra de faire le lien entre le bordereau numérique et le bordereau papier.

Dans les deux cas ci-dessus, l'entreprise de traitement doit conserver l'original papier pendant toute la durée réglementaire.
