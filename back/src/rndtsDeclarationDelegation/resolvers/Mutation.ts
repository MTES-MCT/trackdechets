import { MutationResolvers } from "../../generated/graphql/types";
import createRndtsDeclarationDelegation from "./mutations/createRndtsDeclarationDelegation";

const Mutation: MutationResolvers = {
  createRndtsDeclarationDelegation
};

export default Mutation;
