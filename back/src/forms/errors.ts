import { UserInputError } from "apollo-server-express";

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
      "Vous ne pouvez pas préciser d'entreposage provisoire sans spécifier recipient.isTempStorage = true"
    );
  }
}
