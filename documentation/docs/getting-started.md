# Mise en route

## GraphQL

L'API fournie est une API GraphQL. Cette norme a 3 types d'actions possibles:

- `query` pour requêter des données
- `mutation` pour créer, modifier ou supprimer des données
- `subscription` pour souscrire à des modifiations et être automatiquement informé des changements (via des websockets)

L'ensemble des actions possibles sont listées dans le playground de l'API qui est disponible [ici](https://api.trackdechets.beta.gouv.fr/). Pour plus d'informations sur les APIs GraphQL nous vous invitons à consulter la [documentation officielle](https://graphql.org/).

Des clients GraphQL existent dans la très grande majorité des languages et vous permettront de vous simplifier l'utilisation de l'API. Une liste non exhaustive est [présentée ici](https://graphql.org/code/).

## Clé d'API (token)

Pour utiliser l'API vous aurez besoin d'une clé d'API. Si certaines actions sont accessibles sans clé, vous ne pourrez pas réaliser la plupart des opérations si vous ne vous en munissez pas. Une fois la clé renseignée, vous aurez accès à l'ensemble des actions autorisées pour le compte associé à la clé.

Le moyen le plus simple pour récupérer une clé est de vous connecter à votre espace Trackdéchets et d'aller dans la partie `Mon Compte` -> `Générer une clé`. Ces clés sont en fait des JSON webtokens qui contiennent les informations permettant de vous identifier et sécurisent les échanges que vous aurez avec Trackdéchets.

Il est également possible de récupérer un token de manière programmatique en appelant la mutation `login(email: String!, password: String!)`. On lui passe son login et mot de passe et elle nous donne un `token` en retour que l'on pourra utiliser:

```bash
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  --data '{ "query":"mutation {  login(email: \"<MY_EMAIL>\", password: \"<MY_PASSWORD>\") { token }}" }' \
  https://api.trackdechets.beta.gouv.fr/
```

On notera que c'est une mutation qui est utilisée ici et non une query pour suivre les conventions graphQl. Le token délivré **a une durée de vie de 24h**, il faut donc le renouveller chaque jour.

Afin d'utiliser l'API de manière authentifiée, ce token est ensuite à insérer dans vos requêtes via le header HTTP `Authorization`:

```bash
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \ # <= Header Authorization
  --data '{ "query": "{ forms { id } }" }' \
  https://api.trackdechets.beta.gouv.fr/
```
