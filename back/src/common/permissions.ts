import { GraphQLContext } from "../types";
import { NotAdmin, NotLoggedIn } from "./errors";

export function checkIsAuthenticated(context: GraphQLContext): Express.User {
  if (!context.user) {
    throw new NotLoggedIn();
  }
  return context.user;
}

export function checkIsAdmin(context: GraphQLContext): Express.User {
  const user = checkIsAuthenticated(context);
  if (!user.isAdmin) {
    throw new NotAdmin();
  }
  return user;
}
