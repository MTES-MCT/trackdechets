import { UserInputError } from "apollo-server-express";

export class BsdasriNotFound extends UserInputError {
  constructor(id: string) {
    super(`Le bordereau avec l'identifiant "${id}" n'existe pas.`);
  }
}

export class BsdasriGroupingParameterError extends UserInputError {
  constructor() {
    super(
      "Un dasri ne peut pas être à la fois bordereau de synthèse et de regroupement. Un dasri ne peut avoir les champs `regroupedBsdasris` et `synthesizedBsdasris` renseignés simultanément."
    );
  }
}
