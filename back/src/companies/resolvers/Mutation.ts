import { MutationResolvers } from "../../generated/graphql/types";
import createCompany from "./mutations/createCompany";
import renewSecurityCode from "./mutations/renewSecurityCode";

const Mutation: MutationResolvers = {
  createCompany,
  renewSecurityCode
};

export default Mutation;
