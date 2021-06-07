---
id: queries
title: Queries
slug: queries
---

## bsdasri

**Type:** [Bsdasri!](/api-reference/bsdasri/objects#bsdasri)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production

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
<p>Identifiant du BSD</p>
</td>
</tr>
</tbody>
</table>

## bsdasriPdf

**Type:** [FileDownload!](/api-reference/bsdasri/objects#filedownload)

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
<a href="/api-reference/bsdasri/scalars#id"><code>ID</code></a>
</td>
<td>
<p>ID d&#39;un bordereau</p>
</td>
</tr>
</tbody>
</table>

## bsdasris

**Type:** [BsdasriConnection!](/api-reference/bsdasri/objects#bsdasriconnection)

EXPERIMENTAL - Ne pas utiliser dans un contexte de production
Renvoie les Bsdasris.
Par défaut, les dasris des différentes companies de l'utilisateur sont renvoyés.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
after<br />
<a href="/api-reference/bsdasri/scalars#id"><code>ID</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>first</code> de paginer &quot;en avant&quot;
(des Bsdasri les plus récents aux Bsdasri les plus anciens)
Curseur après lequel les Bsdasri doivent être retournés
Attend un identifiant (propriété <code>id</code>) de BSD
Défaut à vide, pour retourner les Bsdasri les plus récents.
Le BSD précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
before<br />
<a href="/api-reference/bsdasri/scalars#id"><code>ID</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>last</code> de paginer &quot;en arrière&quot;
(des Bsdasri les plus anciens aux Bsdasris les plus récents)
Curseur avant lequel les Bsdasri doivent être retournés
Attend un identifiant (propriété <code>id</code>) de BSD
Défaut à vide, pour retourner les Bsdasri les plus anciens
Le BSD précisé dans le curseur ne fait pas partie du résultat</p>
</td>
</tr>
<tr>
<td>
first<br />
<a href="/api-reference/bsdasri/scalars#int"><code>Int</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Permet en conjonction avec <code>after</code> de paginer &quot;en avant&quot;
(des Bsdasri les plus récents aux Bsdasri les plus anciens)
Nombre de Bsdasri retournés après le <code>cursorAfter</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
last<br />
<a href="/api-reference/bsdasri/scalars#int"><code>Int</code></a>
</td>
<td>
<p>(Optionnel) PAGINATION
Nombre de Bsdasri retournés avant le <code>before</code>
Défaut à 50, maximum à 500</p>
</td>
</tr>
<tr>
<td>
where<br />
<a href="/api-reference/bsdasri/inputObjects#bsdasriwhere"><code>BsdasriWhere</code></a>
</td>
<td>
<p>Filtres de recherche</p>
</td>
</tr>
</tbody>
</table>

