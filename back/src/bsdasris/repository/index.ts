import { prisma } from "@td/prisma";
import { transactionWrapper } from "../../common/repository/helper";
import { BsdasriActions } from "./types";
import { buildFindUniqueBsdasri } from "./bsdasri/findUnique";
import { buildFindManyBsdasri } from "./bsdasri/findMany";
import { buildCountBsdasris } from "./bsdasri/count";
import { buildFindRelatedBsdasriEntity } from "./bsdasri/findRelatedEntity";
import { buildCreateBsdasri } from "./bsdasri/create";
import { buildDeleteBsdasri } from "./bsdasri/delete";
import { buildUpdateBsdasri } from "./bsdasri/update";
import { buildUpdateManyBsdasris } from "./bsdasri/updateMany";
import {
  RepositoryFnBuilder,
  RepositoryTransaction
} from "../../common/repository/types";

export type BsdasriRepository = BsdasriActions;
export function getReadonlyBsdasriRepository() {
  return {
    count: buildCountBsdasris({ prisma }),
    findUnique: buildFindUniqueBsdasri({ prisma }),
    findMany: buildFindManyBsdasri({ prisma }),
    findRelatedEntity: buildFindRelatedBsdasriEntity({ prisma })
  };
}

export function getBsdasriRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): BsdasriRepository {
  function useTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }

  return {
    ...getReadonlyBsdasriRepository(),
    create: useTransaction(buildCreateBsdasri),
    delete: useTransaction(buildDeleteBsdasri),
    update: useTransaction(buildUpdateBsdasri),
    updateMany: useTransaction(buildUpdateManyBsdasris)
  };
}
