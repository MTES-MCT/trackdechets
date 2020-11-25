import { GraphQLContext } from "../types";
import { NotLoggedIn } from "./errors";

export function checkIsAuthenticated(context: GraphQLContext): Express.User {
  if (!context.user) {
    throw new NotLoggedIn();
  }
  return context.user;
}
