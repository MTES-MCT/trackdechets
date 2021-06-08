---
id: mutations
title: Mutations
slug: mutations
---

## createBsvhu

**Type:** [Bsvhu](/api-reference/bsvhu/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un BSVHU

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
input<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuinput"><code>BsvhuInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createDraftBsvhu

**Type:** [Bsvhu](/api-reference/bsvhu/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un BSVHU en brouillon

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
input<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuinput"><code>BsvhuInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## deleteBsvhu

**Type:** [Bsvhu](/api-reference/bsvhu/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Supprime un BSVHU

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsvhu/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD VHU</p>
</td>
</tr>
</tbody>
</table>

## duplicateBsvhu

**Type:** [Bsvhu](/api-reference/bsvhu/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Duplique un BSVHU

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsvhu/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD VHU</p>
</td>
</tr>
</tbody>
</table>

## publishBsvhu

**Type:** [Bsvhu](/api-reference/bsvhu/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Permet de publier un brouillon pour le marquer comme prêt à être envoyé

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsvhu/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## signBsvhu

**Type:** [Bsvhu](/api-reference/bsvhu/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Signe un BSVHU

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsvhu/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
input<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhusignatureinput"><code>BsvhuSignatureInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateBsvhu

**Type:** [Bsvhu](/api-reference/bsvhu/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Met à jour un BSVHU

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsvhu/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
input<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuinput"><code>BsvhuInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

