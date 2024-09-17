import { MutationResolvers } from "../../generated/graphql/types";
import createRndtsDeclarationDelegation from "./mutations/createRndtsDeclarationDelegation";
import revokeRndtsDeclarationDelegation from "./mutations/revokeRndtsDeclarationDelegation";

export type RndtsDeclarationDelegationMutationResolvers = Pick<
  MutationResolvers,
  "createRndtsDeclarationDelegation" | "revokeRndtsDeclarationDelegation"
>;

const Mutation: RndtsDeclarationDelegationMutationResolvers = {
  createRndtsDeclarationDelegation,
  revokeRndtsDeclarationDelegation
};

export default Mutation;
