---
id: inputObjects
title: Input objects
slug: inputObjects
---

## BsdasriCompanyWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
siret<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriCreateInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
emission<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriemissioninput"><code>BsdasriEmissionInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriemitterinput"><code>BsdasriEmitterInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrioperationinput"><code>BsdasriOperationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrireceptioninput"><code>BsdasriReceptionInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrirecipientinput"><code>BsdasriRecipientInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
regroupedBsdasris<br />
<a href="/api-reference/bsdasri/inputObjects#regroupedbsdasriinput"><code>[RegroupedBsdasriInput]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasritransportinput"><code>BsdasriTransportInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasritransporterinput"><code>BsdasriTransporterInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriEmissionInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
wasteCode<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriwastedetailinput"><code>BsdasriWasteDetailInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriEmitterInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsdasri/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
customInfo<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>Champ libre émetteur</p>
</td>
</tr>
<tr>
<td>
onBehalfOfEcoorganisme<br />
<a href="/api-reference/bsdasri/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsdasri/enums#bsdasriemittertype"><code>BsdasriEmitterType</code></a>
</td>
<td>
<p>Établissement émetteur</p>
</td>
</tr>
<tr>
<td>
workSite<br />
<a href="/api-reference/bsdasri/inputObjects#worksiteinput"><code>WorkSiteInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriEmitterWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasricompanywhere"><code>BsdasriCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrisignaturewhere"><code>BsdasriSignatureWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
emission<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriemissioninput"><code>BsdasriEmissionInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriemitterinput"><code>BsdasriEmitterInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrioperationinput"><code>BsdasriOperationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrireceptioninput"><code>BsdasriReceptionInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrirecipientinput"><code>BsdasriRecipientInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasritransportinput"><code>BsdasriTransportInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasritransporterinput"><code>BsdasriTransporterInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriOperationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
</tbody>
</table>

## BsdasriPackagingInfoInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<p>Nombre de colis associés à ce conditionnement</p>
</td>
</tr>
</tbody>
</table>

## BsdasriReceptionInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
wasteAcceptation<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriwasteacceptationinput"><code>BsdasriWasteAcceptationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriwastedetailinput"><code>BsdasriWasteDetailInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriRecipientInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsdasri/inputObjects#companyinput"><code>CompanyInput</code></a>
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
<p>Champ libre transporteur</p>
</td>
</tr>
</tbody>
</table>

## BsdasriRecipientWasteDetailInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
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
volume<br />
<a href="/api-reference/bsdasri/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriRecipientWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasricompanywhere"><code>BsdasriCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrisignaturewhere"><code>BsdasriSignatureWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriSignatureInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
author<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsdasri/enums#bsdasrisignaturetype"><code>BsdasriSignatureType!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriSignatureWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
date<br />
<a href="/api-reference/bsdasri/inputObjects#datefilter"><code>DateFilter!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriSignatureWithSecretCodeInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
author<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
securityCode<br />
<a href="/api-reference/bsdasri/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriTransporterInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsdasri/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Établissement collecteur - transporteur</p>
</td>
</tr>
<tr>
<td>
customInfo<br />
<a href="/api-reference/bsdasri/scalars#string"><code>String</code></a>
</td>
<td>
<p>Champ libre transporteur</p>
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

## BsdasriTransporterWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasricompanywhere"><code>BsdasriCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrisignaturewhere"><code>BsdasriSignatureWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriTransportInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
takenOverAt<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteAcceptation<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriwasteacceptationinput"><code>BsdasriWasteAcceptationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriwastedetailinput"><code>BsdasriWasteDetailInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriUpdateInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
emission<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriemissioninput"><code>BsdasriEmissionInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriemitterinput"><code>BsdasriEmitterInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrioperationinput"><code>BsdasriOperationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrireceptioninput"><code>BsdasriReceptionInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrirecipientinput"><code>BsdasriRecipientInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
regroupedBsdasris<br />
<a href="/api-reference/bsdasri/inputObjects#regroupedbsdasriinput"><code>[RegroupedBsdasriInput]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasritransportinput"><code>BsdasriTransportInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasritransporterinput"><code>BsdasriTransporterInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriWasteAcceptationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<a href="/api-reference/bsdasri/enums#wasteacceptationstatusinput"><code>WasteAcceptationStatusInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriWasteDetailInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<a href="/api-reference/bsdasri/inputObjects#bsdasripackaginginfoinput"><code>[BsdasriPackagingInfoInput!]</code></a>
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
</tbody>
</table>

## BsdasriWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
_and<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriwhere"><code>[BsdasriWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_not<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriwhere"><code>[BsdasriWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_or<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriwhere"><code>[BsdasriWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
createdAt<br />
<a href="/api-reference/bsdasri/inputObjects#datefilter"><code>DateFilter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriemitterwhere"><code>BsdasriEmitterWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
groupable<br />
<a href="/api-reference/bsdasri/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>(Optionnel) Filtre sur l&#39;état de regroupement des bordereaux
Si aucun filtre n&#39;est passé, les bordereaux seront retournés sans filtrage supplémentaire
Si groupable: true, les bordereaux retournés ne sont pas déjà regroupés et ne regroupent pas d&#39;autres bordereaux
Si groupable: false, les bordereaux retournés ne sont déjà regroupés ou ne regroupent d&#39;autres bordereaux</p>
</td>
</tr>
<tr>
<td>
isDraft<br />
<a href="/api-reference/bsdasri/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>(Optionnel) Permet de récupérer uniquement les bordereaux en brouillon</p>
</td>
</tr>
<tr>
<td>
processingOperation<br />
<a href="/api-reference/bsdasri/enums#processingoperationtypes"><code>[processingOperationTypes!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrirecipientwhere"><code>BsdasriRecipientWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api-reference/bsdasri/enums#bsdasristatus"><code>BsdasriStatus</code></a>
</td>
<td>
<p>(Optionnel) Filtre sur le statut des bordereaux
Si aucun filtre n&#39;est passé, les bordereaux seront retournés quel que soit leur statut
Défaut à vide.</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasritransporterwhere"><code>BsdasriTransporterWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api-reference/bsdasri/inputObjects#datefilter"><code>DateFilter</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## CompanyInput

Payload d'un établissement

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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

## DateFilter



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
_eq<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_gt<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_gte<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_lt<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_lte<br />
<a href="/api-reference/bsdasri/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## RegroupedBsdasriInput

Payload de regroupement

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsdasri/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Identifiant unique du bordereau</p>
</td>
</tr>
</tbody>
</table>

## WorkSiteInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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

