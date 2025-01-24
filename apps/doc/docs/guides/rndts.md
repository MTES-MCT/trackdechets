---
title: Ajouter des lignes au RNDTS
---

Les fonctionnalités du RNDTS sont désormais disponibles depuis l'application, Trackdéchets.
Il est possible d'injecter des données de registre de 2 manières:
- via import de fichier, sur l'interface Trackdéchets
- via API

C'est sur la deuxième option que nous nous concentrons dans ce guide.
Chaque typologie de registre bénéficie d'une mutation dédiée. On retrouve les typologies suivantes:
- SSD
- D(N)D entrant
- TEXS entrant
- D(N)D sortant
- TEXS sortant
- DD transporté ou collecté
- DD géré

Toutes les mutations de registre suivent un fonctionnement similaire. Seules les données attendues varient. Dans ce guide nous prendrons l'exemple des sorties de tatut de déchet (SSD).

## Principe généraux

Il est possible d'envoyer jusqu'à 1000 déclarations par appel API. C'est donc un tableau de déclaration qui est attendu par chaque endpoint. 
Chaque déclaration envoyée est traité séquentiellement et individuellement. En cas d'erreur sur une déclaration, les autres déclarations seront quand même traitées.
Si des erreurs sont rencontrées, un message d'erreur sera retourné pour chaque déclaration en erreur.

A noter qu'il est possible que certaines lignes soient automatiquement ignorées: si nous rencontrons une ligne qui a identifiant unique (`publicId`) déjà existant dans la base et que le motif (`reason`) est vide, nous ignorons la ligne. Attention donc à bien utiliser des identifiants uniques pour chaque ligne. Si jamais un identifiant venait à être réutilisé, il serait sinon possible que nous ignorions la ligne et ne remontions pas d'erreur.

## Droits utilisateurs

Un import de registre est fait pour le compte d'un établissement. Pour faire une déclaration pour cet établissement, deux possibilités:
- appartenir à l'établissement renseigné dans la colonne `reportForCompanySiret`
- que l'établissement renseigné dans la colonne `reportAsCompanySiret` ait une délégation pour l'établissement `reportForCompanySiret`, et appartenir à l'établissement `reportAsCompanySiret`

Si aucune de ces deux conditions n'est remplies, une erreur sera retournée.
