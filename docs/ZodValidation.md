# Validation Zod

La validation et le parsing des données entrantes est gérée en interne par la librairie Zod.

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

## Parsing Zod (parseBsdAsync)

Le principe de zod est de créer un schéma qui contient des règles de validation/transformation.

La déclaration d'un schéma Zod pour un type de bordereau donnée se fait en composant plusieurs étapes :

- Déclaration d'un schéma de validation "statique" permettant de définir les types de chaque champ et des règles de validation simples (ex: un email doit ressembler à un email, un SIRET doit faire 14 caractères, il peut y avoir au maximum 2 plaques d'immatriculations) ainsi que des valeurs par défaut.
- Déclaration de règles de validation plus complexes (via la méthode `superRefine`) faisant intervenir plusieurs champs ou des appels asynchrones à la base de données (ex: la raison du refus doit être renseignée si le déchet est refusé, la date de l'opération doit être postérieure à la date de l'acceptation, les identifiants des bordereaux à regrouper doivent correspondre à des bordereaux en attente de regroupement, etc).
- Déclaration de `transformers` permettant de modifier les données (ex: auto-compléter les récépissés transporteurs à partir de la base de données, auto-compléter le nom et l'adresse à partir de la base SIRENE, etc).

#### Inférence du type

Le schéma ainsi obtenu permet de centraliser tout le process de validation et de transformation des données et Zod nous permet d'inférer deux types :

- le type attendu en entrée du parsing Zod (noté ZodBsd ici)
- le type obtenu en sortie du parsing Zod (noté ParsedZodBsd)

Ces types nous servent de "pivots" entre les données entrantes provenant de la couche GraphQL et le format de données de la couche Prisma.

Ce schéma expose ensuite des fonctions (`schema.parse` et `schema.parseAsync`) auxquelles on passe le bordereau dans son format ZodBsd (voir ci-dessus).
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
- **contextualSyncSchema** contient des fonctions de validation et des transformations qui prennent en compte le "contexte", c'est à dire l'utilisateur faisant la modification, ainsi que la signature en cours. C'est dans cette section que se fait la validation des champs requis (`checkRequiredFields`). Celle-ci fonctionne de manière semblable à la validation des champs scellés décrite ci-dessous ([checkSealedFields](#champs-scellés-checksealedfields))
- **contextualAsyncSchema** contient des fonctions de validation et transformation qui demandent de faire des requêtes en DB

  - `sirenify` qui vient compléter les infos d'entreprise
  - `recipify` qui vient compléter les infos de récépissé des acteurs,...)
  - `checkCompanies` qui valide que les établissements désignés sur le bordereau ont bien les autorisations pour agir dessus

  A la fin de ces transformations, on repasse par `checkRequiredFields` pour vérifier que des champs requis n'ont pas disparu.

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

## Usage et exemples

### Utilisation des les mutations `create` et `update`

Deux méthodes permettant respectivement de convertir les données GraphQL ou les données Prisma vers le format Zod :

- `graphQlInputToZodBsd(input: GraphQLBsdInput): ZodBsd` : permet de convertir les données d'input GraphQL vers le format Zod.
- `prismaToZodBsda(bsd: PrismaBsd): ZodBsd` : permet de convertir les données

Dans le cas d'une mutation de création, une version simplifiée du process pourra ressembler à :

```typescript
function createBsdResolver(_, { input }: MutationCreateBsdArgs, context: GraphQLContext) {
  const user = checkIsAuthenticated(context);
  await checkCanCreate(user, input);
  const zodBsd = await graphQlInputToZodBsd(input);
  const bsd = await parseBsdAsync(
    { ...zodBsd, isDraft },
    {
      user,
      //
      currentSignatureType: !isDraft ? "EMISSION" : undefined
    }
  );
  const bsdData: Prisma.CreateBsdInput = {...
   // calcule ici le payload prisma à partir des données
   // obtenues en sortie de parsing, il faut notament gérer
   // la création / connexion / déconnexion d'objets liés (ex: transporteurs, packagings, etc).
  }
  const created = await repository.create({data: bsdData})


    // [...]
}
```

