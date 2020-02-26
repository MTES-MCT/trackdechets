# Changelog

Les changements importants de Trackdéchets sont documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et le projet suit un schéma de versionning inspiré de [Calendar Versioning](https://calver.org/).

# [Next] 

* Renommage des colonnes du tableau de bord et des onglets du formulaire de création de bordereau pour d'avantage de clarté [PR #195] (https://github.com/MTES-MCT/trackdechets/pull/195)
 
# [2020.02.1] 18/02/2020

* Amélioration du refus du déchet pour gérer le refus partiel et les motifs de refus éventuels [PR #155](https://github.com/MTES-MCT/trackdechets/pull/155)
  * L'amélioration s'accompagne d'un changement pour la mutation `markAsReceived`. Celle ci nécessitait jusque là les champs : `isAccepted` , `receivedBy`, `receivedAt`, `quantityReceived`
  * Le champ booléen isAccepted n'est plus utilisé, il est remplacé par le champ `wasteAcceptationStatus` de type enum qui peut prendre les valeurs (`ACCEPTED`, `REFUSED`, `PARTIALLY_REFUSED`)
  * Les valeurs `true`/`false` ont été migrées en ACCEPTED/REFUSED
* Modification du traitement du déchet [PR #162](https://github.com/MTES-MCT/trackdechets/pull/162)
  * Tous les champs du cadre 12 du BSD sont désormais renseignables
  * Les champs `nextDestinationDetails` & `nextDestinationProcessingOperation` disparaissent
  * Ils sont remplacés par `nextDestination`, constitué de `processingOperation` et `company`
* Amélioration de la gestion des actions sur les bordereaux depuis l'interface Trackdéchets: on ne peut faire des actions que pour le SIRET actif dans le sélecteur. [PR #164](https://github.com/MTES-MCT/trackdechets/pull/164)
* Modification du mode de téléchargement des fichiers (bsd pdf et registre): les routes `/pdf` et `/export` sont remplacées respectivement par les requêtes GraphQL suivantes: `Query { formPdf }` et `Query { formsRegister }`. Chaque endpoint renvoie un jeton de téléchargement qui permet ensuite de faire une requête sur `/download?token=...`. Le token a une durée de vie de 10s. [PR #144](https://github.com/MTES-MCT/trackdechets/pull/144)
* Refonte de l'authentification. Les tokens générés pour s'authentifier à l'API sont stockés en base et deviennent révocables par l'utilisateur. Ils ont désormais une longueur de 40 caractères alphanumériques (les anciens tokens avaient une longueur de 155 caractères et pouvaient contenir des caractères de ponctuation). Les anciens tokens restent cependant valides. L'UI Trackdéchets utilise désormais un stockage en session. [PR #151](https://github.com/MTES-MCT/trackdechets/pull/151)
* Modification du format des numéros de téléphone dans Mon Compte. Il est désormais possible d'ajouter des numéros en 09 xx xx xx xx [PR #74](https://github.com/MTES-MCT/trackdechets/pull/174).

# [2020.01.4] 30/01/2020

* Scission inscription utilisateur et création de l'entreprise rattachée [PR #139](https://github.com/MTES-MCT/trackdechets/pull/139)
* Mise à jour logos partenaires [PR #153](https://github.com/MTES-MCT/trackdechets/pull/153)
* Correctifs de stabilité [PR #152](https://github.com/MTES-MCT/trackdechets/pull/152), [PR #150](https://github.com/MTES-MCT/trackdechets/pull/150), [PR #157](https://github.com/MTES-MCT/trackdechets/pull/157)
* Lien vers faq externe [PR #158](https://github.com/MTES-MCT/trackdechets/pull/158)

# [2020.01.3] 26/01/2020

* Ajout de la possibilité de déclarer une rupture de tracabilité au traitement d'un déchet [PR #129](https://github.com/MTES-MCT/trackdechets/pull/129)
* Ajout de liens dans le footer: statistiques, boite à outils communication ,forum technique, statut des applications
* Notification email à tous les membres d'un établissement lors du renouvellement du code de sécurité
* Renvoi et suppression d'invitations en attente [PR #132](https://github.com/MTES-MCT/trackdechets/pull/132) et [PR #137](https://github.com/MTES-MCT/trackdechets/pull/137)
* Corrections de rendu pdf [PR #135](https://github.com/MTES-MCT/trackdechets/pull/135)

## [2020.01.2] 10/01/2020

* Ajout d'un logo partenaire
* Amélioration graphique des infobulles
* Activation du playground en production

## [2020.01.1] 08/01/2020

* Mise en page de healthchecks compatibles avec une page de statut [PR #111](https://github.com/MTES-MCT/trackdechets/pull/111)

* Ajout d'un nom usuel pour les établissements [PR #112](https://github.com/MTES-MCT/trackdechets/pull/112)

* Évolution du compte client [PR #106](https://github.com/MTES-MCT/trackdechets/pull/106)
  * Amélioration de l'UX
  * Possibilité d'éditer l'identifiant GEREP d'un établissement
  * Possibilité pour un admin de renouveller le code de sécurité d'un établissement
  * Possibilité d'éditer les informations de contact de la fiche entreprise
  * Correction d'un bug permettant d'inviter plusieurs fois le même utilisateur


## [2019.12.1] 18/12/2019
* Corrections d'UI [PR #99](https://github.com/MTES-MCT/trackdechets/pull/99)
* Renforcement des contrôles d'accès et permissions [PR #95](https://github.com/MTES-MCT/trackdechets/pull/95) et [PR #92](https://github.com/MTES-MCT/trackdechets/pull/92)
* Affichage des sirets dans les mails d'invitation [PR #96](https://github.com/MTES-MCT/trackdechets/pull/95) et [PR #92](https://github.com/MTES-MCT/trackdechets/pull/96)

## [2019.11.3] 28/11/2019
* Ajout d'un numéro de bordereau libre

## [2019.11.2] 21/11/2019
* Mise à jour du service de génération de pdf pour se rapprocher du Cerfa officiel
* Relooking de la barre de navigation. Déplacement de "Mon Compte" au même niveau que "Mon espace".
* Ajout du SIRET en plus du nom dans le sélecteur d'entreprise [PR #80](https://github.com/MTES-MCT/trackdechets/pull/80)


## [2019.11.1] 06/11/2019

* Rattachment du profil TD à l'entreprise (https://github.com/MTES-MCT/trackdechets/pull/57)
* Amélioration de la documentation (https://github.com/MTES-MCT/trackdechets/pull/58)
* Notification des DREALs en cas de refus de déchets (https://github.com/MTES-MCT/trackdechets/pull/56)
* Gestion de l'exemption de récépissé (https://github.com/MTES-MCT/trackdechets/pull/41)
* Amélioration de l'affichage des statistiques (https://github.com/MTES-MCT/trackdechets/pull/38)
* Amélioration de la page d'inscription (https://github.com/MTES-MCT/trackdechets/pull/52)
* Affichage d'erreurs plus explicites (https://github.com/MTES-MCT/trackdechets/pull/50)
* Automatisation d'envoi d'emails d'onboarding (https://github.com/MTES-MCT/trackdechets/pull/48)

