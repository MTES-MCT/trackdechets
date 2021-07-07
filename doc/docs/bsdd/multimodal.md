---
title: Transport multi-modal
---

## Multimodal

Lors d'un transport multimodal simple, un bordereau est transmis sans scission ni regroupement d'un transporteur à un autre, du producteur jusqu'à un site de traitement. Après le premier transporteur, les tronçons suivants sont appelés segments. Il peut y avoir autant de segments que nécessaire.
Le pdf est mis à jour au fur et mesure de la prise en charge du déchet sur les différents segments.

## Préparation d'un nouveau segment

Dès qu'un transporteur (transporteur 1) à signé l'enlèvement d'un déchet auprès d'un producteur, il peut préparer le segment suivant afin de transmettre le déchet et son bordereau à un autre transporteur (transporteur 2).
La mutation *prepareSegment* est dédiée à cette étape. Le nouveau segment est créé en mode brouillon. Pour un maximum de  souplesse, seul le siret du nouveau transporteur est requis.
Le transporteur peut modifier le segment qu'il vient de créer.

## Marquer le segment comme prêt à être transmis

Dès que le transporteur (transporteur 1) est prêt à transférer son déchet et bordereau, il marque le bordereau grâce à la mutation *markSegmentAsReadyToTakeOver*. Le transporteur suivant (transporteur 2) peut alors le compléter ou le prendre en charge. Le transporteur 1 ne peut plus modifier le segment.

## Prise en charge du déchet

Le transporteur 2 peut alors prendre en charge le déchet grâce à la mutation *takeOverSegment*, qui vaudra pour signature et lui transfère la responsabilité du déchet. Pour cette mutation, certains champs du segments sont obligatoires et devront être renseignés.

## Modification d'un segment

Tant que le segment est en mode brouillon, le transporteur 1 peut le modifier ( tous les champs)
Dès qu'un segment est marqué comme prêt à être transmis, c'est le transporteur 2 qui peut l'éditer(hormis info entreprises, siret etc.)
La modification s'effectue grâce à la mutation *editSegment*.