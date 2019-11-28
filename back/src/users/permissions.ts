import { and } from "graphql-shield";

import { isAuthenticated, isCompanyAdmin } from "../common/rules";

export default {
  Query: {
    me: isAuthenticated,
    apiKey: isAuthenticated
  },
  Mutation: {
    changePassword: isAuthenticated,
    editProfile: isAuthenticated,
    inviteUserToCompany: and(isAuthenticated, isCompanyAdmin),
    removeUserFromCompany: and(isAuthenticated, isCompanyAdmin)
  }
};
