# Cycle de vie d'un bordereau

<script src="https://unpkg.com/mermaid@8.0.0/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true});</script>

Le diagramme ci dessous retrace le cycle de vie d'un BSD dans Trackdéchets:

<div class="mermaid">
graph TD
A[DRAFT] -->B(SEALED)
B --> |Par l'émetteur| C(SENT)
C -->|Par le receveur| D{RECEIVED}
D -- Cas classique -->E(PROCESSED)
D -- Regroupement et perte de traçabilite -->G(NO_TRACEABILITY)
D -- Regroupement -->F(AWAITING_GROUP)
F-. Rempli une annexe2 .->A
F-. Rempli une annexe2 .->A
F-. Rempli une annexe2 .->A
F--Fait partie d'une annexe2 -->H[GROUPED]
H--BSD avec annexe devient Processed -->E
</div>

## Description des états

### Draft - Brouillon

Chaque bordereau commence sa vie par l'état `DRAFT`. Le brouillons signifie plusieurs choses importantes:

- dans l'interface de Trackdéchets, il apparait dans l'onglet "Brouillons"
- il peut être incomplet
- tous les champs restent modifiables
- il peut être modifié par les 2 parties concernées (émetteur et destination). Il y a donc la possibilité de co-construire le bordereau.

### SEALED - Scellé

Une fois que le brouillon est prêt on le "scelle". Il a alors les caractéristiques suivantes:

- dans l'interface de Trackdéchets, il apparait dans
    - l'onglet "En attente de signature" pour le producteur du déchet
    - l'onglet "Statut du déchet" celui qui reçoit le déchet
- on ne peut plus le modifier
- un BSD ne peut pas passer à l'état scellé s'il n'est pas valide (champs vides / manquants / incorrects)
- on peut imprimer un PDF
- le producteur peut déclarer l'envoi

### SENT - Envoyé

Une fois que le déchet a quitté le site du producteur, il peut le marquer comme envoyé (cadre 9). Pour valider l'envoi il faut:

- un nom
- une date

### RECEIVED - Reçu

C'est ensuite à celui qui reçoit le déchet d'accuser réception du déchet (cadre 10). Il doit préciser:

- s'il accepte ou non le déchet
- le nom de celui quireçoit
- la date de réception
- la quantité reçue

### PROCESSED - Traité

Celui qui reçoit le déchet va ensuite pouvoir déclarer le traitement effectué (cadre 11). Il doit préciser:

- l'opération réalisée
- la description de cette opération
- le nom du responsable
- la date de traitement
- le cas échant la prochaine opération prévue
- le cas échant la description du prochain centre de traitement (nom, adresse, contact...) dans un champ de texte libre
- le cas échant préciser s'il y a perte de traçabilité pour ce BSD

