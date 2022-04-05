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
      - [Procédure automatique avec Docker](#procédure-automatique-avec-docker)
      - [Procédure manuelle](#procédure-manuelle)
    - [Créer un tampon de signature pour la génération PDF](#créer-un-tampon-de-signature-pour-la-génération-pdf)
    - [Nourrir la base de donnée avec des données par défaut](#nourrir-la-base-de-donnée-avec-des-données-par-défaut)
    - [Ajouter une nouvelle icône](#ajouter-une-nouvelle-icône)

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
   127.0.0.1 kibana.trackdechets.local
   ```

   > Pour rappel, le fichier host est dans `C:\Windows\System32\drivers\etc` sous windows, `/etc/hosts` ou `/private/etc/hosts` sous Linux et Mac

   > La valeur des URLs doit correspondre aux variables d'environnement `API_HOST`, `UI_HOST`, `DEVELOPERS_HOST`, `ELASTIC_SEARCH_HOST` et `KIBANA_HOST`

4. Démarrer les containers

   ```bash
   docker-compose -f docker-compose.dev.yml up postgres redis td-api td-ui nginx elasticsearch kibana
   ```

   NB: Pour éviter les envois de mails intempestifs, veillez à configurer la variable `EMAIL_BACKEND` sur `console`.

5. Synchroniser la base de données avec le schéma prisma.

   Les modèles de données sont définis dans les fichiers `back/prisma/schema.prisma`.
   Afin de synchroniser les tables PostgreSQL, il faut lancer une déploiement prisma

   ```bash
   docker exec -it $(docker ps -aqf "name=trackdechets_td-api") bash
   npx prisma db push --preview-feature
   ```

6. Initialiser l'index Elastic Search.

   Les données sont indexées dans une base de donnée Elastic Search pour la recherche.
   Il est nécessaire de créer l'index et l'alias afin de commencer à indexer des documents.
   À noter que ce script peut aussi être utiliser pour indexer tous les documents en base de donnée.

   ```bash
   docker exec -it $(docker ps -aqf "name=trackdechets_td-api") bash
   npm run index-elastic-search:dev
   ```

7. Accéder aux différents services.

   C'est prêt ! Rendez-vous sur l'URL `UI_HOST` configurée dans votre fichier `.env` (par ex: `http://trackdechets.local`) pour commencer à utiliser l'application ou sur `API_HOST` (par ex `http://api.trackdechets.local`) pour accéder au playground GraphQL.

### Installation alternative sans docker

Vous pouvez également faire tourner l'ensemble des services sans docker. Veillez à utiliser la même version de Node.js que celle spécifiée dans les images Docker. Vous pouvez utiliser [NVM](https://github.com/nvm-sh/nvm) pour changer facilement de version de Node.

1. Démarrer `postgres`, `redis`, et `nginx` sur votre machine hôte. Pour la configuration `nginx` vous pouvez vous inspirer du fichier `nginx/templates/default.conf.template`.

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

Le déploiement est géré par CircleCI à l'aide du fichier [./circle/config.yml](.circleci/config.yml).
Chaque update de la branche `dev` déclenche un déploiement sur l'environnement de recette. Chaque update de la branche `master` déclenche un déploiement sur les environnements sandbox et prod. Le déroulement dans le détails d'une mise en production est le suivant:

1. Balayer la colonne Trello "Recette Métier" pour vérifier que l'étiquette "OK PASSAGE EN PROD" a bien été ajouté sur toutes les cartes.
2. Faire le cahier de recette pour vérifier qu'il n'y a pas eu de régression sur les fonctionnalités critiques de l'application (login, signup, rattachement établissement, invitation collaborateur, création BSD)
3. Mettre à jour le Changelog avec un nouveau numéro de version (versionnage calendaire)
4. Créer une PR `dev` -> `master`
5. Au besoin résoudre les conflits entre `master` et `dev` en fusionnant `master` dans `dev`
6. Faire une relecture des différents changements apportés aux modèles de données et scripts de migration.
7. Si possible faire tourner les migrations sur une copie de la base de prod en local.
8. S'assurer que les nouvelles variables d'environnement (Cf `.env.model`) ont bien été ajoutée sur sandbox et prod
9. Merger la PR et suivre l'avancement du déploiement sur le CI
10. Se connecter à l'instance de prod et faire tourner le script `npm run update` dans le container `td-api`. Faire de même sur l'instance sandbox.

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

#### Procédure automatique avec Docker

Un script d'automatisation a été mis en place. Il permet de restaurer soit un backup local, soit le dernier backup de la base de donnée distante choisie.
Pour les backups distants, assurez vous d'avoir correctement configuré les variables d'environnement suivantes dans votre fichier `.env` local:

- `DB_API_ID` - UUID Scaleway de la base de donnée que vous souhaitez restaurer (variable volontairement documentée dans `.env.model`)
- `S3_SECRET_ACCESS_KEY` - clé d'API Scaleway

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

1. Télécharger un backup de la base de donnée `prisma` depuis Scaleway
2. Démarrer le container Postgres
   ```
   docker-compose -f docker-compose.dev.yml up --build postgres
   ```
3. Copier le fichier de backup à l'intérieur du container
   ```
   # docker cp <fichier backup> <nom du container postgres>:<chemin où copier>
   # exemple :
   docker cp backup trackdechets_postgres_1:/var/backups
   ```
4. Accéder au container Postgres
   ```
   docker exec -it $(docker ps -aqf "name=trackdechets_postgres") bash
   ```
5. Restaurer le backup
   ```
   # pg_restore -U trackdechets -d prisma --clean <fichier backup>
   # exemple :
   pg_restore -U trackdechets -d prisma --clean /var/backups/backup
   ```

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
