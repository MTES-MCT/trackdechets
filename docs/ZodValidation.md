# Validation Zod

Documentation do pipeline de validation Zod

## Vue d'ensemble

Lors d'une création, update ou signature de bordereau, le flow de validation Zod est assez similaire.

Pour un update, le bordereau existant est récupéré de la DB afin de le merger avec l'input et voir quels champs ont été mis à jour.

Pour une signature, la signature est passée dans le process de valiation afin de vérifier les champs scellés/requis pour cette signature, au lieu de la signature actuelle du bordereau.

Le flow général prenant en compte tous ces éléments est le suivant :

```mermaid
flowchart TD
  subgraph mergeInputAndParseBsvhuAsync["mergeInputAndParseBsdAsync"]
        prismaToZodBsd["prismaToZodBsd"]
        graphQlInputToZodBsd["graphQlInputToZodBsd"]
        mergedBsd@{shape: cross-circ}
        checkSealedFields["checkSealedFields<br>(cf. Champs scellés)"]
        parseBsdAsync["parseBsdAsync<br>(cf. Parsing Zod)"]
        context@{ shape: braces, label: "Context" }
  end
  mergedBsd -->|"mergedBsd (ZodBsd)"| checkSealedFields
  graphQl@{shape: hex, label: GraphQL} -.->|signature input| context
  context ----->|user + signature| parseBsdAsync
  context ---->|user + signature| checkSealedFields
  db1[(Database)] -->|prismaBsd| prismaToZodBsd
  graphQl -->|graphQl input| graphQlInputToZodBsd
  prismaToZodBsd -->|"zodPersisted (ZodBsd)"| mergedBsd
  prismaToZodBsd ---->|"zodPersisted (ZodBsd)"| checkSealedFields
  graphQlInputToZodBsd --->|"zodInput (ZodBsd)"| mergedBsd

  checkSealedFields -->|"mergedBsd (ZodBsd)"| parseBsdAsync
  parseBsdAsync -->|"parsedBsd (ZodBsd)"| update
  update --> db2[(Database)]
```

Les grandes étapes sont :

