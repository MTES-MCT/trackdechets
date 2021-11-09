# Trackdéchets

**Gérer la traçabilité des déchets en toute sécurité**

<img height="100px" style="margin-right: 20px" src="./front/public/trackdechets.png" alt="logo"></img>
<img height="100px" src="./front/public/marianne_mte.svg" alt="logo"></img>

Dépôt de code du projet **Trackdéchets** incubée à la Fabrique Numérique du Ministère de la Transition Écologique.

Ce `README` s'adresse aux intervenant·es techniques sur le projet. Pour plus d'infos en tant qu'utilisateur.ice du produit ou de l'API, vous pouvez consulter les liens suivants:

- [Site web](https://trackdechets.beta.gouv.fr)
- [FAQ](https://faq.trackdechets.fr/)
- [Documentation technique de l'API](https://developers.trackdechets.beta.gouv.fr)
- [Forum technique](https://forum.trackdechets.beta.gouv.fr)



## Architecture logicielle

Le projet est constitué de trois briques logicielles principales :

| | back  | front | doc |
|:---------------| :--------------- |:---------------| :-----|
| Description | API Trackdéchets | Interface graphique (SPA)| Documentation technique |
| Technologies | Node.js <br/> Typescript <br/> Express.js <br/> Apollo Server <br/> Prisma ORM <br/> PostgreSQL </br> Elasticsearch | React.js <br/> Typescript <br/> Apollo Client | Docusaurus |

## Dépôts de code connexes

- [trackdechets-website](https://github.com/MTES-MCT/trackdechets-website) (site web statique https://trackdechets.beta.gouv.fr/)
- [trackdechets-backups ](https://github.com/MTES-MCT/trackdechets-backups) (jobs cron permettant de réaliser des backups des bases de données sur une autre infra)
- [trackdechets-metabase](https://github.com/MTES-MCT/trackdechets-metabase) (guide d'administration de metabase permettant de visualiser les données)
- [trackdechets-etl](https://github.com/MTES-MCT/trackdechets-etl) (script d'import des données ICPE)

## Services externes

l'API Trackdéchets fait appel à plusieurs services externes :
- API SIRENE de l'INSEE.
- API SIRENE etalab `entreprise.data.gouv.fr` (en redondance de l'API INSEE).
- Sendinblue pour l'envoi d'e-mails transactionnels.
- MySendingBox pour l'envoi de courrier papier.
- Serveur Gotenberg (auto-hébergé) pour le rendu des PDFs
- Serveur Metabase (auto-hebergé) pour les analytics
## Infrastructure

L'applicatif et les bases de données sont hebergées en mode PaaS chez Scalingo.

![Infra TD](https://user-images.githubusercontent.com/2269165/140944341-b6a4499b-738a-4762-bfa9-14d7a0bab377.png)


## Outillage

- [Github Actions](https://github.com/features/actions) pour l'intégration continue et le déploiement
- [Sentry](https://sentry.io) pour le reporting des erreurs
- [Datadog](https://www.datadoghq.eu) pour le monitoring
- [Graylog](https://www.graylog.org/) pour l'indexation des logs
- [Metabase](https://www.metabase.com/) pour l'analyse et la visualisation des données Trackdéchets
- [Matomo](https://fr.matomo.org/) pour l'analyse du traffic web
- [Updown](https://updown.io/) pour la page de statuts et les alertes
- [graphql-codegen](https://graphql-code-generator.com/) pour générer la référence de l'API et le typage Typescript à partir des fichiers de définition GraphQL.


## Environnements

Trois environnements sont déployés en parallèle :
- Recette (usage interne pour les tests de l'équipe)
  - back : https://api.trackdechets.fr
  - front : https://recette.trackdechets.fr
- Sandbox (environnement "bac à sable" pour les intégrateurs)
  - back : https://api.sandbox.trackdechets.beta.gouv.fr
  - front : https://sandbox.trackdechets.beta.gouv.fr
- Production
  - back : https://api.trackdechets.beta.gouv.fr
  - front : https://app.trackdechets.beta.gouv.fr
## Monitoring

Deux pages de monitoring sont accessibles:
- [Statut API GraphQL Production](https://status.trackdechets.beta.gouv.fr)
- [Statut API GraphQL Sandbox](https://status.sandbox.trackdechets.beta.gouv.fr)

## Compatibilité navigateur

Le support des navigateurs est configuré dans le fichier [`./front/.browserslistrc`](./front/.browserslistrc). La liste des navigateurs correspondant à cette config est [la suivante](https://browserl.ist/?q=%3E+0.1%25%2C+not+dead%2C+not+op_mini+all%2C+ie+11)

## Contribuer

Voir les conventions et bonnes pratiques sur [CONTRIBUTING.md](./CONTRIBUTING.md)

## L'équipe

La liste des contributeurs au projet est disponible sur [AUTHORS.md](./AUTHORS.md)

## Licence

[GNU Affero General Public License v3.0 ou plus récent](https://spdx.org/licenses/AGPL-3.0-or-later.html)
