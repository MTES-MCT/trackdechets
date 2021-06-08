---
id: inputObjects
title: Input objects
slug: inputObjects
---

## BsvhuCompanyWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
siret<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuDestinationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<a href="/api-reference/bsvhu/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Coordonnées de l&#39;entreprise qui recoit les déchets</p>
</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuoperationinput"><code>BsvhuOperationInput</code></a>
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
<a href="/api-reference/bsvhu/inputObjects#bsvhureceptioninput"><code>BsvhuReceptionInput</code></a>
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

## BsvhuDestinationWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhucompanywhere"><code>BsvhuCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuoperationwhere"><code>BsvhuOperationWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuEmissionWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
signature<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhusignaturewhere"><code>BsvhuSignatureWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuEmitterInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<a href="/api-reference/bsvhu/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Coordonnées de l&#39;entreprise émétrice</p>
</td>
</tr>
</tbody>
</table>

## BsvhuEmitterWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhucompanywhere"><code>BsvhuCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emission<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuemissionwhere"><code>BsvhuEmissionWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuIdentificationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
numbers<br />
<a href="/api-reference/bsvhu/scalars#string"><code>[String]</code></a>
</td>
<td>
<p>Numéros d&#39;identification</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsvhu/enums#bsvhuidentificationtype"><code>BsvhuIdentificationType</code></a>
</td>
<td>
<p>Type de numéros d&#39;indentification</p>
</td>
</tr>
</tbody>
</table>

## BsvhuInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
destination<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhudestinationinput"><code>BsvhuDestinationInput</code></a>
</td>
<td>
<p>Détails sur la destination</p>
</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuemitterinput"><code>BsvhuEmitterInput</code></a>
</td>
<td>
<p>Détails sur l&#39;émetteur</p>
</td>
</tr>
<tr>
<td>
identification<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuidentificationinput"><code>BsvhuIdentificationInput</code></a>
</td>
<td>
<p>Identification des VHUs</p>
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
<a href="/api-reference/bsvhu/inputObjects#bsvhuquantityinput"><code>BsvhuQuantityInput</code></a>
</td>
<td>
<p>Quantité de VHUs</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhutransporterinput"><code>BsvhuTransporterInput</code></a>
</td>
<td>
<p>Détails sur le transporteur</p>
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

## BsvhuNextDestinationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsvhu/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuOperationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<a href="/api-reference/bsvhu/inputObjects#bsvhunextdestinationinput"><code>BsvhuNextDestinationInput</code></a>
</td>
<td>
<p>Broyeur de destination, à remplir uniquement lorsque la destination est lui même un centre VHU</p>
</td>
</tr>
</tbody>
</table>

## BsvhuOperationWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
signature<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhusignaturewhere"><code>BsvhuSignatureWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuQuantityInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
number<br />
<a href="/api-reference/bsvhu/scalars#int"><code>Int</code></a>
</td>
<td>
<p>Quantité en nombre (nombre de lots ou nombre de numéros d&#39;ordre)</p>
</td>
</tr>
<tr>
<td>
tons<br />
<a href="/api-reference/bsvhu/scalars#float"><code>Float</code></a>
</td>
<td>
<p>Quantité en tonnes</p>
</td>
</tr>
</tbody>
</table>

## BsvhuRecepisseInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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

## BsvhuReceptionInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
acceptationStatus<br />
<a href="/api-reference/bsvhu/enums#wasteacceptationstatusinput"><code>WasteAcceptationStatusInput</code></a>
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
<a href="/api-reference/bsvhu/inputObjects#bsvhuidentificationinput"><code>BsvhuIdentificationInput</code></a>
</td>
<td>
<p>Identification éventuelle des VHU à la reception (numéro de lots ou d&#39;ordre)</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuquantityinput"><code>BsvhuQuantityInput</code></a>
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

## BsvhuSignatureInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
author<br />
<a href="/api-reference/bsvhu/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom et prénom du signataire</p>
</td>
</tr>
<tr>
<td>
date<br />
<a href="/api-reference/bsvhu/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de la signature</p>
</td>
</tr>
<tr>
<td>
securityCode<br />
<a href="/api-reference/bsvhu/scalars#int"><code>Int</code></a>
</td>
<td>
<p>Code de sécurité de l&#39;entreprise pour laquelle on signe. Permet de signer en tant que. Optionnel</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsvhu/enums#signaturetypeinput"><code>SignatureTypeInput!</code></a>
</td>
<td>
<p>Type de signature apposé</p>
</td>
</tr>
</tbody>
</table>

## BsvhuSignatureWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
date<br />
<a href="/api-reference/bsvhu/inputObjects#datefilter"><code>DateFilter!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuTransporterInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsvhu/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Coordonnées de l&#39;entreprise de transport</p>
</td>
</tr>
<tr>
<td>
recepisse<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhurecepisseinput"><code>BsvhuRecepisseInput</code></a>
</td>
<td>
<p>Récépissé transporteur</p>
</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhutransportinput"><code>BsvhuTransportInput</code></a>
</td>
<td>
<p>Informations liés au transport</p>
</td>
</tr>
</tbody>
</table>

## BsvhuTransporterWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhucompanywhere"><code>BsvhuCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhutransportwhere"><code>BsvhuTransportWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuTransportInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
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

## BsvhuTransportWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
signature<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhusignaturewhere"><code>BsvhuSignatureWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
_and<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuwhere"><code>[BsvhuWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_not<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuwhere"><code>[BsvhuWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_or<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuwhere"><code>[BsvhuWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
createdAt<br />
<a href="/api-reference/bsvhu/inputObjects#datefilter"><code>DateFilter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
destination<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhudestinationwhere"><code>BsvhuDestinationWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuemitterwhere"><code>BsvhuEmitterWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isDraft<br />
<a href="/api-reference/bsvhu/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>(Optionnel) Permet de récupérer uniquement les bordereaux en brouillon</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api-reference/bsvhu/enums#bsvhustatus"><code>BsvhuStatus</code></a>
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
<a href="/api-reference/bsvhu/inputObjects#bsvhutransporterwhere"><code>BsvhuTransporterWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api-reference/bsvhu/inputObjects#datefilter"><code>DateFilter</code></a>
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

## DateFilter



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
_eq<br />
<a href="/api-reference/bsvhu/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_gt<br />
<a href="/api-reference/bsvhu/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_gte<br />
<a href="/api-reference/bsvhu/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_lt<br />
<a href="/api-reference/bsvhu/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_lte<br />
<a href="/api-reference/bsvhu/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

