# API GraphQL

## Conventions de code

### Terminologie

La terminologie permet de décliner les différentes `queries` et `mutations` de façon cohérente sur les différents types de bordereau. Le nom de chaque bordereau est construit en préfixant le type de déchet tracé par `bs`. Le terme générique utilisé pour désigner n'importe quel type de bordereau est `bsd`.  

* `bsd` - permet de désigner n'importe quel bordereau de façon générique
* `bsdd` - bordereau de suivi des déchets dangereux (CERFA n° 12571\*01) 
* `bsdasri`- bordereau de suivi des déchets d’activités de soins à risques infectieux (Cerfa N°11351\*04)
* `bsvhu`- bordereau de suivi des véhicules hors d'usage 
* `bshfc` - bordereau de suivi des déchets dangereux pour les opérations nécessitant une manipulation de fluides frigorigènes effectuées sur un équipement, prévus aux articles R.543-82 et R.541-45 du code de l'environnement (CERFA n°15497\*02)
* `bsda` - bordereau de suivi des déchets dangereux contenant de l'amiante (CERFA n°11861\*03) 
* `bspa` - bordereau de suivi pour l'élimination des pièces anatomiques (N° 11350\*03)

Une appellation spécifique `bsdnd` pourra être envisagée pour les bordereaux de suivi de déchets non dangereux si cela s'avère nécessaire. 

#### Queries

Deux types de queries existent pour chaque type de BSD:

- `{nom}` pour obtenir un BSD par son identifiant (ex: `bsdd`, `bsdasri`, `bsdvhu`, etc)

```graphql
query {
  bsdasri(id: "id") {
    id
    status
    ...
  }
}
```


- `{nom}s` pour lister les BSD avec possibilité de filtrer et de paginer (ex; `bsdds`, `bsdasris`, `bsvhus`, etc)

```graphql
query {
  bsdasris(
    pagination: { first: 2 }
    where: {
      emitter {
        company: {
          siret: "11111111111111"
        }
      }
    }
  ) {
    id
    status
  }
}
```

Il existe en plus une requête "multi-bordereaux" renvoyant les bordereaux tout type confondu respectant certains critères de recherches:


```graphql
query {
  bsds(search: "World Wide Waste Company"){
    ...on Bsdd {}
    ...on Bsdasri {}
    ...on Bsvhu {}
  } 
}
```



#### Mutations

Les mutations sont construite en préfixant le nom du bordereau par un verbe d'action en camelCase `create{Nom}`, `update{Nom}`, `sign{Nom}`, `delete{Nom}`, etc. Exemple pour la création de bordereaux:

- `createBsdd` 
- `createBsdasri` 
- `createBsvhu`
- `createBsda`
- ...

### Conventions spécifiques aux queries

TODO

### Pagination

Nous suivons la spécification relay permettant de paginer par curseur: https://relay.dev/graphql/connections.htm. Voir aussi https://graphql.org/learn/pagination/
Toutes les requêtes permettant de lister des ressources renvoie un objet de type `Connection`.

```graphql
interface Connection {
  pageInfo: PageInfo
  edges: [Edge]
  totalCount: Int # nombre de résultat en tout
}

type PageInfo {
  hasPreviousPage: Boolean!
  hasNextPage: Boolean!
  startCursor: ID!
  endCursor: ID!
}

interface Edge {
  cursor: ID
}

type PaginationArgs {
  first: Int
  after: ID
  last: Int
  before: ID
}

type Query {
  bsdasris(pagination: PaginationArgs, where: BsdasriWhereInput): BsdasriConnection
}

type BsdasriConnection implements Connection {
  pageInfo: PageInfo
  edges: {
    cursor: ID
    node: Bsdasri
  }
}

```

### Filtres

Pour filtrer une liste, on utilise l'argument `where`. Cette argument est un objet qui peut contenir
différents champs filtrables en fonction du type de BSD.

```graphql
bsdds(where: BsddWhereInput): [Bsdd]

input BsddWhereInput {
  _or: BsddWhereInput
  _and: BsddWhereInput
  _not: BsddWhereInput
  wasteCode: string
  status: FormStatus
  emitterCompanySiret: string
  recipientCompanySiret: string
}
```

#### Opérateurs logique

Il est possible d'utiliser des opérateurs logiques pour combiner des filtres.
Par exemple la requête suivante permet de rechercher tous les bordereaux
non brouillon sur lesquelles l'établissement 85001946400021 apparait soit en tant
qu'émetteur, soit en tant que destinataire.


```graphql
query {
  bsdds(where: {
    _or : {
      emitterCompanySiret: "85001946400021"
      recipientCompanySiret: "85001946400021"
    }
    _not: {
      status: DRAFT
    }
  })
}
```


#### Enums
##### Match strict

```graphql
query {
  bsdds(where: { status: DRAFT })
}

```
##### Contains

```graphql
query {
  bsdds(where: { status_in: [DRAFT, SENT]})
}

```
#### Texte
##### Match strict

```graphql
query {
  bsdds(where: { emitterCompanySiret: "1234567890"})
}
```
##### Contains

```graphql
query {
  bsdds(where: { emitterCompanySiret_contains: "12345"})
}
```

#### Datetimes

##### Match strict

```graphql
query {
  bsdds(where: { updatedAt: "<date>"})
}
```
##### LT, LTE, GT, GTE

```graphql
query {
  bsdds(where: { updatedAt_gt: "<date>"})
}
```

```graphql
query {
  bsdds(where: { updatedAt_lt: "<date>"})
}
```

```graphql
query {
  bsdds(where: { updatedAt_lte: "<date>"})
}

```

### Recherche textuel

Certaines queries acceptent un paramètre permettrant de filtrer les résultats selon des termes.
Bien qu'il s'agisse d'un filtre, celui-ci agit sur différentes colonnes avec un résultat moins déterministe que les filtres classiques.

```graphql
bsds(terms: String): [Bsd!]!

# Exemple avec des filtres
bsds(terms: String, where: BsdWhereInput): [Bsd!]!
```

### Conventions spécifiques aux mutations

### Arguments

On regroupe l'ensemble des arguments d'une mutation dans un seul input à l'exception de l'identifiant du bordereau (le cas échéant)

```graphql
mutation {
  create(input: CreateInput!)
}
mutation {
  sign(id: ID!, input: SignatureInput!)
}
mutation {
  update(id: ID!, input: UpdateInput!)
}
```

### Erreurs

TODO

### Validation pré-action

