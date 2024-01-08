import { CountBspaohsFn } from "./bspaoh/count";
import { CreateBspaohFn } from "./bspaoh/create";
import { DeleteBspaohFn } from "./bspaoh/delete";
import { FindManyBspaohFn } from "./bspaoh/findMany";
import { FindRelatedEntityFn } from "./bspaoh/findRelatedEntity";
import { FindUniqueBspaohFn } from "./bspaoh/findUnique";
import { UpdateBspaohFn } from "./bspaoh/update";
import { UpdateManyBspaohFn } from "./bspaoh/updateMany";

export type BspaohActions = {
  findUnique: FindUniqueBspaohFn;
  findRelatedEntity: FindRelatedEntityFn;
  findMany: FindManyBspaohFn;
  create: CreateBspaohFn;
  update: UpdateBspaohFn;
  updateMany: UpdateManyBspaohFn;
  delete: DeleteBspaohFn;
  count: CountBspaohsFn;
};
