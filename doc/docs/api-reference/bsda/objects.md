---
id: objects
title: Objects
slug: objects
---

## Bsda



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
associations<br />
<a href="/api-reference/bsda/objects#bsdaassociation"><code>[BsdaAssociation]</code></a>
</td>
<td>
<p>Précedents BSDA associés, constituant l&#39;historique de traçabilité</p>
</td>
</tr>
<tr>
<td>
createdAt<br />
<a href="/api-reference/bsda/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de création</p>
</td>
</tr>
<tr>
<td>
destination<br />
<a href="/api-reference/bsda/objects#bsdadestination"><code>BsdaDestination</code></a>
</td>
<td>
<p>Installation de destination</p>
</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsda/objects#bsdaemitter"><code>BsdaEmitter</code></a>
</td>
<td>
<p>Maitre d&#39;ouvrage ou détenteur du déchet</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/bsda/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Bordereau n°</p>
</td>
</tr>
<tr>
<td>
isDraft<br />
<a href="/api-reference/bsda/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>
<p>Indique si le bordereau est à l&#39;état de brouillon</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api-reference/bsda/objects#bsdapackaging"><code>[BsdaPackaging!]</code></a>
</td>
<td>
<p>Conditionnement</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsda/objects#bsdaquantity"><code>BsdaQuantity</code></a>
</td>
<td>
<p>Quantité</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api-reference/bsda/enums#bsdastatus"><code>BsdaStatus!</code></a>
</td>
<td>
<p>Statur du bordereau</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsda/objects#bsdatransporter"><code>BsdaTransporter</code></a>
</td>
<td>
<p>Entreprise de transport</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsda/enums#bsdatype"><code>BsdaType</code></a>
</td>
<td>
<p>Type de bordereau
Le type de bordereau impacte le workflow et les champs obligatoires</p>
</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api-reference/bsda/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de dernière modification</p>
</td>
</tr>
<tr>
<td>
waste<br />
<a href="/api-reference/bsda/objects#bsdawaste"><code>BsdaWaste</code></a>
</td>
<td>
<p>Dénomination du déchet</p>
</td>
</tr>
<tr>
<td>
worker<br />
<a href="/api-reference/bsda/objects#bsdaworker"><code>BsdaWorker</code></a>
</td>
<td>
<p>Entreprise de travaux</p>
</td>
</tr>
</tbody>
</table>

