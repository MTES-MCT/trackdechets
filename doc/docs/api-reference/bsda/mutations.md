---
id: mutations
title: Mutations
slug: mutations
---

## createBsda

**Type:** [Bsda](/api-reference/bsda/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un Bsda

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
input<br />
<a href="/api-reference/bsda/inputObjects#bsdainput"><code>BsdaInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createDraftBsda

**Type:** [Bsda](/api-reference/bsda/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Crée un Bsda en brouillon

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
input<br />
<a href="/api-reference/bsda/inputObjects#bsdainput"><code>BsdaInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## duplicateBsda

**Type:** [Bsda](/api-reference/bsda/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Duplique un Bsda

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsda/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>ID d&#39;un BSD</p>
</td>
</tr>
</tbody>
</table>

## publishBsda

**Type:** [Bsda](/api-reference/bsda/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Permet de publier un brouillon pour le marquer comme prêt à être envoyé

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsda/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## signBsda

**Type:** [Bsda](/api-reference/bsda/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Signe un Bsda

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsda/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
input<br />
<a href="/api-reference/bsda/inputObjects#bsdasignatureinput"><code>BsdaSignatureInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateBsda

**Type:** [Bsda](/api-reference/bsda/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Met à jour un Bsda

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsda/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
input<br />
<a href="/api-reference/bsda/inputObjects#bsdainput"><code>BsdaInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

