---
id: enums
title: Enums
slug: enums
---

## Consistence

Consistance du déchet

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>DOUGHY</td>
<td>
<p>Pâteux</p>
</td>
</tr>
<tr>
<td>GASEOUS</td>
<td>
<p>Gazeux</p>
</td>
</tr>
<tr>
<td>LIQUID</td>
<td>
<p>Liquide</p>
</td>
</tr>
<tr>
<td>SOLID</td>
<td>
<p>Solide</p>
</td>
</tr>
</tbody>
</table>

## EmitterType

Types d'émetteur de déchet (choix multiple de la case 1)

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>APPENDIX1</td>
<td>
<p>Collecteur de petites quantités de déchets relevant de la même rubrique</p>
</td>
</tr>
<tr>
<td>APPENDIX2</td>
<td>
<p>Personne ayant transformé ou réalisé un traitement dont la provenance des déchets reste identifiable</p>
</td>
</tr>
<tr>
<td>OTHER</td>
<td>
<p>Autre détenteur</p>
</td>
</tr>
<tr>
<td>PRODUCER</td>
<td>
<p>Producetur de déchet</p>
</td>
</tr>
</tbody>
</table>

## FormRole



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>BROKER</td>
<td>
<p>Les BSD&#39;s dont je suis le courtier</p>
</td>
</tr>
<tr>
<td>ECO_ORGANISME</td>
<td>
<p>Les BSD&#39;s dont je suis éco-organisme</p>
</td>
</tr>
<tr>
<td>EMITTER</td>
<td>
<p>Les BSD&#39;s dont je suis l&#39;émetteur</p>
</td>
</tr>
<tr>
<td>RECIPIENT</td>
<td>
<p>Les BSD&#39;s dont je suis la destination de traitement</p>
</td>
</tr>
<tr>
<td>TRADER</td>
<td>
<p>Les BSD&#39;s dont je suis le négociant</p>
</td>
</tr>
<tr>
<td>TRANSPORTER</td>
<td>
<p>Les BSD&#39;s dont je suis transporteur</p>
</td>
</tr>
</tbody>
</table>

## FormsRegisterExportFormat

Format de l'export du registre

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>CSV</td>
<td>
<p>Fichier csv</p>
</td>
</tr>
<tr>
<td>XLSX</td>
<td>
<p>Fichier Excel</p>
</td>
</tr>
</tbody>
</table>

## FormsRegisterExportType

Modèle de registre réglementaire tels que décrits dans l'arrêté du 29 février 2012 fixant
le contenu des registres mnetionnées aux articles R. 541-43 et R. 541-46 du code de l'environnement
https://www.legifrance.gouv.fr/affichTexte.do?cidTexte=JORFTEXT000025454959&categorieLien=id

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>ALL</td>
<td>
<p>Registre exhaustif, déchets entrants et sortants</p>
</td>
</tr>
<tr>
<td>BROKERED</td>
<td>
<p>Registre courtier</p>
</td>
</tr>
<tr>
<td>INCOMING</td>
<td>
<p>Registre traiteur, TTR
Art 2: Les exploitants des installations de transit, de regroupement ou de traitement de déchets,
notamment de tri, établissent et tiennent à jour un registre chronologique où sont consignés
tous les déchets entrants.</p>
</td>
</tr>
<tr>
<td>OUTGOING</td>
<td>
<p>Registre producteur, déchets sortants
Art 1: Les exploitants des établissements produisant ou expédiant des déchets tiennent à jour
un registre chronologique où sont consignés tous les déchets sortants.</p>
</td>
</tr>
<tr>
<td>TRADED</td>
<td>
<p>Registre négociants
Art 4: Les négociants tiennent à jour un registre chronologique des déchets détenus.</p>
</td>
</tr>
<tr>
<td>TRANSPORTED</td>
<td>
<p>Registre transporteur
Art 3: Les transporteurs et les collecteurs de déchets tiennent à jour un registre chronologique
des déchets transportés ou collectés.</p>
</td>
</tr>
</tbody>
</table>

## FormStatus

Différents statuts d'un BSD au cours de son cycle de vie

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>ACCEPTED</td>
<td>
<p>BSD accepté par l&#39;établissement de destination</p>
</td>
</tr>
<tr>
<td>AWAITING_GROUP</td>
<td>
<p>BSD en attente de regroupement</p>
</td>
</tr>
<tr>
<td>DRAFT</td>
<td>
<p>BSD à l&#39;état de brouillon
Des champs obligatoires peuvent manquer</p>
</td>
</tr>
<tr>
<td>GROUPED</td>
<td>
<p>Regroupement effectué</p>
</td>
</tr>
<tr>
<td>NO_TRACEABILITY</td>
<td>
<p>Perte de traçabalité</p>
</td>
</tr>
<tr>
<td>PROCESSED</td>
<td>
<p>BSD dont les déchets ont été traités</p>
</td>
</tr>
<tr>
<td>RECEIVED</td>
<td>
<p>BSD reçu par l&#39;établissement de destination</p>
</td>
</tr>
<tr>
<td>REFUSED</td>
<td>
<p>Déchet refusé</p>
</td>
</tr>
<tr>
<td>RESEALED</td>
<td>
<p>Déchet avec les cadres 14-19 complétées (si besoin), prêt à partir du site d&#39;entreposage ou reconditionnement</p>
</td>
</tr>
<tr>
<td>RESENT</td>
<td>
<p>Déchet envoyé du site d&#39;entreposage ou reconditionnement vers sa destination de traitement</p>
</td>
</tr>
<tr>
<td>SEALED</td>
<td>
<p>BSD finalisé
Les champs sont validés pour détecter des valeurs manquantes ou erronnées</p>
</td>
</tr>
<tr>
<td>SENT</td>
<td>
<p>BSD envoyé vers l&#39;établissement de destination</p>
</td>
</tr>
<tr>
<td>TEMP_STORED</td>
<td>
<p>Déchet arrivé sur le site d&#39;entreposage ou reconditionnement</p>
</td>
</tr>
<tr>
<td>TEMP_STORER_ACCEPTED</td>
<td>
<p>Déchet accepté par le site d&#39;entreposage ou reconditionnement</p>
</td>
</tr>
</tbody>
</table>

## Packagings

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
<td>BENNE</td>
<td>
<p>Benne</p>
</td>
</tr>
<tr>
<td>CITERNE</td>
<td>
<p>Citerne</p>
</td>
</tr>
<tr>
<td>FUT</td>
<td>
<p>Fut</p>
</td>
</tr>
<tr>
<td>GRV</td>
<td>
<p>GRV</p>
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

## SignatureAuthor

Dénomination de l'auteur de la signature

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>ECO_ORGANISME</td>
<td>
<p>L&#39;auteur de la signature est l&#39;éco-organisme figurant sur le BSD</p>
</td>
</tr>
<tr>
<td>EMITTER</td>
<td>
<p>L&#39;auteur de la signature est l&#39;émetteur du déchet</p>
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

