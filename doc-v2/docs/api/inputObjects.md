---
id: inputObjects
title: Input objects
slug: inputObjects
---

## AcceptedFormInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
quantityReceived<br />
<a href="/api/scalars#float"><code>Float!</code></a>
</td>
<td>
<p>Quantité réelle présentée (case 10)</p>
</td>
</tr>
<tr>
<td>
signedAt<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été accepté ou refusé (case 10)</p>
</td>
</tr>
<tr>
<td>
signedBy<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de la personne en charge de l&#39;acceptation&#39; du déchet (case 10)</p>
</td>
</tr>
<tr>
<td>
wasteAcceptationStatus<br />
<a href="/api/enums#wasteacceptationstatusinput"><code>WasteAcceptationStatusInput!</code></a>
</td>
<td>
<p>Statut d&#39;acceptation du déchet (case 10)</p>
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

## AppendixFormInput

Payload de création d'une annexe 2

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Identifiant unique du bordereau</p>
</td>
</tr>
<tr>
<td>
readableId<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>N° de bordereau</p>
<p>Déprécié : L&#39;id du bordereau doit être utilisé comme identifiant (paramètre id).
Le readableId permet de le récupérer via la query form.</p>
</td>
</tr>
</tbody>
</table>

## BrokerInput

Payload lié au courtier

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
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

## BsdaCompanyWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
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

## BsdaDestinationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Établissement de destination</p>
</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api/inputObjects#bsdaoperationinput"><code>BsdaOperationInput</code></a>
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
<a href="/api/inputObjects#bsdareceptioninput"><code>BsdaReceptionInput</code></a>
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
<a href="/api/inputObjects#bsdacompanywhere"><code>BsdaCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api/inputObjects#bsdaoperationwhere"><code>BsdaOperationWhere</code></a>
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
<a href="/api/inputObjects#bsdasignaturewhere"><code>BsdaSignatureWhere</code></a>
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
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Établissement MOA/détenteur. Partiellement rempli si l&#39;émetteur est en fait un particulier</p>
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
<a href="/api/inputObjects#bsdaworksiteinput"><code>BsdaWorksiteInput</code></a>
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
<a href="/api/inputObjects#bsdacompanywhere"><code>BsdaCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emission<br />
<a href="/api/inputObjects#bsdaemissionwhere"><code>BsdaEmissionWhere</code></a>
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
<a href="/api/inputObjects#bsdadestinationinput"><code>BsdaDestinationInput</code></a>
</td>
<td>
<p>Installation de destination</p>
</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#bsdaemitterinput"><code>BsdaEmitterInput</code></a>
</td>
<td>
<p>Maitre d&#39;ouvrage ou détenteur du déchet</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api/inputObjects#bsdapackaginginput"><code>[BsdaPackagingInput!]</code></a>
</td>
<td>
<p>Conditionnement</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/inputObjects#bsdaquantityinput"><code>BsdaQuantityInput</code></a>
</td>
<td>
<p>Quantité</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#bsdatransporterinput"><code>BsdaTransporterInput</code></a>
</td>
<td>
<p> Entreprise de transport</p>
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
waste<br />
<a href="/api/inputObjects#bsdawasteinput"><code>BsdaWasteInput</code></a>
</td>
<td>
<p>Dénomination du déchet</p>
</td>
</tr>
<tr>
<td>
worker<br />
<a href="/api/inputObjects#bsdaworkerinput"><code>BsdaWorkerInput</code></a>
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
<a href="/api/inputObjects#bsdasignaturewhere"><code>BsdaSignatureWhere</code></a>
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
<a href="/api/enums#bsdapackagingtype"><code>BsdaPackagingType</code></a>
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

## BsdaRecepisseInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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

## BsdaReceptionInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<a href="/api/inputObjects#bsdaquantityinput"><code>BsdaQuantityInput</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom et prénom du signataire</p>
</td>
</tr>
<tr>
<td>
date<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de la signature</p>
</td>
</tr>
<tr>
<td>
securityCode<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>Code de sécurité de l&#39;entreprise pour laquelle on signe. Permet de signer en tant que. Optionnel</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#bsdasignaturetype"><code>BsdaSignatureType!</code></a>
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
<a href="/api/inputObjects#datefilter"><code>DateFilter!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdasriCompanyWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
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

## BsdasriCreateInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
emission<br />
<a href="/api/inputObjects#bsdasriemissioninput"><code>BsdasriEmissionInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#bsdasriemitterinput"><code>BsdasriEmitterInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api/inputObjects#bsdasrioperationinput"><code>BsdasriOperationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api/inputObjects#bsdasrireceptioninput"><code>BsdasriReceptionInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api/inputObjects#bsdasrirecipientinput"><code>BsdasriRecipientInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
regroupedBsdasris<br />
<a href="/api/inputObjects#regroupedbsdasriinput"><code>[RegroupedBsdasriInput]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api/inputObjects#bsdasritransportinput"><code>BsdasriTransportInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#bsdasritransporterinput"><code>BsdasriTransporterInput</code></a>
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
<a href="/api/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api/inputObjects#bsdasriwastedetailinput"><code>BsdasriWasteDetailInput</code></a>
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
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
customInfo<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Champ libre émetteur</p>
</td>
</tr>
<tr>
<td>
onBehalfOfEcoorganisme<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#bsdasriemittertype"><code>BsdasriEmitterType</code></a>
</td>
<td>
<p>Établissement émetteur</p>
</td>
</tr>
<tr>
<td>
workSite<br />
<a href="/api/inputObjects#worksiteinput"><code>WorkSiteInput</code></a>
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
<a href="/api/inputObjects#bsdasricompanywhere"><code>BsdasriCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/inputObjects#bsdasrisignaturewhere"><code>BsdasriSignatureWhere</code></a>
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
<a href="/api/inputObjects#bsdasriemissioninput"><code>BsdasriEmissionInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#bsdasriemitterinput"><code>BsdasriEmitterInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api/inputObjects#bsdasrioperationinput"><code>BsdasriOperationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api/inputObjects#bsdasrireceptioninput"><code>BsdasriReceptionInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api/inputObjects#bsdasrirecipientinput"><code>BsdasriRecipientInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api/inputObjects#bsdasritransportinput"><code>BsdasriTransportInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#bsdasritransporterinput"><code>BsdasriTransporterInput</code></a>
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
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteAcceptation<br />
<a href="/api/inputObjects#bsdasriwasteacceptationinput"><code>BsdasriWasteAcceptationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api/inputObjects#bsdasriwastedetailinput"><code>BsdasriWasteDetailInput</code></a>
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
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
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
<a href="/api/scalars#int"><code>Int</code></a>
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

## BsdasriRecipientWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/inputObjects#bsdasricompanywhere"><code>BsdasriCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/inputObjects#bsdasrisignaturewhere"><code>BsdasriSignatureWhere</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#bsdasrisignaturetype"><code>BsdasriSignatureType!</code></a>
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
<a href="/api/inputObjects#datefilter"><code>DateFilter!</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
securityCode<br />
<a href="/api/scalars#int"><code>Int</code></a>
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
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
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
<p>Champ libre transporteur</p>
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

## BsdasriTransporterWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/inputObjects#bsdasricompanywhere"><code>BsdasriCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/inputObjects#bsdasrisignaturewhere"><code>BsdasriSignatureWhere</code></a>
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
<a href="/api/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api/inputObjects#bsdasriwasteacceptationinput"><code>BsdasriWasteAcceptationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api/inputObjects#bsdasriwastedetailinput"><code>BsdasriWasteDetailInput</code></a>
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
<a href="/api/inputObjects#bsdasriemissioninput"><code>BsdasriEmissionInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#bsdasriemitterinput"><code>BsdasriEmitterInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api/inputObjects#bsdasrioperationinput"><code>BsdasriOperationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api/inputObjects#bsdasrireceptioninput"><code>BsdasriReceptionInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api/inputObjects#bsdasrirecipientinput"><code>BsdasriRecipientInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
regroupedBsdasris<br />
<a href="/api/inputObjects#regroupedbsdasriinput"><code>[RegroupedBsdasriInput]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api/inputObjects#bsdasritransportinput"><code>BsdasriTransportInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#bsdasritransporterinput"><code>BsdasriTransporterInput</code></a>
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
<a href="/api/enums#wasteacceptationstatusinput"><code>WasteAcceptationStatusInput</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
packagingInfos<br />
<a href="/api/inputObjects#bsdasripackaginginfoinput"><code>[BsdasriPackagingInfoInput!]</code></a>
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
<a href="/api/inputObjects#bsdasriwhere"><code>[BsdasriWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_not<br />
<a href="/api/inputObjects#bsdasriwhere"><code>[BsdasriWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_or<br />
<a href="/api/inputObjects#bsdasriwhere"><code>[BsdasriWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
createdAt<br />
<a href="/api/inputObjects#datefilter"><code>DateFilter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#bsdasriemitterwhere"><code>BsdasriEmitterWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
groupable<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
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
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>(Optionnel) Permet de récupérer uniquement les bordereaux en brouillon</p>
</td>
</tr>
<tr>
<td>
processingOperation<br />
<a href="/api/enums#processingoperationtypes"><code>[processingOperationTypes!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api/inputObjects#bsdasrirecipientwhere"><code>BsdasriRecipientWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#bsdasristatus"><code>BsdasriStatus</code></a>
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
<a href="/api/inputObjects#bsdasritransporterwhere"><code>BsdasriTransporterWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api/inputObjects#datefilter"><code>DateFilter</code></a>
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
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Entreprise de transport</p>
</td>
</tr>
<tr>
<td>
recepisse<br />
<a href="/api/inputObjects#bsdarecepisseinput"><code>BsdaRecepisseInput</code></a>
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
<a href="/api/inputObjects#bsdacompanywhere"><code>BsdaCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api/inputObjects#bsdatransportwhere"><code>BsdaTransportWhere</code></a>
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
<a href="/api/inputObjects#bsdasignaturewhere"><code>BsdaSignatureWhere</code></a>
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

## BsdaWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
_and<br />
<a href="/api/inputObjects#bsdawhere"><code>[BsdaWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_not<br />
<a href="/api/inputObjects#bsdawhere"><code>[BsdaWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_or<br />
<a href="/api/inputObjects#bsdawhere"><code>[BsdaWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
createdAt<br />
<a href="/api/inputObjects#datefilter"><code>DateFilter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
destination<br />
<a href="/api/inputObjects#bsdadestinationwhere"><code>BsdaDestinationWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#bsdaemitterwhere"><code>BsdaEmitterWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isDraft<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#bsdastatus"><code>BsdaStatus</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#bsdatransporterwhere"><code>BsdaTransporterWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api/inputObjects#datefilter"><code>DateFilter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
worker<br />
<a href="/api/inputObjects#bsdaworkerwhere"><code>BsdaWorkerWhere</code></a>
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
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Entreprise de travaux</p>
</td>
</tr>
<tr>
<td>
work<br />
<a href="/api/inputObjects#bsdaworkinput"><code>BsdaWorkInput</code></a>
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
<a href="/api/inputObjects#bsdacompanywhere"><code>BsdaCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
work<br />
<a href="/api/inputObjects#bsdaworkwhere"><code>BsdaWorkWhere</code></a>
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
<a href="/api/scalars#boolean"><code>Boolean</code></a>
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

## BsdaWorkWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
signature<br />
<a href="/api/inputObjects#bsdasignaturewhere"><code>BsdaSignatureWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffDestinationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
cap<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
company<br />
<a href="/api/inputObjects#companyinput"><code>CompanyInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api/inputObjects#bsffdestinationoperationinput"><code>BsffDestinationOperationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
plannedOperation<br />
<a href="/api/inputObjects#bsffdestinationoperationinput"><code>BsffDestinationOperationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
reception<br />
<a href="/api/inputObjects#bsffdestinationreceptioninput"><code>BsffDestinationReceptionInput</code></a>
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
<a href="/api/enums#bsffoperationcode"><code>BsffOperationCode!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
qualification<br />
<a href="/api/enums#bsffoperationqualification"><code>BsffOperationQualification!</code></a>
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
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
kilos<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
refusal<br />
<a href="/api/scalars#string"><code>String</code></a>
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
<a href="/api/inputObjects#companyinput"><code>CompanyInput!</code></a>
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
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
owner<br />
<a href="/api/inputObjects#bsffownerinput"><code>BsffOwnerInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
postalCode<br />
<a href="/api/scalars#string"><code>String!</code></a>
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
<a href="/api/inputObjects#bsffdestinationinput"><code>BsffDestinationInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#bsffemitterinput"><code>BsffEmitterInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api/inputObjects#bsffpackaginginput"><code>[BsffPackagingInput!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/inputObjects#bsffquantityinput"><code>BsffQuantityInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#bsfftransporterinput"><code>BsffTransporterInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
waste<br />
<a href="/api/inputObjects#bsffwasteinput"><code>BsffWasteInput</code></a>
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
<a href="/api/inputObjects#companyinput"><code>CompanyInput!</code></a>
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
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
numero<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#bsffpackagingtype"><code>BsffPackagingType!</code></a>
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
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
kilos<br />
<a href="/api/scalars#int"><code>Int!</code></a>
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
<a href="/api/inputObjects#companyinput"><code>CompanyInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
recepisse<br />
<a href="/api/inputObjects#bsfftransporterrecepisseinput"><code>BsffTransporterRecepisseInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api/inputObjects#bsfftransportertransportinput"><code>BsffTransporterTransportInput</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
number<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
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
<a href="/api/enums#transportmode"><code>TransportMode!</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
code<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
description<br />
<a href="/api/scalars#string"><code>String!</code></a>
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
<a href="/api/inputObjects#bsffwheredestination"><code>BsffWhereDestination</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#bsffwhereemitter"><code>BsffWhereEmitter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#bsffwheretransporter"><code>BsffWhereTransporter</code></a>
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
<a href="/api/scalars#string"><code>String!</code></a>
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
<a href="/api/inputObjects#bsffwherecompany"><code>BsffWhereCompany</code></a>
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
<a href="/api/inputObjects#bsffwherecompany"><code>BsffWhereCompany</code></a>
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
<a href="/api/inputObjects#bsffwherecompany"><code>BsffWhereCompany</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuCompanyWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
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

## BsvhuDestinationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Coordonnées de l&#39;entreprise qui recoit les déchets</p>
</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api/inputObjects#bsvhuoperationinput"><code>BsvhuOperationInput</code></a>
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
<a href="/api/inputObjects#bsvhureceptioninput"><code>BsvhuReceptionInput</code></a>
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

## BsvhuDestinationWhere



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/inputObjects#bsvhucompanywhere"><code>BsvhuCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
operation<br />
<a href="/api/inputObjects#bsvhuoperationwhere"><code>BsvhuOperationWhere</code></a>
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
<a href="/api/inputObjects#bsvhusignaturewhere"><code>BsvhuSignatureWhere</code></a>
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
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro d&#39;agrément émetteur</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
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
<a href="/api/inputObjects#bsvhucompanywhere"><code>BsvhuCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emission<br />
<a href="/api/inputObjects#bsvhuemissionwhere"><code>BsvhuEmissionWhere</code></a>
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
<a href="/api/scalars#string"><code>[String]</code></a>
</td>
<td>
<p>Numéros d&#39;identification</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#bsvhuidentificationtype"><code>BsvhuIdentificationType</code></a>
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
<a href="/api/inputObjects#bsvhudestinationinput"><code>BsvhuDestinationInput</code></a>
</td>
<td>
<p>Détails sur la destination</p>
</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#bsvhuemitterinput"><code>BsvhuEmitterInput</code></a>
</td>
<td>
<p>Détails sur l&#39;émetteur</p>
</td>
</tr>
<tr>
<td>
identification<br />
<a href="/api/inputObjects#bsvhuidentificationinput"><code>BsvhuIdentificationInput</code></a>
</td>
<td>
<p>Identification des VHUs</p>
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
<a href="/api/inputObjects#bsvhuquantityinput"><code>BsvhuQuantityInput</code></a>
</td>
<td>
<p>Quantité de VHUs</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#bsvhutransporterinput"><code>BsvhuTransporterInput</code></a>
</td>
<td>
<p>Détails sur le transporteur</p>
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

## BsvhuNextDestinationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
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
<a href="/api/inputObjects#bsvhunextdestinationinput"><code>BsvhuNextDestinationInput</code></a>
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
<a href="/api/inputObjects#bsvhusignaturewhere"><code>BsvhuSignatureWhere</code></a>
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
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>Quantité en nombre (nombre de lots ou nombre de numéros d&#39;ordre)</p>
</td>
</tr>
<tr>
<td>
tons<br />
<a href="/api/scalars#float"><code>Float</code></a>
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

## BsvhuReceptionInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
acceptationStatus<br />
<a href="/api/enums#wasteacceptationstatusinput"><code>WasteAcceptationStatusInput</code></a>
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
<a href="/api/inputObjects#bsvhuidentificationinput"><code>BsvhuIdentificationInput</code></a>
</td>
<td>
<p>Identification éventuelle des VHU à la reception (numéro de lots ou d&#39;ordre)</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/inputObjects#bsvhuquantityinput"><code>BsvhuQuantityInput</code></a>
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

## BsvhuSignatureInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
author<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom et prénom du signataire</p>
</td>
</tr>
<tr>
<td>
date<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de la signature</p>
</td>
</tr>
<tr>
<td>
securityCode<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>
<p>Code de sécurité de l&#39;entreprise pour laquelle on signe. Permet de signer en tant que. Optionnel</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#signaturetypeinput"><code>SignatureTypeInput!</code></a>
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
<a href="/api/inputObjects#datefilter"><code>DateFilter!</code></a>
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
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Coordonnées de l&#39;entreprise de transport</p>
</td>
</tr>
<tr>
<td>
recepisse<br />
<a href="/api/inputObjects#bsvhurecepisseinput"><code>BsvhuRecepisseInput</code></a>
</td>
<td>
<p>Récépissé transporteur</p>
</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api/inputObjects#bsvhutransportinput"><code>BsvhuTransportInput</code></a>
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
<a href="/api/inputObjects#bsvhucompanywhere"><code>BsvhuCompanyWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transport<br />
<a href="/api/inputObjects#bsvhutransportwhere"><code>BsvhuTransportWhere</code></a>
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
<a href="/api/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api/inputObjects#bsvhusignaturewhere"><code>BsvhuSignatureWhere</code></a>
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
<a href="/api/inputObjects#bsvhuwhere"><code>[BsvhuWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_not<br />
<a href="/api/inputObjects#bsvhuwhere"><code>[BsvhuWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_or<br />
<a href="/api/inputObjects#bsvhuwhere"><code>[BsvhuWhere!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
createdAt<br />
<a href="/api/inputObjects#datefilter"><code>DateFilter</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
destination<br />
<a href="/api/inputObjects#bsvhudestinationwhere"><code>BsvhuDestinationWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#bsvhuemitterwhere"><code>BsvhuEmitterWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isDraft<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>(Optionnel) Permet de récupérer uniquement les bordereaux en brouillon</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#bsvhustatus"><code>BsvhuStatus</code></a>
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
<a href="/api/inputObjects#bsvhutransporterwhere"><code>BsvhuTransporterWhere</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api/inputObjects#datefilter"><code>DateFilter</code></a>
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

## CreateFormInput

Payload de création d'un bordereau

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
appendix2Forms<br />
<a href="/api/inputObjects#appendixforminput"><code>[AppendixFormInput!]</code></a>
</td>
<td>
<p>Annexe 2</p>
</td>
</tr>
<tr>
<td>
broker<br />
<a href="/api/inputObjects#brokerinput"><code>BrokerInput</code></a>
</td>
<td>
<p>Courtier</p>
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
<a href="/api/inputObjects#ecoorganismeinput"><code>EcoOrganismeInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#emitterinput"><code>EmitterInput</code></a>
</td>
<td>
<p>Établissement émetteur/producteur du déchet (case 1)</p>
</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api/inputObjects#recipientinput"><code>RecipientInput</code></a>
</td>
<td>
<p>Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
L&#39;établissement renseigné doit être inscrit sur Trackdéchets en tant qu&#39;installation
de traitement ou de tri, transit, regroupement.</p>
</td>
</tr>
<tr>
<td>
temporaryStorageDetail<br />
<a href="/api/inputObjects#temporarystoragedetailinput"><code>TemporaryStorageDetailInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
trader<br />
<a href="/api/inputObjects#traderinput"><code>TraderInput</code></a>
</td>
<td>
<p>Négociant (case 7)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#transporterinput"><code>TransporterInput</code></a>
</td>
<td>
<p>Transporteur du déchet (case 8)</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api/inputObjects#wastedetailsinput"><code>WasteDetailsInput</code></a>
</td>
<td>
<p>Détails du déchet (case 3)</p>
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
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_gt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_gte<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_lt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_lte<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## DestinationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
cap<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de CAP prévu (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Installation de destination prévue (case 14)
L&#39;établissement renseigné doit être inscrit sur Trackdéchets en tant qu&#39;installation
de traitement ou de tri, transit, regroupement.</p>
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

## EcoOrganismeInput

Payload de liason d'un BSD à un eco-organisme

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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

## EmitterInput

Payload lié à un l'émetteur du BSD (case 1)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
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
<a href="/api/inputObjects#worksiteinput"><code>WorkSiteInput</code></a>
</td>
<td>
<p>Adresse du chantier</p>
</td>
</tr>
</tbody>
</table>

## FormInput

Payload de création d'un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
appendix2Forms<br />
<a href="/api/inputObjects#appendixforminput"><code>[AppendixFormInput!]</code></a>
</td>
<td>
<p>Annexe 2</p>
</td>
</tr>
<tr>
<td>
broker<br />
<a href="/api/inputObjects#brokerinput"><code>BrokerInput</code></a>
</td>
<td>
<p>Courtier</p>
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
<a href="/api/inputObjects#ecoorganismeinput"><code>EcoOrganismeInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#emitterinput"><code>EmitterInput</code></a>
</td>
<td>
<p>Établissement émetteur/producteur du déchet (case 1)</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Identifiant opaque</p>
</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api/inputObjects#recipientinput"><code>RecipientInput</code></a>
</td>
<td>
<p>Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
L&#39;établissement renseigné doit être inscrit sur Trackdéchets en tant qu&#39;installation
de traitement ou de tri, transit, regroupement.</p>
</td>
</tr>
<tr>
<td>
temporaryStorageDetail<br />
<a href="/api/inputObjects#temporarystoragedetailinput"><code>TemporaryStorageDetailInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
trader<br />
<a href="/api/inputObjects#traderinput"><code>TraderInput</code></a>
</td>
<td>
<p>Négociant (case 7)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#transporterinput"><code>TransporterInput</code></a>
</td>
<td>
<p>Transporteur du déchet (case 8)</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api/inputObjects#wastedetailsinput"><code>WasteDetailsInput</code></a>
</td>
<td>
<p>Détails du déchet (case 3)</p>
</td>
</tr>
</tbody>
</table>

## ImportPaperFormInput

Payload d'import d'un BSD papier

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
broker<br />
<a href="/api/inputObjects#brokerinput"><code>BrokerInput</code></a>
</td>
<td>
<p>Courtier</p>
</td>
</tr>
<tr>
<td>
customId<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Identifiant libre qui peut éventuellement servir à faire le lien dans Trackdéchets
entre le BSD papier et le BSD numérique dans le cas de l&#39;import d&#39;un BSD n&#39;ayant
pas été émis initialement dans Trackdéchets.</p>
</td>
</tr>
<tr>
<td>
ecoOrganisme<br />
<a href="/api/inputObjects#ecoorganismeinput"><code>EcoOrganismeInput</code></a>
</td>
<td>
<p>Éco-organisme (apparait en case 1)</p>
</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#emitterinput"><code>EmitterInput</code></a>
</td>
<td>
<p>Établissement émetteur/producteur du déchet (case 1)</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Numéro de BSD Trackdéchets (uniquement dans le cas d&#39;une mise à jour d&#39;un
bordereau émis initialement dans Trackdéchets)</p>
</td>
</tr>
<tr>
<td>
processedInfo<br />
<a href="/api/inputObjects#processedforminput"><code>ProcessedFormInput!</code></a>
</td>
<td>
<p>Informations liées au traitement du déchet (case 11)</p>
</td>
</tr>
<tr>
<td>
receivedInfo<br />
<a href="/api/inputObjects#receivedforminput"><code>ReceivedFormInput!</code></a>
</td>
<td>
<p>Informations liées à la réception du déchet (case 10)</p>
</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api/inputObjects#recipientinput"><code>RecipientInput</code></a>
</td>
<td>
<p>Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
L&#39;établissement renseigné doit être inscrit sur Trackdéchets en tant qu&#39;installation
de traitement ou de tri, transit, regroupement.</p>
</td>
</tr>
<tr>
<td>
signingInfo<br />
<a href="/api/inputObjects#signatureforminput"><code>SignatureFormInput!</code></a>
</td>
<td>
<p>Informations liées aux signatures transporteur et émetteur (case 8 et 9)</p>
</td>
</tr>
<tr>
<td>
trader<br />
<a href="/api/inputObjects#traderinput"><code>TraderInput</code></a>
</td>
<td>
<p>Négociant (case 7)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#transporterinput"><code>TransporterInput</code></a>
</td>
<td>
<p>Transporteur du déchet (case 8)</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api/inputObjects#wastedetailsinput"><code>WasteDetailsInput</code></a>
</td>
<td>
<p>Détails du déchet (case 3)</p>
</td>
</tr>
</tbody>
</table>

## InternationalCompanyInput

Payload d'un établissement pouvant se situer en France
ou à l'étranger

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<p>En l&#39;absence de code, l&#39;entreprise est considérée comme résidant en France.</p>
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
<p>SIRET de l&#39;établissement, optionnel dans le cas d&#39;un établissement à l&#39;étranger</p>
</td>
</tr>
</tbody>
</table>

## NextDestinationInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/inputObjects#internationalcompanyinput"><code>InternationalCompanyInput!</code></a>
</td>
<td>
<p>Établissement de destination ultérieur</p>
</td>
</tr>
<tr>
<td>
processingOperation<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Traitement prévue (code D/R)</p>
</td>
</tr>
</tbody>
</table>

## NextSegmentInfoInput

Payload lié à l'ajout de segment de transport multimodal (case 20 à 21)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
mode<br />
<a href="/api/enums#transportmode"><code>TransportMode!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#transporterinput"><code>TransporterInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## PackagingInfoInput

Payload lié à un élément de conditionnement

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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

## ProcessedFormInput

Payload de traitement d'un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
nextDestination<br />
<a href="/api/inputObjects#nextdestinationinput"><code>NextDestinationInput</code></a>
</td>
<td>
<p>Destination ultérieure prévue (case 12)</p>
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
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été traité</p>
</td>
</tr>
<tr>
<td>
processedBy<br />
<a href="/api/scalars#string"><code>String!</code></a>
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
<p>Description de l&#39;opération d’élimination / valorisation (case 11)
Elle se complète automatiquement lorsque non fournie</p>
</td>
</tr>
<tr>
<td>
processingOperationDone<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Traitement réalisé (code D/R)</p>
</td>
</tr>
</tbody>
</table>

## ReceivedFormInput

Payload de réception d'un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
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
receivedAt<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été reçu (case 10)</p>
</td>
</tr>
<tr>
<td>
receivedBy<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de la personne en charge de la réception du déchet (case 10)</p>
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
wasteAcceptationStatus<br />
<a href="/api/enums#wasteacceptationstatusinput"><code>WasteAcceptationStatusInput</code></a>
</td>
<td>
<p>Statut d&#39;acceptation du déchet (case 10)</p>
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

## RecipientInput

Payload lié à l'installation de destination ou d'entreprosage
ou de reconditionnement prévue (case 2)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
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
<p>Si c&#39;est un entreprosage provisoire ou reconditionnement</p>
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

## RegroupedBsdasriInput

Payload de regroupement

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Identifiant unique du bordereau</p>
</td>
</tr>
</tbody>
</table>

## ResealedFormInput

Payload lié au détails du déchet du BSD suite (case 14 à 19)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
destination<br />
<a href="/api/inputObjects#destinationinput"><code>DestinationInput</code></a>
</td>
<td>
<p>Destination finale du déchet (case 14)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#transporterinput"><code>TransporterInput</code></a>
</td>
<td>
<p>Transporteur du déchet reconditionné</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api/inputObjects#wastedetailsinput"><code>WasteDetailsInput</code></a>
</td>
<td>
<p>Détail du déchet en cas de reconditionnement (case 15 à 19)</p>
</td>
</tr>
</tbody>
</table>

## ResentFormInput

Payload lié au détails du déchet du BSD suite et à la signature de l'envoi (case 14 à 20)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
destination<br />
<a href="/api/inputObjects#destinationinput"><code>DestinationInput</code></a>
</td>
<td>
<p>Destination finale du déchet (case 14)</p>
</td>
</tr>
<tr>
<td>
signedAt<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de signature du BSD suite (case 19). Défaut à la date d&#39;aujourd&#39;hui.</p>
</td>
</tr>
<tr>
<td>
signedBy<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom du signataire du BSD suite  (case 19)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#transporterinput"><code>TransporterInput</code></a>
</td>
<td>
<p>Transporteur du déchet reconditionné</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api/inputObjects#wastedetailsinput"><code>WasteDetailsInput</code></a>
</td>
<td>
<p>Détail du déchet en cas de reconditionnement (case 15 à 19)</p>
</td>
</tr>
</tbody>
</table>

## SentFormInput

Payload de signature d'un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
sentAt<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de l&#39;envoi du déchet par l&#39;émetteur (case 9)</p>
</td>
</tr>
<tr>
<td>
sentBy<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de la personne responsable de l&#39;envoi du déchet (case 9)</p>
</td>
</tr>
</tbody>
</table>

## SignatureFormInput

Payload simplifié de signature d'un BSD par un transporteur

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
sentAt<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de l&#39;envoi du déchet par l&#39;émetteur (case 9)</p>
</td>
</tr>
<tr>
<td>
sentBy<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de la personne responsable de l&#39;envoi du déchet (case 9)</p>
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
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
date<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## TakeOverInput

Payload de prise en charge de segment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
takenOverAt<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
takenOverBy<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## TemporaryStorageDetailInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
destination<br />
<a href="/api/inputObjects#destinationinput"><code>DestinationInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## TempStoredFormInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
quantityReceived<br />
<a href="/api/scalars#float"><code>Float!</code></a>
</td>
<td>
<p>Quantité réelle présentée (case 13)</p>
</td>
</tr>
<tr>
<td>
quantityType<br />
<a href="/api/enums#quantitytype"><code>QuantityType!</code></a>
</td>
<td>
<p>Réelle ou estimée</p>
</td>
</tr>
<tr>
<td>
receivedAt<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été reçu (case 13)</p>
</td>
</tr>
<tr>
<td>
receivedBy<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de la personne en charge de la réception du déchet (case 13)</p>
</td>
</tr>
<tr>
<td>
signedAt<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été accepté ou refusé (case 13). Défaut à la date d&#39;aujourd&#39;hui.</p>
</td>
</tr>
<tr>
<td>
wasteAcceptationStatus<br />
<a href="/api/enums#wasteacceptationstatusinput"><code>WasteAcceptationStatusInput</code></a>
</td>
<td>
<p>Statut d&#39;acceptation du déchet (case 13)</p>
</td>
</tr>
<tr>
<td>
wasteRefusalReason<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Raison du refus (case 13)</p>
</td>
</tr>
</tbody>
</table>

## TempStorerAcceptedFormInput



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
quantityReceived<br />
<a href="/api/scalars#float"><code>Float!</code></a>
</td>
<td>
<p>Quantité réelle présentée (case 13)</p>
</td>
</tr>
<tr>
<td>
quantityType<br />
<a href="/api/enums#quantitytype"><code>QuantityType!</code></a>
</td>
<td>
<p>Réelle ou estimée</p>
</td>
</tr>
<tr>
<td>
signedAt<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été accepté ou refusé (case 13).</p>
</td>
</tr>
<tr>
<td>
signedBy<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de la personne en charge de l&#39;acceptation du déchet (case 13)</p>
</td>
</tr>
<tr>
<td>
wasteAcceptationStatus<br />
<a href="/api/enums#wasteacceptationstatusinput"><code>WasteAcceptationStatusInput!</code></a>
</td>
<td>
<p>Statut d&#39;acceptation du déchet (case 13)</p>
</td>
</tr>
<tr>
<td>
wasteRefusalReason<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Raison du refus (case 13)</p>
</td>
</tr>
</tbody>
</table>

## TraderInput

Payload lié au négociant

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
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

## TransporterInput

Collecteur - transporteur (case 8)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api/inputObjects#companyinput"><code>CompanyInput</code></a>
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

## TransporterSignatureFormInput

Payload de signature d'un BSD par un transporteur

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
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
packagingInfos<br />
<a href="/api/inputObjects#packaginginfoinput"><code>[PackagingInfoInput!]</code></a>
</td>
<td>
<p>Conditionnements</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api/enums#packagings"><code>[Packagings]</code></a>
</td>
<td>
<p>DEPRECATED - Conditionnement</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#float"><code>Float!</code></a>
</td>
<td>
<p>Quantité en tonnes</p>
</td>
</tr>
<tr>
<td>
securityCode<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Code de signature permettant d&#39;authentifier l&#39;émetteur</p>
</td>
</tr>
<tr>
<td>
sentAt<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de l&#39;envoi du déchet par l&#39;émetteur (case 9)</p>
</td>
</tr>
<tr>
<td>
sentBy<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de la personne responsable de l&#39;envoi du déchet (case 9)</p>
</td>
</tr>
<tr>
<td>
signatureAuthor<br />
<a href="/api/enums#signatureauthor"><code>SignatureAuthor</code></a>
</td>
<td>
<p>Dénomination de l&#39;auteur de la signature, par défaut il s&#39;agit de l&#39;émetteur</p>
</td>
</tr>
<tr>
<td>
signedByProducer<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>
<p>Si oui on non le BSD a été signé par l&#39;émetteur</p>
</td>
</tr>
<tr>
<td>
signedByTransporter<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>
<p>Si oui ou non le BSD a été signé par un transporteur</p>
</td>
</tr>
</tbody>
</table>

## UpdateFormInput

Payload de mise à jour d'un bordereau

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
appendix2Forms<br />
<a href="/api/inputObjects#appendixforminput"><code>[AppendixFormInput!]</code></a>
</td>
<td>
<p>Annexe 2</p>
</td>
</tr>
<tr>
<td>
broker<br />
<a href="/api/inputObjects#brokerinput"><code>BrokerInput</code></a>
</td>
<td>
<p>Courtier</p>
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
<a href="/api/inputObjects#ecoorganismeinput"><code>EcoOrganismeInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api/inputObjects#emitterinput"><code>EmitterInput</code></a>
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
<p>Identifiant opaque</p>
</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api/inputObjects#recipientinput"><code>RecipientInput</code></a>
</td>
<td>
<p>Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
L&#39;établissement renseigné doit être inscrit sur Trackdéchets en tant qu&#39;installation
de traitement ou de tri, transit, regroupement.</p>
</td>
</tr>
<tr>
<td>
temporaryStorageDetail<br />
<a href="/api/inputObjects#temporarystoragedetailinput"><code>TemporaryStorageDetailInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
trader<br />
<a href="/api/inputObjects#traderinput"><code>TraderInput</code></a>
</td>
<td>
<p>Négociant (case 7)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api/inputObjects#transporterinput"><code>TransporterInput</code></a>
</td>
<td>
<p>Transporteur du déchet (case 8)</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api/inputObjects#wastedetailsinput"><code>WasteDetailsInput</code></a>
</td>
<td>
<p>Détails du déchet (case 3)</p>
</td>
</tr>
</tbody>
</table>

## WasteDetailsInput

Payload lié au détails du déchet (case 3, 4, 5, 6)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
code<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code du déchet dangereux ou non-dangereux qui doit faire partie de la liste officielle du code de l&#39;environnement :
<a href="https://aida.ineris.fr/consultation_document/10327">https://aida.ineris.fr/consultation_document/10327</a></p>
<p>Il doit être composé de 3 paires de deux chiffres séparés par un espace et se termine éventuellement par une astérisque.</p>
<p>Un exemple de déchet non-dangereux valide (déchets provenant de l&#39;extraction des minéraux métallifères) :
01 01 01</p>
<p>Ce même exemple, mais avec un format invalide :
010101</p>
<p>Un exemple de déchet dangereux valide (stériles acidogènes provenant de la transformation du sulfure) :
01 03 04*</p>
<p>Ce même exemple, mais avec un format invalide :
010304 *</p>
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
<p>DEPRECATED - Nombre de colis</p>
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
<p>DEPRECATED - Autre packaging (préciser)</p>
</td>
</tr>
<tr>
<td>
packagingInfos<br />
<a href="/api/inputObjects#packaginginfoinput"><code>[PackagingInfoInput!]</code></a>
</td>
<td>
<p>Conditionnements</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api/enums#packagings"><code>[Packagings]</code></a>
</td>
<td>
<p>DEPRECATED - Conditionnement</p>
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

## WorkSiteInput

Payload d'une adresse chantier

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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

