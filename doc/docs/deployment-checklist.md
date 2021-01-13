---
id: deployment-checklist
title: Passer en production
sidebar_label: Passer en production
---

Une fois le développement de votre application terminé sur l'espace bac à sable, vous pourrez passer sur l'environnement de production.
Ces deux environnements étant identiques d'un point de vue fonctionnalités, cette étape devrait être transparente.
Il vous faudra simplement utiliser l'[URL de l'API de production](environments.md) et vous assurez d'avoir créé les comptes nécessaires.
À noter qu'il faudra aussi [créer une application](oauth2.md) si vous en avez eu le besoin sur l'environnement bac à sable.

Il y a cependant un certain nombre d'aspects à garder en tête pour passer de la phase de tests à la mise en production en toute sérénité.
La liste ci-dessous est conçu à partir de retours d'expérience.

## Évolutions de l'API

L'API de Trackdéchets est en constante évolution.
Nous faisons notre maximum pour éviter tout breaking change, en passant au préalable par de longues phases de dépréciation.

L'historique des changements de l'API est documenté sur notre [change log](https://github.com/MTES-MCT/trackdechets/blob/master/Changelog.md).
Vous pouvez également vous inscrire à la newsletter technique afin de recevoir les notes de nouvelle version par email.

<!-- Code copié/collé de Mailjet -->

<data id="mj-w-res-data" data-token="7d86ed381739d32d7235d907b20cde6e" class="mj-w-data" data-apikey="3F7D" data-w-id="H2D" data-lang="fr_FR" data-base="https://app.mailjet.com" data-width="640" data-height="328" data-statics="statics"></data>

<div class="mj-w-button mj-w-btn" style="font-family: Ubuntu, Helvetica; color: white; padding: 0 25px; background-color: #f0622b; text-align: center; vertical-align: middle; display: inline-block; border-radius: 3px;" data-token="7d86ed381739d32d7235d907b20cde6e">
    <div style="display: table; height: 45px;">
        <div style="display: table-cell; vertical-align: middle;">
            <div class="mj-w-button-content" style="font-family:Ubuntu, Helvetica; display: inline-block; text-align: center; font-size: 13px; vertical-align: middle;"><b>S'inscrire à la newsletter technique</b></div>
        </div>
    </div>
</div>

<script type="text/javascript" src="https://app.mailjet.com/statics/js/widget.modal.js"></script>

<!-- Code copié/collé de Mailjet -->

## Rupture du suivi

TODO: souligner qu'un déchet part d'un point A à un point B puis à un point C. Si la transmission du dépârt de A vers B échoue, il sera impossible de transmettre l'information du dépârt de B vers C. Il faut donc gérer les erreurs dans l'immédiat si possible (par exemple vérifier que le code producteur est bon).

## Accompagnement des utilisateurs

TODO: souligner qu'il est très probable de devoir accompagner les utilisateurs passant par l'application tierce et Trackdéchets. Par exemple un collecteur qui utilise un logiciel tierce et dont les clients passent par Trackdéchets. C'est un circuit qui est complexe. Fait peut être doublon avec ce qu'a déjà fait Judith?

## Suivi des erreurs

TODO: encourager à suivre les erreurs retournées par l'API pour pouvoir réagir.

## Déploiement progressif

TODO: encourager à faire un déploiement progressif avec un volume maîtrisé au début. Fait peut être doublon avec ce qu'a déjà fait Judith?
