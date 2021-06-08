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
<a href="/api-reference/bsdd/scalars#float"><code>Float!</code></a>
</td>
<td>
<p>Quantité réelle présentée (case 10)</p>
</td>
</tr>
<tr>
<td>
signedAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été accepté ou refusé (case 10)</p>
</td>
</tr>
<tr>
<td>
signedBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de la personne en charge de l&#39;acceptation&#39; du déchet (case 10)</p>
</td>
</tr>
<tr>
<td>
wasteAcceptationStatus<br />
<a href="/api-reference/bsdd/enums#wasteacceptationstatusinput"><code>WasteAcceptationStatusInput!</code></a>
</td>
<td>
<p>Statut d&#39;acceptation du déchet (case 10)</p>
</td>
</tr>
<tr>
<td>
wasteRefusalReason<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Identifiant unique du bordereau</p>
</td>
</tr>
<tr>
<td>
readableId<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID</code></a>
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
<a href="/api-reference/bsdd/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Établissement courtier</p>
</td>
</tr>
<tr>
<td>
department<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Département</p>
</td>
</tr>
<tr>
<td>
receipt<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de récipissé</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Limite de validité</p>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Adresse de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
contact<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
mail<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Email du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
phone<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de téléphone de contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
vatNumber<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/inputObjects#appendixforminput"><code>[AppendixFormInput!]</code></a>
</td>
<td>
<p>Annexe 2</p>
</td>
</tr>
<tr>
<td>
broker<br />
<a href="/api-reference/bsdd/inputObjects#brokerinput"><code>BrokerInput</code></a>
</td>
<td>
<p>Courtier</p>
</td>
</tr>
<tr>
<td>
customId<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Identifiant personnalisé permettant de faire le lien avec un
objet un système d&#39;information tierce</p>
</td>
</tr>
<tr>
<td>
ecoOrganisme<br />
<a href="/api-reference/bsdd/inputObjects#ecoorganismeinput"><code>EcoOrganismeInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsdd/inputObjects#emitterinput"><code>EmitterInput</code></a>
</td>
<td>
<p>Établissement émetteur/producteur du déchet (case 1)</p>
</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api-reference/bsdd/inputObjects#recipientinput"><code>RecipientInput</code></a>
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
<a href="/api-reference/bsdd/inputObjects#temporarystoragedetailinput"><code>TemporaryStorageDetailInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
trader<br />
<a href="/api-reference/bsdd/inputObjects#traderinput"><code>TraderInput</code></a>
</td>
<td>
<p>Négociant (case 7)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdd/inputObjects#transporterinput"><code>TransporterInput</code></a>
</td>
<td>
<p>Transporteur du déchet (case 8)</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdd/inputObjects#wastedetailsinput"><code>WasteDetailsInput</code></a>
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
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_gt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_gte<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_lt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
_lte<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de CAP prévu (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api-reference/bsdd/inputObjects#companyinput"><code>CompanyInput</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
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
<a href="/api-reference/bsdd/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Établissement émetteur</p>
</td>
</tr>
<tr>
<td>
pickupSite<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>DEPRECATED - Ancienne adresse chantier</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsdd/enums#emittertype"><code>EmitterType</code></a>
</td>
<td>
<p>Type d&#39;émetteur</p>
</td>
</tr>
<tr>
<td>
workSite<br />
<a href="/api-reference/bsdd/inputObjects#worksiteinput"><code>WorkSiteInput</code></a>
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
<a href="/api-reference/bsdd/inputObjects#appendixforminput"><code>[AppendixFormInput!]</code></a>
</td>
<td>
<p>Annexe 2</p>
</td>
</tr>
<tr>
<td>
broker<br />
<a href="/api-reference/bsdd/inputObjects#brokerinput"><code>BrokerInput</code></a>
</td>
<td>
<p>Courtier</p>
</td>
</tr>
<tr>
<td>
customId<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Identifiant personnalisé permettant de faire le lien avec un
objet un système d&#39;information tierce</p>
</td>
</tr>
<tr>
<td>
ecoOrganisme<br />
<a href="/api-reference/bsdd/inputObjects#ecoorganismeinput"><code>EcoOrganismeInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsdd/inputObjects#emitterinput"><code>EmitterInput</code></a>
</td>
<td>
<p>Établissement émetteur/producteur du déchet (case 1)</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Identifiant opaque</p>
</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api-reference/bsdd/inputObjects#recipientinput"><code>RecipientInput</code></a>
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
<a href="/api-reference/bsdd/inputObjects#temporarystoragedetailinput"><code>TemporaryStorageDetailInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
trader<br />
<a href="/api-reference/bsdd/inputObjects#traderinput"><code>TraderInput</code></a>
</td>
<td>
<p>Négociant (case 7)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdd/inputObjects#transporterinput"><code>TransporterInput</code></a>
</td>
<td>
<p>Transporteur du déchet (case 8)</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdd/inputObjects#wastedetailsinput"><code>WasteDetailsInput</code></a>
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
<a href="/api-reference/bsdd/inputObjects#brokerinput"><code>BrokerInput</code></a>
</td>
<td>
<p>Courtier</p>
</td>
</tr>
<tr>
<td>
customId<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/inputObjects#ecoorganismeinput"><code>EcoOrganismeInput</code></a>
</td>
<td>
<p>Éco-organisme (apparait en case 1)</p>
</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsdd/inputObjects#emitterinput"><code>EmitterInput</code></a>
</td>
<td>
<p>Établissement émetteur/producteur du déchet (case 1)</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Numéro de BSD Trackdéchets (uniquement dans le cas d&#39;une mise à jour d&#39;un
bordereau émis initialement dans Trackdéchets)</p>
</td>
</tr>
<tr>
<td>
processedInfo<br />
<a href="/api-reference/bsdd/inputObjects#processedforminput"><code>ProcessedFormInput!</code></a>
</td>
<td>
<p>Informations liées au traitement du déchet (case 11)</p>
</td>
</tr>
<tr>
<td>
receivedInfo<br />
<a href="/api-reference/bsdd/inputObjects#receivedforminput"><code>ReceivedFormInput!</code></a>
</td>
<td>
<p>Informations liées à la réception du déchet (case 10)</p>
</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api-reference/bsdd/inputObjects#recipientinput"><code>RecipientInput</code></a>
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
<a href="/api-reference/bsdd/inputObjects#signatureforminput"><code>SignatureFormInput!</code></a>
</td>
<td>
<p>Informations liées aux signatures transporteur et émetteur (case 8 et 9)</p>
</td>
</tr>
<tr>
<td>
trader<br />
<a href="/api-reference/bsdd/inputObjects#traderinput"><code>TraderInput</code></a>
</td>
<td>
<p>Négociant (case 7)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdd/inputObjects#transporterinput"><code>TransporterInput</code></a>
</td>
<td>
<p>Transporteur du déchet (case 8)</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdd/inputObjects#wastedetailsinput"><code>WasteDetailsInput</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Adresse de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
contact<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
country<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Email du contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
phone<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de téléphone de contact dans l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/inputObjects#internationalcompanyinput"><code>InternationalCompanyInput!</code></a>
</td>
<td>
<p>Établissement de destination ultérieur</p>
</td>
</tr>
<tr>
<td>
processingOperation<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
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
<a href="/api-reference/bsdd/enums#transportmode"><code>TransportMode!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdd/inputObjects#transporterinput"><code>TransporterInput</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Description du conditionnement dans le cas où le type de conditionnement est <code>AUTRE</code></p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsdd/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Nombre de colis associés à ce conditionnement</p>
</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsdd/enums#packagings"><code>Packagings!</code></a>
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
<a href="/api-reference/bsdd/inputObjects#nextdestinationinput"><code>NextDestinationInput</code></a>
</td>
<td>
<p>Destination ultérieure prévue (case 12)</p>
</td>
</tr>
<tr>
<td>
noTraceability<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Si oui ou non il y a eu perte de traçabalité</p>
</td>
</tr>
<tr>
<td>
processedAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été traité</p>
</td>
</tr>
<tr>
<td>
processedBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Personne en charge du traitement</p>
</td>
</tr>
<tr>
<td>
processingOperationDescription<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Description de l&#39;opération d’élimination / valorisation (case 11)
Elle se complète automatiquement lorsque non fournie</p>
</td>
</tr>
<tr>
<td>
processingOperationDone<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
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
<a href="/api-reference/bsdd/scalars#float"><code>Float</code></a>
</td>
<td>
<p>Quantité réelle présentée (case 10)</p>
</td>
</tr>
<tr>
<td>
receivedAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été reçu (case 10)</p>
</td>
</tr>
<tr>
<td>
receivedBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de la personne en charge de la réception du déchet (case 10)</p>
</td>
</tr>
<tr>
<td>
signedAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été accepté ou refusé (case 10)</p>
</td>
</tr>
<tr>
<td>
wasteAcceptationStatus<br />
<a href="/api-reference/bsdd/enums#wasteacceptationstatusinput"><code>WasteAcceptationStatusInput</code></a>
</td>
<td>
<p>Statut d&#39;acceptation du déchet (case 10)</p>
</td>
</tr>
<tr>
<td>
wasteRefusalReason<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de CAP (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api-reference/bsdd/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Établissement de destination</p>
</td>
</tr>
<tr>
<td>
isTempStorage<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Si c&#39;est un entreprosage provisoire ou reconditionnement</p>
</td>
</tr>
<tr>
<td>
processingOperation<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Opération d&#39;élimination / valorisation prévue (code D/R)</p>
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
<a href="/api-reference/bsdd/inputObjects#destinationinput"><code>DestinationInput</code></a>
</td>
<td>
<p>Destination finale du déchet (case 14)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdd/inputObjects#transporterinput"><code>TransporterInput</code></a>
</td>
<td>
<p>Transporteur du déchet reconditionné</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdd/inputObjects#wastedetailsinput"><code>WasteDetailsInput</code></a>
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
<a href="/api-reference/bsdd/inputObjects#destinationinput"><code>DestinationInput</code></a>
</td>
<td>
<p>Destination finale du déchet (case 14)</p>
</td>
</tr>
<tr>
<td>
signedAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de signature du BSD suite (case 19). Défaut à la date d&#39;aujourd&#39;hui.</p>
</td>
</tr>
<tr>
<td>
signedBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom du signataire du BSD suite  (case 19)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdd/inputObjects#transporterinput"><code>TransporterInput</code></a>
</td>
<td>
<p>Transporteur du déchet reconditionné</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdd/inputObjects#wastedetailsinput"><code>WasteDetailsInput</code></a>
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
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de l&#39;envoi du déchet par l&#39;émetteur (case 9)</p>
</td>
</tr>
<tr>
<td>
sentBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
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
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de l&#39;envoi du déchet par l&#39;émetteur (case 9)</p>
</td>
</tr>
<tr>
<td>
sentBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de la personne responsable de l&#39;envoi du déchet (case 9)</p>
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
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
takenOverBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
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
<a href="/api-reference/bsdd/inputObjects#destinationinput"><code>DestinationInput</code></a>
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
<a href="/api-reference/bsdd/scalars#float"><code>Float!</code></a>
</td>
<td>
<p>Quantité réelle présentée (case 13)</p>
</td>
</tr>
<tr>
<td>
quantityType<br />
<a href="/api-reference/bsdd/enums#quantitytype"><code>QuantityType!</code></a>
</td>
<td>
<p>Réelle ou estimée</p>
</td>
</tr>
<tr>
<td>
receivedAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été reçu (case 13)</p>
</td>
</tr>
<tr>
<td>
receivedBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de la personne en charge de la réception du déchet (case 13)</p>
</td>
</tr>
<tr>
<td>
signedAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été accepté ou refusé (case 13). Défaut à la date d&#39;aujourd&#39;hui.</p>
</td>
</tr>
<tr>
<td>
wasteAcceptationStatus<br />
<a href="/api-reference/bsdd/enums#wasteacceptationstatusinput"><code>WasteAcceptationStatusInput</code></a>
</td>
<td>
<p>Statut d&#39;acceptation du déchet (case 13)</p>
</td>
</tr>
<tr>
<td>
wasteRefusalReason<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/scalars#float"><code>Float!</code></a>
</td>
<td>
<p>Quantité réelle présentée (case 13)</p>
</td>
</tr>
<tr>
<td>
quantityType<br />
<a href="/api-reference/bsdd/enums#quantitytype"><code>QuantityType!</code></a>
</td>
<td>
<p>Réelle ou estimée</p>
</td>
</tr>
<tr>
<td>
signedAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été accepté ou refusé (case 13).</p>
</td>
</tr>
<tr>
<td>
signedBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de la personne en charge de l&#39;acceptation du déchet (case 13)</p>
</td>
</tr>
<tr>
<td>
wasteAcceptationStatus<br />
<a href="/api-reference/bsdd/enums#wasteacceptationstatusinput"><code>WasteAcceptationStatusInput!</code></a>
</td>
<td>
<p>Statut d&#39;acceptation du déchet (case 13)</p>
</td>
</tr>
<tr>
<td>
wasteRefusalReason<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Établissement négociant</p>
</td>
</tr>
<tr>
<td>
department<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Département</p>
</td>
</tr>
<tr>
<td>
receipt<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de récipissé</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api-reference/bsdd/inputObjects#companyinput"><code>CompanyInput</code></a>
</td>
<td>
<p>Établissement collecteur - transporteur</p>
</td>
</tr>
<tr>
<td>
customInfo<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Information libre, destinée aux transporteurs</p>
</td>
</tr>
<tr>
<td>
department<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Département</p>
</td>
</tr>
<tr>
<td>
isExemptedOfReceipt<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Exemption de récipissé</p>
</td>
</tr>
<tr>
<td>
numberPlate<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de plaque d&#39;immatriculation</p>
</td>
</tr>
<tr>
<td>
receipt<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de récipissé</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code ONU</p>
</td>
</tr>
<tr>
<td>
packagingInfos<br />
<a href="/api-reference/bsdd/inputObjects#packaginginfoinput"><code>[PackagingInfoInput!]</code></a>
</td>
<td>
<p>Conditionnements</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api-reference/bsdd/enums#packagings"><code>[Packagings]</code></a>
</td>
<td>
<p>DEPRECATED - Conditionnement</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsdd/scalars#float"><code>Float!</code></a>
</td>
<td>
<p>Quantité en tonnes</p>
</td>
</tr>
<tr>
<td>
securityCode<br />
<a href="/api-reference/bsdd/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Code de signature permettant d&#39;authentifier l&#39;émetteur</p>
</td>
</tr>
<tr>
<td>
sentAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Date de l&#39;envoi du déchet par l&#39;émetteur (case 9)</p>
</td>
</tr>
<tr>
<td>
sentBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de la personne responsable de l&#39;envoi du déchet (case 9)</p>
</td>
</tr>
<tr>
<td>
signatureAuthor<br />
<a href="/api-reference/bsdd/enums#signatureauthor"><code>SignatureAuthor</code></a>
</td>
<td>
<p>Dénomination de l&#39;auteur de la signature, par défaut il s&#39;agit de l&#39;émetteur</p>
</td>
</tr>
<tr>
<td>
signedByProducer<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>
<p>Si oui on non le BSD a été signé par l&#39;émetteur</p>
</td>
</tr>
<tr>
<td>
signedByTransporter<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean!</code></a>
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
<a href="/api-reference/bsdd/inputObjects#appendixforminput"><code>[AppendixFormInput!]</code></a>
</td>
<td>
<p>Annexe 2</p>
</td>
</tr>
<tr>
<td>
broker<br />
<a href="/api-reference/bsdd/inputObjects#brokerinput"><code>BrokerInput</code></a>
</td>
<td>
<p>Courtier</p>
</td>
</tr>
<tr>
<td>
customId<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Identifiant personnalisé permettant de faire le lien avec un
objet un système d&#39;information tierce</p>
</td>
</tr>
<tr>
<td>
ecoOrganisme<br />
<a href="/api-reference/bsdd/inputObjects#ecoorganismeinput"><code>EcoOrganismeInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsdd/inputObjects#emitterinput"><code>EmitterInput</code></a>
</td>
<td>
<p>Établissement émetteur/producteur du déchet (case 1)</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Identifiant opaque</p>
</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api-reference/bsdd/inputObjects#recipientinput"><code>RecipientInput</code></a>
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
<a href="/api-reference/bsdd/inputObjects#temporarystoragedetailinput"><code>TemporaryStorageDetailInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
trader<br />
<a href="/api-reference/bsdd/inputObjects#traderinput"><code>TraderInput</code></a>
</td>
<td>
<p>Négociant (case 7)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdd/inputObjects#transporterinput"><code>TransporterInput</code></a>
</td>
<td>
<p>Transporteur du déchet (case 8)</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdd/inputObjects#wastedetailsinput"><code>WasteDetailsInput</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/enums#consistence"><code>Consistence</code></a>
</td>
<td>
<p>Consistance</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Dénomination usuelle</p>
</td>
</tr>
<tr>
<td>
numberOfPackages<br />
<a href="/api-reference/bsdd/scalars#int"><code>Int</code></a>
</td>
<td>
<p>DEPRECATED - Nombre de colis</p>
</td>
</tr>
<tr>
<td>
onuCode<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code ONU</p>
</td>
</tr>
<tr>
<td>
otherPackaging<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>DEPRECATED - Autre packaging (préciser)</p>
</td>
</tr>
<tr>
<td>
packagingInfos<br />
<a href="/api-reference/bsdd/inputObjects#packaginginfoinput"><code>[PackagingInfoInput!]</code></a>
</td>
<td>
<p>Conditionnements</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api-reference/bsdd/enums#packagings"><code>[Packagings]</code></a>
</td>
<td>
<p>DEPRECATED - Conditionnement</p>
</td>
</tr>
<tr>
<td>
pop<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Contient des Polluants Organiques Persistants (POP) oui / non</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsdd/scalars#float"><code>Float</code></a>
</td>
<td>
<p>Quantité en tonnes</p>
</td>
</tr>
<tr>
<td>
quantityType<br />
<a href="/api-reference/bsdd/enums#quantitytype"><code>QuantityType</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
city<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
infos<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
postalCode<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

