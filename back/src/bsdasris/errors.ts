import { UserInputError } from "../common/errors";

export class BsdasriNotFound extends UserInputError {
  constructor(id: string) {
    super(`Le bordereau avec l'identifiant "${id}" n'existe pas.`);
  }
}
