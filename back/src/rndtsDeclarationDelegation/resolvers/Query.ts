import { QueryResolvers } from "../../generated/graphql/types";
import rndtsDeclarationDelegation from "./queries/rndtsDeclarationDelegation";

export type RndtsDeclarationDelegationQueryResolvers = Pick<
  QueryResolvers,
  "rndtsDeclarationDelegation"
>;

const Query: RndtsDeclarationDelegationQueryResolvers = {
  rndtsDeclarationDelegation
};

export default Query;
