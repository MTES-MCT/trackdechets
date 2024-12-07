import type { MutationResolvers } from "@td/codegen-back";
import signup from "./mutations/signup";
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
import changeUserRole from "./mutations/changeUserRole";
import subscribeToCompanyNotifications from "./mutations/subscribeToCompanyNotifications";
import subscribeToNotifications from "./mutations/subscribeToNotifications";

const Mutation: MutationResolvers = {
  signup,
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
  revokeAllAccessTokens,
  changeUserRole,
  subscribeToCompanyNotifications,
  subscribeToNotifications
};

export default Mutation;
