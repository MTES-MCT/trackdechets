---
id: mutations
title: Mutations
slug: mutations
---

## createForm

**Type:** [Form!](/api-reference/bsdd/objects#form)

Crée un nouveau bordereau

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
createFormInput<br />
<a href="/api-reference/bsdd/inputObjects#createforminput"><code>CreateFormInput!</code></a>
</td>
<td>
<p>Payload de création d&#39;un bordereau</p>
</td>
</tr>
</tbody>
</table>

## deleteForm

**Type:** [Form](/api-reference/bsdd/objects#form)

Supprime un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
</tbody>
</table>

## duplicateForm

**Type:** [Form](/api-reference/bsdd/objects#form)

Duplique un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
</tbody>
</table>

## editSegment

**Type:** [TransportSegment](/api-reference/bsdd/objects#transportsegment)

Édite un segment existant

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
nextSegmentInfo<br />
<a href="/api-reference/bsdd/inputObjects#nextsegmentinfoinput"><code>NextSegmentInfoInput!</code></a>
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

## importPaperForm

**Type:** [Form](/api-reference/bsdd/objects#form)

Permet d'importer les informations d'un BSD papier dans Trackdéchet après la réalisation de l'opération
de traitement. Le BSD signé papier original doit être conservé à l'installation de destination qui doit
être en mesure de retrouver le bordereau papier correspondant à un bordereau numérique. Le champ `customId`
de l'input peut-être utilisé pour faire le lien.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
input<br />
<a href="/api-reference/bsdd/inputObjects#importpaperforminput"><code>ImportPaperFormInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## markAsAccepted

**Type:** [Form](/api-reference/bsdd/objects#form)

Valide l'acceptation du BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
acceptedInfo<br />
<a href="/api-reference/bsdd/inputObjects#acceptedforminput"><code>AcceptedFormInput!</code></a>
</td>
<td>
<p>Informations liées à l&#39;arrivée</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
</tbody>
</table>

## markAsProcessed

**Type:** [Form](/api-reference/bsdd/objects#form)

Valide le traitement d'un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
<tr>
<td>
processedInfo<br />
<a href="/api-reference/bsdd/inputObjects#processedforminput"><code>ProcessedFormInput!</code></a>
</td>
<td>
<p>Informations liées au traitement</p>
</td>
</tr>
</tbody>
</table>

## markAsReceived

**Type:** [Form](/api-reference/bsdd/objects#form)

Valide la réception d'un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
<tr>
<td>
receivedInfo<br />
<a href="/api-reference/bsdd/inputObjects#receivedforminput"><code>ReceivedFormInput!</code></a>
</td>
<td>
<p>Informations liées à la réception</p>
</td>
</tr>
</tbody>
</table>

## markAsResealed

**Type:** [Form](/api-reference/bsdd/objects#form)

Valide la complétion des cadres 14 à 19 lors d'un entreposage provisoire ou reconditionnement

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
resealedInfos<br />
<a href="/api-reference/bsdd/inputObjects#resealedforminput"><code>ResealedFormInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## markAsResent

**Type:** [Form](/api-reference/bsdd/objects#form)

Valide l'envoi du BSD après un entreposage provisoire ou reconditionnement

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
resentInfos<br />
<a href="/api-reference/bsdd/inputObjects#resentforminput"><code>ResentFormInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## markAsSealed

**Type:** [Form](/api-reference/bsdd/objects#form)

Finalise un BSD
Les champs suivants sont obligatoires pour pouvoir finaliser un bordereau et
doivent avoir été renseignés au préalable

```
emitter: {
  type
  company: {
    siret
    name
    address
    contact
    phone
    mail
  }
}
recipient: {
  processingOperation
  company: {
    siret
    name
    address
    contact
    phone
    mail
  }
}
transporter: {
  company: {
    siret
    name
    address
    contact
    mail
    phone
  }
  receipt
  department
  validityLimit
  numberPlate
}
wasteDetails: {
  code
  // onuCode est optionnel pour les déchets non-dangereux
  onuCode
  name
  packagings
  numberOfPackages
  quantity
  quantityType
  consistence
}
```

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
</tbody>
</table>

## markAsSent

**Type:** [Form](/api-reference/bsdd/objects#form)

Valide l'envoi d'un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
<tr>
<td>
sentInfo<br />
<a href="/api-reference/bsdd/inputObjects#sentforminput"><code>SentFormInput!</code></a>
</td>
<td>
<p>Informations liées à l&#39;envoi</p>
</td>
</tr>
</tbody>
</table>

## markAsTempStored

**Type:** [Form](/api-reference/bsdd/objects#form)

Valide la réception d'un BSD d'un entreposage provisoire ou reconditionnement

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
tempStoredInfos<br />
<a href="/api-reference/bsdd/inputObjects#tempstoredforminput"><code>TempStoredFormInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## markAsTempStorerAccepted

**Type:** [Form](/api-reference/bsdd/objects#form)

Valide l'acceptation ou le refus d'un BSD d'un entreposage provisoire ou reconditionnement

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
tempStorerAcceptedInfo<br />
<a href="/api-reference/bsdd/inputObjects#tempstoreracceptedforminput"><code>TempStorerAcceptedFormInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## markSegmentAsReadyToTakeOver

**Type:** [TransportSegment](/api-reference/bsdd/objects#transportsegment)

Marque un segment de transport comme prêt à être emporté

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
</tbody>
</table>

## prepareSegment

**Type:** [TransportSegment](/api-reference/bsdd/objects#transportsegment)

Prépare un nouveau segment de transport multimodal

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
nextSegmentInfo<br />
<a href="/api-reference/bsdd/inputObjects#nextsegmentinfoinput"><code>NextSegmentInfoInput!</code></a>
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

## saveForm

**Type:** [Form](/api-reference/bsdd/objects#form)

DEPRECATED - Sauvegarde un BSD (création ou modification, si `FormInput` contient un ID)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
formInput<br />
<a href="/api-reference/bsdd/inputObjects#forminput"><code>FormInput!</code></a>
</td>
<td>
<p>Payload du BSD</p>
</td>
</tr>
</tbody>
</table>

## signedByTransporter

**Type:** [Form](/api-reference/bsdd/objects#form)

Permet de transférer le déchet à un transporteur lors de la collecte initiale (signatures en case 8 et 9)
ou après une étape d'entreposage provisoire ou de reconditionnement (signatures en case 18 et 19).
Cette mutation doit être appelée avec le token du collecteur-transporteur.
L'établissement émetteur (resp. d'entreposage provisoire ou de reconditionnement) est authentifié quant à lui
grâce à son code de signature disponible sur le tableau de bord Trackdéchets (Mon Compte > Établissements > Sécurité).
D'un point de vue pratique, cela implique qu'un responsable de l'établissement émetteur (resp. d'entreposage provisoire ou de reconditionnement)
renseigne le code de signature sur le terminal du collecteur-transporteur.
Dans le cas où un éco-organisme figure sur le BSD, il est également possible de signer avec son code plutôt que celui de l'émetteur.
Il faut alors fournir le code de l'éco-organisme en indiquant qu'il est l'auteur de la signature (signingInfo.signatureAuthor doit valoir ECO_ORGANISME).

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
<tr>
<td>
signingInfo<br />
<a href="/api-reference/bsdd/inputObjects#transportersignatureforminput"><code>TransporterSignatureFormInput!</code></a>
</td>
<td>
<p>Informations liées aux signatures transporteur et émetteur (case 8 et 9)</p>
</td>
</tr>
</tbody>
</table>

## takeOverSegment

**Type:** [TransportSegment](/api-reference/bsdd/objects#transportsegment)

Marque un segment comme pris en charge par le nouveau transporteur

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
takeOverInfo<br />
<a href="/api-reference/bsdd/inputObjects#takeoverinput"><code>TakeOverInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateForm

**Type:** [Form!](/api-reference/bsdd/objects#form)

Met à jour un bordereau existant

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
updateFormInput<br />
<a href="/api-reference/bsdd/inputObjects#updateforminput"><code>UpdateFormInput!</code></a>
</td>
<td>
<p>Payload de mise à jour d&#39;un bordereau</p>
</td>
</tr>
</tbody>
</table>

## updateTransporterFields

**Type:** [Form](/api-reference/bsdd/objects#form)

Met à jour la plaque d'immatriculation ou le champ libre du transporteur

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsdd/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
<tr>
<td>
transporterCustomInfo<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Champ libre, utilisable par exemple pour noter les tournées des transporteurs</p>
</td>
</tr>
<tr>
<td>
transporterNumberPlate<br />
<a href="/api-reference/bsdd/scalars#string"><code>String</code></a>
</td>
<td>
<p>Plaque d&#39;immatriculation du transporteur</p>
</td>
</tr>
</tbody>
</table>

