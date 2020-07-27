import { ApolloError } from "apollo-server-express";

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
