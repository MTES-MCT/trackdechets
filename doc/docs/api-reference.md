---
id: api-reference
title: Référence de l'API
sidebar_label: Référence de l'API
---


## Query
<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>appendixForms</strong></td>
<td valign="top">[<a href="#form">Form</a>!]!</td>
<td>

Renvoie des BSD candidats à un regroupement dans une annexe 2

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Siret d'un des établissements dont je suis membre

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">wasteCode</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Code déchet pour affiner la recherche

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>bsdasri</strong></td>
<td valign="top"><a href="#bsdasri">Bsdasri</a>!</td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Identifiant du BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>bsdasriPdf</strong></td>
<td valign="top"><a href="#filedownload">FileDownload</a>!</td>
<td>

Renvoie un token pour télécharger un pdf de bordereau
Ce token doit être transmis à la route /download pour obtenir le fichier.
Il est valable 10 secondes

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

ID d'un bordereau

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>bsdasris</strong></td>
<td valign="top"><a href="#bsdasriconnection">BsdasriConnection</a>!</td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Renvoie les Bsdasris.
Par défaut, les dasris des différentes companies de l'utilisateur sont renvoyés.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">after</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

(Optionnel) PAGINATION
Permet en conjonction avec `first` de paginer "en avant"
(des Bsdasri les plus récents aux Bsdasri les plus anciens)
Curseur après lequel les Bsdasri doivent être retournés
Attend un identifiant (propriété `id`) de BSD
Défaut à vide, pour retourner les Bsdasri les plus récents.
Le BSD précisé dans le curseur ne fait pas partie du résultat

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">first</td>
<td valign="top"><a href="#int">Int</a></td>
<td>

(Optionnel) PAGINATION
Permet en conjonction avec `after` de paginer "en avant"
(des Bsdasri les plus récents aux Bsdasri les plus anciens)
Nombre de Bsdasri retournés après le `cursorAfter`
Défaut à 50, maximum à 500

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">before</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

(Optionnel) PAGINATION
Permet en conjonction avec `last` de paginer "en arrière"
(des Bsdasri les plus anciens aux Bsdasris les plus récents)
Curseur avant lequel les Bsdasri doivent être retournés
Attend un identifiant (propriété `id`) de BSD
Défaut à vide, pour retourner les Bsdasri les plus anciens
Le BSD précisé dans le curseur ne fait pas partie du résultat

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">last</td>
<td valign="top"><a href="#int">Int</a></td>
<td>

(Optionnel) PAGINATION
Nombre de Bsdasri retournés avant le `before`
Défaut à 50, maximum à 500

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top"><a href="#bsdasriwhere">BsdasriWhere</a></td>
<td>

Filtres de recherche

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>bsvhu</strong></td>
<td valign="top"><a href="#bsvhu">Bsvhu</a>!</td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>bsvhuPdf</strong></td>
<td valign="top"><a href="#filedownload">FileDownload</a>!</td>
<td>

Renvoie un token pour télécharger un pdf de bordereau
Ce token doit être transmis à la route /download pour obtenir le fichier.
Il est valable 10 secondes

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

ID d'un bordereau

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>bsvhus</strong></td>
<td valign="top"><a href="#bsvhuconnection">BsvhuConnection</a>!</td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Tous les arguments sont optionnels.
Par défaut, retourne les 50 premiers bordereaux associés à entreprises dont vous êtes membres

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">after</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

PAGINATION
Permet en conjonction avec `first` de paginer "en avant"
(des bordereaux les plus récents aux bordereaux les plus anciens)
Curseur après lequel les bordereaux doivent être retournés
Attend un identifiant (propriété `id`) de BSD
Défaut à vide, pour retourner les bordereaux les plus récents
Le BSD précisé dans le curseur ne fait pas partie du résultat

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">first</td>
<td valign="top"><a href="#int">Int</a></td>
<td>

PAGINATION
Permet en conjonction avec `cursorAfter` de paginer "en avant"
(des bordereaux les plus récents aux bordereaux les plus anciens)
Nombre de bordereaux retournés après le `cursorAfter`
Défaut à 50, maximum à 500

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">before</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

PAGINATION
Permet en conjonction avec `last` de paginer "en arrière"
(des bordereaux les plus anciens aux bordereaux les plus récents)
Curseur avant lequel les bordereaux doivent être retournés
Attend un identifiant (propriété `id`) de BSD
Défaut à vide, pour retourner les bordereaux les plus anciens
Le BSD précisé dans le curseur ne fait pas partie du résultat

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">last</td>
<td valign="top"><a href="#int">Int</a></td>
<td>

PAGINATION
Nombre de bordereaux retournés avant le `cursorBefore`
Défaut à 50, maximum à 500

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top"><a href="#bsvhuwhere">BsvhuWhere</a></td>
<td>

Filtres

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companyInfos</strong></td>
<td valign="top"><a href="#companypublic">CompanyPublic</a>!</td>
<td>

Renvoie des informations publiques sur un établissement
extrait de la base SIRENE et de la base des installations
classées pour la protection de l'environnement (ICPE)

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>ecoOrganismes</strong></td>
<td valign="top">[<a href="#ecoorganisme">EcoOrganisme</a>!]!</td>
<td>

Renvoie la liste des éco-organismes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>form</strong></td>
<td valign="top"><a href="#form">Form</a>!</td>
<td>

