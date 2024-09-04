import { prisma } from "@td/prisma";
import { transactionWrapper } from "../../common/repository/helper";
import { BsvhuActions } from "./types";
import { buildFindUniqueBsvhu } from "./bsvhu/findUnique";
import { buildFindManyBsvhu } from "./bsvhu/findMany";
import { buildFindRelatedBsvhuEntity } from "./bsvhu/findRelatedEntity";
import { buildCountBsvhus } from "./bsvhu/count";

import { buildCreateBsvhu } from "./bsvhu/create";
import { buildDeleteBsvhu } from "./bsvhu/delete";
import { buildUpdateBsvhu } from "./bsvhu/update";
import { buildUpdateManyBsvhus } from "./bsvhu/updateMany";
import {
  RepositoryFnBuilder,
  RepositoryTransaction
} from "../../common/repository/types";

export type BsvhuRepository = BsvhuActions;
export function getReadonlyBsvhuRepository() {
  return {
    count: buildCountBsvhus({ prisma }),
    findUnique: buildFindUniqueBsvhu({ prisma }),
    findMany: buildFindManyBsvhu({ prisma }),
    findRelatedEntity: buildFindRelatedBsvhuEntity({ prisma })
  };
}

export function getBsvhuRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): BsvhuRepository {
  function useTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }

  return {
    ...getReadonlyBsvhuRepository(),
    create: useTransaction(buildCreateBsvhu),
    delete: useTransaction(buildDeleteBsvhu),
    update: useTransaction(buildUpdateBsvhu),
    updateMany: useTransaction(buildUpdateManyBsvhus)
  };
}
