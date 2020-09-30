import { UserInputError } from "apollo-server-express";

export class InvitationRequestAlreadyAccepted extends UserInputError {
  constructor() {
    super(
      "Cette demande de rattachement a déjà été acceptée par un autre administrateur"
    );
  }
}

export class InvitationRequestAlreadyRefused extends UserInputError {
  constructor() {
    super(
      "Cette demande de rattachement a déjà été refusée par un autre administrateur"
    );
  }
}
