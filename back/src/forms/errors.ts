import { UserInputError, ForbiddenError } from "apollo-server-express";

export class InvalidWasteCode extends UserInputError {
  constructor(wasteCode: string) {
    super(
      `Le code déchet "${wasteCode}" n'est pas reconnu comme faisant partie de la liste officielle du code de l'environnement.`
    );
  }
}

export class MissingTempStorageFlag extends UserInputError {
  constructor() {
    super(
      `Le champ recipient.isTempStorage doit être "true" lorsqu'un entreprosage provisoire est précisé.`
    );
  }
}

export class EcoOrganismeNotFound extends UserInputError {
  constructor(id: string) {
    super(`L'éco-organisme avec l'identifiant "${id}" n'existe pas.`);
  }
}

export class NotFormContributor extends ForbiddenError {
  constructor() {
    super(
      "Vous n'êtes pas autorisé à accéder à un bordereau sur lequel votre entreprise n'apparait pas."
    );
  }
}

export class FormNotFound extends UserInputError {
  constructor(id: string) {
    super(`Le bordereau avec l'identifiant "${id}" n'existe pas.`);
  }
}

export class MissingIdOrReadableId extends UserInputError {
  constructor() {
    super(
      "L'id ou le readableId doit être fourni pour identifier le bordereau."
    );
  }
}

export class CountryNotFound extends UserInputError {
  constructor(code: string) {
    super(
      `Le code "${code}" n'est pas reconnu comme un code pays ISO 3166-1 alpha-2.`
    );
  }
}

export class MissingForeignCountryData extends UserInputError {
  constructor() {
    super(
      `Les paramètres "name" et "address" sont requis dans le cas d'une entreprise étrangère.`
    );
  }
}
