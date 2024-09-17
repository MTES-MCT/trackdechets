import { RndtsDeclarationDelegationResolvers } from "../../../generated/graphql/types";
import { delegateResolver } from "./delegate";
import { delegatorResolver } from "./delegator";
import { statusResolver } from "./status";

const rndtsDeclarationDelegationResolvers: RndtsDeclarationDelegationResolvers =
  {
    status: statusResolver,
    delegate: delegateResolver,
    delegator: delegatorResolver
  };

export default rndtsDeclarationDelegationResolvers;
