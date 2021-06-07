---
id: mutations
title: Mutations
slug: mutations
---

## addFicheInterventionBsff

**Type:** [BsffFicheIntervention!](/api-reference/bsff/objects#bsffficheintervention)

Mutation permettant d'ajouter une fiche d'intervention à un bordereau existant.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsff/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
input<br />
<a href="/api-reference/bsff/inputObjects#bsffficheinterventioninput"><code>BsffFicheInterventionInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
numero<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createBsff

**Type:** [Bsff!](/api-reference/bsff/objects#bsff)

Mutation permettant de créer un nouveau bordereau de suivi de fluides frigorigènes.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
input<br />
<a href="/api-reference/bsff/inputObjects#bsffinput"><code>BsffInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## deleteBsff

**Type:** [Bsff!](/api-reference/bsff/objects#bsff)

Mutation permettant de supprimer un bordereau existant de suivi de fluides frigorigènes.
À condition qu'il n'ait pas encore été signé.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsff/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## deleteFicheInterventionBsff

**Type:** [BsffFicheIntervention!](/api-reference/bsff/objects#bsffficheintervention)

Mutation permettant de supprimer une fiche d'intervention lié à un bordereau existant.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsff/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
numero<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## signBsff

**Type:** [Bsff!](/api-reference/bsff/objects#bsff)

Mutation permettant d'apposer une signature sur le bordereau.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsff/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
securityCode<br />
<a href="/api-reference/bsff/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
signature<br />
<a href="/api-reference/bsff/inputObjects#signatureinput"><code>SignatureInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api-reference/bsff/enums#bsffsignaturetype"><code>BsffSignatureType!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateBsff

**Type:** [Bsff!](/api-reference/bsff/objects#bsff)

Mutation permettant de modifier un bordereau existant de suivi de fluides frigorigènes.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsff/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
input<br />
<a href="/api-reference/bsff/inputObjects#bsffinput"><code>BsffInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateFicheInterventionBsff

**Type:** [BsffFicheIntervention!](/api-reference/bsff/objects#bsffficheintervention)

Mutation permettant de mettre à jour une fiche d'intervention lié à un bordereau existant.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsff/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
input<br />
<a href="/api-reference/bsff/inputObjects#bsffficheinterventioninput"><code>BsffFicheInterventionInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
numero<br />
<a href="/api-reference/bsff/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

