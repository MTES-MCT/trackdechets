---
id: queries
title: Queries
slug: queries
---

## bsda

**Type:** [Bsda!](/api-reference/bsda/objects#bsda)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production

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

## bsdas

**Type:** [BsdaConnection!](/api-reference/bsda/objects#bsdaconnection)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
after<br />
<a href="/api-reference/bsda/scalars#id"><code>ID</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>first</code> de paginer &quot;en avant&quot;
(des bordereaux les plus récents aux bordereaux les plus anciens)
Curseur après lequel les bordereaux doivent être retournés
Attend un identifiant (propriété <code>id</code>) de BSD
Défaut à vide, pour retourner les bordereaux les plus récents
Le BSD précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
before<br />
<a href="/api-reference/bsda/scalars#id"><code>ID</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>last</code> de paginer &quot;en arrière&quot;
(des bordereaux les plus anciens aux bordereaux les plus récents)
Curseur avant lequel les bordereaux doivent être retournés
Attend un identifiant (propriété <code>id</code>) de BSD
Défaut à vide, pour retourner les bordereaux les plus anciens
Le BSD précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
first<br />
<a href="/api-reference/bsda/scalars#int"><code>Int</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>cursorAfter</code> de paginer &quot;en avant&quot;
(des bordereaux les plus récents aux bordereaux les plus anciens)
Nombre de bordereaux retournés après le <code>cursorAfter</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
last<br />
<a href="/api-reference/bsda/scalars#int"><code>Int</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Nombre de bordereaux retournés avant le <code>cursorBefore</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
where<br />
<a href="/api-reference/bsda/inputObjects#bsdawhere"><code>BsdaWhere</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

