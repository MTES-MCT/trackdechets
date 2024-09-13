import { RndtsDeclarationDelegationResolvers } from "../../generated/graphql/types";
import { statusResolver } from "./status";

const rndtsDeclarationDelegationResolvers: RndtsDeclarationDelegationResolvers =
  {
    status: statusResolver
  };

export default rndtsDeclarationDelegationResolvers;
