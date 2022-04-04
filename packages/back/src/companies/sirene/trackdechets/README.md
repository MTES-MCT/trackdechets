# Index Établissements Trackdéchets

L'index `stocketablissement_utf-8` est indéxé à partir du StockEtabblissements de l'[insee](https://www.data.gouv.fr/fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/).
Chaque entrée est un Siret et pour chaque Siret sont recopiées les infos de l'unité légale décrite ci-dessous

## Champs Etablissements

| Nom                                            | Libellé                                                                                | Longueur | Type           |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- | -------- | -------------- |
| activitePrincipaleEtablissement                | Activité principale de l'établissement pendant la période                              | 6        | Liste de codes |
| activitePrincipaleRegistreMetiersEtablissement | Activité exercée par l’artisan inscrit au registre des métiers                         | 6        | Liste de codes |
| anneeEffectifsEtablissement                    | Année de validité de la tranche d’effectif salarié de l’établissement                  | 4        | Date           |
| caractereEmployeurEtablissement                | Caractère employeur de l’établissement                                                 | 1        | Liste de codes |
| codeCedex2Etablissement                        | Code cedex de l’adresse secondaire                                                     | 9        | Texte          |
| codeCedexEtablissement                         | Code cedex                                                                             | 9        | Texte          |
| codeCommune2Etablissement                      | Code commune de l’adresse secondaire                                                   | 5        | Liste de codes |
| codeCommuneEtablissement                       | Code commune de l’établissement                                                        | 5        | Liste de codes |
| codePaysEtranger2Etablissement                 | Code pays de l’adresse secondaire pour un établissement situé à l’étranger             | 5        | Liste de codes |
| codePaysEtrangerEtablissement                  | Code pays pour un établissement situé à l’étranger                                     | 5        | Liste de codes |
| codePostal2Etablissement                       | Code postal de l’adresse secondaire                                                    | 5        | Texte          |
| codePostalEtablissement                        | Code postal                                                                            | 5        | Texte          |
| complementAdresse2Etablissement                | Complément d’adresse secondaire                                                        | 38       | Texte          |
| complementAdresseEtablissement                 | Complément d’adresse                                                                   | 38       | Texte          |
| dateCreationEtablissement                      | Date de création de l’établissement                                                    | 10       | Date           |
| dateDebut                                      | Date de début d'une période d'historique d'un établissement                            | 10       | Date           |
| dateDernierTraitementEtablissement             | Date du dernier traitement de l’établissement dans le répertoire Sirene                | 19       | Date           |
| denominationUsuelleEtablissement               | Dénomination usuelle de l’établissement                                                | 100      | Texte          |
| distributionSpeciale2Etablissement             | Distribution spéciale de l’adresse secondaire de l’établissement                       | 26       | Texte          |
| distributionSpecialeEtablissement              | Distribution spéciale de l’établissement                                               | 26       | Texte          |
| enseigne1Etablissement                         | Première ligne d’enseigne de l’établissement                                           | 50       | Texte          |
| enseigne2Etablissement                         | Deuxième ligne d’enseigne de l’établissement                                           | 50       | Texte          |
| enseigne3Etablissement                         | Troisième ligne d’enseigne de l’établissement                                          | 50       | Texte          |
| etablissementSiege                             | Qualité de siège ou non de l’établissement                                             | 5        | Texte          |
| etatAdministratifEtablissement                 | État administratif de l’établissement                                                  | 1        | Liste de codes |
| indiceRepetition2Etablissement                 | Indice de répétition dans la voie pour l’adresse secondaire                            | 1        | Texte          |
| indiceRepetitionEtablissement                  | Indice de répétition dans la voie                                                      | 1        | Texte          |
| libelleCedex2Etablissement                     | Libellé du code cedex de l’adresse secondaire                                          | 100      | Texte          |
| libelleCedexEtablissement                      | Libellé du code cedex                                                                  | 100      | Texte          |
| libelleCommune2Etablissement                   | Libellé de la commune de l’adresse secondaire                                          | 100      | Texte          |
| libelleCommuneEtablissement                    | Libellé de la commune                                                                  | 100      | Texte          |
| libelleCommuneEtranger2Etablissement           | Libellé de la commune de l’adresse secondaire pour un établissement situé à l’étranger | 100      | Texte          |
| libelleCommuneEtrangerEtablissement            | Libellé de la commune pour un établissement situé à l’étranger                         | 100      | Texte          |
| libellePaysEtranger2Etablissement              | Libellé du pays de l’adresse secondaire pour un établissement situé à l’étranger       | 100      | Texte          |
| libellePaysEtrangerEtablissement               | Libellé du pays pour un établissement situé à l’étranger                               | 100      | Texte          |
| libelleVoie2Etablissement                      | Libellé de voie de l’adresse secondaire                                                | 100      | Texte          |
| libelleVoieEtablissement                       | Libellé de voie                                                                        | 100      | Texte          |
| nic                                            | Numéro interne de classement de l'établissement                                        | 5        | Texte          |
| nombrePeriodesEtablissement                    | Nombre de périodes de l’établissement                                                  | 2        | Numérique      |
| nomenclatureActivitePrincipaleEtablissement    | Nomenclature d’activité de la variable activitePrincipaleEtablissement                 | 8        | Liste de codes |
| numeroVoie2Etablissement                       | Numéro de la voie de l’adresse secondaire                                              | 4        | Texte          |
| numeroVoieEtablissement                        | Numéro de voie                                                                         | 4        | Texte          |
| siren                                          | Numéro Siren                                                                           | 9        | Texte          |
| siret                                          | Numéro Siret                                                                           | 14       | Texte          |
| statutDiffusionEtablissement                   | Statut de diffusion de l’établissement                                                 | 1        | Liste de codes |
| trancheEffectifsEtablissement                  | Tranche d’effectif salarié de l’établissement                                          | 2        | Liste de codes |
| typeVoie2Etablissement                         | Type de voie de l’adresse secondaire                                                   | 4        | Liste de codes |
| typeVoieEtablissement                          | Type de voie                                                                           | 4        | Liste de codes |

## Champs Unité légale

| Nom                                       | Libellé                                                                | Longueur | Type           |
| ----------------------------------------- | ---------------------------------------------------------------------- | -------- | -------------- |
| activitePrincipaleUniteLegale             | Activité principale de l’unité légale                                  | 6        | Liste de codes |
| anneeCategorieEntreprise                  | Année de validité de la catégorie d’entreprise                         | 4        | Date           |
| anneeEffectifsUniteLegale                 | Année de validité de la tranche d’effectif salarié de l’unité légale   | 4        | Date           |
| caractereEmployeurUniteLegale             | Caractère employeur de l’unité légale                                  | 1        | Liste de codes |
| categorieEntreprise                       | Catégorie à laquelle appartient l’entreprise                           | 3        | Liste de codes |
| categorieJuridiqueUniteLegale             | Catégorie juridique de l’unité légale                                  | 4        | Liste de codes |
| dateCreationUniteLegale                   | Date de création de l'unité légale                                     | 10       | Date           |
| dateDebut                                 | Date de début d'une période d'historique d'une unité légale            | 10       | Date           |
| dateDernierTraitementUniteLegale          | Date du dernier traitement de l’unité légale dans le répertoire Sirene | 19       | Date           |
| denominationUniteLegale                   | Dénomination de l’unité légale                                         | 120      | Texte          |
| denominationUsuelle1UniteLegale           | Dénomination usuelle de l’unité légale                                 | 70       | Texte          |
| denominationUsuelle2UniteLegale           | Dénomination usuelle de l’unité légale – deuxième champ                | 70       | Texte          |
| denominationUsuelle3UniteLegale           | Dénomination usuelle de l’unité légale – troisième champ               | 70       | Texte          |
| economieSocialeSolidaireUniteLegale       | Appartenance au champ de l’économie sociale et solidaire               | 1        | Liste de codes |
| etatAdministratifUniteLegale              | État administratif de l’unité légale                                   | 1        | Liste de codes |
| identifiantAssociationUniteLegale         | Numéro au Répertoire National des Associations                         | 10       | Texte          |
| nicSiegeUniteLegale                       | Numéro interne de classement (Nic) de l’unité légale                   | 5        | Texte          |
| nombrePeriodesUniteLegale                 | Nombre de périodes de l’unité légale                                   | 2        | Numérique      |
| nomenclatureActivitePrincipaleUniteLegale | Nomenclature d’activité de la variable activitePrincipaleUniteLegale   | 8        | Liste de codes |
| nomUniteLegale                            | Nom de naissance de la personnes physique                              | 100      | Texte          |
| nomUsageUniteLegale                       | Nom d’usage de la personne physique                                    | 100      | Texte          |
| prenom1UniteLegale                        | Premier prénom déclaré pour un personne physique                       | 20       | Texte          |
| prenom2UniteLegale                        | Deuxième prénom déclaré pour un personne physique                      | 20       | Texte          |
| prenom3UniteLegale                        | Troisième prénom déclaré pour un personne physique                     | 20       | Texte          |
| prenom4UniteLegale                        | Quatrième prénom déclaré pour un personne physique                     | 20       | Texte          |
| prenomUsuelUniteLegale                    | Prénom usuel de la personne physique                                   | 20       | Texte          |
| pseudonymeUniteLegale                     | Pseudonyme de la personne physique                                     | 100      | Texte          |
| sexeUniteLegale                           | Caractère féminin ou masculin de la personne physique                  | 1        | Liste de codes |
| sigleUniteLegale                          | Sigle de l’unité légale                                                | 20       | Texte          |
| siren                                     | Numéro Siren                                                           | 9        | Texte          |
| statutDiffusionUniteLegale                | Statut de diffusion de l’unité légale                                  | 1        | Liste de codes |
| trancheEffectifsUniteLegale               | Tranche d’effectif salarié de l’unité légale                           | 2        | Liste de codes |
| unitePurgeeUniteLegale                    | Unité légale purgée                                                    | 5        | Texte          |
