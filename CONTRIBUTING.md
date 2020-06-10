## Conventions Git

Toutes les fonctionnalités et corrections de bugs doivent être développés sur des branches distinctes à partir de la branche `dev`, puis fusionnés sur `dev` avec une Pull Request. Chaque Pull Request doit faire l'objet d'une revue technique par au moins un autre membre de l'équipe. Si possible faire un rebase de la branche de `dev` avant de soumettre une review et s'assurer que le CI est au vert.

## Changelog

Ajouter les changements inclus dans la PR dans une section *Next release* du [Changelog](./Changelog)

## Documentation

Les nouvelles fonctionnalités impactant l'API doivent être documentées dans la documentation technique `./doc` en même temps que leur développement. Si possible faire également un post sur le [forum technique](https://forum.trackdechets.beta.gouv.fr/).

## Conventions de code

* Formatage du code front et back avec prettier.
* Typage du code avec les fichiers générées par GraphQL Codegen
  * `back/src/generated/graphql/types.ts` pour le back
  * `front/src/generated/graphql/types.ts` pour le front