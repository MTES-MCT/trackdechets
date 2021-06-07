---
id: inputObjects
title: Input objects
slug: inputObjects
---

## BsffDestinationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
cap<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
company<br />
<a href="/api-reference/bsff/inputObjects#companyinput"><code>CompanyInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api-reference/bsff/inputObjects#bsffdestinationoperationinput"><code>BsffDestinationOperationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
plannedOperation<br />
<a href="/api-reference/bsff/inputObjects#bsffdestinationoperationinput"><code>BsffDestinationOperationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api-reference/bsff/inputObjects#bsffdestinationreceptioninput"><code>BsffDestinationReceptionInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffDestinationOperationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
code<br />
<a href="/api-reference/bsff/enums#bsffoperationcode"><code>BsffOperationCode!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
qualification<br />
<a href="/api-reference/bsff/enums#bsffoperationqualification"><code>BsffOperationQualification!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffDestinationReceptionInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
date<br />
<a href="/api-reference/bsff/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
kilos<br />
<a href="/api-reference/bsff/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
refusal<br />
<a href="/api-reference/bsff/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffEmitterInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsff/inputObjects#companyinput"><code>CompanyInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffFicheInterventionInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
kilos<br />
<a href="/api-reference/bsff/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
owner<br />
<a href="/api-reference/bsff/inputObjects#bsffownerinput"><code>BsffOwnerInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
postalCode<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
destination<br />
<a href="/api-reference/bsff/inputObjects#bsffdestinationinput"><code>BsffDestinationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsff/inputObjects#bsffemitterinput"><code>BsffEmitterInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api-reference/bsff/inputObjects#bsffpackaginginput"><code>[BsffPackagingInput!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsff/inputObjects#bsffquantityinput"><code>BsffQuantityInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsff/inputObjects#bsfftransporterinput"><code>BsffTransporterInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
waste<br />
<a href="/api-reference/bsff/inputObjects#bsffwasteinput"><code>BsffWasteInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffOwnerInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsff/inputObjects#companyinput"><code>CompanyInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffPackagingInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
litres<br />
<a href="/api-reference/bsff/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
numero<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsff/enums#bsffpackagingtype"><code>BsffPackagingType!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffQuantityInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
isEstimate<br />
<a href="/api-reference/bsff/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
kilos<br />
<a href="/api-reference/bsff/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffTransporterInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsff/inputObjects#companyinput"><code>CompanyInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
recepisse<br />
<a href="/api-reference/bsff/inputObjects#bsfftransporterrecepisseinput"><code>BsffTransporterRecepisseInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api-reference/bsff/inputObjects#bsfftransportertransportinput"><code>BsffTransporterTransportInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffTransporterRecepisseInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
department<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
number<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api-reference/bsff/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffTransporterTransportInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
mode<br />
<a href="/api-reference/bsff/enums#transportmode"><code>TransportMode!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffWasteInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
adr<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
code<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
description<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
destination<br />
<a href="/api-reference/bsff/inputObjects#bsffwheredestination"><code>BsffWhereDestination</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsff/inputObjects#bsffwhereemitter"><code>BsffWhereEmitter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsff/inputObjects#bsffwheretransporter"><code>BsffWhereTransporter</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffWhereCompany



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
siret<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffWhereDestination



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsff/inputObjects#bsffwherecompany"><code>BsffWhereCompany</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffWhereEmitter



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsff/inputObjects#bsffwherecompany"><code>BsffWhereCompany</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffWhereTransporter



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsff/inputObjects#bsffwherecompany"><code>BsffWhereCompany</code></a>
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

## DateFilter



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
_eq<br />
<a href="/api-reference/bsff/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_gt<br />
<a href="/api-reference/bsff/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_gte<br />
<a href="/api-reference/bsff/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_lt<br />
<a href="/api-reference/bsff/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_lte<br />
<a href="/api-reference/bsff/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## SignatureInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
author<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
date<br />
<a href="/api-reference/bsff/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

