---
id: queries
title: Queries
slug: queries
---

## bsvhu

**Type:** [Bsvhu!](/api-reference/bsvhu/objects#bsvhu)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production

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

## bsvhuPdf

**Type:** [FileDownload!](/api-reference/bsvhu/objects#filedownload)

Renvoie un token pour télécharger un pdf de bordereau
Ce token doit être transmis à la route /download pour obtenir le fichier.
Il est valable 10 secondes

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api-reference/bsvhu/scalars#id"><code>ID</code></a>
</td>
<td>
<p>ID d&#39;un bordereau</p>
</td>
</tr>
</tbody>
</table>

## bsvhus

**Type:** [BsvhuConnection!](/api-reference/bsvhu/objects#bsvhuconnection)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Tous les arguments sont optionnels.
Par défaut, retourne les 50 premiers bordereaux associés à entreprises dont vous êtes membres

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
after<br />
<a href="/api-reference/bsvhu/scalars#id"><code>ID</code></a>
</td>
<td>
<p>PAGINATION
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
<a href="/api-reference/bsvhu/scalars#id"><code>ID</code></a>
</td>
<td>
<p>PAGINATION
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
<a href="/api-reference/bsvhu/scalars#int"><code>Int</code></a>
</td>
<td>
<p>PAGINATION
Permet en conjonction avec <code>cursorAfter</code> de paginer &quot;en avant&quot;
(des bordereaux les plus récents aux bordereaux les plus anciens)
Nombre de bordereaux retournés après le <code>cursorAfter</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
last<br />
<a href="/api-reference/bsvhu/scalars#int"><code>Int</code></a>
</td>
<td>
<p>PAGINATION
Nombre de bordereaux retournés avant le <code>cursorBefore</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
where<br />
<a href="/api-reference/bsvhu/inputObjects#bsvhuwhere"><code>BsvhuWhere</code></a>
</td>
<td>
<p>Filtres</p>
</td>
</tr>
</tbody>
</table>

