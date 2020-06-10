# Trackdéchets

[![CircleCI](https://circleci.com/gh/MTES-MCT/trackdechets/tree/dev.svg?style=svg)](https://circleci.com/gh/MTES-MCT/trackdechets/tree/dev)

**Gérer la traçabilité des déchets en toute sécurité**

<img height="100px" style="margin-right: 20px" src="./front/public/trackdechets.png" alt="logo"></img>
<img height="100px" src="./front/public/marianne.svg" alt="logo"></img>

Dépôt de code de la startup d'état **Trackdéchets** incubée à la Fabrique Numérique du Ministère de la Transition Écologique et Solidaire.

Ce README s'adresse aux intervenant·es  techniques sur le projet. Pour plus d'infos en tant qu'utilisateur.ice du produit ou de l'API, vous pouvez consulter les liens suivants:

* [Site web](https://trackdechets.beta.gouv.fr)
* [FAQ](https://faq.trackdechets.fr/)
* [Documentation technique de l'API](https://developers.trackdechets.beta.gouv.fr)
* [Forum technique](forum.trackdechets.beta.gouv.fr)

## Architecture logicielle

Le projet utilise docker-compose avec les différents services suivants:

* `td-api` (`./back`) Serveur Express.js avec une API GraphQL (Node.js)
* `td-ui` (`./front`) Single Page App pour la page d'accueil et le dashboard (React.js)
* `td-pdf` (`./pdf`) Service interne de génération de BSD au format PDF (Node.js)
* `td-mail` (`./mail`) Service interne d'envoi de courriels via Mailjet (Golang)
* `td-etl` (`./etl`) Service interne de préparation des données de la base des ICPE (Python, Airflow)
* `td-doc` (`./doc`) Documentation technique du projet (Docusaurus)

La config Nginx pour chaque container exposé est créee de façon automatique grâce à [jwilder/nginx-proxy](https://github.com/nginx-proxy/nginx-proxy)

![stack](./stack.png)


## Environnements

Plusieurs environnements sont configurés via les différents fichiers compose.

* **dev** pour le développement en local
* **test** pour faire tourner les tests, en local ou sur CircleCI
* **recette**: environnement de validation fonctionnelle, synchronisé avec la branche `dev`.
* **sandbox**: environnement "bac à sable" pour les personnes souhaitant s'interfacer avec l'API Trackdéchets, synchronisé avec la branche `master`
* **prod**: environnement de production, synchronisé avec la branche `master`

## Infrastructure

Les différentes instances sont hébérgées chez OVH et Scaleway. Le détail est disponible dans la carte correspondante sur [Trello](https://trello.com/c/zZJskt5m)

## Outillage

* [CircleCI](https://circleci.com/) pour l'intégration continue et le déploiement
* [Sentry](https://sentry.io) pour le reporting des erreurs
* [Graylog](https://www.graylog.org/) pour l'indexation des logs
* [Metabase](https://www.metabase.com/) pour l'analyse et la visualisation des données Trackdéchets
* [Matomo](https://fr.matomo.org/) pour l'analyse du traffic web
* [Cachet](http://cachethq.io/) pour la page de statuts et les alertes
* [graphql-codegen](https://graphql-code-generator.com/) pour générer la référence de l'API et le typage Typescript à partir des fichiers de définition graphql.

## Mise en route

### Pré-requis

* Installer `docker` et `docker-compose`

### Nginx-proxy

> jwilder/nginx-proxy va nous permettre d'accéder aux différents services exposées au travers d'URLs de type `http://trackdechets.local`, `http://api.trackdechets.local`, etc sur le port 80 plutôt que de mapper chaque service sur différents ports de `localhost`.


* Créer un répertoire `nginx-proxy` sur votre espace de travail et y ajouter le fichier `docker-compose.yml` suivant:

  ```docker
  version: "3.1"

  services:
    nginx-proxy:
      image: jwilder/nginx-proxy:alpine
      ports:
        - "80:80"
      volumes:
        - /var/run/docker.sock:/tmp/docker.sock:ro
      restart: unless-stopped

  networks:
    default:
      external:
        name: nginx-proxy
  ```

* Créer le `network` docker `nginx-proxy`

  ```
  docker network create nginx-proxy
  ```

* Mapper les différentes URLs sur localhost dans votre fichier `host`

  ```
  127.0.0.1 api.trackdechets.local
  127.0.0.1 trackdechets.local
  127.0.0.1 etl.trackdechets.local
  127.0.0.1 metabase.trackdechets.local
  127.0.0.1 doc.trackdechets.local
  127.0.0.1 developers.trackdechets.local
  ```

  > Pour rappel, le fichier host est dans `C:\Windows\System32\drivers\etc` sous windows, `/etc/hosts` ou `/private/etc/hosts` sous Linux et Mac

* Démarrer le proxy nginx

  ```
  docker-compose up
  ```

Pour plus de détails, se référer au post ["Set a local web development environement with custom urls and https"](https://medium.com/@francoisromain/set-a-local-web-development-environment-with-custom-urls-and-https-3fbe91d2eaf0) by @francoisromain


### Configurer les variables d'environnements

* Renommer le ficher `.env.model` en `.env` et le compléter en demandant les infos à un développeur de l'équipe

### Démarrer les containers


```bash
git clone git@github.com:MTES-MCT/trackdechets.git
cd trackdechets
git checkout --track origin/dev
git checkout -b feat/my-awesome-feature
docker-compose -f docker-compose.dev.yml up postgres redis prisma td-api td-pdf td-ui
```

Le démarrage du service `td-mail` est déconseillé en développement pour éviter des envois de courriels intempestifs mais vous pouvez l'activer pour le bon fonctionnement de certaines fonctionnalités (ex: validation de l'inscription, invitation à rejoindre un établissement, etc)

Vous pouvez également démarrer les services `td-doc`, `td-etl` et `metabase` au cas par cas mais ceux-ci  ne sont pas essentiels au fonctionnement de l'API ou de l'interface utilisateur.


### Synchroniser la base de données avec le schéma prisma

Les modèles de données sont définis dans les fichiers `back/prisma/database/*.prisma`.
Afin de synchroniser les tables PostgreSQL, il faut lancer une déploiement prisma


```bash
docker exec -it $(docker ps -aqf "name=trackdechets_td-api") bash
npx prisma deploy
```

### Accéder aux différents services

C'est prêt ! Rendez-vous sur l'URL `UI_HOST` configurée dans votre fichier `.env` (par ex: `http://trackdechets.local`) pour commencer à utiliser l'application ou sur `API_HOST` (par ex `http://api.trackdechets.local`) pour accéder au playground GraphQL.

Il existe également un playground prisma exposant directement les fonctionnalités de l'ORM accessible sur `http://localhost:4466`.


## Tests

### Tests unitaires (back et front)

#### Tous les tests

```
docker-compose -f docker-compose.test.yml up
```

#### Uniquement certains tests

Il est également possible de faire tourner les tests unitaires sur l'environnement de `dev` en se connectant à chacun des containers

* Démarrer les différents services

  ```
  docker-compose -f docker-compose.dev.yml up postgres prisma redis td-pdf td-api td-ui
  ```

* Faire tourner les tests back

  ```bash
  docker exec -it $(docker ps -aqf "name=trackdechets_td-api") bash
  npm run test # run all the tests
  npx jest path src/path/to/my-function.test.ts # run only one test
  ```

* Faire tourner les tests front

  ```bash
  docker exec -it $(docker ps -aqf "name=td-ui") sh
  npm run test # run tests in watch mode
  ```


### Tests d'intégration back

Ce sont tous les tests ayant l'extension `.integration.ts` et nécessitant le setup d'une base de données de test.

```bash
cd back/integration-tests
./run.sh # run all the tests at once and exit
```

Il est également possible de faire tourner chaque test de façon indépendante:

```bash
cd back/integration-tests
./run.sh -u # start all the containers
./run.sh -r workflow.integration.ts
./run.sh -d # remove all containers
```

## Compatibilité navigateur

Le support des navigateurs est configuré dans le fichier [`./front/.browserslistrc`](./front/.browserslistrc). La liste des navigateurs correspondant à cette config est [la suivante](https://browserl.ist/?q=%3E+0.1%25%2C+not+dead%2C+not+op_mini+all%2C+ie+11)


## Déploiement

Le déploiement est géré par CircleCI à l'aide du fichier [./circle/config.yml](.circleci/config.yml).
Chaque update de la branche `dev` déclenche un déploiement sur l'environnement de recette. Chaque update de la branche `master` déclenche un déploiement sur les environnements sandbox et prod.

## Contribuer

Voir les conventions et bonnes pratiques sur [CONTRIBUTING.md](./CONTRIBUTING.md)

## L'équipe

La liste des contributeurs au projet est disponible sur [AUTHORS.md](./AUTHORS.md)

## Licence

[GNU Affero General Public License v3.0 ou plus récent](https://spdx.org/licenses/AGPL-3.0-or-later.html)



