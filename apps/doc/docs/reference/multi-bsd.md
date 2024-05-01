---
title: Différences entre les bordereaux
---

Le mode opératoire de l'API pour les bordereaux DASRI, amiante, VHU et Fluides Frigorigènes diffère sensiblement de celui pour le BSDD.

Le champ `id` stocke un champ lisible (équivalent du `readableId` du bsdd). Il n'y a donc pas de champ `readableId`.
Le `DRAFT` est sorti des statuts, c'est un boolean à part. Le passage par l'étape brouillon est facultatif.

Pour donner plus de flexibilité et limiter les mutations, les principes suivants sont adoptés :
- le nombre de mutations est reduit : `create/createDraft`, `publish`, `update`, `sign`
- `createDraft` crée un bordereau dans l'état `INITIAL`, `isDraft=true`. Cette mutation est optionelle, on peut commencer avec `create`
- `create` crée un bordereau dans l'état `INITIAL`, `isDraft=false`
- `publish` passe le bordereau de `isDraft=true` à `isDraft=false`
- la mutation `update` permet de mettre à jour le bordereau pendant son cycle de vie
- la mutation `sign` (EMISSION, TRANSPORT, RECEPTION, OPERATION) appose une signature sur le cadre correspondant et verrouille les champs correspondants
- une fois qu'une signature est apposée, les champs du cadre correspondant ne sont plus modifiables
