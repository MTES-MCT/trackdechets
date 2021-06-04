---
id: enums
title: Enums
slug: enums
---

## CompanyType

Profil entreprise

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>BROKER</td>
<td>
<p>Courtier</p>
</td>
</tr>
<tr>
<td>COLLECTOR</td>
<td>
<p>Installation de Transit, regroupement ou tri de déchets</p>
</td>
</tr>
<tr>
<td>ECO_ORGANISME</td>
<td>
<p>Éco-organisme</p>
</td>
</tr>
<tr>
<td>PRODUCER</td>
<td>
<p>Producteur de déchet</p>
</td>
</tr>
<tr>
<td>TRADER</td>
<td>
<p>Négociant</p>
</td>
</tr>
<tr>
<td>TRANSPORTER</td>
<td>
<p>Transporteur</p>
</td>
</tr>
<tr>
<td>WASTE_CENTER</td>
<td>
<p>Installation de collecte de déchets apportés par le producteur initial</p>
</td>
</tr>
<tr>
<td>WASTE_VEHICLES</td>
<td>
<p>Installation de traitement de VHU (casse automobile et/ou broyeur agréé)</p>
</td>
</tr>
<tr>
<td>WASTEPROCESSOR</td>
<td>
<p>Installation de traitement</p>
</td>
</tr>
</tbody>
</table>

## CompanyVerificationStatus

État du processus de vérification de l'établissement

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>LETTER_SENT</td>
<td>
<p>Les vérifications manuelles n&#39;ont pas abouties, une lettre a été envoyée à l&#39;adresse enregistrée
auprès du registre du commerce et des sociétés</p>
</td>
</tr>
<tr>
<td>TO_BE_VERIFIED</td>
<td>
<p>L&#39;établissement vient d&#39;être crée, en attente de vérifications manuelles par l&#39;équipe Trackdéchets</p>
</td>
</tr>
<tr>
<td>VERIFIED</td>
<td>
<p>L&#39;établissement est vérifié</p>
</td>
</tr>
</tbody>
</table>

## GerepType

Type d'une déclaration GEREP

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>Producteur</td>
<td>

</td>
</tr>
<tr>
<td>Traiteur</td>
<td>

</td>
</tr>
</tbody>
</table>

## MembershipRequestStatus

Différents statuts possibles pour une demande de rattachement
à un établissement

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>ACCEPTED</td>
<td>

</td>
</tr>
<tr>
<td>PENDING</td>
<td>

</td>
</tr>
<tr>
<td>REFUSED</td>
<td>

</td>
</tr>
</tbody>
</table>

## UserRole

Liste les différents rôles d'un utilisateur au sein
d'un établissement.

Les admins peuvent:
* consulter/éditer les bordereaux
* gérer les utilisateurs de l'établissement
* éditer les informations de la fiche entreprise
* demander le renouvellement du code de signature
* Éditer les informations de la fiche entreprise

Les membres peuvent:
* consulter/éditer les bordereaux
* consulter le reste des informations

Vous pouvez consulter [cette page](https://docs.google.com/spreadsheets/d/12K9Bd2k5l4uqXhS0h5uI00lNEzW7C-1t-NDOyxy8aKk/edit#gid=0)
pour le détail de chacun des rôles

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>ADMIN</td>
<td>

</td>
</tr>
<tr>
<td>MEMBER</td>
<td>

</td>
</tr>
</tbody>
</table>

## WasteType

Type de déchets autorisé pour une rubrique

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>DANGEROUS</td>
<td>
<p>Déchet dangereux</p>
</td>
</tr>
<tr>
<td>INERTE</td>
<td>
<p>Déchet inerte</p>
</td>
</tr>
<tr>
<td>NOT_DANGEROUS</td>
<td>
<p>Déchet non dangereux</p>
</td>
</tr>
</tbody>
</table>