- normalisation de l'input et du bordereau déjà existant dans un format à plat compatible avec Zod (ZodBsd). Ce sont les fonctions `prismaToZodBsd` et `graphQlInputToZodBsd`
- merge de l'input (zodInput) et du bordereau existant (zodPersisted)
- vérification qu'aucun champ scellé n'est touché ([checkSealedFields](#champs-scellés-checksealedfields))
- parsing Zod ([parseBsdAsync](#parsing-zod-parsebsdasync))
- enregistrement en DB

## Champs scellés (checkSealedFields)

La vérification des champs scellés se fait dans la fonction `checkSealedFields` (qui peut changer de nom en fonction du bordereau, par exemple `checkBsvhuSealedFields`).

Cette vérification prend en entrée le bordereau existant, le bordereau "mergé" qui contient les changements et le contexte qui contient les infos de l'utilisateur + la signature courante.

Cette vérification se base sur un ensemble de règles stockées dans un objet Rules (le nom peut varier selon les bordereau, par ex. bsvhuEditionRules).

Dans leur forme la plus complexe, ces règles ont cette forme:

```js
fieldName: {
    // At what signature the field is sealed, and under which circumstances
    sealed: EditionRule<T>;
    // At what signature the field is required, and under which circumstances. If absent, field is never required
    required?: EditionRule<T>;
    readableFieldName?: string; // A custom field name for errors
    // a path to return in the errors to help the front display the error in context
    path?: EditionRulePath;
  },

// par exemple
  emitterCompanyCity: {
    sealed: {
      /*
      "from" est une fonction, qui peut utiliser le contexte qui
      lui est fourni pour savoir si cette règle doit être activée ou non
      */
      from: sealedFromEmissionExceptForEmitter
    },
    required: {
      /*
      ici "from" est simplement la signature à partir de laquelle
      cette règle est activée
      */
      from: "EMISSION",
      /*
      une condition pour activer cette règle en fonction d'autres
      champs du bordereau
      */
      when: bsvhu => !bsvhu.emitterCompanyAddress
    },
    // un nom de champ lisible pour les erreurs
    readableFieldName: "L'adresse de l'émetteur",
    // le chemin du champ dans les objets GraphQL
    path: ["emitter", "company", "city"]
  },

```

Les champs `readableFieldName` et `path` des règles permettent de renvoyer des erreurs plus explicites à la front. `readableFieldName` sera affiché à l'utilisateur dans l'erreur, et l'erreur peut être affichée précisément dans l'interface grâce à `path`.

Le flow générale de cette validation est le suivant:

```mermaid
flowchart TD

  subgraph checkSealedFields["checkSealedFields"]
    getUpdatedFields["getUpdatedFields"]
    pickRule@{ shape: flip-tri, label: "pick corresponding rule" }
    getCurrentSignatureType@{shape: rect, label: "getCurrentSignatureType + getSignatureAncestors"}
    getBsdUserFunctions@{shape: rect, label: "getBsdUserFunctions"}
    subgraph isBsdFieldSealed["isBsdFieldSealed"]
      rule@{ shape: braces, label: "Rule\nfrom: Signature type\nwhen?: condition" }
      check@{shape: cross-circ}
      G{is Sealed?}
    end
  end
  context@{ shape: braces, label: "Context" } -->|signature| getCurrentSignatureType
  context2@{ shape: braces, label: "Context" } -->|user| getBsdUserFunctions
  zodPersisted@{ shape: braces, label: "persisted" } -->|"zodPersisted (ZodBsd)"| getUpdatedFields
  zodPersisted2@{ shape: braces, label: "persisted" } -->|"zodPersisted (ZodBsd)"| getCurrentSignatureType
  zodPersisted3@{ shape: braces, label: "persisted" } -->|"zodPersisted (ZodBsd)"| getBsdUserFunctions
  mergedBsd@{ shape: braces, label: "merged" } --->|"mergedBsd (ZodBsd)"| getUpdatedFields
  rules@{ shape: processes, label: "Rules" } --> pickRule
  getUpdatedFields -->|updated field| pickRule
  rule --> check
  mergedBsd@{ shape: braces, label: "merged" } -->|"mergedBsd (ZodBsd)"| check
  getCurrentSignatureType ---->|"signaturesToCheck<br>(EMISSION|TRANSPORT|OPERATION)[]"| check
  getBsdUserFunctions ----> |"userFunctions (user roles)<br>{isEmitter: bool, isTransporter: bool,...}"| check
  pickRule -->|rule for the updated field| rule

  check --> G
  G -->|"yes (reject)"| errors@{ shape: braces, label: "SealedFieldError" }
  G -->|"no (resolve)"| updatedFields@{ shape: braces, label: "updatedFields" }
```

## Parsing Zod (parseBsdAsync)

Le principe de zod est de créer un schéma qui contient des règles de validation/transformation. Ce schéma expose ensuite des fonctions (`schema.parse` et `schema.parseAsync`) auxquelles on passe le bordereau dans son format ZodBsd (voir ci-dessus).
Ces fonctions vont faire passer le bordereau à travers les étapes de validation et transformation, puis renvoyer un ParsedZodBsd. ce bordereau peut ensuite être mis en DB.

En cas d'erreur de validation, une erreur est ajoutée à une liste d'erreurs, qui est renvoyée une fois la validation terminée.

Ces erreurs sont de la forme:

```js
{
  code: z.ZodIssueCode.custom, // custom pour les erreurs renvoyées depuis des fonctions custom, ou plus précis (ex: invalid_type) pour les erreurs créées par des validateurs Zod
  path: ["weight", "value"], // le chemin du champ dans les objets GraphQL
  message: "Le poids doit être supérieur à 0" // un message à afficher en front en cas d'erreur
}
```

Voilà le schéma des différents composants de validation qui sont inclus dans nos schéma Zod :

```mermaid
flowchart TD

  subgraph parseAsync["parseAsync"]
    subgraph parse["parse"]
      rawSchema@{ shape: subproc, label: "rawSchema\nvalidation statique\n(string, not null, enum, ...)" }

      subgraph refinedSchema["refinedSchema"]
        checkWeights["checkWeights"]
        checkOperationMode["checkOperationMode"]
        otherRefinements["..."]
      end
      subgraph contextualSyncSchema["contextualSyncSchema"]
        transformSync["sync transformers<br>(fillIntermediariesOrgIds, ...)"]
        checkRequiredFields["checkRequiredFields"]
      end
    end
    subgraph contextualAsyncSchema["contextualAsyncSchema"]
      checkCompanies["checkCompanies"]
      transformAsync["async transformers<br>(sirenify, recipify,...)"]
      checkRequiredFields2["checkRequiredFields<br>(en cas de modif par transformers)"]
    end
  end
  context@{ shape: braces, label: "Context" } -->|user + signature| contextualSyncSchema
  context -->|user + signature| contextualAsyncSchema
  mergedBsd@{ shape: braces, label: "mergedBsd"} -->|"mergedBsd (ZodBsd)"| rawSchema
  rawSchema --> checkWeights
  checkWeights --> checkOperationMode
  checkOperationMode --> otherRefinements
  otherRefinements --> transformSync
  transformSync --> checkRequiredFields
  checkRequiredFields --> checkCompanies
  checkCompanies --> transformAsync
  transformAsync --> checkRequiredFields2
  checkRequiredFields2 --> parsedBsd@{ shape: braces, label: "parsedBsd" }
  style parse stroke:#e00,color:#e00
  style parseAsync stroke:#0e0,color:#0e0
```

- **rawScema** est une déclaration de règles de validation simples nativement supportées par Zod (vérification de type, null/not null, enum,...).
- **refinedSchema** vient enrichir le rawScema avec des "refinements", qui permette d'appliquer des règles de validation métier. par exemple `checkOperationMode` va valider que le mode d'opération est compatible avec le code d'opération du bordereau. Ces validations peuvent utiliser plusieurs champs du bordereau à la fois, contrairement aux règles du rawSchema qui ne traitent qu'un champ à la fois.
- **contextualSyncSchema** contient des fonctions de validation et des transformations qui prennent en compte le "contexte", c'est à dire l'utilisateur faisant la modification, ainsi que la signature en cours. C'est dans cette section que se fait la validation des champs requis (`checkRequiredFields`). Celle-ci fonctionne de manière semblable à la validation des champs scellés ([checkSealedFields](#champs-scellés-checksealedfields))
- **contextualAsyncSchema** contient des fonctions de validation et transformation qui demandent de faire des requêtes en DB

  - `sirenify` qui vient compléter les infos d'entreprise
  - `recipify` qui vient compléter les infos de récépissé des acteurs,...)
  - `checkCompanies` qui valide que les établissements désignés sur le bordereau ont bien les autorisations pour agir dessus

  A la fin de ces transformations, on repasse par `checkRequiredFields` pour vérifier que des champs requis n'ont pas disparu.
