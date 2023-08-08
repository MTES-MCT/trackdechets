import { UserInputError } from "../common/errors";

export class ApplicationNotFound extends UserInputError {
  constructor(id: string) {
    super(`L'application avec l'identifiant "${id}" n'existe pas.`);
  }
}
