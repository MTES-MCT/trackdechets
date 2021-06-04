---
id: objects
title: Objects
slug: objects
---

## Bsvhu



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
createdAt<br />
<a href="/api-reference/bsvhu/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de création</p>
</td>
</tr>
<tr>
<td>
destination<br />
<a href="/api-reference/bsvhu/objects#bsvhudestination"><code>BsvhuDestination</code></a>
</td>
<td>
<p>Destinataire du bordereau</p>
</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsvhu/objects#bsvhuemitter"><code>BsvhuEmitter</code></a>
</td>
<td>
<p>Émetteur du bordereau</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/bsvhu/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Numéro unique attribué par Trackdéchets</p>
</td>
</tr>
<tr>
<td>
identification<br />
<a href="/api-reference/bsvhu/objects#bsvhuidentification"><code>BsvhuIdentification</code></a>
</td>
<td>
<p>Identification des VHUs</p>
</td>
</tr>
<tr>
<td>
isDraft<br />
<a href="/api-reference/bsvhu/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>
<p>Indique si le bordereau est à l&#39;état de brouillon</p>
</td>
</tr>
<tr>
<td>
metadata<br />
<a href="/api-reference/bsvhu/objects#bsvhumetadata"><code>BsvhuMetadata!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
packaging<br />
<a href="/api-reference/bsvhu/enums#bsvhupackaging"><code>BsvhuPackaging</code></a>
</td>
<td>
<p>Conditionnement du déchet</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsvhu/objects#bsvhuquantity"><code>BsvhuQuantity</code></a>
</td>
<td>
<p>Quantité de VHUs</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api-reference/bsvhu/enums#bsvhustatus"><code>BsvhuStatus!</code></a>
</td>
<td>
<p>Status du bordereau</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsvhu/objects#bsvhutransporter"><code>BsvhuTransporter</code></a>
</td>
<td>
<p>Transporteur</p>
</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api-reference/bsvhu/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de dernière modification</p>
</td>
</tr>
<tr>
<td>
wasteCode<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code déchet. Presque toujours 16 01 06</p>
</td>
</tr>
</tbody>
</table>

## BsvhuConnection



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
edges<br />
<a href="/api-reference/bsvhu/objects#bsvhuedge"><code>[BsvhuEdge!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
pageInfo<br />
<a href="/api-reference/bsvhu/objects#pageinfo"><code>PageInfo!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
totalCount<br />
<a href="/api-reference/bsvhu/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuDestination



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
agrementNumber<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro d&#39;agrément de receveur</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api-reference/bsvhu/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Coordonnées de l&#39;entreprise qui recoit les déchets</p>
</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api-reference/bsvhu/objects#bsvhuoperation"><code>BsvhuOperation</code></a>
</td>
<td>
<p>Informations sur l&#39;opétation de traitement</p>
</td>
</tr>
<tr>
<td>
plannedOperationCode<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>
<p>Opération d&#39;élimination / valorisation prévue (code D/R)</p>
</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api-reference/bsvhu/objects#bsvhureception"><code>BsvhuReception</code></a>
</td>
<td>
<p>Informations de réception</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsvhu/enums#bsvhudestinationtype"><code>BsvhuDestinationType</code></a>
</td>
<td>
<p>Type de receveur: broyeur ou second centre VHU</p>
</td>
</tr>
</tbody>
</table>

## BsvhuEdge



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
cursor<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
node<br />
<a href="/api-reference/bsvhu/objects#bsvhu"><code>Bsvhu!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuEmission



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
signature<br />
<a href="/api-reference/bsvhu/objects#signature"><code>Signature</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuEmitter



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
agrementNumber<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro d&#39;agrément émetteur</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api-reference/bsvhu/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Coordonnées de l&#39;entreprise émétrice</p>
</td>
</tr>
<tr>
<td>
emission<br />
<a href="/api-reference/bsvhu/objects#bsvhuemission"><code>BsvhuEmission</code></a>
</td>
<td>
<p>Déclaration générale de l&#39;émetteur du bordereau</p>
</td>
</tr>
</tbody>
</table>

## BsvhuError



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
message<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
path<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
requiredFor<br />
<a href="/api-reference/bsvhu/enums#signaturetypeinput"><code>SignatureTypeInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuIdentification



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
numbers<br />
<a href="/api-reference/bsvhu/scalars#string"><code>[String]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsvhu/enums#bsvhuidentificationtype"><code>BsvhuIdentificationType</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuMetadata



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
errors<br />
<a href="/api-reference/bsvhu/objects#bsvhuerror"><code>[BsvhuError!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuNextDestination



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsvhu/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuOperation



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
code<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>
<p>Opération de traitement réalisée (R4 ou R12)</p>
</td>
</tr>
<tr>
<td>
date<br />
<a href="/api-reference/bsvhu/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de réalisation</p>
</td>
</tr>
<tr>
<td>
nextDestination<br />
<a href="/api-reference/bsvhu/objects#bsvhunextdestination"><code>BsvhuNextDestination</code></a>
</td>
<td>
<p>Broyeur de destination, à remplir uniquement lorsque la destination est lui même un centre VHU</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsvhu/objects#signature"><code>Signature</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuQuantity



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
number<br />
<a href="/api-reference/bsvhu/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
tons<br />
<a href="/api-reference/bsvhu/scalars#float"><code>Float</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuRecepisse



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
department<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
number<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api-reference/bsvhu/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuReception



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
acceptationStatus<br />
<a href="/api-reference/bsvhu/enums#bsvhuacceptationstatus"><code>BsvhuAcceptationStatus</code></a>
</td>
<td>
<p>Lot accepté oui/non</p>
</td>
</tr>
<tr>
<td>
date<br />
<a href="/api-reference/bsvhu/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de présentation sur site</p>
</td>
</tr>
<tr>
<td>
identification<br />
<a href="/api-reference/bsvhu/objects#bsvhuidentification"><code>BsvhuIdentification</code></a>
</td>
<td>
<p>Identification éventuelle des VHU à la reception (numéro de lots ou d&#39;ordre)</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsvhu/objects#bsvhuquantity"><code>BsvhuQuantity</code></a>
</td>
<td>
<p>Quantité réelle reçue</p>
</td>
</tr>
<tr>
<td>
refusalReason<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>
<p>Motif de refus</p>
</td>
</tr>
</tbody>
</table>

## BsvhuTransport



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
signature<br />
<a href="/api-reference/bsvhu/objects#signature"><code>Signature</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
takenOverAt<br />
<a href="/api-reference/bsvhu/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de prise en charge</p>
</td>
</tr>
</tbody>
</table>

## BsvhuTransporter



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsvhu/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Coordonnées de l&#39;entreprise de transport</p>
</td>
</tr>
<tr>
<td>
recepisse<br />
<a href="/api-reference/bsvhu/objects#bsvhurecepisse"><code>BsvhuRecepisse</code></a>
</td>
<td>
<p>Récépissé transporteur</p>
</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api-reference/bsvhu/objects#bsvhutransport"><code>BsvhuTransport</code></a>
</td>
<td>
<p>Informations liés au transport</p>
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
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>
<p>Lien de téléchargement</p>
</td>
</tr>
<tr>
<td>
token<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>
<p>Adresse de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
contact<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
country<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>
<p>Email du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
phone<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de téléphone de contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
vatNumber<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hasNextPage<br />
<a href="/api-reference/bsvhu/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hasPreviousPage<br />
<a href="/api-reference/bsvhu/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
startCursor<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
date<br />
<a href="/api-reference/bsvhu/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
city<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
infos<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
postalCode<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

