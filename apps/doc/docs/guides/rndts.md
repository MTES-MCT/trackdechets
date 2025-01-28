---
title: Ajouter des déclarations au RNDTS
---

Les fonctionnalités du RNDTS sont désormais disponibles depuis l'application Trackdéchets.
Il est possible d'injecter des données au registre de 2 manières:
- via import de fichier, sur l'interface Trackdéchets
- via API

C'est sur la deuxième option que nous nous concentrons dans ce guide.
Chaque typologie de registre bénéficie d'une mutation dédiée. On retrouve les typologies suivantes:
- SSD : `addToSsdRegistry`
- D(N)D entrant : `addToIncomingWasteRegistry`
- TEXS entrant : `addToIncomingTexsRegistry`
- D(N)D sortant : `addToOutgoingWasteRegistry`
- TEXS sortant : `addToOutgoingTexsRegistry`
- DD transporté ou collecté : `addToTransportedWasteRegistry`
- DD géré : `addToManagedWasteRegistry`

Toutes les mutations de registre suivent un fonctionnement similaire. Seules les données attendues varient.

## Principe généraux

Il est possible d'envoyer jusqu'à 1000 déclarations par appel API. C'est donc un tableau de déclarations qui est attendu par chaque endpoint. 
Chaque déclaration envoyée est traité séquentiellement et individuellement. En cas d'erreur rencontrée sur une déclaration, les déclarations suivantes continueront à être traitées.
A la fin du traitement de l'ensemble des déclarations, si des erreurs ont été rencontrées, l'API retournera un message d'erreur détillé pour chaque déclaration en erreur.

A noter qu'il est possible que certaines lignes soient automatiquement ignorées lors du traitement: si nous rencontrons une ligne qui a identifiant unique (`publicId`) déjà existant dans la base et que le motif (`reason`) est vide, nous ignorons la ligne.
Attention donc à bien utiliser des identifiants uniques pour chaque ligne. Si jamais un identifiant venait à être réutilisé, la ligne serait tout simplement ignorée et aucune erreur ne serait remontée.

## Droits utilisateurs

Un import de registre est fait pour le compte d'un établissement. Pour faire une déclaration pour cet établissement il existe deux possibilités:
- appartenir à l'établissement renseigné dans la colonne `reportForCompanySiret`
- appartenir à l'établissement renseigné dans la colonne `reportAsCompanySiret` et que cet établissement ait une délégation pour l'établissement renseigné dans la colonne `reportForCompanySiret`

Si aucune de ces deux conditions n'est remplie, une erreur sera retournée.
