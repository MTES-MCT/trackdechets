import { isAuthenticated, isCompanyAdmin } from "../common/rules";

export default {
  Query: {
    me: isAuthenticated,
    apiKey: isAuthenticated
  },
  Mutation: {
    changePassword: isAuthenticated,
    editProfile: isAuthenticated,
    inviteUserToCompany: isCompanyAdmin,
    resendInvitation: isCompanyAdmin,
    removeUserFromCompany: isCompanyAdmin,
    deleteInvitation: isCompanyAdmin
  }
};
