---
id: queries
title: Queries
slug: queries
---

## companyInfos

**Type:** [CompanyPublic!](/api-reference/user/objects#companypublic)

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
<a href="/api-reference/user/scalars#string"><code>String!</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
</tbody>
</table>

## ecoOrganismes

**Type:** [[EcoOrganisme!]!](/api-reference/user/objects#ecoorganisme)

Renvoie la liste des éco-organismes

## me

**Type:** [User!](/api-reference/user/objects#user)

Renvoie les informations sur l'utilisateur authentifié

## membershipRequest

**Type:** [MembershipRequest](/api-reference/user/objects#membershiprequest)

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
<a href="/api-reference/user/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api-reference/user/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## searchCompanies

**Type:** [[CompanySearchResult!]!](/api-reference/user/objects#companysearchresult)

Effectue une recherche floue sur la base SIRENE et enrichit
les résultats avec des informations provenant de Trackdéchets

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
clue<br />
<a href="/api-reference/user/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Champ utilisé pour faire une recherche floue
sur la nom de l&#39;établissement, ex: &#39;Boulangerie Dupont&#39;</p>
</td>
</tr>
<tr>
<td>
department<br />
<a href="/api-reference/user/scalars#string"><code>String</code></a>
</td>
<td>
<p>(Optionnel) Filtre les résultats par numéro de département</p>
</td>
</tr>
</tbody>
</table>

