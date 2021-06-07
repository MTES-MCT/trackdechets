---
id: inputObjects
title: Input objects
slug: inputObjects
---

## BsdaCompanyWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
siret<br />
<a href="/api-reference/bsda/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaDestinationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<a href="/api-reference/bsda/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Établissement de destination</p>
</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api-reference/bsda/inputObjects#bsdaoperationinput"><code>BsdaOperationInput</code></a>
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
<a href="/api-reference/bsda/inputObjects#bsdareceptioninput"><code>BsdaReceptionInput</code></a>
</td>
<td>
<p>Expédition reçue à l&#39;installation de destination</p>
</td>
</tr>
</tbody>
</table>

## BsdaDestinationWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsda/inputObjects#bsdacompanywhere"><code>BsdaCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api-reference/bsda/inputObjects#bsdaoperationwhere"><code>BsdaOperationWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaEmissionWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
signature<br />
<a href="/api-reference/bsda/inputObjects#bsdasignaturewhere"><code>BsdaSignatureWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaEmitterInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsda/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Établissement MOA/détenteur. Partiellement rempli si l&#39;émetteur est en fait un particulier</p>
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
<a href="/api-reference/bsda/inputObjects#bsdaworksiteinput"><code>BsdaWorksiteInput</code></a>
</td>
<td>
<p>Informations chantier (si différente de l&#39;adresse de l&#39;entreprise)</p>
</td>
</tr>
</tbody>
</table>

## BsdaEmitterWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsda/inputObjects#bsdacompanywhere"><code>BsdaCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emission<br />
<a href="/api-reference/bsda/inputObjects#bsdaemissionwhere"><code>BsdaEmissionWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
destination<br />
<a href="/api-reference/bsda/inputObjects#bsdadestinationinput"><code>BsdaDestinationInput</code></a>
</td>
<td>
<p>Installation de destination</p>
</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsda/inputObjects#bsdaemitterinput"><code>BsdaEmitterInput</code></a>
</td>
<td>
<p>Maitre d&#39;ouvrage ou détenteur du déchet</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api-reference/bsda/inputObjects#bsdapackaginginput"><code>[BsdaPackagingInput!]</code></a>
</td>
<td>
<p>Conditionnement</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsda/inputObjects#bsdaquantityinput"><code>BsdaQuantityInput</code></a>
</td>
<td>
<p>Quantité</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsda/inputObjects#bsdatransporterinput"><code>BsdaTransporterInput</code></a>
</td>
<td>
<p> Entreprise de transport</p>
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
waste<br />
<a href="/api-reference/bsda/inputObjects#bsdawasteinput"><code>BsdaWasteInput</code></a>
</td>
<td>
<p>Dénomination du déchet</p>
</td>
</tr>
<tr>
<td>
worker<br />
<a href="/api-reference/bsda/inputObjects#bsdaworkerinput"><code>BsdaWorkerInput</code></a>
</td>
<td>
<p>Entreprise de travaux</p>
</td>
</tr>
</tbody>
</table>

## BsdaOperationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
</tbody>
</table>

## BsdaOperationWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
signature<br />
<a href="/api-reference/bsda/inputObjects#bsdasignaturewhere"><code>BsdaSignatureWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaPackagingInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<a href="/api-reference/bsda/enums#bsdapackagingtype"><code>BsdaPackagingType</code></a>
</td>
<td>
<p>Type de conditionnement</p>
</td>
</tr>
</tbody>
</table>

## BsdaQuantityInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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

## BsdaRecepisseInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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

## BsdaReceptionInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<a href="/api-reference/bsda/inputObjects#bsdaquantityinput"><code>BsdaQuantityInput</code></a>
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
</tbody>
</table>

## BsdaSignatureInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
author<br />
<a href="/api-reference/bsda/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom et prénom du signataire</p>
</td>
</tr>
<tr>
<td>
date<br />
<a href="/api-reference/bsda/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de la signature</p>
</td>
</tr>
<tr>
<td>
securityCode<br />
<a href="/api-reference/bsda/scalars#int"><code>Int</code></a>
</td>
<td>
<p>Code de sécurité de l&#39;entreprise pour laquelle on signe. Permet de signer en tant que. Optionnel</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsda/enums#bsdasignaturetype"><code>BsdaSignatureType!</code></a>
</td>
<td>
<p>Type de signature apposé</p>
</td>
</tr>
</tbody>
</table>

## BsdaSignatureWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
date<br />
<a href="/api-reference/bsda/inputObjects#datefilter"><code>DateFilter!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaTransporterInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsda/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Entreprise de transport</p>
</td>
</tr>
<tr>
<td>
recepisse<br />
<a href="/api-reference/bsda/inputObjects#bsdarecepisseinput"><code>BsdaRecepisseInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaTransporterWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsda/inputObjects#bsdacompanywhere"><code>BsdaCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api-reference/bsda/inputObjects#bsdatransportwhere"><code>BsdaTransportWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaTransportWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
signature<br />
<a href="/api-reference/bsda/inputObjects#bsdasignaturewhere"><code>BsdaSignatureWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaWasteInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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

## BsdaWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
_and<br />
<a href="/api-reference/bsda/inputObjects#bsdawhere"><code>[BsdaWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_not<br />
<a href="/api-reference/bsda/inputObjects#bsdawhere"><code>[BsdaWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_or<br />
<a href="/api-reference/bsda/inputObjects#bsdawhere"><code>[BsdaWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
createdAt<br />
<a href="/api-reference/bsda/inputObjects#datefilter"><code>DateFilter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
destination<br />
<a href="/api-reference/bsda/inputObjects#bsdadestinationwhere"><code>BsdaDestinationWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsda/inputObjects#bsdaemitterwhere"><code>BsdaEmitterWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isDraft<br />
<a href="/api-reference/bsda/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api-reference/bsda/enums#bsdastatus"><code>BsdaStatus</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsda/inputObjects#bsdatransporterwhere"><code>BsdaTransporterWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api-reference/bsda/inputObjects#datefilter"><code>DateFilter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
worker<br />
<a href="/api-reference/bsda/inputObjects#bsdaworkerwhere"><code>BsdaWorkerWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaWorkerInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsda/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Entreprise de travaux</p>
</td>
</tr>
<tr>
<td>
work<br />
<a href="/api-reference/bsda/inputObjects#bsdaworkinput"><code>BsdaWorkInput</code></a>
</td>
<td>
<p>Déclaration générale</p>
</td>
</tr>
</tbody>
</table>

## BsdaWorkerWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsda/inputObjects#bsdacompanywhere"><code>BsdaCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
work<br />
<a href="/api-reference/bsda/inputObjects#bsdaworkwhere"><code>BsdaWorkWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaWorkInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
</tbody>
</table>

## BsdaWorksiteInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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

## BsdaWorkWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
signature<br />
<a href="/api-reference/bsda/inputObjects#bsdasignaturewhere"><code>BsdaSignatureWhere</code></a>
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

## DateFilter



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
_eq<br />
<a href="/api-reference/bsda/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_gt<br />
<a href="/api-reference/bsda/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_gte<br />
<a href="/api-reference/bsda/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_lt<br />
<a href="/api-reference/bsda/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_lte<br />
<a href="/api-reference/bsda/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

