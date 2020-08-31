import { MutationResolvers } from "../../generated/graphql/types";
import createCompany from "./mutations/createCompany";
import renewSecurityCode from "./mutations/renewSecurityCode";
import updateCompany from "./mutations/updateCompany";
import createUploadLink from "./mutations/createUploadLink";

const Mutation: MutationResolvers = {
  createCompany,
  renewSecurityCode,
  updateCompany,
  createUploadLink
};

export default Mutation;
