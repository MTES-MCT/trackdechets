# Changelog

Les changements importants de Trackdéchets sont documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et le projet suit un schéma de versionning inspiré de [Calendar Versioning](https://calver.org/).

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
- Suppression du champ `companyTypes` du type `CompanySearchResult` retourné par la query `searchCompanies`. Ce champ avait été ajouté par erreur et renvoyait tout le temps `null` [PR 784](https://github.com/MTES-MCT/trackdechets/pull/784)
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
