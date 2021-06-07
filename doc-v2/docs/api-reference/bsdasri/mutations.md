---
id: mutations
title: Mutations
slug: mutations
---

## createBsdasri

**Type:** [Bsdasri!](/api-reference/bsdasri/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un nouveau dasri

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
bsdasriCreateInput<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasricreateinput"><code>BsdasriCreateInput!</code></a>
</td>
<td>
<p>Payload de création d&#39;un dasri</p>
</td>
</tr>
</tbody>
</table>

## createDraftBsdasri

**Type:** [Bsdasri!](/api-reference/bsdasri/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un nouveau dasri en brouillon

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
bsdasriCreateInput<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasricreateinput"><code>BsdasriCreateInput!</code></a>
</td>
<td>
<p>Payload de création d&#39;un dasri brouillon</p>
</td>
</tr>
</tbody>
</table>

## deleteBsdasri

**Type:** [Bsdasri](/api-reference/bsdasri/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Supprime un BSDASRI

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsdasri/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un Dasri</p>
</td>
</tr>
</tbody>
</table>

## duplicateBsdasri

**Type:** [Bsdasri](/api-reference/bsdasri/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Duplique un bordereau Dasri

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsdasri/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un Bsdasri</p>
</td>
</tr>
</tbody>
</table>

## publishBsdasri

**Type:** [Bsdasri](/api-reference/bsdasri/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Marque un dasri brouillon comme publié (isDraft=false)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsdasri/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un Bsdasri</p>
</td>
</tr>
</tbody>
</table>

## signBsdasri

**Type:** [Bsdasri](/api-reference/bsdasri/objects#bsdasri)

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
<a href="/api-reference/bsdasri/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signatureInput<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrisignatureinput"><code>BsdasriSignatureInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## signBsdasriEmissionWithSecretCode

**Type:** [Bsdasri](/api-reference/bsdasri/objects#bsdasri)

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
<a href="/api-reference/bsdasri/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signatureInput<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasrisignaturewithsecretcodeinput"><code>BsdasriSignatureWithSecretCodeInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateBsdasri

**Type:** [Bsdasri!](/api-reference/bsdasri/objects#bsdasri)

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
<a href="/api-reference/bsdasri/inputObjects#bsdasriupdateinput"><code>BsdasriUpdateInput!</code></a>
</td>
<td>
<p>Payload de mise à jour d&#39;un dasri</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/bsdasri/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Identifiant unique du bordereau</p>
</td>
</tr>
</tbody>
</table>

