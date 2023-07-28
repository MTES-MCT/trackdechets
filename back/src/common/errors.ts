import { GraphQLError } from "graphql";

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
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  GRAPHQL_MAX_OPERATIONS_ERROR = "GRAPHQL_MAX_OPERATIONS_ERROR"
}

export class TDGraphQLError extends GraphQLError {}

export class ForbiddenError extends TDGraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: ErrorCode.FORBIDDEN
      }
    });
  }
}

export class AuthenticationError extends TDGraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: ErrorCode.UNAUTHENTICATED
      }
    });
  }
}

export class UserInputError extends TDGraphQLError {
  constructor(message: string, extensions?: Record<string, any>) {
    super(message, {
      extensions: {
        ...extensions,
        code: ErrorCode.BAD_USER_INPUT
      }
    });
  }
}

export class TooManyRequestsError extends TDGraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: ErrorCode.TOO_MANY_REQUESTS
      }
    });
  }
}

export class NotLoggedIn extends AuthenticationError {
  constructor() {
    super("Vous n'êtes pas connecté.");
  }
}

export class NotAdmin extends ForbiddenError {
  constructor() {
    super("Vous n'êtes pas administrateur");
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

export const NotCompanyAdminErrorMsg = (siret: string) =>
  `Vous n'êtes pas administrateur de l'entreprise portant le siret "${siret}".`;

export class NotCompanyAdmin extends ForbiddenError {
  constructor(siret: string) {
    super(NotCompanyAdminErrorMsg(siret));
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

export class SealedFieldError extends ForbiddenError {
  constructor(fields: string[]) {
    super(
      `Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : ${fields.join(
        ", "
      )}`
    );
  }
}

export class InvaliSecurityCode extends ForbiddenError {
  constructor() {
    super("Le code de signature est invalide.");
  }
}
