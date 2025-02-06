---
title: Créer une application OAuth2
---

:::note
Avant de pouvoir implémenter le procotole OAuth2, vous aurez besoin d'une application sur la plateforme Trackdéchets. Vous pouvez créer une application depuis votre compte Trackdéchets dans la section Mon Compte > Développeurs > Mes Applications.
:::

Le [protocole OAuth2](https://tools.ietf.org/html/rfc6749) permet à des logiciels tiers type SaaS déchets ("client") d'accéder à l'API Trackdéchets ("ressource server") pour le compte d'utilisateurs ("ressource owner") sans exposer le mot de passe de celui-ci.

```
     +--------+                               +---------------+
     |        |--(A)- Authorization Request ->|   Resource    |
     |        |                               |     Owner     |
     |        |<-(B)-- Authorization Grant ---|               |
     |        |                               +---------------+
     |        |
     |        |                               +---------------+
     |        |--(C)-- Authorization Grant -->| Authorization |
     | Client |                               |     Server    |
     |        |<-(D)----- Access Token -------|               |
     |        |                               +---------------+
     |        |
     |        |                               +---------------+
     |        |--(E)----- Access Token ------>|    Resource   |
     |        |                               |     Server    |
     |        |<-(F)--- Protected Resource ---|               |
     +--------+                               +---------------+

                    Abstract Protocol Flow
```

Seul le "grant" par échange de code d'autorisation est implémenté dans Trackdéchets [https://tools.ietf.org/html/rfc6749#section-4.1](https://tools.ietf.org/html/rfc6749#section-4.1). Le schéma de flux est le suivant :

```
     +----------+
     | Resource |
     |   Owner  |
     |          |
     +----------+
          ^
          |
         (B)
     +----|-----+          Client Identifier      +---------------+
     |         -+----(A)-- & Redirection URI ---->|               |
     |  User-   |                                 | Authorization |
     |  Agent  -+----(B)-- User authenticates --->|     Server    |
     |          |                                 |               |
     |         -+----(C)-- Authorization Code ---<|               |
     +-|----|---+                                 +---------------+
       |    |                                         ^      v
      (A)  (C)                                        |      |
       |    |                                         |      |
       ^    v                                         |      |
     +---------+                                      |      |
     |         |>---(D)-- Authorization Code ---------'      |
     |  Client |          & Redirection URI                  |
     |         |                                             |
     |         |<---(E)----- Access Token -------------------'
     +---------+

   Note: The lines illustrating steps (A), (B), and (C) are broken into
   two parts as they pass through the user-agent.

                     Authorization Code Flow
```

- (A) L'application cliente initie le protocole en redirigeant l'utilisateur ("resource owner") sur l'URL d'autorisation Trackdéchets `https://app.trackdechets.beta.gouv.fr/oauth2/authorize/dialog`.

Les arguments suivants doivent être passés en "query string" de la requête (Cf [https://tools.ietf.org/html/rfc6749#section-4.1.1](https://tools.ietf.org/html/rfc6749#section-4.1.1)) :

- `client_id={client_id}` : L'identifiant de l'application cliente
- `response_type=code`
- `redirect_uri={redirect_uri}` : URL de redirection

Exemple : `https://app.trackdechets.beta.gouv.fr/oauth2/authorize/dialog?response_type=code&redirect_uri=https://client.example.com/cb&client_id=ck7d66y9s00x20784u4u7fp8l`

Si la requête échoue à cause d'un paramètre invalide, une erreur est retournée [https://tools.ietf.org/html/rfc6749#section-4.1.2.1](https://tools.ietf.org/html/rfc6749#section-4.1.2.1)

- (B) Le serveur d'autorisation authentifie l'utilisateur via le navigateur ("resource owner") et établit si oui ou non l'utilisateur autorise ou non l'application autorise l'accès.

![oauth2-dialog.png](../../static/img/oauth2-dialog.png)

- (C) Si l'utilisateur donne accès, le serveur d'autorisation redirige l'utilisateur vers l'application cliente en utilisant l'URL de redirection fournit à l'étape (A) [https://tools.ietf.org/html/rfc6749#section-4.1.2](https://tools.ietf.org/html/rfc6749#section-4.1.2). L'URL de redirection inclut un code d'autorisation avec une durée de validité de 10 minutes. Par exemple : `https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA`.

* (D) L'application cliente demande un jeton d'accès au serveur d'autorisation en incluant le code d'autorisation reçu à l'étape précédente en faisant un `POST` sur l'URL `https://api.trackdechets.beta.gouv.fr/oauth2/token`. Cf [https://tools.ietf.org/html/rfc6749#section-4.1.3](https://tools.ietf.org/html/rfc6749#section-4.1.3). Les paramètres suivants doivent être passés en utilisant le format "application/x-www-form-urlencoded".

  - `grant_type=authorization_code`
  - `code={code}` code reçu à l'étape précédente
  - `redirect_uri={redirect_uri}` URL de redirection spécifié à l'étape (A)

La requête doit être authentifiée avec le `client_id` et `client_secret` ([méthode basique](https://fr.wikipedia.org/wiki/Authentification_HTTP#M%C3%A9thode_%C2%AB_Basic_%C2%BB)).

```http
POST /oauth2/token HTTP/1.1
Host: api.trackdechets.beta.gouv.fr
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://client.example.com/cb
```

- (E) Si la requête est valide et autorisée, le serveur d'autorisation émet un jeton d'accès. Par exemple :

```http
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
  "access_token":"*****************",
  "token_type":"bearer",
    "user": {
      "email": "foo@bar.com",
      "name": "Foo Bar"
    }
}
```

**Le token émit a une durée de vie infinie, il n'y a pas besoin de le rafraichir**. Il pourra toutefois être révoqué par l'utilisateur dans son espace client Trackdéchets.

Vous pouvez ensuite stocker ce token et l'utiliser pour accéder aux ressources de l'utilisateur sur la plateforme Trackdéchets.

Si la requête échoue, le serveur répond par un message d'erreur tel que décrit [ici](https://tools.ietf.org/html/rfc6749#section-5.2).

:::tip
Une application OAuth2 de démonstration a été créée à l'adresse [https://td-oauth2-demo.osc-fr1.scalingo.io/](https://td-oauth2-demo.osc-fr1.scalingo.io/)
:::
