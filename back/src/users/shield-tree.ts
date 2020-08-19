import {
  isAuthenticated,
  isAuthenticatedFromUI,
  isCompanyAdmin
} from "../common/rules";
import { signupSchema } from "./rules/schema";
import { chain } from "graphql-shield";

export default {
  Query: {
    me: isAuthenticated,
    apiKey: isAuthenticatedFromUI
  },
  Mutation: {
    changePassword: isAuthenticatedFromUI,
    editProfile: isAuthenticatedFromUI,
    inviteUserToCompany: chain(isAuthenticatedFromUI, isCompanyAdmin),
    resendInvitation: chain(isAuthenticatedFromUI, isCompanyAdmin),
    removeUserFromCompany: chain(isAuthenticatedFromUI, isCompanyAdmin),
    deleteInvitation: chain(isAuthenticatedFromUI, isCompanyAdmin),
    signup: signupSchema
  }
};
