import { and } from "graphql-shield";

import { isCompanyAdmin, isAuthenticated } from "../common/rules";

export default {
  Query: {
    companyUsers: isCompanyAdmin,
    favorites: isAuthenticated
  },
  Mutation: {
    updateCompany: isCompanyAdmin,
    renewSecurityCode: isCompanyAdmin
  }
};
