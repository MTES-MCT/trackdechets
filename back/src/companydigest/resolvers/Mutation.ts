import createCompanyDigest from "./mutations/create";

import { MutationResolvers } from "../../generated/graphql/types";

const Mutation: MutationResolvers = {
  createCompanyDigest
};

export default Mutation;
