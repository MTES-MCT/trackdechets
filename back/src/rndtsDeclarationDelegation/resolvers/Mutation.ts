import { MutationResolvers } from "../../generated/graphql/types";
import createRndtsDeclarationDelegation from "./mutations/createRndtsDeclarationDelegation";
import revokeRndtsDeclarationDelegation from "./mutations/revokeRndtsDeclarationDelegation";

const Mutation: MutationResolvers = {
  createRndtsDeclarationDelegation,
  revokeRndtsDeclarationDelegation
};

export default Mutation;
