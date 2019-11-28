import { and } from "graphql-shield";

import { isCompanyAdmin, isAuthenticated } from "../common/rules";

export default {
  Query: {
    companyUsers: and(isAuthenticated, isCompanyAdmin),
    favorites: isAuthenticated
  },
  Mutation: {
    updateCompany: and(isAuthenticated, isCompanyAdmin),
    renewSecurityCode: and(isAuthenticated, isCompanyAdmin)
  }
};
