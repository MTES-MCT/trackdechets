import { ForbiddenError } from "apollo-server-express";

export class AnonymousCompanyError extends ForbiddenError {
  constructor() {
    super(
      `Les informations de cet établissement ne sont pas disponibles car son propriétaire` +
        ` a choisi de ne pas les rendre publiques lors de son enregistrement au Répertoire des Entreprises et des Établissements (SIRENE)`
    );
  }
}
