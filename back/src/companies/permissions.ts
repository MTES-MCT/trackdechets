import { and } from "graphql-shield";

import { isCompanyAdmin, isAuthenticated } from "../common/rules";

export default {
  Query: {
    favorites: isAuthenticated
  },
  Mutation: {
    updateCompany: isCompanyAdmin
    //renewSecurityCode: isCompanyAdmin
  }
};
