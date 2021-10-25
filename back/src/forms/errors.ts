import { UserInputError, ForbiddenError } from "apollo-server-express";

export class InvalidTransition extends UserInputError {
  constructor() {
    super("Vous ne pouvez pas passer ce bordereau à l'état souhaité.");
  }
}

export class InvalidWasteCode extends UserInputError {
  constructor(wasteCode: string) {
    super(
      `Le code déchet "${wasteCode}" n'est pas reconnu comme faisant partie de la liste officielle du code de l'environnement.`
    );
  }
}

export class InvalidProcessingOperation extends UserInputError {
  constructor() {
    super("Cette opération d’élimination / valorisation n'existe pas.");
  }
}

export class MissingTempStorageFlag extends UserInputError {
  constructor() {
    super(
      `Le champ recipient.isTempStorage doit être "true" lorsqu'un entreprosage provisoire est précisé.`
    );
  }
}

export class NotFormContributor extends ForbiddenError {
  constructor(msg: string) {
    super(msg);
  }
}

export class FormNotFound extends UserInputError {
  constructor(id: string) {
    super(`Le bordereau avec l'identifiant "${id}" n'existe pas.`);
  }
}

export class MissingIdOrReadableId extends UserInputError {
  constructor() {
    super(
      "L'id ou le readableId doit être fourni pour identifier le bordereau."
    );
  }
}

export class CountryNotFound extends UserInputError {
  constructor(code: string) {
    super(
      `Le code "${code}" n'est pas reconnu comme un code pays ISO 3166-1 alpha-2.`
    );
  }
}

export class InvaliSecurityCode extends ForbiddenError {
  constructor() {
    super("Le code de signature est invalide.");
  }
}

export class TemporaryStorageCannotReceive extends UserInputError {
  constructor() {
    super(
      "Ce bordereau ne peut pas être marqué comme reçu car le destinataire " +
        "est une installation d'entreposage provisoire ou de reconditionnement. " +
        "Utiliser la mutation markAsTempStored pour marquer ce bordereau comme entreposé provisoirement"
    );
  }
}

export class DestinationCannotTempStore extends UserInputError {
  constructor() {
    super(
      "Ce bordereau ne peut pas être marqué comme entreposé provisoirement " +
        "car le destinataire n'a pas été identifié comme étant une installation d'entreposage " +
        "provisoire ou de reconditionnement"
    );
  }
}

export class HasSegmentToTakeOverError extends UserInputError {
  constructor() {
    super(
      "Vous ne pouvez pas passer ce bordereau à l'état souhaité, il n'est pas encore pris en charge par le dernier transporteur"
    );
  }
}

export class FormAlreadyInAppendix2 extends UserInputError {
  constructor(id: string) {
    super(
      `Le bordereau ${id} est déjà associé à un autre bordereau dans le cadre d'un regroupement avec annexe 2`
    );
  }
}
