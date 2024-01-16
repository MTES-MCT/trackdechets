import { ForbiddenError, UserInputError } from "../common/errors";

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

export class FormTransporterNotFound extends UserInputError {
  constructor(id: string) {
    super(`Le transporteur avec l'identifiant "${id}" n'existe pas.`);
  }
}

export class MissingIdOrReadableId extends UserInputError {
  constructor() {
    super(
      "L'id ou le readableId doit être fourni pour identifier le bordereau."
    );
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

export class FormAlreadyInAppendix2 extends UserInputError {
  constructor(id: string) {
    super(
      `Le bordereau ${id} est déjà associé à un autre bordereau dans le cadre d'un regroupement avec annexe 2`
    );
  }
}

// *********************
// COMMON VALIDATION ERROR MESSAGES
// *********************

export const MISSING_COMPANY_NAME = "Le nom de l'entreprise est obligatoire";
export const MISSING_COMPANY_SIRET = "Le siret de l'entreprise est obligatoire";
export const MISSING_COMPANY_VAT =
  "Le numéro de TVA de l'entreprise est obligatoire";
export const MISSING_COMPANY_SIRET_OR_VAT =
  "Le n°SIRET ou le numéro de TVA intracommunautaire est obligatoire";
export const MISSING_COMPANY_ADDRESS =
  "L'adresse de l'entreprise est obligatoire";
export const MISSING_COMPANY_CONTACT =
  "Le contact dans l'entreprise est obligatoire";
export const MISSING_COMPANY_PHONE =
  "Le téléphone de l'entreprise est obligatoire";
export const MISSING_COMPANY_EMAIL = "L'email de l'entreprise est obligatoire";
export const MISSING_COMPANY_OMI_NUMBER =
  "Le numéro OMI (Organisation maritime international) de l'entreprise est obligatoire";
export const INVALID_COMPANY_OMI_NUMBER =
  "Le numéro OMI (Organisation maritime international) de l'entreprise doit se composer des trois lettres OMI suivies de 7 chiffres (ex. OMI1234567)";

export const INVALID_PROCESSING_OPERATION =
  "Cette opération d’élimination / valorisation n'existe pas.";

export const MISSING_PROCESSING_OPERATION =
  "L'opération de traitement est obligatoire";

export const INVALID_WASTE_CODE =
  "Le code déchet n'est pas reconnu comme faisant partie de la liste officielle du code de l'environnement.";

export const EXTRANEOUS_NEXT_DESTINATION = `L'opération de traitement renseignée ne permet pas de destination ultérieure`;

export const INVALID_INDIVIDUAL_OR_FOREIGNSHIP =
  "Ne peut pas être à la fois un particulier et un navire étranger";