Dans le cas d'une mutation d'update, on ne peut pas simplement valider les données entrantes, il faut aussi vérifier que le bordereau obtenu suite à l'update sera toujours valide. En effet beaucoup de règles de validation s'appliquent sur plusieurs champs, si je modifie un des champ je veux m'assurer que sa valeur est toujours cohérente avec les données persistées en base. Je dois par ailleurs vérifier qu'on n'est pas en train de modifier un champ qui a été verrouillée par signature tout en permettant de renvoyer les mêmes données. On passe alors par une méthode dont la signature est la suivante :

```typescript
type Output = {
  parsedBsd: ParsedZodBsd;
  updatedFields: string[];
};

function mergeInputAndParseBsdAsync(persisted: PrismaBsd, input: GraphQLBsdInput, context: BsdValidationContext): Output {
  const zodPersisted = prismaToZodBsd(persisted);
  const zodInput = await graphQlInputToZodBsd(input);

  // On voit ici l'utilité du schéma Zod comme type pivot entre les données
  // entrantes de la couche GraphQL et les données de la couche prisma
  const bsd: ZodBsff = {
    ...zodPersisted,
    ...zodInput
  };

  // Calcule la signature courante à partir des données si elle n'est
  // pas fourni via le contexte
  const currentSignatureType = context.currentSignatureType ?? getCurrentSignatureType(zodPersisted);

  const contextWithSignature = {
    ...context,
    currentSignatureType
  };

  // Vérifie que l'on n'est pas en train de modifier des données
  // vérrouillées par signature.
  const updatedFields = await checkBsdSealedFields(
    zodPersisted
    bsd,
    contextWithSignature
  );

  const parsedBsd = await parseBsdAsync(bsd, contextWithSignature);

  return { parsedBsff, updatedFields };
}
```

Le workflow simplifié dans la mutation d'`update` ressemble alors à ça :

```typescript
function updateBsdResolver(_, { id, input }: MutationUpdateBsdArgs, context: GraphQLContext) {

   const user = checkIsAuthenticated(context);
   await checkCanUpdate(user, input);

   const persisted = await getBsdOrNotFound({id})

   const { parsedBsd, updatedFields } = mergeInputAndParseBsdAsync(persisted, input, {})

   if (updatedFields.length === 0){
      // évite de faire un update "à blanc" si l'input ne modifie rien
      return expandBsdFromDb(persisted)
   }

  const bsdData: Prisma.CreateBsdInput = {...
   // calcule ici le payload prisma à partir des données
   // obtenues en sortie de parsing, il faut notament gérer
   // la création / connexion / déconnexion d'objets liés (ex: transporteurs, packagings, etc).
  }
  const updated = await repository.update({ data: bsdData })

  // [...]
}
```

### Utilisation dans les mutations `sign`

Une modification de signature ne modifie pas les données mais nécessite quand même de réaliser le parsing car on va vérifier que les données sont toujours cohérentes avec le type de signature apposée, pour vérifier par exemple que les champs requis à cette étape sont bien présents. La signature courant est alors passée explicitement via le contexte de validation.

```typescript
function signBsdResolver(_, { id, input }: MutationUpdateBsdArgs, context: GraphQLContext) {
  const user = checkIsAuthenticated(context);
  await checkCanSign(user, input);

  const persisted = await getBsdOrNotFound({ id: input.id });

  const signatureType = getBsdSignatureType(input.type);

  const zodBsd = prismaToZodBsd(persisted);

  // Check that all necessary fields are filled
  await parseBsdAsync(zodBsd, {
    user,
    currentSignatureType: signatureType
  });

  const signed = await repository.update({ data: { ...input, signatureDate: new Date() } });
}
```
