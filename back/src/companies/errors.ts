import { UserInputError } from "../common/errors";

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

export class BrokerReceiptNotFound extends UserInputError {
  constructor() {
    super(`Ce récépissé courtier n'existe pas`);
  }
}

export class TransporterReceiptNotFound extends UserInputError {
  constructor() {
    super(`Ce récépissé transporteur n'existe pas`);
  }
}

export class VhuAgrementNotFound extends UserInputError {
  constructor() {
    super(`Cet agrément VHU n'existe pas`);
  }
}

export class WorkerCertificationNotFound extends UserInputError {
  constructor() {
    super(`Cette certification d'entreprise de travaux n'existe pas`);
  }
}
