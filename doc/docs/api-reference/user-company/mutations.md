---
id: mutations
title: Mutations
slug: mutations
---

## login

**Type:** [AuthPayload!](/api-reference/user-company/objects#authpayload)

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
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
password<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## sendMembershipRequest

**Type:** [MembershipRequest](/api-reference/user-company/objects#membershiprequest)

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
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

