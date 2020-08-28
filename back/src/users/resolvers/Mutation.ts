import { MutationResolvers } from "../../generated/graphql/types";
import signup from "./mutations/signup";
import changePassword from "./mutations/changePassword";
import editProfile from "./mutations/editProfile";
import login from "./mutations/login";
import inviteUserToCompany from "./mutations/inviteUserToCompany";
import joinWithInvite from "./mutations/joinWithInvite";

const Mutation: MutationResolvers = {
  signup,
  changePassword,
  editProfile,
  login,
  inviteUserToCompany,
  joinWithInvite
};

export default Mutation;
