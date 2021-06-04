---
id: enums
title: Enums
slug: enums
---

## BsdasriEmitterType

Type d'émetteur

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>COLLECTOR</td>
<td>
<p>Installation de regroupement</p>
</td>
</tr>
<tr>
<td>PRODUCER</td>
<td>
<p>Producteur</p>
</td>
</tr>
</tbody>
</table>

## BsdasriPackagings

Type de packaging du déchet

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>AUTRE</td>
<td>
<p>Autre</p>
</td>
</tr>
<tr>
<td>BOITE_CARTON</td>
<td>
<p>Caisse en carton avec sac en plastique</p>
</td>
</tr>
<tr>
<td>BOITE_PERFORANTS</td>
<td>
<p>Boîtes et Mini-collecteurs pour déchets perforants</p>
</td>
</tr>
<tr>
<td>FUT</td>
<td>
<p>Fûts ou jerrican à usage unique</p>
</td>
</tr>
<tr>
<td>GRAND_EMBALLAGE</td>
<td>
<p>Grand emballage</p>
</td>
</tr>
<tr>
<td>GRV</td>
<td>
<p>Grand récipient pour vrac</p>
</td>
</tr>
</tbody>
</table>

## BsdasriRole



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>EMITTER</td>
<td>
<p>Les Bsdasri dont je suis l&#39;émetteur</p>
</td>
</tr>
<tr>
<td>RECIPIENT</td>
<td>
<p>Les Bsdasri dont je suis la destination de traitement</p>
</td>
</tr>
<tr>
<td>TRANSPORTER</td>
<td>
<p>Les Bsdasri dont je suis transporteur</p>
</td>
</tr>
</tbody>
</table>

## BsdasriSignatureType



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>EMISSION</td>
<td>
<p>Signature du cadre émetteur (PRED)</p>
</td>
</tr>
<tr>
<td>OPERATION</td>
<td>
<p>Signature du traitement du déchet</p>
</td>
</tr>
<tr>
<td>RECEPTION</td>
<td>
<p>Signature de la réception du déchet</p>
</td>
</tr>
<tr>
<td>TRANSPORT</td>
<td>
<p>Signature du cadre collecteur transporteur</p>
</td>
</tr>
</tbody>
</table>

## BsdasriStatus



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>INITIAL</td>
<td>
<p>Bsdasri dans son état initial</p>
</td>
</tr>
<tr>
<td>PROCESSED</td>
<td>
<p>Bsdasri dont les déchets ont été traités</p>
</td>
</tr>
<tr>
<td>RECEIVED</td>
<td>
<p>Bsdasri reçu par l&#39;établissement de destination</p>
</td>
</tr>
<tr>
<td>REFUSED</td>
<td>
<p>Déchet refusé</p>
</td>
</tr>
<tr>
<td>SENT</td>
<td>
<p>Bsdasri envoyé vers l&#39;établissement de destination</p>
</td>
</tr>
<tr>
<td>SIGNED_BY_PRODUCER</td>
<td>
<p>Optionnel, Bsdasri signé par la PRED (émetteur)</p>
</td>
</tr>
</tbody>
</table>

## processingOperationTypes



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>D10</td>
<td>

</td>
</tr>
<tr>
<td>D12</td>
<td>

</td>
</tr>
<tr>
<td>D9</td>
<td>

</td>
</tr>
<tr>
<td>R1</td>
<td>

</td>
</tr>
<tr>
<td>R12</td>
<td>

</td>
</tr>
</tbody>
</table>

## QuantityType

Type de quantité lors de l'émission

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>ESTIMATED</td>
<td>
<p>Quantité estimée</p>
</td>
</tr>
<tr>
<td>REAL</td>
<td>
<p>Quntité réelle</p>
</td>
</tr>
</tbody>
</table>

## TransportMode



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>AIR</td>
<td>

</td>
</tr>
<tr>
<td>RAIL</td>
<td>

</td>
</tr>
<tr>
<td>RIVER</td>
<td>

</td>
</tr>
<tr>
<td>ROAD</td>
<td>

</td>
</tr>
<tr>
<td>SEA</td>
<td>

</td>
</tr>
</tbody>
</table>

## WasteAcceptationStatusInput

Statut d'acceptation d'un déchet

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>ACCEPTED</td>
<td>
<p>Accepté en totalité</p>
</td>
</tr>
<tr>
<td>PARTIALLY_REFUSED</td>
<td>
<p>Refus partiel</p>
</td>
</tr>
<tr>
<td>REFUSED</td>
<td>
<p>Refusé</p>
</td>
</tr>
</tbody>
</table>

