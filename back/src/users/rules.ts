import { rule, shield } from "graphql-shield";
import { getUserId } from "../utils";

const rules = {
  isAuthenticatedUser: rule()((parent, args, context) => {
    const userId = getUserId(context);
    return Boolean(userId);
  })
};

export default {
  Query: {
    me: rules.isAuthenticatedUser
  },
  Mutation: {
    changePassword: rules.isAuthenticatedUser
  }
};
