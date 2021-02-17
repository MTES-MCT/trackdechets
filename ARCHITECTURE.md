# API GraphQL

## Conventions de code

### Nommage

* Les queries et mutations sont préfixées avec le nom du type de BSD:
  * `bsd*` pour le bordereau de suivi des déchets dangereux "générique" (CERFA n° 12571*01)
  * `bsdDasri*` pour le bordereau de suivi des déchets d'activités de soins à risque infectieux
  * `bsdVhu*` pour le bordereau de suivi des véhicules hors d'usage
  * `bsdHfc*` pour le bordereau de suivi de déchets fluides frigorigènes (CERFA n° 12497*02)
  * `bsdAmiante*` pour le bordereau de suivi des déchets dangereux contenant de l'amiante (CERFA n°11861*03)
  * `bsdPah*` pour le bordereau de suivi de l'élimination des pièces anatomiques humaines (CERFA N° 11350*03)

#### Queries

Deux types de queries existent pour chaque type de BSD:

- `{prefix}` pour obtenir un BSD par son identifiant (ex: `bsd`, `bsdDasri`, `bsdVhu`, etc)
- `{prefix}List` pour lister les BSD avec possibilité de filtrer et de paginer (ex; `bsdList`, `bsdDasriList`, `bsdVhuList`, etc)

#### Mutations

Trois types de mutations existent pour chaque type de BSD:

- `{prefix}Create` pour la création d'un BSD
- `{prefix}Update` pour la mise à jour des informations d'un BSD sélectionné par son identifiant
- `{prefix}Sign` pour signer un BSD sélectionné par son identifiant

### Conventions spécifiques aux queries

TODO

### Pagination

TODO

### Filtres

Pour filtrer une liste, on utilise l'argument `filter`. Cette argument est un objet qui peut contenir
différents champs filtrables en fonction du type de BSD.

```graphql
bsdList(filter: BsdFilter): [Bsd]

input BsdFilter {
  wasteCode: string
  status: FormStatus
  emitterCompanySiret: string
  recipientCompanySiret: string
}
```

Certains champs filtrables sont communs à l'ensemble des BSD:

- wasteCode
- status
- emitterCompanySiret
- recipientCompanySiret
- ... // TODO


#### Enums
##### Match strict

```graphql
query {
  bsdList(filter: { status: DRAFT })
} 

```
##### Contains

```graphql
query {
  bsdList(filter: { status_in: [DRAFT, SENT]})
} 

```
#### Texte
##### Match strict

```graphql
query {
  bsdList(filter: { emitterCompanySiret: "1234567890"})
} 
```
##### Contains

```graphql
query {
  bsdList(filter: { emitterCompanySiret_contains: "12345"}) 
} 
```

#### Datetimes

##### Match strict

```graphql
query {
  bsdList(filter: { updatedAt: "<date>"})
} 
```
##### LT, LTE, GT, GTE

```graphql
query {
  bsdList(filter: { updatedAt_gt: "<date>"})
} 
```

```graphql
query {
  bsdList(filter: { updatedAt_lt: "<date>"})
} 
```

```graphql
query {
  bsdList(filter: { updatedAt_lte: "<date>"})
} 

```

### Recherche textuel

Certaines queries acceptent un paramètre permettrant de filtrer les résultats selon des termes.
Bien qu'il s'agisse d'un filtre, celui-ci agit sur différentes colonnes avec un résultat moins déterministe que les filtres classiques.

```graphql
bsds(terms: String): [Bsd!]!

# Exemple avec des filtres
bsds(terms: String, filter: BsdFilter): [Bsd!]!
```

### Conventions spécifiques aux mutations

### Variables

TODO

### Erreurs

TODO

### Validation pré-action

