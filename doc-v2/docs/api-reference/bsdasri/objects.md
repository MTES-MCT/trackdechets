---
id: objects
title: Objects
slug: objects
---

## Bsdasri

Bordereau Bsdasri

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
createdAt<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emission<br />
<a href="/api-reference/bsdasri/objects#bsdasriemission"><code>BsdasriEmission</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsdasri/objects#bsdasriemitter"><code>BsdasriEmitter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/bsdasri/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isDraft<br />
<a href="/api-reference/bsdasri/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
metadata<br />
<a href="/api-reference/bsdasri/objects#bsdasrimetadata"><code>BsdasriMetadata!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api-reference/bsdasri/objects#bsdasrioperation"><code>BsdasriOperation</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api-reference/bsdasri/objects#bsdasrireception"><code>BsdasriReception</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api-reference/bsdasri/objects#bsdasrirecipient"><code>BsdasriRecipient</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
regroupedBsdasris<br />
<a href="/api-reference/bsdasri/scalars#id"><code>[ID!]</code></a>
</td>
<td>
<p>Bordereaux regroupés</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api-reference/bsdasri/enums#bsdasristatus"><code>BsdasriStatus!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api-reference/bsdasri/objects#bsdasritransport"><code>BsdasriTransport</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdasri/objects#bsdasritransporter"><code>BsdasriTransporter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriConnection



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
edges<br />
<a href="/api-reference/bsdasri/objects#bsdasriedge"><code>[BsdasriEdge!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
pageInfo<br />
<a href="/api-reference/bsdasri/objects#pageinfo"><code>PageInfo!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
totalCount<br />
<a href="/api-reference/bsdasri/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriEdge



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
cursor<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
node<br />
<a href="/api-reference/bsdasri/objects#bsdasri"><code>Bsdasri!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriEmission

Informations relatives au déchet émis

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
handedOverAt<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsdasri/objects#bsdasrisignature"><code>BsdasriSignature</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteCode<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdasri/objects#bsdasriwastedetails"><code>BsdasriWasteDetails</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriEmitter

Émetteur du Bsdasri, Personne responsable de l'émimination des déchets (PRED)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsdasri/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement émetteur</p>
</td>
</tr>
<tr>
<td>
customInfo<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>Champ libre</p>
</td>
</tr>
<tr>
<td>
handOverToTransporterAt<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de remise au tranporteur</p>
</td>
</tr>
<tr>
<td>
onBehalfOfEcoorganisme<br />
<a href="/api-reference/bsdasri/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>
<p>Agit pour le compte de l&#39;éco organisme agréé</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsdasri/enums#bsdasriemittertype"><code>BsdasriEmitterType</code></a>
</td>
<td>
<p>Type d&#39;émetteur</p>
</td>
</tr>
<tr>
<td>
workSite<br />
<a href="/api-reference/bsdasri/objects#worksite"><code>WorkSite</code></a>
</td>
<td>
<p>Site d&#39;emport du déceht, si différent de celle de l&#39;émetteur</p>
</td>
</tr>
</tbody>
</table>

## BsdasriError



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
message<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
path<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
requiredFor<br />
<a href="/api-reference/bsdasri/enums#bsdasrisignaturetype"><code>[BsdasriSignatureType!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriMetadata



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
errors<br />
<a href="/api-reference/bsdasri/objects#bsdasrierror"><code>[BsdasriError]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriOperation

Informations relatives au traitement du Bsdasri

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
processedAt<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
processingOperation<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsdasri/objects#bsdasrisignature"><code>BsdasriSignature</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriPackagingInfo

Informations sur le conditionnement Bsdasri

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
other<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>Description du conditionnement dans le cas où le type de conditionnement est <code>AUTRE</code></p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsdasri/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Nombre de colis associés à ce conditionnement</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsdasri/enums#bsdasripackagings"><code>BsdasriPackagings!</code></a>
</td>
<td>
<p>Type de conditionnement</p>
</td>
</tr>
<tr>
<td>
volume<br />
<a href="/api-reference/bsdasri/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriReception

Informations relatives à la réception du Bsdasri

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
receivedAt<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsdasri/objects#bsdasrisignature"><code>BsdasriSignature</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteAcceptation<br />
<a href="/api-reference/bsdasri/objects#bsdasriwasteacceptation"><code>BsdasriWasteAcceptation</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdasri/objects#bsdasriwastedetails"><code>BsdasriWasteDetails</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriRecipient

Destinataire du Bsdasri

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsdasri/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Installation destinataire</p>
</td>
</tr>
<tr>
<td>
customInfo<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>Champ libre</p>
</td>
</tr>
</tbody>
</table>

## BsdasriSignature



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
author<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
date<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriTransport

Informations relatives au transport du Bsdasri

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
handedOverAt<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsdasri/objects#bsdasrisignature"><code>BsdasriSignature</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
takenOverAt<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteAcceptation<br />
<a href="/api-reference/bsdasri/objects#bsdasriwasteacceptation"><code>BsdasriWasteAcceptation</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdasri/objects#bsdasriwastedetails"><code>BsdasriWasteDetails</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriTransporter

Collecteur transporteur

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsdasri/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement de destination</p>
</td>
</tr>
<tr>
<td>
customInfo<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>Champ libre</p>
</td>
</tr>
<tr>
<td>
receipt<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de récipissé</p>
</td>
</tr>
<tr>
<td>
receiptDepartment<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>Département</p>
</td>
</tr>
<tr>
<td>
receiptValidityLimit<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Limite de validité du récipissé</p>
</td>
</tr>
</tbody>
</table>

## BsdasriWasteAcceptation

Informations relatives à l'acceptation ou au refus du déchet (Bsdasri)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
refusalReason<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
refusedQuantity<br />
<a href="/api-reference/bsdasri/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriWasteDetails

Détail sur le déchet proprement dit du Bsdasri

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
onuCode<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
packagingInfos<br />
<a href="/api-reference/bsdasri/objects#bsdasripackaginginfo"><code>[BsdasriPackagingInfo!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsdasri/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantityType<br />
<a href="/api-reference/bsdasri/enums#quantitytype"><code>QuantityType</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
volume<br />
<a href="/api-reference/bsdasri/scalars#int"><code>Int</code></a>
</td>
<td>

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
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>Lien de téléchargement</p>
</td>
</tr>
<tr>
<td>
token<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>Adresse de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
contact<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
country<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>Email du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
phone<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de téléphone de contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
vatNumber<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hasNextPage<br />
<a href="/api-reference/bsdasri/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hasPreviousPage<br />
<a href="/api-reference/bsdasri/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
startCursor<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
date<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
city<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
infos<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
postalCode<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

