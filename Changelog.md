# Changelog

Les changements importants de Trackdéchets sont documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et le projet suit un schéma de versionning inspiré de [Calendar Versioning](https://calver.org/).

# [2022.08.4] 29/08/2022

#### :rocket: Nouvelles fonctionnalités

#### :bug: Corrections de bugs

- Correction du filtre sur l'information libre transporteur pour les BSDASRI, BSDA et BSFF [PR 1623](https://github.com/MTES-MCT/trackdechets/pull/1623)
- Affichage du CAP sur le BSDA [PR 1625](https://github.com/MTES-MCT/trackdechets/pull/1625)
- Affichage d'un bouton manquant sur le BSDA avec émetteur particulier [PR 1626](https://github.com/MTES-MCT/trackdechets/pull/1626)
- Correction du ratelimit au login [PR 1613](https://github.com/MTES-MCT/trackdechets/pull/1613)

#### :boom: Breaking changes

#### :nail_care: Améliorations

- Utilisation des sirets en cache pour la query formsLifeCycle [PR 1609](https://github.com/MTES-MCT/trackdechets/pull/1609)
- Prise en compte de la colonne Company.contact lors de l'import en masse [PR 1606](https://github.com/MTES-MCT/trackdechets/pull/1606)
- Améliorations de l'UI Bsdasri [PR 1602](https://github.com/MTES-MCT/trackdechets/pull/1602)
- Possibilité de passer outre l'entreprise de travaux sur le BSDA  [PR 1604](https://github.com/MTES-MCT/trackdechets/pull/1604)
- Amélioration des filtres dashboard [PR 1595](https://github.com/MTES-MCT/trackdechets/pull/1595)
- Permettre de spécifier exutoire final sur le BSDA sur le workflox déchetterie + entreposage [PR 1614](https://github.com/MTES-MCT/trackdechets/pull/1614)
- Amélioration de la sécurité à la connexion [PR 1612](https://github.com/MTES-MCT/trackdechets/pull/1612)
- Différenciation plus visible de la sandbox [PR 1617](https://github.com/MTES-MCT/trackdechets/pull/1617)


#### :memo: Documentation

#### :house: Interne
 
# [2022.08.3] 16/08/2022

#### :rocket: Nouvelles fonctionnalités

#### :bug: Corrections de bugs

- Correction d'un bug sur le dashboard qui faisait disparaitre les filtres saisis [PR 1592](https://github.com/MTES-MCT/trackdechets/pull/1598)

#### :boom: Breaking changes

- Ajout de restrictions sur le SIRET visé comme émetteur ou destinataire d'un BSDD. Si l'un de ces acteurs n'est pas inscrit sur Trackdéchets, la création du bordereau est désormais impossible [PR 1451](https://github.com/MTES-MCT/trackdechets/pull/1451)

#### :nail_care: Améliorations

- Ajout d'un bouton pour charger plus de bordereaux dans le composant de sélection des annexes BSDA [PR 1592](https://github.com/MTES-MCT/trackdechets/pull/1599)

#### :memo: Documentation

#### :house: Interne

# [2022.08.2] 14/08/2022

#### :rocket: Nouvelles fonctionnalités

#### :bug: Corrections de bugs

#### :boom: Breaking changes

#### :nail_care: Améliorations

#### :memo: Documentation

#### :house: Interne

- Ajout d'index db supplémentaires [PR 1592](https://github.com/MTES-MCT/trackdechets/pull/1592)

# [2022.08.1] ~08/08/2022

#### :rocket: Nouvelles fonctionnalités

- Ajout d'un onglet "BSDA suite" sur l'aperçu pour les BSDAs initiaux groupés ou faisant partie d'un bordereau de transit [PR 1577](https://github.com/MTES-MCT/trackdechets/pull/1577)
- Ajout de la possibilité pour l'émetteur d'un BSDA de supprimer le bordereau après qu'il ait signé, si aucun autre acteur n'a encore signé [PR 1571](https://github.com/MTES-MCT/trackdechets/pull/1571)
- Ajout du code 08 04 09\* pour les BSDA [PR 1570](https://github.com/MTES-MCT/trackdechets/pull/1570)

#### :bug: Corrections de bugs

- Correction d'un bug qui, dans le cas d'un BSDA avec un particulier, laissait trop longtemps possible la modification de certains champs [PR 1569](https://github.com/MTES-MCT/trackdechets/pull/1569)
- Corrections de bugs sur la révision BSDD & BSDA, dans le cas ou un SIRET avait plusieurs rôles de validation de cette révision. Si le créateur de la révision a l'ensemble des rôles d'approbation, la révision est désormais auto-approuvée [PR 1567](https://github.com/MTES-MCT/trackdechets/pull/1567)
- Correction d'un bug à l'enregistrement sur le formulaire BSDA si on saisissait un conditionnement sans saisir la quantité associée [PR 1557](https://github.com/MTES-MCT/trackdechets/pull/1557)
- Correction d'un bug qui entraînait l'envoi d'un email de refus incomplet [PR 1579](https://github.com/MTES-MCT/trackdechets/pull/1579)
- Correction dasri diverses [PR 1585](https://github.com/MTES-MCT/trackdechets/pull/1585)

#### :boom: Breaking changes

#### :nail_care: Améliorations

- Correction du fonctionnement de la validation des champs requis sur le BSFF [PR 1531](https://github.com/MTES-MCT/trackdechets/pull/1531)
- Ajout d'un "rate limit" sur le formulaire de connexion pour éviter les attaques par "brute force" [PR 1565](https://github.com/MTES-MCT/trackdechets/pull/1565)
- Multiples améliorations BSDA: inversion de la destination finale & initiale sur le formulaire UI, correction d'un bug sur l'aperçu qui indiquait un bordereau comme de réexpédition par erreur, amélioration de la visibilité du destinataire final lors d'un groupement, ajout de détails sur les BSDAs associés dans les onglets de signature, PDF et aperçu [PR 1551](https://github.com/MTES-MCT/trackdechets/pull/1551)
- Ajout d'un bouton pour charger les révisions non affichées [PR 1587](https://github.com/MTES-MCT/trackdechets/pull/1587)

#### :memo: Documentation

#### :house: Interne

# [2022.07.5] 25/07/2022

#### :rocket: Nouvelles fonctionnalités

#### :bug: Corrections de bugs

#### :boom: Breaking changes

#### :nail_care: Améliorations

#### :boom: Breaking changes

#### :nail_care: Améliorations

#### :house: Interne

- Import de sociétés anonymes - script [PR 1533](https://github.com/MTES-MCT/trackdechets/pull/1533)

# [2022.07.4] 21/07/2022

#### :rocket: Nouvelles fonctionnalités

#### :bug: Corrections de bugs

#### :boom: Breaking changes

#### :nail_care: Améliorations

#### :boom: Breaking changes

#### :nail_care: Améliorations

#### :house: Interne

- Import de sociétés anonymes - script [PR 1533](https://github.com/MTES-MCT/trackdechets/pull/1533)

# [2022.07.3] 20/07/2022

#### :rocket: Nouvelles fonctionnalités

#### :bug: Corrections de bugs

- Correction des liens du company selector [PR 1558](https://github.com/MTES-MCT/trackdechets/pull/1558)
- Correction des favoris transporteur [PR 1559](https://github.com/MTES-MCT/trackdechets/pull/1559)

#### :boom: Breaking changes

#### :nail_care: Améliorations

#### :boom: Breaking changes

#### :nail_care: Améliorations

#### :house: Interne

# [2022.07.2] 19/07/2022

#### :rocket: Nouvelles fonctionnalités

#### :bug: Corrections de bugs

- Refactor du company selector [PR 1553](https://github.com/MTES-MCT/trackdechets/pull/1553)

#### :boom: Breaking changes

#### :nail_care: Améliorations

#### :boom: Breaking changes

#### :nail_care: Améliorations

#### :house: Interne

# [2022.07.1] ~18/07/2022

#### :rocket: Nouvelles fonctionnalités

- Ajout du code 12 01 16\* pour les BSDAs [PR 1478](https://github.com/MTES-MCT/trackdechets/pull/1478)
- Ajout d'un filtre sur le type de BSDASRI dans la query `bsdasris` [PR 1479](https://github.com/MTES-MCT/trackdechets/pull/1479)
- Ajout de la possibilité de rechercher des BSFFs par leurs numéros de contenant (dans l'interface Trackdéchets et par API) [PR 1510](https://github.com/MTES-MCT/trackdechets/pull/1510)
- Interface d'ajout des intermédiaires sur BSDD [PR 1481](https://github.com/MTES-MCT/trackdechets/pull/1481)
- La requête `searchCompanies` qui interroge la base SIRENE (via [les données ouvertes de l'INSEE](https://files.data.gouv.fr/insee-sirene/)), reconnaît désormais si `clue` est un numéro de TVA et interroge la base VIES (via [le service la commission européenne](https://ec.europa.eu/taxation_customs/vies/)) pour vérifier son existence et indiquer si l'établissement est inscrit ou non sur Trackdéchets. [PR 1481](https://github.com/MTES-MCT/trackdechets/pull/1481)
- Ajout de `FormInput.intermediaries: [CompanyInput!]` [PR 1481](https://github.com/MTES-MCT/trackdechets/pull/1481)

#### :bug: Corrections de bugs

- Correction d'un bug ne permettant pas au destinataire finale de créer un BSDD avec entreposage provisoire [PR 1498](https://github.com/MTES-MCT/trackdechets/pull/1498)
- Correction de la navigation entre les onglets du tableau de bord lors de certaines actions [PR 1469](https://github.com/MTES-MCT/trackdechets/pull/1469)
- Correction d'un bug affichant une mauvaise adresse et raison sociale dans le module de recherche d'entreprise sur l'interface Trackdéchets [PR 1501](https://github.com/MTES-MCT/trackdechets/pull/1501)
- On visualise mieux quand la recherche par TVA donne des informations manquantes pour un numéro de TVA qui existe et on doit pouvoir éditer manuellement les coordonnées d'un établissement étranger aux coordonnées inconnues donc ouverture automatique du formulaire à la sélection du résultat inconnu [PR 1543](https://github.com/MTES-MCT/trackdechets/pull/1543)

#### :boom: Breaking changes

#### :nail_care: Améliorations

- Gestion des volumes représentés par des nombres décimaux sur les BSDASRIs [PR 1506](https://github.com/MTES-MCT/trackdechets/pull/1506)
- Interface de recherche d'établissements : améliorations de design général, et support des entreprises étrangères par recherche de TVA inclus directement dans le champs de recherche textuel des entreprises françaises. Suppression du sélecteur "Entreprise étrangère". [PR 1481](https://github.com/MTES-MCT/trackdechets/pull/1481) et suivantes : [PR 1539](https://github.com/MTES-MCT/trackdechets/pull/1539), [PR 1538](https://github.com/MTES-MCT/trackdechets/pull/1538), [PR 1528](https://github.com/MTES-MCT/trackdechets/pull/1528)
- Affichage des inscriptions sur Trackdéchets dans la liste des résultats de recherche [PR 1541](https://github.com/MTES-MCT/trackdechets/pull/1541)
- Meilleure validation des numéros de téléphone étrangers dans le compte utilisateur [PR 1544](https://github.com/MTES-MCT/trackdechets/pull/1544)

#### :boom: Breaking changes

#### :nail_care: Améliorations

#### :house: Interne

# [2022.06.3] ~29/06/2022

#### :rocket: Nouvelles fonctionnalités

#### :bug: Corrections de bugs

- Corrections d'édition d'un BSDD avec un transporteur étranger [PR 1491](https://github.com/MTES-MCT/trackdechets/pull/1491), [PR 1494](https://github.com/MTES-MCT/trackdechets/pull/1494) et [PR 1497](https://github.com/MTES-MCT/trackdechets/pull/1497)
- Corrections de textes divers [PR 1477](https://github.co+m/MTES-MCT/trackdechets/pull/1477) et [PR 1475](https://github.com/MTES-MCT/trackdechets/pull/1475)
- Correction "Select all" BSDD avec appendice 2, quantités groupées corrigées [PR 1493](https://github.com/MTES-MCT/trackdechets/pull/1493)

#### :boom: Breaking changes

#### :nail_care: Améliorations

#### :memo: Documentation

#### :house: Interne

# [2022.06.2] ~27/06/2022

#### :rocket: Nouvelles fonctionnalités

- Ajout de la révision BSDA, qui rend possible la modification de certains champs du bordereau même après la fin de son cycle de vie [PR 1443](https://github.com/MTES-MCT/trackdechets/pull/1443)
- Ajout de la possibilité d'ajouter un supprimer une étape d'entreposage provisoire sur le BSDD [PR 1449](https://github.com/MTES-MCT/trackdechets/pull/1449)

```mermaid
graph TD
ACCEPTED -->|markAsProcessed| PROCESSED(PROCESSED / AWAITING_GROUP / NO_TRACEABILITY)
ACCEPTED -.->|markAsResealed| RESEALED(RESEALED)
TEMP_STORER_ACCEPTED -->|markAsResealed| RESEALED(RESEALED)
TEMP_STORER_ACCEPTED -.->|markAsProcessed| PROCESSED(PROCESSED / AWAITING_GROUP / NO_TRACEABILITY)
```

- Permettre aux forces de l'ordre d’accéder au pdf des bordereaux sur présentation d'un QR-code à durée de vie limitée [PR 1433](https://github.com/MTES-MCT/trackdechets/pull/1433)
- En tant que particulier ou navire étranger je peux être producteur d'un BSDD [PR 1452](https://github.com/MTES-MCT/trackdechets/pull/1452)

#### :bug: Corrections de bugs

- Correction du code déchet erroné pour les DASRI d'origine animale (18 01 02* => 18 02 02*) [PR 1460](https://github.com/MTES-MCT/trackdechets/pull/1460)
- Chercher un transporteur étranger ne rafraichit plus la page et sélectionne bien l'entreprise [PR 1468](https://github.com/MTES-MCT/trackdechets/pull/1468)

#### :boom: Breaking changes

#### :nail_care: Améliorations

- Affiche les adresses emails des administrateurs d'un établissement lors d'une demande de rattachement si l'email du requérant appartient au même nom de domaine [PR 1429](https://github.com/MTES-MCT/trackdechets/pull/1429)
- Ajout de suggestions lors de l'ajout d'un établissement fermé. [PR 1463](https://github.com/MTES-MCT/trackdechets/pull/1463)
- Ajout de la possibilité de filtrer par numéro SIRET de l'émetteur ou du destinataire dans le tableau de bord [PR 1456](https://github.com/MTES-MCT/trackdechets/pull/1456)
- Affichage d'un message d'erreur plus explicite à la création d'un BSDD de groupement [PR 1461](https://github.com/MTES-MCT/trackdechets/pull/1461)

#### :memo: Documentation

#### :house: Interne

- Passage à React V18. [PR 1385](https://github.com/MTES-MCT/trackdechets/pull/1385)
- Passage à Express pour servir le front de production, en remplacement de `serve` [PR 1472](https://github.com/MTES-MCT/trackdechets/pull/1472)

# [2022.06.1] ~06/06/2022

#### :rocket: Nouvelles fonctionnalités

- Ajout par l'API d'entreprises intermédiaires sur un bsdd via `Form.intermediaries` et `FormInput.intermediaries` dans l'API GraphQL. L'intermédiaire peut créer et mettre à jour un bordereau via l'API [PR 1331](https://github.com/MTES-MCT/trackdechets/pull/1331)
- Possibilité d'ajouter des numéros de parcelles et des références d'analyses sur le BSDD [PR 1417](https://github.com/MTES-MCT/trackdechets/pull/1417)

#### :bug: Corrections de bugs

#### :boom: Breaking changes

- Fractionnement d'un BSDD dans plusieurs annexes 2 :
  - Dépréciation des champs :
    - `Form.appendix2Forms: [Appendix2Form!]` : remplacé par `Form.grouping: [InitialFormFraction!]`
    - `CreateFormInput.appendix2Forms: [AppendixFormInput!]` : remplacé par `CreateFormInput.grouping: [InitialFormFractionInput!]`
    - `UpdateFormInput.appendix2Forms: [AppendixFormInput!]` : remplacé par `UpdateFormInput.grouping: [InitialFormFractionInput!]`
  - Modification du type de retour de `Form.groupedIn: Form` qui devient `Form.groupedIn: [FormFraction!]`
  - Ajout des types :
    - `InitialFormFraction`
    - `FormFraction`
    - `InitialFormFractionInput`
  - Suppression de `AppendixFormInput.readableId` qui était un champ déjà déprécié
- Les informations de contact et de récépissé des courtiers et négociants sont désormais obligatoires lorsqu'un courtier ou un négociant apparait sur un BSDD. [PR 1418](https://github.com/MTES-MCT/trackdechets/pull/1418/)

#### :nail_care: Améliorations

- Auto-remplissage du pays et du numéro TVA éventuel pour le PDF des BSDD (transporteurs identifiés par TVA) [PR 1399](https://github.com/MTES-MCT/trackdechets/pull/1399)
- Permettre d'éditer les champs Bsdd champ libre et plaques d'immatriculations pour le statut SIGNED_BY_PRODUCER [PR 1416](https://github.com/MTES-MCT/trackdechets/pull/1416)
- Restreindre les changements de type d'établissement à Transporteur seulement quand un établissement est identifié par un numéro de TVA. [PR 1390](https://github.com/MTES-MCT/trackdechets/pull/1390)
- Sélecteur d'établissement dans l'édition d'un BSD [PR 1424](https://github.com/MTES-MCT/trackdechets/pull/1424)
  - Auto-completion du pays en fonction du numéro TVA quand on sélectionne un transporteur étranger.
  - Dédoublonnage établissements dans la recherche
  - Exclusion des Établissements fermés dans les résultats de recherche
  - Empêcher de choisir manuellement FR quand un transporteur étranger est sélectionné
  - Icône indicatrice d'inscription sur Trackdéchets

#### :memo: Documentation

- Retrait du schema de Form dans la documentation Dasri [PR 1457](https://github.com/MTES-MCT/trackdechets/pull/1457)

#### :house: Interne

# [2022.05.1] ~16/05/2022

#### :rocket: Nouvelles fonctionnalités

- Ajout d'un code `D 9 F` qui peut être utilisé comme code de traitement final sans obligation d'indiquer une destination ultérieure [PR 1369](https://github.com/MTES-MCT/trackdechets/pull/1369)
- Gestion des éco-organismes sur les BSDASRI: [PR 1362](https://github.com/MTES-MCT/trackdechets/pull/1362)

#### :bug: Corrections de bugs

- Sandbox : permettre de créer et rechercher un établissment de test (siret commençant par "00000"). Améliorer la recherche d'établissements par `getCompanyInfos` en accélérant la recherche en cas d'entreprise de test, évitant de chercher les API de recherche interne ou tierces.
- Sandbox : Les établissements de test (siret commençant par "00000") ont `statutDiffusionEtablissement` à "O" pour ne pas apparaître comme des établissements non-diffusibles. [PR 1368](https://github.com/MTES-MCT/trackdechets/pull/1368)
- Désactive au moment de l'envoi le bouton du formulaire dans la modale permettant de mettre à jour la plaque d'immatriculation transporteur [PR 1371](https://github.com/MTES-MCT/trackdechets/pull/1371)
- La modale de publication du Bsdasri n'affiche pas toutes les informations [PR 1359](https://github.com/MTES-MCT/trackdechets/pull/1359)
- Indexation Sirene : correctifs [PR 1365](https://github.com/MTES-MCT/trackdechets/pull/1365) et [PR 1364](https://github.com/MTES-MCT/trackdechets/pull/1364)
- Corrige le message d'erreur affiché en cas de dépassement d'imbrication d'opérateurs sur les filtres de requêtes[PR 1374](https://github.com/MTES-MCT/trackdechets/pull/1374)
- Corrections de la gestion des dasri de groupement [1394](https://github.com/MTES-MCT/trackdechets/pull/1394)

#### :boom: Breaking changes

- Le mode de transport et la saisie d'une immatriculation (si transport route) sont désormais obligatoires sur le BSDA [PR 1379](https://github.com/MTES-MCT/trackdechets/pull/1379)
- Suppression du code D 13 au profit du code D 15 sur le BSDA [PR 1366](https://github.com/MTES-MCT/trackdechets/pull/1366)
- Suppression du code R 12 au profit du code R 13 sur le BSDA [PR 1366](https://github.com/MTES-MCT/trackdechets/pull/1366)

#### :nail_care: Améliorations

- Corrige l'affichage des formulaires de mise à jour des récepissés [PR 1351](https://github.com/MTES-MCT/trackdechets/pull/1351)
- Amélioration de l'affichage du CAP final pour le BSDA dans le cas de transit ou groupement [PR 1366](https://github.com/MTES-MCT/trackdechets/pull/1366)
- Codification des codes familles sur le BSDA [PR 1366](https://github.com/MTES-MCT/trackdechets/pull/1366)
- Ajout d'une description du code de traitement sur le BSDA (permet de spécifier si ISDD ou ISDND par exemple) [PR 1366](https://github.com/MTES-MCT/trackdechets/pull/1366)

#### :memo: Documentation

#### :house: Interne

# [2022.04.2] ~25/04/2022

#### :rocket: Nouvelles fonctionnalités

- Permettre au producteur initial de télécharger le PDF du BSDD de regroupement depuis le détail du BSDD initial [PR 1306](https://github.com/MTES-MCT/trackdechets/pull/1306)
- Ajout de filtres sur la query `bsdas`. Il est désormais possible de filtrer par `customInfo` pour le transporteur, émetteur et destinataire. Et de filtrer par plaque d'immatriculation [PR 1330](https://github.com/MTES-MCT/trackdechets/pull/1330)
- Gestion des dasri de synthèse [PR 1287](https://github.com/MTES-MCT/trackdechets/pull/1287)
- Destination ultérieure optionnelle en cas de rupture de traçabilité [PR 1302](https://github.com/MTES-MCT/trackdechets/pull/1302)

#### :bug: Corrections de bugs

- Il ne doit pas être possible de renseigner un champ `appendix2Forms` non vide lorsque `emitter { type }` est différent de `APPENDIX2` [PR 1306](https://github.com/MTES-MCT/trackdechets/pull/1306)
- Prise en compte de la quantité acceptée plutôt que la quantité estimée lors du calcul automatique de la quantité du bordereau de regroupement [PR 1306](https://github.com/MTES-MCT/trackdechets/pull/1306)
- Correction d'un bug d'affichage sur les révisions: lorsque plusieurs validations étaient nécessaires, les boutons d'action restaient affichés même après que la validation ait été acceptée [PR 1332](https://github.com/MTES-MCT/trackdechets/pull/1332)
- Ne pas afficher les établissements non-diffusibles et ajout des statuts de diffusion selon l'INSEE sur CompanyPublic [PR 1341](https://github.com/MTES-MCT/trackdechets/pull/1341)

#### :boom: Breaking changes

#### :nail_care: Améliorations

#### :memo: Documentation

#### :house: Interne

- Montée de version prisma@3.12.0 [PR 1303](https://github.com/MTES-MCT/trackdechets/pull/1303)

# [2022.04.1] ~04/04/2022

#### :rocket: Nouvelles fonctionnalités

- [Possibilité de rattacher à son compte des établissements hors-france par recherche à partir de leur numéro de TVA. Type d'établissements hors-France forcé à Transporteur. Amélioration de l'édition des bordereaux pour chercher par numéro de TVA les transporteurs inscrits sur Trackdéchets](https://github.com/MTES-MCT/trackdechets/pull/1240)
  - Migrations pour ajouter `Company.vatNumber` et index et ajouter dans les borderaux où manquait encore un `transporterCompanyVatNumber`
  - Ajout d'un client de recherche et validation de coordonnées sur numéro de TVA intra-communautaire (service http://ec.europa.eu/taxation_customs/vies/)
  - ajout de `transporterCompanyVatNumber` dans les différents PDF
  - ajout de la colonne `vatNumber` dans AnonymousCompany et mutations pour permettre d'ajouter quand même des établissements manuellement si le numéro de TVA n'est pas trouvé par le service VIES;
  - extension de CompanySelector.tsx pour valider un numéro TVA et remplir les infos Company (le nom et l'adresse) automatiquement.
  - extension d' AccountCompanyAdd.tsx pour supporter un numéro TVA et remplir les infos Company (le nom et l'adresse) automatiquement.
  - Refacto `companyInfos` pour déplacer toute la logique dans `company/search.ts` et capable de chercher à la fois par SIRET et par TVA.
  - Ajout de la possibilité de filtrer sur le champ `customId` (recherche exacte) sur le tableau de bord et dans la query `forms` [PR 1284](https://github.com/MTES-MCT/trackdechets/pull/1284)
  - Gestion des dasri de synthèse [PR 1287](https://github.com/MTES-MCT/trackdechets/pull/1287)

#### :bug: Corrections de bugs

- fix CSS du stepper pour éviter le chevauchement du texte en responsive dans Stepper.module.scss.
- Correction du refraichissement de l'interface après une création ou une suppression d'établissement [PR 1278](https://github.com/MTES-MCT/trackdechets/pull/1278)
- Correction de l'affichage du caractère dangereux Oui/Non sur le PDF [PR 1280](https://github.com/MTES-MCT/trackdechets/pull/1280)
- Correction de l'adresse de collecte incomplète pour le BSDA dans le registre [PR 1281](https://github.com/MTES-MCT/trackdechets/pull/1281)
- Correction des statuts `AWAITING_GROUP` et `NO_TRACEABILITY` en cas d'import d'un BSDD papier via la mutation `importPaperForm` [PR 1283](https://github.com/MTES-MCT/trackdechets/pull/1283)
- Affichage de l'adresse de collecte/chantier sur le détail d'une annexe 2 lorsque celle-ci est présente [PR 1286](https://github.com/MTES-MCT/trackdechets/pull/1286)
- Détachement des annexes 2 en cas de refus [PR 1282](https://github.com/MTES-MCT/trackdechets/pull/1282)
- Ajout d'un script de suppression des établissements orphelins et décodage des noms d'établissements contenant la chaîne de caractère \&amp; [PR 1288](https://github.com/MTES-MCT/trackdechets/pull/1288)

#### :boom: Breaking changes

- Flexibilisation de la signature producteur / transporteur et installation d'entreposage provisoire / transporteur [PR 1214](https://github.com/MTES-MCT/trackdechets/pull/1186)
  - Ajout du statut `SIGNED_BY_PRODUCER` qui arrive après `SEALED` et avant `SENT`.
  - Ajout du statut `SIGNED_BY_TEMP_STORER` qui arrive après `RESEALED` et avant `RESENT`.
  - Ajout de la mutation `signEmissionForm` qui permet de passer du statut `SEALED` à `SIGNED_BY_PRODUCER` ainsi que de `RESEALED` à `SIGNED_BY_TEMP_STORER`. Il est possible d'utiliser le code de signature d'un acteur pour signer en son nom sans qu'il soit authentifié.
  - Ajout de la mutation `signTransportForm` qui permet de passer du statut `SIGNED_BY_PRODUCER` à `SENT` ainsi que de `SIGNED_BY_TEMP_STORER` à `RESENT`. Il est possible d'utiliser le code de signature pour signer au nom du transporteur sans qu'il soit authentifié.
  - Ajout des champs :
    - `Form.emittedAt`, `Form.emittedBy`, `TemporaryStorageDetail.emittedAt`, `TemporaryStorageDetail.emittedBy` : date et nom de la personne signant pour le producteur, éco-organisme ou installation d'entreposage provisoire.
    - `Form.emittedByEcoOrganisme` : indique si c'est l'éco-organisme qui a signé ou pas.
    - `Form.takenOverAt`, `Form.takenOverBy`, `TemporaryStorageDetail.takenOverAt`, `TemporaryStorageDetail.takenOverBy` : date et nom de la personne signant pour le transporteur initial ou après entreposage provisoire.
  - Dépréciation des champs :
    - `Form.sentAt` : remplacé par `Form.takenOverAt`, qui peut différer de `Form.emittedAt`. Durant sa période de dépréciation le champ continue d'être remplit par la bonne valeur (`Form.takenOverAt`).
    - `Form.sentBy` : remplacé par `Form.emittedBy`. Durant sa période de dépréciation le champ continue d'être remplit par la bonne valeur (`Form.emittedBy`).
    - `TemporaryStorageDetail.signedAt` : remplacé par `TemporaryStorageDetail.takenOverAt`, qui peut différer de `TemporaryStorageDetail.emittedAt`. Durant sa période de dépréciation le champ continue d'être remplit par la bonne valeur (`TemporaryStorageDetail.takenOverAt`).
    - `TemporaryStorageDetail.signedBy` : remplacé par `TemporaryStorageDetail.takenOverBy`. Durant sa période de dépréciation le champ continue d'être remplit par la bonne valeur (`TemporaryStorageDetail.takenOverBy`).
  - Déprécation de la mutation `signedByTransporter`, remplacée par `signEmissionForm` et `signTransportForm` pour faire en deux temps ce qui se faisait avant en un temps. Elle permet toujours de faire passer un bordereau du statut `SEALED` à `SENT` et de `RESEALED` à `RESENT` tout en remplissant les nouveaux champs. En revanche, elle ne permet pas de gérer le statut `SIGNED_BY_PRODUCER` et `SIGNED_BY_TEMP_STORER`.

#### :nail_care: Améliorations

- Nombreuses améliorations sur le BSDA (plus de champs dans l'aperçu, meilleure validation des données, corrections de bugs sur le groupement, amélioration de wordings...) [PR 1271](https://github.com/MTES-MCT/trackdechets/pull/1271)
- Passage au client ElasticSearch TD interne pour le script add-address-lat-long.ts

#### :memo: Documentation

- Mise à jour de la documentation : Tutoriels > Démarrage Rapide > Obtenir un jeton d'accès [PR 1277](https://github.com/MTES-MCT/trackdechets/pull/1277)
- Mise à jour de la référence du champ `Dasri.allowDirectTakeOver` [PR 1277](https://github.com/MTES-MCT/trackdechets/pull/1277)
- Ajout de badges de tests sur le README.md et correction lien search
- Mis à jour fonctionnement de recherche Sirene
- Ajout d'un embed de la vidéo #14 "Introduction de Trackdéchets par API" au tutoriel de démarrage rapide [PR 1285](https://github.com/MTES-MCT/trackdechets/pull/1285)

#### :house: Interne

- Refactoring de `formRepository` [PR 1276](https://github.com/MTES-MCT/trackdechets/pull/1276)

# [2022.03.1] ~14/03/2022

#### :rocket: Nouvelles fonctionnalités

- Ajout d'un client primaire nommé trackdechets dans `companies/sirene` basé sur notre propre index ElasticSearch des données Sirene INSEE [PR 1214](https://github.com/MTES-MCT/trackdechets/pull/1214)
- Ajout du caractère dangereux pour des déchets dont le code ne comporte pas d'astérisque [PR 1177](https://github.com/MTES-MCT/trackdechets/pull/1177)

#### :bug: Corrections de bugs

- Correction de l'adresse chantier incomplète dans le registre [PR 1238](https://github.com/MTES-MCT/trackdechets/pull/1238)
- Correction de l'indexation des filtres d'onglet du tableau de bord [PR 1215](https://github.com/MTES-MCT/trackdechets/pull/1215)
- Correction d'un bug de corruption de la structure du payload renvoyé par l'API en présence des caractères spéciaux "<" et ">" [PR 1250](https://github.com/MTES-MCT/trackdechets/pull/1250)

#### :boom: Breaking changes

#### :nail_care: Améliorations

- Gestion du multi-modal dans l'export du registre [PR 1238](https://github.com/MTES-MCT/trackdechets/pull/1238)
- Ajout du poids à l'arrivée dans l'export du registre [PR 1238](https://github.com/MTES-MCT/trackdechets/pull/1238)
- Ajout de la possibilité de visualiser les bordereaux annexés à un bordereau de regroupement. [PR 1227](https://github.com/MTES-MCT/trackdechets/pull/1227)
- Ajout de la possibilité de visualiser le bordereau de regroupement d'un bordereau annexé. Par API, la lecture de cette information se fait avec le champ `Form.groupedIn`. [PR 1227](https://github.com/MTES-MCT/trackdechets/pull/1227)
- Calcul automatique du conditionnemnt lors de l'ajout d'annexes 2. [PR 1227](https://github.com/MTES-MCT/trackdechets/pull/1227)

#### :memo: Documentation

#### :house: Interne

- Ajout d'une commande de réindexation unitaire d'un bsd
- Ajout d'une section dans "Mon Compte" permettant de créer, modifier et supprimer une application OAuth2 [PR 1244](https://github.com/MTES-MCT/trackdechets/pull/1244)

# [2022.02.1] 21/02/2022

#### :rocket: Nouvelles fonctionnalités

- Ajout d'une section dans "Mon Compte" permettant de créer, modifier et supprimer une application OAuth2 [PR 1174](https://github.com/MTES-MCT/trackdechets/pull/1174)
- Ajout d'une section dans "Mon Compte" permettant de révoquer l'accès donné à des applications tierces [PR 1174](https://github.com/MTES-MCT/trackdechets/pull/1174)
- Ajout d'une section dans "Mon Compte" permettant de révoquer les tokens personnels générés [PR 1174](https://github.com/MTES-MCT/trackdechets/pull/1174)
- Ajout du mode de transport pour le premier transporteur et le transporteur après entreposage provisoire [PR 1176](https://github.com/MTES-MCT/trackdechets/pull/1176)
- Prise en compte du workflow déchetterie pour le bordereau amiante [PR 1180](https://github.com/MTES-MCT/trackdechets/pull/1180)

#### :bug: Corrections de bugs

- Correction de l'indexation des Bsda. [PR 1216](https://github.com/MTES-MCT/trackdechets/pull/1216)

#### :boom: Breaking changes

#### :nail_care: Améliorations

- Amélioration du processus de réinitialisation de mot de passe. [PR 1151](https://github.com/MTES-MCT/trackdechets/pull/1151)

#### :memo: Documentation

#### :house: Interne

# [2022.01.2] 31/01/2022

#### :rocket: Nouvelles fonctionnalités

#### :bug: Corrections de bugs

- Affichage d'un message d'erreur lorsque le statut d'acceptation d'un déchet dangereux n'est pas précisé lors de la signature de l'acceptation [PR 1152](https://github.com/MTES-MCT/trackdechets/pull/1152)
- Affichage d'un message d'erreur lorsque la validation du traitement d'un déchet dangereux n'aboutit pas lors de la signature du traitement [PR 1152](https://github.com/MTES-MCT/trackdechets/pull/1152)
- Corrections récépissé PDF [PR 1153](https://github.com/MTES-MCT/trackdechets/pull/1153) :
  - ajout du détail des contenants pour le packaging "Autre".
  - affichage de l'adresse chantier complète.
  - case exemption de récépissé.

#### :boom: Breaking changes

- Dépréciation du champ `waste { name }` sur le BSDA au profit champ `waste { materialName }`, aussi bien en lecture qu'en écriture. [PR 1118](https://github.com/MTES-MCT/trackdechets/pull/1118)
  - Ce changement n'aura pas d'impact pour cette release mais le champ déprécié disparaîtra avec la prochaine. Il est donc important de faire la migration dès que possible.

#### :nail_care: Améliorations

- La recherche d'établissements par n°SIRET ne retourne plus d'établissement fermé [PR 1140](https://github.com/MTES-MCT/trackdechets/pull/1140)
- Retrait du lien de création de bsdd apparaissant sur le dashboard brouillon vide [PR 1150](https://github.com/MTES-MCT/trackdechets/pull/1150)
- La recherche sur `customInfo` dans le tableau de bord transporteur se fait de façon exacte et non plus floue [PR 1144](https://github.com/MTES-MCT/trackdechets/pull/1144)
- Les champs adresse enlèvement ou chantier sont remplissables même si les adresses ne sont pas trouvées [PR 1159](https://github.com/MTES-MCT/trackdechets/pull/1159)
- Nombreuses améliorations apportées au BSDA autour du lexique utilisé, de la génération du récépissé PDF et affichage [PR 1118](https://github.com/MTES-MCT/trackdechets/pull/1118)

#### :memo: Documentation

#### :house: Interne

# [2022.01.1] 10/01/2022

#### :rocket: Nouvelles fonctionnalités

#### :bug: Corrections de bugs

- Correction d'un bug affectant la création de BSVHU. [PR 1130](https://github.com/MTES-MCT/trackdechets/pull/1130)
- Suppression de tous les objets liés à un établissement avant l'appel à `prisma.company.delete` [PR 1127](https://github.com/MTES-MCT/trackdechets/pull/1127)
- Correction d'un problème d'indexation lors des différentes étapes de préparation et prise en charge d'un segment multi-modal [PR 1127](https://github.com/MTES-MCT/trackdechets/pull/1127)
- Validation d'un segment multi-modal lors de l'appel à la mutation `markAsReadyToTakeOver` [PR 1127](https://github.com/MTES-MCT/trackdechets/pull/1127)

#### :boom: Breaking changes

- Dépréciation du champ `me { companies }` au profit de la query `myCompanies` (paginée). [PR 1113](https://github.com/MTES-MCT/trackdechets/pull/1113)

#### :nail_care: Améliorations

- Pagination des établissements dans Mon Compte > Établissements. [PR 1113](https://github.com/MTES-MCT/trackdechets/pull/1113)
- Possibilité pour le destinataire d'un BSDD de valider une réception même si un segment multi-modal a été crée par erreur [PR 1128](https://github.com/MTES-MCT/trackdechets/pull/1128)
- Affichage du courtier sur l'aperçu et le PDF des bordereaux amiante. [PR 1135](https://github.com/MTES-MCT/trackdechets/pull/1135)
- Mise en cache des sirets utilisateurs pour améliorer les performances des requêtes [PR 1123](https://github.com/MTES-MCT/trackdechets/pull/1123)

#### :memo: Documentation

#### :house: Interne

- Refactoring du code qui gère la pagination. [PR 1113](https://github.com/MTES-MCT/trackdechets/pull/1113)
- Retrait de l'envoi d'emails alertant d'un grand nombre d'établissements créés [PR 1123](https://github.com/MTES-MCT/trackdechets/pull/1123)
- Envoi des emails dans une file d'attente de taches asynchrone [PR 1097](https://github.com/MTES-MCT/trackdechets/pull/1097/)

# [2021.12.2] 27/12/2021

#### :rocket: Nouvelles fonctionnalités

- Gestion de l'export du registre pour tous les types de déchets en accord avec l'arrêté du 31 mai 2021 fixant le contenu du registre. Cet export est disponible :
  - soit en téléchargeant un fichier CSV ou XLSX via la `query` `wastesDownloadLink`
  - soit en paginant les données directement via les `queries` :
    - `incomingWastes` : registre déchets entrants
    - `outgoingWastes` : registre déchets sortants
    - `transportedWastes` : registre déchets collectés
    - `managedWastes` : registre déchets gérés

#### :bug: Corrections de bugs

- Correctif de l'affichage du type de quantité dans l'UI du BSDD [PR 1102](https://github.com/MTES-MCT/trackdechets/pull/1102)
- Correctif de la signature du traitement du Bsdasri dans l'UI [PR 1119](https://github.com/MTES-MCT/trackdechets/pull/1102)

#### :boom: Breaking changes

- Dépréciation de la query `formsRegister` au profit de la query `wastesDownloadLink`.

#### :nail_care: Améliorations

- Remplacement du CERFA BSDD par un récépissé reprenant l'ensemble des évolutions Trackdéchets [PR 1096](https://github.com/MTES-MCT/trackdechets/pull/1096)
- Ajout d'exemples de workflows pour la création de bordereaux amiante [PR 1098](https://github.com/MTES-MCT/trackdechets/pull/1098)

#### :memo: Documentation

#### :house: Interne

- Initialisation explicite des gestionnaires de téléchargement de fichier [PR 1092](https://github.com/MTES-MCT/trackdechets/pull/1092)

# [2021.12.1] 06/12/2021

#### :rocket: Nouvelles fonctionnalités

#### :bug: Corrections de bugs

- Ajout du courtier à la liste des acteurs pouvant lister ses bsdas [PR 1103](https://github.com/MTES-MCT/trackdechets/pull/1103)

#### :boom: Breaking changes

#### :nail_care: Améliorations

#### :memo: Documentation

#### :house: Interne

# [2021.12.1] 06/12/2021

#### :rocket: Nouvelles fonctionnalités

- Gestion des numéros d'identification des containers des Dasris [PR 1087](https://github.com/MTES-MCT/trackdechets/pull/1087)

#### :bug: Corrections de bugs

- Indexation Elasticsearch des bordereaux indexés via la mutation `importPaperForm` [PR 1081](https://github.com/MTES-MCT/trackdechets/pull/1081)
- Correction d'un bug empêchant la mise à jour partielle de champs imbriqués via la mutation `updateBsff` [PR 1065](https://github.com/MTES-MCT/trackdechets/pull/1065)
- Correction d'un bug empêchant la signature de l'entreprise de travaux sur le BSDA quand l'émetteur est un particulier [PR 1091](https://github.com/MTES-MCT/trackdechets/pull/1091)

#### :boom: Breaking changes

- Ajout d'une date de prise en charge du déchet par le transporteur sur le `Bsff` [PR 1065](https://github.com/MTES-MCT/trackdechets/pull/1065)
  - Ajout du champ `transporter.transport.takenOverAt` à l'objet `Bsff`
  - Ajout du champ optionnel `takenOverAt` à l'input `BsffTransporterTransportInput`.
  - Dans le cas où `takenOverAt` n'est pas renseigné, `bsff.transporter.transport.takenOverAt` renvoie la date de signature transport par défaut.

#### :nail_care: Améliorations

- Ajout d'index sur les champs siret des différents bordereaux [PR 1080](https://github.com/MTES-MCT/trackdechets/pull/1080)
- Ajout d'exemples pour le profil producteur lors de la création d'un établissement, et modification des liens du header [PR 1078](https://github.com/MTES-MCT/trackdechets/pull/1078)

#### :memo: Documentation

#### :house: Interne

# [2021.11.1] 15/11/2021

#### :rocket: Nouvelles fonctionnalités

- Ajout du code de traitement R3 à la liste des traitements possibles pour le BSFF [PR 1037](https://github.com/MTES-MCT/trackdechets/pull/1037)
- Ajout de la suppression d'un établissement depuis l'interface [PR 1053](https://github.com/MTES-MCT/trackdechets/pull/1053)
- Il est maintenant possible de lier une fiche d'intervention à plusieurs BSFFs [PR 1033](https://github.com/MTES-MCT/trackdechets/pull/1033)
- Ajout de la demande de révision d'un bordereau (API seulement). Rend possible la modification de certains champs du bordereau après la fin de son cycle de vie [PR 1055](https://github.com/MTES-MCT/trackdechets/pull/1055)

#### :boom: Breaking changes

- Harmonisation du statut d'acceptation du déchet [PR 1040](https://github.com/MTES-MCT/trackdechets/pull/1040)
  - Remplacement de `BsdaAcceptationStatus`, `BsffAcceptationStatus` et `BsvhuAcceptationStatus` par `WasteAcceptationStatus`
  - Remplacement de l'input `WasteAcceptationStatusInput` par l'enum `WasteAcceptationStatus`
  - Les champs `Form.wasteAcceptationStatus`, `TemporaryStorer.wasteAcceptationStatus` et `BsdasriWasteAcceptation.status` ne sont plus du type `String` mais `WasteAcceptationStatus`

#### :bug: Corrections de bugs

- Correction d'une rare erreur d'affichage du rôle utilisateur sur la page "Mon compte -> Etablissements -> Membres" [PR 1061](https://github.com/MTES-MCT/trackdechets/pull/1061)
- Correction d'erreurs sur le bsdasri liées à l'harmmonisation et la gestion des plaques d'immatriculation [PR 1071](https://github.com/MTES-MCT/trackdechets/pull/1071)

#### :nail_care: Améliorations

- Le nombre maximum de plaques d'immatriculations est limité à 2 sur les bsdasri et bsda [PR 1054](https://github.com/MTES-MCT/trackdechets/pull/1054)
- Amélioration du PDF du bordereau amiante [PR 1050](https://github.com/MTES-MCT/trackdechets/pull/1050)

#### :memo: Documentation

#### :house: Interne

- Rend le rate limit configurable [PR 1056](https://github.com/MTES-MCT/trackdechets/pull/1056)
- Le champ installation de CompanyPrivate est dans son propre resolver [PR 1059](https://github.com/MTES-MCT/trackdechets/pull/1059)
- Mise à jour de l'utilitaire de restauration [PR 1060](https://github.com/MTES-MCT/trackdechets/pull/1060)
- Ajout de la création d'une entreprise anonyme via le panneau d'administration [PR 1057](https://github.com/MTES-MCT/trackdechets/pull/1057)

# [2021.10.2] 25/10/2021

#### :rocket: Nouvelles fonctionnalités

#### :boom: Breaking changes

- Harmonisation et stabilisation de l'api des bordereaux dasri [PR 992](https://github.com/MTES-MCT/trackdechets/pull/992)
- Harmonisation et stabilisation de l'api des bordereaux BSFF [PR 991](https://github.com/MTES-MCT/trackdechets/pull/991)
- Le champ `id` de l'input `AppendixFormInput` devient obligatoire [PR 1028](https://github.com/MTES-MCT/trackdechets/pull/1028)
- Harmonisation du fonctionnement des filtres sur les queries bsdasris, bsdas, bsvhus and bsffs [PR 1005](https://github.com/MTES-MCT/trackdechets/pull/1005)

#### :bug: Corrections de bugs

- Correction de la validation des contenants lors de la signature transporteur sur le BSDD [PR 1012](https://github.com/MTES-MCT/trackdechets/pull/1012)
- Correction de la recherche entreprise qui retournait des établissements fermés [PR 1046](https://github.com/MTES-MCT/trackdechets/pull/1046)
- Correction du code APE renvoyé par `companyInfos` qui était celui du siège et non celui de l'établissement [PR 1046](https://github.com/MTES-MCT/trackdechets/pull/1046)
- Correction d'un bug empêchant le courtier de créer un BSDA [PR 1008](https://github.com/MTES-MCT/trackdechets/pull/1008)

#### :nail_care: Améliorations

- Ajout d'un contrôle de cohérence centre émetteur vs destination initiale lors du regroupement de BSDD [PR 1028](https://github.com/MTES-MCT/trackdechets/pull/1028)
- La suppression d'un BSDD de regroupement dissocie désormais les annexes 2 [PR 1028](https://github.com/MTES-MCT/trackdechets/pull/1028)
- Correction d'un bug de l'interface qui ne reprenait pas les informations liées au courtier lors de la modification d'un BSDA [PR 1015](https://github.com/MTES-MCT/trackdechets/pull/1015)
- À la création d'une entreprise, le réglage "j'autorise l'emport direct de dasris" est proposé [PR 1006](https://github.com/MTES-MCT/trackdechets/pull/1006)
- Ajout d'un message d'erreur lorsque l'on requête un établissement non diffusable [PR 1009](https://github.com/MTES-MCT/trackdechets/pull/1009)
- Suppression de la bannière d'avertissement DASRI, amiante, FF [PR 1016](https://github.com/MTES-MCT/trackdechets/pull/1016)
- Ajout de la possibilité de mettre à jour un BSDD à l'état `RESEALED` en appelant plusieurs fois la mutation `markAsResealed`. Cette fonctionnalité n'est disponible que par API. [PR 1014](https://github.com/MTES-MCT/trackdechets/pull/1014)
- Multiples améliorations sur les formulaires de création et de signature VHU et amiante [PR 1036](https://github.com/MTES-MCT/trackdechets/pull/1036)
- Gestion des plaques d'immatriculation des dasris [PR 1041](https://github.com/MTES-MCT/trackdechets/pull/1041)

#### :memo: Documentation

#### :house: Interne

- Amélioration de la query { me } pour éviter de reqêter inutilement la base sirene [PR 1010](https://github.com/MTES-MCT/trackdechets/pull/1010)

# [2021.10.1] 04/10/2021

#### :rocket: Nouvelles fonctionnalités

#### :boom: Breaking changes

#### :bug: Corrections de bugs

- Correction d'un bug d'affichage dans la préparation d'un transfert multi-modal [PR 997](https://github.com/MTES-MCT/trackdechets/pull/997)

#### :nail_care: Améliorations

- Rafraichissement automatique de la liste des bordereaux dans l'UI Trackdéchets [PR 985](https://github.com/MTES-MCT/trackdechets/pull/985)
- Ajout d'un filtre sur les champs "Plaque d'immatriculation" et "Champ libre" dans le tableau de bord transporteur [PR 998](https://github.com/MTES-MCT/trackdechets/pull/998)

#### :memo: Documentation

#### :house: Interne

# [2021.09.1] 17/09/2021

#### :rocket: Nouvelles fonctionnalités

- La signature du producteur dasri avec code secret est disponible dans l'UI [PR 987](https://github.com/MTES-MCT/trackdechets/pull/987)

#### :boom: Breaking changes

- La validation de la mutation `createBsff` a été renforcée, certains champs sont maintenant requis (cf la documentation pour plus de détails). Il est possible d'utiliser la mutation `createDraftBsff` pour conserver l'ancien comportement [PR 971](https://github.com/MTES-MCT/trackdechets/pull/971).

#### :bug: Corrections de bugs

- Correctifs divers sur la version PDF du BSFF [PR 971](https://github.com/MTES-MCT/trackdechets/pull/971).
- Le client SIRENE ne prenait pas en compte les indices de répétition (bis, ter, ...) ni les compléments (Bat G, Escalier H, ...) [PR 993](https://github.com/MTES-MCT/trackdechets/pull/993)

#### :nail_care: Améliorations

- L'emport direct de dasris (sans signature producteur) est limité aux bordereaux simples (hors regroupement) [972](https://github.com/MTES-MCT/trackdechets/pull/972)
- Sur l'interface Trackdéchets, les champs se pré-remplissent désormais lors d'un groupement, réexpédition ou reconditionnement d'un BSFF [PR 971](https://github.com/MTES-MCT/trackdechets/pull/971).
- La validation du groupement, réexpédition et reconditionnement d'un BSFF a été renforcée [PR 971](https://github.com/MTES-MCT/trackdechets/pull/97
- Améliorations des filtres sur les champs "Numéro de BSD" et "Déchet" dans le tableau de bord de l'interface Trackdéchets [PR 983](https://github.com/MTES-MCT/trackdechets/pull/983)

#### :memo: Documentation

#### :house: Interne

# [2021.08.2] 24/08/2021

#### :rocket: Nouvelles fonctionnalités

- Nouveaux éléments d'interface pour les BSFFs [PR 955](https://github.com/MTES-MCT/trackdechets/pull/955).
  - Ajout de la gestion des fiches d'intervention.
  - Ajout des écrans de réception par l'installation de destination et de signature du traitement final.
  - Ajout de la possibilité de grouper, reconditionner et réexpédier.
  - Ajout du champ "volume" pour les contenants.
  - Ajout de la case à cocher d'exemption du récépissé pour les transporteurs.
- Nouveaux éléments d'API pour les BSFFs [PR 955](https://github.com/MTES-MCT/trackdechets/pull/955).
  - Ajout du champ `Bsff.type` et `BsffInput.type` qui sont un enum `BsffType` permettant de différencier entre groupement, reconditionnement, réexpédition, collecte de petites quantités ou suivi d'un fluide.
  - Ajout de `INTERMEDIATELY_PROCESSED` à l'enum `BsffStatus`, qui indique qu'un déchet est en attente d'un groupement, reconditionnement ou d'une réexpédition. Le BSFF passe au statut `PROCESSED` lorsque le déchet a reçu son traitement final.
  - Ajout des valeurs `R13` et `D15` à l'enum `BsffOperationCode` qui sont les codes correspondants à une réexpédition.
  - Ajout du filtre `BsffWhere.status` qui permet de retrouver les BSFFs avec un statut particulier.
  - Ajout du filtre `BsffWhereOperation.code_in` qui permet de retrouver les BSFFs ayant subit un traitement faisant partie d'une liste de codes donnée.
  - Ajout du champ `BsffInput.ficheInterventions` permettant de lier des fiches d'intervention.
  - Ajout de la mutation `createDraftBsff` qui permet de créer un BSFF incomplet et de le compléter au fur et à mesure.
  - Ajout de la mutation `publishBsff` qui permet de passer d'un BSFF en brouillon à un BSFF publié.
  - Ajout du champ `Bsff.isDraft` qui permet de distinguer entre un BSFF en brouillon et publié.

#### :boom: Breaking changes

#### :bug: Corrections de bugs

- Correction de bugs de validation et de l'interface des bordereaux dasri [PR 960](https://github.com/MTES-MCT/trackdechets/pull/960)

#### :nail_care: Améliorations

- Nombreuses améliorations et corrections de bugs sur les formulaires de création de bordereaux VHU et BSDA [PR 1058](https://github.com/MTES-MCT/trackdechets/pull/1058)

#### :memo: Documentation

#### :house: Interne

# [2021.08.1] 03/08/2021

#### :rocket: Nouvelles fonctionnalités

- Ajout du BSFF à l'interface [PR 940](https://github.com/MTES-MCT/trackdechets/pull/940)
  - Formulaire de création et d'édition
  - Écrans de signature de l'émetteur et du transporteur
  - Aperçu détaillé
- Évolutions de l'API BSFF [PR 940](https://github.com/MTES-MCT/trackdechets/pull/940)
  - Renommage de la propriété `bsffs` en `previousBsffs`.
  - Ajout de la propriété `nextBsff` et `nextBsffs`.
  - Ajout de la propriété `volume` à `BsffPackaging`.
  - Remplacement de la propriété `type` de `BsffPackaging` par un champ libre `name`.
- Ajout de la possibilité de générer un n°SIRET factice pour la création d'établissements de test [PR 945](https://github.com/MTES-MCT/trackdechets/pull/945)

#### :boom: Breaking changes

#### :bug: Corrections de bugs

- Corrections de bugs sur l'annexe 2: il n'est plus possible d'ajouter un même bordereau sur plusieurs annexes, et la modification des annexe via `updateForm` est désormais correctement prise en compte [PR958](https://github.com/MTES-MCT/trackdechets/pull/958)

#### :nail_care: Améliorations

- Création et édition de bordereaux Dasri de groupement [PR934](https://github.com/MTES-MCT/trackdechets/pull/934)
- Emport direct de bordereaux Dasris quand le producteur l'a autorisé [935](https://github.com/MTES-MCT/trackdechets/pull/935)
- Ajout de champs sur le BSDA: courtier, mode de transport, immatriculations, exemption de récépissé transporteur et destination ultérieure prévue [PR 938](https://github.com/MTES-MCT/trackdechets/pull/938)

#### :memo: Documentation

#### :house: Interne

- Mise à jour de l'intégration continue [PR 937](https://github.com/MTES-MCT/trackdechets/pull/937)
- Stabilisation de la génération des PDFs via Gotenberg [PR944](https://github.com/MTES-MCT/trackdechets/pull/944)

# [2021.07.1] 12/07/2021

#### :rocket: Nouvelles fonctionnalités

- Ajout d'un bouton pour choisir le type de bordereau à créer [PR 899](https://github.com/MTES-MCT/trackdechets/pull/899)
- Les producteurs peuvent autoriser l'emport de dasri sans leur signature depuis l'UI[PR 904](https://github.com/MTES-MCT/trackdechets/pull/904)
- Ajout des BSFFs au tableau de bord [PR 909](https://github.com/MTES-MCT/trackdechets/pull/909)
- Évolutions de l'API BSFF suite aux retours de nos partenaires [PR 909][https://github.com/mtes-mct/trackdechets/pull/909]
  - Refonte de la gestion des fiches d'intervention : modification du modèle et des mutations
  - Suppression des champs `BsffOperation.qualification` et `BsffPlannedOperation.qualification`
  - Renommage du champ `BsffPackaging.litres` en `BsffPackaging.kilos`
  - Renommage du champ `BsffWaste.description` en `BsffWaste.nature`
  - Ajout du champ `Bsff.status`
- Le champ `allowBsdasriTakeOverWithoutSignature` est disponible sur companyPublic [PR 928][https://github.com/mtes-mct/trackdechets/pull/928]

#### :boom: Breaking changes

- Sur le bsdasri, nouvelles règles pour la gestion des quantités [PR 910](https://github.com/MTES-MCT/trackdechets/pull/910):
  - les champs quantity et quantityType deviennent quantity { value type }
  - la pesée finale est transférée de reception à operation
  - les quantity sont facultatives pour le producteur et le transporteur
  - si la quantité (value) est renseignée, le type doit l'être également
  - la quantity est obligatoire pour le destinataire si le code correspond à un traitement final

#### :bug: Corrections de bugs

#### :nail_care: Améliorations

- Les codes R12 et D12 autorisés uniquement si le destinataire est TTR [PR 914](https://github.com/MTES-MCT/trackdechets/pull/914)
- Les champs emails du bordereau dasri sont facultatifs [PR 916](https://github.com/MTES-MCT/trackdechets/pull/916)
- Les différentes quantités (masses) du Bsdasri deviennent des flottants, le champ `onBehalfOfEcoorganisme` n'est plus réservé au Bsdasri de groupement [PR 928](https://github.com/MTES-MCT/trackdechets/pull/928)

#### :memo: Documentation

- Re-structuration de la documentation et ajout d'exemples de bout en bout [PR 905](https://github.com/MTES-MCT/trackdechets/pull/905)

#### :house: Interne

- Indexation des BSFF dans Elastic Search [PR 909](https://github.com/MTES-MCT/trackdechets/pull/909)
- Intégration des jobs CRON dans le code grâce à node-cron [PR 896](https://github.com/MTES-MCT/trackdechets/pull/896)

# [2021.06.2] 28/06/2021

#### :rocket: Nouvelles fonctionnalités

- Affiche le détail d'un bordereau dasri [PR 876](https://github.com/MTES-MCT/trackdechets/pull/876)
- Edition de bordereaux dasri [PR 886](https://github.com/MTES-MCT/trackdechets/pull/886)
- Publication de bordereaux dasri [PR 888](https://github.com/MTES-MCT/trackdechets/pull/888)
- Signature de bordereaux dasri [PR 891](https://github.com/MTES-MCT/trackdechets/pull/891)
- Duplication de bordereaux dasri [PR 892](https://github.com/MTES-MCT/trackdechets/pull/892)
- Suppression de bordereaux dasri [PR 893](https://github.com/MTES-MCT/trackdechets/pull/893)
- Gnération du pdf de bordereaux dasri [PR 898](https://github.com/MTES-MCT/trackdechets/pull/898)
- Ajout du groupement, de la génération du PDF à l'API BSDA, intégration de ces bordereaux à la query Elastic Search, et ajout de la mutation de suppression [882](https://github.com/MTES-MCT/trackdechets/pull/882)
- Ajout du groupement, reconditionnement, de la réexpédition, de l'envoi à l'étranger et de la génération du PDF à l'API BSFF [875](https://github.com/MTES-MCT/trackdechets/pull/875)
- Ajout d'éléments UI pour les VHU: actions depuis le dashboard et aperçu du bordereau [PR 917](https://github.com/MTES-MCT/trackdechets/pull/917)

#### :boom: Breaking changes

- Les établissements apparaissant sur le bordereau de regroupement mais pas sur le bordereau annexé (ex: l'exutoire finale) n'ont plus accès à toutes les informations du bordereau annexé pour préserver les infos commerciales de l'établissement effectuant le regroupement [PR 872](https://github.com/MTES-MCT/trackdechets/pull/872).

#### :bug: Corrections de bugs

- Correction du typage de `ResealedFormInput.wasteDetails` [PR 889](https://github.com/MTES-MCT/trackdechets/pull/889)

#### :nail_care: Améliorations

- Suppression du statut de vérification de l'établissement dans Mon Compte en sandbox [PR 895](https://github.com/MTES-MCT/trackdechets/pull/895)
- Limite la rupture de traçabilité aux opérations correspondant à un regroupement [PR 878](https://github.com/MTES-MCT/trackdechets/pull/878)
- Amélioration de l'UI de signature DASRI avec pré-validation des champs, renvoi vers l'onglet concerné du formulaire avec mise en valeur des champs à mettre à jour [PR 924](https://github.com/MTES-MCT/trackdechets/pull/924).

#### :memo: Documentation

- Amélioration de la référence de l'API [PR 885](https://github.com/MTES-MCT/trackdechets/pull/885)
- Documentation des validations effectuées dans la référence de l'API [PR 894](https://github.com/MTES-MCT/trackdechets/pull/894)

#### :house: Interne

- Seul les erreurs non gérées sont capturées par Sentry [PR 874](https://github.com/MTES-MCT/trackdechets/pull/874)
- Passage à Docusaurus 2 [PR 885](https://github.com/MTES-MCT/trackdechets/pull/885)

# [2021.06.1] 02/06/2021

#### :rocket: Nouvelles fonctionnalités

- Intégration des bordereaux dasris au moteur de recherche multi bordereaux (api)[PR 850](https://github.com/MTES-MCT/trackdechets/pull/850)
- Intégration des bordereaux vhus au moteur de recherche multi bordereaux (api)[PR 863](https://github.com/MTES-MCT/trackdechets/pull/863)
- Ajout du bordereau de fluides frigorigènes à l'API [PR 853](https://github.com/MTES-MCT/trackdechets/pull/853)
- Ajout du bordereau de suivi des déchets amiante à l'API [PR 873](https://github.com/MTES-MCT/trackdechets/pull/873)

#### :boom: Breaking changes

- Suppression du champ `Form`.`actualQuantity` qui n'était pas implémenté. [PR 879](https://github.com/MTES-MCT/trackdechets/pull/879)

#### :bug: Corrections de bugs

- Correction du rendu pdf des dasris et vhus [PR 866](https://github.com/MTES-MCT/trackdechets/pull/866) et [PR 871](https://github.com/MTES-MCT/trackdechets/pull/871)

#### :nail_care: Améliorations

- Masquage des informations liées à l'émetteur initial d'une annexe 2 dans le PDF d'un bordereau de regroupement lorsqu'il est téléchargé par un autre acteur que l'installation effectuant le regroupement [PR 865](https://github.com/MTES-MCT/trackdechets/pull/865)
- Ajout d'un mécanisme permettant de renvoyer un email d'activation [PR 874](https://github.com/MTES-MCT/trackdechets/pull/874)

#### :memo: Documentation

#### :house: Interne

# [2021.05.1] 04/05/2021

#### :rocket: Nouvelles fonctionnalités

- Ajout de la mutation de duplication bordereaux dasri [PR 848](https://github.com/MTES-MCT/trackdechets/pull/848)
- Ajout d'une mutation de suppression de bordereau dasri [PR 852](https://github.com/MTES-MCT/trackdechets/pull/852)

#### :boom: Breaking changes

- Le numéro de CAP devient obligatoire pour les déchets dangereux [PR 840](https://github.com/MTES-MCT/trackdechets/pull/840)

#### :bug: Corrections de bugs

#### :nail_care: Améliorations

- Correction de l'indexation des bsdds afin qu'ils soient listés dans tous les onglets appropriés pour une même entreprise [PR 858](https://github.com/MTES-MCT/trackdechets/pull/858)
- Augmentation de la limite des conditionnements "benne" et "citerne" à 2 (au lieu de 1) [PR 864](https://github.com/MTES-MCT/trackdechets/pull/864)

#### :memo: Documentation

#### :house: Interne

# [2021.05.1] 04/05/2021

#### :rocket: Nouvelles fonctionnalités

- Ajout de différents filtres dans les tableaux [PR 810](https://github.com/MTES-MCT/trackdechets/pull/810)
- Ajout d'un sélecteur de type de bordereaux dans les tableaux, en vue des prochains bordereaux [PR 810](https://github.com/MTES-MCT/trackdechets/pull/810)
- Ajout de la possibilité de créer des bordereaux DASRI via l'API [PR 787](https://github.com/MTES-MCT/trackdechets/pull/787)

#### :boom: Breaking changes

#### :bug: Corrections de bugs

#### :nail_care: Améliorations

- Réécriture de l'email d'information envoyé à l'adresse de contact émetteur lorsque l'établissement renseigné sur le BSD n'est pas inscrit sur Trackdéchets. On s'assure par ailleurs que cet email n'est envoyé qu'une fois à une même adresse [PR 839](https://github.com/MTES-MCT/trackdechets/pull/839)
- Suppression de l'email envoyé à l'émetteur du bordereau lors d'une rupture de traçabilité [PR 837](https://github.com/MTES-MCT/trackdechets/pull/837)
- Corrections et renommage de certains champs de l'API VHU [PR 838](https://github.com/MTES-MCT/trackdechets/pull/838)

#### :memo: Documentation

- Mise à jour du schéma d'architecture afin d'inclure Elastic Search [PR 810](https://github.com/MTES-MCT/trackdechets/pull/810)

#### :house: Interne

- Refactoring du système de template d'email [PR 839](https://github.com/MTES-MCT/trackdechets/pull/839)
- Ajout d'une base de donnée Elastic Search pour faciliter la recherche multi bordereaux. [PR 810](https://github.com/MTES-MCT/trackdechets/pull/810)

# [2021.04.1] 12/04/2021

#### :rocket: Nouvelles fonctionnalités

- Ajout d'un mécanisme de vérification par envoi de courrier pour les établissements considérés comme professionnels du déchet (traiteur, TTR, transporteur, négociant, courtier, éco-organisme, VHU) permettant de s'assurer que l'administrateur a bien les droits de créer l'établissement dans Trackdéchets. Dans l'attente de cette vérification, le premier administrateur ne peut pas inviter de nouveaux membres et l'établissement ne peut pas être visé en tant qu'installation de destination d'un BSD. [PR 807](https://github.com/MTES-MCT/trackdechets/pull/807)
- Ajout de la possibilité de créer des bordereaux de suivi de véhicules hors d'usage (VHU) via l'API [PR 748](https://github.com/MTES-MCT/trackdechets/pull/748)

#### :boom: Breaking changes

#### :bug: Corrections de bugs

- Correction d'un bug dans l'interface Trackdéchets lorsque sur mobile on souhaitait accéder à son compte. Le bouton n'apparaissait pas car on ne pouvait pas scroller [PR 828](https://github.com/MTES-MCT/trackdechets/pull/828)
- Correction d'un bug dans l'interface lors de la saisie des conditionnements. Si on avait sélectionné "Autre" en précisant la description et qu'on changeait ensuite le type de conditionnement, un message d'erreur apparaissait [PR 828](https://github.com/MTES-MCT/trackdechets/pull/828)
- Correction d'un bug dans l'interface dans la modale de détail d'un bordereau. Le conditionnement ne donnait pas le détail des "Autre", et n'affichait pas le bon conditionnement dans le cas d'un entreposage provisoire [PR 828](https://github.com/MTES-MCT/trackdechets/pull/828)

#### :nail_care: Améliorations

#### :memo: Documentation

#### :house: Interne

- Ajout d'une interface d'admin permettant aux agents de l'administration de vérifier manuellement que l'utilisateur ayant rattaché un établissement a bien le droit de le faire [PR 832](https://github.com/MTES-MCT/trackdechets/pull/832)

# [2021.03.2] 23/03/2021

#### :bug: Corrections de bugs

- Correction d'un bug dans l'interface Trackdéchets empêchant la destination finale après entreposage provisoire de valider le traitement du déchet [PR 824](https://github.com/MTES-MCT/trackdechets/pull/824)
- Correction d'un crash de l'interface Trackdéchets lorsque l'on clique sur le switch de l'entreposage provisoire [PR 822](https://github.com/MTES-MCT/trackdechets/pull/822)
- Correction d'un bug de l'interface Trackdéchets empêchant de valider la réception d'un déchet dans la foulée de son enlèvement
- Correction du passage de variable d'environnement sélectionnant un template d'email inadapté.

# [2021.03.1] 16/03/2021

#### :rocket: Nouvelles fonctionnalités

- Ajout du rôle _courtier_ afin de suivre le cadre légal à venir. [PR 786](https://github.com/MTES-MCT/trackdechets/pull/786)

- Ajout du champ `companyTypes` au type `CompanyPublic` retourné par la query `companyInfos` permettant de connaitre le profil d'un établissement inscrit sur Trackdéchets. Cette information apparait désormais également sur les fiches entreprise de l'interface Trackdéchets [PR 784](https://github.com/MTES-MCT/trackdechets/pull/784)
- L'affichage sous forme de cartes est maintenant disponible pour l'ensemble des tableaux [PR 809](https://github.com/MTES-MCT/trackdechets/pull/809)

#### :boom: Breaking changes

- Seuls les établissements inscrits sur Trackdéchets en tant qu'installation de traitement ou de tri, transit, regoupement peuvent être visés en case 2 ou 14 [PR 784](https://github.com/MTES-MCT/trackdechets/pull/784)
- Validation exhaustive des champs pour les brouillons. Il était jusqu'à présent possible de saisir des valeurs invalides tant qu'un BSD était en brouillon. Les mêmes règles de validation que pour les bordereaux scéllés sont désormais appliquées [PR 764](https://github.com/MTES-MCT/trackdechets/pull/764)

#### :bug: Corrections de bugs

- Correction du support optionnel du champ "appendix2Forms" [PR 792](https://github.com/MTES-MCT/trackdechets/pull/792)
- Correction de l'affichage des bordereaux à collecter après un entreposage provisoire [PR 811](https://github.com/MTES-MCT/trackdechets/pull/811)
- Affichage du bouton de signature de l'enlèvement sur la vue détaillée d'un BSD [PR 809](https://github.com/MTES-MCT/trackdechets/pull/809)
- Correction d'un bug lié à l'édition d'un segment du multimodal [PR 809](https://github.com/MTES-MCT/trackdechets/pull/809)
- Correction de l'affichage du formulaire d'export du registre [PR 821](https://github.com/MTES-MCT/trackdechets/pull/821)

#### :nail_care: Améliorations

- Affichage de l'avertissement concernant les limites de Trackdéchets sur toutes les pages du dashboard [PR 809](https://github.com/MTES-MCT/trackdechets/pull/809)
- Correction de divers problèmes d'accessibilité [PR 809](https://github.com/MTES-MCT/trackdechets/pull/809)
- L'URL est mis à jour à l'ouverture de la modale d'aperçu d'un BSD [PR 809](https://github.com/MTES-MCT/trackdechets/pull/809)
- L'affichage détaillée du multimodal, ainsi que l'édition d'un segment, se fait dorénavant depuis la fiche détaillée d'un BSD [PR 809](https://github.com/MTES-MCT/trackdechets/pull/809)

#### :memo: Documentation

#### :house: Interne

- Prise en compte de la date d'activation pour les emails d'onboarding (au lieu de la date d'inscription) [PR 817](https://github.com/MTES-MCT/trackdechets/pull/817)
- Segmentation des emails d'embarquement en fonction du profil utilisateur [PR 803](https://github.com/MTES-MCT/trackdechets/pull/803)
- Utilisation d'un resolver GraphQL pour le scalaire DateTime [PR 802](https://github.com/MTES-MCT/trackdechets/pull/802)
- Conversion du champ `processedAt` en champ date [PR 802](https://github.com/MTES-MCT/trackdechets/pull/802)
- Les URLs de l'application ont évolués en vue de l'ajout future d'autres types de bordereaux, des redirections ont été mises en place [PR 809](https://github.com/MTES-MCT/trackdechets/pull/809)

# [2021.02.2] 10/02/2021

- Correction d'un bug empêchant l'utilisation de certains formats de date dans les mutations `markAsAccepted`, `markAsTempStorerAccepted` et `markAsSent` [PR 798](https://github.com/MTES-MCT/trackdechets/pull/798)

# [2021.02.1] 03/02/2021

#### :rocket: Nouvelles fonctionnalités

#### :boom: Breaking changes

- Utilisation du format `BSD-{yyyyMMdd}-{XXXXXXXXX}` pour le champ `readableId` de l'objet `Form` en remplacement de l'ancien format `TD-{yy}-{XXXXXXXX}` [PR 759](https://github.com/MTES-MCT/trackdechets/pull/759)

#### :bug: Corrections de bugs

- Correction du formulaire de réception [PR 769](https://github.com/MTES-MCT/trackdechets/pull/769)
- Correction d'un bug de saisie de date sur Safari [PR 774](https://github.com/MTES-MCT/trackdechets/pull/774)
- Correction d'un bug d'affichage des champs de saisie des récépissés transporteur et négociant [PR 783](https://github.com/MTES-MCT/trackdechets/pull/783)

#### :nail_care: Améliorations

- Amélioration du rafraichissement automatique de la liste des bordereaux entre les différents onglets du tableau de bord [PR 746](https://github.com/MTES-MCT/trackdechets/pull/746)
- Refonte des slides d'embarquement des nouveaux utilisateurs, [PR 742](https://github.com/MTES-MCT/trackdechets/pull/742)
- Le nom, l'adresse et le code naf ne sont plus modifiables lors du rattachement d'un établissement et suppression de l'ajout de justificatifs [PR 766](https://github.com/MTES-MCT/trackdechets/pull/766)
- Auto-complétion du récépissé transporteur lors de la complétion du BSD suite [PR 770](https://github.com/MTES-MCT/trackdechets/pull/770)

#### :memo: Documentation

#### :house: Interne

- Migration de Prisma 1 vers Prisma 2 (ORM utilisé côté backend) [PR 733](https://github.com/MTES-MCT/trackdechets/pull/733)
- Enregistrement et géocodage des adresses des établissements lors du rattachement [PR 766](https://github.com/MTES-MCT/trackdechets/pull/766)
- Affichage de la dialogue de feedback Sentry en cas d'erreur dans l'application front [PR 774](https://github.com/MTES-MCT/trackdechets/pull/774)
- Déploiement de la documentation avec Github Pages [PR 772](https://github.com/MTES-MCT/trackdechets/pull/772)
- Ajustements de config pour permettre un développement en local sans docker [PR 777](https://github.com/MTES-MCT/trackdechets/pull/777)

# [2021.01.2] 11/01/2021

#### :rocket: Nouvelles fonctionnalités

- Nouveaux éléments d'interface pour le BSDA (forumulaire de création & signatures) [947](https://github.com/MTES-MCT/trackdechets/pull/947)

#### :boom: Breaking changes

#### :bug: Corrections de bugs

- Correction d'un bug empêchant l'affichage du bouton "Télécharger le PDF" pour les bordereaux en attente de collecte (statut `SEALED`) [PR 757](https://github.com/MTES-MCT/trackdechets/pull/757)
- Correction d'un bug rendant le champ `wasteAcceptationStatus` obligatoire lors de la réception d'un déchet à l'installation d'entreposage provisoire ou reconditionnement [PR 758](https://github.com/MTES-MCT/trackdechets/pull/758)

#### :nail_care: Améliorations

#### :memo: Documentation

#### :house: Interne

- Mise à jour du template de PR Github [PR 756](https://github.com/MTES-MCT/trackdechets/pull/756)

# [2021.01.1] 07/01/2021

#### :rocket: Nouvelles fonctionnalités

- Ajout des mutations `markAsAccepted` et `markAsTempStorerAccepted` qui permettent de séparer la réception d'un déchet de son acceptation. [PR 684](https://github.com/MTES-MCT/trackdechets/pull/684)
- Ajout de l'attribut "POP" (Polluants Organiques Persistants) aux déchets, [PR 736](https://github.com/MTES-MCT/trackdechets/pull/736)
- Ajout de la possibilité de supprimer ou modifier un bordereau tant qu'aucune signature (transporteur ou producteur) n'a été apposée (statut `DRAFT` ou `SEALED`). [PR 720](https://github.com/MTES-MCT/trackdechets/pull/720)

#### :boom: Breaking changes

- Afin de pouvoir passer au statut `PROCESSED` un BSD doit désormais être `ACCEPTED` et non plus `RECEIVED`. Idem pour passer à `RESEALED`, il doit être `TEMP_STORER_ACCEPTED`. Si vous utilisez les mutations `markAsReceived` et `markAsTempStored` comme précédemment, cela se fera automatiquement.

#### :bug: Corrections de bugs

- Correction d'un bug de langue dans l'application front, pouvant provoquer une traduction erronée par le navigateur. [PR 737](https://github.com/MTES-MCT/trackdechets/pull/737)

#### :nail_care: Améliorations

- Validation de la date de réception d'un déchet dans l'application front, afin d'éviter les incohérences. [PR 739](https://github.com/MTES-MCT/trackdechets/pull/739)
- Amélioration de l'expérience utilisateur de la signature éco-organisme, [PR 693](https://github.com/MTES-MCT/trackdechets/pull/693)
- Intégration des établissements de la gendarmerie nationale dans une table interne destinée aux entreprises "non diffusables" de la base SIRENE. Il est donc désormais possible de créer ces établissements ou de les viser sur un BSDD à partir de la recherche par N°Siret dans l'interface Trackdéchets. [PR 718](https://github.com/MTES-MCT/trackdechets/pull/718)

#### :memo: Documentation

#### :house: Interne

- Amélioration de la collecte des erreurs par Sentry, [PR 605](https://github.com/MTES-MCT/trackdechets/pull/605)
- Désactivation de Matomo en dehors de l'environnement de production, [PR 736](https://github.com/MTES-MCT/trackdechets/pull/736)
- Ajout d'un hook prettier dans graphql-codegen [PR 744](https://github.com/MTES-MCT/trackdechets/pull/744)

# [2020.11.2] 30/11/2020

#### :rocket: Nouvelles fonctionnalités

- Ajout d'un nouveau champ `packagingInfos` qui viendra remplacer `packagings`, `numberOfPackages` et `otherPackaging`. Ces champs sont encore supportés pour quelques temps mais marqué comme dépréciés. Nous vous invitons à migrer aussi vite que possible. [PR 600](https://github.com/MTES-MCT/trackdechets/pull/600)

#### :boom: Breaking changes

- Suppression de la possibilité pour l'émetteur du bordereau de valider un enlèvement sans signature transporteur dans l'interface Trackdéchets. Cette fonctionnalité utilisait les mutations `markAsSent` et `markAsResent` de l'API qui sont dépréciées. [PR 704](https://github.com/MTES-MCT/trackdechets/pull/704)

#### :bug: Corrections de bugs

- Correction de la mutation `duplicateForm` pour dupliquer l'entreposage provisoire, [PR 700](https://github.com/)
- Correction d'un bug affichant une erreur serveur à la place d'une erreur de validation graphQL lorsque le typage des variables graphQL est erronée [PR 711](https://github.com/MTES-MCT/trackdechets/pull/711)
- Correction d'un bug empêchant de paginer les bordereaux "en arrière" dans la query `forms` lorsque `cursorBefore` n'est pas précisé et amélioration de la validation des paramètres de pagination [PR 699](https://github.com/MTES-MCT/trackdechets/pull/699)
- Correction de l'affichage de l'aperçu du bordereau avec entreposage provisoire, [PR 715](https://github.com/MTES-MCT/trackdechets/pull/715)
- Correction d'un bug dans les entreprises proposées lors de la sélection d'une entreprise au moment de créer un BSD, [PR 713](https://github.com/MTES-MCT/trackdechets/pull/713)
- Correction d'un bug permettant de modifier un BSD qui n'est pas en brouillon [PR 726](https://github.com/MTES-MCT/trackdechets/pull/726)

#### :nail_care: Améliorations

- Amélioration des suggestions d'entreprise lors de la création d'un BSD depuis l'interface, [PR 673](https://github.com/MTES-MCT/trackdechets/pull/673)
- Légende du QR Code dans l'UI [PR 709](https://github.com/MTES-MCT/trackdechets/pull/709)

#### :memo: Documentation

#### :house: Interne

- Migration du service td-etl dans un projet Github à part [PR 683](https://github.com/MTES-MCT/trackdechets/pull/683)
- Intégration du service de génération de pdf en tant que module interne au backend [PR 172](https://github.com/MTES-MCT/trackdechets/pull/712)
- Ajout du type d'authentification utilisé dans les logs de statut [PR 702](https://github.com/MTES-MCT/trackdechets/pull/702)
- Réintégration du service mail au backend et implémentation de l'envoi d'emails via différents prestataires (https://github.com/MTES-MCT/trackdechets/pull/703)

# [2020.11.1] 03/11/2020

**Breaking changes**

- Le champ `Form.ecoOrganisme` n'est plus du type `EcoOrganisme` mais du nouveau type `FormEcoOrganisme`.
  Concrètement, le nouveau type ne contient plus les champs `id` et `address`.
  Vous n'êtes pas affecté si vous ne requêtiez pas ces champs ou l'objet `ecoOrganisme`.
- Le type `EcoOrganismeInput` a évolué suite aux changements du champ `Form.ecoOrganisme` :
  ```diff
    input EcoOrganismeInput {
  -   id: ID!
  +   name: String!
  +   siret: String!
    }
  ```
  Vous n'êtes pas affecté si vous ne renseigniez pas l'éco-organisme via les mutations `createForm` ou `updateForm`.

**Changes**

- Refonte de l'interface utilisateur. [PR 469](https://github.com/MTES-MCT/trackdechets/pull/469)
- Ajout du champ `customInfo` à `TransporterInput`, ce qui permet de renseigner cette information via les mutations `createForm`, `updateForm`, `markAsResent`, `markAsResealed`, [PR 417](https://github.com/MTES-MCT/trackdechets/pull/417)
- Suppression du service metabase suite au basculement vers une instance metabase dédiée [PR 453](https://github.com/MTES-MCT/trackdechets/pull/453)
- Ajout du profil d'entreprise "éco-organisme". Ce type d'entreprise peut renseigner ses agréments et signer un BSD à la place du détenteur lorsqu'il est responsable des déchets. [PR 400](https://github.com/MTES-MCT/trackdechets/pull/400)
- Dépréciation des arguments `first` et `skip` sur la query `forms`. A la place, pour paginer utiliser `cursorAfter` et `first` ou `cursorBefore` et `last`. Côté filtres, ajout des arguments `updatedAfter` et `sentAfter` sur la query `forms` pour filtrer par date, `wasteCode` pour filtrer par code déchet, et de `siretPresentOnForm` pour sélectionner des bordereaux ou le SIRET passé apparait [PR 455](https://github.com/MTES-MCT/trackdechets/pull/455)
- Ajout d'un mécanisme de demande de rattachement à un établissement [PR 418](https://github.com/MTES-MCT/trackdechets/pull/418)
- Mise à jour des liens Géorisques cassés [PR 645](https://github.com/MTES-MCT/trackdechets/pull/645)
- Correction d'un bug empêchant l'affichage du dashboard lorsqu'un BSD n'avait pas d'émetteur [PR 644](https://github.com/MTES-MCT/trackdechets/pull/644)
- Correction d'un bug affichant une invitation en attente même quand celle-ci a déjà été acceptée [PR 671](https://github.com/MTES-MCT/trackdechets/pull/671)
- Correction du lien présent dans l'email d'invitation suite à l'action "Renvoyer l'invitation" [PR 648](https://github.com/MTES-MCT/trackdechets/pull/648)
- Champs requis dans le formulaire d'inscription suite à un lien d'invitation [PR 670](https://github.com/MTES-MCT/trackdechets/pull/670)
- Affichage des bordereaux au statut `GROUPED` dans l'onglet "Suivi" du dashboard et corrections de la mutation `markAsSent` sur un BSD de regroupement [PR 672](https://github.com/MTES-MCT/trackdechets/pull/672)
- Correction d'un bug permettant de sceller des bordereaux avec des informations sur le détail du déchet (cadre 3,4,5,6) erronnées ce qui causait des erreurs de validation ultérieures [PR 681](https://github.com/MTES-MCT/trackdechets/pull/681)
- Correction d'un bug empêchant la complétion du BSD suite depuis l'interface [PR 662](https://github.com/MTES-MCT/trackdechets/pull/662)
- Correction d'un bug lors de l'appel à la mutation `markAsTempStored` sans passer le paramètre optionnel `signedAt` [PR 602](https://github.com/MTES-MCT/trackdechets/pull/602)

# [2020.10.1] 05/10/2020

- Ajout d'une limitation de 1000 requêtes possible par une même adresse IP dans une fenêtre de 1 minute, [PR 407](https://github.com/MTES-MCT/trackdechets/pull/407)
- Amélioration de la machine à état permettant de calculer les états possibles du BSD [PR 411](https://github.com/MTES-MCT/trackdechets/pull/411)
- Ajout de la possibilité de pouvoir importer un BSD papier signé, [PR 404](https://github.com/MTES-MCT/trackdechets/pull/404)
- Préservation de la sélection d'entreprise après la création d'un BSD, [PR 410](https://github.com/MTES-MCT/trackdechets/pull/410)

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
- Notification email à tous les membres d'un établissement lors du renouvellement du code de signature
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
  - Possibilité pour un admin de renouveller le code de signature d'un établissement
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
