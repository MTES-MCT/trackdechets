import { prisma } from "@td/prisma";
import { transactionWrapper } from "../../common/repository/helper";
import {
  BsffActions,
  BsffFicheInterventionActions,
  BsffPackagingActions
} from "./types";
import { CreateBsffFn, buildCreateBsff } from "./bsff/create";
import { UpdateBsffFn, buildUpdateBsff } from "./bsff/update";
import { buildUpdateBsffPackaging } from "./bsffPackaging/update";
import {
  PrismaTransaction,
  RepositoryFnBuilder,
  RepositoryTransaction
} from "../../common/repository/types";
import { buildUpdateManyBsffPackagings } from "./bsffPackaging/updateMany";
import { buildFindManyBsff } from "./bsff/findMany";
import { buildFindPreviousPackagings } from "./bsffPackaging/findPreviousPackagings";
import {
  buildFinduniqueBsff,
  buildFindUniqueBsffGetFicheInterventions,
  buildFindUniqueBsffGetPackagings
} from "./bsff/findUnique";
import { buildFindNextPackagings } from "./bsffPackaging/findNextPackagings";
import { DeleteBsffFn, buildDeleteBsff } from "./bsff/delete";
import { buildCreateBsffFicheIntervention } from "./bsffFicheIntervention/create";
import { buildUpdateBsffFicheIntervention } from "./bsffFicheIntervention/update";
import { buildFindManyBsffFicheIntervention } from "./bsffFicheIntervention/findMany";
import { buildFinduniqueBsffFicheIntervention } from "./bsffFicheIntervention/findUnique";
import {
  buildFindUniqueBsffPackaging,
  buildFindUniqueBsffPackagingGetBsff,
  buildFindUniqueBsffPackagingGetNextPackaging
} from "./bsffPackaging/findUnique";
import { buildCountBsffPackaging } from "./bsffPackaging/count";
import { buildFindManyBsffPackagings } from "./bsffPackaging/findMany";
import { buildCountBsff } from "./bsff/count";

export type BsffRepository = BsffActions;
export type BsffPackagingRepository = BsffPackagingActions;
export type BsffFicheInterventionRepository = BsffFicheInterventionActions;

export function getReadonlyBsffRepository(transaction?: PrismaTransaction) {
  const deps = { prisma: transaction ?? prisma };
  return {
    count: buildCountBsff(deps),
    findUnique: buildFinduniqueBsff(deps),
    findUniqueGetPackagings: buildFindUniqueBsffGetPackagings(deps),
    findUniqueGetFicheInterventions:
      buildFindUniqueBsffGetFicheInterventions(deps),
    findMany: buildFindManyBsff(deps)
  };
}

export function getReadonlyBsffPackagingRepository(
  transaction?: PrismaTransaction
) {
  const deps = { prisma: transaction ?? prisma };
  return {
    count: buildCountBsffPackaging(deps),
    findUnique: buildFindUniqueBsffPackaging(deps),
    findUniqueGetBsff: buildFindUniqueBsffPackagingGetBsff(deps),
    findUniqueGetNextPackaging:
      buildFindUniqueBsffPackagingGetNextPackaging(deps),
    findMany: buildFindManyBsffPackagings(deps),
    findPreviousPackagings: buildFindPreviousPackagings(deps),
    findNextPackagings: buildFindNextPackagings(deps)
  };
}

export function getReadonlyBsffFicheInterventionRepository(
  transaction?: PrismaTransaction
) {
  const deps = { prisma: transaction ?? prisma };
  return {
    findUnique: buildFinduniqueBsffFicheIntervention(deps),
    findMany: buildFindManyBsffFicheIntervention(deps)
  };
}

export function getBsffRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): BsffRepository {
  function useTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }
  return {
    ...getReadonlyBsffRepository(transaction),
    create: useTransaction(buildCreateBsff) as CreateBsffFn,
    updateBsff: useTransaction(buildUpdateBsff) as UpdateBsffFn,
    delete: useTransaction(buildDeleteBsff) as DeleteBsffFn
  };
}

export function getBsffPackagingRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): BsffPackagingRepository {
  function useTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }
  return {
    ...getReadonlyBsffPackagingRepository(transaction),
    update: useTransaction(buildUpdateBsffPackaging),
    updateMany: useTransaction(buildUpdateManyBsffPackagings)
  };
}

export function getBsffFicheInterventionRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): BsffFicheInterventionRepository {
  function useTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }
  return {
    ...getReadonlyBsffFicheInterventionRepository(transaction),
    create: useTransaction(buildCreateBsffFicheIntervention),
    update: useTransaction(buildUpdateBsffFicheIntervention)
  };
}
