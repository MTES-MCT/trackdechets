# Changelog

Les changements importants de Trackdéchets sont documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et le projet suit un schéma de versionning inspiré de [Calendar Versioning](https://calver.org/).

# Unreleased

- Ajout d'une limitation de 1000 requêtes possible par une même adresse IP dans une fenêtre de 1 minute, [PR 407](https://github.com/MTES-MCT/trackdechets/pull/407)
- Amélioration de la machine à état permettant de calculer les états possibles du BSD [PR 411](https://github.com/MTES-MCT/trackdechets/pull/411)
- Ajout de la possibilité de pouvoir importer un BSD papier signé, [PR 404](https://github.com/MTES-MCT/trackdechets/pull/404)

# [2020.09.1] 28/09/2020

- Changements autour du code ONU : il est requis pour les déchets dangereux mais pas pour les non-dangereux, [PR 393](https://github.com/MTES-MCT/trackdechets/pull/393)
- Possibilité de renseigner une entreprise à l'étranger en case 12, [PR 377](https://github.com/MTES-MCT/trackdechets/pull/377)
- Correction d'un bug lors d'invitations successives d'un utilisateur à plusieurs établissements, [PR 406](https://github.com/MTES-MCT/trackdechets/pull/406)
- Amélioration de la couche de permissions et de validation, [PR 384](https://github.com/MTES-MCT/trackdechets/pull/384)
- Amélioration de la validation des données du BSD, [PR 401](https://github.com/MTES-MCT/trackdechets/pull/401)

# [2020.08.1] 25/08/2020

- Redesign de la landing page (trackdechets.beta.gouv.fr) et changement de domaine pour l'application (app.trackdechets.beta.gouv.fr), [PR 369](https://github.com/MTES-MCT/trackdechets/pull/369)

# [2020.08.1] 19/08/2020

- Dépréciation des mutations "markAsSent" et "markAsResent", [PR 372](https://github.com/MTES-MCT/trackdechets/pull/372)
- Autocomplétion de la description de l'opération de traitement lorsque non-fournie dans l'API, [PR 353](https://github.com/MTES-MCT/trackdechets/pull/353) [PR 375](https://github.com/MTES-MCT/trackdechets/pull/375)
- Amélioration de l'export registre, [PR 328](https://github.com/MTES-MCT/trackdechets/pull/328)
- Amélioration de l'expérience d'utilisation de l'interface, [PR 333](https://github.com/MTES-MCT/trackdechets/pull/333)
- Stabilisation de l'API SIRENE, [PR 360](https://github.com/MTES-MCT/trackdechets/pull/360)
- Correction de la validation du code déchet dans le bordereau, [PR 370](https://github.com/MTES-MCT/trackdechets/pull/370)
- Mise à jour de la documentation du cycle de vie du BSD, [PR 372](https://github.com/MTES-MCT/trackdechets/pull/372)
- Masquage des queries / mutations à usage interne, [PR 368](https://github.com/MTES-MCT/trackdechets/pull/368)
- Suppression du paramètre "type" dans la query forms, [PR 374](https://github.com/MTES-MCT/trackdechets/pull/374)
- Ajout du paramètre "readableId" dans la query form, [PR 364](https://github.com/MTES-MCT/trackdechets/pull/364)
- Correction du destinataire lors d'un entreposage provisoire sur le pdf, [PR 326](https://github.com/MTES-MCT/trackdechets/pull/326)
- Report des informations déchets sur l'interface lors d'un entreposage provisoire, [PR 327](https://github.com/MTES-MCT/trackdechets/pull/327)
- Correction du lien vers la liste des installations classées, [PR 379](https://github.com/MTES-MCT/trackdechets/pull/379)
- Correction de la query "stateSummary" dans certains cas, [PR 378](https://github.com/MTES-MCT/trackdechets/pull/378)
- Correction de la normalisation des adresses emails, [PR 334](https://github.com/MTES-MCT/trackdechets/pull/334)
- Correction de la génération du PDF dans le cas d'un entreposage provisoire, [PR 376](https://github.com/MTES-MCT/trackdechets/pull/376)

# [2020.07.1] 15/07/2020

- Multimodal [PR 317](https://github.com/MTES-MCT/trackdechets/pull/317), [PR 337](https://github.com/MTES-MCT/trackdechets/pull/337), [PR 339](https://github.com/MTES-MCT/trackdechets/pull/339), [PR 356](https://github.com/MTES-MCT/trackdechets/pull/356)
- Pop up lors de la finalisation d'un BSD [PR 323](https://github.com/MTES-MCT/trackdechets/pull/323)
- Mise à jour du README [PR 330](https://github.com/MTES-MCT/trackdechets/pull/330)
- Ajout du logo Marianne [PR 347](https://github.com/MTES-MCT/trackdechets/pull/347)
- Modification du wording "Operation de traitement" [PR 315](https://github.com/MTES-MCT/trackdechets/pull/315)
- Correction d'une erreur d'affichage du dashboard suite à changement d'URL [PR 351](https://github.com/MTES-MCT/trackdechets/pull/351)
- Correction d'une erreur d'affichage des rôles dans le tableau de gestion des membres [PR 336](https://github.com/MTES-MCT/trackdechets/pull/336)
- Correction du label "Date de traitement" au moment de la signature destinataire [PR 332](https://github.com/MTES-MCT/trackdechets/pull/332)
- Documentation de la query `companyInfos` [PR 335](https://github.com/MTES-MCT/trackdechets/pull/335)

# [2020.06.2] 05/06/2020

- Bugfixes [PR 319](https://github.com/MTES-MCT/trackdechets/pull/319), [PR 318](https://github.com/MTES-MCT/trackdechets/pull/318), [PR 314](https://github.com/MTES-MCT/trackdechets/pull/314), [PR 313](https://github.com/MTES-MCT/trackdechets/pull/313)

# [2020.06.1] 03/06/2020

- Ajout logos partenaires [PR 294](https://github.com/MTES-MCT/trackdechets/pull/294)
- Evolution de la requête forms [PR 297](https://github.com/MTES-MCT/trackdechets/pull/297)
- Corrections de bugs [PR 291](https://github.com/MTES-MCT/trackdechets/pull/291), [PR 295](https://github.com/MTES-MCT/trackdechets/pull/295), [PR 300](https://github.com/MTES-MCT/trackdechets/pull/300), [PR 301](https://github.com/MTES-MCT/trackdechets/pull/301), [PR 307](https://github.com/MTES-MCT/trackdechets/pull/307),[PR 292](https://github.com/MTES-MCT/trackdechets/pull/292)
- Tests et améliorations techniques [PR 295](https://github.com/MTES-MCT/trackdechets/pull/295) , [PR 296](https://github.com/MTES-MCT/trackdechets/pull/296), [PR 308](https://github.com/MTES-MCT/trackdechets/pull/308), [PR 309](https://github.com/MTES-MCT/trackdechets/pull/309), [PR 299](https://github.com/MTES-MCT/trackdechets/pull/299), [PR 293](https://github.com/MTES-MCT/trackdechets/pull/293), [PR 284](https://github.com/MTES-MCT/trackdechets/pull/284), [PR 286](https://github.com/MTES-MCT/trackdechets/pull/286)
- Permissions écoorganismes [PR 287](https://github.com/MTES-MCT/trackdechets/pull/287), [PR 288](https://github.com/MTES-MCT/trackdechets/pull/288)

# [2020.05.1] 07/05/2020

- Ajout logos partenaires [PR 277](https://github.com/MTES-MCT/trackdechets/pull/277)
- Amélioration délivrabilité des emails [PR 260](https://github.com/MTES-MCT/trackdechets/pull/260)
- Correction eco-organismes [PR 266](https://github.com/MTES-MCT/trackdechets/pull/266) & [PR 280](https://github.com/MTES-MCT/trackdechets/pull/280)
- Correction validation des dates [PR 267](https://github.com/MTES-MCT/trackdechets/pull/267)
- BSD suite - pdf [PR 263](https://github.com/MTES-MCT/trackdechets/pull/260), corrections [271](https://github.com/MTES-MCT/trackdechets/pull/271), [282](https://github.com/MTES-MCT/trackdechets/pull/282), [285](https://github.com/MTES-MCT/trackdechets/pull/285)
- Corrections annexe2 [276](https://github.com/MTES-MCT/trackdechets/pull/276)
- Améliorations techniques [283](https://github.com/MTES-MCT/trackdechets/pull/283), [279](https://github.com/MTES-MCT/trackdechets/pull/279), [275](https://github.com/MTES-MCT/trackdechets/pull/275), [272](https://github.com/MTES-MCT/trackdechets/pull/272), [281](https://github.com/MTES-MCT/trackdechets/pull/281), [264](https://github.com/MTES-MCT/trackdechets/pull/264), [265](https://github.com/MTES-MCT/trackdechets/pull/265)

# [2020.04.1] 2/04/2020

- Mise en place espace développeurs [PR 225](https://github.com/MTES-MCT/trackdechets/pull/225)
- Amélioration page transporteur [PR 242](https://github.com/MTES-MCT/trackdechets/pull/242)
- Mise à jour page partenaires [PR 249](https://github.com/MTES-MCT/trackdechets/pull/249)
- Correction réception des bordereaux avec annexes 2 [PR 248](https://github.com/MTES-MCT/trackdechets/pull/248)
- Corrections pdf [PR 241](https://github.com/MTES-MCT/trackdechets/pull/241)

# [2020.03.5] 26/03/2020

- Mise à jour de la documentation [PR 224](https://github.com/MTES-MCT/trackdechets/pull/224)
- Intégration des éco-organismes [PR 212](https://github.com/MTES-MCT/trackdechets/pull/212)
- Génération pdf annexe 2 [PR 220](https://github.com/MTES-MCT/trackdechets/pull/220)
- Bugfixes et correctifs

# [2020.03.4] 12/03/2020

- Correction - Génération des messages d'erreurs sur la mutation markAsSealed

# [2020.03.3] 11/03/2020

- Correction - Ajout de la variable SESSION_NAME permettant de définir le nom du cookie de session

# [2020.03.2] 10/03/2020

- Affichage d'un filigrane sur les pdf de test [PR 211](https://github.com/MTES-MCT/trackdechets/pull/211)
- Correction de la génération des cookies de sessions [PR 213](https://github.com/MTES-MCT/trackdechets/pull/213)
- Correction du label de la recherche d'adresse du site de chantier [PR 214](https://github.com/MTES-MCT/trackdechets/pull/214)
- Mise à jour de la documentation de l'API suite aux changements de l'adresse chantier [PR 209](https://github.com/MTES-MCT/trackdechets/pull/209)

# [2020.03.1] 03/03/2020

- Implémentation du protocole OAuth2 permettant la récupération de jeton d'accès par des applications tierces sans exposer le mot de passe de l'utilisateur [PR #169](https://github.com/MTES-MCT/trackdechets/pull/169)
- Ajout d'une requête GraphQL `formsLifeCycle` permettant d'accéder au flux de modifications de BSD's [PR #170](https://github.com/MTES-MCT/trackdechets/pull/170)
- Corrections du moteur pdf [PR # 194](https://github.com/MTES-MCT/trackdechets/pull/194)
  - affichage et formatage des champs `sentBy` et `processedAt`
- Améliorations de la documentaion de l'api dans le playground [PR 187](https://github.com/MTES-MCT/trackdechets/pull/187)
- Renommage des colonnes du tableau de bord et des onglets du formulaire de création de bordereau pour d'avantage de clarté [PR #195](https://github.com/MTES-MCT/trackdechets/pull/195)
- Refonte des colonnes d'actions du dashboard et de leurs icones [PR 198](https://github.com/MTES-MCT/trackdechets/pull/198)
- Corrections des permissions de la mutation markAsSealed [PR 192](https://github.com/MTES-MCT/trackdechets/pull/192)
- Corrections et amélioration de la gestion des erreurs et de leur affichage [PR 197](https://github.com/MTES-MCT/trackdechets/pull/197)

# [2020.02.1] 18/02/2020

- Amélioration du refus du déchet pour gérer le refus partiel et les motifs de refus éventuels [PR #155](https://github.com/MTES-MCT/trackdechets/pull/155)
  - L'amélioration s'accompagne d'un changement pour la mutation `markAsReceived`. Celle ci nécessitait jusque là les champs : `isAccepted` , `receivedBy`, `receivedAt`, `quantityReceived`
  - Le champ booléen isAccepted n'est plus utilisé, il est remplacé par le champ `wasteAcceptationStatus` de type enum qui peut prendre les valeurs (`ACCEPTED`, `REFUSED`, `PARTIALLY_REFUSED`)
  - Les valeurs `true`/`false` ont été migrées en ACCEPTED/REFUSED
- Modification du traitement du déchet [PR #162](https://github.com/MTES-MCT/trackdechets/pull/162)
  - Tous les champs du cadre 12 du BSD sont désormais renseignables
  - Les champs `nextDestinationDetails` & `nextDestinationProcessingOperation` disparaissent
  - Ils sont remplacés par `nextDestination`, constitué de `processingOperation` et `company`
- Amélioration de la gestion des actions sur les bordereaux depuis l'interface Trackdéchets: on ne peut faire des actions que pour le SIRET actif dans le sélecteur. [PR #164](https://github.com/MTES-MCT/trackdechets/pull/164)
- Modification du mode de téléchargement des fichiers (bsd pdf et registre): les routes `/pdf` et `/export` sont remplacées respectivement par les requêtes GraphQL suivantes: `Query { formPdf }` et `Query { formsRegister }`. Chaque endpoint renvoie un jeton de téléchargement qui permet ensuite de faire une requête sur `/download?token=...`. Le token a une durée de vie de 10s. [PR #144](https://github.com/MTES-MCT/trackdechets/pull/144)
- Refonte de l'authentification. Les tokens générés pour s'authentifier à l'API sont stockés en base et deviennent révocables par l'utilisateur. Ils ont désormais une longueur de 40 caractères alphanumériques (les anciens tokens avaient une longueur de 155 caractères et pouvaient contenir des caractères de ponctuation). Les anciens tokens restent cependant valides. L'UI Trackdéchets utilise désormais un stockage en session. [PR #151](https://github.com/MTES-MCT/trackdechets/pull/151)
- Modification du format des numéros de téléphone dans Mon Compte. Il est désormais possible d'ajouter des numéros en 09 xx xx xx xx [PR #74](https://github.com/MTES-MCT/trackdechets/pull/174).

# [2020.01.4] 30/01/2020

- Scission inscription utilisateur et création de l'entreprise rattachée [PR #139](https://github.com/MTES-MCT/trackdechets/pull/139)
- Mise à jour logos partenaires [PR #153](https://github.com/MTES-MCT/trackdechets/pull/153)
- Correctifs de stabilité [PR #152](https://github.com/MTES-MCT/trackdechets/pull/152), [PR #150](https://github.com/MTES-MCT/trackdechets/pull/150), [PR #157](https://github.com/MTES-MCT/trackdechets/pull/157)
- Lien vers faq externe [PR #158](https://github.com/MTES-MCT/trackdechets/pull/158)

# [2020.01.3] 26/01/2020

- Ajout de la possibilité de déclarer une rupture de tracabilité au traitement d'un déchet [PR #129](https://github.com/MTES-MCT/trackdechets/pull/129)
- Ajout de liens dans le footer: statistiques, boite à outils communication ,forum technique, statut des applications
- Notification email à tous les membres d'un établissement lors du renouvellement du code de sécurité
- Renvoi et suppression d'invitations en attente [PR #132](https://github.com/MTES-MCT/trackdechets/pull/132) et [PR #137](https://github.com/MTES-MCT/trackdechets/pull/137)
- Corrections de rendu pdf [PR #135](https://github.com/MTES-MCT/trackdechets/pull/135)

## [2020.01.2] 10/01/2020

- Ajout d'un logo partenaire
- Amélioration graphique des infobulles
- Activation du playground en production

## [2020.01.1] 08/01/2020

- Mise en page de healthchecks compatibles avec une page de statut [PR #111](https://github.com/MTES-MCT/trackdechets/pull/111)

- Ajout d'un nom usuel pour les établissements [PR #112](https://github.com/MTES-MCT/trackdechets/pull/112)

- Évolution du compte client [PR #106](https://github.com/MTES-MCT/trackdechets/pull/106)
  - Amélioration de l'UX
  - Possibilité d'éditer l'identifiant GEREP d'un établissement
  - Possibilité pour un admin de renouveller le code de sécurité d'un établissement
  - Possibilité d'éditer les informations de contact de la fiche entreprise
  - Correction d'un bug permettant d'inviter plusieurs fois le même utilisateur

## [2019.12.1] 18/12/2019

- Corrections d'UI [PR #99](https://github.com/MTES-MCT/trackdechets/pull/99)
- Renforcement des contrôles d'accès et permissions [PR #95](https://github.com/MTES-MCT/trackdechets/pull/95) et [PR #92](https://github.com/MTES-MCT/trackdechets/pull/92)
- Affichage des sirets dans les mails d'invitation [PR #96](https://github.com/MTES-MCT/trackdechets/pull/95) et [PR #92](https://github.com/MTES-MCT/trackdechets/pull/96)

## [2019.11.3] 28/11/2019

- Ajout d'un numéro de bordereau libre

## [2019.11.2] 21/11/2019

- Mise à jour du service de génération de pdf pour se rapprocher du Cerfa officiel
- Relooking de la barre de navigation. Déplacement de "Mon Compte" au même niveau que "Mon espace".
- Ajout du SIRET en plus du nom dans le sélecteur d'entreprise [PR #80](https://github.com/MTES-MCT/trackdechets/pull/80)

## [2019.11.1] 06/11/2019

- Rattachment du profil TD à l'entreprise (https://github.com/MTES-MCT/trackdechets/pull/57)
- Amélioration de la documentation (https://github.com/MTES-MCT/trackdechets/pull/58)
- Notification des DREALs en cas de refus de déchets (https://github.com/MTES-MCT/trackdechets/pull/56)
- Gestion de l'exemption de récépissé (https://github.com/MTES-MCT/trackdechets/pull/41)
- Amélioration de l'affichage des statistiques (https://github.com/MTES-MCT/trackdechets/pull/38)
- Amélioration de la page d'inscription (https://github.com/MTES-MCT/trackdechets/pull/52)
- Affichage d'erreurs plus explicites (https://github.com/MTES-MCT/trackdechets/pull/50)
- Automatisation d'envoi d'emails d'onboarding (https://github.com/MTES-MCT/trackdechets/pull/48)
