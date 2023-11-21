---
title: Utiliser les webhooks
---

:::note
Cette fonctionalité est en phase de beta test.
:::

Les webhooks permettent à un SI d'un utilisateur Trackdéchets d'être notifié d'un changement (création modification, suppression) d'un bordereau sur leqel il figure.

L'utilisation des webhooks permet aux SI de limiter les lectures périodiques de l'api Trackdéchets.

##  Principes:

Pour recevoir des webhooks vous devez:

- les configurer grâce à l'api des webhookSettings
- permettre à votre SI de recevoir les requêtes HTTP de Trackdéchets
- effectuer des modifications ou attendre que d'autres acteurs en fassent sur des bsds comprenant les établissements correpondant aux webhookSettings.

## Configuration

L'api des webhookSettings vous permet de configurer l'envoi des webhooks

Principes:
- l'api est accessible aux utilisateurs ADMIN
- Un webhook maximum par établissement
- une url de notification par webhook
- un token d'au moins 20 caractères est requis à la création du webhookSetting, il sera passé en header de la requête du webhook (Authorization: Bearer: token)
- le token n'est pas lisible par les queries, mais vous pouvez le mettre à jour à tout moment
- l'id de l'établissement n'est pas modifiable

### Mise en place du endpoint

Votre SI doit être en mesure de recevoir les appels HTTP de Trackdéchets

- https://monentreprise.fr/webhooks/

Vous pouvez associer une url à chaque siret si vous êtes ADMIN de plusieurs établissements

- https://monentreprise.fr/webhooks/siret1
- https://monentreprise.fr/webhooks/siret2

 
### Désactivation des webhooks

Le endpoint doit toujours répondre par un status code HTTP 200. Dans le cas contraire, nous considérons que votre SI est en avarie. À la suite d'un nombre trop important de réponses non conformes (plus de 5 en 10mn), le webhooks est automatiquement désactivé

Vous pourrez le réactiver par une mutation d'update.


## Réception des webhooks
### Payload du webhook

Le payload est minimal: il est sous la forme d'un tableau JSON contenant un object {"action", "id"}.

L'ID correspondant à l'identifiant lisible du bsd, l'action étant une des chaînes suivantes: "CREATED", "UPDATED", "DELETED".

Actuellement un seul objet est renvoyé dans le tableau, à l'avenir il est possible que nous groupions les informations de plusieurs bsds dans un même webhook.

```
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

NB: Si votre siret est retiré d'un BSD ou ajouté à un BSD existant, vous recevrez une action "UPDATED"

### Sécurité

Un token est requis pour configurer vos webhooks, néanmoins vous êtes responsables de l'implémentation du contrôle d'accès sur votre SI.
Gardez en mémoire qu'un enpoint non protégé représente un risque pour votre SI et pour Trackdéchets.