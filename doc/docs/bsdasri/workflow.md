---
title: Cycle de vie du BSDASRI
---

import Mermaid from '../../src/components/Mermaid';

*Avertissement: l'implémentation Dasri et cette documentation constituent une version Beta et sont destinées à l'évaluation des intégrateurs. L'api est suceptible d'évoluer*

## Numéro de DASRI

Chaque DASRI est associé à un identifiant lisible unique. Cet identifiant correspond au champ `id` et doit être utilisé lors des différentes requêtes. Cet identifiant apparait sur le bordereau dans la case "Bordereau n°". L'identifiant est sous la forme `DASRI-{YYYYMMDD}-{identifiant aléatoire}` (Ex: `"DASRI-20210118-RTAQRJA6P"`). Il peut être utiliser pour récupérer l'identifiant opaque unique via la query `bsdasri`.


## Concepts

Le mode opératoire diffère sensiblement de celui des BSDD.

le champ `id` stocke un champ lisible (équivalent du `readableId` du bsdd). Il n'y a donc pas de champ `readableId`.
Le `DRAFT` est sorti des statuts, c'est un boolean à part. Le passage par l'étape brouillon est facultatif.


Pour donner plus de flexibilité et limiter les mutations, les principes suivants sont adoptés:
- le nombre de mutations est reduit: createBsdasri/createDraftBsdasri, publishBsdasri,updateBsdasri, signBsdasri
- createDraftBsdasri crée un dasri dans l'état `INITIAL`, `isDraft=true`. Cette mutation est optionelle, on peut commencer avec `createBsdasri`
- createBsdasri crée un dasri dans l'état `INITIAL`, `isDraft=false`
- publishBsdasri passe le dasri de `isDraft=true` à `isDraft=false`
- la mutation updateBsdasri permet de mettre à jour les dasri pendant leur cycle de vie
- la mutation signBsdasri (EMISSION, TRANSPORT, RECPTION, OPERATION) appose une signature sur le cadre correspondant et verrouille les champs correspondants
- une fois qu'une signature est apposée, champs du cadre correspondant ne sont plus modifiables
- signBsdasri (EMISSION) verrouille tous les champs emitter/emission
- signBsdasri (TRANSPORT) verrouille tous les champs transporter/transport, sauf la date de remise à l'installation destinataire ({transport { handedOverAt}}
)
- signBsdasri (RECEPTION) verrouille tous les champs recipient, et les champ reception
- signBsdasri (OPERATION) verrouille les champ operation
- si le champ wasteAcceptation ({transport {wasteAcceptation}}) est REFUSED signBsdasri (TRANSPORT) passe le dasri à l'état REFUSED
- si le champ wasteAcceptation ({reception {wasteAcceptation}}) est REFUSED signBsdasri (RECEPTION) passe le dasri à l'état REFUSED


## États du DASRI

L'ensemble des champs du BSD numérique est décrit dans la [référence de l'API](../api-reference/bsdasri/objects#bsdasri). Au cours de son cycle de vie, un BSD numérique peut passer par différents états décrits [ici](../api-reference/bsdasri/enums#bsdasristatus).


- `INITIAL` (initial): C'est l'état dans lequel le dasri est créé. `readableId` est affecté.
- `SIGNED_BY_PRODUCER` (prêt à être emporté) : Dasri signé par l'émetteur
- `SENT` (envoyé): DASRI en transit vers l'installation de destination, d'entreposage ou de reconditionnement
- `RECEIVED` (reçu): DASRI reçu sur l'installation de destination, d'entreposage ou de reconditionnement
- `ACCEPTED` (accepté): DASRI accepté sur l'installation de destination, d'entreposage ou de reconditionnement
- `PROCESSED` (traité): DASRI dont l'opération de traitement a été effectué
- `REFUSED` (refusé): DASRI refusé, par le tranporteur ou le destinataire



Le diagramme ci dessous retrace le cycle de vie d'un DASRI dans Trackdéchets:

<Mermaid chart={`
graph TD
AO(NO STATE) -->|createDraftBsdasri| A
AO(NO STATE) -->|createBsdasri| B
A -->|"updateBsdasri (tous les champs)"| A
B -->|"updateBsdasri (tous les champs)"| B
C-->|"updateBsdasri (sauf champs signés)"| C
D-->|"updateBsdasri (sauf champs signés)"| D
E-->|"updateBsdasri (sauf champs signés)"| E
A["INITIAL (isDraft=true)"] -->|publishBsdasri| B("INITIAL (isDraft=false)")
B -->|"signBsdasri (EMISSION / EMISSION_WITH_SECRET_CODE)"| C(SIGNED_BY_PRODUCER)
B -->|"signBsdasri (TRANSPORT) - si autorisé par émetteur" | D(SENT)
C -->|"signBsdasri (TRANSPORT)"| D(SENT)
D -->|"signBsdasri (RECEPTION)"| E(RECEIVED)
E -->|"signBsdasri (OPERATION)"| F(PROCESSED)
D -->|"signBsdasri (TRANSPORT *)"| G(REFUSED)
C -->|"signBsdasri (RECEPTION *)"| G(REFUSED)
`}/>

 \* si champ wasteAcceptation correspondant  est REFUSED

