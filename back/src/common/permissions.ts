import { GraphQLContext } from "../types";
import { NotLoggedIn } from "./errors";

type Permission = (context: GraphQLContext) => void;

export const isAuthenticated: Permission = context => {
  if (!context.user) {
    throw new NotLoggedIn();
  }
};

export function checkPermissions(
  permissions: Permission[],
  context: GraphQLContext
) {
  for (const permission of permissions) {
    permission(context);
  }
}
