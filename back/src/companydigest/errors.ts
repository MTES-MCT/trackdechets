import { UserInputError } from "../common/errors";

export class CompanyDigestNotFound extends UserInputError {
  constructor(id: string) {
    super(`La fiche d'inspection avec l'identifiant "${id}" n'existe pas.`);
  }
}
