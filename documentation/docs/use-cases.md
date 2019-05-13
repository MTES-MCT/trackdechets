# Cas d'usages

## Création d'un BSD

Pour créer un BSD la première étape est de récupérer un token d'authentification. Vous pouvez vous référer à la page [Mise en route](getting-started.md) pour voir comment faire. Une fois que ce token est récupéré vous serez en mesure decréer un bordereau via la mutation `saveForm(...)`.

Cette mutation prend tout un ensemble de paramètres détaillé dans le type `input FormInput {}`:

```
input FormInput {
  id: ID
  emitter: EmitterInput
  recipient: RecipientInput
  transporter: TransporterInput
  wasteDetails: WasteDetailsInput
  trader: TraderInput
  appendix2Forms: [AppendixFormInput]
}
```

Comme on peut le voir, il contient lui même des "sous-types" d'input.

```
input EmitterInput {
  type: EmitterType
  pickupSite: String
  company: CompanyInput
}

input RecipientInput {
  cap: String
  processingOperation: String
  company: CompanyInput
}
...
```

Ils ne sont pas tous listés ici mais vous retrouverez l'ensemble des définitions de types sur le [playground de l'API](https://api.trackdechets.fr/) dans la partie `SCHEMA` (bandeau sur la droite de l'écran qui se déplie au clic).

Aucun paramètre n'est obligatoire à la création car il est tout à fait possible de créer un bordereau incomplet. 

La propriété `id: ID` sert à identifier le bordereau. Lorsqu'on fait un `saveForm(...) { id }`, Trackdéchets nous renverra l'identifiant du bordereau qu'il vient de créer. Si on souhaite récupérer ce bordereau par la suite ou le modifier, c'est sur cet identifiant qu'il faudra se baser. Une édition de ce même bordereau appelerait ainsi la mutation `saveForm({id: "<ID>" ...}) { ... }`
