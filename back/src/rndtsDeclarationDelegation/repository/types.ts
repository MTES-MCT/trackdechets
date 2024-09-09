import { CreateRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/create";
import { FindActiveRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/findActive";

export type RndtsDeclarationDelegationActions = {
  findActive: FindActiveRndtsDeclarationDelegationFn;

  create: CreateRndtsDeclarationDelegationFn;
};
