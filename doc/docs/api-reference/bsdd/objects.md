---
id: objects
title: Objects
slug: objects
---

## Broker

Courtier

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsdd/objects#formcompany"><code>FormCompany</code></a>
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

## CompanyStat

Statistiques d'un établissement

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsdd/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement</p>
</td>
</tr>
<tr>
<td>
stats<br />
<a href="/api-reference/bsdd/objects#stat"><code>[Stat!]!</code></a>
</td>
<td>
<p>Liste des statistiques</p>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de CAP (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api-reference/bsdd/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement de destination</p>
</td>
</tr>
<tr>
<td>
isFilledByEmitter<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Indique si l&#39;information a été saisie par l&#39;émetteur du bordereau ou l&#39;installation d&#39;entreposage</p>
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

## Emitter

Émetteur du BSD (case 1)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsdd/objects#formcompany"><code>FormCompany</code></a>
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
<blockquote>Deprecated: Migration vers `workSite` obligatoire</blockquote>

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
<a href="/api-reference/bsdd/objects#worksite"><code>WorkSite</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Lien de téléchargement</p>
</td>
</tr>
<tr>
<td>
token<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/scalars#float"><code>Float</code></a>
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
<a href="/api-reference/bsdd/objects#form"><code>[Form!]</code></a>
</td>
<td>
<p>Annexe 2</p>
</td>
</tr>
<tr>
<td>
broker<br />
<a href="/api-reference/bsdd/objects#broker"><code>Broker</code></a>
</td>
<td>
<p>Courtier</p>
</td>
</tr>
<tr>
<td>
createdAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de création du BSD</p>
</td>
</tr>
<tr>
<td>
currentTransporterSiret<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>

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
<a href="/api-reference/bsdd/objects#formecoorganisme"><code>FormEcoOrganisme</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitter<br />
<a href="/api-reference/bsdd/objects#emitter"><code>Emitter</code></a>
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
<p>Identifiant unique du bordereau.</p>
</td>
</tr>
<tr>
<td>
isImportedFromPaper<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>
<p>Permet de savoir si les données du BSD ont été importées depuis un
bordereau signé papier via la mutation <code>importPaperForm</code></p>
</td>
</tr>
<tr>
<td>
nextDestination<br />
<a href="/api-reference/bsdd/objects#nextdestination"><code>NextDestination</code></a>
</td>
<td>
<p>Destination ultérieure prévue (case 12)</p>
</td>
</tr>
<tr>
<td>
nextTransporterSiret<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>

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
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été traité</p>
</td>
</tr>
<tr>
<td>
processedBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<p>Description de l&#39;opération d’élimination / valorisation (case 11)</p>
</td>
</tr>
<tr>
<td>
processingOperationDone<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Traitement réalisé (code D/R)</p>
</td>
</tr>
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
readableId<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
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
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date à laquelle le déchet a été reçu (case 10)</p>
</td>
</tr>
<tr>
<td>
receivedBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de la personne en charge de la réception du déchet (case 10)</p>
</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api-reference/bsdd/objects#recipient"><code>Recipient</code></a>
</td>
<td>
<p>Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)</p>
</td>
</tr>
<tr>
<td>
sentAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de l&#39;envoi du déchet par l&#39;émetteur (case 9)</p>
</td>
</tr>
<tr>
<td>
sentBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de la personne responsable de l&#39;envoi du déchet (case 9)</p>
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
signedByTransporter<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Si oui ou non le BSD a été signé par un transporteur</p>
</td>
</tr>
<tr>
<td>
stateSummary<br />
<a href="/api-reference/bsdd/objects#statesummary"><code>StateSummary</code></a>
</td>
<td>
<p>Résumé des valeurs clés du bordereau à l&#39;instant T</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api-reference/bsdd/enums#formstatus"><code>FormStatus!</code></a>
</td>
<td>
<p>Statut du BSD (brouillon, envoyé, reçu, traité, etc)</p>
</td>
</tr>
<tr>
<td>
temporaryStorageDetail<br />
<a href="/api-reference/bsdd/objects#temporarystoragedetail"><code>TemporaryStorageDetail</code></a>
</td>
<td>
<p>BSD suite - détail des champs de la partie entreposage provisoire ou reconditionnement</p>
</td>
</tr>
<tr>
<td>
trader<br />
<a href="/api-reference/bsdd/objects#trader"><code>Trader</code></a>
</td>
<td>
<p>Négociant (case 7)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdd/objects#transporter"><code>Transporter</code></a>
</td>
<td>
<p>Transporteur du déchet (case 8)</p>
</td>
</tr>
<tr>
<td>
transportSegments<br />
<a href="/api-reference/bsdd/objects#transportsegment"><code>[TransportSegment!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
updatedAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de la dernière modification du BSD</p>
</td>
</tr>
<tr>
<td>
wasteAcceptationStatus<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Statut d&#39;acceptation du déchet (case 10)</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdd/objects#wastedetails"><code>WasteDetails</code></a>
</td>
<td>
<p>Détails du déchet (case 3)</p>
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

## FormCompany

Information sur un établissement dans un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

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
<p>Seul la destination ultérieure case 12 (<code>form.nextDestination.company</code>) peut être à l&#39;étranger.</p>
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

## FormEcoOrganisme

Information sur l'éco-organisme responsable du BSD

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

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

## formsLifeCycleData

Informations du cycle de vie des bordereaux

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
count<br />
<a href="/api-reference/bsdd/scalars#int"><code>Int</code></a>
</td>
<td>
<p>Nombre de changements de statuts renvoyés</p>
</td>
</tr>
<tr>
<td>
endCursor<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Dernier ID de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle</p>
</td>
</tr>
<tr>
<td>
hasNextPage<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>pagination, indique si d&#39;autres pages existent après</p>
</td>
</tr>
<tr>
<td>
hasPreviousPage<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>pagination, indique si d&#39;autres pages existent avant</p>
</td>
</tr>
<tr>
<td>
startCursor<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Premier id de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle</p>
</td>
</tr>
<tr>
<td>
statusLogs<br />
<a href="/api-reference/bsdd/objects#statuslog"><code>[StatusLog!]!</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Type de mutation</p>
</td>
</tr>
<tr>
<td>
node<br />
<a href="/api-reference/bsdd/objects#form"><code>Form</code></a>
</td>
<td>
<p>BSD concerné</p>
</td>
</tr>
<tr>
<td>
previousValues<br />
<a href="/api-reference/bsdd/objects#form"><code>Form</code></a>
</td>
<td>
<p>Ancienne valeurs</p>
</td>
</tr>
<tr>
<td>
updatedFields<br />
<a href="/api-reference/bsdd/scalars#string"><code>[String]</code></a>
</td>
<td>
<p>Liste des champs mis à jour</p>
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
<a href="/api-reference/bsdd/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Établissement ultérieure</p>
</td>
</tr>
<tr>
<td>
processingOperation<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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

## PageInfo



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
endCursor<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hasNextPage<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hasPreviousPage<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
startCursor<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>N° de CAP (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
company<br />
<a href="/api-reference/bsdd/objects#formcompany"><code>FormCompany</code></a>
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
<p>Indique si c&#39;est un établissement d&#39;entreposage temporaire ou de reocnditionnement</p>
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

## Signature



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
author<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
date<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
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
<a href="/api-reference/bsdd/scalars#float"><code>Float!</code></a>
</td>
<td>
<p>Quantité entrante</p>
</td>
</tr>
<tr>
<td>
outgoing<br />
<a href="/api-reference/bsdd/scalars#float"><code>Float!</code></a>
</td>
<td>
<p>Qantité sortante</p>
</td>
</tr>
<tr>
<td>
wasteCode<br />
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
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
<a href="/api-reference/bsdd/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Prochaine entreprise à émettre le déchet (entreprise en case 1 ou 13)</p>
</td>
</tr>
<tr>
<td>
lastActionOn<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de la dernière action sur le bordereau</p>
</td>
</tr>
<tr>
<td>
onuCode<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code ONU le plus à jour</p>
</td>
</tr>
<tr>
<td>
packagingInfos<br />
<a href="/api-reference/bsdd/objects#packaginginfo"><code>[PackagingInfo!]!</code></a>
</td>
<td>
<p>Packaging le plus à jour</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api-reference/bsdd/enums#packagings"><code>[Packagings!]!</code></a>
</td>
<td>
<blockquote>Deprecated: Utiliser packagingInfos</blockquote>

<p>DEPRECATED Packaging le plus à jour</p>
</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api-reference/bsdd/scalars#float"><code>Float</code></a>
</td>
<td>
<p>Quantité la plus à jour</p>
</td>
</tr>
<tr>
<td>
recipient<br />
<a href="/api-reference/bsdd/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Prochaine entreprise à recevoir le déchet (entreprise en case 2 ou 14)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdd/objects#formcompany"><code>FormCompany</code></a>
</td>
<td>
<p>Prochaine entreprise à transporter le déchet (entreprise en case 8 ou 18)</p>
</td>
</tr>
<tr>
<td>
transporterCustomInfo<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Information libre, destinée aux transporteurs</p>
</td>
</tr>
<tr>
<td>
transporterNumberPlate<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/objects#statuslogform"><code>StatusLogForm</code></a>
</td>
<td>
<p>BSD concerné</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Identifiant du log</p>
</td>
</tr>
<tr>
<td>
loggedAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date à laquelle le changement de statut a été effectué</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api-reference/bsdd/enums#formstatus"><code>FormStatus</code></a>
</td>
<td>
<p>Statut du bordereau après le changement de statut</p>
</td>
</tr>
<tr>
<td>
updatedFields<br />
<a href="/api-reference/bsdd/scalars#json"><code>JSON</code></a>
</td>
<td>
<p>Valeur des champs transmis lors du changement de statut (eg. receivedBY, processingOperationDescription)</p>
</td>
</tr>
<tr>
<td>
user<br />
<a href="/api-reference/bsdd/objects#statusloguser"><code>StatusLogUser</code></a>
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
<a href="/api-reference/bsdd/scalars#id"><code>ID</code></a>
</td>
<td>
<p>Identifiant du BSD</p>
</td>
</tr>
<tr>
<td>
readableId<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID</code></a>
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
<a href="/api-reference/bsdd/objects#formsubscription"><code>FormSubscription</code></a>
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
<a href="/api-reference/bsdd/scalars#string"><code>String!</code></a>
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
<a href="/api-reference/bsdd/objects#destination"><code>Destination</code></a>
</td>
<td>
<p>Installation de destination prévue (case 14) à remplir par le producteur ou
le site d&#39;entreposage provisoire</p>
</td>
</tr>
<tr>
<td>
signedAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de signature du BSD suite (case 19)</p>
</td>
</tr>
<tr>
<td>
signedBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom du signataire du BSD suite  (case 19)</p>
</td>
</tr>
<tr>
<td>
temporaryStorer<br />
<a href="/api-reference/bsdd/objects#temporarystorer"><code>TemporaryStorer</code></a>
</td>
<td>
<p>Établissement qui stocke temporairement le déchet (case 13)</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdd/objects#transporter"><code>Transporter</code></a>
</td>
<td>
<p>Transporteur du déchet (case 18)</p>
</td>
</tr>
<tr>
<td>
wasteDetails<br />
<a href="/api-reference/bsdd/objects#wastedetails"><code>WasteDetails</code></a>
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
<a href="/api-reference/bsdd/scalars#float"><code>Float</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantityType<br />
<a href="/api-reference/bsdd/enums#quantitytype"><code>QuantityType</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
receivedAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
receivedBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteAcceptationStatus<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
wasteRefusalReason<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
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
<a href="/api-reference/bsdd/objects#formcompany"><code>FormCompany</code></a>
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

## Transporter

Collecteur - transporteur (case 8)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
company<br />
<a href="/api-reference/bsdd/objects#formcompany"><code>FormCompany</code></a>
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

## TransportSegment



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
mode<br />
<a href="/api-reference/bsdd/enums#transportmode"><code>TransportMode</code></a>
</td>
<td>
<p>Mode de transport</p>
</td>
</tr>
<tr>
<td>
previousTransporterCompanySiret<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Siret du transporteur précédent</p>
</td>
</tr>
<tr>
<td>
readyToTakeOver<br />
<a href="/api-reference/bsdd/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Prêt à être pris en charge</p>
</td>
</tr>
<tr>
<td>
segmentNumber<br />
<a href="/api-reference/bsdd/scalars#int"><code>Int</code></a>
</td>
<td>
<p>Numéro du segment</p>
</td>
</tr>
<tr>
<td>
takenOverAt<br />
<a href="/api-reference/bsdd/scalars#datetime"><code>DateTime</code></a>
</td>
<td>
<p>Date de prise en charge</p>
</td>
</tr>
<tr>
<td>
takenOverBy<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Reponsable de la prise en charge</p>
</td>
</tr>
<tr>
<td>
transporter<br />
<a href="/api-reference/bsdd/objects#transporter"><code>Transporter</code></a>
</td>
<td>
<p>Transporteur du segment</p>
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
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Rubrique déchet au format |<em>|</em>| |<em>|</em>| |<em>|</em>| (*)</p>
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
<blockquote>Deprecated: Utiliser `packagingInfos`</blockquote>

<p>Nombre de colis</p>
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
<blockquote>Deprecated: Utiliser `packagingInfos`</blockquote>

<p>Autre packaging (préciser)</p>
</td>
</tr>
<tr>
<td>
packagingInfos<br />
<a href="/api-reference/bsdd/objects#packaginginfo"><code>[PackagingInfo!]</code></a>
</td>
<td>
<p>Conditionnements</p>
</td>
</tr>
<tr>
<td>
packagings<br />
<a href="/api-reference/bsdd/enums#packagings"><code>[Packagings!]</code></a>
</td>
<td>
<blockquote>Deprecated: Utiliser `packagingInfos`</blockquote>

<p>Conditionnement</p>
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

## WorkSite

Informations sur une adresse chantier

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

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

