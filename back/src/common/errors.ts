import {
  ApolloError,
  AuthenticationError,
  UserInputError,
  ForbiddenError
} from "apollo-server-express";

/**
 * Apollo built-in error code
 * See https://www.apollographql.com/docs/apollo-server/data/errors/
 * This code is returned in the `extensions` part the GraphQL error
 */
export enum ErrorCode {
  GRAPHQL_PARSE_FAILED = "GRAPHQL_PARSE_FAILED",
  GRAPHQL_VALIDATION_FAILED = "GRAPHQL_VALIDATION_FAILED",
  UNAUTHENTICATED = "UNAUTHENTICATED",
  FORBIDDEN = "FORBIDDEN",
  BAD_USER_INPUT = "BAD_USER_INPUT",
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
}

export class TooManyRequestsError extends ApolloError {
  constructor(message: string, properties?: Record<string, any>) {
    super(message, "TOO_MANY_REQUESTS", properties);
    Object.defineProperty(this, "name", { value: "TooManyRequestsError" });
  }
}

export class NotLoggedIn extends AuthenticationError {
  constructor() {
    super("Vous n'êtes pas connecté.");
  }
}

export class MissingSiret extends UserInputError {
  constructor() {
    super("Le siret de l'entreprise concernée est requis.");
  }
}

export class MissingSirets extends UserInputError {
  constructor() {
    super("Les sirets des entreprises concernées sont requis.");
  }
}

export class NotCompanyAdmin extends ForbiddenError {
  constructor(siret: string) {
    super(
      `Vous n'êtes pas administrateur de l'entreprise portant le siret "${siret}".`
    );
  }
}

export class NotCompaniesAdmin extends ForbiddenError {
  constructor(sirets: string[]) {
    super(
      `Vous n'êtes pas administrateur d'une des entreprises portant le siret ${sirets
        .map(siret => `"${siret}"`)
        .join(", ")}.`
    );
  }
}

export class NotCompanyMember extends ForbiddenError {
  constructor(siret: string) {
    super(
      `Vous n'êtes pas membre de l'entreprise portant le siret "${siret}".`
    );
  }
}

export class InvalidDateTime extends UserInputError {
  constructor(field: string) {
    super(`Le format de date du champ ${field} est invalide.`);
  }
}