Renvoie un BSD sélectionné par son ID (opaque ou lisible, l'un des deux doit être fourni)

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Identifiant opaque du BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">readableId</td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant lisible du BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>formPdf</strong></td>
<td valign="top"><a href="#filedownload">FileDownload</a>!</td>
<td>

Renvoie un token pour télécharger un pdf de BSD
Ce token doit être transmis à la route /download pour obtenir le fichier.
Il est valable 10 secondes

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>forms</strong></td>
<td valign="top">[<a href="#form">Form</a>!]!</td>
<td>

Renvoie les BSDs de l'établissement sélectionné.
Si aucun SIRET n'est précisé et que l'utilisateur est membre d'une seule entreprise
alors les BSD de cette entreprise sont retournés.
Si l'utilisateur est membre de 2 entreprises ou plus, vous devez obligatoirement
préciser un SIRET
Si l'utilisateur n'est membre d'aucune entreprise, un tableau vide sera renvoyé

Vous pouvez filtrer:
- par rôle que joue votre entreprise sur le BSD via `role`
- par date de dernière modification via `updatedAfter`
- par date d'envoi via `sentAfter`
- par statut du BSD via `status`
- les BSD qui attendent une action (ou non) de votre part via `hasNextStep`
- par code déchet via `wasteCode`
- par SIRET d'une entreprise présente n'importe où sur le bordereau via `siretPresentOnForm`

Par défaut:
- tous les BSD accessibles sont retournés
- les BSD sont classés par date de création, de la plus récente à la plus vieille
- les résultats sont paginés par 50. Il est possible de modifier cette valeur via `first` ou `last` en fonction du curseur utilisé
- pour afficher la suite des résultats, utiliser `cursorAfter` ou `cursorBefore`

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET d'un établissement dont je suis membre

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">skip</td>
<td valign="top"><a href="#int">Int</a></td>
<td>

DEPRECATED - (Optionnel) PAGINATION
Nombre d'éléments à ne pas récupérer en début de liste dans le mode de pagination par "offset"
Utiliser en conjonction avec `first` pour paginer "en avant" (des plus récents aux plus anciens)
Utiliser en conjonction avec `last` pour paginer "en arrière" (des plus anciens aux plus récents)
Défaut à 0

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">cursorAfter</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

(Optionnel) PAGINATION
Permet en conjonction avec `first` de paginer "en avant"
(des bordereaux les plus récents aux bordereaux les plus anciens)
Curseur après lequel les bordereaux doivent être retournés
Attend un identifiant (propriété `id`) de BSD
Défaut à vide, pour retourner les bordereaux les plus récents
Le BSD précisé dans le curseur ne fait pas partie du résultat

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">first</td>
<td valign="top"><a href="#int">Int</a></td>
<td>

(Optionnel) PAGINATION
Permet en conjonction avec `cursorAfter` de paginer "en avant"
(des bordereaux les plus récents aux bordereaux les plus anciens)
Nombre de bordereaux retournés après le `cursorAfter`
Défaut à 50, maximum à 500

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">cursorBefore</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

(Optionnel) PAGINATION
Permet en conjonction avec `last` de paginer "en arrière"
(des bordereaux les plus anciens aux bordereaux les plus récents)
Curseur avant lequel les bordereaux doivent être retournés
Attend un identifiant (propriété `id`) de BSD
Défaut à vide, pour retourner les bordereaux les plus anciens
Le BSD précisé dans le curseur ne fait pas partie du résultat

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">last</td>
<td valign="top"><a href="#int">Int</a></td>
<td>

(Optionnel) PAGINATION
Nombre de bordereaux retournés avant le `cursorBefore`
Défaut à 50, maximum à 500

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">sentAfter</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Retourne les BSD envoyés après la date
Filtre sur la date d'envoi (date de la case 9 du bordereau)
Au format (YYYY-MM-DD)
Par défaut vide, aucun filtre n'est appliqué

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">updatedAfter</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Retourne les BSD modifiés après la date
Filtre sur la date de dernière modification
Au format (YYYY-MM-DD)
Par défaut vide, aucun filtre n'est appliqué

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">status</td>
<td valign="top">[<a href="#formstatus">FormStatus</a>!]</td>
<td>

(Optionnel) Filtre sur les statuts des bordereaux
Si aucun filtre n'est passé, les bordereaux seront retournés quel que soit leur statut
Défaut à vide.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">roles</td>
<td valign="top">[<a href="#formrole">FormRole</a>!]</td>
<td>

(Optionnel) Filtre sur le role de demandeur dams le bordereau
Par exemple:
 - `roles: [TRANSPORTER]` renverra les bordereaux pour lesquels je suis transporteur
 - `roles: [EMITTER, RECIPIENT]` renverra les bordereaux dont je suis l'émetteur ou le destinataire final
Voir `FormRole` pour la liste des roles sur lesquels il est possible de filtrer.
Si aucune filtre n'est passé, les bordereaux seront retournés quel que soit votre role dessus.
Défaut à vide.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">hasNextStep</td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

(Optionnel) Permet de filtrer sur les bordereaux en attente d'une action de votre part
Si `true`, seul les bordereaux attendant une action sont renvoyés
Si `false`, seul les bordereaux n'attendant aucune action son renvoyés
Si vide, tous les bordereaux sont renvoyés
Défaut à vide.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siretPresentOnForm</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Siret d'une autre entreprise présente sur le bordereau
Vous n'avez pas besoin d'être membre de cette entreprise.
Seuls les bordereaux ou cette entreprise apparait (dans n'importe quel cadre) seront retournés.
Défaut à vide.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">wasteCode</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Code déchet pour affiner la recherche
Ex: 01 03 04* (Veillez à bien respecter les espaces).
Défaut à vide.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>formsLifeCycle</strong></td>
<td valign="top"><a href="#formslifecycledata">formsLifeCycleData</a>!</td>
<td>

Renvoie les changements de statut des bordereaux de l'entreprise sélectionnée.
La liste est paginée par pages de 100 items, ordonnée par date décroissante (champ `loggedAt`)
Seuls les changements de statut disposant d'un champ `loggedAt` non nul sont retournés

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) SIRET d'un établissement dont je suis membre

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">loggedBefore</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Date formatée après laquelle les changements de statut doivent être retournés (YYYY-MM-DD)

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">loggedAfter</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Date formatée avant laquelle les changements de statut doivent être retournés (YYYY-MM-DD), optionnel

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">cursorAfter</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) PAGINATION
Permet de paginer les changements de statut "en avant"
(des changements de statut les plus récents aux changements de statut les plus anciens)
Curseur après lequel les changements de statut doivent être retournés
Attend un identifiant (propriété `id`) d'un changement de statut
Défaut à vide, pour retourner les changements de statut les plus récents
Le changement de statut précisé dans le curseur ne fait pas partie du résultat

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">cursorBefore</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) PAGINATION
Permet de paginer les changements de statut "en arrière"
(des changements de statut les plus anciens aux changements de statut les plus récents)
Curseur avant lequel les changements de statut doivent être retournés
Attend un identifiant (propriété `id`) d'un changement de statut
Défaut à vide, pour retourner les changements de statut les plus anciens
Le changement de statut précisé dans le curseur ne fait pas partie du résultat

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">formId</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

(Optionnel) ID d'un BSD en particulier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>formsRegister</strong></td>
<td valign="top"><a href="#filedownload">FileDownload</a>!</td>
<td>

Renvoie un token pour télécharger un csv du regsitre
Ce token doit être transmis à la route /download pour obtenir le fichier.
Il est valable 10 secondes

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">sirets</td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td>

Liste de SIRET pour lesquelles exporter le registre

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">exportType</td>
<td valign="top"><a href="#formsregisterexporttype">FormsRegisterExportType</a></td>
<td>

(Optionnel) Modèle de registre (exhaustif, entrants, sortants, transport, négociants)
Défaut: ALL

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">startDate</td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

(Optionnel) Filtre les données par une date de début
Défaut: aucune valeur

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">endDate</td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

(Optionnel) Filtre les données par une date de fin
Défaut: aucune valeur

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">wasteCode</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Filtre les données par code déchet
Défaut: Tous les codes déchets

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">exportFormat</td>
<td valign="top"><a href="#formsregisterexportformat">FormsRegisterExportFormat</a></td>
<td>

(Optionnel) Format de l'export
Défaut: csv

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>me</strong></td>
<td valign="top"><a href="#user">User</a>!</td>
<td>

Renvoie les informations sur l'utilisateur authentifié

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>membershipRequest</strong></td>
<td valign="top"><a href="#membershiprequest">MembershipRequest</a></td>
<td>

Récupère une demande de rattachement effectuée par l'utilisateur courant
à partir de l'identifiant de cette demande ou du SIRET de l'établissement
auquel l'utilisateur a demandé à être rattaché. L'un ou l'autre des
paramètres (id ou siret) doit être être passé mais pas les deux. Cette query
permet notamment de suivre l'état d'avancement de la demande de rattachement
(en attente, accepté, refusé)

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>searchCompanies</strong></td>
<td valign="top">[<a href="#companysearchresult">CompanySearchResult</a>!]!</td>
<td>

Effectue une recherche floue sur la base SIRENE et enrichit
les résultats avec des informations provenant de Trackdéchets

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">clue</td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Champ utilisé pour faire une recherche floue
sur la nom de l'établissement, ex: 'Boulangerie Dupont'

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">department</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Filtre les résultats par numéro de département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>stats</strong></td>
<td valign="top">[<a href="#companystat">CompanyStat</a>!]!</td>
<td>

Renvoie des statistiques sur le volume de déchets entrant et sortant

</td>
</tr>
</tbody>
</table>

## Mutation
<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>createBsdasri</strong></td>
<td valign="top"><a href="#bsdasri">Bsdasri</a>!</td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un nouveau dasri

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">bsdasriCreateInput</td>
<td valign="top"><a href="#bsdasricreateinput">BsdasriCreateInput</a>!</td>
<td>

Payload de création d'un dasri

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createBsff</strong></td>
<td valign="top"><a href="#bsff">Bsff</a>!</td>
<td>

Mutation permettant de créer un nouveau bordereau de suivi de fluides frigorigènes.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#bsffinput">BsffInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createBsvhu</strong></td>
<td valign="top"><a href="#bsvhu">Bsvhu</a></td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un BSVHU

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#bsvhuinput">BsvhuInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createDraftBsdasri</strong></td>
<td valign="top"><a href="#bsdasri">Bsdasri</a>!</td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un nouveau dasri en brouillon

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">bsdasriCreateInput</td>
<td valign="top"><a href="#bsdasricreateinput">BsdasriCreateInput</a>!</td>
<td>

Payload de création d'un dasri brouillon

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createDraftBsvhu</strong></td>
<td valign="top"><a href="#bsvhu">Bsvhu</a></td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un BSVHU en brouillon

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#bsvhuinput">BsvhuInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createForm</strong></td>
<td valign="top"><a href="#form">Form</a>!</td>
<td>

Crée un nouveau bordereau

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">createFormInput</td>
<td valign="top"><a href="#createforminput">CreateFormInput</a>!</td>
<td>

Payload de création d'un bordereau

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>deleteBsdasri</strong></td>
<td valign="top"><a href="#bsdasri">Bsdasri</a></td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Supprime un BSDASRI

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un Dasri

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>deleteBsvhu</strong></td>
<td valign="top"><a href="#bsvhu">Bsvhu</a></td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Supprime un BSVHU

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD VHU

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>deleteForm</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Supprime un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>duplicateBsdasri</strong></td>
<td valign="top"><a href="#bsdasri">Bsdasri</a></td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Duplique un bordereau Dasri

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un Bsdasri

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>duplicateBsvhu</strong></td>
<td valign="top"><a href="#bsvhu">Bsvhu</a></td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Duplique un BSVHU

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD VHU

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>duplicateForm</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Duplique un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>editSegment</strong></td>
<td valign="top"><a href="#transportsegment">TransportSegment</a></td>
<td>

Édite un segment existant

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">nextSegmentInfo</td>
<td valign="top"><a href="#nextsegmentinfoinput">NextSegmentInfoInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>importPaperForm</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Permet d'importer les informations d'un BSD papier dans Trackdéchet après la réalisation de l'opération
de traitement. Le BSD signé papier original doit être conservé à l'installation de destination qui doit
être en mesure de retrouver le bordereau papier correspondant à un bordereau numérique. Le champ `customId`
de l'input peut-être utilisé pour faire le lien.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#importpaperforminput">ImportPaperFormInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>login</strong></td>
<td valign="top"><a href="#authpayload">AuthPayload</a>!</td>
<td>

DEPRECATED - La récupération de token pour le compte de tiers
doit s'effectuer avec le protocole OAuth2

Récupére un token à partir de l'email et du mot de passe
d'un utilisateur.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">email</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">password</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markAsAccepted</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Valide l'acceptation du BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">acceptedInfo</td>
<td valign="top"><a href="#acceptedforminput">AcceptedFormInput</a>!</td>
<td>

Informations liées à l'arrivée

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markAsProcessed</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Valide le traitement d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">processedInfo</td>
<td valign="top"><a href="#processedforminput">ProcessedFormInput</a>!</td>
<td>

Informations liées au traitement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markAsReceived</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Valide la réception d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">receivedInfo</td>
<td valign="top"><a href="#receivedforminput">ReceivedFormInput</a>!</td>
<td>

Informations liées à la réception

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markAsResealed</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Valide la complétion des cadres 14 à 19 lors d'un entreposage provisoire ou reconditionnement

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">resealedInfos</td>
<td valign="top"><a href="#resealedforminput">ResealedFormInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markAsResent</strong> ⚠️</td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Valide l'envoi du BSD après un entreposage provisoire ou reconditionnement

<p>⚠️ <strong>DEPRECATED</strong></p>
<blockquote>

Utiliser la mutation signedByTransporter permettant d'apposer les signatures du collecteur-transporteur (case 18) et de l'exploitant du site d'entreposage provisoire ou de reconditionnement (case 19)

</blockquote>
</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">resentInfos</td>
<td valign="top"><a href="#resentforminput">ResentFormInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markAsSealed</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Finalise un BSD
Les champs suivants sont obligatoires pour pouvoir finaliser un bordereau et
doivent avoir été renseignés au préalable

```
emitter: {
  type
  company: {
    siret
    name
    address
    contact
    phone
    mail
  }
}
recipient: {
  processingOperation
  company: {
    siret
    name
    address
    contact
    phone
    mail
  }
}
transporter: {
  company: {
    siret
    name
    address
    contact
    mail
    phone
  }
  receipt
  department
  validityLimit
  numberPlate
}
wasteDetails: {
  code
  // onuCode est optionnel pour les déchets non-dangereux
  onuCode
  name
  packagings
  numberOfPackages
  quantity
  quantityType
  consistence
}
```

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markAsSent</strong> ⚠️</td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Valide l'envoi d'un BSD

<p>⚠️ <strong>DEPRECATED</strong></p>
<blockquote>

Utiliser la mutation signedByTransporter permettant d'apposer les signatures collecteur-transporteur (case 8) et émetteur (case 9)

</blockquote>
</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">sentInfo</td>
<td valign="top"><a href="#sentforminput">SentFormInput</a>!</td>
<td>

Informations liées à l'envoi

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markAsTempStored</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Valide la réception d'un BSD d'un entreposage provisoire ou reconditionnement

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">tempStoredInfos</td>
<td valign="top"><a href="#tempstoredforminput">TempStoredFormInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markAsTempStorerAccepted</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Valide l'acceptation ou le refus d'un BSD d'un entreposage provisoire ou reconditionnement

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">tempStorerAcceptedInfo</td>
<td valign="top"><a href="#tempstoreracceptedforminput">TempStorerAcceptedFormInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markSegmentAsReadyToTakeOver</strong></td>
<td valign="top"><a href="#transportsegment">TransportSegment</a></td>
<td>

Marque un segment de transport comme prêt à être emporté

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>prepareSegment</strong></td>
<td valign="top"><a href="#transportsegment">TransportSegment</a></td>
<td>

Prépare un nouveau segment de transport multimodal

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">nextSegmentInfo</td>
<td valign="top"><a href="#nextsegmentinfoinput">NextSegmentInfoInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>publishBsdasri</strong></td>
<td valign="top"><a href="#bsdasri">Bsdasri</a></td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Marque un dasri brouillon comme publié (isDraft=false)

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un Bsdasri

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>publishBsvhu</strong></td>
<td valign="top"><a href="#bsvhu">Bsvhu</a></td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Permet de publier un brouillon pour le marquer comme prêt à être envoyé

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>saveForm</strong> ⚠️</td>
<td valign="top"><a href="#form">Form</a></td>
<td>

DEPRECATED - Sauvegarde un BSD (création ou modification, si `FormInput` contient un ID)

<p>⚠️ <strong>DEPRECATED</strong></p>
<blockquote>

Utiliser createForm / updateForm selon le besoin

</blockquote>
</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">formInput</td>
<td valign="top"><a href="#forminput">FormInput</a>!</td>
<td>

Payload du BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sendMembershipRequest</strong></td>
<td valign="top"><a href="#membershiprequest">MembershipRequest</a></td>
<td>

Envoie une demande de rattachement de l'utilisateur courant
à rejoindre l'établissement dont le siret est précisé en paramètre.
Cette demande est communiquée à l'ensemble des administrateurs de
l'établissement qui ont le choix de l'accepter ou de la refuser.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signBsdasri</strong></td>
<td valign="top"><a href="#bsdasri">Bsdasri</a></td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Appose une signature sur un Bsdasri, verrouille les cadres correspondant

Une signature ne peut être apposée que par un membre de l'entreprise figurant sur le cadre concerné
Ex: la signature TRANSPORT ne peut être apposée que par un membre de l'entreprise de transport

Pour signer l'emission avec un compte transpoteur (cas de lasignature sur device transporteur),
utiliser la mutation signBsdasriEmissionWithSecretCode

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">signatureInput</td>
<td valign="top"><a href="#bsdasrisignatureinput">BsdasriSignatureInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signBsdasriEmissionWithSecretCode</strong></td>
<td valign="top"><a href="#bsdasri">Bsdasri</a></td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Appose une signature de type EMISSION via un compte n'appartenant pas à l'émetteur.
Permet de signer un enlèvement sur le device transporteur grâce au code de sécurité de l'émetteur du dasri

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">signatureInput</td>
<td valign="top"><a href="#bsdasrisignaturewithsecretcodeinput">BsdasriSignatureWithSecretCodeInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signBsvhu</strong></td>
<td valign="top"><a href="#bsvhu">Bsvhu</a></td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Signe un BSVHU

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#bsvhusignatureinput">BsvhuSignatureInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedByTransporter</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Permet de transférer le déchet à un transporteur lors de la collecte initiale (signatures en case 8 et 9)
ou après une étape d'entreposage provisoire ou de reconditionnement (signatures en case 18 et 19).
Cette mutation doit être appelée avec le token du collecteur-transporteur.
L'établissement émetteur (resp. d'entreposage provisoire ou de reconditionnement) est authentifié quant à lui
grâce à son code de signature disponible sur le tableau de bord Trackdéchets (Mon Compte > Établissements > Sécurité).
D'un point de vue pratique, cela implique qu'un responsable de l'établissement émetteur (resp. d'entreposage provisoire ou de reconditionnement)
renseigne le code de signature sur le terminal du collecteur-transporteur.
Dans le cas où un éco-organisme figure sur le BSD, il est également possible de signer avec son code plutôt que celui de l'émetteur.
Il faut alors fournir le code de l'éco-organisme en indiquant qu'il est l'auteur de la signature (signingInfo.signatureAuthor doit valoir ECO_ORGANISME).

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">signingInfo</td>
<td valign="top"><a href="#transportersignatureforminput">TransporterSignatureFormInput</a>!</td>
<td>

Informations liées aux signatures transporteur et émetteur (case 8 et 9)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>takeOverSegment</strong></td>
<td valign="top"><a href="#transportsegment">TransportSegment</a></td>
<td>

Marque un segment comme pris en charge par le nouveau transporteur

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">takeOverInfo</td>
<td valign="top"><a href="#takeoverinput">TakeOverInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateBsdasri</strong></td>
<td valign="top"><a href="#bsdasri">Bsdasri</a>!</td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Met à jour un dasri existant
Par défaut, tous les champs sont modifiables.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Identifiant unique du bordereau

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">bsdasriUpdateInput</td>
<td valign="top"><a href="#bsdasriupdateinput">BsdasriUpdateInput</a>!</td>
<td>

Payload de mise à jour d'un dasri

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateBsff</strong></td>
<td valign="top"><a href="#bsff">Bsff</a>!</td>
<td>

Mutation permettant de modifier un bordereau existant de suivi de fluides frigorigènes.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#bsffinput">BsffInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateBsvhu</strong></td>
<td valign="top"><a href="#bsvhu">Bsvhu</a></td>
<td>

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Met à jour un BSVHU

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#bsvhuinput">BsvhuInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateForm</strong></td>
<td valign="top"><a href="#form">Form</a>!</td>
<td>

Met à jour un bordereau existant

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">updateFormInput</td>
<td valign="top"><a href="#updateforminput">UpdateFormInput</a>!</td>
<td>

Payload de mise à jour d'un bordereau

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateTransporterFields</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Met à jour la plaque d'immatriculation ou le champ libre du transporteur

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">transporterNumberPlate</td>
<td valign="top"><a href="#string">String</a></td>
<td>

Plaque d'immatriculation du transporteur

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">transporterCustomInfo</td>
<td valign="top"><a href="#string">String</a></td>
<td>

Champ libre, utilisable par exemple pour noter les tournées des transporteurs

</td>
</tr>
</tbody>
</table>

## Objects

### AuthPayload

Cet objet est renvoyé par la mutation login qui est dépréciée

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>token</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Bearer token à durée illimité permettant de s'authentifier
à l'API Trackdéchets. Pour ce faire, il doit être passé dans le
header d'autorisation `Authorization: Bearer ******`

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>user</strong></td>
<td valign="top"><a href="#user">User</a>!</td>
<td>

Utilisateur lié au token

</td>
</tr>
</tbody>
</table>

### Broker

Courtier

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement courtier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Limite de validité

</td>
</tr>
</tbody>
</table>

### BrokerReceipt

Récépissé courtier

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receiptNumber</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Numéro de récépissé courtier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Limite de validité du récépissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Département ayant enregistré la déclaration

</td>
</tr>
</tbody>
</table>

### Bsdasri

Bordereau Bsdasri

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#bsdasristatus">BsdasriStatus</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createdAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isDraft</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#bsdasriemitter">BsdasriEmitter</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emission</strong></td>
<td valign="top"><a href="#bsdasriemission">BsdasriEmission</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#bsdasritransporter">BsdasriTransporter</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transport</strong></td>
<td valign="top"><a href="#bsdasritransport">BsdasriTransport</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#bsdasrirecipient">BsdasriRecipient</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>reception</strong></td>
<td valign="top"><a href="#bsdasrireception">BsdasriReception</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>operation</strong></td>
<td valign="top"><a href="#bsdasrioperation">BsdasriOperation</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>regroupedBsdasris</strong></td>
<td valign="top">[<a href="#id">ID</a>!]</td>
<td>

