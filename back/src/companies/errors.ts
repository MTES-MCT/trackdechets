import { UserInputError } from "apollo-server-express";

export class CompanyNotFound extends UserInputError {
  constructor() {
    super(`Cet établissement n'existe pas dans Trackdéchets`);
  }
}
