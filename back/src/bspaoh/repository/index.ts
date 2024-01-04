import { prisma } from "@td/prisma";
import { transactionWrapper } from "../../common/repository/helper";
import { BspaohActions } from "./types";
import { buildFindUniqueBspaoh } from "./bspaoh/findUnique";
import { buildFindManyBspaoh } from "./bspaoh/findMany";
import { buildCountBspaohs } from "./bspaoh/count";
import { buildFindRelatedBspaohEntity } from "./bspaoh/findRelatedEntity";
import { buildCreateBspaoh } from "./bspaoh/create";
import { buildDeleteBspaoh } from "./bspaoh/delete";
import { buildUpdateBspaoh } from "./bspaoh/update";
import { buildUpdateManyBspaohs } from "./bspaoh/updateMany";
import {
  RepositoryFnBuilder,
  RepositoryTransaction
} from "../../common/repository/types";

export type BspaohRepository = BspaohActions;
export function getReadonlyBspaohRepository() {
  return {
    count: buildCountBspaohs({ prisma }),
    findUnique: buildFindUniqueBspaoh({ prisma }),
    findMany: buildFindManyBspaoh({ prisma }),
    findRelatedEntity: buildFindRelatedBspaohEntity({ prisma })
  };
}

export function getBspaohRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): BspaohRepository {
  function useTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }

  return {
    ...getReadonlyBspaohRepository(),
    create: useTransaction(buildCreateBspaoh),
    delete: useTransaction(buildDeleteBspaoh),
    update: useTransaction(buildUpdateBspaoh),
    updateMany: useTransaction(buildUpdateManyBspaohs)
  };
}
