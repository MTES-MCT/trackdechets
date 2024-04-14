---
title: Identifiants
---

Les identifiants Trackdéchets ont des formats différents en fonction du type de déchets tracé :

- `BSD-YYYYMMDD-XXXXXXXXX` : Bordereau de suivi des déchets dangereux "générique" (CERFA n° 12571*01)
- `DASRI-YYYYMMDD-XXXXXXXXX` : Bordereau de suivi des déchets d'activités de soins à risque infectieux
- `FF-YYYYMMDD-XXXXXXXXX` : Bordereau de suivi de déchets fluides frigorigènes
- `VHU-YYYYMMDD-XXXXXXXXX` : Bordereau de suivi des véhicules hors d'usage
- `BSDA-YYYYMMDD-XXXXXXXXX` : Bordereau de suivi des déchets d'amiante

où `YYYYMMDD` correspond à la date du jour et `XXXXXXXXX` une chaine de caractère aléatoire.

:::note
Dans le cas du bordereau de suivi de déchets dangereux, deux identifiants sont exposés : un identifiant "opaque" `id` de la forme `ckqqe8vw67139753fru1giv885i` et un identifiant "lisible" `readableId` au format décrit ci-dessus.
Pour les autres types de bordereaux, seul l'identifiant dont le format est décrit ci-dessus est exposé dans le champ `id`.
:::