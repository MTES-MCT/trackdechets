# trackdechets-search

In a nutshell : it's an indexation and search library (TS) for [INSEE's open data](https://www.insee.fr/fr/information/1896441)

Objectif : contruire un moteur de recherche d'établissements français et par la suite étrangers à l'usage du service [trackdechets](https://github.com/MTES-MCT/trackdechets/)

## Installation

Ce module fait partie du Yarn Workspace 'trackdechets', dossier parent.

Pour l'utiliser dans un autre module du workspace:
- ajouter le chemin `search` dans le tsconfig.json
```
"references": [
    {
      "path": "../search"
    }
  ]
```
`yarn add '@trackdechets/search'`

## Usage

## Commandes pour créer ou mettre à jour votre propre index avec ElasticSearch

- En développement : 2 scripts à lancer l'un après l'autre, que ce soit pour créer la 1ère fois ou pour mettre à jour l'index.

```
yarn
```

```
cp .env.model .env
```

- Si une archive zip locale des données existe, il est possible de passer outre le téléchargement en passant ces variables d'environnement:

```
export INSEE_SIRET_ZIP_PATH=~/Téléchargements/StockEtablissement_utf8.zip
export INSEE_SIRENE_ZIP_PATH=~/Téléchargements/StockUniteLegale_utf8.zip
```

```
yarn index:dev
```

Au final, vous disposez de l'index "stocketablissement_utf8-dev" où les données d'unité légale de l'index Siren (`http://localhost:9200/stockunitelegale_utf8-dev/_search`) ont été dupliquées:
`http://localhost:9200/stocketablissement_utf8-dev/_search`

Ces index sont des alias et les commandes se chargent de faire un roulement des index à la fin du processus pour ne pas couper le service de l'index en cours de mise à jour.

En cas d'erreur durant l'indexation l'index alias en place n'est pas ecrasé, ce qui permet de continuer en production avec l'index existant sans encombres si l'indexation plante.

- Si une archive zip locale des données existe, il est possible de passer le téléchargement en passant ces variables d'environnement:

```
export INSEE_SIRET_ZIP_PATH=~/Téléchargements/StockEtablissement_utf8.zip
export INSEE_SIRENE_ZIP_PATH=~/Téléchargements/StockUniteLegale_utf8.zip
```
Puis de relancer chaque script

- En production, nous avos choisi de configurer l'environnement pour fonctionner avec Scalingo
- Nous conseillons de configurer ElasticSearch à minima avec 1G de mémoire, ce qui est le cas dans le `docker-compose.yml`

## Utiliser les fonctions recherche de ce client

- TODO

```
yarn add '@trackdechets/search'
import { searchEtablissements } from "trackdechets-search"
...
```
