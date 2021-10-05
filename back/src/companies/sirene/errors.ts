import { ForbiddenError } from "apollo-server-express";

export class AnonymousCompanyError extends ForbiddenError {
  constructor() {
    super(`Cet établissement n'est pas diffusable`);
  }
}
