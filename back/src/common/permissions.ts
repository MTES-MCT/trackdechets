import { GraphQLContext } from "../types";
import { NotLoggedIn } from "./errors";
import { User } from "@prisma/client";

export function checkIsAuthenticated(context: GraphQLContext): User {
  if (!context.user) {
    throw new NotLoggedIn();
  }
  return context.user;
}
