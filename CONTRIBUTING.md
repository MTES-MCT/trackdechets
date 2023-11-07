# Contribuer à Trackdéchets

- [Contribuer à Trackdéchets](#contribuer-à-trackdéchets)
  - [Mise en route](#mise-en-route)
    - [Pré-requis](#pré-requis)
    - [Installation](#installation)
    - [Installation alternative sans docker sur MacOS avec puce Apple](#installation-alternative-sans-docker-sur-macos-avec-puce-apple)
    - [Conventions](#conventions)
  - [Tests unitaires](#tests-unitaires)
  - [Tests d'intégration](#tests-dintégration)
  - [Créer une PR](#créer-une-pr)
  - [Déploiement](#déploiement)
  - [Migrations](#migrations)
  - [Réindexation Elasticsearch des BSDs](#réindexation-elasticsearch-des-bsds)
  - [Guides](#guides)
    - [Mettre à jour le changelog](#mettre-à-jour-le-changelog)
    - [Mettre à jour la documentation](#mettre-à-jour-la-documentation)
    - [Utiliser un backup de base de donnée](#utiliser-un-backup-de-base-de-donnée)
      - [Procédure automatique de restauration d'une base de donnée de production avec Docker](#procédure-automatique-de-restauration-dune-base-de-donnée-de-production-avec-docker)
      - [Procédure manuelle](#procédure-manuelle)
    - [Créer un tampon de signature pour la génération PDF](#créer-un-tampon-de-signature-pour-la-génération-pdf)
    - [Nourrir la base de donnée avec des données par défaut](#nourrir-la-base-de-donnée-avec-des-données-par-défaut)
    - [Ajouter une nouvelle icône](#ajouter-une-nouvelle-icône)
    - [Clefs de signature token OpenID](#clefs-de-signature-token-openid)
    - [Reindexer un bordereau individuel](#reindexer-un-bordereau-individuel)
    - [Réindexer un type de bordereau](#réindexer-un-type-de-bordereau)
  - [Dépannage](#dépannage)
    - [La base de donnée ne se crée pas](#la-base-de-donnée-ne-se-crée-pas)
    - [Je n'arrive pas à (ré)indexer les BSDs sur Elastic Search](#je-narrive-pas-à-réindexer-les-bsds-sur-elastic-search)

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
   127.0.0.1 storybook.trackdechets.local
   ```

   > Pour rappel, le fichier host est dans `C:\Windows\System32\drivers\etc` sous windows, `/etc/hosts` ou `/private/etc/hosts` sous Linux et Mac

   > La valeur des URLs doit correspondre aux variables d'environnement `API_HOST`, `NOTIFIER_HOST`, `UI_HOST`, `DEVELOPERS_HOST`, `STORYBOOK_HOST` et `ELASTIC_SEARCH_HOST`

4. Démarrer les containers de bases de données

   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

   NB: Pour éviter les envois de mails intempestifs, veillez à configurer la variable `EMAIL_BACKEND` sur `console`.

5. Installez les dépendances de l'application localement

   ```bash
   npm install
   ```

6. Synchroniser la base de données avec le schéma prisma.

   Les modèles de données sont définis dans les fichiers `back/prisma/schema.prisma`.
   Afin de synchroniser les tables PostgreSQL, il faut lancer une déploiement prisma

   ```bash
   npx prisma db push --schema back/prisma/schema.prisma
   ```

7. Initialiser l'index Elastic Search.

   Les données sont indexées dans une base de donnée Elastic Search pour la recherche.
   Il est nécessaire de créer l'index et l'alias afin de commencer à indexer des documents.
   À noter que ce script peut aussi être utiliser pour indexer tous les documents en base de donnée.

   ```bash
   npm --prefix back run reindex-all-bsds-bulk:dev
   ```

8. Lancer les services.

   ```bash
   npx nx run-many -t serve
   ```

9. Accéder aux différents services.

   C'est prêt ! Rendez-vous sur l'URL `UI_HOST` configurée dans votre fichier `.env` (par ex: `http://trackdechets.local`) pour commencer à utiliser l'application ou sur `API_HOST` (par ex `http://api.trackdechets.local`) pour accéder au playground GraphQL.

### Installation alternative sans docker sur MacOS avec puce Apple

> L'utilisation de Docker sur MacOS avec puce Apple est problématique car il n'existe pas d'image officielle pour Elasticsearch@6. Par ailleurs des problèmes de networking existe sur l'image Docker utilisée pour le back.

1. Installer `postgres`, `redis`, `elasticsearch@6`, `nginx` et `mongodb`

```
brew install postgresql
brew install redis
brew install nginx
brew tap mongodb/brew
brew update
brew install mongodb-community@6.0
brew install elasticsearch@6
```

2. Installer PostgreSQL 14 avec [Postgres.app](https://postgresapp.com/). Par défaut un utilisateur est crée avec votre nom d'user MacOS et un mot de passe vide.

3. Se connecter à la base PostgresSQL avec la commande `psql` puis créer la DB : `create database prisma`.

4. Lancer les différents services :

```
brew services start redis
brew services start nginx
brew services start mongodb-community
brew services start elasticsearch@6
```

puis vérifier qu'ils tournent avec `brew services list`. Vous pouvez vérifier également que Nginx est bien démarré en allant sur `http://localhost:8080`.

5. Configurer Nginx pour servir l'API, l'UI et le notifier en créant les fichiers suivants :

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

# /opt/homebrew/etc/nginx/servers/storybook.trackdechets.local
server {
   listen 80;
   listen [::]:80;

   server_name storybook.trackdechets.local;

   location / {
      proxy_pass http://localhost:6006;
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

Re-charger la config et redémarrer NGINX

```
brew services reload nginx
brew services restart nginx
```

6. Mapper les différentes URLs sur localhost dans votre fichier `host`

```
# /etc/hosts
127.0.0.1 api.trackdechets.local
127.0.0.1 trackdechets.local
127.0.0.1 notifier.trackdechets.local
127.0.0.1 storybook.trackdechets.local
```

7. Installer `nvm`

```
brew install nvm
nvm install 16.18.1 // version pour le back
nvm install 14.21.1 // version pour le front
echo v16.18.1 > back/.nvmrc
echo 14.21.1 > front/.nvmrc
cd back && nvm use && npm install && npm run generate
cd front && nvm use && npm install
```

8. Ajouter un fichier `.env` dans le répertoire back et un fichier `.env.development` dans le répertoire `front`. (demander à un dev)

9. Pousser le schéma de la base de données dans la table `prisma` et ajouter des données de tests en ajoutant un fichier `seed.dev.ts` dans le répertoire `back/prisma` (demander à un dev) :

```
npx prisma db push --schema back/prisma/schema.prisma
npx prisma db seed --schema back/prisma/schema.prisma
```

10. Créer l'index Elasticsearch : `npm --prefix back run reindex-all-bsds-bulk:dev -- -f`. Puis vérifier qu'un index a bien été crée : `curl localhost:9200/_cat/indices`

11. Créer un utilisateur Mongo :

```
mongosh
> use admin
> db.createUser({user: "trackdechets" ,pwd: "password", roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]})
```

12. Démarrer le `back` et le `front` :

```
npx nx run-many -t serve
```

13. (Optionnel) Démarrer Storybook

```bash
cd front
npm run storybook
```

- URL API : http://api.trackdechets.local/
- URL UI : http://trackdechets.local
- Storybook UI : http://storybook.trackdechets.local

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
   npx nx run back:test # run all the tests
   npx nx run back:test src/path/to/my-function.test.ts # run only one test
   ```
3. Faire tourner les tests front
   ```bash
   npx nx run front:test # run tests in watch mode
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

Toutes ces migrations sont jouées avec la commande `npx nx run back:"update:dev"`. (sans le suffixe `:dev` en production)

## Réindexation Elasticsearch des BSDs

Depuis un one-off container de taille XL

- Réindexation globale sans downtime en utilisant les workers d'indexation
  La réindexation ne sera déclenchée que si la version du mapping ES a changé

`FORCE_LOGGER_CONSOLE=true npx nx run back:reindex-all-bsds-bulk -- --useQueue`

- Réindexation globale sans downtime depuis la console (le travail ne sera pas parallélisé)
  La réindexation ne sera déclenchée que si la version du mapping ES a changé

`FORCE_LOGGER_CONSOLE=true npx nx run back:reindex-all-bsds-bulk`

- Réindexation globale sans downtime en utilisant les workers d'indexation
  Le paramètre -f permet de forcer la réindexation même si le mapping n'a pas changé

`FORCE_LOGGER_CONSOLE=true npx nx run back:reindex-all-bsds-bulk -- --useQueue -f`

- Réindexation globale sans downtime depuis la console (le travail ne sera pas parallélisé)
  Le paramètre -f permet de forcer la réindexation même si le mapping n'a pas changé

`FORCE_LOGGER_CONSOLE=true npx nx run back:reindex-all-bsds-bulk -- -f`

- Réindexation de tous les bordereaux d'un certain type (en place)

`FORCE_LOGGER_CONSOLE=true npx nx run back:reindex-partial-in-place BSFF`

- Réindexation de tous les bordereaux d'un certain type (en supprimant tous les bordereaux de ce type avant)

`FORCE_LOGGER_CONSOLE=true npx nx run back:reindex-partial-in-place -- -f BSFF`

- Réindexation de tous les bordereaux depuis une certaine date (en place)

`FORCE_LOGGER_CONSOLE=true npx nx run back:reindex-partial-in-place -- --since 2023-03-01`

### Réindexation complète sans downtime lors d'une mise en production

- Se rendre sur Scalingo pour augmenter la taille des workers "indexqueue" et leur nombre.
- On peut retenir la configuration suivante :
  - 4 workers indexqueue de taille 2XL
  - BULK_INDEX_BATCH_SIZE=2500
  - BULK_INDEX_JOB_CONCURRENCY=1
- Se connecter à la prod avec un one-off container de taille XL
- Lancer la commande `FORCE_LOGGER_CONSOLE=true npx nx run back:reindex-all-bsds-bulk -- --useQueue -f` (si la version de l'index a été bump, on peut omettre le `-f`)
- Suivre l'évolution des jobs d'indexation sur le dashboard bull, l'URL est visible dans le fichier `src/queue/bull-board.ts``. Il est
  nécessaire de se connecter à l'UI Trackdéchets avec un compte admin pour y avoir accès.
- Relancer au besoin les "indexChunk" jobs qui ont failed (c'est possible si ES se retrouve momentanément surchargé).
- Si les workers d'indexation crashent avec une erreur mémoire, ce sera visible dans les logs Scalingo. Il est possible alors que la taille des chunks soient trop importante. Diminuer alors la valeur BULK_INDEX_BATCH_SIZE, cleaner tous les jobs de la queue avant de relancer une réindexation complète. Il peut être opportun de de diminuer la taille des chunks.
- Si ES est surchargé, il peut être opportun de diminuer le nombre de workers.

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

### Clefs de signature token OpenID

Une clef de signature RSA est nécessaire pour signer les tokens d'identité d'Openid.

```
   openssl genrsa -out keypair.pem 2048
   openssl rsa -in keypair.pem -pubout -out publickey.crt
   openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in keypair.pem -out pkcs8.key
```

Le contenu de pkcs8.key va dans la vairable d'env OIDC_PRIVATE_KEY.
Le contenu de publickey.crt est destiné aux applications clientes d'OpenId connect.

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

### Je n'arrive pas à (ré)indexer les BSDs sur Elastic Search

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
