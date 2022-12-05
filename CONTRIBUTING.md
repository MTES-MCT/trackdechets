# Contribuer à Trackdéchets

- [Contribuer à Trackdéchets](#contribuer-à-trackdéchets)
  - [Mise en route](#mise-en-route)
    - [Pré-requis](#pré-requis)
    - [Installation](#installation)
    - [Installation alternative sans docker](#installation-alternative-sans-docker)
    - [Conventions](#conventions)
  - [Tests unitaires](#tests-unitaires)
  - [Tests d'intégration](#tests-dintégration)
  - [Créer une PR](#créer-une-pr)
  - [Déploiement](#déploiement)
  - [Migrations](#migrations)
  - [Guides](#guides)
    - [Mettre à jour le changelog](#mettre-à-jour-le-changelog)
    - [Mettre à jour la documentation](#mettre-à-jour-la-documentation)
    - [Utiliser un backup de base de donnée](#utiliser-un-backup-de-base-de-donnée)
      - [Procédure automatique de restauration d'une base de donnée de production avec Docker](#procédure-automatique-de-restauration-dune-base-de-donnée-de-production-avec-docker)
      - [Procédure manuelle](#procédure-manuelle)
    - [Créer un tampon de signature pour la génération PDF](#créer-un-tampon-de-signature-pour-la-génération-pdf)
    - [Nourrir la base de donnée avec des données par défaut](#nourrir-la-base-de-donnée-avec-des-données-par-défaut)
    - [Ajouter une nouvelle icône](#ajouter-une-nouvelle-icône)
  - [Dépannage](#dépannage)
    - [La base de donnée ne se crée pas](#la-base-de-donnée-ne-se-crée-pas)
    - [Je n'arrive pas à (ré)indexer Elastic Search](#je-narrive-pas-à-réindexer-elastic-search)

## Mise en route

### Pré-requis

1. Installer Node.js
2. Installer Docker et Docker Compose

### Installation

1. Cloner le dépôt sur votre machine.
   ```bash
   git clone git@github.com:MTES-MCT/trackdechets.git
   cd trackdechets
   git checkout --track origin/dev
   ```
2. Configurer les variables d'environnements :

   1. Renommer le ficher `.env.model` en `.env` et le compléter en demandant les infos à un développeur de l'équipe
   2. Créer un fichier `.env` dans `front/` en s'inspirant du fichier `.env.recette`

3. Mapper les différentes URLs sur localhost dans votre fichier `host`

   ```
   127.0.0.1 api.trackdechets.local
   127.0.0.1 trackdechets.local
   127.0.0.1 developers.trackdechets.local
   127.0.0.1 es.trackdechets.local
   127.0.0.1 notifier.trackdechets.local
   ```

   > Pour rappel, le fichier host est dans `C:\Windows\System32\drivers\etc` sous windows, `/etc/hosts` ou `/private/etc/hosts` sous Linux et Mac

   > La valeur des URLs doit correspondre aux variables d'environnement `API_HOST`, `NOTIFIER_HOST`, `UI_HOST`, `DEVELOPERS_HOST` et `ELASTIC_SEARCH_HOST`

4. Démarrer les containers

   ```bash
   docker-compose -f docker-compose.dev.yml up postgres redis td-api td-ui nginx elasticsearch mongodb
   ```

   NB: Pour éviter les envois de mails intempestifs, veillez à configurer la variable `EMAIL_BACKEND` sur `console`.

5. Synchroniser la base de données avec le schéma prisma.

   Les modèles de données sont définis dans les fichiers `back/prisma/schema.prisma`.
   Afin de synchroniser les tables PostgreSQL, il faut lancer une déploiement prisma

   ```bash
   docker exec -it $(docker ps -aqf "name=trackdechets_td-api") bash
   npx prisma db push
   ```

6. Initialiser l'index Elastic Search.

   Les données sont indexées dans une base de donnée Elastic Search pour la recherche.
   Il est nécessaire de créer l'index et l'alias afin de commencer à indexer des documents.
   À noter que ce script peut aussi être utiliser pour indexer tous les documents en base de donnée.

   ```bash
   docker exec -it $(docker ps -aqf "name=trackdechets_td-api") bash
   npm run reindex-all-bsds-bulk:dev
   ```

7. Accéder aux différents services.

   C'est prêt ! Rendez-vous sur l'URL `UI_HOST` configurée dans votre fichier `.env` (par ex: `http://trackdechets.local`) pour commencer à utiliser l'application ou sur `API_HOST` (par ex `http://api.trackdechets.local`) pour accéder au playground GraphQL.

### Installation alternative sans docker

Vous pouvez également faire tourner l'ensemble des services sans docker. Veillez à utiliser la même version de Node.js que celle spécifiée dans les images Docker. Vous pouvez utiliser [NVM](https://github.com/nvm-sh/nvm) pour changer facilement de version de Node. L'utilisation de fichier `.nvmrc` à la racine du dossier `back` et `front` permet de charger automatiquement la bonne version en faisant `nvm use`.

1. Démarrer `postgres`, `redis`, `elasticsearch@6`, `nginx` et `mongodb` sur votre machine hôte. Exemple de setup sur MacOS avec puce Apple :

- Installer Postgres 14 avec [Postgres.app](https://postgresapp.com) (Postgres 13 n'est pas dispo sur puce Apple, tout semble fonctionner comme il faut sur la version 14)
- Installer `redis`, `nginx`, `mongodb`, `elasticsearch@6` avec `brew` :

```
brew install redis
brew install nginx
brew tap mongodb/brew
brew update
brew install mongodb-community@6.0
brew install elasticsearch@6
```

- Configurer Nginx :

```
# fichier /opt/homebrew/etc/nginx/servers/api.trackdechets.local

server {
    listen 80;
    listen [::]:80;
    server_name api.trackdechets.local;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

#  /opt/homebrew/etc/nginx/servers/notifier.trackdechets.local
server {
    listen 80;
    listen [::]:80;
    server_name notifier.trackdechets.local;

    location / {
        proxy_pass http://localhost:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 4h;
    }
}

# /opt/homebrew/etc/nginx/servers/trackdechets.local
server {
    listen 80;
    listen [::]:80;

    server_name trackdechets.local;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

Pour la configuration `nginx` vous pouvez vous inspirer du fichier `nginx/templates/default.conf.template`.

2. Créer un lien symbolique entre le fichier `.env` et le fichier `back/.env`

```
ln -s /path/to/trackdechets/.env /path/to/trackdechets/back/.env
```

> Il est également possible de démarrer ces trois services avec docker `docker-compose -f docker-compose.dev.yml up postgres redis nginx`. Dans ce cas, l'API doit être démarrée sur le port 4000 pour coller avec la configuration Nginx `API_PORT=4000`.

3. Démarrer l'API

```bash
cd back
npm install
npm run dev
```

4. Démarrer l'UI

```bash
cd front
npm install
npm start
```

5. (Optionnel) Démarrer la documentation

```
cd doc/website
npm install
npm start
```

### Conventions

- Formatage/analyse du code avec prettier et eslint.
- Typage du code avec les fichiers générées par GraphQL Codegen
  - `back/src/generated/graphql/types.ts` pour le back
  - `front/src/generated/graphql/types.ts` pour le front

## Tests unitaires

La commande pour faire tourner tous les tests unitaires est la suivante :

```bash
docker-compose -f docker-compose.test.yml up
```

Il est également possible de faire tourner les tests unitaires sur l'environnement de `dev` en se connectant à chacun des containers. Par exemple :

1. Démarrer les différents services
   ```
   docker-compose -f docker-compose.dev.yml up postgres prisma redis td-api td-ui
   ```
2. Faire tourner les tests back
   ```bash
   docker exec -it $(docker ps -aqf "name=trackdechets_td-api") bash
   npm run test # run all the tests
   npx jest path src/path/to/my-function.test.ts # run only one test
   ```
3. Faire tourner les tests front
   ```bash
   docker exec -it $(docker ps -aqf "name=td-ui") sh
   npm run test # run tests in watch mode
   ```

## Tests d'intégration

Ce sont tous les tests ayant l'extension `.integration.ts` et nécessitant le setup d'une base de données de test.

```bash
cd back/integration-tests
./run.sh # run all the tests at once and exit
```

Il est également possible de faire tourner chaque test de façon indépendante:

```bash
cd back/integration-tests
./run.sh -u # start the containers
./run.sh -r workflow.integration.ts
./run.sh -d # remove the containers
```

## Créer une PR

1. Créer une nouvelle branche à partir et à destination de la branche `dev`.
2. Implémenter vos changements et penser à [mettre à jour la documentation](#documentation) et le [changelog](#changelog) (en ajoutant un bloc "Next release" si il n'existe pas encore).
3. Une fois la PR complète, passer la branche de "draft" à "ready to review" et demander la revue à au moins 1 autre développeur de l'équipe (idéalement 2). Si possible faire un rebase (éviter le merge autant que possible) de la branche `dev` pour être bien à jour et la CI au vert avant la revue.
4. Une fois que la PR est approuvée et que les changements demandées ont été apportées, l'auteur de la PR peut la merger dans `dev`.

Note : l'équipe n'a pas de conventions strictes concernant le nom des branches et les messages de commit mais compte sur le bon sens de chacun.

## Déploiement

Le déploiement est géré par Scalingo à l'aide des fichiers de configuration `Procfile` et `.buildpacks` placés dans le front et l'api.
Chaque update de la branche `dev` déclenche un déploiement sur l'environnement de recette. Chaque update de la branche `master` déclenche un déploiement sur les environnements sandbox et prod. Le déroulement dans le détails d'une mise en production est le suivant:

1. Faire le cahier de recette pour vérifier qu'il n'y a pas eu de régression sur les fonctionnalités critiques de l'application (login, signup, rattachement établissement, invitation collaborateur, création BSD)
2. Balayer le tableau [Favro "Recette du xx/xx/xx"](https://favro.com/organization/ab14a4f0460a99a9d64d4945/02f1ec52bd91efc0adb3c38b) pour vérifier que l'étiquette "Recette OK --> EN PROD" a bien été ajoutée sur toutes les cartes.
3. Mettre à jour le [Changelog.md](./Changelog.md) avec un nouveau numéro de version (versionnage calendaire)
4. Créer une PR `dev` -> `master`
5. Au besoin résoudre les conflits entre `master` et `dev` en fusionnant `master` dans `dev`
6. Faire une relecture des différents changements apportés aux modèles de données et scripts de migration.
7. Si possible faire tourner les migrations sur une copie de la base de prod en local.
8. S'assurer que les nouvelles variables d'environnement (Cf `.env.model`) ont bien été ajoutée sur Scalingo dans les environnements sandbox et prod respectivement pour les applications `front` et `api`
9. Merger la PR et suivre l'avancement de la CI github.
10. Suivre l'avancement du déploiement sur Scalingo respectivement pour le front, l'api et la doc.

## Migrations

Les migrations de base peuvent se faire soit en SQL, soit via des script TypeScript.
Pour le SQL elles sont situées dans `back/prisma/migrations`. Les fichiers sont numérotés dans l'ordre croissant. Ils doivent être nommé `XX_any-namme.sql`.
A noter que une fois que ces migrations ont été jouées, le contenu des fichiers est hashé dans la table migration et il ne faut donc surtout pas les modifier.

Pour les migrations scriptées, c'est dans `back/prisma/scripts`. Les migrations doivent prendre la forme d'une classe, implémentant `Updater` et décorée par `registerUpdater`.
Attention, contrairement aux scripts SQL ces migrations ne sont pas jouées une seules fois. Il faut donc s'assurer qu'elles sont idempotentes, ou les désactiver après chaque mise en production.

Toutes ces migrations sont jouées avec la commande `npm run update:dev`. (sans le suffixe `:dev` en production)

## Guides

### Mettre à jour le changelog

Le [changelog](./Changelog.md) est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et le projet suit un schéma de versionning inspiré de [Calendar Versioning](https://calver.org/).

Il est possible de documenter les changements à venir en ajoutant une section "Next release".

### Mettre à jour la documentation

Les nouvelles fonctionnalités impactant l'API doivent être documentées dans la documentation technique `./doc` en même temps que leur développement. Si possible faire également un post sur le [forum technique](https://forum.trackdechets.beta.gouv.fr/).

### Utiliser un backup de base de donnée

Il est possible d'importer un backup d'une base de donnée d'un environnement afin de le tester en local.
La procédure qui suit aura pour effet de remplacer vos données en local par les données du backup.

#### Procédure automatique de restauration d'une base de donnée de production avec Docker

Un script d'automatisation a été mis en place. Il permet de restaurer soit un backup local, soit le dernier backup de la base de donnée distante choisie.
Pour les backups distants, assurez vous d'avoir correctement configuré les variables d'environnement suivantes dans votre fichier `.env` local:

- `SCALINGO_TOKEN` - clé d'API Scalingo

```bash
$ pwd
~/dev/trackdechets
$ cd scripts
$ sudo chmod +x restore-db.sh # Si le fichier n'est pas exécutable
$ ./restore-db.sh
# Laissez vous guider...
# La première question détermine si vous souhaitez utiliser un backup distant ou local
```

#### Procédure manuelle

1. Télécharger un backup de la base de donnée nommée `prisma` que vous souhaitez restaurer
2. Démarrer le conteneur postgres
   ```
   docker-compose -f docker-compose.dev.yml up --build postgres
   ```
3. Copier le fichier de backup à l'intérieur du conteneur
   ```
   # docker cp <fichier backup> <nom du container postgres>:<chemin où copier>
   # exemple :
   docker cp backup trackdechets_postgres_1:/var/backups
   ```
4. Accéder au conteneur postgres
   ```
   docker exec -it $(docker ps -aqf "name=trackdechets_postgres") bash
   ```
5. Restaurer le backup depus le conteneur postgres
   ```
   dropdb -U trackdechets prisma
   createdb -U trackdechets prisma
   psql -U trackdechets prisma
     psql (13.3)
     Type "help" for help.
     prisma=# create schema default$default
   # quit psql CTRL-D
   pg_restore -U trackdechets -d prisma --clean /var/backups/backup
   ```
6. Quitter le shell du conteneur postgres
7. Appliquer les migrations présentent dans votre branche actuelle du code source

### Créer un tampon de signature pour la génération PDF

Il est possible de créer de nouveaux tampons à partir du fichier [stamp.drawio.png](./pdf/src/medias/stamp.drawio.png).
C'est un fichier PNG valide que l'on peut éditer directement dans Visual Code avec l'extension [Draw.io VS Code Integration](https://marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio)

### Nourrir la base de donnée avec des données par défaut

Il peut être assez fastidieux de devoir recréer des comptes de tests régulièrement en local.
Pour palier à ce problème, il est possible de nourrir la base de donnée Prisma avec des données par défaut.

1. Créer le fichier `back/prisma/seed.dev.ts` en se basant sur le modèle `back/prisma/seed.model.ts`.
2. Démarrer les containers `postgres` et `td-api`
3. (Optionnel) Reset de la base de données
   3.1 Dans le container `postgres `: `psql -U trackdechets -d prisma -c "DROP SCHEMA \"default\$default\" CASCADE;"` pour supprimer les données existantes
   3.2 Dans le container `td-api`: `npx prisma db push --preview-feature` pour recréer les tables
4. Dans le container `td-api`: `npx prisma db seed --preview-feature` pour nourrir la base de données.

### Ajouter une nouvelle icône

Les icônes utilisées dans l'application front viennent de https://streamlineicons.com/.
Nous détenons une license qui nous permet d'utiliser jusqu'à 100 icônes (cf [Streamline Icons Premium License](https://help.streamlineicons.com/license-premium)).

Voilà la procédure pour ajouter une icône au fichier `Icons.tsx` :

1. Se connecter sur streamlineicons.
2. Copier le SVG de l'icône concerné.
3. [Convertir le SVG en JSX](https://react-svgr.com/playground/?expandProps=start&icon=true&replaceAttrValues=%23000%3D%22currentColor%22&typescript=true) et l'ajouter au fichier (adapter le code selon les exemples existants : props, remplacer `width`/`height` et `"currentColor"`).

Pour s'y retrouver plus facilement, suivre la convention de nommage en place et utiliser le nom donné par streamlineicons.

### Reindexer un bordereau individuel

```
   npm run reindex-bsd BSD-XYZ123
```

### Réindexer un type de bordereau

```
   npm run reindex-partial-in-place -- bsdasri -f
```

## Dépannage

### La base de donnée ne se crée pas

Si la commande pour créer la base de données ne fonctionne pas (`npx prisma db push`), il est possible que le symbole $ dans le nom de la base (default$default) pose problème. Deux solutions:

- Encapsulez l'URI de la base avec des guillements simple, ie:
  `DATABASE_URL='postgresql://username:password@postgres:5432/prisma?schema=default$default'`
- Enlevez complètement le paramètre schema:
  `DATABASE_URL=postgresql://username:password@postgres:5432/prisma`

### Je n'arrive pas à (ré)indexer Elastic Search

Vous pouvez vérifier vos indexes Eslastic Search avec la commande suivante:

```
curl -X GET "localhost:9200/_cat/indices"
```

Si les indexes sont incomplets ou si la commande a échoué, vous pouvez vous connecter au container de l'API et passer en mode verbose avant de relancer l'indexation:

```
# Pour se connecter au container de l'API
docker exec -it $(docker ps -qf "name=td-api") bash

export FORCE_LOGGER_CONSOLE=true

npm run reindex-all-bsds-bulk:dev -- -f
```

Si le problème remonté est un "Segmentation fault", il est probable que la mémoire allouée au container soit insuffisante. Vous pouvez contourner le problème en limitant la taille des batches (dans votre .env):

```
BULK_INDEX_BATCH_SIZE=100
```

Vous pouvez également augmenter la taille mémoire allouée au container Docker, dans un fichier `docker-compose.override.yml` placé à la racine du répo:

```
[...]
  postgres:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 128M
[...]
  elasticsearch:
    environment:
      - "ES_JAVA_OPTS=-Xms1G -Xmx1G"
[...]
```
