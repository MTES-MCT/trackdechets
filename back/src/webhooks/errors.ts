import { UserInputError } from "../common/errors";

export class WebhookSettingNotFound extends UserInputError {
  constructor(id: string) {
    super(`Le webhook avec l'identifiant "${id}" n'existe pas.`);
  }
}

export class WebhookSettingForbidden extends UserInputError {
  constructor(id: string) {
    super(
      `Le webhook avec l'identifiant "${id}" n'existe pas ou vous n'avez pas les permissions pour y accéder.`
    );
  }
}

export class MissingId extends UserInputError {
  constructor() {
    super("L'id doit être fourni pour identifier cet enregistrement.");
  }
}