Bordereaux regroupés

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>metadata</strong></td>
<td valign="top"><a href="#bsdasrimetadata">BsdasriMetadata</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriConnection

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>totalCount</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>pageInfo</strong></td>
<td valign="top"><a href="#pageinfo">PageInfo</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>edges</strong></td>
<td valign="top">[<a href="#bsdasriedge">BsdasriEdge</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriEdge

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>cursor</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>node</strong></td>
<td valign="top"><a href="#bsdasri">Bsdasri</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriEmission

Informations relatives au déchet émis

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>wasteCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#bsdasriwastedetails">BsdasriWasteDetails</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>handedOverAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#bsdasrisignature">BsdasriSignature</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriEmitter

Émetteur du Bsdasri, Personne responsable de l'émimination des déchets (PRED)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>workSite</strong></td>
<td valign="top"><a href="#worksite">WorkSite</a></td>
<td>

Site d'emport du déceht, si différent de celle de l'émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>handOverToTransporterAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de remise au tranporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customInfo</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Champ libre

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#bsdasriemittertype">BsdasriEmitterType</a></td>
<td>

Type d'émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onBehalfOfEcoorganisme</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Agit pour le compte de l'éco organisme agréé

</td>
</tr>
</tbody>
</table>

### BsdasriError

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>message</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>path</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>requiredFor</strong></td>
<td valign="top">[<a href="#bsdasrisignaturetype">BsdasriSignatureType</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriMetadata

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>errors</strong></td>
<td valign="top">[<a href="#bsdasrierror">BsdasriError</a>]!</td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriOperation

Informations relatives au traitement du Bsdasri

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#bsdasrisignature">BsdasriSignature</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriPackagingInfo

Informations sur le conditionnement Bsdasri

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#bsdasripackagings">BsdasriPackagings</a>!</td>
<td>

Type de conditionnement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>other</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Description du conditionnement dans le cas où le type de conditionnement est `AUTRE`

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Nombre de colis associés à ce conditionnement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>volume</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriReception

Informations relatives à la réception du Bsdasri

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#bsdasriwastedetails">BsdasriWasteDetails</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteAcceptation</strong></td>
<td valign="top"><a href="#bsdasriwasteacceptation">BsdasriWasteAcceptation</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#bsdasrisignature">BsdasriSignature</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriRecipient

Destinataire du Bsdasri

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Installation destinataire

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customInfo</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Champ libre

</td>
</tr>
</tbody>
</table>

### BsdasriSignature

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>date</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>author</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriTransport

Informations relatives au transport du Bsdasri

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#bsdasriwastedetails">BsdasriWasteDetails</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteAcceptation</strong></td>
<td valign="top"><a href="#bsdasriwasteacceptation">BsdasriWasteAcceptation</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>handedOverAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>takenOverAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#bsdasrisignature">BsdasriSignature</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriTransporter

Collecteur transporteur

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement de destination

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receiptDepartment</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receiptValidityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Limite de validité du récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customInfo</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Champ libre

</td>
</tr>
</tbody>
</table>

### BsdasriWasteAcceptation

Informations relatives à l'acceptation ou au refus du déchet (Bsdasri)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>refusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>refusedQuantity</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriWasteDetails

Détail sur le déchet proprement dit du Bsdasri

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityType</strong></td>
<td valign="top"><a href="#quantitytype">QuantityType</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>volume</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagingInfos</strong></td>
<td valign="top">[<a href="#bsdasripackaginginfo">BsdasriPackagingInfo</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onuCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Bsff

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Identifiant unique assigné par Trackdéchets.
Il est à utiliser pour les échanges avec l'API.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#bsffemitter">BsffEmitter</a></td>
<td>

Émetteur du déchet, qui n'est pas nécessairement le producteur.
Il s'agit par exemple de l'opérateur ayant collecté des fluides lors d'interventions,
ou alors d'une installation de collecte qui procède à la réexpédition pour traitement final.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagings</strong></td>
<td valign="top">[<a href="#bsffpackaging">BsffPackaging</a>!]!</td>
<td>

Liste des contenants utilisés pour le transport des fluides.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>waste</strong></td>
<td valign="top"><a href="#bsffwaste">BsffWaste</a></td>
<td>

Description du déchet et ses mentions associées.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#bsffquantity">BsffQuantity</a></td>
<td>

Quantité totale du déchet, qu'elle soit réelle ou estimée.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#bsfftransporter">BsffTransporter</a></td>
<td>

Transporteur du déchet, effectue l'enlèvement du déchet auprès de l'émetteur et vers la destination.
À noter que l'émetteur peut également être transporteur,
par exemple dans le cas de l'opérateur qui dépose lui même ses contenants auprès d'une installation de collecte.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>destination</strong></td>
<td valign="top"><a href="#bsffdestination">BsffDestination</a></td>
<td>

Destination du déchet, qui peut le réceptionner pour traitement, regroupement, reconditionnement ou réexpedition.
Un nouveau bordereau doit être créé si le déchet connaît un nouveau parcours,
par exemple si il quitte une installation de collecte pour un centre de traitement.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>ficheInterventions</strong></td>
<td valign="top">[<a href="#bsffficheintervention">BsffFicheIntervention</a>!]!</td>
<td>

Liste des fiches d'intervention associés à ce bordereau.
Habituellement renseigné par un opérateur lors de son intervention.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>bsffs</strong></td>
<td valign="top">[<a href="#bsff">Bsff</a>!]!</td>
<td>

Liste des bordereaux que celui-ci regroupe, dans le cas d'un regroupement, reconditionnement ou d'une réexpédition.

</td>
</tr>
</tbody>
</table>

### BsffDestination

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a>!</td>
<td>

Entreprise réceptionant le déchet.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>reception</strong></td>
<td valign="top"><a href="#bsffreception">BsffReception</a></td>
<td>

Déclaration de réception du déchet.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>operation</strong></td>
<td valign="top"><a href="#bsffoperation">BsffOperation</a></td>
<td>

Déclaration de traitement du déchet.

</td>
</tr>
</tbody>
</table>

### BsffEmission

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#signature">Signature</a>!</td>
<td>

Signature de l'émetteur lors de l'enlèvement par le transporteur.

</td>
</tr>
</tbody>
</table>

### BsffEmitter

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a>!</td>
<td>

Entreprise émettant le déchet.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emission</strong></td>
<td valign="top"><a href="#bsffemission">BsffEmission</a></td>
<td>

Déclaration de l'émetteur lors de l'enlèvement par le transporteur.

</td>
</tr>
</tbody>
</table>

### BsffFicheIntervention

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Identifiant unique assigné par Trackdéchets.
Il est à utiliser pour les échanges avec l'API.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>numero</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Numéro de la fiche d'intervention, habituellement renseigné par l'opérateur.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>kilos</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Poids total des fluides récupérés lors de cette intervention.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>owner</strong></td>
<td valign="top"><a href="#bsffowner">BsffOwner</a>!</td>
<td>

Détenteur de l'équipement sur lequel est intervenu l'opérateur.
À noter que ces informations ont une visiblité limité, afin de ne pas dévoiler d'informations commerciales.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>postalCode</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Code postal du lieu où l'intervention a eu lieu.

</td>
</tr>
</tbody>
</table>

### BsffOperation

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>code</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Code de l'opération de traitement.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#signature">Signature</a></td>
<td>

Signature de la destination lors du traitement.

</td>
</tr>
</tbody>
</table>

### BsffOwner

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a>!</td>
<td>

Entreprise détentrice de l'équipement.

</td>
</tr>
</tbody>
</table>

### BsffPackaging

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>numero</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Numéro du contenant.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#bsffpackagingtype">BsffPackagingType</a>!</td>
<td>

Type de contenant.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>litres</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Volume en litres des fluides à l'intérieur du contenant.

</td>
</tr>
</tbody>
</table>

### BsffQuantity

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>kilos</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Poids total du déchet en kilos.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isEstimate</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Si il s'agit d'une estimation ou d'un poids réel.

</td>
</tr>
</tbody>
</table>

### BsffReception

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>date</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date de réception du déchet.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>kilos</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Quantité totale du déchet, qu'elle soit réelle ou estimée.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>refusal</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

En cas de refus, le motif.

</td>
</tr>
</tbody>
</table>

### BsffTransport

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#signature">Signature</a></td>
<td>

Signature du transporteur lors de l'enlèvement auprès de l'émetteur.

</td>
</tr>
</tbody>
</table>

### BsffTransporter

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a>!</td>
<td>

Entreprise responsable du transport du déchet.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recepisse</strong></td>
<td valign="top"><a href="#bsfftransporterrecepisse">BsffTransporterRecepisse</a></td>
<td>

Récépissé du transporteur, à moins d'être exempté.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transport</strong></td>
<td valign="top"><a href="#bsfftransport">BsffTransport</a></td>
<td>

Déclaration du transporteur lors de l'enlèvement auprès de l'émetteur.

</td>
</tr>
</tbody>
</table>

### BsffTransporterRecepisse

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>number</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Numéro du récépissé.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Département auquel est lié le récépissé.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date limite de validité du récépissé.

</td>
</tr>
</tbody>
</table>

### BsffWaste

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>code</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Code déchet.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>description</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Description du déchet, permet de le qualifier de façon plus précise.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>adr</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Mention ADR.

</td>
</tr>
</tbody>
</table>

### Bsvhu

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Numéro unique attribué par Trackdéchets

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createdAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date de création

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date de dernière modification

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isDraft</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Indique si le bordereau est à l'état de brouillon

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#bsvhustatus">BsvhuStatus</a>!</td>
<td>

Status du bordereau

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#bsvhuemitter">BsvhuEmitter</a></td>
<td>

Émetteur du bordereau

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code déchet. Presque toujours 16 01 06

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packaging</strong></td>
<td valign="top"><a href="#bsvhupackaging">BsvhuPackaging</a></td>
<td>

Conditionnement du déchet

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>identification</strong></td>
<td valign="top"><a href="#bsvhuidentification">BsvhuIdentification</a></td>
<td>

Identification des VHUs

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#bsvhuquantity">BsvhuQuantity</a></td>
<td>

Quantité de VHUs

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>destination</strong></td>
<td valign="top"><a href="#bsvhudestination">BsvhuDestination</a></td>
<td>

Destinataire du bordereau

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#bsvhutransporter">BsvhuTransporter</a></td>
<td>

Transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>metadata</strong></td>
<td valign="top"><a href="#bsvhumetadata">BsvhuMetadata</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuConnection

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>totalCount</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>pageInfo</strong></td>
<td valign="top"><a href="#pageinfo">PageInfo</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>edges</strong></td>
<td valign="top">[<a href="#bsvhuedge">BsvhuEdge</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuDestination

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#bsvhudestinationtype">BsvhuDestinationType</a></td>
<td>

Type de receveur: broyeur ou second centre VHU

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>agrementNumber</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro d'agrément de receveur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Coordonnées de l'entreprise qui recoit les déchets

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>plannedOperationCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Opération d'élimination / valorisation prévue (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>reception</strong></td>
<td valign="top"><a href="#bsvhureception">BsvhuReception</a></td>
<td>

Informations de réception

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>operation</strong></td>
<td valign="top"><a href="#bsvhuoperation">BsvhuOperation</a></td>
<td>

Informations sur l'opétation de traitement

</td>
</tr>
</tbody>
</table>

### BsvhuEdge

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>cursor</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>node</strong></td>
<td valign="top"><a href="#bsvhu">Bsvhu</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuEmission

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#signature">Signature</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuEmitter

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>agrementNumber</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro d'agrément émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Coordonnées de l'entreprise émétrice

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emission</strong></td>
<td valign="top"><a href="#bsvhuemission">BsvhuEmission</a></td>
<td>

Déclaration générale de l'émetteur du bordereau

</td>
</tr>
</tbody>
</table>

### BsvhuError

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>message</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>path</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>requiredFor</strong></td>
<td valign="top"><a href="#signaturetypeinput">SignatureTypeInput</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuIdentification

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>numbers</strong></td>
<td valign="top">[<a href="#string">String</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#bsvhuidentificationtype">BsvhuIdentificationType</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuMetadata

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>errors</strong></td>
<td valign="top">[<a href="#bsvhuerror">BsvhuError</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuNextDestination

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuOperation

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>date</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de réalisation

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>code</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Opération de traitement réalisée (R4 ou R12)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>nextDestination</strong></td>
<td valign="top"><a href="#bsvhunextdestination">BsvhuNextDestination</a></td>
<td>

Broyeur de destination, à remplir uniquement lorsque la destination est lui même un centre VHU

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#signature">Signature</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuQuantity

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>number</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>tons</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuRecepisse

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>number</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuReception

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>date</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de présentation sur site

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#bsvhuquantity">BsvhuQuantity</a></td>
<td>

Quantité réelle reçue

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>acceptationStatus</strong></td>
<td valign="top"><a href="#bsvhuacceptationstatus">BsvhuAcceptationStatus</a></td>
<td>

Lot accepté oui/non

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>refusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Motif de refus

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>identification</strong></td>
<td valign="top"><a href="#bsvhuidentification">BsvhuIdentification</a></td>
<td>

Identification éventuelle des VHU à la reception (numéro de lots ou d'ordre)

</td>
</tr>
</tbody>
</table>

### BsvhuTransport

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>takenOverAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de prise en charge

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#signature">Signature</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuTransporter

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Coordonnées de l'entreprise de transport

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recepisse</strong></td>
<td valign="top"><a href="#bsvhurecepisse">BsvhuRecepisse</a></td>
<td>

Récépissé transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transport</strong></td>
<td valign="top"><a href="#bsvhutransport">BsvhuTransport</a></td>
<td>

Informations liés au transport

</td>
</tr>
</tbody>
</table>

### CompanyMember

Information sur utilisateur au sein d'un établissement

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Identifiant opaque

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>email</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Email

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'utilisateur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>role</strong></td>
<td valign="top"><a href="#userrole">UserRole</a></td>
<td>

Rôle de l'utilisateur dans l'établissement (admin ou membre)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isActive</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui ou non l'email de l'utilisateur a été confirmé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isPendingInvitation</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui ou non une une invitation à joindre l'établissement est en attente

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isMe</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui ou non cet utilisateur correspond à l'utilisateur authentifié

</td>
</tr>
</tbody>
</table>

### CompanyPrivate

Information sur un établissement accessible par un utilisateur membre

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Identifiant opaque

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companyTypes</strong></td>
<td valign="top">[<a href="#companytype">CompanyType</a>!]!</td>
<td>

Profil de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>gerepId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant GEREP

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>securityCode</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Code de signature permettant de signer les BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>verificationStatus</strong></td>
<td valign="top"><a href="#companyverificationstatus">CompanyVerificationStatus</a>!</td>
<td>

État du processus de vérification de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contactEmail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Email de contact (visible sur la fiche entreprise)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contactPhone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de téléphone de contact (visible sur la fiche entreprise)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>website</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Site web (visible sur la fiche entreprise)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>users</strong></td>
<td valign="top">[<a href="#companymember">CompanyMember</a>!]</td>
<td>

Liste des utilisateurs appartenant à cet établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>userRole</strong></td>
<td valign="top"><a href="#userrole">UserRole</a></td>
<td>

Rôle de l'utilisateur authentifié cau sein de cet établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>givenName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom d'usage de l'entreprise qui permet de différencier
différents établissements ayant le même nom

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>naf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code NAF de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>libelleNaf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Libellé NAF de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>installation</strong></td>
<td valign="top"><a href="#installation">Installation</a></td>
<td>

Installation classée pour la protection de l'environnement (ICPE)
associé à cet établissement (le cas échéant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporterReceipt</strong></td>
<td valign="top"><a href="#transporterreceipt">TransporterReceipt</a></td>
<td>

Récépissé transporteur (le cas échéant, pour les profils transporteur)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>traderReceipt</strong></td>
<td valign="top"><a href="#traderreceipt">TraderReceipt</a></td>
<td>

Récépissé négociant (le cas échéant, pour les profils négociant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>brokerReceipt</strong></td>
<td valign="top"><a href="#brokerreceipt">BrokerReceipt</a></td>
<td>

Récépissé courtier (le cas échéant, pour les profils courtier)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>vhuAgrementDemolisseur</strong></td>
<td valign="top"><a href="#vhuagrement">VhuAgrement</a></td>
<td>

Agrément démolisseur (le cas échéant, pour les profils VHU)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>vhuAgrementBroyeur</strong></td>
<td valign="top"><a href="#vhuagrement">VhuAgrement</a></td>
<td>

Agrément broyeur (le cas échéant, pour les profils VHU)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>ecoOrganismeAgreements</strong></td>
<td valign="top">[<a href="#url">URL</a>!]!</td>
<td>

Liste des agréments de l'éco-organisme

</td>
</tr>
</tbody>
</table>

### CompanyPublic

Information sur un établissement accessible publiquement

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>contactEmail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Email de contact

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contactPhone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de téléphone de contact

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>website</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Site web

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>etatAdministratif</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

État administratif de l'établissement. A = Actif, F = Fermé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>naf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code NAF

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>libelleNaf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Libellé NAF

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>installation</strong></td>
<td valign="top"><a href="#installation">Installation</a></td>
<td>

Installation classée pour la protection de l'environnement (ICPE)
associé à cet établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isRegistered</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui on non cet établissement est inscrit sur la plateforme Trackdéchets

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companyTypes</strong></td>
<td valign="top">[<a href="#companytype">CompanyType</a>!]!</td>
<td>

Profil de l'établissement sur Trackdéchets
ayant pour valeur un tableau vide quand l'établissement
n'est pas inscrit sur la plateforme `isRegistered=false`

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporterReceipt</strong></td>
<td valign="top"><a href="#transporterreceipt">TransporterReceipt</a></td>
<td>

Récépissé transporteur associé à cet établissement (le cas échéant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>traderReceipt</strong></td>
<td valign="top"><a href="#traderreceipt">TraderReceipt</a></td>
<td>

Récépissé négociant associé à cet établissement (le cas échant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>brokerReceipt</strong></td>
<td valign="top"><a href="#brokerreceipt">BrokerReceipt</a></td>
<td>

Récépissé courtier associé à cet établissement (le cas échant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>vhuAgrementDemolisseur</strong></td>
<td valign="top"><a href="#vhuagrement">VhuAgrement</a></td>
<td>

Agrément VHU démolisseur (le cas échéant, pour les profils VHU)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>vhuAgrementBroyeur</strong></td>
<td valign="top"><a href="#vhuagrement">VhuAgrement</a></td>
<td>

Agrément VHU broyeur (le cas échéant, pour les profils VHU)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>ecoOrganismeAgreements</strong></td>
<td valign="top">[<a href="#url">URL</a>!]!</td>
<td>

Liste des agréments de l'éco-organisme

</td>
</tr>
</tbody>
</table>

### CompanySearchResult

Information sur un établissement accessible publiquement en recherche

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>etatAdministratif</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

État administratif de l'établissement. A = Actif, F = Fermé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>codeCommune</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code commune de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>naf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code NAF

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>libelleNaf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Libellé NAF

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>installation</strong></td>
<td valign="top"><a href="#installation">Installation</a></td>
<td>

Installation classée pour la protection de l'environnement (ICPE)
associé à cet établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporterReceipt</strong></td>
<td valign="top"><a href="#transporterreceipt">TransporterReceipt</a></td>
<td>

Récépissé transporteur associé à cet établissement (le cas échéant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>traderReceipt</strong></td>
<td valign="top"><a href="#traderreceipt">TraderReceipt</a></td>
<td>

Récépissé négociant associé à cet établissement (le cas échant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>brokerReceipt</strong></td>
<td valign="top"><a href="#brokerreceipt">BrokerReceipt</a></td>
<td>

Récépissé courtier associé à cet établissement (le cas échant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>vhuAgrementDemolisseur</strong></td>
<td valign="top"><a href="#vhuagrement">VhuAgrement</a></td>
<td>

Agrément VHU démolisseur (le cas échéant, pour les profils VHU)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>vhuAgrementBroyeur</strong></td>
<td valign="top"><a href="#vhuagrement">VhuAgrement</a></td>
<td>

Agrément VHU broyeur (le cas échéant, pour les profils VHU)

</td>
</tr>
</tbody>
</table>

### CompanyStat

Statistiques d'un établissement

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>stats</strong></td>
<td valign="top">[<a href="#stat">Stat</a>!]!</td>
<td>

Liste des statistiques

</td>
</tr>
</tbody>
</table>

### Declaration

Représente une ligne dans une déclaration GEREP

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>annee</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Année de la déclaration

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>codeDechet</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code du déchet

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>libDechet</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Description du déchet

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>gerepType</strong></td>
<td valign="top"><a href="#gereptype">GerepType</a></td>
<td>

Type de déclaration GEREP: producteur ou traiteur

</td>
</tr>
</tbody>
</table>

### Destination

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>cap</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de CAP (le cas échéant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Opération d'élimination / valorisation prévue (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement de destination

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isFilledByEmitter</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Indique si l'information a été saisie par l'émetteur du bordereau ou l'installation d'entreposage

</td>
</tr>
</tbody>
</table>

### EcoOrganisme

Eco-organisme
Les éco-organismes n'apparaissent pas en case 1 du bordereau mais sont quand même responsables du déchet.
C'est l'entreprise de collecte de déchet qui apparait en case 1.
Pour pouvoir saisir un éco-organisme, le détenteur du déchet doit être défini comme 'Autre détenteur'.
Seul un éco-organisme enregistré dans Trackdéchet peut être associé.

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Nom de l'éco-organisme

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Siret de l'éco-organisme

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Adresse de l'éco-organisme

</td>
</tr>
</tbody>
</table>

### Emitter

Émetteur du BSD (case 1)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#emittertype">EmitterType</a></td>
<td>

Type d'émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>workSite</strong></td>
<td valign="top"><a href="#worksite">WorkSite</a></td>
<td>

Adresse du chantier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>pickupSite</strong> ⚠️</td>
<td valign="top"><a href="#string">String</a></td>
<td>

DEPRECATED - Ancienne adresse chantier

<p>⚠️ <strong>DEPRECATED</strong></p>
<blockquote>

Migration vers `workSite` obligatoire

</blockquote>
</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement émetteur

</td>
</tr>
</tbody>
</table>

### FileDownload

URL de téléchargement accompagné d'un token
permettant de valider le téléchargement.

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>token</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Token ayant une durée de validité de 10s

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>downloadLink</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Lien de téléchargement

</td>
</tr>
</tbody>
</table>

### Form

Bordereau de suivi de déchets (BSD)
Version dématérialisée du [CERFA n°12571*01](https://www.service-public.fr/professionnels-entreprises/vosdroits/R14334)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Identifiant unique du bordereau.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>readableId</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Identifiant lisible utilisé comme numéro sur le CERFA (case "Bordereau n°****").
Il est possible de l'utiliser pour récupérer l'identifiant unique du bordereau via la query form,
utilisé pour le reste des opérations.
Cet identifiant possède le format BSD-{yyyyMMdd}-{XXXXXXXX} où yyyyMMdd est la date du jour
et XXXXXXXXX une chaine de 9 caractères alphanumériques. Ex: BSD-20210101-HY87F54D1

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant personnalisé permettant de faire le lien avec un
objet un système d'information tierce

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isImportedFromPaper</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Permet de savoir si les données du BSD ont été importées depuis un
bordereau signé papier via la mutation `importPaperForm`

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#emitter">Emitter</a></td>
<td>

Établissement émetteur/producteur du déchet (case 1)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#recipient">Recipient</a></td>
<td>

Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporter">Transporter</a></td>
<td>

Transporteur du déchet (case 8)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#wastedetails">WasteDetails</a></td>
<td>

Détails du déchet (case 3)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>trader</strong></td>
<td valign="top"><a href="#trader">Trader</a></td>
<td>

Négociant (case 7)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>broker</strong></td>
<td valign="top"><a href="#broker">Broker</a></td>
<td>

Courtier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createdAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de création du BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de la dernière modification du BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#formstatus">FormStatus</a>!</td>
<td>

Statut du BSD (brouillon, envoyé, reçu, traité, etc)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedByTransporter</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui ou non le BSD a été signé par un transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de l'envoi du déchet par l'émetteur (case 9)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de la personne responsable de l'envoi du déchet (case 9)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteAcceptationStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Statut d'acceptation du déchet (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteRefusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Raison du refus (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de la personne en charge de la réception du déchet (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date à laquelle le déchet a été reçu (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date à laquelle le déchet a été accepté ou refusé (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityReceived</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Quantité réelle présentée (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>actualQuantity</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Quantité actuellement connue en tonnes.
Elle est calculée en fonction des autres champs pour renvoyer la dernière quantité connue.
Elle renvoi ainsi soit la quantité envoyée estimée, soit la quantitée recue sur le site d'entreposage, soit la quantitée réelle recue.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperationDone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Traitement réalisé (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperationDescription</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Description de l'opération d’élimination / valorisation (case 11)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Personne en charge du traitement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date à laquelle le déchet a été traité

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>noTraceability</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui ou non il y a eu perte de traçabalité

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>nextDestination</strong></td>
<td valign="top"><a href="#nextdestination">NextDestination</a></td>
<td>

Destination ultérieure prévue (case 12)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>appendix2Forms</strong></td>
<td valign="top">[<a href="#form">Form</a>!]</td>
<td>

Annexe 2

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>ecoOrganisme</strong></td>
<td valign="top"><a href="#formecoorganisme">FormEcoOrganisme</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>temporaryStorageDetail</strong></td>
<td valign="top"><a href="#temporarystoragedetail">TemporaryStorageDetail</a></td>
<td>

BSD suite - détail des champs de la partie entreposage provisoire ou reconditionnement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>stateSummary</strong></td>
<td valign="top"><a href="#statesummary">StateSummary</a></td>
<td>

Résumé des valeurs clés du bordereau à l'instant T

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transportSegments</strong></td>
<td valign="top">[<a href="#transportsegment">TransportSegment</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>currentTransporterSiret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>nextTransporterSiret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### FormCompany

Information sur un établissement dans un BSD

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>country</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code ISO 3166-1 alpha-2 du pays d'origine de l'entreprise :
https://fr.wikipedia.org/wiki/ISO_3166-1_alpha-2

Seul la destination ultérieure case 12 (`form.nextDestination.company`) peut être à l'étranger.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contact</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom du contact dans l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de téléphone de contact dans l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>mail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Email du contact dans l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>vatNumber</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de TVA intracommunautaire

</td>
</tr>
</tbody>
</table>

### FormEcoOrganisme

Information sur l'éco-organisme responsable du BSD

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### FormSubscription

DEPRECATED - Privilégier l'utilisation d'un polling régulier sur la query `formsLifeCycle`

Mise à jour d'un BSD

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>mutation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Type de mutation

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>node</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

BSD concerné

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatedFields</strong></td>
<td valign="top">[<a href="#string">String</a>]</td>
<td>

Liste des champs mis à jour

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>previousValues</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Ancienne valeurs

</td>
</tr>
</tbody>
</table>

### Installation

Installation pour la protection de l'environnement (ICPE)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>codeS3ic</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant S3IC

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>urlFiche</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

URL de la fiche ICPE sur Géorisques

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>rubriques</strong></td>
<td valign="top">[<a href="#rubrique">Rubrique</a>!]</td>
<td>

Liste des rubriques associées

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>declarations</strong></td>
<td valign="top">[<a href="#declaration">Declaration</a>!]</td>
<td>

Liste des déclarations GEREP

</td>
</tr>
</tbody>
</table>

### MembershipRequest

Demande de rattachement à un établissement effectué par
un utilisateur.

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>email</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Email de l'utilisateur faisant la demande

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#membershiprequeststatus">MembershipRequestStatus</a>!</td>
<td>

Statut de la demande de rattachement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentTo</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td>

Liste des adresses email correspondant aux comptes administrateurs à qui la demande
de rattachement a été envoyée. Les adresses emails sont partiellement masquées de la
façon suivante j********w@trackdechets.fr

</td>
</tr>
</tbody>
</table>

### NextDestination

Destination ultérieure prévue (case 12)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Traitement prévue (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement ultérieure

</td>
</tr>
</tbody>
</table>

### PackagingInfo

Informations sur le conditionnement

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#packagings">Packagings</a>!</td>
<td>

Type de conditionnement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>other</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Description du conditionnement dans le cas où le type de conditionnement est `AUTRE`

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Nombre de colis associés à ce conditionnement

</td>
</tr>
</tbody>
</table>

### PageInfo

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>startCursor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>endCursor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>hasNextPage</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>hasPreviousPage</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### Recipient

Installation de destination ou d'entreprosage
ou de reconditionnement prévue (case 2)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>cap</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de CAP (le cas échéant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Opération d'élimination / valorisation prévue (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement de destination

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isTempStorage</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Indique si c'est un établissement d'entreposage temporaire ou de reocnditionnement

</td>
</tr>
</tbody>
</table>

### Rubrique

Rubrique ICPE d'un établissement avec les autorisations associées
Pour plus de détails, se référer à la
[nomenclature des ICPE](https://www.georisques.gouv.fr/articles-risques/les-installations-classees-pour-la-protection-de-lenvironnement#nomenclature-des-installations-classees)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>rubrique</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Numéro de rubrique tel que défini dans la nomenclature des ICPE
Ex: 2710

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>alinea</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Alinéa pour la rubrique concerné

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>etatActivite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

État de l'activité, ex: 'En fonct', 'À l'arrêt'

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>regimeAutorise</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Régime autorisé pour la rubrique: déclaratif, autorisation, seveso, etc

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>activite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Description de l'activité:
Ex: traitement thermique de déchets dangereux

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>category</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Catégorie d'établissement associé: TTR, VHU, Traitement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>volume</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Volume autorisé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>unite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Unité utilisé pour le volume autorisé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteType</strong></td>
<td valign="top"><a href="#wastetype">WasteType</a></td>
<td>

Type de déchets autorisé

</td>
</tr>
</tbody>
</table>

### Signature

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>date</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>author</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Stat

Statistiques

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>wasteCode</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Code déchet

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>incoming</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Quantité entrante

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>outgoing</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Qantité sortante

</td>
</tr>
</tbody>
</table>

### StateSummary

En fonction du statut du bordereau, différentes informations sont à lire pour connaitre vraiment l'étast du bordereau:
- la quantité peut changer entre émission, réception, entreposage provisoire...
- le bordereau peut naviguer entre plusieurs entreprises.
- quand le bordereau a-t-il été modifié pour la dernière fois ? (création, signature, traitement... ?)
- si c'est un bordereau avec conditionnement et qu'on attend un transporteur, quel est-il ?

Cet objet `StateSummary` vise à simplifier ces questions. Il renverra toujours la valeur pour un instant T donné.

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Quantité la plus à jour

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagings</strong> ⚠️</td>
<td valign="top">[<a href="#packagings">Packagings</a>!]!</td>
<td>

DEPRECATED Packaging le plus à jour

<p>⚠️ <strong>DEPRECATED</strong></p>
<blockquote>

Utiliser packagingInfos

</blockquote>
</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagingInfos</strong></td>
<td valign="top">[<a href="#packaginginfo">PackagingInfo</a>!]!</td>
<td>

Packaging le plus à jour

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onuCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code ONU le plus à jour

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Prochaine entreprise à transporter le déchet (entreprise en case 8 ou 18)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporterNumberPlate</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de plaque d'immatriculation

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporterCustomInfo</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Information libre, destinée aux transporteurs

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Prochaine entreprise à recevoir le déchet (entreprise en case 2 ou 14)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Prochaine entreprise à émettre le déchet (entreprise en case 1 ou 13)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>lastActionOn</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de la dernière action sur le bordereau

</td>
</tr>
</tbody>
</table>

### StatusLog

Changement de statut d'un bordereau

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Identifiant du log

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#formstatus">FormStatus</a></td>
<td>

Statut du bordereau après le changement de statut

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>loggedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date à laquelle le changement de statut a été effectué

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatedFields</strong></td>
<td valign="top"><a href="#json">JSON</a></td>
<td>

Valeur des champs transmis lors du changement de statut (eg. receivedBY, processingOperationDescription)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>form</strong></td>
<td valign="top"><a href="#statuslogform">StatusLogForm</a></td>
<td>

BSD concerné

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>user</strong></td>
<td valign="top"><a href="#statusloguser">StatusLogUser</a></td>
<td>

Utilisateur à l'origine de la modification

</td>
</tr>
</tbody>
</table>

### StatusLogForm

Information sur un BSD dans les logs de modifications de statuts

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Identifiant du BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>readableId</strong> ⚠️</td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° du bordereau

<p>⚠️ <strong>DEPRECATED</strong></p>
<blockquote>

Le readableId apparaît sur le CERFA mais l'id doit être utilisé comme identifiant.

</blockquote>
</td>
</tr>
</tbody>
</table>

### StatusLogUser

Utilisateur ayant modifié le BSD

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>email</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Subscription

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>forms</strong></td>
<td valign="top"><a href="#formsubscription">FormSubscription</a></td>
<td>

DEPRECATED - Privilégier l'utilisation d'un polling régulier sur la query `formsLifeCycle`

Permet de s'abonner aux changements de statuts d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">token</td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Token permettant de s'authentifier à l'API

</td>
</tr>
</tbody>
</table>

### TemporaryStorageDetail

Données du BSD suite sur la partie entreposage provisoire ou reconditionnement, rattachées à un BSD existant

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>temporaryStorer</strong></td>
<td valign="top"><a href="#temporarystorer">TemporaryStorer</a></td>
<td>

Établissement qui stocke temporairement le déchet (case 13)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>destination</strong></td>
<td valign="top"><a href="#destination">Destination</a></td>
<td>

Installation de destination prévue (case 14) à remplir par le producteur ou
le site d'entreposage provisoire

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#wastedetails">WasteDetails</a></td>
<td>

Détails du déchet (cases 15, 16 et 17)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporter">Transporter</a></td>
<td>

Transporteur du déchet (case 18)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom du signataire du BSD suite  (case 19)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de signature du BSD suite (case 19)

</td>
</tr>
</tbody>
</table>

### TemporaryStorer

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>quantityType</strong></td>
<td valign="top"><a href="#quantitytype">QuantityType</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityReceived</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteAcceptationStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteRefusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Trader

Négociant (case 7)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement négociant

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Limite de validité

</td>
</tr>
</tbody>
</table>

### TraderReceipt

Récépissé négociant

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receiptNumber</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Numéro de récépissé négociant

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Limite de validité du récépissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Département ayant enregistré la déclaration

</td>
</tr>
</tbody>
</table>

### TransportSegment

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>previousTransporterCompanySiret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Siret du transporteur précédent

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporter">Transporter</a></td>
<td>

Transporteur du segment

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>mode</strong></td>
<td valign="top"><a href="#transportmode">TransportMode</a></td>
<td>

Mode de transport

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>takenOverAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de prise en charge

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>takenOverBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Reponsable de la prise en charge

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>readyToTakeOver</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Prêt à être pris en charge

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>segmentNumber</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Numéro du segment

</td>
</tr>
</tbody>
</table>

### Transporter

Collecteur - transporteur (case 8)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement collecteur - transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isExemptedOfReceipt</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Exemption de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Limite de validité du récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>numberPlate</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de plaque d'immatriculation

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customInfo</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Information libre, destinée aux transporteurs

</td>
</tr>
</tbody>
</table>

### TransporterReceipt

Récépissé transporteur

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receiptNumber</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Numéro de récépissé transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Limite de validité du récépissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Département ayant enregistré la déclaration

</td>
</tr>
</tbody>
</table>

### User

Représente un utilisateur sur la plateforme Trackdéchets

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Identifiant opaque

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>email</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Email de l'utiliateur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'utilisateur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isAdmin</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Qualité d'administrateur. Rôle reservé aux agents de l'administration

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de téléphone de l'utilisateur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companies</strong></td>
<td valign="top">[<a href="#companyprivate">CompanyPrivate</a>!]!</td>
<td>

Liste des établissements dont l'utilisateur est membre

</td>
</tr>
</tbody>
</table>

### VhuAgrement

Agrément VHU

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>agrementNumber</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Numéro d'agrément VHU

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Département ayant enregistré la déclaration

</td>
</tr>
</tbody>
</table>

### WasteDetails

Détails du déchet (case 3, 4, 5, 6)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>code</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Rubrique déchet au format |_|_| |_|_| |_|_| (*)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Dénomination usuelle

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onuCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code ONU

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagingInfos</strong></td>
<td valign="top">[<a href="#packaginginfo">PackagingInfo</a>!]</td>
<td>

Conditionnements

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagings</strong> ⚠️</td>
<td valign="top">[<a href="#packagings">Packagings</a>!]</td>
<td>

Conditionnement

<p>⚠️ <strong>DEPRECATED</strong></p>
<blockquote>

Utiliser `packagingInfos`

</blockquote>
</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>otherPackaging</strong> ⚠️</td>
<td valign="top"><a href="#string">String</a></td>
<td>

Autre packaging (préciser)

<p>⚠️ <strong>DEPRECATED</strong></p>
<blockquote>

Utiliser `packagingInfos`

</blockquote>
</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>numberOfPackages</strong> ⚠️</td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Nombre de colis

<p>⚠️ <strong>DEPRECATED</strong></p>
<blockquote>

Utiliser `packagingInfos`

</blockquote>
</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Quantité en tonnes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityType</strong></td>
<td valign="top"><a href="#quantitytype">QuantityType</a></td>
<td>

Réelle ou estimée

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>consistence</strong></td>
<td valign="top"><a href="#consistence">Consistence</a></td>
<td>

Consistance

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>pop</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Contient des Polluants Organiques Persistants (POP) oui / non

</td>
</tr>
</tbody>
</table>

### WorkSite

Informations sur une adresse chantier

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>city</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>postalCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>infos</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### formsLifeCycleData

Informations du cycle de vie des bordereaux

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>statusLogs</strong></td>
<td valign="top">[<a href="#statuslog">StatusLog</a>!]!</td>
<td>

Liste des changements de statuts

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>hasNextPage</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

pagination, indique si d'autres pages existent après

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>hasPreviousPage</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

pagination, indique si d'autres pages existent avant

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>startCursor</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Premier id de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>endCursor</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Dernier ID de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>count</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Nombre de changements de statuts renvoyés

</td>
</tr>
</tbody>
</table>

## Inputs

### AcceptedFormInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>wasteAcceptationStatus</strong></td>
<td valign="top"><a href="#wasteacceptationstatusinput">WasteAcceptationStatusInput</a>!</td>
<td>

Statut d'acceptation du déchet (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteRefusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Raison du refus (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date à laquelle le déchet a été accepté ou refusé (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Nom de la personne en charge de l'acceptation' du déchet (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityReceived</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Quantité réelle présentée (case 10)

</td>
</tr>
</tbody>
</table>

### AppendixFormInput

Payload de création d'une annexe 2

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Identifiant unique du bordereau

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>readableId</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

N° de bordereau

Déprécié : L'id du bordereau doit être utilisé comme identifiant (paramètre id).
Le readableId permet de le récupérer via la query form.

</td>
</tr>
</tbody>
</table>

### BrokerInput

Payload lié au courtier

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Limite de validité

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Établissement courtier

</td>
</tr>
</tbody>
</table>

### BsdasriCompanyWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriCreateInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#bsdasriemitterinput">BsdasriEmitterInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emission</strong></td>
<td valign="top"><a href="#bsdasriemissioninput">BsdasriEmissionInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#bsdasritransporterinput">BsdasriTransporterInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transport</strong></td>
<td valign="top"><a href="#bsdasritransportinput">BsdasriTransportInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#bsdasrirecipientinput">BsdasriRecipientInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>reception</strong></td>
<td valign="top"><a href="#bsdasrireceptioninput">BsdasriReceptionInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>operation</strong></td>
<td valign="top"><a href="#bsdasrioperationinput">BsdasriOperationInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>regroupedBsdasris</strong></td>
<td valign="top">[<a href="#regroupedbsdasriinput">RegroupedBsdasriInput</a>]</td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriEmissionInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>wasteCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#bsdasriwastedetailinput">BsdasriWasteDetailInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>handedOverAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriEmitterInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#bsdasriemittertype">BsdasriEmitterType</a></td>
<td>

Établissement émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>workSite</strong></td>
<td valign="top"><a href="#worksiteinput">WorkSiteInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customInfo</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Champ libre émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onBehalfOfEcoorganisme</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriEmitterWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#bsdasricompanywhere">BsdasriCompanyWhere</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#bsdasrisignaturewhere">BsdasriSignatureWhere</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#bsdasriemitterinput">BsdasriEmitterInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emission</strong></td>
<td valign="top"><a href="#bsdasriemissioninput">BsdasriEmissionInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#bsdasritransporterinput">BsdasriTransporterInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transport</strong></td>
<td valign="top"><a href="#bsdasritransportinput">BsdasriTransportInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#bsdasrirecipientinput">BsdasriRecipientInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>reception</strong></td>
<td valign="top"><a href="#bsdasrireceptioninput">BsdasriReceptionInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>operation</strong></td>
<td valign="top"><a href="#bsdasrioperationinput">BsdasriOperationInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriOperationInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriPackagingInfoInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#bsdasripackagings">BsdasriPackagings</a>!</td>
<td>

Type de conditionnement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>other</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Description du conditionnement dans le cas où le type de conditionnement est `AUTRE`

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>volume</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Nombre de colis associés à ce conditionnement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Nombre de colis associés à ce conditionnement

</td>
</tr>
</tbody>
</table>

### BsdasriReceptionInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#bsdasriwastedetailinput">BsdasriWasteDetailInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteAcceptation</strong></td>
<td valign="top"><a href="#bsdasriwasteacceptationinput">BsdasriWasteAcceptationInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriRecipientInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Établissement émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customInfo</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Champ libre transporteur

</td>
</tr>
</tbody>
</table>

### BsdasriRecipientWasteDetailInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>volume</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriRecipientWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#bsdasricompanywhere">BsdasriCompanyWhere</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#bsdasrisignaturewhere">BsdasriSignatureWhere</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriSignatureInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#bsdasrisignaturetype">BsdasriSignatureType</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>author</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriSignatureWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>date</strong></td>
<td valign="top"><a href="#datefilter">DateFilter</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriSignatureWithSecretCodeInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>author</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>securityCode</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriTransportInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#bsdasriwastedetailinput">BsdasriWasteDetailInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>takenOverAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>handedOverAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteAcceptation</strong></td>
<td valign="top"><a href="#bsdasriwasteacceptationinput">BsdasriWasteAcceptationInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriTransporterInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Établissement collecteur - transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receiptDepartment</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receiptValidityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Limite de validité du récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customInfo</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Champ libre transporteur

</td>
</tr>
</tbody>
</table>

### BsdasriTransporterWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#bsdasricompanywhere">BsdasriCompanyWhere</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#bsdasrisignaturewhere">BsdasriSignatureWhere</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriUpdateInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#bsdasriemitterinput">BsdasriEmitterInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emission</strong></td>
<td valign="top"><a href="#bsdasriemissioninput">BsdasriEmissionInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#bsdasritransporterinput">BsdasriTransporterInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transport</strong></td>
<td valign="top"><a href="#bsdasritransportinput">BsdasriTransportInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#bsdasrirecipientinput">BsdasriRecipientInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>reception</strong></td>
<td valign="top"><a href="#bsdasrireceptioninput">BsdasriReceptionInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>operation</strong></td>
<td valign="top"><a href="#bsdasrioperationinput">BsdasriOperationInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>regroupedBsdasris</strong></td>
<td valign="top">[<a href="#regroupedbsdasriinput">RegroupedBsdasriInput</a>]</td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriWasteAcceptationInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#wasteacceptationstatusinput">WasteAcceptationStatusInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>refusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>refusedQuantity</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriWasteDetailInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityType</strong></td>
<td valign="top"><a href="#quantitytype">QuantityType</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagingInfos</strong></td>
<td valign="top">[<a href="#bsdasripackaginginfoinput">BsdasriPackagingInfoInput</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onuCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsdasriWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>isDraft</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

(Optionnel) Permet de récupérer uniquement les bordereaux en brouillon

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#bsdasristatus">BsdasriStatus</a></td>
<td>

(Optionnel) Filtre sur le statut des bordereaux
Si aucun filtre n'est passé, les bordereaux seront retournés quel que soit leur statut
Défaut à vide.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createdAt</strong></td>
<td valign="top"><a href="#datefilter">DateFilter</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatedAt</strong></td>
<td valign="top"><a href="#datefilter">DateFilter</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#bsdasriemitterwhere">BsdasriEmitterWhere</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#bsdasritransporterwhere">BsdasriTransporterWhere</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#bsdasrirecipientwhere">BsdasriRecipientWhere</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top">[<a href="#processingoperationtypes">processingOperationTypes</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>groupable</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

(Optionnel) Filtre sur l'état de regroupement des bordereaux
Si aucun filtre n'est passé, les bordereaux seront retournés sans filtrage supplémentaire
Si groupable: true, les bordereaux retournés ne sont pas déjà regroupés et ne regroupent pas d'autres bordereaux
Si groupable: false, les bordereaux retournés ne sont déjà regroupés ou ne regroupent d'autres bordereaux

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>_and</strong></td>
<td valign="top">[<a href="#bsdasriwhere">BsdasriWhere</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>_or</strong></td>
<td valign="top">[<a href="#bsdasriwhere">BsdasriWhere</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>_not</strong></td>
<td valign="top">[<a href="#bsdasriwhere">BsdasriWhere</a>!]</td>
<td></td>
</tr>
</tbody>
</table>

### BsffDestinationInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsffEmitterInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsffInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#bsffemitterinput">BsffEmitterInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagings</strong></td>
<td valign="top">[<a href="#bsffpackaginginput">BsffPackagingInput</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>waste</strong></td>
<td valign="top"><a href="#bsffwasteinput">BsffWasteInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#bsffquantityinput">BsffQuantityInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#bsfftransporterinput">BsffTransporterInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>destination</strong></td>
<td valign="top"><a href="#bsffdestinationinput">BsffDestinationInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsffPackagingInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>numero</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#bsffpackagingtype">BsffPackagingType</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>litres</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsffQuantityInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>kilos</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isEstimate</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsffTransporterInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recepisse</strong></td>
<td valign="top"><a href="#bsfftransporterrecepisseinput">BsffTransporterRecepisseInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsffTransporterRecepisseInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>number</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsffWasteInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>code</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>description</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>adr</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuCompanyWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuDestinationInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#bsvhudestinationtype">BsvhuDestinationType</a></td>
<td>

Type de receveur: broyeur ou second centre VHU

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>agrementNumber</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro d'agrément de receveur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Coordonnées de l'entreprise qui recoit les déchets

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>plannedOperationCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Opération d'élimination / valorisation prévue (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>reception</strong></td>
<td valign="top"><a href="#bsvhureceptioninput">BsvhuReceptionInput</a></td>
<td>

Informations de réception

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>operation</strong></td>
<td valign="top"><a href="#bsvhuoperationinput">BsvhuOperationInput</a></td>
<td>

Informations sur l'opétation de traitement

</td>
</tr>
</tbody>
</table>

### BsvhuDestinationWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#bsvhucompanywhere">BsvhuCompanyWhere</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>operation</strong></td>
<td valign="top"><a href="#bsvhuoperationwhere">BsvhuOperationWhere</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuEmissionWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#bsvhusignaturewhere">BsvhuSignatureWhere</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuEmitterInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>agrementNumber</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro d'agrément émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Coordonnées de l'entreprise émétrice

</td>
</tr>
</tbody>
</table>

### BsvhuEmitterWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#bsvhucompanywhere">BsvhuCompanyWhere</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emission</strong></td>
<td valign="top"><a href="#bsvhuemissionwhere">BsvhuEmissionWhere</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuIdentificationInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>numbers</strong></td>
<td valign="top">[<a href="#string">String</a>]</td>
<td>

Numéros d'identification

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#bsvhuidentificationtype">BsvhuIdentificationType</a></td>
<td>

Type de numéros d'indentification

</td>
</tr>
</tbody>
</table>

### BsvhuInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#bsvhuemitterinput">BsvhuEmitterInput</a></td>
<td>

Détails sur l'émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code déchet. Presque toujours 16 01 06

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packaging</strong></td>
<td valign="top"><a href="#bsvhupackaging">BsvhuPackaging</a></td>
<td>

Conditionnement du déchet

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>identification</strong></td>
<td valign="top"><a href="#bsvhuidentificationinput">BsvhuIdentificationInput</a></td>
<td>

Identification des VHUs

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#bsvhuquantityinput">BsvhuQuantityInput</a></td>
<td>

Quantité de VHUs

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>destination</strong></td>
<td valign="top"><a href="#bsvhudestinationinput">BsvhuDestinationInput</a></td>
<td>

Détails sur la destination

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#bsvhutransporterinput">BsvhuTransporterInput</a></td>
<td>

Détails sur le transporteur

</td>
</tr>
</tbody>
</table>

### BsvhuNextDestinationInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuOperationInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>date</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de réalisation

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>code</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Opération de traitement réalisée (R4 ou R12)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>nextDestination</strong></td>
<td valign="top"><a href="#bsvhunextdestinationinput">BsvhuNextDestinationInput</a></td>
<td>

Broyeur de destination, à remplir uniquement lorsque la destination est lui même un centre VHU

</td>
</tr>
</tbody>
</table>

### BsvhuOperationWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#bsvhusignaturewhere">BsvhuSignatureWhere</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuQuantityInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>number</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Quantité en nombre (nombre de lots ou nombre de numéros d'ordre)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>tons</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Quantité en tonnes

</td>
</tr>
</tbody>
</table>

### BsvhuRecepisseInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>number</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuReceptionInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>date</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de présentation sur site

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#bsvhuquantityinput">BsvhuQuantityInput</a></td>
<td>

Quantité réelle reçue

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>acceptationStatus</strong></td>
<td valign="top"><a href="#wasteacceptationstatusinput">WasteAcceptationStatusInput</a></td>
<td>

Lot accepté oui/non

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>refusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Motif de refus

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>identification</strong></td>
<td valign="top"><a href="#bsvhuidentificationinput">BsvhuIdentificationInput</a></td>
<td>

Identification éventuelle des VHU à la reception (numéro de lots ou d'ordre)

</td>
</tr>
</tbody>
</table>

### BsvhuSignatureInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#signaturetypeinput">SignatureTypeInput</a>!</td>
<td>

Type de signature apposé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>date</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de la signature

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>author</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Nom et prénom du signataire

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>securityCode</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Code de sécurité de l'entreprise pour laquelle on signe. Permet de signer en tant que. Optionnel

</td>
</tr>
</tbody>
</table>

### BsvhuSignatureWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>date</strong></td>
<td valign="top"><a href="#datefilter">DateFilter</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuTransportInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>takenOverAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de prise en charge

</td>
</tr>
</tbody>
</table>

### BsvhuTransportWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>signature</strong></td>
<td valign="top"><a href="#bsvhusignaturewhere">BsvhuSignatureWhere</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuTransporterInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Coordonnées de l'entreprise de transport

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recepisse</strong></td>
<td valign="top"><a href="#bsvhurecepisseinput">BsvhuRecepisseInput</a></td>
<td>

Récépissé transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transport</strong></td>
<td valign="top"><a href="#bsvhutransportinput">BsvhuTransportInput</a></td>
<td>

Informations liés au transport

</td>
</tr>
</tbody>
</table>

### BsvhuTransporterWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#bsvhucompanywhere">BsvhuCompanyWhere</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transport</strong></td>
<td valign="top"><a href="#bsvhutransportwhere">BsvhuTransportWhere</a></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuWhere

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>isDraft</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

(Optionnel) Permet de récupérer uniquement les bordereaux en brouillon

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#bsvhustatus">BsvhuStatus</a></td>
<td>

(Optionnel) Filtre sur le statut des bordereaux
Si aucun filtre n'est passé, les bordereaux seront retournés quel que soit leur statut
Défaut à vide.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createdAt</strong></td>
<td valign="top"><a href="#datefilter">DateFilter</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatedAt</strong></td>
<td valign="top"><a href="#datefilter">DateFilter</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#bsvhuemitterwhere">BsvhuEmitterWhere</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#bsvhutransporterwhere">BsvhuTransporterWhere</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>destination</strong></td>
<td valign="top"><a href="#bsvhudestinationwhere">BsvhuDestinationWhere</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>_and</strong></td>
<td valign="top">[<a href="#bsvhuwhere">BsvhuWhere</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>_or</strong></td>
<td valign="top">[<a href="#bsvhuwhere">BsvhuWhere</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>_not</strong></td>
<td valign="top">[<a href="#bsvhuwhere">BsvhuWhere</a>!]</td>
<td></td>
</tr>
</tbody>
</table>

### CompanyInput

Payload d'un établissement

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contact</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom du contact dans l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>mail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Email du contact dans l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de téléphone de contact dans l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>vatNumber</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de TVA intracommunautaire

</td>
</tr>
</tbody>
</table>

### CreateFormInput

Payload de création d'un bordereau

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>customId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant personnalisé permettant de faire le lien avec un
objet un système d'information tierce

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#emitterinput">EmitterInput</a></td>
<td>

Établissement émetteur/producteur du déchet (case 1)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#recipientinput">RecipientInput</a></td>
<td>

Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
de traitement ou de tri, transit, regroupement.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporterinput">TransporterInput</a></td>
<td>

Transporteur du déchet (case 8)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#wastedetailsinput">WasteDetailsInput</a></td>
<td>

Détails du déchet (case 3)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>trader</strong></td>
<td valign="top"><a href="#traderinput">TraderInput</a></td>
<td>

Négociant (case 7)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>broker</strong></td>
<td valign="top"><a href="#brokerinput">BrokerInput</a></td>
<td>

Courtier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>appendix2Forms</strong></td>
<td valign="top">[<a href="#appendixforminput">AppendixFormInput</a>!]</td>
<td>

Annexe 2

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>ecoOrganisme</strong></td>
<td valign="top"><a href="#ecoorganismeinput">EcoOrganismeInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>temporaryStorageDetail</strong></td>
<td valign="top"><a href="#temporarystoragedetailinput">TemporaryStorageDetailInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### DateFilter

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>_eq</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>_gt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>_gte</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>_lt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>_lte</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
</tbody>
</table>

### DestinationInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Installation de destination prévue (case 14)
L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
de traitement ou de tri, transit, regroupement.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>cap</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de CAP prévu (le cas échéant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Opération d'élimination / valorisation prévue (code D/R)

</td>
</tr>
</tbody>
</table>

### EcoOrganismeInput

Payload de liason d'un BSD à un eco-organisme

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### EmitterInput

Payload lié à un l'émetteur du BSD (case 1)

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#emittertype">EmitterType</a></td>
<td>

Type d'émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>workSite</strong></td>
<td valign="top"><a href="#worksiteinput">WorkSiteInput</a></td>
<td>

Adresse du chantier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>pickupSite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

DEPRECATED - Ancienne adresse chantier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Établissement émetteur

</td>
</tr>
</tbody>
</table>

### FormInput

Payload de création d'un BSD

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Identifiant opaque

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant personnalisé permettant de faire le lien avec un
objet un système d'information tierce

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#emitterinput">EmitterInput</a></td>
<td>

Établissement émetteur/producteur du déchet (case 1)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#recipientinput">RecipientInput</a></td>
<td>

Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
de traitement ou de tri, transit, regroupement.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporterinput">TransporterInput</a></td>
<td>

Transporteur du déchet (case 8)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#wastedetailsinput">WasteDetailsInput</a></td>
<td>

Détails du déchet (case 3)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>trader</strong></td>
<td valign="top"><a href="#traderinput">TraderInput</a></td>
<td>

Négociant (case 7)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>broker</strong></td>
<td valign="top"><a href="#brokerinput">BrokerInput</a></td>
<td>

Courtier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>appendix2Forms</strong></td>
<td valign="top">[<a href="#appendixforminput">AppendixFormInput</a>!]</td>
<td>

Annexe 2

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>ecoOrganisme</strong></td>
<td valign="top"><a href="#ecoorganismeinput">EcoOrganismeInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>temporaryStorageDetail</strong></td>
<td valign="top"><a href="#temporarystoragedetailinput">TemporaryStorageDetailInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### ImportPaperFormInput

Payload d'import d'un BSD papier

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Numéro de BSD Trackdéchets (uniquement dans le cas d'une mise à jour d'un
bordereau émis initialement dans Trackdéchets)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant libre qui peut éventuellement servir à faire le lien dans Trackdéchets
entre le BSD papier et le BSD numérique dans le cas de l'import d'un BSD n'ayant
pas été émis initialement dans Trackdéchets.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#emitterinput">EmitterInput</a></td>
<td>

Établissement émetteur/producteur du déchet (case 1)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#recipientinput">RecipientInput</a></td>
<td>

Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
de traitement ou de tri, transit, regroupement.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporterinput">TransporterInput</a></td>
<td>

Transporteur du déchet (case 8)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#wastedetailsinput">WasteDetailsInput</a></td>
<td>

Détails du déchet (case 3)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>trader</strong></td>
<td valign="top"><a href="#traderinput">TraderInput</a></td>
<td>

Négociant (case 7)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>broker</strong></td>
<td valign="top"><a href="#brokerinput">BrokerInput</a></td>
<td>

Courtier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>ecoOrganisme</strong></td>
<td valign="top"><a href="#ecoorganismeinput">EcoOrganismeInput</a></td>
<td>

Éco-organisme (apparait en case 1)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signingInfo</strong></td>
<td valign="top"><a href="#signatureforminput">SignatureFormInput</a>!</td>
<td>

Informations liées aux signatures transporteur et émetteur (case 8 et 9)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedInfo</strong></td>
<td valign="top"><a href="#receivedforminput">ReceivedFormInput</a>!</td>
<td>

Informations liées à la réception du déchet (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedInfo</strong></td>
<td valign="top"><a href="#processedforminput">ProcessedFormInput</a>!</td>
<td>

Informations liées au traitement du déchet (case 11)

</td>
</tr>
</tbody>
</table>

### InternationalCompanyInput

Payload d'un établissement pouvant se situer en France
ou à l'étranger

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET de l'établissement, optionnel dans le cas d'un établissement à l'étranger

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>country</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code ISO 3166-1 alpha-2 du pays d'origine de l'entreprise :
https://fr.wikipedia.org/wiki/ISO_3166-1_alpha-2

En l'absence de code, l'entreprise est considérée comme résidant en France.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contact</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom du contact dans l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>mail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Email du contact dans l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de téléphone de contact dans l'établissement

</td>
</tr>
</tbody>
</table>

### NextDestinationInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Traitement prévue (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#internationalcompanyinput">InternationalCompanyInput</a>!</td>
<td>

Établissement de destination ultérieur

</td>
</tr>
</tbody>
</table>

### NextSegmentInfoInput

Payload lié à l'ajout de segment de transport multimodal (case 20 à 21)

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporterinput">TransporterInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>mode</strong></td>
<td valign="top"><a href="#transportmode">TransportMode</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### PackagingInfoInput

Payload lié à un élément de conditionnement

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#packagings">Packagings</a>!</td>
<td>

Type de conditionnement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>other</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Description du conditionnement dans le cas où le type de conditionnement est `AUTRE`

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Nombre de colis associés à ce conditionnement

</td>
</tr>
</tbody>
</table>

### ProcessedFormInput

Payload de traitement d'un BSD

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>processingOperationDone</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Traitement réalisé (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperationDescription</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Description de l'opération d’élimination / valorisation (case 11)
Elle se complète automatiquement lorsque non fournie

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Personne en charge du traitement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date à laquelle le déchet a été traité

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>nextDestination</strong></td>
<td valign="top"><a href="#nextdestinationinput">NextDestinationInput</a></td>
<td>

Destination ultérieure prévue (case 12)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>noTraceability</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui ou non il y a eu perte de traçabalité

</td>
</tr>
</tbody>
</table>

### ReceivedFormInput

Payload de réception d'un BSD

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>receivedBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Nom de la personne en charge de la réception du déchet (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date à laquelle le déchet a été reçu (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteAcceptationStatus</strong></td>
<td valign="top"><a href="#wasteacceptationstatusinput">WasteAcceptationStatusInput</a></td>
<td>

Statut d'acceptation du déchet (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteRefusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Raison du refus (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date à laquelle le déchet a été accepté ou refusé (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityReceived</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Quantité réelle présentée (case 10)

</td>
</tr>
</tbody>
</table>

### RecipientInput

Payload lié à l'installation de destination ou d'entreprosage
ou de reconditionnement prévue (case 2)

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>cap</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de CAP (le cas échéant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Opération d'élimination / valorisation prévue (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Établissement de destination

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isTempStorage</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si c'est un entreprosage provisoire ou reconditionnement

</td>
</tr>
</tbody>
</table>

### RegroupedBsdasriInput

Payload de regroupement

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Identifiant unique du bordereau

</td>
</tr>
</tbody>
</table>

### ResealedFormInput

Payload lié au détails du déchet du BSD suite (case 14 à 19)

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>destination</strong></td>
<td valign="top"><a href="#destinationinput">DestinationInput</a></td>
<td>

Destination finale du déchet (case 14)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#wastedetailsinput">WasteDetailsInput</a></td>
<td>

Détail du déchet en cas de reconditionnement (case 15 à 19)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporterinput">TransporterInput</a></td>
<td>

Transporteur du déchet reconditionné

</td>
</tr>
</tbody>
</table>

### ResentFormInput

Payload lié au détails du déchet du BSD suite et à la signature de l'envoi (case 14 à 20)

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>destination</strong></td>
<td valign="top"><a href="#destinationinput">DestinationInput</a></td>
<td>

Destination finale du déchet (case 14)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#wastedetailsinput">WasteDetailsInput</a></td>
<td>

Détail du déchet en cas de reconditionnement (case 15 à 19)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporterinput">TransporterInput</a></td>
<td>

Transporteur du déchet reconditionné

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Nom du signataire du BSD suite  (case 19)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date de signature du BSD suite (case 19). Défaut à la date d'aujourd'hui.

</td>
</tr>
</tbody>
</table>

### SentFormInput

Payload de signature d'un BSD

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>sentAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date de l'envoi du déchet par l'émetteur (case 9)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Nom de la personne responsable de l'envoi du déchet (case 9)

</td>
</tr>
</tbody>
</table>

### SignatureFormInput

Payload simplifié de signature d'un BSD par un transporteur

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>sentAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date de l'envoi du déchet par l'émetteur (case 9)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Nom de la personne responsable de l'envoi du déchet (case 9)

</td>
</tr>
</tbody>
</table>

### TakeOverInput

Payload de prise en charge de segment

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>takenOverAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>takenOverBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### TempStoredFormInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>wasteAcceptationStatus</strong></td>
<td valign="top"><a href="#wasteacceptationstatusinput">WasteAcceptationStatusInput</a></td>
<td>

Statut d'acceptation du déchet (case 13)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteRefusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Raison du refus (case 13)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Nom de la personne en charge de la réception du déchet (case 13)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date à laquelle le déchet a été reçu (case 13)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date à laquelle le déchet a été accepté ou refusé (case 13). Défaut à la date d'aujourd'hui.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityReceived</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Quantité réelle présentée (case 13)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityType</strong></td>
<td valign="top"><a href="#quantitytype">QuantityType</a>!</td>
<td>

Réelle ou estimée

</td>
</tr>
</tbody>
</table>

### TempStorerAcceptedFormInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>signedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date à laquelle le déchet a été accepté ou refusé (case 13).

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Nom de la personne en charge de l'acceptation du déchet (case 13)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteAcceptationStatus</strong></td>
<td valign="top"><a href="#wasteacceptationstatusinput">WasteAcceptationStatusInput</a>!</td>
<td>

Statut d'acceptation du déchet (case 13)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteRefusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Raison du refus (case 13)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityReceived</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Quantité réelle présentée (case 13)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityType</strong></td>
<td valign="top"><a href="#quantitytype">QuantityType</a>!</td>
<td>

Réelle ou estimée

</td>
</tr>
</tbody>
</table>

### TemporaryStorageDetailInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>destination</strong></td>
<td valign="top"><a href="#destinationinput">DestinationInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### TraderInput

Payload lié au négociant

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Limite de validité

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Établissement négociant

</td>
</tr>
</tbody>
</table>

### TransporterInput

Collecteur - transporteur (case 8)

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Établissement collecteur - transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isExemptedOfReceipt</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Exemption de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Limite de validité du récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>numberPlate</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de plaque d'immatriculation

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customInfo</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Information libre, destinée aux transporteurs

</td>
</tr>
</tbody>
</table>

### TransporterSignatureFormInput

Payload de signature d'un BSD par un transporteur

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>sentAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date de l'envoi du déchet par l'émetteur (case 9)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedByTransporter</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Si oui ou non le BSD a été signé par un transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>securityCode</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Code de signature permettant d'authentifier l'émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signatureAuthor</strong></td>
<td valign="top"><a href="#signatureauthor">SignatureAuthor</a></td>
<td>

Dénomination de l'auteur de la signature, par défaut il s'agit de l'émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Nom de la personne responsable de l'envoi du déchet (case 9)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedByProducer</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Si oui on non le BSD a été signé par l'émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagingInfos</strong></td>
<td valign="top">[<a href="#packaginginfoinput">PackagingInfoInput</a>!]</td>
<td>

Conditionnements

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagings</strong></td>
<td valign="top">[<a href="#packagings">Packagings</a>]</td>
<td>

DEPRECATED - Conditionnement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Quantité en tonnes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onuCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code ONU

</td>
</tr>
</tbody>
</table>

### UpdateFormInput

Payload de mise à jour d'un bordereau

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Identifiant opaque

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant personnalisé permettant de faire le lien avec un
objet un système d'information tierce

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#emitterinput">EmitterInput</a></td>
<td>

Établissement émetteur/producteur du déchet (case 1)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#recipientinput">RecipientInput</a></td>
<td>

Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
de traitement ou de tri, transit, regroupement.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporterinput">TransporterInput</a></td>
<td>

Transporteur du déchet (case 8)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#wastedetailsinput">WasteDetailsInput</a></td>
<td>

Détails du déchet (case 3)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>trader</strong></td>
<td valign="top"><a href="#traderinput">TraderInput</a></td>
<td>

Négociant (case 7)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>broker</strong></td>
<td valign="top"><a href="#brokerinput">BrokerInput</a></td>
<td>

Courtier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>appendix2Forms</strong></td>
<td valign="top">[<a href="#appendixforminput">AppendixFormInput</a>!]</td>
<td>

Annexe 2

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>ecoOrganisme</strong></td>
<td valign="top"><a href="#ecoorganismeinput">EcoOrganismeInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>temporaryStorageDetail</strong></td>
<td valign="top"><a href="#temporarystoragedetailinput">TemporaryStorageDetailInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### WasteDetailsInput

Payload lié au détails du déchet (case 3, 4, 5, 6)

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>code</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code du déchet dangereux ou non-dangereux qui doit faire partie de la liste officielle du code de l'environnement :
https://aida.ineris.fr/consultation_document/10327

Il doit être composé de 3 paires de deux chiffres séparés par un espace et se termine éventuellement par une astérisque.

Un exemple de déchet non-dangereux valide (déchets provenant de l'extraction des minéraux métallifères) :
01 01 01

Ce même exemple, mais avec un format invalide :
010101

Un exemple de déchet dangereux valide (stériles acidogènes provenant de la transformation du sulfure) :
01 03 04*

Ce même exemple, mais avec un format invalide :
010304 *

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Dénomination usuelle

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onuCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code ONU

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagingInfos</strong></td>
<td valign="top">[<a href="#packaginginfoinput">PackagingInfoInput</a>!]</td>
<td>

Conditionnements

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagings</strong></td>
<td valign="top">[<a href="#packagings">Packagings</a>]</td>
<td>

DEPRECATED - Conditionnement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>otherPackaging</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

DEPRECATED - Autre packaging (préciser)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>numberOfPackages</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

DEPRECATED - Nombre de colis

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Quantité en tonnes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityType</strong></td>
<td valign="top"><a href="#quantitytype">QuantityType</a></td>
<td>

Réelle ou estimée

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>consistence</strong></td>
<td valign="top"><a href="#consistence">Consistence</a></td>
<td>

Consistance

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>pop</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Contient des Polluants Organiques Persistants (POP) oui / non

</td>
</tr>
</tbody>
</table>

### WorkSiteInput

Payload d'une adresse chantier

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>city</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>infos</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>postalCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

## Enums

### BsdasriEmitterType

Type d'émetteur

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>PRODUCER</strong></td>
<td>

Producteur

</td>
</tr>
<tr>
<td valign="top"><strong>COLLECTOR</strong></td>
<td>

Installation de regroupement

</td>
</tr>
</tbody>
</table>

### BsdasriPackagings

Type de packaging du déchet

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>BOITE_CARTON</strong></td>
<td>

Caisse en carton avec sac en plastique

</td>
</tr>
<tr>
<td valign="top"><strong>FUT</strong></td>
<td>

Fûts ou jerrican à usage unique

</td>
</tr>
<tr>
<td valign="top"><strong>BOITE_PERFORANTS</strong></td>
<td>

Boîtes et Mini-collecteurs pour déchets perforants

</td>
</tr>
<tr>
<td valign="top"><strong>GRAND_EMBALLAGE</strong></td>
<td>

Grand emballage

</td>
</tr>
<tr>
<td valign="top"><strong>GRV</strong></td>
<td>

Grand récipient pour vrac

</td>
</tr>
<tr>
<td valign="top"><strong>AUTRE</strong></td>
<td>

Autre

</td>
</tr>
</tbody>
</table>

### BsdasriRole

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>TRANSPORTER</strong></td>
<td>

Les Bsdasri dont je suis transporteur

</td>
</tr>
<tr>
<td valign="top"><strong>RECIPIENT</strong></td>
<td>

Les Bsdasri dont je suis la destination de traitement

</td>
</tr>
<tr>
<td valign="top"><strong>EMITTER</strong></td>
<td>

Les Bsdasri dont je suis l'émetteur

</td>
</tr>
</tbody>
</table>

### BsdasriSignatureType

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>EMISSION</strong></td>
<td>

Signature du cadre émetteur (PRED)

</td>
</tr>
<tr>
<td valign="top"><strong>TRANSPORT</strong></td>
<td>

Signature du cadre collecteur transporteur

</td>
</tr>
<tr>
<td valign="top"><strong>RECEPTION</strong></td>
<td>

Signature de la réception du déchet

</td>
</tr>
<tr>
<td valign="top"><strong>OPERATION</strong></td>
<td>

Signature du traitement du déchet

</td>
</tr>
</tbody>
</table>

### BsdasriStatus

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>INITIAL</strong></td>
<td>

Bsdasri dans son état initial

</td>
</tr>
<tr>
<td valign="top"><strong>SIGNED_BY_PRODUCER</strong></td>
<td>

Optionnel, Bsdasri signé par la PRED (émetteur)

</td>
</tr>
<tr>
<td valign="top"><strong>SENT</strong></td>
<td>

Bsdasri envoyé vers l'établissement de destination

</td>
</tr>
<tr>
<td valign="top"><strong>RECEIVED</strong></td>
<td>

Bsdasri reçu par l'établissement de destination

</td>
</tr>
<tr>
<td valign="top"><strong>PROCESSED</strong></td>
<td>

Bsdasri dont les déchets ont été traités

</td>
</tr>
<tr>
<td valign="top"><strong>REFUSED</strong></td>
<td>

Déchet refusé

</td>
</tr>
</tbody>
</table>

### BsffPackagingType

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>BOUTEILLE</strong></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuAcceptationStatus

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ACCEPTED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>REFUSED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PARTIALLY_REFUSED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuDestinationType

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>BROYEUR</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DEMOLISSEUR</strong></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuIdentificationType

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>NUMERO_ORDRE_REGISTRE_POLICE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NUMERO_ORDRE_LOTS_SORTANTS</strong></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuPackaging

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>UNITE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>LOT</strong></td>
<td></td>
</tr>
</tbody>
</table>

### BsvhuStatus

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>INITIAL</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SIGNED_BY_PRODUCER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SENT</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PROCESSED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>REFUSED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### CompanyType

Profil entreprise

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>PRODUCER</strong></td>
<td>

Producteur de déchet

</td>
</tr>
<tr>
<td valign="top"><strong>COLLECTOR</strong></td>
<td>

Installation de Transit, regroupement ou tri de déchets

</td>
</tr>
<tr>
<td valign="top"><strong>WASTEPROCESSOR</strong></td>
<td>

Installation de traitement

</td>
</tr>
<tr>
<td valign="top"><strong>TRANSPORTER</strong></td>
<td>

Transporteur

</td>
</tr>
<tr>
<td valign="top"><strong>WASTE_VEHICLES</strong></td>
<td>

Installation de traitement de VHU (casse automobile et/ou broyeur agréé)

</td>
</tr>
<tr>
<td valign="top"><strong>WASTE_CENTER</strong></td>
<td>

Installation de collecte de déchets apportés par le producteur initial

</td>
</tr>
<tr>
<td valign="top"><strong>TRADER</strong></td>
<td>

Négociant

</td>
</tr>
<tr>
<td valign="top"><strong>BROKER</strong></td>
<td>

Courtier

</td>
</tr>
<tr>
<td valign="top"><strong>ECO_ORGANISME</strong></td>
<td>

Éco-organisme

</td>
</tr>
</tbody>
</table>

### CompanyVerificationStatus

État du processus de vérification de l'établissement

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>VERIFIED</strong></td>
<td>

L'établissement est vérifié

</td>
</tr>
<tr>
<td valign="top"><strong>TO_BE_VERIFIED</strong></td>
<td>

L'établissement vient d'être crée, en attente de vérifications manuelles par l'équipe Trackdéchets

</td>
</tr>
<tr>
<td valign="top"><strong>LETTER_SENT</strong></td>
<td>

Les vérifications manuelles n'ont pas abouties, une lettre a été envoyée à l'adresse enregistrée
auprès du registre du commerce et des sociétés

</td>
</tr>
</tbody>
</table>

### Consistence

Consistance du déchet

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>SOLID</strong></td>
<td>

Solide

</td>
</tr>
<tr>
<td valign="top"><strong>LIQUID</strong></td>
<td>

Liquide

</td>
</tr>
<tr>
<td valign="top"><strong>GASEOUS</strong></td>
<td>

Gazeux

</td>
</tr>
<tr>
<td valign="top"><strong>DOUGHY</strong></td>
<td>

Pâteux

</td>
</tr>
</tbody>
</table>

### EmitterType

Types d'émetteur de déchet (choix multiple de la case 1)

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>PRODUCER</strong></td>
<td>

Producetur de déchet

</td>
</tr>
<tr>
<td valign="top"><strong>OTHER</strong></td>
<td>

Autre détenteur

</td>
</tr>
<tr>
<td valign="top"><strong>APPENDIX1</strong></td>
<td>

Collecteur de petites quantités de déchets relevant de la même rubrique

</td>
</tr>
<tr>
<td valign="top"><strong>APPENDIX2</strong></td>
<td>

Personne ayant transformé ou réalisé un traitement dont la provenance des déchets reste identifiable

</td>
</tr>
</tbody>
</table>

### FormRole

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>TRANSPORTER</strong></td>
<td>

Les BSD's dont je suis transporteur

</td>
</tr>
<tr>
<td valign="top"><strong>RECIPIENT</strong></td>
<td>

Les BSD's dont je suis la destination de traitement

</td>
</tr>
<tr>
<td valign="top"><strong>EMITTER</strong></td>
<td>

Les BSD's dont je suis l'émetteur

</td>
</tr>
<tr>
<td valign="top"><strong>TRADER</strong></td>
<td>

Les BSD's dont je suis le négociant

</td>
</tr>
<tr>
<td valign="top"><strong>BROKER</strong></td>
<td>

Les BSD's dont je suis le courtier

</td>
</tr>
<tr>
<td valign="top"><strong>ECO_ORGANISME</strong></td>
<td>

Les BSD's dont je suis éco-organisme

</td>
</tr>
</tbody>
</table>

### FormStatus

Différents statuts d'un BSD au cours de son cycle de vie

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>DRAFT</strong></td>
<td>

BSD à l'état de brouillon
Des champs obligatoires peuvent manquer

</td>
</tr>
<tr>
<td valign="top"><strong>SEALED</strong></td>
<td>

BSD finalisé
Les champs sont validés pour détecter des valeurs manquantes ou erronnées

</td>
</tr>
<tr>
<td valign="top"><strong>SENT</strong></td>
<td>

BSD envoyé vers l'établissement de destination

</td>
</tr>
<tr>
<td valign="top"><strong>RECEIVED</strong></td>
<td>

BSD reçu par l'établissement de destination

</td>
</tr>
<tr>
<td valign="top"><strong>ACCEPTED</strong></td>
<td>

BSD accepté par l'établissement de destination

</td>
</tr>
<tr>
<td valign="top"><strong>PROCESSED</strong></td>
<td>

BSD dont les déchets ont été traités

</td>
</tr>
<tr>
<td valign="top"><strong>AWAITING_GROUP</strong></td>
<td>

BSD en attente de regroupement

</td>
</tr>
<tr>
<td valign="top"><strong>GROUPED</strong></td>
<td>

Regroupement effectué

</td>
</tr>
<tr>
<td valign="top"><strong>NO_TRACEABILITY</strong></td>
<td>

Perte de traçabalité

</td>
</tr>
<tr>
<td valign="top"><strong>REFUSED</strong></td>
<td>

Déchet refusé

</td>
</tr>
<tr>
<td valign="top"><strong>TEMP_STORED</strong></td>
<td>

Déchet arrivé sur le site d'entreposage ou reconditionnement

</td>
</tr>
<tr>
<td valign="top"><strong>TEMP_STORER_ACCEPTED</strong></td>
<td>

Déchet accepté par le site d'entreposage ou reconditionnement

</td>
</tr>
<tr>
<td valign="top"><strong>RESEALED</strong></td>
<td>

Déchet avec les cadres 14-19 complétées (si besoin), prêt à partir du site d'entreposage ou reconditionnement

</td>
</tr>
<tr>
<td valign="top"><strong>RESENT</strong></td>
<td>

Déchet envoyé du site d'entreposage ou reconditionnement vers sa destination de traitement

</td>
</tr>
</tbody>
</table>

### FormsRegisterExportFormat

Format de l'export du registre

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>CSV</strong></td>
<td>

Fichier csv

</td>
</tr>
<tr>
<td valign="top"><strong>XLSX</strong></td>
<td>

Fichier Excel

</td>
</tr>
</tbody>
</table>

### FormsRegisterExportType

Modèle de registre réglementaire tels que décrits dans l'arrêté du 29 février 2012 fixant
le contenu des registres mnetionnées aux articles R. 541-43 et R. 541-46 du code de l'environnement
https://www.legifrance.gouv.fr/affichTexte.do?cidTexte=JORFTEXT000025454959&categorieLien=id

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ALL</strong></td>
<td>

Registre exhaustif, déchets entrants et sortants

</td>
</tr>
<tr>
<td valign="top"><strong>OUTGOING</strong></td>
<td>

Registre producteur, déchets sortants
Art 1: Les exploitants des établissements produisant ou expédiant des déchets tiennent à jour
un registre chronologique où sont consignés tous les déchets sortants.

</td>
</tr>
<tr>
<td valign="top"><strong>INCOMING</strong></td>
<td>

Registre traiteur, TTR
Art 2: Les exploitants des installations de transit, de regroupement ou de traitement de déchets,
notamment de tri, établissent et tiennent à jour un registre chronologique où sont consignés
tous les déchets entrants.

</td>
</tr>
<tr>
<td valign="top"><strong>TRANSPORTED</strong></td>
<td>

Registre transporteur
Art 3: Les transporteurs et les collecteurs de déchets tiennent à jour un registre chronologique
des déchets transportés ou collectés.

</td>
</tr>
<tr>
<td valign="top"><strong>TRADED</strong></td>
<td>

Registre négociants
Art 4: Les négociants tiennent à jour un registre chronologique des déchets détenus.

</td>
</tr>
<tr>
<td valign="top"><strong>BROKERED</strong></td>
<td>

Registre courtier

</td>
</tr>
</tbody>
</table>

### GerepType

Type d'une déclaration GEREP

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>Producteur</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>Traiteur</strong></td>
<td></td>
</tr>
</tbody>
</table>

### MembershipRequestStatus

Différents statuts possibles pour une demande de rattachement
à un établissement

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>PENDING</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ACCEPTED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>REFUSED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### Packagings

Type de packaging du déchet

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>FUT</strong></td>
<td>

Fut

</td>
</tr>
<tr>
<td valign="top"><strong>GRV</strong></td>
<td>

GRV

</td>
</tr>
<tr>
<td valign="top"><strong>CITERNE</strong></td>
<td>

Citerne

</td>
</tr>
<tr>
<td valign="top"><strong>BENNE</strong></td>
<td>

Benne

</td>
</tr>
<tr>
<td valign="top"><strong>AUTRE</strong></td>
<td>

Autre

</td>
</tr>
</tbody>
</table>

### QuantityType

Type de quantité lors de l'émission

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>REAL</strong></td>
<td>

Quntité réelle

</td>
</tr>
<tr>
<td valign="top"><strong>ESTIMATED</strong></td>
<td>

Quantité estimée

</td>
</tr>
</tbody>
</table>

### SignatureAuthor

Dénomination de l'auteur de la signature

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>EMITTER</strong></td>
<td>

L'auteur de la signature est l'émetteur du déchet

</td>
</tr>
<tr>
<td valign="top"><strong>ECO_ORGANISME</strong></td>
<td>

L'auteur de la signature est l'éco-organisme figurant sur le BSD

</td>
</tr>
</tbody>
</table>

### SignatureTypeInput

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>EMISSION</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>TRANSPORT</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>OPERATION</strong></td>
<td></td>
</tr>
</tbody>
</table>

### TransportMode

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ROAD</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>RAIL</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>AIR</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>RIVER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SEA</strong></td>
<td></td>
</tr>
</tbody>
</table>

### UserRole

Liste les différents rôles d'un utilisateur au sein
d'un établissement.

Les admins peuvent:
* consulter/éditer les bordereaux
* gérer les utilisateurs de l'établissement
* éditer les informations de la fiche entreprise
* demander le renouvellement du code de signature
* Éditer les informations de la fiche entreprise

Les membres peuvent:
* consulter/éditer les bordereaux
* consulter le reste des informations

Vous pouvez consulter [cette page](https://docs.google.com/spreadsheets/d/12K9Bd2k5l4uqXhS0h5uI00lNEzW7C-1t-NDOyxy8aKk/edit#gid=0)
pour le détail de chacun des rôles

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>MEMBER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ADMIN</strong></td>
<td></td>
</tr>
</tbody>
</table>

### WasteAcceptationStatusInput

Statut d'acceptation d'un déchet

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ACCEPTED</strong></td>
<td>

Accepté en totalité

</td>
</tr>
<tr>
<td valign="top"><strong>REFUSED</strong></td>
<td>

Refusé

</td>
</tr>
<tr>
<td valign="top"><strong>PARTIALLY_REFUSED</strong></td>
<td>

Refus partiel

</td>
</tr>
</tbody>
</table>

### WasteType

Type de déchets autorisé pour une rubrique

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>INERTE</strong></td>
<td>

Déchet inerte

</td>
</tr>
<tr>
<td valign="top"><strong>NOT_DANGEROUS</strong></td>
<td>

Déchet non dangereux

</td>
</tr>
<tr>
<td valign="top"><strong>DANGEROUS</strong></td>
<td>

Déchet dangereux

</td>
</tr>
</tbody>
</table>

### processingOperationTypes

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>D9</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>D10</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>D12</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>R1</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>R12</strong></td>
<td></td>
</tr>
</tbody>
</table>

## Scalars

### Boolean

The `Boolean` scalar type represents `true` or `false`.

### DateTime

Le scalaire `DateTime` accepte des chaines de caractères
formattées selon le standard ISO 8601. Exemples:
- "yyyy-MM-dd" (eg. 2020-11-23)
- "yyyy-MM-ddTHH:mm:ss" (eg. 2020-11-23T13:34:55)
- "yyyy-MM-ddTHH:mm:ssX" (eg. 2020-11-23T13:34:55Z)
- "yyyy-MM-dd'T'HH:mm:ss.SSS" (eg. 2020-11-23T13:34:55.987)
- "yyyy-MM-dd'T'HH:mm:ss.SSSX" (eg. 2020-11-23T13:34:55.987Z)

### Float

The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point).

### ID

The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.

### Int

The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1.

### JSON

### String

The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.

### URL

Chaîne de caractère au format URL, débutant par un protocole http(s).
