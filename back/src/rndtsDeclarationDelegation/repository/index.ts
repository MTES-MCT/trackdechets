import { prisma } from "@td/prisma";
import { buildCreateRndtsDeclarationDelegation } from "./rndtsDeclarationDelegation/create";
import { transactionWrapper } from "../../common/repository/helper";
import {
  RepositoryFnBuilder,
  RepositoryTransaction
} from "../../common/repository/types";
import { RndtsDeclarationDelegationActions } from "./types";
import { buildFindActiveRndtsDeclarationDelegation } from "./rndtsDeclarationDelegation/findActive";

export type RndtsDeclarationDelegationRepository =
  RndtsDeclarationDelegationActions;

export function getReadonlyRndtsDeclarationDelegationRepository() {
  return {
    findActive: buildFindActiveRndtsDeclarationDelegation({ prisma })
  };
}

export function getRndtsDeclarationDelegationRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): RndtsDeclarationDelegationRepository {
  function useTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }

  return {
    ...getReadonlyRndtsDeclarationDelegationRepository(),
    create: useTransaction(buildCreateRndtsDeclarationDelegation)
  };
}
