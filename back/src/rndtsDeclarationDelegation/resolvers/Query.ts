import { QueryResolvers } from "../../generated/graphql/types";
import rndtsDeclarationDelegation from "./queries/rndtsDeclarationDelegation";
import rndtsDeclarationDelegations from "./queries/rndtsDeclarationDelegations";

export type RndtsDeclarationDelegationQueryResolvers = Pick<
  QueryResolvers,
  "rndtsDeclarationDelegation" | "rndtsDeclarationDelegations"
>;

const Query: RndtsDeclarationDelegationQueryResolvers = {
  rndtsDeclarationDelegation,
  rndtsDeclarationDelegations
};

export default Query;
