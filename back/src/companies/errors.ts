import { UserInputError } from "apollo-server-express";

export class CompanyNotFound extends UserInputError {
  constructor() {
    super(`Cet établissement n'existe pas dans Trackdéchets`);
  }
}

export class TraderReceiptNotFound extends UserInputError {
  constructor() {
    super(`Ce récépissé négociant n'existe pas`);
  }
}

export class TransporterReceiptNotFound extends UserInputError {
  constructor() {
    super(`Ce récépissé trasnporteur n'existe pas`);
  }
}
