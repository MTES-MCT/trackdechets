---
id: enums
title: Enums
slug: enums
---

## BsdaAcceptationStatus



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
<td>PARTIALLY_REFUSED</td>
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

## BsdaConsistence



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>OTHER</td>
<td>

</td>
</tr>
<tr>
<td>PULVERULENT</td>
<td>

</td>
</tr>
<tr>
<td>SOLIDE</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaPackagingType



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>BIG_BAG</td>
<td>

</td>
</tr>
<tr>
<td>BODY_BENNE</td>
<td>

</td>
</tr>
<tr>
<td>DEPOT_BAG</td>
<td>

</td>
</tr>
<tr>
<td>OTHER</td>
<td>

</td>
</tr>
<tr>
<td>PALETTE_FILME</td>
<td>

</td>
</tr>
<tr>
<td>SAC_RENFORCE</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaQuantityType



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>ESTIMATED</td>
<td>

</td>
</tr>
<tr>
<td>REAL</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaSignatureType



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>EMISSION</td>
<td>

</td>
</tr>
<tr>
<td>OPERATION</td>
<td>

</td>
</tr>
<tr>
<td>TRANSPORT</td>
<td>

</td>
</tr>
<tr>
<td>WORK</td>
<td>

</td>
</tr>
</tbody>
</table>

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

## BsdaStatus



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>AWAITING_CHILD</td>
<td>

</td>
</tr>
<tr>
<td>INITIAL</td>
<td>

</td>
</tr>
<tr>
<td>PROCESSED</td>
<td>

</td>
</tr>
<tr>
<td>REFUSED</td>
<td>

</td>
</tr>
<tr>
<td>SENT</td>
<td>

</td>
</tr>
<tr>
<td>SIGNED_BY_PRODUCER</td>
<td>

</td>
</tr>
<tr>
<td>SIGNED_BY_WORKER</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsdaType

4 types de bordereaux possibles:
  - Collecte dans un établissement 2710-1 (déchetterie)
  - Autres collectes
  - Regroupement
  - Ré-expédition

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>COLLECTION_2710</td>
<td>

</td>
</tr>
<tr>
<td>GATHERING</td>
<td>

</td>
</tr>
<tr>
<td>OTHER_COLLECTIONS</td>
<td>

</td>
</tr>
<tr>
<td>RESHIPMENT</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffOperationCode

Liste des codes de traitement possible.

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
<td>D13</td>
<td>

</td>
</tr>
<tr>
<td>D14</td>
<td>

</td>
</tr>
<tr>
<td>R12</td>
<td>

</td>
</tr>
<tr>
<td>R2</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffOperationQualification

Liste des qualifications de traitement possible.
Attention, certaines combinaisons de code et qualification ne sont pas possibles.
Par exemple, seul le code D 10 peut être associé à une incinération.

<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>INCINERATION</td>
<td>

</td>
</tr>
<tr>
<td>RECONDITIONNEMENT</td>
<td>

</td>
</tr>
<tr>
<td>RECUPERATION_REGENERATION</td>
<td>

</td>
</tr>
<tr>
<td>REEXPEDITION</td>
<td>

</td>
</tr>
<tr>
<td>REGROUPEMENT</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffPackagingType



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>BOUTEILLE</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsffSignatureType



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>EMISSION</td>
<td>

</td>
</tr>
<tr>
<td>OPERATION</td>
<td>

</td>
</tr>
<tr>
<td>RECEPTION</td>
<td>

</td>
</tr>
<tr>
<td>TRANSPORT</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuAcceptationStatus



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
<td>PARTIALLY_REFUSED</td>
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

## BsvhuDestinationType



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>BROYEUR</td>
<td>

</td>
</tr>
<tr>
<td>DEMOLISSEUR</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuIdentificationType



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>NUMERO_ORDRE_LOTS_SORTANTS</td>
<td>

</td>
</tr>
<tr>
<td>NUMERO_ORDRE_REGISTRE_POLICE</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuPackaging



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>LOT</td>
<td>

</td>
</tr>
<tr>
<td>UNITE</td>
<td>

</td>
</tr>
</tbody>
</table>

## BsvhuStatus



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>INITIAL</td>
<td>

</td>
</tr>
<tr>
<td>PROCESSED</td>
<td>

</td>
</tr>
<tr>
<td>REFUSED</td>
<td>

</td>
</tr>
<tr>
<td>SENT</td>
<td>

</td>
</tr>
<tr>
<td>SIGNED_BY_PRODUCER</td>
<td>

</td>
</tr>
</tbody>
</table>

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

## SignatureTypeInput



<p style={{ marginBottom: "0.4em" }}><strong>Values</strong></p>

<table>
<thead><tr><th>Value</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>EMISSION</td>
<td>

</td>
</tr>
<tr>
<td>OPERATION</td>
<td>

</td>
</tr>
<tr>
<td>TRANSPORT</td>
<td>

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

