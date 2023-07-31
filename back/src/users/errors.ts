import { UserInputError } from "../common/errors";

export class MembershipRequestAlreadyAccepted extends UserInputError {
  constructor() {
    super(
      "Cette demande de rattachement a déjà été acceptée par un autre administrateur"
    );
  }
}

export class MembershipRequestAlreadyRefused extends UserInputError {
  constructor() {
    super(
      "Cette demande de rattachement a déjà été refusée par un autre administrateur"
    );
  }
}
