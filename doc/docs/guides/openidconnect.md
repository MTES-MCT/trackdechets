---
title: Utiliser le protocole OpenID Connect
---

:::note
Cette fonctionalité est réservée à certains acteurs gouvernementaux.
Avant de pouvoir implémenter le procotole OpenID Connect, vous aurez besoin d'une application sur la plateforme Trackdéchets. Vous pouvez créer une application depuis votre compte Trackdéchets dans la section Mon Compte > Développeurs > Mes Applications.
L'activation d'OpenID sur une application doit être demandée au support.
:::


Le [protocole Open ID Connect](https://openid.net/specs/openid-connect-core-1_0.html) permet à des logiciels tiers  ("client") de construire un mécaisme d'authentification  en considérant l'identité d'un utilisateur de Trackdéchets comme une ressource.

Le protocole Openid connect définit différents flow, seul le workflow "Authorization code flow" est implémenté. 

```
+--------+                                   +--------+
|        |                                   |        |
|        |---------(1) AuthN Request-------->|        |
|        |                                   |        |
|        |  +--------+                       |        |
|        |  |        |                       |        |
|        |  |  End-  |<--(2) AuthN & AuthZ-->|        |
|        |  |  User  |                       |        |
|   RP   |  |        |---(3)---------------->|   OP   |
|  aka   |  +--------+                       |  aka   |
| Client |                                   | OpenID |
|        |<--------(4) Redirect to callback--|Provider|
|        |                                   |        |
|        |---------(5) ID Token Request----->|        |
|        |                                   |        |
|        |<--------(6) ID Token Response-----|        |
|        |                                   |        |
+--------+                                   +--------+
                    Abstract Protocol Flow
AuthN: Authentification, AuthZ: Authorization
```

Clef publique