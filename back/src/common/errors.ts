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
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
}
