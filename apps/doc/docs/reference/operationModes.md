---
title: Hiérarchie des modes de traitement
---

La réglementation registre impose de connaitre le mode de traitement au regard de la hiérarchie des modes de traitement qui sont :
- La réutilisation
- Le recyclage et les autres formes de valorisation de la matière
- La valorisation énergétique
- L’élimination (incinération sans valorisation énergétique et stockage en décharge)

Les BSDs ont donc un champ qui permet de renseigner le mode de traitement choisi :
- BSDD, BSDA, BSDASRI, BSVHU : `destinationOperationMode`
- BSFF : `packaging.operationMode`

Les modes de traitement dépendent directement du code de traitement sélectionné. Voici les correspondances possibles :
- D1, D2, D3, D4, D5, D6, D7, D8, D9F, D10, D11, D12 : Elimination
- R0 : Réutilisation
- R1 : Valorisation énergétique
- R2, R3, R4, R5, R7, R9, R11 : Réutilisation ou recyclage
- R6, R8, R10 : Recyclage
- D9, D13, D14, D15, R12, R13 : Aucun mode possible
