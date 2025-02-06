---
title: Utiliser le protocole OpenID Connect
---

:::note
Cette fonctionalité est réservée à certains acteurs institutionnels.
Avant de pouvoir implémenter le procotole OpenID Connect, vous aurez besoin d'une application sur la plateforme Trackdéchets. Vous pouvez créer une application depuis votre compte Trackdéchets dans la section Mon Compte > Développeurs > Mes Applications.

L'activation d'OpenID Connect sur une application doit être demandée au support.
:::

Le [protocole Open ID Connect](https://openid.net/specs/openid-connect-core-1_0.html) permet à des logiciels tiers ("client") de construire un mécanisme d'authentification en considérant l'identité d'un utilisateur de Trackdéchets comme une ressource.

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

Le protocole Openid connect définit différents workflows, seul l'_Authorization code flow_ est implémenté.

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
     |  User-   |                                 |    OpenID     |
     |  Agent  -+----(B)-- User authenticates --->|    Provider   |
     |          |                                 |               |
     |         -+----(C)-- Authorization Code ---<|               |
     +-|----|---+                                 +---------------+
       |    |                                         ^      v
      (A)  (C)                                        |      |
       |    |                                         |      |
       ^    v                                         |      |
     +---------+                                      |      |
     |         |>---(D)-- Authorization Code ---------'      |
     |   RP    |          & Redirection URI                  |
     |  Client |                                             |
     |         |<---(E)----- ID Token -----------------------+
     +---------+

   Note: The lines illustrating steps (A), (B), and (C) are broken into
   two parts as they pass through the user-agent.

                     Authorization Code Flow
```

- (A) L'application cliente initie le protocole en redirigeant l'utilisateur sur l'URL d'autorisation Trackdéchets `https://app.trackdechets.beta.gouv.fr/oidc/authorize/dialog`.

Les arguments suivants doivent être passés en "query string" de la requête :

- `client_id={client_id}` : L'identifiant de l'application cliente
- `response_type=code`
- `redirect_url={redirect_uri}` : URL de redirection
- `scope={openid profile email}` : le scope de la requête, voir plus bas
- `state={random}` : une chaine aléatoire qui permet de vérifier que la réponse et la redirection (C) font partie d'une même séquence

Exemple : `https://app.trackdechets.beta.gouv.fr/oidc/authorize/dialog?response_type=code&redirect_uri=https://client.example.com/cb&client_id=ck7d66y9s00x20784u4u7fp8l&scope=openid profile email&state=KTDRl4JI3p/TwSUJhgO2alwb`

- (B) Le serveur d'autorisation authentifie l'utilisateur via le navigateur ("resource owner") et établit si oui ou non l'utilisateur autorise ou non l'application autorise l'accès.

- (C) Si l'utilisateur donne accès, le serveur d'autorisation redirige l'utilisateur vers l'application cliente en utilisant l'URL de redirection fournit à l'étape (A). L'URL de redirection inclut un code d'autorisation d'une durée de validité de 1 minute. Par exemple : `https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=KTDRl4JI3p/TwSUJhgO2alwb`. Le state reçu ici doit correspondre à celui de (A).

- (D) L'application cliente demande un jeton d'identité au serveur d'autorisation en incluant le code d'autorisation reçu à l'étape précédente en faisant un `POST` sur l'URL `https://api.trackdechets.beta.gouv.fr/oidc/token`. Les paramètres suivants doivent être passés en utilisant le format "application/x-www-form-urlencoded".
  - `grant_type=authorization_code`
  - `code={code}` code reçu à l'étape précédente
  - `redirect_uri={redirect_uri}` URL de redirection spécifié à l'étape (A)

:::note
La requête doit être authentifiée, 2 méthodes sont possibles :

- via la [méthode basique](https://fr.wikipedia.org/wiki/Authentification_HTTP#M%C3%A9thode_%C2%AB_Basic_%C2%BB), en passant base64(`client_id`:`client_secret`)
- en passant `client_id` et `client_secret` directement dans les paramètres POST
:::

- (E) Si la requête est valide et autorisée, le serveur d'autorisation émet un jeton d'identité (ID token). Par exemple :

```json
 {
  "name": "Jean Dupont",
  "phone": "06876543",
  "email": "foo@barr.fr",
  "email_verified": true,
  "companies": [
    {
      "id": "wxcgh123",
      "role": "ADMIN",
      "siret": "1234",
      "vat_number": null,
      "name": "une entreprise A",
      "given_name": "Succursale Marseille",
      "types": ["PRODUCER"],
      "verified": true
    },

    {
      "id": "mlkj953",
      "role": "MEMBER",
      "siret": "9876",
      "vat_number": null,
      "name": "une entreprise B",
      "given_name": "Succursale Rouen",
      "types": ["COLLECTOR", "WASTEPROCESSOR"],
      "verified": false
    }
  ],
  "nonce": "CYCTdEHKQAqB2ahOVWiOFSMbjdxUhGBb",
  "iat": 1672650576,
  "iss": "trackdechets",
  "aud": "your-app",
  "exp": 1672654176,
  "sub": "ck03yr7q000di0728m7uwhc1i"
};
```

:::caution
Le champ `sub` correspond à l'User Id de Trackdéchets.
:::

:::caution
Le token est signé via une clef RSA, il est indispensable de vérifier sa signature l'audience (aud) et issuer (iss) grâce à la clef publique.
:::

:::caution
Le nonce est fourni pour éviter toute attaque par rejeu, il appartient au client de s'assurer que le nonce n'a jamais été utilisé.
:::

## Scope

Le scope définit les claims, c'est-à-dire les champs demandés qui seront inclus dans le token d'identité.

Trackdéchets implémente 3 valeurs standard et une valeur spécifique :

- openid : obligatoire, requête le `sub`, l'id de l'utilisateur
- email : requête email et email_verified
- profile : requête name & phone
- companies : requête la liste des établissements de l'utilisateur :
    - id : identifiant unique au sein de Trackdéchets
    - role : rôle de l'utilisateur, MEMBER ou ADMIN au sein de l'établissement
    - siret : siret à 14 chiffres pour les entreprises françaises
    - name : dénomination officielle de l'établissement
    - given_name : nom usuel donné par l'admin de l'établissement
    - types : CompanyTypes de l'établissement (eg. ["PRODUCER", "TRANSPORTER", "WASTEPROCESSOR"])
    - vat_number : numéro de tva si disponible, utilisé pour identifier les entreprises étrangères
    - verified: true|false, précise si l'établissement est vérifié (la vérification n'est effectuée que sur certains type d'établissements)

