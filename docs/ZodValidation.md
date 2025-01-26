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

- normalisation de l'input et du bordereau déjà existant dans un format zod (ZodBsd). Ce sont les fonctions `prismaToZodBsd` et `graphQlInputToZodBsd`
- merge de l'input (zodInput) et du bordereau existant (zodPersisted)
- vérification qu'aucun champ scellé n'est touché ([checkSealedFields](#champs-scellés-checksealedfields))
- parsing Zod ([parseBsdAsync](#parsing-zod-parsebsdasync))

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
