import createCompanyDigest from "./mutations/create";

import type { MutationResolvers } from "@td/codegen-back";

const Mutation: MutationResolvers = {
  createCompanyDigest
};

export default Mutation;
