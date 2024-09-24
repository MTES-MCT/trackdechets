import { CountBsvhusFn } from "./bsvhu/count";
import { CreateBsvhuFn } from "./bsvhu/create";
import { DeleteBsvhuFn } from "./bsvhu/delete";
import { FindManyBsvhuFn } from "./bsvhu/findMany";
import { FindRelatedEntityFn } from "./bsvhu/findRelatedEntity";

import { FindUniqueBsvhuFn } from "./bsvhu/findUnique";
import { UpdateBsvhuFn } from "./bsvhu/update";
import { UpdateManyBsvhuFn } from "./bsvhu/updateMany";

export type BsvhuActions = {
  findUnique: FindUniqueBsvhuFn;
  findMany: FindManyBsvhuFn;
  findRelatedEntity: FindRelatedEntityFn;
  create: CreateBsvhuFn;
  update: UpdateBsvhuFn;
  updateMany: UpdateManyBsvhuFn;
  delete: DeleteBsvhuFn;
  count: CountBsvhusFn;
};
