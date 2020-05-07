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
| Transport multi-modal (case 20-21)                                                                                         | Planifié |

Pour plus d'informations sur le calendrier de déploiement des fonctionnalités, vous pouvez consulter notre [roadmap produit](https://trello.com/b/2pkc7bFg/trackd%C3%A9chets-roadmap-produit)

## Numéro de BSD

Chaque BSD est associé à un identifiant opaque unique. Cette identifiant correspond au champ `id` et doit être utilisé lors des différentes requêtes. En plus de l'identifiant opaque, un identifiant "lisible" est généré (champ `readableId`). Cet identifiant apparait sur le bordereau dans la case "Bordereau n°". L'identifiant est sous la forme `TD-{année}-{identifiant}` (Ex: `TD-20-AAA00136`). Vous pouvez également ajouter un identifiant qui vous est propre pour faire le lien avec votre SI. Il vous faut pour cela utiliser le champ `customId`.

## États du BSD

L'ensemble des champs du BSD numérique est décrit dans la [référence de l'API](api-reference.md#form). Au cours de son cycle de vie, un BSD numérique peut passer par différents états décrits [ici](api-reference.md#formstatus).

- `DRAFT` (brouillon): État initial à la création d'un BSD. Des champs obligatoires peuvent manquer.
- `SEALED` (finalisé): BSD finalisé ou "scellé". Les informations ne sont plus modifiables.
- `SENT` (envoyé): BSD en transit vers l'installation de destination, d'entreposage ou de reconditionnement
- `RECEIVED` (reçu): BSD reçu sur l'installation de destination, d'entreposage ou de reconditionnement
- `REFUSED` (refusé): Déchet refusé
- `PROCESSED` (traité): BSD dont l'opération de traitement a été effectué
- `NO_TRACEABILITY` (rupture de traçabilité): Rupture de traçabilité autorisée par arrêté préfectoral avec transfert de responsabilité.
- `AWAITING_GROUP`: BSD en attente de regroupement (code de traitement D 13, D 14, D 15, R 13)
- `GROUPED`: BSD qui a été ajouté à une annexe 2

Chaque changement d'état s'effectue grâce à une mutation.

| Mutation              | Transition                                                                                       | Données                                                                           | Permissions                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `saveForm`            | `-> DRAFT` <br />                                                                                | [FormInput](api-reference.md#forminput)                                           | N'importe quel utilisateur connecté                                 |
| `markAsSealed`        | `DRAFT -> SEALED`                                                                                |                                                                                   | L'émetteur ou le destinataire du BSD                                |
| `markAsSent`          | `SEALED -> SENT`                                                                                 | [SentFormInput](api-reference.md#sentforminput)                                   | Uniquement l'émetteur du BSD                                        |
| `signedByTransporter` | `SEALED -> SENT` <br/> `RESEALED -> RESEALED`                                                    | [TransporterSignatureFormInput](api-reference.md#s#transportersignatureforminput) | Uniquement le transporteur                                          |
| `markAsReceived`      | `SENT -> RECEIVED` <br/> `SENT -> REFUSED`                                                       | [ReceivedFormInput](api-reference.md#receivedforminput)                           | Uniquement le destinataire du BSD                                   |
| `markAsProcessed`     | `RECEIVED -> PROCESSED` <br /> `RECEIVED -> NO_TRACEABILITY` <br /> `RECEIVED -> AWAITING_GROUP` | [ProcessedFormInput](api-reference.md#processedforminput)                         | Uniquement le destinataire du BSD                                   |
| `markAsTempStored`    | `SENT -> TEMP_STORED` <br/> `SENT -> REFUSED`                                                    | [TempStoredFormInput](api-reference.md#tempstoredforminput)                       | Uniquement le site d'entreposage temporaire ou de reconditionnement |
| `markAsResealed`      | `TEMP_STORED -> RESEALED`                                                                        | [ResealedFormInput](api-reference.md#resealedtoredforminput)                      | Uniquement le site d'entreposage temporaire ou de reconditionnement |
| `markAsResent`        | `RESEALED -> RESENT`                                                                             | [ResentFormInput](api-reference.md#resenttoredforminput)                          | Uniquement le site d'entreposage temporaire ou de reconditionnement |

<script src="https://unpkg.com/mermaid@8.0.0/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true});</script>

Le diagramme ci dessous retrace le cycle de vie d'un BSD dans Trackdéchets:

<div class="mermaid">
graph TD
A[DRAFT] -->|Optionnel| B(SEALED)
B --> |Par l'émetteur| C(SENT)
A --> |Par l'émetteur| C
C -->|Par le receveur| D(RECEIVED)
D -- Cas classique -->E(PROCESSED)
D -- Regroupement et perte de traçabilite -->G(NO_TRACEABILITY)
D -- Regroupement -->F(AWAITING_GROUP)
C -- Refus de déchets --> I(REFUSED)
F-. Rempli une annexe2 .->A
F-. Rempli une annexe2 .->A
F-. Rempli une annexe2 .->A
F--Fait partie d'une annexe2 -->H[GROUPED]
H--BSD avec annexe devient Processed -->E
C -- Par le site provisoire / BSD suite -->J(TEMP_STORED)
J -- Optionnel via API --> K(RESEALED)
J --> L
K -- Entreposage terminé --> L(RESENT)
L --> D
</div>

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
