import { UserInputError } from "apollo-server-express";

export class DasriNotFound extends UserInputError {
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
