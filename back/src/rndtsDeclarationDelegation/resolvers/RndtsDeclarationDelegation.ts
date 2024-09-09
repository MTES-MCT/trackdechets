import { RndtsDeclarationDelegationResolvers } from "../../generated/graphql/types";
import { isActiveResolver } from "./isActive";

const rndtsDeclarationDelegationResolvers: RndtsDeclarationDelegationResolvers =
  {
    isActive: isActiveResolver
  };

export default rndtsDeclarationDelegationResolvers;
