import { prisma } from "@td/prisma";
import { buildCreateRegistryDelegation } from "./registryDelegation/create";
import { transactionWrapper } from "../../common/repository/helper";
import {
  RepositoryFnBuilder,
  RepositoryTransaction
} from "../../common/repository/types";
import { RegistryDelegationActions } from "./types";
import buildFindFirstRegistryDelegation from "./registryDelegation/findFirst";
import { buildUpdateRegistryDelegation } from "./registryDelegation/update";
import { buildCountRegistryDelegations } from "./registryDelegation/count";
import { buildFindManyRegistryDelegation } from "./registryDelegation/findMany";

export type RegistryDelegationRepository = RegistryDelegationActions;

export function getReadonlyRegistryDelegationRepository() {
  return {
    findFirst: buildFindFirstRegistryDelegation({ prisma }),
    count: buildCountRegistryDelegations({ prisma }),
    findMany: buildFindManyRegistryDelegation({ prisma })
  };
}

export function getRegistryDelegationRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): RegistryDelegationRepository {
  function useTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }

  return {
    ...getReadonlyRegistryDelegationRepository(),
    create: useTransaction(buildCreateRegistryDelegation),
    update: useTransaction(buildUpdateRegistryDelegation)
  };
}
