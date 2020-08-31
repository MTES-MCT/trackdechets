import { MutationResolvers } from "../../generated/graphql/types";
import createCompany from "./mutations/createCompany";
import renewSecurityCode from "./mutations/renewSecurityCode";
import updateCompany from "./mutations/updateCompany";

const Mutation: MutationResolvers = {
  createCompany,
  renewSecurityCode,
  updateCompany
};

export default Mutation;