## BsdaAssociation



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsda/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api-reference/bsda/enums#bsdastatus"><code>BsdaStatus!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaConnection



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
edges<br />
<a href="/api-reference/bsda/objects#bsdaedge"><code>[BsdaEdge!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
pageInfo<br />
<a href="/api-reference/bsda/objects#pageinfo"><code>PageInfo!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
totalCount<br />
<a href="/api-reference/bsda/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaDestination



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
cap<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de CAP (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api-reference/bsda/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement de destination</p>
</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api-reference/bsda/objects#bsdaoperation"><code>BsdaOperation</code></a>
</td>
<td>
<p>Réalisation de l&#39;opération (case 11)</p>
</td>
</tr>
<tr>
<td>
plannedOperationCode<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Opération d&#39;élimination / valorisation prévue (code D/R)</p>
</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api-reference/bsda/objects#bsdareception"><code>BsdaReception</code></a>
</td>
<td>
<p>Expédition reçue à l&#39;installation de destination</p>
</td>
</tr>
</tbody>
</table>

## BsdaEdge



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
cursor<br />
<a href="/api-reference/bsda/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
node<br />
<a href="/api-reference/bsda/objects#bsda"><code>Bsda!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaEmission



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
signature<br />
<a href="/api-reference/bsda/objects#signature"><code>Signature</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaEmitter



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsda/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement MOA/détenteur. Partiellement rempli si l&#39;émetteur est en fait un particulier</p>
</td>
</tr>
<tr>
<td>
emission<br />
<a href="/api-reference/bsda/objects#bsdaemission"><code>BsdaEmission</code></a>
</td>
<td>
<p>Déclaration générale</p>
</td>
</tr>
<tr>
<td>
isPrivateIndividual<br />
<a href="/api-reference/bsda/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Indique si le détenteur est un particulier ou une entreprise</p>
</td>
</tr>
<tr>
<td>
worksite<br />
<a href="/api-reference/bsda/objects#bsdaworksite"><code>BsdaWorksite</code></a>
</td>
<td>
<p>Informations chantier (si différente de l&#39;adresse de l&#39;entreprise)</p>
</td>
</tr>
</tbody>
</table>

## BsdaOperation



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
code<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code D/R</p>
</td>
</tr>
<tr>
<td>
date<br />
<a href="/api-reference/bsda/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de réalisation de l&#39;opération</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsda/objects#signature"><code>Signature</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaPackaging



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
other<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Description du conditionnement dans le cas où le type de conditionnement est <code>AUTRE</code></p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsda/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Nombre de colis associés à ce conditionnement</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsda/enums#bsdapackagingtype"><code>BsdaPackagingType!</code></a>
</td>
<td>
<p>Type de conditionnement</p>
</td>
</tr>
</tbody>
</table>

## BsdaQuantity



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/api-reference/bsda/enums#bsdaquantitytype"><code>BsdaQuantityType</code></a>
</td>
<td>
<p>Type de quantité (réelle ou estimé)</p>
</td>
</tr>
<tr>
<td>
value<br />
<a href="/api-reference/bsda/scalars#float"><code>Float</code></a>
</td>
<td>
<p>Quantité en tonne</p>
</td>
</tr>
</tbody>
</table>

## BsdaRecepisse



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
department<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
number<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api-reference/bsda/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaReception



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
acceptationStatus<br />
<a href="/api-reference/bsda/enums#bsdaacceptationstatus"><code>BsdaAcceptationStatus</code></a>
</td>
<td>
<p>Lot accepté, accepté partiellement ou refusé</p>
</td>
</tr>
<tr>
<td>
date<br />
<a href="/api-reference/bsda/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de présentation sur site</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsda/objects#bsdaquantity"><code>BsdaQuantity</code></a>
</td>
<td>
<p>Quantité présentée</p>
</td>
</tr>
<tr>
<td>
refusalReason<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Motif de refus</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsda/objects#signature"><code>Signature</code></a>
</td>
<td>
<p>Signature case 10</p>
</td>
</tr>
</tbody>
</table>

## BsdaTransport



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
signature<br />
<a href="/api-reference/bsda/objects#signature"><code>Signature</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaTransporter



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsda/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Coordonnées de l&#39;entreprise de transport</p>
</td>
</tr>
<tr>
<td>
recepisse<br />
<a href="/api-reference/bsda/objects#bsdarecepisse"><code>BsdaRecepisse</code></a>
</td>
<td>
<p>Récépissé transporteur</p>
</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api-reference/bsda/objects#bsdatransport"><code>BsdaTransport</code></a>
</td>
<td>
<p>Déclaration générale</p>
</td>
</tr>
</tbody>
</table>

## BsdaWaste



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
adr<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Mention ADR</p>
</td>
</tr>
<tr>
<td>
code<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Rubrique Déchet</p>
</td>
</tr>
<tr>
<td>
consistence<br />
<a href="/api-reference/bsda/enums#bsdaconsistence"><code>BsdaConsistence</code></a>
</td>
<td>
<p>Consistence</p>
</td>
</tr>
<tr>
<td>
familyCode<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code famille</p>
</td>
</tr>
<tr>
<td>
materialName<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom du matériau</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Dénomination usuelle</p>
</td>
</tr>
<tr>
<td>
sealNumbers<br />
<a href="/api-reference/bsda/scalars#string"><code>[String!]</code></a>
</td>
<td>
<p>Numéros de scellés</p>
</td>
</tr>
</tbody>
</table>

## BsdaWork



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
hasEmitterPaperSignature<br />
<a href="/api-reference/bsda/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Indique si l&#39;entreprise de travaux a une signature papier du MOA/détenteur du déchet
Remettre une signature papier permet au détenteur de ne pas à avoir à signer sur la plateforme</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsda/objects#signature"><code>Signature</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaWorker



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsda/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Entreprise de travaux</p>
</td>
</tr>
<tr>
<td>
work<br />
<a href="/api-reference/bsda/objects#bsdawork"><code>BsdaWork</code></a>
</td>
<td>
<p>Déclaration générale</p>
</td>
</tr>
</tbody>
</table>

## BsdaWorksite



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
city<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
infos<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Autres informations, notamment le code chantier</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
postalCode<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Lien de téléchargement</p>
</td>
</tr>
<tr>
<td>
token<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Adresse de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
contact<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
country<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Email du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
phone<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de téléphone de contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
vatNumber<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hasNextPage<br />
<a href="/api-reference/bsda/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hasPreviousPage<br />
<a href="/api-reference/bsda/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
startCursor<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
date<br />
<a href="/api-reference/bsda/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
city<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
infos<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
postalCode<br />
<a href="/api-reference/bsda/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

