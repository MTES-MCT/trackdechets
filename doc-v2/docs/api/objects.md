---
id: objects
title: Objects
slug: objects
---

## AuthPayload

Cet objet est renvoyé par la mutation login qui est dépréciée

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
token<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Bearer token à durée illimité permettant de s&#39;authentifier
à l&#39;API Trackdéchets. Pour ce faire, il doit être passé dans le
header d&#39;autorisation <code>Authorization: Bearer ******</code></p>
</td>
</tr>
<tr>
<td>
user<br />
<a href="/api/objects#user"><code>User!</code></a>
</td>
<td>
<p>Utilisateur lié au token</p>
</td>
</tr>
</tbody>
</table>

## Broker

Courtier

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement courtier</p>
</td>
</tr>
<tr>
<td>
department<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Département</p>
</td>
</tr>
<tr>
<td>
receipt<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de récipissé</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Limite de validité</p>
</td>
</tr>
</tbody>
</table>

## BrokerReceipt

Récépissé courtier

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
department<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Département ayant enregistré la déclaration</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
receiptNumber<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro de récépissé courtier</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Limite de validité du récépissé</p>
</td>
</tr>
</tbody>
</table>

## Bsda



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
associations<br />
<a href="/api/objects#bsdaassociation"><code>[BsdaAssociation]</code></a>
</td>
<td>
<p>Précedents BSDA associés, constituant l&#39;historique de traçabilité</p>
</td>
</tr>
<tr>
<td>
createdAt<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de création</p>
</td>
</tr>
<tr>
<td>
destination<br />
<a href="/api/objects#bsdadestination"><code>BsdaDestination</code></a>
</td>
<td>
<p>Installation de destination</p>
</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/objects#bsdaemitter"><code>BsdaEmitter</code></a>
</td>
<td>
<p>Maitre d&#39;ouvrage ou détenteur du déchet</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Bordereau n°</p>
</td>
</tr>
<tr>
<td>
isDraft<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>
<p>Indique si le bordereau est à l&#39;état de brouillon</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api/objects#bsdapackaging"><code>[BsdaPackaging!]</code></a>
</td>
<td>
<p>Conditionnement</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/objects#bsdaquantity"><code>BsdaQuantity</code></a>
</td>
<td>
<p>Quantité</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#bsdastatus"><code>BsdaStatus!</code></a>
</td>
<td>
<p>Statur du bordereau</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/objects#bsdatransporter"><code>BsdaTransporter</code></a>
</td>
<td>
<p>Entreprise de transport</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#bsdatype"><code>BsdaType</code></a>
</td>
<td>
<p>Type de bordereau
Le type de bordereau impacte le workflow et les champs obligatoires</p>
</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de dernière modification</p>
</td>
</tr>
<tr>
<td>
waste<br />
<a href="/api/objects#bsdawaste"><code>BsdaWaste</code></a>
</td>
<td>
<p>Dénomination du déchet</p>
</td>
</tr>
<tr>
<td>
worker<br />
<a href="/api/objects#bsdaworker"><code>BsdaWorker</code></a>
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
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#bsdastatus"><code>BsdaStatus!</code></a>
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
<a href="/api/objects#bsdaedge"><code>[BsdaEdge!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
pageInfo<br />
<a href="/api/objects#pageinfo"><code>PageInfo!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
totalCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de CAP (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement de destination</p>
</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api/objects#bsdaoperation"><code>BsdaOperation</code></a>
</td>
<td>
<p>Réalisation de l&#39;opération (case 11)</p>
</td>
</tr>
<tr>
<td>
plannedOperationCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Opération d&#39;élimination / valorisation prévue (code D/R)</p>
</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api/objects#bsdareception"><code>BsdaReception</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
node<br />
<a href="/api/objects#bsda"><code>Bsda!</code></a>
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
<a href="/api/objects#signature"><code>Signature</code></a>
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
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement MOA/détenteur. Partiellement rempli si l&#39;émetteur est en fait un particulier</p>
</td>
</tr>
<tr>
<td>
emission<br />
<a href="/api/objects#bsdaemission"><code>BsdaEmission</code></a>
</td>
<td>
<p>Déclaration générale</p>
</td>
</tr>
<tr>
<td>
isPrivateIndividual<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Indique si le détenteur est un particulier ou une entreprise</p>
</td>
</tr>
<tr>
<td>
worksite<br />
<a href="/api/objects#bsdaworksite"><code>BsdaWorksite</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code D/R</p>
</td>
</tr>
<tr>
<td>
date<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de réalisation de l&#39;opération</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/objects#signature"><code>Signature</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Description du conditionnement dans le cas où le type de conditionnement est <code>AUTRE</code></p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Nombre de colis associés à ce conditionnement</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#bsdapackagingtype"><code>BsdaPackagingType!</code></a>
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
<a href="/api/enums#bsdaquantitytype"><code>BsdaQuantityType</code></a>
</td>
<td>
<p>Type de quantité (réelle ou estimé)</p>
</td>
</tr>
<tr>
<td>
value<br />
<a href="/api/scalars#float"><code>Float</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
number<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api/enums#bsdaacceptationstatus"><code>BsdaAcceptationStatus</code></a>
</td>
<td>
<p>Lot accepté, accepté partiellement ou refusé</p>
</td>
</tr>
<tr>
<td>
date<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de présentation sur site</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/objects#bsdaquantity"><code>BsdaQuantity</code></a>
</td>
<td>
<p>Quantité présentée</p>
</td>
</tr>
<tr>
<td>
refusalReason<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Motif de refus</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/objects#signature"><code>Signature</code></a>
</td>
<td>
<p>Signature case 10</p>
</td>
</tr>
</tbody>
</table>

## Bsdasri

Bordereau Bsdasri

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
createdAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emission<br />
<a href="/api/objects#bsdasriemission"><code>BsdasriEmission</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/objects#bsdasriemitter"><code>BsdasriEmitter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isDraft<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
metadata<br />
<a href="/api/objects#bsdasrimetadata"><code>BsdasriMetadata!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api/objects#bsdasrioperation"><code>BsdasriOperation</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api/objects#bsdasrireception"><code>BsdasriReception</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api/objects#bsdasrirecipient"><code>BsdasriRecipient</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
regroupedBsdasris<br />
<a href="/api/scalars#id"><code>[ID!]</code></a>
</td>
<td>
<p>Bordereaux regroupés</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#bsdasristatus"><code>BsdasriStatus!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api/objects#bsdasritransport"><code>BsdasriTransport</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/objects#bsdasritransporter"><code>BsdasriTransporter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api/objects#bsdasriedge"><code>[BsdasriEdge!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
pageInfo<br />
<a href="/api/objects#pageinfo"><code>PageInfo!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
totalCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
node<br />
<a href="/api/objects#bsdasri"><code>Bsdasri!</code></a>
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
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/objects#bsdasrisignature"><code>BsdasriSignature</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api/objects#bsdasriwastedetails"><code>BsdasriWasteDetails</code></a>
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
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement émetteur</p>
</td>
</tr>
<tr>
<td>
customInfo<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Champ libre</p>
</td>
</tr>
<tr>
<td>
handOverToTransporterAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de remise au tranporteur</p>
</td>
</tr>
<tr>
<td>
onBehalfOfEcoorganisme<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>
<p>Agit pour le compte de l&#39;éco organisme agréé</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#bsdasriemittertype"><code>BsdasriEmitterType</code></a>
</td>
<td>
<p>Type d&#39;émetteur</p>
</td>
</tr>
<tr>
<td>
workSite<br />
<a href="/api/objects#worksite"><code>WorkSite</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
path<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
requiredFor<br />
<a href="/api/enums#bsdasrisignaturetype"><code>[BsdasriSignatureType!]!</code></a>
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
<a href="/api/objects#bsdasrierror"><code>[BsdasriError]!</code></a>
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
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
processingOperation<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/objects#bsdasrisignature"><code>BsdasriSignature</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Description du conditionnement dans le cas où le type de conditionnement est <code>AUTRE</code></p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Nombre de colis associés à ce conditionnement</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#bsdasripackagings"><code>BsdasriPackagings!</code></a>
</td>
<td>
<p>Type de conditionnement</p>
</td>
</tr>
<tr>
<td>
volume<br />
<a href="/api/scalars#int"><code>Int!</code></a>
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
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/objects#bsdasrisignature"><code>BsdasriSignature</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteAcceptation<br />
<a href="/api/objects#bsdasriwasteacceptation"><code>BsdasriWasteAcceptation</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api/objects#bsdasriwastedetails"><code>BsdasriWasteDetails</code></a>
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
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Installation destinataire</p>
</td>
</tr>
<tr>
<td>
customInfo<br />
<a href="/api/scalars#string"><code>String</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
date<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/objects#bsdasrisignature"><code>BsdasriSignature</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
takenOverAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteAcceptation<br />
<a href="/api/objects#bsdasriwasteacceptation"><code>BsdasriWasteAcceptation</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api/objects#bsdasriwastedetails"><code>BsdasriWasteDetails</code></a>
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
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement de destination</p>
</td>
</tr>
<tr>
<td>
customInfo<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Champ libre</p>
</td>
</tr>
<tr>
<td>
receipt<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de récipissé</p>
</td>
</tr>
<tr>
<td>
receiptDepartment<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Département</p>
</td>
</tr>
<tr>
<td>
receiptValidityLimit<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
refusedQuantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/scalars#string"><code>String</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
packagingInfos<br />
<a href="/api/objects#bsdasripackaginginfo"><code>[BsdasriPackagingInfo!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantityType<br />
<a href="/api/enums#quantitytype"><code>QuantityType</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
volume<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

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
<a href="/api/objects#signature"><code>Signature</code></a>
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
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Coordonnées de l&#39;entreprise de transport</p>
</td>
</tr>
<tr>
<td>
recepisse<br />
<a href="/api/objects#bsdarecepisse"><code>BsdaRecepisse</code></a>
</td>
<td>
<p>Récépissé transporteur</p>
</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api/objects#bsdatransport"><code>BsdaTransport</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Mention ADR</p>
</td>
</tr>
<tr>
<td>
code<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Rubrique Déchet</p>
</td>
</tr>
<tr>
<td>
consistence<br />
<a href="/api/enums#bsdaconsistence"><code>BsdaConsistence</code></a>
</td>
<td>
<p>Consistence</p>
</td>
</tr>
<tr>
<td>
familyCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code famille</p>
</td>
</tr>
<tr>
<td>
materialName<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom du matériau</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Dénomination usuelle</p>
</td>
</tr>
<tr>
<td>
sealNumbers<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
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
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Indique si l&#39;entreprise de travaux a une signature papier du MOA/détenteur du déchet
Remettre une signature papier permet au détenteur de ne pas à avoir à signer sur la plateforme</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/objects#signature"><code>Signature</code></a>
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
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Entreprise de travaux</p>
</td>
</tr>
<tr>
<td>
work<br />
<a href="/api/objects#bsdawork"><code>BsdaWork</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
city<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
infos<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Autres informations, notamment le code chantier</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
postalCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Bsff



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
bsffs<br />
<a href="/api/objects#bsff"><code>[Bsff!]!</code></a>
</td>
<td>
<p>Liste des bordereaux que celui-ci regroupe, dans le cas d&#39;un regroupement, reconditionnement ou d&#39;une réexpédition.</p>
</td>
</tr>
<tr>
<td>
destination<br />
<a href="/api/objects#bsffdestination"><code>BsffDestination</code></a>
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
<a href="/api/objects#bsffemitter"><code>BsffEmitter</code></a>
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
<a href="/api/objects#bsffficheintervention"><code>[BsffFicheIntervention!]!</code></a>
</td>
<td>
<p>Liste des fiches d&#39;intervention associés à ce bordereau.
Habituellement renseigné par un opérateur lors de son intervention.</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Identifiant unique assigné par Trackdéchets.
Il est à utiliser pour les échanges avec l&#39;API.</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api/objects#bsffpackaging"><code>[BsffPackaging!]!</code></a>
</td>
<td>
<p>Liste des contenants utilisés pour le transport des fluides.</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/objects#bsffquantity"><code>BsffQuantity</code></a>
</td>
<td>
<p>Quantité totale du déchet, qu&#39;elle soit réelle ou estimée.</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/objects#bsfftransporter"><code>BsffTransporter</code></a>
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
<a href="/api/objects#bsffwaste"><code>BsffWaste</code></a>
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
<a href="/api/objects#bsffedge"><code>[BsffEdge!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
pageInfo<br />
<a href="/api/objects#pageinfo"><code>PageInfo!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
totalCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro CAP.</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api/objects#formcompany"><code>FormCompany!</code></a>
</td>
<td>
<p>Entreprise réceptionant le déchet.</p>
</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api/objects#bsffoperation"><code>BsffOperation</code></a>
</td>
<td>
<p>Déclaration de traitement du déchet.</p>
</td>
</tr>
<tr>
<td>
plannedOperation<br />
<a href="/api/objects#bsffplannedoperation"><code>BsffPlannedOperation!</code></a>
</td>
<td>
<p>Opération de traitement prévu initialement.</p>
</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api/objects#bsffreception"><code>BsffReception</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
node<br />
<a href="/api/objects#bsff"><code>Bsff!</code></a>
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
<a href="/api/objects#signature"><code>Signature!</code></a>
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
<a href="/api/objects#formcompany"><code>FormCompany!</code></a>
</td>
<td>
<p>Entreprise émettant le déchet.</p>
</td>
</tr>
<tr>
<td>
emission<br />
<a href="/api/objects#bsffemission"><code>BsffEmission</code></a>
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
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Poids total des fluides récupérés lors de cette intervention.</p>
</td>
</tr>
<tr>
<td>
numero<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro de la fiche d&#39;intervention, habituellement renseigné par l&#39;opérateur.</p>
</td>
</tr>
<tr>
<td>
owner<br />
<a href="/api/objects#bsffowner"><code>BsffOwner</code></a>
</td>
<td>
<p>Détenteur de l&#39;équipement sur lequel est intervenu l&#39;opérateur.
À noter que dû à la valeur commerciale de ces informations, leur visibilité est limité aux acteurs en contact direct.</p>
</td>
</tr>
<tr>
<td>
postalCode<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Code postal du lieu où l&#39;intervention a eu lieu.</p>
</td>
</tr>
</tbody>
</table>

## BsffOperation



<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [IBsffOperation](/api/interfaces#ibsffoperation)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
code<br />
<a href="/api/enums#bsffoperationcode"><code>BsffOperationCode</code></a>
</td>
<td>
<p>Code de l&#39;opération de traitement.</p>
</td>
</tr>
<tr>
<td>
qualification<br />
<a href="/api/enums#bsffoperationqualification"><code>BsffOperationQualification!</code></a>
</td>
<td>
<p>Qualification plus précise du type d&#39;opération réalisée.</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/objects#signature"><code>Signature</code></a>
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
<a href="/api/objects#formcompany"><code>FormCompany!</code></a>
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
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Volume en litres des fluides à l&#39;intérieur du contenant.</p>
</td>
</tr>
<tr>
<td>
numero<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro du contenant.</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#bsffpackagingtype"><code>BsffPackagingType!</code></a>
</td>
<td>
<p>Type de contenant.</p>
</td>
</tr>
</tbody>
</table>

## BsffPlannedOperation



<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [IBsffOperation](/api/interfaces#ibsffoperation)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
code<br />
<a href="/api/enums#bsffoperationcode"><code>BsffOperationCode</code></a>
</td>
<td>
<p>Code de l&#39;opération de traitement prévu.</p>
</td>
</tr>
<tr>
<td>
qualification<br />
<a href="/api/enums#bsffoperationqualification"><code>BsffOperationQualification!</code></a>
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
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>
<p>Si il s&#39;agit d&#39;une estimation ou d&#39;un poids réel.</p>
</td>
</tr>
<tr>
<td>
kilos<br />
<a href="/api/scalars#int"><code>Int!</code></a>
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
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de réception du déchet.</p>
</td>
</tr>
<tr>
<td>
kilos<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Quantité totale du déchet, qu&#39;elle soit réelle ou estimée.</p>
</td>
</tr>
<tr>
<td>
refusal<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>En cas de refus, le motif.</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/objects#signature"><code>Signature</code></a>
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
<a href="/api/enums#transportmode"><code>TransportMode!</code></a>
</td>
<td>
<p>Mode de transport utilisé.</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/objects#signature"><code>Signature!</code></a>
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
<a href="/api/objects#formcompany"><code>FormCompany!</code></a>
</td>
<td>
<p>Entreprise responsable du transport du déchet.</p>
</td>
</tr>
<tr>
<td>
recepisse<br />
<a href="/api/objects#bsfftransporterrecepisse"><code>BsffTransporterRecepisse</code></a>
</td>
<td>
<p>Récépissé du transporteur, à moins d&#39;être exempté.</p>
</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api/objects#bsfftransport"><code>BsffTransport</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Département auquel est lié le récépissé.</p>
</td>
</tr>
<tr>
<td>
number<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro du récépissé.</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Mention ADR.</p>
</td>
</tr>
<tr>
<td>
code<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Code déchet.</p>
</td>
</tr>
<tr>
<td>
description<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Description du déchet, permet de le qualifier de façon plus précise.</p>
</td>
</tr>
</tbody>
</table>

## Bsvhu



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
createdAt<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de création</p>
</td>
</tr>
<tr>
<td>
destination<br />
<a href="/api/objects#bsvhudestination"><code>BsvhuDestination</code></a>
</td>
<td>
<p>Destinataire du bordereau</p>
</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/objects#bsvhuemitter"><code>BsvhuEmitter</code></a>
</td>
<td>
<p>Émetteur du bordereau</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Numéro unique attribué par Trackdéchets</p>
</td>
</tr>
<tr>
<td>
identification<br />
<a href="/api/objects#bsvhuidentification"><code>BsvhuIdentification</code></a>
</td>
<td>
<p>Identification des VHUs</p>
</td>
</tr>
<tr>
<td>
isDraft<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>
<p>Indique si le bordereau est à l&#39;état de brouillon</p>
</td>
</tr>
<tr>
<td>
metadata<br />
<a href="/api/objects#bsvhumetadata"><code>BsvhuMetadata!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
packaging<br />
<a href="/api/enums#bsvhupackaging"><code>BsvhuPackaging</code></a>
</td>
<td>
<p>Conditionnement du déchet</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/objects#bsvhuquantity"><code>BsvhuQuantity</code></a>
</td>
<td>
<p>Quantité de VHUs</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#bsvhustatus"><code>BsvhuStatus!</code></a>
</td>
<td>
<p>Status du bordereau</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/objects#bsvhutransporter"><code>BsvhuTransporter</code></a>
</td>
<td>
<p>Transporteur</p>
</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de dernière modification</p>
</td>
</tr>
<tr>
<td>
wasteCode<br />
<a href="/api/scalars#string"><code>String</code></a>
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
<a href="/api/objects#bsvhuedge"><code>[BsvhuEdge!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
pageInfo<br />
<a href="/api/objects#pageinfo"><code>PageInfo!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
totalCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro d&#39;agrément de receveur</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Coordonnées de l&#39;entreprise qui recoit les déchets</p>
</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api/objects#bsvhuoperation"><code>BsvhuOperation</code></a>
</td>
<td>
<p>Informations sur l&#39;opétation de traitement</p>
</td>
</tr>
<tr>
<td>
plannedOperationCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Opération d&#39;élimination / valorisation prévue (code D/R)</p>
</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api/objects#bsvhureception"><code>BsvhuReception</code></a>
</td>
<td>
<p>Informations de réception</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#bsvhudestinationtype"><code>BsvhuDestinationType</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
node<br />
<a href="/api/objects#bsvhu"><code>Bsvhu!</code></a>
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
<a href="/api/objects#signature"><code>Signature</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro d&#39;agrément émetteur</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Coordonnées de l&#39;entreprise émétrice</p>
</td>
</tr>
<tr>
<td>
emission<br />
<a href="/api/objects#bsvhuemission"><code>BsvhuEmission</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
path<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
requiredFor<br />
<a href="/api/enums#signaturetypeinput"><code>SignatureTypeInput!</code></a>
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
<a href="/api/scalars#string"><code>[String]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#bsvhuidentificationtype"><code>BsvhuIdentificationType</code></a>
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
<a href="/api/objects#bsvhuerror"><code>[BsvhuError!]!</code></a>
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
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Opération de traitement réalisée (R4 ou R12)</p>
</td>
</tr>
<tr>
<td>
date<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de réalisation</p>
</td>
</tr>
<tr>
<td>
nextDestination<br />
<a href="/api/objects#bsvhunextdestination"><code>BsvhuNextDestination</code></a>
</td>
<td>
<p>Broyeur de destination, à remplir uniquement lorsque la destination est lui même un centre VHU</p>
</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/objects#signature"><code>Signature</code></a>
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
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
tons<br />
<a href="/api/scalars#float"><code>Float</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
number<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api/enums#bsvhuacceptationstatus"><code>BsvhuAcceptationStatus</code></a>
</td>
<td>
<p>Lot accepté oui/non</p>
</td>
</tr>
<tr>
<td>
date<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de présentation sur site</p>
</td>
</tr>
<tr>
<td>
identification<br />
<a href="/api/objects#bsvhuidentification"><code>BsvhuIdentification</code></a>
</td>
<td>
<p>Identification éventuelle des VHU à la reception (numéro de lots ou d&#39;ordre)</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/objects#bsvhuquantity"><code>BsvhuQuantity</code></a>
</td>
<td>
<p>Quantité réelle reçue</p>
</td>
</tr>
<tr>
<td>
refusalReason<br />
<a href="/api/scalars#string"><code>String</code></a>
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
<a href="/api/objects#signature"><code>Signature</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
takenOverAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Coordonnées de l&#39;entreprise de transport</p>
</td>
</tr>
<tr>
<td>
recepisse<br />
<a href="/api/objects#bsvhurecepisse"><code>BsvhuRecepisse</code></a>
</td>
<td>
<p>Récépissé transporteur</p>
</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api/objects#bsvhutransport"><code>BsvhuTransport</code></a>
</td>
<td>
<p>Informations liés au transport</p>
</td>
</tr>
</tbody>
</table>

## CompanyMember

Information sur utilisateur au sein d'un établissement

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
email<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Email</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Identifiant opaque</p>
</td>
</tr>
<tr>
<td>
isActive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Si oui ou non l&#39;email de l&#39;utilisateur a été confirmé</p>
</td>
</tr>
<tr>
<td>
isMe<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Si oui ou non cet utilisateur correspond à l&#39;utilisateur authentifié</p>
</td>
</tr>
<tr>
<td>
isPendingInvitation<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Si oui ou non une une invitation à joindre l&#39;établissement est en attente</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;utilisateur</p>
</td>
</tr>
<tr>
<td>
role<br />
<a href="/api/enums#userrole"><code>UserRole</code></a>
</td>
<td>
<p>Rôle de l&#39;utilisateur dans l&#39;établissement (admin ou membre)</p>
</td>
</tr>
</tbody>
</table>

## CompanyPrivate

Information sur un établissement accessible par un utilisateur membre

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Adresse de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
brokerReceipt<br />
<a href="/api/objects#brokerreceipt"><code>BrokerReceipt</code></a>
</td>
<td>
<p>Récépissé courtier (le cas échéant, pour les profils courtier)</p>
</td>
</tr>
<tr>
<td>
companyTypes<br />
<a href="/api/enums#companytype"><code>[CompanyType!]!</code></a>
</td>
<td>
<p>Profil de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
contactEmail<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Email de contact (visible sur la fiche entreprise)</p>
</td>
</tr>
<tr>
<td>
contactPhone<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de téléphone de contact (visible sur la fiche entreprise)</p>
</td>
</tr>
<tr>
<td>
ecoOrganismeAgreements<br />
<a href="/api/scalars#url"><code>[URL!]!</code></a>
</td>
<td>
<p>Liste des agréments de l&#39;éco-organisme</p>
</td>
</tr>
<tr>
<td>
gerepId<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Identifiant GEREP</p>
</td>
</tr>
<tr>
<td>
givenName<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom d&#39;usage de l&#39;entreprise qui permet de différencier
différents établissements ayant le même nom</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Identifiant opaque</p>
</td>
</tr>
<tr>
<td>
installation<br />
<a href="/api/objects#installation"><code>Installation</code></a>
</td>
<td>
<p>Installation classée pour la protection de l&#39;environnement (ICPE)
associé à cet établissement (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
libelleNaf<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Libellé NAF de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
naf<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code NAF de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
securityCode<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Code de signature permettant de signer les BSD</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
traderReceipt<br />
<a href="/api/objects#traderreceipt"><code>TraderReceipt</code></a>
</td>
<td>
<p>Récépissé négociant (le cas échéant, pour les profils négociant)</p>
</td>
</tr>
<tr>
<td>
transporterReceipt<br />
<a href="/api/objects#transporterreceipt"><code>TransporterReceipt</code></a>
</td>
<td>
<p>Récépissé transporteur (le cas échéant, pour les profils transporteur)</p>
</td>
</tr>
<tr>
<td>
userRole<br />
<a href="/api/enums#userrole"><code>UserRole</code></a>
</td>
<td>
<p>Rôle de l&#39;utilisateur authentifié cau sein de cet établissement</p>
</td>
</tr>
<tr>
<td>
users<br />
<a href="/api/objects#companymember"><code>[CompanyMember!]</code></a>
</td>
<td>
<p>Liste des utilisateurs appartenant à cet établissement</p>
</td>
</tr>
<tr>
<td>
verificationStatus<br />
<a href="/api/enums#companyverificationstatus"><code>CompanyVerificationStatus!</code></a>
</td>
<td>
<p>État du processus de vérification de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
vhuAgrementBroyeur<br />
<a href="/api/objects#vhuagrement"><code>VhuAgrement</code></a>
</td>
<td>
<p>Agrément broyeur (le cas échéant, pour les profils VHU)</p>
</td>
</tr>
<tr>
<td>
vhuAgrementDemolisseur<br />
<a href="/api/objects#vhuagrement"><code>VhuAgrement</code></a>
</td>
<td>
<p>Agrément démolisseur (le cas échéant, pour les profils VHU)</p>
</td>
</tr>
<tr>
<td>
website<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Site web (visible sur la fiche entreprise)</p>
</td>
</tr>
</tbody>
</table>

## CompanyPublic

Information sur un établissement accessible publiquement

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Adresse de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
brokerReceipt<br />
<a href="/api/objects#brokerreceipt"><code>BrokerReceipt</code></a>
</td>
<td>
<p>Récépissé courtier associé à cet établissement (le cas échant)</p>
</td>
</tr>
<tr>
<td>
companyTypes<br />
<a href="/api/enums#companytype"><code>[CompanyType!]!</code></a>
</td>
<td>
<p>Profil de l&#39;établissement sur Trackdéchets
ayant pour valeur un tableau vide quand l&#39;établissement
n&#39;est pas inscrit sur la plateforme <code>isRegistered=false</code></p>
</td>
</tr>
<tr>
<td>
contactEmail<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Email de contact</p>
</td>
</tr>
<tr>
<td>
contactPhone<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de téléphone de contact</p>
</td>
</tr>
<tr>
<td>
ecoOrganismeAgreements<br />
<a href="/api/scalars#url"><code>[URL!]!</code></a>
</td>
<td>
<p>Liste des agréments de l&#39;éco-organisme</p>
</td>
</tr>
<tr>
<td>
etatAdministratif<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>État administratif de l&#39;établissement. A = Actif, F = Fermé</p>
</td>
</tr>
<tr>
<td>
installation<br />
<a href="/api/objects#installation"><code>Installation</code></a>
</td>
<td>
<p>Installation classée pour la protection de l&#39;environnement (ICPE)
associé à cet établissement</p>
</td>
</tr>
<tr>
<td>
isRegistered<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Si oui on non cet établissement est inscrit sur la plateforme Trackdéchets</p>
</td>
</tr>
<tr>
<td>
libelleNaf<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Libellé NAF</p>
</td>
</tr>
<tr>
<td>
naf<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code NAF</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
traderReceipt<br />
<a href="/api/objects#traderreceipt"><code>TraderReceipt</code></a>
</td>
<td>
<p>Récépissé négociant associé à cet établissement (le cas échant)</p>
</td>
</tr>
<tr>
<td>
transporterReceipt<br />
<a href="/api/objects#transporterreceipt"><code>TransporterReceipt</code></a>
</td>
<td>
<p>Récépissé transporteur associé à cet établissement (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
vhuAgrementBroyeur<br />
<a href="/api/objects#vhuagrement"><code>VhuAgrement</code></a>
</td>
<td>
<p>Agrément VHU broyeur (le cas échéant, pour les profils VHU)</p>
</td>
</tr>
<tr>
<td>
vhuAgrementDemolisseur<br />
<a href="/api/objects#vhuagrement"><code>VhuAgrement</code></a>
</td>
<td>
<p>Agrément VHU démolisseur (le cas échéant, pour les profils VHU)</p>
</td>
</tr>
<tr>
<td>
website<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Site web</p>
</td>
</tr>
</tbody>
</table>

## CompanySearchResult

Information sur un établissement accessible publiquement en recherche

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Adresse de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
brokerReceipt<br />
<a href="/api/objects#brokerreceipt"><code>BrokerReceipt</code></a>
</td>
<td>
<p>Récépissé courtier associé à cet établissement (le cas échant)</p>
</td>
</tr>
<tr>
<td>
codeCommune<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code commune de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
etatAdministratif<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>État administratif de l&#39;établissement. A = Actif, F = Fermé</p>
</td>
</tr>
<tr>
<td>
installation<br />
<a href="/api/objects#installation"><code>Installation</code></a>
</td>
<td>
<p>Installation classée pour la protection de l&#39;environnement (ICPE)
associé à cet établissement</p>
</td>
</tr>
<tr>
<td>
libelleNaf<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Libellé NAF</p>
</td>
</tr>
<tr>
<td>
naf<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code NAF</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
traderReceipt<br />
<a href="/api/objects#traderreceipt"><code>TraderReceipt</code></a>
</td>
<td>
<p>Récépissé négociant associé à cet établissement (le cas échant)</p>
</td>
</tr>
<tr>
<td>
transporterReceipt<br />
<a href="/api/objects#transporterreceipt"><code>TransporterReceipt</code></a>
</td>
<td>
<p>Récépissé transporteur associé à cet établissement (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
vhuAgrementBroyeur<br />
<a href="/api/objects#vhuagrement"><code>VhuAgrement</code></a>
</td>
<td>
<p>Agrément VHU broyeur (le cas échéant, pour les profils VHU)</p>
</td>
</tr>
<tr>
<td>
vhuAgrementDemolisseur<br />
<a href="/api/objects#vhuagrement"><code>VhuAgrement</code></a>
</td>
<td>
<p>Agrément VHU démolisseur (le cas échéant, pour les profils VHU)</p>
</td>
</tr>
</tbody>
</table>

## CompanyStat

Statistiques d'un établissement

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement</p>
</td>
</tr>
<tr>
<td>
stats<br />
<a href="/api/objects#stat"><code>[Stat!]!</code></a>
</td>
<td>
<p>Liste des statistiques</p>
</td>
</tr>
</tbody>
</table>

## Declaration

Représente une ligne dans une déclaration GEREP

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
annee<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Année de la déclaration</p>
</td>
</tr>
<tr>
<td>
codeDechet<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code du déchet</p>
</td>
</tr>
<tr>
<td>
gerepType<br />
<a href="/api/enums#gereptype"><code>GerepType</code></a>
</td>
<td>
<p>Type de déclaration GEREP: producteur ou traiteur</p>
</td>
</tr>
<tr>
<td>
libDechet<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Description du déchet</p>
</td>
</tr>
</tbody>
</table>

## Destination



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
cap<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de CAP (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement de destination</p>
</td>
</tr>
<tr>
<td>
isFilledByEmitter<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Indique si l&#39;information a été saisie par l&#39;émetteur du bordereau ou l&#39;installation d&#39;entreposage</p>
</td>
</tr>
<tr>
<td>
processingOperation<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Opération d&#39;élimination / valorisation prévue (code D/R)</p>
</td>
</tr>
</tbody>
</table>

## EcoOrganisme

Eco-organisme
Les éco-organismes n'apparaissent pas en case 1 du bordereau mais sont quand même responsables du déchet.
C'est l'entreprise de collecte de déchet qui apparait en case 1.
Pour pouvoir saisir un éco-organisme, le détenteur du déchet doit être défini comme 'Autre détenteur'.
Seul un éco-organisme enregistré dans Trackdéchet peut être associé.

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Adresse de l&#39;éco-organisme</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de l&#39;éco-organisme</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Siret de l&#39;éco-organisme</p>
</td>
</tr>
</tbody>
</table>

## Emitter

Émetteur du BSD (case 1)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement émetteur</p>
</td>
</tr>
<tr>
<td>
pickupSite<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<blockquote>Deprecated: Migration vers `workSite` obligatoire</blockquote>

<p>DEPRECATED - Ancienne adresse chantier</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#emittertype"><code>EmitterType</code></a>
</td>
<td>
<p>Type d&#39;émetteur</p>
</td>
</tr>
<tr>
<td>
workSite<br />
<a href="/api/objects#worksite"><code>WorkSite</code></a>
</td>
<td>
<p>Adresse du chantier</p>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Lien de téléchargement</p>
</td>
</tr>
<tr>
<td>
token<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Token ayant une durée de validité de 10s</p>
</td>
</tr>
</tbody>
</table>

## Form

Bordereau de suivi de déchets (BSD)
Version dématérialisée du [CERFA n°12571*01](https://www.service-public.fr/professionnels-entreprises/vosdroits/R14334)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
actualQuantity<br />
<a href="/api/scalars#float"><code>Float</code></a>
</td>
<td>
<p>Quantité actuellement connue en tonnes.
Elle est calculée en fonction des autres champs pour renvoyer la dernière quantité connue.
Elle renvoi ainsi soit la quantité envoyée estimée, soit la quantitée recue sur le site d&#39;entreposage, soit la quantitée réelle recue.</p>
</td>
</tr>
<tr>
<td>
appendix2Forms<br />
<a href="/api/objects#form"><code>[Form!]</code></a>
</td>
<td>
<p>Annexe 2</p>
</td>
</tr>
<tr>
<td>
broker<br />
<a href="/api/objects#broker"><code>Broker</code></a>
</td>
<td>
<p>Courtier</p>
</td>
</tr>
<tr>
<td>
createdAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de création du BSD</p>
</td>
</tr>
<tr>
<td>
currentTransporterSiret<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
customId<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Identifiant personnalisé permettant de faire le lien avec un
objet un système d&#39;information tierce</p>
</td>
</tr>
<tr>
<td>
ecoOrganisme<br />
<a href="/api/objects#formecoorganisme"><code>FormEcoOrganisme</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/objects#emitter"><code>Emitter</code></a>
</td>
<td>
<p>Établissement émetteur/producteur du déchet (case 1)</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Identifiant unique du bordereau.</p>
</td>
</tr>
<tr>
<td>
isImportedFromPaper<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>
<p>Permet de savoir si les données du BSD ont été importées depuis un
bordereau signé papier via la mutation <code>importPaperForm</code></p>
</td>
</tr>
<tr>
<td>
nextDestination<br />
<a href="/api/objects#nextdestination"><code>NextDestination</code></a>
</td>
<td>
<p>Destination ultérieure prévue (case 12)</p>
</td>
</tr>
<tr>
<td>
nextTransporterSiret<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
noTraceability<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Si oui ou non il y a eu perte de traçabalité</p>
</td>
</tr>
<tr>
<td>
processedAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été traité</p>
</td>
</tr>
<tr>
<td>
processedBy<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Personne en charge du traitement</p>
</td>
</tr>
<tr>
<td>
processingOperationDescription<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Description de l&#39;opération d’élimination / valorisation (case 11)</p>
</td>
</tr>
<tr>
<td>
processingOperationDone<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Traitement réalisé (code D/R)</p>
</td>
</tr>
<tr>
<td>
quantityReceived<br />
<a href="/api/scalars#float"><code>Float</code></a>
</td>
<td>
<p>Quantité réelle présentée (case 10)</p>
</td>
</tr>
<tr>
<td>
readableId<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Identifiant lisible utilisé comme numéro sur le CERFA (case &quot;Bordereau n°****&quot;).
Il est possible de l&#39;utiliser pour récupérer l&#39;identifiant unique du bordereau via la query form,
utilisé pour le reste des opérations.
Cet identifiant possède le format BSD-&lbrace;yyyyMMdd&rbrace;-&lbrace;XXXXXXXX&rbrace; où yyyyMMdd est la date du jour
et XXXXXXXXX une chaine de 9 caractères alphanumériques. Ex: BSD-20210101-HY87F54D1</p>
</td>
</tr>
<tr>
<td>
receivedAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été reçu (case 10)</p>
</td>
</tr>
<tr>
<td>
receivedBy<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de la personne en charge de la réception du déchet (case 10)</p>
</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api/objects#recipient"><code>Recipient</code></a>
</td>
<td>
<p>Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)</p>
</td>
</tr>
<tr>
<td>
sentAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de l&#39;envoi du déchet par l&#39;émetteur (case 9)</p>
</td>
</tr>
<tr>
<td>
sentBy<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de la personne responsable de l&#39;envoi du déchet (case 9)</p>
</td>
</tr>
<tr>
<td>
signedAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été accepté ou refusé (case 10)</p>
</td>
</tr>
<tr>
<td>
signedByTransporter<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Si oui ou non le BSD a été signé par un transporteur</p>
</td>
</tr>
<tr>
<td>
stateSummary<br />
<a href="/api/objects#statesummary"><code>StateSummary</code></a>
</td>
<td>
<p>Résumé des valeurs clés du bordereau à l&#39;instant T</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#formstatus"><code>FormStatus!</code></a>
</td>
<td>
<p>Statut du BSD (brouillon, envoyé, reçu, traité, etc)</p>
</td>
</tr>
<tr>
<td>
temporaryStorageDetail<br />
<a href="/api/objects#temporarystoragedetail"><code>TemporaryStorageDetail</code></a>
</td>
<td>
<p>BSD suite - détail des champs de la partie entreposage provisoire ou reconditionnement</p>
</td>
</tr>
<tr>
<td>
trader<br />
<a href="/api/objects#trader"><code>Trader</code></a>
</td>
<td>
<p>Négociant (case 7)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/objects#transporter"><code>Transporter</code></a>
</td>
<td>
<p>Transporteur du déchet (case 8)</p>
</td>
</tr>
<tr>
<td>
transportSegments<br />
<a href="/api/objects#transportsegment"><code>[TransportSegment!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de la dernière modification du BSD</p>
</td>
</tr>
<tr>
<td>
wasteAcceptationStatus<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Statut d&#39;acceptation du déchet (case 10)</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api/objects#wastedetails"><code>WasteDetails</code></a>
</td>
<td>
<p>Détails du déchet (case 3)</p>
</td>
</tr>
<tr>
<td>
wasteRefusalReason<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Raison du refus (case 10)</p>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Adresse de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
contact<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
country<br />
<a href="/api/scalars#string"><code>String</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Email du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
phone<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de téléphone de contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
vatNumber<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de TVA intracommunautaire</p>
</td>
</tr>
</tbody>
</table>

## FormEcoOrganisme

Information sur l'éco-organisme responsable du BSD

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## formsLifeCycleData

Informations du cycle de vie des bordereaux

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
count<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>Nombre de changements de statuts renvoyés</p>
</td>
</tr>
<tr>
<td>
endCursor<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Dernier ID de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle</p>
</td>
</tr>
<tr>
<td>
hasNextPage<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>pagination, indique si d&#39;autres pages existent après</p>
</td>
</tr>
<tr>
<td>
hasPreviousPage<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>pagination, indique si d&#39;autres pages existent avant</p>
</td>
</tr>
<tr>
<td>
startCursor<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Premier id de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle</p>
</td>
</tr>
<tr>
<td>
statusLogs<br />
<a href="/api/objects#statuslog"><code>[StatusLog!]!</code></a>
</td>
<td>
<p>Liste des changements de statuts</p>
</td>
</tr>
</tbody>
</table>

## FormSubscription

DEPRECATED - Privilégier l'utilisation d'un polling régulier sur la query `formsLifeCycle`

Mise à jour d'un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
mutation<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Type de mutation</p>
</td>
</tr>
<tr>
<td>
node<br />
<a href="/api/objects#form"><code>Form</code></a>
</td>
<td>
<p>BSD concerné</p>
</td>
</tr>
<tr>
<td>
previousValues<br />
<a href="/api/objects#form"><code>Form</code></a>
</td>
<td>
<p>Ancienne valeurs</p>
</td>
</tr>
<tr>
<td>
updatedFields<br />
<a href="/api/scalars#string"><code>[String]</code></a>
</td>
<td>
<p>Liste des champs mis à jour</p>
</td>
</tr>
</tbody>
</table>

## Installation

Installation pour la protection de l'environnement (ICPE)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
codeS3ic<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Identifiant S3IC</p>
</td>
</tr>
<tr>
<td>
declarations<br />
<a href="/api/objects#declaration"><code>[Declaration!]</code></a>
</td>
<td>
<p>Liste des déclarations GEREP</p>
</td>
</tr>
<tr>
<td>
rubriques<br />
<a href="/api/objects#rubrique"><code>[Rubrique!]</code></a>
</td>
<td>
<p>Liste des rubriques associées</p>
</td>
</tr>
<tr>
<td>
urlFiche<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>URL de la fiche ICPE sur Géorisques</p>
</td>
</tr>
</tbody>
</table>

## MembershipRequest

Demande de rattachement à un établissement effectué par
un utilisateur.

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
email<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Email de l&#39;utilisateur faisant la demande</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
sentTo<br />
<a href="/api/scalars#string"><code>[String!]!</code></a>
</td>
<td>
<p>Liste des adresses email correspondant aux comptes administrateurs à qui la demande
de rattachement a été envoyée. Les adresses emails sont partiellement masquées de la
façon suivante j********<a href="mailto:&#x77;&#x40;&#x74;&#114;&#x61;&#x63;&#107;&#x64;&#101;&#99;&#104;&#x65;&#116;&#x73;&#46;&#102;&#x72;">&#x77;&#x40;&#x74;&#114;&#x61;&#x63;&#107;&#x64;&#101;&#99;&#104;&#x65;&#116;&#x73;&#46;&#102;&#x72;</a></p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#membershiprequeststatus"><code>MembershipRequestStatus!</code></a>
</td>
<td>
<p>Statut de la demande de rattachement</p>
</td>
</tr>
</tbody>
</table>

## NextDestination

Destination ultérieure prévue (case 12)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement ultérieure</p>
</td>
</tr>
<tr>
<td>
processingOperation<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Traitement prévue (code D/R)</p>
</td>
</tr>
</tbody>
</table>

## PackagingInfo

Informations sur le conditionnement

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
other<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Description du conditionnement dans le cas où le type de conditionnement est <code>AUTRE</code></p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Nombre de colis associés à ce conditionnement</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#packagings"><code>Packagings!</code></a>
</td>
<td>
<p>Type de conditionnement</p>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hasNextPage<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hasPreviousPage<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
startCursor<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Recipient

Installation de destination ou d'entreprosage
ou de reconditionnement prévue (case 2)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
cap<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de CAP (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement de destination</p>
</td>
</tr>
<tr>
<td>
isTempStorage<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Indique si c&#39;est un établissement d&#39;entreposage temporaire ou de reocnditionnement</p>
</td>
</tr>
<tr>
<td>
processingOperation<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Opération d&#39;élimination / valorisation prévue (code D/R)</p>
</td>
</tr>
</tbody>
</table>

## Rubrique

Rubrique ICPE d'un établissement avec les autorisations associées
Pour plus de détails, se référer à la
[nomenclature des ICPE](https://www.georisques.gouv.fr/articles-risques/les-installations-classees-pour-la-protection-de-lenvironnement#nomenclature-des-installations-classees)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
activite<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Description de l&#39;activité:
Ex: traitement thermique de déchets dangereux</p>
</td>
</tr>
<tr>
<td>
alinea<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Alinéa pour la rubrique concerné</p>
</td>
</tr>
<tr>
<td>
category<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Catégorie d&#39;établissement associé: TTR, VHU, Traitement</p>
</td>
</tr>
<tr>
<td>
etatActivite<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>État de l&#39;activité, ex: &#39;En fonct&#39;, &#39;À l&#39;arrêt&#39;</p>
</td>
</tr>
<tr>
<td>
regimeAutorise<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Régime autorisé pour la rubrique: déclaratif, autorisation, seveso, etc</p>
</td>
</tr>
<tr>
<td>
rubrique<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro de rubrique tel que défini dans la nomenclature des ICPE
Ex: 2710</p>
</td>
</tr>
<tr>
<td>
unite<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Unité utilisé pour le volume autorisé</p>
</td>
</tr>
<tr>
<td>
volume<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Volume autorisé</p>
</td>
</tr>
<tr>
<td>
wasteType<br />
<a href="/api/enums#wastetype"><code>WasteType</code></a>
</td>
<td>
<p>Type de déchets autorisé</p>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
date<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Stat

Statistiques

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
incoming<br />
<a href="/api/scalars#float"><code>Float!</code></a>
</td>
<td>
<p>Quantité entrante</p>
</td>
</tr>
<tr>
<td>
outgoing<br />
<a href="/api/scalars#float"><code>Float!</code></a>
</td>
<td>
<p>Qantité sortante</p>
</td>
</tr>
<tr>
<td>
wasteCode<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Code déchet</p>
</td>
</tr>
</tbody>
</table>

## StateSummary

En fonction du statut du bordereau, différentes informations sont à lire pour connaitre vraiment l'étast du bordereau:
- la quantité peut changer entre émission, réception, entreposage provisoire...
- le bordereau peut naviguer entre plusieurs entreprises.
- quand le bordereau a-t-il été modifié pour la dernière fois ? (création, signature, traitement... ?)
- si c'est un bordereau avec conditionnement et qu'on attend un transporteur, quel est-il ?

Cet objet `StateSummary` vise à simplifier ces questions. Il renverra toujours la valeur pour un instant T donné.

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
emitter<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Prochaine entreprise à émettre le déchet (entreprise en case 1 ou 13)</p>
</td>
</tr>
<tr>
<td>
lastActionOn<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de la dernière action sur le bordereau</p>
</td>
</tr>
<tr>
<td>
onuCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code ONU le plus à jour</p>
</td>
</tr>
<tr>
<td>
packagingInfos<br />
<a href="/api/objects#packaginginfo"><code>[PackagingInfo!]!</code></a>
</td>
<td>
<p>Packaging le plus à jour</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api/enums#packagings"><code>[Packagings!]!</code></a>
</td>
<td>
<blockquote>Deprecated: Utiliser packagingInfos</blockquote>

<p>DEPRECATED Packaging le plus à jour</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#float"><code>Float</code></a>
</td>
<td>
<p>Quantité la plus à jour</p>
</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Prochaine entreprise à recevoir le déchet (entreprise en case 2 ou 14)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Prochaine entreprise à transporter le déchet (entreprise en case 8 ou 18)</p>
</td>
</tr>
<tr>
<td>
transporterCustomInfo<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Information libre, destinée aux transporteurs</p>
</td>
</tr>
<tr>
<td>
transporterNumberPlate<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de plaque d&#39;immatriculation</p>
</td>
</tr>
</tbody>
</table>

## StatusLog

Changement de statut d'un bordereau

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
form<br />
<a href="/api/objects#statuslogform"><code>StatusLogForm</code></a>
</td>
<td>
<p>BSD concerné</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Identifiant du log</p>
</td>
</tr>
<tr>
<td>
loggedAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date à laquelle le changement de statut a été effectué</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#formstatus"><code>FormStatus</code></a>
</td>
<td>
<p>Statut du bordereau après le changement de statut</p>
</td>
</tr>
<tr>
<td>
updatedFields<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>
<p>Valeur des champs transmis lors du changement de statut (eg. receivedBY, processingOperationDescription)</p>
</td>
</tr>
<tr>
<td>
user<br />
<a href="/api/objects#statusloguser"><code>StatusLogUser</code></a>
</td>
<td>
<p>Utilisateur à l&#39;origine de la modification</p>
</td>
</tr>
</tbody>
</table>

## StatusLogForm

Information sur un BSD dans les logs de modifications de statuts

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Identifiant du BSD</p>
</td>
</tr>
<tr>
<td>
readableId<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<blockquote>Deprecated: Le readableId apparaît sur le CERFA mais l'id doit être utilisé comme identifiant.</blockquote>

<p>N° du bordereau</p>
</td>
</tr>
</tbody>
</table>

## StatusLogUser

Utilisateur ayant modifié le BSD

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
email<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Subscription



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
forms<br />
<a href="/api/objects#formsubscription"><code>FormSubscription</code></a>
</td>
<td>
<p>DEPRECATED - Privilégier l&#39;utilisation d&#39;un polling régulier sur la query <code>formsLifeCycle</code></p>
<p>Permet de s&#39;abonner aux changements de statuts d&#39;un BSD</p>

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
token<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Token permettant de s&#39;authentifier à l&#39;API</p>
</td>
</tr>
</tbody>
</table>

</td>
</tr>
</tbody>
</table>

## TemporaryStorageDetail

Données du BSD suite sur la partie entreposage provisoire ou reconditionnement, rattachées à un BSD existant

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
destination<br />
<a href="/api/objects#destination"><code>Destination</code></a>
</td>
<td>
<p>Installation de destination prévue (case 14) à remplir par le producteur ou
le site d&#39;entreposage provisoire</p>
</td>
</tr>
<tr>
<td>
signedAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de signature du BSD suite (case 19)</p>
</td>
</tr>
<tr>
<td>
signedBy<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom du signataire du BSD suite  (case 19)</p>
</td>
</tr>
<tr>
<td>
temporaryStorer<br />
<a href="/api/objects#temporarystorer"><code>TemporaryStorer</code></a>
</td>
<td>
<p>Établissement qui stocke temporairement le déchet (case 13)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/objects#transporter"><code>Transporter</code></a>
</td>
<td>
<p>Transporteur du déchet (case 18)</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api/objects#wastedetails"><code>WasteDetails</code></a>
</td>
<td>
<p>Détails du déchet (cases 15, 16 et 17)</p>
</td>
</tr>
</tbody>
</table>

## TemporaryStorer



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
quantityReceived<br />
<a href="/api/scalars#float"><code>Float</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantityType<br />
<a href="/api/enums#quantitytype"><code>QuantityType</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
receivedAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
receivedBy<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteAcceptationStatus<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteRefusalReason<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Trader

Négociant (case 7)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement négociant</p>
</td>
</tr>
<tr>
<td>
department<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Département</p>
</td>
</tr>
<tr>
<td>
receipt<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de récipissé</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Limite de validité</p>
</td>
</tr>
</tbody>
</table>

## TraderReceipt

Récépissé négociant

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
department<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Département ayant enregistré la déclaration</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
receiptNumber<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro de récépissé négociant</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Limite de validité du récépissé</p>
</td>
</tr>
</tbody>
</table>

## Transporter

Collecteur - transporteur (case 8)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement collecteur - transporteur</p>
</td>
</tr>
<tr>
<td>
customInfo<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Information libre, destinée aux transporteurs</p>
</td>
</tr>
<tr>
<td>
department<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Département</p>
</td>
</tr>
<tr>
<td>
isExemptedOfReceipt<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Exemption de récipissé</p>
</td>
</tr>
<tr>
<td>
numberPlate<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de plaque d&#39;immatriculation</p>
</td>
</tr>
<tr>
<td>
receipt<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de récipissé</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Limite de validité du récipissé</p>
</td>
</tr>
</tbody>
</table>

## TransporterReceipt

Récépissé transporteur

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
department<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Département ayant enregistré la déclaration</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
receiptNumber<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro de récépissé transporteur</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Limite de validité du récépissé</p>
</td>
</tr>
</tbody>
</table>

## TransportSegment



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

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
<tr>
<td>
mode<br />
<a href="/api/enums#transportmode"><code>TransportMode</code></a>
</td>
<td>
<p>Mode de transport</p>
</td>
</tr>
<tr>
<td>
previousTransporterCompanySiret<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Siret du transporteur précédent</p>
</td>
</tr>
<tr>
<td>
readyToTakeOver<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Prêt à être pris en charge</p>
</td>
</tr>
<tr>
<td>
segmentNumber<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>Numéro du segment</p>
</td>
</tr>
<tr>
<td>
takenOverAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de prise en charge</p>
</td>
</tr>
<tr>
<td>
takenOverBy<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Reponsable de la prise en charge</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/objects#transporter"><code>Transporter</code></a>
</td>
<td>
<p>Transporteur du segment</p>
</td>
</tr>
</tbody>
</table>

## User

Représente un utilisateur sur la plateforme Trackdéchets

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
companies<br />
<a href="/api/objects#companyprivate"><code>[CompanyPrivate!]!</code></a>
</td>
<td>
<p>Liste des établissements dont l&#39;utilisateur est membre</p>
</td>
</tr>
<tr>
<td>
email<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Email de l&#39;utiliateur</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Identifiant opaque</p>
</td>
</tr>
<tr>
<td>
isAdmin<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Qualité d&#39;administrateur. Rôle reservé aux agents de l&#39;administration</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;utilisateur</p>
</td>
</tr>
<tr>
<td>
phone<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de téléphone de l&#39;utilisateur</p>
</td>
</tr>
</tbody>
</table>

## VhuAgrement

Agrément VHU

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
agrementNumber<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro d&#39;agrément VHU</p>
</td>
</tr>
<tr>
<td>
department<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Département ayant enregistré la déclaration</p>
</td>
</tr>
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

## WasteDetails

Détails du déchet (case 3, 4, 5, 6)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
code<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Rubrique déchet au format |<em>|</em>| |<em>|</em>| |<em>|</em>| (*)</p>
</td>
</tr>
<tr>
<td>
consistence<br />
<a href="/api/enums#consistence"><code>Consistence</code></a>
</td>
<td>
<p>Consistance</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Dénomination usuelle</p>
</td>
</tr>
<tr>
<td>
numberOfPackages<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<blockquote>Deprecated: Utiliser `packagingInfos`</blockquote>

<p>Nombre de colis</p>
</td>
</tr>
<tr>
<td>
onuCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code ONU</p>
</td>
</tr>
<tr>
<td>
otherPackaging<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<blockquote>Deprecated: Utiliser `packagingInfos`</blockquote>

<p>Autre packaging (préciser)</p>
</td>
</tr>
<tr>
<td>
packagingInfos<br />
<a href="/api/objects#packaginginfo"><code>[PackagingInfo!]</code></a>
</td>
<td>
<p>Conditionnements</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api/enums#packagings"><code>[Packagings!]</code></a>
</td>
<td>
<blockquote>Deprecated: Utiliser `packagingInfos`</blockquote>

<p>Conditionnement</p>
</td>
</tr>
<tr>
<td>
pop<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Contient des Polluants Organiques Persistants (POP) oui / non</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#float"><code>Float</code></a>
</td>
<td>
<p>Quantité en tonnes</p>
</td>
</tr>
<tr>
<td>
quantityType<br />
<a href="/api/enums#quantitytype"><code>QuantityType</code></a>
</td>
<td>
<p>Réelle ou estimée</p>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
city<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
infos<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
postalCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

