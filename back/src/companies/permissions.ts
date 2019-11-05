import { and } from "graphql-shield";

import { isCompanyAdmin, isAuthenticated } from "../common/rules";

export default {
  Mutation: {
    updateCompany: and(isAuthenticated, isCompanyAdmin)
  }
};
