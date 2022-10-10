import { CountBsdasrisFn } from "./bsdasri/count";
import { CreateBsdasriFn } from "./bsdasri/create";
import { DeleteBsdasriFn } from "./bsdasri/delete";
import { FindManyBsdasriFn } from "./bsdasri/findMany";
import { FindRelatedEntityFn } from "./bsdasri/findRelatedEntity";
import { FindUniqueBsdasriFn } from "./bsdasri/findUnique";
import { UpdateBsdasriFn } from "./bsdasri/update";
import { UpdateManyBsdasriFn } from "./bsdasri/updateMany";

export type BsdasriActions = {
  findUnique: FindUniqueBsdasriFn;
  findRelatedEntity: FindRelatedEntityFn;
  findMany: FindManyBsdasriFn;
  create: CreateBsdasriFn;
  update: UpdateBsdasriFn;
  updateMany: UpdateManyBsdasriFn;
  delete: DeleteBsdasriFn;
  count: CountBsdasrisFn;
};
