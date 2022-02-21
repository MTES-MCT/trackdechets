import { UserInputError } from "apollo-server-core";

export class ApplicationNotFound extends UserInputError {
  constructor(id: string) {
    super(`L'application avec l'identifiant "${id}" n'existe pas.`);
  }
}
