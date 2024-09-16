import { prisma } from "@td/prisma";
import { buildCreateRndtsDeclarationDelegation } from "./rndtsDeclarationDelegation/create";
import { transactionWrapper } from "../../common/repository/helper";
import {
  RepositoryFnBuilder,
  RepositoryTransaction
} from "../../common/repository/types";
import { RndtsDeclarationDelegationActions } from "./types";
import buildFindFirstRndtsDeclarationDelegation from "./rndtsDeclarationDelegation/findFirst";
import { buildUpdateRndtsDeclarationDelegation } from "./rndtsDeclarationDelegation/update";
import { buildCountRndtsDeclarationDelegations } from "./rndtsDeclarationDelegation/count";
import { buildFindManyRndtsDeclarationDelegation } from "./rndtsDeclarationDelegation/findMany";

export type RndtsDeclarationDelegationRepository =
  RndtsDeclarationDelegationActions;

export function getReadonlyRndtsDeclarationDelegationRepository() {
  return {
    findFirst: buildFindFirstRndtsDeclarationDelegation({ prisma }),
    count: buildCountRndtsDeclarationDelegations({ prisma }),
    findMany: buildFindManyRndtsDeclarationDelegation({ prisma })
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
    create: useTransaction(buildCreateRndtsDeclarationDelegation),
    update: useTransaction(buildUpdateRndtsDeclarationDelegation)
  };
}
