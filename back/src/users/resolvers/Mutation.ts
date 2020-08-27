import { MutationResolvers } from "../../generated/graphql/types";
import signup from "./mutations/signup";
import changePassword from "./mutations/changePassword";

const Mutation: MutationResolvers = {
  signup,
  changePassword
};

export default Mutation;
