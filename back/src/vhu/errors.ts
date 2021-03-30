import { ForbiddenError, UserInputError } from "apollo-server-express";

export class AlreadySignedError extends UserInputError {
  constructor() {
    super("Cette signature a déjà été apposée.");
  }
}

export class SealedFieldsError extends ForbiddenError {
  constructor(fields) {
    super(
      `Des champs ont été vérouillés via signature et ne peuvent plus être modifiés: ${fields.join(
        ", "
      )}`
    );
  }
}
