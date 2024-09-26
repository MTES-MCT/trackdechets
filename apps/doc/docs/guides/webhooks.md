---
title: Utilisation des Webhooks de l'API Trackdéchets
---


Les Webhooks permettent au Système d'Information (SI) d'un utilisateur Trackdéchets de recevoir des notifications lorsqu'un bordereau auquel il est associé subit une modification (création, modification ou suppression).

L'utilisation des Webhooks permet aux Systèmes d'Information de réduire la nécessité de faire des lectures périodiques de l'API Trackdéchets.

## Principes:

Pour recevoir des Webhooks, vous devez suivre ces étapes :

1. Configurer les Webhooks en utilisant l'API des ["WebhookSettings"](../reference/api-reference/webhooks/mutations.md#createwebhooksetting).
2. Autoriser votre SI à recevoir des requêtes HTTP de Trackdéchets.
3. Effectuer des modifications sur les bordereaux contenant les établissements correspondants aux "WebhookSettings" ou attendre que d'autres acteurs le fassent.
4. Recevez la requête de notification de mise à jour sur l'URL de votre SI configuré comme Webhook.

## Configuration

L'API des "WebhookSettings" vous permet de configurer l'envoi des Webhooks avec les principes suivants :

- L'API est accessible uniquement aux utilisateurs ADMIN.
- Un seul Webhook est autorisé par établissement (identifié par [`companyId`](../reference/api-reference/webhooks/inputObjects.md#webhooksettingcreateinput)).
- Une URL de notification sur votre SI est associée à chaque Webhook.
- Un token d'au moins 20 caractères est requis lors de la création du "WebhookSetting" et sera transmis en tant qu'en-tête de la requête du Webhook (Authorization: Bearer: token).
- Le token n'est pas visible dans les requêtes, mais vous pouvez le mettre à jour à tout moment.
- L'identifiant de l'établissement ne peut pas être modifié.

### Configuration du point de terminaison (endpoint)

Votre SI doit être capable de recevoir les appels HTTP ou HTTPS de Trackdéchets à l'adresse suivante :

- https://monentreprise.fr/webhooks/

Si vous êtes administrateur de plusieurs établissements, vous pouvez associer une URL distincte à chaque SIRET :

- https://monentreprise.fr/webhooks/siret1
- https://monentreprise.fr/webhooks/siret2

### Désactivation des Webhooks

L'URL du point de terminaison ("endpoint") doit toujours renvoyer un code HTTP 200. Dans le cas contraire, nous considérons que votre SI rencontre un dysfonctionnement. Après un certain nombre de réponses non conformes (plus de 5 en 10 minutes), le Webhook est automatiquement désactivé. Vous pourrez le réactiver en utilisant une mutation de mise à jour.

## Réception des Webhooks

### Payload du Webhook

Le payload est minimal et se présente sous la forme d'un tableau JSON contenant un objet {"action", "id"}. L'ID correspond à l'identifiant lisible du bordereau de suivi des déchets (BSD), et l'action peut être l'une des chaînes suivantes : "CREATED", "UPDATED", "DELETED". Actuellement, un seul objet est renvoyé dans le tableau, mais à l'avenir, il est possible que nous regroupions les informations de plusieurs BSD dans un seul Webhook.

Exemple de requête :
```http
POST / HTTP/1.1

Host: votre-si.com
Connection: close
Accept: application/json, text/plain, */*
Authorization: Bearer: votre-token
Connection: close
Content-Length: 52
Content-Type: application/json
[{"action":"CREATED","id":"BSD-20230412-JYE9095HY"}]
```

Remarque : Si votre SIRET est retiré d'un BSD ou ajouté à un BSD existant, vous recevrez une action "UPDATED".

### Sécurité

Un token est requis pour configurer vos Webhooks, cependant, vous êtes responsables de la mise en place du contrôle d'accès sur votre SI. Assurez-vous que votre endpoint est protégé. Un endpoint non protégé représente un risque de sécurité pour votre SI et pour Trackdéchets.
