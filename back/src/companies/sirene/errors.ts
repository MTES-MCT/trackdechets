import { ForbiddenError, UserInputError } from "../../common/errors";

export class AnonymousCompanyError extends ForbiddenError {
  constructor() {
    super(
      `Les informations de cet établissement ne sont pas disponibles car son propriétaire` +
        ` a choisi de ne pas les rendre publiques lors de son enregistrement au Répertoire des Entreprises et des Établissements (SIRENE)`
    );
  }
}

export class SiretNotFoundError extends UserInputError {
  constructor() {
    super("Aucun établissement trouvé avec ce SIRET", {
      invalidArgs: ["siret"]
    });
  }
}

export class ClosedCompanyError extends Error {
  constructor() {
    super("Cet établissement est fermé");
  }
}
