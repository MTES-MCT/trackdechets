import { MutationResolvers } from "../../generated/graphql/types";
import signup from "./mutations/signup";
import login from "./mutations/login";
import changePassword from "./mutations/changePassword";
import createPasswordResetRequest from "./mutations/createPasswordResetRequest";
import resendActivationEmail from "./mutations/resendActivationEmail";
import editProfile from "./mutations/editProfile";
import inviteUserToCompany from "./mutations/inviteUserToCompany";
import deleteInvitation from "./mutations/deleteInvitation";
import resendInvitation from "./mutations/resendInvitation";
import joinWithInvite from "./mutations/joinWithInvite";
import removeUserFromCompany from "./mutations/removeUserFromCompany";
import sendMembershipRequest from "./mutations/sendMembershipRequest";
import acceptMembershipRequest from "./mutations/acceptMembershipRequest";
import refuseMembershipRequest from "./mutations/refuseMembershipRequest";
import revokeAuthorizedApplication from "./mutations/revokeAuthorizedApplication";
import revokeAccessToken from "./mutations/revokeAccessToken";
import createAccessToken from "./mutations/createAccessToken";
import revokeAllAccessTokens from "./mutations/revokeAllAccessTokens";
import resetPassword from "./mutations/resetPassword";
import anonymizeUser from "./mutations/anonymizeUser";

const Mutation: MutationResolvers = {
  signup,
  login,
  changePassword,
  createPasswordResetRequest,
  resetPassword,
  editProfile,
  anonymizeUser,
  inviteUserToCompany,
  deleteInvitation,
  resendInvitation,
  joinWithInvite,
  removeUserFromCompany,
  sendMembershipRequest,
  acceptMembershipRequest,
  refuseMembershipRequest,
  resendActivationEmail,
  revokeAuthorizedApplication,
  revokeAccessToken,
  createAccessToken,
  revokeAllAccessTokens
};

export default Mutation;
