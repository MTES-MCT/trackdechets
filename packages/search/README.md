# trackdechets-search

In a nutshell : it's an indexation and search library (TS) for [INSEE's open data](https://www.insee.fr/fr/information/1896441)

Objectif : contruire un moteur de recherche d'établissements français et par la suite étrangers à l'usage du service [trackdechets](https://github.com/MTES-MCT/trackdechets/)

## Installation

- Le serveur doit disposer de [node version 14](https://nodejs.org/en/download/), de l'agent [Datadog](https://docs.datadoghq.com/fr/getting_started/agent/)
- Exécutez `npm run build`
- Pour accéder à ElasticSearch sur Scalingo, télécharger le certificat depuis le dashbord Scalingo
- Le placer sous le nom `es.cert` dans `search/dist/common` pour que le client node elasticsearch le prenne en compte

## Usage

## Commandes pour créer ou mettre à jour votre propre index avec ElasticSearch

- En développement : 2 scripts à lancer l'un après l'autre, que ce soit pour créer la 1ère fois ou pour mettre à jour l'index.

```
npm i
```

- Si une archive zip locale des données existe, il est possible de passer outre le téléchargement en passant ces variables d'environnement:

```
export INSEE_SIRET_ZIP_PATH=~/Téléchargements/StockEtablissement_utf8.zip
export INSEE_SIRENE_ZIP_PATH=~/Téléchargements/StockUniteLegale_utf8.zip
```

```
npm run index:dev
```

Au final, vous disposez de l'index "stocketablissement-dev" où les données d'unité légale de l'index Siren (`http://localhost:9201/stockunitelegale-dev/_search`) ont été dupliquées:
`http://localhost:9201/stocketablissement-dev/_search`

Ces index sont des alias et les commandes se chargent de faire un roulement des index à la fin du processus pour ne pas couper le service de l'index en cours de mise à jour.

En cas d'erreur durant l'indexation l'index alias en place n'est pas ecrasé, ce qui permet de continuer en production avec l'index existant sans encombres si l'indexation plante.

Puis de relancer chaque script

- En production, nous avons choisi de fonctionner avec Scalingo pour le serveur ElasticSearch
- Nous conseillons de configurer ElasticSearch à minima avec 4Go de mémoire vive.

## Contenu de l'index `stocketablissement`

(en date de mai 2022)

<details>
 - Réponse sur http://localhost:9200/stocketablissement-production/
  
```json
{
    "stocketablissement-production-1.1.0-1650549309561": {
        "aliases": {
            "stocketablissement-production": {}
        },
        "mappings": {
            "_doc": {
                "dynamic_templates": [
                    {
                        "dateType": {
                            "mapping": {
                                "ignore_malformed": true,
                                "type": "date"
                            },
                            "match": "^date.*$",
                            "match_pattern": "regex"
                        }
                    }
                ],
                "properties": {
                    "activitePrincipaleEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "activitePrincipaleRegistreMetiersEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "activitePrincipaleUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "anneeCategorieEntreprise": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "anneeEffectifsEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "anneeEffectifsUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "caractereEmployeurEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "caractereEmployeurUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "categorieEntreprise": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "categorieJuridiqueUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "codeCedex2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "codeCedexEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "codeCommune2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "codeCommuneEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "codePaysEtranger2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "codePaysEtrangerEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "codePostal2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "codePostalEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "complementAdresse2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "complementAdresseEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "dateCreationEtablissement": {
                        "ignore_malformed": true,
                        "type": "date"
                    },
                    "dateCreationUniteLegale": {
                        "ignore_malformed": true,
                        "type": "date"
                    },
                    "dateDebut": {
                        "ignore_malformed": true,
                        "type": "date"
                    },
                    "dateDernierTraitementEtablissement": {
                        "ignore_malformed": true,
                        "type": "date"
                    },
                    "dateDernierTraitementUniteLegale": {
                        "ignore_malformed": true,
                        "type": "date"
                    },
                    "denominationUniteLegale": {
                        "copy_to": [
                            "td_search_companies"
                        ],
                        "type": "text"
                    },
                    "denominationUsuelle1UniteLegale": {
                        "copy_to": [
                            "td_search_companies"
                        ],
                        "type": "text"
                    },
                    "denominationUsuelle2UniteLegale": {
                        "copy_to": [
                            "td_search_companies"
                        ],
                        "type": "text"
                    },
                    "denominationUsuelle3UniteLegale": {
                        "copy_to": [
                            "td_search_companies"
                        ],
                        "type": "text"
                    },
                    "denominationUsuelleEtablissement": {
                        "copy_to": [
                            "td_search_companies"
                        ],
                        "type": "text"
                    },
                    "distributionSpeciale2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "distributionSpecialeEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "economieSocialeSolidaireUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "enseigne1Etablissement": {
                        "copy_to": [
                            "td_search_companies"
                        ],
                        "type": "text"
                    },
                    "enseigne2Etablissement": {
                        "copy_to": [
                            "td_search_companies"
                        ],
                        "type": "text"
                    },
                    "enseigne3Etablissement": {
                        "copy_to": [
                            "td_search_companies"
                        ],
                        "type": "text"
                    },
                    "etablissementSiege": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "etatAdministratifEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "etatAdministratifUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "identifiantAssociationUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "indiceRepetition2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "indiceRepetitionEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "libelleCedex2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "libelleCedexEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "libelleCommune2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "libelleCommuneEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "libelleCommuneEtranger2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "libelleCommuneEtrangerEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "libellePaysEtranger2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "libellePaysEtrangerEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "libelleVoie2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "libelleVoieEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "nic": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "nicSiegeUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "nomUniteLegale": {
                        "copy_to": [
                            "td_search_companies"
                        ],
                        "type": "text"
                    },
                    "nomUsageUniteLegale": {
                        "copy_to": [
                            "td_search_companies"
                        ],
                        "type": "text"
                    },
                    "nombrePeriodesEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "nombrePeriodesUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "nomenclatureActivitePrincipaleEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "nomenclatureActivitePrincipaleUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "numeroVoie2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "numeroVoieEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "prenom1UniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "prenom2UniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "prenom3UniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "prenom4UniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "prenomUsuelUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "pseudonymeUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "sexeUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "sigleUniteLegale": {
                        "copy_to": [
                            "td_search_companies"
                        ],
                        "type": "text"
                    },
                    "siren": {
                        "copy_to": [
                            "td_search_companies"
                        ],
                        "type": "text"
                    },
                    "siret": {
                        "copy_to": [
                            "td_search_companies"
                        ],
                        "type": "text"
                    },
                    "statutDiffusionEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "statutDiffusionUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "td_search_companies": {
                        "type": "text"
                    },
                    "trancheEffectifsEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "trancheEffectifsUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "typeVoie2Etablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "typeVoieEtablissement": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    },
                    "unitePurgeeUniteLegale": {
                        "fields": {
                            "keyword": {
                                "ignore_above": 256,
                                "type": "keyword"
                            }
                        },
                        "type": "text"
                    }
                }
            }
        },
        "settings": {
            "index": {
                "creation_date": "1650549309611",
                "number_of_replicas": "1",
                "number_of_shards": "5",
                "provided_name": "stocketablissement-production-1.1.0-1650549309561",
                "uuid": "Yd3gHHJSQQGuivJckK-rsA",
                "version": {
                    "created": "6082199"
                }
            }
        }
    }
```
</details>
