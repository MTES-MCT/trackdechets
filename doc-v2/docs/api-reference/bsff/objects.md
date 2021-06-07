---
id: objects
title: Objects
slug: objects
---

## Bsff



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
bsffs<br />
<a href="/api-reference/bsff/objects#bsff"><code>[Bsff!]!</code></a>
</td>
<td>
<p>Liste des bordereaux que celui-ci regroupe, dans le cas d&#39;un regroupement, reconditionnement ou d&#39;une réexpédition.</p>
</td>
</tr>
<tr>
<td>
destination<br />
<a href="/api-reference/bsff/objects#bsffdestination"><code>BsffDestination</code></a>
</td>
<td>
<p>Destination du déchet, qui peut le réceptionner pour traitement, regroupement, reconditionnement ou réexpedition.
Un nouveau bordereau doit être créé si le déchet connaît un nouveau parcours,
par exemple si il quitte une installation de collecte pour un centre de traitement.</p>
</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsff/objects#bsffemitter"><code>BsffEmitter</code></a>
</td>
<td>
<p>Émetteur du déchet, qui n&#39;est pas nécessairement le producteur.
Il s&#39;agit par exemple de l&#39;opérateur ayant collecté des fluides lors d&#39;interventions,
ou alors d&#39;une installation de collecte qui procède à la réexpédition pour traitement final.</p>
</td>
</tr>
<tr>
<td>
ficheInterventions<br />
<a href="/api-reference/bsff/objects#bsffficheintervention"><code>[BsffFicheIntervention!]!</code></a>
</td>
<td>
<p>Liste des fiches d&#39;intervention associés à ce bordereau.
Habituellement renseigné par un opérateur lors de son intervention.</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/bsff/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Identifiant unique assigné par Trackdéchets.
Il est à utiliser pour les échanges avec l&#39;API.</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api-reference/bsff/objects#bsffpackaging"><code>[BsffPackaging!]!</code></a>
</td>
<td>
<p>Liste des contenants utilisés pour le transport des fluides.</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsff/objects#bsffquantity"><code>BsffQuantity</code></a>
</td>
<td>
<p>Quantité totale du déchet, qu&#39;elle soit réelle ou estimée.</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsff/objects#bsfftransporter"><code>BsffTransporter</code></a>
</td>
<td>
<p>Transporteur du déchet, effectue l&#39;enlèvement du déchet auprès de l&#39;émetteur et vers la destination.
À noter que l&#39;émetteur peut également être transporteur,
par exemple dans le cas de l&#39;opérateur qui dépose lui même ses contenants auprès d&#39;une installation de collecte.</p>
</td>
</tr>
<tr>
<td>
waste<br />
<a href="/api-reference/bsff/objects#bsffwaste"><code>BsffWaste</code></a>
</td>
<td>
<p>Description du déchet et ses mentions associées.</p>
</td>
</tr>
</tbody>
</table>

