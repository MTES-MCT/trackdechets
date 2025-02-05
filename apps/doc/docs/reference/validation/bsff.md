---
title: BSFF
---
| Nom du champ                                             | Chemin GraphQL | Requis à partir de | Requis si                                             | Scellé à partir de                | Scellé si |
| -------------------------------------------------------- | -------------- | ------------------ | ----------------------------------------------------- | --------------------------------- | --------- |
| -                                                        | -              | -                  | -                                                     | EMISSION                          | -         |
| Le type de bordereau                                     | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| La raison sociale de l'émetteur                          | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| Le N°SIRET de l'émetteur                                 | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| L'adresse de l'émetteur                                  | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| La personne à contacter chez l'émetteur                  | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| Le N° de téléphone de l'émetteur                         | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| L'adresse e-mail de l'émetteur                           | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| le champ libre de l'émetteur                             | -              | -                  | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| L'auteur de la signature émetteur                        | -              | TRANSPORT          | -                                                     | EMISSION                          | -         |
| La date de signature de l'émetteur                       | -              | TRANSPORT          | -                                                     | EMISSION                          | -         |
| La date de signature du transporteur                     | -              | RECEPTION          | -                                                     | TRANSPORT                         | -         |
| Le code déchet                                           | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| La description du déchet                                 | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| L'ADR                                                    | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| La quantité totale                                       | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| Le champ estimé ou non                                   | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| La raison sociale de l'installation de destination       | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| Le N°SIRET de l'installation de destination              | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| L'adresse de l'installation de destination               | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| La personne à contacter de l'installation de destination | -              | EMISSION           | -                                                     | OPERATION                         | -         |
| Le N° de téléphone de l'installation de destination      | -              | EMISSION           | -                                                     | OPERATION                         | -         |
| Le code d'opération prévu                                | -              | EMISSION           | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| L'adresse e-mail de l'installation de destination        | -              | EMISSION           | -                                                     | OPERATION                         | -         |
| Le CAP de l'installation de destination                  | -              | -                  | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| Le champ libre de l'installation de destination          | -              | -                  | -                                                     | OPERATION                         | -         |
| La date de la réception                                  | -              | RECEPTION          | -                                                     | RECEPTION                         | -         |
| L'auteur de la signature de la réception                 | -              | ACCEPTATION        | -                                                     | RECEPTION                         | -         |
| La date de signature de la réception                     | -              | ACCEPTATION        | -                                                     | RECEPTION                         | -         |
| La liste des fiches d'intervention                       | -              | -                  | -                                                     | EMISSION ou TRANSPORT si émetteur | -         |
| La liste des transporteurs                               | -              | TRANSPORT          | -                                                     | RECEPTION                         | -         |
| La liste des contenants                                  | -              | EMISSION           | il ne s'agit ni d'un groupement ni d'une réexpédition | EMISSION ou TRANSPORT si émetteur | -         |
| La liste des contenants à réexpedier                     | -              | EMISSION           | il s'agit d'une réexpédition                          | EMISSION ou TRANSPORT si émetteur | -         |
| La liste des contenants à grouper                        | -              | EMISSION           | il s'agit d'un groupement                             | EMISSION ou TRANSPORT si émetteur | -         |
| La liste des contenants à regrouper                      | -              | EMISSION           | il s'agit d'un reconditionnement                      | EMISSION ou TRANSPORT si émetteur | -         |
