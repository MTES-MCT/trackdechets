import { eventTypes } from "../../common/eventTypes";
import { CreateBsffFn } from "./bsff/create";
import { FindManyBsffFn } from "./bsff/findMany";
import { FindPreviousPackagingsFn } from "./bsffPackaging/findPreviousPackagings";
import {
  FindUniqueBsffFn,
  FindUniqueBsffGetFicheInterventionsFn,
  FindUniqueBsffGetPackagingsFn
} from "./bsff/findUnique";
import { UpdateBsffFn } from "./bsff/update";
import { UpdateBsffPackagingFn } from "./bsffPackaging/update";
import { UpdateManyBsffPackagingsFn } from "./bsffPackaging/updateMany";
import { FindNextPackagingsFn } from "./bsffPackaging/findNextPackagings";
import { DeleteBsffFn } from "./bsff/delete";
import { CreateBsffFicheInterventionFn } from "./bsffFicheIntervention/create";
import { UpdateBsffFicheInterventionFn } from "./bsffFicheIntervention/update";
import { FindManyBsffFicheInterventionFn } from "./bsffFicheIntervention/findMany";
import { FindUniqueBsffFicheInterventionFn } from "./bsffFicheIntervention/findUnique";
import {
  FindUniqueBsffPackagingFn,
  FindUniqueBsffPackagingGetBsffFn,
  FindUniqueBsffPackagingGetNextPackagingFn
} from "./bsffPackaging/findUnique";
import { CountBsffPackagingFn } from "./bsffPackaging/count";
import { FindManyBsffPackagingsFn } from "./bsffPackaging/findMany";
import { CountBsffFn } from "./bsff/count";

export const bsffEventTypes: eventTypes = {
  created: "BsffCreated",
  updated: "BsffUpdated",
  deleted: "BsffDeleted",
  signed: "BsffSigned"
};

export const ficheInterventionEventTypes: Pick<
  eventTypes,
  "created" | "updated"
> = {
  created: "BsffFicheInterventionCreated",
  updated: "BsffFicheInterventionUpdated"
};

export type BsffActions = {
  count: CountBsffFn;
  findUnique: FindUniqueBsffFn;
  findUniqueGetPackagings: FindUniqueBsffGetPackagingsFn;
  findUniqueGetFicheInterventions: FindUniqueBsffGetFicheInterventionsFn;
  findMany: FindManyBsffFn;
  create: CreateBsffFn;
  updateBsff: UpdateBsffFn;
  delete: DeleteBsffFn;
};

export type BsffPackagingActions = {
  count: CountBsffPackagingFn;
  findUnique: FindUniqueBsffPackagingFn;
  findUniqueGetBsff: FindUniqueBsffPackagingGetBsffFn;
  findUniqueGetNextPackaging: FindUniqueBsffPackagingGetNextPackagingFn;
  findMany: FindManyBsffPackagingsFn;
  findPreviousPackagings: FindPreviousPackagingsFn;
  findNextPackagings: FindNextPackagingsFn;
  update: UpdateBsffPackagingFn;
  updateMany: UpdateManyBsffPackagingsFn;
};

export type BsffFicheInterventionActions = {
  findUnique: FindUniqueBsffFicheInterventionFn;
  findMany: FindManyBsffFicheInterventionFn;
  create: CreateBsffFicheInterventionFn;
  update: UpdateBsffFicheInterventionFn;
};
