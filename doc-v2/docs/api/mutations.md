---
id: mutations
title: Mutations
slug: mutations
---

## addFicheInterventionBsff

**Type:** [BsffFicheIntervention!](/api/objects#bsffficheintervention)

Mutation permettant d'ajouter une fiche d'intervention à un bordereau existant.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
input<br />
<a href="/api/inputObjects#bsffficheinterventioninput"><code>BsffFicheInterventionInput!</code></a>
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
</tbody>
</table>

## createBsda

**Type:** [Bsda](/api/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un Bsda

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
input<br />
<a href="/api/inputObjects#bsdainput"><code>BsdaInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createBsdasri

**Type:** [Bsdasri!](/api/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un nouveau dasri

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
bsdasriCreateInput<br />
<a href="/api/inputObjects#bsdasricreateinput"><code>BsdasriCreateInput!</code></a>
</td>
<td>
<p>Payload de création d&#39;un dasri</p>
</td>
</tr>
</tbody>
</table>

## createBsff

**Type:** [Bsff!](/api/objects#bsff)

Mutation permettant de créer un nouveau bordereau de suivi de fluides frigorigènes.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
input<br />
<a href="/api/inputObjects#bsffinput"><code>BsffInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createBsvhu

**Type:** [Bsvhu](/api/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un BSVHU

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
input<br />
<a href="/api/inputObjects#bsvhuinput"><code>BsvhuInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createDraftBsda

**Type:** [Bsda](/api/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un Bsda en brouillon

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
input<br />
<a href="/api/inputObjects#bsdainput"><code>BsdaInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createDraftBsdasri

**Type:** [Bsdasri!](/api/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un nouveau dasri en brouillon

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
bsdasriCreateInput<br />
<a href="/api/inputObjects#bsdasricreateinput"><code>BsdasriCreateInput!</code></a>
</td>
<td>
<p>Payload de création d&#39;un dasri brouillon</p>
</td>
</tr>
</tbody>
</table>

## createDraftBsvhu

**Type:** [Bsvhu](/api/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un BSVHU en brouillon

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
input<br />
<a href="/api/inputObjects#bsvhuinput"><code>BsvhuInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createForm

**Type:** [Form!](/api/objects#form)

Crée un nouveau bordereau

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
createFormInput<br />
<a href="/api/inputObjects#createforminput"><code>CreateFormInput!</code></a>
</td>
<td>
<p>Payload de création d&#39;un bordereau</p>
</td>
</tr>
</tbody>
</table>

## deleteBsdasri

**Type:** [Bsdasri](/api/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Supprime un BSDASRI

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un Dasri</p>
</td>
</tr>
</tbody>
</table>

## deleteBsff

**Type:** [Bsff!](/api/objects#bsff)

Mutation permettant de supprimer un bordereau existant de suivi de fluides frigorigènes.
À condition qu'il n'ait pas encore été signé.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
</tbody>
</table>

## deleteBsvhu

**Type:** [Bsvhu](/api/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Supprime un BSVHU

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD VHU</p>
</td>
</tr>
</tbody>
</table>

## deleteFicheInterventionBsff

**Type:** [BsffFicheIntervention!](/api/objects#bsffficheintervention)

Mutation permettant de supprimer une fiche d'intervention lié à un bordereau existant.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
numero<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## deleteForm

**Type:** [Form](/api/objects#form)

Supprime un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
</tbody>
</table>

## duplicateBsda

**Type:** [Bsda](/api/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Duplique un Bsda

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
</tbody>
</table>

## duplicateBsdasri

**Type:** [Bsdasri](/api/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Duplique un bordereau Dasri

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un Bsdasri</p>
</td>
</tr>
</tbody>
</table>

## duplicateBsvhu

**Type:** [Bsvhu](/api/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Duplique un BSVHU

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD VHU</p>
</td>
</tr>
</tbody>
</table>

## duplicateForm

**Type:** [Form](/api/objects#form)

Duplique un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
</tbody>
</table>

## editSegment

**Type:** [TransportSegment](/api/objects#transportsegment)

Édite un segment existant

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
nextSegmentInfo<br />
<a href="/api/inputObjects#nextsegmentinfoinput"><code>NextSegmentInfoInput!</code></a>
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

## importPaperForm

**Type:** [Form](/api/objects#form)

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
<a href="/api/inputObjects#importpaperforminput"><code>ImportPaperFormInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## login

**Type:** [AuthPayload!](/api/objects#authpayload)

DEPRECATED - La récupération de token pour le compte de tiers
doit s'effectuer avec le protocole OAuth2

Récupére un token à partir de l'email et du mot de passe
d'un utilisateur.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
email<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
password<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## markAsAccepted

**Type:** [Form](/api/objects#form)

Valide l'acceptation du BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
acceptedInfo<br />
<a href="/api/inputObjects#acceptedforminput"><code>AcceptedFormInput!</code></a>
</td>
<td>
<p>Informations liées à l&#39;arrivée</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
</tbody>
</table>

## markAsProcessed

**Type:** [Form](/api/objects#form)

Valide le traitement d'un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
<tr>
<td>
processedInfo<br />
<a href="/api/inputObjects#processedforminput"><code>ProcessedFormInput!</code></a>
</td>
<td>
<p>Informations liées au traitement</p>
</td>
</tr>
</tbody>
</table>

## markAsReceived

**Type:** [Form](/api/objects#form)

Valide la réception d'un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
<tr>
<td>
receivedInfo<br />
<a href="/api/inputObjects#receivedforminput"><code>ReceivedFormInput!</code></a>
</td>
<td>
<p>Informations liées à la réception</p>
</td>
</tr>
</tbody>
</table>

## markAsResealed

**Type:** [Form](/api/objects#form)

Valide la complétion des cadres 14 à 19 lors d'un entreposage provisoire ou reconditionnement

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
resealedInfos<br />
<a href="/api/inputObjects#resealedforminput"><code>ResealedFormInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## markAsResent

**Type:** [Form](/api/objects#form)

Valide l'envoi du BSD après un entreposage provisoire ou reconditionnement

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
resentInfos<br />
<a href="/api/inputObjects#resentforminput"><code>ResentFormInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## markAsSealed

**Type:** [Form](/api/objects#form)

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
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
</tbody>
</table>

## markAsSent

**Type:** [Form](/api/objects#form)

Valide l'envoi d'un BSD

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
<tr>
<td>
sentInfo<br />
<a href="/api/inputObjects#sentforminput"><code>SentFormInput!</code></a>
</td>
<td>
<p>Informations liées à l&#39;envoi</p>
</td>
</tr>
</tbody>
</table>

## markAsTempStored

**Type:** [Form](/api/objects#form)

Valide la réception d'un BSD d'un entreposage provisoire ou reconditionnement

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
tempStoredInfos<br />
<a href="/api/inputObjects#tempstoredforminput"><code>TempStoredFormInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## markAsTempStorerAccepted

**Type:** [Form](/api/objects#form)

Valide l'acceptation ou le refus d'un BSD d'un entreposage provisoire ou reconditionnement

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
tempStorerAcceptedInfo<br />
<a href="/api/inputObjects#tempstoreracceptedforminput"><code>TempStorerAcceptedFormInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## markSegmentAsReadyToTakeOver

**Type:** [TransportSegment](/api/objects#transportsegment)

Marque un segment de transport comme prêt à être emporté

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
</tbody>
</table>

## prepareSegment

**Type:** [TransportSegment](/api/objects#transportsegment)

Prépare un nouveau segment de transport multimodal

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
nextSegmentInfo<br />
<a href="/api/inputObjects#nextsegmentinfoinput"><code>NextSegmentInfoInput!</code></a>
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

## publishBsda

**Type:** [Bsda](/api/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Permet de publier un brouillon pour le marquer comme prêt à être envoyé

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
</tbody>
</table>

## publishBsdasri

**Type:** [Bsdasri](/api/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Marque un dasri brouillon comme publié (isDraft=false)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un Bsdasri</p>
</td>
</tr>
</tbody>
</table>

## publishBsvhu

**Type:** [Bsvhu](/api/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Permet de publier un brouillon pour le marquer comme prêt à être envoyé

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
</tbody>
</table>

## saveForm

**Type:** [Form](/api/objects#form)

DEPRECATED - Sauvegarde un BSD (création ou modification, si `FormInput` contient un ID)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
formInput<br />
<a href="/api/inputObjects#forminput"><code>FormInput!</code></a>
</td>
<td>
<p>Payload du BSD</p>
</td>
</tr>
</tbody>
</table>

## sendMembershipRequest

**Type:** [MembershipRequest](/api/objects#membershiprequest)

Envoie une demande de rattachement de l'utilisateur courant
à rejoindre l'établissement dont le siret est précisé en paramètre.
Cette demande est communiquée à l'ensemble des administrateurs de
l'établissement qui ont le choix de l'accepter ou de la refuser.

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

## signBsda

**Type:** [Bsda](/api/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Signe un Bsda

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
input<br />
<a href="/api/inputObjects#bsdasignatureinput"><code>BsdaSignatureInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## signBsdasri

**Type:** [Bsdasri](/api/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Appose une signature sur un Bsdasri, verrouille les cadres correspondant

Une signature ne peut être apposée que par un membre de l'entreprise figurant sur le cadre concerné
Ex: la signature TRANSPORT ne peut être apposée que par un membre de l'entreprise de transport

Pour signer l'emission avec un compte transpoteur (cas de lasignature sur device transporteur),
utiliser la mutation signBsdasriEmissionWithSecretCode

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
signatureInput<br />
<a href="/api/inputObjects#bsdasrisignatureinput"><code>BsdasriSignatureInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## signBsdasriEmissionWithSecretCode

**Type:** [Bsdasri](/api/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Appose une signature de type EMISSION via un compte n'appartenant pas à l'émetteur.
Permet de signer un enlèvement sur le device transporteur grâce au code de sécurité de l'émetteur du dasri

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
signatureInput<br />
<a href="/api/inputObjects#bsdasrisignaturewithsecretcodeinput"><code>BsdasriSignatureWithSecretCodeInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## signBsff

**Type:** [Bsff!](/api/objects#bsff)

Mutation permettant d'apposer une signature sur le bordereau.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
securityCode<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api/inputObjects#signatureinput"><code>SignatureInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#bsffsignaturetype"><code>BsffSignatureType!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## signBsvhu

**Type:** [Bsvhu](/api/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Signe un BSVHU

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
input<br />
<a href="/api/inputObjects#bsvhusignatureinput"><code>BsvhuSignatureInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## signedByTransporter

**Type:** [Form](/api/objects#form)

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
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
<tr>
<td>
signingInfo<br />
<a href="/api/inputObjects#transportersignatureforminput"><code>TransporterSignatureFormInput!</code></a>
</td>
<td>
<p>Informations liées aux signatures transporteur et émetteur (case 8 et 9)</p>
</td>
</tr>
</tbody>
</table>

## takeOverSegment

**Type:** [TransportSegment](/api/objects#transportsegment)

Marque un segment comme pris en charge par le nouveau transporteur

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
takeOverInfo<br />
<a href="/api/inputObjects#takeoverinput"><code>TakeOverInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateBsda

**Type:** [Bsda](/api/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Met à jour un Bsda

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
input<br />
<a href="/api/inputObjects#bsdainput"><code>BsdaInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateBsdasri

**Type:** [Bsdasri!](/api/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Met à jour un dasri existant
Par défaut, tous les champs sont modifiables.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
bsdasriUpdateInput<br />
<a href="/api/inputObjects#bsdasriupdateinput"><code>BsdasriUpdateInput!</code></a>
</td>
<td>
<p>Payload de mise à jour d&#39;un dasri</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Identifiant unique du bordereau</p>
</td>
</tr>
</tbody>
</table>

## updateBsff

**Type:** [Bsff!](/api/objects#bsff)

Mutation permettant de modifier un bordereau existant de suivi de fluides frigorigènes.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
input<br />
<a href="/api/inputObjects#bsffinput"><code>BsffInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateBsvhu

**Type:** [Bsvhu](/api/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Met à jour un BSVHU

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
input<br />
<a href="/api/inputObjects#bsvhuinput"><code>BsvhuInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateFicheInterventionBsff

**Type:** [BsffFicheIntervention!](/api/objects#bsffficheintervention)

Mutation permettant de mettre à jour une fiche d'intervention lié à un bordereau existant.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

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
input<br />
<a href="/api/inputObjects#bsffficheinterventioninput"><code>BsffFicheInterventionInput!</code></a>
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
</tbody>
</table>

## updateForm

**Type:** [Form!](/api/objects#form)

Met à jour un bordereau existant

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
updateFormInput<br />
<a href="/api/inputObjects#updateforminput"><code>UpdateFormInput!</code></a>
</td>
<td>
<p>Payload de mise à jour d&#39;un bordereau</p>
</td>
</tr>
</tbody>
</table>

## updateTransporterFields

**Type:** [Form](/api/objects#form)

Met à jour la plaque d'immatriculation ou le champ libre du transporteur

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
<tr>
<td>
transporterCustomInfo<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Champ libre, utilisable par exemple pour noter les tournées des transporteurs</p>
</td>
</tr>
<tr>
<td>
transporterNumberPlate<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>Plaque d&#39;immatriculation du transporteur</p>
</td>
</tr>
</tbody>
</table>

