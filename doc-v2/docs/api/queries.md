---
id: queries
title: Queries
slug: queries
---

## appendixForms

**Type:** [[Form!]!](/api/objects#form)

Renvoie des BSD candidats à un regroupement dans une annexe 2

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
siret<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Siret d&#39;un des établissements dont je suis membre</p>
</td>
</tr>
<tr>
<td>
wasteCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>(Optionnel) Code déchet pour affiner la recherche</p>
</td>
</tr>
</tbody>
</table>

## bsda

**Type:** [Bsda!](/api/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## bsdas

**Type:** [BsdaConnection!](/api/objects#bsdaconnection)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
after<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>first</code> de paginer &quot;en avant&quot;
(des bordereaux les plus récents aux bordereaux les plus anciens)
Curseur après lequel les bordereaux doivent être retournés
Attend un identifiant (propriété <code>id</code>) de BSD
Défaut à vide, pour retourner les bordereaux les plus récents
Le BSD précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
before<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>last</code> de paginer &quot;en arrière&quot;
(des bordereaux les plus anciens aux bordereaux les plus récents)
Curseur avant lequel les bordereaux doivent être retournés
Attend un identifiant (propriété <code>id</code>) de BSD
Défaut à vide, pour retourner les bordereaux les plus anciens
Le BSD précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
first<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>cursorAfter</code> de paginer &quot;en avant&quot;
(des bordereaux les plus récents aux bordereaux les plus anciens)
Nombre de bordereaux retournés après le <code>cursorAfter</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
last<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Nombre de bordereaux retournés avant le <code>cursorBefore</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
where<br />
<a href="/api/inputObjects#bsdawhere"><code>BsdaWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## bsdasri

**Type:** [Bsdasri!](/api/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Identifiant du BSD</p>
</td>
</tr>
</tbody>
</table>

## bsdasriPdf

**Type:** [FileDownload!](/api/objects#filedownload)

Renvoie un token pour télécharger un pdf de bordereau
Ce token doit être transmis à la route /download pour obtenir le fichier.
Il est valable 10 secondes

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>ID d&#39;un bordereau</p>
</td>
</tr>
</tbody>
</table>

## bsdasris

**Type:** [BsdasriConnection!](/api/objects#bsdasriconnection)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Renvoie les Bsdasris.
Par défaut, les dasris des différentes companies de l'utilisateur sont renvoyés.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
after<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>first</code> de paginer &quot;en avant&quot;
(des Bsdasri les plus récents aux Bsdasri les plus anciens)
Curseur après lequel les Bsdasri doivent être retournés
Attend un identifiant (propriété <code>id</code>) de BSD
Défaut à vide, pour retourner les Bsdasri les plus récents.
Le BSD précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
before<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>last</code> de paginer &quot;en arrière&quot;
(des Bsdasri les plus anciens aux Bsdasris les plus récents)
Curseur avant lequel les Bsdasri doivent être retournés
Attend un identifiant (propriété <code>id</code>) de BSD
Défaut à vide, pour retourner les Bsdasri les plus anciens
Le BSD précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
first<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>after</code> de paginer &quot;en avant&quot;
(des Bsdasri les plus récents aux Bsdasri les plus anciens)
Nombre de Bsdasri retournés après le <code>cursorAfter</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
last<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Nombre de Bsdasri retournés avant le <code>before</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
where<br />
<a href="/api/inputObjects#bsdasriwhere"><code>BsdasriWhere</code></a>
</td>
<td>
<p>Filtres de recherche</p>
</td>
</tr>
</tbody>
</table>

## bsffs

**Type:** [BsffConnection!](/api/objects#bsffconnection)



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
after<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
before<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
first<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
last<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
where<br />
<a href="/api/inputObjects#bsffwhere"><code>BsffWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## bsvhu

**Type:** [Bsvhu!](/api/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## bsvhuPdf

**Type:** [FileDownload!](/api/objects#filedownload)

Renvoie un token pour télécharger un pdf de bordereau
Ce token doit être transmis à la route /download pour obtenir le fichier.
Il est valable 10 secondes

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>ID d&#39;un bordereau</p>
</td>
</tr>
</tbody>
</table>

## bsvhus

**Type:** [BsvhuConnection!](/api/objects#bsvhuconnection)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Tous les arguments sont optionnels.
Par défaut, retourne les 50 premiers bordereaux associés à entreprises dont vous êtes membres

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
after<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>PAGINATION
Permet en conjonction avec <code>first</code> de paginer &quot;en avant&quot;
(des bordereaux les plus récents aux bordereaux les plus anciens)
Curseur après lequel les bordereaux doivent être retournés
Attend un identifiant (propriété <code>id</code>) de BSD
Défaut à vide, pour retourner les bordereaux les plus récents
Le BSD précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
before<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>PAGINATION
Permet en conjonction avec <code>last</code> de paginer &quot;en arrière&quot;
(des bordereaux les plus anciens aux bordereaux les plus récents)
Curseur avant lequel les bordereaux doivent être retournés
Attend un identifiant (propriété <code>id</code>) de BSD
Défaut à vide, pour retourner les bordereaux les plus anciens
Le BSD précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
first<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>PAGINATION
Permet en conjonction avec <code>cursorAfter</code> de paginer &quot;en avant&quot;
(des bordereaux les plus récents aux bordereaux les plus anciens)
Nombre de bordereaux retournés après le <code>cursorAfter</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
last<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>PAGINATION
Nombre de bordereaux retournés avant le <code>cursorBefore</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
where<br />
<a href="/api/inputObjects#bsvhuwhere"><code>BsvhuWhere</code></a>
</td>
<td>
<p>Filtres</p>
</td>
</tr>
</tbody>
</table>

## companyInfos

**Type:** [CompanyPublic!](/api/objects#companypublic)

Renvoie des informations publiques sur un établissement
extrait de la base SIRENE et de la base des installations
classées pour la protection de l'environnement (ICPE)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
siret<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
</tbody>
</table>

## ecoOrganismes

**Type:** [[EcoOrganisme!]!](/api/objects#ecoorganisme)

Renvoie la liste des éco-organismes

## form

**Type:** [Form!](/api/objects#form)

Renvoie un BSD sélectionné par son ID (opaque ou lisible, l'un des deux doit être fourni)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Identifiant opaque du BSD</p>
</td>
</tr>
<tr>
<td>
readableId<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Identifiant lisible du BSD</p>
</td>
</tr>
</tbody>
</table>

## formPdf

**Type:** [FileDownload!](/api/objects#filedownload)

Renvoie un token pour télécharger un pdf de BSD
Ce token doit être transmis à la route /download pour obtenir le fichier.
Il est valable 10 secondes

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
</tbody>
</table>

## forms

**Type:** [[Form!]!](/api/objects#form)

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

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
cursorAfter<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>first</code> de paginer &quot;en avant&quot;
(des bordereaux les plus récents aux bordereaux les plus anciens)
Curseur après lequel les bordereaux doivent être retournés
Attend un identifiant (propriété <code>id</code>) de BSD
Défaut à vide, pour retourner les bordereaux les plus récents
Le BSD précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
cursorBefore<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>last</code> de paginer &quot;en arrière&quot;
(des bordereaux les plus anciens aux bordereaux les plus récents)
Curseur avant lequel les bordereaux doivent être retournés
Attend un identifiant (propriété <code>id</code>) de BSD
Défaut à vide, pour retourner les bordereaux les plus anciens
Le BSD précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
first<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>cursorAfter</code> de paginer &quot;en avant&quot;
(des bordereaux les plus récents aux bordereaux les plus anciens)
Nombre de bordereaux retournés après le <code>cursorAfter</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
hasNextStep<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>(Optionnel) Permet de filtrer sur les bordereaux en attente d&#39;une action de votre part
Si <code>true</code>, seul les bordereaux attendant une action sont renvoyés
Si <code>false</code>, seul les bordereaux n&#39;attendant aucune action son renvoyés
Si vide, tous les bordereaux sont renvoyés
Défaut à vide.</p>
</td>
</tr>
<tr>
<td>
last<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Nombre de bordereaux retournés avant le <code>cursorBefore</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
roles<br />
<a href="/api/enums#formrole"><code>[FormRole!]</code></a>
</td>
<td>
<p>(Optionnel) Filtre sur le role de demandeur dams le bordereau
Par exemple:</p>
<ul>
<li><code>roles: [TRANSPORTER]</code> renverra les bordereaux pour lesquels je suis transporteur</li>
<li><code>roles: [EMITTER, RECIPIENT]</code> renverra les bordereaux dont je suis l&#39;émetteur ou le destinataire final
Voir <code>FormRole</code> pour la liste des roles sur lesquels il est possible de filtrer.
Si aucune filtre n&#39;est passé, les bordereaux seront retournés quel que soit votre role dessus.
Défaut à vide.</li>
</ul>
</td>
</tr>
<tr>
<td>
sentAfter<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>(Optionnel) Retourne les BSD envoyés après la date
Filtre sur la date d&#39;envoi (date de la case 9 du bordereau)
Au format (YYYY-MM-DD)
Par défaut vide, aucun filtre n&#39;est appliqué</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>SIRET d&#39;un établissement dont je suis membre</p>
</td>
</tr>
<tr>
<td>
siretPresentOnForm<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>(Optionnel) Siret d&#39;une autre entreprise présente sur le bordereau
Vous n&#39;avez pas besoin d&#39;être membre de cette entreprise.
Seuls les bordereaux ou cette entreprise apparait (dans n&#39;importe quel cadre) seront retournés.
Défaut à vide.</p>
</td>
</tr>
<tr>
<td>
skip<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>DEPRECATED - (Optionnel) PAGINATION
Nombre d&#39;éléments à ne pas récupérer en début de liste dans le mode de pagination par &quot;offset&quot;
Utiliser en conjonction avec <code>first</code> pour paginer &quot;en avant&quot; (des plus récents aux plus anciens)
Utiliser en conjonction avec <code>last</code> pour paginer &quot;en arrière&quot; (des plus anciens aux plus récents)
Défaut à 0</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#formstatus"><code>[FormStatus!]</code></a>
</td>
<td>
<p>(Optionnel) Filtre sur les statuts des bordereaux
Si aucun filtre n&#39;est passé, les bordereaux seront retournés quel que soit leur statut
Défaut à vide.</p>
</td>
</tr>
<tr>
<td>
updatedAfter<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>(Optionnel) Retourne les BSD modifiés après la date
Filtre sur la date de dernière modification
Au format (YYYY-MM-DD)
Par défaut vide, aucun filtre n&#39;est appliqué</p>
</td>
</tr>
<tr>
<td>
wasteCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>(Optionnel) Code déchet pour affiner la recherche
Ex: 01 03 04* (Veillez à bien respecter les espaces).
Défaut à vide.</p>
</td>
</tr>
</tbody>
</table>

## formsLifeCycle

**Type:** [formsLifeCycleData!](/api/objects#formslifecycledata)

Renvoie les changements de statut des bordereaux de l'entreprise sélectionnée.
La liste est paginée par pages de 100 items, ordonnée par date décroissante (champ `loggedAt`)
Seuls les changements de statut disposant d'un champ `loggedAt` non nul sont retournés

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
cursorAfter<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet de paginer les changements de statut &quot;en avant&quot;
(des changements de statut les plus récents aux changements de statut les plus anciens)
Curseur après lequel les changements de statut doivent être retournés
Attend un identifiant (propriété <code>id</code>) d&#39;un changement de statut
Défaut à vide, pour retourner les changements de statut les plus récents
Le changement de statut précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
cursorBefore<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet de paginer les changements de statut &quot;en arrière&quot;
(des changements de statut les plus anciens aux changements de statut les plus récents)
Curseur avant lequel les changements de statut doivent être retournés
Attend un identifiant (propriété <code>id</code>) d&#39;un changement de statut
Défaut à vide, pour retourner les changements de statut les plus anciens
Le changement de statut précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
formId<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>(Optionnel) ID d&#39;un BSD en particulier</p>
</td>
</tr>
<tr>
<td>
loggedAfter<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>(Optionnel) Date formatée avant laquelle les changements de statut doivent être retournés (YYYY-MM-DD), optionnel</p>
</td>
</tr>
<tr>
<td>
loggedBefore<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>(Optionnel) Date formatée après laquelle les changements de statut doivent être retournés (YYYY-MM-DD)</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>(Optionnel) SIRET d&#39;un établissement dont je suis membre</p>
</td>
</tr>
</tbody>
</table>

## formsRegister

**Type:** [FileDownload!](/api/objects#filedownload)

Renvoie un token pour télécharger un csv du regsitre
Ce token doit être transmis à la route /download pour obtenir le fichier.
Il est valable 10 secondes

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
endDate<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>(Optionnel) Filtre les données par une date de fin
Défaut: aucune valeur</p>
</td>
</tr>
<tr>
<td>
exportFormat<br />
<a href="/api/enums#formsregisterexportformat"><code>FormsRegisterExportFormat</code></a>
</td>
<td>
<p>(Optionnel) Format de l&#39;export
Défaut: csv</p>
</td>
</tr>
<tr>
<td>
exportType<br />
<a href="/api/enums#formsregisterexporttype"><code>FormsRegisterExportType</code></a>
</td>
<td>
<p>(Optionnel) Modèle de registre (exhaustif, entrants, sortants, transport, négociants)
Défaut: ALL</p>
</td>
</tr>
<tr>
<td>
sirets<br />
<a href="/api/scalars#string"><code>[String!]!</code></a>
</td>
<td>
<p>Liste de SIRET pour lesquelles exporter le registre</p>
</td>
</tr>
<tr>
<td>
startDate<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>(Optionnel) Filtre les données par une date de début
Défaut: aucune valeur</p>
</td>
</tr>
<tr>
<td>
wasteCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>(Optionnel) Filtre les données par code déchet
Défaut: Tous les codes déchets</p>
</td>
</tr>
</tbody>
</table>

## me

**Type:** [User!](/api/objects#user)

Renvoie les informations sur l'utilisateur authentifié

## membershipRequest

**Type:** [MembershipRequest](/api/objects#membershiprequest)

Récupère une demande de rattachement effectuée par l'utilisateur courant
à partir de l'identifiant de cette demande ou du SIRET de l'établissement
auquel l'utilisateur a demandé à être rattaché. L'un ou l'autre des
paramètres (id ou siret) doit être être passé mais pas les deux. Cette query
permet notamment de suivre l'état d'avancement de la demande de rattachement
(en attente, accepté, refusé)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## searchCompanies

**Type:** [[CompanySearchResult!]!](/api/objects#companysearchresult)

Effectue une recherche floue sur la base SIRENE et enrichit
les résultats avec des informations provenant de Trackdéchets

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
clue<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Champ utilisé pour faire une recherche floue
sur la nom de l&#39;établissement, ex: &#39;Boulangerie Dupont&#39;</p>
</td>
</tr>
<tr>
<td>
department<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>(Optionnel) Filtre les résultats par numéro de département</p>
</td>
</tr>
</tbody>
</table>

## stats

**Type:** [[CompanyStat!]!](/api/objects#companystat)

Renvoie des statistiques sur le volume de déchets entrant et sortant