## BsffConnection



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
edges<br />
<a href="/api-reference/bsff/objects#bsffedge"><code>[BsffEdge!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
pageInfo<br />
<a href="/api-reference/bsff/objects#pageinfo"><code>PageInfo!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
totalCount<br />
<a href="/api-reference/bsff/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffDestination



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
cap<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro CAP.</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api-reference/bsff/objects#formcompany"><code>FormCompany!</code></a>
</td>
<td>
<p>Entreprise réceptionant le déchet.</p>
</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api-reference/bsff/objects#bsffoperation"><code>BsffOperation</code></a>
</td>
<td>
<p>Déclaration de traitement du déchet.</p>
</td>
</tr>
<tr>
<td>
plannedOperation<br />
<a href="/api-reference/bsff/objects#bsffplannedoperation"><code>BsffPlannedOperation!</code></a>
</td>
<td>
<p>Opération de traitement prévu initialement.</p>
</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api-reference/bsff/objects#bsffreception"><code>BsffReception</code></a>
</td>
<td>
<p>Déclaration de réception du déchet.</p>
</td>
</tr>
</tbody>
</table>

## BsffEdge



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
cursor<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
node<br />
<a href="/api-reference/bsff/objects#bsff"><code>Bsff!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffEmission



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
signature<br />
<a href="/api-reference/bsff/objects#signature"><code>Signature!</code></a>
</td>
<td>
<p>Signature de l&#39;émetteur lors de l&#39;enlèvement par le transporteur.</p>
</td>
</tr>
</tbody>
</table>

## BsffEmitter



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsff/objects#formcompany"><code>FormCompany!</code></a>
</td>
<td>
<p>Entreprise émettant le déchet.</p>
</td>
</tr>
<tr>
<td>
emission<br />
<a href="/api-reference/bsff/objects#bsffemission"><code>BsffEmission</code></a>
</td>
<td>
<p>Déclaration de l&#39;émetteur lors de l&#39;enlèvement par le transporteur.</p>
</td>
</tr>
</tbody>
</table>

## BsffFicheIntervention



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
kilos<br />
<a href="/api-reference/bsff/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Poids total des fluides récupérés lors de cette intervention.</p>
</td>
</tr>
<tr>
<td>
numero<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro de la fiche d&#39;intervention, habituellement renseigné par l&#39;opérateur.</p>
</td>
</tr>
<tr>
<td>
owner<br />
<a href="/api-reference/bsff/objects#bsffowner"><code>BsffOwner</code></a>
</td>
<td>
<p>Détenteur de l&#39;équipement sur lequel est intervenu l&#39;opérateur.
À noter que dû à la valeur commerciale de ces informations, leur visibilité est limité aux acteurs en contact direct.</p>
</td>
</tr>
<tr>
<td>
postalCode<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Code postal du lieu où l&#39;intervention a eu lieu.</p>
</td>
</tr>
</tbody>
</table>

## BsffOperation



<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [IBsffOperation](/api-reference/bsff/interfaces#ibsffoperation)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
code<br />
<a href="/api-reference/bsff/enums#bsffoperationcode"><code>BsffOperationCode</code></a>
</td>
<td>
<p>Code de l&#39;opération de traitement.</p>
</td>
</tr>
<tr>
<td>
qualification<br />
<a href="/api-reference/bsff/enums#bsffoperationqualification"><code>BsffOperationQualification!</code></a>
</td>
<td>
<p>Qualification plus précise du type d&#39;opération réalisée.</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsff/objects#signature"><code>Signature</code></a>
</td>
<td>
<p>Signature de la destination lors du traitement.</p>
</td>
</tr>
</tbody>
</table>

## BsffOwner



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsff/objects#formcompany"><code>FormCompany!</code></a>
</td>
<td>
<p>Entreprise détentrice de l&#39;équipement.</p>
</td>
</tr>
</tbody>
</table>

## BsffPackaging



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
litres<br />
<a href="/api-reference/bsff/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Volume en litres des fluides à l&#39;intérieur du contenant.</p>
</td>
</tr>
<tr>
<td>
numero<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro du contenant.</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsff/enums#bsffpackagingtype"><code>BsffPackagingType!</code></a>
</td>
<td>
<p>Type de contenant.</p>
</td>
</tr>
</tbody>
</table>

## BsffPlannedOperation



<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [IBsffOperation](/api-reference/bsff/interfaces#ibsffoperation)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
code<br />
<a href="/api-reference/bsff/enums#bsffoperationcode"><code>BsffOperationCode</code></a>
</td>
<td>
<p>Code de l&#39;opération de traitement prévu.</p>
</td>
</tr>
<tr>
<td>
qualification<br />
<a href="/api-reference/bsff/enums#bsffoperationqualification"><code>BsffOperationQualification!</code></a>
</td>
<td>
<p>Qualification plus précise du type d&#39;opération prévu.</p>
</td>
</tr>
</tbody>
</table>

## BsffQuantity



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
isEstimate<br />
<a href="/api-reference/bsff/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>
<p>Si il s&#39;agit d&#39;une estimation ou d&#39;un poids réel.</p>
</td>
</tr>
<tr>
<td>
kilos<br />
<a href="/api-reference/bsff/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Poids total du déchet en kilos.</p>
</td>
</tr>
</tbody>
</table>

## BsffReception



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
date<br />
<a href="/api-reference/bsff/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de réception du déchet.</p>
</td>
</tr>
<tr>
<td>
kilos<br />
<a href="/api-reference/bsff/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Quantité totale du déchet, qu&#39;elle soit réelle ou estimée.</p>
</td>
</tr>
<tr>
<td>
refusal<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>
<p>En cas de refus, le motif.</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsff/objects#signature"><code>Signature</code></a>
</td>
<td>
<p>Signature de la destination lors de l&#39;acceptation ou du refus du déchet.</p>
</td>
</tr>
</tbody>
</table>

## BsffTransport



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
mode<br />
<a href="/api-reference/bsff/enums#transportmode"><code>TransportMode!</code></a>
</td>
<td>
<p>Mode de transport utilisé.</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsff/objects#signature"><code>Signature!</code></a>
</td>
<td>
<p>Signature du transporteur lors de l&#39;enlèvement auprès de l&#39;émetteur.</p>
</td>
</tr>
</tbody>
</table>

## BsffTransporter



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsff/objects#formcompany"><code>FormCompany!</code></a>
</td>
<td>
<p>Entreprise responsable du transport du déchet.</p>
</td>
</tr>
<tr>
<td>
recepisse<br />
<a href="/api-reference/bsff/objects#bsfftransporterrecepisse"><code>BsffTransporterRecepisse</code></a>
</td>
<td>
<p>Récépissé du transporteur, à moins d&#39;être exempté.</p>
</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api-reference/bsff/objects#bsfftransport"><code>BsffTransport</code></a>
</td>
<td>
<p>Déclaration du transporteur lors de l&#39;enlèvement auprès de l&#39;émetteur.</p>
</td>
</tr>
</tbody>
</table>

## BsffTransporterRecepisse



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
department<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Département auquel est lié le récépissé.</p>
</td>
</tr>
<tr>
<td>
number<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro du récépissé.</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api-reference/bsff/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date limite de validité du récépissé.</p>
</td>
</tr>
</tbody>
</table>

## BsffWaste



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
adr<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Mention ADR.</p>
</td>
</tr>
<tr>
<td>
code<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Code déchet.</p>
</td>
</tr>
<tr>
<td>
description<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Description du déchet, permet de le qualifier de façon plus précise.</p>
</td>
</tr>
</tbody>
</table>

## FileDownload

URL de téléchargement accompagné d'un token
permettant de valider le téléchargement.

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
downloadLink<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>
<p>Lien de téléchargement</p>
</td>
</tr>
<tr>
<td>
token<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>
<p>Token ayant une durée de validité de 10s</p>
</td>
</tr>
</tbody>
</table>

## FormCompany

Information sur un établissement dans un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>
<p>Adresse de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
contact<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
country<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code ISO 3166-1 alpha-2 du pays d&#39;origine de l&#39;entreprise :
<a href="https://fr.wikipedia.org/wiki/ISO_3166-1_alpha-2">https://fr.wikipedia.org/wiki/ISO_3166-1_alpha-2</a></p>
<p>Seul la destination ultérieure case 12 (<code>form.nextDestination.company</code>) peut être à l&#39;étranger.</p>
</td>
</tr>
<tr>
<td>
mail<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>
<p>Email du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
phone<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de téléphone de contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
vatNumber<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de TVA intracommunautaire</p>
</td>
</tr>
</tbody>
</table>

## PageInfo



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
endCursor<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hasNextPage<br />
<a href="/api-reference/bsff/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hasPreviousPage<br />
<a href="/api-reference/bsff/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
startCursor<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Signature



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
author<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
date<br />
<a href="/api-reference/bsff/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## WorkSite

Informations sur une adresse chantier

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
city<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
infos<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
postalCode<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

